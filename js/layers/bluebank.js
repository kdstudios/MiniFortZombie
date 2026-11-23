/* ==========================================================================================================
   MINI FORT ZOMBIE - BLUE BALLS BANK (v089): a half-plot neoclassical bank (20 x 36 m plot, front = +Z), our own design.
   Replaces the Piety Mutual Bank placeholder (core NEWCAT id piety_mutual_bank, half pool; the old hBank is no longer used).
   Exterior: a 17 x 21 m single-storey banking hall in pale ashlar stone. A portico of four fluted columns with scrolled capitals
   carries an entablature with BLUE BALLS BANK on the frieze, a dentil cornice and a parapet; blind upper windows between the columns,
   a lit sign board over bronze double doors, a granite apron, a sculpture of three blue balls on a plinth, planters, a night-deposit
   slot and an ATM in the front wall. Behind: a staff yard open to the alley with an armoured cash van, bins and board fences.
   Interior: a large banking hall (marble floor, panelled wainscot under cream plaster, coffered ceiling, chandeliers, two marble
   columns): waiting area with chesterfield sofas and armchairs, a check-writing island with green lamps, queue posts and ropes, a
   brass-grilled teller line with a wall clock over it, a customer-service desk. Back of house: the vault room (checkerboard floor,
   a row of green safes, a strongroom behind an open round vault door lined with safe-deposit boxes, cash carts, money sacks),
   a corridor to the staff door, two small offices (manager, loans) and a staff toilet.
   Structure from core WL (doors / windows work); detail is our own geometry and painted artwork, outside the static merge.
   ========================================================================================================== */
(function () {
  'use strict';
  const K = window.MFZK,
    LK = window.LOTKIT;
  if (!K || !LK || typeof WL !== 'function' || typeof NEWCAT === 'undefined') {
    console.warn('[bluebank] core / prop kit missing');
    return;
  }
  const T = THREE,
    P = K.P,
    PI = Math.PI;
  // the bank box (half plot: x -10..10), partitions, heights
  const X0 = -8.5,
    X1 = 8.5,
    Z0 = -12,
    Z1 = 9,
    PZ = -2, // banking hall / back of house
    XV = -0.6, // vault room | corridor
    XC = 1.6, // corridor | offices + toilet
    OZ1 = -5.6, // office 1 | office 2
    OZ2 = -9.0, // office 2 | toilet
    SX = -3.6, // strongroom side wall
    SZ = -7.6, // strongroom front wall
    H = 6.4,
    RC = 3.0, // ceiling of the back rooms
    CZ = 10.5; // portico column line
  const FRONT = [
    {k: 'w', c: -6.9},
    {k: 'w', c: -3.6},
    {k: 'd', c: -0.65, dbl: 'swing'},
    {k: 'd', c: 0.65, dbl: 'swing'},
    {k: 'w', c: 3.6},
    {k: 'w', c: 6.9}
  ];
  const LEFT = [
    {k: 'w', c: 1.6},
    {k: 'w', c: 5.6}
  ];
  const RIGHT = [
    {k: 'w', c: -7.3}, // loans office
    {k: 'w', c: -3.8}, // manager's office
    {k: 'w', c: 1.6},
    {k: 'w', c: 5.6}
  ];
  const BACKD = [{k: 'd', c: 0.5, s: -1}]; // staff door off the corridor
  const PART = [{k: 'd', c: 0.5}]; // STAFF ONLY door from the hall
  const VAULTD = [{k: 'd', c: -4.0}]; // corridor -> vault room
  const OFFD = [
    {k: 'd', c: -10.5}, // toilet
    {k: 'd', c: -7.3}, // loans office
    {k: 'd', c: -3.8} // manager's office
  ];
  const STRONG = [{k: 'g', c: -5.6}]; // the strongroom opening behind the round door

  /* ===================== loot tables ===================== */
  // tellers, the vault room and strongroom, offices, the staff toilet; materials where a bank would have them
  try {
    Object.assign(LOOT_TABLES, {
      bbk_teller: {
        painkiller: 2,
        granola: 2,
        colacola: 2,
        water_jug: 1,
        duct_tape: 2,
        rope: 1,
        nails: 1,
        ammo_9mm: 2,
        beretta_9mm: 1
      },
      bbk_vault: {
        ammo_9mm: 3,
        ammo_45: 3,
        ammo_38_fed: 2,
        ammo_357: 1,
        beretta_9mm: 1,
        m1911a1: 1,
        colt_python: 1,
        military_rations: 2,
        medkit: 1,
        gas_cylinder: 1,
        car_battery: 1,
        duct_tape: 2
      },
      bbk_store: {
        duct_tape: 4,
        rope: 3,
        nails: 3,
        bungie_cord: 2,
        spring: 2,
        spray_paint: 2,
        car_battery: 1,
        gas_cylinder: 1,
        water_jug: 1,
        military_rations: 1
      },
      bbk_office: {
        stugots_coffee: 2,
        cookies: 2,
        colacola: 2,
        painkiller: 2,
        duct_tape: 2,
        nails: 1,
        rope: 1,
        spray_paint: 1,
        ammo_38_fed: 1
      },
      bbk_wc: {painkiller: 2, gauze: 2, cotton_balls: 2, medical_tape: 1, bug_spray: 1}
    });
    const TB = ['bbk_teller', 'bbk_vault', 'bbk_store', 'bbk_office', 'bbk_wc'];
    for (const tn of TB)
      for (const id in LOOT_TABLES[tn])
        if (!ITEMS[id]) {
          console.error('[bluebank] loot table ' + tn + ' has unknown item ' + id);
          delete LOOT_TABLES[tn][id];
        }
    if (typeof LOOT_PROP !== 'undefined')
      Object.assign(LOOT_PROP, {
        bbk_teller: 'cabinet',
        bbk_vault: 'toolchest',
        bbk_store: 'cabinet',
        bbk_office: 'cabinet',
        bbk_wc: 'cabinet'
      });
    const A = window.MFZPROP && MFZPROP.auto;
    if (A) {
      const pick = (...ts) => [...new Set(ts.flatMap(t => A[t] || []))];
      A.bbk_teller = pick('bank', 'office');
      A.bbk_vault = pick('bankvault', 'bank');
      A.bbk_store = pick('storage', 'bank');
      A.bbk_office = pick('office', 'house');
      A.bbk_wc = pick('house', 'clinic');
    }
  } catch (e) {
    console.warn('[bluebank] loot tables', e);
  }

  /* ===================== lootable prop: the green bank safe ===================== */
  // an old standing safe in olive-green paint: dial, handle, hinges, a maker's plate; front = +z
  K.def('bank_safe', {label: 'Bank safe', table: 'bbk_vault', items: [2, 4], auto: ['bankvault']}, b => {
    const body = K.paintSteel(0x6e7a5a, {m: 0.45, r: 0.5}),
      edge = K.paintSteel(0x5a6448, {m: 0.5, r: 0.45}),
      ch = K.chrome(),
      brass = K.mat(0xc8a048, 0.3, 0.9),
      W = 0.78,
      Hh = 1.25,
      D = 0.72;
    b.rbox(W, Hh, D, 0.03, body, [0, Hh / 2 + 0.06, 0]);
    b.rbox(W - 0.1, Hh - 0.12, 0.04, 0.02, edge, [0, Hh / 2 + 0.06, D / 2 + 0.01]); // door
    for (const y of [0.3, Hh - 0.15]) b.cyl(0.025, 0.025, 0.16, ch, [W / 2 - 0.04, y, D / 2 + 0.02], null, 10); // hinges
    b.cyl(0.07, 0.07, 0.03, ch, [-0.05, Hh * 0.62, D / 2 + 0.045], [PI / 2, 0, 0], 20); // dial
    b.cyl(0.05, 0.05, 0.02, K.mat(0x1a1a1a, 0.4), [-0.05, Hh * 0.62, D / 2 + 0.06], [PI / 2, 0, 0], 16);
    b.handle(0.22, ch, [-0.05, Hh * 0.42, D / 2 + 0.03], false, 0.04);
    b.box(0.16, 0.06, 0.01, brass, [-0.05, Hh * 0.85, D / 2 + 0.035], null, 0); // maker's plate
    b.box(0.03, 0.18, 0.01, K.mat(0xe8e4d8, 0.8), [-0.28, Hh * 0.4, D / 2 + 0.035], null, 0); // label strip
    for (const x of [-W / 2 + 0.08, W / 2 - 0.08])
      for (const z of [-D / 2 + 0.08, D / 2 - 0.08])
        b.cyl(0.03, 0.035, 0.06, K.mat(0x2a2a2a, 0.5), [x, 0.03, z], null, 8);
  });

  /* ===================== artwork ===================== */
  const BLUE = '#1f5fd0',
    NAVY = '#0e2348',
    GOLD = '#d8b860';
  // the logo: three glossy blue balls in a triangle
  const drawBalls = (c, cx, cy, r) => {
    for (const [dx, dy] of [
      [-1, 0.58],
      [1, 0.58],
      [0, -1.15]
    ]) {
      const x = cx + dx * r * 1.05,
        y = cy + dy * r * 1.0;
      const g = c.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
      g.addColorStop(0, '#9cc4ff');
      g.addColorStop(0.45, BLUE);
      g.addColorStop(1, '#0a2a6a');
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, y, r, 0, PI * 2);
      c.fill();
    }
  };
  const textMat = (key, w, h, text, font, bg, fg, logo) =>
    K.paint(key, w, h, (c, W, H) => {
      if (bg) {
        c.fillStyle = bg;
        c.fillRect(0, 0, W, H);
      }
      // v090: the text is fitted between the balls and the right edge (it ran over the balls and off the end: "BLUE BALLS BA-")
      let l = W * 0.04;
      if (logo) {
        drawBalls(c, H * 0.55, H / 2 + H * 0.05, H * 0.2);
        l = H * 1.12;
      }
      const r = W - W * 0.04;
      c.fillStyle = fg;
      c.font = font;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      const tw = c.measureText(text).width,
        k = Math.min(1, (r - l) / tw),
        x0 = (l + r) / 2;
      c.save();
      c.translate(x0, H / 2 + 2);
      c.scale(k, 1);
      c.fillText(text, 0, 0);
      c.restore();
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
      // pale ashlar: long blocks in courses with fine joints, a little grime
      ashlar: () =>
        K.tri(
          'bbk_ashlar',
          (c, W, H, r) => {
            c.fillStyle = '#8e8c88';
            c.fillRect(0, 0, W, H);
            const rh = H / 6;
            for (let j = 0; j < 6; j++) {
              let x = -(j % 2) * 64;
              while (x < W) {
                const w = 110 + r() * 40;
                c.fillStyle = `hsl(40,${3 + r() * 4}%,${78 + r() * 8}%)`;
                c.fillRect(x + 2, j * rh + 2, w - 4, rh - 4);
                x += w;
              }
            }
            P.noise(c, W, H, r, 6000, 0.12, '#6a6864', 1.2);
            P.grime(c, W, H, r, 0.25);
          },
          {tile: 2.4, r: 0.9}
        ),
      // smooth dressed stone for columns, cornices, plinths
      dressed: () =>
        K.tri(
          'bbk_dressed',
          (c, W, H, r) => {
            c.fillStyle = '#dcd8d0';
            c.fillRect(0, 0, W, H);
            P.noise(c, W, H, r, 5000, 0.08, '#8a8680', 1.2);
            P.grime(c, W, H, r, 0.15);
          },
          {tile: 1.5, r: 0.8}
        ),
      granite: () =>
        K.tri(
          'bbk_granite',
          (c, W, H, r) => {
            c.fillStyle = '#6a6866';
            c.fillRect(0, 0, W, H);
            P.noise(c, W, H, r, 14000, 0.4, '#2a2a2c', 1.4);
            P.noise(c, W, H, r, 6000, 0.3, '#b8b4ae', 1.2);
          },
          {tile: 1.2, r: 0.5}
        ),
      // hall floor: cream marble slabs with a dark border band
      marble: () =>
        K.tri(
          'bbk_marble',
          (c, W, H, r) => {
            c.fillStyle = '#e6e0d4';
            c.fillRect(0, 0, W, H);
            for (let k = 0; k < 40; k++) {
              c.strokeStyle = 'rgba(150,140,130,.28)';
              c.lineWidth = 0.6 + r() * 1.4;
              c.beginPath();
              let x = r() * W,
                y = r() * H;
              c.moveTo(x, y);
              for (let q = 0; q < 6; q++) {
                x += (r() - 0.4) * 60;
                y += (r() - 0.5) * 40;
                c.lineTo(x, y);
              }
              c.stroke();
            }
            c.fillStyle = 'rgba(90,80,70,.4)';
            c.fillRect(0, 0, W, 2);
            c.fillRect(0, 0, 2, H);
            c.fillRect(0, H / 2, W, 1.5);
            c.fillRect(W / 2, 0, 1.5, H);
          },
          {tile: 2.0, r: 0.25}
        ),
      // vault room: black / white checkerboard
      checker: () =>
        K.tri(
          'bbk_checker',
          (c, W, H, r) => {
            const n = 2,
              s = W / n;
            for (let i = 0; i < n; i++)
              for (let j = 0; j < n; j++) {
                c.fillStyle = (i + j) % 2 ? '#141416' : '#d8d8d4';
                c.fillRect(i * s, j * s, s, s);
              }
            P.noise(c, W, H, r, 4000, 0.08, '#6a6a6a', 1.2);
            c.fillStyle = 'rgba(120,120,120,.6)';
            c.fillRect(0, 0, W, 3);
            c.fillRect(0, 0, 3, H);
            c.fillRect(0, H / 2 - 1, W, 2);
            c.fillRect(W / 2 - 1, 0, 2, H);
          },
          {tile: 1.6, r: 0.4}
        ),
      plaster: () => K.mat(0xece4d2, 0.9),
      wains: () => K.veneer(0x5a3820),
      coping: () => K.mat(0xd8d4cc, 0.6),
      bronze: () => K.mat(0x6a4a28, 0.35, 0.8),
      brass: () => K.mat(0xc8a048, 0.3, 0.9),
      vaultSteel: () => K.paintSteel(0x6e7a5a, {m: 0.5, r: 0.45})
    }[k]());

  /* ===================== geometry ===================== */
  let CACHE = null;
  function build() {
    if (CACHE) return CACHE;
    const G = LK.geo('bluebank'),
      b = G.b,
      S = G.S;
    const conc = surf('concrete'),
      asph = surf('asphalt');
    /* ---------- grounds: sidewalk, granite apron, grass strip, side walks, staff yard ---------- */
    LK.pavement(b, conc, {w: 20, kerb: true});
    b.box(20, 0.04, 14.6 - Z1, conc, [0, 0.02, (Z1 + 14.6) / 2], null, 0); // front apron
    b.box(X1 - X0 + 1.2, 0.06, 3.4, surf('granite'), [0, 0.04, Z1 + 1.7], null, 0); // granite portico floor
    b.box(20, 0.03, 1.2, surf('lawn'), [0, 0.025, 15.2], null, 0); // grass strip by the sidewalk
    b.box(1.5, 0.04, Z1 - Z0, conc, [-9.25, 0.02, (Z0 + Z1) / 2], null, 0); // side walks
    b.box(1.5, 0.04, Z1 - Z0, conc, [9.25, 0.02, (Z0 + Z1) / 2], null, 0);
    b.box(20, 0.02, 18 + Z0, asph, [0, 0.012, (-18 + Z0) / 2], null, 0); // staff yard, out to the alley

    const ash = surf('ashlar'),
      dres = surf('dressed'),
      gran = surf('granite'),
      cop = surf('coping'),
      bronze = surf('bronze'),
      brass = surf('brass'),
      dark = K.mat(0x1c1c1e, 0.5),
      black = K.mat(0x141416, 0.45, 0.4),
      steel = K.mat(0x9a9ea2, 0.4, 0.7),
      chrome = K.chrome(),
      leaf = K.mat(0x3e6a2e, 0.85),
      leaf2 = K.mat(0x557f38, 0.85),
      soil = K.mat(0x3a2a1c, 0.95),
      blueM = K.mat(0x1f5fd0, 0.25, 0.3),
      navyM = K.mat(0x0e2348, 0.5),
      lit = K.mat(0xffffff, 0.4, 0, {emissive: 0xf6f8ff, emissiveIntensity: 0.95}),
      warm = K.mat(0xfff2c8, 0.4, 0, {emissive: 0xffd890, emissiveIntensity: 1.3}),
      blindGl = K.mat(0x2a3440, 0.15, 0.6);
    const rb = (w, h, d, r, m, p, rot) => b.rbox(w, h, d, r, m, p, rot, 1);
    let sd = 7;
    const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;

    /* ---------- exterior skin: pale ashlar all round on a granite plinth ---------- */
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
        } else pc(p.c - hw, p.c + hw, 2.4, H);
        a = p.c + hw;
      }
      pc(a, a1, 0, H);
    };
    skin(1, Z1, X0 - 0.15, X1 + 0.15, 1, FRONT, ash);
    skin(0, X1, Z0, Z1, 1, RIGHT, ash);
    skin(0, X0, Z0, Z1, -1, LEFT, ash);
    skin(1, Z0, X0 - 0.15, X1 + 0.15, -1, BACKD, ash);
    // granite plinth band and a string course all round
    const band = (y0, y1, m, out) => {
      const h = y1 - y0,
        y = (y0 + y1) / 2,
        o = 0.19 + out;
      if (y0 < 2.4) {
        const g = 1.33; // the door surround's half width
        for (const [u0, u1] of [
          [X0 - o, -g],
          [g, X1 + o]
        ])
          b.box(u1 - u0, h, 0.05, m, [(u0 + u1) / 2, y, Z1 + o], null, 0);
      } else b.box(X1 - X0 + 2 * o, h, 0.05, m, [0, y, Z1 + o], null, 0);
      b.box(X1 - X0 + 2 * o, h, 0.05, m, [0, y, Z0 - o], null, 0);
      for (const s of [-1, 1]) b.box(0.05, h, Z1 - Z0 + 2 * o, m, [s * (X1 + o), y, (Z0 + Z1) / 2], null, 0);
    };
    band(0, 0.6, gran, 0.02);
    // v090: the granite plinth no longer runs across the front doors: a gap the width of the door surround is cut out of it
    // (the band() front strip is replaced by two runs either side)
    band(3.05, 3.25, dres, 0.03);
    // flat pilasters at the front corners
    for (const s of [-1, 1]) {
      b.box(0.7, H - 0.6, 0.12, dres, [s * (X1 - 0.2), 0.6 + (H - 0.6) / 2, Z1 + 0.24], null, 0.01);
      b.box(0.85, 0.3, 0.2, dres, [s * (X1 - 0.2), H - 0.15, Z1 + 0.27], null, 0.01);
    }
    // window surrounds: stone architraves, sills and keystones; dark bronze frames
    const surround = (ax, f, n, c) => {
      b.push(ax ? [c, 0, f + n * 0.19] : [f + n * 0.19, 0, c], [0, ax ? (n > 0 ? 0 : PI) : (n * PI) / 2, 0]);
      b.box(1.86, 0.12, 0.22, dres, [0, 0.86, 0.06], null, 0.01); // sill
      for (const s of [-1, 1]) b.box(0.16, 1.95, 0.08, dres, [s * 0.83, 1.83, 0.03], null, 0);
      b.box(1.82, 0.2, 0.1, dres, [0, 2.86, 0.04], null, 0);
      b.box(0.3, 0.36, 0.14, dres, [0, 2.86, 0.06], null, 0.01); // keystone
      b.frame(1.5, 1.85, 0.06, bronze, [0, 1.825, 0.0], 0.06);
      b.box(1.5, 0.04, 0.03, bronze, [0, 2.1, 0.0], null, 0); // transom bar
      b.pop();
    };
    for (const w of FRONT.filter(p => p.k === 'w')) surround(1, Z1, 1, w.c);
    for (const w of LEFT) surround(0, X0, -1, w.c);
    for (const w of RIGHT) surround(0, X1, 1, w.c);
    // blind upper windows between the columns (dark glass in bronze frames under stone heads)
    for (const ux of [-6.9, -3.6, 0, 3.6, 6.9]) {
      b.box(1.3, 1.6, 0.03, blindGl, [ux, 4.45, Z1 + 0.19], null, 0);
      b.frame(1.3, 1.6, 0.06, bronze, [ux, 4.45, Z1 + 0.2], 0.05);
      b.box(1.3, 0.04, 0.04, bronze, [ux, 4.45, Z1 + 0.21], null, 0);
      b.box(0.04, 1.6, 0.04, bronze, [ux, 4.45, Z1 + 0.21], null, 0);
      b.box(1.6, 0.12, 0.18, dres, [ux, 3.6, Z1 + 0.25], null, 0.01);
      b.box(1.6, 0.18, 0.12, dres, [ux, 5.35, Z1 + 0.24], null, 0.01);
    }
    // door surround: tall bronze frame, glazed fanlight, BLUE BALLS BANK sign board over the doors
    b.box(3.0, 0.2, 0.14, dres, [0, 2.55, Z1 + 0.22], null, 0.01);
    for (const s of [-1, 1]) b.box(0.18, 2.5, 0.12, dres, [s * 1.42, 1.25, Z1 + 0.22], null, 0);
    b.frame(2.6, 2.4, 0.08, bronze, [0, 1.2, Z1 + 0.19], 0.06);
    const boardM = textMat('bbk_board', 512, 128, 'BLUE BALLS BANK', 'bold 52px Georgia, serif', NAVY, GOLD, true);
    b.box(2.9, 0.62, 0.1, navyM, [0, 2.98, Z1 + 0.25], null, 0.01);
    b.label(2.8, 0.55, boardM, [0, 2.98, Z1 + 0.31]);
    b.box(2.9, 0.04, 0.12, brass, [0, 3.3, Z1 + 0.26], null, 0);
    b.box(2.9, 0.04, 0.12, brass, [0, 2.66, Z1 + 0.26], null, 0);
    b.label(
      2.6,
      0.24,
      K.paint('bbk_motto2', 512, 48, (c, W, Hh) => {
        c.fillStyle = '#dcd8d0';
        c.fillRect(0, 0, W, Hh);
        c.fillStyle = '#3a3a3a';
        c.font = 'italic 26px Georgia, serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText('"We Handle Your Assets With Care"', W / 2, Hh / 2 + 2);
      }),
      [0, 3.45, Z1 + 0.2]
    );
    // night-deposit slot (left of the doors) and an ATM (right of the doors), set into the stone
    b.box(0.7, 0.9, 0.08, bronze, [-2.1, 1.35, Z1 + 0.22], null, 0.01);
    b.box(0.5, 0.12, 0.04, black, [-2.1, 1.5, Z1 + 0.27], null, 0);
    b.label(0.5, 0.12, textMat('bbk_night', 256, 48, 'NIGHT DEPOSIT', 'bold 26px Arial', '#6a4a28', '#e8d8a8'), [
      -2.1,
      1.7,
      Z1 + 0.27
    ]);
    b.box(0.9, 1.7, 0.14, K.mat(0x2a2e34, 0.4, 0.5), [2.1, 1.25, Z1 + 0.24], null, 0.01);
    b.box(
      0.72,
      0.18,
      0.04,
      K.mat(0x1f5fd0, 0.4, 0, {emissive: 0x2a6ae0, emissiveIntensity: 0.9}),
      [2.1, 1.95, Z1 + 0.32],
      null,
      0
    );
    b.box(
      0.42,
      0.32,
      0.03,
      K.mat(0x9ad0ff, 0.2, 0, {emissive: 0x6ab0ff, emissiveIntensity: 0.6}),
      [2.1, 1.55, Z1 + 0.32],
      null,
      0
    );
    b.box(0.5, 0.06, 0.18, steel, [2.1, 1.22, Z1 + 0.36], [0.4, 0, 0], 0.01); // keypad shelf
    b.box(0.3, 0.03, 0.04, black, [2.1, 1.05, Z1 + 0.32], null, 0); // cash slot

    /* ---------- portico: four fluted columns, entablature with the name on the frieze, dentil cornice ---------- */
    const fluteM = K.paint(
      'bbk_flutes',
      256,
      64,
      (c, W, Hh) => {
        c.fillStyle = '#dedad2';
        c.fillRect(0, 0, W, Hh);
        const n = 20,
          s = W / n;
        for (let i = 0; i < n; i++) {
          const g = c.createLinearGradient(i * s, 0, (i + 1) * s, 0);
          g.addColorStop(0, '#f2eee6');
          g.addColorStop(0.35, '#b8b4ac');
          g.addColorStop(0.7, '#cfcbc3');
          g.addColorStop(1, '#f4f0e8');
          c.fillStyle = g;
          c.fillRect(i * s + 1, 0, s - 2, Hh);
        }
      },
      {r: 0.8}
    );
    const CXS = [-5.25, -2.15, 2.15, 5.25],
      SH0 = 0.55, // shaft start
      SH1 = H - 1.15; // shaft top
    for (const cx of CXS) {
      b.box(0.92, 0.28, 0.92, gran, [cx, 0.2, CZ], null, 0.01); // plinth
      b.cyl(0.46, 0.48, 0.12, dres, [cx, 0.4, CZ], null, 24);
      b.cyl(0.42, 0.46, 0.08, dres, [cx, 0.5, CZ], null, 24);
      b.cyl(0.33, 0.37, SH1 - SH0, fluteM, [cx, (SH0 + SH1) / 2, CZ], null, 24);
      b.cyl(0.37, 0.34, 0.12, dres, [cx, SH1 + 0.06, CZ], null, 24); // necking
      // scrolled (ionic) capital: echinus, two volutes, abacus
      b.cyl(0.44, 0.36, 0.14, dres, [cx, SH1 + 0.19, CZ], null, 24);
      b.box(0.9, 0.16, 0.5, dres, [cx, SH1 + 0.32, CZ], null, 0.02);
      for (const s of [-1, 1]) {
        b.cyl(0.13, 0.13, 0.52, dres, [cx + s * 0.42, SH1 + 0.24, CZ], [PI / 2, 0, 0], 16);
        b.cyl(0.06, 0.06, 0.54, K.mat(0xb0aca4, 0.8), [cx + s * 0.42, SH1 + 0.24, CZ], [PI / 2, 0, 0], 10);
      }
      b.box(0.96, 0.12, 0.96, dres, [cx, SH1 + 0.46, CZ], null, 0.01);
      S(cx - 0.42, cx + 0.42, CZ - 0.42, CZ + 0.42, 0, SH1 + 0.5);
    }
    // entablature: architrave, frieze (lettered), cornice with dentils; soffit under it back to the wall
    const E0 = SH1 + 0.52, // underside of the architrave
      ex0 = -6.1,
      ex1 = 6.1,
      ew = ex1 - ex0,
      eFront = CZ + 0.5,
      eD = eFront - Z1;
    b.box(ew, 0.5, eD, dres, [0, E0 + 0.25, Z1 + eD / 2], null, 0); // architrave (whole depth: also the porch ceiling)
    b.box(ew + 0.06, 0.06, 0.06, dres, [0, E0 + 0.47, eFront + 0.02], null, 0);
    b.box(ew, 0.8, 0.12, dres, [0, E0 + 0.9, eFront - 0.06], null, 0); // frieze face
    b.box(ew, 0.8, eD - 0.12, ash, [0, E0 + 0.9, Z1 + (eD - 0.12) / 2], null, 0);
    const friezeM = K.paint(
      'bbk_frieze',
      1024,
      96,
      (c, W, Hh) => {
        c.fillStyle = '#dcd8d0';
        c.fillRect(0, 0, W, Hh);
        c.fillStyle = '#2a2a2c';
        c.font = 'bold 64px Georgia, serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        // v090: the lettering is fitted between the two ball emblems (it ran into them)
        const tw = c.measureText('B L U E   B A L L S   B A N K').width,
          room = W - 2 * 130,
          k = Math.min(1, room / tw);
        c.save();
        c.translate(W / 2, Hh / 2 + 4);
        c.scale(k, 1);
        c.fillText('B L U E   B A L L S   B A N K', 0, 0);
        c.restore();
        drawBalls(c, 70, Hh / 2 + 6, 15);
        drawBalls(c, W - 70, Hh / 2 + 6, 15);
      },
      {r: 0.8}
    );
    b.label(ew - 0.4, 0.7, friezeM, [0, E0 + 0.9, eFront + 0.005]);
    for (const s of [-1, 1])
      b.label(eD - 0.1, 0.7, K.mat(0xdcd8d0, 0.8), [s * (ew / 2 + 0.005), E0 + 0.9, Z1 + eD / 2], [0, (s * PI) / 2, 0]);
    // dentils + cornice
    const C0 = E0 + 1.3;
    for (let dx = ex0 + 0.12; dx < ex1; dx += 0.24)
      b.box(0.12, 0.14, 0.12, dres, [dx, C0 + 0.07, eFront + 0.06], null, 0);
    b.box(ew + 0.5, 0.12, eD + 0.4, dres, [0, C0 + 0.2, Z1 + (eD + 0.4) / 2], null, 0.01);
    b.box(ew + 0.7, 0.16, 0.5, dres, [0, C0 + 0.34, eFront + 0.2], null, 0.02);
    b.box(ew + 0.5, 0.08, eD + 0.3, cop, [0, C0 + 0.46, Z1 + (eD + 0.3) / 2], null, 0);
    // porch lanterns hung from the soffit
    for (const lx of [-3.7, 3.7]) {
      b.cyl(0.01, 0.01, 0.6, black, [lx, E0 - 0.3, Z1 + 0.9], null, 4);
      b.cyl(0.14, 0.18, 0.4, black, [lx, E0 - 0.8, Z1 + 0.9], null, 6, true);
      b.cyl(0.12, 0.12, 0.3, warm, [lx, E0 - 0.82, Z1 + 0.9], null, 8);
    }

    /* ---------- parapet with coping, flat roof, HVAC ---------- */
    const par = (ax, f, a0, a1, m, h, y0) => {
      const L = a1 - a0,
        u = (a0 + a1) / 2;
      if (ax) {
        b.box(L, h, 0.3, m, [u, y0 + h / 2, f], null, 0);
        b.box(L + 0.1, 0.07, 0.42, cop, [u, y0 + h + 0.03, f], null, 0.01);
      } else {
        b.box(0.3, h, L, m, [f, y0 + h / 2, u], null, 0);
        b.box(0.42, 0.07, L + 0.1, cop, [f, y0 + h + 0.03, u], null, 0.01);
      }
    };
    // a dentil cornice band all round the main block at roof level, then the parapet
    band(H - 0.05, H + 0.15, dres, 0.08);
    band(H + 0.15, H + 0.3, dres, 0.16);
    par(1, Z1, X0 - 0.15, X1 + 0.15, ash, 1.0, H + 0.3);
    par(1, Z0, X0 - 0.15, X1 + 0.15, ash, 0.6, H + 0.3);
    par(0, X0, Z0, Z1 - 0.15, ash, 0.6, H + 0.3);
    par(0, X1, Z0, Z1 - 0.15, ash, 0.6, H + 0.3);
    b.box(X1 - X0, 0.12, Z1 - Z0, K.surf('concrete', 0x5a5a58), [0, H + 0.02, (Z0 + Z1) / 2], null, 0);
    b.box(X1 - X0 - 0.3, 0.02, Z1 - Z0 - 0.3, K.mat(0x3a3c40, 0.9), [0, H + 0.09, (Z0 + Z1) / 2], null, 0);
    for (const [hx, hz] of [
      [-4.5, -6],
      [4.2, -1.0]
    ]) {
      rb(2.0, 1.0, 1.4, 0.03, K.mat(0xb0b4b8, 0.4, 0.7), [hx, H + 0.6, hz]);
      b.vents(6, 1.8, 0.7, K.mat(0x6a6c6e, 0.5, 0.6), [hx, H + 0.6, hz + 0.71]);
      b.cyl(0.5, 0.5, 0.1, K.mat(0x2a2a2a, 0.5, 0.4), [hx, H + 1.15, hz], null, 20);
    }
    for (const [vx, vz] of [
      [-6.5, 4],
      [6.5, -8],
      [0, -3]
    ])
      b.cyl(0.08, 0.08, 0.8, K.mat(0x7a7c7e, 0.4, 0.7), [vx, H + 0.5, vz], null, 10);
    // flagpole on the front parapet with a blue flag
    b.cyl(0.04, 0.05, 4.2, chrome, [X0 + 0.6, H + 2.4, Z1 - 0.4], null, 10);
    b.sph(0.08, brass, [X0 + 0.6, H + 4.55, Z1 - 0.4]);
    const flagM = K.paint(
      'bbk_flag',
      256,
      160,
      (c, W, Hh) => {
        c.fillStyle = BLUE;
        c.fillRect(0, 0, W, Hh);
        c.fillStyle = '#ffffff';
        c.fillRect(0, Hh - 22, W, 10);
        drawBalls(c, W / 2, Hh / 2 - 6, 26);
      },
      {r: 0.9}
    );
    b.label(1.6, 1.0, flagM, [X0 + 1.42, H + 3.9, Z1 - 0.4], [0, 0, 0]);
    b.label(1.6, 1.0, flagM, [X0 + 1.42, H + 3.9, Z1 - 0.41], [0, PI, 0]);

    /* ---------- front apron: three blue balls on a plinth, planters, bench, bins, bollards ---------- */
    {
      const sx = -5.6,
        sz = 13.0;
      b.box(1.8, 0.9, 1.8, gran, [sx, 0.45, sz], null, 0.02);
      b.box(2.0, 0.1, 2.0, dres, [sx, 0.95, sz], null, 0.01);
      b.label(
        1.4,
        0.3,
        textMat('bbk_plaque', 512, 96, 'BLUE BALLS BANK · EST. 1921', 'bold 36px Georgia, serif', '#6a4a28', '#e8d8a8'),
        [sx, 0.55, sz + 0.905]
      );
      const ballM = K.mat(0x1f5fd0, 0.15, 0.55);
      for (const [dx, dz] of [
        [-0.42, 0.25],
        [0.42, 0.25],
        [0, -0.48]
      ])
        b.sph(0.45, ballM, [sx + dx, 1.45, sz + dz], null, 22);
      b.sph(0.45, ballM, [sx, 2.2, sz + 0.0], null, 22);
      S(sx - 1.0, sx + 1.0, sz - 1.0, sz + 1.0, 0, 2.7);
    }
    const planter = (px, pz) => {
      rb(1.1, 0.6, 1.1, 0.03, dres, [px, 0.3, pz]);
      b.box(0.96, 0.05, 0.96, soil, [px, 0.58, pz], null, 0);
      for (let i = 0; i < 6; i++)
        b.sph(
          0.22 + rnd() * 0.08,
          i % 2 ? leaf : leaf2,
          [px + (rnd() - 0.5) * 0.6, 0.75 + rnd() * 0.2, pz + (rnd() - 0.5) * 0.6],
          null,
          8
        );
      S(px - 0.55, px + 0.55, pz - 0.55, pz + 0.55, 0, 0.9, true);
    };
    planter(3.6, 12.8);
    planter(7.6, 12.8);
    // bench between the planters
    {
      const bx = 5.6,
        bz = 12.8;
      for (const s of [-1, 1]) b.box(0.08, 0.45, 0.5, black, [bx + s * 0.75, 0.225, bz], null, 0);
      for (let i = 0; i < 4; i++)
        b.box(1.7, 0.04, 0.09, K.surf('wood', 0x7a5a3a), [bx, 0.46, bz - 0.17 + i * 0.11], null, 0.005);
      for (let i = 0; i < 2; i++)
        b.box(1.7, 0.09, 0.03, K.surf('wood', 0x7a5a3a), [bx, 0.65 + i * 0.13, bz - 0.24], null, 0.005);
      S(bx - 0.85, bx + 0.85, bz - 0.28, bz + 0.25, 0, 0.8, true);
    }
    // bronze bollards in front of the portico
    for (const bx of [-7.6, -3.6, 3.6, 7.6]) {
      b.cyl(0.11, 0.13, 0.9, bronze, [bx, 0.45, 14.2], null, 12);
      b.sph(0.12, bronze, [bx, 0.92, 14.2]);
      S(bx - 0.13, bx + 0.13, 14.07, 14.33, 0, 1, true);
    }
    // litter bin by the doors
    b.cyl(0.26, 0.24, 0.85, black, [1.6, 0.43, Z1 + 3.0], null, 14);
    b.cyl(0.28, 0.28, 0.05, brass, [1.6, 0.86, Z1 + 3.0], null, 14);
    S(1.34, 1.86, Z1 + 2.74, Z1 + 3.26, 0, 0.9, true);

    /* ---------- staff yard behind: door hood, CCTV, wall packs, bins, board fences ---------- */
    b.box(1.8, 0.1, 1.1, K.mat(0x4a4c50, 0.5, 0.5), [0.5, 2.7, Z0 - 0.7], [0.12, 0, 0], 0.01);
    b.label(
      0.9,
      0.24,
      textMat('bbk_staff', 256, 64, 'STAFF ONLY', 'bold 34px Arial', '#c8302a', '#ffffff'),
      [0.5, 2.35, Z0 - 0.2],
      [0, PI, 0]
    );
    for (const wx of [-5, 5]) {
      b.box(0.3, 0.2, 0.18, K.mat(0x3a3c40, 0.5, 0.5), [wx, 3.4, Z0 - 0.27], null, 0.01);
      b.box(0.24, 0.02, 0.12, warm, [wx, 3.29, Z0 - 0.3], null, 0);
    }
    for (const [cx2, cz2, a] of [
      [X1 + 0.3, Z0 - 0.3, -PI * 0.75],
      [X0 - 0.3, Z1 + 0.3, PI * 0.25]
    ]) {
      b.push([cx2, 4.6, cz2], [0, a, 0]);
      b.box(0.08, 0.08, 0.3, K.mat(0xe8e8e4, 0.5), [0, 0, 0.12], null, 0);
      b.box(0.14, 0.12, 0.34, K.mat(0xe8e8e4, 0.5), [0, -0.08, 0.32], [0.3, 0, 0], 0.01);
      b.pop();
    }
    // wheelie bins and a shredding bin by the staff door
    for (const [wx, col] of [
      [3.0, 0x2a6a3a],
      [3.9, 0x1a3a8a]
    ]) {
      rb(0.7, 1.0, 0.8, 0.03, K.mat(col, 0.6), [wx, 0.5, Z0 - 1.0]);
      b.box(0.74, 0.06, 0.84, K.mat(col, 0.55), [wx, 1.03, Z0 - 1.0], [0.06, 0, 0], 0.01);
      S(wx - 0.36, wx + 0.36, Z0 - 1.42, Z0 - 0.58, 0, 1.1, true);
    }
    rb(0.8, 1.1, 0.7, 0.03, K.mat(0x2a2c30, 0.5), [5.0, 0.55, Z0 - 0.9]);
    b.label(
      0.6,
      0.16,
      textMat('bbk_shred', 256, 48, 'SECURE SHRED', 'bold 28px Arial', '#2a2c30', '#e8e8e4'),
      [5.0, 0.8, Z0 - 1.26],
      [0, PI, 0]
    );
    S(4.6, 5.4, Z0 - 1.25, Z0 - 0.55, 0, 1.15, true);
    // board fences down both sides, out to the alley
    const fenceM = surf('fence');
    for (const fx of [-9.9, 9.9]) {
      const fz0 = -17.4,
        fz1 = Z0 + 1.2;
      b.box(0.06, 1.8, fz1 - fz0, fenceM, [fx, 0.9, (fz0 + fz1) / 2], null, 0);
      for (let pz = fz0; pz <= fz1; pz += 2.4) b.box(0.1, 1.9, 0.1, fenceM, [fx, 0.95, pz], null, 0);
      S(fx - 0.05, fx + 0.05, fz0, fz1, 0, 1.9, true);
    }

    /* ---------- interior: floors, linings, ceilings, lights ---------- */
    const p = 0.075, // half a partition, so a lining lands on its face
      q = 0.15, // half a strongroom wall
      IN = 0.16,
      HT = H - 0.1;
    const flr = (x0, x1, z0, z1, m, y) =>
      b.box(x1 - x0, 0.02, z1 - z0, m, [(x0 + x1) / 2, y || 0.035, (z0 + z1) / 2], null, 0);
    const tileW = K.tri(
      'bbk_tile',
      (c, W, Hh) => {
        c.fillStyle = '#c8ccc8';
        c.fillRect(0, 0, W, Hh);
        const n = 4,
          s = W / n;
        c.fillStyle = '#f2f2ee';
        for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) c.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
      },
      {tile: 0.6, r: 0.3}
    );
    const panelW = K.tri(
      'bbk_panel',
      (c, W, Hh, r) => {
        c.fillStyle = '#3a2416';
        c.fillRect(0, 0, W, Hh);
        const n = 2,
          s = W / n;
        for (let i = 0; i < n; i++) {
          c.fillStyle = '#4e321e';
          c.fillRect(i * s + 22, 30, s - 44, Hh - 60);
          c.strokeStyle = 'rgba(0,0,0,.5)';
          c.lineWidth = 4;
          c.strokeRect(i * s + 22, 30, s - 44, Hh - 60);
          c.strokeStyle = 'rgba(255,220,180,.12)';
          c.lineWidth = 2;
          c.strokeRect(i * s + 30, 38, s - 60, Hh - 76);
        }
        P.noise(c, W, Hh, r, 4000, 0.1, '#1a0c04', 1.2);
      },
      {tile: 1.0, r: 0.6}
    );
    const carpet = K.surf('concrete', 0x23345a),
      steelFl = K.paintSteel(0x6a6e70, {m: 0.6, r: 0.5});
    flr(X0 + IN, X1 - IN, PZ + p, Z1 - IN, surf('marble'));
    // dark marble border round the hall and a compass-rose roundel in the middle
    const bordM = K.mat(0x3a2a24, 0.25, 0.1);
    b.box(X1 - X0 - 2 * IN, 0.02, 0.35, bordM, [0, 0.047, Z1 - IN - 0.6], null, 0);
    b.box(X1 - X0 - 2 * IN, 0.02, 0.35, bordM, [0, 0.047, PZ + p + 0.6], null, 0);
    for (const s of [-1, 1])
      b.box(0.35, 0.02, Z1 - PZ - 1.5, bordM, [s * (X1 - IN - 0.6), 0.047, (Z1 + PZ) / 2], null, 0);
    const roseM = K.paint(
      'bbk_rose',
      256,
      256,
      (c, W) => {
        c.fillStyle = '#3a2a24';
        c.beginPath();
        c.arc(W / 2, W / 2, W / 2 - 2, 0, PI * 2);
        c.fill();
        c.fillStyle = '#e6e0d4';
        c.beginPath();
        c.arc(W / 2, W / 2, W / 2 - 16, 0, PI * 2);
        c.fill();
        drawBalls(c, W / 2, W / 2 + 10, 34);
      },
      {alpha: true, r: 0.25}
    );
    b.label(2.2, 2.2, roseM, [0, 0.05, 6.6], [-PI / 2, 0, 0]);
    flr(X0 + IN, XV - p, SZ + q, PZ - p, surf('checker'));
    flr(SX + q, XV - p, Z0 + IN, SZ + q, surf('checker'));
    flr(X0 + IN, SX - q, Z0 + IN, SZ - q, steelFl);
    flr(XV + p, XC - p, Z0 + IN, PZ - p, K.mat(0x6a5a48, 0.6));
    flr(XC + p, X1 - IN, OZ1 + p, PZ - p, carpet);
    flr(XC + p, X1 - IN, OZ2 + p, OZ1 - p, carpet);
    flr(XC + p, X1 - IN, Z0 + IN, OZ2 - p, tileW);
    // linings
    const plaster = surf('plaster'),
      wains = surf('wains'),
      skirt = K.mat(0x2a1a10, 0.6),
      mauve = K.mat(0x9a8088, 0.9),
      paleW = K.mat(0xe2ded2, 0.85),
      strongW = K.paintSteel(0x7a7e78, {m: 0.5, r: 0.5});
    const hallSpan = (pc, u0, u1, y0, y1) => {
      if (y0 < 1.2) pc(u0, u1, y0, Math.min(y1, 1.2), wains, 0.02, 0.01);
      if (y0 <= 1.2 && y1 >= 1.27) pc(u0, u1, 1.2, 1.27, wains, 0.05, 0.025);
      if (y1 > 1.27) pc(u0, u1, Math.max(y0, 1.27), Math.min(y1, H - 0.6), plaster, 0.012, 0.006);
      if (y1 > H - 0.6) pc(u0, u1, Math.max(y0, H - 0.6), y1, dres, 0.06, 0.03);
      if (y0 <= 0 && y1 > 0.2) pc(u0, u1, 0, 0.16, skirt, 0.035, 0.017);
    };
    const vaultSpan = (pc, u0, u1, y0, y1) => {
      if (y0 < 1.0) pc(u0, u1, y0, Math.min(y1, 1.0), panelW, 0.02, 0.01);
      if (y0 <= 1.0 && y1 >= 1.06) pc(u0, u1, 1.0, 1.06, skirt, 0.045, 0.02);
      if (y1 > 1.06) pc(u0, u1, Math.max(y0, 1.06), y1, mauve, 0.012, 0.006);
    };
    const strongSpan = (pc, u0, u1, y0, y1) => pc(u0, u1, y0, y1, strongW, 0.012, 0.006);
    const offSpan = (pc, u0, u1, y0, y1) => {
      if (y0 < 0.9) pc(u0, u1, y0, Math.min(y1, 0.9), wains, 0.02, 0.01);
      if (y1 > 0.9) pc(u0, u1, Math.max(y0, 0.9), y1, paleW, 0.012, 0.006);
      if (y0 <= 0.9 && y1 >= 0.95) pc(u0, u1, 0.9, 0.95, wains, 0.04, 0.02);
    };
    const corSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, y1, paleW, 0.012, 0.006);
      if (y0 <= 0 && y1 > 0.2) pc(u0, u1, 0, 0.12, skirt, 0.03, 0.015);
    };
    const tileSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, Math.min(y1, 1.8), tileW, 0.012, 0.006);
      if (y1 > 1.8) pc(u0, u1, Math.max(y0, 1.8), y1, paleW, 0.012, 0.006);
    };
    const R1 = RIGHT.filter(o => o.c > PZ);
    // banking hall
    LK.lineWall(b, 1, Z1, X0, X1, -1, FRONT, HT, hallSpan);
    LK.lineWall(b, 0, X0, PZ + p, Z1, 1, LEFT, HT, hallSpan);
    LK.lineWall(b, 0, X1, PZ + p, Z1, -1, R1, HT, hallSpan);
    LK.lineWall(b, 1, PZ + p, X0, X1, 1, PART, HT, hallSpan);
    // vault room (L-shaped round the strongroom)
    LK.lineWall(b, 1, PZ - p, X0, XV - p, -1, [], RC, vaultSpan);
    LK.lineWall(b, 0, X0, SZ + q, PZ - p, 1, [], RC, vaultSpan);
    LK.lineWall(b, 0, XV - p, Z0 + IN, PZ - p, -1, VAULTD, RC, vaultSpan);
    LK.lineWall(b, 1, Z0, SX + q, XV - p, 1, [], RC, vaultSpan);
    LK.lineWall(b, 1, SZ + q, X0 + IN, SX + q, 1, STRONG, RC, vaultSpan);
    LK.lineWall(b, 0, SX + q, Z0 + IN, SZ + q, 1, [], RC, vaultSpan);
    // strongroom
    LK.lineWall(b, 1, SZ - q, X0 + IN, SX - q, -1, STRONG, RC, strongSpan);
    LK.lineWall(b, 0, SX - q, Z0 + IN, SZ - q, -1, [], RC, strongSpan);
    LK.lineWall(b, 0, X0, Z0 + IN, SZ - q, 1, [], RC, strongSpan);
    LK.lineWall(b, 1, Z0, X0 + IN, SX - q, 1, [], RC, strongSpan);
    // corridor
    LK.lineWall(b, 0, XV + p, Z0 + IN, PZ - p, 1, VAULTD, RC, corSpan);
    LK.lineWall(b, 0, XC - p, Z0 + IN, PZ - p, -1, OFFD, RC, corSpan);
    LK.lineWall(b, 1, PZ - p, XV + p, XC - p, -1, PART, RC, corSpan);
    LK.lineWall(b, 1, Z0, XV + p, XC - p, 1, BACKD, RC, corSpan);
    // manager's office
    LK.lineWall(b, 1, PZ - p, XC + p, X1 - IN, -1, [], RC, offSpan);
    LK.lineWall(b, 0, X1, OZ1 + p, PZ - p, -1, [RIGHT[1]], RC, offSpan);
    LK.lineWall(b, 1, OZ1 + p, XC + p, X1 - IN, 1, [], RC, offSpan);
    LK.lineWall(b, 0, XC + p, OZ1 + p, PZ - p, 1, [OFFD[2]], RC, offSpan);
    // loans office
    LK.lineWall(b, 1, OZ1 - p, XC + p, X1 - IN, -1, [], RC, offSpan);
    LK.lineWall(b, 0, X1, OZ2 + p, OZ1 - p, -1, [RIGHT[0]], RC, offSpan);
    LK.lineWall(b, 1, OZ2 + p, XC + p, X1 - IN, 1, [], RC, offSpan);
    LK.lineWall(b, 0, XC + p, OZ2 + p, OZ1 - p, 1, [OFFD[1]], RC, offSpan);
    // staff toilet
    LK.lineWall(b, 1, OZ2 - p, XC + p, X1 - IN, -1, [], RC, tileSpan);
    LK.lineWall(b, 0, X1, Z0 + IN, OZ2 - p, -1, [], RC, tileSpan);
    LK.lineWall(b, 1, Z0, XC + p, X1 - IN, 1, [], RC, tileSpan);
    LK.lineWall(b, 0, XC + p, Z0 + IN, OZ2 - p, 1, [OFFD[0]], RC, tileSpan);
    // hall: coffered plaster ceiling with a rosette over each chandelier
    const ceilM = K.mat(0xf2ece0, 0.9),
      beamM = K.mat(0xe6dfd0, 0.85),
      giltM = K.mat(0xc8a048, 0.35, 0.8);
    b.box(X1 - X0 - 0.3, 0.06, Z1 - PZ - 0.2, ceilM, [0, H - 0.08, (PZ + Z1) / 2], null, 0);
    for (let cx = X0 + 2.125; cx < X1 - 0.5; cx += 2.125)
      b.box(0.24, 0.32, Z1 - PZ - 0.3, beamM, [cx, H - 0.27, (PZ + Z1) / 2], null, 0);
    for (let cz = PZ + 2.2; cz < Z1 - 0.5; cz += 2.2)
      b.box(X1 - X0 - 0.3, 0.32, 0.24, beamM, [0, H - 0.27, cz], null, 0);
    for (let cx = X0 + 2.125; cx < X1 - 0.5; cx += 2.125)
      for (let cz = PZ + 2.2; cz < Z1 - 0.5; cz += 2.2) b.box(0.3, 0.02, 0.3, giltM, [cx, H - 0.44, cz], null, 0);
    // back rooms: a flat ceiling at RC
    b.box(X1 - X0 - 0.3, 0.05, PZ - Z0 - 0.2, K.mat(0xe8e6e0, 0.9), [0, RC + 0.025, (Z0 + PZ) / 2], null, 0);
    // chandeliers: brass stem, bowl, a ring of candle bulbs
    const chandelier = (x, z) => {
      b.cyl(0.18, 0.18, 0.04, giltM, [x, H - 0.13, z], null, 16);
      b.cyl(0.02, 0.02, 1.4, giltM, [x, H - 0.85, z], null, 6);
      b.sph(0.12, giltM, [x, H - 1.55, z], null, 12);
      b.cyl(0.32, 0.08, 0.3, giltM, [x, H - 1.8, z], null, 16);
      b.tor(0.55, 0.025, giltM, [x, H - 1.75, z], [PI / 2, 0, 0], null, 24);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * PI * 2,
          cx = x + Math.cos(a) * 0.55,
          cz = z + Math.sin(a) * 0.55;
        b.cyl(0.035, 0.035, 0.14, K.mat(0xf4efe4, 0.6), [cx, H - 1.65, cz], null, 6);
        b.sph(0.05, warm, [cx, H - 1.54, cz], null, 8);
      }
      b.cyl(0.08, 0.02, 0.18, giltM, [x, H - 2.03, z], null, 10);
    };
    for (const [x, z] of [
      [0, 0.6],
      [0, 6.2],
      [-5.6, 4.4],
      [5.6, 4.4]
    ])
      chandelier(x, z);
    // brass wall sconces between the hall windows
    for (const [sx, sz, a] of [
      [X0 + IN + 0.02, 3.6, PI / 2],
      [X0 + IN + 0.02, 7.6, PI / 2],
      [X1 - IN - 0.02, 3.6, -PI / 2],
      [X1 - IN - 0.02, 7.6, -PI / 2]
    ]) {
      b.push([sx, 2.4, sz], [0, a, 0]);
      b.box(0.14, 0.24, 0.03, giltM, [0, 0, 0.015], null, 0);
      b.cyl(0.015, 0.015, 0.22, giltM, [0, 0.0, 0.12], [PI / 2, 0, 0], 6);
      b.cyl(
        0.07,
        0.11,
        0.16,
        K.mat(0xf6eedc, 0.5, 0, {emissive: 0xffe0a0, emissiveIntensity: 0.9}),
        [0, 0.1, 0.22],
        null,
        12
      );
      b.pop();
    }
    // back-of-house panels
    const hous = K.mat(0xd8d8d4, 0.5, 0.2);
    for (const [lx, lz] of [
      [-6.4, -4.6],
      [-2.2, -4.6],
      [-2.1, -9.8],
      [-6.0, -9.8],
      [0.5, -4.0],
      [0.5, -9.0],
      [5.0, -3.8],
      [5.0, -7.3],
      [5.0, -10.5]
    ]) {
      b.box(0.62, 0.03, 0.62, hous, [lx, RC - 0.01, lz], null, 0.005);
      b.box(0.56, 0.01, 0.56, lit, [lx, RC - 0.03, lz], null, 0);
    }

    /* ---------- hall: two marble columns ---------- */
    const mw = K.tri(
      'bbk_mw',
      (c, W, Hh, r) => {
        c.fillStyle = '#ece8e2';
        c.fillRect(0, 0, W, Hh);
        for (let k = 0; k < 30; k++) {
          c.strokeStyle = 'rgba(150,150,160,.3)';
          c.lineWidth = 0.6 + r() * 1.4;
          c.beginPath();
          let x = r() * W,
            y = r() * Hh;
          c.moveTo(x, y);
          for (let qq = 0; qq < 6; qq++) {
            x += (r() - 0.4) * 50;
            y += (r() - 0.5) * 40;
            c.lineTo(x, y);
          }
          c.stroke();
        }
      },
      {tile: 1.0, r: 0.25}
    );
    for (const cx of [-3.0, 3.0]) {
      const cz = 3.4;
      b.box(0.8, 0.3, 0.8, bordM, [cx, 0.15, cz], null, 0.01);
      b.cyl(0.36, 0.4, 0.14, mw, [cx, 0.37, cz], null, 20);
      b.cyl(0.3, 0.33, H - 1.4, mw, [cx, 0.44 + (H - 1.4) / 2, cz], null, 20);
      b.cyl(0.42, 0.32, 0.3, mw, [cx, H - 0.81, cz], null, 20);
      b.box(0.86, 0.16, 0.86, mw, [cx, H - 0.58, cz], null, 0.01);
      b.tor(0.33, 0.03, giltM, [cx, H - 1.0, cz], [PI / 2, 0, 0], null, 20);
      S(cx - 0.4, cx + 0.4, cz - 0.4, cz + 0.4, 0, H);
    }

    /* ---------- hall: the teller line (marble counter, brass grilles, teller windows), clock and sign over it ---------- */
    const TX0 = X0 + IN,
      TX1 = -1.4,
      TZc = -0.25,
      TD = 0.7,
      wood = K.veneer(0x5a3820),
      leather = K.mat(0x5a2418, 0.55),
      green = K.mat(0x1f6a3a, 0.3, 0, {emissive: 0x2a8a4a, emissiveIntensity: 0.25});
    {
      const L = TX1 - TX0,
        cx = (TX0 + TX1) / 2;
      b.box(L, 1.0, TD, bordM, [cx, 0.5, TZc], null, 0.01); // dark marble body
      b.box(L, 0.12, TD - 0.1, mw, [cx, 0.12, TZc + 0.06], null, 0); // plinth
      for (let x = TX0 + 0.6; x < TX1 - 0.3; x += 1.15)
        b.box(0.9, 0.62, 0.02, mw, [x, 0.56, TZc + TD / 2 + 0.01], null, 0.005); // panels
      b.box(L + 0.06, 0.06, TD + 0.12, mw, [cx, 1.03, TZc], null, 0.01); // counter top
      b.box(L, 0.04, 0.3, wood, [cx, 1.08, TZc + 0.25], null, 0.005); // customer ledge
      // brass grille with four teller windows
      const gy0 = 1.1,
        gy1 = 2.1;
      b.box(L, 0.06, 0.06, brass, [cx, gy1, TZc - 0.1], null, 0);
      b.box(L, 0.05, 0.05, brass, [cx, gy0 + 0.02, TZc - 0.1], null, 0);
      const WIN = [-6.85, -5.05, -3.25];
      for (let x = TX0 + 0.08; x < TX1; x += 0.11) {
        if (WIN.some(w => Math.abs(x - w) < 0.36)) {
          b.cyl(0.008, 0.008, 0.36, brass, [x, gy1 - 0.2, TZc - 0.1], null, 4);
          continue;
        }
        b.cyl(0.008, 0.008, gy1 - gy0, brass, [x, (gy0 + gy1) / 2, TZc - 0.1], null, 4);
      }
      WIN.forEach((w, i) => {
        b.frame(0.74, 0.62, 0.04, brass, [w, 1.55, TZc - 0.1], 0.04);
        b.box(0.5, 0.1, 0.02, K.mat(0x0e2348, 0.5), [w, 1.94, TZc - 0.08], null, 0);
        b.label(
          0.48,
          0.09,
          textMat('bbk_t' + i, 256, 48, 'TELLER ' + (i + 1), 'bold 30px Georgia, serif', NAVY, GOLD),
          [w, 1.94, TZc - 0.065]
        );
        b.box(0.36, 0.02, 0.22, brass, [w, 1.1, TZc - 0.05], null, 0.005); // money trough
      });
      // crest over the grille
      b.box(L, 0.24, 0.08, wood, [cx, gy1 + 0.15, TZc - 0.1], null, 0.01);
      S(TX0, TX1, TZc - TD / 2, TZc + TD / 2, 0, gy1 + 0.3);
      // the swinging half-gate into the teller area (left open)
      b.push([TX1 + 0.05, 0, TZc + 0.2], [0, -1.2, 0]);
      b.box(0.82, 0.9, 0.05, wood, [0.41, 0.5, 0], null, 0.01);
      b.box(0.82, 0.04, 0.08, brass, [0.41, 0.97, 0], null, 0);
      b.pop();
      // teller stools and back counter of cash drawers along the partition
      for (const w of WIN) {
        b.cyl(0.18, 0.18, 0.06, leather, [w, 0.78, TZc - 0.75], null, 14);
        b.cyl(0.025, 0.025, 0.72, chrome, [w, 0.4, TZc - 0.75], null, 6);
        b.cyl(0.2, 0.22, 0.03, chrome, [w, 0.03, TZc - 0.75], null, 12);
      }
      b.box(L, 0.95, 0.5, wood, [cx, 0.475, PZ + p + 0.26], null, 0.01);
      for (let x = TX0 + 0.4; x < TX1 - 0.2; x += 0.6) b.handle(0.12, brass, [x, 0.8, PZ + p + 0.51], false, 0.02);
      b.box(L + 0.04, 0.04, 0.54, mw, [cx, 0.97, PZ + p + 0.27], null, 0.005);
      S(TX0, TX1, PZ + p, PZ + p + 0.52, 0, 1.0, true);
      // adding machines on the back counter
      for (const w of WIN) {
        b.box(0.26, 0.1, 0.3, K.mat(0x4a4a46, 0.5), [w + 0.3, 1.04, PZ + p + 0.28], [-0.15, 0, 0], 0.02);
        b.box(0.2, 0.06, 0.02, K.mat(0xf4f0e6, 0.8), [w + 0.3, 1.13, PZ + p + 0.14], null, 0);
      }
      // wall clock and the TELLERS sign over the grille
      const clockM = K.paint(
        'bbk_clock',
        256,
        256,
        (c, W) => {
          c.fillStyle = '#f6f0e0';
          c.beginPath();
          c.arc(W / 2, W / 2, W / 2 - 4, 0, PI * 2);
          c.fill();
          c.strokeStyle = '#2a2a2a';
          c.lineWidth = 4;
          c.stroke();
          c.fillStyle = '#2a2a2a';
          c.font = 'bold 26px Georgia, serif';
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          const R = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
          R.forEach((t, i) => {
            const a = (i / 12) * PI * 2 - PI / 2;
            c.fillText(t, W / 2 + Math.cos(a) * 96, W / 2 + Math.sin(a) * 96);
          });
          c.lineWidth = 6;
          c.beginPath();
          c.moveTo(W / 2, W / 2);
          c.lineTo(W / 2 + 40, W / 2 - 30);
          c.moveTo(W / 2, W / 2);
          c.lineTo(W / 2 - 10, W / 2 - 80);
          c.stroke();
        },
        {alpha: true}
      );
      b.cyl(0.52, 0.52, 0.08, giltM, [-4.95, 4.4, PZ + p + 0.05], [PI / 2, 0, 0], 28);
      b.label(0.92, 0.92, clockM, [-4.95, 4.4, PZ + p + 0.1]);
      b.box(1.6, 0.36, 0.06, giltM, [-4.95, 3.55, PZ + p + 0.04], null, 0.01);
      b.label(1.5, 0.3, textMat('bbk_tellers', 512, 96, 'TELLERS', 'bold 64px Georgia, serif', NAVY, GOLD), [
        -4.95,
        3.55,
        PZ + p + 0.075
      ]);
      b.label(
        5.6,
        0.5,
        textMat('bbk_wall', 1024, 96, 'BLUE BALLS BANK', 'bold 64px Georgia, serif', null, '#b8943a', true),
        [3.6, 3.9, PZ + p + 0.02]
      );
    }

    /* ---------- hall: queue posts and velvet ropes in front of the tellers ---------- */
    {
      const velvet = K.mat(0x8a1a2a, 0.8);
      const posts = [];
      for (let x = -7.6; x <= -2.0; x += 1.4) posts.push([x, 1.5]);
      posts.push([-2.0, 2.9]);
      for (const [x, z] of posts) {
        b.cyl(0.16, 0.18, 0.04, brass, [x, 0.06, z], null, 14);
        b.cyl(0.025, 0.025, 0.95, brass, [x, 0.5, z], null, 8);
        b.sph(0.045, brass, [x, 1.0, z], null, 10);
        S(x - 0.05, x + 0.05, z - 0.05, z + 0.05, 0, 1.0, true);
      }
      for (let i = 0; i < posts.length - 1; i++) {
        const [ax, az] = posts[i],
          [bx, bz] = posts[i + 1];
        b.tube(
          [new T.Vector3(ax, 0.92, az), new T.Vector3((ax + bx) / 2, 0.72, (az + bz) / 2), new T.Vector3(bx, 0.92, bz)],
          0.02,
          velvet,
          12,
          6
        );
      }
    }

    /* ---------- hall: check-writing island with green banker's lamps ---------- */
    const bankLamp = (x, y, z, a) => {
      b.push([x, y, z], [0, a || 0, 0]);
      b.cyl(0.07, 0.08, 0.02, brass, [0, 0.01, 0], null, 12);
      b.cyl(0.01, 0.01, 0.3, brass, [0, 0.16, 0], null, 6);
      b.cyl(0.08, 0.08, 0.32, green, [0, 0.33, 0.04], [0, 0, PI / 2], 14, true);
      b.box(
        0.3,
        0.01,
        0.12,
        K.mat(0xfff0c0, 0.4, 0, {emissive: 0xffe0a0, emissiveIntensity: 1.1}),
        [0, 0.29, 0.04],
        null,
        0
      );
      b.pop();
    };
    {
      const ix = 0,
        iz = 4.2;
      b.box(2.2, 0.98, 0.8, wood, [ix, 0.49, iz], null, 0.02);
      for (const s of [-1, 1]) b.box(2.0, 0.7, 0.02, K.veneer(0x6a4428), [ix, 0.5, iz + s * 0.41], null, 0.005);
      b.box(2.4, 0.05, 1.0, mw, [ix, 1.0, iz], null, 0.01);
      bankLamp(ix - 0.6, 1.03, iz);
      bankLamp(ix + 0.6, 1.03, iz, PI);
      // deposit-slip racks, pens on chains, a blotter each side
      b.box(0.5, 0.18, 0.12, wood, [ix, 1.11, iz], null, 0.005);
      for (const s of [-1, 1]) {
        b.box(0.5, 0.005, 0.35, K.mat(0x2a4a2a, 0.9), [ix + s * 0.55, 1.028, iz + s * 0.25], null, 0);
        b.box(0.2, 0.003, 0.28, K.mat(0xf4f0e6, 0.9), [ix + s * 0.3, 1.032, iz + s * 0.27], [0, 0.2 * s, 0], 0);
        b.cyl(0.006, 0.006, 0.14, black, [ix - s * 0.1, 1.035, iz + s * 0.36], [0, 0, PI / 2], 6);
      }
      S(ix - 1.2, ix + 1.2, iz - 0.5, iz + 0.5, 0, 1.1);
    }

    /* ---------- hall: waiting area (chesterfields, armchairs, coffee tables), customer-service desk, plants ---------- */
    const button = K.mat(0x3a1410, 0.5);
    const sofa = (x, z, a, n) => {
      const L = 0.75 * n + 0.4;
      b.push([x, 0, z], [0, a, 0]);
      rb(L, 0.42, 0.9, 0.05, leather, [0, 0.21, 0]);
      for (let i = 0; i < n; i++) rb(0.73, 0.14, 0.7, 0.05, leather, [-L / 2 + 0.2 + 0.375 + i * 0.75, 0.48, 0.06]);
      rb(L, 0.5, 0.2, 0.05, leather, [0, 0.66, -0.36]);
      for (const s of [-1, 1]) {
        rb(0.2, 0.32, 0.9, 0.04, leather, [s * (L / 2 - 0.1), 0.58, 0]);
        b.cyl(0.11, 0.11, 0.9, leather, [s * (L / 2 - 0.1), 0.74, 0], [PI / 2, 0, 0], 12);
      }
      for (let i = 0; i < n * 3; i++)
        b.sph(0.012, button, [-L / 2 + 0.35 + (i * (L - 0.7)) / (n * 3 - 1), 0.72, -0.255], null, 4);
      b.pop();
      const c = Math.abs(Math.cos(a)) > 0.5;
      const hx = c ? L / 2 : 0.45,
        hz = c ? 0.45 : L / 2;
      S(x - hx, x + hx, z - hz, z + hz, 0, 0.9);
    };
    const armchair = (x, z, a) => {
      b.push([x, 0, z], [0, a, 0]);
      rb(0.9, 0.42, 0.85, 0.05, leather, [0, 0.21, 0]);
      rb(0.6, 0.14, 0.65, 0.05, leather, [0, 0.48, 0.06]);
      rb(0.9, 0.55, 0.2, 0.05, leather, [0, 0.68, -0.33]);
      for (const s of [-1, 1]) b.cyl(0.11, 0.11, 0.85, leather, [s * 0.36, 0.72, 0], [PI / 2, 0, 0], 12);
      b.pop();
      S(x - 0.45, x + 0.45, z - 0.45, z + 0.45, 0, 0.9, true);
    };
    const coffee = (x, z, w, d) => {
      b.box(w, 0.05, d, wood, [x, 0.45, z], null, 0.01);
      for (const sx of [-1, 1])
        for (const sz of [-1, 1])
          b.cyl(0.025, 0.02, 0.42, wood, [x + sx * (w / 2 - 0.08), 0.21, z + sz * (d / 2 - 0.08)], null, 6);
      S(x - w / 2, x + w / 2, z - d / 2, z + d / 2, 0, 0.5, true);
    };
    // left group: two sofas face to face round a coffee table, an armchair at the end
    sofa(-5.6, 5.0, 0, 3);
    sofa(-5.6, 7.9, PI, 3);
    coffee(-5.6, 6.45, 1.4, 0.7);
    armchair(-7.6, 6.45, PI / 2);
    // right group: armchairs round a low table by the windows, newspapers
    armchair(5.0, 5.4, PI / 4);
    armchair(7.4, 5.4, -PI / 4);
    armchair(6.2, 7.9, PI);
    coffee(6.2, 6.4, 0.9, 0.9);
    for (let i = 0; i < 3; i++)
      b.box(0.3, 0.01, 0.4, K.mat(0xe8e2d4, 0.9), [6.1 + i * 0.07, 0.48 + i * 0.01, 6.35], [0, 0.3 * i, 0], 0);
    // customer-service desk on the right, with chairs in front of it
    b.label(1.6, 0.3, textMat('bbk_cs', 512, 96, 'CUSTOMER SERVICE', 'bold 48px Georgia, serif', NAVY, GOLD), [
      5.4,
      2.6,
      PZ + p + 0.03
    ]);
    bankLamp(4.7, 0.78, -0.7, 0);
    for (const cx of [4.8, 6.0]) armchair(cx, 0.8, PI);
    // potted palms in the corners and by the doors
    const palm = (x, z) => {
      b.cyl(0.3, 0.24, 0.55, brass, [x, 0.28, z], null, 16);
      b.box(0.5, 0.04, 0.5, soil, [x, 0.53, z], null, 0);
      b.cyl(0.03, 0.04, 1.3, K.mat(0x5a4a2a, 0.9), [x, 1.15, z], null, 6);
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * PI * 2;
        b.box(
          0.12,
          0.02,
          0.9,
          i % 2 ? leaf : leaf2,
          [x + Math.cos(a) * 0.35, 1.7, z + Math.sin(a) * 0.35],
          [0.5, -a + PI / 2, 0],
          0
        );
      }
      S(x - 0.3, x + 0.3, z - 0.3, z + 0.3, 0, 1.8, true);
    };
    palm(X0 + 0.6, Z1 - 0.6);
    palm(X1 - 0.6, Z1 - 0.6);
    palm(-1.9, Z1 - 0.6);
    palm(1.9, Z1 - 0.6);
    // brochure stand by the doors
    b.box(0.5, 1.3, 0.3, wood, [X1 - 0.5, 0.65, 2.6], null, 0.01);
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 2; j++)
        b.box(
          0.18,
          0.24,
          0.02,
          K.mat([0x1f5fd0, 0xd8b860, 0xe8e4d8][(i + j) % 3], 0.8),
          [X1 - 0.62 + j * 0.24, 0.6 + i * 0.3, 2.44],
          [-0.2, 0, 0],
          0
        );
    S(X1 - 0.75, X1 - 0.25, 2.45, 2.75, 0, 1.3, true);
    // portrait of the founder and a painting of the three balls on the side walls
    const frameArt = (x, y, z, a, w, h, mat) => {
      b.push([x, y, z], [0, a, 0]);
      b.box(w + 0.16, h + 0.16, 0.06, giltM, [0, 0, 0.03], null, 0.01);
      b.label(w, h, mat, [0, 0, 0.065]);
      b.pop();
    };
    const founderM = K.paint(
      'bbk_founder',
      192,
      256,
      (c, W, Hh) => {
        const g = c.createLinearGradient(0, 0, 0, Hh);
        g.addColorStop(0, '#3a2a1e');
        g.addColorStop(1, '#1a120c');
        c.fillStyle = g;
        c.fillRect(0, 0, W, Hh);
        c.fillStyle = '#1a1a22';
        c.beginPath();
        c.moveTo(20, Hh);
        c.quadraticCurveTo(W / 2, 120, W - 20, Hh);
        c.fill();
        c.fillStyle = '#e8e4d8';
        c.fillRect(W / 2 - 14, 150, 28, 40);
        c.fillStyle = '#c89a7a';
        c.beginPath();
        c.ellipse(W / 2, 110, 38, 48, 0, 0, PI * 2);
        c.fill();
        c.fillStyle = '#d8d4cc';
        c.fillRect(W / 2 - 40, 118, 80, 14);
        c.fillStyle = '#2a1a10';
        c.fillRect(W / 2 - 20, 98, 10, 5);
        c.fillRect(W / 2 + 10, 98, 10, 5);
        c.fillStyle = '#1f5fd0';
        c.fillRect(W / 2 - 6, 160, 12, 30);
      },
      {r: 0.6}
    );
    frameArt(X0 + IN + 0.01, 2.6, 3.6, PI / 2, 0.9, 1.2, founderM);
    const ballsArt = K.paint(
      'bbk_ballart',
      256,
      192,
      (c, W, Hh) => {
        c.fillStyle = '#e8dcc0';
        c.fillRect(0, 0, W, Hh);
        drawBalls(c, W / 2, Hh / 2 + 10, 34);
      },
      {r: 0.6}
    );
    frameArt(X1 - IN - 0.01, 2.6, 3.6, -PI / 2, 1.2, 0.9, ballsArt);

    /* ---------- vault room: round vault door (swung open), safes, cash carts, coin counter ---------- */
    const vSteel = surf('vaultSteel'),
      darkSteel = K.paintSteel(0x3a3e40, {m: 0.6, r: 0.4});
    {
      const gx = STRONG[0].c,
        gw = 1.6,
        gh = 2.5,
        fz = SZ + q;
      // the stepped steel surround on the vault-room face of the strongroom wall
      b.box(0.5, 2.9, 0.12, vSteel, [gx - gw / 2 - 0.25, 1.45, fz + 0.06], null, 0.01);
      b.box(0.5, 2.9, 0.12, vSteel, [gx + gw / 2 + 0.25, 1.45, fz + 0.06], null, 0.01);
      b.box(gw, 0.4, 0.12, vSteel, [gx, gh + 0.2, fz + 0.06], null, 0.01);
      b.tor(1.42, 0.06, darkSteel, [gx, 1.35, fz + 0.12], null, null, 32);
      for (const s of [-1, 1]) b.box(0.08, gh, 0.2, darkSteel, [gx + s * (gw / 2 + 0.04), gh / 2, fz + 0.04], null, 0);
      // the round door, swung through ~95 degrees on its hinge at the right of the opening
      const hx = gx + gw / 2 + 0.2,
        R = 1.25,
        th = 0.55;
      b.cyl(0.12, 0.12, 2.6, darkSteel, [hx, 1.3, fz + 0.18], null, 14); // hinge post
      for (const y of [0.5, 1.3, 2.1]) b.box(0.3, 0.2, 0.4, darkSteel, [hx + 0.05, y, fz + 0.32], null, 0.01);
      const dz = fz + 0.35 + R,
        dxc = hx + 0.1 + th / 2;
      b.cyl(R, R, th, vSteel, [dxc, 1.32, dz], [0, 0, PI / 2], 36);
      b.cyl(
        R * 0.82,
        R * 0.82,
        th + 0.04,
        K.paintSteel(0x7e8a68, {m: 0.5, r: 0.4}),
        [dxc, 1.32, dz],
        [0, 0, PI / 2],
        32
      );
      b.tor(R * 0.9, 0.04, darkSteel, [dxc + th / 2 + 0.02, 1.32, dz], [0, PI / 2, 0], null, 32);
      b.tor(R * 0.9, 0.04, darkSteel, [dxc - th / 2 - 0.02, 1.32, dz], [0, PI / 2, 0], null, 32);
      // locking bolts round the rim (on the strongroom side face)
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * PI * 2;
        b.cyl(
          0.06,
          0.06,
          0.24,
          chrome,
          [dxc - th / 2 - 0.1, 1.32 + Math.sin(a) * R * 0.72, dz + Math.cos(a) * R * 0.72],
          [0, 0, PI / 2],
          10
        );
      }
      b.box(0.04, 1.2, 1.2, K.mat(0xb8a878, 0.3, 0.8), [dxc - th / 2 - 0.03, 1.32, dz], null, 0.01); // brass mechanism plate
      // the spoked handwheel and combination dial on the outer face
      const ox = dxc + th / 2 + 0.04;
      b.tor(0.32, 0.03, brass, [ox + 0.12, 1.32, dz], [0, PI / 2, 0], null, 24);
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * PI;
        b.cyl(0.02, 0.02, 0.64, brass, [ox + 0.12, 1.32, dz], [a, 0, 0], 6);
      }
      b.cyl(0.06, 0.06, 0.16, brass, [ox + 0.06, 1.32, dz], [0, 0, PI / 2], 10);
      b.cyl(0.12, 0.12, 0.05, chrome, [ox + 0.02, 1.85, dz], [0, 0, PI / 2], 20);
      b.cyl(0.08, 0.08, 0.04, darkSteel, [ox + 0.05, 1.85, dz], [0, 0, PI / 2], 16);
      S(hx + 0.05, hx + 0.2 + th, fz + 0.2, fz + 0.45 + 2 * R, 0, 2.6);
      S(gx - gw / 2 - 0.5, gx - gw / 2, fz, fz + 0.14, 0, 2.9, true);
    }
    // the row of green safes along the partition is lootable (bank_safe, placed at build); plinth strip under them
    b.box(4.6, 0.05, 0.75, K.mat(0x2a2a2a, 0.8), [-5.95, 0.06, PZ - p - 0.42], null, 0);
    // coin counter on a steel table, cash cart, money sacks by the strongroom
    b.box(1.4, 0.04, 0.7, steel, [-1.6, 0.9, -3.0], null, 0.005);
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) b.box(0.04, 0.88, 0.04, steel, [-1.6 + sx * 0.65, 0.44, -3.0 + sz * 0.3], null, 0);
    b.box(1.3, 0.03, 0.6, steel, [-1.6, 0.3, -3.0], null, 0);
    rb(0.45, 0.35, 0.4, 0.03, K.mat(0x3a4a5a, 0.4, 0.4), [-1.9, 1.1, -3.0]);
    b.box(
      0.25,
      0.08,
      0.02,
      K.mat(0x1a1a1a, 0.3, 0, {emissive: 0x30ff60, emissiveIntensity: 0.6}),
      [-1.9, 1.18, -2.79],
      null,
      0
    );
    for (let i = 0; i < 5; i++)
      b.cyl(0.03, 0.03, 0.1, K.mat(0xc8a048, 0.3, 0.8), [-1.3 + i * 0.07, 0.97, -3.1], null, 10);
    S(-2.3, -0.9, -3.35, -2.65, 0, 1.3, true);
    const sackM = K.mat(0xb8a278, 0.95);
    const sack = (x, z, s) => {
      b.sph(0.22 * s, sackM, [x, 0.2 * s, z], [1, 1.1, 1], 10);
      b.cyl(0.05 * s, 0.09 * s, 0.14 * s, sackM, [x, 0.45 * s, z], null, 8);
      b.label(0.16 * s, 0.16 * s, textMat('bbk_sack', 128, 128, '$', 'bold 96px Georgia, serif', null, '#2a5a2a'), [
        x,
        0.22 * s,
        z + 0.225 * s
      ]);
    };
    sack(-2.8, -6.9, 1);
    sack(-2.4, -7.1, 0.9);
    sack(-2.6, -6.5, 0.8);
    // cash cart: steel trolley with bundled notes
    {
      const cx = -1.4,
        cz = -6.5;
      b.box(0.6, 0.03, 0.9, steel, [cx, 0.85, cz], null, 0.005);
      b.box(0.6, 0.03, 0.9, steel, [cx, 0.3, cz], null, 0.005);
      for (const sx of [-1, 1])
        for (const sz of [-1, 1]) b.cyl(0.015, 0.015, 0.85, steel, [cx + sx * 0.28, 0.45, cz + sz * 0.43], null, 6);
      for (const sx of [-1, 1])
        for (const sz of [-1, 1])
          b.cyl(0.04, 0.04, 0.03, K.rubber(), [cx + sx * 0.26, 0.04, cz + sz * 0.4], [0, 0, PI / 2], 10);
      const note = K.mat(0x7a9a6a, 0.9),
        band2 = K.mat(0xe8d8a8, 0.8);
      for (let i = 0; i < 4; i++)
        for (let j = 0; j < 3; j++) {
          b.box(0.16, 0.06, 0.07, note, [cx - 0.18 + j * 0.18, 0.9 + i * 0.062, cz - 0.3 + 0.0 * i], null, 0.003);
          b.box(0.03, 0.065, 0.075, band2, [cx - 0.18 + j * 0.18, 0.9 + i * 0.062, cz - 0.3], null, 0);
        }
      S(cx - 0.32, cx + 0.32, cz - 0.47, cz + 0.47, 0, 1.2, true);
    }
    // a painting on the vault room's mauve wall (flowers), a framed cert
    const flowerM = K.paint(
      'bbk_flowers',
      128,
      160,
      (c, W, Hh) => {
        c.fillStyle = '#2a3a22';
        c.fillRect(0, 0, W, Hh);
        for (let i = 0; i < 9; i++) {
          c.fillStyle = ['#e85a8a', '#f2a0c0', '#e8c040'][i % 3];
          const x = 20 + ((i * 37) % 90),
            y = 30 + ((i * 53) % 100);
          for (let k = 0; k < 6; k++) {
            c.beginPath();
            c.ellipse(x + Math.cos(k) * 8, y + Math.sin(k) * 8, 7, 4, k, 0, PI * 2);
            c.fill();
          }
        }
      },
      {r: 0.6}
    );
    frameArt(XV - p - 0.02, 1.9, -2.9, -PI / 2, 0.6, 0.75, flowerM);

    /* ---------- strongroom: safe-deposit box walls, counting table, gold bars ---------- */
    {
      const boxM = K.paint(
        'bbk_deposit',
        256,
        256,
        (c, W, Hh) => {
          c.fillStyle = '#5a5e58';
          c.fillRect(0, 0, W, Hh);
          const nx = 4,
            ny = 6,
            sx = W / nx,
            sy = Hh / ny;
          for (let i = 0; i < nx; i++)
            for (let j = 0; j < ny; j++) {
              const x = i * sx,
                y = j * sy;
              c.fillStyle = '#9aa092';
              c.fillRect(x + 3, y + 3, sx - 6, sy - 6);
              c.fillStyle = '#c8b070';
              c.fillRect(x + sx / 2 - 7, y + 8, 14, 8); // number plate
              c.fillStyle = '#2a2a2a';
              c.beginPath();
              c.arc(x + sx / 2 - 10, y + sy - 14, 4, 0, PI * 2);
              c.arc(x + sx / 2 + 10, y + sy - 14, 4, 0, PI * 2);
              c.fill();
            }
        },
        {r: 0.5, m: 0.5}
      );
      const wallBoxes = (x0, x1, z, a) => {
        const L = x1 - x0;
        b.push([(x0 + x1) / 2, 0, z], [0, a, 0]);
        b.box(L, 2.4, 0.45, darkSteel, [0, 1.2, 0], null, 0.01);
        const n = Math.max(1, Math.round(L / 0.9));
        for (let i = 0; i < n; i++) b.label(L / n - 0.02, 2.3, boxM, [-L / 2 + (L / n) * (i + 0.5), 1.2, 0.226]);
        b.pop();
      };
      wallBoxes(X0 + IN, SX - q, Z0 + IN + 0.225, 0); // back wall
      // left wall, from the back wall to just short of the opening
      b.push([X0 + IN + 0.225, 0, (Z0 + IN + 0.45 + SZ - q) / 2], [0, PI / 2, 0]);
      {
        const L = SZ - q - (Z0 + IN + 0.45);
        b.box(L, 2.4, 0.45, darkSteel, [0, 1.2, 0], null, 0.01);
        for (let i = 0; i < 3; i++) b.label(L / 3 - 0.02, 2.3, boxM, [-L / 2 + (L / 3) * (i + 0.5), 1.2, 0.226]);
      }
      b.pop();
      S(X0 + IN, SX - q, Z0 + IN, Z0 + IN + 0.45, 0, 2.4);
      S(X0 + IN, X0 + IN + 0.45, Z0 + IN, SZ - q, 0, 2.4);
      // a few boxes pulled out and left on the table
      const tx = -5.4,
        tz = -9.6;
      b.box(1.6, 0.05, 0.8, steel, [tx, 0.9, tz], null, 0.005);
      for (const sx of [-1, 1])
        for (const sz of [-1, 1]) b.box(0.05, 0.88, 0.05, steel, [tx + sx * 0.75, 0.44, tz + sz * 0.35], null, 0);
      for (let i = 0; i < 3; i++) {
        b.box(
          0.22,
          0.12,
          0.5,
          K.mat(0x9aa092, 0.4, 0.6),
          [tx - 0.5 + i * 0.35, 0.99, tz + 0.05],
          [0, 0.1 * i, 0],
          0.01
        );
        b.box(0.18, 0.02, 0.46, K.mat(0x2a2a2a, 0.7), [tx - 0.5 + i * 0.35, 1.05, tz + 0.05], [0, 0.1 * i, 0], 0);
      }
      const gold = K.mat(0xe0b040, 0.25, 1);
      for (let i = 0; i < 6; i++)
        b.box(
          0.18,
          0.05,
          0.08,
          gold,
          [tx + 0.45 + (i % 3) * 0.12, 0.95 + Math.floor(i / 3) * 0.05, tz - 0.15 + (i % 2) * 0.1],
          null,
          0.01
        );
      S(tx - 0.8, tx + 0.8, tz - 0.4, tz + 0.4, 0, 1.1, true);
      // a cage light over the table
      b.box(0.5, 0.06, 0.5, K.mat(0x3a3a3a, 0.5, 0.5), [tx, RC - 0.03, tz], null, 0);
      b.box(0.4, 0.02, 0.4, lit, [tx, RC - 0.07, tz], null, 0);
    }

    /* ---------- door signs ---------- */
    const plate = (key, text, x, y, z, a, bg, fg) => {
      b.push([x, y, z], [0, a, 0]);
      b.box(0.5, 0.14, 0.02, K.mat(0xc8a048, 0.3, 0.9), [0, 0, 0.01], null, 0);
      b.label(
        0.46,
        0.11,
        textMat(key, 256, 64, text, 'bold 34px Georgia, serif', bg || NAVY, fg || GOLD),
        [0, 0, 0.022]
      );
      b.pop();
    };
    plate('bbk_d1', 'STAFF ONLY', PART[0].c, 2.55, PZ + p + 0.01, 0);
    plate('bbk_d2', 'VAULT', XV + p + 0.01, 2.4, VAULTD[0].c, PI / 2);
    plate('bbk_d3', 'MANAGER', XC - p - 0.01, 2.4, OFFD[2].c, -PI / 2);
    plate('bbk_d4', 'LOANS', XC - p - 0.01, 2.4, OFFD[1].c, -PI / 2);
    plate('bbk_d5', 'STAFF WC', XC - p - 0.01, 2.4, OFFD[0].c, -PI / 2);

    /* ---------- corridor: water cooler, extinguisher, notice board, coat hooks ---------- */
    {
      const cx = XV + p + 0.25;
      b.box(0.32, 0.95, 0.32, K.mat(0xe8e8e4, 0.5), [cx, 0.48, -8.4], null, 0.02);
      b.cyl(0.14, 0.14, 0.42, K.glass(0x9ac8f0, 0.5), [cx, 1.17, -8.4], null, 14);
      S(cx - 0.17, cx + 0.17, -8.57, -8.23, 0, 1.4, true);
      b.cyl(0.08, 0.08, 0.5, K.mat(0xc82a1e, 0.4), [XC - p - 0.12, 0.6, -6.0], null, 12);
      b.box(0.04, 0.8, 1.2, K.mat(0xb08a5a, 0.9), [XC - p - 0.02, 1.6, -9.0], null, 0.005);
      for (let i = 0; i < 6; i++)
        b.box(
          0.005,
          0.2,
          0.16,
          K.mat([0xf4f0e6, 0xf8e8a0, 0xd8e8f8][i % 3], 0.9),
          [XC - p - 0.045, 1.4 + (i % 2) * 0.3, -9.4 + Math.floor(i / 2) * 0.38],
          [0, 0, 0.05 * (i - 3)],
          0
        );
      for (let i = 0; i < 4; i++)
        b.cyl(0.01, 0.01, 0.08, brass, [XV + p + 0.04, 1.7, -10.0 - i * 0.3], [0, 0, PI / 2], 6);
      b.box(0.06, 0.7, 0.4, K.mat(0x2a3a5a, 0.9), [XV + p + 0.08, 1.35, -10.3], null, 0.02); // a coat on a hook
    }

    /* ---------- manager's office: desk, leather chair, visitor chairs, rug, CCTV, painting ---------- */
    const chair = (x, z, a, m) => {
      b.push([x, 0, z], [0, a, 0]);
      rb(0.5, 0.08, 0.5, 0.02, m || leather, [0, 0.48, 0]);
      rb(0.5, 0.6, 0.08, 0.02, m || leather, [0, 0.82, -0.22]);
      for (const sx of [-1, 1])
        for (const sz of [-1, 1]) b.cyl(0.018, 0.015, 0.46, wood, [sx * 0.21, 0.23, sz * 0.21], null, 6);
      b.pop();
      S(x - 0.25, x + 0.25, z - 0.25, z + 0.25, 0, 1.1, true);
    };
    b.box(3.2, 0.01, 2.0, K.mat(0x7a1e24, 0.95), [5.4, 0.05, -3.9], null, 0); // rug
    b.box(2.8, 0.008, 1.6, K.mat(0xb8943a, 0.95), [5.4, 0.052, -3.9], null, 0);
    b.box(2.7, 0.01, 1.5, K.mat(0x7a1e24, 0.95), [5.4, 0.056, -3.9], null, 0);
    bankLamp(4.8, 0.76, -4.65, 0);
    armchair(5.6, -5.1, 0);
    chair(4.9, -3.1, PI);
    chair(6.2, -3.1, PI);
    // CCTV monitor bank on a side cabinet against the office's back wall
    b.box(1.4, 0.75, 0.45, wood, [2.6, 0.38, OZ1 + p + 0.24], null, 0.01);
    S(1.9, 3.3, OZ1 + p, OZ1 + p + 0.47, 0, 0.8, true);
    for (const [mx, my] of [
      [2.3, 0.98],
      [2.9, 0.98],
      [2.6, 1.38]
    ]) {
      rb(0.5, 0.38, 0.36, 0.02, K.mat(0x2a2a2a, 0.5), [mx, my, OZ1 + p + 0.28]);
      b.box(
        0.4,
        0.3,
        0.01,
        K.mat(0x203828, 0.3, 0, {emissive: 0x4a8a5a, emissiveIntensity: 0.6}),
        [mx, my, OZ1 + p + 0.465],
        null,
        0
      );
    }
    frameArt(X1 - IN - 0.01, 1.9, -2.6, -PI / 2, 0.7, 0.5, ballsArt);
    palm(X1 - 0.5, OZ1 + 0.5);

    /* ---------- loans office: desk, chairs, filing cabinets, poster ---------- */
    chair(5.6, -8.5, 0, K.mat(0x2a3a5a, 0.8));
    chair(4.9, -6.4, PI, K.mat(0x2a3a5a, 0.8));
    chair(6.2, -6.4, PI, K.mat(0x2a3a5a, 0.8));
    for (let i = 0; i < 2; i++) {
      const fx = X1 - IN - 0.3,
        fz = OZ2 + p + 0.35 + i * 0.52;
      b.box(0.6, 1.3, 0.5, K.paintSteel(0x8a8c88, {m: 0.4, r: 0.5}), [fx, 0.65, fz], null, 0.01);
      for (let d = 0; d < 4; d++) b.handle(0.12, chrome, [fx - 0.31, 0.25 + d * 0.31, fz], false, 0.02);
    }
    S(X1 - IN - 0.6, X1 - IN, OZ2 + p + 0.1, OZ2 + p + 1.12, 0, 1.3, true);
    b.label(
      0.6,
      0.8,
      K.paint(
        'bbk_loan',
        192,
        256,
        (c, W, Hh) => {
          c.fillStyle = '#f4ecd8';
          c.fillRect(0, 0, W, Hh);
          drawBalls(c, W / 2, 70, 22);
          c.fillStyle = NAVY;
          c.font = 'bold 30px Georgia, serif';
          c.textAlign = 'center';
          c.fillText('HOME LOANS', W / 2, 150);
          c.font = '20px Georgia, serif';
          c.fillText('Low rates.', W / 2, 185);
          c.fillText('Big balls.', W / 2, 212);
        },
        {r: 0.8}
      ),
      [XC + p + 0.01, 1.7, -6.6],
      [0, PI / 2, 0]
    );

    /* ---------- staff toilet: WC in a cubicle, two basins, mirror, dryer ---------- */
    {
      const por = K.mat(0xf4f4f0, 0.25);
      const wx = 7.6,
        wz = Z0 + 0.5;
      b.box(0.4, 0.4, 0.18, por, [wx, 0.95, Z0 + IN + 0.1], null, 0.03);
      b.cyl(0.19, 0.15, 0.4, por, [wx, 0.2, wz + 0.1], null, 14);
      b.cyl(0.2, 0.2, 0.03, K.mat(0xf8f8f8, 0.3), [wx, 0.42, wz + 0.1], null, 14);
      b.box(0.36, 0.36, 0.03, K.mat(0xf8f8f8, 0.3), [wx, 0.6, wz - 0.08], [-0.2, 0, 0], 0.02);
      S(wx - 0.22, wx + 0.22, Z0 + IN, wz + 0.32, 0, 1.15, true);
      // cubicle partition with the door ajar
      const cub = K.mat(0x2a3a5a, 0.5);
      b.box(0.04, 2.0, 1.6, cub, [6.8, 1.1, Z0 + IN + 0.8], null, 0.005);
      S(6.78, 6.82, Z0 + IN, Z0 + IN + 1.6, 0.1, 2.1, true);
      b.box(0.04, 2.0, 0.3, cub, [6.8 + 0.15, 1.1, Z0 + IN + 1.6], [0, PI / 2, 0], 0.005);
      b.push([7.1, 0, Z0 + IN + 1.6], [0, -0.9, 0]);
      b.box(0.7, 1.8, 0.03, cub, [0.35, 1.0, 0], null, 0.005);
      b.pop();
      b.cyl(0.06, 0.06, 0.1, K.mat(0xf8f8f4, 0.8), [X1 - IN - 0.08, 0.75, wz + 0.4], [0, 0, PI / 2], 10);
      // basins and mirror on the office-side wall (v089: they stood in front of the toilet door on the corridor wall)
      for (const bx of [3.3, 4.3]) {
        b.box(0.5, 0.15, 0.45, por, [bx, 0.82, OZ2 - p - 0.25], null, 0.04);
        b.cyl(0.04, 0.05, 0.7, por, [bx, 0.4, OZ2 - p - 0.22], null, 12);
        b.cyl(0.012, 0.012, 0.12, chrome, [bx, 0.95, OZ2 - p - 0.08], null, 6);
        S(bx - 0.25, bx + 0.25, OZ2 - p - 0.48, OZ2 - p, 0, 0.95, true);
      }
      b.box(1.6, 0.7, 0.02, K.mat(0xd8e6ee, 0.05, 0.95), [3.8, 1.55, OZ2 - p - 0.02], null, 0);
      b.box(0.25, 0.3, 0.18, K.mat(0xe8e8e4, 0.4, 0.3), [5.2, 1.2, OZ2 - p - 0.1], null, 0.03);
      b.cyl(0.14, 0.12, 0.3, K.mat(0xe8e8e4, 0.5), [6.3, 0.15, Z0 + IN + 0.25], null, 12);
    }

    /* ---------- dressing: dropped slips and notes, a fallen post, smears, a wet floor sign ---------- */
    {
      const slip = K.mat(0xf4f0e6, 0.9),
        note = K.mat(0x7a9a6a, 0.9);
      for (let i = 0; i < 22; i++)
        b.box(0.14, 0.003, 0.2, i % 3 ? slip : note, [-6 + rnd() * 12, 0.05, -1 + rnd() * 9], [0, rnd() * PI, 0], 0);
      for (let i = 0; i < 14; i++)
        b.box(0.15, 0.003, 0.07, note, [-7.5 + rnd() * 6.5, 0.05, -7 + rnd() * 4.6], [0, rnd() * PI, 0], 0);
      // a queue post knocked over by the doors
      b.push([1.4, 0.06, 7.2], [0, 0.6, PI / 2]);
      b.cyl(0.025, 0.025, 0.95, brass, [0, 0.45, 0], null, 8);
      b.cyl(0.16, 0.18, 0.04, brass, [0, -0.02, 0], null, 14);
      b.pop();
      const smear = K.paint(
        'bbk_smear',
        128,
        128,
        (c, W, Hh, r) => {
          c.fillStyle = 'rgba(90,10,10,.75)';
          for (let i = 0; i < 14; i++) {
            c.beginPath();
            c.ellipse(64 + (r() - 0.5) * 70, 64 + (r() - 0.5) * 70, 6 + r() * 20, 4 + r() * 10, r() * PI, 0, PI * 2);
            c.fill();
          }
        },
        {alpha: true, r: 0.4}
      );
      for (const [mx, mz, a] of [
        [-3.6, 0.9, 0.3],
        [2.2, 5.6, 1.4],
        [-1.6, -5.2, 2.2],
        [0.6, -7.8, 0.6]
      ])
        b.label(1.2, 1.2, smear, [mx, 0.052, mz], [-PI / 2, 0, a]);
      // wet floor sign in the hall
      b.push([3.6, 0, 1.6], [0, 0.4, 0]);
      for (const s of [-1, 1]) b.box(0.3, 0.6, 0.02, K.mat(0xf2c418, 0.5), [0, 0.3, s * 0.1], [s * 0.18, 0, 0], 0.005);
      b.pop();
    }

    /* ---------- sidewalk: street lights, meters, hydrant, no parking ---------- */
    LK.lightPole(b, S, -6.2);
    LK.lightPole(b, S, 6.2);
    LK.hydrant(b, S, 8.2);
    LK.meter(b, S, -3.2);
    LK.meter(b, S, 3.2);
    LK.noParking(b, -8.4, {key: 'bbk_np1'});

    return (CACHE = G.done());
  }

  function bBlueBalls(x, z, t) {
    const B = mk(x, z, 20, 36, H, 0xdcd8d0, 0x1f5fd0, 0x2a2c30);
    B.dx = 0;
    const PT = {th: 0.15, c: 0xece4d2},
      ST = {th: 0.3, c: 0x8a8c84}; // strongroom walls are thicker
    const cp = a => a.map(o => Object.assign({}, o));
    WL(B, 1, Z1, X0, X1, cp(FRONT), H);
    WL(B, 1, Z0, X0, X1, cp(BACKD), H);
    WL(B, 0, X0, Z0, Z1, cp(LEFT), H);
    WL(B, 0, X1, Z0, Z1, cp(RIGHT), H);
    WL(B, 1, PZ, X0, X1, cp(PART), H, PT); // banking hall / back of house
    WL(B, 0, XV, Z0, PZ, cp(VAULTD), H, PT); // vault room | corridor
    WL(B, 0, XC, Z0, PZ, cp(OFFD), H, PT); // corridor | offices + toilet
    WL(B, 1, OZ1, XC, X1, [], H, PT); // manager's office | loans office
    WL(B, 1, OZ2, XC, X1, [], H, PT); // loans office | toilet
    WL(B, 1, SZ, X0, SX, cp(STRONG), H, ST); // strongroom front
    WL(B, 0, SX, Z0, SZ, [], H, ST); // strongroom side
    LK.attach(B, build());
    // shade trees in the grass strip
    for (const tx of [-8.6, 8.6])
      try {
        bldTree(B, tx, 15.2, 0.8);
      } catch (e) {}
    // the armoured cash van, backed up to the staff door (cab out to the alley)
    try {
      if (window.MFZV) {
        const vx = -2.6,
          vz = Z0 - 4.6;
        const g = MFZV.make('van', WX(B, vx), WZ(B, vz), PI + (B.cs < 0 ? PI : 0), {
          label: 'BLUE BALLS SECURE CASH',
          labelCol: '#1f5fd0',
          tint: [0.62, 0.64, 0.66],
          dust: true
        });
        const h = g && g.userData && g.userData.half;
        const hx = h ? h[0] : 1.1,
          hz = h ? h[1] : 2.6;
        B.occ.push([vx - hx, vx + hx, vz - hz, vz + hz]);
      }
    } catch (e) {}
    const SP = LK.spawner(B, 'bbk_teller');
    // teller line: cash drawers on the counter, the customer-service desk
    SP(-6.85, -0.42, 'cash_register', 'bbk_teller', PI, 1.06);
    SP(-3.25, -0.42, 'cash_register', 'bbk_teller', PI, 1.06);
    SP(5.4, -0.95, 'desk_office', 'bbk_office', 0);
    // vault room: the row of green safes along the partition, archive shelving and boxes in the alcove
    for (const sx of [-7.75, -6.85, -5.95, -5.05, -4.15]) SP(sx, PZ - 0.075 - 0.42, 'bank_safe', 'bbk_vault', PI);
    SP(-2.0, Z0 + 0.5, 'shop_shelves_half', 'bbk_store', 0);
    SP(-3.0, -9.9, 'cardboard_box_medium', 'bbk_store', 0.2);
    SP(-1.2, -9.4, 'cardboard_box_large', 'bbk_store', -0.3);
    SP(-2.4, -8.6, 'cardboard_box_small', 'bbk_store', 0.7);
    // strongroom: safes and a gun cabinet down the side wall
    SP(SX - 0.55, -10.7, 'bank_safe', 'bbk_vault', -PI / 2);
    SP(SX - 0.55, -9.8, 'bank_safe', 'bbk_vault', -PI / 2);
    SP(SX - 0.45, -8.6, 'gun_cabinet', 'bbk_vault', -PI / 2);
    // manager's office: desk, bookshelf, the manager's own safe; loans office: desk, bookshelf
    SP(5.4, -4.6, 'desk_office', 'bbk_office', 0);
    SP(2.6, PZ - 0.42, 'bookshelf', 'bbk_office', PI);
    SP(X1 - 0.55, -2.6, 'bank_safe', 'bbk_vault', -PI / 2);
    SP(5.4, -8.0, 'desk_steel', 'bbk_office', 0);
    SP(2.3, OZ2 + 0.45, 'bookshelf', 'bbk_office', 0);
    // staff toilet cabinet; the dumpster in the yard
    SP(X1 - 0.25, -9.9, 'medicine_cabinet', 'bbk_wc', -PI / 2);
    SP(-6.0, Z0 - 1.6, 'dumpster_blue', 'storage', PI);
    return LK.finish(B, t, {
      at: [(X0 + X1) / 2, (Z0 + Z1) / 2],
      w: X1 - X0,
      d: Z1 - Z0,
      loot: ['bank', [-6, 6, 2, 8], 1],
      zombies: [
        [-3.0, 5.0],
        [2.4, 6.6],
        [5.6, 3.2],
        [-5.2, -1.2],
        [0.5, -6.0],
        [-6.0, -4.5],
        [-6.0, -10.0],
        [5.0, -3.8],
        [2.0, -14.5],
        [-5.5, -15.5]
      ]
    });
  }

  const e = LK.register({
    id: 'piety_mutual_bank',
    name: 'Blue Balls Bank',
    build: bBlueBalls,
    note: 'half-plot neoclassical bank: portico of fluted columns, big banking hall (waiting area, teller line, check-writing island), vault room with a row of safes and a strongroom, two small offices, staff toilet',
    globals: {bBlueBalls, BLUEBANK: {build}}
  });
  if (e) e.loot = 'bank';
  console.log('[bluebank] Blue Balls Bank ready');
})();
