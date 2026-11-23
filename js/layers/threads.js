/* ==========================================================================================================
   MINI FORT ZOMBIE - THREADS WITH BENEFITS (v089): a half-plot clothing store (20 x 36 m plot, front = +Z), our own design.
   Replaces the Fancypantz Wearables placeholder (core NEWCAT id fancypantz_wearables, half pool).
   Exterior: a 17 x 20 m single-storey shop. White render front with big glowing cyan channel letters (THREADS WITH BENEFITS), a
   projecting blue entrance portal round sliding glass double doors, a full glazed shopfront with window mannequins and posters,
   a painted mural down the left side wall, grey render elsewhere, parapet with coping, HVAC on the roof. Front apron: a sidewalk-sale
   rail, an A-board, planters, a bench, a bike rack, bins, a grass strip with trees; street lights, a meter, a hydrant, no-parking sign.
   Behind: a delivery yard open to the alley with a roller-shutter bay (hazard apron, bumpers, bollards), a staff door, the store van,
   a clothing donation bin, a dumpster, pallets, cardboard bales, board fences down both sides.
   Interior: a large shop floor (polished concrete, open black ceiling with ducts, orange enamel pendants and track lights): a long
   oak shelving wall with hanging rails and a top shelf of vintage props, wall rails of jeans, flannels and coats, a cap wall, round
   racks of tees, T-racks, a round shoe display table, mannequins, three fitting rooms, a glass display counter with the till in front
   of a painted mural wall. Back of house: the delivery stock room (pallet racking, rolling garment rails, bales of stock, a sorting
   table, roll cages), a small office, a staff locker alcove and a staff toilet.
   Structure from core WL (doors / windows work); detail is our own geometry and painted artwork, outside the static merge.
   ========================================================================================================== */
(function () {
  'use strict';
  const K = window.MFZK,
    LK = window.LOTKIT;
  if (!K || !LK || typeof WL !== 'function' || typeof NEWCAT === 'undefined') {
    console.warn('[threads] core / prop kit missing');
    return;
  }
  const T = THREE,
    P = K.P,
    PI = Math.PI;
  // the shop box (half plot: x -10..10), the shop / back-of-house partition, heights
  const X0 = -8.5,
    X1 = 8.5,
    Z0 = -11,
    Z1 = 9,
    PZ = -3, // shop floor / back of house
    XO = 3.6, // stock room | office, alcove, toilet
    OZ = -6.6, // office back wall
    TZ = -8.6, // toilet front wall
    H = 5.0,
    RC = 2.8, // ceiling of the office and toilet
    BH = 3.6; // shutter opening height
  // the roller-shutter bay in the back wall: [centre, width]
  const BAY = [-4.4, 3.4];
  const FRONT = [
    {k: 'w', c: -7.3},
    {k: 'w', c: -5.7},
    {k: 'w', c: -4.1},
    {k: 'w', c: -2.5},
    {k: 'd', c: -0.65, dbl: 'slide'},
    {k: 'd', c: 0.65, dbl: 'slide'},
    {k: 'w', c: 2.5},
    {k: 'w', c: 4.1},
    {k: 'w', c: 5.7},
    {k: 'w', c: 7.3}
  ];
  const RIGHT = [
    {k: 'w', c: 5.0},
    {k: 'w', c: 7.4}
  ];
  const BACKD = [{k: 'd', c: 1.6, s: -1}]; // staff / deliveries door
  const PART = [
    {k: 'd', c: 1.4, dbl: 'swing'},
    {k: 'd', c: 2.7, dbl: 'swing'}
  ];
  const SIDE = [
    {k: 'd', c: -9.6}, // toilet
    {k: 'g', c: -7.6}, // locker alcove (open)
    {k: 'd', c: -4.8} // office
  ];
  // the back wall either side of the shutter bay: [a0, a1, ops]
  const BACKRUNS = [
    [X0, BAY[0] - BAY[1] / 2, []],
    [BAY[0] + BAY[1] / 2, X1, BACKD]
  ];

  /* ===================== loot tables ===================== */
  // shop rails and shelves, the stock room, the office, the staff toilet; materials where a clothes shop would have them
  try {
    Object.assign(LOOT_TABLES, {
      twb_shop: {
        rope: 3,
        bungie_cord: 3,
        cotton_balls: 3,
        hairspray: 3,
        duct_tape: 2,
        spray_paint: 2,
        spring: 1,
        granola: 1,
        water_jug: 1
      },
      twb_stock: {
        duct_tape: 5,
        rope: 4,
        bungie_cord: 3,
        nails: 3,
        spray_paint: 2,
        spring: 2,
        cotton_balls: 2,
        gas_cylinder: 1,
        hairspray: 1,
        crackers: 1
      },
      twb_office: {
        stugots_coffee: 2,
        cookies: 2,
        colacola: 2,
        z_energy_drink: 1,
        tweex: 1,
        painkiller: 2,
        duct_tape: 2,
        nails: 1,
        rope: 1
      },
      twb_wc: {painkiller: 2, gauze: 2, cotton_balls: 2, medical_tape: 1, hairspray: 1}
    });
    for (const tn of ['twb_shop', 'twb_stock', 'twb_office', 'twb_wc'])
      for (const id in LOOT_TABLES[tn])
        if (!ITEMS[id]) {
          console.error('[threads] loot table ' + tn + ' has unknown item ' + id);
          delete LOOT_TABLES[tn][id];
        }
    if (typeof LOOT_PROP !== 'undefined')
      Object.assign(LOOT_PROP, {twb_shop: 'cabinet', twb_stock: 'cabinet', twb_office: 'cabinet', twb_wc: 'cabinet'});
    const A = window.MFZPROP && MFZPROP.auto;
    if (A) {
      const pick = (...ts) => [...new Set(ts.flatMap(t => A[t] || []))];
      A.twb_shop = pick('clothing', 'house');
      A.twb_stock = pick('clothing', 'storage');
      A.twb_office = pick('office', 'house');
      A.twb_wc = pick('house', 'clinic');
    }
  } catch (e) {
    console.warn('[threads] loot tables', e);
  }

  /* ===================== artwork ===================== */
  const CYAN = '#3ee0f0',
    BLUE = '#1a9ad8',
    INK = '#1c1e22';
  const strapMat = (key, text, font, bg, fg) =>
    K.paint(key, 512, 64, (c, W, H) => {
      c.fillStyle = bg;
      c.fillRect(0, 0, W, H);
      c.fillStyle = fg;
      c.font = font;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(text, W / 2, H / 2 + 2);
    });

  /* ===================== surfaces ===================== */
  const SURF = {};
  const surf = k =>
    SURF[k] ||
    (SURF[k] = {
      asphalt: () => K.surf('asphalt', 0x3a3c40),
      concrete: () => K.surf('concrete', 0xb4b0a6),
      lawn: () => K.surf('lawn', 0x4a6a2a),
      fence: () => K.surf('wood', 0x6a5444),
      shutter: () => K.surf('rollshutter', 0xb8bcc0, {m: 0.5}),
      // smooth white render with faint trowel marks
      render: () =>
        K.tri(
          'twb_render',
          (c, W, H, r) => {
            c.fillStyle = '#eceae4';
            c.fillRect(0, 0, W, H);
            P.noise(c, W, H, r, 5000, 0.06, '#9a968c', 1.2);
            P.grime(c, W, H, r, 0.12);
          },
          {tile: 2.5, r: 0.85}
        ),
      grey: () =>
        K.tri(
          'twb_grey',
          (c, W, H, r) => {
            c.fillStyle = '#9c9e9e';
            c.fillRect(0, 0, W, H);
            P.noise(c, W, H, r, 6000, 0.1, '#4a4c4c', 1.2);
            P.grime(c, W, H, r, 0.3);
          },
          {tile: 2.5, r: 0.9}
        ),
      coping: () => K.mat(0xd8d8d4, 0.5, 0.4),
      alu: () => K.mat(0x2a2c30, 0.4, 0.6),
      portal: () => K.mat(0x1a9ad8, 0.45, 0.2)
    }[k]());

  /* ===================== geometry ===================== */
  let CACHE = null;
  function build() {
    if (CACHE) return CACHE;
    const G = LK.geo('threads'),
      b = G.b,
      S = G.S;
    const conc = surf('concrete'),
      asph = surf('asphalt');
    /* ---------- grounds: sidewalk, front apron, grass strip, side walks, delivery yard ---------- */
    LK.pavement(b, conc, {w: 20, kerb: true});
    b.box(20, 0.04, 14.6 - Z1, conc, [0, 0.02, (Z1 + 14.6) / 2], null, 0); // front apron
    b.box(20, 0.03, 1.2, surf('lawn'), [0, 0.025, 15.2], null, 0); // grass strip by the sidewalk
    b.box(1.5, 0.04, Z1 - Z0, conc, [-9.25, 0.02, (Z0 + Z1) / 2], null, 0); // side walks
    b.box(1.5, 0.04, Z1 - Z0, conc, [9.25, 0.02, (Z0 + Z1) / 2], null, 0);
    b.box(20, 0.02, 18 + Z0, asph, [0, 0.012, (-18 + Z0) / 2], null, 0); // delivery yard, out to the alley

    const rend = surf('render'),
      grey = surf('grey'),
      cop = surf('coping'),
      alu = surf('alu'),
      blueP = surf('portal'),
      dark = K.mat(0x1c1c1e, 0.5),
      black = K.mat(0x141416, 0.45, 0.4),
      steel = K.mat(0x9a9ea2, 0.4, 0.7),
      galv = K.mat(0xb8bcc0, 0.35, 0.8),
      chrome = K.chrome(),
      yel = K.mat(0xf2c418, 0.55),
      wood = K.surf('wood', 0x6a4a2a),
      oak = K.veneer(0xb08452),
      leaf = K.mat(0x3e6a2e, 0.85),
      leaf2 = K.mat(0x557f38, 0.85),
      soil = K.mat(0x3a2a1c, 0.95),
      lit = K.mat(0xffffff, 0.4, 0, {emissive: 0xf6f8ff, emissiveIntensity: 0.95}),
      warm = K.mat(0xfff2c8, 0.4, 0, {emissive: 0xffd890, emissiveIntensity: 1.3});
    const rb = (w, h, d, r, m, p, rot) => b.rbox(w, h, d, r, m, p, rot, 1); // one segment per rounded edge (keeps vertex counts down)
    let sd = 11;
    const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;

    /* ---------- garment and mannequin makers (shared by the shop floor, the window displays and the sidewalk sale) ---------- */
    const plaid = (key, base, a, bb) =>
      K.paint(
        key,
        128,
        128,
        (c, W, H) => {
          c.fillStyle = base;
          c.fillRect(0, 0, W, H);
          c.globalAlpha = 0.55;
          c.fillStyle = a;
          for (let i = 0; i < 4; i++) {
            c.fillRect(i * 32 + 4, 0, 12, H);
            c.fillRect(0, i * 32 + 4, W, 12);
          }
          c.globalAlpha = 0.5;
          c.fillStyle = bb;
          for (let i = 0; i < 4; i++) {
            c.fillRect(i * 32 + 22, 0, 3, H);
            c.fillRect(0, i * 32 + 22, W, 3);
          }
          c.globalAlpha = 1;
        },
        {r: 0.95}
      );
    const FLANNEL = [
      plaid('twb_pl1', '#a8201e', '#1a1a1a', '#e8d8b0'),
      plaid('twb_pl2', '#1e3a7a', '#0e1a3a', '#c8d0e0'),
      plaid('twb_pl3', '#2e5a32', '#141e14', '#d8b84a'),
      plaid('twb_pl4', '#d8d4c8', '#2a2a2a', '#a82a2a'),
      plaid('twb_pl5', '#6a3a7a', '#1a1a2a', '#e8a8c8')
    ];
    const TEE = [
      0x1e3a8a, 0x7a2a9a, 0xd8287a, 0x2a8a4a, 0xe8b020, 0xe86a20, 0xd82a2a, 0x2ab8d8, 0x1a1a1a, 0xe8e4d8, 0x5a6a7a
    ];
    const COAT = [0xc8b48a, 0x8a6a42, 0x4a3a2a, 0x2a2a2a, 0x6a6e5a, 0x9a3a2a, 0xd8d0b8];
    const DENIM = [0x2a3e6a, 0x3a5a8a, 0x1e2a44, 0x6a86aa, 0x2a2c30];
    const MT = {};
    const tm = col => MT[col] || (MT[col] = K.mat(col, 0.92));
    const pickM = kind =>
      kind === 'flannel'
        ? FLANNEL[Math.floor(rnd() * FLANNEL.length)]
        : tm(
            (kind === 'coat' ? COAT : kind === 'jeans' ? DENIM : TEE)[
              Math.floor(rnd() * (kind === 'coat' ? 7 : kind === 'jeans' ? 5 : 11))
            ]
          );
    // a garment hung side-on on a rail running along local x: the hanger hook at (0, y, 0)
    const hangSide = (x, y, z, a, kind) => {
      const m = pickM(kind),
        len = kind === 'coat' ? 1.0 : kind === 'jeans' ? 0.9 : kind === 'flannel' ? 0.72 : 0.64,
        wd = kind === 'coat' ? 0.56 : 0.5,
        th = kind === 'coat' ? 0.08 : kind === 'flannel' ? 0.06 : 0.045;
      b.push([x, y, z], [0, a, 0]);
      b.box(0.012, 0.07, 0.012, chrome, [0, -0.02, 0], null, 0);
      b.box(0.02, 0.025, wd * 0.84, K.mat(0xc8a070, 0.6), [0, -0.07, 0], null, 0);
      b.box(th, len, wd, m, [0, -0.08 - len / 2, 0], null, 0);
      b.pop();
    };
    // a garment hung facing out (local +z): tee / flannel / coat with sleeves, or jeans
    const hangFront = (x, y, z, a, kind, m) => {
      m = m || pickM(kind);
      b.push([x, y, z], [0, a, 0]);
      b.box(0.012, 0.07, 0.012, chrome, [0, -0.02, 0], null, 0);
      if (kind === 'jeans') {
        b.box(0.42, 0.03, 0.02, chrome, [0, -0.07, 0], null, 0);
        for (const s of [-1, 1]) b.box(0.19, 0.86, 0.04, m, [s * 0.1, -0.52, 0], [0, 0, s * 0.035], 0);
        b.box(0.4, 0.16, 0.045, m, [0, -0.17, 0], null, 0);
      } else {
        const len = kind === 'coat' ? 0.95 : 0.66;
        b.box(0.44, 0.03, 0.02, K.mat(0xc8a070, 0.6), [0, -0.07, 0], null, 0);
        b.box(0.46, len, 0.035, m, [0, -0.08 - len / 2, 0], null, 0);
        for (const s of [-1, 1]) b.box(0.13, len * 0.8, 0.034, m, [s * 0.29, -0.1 - len * 0.4, 0], [0, 0, s * 0.12], 0);
        if (kind !== 'tee') b.box(0.03, len, 0.04, K.mat(0xe8e4d8, 0.6), [0, -0.08 - len / 2, 0.003], null, 0); // placket
      }
      b.pop();
    };
    // a rail along local x carrying n side-on garments
    const railRun = (x, y, z, a, L, kind, n) => {
      b.push([x, y, z], [0, a, 0]);
      b.cyl(0.014, 0.014, L, chrome, [0, 0, 0], [0, 0, PI / 2], 8);
      b.pop();
      const c = Math.cos(a),
        s = Math.sin(a);
      for (let i = 0; i < n; i++) {
        if (rnd() < 0.08) continue;
        const u = -L / 2 + 0.12 + ((L - 0.24) * (i + 0.5)) / n + (rnd() - 0.5) * 0.03;
        hangSide(x + c * u, y, z - s * u, a, kind);
      }
    };
    // a stack of folded clothes
    const folded = (x, y, z, a, n, cols) => {
      b.push([x, y, z], [0, a, 0]);
      for (let i = 0; i < n; i++)
        b.box(
          0.34,
          0.055,
          0.28,
          tm(cols[(((i + Math.floor(x * 7)) % cols.length) + cols.length) % cols.length]),
          [(rnd() - 0.5) * 0.02, 0.03 + i * 0.058, 0],
          null,
          0.004
        );
      b.pop();
    };
    // a shop mannequin; o = {top, bot, dress, coat, hat, fallen}
    const skinM = K.mat(0xeee8e0, 0.35),
      joint = K.mat(0xb8b0a8, 0.45);
    const mannequin = (x, z, a, o) => {
      o = o || {};
      const fallen = o.fallen,
        y0 = o.y || 0;
      b.push([x, y0 + (fallen ? 0.2 : 0), z], fallen ? [PI / 2, a, 0] : [0, a, 0]);
      b.cyl(0.17, 0.2, 0.03, black, [0, 0.015, 0], null, 14);
      b.cyl(0.012, 0.012, 0.3, chrome, [0, 0.17, -0.06], null, 6);
      const top = o.top !== undefined ? tm(o.top) : skinM,
        bot = o.bot !== undefined ? tm(o.bot) : skinM;
      for (const s of [-1, 1]) {
        b.cyl(0.055, 0.045, 0.44, o.dress ? skinM : bot, [s * 0.09, 0.3, 0], null, 8);
        b.cyl(0.07, 0.058, 0.42, o.dress ? skinM : bot, [s * 0.09, 0.74, 0], null, 8);
        b.box(
          0.1,
          0.06,
          0.22,
          o.dress ? K.mat(0x1a1a1a, 0.4) : K.mat(0x3a2a20, 0.6),
          [s * 0.09, 0.05, 0.04],
          null,
          0.015
        );
      }
      b.rbox(0.32, 0.22, 0.19, 0.06, o.dress ? top : bot, [0, 1.04, 0]);
      b.rbox(0.37, 0.44, 0.21, 0.08, top, [0, 1.38, 0]);
      if (o.dress) b.cyl(0.18, 0.3, 0.5, top, [0, 0.82, 0], null, 12);
      if (o.coat) {
        const cm = tm(o.coat);
        b.box(0.42, 0.86, 0.25, cm, [0, 1.18, 0], null, 0.03);
        b.box(0.02, 0.84, 0.01, K.mat(0x1a1a1a, 0.6), [0, 1.18, 0.13], null, 0);
      }
      b.cyl(0.04, 0.05, 0.1, skinM, [0, 1.65, 0], null, 8);
      b.add(K.sphGeo(0.105, 12, 8), skinM, {p: [0, 1.8, 0], s: [0.9, 1.15, 1]});
      if (o.hat !== undefined) {
        b.cyl(0.115, 0.115, 0.08, tm(o.hat), [0, 1.9, 0], null, 12);
        b.box(0.16, 0.012, 0.12, tm(o.hat), [0, 1.865, 0.1], null, 0);
      }
      const am = o.coat ? tm(o.coat) : o.top !== undefined && !o.dress ? top : skinM;
      for (const s of [-1, 1]) {
        b.sph(0.05, joint, [s * 0.22, 1.54, 0]);
        b.cyl(0.042, 0.036, 0.3, am, [s * 0.24, 1.37, 0], [0, 0, s * 0.1], 8);
        b.cyl(0.035, 0.03, 0.28, skinM, [s * 0.26, 1.07, 0.03], [0.15, 0, 0], 8);
      }
      b.pop();
      if (!fallen) S(x - 0.21, x + 0.21, z - 0.21, z + 0.21, y0, y0 + 1.95, true);
    };

    /* ---------- exterior skin: white render on the front, grey render on the sides and back ---------- */
    const skin = (ax, f, a0, a1, n, ops, m) => {
      ops = (ops || []).slice().sort((p, q) => p.c - q.c);
      const pc = (u0, u1, y0, y1) => {
        if (u1 - u0 < 0.04 || y1 - y0 < 0.02) return;
        const o = f + n * 0.165,
          u = (u0 + u1) / 2,
          y = (y0 + y1) / 2;
        if (ax) b.box(u1 - u0, y1 - y0, 0.03, m, [u, y, o], null, 0);
        else b.box(0.03, y1 - y0, u1 - u0, m, [o, y, u], null, 0);
      };
      let a = a0;
      for (const p of ops) {
        const hw = p.k === 'w' ? 0.75 : p.k === 'g' ? 0.8 : 0.65;
        pc(a, p.c - hw, 0, H);
        if (p.k === 'w') {
          pc(p.c - hw, p.c + hw, 0, 0.9);
          pc(p.c - hw, p.c + hw, 2.75, H);
        } else pc(p.c - hw, p.c + hw, p.k === 'g' ? 2.5 : 2.4, H);
        a = p.c + hw;
      }
      pc(a, a1, 0, H);
    };
    skin(1, Z1, X0 - 0.15, X1 + 0.15, 1, FRONT, rend);
    skin(0, X1, Z0, Z1, 1, RIGHT, grey);
    skin(0, X0, Z0, Z1, -1, [], grey);
    for (const [a0, a1, ops] of BACKRUNS)
      skin(1, Z0, a0 - (a0 === X0 ? 0.15 : 0), a1 + (a1 === X1 ? 0.15 : 0), -1, ops, grey);
    // dark plinth band all round
    b.box(X1 - X0 + 0.36, 0.35, 0.04, dark, [0, 0.175, Z1 + 0.19], null, 0);
    for (const s of [-1, 1]) b.box(0.04, 0.35, Z1 - Z0, dark, [s * (X1 + 0.19), 0.175, (Z0 + Z1) / 2], null, 0);
    // shutter bay header (render outside, steel lintel, yellow jamb guards)
    b.box(BAY[1], H - BH, 0.3, grey, [BAY[0], (H + BH) / 2, Z0], null, 0);
    b.box(BAY[1] + 0.1, 0.2, 0.34, K.mat(0x4a4c50, 0.45, 0.6), [BAY[0], BH + 0.1, Z0], null, 0);
    for (const s of [-1, 1]) b.box(0.14, BH, 0.36, yel, [BAY[0] + s * (BAY[1] / 2 + 0.07), BH / 2, Z0], null, 0.01);
    // shopfront: dark aluminium frames, a continuous transom and stall riser
    for (const w of FRONT.filter(p => p.k === 'w')) {
      b.box(1.62, 0.07, 0.16, cop, [w.c, 0.9, Z1 + 0.22], null, 0.01);
      b.frame(1.56, 1.9, 0.07, alu, [w.c, 1.825, Z1 + 0.19], 0.06);
    }
    b.box(X1 - X0, 0.12, 0.12, alu, [0, 2.84, Z1 + 0.2], null, 0.01);
    for (const w of RIGHT) {
      b.box(0.16, 0.07, 1.62, cop, [X1 + 0.22, 0.9, w.c], null, 0.01);
      b.push([X1 + 0.19, 1.825, w.c], [0, PI / 2, 0]);
      b.frame(1.56, 1.9, 0.07, alu, [0, 0, 0], 0.06);
      b.pop();
    }

    /* ---------- the THREADS WITH BENEFITS channel letters (glowing cyan face over a darker return) ---------- */
    const letters = (key, col, glow) =>
      K.paint(
        key,
        2048,
        192,
        (c, W, H) => {
          c.clearRect(0, 0, W, H);
          c.fillStyle = col;
          c.font = '900 150px Arial Black, Arial, Helvetica, sans-serif';
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillText('THREADS WITH BENEFITS', W / 2, H / 2 + 6, W - 40);
        },
        glow ? {alpha: 1, glow} : {alpha: 1}
      );
    b.label(15.2, 1.42, letters('twb_let_back', '#0a5a66'), [0.04, 3.9 - 0.04, Z1 + 0.19]);
    b.label(15.2, 1.42, letters('twb_let', CYAN, 1.1), [0, 3.9, Z1 + 0.25]);
    // a slim LED light line along the top of the shopfront
    b.box(
      X1 - X0 - 0.4,
      0.05,
      0.06,
      K.mat(0x3ee0f0, 0.4, 0, {emissive: 0x3ee0f0, emissiveIntensity: 0.8}),
      [0, 3.05, Z1 + 0.22],
      null,
      0
    );

    /* ---------- entrance: projecting blue portal round the sliding doors ---------- */
    const PD = 0.9; // depth in front of the wall
    for (const s of [-1, 1]) {
      b.box(0.36, 3.1, PD, blueP, [s * 1.66, 1.55, Z1 + PD / 2 + 0.15], null, 0.01);
      S(s * 1.66 - 0.18, s * 1.66 + 0.18, Z1 + 0.15, Z1 + PD + 0.15, 0, 3.1);
    }
    b.box(3.68, 0.5, PD, blueP, [0, 2.85, Z1 + PD / 2 + 0.15], null, 0.01);
    b.box(2.96, 0.03, PD - 0.05, K.mat(0xe8e8e4, 0.6), [0, 2.6, Z1 + PD / 2 + 0.15], null, 0); // soffit
    for (const dx of [-0.8, 0.8]) b.cyl(0.07, 0.07, 0.02, warm, [dx, 2.585, Z1 + PD / 2 + 0.15], null, 12);
    b.label(
      3.0,
      0.32,
      strapMat('twb_welcome', 'COME IN · WE ARE OPEN', 'bold 38px Arial, Helvetica, sans-serif', BLUE, '#ffffff'),
      [0, 2.85, Z1 + PD + 0.16]
    );
    b.box(3.2, 0.03, 1.2, K.mat(0x2a2a2c, 0.9), [0, 0.05, Z1 + 0.75], null, 0); // entrance mat

    /* ---------- window displays: plinths with mannequins behind the glass, posters ---------- */
    for (const px of [-5.7, 4.9]) b.box(2.6, 0.3, 0.9, K.mat(0xf2f2ee, 0.5), [px, 0.15, Z1 - 0.6], null, 0.01);
    S(-7.0, -4.4, Z1 - 1.05, Z1 - 0.15, 0, 0.3, true);
    S(3.6, 6.2, Z1 - 1.05, Z1 - 0.15, 0, 0.3, true);
    mannequin(-6.5, Z1 - 0.6, 0.15, {top: 0xd82a2a, bot: 0x1a1a1a, y: 0.3});
    mannequin(-5.0, Z1 - 0.6, -0.2, {top: 0xe8e4d8, coat: 0xc8b48a, bot: 0x2a3e6a, y: 0.3});
    mannequin(4.3, Z1 - 0.6, 0.2, {dress: true, top: 0x1a1a1a, y: 0.3});
    mannequin(5.6, Z1 - 0.6, -0.1, {top: 0x2ab8d8, bot: 0x6a86aa, hat: 0xd82a2a, y: 0.3});
    const poster = (key, l1, l2, bg, fg) =>
      K.paint(key, 256, 340, (c, W, H) => {
        c.fillStyle = bg;
        c.fillRect(0, 0, W, H);
        c.strokeStyle = fg;
        c.lineWidth = 6;
        c.strokeRect(10, 10, W - 20, H - 20);
        c.fillStyle = fg;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.font = 'bold 64px Impact, Arial Black, sans-serif';
        c.fillText(l1, W / 2, H * 0.38, W - 30);
        c.font = 'bold 40px Arial, Helvetica, sans-serif';
        c.fillText(l2, W / 2, H * 0.62, W - 30);
      });
    b.label(0.7, 0.93, poster('twb_po1', 'NEW IN', 'VINTAGE', '#1a9ad8', '#ffffff'), [-2.5, 1.55, Z1 + 0.17]);
    b.label(0.7, 0.93, poster('twb_po2', '50%', 'OFF DENIM', '#d8287a', '#ffffff'), [2.5, 1.55, Z1 + 0.17]);
    b.label(0.7, 0.93, poster('twb_po3', 'FLANNEL', 'SEASON', '#f2c418', '#1c1e22'), [7.3, 1.55, Z1 + 0.17]);
    b.label(0.7, 0.93, poster('twb_po4', 'TRY IT', 'ON!', '#1c1e22', CYAN), [-7.3, 1.55, Z1 + 0.17]);
    // hours card on the door glass
    b.label(0.3, 0.4, poster('twb_hrs', 'OPEN', '9-6 DAILY', '#ffffff', '#1c1e22'), [0.95, 1.4, Z1 + 0.17]);

    /* ---------- parapet with coping, flat roof, HVAC ---------- */
    const par = (ax, f, a0, a1, m, h) => {
      const L = a1 - a0,
        u = (a0 + a1) / 2;
      if (ax) {
        b.box(L, h, 0.3, m, [u, H + h / 2, f], null, 0);
        b.box(L + 0.1, 0.07, 0.42, cop, [u, H + h + 0.03, f], null, 0.01);
      } else {
        b.box(0.3, h, L, m, [f, H + h / 2, u], null, 0);
        b.box(0.42, 0.07, L + 0.1, cop, [f, H + h + 0.03, u], null, 0.01);
      }
    };
    par(1, Z1, X0 - 0.15, X1 + 0.15, rend, 0.9);
    par(1, Z0, X0 - 0.15, X1 + 0.15, grey, 0.5);
    par(0, X0, Z0, Z1 - 0.15, grey, 0.5);
    par(0, X1, Z0, Z1 - 0.15, grey, 0.5);
    b.box(X1 - X0, 0.12, Z1 - Z0, K.surf('concrete', 0x5a5a58), [0, H + 0.02, (Z0 + Z1) / 2], null, 0);
    b.box(X1 - X0 - 0.3, 0.02, Z1 - Z0 - 0.3, K.mat(0x3a3c40, 0.9), [0, H + 0.09, (Z0 + Z1) / 2], null, 0);
    for (const [hx, hz] of [
      [-4.5, -5],
      [4, 0.5]
    ]) {
      rb(2.0, 1.0, 1.4, 0.03, K.mat(0xb0b4b8, 0.4, 0.7), [hx, H + 0.6, hz]);
      b.vents(6, 1.8, 0.7, K.mat(0x6a6c6e, 0.5, 0.6), [hx, H + 0.6, hz + 0.71]);
      b.cyl(0.5, 0.5, 0.1, K.mat(0x2a2a2a, 0.5, 0.4), [hx, H + 1.15, hz], null, 20);
    }
    for (const [vx, vz] of [
      [-6.5, 6],
      [6.5, -8],
      [0, -2]
    ])
      b.cyl(0.08, 0.08, 0.8, K.mat(0x7a7c7e, 0.4, 0.7), [vx, H + 0.5, vz], null, 10);

    /* ---------- mural down the left side wall (faces the side walk) ---------- */
    const mural = K.paint('twb_mural', 1024, 256, (c, W, H) => {
      const g = c.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, '#1a9ad8');
      g.addColorStop(0.5, '#d8287a');
      g.addColorStop(1, '#f2a018');
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
      // paint blobs
      const bl = [
        ['#3ee0f0', 90, 60, 70],
        ['#f2c418', 300, 200, 60],
        ['#7a2a9a', 560, 40, 80],
        ['#2a8a4a', 820, 210, 70],
        ['#ffffff', 960, 70, 40]
      ];
      for (const [col, x, y, r] of bl) {
        c.globalAlpha = 0.5;
        c.fillStyle = col;
        c.beginPath();
        c.arc(x, y, r, 0, PI * 2);
        c.fill();
      }
      c.globalAlpha = 1;
      // a cotton reel with a thread that loops right across the wall
      c.fillStyle = '#c8a070';
      c.fillRect(60, 70, 24, 120);
      c.fillRect(156, 70, 24, 120);
      c.fillStyle = '#e8e4d8';
      c.fillRect(84, 82, 72, 96);
      c.strokeStyle = '#ffffff';
      c.lineWidth = 9;
      c.beginPath();
      c.moveTo(156, 130);
      c.bezierCurveTo(260, 20, 300, 250, 420, 140);
      c.bezierCurveTo(520, 50, 760, 240, 980, 120);
      c.stroke();
      // graffiti lettering with a dark outline
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.font = 'italic 900 112px Impact, Arial Black, sans-serif';
      c.lineWidth = 14;
      c.strokeStyle = INK;
      c.strokeText('THREADS', 610, 108);
      c.fillStyle = '#ffffff';
      c.fillText('THREADS', 610, 108);
      c.font = 'italic bold 52px Impact, Arial Black, sans-serif';
      c.lineWidth = 10;
      c.strokeText('with benefits', 640, 196);
      c.fillStyle = '#3ee0f0';
      c.fillText('with benefits', 640, 196);
      // a needle
      c.strokeStyle = '#d8dadc';
      c.lineWidth = 6;
      c.beginPath();
      c.moveTo(860, 40);
      c.lineTo(990, 210);
      c.stroke();
    });
    b.label(13.6, 3.4, mural, [X0 - 0.19, 2.4, 0.2], [0, -PI / 2, 0]);

    /* ---------- back: roller shutter, apron, bumpers, bollards, staff door hood, wall packs ---------- */
    const hazard = K.paint('twb_hazard', 256, 64, c => {
      c.fillStyle = '#f2c418';
      c.fillRect(0, 0, 256, 64);
      c.fillStyle = '#1a1a1a';
      for (let i = -2; i < 10; i++) {
        c.beginPath();
        c.moveTo(i * 32, 64);
        c.lineTo(i * 32 + 16, 64);
        c.lineTo(i * 32 + 48, 0);
        c.lineTo(i * 32 + 32, 0);
        c.fill();
      }
    });
    {
      const [c, w] = BAY;
      b.box(w + 1.2, 0.03, 3.2, K.surf('concrete', 0x9a9890), [c, 0.025, Z0 - 1.6], null, 0);
      b.label(w, 0.25, hazard, [c, 0.045, Z0 - 0.3], [-PI / 2, 0, 0]);
      for (const s of [-1, 1]) b.box(0.12, 0.01, 5.2, yel, [c + s * (w / 2 - 0.1), 0.03, Z0 - 3.6], null, 0);
      // shutter box and guides; the shutter is rolled most of the way up
      rb(w + 0.3, 0.5, 0.5, 0.06, K.mat(0x8a8e92, 0.4, 0.6), [c, BH + 0.27, Z0 - 0.4]);
      for (const s of [-1, 1])
        b.box(0.1, BH, 0.14, K.mat(0x5a6062, 0.4, 0.6), [c + s * (w / 2 - 0.03), BH / 2, Z0 - 0.26], null, 0);
      const low = 2.9;
      b.box(w - 0.1, BH - low, 0.05, surf('shutter'), [c, (BH + low) / 2, Z0 - 0.27], null, 0);
      b.box(w - 0.1, 0.08, 0.08, K.mat(0x6a6e72, 0.4, 0.6), [c, low - 0.04, Z0 - 0.27], null, 0);
      for (const s of [-1, 1]) {
        rb(0.3, 0.45, 0.18, 0.03, K.rubber(), [c + s * (w / 2 + 0.35), 0.75, Z0 - 0.25]);
        b.cyl(0.12, 0.12, 1.1, yel, [c + s * (w / 2 + 0.45), 0.55, Z0 - 0.9], null, 14);
        S(c + s * (w / 2 + 0.45) - 0.13, c + s * (w / 2 + 0.45) + 0.13, Z0 - 1.03, Z0 - 0.77, 0, 1.1, true);
      }
      b.box(0.36, 0.22, 0.2, dark, [c, H - 0.45, Z0 - 0.26], null, 0.01);
      b.box(0.3, 0.02, 0.14, lit, [c, H - 0.57, Z0 - 0.28], null, 0);
      b.label(
        2.4,
        0.3,
        strapMat(
          'twb_deliv',
          'DELIVERIES · KEEP CLEAR',
          'bold 40px Arial, Helvetica, sans-serif',
          '#f2c418',
          '#1a1a1a'
        ),
        [c, BH + 0.75, Z0 - 0.17],
        [0, PI, 0]
      );
    }
    // staff door: hood, sign, wall pack, a step
    b.box(1.6, 0.06, 0.8, cop, [BACKD[0].c, 2.65, Z0 - 0.4], null, 0.01);
    b.label(
      1.4,
      0.18,
      strapMat('twb_staff', 'STAFF ENTRANCE', 'bold 40px Arial, Helvetica, sans-serif', INK, '#ffffff'),
      [BACKD[0].c, 2.9, Z0 - 0.17],
      [0, PI, 0]
    );
    b.box(0.3, 0.2, 0.18, dark, [BACKD[0].c + 1.1, 2.7, Z0 - 0.25], null, 0.01);
    b.box(0.24, 0.02, 0.12, lit, [BACKD[0].c + 1.1, 2.59, Z0 - 0.27], null, 0);
    b.box(1.5, 0.12, 0.5, conc, [BACKD[0].c, 0.06, Z0 - 0.4], null, 0.01);
    // AC condenser on the back wall by the toilet
    rb(0.9, 0.7, 0.4, 0.03, K.mat(0xd8d8d4, 0.5, 0.3), [6.2, 0.4, Z0 - 0.4]);
    b.vents(5, 0.7, 0.5, K.mat(0x6a6c6e, 0.5, 0.6), [6.2, 0.42, Z0 - 0.61], [0, PI, 0]);
    S(5.75, 6.65, Z0 - 0.6, Z0 - 0.15, 0, 0.8, true);

    /* ---------- delivery yard: pallets, cardboard bales, clothing donation bin, board fences ---------- */
    const pallet = (px, pz, n, a) => {
      b.push([px, 0, pz], [0, a || 0, 0]);
      for (let j = 0; j < n; j++) {
        const y = j * 0.15;
        for (const s of [-0.5, 0, 0.5]) b.box(1.2, 0.08, 0.1, wood, [0, y + 0.04, s * 0.95], null, 0);
        for (let i = 0; i < 7; i++) b.box(0.13, 0.025, 1.0, wood, [-0.54 + i * 0.18, y + 0.095, 0], null, 0);
      }
      b.pop();
      S(px - 0.62, px + 0.62, pz - 0.62, pz + 0.62, 0, n * 0.15, true);
    };
    pallet(-8.9, -12.6, 5, 0.05);
    pallet(-8.9, -14.0, 2, -0.1);
    for (const [bx, bz] of [
      [8.8, -14.4],
      [8.8, -15.6]
    ]) {
      b.box(1.0, 0.8, 1.0, K.surf('cardboard', 0xb8946a), [bx, 0.4, bz], null, 0.01);
      for (const s of [-0.25, 0.25]) b.box(1.02, 0.82, 0.02, K.mat(0x2a2a2a, 0.6), [bx, 0.4, bz + s], null, 0);
      S(bx - 0.5, bx + 0.5, bz - 0.5, bz + 0.5, 0, 0.8, true);
    }
    {
      // clothing donation bank: a green steel box with a pull-down chute
      const dx = 8.75,
        dz = -12.6;
      const gm = K.mat(0x2a7a3a, 0.5, 0.4);
      rb(1.1, 1.8, 1.0, 0.04, gm, [dx, 0.9, dz]);
      b.box(1.12, 0.06, 1.02, K.mat(0x1e5a2a, 0.5, 0.4), [dx, 1.83, dz], null, 0.02);
      b.box(0.06, 0.35, 0.6, steel, [dx - 0.57, 1.25, dz], null, 0.02);
      b.label(
        0.85,
        0.42,
        poster('twb_bank', 'CLOTHES', 'BANK', '#2a7a3a', '#ffffff'),
        [dx - 0.565, 0.7, dz],
        [0, -PI / 2, 0]
      );
      S(dx - 0.55, dx + 0.55, dz - 0.5, dz + 0.5, 0, 1.85);
      // a split bag of clothes by it
      b.add(K.sphGeo(0.32, 10, 7), K.mat(0x1a1a1a, 0.4), {p: [dx - 0.95, 0.24, dz + 0.4], s: [1.1, 0.75, 0.9]});
      b.box(0.4, 0.05, 0.3, FLANNEL[0], [dx - 1.25, 0.05, dz + 0.1], [0, 0.6, 0], 0);
    }
    const fen = surf('fence');
    for (const fx of [-9.9, 9.9]) {
      b.box(0.06, 1.8, -17.6 - Z0, fen, [fx, 0.9, (Z0 - 17.6) / 2], null, 0);
      for (let pz = Z0 - 0.2; pz > -17.6; pz -= 2.2) b.box(0.1, 1.9, 0.1, fen, [fx, 0.95, pz], null, 0.01);
      b.box(0.1, 0.06, -17.6 - Z0, fen, [fx, 1.86, (Z0 - 17.6) / 2], null, 0);
      S(fx - 0.06, fx + 0.06, -17.6, Z0, 0, 1.9, true);
    }

    /* ---------- front apron: sidewalk-sale rail, A-board, planters, bench, bike rack, bins ---------- */
    {
      // rolling rail of flannels and coats on the apron
      const rx = -5.4,
        rz = 11.4;
      for (const s of [-1, 1]) {
        b.cyl(0.018, 0.018, 1.5, chrome, [rx + s * 0.9, 0.78, rz], null, 8);
        b.box(0.06, 0.03, 0.6, chrome, [rx + s * 0.9, 0.08, rz], null, 0);
        for (const t of [-0.25, 0.25])
          b.cyl(0.04, 0.04, 0.05, K.rubber(), [rx + s * 0.9, 0.04, rz + t], [PI / 2, 0, 0], 8);
      }
      railRun(rx, 1.5, rz, 0, 1.82, 'flannel', 12);
      S(rx - 1.0, rx + 1.0, rz - 0.35, rz + 0.35, 0, 1.55, true);
      // chalk A-board
      const aboard = K.paint('twb_aboard', 256, 340, (c, W, H) => {
        c.fillStyle = '#1e2420';
        c.fillRect(0, 0, W, H);
        c.fillStyle = '#ffffff';
        c.textAlign = 'center';
        c.font = 'bold 38px Arial, Helvetica, sans-serif';
        c.fillText('VINTAGE', W / 2, 70);
        c.fillText('& NEW', W / 2, 115);
        c.fillStyle = '#f2c418';
        c.font = 'bold 58px Impact, sans-serif';
        c.fillText('3 FOR', W / 2, 200);
        c.fillText('$20', W / 2, 262);
        c.fillStyle = '#3ee0f0';
        c.font = 'italic 26px Arial, sans-serif';
        c.fillText('all tees inside', W / 2, 310);
      });
      b.push([-2.5, 0, 11.0], [0, 0.25, 0]);
      for (const s of [-1, 1]) {
        b.box(0.62, 0.95, 0.03, wood, [0, 0.5, s * 0.15], [-s * 0.16, 0, 0], 0); // v090: tops lean in (was upside down)
        b.label(0.52, 0.72, aboard, [0, 0.52, s * 0.172], [-s * 0.16, s > 0 ? 0 : PI, 0]);
      }
      b.pop();
      S(-2.85, -2.15, 10.75, 11.25, 0, 0.95, true);
      // round planters with clipped bushes
      for (const px of [-2.6, 2.6]) {
        b.cyl(0.42, 0.36, 0.6, K.mat(0x34363a, 0.5), [px, 0.3, Z1 + 1.5], null, 18);
        b.cyl(0.38, 0.38, 0.03, soil, [px, 0.58, Z1 + 1.5], null, 16);
        b.add(K.sphGeo(0.45, 10, 8), leaf, {p: [px, 0.98, Z1 + 1.5], s: [1, 0.9, 1]});
        S(px - 0.42, px + 0.42, Z1 + 1.08, Z1 + 1.92, 0, 1.3, true);
      }
      // bench facing the street
      b.push([4.2, 0, 12.2], [0, 0, 0]);
      for (let i = 0; i < 3; i++) b.box(1.8, 0.04, 0.12, oak, [0, 0.45, -0.15 + i * 0.15], null, 0.01);
      for (let i = 0; i < 2; i++) b.box(1.8, 0.1, 0.03, oak, [0, 0.62 + i * 0.14, -0.27], [-0.15, 0, 0], 0.01);
      for (const s of [-0.8, 0.8]) {
        b.box(0.06, 0.45, 0.5, black, [s, 0.22, -0.05], null, 0.01);
        b.box(0.06, 0.4, 0.06, black, [s, 0.68, -0.28], null, 0.01);
      }
      b.pop();
      S(3.3, 5.1, 11.9, 12.5, 0, 0.9, true);
      // bike rack (three hoops) with one bike locked to it
      for (let i = 0; i < 3; i++) {
        const hx = 6.6 + i * 0.6;
        b.add(K.torGeo(0.38, 0.025, 6, 16, PI), galv, {p: [hx, 0.4, 12.4], r: [0, PI / 2, 0]});
        S(hx - 0.04, hx + 0.04, 12.0, 12.8, 0, 0.8, true);
      }
      {
        const bm = K.mat(0xd82a2a, 0.4, 0.5);
        b.push([7.2, 0, 12.4], [0, PI / 2, 0]);
        for (const s of [-0.5, 0.5]) b.add(K.torGeo(0.33, 0.02, 6, 20), K.rubber(), {p: [s, 0.35, 0.1], r: [0, 0, 0]});
        b.cyl(0.018, 0.018, 0.95, bm, [0, 0.55, 0.1], [0, 0, PI / 2 - 0.15], 6);
        b.cyl(0.018, 0.018, 0.55, bm, [-0.2, 0.5, 0.1], [0, 0, 0.5], 6);
        b.cyl(0.018, 0.018, 0.55, bm, [0.32, 0.5, 0.1], [0, 0, -0.5], 6);
        b.box(0.22, 0.05, 0.1, black, [-0.22, 0.82, 0.1], null, 0.01);
        b.box(0.04, 0.04, 0.5, black, [0.46, 0.92, 0.1], null, 0);
        b.pop();
      }
      // litter bins
      for (const bx of [-0.9 - 2.6, 8.9]) {
        b.cyl(0.26, 0.24, 0.9, K.mat(0x2a2c30, 0.5, 0.4), [bx, 0.45, bx > 0 ? 10.0 : 13.4], null, 14);
        b.cyl(0.28, 0.28, 0.05, K.mat(0x1a1a1c, 0.5, 0.4), [bx, 0.92, bx > 0 ? 10.0 : 13.4], null, 14);
        S(bx - 0.27, bx + 0.27, (bx > 0 ? 10.0 : 13.4) - 0.27, (bx > 0 ? 10.0 : 13.4) + 0.27, 0, 0.95, true);
      }
    }

    /* ---------- interior: floors, linings, ceilings, lights ---------- */
    const p = 0.075, // half a partition, so a lining lands on its face
      IN = 0.16;
    const flr = (x0, x1, z0, z1, m, y) =>
      b.box(x1 - x0, 0.02, z1 - z0, m, [(x0 + x1) / 2, y || 0.035, (z0 + z1) / 2], null, 0);
    const polish = K.tri(
      'twb_polish',
      (c, W, H, r) => {
        c.fillStyle = '#a8946e';
        c.fillRect(0, 0, W, H);
        P.noise(c, W, H, r, 9000, 0.08, '#5a4a32', 1.4);
        c.strokeStyle = 'rgba(40,30,20,0.35)';
        c.lineWidth = 2;
        c.strokeRect(1, 1, W - 2, H - 2);
      },
      {tile: 3.0, r: 0.35}
    );
    const tileW = K.tri(
      'twb_tile',
      (c, W, H) => {
        c.fillStyle = '#c8ccc8';
        c.fillRect(0, 0, W, H);
        const n = 4,
          s = W / n;
        c.fillStyle = '#f2f2ee';
        for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) c.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
      },
      {tile: 0.6, r: 0.3}
    );
    const carpet = K.surf('concrete', 0x4a5058);
    flr(X0 + IN, X1 - IN, PZ + p, Z1 - IN, polish);
    flr(X0 + IN, XO - p, Z0 + IN, PZ - p, K.surf('concrete', 0x8e8c86));
    flr(XO + p, X1 - IN, OZ + p, PZ - p, carpet);
    flr(XO + p, X1 - IN, TZ + p, OZ - p, K.mat(0x7a8a8a, 0.6));
    flr(XO + p, X1 - IN, Z0 + IN, TZ - p, tileW);
    // linings. Shop: white-washed walls with a black band to the deck. Back of house: painted block with a blue dado
    const whiteW = K.mat(0xf0eee8, 0.85),
      blackW = K.mat(0x1c1d20, 0.8),
      skirt = K.mat(0x2a2a2c, 0.6),
      blockW = K.mat(0xb8b8b2, 0.9),
      paleW = K.mat(0xd8dcd4, 0.85);
    const shopSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, Math.min(y1, 3.1), whiteW, 0.012, 0.006);
      if (y1 > 3.1) pc(u0, u1, Math.max(y0, 3.1), y1, blackW, 0.012, 0.006);
      if (y0 <= 0 && y1 > 0.2) pc(u0, u1, 0, 0.12, skirt, 0.03, 0.015);
    };
    const backSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, y1, blockW, 0.012, 0.006);
      if (y0 <= 0 && y1 > 1.0) pc(u0, u1, 0, 0.9, K.mat(0x3a4a5a, 0.7), 0.02, 0.01);
    };
    const offSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, y1, paleW, 0.012, 0.006);
      if (y0 <= 0 && y1 > 0.2) pc(u0, u1, 0, 0.1, skirt, 0.03, 0.015);
    };
    const tileSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, Math.min(y1, 1.8), tileW, 0.012, 0.006);
      if (y1 > 1.8) pc(u0, u1, Math.max(y0, 1.8), y1, whiteW, 0.012, 0.006);
    };
    const HT = H - 0.1;
    // shop floor
    LK.lineWall(b, 1, Z1, X0, X1, -1, FRONT, HT, shopSpan);
    LK.lineWall(b, 0, X0, PZ + p, Z1, 1, [], HT, shopSpan);
    LK.lineWall(b, 0, X1, PZ + p, Z1, -1, RIGHT, HT, shopSpan);
    LK.lineWall(b, 1, PZ + p, X0, X1, 1, PART, HT, shopSpan);
    // stock room
    LK.lineWall(b, 1, PZ - p, X0, XO - p, -1, PART, HT, backSpan);
    LK.lineWall(b, 0, X0, Z0, PZ - p, 1, [], HT, backSpan);
    LK.lineWall(b, 0, XO - p, Z0 + IN, PZ - p, -1, SIDE, HT, backSpan);
    LK.lineWall(b, 1, Z0, X0, BAY[0] - BAY[1] / 2, 1, [], BH, backSpan);
    LK.lineWall(b, 1, Z0, BAY[0] + BAY[1] / 2, XO - p, 1, BACKD, BH, backSpan);
    // office
    LK.lineWall(b, 1, PZ - p, XO + p, X1 - IN, -1, [], RC, offSpan);
    LK.lineWall(b, 0, X1, OZ + p, PZ - p, -1, [], RC, offSpan);
    LK.lineWall(b, 1, OZ + p, XO + p, X1 - IN, 1, [], RC, offSpan);
    LK.lineWall(b, 0, XO + p, OZ + p, PZ - p, 1, [SIDE[2]], RC, offSpan);
    // locker alcove
    LK.lineWall(b, 1, OZ - p, XO + p, X1 - IN, -1, [], RC, backSpan);
    LK.lineWall(b, 1, TZ + p, XO + p, X1 - IN, 1, [], RC, backSpan);
    LK.lineWall(b, 0, X1, TZ + p, OZ - p, -1, [], RC, backSpan);
    // staff toilet
    LK.lineWall(b, 1, TZ - p, XO + p, X1 - IN, -1, [], RC, tileSpan);
    LK.lineWall(b, 0, X1, Z0 + IN, TZ - p, -1, [], RC, tileSpan);
    LK.lineWall(b, 1, Z0, XO + p, X1 - IN, 1, [], RC, tileSpan);
    LK.lineWall(b, 0, XO + p, Z0 + IN, TZ - p, 1, [SIDE[0]], RC, tileSpan);
    // ceilings: the shop and stock room are open to a black / grey deck on joists; the small rooms get a ceiling at RC
    b.box(X1 - X0 - 0.3, 0.04, Z1 - PZ - 0.2, blackW, [0, H - 0.06, (PZ + Z1) / 2], null, 0);
    b.box(
      XO - X0 - 0.3,
      0.04,
      PZ - Z0 - 0.2,
      K.mat(0x6a6c70, 0.7, 0.3),
      [(X0 + XO) / 2, H - 0.06, (Z0 + PZ) / 2],
      null,
      0
    );
    for (let jz = PZ + 0.8; jz < Z1; jz += 1.6)
      b.box(X1 - X0 - 0.3, 0.3, 0.08, K.mat(0x26272a, 0.6, 0.4), [0, H - 0.24, jz], null, 0);
    for (let jz = Z0 + 0.8; jz < PZ; jz += 1.6)
      b.box(XO - X0 - 0.3, 0.3, 0.08, K.mat(0x4a5a6a, 0.5, 0.6), [(X0 + XO) / 2, H - 0.24, jz], null, 0);
    b.box(X1 - XO - 0.2, 0.04, PZ - Z0 - 0.2, K.mat(0xe8e6e0, 0.9), [(XO + X1) / 2, RC + 0.02, (Z0 + PZ) / 2], null, 0);
    // exposed spiral ducts and a cable tray over the shop, painted black
    const ductM = K.mat(0x2a2b2e, 0.5, 0.6);
    for (const dx of [-4.2, 4.2]) {
      b.cyl(0.32, 0.32, Z1 - PZ - 0.6, ductM, [dx, H - 0.7, (PZ + Z1) / 2], [PI / 2, 0, 0], 16);
      for (let dz = PZ + 1.5; dz < Z1 - 0.5; dz += 3) {
        b.cyl(0.34, 0.34, 0.06, ductM, [dx, H - 0.7, dz], [PI / 2, 0, 0], 16);
        b.box(0.04, 0.4, 0.04, ductM, [dx, H - 0.25, dz], null, 0);
      }
    }
    b.box(0.3, 0.06, Z1 - PZ - 0.6, K.mat(0x3a3b3e, 0.5, 0.6), [0, H - 0.5, (PZ + Z1) / 2], null, 0);
    // orange enamel pendants on long cords (the shop's signature look)
    const enamel = K.mat(0xe86a1a, 0.35, 0.2),
      enamelIn = K.mat(0xfff4e0, 0.4, 0, {emissive: 0xfff0d0, emissiveIntensity: 1.2});
    const pendant = (x, z, y) => {
      b.cyl(0.006, 0.006, H - 0.1 - y, black, [x, (H - 0.1 + y) / 2, z], null, 4);
      b.cyl(0.05, 0.05, 0.12, black, [x, y - 0.04, z], null, 10);
      b.cyl(0.08, 0.34, 0.24, enamel, [x, y - 0.2, z], null, 18);
      b.cyl(0.33, 0.33, 0.012, enamelIn, [x, y - 0.32, z], null, 18);
    };
    for (const [x, z] of [
      [-6.0, -1.2],
      [-3.0, -1.2],
      [0.0, -1.2],
      [-5.6, 2.6],
      [-1.8, 2.6],
      [1.8, 2.6],
      [5.6, 2.6],
      [-4.0, 6.4],
      [0.0, 6.4],
      [4.0, 6.4],
      [6.0, -0.4]
    ])
      pendant(x, z, 3.4);
    // track lights over the shelving wall and the wall rails
    const track = (x0, x1, z, n) => {
      b.box(x1 - x0, 0.04, 0.05, black, [(x0 + x1) / 2, 3.6, z], null, 0);
      for (let i = 0; i < n; i++) {
        const tx = x0 + ((x1 - x0) * (i + 0.5)) / n;
        b.cyl(0.035, 0.045, 0.14, black, [tx, 3.5, z], [-0.5, 0, 0], 8);
        b.cyl(0.04, 0.04, 0.01, warm, [tx, 3.43, z + 0.04], [-0.5, 0, 0], 8);
      }
    };
    track(-8.2, 0.4, PZ + 1.4, 7);
    b.box(0.05, 0.04, 9.0, black, [X0 + 1.3, 3.6, 2.6], null, 0);
    for (let i = 0; i < 5; i++) b.cyl(0.035, 0.045, 0.14, black, [X0 + 1.3, 3.5, -1.2 + i * 1.9], [0, 0, 0.5], 8);
    // battens in the stock room, panels in the small rooms
    const hous = K.mat(0xd8d8d4, 0.5, 0.2);
    for (const [lx, lz] of [
      [-6.2, -5],
      [-6.2, -9],
      [-1.4, -5],
      [-1.4, -9]
    ]) {
      b.box(1.3, 0.07, 0.18, hous, [lx, H - 0.45, lz], null, 0.01);
      b.box(1.22, 0.012, 0.12, lit, [lx, H - 0.49, lz], null, 0);
    }
    for (const [lx, lz] of [
      [6.0, -4.8],
      [6.0, -7.6],
      [6.0, -9.8]
    ]) {
      b.box(0.62, 0.03, 0.62, hous, [lx, RC - 0.01, lz], null, 0.005);
      b.box(0.56, 0.01, 0.56, lit, [lx, RC - 0.03, lz], null, 0);
    }

    /* ---------- the oak shelving wall: top shelf of vintage props, hanging rails below ---------- */
    {
      const SX0 = -8.3,
        BW = 1.22,
        NB = 7,
        SZ = PZ + p, // wall face
        DEP = 0.55,
        TOP = 2.4;
      const oakU = K.veneer(0xc09060);
      for (let i = 0; i <= NB; i++)
        b.box(0.06, TOP + 0.05, DEP, oakU, [SX0 + i * BW, (TOP + 0.05) / 2, SZ + DEP / 2], null, 0.005);
      b.box(NB * BW + 0.1, 0.05, DEP + 0.05, oakU, [SX0 + (NB * BW) / 2, TOP, SZ + DEP / 2 + 0.02], null, 0.005);
      b.box(NB * BW + 0.1, 0.12, 0.03, oakU, [SX0 + (NB * BW) / 2, TOP - 0.08, SZ + DEP + 0.03], null, 0);
      b.box(NB * BW, 0.08, 0.02, K.veneer(0xd8b080), [SX0 + (NB * BW) / 2, 0.04, SZ + DEP], null, 0); // kick plate
      S(SX0 - 0.05, SX0 + NB * BW + 0.05, SZ, SZ + DEP + 0.05, 0, TOP + 0.05, true);
      // the bays: 'f' = one tee hung facing out over a rail of jeans; 's' = two rails of side-hung garments
      const plan = [
        ['s', 'flannel', 'jeans'],
        ['f', 'tee', 'jeans'],
        ['s', 'coat', null],
        ['s', 'tee', 'jeans'],
        ['f', 'tee', 'tee'],
        ['s', 'flannel', 'jeans'],
        ['s', 'tee', 'coat']
      ];
      plan.forEach(([mode, up, low], i) => {
        const cx = SX0 + (i + 0.5) * BW,
          rz = SZ + DEP / 2;
        if (mode === 'f') {
          b.box(0.03, 0.03, DEP - 0.1, chrome, [cx, 2.22, rz], null, 0);
          hangFront(cx, 2.2, SZ + 0.12, 0, up, tm(i === 1 ? 0xe8e4d8 : 0x1a1a1a));
          // a small round print on the shirt
          b.cyl(0.11, 0.11, 0.004, tm(i === 1 ? 0x2a2c30 : 0xe8e4d8), [cx, 1.88, SZ + 0.145], [PI / 2, 0, 0], 16);
          railRun(cx, 1.15, rz, 0, BW - 0.08, low, 9);
        } else {
          railRun(cx, 2.15, rz, 0, BW - 0.08, up, up === 'coat' ? 8 : 10);
          if (low) railRun(cx, 1.12, rz, 0, BW - 0.08, low, 9);
        }
      });
      // top shelf: speakers, plants, a boom box, suitcases, caps, bowling pins, the round THREADS sign
      const spk = x => {
        rb(0.42, 0.62, 0.36, 0.02, K.veneer(0x8a5a32), [x, TOP + 0.34, SZ + 0.26]);
        b.box(0.36, 0.56, 0.01, K.mat(0x1a1a1a, 0.9), [x, TOP + 0.34, SZ + 0.445], null, 0);
        b.cyl(0.13, 0.13, 0.02, K.mat(0x2a2a2a, 0.6), [x, TOP + 0.26, SZ + 0.455], [PI / 2, 0, 0], 16);
        b.cyl(0.06, 0.06, 0.02, K.mat(0x2a2a2a, 0.6), [x, TOP + 0.5, SZ + 0.455], [PI / 2, 0, 0], 12);
      };
      spk(SX0 + 0.35);
      spk(SX0 + NB * BW - 0.35);
      const plant = (x, s) => {
        b.cyl(0.12 * s, 0.1 * s, 0.24 * s, K.mat(0x2a2a2c, 0.6), [x, TOP + 0.13 * s, SZ + 0.26], null, 12);
        for (let k = 0; k < 7; k++) {
          const q = (k / 7) * PI * 2;
          b.box(
            0.05,
            0.5 * s,
            0.015,
            k % 2 ? leaf : leaf2,
            [x + Math.cos(q) * 0.1 * s, TOP + 0.45 * s, SZ + 0.26 + Math.sin(q) * 0.1 * s],
            [Math.sin(q) * 0.5, -q, Math.cos(q) * 0.5],
            0
          );
        }
      };
      plant(SX0 + 1.0, 1.1);
      plant(SX0 + 6.4, 1);
      plant(SX0 + 8.1, 1.2);
      // boom box
      b.box(0.6, 0.3, 0.16, K.mat(0xb8bcc0, 0.4, 0.6), [SX0 + 1.8, TOP + 0.17, SZ + 0.28], null, 0.02);
      for (const s of [-1, 1])
        b.cyl(
          0.08,
          0.08,
          0.01,
          K.mat(0x1a1a1a, 0.7),
          [SX0 + 1.8 + s * 0.19, TOP + 0.15, SZ + 0.365],
          [PI / 2, 0, 0],
          14
        );
      b.box(0.4, 0.02, 0.02, chrome, [SX0 + 1.8, TOP + 0.38, SZ + 0.28], null, 0);
      // stacked vintage suitcases
      b.box(0.62, 0.2, 0.38, K.mat(0x6a3a22, 0.6), [SX0 + 2.7, TOP + 0.12, SZ + 0.26], null, 0.02);
      b.box(0.5, 0.18, 0.32, K.mat(0x2a4a5a, 0.6), [SX0 + 2.7, TOP + 0.31, SZ + 0.26], [0, 0.1, 0], 0.02);
      // the round THREADS sign (rope-edged disc)
      const roundel = K.paint(
        'twb_roundel',
        256,
        256,
        (c, W, H) => {
          c.clearRect(0, 0, W, H);
          c.fillStyle = '#1c1e22';
          c.beginPath();
          c.arc(W / 2, H / 2, 124, 0, PI * 2);
          c.fill();
          c.strokeStyle = '#e86a1a';
          c.lineWidth = 8;
          c.beginPath();
          c.arc(W / 2, H / 2, 114, 0, PI * 2);
          c.stroke();
          c.strokeStyle = '#e8e4d8';
          c.lineWidth = 3;
          for (let k = -3; k <= 3; k++) {
            c.beginPath();
            c.ellipse(W / 2, H / 2, 100, Math.abs(k) * 30 + 6, 0, 0, PI * 2);
            c.stroke();
          }
          c.fillStyle = '#e86a1a';
          c.fillRect(20, H / 2 - 34, W - 40, 68);
          c.fillStyle = '#ffffff';
          c.font = 'bold 50px Impact, Arial Black, sans-serif';
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.fillText('THREADS', W / 2, H / 2 + 3);
        },
        {alpha: 1}
      );
      b.label(0.9, 0.9, roundel, [SX0 + 3.9, TOP + 0.5, SZ + 0.2]);
      // caps in a row
      for (let k = 0; k < 4; k++) {
        const cx = SX0 + 4.7 + k * 0.3,
          cm = tm([0xd82a2a, 0x1e3a8a, 0x1a1a1a, 0xe8e4d8][k]);
        b.add(K.sphGeo(0.1, 10, 6, 0, PI / 2), cm, {p: [cx, TOP + 0.03, SZ + 0.3]});
        b.box(0.14, 0.01, 0.1, cm, [cx, TOP + 0.03, SZ + 0.43], null, 0);
      }
      // bowling pins
      for (let k = 0; k < 3; k++) {
        const bx = SX0 + 7.25 + k * 0.17;
        b.cyl(0.045, 0.06, 0.34, K.mat(0xf4f2ee, 0.3), [bx, TOP + 0.2, SZ + 0.3], null, 10);
        b.cyl(0.04, 0.04, 0.03, K.mat(0xd82a2a, 0.4), [bx, TOP + 0.3, SZ + 0.3], null, 10);
      }
    }

    /* ---------- fitting rooms: three cubicles against the partition, right of the staff doors ---------- */
    {
      const FX0 = 3.7,
        FW = 1.5,
        FD = 1.45,
        FZ = PZ + p;
      const panel = K.veneer(0xc09060),
        curtain = K.mat(0x1a6a7a, 0.95),
        mirror = K.mat(0xd8e6ee, 0.05, 0.95);
      for (let i = 0; i <= 3; i++) {
        const px = FX0 + i * FW;
        b.box(0.05, 2.2, FD, panel, [px, 1.15, FZ + FD / 2], null, 0.005);
        S(px - 0.03, px + 0.03, FZ, FZ + FD, 0, 2.25, true);
      }
      b.box(3 * FW + 0.05, 0.12, 0.06, panel, [FX0 + 1.5 * FW, 2.3, FZ + FD], null, 0);
      for (let i = 0; i < 3; i++) {
        const cx = FX0 + (i + 0.5) * FW;
        b.cyl(0.012, 0.012, FW - 0.06, chrome, [cx, 2.15, FZ + FD - 0.05], [0, 0, PI / 2], 6);
        // curtain gathered to one side (folds), leaving the cubicle open
        const open = i === 1 ? 0.4 : 0.75;
        const cw = (FW - 0.1) * (1 - open);
        for (let k = 0; k < 5; k++) {
          const fx = cx - (FW - 0.1) / 2 + (cw * (k + 0.5)) / 5;
          b.box(cw / 5 + 0.02, 1.95, 0.04, curtain, [fx, 1.15, FZ + FD - 0.05 + (k % 2 ? 0.03 : 0)], null, 0);
        }
        b.box(0.7, 1.6, 0.02, mirror, [cx, 1.2, FZ + 0.02], null, 0);
        b.box(0.06, 0.04, 0.12, chrome, [cx - 0.5, 1.75, FZ + 0.06], null, 0); // hook
        b.cyl(0.16, 0.16, 0.04, K.mat(0x2a2a2c, 0.6), [cx + 0.4, 0.45, FZ + 0.5], null, 12);
        b.cyl(0.02, 0.02, 0.43, chrome, [cx + 0.4, 0.22, FZ + 0.5], null, 6);
        S(cx + 0.22, cx + 0.58, FZ + 0.32, FZ + 0.68, 0, 0.47, true);
      }
      b.label(
        1.8,
        0.24,
        strapMat('twb_fit', 'FITTING ROOMS', 'bold 40px Arial, Helvetica, sans-serif', INK, '#ffffff'),
        [FX0 + 1.5 * FW, 2.62, FZ + FD - 0.02]
      );
      b.box(1.9, 0.3, 0.04, black, [FX0 + 1.5 * FW, 2.62, FZ + FD - 0.05], null, 0);
    }

    /* ---------- cash wrap: glass display counter and till in front of the painted mural wall ---------- */
    {
      const CX = 6.5,
        CZ0 = 0.4,
        CZ1 = 3.3;
      const cMid = (CZ0 + CZ1) / 2,
        cL = CZ1 - CZ0;
      b.box(0.6, 0.75, cL, K.mat(0xe8e8e4, 0.5), [CX, 0.375, cMid], null, 0.01);
      b.box(0.62, 0.05, cL + 0.02, alu, [CX, 0.77, cMid], null, 0.005);
      b.box(0.56, 0.32, cL - 0.04, K.glass(0xdfeef4, 0.3), [CX, 0.96, cMid], null, 0);
      b.box(0.62, 0.03, cL + 0.02, K.glass(0xdfeef4, 0.4), [CX, 1.13, cMid], null, 0);
      b.box(0.5, 0.01, cL - 0.1, lit, [CX, 1.11, cMid], null, 0);
      // accessories inside the glass: sunglasses, watches, bracelets, belts
      for (let k = 0; k < 6; k++) {
        const az = CZ0 + 0.3 + k * 0.45;
        b.box(0.14, 0.04, 0.05, K.mat(0x1a1a1a, 0.3), [CX - 0.1, 0.83, az], [0, 0.3, 0], 0.01);
        b.add(K.torGeo(0.04, 0.008, 4, 12), K.mat(0xd8b040, 0.3, 0.9), {p: [CX + 0.12, 0.83, az], r: [PI / 2, 0, 0]});
        b.box(0.08, 0.02, 0.24, tm(TEE[k * 2]), [CX + 0.02, 0.81, az + 0.18], null, 0);
      }
      S(CX - 0.32, CX + 0.32, CZ0, CZ1, 0, 1.15);
      // a low back counter with bags and tissue paper against the right wall
      b.box(0.5, 0.9, 2.2, K.veneer(0xc09060), [X1 - 0.41, 0.45, 1.8], null, 0.01);
      S(X1 - 0.66, X1 - 0.16, 0.7, 2.9, 0, 0.9, true);
      for (let k = 0; k < 4; k++) {
        b.box(
          0.32,
          0.38,
          0.12,
          K.mat(k % 2 ? 0x1a9ad8 : 0xe8e4d8, 0.8),
          [X1 - 0.42, 1.09, 1.0 + k * 0.18],
          [0, PI / 2, 0],
          0
        );
        b.box(0.12, 0.06, 0.01, black, [X1 - 0.42, 1.31, 1.0 + k * 0.18], [0, PI / 2, 0], 0);
      }
      b.box(0.4, 0.06, 0.5, K.mat(0xf2c8d8, 0.9), [X1 - 0.42, 0.93, 2.5], null, 0);
      // card machine on the counter
      b.box(0.08, 0.03, 0.14, black, [CX + 0.05, 1.16, 2.9], [0.2, 0, 0], 0.01);
      // the mural over the cash wrap: graffiti script on a dusty pink wall with a pair of lips
      const wall = K.paint('twb_wallmural', 1024, 400, (c, W, H) => {
        c.fillStyle = '#c83a4a';
        c.fillRect(0, 0, W, H);
        c.fillStyle = '#e8e2d8';
        c.beginPath();
        c.ellipse(W / 2, H / 2, W / 2 - 20, H / 2 - 30, 0, 0, PI * 2);
        c.fill();
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.font = 'italic 900 120px Impact, Arial Black, sans-serif';
        c.lineWidth = 12;
        c.strokeStyle = '#1c1e22';
        c.strokeText('Threads', W / 2 + 40, H * 0.38);
        c.fillStyle = '#1c1e22';
        c.fillText('Threads', W / 2 + 40, H * 0.38);
        c.font = 'italic 900 92px Impact, Arial Black, sans-serif';
        c.strokeStyle = '#ffffff';
        c.lineWidth = 6;
        c.strokeText('with Benefits', W / 2 + 40, H * 0.68);
        c.fillStyle = '#c83a4a';
        c.fillText('with Benefits', W / 2 + 40, H * 0.68);
        // a pair of red lips on the left
        c.fillStyle = '#a81a2a';
        c.beginPath();
        c.ellipse(150, H / 2, 90, 46, 0, 0, PI * 2);
        c.fill();
        c.fillStyle = '#ffffff';
        c.fillRect(80, H / 2 - 8, 140, 14);
        c.strokeStyle = '#1c1e22';
        c.lineWidth = 6;
        c.beginPath();
        c.ellipse(150, H / 2, 90, 46, 0, 0, PI * 2);
        c.stroke();
      });
      b.label(4.6, 1.8, wall, [X1 - 0.17, 2.4, 1.4], [0, -PI / 2, 0]);
      // a fluffy pink rug in front of the counter
      b.box(1.6, 0.03, 2.2, K.mat(0xf2a8c8, 0.98), [CX - 1.3, 0.05, cMid], null, 0);
    }

    /* ---------- left wall: long rail of coats and flannels, the cap wall by the window ---------- */
    {
      const rx = X0 + 0.16 + 0.34;
      for (const az of [-2.1, 1.0, 3.9]) {
        b.box(0.34, 0.03, 0.03, chrome, [X0 + 0.33, 2.0, az], null, 0);
        b.box(0.03, 0.2, 0.03, chrome, [X0 + 0.18, 1.93, az], null, 0);
      }
      railRun(rx, 2.0, -0.9, PI / 2, 2.4, 'coat', 12);
      railRun(rx, 2.0, 2.45, PI / 2, 2.9, 'flannel', 18);
      S(X0 + 0.16, X0 + 0.8, -2.2, 4.0, 0, 2.05, true);
      // cap wall: pegs in a grid with caps, a ledge of folded tees below
      const capC = [0xd82a2a, 0x1e3a8a, 0x1a1a1a, 0xe8e4d8, 0x2a8a4a, 0xe8b020, 0x5a6a7a, 0xe86a20];
      for (let r = 0; r < 4; r++)
        for (let k = 0; k < 6; k++) {
          const cz = 4.75 + k * 0.5,
            cy = 1.5 + r * 0.32,
            cm = tm(capC[(r * 3 + k) % 8]);
          b.cyl(0.008, 0.008, 0.12, chrome, [X0 + 0.22, cy + 0.08, cz], [0, 0, PI / 2], 4);
          b.add(K.sphGeo(0.1, 8, 5, 0, PI / 2), cm, {p: [X0 + 0.3, cy, cz], r: [0, 0, -PI / 2 + 0.25]});
          b.box(0.1, 0.01, 0.14, cm, [X0 + 0.42, cy - 0.06, cz], [0, 0, -0.5], 0);
        }
      b.box(0.45, 0.04, 3.1, K.veneer(0xc09060), [X0 + 0.38, 1.05, 6.0], null, 0.005);
      for (const s of [4.6, 7.4]) b.box(0.4, 1.03, 0.04, K.veneer(0xc09060), [X0 + 0.38, 0.52, s], null, 0);
      for (let k = 0; k < 5; k++) folded(X0 + 0.38, 1.07, 4.95 + k * 0.55, PI / 2, 5 + (k % 3), TEE);
      S(X0 + 0.16, X0 + 0.62, 4.5, 7.5, 0, 1.1, true);
      mannequin(-6.9, 4.4, PI / 2, {top: 0x2a2c30, coat: 0x8a6a42, bot: 0x3a5a8a, hat: 0x1a1a1a});
    }

    /* ---------- floor fixtures: round racks, T-racks, the shoe table, the centre mannequin display ---------- */
    {
      const stl = K.mat(0x9a9ea2, 0.35, 0.8);
      const roundRack = (x, z, kind, n) => {
        b.cyl(0.025, 0.025, 1.3, stl, [x, 0.65, z], null, 8);
        for (let k = 0; k < 4; k++) {
          const q = (k * PI) / 2;
          b.box(0.6, 0.03, 0.04, stl, [x + Math.cos(q) * 0.3, 0.03, z + Math.sin(q) * 0.3], [0, -q, 0], 0);
        }
        b.add(K.torGeo(0.6, 0.015, 6, 32), stl, {p: [x, 1.35, z], r: [PI / 2, 0, 0]});
        for (let k = 0; k < 2; k++) b.box(1.2, 0.02, 0.02, stl, [x, 1.35, z], [0, (k * PI) / 2, 0], 0);
        for (let k = 0; k < n; k++) {
          if (rnd() < 0.07) continue;
          const q = (k / n) * PI * 2;
          hangSide(x + Math.cos(q) * 0.6, 1.35, z + Math.sin(q) * 0.6, -q, kind);
        }
        S(x - 0.85, x + 0.85, z - 0.85, z + 0.85, 0, 1.4, true);
      };
      roundRack(-4.0, 5.6, 'flannel', 26);
      roundRack(3.6, 5.2, 'tee', 30);
      const tRack = (x, z, a, kind) => {
        b.push([x, 0, z], [0, a, 0]);
        b.cyl(0.025, 0.025, 1.45, stl, [0, 0.72, 0], null, 8);
        b.box(0.6, 0.03, 0.6, stl, [0, 0.02, 0], null, 0);
        b.box(1.3, 0.025, 0.025, stl, [0, 1.45, 0], null, 0);
        b.pop();
        const c = Math.cos(a),
          s = Math.sin(a);
        for (const side of [-1, 1]) {
          const ox = side * 0.62;
          railRun(x + c * ox, 1.45, z - s * ox, a + PI / 2, 0.8, kind, 6);
        }
        S(x - 0.9, x + 0.9, z - 0.9, z + 0.9, 0, 1.45, true);
      };
      tRack(-4.6, 2.0, 0, 'coat');
      tRack(-2.8, -0.6, 0, 'jeans');
      // round shoe table over a ring rail of tees (sneakers on top)
      {
        const tx = 3.0,
          tz = 1.6;
        b.cyl(0.035, 0.035, 1.12, stl, [tx, 0.56, tz], null, 8);
        b.cyl(0.35, 0.4, 0.04, stl, [tx, 0.02, tz], null, 16);
        b.add(K.torGeo(0.78, 0.015, 6, 32), stl, {p: [tx, 1.02, tz], r: [PI / 2, 0, 0]});
        b.cyl(0.72, 0.72, 0.05, K.veneer(0x6a4a2a), [tx, 1.14, tz], null, 28);
        b.cyl(0.74, 0.74, 0.02, K.mat(0x1a1a1a, 0.5), [tx, 1.11, tz], null, 28);
        for (let k = 0; k < 24; k++) {
          const q = (k / 24) * PI * 2;
          hangSide(tx + Math.cos(q) * 0.78, 1.02, tz + Math.sin(q) * 0.78, -q, 'tee');
        }
        const shoeC = [0xf4f4f0, 0x1a1a1a, 0x1e3a8a, 0xd82a2a, 0x8a8a86, 0xe8b020];
        for (let k = 0; k < 9; k++) {
          const q = (k / 9) * PI * 2,
            r = k % 2 ? 0.48 : 0.3;
          const sx = tx + Math.cos(q) * r,
            sz = tz + Math.sin(q) * r,
            sm = tm(shoeC[k % 6]);
          b.push([sx, 1.165, sz], [0, -q + PI / 2, 0]);
          b.box(0.11, 0.03, 0.28, K.mat(0xf8f8f4, 0.6), [0, 0.015, 0], null, 0.01);
          b.rbox(0.1, 0.08, 0.26, 0.03, sm, [0, 0.07, -0.01]);
          b.box(0.09, 0.05, 0.08, sm, [0, 0.13, -0.08], null, 0.01);
          b.pop();
        }
        S(tx - 0.95, tx + 0.95, tz - 0.95, tz + 0.95, 0, 1.2, true);
      }
      // centre display: two mannequins on a round white plinth, a grey shag rug
      b.cyl(1.25, 1.25, 0.02, K.mat(0x5a5a5e, 0.98), [0, 0.045, 4.2], null, 28);
      b.cyl(0.75, 0.8, 0.22, K.mat(0xf4f4f0, 0.45), [0, 0.11, 4.2], null, 24);
      S(-0.8, 0.8, 3.4, 5.0, 0, 0.22, true);
      mannequin(-0.3, 4.2, 0.3, {dress: true, top: 0xc81a2a, y: 0.22});
      mannequin(0.35, 4.15, -0.4, {top: 0x1a1a1a, bot: 0x1a1a1a, coat: 0x2a2a2a, y: 0.22});
      // a knocked-over mannequin by the shelving wall
      mannequin(-6.0, -1.0, 1.2, {top: 0x2a8a4a, bot: 0x2a3e6a, fallen: true});
      // hanging zone signs
      const zoneSign = (key, text, x, z, a) => {
        const m = strapMat(key, text, 'bold 46px Arial, Helvetica, sans-serif', INK, '#ffffff');
        b.push([x, 3.0, z], [0, a || 0, 0]);
        b.box(1.8, 0.32, 0.05, black, [0, 0, 0], null, 0.01);
        for (const s of [-1, 1]) b.label(1.74, 0.26, m, [0, 0, s * 0.03], [0, s > 0 ? 0 : PI, 0]);
        for (const s of [-0.7, 0.7]) b.cyl(0.005, 0.005, H - 3.3, steel, [s, (H - 3.0) / 2 + 0.05, 0], null, 4);
        b.pop();
      };
      zoneSign('twb_zs1', 'VINTAGE', -4.6, 3.8);
      zoneSign('twb_zs2', 'DENIM', -3.0, -1.6);
      zoneSign('twb_zs3', 'TEES', 3.6, 3.6);
      zoneSign('twb_zs4', 'SHOES', 3.0, 0.2);
    }

    /* ---------- stock room: hazard lane, rolling rails of stock, bales, sorting table, roll cages ---------- */
    {
      const [c, w] = BAY;
      for (const s of [-1, 1]) b.box(0.1, 0.01, 3.0, yel, [c + s * (w / 2 - 0.15), 0.05, Z0 + 1.6], null, 0);
      b.label(w - 0.3, 0.2, hazard, [c, 0.05, Z0 + 0.25], [-PI / 2, 0, 0]);
      // rolling Z-racks with garments in clear covers
      const stl = K.mat(0x9a9ea2, 0.35, 0.8),
        cover = K.glass(0xe8f0f4, 0.35);
      const zrack = (x, z, kind) => {
        for (const s of [-1, 1]) {
          b.cyl(0.02, 0.02, 1.75, stl, [x + s * 0.8, 0.95, z], null, 6);
          b.box(0.06, 0.04, 0.7, stl, [x + s * 0.8 - s * 0.1, 0.1, z], [0, s * 0.3, 0], 0);
        }
        railRun(x, 1.8, z, 0, 1.7, kind, 14);
        b.box(1.5, 1.0, 0.52, cover, [x, 1.22, z], null, 0);
        S(x - 0.9, x + 0.9, z - 0.4, z + 0.4, 0, 1.85, true);
      };
      zrack(-0.6, -4.3, 'coat');
      zrack(-0.6, -5.7, 'flannel');
      // bales of stock in clear plastic, on pallets
      for (const [bx, bz, n] of [
        [-1.5, -9.9, 2],
        [-0.1, -9.9, 1]
      ]) {
        b.box(1.2, 0.14, 1.0, wood, [bx, 0.07, bz], null, 0);
        for (let j = 0; j < n; j++) {
          b.box(1.1, 0.5, 0.9, tm(TEE[(j * 3 + Math.round(bx * 2)) & 7]), [bx, 0.4 + j * 0.52, bz], null, 0.04);
          b.box(1.14, 0.52, 0.94, K.glass(0xe8f0f4, 0.3), [bx, 0.4 + j * 0.52, bz], null, 0.04);
        }
        S(bx - 0.6, bx + 0.6, bz - 0.5, bz + 0.5, 0, 0.15 + n * 0.52, true);
      }
      // sorting table with an open box, a garment steamer and a tagging gun
      b.box(1.8, 0.05, 0.85, K.mat(0xd8d4c8, 0.6), [0.9, 0.9, -7.6], null, 0.01);
      for (const sx of [-0.8, 0.8])
        for (const sz of [-0.35, 0.35]) b.box(0.05, 0.88, 0.05, stl, [0.9 + sx, 0.44, -7.6 + sz], null, 0);
      S(0.0, 1.8, -8.05, -7.15, 0, 0.95, true);
      b.box(0.5, 0.3, 0.4, K.surf('cardboard', 0xb8946a), [0.5, 1.08, -7.6], null, 0.01);
      folded(1.2, 0.93, -7.7, 0.1, 4, [0x1e3a8a, 0xe8e4d8, 0x1a1a1a]);
      // v089: the steamer tucked in by the table (it stood in front of the locker alcove)
      b.cyl(0.15, 0.17, 0.35, K.mat(0xe8e8e4, 0.5), [1.95, 0.18, -6.9], null, 12);
      b.cyl(0.012, 0.012, 1.5, chrome, [1.95, 1.0, -6.9], null, 6);
      b.box(0.14, 0.2, 0.08, K.mat(0x1a9ad8, 0.5), [1.95, 1.75, -6.9], null, 0.02);
      // roll cages against the partition
      const cage = (x, z) => {
        b.frame(0.7, 1.7, 0.03, stl, [x, 0.95, z - 0.4], 0.03);
        b.frame(0.7, 1.7, 0.03, stl, [x, 0.95, z + 0.4], 0.03);
        b.push([x - 0.35, 0.95, z], [0, PI / 2, 0]);
        b.frame(0.8, 1.7, 0.03, stl, [0, 0, 0], 0.03);
        b.pop();
        b.box(0.7, 0.04, 0.8, stl, [x, 0.12, z], null, 0);
        b.box(0.62, 0.7, 0.72, K.surf('cardboard', 0xb8946a), [x, 0.5, z], null, 0.01);
        S(x - 0.37, x + 0.37, z - 0.42, z + 0.42, 0, 1.8, true);
      };
      cage(-2.4, -3.6);
      cage(-3.3, -3.6);
    }

    /* ---------- office: desk, chair, CCTV monitor, safe, cork board, clock ---------- */
    {
      // office chair at the desk (the desk itself is a loot prop)
      const ox = 6.6,
        oz = -5.4;
      b.cyl(0.25, 0.25, 0.04, black, [ox, 0.08, oz], null, 5);
      b.cyl(0.03, 0.03, 0.4, chrome, [ox, 0.28, oz], null, 8);
      b.box(0.48, 0.08, 0.46, K.mat(0x2a2a2c, 0.7), [ox, 0.5, oz], null, 0.02);
      b.box(0.46, 0.55, 0.06, K.mat(0x2a2a2c, 0.7), [ox, 0.82, oz + 0.25], null, 0.02);
      S(ox - 0.27, ox + 0.27, oz - 0.27, oz + 0.27, 0, 1.1, true);
      // CCTV monitor on a wall bracket
      b.box(0.55, 0.36, 0.06, black, [X1 - 0.3, 2.0, -5.6], [0, -PI / 2 + 0.25, 0], 0.01);
      const cctv = K.paint(
        'twb_cctv',
        256,
        160,
        (c, W, H) => {
          c.fillStyle = '#1a2a22';
          c.fillRect(0, 0, W, H);
          c.strokeStyle = '#6a8a7a';
          c.lineWidth = 2;
          c.strokeRect(W / 2, 0, 1, H);
          c.strokeRect(0, H / 2, W, 1);
          c.fillStyle = '#4a6a5a';
          for (let i = 0; i < 4; i++) c.fillRect(20 + (i % 2) * 128, 20 + Math.floor(i / 2) * 80, 60, 30);
          c.fillStyle = '#9ae8a8';
          c.font = '12px monospace';
          c.fillText('CAM 1  REC', 8, 14);
        },
        {glow: 0.7}
      );
      b.label(0.5, 0.31, cctv, [X1 - 0.34, 2.0, -5.6 + 0.01], [0, -PI / 2 + 0.25, 0]);
      // a floor safe
      rb(0.55, 0.65, 0.55, 0.03, K.mat(0x3a3e42, 0.4, 0.6), [X1 - 0.45, 0.33, -3.55]);
      b.cyl(0.07, 0.07, 0.03, chrome, [X1 - 0.73, 0.4, -3.55], [0, 0, PI / 2], 12);
      S(X1 - 0.73, X1 - 0.17, -3.83, -3.27, 0, 0.66);
      // cork board with pinned rotas, a wall clock
      b.box(1.1, 0.75, 0.03, K.mat(0xb08a5a, 0.95), [5.0, 1.7, OZ + p + 0.02], null, 0);
      for (let k = 0; k < 6; k++)
        b.box(
          0.2,
          0.26,
          0.005,
          tm([0xf8f8f0, 0xf2e88a, 0xf8f8f0, 0xa8d8f0, 0xf8f8f0, 0xf2b8c8][k]),
          [4.6 + (k % 3) * 0.38, 1.85 - Math.floor(k / 3) * 0.33, OZ + p + 0.04],
          [0, 0, (k - 2.5) * 0.06],
          0
        );
      b.cyl(0.16, 0.16, 0.04, K.mat(0xf4f4f0, 0.5), [4.1, 2.3, PZ - p - 0.02], [PI / 2, 0, 0], 20);
      b.box(0.01, 0.12, 0.005, black, [4.1, 2.34, PZ - p - 0.045], null, 0);
      b.cyl(0.14, 0.12, 0.3, K.mat(0x2a2a2c, 0.6), [4.1, 0.15, -6.1], null, 12); // waste bin
    }

    /* ---------- staff locker alcove: lockers, coat hooks, kettle, mop sink ---------- */
    {
      const lm = K.mat(0x4a6a8a, 0.45, 0.5);
      for (let k = 0; k < 4; k++) {
        const lx = 5.15 + k * 0.44; // v089: was 4.2 + ..., the first lockers stood in the alcove opening
        b.box(0.42, 1.85, 0.46, lm, [lx, 0.93, TZ + p + 0.24], null, 0.005);
        for (let v = 0; v < 3; v++)
          b.box(0.24, 0.015, 0.005, K.mat(0x2a3a4a, 0.5), [lx, 1.65 - v * 0.03, TZ + p + 0.472], null, 0);
        b.box(0.03, 0.12, 0.02, chrome, [lx + 0.15, 1.0, TZ + p + 0.48], null, 0);
      }
      b.label(
        1.7,
        0.14,
        strapMat('twb_lock', 'STAFF LOCKERS', 'bold 40px Arial, Helvetica, sans-serif', '#f2f2ee', INK),
        [5.81, 1.97, TZ + p + 0.475]
      );
      S(4.93, 6.69, TZ + p, TZ + p + 0.5, 0, 1.86);
      // coat hooks with a jacket and a bag on the office wall
      b.box(1.2, 0.08, 0.03, K.veneer(0xc09060), [7.0, 1.7, OZ - p - 0.02], null, 0);
      hangFront(6.7, 1.72, OZ - p - 0.08, PI, 'coat', tm(0x2a2a2a));
      b.box(0.34, 0.4, 0.14, K.mat(0x8a3a2a, 0.7), [7.4, 1.35, OZ - p - 0.1], null, 0.03);
      // mop sink in the corner
      b.box(0.6, 0.35, 0.5, K.mat(0xe8e8e4, 0.4), [X1 - 0.46, 0.35, TZ + p + 0.3], null, 0.02);
      b.cyl(0.012, 0.012, 1.0, K.mat(0x8a6a4a, 0.6), [X1 - 0.3, 0.75, TZ + p + 0.2], [0.15, 0, -0.1], 6);
      b.cyl(0.18, 0.16, 0.28, K.mat(0xe8b020, 0.5), [X1 - 1.0, 0.15, TZ + p + 0.3], null, 12);
      S(X1 - 0.76, X1 - 0.16, TZ + p, TZ + p + 0.56, 0, 0.55, true);
    }

    /* ---------- staff toilet: WC, basin, mirror, hand dryer, toilet roll ---------- */
    {
      const por = K.mat(0xf4f4f0, 0.25);
      const wx = 7.6,
        wz = Z0 + 0.5;
      b.box(0.4, 0.4, 0.18, por, [wx, 0.95, Z0 + 0.25], null, 0.03); // cistern
      b.cyl(0.19, 0.15, 0.4, por, [wx, 0.2, wz + 0.1], null, 14);
      b.cyl(0.2, 0.2, 0.03, K.mat(0xf8f8f8, 0.3), [wx, 0.42, wz + 0.1], null, 14);
      b.box(0.36, 0.36, 0.03, K.mat(0xf8f8f8, 0.3), [wx, 0.6, wz - 0.08], [-0.2, 0, 0], 0.02);
      S(wx - 0.22, wx + 0.22, Z0 + 0.16, wz + 0.32, 0, 1.15, true);
      b.cyl(0.06, 0.06, 0.1, K.mat(0xf8f8f4, 0.8), [X1 - 0.24, 0.75, wz + 0.4], [0, 0, PI / 2], 10);
      // basin on the side wall, mirror over it, the dryer by the door
      b.box(0.5, 0.15, 0.4, por, [XO + p + 0.25, 0.82, -9.95 + 0.3 - 1.0], [0, PI / 2, 0], 0.04);
      b.cyl(0.04, 0.05, 0.7, por, [XO + p + 0.22, 0.4, -10.65], null, 12);
      b.box(0.02, 0.6, 0.45, K.mat(0xd8e6ee, 0.05, 0.95), [XO + p + 0.02, 1.5, -10.65], null, 0);
      b.box(0.25, 0.3, 0.18, K.mat(0xe8e8e4, 0.4, 0.3), [5.6, 1.2, TZ - p - 0.1], null, 0.03);
      S(XO + p, XO + p + 0.45, -10.95, -10.35, 0, 0.95, true);
      b.cyl(0.14, 0.12, 0.3, K.mat(0xe8e8e4, 0.5), [6.4, 0.15, Z0 + 0.3], null, 12); // sanitary bin
    }

    /* ---------- dressing: dropped clothes, hangers, a spilled bag, smears ---------- */
    for (const [cx, cz, a, ci] of [
      [-3.0, 4.3, 0.4, 0],
      [-2.4, 6.9, 2.1, 3],
      [1.9, 6.2, -0.7, 6],
      [-5.6, 0.2, 1.3, 1],
      [4.7, 3.4, 0.2, 9],
      [-1.2, -1.9, 2.8, 2],
      [-3.4, -5.2, 0.9, 5]
    ]) {
      b.box(0.5, 0.012, 0.42, ci % 2 ? FLANNEL[ci % 5] : tm(TEE[ci]), [cx, 0.05, cz], [0, a, 0], 0);
      b.box(0.36, 0.01, 0.015, K.mat(0xc8a070, 0.6), [cx + 0.3, 0.05, cz - 0.2], [0, a + 0.8, 0], 0);
    }
    for (const [hx, hz] of [
      [0.9, 1.0],
      [-1.4, 7.8],
      [5.6, -1.0]
    ])
      b.box(0.4, 0.008, 0.02, chrome, [hx, 0.045, hz], [0, hx, 0], 0);
    {
      const smear = K.paint(
        'twb_smear',
        128,
        128,
        (c, W, H) => {
          c.clearRect(0, 0, W, H);
          c.fillStyle = 'rgba(90,10,10,0.75)';
          c.beginPath();
          c.ellipse(64, 64, 50, 22, 0.4, 0, PI * 2);
          c.fill();
          for (let k = 0; k < 6; k++) {
            c.beginPath();
            c.arc(20 + k * 18, 30 + ((k * 37) % 70), 5 + (k % 3) * 3, 0, PI * 2);
            c.fill();
          }
        },
        {alpha: 1}
      );
      for (const [mx, mz, a] of [
        [-1.0, 1.6, 0.3],
        [2.0, -0.2, 1.9],
        [-4.8, -8.4, 0.7]
      ])
        b.label(1.2, 1.2, smear, [mx, 0.052, mz], [-PI / 2, 0, a]);
    }

    /* ---------- shutter bay header (collision: the walls themselves are core WL) ---------- */
    S(BAY[0] - BAY[1] / 2, BAY[0] + BAY[1] / 2, Z0 - 0.15, Z0 + 0.15, BH, H, true);

    /* ---------- sidewalk: street lights, meter, hydrant, no parking ---------- */
    LK.lightPole(b, S, -5.4);
    LK.lightPole(b, S, 5.4);
    LK.hydrant(b, S, 7.6);
    LK.meter(b, S, -2.8);
    LK.noParking(b, 2.8, {key: 'twb_np1'});

    return (CACHE = G.done());
  }

  function bThreads(x, z, t) {
    const B = mk(x, z, 20, 36, H, 0xeceae4, 0x1a9ad8, 0x2a2c30);
    B.dx = 0;
    const PT = {th: 0.15, c: 0xe8e6e0};
    const cp = a => a.map(o => Object.assign({}, o));
    WL(B, 1, Z1, X0, X1, cp(FRONT), H);
    for (const [a0, a1, ops] of BACKRUNS) WL(B, 1, Z0, a0, a1, cp(ops), H);
    WL(B, 0, X0, Z0, Z1, [], H);
    WL(B, 0, X1, Z0, Z1, cp(RIGHT), H);
    WL(B, 1, PZ, X0, X1, cp(PART), H, PT); // shop floor / back of house
    WL(B, 0, XO, Z0, PZ, cp(SIDE), H, PT); // stock room / office, alcove, toilet
    WL(B, 1, OZ, XO, X1, [], H, PT); // office back wall
    WL(B, 1, TZ, XO, X1, [], H, PT); // toilet front wall
    LK.attach(B, build());
    // shade trees in the grass strip
    for (const tx of [-8.4, 8.4])
      try {
        bldTree(B, tx, 15.2, 0.85);
      } catch (e) {}
    // the store van, backed up beside the shutter bay (cab out to the alley)
    try {
      if (window.MFZV) {
        const vx = BAY[0] + 0.2,
          vz = Z0 - 5.4;
        const g = MFZV.make('van', WX(B, vx), WZ(B, vz), PI + (B.cs < 0 ? PI : 0), {
          label: 'THREADS WITH BENEFITS',
          labelCol: '#1a9ad8',
          tint: [0.95, 0.95, 0.94],
          dust: true
        });
        const h = g && g.userData && g.userData.half;
        const hx = h ? h[0] : 1.1,
          hz = h ? h[1] : 2.6;
        B.occ.push([vx - hx, vx + hx, vz - hz, vz + hz]);
      }
    } catch (e) {}
    const SP = LK.spawner(B, 'twb_shop');
    // shop floor: vintage dressers and a trunk as display pieces, a low display table, the till
    SP(5.2, 7.45, 'dresser', 'twb_shop', PI);
    SP(X1 - 0.35, 3.75, 'dresser', 'twb_shop', -PI / 2);
    SP(-3.2, 7.55, 'trunk_leather', 'twb_shop', PI);
    SP(-6.3, 6.5, 'shop_shelves_low', 'twb_shop', PI / 2);
    SP(6.5, 1.6, 'cash_register', 'clothing', -PI / 2, 1.15);
    // stock room: pallet racking, boxes, the toolbox on the sorting table
    SP(X0 + 0.65, -9.4, 'pallet_racking', 'twb_stock', PI / 2);
    SP(X0 + 0.65, -6.4, 'pallet_racking', 'twb_stock', PI / 2);
    SP(-5.0, -3.65, 'cardboard_box_large', 'twb_stock', 0.15);
    SP(-4.1, -3.6, 'cardboard_box_medium', 'twb_stock', -0.3);
    SP(-1.8, -7.4, 'cardboard_box_small', 'twb_stock', 0.5);
    SP(1.5, -7.6, 'toolbox', 'twb_stock', 0.2, 0.93);
    // office: the desk and a bookshelf of box files; staff toilet cabinet
    SP(6.6, -6.15, 'desk_office', 'twb_office', 0);
    SP(X1 - 0.35, -4.8, 'bookshelf', 'twb_office', -PI / 2);
    SP(X1 - 0.25, -9.5, 'medicine_cabinet', 'twb_wc', -PI / 2);
    // yard: the dumpster by the staff door
    SP(4.4, -12.7, 'dumpster_blue', 'storage', PI);
    return LK.finish(B, t, {
      at: [(X0 + X1) / 2, (Z0 + Z1) / 2],
      w: X1 - X0,
      d: Z1 - Z0,
      loot: ['twb_shop', [-3, 3, 1, 7], 1],
      zombies: [
        [-2.4, 5.0],
        [1.6, 6.8],
        [5.0, 6.2],
        [-6.0, 0.4],
        [1.2, -1.6],
        [-2.4, -7.0],
        [1.0, -9.6],
        [5.4, -4.6],
        [2.0, -14.5],
        [-6.5, -15.5]
      ]
    });
  }

  const e = LK.register({
    id: 'fancypantz_wearables',
    name: 'Threads with Benefits',
    build: bThreads,
    note: 'half-plot clothing store: big shop floor (shelving wall, rails, round racks, mannequins, fitting rooms, display counter), delivery stock room with a roller-shutter bay, small office, locker alcove and staff toilet',
    globals: {bThreads, THREADS: {build}}
  });
  if (e) e.loot = 'twb_shop';
  console.log('[threads] Threads with Benefits ready');
})();
