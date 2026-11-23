# Mini Fort Zombie v084: Plot Twist Cemetery + fixes

## New: Plot Twist Cemetery (`js/layers/cemetery.js`, replaces the core `cemetery` yard)
Full block, on the lot kit.
- **Boundary**: wrought-iron railings with spear tips and a scroll band on a stone kerb, ashlar piers every ~5 m (front and both sides); a dry-stone back wall with coping and ivy.
- **Gate**: ashlar piers with stone urn finials, double iron gates (left swung wide open, right ajar), a scrolled iron arch carrying the name.
- **Paths**: gravel avenue with stone edging, a cross walk, a ring round the war memorial, a flagstone plaza in front of the mausoleum, a path out to the shed.
- **Mausoleum** (enterable): ashlar walls, portico with four fluted marble columns, entablature with the family name, a slab pediment roof with acroteria, bronze urns on pedestals. Inside: a checkered marble floor, a coffered ceiling, marble walls with a dado, 42 crypt niches with name plates, a glowing stained-glass oculus, an altar with candles, candle stands, two sarcophagi (one lid shoved aside), a coffin on a bier, a dried wreath.
- **Graves (~150)**: 15 kinds (rounded, gothic, ogee, square, slant, cross, Celtic cross, angel on a pedestal, lamb, flat marker, broken, toppled, obelisk, table tomb, ledger). They come in 6 stone finishes with engraved names, dates and epitaphs. Some lean, sink or come with kerbs, chips, mounds or dirt plots; some have flowers, wreaths or red grave lanterns. There's a children's section, an old section and a chained family plot with an angel and ledgers.
- **Zombie touches**: three burst-open graves (earth thrown out, splintered lids, stones knocked over); two freshly dug graves with spoil heaps, boards and a shovel; coffins waiting.
- **Also**: a sealed gothic family vault, a 6 m war memorial obelisk with bronze plaques and a wreath, giant praying hands, iron lamp posts, stone benches, a birdbath, dead trees, red maples, cedars at the gate, fallen leaves, and a groundskeeper's shed (workbench, pegboard, shelves, sacks, mower; lean-to with a wheelbarrow and spades).
- **Loot**: new lootable props `coffin` and `funeral_urn` ('cemetery' table): 3 coffins, 2 urns. Tool chest and toolbox ('hardware') in the shed, plus 2 random 'cemetery' containers.
- 216k vertices (the church is 235k). Walk test: every section, the shed and the crypt are reachable from the gate.

## Fixes
- **Colt Python**: the rear sight's elevation screw floated 4 mm above the sight (`js/modern/guns.js`); removed.
- **Combat shotgun lag spike**: its noise radius (60 m, also the double-barrel's) woke every zombie in range at once, and each one ran a full A* path search in the same frame (and groaned, building new audio nodes). Now A* searches are capped at 3 per frame (`ZPATH.astarFrame`, `js/layers/zpath.js`); the rest keep their old route for a frame or two. Groans are capped at 3 per 0.4 s (`wakeZ`, `js/game/core/04_bodies.js`). Measured with 60 zombies in range: worst frame of zombie pathing after a shot 35 ms -> 5-7 ms.
- **Zombies climbing walls** (`js/layers/zclimb.js`): the climb limit was 4.4 m and only mesh-built walls were tagged, so lot-kit building walls (collision boxes) could be climbed. Now the limit is 2.9 m and any box standing more than 2.65 m above the ground counts as a wall. Fences, cars, low walls and 2.6 m containers can still be climbed; building walls, doors and windows can't (also not from on top of a car). Checked on a built town: all 29 untagged wall-like boxes now blocked, all 34 car / container boxes and 132 fences still climbable.
