# Mini Fort Zombie v083: Half Plot House, roomier + garages

Fixes from play-testing v082 (`js/layers/halfhouse.js`).

## Room to move
- All five plans redrawn bigger: house bodies up to 13.8 x 12.5 m (colonial), rooms mostly 4-6 m across, halls and landings 2.5 m+.
- Stairs 1.5 m wide (was 1.1), with a 2.5 m landing beside the stairwell and 2.5 m clear at the top before any wall or door.
- Open archways (3.2 m, no door leaf) between living room, dining room, hall and kitchen. Real doors only on bedrooms, bathrooms, the garage and the outside, placed so they don't open onto the stairs.
- Archways and garage openings now keep furniture clear (core only did this for doors), so a sofa or TV can't block one.
- The trim ledge along the brick plinth used to run across door and garage openings as a lip; it now stops at them.

## Garages
- **Attached garage** (3 in 7 houses): 4.6 m wide beside the house, a 3.2 m drive-in opening with the door rolled up, a concrete floor level with the driveway, its own street-facing gable roof, and a door into the house. The driveway (3.6 m) runs straight into it and the porch stops beside it.
- **Rear garage** (2 in 7): a detached 6.2 x 6.2 m garage in the back corner opening onto the alley, with a flush concrete apron to the alley, a door and window to the yard, and a break in the back fence.
- Garages get a tool bench ('hardware') and boxes ('storage') along the walls, with the middle clear for a car.
- **Dropped kerb**: the kerb between lawn and sidewalk is now a flush strip across the driveway (it was a 16 cm step all the way along).

## Other
- Chimneys, roof pitches and porches follow the new sizes.
- `HALFHOUSE.last` holds the last plan built (test hook).

## Tested
- 450 cached variants (plan x mirror x roof x porch x fence x garage) build with no errors.
- Walk test, 60 seeded houses (`tools`-style flood fill at player size, r 0.4 and r 0.5, doors open): every ground-floor room reachable from the front door; every stair climbable; every upstairs room reachable from the landing; attached garages open to the driveway; rear garages reach both the alley and the yard. No failures.
- `lotcheck.py` on `small_house` and `medium_house`: `ERRORS: none`.
