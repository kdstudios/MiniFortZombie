# Mini Fort Zombie: code map

Read this before searching the code. It says where each system lives, which files never need opening, and which functions are wrapped by later files.

## How the game is put together
- `index.html` loads about 75 classic `<script>` files **in order**. There are no modules and no build step. Every top-level `const` / `let` / `function` is a global shared by every later file.
- **Load order matters.** Later files ("layers") often replace a global function with a wrapped copy, e.g. `const _old = hitZ; hitZ = function () { ...; return _old.apply(this, arguments) }`. The function you find in `js/game/core/` may not be what actually runs. Check the [wrapper table](#wrapper-chains-generated) first.
- Code comments tag changes with the version that made them (`v072:`, `REVISION 037`). Each version's notes are in `docs/CHANGES_v0xx.md`. The latest notes file is the quickest way to catch up.
- The version number is in three places: `VERSION` in `js/game/core/01_items.js`, the page `<title>`, and the two `Version 0xx` labels in `index.html`. Saves stamp it from the title.
- Formatting: Prettier, 120 columns (`.prettierrc.json`, `.prettierignore`). Run `npx prettier --write <file>` after editing a hand-written file.

## Never open these (data, vendor, generated)
| Path | What it is |
|---|---|
| `js/vendor/three-r147.js` | three.js r147 (one local change, v085: its UUID generator uses the native `Math.random` captured at load, so seeded builds are repeatable) |
| `js/data/modern-textures.js` (6.4 MB), `rzombie.js`, `rzombie-tex.js`, `rsurv-tex.js`, `fire-tex.js` | Packed meshes and textures |
| `js/data/survivors.js` | Survivor model data (personas are in `docs/SURVIVOR_PERSONAS.md`) |
| `js/data/fzcfg.js` | Balance config: guns, ammo, items, AI, NPCs, lots, missions. Readable, but search it with a key (`grep -n '"weap_m4"'`) rather than reading it |
| `js/modern/propkit.js` (850 KB) | Ported Modern prop kit (`RGPK`). Only read the one `PF.*` prefab you need |
| `js/modern/retro50.js` | **Generated** from `tools/retro50_src/` by `build.sh`. Edit the source parts, not this file |
| `css/fonts.css` | Embedded fonts |

## Core game: `js/game/core/` (the old `core.js`, split by subject in v080)
| File | What's in it | Key globals |
|---|---|---|
| `01_items.js` | Perf helpers, item registry, weapon data, loot tables, item icons, icon import/export, IndexedDB | `ITEMS`, `ITEM_ORDER`, `CATS`, `WDEF`, `FIST`, `BASH`, `LOOT_TABLES`, `iconCanvas`, `VERSION` |
| `02_state.js` | Inventory grids, resources, **game state `G`**, screen switching, options glue | `G`, `FORT`, `invAdd/invPut/...`, `ui()`, `optTab()`, `setQuality()` |
| `03_audio.js` | Procedural WebAudio, music, UI init, tooltips | `S` (all sounds), `initAudio`, `setMusic`, `initUI` |
| `04_bodies.js` | Blood, decals, damage numbers, HP tags, limbs, dismemberment, **`hitZ`**, ragdolls, sleep/rise, windows/shards, **`killZ`** | `hitZ`, `dismember`, `killZ`, `breakWin`, `PARTS` |
| `05_init.js` | `init()`: renderer, camera, **input listeners (keydown)**; solids, loot containers | `init`, `addSolid`, `blocked`, `spawnContainer`, `rollLoot` |
| `06_buildings.js` | Building shells, interiors, block human/zombie models, building condition variants, trees, cars, park, cemetery | `shell`, `WL`, `mkDoor`, `mkRollDoor` (v089 roller doors), `makeHuman`, `animZ`, `makePerson`, `ruin`, `makeCar` |
| `07_town.js` (6k lines) | Town grid layout, building catalogue, half-lots and compounds, yards, map generator v2, legacy town | `CATALOGUE`, `NEWCAT`, `defN`, `planTownV2`, `buildTownV2`, `town` |
| `08_fortworld.js` | Melee reach and aimed-part tests, the fort, barricades, `clearWorld`, `buildWorld` | `meleeReach`, `meleeTarget`, `meleeAimPart`, `fort`, `clearWorld`, `buildWorld` |
| `09_zombies.js` | Zombie spawn, sight/LOS, nav flow field, doors, vaulting, obstacle attacks, movement, **`updateZombies`**, `look()` raycast, `fb()` | `zombie`, `los`, `navField`, `zMove`, `updateZombies`, `look` |
| `10_weapons.js` | Weapon models, classic viewmodel, ammo, **reload**, tracers, **`shoot`**, **`melee`**, `hudWeapon`, NPC weapons and combat, `dmgZ` | `reload`, `rlTick`, `shoot`, `melee`, `hudWeapon`, `npcCombat`, `dmgZ` |
| `11_companions.js` | Companions, command wheel, travel, use/place/carry | `comps`, `updComps`, `travel`, `use` |
| `12_inventory.js` | Inventory screens, drag/drop, drop boxes, containers, HQ inventory, torch | `renderInv`, `openContainer`, `dropItem` |
| `13_campaign.js` | Start kit, campaign start, `go`/siege/HQ/pause, I'm stuck, crouch, **day cycle (`endDay`, `advanceTime`, `newDay`)**, `hqUI`, clock, lighting, **`hud()`**, **`animate()` main loop** | `initCampaign`, `pick`, `go`, `openHQ`, `endDay`, `hud`, `animate` |

## Other game files: `js/game/`
| File | What it is |
|---|---|
| `devtoolkit.js` | Developer Toolkit (Options > Developer Toolkit): spawners, AI toggles, world tools. **v085: keeps no content lists**; `REG` reads every registry live (see [Dev Mode stays in sync](#dev-mode-stays-in-sync)) |
| `perf.js` | Performance pass: wraps `look`, `los`, `blocked`, `mesh` and more with spatial grids and caches. v088: `clearWorld` no longer disposes materials and frees old geometries and textures only when the next world doesn't use them (`PERF.flushDisposals`, one world of grace) |
| `skills.js` (3.2k lines) | v042: skills, actions (search, lockpick). v044: zombie misses. v047: z-fight resolver. v048: **FZ config layer** (`FZ.cfg` from `#fzcfg`, `FZ.apply`). v049: occupations and named survivors. v050: **FZ zombie styles + AI** (`fzZAct`, tackles, medics). v051: barricade ghost. v052: rumor missions. v053: **damage model** (`fzW` wounds, armed zombies `FZ_AIM`, body HUD). Also keybinds (`KB_DEF`), `skForget`, `skMeleeHit` |
| `missions.js` | HQ **town map**: painted map, pins, travel time (`hoursFor`), launching a run (`MZ.launch`) |
| `occupation.js` | Occupation screen (New Game > Occupation > fort) |
| `ui.js` | Menu layer: backdrop, Options side-nav and Graphics sub-pages, Game Assets (icons) pager, HQ fit, Esc = back |
| `assets.js` (v092) | Options > Game Assets: **custom textures** (`MFZTEX`: the 47 world surface sets and their normal maps, zombie and survivor atlases, the fire strip) and **custom sounds and music** (`MFZSND`: wraps the `S.*` synths, streams music into the music channel). Import / export defaults / clear, filters, paging; stored in IndexedDB `mfz_assets`. Custom icons stay in `01_items.js` + `ui.js`. A new replaceable texture: a slot in `texSlots()`; a new replaceable sound: a row in `SFXT` | `MFZASSETS`, `MFZTEX`, `MFZSND` |
| `hitchlog.js` (v094; v096: `hitch.scene()` draw-call breakdown, F7 A/B test) | Diagnostics, loaded last: ring buffer of the last ~40 s of frames, timed calls (shoot, killZ, sounds, world build ...), long-task / long-animation-frame matching, GPU timer. F9 grabs the last 8 s, F10 downloads reports, `prof(10)` in the console. `?nohitch` disables it. See `docs/CHANGES_v100.md` |
| `menuworld.js`, `menumusic.js`, `loader.js` | Main-menu 3D scene, menu music, loading screens. v088: `MFZLOAD.warm` compiles shaders, uploads textures and draws the world once (culling off) behind the loading screen. v096: the warm-up also equips every weapon once (`warmWeapons`), shows hidden objects for the compile and the final draw (`allVisible`), draws a tracer probe, and `L.settle()` lets the real loop run smooth behind the loading screen before "Press any key". Every world build is warmed: the mission loader does it after `go()`, and any other build goes through the `WB.post` hook `MFZLOAD.afterBuild`. While `MFZLOAD.busy` is set nothing renders and the world does not advance. Shader errors are only logged with `?shadercheck` |

## Layers: `js/layers/` (loaded after core; mostly wrap core functions)
| Area | Files |
|---|---|
| HUD and options | `hudui.js` (in-game HUD frames, `--hs` scale, **HUD size option**), `graphics.js` (Graphics tab, `RGFX` settings), `devlineup.js` (**crosshair**: ring, melee-reach red, hidden on aim), `stealth.js` (crouch stealth eye) |
| Guns and melee look | `gunplay.js` (gun viewmodel on Modern models, ADS pose, **sight calibration**, recoil, reload animation, `RGX`), `meleevm.js` (melee viewmodel) |
| Zombies | `zbatch.js` (v088: render-only merged SkinnedMesh per zombie; the parts are its bones and are hidden from render cameras by a layers test, raycasts still hit them; `ZBATCH`), `zanim.js` (locomotion), `zpath.js` (pathfinding: routes, A*, string pulling), `zfloors.js` (**multi-storey nav**: floor nodes, stairs, window drops, flow field over floors, fall ragdolls, follower routes; `NAVF`), `zclimb.js` (climbing), `zknock.js` (knockdowns), `ztackle.js` (football charge), `zaim.js` (armed-zombie aim visuals), `ragdoll.js` (death ragdolls), `gore.js` (limbs always off, torso kills, corpse hits) |
| Survivors | `survwalk.js` (walk cycle) |
| World look | `world.js`, `atmosphere.js` (sky, weather, post), `detail.js` (ground cover), `architecture.js` (facades), `decor.js`, `flora.js`, `chainlink.js`, `props.js` (Modern props, swaps cars to retro), `vehicles.js` (`MFZV.make`), `mfzprops.js` (prop loot containers), `fire.js` (**fire sprites**, `MFZFIRE`), `water.js` (**water**, `MFZWATER`, v091: pools, ponds, fountains, streams, rain puddles, the ripple field; ported from Riposte: Frontline) |
| Full-block lots (40 × 36 m). Feature catalogue: `docs/FEATURES.md` | `burgerjoint.js`, `gasstation.js`, `gunshop.js`, `bowling.js`, `supermarket.js`, `cerberus.js`, `church.js`, `cinema.js`, `hardware.js`, `motel.js`, `sporting.js`, `newlots.js` (placeholders for the rest of the MissionMapDB lots) |
| Save | `savegame.js` |
| Online co-op (v086) | `coop.js`: PeerJS room, seeded world, host-authoritative zombies, guest survivor. Loads after `loader.js`. See `docs/CHANGES_v086.md` |

## Models: `js/modern/` and `js/props/`
| File | What it is |
|---|---|
| `guns.js` | Every gun model (`RGUN.buildGunModel(key)`, `defineGun`). Sight anchors are `info.sightY` / `info.adsZ`; gunplay recalibrates `sightY` from the front sight |
| `hands.js`, `gun-env.js` | Gloved arms rig; environment map for gun metals |
| `melee.js` | Detailed melee weapon models |
| `zbody.js`, `zoutfits.js` | Modular zombie bodies (limbs come off), zombie outfits |
| `survivors.js` | Unique survivor models |
| `herbier.js` | Plant painter used by flora |
| `js/props/mfzkit.js` + `mfzm_*.js` | Original prop toolkit and props (storage, kitchen, office, outdoor) |
| `js/props/lotkit.js` | **Lot kit** (`LOTKIT`, alias `LK`, v081): the plumbing shared by full-block lots (geometry + collision list, sidewalk slab and street props, wall lining round openings, decor attach, loot spawner, zombies, `NEWCAT` / `ruin` registration). `church.js` is built on it |
| `js/props/condkit.js` | **Condition kit** (`MFZCOND`, v089), loaded right after `mfzkit.js`: (1) `K.preMerge` nudges coplanar same-facing faces of different materials 4 mm apart in every `K.builder` model (no z-fighting; `MFZCOND.stats.zfix`); (2) the outermost `ruin()` wrapper (installed at DOMContentLoaded) turns a lot's merged decor into its **looted** / **ruined** copy, made once per building type and level from the intact part list (`R.items`); (3) wraps `WL` so each building keeps its walls and openings (`B.__wl`) and `MFZCOND.zones(B)` gives door / gate clear zones (core `put()`, `cont()`, ruin rubble, `CP.rubble` / `CP.wreck` and half-plot furnishing keep out of them) |

## Shader count (v088)
Every distinct shader costs a compile when a world loads. Don't write per-material numbers into shader text or `defines`, and don't vary `customProgramCacheKey` per value. Pass the number as a uniform in `onBeforeCompile` (`sh.uniforms.x = {value}`) and keep one cache key, as `K.tri` (`uTriS`) and `world.js` (`uRgTc`) do. `renderer.info.programs.length` should stay around 70 in a town.

## Frame cost (v088 update)
- **Sun shadow is cached** (`perf.js`, `PF.sc`). Static casters are redrawn only when needed. A new kind of moving object needs either a `userData.kind` from `SC_DYNK` (`zombie`, `corpse`, `surv`, `npc`, `comp`, `person`, `limb`, `carry`) or a place in one of the arrays `scSnapshot()` reads. Objects added after the world build are treated as moving automatically. A static change the cache can't see should call `PERF.shadowDirty()`.
- **Big instanced sets must be tiled** with `PERF.tileIM(im, cell, far)`. Town-wide merged meshes must be split into cells, as prop batches are. Otherwise they are drawn every frame and every ray tests all their triangles.
- **Zombie rendering goes through `zbatch.js`.** A part that must look different should change visibility (it collapses in the merged mesh) or swap its geometry or material (the zombie is rebuilt). Editing a part's geometry attributes in place won't show. New meshes added to a zombie later render on their own.
- **Static subtrees are frozen** by `freezeStatic()` (`matrixAutoUpdate = false`). Moving something in one of those kinds (`vehicle`, `rgprop`, `truck`, `bdecor`, tiles) needs `updateMatrix()`. The scene root itself does not auto-update.

## Where do I look for...
| Task | Look at |
|---|---|
| HUD element (clock, compass, vitals, radar, weapon panel) | `hudui.js` + `css/hud.css`; values written by `hud()` in `13_campaign.js` and `hudWeapon()` in `10_weapons.js` |
| Options / settings | `index.html` (`#opt`, `#optV` rows move into Graphics > Display), `graphics.js` (`ROWS`), `ui.js` (tabs, `TABN`), `02_state.js` (`optTab`, `saveSet`) |
| Fort HQ screen | `index.html` `#hq`, `13_campaign.js` `hqUI`/`openHQ`/`endDay`, `css/ui.css` (`.hqActs`) |
| Town map / missions | `missions.js` (`paintMap`, `render`, `launch`, `hoursFor`); pin CSS `.tmPin` in `css/ui.css` |
| Zombie senses and memory | `09_zombies.js` `updateZombies` (`u.see`, `u.hunt` = chase memory, `u.lx/u.ly/u.lz` = last-known spot and floor); `skForget`/`sneakEff` in `skills.js`; line of sight is `los` in `perf.js` (floor-aware since v081) |
| Pathfinding, stairs, upper floors, window drops | `zfloors.js` (graph: `NAVF.nodeAt`, `NAVF.fwd`, `NAVF.drops`, `NAVF.remFor`, `navField`/`navSoft` replaced), `zpath.js` (routes: `fieldRoute`, `astar`, `smooth`, `ZPATH.route` for followers), core `NAV` grid in `09_zombies.js`. Dev: Building > Test worlds > *Floor nav overlay*, or `navFloorsDebug(true)` |
| Followers (pathing, doors) | `updComps` in `11_companions.js` (asks `NAVF.compWay` for a waypoint) |
| Zombie special behaviour | `skills.js` v050 `fzZAct` + the `z*.js` layers |
| Damage, limbs, crits | `hitZ` in `04_bodies.js`, then `gore.js` wraps it (v089: death rules: head off = revivable corpse, torso destroyed = gibbed, limbs never kill); which part a mesh is: `zPartOf` in `08_fortworld.js`; the wound model `fzW` is in `skills.js` v053 |
| Zombie melee reach / stop distance (v090) | `ZREACH` + `zStopAt` in `09_zombies.js` (also used by `zpath.js`) |
| Melee | `melee()` in `10_weapons.js` (wrapped by `skills.js` and `gore.js`); reach and aimed part in `08_fortworld.js` |
| Shooting, spread, ammo, reload | `shoot()`, `reload()`, `rlTick()` in `10_weapons.js`; spread bloom + after-shot hook `RGX.spread`/`RGX.afterShot` in `gunplay.js`; FZ gun values (`rlN`, `rlT`, caps) come from `fzcfg.js` via `FZ.apply` |
| Gun look / ADS / sights | `gunplay.js` (`pose`, `calibrateSight`, `prepSights`), models in `guns.js`; check with `tools/arch/sightcheck.py` |
| Keybinds / input | `KB_DEF` in `skills.js`; keydown handler in `05_init.js` |
| Items, loot, icons | `01_items.js` (`ITEMS`, `WDEF`, `LOOT_TABLES`), icon painters in the same file |
| Buildings / town generation | `06_buildings.js`, `07_town.js`, full-block lot layers, `newlots.js` |
| **A new building, or reusing a feature** | `docs/FEATURES.md` (what exists and where), `js/props/lotkit.js` (shared plumbing), template `js/layers/church.js` |
| Vehicles | `vehicles.js` + `retro50.js` (source in `tools/retro50_src/`). v093: cabins, seats, dash, wheel and mirrors are fitted in `r50_core.js` (`cabinLoft`, `interior`); collision is measured from the model by `MFZV.collide` (never push a box for a vehicle by hand) |
| Fire | `fire.js` (`MFZFIRE.add`) |
| Water: a pool, pond, fountain, stream or puddle (v091) | `water.js`: `MFZWATER.add({kind, parent: B.g, shape, x, y, z, ...})`, looks in `MFZWATER.kinds`. Never a flat blue mesh. v093: `bed` = how deep it looks, `sink` / `sinkSlope` = how far walkers sink (the ground cannot go below 0); a pool you can enter needs its deck and walls as solids and a way out. Cached decor can't hold water: add it in the lot's placement function (see `motel.js`). Rain puddles and the ripple field are in the same file |
| Save / load | `savegame.js` |

## Dev Mode stays in sync
Dev Mode (`js/game/devtoolkit.js`) loads before most of the game and keeps no list of content of its own. Its `REG` object reads each registry at the moment it is used and every drop-down is rebuilt each time the panel opens. Register content in the game and it appears in Dev Mode by itself:

| Content | Registry (where to add it) | Shows up in |
|---|---|---|
| Buildings | `NEWCAT` (`defN` in `07_town.js`, `LK.register` in `lotkit.js`, `add` in `newlots.js`); the town pool is every entry with `pool` `half` or `big` | Building > Inspector, *Check every building*; World > Map |
| Zombie styles / outfits | `FZ.cfg.zst` (`fzcfg.js`) -> outfit `RZO` (`zoutfits.js`), resolved by `RZ.outfitKey` | Zombies > Spawn & AI; Test worlds > All zombies |
| Survivors | `RSURV.D`, `RSURV.ARCH` | Test worlds > All survivors |
| Vehicles | `MFZV.kinds` (`vehicles.js`) | Test worlds > All models |
| Props | `MFZPROP` (loot props, `mfzm_*.js`), `RGPK.PF` (prop kit prefabs) | Test worlds > All props |
| Trees | `RGFLORA.treeKinds()` (`flora.js`) | Test worlds > All models |
| Weapons | `WDEF`, drawn with `cloneModel` | Test worlds > All models |
| Items, loot | `ITEMS`, `CATS`, `LOOT_TABLES` | Items pages, Warehouse |
| Missions | `MZ.ORDER`, `MZ.pickType` (`missions.js`) | World > Map (Random map = a real mission launch) |

Test worlds lay models out with `Showcase` (measured slots, rows, labelled sections; the world is sized to fit). Every Dev world finishes with the game's own `WB.post` passes, like `buildWorld`. Diagnostics > *Registry sync report* lists the counts and anything orphaned (styles with no outfit, outfits no style uses, catalogue entries the town never places).

## Tools
- `tools/arch/lotcheck.py` builds one lot headless and reports errors, counts, loot and zombies: `python3 -I tools/arch/lotcheck.py . <NEWCAT id> [shot.png]` (the png is an overview render).
- `tools/arch/features.py` regenerates the per-building half of `docs/FEATURES.md`: `python3 tools/arch/features.py . > /tmp/f.md`.
- `tools/arch/wrappers.js` regenerates the wrapper table below: `node tools/arch/wrappers.js . > /tmp/w.md`. Needs `acorn` and `acorn-walk`.
- `tools/arch/sightcheck.py` checks ironsight alignment for every gun. Needs Playwright.
- `tools/retro50_src/build.sh` rebuilds `js/modern/retro50.js`. `tools/zombie/` and `tools/survivor/` hold the asset pipelines.

## Wrapper chains (generated)
Each function is defined in the first file, then wrapped or replaced by each file listed, in load order. **The last file in a row runs first.** This table is generated by `tools/arch/wrappers.js` and is best effort: it finds `name = function`, `name = () =>` and `window.name = function` assignments.

| Function | Defined in | Then wrapped / replaced by (load order) |
|---|---|---|
| `clearWorld` | js/game/core/08_fortworld.js | js/game/perf.js → js/modern/survivors.js → js/layers/ragdoll.js → js/layers/devlineup.js → js/layers/gore.js → js/layers/zpath.js → js/layers/zclimb.js → js/layers/zfloors.js → js/layers/zaim.js → js/layers/zknock.js → js/layers/mfzprops.js → js/layers/fire.js → js/layers/water.js |
| `killZ` | js/game/core/04_bodies.js | js/game/devtoolkit.js → js/game/skills.js → js/layers/ragdoll.js → js/layers/gore.js → js/layers/zpath.js → js/layers/zclimb.js → js/layers/zfloors.js → js/layers/ztackle.js → js/layers/zaim.js → js/layers/zknock.js |
| `ruin` | js/game/core/06_buildings.js | js/props/lotkit.js → js/layers/burgerjoint.js → js/layers/gasstation.js → js/layers/gunshop.js → js/layers/bowling.js → js/layers/supermarket.js → js/layers/cerberus.js → js/layers/cinema.js → js/layers/hardware.js → js/layers/motel.js → js/layers/sporting.js → js/props/condkit.js (outermost, v089: installed at DOMContentLoaded) |
| `animZ` | js/game/core/06_buildings.js | js/game/skills.js → js/layers/zanim.js → js/layers/ragdoll.js → js/layers/zclimb.js → js/layers/zfloors.js → js/layers/ztackle.js → js/layers/zaim.js → js/layers/zknock.js |
| `animate` | js/game/core/13_campaign.js | js/game/devtoolkit.js → js/game/perf.js → js/game/skills.js |
| `animVM` | js/game/core/10_weapons.js | js/layers/gunplay.js → js/modern/melee.js → js/layers/meleevm.js |
| `go` | js/game/core/13_campaign.js | js/game/skills.js → js/game/missions.js → js/layers/savegame.js |
| `initCampaign` | js/game/core/13_campaign.js | js/game/skills.js → js/game/missions.js → js/game/occupation.js |
| `optTab` | js/game/core/02_state.js | js/layers/graphics.js → js/game/ui.js → js/game/menuworld.js → js/game/assets.js |
| `damage` | js/game/core/09_zombies.js | js/game/devtoolkit.js → js/game/skills.js |
| `hqUI` | js/game/core/13_campaign.js | js/game/missions.js → js/game/ui.js |
| `lighting` | js/game/core/13_campaign.js | js/game/perf.js → js/layers/atmosphere.js |
| `melee` | js/game/core/10_weapons.js | js/game/skills.js → js/layers/gore.js |
| `modelFor` | js/game/core/10_weapons.js | js/layers/gunplay.js → js/modern/melee.js |
| `stepVault` | js/game/core/09_zombies.js | js/layers/zclimb.js → js/layers/zfloors.js |
| `survFight` | js/game/core/10_weapons.js | js/layers/survwalk.js → js/layers/zfloors.js |
| `ui` | js/game/core/02_state.js | js/game/ui.js → js/game/occupation.js |
| `updComps` | js/game/core/11_companions.js | js/game/devtoolkit.js → js/layers/zfloors.js |
| `updDead` | js/game/core/04_bodies.js | js/layers/ragdoll.js → js/layers/gore.js |
| `zMove` | js/game/core/09_zombies.js | js/layers/zpath.js → js/layers/zclimb.js |
| `_stumpFor` | js/game/core/04_bodies.js | js/modern/zbody.js |
| `addSolid` | js/game/core/05_init.js | js/layers/zclimb.js |
| `addTracer` | js/game/core/10_weapons.js | js/layers/water.js (v091: a tracer that crosses a water surface splashes there) |
| `S.groan`, `S.snarl`, `S.lost`, `S.die`, `S.shot`, `S.reload`, `S.click`, `S.swap`, `S.swing`, `S.hit`, `S.hm`, `S.door`, `S.glass`, `S.hurt`, `S.voice`, `S.scream`, `S.ui`, `bird`, `spook` | js/game/core/03_audio.js (`S.hm`: js/game/skills.js) | js/game/assets.js (v092: plays the custom file for that sound when there is one, else the original) |
| `iconsChanged` | js/game/core/01_items.js | js/game/assets.js (v092: keeps the count on the Icons heading) |
| `advanceTime` | js/game/core/13_campaign.js | js/game/devtoolkit.js |
| `blocked` | js/game/core/05_init.js | js/game/perf.js |
| `breakWin` | js/game/core/04_bodies.js | js/game/perf.js |
| `buildNav` | js/game/core/09_zombies.js | js/layers/zfloors.js |
| `bush` | js/game/core/06_buildings.js | js/layers/flora.js |
| `clkVis` | js/game/core/02_state.js | js/game/ui.js |
| `dismember` | js/game/core/04_bodies.js | js/game/devtoolkit.js |
| `failJump` | js/game/core/04_bodies.js | js/layers/zknock.js |
| `fzRumors` | js/game/skills.js | js/game/missions.js |
| `fzZAct` | js/game/skills.js | js/layers/zknock.js |
| `groundAt` | js/game/core/09_zombies.js | js/game/perf.js |
| `hideLimb` | js/game/core/04_bodies.js | js/layers/gore.js |
| `hitZ` | js/game/core/04_bodies.js | js/layers/gore.js |
| `hud` | js/game/core/13_campaign.js | js/layers/hudui.js |
| `icoList` | js/game/core/01_items.js | js/game/ui.js |
| `jump` | js/game/core/10_weapons.js | js/game/devtoolkit.js |
| `look` | js/game/core/09_zombies.js | js/game/perf.js |
| `los` | js/game/core/09_zombies.js | js/game/perf.js |
| `makeArmyTruck` | js/game/core/06_buildings.js | js/layers/props.js |
| `makeCar` | js/game/core/06_buildings.js | js/layers/props.js |
| `makeHuman` | js/game/core/06_buildings.js | js/modern/zbody.js |
| `makePark` | js/game/core/06_buildings.js | js/layers/flora.js |
| `makePerson` | js/game/core/06_buildings.js | js/modern/survivors.js |
| `mesh` | js/game/core/05_init.js | js/game/perf.js |
| `mk` | js/game/core/06_buildings.js | js/game/perf.js |
| `navField` | js/game/core/09_zombies.js | js/layers/zfloors.js |
| `navSoft` | js/game/core/09_zombies.js | js/layers/zfloors.js |
| `newDay` | js/game/core/13_campaign.js | js/game/missions.js |
| `newGame` | js/game/core/02_state.js | js/game/occupation.js |
| `npcVisual` | js/game/core/10_weapons.js | js/modern/survivors.js |
| `optBack` | js/game/core/02_state.js | js/game/ui.js |
| `placeNpcs` | js/game/core/06_buildings.js | js/game/missions.js |
| `playerMuzzle` | js/game/core/10_weapons.js | js/layers/gunplay.js |
| `quietBreak` | js/game/core/06_buildings.js | js/game/perf.js |
| `rayWorld` | js/game/core/10_weapons.js | js/game/perf.js |
| `refreshContainerVisual` | js/game/core/05_init.js | js/layers/mfzprops.js |
| `renderInv` | js/game/core/12_inventory.js | js/game/skills.js |
| `shoot` | js/game/core/10_weapons.js | js/game/skills.js |
| `showPause` | js/game/core/13_campaign.js | js/game/devtoolkit.js |
| `skRecruitCheck` | js/game/skills.js | js/modern/survivors.js |
| `skShow` | js/game/skills.js | js/game/occupation.js |
| `spawnComp` | js/game/core/11_companions.js | js/modern/survivors.js |
| `spawnContainer` | js/game/core/05_init.js | js/layers/mfzprops.js |
| `spawnLimb` | js/game/core/04_bodies.js | js/modern/zbody.js |
| `startVault` | js/game/core/09_zombies.js | js/layers/zfloors.js |
| `streetLight` | js/game/core/06_buildings.js | js/game/perf.js |
| `survMeshes` | js/game/core/08_fortworld.js | js/modern/survivors.js |
| `tree` | js/game/core/06_buildings.js | js/layers/flora.js |
| `updateZombies` | js/game/core/09_zombies.js | js/game/devtoolkit.js |
| `zHpTag` | js/game/core/04_bodies.js | js/game/devtoolkit.js |
| `zombie` | js/game/core/09_zombies.js | js/game/skills.js |

### Added by `js/layers/coop.js` (v086, hand-written: regenerate the table above with `tools/arch/wrappers.js` when acorn is available)
`coop.js` loads last, so each of these runs first and passes through to the chain above unless co-op is active: `worldSteps` (seeds the build when `COOP.seed` is set), `fzRumors` (mission-site sub-seed), `modelFor` and `makeHuman` (run on a private random stream), `go`, `spawnComp` (the lent survivor is not also spawned as an AI follower), `finish` (no-op for a guest), `updateZombies` (guest: moves puppets; host: moves the guest avatar), `updComps`, `survFight`, `advanceTime`, `damage` (guest: reported to the host), `hitZ`, `dmgZ`, `killZ`, `dismember`, `shoot`, `use`, `doorOpen`, `doorClose`, `doorBreak`, `skLockpick`, and `MFZLOAD.mission` (host: picks the seed). Do not add a global that `coop.js` wraps without checking `COOP.role`.

v087 additions to the `coop.js` note: it also wraps `frozen`, `wheelOpen`, `hideLimb`, `MFZGORE.gib`, `corpseHit` and `addTracer`. Three core files call into it: `13_campaign.js` (the main loop keeps running while `COOP.run`), `loader.js` (`COOP.gate` before "Press any key", `COOP.begin` after it) and `menumusic.js` (silent while a guest loads).

Update to the `coop.js` note: it also wraps `openContainer` (container locks) and `toggleFollow`; the host now keeps `COOP.guests` (up to four slots).

Update 2: `coop.js` seeds every world the host builds (`go`, `MFZLOAD.mission`) and also wraps `animVM` (hidden for spectators). Guests are persistent: see `docs/CHANGES_v087.md`.

v089: `coop.js` also wraps `startSiege` (a siege started from the fort is armed and sent to guests like any other world) and hooks `renderer.render` once the renderer exists (spectator follow camera). `gore.js` now also wraps `dmgZ` and owns the death rules (`MFZGORE.lethal`, `MFZGORE.ctx`). Double doors: `mkDoor` takes an options object and returns the door; doors may carry `pair`, `slide`, `lf`, `lx` (see `docs/CHANGES_v089.md`).
