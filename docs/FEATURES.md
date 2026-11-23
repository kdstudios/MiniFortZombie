# Mini Fort Zombie: building feature catalogue

Use this to reuse what's already been built instead of reading whole building files. Each full-block layer is 1,200-2,100 lines, so **never read a whole one**. Find the feature here, then `grep -n` the section text or helper name in that file and read only that stretch.

- Shared lot plumbing (plot, sidewalk props, walls, loot, zombies, registration) is in `js/props/lotkit.js` (`LOTKIT`, alias `LK`). The prop toolkit (`MFZK`, alias `K`: `K.builder`, `K.mat`, `K.surf`, `K.paint`, `K.tri`...) is in `js/props/mfzkit.js`.
- **Template for a new building: `js/layers/church.js`** (the only layer on the lot kit so far). Copy its skeleton: header comment → constants → artwork → `SURF` / `surf` → `build()` → `bXxx(x, z, t)` → `LK.register`.
- Ready-made loot props for `SP(...)` (`bookshelf`, `dresser`, `cash_register`, `display_case`, `gun_rack`, `gun_cabinet`, `dumpster_blue`, `cardboard_box_*`, `shop_shelves_half`, `trunk_steamer`, `church_podium`...) come from `js/props/mfzm_*.js` (storage, office, kitchen, outdoor). Check a name with `grep -l "'name'" js/props/mfzm_*.js`; don't read those files whole.
- The bottom half of this file is generated: `python3 tools/arch/features.py . > /tmp/f.md`, then paste it below the marker after adding a building.

## Find by feature
| Feature | Where (file → section text or helper) |
|---|---|
| **Sidewalk props** (street light, meter, hydrant, traffic signal, no-parking) | `lotkit.js` → `LK.lightPole`, `LK.meter`, `LK.hydrant`, `LK.signal`, `LK.noParking` |
| Bus shelter, bus stop, mailbox, power pole | gasstation → `sidewalk: bus shelter`; gunshop → `sidewalk: bus shelter, street light, no parking sign, power pole` |
| Benches, bins, mailbox, carts at a shopfront | hardware → `shopfront walk` |
| Parking lot stripes, chain posts, asphalt everywhere | church → `grounds`; cerberus → `ground: asphalt everywhere` |
| Lot fence / board fence / chain-link | burgerjoint → `fence round the lot`; church → `side lawn`; surfaces `fence`, `chain` (gunshop, motel) |
| Hedges, lawns, trees | church → `side lawn` + `LOTTREES` / `bldTree`; motel → `perimeter brick walls + hedges`, `courtyard tree` |
| **Exterior walls**: brick, painted brick, stucco, clapboard, siding, tilt-up | surfaces `brick` (gunshop, bowling, cinema, hardware, motel), `gbrick` (cerberus), `stucco` (supermarket, sporting), `clap` (church), `siding` (motel), `tilt` (sporting) |
| Parapet + coping, cornice | gunshop → `store: grey brick skin, parapet, coping`; cinema → `facade skin`; hardware → `exterior skin` |
| Pitched / hipped / mansard roofs, shingles | church → `roof: shingle planes`; motel → `hipped roofs`; burgerjoint → `roof: mansard` |
| Tower, spire, belfry, bell | church → `tower` |
| Canopy / awning / walkway columns | hardware → `canopy`; gunshop → `storefront: awning, bars`; motel → `walkway columns, fascia, soffits`; gasstation → `canopy, islands, pumps` |
| **Looted / ruined versions** (v089): automatic for every lot on the prop kit | `js/props/condkit.js` (nothing to add in a layer; build with `LK.geo` or a `K.builder` and keep doors in `WL` so the clear zones exist). Check with `tools/arch/lotcheck.py` and in game via Dev Mode at each condition |
| **Real vehicles in a lot** (v090) | `LK.vehicle(B, kind, lx, lz, ry, opts)` (any `MFZV.kinds`; `label`, `labelCol`, `labelBg`, `tint`, `wreck`, `y`); a ruined lot gets a burnt wreck unless `opts.wreck` is set. Used by bowling, sporting, motel, hardware, gasstation, gunshop, supermarket, cinema |
| **Signs on doors / windows** (v090): automatic | `LK.openings` (run on every NEWCAT lot build): decor lying on a door leaf moves onto the leaf; painted decor on a window pane moves onto the pane (double sided, gone when it breaks). Fixed posts between a double door's leaves are dropped. Nothing to add in a layer |
| **Loot in a fitted lot** (v090) | `rc()` in a lot with merged decor puts its loot into the lot's own containers (no free-standing crate in the aisles); place containers with `SP` against walls. A cash register on a counter (`y0` ≥ 0.5) hides its floor stand and sits on the counter top |
| **Door clear zones** (v089) | `MFZCOND.zones(B)` → `[x0, x1, z0, z1, kind, wall]` per door / gate, 1.4 m each side; keep props out of them |
| **Double doors** (v089): swinging pair, or glass sliding shop doors | core `WL`: two neighbouring door ops `{k: 'd', c, dbl: 'swing'}` / `{..., dbl: 'slide'}` (at most 1.75 m apart; skins and linings keep treating them as plain `'d'`). Used by church (tower), cinema (front + auditorium), bowling, burgerjoint, supermarket (front slide, back room swing), hardware, sporting |
| Entrance portal, glazed shopfront, window trim | burgerjoint → `entrance portal, canopy, window trim`; supermarket → `facade` (entrance tower) |
| **Signs**: pole sign, pylon, blade sign, marquee, roof sign, sun sign | gunshop → `pole sign`; gasstation → `price pylon`; cinema → `blade sign + V marquee` (`marqueeBoard`); motel → `INN-AND-OUT sun sign`; burgerjoint → roof sign |
| Logos painted in code | `drawLogo` (gasstation, gunshop, bowling, supermarket, hardware), `logoTex` (burgerjoint, sporting), `signTex` / `emblemTex` (cerberus) |
| Posters, menu boards, message board | `poster` (sporting), `POSTERS` / `posterMat` (cinema), `menuTex` (burgerjoint), church → `message board` |
| Stained glass, lancet / gothic windows | church → `lancetPath`, `stained`, `leadTex` |
| Statues / big sculpts | church → `praying-hands statues`; burgerjoint → `Bruno the Bear` (`drawBear`, `fur`) |
| Water tower | cerberus → `water tower` |
| **Interior lining** (wainscot, rail, plaster, tile) | `LK.lineWall` with a per-lot `span`; examples: church (wainscot + mouldings), burgerjoint (subway tile), cinema (`redwall`) |
| Floors: checkerboard, marble, carpet, maple, lino, quarry tile | burgerjoint `checker` / `quarry`; church `marble`; bowling `maple`, `carpet`; cinema `carpet`, `lino` |
| Ceilings & lights: drop ceiling, fluorescents, pendants, chandeliers, sconces | burgerjoint → `light: panels + globe pendants`; church → `interior` (chandeliers); cinema → `lobby interior` (sconces, light boxes) |
| Open roof trusses | church → `interior: floor, wainscot, plaster, mouldings, trusses` |
| **Counters**: service, checkout lanes, cash wrap, front desk, reception | burgerjoint → `service counter`; supermarket / hardware → `checkout lanes`; sporting → `cash wrap`; bowling → `front desk + shoe cubbies`; cerberus → `reception`; gasstation → `checkout counter + back bar` |
| Shop shelving, gondolas, pegboard, wire bins | hardware → `gondola aisles + pegboard`; sporting → `balls: gondolas + wire bins` |
| Clothing racks, mannequins | sporting → `apparel: round racks + T-racks` |
| Gun displays, rifle wall, ammo shelves, target stands | gunshop → `rifle wall`, `display counters`, `target stands`; `longGun` |
| Shooting range | gunshop → `range behind the store` |
| Gym equipment | sporting → `the DEAD WEIGHT gym corner`, `dumbbell` |
| Camping / outdoors (kayaks, tents, rods, coolers) | sporting → `outdoors`; hardware → `camping & sports` |
| Restaurant seating: booths, tables + chairs, café | burgerjoint → `booths`, `freestanding tables with wire chairs`; bowling → `café: gingham tables`, `window booths` |
| Commercial kitchen, walk-in freezer | burgerjoint → `kitchen`, `walk-in freezer interior`; bowling → `snack bar` |
| Food displays: deli case, produce stands, soda / slush / hot dogs | supermarket → `deli counter`, `produce stands`; gasstation → `soda fountain, slush machine` |
| Shopping carts | supermarket → `shopping carts` |
| Pews, altar, pulpit, organ, chancel | church → `pews`, `chancel` |
| Cinema seats, stage, projection booth | cinema → `auditorium` (`seatRow`), `projection booth` (`projector`) |
| Stairs and upper floor | cinema → `stairwell`, `upstairs` |
| Bowling lanes, pins, ball racks, arcade cabinets | bowling → `lanes`, `window booths along the front, house-ball racks, arcade cabinets` |
| Offices: desk pods, meeting room, lounge, monitors | cerberus → `open floor: desk pods`, `glass meeting room`, `lounge + kitchenette`; `officeChair`, `monitor`, `sofa`, `plant` |
| Manager's office, safe, CCTV, staff room, lockers | cinema → `manager's office`, `staff room` |
| Motel rooms, laundry, linen | motel → `room interiors (one template per room)`, `laundry`, `linen store` |
| Pool | motel → `pool deck, drained kidney pool` (v091: it holds water, `MFZWATER.add` in `bMotel`); halfhouse → `MODS.pool` + `yard` |
| Water of any kind: pool, pond, fountain, birdbath, stream, puddle (v091) | `js/layers/water.js` → `MFZWATER.add({kind, parent: B.g, shape: 'disc' / 'rect' / 'poly' / 'blob', x, y, z})`, `MFZWATER.puddle(B.g, x, z, w, d, rot, seed, y)`; looks: `MFZWATER.kinds` (`pool`, `green`, `pond`, `fountain`, `stream`, `puddle`, `stagnant`). Examples: motel (pool), newlots → `parkLot` (pond, fountain), `bForestB` (stream), flora → `PR.fountain`, `PR.birdbath`, finalload / kebabwok → `YARD_PUDDLES` |
| Restrooms | burgerjoint, bowling → `restrooms`; hardware → `stock room` |
| Stock room, racking, pallets, boxes | hardware / sporting → `stock room`; supermarket → `back of house` |
| Loading dock, shutters, dumpster corner | supermarket → `back: loading dock`; hardware → `back: shutters, dock bumpers`; gasstation → `behind the store` |
| Service bay / garage | gasstation → `service bay` |
| Lumber, paint, garden, tyres, appliances | hardware → `lumber rack`, `paint section`, `garden`, `tyre stacks`, `appliance wall` |
| **Vehicles & wrecks** | gunshop → `parked sedan`; gasstation → `wrecks behind jersey barriers`, `sedan`, `van`; bowling → `pickup`; supermarket → burnt box truck; retro cars → `js/modern/retro50.js` API (don't open; see ARCHITECTURE) |
| Fuel pumps, propane tanks | gasstation → `canopy, islands, pumps`, `propane tanks` |
| **Half-plot houses** (5 floor plans, one / two storey, mirrored, per-house paint palette) | halfhouse → `PLANS`, `palette`, `SLOT` (materials swapped per house at `attach`) |
| Residential stairs with balusters + handrail, landing rail round a stairwell | halfhouse → `interior` (`cutHole`, `runRail`); collision in `structure` |
| Room furnishing by room type: lootable props along walls (dodging doors / windows) + core furniture | halfhouse → `ROOMS`, `wallSpots`, `furnish` |
| **Graves**: 15 marker kinds (round, gothic, ogee, square, slant, cross, Celtic cross, angel, lamb, flat, broken, toppled), plots, kerbs, flowers / wreaths / grave lanterns, engraved faces | cemetery → `grave`, `pickKind`, `engraving`; burst-open graves `burst`; dug graves `pit` (in `monuments`) |
| Wrought-iron railings with spear tips and stone piers, iron gate leaves, scrolled arch sign | cemetery → `railings` (`run`, `pierAt`), `gate` |
| Mausoleum (portico, fluted columns, pediment, crypt niches, sarcophagi, altar), gothic vault, obelisks, table tombs, war memorial, family plot with chains | cemetery → `mausoleum`, `interiors`, `vault`, `monuments` |
| Old iron lamp posts, stone benches, birdbath; lootable `coffin` and `funeral_urn` props (table 'cemetery') | cemetery → `dressing`; `K.def('coffin')`, `K.def('funeral_urn')` |
| Attached garage (drive-in opening, flush slab, rolled-up door), detached rear garage on the alley, dropped kerb at a driveway | halfhouse → `withGarage`, `interior` (garage block), `frontYard` (kerb / apron) |
| Back-yard pieces (above-ground pool, shed, swing set, veg bed, barbecue, clothesline), USPS box, school-crossing sign | halfhouse → `MODS` (`mod(name)`, attached with an offset), `yard` |
| Porches (full, portico, stoop, hood), gambrel / gable / hip roofs, picket / chain-link / board fences | halfhouse → `porchBuild`, `roofs`, `frontYard` |
| Scorch / damage / props in a vault | cerberus → `studio exterior` (scorch); cinema → `prop vault` |
| Tile pent roof / covered walk wrapping a corner on block piers, split-face block + stucco skin | pawnshop → `covered walk: tile pent roof`, `exterior skin`; surfaces `block`, `stucco`, `tile` |
| Window wraps, posters, neon signs, channel letters (helpers) | pawnshop → `poster`, `neon`, `letters`, `balls` (three gold balls) |
| Parking stalls with wheel stops, disabled bay + sign, lane arrows | pawnshop → `parking: stalls, wheel stops, disabled bay, lane arrows` |
| Lit glass wall cabinets, jewellery showcases, power-tool tables, TV wall, guitars / amps / drum kit, bikes | pawnshop → `wall of lit glass cabinets`, `jewellery island` (`showcase`), `power-tool tables`, `instruments corner + TV wall`, `bike` |
| Pawn / buying counter behind a security screen with transaction trays | pawnshop → `the BUYING COUNTER` |
| **Laundromat**: coin-op front-loader bank on a tiled plinth (lootable `fl_washer` prop shares the decor geometry), stacked dryer columns, folding island, laundry carts, moulded chair row, change / soap vends | finalload → `The Final Load hall`; `washerGeo`, `K.def('fl_washer')` |
| **Nail salon**: lit polish-bottle wall (painted niche), tub chairs with gold bands, manicure stations (UV lamp, dust fan), pedicure thrones + foot basins, facial steamer | finalload → `Get Nailed salon`; `polishWall`, `tubChair` |
| Dingy service yard (bin bags, puddles, oil stains, weeds, dumped appliance, smoke spot, graffiti) | finalload → `dingy back yard` |
| Steel shelving with coloured bins, tagged bags and boxes; chain-link cage (gun vault) | pawnshop → `pawn store` (`shelf`), `workshop: caged gun vault` |
| Halloween / horror props (coffin, mummy case, giant spider) | cinema → `prop vault` |
| Striped shop awning (sloped cloth, scalloped valance, side cheeks, steel arms) with a logo board on it | goremet → `awning: red and cream stripes` (`stripes`) |
| Dripping blood lettering, a logo painted in code (toque + cleaver) | goremet → `drippy`, `drawLogo`, `logoMat` |
| Butcher counter with a lit meat case, cash wrap, slicer, hams / sausages on a rail, chalkboard prices | goremet → `the GORE-MET BUTCHERY counter` |
| Walk-in meat cooler: hanging sides on a rail, steel shelving, PVC strip curtain, evaporator | goremet → `walk-in cooler` |
| Lit reach-in dairy cases (glass doors, painted stock) | goremet → `the dairy wall` (`reachIn`) |
| Checkout lanes with conveyor belts, lane lights, impulse racks | goremet → `shop: checkout lanes` |
| Hanging aisle signs | goremet → `hanging aisle signs` |
| Staff toilet (WC, basin, mirror, dryer), small office (files, safe, CCTV wall, cork board, lockers) | goremet → `staff toilet`, `office` |
| Receiving bay: shrink-wrapped pallets, baler, pallet jack, dock bumpers, shutter boxes, hazard edge, box truck | goremet → `stock room: receiving bay`, `delivery yard behind`; truck via `MFZV.make('boxtruck', ..., {label})` in `bGoremet` |
| Cart corral, outdoor produce stand, ice chest, benches | goremet → `parking: ... cart corral`, `front walk` (`cart`, `stand`) |
| Hipped fabric awning wrapping a corner (mitred slopes, hip ends, valance, tie rods); `poly()` = any flat polygon, both faces | medikill → `awning: blue fabric, hipped, wrapping` (`poly` defined at the top of `build()`) |
| Roof sign board on the parapet with gooseneck lamps, a giant 3D pill capsule, a free-standing 3D red cross | medikill → `roof sign: the MEDIKILL board` (`signMat`, `drawLogo`, `pill`, `crossBadge`) |
| Pharmacy counter with glass screen + service windows, back bar of medicine bottles, queue posts, blood-pressure chair | medikill → `the PHARMACY counter` (`backBar`) |
| Dispensary: work bench, pill shelving, controlled-drugs safe, vaccine fridge | medikill → `dispensary` |
| Rear car park open to the alley: stalls down both side fences, hatched delivery apron, lamp mast, oil stains; power pole with wires | medikill → `car park behind`, `board fences down both sides` |
| Planters of flowers, newspaper boxes, litter bins on a shop apron | medikill → `front apron` (`planter`, `news`, `bin`) |
| **Half-plot shop on the lot kit** (20 x 36 plot: `mk(x, z, 20, 36, ...)`, `LK.pavement(b, m, {w: 20})`) | bedsburns → whole file is the template for a half-plot commercial lot |
| Drive-in truck bays: openings left out of the WL back wall with a header collision box, roller shutters (one up, one part-down), jamb guards, hazard aprons, a box truck backed in | bedsburns → `BAYS`, `BACKRUNS`, `delivery yard behind`, truck in `bBedsBurns` |
| Curved sweeping canopy on steel posts, raised entrance fascia with a lit board and gooseneck lamps | bedsburns → `entrance: raised fascia tower` (`cy`) |
| Sofas, armchairs, beds with headboards, dining tables + chairs, coffee tables (parametric makers) | bedsburns → `furniture makers` (`sofa`, `armchair`), `bed gallery` (`bed`), `dChair`, `ctable` |
| Fireplaces (marble / stone / modern hole-in-wall, lit or cold), wood-burning stoves with flues, companion sets, log baskets | bedsburns → `fireplace`, `stove`, `companion`, `logs` (`fireplace showroom`) |
| Picture wall cut from one painted atlas, hanging double-sided zone signs | bedsburns → `picture wall`, `zoneSign` |
| Shrink-wrapped sofas on pallets, mattresses in plastic, roll cages, pallet stacks, cardboard bales | bedsburns → `delivery area` (`wrapped`, `cage`), `pallet` |
| **Two shops in one plot** (solid party wall `WL(B, 0, XM, ...)` rising through the roof, separate fronts / skins / back doors per shop) | dailygrind → `FRONT_DG` / `FRONT_GB`, `skin(..., low)` (per-shop shopfront material under brick) |
| Café patio: paving, planter-box border, bistro tables + parasols, festoon lights on posts, outside window ledge + stools, chalk A-boards | dailygrind → `Daily Grind patio` (`planter`, `bistro`, `swag`, `stool`, `aboard`, `chalk`) |
| Climbing flowers over a fascia, wall lanterns, festoon bulbs, oval hanging bracket sign | dailygrind → `climbing flowers over the cafe fascia` (`lantern`), `ovalSign` |
| Coffee bar: espresso machine, grinders, pastry case, bean-tin shelves, menu boards; open industrial ceiling (spiral ducts, track lights, enamel pendants) | dailygrind → `the coffee bar by the till`, `interior: floors, linings` (ducts, track lighting, pendants) |
| Café seating: leather banquette, square / round tables, teal chairs, long high table + stools | dailygrind → `Daily Grind seating` (`chair`, `hiStool`) |
| Bakery counter (heated glass cases with trays of bakes), bread racks, baguette basket, menu screens, café barriers with banners | dailygrind → `Get Baked shop`, `Get Baked front` (`run`, `banner`) |
| Bakery kitchen: three-deck ovens, rack oven, spiral mixer, prover, speed racks, flour sacks on a pallet | dailygrind → `Get Baked kitchen` (`speed`) |
| Small toilets (WC lathe, basin, mirror, dryer, baby change) | dailygrind → `wc`, `Daily Grind toilet`, `Get Baked staff toilet` |
| **Clothing store kit**: garments hung side-on on rails (tee / flannel / coat / jeans), garments hung facing out, folded stacks, plaid flannel textures painted in code | threads → `garment and mannequin makers` (`hangSide`, `hangFront`, `railRun`, `folded`, `plaid`) |
| Dressed mannequins (top, trousers, dress, coat, hat; standing on a plinth or knocked over) | threads → `mannequin` (`o = {top, bot, dress, coat, hat, fallen, y}`) |
| Oak shelving wall with hanging rails in bays and a top shelf of vintage props (speakers, plants, boom box, suitcases, caps, bowling pins, round sign) | threads → `the oak shelving wall` |
| Round racks, T-racks, a round shoe display table over a ring rail, cap wall with pegs, rolling Z-racks with garment covers | threads → `floor fixtures`, `left wall: long rail`, `stock room` (`zrack`) |
| Fitting rooms (panelled cubicles, half-drawn curtains, mirrors, stools) | threads → `fitting rooms` |
| Glass display counter with lit accessories, back counter with shopping bags, painted mural wall | threads → `cash wrap` |
| Open black ceiling with spiral ducts, orange enamel pendants on cords, track lights | threads → `interior: floors, linings, ceilings, lights` (`pendant`, `track`) |
| Glowing channel letters on a render front (lit face over a dark return), projecting coloured entrance portal, painted side-wall mural | threads → `channel letters`, `entrance: projecting blue portal`, `mural down the left side wall` |
| Clothing donation bank, bike rack with a locked bike, sidewalk-sale rail, chalk A-board | threads → `delivery yard`, `front apron` |
| **Hanging sides of beef** on a freezer rail; butcher's block, band saw, mincer, vacuum packer; fibreglass butcher statue (boater, striped apron) | beatmeat → `Beat The Meat freezer store`, `Beat The Meat kitchen`, `fibreglass butcher` |
| **Mirrored twin shops** in one half plot: u-coordinates from the party wall (`opsU`, `xr`, `lw`) so one loop builds both sides' walls, linings, toilets and freezer stores; one shared van in the yard | beatmeat → `opsU`, `xr`, `lw` (top of `build()` interior); loot loop in `bBeatMeat` |
| **Neoclassical portico**: fluted columns (flutes painted on the shaft), ionic capitals with volutes, entablature with a lettered frieze, dentil cornice, blind upper windows, stone window surrounds with keystones | bluebank → `portico: four fluted columns`, `exterior skin: pale ashlar` (`surround`, `band`) |
| Bank hall: brass-grilled teller line with teller windows, wall clock, queue posts with velvet ropes, check-writing island with green banker's lamps, chesterfields / armchairs, coffered ceiling with chandeliers | bluebank → `the teller line`, `queue posts`, `check-writing island` (`bankLamp`), `waiting area` (`sofa`, `armchair`), `interior` (`chandelier`) |
| Round vault door swung open (handwheel, bolts, dial), safe-deposit box walls, cash cart, money sacks, gold bars; lootable green `bank_safe` prop (table 'bbk_vault') | bluebank → `vault room: round vault door`, `strongroom`; `K.def('bank_safe')` |
| **Roller doors** (v089): orange steel leaf of any width that rolls up into the head, locked by default (lockpick / break), open box above head height, `d.keep` survives ruin | core `mkRollDoor(B, ax, fx, c, w, h, {inn, mat, locked, hp})` (`06_buildings.js`); leave the opening in your WL runs + a header `S()`. Used by hideyourjunk (`roller doors` in `bHideYourJunk`, painted leaf `doorMat`) |
| Chain-link fence with razor-wire coils (helix tube), barb arms, a rolling chain-link gate parked open on wheels | hideyourjunk → `chain-link fence with razor-wire coils` (`fence`, `coil`) |
| Storage-unit rows: pitched corrugated roofs per bay, gables + divider gables, orange door frames, roller drum box, unit-number atlas (one texture, UVs per plate) | hideyourjunk → `storage rows` (`ROWS`, `UNITS`, `numMat`, `numGeo`) |
| Junk clutter makers (boxes, totes, sheet-covered furniture, leaning mattress, tyre stack, bike, stacked chairs, old fridge, lamp, rolled rug) packed along a wall by nominal width | hideyourjunk → `unit clutter` (`MAKERS`, `WID`, `BACK`, `SIDE`) |
| Random loot themes per visit (a few rooms of many get [prop, table] sets; the rest stay junk); a spawner that returns the container (to lock it) | hideyourjunk → `THEMES`, `the two or three units worth looting` in `bHideYourJunk` |
| Yellow storage lockers (lootable `hyj_locker`, table 'hyj_junk') under a clear canopy | hideyourjunk → `K.def('hyj_locker')`, `the locker canopy` |
| **Clinic kit**: exam couch with paper roll, ceiling curtain rail with a bunched privacy curtain, clinical sink unit (gloves, sharps bin, towels), instrument trolley, floor scales, eye chart, BP monitor, phlebotomy chair | littleprick → `shared makers: exam couch, curtain rail, sink unit` (`couch`, `curtain`, `sink`, `trolley`, `scales`), `jab room` |
| Reception counter with a smoked-glass front and glass screen, secretary area with an oak feature wall and a painted logo | littleprick → `reception: white counter`, `secretary's area` |
| Waiting-room bench seating (oak plinth, cream band, teal cushion, wall bolsters) along walls, ottoman, gold line art, painted wall lettering | littleprick → `waiting area` (`bench`) |
| Clay-tile gable roof over a flat-topped box (planes, fascia, soffit, gutters, bargeboards, ridge, brick gable triangles with a vent) | littleprick → `roof: clay-tile gable` (`poly`) |
| Accessible toilet (grab rails, pull cord, baby change), clinical-waste wheelie bins | littleprick → `accessible toilet`, `staff yard` |
| **1950s diner kit**: red / white tuck-and-roll booths with black chrome-edged tables (napkin box, ketchup / mustard, shakers), a long counter with a red-and-white chevron front and chrome stools, pie stands under glass domes | greasyneedy → `booths along the front windows`, `the counter` (`booth`, `table`, `stool`, `chev`) |
| Diner back bar: milkshake mixer, soda fountain tower, coffee urns, cup shelf, pun menu boards, neon EAT, wall clock; jukebox, gumball machine | greasyneedy → `the back bar`, `jukebox, gumball machine` (`menuBoard`) |
| Diner car exterior: fluted stainless skirt, cream enamel, red band, rounded corner drums, deep rounded fascia with neon stripes, red standing-seam awning | greasyneedy → `exterior skin`, `fascia`, `red standing-seam awning` (`BANDS`) |
| Open neon script sign on a steel roof frame (glow halo + tube + core); `neonText` painter | greasyneedy → `the GREASY & NEEDY / DINER neon` (`neonText`, `roofSign`) |
| Cook line: fryers, flat-top griddle, six-burner range, charbroiler under a stainless hood, ticket rail | greasyneedy → `kitchen: the cook line` |
| Building on half the half plot with a car park in front (stalls nosed in, wheel stops, island with a pole sign, dropped-kerb driveway, 50s cars) | greasyneedy → `car park`, cars in `bGreasyNeedy` |
| **Bomb signs**: a horizontal olive bomb (body, ellipsoid nose, tail cone, X fins, gold bands, fuze, wall brackets) with gold lettering laid on its flank; raised centre fascia with a recessed sign frame | majorwoody → `the bomb signs` (`bomb`, `bombText`), `parapet, coping, raised centre fascia` |
| Army surplus kit: camo jacket rails with a helmet shelf, double-sided pegboard gondolas (folded fatigues, packs, berets, survival kits), window mannequins in full kit, stencilled packing crates; camo texture painted in code | majorwoody → `camo jacket rails`, `pegboard gondolas` (`gondola`, `folded`, `pack`, `beret`, `kit`), `window mannequins` (`manne`), `crate` (`stencil`), `camo` |
| Ammo room: white crate shelving with stencilled 7.62 / 5.56 cases, L counter, back bar of boxed rounds; recruiting-style pun posters, neon script sign, US flag, brass plaque | majorwoody → `AMMO ROOM`, `POSTERS` / `posterMat`, `neonMat`, `flag`, `plaqueMat` |
| Motor pool: block garage with a corrugated roof and rolled-up shutter bay, board fence with a gap and swung-open gate leaves, camo net on poles (alpha texture), oil drums (upright / tipped), tyre stacks, sandbag walls; army trucks + jeep via `MFZV.make('army' / 'jeep')` | majorwoody → `garage: corrugated roof`, `board fences round the motor pool`, `motor pool: camo net` (`drum`, `tyres`, `sandbags`), `veh` in `bMajorWoody` |
| **Pizza parlour kit**: domed wood-fired oven (brick plinth with a log niche, mosaic hemisphere dome, arched soot mouth with embers, flue), make line with topping wells and heat-lamp shelf, heated slice case with whole pies and slices, peel rack | pizzabytes → `the wood-fired oven`, `the make line`, `the order counter` (`pie`) |
| Conveyor pizza oven, spiral dough mixer, dough proofing rack, wing fryer, stacks of pizza boxes | pizzabytes → `kitchen: conveyor oven, dough mixer, proofing rack, fryer` |
| Giant 3D pizza slice on a roof frame (extruded wedge, crust log, pepperoni, cheese drips) | pizzabytes → `the giant pizza slice on the roof` |
| Arcade cabinets (lit marquee, painted screen, control panel, coin door); 8-bit pixel-art painter (`pixelSlice`) | pizzabytes → `the "bytes": two arcade cabinets` (`arcade`, `arcadeArt`), `pixelSlice` |
| Gingham four-tops with bentwood chairs, wall booths running out from a wall, chianti-bottle candles; chalk menu boards (`menuMat`) | pizzabytes → `dining: gingham four-tops`, `dining: booths along the left wall`, `menuMat` |
| Delivery scooter with a hot box, raised centre parapet with stepped shoulders for channel letters | pizzabytes → `the delivery scooter`, `parapet, raised front centre` |
| **Takeaway kit**: doner spits (burner panel, skewer, painted meat cone, drip tray), twin-basket fryer, pitta warmer, steel counter with salad wells and a sloped sneeze guard; backlit menu boards of dish pictures painted in code (`menuMat`) | kebabwok → `back bar: kebab doner spits`, `the counter: kebab steel`, `menuMat` |
| Chinese takeaway: wok range under a hood with a roaring flame (emissive cones), heated glass cabinet of foil trays, rice warmer, red / gold counter, lucky cat, fish tank, paper lanterns under a fascia | kebabwok → `kitchen` (wok side), `back bar` (wok side), `waiting area`, `red paper lanterns` |
| Questionable back rooms: chained chest freezer with padlock and leak (`chainedFreezer`), butcher's block, labelled boxes (`boxLabel`), camp bed, card table with cash and folding chairs (`fChair`), CCTV crate, floor safe, knock-off bag rail; 0-star hygiene and JUST EATEN door stickers | kebabwok → `the store`, `the back room`, `hygMat`, `eatenMat` |
| Customer toilet off a waiting area (WC, basin, cracked mirror, dryer, CUSTOMERS ONLY sign), waiting bench along a wall with a wall TV | kebabwok → `customer toilet`, `waiting area: bench along the party wall` |
| Projecting blade sign on steel brackets (double-sided label), extract flue up a back wall with a cowl and grease stain, waste-oil drums | kebabwok → `projecting blade sign`, `the kebab flue`, `dingy service yard` |

## Each building
<!-- generated below by tools/arch/features.py -->
### Bruno's Burgerama — `js/layers/burgerjoint.js`
burger joint · NEWCAT id `willy_burgerorium` · builder `bBurgerama` · 2022 lines

- **Helpers / painters:** `XB0`, `RED`, `drawBear`, `drawBurger`, `drawFries`, `drawCup`, `logoTex`, `menuTex`, `fur`, `bBurgerama`
- **Surfaces (`surf('key')`):** checker, quarry, hex, plate, paper, subway, ceiling, vinyl, seam, teal, tableTop, mahog, grey, counterTile, granite, fence, asphalt, grass, concrete, leaves
- **Sections** (grep the text to jump there):
  - grounds
  - fence round the lot
  - building skin: interior floors, linings, ceiling
  - light: panels + globe pendants
  - booths
  - freestanding tables with wire chairs
  - condiment + tray station
  - service counter
  - menu boards hung over the counter
  - posters, clock, signs on the dining walls
  - kitchen
  - walk-in freezer interior
  - restrooms
  - roof: mansard (red standing seam) + teal fascia + flat deck, sign, mascot, HVAC
  - entrance portal, canopy, window trim
  - lawn furniture, shrubs, trees, sidewalk meters
  - Bruno the Bear: 4.6 m fibreglass statue on the roof, on guy wires

### Nut & Bolt Gas Station — `js/layers/gasstation.js`
filling station · NEWCAT id `eco_pump` · builder `bNutBolt` · 2067 lines

- **Helpers / painters:** `XS0`, `GRN`, `drawNut`, `drawLogo`, `logoMat`, `fasciaTex`, `sedan`, `van`, `bNutBolt`
- **Surfaces (`surf('key')`):** panel, block, floor, wains, paint, white, ceil, bayfloor, asphalt, concrete, soffit, jersey, tank, leaves
- **Sections** (grep the text to jump there):
  - ground
  - store: exterior skin
  - store interior: floor, linings, ceiling, lights
  - shop: checkout counter + back bar
  - shop: soda fountain, slush machine, coffee + hot-dog roller along the partition
  - shop: football dump bin, posters
  - service bay
  - canopy, islands, pumps
  - price pylon on the corner
  - propane tanks
  - by the shop door: ice merchandiser, A-frame, trash can, air / water
  - wrecks behind jersey barriers
  - sidewalk: bus shelter, bus stop, mailbox, no parking, hydrant, street lights
  - behind the store: dumpster corner (the dumpster itself is lootable, placed at build) + a cardboard pile

### Triggered Firearms & Supplies — `js/layers/gunshop.js`
gun shop · NEWCAT id `trigger_guard` · builder `bTriggered` · 1551 lines

- **Helpers / painters:** `XS0`, `ORG`, `crosshair`, `drawLogo`, `logo`, `bannerTex`, `YEL`, `GUNS`, `longGun`, `wireChair`, `bTriggered`
- **Surfaces (`surf('key')`):** brick, coping, floor, wall, ceil, counter, shelf, asphalt, concrete, lawn, hedge, range, sand, chain
- **Sections** (grep the text to jump there):
  - ground
  - store: grey brick skin, parapet, coping
  - storefront: awning, bars, orange blinds, sign, banners, bollards
  - pole sign
  - parked sedan
  - range behind the store
  - store interior: floor, walls, ceiling, lights
  - office behind a half wall (back-left)
  - display counters: open wooden cubbies with shelves
  - rifle wall + display-only signs, helmet / ammo shelving
  - target stands in the shop, posters, barred interior windows
  - stock room
  - sidewalk: bus shelter, street light, no parking sign, power pole

### Gutter Minds Bowling — `js/layers/bowling.js`
bowling alley · NEWCAT id `gutter_lanes` · builder `bGutterMinds` · 1698 lines

- **Helpers / painters:** `RED`, `LANE0`, `LANES`, `PAIRS`, `drawBall`, `drawPin`, `discText`, `drawLogo`, `adTex`, `pickup`, `bGutterMinds`
- **Surfaces (`surf('key')`):** brick, wbrick, carpet, maple, approach, gutter, capping, ceil, asphalt, concrete, dirt, coping, vinylG, table, gingham, slat
- **Sections** (grep the text to jump there):
  - ground: sidewalk in front, service lot behind
  - exterior skin: brick, plinth, rounded teal coping
  - interior: floor, walls, ceiling, lights
  - lanes
  - window booths along the front, house-ball racks, arcade cabinets
  - front desk + shoe cubbies
  - snack bar: black rounded top on an orange base; kitchen behind
  - café: gingham tables + wooden chairs
  - restrooms

### Meat & 2 Veg — `js/layers/supermarket.js`
supermarket · NEWCAT id `food_library` · builder `bMeat2Veg` · 1576 lines

- **Helpers / painters:** `GRN`, `drawCarrot`, `drawPea`, `drawSteak`, `drawLogo`, `bMeat2Veg`
- **Surfaces (`surf('key')`):** stucco, stone, wbrick, floor, conc, wall, wains, ceil, awning, counterW, asphalt, concrete, sack, pallet, burnt
- **Sections** (grep the text to jump there):
  - ground
  - facade: stucco skin, stone pilasters, cornice, entrance tower
  - back: loading dock, bumpers, the burnt box truck, a fire barrel
  - interior: floors, linings, ceiling, lights
  - checkout lanes
  - shopping carts (our own wire carts)
  - produce stands (our own), with fruit and veg
  - deli counter with lit meat case
  - coffee station against the back wall
  - back of house: pallets of sacks, milk crates, restroom

### Water Tower & Cerberus Studios — `js/layers/cerberus.js`
office lot + water tower · NEWCAT id `water_tower_kerberos` · builder `bCerberus` · 1670 lines

- **Helpers / painters:** `TX`, `RED`, `drawHound`, `signTex`, `emblemTex`, `SCREENS`, `screenMat`, `posterMat`, `officeChair`, `plant`, `sofa`, `monitor`, `bCerberus`
- **Surfaces (`surf('key')`):** gbrick, coping, conc, wall, ceil, asphalt, concrete, fence, steel, tank
- **Sections** (grep the text to jump there):
  - ground: asphalt everywhere, sidewalk, lot stripes
  - water tower
  - studio exterior: grey painted brick, coping, signs, scorch
  - interior: floor, walls, ceiling, lights
  - reception
  - open floor: desk pods
  - glass meeting room (back left)
  - lounge + kitchenette (back right)

### Aisle Be Back Church — `js/layers/church.js`
church (lot kit template) · NEWCAT id `church` · builder `bAisleBeBack` · 1329 lines

- **Helpers / painters:** `SIDEW`, `lancetPath`, `stained`, `leadTex`, `bAisleBeBack`
- **Surfaces (`surf('key')`):** clap, timber, shingle, stone, marble, plaster, wains, pew, carpet, lawn, asphalt, concrete, dirt, marbleW, fence, leaves, hedge
- **Sections** (grep the text to jump there):
  - grounds
  - nave exterior: plinth, clapboard skin, buttresses, window frames
  - roof: shingle planes, ridge, fascia, half-timbered gables
  - tower
  - praying-hands statues (our own sculpt)
  - message board
  - side lawn: trees, picnic tables, a bench; graveyard; fence
  - sidewalk: street lights, meters, traffic signal, hydrant, no parking (v081: lot kit)
  - interior: floor, wainscot, plaster, mouldings, trusses
  - pews
  - chancel

### Climax Cinema — `js/layers/cinema.js`
two-storey cinema / theatre · NEWCAT id `the_aztec` · builder `bClimax` · 2051 lines

- **Helpers / painters:** `RED`, `POSTERS`, `posterMat`, `marqueeBoard`, `projector`, `seatRow`, `sofa`, `plant`, `bClimax`
- **Surfaces (`surf('key')`):** brick, tile, granite, cornice, carpet, redwall, aisle, seat, stage, ceil, darkceil, plaster, conc, lino, asphalt, concrete
- **Sections** (grep the text to jump there):
  - ground: sidewalk, apron, side strips, rear alley
  - facade skin: granite plinth, white tile band, brick, cornice
  - blade sign + V marquee
  - lobby interior: floor, walls, ceiling, sconces, light boxes
  - stairwell: concrete walls, railings, landing (the walkable stairs are core slabs)
  - auditorium
  - upstairs: floors, walls, ceilings
  - projection booth
  - prop vault: spare seats, coffin, mummy case, giant spider, marquee letters, sacks
  - manager's office: desk with CCTV, open safe, filing cabinets, barricade, tally marks
  - staff room: lockers, sofa, table, kitchenette, notice board
  - hall: water cooler, extinguisher, posters

### Morning Wood Hardware — `js/layers/hardware.js`
hardware & lumber store · NEWCAT id `hammertime` · builder `bMorningWood` · 1688 lines

- **Helpers / painters:** `YEL`, `drawLogo`, `offTex`, `saleTex`, `boxTex`, `BOXES`, `bMorningWood`
- **Surfaces (`surf('key')`):** brick, corr, ribs, floor, conc, wall, ceil, counter, slat, plank, ply, peg, asphalt, concrete, dirt
- **Sections** (grep the text to jump there):
  - ground
  - exterior skin: brick + teal coping parapet
  - canopy: corrugated slope, ribbed fascia, soffit, teal columns
  - shopfront walk: posters in the windows, benches, bins, mailbox, carts, meter
  - back: shutters, dock bumpers, propane tank, wreck
  - interior: floors, walls, ceiling, fixtures
  - checkout lanes
  - tyre stacks
  - appliance wall: washers, stoves, boxed appliances, TV
  - gondola aisles + pegboard end caps of tools
  - lumber rack
  - paint section: can pyramid, tint machine, swatch wall
  - garden: rope coils, shovels, rakes, wheelbarrow, soil sacks
  - camping & sports (left front)
  - stock room: racking, tyres, boxes; office; break area; restrooms

### Inn-and-Out Motel — `js/layers/motel.js`
courtyard motel · NEWCAT id `sunshine_motel` · builder `bInnAndOut` · 1558 lines

- **Helpers / painters:** `RED`, `ROOMS`, `toPlot`, `spreadMat`, `pictureMat`, `bInnAndOut`
- **Surfaces (`surf('key')`):** siding, shingle, pavers, path, brick, carpet, wall, tile, ceil, wood, asphalt, concrete, lawn, gravel, poolTile, coping, deck, hedge, leaves, chain
- **Sections** (grep the text to jump there):
  - ground
  - exterior siding
  - walkway columns, fascia, soffits
  - hipped roofs
  - room interiors (one template per room)
  - laundry (back-left corner)
  - linen store (back-right corner)
  - office
  - pool deck, drained kidney pool, fence, loungers
  - perimeter brick walls + hedges behind the wings
  - courtyard tree, median tree, benches
  - the INN-AND-OUT sun sign
  - sidewalk furniture

### Dead Weight Sporting Goods — `js/layers/sporting.js`
sporting goods store · NEWCAT id `dead_weight_sporting` · builder `bDeadWeight` · 1247 lines

- **Helpers / painters:** `RED`, `dumbbell`, `logoTex`, `basket`, `soccer`, `football`, `poster`, `bDeadWeight`
- **Surfaces (`surf('key')`):** stucco, tilt, seam, carpet, wall, ceil, rail, slat, peg, conc, stock
- **Sections** (grep the text to jump there):
  - ground
  - exterior skins
  - interior: floor, walls, ceiling, columns
  - cash wrap
  - apparel: round racks + T-racks of hoodies, mannequins
  - balls: gondolas + wire bins; shoe wall
  - the DEAD WEIGHT gym corner
  - outdoors: kayak rack, tents, rod racks, tackle, coolers
  - hunting counter area (right side) — racks + case are lootable models
  - stock room + office

### Half Plot House — `js/layers/halfhouse.js`
half-plot houses, one and two storey (5 plans) · NEWCAT id `small_house / medium_house` · builder `?` · 1939 lines

- **Helpers / painters:** `H1`, `WALLS`, `TRIMS`, `ROOFS`, `BRICKS`, `PAINTS`, `CARPETS`, `PK1`, `w`, `arch`, `PLANS`, `ONE`, `REAR`, `withGarage`, `srt`, `mirror`, `PCACHE`, `plan`, `bbox`, `minusHole`, `DRAW`, `tint`, `TO`, `SLOT`, `prism`, `beam`, `wbox`, `grounds`, `structure`, `cutHole`, `interior`, `skins`, `roofPart`, `chimney`, `roofs`, `CHIM`, `DH`, `porchBuild`, `frontYard`, `MCACHE`, `mod`, `MODS`, `PT`, `walls`, `wallSpots`, `KIT`, `ROOMS`, `furnish`, `yard`, `attach`, `pick`, `ACCS`, `PMAP`, `palette`, `bHalfHouse`, `bHalfHouseSmall`
- **Surfaces (`surf('key')`):** lawn, concrete, dirt, checker, tile, oak, deck, board, leaves, chain
- **Sections** (grep the text to jump there):
  - grounds: lawn, sidewalk
  - structure: upper floor slab and the stairs (collision; the walls themselves are core WL)
  - v082 interior: floors, ceilings, painted wall lining with skirting, stairs + balustrade, landing rail, light fittings
  - exterior skins: clapboard over a brick plinth, corner boards, bands, window casings, shutters, door casings
  - roofs: gable, hip, gambrel (ridge along X or Z), gable infill, rakes, fascia, ridge cap, vent, chimney
  - porches: full / half / long shed porches with posts and spindle rails, portico, stoop with iron rails, door hood
  - front yard: path, driveway, foundation planting, sunflowers, front / side / rear fences, mailbox
  - v082 furnishing: lootable props along the walls (dodging doors, tall ones dodging windows), core furniture in the middle
  - v082 yard and sidewalk: back-yard pieces in two slots + a middle strip, one or two sidewalk props clear of the path and driveway

### Plot Twist Cemetery — `js/layers/cemetery.js`
full-block cemetery: mausoleum, vault, ~150 graves · NEWCAT id `cemetery` · builder `bPlotTwist` · 1646 lines

- **Helpers / painters:** `iron`, `NCOLS`, `nextName`, `NO_TEXT`, `nameAtlas`, `plate`, `signMat`, `plaqueMat`, `stainedMat`, `beam`, `gableX`, `tri`, `grounds`, `railings`, `gate`, `mausoleum`, `vault`, `shed`, `stoneM`, `DARKS`, `kept`, `grave`, `pickKind`, `graves`, `burst`, `monuments`, `dressing`, `interiors`, `bPlotTwist`
- **Surfaces (`surf('key')`):** lawn, lawnD, humus, dirt, gravel, conc, ashlar, ashlarD, drystone, stone, stoneD, granite, marble, floorM, roofSlab, boards, wood, rust, ivy, leaves
- **Sections** (grep the text to jump there):
  - grounds: lawn with darker patches and leaf litter, gravel avenue / cross walk / memorial ring, sidewalk
  - wrought-iron railings with spear tips on a stone kerb, ashlar piers; dry-stone back wall with ivy
  - front gate: ashlar piers with urn finials, double iron gates (left swung open), scrolled arch with the name
  - mausoleum: stone walls (core WL in the builder), skins, portico with four columns, pediment, slab roof, bronze doors
  - the sealed gothic family vault
  - groundskeeper's shed (walls are WL in the builder): board skin, pent roof, lean-to with a wheelbarrow and tools
  - monuments: war memorial obelisk, family plot, obelisks, table tombs, praying hands, dug graves
  - dressing: iron lamp posts, benches, birdbath, trees, litter, sidewalk
  - interiors: the mausoleum crypt and the groundskeeper's shed
  - shed

### Pawnographic — `js/layers/pawnshop.js`
pawn shop: shop floor, buying counter, pawn store, gun-vault workshop · NEWCAT id `golden_fences_pawn` · builder `bPawnographic` · 1647 lines

- **Helpers / painters:** `YEL`, `IMPACT`, `balls`, `letters`, `poster`, `neon`, `bPawnographic`
- **Surfaces (`surf('key')`):** asphalt, concrete, block, stucco, tile, oak, floorC, ceil, wall, grey, navy, paint, coping, lawn
- **Sections** (grep the text to jump there):
  - grounds: sidewalk, asphalt lot
  - exterior skin: pink block below, cream stucco fascia above, parapet
  - covered walk: tile pent roof wrapping the front and the right corner, block piers
  - signs: PAWNOGRAPHIC letters + gold balls on the fascia, PAWN SHOP on the side, the pylon
  - window wraps, posters, neon
  - parking: stalls, wheel stops, disabled bay, lane arrows
  - service yard behind: block wall, pallets, cardboard
  - sidewalk: street lights, hydrant, no parking
  - interior: floors, linings, ceiling, lights
  - shop: wall of lit glass cabinets (phones, cameras, consoles) down the left wall
  - shop: bikes in the front window, jewellery island
  - shop: power-tool tables (drills, saws, sanders, cases)
  - shop: household / garden row along the front right windows
  - shop: instruments corner + TV wall along the partition
  - the BUYING COUNTER: high counter, security screen, BUY / LOANS / PICK-UP windows
  - pawn store: steel shelving, coloured bins, tagged bags and boxes
  - workshop: caged gun vault, bench, bulk materials

### Gore-met Foods — `js/layers/goremet.js`
gourmet grocery & butcher: shop floor, butchery counter, walk-in cooler, stock room + dock, office, toilet · NEWCAT id `lucky_ducky` · builder `bGoremet` · 1829 lines

- **Helpers / painters:** `RED`, `IMPACT`, `drippy`, `drawLogo`, `logoMat`, `stripes`, `poster`, `board`, `bGoremet`
- **Surfaces (`surf('key')`):** asphalt, concrete, lawn, hedge, brick, render, coping, trim, checker, floorC, carpet, wctile, diamond, ceil, wall, grey, panel
- **Sections** (grep the text to jump there):
  - grounds: sidewalk, asphalt lot, hedge strip
  - exterior skin: red brick plinth, white render above, parapet
  - awning: red and cream stripes over the shopfront, the logo on its face
  - window posters
  - front walk: slab, kerb, benches, bin, ice chest, outdoor produce stand
  - parking: front stalls, right-hand lot, wheel stops, cart corral
  - pylon sign on the front right corner of the lot
  - delivery yard behind: dock apron, bumpers, shutter boxes, pallets, bin bags
  - sidewalk: street lights, meters, hydrant, no parking
  - interior: floors, linings, ceiling, lights
  - shop: department signs on the walls, hanging aisle signs
  - shop: the GORE-MET BUTCHERY counter, lit meat case, hams on a rail
  - shop: the dairy wall (lit reach-in cases along the back)
  - shop: checkout lanes
  - walk-in cooler: steel shelving, hanging sides on a rail, strip curtain
  - staff toilet: WC, basin + mirror, dryer, mop bucket
  - office: filing cabinets, safe, CCTV, cork board, lockers, water cooler
  - stock room: receiving bay, yellow walk lines, baler, pallet jack, stacked pallets
  - dressing: dropped packets, a smear by the butchery, wet floor sign, a cart left in the aisle

### MediKill Drug & Pharmacy — `js/layers/medikill.js`
drugstore: big shop floor, pharmacy counter + dispensary, stock room, staff room; car park behind open to the alley · NEWCAT id `morgans_drug` · builder `bMedikill` · 1624 lines

- **Helpers / painters:** `BLUE`, `PARTX1`, `IMPACT`, `pill`, `crossBadge`, `drawLogo`, `signMat`, `poster`, `board`, `bMedikill`
- **Surfaces (`surf('key')`):** asphalt, concrete, lawn, hedge, fence, tile, brick, fabric, checker, floorC, vinyl, ceil, wall, coping, alu, grey
- **Sections** (grep the text to jump there):
  - grounds: sidewalk, front apron, side walks, car park behind
  - exterior skin: tile cladding front and right, brick left and back, dark base band
  - awning: blue fabric, hipped, wrapping the front and the right-hand side
  - roof sign: the MEDIKILL board on the front parapet, a giant pill capsule and a red cross
  - window decals
  - front apron: planters of red flowers, bench, bins, newspaper boxes
  - car park behind: stalls, wheel stops, delivery apron, lamp mast
  - board fences down both sides, short returns at the alley; power pole with wires
  - interior: floors, linings, ceiling, lights
  - shop: checkout counter by the doors, impulse racks, back counter under the windows
  - shop: the PHARMACY counter across the back right, back bar of medicines, signs
  - shop: hanging aisle signs over the gondolas, health & beauty island
  - stock room: pallets, shrink-wrapped stock, a pallet jack
  - staff room: lockers, table + chairs, kitchenette, notice board
  - dispensary: work bench, pill shelving, a safe for controlled drugs, the pharmacist's desk
  - dressing: spilled pills and packets, blood smears, a wet floor sign, scattered stock
  - sidewalk: street lights, meter, hydrant, no parking

### Beds, Burns & Beyond — `js/layers/bedsburns.js`
half-plot furniture & fireplace store: big shop floor (sofas, beds, dining, fireplace showroom), drive-in delivery area with two shuttered truck bays off the alley · NEWCAT id `furniture_store` · builder `bBedsBurns` · 1134 lines

- **Helpers / painters:** `BAYS`, `BACKR`, `BACKRUNS`, `CHAR`, `drawSofa`, `signMat`, `strapMat`, `decal`, `chalkMat`, `bBedsBurns`
- **Surfaces (`surf('key')`):** asphalt, concrete, lawn, fence, brick, clad, coping, alu, shutter
- **Sections** (grep the text to jump there):
  - grounds: sidewalk, front apron, grass strip, side walks, delivery yard
  - furniture makers (shared by the shop floor and the sidewalk sale)
  - exterior skin: red brick to 2.9 m, charcoal ribbed cladding above, brick-faced piers
  - entrance: raised fascia tower with the BEDS, BURNS & BEYOND board, curved canopy on steel posts
  - front apron: bollards, sidewalk-sale sofa, A-board, planters, bench, bin
  - delivery yard behind: hazard aprons, bumpers, shutters, pallets, board fences
  - truck bay headers (collision: the walls themselves are core WL)
  - interior: floors, linings, ceiling, columns, lights
  - living-room set on a red carpet: black leather sofas facing each other, a marble fireplace
  - fireplace showroom: three chimney breasts on the back partition, freestanding stoves on slate hearths
  - bed gallery along the left wall: headboards on the wall, nightstands, lamps, a mattress stack
  - armchair groups, coffee-table row, dining tables with chairs
  - the cash wrap by the doors
  - picture wall on the right wall over the dining sets
  - delivery area: hazard lanes to the bays, shrink-wrapped sofas, mattresses in plastic, roll cages
  - sidewalk: street lights, meter, hydrant, no parking

### Daily Grind & Get Baked — `js/layers/dailygrind.js`
half plot split into two shops: Daily Grind coffee cafe (patio, seating, coffee bar, customer toilet) and Get Baked bakery (front shop, kitchen, staff toilet, delivery van) · NEWCAT id `cuppa_joe` · builder `bDailyGrind` · 1787 lines

- **Helpers / painters:** `TX`, `FRONT_DG`, `FRONT_GB`, `LEFT`, `BACK_DG`, `BACK_GB`, `WC_DG_F`, `PART_GB`, `WC_GB_S`, `SAGE`, `drawCup`, `drawBun`, `dgFascia`, `gbFascia`, `ovalSign`, `strapMat`, `chalk`, `banner`, `bDailyGrind`
- **Surfaces (`surf('key')`):** asphalt, concrete, fence, brick, sage, char, pavers, coping, alu
- **Sections** (grep the text to jump there):
  - grounds: sidewalk, front apron, side walks, back yard
  - exterior skin: brick all round, painted shopfronts to fascia height on the front
  - fascias: the gold-lettered Daily Grind board, the Get Baked navy lightbox
  - climbing flowers over the cafe fascia, lanterns, festoon lights
  - parapet, flat roof, HVAC, the bakery's oven flues
  - Daily Grind patio: paving, planter boxes, bistro tables, parasols, window ledge + stools, A-board
  - Get Baked front: blue café barriers round two tables, a bench, a bin
  - back yard: door hoods and signs, board fences, the cafe's bin store, grounds sacks, milk crates
  - interior: floors, linings, ceilings, lights
  - Daily Grind: the coffee bar by the till (tiled counter, espresso machine, grinders, pastry case)
  - Daily Grind seating: green banquette with tables and teal chairs, long high table, window ledge, round tables
  - Daily Grind toilet: WC, basin + mirror, dryer, baby change
  - Get Baked shop: glass bakery counter, till, bread racks on navy tile, menu screens, drinks cooler, waiting bench
  - Get Baked kitchen: deck ovens, rack oven, mixer, prover, prep tables, speed racks, flour sacks
  - Get Baked staff toilet: WC, basin, mirror
  - sidewalk: street lights, meter, hydrant, no parking

### Beat The Meat & Soylent Greens — `js/layers/beatmeat.js`
half plot split into two mirrored butchers: Beat The Meat (meat case, kitchen with block and band saw, freezer store with sides on a rail) and Soylent Greens vegan butchers (plant-cuts case, mural, kitchen, veg freezer store); staff toilets; one shared delivery van · NEWCAT id `geins_butcheria` · builder `bBeatMeat` · 1685 lines

- **Helpers / painters:** `U_FRONT`, `U_BACK`, `SIDE`, `U_PART`, `U_KPART`, `U_WC`, `opsU`, `TABLES`, `RED`, `drawCleaver`, `drawLeaf`, `btmFascia`, `sgFascia`, `stripes`, `strapMat`, `decal`, `chalk`, `apron`, `bBeatMeat`
- **Surfaces (`surf('key')`):** asphalt, concrete, fence, brick, tile, subway, redP, blackP, coping, alu
- **Sections** (grep the text to jump there):
  - grounds: sidewalk, front apron, side walks, back yard
  - exterior skin: brick all round; Beat The Meat front red over white tile, Soylent Greens white subway tile
  - fascias and striped awnings
  - parapet, flat roof, extract fans, the freezer condensers
  - Beat The Meat pavement: the fibreglass butcher, an A-board, a planter
  - back yard: door hoods and signs, fences, bins, pallets, the shared delivery spot
  - sidewalk: street lights, meter, hydrant, no parking
  - interior: floors, linings, ceilings, lights (both shops, mirrored)
  - Beat The Meat shop: the lit meat case + cash wrap, back counter, hams on the rail, cuts posters, waiting bench
  - Beat The Meat kitchen: butcher's block, band saw, mincer, vacuum packer, knife rack
  - Beat The Meat freezer store: sides of beef on the rail, boxed meat on the racking
  - Soylent Greens shop: wooden counter with the plant-cuts case, slicer on a block, kraft paper, the mural, waiting bench
  - Soylent Greens kitchen: range with stock pots, steamer, food processor, herb pots
  - Soylent Greens freezer store: veg crates on the racking, nets of cabbages, marrows and seitan logs on the meat rail
  - dressing: smears, dropped cuts, sawdust, a wet floor sign

### Threads with Benefits — `js/layers/threads.js`
half-plot clothing store: big shop floor (shelving wall, rails, round racks, mannequins, fitting rooms, display counter), delivery stock room with a roller-shutter bay, small office, locker alcove, staff toilet · NEWCAT id `fancypantz_wearables` · builder `bThreads` · 1620 lines

- **Helpers / painters:** `BAY`, `BACKD`, `SIDE`, `BACKRUNS`, `CYAN`, `strapMat`, `bThreads`
- **Surfaces (`surf('key')`):** asphalt, concrete, lawn, fence, shutter, render, grey, coping, alu, portal
- **Sections** (grep the text to jump there):
  - grounds: sidewalk, front apron, grass strip, side walks, delivery yard
  - garment and mannequin makers (shared by the shop floor, the window displays and the sidewalk sale)
  - exterior skin: white render on the front, grey render on the sides and back
  - the THREADS WITH BENEFITS channel letters (glowing cyan face over a darker return)
  - entrance: projecting blue portal round the sliding doors
  - window displays: plinths with mannequins behind the glass, posters
  - parapet with coping, flat roof, HVAC
  - mural down the left side wall (faces the side walk)
  - back: roller shutter, apron, bumpers, bollards, staff door hood, wall packs
  - delivery yard: pallets, cardboard bales, clothing donation bin, board fences
  - front apron: sidewalk-sale rail, A-board, planters, bench, bike rack, bins
  - interior: floors, linings, ceilings, lights
  - the oak shelving wall: top shelf of vintage props, hanging rails below
  - fitting rooms: three cubicles against the partition, right of the staff doors
  - cash wrap: glass display counter and till in front of the painted mural wall
  - left wall: long rail of coats and flannels, the cap wall by the window
  - floor fixtures: round racks, T-racks, the shoe table, the centre mannequin display
  - stock room: hazard lane, rolling rails of stock, bales, sorting table, roll cages
  - office: desk, chair, CCTV monitor, safe, cork board, clock
  - staff locker alcove: lockers, coat hooks, kettle, mop sink
  - staff toilet: WC, basin, mirror, hand dryer, toilet roll
  - dressing: dropped clothes, hangers, a spilled bag, smears
  - shutter bay header (collision: the walls themselves are core WL)
  - sidewalk: street lights, meter, hydrant, no parking

### Blue Balls Bank — `js/layers/bluebank.js`
half-plot neoclassical bank: portico of fluted columns, big banking hall (waiting area, teller line, check-writing island), vault room with a row of green safes and a strongroom behind a round vault door, two small offices, staff toilet · NEWCAT id `piety_mutual_bank` · builder `bBlueBalls` · 1817 lines

- **Helpers / painters:** `LEFT`, `BACKD`, `VAULTD`, `OFFD`, `STRONG`, `BLUE`, `drawBalls`, `textMat`, `bBlueBalls`
- **Surfaces (`surf('key')`):** asphalt, concrete, lawn, fence, ashlar, dressed, granite, marble, checker, plaster, wains, coping, bronze, brass, vaultSteel
- **Sections** (grep the text to jump there):
  - grounds: sidewalk, granite apron, grass strip, side walks, staff yard
  - exterior skin: pale ashlar all round on a granite plinth
  - portico: four fluted columns, entablature with the name on the frieze, dentil cornice
  - parapet with coping, flat roof, HVAC
  - front apron: three blue balls on a plinth, planters, bench, bins, bollards
  - staff yard behind: door hood, CCTV, wall packs, bins, board fences
  - interior: floors, linings, ceilings, lights
  - hall: two marble columns
  - hall: the teller line (marble counter, brass grilles, teller windows), clock and sign over it
  - hall: queue posts and velvet ropes in front of the tellers
  - hall: check-writing island with green banker's lamps
  - hall: waiting area (chesterfields, armchairs, coffee tables), customer-service desk, plants
  - vault room: round vault door (swung open), safes, cash carts, coin counter
  - strongroom: safe-deposit box walls, counting table, gold bars
  - door signs
  - corridor: water cooler, extinguisher, notice board, coat hooks
  - manager's office: desk, leather chair, visitor chairs, rug, CCTV, painting
  - loans office: desk, chairs, filing cabinets, poster
  - staff toilet: WC in a cubicle, two basins, mirror, dryer
  - dressing: dropped slips and notes, a fallen post, smears, a wet floor sign
  - sidewalk: street lights, meters, hydrant, no parking

### Hide Your Junk: Storage Units — `js/layers/hideyourjunk.js`
half-plot self-storage yard: razor-wire chain-link with one gate, 16 units with orange roller doors (locked, a few open, 2-3 random units worth looting), yellow locker bank under a canopy, small office · NEWCAT id `rays_storage_units` · builder `bHideYourJunk` · 1499 lines

- **Helpers / painters:** `HU`, `ROWS`, `OX0`, `OFRONT`, `OLEFT`, `OBACK`, `OWC`, `UNITS`, `uTh`, `uOrg`, `toLot`, `faceDoor`, `UIN`, `THEMES`, `NAVY`, `doorMat`, `drawLock`, `yardSign`, `officeSign`, `strap`, `NCOL`, `numMat`, `numGeo`, `bHideYourJunk`
- **Surfaces (`surf('key')`):** asphalt, concrete, slab, lawn, block, oblock, roof, galv, trim, chain, wire, fascia, coping
- **Sections** (grep the text to jump there):
  - grounds: sidewalk, gate apron, asphalt yard, unit slabs
  - fence collision (the look comes with the exterior)
  - storage rows: white block skin, orange door frames, red corrugated pitched roofs, gables, unit numbers
  - chain-link fence with razor-wire coils; the gate (open, its leaf parked inside); the yard sign
  - the locker canopy along row B's back (the lockers are props, placed at build)
  - the office: buff block skin, navy fascia + parapet, the HIDE YOUR JUNK board, barred windows, door hood
  - units inside: galvanised sheet under the roof, a bare bulb, scuffs on the slab
  - office inside: blue carpet, cream walls over a navy dado, drop ceiling with troffers; tiled toilet
  - office: customer counter with the till, desk + CCTV, filing cabinets, sofa under the eye picture, key cabinet
  - yard dressing: moving boxes and a hand truck by the van (the van is placed at build), bin bags, a dumped mattress
  - sidewalk: street lights, meter, hydrant, no parking

### Little Prick Clinic — `js/layers/littleprick.js`
half-plot walk-in clinic under a clay-tile gable roof: waiting area (teal bench seating, herringbone oak) with the reception counter and secretary area, a corridor to two consulting rooms, a jab room, the doctor's office and an accessible toilet; staff yard behind · NEWCAT id `piety_medical_clinic` · builder `bLittlePrick` · 1552 lines

- **Helpers / painters:** `LEFT`, `BACKD`, `CORL`, `CORR`, `TABLES`, `TEAL`, `logo`, `signMat`, `card`, `bLittlePrick`
- **Surfaces (`surf('key')`):** asphalt, concrete, lawn, fence, brick, tile, paving, alu
- **Sections** (grep the text to jump there):
  - grounds: sidewalk, forecourt, grass strip, side walks, staff yard
  - exterior skin: red brick all round, soldier course, dark plinth
  - sign panel: sage boards with the LITTLE PRICK CLINIC logo, dark capping
  - window posters
  - roof: clay-tile gable (ridge along x), fascia, soffits, gutters, bargeboards, ridge tiles
  - forecourt: bollards, A-board, bench, bin, planters, bike hoops
  - staff yard: door hood, wall lamp, clinical-waste bins, AC condenser, board fences
  - interior: floors, linings, ceilings, lights
  - shared makers: exam couch, curtain rail, sink unit, chairs, wall plates
  - reception: white counter with a smoked-glass front, screen, monitors
  - secretary's area: oak feature wall with the logo, chair, filing cabinets, printer
  - waiting area: teal bench seating on oak plinths, ottoman, coffee table, art, water cooler, plants
  - corridor: door plates, hand gel, notice board, extinguisher
  - consult 1 (left front): couch, curtain, sink, chairs, eye chart, scales
  - jab room (left back): phlebotomy chair, couch, trolley, worktop, posters
  - consult 2 (right front): mirror of consult 1
  - doctor's office: chair, visitor chair, filing cabinet, coat stand, certificates, rug
  - accessible toilet: WC, grab rails, basin, mirror, dryer, baby change, pull cord
  - dressing: scattered papers, a dropped clipboard, spilled pills, used swabs, smears
  - sidewalk: street lights, meter, hydrant, no parking

### Greasy & Needy Diner — `js/layers/greasyneedy.js`
half-plot 1950s diner on the back half of the plot: booths, counter with chrome stools, back bar, jukebox, kitchen line under a hood, customer toilet; car park with 50s cars in front, neon roof sign, pole sign · NEWCAT id `diner` · builder `bGreasyNeedy` · 1407 lines

- **Helpers / painters:** `LEFT`, `WCF`, `RED`, `SCRIPT`, `neonText`, `roofSign`, `poleSign`, `strap`, `menuBoard`, `poster`, `POSTERS`, `flagMat`, `recordMat`, `bGreasyNeedy`
- **Surfaces (`surf('key')`):** asphalt, concrete, fence, fluted, enamel, checker, quarry, tile, vinyl, redEnamel, chrome
- **Sections** (grep the text to jump there):
  - grounds: sidewalk, car park asphalt, walk in front of the diner, service strip
  - exterior skin: fluted steel skirt, cream enamel, red band under the fascia
  - fascia: a deep rounded red band with three neon stripes, front and both sides
  - the GREASY & NEEDY / DINER neon on an open steel frame over the roof
  - red standing-seam awning over the window strip
  - the walk in front of the diner: kerb, benches, bin, news box, planters
  - car park: two rows of stalls, wheel stops, lane arrow, planting strip, driveway
  - service strip behind: grease drum, bins, crates, board fences
  - interior: floors, linings, ceilings, lights
  - booths along the front windows: red / white tuck-and-roll, black tops with chrome edges
  - the counter: red front with white chevrons, black top, chrome edge; chrome stools
  - the back bar: stainless counter with a shake station, soda taps, coffee urns, menus over it
  - jukebox, gumball machine, the toilet hall
  - dining walls: flag, records, posters
  - kitchen: the cook line (fryers, griddle, range, broiler) under a hood
  - toilet: WC, basin, mirror, dryer, a cubicle for the WC
  - sidewalk: street lights, meter, hydrant, no parking at the driveway

### Major Woody's Army Surplus — `js/layers/majorwoody.js`
half-plot army surplus store: shop floor with camo rails, pegboard gondolas, counter, ration shelving; ammo room, office, stock room, toilet; board-fenced motor pool with a block garage, army trucks, a jeep and camo net, open to the alley · NEWCAT id `army_surplus` · builder `bMajorWoody` · 1383 lines

- **Helpers / painters:** `GX0`, `GAP`, `WAOPS`, `WOOPS`, `WWOPS`, `GSIDE`, `GRUNS`, `GOLD`, `bombText`, `strapMat`, `plaqueMat`, `POSTERS`, `posterMat`, `neonMat`, `bMajorWoody`
- **Surfaces (`surf('key')`):** asphalt, concrete, lawn, fence, brick, render, block, tile, coping, alu, shutter, roof
- **Sections** (grep the text to jump there):
  - grounds: sidewalk, front apron, side walks, motor pool
  - exterior skin: red brick plinth to the sills, cream render above
  - parapet, coping, raised centre fascia, flat roof
  - the bomb signs
  - shopfront: GRAND OPENING banner, plaque, posters in the glass
  - front apron: sandbag walls, an ammo-crate bench, an A-board
  - the back: door hood, wall lights, STAFF strip
  - garage: corrugated roof, rolled-up shutter, jamb guards, MOTOR POOL sign
  - board fences round the motor pool, the gap to the alley with its gates swung open
  - interior: floors, linings, ceiling, lights
  - shop: the APOCALYPSE WOW neon, a flag, posters
  - shop: camo jacket rails down the left wall, a shelf of helmets over them
  - shop: pegboard gondolas of fatigues, berets, packs and kits (right half)
  - shop: the service counter, back shelf
  - shop: crate shelving on the back wall, packing crates, window mannequins
  - AMMO ROOM: crate shelving, counter, back bar, posters
  - OFFICE: desk, map board, flag, safe
  - STOCK ROOM: boxes, a stack of crates; STAFF TOILET: WC, basin, mirror
  - GARAGE interior: oil-stained floor, tyre stack, drums, shelving
  - motor pool: camo net over a crate dump, drums, tyres, sandbags by the back door
  - garage bay header (the walls themselves are core WL)
  - sidewalk: street lights, meters, hydrant, no parking

### The Final Load & Get Nailed — `js/layers/finalload.js`
half plot split into two businesses: The Final Load laundromat (bank of coin-op washers on a tiled plinth, stacked dryers, folding island, carts, waiting chairs, change machine, utility room) and Get Nailed nail salon (lit polish wall, reception, manicure stations, pedicure thrones, customer toilet, back room); vending machines and benches out front; dingy back yard · NEWCAT id `laundromat` · builder `bFinalLoad` · 1841 lines

- **Helpers / painters:** `LZ`, `FRONT_L`, `FRONT_R`, `L_PART`, `R_PART`, `WASH_Z`, `TABLES`, `WW`, `washerGeo`, `ORANGE`, `strapMat`, `decal`, `bubbles`, `flFascia`, `gnFascia`, `polishWall`, `bFinalLoad`
- **Surfaces (`surf('key')`):** asphalt, concrete, fence, render, block, orange, pinkM, white, coping, alu, silver
- **Sections** (grep the text to jump there):
  - grounds: sidewalk, front apron, side walks, back yard
  - exterior skin: block sides and back; laundromat front grey riser + block, salon white render
  - The Final Load: orange box awning with lettering, soffit downlights; window vinyl
  - Get Nailed: white fascia panel with pink lettering, pink neon script in the windows
  - parapet, flat roof, AC units, dryer vent stacks
  - front apron: benches, a bin, planters, the salon A-board
  - back yard: door hoods and signs, fences, a dingy service yard
  - interior: floors, linings, ceilings, lights
  - The Final Load hall: the washer bank, stacked dryers, folding island, carts, waiting chairs, change machine
  - The Final Load utility room: water heaters, mop sink, detergent pallet, a gutted washer, breaker panel
  - Get Nailed salon: polish wall, reception, waiting corner, manicure stations, pedicure thrones
  - Get Nailed customer toilet: WC, basin + mirror, hand dryer, grab rail
  - Get Nailed back room: towel rack, stacked washer, staff table, autoclave counter
  - sidewalk: street lights, meter, hydrant, no parking
  - dingy back yard: bin bags, lint sacks, a dumped washer, puddles, pallets, wheelie bins, a smoke spot
  - interior dressing: lost socks, spilled soap, a wet floor sign; spilled polish and cotton balls

### PizzaBytes — `js/layers/pizzabytes.js`
half-plot pizza restaurant: dining room (booths, gingham four-tops, arcade cabinets), order counter with a heated slice case, open wood-fired dome oven and make line; kitchen (conveyor oven, dough mixer, proofing rack, fryer), walk-in cooler, dry stores, office, customer toilet; patio with parasols, scooter, pole sign, giant roof slice · NEWCAT id `bakery` · builder `bPizzaBytes` · 1862 lines

- **Helpers / painters:** `TX`, `LEFT`, `WCS`, `OFF`, `RED`, `PIX`, `SCRIPT`, `stripes`, `pixelSlice`, `logoMat`, `letters`, `board`, `menuMat`, `MENUS`, `poster`, `POSTERS`, `bPizzaBytes`
- **Surfaces (`surf('key')`):** asphalt, concrete, fence, brick, pavers, stucco, coping, terra, chkTile, gingham, tile, quarry, mosaic, greenP, redP, chrome
- **Sections** (grep the text to jump there):
  - grounds: sidewalk, front apron, round the building, yard to the alley
  - exterior skin: red brick, green tile stallriser on the front, cream stucco band at the top
  - parapet, raised front centre for the letters, flat roof, oven chimney
  - the giant pizza slice on the roof: a tilted wedge on a steel frame
  - the PIZZABYTES letters on the raised parapet, the logo board under them
  - awning: green / white / red stripes over the whole shopfront
  - front apron: patio, walk to the doors, parking stalls
  - pole sign at the front right corner
  - the yard behind: oven wood store, dumpster corner, grease drum, crates, board fences
  - sidewalk: street lights, meter, hydrant, no parking
  - interior: floors, linings, ceilings, lights
  - the order counter: red front with the logo, oak top, heated slice case, till
  - the wood-fired oven: brick plinth, mosaic dome, mouth toward the make line, flue
  - the make line: refrigerated topping rail, cutting board, heat lamp shelf
  - dining: booths along the left wall
  - dining: gingham four-tops with bentwood chairs
  - the "bytes": two arcade cabinets on the right wall
  - dining walls: posters, the neon slogan, a framed photo wall
  - kitchen: conveyor oven, dough mixer, proofing rack, fryer, pizza box stacks
  - walk-in cooler: insulated panels, strip curtain, evaporator
  - customer toilet: WC, basin, mirror, dryer
  - manager's office: desk, monitors, safe, cork board, a stack of unpaid parking tickets
  - dressing: dropped slices, open boxes, a knocked-over chair, smears, litter

### Kebabsolutely & Nightmare on Wok Street — `js/layers/kebabwok.js`
half plot split into two takeaways: Kebabsolutely (doner spits, salad counter, fryer) and Nightmare on Wok Street (flaming wok range under a hood, hot cabinet, fish tank); waiting benches, customer toilets, kitchens, questionable back rooms (chained freezers, MEAT (MIXED) boxes, camp beds, card tables, dodgy stock); vending machines and benches out front; dingy yard · NEWCAT id `mr_foos_takeout` · builder `bKebabWok` · 2023 lines

- **Helpers / painters:** `U_FRONT`, `U_BACK`, `SIDE`, `U_PART`, `U_KPART`, `U_WC`, `opsU`, `TABLES`, `RED`, `strapMat`, `decal`, `txt`, `drawBurger`, `drawGrill`, `kbFascia`, `drawWok`, `nwFascia`, `hygMat`, `eatenMat`, `menuMat`, `boardMat`, `bKebabWok`
- **Surfaces (`surf('key')`):** asphalt, concrete, fence, brick, redP, goldP, blackP, coping, alu
- **Sections** (grep the text to jump there):
  - grounds: sidewalk, front apron, side walks, back yard
  - exterior skin: sooty brick all round; red shopfront (kebab), red and gold shopfront (wok)
  - parapet, flat roof
  - shopfront frames: red on the kebab shop, red with gold beads on the wok
  - fascias: the Kebabsolutely red lightbox, the Nightmare on Wok Street red and gold board
  - roof: extract fans, the kebab shop's tall flue, AC units
  - front apron: benches, bins, A-boards, the wok delivery scooter
  - sidewalk: street lights, meter, hydrant, no parking
  - back yard: door hoods and signs, board fences, a dingy service yard
  - interior: floors, linings, ceilings, lights (both shops, mirrored)
  - shared makers: steel table, wall shelving, folding chair, chained freezer, crate
  - waiting area: bench along the party wall, menu boards, the cooler / fish tank
  - the counter: kebab steel with salad wells + sneeze guard; wok red with gold trim
  - back bar: kebab doner spits, fryer, pitta warmer; wok hot cabinet, rice warmer, sauces
  - kitchen
  - the store: chained freezer, mincer, shelving of tubs, MEAT (MIXED) boxes, stains
  - the back room: camp bed, card table, cash, dodgy boxes, CCTV, a safe
  - dressing: chip papers, napkins, a wet floor sign

