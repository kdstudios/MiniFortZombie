/* ==========================================================================================================
   MINI FORT ZOMBIE - HALF PLOT HOUSE (v082, roomier + garages in v083; on the lot kit): the designed houses for the 20 x 36 m half plots. Replaces the generic
   newlots.js placeholders 'small_house' (single storey) and 'medium_house' (two storey); 'fortified_house' is unchanged.
   Five floor plans, each with its own roof and porch options, mirrored at random and repainted per house from a colour palette:
   v083: bigger plans (2.5 m halls / landings, 1.5 m stairs, 3.2 m open archways, doors only on bedrooms / baths / outside);
   garage per house: attached (drive-in opening, flush floor, dropped kerb), rear (detached, opening on the alley) or none.
     two storey: COLONIAL  - centre hall with an open staircase, living / dining left, den / kitchen right; 3 bedrooms + bath upstairs.
                             Roof: Dutch gambrel, side gable or hip. Porch: full-width, gabled portico or a plain stoop.
                 GABLEFRONT - narrow, gable to the street; open stair in the living room, kitchen behind; 2 bedrooms + bath upstairs.
                             Roof: front gable or barn gambrel. Porch: full-width or half.
     one storey: BUNGALOW  - cross gable: a front wing with a picture window, side entry stoop with a railing; 1 bed, bath, kitchen.
                 RANCH     - long and low, hip or gable roof; 2 bedrooms, bath, kitchen, big living room.
                 COTTAGE   - small side gable with a gabled hood over the door or a full porch; 1 bed, bath, kitchen.
   Exterior: painted clapboard over a brick plinth, corner boards and window casings in a trim colour, shutters, shingle roofs with
   fascia, brick chimney, porch posts and rails, sunflowers and shrubs, a picket or chain-link front fence, board / chain side fences,
   driveway, front path, mailbox; back yard pieces (above-ground pool, shed, clothesline, swing set, vegetable bed, barbecue);
   the sidewalk with a street light, blue mailbox, school-crossing sign or hydrant.
   Interior: wood, carpet, checker and tile floors, painted plaster walls with skirting, ceilings with light fittings, stairs with
   white balusters and a dark handrail; furnished living rooms, dining rooms, kitchens, bedrooms and bathrooms.
   Loot: 'house' (fridge, kitchen units + sink, washing machine, bookshelf, coffee table, dressers, trunks), 'clinic' (bathroom
   medicine cabinet), 'storage' (boxes in the kids' room), 'hardware' (shed tool bench), plus 1 random 'house' container per house.
   Structure from core WL (doors / windows work, upstairs windows are window drops); detail is our own geometry and painted art.
   ========================================================================================================== */
(function () {
  'use strict';
  const K = window.MFZK,
    LK = window.LOTKIT; // shared lot plumbing (js/props/lotkit.js)
  if (!K || !LK || typeof WL !== 'function' || typeof NEWCAT === 'undefined') {
    console.warn('[halfhouse] core / prop kit missing');
    return;
  }
  const T = THREE,
    P = K.P,
    PI = Math.PI;
  const H1 = 3.0, // ground storey wall height (and the single-storey eave)
    FY = 3.1, // upstairs floor level
    H2 = 2.9, // upstairs wall height -> eave 6.0
    RISE = 0.31, // stair riser (10 steps to FY)
    RUN = 0.45,
    NST = 10,
    PL = 0.45; // brick plinth height

  /* ===================== palettes (picked per house, painted onto the cached geometry at attach) ===================== */
  const WALLS = [
    0x5e7088, // blue-grey (the reference house)
    0xd8d0b4, // cream
    0xe6e4dc, // white
    0x8fa88a, // sage
    0xe2cc86, // butter
    0xa8ccb8, // mint
    0x8a3a30, // barn red
    0x6a7280, // slate
    0xd09a84, // salmon
    0xa69ab8, // lilac
    0x9a9a62, // olive
    0x9ab8d4 // sky
  ];
  const TRIMS = [0xeeeeea, 0x8a3a2a, 0x2e4a34, 0xe2d8c0, 0x3a3a3e, 0x2a3a5a];
  const ROOFS = [0x8a8a92, 0xa08070, 0x707070, 0x84907c, 0xb07a6a, 0x9a8a78];
  const BRICKS = [0xffffff, 0xe0c8b8, 0xc4c0bc];
  const PAINTS = [0xe8e0cc, 0xd8c8a8, 0xc8d8c8, 0xd8d0e0, 0xe8d8c8, 0xd0d8e0, 0xe0c8b0];
  const CARPETS = [0x5a7a4a, 0x8a5a4a, 0x5a6a8a, 0xa0907a, 0x7a5a7a, 0x8a8a6a];
  const PK1 = a => a[Math.floor(Math.random() * a.length)];

  /* ===================== floor plans (building-local, front = +Z; walls on centre lines) =====================
     ext: {ax, f, a0, a1, n (outward), ops, fl}    int: {ax, f, a0, a1, ops, fl}   (ax 1 = runs along X at z = f, 0 = along Z at x = f)
     rooms: {r: [x0, x1, z0, z1], k, fl}   stair: {x0, x1, z0, dz} (NST steps of RUN from z0 toward dz)   hole: the stairwell in the upper floor
     boxes: the wall boxes (floor / ceiling / footprint); door: front door x (on the front wall at z = front) */
  const w = c => ({k: 'w', c}),
    d = (c, s) => ({k: 'd', c, s: s || 1}),
    g = c => ({k: 'g', c});
  /* v083: roomier plans. Every house body sits in x -9.0 .. 4.8 or less, so the +x strip (4.8 .. 10) takes the driveway, an attached
     garage (gar) or nothing; mirroring puts it on the other side. Halls and landings >= 2.5 m, stairs 1.5 m wide, open archways
     (two side-by-side gates = 3.2 m) between living spaces, real doors only on bedrooms, bathrooms and the outside.
     side: the ground-floor +x outside wall's openings without (side[0]) and with (side[1]) an attached garage.
     stair.in: which x edge of the stair is open (-1 = x0, +1 = x1); the other runs along a wall. */
  const arch = c => [g(c - 0.8), g(c + 0.8)];
  const PLANS = {
    colonial: () => ({
      two: true,
      boxes: [[-9, 4.8, -6.5, 6]],
      front: 6,
      door: -1.2,
      back: {z: -6.5, x: 2.0},
      ext: [
        {ax: 1, f: 6, a0: -9, a1: 4.8, n: 1, ops: [w(-7.4), w(-4.9), d(-1.2), w(2.8)], fl: 0},
        {ax: 1, f: -6.5, a0: -9, a1: 4.8, n: -1, ops: [w(-7.4), w(-4.9), w(-1.6), d(2.0, -1), w(3.75)], fl: 0},
        {ax: 0, f: -9, a0: -6.5, a1: 6, n: -1, ops: [w(-4.4), w(-1.6), w(2.0), w(4.5)], fl: 0},
        {
          ax: 0,
          f: 4.8,
          a0: -6.5,
          a1: 6,
          n: 1,
          side: [
            [w(-4.4), w(-1.4), w(3.6)],
            [w(-4.4), d(-1.0)]
          ],
          fl: 0
        },
        {ax: 1, f: 6, a0: -9, a1: 4.8, n: 1, ops: [w(-7.4), w(-4.9), w(-1.9), w(2.8)], fl: 1},
        {ax: 1, f: -6.5, a0: -9, a1: 4.8, n: -1, ops: [w(-7.4), w(-4.9), w(-1.6), w(2.8)], fl: 1},
        {ax: 0, f: -9, a0: -6.5, a1: 6, n: -1, ops: [w(-4.4), w(-1.6), w(2.0), w(4.5)], fl: 1},
        {ax: 0, f: 4.8, a0: -6.5, a1: 6, n: 1, ops: [w(-4.8), w(3.6)], fl: 1}
      ],
      int: [
        {ax: 0, f: -3.2, a0: -6.35, a1: 5.85, ops: [...arch(-3.3), ...arch(3.0)], fl: 0},
        {ax: 0, f: 0.8, a0: -6.35, a1: 5.85, ops: [...arch(-3.6), g(5.0)], fl: 0},
        {ax: 1, f: 0, a0: -8.85, a1: -3.2, ops: arch(-6.1), fl: 0},
        {ax: 1, f: 1.0, a0: 0.8, a1: 4.65, ops: [g(2.8)], fl: 0},
        {ax: 0, f: -3.2, a0: -6.35, a1: 5.85, ops: [d(-4.6), d(4.4)], fl: 1},
        {ax: 0, f: 0.8, a0: -6.35, a1: 5.85, ops: [d(-4.8), d(4.7)], fl: 1},
        {ax: 1, f: -0.5, a0: -8.85, a1: -3.2, ops: [], fl: 1},
        {ax: 1, f: -3.0, a0: 0.8, a1: 4.65, ops: [], fl: 1}
      ],
      rooms: [
        {r: [-9, -3.2, 0, 6], k: 'living', fl: 0},
        {r: [-9, -3.2, -6.5, 0], k: 'dining', fl: 0},
        {r: [-3.2, 0.8, -6.5, 6], k: 'hall', fl: 0},
        {r: [0.8, 4.8, 1, 6], k: 'den', fl: 0},
        {r: [0.8, 4.8, -6.5, 1], k: 'kitchen', fl: 0},
        {r: [-9, -3.2, -0.5, 6], k: 'kids', fl: 1},
        {r: [-9, -3.2, -6.5, -0.5], k: 'master', fl: 1},
        {r: [-3.2, 0.8, -6.5, 6], k: 'hall', fl: 1},
        {r: [0.8, 4.8, -3, 6], k: 'bed', fl: 1},
        {r: [0.8, 4.8, -6.5, -3], k: 'bath', fl: 1}
      ],
      stair: {x0: -0.65, x1: 0.65, z0: -1.0, dz: 1, in: -1},
      hole: [-0.7, 0.7, -1.0, 3.5],
      gar: {r: [4.8, 9.4, -2, 6]},
      roofs: ['gambrel', 'gable', 'hip'],
      porches: ['full', 'portico', 'stoop'],
      roofAxis: 'x'
    }),
    gablefront: () => ({
      two: true,
      boxes: [[-4.4, 4.8, -7, 7]],
      front: 7,
      door: -1.0,
      back: {z: -7, x: 3.2},
      ext: [
        {ax: 1, f: 7, a0: -4.4, a1: 4.8, n: 1, ops: [d(-1.0), w(1.6), w(3.6)], fl: 0},
        {ax: 1, f: -7, a0: -4.4, a1: 4.8, n: -1, ops: [w(-2.6), w(0.4), d(3.2, -1)], fl: 0},
        {ax: 0, f: -4.4, a0: -7, a1: 7, n: -1, ops: [w(-4.6), w(-1.6)], fl: 0},
        {
          ax: 0,
          f: 4.8,
          a0: -7,
          a1: 7,
          n: 1,
          side: [
            [w(-4.6), w(-1.6), w(2.4), w(5.0)],
            [w(-4.6), d(-1.2)]
          ],
          fl: 0
        },
        {ax: 1, f: 7, a0: -4.4, a1: 4.8, n: 1, ops: [w(-2.4), w(1.2), w(3.5)], fl: 1},
        {ax: 1, f: -7, a0: -4.4, a1: 4.8, n: -1, ops: [w(-2.2), w(2.2)], fl: 1},
        {ax: 0, f: -4.4, a0: -7, a1: 7, n: -1, ops: [w(-4.3), w(3.0)], fl: 1},
        {ax: 0, f: 4.8, a0: -7, a1: 7, n: 1, ops: [w(-4.3), w(0.5), w(4.8)], fl: 1}
      ],
      int: [
        {ax: 1, f: 0, a0: -4.25, a1: 4.65, ops: arch(1.4), fl: 0},
        {ax: 1, f: -1.5, a0: -4.25, a1: 4.65, ops: [d(-1.4)], fl: 1},
        {ax: 0, f: -0.2, a0: -1.5, a1: 6.85, ops: [d(0.0), d(5.6)], fl: 1},
        {ax: 1, f: 2.5, a0: -0.2, a1: 4.65, ops: [], fl: 1}
      ],
      rooms: [
        {r: [-4.4, 4.8, 0, 7], k: 'living', fl: 0},
        {r: [-4.4, 0.2, -7, 0], k: 'dining', fl: 0},
        {r: [0.2, 4.8, -7, 0], k: 'kitchen', fl: 0},
        {r: [-4.4, 4.8, -7, -1.5], k: 'master', fl: 1},
        {r: [-4.4, -0.2, -1.5, 7], k: 'hall', fl: 1},
        {r: [-0.2, 4.8, -1.5, 2.5], k: 'bath', fl: 1},
        {r: [-0.2, 4.8, 2.5, 7], k: 'kids', fl: 1}
      ],
      stair: {x0: -4.25, x1: -2.75, z0: 5.5, dz: -1, in: 1},
      hole: [-4.25, -2.7, 1.0, 5.5],
      gar: {r: [4.8, 9.4, -2.2, 7]},
      roofs: ['gable', 'gambrel'],
      porches: ['full', 'half'],
      roofAxis: 'z'
    }),
    bungalow: () => ({
      two: false,
      boxes: [
        [-9, 4.8, -7, 1.5],
        [-9, -3, 1.5, 5.5]
      ],
      front: 1.5,
      door: -1.0,
      back: {z: -7, x: -4.6},
      ext: [
        {ax: 1, f: 1.5, a0: -3, a1: 4.8, n: 1, ops: [d(-1.0), w(1.5), w(3.4)], fl: 0},
        {ax: 0, f: -3, a0: 1.5, a1: 5.5, n: 1, ops: [w(3.5)], fl: 0},
        {ax: 1, f: 5.5, a0: -9, a1: -3, n: 1, ops: [w(-7.2), w(-4.8)], fl: 0},
        {ax: 0, f: -9, a0: -7, a1: 5.5, n: -1, ops: [w(-5.0), w(-2.6), w(2.0), w(4.2)], fl: 0},
        {ax: 1, f: -7, a0: -9, a1: 4.8, n: -1, ops: [w(-7.4), d(-4.6, -1), w(-1.7), w(1.2), w(3.4)], fl: 0},
        {
          ax: 0,
          f: 4.8,
          a0: -7,
          a1: 1.5,
          n: 1,
          side: [
            [w(-4.2), w(0)],
            [w(-4.2), d(0)]
          ],
          fl: 0
        }
      ],
      int: [
        {ax: 1, f: -1.5, a0: -8.85, a1: 4.65, ops: [...arch(-6.0), d(-1.7), d(1.2)], fl: 0},
        {ax: 0, f: -3, a0: -6.85, a1: -1.5, ops: [], fl: 0},
        {ax: 0, f: -0.4, a0: -6.85, a1: -1.5, ops: [], fl: 0}
      ],
      rooms: [
        {r: [-9, -3, -1.5, 5.5], k: 'living', fl: 0},
        {r: [-3, 4.8, -1.5, 1.5], k: 'dining', fl: 0},
        {r: [-9, -3, -7, -1.5], k: 'kitchen', fl: 0},
        {r: [-3, -0.4, -7, -1.5], k: 'bath', fl: 0},
        {r: [-0.4, 4.8, -7, -1.5], k: 'master', fl: 0}
      ],
      gar: {r: [4.8, 9.4, -6.5, 1.5]},
      roofs: ['gable', 'hip'],
      porches: ['stoop', 'porch'],
      roofAxis: 'x'
    }),
    ranch: () => ({
      two: false,
      boxes: [[-9, 4.8, -5, 4.5]],
      front: 4.5,
      door: -3.6,
      back: {z: -5, x: -5.2},
      ext: [
        {ax: 1, f: 4.5, a0: -9, a1: 4.8, n: 1, ops: [w(-7.6), w(-5.6), d(-3.6), w(-1.4), w(1.6), w(3.6)], fl: 0},
        {ax: 1, f: -5, a0: -9, a1: 4.8, n: -1, ops: [w(-7.6), d(-5.2, -1), w(-1.0), w(3.2)], fl: 0},
        {ax: 0, f: -9, a0: -5, a1: 4.5, n: -1, ops: [w(-2.8), w(2.0)], fl: 0},
        {
          ax: 0,
          f: 4.8,
          a0: -5,
          a1: 4.5,
          n: 1,
          side: [
            [w(-2.7), w(2.0)],
            [w(-2.7), d(1.2)]
          ],
          fl: 0
        }
      ],
      int: [
        {ax: 1, f: -0.5, a0: -8.85, a1: 4.65, ops: [...arch(-6.4), d(-1.0)], fl: 0},
        {ax: 0, f: -3.5, a0: -4.85, a1: -0.5, ops: [], fl: 0},
        {ax: 0, f: 1.5, a0: -4.85, a1: -0.5, ops: [d(-2.7)], fl: 0},
        {ax: 0, f: 0.5, a0: -0.5, a1: 4.35, ops: [d(2.0)], fl: 0}
      ],
      rooms: [
        {r: [-9, 0.5, -0.5, 4.5], k: 'living', fl: 0},
        {r: [0.5, 4.8, -0.5, 4.5], k: 'kids', fl: 0},
        {r: [-9, -3.5, -5, -0.5], k: 'kitchen', fl: 0},
        {r: [-3.5, 1.5, -5, -0.5], k: 'master', fl: 0},
        {r: [1.5, 4.8, -5, -0.5], k: 'bath', fl: 0}
      ],
      gar: {r: [4.8, 9.4, -3.5, 4.5]},
      roofs: ['hip', 'gable'],
      porches: ['stoop', 'long'],
      roofAxis: 'x'
    }),
    cottage: () => ({
      two: false,
      boxes: [[-6, 4.8, -5, 3.5]],
      front: 3.5,
      door: -1.8,
      back: {z: -5, x: -2.4},
      ext: [
        {ax: 1, f: 3.5, a0: -6, a1: 4.8, n: 1, ops: [w(-4.4), d(-1.8), w(0.4), w(3.2)], fl: 0},
        {ax: 1, f: -5, a0: -6, a1: 4.8, n: -1, ops: [w(-4.6), d(-2.4, -1), w(0.2), w(3.2)], fl: 0},
        {ax: 0, f: -6, a0: -5, a1: 3.5, n: -1, ops: [w(-2.8), w(1.5)], fl: 0},
        {
          ax: 0,
          f: 4.8,
          a0: -5,
          a1: 3.5,
          n: 1,
          side: [
            [w(-2.8), w(1.5)],
            [w(-2.8), d(1.5)]
          ],
          fl: 0
        }
      ],
      int: [
        {ax: 1, f: -0.5, a0: -5.85, a1: 1.6, ops: [...arch(-3.6), d(0.2)], fl: 0},
        {ax: 0, f: 1.6, a0: -4.85, a1: 3.35, ops: [d(1.8)], fl: 0},
        {ax: 0, f: -1.2, a0: -4.85, a1: -0.5, ops: [], fl: 0}
      ],
      rooms: [
        {r: [-6, 1.6, -0.5, 3.5], k: 'living', fl: 0},
        {r: [1.6, 4.8, -5, 3.5], k: 'master', fl: 0},
        {r: [-6, -1.2, -5, -0.5], k: 'kitchen', fl: 0},
        {r: [-1.2, 1.6, -5, -0.5], k: 'bath', fl: 0}
      ],
      gar: {r: [4.8, 9.4, -4.5, 3.5]},
      roofs: ['gable', 'hip'],
      porches: ['hood', 'full'],
      roofAxis: 'x'
    })
  };
  const ONE = ['bungalow', 'ranch', 'cottage'],
    TWO = ['colonial', 'gablefront'];
  const REAR = [3.4, 9.6, -17.5, -11.3]; // the detached rear garage, opening on the alley

  // v083: fit the garage choice (gk: 'none' | 'att' | 'rear'): pick the +x wall's openings, add the garage walls (gar: true) and its room
  function withGarage(p, gk) {
    const q = Object.assign({}, p, {
      ext: p.ext.map(e => (e.side ? Object.assign({}, e, {ops: e.side[gk === 'att' ? 1 : 0]}) : e))
    });
    q.gk = gk;
    if (gk === 'att') {
      const [x0, x1, z0, z1] = p.gar.r,
        cx = (x0 + x1) / 2;
      q.gar = {r: [x0, x1, z0, z1], att: true, gate: 'z1'};
      q.ext = q.ext.concat([
        {ax: 1, f: z1, a0: x0, a1: x1, n: 1, ops: arch(cx), fl: 0, gar: true},
        {ax: 0, f: x1, a0: z0, a1: z1, n: 1, ops: [w((z0 + z1) / 2)], fl: 0, gar: true},
        {ax: 1, f: z0, a0: x0, a1: x1, n: -1, ops: [], fl: 0, gar: true}
      ]);
    } else if (gk === 'rear') {
      const [x0, x1, z0, z1] = REAR,
        cx = (x0 + x1) / 2;
      q.gar = {r: REAR.slice(), att: false, gate: 'z0'};
      q.ext = q.ext.concat([
        {ax: 1, f: z0, a0: x0, a1: x1, n: -1, ops: arch(cx), fl: 0, gar: true},
        {ax: 1, f: z1, a0: x0, a1: x1, n: 1, ops: [d(x0 + 1.2), w(x1 - 1.6)], fl: 0, gar: true},
        {ax: 0, f: x0, a0: z0, a1: z1, n: -1, ops: [w((z0 + z1) / 2)], fl: 0, gar: true},
        {ax: 0, f: x1, a0: z0, a1: z1, n: 1, ops: [], fl: 0, gar: true}
      ]);
    } else q.gar = null;
    if (q.gar) q.rooms = p.rooms.concat([{r: q.gar.r, k: 'garage', fl: 0}]);
    return q;
  }

  // mirror a plan in X (m = -1): every x coordinate flips, ranges re-sort, side-wall normals flip
  const srt = (a, b) => (a < b ? [a, b] : [b, a]);
  function mirror(p, m) {
    if (m > 0) return p;
    const fx = v => -v,
      rx = r => [...srt(fx(r[0]), fx(r[1])), r[2], r[3]],
      wall = q => {
        const o = Object.assign({}, q, {ops: q.ops.map(op => Object.assign({}, op))});
        if (q.ax === 1) {
          [o.a0, o.a1] = srt(fx(q.a0), fx(q.a1));
          o.ops.forEach(op => (op.c = fx(op.c)));
        } else {
          o.f = fx(q.f);
          if (q.n) o.n = -q.n;
        }
        return o;
      };
    return Object.assign({}, p, {
      boxes: p.boxes.map(rx),
      door: fx(p.door),
      back: {z: p.back.z, x: fx(p.back.x)},
      ext: p.ext.map(wall),
      int: p.int.map(wall),
      rooms: p.rooms.map(r => Object.assign({}, r, {r: rx(r.r)})),
      stair: p.stair && Object.assign({}, p.stair, {x0: fx(p.stair.x1), x1: fx(p.stair.x0), in: -p.stair.in}),
      hole: p.hole && rx(p.hole),
      gar: p.gar && Object.assign({}, p.gar, {r: rx(p.gar.r)})
    });
  }
  const PCACHE = {};
  const plan = (id, m, gk) =>
    PCACHE[id + m + gk] ||
    (PCACHE[id + m + gk] = Object.assign(mirror(withGarage(PLANS[id](), gk || 'none'), m), {id, m}));
  // the footprint union of the plan's boxes
  const bbox = p => [
    Math.min(...p.boxes.map(b => b[0])),
    Math.max(...p.boxes.map(b => b[1])),
    Math.min(...p.boxes.map(b => b[2])),
    Math.max(...p.boxes.map(b => b[3]))
  ];
  // upper floor minus the stairwell hole -> up to 4 rects
  function minusHole(bx, h) {
    const [x0, x1, z0, z1] = bx,
      out = [];
    if (!h) return [bx];
    if (h[2] > z0) out.push([x0, x1, z0, h[2]]);
    if (h[3] < z1) out.push([x0, x1, h[3], z1]);
    if (h[0] > x0) out.push([x0, h[0], h[2], h[3]]);
    if (h[1] < x1) out.push([h[1], x1, h[2], h[3]]);
    return out;
  }

  /* ===================== surfaces ===================== */
  // painters for the tinted surfaces: drawn near-white so the per-house colour (K.tri col) sets the paint
  const DRAW = {
    clap: (c, W, H, r) => {
      const n = 8,
        s = H / n;
      for (let i = 0; i < n; i++) {
        const gr = c.createLinearGradient(0, i * s, 0, i * s + s);
        gr.addColorStop(0, '#d6d6d6');
        gr.addColorStop(0.12, '#ffffff');
        gr.addColorStop(0.85, '#f0f0f0');
        gr.addColorStop(1, '#9a9a9a');
        c.fillStyle = gr;
        c.fillRect(0, i * s, W, s);
      }
      for (let i = 0; i < 50; i++) {
        c.fillStyle = 'rgba(80,80,80,.10)';
        c.fillRect(r() * W, r() * H, 20 + r() * 90, 1.5);
      }
      P.grime(c, W, H, r, 0.45);
      for (let i = 0; i < 10; i++) {
        const gr = c.createLinearGradient(0, 0, 0, H);
        gr.addColorStop(0, 'rgba(60,60,60,.18)');
        gr.addColorStop(1, 'rgba(60,60,60,0)');
        c.fillStyle = gr;
        c.fillRect(r() * W, 0, 4 + r() * 16, H * r());
      }
    },
    shingle: (c, W, H, r) => {
      c.fillStyle = '#3a3a3a';
      c.fillRect(0, 0, W, H);
      const rows = 8,
        rh = H / rows;
      for (let j = 0; j < rows; j++)
        for (let i = -1; i < 9; i++) {
          const sw = W / 8,
            x = i * sw + ((j % 2) * sw) / 2 + (r() - 0.5) * 6;
          c.fillStyle = `hsl(30,${2 + r() * 6}%,${44 + r() * 26}%)`;
          c.fillRect(x + 1, j * rh + 1, sw - 2, rh - 1);
          c.fillStyle = 'rgba(0,0,0,.5)';
          c.fillRect(x, j * rh + rh - 3, sw, 3);
        }
      P.grime(c, W, H, r, 0.6);
    },
    brick: (c, W, H, r) => {
      c.fillStyle = '#c8c0b4';
      c.fillRect(0, 0, W, H);
      const rows = 12,
        rh = H / rows,
        bw = W / 4;
      for (let j = 0; j < rows; j++)
        for (let i = -1; i < 5; i++) {
          const x = i * bw + ((j % 2) * bw) / 2;
          c.fillStyle = `hsl(${6 + r() * 12},${42 + r() * 18}%,${30 + r() * 14}%)`;
          c.fillRect(x + 2, j * rh + 2, bw - 4, rh - 4);
        }
      P.noise(c, W, H, r, 3000, 0.2, '#2a1a14', 1.5);
      P.grime(c, W, H, r, 0.5);
    },
    plaster: (c, W, H, r) => {
      c.fillStyle = '#f4f4f2';
      c.fillRect(0, 0, W, H);
      P.noise(c, W, H, r, 4000, 0.06, '#808080', 2);
      P.grime(c, W, H, r, 0.25);
    },
    carpet: (c, W, H, r) => {
      c.fillStyle = '#e0e0e0';
      c.fillRect(0, 0, W, H);
      P.noise(c, W, H, r, 14000, 0.18, '#404040', 1.2);
      P.noise(c, W, H, r, 6000, 0.12, '#ffffff', 1.2);
      P.grime(c, W, H, r, 0.3);
    }
  };
  const tint = (k, col, o) => K.tri('hh_' + k, DRAW[k], Object.assign({col}, o));
  const TO = {clap: {tile: 1.2, r: 0.85}, shingle: {tile: 1.4, r: 0.9}, brick: {tile: 0.9, r: 0.95}};
  TO.plaster = {tile: 1.5, r: 0.9};
  TO.carpet = {tile: 0.8, r: 0.98};
  // slot materials: the cached geometry is built with these, attach() swaps in the house's colours
  const SLOT = {
    wall: () => tint('clap', 0xffffff, TO.clap),
    roof: () => tint('shingle', 0xffffff, TO.shingle),
    brick: () => tint('brick', 0xffffff, TO.brick),
    trim: () => K.mat(0xfffffe, 0.55),
    acc: () => K.mat(0xfffffd, 0.6),
    paint: () => tint('plaster', 0xffffff, TO.plaster),
    paintB: () => tint('plaster', 0xfffffe, TO.plaster),
    carpet: () => tint('carpet', 0xffffff, TO.carpet)
  };
  const SURF = {};
  const surf = k =>
    SURF[k] ||
    (SURF[k] = {
      lawn: () => K.surf('lawn', 0x4a6a2a),
      concrete: () => K.surf('concrete', 0xb0aea6),
      dirt: () => K.surf('dirt', 0x5a4632),
      // v082 interior floors: black / white kitchen checker, small white bath tile, oak boards
      checker: () =>
        K.tri(
          'hh_checker',
          (c, W, H, r) => {
            const n = 4,
              s = W / n;
            for (let i = 0; i < n; i++)
              for (let j = 0; j < n; j++) {
                c.fillStyle = (i + j) % 2 ? '#1c1c1e' : '#f0eee8';
                c.fillRect(i * s, j * s, s, s);
              }
            P.grime(c, W, H, r, 0.25);
          },
          {tile: 0.6, r: 0.35}
        ),
      tile: () =>
        K.tri(
          'hh_tile',
          (c, W, H, r) => {
            c.fillStyle = '#9a9a96';
            c.fillRect(0, 0, W, H);
            const n = 8,
              s = W / n;
            for (let i = 0; i < n; i++)
              for (let j = 0; j < n; j++) {
                c.fillStyle = `hsl(190,${6 + r() * 4}%,${86 + r() * 6}%)`;
                c.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
              }
            P.grime(c, W, H, r, 0.2);
          },
          {tile: 0.5, r: 0.3}
        ),
      oak: () => K.veneer(0x8a5a34, {tile: 0.9}),
      deck: () => K.veneer(0x8a7a62, {tile: 0.8}),
      board: () =>
        K.tri(
          'hh_board',
          (c, W, H, r) => {
            const n = 6,
              s = W / n;
            for (let i = 0; i < n; i++) {
              c.fillStyle = `hsl(${24 + r() * 10},${22 + r() * 10}%,${34 + r() * 10}%)`;
              c.fillRect(i * s + 1, 0, s - 2, H);
              for (let k = 0; k < 18; k++) {
                c.fillStyle = 'rgba(0,0,0,.16)';
                c.fillRect(i * s + 3 + r() * (s - 6), r() * H, 1, 10 + r() * 40);
              }
            }
            c.fillStyle = '#1a120e';
            for (let i = 0; i < n; i++) c.fillRect(i * s, 0, 1, H);
            P.grime(c, W, H, r, 0.5);
          },
          {tile: 1.0, r: 0.9}
        ),
      leaves: () =>
        K.tri(
          'hh_leaf',
          (c, W, H, r) => {
            c.fillStyle = '#24401a';
            c.fillRect(0, 0, W, H);
            for (let i = 0; i < 1800; i++) {
              c.fillStyle = `hsl(${80 + r() * 40},${30 + r() * 25}%,${14 + r() * 22}%)`;
              c.beginPath();
              c.ellipse(r() * W, r() * H, 3 + r() * 6, 2 + r() * 3, r() * PI, 0, PI * 2);
              c.fill();
            }
          },
          {tile: 0.6, r: 0.9}
        ),
      chain: () =>
        K.paint(
          'hh_chain',
          256,
          256,
          (c, W, H) => {
            c.clearRect(0, 0, W, H);
            c.strokeStyle = 'rgba(190,196,200,.95)';
            c.lineWidth = 2;
            for (let i = -8; i < 16; i++) {
              c.beginPath();
              c.moveTo(i * 24, 0);
              c.lineTo(i * 24 + H, H);
              c.stroke();
              c.beginPath();
              c.moveTo(i * 24 + H, 0);
              c.lineTo(i * 24, H);
              c.stroke();
            }
          },
          {alpha: true, r: 0.5, m: 0.6}
        )
    }[k]());

  /* ===================== geometry helpers ===================== */
  // a convex planar polygon (3D points) extruded by vector ext: roofs, gables, porch roofs
  function prism(b, mat, pts, ext) {
    const n = pts.length,
      bot = pts.map(q => [q[0] + ext[0], q[1] + ext[1], q[2] + ext[2]]),
      all = pts.concat(bot),
      cen = [0, 1, 2].map(i => all.reduce((s, q) => s + q[i], 0) / all.length),
      pos = [];
    const tri = (a, e, f) => {
      const u = [e[0] - a[0], e[1] - a[1], e[2] - a[2]],
        v = [f[0] - a[0], f[1] - a[1], f[2] - a[2]],
        nx = u[1] * v[2] - u[2] * v[1],
        ny = u[2] * v[0] - u[0] * v[2],
        nz = u[0] * v[1] - u[1] * v[0],
        tc = [0, 1, 2].map(i => (a[i] + e[i] + f[i]) / 3 - cen[i]);
      if (nx * tc[0] + ny * tc[1] + nz * tc[2] < 0) pos.push(...a, ...f, ...e);
      else pos.push(...a, ...e, ...f);
    };
    for (let i = 1; i < n - 1; i++) {
      tri(pts[0], pts[i], pts[i + 1]);
      tri(bot[0], bot[i], bot[i + 1]);
    }
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      tri(pts[i], pts[j], bot[j]);
      tri(pts[i], bot[j], bot[i]);
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.computeVertexNormals();
    b.add(geo, mat);
  }
  // a box from p0 to p1 (any direction): rafters, rake boards, rails, rope
  function beam(b, mat, p0, p1, wd, ht) {
    const dx = p1[0] - p0[0],
      dy = p1[1] - p0[1],
      dz = p1[2] - p0[2],
      L = Math.hypot(dx, dy, dz);
    if (L < 0.01) return;
    b.push([(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, (p0[2] + p1[2]) / 2], [0, Math.atan2(dx, dz), 0]);
    b.box(wd, ht === undefined ? wd : ht, L, mat, [0, 0, 0], [-Math.asin(dy / L), 0, 0], 0);
    b.pop();
  }
  // a wall-aligned box: u along the wall, o = distance out along the normal n, y centre
  function wbox(b, ax, f, n, u, y, o, lu, ly, lo, mat) {
    if (ax) b.box(lu, ly, lo, mat, [u, y, f + n * o], null, 0);
    else b.box(lo, ly, lu, mat, [f + n * o, y, u], null, 0);
  }

  /* ===================== the geometry (built once per plan / mirror / roof / porch / fence, in lot coordinates) ===================== */
  const CACHE = {};
  function build(key) {
    if (CACHE[key]) return CACHE[key];
    const [pid, ms, roof, porch, fence, gk] = key.split('|'),
      p = plan(pid, +ms, gk);
    const G = LK.geo('hh_' + key),
      b = G.b,
      S = G.S;
    const sp = []; // loot spots: [lx, lz, model, table, angle, y0]
    const zs = []; // zombie spots
    const ctx = {p, b, S, sp, zs, roof, porch, fence};
    grounds(ctx);
    structure(ctx);
    interior(ctx);
    skins(ctx);
    roofs(ctx);
    porchBuild(ctx);
    frontYard(ctx);
    const C = G.done();
    C.sp = sp;
    C.zs = zs;
    C.p = p;
    C.drive = ctx.drive; // v082: the yard pieces keep clear of it
    return (CACHE[key] = C);
  }

  /* ---------- grounds: lawn, sidewalk ---------- */
  function grounds(c) {
    const {b} = c;
    LK.pavement(b, surf('concrete'), {w: 20}); // v083: the kerb is drawn in frontYard, dropped at the driveway
    b.box(20, 0.02, 33.8, surf('lawn'), [0, 0.012, -1.0], null, 0);
  }

  /* ---------- structure: upper floor slab and the stairs (collision; the walls themselves are core WL) ---------- */
  function structure(c) {
    const {p, b, S} = c;
    if (!p.two) return;
    for (const bx of p.boxes)
      for (const r of minusHole([bx[0] + 0.15, bx[1] - 0.15, bx[2] + 0.15, bx[3] - 0.15], p.hole))
        S(r[0], r[1], r[2], r[3], FY - 0.15, FY, true);
    const s = p.stair;
    for (let i = 0; i < NST; i++) {
      const a = s.z0 + s.dz * i * RUN,
        e = s.z0 + s.dz * (i + 1) * RUN;
      S(s.x0, s.x1, Math.min(a, e), Math.max(a, e), 0, (i + 1) * RISE, true);
    }
  }

  /* ---------- v082 interior: floors, ceilings, painted wall lining with skirting, stairs + balustrade, landing rail, light fittings ---------- */
  // a room rect minus the part of the stairwell hole that falls inside it
  function cutHole(r, h) {
    if (!h || h[0] >= r[1] || h[1] <= r[0] || h[2] >= r[3] || h[3] <= r[2]) return [r];
    return minusHole(r, [Math.max(h[0], r[0]), Math.min(h[1], r[1]), Math.max(h[2], r[2]), Math.min(h[3], r[3])]);
  }
  function interior(c) {
    const {p, b, S} = c,
      ceil = K.mat(0xf0eee8, 0.9),
      skirt = K.mat(0xf4f0e8, 0.6),
      white = K.mat(0xf2f2ee, 0.55),
      rail = K.mat(0x4a2e1c, 0.5),
      lamp = K.mat(0xfff4dc, 0.3, 0, {emissive: 0xfff0d0, emissiveIntensity: 0.6}),
      carpet = SLOT.carpet(),
      fmat = k =>
        k === 'garage'
          ? surf('concrete')
          : k === 'kitchen'
            ? surf('checker')
            : k === 'bath'
              ? surf('tile')
              : k === 'hall' || k === 'dining'
                ? surf('oak')
                : carpet;
    // floors (upstairs ones skip the stairwell)
    for (const rm of p.rooms) {
      const y = rm.fl ? FY : rm.k === 'garage' ? -0.013 : 0; // v083: garage slab level with the driveway, no lip to drive over
      for (const r of rm.fl ? cutHole(rm.r, p.hole) : [rm.r])
        b.box(r[1] - r[0], 0.02, r[3] - r[2], fmat(rm.k), [(r[0] + r[1]) / 2, y + 0.035, (r[2] + r[3]) / 2], null, 0);
    }
    // ceilings: under the upper floor slab (two storey) and under the roof
    for (const bx of p.boxes) {
      const ib = [bx[0] + 0.15, bx[1] - 0.15, bx[2] + 0.15, bx[3] - 0.15];
      if (p.two)
        for (const r of minusHole(ib, p.hole))
          b.box(r[1] - r[0], 0.15, r[3] - r[2], ceil, [(r[0] + r[1]) / 2, FY - 0.075, (r[2] + r[3]) / 2], null, 0);
      const top = p.two ? FY + H2 : H1;
      b.box(ib[1] - ib[0], 0.04, ib[3] - ib[2], ceil, [(ib[0] + ib[1]) / 2, top - 0.02, (ib[2] + ib[3]) / 2], null, 0);
    }
    // wall lining: plaster (house paint colour, swapped at attach) over a skirting board
    const span = (mat, off) => (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, y1, mat, 0.01, off);
      if (y0 < 0.01 && y1 > 0.15) pc(u0, u1, 0, 0.13, skirt, 0.03, off + 0.01);
    };
    const line = (q, n, off, a0, a1) => {
      if (q.fl) b.push([0, FY, 0]);
      LK.lineWall(b, q.ax, q.f, a0, a1, n, q.ops, q.fl ? H2 : H1, span(q.fl ? SLOT.paintB() : SLOT.paint(), off));
      if (q.fl) b.pop();
    };
    for (const q of p.ext) if (!q.gar) line(q, -q.n, 0.005, q.a0 + 0.15, q.a1 - 0.15);
    // v083 garage: open rafters would read as a hole, so a plain ceiling; a rolled-up door drum over the opening
    if (p.gar) {
      const [x0, x1, z0, z1] = p.gar.r,
        zg = p.gar.gate === 'z1' ? z1 : z0,
        sg = p.gar.gate === 'z1' ? -1 : 1;
      b.box(x1 - x0 - 0.3, 0.04, z1 - z0 - 0.3, ceil, [(x0 + x1) / 2, H1 - 0.02, (z0 + z1) / 2], null, 0);
      b.cyl(0.22, 0.22, 3.3, K.mat(0xd8d4cc, 0.5, 0.3), [(x0 + x1) / 2, 2.72, zg + sg * 0.42], [0, 0, PI / 2], 14);
      b.box(3.3, 0.12, 0.1, K.mat(0xd8d4cc, 0.5, 0.3), [(x0 + x1) / 2, 2.5, zg + sg * 0.25], null, 0);
    }
    for (const q of p.int) for (const n of [1, -1]) line(q, n, -0.065, q.a0, q.a1);
    // stairs: carpeted treads and risers on painted blocks, white balusters, dark handrail, newel post
    if (p.two) {
      const s = p.stair,
        sw = s.x1 - s.x0,
        sx = (s.x0 + s.x1) / 2,
        xi = s.in < 0 ? s.x0 : s.x1, // v083: the open side is set by the plan
        xb = xi + (xi === s.x0 ? 0.05 : -0.05);
      for (let i = 0; i < NST; i++) {
        const a = s.z0 + s.dz * i * RUN,
          e = s.z0 + s.dz * (i + 1) * RUN,
          h = (i + 1) * RISE,
          zc = (a + e) / 2;
        b.box(sw, h, RUN, white, [sx, h / 2, zc], null, 0);
        b.box(sw - 0.12, 0.012, RUN, carpet, [sx, h + 0.006, zc], null, 0);
        b.box(sw - 0.12, RISE, 0.012, carpet, [sx, h - RISE / 2, a - s.dz * 0.007], null, 0);
        for (const f of [0.25, 0.75]) b.box(0.04, 0.9, 0.04, white, [xb, h + 0.45, a + s.dz * RUN * f], null, 0);
      }
      const zTop = s.z0 + s.dz * NST * RUN;
      b.box(0.13, 1.2, 0.13, white, [xb, 0.6 + RISE, s.z0 + s.dz * RUN * 0.5], null, 0);
      b.sph(0.08, white, [xb, 1.25 + RISE, s.z0 + s.dz * RUN * 0.5], null, 8);
      beam(b, rail, [xb, RISE + 1.15, s.z0 + s.dz * RUN * 0.5], [xb, FY + 0.95, zTop], 0.07, 0.06);
      // landing rail round the open sides of the stairwell (the inner edge and the end over the foot of the stairs)
      const h = p.hole,
        hx = s.in < 0 ? h[0] : h[1],
        ze = s.dz < 0 ? h[3] : h[2],
        hx0 = Math.min(h[0], h[1]),
        hx1 = Math.max(h[0], h[1]);
      const runRail = (p0, p1) => {
        const L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]),
          n = Math.max(2, Math.round(L / 0.14));
        for (let i = 0; i <= n; i++) {
          const t = i / n;
          b.box(0.04, 0.9, 0.04, white, [p0[0] + (p1[0] - p0[0]) * t, FY + 0.47, p0[1] + (p1[1] - p0[1]) * t], null, 0);
        }
        beam(b, rail, [p0[0], FY + 0.95, p0[1]], [p1[0], FY + 0.95, p1[1]], 0.08, 0.06);
        for (const q of [p0, p1]) b.box(0.12, 1.05, 0.12, white, [q[0], FY + 0.52, q[1]], null, 0);
      };
      runRail([hx, h[2]], [hx, h[3]]);
      runRail([hx0, ze], [hx1, ze]);
      S(hx - 0.06, hx + 0.06, h[2], h[3], FY, FY + 1.0, true);
      S(hx0, hx1, ze - 0.06, ze + 0.06, FY, FY + 1.0, true);
    }
    // a flush ceiling light in every room
    for (const rm of p.rooms) {
      const [x0, x1, z0, z1] = rm.r,
        cx = (x0 + x1) / 2,
        cz = (z0 + z1) / 2,
        cy = rm.fl ? FY + H2 : p.two && rm.k !== 'garage' ? FY - 0.15 : H1 - 0.04;
      b.cyl(0.2, 0.14, 0.09, lamp, [cx, cy - 0.045, cz], null, 14);
      b.cyl(0.22, 0.22, 0.02, K.mat(0xc8a03a, 0.35, 0.8), [cx, cy - 0.01, cz], null, 14);
    }
  }

  /* ---------- exterior skins: clapboard over a brick plinth, corner boards, bands, window casings, shutters, door casings ---------- */
  function skins(c) {
    const {p, b} = c,
      wall = SLOT.wall(),
      brick = SLOT.brick(),
      trim = SLOT.trim(),
      acc = SLOT.acc();
    const hTop = p.two ? FY + H2 : H1;
    for (const q of p.ext) {
      const yb = q.fl ? FY : 0,
        top = q.fl ? H2 : p.two && !q.gar ? FY : H1,
        hT = q.gar ? H1 : hTop,
        len = q.a1 - q.a0,
        mid = (q.a0 + q.a1) / 2;
      const span = (pc, u0, u1, y0, y1) => {
        if (!q.fl && y0 < PL) pc(u0, u1, y0, Math.min(PL, y1), brick, 0.08, 0.04);
        const ya = q.fl ? y0 : Math.max(y0, PL);
        if (y1 > ya) pc(u0, u1, ya + yb, y1 + yb, wall, 0.04, 0.02);
      };
      LK.lineWall(b, q.ax, q.f, q.a0 - 0.19, q.a1 + 0.19, q.n, q.ops, top, span);
      if (!q.fl) {
        // plinth cap, v083: broken at doors and garage openings (it used to run across them as a ledge to step / drive over)
        let a = q.a0 - 0.23;
        const cut = q.ops
          .filter(o => o.k !== 'w')
          .map(o => [o.c - (o.k === 'd' ? 0.82 : 0.8), o.c + (o.k === 'd' ? 0.82 : 0.8)])
          .sort((u, v) => u[0] - v[0]);
        for (const [c0, c1] of cut.concat([[q.a1 + 0.23, q.a1 + 0.23]])) {
          if (c0 - a > 0.05) wbox(b, q.ax, q.f, q.n, (a + c0) / 2, PL + 0.03, 0.235, c0 - a, 0.06, 0.07, trim);
          a = Math.max(a, c1);
        }
        for (const [u, s] of [
          [q.a0, -1],
          [q.a1, 1]
        ])
          wbox(b, q.ax, q.f, q.n, u + s * 0.06, (PL + hT) / 2, 0.14, 0.26, hT - PL, 0.2, trim); // corner boards
        if (p.two && !q.gar) wbox(b, q.ax, q.f, q.n, mid, FY + 0.03, 0.21, len + 0.4, 0.2, 0.05, trim); // belly band
      }
      if (q.fl || !p.two || q.gar) wbox(b, q.ax, q.f, q.n, mid, yb + top - 0.13, 0.21, len + 0.4, 0.26, 0.05, trim); // frieze
      const front = q.ax === 1 && q.n === 1;
      for (const op of q.ops) {
        if (op.k === 'w') {
          wbox(b, q.ax, q.f, q.n, op.c, yb + 2.83, 0.2, 1.86, 0.17, 0.08, trim);
          wbox(b, q.ax, q.f, q.n, op.c, yb + 0.86, 0.23, 1.96, 0.07, 0.15, trim);
          for (const s of [-1, 1]) wbox(b, q.ax, q.f, q.n, op.c + s * 0.84, yb + 1.825, 0.2, 0.14, 1.95, 0.07, trim);
          wbox(b, q.ax, q.f, q.n, op.c, yb + 1.825, 0.07, 0.035, 1.85, 0.03, trim); // glazing bars
          wbox(b, q.ax, q.f, q.n, op.c, yb + 1.95, 0.07, 1.5, 0.035, 0.03, trim);
          // shutters on the street side where there is room
          if (front)
            for (const s of [-1, 1]) {
              const u = op.c + s * 1.15;
              if (u - 0.25 < q.a0 + 0.15 || u + 0.25 > q.a1 - 0.15) continue;
              if (q.ops.some(o2 => o2 !== op && Math.abs(o2.c - u) < (o2.k === 'w' ? 1.05 : 0.95))) continue;
              wbox(b, q.ax, q.f, q.n, u, yb + 1.825, 0.2, 0.46, 1.86, 0.04, acc);
              for (let k = 0; k < 10; k++)
                wbox(b, q.ax, q.f, q.n, u, yb + 1.0 + k * 0.17, 0.225, 0.38, 0.03, 0.02, acc);
            }
        } else if (op.k === 'd') {
          for (const s of [-1, 1]) wbox(b, q.ax, q.f, q.n, op.c + s * 0.74, yb + 1.25, 0.2, 0.16, 2.5, 0.08, trim);
          wbox(b, q.ax, q.f, q.n, op.c, yb + 2.5, 0.21, 1.8, 0.2, 0.09, trim);
          if (front) wbox(b, q.ax, q.f, q.n, op.c, yb + 2.64, 0.24, 1.96, 0.08, 0.16, trim);
        }
      }
    }
  }

  /* ---------- roofs: gable, hip, gambrel (ridge along X or Z), gable infill, rakes, fascia, ridge cap, vent, chimney ---------- */
  // s: {t, ax, r: [x0, x1, z0, z1], y (wall top), rise, ends: [u0 gable?, u1 gable?]}
  function roofPart(b, s) {
    const sh = SLOT.roof(),
      trim = SLOT.trim(),
      wall = SLOT.wall();
    const X = s.ax === 'x',
      P3 = (u, y, v) => (X ? [u, y, v] : [v, y, u]),
      [u0, u1, v0, v1] = X ? s.r : [s.r[2], s.r[3], s.r[0], s.r[1]],
      half = (v1 - v0) / 2,
      vm = (v0 + v1) / 2,
      y = s.y,
      e = 0.42,
      ends = s.ends || [1, 1],
      rk0 = ends[0] ? 0.3 : 0,
      rk1 = ends[1] ? 0.3 : 0,
      TH = [0, -0.14, 0],
      uAx = X ? [1, 0, 0] : [0, 0, 1];
    const fascia = (a, bb, yy) => beam(b, trim, a, bb, 0.06, 0.22);
    let ridgeY = y + s.rise;
    // a gable / gambrel end: wall infill in the gable plane, a louvre vent
    const infill = (uu, so, prof) => {
      const pts = prof.map(([v, yy]) => P3(uu + so * 0.2, yy, v));
      prism(
        b,
        wall,
        pts,
        uAx.map(k => -k * so * 0.36)
      );
      const vy = y + (prof.reduce((m, q) => Math.max(m, q[1]), 0) - y) * 0.5;
      b.push(P3(uu + so * 0.23, vy, vm));
      if (X) b.box(0.04, 0.55, 0.7, trim, [0, 0, 0], null, 0);
      else b.box(0.7, 0.55, 0.04, trim, [0, 0, 0], null, 0);
      for (let k = 0; k < 5; k++)
        if (X) b.box(0.06, 0.03, 0.6, K.mat(0x2a2a2a, 0.8), [so * 0.01, -0.2 + k * 0.1, 0], null, 0);
        else b.box(0.6, 0.03, 0.06, K.mat(0x2a2a2a, 0.8), [0, -0.2 + k * 0.1, so * 0.01], null, 0);
      b.pop();
    };
    if (s.t === 'gable' || s.t === 'gambrel') {
      const gam = s.t === 'gambrel',
        a = half * 0.3,
        R1 = s.r1 || 1.9,
        R2 = s.r2 || 1.3,
        ye = gam ? y - (R1 * e) / a : y - (s.rise * e) / half;
      if (gam) ridgeY = y + R1 + R2;
      for (const sd of [1, -1]) {
        const vE = sd > 0 ? v1 + e : v0 - e,
          vB = sd > 0 ? v1 - a : v0 + a;
        if (gam) {
          prism(
            b,
            sh,
            [P3(u0 - rk0, ye, vE), P3(u1 + rk1, ye, vE), P3(u1 + rk1, y + R1, vB), P3(u0 - rk0, y + R1, vB)],
            TH
          );
          prism(
            b,
            sh,
            [P3(u0 - rk0, y + R1, vB), P3(u1 + rk1, y + R1, vB), P3(u1 + rk1, ridgeY, vm), P3(u0 - rk0, ridgeY, vm)],
            TH
          );
          for (const [uu, on] of [
            [u0 - rk0, ends[0]],
            [u1 + rk1, ends[1]]
          ])
            if (on) {
              fascia(P3(uu, ye - 0.08, vE), P3(uu, y + R1 - 0.08, vB));
              fascia(P3(uu, y + R1 - 0.08, vB), P3(uu, ridgeY - 0.08, vm));
            }
        } else {
          prism(
            b,
            sh,
            [P3(u0 - rk0, ye, vE), P3(u1 + rk1, ye, vE), P3(u1 + rk1, ridgeY, vm), P3(u0 - rk0, ridgeY, vm)],
            TH
          );
          for (const [uu, on] of [
            [u0 - rk0, ends[0]],
            [u1 + rk1, ends[1]]
          ])
            if (on) fascia(P3(uu, ye - 0.08, vE), P3(uu, ridgeY - 0.08, vm));
        }
        fascia(P3(u0 - rk0, ye - 0.1, vE), P3(u1 + rk1, ye - 0.1, vE));
      }
      beam(b, sh, P3(u0 - rk0, ridgeY + 0.02, vm), P3(u1 + rk1, ridgeY + 0.02, vm), 0.26, 0.1);
      const prof = gam
        ? [
            [v0 - 0.2, y],
            [v1 + 0.2, y],
            [v1 - a, y + R1 - 0.12],
            [vm, ridgeY - 0.16],
            [v0 + a, y + R1 - 0.12]
          ]
        : [
            [v0 - 0.2, y],
            [v1 + 0.2, y],
            [vm, ridgeY - 0.16]
          ];
      if (ends[0]) infill(u0, -1, prof);
      if (ends[1]) infill(u1, 1, prof);
    } else {
      // hip
      const ye = y - (s.rise * e) / half,
        ur0 = Math.min(u0 + half, (u0 + u1) / 2),
        ur1 = Math.max(u1 - half, (u0 + u1) / 2),
        Y = y + s.rise;
      const c00 = P3(u0 - e, ye, v0 - e),
        c01 = P3(u0 - e, ye, v1 + e),
        c10 = P3(u1 + e, ye, v0 - e),
        c11 = P3(u1 + e, ye, v1 + e),
        r0 = P3(ur0, Y, vm),
        r1 = P3(ur1, Y, vm);
      prism(b, sh, [c01, c11, r1, r0], TH);
      prism(b, sh, [c00, c10, r1, r0], TH);
      prism(b, sh, [c00, c01, r0], TH);
      prism(b, sh, [c10, c11, r1], TH);
      for (const [a0, a1] of [
        [c00, c01],
        [c01, c11],
        [c11, c10],
        [c10, c00]
      ])
        fascia([a0[0], a0[1] - 0.1, a0[2]], [a1[0], a1[1] - 0.1, a1[2]]);
      for (const [cc, rr] of [
        [c00, r0],
        [c01, r0],
        [c10, r1],
        [c11, r1]
      ])
        beam(b, sh, [cc[0], cc[1] + 0.02, cc[2]], [rr[0], rr[1] + 0.02, rr[2]], 0.2, 0.08);
      beam(b, sh, [r0[0], Y + 0.02, r0[2]], [r1[0] + 0.001, Y + 0.02, r1[2] + 0.001], 0.26, 0.1);
    }
    return ridgeY;
  }
  // the chimney: brick stack on a side wall (gable ends) or through the roof (hip), concrete cap, two clay pots
  function chimney(b, S, x, z, nx, y0, top) {
    const brick = SLOT.brick(),
      cap = surf('concrete'),
      pot = K.mat(0x9a4a32, 0.7);
    const ox = x + nx * 0.0;
    if (y0 < 0.1) {
      b.box(0.8, 2.2, 1.4, brick, [ox, 1.1, z], null, 0);
      b.box(0.7, 0.3, 1.25, brick, [ox, 2.35, z], null, 0);
      S(ox - 0.4, ox + 0.4, z - 0.7, z + 0.7, 0, 2.4);
    }
    b.box(0.7, top - Math.max(y0, 2.2), 1.0, brick, [ox, (top + Math.max(y0, 2.2)) / 2, z], null, 0);
    b.box(0.86, 0.12, 1.16, cap, [ox, top + 0.06, z], null, 0);
    for (const dz of [-0.22, 0.22]) b.cyl(0.11, 0.13, 0.42, pot, [ox, top + 0.33, z + dz], null, 12);
  }
  function roofs(c) {
    const {p, b, S, roof} = c,
      B0 = p.boxes[0];
    const y = p.two ? FY + H2 : H1;
    let ridge;
    if (p.id === 'colonial') ridge = roofPart(b, {t: roof, ax: 'x', r: B0, y, rise: roof === 'hip' ? 3.0 : 3.4});
    else if (p.id === 'gablefront') ridge = roofPart(b, {t: roof, ax: 'z', r: B0, y, rise: 3.0, r1: 2.0, r2: 1.4});
    else if (p.id === 'bungalow') {
      ridge = roofPart(b, {t: roof, ax: 'x', r: B0, y, rise: 2.4});
      const wg = p.boxes[1];
      roofPart(b, {t: 'gable', ax: 'z', r: [wg[0], wg[1], (B0[2] + B0[3]) / 2, wg[3]], y, rise: 2.2, ends: [0, 1]});
    } else ridge = roofPart(b, {t: roof, ax: 'x', r: B0, y, rise: p.id === 'ranch' ? 2.2 : 2.6});
    // v083 garage: its own street-facing (or alley-facing) gable
    if (p.gar) roofPart(b, {t: 'gable', ax: 'z', r: p.gar.r, y: H1, rise: 1.5});
    // ceiling-level attic floor so the roof reads as closed from below the eaves
    const ch = CHIM[p.id],
      m = p.m;
    if (roof === 'hip') {
      const [x0, x1, z0, z1] = B0;
      chimney(b, S, m * (x0 + (x1 - x0) * 0.32) * (m < 0 ? -1 : 1) * m, z0 + (z1 - z0) * 0.35, 0, y - 0.3, ridge + 0.5);
    } else chimney(b, S, m * ch.x, ch.z, m * ch.nx, 0, ch.top === 'eave' ? y + 1.5 : ridge + 0.55);
  }
  const CHIM = {
    colonial: {x: -9.55, z: 0.5, nx: -1},
    gablefront: {x: -4.95, z: -3.5, nx: -1, top: 'eave'},
    bungalow: {x: -9.55, z: -3.5, nx: -1},
    ranch: {x: -9.55, z: -0.5, nx: -1},
    cottage: {x: -6.55, z: -2.5, nx: -1}
  };

  /* ---------- porches: full / half / long shed porches with posts and spindle rails, portico, stoop with iron rails, door hood ---------- */
  const DH = 0.27; // porch deck height (one step up from the yard, level-ish with the door)
  function porchBuild(c) {
    const {p, b, S, porch} = c,
      trim = SLOT.trim(),
      sh = SLOT.roof(),
      brick = SLOT.brick(),
      conc = surf('concrete'),
      deck = surf('deck'),
      iron = K.mat(0x1e1e20, 0.5, 0.4);
    const F = p.front,
      Dx = p.door,
      B0 = p.boxes[0],
      fz = F + 0.19;
    const steps = (x, z, wd, base, hgt, mat) => {
      // two steps down from a deck at hgt toward +z
      const n = hgt > 0.2 ? 2 : 1,
        r = hgt / (n + 1);
      for (let i = 0; i < n; i++) {
        const za = z + i * 0.32,
          h = hgt - (i + 1) * r;
        b.box(wd, h, 0.32, mat, [x, h / 2, za + 0.16], null, 0.01);
        S(x - wd / 2, x + wd / 2, za, za + 0.32, 0, h, true);
      }
      return z + n * 0.32;
    };
    if (porch === 'full' || porch === 'half' || porch === 'long' || porch === 'porch') {
      let x0 = B0[0] - 0.3,
        x1 = B0[1] + 0.3,
        dep = 2.6;
      if (porch === 'half' || porch === 'long') {
        if (Dx < (B0[0] + B0[1]) / 2) x1 = Dx + (porch === 'long' ? 2.6 : 1.9);
        else x0 = Dx - (porch === 'long' ? 2.6 : 1.9);
      }
      if (porch === 'porch') {
        const wg = p.boxes[1]; // bungalow: in front of the main wall, beside the wing
        if (wg[0] > Dx) x1 = wg[0] - 0.2;
        else x0 = wg[1] + 0.2;
        dep = Math.min(2.6, wg[3] - F - 0.4);
      }
      // v083: stop short of an attached garage (its door opens beside the porch)
      if (p.gar && p.gar.att) {
        if (p.gar.r[0] > Dx) x1 = Math.min(x1, p.gar.r[0] - 0.05);
        else x0 = Math.max(x0, p.gar.r[1] + 0.05);
      }
      const z0 = F + 0.15,
        zE = z0 + dep,
        two = p.two,
        yW = two ? 3.5 : H1 - 0.34,
        yF = two ? 3.0 : H1 - 0.62;
      b.box(x1 - x0, DH - 0.06, dep, brick, [(x0 + x1) / 2, (DH - 0.06) / 2, (z0 + zE) / 2], null, 0);
      b.box(x1 - x0 + 0.08, 0.06, dep + 0.08, deck, [(x0 + x1) / 2, DH - 0.03, (z0 + zE) / 2], null, 0);
      S(x0, x1, z0, zE, 0, DH, true);
      const zS = steps(Dx, zE, 1.8, 0, DH, brick);
      c.zP = zS;
      // posts: ends, both sides of the steps, and every 2.6 m between
      const gap = [Dx - 1.0, Dx + 1.0],
        xs = [x0 + 0.1, x1 - 0.1, gap[0], gap[1]].filter(v => v >= x0 + 0.1 && v <= x1 - 0.1);
      xs.sort((a, q) => a - q);
      for (let i = 0; i + 1 < xs.length; i++) {
        const sp = xs[i + 1] - xs[i];
        if (xs[i] >= gap[0] - 0.01 && xs[i + 1] <= gap[1] + 0.01) continue;
        const n = Math.floor(sp / 2.6);
        for (let k = 1; k <= n; k++) xs.push(xs[i] + (sp * k) / (n + 1));
      }
      xs.sort((a, q) => a - q);
      for (const px of xs) {
        b.box(0.17, yF - DH, 0.17, trim, [px, (DH + yF) / 2, zE - 0.12], null, 0.01);
        b.box(0.24, 0.12, 0.24, trim, [px, DH + 0.06, zE - 0.12], null, 0.01);
        S(px - 0.1, px + 0.1, zE - 0.22, zE - 0.02, DH, yF, true);
      }
      // spindle rails between posts (not across the steps), and down both ends
      const rail = (a, q, za, zb) => {
        const L = Math.hypot(q - a, zb - za);
        if (L < 0.3) return;
        beam(b, trim, [a, DH + 0.88, za], [q, DH + 0.88, zb], 0.1, 0.06);
        beam(b, trim, [a, DH + 0.1, za], [q, DH + 0.1, zb], 0.07, 0.05);
        const n = Math.floor(L / 0.15);
        for (let k = 1; k < n; k++) {
          const t = k / n;
          b.box(0.04, 0.74, 0.04, trim, [a + (q - a) * t, DH + 0.49, za + (zb - za) * t], null, 0);
        }
        S(
          Math.min(a, q) - 0.05,
          Math.max(a, q) + 0.05,
          Math.min(za, zb) - 0.05,
          Math.max(za, zb) + 0.05,
          DH,
          DH + 0.95,
          true
        );
      };
      for (let i = 0; i + 1 < xs.length; i++) {
        if (xs[i] >= gap[0] - 0.01 && xs[i + 1] <= gap[1] + 0.01) continue;
        rail(xs[i] + 0.09, xs[i + 1] - 0.09, zE - 0.12, zE - 0.12);
      }
      for (const ex of [x0 + 0.1, x1 - 0.1]) rail(ex, ex, z0 + 0.25, zE - 0.22);
      // shed roof, header beam, fascia
      prism(
        b,
        sh,
        [
          [x0 - 0.25, yW, fz],
          [x1 + 0.25, yW, fz],
          [x1 + 0.25, yF + 0.1, zE + 0.35],
          [x0 - 0.25, yF + 0.1, zE + 0.35]
        ],
        [0, -0.12, 0]
      );
      b.box(x1 - x0, 0.24, 0.16, trim, [(x0 + x1) / 2, yF - 0.04, zE - 0.12], null, 0);
      beam(b, trim, [x0 - 0.25, yF - 0.08, zE + 0.36], [x1 + 0.25, yF - 0.08, zE + 0.36], 0.05, 0.2);
      b.box(x1 - x0, 0.02, dep, K.mat(0xd8d4c8, 0.8), [(x0 + x1) / 2, yF - 0.17, (z0 + zE) / 2], null, 0); // beadboard ceiling
    } else if (porch === 'portico') {
      const x0 = Dx - 1.3,
        x1 = Dx + 1.3,
        z0 = F + 0.15,
        zE = F + 2.2;
      b.box(x1 - x0, DH, zE - z0, brick, [Dx, DH / 2, (z0 + zE) / 2], null, 0);
      b.box(x1 - x0 + 0.06, 0.05, zE - z0 + 0.06, conc, [Dx, DH - 0.02, (z0 + zE) / 2], null, 0);
      S(x0, x1, z0, zE, 0, DH, true);
      c.zP = steps(Dx, zE, 2.2, 0, DH, brick);
      for (const s of [-1, 1]) {
        const px = Dx + s * 1.08;
        b.cyl(0.12, 0.14, 2.7 - DH, trim, [px, (2.7 + DH) / 2, zE - 0.2], null, 14);
        b.box(0.32, 0.12, 0.32, trim, [px, 2.76, zE - 0.2], null, 0.01);
        b.box(0.32, 0.1, 0.32, trim, [px, DH + 0.05, zE - 0.2], null, 0.01);
        S(px - 0.14, px + 0.14, zE - 0.34, zE - 0.06, DH, 2.8, true);
      }
      b.box(2.6, 0.22, 2.1, trim, [Dx, 2.92, (F + 0.2 + zE) / 2], null, 0);
      roofPart(b, {t: 'gable', ax: 'z', r: [x0, x1, F - 0.3, zE - 0.1], y: 3.03, rise: 0.95, ends: [0, 1]});
    } else if (porch === 'stoop' || porch === 'hood') {
      const x0 = Dx - 0.95,
        x1 = Dx + 0.95,
        z0 = F + 0.15,
        zE = F + 1.5;
      b.box(x1 - x0, DH, zE - z0, conc, [Dx, DH / 2, (z0 + zE) / 2], null, 0.02);
      S(x0, x1, z0, zE, 0, DH, true);
      c.zP = steps(Dx, zE, 1.9, 0, DH, conc);
      if (porch === 'stoop')
        for (const s of [-1, 1]) {
          const rx = Dx + s * 0.9;
          for (const zz of [F + 0.3, zE - 0.05, c.zP - 0.08])
            b.cyl(0.02, 0.02, 0.95, iron, [rx, (zz > zE ? 0.09 : DH) + 0.47, zz], null, 6);
          beam(b, iron, [rx, DH + 0.92, F + 0.3], [rx, DH + 0.92, zE - 0.05], 0.05, 0.04);
          beam(b, iron, [rx, DH + 0.92, zE - 0.05], [rx, 1.0, c.zP - 0.08], 0.05, 0.04);
          S(rx - 0.04, rx + 0.04, F + 0.3, c.zP, 0, 1.2, true);
        }
      else {
        roofPart(b, {
          t: 'gable',
          ax: 'z',
          r: [Dx - 0.95, Dx + 0.95, F - 0.2, F + 1.25],
          y: 2.75,
          rise: 0.6,
          ends: [0, 1]
        });
        for (const s of [-1, 1]) {
          beam(b, trim, [Dx + s * 0.8, 2.0, fz], [Dx + s * 0.8, 2.7, F + 1.15], 0.08, 0.08);
          b.box(0.1, 0.8, 0.08, trim, [Dx + s * 0.8, 2.3, fz + 0.04], null, 0);
        }
      }
    }
  }

  /* ---------- front yard: path, driveway, foundation planting, sunflowers, front / side / rear fences, mailbox ---------- */
  function frontYard(c) {
    const {p, b, S, fence} = c,
      conc = surf('concrete'),
      leaves = surf('leaves'),
      dirt = surf('dirt'),
      rnd = b.rnd,
      [bx0, bx1, bz0, bz1] = bbox(p),
      Dx = p.door,
      zP = c.zP || p.front + 1;
    // path from the steps to the sidewalk
    b.box(1.25, 0.03, 15.9 - zP, conc, [Dx, 0.026, (zP + 15.9) / 2], null, 0);
    for (let z = zP + 1.2; z < 15.8; z += 1.2) b.box(1.24, 0.034, 0.02, K.mat(0x8a8880, 0.8), [Dx, 0.027, z], null, 0);
    // driveway on the side away from the door
    // v083: an attached garage takes the driveway straight in (full width of its opening); otherwise the wide side strip
    const ga = p.gar && p.gar.att ? p.gar.r : null,
      side = ga ? Math.sign(ga[0] + ga[1]) : Math.abs(bx1) <= Math.abs(bx0) ? 1 : -1,
      xh = side > 0 ? bx1 : -bx0,
      gapW = 10 - xh,
      full = !ga && gapW >= 3.3,
      dw = ga ? 3.6 : full ? 2.7 : 2.6,
      dX = ga ? (ga[0] + ga[1]) / 2 : side * (full ? 10 - 0.3 - dw / 2 : 8.55),
      dz0 = ga ? ga[3] - 0.1 : full ? bz0 - 1.5 : bz1 + 0.6;
    b.box(dw, 0.025, 15.9 - dz0, conc, [dX, 0.022, (dz0 + 15.9) / 2], null, 0);
    for (let z = dz0 + 2.5; z < 15.8; z += 2.5) b.box(dw, 0.03, 0.025, K.mat(0x8a8880, 0.8), [dX, 0.024, z], null, 0);
    c.drive = {x: dX, w: dw, z0: dz0, side};
    // kerb between lawn and sidewalk, dropped (a flush concrete strip) across the driveway
    {
      const k0 = dX - dw / 2,
        k1 = dX + dw / 2;
      for (const [u0, u1] of [
        [-10, k0],
        [k1, 10]
      ])
        if (u1 - u0 > 0.05) b.box(u1 - u0, 0.16, 0.2, conc, [(u0 + u1) / 2, 0.08, 15.9], null, 0);
      b.box(dw, 0.04, 0.24, conc, [dX, 0.022, 15.9], null, 0);
    }
    // a rear garage: concrete apron out to the alley, flush
    if (p.gar && !p.gar.att) {
      const [g0, g1, gz0] = p.gar.r;
      b.box(g1 - g0 - 0.6, 0.025, 18 + gz0 + 0.1, conc, [(g0 + g1) / 2, 0.022, (gz0 - 18) / 2], null, 0);
    }
    // foundation bed with shrubs along the front, sunflowers by the steps
    const fz = Math.max(p.front, ...p.boxes.map(q => q[3])) + 0.6;
    for (const bx of p.boxes) {
      const zf = bx[3] + 0.55;
      if (
        c.porch !== 'stoop' &&
        c.porch !== 'hood' &&
        c.porch !== 'portico' &&
        bx === p.boxes[0] &&
        p.id !== 'bungalow'
      )
        continue; // a full porch covers it
      for (let x = bx[0] + 0.7; x < bx[1] - 0.5; x += 1.5) {
        if (Math.abs(x - Dx) < 1.4) continue;
        b.box(1.5, 0.05, 0.9, dirt, [x, 0.03, zf], null, 0);
        b.sph(0.42 + rnd() * 0.18, leaves, [x, 0.36, zf], [1.2, 0.85, 1]);
      }
    }
    const sunX = Dx + (side > 0 ? -1 : 1) * 1.6,
      sunZ = Math.max(zP - 0.6, fz);
    for (let i = 0; i < 4; i++) {
      const sx = sunX + (side > 0 ? -1 : 1) * i * 0.45,
        sz = sunZ + (rnd() - 0.5) * 0.3,
        h = 1.15 + rnd() * 0.5;
      b.cyl(0.018, 0.024, h, K.mat(0x4a6a2a, 0.8), [sx, h / 2, sz], null, 6);
      b.sph(0.12, K.mat(0x4a6a2a, 0.8), [sx + 0.08, h * 0.55, sz], [1, 0.25, 0.6], 8);
      b.cyl(0.2, 0.2, 0.03, K.mat(0xe8b818, 0.7), [sx, h, sz + 0.02], [1.3, 0, 0], 14);
      b.cyl(0.09, 0.09, 0.05, K.mat(0x4a2a14, 0.9), [sx, h + 0.01, sz + 0.04], [1.3, 0, 0], 12);
    }
    b.box(2.0, 0.04, 0.7, dirt, [sunX + (side > 0 ? -1 : 1) * 0.65, 0.025, sunZ], null, 0);
    // fences: front line at z 15.15 (gaps for the path and driveway); the +x side and the rear (the next lot's +x side is our -x)
    const FZ = 15.15,
      gaps = [
        [Dx - 0.75, Dx + 0.75],
        [dX - dw / 2 - 0.1, dX + dw / 2 + 0.1]
      ].sort((a, q) => a[0] - q[0]);
    const runs = [];
    let a = -9.85;
    for (const gp of gaps) {
      if (gp[0] > a + 0.2) runs.push([a, gp[0]]);
      a = Math.max(a, gp[1]);
    }
    if (a < 9.65) runs.push([a, 9.85]);
    const picket = (ax, f, u0, u1, hgt) => {
      const wht = SLOT.trim(),
        L = u1 - u0;
      const P3 = (u, y) => (ax ? [u, y, f] : [f, y, u]);
      for (let u = u0 + 0.06; u < u1 - 0.04; u += 0.15) {
        b.box(ax ? 0.075 : 0.025, hgt, ax ? 0.025 : 0.075, wht, P3(u, hgt / 2), null, 0);
        b.cyl(0, 0.055, 0.1, wht, P3(u, hgt + 0.05), [0, PI / 4, 0], 4);
      }
      for (const yy of [0.25, hgt - 0.2])
        b.box(
          ax ? L : 0.04,
          0.07,
          ax ? 0.04 : L,
          wht,
          ax ? [(u0 + u1) / 2, yy, f - 0.03] : [f - 0.03, yy, (u0 + u1) / 2],
          null,
          0
        );
      for (const u of [u0 + 0.05, u1 - 0.05]) b.box(0.1, hgt + 0.1, 0.1, wht, P3(u, (hgt + 0.1) / 2), null, 0.01);
      if (ax) S(u0, u1, f - 0.06, f + 0.06, 0, hgt + 0.1, true);
      else S(f - 0.06, f + 0.06, u0, u1, 0, hgt + 0.1, true);
    };
    const chain = (ax, f, u0, u1, hgt) => {
      const post = K.mat(0x9a9ea2, 0.4, 0.7),
        cm = surf('chain'),
        L = u1 - u0,
        n = Math.max(1, Math.ceil(L / 2.5));
      const P3 = (u, y) => (ax ? [u, y, f] : [f, y, u]);
      for (let i = 0; i <= n; i++)
        b.cyl(0.035, 0.035, hgt + 0.05, post, P3(u0 + (L * i) / n, (hgt + 0.05) / 2), null, 8);
      beam(b, post, P3(u0, hgt), P3(u1, hgt), 0.04, 0.04);
      for (const ry of [0, PI])
        b.label(L, hgt - 0.05, cm, ax ? [(u0 + u1) / 2, hgt / 2, f] : [f, hgt / 2, (u0 + u1) / 2], [
          0,
          (ax ? 0 : PI / 2) + ry,
          0
        ]);
      if (ax) S(u0, u1, f - 0.05, f + 0.05, 0, hgt, true);
      else S(f - 0.05, f + 0.05, u0, u1, 0, hgt, true);
    };
    const boards = (ax, f, u0, u1, hgt) => {
      const bd = surf('board'),
        post = K.mat(0x4a3220, 0.8),
        L = u1 - u0;
      if (ax) b.box(L, hgt, 0.05, bd, [(u0 + u1) / 2, hgt / 2, f], null, 0);
      else b.box(0.05, hgt, L, bd, [f, hgt / 2, (u0 + u1) / 2], null, 0);
      for (let u = u0; u <= u1 + 0.01; u += L / Math.max(1, Math.round(L / 2.4)))
        b.box(
          0.1,
          hgt + 0.08,
          0.1,
          post,
          ax ? [u, (hgt + 0.08) / 2, f - 0.06] : [f - 0.06, (hgt + 0.08) / 2, u],
          null,
          0
        );
      if (ax) S(u0, u1, f - 0.06, f + 0.06, 0, hgt, true);
      else S(f - 0.06, f + 0.06, u0, u1, 0, hgt, true);
    };
    const fr = fence === 'chain' ? chain : picket,
      zf = bz1 + 0.4;
    if (fence !== 'open') {
      for (const r of runs) fr(1, FZ, r[0], r[1], fence === 'chain' ? 1.1 : 0.95);
      fr(0, 9.85, zf, FZ, fence === 'chain' ? 1.1 : 0.95);
    } else
      for (const r of runs)
        for (let x = r[0] + 0.5; x < r[1] - 0.3; x += 1.1)
          b.sph(0.5, surf('leaves'), [x, 0.45, FZ], [1.2, 0.9, 0.9], 10); // low hedge
    const back = fence === 'chain' ? chain : boards,
      bh = fence === 'chain' ? 1.6 : 1.8;
    // v083: the back fence breaks for a rear garage (its back wall is the boundary there)
    const gr = p.gar && p.gar.r;
    back(0, 9.85, -17.6, zf, bh);
    if (gr && !p.gar.att) {
      if (gr[0] > -9.85) back(1, -17.6, -9.85, gr[0] - 0.15, bh);
      if (gr[1] < 9.85) back(1, -17.6, gr[1] + 0.15, 9.85, bh);
    } else back(1, -17.6, -9.85, 9.85, bh);
    // mailbox on a post by the path
    const mx = Dx + (dX > Dx ? -1.1 : 1.1);
    b.box(0.09, 1.05, 0.09, K.mat(0x5a4a3a, 0.8), [mx, 0.52, 15.5], null, 0);
    b.rbox(0.24, 0.24, 0.48, 0.08, SLOT.acc(), [mx, 1.15, 15.5]);
    b.box(0.03, 0.18, 0.05, K.mat(0xc8261c, 0.5), [mx + 0.14, 1.25, 15.6], null, 0);
    S(mx - 0.08, mx + 0.08, 15.42, 15.58, 0, 1.25, true);
  }

  /* ===================== modules: street props and back-yard pieces, built once at the origin and attached with an offset ===================== */
  const MCACHE = {};
  function mod(name) {
    if (MCACHE[name]) return MCACHE[name];
    const G = LK.geo('hhm_' + name),
      b = G.b,
      S = G.S,
      sp = [];
    MODS[name](b, S, sp);
    const C = G.done();
    C.sp = sp;
    return (MCACHE[name] = C);
  }
  const MODS = {
    pole: (b, S) => LK.lightPole(b, S, 0),
    hydrant: (b, S) => LK.hydrant(b, S, 0),
    usps: (b, S) => {
      const blu = K.paintSteel ? K.paintSteel(0x1e4a8a) : K.mat(0x1e4a8a, 0.5, 0.3),
        z = 17.35;
      for (const sx of [-0.22, 0.22])
        for (const sz of [-0.2, 0.2]) b.box(0.05, 0.42, 0.05, blu, [sx, 0.21, z + sz], null, 0.01);
      b.rbox(0.56, 0.62, 0.5, 0.03, blu, [0, 0.72, z]);
      b.cyl(0.28, 0.28, 0.5, blu, [0, 1.03, z], [PI / 2, 0, 0], 18);
      b.box(0.36, 0.05, 0.03, K.mat(0x8a8c90, 0.4, 0.7), [0, 1.02, z + 0.26], null, 0.01);
      b.label(
        0.4,
        0.18,
        K.paint('hhm_mail', 160, 72, (c, W, H) => {
          c.fillStyle = '#1e4a8a';
          c.fillRect(0, 0, W, H);
          P.text(c, 'MAIL', W / 2, H / 2 + 2, {size: 38, col: '#f2f2f2'});
        }),
        [0, 0.75, z + 0.256]
      );
      S(-0.3, 0.3, z - 0.27, z + 0.27, 0, 1.3, true);
    },
    xing: (b, S) => {
      const z = 17.6;
      b.cyl(0.03, 0.03, 2.4, K.mat(0x8a8c8e, 0.4, 0.6), [0, 1.2, z], null, 8);
      const sign = K.paint(
        'hhm_xing',
        200,
        200,
        (c, W, H) => {
          c.clearRect(0, 0, W, H);
          c.fillStyle = '#e8d01a';
          c.strokeStyle = '#1a1a1a';
          c.lineWidth = 6;
          c.beginPath();
          c.moveTo(W / 2, 6);
          c.lineTo(W - 8, H * 0.42);
          c.lineTo(W - 8, H - 8);
          c.lineTo(8, H - 8);
          c.lineTo(8, H * 0.42);
          c.closePath();
          c.fill();
          c.stroke();
          c.fillStyle = '#1a1a1a';
          for (const [x, s] of [
            [78, 1],
            [126, 0.82]
          ]) {
            c.beginPath();
            c.arc(x, 82 - (1 - s) * 30, 11 * s, 0, PI * 2);
            c.fill();
            c.fillRect(x - 9 * s, 96 - (1 - s) * 20, 18 * s, 44 * s);
            c.fillRect(x - 9 * s, 138 - (1 - s) * 8, 7 * s, 34 * s);
            c.fillRect(x + 2 * s, 138 - (1 - s) * 8, 7 * s, 34 * s);
          }
        },
        {alpha: true}
      );
      for (const ry of [0, PI]) b.label(0.75, 0.75, sign, [0, 2.0, z + (ry ? -0.02 : 0.02)], [0, ry, 0]);
      S(-0.05, 0.05, z - 0.05, z + 0.05, 0, 2.4, true);
    },
    pool: (b, S) => {
      const wallM = K.mat(0x2a6ab8, 0.45, 0.3),
        rim = K.mat(0xe8e8e8, 0.4, 0.2),
        R = 2.3,
        H = 1.15;
      b.cyl(R, R, H, wallM, [0, H / 2, 0], null, 36, true);
      b.cyl(R - 0.06, R - 0.06, H, K.mat(0x5aa0d0, 0.5), [0, H / 2, 0], null, 36, true);
      b.tor(R - 0.02, 0.06, rim, [0, H, 0], [PI / 2, 0, 0], undefined, 40);
      // v091: the water is added per house by yard() (MFZWATER); without that layer, the old flat disc
      if (!window.MFZWATER)
        b.cyl(
          R - 0.06,
          R - 0.06,
          0.02,
          K.mat(0x4a9ad0, 0.08, 0.1, {transparent: true, opacity: 0.85}),
          [0, H - 0.18, 0],
          null,
          36
        );
      b.cyl(R - 0.06, R - 0.06, 0.02, K.mat(0x8ac0e0, 0.6), [0, 0.03, 0], null, 36);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * PI * 2;
        b.box(0.1, H, 0.06, rim, [Math.cos(a) * (R + 0.03), H / 2, Math.sin(a) * (R + 0.03)], [0, -a, 0], 0);
      }
      // A-frame ladder on the +z side
      const lm = K.mat(0xd8d8d8, 0.4, 0.5);
      for (const sx of [-0.25, 0.25]) {
        beam(b, lm, [sx, 0, R + 0.7], [sx, H + 0.25, R], 0.04, 0.04);
        beam(b, lm, [sx, 0.1, R - 0.6], [sx, H + 0.25, R], 0.04, 0.04);
      }
      for (let k = 1; k < 4; k++) b.box(0.5, 0.03, 0.12, lm, [0, k * 0.3, R + 0.7 - k * 0.18], null, 0);
      /* v093: you can get into the pool. It was one solid block (you stood on the water); now only the wall is solid (0.3 m cells
         round the ring), the ladder is three real steps up the outside, and three steps inside bring you back out. */
      if (window.MFZWATER) {
        const c = 0.3,
          n = Math.ceil((R + 0.15) / c);
        for (let j = -n; j < n; j++) {
          let run = null;
          for (let i = -n; i <= n; i++) {
            const d = Math.hypot((i + 0.5) * c, (j + 0.5) * c),
              wall = i < n && d > R - 0.22 && d < R + 0.12;
            if (wall) run = run ? [run[0], (i + 1) * c] : [i * c, (i + 1) * c];
            else if (run) {
              S(run[0], run[1], j * c, (j + 1) * c, 0, H);
              run = null;
            }
          }
        }
        for (let k = 0; k < 3; k++) {
          S(-0.32, 0.32, R + 0.72 - (k + 1) * 0.21, R + 0.72 - k * 0.21, 0, 0.3 * (k + 1)); // outside: the ladder
          S(-0.32, 0.32, R - 0.92 + k * 0.24, R - 0.92 + (k + 1) * 0.24, 0, 0.3 * (k + 1)); // inside: steps under the water
          b.box(0.6, 0.3 * (k + 1), 0.24, K.mat(0x8ac0e0, 0.6), [0, 0.15 * (k + 1), R - 0.8 + k * 0.24], null, 0);
        }
      } else S(-R, R, -R, R, 0, H);
    },
    shed: (b, S, sp) => {
      // open-fronted potting shed with a workbench
      const bd = surf('board'),
        sh = SLOT.roof(),
        trim = SLOT.trim();
      b.box(2.9, 2.1, 0.08, bd, [0, 1.05, -1.2], null, 0);
      for (const sx of [-1.43, 1.43]) b.box(0.08, 2.1, 2.4, bd, [sx, 1.05, 0], null, 0);
      b.box(2.9, 0.06, 2.4, K.mat(0x6a5a48, 0.9), [0, 0.03, 0], null, 0);
      for (const sx of [-1.43, 1.43]) b.box(0.12, 2.2, 0.12, trim, [sx, 1.1, 1.18], null, 0);
      b.box(2.98, 0.16, 0.12, trim, [0, 2.12, 1.18], null, 0);
      prism(
        b,
        sh,
        [
          [-1.65, 2.5, -1.45],
          [1.65, 2.5, -1.45],
          [1.65, 2.15, 1.5],
          [-1.65, 2.15, 1.5]
        ],
        [0, -0.12, 0]
      );
      b.box(0.08, 0.4, 2.4, bd, [-1.43, 2.3, 0], null, 0);
      b.box(0.08, 0.4, 2.4, bd, [1.43, 2.3, 0], null, 0);
      for (let i = 0; i < 3; i++) b.cyl(0.12, 0.09, 0.2, K.mat(0xb06a42, 0.8), [0.8 + i * 0.22, 0.1, 0.9], null, 10);
      S(-1.47, 1.47, -1.24, -1.16, 0, 2.4);
      S(-1.47, -1.39, -1.2, 1.2, 0, 2.4);
      S(1.39, 1.47, -1.2, 1.2, 0, 2.4);
      sp.push([0, -0.74, 'tool_bench', 'hardware', 0, 0]);
    },
    line: (b, S) => {
      const post = K.mat(0x8a8c8e, 0.4, 0.6),
        rope = K.mat(0xe8e4d8, 0.8);
      for (const x of [-3, 3]) {
        b.cyl(0.04, 0.04, 2.0, post, [x, 1.0, 0], null, 8);
        b.box(0.05, 0.05, 1.1, post, [x, 1.95, 0], null, 0);
        S(x - 0.05, x + 0.05, -0.05, 0.05, 0, 2.0, true);
      }
      const cols = [0xe8e8e8, 0xc84a4a, 0x4a7ac8, 0xe8d06a, 0x8ac87a, 0xe8a0c0];
      [-0.4, 0, 0.4].forEach((z, j) => {
        beam(b, rope, [-3, 1.95, z], [3, 1.95, z], 0.012, 0.012);
        for (let i = 0; i < 3; i++) {
          const x = -2.2 + i * 1.9 + j * 0.4,
            wd = 0.5 + ((i + j) % 3) * 0.25,
            ht = 0.5 + ((i * 2 + j) % 3) * 0.2;
          b.box(wd, ht, 0.015, K.mat(cols[(i + j * 2) % 6], 0.9), [x, 1.93 - ht / 2, z], null, 0);
        }
      });
    },
    swing: (b, S) => {
      const fr = K.mat(0x3a7a4a, 0.45, 0.4),
        ch = K.mat(0x9a9a9a, 0.4, 0.7);
      b.cyl(0.05, 0.05, 3.4, fr, [0, 2.2, 0], [0, 0, PI / 2], 10);
      for (const x of [-1.6, 1.6]) {
        beam(b, fr, [x, 2.2, 0], [x * 1.08, 0, 0.9], 0.07, 0.07);
        beam(b, fr, [x, 2.2, 0], [x * 1.08, 0, -0.9], 0.07, 0.07);
        S(x * 1.08 - 0.1, x * 1.08 + 0.1, -0.95, 0.95, 0, 2.2, true);
      }
      for (const x of [-0.6, 0.6]) {
        for (const dx of [-0.2, 0.2]) beam(b, ch, [x + dx, 2.18, 0], [x + dx, 0.5, 0], 0.015, 0.015);
        b.box(0.5, 0.04, 0.2, K.mat(0xc83a2a, 0.6), [x, 0.48, 0], null, 0.01);
      }
    },
    garden: (b, S) => {
      const tim = K.mat(0x6a4a2e, 0.85),
        leaf = surf('leaves');
      for (const [x, z, w2, d2] of [
        [0, -0.7, 3.0, 0.1],
        [0, 0.7, 3.0, 0.1],
        [-1.5, 0, 0.1, 1.5],
        [1.5, 0, 0.1, 1.5]
      ])
        b.box(w2, 0.35, d2, tim, [x, 0.175, z], null, 0);
      b.box(2.9, 0.3, 1.3, surf('dirt'), [0, 0.15, 0], null, 0);
      for (let i = 0; i < 6; i++)
        for (const z of [-0.35, 0.35]) {
          const x = -1.2 + i * 0.48;
          b.sph(0.16, leaf, [x, 0.42, z], [1, 0.8, 1], 8);
          if (i % 2) {
            b.cyl(0.01, 0.01, 0.9, tim, [x, 0.75, z], null, 4);
            b.sph(0.045, K.mat(0xc8281c, 0.5), [x + 0.06, 0.62, z], null, 8);
          }
        }
      S(-1.55, 1.55, -0.75, 0.75, 0, 0.35, true);
    },
    bbq: (b, S) => {
      const blk = K.mat(0x1e1e20, 0.4, 0.5),
        tim = K.mat(0x8a6a48, 0.85);
      b.add(K.sphGeo(0.32, 16, 8, 0, PI / 2), blk, {p: [-1.4, 0.75, 0], r: [PI, 0, 0]});
      b.add(K.sphGeo(0.33, 16, 6, 0, PI / 3), blk, {p: [-1.4, 0.76, 0]});
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * PI * 2;
        beam(
          b,
          blk,
          [-1.4 + Math.cos(a) * 0.15, 0.5, Math.sin(a) * 0.15],
          [-1.4 + Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3],
          0.025,
          0.025
        );
      }
      // picnic table
      b.box(1.8, 0.05, 0.8, tim, [0.6, 0.75, 0], null, 0.01);
      for (const z of [-0.65, 0.65]) b.box(1.8, 0.05, 0.28, tim, [0.6, 0.45, z], null, 0.01);
      for (const x of [-0.1, 1.3]) for (const s of [-1, 1]) beam(b, tim, [x, 0.75, 0], [x, 0, s * 0.75], 0.08, 0.05);
      S(-0.3, 1.5, -0.8, 0.8, 0, 0.78);
      S(-1.7, -1.1, -0.3, 0.3, 0, 0.9, true);
    }
  };

  /* ===================== the builder ===================== */
  const PT = {th: 0.16};
  // v082: one storey at a time (fl 0 / 1), so each floor's furniture only dodges that floor's doors; partitions take the paint colour
  function walls(B, p, fl, paint) {
    B.y = fl ? FY : 0;
    for (const q of p.ext) if (+q.fl === fl) WL(B, q.ax, q.f, q.a0, q.a1, q.ops.slice(), fl ? H2 : H1);
    for (const q of p.int)
      if (+q.fl === fl) WL(B, q.ax, q.f, q.a0, q.a1, q.ops.slice(), fl ? H2 : H1, Object.assign({}, PT, {c: paint}));
    // v083: archways / garage openings keep furniture out of the way like doors do (core only reserves door swings)
    for (const q of p.ext.concat(p.int))
      if (+q.fl === fl)
        for (const o of q.ops)
          if (o.k === 'g')
            B.occ.push(
              q.ax ? [o.c - 0.9, o.c + 0.9, q.f - 1.4, q.f + 1.4] : [q.f - 1.4, q.f + 1.4, o.c - 0.9, o.c + 0.9]
            );
  }

  /* ---------- v082 furnishing: lootable props along the walls (dodging doors, tall ones dodging windows), core furniture in the middle ---------- */
  // spots along one side of a room: side n / s / w / e = the wall at z0 / z1 / x0 / x1; returns [x, z, angle] facing into the room
  function wallSpots(p, rm, side, wid, tall) {
    const [x0, x1, z0, z1] = rm.r,
      ax = side === 'n' || side === 's' ? 1 : 0,
      f = side === 'n' ? z0 : side === 's' ? z1 : side === 'w' ? x0 : x1,
      inn = side === 'n' || side === 'w' ? 1 : -1,
      u0 = ax ? x0 : z0,
      u1 = ax ? x1 : z1,
      ops = [];
    for (const q of p.ext.concat(p.int))
      if (+q.fl === rm.fl && q.ax === ax && Math.abs(q.f - f) < 0.1) for (const o of q.ops) ops.push(o);
    const out = [],
      a = ax ? (inn > 0 ? 0 : PI) : inn > 0 ? PI / 2 : -PI / 2;
    for (let u = u0 + 0.3 + wid / 2; u <= u1 - 0.3 - wid / 2 + 1e-6; u += wid + 0.05) {
      const bad = ops.some(o => {
        const hw = o.k === 'w' ? 0.75 : o.k === 'd' ? 0.65 : 0.8;
        if (o.k === 'w' && !tall) return false;
        return Math.abs(u - o.c) < hw + wid / 2 + (o.k === 'w' ? 0 : 0.35);
      });
      if (bad) continue;
      const o = f + inn * 0.5;
      out.push(ax ? [u, o, a] : [o, u, a]);
    }
    return out;
  }
  const KIT = {
    fridge: ['fridge_modern', 'fridge_retro', 'fridge_blue'],
    unit: ['kitchen_unit_oak', 'kitchen_unit_white', 'kitchen_unit_dark']
  };
  // what each room gets: lootable props [model, table, width, tall, sides], then core furniture (FT names)
  const ROOMS = {
    kitchen: {
      sp: () => {
        const u = PK1(KIT.unit);
        return [
          [PK1(KIT.fridge), 'house', 0.9, 1],
          [u, 'house', 1.22, 0],
          ['kitchen_sink', 'house', 1.22, 0],
          [u, 'house', 1.22, 0],
          ['washing_machine', 'house', 0.65, 0]
        ];
      },
      sides: ['n', 'e', 'w'],
      furn: [
        ['table', 'c', 0.5, 0, 0.3],
        ['chair', 'c', 0.5, -0.4, 1.15, PI],
        ['chair', 'c', 0.5, 0.4, -0.55, 0]
      ]
    },
    living: {
      sp: () => [
        ['bookshelf', 'house', 1.1, 1],
        [PK1(['coffee_table', 'trunk_leather']), 'house', 1.25, 0]
      ],
      sides: ['w', 'e', 'n'],
      furn: [
        ['sofa', 's', 0.5],
        ['tv', 'n', 0.5],
        ['rug', 'c', 0.5],
        ['ctable', 'c', 0.5],
        ['lamp', 'e', 0.95],
        ['plant', 'w', 0.95]
      ]
    },
    den: {
      sp: () => [
        ['bookshelf', 'house', 1.1, 1],
        ['trunk_steamer', 'house', 1.1, 0]
      ],
      sides: ['e', 'w', 'n'],
      furn: [
        ['sofa', 's', 0.5],
        ['desk', 'n', 0.5],
        ['chair', 'n', 0.5, 0, 0.7, PI],
        ['plant', 'e', 0.95]
      ]
    },
    dining: {
      sp: () => [['dresser', 'house', 1.2, 0]],
      sides: ['n', 'w', 'e'],
      furn: RM.dining.filter(f => f[0] !== 'shelf')
    },
    bed: {
      sp: () => [['dresser', 'house', 1.2, 0]],
      sides: ['s', 'e', 'w'],
      furn: [
        ['bed', 'n', 0.5],
        ['rug', 'c', 0.5],
        ['wardrobe', 'w', 0.8],
        ['box', 'e', 0.2]
      ]
    },
    master: {
      sp: () => [
        ['dresser', 'house', 1.2, 0],
        ['trunk_leather', 'house', 1.05, 0]
      ],
      sides: ['s', 'e', 'w'],
      furn: [
        ['bed', 'n', 0.5],
        ['rug', 'c', 0.5],
        ['wardrobe', 'e', 0.8],
        ['lamp', 'w', 0.1]
      ]
    },
    kids: {
      sp: () => [
        ['dresser', 'house', 1.2, 0],
        ['cardboard_box_medium', 'storage', 0.7, 0]
      ],
      sides: ['s', 'w', 'e'],
      furn: [
        ['bed', 'n', 0.2],
        ['desk', 'e', 0.6],
        ['chair', 'e', 0.6, -0.7, 0, PI / 2],
        ['box', 'n', 0.9]
      ]
    },
    bath: {
      sp: () => [['medicine_cabinet', 'clinic', 0.9, 1]],
      sides: ['e', 'w', 's', 'n'],
      furn: RM.bath
    },
    hall: {sp: () => [], sides: [], furn: [['plant', 'n', 0.5]]},
    // v083: garages keep the middle clear for a car
    garage: {
      sp: () => [
        ['tool_bench', 'hardware', 1.8, 0],
        ['cardboard_box_medium', 'storage', 0.7, 0],
        [PK1(['cardboard_box_small', 'washing_machine']), 'storage', 0.7, 0]
      ],
      sides: ['n', 's', 'e', 'w'],
      furn: []
    }
  };
  function furnish(B, p, fl, zs) {
    const SP = LK.spawner(B, 'house'),
      y = fl ? FY : 0;
    // v089: door / archway clear zones on this storey (js/props/condkit.js), 1.2 m deep
    const DZ = window.MFZCOND
      ? MFZCOND.zones(B)
          .filter(r => Math.abs((r[5].y || 0) - y) < 0.5)
          .map(r => (r[5].ax ? [r[0], r[1], r[2] + 0.2, r[3] - 0.2] : [r[0] + 0.2, r[1] - 0.2, r[2], r[3]]))
      : [];
    // keep the stairs (and the stairwell upstairs) clear
    if (p.two) {
      const s = p.stair,
        zt = s.z0 + s.dz * NST * RUN,
        h = p.hole;
      if (fl) B.occ.push([h[0] - 0.2, h[1] + 0.2, h[2] - 1.1, h[3] + 0.2]);
      else B.occ.push([s.x0 - 0.2, s.x1 + 0.2, Math.min(s.z0, zt) - 1.1, Math.max(s.z0, zt) + 1.1]);
    }
    for (const rm of p.rooms) {
      if (+rm.fl !== fl) continue;
      const R = ROOMS[rm.k];
      if (!R) continue;
      const r = rm.r,
        inner = [r[0] + 0.15, r[1] - 0.15, r[2] + 0.15, r[3] - 0.15];
      for (const [model, table, wid, tall] of R.sp()) {
        let placed = false;
        for (const side of R.sides) {
          for (const [x, z, a] of wallSpots(p, rm, side, wid, tall)) {
            const sw = Math.abs(Math.sin(a)) > 0.5,
              hw = (sw ? 0.6 : wid) / 2,
              hd = (sw ? wid : 0.6) / 2,
              fp = [x - hw, x + hw, z - hd, z + hd];
            if (B.occ.some(o => fp[0] < o[1] && fp[1] > o[0] && fp[2] < o[3] && fp[3] > o[2])) continue;
            if (DZ.some(o => fp[0] < o[1] && fp[1] > o[0] && fp[2] < o[3] && fp[3] > o[2])) continue; // v089: doorways and archways
            B.occ.push(fp);
            SP(x, z, model, table, a, y);
            placed = true;
            break;
          }
          if (placed) break;
        }
      }
      B.y = y;
      try {
        furn(B, R.furn, inner);
      } catch (e) {}
      if (!fl && rm.k !== 'hall') zs.push([(r[0] + r[1]) / 2, (r[2] + r[3]) / 2]);
    }
    B.y = 0;
  }

  /* ---------- v082 yard and sidewalk: back-yard pieces in two slots + a middle strip, one or two sidewalk props clear of the path and driveway ---------- */
  function yard(B, C, p) {
    const [, , bz0] = bbox(p),
      dX = C.drive ? C.drive.x : 99,
      bk = p.back.x;
    const opts = ['pool', 'shed', 'swing', 'garden', 'bbq', null],
      used = new Set();
    const rg = p.gar && !p.gar.att ? p.gar.r : null; // v083: keep clear of a rear garage
    for (const sx of [-5, 5]) {
      if (rg && sx > rg[0] - 2.6 && sx < rg[1] + 2.6) continue;
      const pool = opts.filter(o => !used.has(o) && !(o === 'pool' && Math.abs(sx - dX) < 5.5)),
        m = PK1(pool);
      if (!m) continue;
      used.add(m);
      const z = Math.min(bz0 - 4.2, -12.6);
      if (Math.abs(sx - bk) < 2.6 && z > bz0 - 4) continue;
      attach(B, mod(m), null, sx, z);
      if (m === 'pool' && window.MFZWATER) {
        // v091: the above-ground pool's water (0.97 m up, 0.94 m deep); green once the house is looted or ruined
        const lv = (typeof CUR !== 'undefined' && CUR && CUR.lv) || 0;
        MFZWATER.add({
          kind: lv ? 'green' : 'pool',
          parent: B.g,
          shape: 'disc',
          x: sx,
          y: lv > 1 ? 0.6 : 0.97,
          z,
          r: 2.235,
          seg: 32,
          rings: 5,
          bed: lv > 1 ? 0.57 : 0.94,
          sink: 0, // v093: the tank is really that deep (you stand on its floor, chest deep), so walkers are not lowered further
          vis: lv ? 0.4 : 1.5
        });
      }
      for (const s of mod(m).sp) {
        const SP = LK.spawner(B, 'hardware');
        SP(s[0] + sx, s[1] + z, s[2], s[3], s[4], s[5]);
      }
    }
    if (!rg && Math.random() < 0.6) attach(B, mod('line'), null, 0, -16.3);
    // sidewalk: a street light or hydrant, sometimes a USPS box or school-crossing sign
    const xs = [-8, -5, -2, 2, 5, 8].filter(x => Math.abs(x - p.door) > 1.6 && Math.abs(x - dX) > 2.2);
    const st = [PK1(['pole', 'pole', 'hydrant'])];
    if (Math.random() < 0.5) st.push(PK1(['usps', 'xing', 'hydrant']));
    for (const m of st) {
      if (!xs.length) break;
      const x = xs.splice(Math.floor(Math.random() * xs.length), 1)[0];
      attach(B, mod(m), null, x, 0);
    }
  }
  // the cached decor on the lot, with this house's colours swapped in for the slot materials
  function attach(B, C, map, ox, oz) {
    const D = new T.Object3D();
    D.userData.kind = 'bdecor';
    D.position.set(ox || 0, 0, oz || 0);
    for (const q of C.M.meshes) {
      const m = new T.Mesh(q.g, (map && map.get(q.mat)) || q.mat);
      m.castShadow = !m.material.transparent;
      m.receiveShadow = true;
      D.add(m);
    }
    B.g.add(D);
    B.g.updateMatrixWorld(true);
    for (const c of C.cols) {
      const a = new T.Vector3(c[0], c[1], c[2]).applyMatrix4(D.matrixWorld),
        e = new T.Vector3(c[3], c[4], c[5]).applyMatrix4(D.matrixWorld);
      solids.push(new T.Box3(a.clone().min(e), a.clone().max(e)));
    }
    for (const o of C.occ) B.occ.push([o[0] + (ox || 0), o[1] + (ox || 0), o[2] + (oz || 0), o[3] + (oz || 0)]);
  }

  function pick(kind) {
    const pid = PK1(kind === 'small' ? ONE : TWO),
      p0 = PLANS[pid]();
    return {
      pid,
      m: Math.random() < 0.5 ? 1 : -1,
      roof: PK1(p0.roofs),
      porch: PK1(p0.porches),
      fence: PK1(['picket', 'picket', 'chain', 'open']),
      gar: PK1(['att', 'att', 'att', 'rear', 'rear', 'none', 'none']) // v083: attached garage 3/7, rear (alley) garage 2/7
    };
  }

  // v082: this house's colours, as a slot material -> painted material map for attach() (memoised per palette)
  const ACCS = [0x2e4a34, 0x5a2c2c, 0x2a3a5a, 0x3a3a3e, 0xeeeeea, 0x8a3a2a, 0x4a2c14];
  const PMAP = {};
  function palette() {
    const c = {
      wall: PK1(WALLS),
      trim: PK1(TRIMS),
      roof: PK1(ROOFS),
      brick: PK1(BRICKS),
      acc: PK1(ACCS),
      paint: PK1(PAINTS),
      paintB: PK1(PAINTS),
      carpet: PK1(CARPETS)
    };
    const k = Object.values(c).join('|');
    if (!PMAP[k])
      PMAP[k] = new Map([
        [SLOT.wall(), tint('clap', c.wall, TO.clap)],
        [SLOT.roof(), tint('shingle', c.roof, TO.shingle)],
        [SLOT.brick(), tint('brick', c.brick, TO.brick)],
        [SLOT.trim(), K.mat(c.trim, 0.55)],
        [SLOT.acc(), K.mat(c.acc, 0.6)],
        [SLOT.paint(), tint('plaster', c.paint, TO.plaster)],
        [SLOT.paintB(), tint('plaster', c.paintB, TO.plaster)],
        [SLOT.carpet(), tint('carpet', c.carpet, TO.carpet)]
      ]);
    return {c, map: PMAP[k]};
  }

  function bHalfHouse(kind) {
    return function (x, z, t) {
      const v = pick(kind),
        key = [v.pid, v.m, v.roof, v.porch, v.fence, v.gar].join('|'),
        C = build(key),
        p = C.p,
        pal = palette();
      if (window.HALFHOUSE) window.HALFHOUSE.last = p; // test hook (tools: walk / layout checks)
      const B = mk(x, z, 20, 36, p.two ? FY + H2 : H1, pal.c.wall, 0x6a5a4a, pal.c.acc);
      B.dx = p.door;
      attach(B, C, pal.map);
      const SP = LK.spawner(B, 'house');
      for (const s of C.sp) SP(...s);
      const zs = C.zs.slice();
      // each storey: its walls, then its furniture and loot (doors upstairs don't block furniture downstairs)
      for (const fl of p.two ? [0, 1] : [0]) {
        const keep = B.occ.slice();
        walls(B, p, fl, pal.c.paint);
        furnish(B, p, fl, zs);
        if (fl === 0 && p.two) B.occ = keep;
      }
      B.y = 0;
      yard(B, C, p);
      for (let i = zs.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [zs[i], zs[j]] = [zs[j], zs[i]];
      }
      zs.push([p.door, p.front + 4], [p.back.x, p.back.z - 3]);
      const [x0, x1, z0, z1] = bbox(p);
      return LK.finish(B, t, {
        at: [(x0 + x1) / 2, (z0 + z1) / 2],
        w: x1 - x0,
        d: z1 - z0,
        loot: ['house', [x0 + 0.5, x1 - 0.5, z0 + 0.5, z1 - 0.5], 1],
        zombies: zs
      });
    };
  }

  const bHalfHouseSmall = bHalfHouse('small'),
    bHalfHouseTwo = bHalfHouse('two');
  LK.register({
    id: 'small_house',
    name: 'Half Plot House (one storey)',
    build: bHalfHouseSmall,
    note: 'half-plot house, one storey: bungalow, ranch or cottage, many roofs / porches / colours',
    globals: {bHalfHouseSmall}
  });
  LK.register({
    id: 'medium_house',
    name: 'Half Plot House (two storey)',
    build: bHalfHouseTwo,
    note: 'half-plot house, two storey: colonial or gable-front, gambrel / gable / hip roofs, porches, many colours',
    globals: {bHalfHouseTwo, HALFHOUSE: {build, plan, PLANS}}
  });
  console.log('[halfhouse] Half Plot House ready');
})();
