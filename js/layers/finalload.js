/* ==========================================================================================================
   MINI FORT ZOMBIE - THE FINAL LOAD / GET NAILED (v089): one half plot (20 x 36 m, front = +Z) holding TWO businesses, our own design.
   Replaces the Laundromat placeholder (core NEWCAT id laundromat, half pool).
   One 18 x 15.5 m block split by a solid party wall at x = 1 (the laundromat gets the wider 10 m bay, the salon 8 m). Each business has
   its own front door, back door, shopfront and fascia.
   LEFT - THE FINAL LOAD (laundromat): orange box awning with bubbles, sliding glass doors, WASH · DRY · FOLD window lettering, two vending
   machines and a bench out front. Inside: peach terracotta tile, blue tile dado, drop ceiling with troffers; a bank of ten stainless
   coin-op front-loaders on a tiled plinth down the left wall, four columns of stacked dryers across the back, a folding island with
   laundry carts, a waiting row of moulded chairs under a wall TV, a change machine and soap vend, rules boards. Behind: a dingy utility
   room (water heaters, mop sink, detergent shelving, the attendant's desk, a gutted washer) with the back door.
   RIGHT - GET NAILED (nail salon): white render, pink GET NAILED fascia, pink neon window script (NAILS / MANICURE / PEDICURE), planters
   and a bench. Inside: grey marble tile, cream walls with gold trim, a warm cove strip and black track lights; a big amber-lit wall of
   polish bottles, a white-and-gold reception desk, a waiting corner of tub chairs, three manicure stations (tub chair, tech stool, UV lamp,
   dust fan), two pedicure thrones on a platform with foot basins, a facial steamer and pedestal fan. A CUSTOMER TOILET (the only one in the
   block), and a back room (towels, supplies, a staff table) with the back door.
   Behind: a dingy yard open to the alley (stained asphalt, puddles, bin bags, a dumpster, lint sacks, a dumped washer, graffiti, fences).
   Loot is light: this is a filler building.
   Structure from core WL (doors / windows work); detail is our own geometry and painted artwork, outside the static merge.
   ========================================================================================================== */
(function () {
  'use strict';
  const K = window.MFZK,
    LK = window.LOTKIT;
  if (!K || !LK || typeof WL !== 'function' || typeof NEWCAT === 'undefined') {
    console.warn('[finalload] core / prop kit missing');
    return;
  }
  const T = THREE,
    P = K.P,
    PI = Math.PI;
  // the block (half plot: x -10..10), the party wall, heights
  const X0 = -9,
    X1 = 9,
    XM = 1, // party wall: The Final Load to the left (-x), Get Nailed to the right (+x)
    Z0 = -8,
    Z1 = 7.5,
    H = 4.4,
    CEIL = 3.3,
    FAS = 3.0; // underside of the fascias
  const LZ = -4.4, // laundromat: hall / utility room partition
    RZ = -3.4, // salon: floor / back partition
    TX = 6.9; // salon: customer toilet x TX..X1, z Z0..RZ
  const FRONT_L = [
    {k: 'w', c: -6.1},
    {k: 'd', c: -4.6, dbl: 'slide'},
    {k: 'd', c: -3.3, dbl: 'slide'},
    {k: 'w', c: -1.85},
    {k: 'w', c: -0.3}
  ];
  const FRONT_R = [
    {k: 'w', c: 2.3},
    {k: 'd', c: 4.0},
    {k: 'w', c: 5.7},
    {k: 'w', c: 7.4}
  ];
  const FRONT = FRONT_L.concat(FRONT_R);
  const BACK = [
    {k: 'd', c: -2.6, s: -1},
    {k: 'd', c: 3.4, s: -1}
  ];
  const L_PART = [{k: 'd', c: -1.2}]; // laundromat hall -> utility room
  const R_PART = [
    {k: 'd', c: 2.4}, // salon -> back room
    {k: 'd', c: 8.0} // salon -> customer toilet
  ];
  // the washer row (left wall) and which of them are lootable props
  const WASH_Z = [-2.85, -1.9, -0.95, 0, 0.95, 1.9, 2.85, 3.8, 4.75, 5.7],
    WASH_LOOT = [1, 4, 8],
    WASH_X = -8.42,
    PLINTH = 0.32;

  /* ===================== loot tables ===================== */
  const TABLES = ['tfl_back', 'gnd_front', 'gnd_stock', 'gnd_wc'];
  try {
    Object.assign(LOOT_TABLES, {
      // laundromat utility room: shelving and the attendant's desk
      tfl_back: {
        duct_tape: 2,
        bug_spray: 2,
        bungie_cord: 2,
        spray_paint: 1,
        rope: 1,
        spring: 1,
        z_energy_drink: 1,
        potato_chips: 1,
        water_jug: 1
      },
      // salon reception: the till drawer and what's under the desk
      gnd_front: {hairspray: 2, cotton_balls: 2, z_energy_drink: 1, cookies: 1, painkiller: 1, sup_soft_drink: 1},
      // salon back room: supplies
      gnd_stock: {hairspray: 4, cotton_balls: 3, medical_tape: 2, gauze: 1, spray_paint: 1, duct_tape: 1},
      // customer toilet cabinet
      gnd_wc: {painkiller: 2, gauze: 1, cotton_balls: 1, medical_tape: 1, hairspray: 1}
    });
    for (const tn of TABLES)
      for (const id in LOOT_TABLES[tn])
        if (!ITEMS[id]) {
          console.error('[finalload] loot table ' + tn + ' has unknown item ' + id);
          delete LOOT_TABLES[tn][id];
        }
    if (typeof LOOT_PROP !== 'undefined') for (const tn of TABLES) LOOT_PROP[tn] = 'cabinet';
    const A = window.MFZPROP && MFZPROP.auto;
    if (A) {
      const pick = (...ts) => [...new Set(ts.flatMap(t => A[t] || []))];
      A.tfl_back = pick('laundromat', 'hardware');
      A.gnd_front = pick('convenience', 'clothing');
      A.gnd_stock = pick('clothing', 'pharmacy');
      A.gnd_wc = pick('house', 'clinic');
    }
  } catch (e) {
    console.warn('[finalload] loot tables', e);
  }

  /* ===================== the commercial front-loader (decor and lootable prop share it) ===================== */
  // a stainless coin-op front-loader, 0.9 wide, 0.8 deep, 1.05 tall, origin on its base; front = +z
  const WW = 0.9,
    WD = 0.8,
    WH = 1.05;
  function washerGeo(b, tint) {
    const ss = K.paintSteel(tint || 0xb8bcc0, {m: 0.75, r: 0.32}),
      dk = K.mat(0x26282a, 0.5, 0.3),
      ch = K.chrome(),
      gl = K.glass(0x9ab0bc, 0.55),
      lcd = K.mat(0x103018, 0.3, 0, {emissive: 0x40ff70, emissiveIntensity: 0.6});
    b.rbox(WW, WH, WD, 0.015, ss, [0, WH / 2, 0]);
    // control fascia across the top: coin slots, start button, a little display
    b.rbox(WW - 0.02, 0.2, 0.05, 0.01, K.paintSteel(0xd8dadc, {m: 0.6, r: 0.3}), [0, WH - 0.12, WD / 2 + 0.01]);
    b.box(0.14, 0.06, 0.012, lcd, [-0.2, WH - 0.1, WD / 2 + 0.04], null, 0);
    b.box(0.08, 0.12, 0.02, dk, [0.1, WH - 0.12, WD / 2 + 0.04], null, 0); // coin drop
    b.box(0.02, 0.05, 0.022, ch, [0.1, WH - 0.1, WD / 2 + 0.042], null, 0);
    b.cyl(0.025, 0.025, 0.02, K.mat(0x2a8a3a, 0.4), [0.3, WH - 0.12, WD / 2 + 0.04], [PI / 2, 0, 0], 12); // START
    // porthole door: chrome ring, smoked glass, a dark drum behind
    b.cyl(0.3, 0.3, 0.02, K.mat(0x101214, 0.6), [0, 0.5, WD / 2 + 0.002], [PI / 2, 0, 0], 20);
    b.tor(0.28, 0.035, ch, [0, 0.5, WD / 2 + 0.03], null, PI * 2, 20);
    b.cyl(0.25, 0.25, 0.012, gl, [0, 0.5, WD / 2 + 0.03], [PI / 2, 0, 0], 20);
    b.box(0.05, 0.12, 0.05, ch, [0.29, 0.5, WD / 2 + 0.05], null, 0.01); // handle
    b.box(0.3, 0.08, 0.012, dk, [0, 0.12, WD / 2 + 0.006], null, 0); // soap tray / kick plate
  }
  K.def('fl_washer', {label: 'Coin-op washer', table: 'laundromat', items: [1, 2], auto: ['laundromat']}, b =>
    washerGeo(b)
  );

  /* ===================== artwork ===================== */
  const ORANGE = '#f26a1f',
    PINK = '#e8488a',
    INK = '#18191b',
    SANS = 'Arial, Helvetica, sans-serif',
    SCRIPT = '"Brush Script MT", "Segoe Script", cursive',
    IMPACT = 'Impact, "Arial Black", sans-serif';
  const strapMat = (key, text, font, bg, fg, w, h) =>
    K.paint(key, w || 512, h || 64, (c, W, H) => {
      c.fillStyle = bg;
      c.fillRect(0, 0, W, H);
      c.fillStyle = fg;
      c.font = font;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(text, W / 2, H / 2 + 2);
    });
  // clear lettering: lines of [text, font, colour, y (0..1)], o.glow for neon
  const decal = (key, lines, w, h, o) =>
    K.paint(
      key,
      w || 512,
      h || 256,
      (c, W, H) => {
        c.clearRect(0, 0, W, H);
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        for (const [s, f, col, y, glow] of lines) {
          c.font = f;
          if (glow) {
            c.shadowColor = col;
            c.shadowBlur = glow;
          }
          c.fillStyle = col;
          c.fillText(s, W / 2, y * H);
          c.shadowBlur = 0;
        }
      },
      Object.assign({alpha: true, r: 0.3}, o || {})
    );
  // soap bubbles: a ring with a highlight
  function bubbles(c, list, col) {
    for (const [x, y, r] of list) {
      c.strokeStyle = col;
      c.lineWidth = Math.max(2, r * 0.12);
      c.beginPath();
      c.arc(x, y, r, 0, PI * 2);
      c.stroke();
      c.beginPath();
      c.arc(x - r * 0.3, y - r * 0.3, r * 0.45, PI * 1.05, PI * 1.55);
      c.stroke();
    }
  }
  // The Final Load awning face: orange with white lettering and bubbles at both ends
  const flFascia = () =>
    K.paint('fl_fascia', 1024, 160, (c, W, H) => {
      c.fillStyle = ORANGE;
      c.fillRect(0, 0, W, H);
      bubbles(
        c,
        [
          [70, 60, 34],
          [120, 104, 22],
          [150, 48, 16],
          [W - 70, 64, 34],
          [W - 124, 108, 20],
          [W - 152, 46, 15]
        ],
        '#c9d4ff'
      );
      P.text(c, 'THE', 236, 52, {size: 34, col: '#fff', font: SANS, weight: 'bold'});
      P.text(c, 'FINAL LOAD', W / 2 + 52, 74, {size: 92, col: '#fff', font: SANS, weight: 'bold', max: 540}); // v101: nudged right so 'THE' sits clear of the F
      P.text(c, 'LAUNDROMAT', 820, 126, {size: 26, col: '#fff', font: SANS, weight: 'bold'});
    });
  // Get Nailed fascia: white panel, pink lettering
  const gnFascia = () =>
    K.paint('gn_fascia', 1024, 192, (c, W, H) => {
      c.fillStyle = '#f7f5f2';
      c.fillRect(0, 0, W, H);
      c.fillStyle = PINK;
      c.fillRect(0, H - 14, W, 6);
      P.text(c, 'Get Nailed', W / 2, 86, {
        size: 104,
        col: PINK,
        font: 'Georgia, "Times New Roman", serif',
        weight: 'bold'
      });
      P.text(c, 'NAIL SALON  ·  MANICURE  ·  PEDICURE', W / 2, 160, {
        size: 26,
        col: '#7a6a70',
        font: SANS,
        weight: 'bold'
      });
      // a little painted fingernail each side
      for (const x of [86, W - 86]) {
        c.fillStyle = '#f2c8b0';
        c.beginPath();
        c.ellipse(x, 100, 30, 52, 0, 0, PI * 2);
        c.fill();
        c.fillStyle = PINK;
        c.beginPath();
        c.ellipse(x, 86, 20, 32, 0, 0, PI * 2);
        c.fill();
        c.fillStyle = 'rgba(255,255,255,0.7)';
        c.fillRect(x - 10, 66, 5, 22);
      }
    });
  // a painted wall of polish bottles on glass shelves (the lit niche)
  const polishWall = () =>
    K.paint(
      'gn_polish',
      512,
      256,
      (c, W, H, r) => {
        c.fillStyle = '#f6d58a';
        c.fillRect(0, 0, W, H);
        const rows = 7,
          rh = H / rows;
        for (let j = 0; j < rows; j++) {
          c.fillStyle = 'rgba(255,255,255,0.75)';
          c.fillRect(0, (j + 1) * rh - 4, W, 3);
          for (let x = 4; x < W - 6; x += 9) {
            const hue = (r() * 360) | 0,
              bh = rh * 0.62;
            c.fillStyle = `hsl(${hue},${55 + r() * 35}%,${35 + r() * 30}%)`;
            c.fillRect(x, (j + 1) * rh - 4 - bh, 7, bh * 0.68);
            c.fillStyle = r() < 0.6 ? '#1a1a1a' : '#d8c070';
            c.fillRect(x + 2, (j + 1) * rh - 4 - bh, 3, bh * 0.32);
          }
        }
      },
      {glow: 0.55, r: 0.3}
    );

  /* ===================== surfaces ===================== */
  const SURF = {};
  const surf = k =>
    SURF[k] ||
    (SURF[k] = {
      asphalt: () => K.surf('asphalt', 0x3a3c40),
      concrete: () => K.surf('concrete', 0xb4b0a6),
      fence: () => K.surf('wood', 0x5a4a3c),
      // buff block / render for the shell
      render: () => K.surf('concrete', 0xd8d2c4),
      block: () =>
        K.tri(
          'fl_block',
          (c, W, H, r) => {
            c.fillStyle = '#8a8680';
            c.fillRect(0, 0, W, H);
            const rows = 8,
              bh = H / rows,
              bw = W / 2;
            for (let j = 0; j < rows; j++)
              for (let i = -1; i < 3; i++) {
                const x = i * bw + (j % 2 ? bw / 2 : 0);
                c.fillStyle = `hsl(36,${6 + r() * 6}%,${60 + r() * 8}%)`;
                c.fillRect(x + 2, j * bh + 2, bw - 4, bh - 4);
              }
            P.noise(c, W, H, r, 6000, 0.15, '#3a3a30', 1.3);
            P.grime(c, W, H, r, 0.4);
          },
          {tile: 1.6, r: 0.9}
        ),
      orange: () => K.mat(0xf26a1f, 0.5),
      pinkM: () => K.mat(0xe8488a, 0.45),
      white: () => K.mat(0xf4f2ee, 0.6),
      coping: () => K.mat(0xc8c2b4, 0.7),
      alu: () => K.mat(0x22252a, 0.4, 0.6),
      silver: () => K.mat(0xb0b4b8, 0.35, 0.7)
    }[k]());

  /* ===================== geometry ===================== */
  let CACHE = null;
  function build() {
    if (CACHE) return CACHE;
    const G = LK.geo('finalload'),
      b = G.b,
      S = G.S;
    const conc = surf('concrete'),
      asph = surf('asphalt');
    /* ---------- grounds: sidewalk, front apron, side walks, back yard ---------- */
    LK.pavement(b, conc, {w: 20, kerb: true});
    b.box(20, 0.04, 15.9 - Z1, conc, [0, 0.02, (Z1 + 15.9) / 2], null, 0); // front apron
    b.box(1.0, 0.04, Z1 - Z0, conc, [-9.5, 0.02, (Z0 + Z1) / 2], null, 0); // side walks
    b.box(1.0, 0.04, Z1 - Z0, conc, [9.5, 0.02, (Z0 + Z1) / 2], null, 0);
    b.box(20, 0.02, 18 + Z0, asph, [0, 0.012, (-18 + Z0) / 2], null, 0); // back yard, out to the alley

    const rb = (w, h, d, r, m, p, rot) => b.rbox(w, h, d, r, m, p, rot, 1);
    const blk = surf('block'),
      rend = surf('render'),
      orng = surf('orange'),
      pinkM = surf('pinkM'),
      whiteM = surf('white'),
      cop = surf('coping'),
      alu = surf('alu'),
      silver = surf('silver'),
      dark = K.mat(0x1c1c1e, 0.5),
      steel = K.mat(0x9a9ea2, 0.4, 0.7),
      greyR = K.mat(0x6a6c6e, 0.85),
      leaf = K.mat(0x3e6a2e, 0.85),
      leaf2 = K.mat(0x557f38, 0.85),
      soil = K.mat(0x3a2a1c, 0.95),
      warm = K.mat(0xfff2c8, 0.4, 0, {emissive: 0xffd890, emissiveIntensity: 1.3}),
      lit = K.mat(0xffffff, 0.4, 0, {emissive: 0xf6f8ff, emissiveIntensity: 0.95});

    /* ---------- exterior skin: block sides and back; laundromat front grey riser + block, salon white render ---------- */
    // riser 0..0.9, mid 0.9..FAS, top FAS..H (window / door heads follow core WL sizes)
    const skin = (ax, f, a0, a1, n, ops, riser, mid, top) => {
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
        if (riser) {
          put(y0, Math.min(y1, 0.9), riser);
          put(Math.max(y0, 0.9), Math.min(y1, FAS), mid);
          put(Math.max(y0, FAS), y1, top);
        } else put(y0, y1, blk);
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
    skin(1, Z1, X0 - 0.15, XM, 1, FRONT_L, greyR, blk, blk);
    skin(1, Z1, XM, X1 + 0.15, 1, FRONT_R, greyR, whiteM, rend);
    skin(0, X0, Z0, Z1, -1, []);
    skin(0, X1, Z0, Z1, 1, []);
    skin(1, Z0, X0 - 0.15, X1 + 0.15, -1, BACK);
    b.box(0.5, FAS, 0.12, blk, [XM, FAS / 2, Z1 + 0.22], null, 0.01); // pier between the two fronts
    // window frames: silver on the laundromat, white on the salon
    for (const [ops, fm, sill] of [
      [FRONT_L, silver, alu],
      [FRONT_R, whiteM, whiteM]
    ])
      for (const w of ops) {
        if (w.k === 'w') {
          b.box(1.66, 0.08, 0.2, sill, [w.c, 0.9, Z1 + 0.24], null, 0.01);
          b.frame(1.56, 1.9, 0.08, fm, [w.c, 1.825, Z1 + 0.19], 0.06);
        } else if (!w.dbl) b.frame(1.42, 2.5, 0.1, fm, [w.c, 1.25, Z1 + 0.19], 0.07);
      }
    b.frame(2.72, 2.5, 0.1, silver, [-3.95, 1.25, Z1 + 0.19], 0.07); // sliding door surround

    /* ---------- The Final Load: orange box awning with lettering, soffit downlights; window vinyl ---------- */
    {
      const ax0 = X0 - 0.1,
        ax1 = XM - 0.3,
        aw = ax1 - ax0,
        cx = (ax0 + ax1) / 2,
        AD = 1.0,
        LW = aw - 0.3,
        LH = LW * (160 / 1024),
        AH = LH + 0.14; // v090: the box awning is as tall as its lettering board (the board stuck out of a 0.95 m face)
      rb(aw, AH, 0.08, 0.02, orng, [cx, FAS + AH / 2, Z1 + 0.2 + AD]); // face
      b.label(LW, LH, flFascia(), [cx, FAS + AH / 2, Z1 + 0.25 + AD]);
      b.box(aw, 0.08, AD, orng, [cx, FAS + AH + 0.02, Z1 + 0.2 + AD / 2], [-0.12, 0, 0], 0.01); // sloped top
      b.box(aw, 0.03, AD, K.mat(0xe8e4dc, 0.7), [cx, FAS + 0.02, Z1 + 0.2 + AD / 2], null, 0); // soffit
      for (const sx of [0.08, 0.5])
        b.box(0.08, AH, AD, orng, [ax0 + sx * aw * 2, FAS + AH / 2, Z1 + 0.2 + AD / 2], null, 0.01);
      for (const lx of [-7.6, -5.4, -3.95, -2.5, -0.6]) {
        b.cyl(0.07, 0.07, 0.03, K.mat(0xd8d8d4, 0.5), [lx, FAS, Z1 + 0.7], null, 12);
        b.cyl(0.055, 0.055, 0.01, warm, [lx, FAS - 0.018, Z1 + 0.7], null, 12);
      }
      // window and door vinyl
      b.label(
        1.4,
        0.7,
        decal('fl_win1', [
          ['WASH', 'bold 64px ' + SANS, '#ffffff', 0.2],
          ['DRY', 'bold 64px ' + SANS, '#ffd2b0', 0.5],
          ['FOLD', 'bold 64px ' + SANS, '#ffffff', 0.8]
        ]),
        [-6.1, 2.1, Z1 + 0.24]
      );
      b.label(
        1.4,
        0.7,
        decal('fl_win2', [
          ['SELF SERVICE', 'bold 50px ' + SANS, '#ffffff', 0.3],
          ['DROP-OFF · WASH & FOLD', 'bold 30px ' + SANS, '#ffd2b0', 0.62],
          ['WE TAKE CARE OF YOUR DIRTY WORK', 'bold 22px ' + SANS, '#ffffff', 0.85]
        ]),
        [-1.85, 2.1, Z1 + 0.24]
      );
      b.label(
        1.3,
        0.5,
        decal(
          'fl_neon',
          [
            ['OPEN', 'bold 120px ' + SANS, '#ff4a3a', 0.42, 22],
            ['24 HRS', 'bold 56px ' + SANS, '#5ac8ff', 0.82, 16]
          ],
          512,
          256,
          {glow: 0.9}
        ),
        [-0.3, 2.05, Z1 + 0.2]
      );
      // v101: the 'THE FINAL LOAD' text on the sliding doors was removed
      // a light box over the vending bay
      b.box(2.0, 0.3, 0.16, dark, [-7.9, 2.6, Z1 + 0.25], null, 0.02);
      b.label(
        1.9,
        0.24,
        strapMat('fl_vend', 'SNACKS · DRINKS · SOAP', 'bold 36px ' + SANS, '#1f3fae', '#ffffff', 512, 64),
        [-7.9, 2.6, Z1 + 0.34]
      );
    }

    /* ---------- Get Nailed: white fascia panel with pink lettering, pink neon script in the windows ---------- */
    {
      const sx0 = XM + 0.35,
        sx1 = X1 + 0.1,
        sw = sx1 - sx0,
        cx = (sx0 + sx1) / 2;
      // v090: the panel is sized round its lettering (the 1.6 m tall board stuck out of a 0.95 m panel, over both trims)
      const LW = sw - 0.3,
        LH = LW * (192 / 1024),
        PH = LH + 0.14,
        PY = FAS + 0.08 + PH / 2;
      rb(sw, PH, 0.2, 0.02, whiteM, [cx, PY, Z1 + 0.27]);
      b.label(LW, LH, gnFascia(), [cx, PY, Z1 + 0.375]);
      b.box(sw + 0.1, 0.06, 0.3, pinkM, [cx, PY + PH / 2 + 0.03, Z1 + 0.3], null, 0.01);
      b.box(sw + 0.1, 0.05, 0.26, K.mat(0x8a8a8a, 0.6), [cx, FAS + 0.05, Z1 + 0.28], null, 0.01);
      // projecting round blade sign with a nail-polish bottle
      b.box(0.05, 0.05, 0.7, dark, [X1 - 0.1, FAS + 0.7, Z1 + 0.62], null, 0);
      b.cyl(0.32, 0.32, 0.06, whiteM, [X1 - 0.1, FAS + 0.3, Z1 + 0.85], [0, 0, PI / 2], 24);
      b.cyl(0.08, 0.1, 0.22, pinkM, [X1 - 0.06, FAS + 0.24, Z1 + 0.85], null, 12);
      b.cyl(0.08, 0.1, 0.22, pinkM, [X1 - 0.14, FAS + 0.24, Z1 + 0.85], null, 12);
      b.cyl(0.03, 0.03, 0.16, dark, [X1 - 0.1, FAS + 0.43, Z1 + 0.85], null, 8);
      const neon = (key, text, size, col) =>
        decal(key, [[text, size + 'px ' + 'Georgia, serif', col, 0.5, 26]], 512, 192, {glow: 1.0});
      b.label(1.3, 0.48, neon('gn_n1', 'Nail design', 84, '#ff5aa8'), [2.3, 2.15, Z1 + 0.2]);
      b.label(1.3, 0.48, neon('gn_n2', 'Manicure', 92, '#ff5aa8'), [5.7, 2.15, Z1 + 0.2]);
      b.label(1.3, 0.48, neon('gn_n3', 'Pedicure', 92, '#ff8ad0'), [7.4, 2.15, Z1 + 0.2]);
      b.label(
        1.3,
        0.3,
        decal(
          'gn_walkin',
          [
            ['WALK-INS WELCOME', 'bold 40px ' + SANS, '#ffffff', 0.35],
            ['GEL · ACRYLIC · NAIL ART', 'bold 30px ' + SANS, '#ffc8e0', 0.75]
          ],
          512,
          128
        ),
        [5.7, 1.2, Z1 + 0.24]
      );
      b.label(0.9, 0.2, decal('gn_door', [['GET NAILED', 'bold 50px Georgia, serif', '#ffffff', 0.5]], 512, 112), [
        4.0,
        1.75,
        Z1 + 0.24
      ]);
      b.label(0.3, 0.12, strapMat('gn_push', 'PUSH', 'bold 40px ' + SANS, '#ffffff', INK, 256, 96), [
        4.0,
        1.15,
        Z1 + 0.24
      ]);
    }

    /* ---------- parapet, flat roof, AC units, dryer vent stacks ---------- */
    const par = (ax, f, a0, a1) => {
      const L = a1 - a0,
        u = (a0 + a1) / 2;
      if (ax) {
        b.box(L, 0.7, 0.3, blk, [u, H + 0.35, f], null, 0);
        b.box(L + 0.1, 0.08, 0.42, cop, [u, H + 0.74, f], null, 0.01);
      } else {
        b.box(0.3, 0.7, L, blk, [f, H + 0.35, u], null, 0);
        b.box(0.42, 0.08, L + 0.1, cop, [f, H + 0.74, u], null, 0.01);
      }
    };
    par(1, Z1, X0 - 0.15, X1 + 0.15);
    par(1, Z0, X0 - 0.15, X1 + 0.15);
    par(0, X0, Z0, Z1);
    par(0, X1, Z0, Z1);
    par(0, XM, Z0, Z1); // the party wall rises through the roof
    b.box(X1 - X0, 0.12, Z1 - Z0, K.surf('concrete', 0x5a5a58), [0, H + 0.02, (Z0 + Z1) / 2], null, 0);
    b.box(X1 - X0 - 0.3, 0.02, Z1 - Z0 - 0.3, K.mat(0x3a3c40, 0.9), [0, H + 0.09, (Z0 + Z1) / 2], null, 0);
    for (const [hx, hz] of [
      [-6.0, -1.0],
      [5.0, -2.0]
    ]) {
      rb(1.6, 0.9, 1.0, 0.03, K.mat(0xb0b4b8, 0.4, 0.7), [hx, H + 0.55, hz]);
      b.vents(6, 1.4, 0.7, dark, [hx, H + 0.55, hz + 0.51]);
      b.cyl(0.32, 0.32, 0.04, dark, [hx, H + 1.02, hz], null, 18);
    }
    for (const vx of [-8.0, -6.8, -5.6, -4.4]) {
      // dryer exhaust stacks with rain caps over the dryer bank
      b.cyl(0.11, 0.11, 0.9, K.mat(0x8a8c8e, 0.4, 0.7), [vx, H + 0.5, LZ + 0.3], null, 12);
      b.cyl(0.2, 0.2, 0.04, K.mat(0x7a7c7e, 0.4, 0.7), [vx, H + 1.02, LZ + 0.3], null, 12);
      for (const k of [-1, 1]) b.box(0.02, 0.1, 0.02, steel, [vx + k * 0.08, H + 0.96, LZ + 0.3], null, 0);
    }
    b.box(0.6, 0.4, 0.6, K.mat(0x8a8e92, 0.4, 0.6), [7.6, H + 0.3, -5.5], null, 0.02); // toilet extract
    b.cyl(0.18, 0.18, 0.05, dark, [7.6, H + 0.52, -5.5], null, 12);

    /* ---------- front apron: benches, a bin, planters, the salon A-board ---------- */
    const bench = (x, z, a) => {
      b.push([x, 0, z], [0, a || 0, 0]);
      const wood = K.mat(0x8a5a32, 0.7),
        iron = K.mat(0x23262a, 0.5, 0.5);
      for (let i = 0; i < 4; i++) b.box(1.6, 0.03, 0.09, wood, [0, 0.45, -0.18 + i * 0.11], null, 0.005);
      for (let i = 0; i < 3; i++) b.box(1.6, 0.09, 0.03, wood, [0, 0.6 + i * 0.12, -0.27], [-0.12, 0, 0], 0.005);
      for (const lx of [-0.7, 0.7]) {
        b.box(0.05, 0.45, 0.45, iron, [lx, 0.23, -0.02], null, 0.01);
        b.box(0.05, 0.4, 0.04, iron, [lx, 0.68, -0.29], [-0.12, 0, 0], 0);
        b.box(0.05, 0.04, 0.4, iron, [lx, 0.66, 0.0], null, 0);
      }
      b.pop();
    };
    bench(-6.1, Z1 + 0.75);
    S(-6.95, -5.25, Z1 + 0.4, Z1 + 1.1, 0, 0.9, true);
    bench(-1.1, Z1 + 0.75);
    S(-1.95, -0.25, Z1 + 0.4, Z1 + 1.1, 0, 0.9, true);
    bench(6.55, Z1 + 0.75);
    S(5.7, 7.4, Z1 + 0.4, Z1 + 1.1, 0, 0.9, true);
    // litter bin at the side walk
    b.cyl(0.26, 0.24, 0.85, K.mat(0x2a4a3a, 0.6, 0.2), [-9.45, 0.43, Z1 + 0.6], null, 14);
    b.cyl(0.28, 0.28, 0.06, dark, [-9.45, 0.88, Z1 + 0.6], null, 14);
    S(-9.72, -9.18, Z1 + 0.33, Z1 + 0.87, 0, 0.9, true);
    // planters by the salon
    for (const px of [8.55, 5.0]) {
      rb(0.55, 0.5, 0.55, 0.03, K.mat(0xe8e4dc, 0.6), [px, 0.25, Z1 + 0.45]);
      b.box(0.48, 0.03, 0.48, soil, [px, 0.49, Z1 + 0.45], null, 0);
      b.sph(0.26, leaf, [px, 0.72, Z1 + 0.45], [1, 0.8, 1], 8);
      b.sph(0.16, leaf2, [px + 0.1, 0.92, Z1 + 0.4], null, 7);
      for (let k = 0; k < 4; k++) b.sph(0.04, pinkM, [px - 0.15 + k * 0.1, 0.9 + (k % 2) * 0.08, Z1 + 0.6], null, 5);
      S(px - 0.28, px + 0.28, Z1 + 0.17, Z1 + 0.73, 0, 0.6, true);
    }
    // salon A-board
    {
      const am = K.paint('gn_aboard', 256, 384, (c, W, H) => {
        c.fillStyle = '#fbeff4';
        c.fillRect(0, 0, W, H);
        c.strokeStyle = PINK;
        c.lineWidth = 8;
        c.strokeRect(10, 10, W - 20, H - 20);
        P.text(c, 'Get Nailed', W / 2, 60, {size: 42, col: PINK, font: 'Georgia, serif', weight: 'bold'});
        const L = [
          ['MANI', '$25'],
          ['PEDI', '$35'],
          ['GEL', '$40'],
          ['ACRYLICS', '$55'],
          ['CLAW TIPS', 'FREE*']
        ];
        L.forEach(([a, p], i) => {
          P.text(c, a, 80, 130 + i * 44, {size: 26, col: '#3a2a30', font: SANS, weight: 'bold'});
          P.text(c, p, 196, 130 + i * 44, {size: 26, col: PINK, font: SANS, weight: 'bold'});
        });
        P.text(c, '*for the undead', W / 2, 352, {size: 16, col: '#7a6a70', font: SANS});
      });
      for (const sd of [-1, 1]) {
        b.box(0.55, 0.85, 0.03, K.mat(0x2a2a2a, 0.6), [2.85, 0.45, Z1 + 1.5 + sd * 0.14], [-sd * 0.17, 0, 0], 0); // v090: tops lean in
        b.label(0.48, 0.72, am, [2.85, 0.46, Z1 + 1.5 + sd * 0.16], sd > 0 ? [-0.17, 0, 0] : [0.17, PI, 0]);
      }
      S(2.55, 3.15, Z1 + 1.3, Z1 + 1.7, 0, 0.9, true);
    }

    /* ---------- back yard: door hoods and signs, fences, a dingy service yard ---------- */
    for (const [dx, txt, bg] of [
      [-2.6, 'THE FINAL LOAD · STAFF ONLY', '#c4561a'],
      [3.4, 'GET NAILED · DELIVERIES', '#b83a72']
    ]) {
      b.box(1.7, 0.06, 0.8, cop, [dx, 2.75, Z0 - 0.4], null, 0.01);
      b.label(
        1.6,
        0.2,
        strapMat('fl_back' + dx, txt, 'bold 30px ' + SANS, bg, '#ffffff'),
        [dx, 3.0, Z0 - 0.17],
        [0, PI, 0]
      );
      b.box(0.3, 0.2, 0.2, dark, [dx, 3.35, Z0 - 0.26], null, 0.01);
      b.box(0.24, 0.02, 0.14, lit, [dx, 3.24, Z0 - 0.28], null, 0);
    }
    const fen = surf('fence');
    for (const fx of [-9.9, 9.9]) {
      b.box(0.06, 1.8, -17.6 - Z0, fen, [fx, 0.9, (Z0 - 17.6) / 2], null, 0);
      for (let pz = Z0 - 0.2; pz > -17.6; pz -= 2.2) b.box(0.1, 1.9, 0.1, fen, [fx, 0.95, pz], null, 0.01);
      b.box(0.1, 0.06, -17.6 - Z0, fen, [fx, 1.86, (Z0 - 17.6) / 2], null, 0);
      S(fx - 0.06, fx + 0.06, -17.6, Z0, 0, 1.9, true);
    }
    // a broken board in the left fence, leaning
    b.box(0.03, 1.6, 0.18, fen, [-9.8, 0.75, -12.2], [0, 0, 0.3], 0);
    // dryer exhaust hoods on the laundromat back wall, lint furred round them
    for (const vx of [-8.0, -6.8, -5.6, -4.4]) {
      b.box(0.32, 0.24, 0.22, K.mat(0x9a9c9e, 0.5, 0.6), [vx, 2.2, Z0 - 0.27], null, 0.02);
      b.vents(3, 0.26, 0.18, dark, [vx, 2.2, Z0 - 0.39]);
      b.add(K.sphGeo(0.22, 8, 6), K.mat(0x9a9a98, 0.95), {p: [vx, 1.98, Z0 - 0.2], s: [1.4, 0.5, 0.3]});
    }
    // salon AC condenser on a wall bracket
    rb(0.9, 0.65, 0.35, 0.02, K.mat(0xe0e0dc, 0.5), [6.6, 1.5, Z0 - 0.4]);
    b.cyl(0.24, 0.24, 0.02, dark, [6.35, 1.5, Z0 - 0.58], [PI / 2, 0, 0], 16);
    b.box(0.9, 0.04, 0.4, dark, [6.6, 1.15, Z0 - 0.38], null, 0);
    // graffiti across the back wall
    b.label(
      4.6,
      1.3,
      K.paint(
        'fl_graf',
        1024,
        290,
        (c, W, H) => {
          c.clearRect(0, 0, W, H);
          c.lineJoin = 'round';
          c.font = 'bold 150px ' + IMPACT;
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.lineWidth = 16;
          c.strokeStyle = '#1a1a1a';
          c.strokeText('SPIN CYCLE', W / 2, 130);
          c.fillStyle = '#4ad04a';
          c.fillText('SPIN CYCLE', W / 2, 130);
          c.font = 'bold 54px ' + SANS;
          c.fillStyle = '#e83a3a';
          c.fillText('THEY CAME BACK FOR THEIR SOCKS', W / 2, 250);
        },
        {alpha: true, r: 0.8}
      ),
      [0.4, 1.5, Z0 - 0.19],
      [0, PI, 0]
    );

    /* ---------- interior: floors, linings, ceilings, lights ---------- */
    const por = K.mat(0xf6f6f2, 0.15, 0.05),
      chrome = K.chrome(),
      ss = K.mat(0xc4c8cc, 0.3, 0.85),
      hous = K.mat(0xd8d8d4, 0.5, 0.2),
      gold = K.mat(0xd4a84a, 0.25, 0.9),
      cream = K.mat(0xf2ead8, 0.85),
      creamU = K.mat(0xe8dcc4, 0.75), // upholstery
      blueB = K.mat(0x1f3f7a, 0.5),
      skirtW = K.mat(0xf4f4f0, 0.5);
    const terra = K.tri(
      'fl_terra',
      (c, W, H, r) => {
        c.fillStyle = '#8a6a50';
        c.fillRect(0, 0, W, H);
        const n = 3,
          s = W / n;
        for (let j = 0; j < n; j++)
          for (let i = 0; i < n; i++) {
            c.fillStyle = `hsl(${26 + r() * 8},${40 + r() * 12}%,${66 + r() * 8}%)`;
            c.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
          }
        P.noise(c, W, H, r, 5000, 0.12, '#5a3a2a', 1.2);
        P.grime(c, W, H, r, 0.3);
      },
      {tile: 1.2, r: 0.35}
    );
    const marble = K.tri(
      'gn_marble',
      (c, W, H, r) => {
        c.fillStyle = '#b8babc';
        c.fillRect(0, 0, W, H);
        c.fillStyle = '#c8cacc';
        c.fillRect(2, 2, W / 2 - 4, H - 4);
        c.fillRect(W / 2 + 2, 2, W / 2 - 4, H - 4);
        c.strokeStyle = 'rgba(80,84,90,0.35)';
        for (let k = 0; k < 14; k++) {
          c.lineWidth = 0.5 + r() * 1.5;
          c.beginPath();
          let x = r() * W,
            y = r() * H;
          c.moveTo(x, y);
          for (let s = 0; s < 6; s++) c.lineTo((x += (r() - 0.3) * 60), (y += (r() - 0.5) * 50));
          c.stroke();
        }
      },
      {tile: 1.2, r: 0.12, m: 0.05}
    );
    const blueTile = K.tri(
      'fl_btile',
      (c, W, H) => {
        c.fillStyle = '#b8c4cc';
        c.fillRect(0, 0, W, H);
        const n = 8,
          s = W / n;
        c.fillStyle = '#5a86b8';
        for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) c.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
      },
      {tile: 1.0, r: 0.25}
    );
    const pinkTile = K.tri(
      'gn_ptile',
      (c, W, H) => {
        c.fillStyle = '#d8c4c8';
        c.fillRect(0, 0, W, H);
        const n = 8,
          s = W / n;
        c.fillStyle = '#f4dce4';
        for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) c.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
      },
      {tile: 1.0, r: 0.25}
    );
    const grimy = K.tri(
      'fl_grimy',
      (c, W, H, r) => {
        c.fillStyle = '#9aa29a';
        c.fillRect(0, 0, W, H);
        const rows = 8,
          bh = H / rows;
        c.strokeStyle = 'rgba(60,64,60,0.35)';
        for (let j = 0; j < rows; j++) {
          c.beginPath();
          c.moveTo(0, j * bh);
          c.lineTo(W, j * bh);
          c.stroke();
        }
        P.noise(c, W, H, r, 8000, 0.2, '#3a3a2a', 1.6);
        P.grime(c, W, H, r, 0.7);
      },
      {tile: 1.6, r: 0.9}
    );
    const dropCeil = K.tri(
      'fl_drop',
      (c, W, H, r) => {
        c.fillStyle = '#ecebe6';
        c.fillRect(0, 0, W, H);
        P.noise(c, W, H, r, 3000, 0.08, '#8a8a80', 1);
        c.fillStyle = '#c8c8c2';
        c.fillRect(0, 0, W, 4);
        c.fillRect(0, 0, 4, H);
        c.fillRect(W / 2, 0, 3, H);
      },
      {tile: 1.2, r: 0.9}
    );
    const conc2 = K.tri(
      'fl_oilconc',
      (c, W, H, r) => {
        c.fillStyle = '#7a7872';
        c.fillRect(0, 0, W, H);
        P.noise(c, W, H, r, 9000, 0.25, '#3a3a34', 1.4);
        P.grime(c, W, H, r, 0.8);
      },
      {tile: 2.0, r: 0.95}
    );
    const flr = (x0, x1, z0, z1, m, y) =>
      b.box(x1 - x0, 0.02, z1 - z0, m, [(x0 + x1) / 2, y || 0.035, (z0 + z1) / 2], null, 0);
    // a lining on a wall whose centre is c, half-thickness half (0.15 for shell / party walls, 0.07 for partitions)
    const lw = (ax, c, a0, a1, n, ops, top, span, half) =>
      LK.lineWall(b, ax, c - n * (0.15 - (half === undefined ? 0.15 : half)), a0, a1, n, ops, top, span);
    const flSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, Math.min(y1, 1.25), blueTile, 0.012, 0.006);
      if (y1 > 1.25) pc(u0, u1, Math.max(y0, 1.35), y1, cream, 0.012, 0.006);
      if (y0 < 1.35 && y1 > 1.25) pc(u0, u1, 1.25, 1.35, blueB, 0.03, 0.015);
    };
    const utilSpan = (pc, u0, u1, y0, y1) => pc(u0, u1, y0, y1, grimy, 0.012, 0.006);
    const gnSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, y1, cream, 0.012, 0.006);
      if (y0 < 1.0 && y1 > 1.04) pc(u0, u1, 1.0, 1.04, gold, 0.025, 0.012);
      if (y0 <= 0 && y1 > 0.2) pc(u0, u1, 0, 0.12, skirtW, 0.03, 0.015);
    };
    const wcSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, Math.min(y1, 1.3), pinkTile, 0.012, 0.006);
      if (y1 > 1.3) pc(u0, u1, Math.max(y0, 1.3), y1, cream, 0.012, 0.006);
    };
    const IN = 0.16,
      Q = 0.07,
      BCEIL = 3.0; // back rooms
    // floors
    flr(X0 + IN, XM - IN, LZ + 0.08, Z1 - IN, terra);
    flr(X0 + IN, XM - IN, Z0 + IN, LZ - 0.08, conc2);
    flr(XM + IN, X1 - IN, RZ + 0.08, Z1 - IN, marble);
    flr(XM + IN, TX - 0.08, Z0 + IN, RZ - 0.08, conc2);
    flr(TX + 0.08, X1 - IN, Z0 + IN, RZ - 0.08, pinkTile);
    // laundromat hall
    lw(1, Z1, X0 + 0.15, XM - 0.15, -1, FRONT_L, CEIL, flSpan);
    lw(0, X0, LZ + Q, Z1, 1, [], CEIL, flSpan);
    lw(0, XM, LZ + Q, Z1, -1, [], CEIL, flSpan);
    lw(1, LZ, X0 + 0.15, XM - 0.15, 1, L_PART, CEIL, flSpan, Q);
    // laundromat utility room
    lw(1, LZ, X0 + 0.15, XM - 0.15, -1, L_PART, BCEIL, utilSpan, Q);
    lw(0, X0, Z0, LZ - Q, 1, [], BCEIL, utilSpan);
    lw(0, XM, Z0, LZ - Q, -1, [], BCEIL, utilSpan);
    lw(1, Z0, X0 + 0.15, XM - 0.15, 1, BACK.slice(0, 1), BCEIL, utilSpan);
    // salon floor
    lw(1, Z1, XM + 0.15, X1 - 0.15, -1, FRONT_R, CEIL, gnSpan);
    lw(0, XM, RZ + Q, Z1, 1, [], CEIL, gnSpan);
    lw(0, X1, RZ + Q, Z1, -1, [], CEIL, gnSpan);
    lw(1, RZ, XM + 0.15, X1 - 0.15, 1, R_PART, CEIL, gnSpan, Q);
    // salon back room
    lw(1, RZ, XM + 0.15, TX - Q, -1, R_PART.slice(0, 1), BCEIL, utilSpan, Q);
    lw(0, XM, Z0, RZ - Q, 1, [], BCEIL, utilSpan);
    lw(0, TX, Z0, RZ - Q, -1, [], BCEIL, utilSpan, Q);
    lw(1, Z0, XM + 0.15, TX - Q, 1, BACK.slice(1), BCEIL, utilSpan);
    // customer toilet
    lw(1, RZ, TX + Q, X1 - 0.15, -1, R_PART.slice(1), 2.8, wcSpan, Q);
    lw(0, TX, Z0, RZ - Q, 1, [], 2.8, wcSpan, Q);
    lw(0, X1, Z0, RZ - Q, -1, [], 2.8, wcSpan);
    lw(1, Z0, TX + Q, X1 - 0.15, 1, [], 2.8, wcSpan);
    // ceilings
    b.box(XM - X0 - 0.3, 0.04, Z1 - LZ - 0.2, dropCeil, [(X0 + XM) / 2, CEIL + 0.02, (LZ + Z1) / 2], null, 0);
    b.box(
      XM - X0 - 0.3,
      0.04,
      LZ - Z0 - 0.2,
      K.mat(0x8a8e88, 0.9),
      [(X0 + XM) / 2, BCEIL + 0.02, (Z0 + LZ) / 2],
      null,
      0
    );
    b.box(
      X1 - XM - 0.3,
      0.04,
      Z1 - RZ - 0.2,
      K.mat(0xf6f4f0, 0.8),
      [(XM + X1) / 2, CEIL + 0.02, (RZ + Z1) / 2],
      null,
      0
    );
    b.box(
      TX - XM - 0.2,
      0.04,
      RZ - Z0 - 0.2,
      K.mat(0x8a8e88, 0.9),
      [(XM + TX) / 2, BCEIL + 0.02, (Z0 + RZ) / 2],
      null,
      0
    );
    b.box(X1 - TX - 0.2, 0.04, RZ - Z0 - 0.2, K.mat(0xf6f4f0, 0.8), [(TX + X1) / 2, 2.82, (Z0 + RZ) / 2], null, 0);
    // laundromat lights: 3 x 3 troffers; a bare batten in the utility room
    for (const lx of [-7.2, -4.0, -0.9])
      for (const lz of [-2.2, 1.5, 5.2]) {
        b.box(1.3, 0.07, 0.6, hous, [lx, CEIL - 0.03, lz], null, 0.01);
        b.box(1.22, 0.012, 0.52, lit, [lx, CEIL - 0.07, lz], null, 0);
      }
    const batten = (x, z, y) => {
      b.box(1.3, 0.06, 0.1, hous, [x, y - 0.04, z], null, 0.01);
      b.cyl(0.025, 0.025, 1.22, lit, [x, y - 0.1, z], [0, 0, PI / 2], 8);
    };
    batten(-6.0, -6.2, BCEIL);
    batten(-1.5, -6.2, BCEIL);
    batten(4.0, -5.6, BCEIL);
    // salon lights: warm cove strip round the ceiling, black track lights, downlights
    const cove = K.mat(0xffc870, 0.4, 0, {emissive: 0xffb050, emissiveIntensity: 1.6});
    b.box(X1 - XM - 0.5, 0.03, 0.04, cove, [(XM + X1) / 2, CEIL - 0.02, Z1 - 0.25], null, 0);
    b.box(X1 - XM - 0.5, 0.03, 0.04, cove, [(XM + X1) / 2, CEIL - 0.02, RZ + 0.25], null, 0);
    b.box(0.04, 0.03, Z1 - RZ - 0.5, cove, [XM + 0.25, CEIL - 0.02, (RZ + Z1) / 2], null, 0);
    b.box(0.04, 0.03, Z1 - RZ - 0.5, cove, [X1 - 0.25, CEIL - 0.02, (RZ + Z1) / 2], null, 0);
    for (const tx of [3.4, 6.9]) {
      b.box(0.05, 0.04, 9.0, dark, [tx, CEIL - 0.02, 2.0], null, 0);
      for (let k = 0; k < 5; k++) {
        const tz = -1.8 + k * 1.9;
        b.cyl(0.012, 0.012, 0.1, dark, [tx, CEIL - 0.09, tz], null, 6);
        b.cyl(0.045, 0.045, 0.16, dark, [tx, CEIL - 0.18, tz + 0.04], [0.5, 0, 0], 10);
        b.cyl(0.035, 0.035, 0.005, warm, [tx, CEIL - 0.24, tz + 0.08], [0.5, 0, 0], 10);
      }
    }
    for (const [dx, dz] of [
      [2.2, 6.4],
      [5.2, 6.4],
      [8.0, 6.4],
      [5.2, 0.8]
    ]) {
      b.cyl(0.08, 0.08, 0.02, hous, [dx, CEIL, dz], null, 12);
      b.cyl(0.06, 0.06, 0.01, lit, [dx, CEIL - 0.012, dz], null, 12);
    }
    b.cyl(0.14, 0.14, 0.03, hous, [7.9, 2.79, -5.6], null, 14);
    b.cyl(0.12, 0.12, 0.01, lit, [7.9, 2.775, -5.6], null, 14);

    /* ---------- The Final Load hall: the washer bank, stacked dryers, folding island, carts, waiting chairs, change machine ---------- */
    {
      // tiled plinth under the washers, pipework on the wall behind
      b.box(0.92, PLINTH, 9.6, blueTile, [X0 + 0.15 + 0.46, PLINTH / 2, 1.42], null, 0.01);
      b.box(0.96, 0.03, 9.64, K.mat(0x2a3a5a, 0.5), [X0 + 0.15 + 0.48, PLINTH + 0.015, 1.42], null, 0);
      for (const [py, pm] of [
        [1.62, K.mat(0xb87333, 0.35, 0.8)],
        [1.74, K.mat(0x9a9ea2, 0.35, 0.8)]
      ])
        b.cyl(0.025, 0.025, 9.6, pm, [X0 + 0.22, py, 1.42], [PI / 2, 0, 0], 8);
      WASH_Z.forEach((wz, i) => {
        b.cyl(0.015, 0.015, 0.3, K.mat(0x9a9ea2, 0.35, 0.8), [X0 + 0.22, 1.5, wz], null, 6);
        if (WASH_LOOT.includes(i)) return; // the lootable ones are props, placed at build
        b.push([WASH_X, PLINTH, wz], [0, PI / 2, 0]);
        washerGeo(b);
        b.pop();
      });
      S(X0 + 0.15, X0 + 1.07, -3.38, 6.22, 0, PLINTH + WH, true);
      b.label(
        2.6,
        0.4,
        strapMat('fl_wprice', 'WASHERS  $3.50 · 30 MIN', 'bold 44px ' + SANS, ORANGE, '#ffffff', 768, 116),
        [X0 + 0.18, 2.3, 1.4],
        [0, PI / 2, 0]
      );
      // four columns of stacked dryers against the partition, facing the hall
      const dz = LZ + Q + 0.43;
      for (const dx of [-8.3, -7.16, -6.02, -4.88]) {
        const body = K.paintSteel(0xb8bcc0, {m: 0.75, r: 0.32});
        rb(1.12, 2.35, 0.86, 0.015, body, [dx, 1.175, dz]);
        for (const dy of [0.62, 1.72]) {
          b.cyl(0.4, 0.4, 0.02, K.mat(0x101214, 0.6), [dx, dy, dz + 0.432], [PI / 2, 0, 0], 20);
          b.tor(0.38, 0.04, chrome, [dx, dy, dz + 0.45], null, PI * 2, 20);
          b.cyl(0.35, 0.35, 0.012, K.glass(0x9ab0bc, 0.55), [dx, dy, dz + 0.45], [PI / 2, 0, 0], 20);
          b.box(0.06, 0.16, 0.05, chrome, [dx + 0.42, dy, dz + 0.46], null, 0.01);
        }
        b.box(1.08, 0.16, 0.03, K.paintSteel(0xd8dadc, {m: 0.6, r: 0.3}), [dx, 1.17, dz + 0.44], null, 0);
        b.box(
          0.16,
          0.06,
          0.012,
          K.mat(0x301008, 0.3, 0, {emissive: 0xff5020, emissiveIntensity: 0.7}),
          [dx - 0.25, 1.17, dz + 0.456],
          null,
          0
        );
        b.box(0.08, 0.1, 0.02, dark, [dx + 0.2, 1.17, dz + 0.46], null, 0);
        b.box(1.1, 0.14, 0.03, K.paintSteel(0xd8dadc, {m: 0.6, r: 0.3}), [dx, 2.25, dz + 0.44], null, 0);
      }
      S(-8.86, -4.32, LZ + Q, LZ + Q + 0.87, 0, 2.35, true);
      b.label(
        2.4,
        0.36,
        strapMat('fl_dprice', 'DRYERS  25¢ · 6 MIN', 'bold 44px ' + SANS, '#1f3fae', '#ffffff', 768, 116),
        [-6.6, 2.75, LZ + Q + 0.02]
      );
      // folding island: laminate top on a steel frame, a shelf of baskets underneath
      const ix0 = -5.4,
        ix1 = -4.2,
        iz0 = -1.6,
        iz1 = 3.6;
      b.box(ix1 - ix0, 0.04, iz1 - iz0, K.mat(0xf0eee8, 0.5), [(ix0 + ix1) / 2, 0.9, (iz0 + iz1) / 2], null, 0.01);
      b.box(
        ix1 - ix0 - 0.1,
        0.03,
        iz1 - iz0 - 0.1,
        K.mat(0x8a8e92, 0.5, 0.6),
        [(ix0 + ix1) / 2, 0.25, (iz0 + iz1) / 2],
        null,
        0
      );
      for (const lx of [ix0 + 0.06, ix1 - 0.06])
        for (const lz of [iz0 + 0.06, (iz0 + iz1) / 2, iz1 - 0.06])
          b.box(0.05, 0.88, 0.05, steel, [lx, 0.44, lz], null, 0);
      S(ix0, ix1, iz0, iz1, 0, 0.92, true);
      const basket = (x, y, z, col, a) => {
        b.push([x, y, z], [0, a || 0, 0]);
        b.cyl(0.24, 0.21, 0.28, K.mat(col, 0.6), [0, 0.14, 0], null, 12, true);
        b.cyl(0.21, 0.21, 0.01, K.mat(col, 0.6), [0, 0.005, 0], null, 12);
        b.sph(0.2, K.mat(0xe8e0d0, 0.9), [0, 0.24, 0], [1, 0.35, 1], 8);
        b.pop();
      };
      basket(-4.8, 0.92, -0.9, 0x2a7ad8);
      basket(-4.75, 0.92, 2.9, 0xe84a8a);
      basket(-4.9, 0.27, 0.4, 0xf2c418);
      basket(-4.7, 0.27, 1.6, 0x3ab06a);
      // folded laundry stacks on the island
      for (const [fx, fz, n, col] of [
        [-4.9, 0.3, 5, 0xf4f4f0],
        [-4.65, 0.6, 3, 0x5a8ad0],
        [-4.85, 1.4, 4, 0xd85a5a],
        [-4.7, 2.0, 6, 0xe8e4d8]
      ])
        for (let k = 0; k < n; k++)
          b.box(
            0.36,
            0.05,
            0.3,
            K.mat(k % 2 ? col : 0xe8e8e4, 0.9),
            [fx, 0.945 + k * 0.05, fz],
            [0, (k % 3) * 0.06, 0],
            0
          );
      // rolling laundry carts with hanging rails
      const cart = (x, z, a) => {
        b.push([x, 0, z], [0, a || 0, 0]);
        const w = K.mat(0xc8ccd0, 0.3, 0.8);
        b.box(0.6, 0.02, 0.9, w, [0, 0.45, 0], null, 0);
        b.frame(0.6, 0.4, 0.02, w, [0, 0.65, 0.45], 0.02);
        b.frame(0.6, 0.4, 0.02, w, [0, 0.65, -0.45], 0.02);
        for (const sx of [-0.3, 0.3]) {
          b.box(0.02, 0.4, 0.9, K.mat(0xc8ccd0, 0.3, 0.8), [sx, 0.65, 0], null, 0);
          b.cyl(0.012, 0.012, 1.7, w, [sx, 0.85, -0.42], null, 6);
          for (const cz of [-0.4, 0.4]) b.sph(0.04, dark, [sx, 0.04, cz], null, 6);
          b.cyl(0.012, 0.012, 0.4, w, [sx, 0.25, 0], null, 6);
        }
        b.cyl(0.012, 0.012, 0.62, w, [0, 1.7, -0.42], [0, 0, PI / 2], 6);
        for (const hx of [-0.15, 0.1]) b.tor(0.06, 0.006, w, [hx, 1.64, -0.42], null, PI * 2, 8);
        b.pop();
      };
      cart(-6.7, 4.9, 0.2);
      S(-7.05, -6.35, 4.4, 5.4, 0, 1.0, true);
      cart(-3.2, -2.5, -0.3);
      S(-3.55, -2.85, -3.0, -2.0, 0, 1.0, true);
      cart(-6.6, -1.2, PI / 2 + 0.15);
      S(-7.1, -6.1, -1.55, -0.85, 0, 1.0, true);
      // waiting row of moulded chairs on a beam along the party wall, facing the washers; a TV and a magazine table
      const chairM = [0xf26a1f, 0x2a5ab8, 0xf26a1f, 0x2a5ab8, 0xf26a1f, 0x2a5ab8];
      const crx = XM - 0.15 - 0.4;
      b.box(0.06, 0.06, 4.4, steel, [crx, 0.38, 1.2], null, 0);
      for (const lz of [-0.9, 3.3]) b.box(0.4, 0.38, 0.05, steel, [crx, 0.19, lz], null, 0);
      chairM.forEach((cm, i) => {
        const cz = -0.65 + i * 0.74,
          m = K.mat(cm, 0.4);
        b.push([crx, 0, cz], [0, -PI / 2, 0]);
        b.rbox(0.5, 0.05, 0.46, 0.02, m, [0, 0.44, 0.02]);
        b.rbox(0.5, 0.42, 0.04, 0.02, m, [0, 0.7, -0.22], [-0.12, 0, 0]);
        b.pop();
      });
      S(crx - 0.3, XM - 0.15, -1.0, 3.5, 0, 0.9, true);
      b.box(0.6, 0.4, 1.0, K.mat(0x6a4a30, 0.6), [crx - 0.85, 0.2, 1.2], null, 0.02);
      for (let k = 0; k < 4; k++)
        b.box(
          0.22,
          0.01,
          0.3,
          K.mat([0xd84a4a, 0x4a8ad8, 0xe8c84a, 0xf4f4f0][k], 0.7),
          [crx - 0.85 + (k % 2) * 0.1 - 0.05, 0.405 + k * 0.01, 0.9 + k * 0.2],
          [0, k * 0.4, 0],
          0
        );
      S(crx - 1.15, crx - 0.55, 0.7, 1.7, 0, 0.42, true);
      b.box(0.08, 0.62, 1.05, dark, [XM - 0.2, 2.4, 1.2], null, 0.01);
      b.box(
        0.01,
        0.55,
        0.96,
        K.mat(0x1a2a3a, 0.2, 0, {emissive: 0x4a7aa0, emissiveIntensity: 0.35}),
        [XM - 0.245, 2.4, 1.2],
        null,
        0
      );
      b.box(0.3, 0.06, 0.1, dark, [XM - 0.2, 2.06, 1.2], null, 0);
      // change machine and soap vend on the partition by the utility door
      for (const [vx, txt, col] of [
        [-3.6, 'CHANGE', '#1f3fae'],
        [-2.8, 'SOAP', ORANGE]
      ]) {
        const vz = LZ + Q + 0.24;
        rb(0.62, 1.55, 0.46, 0.02, K.paintSteel(0x9ea2a6, {m: 0.6, r: 0.4}), [vx, 0.78, vz]);
        b.label(0.5, 0.18, strapMat('fl_v' + txt, txt, 'bold 56px ' + SANS, col, '#ffffff', 384, 136), [
          vx,
          1.35,
          vz + 0.235
        ]);
        b.box(
          0.3,
          0.2,
          0.02,
          K.mat(0x103018, 0.3, 0, {emissive: 0x40ff70, emissiveIntensity: 0.4}),
          [vx, 1.05, vz + 0.235],
          null,
          0
        );
        b.box(0.12, 0.2, 0.03, dark, [vx + 0.15, 0.8, vz + 0.235], null, 0);
        b.box(0.24, 0.12, 0.08, dark, [vx, 0.35, vz + 0.25], null, 0.01);
      }
      S(-3.92, -2.48, LZ + Q, LZ + Q + 0.48, 0, 1.56, true);
      // rules board on the party wall, a clock over the utility door
      b.label(
        0.9,
        1.2,
        K.paint('fl_rules', 300, 400, (c, W, H) => {
          c.fillStyle = '#fffdf4';
          c.fillRect(0, 0, W, H);
          c.fillStyle = ORANGE;
          c.fillRect(0, 0, W, 60);
          P.text(c, 'HOUSE RULES', W / 2, 32, {size: 30, col: '#fff', font: SANS, weight: 'bold'});
          [
            '1. NO DYING IN THE MACHINES',
            '2. EMPTY POCKETS OF',
            '    FINGERS BEFORE WASHING',
            '3. DO NOT LEAVE CHILDREN',
            '    OR THE UNDEAD UNATTENDED',
            '4. REMOVE CLOTHES PROMPTLY',
            '5. NOT RESPONSIBLE FOR',
            '    LOST SOCKS OR LIMBS',
            '',
            '— THE MANAGEMENT'
          ].forEach((s, i) =>
            P.text(c, s, 18, 92 + i * 30, {size: 17, col: '#2a2a2a', font: SANS, weight: 'bold', align: 'left'})
          );
        }),
        [XM - 0.17, 1.75, 5.4],
        [0, -PI / 2, 0]
      );
      b.cyl(0.18, 0.18, 0.04, K.mat(0xf4f4f0, 0.5), [-1.2, 2.85, LZ + Q + 0.03], [PI / 2, 0, 0], 20);
      b.tor(0.18, 0.015, dark, [-1.2, 2.85, LZ + Q + 0.05], null, PI * 2, 20);
      b.box(0.01, 0.12, 0.005, dark, [-1.2, 2.88, LZ + Q + 0.06], null, 0);
      b.box(0.08, 0.01, 0.005, dark, [-1.17, 2.85, LZ + Q + 0.06], null, 0);
    }

    /* ---------- The Final Load utility room: water heaters, mop sink, detergent pallet, a gutted washer, breaker panel ---------- */
    {
      for (const hx of [-8.35, -7.6]) {
        b.cyl(0.33, 0.33, 1.8, K.mat(0xe0dccc, 0.5, 0.2), [hx, 0.92, Z0 + 0.5], null, 18);
        b.cyl(0.33, 0.3, 0.1, K.mat(0xc8c4b4, 0.5, 0.2), [hx, 1.86, Z0 + 0.5], null, 18);
        b.cyl(0.04, 0.04, 1.1, K.mat(0xb87333, 0.35, 0.8), [hx, 2.45, Z0 + 0.5], null, 8);
        b.box(0.18, 0.12, 0.04, K.mat(0x2a2a2a, 0.5), [hx, 0.4, Z0 + 0.84], null, 0);
      }
      b.cyl(0.04, 0.04, 1.3, K.mat(0xb87333, 0.35, 0.8), [-7.98, 2.95, Z0 + 0.5], [0, 0, PI / 2], 8);
      S(-8.7, -7.25, Z0 + 0.15, Z0 + 0.85, 0, 1.9, true);
      // floor mop sink with a mop bucket
      b.box(0.8, 0.3, 0.6, K.mat(0xd8d6d0, 0.4), [-6.5, 0.15, Z0 + 0.45], null, 0.03);
      b.box(0.7, 0.02, 0.5, K.mat(0x3a3a34, 0.3), [-6.5, 0.29, Z0 + 0.45], null, 0);
      b.cyl(0.015, 0.015, 0.4, chrome, [-6.5, 0.8, Z0 + 0.2], null, 8);
      b.cyl(0.2, 0.17, 0.3, K.mat(0xe8b020, 0.5), [-5.9, 0.17, Z0 + 0.5], null, 14);
      b.cyl(0.012, 0.012, 1.2, K.mat(0x8a6a4a, 0.6), [-5.85, 0.75, Z0 + 0.5], [0.15, 0, 0.1], 6);
      S(-6.9, -6.1, Z0 + 0.15, Z0 + 0.75, 0, 0.3, true);
      // pallet of DIRT BEGONE detergent boxes
      const det = K.paint('fl_det', 128, 128, (c, W, H) => {
        c.fillStyle = ORANGE;
        c.fillRect(0, 0, W, H);
        c.fillStyle = '#1f3fae';
        c.fillRect(0, H * 0.35, W, H * 0.3);
        P.text(c, 'DIRT', W / 2, H * 0.42, {size: 22, col: '#fff', font: SANS, weight: 'bold'});
        P.text(c, 'BEGONE', W / 2, H * 0.58, {size: 20, col: '#fff', font: SANS, weight: 'bold'});
      });
      b.box(1.2, 0.14, 1.0, K.mat(0xa08058, 0.8), [-5.6, 0.07, -5.4], null, 0.01);
      for (let i = 0; i < 3; i++)
        for (let j = 0; j < 2; j++)
          for (let k = 0; k < 2 + ((i + j) % 2); k++)
            b.box(
              0.36,
              0.3,
              0.44,
              det,
              [-5.98 + i * 0.38, 0.29 + k * 0.31, -5.62 + j * 0.46],
              [0, (k % 2) * 0.05, 0],
              0
            );
      S(-6.2, -5.0, -5.9, -4.9, 0, 1.0, true);
      // a gutted washer with its front panel off, the panel leaning on it
      b.push([-3.9, 0, Z0 + 0.6], [0, 0.1, 0]);
      washerGeo(b, 0x9a9e9a);
      b.pop();
      b.box(0.86, 0.9, 0.02, K.paintSteel(0x9a9e9a, {m: 0.6, r: 0.5}), [-4.7, 0.46, Z0 + 0.5], [-0.25, -0.3, 0], 0);
      S(-5.15, -3.45, Z0 + 0.15, Z0 + 1.05, 0, 1.05, true);
      // breaker panel and a lint bin
      b.box(0.5, 0.7, 0.1, K.mat(0x8a8e8a, 0.5, 0.5), [X0 + 0.22, 1.6, -5.4], null, 0.01);
      b.box(0.02, 0.6, 0.4, dark, [X0 + 0.28, 1.6, -5.4], null, 0);
      b.cyl(0.28, 0.25, 0.7, K.mat(0x5a5e62, 0.6), [-8.4, 0.35, -5.2], null, 14);
      b.sph(0.27, K.mat(0x9a9a98, 0.95), [-8.4, 0.72, -5.2], [1, 0.45, 1], 8);
      S(-8.7, -8.1, -5.5, -4.9, 0, 0.8, true);
      b.label(0.6, 0.18, strapMat('fl_staff', 'STAFF ONLY', 'bold 40px ' + SANS, INK, '#ffffff', 512, 112), [
        -1.2,
        2.55,
        LZ + Q + 0.02
      ]);
    }

    /* ---------- Get Nailed salon: polish wall, reception, waiting corner, manicure stations, pedicure thrones ---------- */
    // a cream tub chair with gold bands on a gold sled base; front = +z
    const tubChair = (x, z, a) => {
      b.push([x, 0, z], [0, a || 0, 0]);
      b.cyl(0.32, 0.32, 0.14, creamU, [0, 0.42, 0.02], null, 18);
      b.push([0, 0, 0], [0, -0.15 * PI, 0]);
      for (let k = 0; k < 3; k++) b.tor(0.31, 0.07, creamU, [0, 0.52 + k * 0.13, 0], [-PI / 2, 0, 0], PI * 1.3, 10);
      for (let k = 0; k < 3; k++) b.tor(0.33, 0.012, gold, [0, 0.46 + k * 0.13, 0], [-PI / 2, 0, 0], PI * 1.3, 10);
      b.pop();
      b.tor(0.3, 0.015, gold, [0, 0.02, 0], [PI / 2, 0, 0], PI * 2, 12);
      b.cyl(0.02, 0.02, 0.34, gold, [0, 0.19, -0.26], null, 6);
      b.cyl(0.2, 0.2, 0.02, gold, [0, 0.35, 0], null, 14);
      b.pop();
    };
    const stool = (x, z) => {
      b.cyl(0.18, 0.18, 0.08, K.mat(0x2a2a2a, 0.5), [x, 0.55, z], null, 14);
      b.cyl(0.025, 0.025, 0.45, chrome, [x, 0.3, z], null, 8);
      b.cyl(0.2, 0.2, 0.02, chrome, [x, 0.06, z], null, 5);
    };
    {
      // the lit polish wall on the party wall: a rounded niche over a white-and-gold base cabinet
      const nz0 = 0.2,
        nz1 = 4.2,
        nzc = (nz0 + nz1) / 2,
        nx = XM + 0.15;
      b.box(0.42, 0.85, nz1 - nz0, skirtW, [nx + 0.21, 0.425, nzc], null, 0.02);
      for (const gy of [0.3, 0.6]) b.box(0.43, 0.02, nz1 - nz0, gold, [nx + 0.21, gy, nzc], null, 0);
      b.box(0.44, 0.04, nz1 - nz0 + 0.04, marble, [nx + 0.22, 0.87, nzc], null, 0.01);
      S(nx, nx + 0.44, nz0, nz1, 0, 0.9, true);
      rb(0.1, 1.9, nz1 - nz0 + 0.2, 0.06, K.mat(0xf2ece0, 0.5), [nx + 0.05, 1.85, nzc]);
      b.label(nz1 - nz0 - 0.1, 1.6, polishWall(), [nx + 0.105, 1.85, nzc], [0, PI / 2, 0]);
      b.box(0.02, 1.66, 0.03, cove, [nx + 0.11, 1.85, nz0 + 0.03], null, 0);
      b.box(0.02, 1.66, 0.03, cove, [nx + 0.11, 1.85, nz1 - 0.03], null, 0);
      // shelf lips (a few real bottles at the front of each shelf for depth)
      for (let k = 0; k < 7; k++) {
        const sy = 1.05 + k * 0.228;
        b.box(0.08, 0.008, nz1 - nz0 - 0.1, K.glass(0xffffff, 0.35), [nx + 0.14, sy, nzc], null, 0);
      }
      const pal = [0xe8488a, 0xc81a3a, 0x8a1a5a, 0xf2a0b8, 0xd85a2a, 0x2a4ab8, 0x1a1a1a, 0xe8d0c0];
      for (let k = 0; k < 18; k++)
        b.cyl(0.018, 0.022, 0.07, K.mat(pal[k % pal.length], 0.2), [nx + 0.5, 0.925, 0.5 + k * 0.2], null, 8);
      // reception desk: white with gold bands, marble top, the book, card machine, roses
      const rx0 = 1.5,
        rx1 = 3.3,
        rzc = 4.9;
      b.box(rx1 - rx0, 1.02, 0.6, skirtW, [(rx0 + rx1) / 2, 0.51, rzc], null, 0.02);
      for (const gy of [0.25, 0.5, 0.75])
        b.box(rx1 - rx0 + 0.01, 0.03, 0.61, gold, [(rx0 + rx1) / 2, gy, rzc], null, 0);
      b.box(rx1 - rx0 + 0.08, 0.04, 0.68, marble, [(rx0 + rx1) / 2, 1.04, rzc], null, 0.01);
      S(rx0, rx1, rzc - 0.3, rzc + 0.3, 0, 1.06, true);
      b.box(0.3, 0.03, 0.22, K.mat(0x1a1a1a, 0.6), [2.9, 1.075, rzc - 0.05], [0, 0.2, 0], 0.005);
      b.box(0.08, 0.02, 0.14, dark, [1.75, 1.07, rzc + 0.1], null, 0.005);
      b.cyl(0.06, 0.05, 0.22, K.glass(0xe8f4f8, 0.4), [1.7, 1.17, rzc - 0.15], null, 10);
      for (let k = 0; k < 5; k++)
        b.sph(
          0.04,
          K.mat(0xc81a2a, 0.5),
          [1.7 + Math.cos(k * 1.3) * 0.05, 1.32 + (k % 2) * 0.04, rzc - 0.15 + Math.sin(k * 1.3) * 0.05],
          null,
          6
        );
      stool(2.4, 4.3);
      // waiting: a cream sofa under the front-left window, tub chairs and a side table in the front-right corner
      {
        const sx = 2.3,
          sz = Z1 - 0.15 - 0.4;
        b.box(1.5, 0.4, 0.75, creamU, [sx, 0.2, sz], null, 0.05);
        b.rbox(1.5, 0.5, 0.18, 0.06, creamU, [sx, 0.62, sz + 0.28]);
        for (const ax of [-0.7, 0.7]) b.rbox(0.14, 0.26, 0.75, 0.05, creamU, [sx + ax, 0.5, sz]);
        b.box(1.52, 0.02, 0.77, gold, [sx, 0.04, sz], null, 0);
        S(sx - 0.78, sx + 0.78, sz - 0.4, sz + 0.4, 0, 0.9, true);
      }
      tubChair(6.4, 6.75, PI);
      tubChair(8.1, 6.75, PI);
      S(6.05, 6.75, 6.4, 7.1, 0, 0.85, true);
      S(7.75, 8.45, 6.4, 7.1, 0, 0.85, true);
      b.cyl(0.24, 0.24, 0.03, marble, [7.25, 0.55, 6.85], null, 18);
      b.cyl(0.03, 0.03, 0.52, gold, [7.25, 0.27, 6.85], null, 8);
      b.cyl(0.16, 0.16, 0.02, gold, [7.25, 0.01, 6.85], null, 14);
      b.box(0.2, 0.01, 0.28, K.mat(0xe8488a, 0.7), [7.22, 0.575, 6.85], [0, 0.3, 0], 0);
      S(7.0, 7.5, 6.6, 7.1, 0, 0.58, true);
      // three manicure stations along the right wall: glass-topped white table with gold band, UV lamp, dust fan, polish rack
      for (const mz of [4.2, 2.0, -0.2]) {
        const tx0 = 6.75,
          tx1 = 7.95,
          tc = (tx0 + tx1) / 2;
        b.box(tx1 - tx0, 0.72, 0.56, skirtW, [tc, 0.36, mz], null, 0.02);
        b.box(tx1 - tx0 + 0.01, 0.03, 0.57, gold, [tc, 0.6, mz], null, 0);
        b.box(tx1 - tx0 + 0.04, 0.02, 0.6, K.glass(0xeaf4f4, 0.45), [tc, 0.74, mz], null, 0);
        S(tx0, tx1, mz - 0.28, mz + 0.28, 0, 0.76, true);
        b.cyl(0.1, 0.1, 0.02, dark, [tc - 0.1, 0.76, mz], null, 16); // dust collector grille
        b.cyl(0.08, 0.08, 0.005, K.mat(0x3a3a3a, 0.6), [tc - 0.1, 0.772, mz], null, 16);
        b.rbox(0.28, 0.12, 0.22, 0.05, K.mat(0xf8f8f8, 0.3), [tx1 - 0.2, 0.81, mz + 0.12]); // UV lamp
        b.box(
          0.2,
          0.01,
          0.12,
          K.mat(0x8a40ff, 0.3, 0, {emissive: 0x9a50ff, emissiveIntensity: 0.9}),
          [tx1 - 0.2, 0.75, mz + 0.12],
          null,
          0
        );
        b.box(0.32, 0.01, 0.24, K.mat(0xf4f4f0, 0.9), [tc - 0.1, 0.755, mz - 0.05], [0, 0.2, 0], 0); // towel
        for (let k = 0; k < 6; k++)
          b.cyl(
            0.014,
            0.017,
            0.06,
            K.mat(pal[(k + mz * 3) & 7], 0.2),
            [tx1 - 0.12, 0.78, mz - 0.22 + k * 0.035],
            null,
            8
          );
        b.cyl(0.06, 0.06, 0.07, K.mat(0xe8e8e8, 0.4), [tx0 + 0.12, 0.785, mz - 0.18], null, 10); // acetone pot
        tubChair(tx0 - 0.6, mz, PI / 2);
        S(tx0 - 0.95, tx0 - 0.25, mz - 0.35, mz + 0.35, 0, 0.85, true);
        stool(X1 - 0.15 - 0.45, mz);
        S(X1 - 0.8, X1 - 0.4, mz - 0.2, mz + 0.2, 0, 0.6, true);
      }
      // two pedicure thrones on a white platform against the back partition, foot basins in front
      const px0 = 3.45,
        px1 = 6.35,
        pz0 = RZ + Q,
        pz1 = RZ + 1.25;
      b.box(px1 - px0, 0.34, pz1 - pz0, skirtW, [(px0 + px1) / 2, 0.17, (pz0 + pz1) / 2], null, 0.02);
      b.box(px1 - px0 + 0.01, 0.03, pz1 - pz0 + 0.01, gold, [(px0 + px1) / 2, 0.24, (pz0 + pz1) / 2], null, 0);
      b.box(px1 - px0, 0.02, pz1 - pz0, marble, [(px0 + px1) / 2, 0.35, (pz0 + pz1) / 2], null, 0);
      S(px0, px1, pz0, pz1, 0, 0.36, true);
      for (const tx of [4.2, 5.6]) {
        const sz = pz0 + 0.55,
          lth = K.mat(0x3a2a24, 0.45);
        b.rbox(0.8, 0.22, 0.7, 0.06, lth, [tx, 0.66, sz]);
        b.rbox(0.8, 0.85, 0.22, 0.08, lth, [tx, 1.1, sz - 0.3], [-0.15, 0, 0]);
        for (const ax of [-0.42, 0.42]) {
          b.rbox(0.14, 0.24, 0.7, 0.05, lth, [tx + ax, 0.86, sz]);
          b.box(0.15, 0.02, 0.5, gold, [tx + ax, 0.99, sz + 0.05], null, 0);
        }
        b.box(0.7, 0.3, 0.6, skirtW, [tx, 0.5, sz], null, 0.02);
        b.rbox(0.36, 0.14, 0.3, 0.04, lth, [tx, 0.42, pz1 + 0.1], [0.5, 0, 0]); // foot rest
        S(tx - 0.5, tx + 0.5, pz0, pz1, 0, 1.5, true);
        // foot basin and the tech's stool
        b.lathe(
          [
            [0, 0],
            [0.24, 0],
            [0.3, 0.2],
            [0.29, 0.22],
            [0.22, 0.04],
            [0, 0.04]
          ],
          K.mat(0xf8f8f8, 0.15),
          [tx, 0.0, pz1 + 0.45],
          20
        );
        b.cyl(0.24, 0.24, 0.01, K.glass(0xbfe4f0, 0.6), [tx, 0.15, pz1 + 0.45], null, 20);
        S(tx - 0.3, tx + 0.3, pz1 + 0.15, pz1 + 0.75, 0, 0.22, true);
        stool(tx, pz1 + 1.1);
      }
      // GET NAILED neon over the thrones
      b.label(
        2.2,
        0.6,
        decal('gn_neonwall', [['Get Nailed', '110px Georgia, serif', '#ff5aa8', 0.5, 26]], 512, 160, {glow: 1.1}),
        [4.9, 2.45, RZ + Q + 0.02]
      );
      // facial steamer, pedestal fan, a big plant, a nail-art display table
      {
        const fx = 3.0,
          fz = -1.0,
          wm = K.mat(0xf6f6f4, 0.35);
        for (let k = 0; k < 5; k++)
          b.cyl(
            0.015,
            0.015,
            0.25,
            wm,
            [fx + Math.cos(k * 1.26) * 0.25, 0.08, fz + Math.sin(k * 1.26) * 0.25],
            [Math.sin(k * 1.26) * 1.2, 0, -Math.cos(k * 1.26) * 1.2],
            6
          );
        b.cyl(0.03, 0.03, 1.1, chrome, [fx, 0.65, fz], null, 8);
        rb(0.26, 0.3, 0.22, 0.05, wm, [fx, 0.9, fz]);
        b.cyl(0.08, 0.1, 0.14, K.glass(0xe8f4f8, 0.5), [fx, 0.72, fz], null, 12);
        b.cyl(0.02, 0.02, 0.5, chrome, [fx + 0.2, 1.25, fz], [0, 0, -0.8], 8);
        b.cyl(0.06, 0.04, 0.12, wm, [fx + 0.42, 1.4, fz], [0, 0, -1.2], 12);
        S(fx - 0.26, fx + 0.26, fz - 0.26, fz + 0.26, 0, 1.2, true);
        // pedestal fan
        const pfx = 8.5,
          pfz = -1.7;
        b.cyl(0.18, 0.2, 0.05, wm, [pfx, 0.03, pfz], null, 16);
        b.cyl(0.025, 0.025, 1.0, wm, [pfx, 0.55, pfz], null, 8);
        b.cyl(0.26, 0.26, 0.14, K.mat(0x2a2a2a, 0.5), [pfx, 1.15, pfz], [PI / 2, 0, PI / 2 + 0.6], 20, true);
        b.cyl(0.08, 0.08, 0.1, wm, [pfx, 1.15, pfz], [PI / 2, 0, PI / 2 + 0.6], 12);
        S(pfx - 0.2, pfx + 0.2, pfz - 0.2, pfz + 0.2, 0, 1.3, true);
        // plant in a gold pot
        b.cyl(0.24, 0.18, 0.5, gold, [1.5, 0.25, -2.85], null, 16);
        for (let k = 0; k < 7; k++)
          b.add(K.sphGeo(0.22, 8, 6), k % 2 ? leaf : leaf2, {
            p: [1.5 + Math.cos(k) * 0.14, 0.75 + (k % 3) * 0.22, -2.85 + Math.sin(k) * 0.14],
            s: [0.5, 1.2, 0.5],
            r: [Math.cos(k) * 0.5, 0, Math.sin(k) * 0.5]
          });
        S(1.26, 1.74, -3.1, -2.6, 0, 1.3, true);
        // round display table of nail tips and colour wheels
        b.cyl(0.45, 0.45, 0.04, marble, [4.2, 0.8, 2.2], null, 20);
        b.cyl(0.04, 0.05, 0.78, gold, [4.2, 0.4, 2.2], null, 10);
        b.cyl(0.3, 0.3, 0.02, gold, [4.2, 0.01, 2.2], null, 16);
        for (let k = 0; k < 3; k++) {
          const a = k * 2.1;
          b.cyl(
            0.12,
            0.12,
            0.01,
            K.paint('gn_wheel', 128, 128, (c, W, H) => {
              for (let i = 0; i < 16; i++) {
                c.fillStyle = `hsl(${i * 22},70%,55%)`;
                c.beginPath();
                c.moveTo(W / 2, H / 2);
                c.arc(W / 2, H / 2, W / 2, (i * PI) / 8, ((i + 1) * PI) / 8);
                c.fill();
              }
            }),
            [4.2 + Math.cos(a) * 0.24, 0.83, 2.2 + Math.sin(a) * 0.24],
            [0.2, a, 0],
            20
          );
        }
        S(3.75, 4.65, 1.75, 2.65, 0, 0.82, true);
      }
      // price list on the right wall by the front, door plates
      b.label(
        0.8,
        1.1,
        K.paint('gn_menu', 300, 412, (c, W, H) => {
          c.fillStyle = '#1a1a1a';
          c.fillRect(0, 0, W, H);
          c.strokeStyle = '#d4a84a';
          c.lineWidth = 6;
          c.strokeRect(8, 8, W - 16, H - 16);
          P.text(c, 'MENU', W / 2, 46, {size: 34, col: '#d4a84a', font: 'Georgia, serif', weight: 'bold'});
          [
            ['Classic Mani', '25'],
            ['Gel Mani', '40'],
            ['Spa Pedi', '35'],
            ['Deluxe Pedi', '50'],
            ['Acrylic Full Set', '55'],
            ['Infill', '35'],
            ['Nail Art (each)', '5'],
            ['Talon Sharpening', '10'],
            ['Cuticle Removal', '0*']
          ].forEach(([a, p], i) => {
            P.text(c, a, 24, 96 + i * 32, {size: 18, col: '#f4ecdc', font: SANS, align: 'left'});
            P.text(c, '$' + p, W - 24, 96 + i * 32, {
              size: 18,
              col: '#d4a84a',
              font: SANS,
              align: 'right',
              weight: 'bold'
            });
          });
          P.text(c, '*knuckles extra', W / 2, 392, {size: 14, col: '#a89a8a', font: SANS});
        }),
        [X1 - 0.17, 1.75, 5.6],
        [0, -PI / 2, 0]
      );
      b.label(0.6, 0.16, strapMat('gn_rr', 'RESTROOM', 'bold 40px ' + SANS, PINK, '#ffffff', 512, 136), [
        8.0,
        2.55,
        RZ + Q + 0.02
      ]);
      b.label(0.6, 0.16, strapMat('gn_staff', 'STAFF ONLY', 'bold 40px ' + SANS, INK, '#ffffff', 512, 136), [
        2.4,
        2.55,
        RZ + Q + 0.02
      ]);
    }

    /* ---------- Get Nailed customer toilet: WC, basin + mirror, hand dryer, grab rail ---------- */
    {
      const wx = 7.9,
        wz = Z0 + 0.15 + 0.45;
      b.push([wx, 0, wz], [0, 0, 0]);
      b.lathe(
        [
          [0, 0],
          [0.16, 0],
          [0.18, 0.2],
          [0.22, 0.38],
          [0.2, 0.42],
          [0, 0.42]
        ],
        por,
        [0, 0, 0.12],
        16
      );
      b.add(K.cylGeo(0.22, 0.22, 0.03, 16), por, {p: [0, 0.43, 0.12], s: [1, 1, 1.25]});
      b.rbox(0.42, 0.42, 0.2, 0.03, por, [0, 0.62, -0.18]);
      b.box(0.12, 0.04, 0.03, chrome, [0.12, 0.8, -0.07], null, 0);
      b.pop();
      S(wx - 0.3, wx + 0.3, Z0 + 0.15, Z0 + 0.95, 0, 0.8, true);
      b.cyl(0.018, 0.018, 0.7, chrome, [X1 - 0.2, 0.85, wz + 0.2], [PI / 2, 0, 0], 8); // grab rail
      b.cyl(0.06, 0.06, 0.1, por, [TX + 0.2, 0.75, wz + 0.1], [0, 0, PI / 2], 12); // paper roll
      const bz = -5.4;
      b.box(0.45, 0.15, 0.5, por, [X1 - 0.38, 0.82, bz], null, 0.04);
      b.cyl(0.04, 0.05, 0.7, por, [X1 - 0.38, 0.4, bz], null, 12);
      b.cyl(0.012, 0.012, 0.15, chrome, [X1 - 0.5, 0.95, bz], null, 8);
      b.box(0.02, 0.7, 0.5, K.mat(0xcfe0e8, 0.05, 0.9), [X1 - 0.16, 1.55, bz], null, 0);
      b.frame(0.54, 0.74, 0.03, gold, [X1 - 0.155, 1.55, bz], 0.02);
      S(X1 - 0.62, X1 - 0.15, bz - 0.25, bz + 0.25, 0, 0.95, true);
      rb(0.28, 0.3, 0.16, 0.03, K.mat(0xf2f2f0, 0.4), [TX + 0.15, 1.2, -6.6]); // hand dryer
      b.cyl(0.13, 0.11, 0.35, K.mat(0xe8c0cc, 0.5), [TX + 0.25, 0.18, -7.3], null, 14); // pedal bin
      b.label(
        0.5,
        0.5,
        strapMat('gn_wc', 'WC', 'bold 180px Georgia, serif', PINK, '#ffffff', 256, 256),
        [8.0, 2.55, RZ - Q - 0.02],
        [0, PI, 0]
      );
    }

    /* ---------- Get Nailed back room: towel rack, stacked washer, staff table, autoclave counter ---------- */
    {
      // towel rack on the party wall
      const tz0 = -7.6,
        tz1 = -5.4;
      for (let k = 0; k < 4; k++) b.box(0.45, 0.03, tz1 - tz0, ss, [XM + 0.4, 0.3 + k * 0.5, (tz0 + tz1) / 2], null, 0);
      for (const pz of [tz0, tz1])
        for (const pxo of [0.18, 0.62]) b.cyl(0.012, 0.012, 1.9, ss, [XM + pxo, 0.95, pz], null, 6);
      for (let k = 0; k < 4; k++)
        for (let j = 0; j < 5; j++)
          for (let h = 0; h < 2 + ((j + k) % 3); h++)
            b.box(
              0.36,
              0.07,
              0.36,
              K.mat((j + k) % 3 ? 0xf6f6f2 : 0xf2b8cc, 0.95),
              [XM + 0.4, 0.355 + k * 0.5 + h * 0.07, tz0 + 0.25 + j * 0.42],
              null,
              0
            );
      S(XM + 0.15, XM + 0.65, tz0, tz1, 0, 1.9, true);
      // a towel washer with a dryer stacked on it (domestic size), against the toilet wall
      b.push([TX - 0.07 - 0.32, 0, -4.4], [0, -PI / 2, 0], [0.68, 0.82, 0.78]);
      washerGeo(b, 0xf2f2f0);
      b.pop();
      b.push([TX - 0.07 - 0.32, 0.86, -4.4], [0, -PI / 2, 0], [0.68, 0.82, 0.78]);
      washerGeo(b, 0xf2f2f0);
      b.pop();
      S(TX - 0.07 - 0.64, TX - 0.07, -4.75, -4.05, 0, 1.75, true);
      // staff table with two chairs, kettle, mugs, an overflowing ashtray
      b.box(1.0, 0.04, 0.7, K.mat(0xd8d0c0, 0.6), [4.6, 0.75, -6.1], null, 0.01);
      for (const lx of [-0.45, 0.45])
        for (const lz of [-0.3, 0.3]) b.cyl(0.02, 0.02, 0.74, steel, [4.6 + lx, 0.37, -6.1 + lz], null, 6);
      S(4.1, 5.1, -6.45, -5.75, 0, 0.77, true);
      for (const [cx, cz, ca] of [
        [4.1, -5.5, 0.4],
        [5.15, -6.8, PI + 0.3]
      ]) {
        b.push([cx, 0, cz], [0, ca, 0]);
        b.box(0.42, 0.04, 0.42, K.mat(0x5a5a5a, 0.6), [0, 0.45, 0], null, 0.01);
        b.box(0.42, 0.4, 0.04, K.mat(0x5a5a5a, 0.6), [0, 0.68, -0.2], null, 0.01);
        for (const lx of [-0.18, 0.18])
          for (const lz of [-0.18, 0.18]) b.cyl(0.012, 0.012, 0.45, steel, [lx, 0.22, lz], null, 6);
        b.pop();
      }
      b.cyl(0.08, 0.09, 0.2, K.mat(0xe8e8e8, 0.3, 0.3), [4.35, 0.87, -6.2], null, 12);
      for (const [mx, mz] of [
        [4.8, -5.95],
        [4.95, -6.25]
      ])
        b.cyl(0.04, 0.035, 0.09, K.mat(0xe8488a, 0.4), [mx, 0.815, mz], null, 10);
      b.cyl(0.07, 0.06, 0.03, K.glass(0xc8c8c8, 0.6), [4.55, 0.785, -5.9], null, 12);
      // counter with the autoclave and a UV steriliser cabinet
      b.box(1.8, 0.9, 0.6, skirtW, [5.4, 0.45, Z0 + 0.45], null, 0.02);
      b.box(1.84, 0.04, 0.64, K.mat(0x8a8a8a, 0.4), [5.4, 0.92, Z0 + 0.45], null, 0.01);
      rb(0.45, 0.32, 0.42, 0.04, K.mat(0xd8dadc, 0.35, 0.6), [4.95, 1.1, Z0 + 0.45]);
      b.cyl(0.1, 0.1, 0.02, dark, [4.95, 1.1, Z0 + 0.67], [PI / 2, 0, 0], 16);
      rb(0.4, 0.4, 0.32, 0.03, K.mat(0xf4f4f4, 0.35), [5.7, 1.14, Z0 + 0.45]);
      b.box(
        0.3,
        0.26,
        0.01,
        K.mat(0x6a3aff, 0.3, 0, {emissive: 0x7a4aff, emissiveIntensity: 0.6}),
        [5.7, 1.14, Z0 + 0.615],
        null,
        0
      );
      S(4.5, 6.3, Z0 + 0.15, Z0 + 0.75, 0, 0.94, true);
      b.label(
        0.8,
        0.5,
        K.paint('gn_rota', 256, 160, (c, W, H) => {
          c.fillStyle = '#fbfbf6';
          c.fillRect(0, 0, W, H);
          P.text(c, 'STAFF ROTA', W / 2, 22, {size: 22, col: PINK, font: SANS, weight: 'bold'});
          ['MON  KIM / VY', 'TUE  LILY / ANH', 'WED  KIM / ANH', 'THU  CLOSED (ZOMBIES)'].forEach((s, i) =>
            P.text(c, s, 14, 56 + i * 26, {size: 16, col: '#2a2a2a', font: SANS, align: 'left'})
          );
        }),
        [XM + 0.17, 1.6, -4.4],
        [0, PI / 2, 0]
      );
    }

    /* ---------- sidewalk: street lights, meter, hydrant, no parking ---------- */
    LK.lightPole(b, S, -5.0);
    LK.lightPole(b, S, 5.0);
    LK.hydrant(b, S, -8.6);
    LK.meter(b, S, -0.9);
    LK.noParking(b, 3.4, {key: 'fl_np1'});

    /* ---------- dingy back yard: bin bags, lint sacks, a dumped washer, puddles, pallets, wheelie bins, a smoke spot ---------- */
    {
      const bag = K.mat(0x141416, 0.25),
        lint = K.mat(0xc8c8c4, 0.95),
        weed = K.mat(0x4a6a2a, 0.9),
        wet = K.mat(0x1a1c1e, 0.05, 0.3);
      for (const [x, z, n] of [
        [-8.7, -9.2, 4],
        [-4.4, -8.9, 3],
        [8.5, -10.6, 3]
      ])
        for (let k = 0; k < n; k++)
          b.add(K.sphGeo(0.3, 8, 6), bag, {
            p: [x + Math.cos(k * 2.1) * 0.35, 0.22 + (k > 2 ? 0.25 : 0), z + Math.sin(k * 2.1) * 0.3],
            s: [1, 0.8, 0.9],
            r: [0, k, 0.2]
          });
      // white lint sacks by the laundromat back door
      for (let k = 0; k < 3; k++)
        b.add(K.sphGeo(0.32, 8, 6), K.mat(0xe8e8e2, 0.9), {
          p: [-1.4 + k * 0.45, 0.28, Z0 - 0.75],
          s: [0.9, 0.9, 0.8],
          r: [0, k * 0.7, 0]
        });
      b.add(K.sphGeo(0.3, 8, 6), lint, {p: [-0.95, 0.12, Z0 - 1.3], s: [1.2, 0.4, 1]});
      S(-1.8, -0.4, Z0 - 1.1, Z0 - 0.4, 0, 0.6, true);
      // a dead washer dumped on its back
      b.push([-7.4, 0.42, -13.4], [-PI / 2, 0.4, 0]);
      washerGeo(b, 0x8a8e8a);
      b.pop();
      S(-8.0, -6.8, -14.1, -12.7, 0, 0.9, true);
      // puddles and oil stains
      // v091: the puddles are real water now (MFZWATER, added per placement: see YARD_PUDDLES); without that layer, the old flat discs
      if (!window.MFZWATER)
        for (const [x, z, r] of YARD_PUDDLES)
          b.add(K.cylGeo(r, r, 0.004, 16), wet, {p: [x, 0.03, z], s: [1.4, 1, 0.8]});
      for (const [x, z, r] of [
        [1.8, -10.4, 0.6],
        [-5.0, -12.0, 0.5]
      ])
        b.add(K.cylGeo(r, r, 0.004, 14), K.mat(0x2a2620, 0.6), {p: [x, 0.028, z], s: [1.2, 1, 0.9]});
      // pallets against the right fence, a mattress leaning on it
      for (let k = 0; k < 3; k++) {
        b.box(1.2, 0.03, 1.0, K.mat(0x9a7a52, 0.85), [8.9, 0.13 + k * 0.15, -12.6], null, 0);
        for (const sz of [-0.42, 0, 0.42])
          b.box(1.2, 0.1, 0.1, K.mat(0x8a6a44, 0.85), [8.9, 0.06 + k * 0.15, -12.6 + sz], null, 0);
      }
      S(8.3, 9.5, -13.1, -12.1, 0, 0.45, true);
      b.box(0.2, 1.8, 1.3, K.mat(0xc8c0a8, 0.95), [9.55, 0.88, -15.0], [0, 0, 0.18], 0.06);
      b.add(K.cylGeo(0.25, 0.25, 0.01, 12), K.mat(0x8a6a3a, 0.9), {
        p: [9.4, 1.1, -14.8],
        r: [0, 0, PI / 2 + 0.18],
        s: [1, 1, 1.4]
      });
      S(9.3, 9.8, -15.65, -14.35, 0, 1.8, true);
      // two wheelie bins by the salon door, one lid up
      for (const [wx, open] of [
        [6.0, false],
        [6.75, true]
      ]) {
        rb(0.6, 1.0, 0.7, 0.03, K.mat(0x2a3a2a, 0.6), [wx, 0.52, Z0 - 0.9]);
        b.box(
          0.62,
          0.04,
          0.74,
          K.mat(0x222a22, 0.6),
          open ? [wx, 1.3, Z0 - 0.55] : [wx, 1.04, Z0 - 0.9],
          open ? [-1.3, 0, 0] : null,
          0.01
        );
        for (const sx of [-0.25, 0.25]) b.cyl(0.08, 0.08, 0.05, dark, [wx + sx, 0.08, Z0 - 1.25], [0, 0, PI / 2], 10);
      }
      S(5.68, 7.07, Z0 - 1.27, Z0 - 0.53, 0, 1.05, true);
      // the staff smoke spot: an upturned milk crate, a tipped plastic chair, butts in a tin
      b.box(0.36, 0.3, 0.36, K.mat(0x2a6ac8, 0.6), [4.6, 0.15, Z0 - 1.6], [0, 0.3, 0], 0.01);
      b.push([3.9, 0, Z0 - 2.2], [0.2, 0.9, PI / 2 - 0.15]);
      b.box(0.44, 0.04, 0.42, K.mat(0xf0f0ec, 0.5), [0, 0.45, 0], null, 0.01);
      b.box(0.44, 0.38, 0.04, K.mat(0xf0f0ec, 0.5), [0, 0.68, -0.2], null, 0.01);
      for (const lx of [-0.19, 0.19])
        for (const lz of [-0.18, 0.18]) b.cyl(0.015, 0.015, 0.45, K.mat(0xf0f0ec, 0.5), [lx, 0.22, lz], null, 6);
      b.pop();
      b.cyl(0.06, 0.06, 0.08, K.mat(0x8a8a88, 0.4, 0.6), [4.65, 0.34, Z0 - 1.6], null, 10);
      for (let k = 0; k < 9; k++)
        b.cyl(
          0.006,
          0.006,
          0.03,
          K.mat(0xe8d8b8, 0.8),
          [4.2 + Math.cos(k * 1.7) * 0.4, 0.035, Z0 - 1.4 + Math.sin(k * 1.9) * 0.35],
          [PI / 2, k, 0],
          4
        );
      // a rusty shopping cart tipped over in the alley side of the yard
      b.push([1.6, 0, -14.6], [0, 0.6, 1.35]);
      const rust = K.mat(0x7a5a3a, 0.8, 0.4);
      b.frame(0.55, 0.5, 0.02, rust, [0, 0.75, 0.42], 0.02);
      b.frame(0.55, 0.5, 0.02, rust, [0, 0.75, -0.42], 0.02);
      for (const sx of [-0.27, 0.27]) b.box(0.02, 0.5, 0.84, rust, [sx, 0.75, 0], null, 0);
      b.box(0.55, 0.02, 0.84, rust, [0, 0.5, 0], null, 0);
      b.pop();
      // weeds along the fence bases and the back wall
      for (let k = 0; k < 22; k++) {
        const fx = k < 8 ? -9.75 : k < 16 ? 9.75 : -8 + (k - 16) * 2.7,
          fz = k < 16 ? -8.6 - ((k * 1.13) % 8) * 1.1 : Z0 - 0.3;
        b.add(K.sphGeo(0.12, 6, 4), weed, {p: [fx, 0.08, fz], s: [1.3, 0.8 + (k % 3) * 0.3, 1]});
      }
    }

    /* ---------- interior dressing: lost socks, spilled soap, a wet floor sign; spilled polish and cotton balls ---------- */
    {
      const blood = K.mat(0x5a0a0a, 0.25);
      for (const [x, z, col] of [
        [-6.8, 2.2, 0xf4f4f0],
        [-7.1, 3.3, 0xd84a4a],
        [-3.0, 5.8, 0x2a2a2a],
        [-5.9, -2.6, 0x5a8ad0]
      ])
        b.box(0.08, 0.02, 0.24, K.mat(col, 0.9), [x, 0.055, z], [0, x * 1.3, 0], 0.005);
      b.add(K.cylGeo(0.45, 0.45, 0.004, 16), K.mat(0x4a8ae8, 0.1), {p: [-7.5, 0.05, 0.6], s: [1, 1, 1.6]}); // spilled soap
      for (const sd of [-1, 1])
        b.box(0.3, 0.6, 0.01, K.mat(0xf2c418, 0.5), [-7.2, 0.3, 1.9 + sd * 0.09], [sd * 0.3, 0, 0], 0);
      for (const [x, z, r] of [
        [-4.0, 6.4, 0.3],
        [-2.2, 4.8, 0.2],
        [-3.4, -3.8, 0.35]
      ])
        b.add(K.cylGeo(r, r, 0.004, 14), blood, {p: [x, 0.05, z], s: [1.4, 1, 0.8]});
      // a LOST SOCKS box by the island
      b.box(0.5, 0.35, 0.4, K.mat(0xb08a5a, 0.85), [-3.9, 0.21, 3.6], [0, 0.2, 0], 0.01);
      b.label(
        0.42,
        0.12,
        strapMat('fl_socks', 'LOST SOCKS', 'bold 44px ' + SANS, '#b08a5a', INK, 384, 112),
        [-3.86, 0.28, 3.81],
        [0, 0.2, 0]
      );
      for (let k = 0; k < 4; k++)
        b.box(
          0.07,
          0.04,
          0.22,
          K.mat([0xf4f4f0, 0xd84a4a, 0x2a2a2a, 0x3ab06a][k], 0.9),
          [-3.95 + k * 0.08, 0.4, 3.6],
          [0, k * 0.5, 0.3],
          0.005
        );
      // salon: a spilled bottle of pink polish, cotton balls, a tipped stool
      b.add(K.cylGeo(0.22, 0.22, 0.004, 14), K.mat(0xe8488a, 0.05), {p: [5.2, 0.05, 2.8], s: [1.5, 1, 0.9]});
      b.cyl(0.02, 0.024, 0.07, K.mat(0xe8488a, 0.2), [5.35, 0.07, 2.75], [0, 0, PI / 2], 8);
      for (let k = 0; k < 7; k++)
        b.sph(
          0.025,
          K.mat(0xfafafa, 0.95),
          [5.8 + Math.cos(k * 1.4) * 0.4, 0.06, 0.9 + Math.sin(k * 2.2) * 0.4],
          null,
          5
        );
      b.push([3.1, 0, 0.6], [PI / 2, 0, 0.6]);
      b.cyl(0.18, 0.18, 0.08, K.mat(0x2a2a2a, 0.5), [0, 0.55, 0], null, 14);
      b.cyl(0.025, 0.025, 0.45, K.chrome(), [0, 0.3, 0], null, 8);
      b.pop();
      for (const [x, z, r] of [
        [4.4, 5.6, 0.25],
        [7.0, 1.0, 0.3]
      ])
        b.add(K.cylGeo(r, r, 0.004, 14), blood, {p: [x, 0.05, z], s: [1.4, 1, 0.8]});
    }

    return (CACHE = G.done());
  }

  /* v091: back-yard puddles [x, z, radius], lot coordinates */
  const YARD_PUDDLES = [
    [-0.8, -11.2, 0.9],
    [4.2, -13.4, 0.7],
    [6.6, -9.8, 0.5],
    [-3.6, -15.2, 1.1]
  ];
  function bFinalLoad(x, z, t) {
    const B = mk(x, z, 20, 36, H, 0xc8c2b4, 0x6a7a6a, 0x2a2c30);
    B.dx = 0;
    const PT = {th: 0.14, c: 0xe8e2d4};
    WL(B, 1, Z1, X0, X1, FRONT, H);
    WL(B, 1, Z0, X0, X1, BACK, H);
    WL(B, 0, X0, Z0, Z1, [], H);
    WL(B, 0, X1, Z0, Z1, [], H);
    WL(B, 0, XM, Z0, Z1, [], H, {th: 0.3}); // party wall: two separate businesses
    WL(B, 1, LZ, X0, XM, L_PART, H, PT); // laundromat hall / utility room
    WL(B, 1, RZ, XM, X1, R_PART, H, PT); // salon floor / back room + toilet
    WL(B, 0, TX, Z0, RZ, [], H, PT); // toilet / back room
    LK.attach(B, build());
    if (window.MFZWATER)
      YARD_PUDDLES.forEach(([x, z, r], i) => MFZWATER.puddle(B.g, x, z, r * 2.8, r * 1.6, 0, 11 + i, 0.036)); // v091
    const SP = LK.spawner(B, 'laundromat');
    // the three lootable washers sit in the gaps left in the bank
    for (const i of WASH_LOOT) SP(WASH_X, WASH_Z[i], 'fl_washer', 'laundromat', PI / 2, PLINTH);
    // vending machines out front: two in the laundromat's vending bay, one on the pier between the shops
    SP(-8.4, Z1 + 0.6, 'vending_snack', 'convenience', 0);
    SP(-7.38, Z1 + 0.6, 'vending_blitz', 'convenience', 0);
    SP(XM, Z1 + 0.72, 'vending_zest', 'convenience', 0);
    // laundromat utility room: a wall shelf and the attendant's desk on the party wall
    SP(XM - 0.4, -7.2, 'shop_shelf_wall', 'tfl_back', -PI / 2);
    SP(XM - 0.55, -5.4, 'desk_steel', 'tfl_back', -PI / 2);
    // salon: the till on the reception desk, supplies in the back room, the toilet cabinet
    SP(2.1, 4.9, 'cash_register', 'gnd_front', PI, 1.06);
    SP(TX - 0.07 - 0.25, -6.4, 'shop_shelf_wall', 'gnd_stock', -PI / 2);
    SP(2.2, -7.5, 'cardboard_box_medium', 'gnd_stock', 0.2);
    SP(TX + 0.07 + 0.18, -5.0, 'medicine_cabinet', 'gnd_wc', PI / 2);
    // yard: one dumpster for both
    SP(-6.5, Z0 - 3.4, 'dumpster_green', 'storage', PI);
    return LK.finish(B, t, {
      at: [(X0 + X1) / 2, (Z0 + Z1) / 2],
      w: X1 - X0,
      d: Z1 - Z0,
      loot: ['tfl_back', [-7.6, -6.6, -6.8, -6.1], 1],
      zombies: [
        [-6.5, 4.0],
        [-3.0, 1.0],
        [-1.5, 5.5],
        [-5.0, -6.0],
        [3.5, 5.5],
        [5.0, 1.5],
        [3.2, -1.0],
        [4.0, -6.0],
        [-4.0, -12.5],
        [5.0, -14.0]
      ]
    });
  }

  const e = LK.register({
    id: 'laundromat',
    name: 'The Final Load & Get Nailed',
    build: bFinalLoad,
    note: 'half plot split into two businesses: The Final Load laundromat (washer bank, stacked dryers, folding island, waiting chairs, utility room) and Get Nailed nail salon (polish wall, manicure stations, pedicure thrones, customer toilet, back room); vending machines and benches out front; dingy back yard',
    globals: {bFinalLoad, FINALLOAD: {build}}
  });
  if (e) e.loot = 'laundromat';
  console.log('[finalload] The Final Load & Get Nailed ready');
})();
