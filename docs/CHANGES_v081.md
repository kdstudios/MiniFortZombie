# Mini Fort Zombie v081: lot kit and building catalogue

This version doesn't change gameplay. It makes new buildings cheaper to write and lets them reuse everything already built.

## `js/props/lotkit.js` (new): `LOTKIT`, used as `LK`
The plumbing that had been copied into all 11 full-block lot layers now lives in one place:
- `LK.geo(name)`: a prop-kit builder plus the collision list (`S(...)`), and `done()` to return `{M, cols, occ}`.
- `LK.pavement`: the front sidewalk slab with joints and an optional kerb. Its width is configurable, so it also works for 20 m half plots.
- `LK.lineWall(..., span)`: the interior lining that steps round `WL` doors, windows and gates. Each lot only supplies its own layers (wainscot, tile, plaster...).
- Street props: `LK.lightPole` (with arm and brace options, covering the church and motel variants), `LK.meter`, `LK.hydrant`, `LK.signal`, `LK.noParking`.
- `LK.attach` (decor meshes, world solids, occluders), `LK.spawner` (lootable prop containers), `LK.finish` (loot rooms, map footprint, zombies, `LASTB`).
- `LK.register`: the `ruin` cap, the `NEWCAT` update or a new entry, `NOYARD`, and exported globals.

It loads right after `mfzkit.js`.

## `js/layers/church.js` moved onto the kit
It's now the template for new lots and went from 1,479 to about 1,330 lines. On a seeded build, these all matched v080 exactly: 78 meshes, 693,378 vertices, the position checksum, 71 colliders, 8 occluders, 159 world solids, the four loot containers (positions, angles, tables), the zombie spawns and the map footprint.

`LK.register`'s new-entry path was tested separately: it creates the entry, caps `ruin`, adds the lot to `NOYARD` and exports its globals.

The other 10 lots are unchanged and still carry their own copies. Move one onto the kit only if you're editing it anyway.

## `docs/FEATURES.md` (new)
This is a catalogue of what every full-block building contains:
- A "find by feature" table, e.g. stained glass, marquee, booths, gun racks, pool, lanes, water tower.
- For each building: its helpers and painters, its `surf()` materials, and its section headings, which you can grep to jump to the code.

The per-building half is regenerated with `tools/arch/features.py`.

## Docs
`ARCHITECTURE.md` (file map, "where do I look", tools, regenerated wrapper table) and `CLAUDE.md` (the new-building routine) are updated.
- `tools/arch/lotcheck.py` (new): builds a lot headless and reports page errors, mesh / vertex / collider counts, loot and zombie spawns, and can save an overview render. Use it to test a new building before playing.

# v081 (continued): multi-storey pathfinding

Added to v081 without a version bump. Zombies and followers now path through buildings with upper floors: up and down stairs, through doors upstairs, and out of upstairs windows. Before this, upper floors were invisible to the AI and every staircase counted as a wall.

## `js/layers/zfloors.js` (new): `NAVF`
- **Floors are found automatically** from the collision boxes, so no building needs setting up. Every box top is a possible surface (read the way `groundAt` reads it). A surface becomes a node if a body fits on it. Surfaces up to 0.42 m apart link to their 8 neighbours. Stairs are just a run of nodes, each a step higher.
  - Only surfaces that connect back to the ground are kept, so car roofs, table tops and roofs drop out.
  - Ground cells keep their core `NAV` index; floor nodes are numbered from `NAV.w * NAV.h` up.
  - In a full town this takes about 0.1–0.2 s and gives about 4,700 floor nodes. The two-storey house types, The Aztec's upper level and the skatepark ramps are all picked up.
- **Window drops.** Every upstairs window gets a one-way link from the floor inside it to the ground outside.
  - Zombies use a drop when it's quicker: they smash the glass, climb onto the sill, go out and fall.
  - The window the player has just jumped out of is nearly free for zombies, and it is the only window followers will use.
- **Falls ragdoll.** Any fall over `NAVF.ragH` (2.2 m; a ground-floor sill is about 0.9 m) ragdolls the zombie (`zKnock`) or the survivor; they then get up and carry on. Survivors use the same Riposte ragdoll, rebuilt and stood back up. This also covers zclimb drops off anything that high.
- **One flow field over ground and floors.** `navField` and `navSoft` are replaced. Doors, windows and barricades upstairs now cost upstairs, instead of on the ground cells underneath them.
- **Followers** path on the same graph (`NAVF.compWay`). They go round walls, take the stairs, open doors upstairs and follow you out of the window you used.
  - If a follower makes no progress for 4 s, it hops to the next clear point on its route, in the same spirit as core's 30 m catch-up teleport.
- **Debug view:** Dev Toolkit > Building > Test worlds > *Floor nav overlay*, or `navFloorsDebug(true)` in the console. It shows nodes coloured by height and window drops in red.

## `js/layers/zpath.js`
- Routes, A* and string pulling work on ground and floor nodes together. A route can end at a window drop (`r.drop`); the zombie then smashes the glass and goes out.
- A* to a target upstairs uses `NAVF.remFor`: the exact remaining cost over that floor and from the foot of its stairs, cached for 1 s. The search aims at the stairs instead of flooding the town under the target. Stale heap entries no longer count toward the cap.
- Movement steps up about 0.35 m like the player does. On a route that climbs, a zombie can scramble up two treads at once (switchback stairs).
- On a floor, a zombie never walks off an edge (stairwell, stair side) unless the route says so.
- A target on the floor below is no longer "reached" just because it is 2D-close.
- At the door, window or barricade a route ends on, the zombie now aims *through* it. The line test accepts every cell of that same door or window (this fixed a back-and-forth at doors).
- `ZPATH.route(p, target, 'comp')` gives followers a route.

## Core and other files
- `09_zombies.js`:
  - Zombies remember which floor they last saw you on (`u.ly`).
  - They face level on any floor (`lookAt` used y 0).
  - Only zombies on the same floor push each other apart.
  - Idle wanderers respect walls at their own height and never wander off a floor edge.
  - Vaults go from the height they start at to the height they land at.
- `11_companions.js`:
  - Followers take `NAVF.compWay` waypoints, step up like the player and scramble switchback stairs.
  - Directly above or below you still counts as far away.
  - Doors now open away from the follower, and a follower caught inside an open door's leaf steps out of it.
  - A slide they are barely moving on counts as stuck, so the side-step kicks in.
- `perf.js` `los`:
  - On one floor, the 2D slice is 1.5 m above *that* floor. It was always 1.5 m above the ground, so upstairs walls and doors never blocked sight.
  - Between floors, a real 3D segment test runs, so ceilings block sight.
- `zknock.js`, `skills.js`, `devtoolkit.js`: also record the last-seen floor. `devtoolkit.js` also has the overlay button.
- `zfloors.js` replaces `startVault`, so landings can be on stairs and steps. A window opening onto the foot of a staircase used to send the vault on past the stairs, or back out.

## Tested (headless, Playwright)
- **Two-storey house**, zombie outside, player upstairs:
  - Siege flow field: in through a window, up the stairs, through the upstairs door and a melee hit in about 28 s.
  - Last-seen memory (A*): front door, stairs, about 27 s.
- **Zombie upstairs, player outside:** smashes the side window, climbs out, ragdolls and reaches the player in about 7 s.
- **Player jumps out of a window:** the follower takes the same window, ragdolls and catches up in about 5 s.
- **Player upstairs, follower outside:** front door, stairs, upstairs in about 9 s, never through a window.
- **The Aztec:** zombies from three sides reach the 4.6 m level in 25–35 s; a follower in 11 s.
- **Dev Toolkit "AI test areas" upstairs room:** 10 s.
- **Full town**, 40 hunters, player upstairs: 26 upstairs and 21 at the player after 60 s, at 2.3 ms per `updateZombies`. With the player on the ground, arrivals and cost (about 2 ms) match v081.

## Known limits
- Zombies still only spawn on the ground.
- Window drops are one-way: nothing climbs back in through an upstairs window. Ladders and drainpipes would be new links of the same kind.
- The floor graph is built with the nav grid. A door leaf that swings open later can still sit on a route; zombies bash it, and followers step round it or hop.
