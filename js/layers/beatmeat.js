/* ==========================================================================================================
   MINI FORT ZOMBIE - BEAT THE MEAT / SOYLENT GREENS (v089): one half plot (20 x 36 m, front = +Z) holding TWO butchers, our own design.
   Replaces the Gein's Butcheria placeholder (core NEWCAT id geins_butcheria, half pool).
   One 18 x 15.5 m block split down the middle by a solid party wall (x = 0). The two shops are mirror images in plan, each with its own
   front door, back door, shopfront, awning and fascia.
   LEFT - BEAT THE MEAT BUTCHERS: red shopfront over white tile, a red / white striped awning, a cream-on-red fascia, a fibreglass butcher
   in a boater and striped apron on the pavement, an A-board. Inside: red quarry tile, white tile walls with a red band, cuts posters,
   a small waiting area (bench, baskets) in front of the lit meat case and till, hams and sausages on the rail behind; through the staff
   door, the kitchen (butcher's block, band saw, mincer, slicer, prep tables, sink, knife rack), a staff toilet, and across the back the
   freezer store (sides of beef on rails, chest and upright freezers, racking).
   RIGHT - SOYLENT GREENS VEGAN BUTCHERS: white subway tile with black lettering, a green / white striped awning, a FRIENDS NOT FOOD
   mural of farm animals, kraft paper roll, a wooden counter with a lit case of plant-based cuts and the till, a waiting bench. Kitchen:
   prep tables, steamer pots, food processor, slicer on a block, sink; staff toilet; the freezer store (racking of veg crates, tofu tubs,
   seitan logs, nets of cabbages and marrows hanging on the meat rail).
   Behind: a yard open to the alley, ONE delivery van backed up between the two back doors (it serves both), bins, pallets, board fences.
   Structure from core WL (doors / windows work); detail is our own geometry and painted artwork, outside the static merge.
   ========================================================================================================== */
(function () {
  'use strict';
  const K = window.MFZK,
    LK = window.LOTKIT;
  if (!K || !LK || typeof WL !== 'function' || typeof NEWCAT === 'undefined') {
    console.warn('[beatmeat] core / prop kit missing');
    return;
  }
  const T = THREE,
    P = K.P,
    PI = Math.PI;
  // the block (half plot: x -10..10), the party wall, heights
  const X0 = -9,
    X1 = 9,
    XM = 0, // party wall: Beat The Meat to the left (-x), Soylent Greens to the right (+x)
    Z0 = -7.5,
    Z1 = 8,
    H = 4.4,
    CEIL = 3.2, // drop ceilings in both shops
    FAS = 3.0; // underside of the fascias
  // each shop in "u" = distance from the party wall (0..9); world x = s * u, s = -1 (Beat The Meat) or +1 (Soylent Greens)
  const PZ = 2.6, // shop / kitchen partition
    KZ = -2.6, // kitchen / freezer store partition
    TU = 2.3, // staff toilet: u 0..TU
    TZ = -0.3, // staff toilet: z KZ..TZ
    CZ = 4.75, // the counter's centre line (v090: was 4.4, which left 0.6 m behind it: staff could not get past the back counter)
    CU0 = 2.3, // counter runs u CU0..CU1 (the gap by the party wall leads to the staff door)
    CU1 = 8.6;
  const U_FRONT = [
    {k: 'w', c: 7.6},
    {k: 'w', c: 6.0},
    {k: 'd', c: 4.3},
    {k: 'w', c: 2.6},
    {k: 'w', c: 1.0}
  ];
  const U_BACK = [{k: 'd', c: 2.6, s: -1}];
  const SIDE = [
    {k: 'w', c: 0.0},
    {k: 'w', c: 6.2}
  ];
  const U_PART = [{k: 'd', c: 1.15}]; // shop / kitchen (staff door)
  const U_KPART = [{k: 'd', c: 7.4}]; // kitchen / freezer store
  const U_WC = [{k: 'd', c: 1.15}]; // staff toilet front wall (z = TZ)
  // u-ops -> world ops for one side, sorted along +x
  const opsU = (ops, s) => ops.map(o => Object.assign({}, o, {c: s * o.c})).sort((p, q) => p.c - q.c);
  const FRONT = opsU(U_FRONT, -1).concat(opsU(U_FRONT, 1));
  const BACK = opsU(U_BACK, -1).concat(opsU(U_BACK, 1));

  /* ===================== loot tables ===================== */
  const TABLES = ['btm_freezer', 'btm_kitchen', 'sg_shop', 'sg_kitchen', 'sg_freezer', 'bmz_wc'];
  try {
    Object.assign(LOOT_TABLES, {
      // Beat The Meat freezer store: the good stuff
      btm_freezer: {
        bacon: 4,
        sausages: 4,
        salami: 3,
        smoked_ham: 3,
        apollo_meat: 3,
        slaab_steak: 3,
        lamburger: 2,
        salted_bacon: 2
      },
      // Beat The Meat kitchen: knives, cured meats, odds
      btm_kitchen: {
        butcher_knife: 3,
        salami: 2,
        sausages: 2,
        pickles: 1,
        pickled_eggs: 1,
        rope: 1,
        duct_tape: 1,
        water_jug: 1
      },
      // Soylent Greens shop case and shelves
      sg_shop: {
        soylent_greens: 5,
        salad: 3,
        atomic_veggies: 3,
        natural_living: 2,
        granola: 2,
        brans: 2,
        pickles: 1
      },
      // Soylent Greens kitchen: dry stores and a knife
      sg_kitchen: {
        rice: 3,
        soylent_greens: 2,
        pickles: 2,
        peach_preserves: 1,
        cherry_preserves: 1,
        sugar: 2,
        granola: 1,
        butcher_knife: 1,
        water_jug: 1
      },
      // Soylent Greens freezer store
      sg_freezer: {soylent_greens: 4, atomic_veggies: 3, salad: 2, natural_living: 2, rice: 2, brans: 1},
      // both staff toilets: the first-aid box
      bmz_wc: {painkiller: 2, gauze: 2, cotton_balls: 1, medical_tape: 1, hairspray: 1}
    });
    for (const tn of TABLES)
      for (const id in LOOT_TABLES[tn])
        if (!ITEMS[id]) {
          console.error('[beatmeat] loot table ' + tn + ' has unknown item ' + id);
          delete LOOT_TABLES[tn][id];
        }
    if (typeof LOOT_PROP !== 'undefined')
      for (const tn of TABLES) LOOT_PROP[tn] = tn === 'bmz_wc' ? 'cabinet' : 'fridge';
    const A = window.MFZPROP && MFZPROP.auto;
    if (A) {
      const pick = (...ts) => [...new Set(ts.flatMap(t => A[t] || []))];
      A.btm_freezer = pick('butcher', 'supermarket');
      A.btm_kitchen = pick('butcher', 'house');
      A.sg_shop = pick('supermarket', 'convenience');
      A.sg_kitchen = pick('house', 'bakery');
      A.sg_freezer = pick('supermarket', 'butcher');
      A.bmz_wc = pick('house', 'clinic');
    }
  } catch (e) {
    console.warn('[beatmeat] loot tables', e);
  }

  /* ===================== artwork ===================== */
  const RED = '#b01c22',
    CREAM = '#f4e6c0',
    GREEN = '#1f6a3a',
    INK = '#18191b',
    SERIF = 'Georgia, "Times New Roman", serif',
    SANS = 'Arial, Helvetica, sans-serif',
    IMPACT = 'Impact, "Arial Black", sans-serif';
  // a meat cleaver, blade up-left, handle down-right
  function drawCleaver(c, x, y, s, a, col) {
    c.save();
    c.translate(x, y);
    c.rotate(a);
    c.scale(s, s);
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(-40, -22);
    c.lineTo(14, -22);
    c.lineTo(14, 14);
    c.lineTo(-36, 14);
    c.quadraticCurveTo(-44, 0, -40, -22);
    c.fill();
    c.clearRect(-30, -14, 7, 7);
    c.fillRect(14, -6, 40, 10);
    c.restore();
  }
  // a plump leaf: the Soylent Greens mark
  function drawLeaf(c, x, y, s, col) {
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(0, 40);
    c.bezierCurveTo(-46, 10, -30, -36, 0, -46);
    c.bezierCurveTo(30, -36, 46, 10, 0, 40);
    c.fill();
    c.strokeStyle = '#ffffff';
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(0, 46);
    c.lineTo(0, -34);
    for (const k of [-1, 1])
      for (const yy of [-14, 6, 24]) {
        c.moveTo(0, yy);
        c.lineTo(k * 18, yy - 14);
      }
    c.stroke();
    c.restore();
  }
  const btmFascia = () =>
    K.paint('btm_fascia', 1024, 192, (c, W, H) => {
      c.fillStyle = RED;
      c.fillRect(0, 0, W, H);
      c.strokeStyle = CREAM;
      c.lineWidth = 5;
      c.strokeRect(10, 10, W - 20, H - 20);
      c.fillStyle = CREAM;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.font = 'bold 92px ' + SERIF;
      c.fillText('BEAT THE MEAT', W / 2, 74);
      c.font = 'bold 40px ' + SANS;
      c.fillText('B U T C H E R S', W / 2, 146);
      drawCleaver(c, 92, 96, 1.0, -0.5, CREAM);
      drawCleaver(c, W - 92, 96, 1.0, PI + 0.5, CREAM);
    });
  const sgFascia = () =>
    K.paint(
      'sg_fascia',
      1024,
      192,
      (c, W, H) => {
        c.fillStyle = INK;
        c.fillRect(0, 0, W, H);
        c.fillStyle = '#ffffff';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.font = 'bold 86px ' + IMPACT;
        c.fillText('SOYLENT GREENS', W / 2 + 40, 70);
        c.fillStyle = '#7ad07a';
        c.font = 'bold 40px ' + SANS;
        c.fillText("VEGAN BUTCHERS · IT'S NOT PEOPLE", W / 2 + 40, 146);
        drawLeaf(c, 92, 96, 1.4, '#3a9a4a');
      },
      {glow: 0.35}
    );
  // awning cloth: wide stripes
  const stripes = (key, a, bcol) =>
    K.paint(key, 256, 64, (c, W, H) => {
      for (let i = 0; i < 8; i++) {
        c.fillStyle = i % 2 ? bcol : a;
        c.fillRect((i * W) / 8, 0, W / 8, H);
      }
    });
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
  // clear window lettering (gold or white), lines of [text, font, colour, y]
  const decal = (key, lines, w, h) =>
    K.paint(
      key,
      w || 512,
      h || 256,
      (c, W, H) => {
        c.clearRect(0, 0, W, H);
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        for (const [t, f, col, y] of lines) {
          c.font = f;
          c.fillStyle = col;
          c.fillText(t, W / 2, y);
        }
      },
      {alpha: true}
    );
  // chalkboard with lines of text: [text, font, colour, dy]
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
  // the fibreglass butcher's striped apron
  const apron = (key, col) =>
    K.paint(key, 128, 128, (c, W, H) => {
      c.fillStyle = '#f4f2ec';
      c.fillRect(0, 0, W, H);
      c.fillStyle = col;
      for (let i = 0; i < 8; i++) c.fillRect(i * 16 + 4, 0, 7, H);
    });

  /* ===================== surfaces ===================== */
  const SURF = {};
  const surf = k =>
    SURF[k] ||
    (SURF[k] = {
      asphalt: () => K.surf('asphalt', 0x3a3c40),
      concrete: () => K.surf('concrete', 0xb4b0a6),
      fence: () => K.surf('wood', 0x6a5444),
      // dark red-brown brick, stretcher bond
      brick: () =>
        K.tri(
          'bm_brick',
          (c, W, H, r) => {
            c.fillStyle = '#8e867c';
            c.fillRect(0, 0, W, H);
            const rows = 16,
              bh = H / rows,
              bw = W / 4;
            for (let j = 0; j < rows; j++)
              for (let i = -1; i < 5; i++) {
                const x = i * bw + (j % 2 ? bw / 2 : 0);
                c.fillStyle = `hsl(${6 + r() * 12},${32 + r() * 16}%,${28 + r() * 12}%)`;
                c.fillRect(x + 2, j * bh + 2, bw - 4, bh - 4);
              }
            P.noise(c, W, H, r, 6000, 0.15, '#2a1a10', 1.3);
            P.grime(c, W, H, r, 0.35);
          },
          {tile: 1.2, r: 0.9}
        ),
      // glossy white wall tile (small squares)
      tile: () =>
        K.tri(
          'bm_tile',
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
      // white subway tile (bevelled bricks)
      subway: () =>
        K.tri(
          'sg_subway',
          (c, W, H) => {
            c.fillStyle = '#c8cac8';
            c.fillRect(0, 0, W, H);
            const rows = 16,
              bh = H / rows,
              bw = W / 4;
            for (let j = 0; j < rows; j++)
              for (let i = -1; i < 5; i++) {
                c.fillStyle = '#f8f8f6';
                c.fillRect(i * bw + (j % 2 ? bw / 2 : 0) + 2, j * bh + 2, bw - 4, bh - 4);
              }
          },
          {tile: 1.0, r: 0.2}
        ),
      redP: () => K.mat(0xb01c22, 0.45),
      blackP: () => K.mat(0x18191b, 0.5),
      coping: () => K.mat(0xc8c2b4, 0.7),
      alu: () => K.mat(0x22252a, 0.4, 0.6)
    }[k]());

  /* ===================== geometry ===================== */
  let CACHE = null;
  function build() {
    if (CACHE) return CACHE;
    const G = LK.geo('beatmeat'),
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
      tileM = surf('tile'),
      sub = surf('subway'),
      redP = surf('redP'),
      blackP = surf('blackP'),
      cop = surf('coping'),
      alu = surf('alu'),
      dark = K.mat(0x1c1c1e, 0.5),
      steel = K.mat(0x9a9ea2, 0.4, 0.7),
      white = K.mat(0xf2f2ee, 0.6),
      creamM = K.mat(0xf0e4c4, 0.6),
      greenM = K.mat(0x1f6a3a, 0.55),
      leaf = K.mat(0x3e6a2e, 0.85),
      leaf2 = K.mat(0x557f38, 0.85),
      soil = K.mat(0x3a2a1c, 0.95),
      warm = K.mat(0xfff2c8, 0.4, 0, {emissive: 0xffd890, emissiveIntensity: 1.3}),
      lit = K.mat(0xffffff, 0.4, 0, {emissive: 0xf6f8ff, emissiveIntensity: 0.95});
    const rb = (w, h, d, r, m, p, rot) => b.rbox(w, h, d, r, m, p, rot, 1);

    /* ---------- exterior skin: brick all round; Beat The Meat front red over white tile, Soylent Greens white subway tile ---------- */
    const skin = (ax, f, a0, a1, n, ops, low, riser) => {
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
          put(y0, Math.min(y1, 0.9), riser || low);
          put(Math.max(y0, 0.9), Math.min(y1, FAS), low);
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
    skin(1, Z1, X0 - 0.15, XM, 1, opsU(U_FRONT, -1), redP, tileM);
    skin(1, Z1, XM, X1 + 0.15, 1, opsU(U_FRONT, 1), sub, blackP);
    skin(0, X0, Z0, Z1, -1, SIDE);
    skin(0, X1, Z0, Z1, 1, SIDE);
    skin(1, Z0, X0 - 0.15, X1 + 0.15, -1, BACK);
    b.box(0.5, FAS, 0.12, brk, [XM, FAS / 2, Z1 + 0.22], null, 0.01); // brick pier between the shopfronts
    // window frames: red timber on Beat The Meat, slim black on Soylent Greens; side windows in plain frames
    for (const s of [-1, 1]) {
      const fm = s < 0 ? redP : blackP;
      for (const w of opsU(U_FRONT, s)) {
        if (w.k === 'w') {
          b.box(1.66, 0.08, 0.2, s < 0 ? white : blackP, [w.c, 0.9, Z1 + 0.24], null, 0.01);
          b.frame(1.56, 1.9, 0.08, fm, [w.c, 1.825, Z1 + 0.19], 0.06);
          if (s < 0) b.box(1.4, 0.04, 0.04, fm, [w.c, 2.3, Z1 + 0.2], null, 0); // transom bar
        } else b.frame(1.42, 2.5, 0.1, fm, [w.c, 1.25, Z1 + 0.19], 0.07);
      }
    }
    for (const [fx, nx] of [
      [X0, -1],
      [X1, 1]
    ])
      for (const w of SIDE) {
        b.box(0.16, 0.07, 1.62, cop, [fx + nx * 0.22, 0.9, w.c], null, 0.01);
        b.push([fx + nx * 0.19, 1.825, w.c], [0, PI / 2, 0]);
        b.frame(1.56, 1.9, 0.07, alu, [0, 0, 0], 0.06);
        b.pop();
      }

    /* ---------- fascias and striped awnings ---------- */
    const fw = XM - X0 - 0.4;
    for (const s of [-1, 1]) {
      const cx = s * 4.5,
        bm = s < 0;
      rb(fw + 0.1, 0.8, 0.26, 0.02, bm ? redP : blackP, [cx, FAS + 0.42, Z1 + 0.28]);
      b.label(fw - 0.2, (fw - 0.2) * (192 / 1024), bm ? btmFascia() : sgFascia(), [cx, FAS + 0.42, Z1 + 0.415]);
      b.box(fw + 0.3, 0.1, 0.4, bm ? creamM : blackP, [cx, FAS + 0.86, Z1 + 0.3], null, 0.01); // cornice
      // awning: sloped striped cloth on steel arms, a scalloped valance along the front
      const AW = fw - 0.2,
        AD = 1.5,
        drop = 0.62,
        ang = Math.atan2(drop, AD),
        len = Math.hypot(drop, AD),
        cloth = bm ? stripes('btm_awn', '#b01c22', '#f4f2ec') : stripes('sg_awn', '#1f6a3a', '#f4f2ec');
      b.box(AW, 0.03, len, cloth, [cx, FAS - 0.12 - drop / 2, Z1 + 0.3 + AD / 2], [ang, 0, 0], 0);
      b.box(AW, 0.26, 0.02, cloth, [cx, FAS - 0.12 - drop - 0.13, Z1 + 0.3 + AD], null, 0);
      b.box(AW + 0.04, 0.08, 0.1, bm ? redP : greenM, [cx, FAS - 0.08, Z1 + 0.3], null, 0.01); // roller box
      for (const ax of [-AW / 2 + 0.2, 0, AW / 2 - 0.2])
        b.cyl(0.015, 0.015, len, steel, [cx + ax, FAS - 0.16 - drop / 2, Z1 + 0.3 + AD / 2], [PI / 2 + ang, 0, 0], 6);
      // gooseneck lamps over the fascia
      // v090: raised clear of the cornice (their arms grew out of it and the heads sat on top of the sign)
      for (const lx of [-2.6, 0, 2.6]) {
        b.box(0.1, 0.16, 0.04, dark, [cx + lx, FAS + 1.2, Z1 + 0.19], null, 0.005);
        b.cyl(0.012, 0.012, 0.5, dark, [cx + lx, FAS + 1.33, Z1 + 0.42], [PI / 3, 0, 0], 6);
        b.cyl(0.1, 0.05, 0.1, dark, [cx + lx, FAS + 1.43, Z1 + 0.65], [0.4, 0, 0], 10);
        b.cyl(0.08, 0.08, 0.01, warm, [cx + lx, FAS + 1.38, Z1 + 0.67], [0.4, 0, 0], 10);
      }
    }
    // window lettering
    for (const [x, key, lines] of [
      [
        -7.6,
        'btm_w1',
        [
          ['QUALITY', 'bold 70px ' + SERIF, '#e8c460', 80],
          ['MEATS', 'bold 70px ' + SERIF, '#e8c460', 160]
        ]
      ],
      [
        -6.0,
        'btm_w2',
        [
          ['FRESH', 'bold 60px ' + SERIF, '#ffffff', 70],
          ['CUT DAILY', 'bold 60px ' + SERIF, '#ffffff', 150],
          ['EST. 1972', 'italic 32px ' + SERIF, '#e8c460', 215]
        ]
      ],
      [
        -2.6,
        'btm_w3',
        [
          ['BBQ PACKS', 'bold 62px ' + IMPACT, '#ffffff', 80],
          ['£12.99', 'bold 80px ' + IMPACT, '#ffd23a', 170]
        ]
      ],
      [
        -1.0,
        'btm_w4',
        [
          ['HOT & COLD', 'bold 54px ' + IMPACT, '#ffffff', 80],
          ['STEAK ROLLS', 'bold 54px ' + IMPACT, '#ffffff', 150]
        ]
      ],
      [
        1.0,
        'sg_w1',
        [
          ['100%', 'bold 80px ' + IMPACT, '#7ad07a', 90],
          ['PLANTS', 'bold 64px ' + IMPACT, '#ffffff', 170]
        ]
      ],
      [
        2.6,
        'sg_w2',
        [
          ['NO BULL', 'bold 64px ' + IMPACT, '#ffffff', 90],
          ['BURGERS', 'bold 64px ' + IMPACT, '#7ad07a', 170]
        ]
      ],
      [
        6.0,
        'sg_w3',
        [
          ['TOFU · SEITAN', 'bold 46px ' + SANS, '#ffffff', 90],
          ['JACKFRUIT', 'bold 46px ' + SANS, '#ffffff', 150],
          ['TEMPEH', 'bold 46px ' + SANS, '#7ad07a', 210]
        ]
      ],
      [
        7.6,
        'sg_w4',
        [
          ['MEAT', 'bold 64px ' + IMPACT, '#ffffff', 80],
          ['WITHOUT', 'bold 48px ' + IMPACT, '#7ad07a', 140],
          ['THE MOO', 'bold 64px ' + IMPACT, '#ffffff', 205]
        ]
      ]
    ])
      b.label(1.3, 0.65, decal(key, lines), [x, 1.6, Z1 + 0.235]);
    // door push signs
    b.label(0.3, 0.1, strapMat('btm_open', 'OPEN', 'bold 44px ' + SANS, RED, '#ffffff', 256, 80), [
      -4.3,
      1.55,
      Z1 + 0.23
    ]);
    b.label(0.3, 0.1, strapMat('sg_open', 'OPEN', 'bold 44px ' + SANS, GREEN, '#ffffff', 256, 80), [
      4.3,
      1.55,
      Z1 + 0.23
    ]);

    /* ---------- parapet, flat roof, extract fans, the freezer condensers ---------- */
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
    b.box(X1 - X0 + 0.3, 0.14, 0.08, cop, [0, H - 0.2, Z1 + 0.19], null, 0.01);
    b.box(X1 - X0, 0.12, Z1 - Z0, K.surf('concrete', 0x5a5a58), [0, H + 0.02, (Z0 + Z1) / 2], null, 0);
    b.box(X1 - X0 - 0.3, 0.02, Z1 - Z0 - 0.3, K.mat(0x3a3c40, 0.9), [0, H + 0.09, (Z0 + Z1) / 2], null, 0);
    for (const s of [-1, 1]) {
      // freezer condenser over each store, an extract fan over each kitchen
      const hx = s * 5.5,
        hz = -5.2;
      rb(1.8, 0.9, 1.0, 0.03, K.mat(0xb0b4b8, 0.4, 0.7), [hx, H + 0.55, hz]);
      for (const k of [-0.45, 0.45]) {
        b.cyl(0.36, 0.36, 0.04, dark, [hx + k, H + 1.02, hz], null, 18);
        b.tor(0.36, 0.02, steel, [hx + k, H + 1.04, hz], [PI / 2, 0, 0], PI * 2, 18);
      }
      b.box(0.7, 0.5, 0.7, K.mat(0x8a8e92, 0.4, 0.6), [s * 3.4, H + 0.35, 0.2], null, 0.02);
      b.cyl(0.25, 0.25, 0.06, dark, [s * 3.4, H + 0.62, 0.2], null, 14);
      b.cyl(0.07, 0.07, 0.7, K.mat(0x7a7c7e, 0.4, 0.7), [s * 1.4, H + 0.45, -1.4], null, 10);
    }

    /* ---------- Beat The Meat pavement: the fibreglass butcher, an A-board, a planter ---------- */
    {
      const bx = -7.4,
        bz = Z1 + 1.9;
      const skinM = K.mat(0xe8b898, 0.5),
        shirt = K.mat(0xf4f4f0, 0.5),
        trous = K.mat(0x23345a, 0.5),
        ap = apron('btm_apron', '#b01c22'),
        straw = K.mat(0xe0c070, 0.7),
        shoe = K.mat(0x1a1a1a, 0.4);
      b.box(1.0, 0.06, 0.7, K.mat(0x2a4a9a, 0.5), [bx, 0.03, bz], null, 0.02); // base
      for (const lx of [-0.15, 0.15]) {
        b.cyl(0.1, 0.09, 0.85, trous, [bx + lx, 0.5, bz], null, 10);
        b.box(0.18, 0.08, 0.3, shoe, [bx + lx, 0.1, bz + 0.05], null, 0.03);
      }
      rb(0.56, 0.7, 0.34, 0.12, shirt, [bx, 1.25, bz]); // body
      b.box(0.5, 0.95, 0.02, ap, [bx, 1.05, bz + 0.18], null, 0); // apron front
      b.box(0.1, 0.12, 0.03, K.mat(0x23345a, 0.5), [bx, 1.5, bz + 0.18], null, 0); // tie
      for (const sx of [-1, 1]) {
        // arms on hips
        b.cyl(0.07, 0.07, 0.38, shirt, [bx + sx * 0.38, 1.38, bz], [0, 0, sx * 0.7], 8);
        b.cyl(0.06, 0.06, 0.34, skinM, [bx + sx * 0.4, 1.08, bz + 0.02], [0, 0, -sx * 0.8], 8);
        b.sph(0.065, skinM, [bx + sx * 0.28, 0.98, bz + 0.05], null, 8);
      }
      b.cyl(0.07, 0.08, 0.1, skinM, [bx, 1.65, bz], null, 10);
      b.add(K.sphGeo(0.17, 14, 10), skinM, {p: [bx, 1.86, bz], s: [1, 1.12, 1]});
      b.add(K.sphGeo(0.05, 8, 6), K.mat(0x5a2a1a, 0.6), {p: [bx, 1.8, bz + 0.16], s: [1.6, 0.6, 0.6]}); // moustache
      b.cyl(0.3, 0.3, 0.015, straw, [bx, 2.02, bz], null, 18); // boater brim
      b.cyl(0.17, 0.18, 0.12, straw, [bx, 2.09, bz], null, 18);
      b.cyl(0.182, 0.182, 0.035, K.mat(0xb01c22, 0.5), [bx, 2.07, bz], null, 18);
      S(bx - 0.5, bx + 0.5, bz - 0.35, bz + 0.35, 0, 2.1, true);
    }
    const aboard = (ax, az, key, lines) => {
      for (const sd of [-1, 1]) {
        b.box(0.62, 0.92, 0.03, K.mat(0x1a1a1a, 0.6), [ax, 0.48, az + sd * 0.17], [-sd * 0.18, 0, 0], 0); // v090: tops lean in (was upside down)
        b.label(0.52, 0.78, chalk(key, lines), [ax, 0.5, az + sd * 0.195], [-sd * 0.18, sd < 0 ? PI : 0, 0]);
      }
      S(ax - 0.32, ax + 0.32, az - 0.3, az + 0.3, 0, 0.95, true);
    };
    aboard(-2.2, Z1 + 2.2, 'btm_ab', [
      ['HOT &', 'bold 50px ' + IMPACT, '#ffffff', 70],
      ['COLD', 'bold 50px ' + IMPACT, '#ffffff', 56],
      ['FOOD', 'bold 50px ' + IMPACT, '#ffffff', 56],
      ['steak', 'italic 40px ' + SERIF, '#f2d070', 64],
      ['rolls', 'italic 40px ' + SERIF, '#f2d070', 48],
      ['beat it!', 'italic 30px ' + SERIF, '#e86a6a', 60]
    ]);
    aboard(2.2, Z1 + 2.2, 'sg_ab', [
      ['TRY OUR', 'bold 40px ' + SANS, '#ffffff', 64],
      ['NO-BULL', 'bold 54px ' + IMPACT, '#8ae08a', 66],
      ['BURGER', 'bold 54px ' + IMPACT, '#8ae08a', 58],
      ["it's not", 'italic 34px ' + SERIF, '#ffffff', 74],
      ['people.', 'italic 34px ' + SERIF, '#ffffff', 44],
      ['(promise)', 'italic 24px ' + SERIF, '#f2d070', 44]
    ]);
    // planters: a box hedge by Beat The Meat, herb troughs under the Soylent Greens windows
    const planter = (px, pz, w, m) => {
      b.box(w, 0.5, 0.5, m, [px, 0.25, pz], null, 0.02);
      b.box(w - 0.08, 0.04, 0.42, soil, [px, 0.5, pz], null, 0);
      for (let i = 0; i < Math.round(w / 0.35); i++)
        b.sph(0.2, i % 2 ? leaf : leaf2, [px - w / 2 + 0.2 + i * 0.35, 0.62, pz], null, 8);
      S(px - w / 2, px + w / 2, pz - 0.25, pz + 0.25, 0, 0.6, true);
    };
    planter(-1.0, Z1 + 0.65, 1.4, K.mat(0x3a3c40, 0.6));
    planter(1.8, Z1 + 0.65, 1.6, K.mat(0x1a1a1a, 0.5));
    planter(6.8, Z1 + 0.65, 2.6, K.mat(0x1a1a1a, 0.5));
    // Soylent Greens bike rack with a cargo bike
    for (const rx of [7.0, 7.8, 8.6]) b.tor(0.32, 0.025, steel, [rx, 0.32, Z1 + 2.4], null, PI, 12);
    S(6.6, 9.0, Z1 + 2.3, Z1 + 2.5, 0, 0.7, true);
    b.cyl(0.33, 0.33, 0.04, K.rubber(), [7.8, 0.33, Z1 + 1.9], [0, 0, PI / 2], 16);
    b.cyl(0.33, 0.33, 0.04, K.rubber(), [7.8, 0.33, Z1 + 3.0], [0, 0, PI / 2], 16);
    b.box(0.04, 0.04, 1.1, greenM, [7.8, 0.55, Z1 + 2.45], [0.15, 0, 0], 0);
    b.box(0.4, 0.3, 0.5, K.surf('wood', 0x8a6a40), [7.8, 0.7, Z1 + 3.1], null, 0.01);
    // a bin between the shops
    b.cyl(0.25, 0.22, 0.85, K.mat(0x2a2c30, 0.5, 0.3), [0.2, 0.43, Z1 + 2.6], null, 14);
    S(-0.05, 0.45, Z1 + 2.35, Z1 + 2.85, 0, 0.9, true);

    /* ---------- back yard: door hoods and signs, fences, bins, pallets, the shared delivery spot ---------- */
    for (const s of [-1, 1]) {
      const dx = s * 2.6;
      b.box(1.7, 0.06, 0.8, cop, [dx, 2.75, Z0 - 0.4], null, 0.01);
      b.label(
        1.6,
        0.2,
        strapMat(
          s < 0 ? 'btm_back' : 'sg_back',
          s < 0 ? 'BEAT THE MEAT · DELIVERIES' : 'SOYLENT GREENS · DELIVERIES',
          'bold 30px ' + SANS,
          s < 0 ? RED : GREEN,
          '#ffffff'
        ),
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
    // hatched loading bay between the back doors
    const hatch = K.paint(
      'bm_hatch',
      256,
      256,
      (c, W, H) => {
        c.clearRect(0, 0, W, H);
        c.strokeStyle = '#e8c020';
        c.lineWidth = 10;
        c.strokeRect(6, 6, W - 12, H - 12);
        for (let i = -W; i < W * 2; i += 40) {
          c.beginPath();
          c.moveTo(i, 0);
          c.lineTo(i + H, H);
          c.stroke();
        }
      },
      {alpha: true}
    );
    b.box(3.4, 0.005, 6.2, hatch, [0, 0.03, Z0 - 3.4], null, 0);
    // wheelie bins: red-lidded by the butcher, green by the vegans; an offal bin
    for (const [wx, col] of [
      [-8.9, 0x3a3c40],
      [-8.1, 0x8a1c1c],
      [-7.3, 0x3a3c40],
      [7.3, 0x2a5a2a],
      [8.1, 0x2a5a2a],
      [8.9, 0x3a3c40]
    ]) {
      rb(0.6, 1.0, 0.7, 0.04, K.mat(col, 0.6), [wx, 0.55, Z0 - 0.8]);
      rb(0.64, 0.06, 0.74, 0.02, K.mat(col, 0.5), [wx, 1.08, Z0 - 0.82]);
      for (const sd of [-0.24, 0.24])
        b.cyl(0.08, 0.08, 0.05, K.rubber(), [wx + sd, 0.08, Z0 - 1.12], [0, 0, PI / 2], 10);
      S(wx - 0.31, wx + 0.31, Z0 - 1.2, Z0 - 0.42, 0, 1.1, true);
    }
    b.label(
      0.4,
      0.2,
      strapMat('btm_offal', 'ANIMAL BY-PRODUCTS', 'bold 22px ' + SANS, '#e8c020', '#000', 256, 128),
      [-8.1, 0.75, Z0 - 1.16],
      [0, PI, 0]
    );
    // pallets and veg crates on the vegan side, meat trays on the butcher's
    const pallet = (px, pz, n) => {
      for (let i = 0; i < n; i++)
        b.box(1.2, 0.13, 0.8, K.surf('wood', 0x9a7a52), [px, 0.07 + i * 0.14, pz], null, 0.01);
      S(px - 0.6, px + 0.6, pz - 0.4, pz + 0.4, 0, 0.14 * n, true);
    };
    pallet(5.6, Z0 - 1.0, 3);
    pallet(-5.6, Z0 - 1.0, 2);
    for (let i = 0; i < 4; i++) {
      b.box(0.55, 0.28, 0.4, K.mat(0x2a7a3a, 0.6), [5.4, 0.56 + i * 0.29, Z0 - 1.0], null, 0.01);
      b.sph(0.1, i % 2 ? leaf2 : K.mat(0xc85a20, 0.6), [5.4, 0.78 + i * 0.29, Z0 - 1.0], null, 6);
    }
    for (let i = 0; i < 5; i++)
      b.box(0.6, 0.1, 0.4, K.mat(0xe8e8e4, 0.5), [-5.6, 0.36 + i * 0.11, Z0 - 1.0], null, 0.01);
    S(5.1, 5.7, Z0 - 1.2, Z0 - 0.8, 0, 1.75, true);

    /* ---------- sidewalk: street lights, meter, hydrant, no parking ---------- */
    LK.lightPole(b, S, -5.0);
    LK.lightPole(b, S, 5.0);
    LK.hydrant(b, S, -8.6);
    LK.meter(b, S, -0.9);
    LK.noParking(b, 3.4, {key: 'bm_np1'});
    /* ---------- interior: floors, linings, ceilings, lights (both shops, mirrored) ---------- */
    const por = K.mat(0xf6f6f2, 0.15, 0.05),
      chrome = K.chrome(),
      ss = K.mat(0xc4c8cc, 0.3, 0.85),
      hous = K.mat(0xd8d8d4, 0.5, 0.2),
      skirt = K.mat(0x1e1e20, 0.6),
      cream = K.mat(0xf2ead8, 0.85),
      redB = K.mat(0xa81a20, 0.5);
    const quarry = K.tri(
      'btm_quarry',
      (c, W, H, r) => {
        c.fillStyle = '#4a2a20';
        c.fillRect(0, 0, W, H);
        const n = 4,
          s = W / n;
        for (let j = 0; j < n; j++)
          for (let i = 0; i < n; i++) {
            c.fillStyle = `hsl(${4 + r() * 8},${48 + r() * 10}%,${30 + r() * 8}%)`;
            c.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
          }
      },
      {tile: 0.8, r: 0.6}
    );
    const oak = K.tri(
      'sg_oak',
      (c, W, H, r) => {
        c.fillStyle = '#8a6a44';
        c.fillRect(0, 0, W, H);
        for (let j = 0; j < 8; j++) {
          c.fillStyle = `hsl(32,${30 + r() * 10}%,${42 + r() * 10}%)`;
          c.fillRect(0, (j * H) / 8 + 2, W, H / 8 - 4);
        }
        P.noise(c, W, H, r, 3000, 0.08, '#3a2a18', 1);
      },
      {tile: 1.4, r: 0.55}
    );
    const safety = K.tri(
      'bm_safety',
      (c, W, H, r) => {
        c.fillStyle = '#7a3a2e';
        c.fillRect(0, 0, W, H);
        P.noise(c, W, H, r, 9000, 0.25, '#d8c8b0', 1);
      },
      {tile: 1.2, r: 0.9}
    );
    const sgSafety = K.tri(
      'sg_safety',
      (c, W, H, r) => {
        c.fillStyle = '#5a5e5a';
        c.fillRect(0, 0, W, H);
        P.noise(c, W, H, r, 9000, 0.25, '#c8d0c8', 1);
      },
      {tile: 1.2, r: 0.9}
    );
    const plate = K.tri(
      'bm_plate',
      (c, W, H, r) => {
        c.fillStyle = '#8a8e90';
        c.fillRect(0, 0, W, H);
        c.fillStyle = '#a8acae';
        for (let j = 0; j < 8; j++)
          for (let i = 0; i < 8; i++) {
            c.save();
            c.translate((i + 0.5) * (W / 8), (j + 0.5) * (H / 8));
            c.rotate((i + j) % 2 ? 0.7 : -0.7);
            c.fillRect(-10, -3, 20, 6);
            c.restore();
          }
      },
      {tile: 1.0, r: 0.4, m: 0.6}
    );
    const panel = K.tri(
      'bm_panel',
      (c, W, H) => {
        c.fillStyle = '#eef0ee';
        c.fillRect(0, 0, W, H);
        c.fillStyle = '#c8ccca';
        for (let i = 0; i < 2; i++) c.fillRect((i * W) / 2, 0, 3, H);
      },
      {tile: 1.0, r: 0.4}
    );
    const flr = (x0, x1, z0, z1, m, y) =>
      b.box(x1 - x0, 0.02, z1 - z0, m, [(x0 + x1) / 2, y || 0.035, (z0 + z1) / 2], null, 0);
    // u range -> world x range for side s
    const xr = (s, ua, ub) => (s < 0 ? [-ub, -ua] : [ua, ub]);
    // a lining on a wall whose centre is c, half-thickness half (0.15 for shell / party walls, 0.07 for partitions)
    const lw = (ax, c, a0, a1, n, ops, top, span, half) =>
      LK.lineWall(b, ax, c - n * (0.15 - (half === undefined ? 0.15 : half)), a0, a1, n, ops, top, span);
    const tileSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, Math.min(y1, 2.0), tileM, 0.012, 0.006);
      if (y1 > 2.0) pc(u0, u1, Math.max(y0, 2.0), y1, white, 0.012, 0.006);
    };
    const btmSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, Math.min(y1, 2.0), tileM, 0.012, 0.006);
      if (y1 > 2.0) pc(u0, u1, Math.max(y0, 2.15), y1, cream, 0.012, 0.006);
      if (y0 < 2.15 && y1 > 2.0) pc(u0, u1, 2.0, 2.15, redB, 0.03, 0.015);
      if (y0 <= 0 && y1 > 0.2) pc(u0, u1, 0, 0.12, redB, 0.03, 0.015);
    };
    const sgSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, y1, sub, 0.012, 0.006);
      if (y0 <= 0 && y1 > 0.2) pc(u0, u1, 0, 0.12, skirt, 0.03, 0.015);
    };
    const coldSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, y1, panel, 0.04, 0.02);
      if (y0 <= 0 && y1 > 0.2) pc(u0, u1, 0, 0.3, ss, 0.05, 0.025);
    };
    const IN = 0.16,
      Q = 0.07,
      FZC = 2.9; // freezer store ceiling
    for (const s of [-1, 1]) {
      const bm = s < 0,
        shopSpan = bm ? btmSpan : sgSpan,
        [sx0, sx1] = xr(s, IN, 9 - IN),
        [tx0, tx1] = xr(s, IN, TU - 0.08),
        [kx0, kx1] = xr(s, TU + 0.08, 9 - IN);
      // floors
      flr(sx0, sx1, PZ + 0.08, Z1 - IN, bm ? quarry : oak);
      flr(sx0, sx1, TZ + 0.08, PZ - 0.08, bm ? safety : sgSafety);
      flr(kx0, kx1, KZ + 0.08, TZ + 0.08, bm ? safety : sgSafety);
      flr(tx0, tx1, KZ + 0.08, TZ - 0.08, tileM);
      flr(sx0, sx1, Z0 + IN, KZ - 0.08, plate);
      // linings: front shop
      const [wx0, wx1] = xr(s, 0.15, 9);
      lw(1, Z1, wx0, wx1, -1, opsU(U_FRONT, s), CEIL, shopSpan);
      lw(0, XM, PZ + Q, Z1, s, [], CEIL, shopSpan);
      lw(0, s * 9, PZ + Q, Z1, -s, SIDE, CEIL, shopSpan);
      lw(1, PZ, wx0, wx1, 1, opsU(U_PART, s), CEIL, shopSpan, Q);
      // kitchen
      lw(1, PZ, wx0, wx1, -1, opsU(U_PART, s), CEIL, tileSpan, Q);
      lw(0, XM, TZ + Q, PZ - Q, s, [], CEIL, tileSpan);
      lw(0, s * 9, KZ + Q, PZ - Q, -s, SIDE, CEIL, tileSpan);
      lw(1, KZ, ...xr(s, TU + Q, 9), 1, opsU(U_KPART, s), CEIL, tileSpan, Q);
      lw(1, TZ, ...xr(s, 0.15, TU + Q), 1, opsU(U_WC, s), CEIL, tileSpan, Q);
      lw(0, s * TU, KZ + Q, TZ + Q, s, [], CEIL, tileSpan, Q);
      // staff toilet
      lw(1, TZ, ...xr(s, 0.15, TU - Q), -1, opsU(U_WC, s), 2.7, tileSpan, Q);
      lw(0, s * TU, KZ + Q, TZ - Q, -s, [], 2.7, tileSpan, Q);
      lw(0, XM, KZ + Q, TZ - Q, s, [], 2.7, tileSpan);
      lw(1, KZ, ...xr(s, 0.15, TU - Q), 1, [], 2.7, tileSpan, Q);
      // freezer store: insulated panels
      lw(1, KZ, wx0, wx1, -1, opsU(U_KPART, s), FZC, coldSpan, Q);
      lw(0, XM, Z0, KZ - Q, s, [], FZC, coldSpan);
      lw(0, s * 9, Z0, KZ - Q, -s, [], FZC, coldSpan);
      lw(1, Z0, wx0, wx1, 1, opsU(U_BACK, s), FZC, coldSpan);
      // ceilings
      const cx = s * 4.5;
      b.box(8.7, 0.04, Z1 - KZ - 0.2, K.mat(0xf0efea, 0.9), [cx, CEIL + 0.02, (KZ + Z1) / 2], null, 0);
      b.box(8.7, 0.04, KZ - Z0 - 0.2, panel, [cx, FZC + 0.02, (Z0 + KZ) / 2], null, 0);
      b.box(TU - 0.2, 0.04, TZ - KZ - 0.2, white, [s * (TU / 2), 2.72, (KZ + TZ) / 2], null, 0);
      // lights: troffers in the kitchen, bulkheads in the freezer store, a downlight in the toilet
      for (const lu of [4.2, 7.0])
        for (const lz of [-1.3, 1.3]) {
          b.box(1.3, 0.07, 0.18, hous, [s * lu, CEIL - 0.04, lz], null, 0.01);
          b.box(1.22, 0.012, 0.12, lit, [s * lu, CEIL - 0.08, lz], null, 0);
        }
      for (const lu of [2.5, 6.5]) {
        b.rbox(0.4, 0.1, 0.22, 0.04, K.mat(0x9a9ea2, 0.4, 0.5), [s * lu, FZC - 0.05, -5.0]);
        b.box(0.32, 0.02, 0.15, lit, [s * lu, FZC - 0.11, -5.0], null, 0);
      }
      b.cyl(0.14, 0.14, 0.03, hous, [s * (TU / 2), 2.69, (KZ + TZ) / 2], null, 14);
      b.cyl(0.12, 0.12, 0.01, lit, [s * (TU / 2), 2.675, (KZ + TZ) / 2], null, 14);
      // staff toilet: WC on the back wall, basin + mirror on the side wall, mop bucket
      {
        const wx = s * 0.75,
          wz = KZ + 0.45;
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
        S(wx - 0.3, wx + 0.3, KZ + 0.1, KZ + 0.85, 0, 0.8, true);
        const bxu = s * (TU - 0.35);
        b.box(0.4, 0.15, 0.5, por, [bxu, 0.82, -1.3], null, 0.04);
        b.cyl(0.04, 0.05, 0.7, por, [bxu, 0.4, -1.3], null, 12);
        b.cyl(0.012, 0.012, 0.15, chrome, [bxu + s * 0.12, 0.95, -1.3], null, 8);
        b.box(0.02, 0.6, 0.45, K.mat(0xcfe0e8, 0.05, 0.9), [s * (TU - 0.09), 1.5, -1.3], null, 0);
        S(bxu - 0.25, bxu + 0.25, -1.55, -1.05, 0, 0.95, true);
        b.cyl(0.2, 0.17, 0.3, K.mat(0xe8b020, 0.5), [s * 1.7, 0.17, KZ + 0.45], null, 14);
        b.cyl(0.012, 0.012, 1.2, K.mat(0x8a6a4a, 0.6), [s * 1.75, 0.75, KZ + 0.45], [0.15, 0, 0.1], 6);
        b.label(
          0.4,
          0.4,
          strapMat(bm ? 'btm_wc' : 'sg_wc', 'WC', 'bold 160px ' + SANS, bm ? RED : GREEN, '#ffffff', 256, 256),
          [s * 1.15, 2.6, TZ + Q + 0.02]
        );
      }
      // STAFF ONLY on the shop side of the staff door; PVC strip curtains in both freezer store doorways
      b.label(
        0.7,
        0.16,
        strapMat(bm ? 'btm_staff' : 'sg_staff', 'STAFF ONLY', 'bold 40px ' + SANS, INK, '#ffffff', 512, 112),
        [s * 1.15, 2.55, PZ + Q + 0.02]
      );
      for (const [cu, cz] of [
        [7.4, KZ - Q - 0.03],
        [2.6, Z0 + 0.22]
      ])
        for (let i = 0; i < 7; i++)
          b.box(
            0.18,
            2.3,
            0.006,
            K.glass(0xe8f4f8, 0.35),
            [s * (cu - 0.54 + i * 0.18), 1.2, cz + (i % 2) * 0.012],
            null,
            0
          );
      // freezer store: rail on the ceiling, steel racking down the outer wall, a temperature board
      b.cyl(0.03, 0.03, 5.0, ss, [s * 5.6, 2.7, -4.6], [0, 0, PI / 2], 8);
      for (const ru of [3.1, 8.1]) b.box(0.05, FZC - 2.7, 0.05, ss, [s * ru, (FZC + 2.7) / 2, -4.6], null, 0);
      for (let k = 0; k < 4; k++) b.box(0.6, 0.03, 2.6, ss, [s * 8.45, 0.3 + k * 0.55, -4.4], null, 0);
      for (const pz of [-5.65, -3.15])
        for (const pu of [8.17, 8.73]) b.cyl(0.015, 0.015, 2.1, ss, [s * pu, 1.05, pz], null, 6);
      S(...xr(s, 8.1, 8.85), -5.7, -3.1, 0, 2.1);
      b.box(1.4, 0.45, 0.5, hous, [s * 5.0, FZC - 0.3, Z0 + 0.45], null, 0.02); // evaporator
      b.vents(5, 1.1, 0.3, dark, [s * 5.0, FZC - 0.3, Z0 + 0.71]);
      b.label(
        0.5,
        0.25,
        strapMat(bm ? 'btm_temp' : 'sg_temp', '-18°C', 'bold 64px ' + IMPACT, '#1a1a1a', '#e83a3a', 200, 100),
        [s * 6.6, 2.0, KZ - Q - 0.05],
        [0, PI, 0]
      );
    }

    /* ---------- Beat The Meat shop: the lit meat case + cash wrap, back counter, hams on the rail, cuts posters, waiting bench ---------- */
    const cutsPoster = (key, title, kind) =>
      K.paint(key, 384, 256, (c, W, H) => {
        c.fillStyle = '#f4ecd8';
        c.fillRect(0, 0, W, H);
        c.fillStyle = RED;
        c.font = 'bold 36px ' + IMPACT;
        c.textAlign = 'center';
        c.fillText(title, W / 2, 40);
        c.fillStyle = '#8a1c1c';
        c.beginPath();
        if (kind === 'pig') c.ellipse(W / 2, 150, 120, 62, 0, 0, PI * 2);
        else c.ellipse(W / 2, 145, 130, 55, 0, 0, PI * 2);
        c.fill();
        c.fillRect(W / 2 - 110, 180, 18, 50);
        c.fillRect(W / 2 + 90, 180, 18, 50);
        c.beginPath();
        c.ellipse(W / 2 - 140, 120, 34, 28, -0.3, 0, PI * 2);
        c.fill();
        c.strokeStyle = '#f4ecd8';
        c.lineWidth = 3;
        c.setLineDash([8, 6]);
        for (const dx of [-60, 0, 60]) {
          c.beginPath();
          c.moveTo(W / 2 + dx, 95);
          c.lineTo(W / 2 + dx, 200);
          c.stroke();
        }
        c.setLineDash([]);
        c.fillStyle = '#f4ecd8';
        c.font = 'bold 16px ' + SANS;
        const lab = kind === 'pig' ? ['SHOULDER', 'LOIN', 'BELLY', 'LEG'] : ['CHUCK', 'RIB', 'SIRLOIN', 'RUMP'];
        lab.forEach((t, i) => c.fillText(t, W / 2 - 90 + i * 60, 150));
      });
    {
      const s = -1,
        cw = K.mat(0xf4f0e6, 0.5),
        BU0 = 3.2,
        BU1 = CU1,
        BL = BU1 - BU0,
        BC = s * ((BU0 + BU1) / 2);
      b.push([BC, 0, CZ]);
      b.box(BL, 0.7, 0.95, cw, [0, 0.35, 0], null, 0.01);
      b.box(BL, 0.12, 0.04, redB, [0, 0.55, 0.49], null, 0);
      b.box(BL, 0.06, 1.0, ss, [0, 0.72, 0], null, 0.01);
      b.add(
        K.extrudeGeo(
          [
            [-0.5, 0],
            [0.5, 0],
            [0.5, 0.06],
            [-0.1, 0.62],
            [-0.5, 0.62]
          ],
          BL - 0.1,
          0
        ),
        K.glass(0xdfeff4, 0.25),
        {p: [0, 0.75, 0], r: [0, PI / 2, 0]}
      );
      b.box(
        BL - 0.1,
        0.02,
        0.9,
        K.mat(0xf4f4f0, 0.3, 0, {emissive: 0xffe8d8, emissiveIntensity: 0.3}),
        [0, 0.77, 0],
        null,
        0
      );
      const cuts = [0xb8282a, 0xc84a4a, 0xe8c8b0, 0x9a3a2a, 0xd86a6a, 0x7a2a1a];
      const n = Math.floor((BL - 0.3) / 0.4);
      for (let i = 0; i < n; i++) {
        const x = -BL / 2 + 0.3 + i * 0.4,
          zz = i % 2 ? -0.15 : 0.15;
        b.rbox(0.32, 0.04, 0.24, 0.01, K.mat(0xd8d8d0, 0.4), [x, 0.8, zz]);
        if (i % 4 === 1)
          for (let k = 0; k < 4; k++)
            b.cyl(0.03, 0.03, 0.22, K.mat(0x9a4a2a, 0.45), [x - 0.09 + k * 0.06, 0.84, zz], [PI / 2, 0, 0], 8);
        else if (i % 5 !== 3)
          b.add(K.sphGeo(0.1, 10, 6), K.mat(cuts[i % 6], 0.4), {p: [x, 0.83, zz], s: [1.3, 0.35, 1]});
        if (i % 3 === 0) b.box(0.08, 0.05, 0.005, K.mat(0xffffff, 0.6), [x, 0.86, 0.42], null, 0);
        if (i % 2) b.add(K.sphGeo(0.04, 6, 4), leaf2, {p: [x + 0.12, 0.82, zz], s: [1, 0.4, 1.4]}); // parsley
      }
      b.pop();
      // cash wrap (the register is a loot prop) with a ticket dispenser and a lifted counter flap
      b.box(CU0 + 0.9 - CU0, 1.0, 0.95, cw, [s * (CU0 + 0.45), 0.5, CZ], null, 0.01);
      b.box(0.94, 0.04, 1.0, K.mat(0x3a2a20, 0.4), [s * (CU0 + 0.45), 1.0, CZ], null, 0.01);
      S(...xr(s, CU0, BU1 + 0.05), CZ - 0.5, CZ + 0.5, 0, 1.4);
      b.box(0.02, 0.9, 0.9, cw, [s * (CU0 - 0.05), 1.48, CZ], null, 0.01);
      b.cyl(0.07, 0.07, 0.2, redB, [s * (CU0 + 0.1), 1.12, CZ + 0.42], null, 12);
      b.box(0.08, 0.03, 0.02, white, [s * (CU0 + 0.1), 1.12, CZ + 0.5], null, 0);
      // scale on the case
      b.rbox(0.4, 0.25, 0.3, 0.02, K.mat(0xd8d8d4, 0.4, 0.3), [s * 4.4, 1.5, CZ + 0.05]);
      b.rbox(0.3, 0.04, 0.25, 0.01, ss, [s * 4.4, 1.64, CZ + 0.05]);
      // back counter on the partition: block, slicer, paper roll
      const BKZ = PZ + Q + 0.3;
      b.box(5.4, 0.9, 0.58, ss, [s * 5.6, 0.45, BKZ], null, 0.01);
      b.box(0.9, 0.2, 0.55, K.surf('wood', 0xb08050), [s * 4.0, 1.0, BKZ], null, 0.02);
      b.box(0.04, 0.24, 0.12, K.mat(0x5a3a1a, 0.6), [s * 4.1, 1.15, BKZ], [0, 0, 0.3], 0);
      b.box(0.5, 0.15, 0.4, K.mat(0xd8d8d4, 0.4, 0.3), [s * 6.2, 0.98, BKZ], null, 0.01);
      b.cyl(0.16, 0.16, 0.04, chrome, [s * 6.2, 1.12, BKZ], [0, 0, PI / 2], 20);
      b.cyl(0.08, 0.08, 0.55, K.mat(0xe8dcc0, 0.8), [s * 7.6, 1.0, BKZ], [0, 0, PI / 2], 12);
      S(...xr(s, 2.9, 8.3), PZ + Q, BKZ + 0.3, 0, 1.0, true);
      // the meat rail over the back counter: hams and sausage strings
      b.cyl(0.025, 0.025, 5.6, ss, [s * 5.6, 2.55, BKZ + 0.1], [0, 0, PI / 2], 8);
      const ham = K.mat(0xa84a32, 0.45),
        fat = K.mat(0xe8d8c0, 0.6),
        sau = K.mat(0x8a3a22, 0.4);
      for (let i = 0; i < 8; i++) {
        const hx = s * (3.2 + i * 0.7);
        b.cyl(0.006, 0.006, 0.18, ss, [hx, 2.46, BKZ + 0.1], null, 4);
        if (i % 3 === 2)
          for (let k = 0; k < 5; k++)
            b.add(K.sphGeo(0.045, 8, 6), sau, {p: [hx + (k % 2) * 0.03, 2.3 - k * 0.11, BKZ + 0.1], s: [1, 1.5, 1]});
        else {
          b.add(K.sphGeo(0.16, 12, 8), ham, {p: [hx, 2.1, BKZ + 0.1], s: [0.85, 1.4, 0.75]});
          b.cyl(0.035, 0.02, 0.12, fat, [hx, 2.36, BKZ + 0.1], null, 8);
        }
      }
      // price board and cuts posters
      const price = K.paint('btm_prices', 512, 320, (c, W, H, r) => {
        c.fillStyle = '#1e2a24';
        c.fillRect(0, 0, W, H);
        P.noise(c, W, H, r, 2000, 0.12, '#ffffff', 1.4);
        c.fillStyle = '#fff4dc';
        c.font = '36px ' + IMPACT;
        c.textAlign = 'center';
        c.fillText("TODAY'S CUTS", W / 2, 44);
        [
          ['RUMP STEAK', '£4.99'],
          ['PORK CHOPS', '£2.49'],
          ['LAMB SHANK', '£3.79'],
          ['BANGERS (6)', '£1.99'],
          ['MINCE 500G', '£2.29'],
          ['MYSTERY MEAT', 'ASK!']
        ].forEach(([a, p], i) => {
          c.font = '26px ' + IMPACT;
          c.fillStyle = '#e8e4d8';
          c.textAlign = 'left';
          c.fillText(a, 34, 92 + i * 38);
          c.textAlign = 'right';
          c.fillStyle = '#f2c418';
          c.fillText(p, W - 34, 92 + i * 38);
        });
      });
      b.box(1.5, 0.96, 0.04, K.surf('wood', 0x6a4a2a), [s * 5.6, 3.0 - 0.52, PZ + Q + 0.03], null, 0.01);
      b.label(1.4, 0.88, price, [s * 5.6, 2.48, PZ + Q + 0.055]);
      b.label(1.1, 0.73, cutsPoster('btm_beef', 'BEEF', 'cow'), [-0.17, 2.0, 5.6], [0, PI / 2, 0]);
      b.label(1.1, 0.73, cutsPoster('btm_pork', 'PORK', 'pig'), [-0.17, 2.0, 7.0], [0, PI / 2, 0]);
      // waiting area: bench under the side window, a basket of condiments, a stand of BBQ sauce
      b.box(0.45, 0.06, 1.8, K.surf('wood', 0x7a5232), [-8.55, 0.46, 6.4], null, 0.01);
      for (const lz of [5.6, 7.2]) b.box(0.4, 0.43, 0.06, dark, [-8.55, 0.22, lz], null, 0);
      S(-8.85, -8.3, 5.5, 7.3, 0, 0.5, true);
      for (const [bxx, bzz] of [
        [-2.0, 7.4],
        [-1.2, 7.4]
      ]) {
        b.cyl(0.24, 0.2, 0.22, K.mat(0xb08a50, 0.8), [bxx, 0.71, bzz], null, 12);
        for (let k = 0; k < 5; k++)
          b.cyl(0.03, 0.03, 0.14, K.mat(k % 2 ? 0x8a2a1a : 0xc8a020, 0.4), [bxx - 0.1 + k * 0.05, 0.86, bzz], null, 8);
      }
      b.box(1.4, 0.6, 0.5, K.surf('wood', 0x6a4a2a), [-1.6, 0.3, 7.4], null, 0.01);
      S(-2.3, -0.9, 7.15, 7.65, 0, 0.95, true);
      // fluorescent troffers over the shop
      for (const lu of [2.4, 5.0, 7.4])
        for (const lz of [3.6, 6.4]) {
          b.box(1.3, 0.07, 0.3, hous, [s * lu, CEIL - 0.04, lz], null, 0.01);
          b.box(1.22, 0.012, 0.24, lit, [s * lu, CEIL - 0.08, lz], null, 0);
        }
    }

    /* ---------- Beat The Meat kitchen: butcher's block, band saw, mincer, vacuum packer, knife rack ---------- */
    {
      const s = -1;
      // big end-grain block
      b.box(0.9, 0.8, 0.9, K.surf('wood', 0xa87848), [s * 3.2, 0.4, 1.4], null, 0.03);
      b.box(0.92, 0.06, 0.92, K.surf('wood', 0x8a5a34), [s * 3.2, 0.83, 1.4], null, 0.02);
      b.box(0.04, 0.26, 0.14, K.mat(0x5a3a1a, 0.6), [s * 3.4, 0.98, 1.3], [0, 0, 0.5], 0);
      b.box(0.3, 0.008, 0.2, ss, [s * 3.0, 0.87, 1.5], [0, 0.4, 0], 0);
      S(...xr(s, 2.75, 3.65), 0.95, 1.85, 0, 0.9);
      // band saw against the outer wall
      const bs = K.mat(0x8a9aa4, 0.4, 0.6);
      b.box(0.65, 0.9, 0.7, bs, [s * 8.45, 0.45, -1.7], null, 0.02);
      b.box(0.7, 0.05, 0.75, ss, [s * 8.45, 0.93, -1.7], null, 0.01);
      b.box(0.55, 0.9, 0.4, bs, [s * 8.55, 1.42, -1.7], null, 0.02);
      b.box(0.003, 0.5, 0.012, ss, [s * 8.35, 1.15, -1.7], null, 0);
      S(...xr(s, 8.1, 8.85), -2.1, -1.3, 0, 1.9);
      // back counter on the partition: mincer, vacuum packer, boxes of trays
      b.box(3.6, 0.9, 0.6, ss, [s * 4.6, 0.45, PZ - Q - 0.32], null, 0.01);
      S(...xr(s, 2.8, 6.4), PZ - Q - 0.62, PZ - Q, 0, 0.95, true);
      b.cyl(0.12, 0.14, 0.3, ss, [s * 3.4, 1.05, PZ - 0.42], null, 14); // mincer
      b.cyl(0.08, 0.08, 0.32, ss, [s * 3.4, 1.2, PZ - 0.25], [PI / 2, 0, 0], 12);
      b.cyl(0.12, 0.1, 0.14, ss, [s * 3.4, 1.27, PZ - 0.05], null, 12);
      b.box(0.6, 0.22, 0.45, K.mat(0x3a3c40, 0.4, 0.4), [s * 5.0, 1.01, PZ - 0.42], null, 0.02); // vacuum packer
      b.box(0.5, 0.02, 0.35, K.glass(0xdfeff4, 0.4), [s * 5.0, 1.13, PZ - 0.42], null, 0);
      for (let k = 0; k < 3; k++)
        b.box(0.4, 0.06, 0.3, K.mat(0x2a2a2c, 0.5), [s * 6.0, 0.93 + k * 0.065, PZ - 0.42], null, 0);
      // knife magnet and hooks, a white apron on a peg
      b.box(0.9, 0.05, 0.02, dark, [s * 4.6, 1.75, PZ - Q - 0.02], null, 0);
      for (let k = 0; k < 6; k++) {
        b.box(0.035, 0.22, 0.005, ss, [s * (4.25 + k * 0.14), 1.66, PZ - Q - 0.04], null, 0);
        b.box(0.03, 0.1, 0.02, K.mat(0x1a1a1a, 0.5), [s * (4.25 + k * 0.14), 1.82, PZ - Q - 0.04], null, 0);
      }
      b.box(0.5, 0.9, 0.03, apron('btm_apron2', '#7a1a1a'), [s * 6.9, 1.5, PZ - Q - 0.03], null, 0);
      // a gory smear on the block side and a bucket of offcuts
      b.cyl(0.18, 0.16, 0.3, white, [s * 2.55, 0.15, 0.7], null, 12);
      b.cyl(0.16, 0.16, 0.01, K.mat(0x6a0a0a, 0.3), [s * 2.55, 0.29, 0.7], null, 12);
    }

    /* ---------- Beat The Meat freezer store: sides of beef on the rail, boxed meat on the racking ---------- */
    {
      const s = -1,
        side = K.mat(0xb84a3a, 0.45),
        fat = K.mat(0xeee0c8, 0.6);
      for (let i = 0; i < 6; i++) {
        const hx = s * (3.6 + i * 0.85);
        b.cyl(0.008, 0.008, 0.25, ss, [hx, 2.58, -4.6], null, 4);
        b.add(K.sphGeo(0.28, 12, 10), side, {p: [hx, 1.6, -4.6], s: [0.75, 2.9, 0.48]});
        b.add(K.sphGeo(0.24, 10, 8), fat, {p: [hx + 0.06, 1.66, -4.52], s: [0.6, 2.6, 0.32]});
        b.cyl(0.035, 0.03, 0.22, fat, [hx, 2.42, -4.6], null, 6);
      }
      // v090: no collision on the hanging sides: you push through them (they blocked the way in from the door)
      const boxC = K.surf('cardboard', 0xb38a58),
        tub = K.mat(0xf2f2ee, 0.5);
      for (let k = 0; k < 4; k++)
        for (let j = 0; j < 4; j++)
          if ((k + j) % 3)
            j % 2
              ? b.box(0.45, 0.3, 0.5, boxC, [s * 8.45, 0.47 + k * 0.55, -5.4 + j * 0.62], null, 0.01)
              : b.rbox(0.4, 0.22, 0.45, 0.03, tub, [s * 8.45, 0.43 + k * 0.55, -5.4 + j * 0.62]);
      // a pallet of boxed beef by the back door
      b.box(1.2, 0.13, 0.8, K.surf('wood', 0x9a7a52), [s * 4.4, 0.07, Z0 + 0.7], null, 0.01);
      for (let k = 0; k < 3; k++) b.box(1.1, 0.3, 0.7, boxC, [s * 4.4, 0.29 + k * 0.31, Z0 + 0.7], null, 0.01);
      S(...xr(s, 3.8, 5.0), Z0 + 0.3, Z0 + 1.1, 0, 1.1);
    }

    /* ---------- Soylent Greens shop: wooden counter with the plant-cuts case, slicer on a block, kraft paper, the mural, waiting bench ---------- */
    {
      const s = 1,
        wd = K.surf('wood', 0x8a5a34),
        BU0 = 3.2,
        BU1 = CU1,
        BL = BU1 - BU0,
        BC = s * ((BU0 + BU1) / 2);
      b.push([BC, 0, CZ]);
      b.box(BL, 0.72, 0.95, wd, [0, 0.36, 0], null, 0.01);
      for (let k = 0; k < 10; k++)
        b.box(0.02, 0.6, 0.01, K.mat(0x5a3a1a, 0.6), [-BL / 2 + 0.3 + k * (BL / 10), 0.36, 0.48], null, 0);
      b.box(BL, 0.05, 1.0, K.mat(0x1a1a1a, 0.4), [0, 0.74, 0], null, 0.01);
      b.add(
        K.extrudeGeo(
          [
            [-0.5, 0],
            [0.5, 0],
            [0.5, 0.06],
            [-0.1, 0.62],
            [-0.5, 0.62]
          ],
          BL - 0.1,
          0
        ),
        K.glass(0xdfeff4, 0.25),
        {p: [0, 0.76, 0], r: [0, PI / 2, 0]}
      );
      b.box(
        BL - 0.1,
        0.02,
        0.9,
        K.mat(0xf4f4f0, 0.3, 0, {emissive: 0xe8ffe8, emissiveIntensity: 0.3}),
        [0, 0.78, 0],
        null,
        0
      );
      // plant-based cuts: dark peppered "salami" logs, seitan roasts, tofu blocks, carrot "bacon" strips, green herb sausages
      const n = Math.floor((BL - 0.3) / 0.4);
      for (let i = 0; i < n; i++) {
        const x = -BL / 2 + 0.3 + i * 0.4,
          zz = i % 2 ? -0.15 : 0.15,
          k = i % 5;
        b.rbox(0.32, 0.03, 0.24, 0.01, K.mat(0x2a2a2a, 0.5), [x, 0.8, zz]);
        if (k === 0) {
          b.cyl(0.07, 0.07, 0.26, K.mat(0x3a2a24, 0.6), [x, 0.88, zz], [PI / 2, 0, 0], 12);
          b.cyl(0.069, 0.069, 0.01, K.mat(0xb04a4a, 0.5), [x, 0.88, zz + 0.13], [PI / 2, 0, 0], 12);
        } else if (k === 1) b.add(K.sphGeo(0.11, 10, 6), K.mat(0x9a6a3a, 0.5), {p: [x, 0.85, zz], s: [1.3, 0.55, 0.9]});
        else if (k === 2)
          for (let j = 0; j < 3; j++)
            b.box(0.08, 0.06, 0.16, K.mat(0xf0ead0, 0.6), [x - 0.09 + j * 0.09, 0.85, zz], null, 0.01);
        else if (k === 3)
          for (let j = 0; j < 5; j++)
            b.box(0.26, 0.006, 0.03, K.mat(0xd86a4a, 0.5), [x, 0.83 + j * 0.008, zz - 0.07 + j * 0.035], null, 0);
        else
          for (let j = 0; j < 4; j++)
            b.cyl(0.025, 0.025, 0.2, K.mat(0x6a8a3a, 0.5), [x - 0.08 + j * 0.055, 0.84, zz], [PI / 2, 0, 0], 8);
        if (i % 3 === 0) b.box(0.08, 0.05, 0.005, white, [x, 0.86, 0.42], null, 0);
      }
      b.pop();
      // cash wrap + till stand, counter flap
      b.box(0.9, 1.0, 0.95, wd, [s * (CU0 + 0.45), 0.5, CZ], null, 0.01);
      b.box(0.94, 0.04, 1.0, K.mat(0x1a1a1a, 0.4), [s * (CU0 + 0.45), 1.0, CZ], null, 0.01);
      S(...xr(s, CU0, BU1 + 0.05), CZ - 0.5, CZ + 0.5, 0, 1.4);
      b.box(0.02, 0.9, 0.9, wd, [s * (CU0 - 0.05), 1.48, CZ], null, 0.01);
      // back counter: black slicer on a live-edge block, a stack of logs ready to slice, the kraft paper roll
      const BKZ = PZ + Q + 0.3;
      b.box(5.4, 0.9, 0.58, K.mat(0x2a2a2c, 0.5), [s * 5.6, 0.45, BKZ], null, 0.01);
      b.box(2.2, 0.12, 0.62, K.surf('wood', 0xa07040), [s * 5.4, 0.96, BKZ], null, 0.03);
      const slm = K.mat(0x1a1a1c, 0.35, 0.4);
      b.box(0.5, 0.3, 0.4, slm, [s * 5.6, 1.17, BKZ], null, 0.03);
      b.cyl(0.18, 0.18, 0.03, chrome, [s * 5.6, 1.35, BKZ + 0.05], [0.3, 0, PI / 2], 20);
      b.box(0.3, 0.04, 0.3, slm, [s * 5.25, 1.34, BKZ], [0, 0, 0.3], 0.01);
      for (let k = 0; k < 4; k++)
        b.cyl(
          0.08,
          0.08,
          0.3,
          K.mat(k % 2 ? 0x3a2a24 : 0x8a4a2a, 0.6),
          [s * (4.5 - k * 0.0), 1.1 + k * 0.0, BKZ - 0.15 + k * 0.1],
          [0, 0, PI / 2],
          12
        );
      S(...xr(s, 2.9, 8.3), PZ + Q, BKZ + 0.3, 0, 1.0, true);
      b.cyl(0.07, 0.07, 1.1, K.mat(0xb08a5a, 0.8), [s * 7.6, 2.4, PZ + Q + 0.12], [0, 0, PI / 2], 12);
      b.box(1.0, 1.3, 0.01, K.mat(0xb08a5a, 0.85), [s * 7.6, 1.7, PZ + Q + 0.05], null, 0);
      b.box(1.2, 0.03, 0.04, dark, [s * 7.6, 1.05, PZ + Q + 0.07], null, 0);
      // menu board over the back counter
      const menu = K.paint('sg_menu', 512, 320, (c, W, H) => {
        c.fillStyle = '#141416';
        c.fillRect(0, 0, W, H);
        c.fillStyle = '#ffffff';
        c.font = '36px ' + IMPACT;
        c.textAlign = 'center';
        c.fillText('PLANT CUTS', W / 2, 44);
        [
          ['SEITAN RIBEYE', '£4.49'],
          ['TOFU PORK BELLY', '£3.29'],
          ['NOT-ZARELLA', '£2.79'],
          ['JACKFRUIT PULLED', '£3.99'],
          ['CARROT BACON', '£1.99'],
          ['SOYLENT GREEN', 'ASK!']
        ].forEach(([a, p], i) => {
          c.font = '26px ' + SANS;
          c.fillStyle = '#e8e8e4';
          c.textAlign = 'left';
          c.fillText(a, 30, 92 + i * 38);
          c.textAlign = 'right';
          c.fillStyle = '#7ad07a';
          c.fillText(p, W - 30, 92 + i * 38);
        });
      });
      b.label(1.4, 0.88, menu, [s * 4.6, 2.48, PZ + Q + 0.03]);
      // the FRIENDS NOT FOOD mural on the party wall
      const mural = K.paint(
        'sg_mural',
        1024,
        512,
        (c, W, H) => {
          c.clearRect(0, 0, W, H);
          c.fillStyle = INK;
          c.strokeStyle = INK;
          c.textAlign = 'center';
          c.font = 'bold 74px ' + IMPACT;
          c.fillText('FRIENDS', W / 2, 90);
          c.font = 'bold 52px ' + IMPACT;
          c.fillText('NOT', W / 2, 150);
          c.font = 'bold 74px ' + IMPACT;
          c.fillText('FOOD', W / 2, 220);
          c.lineWidth = 6;
          // cow (right)
          c.beginPath();
          c.ellipse(820, 300, 130, 70, 0, 0, PI * 2);
          c.stroke();
          c.beginPath();
          c.ellipse(960, 260, 42, 34, 0.3, 0, PI * 2);
          c.stroke();
          for (const lx of [730, 770, 870, 910]) {
            c.beginPath();
            c.moveTo(lx, 360);
            c.lineTo(lx, 440);
            c.stroke();
          }
          for (const [px, py, r] of [
            [790, 280, 26],
            [860, 320, 20],
            [760, 330, 16]
          ]) {
            c.beginPath();
            c.arc(px, py, r, 0, PI * 2);
            c.fill();
          }
          c.beginPath();
          c.moveTo(950, 228);
          c.lineTo(940, 200);
          c.moveTo(975, 232);
          c.lineTo(990, 205);
          c.stroke();
          // pig (centre-bottom)
          c.beginPath();
          c.ellipse(500, 380, 110, 62, 0, 0, PI * 2);
          c.stroke();
          c.beginPath();
          c.ellipse(380, 370, 22, 18, 0, 0, PI * 2);
          c.stroke();
          for (const lx of [430, 470, 540, 580]) {
            c.beginPath();
            c.moveTo(lx, 435);
            c.lineTo(lx, 480);
            c.stroke();
          }
          c.beginPath();
          c.arc(625, 360, 14, PI, PI * 2.6);
          c.stroke();
          // bird (left, wings up)
          c.beginPath();
          c.ellipse(170, 330, 70, 40, -0.2, 0, PI * 2);
          c.fill();
          c.beginPath();
          c.moveTo(150, 310);
          c.quadraticCurveTo(90, 200, 20, 180);
          c.quadraticCurveTo(120, 250, 200, 312);
          c.fill();
          c.beginPath();
          c.arc(250, 300, 22, 0, PI * 2);
          c.fill();
          c.beginPath();
          c.moveTo(268, 296);
          c.lineTo(296, 304);
          c.lineTo(268, 310);
          c.fill();
        },
        {alpha: true}
      );
      b.label(3.0, 1.5, mural, [0.17, 2.1, 6.4], [0, PI / 2, 0]);
      // waiting area: bench under the side window, a shelf of jars and a basket of bread
      b.box(0.45, 0.06, 1.8, K.surf('wood', 0xa07040), [8.55, 0.46, 6.4], null, 0.01);
      for (const lz of [5.6, 7.2]) b.box(0.4, 0.43, 0.06, dark, [8.55, 0.22, lz], null, 0);
      S(8.3, 8.85, 5.5, 7.3, 0, 0.5, true);
      b.box(1.4, 0.6, 0.5, K.surf('wood', 0xa07040), [1.6, 0.3, 7.4], null, 0.01);
      for (let k = 0; k < 6; k++)
        b.cyl(0.05, 0.05, 0.14, K.glass(k % 2 ? 0xc8e8a0 : 0xe8a050, 0.6), [1.05 + k * 0.22, 0.68, 7.4], null, 10);
      S(0.9, 2.3, 7.15, 7.65, 0, 0.95, true);
      // black enamel pendants
      for (const lu of [3.4, 5.6, 7.8]) {
        b.cyl(0.004, 0.004, CEIL - 2.4, dark, [s * lu, (CEIL + 2.4) / 2, CZ], null, 4);
        b.lathe(
          [
            [0.02, 0.2],
            [0.06, 0.18],
            [0.2, 0.02],
            [0.22, 0]
          ],
          K.mat(0x141416, 0.35, 0.3),
          [s * lu, 2.2, CZ],
          16
        );
        b.sph(0.06, warm, [s * lu, 2.22, CZ], null, 8);
      }
      for (const lu of [2.4, 5.0, 7.4]) {
        b.cyl(0.08, 0.08, 0.01, lit, [s * lu, CEIL - 0.005, 6.4], null, 12);
        b.cyl(0.08, 0.08, 0.01, lit, [s * lu, CEIL - 0.005, 3.2], null, 12);
      }
    }

    /* ---------- Soylent Greens kitchen: range with stock pots, steamer, food processor, herb pots ---------- */
    {
      const s = 1;
      b.box(1.6, 0.9, 0.7, ss, [s * 4.0, 0.45, PZ - Q - 0.36], null, 0.01); // range
      for (const [ou, oz] of [
        [3.6, -0.2],
        [4.4, -0.2]
      ]) {
        b.cyl(0.2, 0.2, 0.01, dark, [s * ou, 0.91, PZ + oz - 0.36 + 0.2], null, 14);
        b.cyl(0.18, 0.18, 0.35, ss, [s * ou, 1.09, PZ + oz - 0.36 + 0.2], null, 16, true);
      }
      b.box(1.6, 0.5, 0.7, ss, [s * 4.0, 2.1, PZ - Q - 0.36], null, 0.01); // extract hood
      b.box(2.2, 0.9, 0.6, ss, [s * 6.1, 0.45, PZ - Q - 0.32], null, 0.01);
      S(...xr(s, 3.2, 7.2), PZ - Q - 0.72, PZ - Q, 0, 0.95, true);
      // steamer stack and food processor on the counter
      for (let k = 0; k < 3; k++)
        b.cyl(0.18, 0.18, 0.12, K.mat(0xc8a060, 0.7), [s * 5.6, 0.96 + k * 0.125, PZ - 0.42], null, 14);
      b.cyl(0.12, 0.14, 0.18, K.mat(0x2a2a2c, 0.4), [s * 6.5, 0.99, PZ - 0.42], null, 12);
      b.cyl(0.1, 0.1, 0.28, K.glass(0xe8f0f0, 0.4), [s * 6.5, 1.22, PZ - 0.42], null, 12);
      // herb pots on the window sill
      for (let k = 0; k < 4; k++) {
        b.cyl(0.07, 0.05, 0.12, K.mat(0xb05a3a, 0.8), [s * 8.72, 0.97, -0.5 + k * 0.33], null, 10);
        b.sph(0.09, k % 2 ? leaf : leaf2, [s * 8.72, 1.1, -0.5 + k * 0.33], null, 8);
      }
      // sacks of chickpea flour and wheat gluten on a pallet, a crate of jackfruit
      b.box(1.2, 0.13, 0.8, K.surf('wood', 0x9a7a52), [s * 7.6, 0.07, 2.0 - 0.05], null, 0.01);
      for (let k = 0; k < 3; k++)
        rb(
          0.55,
          0.22,
          0.75,
          0.08,
          K.mat(0xe8dcc0, 0.85),
          [s * (7.3 + (k % 2) * 0.6), 0.25 + Math.floor(k / 2) * 0.22, 1.95],
          null
        );
      // pallet sits clear of the counter run
      S(...xr(s, 7.0, 8.2), 1.55, 2.35, 0, 0.6, true);
      b.box(0.6, 0.35, 0.4, K.mat(0x2a7a3a, 0.6), [s * 3.2, 0.18, -2.0], null, 0.01);
      for (let k = 0; k < 3; k++)
        b.add(K.sphGeo(0.12, 8, 6), K.mat(0x8a9a3a, 0.7), {p: [s * (3.0 + k * 0.2), 0.42, -2.0], s: [1.4, 1, 1]});
      S(...xr(s, 2.9, 3.5), -2.2, -1.8, 0, 0.5, true);
    }

    /* ---------- Soylent Greens freezer store: veg crates on the racking, nets of cabbages, marrows and seitan logs on the meat rail ---------- */
    {
      const s = 1,
        net = K.mat(0xc8a040, 0.8),
        cab = K.mat(0x6a9a3a, 0.7),
        marrow = K.mat(0x3a6a2a, 0.6),
        seitan = K.mat(0x8a5a32, 0.55);
      for (let i = 0; i < 6; i++) {
        const hx = s * (3.6 + i * 0.85);
        b.cyl(0.006, 0.006, 0.5, ss, [hx, 2.45, -4.6], null, 4);
        if (i % 3 === 0) {
          b.add(K.sphGeo(0.26, 10, 8), net, {p: [hx, 1.75, -4.6], s: [1, 1.5, 1]});
          for (let k = 0; k < 4; k++)
            b.sph(0.13, cab, [hx + (k % 2 ? 0.1 : -0.1), 1.6 + Math.floor(k / 2) * 0.24, -4.55], null, 8);
        } else if (i % 3 === 1) b.add(K.sphGeo(0.14, 12, 8), marrow, {p: [hx, 1.6, -4.6], s: [1, 4.2, 1]});
        else for (let k = 0; k < 3; k++) b.cyl(0.07, 0.07, 0.7, seitan, [hx - 0.12 + k * 0.12, 1.75, -4.6], null, 10);
      }
      // v090: walk-through, like the sides of beef next door
      const crate = K.mat(0x2a7a3a, 0.6),
        tub = K.mat(0xf2f2ee, 0.5),
        veg = [0xc85a20, 0x6a9a3a, 0xa83a3a, 0xe8c040];
      for (let k = 0; k < 4; k++)
        for (let j = 0; j < 4; j++)
          if ((k + j) % 3) {
            if (j % 2) {
              b.box(0.5, 0.25, 0.45, crate, [s * 8.45, 0.45 + k * 0.55, -5.4 + j * 0.62], null, 0.01);
              for (let v = 0; v < 3; v++)
                b.sph(
                  0.08,
                  K.mat(veg[(k + v) % 4], 0.6),
                  [s * 8.45, 0.62 + k * 0.55, -5.55 + j * 0.62 + v * 0.15],
                  null,
                  6
                );
            } else b.rbox(0.4, 0.22, 0.45, 0.03, tub, [s * 8.45, 0.43 + k * 0.55, -5.4 + j * 0.62]);
          }
      b.box(1.2, 0.13, 0.8, K.surf('wood', 0x9a7a52), [s * 4.4, 0.07, Z0 + 0.7], null, 0.01);
      for (let k = 0; k < 3; k++)
        for (let j = 0; j < 2; j++)
          b.box(0.5, 0.28, 0.38, crate, [s * (4.15 + j * 0.52), 0.28 + k * 0.29, Z0 + 0.7], null, 0.01);
      S(...xr(s, 3.8, 5.0), Z0 + 0.3, Z0 + 1.1, 0, 1.0);
    }

    /* ---------- dressing: smears, dropped cuts, sawdust, a wet floor sign ---------- */
    {
      const blood = K.mat(0x5a0a0a, 0.25),
        dust = K.mat(0xd8c090, 0.95);
      for (const [x, z, r] of [
        [-3.0, 0.4, 0.35],
        [-2.2, 3.4, 0.22],
        [-5.0, -4.0, 0.4],
        [-6.6, -5.6, 0.25],
        [-4.6, 6.0, 0.18]
      ])
        b.add(K.cylGeo(r, r, 0.004, 14), blood, {p: [x, 0.05, z], s: [1.4, 1, 0.8]});
      for (const [x, z] of [
        [-4.0, -4.9],
        [-5.4, -4.2],
        [-3.8, 0.0]
      ])
        b.add(K.cylGeo(0.5, 0.5, 0.004, 12), dust, {p: [x, 0.048, z], s: [1, 1, 0.7]});
      b.add(K.sphGeo(0.1, 8, 6), K.mat(0xb8282a, 0.4), {p: [-3.6, 0.08, 3.1], s: [1.4, 0.4, 1]}); // a dropped steak
      for (let k = 0; k < 3; k++)
        b.cyl(0.03, 0.03, 0.2, K.mat(0x8a3a22, 0.4), [-1.4 + k * 0.06, 0.07, 5.2 + k * 0.05], [PI / 2, 0.4 * k, 0], 8);
      // Soylent Greens: spilled lentils, a squashed tomato, a tipped crate of carrots
      for (const [x, z, r] of [
        [3.2, 3.2, 0.3],
        [6.0, -1.8, 0.4],
        [4.6, -5.6, 0.3]
      ])
        b.add(K.cylGeo(r, r, 0.004, 14), K.mat(0xa86a2a, 0.8), {p: [x, 0.05, z], s: [1.3, 1, 0.9]});
      b.add(K.cylGeo(0.12, 0.12, 0.004, 12), K.mat(0xb02a1a, 0.3), {p: [2.4, 0.05, 6.4], s: [1.4, 1, 1]});
      for (let k = 0; k < 6; k++)
        b.cyl(
          0.025,
          0.012,
          0.18,
          K.mat(0xe0702a, 0.6),
          [6.9 + k * 0.07, 0.07, -5.9 + (k % 3) * 0.08],
          [PI / 2, 0, 0.5 * k],
          6
        );
      // yellow wet floor sign in the Beat The Meat shop
      for (const sd of [-1, 1])
        b.box(0.3, 0.6, 0.01, K.mat(0xf2c418, 0.5), [-3.2, 0.3, 6.6 + sd * 0.09], [sd * 0.3, 0, 0], 0);
    }

    return (CACHE = G.done());
  }

  function bBeatMeat(x, z, t) {
    const B = mk(x, z, 20, 36, H, 0x8a4a34, 0x6a7a6a, 0x2a2c30);
    B.dx = 0;
    const PT = {th: 0.14, c: 0xe8e2d4};
    WL(B, 1, Z1, X0, X1, opsU(FRONT, 1), H);
    WL(B, 1, Z0, X0, X1, opsU(BACK, 1), H);
    WL(B, 0, X0, Z0, Z1, opsU(SIDE, 1), H);
    WL(B, 0, X1, Z0, Z1, opsU(SIDE, 1), H);
    WL(B, 0, XM, Z0, Z1, [], H, {th: 0.3}); // party wall: two separate shops
    for (const s of [-1, 1]) {
      const a0 = s < 0 ? X0 : XM,
        a1 = s < 0 ? XM : X1;
      WL(B, 1, PZ, a0, a1, opsU(U_PART, s), H, PT); // shop / kitchen
      WL(B, 1, KZ, a0, a1, opsU(U_KPART, s), H, PT); // kitchen / freezer store
      WL(B, 1, TZ, Math.min(0, s * TU), Math.max(0, s * TU), opsU(U_WC, s), H, PT); // staff toilet front
      WL(B, 0, s * TU, KZ, TZ, [], H, PT); // staff toilet side
    }
    LK.attach(B, build());
    // ONE delivery van backed up between the two back doors: it serves both shops
    try {
      if (window.MFZV) {
        const vx = 0,
          vz = Z0 - 4.6;
        const g = MFZV.make('van', WX(B, vx), WZ(B, vz), PI + (B.cs < 0 ? PI : 0), {
          label: 'PRIME CUTS & PLANT CUTS',
          labelCol: '#7a1a1a',
          tint: [0.94, 0.94, 0.92],
          dust: true
        });
        const h = g && g.userData && g.userData.half;
        const hx = h ? h[0] : 1.1,
          hz = h ? h[1] : 2.6;
        B.occ.push([vx - hx, vx + hx, vz - hz, vz + hz]);
      }
    } catch (e) {}
    const SP = LK.spawner(B, 'butcher');
    for (const s of [-1, 1]) {
      const bm = s < 0,
        fz = bm ? 'btm_freezer' : 'sg_freezer',
        kt = bm ? 'btm_kitchen' : 'sg_kitchen',
        out = -s * (PI / 2), // facing in from the outer wall
        inn = s * (PI / 2); // facing out from the party wall
      // shop: the till, a chest freezer by the window
      SP(s * 2.75, CZ, 'cash_register', bm ? 'butcher' : 'sg_shop', 0, 1.03);
      SP(s * 6.6, 7.45, 'chest_freezer_full', bm ? 'butcher' : 'sg_shop', 0);
      // kitchen: two prep tables, the sink and fridge on the outer wall, a wall shelf by the freezer door
      SP(s * 5.2, 0.9, 'prep_table', kt, 0);
      SP(s * 5.2, -0.9, 'prep_table', kt, 0);
      SP(s * 8.5, 0.0, 'kitchen_sink', kt, out);
      SP(s * 8.5, 1.6, 'fridge_modern', kt, out);
      SP(s * 4.2, KZ + 0.4, 'shop_shelf_wall', kt, 0);
      // freezer store: uprights on the party wall, chest freezers on the back wall, a box by the door
      SP(s * 0.5, -3.5, 'freezer_upright', fz, inn);
      SP(s * 0.5, -4.4, 'freezer_upright', fz, inn);
      SP(s * 6.2, Z0 + 0.55, 'chest_freezer_full', fz, PI);
      SP(s * 7.5, Z0 + 0.55, 'chest_freezer_full', fz, PI);
      SP(s * 1.0, Z0 + 0.6, 'cardboard_box_medium', fz, 0.3 * s);
      // staff toilet cabinet
      SP(s * 0.32, -1.0, 'medicine_cabinet', 'bmz_wc', inn);
    }
    // back yard: one dumpster for both
    SP(-6.2, Z0 - 3.4, 'dumpster_green', 'storage', PI);
    return LK.finish(B, t, {
      at: [(X0 + X1) / 2, (Z0 + Z1) / 2],
      w: X1 - X0,
      d: Z1 - Z0,
      loot: ['btm_freezer', [-8, -7, -4, -3.2], 1],
      zombies: [
        [-6.0, 6.2],
        [-2.0, 5.6],
        [-5.0, 0.0],
        [-6.0, -5.0],
        [6.0, 6.2],
        [2.0, 5.6],
        [5.0, 0.0],
        [6.0, -5.0],
        [-4.5, -12.5],
        [4.5, -14.5]
      ]
    });
  }

  const e = LK.register({
    id: 'geins_butcheria',
    name: 'Beat The Meat & Soylent Greens',
    build: bBeatMeat,
    note: 'half plot split into two butchers: Beat The Meat (meat case, kitchen, freezer store of hanging sides) and Soylent Greens vegan butchers (plant-based case, kitchen, veg freezer store); one delivery van serves both',
    globals: {bBeatMeat, BEATMEAT: {build}}
  });
  if (e) e.loot = 'butcher';
  console.log('[beatmeat] Beat The Meat & Soylent Greens ready');
})();
