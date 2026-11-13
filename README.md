# The Combat Ring

The battle table of **The Gods of Chaos** campaign: a live, password-gated virtual tabletop in the spirit of
Owlbear Rodeo, dressed like the [Gods of Chaos site](https://blobberus.github.io/Gods-of-Chaos/) and synced with it.

**Live site:** https://blobberus.github.io/Combat-Ring-GoC/

## Getting in

- **Password:** the same one as the Gods of Chaos site. The ring opens Gods-of-Chaos' own `vault.json`, so the two
  can never drift apart: change it there (Gods-of-Chaos `setup.html`) and the ring follows. Both sites live on
  `blobberus.github.io`, so "Remember this device" on either one unlocks (and "Lock" locks) both.
- **DM:** click **DM** (top right) and enter the DM password: the same one as the Gods of Chaos site's DM mode (the
  ring opens the site's own DM vault, `content/dm/vault.json`). Only the DM's browser can open the DM's state; players
  never receive hidden scenes, creatures, notes or stat blocks. Changing the DM password from the DM menu changes it
  for the site too.
- **Players:** on first visit, give your name and tick your character(s). Characters come straight from the
  Gods of Chaos sheets: name, player and portrait, and live hit points, conditions, darkvision and speed.

## What the DM can do

- **Scenes** (Scenes panel) open in two stages. The **short list** shows your **pinned** maps (in the order you drag
  them to), then the **recent** ones, the live scene always among them, and a quick *Find a scene* search. **All maps**
  (or *Browse all maps*, or the scene name at the top) opens the **library** out over the board: a tree on the left
  with Pinned, Recent, All scenes, **My maps** (your own folders, nested as deep as you like) and the **Gods of Chaos
  atlas** (its main map, the maps inside it and their places, as on the Gods of Chaos map), and the chosen folder,
  map or place on the right as picture cards. Organize it like a file system: *New folder* (named in place;
  double-click a folder in the tree to rename it), drag scenes onto a folder, drag a folder into another (or above /
  below one in the tree to reorder), drag scenes onto Pinned to pin them, onto a Gods of Chaos map or place to file
  them there (holding a drag over a folded row unfolds it). Ctrl+click or Shift+click selects several scenes to move,
  pin, file or delete together. Folders take a color; deleting a folder moves what was in it up a level (no scene is
  deleted). Every ⋯ menu does the same without dragging (touch screens). A Gods of Chaos map offers **New scene from
  this map** (its picture, cropped and scaled like any upload); a place offers *New scene here* and links back to
  Gods of Chaos. Search finds scenes, folders and places. Opening a scene, or Esc, folds the library back. All of it
  is the DM's: players never receive folders, pins or places, and Ctrl+Z undoes every move.
- **Making a scene:** *New scene* sets the size in squares, feet per square, background
  and grid, and places an uploaded image on that grid: drag to move it, wheel or slider to scale it, *Fill* /
  *Fit whole image* / *Match shape*, or *Image pixels per square* to line up a battlemap's own grid. Whatever lies
  outside the frame is cropped. View and prepare any scene in secret; **Show this scene** makes it live. The DM bar
  always says what the players see (green dot: a scene; amber: hidden). **Hide from players** (DM bar, the live
  scene's row in Scenes, or Shift+H) lowers the curtain over the live scene until you show it again.
- **Fog of war** (F): drag to draw fog with the lasso, polygon or rectangle (or a *Clearing*, which cuts fog away;
  Alt flips it), then **click a fog area to reveal it** to the players and click again to hide it. Fog is **one
  layer**: new fog replaces whatever fog it overlaps, so every spot belongs to one area and revealing an area never
  leaves older fog showing under it. **Select** (in the fog controls): click a fog area, Shift+click for more, or drag
  a box over several, then **Delete** (or Del) removes them and leaves no fog there; *Reveal* / *Hide* work on the
  selection too. Cover the whole map, reveal or hide everything. Players see opaque **black or white fog** (per
  scene) with soft, misty edges and nothing under it: creatures and props under fog never reach them, and other
  players' characters there aren't drawn. Older scenes' stacked fog becomes one layer the first time the DM opens
  them. The fog controls fold to a small tab (the tool stays
  on).
- **Characters are locked:** only the DM places, moves, resizes or removes the party's tokens, until the DM unlocks
  a character for its player on that scene (its token menu, or the lock buttons and *Unlock all* in Pieces). New
  scenes start locked.
- **Creatures** (Creatures panel): the whole 5etools bestiary (about 4,500 creatures with their token art), with search
  and CR / type / size / book filters and the full stat block. *Place* (or drag a row onto the map). New creatures
  can start hidden. **Custom creatures** have their own editor: stat block with live preview, art (upload with a
  circle crop, a bestiary token, or a URL), and *Start from a bestiary creature*.
- **Initiative for creatures:** *Add to initiative* in a creature's menu rolls d20 + Dex (or type the number). The
  Initiative panel lists the creatures on the board that aren't in the order, each with *Add*, plus *Add all*.
  Select several (Shift+drag a box, or Shift+click) for a group menu: add them all at once, optionally with **one
  roll for the group** so they act together; it also hides, shows or deletes them. Shortcut: **I** adds the selected
  creatures. Creatures on a scene that isn't live keep their number and join the order once it is.
- **Creature menu** (click a creature's token): HP with Damage / Heal, roll HP, initiative (add / roll again / take out), **size** (Tiny to
  Gargantuan, or Custom: any number of squares across, e.g. 2.5), side (enemy,
  companion, neutral), **what players see of its stats** (nothing, a health bar, or the full stat block), conditions,
  hide / show, **flip**, duplicate, lock, delete. Under *More*: the name players see (e.g. "Hooded figure"), a light
  it carries, its **token image** (upload and crop, another bestiary creature's token, or a web address, for this
  token only; *Original* goes back) and its layer (bring to front, send to back).
- **Flip** (the flip button in a token's menu, or **X** for the selection): mirrors the art of creatures, props and
  characters so they face the other way; names and health bars stay readable. Players see it too. Several selected
  tokens each turn around.
- **Props** (Props panel): crates, barrels, carts, a covered wagon, tables, doors, trapdoors, chests, boulders, trees,
  campfires and braziers (they give light), and more, plus your own uploaded art. Props can be resized, turned,
  made **movable by players**, hidden.
- **Interactions** (N): DM-only markers with notes, a text players see when it triggers, fog it lifts and hidden
  creatures or props it reveals. **Trigger** does all of it at once.
- **Scene settings** (Scene panel): light (bright / dim / dark) and shared party vision, fog and grid, scene notes,
  and the banner: **location name** and **time of day**, each hidden from players until you tick "Show".
- **Slides** (Slides panel): image decks for transitions, with titles and captions, slow zoom / pan / drift / pulse
  animations, crossfade / slow fade / slide / cut transitions, auto-advance and loop. GIFs and videos play as they
  are. The deck title and each slide's title and description can be kept from the players ("Players see …"
  boxes; the text isn't sent to them). Present and step through it; on your own screen switch it between
  **Full screen**, **Corner** and **Hidden** to keep working on other scenes while the players watch. Logging in as
  the DM (or reloading) always opens the DM view; a slideshow that is already running waits in the corner with its
  controls. The DM button and settings stay reachable over a full-screen show.
- **Player view** (DM view / Player view switch at the left of the bottom bar, or Shift+P): the live scene exactly as players see it (the curtain
  while it is hidden), or how another scene will look once shown; through the whole party's eyes or one PC's.
- **Undo / redo** (Ctrl+Z / Ctrl+Shift+Z) for the DM's edits.

## What players can do

- Move their own token once the DM unlocks it (snaps to the grid; Alt to place freely). While it is locked,
  **dragging it measures** how far a move or a shot reaches and the token stays put. The **movement circle** follows
  their speed, and they can add their own ranges (Longbow 150 ft, Fire Bolt 120 ft, Dash, anything) in *Customize*.
- **From the character sheet, live:** hit points (current, max, temp), conditions and Exhaustion, darkvision and
  speed come from the Gods of Chaos sheet and change there, not here (the token menu has *Open the sheet*). An edit
  shows up at once on a screen where Gods of Chaos is open in another tab of the same browser, and on every other
  screen within a few seconds (the DM's browser checks for new sheet commits every 4 s and shares them). The numbers
  are worked out with Gods of Chaos' own rules, so Exhaustion slows the Move circle and Grappled stops it, as the
  sheet shows.
- **Darkness:** in a **dark** scene a player sees only what light (torches, campfires, a light they carry) and their
  character's darkvision reach. Everything else is pitch black: the map, and creatures, props and other characters
  there aren't drawn at all (no name on hover either); their own characters always show. In a **dim** scene the
  board is darker beyond their sight, but what is there shows. Darkvision (from the sheet; Truesight counts too)
  shows a faded, grayer view whose edge softness, gray, dimness and tint each player sets.
- **Token art:** upload any image and crop it into a circle (in *Customize*, or *More* in the token menu, which also
  takes a bestiary creature's token for a wild shape or a polymorph, or a web address); otherwise the sheet's
  portrait or initials. **Flip** (token menu, or X) turns their character to face the other way, on every scene.
- **Size:** Tiny to Gargantuan, or Custom (any number of squares across), in the token menu or *Customize*.
- **Health bar:** they and the DM always see their numbers; the other players see the bar with HP, the bar only, or
  nothing, as the player chooses in *Customize*.
- **Health bar look** (Settings, per device): bar, bar with HP, or off; below or above the token; thin, normal or
  thick; colored by health or one color. HP numbers show only where that person may see them.
- **Pins** (P) that everyone sees; the DM resolves them or clears them all.
- **Initiative:** type their own number; the list sorts itself and shows whose turn it is. During combat,
  *Minimize* folds it into a small card at the top of the board: whose turn it is and who is next (the DM's has
  Previous / Next). Whoever's turn it is, character or creature, has a dashed gold ring on the board (the DM sees it on
  hidden creatures too; players only on what they can see).
- **Fit to the screen** (the corner button, or 0) fits the map into the part of the screen the bars leave free. For
  players it fits what isn't under fog, and until they pan or zoom their view follows what the DM reveals. Opening or
  closing the side panel keeps the middle of the view where it was.
- **Pieces** (the first panel) has two folds. **Party** (open at first) lists the Gods of Chaos characters; a
  character on the board is outlined in its color. **Characters and Creatures** (folded at first) lists every
  creature on the board, companions and neutral characters included. Click a row with a piece on the board to glide
  there and open its menu. Players see only what they can see: hidden creatures, anything under fog or in the dark
  aren't listed, and a party member they can't see says *out of sight*. The DM sees everything, with hidden and
  fogged creatures marked. Each device remembers which folds are open. **Highlight** (top of the panel) makes the
  party's tokens glow on your screen until you turn it off.
- **Cycle** (the circling-arrows button on the left rail, or C) glides the view to the next character or creature on
  the board and opens its menu: your own characters first, then the other characters, then creatures by name
  (Goblin 2 before Goblin 10). In combat it follows initiative, and the first press finds whoever's turn it is.
  Shift+click, right-click or Shift+C goes back; scrolling over the button scrubs through them. Players cycle only
  through what they can see; the DM also through hidden creatures.
- Hover any token to see its name; the DM decides how much more they see.
- **Measure** (M) with the 2024 rule (every square 5 ft), 5-10-5 or straight line; everyone sees the ruler.
  Double-click the map to ping it.

## How it stays live

Moves reach everyone in a few tenths of a second. Each token, fog shape, pin and setting is a small object
published to **three public MQTT brokers at once** (shiftr.io's public instance on port 443, HiveMQ and EMQX, over
WebSocket; one that any two browsers both reach is enough), retained so a late joiner gets the whole table, and
**encrypted** (AES-GCM) with a key derived from the site's token (table) or the DM's key (DM room), so the brokers
relay noise. The top bar's dot is green while at least one relay is connected (hover it for each one). The newest version of each object wins; a broker that missed something is healed
by whoever has the newer copy. The DM's browser publishes what players may see (the *projection*). Backups go to the
Gods of Chaos repository under `content/combat-ring/` every few minutes and on *Save* (Ctrl+S); uploaded images are
stored there too (the DM's sealed until shown). Details: [docs/live-model.md](docs/live-model.md).

## Bestiary data

`data/bestiary.json` is an index (names and game numbers only) built from the
[5etools data mirror](https://github.com/5etools-mirror-3/5etools-src) by `tools/build_bestiary.py`. Token art and
full stat blocks are loaded from the mirror at runtime, in the user's browser; no stat-block text is stored here.

## Development

No build step: plain HTML, CSS and ES modules. `python -m http.server 8791` in this folder, then open
`http://127.0.0.1:8791/?sandbox` (everything stays in that browser; open a second tab to play both sides).
Tests: `node tools/test_model.mjs` (model and projection), `node tools/test_live.mjs` (the live bus against the real
brokers; needs the network). See [CLAUDE.md](CLAUDE.md).
