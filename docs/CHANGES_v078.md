# Mini Fort Zombie v078: the 1950s retro fleet

Every car, van, bus and truck in the game is now a detailed 1950s design: chrome bumpers with bullet guards, tail fins, whitewall tyres, two-tone paint, wood-panelled wagons, wire wheels, wrap-around windscreens, hood ornaments and fittings you can find from any angle. They keep the old behaviour: any model turns up in many colours, and street cars come clean or dusty/weathered like before.

## The 25 body types (as in the type-of-cars chart)
| Type | Model | What it is |
|---|---|---|
| Micro | `micro` | Bubble microcar: egg body, glass canopy, narrow rear track, roof luggage |
| Sedan | `sedan` | Four-door "Bel Air" style: fins, bullet bumpers, side sweep, fender skirts, rocket ornament |
| Hatchback | `hatchback` | Small 4CV-style hatch with roof rack and suitcases |
| Universal | `universal` | Wood-panelled station wagon, rack and luggage, tailgate window |
| Liftback | `liftback` | Fastback with a long sloping tail and a lift hatch |
| Coupe | `coupe` | Pillarless hardtop with wrap windscreen and a stainless roof band |
| Cabriolet | `cabriolet` | Big-finned convertible, top folded under a vinyl boot, bench seats |
| Roadster | `roadster` | British two-seater: wire wheels, lamp stalks, bonnet strap and louvres, spare, tonneau |
| Targa | `targa` | Open-roof tourer with a fixed rear hoop and porthole windows |
| Limousine | `limousine` | Stretched formal car: landau bars, partition, long fins |
| Muscle car | `muscle` | Hot-rodded hardtop: hood scoop, racing stripes, side pipes, fat rear mags, race roundel |
| Sport car | `sportcar` | Rounded rear-engined fastback with engine louvres |
| Super car | `supercar` | Gull-wing grand tourer: eyebrow wings, bonnet louvres, door cut lines, side pipes |
| SUV | `suv` | Boxy truck-based estate: barn doors, running boards, roof spare |
| Crossover | `crossover` | Raised bathtub wagon with bull bar and roof rack |
| Pickup | `pickup` | Wood-floor stepside half-ton with chrome rails, tailgate chains |
| Van | `van` | Corrugated panel van with a snout nose and barn doors (takes a shop `label`) |
| Minivan | `minivan` | Forward-control people carrier with big glass and a vee nose |
| Minibus | `minibus` | Long 15-seater with a window run, roof rack and rear ladder |
| Campervan | `campervan` | Pop-top camper: striped awning, table and chairs, bicycle on the roof, spare on the nose |
| Bus | `bus` | City transit coach: destination board, folding doors, rear engine louvres |
| Tow truck | `towtruck` | Two-tone wrecker: A-frame boom, winch, hook, amber beacon |
| Mini truck | `minitruck` | Kei-style cab-over flatbed with stake sides and crates |
| Dump truck | `dumptruck` | Tandem-axle hauler: ribbed bed, cab guard, hoist ram |
| Standalone truck | `truck` | Bobtail tractor: long hood, chrome stacks, fifth wheel |

## Offshoots and others
`ambulance` (white with red stripe, light bar, crosses), `firetruck` (open-cab pumper: ladders, hose bed, pump panel, bell and siren), `schoolbus` (yellow, black rub rails, stop arm, roof lamps), `police` (black and white, beacon, siren, spotlight, door lettering), `taxi` (yellow, checker band, roof sign), plus `jeep` (slab-sided utility), `army` (6x6 cargo truck with canvas tilt), `boxtruck` (delivery box truck) and `wreck` (burnt out, black glass).

## Colours
Each vehicle has a PRIMARY paint and an ACCENT paint (roof, side sweep, fenders, bed). Pick a 50s scheme with `ci` (14 schemes: Tropical Turquoise, Cherry Red, Flamingo Pink, Sea Foam, Sunburst Yellow, Sky Blue, Admiral Blue, Coral, Charcoal & Rose, Pistachio, Lilac, Cream & Cherry, Forest Green, Dusty Rose), or pass any `[r,g,b]` as `tint` (the accent is derived) or your own `accent`. All the code that already passes a `tint` colour keeps working. Colour is applied per instance, so a model's geometry is built once and shared by every colour.

## How it plugs in
- `js/modern/retro50.js` (new): the generator. Builds on the Modern prop kit (`RGPK`). `RGPK.PF.retro(kind, {dust, wreck})` is the prefab, `RGRETRO` has `paints`, `tint()`, `meta`, `decals`, `street()`.
- `js/layers/props.js`: ordinary `makeCar` / `makeArmyTruck` vehicles in the world are swapped for retro ones (weighted street mix of all models), and the collision box is resized to the model. New materials: `chrome`, `carpaint2`, `dustpaint`/`dustpaint2`, `retroglass`, `whitewall`, `vinyl`, `brass`.
- `js/layers/vehicles.js`: `MFZV.make(kind, x, z, rot, opts)` now knows every kind above. Existing kinds (`civilian`, `wreck`, `jeep`, `taxi`, `police`, `van`, `boxtruck`, `ambulance`, `firetruck`, `army`) keep their names and options. Old model names (`sedan hatch suv mpv cross offroad`) still work for `civilian`. Lettering and emblems are placed from the real body surface.
- `js/modern/propkit.js`: exposes a few internals (`RGPK.I`) for the generator. `PlayGame.html` loads `retro50.js`.
- `tools/retro50_src/`: the readable source parts; `build.sh` concatenates them into `js/modern/retro50.js`. Edit a model by changing its spec (a handful of numbers: length, width, roofline, window runs, fittings) and rebuild.
- Version is 078 in the page title and `VERSION`.

Preview images are in `docs/retro_fleet/`. Models are 11k to 23k triangles (the old cars were about 7.5k); the bus and school bus are the heaviest.

## Wrecks: burnt-out, rusted-out and crashed versions of every vehicle
Any vehicle kind can be spawned wrecked: `MFZV.make('sedan', x, z, rot, {wreck: 'burnt' | 'rusted' | 'crashed' | true, seed: 0..2, ci: paint})`. `true` picks a style at random; `seed` picks the damage variant. The old `wreck` kind still works and now picks any of the 12 wreck-friendly models and any style. The wreck keeps the model's paint scheme under the damage.

- **burnt**: charred black shell with rusty patches, all glass gone, burnt interior, canvas burnt away, melted tyres, a mild crumple.
- **rusted**: decades of rust (orange and brown over faded paint), holes in the roof, flat tyres, dirty cracked glass, torn canvas, sagging body.
- **crashed**: crushed nose (or tail), a dented flank and caved roof, scuffed bare metal, smashed glass, flat or missing wheels and a rolled stance.

They are built by `wreckify()` in `tools/retro50_src/r50_wreck.js`: geometry is deformed (crush, normal dents, sag, roll), triangles removed (glass, canvas, rust holes, missing wheels), normals recomputed and weathering baked into the vertex colours. About 14% of the cars the world spawns are now wrecks (burnt, rusted or crashed).

## Anatomy pass (all models audited from four angles)
- **Cockpits:** open cars (roadster, cabriolet, targa, jeep, fire engine) now have a sunken cockpit with coaming walls, a padded roll, a carpeted floor, seats at the right height, a dash pod, gear lever and a steering wheel that is lowered, tilted top-forward and joined to its column. Closed cars have a compact interior, low seat backs and a lower steering wheel.
- **Mirrors:** rebuilt as a base pad on the actual door or pillar skin, an arm, and a round head (or a rectangular truck mirror on two arms). No more floating mirrors.
- **Spare tyres:** every spare now sits on a bracket (roadster, jeep, campervan, army truck on the tail; SUV lying flat on its rack with straps).
- **Other:** mud flaps hang from the bed/frame, the camper has a real bicycle strapped on its roof, truck exhaust stacks reach the chassis, bus and minibus destination boards sit inside the windscreen header, and a floating route lamp was removed.
