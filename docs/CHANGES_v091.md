# Mini Fort Zombie v091: water (pools, ponds, fountains, the stream, rain puddles)

Everything in `docs/CHANGES_v090.md` still applies. No save format or co-op protocol change. Water is visual only: it does not collide, slow anyone down or make noise that zombies hear.

## Where it comes from
The water is a port of the water in **Riposte: Frontline 5.6.0** (MIT licence, (c) 2026 BenDBSS; licence text in `docs/licenses/RIPOSTE_FRONTLINE_LICENSE.txt`). Riposte has two water systems:

| Riposte | What it is | Used by | In MFZ |
|---|---|---|---|
| The sea (`waterSetup` / `waterBuild`, `src/02m-water.js`) | One big plane with Gerstner waves, a distance field to the quays for foam and near reflections, a sky cube map, floating boats | Meltem (the sea along the west quay), Kervénec (the port) | **Not ported.** MFZ has no sea or lake. See "Not done" |
| Small waters (`pondAdd`, same file) | A flat mesh per water: depth from the distance to the bank, Beer-Lambert transparency, Fresnel, caustics, scrolling ripples, jet rings | Simoun (the oasis you wade through), Meltem (wells, the trough), the garden maps (fountains, canal, stream, ponds), the port (puddles), French Dream (pool) | **Ported**: this is MFZ's water |
| The ripple field (`src/02mb-ondes.js`) | A 32 m window round the camera running the wave equation on the GPU; footsteps, shots and jets make rings that bounce off the banks | Every map with water | **Ported** |
| The `ripple` surface of the texture lab (`src/02b-texlab.js`) | The ripple normal map, the caustic net and the foam pattern, generated on the GPU at load | Every water | **Ported** |

## What MFZ gets (`js/layers/water.js`, global `MFZWATER`)
- **One water for everything.** A pool, a pond, a fountain, a stream and a puddle are the same shader with different numbers (`MFZWATER.kinds`: `pool`, `green`, `pond`, `fountain`, `stream`, `puddle`, `stagnant`).
- **Depth and transparency.** You see the pool tiles through thin water; the water turns opaque and darker where it is deep. At a glancing angle it mirrors the sky.
- **Caustics** on the bed in sunlight, shadowed like any other sunlight, gone at night.
- **Ripple field.** Walking through water leaves a wake (the player, zombies and followers). A bullet that crosses a water surface throws droplets and rings, with a splash sound. Fountain jets ring the basin. Rings bounce off pool walls. Still water costs nothing: the field sleeps 6 s after the last disturbance.
- **Rain.** Rain rings on every water surface while it rains.
- **Rain puddles.** A wetness value rises over about 40 s of rain and falls over about 5 minutes afterwards. Puddles grow from their middle and dry back. They sit on fixed spots (a 7 m grid, the same for every co-op player) that pass a test: five rays from above must land on flat ground at one height, so no puddles under roofs, awnings or cars, across kerbs or inside another water. Up to 26 are drawn round the player, within 30 m. A world that starts in the rain starts wet.

## Changes against Riposte
- **Sky reflection** comes from the atmosphere layer's current sky colours (zenith, mid, horizon, with the cloud cover mixed in and lightning flashes), not from a cube map baked at load: MFZ has a day cycle and changing weather, so a baked map would go stale.
- **No scene reflection probes** (Riposte's `waterProbes`: trees and walls mirrored in a pond). See "Not done".
- **Colours** are MFZ's raw display colours. MFZ's renderer applies no gamma or tone mapping, so Riposte's linear colours and its `tone` factor were replaced, and the sun's mirror glint is capped (uncapped, it fed the bloom pass a white blob).
- **Rain rings** and the **growing puddle** (`uPFill`) are new. Riposte's puddles are fixed decor.
- **The bank mask** of the ripple field is drawn each time the window moves (the water meshes seen from above) instead of one mask for the whole map: an MFZ town is too big for one.
- **A thin film mirrors more head-on** (`f0`), and the mirror fades out at the bank: without them a puddle on dark asphalt under a dark sky was either invisible or a bright outline.
- Lot water is added inside the lot's group, then moved to the world as its own mesh before the perf pass merges the lot.

## Where there is water now
| Place | Before | Now |
|---|---|---|
| Inn-and-Out Motel, kidney pool | Drained, a painted green patch | Intact: full and clear. Looted: green, lower. Ruined: a stagnant layer over the leaves |
| Half-plot houses, above-ground pool | A flat see-through blue disc | Water 0.94 m deep; green in a looted or ruined house |
| Town Park / Dead Park, pond | A flat blue (or green) disc | A pond with shallow banks over a mud bed |
| Town Park / Dead Park, fountain | A flat blue disc | Water with a jet (still and green in Dead Park) |
| Park gardens (flora), fountain and birdbath | Flat blue discs | Water; the fountain's top bowl has a jet |
| Campsite Woods, stream | 13 blue tiles | One ribbon of running water |
| The Final Load and Kebabsolutely / Nightmare on Wok Street, back yards | Flat dark discs | Standing puddles |
| Open ground everywhere | Nothing | Rain puddles in a storm |

## Using it in a lot
```js
// in the lot's placement function (the one that has B), not in the cached decor builder
MFZWATER.add({kind: 'pool', parent: B.g, shape: 'rect', x: 4, y: 0.4, z: -6, w: 8, d: 4, bed: 1.2});
MFZWATER.add({kind: 'pond', parent: B.g, shape: 'poly', poly: [[x, z], ...], y: 0.06});
MFZWATER.add({kind: 'fountain', parent: B.g, shape: 'disc', x: 0, y: 0.52, z: 0, r: 1.6, jet: 0.6});
MFZWATER.add({kind: 'stream', parent: B.g, shape: 'poly', poly, y: 0.08, flow: [0.3, 0]}); // flow in m/s, lot coordinates
MFZWATER.puddle(B.g, x, z, w, d, rot, seed, y); // a standing puddle
```
`y` is the water surface. `bed` is how deep the water looks (and how deep walkers are taken to be), `slope` how fast the banks drop from the edge, `vis` the distance over which the water turns opaque, `murk` a minimum opacity. The real floor under the water must exist (pool tiles, a mud disc): the water is see-through. The header of `water.js` lists every option.

## Settings
Options > Graphics > Surfaces & detail: **Water** (Full / Simple: Simple stops the ripple field, the caustics and the droplets) and **Rain puddles** (On / Off). Saved with the other graphics settings (`RGFX.s.water`, `RGFX.s.puddles`).

## Cost
One extra shader for all water, one for the ripple step, one for droplets (three programs, compiled once). Two 256 x 256 half-float targets and a 256 x 256 mask for the ripple field, two 512 x 512 textures generated at start-up. One draw call per water in view. Puddle spots are tested one per frame (five rays) while it is wet.

## Not done
- **The sea** (Gerstner waves, shore foam from a distance field, floating boats). It needs a map with a coast. The code to port is `waterSetup` to `waterUpdate` in Riposte's `src/02m-water.js`.
- **Scene reflections** (Riposte's `waterProbes`): a pond only mirrors the sky, not the trees or the motel wall behind it. A probe baked at load would be wrong at night; it needs re-baking as the light changes.
- **Gameplay**: wading does not slow the player or zombies, splashing makes no noise zombies react to, and nothing floats. Corpses and dropped items do not splash.
- **Wet ground**: surfaces do not darken in the rain; only the puddles show it.
- Dev Mode has no water entry (water is not spawnable content); the weather switch there drives the rain puddles.

## Tested (headless Chromium, software GL)
- `tools/arch/lotcheck.py` on every changed lot: `sunshine_motel`, `laundromat`, `mr_foos_takeout`, `forest_b`, `town_park`, `dead_park`, `medium_house`, `small_house`. No errors or warnings.
- Dev building-lab worlds with `?shadercheck`: no shader errors, no page errors. The water moves out of its lot group and survives the perf pass. Shader count in the motel world: 49 to 53 programs.
- Renders: motel pool (clear, storm, ruined), a wake while wading, a bullet splash (droplets and rings), Town Park pond and fountain (clear and storm), Campsite Woods stream, rain puddles on a path, on bare ground and after the rain under a clear sky.

## Not tested
- A real GPU, and frame rate. Software GL can't say what the ripple field and 26 puddles cost in a full town.
- A full town (expedition) build and a co-op session.
- Night, torch light on water, and the lightning flash in the reflection.
- The house pool and the yard puddles were built without errors but not looked at in a render.

## Files
New: `js/layers/water.js`, `docs/licenses/RIPOSTE_FRONTLINE_LICENSE.txt`. Changed: `index.html` (script tag, version), `js/layers/graphics.js` (two settings), `js/layers/motel.js`, `js/layers/halfhouse.js`, `js/layers/flora.js`, `js/layers/newlots.js`, `js/layers/finalload.js`, `js/layers/kebabwok.js`, `js/game/core/01_items.js` (version), `ARCHITECTURE.md`, `docs/FEATURES.md`.
