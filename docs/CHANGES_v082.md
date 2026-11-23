# Mini Fort Zombie v082: Half Plot House

## `js/layers/halfhouse.js` (new, on the lot kit)
Designed houses for the 20 x 36 m half plots. They replace the `newlots.js` placeholders `small_house` (one storey) and `medium_house` (two storey) and keep their town rules (min 2, max 3 each, same lots). `fortified_house` is unchanged.

- **Five floor plans**, mirrored at random:
  - Two storey: **Colonial** (centre hall with open stairs; living, dining, den, kitchen; kids' room, bath, bedroom, master upstairs) and **Gable-front** (narrow, stairs in the living room, kitchen behind; master, bath, kids' room upstairs).
  - One storey: **Bungalow** (cross gable, side entry like the grey reference house), **Ranch** (long and low), **Cottage** (small side gable).
- **Roofs**: Dutch gambrel, side / front gable, hip. **Porches**: full-width, gabled portico, stoop, door hood. **Front fence**: picket, chain-link or a low hedge; board or chain-link side and back fences.
- **Colours per house**: 12 wall colours, 6 trims, 6 roofs, 3 bricks, 7 door / shutter accents, 7 interior paints, 6 carpets. Geometry is cached per plan / mirror / roof / porch / fence; the colours are swapped in at attach.
- **Outside**: clapboard over a brick plinth, corner boards, window casings, shutters, chimney, sunflowers and shrubs, driveway, front path, mailbox. Back yard: two of above-ground pool, shed (tool bench), swing set, vegetable bed, barbecue + picnic table; often a clothesline. Sidewalk: street light or hydrant, sometimes a USPS box or school-crossing sign.
- **Inside**: oak, carpet, black / white checker (kitchen) and tile (bath) floors; painted plaster with skirting; ceilings with a light in every room; carpeted stairs with white balusters, a dark handrail and a newel post; a railed landing round the stairwell (with collision).
- **Loot**: per room, along the walls, dodging doors (and windows for tall pieces): kitchen fridge / units / sink / washing machine, living-room bookshelf + coffee table or trunk, den bookshelf + steamer trunk, dining sideboard (dresser), bedroom dressers and trunks, kids' room box ('storage'), bath medicine cabinet ('clinic'), shed tool bench ('hardware'). Core furniture (beds, sofas, TVs, tables, chairs, bath, toilet...) fills the rest.
- Zombies start in the ground-floor rooms, at the front path and by the back door.

## Other
- `index.html`: script tag after `newlots.js`. Version 082.
- `docs/FEATURES.md` and `tools/arch/features.py`: the house added to the catalogue and the "find by feature" table.

## Tested
- Every cached variant (150 plan / mirror / roof / porch / fence keys) builds with no errors; 12 seeded houses of each type place their loot (5-9 containers each).
- `lotcheck.py` on `small_house` and `medium_house`: `ERRORS: none`.
