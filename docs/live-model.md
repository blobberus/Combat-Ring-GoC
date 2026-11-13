# The live table (bus, rooms, projection, backups)

## Why it works this way

The site is static (GitHub Pages) and every player shares one GitHub token, which allows only a few hundred writes an
hour. A battle table needs every move on every screen within a fraction of a second. So live play runs through
**public MQTT brokers** (no account, WebSocket, 100-400 ms), and GitHub is only the durable backup and the image store.

## The bus (`assets/js/core/bus.js`, `mqtt.js`)

- **Objects.** Each object is its own retained topic `cr1/<roomId>/o/<key>`; the payload is AES-GCM sealed
  `{k, t: [ms, clientId], by, d}`. `d: null` is a delete (tombstone). New subscribers get every retained object.
- **Versions.** Hybrid logical clock: a write is stamped `max(now, newest seen + 1)`; the newest `t` wins everywhere
  (ties by client id), so clock skew can't make a later edit lose.
- **Several brokers** (`config.json` `brokers`): writes go to all; reads merge by version (the first copy to arrive
  counts). After a broker's snapshot arrives, a client re-sends the recent objects that broker lacks, and any retained
  copy older than ours is re-sent ("heal"), so a broker that restarted catches up. Brokers come and go: in October
  2026 HiveMQ's public broker refused logins (CONNACK 5) from the DM's network and EMQX's port 8084 was unreachable
  there, so live play had no relay at all; shiftr.io's public instance (`wss://public:public@public.cloud.shiftr.io`,
  port 443, its published login) works through such networks and is listed first. `mqtt.js` takes a login from the
  URL (`user:pass@`) and asks a broker that turned the login down again only once a minute. Check them with
  `node tools/test_live.mjs` (or one URL as its argument).
- **Copies.** Each relay delivers its own copy of every message, our own writes included (MQTT echoes them); the
  copies are the same sealed bytes. A copy equal to the object's stored bytes (`raw`), or to one being decrypted at
  that moment (keyed by the iv, the first 12 bytes), or a transient message whose iv was seen, is not decrypted
  again: one decrypt per change instead of one per relay, none for our own echoes. A snapshot still counts such a
  copy as that relay's, and if the opened copy turns out older than ours, every relay that held it is healed.
- **Writes in a hurry.** A write overtaken by a newer one of the same key before it was sealed is not sent (a fast
  drag sends its newest step). A drag sends a step at most every 70 ms, and the step held back goes out when that
  time is up, so a pause mid-drag shows where the token is.
- **Reading.** `entries(room, prefix)` reads an index by key prefix ('item.', 'fog.<scene>.', 'pct.<scene>.'): the
  DM's room holds the whole campaign, and walking all of it on every redraw and drag step slowed big campaigns. The
  projector's one-item fast path reads only what that item needs.
- Tests: `node tools/test_bus.mjs` (no network: the index, overtaken writes, copies and echoes, healing).
- **Transient messages** `cr1/<roomId>/x/<channel>` (not retained): `hello`/`bye` (presence), `ruler`, `ping`, `req`
  (a player asking the DM's client to move a movable prop). Each carries a random id; duplicates are dropped (most
  before they are decrypted, by their iv).
- **Sizes.** EMQX keeps retained payloads only up to about 100 KB; keep objects small (one fog shape, one token).
- **Sandbox** (`?sandbox`): a BroadcastChannel between tabs with retained messages in localStorage, same interface.

## Rooms and keys

| Room | Key from | Who joins |
|---|---|---|
| `table` | HKDF of the GitHub token (`roomKeys(token, 'table')`) | everyone with the site password |
| `dm` | HKDF of the DM data key (`roomKeys(raw, 'dm')`) | the DM only |

The DM data key is a random 256-bit key wrapped by the DM password in the Gods of Chaos site's own DM vault
(`content/dm/vault.json` in the data repo, the one its DM mode uses), so the site and the ring share one DM password. Changing the token (re-running
Gods-of-Chaos setup) moves the table to a new room; the DM's client restores it from the backup.

## Object keys

Table room (players read; `world.t`):

| Key | Written by | What |
|---|---|---|
| `meta` | projector | `{live, blackout, unlocked: [charId], banner: {location?, time?}}` (only what the DM shows; `unlocked`: characters whose players may move their token on the live scene) |
| `scene.<id>` | projector | the live scene: size, grid, light, map image reference, `fogOn` |
| `fog.<scene>.<shape>` | projector | fog areas still hidden from players `{pts, holes, z, flat}` (one layer) |
| `it.<item>` | projector | what players see of a creature / prop / triggered notice (name = alias, health or stats if shown) |
| `ini.dm-<item>` | projector | visible creatures' initiative |
| `turn`, `show` | projector | combat turn, the slideshow being presented |
| `pc.<char>` | player / DM | token settings: image, `flip` (art mirrored), color, size (name or squares), ranges, vision look, light and `hpShow` (`numbers` / `bar` / `private`: what the other players' screens show). Older `hp`, `conditions`, `speed`, `darkvision` fields are ignored: the sheet has them |
| `sheet.<char>` | first to see a change | what the Gods of Chaos sheet says (see below): `{at, approx, hp: {cur, max, temp}, conditions, exhaustion, senses, darkvision, speed, by}` |
| `pct.<scene>.<char>` | player / DM | a PC's position on a scene |
| `pin.<id>` | anyone | `{scene, x, y, text, color, by, resolved}` |
| `ini.pc-<char>`, `ini.x-<id>` | player / DM | PC initiative, DM extras (lair actions) |

DM room (`world.d`): `dmeta` (live scene, banner with show flags, curtain, turn, presenting, `unlocked[scene][char]`),
`scene.<id>` (all scenes; `fogColor` black / white), `fog.<scene>.<shape>` (`{pts, holes, on, z, flat: true}`: one
layer, see below), `item.<id>` (creatures, props, notes; with `hidden`, stats, HP, `flip`; a creature's art is
`media` (an upload), `img` (a URL) or `tokens` (bestiary URLs, best first), and `art0` keeps the art it had before the
DM changed it from the token menu: players get `flip` and the art, never `art0`),
`cre.<id>` (custom creatures), `cprop.<id>` (custom props), `media.<id>` (image registry), `deck.<id>` (slideshows),
and the map library (`ring/library.js`): `folder.<id>` (`{name, parent, order, color}`; folders nest to any depth,
unknown or cyclic parents count as top level), `recent` (`{ids}`, the last 12 scenes the DM stayed on), and on each
scene `folder`, `pin` (sort key while pinned) and `at` (`{map, loc?}`: the Gods of Chaos map or place it is filed
under, read from `content/maps/`, `content/map/config.json` and `content/locations/`). `project()` copies none of
it, and the projector doesn't re-project for `folder.*` / `recent` changes.

## The projection (`ring/model.js` `project`, `ring/projector.js`)

The DM's client turns the DM room into the table room's projected keys after every change (a lone moved item takes a
fast path). Fog is one layer (`model.js` `cutFog`): a new area or a clearing is cut out of the areas it overlaps
(stored as `holes`; an area wholly covered goes), so areas never overlap; older saves' stacked shapes
(`{pts, mode, z}`, newest winning) are flattened (`flattenFog`) when the DM opens the scene, and before projecting.
An area cut very many times has its holes simplified to stay well under the brokers' size limit. Players get only:
the live scene (none behind the curtain), active fog, items that are not hidden and not
under fog, a creature's alias and only the stats the DM shows, triggered notices, visible creatures' initiative, the
banner parts marked "Show", and the slideshow being presented. Everything else stays sealed in the DM room.
A slide's `title` / `caption` and the deck title are left out when the DM unticks "Players see" (`hideTitle`,
`hideCaption`). A creature's initiative line carries no Dexterity: its `tie` is the rank of that score among the listed creatures
(`tieRanks`), so players sort ties like the DM without learning the stat. A fast-path change that adds, removes or
renumbers a line triggers the full projection so the ranks are recomputed.

## Characters' sheets (`ring/sheets.js`, `ring/characters.js`)

Hit points, conditions (with Exhaustion), senses (darkvision; Truesight counts as seeing in the dark) and speed are
the Gods of Chaos sheet's, never edited here: the token menu and *Customize* show them with an *Open the sheet* link.
The numbers come from Gods of Chaos' own rules engine (`<godsOfChaos>assets/js/views/characters/engine.js`, its
`buildRules` + `derive`), with the SRD files from that site (`srd/*.json`, `srd/stubs/*.json`) and the campaign's
custom library from the repo (`content/library/<kind>/`), so they match the sheet, debuffs included. If the engine
can't be loaded, `model.sheetVitals` makes rough numbers from the document (`approx: true`, said in the menu).

Three copies, the newest by the sheet's `updated` stamp wins (ties: the engine's over a rough one):
- the committed file: the DM's browser lists `content/characters/` every 4 s with an ETag (a 304 while nothing
  changed), players every 20 s, slower when GitHub's hourly allowance runs low (`repo.refreshDir`, `listDir`);
- Gods of Chaos open in another tab of the same browser: same origin, so its drafts (`localStorage`
  `goc:drafts:<owner>/<repo>`, written ~0.3 s after an edit, committed ~2 s later) are read on the `storage` event;
- `sheet.<char>` on the table: whoever first sees a newer copy (a draft or a commit) publishes it, so every screen
  follows within a moment.

## Images (`ring/media.js`)

- DM uploads (maps, custom art, slides) are WebP-converted, **sealed** with the DM data key and stored as
  `content/combat-ring/dm/media/<id>.bin`; `media.<id>` records them. When a scene or slide is shown, the projector
  publishes a plain copy `content/combat-ring/media/<id>.<ext>` once (`media.<id>.pub`).
- Player uploads (token art) are plain: `content/combat-ring/media/tokens/<char>-<rand>.webp`.
- References carry the git blob sha (`{p, s, m}`): the blob is created first (`POST /git/blobs`), so other clients
  can read it by sha at once, before the commit lands.
- Bestiary tokens are hot-linked from the 5etools image mirror (two bases, the `<img>` falls back).

## Backups (`ring/persist.js`)

The DM's client commits, at most every 3 minutes while things change (and on Ctrl+S / leaving DM mode):
`content/combat-ring/dm/state.bin` (both rooms, sealed) and `content/combat-ring/table.json` (the table room, plain).
On DM login it merges `state.bin` (newer versions win, the brokers catch up). A player whose brokers have no table
at all merges `table.json`. Tombstones older than 14 days are purged.
