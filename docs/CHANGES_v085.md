# Mini Fort Zombie v085: Dev Mode follows the game

Dev Mode (`js/game/devtoolkit.js`) no longer keeps any list of game content of its own. It reads every list from the game's registries at the moment it uses it, so new buildings, zombies, survivors, props, vehicles, weapons, trees, items and mission types show up in Dev Mode with no change to the toolkit. Rule for future changes: `CLAUDE.md`; the registry table: `ARCHITECTURE.md` > *Dev Mode stays in sync*.

## Why it kept going out of date
- `devtoolkit.js` loads before almost every other game file, and it built its drop-downs once, at load time. Anything a later file added or renamed was missing or stale: the Inspector listed the 21 quarantined legacy buildings (never placed in a town), showed the old names of the new ones (The Food Library, Eco Pump...), missed 21 real ones (Dead Weight, the houses, forests, parks, fire hall...), and its option numbers no longer matched the list it loaded from, so picking a building could load a different one.
- Test worlds used hand-written lists and fixed grid positions, so the vehicle rows ran into the street props and trees as the fleet grew, and old body names silently built nothing.
- Zombies > Spawn listed the core walker / runner / brute, which the game never uses (every zombie is an FZ style); the styles were on a separate page.

## The live registry layer (`REG` in devtoolkit.js)
Buildings `NEWCAT` (town pool: `half` + `big`), zombie styles `FZ.cfg.zst` and outfits `RZO`, survivors `RSURV.D` / `RSURV.ARCH`, vehicles `MFZV.kinds`, lootable props `MFZPROP`, prefabs `RGPK.PF`, trees `RGFLORA.treeKinds()`, weapons `WDEF`, items / categories / loot tables, mission types `MZ`. Every drop-down is rebuilt from these each time the panel opens.

## Building > Inspector
- Lists exactly the 48 buildings the town generator places, by current name, grouped Full-block / Half-plot, selected by id (old saved tests that stored an index still load).
- Builds a building the way a town plot does: plot ground, `bld()` in its slot (half-plot buildings in sub-plot A), yard enclosure, placement check, then the game's own post-build passes (`WB.post`: merge, decor, world textures, flora), so it looks as it does in a mission.
- The report adds how often it appears in towns (min / max per town) and the function that builds it.
- **Check every building**: builds every building in every condition and reports anything that throws, warns or leaves its plot.

## World > Map
- **Random map launches a real mission**: it picks the mission type with the map screen's own weights (`MZ.pickType`, new), sets `G.mission` as clicking a pin does and runs the game's `go('EXPEDITION')`. Town, mission site, its loot / survivors / zombies, weather and arrival are whatever the current game builds; only the drive and the clock advance are skipped. A Mission field picks Random, a specific type, or None (free roam).
- **Seeds are repeatable now**. They never were: three.js gives every new mesh, material and geometry a UUID made with `Math.random`, and caches built on the first run made a different number of objects, shifting the seeded sequence (the same seed gave a different town). three.js's UUID generator now uses the native `Math.random` captured at load (`js/vendor/three-r147.js`, one function), and the mission site gets its own sub-seed. Same seed + fort + mission = same town and same mission site.

## Test worlds (Building > Test worlds)
- New layout engine (`Showcase`): each model is built at a staging spot, measured, then moved (with its collision boxes, walkable tops, loot container, zombie home, tree record) into a slot sized to its footprint and name tag. Rows of fixed width, labelled sections, and the world (ground, bounds, border, nav grid) is sized to whatever was placed. A registry can grow without limit and nothing lands on top of anything.
- **All props**: every lootable prop + every prop kit prefab (207; 37 of them depend on parts of the original kit that were never ported and can't build in this game, so they are skipped and listed in the Log).
- **All models**: every vehicle kind, every weapon (the game's own model, on a plinth), every tree species + a dead tree, a bush, a street light.
- **All survivors**: all named survivors (sorted by name) + the base personas.
- **All zombies**: every FZ style, spawned live through the game's `zombie()` (standing, AI off), plus any outfit no style uses (static model, flagged). Falls back to the core types if FZ styles are off.
- Item warehouse uses the same layout.
- Every test world finishes with the game's `WB.post` passes.

## Zombies tab
- **Spawn & AI** lists every FZ style (live) plus "Random mix (as in game)". Each spawn goes through the game's own `zombie()` with `FZ.force`, so model, outfit, size, HP, speed, abilities and weapons match a mission.
- The **FZ styles** page is gone; its tuning (hpScale / biteScale / barScale) now sits under Spawn & AI. The style picker it had is the Type list.
- New `RZ.outfitKey(style)` (`js/modern/zbody.js`): the one place that maps a style to its outfit, used by the model builder and by Dev Mode.

## Diagnostics
- **Registry sync report**: what Dev Mode reads from each registry (counts) and anything orphaned: styles with no outfit, outfits no style uses, catalogue entries the town never places. Also in the debug report.

## Fixes found on the way
- **Dev test worlds polluted or wiped by the menu town** (`js/game/menuworld.js`): entering Dev Mode while the main-menu backdrop town was still being built step by step let the remaining steps keep adding its buildings and zombies to the test world (zombies outside the bounds, the AI test area had 18 zombies instead of 5), and when it finished it called `clearWorld()`. The menu build now stops at the next step and leaves the new world alone.
- **Dev sandbox could overwrite the real save** (`js/layers/savegame.js`): the Fort building scenario autosaved the sandbox campaign. Saving is now blocked while Dev Mode is on.

## Small hooks added to game files
- `MZ.ORDER`, `MZ.weights`, `MZ.pickType` (`js/game/missions.js`).
- `RGFLORA.treeKinds()` (`js/layers/flora.js`).
- `RZ.outfitKey` (`js/modern/zbody.js`).
- `fzSpawn(style)` takes the style as an argument (`js/game/skills.js`).

## Tested (headless Chrome)
- Inspector list = the 48 town-catalogue buildings, current names, no legacy entries; 51 FZ styles in Spawn; mission types live.
- Every test world: 0 overlapping models, nothing outside the bounds. Props 247 placed (37 unbuildable prefabs skipped), models 75, survivors 98, zombies 51 (exactly 51 zombies in the world), warehouse 11, AI areas exactly 5 zombies.
- Random map: mode EXPEDITION, a mission site with its loot / survivor. Same seed twice (free roam and with a mission): identical town plan, zombie count and mission site.
- Check every building: all 48 buildings x 3 conditions build with no exceptions. It reports real problems the town validation also logs in missions (not fixed here, they are building work):
  - geometry a little outside its plot at ground level: `piety_medical_clinic` (8 spots), `lucky_ducky`, `morgans_drug`, `small_house`, `medium_house` (10 cm over the divider), `cemetery` (about 1 m at x = 21);
  - NaN vertex positions (the `computeBoundingSphere ... NaN` console error seen in missions): `the_aztec`, `fortified_house`.
- Registry sync report: 5 FZ styles have no outfit and use the plain body: `generic`, `bowler`, `WTF`, `plaid_jacket`, `white_shirt`.
- Prettier was not available in this environment (no network); the edited files follow the existing style but were not run through it.
