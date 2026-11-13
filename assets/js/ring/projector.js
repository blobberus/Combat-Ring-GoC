// The DM's client publishes the players' view: after any change in the DM room it projects the live scene
// (model.js project) and writes the difference to the table room. Moving one creature takes the fast path (just that
// item); anything else re-projects everything. Images the live scene or slideshow needs get a public copy first.
// It runs right after the change that asks for it (straight off the bus, in a message-channel task: not held for the
// next frame, and not slowed down like timers in a background tab); only a full projection asked for by a burst of
// remote changes (a relay's snapshot, a restore) waits a moment to take them together.
// It also applies players' requests that need the DM's state (moving a prop the DM marked movable).
import { world } from './world.js';
import { project, diffProjection, publicItem, projectItemMedia, initiativeEntry, makeMediaRef, oneLayer, K, keyTail } from './model.js';
import { publishMedia } from './media.js';
import { toast } from '../core/ui.js';

let unsub = null;
let timer = 0;
let soon = false;
let full = true;
let relays = 0;
const items = new Set();
const tick = new MessageChannel();
tick.port1.onmessage = () => { soon = false; run(); };

export function startProjector() {
  stopProjector();
  unsub = world.bus.on((ev) => {
    if (ev.type === 'obj') {
      if (ev.room !== 'dm' || ev.key.startsWith('folder.') || ev.key === 'recent') return; // the map library: nothing players see
      if (ev.key.startsWith('item.')) items.add(keyTail(ev.key));
      else full = true;
      schedule(!ev.local);
    } else if (ev.type === 'room' || (ev.type === 'status' && ev.online !== relays)) { // a room joined, a relay came or went
      if (ev.type === 'status') relays = ev.online;
      full = true;
      schedule(true);
    } else if (ev.type === 'msg' && ev.room === 'table' && ev.channel === 'req') handleRequest(ev);
  });
  full = true;
  schedule(false);
}

export function stopProjector() {
  unsub?.(); unsub = null;
  clearTimeout(timer); timer = 0;
}

function schedule(remote) {
  if (full && remote) { if (!timer) timer = setTimeout(run, 40); return; }
  if (!soon) { soon = true; tick.port2.postMessage(0); }
}

function apply(changes) {
  for (const [k, v] of changes) world.bus.put('table', k, v);
}

function run() {
  clearTimeout(timer);
  timer = 0;
  if (!world.dm) return;
  if (full) {
    full = false;
    items.clear();
    const dm = new Map(world.bus.entries('dm'));
    const next = project(dm);
    apply(diffProjection(world.tList(''), next));
    ensureMedia(dm);
    return;
  }
  // fast path: only items changed (read just what they need: the whole campaign is in the DM's room)
  const get = (k) => world.bus.get('dm', k) ?? null;
  const live = get('dmeta')?.live;
  const blackout = !!get('dmeta')?.blackout;
  const scene = live ? get(K.scene(live)) : null;
  const fogOn = scene?.fogOn !== false;
  const shapes = live ? oneLayer(world.bus.entries('dm', `fog.${live}.`).map(([, v]) => v)) : [];
  const mediaRef = makeMediaRef(get);
  const changes = [];
  for (const id of items) {
    const it = get(K.item(id));
    let p = null;
    if (it && live && !blackout && it.scene === live) {
      p = publicItem(it, { fogShapes: shapes, fogOn });
      if (p) projectItemMedia(p, it, mediaRef);
    }
    const shown = world.t(K.ini(`dm-${id}`));
    const ini = it && p ? initiativeEntry(id, it, p, shown?.tie ?? null) : null;
    const listChanged = !shown !== !ini || (shown && ini && shown.value !== ini.value); // the tie ranks may change
    if (listChanged) full = true;
    for (const [k, v] of listChanged ? [[K.pub(id), p]] : [[K.pub(id), p], [K.ini(`dm-${id}`), ini]]) {
      const cur = world.t(k);
      if (v == null) { if (cur != null) changes.push([k, null]); } else if (JSON.stringify(cur) !== JSON.stringify(v)) changes.push([k, v]);
    }
    if (p && it.media && !get(K.media(it.media))?.pub) publishMedia(it.media).catch((e) => console.warn(e)); // only art players see
  }
  items.clear();
  apply(changes);
  if (full) schedule(false); // an initiative line came, went or moved: the full projection re-ranks the list
}

/** Give the live scene's map, its items' art and the shown slides a public copy. */
function ensureMedia(dm) {
  const get = (k) => dm.get(k) ?? null;
  const dmeta = get('dmeta') || {};
  const need = new Set();
  const live = dmeta.blackout ? null : dmeta.live;
  if (live) {
    const s = get(K.scene(live));
    if (s?.map?.media) need.add(s.map.media);
    for (const [k, v] of dm) if (k.startsWith('item.') && v?.scene === live && v.media && !v.hidden) need.add(v.media);
  }
  const deck = dmeta.presenting?.deck ? get(K.deck(dmeta.presenting.deck)) : null;
  for (const sl of deck?.slides || []) if (sl.media) need.add(sl.media);
  for (const id of need) {
    if (get(K.media(id))?.pub) continue;
    publishMedia(id).catch((e) => { console.warn('[projector] publish failed', e); toast(`An image could not be shown to the players: ${e.message}`, { type: 'error' }); });
  }
}

function handleRequest(ev) {
  const r = ev.data || {};
  if (r.op === 'move' && r.id) {
    const it = world.d(K.item(r.id));
    const live = world.d('dmeta')?.live;
    if (!it || !it.movable || it.hidden || it.scene !== live) return;
    if (!Number.isFinite(r.x) || !Number.isFinite(r.y)) return;
    world.dPut(K.item(r.id), { ...it, x: r.x, y: r.y });
  }
}
