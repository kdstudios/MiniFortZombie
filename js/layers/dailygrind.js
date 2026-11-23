/* ==========================================================================================================
   MINI FORT ZOMBIE - DAILY GRIND / GET BAKED (v089): one half plot (20 x 36 m, front = +Z) holding TWO separate businesses, our own design.
   Replaces the Cuppa Joe placeholder (core NEWCAT id cuppa_joe, half pool).
   One 18 x 15 m brick block split down the middle by a solid party wall (x = 0); each shop has its own front door, back door and fascia.
   LEFT - DAILY GRIND (coffee cafe): sage-green painted timber shopfront, gold-lettered fascia, climbing flowers over it, wall lanterns,
   festoon lights; a fenced pavement patio with bistro tables, parasols, planters, a window ledge with stools and a chalk A-board.
   Inside: green terrazzo floor, open industrial ceiling (ducts, track lights, green pendants), a green banquette with tables and teal
   leather chairs, a long high table with stools, a window ledge, a retail shelf of bean tins; the coffee bar by the till (espresso machine,
   grinders, pastry case) with a back bar and menu boards; the only other room is the customer toilet.
   RIGHT - GET BAKED (bakery): charcoal shopfront under a navy lightbox fascia (white lettering, gold bun logo), blue café barriers round
   two outside tables, a bench and an A-board. Inside: a small front shop (stone tile floor, white panelled walls, navy subway tile, menu
   screens) with the glass bakery counter, bread racks and the till, a little waiting area with a drinks cooler; through the back, the
   kitchen (deck ovens, rack oven, mixer, prover, prep tables, sinks, fridges, flour sacks, speed racks) and a staff toilet. Behind: the
   delivery yard with the GET BAKED van, the cafe's bins, and board fences.
   Structure from core WL (doors / windows work); detail is our own geometry and painted artwork, outside the static merge.
   ========================================================================================================== */
(function () {
  'use strict';
  const K = window.MFZK,
    LK = window.LOTKIT;
  if (!K || !LK || typeof WL !== 'function' || typeof NEWCAT === 'undefined') {
    console.warn('[dailygrind] core / prop kit missing');
    return;
  }
  const T = THREE,
    P = K.P,
    PI = Math.PI;
  // the block (half plot: x -10..10), the party wall, heights
  const X0 = -9,
    X1 = 9,
    XM = 0, // party wall: Daily Grind to the left (-x), Get Baked to the right (+x)
    Z0 = -7,
    Z1 = 8,
    H = 4.4,
    CEIL = 3.3, // Get Baked's drop ceiling (Daily Grind is open to the roof deck)
    FAS = 3.05; // underside of the fascias
  // Daily Grind: toilet room in the back-right corner, the coffee bar in front of the back bar
  const TX = -3.4, // toilet room x .. XM
    TZ = -3.2; // toilet room Z0 .. TZ
  // Get Baked: shop / kitchen partition, staff toilet in the back-left corner of the kitchen
  const PZ = 3.0,
    WX1 = 2.6, // staff toilet XM .. WX1
    WZ1 = -4.2; // staff toilet Z0 .. WZ1
  const FRONT_DG = [
    {k: 'w', c: -7.5},
    {k: 'w', c: -5.9},
    {k: 'w', c: -4.3},
    {k: 'd', c: -2.5},
    {k: 'w', c: -0.95}
  ];
  const FRONT_GB = [
    {k: 'w', c: 1.0},
    {k: 'w', c: 2.6},
    {k: 'd', c: 4.4},
    {k: 'w', c: 6.2},
    {k: 'w', c: 7.8}
  ];
  const LEFT = [
    {k: 'w', c: 2.4},
    {k: 'w', c: 5.4}
  ];
  const RIGHT = [
    {k: 'w', c: -4.2},
    {k: 'w', c: 6.0}
  ];
  const BACK_DG = [{k: 'd', c: -4.15, s: -1}]; // v089: was -4.0, which put the toilet partition (x -3.4) in the doorway
  const BACK_GB = [{k: 'd', c: 6.4, s: -1}];
  const WC_DG_F = [{k: 'd', c: -1.7}]; // toilet front wall (z = TZ)
  const PART_GB = [{k: 'd', c: 7.7}]; // shop / kitchen
  const WC_GB_S = [{k: 'd', c: -5.6}]; // staff toilet side wall (x = WX1)

  /* ===================== loot tables ===================== */
  try {
    Object.assign(LOOT_TABLES, {
      // behind the coffee bar: beans, sugar, milk, biscuits
      dg_bar: {
        stugots_coffee: 6,
        sugar: 4,
        milk: 3,
        cookies: 3,
        crackers: 2,
        granola: 1,
        popzi_soft_drink: 1,
        water_jug: 1
      },
      // customer toilet: the first-aid box and odds
      dg_wc: {painkiller: 2, gauze: 2, cotton_balls: 2, medical_tape: 1, hairspray: 1},
      // the bakery kitchen: baking stores, a knife
      gb_kitchen: {
        sugar: 6,
        cookies: 4,
        crackers: 3,
        cereo: 2,
        eat_flakes: 2,
        milk: 2,
        cherry_preserves: 1,
        peach_preserves: 1,
        calzones: 2,
        butcher_knife: 1,
        water_jug: 1
      },
      // staff toilet and lockers
      gb_staff: {painkiller: 2, gauze: 1, cotton_balls: 1, tweex: 2, z_energy_drink: 1, colacola: 1, cookies: 1}
    });
    for (const tn of ['dg_bar', 'dg_wc', 'gb_kitchen', 'gb_staff'])
      for (const id in LOOT_TABLES[tn])
        if (!ITEMS[id]) {
          console.error('[dailygrind] loot table ' + tn + ' has unknown item ' + id);
          delete LOOT_TABLES[tn][id];
        }
    if (typeof LOOT_PROP !== 'undefined')
      Object.assign(LOOT_PROP, {dg_bar: 'cabinet', dg_wc: 'cabinet', gb_kitchen: 'cabinet', gb_staff: 'cabinet'});
    const A = window.MFZPROP && MFZPROP.auto;
    if (A) {
      const pick = (...ts) => [...new Set(ts.flatMap(t => A[t] || []))];
      A.dg_bar = pick('coffee', 'house');
      A.dg_wc = pick('house', 'clinic');
      A.gb_kitchen = pick('bakery', 'coffee', 'house');
      A.gb_staff = pick('house', 'office');
    }
  } catch (e) {
    console.warn('[dailygrind] loot tables', e);
  }

  /* ===================== artwork ===================== */
  const SAGE = '#5f6b4e',
    GOLD = '#e2c27a',
    NAVY = '#123a7a',
    BUN = '#f2b82a',
    CREAM = '#f4efe2';
  // a steaming cup: the Daily Grind mark
  function drawCup(c, x, y, s, col) {
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    c.strokeStyle = col;
    c.fillStyle = col;
    c.lineWidth = 6;
    c.beginPath();
    c.moveTo(-30, -10);
    c.lineTo(30, -10);
    c.lineTo(24, 30);
    c.quadraticCurveTo(0, 38, -24, 30);
    c.closePath();
    c.fill();
    c.beginPath();
    c.arc(34, 6, 11, -PI / 2, PI / 2);
    c.stroke();
    c.fillRect(-40, 36, 80, 6);
    for (const sx of [-12, 0, 12]) {
      c.beginPath();
      c.moveTo(sx, -18);
      c.bezierCurveTo(sx - 8, -28, sx + 8, -34, sx, -46);
      c.stroke();
    }
    c.restore();
  }
  // a plump bun with a scored top, in a gold square: the Get Baked mark
  function drawBun(c, x, y, s) {
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    c.fillStyle = BUN;
    c.fillRect(-50, -50, 100, 100);
    c.fillStyle = '#7a3e12';
    c.beginPath();
    c.ellipse(0, 8, 38, 26, 0, PI, 0);
    c.lineTo(38, 18);
    c.quadraticCurveTo(0, 28, -38, 18);
    c.closePath();
    c.fill();
    c.strokeStyle = BUN;
    c.lineWidth = 5;
    for (const sx of [-16, 0, 16]) {
      c.beginPath();
      c.moveTo(sx - 6, -8);
      c.lineTo(sx + 6, 4);
      c.stroke();
    }
    c.restore();
  }
  const dgFascia = () =>
    K.paint('dg_fascia', 1024, 128, (c, W, H) => {
      c.fillStyle = SAGE;
      c.fillRect(0, 0, W, H);
      c.strokeStyle = '#48523a';
      c.lineWidth = 6;
      c.strokeRect(8, 8, W - 16, H - 16);
      c.fillStyle = GOLD;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.font = 'bold 76px Georgia, "Times New Roman", serif';
      c.fillText('Daily Grind', W / 2 + 30, H / 2 + 4);
      drawCup(c, 150, 70, 0.9, GOLD);
      drawCup(c, W - 120, 70, 0.9, GOLD);
    });
  const gbFascia = () =>
    K.paint(
      'gb_fascia',
      1024,
      160,
      (c, W, H) => {
        c.fillStyle = NAVY;
        c.fillRect(0, 0, W, H);
        drawBun(c, 190, H / 2, 1.05);
        c.fillStyle = '#ffffff';
        c.textBaseline = 'middle';
        c.font = 'bold 104px Arial, Helvetica, sans-serif';
        c.fillText('GET BAKED', 280, H / 2 + 6);
      },
      {glow: 0.45}
    );
  // oval hanging sign on a bracket (both faces)
  const ovalSign = () =>
    K.paint(
      'dg_oval',
      256,
      320,
      (c, W, H) => {
        c.clearRect(0, 0, W, H);
        c.fillStyle = '#26281f';
        c.beginPath();
        c.ellipse(W / 2, H / 2, W / 2 - 6, H / 2 - 6, 0, 0, PI * 2);
        c.fill();
        c.strokeStyle = GOLD;
        c.lineWidth = 6;
        c.stroke();
        c.fillStyle = CREAM;
        c.textAlign = 'center';
        c.font = 'italic 34px Georgia, serif';
        c.fillText('Daily', W / 2, 92);
        c.fillText('Grind', W / 2, 130);
        drawCup(c, W / 2, 200, 0.75, GOLD);
        c.font = '22px Georgia, serif';
        c.fillText('EST. 1951', W / 2, 270);
      },
      {alpha: true}
    );
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
  // chalkboard with lines of text: [text, font, colour]
  const chalk = (key, lines, w, h) =>
    K.paint(key, w || 256, h || 384, (c, W, H, r) => {
      c.fillStyle = '#1f2421';
      c.fillRect(0, 0, W, H);
      P.noise(c, W, H, r, 1500, 0.08, '#ffffff', 1);
      c.textAlign = 'center';
      let y = 0;
      for (const [t, f, col, dy] of lines) {
        y += dy || 46;
        c.font = f;
        c.fillStyle = col || '#f2efe4';
        c.fillText(t, W / 2, y);
      }
    });
  const banner = () =>
    K.paint('gb_banner', 512, 128, (c, W, H) => {
      c.fillStyle = '#1e5ab8';
      c.fillRect(0, 0, W, H);
      drawBun(c, 120, H / 2, 0.55);
      c.fillStyle = '#ffffff';
      c.font = 'bold 60px Arial, Helvetica, sans-serif';
      c.textBaseline = 'middle';
      c.fillText('GET BAKED', 170, H / 2 + 4);
    });

  /* ===================== surfaces ===================== */
  const SURF = {};
  const surf = k =>
    SURF[k] ||
    (SURF[k] = {
      asphalt: () => K.surf('asphalt', 0x3a3c40),
      concrete: () => K.surf('concrete', 0xb4b0a6),
      fence: () => K.surf('wood', 0x6a5444),
      // old red-brown brick, stretcher bond, pale mortar
      brick: () =>
        K.tri(
          'dg_brick',
          (c, W, H, r) => {
            c.fillStyle = '#9a8e80';
            c.fillRect(0, 0, W, H);
            const rows = 16,
              bh = H / rows,
              bw = W / 4;
            for (let j = 0; j < rows; j++)
              for (let i = -1; i < 5; i++) {
                const x = i * bw + (j % 2 ? bw / 2 : 0);
                c.fillStyle = `hsl(${8 + r() * 14},${38 + r() * 18}%,${30 + r() * 14}%)`;
                c.fillRect(x + 2, j * bh + 2, bw - 4, bh - 4);
              }
            P.noise(c, W, H, r, 6000, 0.15, '#2a1a10', 1.3);
            P.grime(c, W, H, r, 0.35);
          },
          {tile: 1.2, r: 0.9}
        ),
      // sage painted timber shopfront: vertical boards
      sage: () =>
        K.tri(
          'dg_sage',
          (c, W, H, r) => {
            c.fillStyle = '#6b7858';
            c.fillRect(0, 0, W, H);
            for (let i = 0; i < 6; i++) {
              c.fillStyle = '#56624a';
              c.fillRect((i * W) / 6, 0, 4, H);
            }
            P.noise(c, W, H, r, 2500, 0.06, '#1a2010', 1);
          },
          {tile: 0.9, r: 0.7}
        ),
      // charcoal shopfront panels
      char: () =>
        K.tri(
          'gb_char',
          (c, W, H, r) => {
            c.fillStyle = '#3a3f46';
            c.fillRect(0, 0, W, H);
            c.fillStyle = '#2c3036';
            c.fillRect(0, H / 2 - 2, W, 4);
            c.fillRect(W / 2 - 2, 0, 4, H);
            P.noise(c, W, H, r, 1500, 0.05, '#000000', 1);
          },
          {tile: 1.2, r: 0.5, m: 0.3}
        ),
      // patio paving: grey and buff square slabs
      pavers: () =>
        K.tri(
          'dg_pavers',
          (c, W, H, r) => {
            c.fillStyle = '#8a8478';
            c.fillRect(0, 0, W, H);
            const n = 4,
              s = W / n;
            for (let j = 0; j < n; j++)
              for (let i = 0; i < n; i++) {
                c.fillStyle = (i + j) % 3 ? '#b8b0a0' : '#a89c88';
                c.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
              }
            P.noise(c, W, H, r, 3000, 0.1, '#3a3428', 1);
          },
          {tile: 1.2, r: 0.85}
        ),
      coping: () => K.mat(0xc8c2b4, 0.7),
      alu: () => K.mat(0x22252a, 0.4, 0.6)
    }[k]());

  /* ===================== geometry ===================== */
  let CACHE = null;
  function build() {
    if (CACHE) return CACHE;
    const G = LK.geo('dailygrind'),
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
    const brk = surf('brick'),
      sage = surf('sage'),
      chr = surf('char'),
      cop = surf('coping'),
      alu = surf('alu'),
      dark = K.mat(0x1c1c1e, 0.5),
      black = K.mat(0x141416, 0.45, 0.4),
      steel = K.mat(0x9a9ea2, 0.4, 0.7),
      sageM = K.mat(0x5f6b4e, 0.6),
      gold = K.mat(0xc8a050, 0.3, 0.8),
      wood = K.surf('wood', 0x6a4a2a),
      teak = K.veneer(0x7a5232),
      navy = K.mat(0x123a7a, 0.5),
      blue = K.mat(0x1e5ab8, 0.6),
      leaf = K.mat(0x3e6a2e, 0.85),
      leaf2 = K.mat(0x557f38, 0.85),
      soil = K.mat(0x3a2a1c, 0.95),
      warm = K.mat(0xfff2c8, 0.4, 0, {emissive: 0xffd890, emissiveIntensity: 1.3}),
      lit = K.mat(0xffffff, 0.4, 0, {emissive: 0xf6f8ff, emissiveIntensity: 0.95});
    const rb = (w, h, d, r, m, p, rot) => b.rbox(w, h, d, r, m, p, rot, 1);

    /* ---------- exterior skin: brick all round, painted shopfronts to fascia height on the front ---------- */
    const skin = (ax, f, a0, a1, n, ops, low) => {
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
        if (low) {
          put(y0, Math.min(y1, FAS), low);
          put(Math.max(y0, FAS), y1, brk);
        } else put(y0, y1, brk);
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
    skin(1, Z1, X0 - 0.15, XM, 1, FRONT_DG, sage);
    skin(1, Z1, XM, X1 + 0.15, 1, FRONT_GB, chr);
    skin(0, X0, Z0, Z1, -1, LEFT);
    skin(0, X1, Z0, Z1, 1, RIGHT);
    skin(1, Z0, X0 - 0.15, X1 + 0.15, -1, BACK_DG.concat(BACK_GB));
    // a brick pier where the two shopfronts meet
    b.box(0.5, FAS, 0.12, brk, [XM, FAS / 2, Z1 + 0.22], null, 0.01);
    // window frames: chunky sage timber with glazing bars on the cafe, slim black aluminium on the bakery
    for (const w of FRONT_DG.filter(p => p.k === 'w')) {
      b.box(1.66, 0.09, 0.2, sageM, [w.c, 0.9, Z1 + 0.24], null, 0.01);
      b.frame(1.56, 1.9, 0.09, sageM, [w.c, 1.825, Z1 + 0.19], 0.07);
      b.box(1.4, 0.04, 0.04, sageM, [w.c, 2.35, Z1 + 0.2], null, 0);
      b.box(0.04, 0.5, 0.04, sageM, [w.c, 2.55, Z1 + 0.2], null, 0);
    }
    for (const w of FRONT_GB.filter(p => p.k === 'w')) {
      b.box(1.62, 0.06, 0.14, alu, [w.c, 0.9, Z1 + 0.22], null, 0.01);
      b.frame(1.56, 1.9, 0.06, alu, [w.c, 1.825, Z1 + 0.19], 0.05);
    }
    for (const [ws, fx, nx] of [
      [LEFT, X0, -1],
      [RIGHT, X1, 1]
    ])
      for (const w of ws) {
        b.box(0.16, 0.07, 1.62, cop, [fx + nx * 0.22, 0.9, w.c], null, 0.01);
        b.push([fx + nx * 0.19, 1.825, w.c], [0, PI / 2, 0]);
        b.frame(1.56, 1.9, 0.07, fx < 0 ? sageM : alu, [0, 0, 0], 0.06);
        b.pop();
      }
    // door surrounds
    b.frame(1.42, 2.5, 0.1, sageM, [-2.5, 1.25, Z1 + 0.19], 0.08);
    b.frame(1.38, 2.46, 0.06, alu, [4.4, 1.23, Z1 + 0.19], 0.05);

    /* ---------- fascias: the gold-lettered Daily Grind board, the Get Baked navy lightbox ---------- */
    const dgW = XM - X0 - 0.3,
      dgC = (X0 + XM) / 2;
    rb(dgW + 0.1, 0.7, 0.24, 0.02, sageM, [dgC, FAS + 0.35, Z1 + 0.27]);
    b.label(dgW - 0.2, 0.56, dgFascia(), [dgC, FAS + 0.35, Z1 + 0.395]);
    b.box(dgW + 0.3, 0.1, 0.4, sageM, [dgC, FAS + 0.75, Z1 + 0.3], null, 0.01); // cornice
    b.box(dgW + 0.1, 0.08, 0.3, sageM, [dgC, FAS - 0.04, Z1 + 0.27], null, 0.01);
    const gbW = X1 - XM - 0.3,
      gbC = (XM + X1) / 2;
    rb(gbW + 0.1, 0.82, 0.3, 0.02, navy, [gbC, FAS + 0.41, Z1 + 0.3]);
    b.label(gbW - 0.3, 0.68, gbFascia(), [gbC, FAS + 0.41, Z1 + 0.455]);
    // projecting blade box at the bakery corner (both faces)
    b.push([X1 - 0.1, FAS + 0.5, Z1 + 0.75], [0, PI / 2, 0]);
    rb(0.8, 0.8, 0.14, 0.02, navy, [0, 0, 0]);
    const bladeM = K.paint(
      'gb_blade',
      128,
      128,
      (c, W) => {
        c.fillStyle = NAVY;
        c.fillRect(0, 0, W, W);
        drawBun(c, W / 2, W / 2, 0.95);
      },
      {glow: 0.4}
    );
    for (const s of [-1, 1]) b.label(0.7, 0.7, bladeM, [0, 0, s * 0.075], [0, s > 0 ? 0 : PI, 0]);
    b.pop();
    b.box(0.06, 0.06, 0.6, steel, [X1 - 0.1, FAS + 0.93, Z1 + 0.5], null, 0);
    // oval hanging sign on a scroll bracket at the cafe's left corner
    b.box(0.05, 0.05, 0.9, black, [X0 + 0.25, 2.95, Z1 + 0.62], null, 0);
    b.tor(0.18, 0.015, black, [X0 + 0.25, 2.78, Z1 + 0.4], [0, PI / 2, 0], PI, 10);
    for (const s of [-1, 1])
      b.label(0.56, 0.7, ovalSign(), [X0 + 0.25 + s * 0.02, 2.5, Z1 + 0.9], [0, (s * PI) / 2, 0]);

    /* ---------- climbing flowers over the cafe fascia, lanterns, festoon lights ---------- */
    {
      const flW = K.mat(0xf6f2ea, 0.8),
        flP = K.mat(0xe89ab8, 0.8);
      for (let i = 0; i < 26; i++) {
        const fx = X0 + 0.2 + i * 0.34 + (b.rnd() - 0.5) * 0.12,
          fy = FAS + 0.95 + b.rnd() * 0.4,
          fz = Z1 + 0.35 + b.rnd() * 0.18;
        b.sph(0.26 + b.rnd() * 0.12, i % 3 ? leaf : leaf2, [fx, fy, fz], [1, 0.75, 0.8], 7);
        for (let k = 0; k < 3; k++)
          b.sph(
            0.045,
            (i + k) % 4 ? flW : flP,
            [fx + (b.rnd() - 0.5) * 0.4, fy + (b.rnd() - 0.3) * 0.3, fz + 0.2],
            null,
            5
          );
      }
      // trailing strands down over the fascia board. v090: only the outer ones hang long; over the lettering they are short
      // drips along the top edge, so DAILY GRIND can be read
      for (let i = 0; i < 9; i++) {
        const fx = X0 + 0.5 + i * 1.0 + b.rnd() * 0.3,
          end = i < 1 || i > 7,
          len = end ? 0.5 + b.rnd() * 0.5 : 0.08 + b.rnd() * 0.1;
        for (let k = 0; k < 4; k++)
          b.sph(
            0.1,
            k % 2 ? leaf2 : leaf,
            [fx + (b.rnd() - 0.5) * 0.1, FAS + (end ? 0.75 : 0.84) - (k * len) / 4, Z1 + 0.43],
            end ? [1, 1.3, 0.6] : [1, 0.9, 0.6],
            6
          );
      }
      // the brick ledge the planting sits on
      b.box(dgW + 0.3, 0.06, 0.6, cop, [dgC, FAS + 0.83, Z1 + 0.35], null, 0.01);
    }
    const lantern = (lx, ly, lz) => {
      b.box(0.04, 0.04, 0.26, black, [lx, ly + 0.36, lz - 0.1], null, 0);
      b.push([lx, ly, lz]);
      b.box(0.24, 0.04, 0.24, black, [0, 0.2, 0], null, 0.01);
      b.cyl(0.0, 0.17, 0.12, black, [0, 0.28, 0], null, 4);
      b.box(0.2, 0.34, 0.2, K.glass(0xfff0c0, 0.45), [0, 0.02, 0], null, 0);
      b.sph(0.05, warm, [0, 0.02, 0], null, 8);
      b.box(0.22, 0.03, 0.22, black, [0, -0.16, 0], null, 0.01);
      b.pop();
    };
    lantern(-3.4, 2.15, Z1 + 0.42);
    lantern(-1.6, 2.15, Z1 + 0.42);
    lantern(X0 + 0.25, 2.15, Z1 + 0.42);
    // festoon bulbs under the fascia, draped in swags
    for (let i = 0; i <= 40; i++) {
      const u = i / 40,
        fx = X0 + 0.1 + u * (XM - X0 - 0.3),
        sw = Math.abs(Math.sin(u * PI * 5)) * 0.16;
      b.sph(0.03, warm, [fx, FAS - 0.12 - sw, Z1 + 0.45], null, 6);
    }
    b.box(XM - X0 - 0.3, 0.008, 0.008, dark, [dgC, FAS - 0.1, Z1 + 0.45], null, 0);

    /* ---------- parapet, flat roof, HVAC, the bakery's oven flues ---------- */
    const par = (ax, f, a0, a1) => {
      const L = a1 - a0,
        u = (a0 + a1) / 2;
      if (ax) {
        b.box(L, 0.8, 0.3, brk, [u, H + 0.4, f], null, 0);
        b.box(L + 0.1, 0.08, 0.42, cop, [u, H + 0.84, f], null, 0.01);
      } else {
        b.box(0.3, 0.8, L, brk, [f, H + 0.4, u], null, 0);
        b.box(0.42, 0.08, L + 0.1, cop, [f, H + 0.84, u], null, 0.01);
      }
    };
    par(1, Z1, X0 - 0.15, X1 + 0.15);
    par(1, Z0, X0 - 0.15, X1 + 0.15);
    par(0, X0, Z0, Z1);
    par(0, X1, Z0, Z1);
    par(0, XM, Z0, Z1); // the party wall rises through the roof
    // stone band and soldier course over the fascias
    b.box(X1 - X0 + 0.3, 0.14, 0.08, cop, [0, H - 0.2, Z1 + 0.19], null, 0.01);
    b.box(X1 - X0, 0.12, Z1 - Z0, K.surf('concrete', 0x5a5a58), [0, H + 0.02, (Z0 + Z1) / 2], null, 0);
    b.box(X1 - X0 - 0.3, 0.02, Z1 - Z0 - 0.3, K.mat(0x3a3c40, 0.9), [0, H + 0.09, (Z0 + Z1) / 2], null, 0);
    for (const [hx, hz] of [
      [-5, -4],
      [4.5, 5]
    ]) {
      rb(1.6, 0.9, 1.2, 0.03, K.mat(0xb0b4b8, 0.4, 0.7), [hx, H + 0.55, hz]);
      b.vents(5, 1.4, 0.6, K.mat(0x6a6c6e, 0.5, 0.6), [hx, H + 0.55, hz + 0.61]);
      b.cyl(0.4, 0.4, 0.08, K.mat(0x2a2a2a, 0.5, 0.4), [hx, H + 1.04, hz], null, 18);
    }
    // two stainless flues from the deck ovens with rain caps
    for (const fz of [-2.1, -0.1]) {
      // v089: moved back with the ovens (they stood in the kitchen doorway)
      b.cyl(0.14, 0.14, 2.2, steel, [8.0, H + 1.1, fz], null, 12);
      b.cyl(0.26, 0.26, 0.04, steel, [8.0, H + 2.3, fz], null, 12);
      b.cyl(0.0, 0.26, 0.14, steel, [8.0, H + 2.4, fz], null, 12);
    }
    // the cafe's extract fan
    b.box(0.7, 0.5, 0.7, K.mat(0x8a8e92, 0.4, 0.6), [-6.5, H + 0.35, 3], null, 0.02);
    b.cyl(0.25, 0.25, 0.06, dark, [-6.5, H + 0.62, 3], null, 14);
    for (const [vx, vz] of [
      [-2, -1],
      [2, 2],
      [6, -5]
    ])
      b.cyl(0.07, 0.07, 0.7, K.mat(0x7a7c7e, 0.4, 0.7), [vx, H + 0.45, vz], null, 10);

    /* ---------- Daily Grind patio: paving, planter boxes, bistro tables, parasols, window ledge + stools, A-board ---------- */
    const PX0 = X0 - 0.6,
      PX1 = XM - 0.5,
      PZ0 = Z1 + 0.9,
      PZ1 = 14.6;
    b.box(PX1 - PX0, 0.03, PZ1 - Z1 - 0.3, surf('pavers'), [(PX0 + PX1) / 2, 0.045, (Z1 + 0.3 + PZ1) / 2], null, 0);
    const planter = (x0, x1, z0, z1) => {
      const w = x1 - x0,
        d = z1 - z0;
      b.box(w, 0.6, d, teak, [(x0 + x1) / 2, 0.3, (z0 + z1) / 2], null, 0.01);
      b.box(w - 0.1, 0.04, d - 0.1, soil, [(x0 + x1) / 2, 0.59, (z0 + z1) / 2], null, 0);
      const n = Math.max(1, Math.round(Math.max(w, d) / 0.45));
      for (let i = 0; i < n; i++) {
        const f = (i + 0.5) / n;
        b.sph(
          0.22,
          i % 2 ? leaf : leaf2,
          [x0 + (w > d ? f * w : w / 2), 0.78, z0 + (w > d ? d / 2 : f * d)],
          [1, 0.8, 1],
          7
        );
      }
      S(x0, x1, z0, z1, 0, 0.62, true);
    };
    planter(PX0, -3.6, PZ1 - 0.45, PZ1); // along the sidewalk, gap at the door path
    planter(-1.5, PX1, PZ1 - 0.45, PZ1);
    planter(PX1 - 0.45, PX1, PZ0 + 1.6, PZ1 - 0.5); // down the bakery side
    // bistro tables with parasols, two chairs each
    const bistroChair = (cx, cz, a) => {
      b.push([cx, 0, cz], [0, a, 0]);
      b.cyl(0.19, 0.19, 0.03, black, [0, 0.46, 0], null, 14);
      for (const [qx, qz] of [
        [-0.13, -0.13],
        [0.13, -0.13],
        [-0.13, 0.13],
        [0.13, 0.13]
      ])
        b.cyl(0.012, 0.012, 0.46, black, [qx, 0.23, qz], null, 5);
      b.tor(0.17, 0.012, black, [0, 0.82, -0.15], null, PI, 10);
      for (let i = 0; i < 4; i++) b.cyl(0.008, 0.008, 0.36, black, [-0.12 + i * 0.08, 0.64, -0.16], null, 4);
      b.pop();
    };
    const bistro = (tx, tz, parasol, col) => {
      b.cyl(0.36, 0.36, 0.03, teak, [tx, 0.74, tz], null, 18);
      b.cyl(0.03, 0.03, 0.72, black, [tx, 0.37, tz], null, 8);
      b.cyl(0.26, 0.28, 0.03, black, [tx, 0.015, tz], null, 14);
      S(tx - 0.38, tx + 0.38, tz - 0.38, tz + 0.38, 0, 0.78, true);
      bistroChair(tx - 0.62, tz, PI / 2);
      bistroChair(tx + 0.62, tz, -PI / 2);
      if (parasol) {
        b.cyl(0.02, 0.02, 1.7, steel, [tx, 1.6, tz], null, 6);
        b.cyl(0.02, 1.25, 0.42, K.mat(col, 0.9), [tx, 2.35, tz], null, 12, true);
        b.cyl(1.25, 1.25, 0.12, K.mat(col, 0.9), [tx, 2.1, tz], null, 12, true);
      }
    };
    bistro(-7.6, 10.4, true, 0xeee6d2);
    bistro(-5.0, 12.6, true, 0x5f6b4e);
    bistro(-7.6, 13.0, false);
    bistro(-1.3, 11.2, true, 0xeee6d2);
    // festoon lights strung on posts over the patio
    const posts = [
      [PX0 + 0.1, PZ1 - 0.6],
      [-4.0, PZ1 - 0.6],
      [PX1 - 0.2, PZ1 - 0.6]
    ];
    for (const [px, pz] of posts) {
      b.cyl(0.04, 0.05, 2.8, black, [px, 1.4, pz], null, 8);
      S(px - 0.06, px + 0.06, pz - 0.06, pz + 0.06, 0, 2.8, true);
    }
    const swag = (ax, az, bx, bz, ya, yb, n) => {
      for (let i = 0; i <= n; i++) {
        const u = i / n;
        b.sph(
          0.035,
          warm,
          [ax + (bx - ax) * u, ya + (yb - ya) * u - Math.sin(u * PI) * 0.35, az + (bz - az) * u],
          null,
          6
        );
      }
    };
    swag(posts[0][0], posts[0][1], posts[1][0], posts[1][1], 2.75, 2.75, 12);
    swag(posts[1][0], posts[1][1], posts[2][0], posts[2][1], 2.75, 2.75, 12);
    swag(posts[0][0], posts[0][1], X0 + 0.3, Z1 + 0.4, 2.75, 3.0, 12);
    swag(posts[2][0], posts[2][1], -0.5, Z1 + 0.4, 2.75, 3.0, 12);
    // a window ledge under the cafe windows with stools (as in the photo)
    b.box(5.0, 0.05, 0.36, teak, [-5.9, 1.0, Z1 + 0.45], null, 0.01);
    for (const sx of [-7.9, -3.9]) b.box(0.04, 0.2, 0.3, black, [sx, 0.88, Z1 + 0.4], null, 0);
    S(-8.4, -3.4, Z1 + 0.27, Z1 + 0.63, 0.95, 1.05, true);
    const stool = (sx, sz, top) => {
      b.cyl(0.17, 0.17, 0.05, top || teak, [sx, 0.72, sz], null, 14);
      for (let k = 0; k < 4; k++) {
        const a = (k * PI) / 2 + PI / 4;
        b.cyl(
          0.015,
          0.02,
          0.72,
          top ? black : teak,
          [sx + Math.cos(a) * 0.11, 0.36, sz + Math.sin(a) * 0.11],
          [Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12],
          5
        );
      }
      b.tor(0.13, 0.01, top ? black : teak, [sx, 0.28, sz], [PI / 2, 0, 0], PI * 2, 12);
      S(sx - 0.18, sx + 0.18, sz - 0.18, sz + 0.18, 0, 0.75, true);
    };
    stool(-7.2, Z1 + 0.95);
    stool(-5.9, Z1 + 0.95);
    stool(-4.6, Z1 + 0.95);
    // chalk A-boards: the cafe's menu by the door path, the bakery's deal of the day
    const aboard = (ax, az, a, m) => {
      b.push([ax, 0, az], [0, a, 0]);
      for (const s of [-1, 1]) {
        b.push([0, 0.55, s * 0.16], [-s * 0.26, 0, 0]); // v090: tops lean in (was a V: upside down)
        b.box(0.62, 1.1, 0.04, wood, [0, 0, 0], null, 0.01);
        b.label(0.52, 0.86, m, [0, 0.04, s * 0.022], [0, s > 0 ? 0 : PI, 0]);
        b.pop();
      }
      b.pop();
      S(ax - 0.35, ax + 0.35, az - 0.35, az + 0.35, 0, 1.1, true);
    };
    aboard(
      -2.6,
      15.2,
      0.15,
      chalk('dg_aboard', [
        ['MENU', 'bold 46px Georgia, serif', '#f2efe4', 60],
        ['Flat White  3.20', '24px Georgia, serif', '#f2efe4', 52],
        ['Cappuccino  3.10', '24px Georgia, serif'],
        ['Mocha  3.40', '24px Georgia, serif'],
        ['Cold Brew  3.50', '24px Georgia, serif'],
        ['still open,', 'italic 26px Georgia, serif', '#f2c84a', 64],
        ['probably', 'italic 26px Georgia, serif', '#f2c84a', 34]
      ])
    );
    aboard(
      5.5,
      15.0,
      -0.2,
      chalk('gb_aboard', [
        ['TODAY', 'bold 44px Arial, sans-serif', '#ffffff', 60],
        ['2 for 1', 'bold 54px Arial, sans-serif', '#f2b82a', 70],
        ['SAUSAGE', 'bold 32px Arial, sans-serif', '#ffffff', 56],
        ['ROLLS', 'bold 32px Arial, sans-serif', '#ffffff', 38],
        ['get baked', 'italic 30px Georgia, serif', '#8ab8f2', 80],
        ['with us!', 'italic 30px Georgia, serif', '#8ab8f2', 36]
      ])
    );

    /* ---------- Get Baked front: blue café barriers round two tables, a bench, a bin ---------- */
    {
      const bx0 = 5.5, // v089: was 4.6, which ran the barrier across the bakery door
        bx1 = 9.3,
        bz0 = Z1 + 1.0,
        bz1 = 12.4;
      const ban = banner();
      const run = (ax, az, bx, bz) => {
        const L = Math.hypot(bx - ax, bz - az),
          n = Math.max(1, Math.round(L / 2.2)),
          a = Math.atan2(-(bz - az), bx - ax);
        for (let i = 0; i <= n; i++) {
          const px = ax + ((bx - ax) * i) / n,
            pz = az + ((bz - az) * i) / n;
          b.cyl(0.03, 0.03, 1.0, K.chrome(), [px, 0.5, pz], null, 10);
          b.cyl(0.04, 0.04, 0.04, K.chrome(), [px, 1.0, pz], null, 10);
          b.cyl(0.18, 0.2, 0.03, K.chrome(), [px, 0.015, pz], null, 14);
        }
        for (let i = 0; i < n; i++) {
          const u = (i + 0.5) / n,
            sl = L / n - 0.1;
          b.push([ax + (bx - ax) * u, 0.62, az + (bz - az) * u], [0, a, 0]);
          b.box(sl, 0.62, 0.02, blue, [0, 0, 0], null, 0);
          for (const s of [-1, 1])
            b.label(Math.min(sl - 0.1, 2.2), 0.55, ban, [0, 0, s * 0.012], [0, s > 0 ? 0 : PI, 0]);
          b.pop();
        }
        S(
          Math.min(ax, bx) - 0.05,
          Math.max(ax, bx) + 0.05,
          Math.min(az, bz) - 0.05,
          Math.max(az, bz) + 0.05,
          0,
          1.0,
          true
        );
      };
      run(bx0, bz1, bx1, bz1);
      run(bx0, bz0, bx0, bz1);
      const t2 = (tx, tz) => {
        b.box(0.7, 0.03, 0.7, K.mat(0xd8d4cc, 0.5), [tx, 0.74, tz], null, 0.01);
        b.cyl(0.03, 0.03, 0.72, steel, [tx, 0.37, tz], null, 8);
        b.box(0.5, 0.02, 0.5, steel, [tx, 0.01, tz], null, 0);
        S(tx - 0.36, tx + 0.36, tz - 0.36, tz + 0.36, 0, 0.78, true);
        for (const s of [-1, 1]) {
          b.push([tx + s * 0.6, 0, tz], [0, (-s * PI) / 2, 0]);
          b.box(0.42, 0.03, 0.42, blue, [0, 0.46, 0], null, 0.01);
          b.box(0.42, 0.4, 0.03, blue, [0, 0.7, -0.2], null, 0.01);
          for (const qx of [-0.18, 0.18])
            for (const qz of [-0.18, 0.18]) b.cyl(0.012, 0.012, 0.46, steel, [qx, 0.23, qz], null, 5);
          b.pop();
        }
      };
      t2(6.5, 10.6);
      t2(8.3, 10.6);
      // bench and bin by the bakery door
      b.push([2.2, 0, Z1 + 0.75]);
      for (let i = 0; i < 4; i++) b.box(1.6, 0.04, 0.09, teak, [0, 0.46, -0.16 + i * 0.11], null, 0.01);
      for (let i = 0; i < 2; i++) b.box(1.6, 0.09, 0.03, teak, [0, 0.62 + i * 0.13, -0.24], [0.15, 0, 0], 0.01);
      for (const s of [-0.7, 0.7]) b.box(0.06, 0.46, 0.5, black, [s, 0.23, 0], null, 0.01);
      b.pop();
      S(1.4, 3.0, Z1 + 0.45, Z1 + 1.05, 0, 0.8, true);
      b.cyl(0.24, 0.22, 0.85, K.mat(0x1a2a4a, 0.5, 0.3), [0.9, 0.43, Z1 + 0.65], null, 14);
      b.cyl(0.25, 0.25, 0.06, K.mat(0x1a2a4a, 0.5, 0.3), [0.9, 0.88, Z1 + 0.65], null, 14);
      S(0.65, 1.15, Z1 + 0.4, Z1 + 0.9, 0, 0.9, true);
    }

    /* ---------- back yard: door hoods and signs, board fences, the cafe's bin store, grounds sacks, milk crates ---------- */
    for (const [dx, txt, key] of [
      [BACK_DG[0].c, 'DAILY GRIND · STAFF', 'dg_back'],
      [6.4, 'GET BAKED · DELIVERIES', 'gb_back']
    ]) {
      b.box(1.7, 0.06, 0.8, cop, [dx, 2.75, Z0 - 0.4], null, 0.01);
      b.label(
        1.6,
        0.2,
        strapMat(key, txt, 'bold 34px Arial, Helvetica, sans-serif', dx < 0 ? SAGE : NAVY, '#ffffff'),
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
    // a low fence between the two back yards (the cafe's side is the bin store)
    b.box(0.05, 1.2, 5.0, fen, [XM, 0.6, Z0 - 2.7], null, 0);
    for (let pz = Z0 - 0.3; pz >= Z0 - 5.2; pz -= 1.6) b.box(0.08, 1.3, 0.08, fen, [XM, 0.65, pz], null, 0.01);
    S(XM - 0.05, XM + 0.05, Z0 - 5.2, Z0 - 0.2, 0, 1.3, true);
    // wheelie bins
    for (const [wx, col] of [
      [-8.9, 0x2a5a2a],
      [-8.1, 0x3a3c40],
      [-7.3, 0x2a4a8a]
    ]) {
      rb(0.6, 1.0, 0.7, 0.04, K.mat(col, 0.6), [wx, 0.55, Z0 - 0.8]);
      rb(0.64, 0.06, 0.74, 0.02, K.mat(col, 0.5), [wx, 1.08, Z0 - 0.82]);
      for (const s of [-0.24, 0.24]) b.cyl(0.08, 0.08, 0.05, K.rubber(), [wx + s, 0.08, Z0 - 1.12], [0, 0, PI / 2], 10);
      S(wx - 0.31, wx + 0.31, Z0 - 1.2, Z0 - 0.42, 0, 1.1, true);
    }
    // sacks of spent grounds, a stack of milk crates
    for (const [sx, sz, a] of [
      [-6.3, Z0 - 0.7, 0.3],
      [-5.7, Z0 - 0.9, -0.4],
      [-6.0, Z0 - 1.5, 1.1]
    ])
      rb(0.5, 0.42, 0.75, 0.15, K.mat(0x2a2a2c, 0.5, 0.1), [sx, 0.21, sz], [0, a, 0]);
    S(-6.7, -5.3, Z0 - 1.9, Z0 - 0.4, 0, 0.45, true);
    const crate = (cx, cy, cz, col) => {
      b.box(0.4, 0.3, 0.4, K.mat(col, 0.6), [cx, cy + 0.15, cz], null, 0.01);
      b.box(0.36, 0.02, 0.36, dark, [cx, cy + 0.29, cz], null, 0);
    };
    for (let i = 0; i < 4; i++) crate(1.0, i * 0.3, Z0 - 0.6, i % 2 ? 0x1e5ab8 : 0x2a6a3a);
    for (let i = 0; i < 2; i++) crate(1.45, i * 0.3, Z0 - 0.6, 0x1e5ab8);
    S(0.75, 1.7, Z0 - 0.85, Z0 - 0.35, 0, 1.2, true);
    // stacked bread trays by the bakery back door
    for (let i = 0; i < 6; i++)
      b.box(0.6, 0.12, 0.8, K.mat(i % 2 ? 0x1e5ab8 : 0x1a4a9a, 0.6), [7.9, 0.06 + i * 0.13, Z0 - 0.6], null, 0.01);
    S(7.55, 8.25, Z0 - 1.05, Z0 - 0.15, 0, 0.8, true);

    /* ---------- interior: floors, linings, ceilings, lights ---------- */
    const cream = K.mat(0xeee6d4, 0.85),
      greenP = K.mat(0x2a4a36, 0.6),
      white = K.mat(0xf2f2ee, 0.6),
      skirt = K.mat(0x1e2a22, 0.6),
      por = K.mat(0xf6f6f2, 0.15, 0.05),
      chrome = K.chrome(),
      ss = K.mat(0xc4c8cc, 0.3, 0.85),
      hous = K.mat(0xd8d8d4, 0.5, 0.2);
    const terr = K.tri(
      'dg_terrazzo',
      (c, W, H, r) => {
        c.fillStyle = '#5a6a5c';
        c.fillRect(0, 0, W, H);
        for (let i = 0; i < 700; i++) {
          const v = r();
          c.fillStyle = v < 0.45 ? '#e8e4da' : v < 0.7 ? '#2e3a30' : v < 0.85 ? '#8a9a88' : '#c8c0b0';
          c.beginPath();
          c.ellipse(r() * W, r() * H, 3 + r() * 12, 2 + r() * 9, r() * PI, 0, PI * 2);
          c.fill();
        }
      },
      {tile: 1.6, r: 0.35}
    );
    const tileW = K.tri(
      'dg_tilew',
      (c, W, H) => {
        c.fillStyle = '#c8ccc8';
        c.fillRect(0, 0, W, H);
        const n = 8,
          s = W / n;
        c.fillStyle = '#f4f4f0';
        for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) c.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
      },
      {tile: 1.2, r: 0.3}
    );
    const subway = K.tri(
      'gb_subway',
      (c, W, H) => {
        c.fillStyle = '#c8d0dc';
        c.fillRect(0, 0, W, H);
        const rows = 16,
          bh = H / rows,
          bw = W / 4;
        for (let j = 0; j < rows; j++)
          for (let i = -1; i < 5; i++) {
            c.fillStyle = j % 3 ? '#1a4a9a' : '#1e52a8';
            c.fillRect(i * bw + (j % 2 ? bw / 2 : 0) + 2, j * bh + 2, bw - 4, bh - 4);
          }
      },
      {tile: 1.0, r: 0.25}
    );
    const panelW = K.tri(
      'gb_panel',
      (c, W, H) => {
        c.fillStyle = '#ecebe6';
        c.fillRect(0, 0, W, H);
        c.fillStyle = '#c8c6c0';
        for (let i = 0; i < 4; i++) c.fillRect((i * W) / 4, 0, 4, H);
      },
      {tile: 0.6, r: 0.6}
    );
    const stone = K.tri(
      'gb_stone',
      (c, W, H, r) => {
        c.fillStyle = '#9a9690';
        c.fillRect(0, 0, W, H);
        for (let j = 0; j < 2; j++)
          for (let i = 0; i < 2; i++) {
            c.fillStyle = `hsl(40,4%,${68 + r() * 8}%)`;
            c.fillRect((i * W) / 2 + 2, (j * H) / 2 + 2, W / 2 - 4, H / 2 - 4);
          }
        P.noise(c, W, H, r, 3000, 0.08, '#4a4640', 1);
      },
      {tile: 1.2, r: 0.5}
    );
    const quarry = K.tri(
      'gb_quarry',
      (c, W, H, r) => {
        c.fillStyle = '#5a3a2a';
        c.fillRect(0, 0, W, H);
        const n = 4,
          s = W / n;
        for (let j = 0; j < n; j++)
          for (let i = 0; i < n; i++) {
            c.fillStyle = `hsl(${10 + r() * 8},${45 + r() * 10}%,${36 + r() * 8}%)`;
            c.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
          }
      },
      {tile: 0.8, r: 0.7}
    );
    const flr = (x0, x1, z0, z1, m, y) =>
      b.box(x1 - x0, 0.02, z1 - z0, m, [(x0 + x1) / 2, y || 0.035, (z0 + z1) / 2], null, 0);
    const IN = 0.16;
    flr(X0 + IN, XM - IN, TZ, Z1 - IN, terr);
    flr(X0 + IN, TX - 0.08, Z0 + IN, TZ, terr);
    flr(TX + 0.08, XM - IN, Z0 + IN, TZ - 0.08, tileW);
    flr(XM + IN, X1 - IN, PZ + 0.08, Z1 - IN, stone);
    flr(XM + IN, X1 - IN, WZ1 + 0.08, PZ - 0.08, quarry);
    flr(WX1 + 0.08, X1 - IN, Z0 + IN, WZ1 + 0.08, quarry);
    flr(XM + IN, WX1 - 0.08, Z0 + IN, WZ1 - 0.08, tileW);
    // linings. Daily Grind: cream plaster over dark green panelling. Toilets / kitchen: white tile. Bakery shop: white panelling
    const dgSpan = (pc, u0, u1, y0, y1) => {
      if (y0 < 1.15) pc(u0, u1, y0, Math.min(y1, 1.15), greenP, 0.02, 0.01);
      if (y1 > 1.15) pc(u0, u1, Math.max(y0, 1.15), y1, cream, 0.012, 0.006);
      if (y0 < 1.2 && y1 > 1.15) pc(u0, u1, 1.12, 1.2, K.mat(0x1e3426, 0.5), 0.04, 0.02);
    };
    const tileSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, Math.min(y1, 2.0), tileW, 0.012, 0.006);
      if (y1 > 2.0) pc(u0, u1, Math.max(y0, 2.0), y1, white, 0.012, 0.006);
    };
    const shopSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, y1, panelW, 0.012, 0.006);
      if (y0 <= 0 && y1 > 0.2) pc(u0, u1, 0, 0.12, skirt, 0.03, 0.015);
    };
    const navySpan = (pc, u0, u1, y0, y1) => pc(u0, u1, y0, y1, subway, 0.012, 0.006);
    const HT = H - 0.1,
      p = 0.075; // half a partition, so a lining lands on its face
    // Daily Grind
    LK.lineWall(b, 1, Z1, X0, XM - 0.15, -1, FRONT_DG, HT, dgSpan);
    LK.lineWall(b, 0, X0, Z0, Z1, 1, LEFT, HT, dgSpan);
    LK.lineWall(b, 0, XM, TZ + p, Z1, -1, [], HT, dgSpan);
    LK.lineWall(b, 1, Z0, X0, TX - p, 1, BACK_DG, HT, dgSpan);
    LK.lineWall(b, 1, TZ - p, TX - p, XM - 0.15, 1, WC_DG_F, HT, dgSpan);
    LK.lineWall(b, 0, TX + p, Z0 + 0.15, TZ + p, -1, [], HT, dgSpan);
    // Daily Grind toilet
    LK.lineWall(b, 1, TZ + p, TX + p, XM - 0.15, -1, WC_DG_F, 2.7, tileSpan);
    LK.lineWall(b, 0, TX - p, Z0 + 0.15, TZ - p, 1, [], 2.7, tileSpan);
    LK.lineWall(b, 0, XM, Z0 + 0.15, TZ - p, -1, [], 2.7, tileSpan);
    LK.lineWall(b, 1, Z0, TX + p, XM - 0.15, 1, [], 2.7, tileSpan);
    // Get Baked shop (navy subway tile on the partition behind the counter)
    LK.lineWall(b, 1, Z1, XM + 0.15, X1, -1, FRONT_GB, CEIL, shopSpan);
    LK.lineWall(b, 0, XM, PZ + p, Z1, 1, [], CEIL, shopSpan);
    LK.lineWall(
      b,
      0,
      X1,
      PZ + p,
      Z1,
      -1,
      RIGHT.filter(o => o.c > PZ),
      CEIL,
      shopSpan
    );
    LK.lineWall(b, 1, PZ + p * 2, XM + 0.15, X1 - 0.15, 1, PART_GB, CEIL, navySpan);
    // Get Baked kitchen + staff toilet
    LK.lineWall(b, 1, PZ, XM + 0.15, X1 - 0.15, -1, PART_GB, CEIL, tileSpan);
    LK.lineWall(b, 0, XM, WZ1 + p, PZ - p, 1, [], CEIL, tileSpan);
    LK.lineWall(
      b,
      0,
      X1,
      Z0,
      PZ - p,
      -1,
      RIGHT.filter(o => o.c < PZ),
      CEIL,
      tileSpan
    );
    LK.lineWall(
      b,
      1,
      Z0,
      WX1 + p,
      X1,
      1,
      BACK_GB.map(o => ({k: o.k, c: o.c})),
      CEIL,
      tileSpan
    );
    LK.lineWall(b, 1, WZ1 - p, XM + 0.15, WX1 + p, -1, [], CEIL, tileSpan);
    LK.lineWall(b, 0, WX1 + p, Z0 + 0.15, WZ1 + p, 1, WC_GB_S, CEIL, tileSpan);
    LK.lineWall(b, 1, WZ1 + p, XM + 0.15, WX1 - p, 1, [], 2.7, tileSpan);
    LK.lineWall(b, 0, WX1 - p, Z0 + 0.15, WZ1 - p, -1, WC_GB_S, 2.7, tileSpan);
    LK.lineWall(b, 0, XM, Z0 + 0.15, WZ1 - p, 1, [], 2.7, tileSpan);
    LK.lineWall(b, 1, Z0, XM + 0.15, WX1 - p, 1, [], 2.7, tileSpan);
    // ceilings: Daily Grind open to a dark deck with ducts; toilets at 2.7 m; the bakery under a white ceiling
    b.box(XM - X0 - 0.3, 0.04, Z1 - Z0 - 0.3, K.mat(0x34363a, 0.8), [(X0 + XM) / 2, H - 0.06, (Z0 + Z1) / 2], null, 0);
    for (let jz = Z0 + 1.2; jz < Z1; jz += 2.0)
      b.box(XM - X0 - 0.3, 0.26, 0.08, K.mat(0x2a2c30, 0.5, 0.5), [(X0 + XM) / 2, H - 0.21, jz], null, 0);
    b.box(XM - TX - 0.2, 0.04, TZ - Z0 - 0.2, white, [(TX + XM) / 2, 2.72, (Z0 + TZ) / 2], null, 0);
    b.box(
      X1 - XM - 0.3,
      0.04,
      Z1 - Z0 - 0.3,
      K.mat(0xf0efea, 0.9),
      [(XM + X1) / 2, CEIL + 0.02, (Z0 + Z1) / 2],
      null,
      0
    );
    b.box(WX1 - XM - 0.2, 0.04, WZ1 - Z0 - 0.2, white, [(XM + WX1) / 2, 2.72, (Z0 + WZ1) / 2], null, 0);
    // galvanised spiral ducts through the cafe, branches to round diffusers
    const duct = K.mat(0xb8bcc0, 0.35, 0.8);
    b.cyl(0.3, 0.3, Z1 - Z0 - 0.6, duct, [-5.6, H - 0.65, (Z0 + Z1) / 2], [PI / 2, 0, 0], 16, true);
    for (let k = 0; k < 14; k++) b.tor(0.305, 0.015, duct, [-5.6, H - 0.65, Z0 + 0.6 + k * 1.0], null, PI * 2, 16);
    for (const dz of [-4.5, 0.5, 5.0]) {
      b.cyl(0.16, 0.16, 2.0, duct, [-4.3, H - 0.65, dz], [0, 0, PI / 2], 12, true);
      b.cyl(0.18, 0.12, 0.3, duct, [-3.3, H - 0.85, dz], null, 12);
    }
    b.cyl(0.2, 0.2, Z1 - Z0 - 1.0, duct, [-1.6, H - 0.55, (Z0 + Z1) / 2 + 0.3], [PI / 2, 0, 0], 12, true);
    // black track lighting with spots
    for (const tx of [-7.4, -3.2]) {
      b.box(0.05, 0.04, Z1 - Z0 - 1.5, black, [tx, H - 0.95, (Z0 + Z1) / 2 + 0.5], null, 0);
      for (let k = 0; k < 7; k++) {
        const tz = Z0 + 1.4 + k * 2.0;
        b.cyl(0.05, 0.05, 0.15, black, [tx, H - 1.06, tz], [0.5, 0, 0], 10);
        b.cyl(0.04, 0.04, 0.01, warm, [tx, H - 1.13, tz + 0.04], [0.5, 0, 0], 10);
      }
      for (const s of [-1, 1]) b.cyl(0.006, 0.006, 0.9, steel, [tx, H - 0.5, (Z0 + Z1) / 2 + 0.5 + s * 5], null, 4);
    }
    // green enamel pendants over the coffee bar
    for (const px of [-7.4, -6.1, -4.9]) {
      b.cyl(0.004, 0.004, H - 2.5, dark, [px, (H + 2.5) / 2, -3.2], null, 4);
      b.lathe(
        [
          [0.02, 0.18],
          [0.06, 0.16],
          [0.17, 0.02],
          [0.19, 0]
        ],
        K.mat(0x1e5a3a, 0.35, 0.3),
        [px, 2.32, -3.2],
        16
      );
      b.sph(0.06, warm, [px, 2.34, -3.2], null, 8);
    }
    // toilet lights, bakery downlights, kitchen battens
    for (const [lx, lz] of [
      [(TX + XM) / 2, (Z0 + TZ) / 2],
      [(XM + WX1) / 2, (Z0 + WZ1) / 2]
    ]) {
      b.cyl(0.14, 0.14, 0.03, hous, [lx, 2.69, lz], null, 14);
      b.cyl(0.12, 0.12, 0.01, lit, [lx, 2.675, lz], null, 14);
    }
    for (let lx = 1.2; lx < 8.6; lx += 1.8)
      for (const lz of [4.0, 6.6]) b.cyl(0.08, 0.08, 0.01, lit, [lx, CEIL - 0.005, lz], null, 12);
    for (const lx of [3.4, 6.6])
      for (const lz of [-5.2, -2.0, 1.2]) {
        b.box(1.3, 0.07, 0.18, hous, [lx, CEIL - 0.04, lz], null, 0.01);
        b.box(1.22, 0.012, 0.12, lit, [lx, CEIL - 0.08, lz], null, 0);
      }

    /* ---------- Daily Grind: the coffee bar by the till (tiled counter, espresso machine, grinders, pastry case) ---------- */
    const quartz = K.mat(0xeceae4, 0.25),
      beige = K.tri(
        'dg_counter',
        (c, W, H) => {
          c.fillStyle = '#8a7c66';
          c.fillRect(0, 0, W, H);
          for (let j = 0; j < 2; j++)
            for (let i = 0; i < 8; i++) {
              c.fillStyle = (i + j) % 3 ? '#c8b89a' : '#bcae92';
              c.fillRect((i * W) / 8 + 2, (j * H) / 2 + 2, W / 8 - 4, H / 2 - 4);
            }
        },
        {tile: 0.8, r: 0.5}
      );
    const CZ = -3.2; // counter centre line
    b.box(3.4, 0.98, 0.7, beige, [-6.3, 0.49, CZ], null, 0.01);
    b.box(3.5, 0.05, 0.8, quartz, [-6.3, 1.0, CZ], null, 0.01);
    b.box(3.36, 0.02, 0.02, warm, [-6.3, 0.94, CZ + 0.36], null, 0); // LED strip under the lip
    S(-8.0, -4.6, CZ - 0.4, CZ + 0.4, 0, 1.03);
    // espresso machine: green body, chrome group heads, cup warmer
    b.push([-6.6, 1.02, CZ - 0.05]);
    rb(1.0, 0.42, 0.55, 0.05, K.mat(0x1e6a3a, 0.25, 0.4), [0, 0.21, 0]);
    b.box(0.96, 0.05, 0.5, chrome, [0, 0.45, 0], null, 0.01);
    for (const gx of [-0.3, 0, 0.3]) {
      b.cyl(0.045, 0.05, 0.08, chrome, [gx, 0.14, 0.3], null, 10);
      b.box(0.03, 0.03, 0.16, black, [gx, 0.1, 0.38], null, 0);
    }
    b.box(0.9, 0.02, 0.18, chrome, [0, 0.02, 0.33], null, 0); // drip tray
    for (const s of [-1, 1]) b.cyl(0.008, 0.008, 0.24, chrome, [s * 0.45, 0.2, 0.3], [0.4, 0, 0], 6); // steam wands
    for (let i = 0; i < 6; i++) b.cyl(0.035, 0.03, 0.07, white, [-0.35 + i * 0.14, 0.51, -0.05], null, 10); // cups on top
    b.pop();
    // grinders with bean hoppers
    for (const gx of [-7.35, -7.7]) {
      b.box(0.22, 0.35, 0.3, black, [gx, 1.2, CZ - 0.1], null, 0.02);
      b.cyl(0.1, 0.06, 0.25, K.glass(0x3a2210, 0.6), [gx, 1.5, CZ - 0.12], null, 12);
      b.cyl(0.11, 0.11, 0.03, black, [gx, 1.63, CZ - 0.12], null, 12);
    }
    // pastry case at the till end
    b.push([-5.0, 1.02, CZ]);
    b.box(0.7, 0.03, 0.5, ss, [0, 0.015, 0], null, 0);
    b.box(0.7, 0.4, 0.5, K.glass(0xdfeef2, 0.25), [0, 0.22, 0], null, 0);
    const pastry = [0xc88a3a, 0xd8a050, 0x8a4a22, 0xe8c070, 0xb86a2a];
    for (let i = 0; i < 6; i++)
      rb(
        0.14,
        0.06,
        0.1,
        0.02,
        K.mat(pastry[i % 5], 0.7),
        [-0.22 + (i % 3) * 0.22, 0.06 + Math.floor(i / 3) * 0.18, 0.04],
        null
      );
    b.box(0.66, 0.01, 0.46, ss, [0, 0.2, 0], null, 0);
    b.pop();
    // card reader, tip jar, cup stacks
    b.box(0.08, 0.04, 0.14, black, [-5.25, 1.05, CZ + 0.3], [0.3, 0, 0], 0.005);
    b.cyl(0.07, 0.07, 0.16, K.glass(0xeef4f6, 0.4), [-6.0, 1.1, CZ + 0.3], null, 10);
    for (let i = 0; i < 3; i++) b.cyl(0.045, 0.035, 0.32, white, [-7.95 + i * 0.12, 1.18, CZ + 0.25], null, 10);
    // back bar: open shelves of bean tins over the counter units, menu boards above
    for (const sy of [1.65, 2.05]) b.box(3.8, 0.04, 0.3, teak, [-6.6, sy, Z0 + 0.32], null, 0.01);
    const tins = [0x2a2c30, 0xd8d4c8, 0x2a2c30, 0x5f6b4e, 0xd8d4c8];
    for (const sy of [1.67, 2.07])
      for (let i = 0; i < 14; i++)
        b.cyl(
          0.07,
          0.07,
          0.2,
          K.mat(tins[(i + Math.round(sy * 10)) % 5], 0.4, 0.4),
          [-8.3 + i * 0.26, sy + 0.12, Z0 + 0.32],
          null,
          10
        );
    const menu = (key, title, rows) =>
      K.paint(
        key,
        256,
        384,
        (c, W, H) => {
          c.fillStyle = '#f2f0ea';
          c.fillRect(0, 0, W, H);
          c.fillStyle = '#1e2620';
          c.font = 'bold 30px Arial, Helvetica, sans-serif';
          c.fillText(title, 18, 48);
          c.font = '20px Arial, Helvetica, sans-serif';
          rows.forEach((r, i) => {
            c.fillText(r[0], 18, 96 + i * 34);
            c.textAlign = 'right';
            c.fillText(r[1], W - 18, 96 + i * 34);
            c.textAlign = 'left';
          });
        },
        {glow: 0.15}
      );
    [
      [
        'dg_m1',
        'Espresso',
        [
          ['Espresso', '2.10'],
          ['Americano', '2.60'],
          ['Flat White', '3.20'],
          ['Cappuccino', '3.10'],
          ['Latte', '3.20']
        ]
      ],
      [
        'dg_m2',
        'Brew Bar',
        [
          ['Filter', '2.40'],
          ['Moka Pot', '3.00'],
          ['Cold Brew', '3.50'],
          ['Pour Over', '3.60']
        ]
      ],
      [
        'dg_m3',
        'Not Coffee',
        [
          ['Matcha', '3.40'],
          ['Hot Choc', '3.00'],
          ['Chai', '3.20'],
          ['Tea', '2.20']
        ]
      ],
      [
        'dg_m4',
        'Bites',
        [
          ['Croissant', '2.40'],
          ['Brownie', '2.80'],
          ['Toastie', '4.50'],
          ['Banana Bread', '2.90']
        ]
      ]
    ].forEach(([k, t, r], i) => {
      const mx = -8.25 + i * 1.12;
      b.box(0.98, 1.36, 0.04, black, [mx, 3.15, Z0 + 0.2], null, 0.01);
      b.label(0.92, 1.3, menu(k, t, r), [mx, 3.15, Z0 + 0.225]);
    });

    /* ---------- Daily Grind seating: green banquette with tables and teal chairs, long high table, window ledge, round tables ---------- */
    const lthr = K.mat(0x2e5a46, 0.45, 0.05),
      teal = K.mat(0x1e4a52, 0.42, 0.05),
      table = K.veneer(0x4a2a18);
    // banquette along the left wall
    b.box(0.6, 0.45, 8.0, K.mat(0x3a2a1c, 0.6), [X0 + 0.48, 0.225, 2.4], null, 0.01);
    rb(0.56, 0.12, 7.9, 0.04, lthr, [X0 + 0.5, 0.5, 2.4]);
    rb(0.16, 0.62, 7.9, 0.05, lthr, [X0 + 0.26, 0.86, 2.4]);
    for (let i = 0; i < 8; i++) {
      const cz = -1.1 + i * 1.0;
      b.box(0.12, 0.38, 0.38, K.mat(i % 2 ? 0x2a5a3a : 0xe8e2d0, 0.9), [X0 + 0.42, 0.78, cz], [0, 0, -0.2], 0.04);
    }
    S(X0 + 0.15, X0 + 0.8, -1.6, 6.4, 0, 0.6);
    const chair = (cx, cz, a, m) => {
      b.push([cx, 0, cz], [0, a, 0]);
      rb(0.44, 0.08, 0.42, 0.03, m, [0, 0.47, 0]);
      for (let i = 0; i < 4; i++) b.box(0.42, 0.06, 0.03, m, [0, 0.62 + i * 0.07, -0.2], [-0.08, 0, 0], 0.01);
      for (const [qx, qz] of [
        [-0.18, -0.18],
        [0.18, -0.18],
        [-0.18, 0.18],
        [0.18, 0.18]
      ])
        b.cyl(0.012, 0.012, 0.46, black, [qx, 0.23, qz], null, 5);
      for (const s of [-0.18, 0.18]) b.cyl(0.01, 0.01, 0.48, black, [s, 0.72, -0.2], null, 5);
      b.pop();
    };
    for (const tz of [-0.6, 1.4, 3.4, 5.4]) {
      b.box(0.7, 0.04, 0.7, table, [-7.85, 0.75, tz], null, 0.01);
      b.cyl(0.03, 0.03, 0.72, black, [-7.85, 0.37, tz], null, 8);
      b.cyl(0.22, 0.24, 0.03, black, [-7.85, 0.015, tz], null, 12);
      chair(-7.0, tz, -PI / 2, teal);
      S(-8.2, -7.5, tz - 0.36, tz + 0.36, 0, 0.78, true);
      // a cup and a jar of straws on some tables
      b.cyl(0.04, 0.03, 0.08, white, [-7.95, 0.81, tz + 0.1], null, 10);
      if (tz > 0) b.cyl(0.04, 0.04, 0.12, K.glass(0xeef4f6, 0.4), [-7.75, 0.83, tz - 0.15], null, 8);
    }
    // the long high table with stools both sides
    b.box(0.6, 0.06, 4.2, black, [-4.4, 1.05, 2.0], null, 0.01);
    b.box(0.5, 0.02, 4.1, K.mat(0x3a1a12, 0.2, 0.2), [-4.4, 1.085, 2.0], null, 0);
    for (const tz of [0.1, 3.9]) {
      for (const s of [-1, 1]) b.box(0.05, 1.05, 0.05, black, [-4.4 + s * 0.25, 0.52, tz], null, 0);
      b.box(0.55, 0.05, 0.05, black, [-4.4, 0.2, tz], null, 0);
    }
    b.box(0.05, 0.05, 3.8, black, [-4.4, 0.2, 2.0], null, 0);
    S(-4.7, -4.1, -0.1, 4.1, 0, 1.1);
    const hiStool = (sx, sz) => {
      b.cyl(0.17, 0.16, 0.05, black, [sx, 0.76, sz], null, 12);
      for (let k = 0; k < 4; k++) {
        const a = (k * PI) / 2 + PI / 4;
        b.cyl(
          0.015,
          0.02,
          0.76,
          black,
          [sx + Math.cos(a) * 0.12, 0.38, sz + Math.sin(a) * 0.12],
          [Math.sin(a) * 0.12, 0, -Math.cos(a) * 0.12],
          5
        );
      }
      b.tor(0.14, 0.01, black, [sx, 0.3, sz], [PI / 2, 0, 0], PI * 2, 10);
      S(sx - 0.18, sx + 0.18, sz - 0.18, sz + 0.18, 0, 0.78, true);
    };
    for (const sz of [0.6, 1.6, 2.6, 3.6]) {
      hiStool(-5.05, sz);
      hiStool(-3.75, sz);
    }
    // window ledge inside the front glass, stools
    b.box(4.6, 0.05, 0.4, teak, [-6.0, 1.05, Z1 - 0.38], null, 0.01);
    for (const sx of [-8.0, -6.0, -4.0]) b.box(0.04, 0.22, 0.3, black, [sx, 0.92, Z1 - 0.32], null, 0);
    S(-8.3, -3.7, Z1 - 0.58, Z1 - 0.15, 0.95, 1.1, true);
    for (const sx of [-7.4, -6.0, -4.6]) hiStool(sx, Z1 - 0.95);
    // round tables by the party wall, two chairs each
    for (const tz of [3.4, 5.8]) {
      b.cyl(0.4, 0.4, 0.04, table, [-1.2, 0.75, tz], null, 18);
      b.cyl(0.03, 0.03, 0.72, black, [-1.2, 0.37, tz], null, 8);
      b.cyl(0.24, 0.26, 0.03, black, [-1.2, 0.015, tz], null, 12);
      S(-1.6, -0.8, tz - 0.4, tz + 0.4, 0, 0.78, true);
      chair(-1.2, tz - 0.66, 0, teal);
      chair(-1.2, tz + 0.66, PI, teal);
    }
    // a couple of trailing plants on top of the back-bar shelves and in a pot by the door
    for (const px of [-8.6, -4.9]) b.sph(0.2, leaf, [px, 2.3, Z0 + 0.32], [1, 0.8, 1], 7);
    // v089: the pot moved to the other side of the door (its leaves hung into the doorway)
    b.cyl(0.24, 0.2, 0.5, K.mat(0xd8d0c0, 0.6), [-1.25, 0.25, Z1 - 0.5], null, 14);
    b.sph(0.4, leaf2, [-1.25, 0.95, Z1 - 0.5], [1, 1.3, 1], 8);
    S(-1.5, -1.0, Z1 - 0.75, Z1 - 0.25, 0, 1.2, true);

    /* ---------- Daily Grind toilet: WC, basin + mirror, dryer, baby change ---------- */
    const wc = (wx, wz, a) => {
      b.push([wx, 0, wz], [0, a, 0]);
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
    };
    wc(-0.7, Z0 + 0.45, 0);
    S(-1.0, -0.4, Z0 + 0.15, Z0 + 0.85, 0, 0.8, true);
    b.cyl(0.018, 0.018, 0.7, chrome, [-0.2, 0.85, Z0 + 0.6], [PI / 2, 0, 0], 8); // grab rail
    b.cyl(0.055, 0.055, 0.11, K.mat(0xffffff, 0.8), [-1.25, 0.7, Z0 + 0.2], [0, 0, PI / 2], 12);
    // basin + mirror on the party wall
    b.box(0.4, 0.15, 0.5, por, [XM - 0.4, 0.82, -4.4], null, 0.04);
    b.cyl(0.04, 0.05, 0.7, por, [XM - 0.35, 0.4, -4.4], null, 12);
    b.cyl(0.012, 0.012, 0.15, chrome, [XM - 0.55, 0.95, -4.4], null, 8);
    b.box(0.02, 0.65, 0.5, K.mat(0xcfe0e8, 0.05, 0.9), [XM - 0.17, 1.55, -4.4], null, 0);
    b.box(0.14, 0.3, 0.24, K.mat(0xd8d8d4, 0.4, 0.4), [XM - 0.24, 1.3, -5.2], null, 0.02); // dryer
    S(XM - 0.65, XM - 0.15, -4.65, -4.15, 0, 0.95, true);
    // fold-down baby change on the side wall
    b.box(0.85, 0.5, 0.1, K.mat(0xe8e4dc, 0.4), [TX + 0.95, 1.2, Z0 + 0.22], null, 0.02);
    b.label(0.3, 0.3, strapMat('dg_wcs', 'WC', 'bold 160px Arial, Helvetica, sans-serif', SAGE, '#ffffff', 256, 256), [
      -1.0,
      2.1,
      TZ + p + 0.02
    ]);

    /* ---------- Get Baked shop: glass bakery counter, till, bread racks on navy tile, menu screens, drinks cooler, waiting bench ---------- */
    {
      const GZ = 5.0; // counter centre line
      const oakC = K.veneer(0xb8905a);
      b.box(
        6.0,
        0.9,
        0.8,
        K.tri(
          'gb_ctile',
          (c, W, H) => {
            c.fillStyle = '#b8bcc0';
            c.fillRect(0, 0, W, H);
            for (let j = 0; j < 4; j++)
              for (let i = 0; i < 4; i++) {
                c.fillStyle = '#f2f2f0';
                c.fillRect((i * W) / 4 + 2, (j * H) / 4 + 2, W / 4 - 4, H / 4 - 4);
              }
          },
          {tile: 0.4, r: 0.3}
        ),
        [3.3, 0.45, GZ],
        null,
        0.01
      );
      b.box(6.0, 0.08, 0.06, K.mat(0x1a1c20, 0.5), [3.3, 0.06, GZ + 0.41], null, 0);
      b.box(6.1, 0.04, 0.9, K.mat(0x9a9ea2, 0.3, 0.6), [3.3, 0.92, GZ], null, 0.01);
      S(0.3, 6.3, GZ - 0.45, GZ + 0.45, 0, 1.4);
      // three heated glass cases on the counter with trays of bakes
      const bakes = [
        [0xd8a050, 0.16, 0.06, 0.1], // sausage rolls
        [0xc8803a, 0.12, 0.08, 0.12], // pasties
        [0xe8c070, 0.1, 0.05, 0.1], // croissants
        [0x6a3a1a, 0.08, 0.04, 0.08], // brownies
        [0xf0d8a8, 0.09, 0.07, 0.09], // iced buns
        [0xe8a0b0, 0.08, 0.06, 0.08] // pink doughnuts
      ];
      for (let ci = 0; ci < 3; ci++) {
        const cx = 1.0 + ci * 1.75;
        b.push([cx, 0.94, GZ]);
        b.box(1.6, 0.04, 0.7, ss, [0, 0.02, 0], null, 0);
        b.box(1.6, 0.04, 0.7, ss, [0, 0.62, -0.05], null, 0);
        b.box(1.58, 0.56, 0.02, K.glass(0xe8f2f6, 0.22), [0, 0.32, 0.32], [-0.2, 0, 0], 0);
        for (const s of [-1, 1]) b.box(0.02, 0.6, 0.66, K.glass(0xe8f2f6, 0.22), [s * 0.79, 0.32, 0], null, 0);
        b.box(1.5, 0.02, 0.5, ss, [0, 0.33, -0.05], null, 0);
        for (const ty of [0.04, 0.35]) {
          const [col, w, h, d] = bakes[(ci * 2 + (ty > 0.2 ? 1 : 0)) % 6];
          const m = K.mat(col, 0.65);
          for (let i = 0; i < 6; i++)
            for (let j = 0; j < 2; j++) rb(w, h, d, 0.02, m, [-0.6 + i * 0.24, ty + h / 2 + 0.01, -0.18 + j * 0.2]);
        }
        b.box(1.56, 0.02, 0.02, lit, [0, 0.6, 0.25], null, 0);
        b.pop();
      }
      // price tickets
      for (let i = 0; i < 6; i++) b.box(0.08, 0.05, 0.01, white, [0.6 + i * 0.95, 1.0, GZ + 0.33], [-0.4, 0, 0], 0);
      // the till end (oak top)
      b.box(1.0, 0.04, 0.84, oakC, [5.85, 0.95, GZ], null, 0.01);
      b.box(0.08, 0.04, 0.14, black, [6.2, 0.99, GZ + 0.3], [0.3, 0, 0], 0.005);
      // bread racks on the navy tiled back wall: wire shelving with loaves and baguettes
      const wire = K.mat(0xc8ccd0, 0.35, 0.8),
        loaf = K.mat(0xc8843a, 0.7),
        loaf2 = K.mat(0xa86a2a, 0.75);
      for (const rx of [1.2, 3.0]) {
        for (const sy of [0.4, 0.85, 1.3, 1.75]) {
          b.box(1.6, 0.02, 0.42, wire, [rx, sy, PZ + 0.38], null, 0);
          for (let i = 0; i < 5; i++)
            rb(0.26, 0.12, 0.18, 0.05, (i + sy * 10) % 2 ? loaf : loaf2, [
              rx - 0.6 + i * 0.3,
              sy + 0.07,
              PZ + 0.36 + ((i % 2) - 0.5) * 0.12
            ]);
        }
        for (const s of [-1, 1]) b.box(0.03, 1.85, 0.42, wire, [rx + s * 0.8, 0.93, PZ + 0.38], null, 0);
      }
      // baguettes standing in a basket
      b.cyl(0.22, 0.18, 0.5, K.mat(0x8a6a3a, 0.9), [4.3, 0.25, PZ + 0.4], null, 12);
      for (let i = 0; i < 7; i++)
        b.cyl(
          0.03,
          0.03,
          0.8,
          loaf,
          [4.3 + Math.cos(i) * 0.1, 0.75, PZ + 0.4 + Math.sin(i) * 0.1],
          [Math.sin(i) * 0.12, 0, Math.cos(i) * 0.12],
          6
        );
      S(0.35, 4.55, PZ + 0.12, PZ + 0.65, 0, 1.9);
      // small back counter for the hot drinks machine and bags
      b.box(1.8, 0.9, 0.55, oakC, [5.6, 0.45, PZ + 0.38], null, 0.01);
      b.box(1.84, 0.04, 0.6, K.mat(0x9a9ea2, 0.3, 0.6), [5.6, 0.92, PZ + 0.38], null, 0.01);
      for (let i = 0; i < 3; i++)
        b.box(0.24, 0.32, 0.12, K.mat(0xd8c8a8, 0.9), [6.15, 1.1, PZ + 0.3 + i * 0.13], null, 0.005); // paper bags
      S(4.7, 6.5, PZ + 0.1, PZ + 0.66, 0, 0.95);
      // menu screens over the back wall
      const screen = (key, t1, rows, bg) =>
        K.paint(
          key,
          384,
          216,
          (c, W, H) => {
            c.fillStyle = bg;
            c.fillRect(0, 0, W, H);
            c.fillStyle = '#ffffff';
            c.font = 'bold 30px Arial, Helvetica, sans-serif';
            c.fillText(t1, 16, 40);
            c.font = '20px Arial, Helvetica, sans-serif';
            rows.forEach((r, i) => {
              c.fillText(r[0], 16, 80 + i * 30);
              c.textAlign = 'right';
              c.fillStyle = BUN;
              c.fillText(r[1], W - 16, 80 + i * 30);
              c.fillStyle = '#ffffff';
              c.textAlign = 'left';
            });
          },
          {glow: 0.8}
        );
      [
        [
          'gb_s1',
          'SAVOURY',
          [
            ['Sausage Roll', '1.30'],
            ['Steak Bake', '2.10'],
            ['Cheese Pasty', '1.90'],
            ['Veggie Bake', '1.95']
          ],
          '#123a7a'
        ],
        [
          'gb_s2',
          'SWEET',
          [
            ['Iced Bun', '1.10'],
            ['Doughnut', '1.20'],
            ['Brownie', '1.60'],
            ['Croissant', '1.40']
          ],
          '#0e2e64'
        ],
        [
          'gb_s3',
          'HOT DRINKS',
          [
            ['Coffee', '1.80'],
            ['Tea', '1.40'],
            ['Hot Choc', '1.90'],
            ['Free with app', '*']
          ],
          '#123a7a'
        ]
      ].forEach(([k, t, r, bg], i) => {
        const sx = 1.4 + i * 2.1;
        b.box(1.9, 1.1, 0.06, black, [sx, 2.55, PZ + 0.2], null, 0.01);
        b.label(1.82, 1.02, screen(k, t, r, bg), [sx, 2.55, PZ + 0.235]);
      });
      // the small waiting area: a bench along the party wall, a leaning ledge under the front windows
      b.push([XM + 0.42, 0, 6.6]);
      b.box(0.5, 0.42, 1.8, oakC, [0, 0.21, 0], null, 0.01);
      rb(0.46, 0.08, 1.76, 0.03, blue, [0, 0.46, 0]);
      b.pop();
      S(XM + 0.15, XM + 0.7, 5.7, 7.5, 0, 0.5);
      b.box(2.8, 0.05, 0.34, oakC, [7.0, 1.05, Z1 - 0.36], null, 0.01);
      S(5.6, 8.4, Z1 - 0.55, Z1 - 0.15, 0.95, 1.1, true);
      for (const sx of [6.2, 7.8]) hiStool(sx, Z1 - 0.85);
      // a queue post pair and a wet-floor sign
      for (const qx of [3.0, 4.6]) {
        b.cyl(0.025, 0.025, 0.95, K.chrome(), [qx, 0.48, 6.0], null, 8);
        b.cyl(0.15, 0.17, 0.03, K.chrome(), [qx, 0.015, 6.0], null, 12);
      }
      b.box(1.55, 0.05, 0.01, blue, [3.8, 0.88, 6.0], null, 0);
      // KITCHEN · STAFF ONLY over the kitchen door, the shop's logo on the party wall
      b.label(
        1.0,
        0.16,
        strapMat('gb_staff', 'STAFF ONLY', 'bold 40px Arial, Helvetica, sans-serif', NAVY, '#ffffff'),
        [7.7, 2.6, PZ + p * 2 + 0.03]
      );
      b.push([XM + 0.17, 2.2, 6.6], [0, PI / 2, 0]);
      b.label(1.6, 0.25, gbFascia(), [0, 0, 0]);
      b.pop();
    }

    /* ---------- Get Baked kitchen: deck ovens, rack oven, mixer, prover, prep tables, speed racks, flour sacks ---------- */
    {
      const ssB = K.brushed ? K.brushed(0xc4c8cc) : ss,
        glow = K.mat(0xff9a40, 0.6, 0, {emissive: 0xff7a20, emissiveIntensity: 0.9});
      // two stacked three-deck ovens on the right wall, under the roof flues
      for (const oz of [-2.1, -0.1]) {
        // v089: 1.5 m further back, so the shop / kitchen door has 2 m clear behind it
        b.push([X1 - 0.95, 0, oz]);
        b.box(1.4, 0.5, 1.8, K.mat(0x3a3c40, 0.5, 0.5), [0, 0.25, 0], null, 0.01); // stand
        for (let d = 0; d < 3; d++) {
          const y = 0.55 + d * 0.5;
          b.box(1.4, 0.46, 1.8, ssB, [0, y + 0.23, 0], null, 0.01);
          b.box(0.03, 0.22, 1.3, K.glass(0x2a1a10, 0.7), [-0.71, y + 0.25, 0], null, 0);
          b.box(0.02, 0.18, 1.26, glow, [-0.7, y + 0.25, 0], null, 0);
          b.cyl(0.015, 0.015, 1.2, chrome, [-0.78, y + 0.4, 0], [PI / 2, 0, 0], 6);
          b.box(0.03, 0.1, 0.22, black, [-0.72, y + 0.25, 0.75], null, 0);
        }
        b.box(1.4, 0.4, 1.8, ssB, [0, 2.25, 0], null, 0.01); // hood
        b.cyl(0.14, 0.14, CEIL - 2.45, ss, [0.1, (CEIL + 2.45) / 2, 0], null, 10);
        b.pop();
        S(X1 - 1.66, X1 - 0.2, oz - 0.92, oz + 0.92, 0, 2.45);
      }
      // a peel hanging beside the ovens
      b.box(0.02, 1.5, 0.05, K.surf('wood', 0x9a7a4a), [X1 - 0.2, 1.4, -3.4], null, 0);
      b.box(0.02, 0.35, 0.3, K.surf('wood', 0x9a7a4a), [X1 - 0.2, 0.5, -3.4], null, 0);
      // the rack oven on the back wall
      b.push([5.0, 0, Z0 + 0.95]);
      b.box(1.3, 2.4, 1.5, ssB, [0, 1.2, 0], null, 0.01);
      b.box(0.9, 1.8, 0.03, K.glass(0x2a1a10, 0.6), [0, 1.1, 0.76], null, 0);
      b.box(0.86, 1.76, 0.02, glow, [0, 1.1, 0.74], null, 0);
      b.box(0.04, 0.6, 0.06, chrome, [0.5, 1.2, 0.8], null, 0);
      b.box(0.3, 0.4, 0.04, black, [-0.45, 2.1, 0.77], null, 0); // control panel
      b.pop();
      S(4.35, 5.65, Z0 + 0.2, Z0 + 1.7, 0, 2.4);
      // spiral dough mixer
      b.push([3.4, 0, 1.9]);
      b.box(0.7, 0.8, 1.0, K.mat(0xe8e8e4, 0.4, 0.3), [0, 0.4, 0], null, 0.03);
      b.cyl(0.38, 0.34, 0.4, ss, [0, 1.0, 0.15], null, 18, true);
      b.box(0.5, 0.5, 0.3, K.mat(0xe8e8e4, 0.4, 0.3), [0, 1.3, -0.35], null, 0.03);
      b.box(0.3, 0.12, 0.5, K.mat(0xe8e8e4, 0.4, 0.3), [0, 1.5, -0.05], null, 0.03);
      b.cyl(0.36, 0.36, 0.05, K.mat(0xf2e8d0, 0.9), [0, 1.0, 0.15], null, 18); // dough
      b.pop();
      S(3.05, 3.75, 1.4, 2.4, 0, 1.6);
      // proving cabinet on the party wall
      b.box(0.8, 2.0, 0.9, K.mat(0xd8d8d4, 0.35, 0.5), [XM + 0.6, 1.0, 1.9], null, 0.02);
      b.box(0.02, 1.6, 0.7, K.glass(0xd8e8ee, 0.45), [XM + 1.01, 1.05, 1.9], null, 0);
      for (let i = 0; i < 6; i++) b.box(0.6, 0.02, 0.6, ss, [XM + 0.6, 0.4 + i * 0.25, 1.9], null, 0);
      S(XM + 0.15, XM + 1.02, 1.42, 2.38, 0, 2.0);
      // speed racks of trays with loaves
      const speed = (rx, rz) => {
        b.push([rx, 0, rz]);
        for (const sx of [-0.25, 0.25])
          for (const sz of [-0.33, 0.33]) b.box(0.03, 1.75, 0.03, ss, [sx, 0.95, sz], null, 0);
        for (let i = 0; i < 10; i++) {
          const y = 0.25 + i * 0.16;
          b.box(0.48, 0.015, 0.66, K.mat(0x8a8e92, 0.4, 0.6), [0, y, 0], null, 0);
          if (i % 3 !== 2)
            for (let k = 0; k < 3; k++)
              rb(0.14, 0.07, 0.5, 0.03, K.mat(k % 2 ? 0xc8843a : 0xd8a050, 0.7), [-0.15 + k * 0.15, y + 0.045, 0]);
        }
        for (const sx of [-0.25, 0.25])
          for (const sz of [-0.33, 0.33]) b.cyl(0.03, 0.03, 0.05, K.rubber(), [sx, 0.04, sz], [0, 0, PI / 2], 8);
        b.pop();
        S(rx - 0.3, rx + 0.3, rz - 0.38, rz + 0.38, 0, 1.85, true);
      };
      speed(6.8, -3.0);
      speed(7.5, -3.0);
      speed(3.3, -2.0);
      // flour sacks stacked on a pallet by the back door
      b.push([8.0, 0, Z0 + 1.1]);
      for (const s of [-0.45, 0, 0.45]) b.box(1.0, 0.1, 0.1, wood, [0, 0.05, s], null, 0.004);
      b.box(1.0, 0.03, 1.2, wood, [0, 0.12, 0], null, 0);
      for (let l = 0; l < 4; l++)
        for (let i = 0; i < 2; i++)
          rb(
            0.45,
            0.16,
            0.7,
            0.06,
            K.mat(0xeee8d8, 0.95),
            [-0.23 + i * 0.46, 0.22 + l * 0.17, l % 2 ? 0.2 : -0.2],
            [0, l % 2 ? 0 : 0.05, 0]
          );
      b.pop();
      S(7.45, 8.55, Z0 + 0.45, Z0 + 1.75, 0, 0.9);
      // ingredient tubs under the prep tables, a bin of rolling pins
      for (let i = 0; i < 3; i++) rb(0.4, 0.5, 0.55, 0.04, K.mat(0xeaeef0, 0.4), [4.1 + i * 0.5, 0.25, -0.15], null);
      // white kitchen clock + safety notices
      b.cyl(0.18, 0.18, 0.04, white, [5.0, 2.6, PZ - p - 0.03], [PI / 2, 0, 0], 20);
      b.label(
        0.55,
        0.35,
        chalk(
          'gb_notice',
          [
            ['WASH', 'bold 54px Arial, sans-serif', '#ffffff', 80],
            ['YOUR', 'bold 54px Arial, sans-serif', '#ffffff', 70],
            ['HANDS', 'bold 54px Arial, sans-serif', '#ffffff', 70]
          ],
          256,
          256
        ),
        [XM + 0.17, 1.7, -2.4],
        [0, PI / 2, 0]
      );
      // lockers on the staff toilet wall
      for (let i = 0; i < 3; i++) {
        const lx = 3.0 + i * 0.42;
        b.box(
          0.4,
          1.8,
          0.45,
          K.paintSteel ? K.paintSteel(0x1e4a8a, {m: 0.4, r: 0.4}) : navy,
          [lx, 0.9, WZ1 + p + 0.25],
          null,
          0.01
        );
        b.vents(4, 0.24, 0.12, dark, [lx, 1.55, WZ1 + p + 0.48]);
      }
      S(2.78, 4.06, WZ1 + p, WZ1 + p + 0.5, 0, 1.8);
    }

    /* ---------- Get Baked staff toilet: WC, basin, mirror ---------- */
    wc(XM + 0.6, Z0 + 0.45, 0);
    S(XM + 0.3, XM + 0.9, Z0 + 0.15, Z0 + 0.85, 0, 0.8, true);
    b.box(0.5, 0.15, 0.4, por, [1.8, 0.82, Z0 + 0.4], null, 0.04);
    b.cyl(0.04, 0.05, 0.7, por, [1.8, 0.4, Z0 + 0.35], null, 12);
    b.box(0.5, 0.6, 0.02, K.mat(0xcfe0e8, 0.05, 0.9), [1.8, 1.5, Z0 + 0.17], null, 0);
    S(1.55, 2.05, Z0 + 0.15, Z0 + 0.6, 0, 0.95, true);
    b.cyl(0.2, 0.17, 0.3, K.mat(0xe8b020, 0.5), [XM + 0.5, 0.17, WZ1 - 0.5], null, 14); // mop bucket
    b.cyl(0.012, 0.012, 1.2, K.mat(0x8a6a4a, 0.6), [XM + 0.55, 0.75, WZ1 - 0.5], [0.15, 0, 0.1], 6);

    /* ---------- sidewalk: street lights, meter, hydrant, no parking ---------- */
    LK.lightPole(b, S, -6);
    LK.lightPole(b, S, 6.8);
    LK.hydrant(b, S, 8.6);
    LK.meter(b, S, -0.4);
    LK.noParking(b, 3.4, {key: 'dg_np1'});

    return (CACHE = G.done());
  }

  function bDailyGrind(x, z, t) {
    const B = mk(x, z, 20, 36, H, 0x8a4a34, 0x6a7a6a, 0x2a2c30);
    B.dx = 0;
    const PT = {th: 0.14, c: 0xe8e2d4};
    const cp = a => a.map(o => Object.assign({}, o));
    WL(B, 1, Z1, X0, X1, cp(FRONT_DG.concat(FRONT_GB)), H);
    WL(B, 1, Z0, X0, X1, cp(BACK_DG.concat(BACK_GB)), H);
    WL(B, 0, X0, Z0, Z1, cp(LEFT), H);
    WL(B, 0, X1, Z0, Z1, cp(RIGHT), H);
    WL(B, 0, XM, Z0, Z1, [], H, {th: 0.3}); // party wall: two separate shops
    // Daily Grind customer toilet
    WL(B, 1, TZ, TX, XM, cp(WC_DG_F), H, PT);
    WL(B, 0, TX, Z0, TZ, [], H, PT);
    // Get Baked: shop / kitchen partition, staff toilet
    WL(B, 1, PZ, XM, X1, cp(PART_GB), H, PT);
    WL(B, 1, WZ1, XM, WX1, [], H, PT);
    WL(B, 0, WX1, Z0, WZ1, cp(WC_GB_S), H, PT);
    LK.attach(B, build());
    // the Get Baked delivery van, backed up to the bakery's back door (cab out to the alley)
    try {
      if (window.MFZV) {
        const vx = 5.2,
          vz = Z0 - 4.6;
        const g = MFZV.make('van', WX(B, vx), WZ(B, vz), PI + (B.cs < 0 ? PI : 0), {
          label: 'GET BAKED',
          labelCol: '#1e5ab8',
          tint: [0.94, 0.94, 0.92],
          dust: true
        });
        const h = g && g.userData && g.userData.half;
        const hx = h ? h[0] : 1.1,
          hz = h ? h[1] : 2.6;
        B.occ.push([vx - hx, vx + hx, vz - hz, vz + hz]);
      }
    } catch (e) {}
    const SP = LK.spawner(B, 'dg_bar');
    // Daily Grind: back bar (fridge, two counter units, the filter brewer), the till, the retail shelf of bean tins, the toilet cabinet
    SP(-8.4, Z0 + 0.47, 'fridge_modern', 'dg_bar', 0);
    SP(-7.15, Z0 + 0.35, 'kitchen_counter', 'dg_bar', 0);
    SP(-5.55, Z0 + 0.35, 'kitchen_counter', 'dg_bar', 0);
    SP(-5.3, Z0 + 0.35, 'coffee_maker', 'coffee', 0, 0.92);
    SP(-5.6, -3.25, 'cash_register', 'coffee', 0, 1.03);
    SP(XM - 0.45, 0.9, 'shop_shelf_wall', 'dg_bar', -PI / 2);
    SP(TX + 0.4, -4.7, 'medicine_cabinet', 'dg_wc', PI / 2);
    // Get Baked shop: the till, the hot drinks machine, the drinks cooler
    SP(5.85, 5.0, 'cash_register', 'bakery', 0, 0.97);
    SP(5.2, PZ + 0.38, 'coffee_maker', 'coffee', 0, 0.94);
    SP(X1 - 0.55, 5.9, 'drinks_cooler', 'convenience', -PI / 2);
    // Get Baked kitchen: prep tables, sink, fridge, freezer, wall shelf, boxes; staff toilet cabinet
    SP(4.6, -0.15, 'prep_table', 'gb_kitchen', 0);
    SP(4.6, -2.3, 'prep_table', 'gb_kitchen', 0);
    SP(XM + 0.5, -1.5, 'kitchen_sink', 'gb_kitchen', PI / 2);
    SP(XM + 0.5, -0.1, 'fridge_modern', 'gb_kitchen', PI / 2);
    SP(XM + 0.5, 0.85, 'freezer_upright', 'gb_kitchen', PI / 2);
    SP(3.5, Z0 + 0.45, 'shop_shelf_wall', 'gb_kitchen', 0);
    SP(X1 - 0.5, -3.85, 'cardboard_box_medium', 'gb_kitchen', 0.3); // v089: clear of the moved ovens
    SP(6.3, -4.4, 'cardboard_box_small', 'gb_kitchen', -0.4); // v089: off the back door
    SP(XM + 0.35, -5.6, 'medicine_cabinet', 'gb_staff', PI / 2);
    // back yard: the cafe's dumpster
    SP(-3.2, Z0 - 2.4, 'dumpster_green', 'storage', PI);
    return LK.finish(B, t, {
      at: [(X0 + X1) / 2, (Z0 + Z1) / 2],
      w: X1 - X0,
      d: Z1 - Z0,
      loot: ['dg_bar', [-8, -4.6, -6.2, -3.8], 1],
      zombies: [
        [-6.2, 2.0],
        [-3.0, 5.5],
        [-6.5, -4.8],
        [-1.6, -5.2],
        [3.2, 6.6],
        [5.0, 0.5],
        [2.2, -2.2],
        [6.8, -5.4],
        [-5.0, -12.5],
        [3.0, -15.0]
      ]
    });
  }

  const e = LK.register({
    id: 'cuppa_joe',
    name: 'Daily Grind & Get Baked',
    build: bDailyGrind,
    note: 'half plot split into two shops: Daily Grind coffee cafe (patio, seating, coffee bar, customer toilet) and Get Baked bakery (front shop, kitchen, staff toilet, delivery van)',
    globals: {bDailyGrind, DAILYGRIND: {build}}
  });
  if (e) e.loot = 'dg_bar';
  console.log('[dailygrind] Daily Grind & Get Baked ready');
})();
