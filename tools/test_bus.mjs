// node tools/test_bus.mjs — the live bus (assets/js/core/bus.js) without a network: a fake relay records what is
// published, and messages are handed to receive() as a relay would deliver them.
import assert from 'node:assert/strict';
import { Bus } from '../assets/js/core/bus.js';
import { roomKeys, sealBytes } from '../assets/js/core/crypto.js';
import { utf8 } from '../assets/js/core/util.js';

let n = 0;
const test = async (name, fn) => { await fn(); n++; console.log(`ok ${n} ${name}`); };
const tick = () => new Promise((r) => setTimeout(r, 20));

// decrypts done (each relay's copy of a message used to be opened again)
let opened = 0;
const decrypt = crypto.subtle.decrypt.bind(crypto.subtle);
crypto.subtle.decrypt = (...a) => { opened++; return decrypt(...a); };

async function setup(relays = 1) {
  const bus = new Bus({ brokers: [], name: 'Test' });
  const sent = [];
  const trs = [];
  for (let idx = 0; idx < relays; idx++) {
    const tr = { idx, url: `fake${idx}`, bursts: new Map(), chain: Promise.resolve(), client: { state: 'online', publish: (topic, bytes, o) => sent.push({ relay: idx, topic, bytes, retain: o.retain }), subscribe() {}, unsubscribe() {} } };
    bus.transports.push(tr);
    trs.push(tr);
  }
  const keys = await roomKeys('test-secret', 'table');
  bus.addRoom('table', keys);
  const events = [];
  bus.on((ev) => { if (ev.type === 'obj' || ev.type === 'msg') events.push(ev); });
  return { bus, sent, tr: trs[0], trs, keys, events, room: bus.rooms.get('table') };
}
const sealed = async (keys, env) => sealBytes(keys.key, utf8.encode(JSON.stringify(env)));

await test('entries by prefix read the index, and match a full walk', async () => {
  const { bus } = await setup();
  bus.put('table', 'fog.s1.a', { v: 1 });
  bus.put('table', 'fog.s2.b', { v: 2 });
  bus.put('table', 'fog.s1.c', { v: 3 });
  bus.put('table', 'item.x', { v: 4 });
  bus.put('table', 'items.y', { v: 5 }); // not under 'item.'
  bus.put('table', 'meta', { v: 6 });
  bus.put('table', 'fog.s1.c', null); // deleted: a tombstone, not listed
  const keys = (p) => bus.entries('table', p).map(([k]) => k);
  assert.deepEqual(keys('fog.s1.'), ['fog.s1.a']);
  assert.deepEqual(keys('fog.'), ['fog.s1.a', 'fog.s2.b']);
  assert.deepEqual(keys('item.'), ['item.x']);
  assert.deepEqual(keys('fog.s'), ['fog.s1.a', 'fog.s2.b']); // not ending at a dot: narrowed, then filtered
  assert.deepEqual(keys('ite'), ['item.x', 'items.y']); // no dot: the whole room
  assert.deepEqual(keys(''), ['fog.s1.a', 'fog.s2.b', 'item.x', 'items.y', 'meta']);
  assert.deepEqual(keys('nope.'), []);
  bus.put('table', 'fog.s1.c', { v: 7 }); // back again
  assert.deepEqual(keys('fog.s1.'), ['fog.s1.a', 'fog.s1.c']);
});

await test('purged tombstones leave the index', async () => {
  const { bus, room } = await setup();
  bus.put('table', 'fog.s1.a', { v: 1 });
  bus.put('table', 'fog.s1.a', null);
  room.objects.get('fog.s1.a').t[0] -= 10_000;
  assert.equal(bus.purge('table', 1000), 1);
  assert.equal(room.index.get('fog.s1.').size, 0);
  assert.deepEqual(bus.entries('table', 'fog.s1.'), []);
});

await test('a write overtaken before it went out is not sent (a drag sends its newest step)', async () => {
  const { bus, sent } = await setup();
  for (let x = 0; x < 6; x++) bus.put('table', 'pct.s1.sera', { x, y: 0 });
  await tick();
  const mine = sent.filter((s) => s.topic.endsWith('/o/pct.s1.sera'));
  assert.equal(mine.length, 1);
  bus.put('table', 'pct.s1.sera', { x: 9, y: 0 });
  await tick();
  assert.equal(sent.filter((s) => s.topic.endsWith('/o/pct.s1.sera')).length, 2);
  assert.equal(bus.get('table', 'pct.s1.sera').x, 9);
});

await test('our own echoes and other relays’ copies are not opened again', async () => {
  const { bus, sent, tr, keys, events } = await setup();
  bus.put('table', 'it.c1', { x: 1 });
  await tick();
  const echo = sent.find((s) => s.topic.endsWith('/o/it.c1'));
  opened = 0;
  for (let i = 0; i < 3; i++) await bus.receive(tr, echo.topic, echo.bytes, false); // three relays echo it back
  assert.equal(opened, 0);
  assert.equal(events.filter((e) => !e.local).length, 0);
  // someone else's write, from three relays: opened once, applied once
  const env = { k: 'it.c2', t: [Date.now() + 5, 'other'], by: 'DM', d: { x: 2 } };
  const bytes = await sealBytes(keys.key, utf8.encode(JSON.stringify(env)));
  const topic = `cr1/${keys.id}/o/it.c2`;
  for (let i = 0; i < 3; i++) await bus.receive(tr, topic, bytes, false);
  assert.equal(opened, 1);
  assert.equal(events.filter((e) => e.key === 'it.c2').length, 1);
  assert.equal(bus.get('table', 'it.c2').x, 2);
});

await test('a snapshot copy we already hold still counts as that relay’s (no re-send after it)', async () => {
  const { bus, sent, tr, keys, room } = await setup();
  const env = { k: 'pin.p1', t: [Date.now(), 'other'], by: 'Jun', d: { text: 'here' } };
  const bytes = await sealBytes(keys.key, utf8.encode(JSON.stringify(env)));
  const topic = `cr1/${keys.id}/o/pin.p1`;
  await bus.receive(tr, topic, bytes, false); // live, from another relay first
  bus.startBurst(tr, room); // this relay connects: its snapshot follows
  opened = 0;
  await bus.receive(tr, topic, bytes, true);
  assert.equal(opened, 0);
  assert.ok(tr.bursts.get('table').keys.has('pin.p1'));
  tr.bursts.get('table').done = true;
  assert.equal(sent.length, 0);
});

await test('transient messages: our own and duplicates dropped unopened, others delivered once', async () => {
  const { bus, sent, tr, keys, events } = await setup();
  bus.send('table', 'ping', { x: 1 });
  await tick();
  const mine = sent.find((s) => s.topic.endsWith('/x/ping'));
  opened = 0;
  for (let i = 0; i < 3; i++) await bus.receive(tr, mine.topic, mine.bytes, false);
  assert.equal(opened, 0);
  assert.equal(events.length, 0);
  const msg = { c: 'ping', i: 'abc123', f: 'other', by: 'Jun', d: { x: 5 } };
  const bytes = await sealBytes(keys.key, utf8.encode(JSON.stringify(msg)));
  for (let i = 0; i < 3; i++) await bus.receive(tr, `cr1/${keys.id}/x/ping`, bytes, false);
  assert.equal(opened, 1);
  assert.equal(events.filter((e) => e.type === 'msg').length, 1);
});

await test('three relays’ copies arriving together: opened once', async () => {
  const { bus, trs, keys, events } = await setup(3);
  const bytes = await sealed(keys, { k: 'it.c5', t: [Date.now() + 5, 'other'], by: 'DM', d: { x: 5 } });
  opened = 0;
  await Promise.all(trs.map((t) => bus.receive(t, `cr1/${keys.id}/o/it.c5`, bytes, false)));
  assert.equal(opened, 1);
  assert.equal(events.filter((e) => e.key === 'it.c5').length, 1);
  const ping = await sealed(keys, { c: 'ping', i: 'p9', f: 'other', by: 'Jun', d: {} });
  opened = 0;
  await Promise.all(trs.map((t) => bus.receive(t, `cr1/${keys.id}/x/ping`, ping, false)));
  assert.equal(opened, 1);
  assert.equal(events.filter((e) => e.type === 'msg').length, 1);
});

await test('an old copy kept by every relay: each one is healed, though only one copy was opened', async () => {
  const { bus, sent, trs, keys } = await setup(3);
  const old = await sealed(keys, { k: 'scene.s1', t: [Date.now() - 60_000, 'dm'], by: 'DM', d: { name: 'Old' } });
  bus.put('table', 'scene.s1', { name: 'New' }); // ours is newer
  await tick();
  sent.length = 0;
  opened = 0;
  await Promise.all(trs.map((t) => bus.receive(t, `cr1/${keys.id}/o/scene.s1`, old, true)));
  assert.equal(opened, 1);
  await new Promise((r) => setTimeout(r, 2000)); // heals go out after a random pause
  assert.deepEqual(sent.filter((x) => x.topic.endsWith('/o/scene.s1')).map((x) => x.relay).sort(), [0, 1, 2]);
  assert.equal(bus.get('table', 'scene.s1').name, 'New');
});

await test('a tampered copy is ignored', async () => {
  const { bus, tr, keys } = await setup();
  const env = { k: 'it.c3', t: [Date.now(), 'other'], by: 'DM', d: { x: 3 } };
  const bytes = await sealBytes(keys.key, utf8.encode(JSON.stringify(env)));
  bytes[bytes.length - 1] ^= 1;
  await bus.receive(tr, `cr1/${keys.id}/o/it.c3`, bytes, false);
  assert.equal(bus.get('table', 'it.c3'), undefined);
});

console.log(`\n${n} tests passed`);
process.exit(0);
