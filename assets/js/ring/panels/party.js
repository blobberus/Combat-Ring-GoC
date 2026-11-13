// Pieces: who and what is on the board, in two folds.
// Party: the Gods of Chaos characters (name, owner, art), who is online, and quick ways to place, find and customize
// them; a character on the board is outlined in its color. Players see their own movement and ranges at the top.
// Characters and Creatures: everything else placed on the board, as this screen sees it (players: what they can see;
// the DM: hidden creatures and those under fog too).
// A row on the board finds its piece: the view glides there and selects it (as the rail's cycle button does). The head's
// Highlight makes the party's tokens glow on this screen.
import { h, clear, add, mount } from '../../core/dom.js';
import { icon, toast } from '../../core/ui.js';
import { getSetting, setSetting } from '../../core/settings.js';
import { world, me } from '../world.js';
import { party, pcProfile } from '../characters.js';
import { presence } from '../presence.js';
import { K } from '../model.js';
import { currentSceneId, placeParty, centerOfView, deleteKeys, canHandlePc, pcUnlocked, setPcLocked } from '../actions.js';
import { openPcEditor } from '../editors/pc-editor.js';
import { identityDialog } from '../dialogs.js';
import { mediaUrl } from '../media.js';
import { draggable, startPlacing, hasChanges } from './index.js';
import { previewing } from '../view.js';
import { focusPiece } from '../app.js';

/** HP, conditions, speed and darkvision as the Gods of Chaos sheet has them. */
function vitalsLine(p, senses) {
  return [p.hp ? `HP ${p.hp.cur} / ${p.hp.max}${p.hp.temp ? ` +${p.hp.temp}` : ''}` : null, ...p.conditions,
    senses ? `Speed ${p.speed} ft` : null, senses && p.darkvision ? `darkvision ${p.darkvision} ft` : null].filter(Boolean).join(' · ');
}

/** A round picture: the first of srcs that loads, else the letter. */
function art(srcs, letter, cls, accent = null) {
  const el = h('span', { class: cls }, letter);
  if (accent) el.style.setProperty('--accent-tok', accent);
  const next = (i) => {
    if (i >= srcs.length) { mount(el, letter); return; }
    mediaUrl(srcs[i]).then((u) => { if (u) mount(el, h('img', { src: u, alt: '', onerror: () => next(i + 1) })); else next(i + 1); }).catch(() => next(i + 1));
  };
  if (srcs.length) next(0);
  return el;
}
const pcArt = (p) => art(p.img ? [p.img] : [], (p.name || '?').slice(0, 1).toUpperCase(), 'cr-char-art', p.accent);

const byName = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
const SIDE = { ally: 'Companion', neutral: 'Neutral', enemy: 'Enemy' };

/** The pieces this screen's board shows (the board's last view: what the players may see, or the DM's all). */
const shown = (board) => (board.st.view?.tokens || []).filter((t) => t.kind === 'pc' || t.kind === 'creature');
// which pieces are listed and how (a creature walking under fog, or out of a player's sight, changes the list
// without changing anything a panel normally watches)
const listSig = (board) => shown(board).map((t) => `${t.key}:${t.fogged ? 1 : 0}`).sort().join('|');
let lastSig = '';

/** A collapsible part of the panel; whether it is open is remembered on this device. */
function fold(id, title, count, ...body) {
  const open = { party: true, others: false, ...getSetting('piecesOpen') };
  const d = h('details', { class: 'cr-fold cr-pieces', 'data-fold': id, open: !!open[id] },
    h('summary', null, h('span', { class: 'cr-pieces-chev', 'aria-hidden': 'true' }, icon('chevron-right')), h('span', { class: 'cr-pieces-title' }, title), h('span', { class: 'badge' }, count)), ...body);
  d.addEventListener('toggle', () => {
    const cur = { party: true, others: false, ...getSetting('piecesOpen') };
    if (cur[id] !== d.open) setSetting('piecesOpen', { ...cur, [id]: d.open });
  });
  return d;
}

export default {
  id: 'party',
  title: 'Pieces',
  icon: 'users',
  relevant: (c, { board }) => hasChanges(c, ['pc.', 'pct.', 'meta', 'dmeta', 'scene.', 'sheet.', 'item.', 'it.', 'turn']) || listSig(board) !== lastSig,
  headExtra: () => {
    const on = !!getSetting('highlightParty');
    return h('button', {
      class: 'btn btn-sm cr-highlight', type: 'button', 'aria-pressed': String(on),
      title: on ? 'Stop highlighting the party on the board' : 'Highlight the party’s characters on the board (only on your screen)',
      onclick: () => setSetting('highlightParty', !on),
    }, icon('sparkle'), 'Highlight');
  },
  render(el, { board }) {
    clear(el);
    lastSig = listSig(board);
    const sceneId = currentSceneId();
    const dm = world.dm && !previewing();
    const online = new Set(presence.list().flatMap((p) => p.chars || []));
    const all = party.all();
    const mine = all.filter((c) => me.owns(c.id));
    const pieces = shown(board);
    const onBoard = new Map(pieces.filter((t) => t.kind === 'pc').map((t) => [t.charId, t]));
    const partyBody = [];

    if (!dm) {
      if (!mine.length) {
        partyBody.push(h('div', { class: 'cr-callout' }, h('p', null, 'Choose your character to move its token and enter initiative.'),
          h('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: () => identityDialog() }, 'Choose my character')));
      }
      for (const c of mine) {
        const p = pcProfile(c.id);
        const t = onBoard.get(c.id);
        const placed = sceneId && world.t(K.pct(sceneId, c.id));
        const card = h('section', { class: ['cr-me', t && 'is-on-board'] },
          h('div', { class: 'cr-me-head' }, pcArt(p), h('div', null, h('div', { class: 'cr-me-name' }, p.name), h('div', { class: 'muted text-xs' }, vitalsLine(p, true)))),
          h('div', { class: 'cr-me-ranges' }, p.ranges.filter((r) => r.ft > 0).map((r) => h('span', { class: ['chip', r.on && 'is-active'], title: r.on ? 'Shown around your token' : 'Hidden' }, `${r.label} ${r.ft} ft`))),
          sceneId && !canHandlePc(c.id, sceneId) ? h('p', { class: 'cr-me-lock' }, icon('lock'), placed ? 'The DM moves your token. Drag it to measure a move or a shot.' : 'The DM places your token.') : null,
          h('div', { class: 'row' },
            sceneId ? (t
              ? h('button', { class: 'btn btn-sm', type: 'button', onclick: () => focusPiece(t.key, t.x, t.y) }, icon('compass'), 'Find me')
              : canHandlePc(c.id, sceneId) ? h('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: () => startPlacing({ kind: 'pc', charId: c.id, name: p.name }) }, icon('plus'), 'Place my token') : null) : null,
            h('button', { class: 'btn btn-sm', type: 'button', onclick: () => openPcEditor(c.id) }, icon('edit'), 'Customize')));
        if (p.accent) card.style.setProperty('--accent-tok', p.accent);
        partyBody.push(card);
      }
    } else if (sceneId) {
      const missing = all.filter((c) => !world.t(K.pct(sceneId, c.id))).map((c) => c.id);
      const open = all.filter((c) => pcUnlocked(c.id, sceneId)).map((c) => c.id);
      partyBody.push(h('div', { class: 'row cr-panel-actions' },
        h('button', { class: 'btn btn-sm', type: 'button', disabled: !missing.length, onclick: () => { const pt = centerOfView(board); placeParty(missing, pt.x, pt.y); toast(`Placed ${missing.length} on the board.`); } }, icon('users'), 'Place the party'),
        h('button', { class: 'btn btn-ghost btn-sm', type: 'button', disabled: missing.length === all.length, onclick: () => deleteKeys(all.map((c) => `t:${K.pct(sceneId, c.id)}`)) }, 'Take all off')),
        h('div', { class: 'row cr-panel-actions cr-lock-all' },
          h('span', { class: 'muted text-xs' }, open.length ? `${open.length} of ${all.length} unlocked for their players` : 'All locked: only you move the characters'),
          h('span', { class: 'spacer' }),
          open.length < all.length ? h('button', { class: 'btn btn-ghost btn-sm', type: 'button', title: 'Let every player move their own token on this scene', onclick: () => setPcLocked(all.map((c) => c.id), false, sceneId) }, icon('unlock'), 'Unlock all') : null,
          open.length ? h('button', { class: 'btn btn-ghost btn-sm', type: 'button', title: 'Only you move the characters on this scene', onclick: () => setPcLocked(all.map((c) => c.id), true, sceneId) }, icon('lock'), 'Lock all') : null));
    }

    if (!all.length) partyBody.push(h('p', { class: 'muted' }, 'No characters in Gods of Chaos yet. Each sheet made there appears here with its name, player and portrait.'));
    const list = h('ul', { class: 'cr-list', role: 'list' });
    for (const c of all) {
      const p = pcProfile(c.id);
      const t = onBoard.get(c.id); // on the board as this screen sees it
      const placed = sceneId ? world.t(K.pct(sceneId, c.id)) : null;
      const can = dm || me.owns(c.id); // customize
      const handles = sceneId && (dm || canHandlePc(c.id, sceneId)); // place / move
      const open = sceneId && pcUnlocked(c.id, sceneId);
      const who = p.owner || 'its player';
      const where = t ? 'on the board' : placed ? 'out of sight' : 'not on the board';
      const li = h('li', { class: ['cr-row', t && 'is-clickable is-on-board'], title: t ? 'Find on the board' : '', onclick: (e) => { if (e.target.closest('button') || !t) return; focusPiece(t.key, t.x, t.y); } },
        pcArt(p),
        h('div', { class: 'cr-row-main' },
          h('div', { class: 'cr-row-title' }, p.name, online.has(c.id) ? h('span', { class: 'rg-dot cr-online', title: 'Online' }) : null),
          h('div', { class: 'cr-row-sub' }, [p.owner && `Played by ${p.owner}`, where, dm && sceneId ? (open ? `${who} can move it` : 'locked') : null].filter(Boolean).join(' · ')),
          dm && vitalsLine(p, false) ? h('div', { class: 'cr-row-sub' }, vitalsLine(p, false)) : null),
        dm && sceneId ? h('button', { class: ['btn-icon btn-sm', open && 'is-open'], type: 'button', title: open ? `Unlocked: ${who} can move it. Click to lock it.` : `Locked: only you move it. Click to let ${who} move it.`, 'aria-label': open ? `Lock ${p.name}` : `Unlock ${p.name} for ${who}`, onclick: () => setPcLocked(c.id, open, sceneId) }, icon(open ? 'unlock' : 'lock')) : null,
        handles && !placed ? h('button', { class: 'btn-icon btn-sm', type: 'button', title: 'Place on the board', 'aria-label': 'Place on the board', onclick: () => startPlacing({ kind: 'pc', charId: c.id, name: p.name }) }, icon('plus')) : null,
        can ? h('button', { class: 'btn-icon btn-sm', type: 'button', title: 'Customize the token', 'aria-label': 'Customize', onclick: () => openPcEditor(c.id) }, icon('edit')) : null);
      if (p.accent) li.style.setProperty('--accent-tok', p.accent);
      if (handles) draggable(li, { kind: 'pc', charId: c.id });
      add(list, li);
    }
    if (all.length) partyBody.push(list);
    const placedCount = all.filter((c) => onBoard.has(c.id)).length;
    add(el, fold('party', 'Party', sceneId ? `${placedCount} of ${all.length}` : String(all.length), ...partyBody));

    // everything else on the board: creatures (companions, neutral characters, enemies), by name
    const others = pieces.filter((t) => t.kind === 'creature').sort((a, b) => byName.compare(a.label || a.name || '', b.label || b.name || '') || (a.key < b.key ? -1 : 1));
    const rows = others.map((t) => {
      const health = t.health ? t.health.text ? `HP ${t.health.text}` : t.health.word : null;
      const sub = [SIDE[t.disp] || 'Enemy', health, ...(t.conditions || []), dm && t.hidden ? 'hidden from players' : null, dm && t.fogged ? 'under fog' : null, t.turn ? 'their turn' : null].filter(Boolean).join(' · ');
      return h('li', { class: ['cr-row is-clickable cr-piece', t.hidden && 'is-hidden', t.turn && 'is-turn'], title: 'Find on the board', onclick: () => focusPiece(t.key, t.x, t.y) },
        art(t.imgs || (t.img ? [t.img] : []), (t.name || '?').slice(0, 1).toUpperCase(), ['cr-char-art cr-piece-art', `d-${t.disp || 'enemy'}`].join(' ')),
        h('div', { class: 'cr-row-main' }, h('div', { class: 'cr-row-title' }, t.label || t.name || 'Creature'), h('div', { class: 'cr-row-sub' }, sub)));
    });
    add(el, fold('others', 'Characters and Creatures', String(others.length),
      rows.length ? h('ul', { class: 'cr-list', role: 'list' }, rows)
        : h('p', { class: 'muted text-sm cr-pieces-none' }, !sceneId ? 'No scene on the board.' : dm ? 'No creatures on this scene yet.' : 'Nothing else you can see on the board.')));
    if (!dm) add(el, h('p', { class: 'muted text-xs cr-foot' }, 'Characters come from the Gods of Chaos sheets. Click anything on the board here to find it.'));
  },
};
