# Mini Fort Zombie v080: code reorganisation

This version doesn't change gameplay. I compared it with v079 on the same seeded run, and these all matched: the campaign start, the fort world, a shot (clip, spread bloom), a mission town build (56 buildings), the start of a siege, menus, the HUD, reload-cancel, the town map and the ironsight check. It makes the code cheaper and safer to work on.

## Code map
- **`ARCHITECTURE.md`** (new) is the code map. It covers:
  - how the scripts fit together
  - files never to open
  - each core file and its key globals
  - every game file, layer and model file
  - a "where do I look for..." index
  - a generated table of the **69 functions that later files wrap or replace**
- **`CLAUDE.md`** (new) holds short working notes for AI-assisted sessions: read the map first, what to skip, and the per-version routine.

## `js/game/core.js` is split into 13 files in `js/game/core/`
`01_items`, `02_state`, `03_audio`, `04_bodies`, `05_init`, `06_buildings`, `07_town`, `08_fortworld`, `09_zombies`, `10_weapons`, `11_companions`, `12_inventory`, `13_campaign`.
- They're still classic scripts sharing globals, loaded in the same order from `index.html`, so nothing that referenced core globals had to change.
- The split points were checked with a parser: no code that runs at load time uses anything defined in a later part.
- The parts rejoin to the original code exactly (only blank lines at the cut points differ).

## Formatting
- All hand-written JS is formatted with Prettier: 120 columns, single quotes. The config is in `.prettierrc.json`.
- Vendor, data, `propkit.js` and the generated `retro50.js` are excluded (`.prettierignore`).
- Lines were up to 1,159 characters; now the only lines over 200 are long string literals.

## `js/data/fzcfg.js`
The balance config was one 128 KB escaped line. It's now a readable object literal of about 4,000 lines, published as the same `#fzcfg` JSON element. The parsed data is identical.

## Fragile patch removed
`gunplay.js` used to patch `shoot()` by finding text in its source and re-`eval`ing it. Any reformat would have silently disabled the spread bloom and after-shot hook. `shoot()` in `10_weapons.js` now calls `RGX.spread` and `RGX.afterShot` directly when the gunplay layer is present, with the same behaviour.

## Tools
- `tools/arch/wrappers.js` regenerates the wrapper table.
- `tools/arch/sightcheck.py` is the ironsight alignment check used in v079.

Version is 080.
