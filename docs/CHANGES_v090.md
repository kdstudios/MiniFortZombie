# Mini Fort Zombie v090: fix list (zombie reach, HQ on load, building fixes)

Everything in `docs/CHANGES_v089.md` still applies. No save format or co-op protocol change, but co-op players need the same build (version 090).

## Gameplay
- **Zombie melee reach halved:** 0.95 m standing, 0.7 m crawling (was 1.9 / 1.4). Zombies now walk in to 0.2 m inside their reach before they stop (`ZREACH`, `zStopAt` in `09_zombies.js`; `zpath.js` uses the same stop distance).
- **Loading a save opens on the Fort HQ menu.** The fort runs behind it; Resume or Esc walks out. A save made on siege day still goes straight into the siege. A new game still starts with clearing the fort, as before (`savegame.js`).

## Every building
- **Ruined lots:** trees are burnt bare (no leaves, charred bark), bushes and hedges go black. Leaf canopies in a lot's own artwork burn away (`condkit.js` `foliage`, `burnFlora`; `flora.js` draws `burnt` specs).
- **Signs on doors** move with the door. Any decor lying on a door leaf (OPEN / PUSH cards, handles, kick plates, strip curtains) is hung on the leaf, so it swings or slides with it and goes when the door is ripped off. A fixed post standing between a double door's leaves is removed (`LK.openings`, runs on every lot build).
- **Signs on windows** are hung on the window glass: they go when it breaks, and they're double sided, so they can be read from inside.
- **Text only visible from far off:** a painted label sitting a few mm inside the part behind it is moved out in front of it automatically (`condkit.js` `unbury`; 85 labels across the lots). Dumpster lettering (inside its 15 mm bevel) and the Nut & Bolt ice machine were fixed by hand too.
- **No random loot crates in the aisles.** In a fitted-out lot, `rc()` now puts its loot into one of the lot's own containers in that room (or the nearest one) instead of dropping a 1.5 m crate on a free spot of floor, which was usually a walkway, a doorway or the gap behind a counter. This is what blocked MediKill's shop floor, Water Tower's back office and Beat The Meat's freezer store.
- **Tills on counters** no longer stand on their 0.75 m floor stand on top of the desk: the stand is hidden and the till sits on the counter top (all 22 counter registers).
- **Street lights** (`LK.lightPole`): the arm is 1 m (was 2.4), so the lamp hangs over the sidewalk instead of out over the lot, where it looked like a floating lamp over the Greasy & Needy car park and the Hide Your Junk lane. (It can't reach over the road: nothing may leave its plot.)
- **Vans:** the lettering stands 3 cm off the flank on a cream sign panel (the corrugation ribs cut through it). Affects every MFZV van with a label (`tools/retro50_src/r50_decals.js`, rebuilt `retro50.js`).
- **Real vehicle models** replace the hand-built ones: Dead Weight van, Gutter Minds van and pickup, Inn-and-Out's two cars, Meat & 2 Veg's burnt van, Morning Wood's car, Nut & Bolt's van, sedan, service-bay car and two wrecks, Triggered's sedan, and Climax Cinema's prize car (`LK.vehicle`).
- **Upside-down props:** tents (Morning Wood, Dead Weight) and the A-board menu signs outside Beat The Meat, Daily Grind, Threads, Kebabsolutely / Nightmare on Wok Street, Get Nailed and PizzaBytes (they stood as a V).
- **Texture name clashes:** Gore-met Foods and Gutter Minds both used `gm_logo`, `gm_brick`, `gm_carpet`... so whichever built first painted both (Gutter Minds showed the Gore-met sign). Also Morning Wood / Major Woody (`mw_`) and Get Nailed / Greasy & Needy (`gn_rr`). Renamed in goremet, majorwoody and greasyneedy.
- **Dumpsters:** METRO DISPOSAL is POOR LIFE CHOICES DISPOSAL, CASCADE WASTE is BIN 'N' GONE WASTE, no RIP MARCO.

## Buildings
- **Aisle Be Back:** the tower's box, both skirt roofs and their shingle frustums stopped crossing the nave's front wall (the big square over the doors seen from the altar).
- **Bruno's Burgerama:** the kitchen's random crates are gone; the reach-in fridge is a lootable fridge and the lobby has a vending machine.
- **Campsite Woods / Hollow Pines:** ground patches, the path and the stream sit on separate heights (they z-fought).
- **Climax Cinema:** seats face the screen; projector beams are narrow at the port and wide on the screen (the wide end floated over the seats like a rug); real port windows in the booth wall in front of the projectors; the lobby ceiling stops at the stairwell (you walked up through it); the WIN THIS CAR pen is smaller with a real car and a small sign on a stand by it. The upper front window frames were built at NaN (`for (const c of FRONT_U)` took the opening objects): fixed, which also ends the old `computeBoundingSphere NaN` warning.
- **Gore-met Foods:** the dairy cases show their stock behind the glass (it was inside the case body); the brick course no longer crosses the sliding doors; the logo is an upright lit cabinet sign on the front parapet; the staff aisle behind the butchery counter is walkable again (the cooler door couldn't be reached).
- **Gutter Minds Bowling:** real van and pickup; its own sign is back (see texture clashes).
- **Inn-and-Out Motel:** one solid step up to the pool deck (two treads stood on the same spot, one floating); real cars.
- **Meat & 2 Veg:** real burnt van at dock 2; brick, panelling, stucco and wall textures at real scale (bricks were 3 cm tall).
- **MediKill:** power poles at both ends of the wire run; wall shelving pulled off the staff and stock-room doors; tills sunk into the counters.
- **Nut & Bolt:** yellow island caps stand clear of the islands; ICE readable close up; real cars.
- **Pawnographic:** disabled sign in front of its post; queue posts, ropes and the PLEASE WAIT TO BE SERVED sign removed; the ruined copy carries off about two thirds of the loose floor stock (`MFZCOND.thin`).
- **Plot Twist Cemetery:** the arch sign fits (it read "-LOT TWIST CEMETER-").
- **Triggered Firearms:** plain glass behind the bars (no orange blinds); real sedan.
- **Water Tower & Cerberus:** the soot smear over the back door is gone.
- **Beat The Meat & Soylent Greens:** fascia lamps raised clear of the cornice; counters 0.35 m forward so staff can get behind them; the hanging sides / veg can be walked through; strip curtains ride on the freezer doors (the doors can be used).
- **Beds, Burns & Beyond:** delivery-bay lines and hazard edges sit on top of the concrete; "& BEYOND" no longer overlaps BURNS.
- **Blue Balls Bank:** the granite plinth stops at the door surround; lettering fitted between the ball emblems on the frieze and the door board ("BLUE BALLS BA-").
- **Daily Grind:** the trailing greenery is short over the lettering and long only at the ends.
- **Greasy & Needy:** the roof sign stands on a red base on the fascia with visible legs (it looked like it floated); the low chrome trim line stops at the front door; no lamp hanging over the car park (see street lights).
- **Kebabsolutely & Nightmare on Wok Street, The Final Load & Get Nailed:** fascia boxes sized round their artwork, which now fits inside the trim; "on Wok Street" clear of the wok drawing.
- **Little Prick Clinic:** handles and the OPEN card ride on the door leaves; the fixed centre mullion is gone.
- **White Trash House:** front lawn and dirt patches raised clear of the ground.

## Tested (headless Chromium, software GL)
- Every NEWCAT lot builds with no errors or warnings (48 lots), intact, looted and ruined. A full town build (expedition) runs; its TOWN VALIDATION list has the same kind of flat edge decals as v089 (24 against 34 there), and nothing from this version's changes.
- Reachability flood fill (player radius 0.33 m) of every ground-floor door and loot container in every lot at all three conditions. The Gore-met cooler door was unreachable before the fix. Left as they were: one box in the Blue Balls Bank back room and a chest freezer in PizzaBytes (both unreachable before this version too), and Dead Park's body pile.
- Renders of every changed spot: church nave, Burgerama kitchen plan, cinema (seats, beams, ports, prize pen, stairs), Gore-met front and dairy, Gutter Minds sign, bank front, Beds Burns sign, both double-shop fascias, Triggered, Nut & Bolt pumps and ice machine, pawn sign, cemetery arch, motel steps, Beat The Meat front and A-board, Morning Wood tents, dumpster lettering, MediKill poles and tills, Daily Grind, Little Prick's door open and shut, Dead Weight's van.

## Not tested
- Real-GPU visuals in the game's own lighting, the HQ-on-load flow in a live session, and the reach change against real play (zombies stopping and hitting at the new range).

## Files
`js/game/core/09_zombies.js`, `js/layers/zpath.js`, `js/layers/savegame.js`, `js/props/condkit.js`, `js/props/lotkit.js`, `js/layers/flora.js`, `js/layers/mfzprops.js`, `js/layers/vehicles.js`, `js/props/mfzm_outdoor.js`, `tools/retro50_src/r50_core.js`, `tools/retro50_src/r50_decals.js`, `js/modern/retro50.js` (rebuilt), `js/game/core/07_town.js`, `js/layers/newlots.js`, lot layers: `church`, `burgerjoint`, `cinema`, `goremet`, `bowling`, `motel`, `supermarket`, `medikill`, `gasstation`, `pawnshop`, `cemetery`, `gunshop`, `cerberus`, `beatmeat`, `bedsburns`, `bluebank`, `dailygrind`, `kebabwok`, `finalload`, `littleprick`, `sporting`, `hardware`, `majorwoody`, `greasyneedy`, `threads`, `pizzabytes`; `js/game/core/01_items.js` and `index.html` (version), `docs/FEATURES.md`.
