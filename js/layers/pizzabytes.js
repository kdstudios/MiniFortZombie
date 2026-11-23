/* ==========================================================================================================
   MINI FORT ZOMBIE - PIZZABYTES (v089): a pizza restaurant on a half plot (20 x 36 m, front = +Z), our own design.
   "Stuffed crust & full of lust!" Replaces the Rise & Shine Bakery placeholder (newlots.js id bakery, half pool).
   OUTSIDE: a 17 x 18.5 m red brick restaurant with a cream stucco parapet band, a green / white / red striped awning over a glazed
   shopfront, swinging double doors, glowing PIZZABYTES channel letters over a pixel-art logo (a slice with a byte out of it), the
   STUFFED CRUST & FULL OF LUST! tagline board, a giant 3D pizza slice on the roof, a pole sign. In front: a brick-paved patio fenced by
   planters with bistro tables and parasols, a chalk A-board, a delivery scooter with a hot box, a small PIZZABYTES delivery car.
   Behind: a yard to the alley with the oven wood store, dumpster, grease drum, crates and the PIZZABYTES van.
   INSIDE: the dining room (terracotta tile, cream walls over red-and-white checker tile, pendant lights): booths along the left wall,
   red gingham tables with bentwood chairs, two arcade cabinets (the "bytes"), a drinks cooler, menu boards and posters. The order
   counter with a heated slice case and the till, and behind it the open pizza station: a domed brick wood-fired oven with a mosaic
   face, the make line of topping wells, peels and a heat lamp. Through the staff door: the kitchen (conveyor oven, dough mixer, dough
   proofing rack, prep tables, fryer, sink, dish station, pizza box stacks), a walk-in cooler, dry stores, the manager's office and a
   customer toilet off the dining room.
   Structure from core WL (doors / windows work); detail is our own geometry and painted artwork, outside the static merge.
   ========================================================================================================== */
(function () {
  'use strict';
  const K = window.MFZK,
    LK = window.LOTKIT;
  if (!K || !LK || typeof WL !== 'function' || typeof NEWCAT === 'undefined') {
    console.warn('[pizzabytes] core / prop kit missing');
    return;
  }
  const T = THREE,
    P = K.P,
    PI = Math.PI;
  // the restaurant box (x -8.5..8.5, z -12..6.5), heights
  const X0 = -8.5,
    X1 = 8.5,
    Z0 = -12,
    Z1 = 6.5,
    H = 4.4,
    CEIL = 3.2;
  // the dining / kitchen partition (z = PZ); the order counter front (z = CZ, x CX0..X1)
  const PZ = -3.0,
    CZ = -0.7,
    CX0 = -2.0;
  // customer toilet: x X0..TX, z TZ..PZ. Walk-in cooler: x X0..TX, z Z0..FZ. Office: x OX..X1, z Z0..OZ
  const TX = -5.0,
    TZ = -6.3,
    FZ = -9.0,
    OX = 4.5,
    OZ = -8.5;
  const FRONT = [
    {k: 'w', c: -6.8},
    {k: 'w', c: -4.8},
    {k: 'w', c: -2.8},
    {k: 'd', c: -0.65, dbl: 'swing'},
    {k: 'd', c: 0.65, dbl: 'swing'},
    {k: 'w', c: 2.8},
    {k: 'w', c: 4.8},
    {k: 'w', c: 6.8}
  ];
  const LEFT = [
    {k: 'w', c: 4.6},
    {k: 'w', c: 2.4},
    {k: 'w', c: 0.2}
  ];
  const RIGHT = [
    {k: 'w', c: 4.6},
    {k: 'w', c: 1.0},
    {k: 'w', c: -10.2}
  ];
  const BACK = [{k: 'd', c: -1.5, s: -1}];
  const PART = [
    {k: 'd', c: -7.0}, // customer toilet
    {k: 'd', c: -3.6} // staff door to the kitchen
  ];
  const WCS = []; // toilet side wall (x = TX) and back (z = TZ): solid
  const OFF = [{k: 'd', c: 6.4}]; // office door (z = OZ)

  /* ===================== loot tables ===================== */
  try {
    Object.assign(LOOT_TABLES, {
      // the make line, slice case and front counter: the good stuff
      pb_counter: {
        calzones: 6,
        salami: 3,
        pizan_pasta: 2,
        pickles: 2,
        salad: 2,
        colacola: 3,
        popzi_soft_drink: 3,
        sup_soft_drink: 2,
        citrol: 2,
        milk: 1
      },
      // the kitchen: prep tables, fridge, freezer, fryer, sink
      pb_kitchen: {
        calzones: 5,
        salami: 4,
        sausages: 3,
        bacon: 3,
        smoked_ham: 1,
        lamburger: 2,
        salad: 3,
        atomic_veggies: 2,
        pickles: 2,
        milk: 3,
        butcher_knife: 1
      },
      // walk-in cooler and dry stores: bulk tins, sacks and cheese-and-meat
      pb_stores: {
        pizan_pasta: 5,
        calzones: 3,
        salami: 3,
        sausages: 2,
        kenball_soup: 3,
        pickles: 3,
        cherry_preserves: 1,
        sugar: 3,
        crackers: 2,
        water_jug: 2,
        gas_cylinder: 1
      },
      // the manager's office: snacks, drinks, a stash
      pb_office: {
        cheezholes: 3,
        tweex: 3,
        colacola: 2,
        z_energy_drink: 2,
        stugots_coffee: 2,
        painkiller: 2,
        duct_tape: 2,
        ammo_38_fed: 1
      },
      // customer toilet: the first-aid box and odds
      pb_wc: {painkiller: 2, gauze: 2, cotton_balls: 2, medical_tape: 1, hairspray: 1}
    });
    for (const tn of ['pb_counter', 'pb_kitchen', 'pb_stores', 'pb_office', 'pb_wc'])
      for (const id in LOOT_TABLES[tn])
        if (!ITEMS[id]) {
          console.error('[pizzabytes] loot table ' + tn + ' has unknown item ' + id);
          delete LOOT_TABLES[tn][id];
        }
    if (typeof LOOT_PROP !== 'undefined')
      Object.assign(LOOT_PROP, {
        pb_counter: 'counter',
        pb_kitchen: 'cabinet',
        pb_stores: 'cabinet',
        pb_office: 'cabinet',
        pb_wc: 'cabinet'
      });
    const A = window.MFZPROP && MFZPROP.auto;
    if (A) {
      const pick = (...ts) => [...new Set(ts.flatMap(t => A[t] || []))];
      A.pb_counter = pick('diner', 'restaurant', 'convenience');
      A.pb_kitchen = pick('restaurant', 'diner', 'house');
      A.pb_stores = pick('restaurant', 'house', 'storage');
      A.pb_office = pick('house', 'office');
      A.pb_wc = pick('house', 'clinic');
    }
  } catch (e) {
    console.warn('[pizzabytes] loot tables', e);
  }

  /* ===================== artwork ===================== */
  const RED = '#c8202a',
    GRN = '#1f7a3a',
    CREAM = '#fff3dc',
    GOLD = '#f6c23a',
    INK = '#1a1630';
  const PIX = '"Press Start 2P", "Courier New", Courier, monospace';
  const SCRIPT = 'italic bold 120px "Brush Script MT", "Lucida Handwriting", Georgia, cursive';
  // green / white / red awning stripes; v = scalloped valance (alpha under the scallops)
  const stripes = (key, n, v) =>
    K.paint(
      key,
      1024,
      v ? 96 : 256,
      (c, W, H, r) => {
        c.clearRect(0, 0, W, H);
        const sw = W / n;
        if (v) {
          c.beginPath();
          c.moveTo(0, 0);
          c.lineTo(W, 0);
          for (let i = n; i >= 0; i--) c.arc(i * sw, H * 0.62, sw / 2, 0, PI, false);
          c.closePath();
          c.clip();
        }
        for (let i = 0; i < n; i++) {
          c.fillStyle = ['#1f7a3a', '#f6efe0', '#c8202a', '#f6efe0'][i % 4];
          c.fillRect(i * sw, 0, sw + 1, H);
        }
        P.noise(c, W, H, r, 4000, 0.12, '#3a2a20', 1.4);
        P.grime(c, W, H, r, 0.3);
      },
      {alpha: !!v, r: 0.85}
    );
  // the 8-bit slice with a byte taken out of the corner (12 x 12 cells, top-left at x, y)
  function pixelSlice(c, x, y, s) {
    const pep = new Set(['3,4', '4,4', '3,5', '4,5', '7,3', '8,3', '7,4', '8,4', '5,7', '6,7', '5,8', '6,8']);
    const bite = (r, k) => (r === 0 && k >= 7) || (r === 1 && k >= 8) || (r === 2 && k >= 9);
    for (let r = 0; r < 12; r++) {
      const k0 = Math.floor(r / 2),
        k1 = 11 - Math.floor(r / 2);
      for (let k = k0; k <= k1; k++) {
        if (bite(r, k)) continue;
        c.fillStyle =
          r === 0 ? '#8a4a18' : r === 1 ? '#c07a2a' : pep.has(k + ',' + r) ? RED : r === 11 ? '#e8a020' : GOLD;
        c.fillRect(x + k * s, y + r * s, s - 1, s - 1);
      }
    }
    // the crumbs falling out of the bite
    c.fillStyle = '#c07a2a';
    for (const [k, r] of [
      [12, 1],
      [13, 3],
      [12.5, 5]
    ])
      c.fillRect(x + k * s, y + r * s, s * 0.6, s * 0.6);
  }
  // the brand board: navy panel, the pixel slice, PIZZA / BYTES in chunky arcade letters
  const logoMat = (key, w, h, o) =>
    K.paint(
      key,
      w,
      h,
      (c, W, H, r) => {
        c.fillStyle = INK;
        P.rrect(c, 0, 0, W, H, H * 0.12);
        c.fill();
        c.strokeStyle = GOLD;
        c.lineWidth = H * 0.04;
        P.rrect(c, H * 0.05, H * 0.05, W - H * 0.1, H - H * 0.1, H * 0.09);
        c.stroke();
        const s = Math.floor(H * 0.058);
        pixelSlice(c, H * 0.14, (H - 12 * s) / 2, s);
        const tx = H * 0.14 + 14.5 * s,
          tw = W - tx - H * 0.1;
        P.text(c, 'PIZZA', tx + tw / 2, H * 0.34, {
          size: H * 0.3,
          weight: 'bold',
          font: PIX,
          col: RED,
          stroke: CREAM,
          lw: H * 0.03,
          max: tw
        });
        P.text(c, 'BYTES', tx + tw / 2, H * 0.67, {
          size: H * 0.3,
          weight: 'bold',
          font: PIX,
          col: GOLD,
          stroke: INK,
          lw: 2,
          max: tw
        });
        P.text(c, 'STUFFED CRUST & FULL OF LUST!', tx + tw / 2, H * 0.88, {size: H * 0.075, col: CREAM, max: tw});
        P.noise(c, W, H, r, 1500, 0.05, '#000000', 1);
      },
      o || {}
    );
  // glowing channel letters (transparent round the letters): a halo, the lit face, a light core edge
  const letters = (key, txt, col, w, h) =>
    K.paint(
      key,
      w,
      h,
      (c, W, H) => {
        c.clearRect(0, 0, W, H);
        c.font = 'bold ' + Math.floor(H * 0.72) + 'px ' + PIX;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        const m = c.measureText(txt).width;
        c.save();
        if (m > W * 0.94) {
          c.translate(W / 2, 0);
          c.scale((W * 0.94) / m, 1);
          c.translate(-W / 2, 0);
        }
        c.shadowColor = col;
        c.shadowBlur = H * 0.14;
        c.fillStyle = col;
        c.fillText(txt, W / 2, H * 0.54);
        c.shadowBlur = 0;
        c.lineWidth = H * 0.025;
        c.strokeStyle = '#fff6e0';
        c.strokeText(txt, W / 2, H * 0.54);
        c.restore();
      },
      {alpha: true, glow: 1.4}
    );
  // a flat painted board: background, a main line and an optional second line
  const board = (key, l1, l2, bg, fg, w, h, font) =>
    K.paint(key, w, h, (c, W, H, r) => {
      c.fillStyle = bg;
      c.fillRect(0, 0, W, H);
      c.strokeStyle = fg;
      c.lineWidth = H * 0.04;
      c.strokeRect(H * 0.06, H * 0.06, W - H * 0.12, H - H * 0.12);
      if (font) {
        c.font = font;
        c.fillStyle = fg;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        const m = c.measureText(l1).width;
        c.save();
        if (m > W * 0.9) {
          c.translate(W / 2, 0);
          c.scale((W * 0.9) / m, 1);
          c.translate(-W / 2, 0);
        }
        c.fillText(l1, W / 2, l2 ? H * 0.4 : H * 0.52);
        c.restore();
      } else
        P.text(c, l1, W / 2, l2 ? H * 0.38 : H * 0.52, {
          size: H * (l2 ? 0.4 : 0.55),
          weight: 'bold',
          col: fg,
          max: W * 0.88
        });
      if (l2) P.text(c, l2, W / 2, H * 0.78, {size: H * 0.2, col: fg, max: W * 0.88});
      P.noise(c, W, H, r, 1200, 0.05, '#000000', 1);
    });
  // chalk menu board: a title and pun pizza names with prices
  const menuMat = (key, title, items) =>
    K.paint(key, 512, 640, (c, W, H, r) => {
      c.fillStyle = '#5a3a1e';
      c.fillRect(0, 0, W, H);
      c.fillStyle = '#1e2420';
      c.fillRect(18, 18, W - 36, H - 36);
      P.noise(c, W, H, r, 3000, 0.06, '#ffffff', 1.5);
      P.text(c, title, W / 2, 70, {size: 46, weight: 'bold', col: GOLD, max: W - 80});
      c.fillStyle = '#e8e0d0';
      c.fillRect(70, 104, W - 140, 3);
      items.forEach(([n, p], i) => {
        const y = 150 + i * 62;
        P.text(c, n, 44, y, {size: 28, col: '#f4efe6', align: 'left', max: W - 170});
        P.text(c, p, W - 44, y, {size: 28, col: '#ff8a7a', align: 'right'});
      });
      pixelSlice(c, W - 120, H - 120, 7);
    });
  const MENUS = [
    [
      'PIZZAS',
      [
        ['The Meat Sweats', '$14'],
        ['Sausage Party', '$13'],
        ['Pepperoni & Chill', '$12'],
        ['Hawaiian Punch', '$12'],
        ['Margherita Manslaughter', '$11'],
        ['Braaains & Basil', '$13'],
        ['The Dead Meat', '$15']
      ]
    ],
    [
      'STUFFED CRUST',
      [
        ['Cheesy Pickup Line', '+$3'],
        ['Hot Pocket Rocket', '+$3'],
        ['The Big Dipper', '+$4'],
        ['Size Matters 18"', '$19'],
        ['Thicc Boi Deep Dish', '$17'],
        ['Garlic Knots (6)', '$5'],
        ['Hot Wings (10)', '$9']
      ]
    ],
    [
      'SLICES & SIDES',
      [
        ['Slice Slice Baby', '$3'],
        ['Two Slice & Soda', '$7'],
        ['Calzone Ranger', '$8'],
        ['Caesar Salad-ish', '$6'],
        ['Mozzarella Sticks', '$5'],
        ['Fountain Soda', '$2'],
        ['Tiramisu-icide', '$5']
      ]
    ]
  ];
  // posters: coloured card, a big line, a small line, the pixel slice
  const poster = (key, a, b2, bg, fg) =>
    K.paint(key, 384, 512, (c, W, H, r) => {
      c.fillStyle = bg;
      c.fillRect(0, 0, W, H);
      c.strokeStyle = fg;
      c.lineWidth = 8;
      c.strokeRect(14, 14, W - 28, H - 28);
      pixelSlice(c, W / 2 - 84, 60, 14);
      const ls = a.split('|');
      ls.forEach((t, i) =>
        P.text(c, t, W / 2, 290 + i * 54, {size: 46, weight: 'bold', font: PIX, col: fg, max: W - 50})
      );
      P.text(c, b2, W / 2, H - 50, {size: 26, col: fg, max: W - 50});
      P.noise(c, W, H, r, 1500, 0.06, '#000000', 1);
    });
  const POSTERS = [
    ['INSERT|COIN', 'GET A SLICE', INK, GOLD],
    ['HOT &|READY', 'like you, babe', RED, CREAM],
    ['DOUGH|YOU WANT|ME?', 'fresh daily since 1989', GOLD, INK],
    ['EXTRA|CHEESY', 'pickup lines on request', GRN, CREAM],
    ['GAME|OVER', 'for hunger', '#2a2a6a', '#ff6ad0'],
    ['SIZE|MATTERS', 'ask about our 18"', CREAM, RED]
  ];

  /* ===================== surfaces ===================== */
  const SURF = {};
  const surf = k =>
    SURF[k] ||
    (SURF[k] = {
      asphalt: () => K.surf('asphalt', 0x34363a),
      concrete: () => K.surf('concrete', 0xb4b0a6),
      fence: () => K.surf('wood', 0x6a5444),
      // warm red brick, running bond
      brick: () =>
        K.tri(
          'pb_brick',
          (c, W, H, r) => {
            c.fillStyle = '#9a9086';
            c.fillRect(0, 0, W, H);
            const rows = 16,
              bh = H / rows,
              bw = W / 4;
            for (let j = 0; j < rows; j++)
              for (let i = -1; i < 5; i++) {
                const x = i * bw + (j % 2 ? bw / 2 : 0);
                c.fillStyle = `hsl(${4 + r() * 10},${45 + r() * 15}%,${30 + r() * 10}%)`;
                c.fillRect(x + 2, j * bh + 2, bw - 4, bh - 4);
              }
            P.noise(c, W, H, r, 6000, 0.15, '#2a1a10', 1.3);
            P.grime(c, W, H, r, 0.3);
          },
          {tile: 1.2, r: 0.9}
        ),
      // brick pavers, herringbone-ish basket weave
      pavers: () =>
        K.tri(
          'pb_pavers',
          (c, W, H, r) => {
            c.fillStyle = '#6a5a4c';
            c.fillRect(0, 0, W, H);
            const n = 8,
              s = W / n;
            for (let j = 0; j < n; j++)
              for (let i = 0; i < n; i++) {
                c.fillStyle = `hsl(${12 + r() * 10},${30 + r() * 12}%,${34 + r() * 10}%)`;
                if ((i + j) % 2) {
                  c.fillRect(i * s + 2, j * s + 2, s / 2 - 3, s - 4);
                  c.fillRect(i * s + s / 2 + 1, j * s + 2, s / 2 - 3, s - 4);
                } else {
                  c.fillRect(i * s + 2, j * s + 2, s - 4, s / 2 - 3);
                  c.fillRect(i * s + 2, j * s + s / 2 + 1, s - 4, s / 2 - 3);
                }
              }
            P.noise(c, W, H, r, 4000, 0.12, '#1a1008', 1.3);
          },
          {tile: 1.6, r: 0.9}
        ),
      stucco: () => K.surf('plaster', 0xeee0c4),
      coping: () => K.mat(0xd8ccb4, 0.7),
      // terracotta floor tiles
      terra: () =>
        K.tri(
          'pb_terra',
          (c, W, H, r) => {
            c.fillStyle = '#8a6a50';
            c.fillRect(0, 0, W, H);
            const n = 4,
              s = W / n;
            for (let j = 0; j < n; j++)
              for (let i = 0; i < n; i++) {
                c.fillStyle = `hsl(${16 + r() * 8},${48 + r() * 12}%,${40 + r() * 8}%)`;
                c.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
              }
            P.noise(c, W, H, r, 4000, 0.08, '#3a1a08', 1.2);
          },
          {tile: 1.2, r: 0.55}
        ),
      // red and white checker wall tile (dining dado)
      chkTile: () =>
        K.tri(
          'pb_chk',
          (c, W, H) => {
            const n = 8,
              s = W / n;
            for (let j = 0; j < n; j++)
              for (let i = 0; i < n; i++) {
                c.fillStyle = (i + j) % 2 ? '#c8202a' : '#f6f2ea';
                c.fillRect(i * s, j * s, s, s);
              }
            c.fillStyle = 'rgba(80,60,50,0.35)';
            for (let i = 0; i <= n; i++) {
              c.fillRect(i * s - 1, 0, 2, H);
              c.fillRect(0, i * s - 1, W, 2);
            }
          },
          {tile: 0.8, r: 0.25}
        ),
      // red gingham table cloth
      gingham: () =>
        K.tri(
          'pb_ging',
          (c, W, H) => {
            c.fillStyle = '#f8f4ee';
            c.fillRect(0, 0, W, H);
            const n = 12,
              s = W / n;
            c.fillStyle = 'rgba(200,32,42,0.5)';
            for (let i = 0; i < n; i += 2) {
              c.fillRect(i * s, 0, s, H);
              c.fillRect(0, i * s, W, s);
            }
          },
          {tile: 0.5, r: 0.8}
        ),
      // white kitchen wall tile
      tile: () =>
        K.tri(
          'pb_tile',
          (c, W, H) => {
            c.fillStyle = '#c4c6c4';
            c.fillRect(0, 0, W, H);
            const n = 8,
              s = W / n;
            c.fillStyle = '#f6f6f2';
            for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) c.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
          },
          {tile: 1.2, r: 0.25}
        ),
      quarry: () =>
        K.tri(
          'pb_quarry',
          (c, W, H, r) => {
            c.fillStyle = '#4a3a30';
            c.fillRect(0, 0, W, H);
            const n = 4,
              s = W / n;
            for (let j = 0; j < n; j++)
              for (let i = 0; i < n; i++) {
                c.fillStyle = `hsl(${8 + r() * 6},${40 + r() * 10}%,${26 + r() * 6}%)`;
                c.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
              }
            P.noise(c, W, H, r, 3000, 0.1, '#000000', 1.2);
          },
          {tile: 0.9, r: 0.7}
        ),
      // the oven's mosaic face: small glossy tiles in reds and golds
      mosaic: () =>
        K.tri(
          'pb_mosaic',
          (c, W, H, r) => {
            c.fillStyle = '#3a2a20';
            c.fillRect(0, 0, W, H);
            const n = 24,
              s = W / n,
              cols = ['#c8202a', '#a01820', '#f6c23a', '#e88a20', '#1f7a3a', '#f6efe0'];
            for (let j = 0; j < n; j++)
              for (let i = 0; i < n; i++) {
                c.fillStyle = cols[Math.floor(r() * (r() < 0.7 ? 3 : 6))];
                c.fillRect(i * s + 1.5, j * s + 1.5, s - 3, s - 3);
              }
          },
          {tile: 0.6, r: 0.2}
        ),
      greenP: () => K.mat(0x1f5a32, 0.45, 0.1),
      redP: () => K.mat(0xb81c26, 0.45, 0.1),
      chrome: () => K.chrome()
    }[k]());

  /* ===================== geometry ===================== */
  let CACHE = null;
  function build() {
    if (CACHE) return CACHE;
    const G = LK.geo('pizzabytes'),
      b = G.b,
      S = G.S;
    const conc = surf('concrete'),
      asph = surf('asphalt');
    const rb = (w, h, d, r, m, p, rot) => b.rbox(w, h, d, r, m, p, rot, 1);
    /* ---------- grounds: sidewalk, front apron, round the building, yard to the alley ---------- */
    LK.pavement(b, conc, {w: 20});
    b.box(20, 0.02, 15.9 - Z1, asph, [0, 0.012, (Z1 + 15.9) / 2], null, 0); // front apron (paved over in stage 2)
    b.box(20, 0.02, Z1 - Z0, asph, [0, 0.012, (Z0 + Z1) / 2], null, 0); // round the building
    b.box(20, 0.02, 18 + Z0, asph, [0, 0.012, (-18 + Z0) / 2], null, 0); // yard to the alley

    const brk = surf('brick'),
      stc = surf('stucco'),
      cop = surf('coping'),
      grnP = surf('greenP'),
      redP = surf('redP'),
      chrome = surf('chrome'),
      dark = K.mat(0x1c1c1e, 0.5),
      steel = K.mat(0x9a9ea2, 0.4, 0.7),
      white = K.mat(0xf4f2ec, 0.5),
      wood = K.mat(0x7a5232, 0.7),
      woodD = K.mat(0x4a3220, 0.75),
      leaf = K.mat(0x3e6a2e, 0.85),
      leaf2 = K.mat(0x557f38, 0.85),
      soil = K.mat(0x3a2a1c, 0.95),
      tileM = K.mat(0x1f4a2a, 0.3, 0.05), // green glazed stallriser tile
      warm = K.mat(0xfff2c8, 0.4, 0, {emissive: 0xffd890, emissiveIntensity: 1.3}),
      neonR = K.mat(0xff3030, 0.3, 0, {emissive: 0xff2020, emissiveIntensity: 2.4});

    /* ---------- exterior skin: red brick, green tile stallriser on the front, cream stucco band at the top ---------- */
    const BAND = 3.35; // stucco from here up
    const skin = (ax, f, a0, a1, n, ops, front) => {
      ops = (ops || []).slice().sort((p, q) => p.c - q.c);
      const pc = (u0, u1, y0, y1) => {
        if (u1 - u0 < 0.04 || y1 - y0 < 0.02) return;
        const o = f + n * 0.165,
          u = (u0 + u1) / 2;
        const put = (ya, yb, mm) => {
          if (yb - ya < 0.02) return;
          const y = (ya + yb) / 2;
          if (ax) b.box(u1 - u0, yb - ya, 0.03, mm, [u, y, o], null, 0);
          else b.box(0.03, yb - ya, u1 - u0, mm, [o, y, u], null, 0);
        };
        if (front) put(y0, Math.min(y1, 0.9), tileM);
        put(Math.max(y0, front ? 0.9 : 0), Math.min(y1, BAND), brk);
        put(Math.max(y0, BAND), y1, stc);
      };
      let a = a0;
      for (const p of ops) {
        const hw = p.k === 'w' ? 0.75 : 0.65;
        pc(a, p.c - hw, 0, H);
        if (p.k === 'w') {
          pc(p.c - hw, p.c + hw, 0, 0.9);
          pc(p.c - hw, p.c + hw, 2.75, H);
        } else pc(p.c - hw, p.c + hw, 2.4, H);
        a = p.c + hw;
      }
      pc(a, a1, 0, H);
    };
    skin(1, Z1, X0 - 0.15, X1 + 0.15, 1, FRONT, true);
    skin(1, Z0, X0 - 0.15, X1 + 0.15, -1, BACK);
    skin(0, X0, Z0, Z1, -1, LEFT);
    skin(0, X1, Z0, Z1, 1, RIGHT);
    // band mouldings: a coping line where the brick meets the stucco, all round
    b.box(X1 - X0 + 0.42, 0.1, 0.1, cop, [0, BAND, Z1 + 0.2], null, 0.01);
    b.box(X1 - X0 + 0.42, 0.1, 0.1, cop, [0, BAND, Z0 - 0.2], null, 0.01);
    for (const sx of [X0 - 0.2, X1 + 0.2]) b.box(0.1, 0.1, Z1 - Z0 + 0.3, cop, [sx, BAND, (Z0 + Z1) / 2], null, 0.01);
    // shopfront frames: green painted timber round the windows, a red door surround
    for (const w of FRONT.filter(p => p.k === 'w')) {
      b.frame(1.56, 1.9, 0.07, grnP, [w.c, 1.825, Z1 + 0.19], 0.06);
      b.box(1.66, 0.06, 0.2, grnP, [w.c, 0.9, Z1 + 0.25], null, 0.01);
      b.box(0.04, 1.85, 0.04, grnP, [w.c, 1.825, Z1 + 0.2], null, 0); // glazing bar
    }
    b.frame(2.72, 2.5, 0.09, redP, [0, 1.25, Z1 + 0.19], 0.07);
    for (const [ws, fx, nx] of [
      [LEFT, X0, -1],
      [RIGHT, X1, 1]
    ])
      for (const w of ws) {
        b.box(0.18, 0.06, 1.62, cop, [fx + nx * 0.24, 0.9, w.c], null, 0.01);
        b.push([fx + nx * 0.19, 1.825, w.c], [0, PI / 2, 0]);
        b.frame(1.54, 1.9, 0.06, grnP, [0, 0, 0], 0.05);
        b.pop();
      }
    b.frame(1.4, 2.48, 0.06, steel, [-1.5, 1.24, Z0 - 0.19], 0.05);

    /* ---------- parapet, raised front centre for the letters, flat roof, oven chimney ---------- */
    const par = (ax, f, a0, a1, h) => {
      const L = a1 - a0,
        u = (a0 + a1) / 2;
      h = h || 0.7;
      if (ax) {
        b.box(L, h, 0.3, stc, [u, H + h / 2, f], null, 0);
        b.box(L + 0.1, 0.08, 0.42, cop, [u, H + h + 0.04, f], null, 0.01);
      } else {
        b.box(0.3, h, L, stc, [f, H + h / 2, u], null, 0);
        b.box(0.42, 0.08, L + 0.1, cop, [f, H + h + 0.04, u], null, 0.01);
      }
    };
    par(1, Z1, X0 - 0.15, -4.6);
    par(1, Z1, 4.6, X1 + 0.15);
    par(1, Z1, -4.6, 4.6, 1.9); // raised centre carrying PIZZABYTES
    par(1, Z0, X0 - 0.15, X1 + 0.15);
    par(0, X0, Z0, Z1);
    par(0, X1, Z0, Z1);
    // stepped shoulders either side of the raised centre
    for (const sx of [-1, 1]) {
      b.box(0.5, 1.3, 0.3, stc, [sx * 4.85, H + 0.65, Z1], null, 0);
      b.box(0.6, 0.08, 0.42, cop, [sx * 4.85, H + 1.34, Z1], null, 0.01);
    }
    b.box(X1 - X0, 0.12, Z1 - Z0, K.surf('concrete', 0x5a5a58), [0, H + 0.02, (Z0 + Z1) / 2], null, 0);
    b.box(X1 - X0 - 0.3, 0.02, Z1 - Z0 - 0.3, K.mat(0x3a3c40, 0.9), [0, H + 0.09, (Z0 + Z1) / 2], null, 0);
    // the wood-fired oven's brick chimney (over the oven, x ~7.25) and the kitchen extract
    b.box(0.9, 2.6, 0.9, brk, [7.25, H + 1.3, PZ + 0.8], null, 0);
    b.box(1.04, 0.12, 1.04, cop, [7.25, H + 2.62, PZ + 0.8], null, 0.01);
    b.cyl(0.18, 0.18, 0.5, dark, [7.25, H + 2.9, PZ + 0.8], null, 12);
    b.box(0.5, 0.06, 0.5, dark, [7.25, H + 3.18, PZ + 0.8], null, 0);
    rb(1.0, 0.7, 1.0, 0.03, K.mat(0xb0b4b8, 0.4, 0.7), [-2.0, H + 0.45, -7.0]);
    b.cyl(0.3, 0.3, 0.05, dark, [-2.0, H + 0.82, -7.0], null, 16);
    rb(1.6, 0.9, 1.0, 0.03, K.mat(0xa8acb0, 0.4, 0.7), [-6.6, H + 0.55, -10.6]); // cooler condenser
    for (const k of [-0.4, 0.4]) b.cyl(0.32, 0.32, 0.04, dark, [-6.6 + k, H + 1.02, -10.6], null, 16);

    /* ---------- the giant pizza slice on the roof: a tilted wedge on a steel frame ---------- */
    {
      const sx = 2.6,
        sz = 1.5,
        sy = H + 1.2;
      const cheese = K.mat(0xf2b830, 0.55),
        sauce = K.mat(0xc8402a, 0.6),
        crust = K.mat(0xc88a3e, 0.8),
        pep = K.mat(0xb01c1c, 0.5),
        basil = K.mat(0x2a6a2a, 0.6);
      // frame: two legs and a cross brace (the slice leans toward the street)
      for (const lx of [-1.0, 1.0]) {
        b.box(0.1, 1.4, 0.1, steel, [sx + lx, H + 0.75, sz - 0.3], null, 0);
        b.box(0.1, 0.9, 0.1, steel, [sx + lx, H + 0.5, sz - 1.1], null, 0);
      }
      b.box(2.1, 0.08, 0.08, steel, [sx, H + 0.6, sz - 0.3], null, 0);
      b.push([sx, sy + 1.6, sz], [-0.35, 0, PI]); // point down, tilted back
      const wedge = [
        [-1.6, -1.4],
        [1.6, -1.4],
        [0, 2.3]
      ];
      b.add(K.extrudeGeo(wedge, 0.16, 0.03), cheese, {p: [0, 0, -0.08]});
      b.add(K.extrudeGeo(wedge, 0.04, 0), sauce, {p: [0, 0, -0.12], s: [1.02, 1.02, 1]});
      b.cyl(0.24, 0.24, 3.3, crust, [0, -1.45, 0], [0, 0, PI / 2], 14);
      // pepperoni + basil on the street face
      for (const [px, py] of [
        [-0.7, -0.6],
        [0.6, -0.8],
        [0.0, 0.1],
        [-0.3, 1.0],
        [0.55, 0.45],
        [0.0, -1.0]
      ])
        b.cyl(0.24, 0.24, 0.04, pep, [px, py, 0.1], [PI / 2, 0, 0], 16);
      for (const [px, py] of [
        [-0.2, -0.4],
        [0.25, 0.9],
        [-0.85, -1.05]
      ])
        b.box(0.18, 0.12, 0.02, basil, [px, py, 0.11], [0, 0, 0.6], 0);
      // cheese drips off the edges
      for (const [px, py, l] of [
        [-1.02, -0.2, 0.4],
        [0.85, 0.25, 0.3],
        [-0.55, 1.1, 0.25]
      ])
        b.cyl(0.05, 0.03, l, cheese, [px, py, 0.02], [0, 0, 0.3], 8);
      b.pop();
      S(sx - 1.1, sx + 1.1, sz - 1.2, sz - 0.2, H, H + 1.5, true);
    }

    /* ---------- the PIZZABYTES letters on the raised parapet, the logo board under them ---------- */
    b.label(8.6, 1.3, letters('pb_letters', 'PIZZABYTES', '#ff3a30', 2048, 310), [0, H + 1.0, Z1 + 0.17]);
    b.box(8.9, 0.06, 0.18, dark, [0, H + 0.28, Z1 + 0.24], null, 0); // the letters' raceway
    // tagline board on the stucco band, over the awning
    b.label(
      9.2,
      0.62,
      board('pb_tag', 'STUFFED CRUST & FULL OF LUST!', null, CREAM, RED, 1536, 104, SCRIPT.replace('120px', '78px')),
      [0, 3.95, Z1 + 0.19]
    );
    b.box(9.36, 0.74, 0.04, redP, [0, 3.95, Z1 + 0.17], null, 0.01);
    // gooseneck lamps over the tagline
    for (const lx of [-3.6, -1.2, 1.2, 3.6]) {
      b.cyl(0.015, 0.015, 0.5, dark, [lx, 4.5, Z1 + 0.38], [PI / 2.6, 0, 0], 6);
      b.cyl(0.04, 0.11, 0.1, dark, [lx, 4.4, Z1 + 0.6], null, 12);
      b.cyl(0.1, 0.1, 0.01, warm, [lx, 4.35, Z1 + 0.6], null, 12);
    }
    // the logo painted big on the right side wall (facing the parking), a DELIVERY board by the back
    b.label(6.4, 2.4, logoMat('pb_logoW', 1024, 384), [X1 + 0.19, 2.0, -1.5], [0, PI / 2, 0]);
    b.label(
      2.0,
      0.6,
      board('pb_deliv', 'WE DELIVER', '30 MIN OR YOUR CORPSE IS FREE', RED, CREAM, 512, 150),
      [X1 + 0.19, 2.3, -7.2],
      [0, PI / 2, 0]
    );

    /* ---------- awning: green / white / red stripes over the whole shopfront ---------- */
    {
      const AX0 = X0 + 0.25,
        AX1 = X1 - 0.25,
        AW = AX1 - AX0,
        AYT = 3.3,
        AYB = 2.65,
        AD = 1.5;
      const slope = Math.atan2(AYT - AYB, AD),
        aLen = Math.hypot(AYT - AYB, AD);
      const awn = stripes('pb_awn', 48),
        val = stripes('pb_val', 48, true);
      b.box(AW, aLen, 0.03, awn, [0, (AYT + AYB) / 2, Z1 + 0.18 + AD / 2], [-(PI / 2 - slope), 0, 0], 0);
      b.label(AW, 0.36, val, [0, AYB - 0.17, Z1 + 0.19 + AD]);
      b.label(AW, 0.36, val, [0, AYB - 0.17, Z1 + 0.17 + AD], [0, PI, 0]);
      const cheek = [
        [0, AYT],
        [AD, AYB],
        [AD, AYB - 0.35],
        [0, AYB - 0.35]
      ];
      for (const ex of [AX0 + 0.015, AX1 - 0.015])
        b.add(K.extrudeGeo(cheek, 0.03, 0), K.mat(0x1f7a3a, 0.85), {p: [ex, 0, Z1 + 0.18], r: [0, -PI / 2, 0]});
      b.cyl(0.03, 0.03, AW, steel, [0, AYT - 0.05, Z1 + 0.22], [0, 0, PI / 2], 8);
      b.cyl(0.03, 0.03, AW, steel, [0, AYB + 0.02, Z1 + 0.16 + AD], [0, 0, PI / 2], 8);
      for (let ax = AX0 + 0.3; ax <= AX1 - 0.2; ax += 2.6)
        b.cyl(
          0.022,
          0.022,
          aLen,
          steel,
          [ax, (AYT + AYB) / 2 - 0.05, Z1 + 0.18 + AD / 2],
          [-(PI / 2 - slope), 0, 0],
          6
        );
    }
    // window decals: OPEN neon, hours, posters facing out
    b.label(0.9, 0.36, letters('pb_open', 'OPEN', '#ff3a30', 512, 200), [2.8, 2.2, Z1 + 0.13]);
    b.label(0.5, 0.36, board('pb_hours', 'OPEN 11-LATE', 'ALL YOU CAN EAT TUES', CREAM, INK, 256, 180), [
      -2.8,
      1.25,
      Z1 + 0.13
    ]);
    b.label(0.7, 0.9, poster('pb_pw1', 'HOT &|READY', 'like you, babe', RED, CREAM), [-6.8, 1.55, Z1 + 0.13]);
    b.label(0.7, 0.9, poster('pb_pw2', 'INSERT|COIN', 'GET A SLICE', INK, GOLD), [6.8, 1.55, Z1 + 0.13]);

    /* ---------- front apron: patio, walk to the doors, parking stalls ---------- */
    const pav = surf('pavers');
    b.box(9.0, 0.03, 6.8, pav, [-5.2, 0.03, Z1 + 3.6], null, 0); // patio (x -9.7..-0.7, z 6.7..13.5)
    b.box(2.6, 0.03, 15.9 - Z1, conc, [0.6, 0.03, (Z1 + 15.9) / 2], null, 0); // walk to the doors
    // stall lines and wheel stops (two stalls, x 2.3..9.7)
    const lineM = K.mat(0xf0eee6, 0.7);
    for (const lx of [2.3, 6.0, 9.7]) b.box(0.1, 0.01, 5.0, lineM, [lx, 0.03, 10.6], null, 0);
    for (const wx of [4.15, 7.85]) {
      b.box(1.6, 0.12, 0.2, conc, [wx, 0.06, 8.0], null, 0.02);
      S(wx - 0.8, wx + 0.8, 7.9, 8.1, 0, 0.12, true);
    }
    // planter boxes round the patio (gap to the walk at z 7.0..8.6)
    const planter = (x0, x1, z0, z1) => {
      const w = x1 - x0,
        d = z1 - z0;
      b.box(w, 0.55, d, woodD, [(x0 + x1) / 2, 0.275, (z0 + z1) / 2], null, 0.02);
      b.box(w - 0.1, 0.04, d - 0.1, soil, [(x0 + x1) / 2, 0.54, (z0 + z1) / 2], null, 0);
      const n = Math.max(1, Math.round(Math.max(w, d) / 0.7));
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5) / n;
        b.sph(
          0.28,
          i % 2 ? leaf : leaf2,
          [x0 + w * (w > d ? t : 0.5), 0.75, z0 + d * (w > d ? 0.5 : t)],
          [1, 0.8, 1],
          8
        );
      }
      S(x0, x1, z0, z1, 0, 0.6, true);
    };
    planter(-9.6, -0.9, 13.2, 13.6);
    planter(-1.3, -0.9, 8.8, 13.2);
    planter(-9.6, -9.2, 7.2, 13.2);
    // bistro tables with parasols
    const bistro = (x, z, umb) => {
      b.cyl(0.4, 0.4, 0.03, K.mat(0xf8f4ee, 0.6), [x, 0.75, z], null, 16);
      b.cyl(0.405, 0.405, 0.02, K.mat(0xc8202a, 0.6), [x, 0.735, z], null, 16);
      b.cyl(0.03, 0.03, 0.72, dark, [x, 0.37, z], null, 8);
      b.cyl(0.25, 0.25, 0.03, dark, [x, 0.02, z], null, 12);
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * PI * 2 + 0.4,
          cx = x + Math.cos(a) * 0.7,
          cz = z + Math.sin(a) * 0.7;
        b.cyl(0.2, 0.2, 0.03, K.mat(0x1f5a32, 0.5, 0.2), [cx, 0.46, cz], null, 12);
        for (let j = 0; j < 4; j++)
          b.cyl(
            0.012,
            0.012,
            0.46,
            dark,
            [cx + Math.cos(j * 1.57) * 0.14, 0.23, cz + Math.sin(j * 1.57) * 0.14],
            null,
            4
          );
        b.box(
          0.36,
          0.3,
          0.025,
          K.mat(0x1f5a32, 0.5, 0.2),
          [cx + Math.cos(a) * 0.17, 0.66, cz + Math.sin(a) * 0.17],
          [0, -a + PI / 2, 0],
          0
        );
      }
      S(x - 0.42, x + 0.42, z - 0.42, z + 0.42, 0, 0.78, true);
      if (umb) {
        b.cyl(0.025, 0.025, 2.4, white, [x, 1.2, z], null, 6);
        b.add(K.cylGeo(0.05, 1.3, 0.45, 8, true), K.mat(umb, 0.8, 0, {side: T.DoubleSide}), {p: [x, 2.3, z]});
        b.cyl(0.04, 0.04, 0.08, white, [x, 2.56, z], null, 6);
      }
    };
    bistro(-7.4, 8.9, 0xc8202a);
    bistro(-3.6, 8.9, 0x1f7a3a);
    bistro(-5.5, 11.6, 0xf6efe0);
    bistro(-2.7, 11.6, 0);
    // chalk A-board by the walk
    {
      const ax = 1.95,
        az = 9.6;
      const ch = menuMat('pb_aboard', 'TODAY', [
        ['Slice + Soda', '$5'],
        ['Stuffed Crust', 'XL'],
        ['Full of Lust', ';)'],
        ['Zombies eat', 'FREE*'],
        ['*as toppings', '']
      ]);
      for (const s of [-1, 1]) {
        b.push([ax, 0.5, az + s * 0.16], [-s * 0.18, s > 0 ? 0 : PI, 0]); // v090: tops lean in, faces out (was upside down, facing in)
        b.box(0.6, 1.0, 0.03, wood, [0, 0, 0], null, 0.005);
        b.label(0.5, 0.62, ch, [0, 0.05, 0.02]);
        b.pop();
      }
      S(ax - 0.32, ax + 0.32, az - 0.3, az + 0.3, 0, 1.0, true);
    }
    // the delivery scooter with its hot box (parked in the near stall)
    {
      const x = 3.3,
        z = 13.6,
        a = 0.35;
      const body = K.mat(0xc8202a, 0.35, 0.2);
      b.push([x, 0, z], [0, a, 0]);
      for (const wz of [-0.55, 0.6]) {
        b.cyl(0.22, 0.22, 0.1, K.rubber(), [0, 0.22, wz], [0, 0, PI / 2], 14);
        b.cyl(0.11, 0.11, 0.11, steel, [0, 0.22, wz], [0, 0, PI / 2], 10);
      }
      rb(0.36, 0.34, 0.9, 0.08, body, [0, 0.45, -0.1]); // body under the seat
      b.box(0.3, 0.06, 0.5, dark, [0, 0.66, -0.2], null, 0.02); // seat
      rb(0.32, 0.6, 0.18, 0.06, body, [0, 0.62, 0.48]); // leg shield
      b.cyl(0.025, 0.025, 0.5, steel, [0, 0.95, 0.52], [0.25, 0, 0], 6); // steering column
      b.cyl(0.02, 0.02, 0.6, dark, [0, 1.18, 0.56], [0, 0, PI / 2], 6); // handlebar
      b.sph(0.07, warm, [0, 1.08, 0.66], null, 8); // headlamp
      rb(0.5, 0.42, 0.46, 0.03, K.mat(0xf6efe0, 0.5), [0, 0.95, -0.55]); // the hot box
      b.label(0.44, 0.17, board('pb_hotbox', 'PIZZABYTES', null, RED, CREAM, 256, 96), [0, 1.0, -0.32]);
      b.pop();
      S(x - 0.5, x + 0.5, z - 0.85, z + 0.85, 0, 1.2, true);
    }
    // bins + a bench against the front wall, right of the doors
    rb(0.5, 0.95, 0.5, 0.05, K.mat(0x1f5a32, 0.5), [2.0, 0.48, Z1 + 0.65]);
    S(1.75, 2.25, Z1 + 0.4, Z1 + 0.9, 0, 0.95, true);
    b.box(1.8, 0.06, 0.45, wood, [5.0, 0.45, Z1 + 0.6], null, 0.01);
    b.box(1.8, 0.4, 0.05, wood, [5.0, 0.7, Z1 + 0.4], null, 0.01);
    for (const lx of [4.25, 5.75]) b.box(0.06, 0.45, 0.4, dark, [lx, 0.22, Z1 + 0.6], null, 0);
    S(4.1, 5.9, Z1 + 0.35, Z1 + 0.85, 0, 0.6, true);

    /* ---------- pole sign at the front right corner ---------- */
    {
      const px = 8.5,
        pz = 14.9;
      b.cyl(0.12, 0.14, 5.0, steel, [px, 2.5, pz], null, 10);
      b.cyl(0.35, 0.4, 0.3, conc, [px, 0.15, pz], null, 12);
      const lg = logoMat('pb_logoP', 1024, 512, {glow: 0.35});
      b.box(2.4, 1.3, 0.24, dark, [px - 0.3, 5.3, pz], null, 0.03);
      b.label(2.3, 1.2, lg, [px - 0.3, 5.3, pz + 0.125]);
      b.label(2.3, 1.2, lg, [px - 0.3, 5.3, pz - 0.125], [0, PI, 0]);
      S(px - 0.3, px + 0.3, pz - 0.3, pz + 0.3, 0, 5, true);
    }

    /* ---------- the yard behind: oven wood store, dumpster corner, grease drum, crates, board fences ---------- */
    {
      // lean-to log store against the left fence
      const lx0 = -9.8,
        lx1 = -7.4,
        lz0 = -17.4,
        lz1 = -13.4;
      for (const [px, pz] of [
        [lx1, lz0],
        [lx1, lz1]
      ])
        b.box(0.1, 2.0, 0.1, woodD, [px, 1.0, pz], null, 0);
      b.box(2.6, 0.04, 4.3, K.mat(0x5a5e62, 0.6, 0.5), [(lx0 + lx1) / 2, 2.15, (lz0 + lz1) / 2], [0, 0, 0.12], 0);
      const logM = K.mat(0x8a6a48, 0.85),
        endM = K.mat(0xc8a878, 0.8);
      for (let j = 0; j < 4; j++)
        for (let i = 0; i < 9; i++) {
          const zz = lz0 + 0.3 + i * 0.42,
            yy = 0.14 + j * 0.25;
          b.cyl(0.12, 0.12, 1.4, logM, [-8.7, yy, zz + (j % 2) * 0.2], [0, 0, PI / 2], 8);
          b.cyl(0.11, 0.11, 0.01, endM, [-8.0, yy, zz + (j % 2) * 0.2], [0, 0, PI / 2], 8);
        }
      S(lx0, lx1 + 0.05, lz0, lz1, 0, 2.2);
    }
    b.cyl(0.3, 0.3, 0.9, K.mat(0x2a4a8a, 0.5, 0.4), [1.2, 0.45, Z0 - 0.6], null, 16);
    b.cyl(0.31, 0.31, 0.04, K.mat(0x1a1a1a, 0.6), [1.2, 0.91, Z0 - 0.6], null, 16);
    S(0.9, 1.5, Z0 - 0.9, Z0 - 0.3, 0, 0.92, true);
    for (let i = 0; i < 3; i++)
      rb(0.42, 0.28, 0.32, 0.02, K.mat(0xc8202a, 0.6), [2.0, 0.14 + i * 0.29, Z0 - 0.5], [0, i * 0.2, 0]);
    S(1.7, 2.3, Z0 - 0.75, Z0 - 0.25, 0, 0.9, true);
    // a stack of flattened pizza boxes by the bins
    for (let i = 0; i < 6; i++)
      b.box(0.5, 0.04, 0.5, K.mat(0xc8a878, 0.85), [-4.6, 0.02 + i * 0.045, Z0 - 0.5], [0, i * 0.3, 0], 0);
    for (const [wx, col] of [
      [-3.6, 0x2a5a2a],
      [-2.9, 0x3a3c40]
    ]) {
      rb(0.6, 1.0, 0.7, 0.04, K.mat(col, 0.6), [wx, 0.52, Z0 - 0.55]);
      b.box(0.64, 0.05, 0.76, K.mat(col, 0.6), [wx, 1.04, Z0 - 0.58], [-0.1, 0, 0], 0);
      S(wx - 0.32, wx + 0.32, Z0 - 0.92, Z0 - 0.2, 0, 1.05, true);
    }
    const fence = surf('fence');
    for (const fx of [-9.9, 9.9]) {
      b.box(0.06, 1.8, 18 + Z0 + 0.6, fence, [fx, 0.9, (-18 + Z0 + 0.6) / 2], null, 0);
      S(fx - 0.05, fx + 0.05, -18, Z0 + 0.6, 0, 1.8, true);
    }

    /* ---------- sidewalk: street lights, meter, hydrant, no parking ---------- */
    LK.lightPole(b, S, -7);
    LK.lightPole(b, S, 6.5);
    LK.hydrant(b, S, -3.0);
    LK.meter(b, S, 4.2);
    LK.noParking(b, -9.3, {key: 'pb_np1'});

    /* ---------- interior: floors, linings, ceilings, lights ---------- */
    const terra = surf('terra'),
      quarry = surf('quarry'),
      tileW = surf('tile'),
      chkT = surf('chkTile'),
      ging = surf('gingham'),
      plaster = K.mat(0xf2e6cc, 0.85),
      railM = K.mat(0x5a3a22, 0.6),
      stainless = K.brushed ? K.brushed(0xc4c8cc) : steel,
      black = K.mat(0x141416, 0.45, 0.4),
      por = K.mat(0xf6f6f2, 0.15, 0.05),
      oak = K.mat(0x9a7048, 0.6);
    const flr = (x0, x1, z0, z1, m) => b.box(x1 - x0, 0.02, z1 - z0, m, [(x0 + x1) / 2, 0.035, (z0 + z1) / 2], null, 0);
    const IN = 0.15,
      p = 0.075; // half a partition
    flr(X0 + IN, X1 - IN, CZ - 0.7, Z1 - IN, terra); // dining
    flr(X0 + IN, CX0, PZ + p, CZ - 0.7, terra); // passage to the toilet and staff door
    flr(CX0, X1 - IN, PZ + p, CZ - 0.7, quarry); // behind the counter
    flr(TX - p, X1 - IN, OZ + p, PZ - p, quarry); // kitchen
    flr(X0 + IN, OX - p, Z0 + IN, OZ + p, quarry);
    flr(X0 + IN, TX - p, TZ + p, PZ - p, tileW); // toilet
    flr(OX + p, X1 - IN, Z0 + IN, OZ - p, oak); // office
    const dinSpan = (pc, u0, u1, y0, y1) => {
      if (y0 < 1.1) pc(u0, u1, y0, Math.min(y1, 1.1), chkT, 0.014, 0.007);
      if (y1 > 1.18) pc(u0, u1, Math.max(y0, 1.18), y1, plaster, 0.012, 0.006);
      if (y0 < 1.18 && y1 > 1.1) pc(u0, u1, 1.1, 1.18, railM, 0.04, 0.02);
      if (y0 <= 0 && y1 > 0.2) pc(u0, u1, 0, 0.1, railM, 0.03, 0.015);
    };
    const tileSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, Math.min(y1, 2.0), tileW, 0.012, 0.006);
      if (y1 > 2.0) pc(u0, u1, Math.max(y0, 2.0), y1, white, 0.012, 0.006);
      if (y0 < 1.25 && y1 > 1.2) pc(u0, u1, 1.2, 1.25, redP, 0.02, 0.01);
    };
    const offSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, y1, K.mat(0xd8d0b8, 0.85), 0.012, 0.006);
      if (y0 <= 0 && y1 > 0.2) pc(u0, u1, 0, 0.1, railM, 0.03, 0.015);
    };
    const inR = (ops, a0, a1) => ops.filter(o => o.c > a0 && o.c < a1);
    // dining room (and the strip behind the counter, same lining)
    LK.lineWall(b, 1, Z1, X0 + IN, X1 - IN, -1, FRONT, CEIL, dinSpan);
    LK.lineWall(b, 0, X0, PZ + p, Z1 - IN, 1, inR(LEFT, PZ, Z1), CEIL, dinSpan);
    LK.lineWall(b, 0, X1, PZ + p, Z1 - IN, -1, inR(RIGHT, PZ, Z1), CEIL, dinSpan);
    LK.lineWall(b, 1, PZ - p, X0 + IN, X1 - IN, 1, PART, CEIL, dinSpan);
    // toilet
    const WCH = 2.7;
    LK.lineWall(b, 1, PZ + p, X0 + IN, TX - p, -1, inR(PART, X0, TX), WCH, tileSpan);
    LK.lineWall(b, 0, TX + p, TZ + p, PZ - p, -1, [], WCH, tileSpan);
    LK.lineWall(b, 1, TZ - p, X0 + IN, TX - p, 1, [], WCH, tileSpan);
    LK.lineWall(b, 0, X0, TZ + p, PZ - p, 1, [], WCH, tileSpan);
    // kitchen
    const KC = 3.0;
    LK.lineWall(b, 1, PZ + p, TX - p, X1 - IN, -1, inR(PART, TX, X1), KC, tileSpan);
    LK.lineWall(b, 0, TX - p, TZ - p, PZ - p, 1, [], KC, tileSpan);
    LK.lineWall(b, 1, TZ + p, X0 + IN, TX + p, -1, [], KC, tileSpan);
    LK.lineWall(b, 0, X0, Z0 + IN, TZ - p, 1, [], KC, tileSpan);
    LK.lineWall(b, 1, Z0, X0 + IN, OX - p, 1, BACK, KC, tileSpan);
    LK.lineWall(b, 0, OX + p, Z0 + IN, OZ + p, -1, [], KC, tileSpan);
    LK.lineWall(b, 1, OZ - p, OX - p, X1 - IN, 1, OFF, KC, tileSpan);
    LK.lineWall(b, 0, X1, OZ - p, PZ - p, -1, inR(RIGHT, OZ, PZ), KC, tileSpan);
    // office
    LK.lineWall(b, 0, OX - p, Z0 + IN, OZ - p, 1, [], KC, offSpan);
    LK.lineWall(b, 1, OZ + p, OX + p, X1 - IN, -1, OFF, KC, offSpan);
    LK.lineWall(b, 0, X1, Z0 + IN, OZ - p, -1, inR(RIGHT, Z0, OZ), KC, offSpan);
    LK.lineWall(b, 1, Z0, OX + p, X1 - IN, 1, [], KC, offSpan);
    // ceilings: cream over the dining room with a dark beam grid, white tiles over the back of house
    b.box(X1 - X0 - 0.3, 0.04, Z1 - PZ - 0.2, K.mat(0xf4ecd8, 0.85), [0, CEIL + 0.02, (PZ + Z1) / 2], null, 0);
    for (const bz of [-1.0, 1.6, 4.2]) b.box(X1 - X0 - 0.3, 0.18, 0.16, woodD, [0, CEIL - 0.09, bz], null, 0.01);
    for (const bx of [-4.2, 0, 4.2])
      b.box(0.16, 0.18, Z1 - PZ - 0.3, woodD, [bx, CEIL - 0.09, (PZ + Z1) / 2], null, 0.01);
    b.box(X1 - X0 - 0.3, 0.04, PZ - Z0 - 0.2, white, [0, KC + 0.02, (Z0 + PZ) / 2], null, 0);
    // red enamel cone pendants over the tables and the counter
    const enamel = K.mat(0xc8202a, 0.35, 0.2);
    const pendant = (px, pz, drop) => {
      b.cyl(0.006, 0.006, drop, dark, [px, CEIL - drop / 2, pz], null, 4);
      b.cyl(0.05, 0.26, 0.24, enamel, [px, CEIL - drop - 0.1, pz], null, 16, true);
      b.cyl(0.05, 0.05, 0.04, dark, [px, CEIL - drop + 0.03, pz], null, 10);
      b.sph(0.08, warm, [px, CEIL - drop - 0.17, pz], null, 10);
    };
    for (const [px, pz] of [
      [-4.4, 1.4],
      [-4.2, 4.4],
      [3.6, 1.4],
      [4.2, 4.4],
      [-7.7, 0.53],
      [-7.7, 2.39],
      [-7.7, 4.25]
    ])
      pendant(px, pz, 1.0);
    for (const px of [-0.6, 2.4, 5.4]) pendant(px, CZ - 0.35, 0.6);
    // fluorescent battens over the kitchen, ceiling lights in the toilet and office
    const tube = K.mat(0xffffff, 0.4, 0, {emissive: 0xf6f8ff, emissiveIntensity: 1.0});
    for (const [lx, lz] of [
      [-2.0, -5.0],
      [1.5, -5.0],
      [-2.0, -9.0],
      [1.5, -9.0],
      [-6.8, -7.6]
    ]) {
      b.box(1.3, 0.06, 0.16, white, [lx, KC - 0.04, lz], null, 0);
      b.box(1.2, 0.03, 0.08, tube, [lx, KC - 0.08, lz], null, 0);
    }
    b.cyl(0.16, 0.16, 0.04, tube, [-6.7, KC - 0.02, -4.6], null, 14);
    b.box(0.6, 0.04, 0.6, tube, [6.4, KC - 0.01, -10.2], null, 0);

    /* ---------- the order counter: red front with the logo, oak top, heated slice case, till ---------- */
    {
      const CB = CZ - 0.7, // back face
        L = X1 - IN - CX0,
        cx = (CX0 + X1 - IN) / 2;
      b.box(L, 1.0, 0.66, redP, [cx, 0.5, (CZ + CB) / 2], null, 0.01);
      b.box(L + 0.06, 0.06, 0.78, oak, [cx, 1.03, (CZ + CB) / 2 + 0.03], null, 0.01);
      b.box(L, 0.1, 0.04, black, [cx, 0.05, CZ + 0.01], null, 0); // kick
      b.box(0.68, 1.0, 0.66, redP, [CX0 + 0.34, 0.5, (CZ + CB) / 2], null, 0.01);
      // front panels: chequer band and logo plaques
      b.box(L, 0.16, 0.012, chkT, [cx, 0.86, CZ + 0.006], null, 0);
      const plaque = logoMat('pb_logoC', 768, 288);
      for (const lx of [-0.6, 3.4]) b.label(1.8, 0.66, plaque, [lx, 0.45, CZ + 0.012]);
      S(CX0, X1 - IN, CB, CZ, 0, 1.06);
      // heated slice case: glass box on the counter, lit, two shelves of whole pies and slices
      const gx = 2.6,
        gw = 2.4;
      const glass = K.glass ? K.glass(0xdde8ee, 0.25) : white;
      b.box(gw, 0.06, 0.62, stainless, [gx, 1.09, (CZ + CB) / 2], null, 0.01);
      b.box(gw, 0.04, 0.62, stainless, [gx, 1.76, (CZ + CB) / 2], null, 0.01);
      b.box(gw - 0.04, 0.62, 0.01, glass, [gx, 1.43, CZ - 0.04], [0.15, 0, 0], 0);
      for (const ex of [gx - gw / 2, gx + gw / 2]) b.box(0.02, 0.66, 0.6, glass, [ex, 1.43, (CZ + CB) / 2], null, 0);
      b.box(
        gw - 0.1,
        0.02,
        0.5,
        K.mat(0xfff0c0, 0.4, 0, {emissive: 0xffb860, emissiveIntensity: 0.9}),
        [gx, 1.73, (CZ + CB) / 2],
        null,
        0
      );
      b.box(gw - 0.06, 0.015, 0.56, stainless, [gx, 1.42, (CZ + CB) / 2], null, 0);
      const cheese = K.mat(0xf2b830, 0.5),
        crust = K.mat(0xc88a3e, 0.8),
        pepM = K.mat(0xb01c1c, 0.5),
        grn = K.mat(0x2a7a2a, 0.6);
      const pie = (x, y, z, r, tops) => {
        b.cyl(r, r, 0.01, stainless, [x, y, z], null, 18);
        b.cyl(r - 0.01, r - 0.01, 0.03, crust, [x, y + 0.02, z], null, 18);
        b.cyl(r - 0.03, r - 0.03, 0.012, cheese, [x, y + 0.04, z], null, 18);
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * PI * 2 + x,
            rr = r * (i % 2 ? 0.55 : 0.3);
          b.cyl(0.025, 0.025, 0.008, tops, [x + Math.cos(a) * rr, y + 0.048, z + Math.sin(a) * rr], null, 10);
        }
      };
      pie(gx - 0.8, 1.12, (CZ + CB) / 2, 0.24, pepM);
      pie(gx, 1.12, (CZ + CB) / 2, 0.24, grn);
      pie(gx + 0.8, 1.12, (CZ + CB) / 2, 0.24, pepM);
      // slices on the upper shelf
      const wedge = [
        [-0.09, 0],
        [0.09, 0],
        [0, 0.2]
      ];
      for (let i = 0; i < 7; i++) {
        const sx = gx - 0.95 + i * 0.32;
        b.add(K.extrudeGeo(wedge, 0.02, 0.005), cheese, {
          p: [sx, 1.44, (CZ + CB) / 2 - 0.1],
          r: [-PI / 2, 0, (i % 2) * PI]
        });
        b.cyl(0.02, 0.02, 0.18, crust, [sx, 1.445, (CZ + CB) / 2 + (i % 2 ? -0.1 + 0.2 : -0.1)], [0, 0, PI / 2], 6);
      }
      // napkins, straws, a tip jar, the order bell
      rb(0.12, 0.14, 0.1, 0.01, chrome, [0.4, 1.13, CB + 0.2]);
      b.cyl(0.04, 0.04, 0.2, K.glass ? K.glass(0xffffff, 0.4) : white, [0.65, 1.16, CB + 0.18], null, 8);
      b.cyl(0.06, 0.05, 0.14, K.glass ? K.glass(0xffffff, 0.4) : white, [5.0, 1.13, CB + 0.35], null, 10);
      b.label(0.1, 0.05, board('pb_tips', 'TIPS', null, CREAM, RED, 128, 64), [5.0, 1.13, CB + 0.415]);
      b.sph(0.05, chrome, [5.6, 1.08, CB + 0.35], [1, 0.6, 1], 10);
      // menu boards hanging over the counter
      MENUS.forEach(([title, items], i) => {
        const mx = -0.6 + i * 3.0;
        b.label(1.0, 1.25, menuMat('pb_menu' + i, title, items), [mx, 2.45, CZ - 0.3]);
        b.box(1.06, 1.31, 0.03, woodD, [mx, 2.45, CZ - 0.32], null, 0.005);
        for (const s of [-0.4, 0.4]) b.cyl(0.004, 0.004, 0.13, dark, [mx + s, CEIL - 0.06, CZ - 0.32], null, 4);
      });
    }

    /* ---------- the wood-fired oven: brick plinth, mosaic dome, mouth toward the make line, flue ---------- */
    {
      const ox = 7.15,
        oz = (PZ + p + CZ - 0.7) / 2 - 0.05;
      const mos = surf('mosaic'),
        soot = K.mat(0x141210, 0.95),
        ember = K.mat(0xff8a30, 0.6, 0, {emissive: 0xff5a10, emissiveIntensity: 2.2});
      b.box(1.95, 1.0, 1.42, brk, [ox, 0.5, oz], null, 0.01);
      b.box(2.0, 0.08, 1.46, cop, [ox, 1.04, oz], null, 0.01);
      // wood store niche in the plinth
      b.box(0.04, 0.5, 1.0, soot, [ox - 0.98, 0.45, oz], null, 0);
      for (let i = 0; i < 5; i++)
        b.cyl(
          0.06,
          0.06,
          0.9,
          K.mat(0x8a6a48, 0.85),
          [ox - 0.85, 0.3 + (i % 2) * 0.12, oz - 0.3 + i * 0.15],
          [PI / 2, 0, 0],
          6
        );
      // the dome (half sphere, mosaic) on the hearth
      b.add(K.sphGeo(0.78, 24, 12, 0, PI / 2), mos, {p: [ox + 0.1, 1.08, oz], s: [1, 0.85, 0.88]});
      // the arched mouth facing -x: a soot arch and a glow of embers
      b.push([ox - 0.66, 1.08, oz], [0, -PI / 2, 0]);
      b.add(
        K.extrudeGeo(
          [
            [-0.3, 0],
            [0.3, 0],
            [0.3, 0.22],
            [0.2, 0.34],
            [0, 0.39],
            [-0.2, 0.34],
            [-0.3, 0.22]
          ],
          0.08,
          0.01
        ),
        brk,
        {p: [0, 0, -0.04], s: [1.25, 1.2, 1]}
      );
      b.add(
        K.extrudeGeo(
          [
            [-0.26, 0],
            [0.26, 0],
            [0.26, 0.2],
            [0.17, 0.3],
            [0, 0.34],
            [-0.17, 0.3],
            [-0.26, 0.2]
          ],
          0.02,
          0
        ),
        soot,
        {p: [0, 0.01, 0.05]}
      );
      b.box(0.36, 0.06, 0.01, ember, [0, 0.05, 0.07], null, 0);
      b.pop();
      b.box(0.4, 0.04, 0.5, cop, [ox - 0.78, 1.06, oz], null, 0.01); // landing ledge
      // the PB letters on the dome, the flue up through the ceiling
      b.label(
        0.7,
        0.28,
        board('pb_ovenPB', 'PIZZABYTES', null, '#3a2a20', GOLD, 256, 96),
        [ox - 0.2, 1.62, oz + 0.62],
        [-0.3, 0, 0]
      );
      b.cyl(0.14, 0.18, CEIL - 1.6, stainless, [ox + 0.1, 1.6 + (CEIL - 1.6) / 2, oz], null, 14);
      S(ox - 0.98, ox + 0.98, oz - 0.72, oz + 0.72, 0, 1.75);
      // peels on a wall rack beside the oven, a fire brush, a stack of wood
      for (let i = 0; i < 3; i++) {
        const py = 1.5,
          pzz = PZ + p + 0.06;
        b.cyl(0.015, 0.015, 1.3, wood, [5.2 + i * 0.32, py + 0.2, pzz + 0.02], null, 6);
        b.cyl(0.16, 0.16, 0.01, i === 1 ? stainless : wood, [5.2 + i * 0.32, py - 0.6, pzz + 0.03], [PI / 2, 0, 0], 16);
      }
      b.box(1.2, 0.04, 0.08, woodD, [5.52, 2.2, PZ + p + 0.05], null, 0);
    }

    /* ---------- the make line: refrigerated topping rail, cutting board, heat lamp shelf ---------- */
    {
      const mx0 = -1.6,
        mx1 = 2.4,
        mz = PZ + p + 0.36,
        mw = mx1 - mx0,
        mcx = (mx0 + mx1) / 2;
      b.box(mw, 0.86, 0.7, stainless, [mcx, 0.43, mz], null, 0.01);
      for (let i = 0; i < 4; i++)
        b.box(
          mw / 4 - 0.06,
          0.7,
          0.01,
          K.mat(0xb8bcc0, 0.35, 0.7),
          [mx0 + (i + 0.5) * (mw / 4), 0.45, mz + 0.355],
          null,
          0.004
        );
      b.box(mw, 0.05, 0.7, stainless, [mcx, 0.9, mz], null, 0.01);
      // topping wells along the back
      const TOPS = [0xc8402a, 0xf2e6b0, 0xb01c1c, 0x3a6a2a, 0x2a2a2a, 0xe8c040, 0x8a5a3a, 0xf6f0e0, 0xd86a2a, 0x5a8a3a];
      TOPS.forEach((col, i) => {
        const tx = mx0 + 0.22 + i * 0.36;
        b.box(0.32, 0.06, 0.22, stainless, [tx, 0.95, mz - 0.2], null, 0.004);
        b.box(0.28, 0.02, 0.18, K.mat(col, 0.7), [tx, 0.975, mz - 0.2], null, 0);
      });
      b.box(mw, 0.3, 0.04, stainless, [mcx, 1.08, mz - 0.33], null, 0); // sneeze guard back
      b.box(mw - 0.2, 0.03, 0.42, K.mat(0xf4f0e6, 0.6), [mcx, 0.94, mz + 0.1], null, 0.005); // cutting board
      // a pizza in progress and a pizza cutter
      b.cyl(0.2, 0.2, 0.02, K.mat(0xe8d0a0, 0.8), [0.2, 0.97, mz + 0.1], null, 18);
      b.cyl(0.17, 0.17, 0.008, K.mat(0xc8402a, 0.6), [0.2, 0.983, mz + 0.1], null, 18);
      b.cyl(0.05, 0.05, 0.008, chrome, [1.0, 0.965, mz + 0.18], [PI / 2, 0, 0], 12);
      S(mx0, mx1, PZ + p, mz + 0.36, 0, 1.2);
      // heat lamp shelf over the line, pizza boxes stacked on it
      b.box(mw, 0.04, 0.4, stainless, [mcx, 2.0, PZ + p + 0.2], null, 0.005);
      for (const lx of [-1.0, 0.2, 1.4])
        b.box(
          0.6,
          0.06,
          0.12,
          K.mat(0xffc080, 0.4, 0, {emissive: 0xff6020, emissiveIntensity: 1.5}),
          [lx, 1.96, PZ + p + 0.25],
          null,
          0
        );
      for (let i = 0; i < 8; i++)
        b.box(
          0.42,
          0.05,
          0.42,
          K.mat(i % 3 ? 0xf2ead8 : 0xd8c8a8, 0.8),
          [-1.2 + (i > 3 ? 1.4 : 0), 2.05 + (i % 4) * 0.055, PZ + p + 0.22],
          [0, (i % 2) * 0.05, 0],
          0.005
        );
    }

    /* ---------- dining: booths along the left wall ---------- */
    const vinyl = K.mat(0xb81c26, 0.4),
      woodT = K.mat(0x6a4428, 0.55);
    const BX = X0 + IN; // inner face of the left wall
    const booth = (cz, face) => {
      // a bench running out from the wall, seat facing +z (face 1) or -z (face -1)
      const L = 1.25,
        cx = BX + L / 2;
      b.box(L, 0.42, 0.55, woodD, [cx, 0.21, cz], null, 0.02);
      rb(L - 0.04, 0.12, 0.5, 0.04, vinyl, [cx, 0.48, cz + face * 0.02]);
      b.push([cx, 0.9, cz - face * 0.2], [face * 0.08, 0, 0]);
      rb(L - 0.04, 0.75, 0.14, 0.05, vinyl, [0, 0, 0]);
      b.pop();
      b.box(L, 0.05, 0.18, woodD, [cx, 1.3, cz - face * 0.22], null, 0.01);
      S(BX, BX + L, cz - 0.28, cz + 0.28, 0, 1.3);
    };
    const btable = cz => {
      const cx = BX + 0.6;
      b.box(1.15, 0.04, 0.74, woodT, [cx, 0.76, cz], null, 0.01);
      b.box(1.12, 0.005, 0.7, ging, [cx, 0.785, cz], null, 0);
      b.cyl(0.04, 0.04, 0.72, black, [cx + 0.2, 0.37, cz], null, 10);
      b.cyl(0.22, 0.24, 0.03, black, [cx + 0.2, 0.02, cz], null, 14);
      // shakers: chilli flakes, parmesan, oregano
      for (const [k, col] of [
        [-0.05, 0xc8402a],
        [0.05, 0xf2ead8],
        [0.15, 0x5a7a3a]
      ])
        b.cyl(0.025, 0.025, 0.1, K.mat(col, 0.5), [BX + 0.15, 0.84, cz + k], null, 8);
      S(BX, BX + 1.2, cz - 0.38, cz + 0.38, 0, 0.8, true);
    };
    for (let i = 0; i < 3; i++) {
      const z0 = -0.4 + i * 1.86;
      booth(z0 + 0.275, 1);
      btable(z0 + 0.93);
      booth(z0 + 1.585, -1);
    }

    /* ---------- dining: gingham four-tops with bentwood chairs ---------- */
    const chair = (x, z, a) => {
      b.push([x, 0, z], [0, a, 0]);
      b.cyl(0.2, 0.2, 0.04, woodT, [0, 0.46, 0], null, 14);
      for (const [lx, lz] of [
        [-0.14, -0.14],
        [0.14, -0.14],
        [-0.14, 0.14],
        [0.14, 0.14]
      ])
        b.cyl(0.014, 0.012, 0.46, woodD, [lx, 0.23, lz], null, 6);
      b.cyl(0.13, 0.13, 0.01, woodD, [0, 0.16, 0], null, 12); // leg ring
      b.tor(0.18, 0.014, woodD, [0, 0.82, -0.17], [0.1, 0, 0], PI, 12); // bentwood hoop back
      for (const lx of [-0.18, 0.18]) b.cyl(0.014, 0.014, 0.36, woodD, [lx, 0.64, -0.17], null, 6);
      b.pop();
    };
    const table4 = (x, z) => {
      b.box(0.9, 0.04, 0.9, woodT, [x, 0.75, z], null, 0.01);
      b.box(0.98, 0.006, 0.98, ging, [x, 0.773, z], null, 0);
      for (const s of [-1, 1]) {
        b.box(0.98, 0.18, 0.006, ging, [x, 0.68, z + s * 0.49], null, 0);
        b.box(0.006, 0.18, 0.98, ging, [x + s * 0.49, 0.68, z], null, 0);
      }
      b.cyl(0.04, 0.04, 0.72, black, [x, 0.37, z], null, 10);
      b.cyl(0.24, 0.26, 0.03, black, [x, 0.02, z], null, 14);
      // a candle in a chianti bottle, a napkin holder
      b.cyl(0.05, 0.07, 0.16, K.mat(0x2a4a2a, 0.3, 0.1), [x, 0.86, z], null, 10);
      b.cyl(0.07, 0.07, 0.07, K.mat(0xc8a060, 0.85), [x, 0.81, z], null, 10);
      b.cyl(0.012, 0.012, 0.1, white, [x, 0.99, z], null, 6);
      S(x - 0.5, x + 0.5, z - 0.5, z + 0.5, 0, 0.78, true);
      chair(x, z - 0.68, 0);
      chair(x, z + 0.68, PI);
      chair(x - 0.68, z, PI / 2);
      chair(x + 0.68, z, -PI / 2);
    };
    table4(-4.4, 1.4);
    table4(-4.2, 4.4);
    table4(3.6, 1.4);
    table4(4.2, 4.4);
    // a high table for two by the front windows, left of the doors
    {
      const hx = -2.4,
        hz = Z1 - IN - 0.4;
      b.box(1.4, 0.04, 0.4, woodT, [hx, 1.05, hz], null, 0.01);
      for (const s of [-0.6, 0.6]) b.box(0.05, 1.05, 0.3, black, [hx + s, 0.525, hz], null, 0);
      for (const s of [-0.35, 0.35]) {
        b.cyl(0.17, 0.17, 0.05, vinyl, [hx + s, 0.76, hz - 0.5], null, 12);
        b.cyl(0.025, 0.025, 0.74, chrome, [hx + s, 0.37, hz - 0.5], null, 8);
        b.cyl(0.18, 0.18, 0.02, chrome, [hx + s, 0.01, hz - 0.5], null, 12);
      }
      S(hx - 0.72, hx + 0.72, hz - 0.22, hz + 0.22, 0, 1.07, true);
    }

    /* ---------- the "bytes": two arcade cabinets on the right wall ---------- */
    const arcadeArt = (key, title, col) =>
      K.paint(
        key,
        256,
        256,
        (c, W, H) => {
          c.fillStyle = '#05060a';
          c.fillRect(0, 0, W, H);
          P.text(c, title, W / 2, 26, {size: 20, weight: 'bold', font: PIX, col, max: W - 20});
          for (let j = 0; j < 4; j++)
            for (let i = 0; i < 7; i++) {
              c.fillStyle = ['#ff4040', '#40ff80', '#4080ff', '#ffd040'][j];
              c.fillRect(24 + i * 30, 56 + j * 24, 18, 12);
            }
          pixelSlice(c, W / 2 - 24, 170, 4);
          P.text(c, 'HI 99999', W / 2, H - 20, {size: 14, font: PIX, col: '#ffffff'});
        },
        {glow: 0.9}
      );
    const arcade = (az, title, body) => {
      const ax = X1 - IN - 0.4;
      b.push([ax, 0, az], [0, -PI / 2, 0]);
      const bm = K.mat(body, 0.4, 0.1);
      b.box(0.7, 1.1, 0.75, bm, [0, 0.55, 0], null, 0.02);
      b.box(0.7, 0.75, 0.45, bm, [0, 1.47, -0.15], null, 0.02);
      b.box(0.64, 0.5, 0.02, K.mat(0x05060a, 0.2), [0, 1.42, 0.08], [-0.25, 0, 0], 0);
      b.label(0.56, 0.44, arcadeArt('pb_arc' + title, title, '#ffd040'), [0, 1.42, 0.095], [-0.25, 0, 0]);
      b.box(0.7, 0.2, 0.36, bm, [0, 1.95, -0.1], null, 0.01);
      b.label(0.62, 0.14, letters('pb_marq' + title, title, '#40c8ff', 512, 112), [0, 1.95, 0.085]);
      b.box(0.7, 0.06, 0.32, K.mat(0x1a1a1a, 0.4), [0, 1.12, 0.22], [0.2, 0, 0], 0.01); // control panel
      b.cyl(0.012, 0.012, 0.08, dark, [-0.15, 1.18, 0.24], null, 6);
      b.sph(0.025, K.mat(0xd82020, 0.3), [-0.15, 1.23, 0.24], null, 8);
      for (let i = 0; i < 3; i++)
        b.cyl(
          0.025,
          0.025,
          0.02,
          K.mat([0xd8d020, 0x2080d8, 0x20c840][i], 0.3),
          [0.05 + i * 0.08, 1.16, 0.24],
          null,
          10
        );
      b.box(0.12, 0.08, 0.01, K.mat(0xc8a020, 0.3, 0.8), [0, 0.7, 0.381], null, 0); // coin door
      b.pop();
      S(ax - 0.4, ax + 0.4, az - 0.36, az + 0.36, 0, 2.05);
    };
    arcade(2.35, 'CRUST BUSTER', 0x2a2a6a);
    arcade(3.25, 'PEPPERONI PANIC', 0x8a1a1a);

    /* ---------- dining walls: posters, the neon slogan, a framed photo wall ---------- */
    POSTERS.forEach(([a, s2, bg, fg], i) => {
      const pm = poster('pb_post' + i, a, s2, bg, fg);
      if (i < 3) {
        // left wall, over the booths
        const pz = [1.3, 3.5, 5.85][i];
        b.box(0.02, 0.86, 0.66, woodD, [BX + 0.01, 2.1, pz], null, 0);
        b.label(0.6, 0.8, pm, [BX + 0.025, 2.1, pz], [0, PI / 2, 0]);
      } else {
        // partition between the doors, beside the make line; the last one on the right wall by the counter
        if (i < 5) {
          const px = [-5.3, -2.0][i - 3];
          b.box(0.66, 0.86, 0.02, woodD, [px, 2.2, PZ + p + 0.01], null, 0);
          b.label(0.6, 0.8, pm, [px, 2.2, PZ + p + 0.025]);
        } else {
          b.box(0.02, 0.86, 0.66, woodD, [X1 - IN - 0.01, 2.1, -0.2], null, 0);
          b.label(0.6, 0.8, pm, [X1 - IN - 0.025, 2.1, -0.2], [0, -PI / 2, 0]);
        }
      }
    });
    b.label(
      2.6,
      0.4,
      letters('pb_neonIn', 'FULL OF LUST', '#ff5ad0', 1024, 160),
      [-4.3, 2.98, Z1 - IN - 0.03],
      [0, PI, 0]
    );
    b.label(0.5, 0.3, board('pb_wcSign', 'RESTROOM', null, INK, GOLD, 256, 150), [-7.0, 2.65, PZ + p + 0.02]);
    b.label(0.6, 0.3, board('pb_staffSign', 'STAFF ONLY', null, RED, CREAM, 256, 128), [-3.6, 2.65, PZ + p + 0.02]);

    /* ---------- kitchen: conveyor oven, dough mixer, proofing rack, fryer, pizza box stacks ---------- */
    {
      // conveyor oven on a stand along the partition (x -1.4..1.8)
      const cx = 0.2,
        cz = PZ - p - 0.55;
      b.box(1.8, 0.62, 0.95, stainless, [cx, 1.31, cz], null, 0.02);
      b.box(3.2, 0.06, 0.6, K.mat(0x4a4c50, 0.5, 0.6), [cx, 1.08, cz + 0.1], null, 0); // conveyor belt
      for (let i = 0; i < 16; i++) b.box(0.02, 0.065, 0.6, steel, [cx - 1.5 + i * 0.2, 1.085, cz + 0.1], null, 0);
      b.box(1.6, 0.12, 0.02, K.mat(0x101010, 0.4), [cx, 1.18, cz + 0.48], null, 0); // the tunnel mouth
      b.box(0.3, 0.3, 0.02, K.mat(0x20262a, 0.3, 0.3), [cx + 0.7, 1.45, cz + 0.48], null, 0); // controls
      for (let i = 0; i < 3; i++)
        b.cyl(0.025, 0.025, 0.02, red(i), [cx + 0.62 + i * 0.08, 1.45, cz + 0.49], [PI / 2, 0, 0], 8);
      for (const lx of [-0.8, 0.8])
        for (const lz of [-0.4, 0.4]) b.cyl(0.03, 0.03, 1.0, steel, [cx + lx, 0.5, cz + lz], null, 8);
      b.box(1.7, 0.03, 0.85, steel, [cx, 0.3, cz], null, 0);
      b.box(1.9, 0.5, 1.05, stainless, [cx, 2.65, cz - 0.05], null, 0.01); // hood
      S(cx - 1.6, cx + 1.6, cz - 0.5, cz + 0.42, 0, 1.65);
      function red(i) {
        return K.mat([0xd82020, 0x20c840, 0xd8d020][i], 0.3);
      }
    }
    {
      // spiral dough mixer by the right of the prep island
      const mx = 3.6,
        mz = -6.6,
        mm = K.mat(0xe8e6e0, 0.4, 0.3);
      rb(0.6, 0.85, 0.75, 0.05, mm, [mx, 0.425, mz]);
      b.cyl(0.3, 0.26, 0.4, stainless, [mx, 1.05, mz + 0.05], null, 18, true);
      b.cyl(0.26, 0.26, 0.05, K.mat(0xf0e4c8, 0.9), [mx, 1.1, mz + 0.05], null, 18); // dough
      rb(0.5, 0.35, 0.4, 0.05, mm, [mx, 1.45, mz - 0.2]);
      b.cyl(0.02, 0.02, 0.4, steel, [mx, 1.2, mz + 0.05], [0, 0, 0.3], 6);
      S(mx - 0.32, mx + 0.32, mz - 0.4, mz + 0.4, 0, 1.6);
    }
    {
      // dough proofing rack on the right wall: trays of dough balls
      const rx = X1 - IN - 0.3,
        rz = -7.4;
      for (const lz of [-0.32, 0.32])
        for (const lx of [-0.22, 0.22]) b.cyl(0.015, 0.015, 1.8, steel, [rx + lx, 0.9, rz + lz], null, 6);
      const doughM = K.mat(0xf2e6c8, 0.9);
      for (let j = 0; j < 7; j++) {
        const y = 0.25 + j * 0.22;
        b.box(0.44, 0.04, 0.66, K.mat(0x5a8ab8, 0.5), [rx, y, rz], null, 0.005);
        for (let i = 0; i < 6; i++)
          b.sph(
            0.05,
            doughM,
            [rx - 0.1 + (i % 2) * 0.2, y + 0.04, rz - 0.22 + Math.floor(i / 2) * 0.22],
            [1, 0.6, 1],
            8
          );
      }
      S(rx - 0.25, rx + 0.25, rz - 0.35, rz + 0.35, 0, 1.85);
    }
    {
      // wing fryer by the right wall, under its own small hood
      const fx = X1 - IN - 0.4,
        fz = -4.4;
      b.box(0.8, 0.9, 0.8, stainless, [fx, 0.45, fz], null, 0.01);
      for (const k of [-0.18, 0.18]) {
        b.box(0.02, 0.1, 0.3, K.mat(0x8a6a20, 0.2, 0.2), [fx - 0.05, 0.9, fz + k], null, 0);
        b.box(0.3, 0.04, 0.28, K.mat(0xc8a040, 0.3, 0.1), [fx - 0.05, 0.89, fz + k], null, 0);
        b.cyl(0.012, 0.012, 0.4, steel, [fx - 0.35, 1.05, fz + k], [0, 0, 0.9], 6);
      }
      b.box(0.9, 0.4, 0.9, stainless, [fx, 2.6, fz], null, 0.01);
      S(fx - 0.4, fx + 0.4, fz - 0.4, fz + 0.4, 0, 0.95);
    }
    // stacks of flat pizza boxes on the floor by the conveyor oven
    for (const [sx, sz, n] of [
      [2.6, PZ - p - 0.35, 14],
      [3.15, PZ - p - 0.35, 10]
    ]) {
      for (let i = 0; i < n; i++)
        b.box(
          0.48,
          0.05,
          0.48,
          K.mat(i % 4 ? 0xf2ead8 : 0xc8202a, 0.8),
          [sx, 0.03 + i * 0.052, sz],
          [0, (i % 3) * 0.03, 0],
          0.005
        );
      S(sx - 0.25, sx + 0.25, sz - 0.25, sz + 0.25, 0, n * 0.052, true);
    }

    /* ---------- walk-in cooler: insulated panels, strip curtain, evaporator ---------- */
    {
      const cx0 = X0 + IN,
        cx1 = TX - 0.4,
        cz0 = Z0 + IN,
        cz1 = FZ,
        ch = 2.5,
        pan = K.mat(0xe8eaec, 0.4, 0.2),
        DX = -6.9; // curtain opening centre (1.0 wide)
      b.box(0.1, ch, cz1 - cz0, pan, [cx1, ch / 2, (cz0 + cz1) / 2], null, 0.01);
      S(cx1 - 0.05, cx1 + 0.05, cz0, cz1, 0, ch);
      b.box(DX - 0.5 - cx0, ch, 0.1, pan, [(cx0 + DX - 0.5) / 2, ch / 2, cz1], null, 0.01);
      S(cx0, DX - 0.5, cz1 - 0.05, cz1 + 0.05, 0, ch);
      b.box(cx1 - DX - 0.5, ch, 0.1, pan, [(DX + 0.5 + cx1) / 2, ch / 2, cz1], null, 0.01);
      S(DX + 0.5, cx1, cz1 - 0.05, cz1 + 0.05, 0, ch);
      b.box(1.0, ch - 2.1, 0.1, pan, [DX, 2.1 + (ch - 2.1) / 2, cz1], null, 0);
      b.box(cx1 - cx0 + 0.1, 0.08, cz1 - cz0 + 0.1, pan, [(cx0 + cx1) / 2, ch + 0.04, (cz0 + cz1) / 2], null, 0);
      // PVC strip curtain
      const pvc = K.mat(0xd8e8f0, 0.2, 0, {transparent: true, opacity: 0.45});
      for (let i = 0; i < 6; i++)
        b.box(0.18, 2.06, 0.01, pvc, [DX - 0.42 + i * 0.168, 1.05, cz1 + 0.06 + (i % 2) * 0.012], null, 0);
      b.label(0.6, 0.22, board('pb_cool', 'WALK-IN  2°C', null, '#1a4a8a', '#ffffff', 256, 96), [DX, 2.28, cz1 + 0.06]);
      // evaporator inside, a floor of steel checker plate
      rb(1.0, 0.36, 0.4, 0.02, K.mat(0xd0d4d8, 0.4, 0.5), [(cx0 + cx1) / 2, ch - 0.3, cz0 + 0.25]);
      flr(cx0, cx1, cz0, cz1, K.mat(0x9a9ea2, 0.4, 0.7));
      // tubs of sauce and cheese, a rail of salami logs
      for (let i = 0; i < 4; i++)
        b.cyl(
          0.18,
          0.17,
          0.4,
          K.mat(i % 2 ? 0xf6f2e8 : 0xc8402a, 0.5),
          [cx1 - 0.35, 0.2, cz1 - 0.4 - i * 0.42],
          null,
          14
        );
      S(cx1 - 0.55, cx1 - 0.15, cz0 + 0.8, cz1 - 0.2, 0, 0.42, true);
      b.cyl(0.015, 0.015, 1.6, steel, [(cx0 + cx1) / 2, 2.1, cz0 + 0.6], [0, 0, PI / 2], 6);
      for (let i = 0; i < 6; i++)
        b.cyl(0.045, 0.045, 0.5, K.mat(0x8a2a24, 0.6), [cx0 + 0.9 + i * 0.22, 1.82, cz0 + 0.6], null, 10);
    }
    // dry stores: a sack pallet in front of the cooler side
    {
      const sx = -6.3,
        sz = -7.0;
      b.box(1.0, 0.14, 0.9, K.mat(0x9a7a50, 0.85), [sx, 0.07, sz], null, 0.01);
      for (let i = 0; i < 6; i++)
        rb(
          0.42,
          0.18,
          0.62,
          0.06,
          K.mat(0xe8dcc0, 0.95),
          [sx - 0.22 + (i % 2) * 0.44, 0.24 + Math.floor(i / 2) * 0.17, sz],
          [0, (i % 2) * 0.1, 0]
        );
      b.label(0.3, 0.12, board('pb_flour', '00 FLOUR', null, '#e8dcc0', RED, 128, 48), [sx - 0.22, 0.6, sz + 0.32]);
      S(sx - 0.5, sx + 0.5, sz - 0.45, sz + 0.45, 0, 0.75);
    }

    /* ---------- customer toilet: WC, basin, mirror, dryer ---------- */
    {
      const wx = X0 + IN + 0.45,
        wz = TZ + p + 0.4;
      b.lathe(
        [
          [0, 0],
          [0.18, 0],
          [0.2, 0.2],
          [0.22, 0.38],
          [0, 0.38]
        ],
        por,
        [wx, 0, wz + 0.1],
        16
      );
      rb(0.42, 0.04, 0.48, 0.15, por, [wx, 0.4, wz + 0.15]);
      rb(0.4, 0.4, 0.18, 0.03, por, [wx, 0.62, wz - 0.12]);
      S(wx - 0.22, wx + 0.22, wz - 0.22, wz + 0.4, 0, 0.8, true);
      const sx = TX - p - 0.3,
        sz = -4.3;
      b.box(0.42, 0.15, 0.5, por, [sx, 0.82, sz], null, 0.04);
      b.cyl(0.04, 0.05, 0.7, por, [sx + 0.03, 0.4, sz], null, 12);
      b.cyl(0.012, 0.012, 0.16, chrome, [sx + 0.15, 0.95, sz], [0, 0, -0.6], 6);
      b.box(0.02, 0.6, 0.5, K.mat(0xcfe0e8, 0.05, 0.9), [TX - p - 0.02, 1.5, sz], null, 0);
      S(sx - 0.25, sx + 0.25, sz - 0.25, sz + 0.25, 0, 0.95, true);
      rb(0.22, 0.25, 0.14, 0.03, white, [TX - p - 0.08, 1.3, -5.2]);
    }

    /* ---------- manager's office: desk, monitors, safe, cork board, a stack of unpaid parking tickets ---------- */
    {
      const sfx = OX + p + 0.35,
        sfz = Z0 + IN + 0.35;
      rb(0.6, 0.8, 0.6, 0.03, K.mat(0x3a3e42, 0.4, 0.6), [sfx, 0.4, sfz]);
      b.cyl(0.08, 0.08, 0.04, chrome, [sfx, 0.5, sfz + 0.31], [PI / 2, 0, 0], 14);
      S(sfx - 0.3, sfx + 0.3, sfz - 0.3, sfz + 0.3, 0, 0.8);
      b.box(1.2, 0.8, 0.02, K.mat(0xb08a5a, 0.9), [6.4, 1.6, Z0 + IN + 0.02], null, 0); // cork board
      for (let i = 0; i < 6; i++)
        b.box(
          0.18,
          0.22,
          0.005,
          K.mat([0xffffff, 0xfff4a0, 0xa0d8ff][i % 3], 0.8),
          [5.95 + (i % 3) * 0.32, 1.42 + Math.floor(i / 3) * 0.36, Z0 + IN + 0.035],
          [0, 0, (i - 3) * 0.06],
          0
        );
      b.label(0.4, 0.3, poster('pb_emp', 'STAFF|OF THE|MONTH', 'still missing', CREAM, INK), [
        7.6,
        1.6,
        Z0 + IN + 0.03
      ]);
      // CCTV monitor on a wall shelf
      b.box(0.5, 0.03, 0.3, woodD, [X1 - IN - 0.16, 2.0, -9.4], null, 0);
      rb(0.42, 0.32, 0.3, 0.02, K.mat(0x2a2a2a, 0.5), [X1 - IN - 0.18, 2.18, -9.4]);
      b.label(
        0.34,
        0.25,
        K.mat(0x405a48, 0.2, 0, {emissive: 0x284a30, emissiveIntensity: 0.9}),
        [X1 - IN - 0.34, 2.18, -8.9],
        [0, -PI / 2, 0]
      );
    }
    /* ---------- dressing: dropped slices, open boxes, a knocked-over chair, smears, litter ---------- */
    {
      const sm = K.mat(0x4a0c0c, 0.9, 0, {transparent: true, opacity: 0.75}),
        boxM = K.mat(0xf2ead8, 0.8),
        cheese = K.mat(0xf2b830, 0.5),
        crust = K.mat(0xc88a3e, 0.8);
      // smears and drag marks
      for (const [sx, sz, w, d, a] of [
        [0.6, 3.2, 0.9, 0.4, 0.4],
        [-1.6, -1.9, 1.4, 0.3, -0.2],
        [0.8, -5.2, 0.7, 0.5, 1.1],
        [-1.4, -10.4, 1.6, 0.35, 0.3],
        [6.2, -0.1, 0.5, 0.4, 0.8]
      ])
        b.box(w, 0.004, d, sm, [sx, 0.05, sz], [0, a, 0], 0);
      // slices face-down on the floor, an open box on a table, one on the floor
      const wedge = [
        [-0.09, 0],
        [0.09, 0],
        [0, 0.2]
      ];
      for (const [sx, sz, a] of [
        [1.4, 2.8, 0.7],
        [-2.6, 2.4, 2.1],
        [5.6, 3.1, -0.6],
        [-0.4, -6.9, 1.3]
      ]) {
        b.add(K.extrudeGeo(wedge, 0.015, 0.004), cheese, {p: [sx, 0.06, sz], r: [-PI / 2, 0, a]});
        b.cyl(0.02, 0.02, 0.18, crust, [sx, 0.06, sz], [0, -a, PI / 2], 6);
      }
      const openBox = (x, y, z, a) => {
        b.push([x, y, z], [0, a, 0]);
        b.box(0.42, 0.04, 0.42, boxM, [0, 0.02, 0], null, 0.004);
        b.box(0.42, 0.42, 0.01, boxM, [0, 0.23, -0.21], [-0.2, 0, 0], 0);
        b.cyl(0.18, 0.18, 0.02, crust, [0, 0.045, 0], null, 16);
        b.cyl(0.16, 0.16, 0.01, cheese, [0.0, 0.058, 0], null, 16);
        b.pop();
      };
      openBox(-4.4, 0.78, 1.25, 0.3);
      openBox(3.7, 0.78, 4.5, -0.8);
      openBox(-0.9, 0.04, 3.9, 1.9);
      // a chair on its side by the arcades
      b.push([6.2, 0.2, 2.8], [0, 0.7, PI / 2]);
      b.cyl(0.2, 0.2, 0.04, woodT, [0, 0, 0], null, 14);
      for (const lx of [-0.14, 0.14]) b.cyl(0.014, 0.014, 0.46, woodD, [lx, -0.23, 0.14], null, 6);
      b.tor(0.18, 0.014, woodD, [0, 0.36, -0.17], [0.1, 0, 0], PI, 12);
      b.pop();
      // napkins and cups
      for (const [cx, cz] of [
        [-1.0, 1.9],
        [2.2, 3.6],
        [-3.0, -1.6],
        [5.0, 0.4]
      ]) {
        b.box(0.14, 0.005, 0.14, white, [cx, 0.05, cz], [0, cx, 0], 0);
        b.cyl(0.04, 0.035, 0.12, K.mat(0xc8202a, 0.6), [cx + 0.25, 0.06, cz + 0.1], [PI / 2, cz, 0], 8);
      }
    }

    return (CACHE = G.done());
  }

  function bPizzaBytes(x, z, t) {
    const B = mk(x, z, 20, 36, H, 0x9a3a2a, 0xb8643a, 0x2a2c30);
    B.dx = 0;
    const PT = {th: 0.14, c: 0xf2ead8};
    const cp = a => a.map(o => Object.assign({}, o));
    WL(B, 1, Z1, X0, X1, cp(FRONT), H);
    WL(B, 1, Z0, X0, X1, cp(BACK), H);
    WL(B, 0, X0, Z0, Z1, cp(LEFT), H);
    WL(B, 0, X1, Z0, Z1, cp(RIGHT), H);
    // dining / kitchen partition, customer toilet, office
    WL(B, 1, PZ, X0, X1, cp(PART), H, PT);
    WL(B, 0, TX, TZ, PZ, cp(WCS), H, PT);
    WL(B, 1, TZ, X0, TX, [], H, PT);
    WL(B, 1, OZ, OX, X1, cp(OFF), H, PT);
    WL(B, 0, OX, Z0, OZ, [], H, PT);
    LK.attach(B, build());
    // the PIZZABYTES delivery car nosed into the far stall, the van backed up in the yard (cab out to the alley)
    try {
      if (window.MFZV) {
        const flip = B.cs < 0 ? PI : 0;
        for (const [kind, vx, vz, rot] of [
          ['micro', 7.85, 10.7, PI],
          ['van', 5.0, Z0 - 3.4, PI]
        ]) {
          const g = MFZV.make(kind, WX(B, vx), WZ(B, vz), rot + flip, {
            label: 'PIZZABYTES',
            labelCol: '#c8202a',
            tint: [0.95, 0.93, 0.88],
            dust: true
          });
          const h = g && g.userData && g.userData.half;
          const hx = h ? h[0] : 1.1,
            hz = h ? h[1] : 2.5;
          B.occ.push([vx - hx, vx + hx, vz - hz, vz + hz]);
        }
      }
    } catch (e) {}
    const SP = LK.spawner(B, 'pb_counter');
    // front of house: the till, the counter unit behind the make line, the drinks cooler by the window
    SP(-1.2, CZ - 0.35, 'cash_register', 'pb_counter', PI, 1.06);
    SP(3.5, PZ + 0.075 + 0.3, 'kitchen_counter', 'pb_counter', 0);
    SP(X1 - 0.55, 5.85, 'drinks_cooler', 'convenience', -PI / 2);
    // kitchen: the prep island, back-wall fridge / freezer / sink / dish station / shelf (back door x -2.15..-0.85 kept clear)
    const KB = Z0 + 0.15 + 0.4;
    SP(-0.4, -6.6, 'prep_table', 'pb_kitchen', 0);
    SP(1.5, -6.6, 'prep_table', 'pb_kitchen', 0);
    SP(-4.4, KB + 0.07, 'fridge_modern', 'pb_kitchen', 0);
    SP(-3.35, KB + 0.05, 'freezer_upright', 'pb_kitchen', 0);
    SP(0.1, KB, 'kitchen_sink', 'pb_kitchen', 0);
    SP(1.6, KB, 'dish_station', 'pb_kitchen', 0);
    SP(3.45, KB, 'shop_shelf_wall', 'pb_stores', 0);
    // walk-in cooler and dry stores
    SP(-7.0, Z0 + 0.15 + 0.3, 'shop_shelf_wall', 'pb_stores', 0);
    SP(-7.8, -10.0, 'chest_freezer_full', 'pb_stores', PI / 2);
    SP(X0 + 0.15 + 0.3, -7.6, 'shop_shelf_wall', 'pb_stores', PI / 2);
    SP(-6.0, -8.3, 'cardboard_box_medium', 'pb_stores', 0.3);
    SP(-7.9, -6.75, 'dry_goods_case', 'pb_stores', 0.1);
    // customer toilet: the first-aid cabinet
    SP(X0 + 0.15 + 0.2, -4.3, 'medicine_cabinet', 'pb_wc', PI / 2);
    // manager's office: desk, bookshelf, a box of paperwork
    SP(6.8, -10.6, 'desk_office', 'pb_office', 0);
    SP(OX + 0.075 + 0.25, -9.7, 'bookshelf', 'pb_office', PI / 2);
    SP(7.9, -11.45, 'cardboard_box_small', 'pb_office', -0.4);
    // yard: the dumpster beside the log store
    SP(-5.9, Z0 - 4.5, 'dumpster_blue', 'storage', PI);
    return LK.finish(B, t, {
      at: [(X0 + X1) / 2, (Z0 + Z1) / 2],
      w: X1 - X0,
      d: Z1 - Z0,
      loot: ['pb_counter', [-6.2, -4.6, -2.7, -2.3], 1],
      zombies: [
        [-5.5, 3.5],
        [3.5, 2.0],
        [6.5, 4.5],
        [0.5, -2.0],
        [-1.0, -6.5],
        [2.5, -10.5],
        [-3.0, 10.5],
        [5.5, 12.0],
        [-6.0, -15.5],
        [3.0, -16.0]
      ]
    });
  }

  const e = LK.register({
    id: 'bakery',
    name: 'PizzaBytes',
    build: bPizzaBytes,
    note: 'half plot: pizza restaurant (dining room with booths, gingham tables, arcade cabinets; order counter with slice case; open wood-fired oven and make line; kitchen, walk-in cooler, office, toilet), patio in front, yard with van behind',
    globals: {bPizzaBytes, PIZZABYTES: {build}}
  });
  if (e) e.loot = 'pb_counter';
  console.log('[pizzabytes] PizzaBytes ready');
})();
