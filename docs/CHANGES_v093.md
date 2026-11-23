# Mini Fort Zombie v093: vehicle cabins, vehicle collision, pools you can get into, deeper water

Everything in `docs/CHANGES_v092.md` still applies. No save format or co-op protocol change.

## 1. Vehicle cabins (all 33 models)

The fault behind every screenshot was one thing: the cabin (the glass and roof) stood on the very top of the body's rounded shoulder, where the body is only about two thirds of its width. The seats, dash and steering wheel were sized to the body, so they stuck out of the glass; the mirrors were placed at a height and distance that landed on the raked windscreen.

Changed in the generator (`tools/retro50_src/r50_core.js`, rebuilt into `js/modern/retro50.js`), so it applies to every model at once:

- **The cabin is bigger.** It starts 7 cm lower, inside the shoulder where the body is wider, and is 8% wider (never wider than the body under it). `lowerBy` / `wide` on a model's `cab` override this.
- **Seats fit the cabin.** Each seat is measured against the inside of the glass at its own position: its back is no taller than the roof allows there, and the seat is narrowed or moved inboard until it clears the side glass. A seat that cannot fit at all is left out.
- **The dash** starts where the raked screen is high enough to clear it and is as wide as the cabin is at that point.
- **The steering wheel** moves back until its rim clears the screen, then inboard until it clears the door glass.
- **Mirrors** sit at the leading edge of the door, never forward of the top of the screen. A car's round mirror is on the door skin under the glass; a truck's big mirror is on the cab side at its own height.
- **Limousine:** the partition behind the driver was one slab as wide as the body, and its corners came out through the rear door glass. It is cut to the cabin's width at each height.

Open cars (roadster, cabriolet, targa, jeep) have no glass to fit to and are unchanged apart from their mirrors.

## 2. Vehicle collision (every vehicle, including street cars, the army truck and wrecks)

Before, each vehicle was one box: as long and wide as the model's listed size (mirrors and bumper tips included), grown to its map-aligned bounding box when the car was turned (street cars are parked up to 17 degrees off square, so always), solid to 55% of its height with a "walkable" lid at full height. Hence stopping well short of a car, and landing inside one after a jump.

Now (`MFZV.collide` in `js/layers/vehicles.js`; `js/layers/props.js` uses it for the street cars and army trucks):

- The model is measured once: its triangles are drawn from above into a height map, read in 25 cm cells. A cell is solid if the model covers at least a third of it, and as tall as the model is there.
- Thin parts are left out: aerials, exhaust stacks, mirrors, door handles. So is anything that only hangs overhead (above 1.85 m).
- Neighbouring cells of about the same height become one box, solid from the ground to its real top. A sedan is about 17 boxes: bumper, bonnet, cabin, boot at their own heights.
- You can stand against the paint, step from bonnet to roof, stand on either, and a pickup's bed is lower than its cab.
- A turned vehicle uses 50 cm cells (collision boxes cannot rotate); they follow the outline to within about 6 cm. About 50 boxes for a car, 100 for a bus. Collision lookups already go through the perf layer's spatial grid.

Measured on all 34 kinds, square and turned: collision width, height and length are within 4 cm of the model (2 to 9 cm inside the paint at the sides). What is left uncovered is a sliver under 10 cm along the edge of a few truck bodies.

Not changed: the player's own collision radius (0.4 m), which is the remaining distance between you and the paint, and the 0.3 m ledge margin the game gives every solid when you stand on it.

## 3. Pools you can get into

- **Motel pool.** The invisible block over the pool is gone. The deck round the kidney outline is now solid (it was only drawn), and there is a tiled step under the ladder to climb out by. Ground cover no longer grows in the pool.
- **House above-ground pool.** It was one solid block (you stood on the water). Only the wall ring is solid now; the ladder is three real steps up the outside and three steps inside bring you back out.
- **Park pond.** Its blocker is removed: you wade in from the bank.

## 4. Deeper water

The game's ground cannot go below y = 0, so depth is done two ways:

- **How deep it looks** (`bed`): motel pool 0.36 to 1.3 m, pond 0.6 to 1.0, stream 0.35 to 0.6, fountains 0.3 to 0.5, puddles 3 to 7 cm.
- **How deep it is for walkers** (new `sink`): in deep water the player's eye is lowered (up to 0.9 m in the pool: neck deep) and zombies and followers are drawn lower by the same amount, eased in and out. `sinkSlope` makes a pond or stream shelve from the bank; a pool is full depth at the wall. Jumping lifts you out of it.

| Water | Looks | You sink |
|---|---|---|
| Motel pool (full / green / ruined) | 1.3 / 1.1 / 0.3 m | 0.9 / 0.8 / 0.25 m |
| House pool | 0.94 m | 0 (you stand on its real floor, chest deep) |
| Pond | 1.0 m | to 0.9 m, shelving |
| Stream | 0.6 m | to 0.4 m |
| Puddles | 7 cm | 5 cm |

Game logic never sees the lowering: walkers are moved down just before a frame is drawn and put back before the next tick.

## Code
- `tools/retro50_src/r50_core.js`, `r50_cars3.js` then `build.sh` (the source and `js/modern/retro50.js` are in sync).
- `js/layers/vehicles.js` (`MFZV.collide`, `MFZV.profile`), `js/layers/props.js`.
- `js/layers/water.js` (`sink`, `sinkSlope`, `MFZWATER.sinkAt`, `MFZWATER.over`), `js/game/core/13_campaign.js` (the eye follows `G.wade`), `js/layers/detail.js` (no ground cover over water).
- `js/layers/motel.js`, `js/layers/halfhouse.js`, `js/layers/newlots.js`.

## Tested (headless Chromium, software GL)
- Every vehicle rendered from the driver's front quarter at eye level and looked at: nothing comes through the glass, mirrors are on the doors or cab sides.
- Collision audit on all 34 kinds at 0 and 17 degrees: box extents against the model, holes, boxes over empty air; standing height on roofs; collision boxes drawn over six models and looked at.
- Motel pool: floor reachable, deck solid at 0.5 m, step at 0.26 m, sink 0.9 m, rendered from the deck and from inside. House pool: wall 1.15 m, steps 0.3 / 0.6 / 0.9 outside and inside, floor inside. Pond rendered from inside.
- `lotcheck.py` on the motel, both houses, both parks, the forest and the laundromat: no errors.

## Not tested
- **Walking it by hand.** The player's eye lowering in deep water could not be exercised headless (the movement code does not run without mouse capture); the value it follows (`G.wade`) was checked. Climbing the steps, jumping onto cars and walking past turned cars were checked through the collision functions, not by playing.
- Zombies wading (their lowering was not seen in a render).
- Frame rate in a full town with the extra collision boxes, on a real GPU.
- Dusty, wrecked and burnt variants of each model were not looked at one by one (they are built from the same cabins).

## Small fixes (version number unchanged)
- **Press any key (mission loading screen):** the click that dismisses it no longer reaches the game as an attack (its mouse events are eaten for 0.45 s; the pointer lock could be granted before that click's mousedown arrived, so it swung at once). `js/game/loader.js`.
- **Water sounds:** bullets / objects hitting water (`S.splash`, small and heavy) and wading footsteps (`S.wade`, shallow and deep) are real synths now; the old faint noise burst was inaudible. `js/game/core/03_audio.js`, `js/layers/water.js`.
- **Zombie attack sounds:** hitting a door, window or barricade is `S.zbash` (thud + grunt, with glass / plank variants); claws or teeth landing on a person is `S.zclaw`. The snarl stays for sightings, tackles and climbs. `js/game/core/09_zombies.js`.
- **Game Assets > Sounds:** eight new slots (3 zombie bash, claw, 2 splash, 2 wade) so they can be replaced, exported and cleared like the rest. `js/game/assets.js`.
- **Burgerama:** the tree directly in front of the BURGERAMA sign moved to the lawn by the drive-thru lane, (8.0, 12.6). `js/layers/burgerjoint.js`.
