/* ==========================================================================================================
   MINI FORT ZOMBIE - BEDS, BURNS & BEYOND (v089): a half-plot furniture and fireplace superstore (20 x 36 m plot, front = +Z), our own design.
   Replaces the Comfy Castle Furniture placeholder (newlots id furniture_store, half pool).
   Exterior: a 17 x 21.5 m single-storey retail shed. Red brick lower walls under dark charcoal ribbed cladding, a raised central entrance
   fascia carrying the BEDS, BURNS & BEYOND board (SOFAS · BEDS · FIREPLACES), a sweeping curved canopy on steel posts over sliding glass double
   doors ("Come on in..."), a near-continuous glazed shopfront with round window decals, bollards, a front apron with a sidewalk-sale sofa,
   an A-board, planters, a bench and a bin, a grass strip with trees. Sidewalk: street lights, a meter, a hydrant, no-parking sign.
   Behind: a delivery yard open to the alley (hazard-striped aprons, jamb bollards, dock bumpers, a dumpster, pallets, a board fence down
   each side) and two drive-in truck bays under roller shutters, one with a box truck backed in.
   Interior: one large shop floor (oak boards, mustard walls with a dark green band, drop ceiling with troffers, white steel columns):
   a living-room set on a red carpet with black leather sofas and a fireplace, armchair groups, coffee-table rows, a picture wall, a bed
   gallery (beds, nightstands, lamps, a mattress stack), dining tables with chairs, the cash wrap by the doors, hanging zone signs.
   Back of house: the drive-in delivery area (pallet racking, shrink-wrapped stock, mattresses in plastic, a work bench, roll cages).
   Structure from core WL (doors / windows work); detail is our own geometry and painted artwork, outside the static merge.
   ========================================================================================================== */
(function () {
  'use strict';
  const K = window.MFZK,
    LK = window.LOTKIT;
  if (!K || !LK || typeof WL !== 'function' || typeof NEWCAT === 'undefined') {
    console.warn('[bedsburns] core / prop kit missing');
    return;
  }
  const T = THREE,
    P = K.P,
    PI = Math.PI;
  // the store box (half plot: x -10..10), the shop / delivery partition, heights
  const X0 = -8.5,
    X1 = 8.5,
    Z0 = -11,
    Z1 = 10.5,
    PZ = -4, // shop floor / delivery area
    H = 5.6,
    CEIL = 4.0,
    BH = 4.3; // truck bay opening height
  // two drive-in truck bays in the back wall: [centre, width]
  const BAYS = [
    [-4.6, 4.2],
    [1.0, 4.2]
  ];
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
    {k: 'w', c: 5.6},
    {k: 'w', c: 8.4}
  ];
  const BACKR = [{k: 'd', c: 6.3, s: -1}]; // the back door, right of the bays
  const PART = [
    {k: 'g', c: -3.6},
    {k: 'd', c: 3.35, dbl: 'swing'},
    {k: 'd', c: 4.65, dbl: 'swing'}
  ];
  // the back wall runs between the bays: [a0, a1, ops]
  const BACKRUNS = [
    [X0, BAYS[0][0] - BAYS[0][1] / 2, []],
    [BAYS[0][0] + BAYS[0][1] / 2, BAYS[1][0] - BAYS[1][1] / 2, []],
    [BAYS[1][0] + BAYS[1][1] / 2, X1, BACKR]
  ];

  /* ===================== loot tables ===================== */
  // the shop floor and the delivery area; both carry materials (springs, rope, straps, tape, nails) as well as odds and ends
  try {
    Object.assign(LOOT_TABLES, {
      bbb_shop: {
        spring: 5,
        cotton_balls: 3,
        bungie_cord: 2,
        rope: 2,
        duct_tape: 2,
        nails: 1,
        hairspray: 1,
        gas_cylinder: 1,
        cookies: 1,
        crackers: 1,
        water_jug: 1,
        painkiller: 1
      },
      bbb_stock: {
        nails: 5,
        duct_tape: 4,
        rope: 4,
        bungie_cord: 4,
        spring: 4,
        spray_paint: 2,
        gas_can: 1,
        gas_cylinder: 2,
        car_battery: 1,
        water_jug: 2,
        crackers: 1
      }
    });
    for (const tn of ['bbb_shop', 'bbb_stock'])
      for (const id in LOOT_TABLES[tn])
        if (!ITEMS[id]) {
          console.error('[bedsburns] loot table ' + tn + ' has unknown item ' + id);
          delete LOOT_TABLES[tn][id];
        }
    if (typeof LOOT_PROP !== 'undefined') Object.assign(LOOT_PROP, {bbb_shop: 'cabinet', bbb_stock: 'crate'});
    const A = window.MFZPROP && MFZPROP.auto;
    if (A) {
      const pick = (...ts) => [...new Set(ts.flatMap(t => A[t] || []))];
      A.bbb_shop = pick('house', 'office');
      A.bbb_stock = pick('warehouse', 'storage', 'hardware');
    }
  } catch (e) {
    console.warn('[bedsburns] loot tables', e);
  }

  /* ===================== artwork ===================== */
  const CHAR = '#2b2d31',
    CREAM = '#f4efe2',
    RED = '#c8282e';
  // a little sofa with a heart over it: the BB&B logo mark
  function drawSofa(c, x, y, s, col) {
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    c.fillStyle = col;
    const rr = (x0, y0, w, h, r) => {
      c.beginPath();
      c.moveTo(x0 + r, y0);
      c.arcTo(x0 + w, y0, x0 + w, y0 + h, r);
      c.arcTo(x0 + w, y0 + h, x0, y0 + h, r);
      c.arcTo(x0, y0 + h, x0, y0, r);
      c.arcTo(x0, y0, x0 + w, y0, r);
      c.fill();
    };
    rr(-46, -20, 92, 26, 8); // back
    rr(-56, -4, 22, 34, 7); // arms
    rr(34, -4, 22, 34, 7);
    rr(-36, 8, 72, 18, 5); // seat
    c.fillRect(-50, 30, 6, 8);
    c.fillRect(44, 30, 6, 8);
    c.fillStyle = RED;
    c.beginPath();
    c.moveTo(0, -30);
    c.bezierCurveTo(-4, -38, -18, -40, -18, -50);
    c.bezierCurveTo(-18, -58, -6, -62, 0, -53);
    c.bezierCurveTo(6, -62, 18, -58, 18, -50);
    c.bezierCurveTo(18, -40, 4, -38, 0, -30);
    c.fill();
    c.restore();
  }
  const signMat = () =>
    K.paint(
      'bbb_sign',
      1024,
      256,
      (c, W, H) => {
        c.fillStyle = CHAR;
        c.fillRect(0, 0, W, H);
        c.strokeStyle = '#4a4c52';
        c.lineWidth = 6;
        c.strokeRect(8, 8, W - 16, H - 16);
        drawSofa(c, 120, 150, 1.25, CREAM);
        c.fillStyle = CREAM;
        c.textBaseline = 'middle';
        // v090: BEDS, BURNS and & BEYOND share the line without overlapping: the pair is scaled to fit (& BEYOND sat inside
        // the S of BURNS when the 80 px line ran past the board)
        c.font = 'bold 80px Arial, Helvetica, sans-serif';
        const bw = c.measureText('BEDS, BURNS').width;
        c.font = 'bold 54px Arial, Helvetica, sans-serif';
        const ew = c.measureText('& BEYOND').width,
          gap = 24,
          room = W - 40 - 232,
          k = Math.min(1, room / (bw + gap + ew));
        c.save();
        c.translate(232, 0);
        c.scale(k, 1);
        c.font = 'bold 80px Arial, Helvetica, sans-serif';
        c.fillText('BEDS, BURNS', 0, 86);
        c.font = 'bold 54px Arial, Helvetica, sans-serif';
        c.fillStyle = '#e8c870';
        c.fillText('& BEYOND', bw + gap, 90);
        c.restore();
        c.fillStyle = CREAM;
        c.font = 'bold 44px Arial, Helvetica, sans-serif';
        c.fillText('SOFAS · BEDS · FIREPLACES', 236, 182);
      },
      {glow: 0.35}
    );
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
  // round window decal: white ring and lettering, transparent elsewhere
  const decal = (key, l1, l2) =>
    K.paint(
      key,
      256,
      256,
      (c, W, H) => {
        c.clearRect(0, 0, W, H);
        c.strokeStyle = '#ffffff';
        c.lineWidth = 8;
        c.beginPath();
        c.arc(W / 2, H / 2, 112, 0, PI * 2);
        c.stroke();
        c.fillStyle = '#ffffff';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.font = 'bold 38px Arial, Helvetica, sans-serif';
        c.fillText(l1, W / 2, H / 2 - 22);
        c.fillText(l2, W / 2, H / 2 + 24);
      },
      {alpha: true}
    );
  const chalkMat = () =>
    K.paint('bbb_aboard', 256, 384, (c, W, H, r) => {
      c.fillStyle = '#26302a';
      c.fillRect(0, 0, W, H);
      P.noise(c, W, H, r, 1500, 0.08, '#ffffff', 1);
      c.textAlign = 'center';
      c.fillStyle = '#f4f0e0';
      c.font = 'bold 52px Georgia, serif';
      c.fillText('SALE', W / 2, 78);
      c.fillStyle = '#f2c84a';
      c.font = 'bold 34px Georgia, serif';
      c.fillText('UP TO', W / 2, 150);
      c.font = 'bold 64px Georgia, serif';
      c.fillText('50% OFF', W / 2, 212);
      c.fillStyle = '#f4a0a0';
      c.font = 'italic 30px Georgia, serif';
      c.fillText('warm up your home!', W / 2, 290);
      drawSofa(c, W / 2, 350, 0.45, '#f4f0e0');
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
      // red-orange brick, stretcher bond, dark mortar
      brick: () =>
        K.tri(
          'bbb_brick',
          (c, W, H, r) => {
            c.fillStyle = '#6a5a50';
            c.fillRect(0, 0, W, H);
            const rows = 16,
              bh = H / rows,
              bw = W / 4;
            for (let j = 0; j < rows; j++)
              for (let i = -1; i < 5; i++) {
                const x = i * bw + (j % 2 ? bw / 2 : 0);
                c.fillStyle = `hsl(${10 + r() * 10},${45 + r() * 15}%,${36 + r() * 12}%)`;
                c.fillRect(x + 2, j * bh + 2, bw - 4, bh - 4);
              }
            P.noise(c, W, H, r, 6000, 0.15, '#2a1a10', 1.3);
            P.grime(c, W, H, r, 0.4);
          },
          {tile: 1.2, r: 0.9}
        ),
      // dark charcoal ribbed steel cladding (vertical profile)
      clad: () =>
        K.tri(
          'bbb_clad',
          (c, W, H, r) => {
            c.fillStyle = '#2e3034';
            c.fillRect(0, 0, W, H);
            const n = 8,
              s = W / n;
            for (let i = 0; i < n; i++) {
              c.fillStyle = '#3c3e43';
              c.fillRect(i * s + s * 0.15, 0, s * 0.3, H);
              c.fillStyle = '#1e2023';
              c.fillRect(i * s + s * 0.45, 0, s * 0.06, H);
            }
            P.noise(c, W, H, r, 3000, 0.06, '#000000', 1);
          },
          {tile: 1.6, r: 0.5, m: 0.45}
        ),
      coping: () => K.mat(0x26282b, 0.45, 0.6),
      alu: () => K.mat(0x34363a, 0.4, 0.6),
      shutter: () => K.surf('rollshutter', 0xb8bcc0, {m: 0.5})
    }[k]());

  /* ===================== geometry ===================== */
  let CACHE = null;
  function build() {
    if (CACHE) return CACHE;
    const G = LK.geo('bedsburns'),
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
    const brk = surf('brick'),
      clad = surf('clad'),
      cop = surf('coping'),
      alu = surf('alu'),
      dark = K.mat(0x1c1c1e, 0.5),
      steel = K.mat(0x9a9ea2, 0.4, 0.7),
      galv = K.mat(0xb8bcc0, 0.35, 0.8),
      yel = K.mat(0xf2c418, 0.55),
      lineW = K.mat(0xf2f2ea, 0.6),
      lit = K.mat(0xffffff, 0.4, 0, {emissive: 0xf6f8ff, emissiveIntensity: 0.95}),
      wood = K.surf('wood', 0x6a4a2a),
      leather = K.mat(0x18181a, 0.38, 0.05),
      fabCream = K.mat(0xd8d0c0, 0.92),
      fabGrey = K.mat(0x7a7c80, 0.95),
      fabTeal = K.mat(0x2a5a5e, 0.9),
      fabMust = K.mat(0xc8962a, 0.9),
      oakM = K.veneer(0xa87a4a),
      walnut = K.veneer(0x5a3a22),
      chrome = K.chrome();

    const rb = (w, h, d, r, m, p, rot) => b.rbox(w, h, d, r, m, p, rot, 1); // one segment per rounded edge (keeps vertex counts down)
    /* ---------- furniture makers (shared by the shop floor and the sidewalk sale) ---------- */
    // sofa centred at (x, z), facing angle a (0 = seat faces +Z), seats = 2 / 3
    const sofa = (x, z, a, m, seats, solid = true) => {
      const w = 0.72 * seats + 0.5;
      b.push([x, 0, z], [0, a, 0]);
      rb(w, 0.22, 0.9, 0.05, m, [0, 0.27, 0]); // base
      for (let i = 0; i < seats; i++) rb(0.7, 0.16, 0.66, 0.06, m, [(i - (seats - 1) / 2) * 0.72, 0.46, 0.08]); // cushions
      rb(w - 0.1, 0.5, 0.22, 0.08, m, [0, 0.68, -0.34]); // back
      for (const s of [-1, 1]) rb(0.24, 0.32, 0.9, 0.08, m, [s * (w / 2 - 0.12), 0.54, 0]); // arms
      for (const sx of [-1, 1])
        for (const sz of [-1, 1]) b.box(0.05, 0.16, 0.05, dark, [sx * (w / 2 - 0.1), 0.08, sz * 0.36], null, 0);
      b.pop();
      if (solid) {
        const sw = Math.abs(Math.sin(a)) > 0.5,
          hw = (sw ? 0.9 : w) / 2,
          hd = (sw ? w : 0.9) / 2;
        S(x - hw, x + hw, z - hd, z + hd, 0, 0.9);
      }
    };
    const armchair = (x, z, a, m) => {
      b.push([x, 0, z], [0, a, 0]);
      rb(0.86, 0.24, 0.86, 0.06, m, [0, 0.28, 0]);
      rb(0.56, 0.15, 0.62, 0.06, m, [0, 0.47, 0.08]);
      rb(0.8, 0.52, 0.2, 0.08, m, [0, 0.7, -0.33]);
      for (const s of [-1, 1]) rb(0.16, 0.3, 0.86, 0.07, m, [s * 0.35, 0.55, 0]);
      for (const sx of [-1, 1])
        for (const sz of [-1, 1]) b.box(0.05, 0.16, 0.05, wood, [sx * 0.34, 0.08, sz * 0.34], null, 0);
      b.pop();
      S(x - 0.45, x + 0.45, z - 0.45, z + 0.45, 0, 0.9, true);
    };

    /* ---------- exterior skin: red brick to 2.9 m, charcoal ribbed cladding above, brick-faced piers ---------- */
    const BRK = 2.9;
    const skin = (ax, f, a0, a1, n, ops) => {
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
        put(y0, Math.min(y1, BRK), brk);
        put(Math.max(y0, BRK), y1, clad);
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
    skin(1, Z1, X0 - 0.15, X1 + 0.15, 1, FRONT);
    skin(0, X1, Z0, Z1, 1, RIGHT);
    skin(0, X0, Z0, Z1, -1, []);
    for (const [a0, a1, ops] of BACKRUNS)
      skin(1, Z0, a0 - (a0 === X0 ? 0.15 : 0), a1 + (a1 === X1 ? 0.15 : 0), -1, ops);
    // bay headers: cladding outside, a steel lintel under each
    for (const [c, w] of BAYS) {
      b.box(w, H - BH, 0.3, clad, [c, (H + BH) / 2, Z0], null, 0);
      b.box(w + 0.1, 0.2, 0.34, K.mat(0x4a4c50, 0.45, 0.6), [c, BH + 0.1, Z0], null, 0);
      for (const s of [-1, 1]) b.box(0.16, BH, 0.42, yel, [c + s * (w / 2 + 0.06), BH / 2, Z0], null, 0.01); // yellow jamb guards (v101: proud of the wall end face)
    }
    // window frames (dark aluminium), a mullion strip linking the shopfront glazing, sills
    for (const w of FRONT.filter(p => p.k === 'w')) {
      b.box(1.62, 0.07, 0.16, cop, [w.c, 0.9, Z1 + 0.22], null, 0.01);
      b.frame(1.56, 1.9, 0.07, alu, [w.c, 1.825, Z1 + 0.19], 0.06);
    }
    b.box(X1 - X0, 0.12, 0.12, alu, [0, 2.84, Z1 + 0.2], null, 0.01); // transom bar over the glazing
    for (const w of RIGHT.filter(p => p.k === 'w')) {
      b.box(0.16, 0.07, 1.62, cop, [X1 + 0.22, 0.9, w.c], null, 0.01);
      b.push([X1 + 0.19, 1.825, w.c], [0, PI / 2, 0]);
      b.frame(1.56, 1.9, 0.07, alu, [0, 0, 0], 0.06);
      b.pop();
    }
    // round decals on the glass
    for (const [wx, key, l1, l2] of [
      [-5.7, 'bbb_d1', 'FREE', 'DELIVERY'],
      [4.1, 'bbb_d2', 'SALE', 'NOW ON'],
      [7.3, 'bbb_d3', 'BED', 'STUDIO']
    ])
      b.label(1.1, 1.1, decal(key, l1, l2), [wx, 1.9, Z1 + 0.175]);
    // "Come on in..." over the doors
    b.box(2.9, 0.42, 0.06, alu, [0, 2.62, Z1 + 0.2], null, 0.01);
    b.label(
      2.8,
      0.34,
      strapMat('bbb_come', 'Come on in...', 'italic 40px Arial, Helvetica, sans-serif', '#34363a', '#ffffff'),
      [0, 2.62, Z1 + 0.235]
    );
    // parapet with coping
    const par = (ax, f, a0, a1) => {
      const L = a1 - a0,
        u = (a0 + a1) / 2;
      if (ax) {
        b.box(L, 0.7, 0.3, clad, [u, H + 0.35, f], null, 0);
        b.box(L + 0.1, 0.07, 0.42, cop, [u, H + 0.73, f], null, 0.01);
      } else {
        b.box(0.3, 0.7, L, clad, [f, H + 0.35, u], null, 0);
        b.box(0.42, 0.07, L + 0.1, cop, [f, H + 0.73, u], null, 0.01);
      }
    };
    par(1, Z1, X0 - 0.15, X1 + 0.15);
    par(1, Z0, X0 - 0.15, X1 + 0.15);
    par(0, X0, Z0, Z1);
    par(0, X1, Z0, Z1);
    // flat roof: membrane, HVAC units, vents, roof lights
    b.box(X1 - X0, 0.12, Z1 - Z0, K.surf('concrete', 0x5a5a58), [0, H + 0.02, (Z0 + Z1) / 2], null, 0);
    b.box(X1 - X0 - 0.3, 0.02, Z1 - Z0 - 0.3, K.mat(0x3a3c40, 0.9), [0, H + 0.09, (Z0 + Z1) / 2], null, 0);
    for (const [hx, hz] of [
      [-5, -2],
      [5, 1]
    ]) {
      rb(2.0, 1.0, 1.4, 0.03, K.mat(0xb0b4b8, 0.4, 0.7), [hx, H + 0.6, hz]);
      b.vents(6, 1.8, 0.7, K.mat(0x6a6c6e, 0.5, 0.6), [hx, H + 0.6, hz + 0.71]);
      b.cyl(0.5, 0.5, 0.1, K.mat(0x2a2a2a, 0.5, 0.4), [hx, H + 1.15, hz], null, 20);
    }
    for (const [rx, rz] of [
      [-4, 5],
      [0, 5],
      [4, 5],
      [-2, -7.5],
      [3, -7.5]
    ]) {
      b.box(1.3, 0.25, 1.3, cop, [rx, H + 0.2, rz], null, 0.02);
      b.box(1.1, 0.06, 1.1, K.glass(0xcfe4ee, 0.5), [rx, H + 0.35, rz], null, 0);
    }
    for (const [vx, vz] of [
      [-7, 8],
      [7, -4],
      [-1, -1]
    ])
      b.cyl(0.08, 0.08, 0.8, K.mat(0x7a7c7e, 0.4, 0.7), [vx, H + 0.5, vz], null, 10);

    /* ---------- entrance: raised fascia tower with the BEDS, BURNS & BEYOND board, curved canopy on steel posts ---------- */
    const FT = H + 2.0;
    b.box(9.4, FT - 3.0, 0.6, clad, [0, (FT + 3.0) / 2, Z1 + 0.05], null, 0);
    b.box(9.5, 0.08, 0.72, cop, [0, FT + 0.04, Z1 + 0.05], null, 0.01);
    for (const s of [-1, 1]) b.box(0.6, FT - 3.0, 0.62, brk, [s * 4.6, (FT + 3.0) / 2, Z1 + 0.05], null, 0);
    b.box(8.2, 2.05, 0.08, dark, [0, H + 0.75, Z1 + 0.38], null, 0.01);
    b.label(8.0, 1.95, signMat(), [0, H + 0.75, Z1 + 0.425]);
    for (const s of [-2.6, 0, 2.6]) {
      // gooseneck sign lamps
      b.tube(
        [
          [s, FT - 0.05, Z1 + 0.36],
          [s, FT + 0.25, Z1 + 0.5],
          [s, FT + 0.2, Z1 + 0.85]
        ],
        0.025,
        dark
      );
      b.cyl(0.08, 0.13, 0.12, dark, [s, FT + 0.13, Z1 + 0.88], null, 12);
    }
    // the canopy: a curved deck rising away from the wall, dark soffit, a fascia lip
    const CW = 8.6,
      CD = 4.0,
      NSEG = 10,
      cy = u => 3.6 + 1.0 * u - 0.45 * u * u;
    for (let i = 0; i < NSEG; i++) {
      const u0 = i / NSEG,
        u1 = (i + 1) / NSEG,
        za = Z1 + 0.35 + u0 * CD,
        zb = Z1 + 0.35 + u1 * CD,
        ya = cy(u0),
        yb = cy(u1),
        len = Math.hypot(zb - za, yb - ya),
        ang = Math.atan2(yb - ya, zb - za);
      b.box(CW, 0.2, len + 0.02, clad, [0, (ya + yb) / 2, (za + zb) / 2], [-ang, 0, 0], 0);
      b.box(CW - 0.1, 0.02, len, K.mat(0x3a3c40, 0.7), [0, (ya + yb) / 2 - 0.11, (za + zb) / 2], [-ang, 0, 0], 0);
    }
    const ce = cy(1),
      cz = Z1 + 0.35 + CD;
    b.box(CW + 0.1, 0.42, 0.1, cop, [0, ce + 0.05, cz], null, 0.01);
    for (const px of [-3.9, -1.95, 1.95, 3.9]) {
      const pz = cz - 0.35,
        top = cy((pz - Z1 - 0.35) / CD) - 0.1;
      b.cyl(0.09, 0.09, top, dark, [px, top / 2, pz], null, 14);
      b.cyl(0.16, 0.16, 0.05, dark, [px, 0.045, pz], null, 14);
      S(px - 0.1, px + 0.1, pz - 0.1, pz + 0.1, 0, top, true);
    }
    // downlights in the soffit
    for (const lx of [-3, -1, 1, 3])
      for (const u of [0.3, 0.7]) b.cyl(0.08, 0.08, 0.02, lit, [lx, cy(u) - 0.13, Z1 + 0.35 + u * CD], null, 10);

    /* ---------- front apron: bollards, sidewalk-sale sofa, A-board, planters, bench, bin ---------- */
    for (const bx of [-7.6, -6.0, -4.6, 4.6, 6.0, 7.6]) {
      b.cyl(0.1, 0.1, 1.0, dark, [bx, 0.5, 12.6], null, 12);
      b.cyl(0.11, 0.11, 0.04, K.mat(0xd8d8d8, 0.5), [bx, 0.85, 12.6], null, 12);
      S(bx - 0.11, bx + 0.11, 12.49, 12.71, 0, 1.0, true);
    }
    sofa(-6.6, 13.7, 0, fabTeal, 3);
    // a SALE tag hung on its arm
    b.box(0.22, 0.3, 0.01, K.mat(0xd82828, 0.6), [-5.0, 0.42, 14.2], [0, 0, 0.15], 0);
    // A-board
    b.push([5.6, 0, 13.9], [0, -0.35, 0]);
    for (const s of [-1, 1]) {
      b.box(0.62, 0.92, 0.035, wood, [0, 0.5, s * 0.16], [s * -0.17, 0, 0], 0.005);
      b.label(0.54, 0.8, chalkMat(), [0, 0.51, s * 0.183], [s * -0.17, s > 0 ? 0 : PI, 0]);
    }
    b.pop();
    S(5.25, 5.95, 13.65, 14.15, 0, 1.0, true);
    // planters by the doors
    for (const s of [-1, 1]) {
      const px = s * 3.0;
      rb(0.8, 0.6, 0.8, 0.04, K.mat(0x3a3c40, 0.6), [px, 0.3, 11.3]);
      b.box(0.7, 0.04, 0.7, K.surf('soil', 0x3a2a1c), [px, 0.6, 11.3], null, 0);
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * PI * 2;
        b.sph(
          0.22,
          K.mat(0x3a6a2a, 0.85),
          [px + Math.cos(a) * 0.2, 0.78 + (i % 2) * 0.1, 11.3 + Math.sin(a) * 0.2],
          [1, 1.3, 1],
          8
        );
      }
      S(px - 0.4, px + 0.4, 10.9, 11.7, 0, 0.6);
    }
    // bench and a bin on the right of the apron
    b.push([7.2, 0, 13.9]);
    for (let i = 0; i < 3; i++) b.box(1.6, 0.04, 0.12, wood, [0, 0.45, -0.15 + i * 0.15], null, 0);
    for (let i = 0; i < 2; i++) b.box(1.6, 0.1, 0.03, wood, [0, 0.62 + i * 0.14, -0.26], [-0.12, 0, 0], 0);
    for (const s of [-0.7, 0.7]) b.box(0.05, 0.45, 0.42, dark, [s, 0.22, -0.05], null, 0);
    b.pop();
    S(6.4, 8.0, 13.6, 14.15, 0, 0.8, true);
    b.cyl(0.26, 0.24, 0.8, K.mat(0x1e3a2a, 0.5, 0.3), [4.3, 0.4, 14.0], null, 16);
    b.cyl(0.28, 0.28, 0.06, K.mat(0x1e3a2a, 0.5, 0.3), [4.3, 0.83, 14.0], null, 16);
    S(4.04, 4.56, 13.74, 14.26, 0, 0.86, true);

    /* ---------- delivery yard behind: hazard aprons, bumpers, shutters, pallets, board fences ---------- */
    const hazard = K.paint('bbb_hazard', 256, 64, c => {
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
    const shut = surf('shutter');
    BAYS.forEach(([c, w], i) => {
      // concrete apron + hazard edge at the threshold, guide lines out to the alley
      b.box(w + 1.2, 0.03, 3.2, K.surf('concrete', 0x9a9890), [c, 0.025, Z0 - 1.6], null, 0);
      // v090: hazard edge and guide lines on top of the apron (the lines were 5 mm under its surface: half hidden / flickering)
      b.label(w, 0.25, hazard, [c, 0.054, Z0 - 0.3], [-PI / 2, 0, 0]);
      for (const s of [-1, 1]) b.box(0.12, 0.01, 5.8, yel, [c + s * (w / 2 - 0.1), 0.047, Z0 - 3.9], null, 0);
      // roller shutter box and guides; bay 0 rolled right up, bay 1 part-way down (still truck height)
      rb(w + 0.3, 0.55, 0.55, 0.06, K.mat(0x8a8e92, 0.4, 0.6), [c, BH + 0.3, Z0 - 0.42]);
      for (const s of [-1, 1])
        b.box(0.1, BH, 0.14, K.mat(0x5a6062, 0.4, 0.6), [c + s * (w / 2 - 0.03), BH / 2, Z0 - 0.26], null, 0);
      const low = i === 1 ? 3.7 : BH - 0.05;
      if (BH - low > 0.06) b.box(w - 0.1, BH - low, 0.05, shut, [c, (BH + low) / 2, Z0 - 0.27], null, 0);
      b.box(w - 0.1, 0.08, 0.08, K.mat(0x6a6e72, 0.4, 0.6), [c, low - 0.04, Z0 - 0.27], null, 0);
      // rubber bumpers and yellow bollards either side
      for (const s of [-1, 1]) {
        rb(0.3, 0.45, 0.18, 0.03, K.rubber(), [c + s * (w / 2 + 0.35), 0.75, Z0 - 0.25]);
        b.cyl(0.12, 0.12, 1.1, yel, [c + s * (w / 2 + 0.45), 0.55, Z0 - 0.9], null, 14);
        S(c + s * (w / 2 + 0.45) - 0.13, c + s * (w / 2 + 0.45) + 0.13, Z0 - 1.03, Z0 - 0.77, 0, 1.1, true);
      }
      // a wall pack light over each bay
      b.box(0.36, 0.22, 0.2, dark, [c, H - 0.35, Z0 - 0.26], null, 0.01);
      b.box(0.3, 0.02, 0.14, lit, [c, H - 0.47, Z0 - 0.28], null, 0);
    });
    // DELIVERIES strip over the back door, a little door hood
    b.box(1.6, 0.06, 0.8, cop, [6.3, 2.75, Z0 - 0.4], null, 0.01);
    b.label(
      1.5,
      0.19,
      strapMat('bbb_deliv', 'STAFF & DELIVERIES', 'bold 40px Arial, Helvetica, sans-serif', '#f2c418', '#1a1a1a'),
      [6.3, 3.0, Z0 - 0.17],
      [0, PI, 0]
    );
    // pallets stacked by the left fence
    const pallet = (px, pz, n, a) => {
      b.push([px, 0, pz], [0, a || 0, 0]);
      for (let j = 0; j < n; j++) {
        const y = j * 0.15;
        for (const s of [-0.5, 0, 0.5]) b.box(1.2, 0.08, 0.1, wood, [0, y + 0.04, s * 0.95], null, 0);
        for (let i = 0; i < 7; i++) b.box(0.13, 0.025, 1.0, wood, [-0.54 + i * 0.18, y + 0.095, 0], null, 0);
        for (let i = 0; i < 3; i++) b.box(0.13, 0.025, 1.0, wood, [-0.54 + i * 0.54, y + 0.0125, 0], null, 0);
      }
      b.pop();
      S(px - 0.62, px + 0.62, pz - 0.62, pz + 0.62, 0, n * 0.15, true);
    };
    pallet(-8.9, -12.4, 6, 0.05);
    pallet(-8.9, -13.8, 3, -0.08);
    pallet(-7.6, -12.6, 2, 0.4);
    // flattened cardboard bales strapped up
    for (const [bx, bz] of [
      [8.6, -14.6],
      [8.6, -15.8]
    ]) {
      b.box(1.0, 0.8, 1.0, K.surf('cardboard', 0xb8946a), [bx, 0.4, bz], null, 0.01);
      for (const s of [-0.25, 0.25]) b.box(1.02, 0.82, 0.02, K.mat(0x2a2a2a, 0.6), [bx, 0.4, bz + s], null, 0);
      S(bx - 0.5, bx + 0.5, bz - 0.5, bz + 0.5, 0, 0.8, true);
    }
    // board fences down both sides of the yard
    const fen = surf('fence');
    for (const fx of [-9.9, 9.9]) {
      b.box(0.06, 1.8, -17.6 - Z0, fen, [fx, 0.9, (Z0 - 17.6) / 2], null, 0);
      for (let pz = Z0 - 0.2; pz > -17.6; pz -= 2.2) b.box(0.1, 1.9, 0.1, fen, [fx, 0.95, pz], null, 0.01);
      b.box(0.1, 0.06, -17.6 - Z0, fen, [fx, 1.86, (Z0 - 17.6) / 2], null, 0);
      S(fx - 0.06, fx + 0.06, -17.6, Z0, 0, 1.9, true);
    }

    /* ---------- truck bay headers (collision: the walls themselves are core WL) ---------- */
    for (const [c, w] of BAYS) S(c - w / 2, c + w / 2, Z0 - 0.15, Z0 + 0.15, BH, H, true);

    /* ---------- interior: floors, linings, ceiling, columns, lights ---------- */
    const must = K.mat(0xc8a832, 0.85),
      green = K.mat(0x23382a, 0.7),
      skirt = K.mat(0x1e2a22, 0.6),
      blockW = K.mat(0xb8b8b2, 0.9),
      hous = K.mat(0xd8d8d4, 0.5, 0.2),
      white = K.mat(0xeeeeea, 0.6),
      marble = K.mat(0xe6e4de, 0.25),
      slate = K.mat(0x2e3034, 0.8),
      iron = K.mat(0x1a1a1b, 0.55, 0.5),
      brass = K.mat(0xc8a040, 0.3, 0.9),
      flame = K.mat(0xff8a20, 0.6, 0, {emissive: 0xff6a10, emissiveIntensity: 1.4}),
      ember = K.mat(0xc83a10, 0.6, 0, {emissive: 0xa02a08, emissiveIntensity: 1.0}),
      carpetR = K.mat(0xa82830, 0.98),
      oakF = K.surf('boards', 0x8a6040);
    const flr = (x0, x1, z0, z1, m, y) =>
      b.box(x1 - x0 - 0.2, 0.02, z1 - z0 - 0.2, m, [(x0 + x1) / 2, y || 0.035, (z0 + z1) / 2], null, 0);
    flr(X0, X1, PZ, Z1, oakF);
    flr(X0, X1, Z0, PZ, K.surf('concrete', 0x8e8c86));
    // the shop ceiling (the delivery area is open to the roof deck, on steel joists)
    b.box(X1 - X0 - 0.3, 0.04, Z1 - PZ - 0.2, K.mat(0xe8e6e0, 0.9), [0, CEIL + 0.02, (PZ + Z1) / 2], null, 0);
    b.box(X1 - X0 - 0.3, 0.04, PZ - Z0 - 0.2, K.mat(0x6a6c70, 0.7, 0.3), [0, H - 0.05, (Z0 + PZ) / 2], null, 0);
    for (let jz = Z0 + 0.8; jz < PZ; jz += 1.5)
      b.box(X1 - X0 - 0.3, 0.3, 0.08, K.mat(0x4a5a6a, 0.5, 0.6), [0, H - 0.25, jz], null, 0);
    // shop: mustard walls, dark green band and skirting
    const shopSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, Math.min(y1, CEIL - 0.6), must, 0.012, 0.006);
      if (y1 > CEIL - 0.6) pc(u0, u1, Math.max(y0, CEIL - 0.6), y1, green, 0.014, 0.007);
      if (y0 <= 0 && y1 > 0.2) pc(u0, u1, 0, 0.16, skirt, 0.03, 0.015);
    };
    const backSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, y1, blockW, 0.012, 0.006);
      if (y0 <= 0 && y1 > 1.0) pc(u0, u1, 0, 0.9, K.mat(0x3a4a5a, 0.7), 0.02, 0.01);
    };
    LK.lineWall(b, 1, Z1, X0, X1, -1, FRONT, CEIL, shopSpan);
    LK.lineWall(b, 0, X0, PZ, Z1, 1, [], CEIL, shopSpan);
    LK.lineWall(b, 0, X1, PZ, Z1, -1, RIGHT, CEIL, shopSpan);
    LK.lineWall(b, 1, PZ + 0.08, X0, X1, 1, PART, CEIL, shopSpan);
    LK.lineWall(b, 1, PZ - 0.08, X0, X1, -1, PART, H - 0.1, backSpan);
    LK.lineWall(b, 0, X0, Z0, PZ, 1, [], H - 0.1, backSpan);
    LK.lineWall(b, 0, X1, Z0, PZ, -1, [], H - 0.1, backSpan);
    for (const [a0, a1, ops] of BACKRUNS) LK.lineWall(b, 1, Z0, a0, a1, 1, ops, BH, backSpan);
    // white steel columns
    for (const [cx, cz] of [
      [-3.2, 4.8],
      [3.2, 4.8],
      [-3.2, -0.2],
      [3.2, -0.2]
    ]) {
      b.box(0.24, CEIL, 0.24, white, [cx, CEIL / 2, cz], null, 0.01);
      b.box(0.34, 0.12, 0.34, white, [cx, 0.06, cz], null, 0.01);
      S(cx - 0.13, cx + 0.13, cz - 0.13, cz + 0.13, 0, CEIL, true);
    }
    // fluorescent troffers over the shop, battens in the delivery area
    for (let lx = -6.4; lx < 7; lx += 3.2)
      for (const lz of [-2.2, 0.8, 3.8, 6.8, 9.4]) {
        b.box(1.24, 0.04, 0.62, hous, [lx, CEIL - 0.01, lz], null, 0.005);
        b.box(1.16, 0.01, 0.54, lit, [lx, CEIL - 0.035, lz], null, 0);
      }
    for (const lx of [-6, -1, 4, 7])
      for (const lz of [-9, -6]) {
        b.box(1.3, 0.07, 0.18, hous, [lx, H - 0.45, lz], null, 0.01);
        b.box(1.22, 0.012, 0.12, lit, [lx, H - 0.49, lz], null, 0);
      }
    // hanging zone signs
    const zoneSign = (key, text, x, z, a) => {
      const m = strapMat(key, text, 'bold 44px Arial, Helvetica, sans-serif', CHAR, '#f4efe2');
      b.push([x, CEIL - 0.75, z], [0, a || 0, 0]);
      b.box(2.0, 0.34, 0.05, dark, [0, 0, 0], null, 0.01);
      for (const s of [-1, 1]) b.label(1.94, 0.28, m, [0, 0, s * 0.03], [0, s > 0 ? 0 : PI, 0]);
      for (const s of [-0.8, 0.8]) b.cyl(0.006, 0.006, 0.58, steel, [s, 0.46, 0], null, 4);
      b.pop();
    };
    zoneSign('bbb_zs1', 'SOFAS', -5.6, 7.8);
    zoneSign('bbb_zs2', 'BEDS', -6.4, 0.6, PI / 2);
    zoneSign('bbb_zs3', 'DINING', 6.2, 2.6);
    zoneSign('bbb_zs4', 'FIREPLACES', 0, -1.2);

    /* ---------- living-room set on a red carpet: black leather sofas facing each other, a marble fireplace ---------- */
    b.box(4.6, 0.025, 4.4, carpetR, [-5.9, 0.05, 7.85], null, 0);
    for (const s of [-1, 1]) {
      b.box(4.7, 0.05, 0.06, oakM, [-5.9, 0.05, 7.85 + s * 2.23], null, 0);
      b.box(0.06, 0.05, 4.5, oakM, [-5.9 + s * 2.33, 0.05, 7.85], null, 0);
    }
    sofa(-5.6, 9.4, PI, leather, 3);
    sofa(-5.6, 6.3, 0, leather, 3);
    armchair(-3.95, 7.85, -PI / 2, fabCream);
    const ctable = (x, z, w, d, m, a) => {
      b.push([x, 0, z], [0, a || 0, 0]);
      b.box(w, 0.05, d, m, [0, 0.42, 0], null, 0);
      b.box(w - 0.12, 0.03, d - 0.12, m, [0, 0.14, 0], null, 0);
      for (const sx of [-1, 1])
        for (const sz of [-1, 1]) b.box(0.06, 0.4, 0.06, m, [sx * (w / 2 - 0.06), 0.2, sz * (d / 2 - 0.06)], null, 0);
      b.pop();
      const sw = Math.abs(Math.sin(a || 0)) > 0.5;
      S(x - (sw ? d : w) / 2, x + (sw ? d : w) / 2, z - (sw ? w : d) / 2, z + (sw ? w : d) / 2, 0, 0.45, true);
    };
    ctable(-5.6, 7.85, 1.3, 0.7, walnut);
    // fireplaces: kind 'marble' (white mantel, black insert), 'stone' (rough surround, log fire), 'modern' (black slot, flame strip)
    const fireplace = (x, z, a, kind, lit_) => {
      b.push([x, 0, z], [0, a, 0]);
      if (kind === 'marble') {
        b.box(1.5, 1.15, 0.36, marble, [0, 0.575, 0], null, 0.01);
        b.box(1.7, 0.08, 0.46, marble, [0, 1.19, 0.04], null, 0.01);
        b.box(0.72, 0.62, 0.05, iron, [0, 0.42, 0.17], null, 0.005);
        b.frame(0.8, 0.7, 0.05, brass, [0, 0.43, 0.2], 0.03);
        b.box(1.4, 0.06, 0.4, slate, [0, 0.03, 0.36], null, 0.005);
      } else if (kind === 'stone') {
        b.box(1.5, 1.4, 0.4, K.surf('stone', 0x9a948a), [0, 0.7, 0], null, 0.01);
        b.box(1.62, 0.12, 0.5, walnut, [0, 1.42, 0.05], null, 0.01);
        b.box(0.8, 0.7, 0.06, K.mat(0x0e0e0e, 0.9), [0, 0.45, 0.18], null, 0);
        b.box(1.3, 0.08, 0.5, K.surf('stone', 0x7a746a), [0, 0.04, 0.4], null, 0.005);
      } else {
        b.box(1.5, 2.4, 0.3, K.mat(0x4a4c50, 0.7), [0, 1.2, 0], null, 0.01);
        b.box(1.1, 0.36, 0.06, K.mat(0x0a0a0a, 0.6, 0.2), [0, 0.95, 0.13], null, 0);
        b.box(1.16, 0.42, 0.02, K.glass(0x222222, 0.35), [0, 0.95, 0.165], null, 0);
      }
      if (lit_) {
        if (kind === 'modern') b.box(0.96, 0.05, 0.03, flame, [0, 0.84, 0.15], null, 0);
        else {
          for (const s of [-0.18, 0, 0.18])
            b.cyl(0.05, 0.05, 0.42, K.surf('bark', 0x5a3a22), [s * 0.6, 0.2, 0.12], [0, s * 2, PI / 2], 8);
          b.add(K.cylGeo(0.02, 0.12, 0.3, 8), flame, {p: [0, 0.38, 0.12]});
          b.box(0.4, 0.04, 0.15, ember, [0, 0.16, 0.12], null, 0);
        }
      }
      b.pop();
    };
    fireplace(X0 + 0.2, 7.85, PI / 2, 'marble', false);
    S(X0, X0 + 0.45, 7.0, 8.7, 0, 1.25);
    // a big pot plant on the mantel
    b.cyl(0.18, 0.13, 0.26, K.mat(0xc8622a, 0.6), [X0 + 0.28, 1.36, 7.85], null, 14);
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * PI * 2;
      b.box(
        0.04,
        0.02,
        0.36,
        K.mat(0x2e6a2a, 0.8),
        [X0 + 0.28 + Math.cos(a) * 0.18, 1.62 + (i % 3) * 0.06, 7.85 + Math.sin(a) * 0.18],
        [0.5, -a, 0],
        0
      );
    }

    /* ---------- fireplace showroom: three chimney breasts on the back partition, freestanding stoves on slate hearths ---------- */
    const FW = PZ + 0.18;
    [
      [-1.7, 'stone', true],
      [0, 'marble', true],
      [1.7, 'modern', true]
    ].forEach(([fx, kind, on]) => {
      b.box(1.56, CEIL - 0.6, 0.12, must, [fx, (CEIL - 0.6) / 2, FW], null, 0); // chimney breast face
      fireplace(fx, FW + 0.24, 0, kind, on);
      S(fx - 0.8, fx + 0.8, PZ, FW + 0.5, 0, kind === 'modern' ? 2.4 : 1.45);
    });
    b.label(
      4.2,
      0.36,
      strapMat('bbb_fps', 'WARM UP YOUR HOME', 'bold 34px Arial, Helvetica, sans-serif', '#23382a', '#e8c870'),
      [0, CEIL - 0.85, FW + 0.07]
    );
    const stove = (x, z, a, col) => {
      const m = K.mat(col, 0.6, 0.45);
      b.push([x, 0, z], [0, a || 0, 0]);
      b.box(1.0, 0.04, 0.9, slate, [0, 0.02, 0], null, 0.005);
      rb(0.58, 0.62, 0.44, 0.03, m, [0, 0.47, 0]);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(0.05, 0.16, 0.05, m, [sx * 0.24, 0.08, sz * 0.17]);
      b.box(0.36, 0.3, 0.02, K.glass(0x3a2210, 0.6), [0, 0.47, 0.225], null, 0);
      b.box(0.24, 0.05, 0.02, flame, [0, 0.38, 0.215], null, 0);
      b.cyl(0.075, 0.075, CEIL - 0.8, m, [0, 0.78 + (CEIL - 0.8) / 2, -0.06], null, 14);
      b.handle(0.12, brass, [0.22, 0.5, 0.225], true);
      b.pop();
      S(x - 0.3, x + 0.3, z - 0.24, z + 0.24, 0, 0.8);
    };
    stove(-1.6, -2.0, 0.15, 0x1c1c1e);
    stove(1.6, -2.0, -0.15, 0x2a3a4a);
    stove(7.4, -1.9, -PI / 2, 0x6a1c18);
    // companion sets and log baskets
    const companion = (x, z) => {
      b.cyl(0.12, 0.12, 0.02, iron, [x, 0.06, z], null, 12);
      b.cyl(0.012, 0.012, 0.7, iron, [x, 0.42, z], null, 6);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * PI * 2;
        b.cyl(
          0.008,
          0.008,
          0.62,
          iron,
          [x + Math.cos(a) * 0.05, 0.38, z + Math.sin(a) * 0.05],
          [Math.sin(a) * 0.08, 0, Math.cos(a) * 0.08],
          5
        );
      }
      b.sph(0.02, brass, [x, 0.79, z], null, 8);
    };
    const logs = (x, z) => {
      b.cyl(0.26, 0.22, 0.32, K.mat(0x8a6a3a, 0.9), [x, 0.16, z], null, 12, true);
      for (let i = 0; i < 5; i++)
        b.cyl(
          0.05,
          0.05,
          0.5,
          K.surf('bark', 0x5a3a22),
          [x - 0.12 + (i % 3) * 0.12, 0.3 + Math.floor(i / 3) * 0.08, z],
          [PI / 2, 0, 0],
          8
        );
      S(x - 0.27, x + 0.27, z - 0.27, z + 0.27, 0, 0.4, true);
    };
    companion(-1.0, -2.3);
    companion(2.2, -2.3);
    companion(6.9, -2.6);
    logs(-2.3, -2.1);
    logs(2.35, -1.7);
    logs(7.6, -0.9);

    /* ---------- bed gallery along the left wall: headboards on the wall, nightstands, lamps, a mattress stack ---------- */
    const bed = (z, frame, cover, head) => {
      const x0 = X0 + 0.15,
        L = 2.1,
        W = 1.6;
      b.box(0.1, 1.2, W + 0.1, head, [x0 + 0.05, 0.6, z], null, 0.02); // headboard
      b.box(L, 0.3, W, frame, [x0 + L / 2, 0.2, z], null, 0.01); // base
      rb(L - 0.1, 0.22, W - 0.06, 0.05, white, [x0 + L / 2, 0.46, z]); // mattress
      rb(L * 0.62, 0.06, W, 0.02, cover, [x0 + L * 0.66, 0.58, z]); // duvet
      rb(0.18, 0.06, W + 0.04, 0.02, cover, [x0 + L - 0.06, 0.45, z]);
      for (const s of [-1, 1]) rb(0.36, 0.12, 0.6, 0.05, K.mat(0xf4f2ec, 0.9), [x0 + 0.32, 0.62, z + s * 0.38]); // pillows
      S(x0, x0 + L, z - W / 2, z + W / 2, 0, 0.62);
    };
    bed(-2.6, walnut, K.mat(0x3a4a6a, 0.95), fabGrey);
    bed(0.25, oakM, K.mat(0xc8b890, 0.95), leather);
    bed(3.1, K.mat(0xd8d6d0, 0.6), K.mat(0x8a3a3a, 0.95), fabTeal);
    const lamp = (x, y, z) => {
      b.cyl(0.07, 0.09, 0.04, brass, [x, y + 0.02, z], null, 12);
      b.cyl(0.012, 0.012, 0.32, brass, [x, y + 0.2, z], null, 6);
      b.cyl(
        0.1,
        0.15,
        0.18,
        K.mat(0xf2ead6, 0.9, 0, {emissive: 0x6a5a30, emissiveIntensity: 0.4}),
        [x, y + 0.42, z],
        null,
        16,
        true
      );
    };
    for (const nz of [-1.18, 1.68]) {
      b.box(0.46, 0.55, 0.42, walnut, [X0 + 0.38, 0.275, nz], null, 0.01);
      b.box(0.4, 0.02, 0.36, K.mat(0x2a1a10, 0.5), [X0 + 0.4, 0.4, nz], null, 0);
      lamp(X0 + 0.38, 0.55, nz);
      S(X0 + 0.15, X0 + 0.61, nz - 0.21, nz + 0.21, 0, 0.55, true);
    }
    // mattresses stacked flat, wrapped in plastic, a price card on top
    for (let i = 0; i < 6; i++)
      rb(1.4 - (i % 2) * 0.04, 0.24, 1.95, 0.06, i % 2 ? white : K.mat(0xdcdcd4, 0.7), [
        -4.45 + (i % 3) * 0.02,
        0.12 + i * 0.245,
        -0.6
      ]);
    b.box(1.42, 0.005, 1.97, K.glass(0xffffff, 0.25), [-4.43, 1.48, -0.6], null, 0);
    b.box(0.3, 0.2, 0.005, K.mat(0xd82828, 0.6), [-4.45, 1.6, -0.6], [-0.4, 0, 0], 0);
    S(-5.15, -3.75, -1.58, 0.38, 0, 1.48);

    /* ---------- armchair groups, coffee-table row, dining tables with chairs ---------- */
    armchair(2.1, 2.3, -PI / 2 - 0.2, fabGrey);
    armchair(2.1, 3.5, -PI / 2 + 0.2, fabMust);
    ctable(-2.1, 3.4, 1.1, 0.6, oakM, PI / 2);
    ctable(-2.1, 1.6, 1.0, 1.0, K.veneer(0x8a5a32), 0);
    const dChair = (x, z, a) => {
      b.push([x, 0, z], [0, a, 0]);
      b.box(0.44, 0.05, 0.44, oakM, [0, 0.46, 0], null, 0);
      for (const sx of [-1, 1])
        for (const sz of [-1, 1]) b.box(0.04, 0.46, 0.04, oakM, [sx * 0.19, 0.23, sz * 0.19], null, 0);
      for (const sx of [-1, 1]) b.box(0.04, 0.5, 0.04, oakM, [sx * 0.19, 0.73, -0.2], null, 0);
      for (let i = 0; i < 5; i++) b.box(0.03, 0.42, 0.02, oakM, [-0.12 + i * 0.06, 0.74, -0.2], null, 0);
      b.box(0.44, 0.06, 0.04, oakM, [0, 0.98, -0.2], null, 0);
      b.pop();
    };
    for (const [tz, top] of [
      [1.6, oakM],
      [3.9, walnut]
    ]) {
      b.box(2.1, 0.06, 0.95, top, [6.2, 0.76, tz], null, 0.01);
      for (const sx of [-1, 1])
        for (const sz of [-1, 1]) b.box(0.08, 0.73, 0.08, top, [6.2 + sx * 0.95, 0.365, tz + sz * 0.38]);
      for (const cx of [5.6, 6.8]) {
        dChair(cx, tz - 0.72, 0);
        dChair(cx, tz + 0.72, PI);
      }
      dChair(4.85, tz, PI / 2);
      dChair(7.55, tz, -PI / 2);
      S(5.15, 7.25, tz - 0.48, tz + 0.48, 0, 0.8);
      // place settings and a vase
      for (const px of [5.6, 6.8])
        for (const s of [-1, 1]) b.cyl(0.11, 0.1, 0.015, white, [px, 0.8, tz + s * 0.26], null, 16);
      b.cyl(0.06, 0.08, 0.26, K.glass(0x6aa0b8, 0.6), [6.2, 0.92, tz], null, 12);
    }

    /* ---------- the cash wrap by the doors ---------- */
    b.box(3.4, 1.0, 0.7, oakM, [4.1, 0.5, 8.7], null, 0.01);
    b.box(3.5, 0.05, 0.8, K.mat(0xe8e2d4, 0.4), [4.1, 1.025, 8.7], null, 0.01);
    b.box(3.36, 0.9, 0.02, green, [4.1, 0.5, 8.34], null, 0);
    b.label(
      1.6,
      0.2,
      strapMat('bbb_till', 'PAY HERE', 'bold 44px Arial, Helvetica, sans-serif', '#23382a', '#e8c870'),
      [4.1, 0.75, 8.33],
      [0, PI, 0]
    );
    b.box(0.7, 1.0, 1.4, oakM, [6.15, 0.5, 9.4], null, 0.01);
    S(2.4, 6.5, 8.35, 9.05, 0, 1.05);
    S(5.8, 6.5, 9.05, 10.1, 0, 1.05);
    // swatch books and a brochure stand on the counter
    for (let i = 0; i < 4; i++)
      b.box(
        0.24,
        0.05,
        0.32,
        K.mat([0x8a3a3a, 0x3a5a6a, 0xc8962a, 0x5a6a3a][i], 0.8),
        [2.8 + i * 0.05, 1.08 + i * 0.05, 8.7],
        [0, 0.1 * i, 0],
        0.003
      );

    /* ---------- picture wall on the right wall over the dining sets ---------- */
    const pics = K.paint('bbb_pics', 512, 256, (c, W, H, r) => {
      for (let i = 0; i < 8; i++) {
        const x = (i % 4) * 128,
          y = Math.floor(i / 4) * 128;
        const g = c.createLinearGradient(x, y, x, y + 128);
        g.addColorStop(0, `hsl(${r() * 360},40%,${55 + r() * 20}%)`);
        g.addColorStop(1, `hsl(${r() * 360},45%,${30 + r() * 20}%)`);
        c.fillStyle = g;
        c.fillRect(x, y, 128, 128);
        c.fillStyle = `hsla(${r() * 360},50%,30%,0.7)`;
        c.beginPath();
        c.moveTo(x, y + 128);
        c.lineTo(x + 40 + r() * 40, y + 50 + r() * 30);
        c.lineTo(x + 128, y + 128);
        c.fill();
      }
    });
    for (let i = 0; i < 8; i++) {
      const pz = 0.4 + (i % 4) * 0.95,
        py = 1.5 + Math.floor(i / 4) * 0.9,
        w = 0.6 + ((i * 7) % 3) * 0.1,
        h = 0.5 + ((i * 5) % 3) * 0.1;
      b.push([X1 - 0.18, py, pz], [0, -PI / 2, 0]);
      b.box(w + 0.06, h + 0.06, 0.03, i % 2 ? K.mat(0x1a1a1a, 0.5) : brass, [0, 0, 0], null, 0.005);
      const g = new T.PlaneGeometry(w, h),
        uv = g.attributes.uv,
        u0 = (i % 4) / 4,
        v0 = Math.floor(i / 4) / 2;
      for (let k = 0; k < uv.count; k++) uv.setXY(k, u0 + uv.getX(k) * 0.25, 1 - v0 - (1 - uv.getY(k)) * 0.5);
      b.add(g, pics, {p: [0, 0, 0.017]});
      b.pop();
    }

    /* ---------- delivery area: hazard lanes to the bays, shrink-wrapped sofas, mattresses in plastic, roll cages ---------- */
    for (const [c, w] of BAYS) {
      for (const s of [-1, 1])
        b.box(0.1, 0.01, PZ - Z0 - 0.4, yel, [c + s * (w / 2 - 0.1), 0.053, (Z0 + PZ) / 2], null, 0); // v090: clear of the floor
      b.label(w, 0.25, hazard, [c, 0.062, Z0 + 0.3], [-PI / 2, 0, 0]);
    }
    const wrapped = (x, z, a) => {
      b.push([x, 0, z], [0, a, 0]);
      for (const s of [-0.5, 0, 0.5]) b.box(2.2, 0.12, 0.1, wood, [0, 0.06, s * 0.85], null, 0.004);
      rb(2.1, 0.85, 0.95, 0.12, K.glass(0xe8eef2, 0.75), [0, 0.56, 0]);
      rb(1.95, 0.75, 0.82, 0.1, fabGrey, [0, 0.55, 0]);
      b.pop();
      const sw = Math.abs(Math.sin(a)) > 0.5;
      S(x - (sw ? 0.5 : 1.1), x + (sw ? 0.5 : 1.1), z - (sw ? 1.1 : 0.5), z + (sw ? 1.1 : 0.5), 0, 1.0);
    };
    wrapped(6.0, -6.3, PI / 2);
    // mattresses on edge in plastic against the partition, left of the gate
    for (let i = 0; i < 4; i++)
      rb(
        0.24,
        1.9,
        1.4,
        0.06,
        i % 2 ? white : K.mat(0xd4d8dc, 0.6),
        [-2.45 + i * 0.27, 0.95, PZ - 0.85],
        [0, 0, -0.08]
      );
    S(-2.7, -1.2, PZ - 1.6, PZ - 0.1, 0, 1.9);
    const cage = (x, z) => {
      b.push([x, 0, z]);
      for (const sx of [-1, 1])
        for (const sz of [-1, 1]) b.cyl(0.03, 0.03, 0.08, K.rubber(), [sx * 0.32, 0.04, sz * 0.32], [PI / 2, 0, 0], 8);
      b.box(0.75, 0.04, 0.75, galv, [0, 0.12, 0], null, 0);
      for (const sx of [-1, 1]) b.frame(0.75, 1.6, 0.02, galv, [0, 0.95, sx * 0.37], 0.02);
      for (let i = 0; i < 5; i++)
        for (const sx of [-1, 1]) b.box(0.012, 1.55, 0.012, galv, [-0.3 + i * 0.15, 0.95, sx * 0.37], null, 0);
      b.box(0.6, 0.6, 0.5, K.surf('cardboard', 0xb8946a), [0, 0.45, 0], null, 0);
      b.pop();
      S(x - 0.4, x + 0.4, z - 0.4, z + 0.4, 0, 1.75, true);
    };
    cage(7.85, -4.7);
    cage(-1.9, -10.3);

    /* ---------- sidewalk: street lights, meter, hydrant, no parking ---------- */
    LK.lightPole(b, S, -5);
    LK.lightPole(b, S, 5);
    LK.hydrant(b, S, -7.2);
    LK.meter(b, S, 2.6);
    LK.noParking(b, 7.4, {key: 'bbb_np1'});

    return (CACHE = G.done());
  }

  function bBedsBurns(x, z, t) {
    const B = mk(x, z, 20, 36, H, 0x8a3a2a, 0xa0784a, 0x2a2c30);
    B.dx = 0;
    const PT = {th: 0.16, c: 0xd8c890};
    const cp = a => a.map(o => Object.assign({}, o));
    WL(B, 1, Z1, X0, X1, cp(FRONT), H);
    for (const [a0, a1, ops] of BACKRUNS) WL(B, 1, Z0, a0, a1, cp(ops), H);
    WL(B, 0, X0, Z0, Z1, [], H);
    WL(B, 0, X1, Z0, Z1, cp(RIGHT), H);
    WL(B, 1, PZ, X0, X1, cp(PART), H, PT);
    LK.attach(B, build());
    // shade trees in the grass strip
    for (const tx of [-8.6, 8.6])
      try {
        bldTree(B, tx, 15.2, 0.9);
      } catch (e) {}
    // a box truck backed into the first bay (cab out to the alley), front = +Z at rot 0
    try {
      if (window.MFZV) {
        const g = MFZV.make('boxtruck', WX(B, BAYS[0][0]), WZ(B, Z0 - 1.2), PI + (B.cs < 0 ? PI : 0), {
          label: 'BEDS, BURNS & BEYOND',
          labelCol: '#c8282e',
          dust: true
        });
        const h = g && g.userData && g.userData.half;
        const hx = h ? h[0] : 1.3,
          hz = h ? h[1] : 3.8;
        B.occ.push([BAYS[0][0] - hx, BAYS[0][0] + hx, Z0 - 1.2 - hz, Z0 - 1.2 + hz]);
      }
    } catch (e) {}
    const SP = LK.spawner(B, 'bbb_shop');
    // shop floor: dressers, bookshelves, coffee tables, a steamer trunk at a bed foot, the till
    SP(-5.7, PZ + 0.45, 'dresser', 'bbb_shop', 0);
    SP(X1 - 0.35, 2.75, 'dresser', 'bbb_shop', -PI / 2);
    SP(6.0, PZ + 0.4, 'bookshelf', 'bbb_shop', 0);
    SP(7.3, PZ + 0.4, 'bookshelf', 'bbb_shop', 0);
    SP(-1.9, 6.3, 'coffee_table', 'bbb_shop', 0);
    SP(2.1, 6.5, 'coffee_table_round', 'bbb_shop', 0);
    SP(-5.75, 3.1, 'trunk_steamer', 'bbb_shop', PI / 2);
    SP(4.1, 8.75, 'cash_register', 'convenience', PI, 1.05);
    // delivery area: pallet racking on the left wall, the work bench and tool chest on the right, boxes
    SP(X0 + 0.65, -9.4, 'pallet_racking', 'bbb_stock', PI / 2);
    SP(X0 + 0.65, -6.4, 'pallet_racking', 'bbb_stock', PI / 2);
    SP(X1 - 0.45, -6.9, 'tool_bench', 'bbb_stock', -PI / 2);
    SP(X1 - 0.4, -8.9, 'tool_chest', 'bbb_stock', -PI / 2);
    SP(-7.9, -4.6, 'cardboard_box_large', 'bbb_stock', 0.2);
    SP(-6.9, -4.5, 'cardboard_box_medium', 'bbb_stock', -0.3);
    SP(4.4, -9.6, 'cardboard_box_medium', 'bbb_stock', 0.6);
    // outside: dumpster by the back door
    SP(8.4, -12.9, 'dumpster_blue', 'storage', PI / 2);
    return LK.finish(B, t, {
      at: [(X0 + X1) / 2, (Z0 + Z1) / 2],
      w: X1 - X0,
      d: Z1 - Z0,
      loot: ['bbb_shop', [-1, 1, 1, 8], 1],
      zombies: [
        [-4.6, 5.2],
        [0.2, 4.5],
        [4.4, 5.6],
        [-5.4, 1.7],
        [0.3, -0.6],
        [5.0, -2.2],
        [1.0, -7.5],
        [4.6, -6.0],
        [2.0, -14.5],
        [-6.5, -15.5]
      ]
    });
  }

  const e = LK.register({
    id: 'furniture_store',
    name: 'Beds, Burns & Beyond',
    build: bBedsBurns,
    note: 'half-plot furniture & fireplace superstore: big shop floor (sofas, beds, dining, fireplace showroom), drive-in delivery area with two shuttered truck bays off the alley',
    globals: {bBedsBurns, BEDSBURNS: {build}}
  });
  if (e) e.loot = 'bbb_shop';
  console.log('[bedsburns] Beds, Burns & Beyond ready');
})();
