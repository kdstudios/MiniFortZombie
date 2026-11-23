/* ==========================================================================================================
   MINI FORT ZOMBIE - MEDIKILL DRUG & PHARMACY (v089): a full-block drugstore (40 x 36 m plot, front = +Z), our own design.
   Replaces the Morgan's Drug & Pharmacy placeholder (core NEWCAT id morgans_drug).
   Exterior: a 30 x 15 m single-storey store set right up to the street (no front parking). Sand-coloured tile cladding with a
   brick side and back, a parapet with coping, a blue hipped fabric awning that wraps the front and the right-hand side, a raised
   MEDIKILL sign board on the front parapet with a giant pill capsule and a red cross on the roof behind it, window decals, sliding
   glass double doors, a side door under the awning. Front apron with planters of red flowers, a bench, bins, newspaper boxes and
   two vending machines. Sidewalk: street lights, a meter, a hydrant, no-parking signs. Behind: an open car park (stalls, wheel stops,
   a lamp mast, dumpsters, a delivery apron by the roller shutter) running straight out to the alley, board fences down both sides,
   a power pole with wires, a parked car and an overturned one.
   Interior: a large shop floor (pink / white checkerboard, pale walls with a blue band, drop ceiling with fluorescent troffers):
   gondola aisles, wall shelving, drinks coolers, a checkout counter by the doors, a health & beauty island and the PHARMACY counter
   across the back right with its dispensary behind (medicine cabinets, pill shelving, a safe). Back of house: a stock room with pallet
   racking and a roller shutter to the car park, and a staff room (lockers, table, kitchenette, a vending machine).
   Structure from core WL (doors / windows work); detail is our own geometry and painted artwork, outside the static merge.
   ========================================================================================================== */
(function () {
  'use strict';
  const K = window.MFZK,
    LK = window.LOTKIT;
  if (!K || !LK || typeof WL !== 'function' || typeof NEWCAT === 'undefined') {
    console.warn('[medikill] core / prop kit missing');
    return;
  }
  const T = THREE,
    P = K.P,
    PI = Math.PI;
  // the store box, the back partitions, heights
  const X0 = -15,
    X1 = 15,
    Z0 = -2.5,
    Z1 = 12.5,
    PZ = 2.5, // shop floor / back of house
    PX1 = -3, // stock room | staff room
    PX2 = 5, // staff room | dispensary
    H = 5.0,
    CEIL = 3.6;
  const BLUE = '#1f6fb8',
    NAVY = '#13305a',
    RED = '#d8222a',
    CREAM = '#f6f2e6';
  const FRONT = [
    {k: 'w', c: -13.4},
    {k: 'w', c: -11.7},
    {k: 'w', c: -10.0},
    {k: 'w', c: -8.3},
    {k: 'd', c: -4.65, dbl: 'slide'},
    {k: 'd', c: -3.35, dbl: 'slide'},
    {k: 'w', c: -1.0},
    {k: 'w', c: 0.7},
    {k: 'w', c: 2.4},
    {k: 'w', c: 4.1},
    {k: 'w', c: 5.8},
    {k: 'w', c: 7.5},
    {k: 'w', c: 9.2},
    {k: 'w', c: 10.9},
    {k: 'w', c: 12.6}
  ];
  const RIGHT = [
    {k: 'w', c: 6.4},
    {k: 'd', c: 8.6},
    {k: 'w', c: 10.8}
  ];
  const BACK = [
    {k: 'd', c: -13.2, s: -1},
    {k: 'g', c: -8.0},
    {k: 'd', c: 2.0, s: -1}
  ];
  const PART = [
    {k: 'd', c: -9.65, dbl: 'swing'},
    {k: 'd', c: -8.35, dbl: 'swing'},
    {k: 'd', c: 0.5}, // v089: staff door (was 0.6)
    {k: 'd', c: 10.0}
  ];
  const PARTX1 = [{k: 'd', c: -0.4}];

  /* ===================== loot tables ===================== */
  // the shop floor uses the core 'pharmacy' and 'convenience' tables; these cover the dispensary and back of house
  try {
    Object.assign(LOOT_TABLES, {
      medikill_rx: {
        antibiotics: 6,
        painkiller: 6,
        medkit: 3,
        gauze: 4,
        medical_tape: 4,
        cotton_balls: 3
      },
      medikill_stock: {
        cotton_balls: 4,
        gauze: 3,
        medical_tape: 3,
        painkiller: 3,
        antibiotics: 1,
        bug_spray: 3,
        hairspray: 3,
        water_jug: 3,
        granola: 2,
        tweex: 2,
        cheezholes: 2,
        duct_tape: 2,
        sugar: 1
      },
      medikill_staff: {
        tweex: 3,
        cheezholes: 2,
        z_energy_drink: 3,
        colacola: 2,
        popzi_soft_drink: 2,
        granola: 2,
        water_jug: 2,
        painkiller: 2,
        gauze: 1,
        duct_tape: 1,
        colt_detective_special: 1,
        ammo_38_fed: 1
      }
    });
    for (const tn of ['medikill_rx', 'medikill_stock', 'medikill_staff'])
      for (const id in LOOT_TABLES[tn])
        if (!ITEMS[id]) {
          console.error('[medikill] loot table ' + tn + ' has unknown item ' + id);
          delete LOOT_TABLES[tn][id];
        }
    if (typeof LOOT_PROP !== 'undefined')
      Object.assign(LOOT_PROP, {medikill_rx: 'cabinet', medikill_stock: 'crate', medikill_staff: 'cabinet'});
    const A = window.MFZPROP && MFZPROP.auto;
    if (A) {
      const pick = (...ts) => [...new Set(ts.flatMap(t => A[t] || []))];
      A.medikill_rx = pick('pharmacy', 'clinic');
      A.medikill_stock = pick('pharmacy', 'warehouse', 'storage');
      A.medikill_staff = pick('office');
    }
  } catch (e) {
    console.warn('[medikill] loot tables', e);
  }

  /* ===================== artwork ===================== */
  const IMPACT = "Impact,'Arial Black','MFZ Head',sans-serif";
  // a pill capsule, red / white, centred at (x, y), length l, angle a
  function pill(c, x, y, l, a) {
    const r = l * 0.24;
    c.save();
    c.translate(x, y);
    c.rotate(a);
    c.lineWidth = r * 0.22;
    c.strokeStyle = NAVY;
    c.fillStyle = RED;
    c.beginPath();
    c.arc(-l / 2 + r, 0, r, PI / 2, PI * 1.5);
    c.lineTo(0, -r);
    c.lineTo(0, r);
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = '#fbfbf6';
    c.beginPath();
    c.arc(l / 2 - r, 0, r, -PI / 2, PI / 2);
    c.lineTo(0, r);
    c.lineTo(0, -r);
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = 'rgba(255,255,255,.55)';
    c.fillRect(-l / 2 + r, -r * 0.62, l - 2 * r, r * 0.22);
    c.restore();
  }
  // the red cross in a white roundel with a blue ring
  function crossBadge(c, x, y, R) {
    c.save();
    c.translate(x, y);
    c.fillStyle = BLUE;
    c.beginPath();
    c.arc(0, 0, R, 0, PI * 2);
    c.fill();
    c.fillStyle = '#fff';
    c.beginPath();
    c.arc(0, 0, R * 0.84, 0, PI * 2);
    c.fill();
    c.fillStyle = RED;
    const a = R * 0.2,
      b = R * 0.6;
    c.fillRect(-a, -b, a * 2, b * 2);
    c.fillRect(-b, -a, b * 2, a * 2);
    c.restore();
  }
  // the MEDIKILL logo, designed for a 1000 x 320 box at s = 1
  function drawLogo(c, x, y, s) {
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    crossBadge(c, -390, -10, 120);
    pill(c, -335, 70, 150, -0.6);
    c.font = '170px ' + IMPACT;
    c.textBaseline = 'middle';
    c.textAlign = 'left';
    c.lineJoin = 'round';
    const w1 = c.measureText('MEDI').width;
    c.lineWidth = 16;
    c.strokeStyle = NAVY;
    c.strokeText('MEDI', -240, -40);
    c.strokeText('KILL', -240 + w1, -40);
    c.fillStyle = '#ffffff';
    c.fillText('MEDI', -240, -40);
    c.fillStyle = RED;
    c.fillText('KILL', -240 + w1, -40);
    P.text(c, 'DRUG & PHARMACY', 150, 85, {size: 62, col: '#ffffff', font: IMPACT, stroke: NAVY, lw: 8, max: 600});
    P.text(c, 'WE KILL PAIN', 150, 140, {size: 30, col: '#ffd86a', font: IMPACT, max: 400, ls: 6});
    c.restore();
  }
  // the roof sign board: navy panel, white border, the logo
  const signMat = () =>
    K.paint(
      'mk_sign',
      1024,
      336,
      (c, W, H, r) => {
        c.fillStyle = '#1a3f74';
        c.fillRect(0, 0, W, H);
        c.fillStyle = 'rgba(255,255,255,.06)';
        for (let i = 0; i < 12; i++) c.fillRect(0, (i * H) / 12, W, H / 24);
        c.strokeStyle = '#f2f2ea';
        c.lineWidth = 12;
        c.strokeRect(10, 10, W - 20, H - 20);
        drawLogo(c, W / 2 + 10, H / 2, 0.98);
        P.grime(c, W, H, r, 0.3);
      },
      {r: 0.5, glow: 0.25}
    );
  // window poster: cream card, blue header bar, dark lines (a line can be [text, colour])
  const poster = (key, lines, o) => {
    o = o || {};
    return K.paint(
      key,
      o.w || 256,
      o.h || 320,
      (c, W, H, r) => {
        c.fillStyle = o.bg || CREAM;
        c.fillRect(0, 0, W, H);
        c.fillStyle = o.bar || BLUE;
        c.fillRect(0, 0, W, H * 0.14);
        P.text(c, o.head || 'MEDIKILL', W / 2, H * 0.07, {size: Math.round(H * 0.09), col: '#fff', font: IMPACT});
        const n = lines.length,
          lh = (H * 0.8) / n;
        lines.forEach((s, i) => {
          const col = Array.isArray(s) ? s[1] : o.col || NAVY;
          P.text(c, Array.isArray(s) ? s[0] : s, W / 2, H * 0.17 + lh * (i + 0.5), {
            size: Math.round(lh * 0.7),
            col,
            font: IMPACT,
            max: W * 0.88
          });
        });
        if (o.pill) pill(c, W * 0.8, H * 0.88, W * 0.26, -0.5);
        P.grime(c, W, H, r, 0.2);
      },
      {r: 0.5, glow: o.glow || 0.1}
    );
  };
  // a sign board: solid background, one or two lines
  const board = (key, l1, l2, bg, fg, w, h) =>
    K.paint(key, w || 512, h || 128, (c, W, H) => {
      c.fillStyle = bg;
      c.fillRect(0, 0, W, H);
      P.text(c, l1, W / 2, l2 ? H * 0.36 : H / 2, {
        size: Math.round(H * (l2 ? 0.42 : 0.6)),
        col: fg,
        font: IMPACT,
        max: W * 0.92
      });
      if (l2) P.text(c, l2, W / 2, H * 0.76, {size: Math.round(H * 0.24), col: fg, max: W * 0.92});
    });

  /* ===================== surfaces ===================== */
  const SURF = {};
  const surf = k =>
    SURF[k] ||
    (SURF[k] = {
      asphalt: () => K.surf('asphalt', 0x3a3c40),
      concrete: () => K.surf('concrete', 0xb4b0a6),
      lawn: () => K.surf('lawn', 0x4a6a2a),
      hedge: () => K.surf('leaves', 0x2e4a22),
      fence: () => K.surf('wood', 0x6a5444),
      // big sand-coloured cladding tiles, ~1 m square, pale grout, stained
      tile: () =>
        K.tri(
          'mk_tile',
          (c, W, H, r) => {
            c.fillStyle = '#e4d6b0';
            c.fillRect(0, 0, W, H);
            const n = 2,
              s = W / n;
            for (let j = 0; j < n; j++)
              for (let i = 0; i < n; i++) {
                c.fillStyle = `hsl(${40 + r() * 4},${38 + r() * 8}%,${58 + r() * 7}%)`;
                c.fillRect(i * s + 4, j * s + 4, s - 8, s - 8);
              }
            P.noise(c, W, H, r, 7000, 0.14, '#6a5430', 1.4);
            P.grime(c, W, H, r, 0.45);
          },
          {tile: 2.0, r: 0.75}
        ),
      // yellow-tan brick for the side and back walls
      brick: () =>
        K.tri(
          'mk_brick',
          (c, W, H, r) => {
            c.fillStyle = '#b8a888';
            c.fillRect(0, 0, W, H);
            const rows = 16,
              bh = H / rows,
              bw = W / 4;
            for (let j = 0; j < rows; j++)
              for (let i = -1; i < 5; i++) {
                const x = i * bw + (j % 2 ? bw / 2 : 0);
                c.fillStyle = `hsl(${38 + r() * 8},${32 + r() * 14}%,${52 + r() * 14}%)`;
                c.fillRect(x + 2, j * bh + 2, bw - 4, bh - 4);
              }
            P.noise(c, W, H, r, 6000, 0.15, '#4a3a20', 1.3);
            P.grime(c, W, H, r, 0.5);
          },
          {tile: 1.2, r: 0.9}
        ),
      // blue awning fabric with seams
      fabric: () =>
        K.tri(
          'mk_fabric',
          (c, W, H, r) => {
            c.fillStyle = '#1f78c4';
            c.fillRect(0, 0, W, H);
            for (let i = 0; i < 4; i++) {
              c.fillStyle = 'rgba(10,40,80,.35)';
              c.fillRect((i * W) / 4, 0, 4, H);
              c.fillStyle = 'rgba(255,255,255,.12)';
              c.fillRect((i * W) / 4 + 4, 0, 3, H);
            }
            P.noise(c, W, H, r, 5000, 0.12, '#0a2a50', 1.3);
            P.grime(c, W, H, r, 0.3);
          },
          {tile: 2.4, r: 0.7}
        ),
      // pink / white checkerboard shop floor
      checker: () =>
        K.tri(
          'mk_checker',
          (c, W, H, r) => {
            const n = 4,
              s = W / n;
            for (let j = 0; j < n; j++)
              for (let i = 0; i < n; i++) {
                c.fillStyle =
                  (i + j) % 2 ? `hsl(355,${44 + r() * 8}%,${70 + r() * 5}%)` : `hsl(210,6%,${88 + r() * 5}%)`;
                c.fillRect(i * s, j * s, s, s);
              }
            c.strokeStyle = 'rgba(80,70,70,.25)';
            c.lineWidth = 2;
            for (let i = 0; i <= n; i++) {
              c.beginPath();
              c.moveTo(i * s, 0);
              c.lineTo(i * s, H);
              c.moveTo(0, i * s);
              c.lineTo(W, i * s);
              c.stroke();
            }
            P.noise(c, W, H, r, 5000, 0.12, '#3a3030', 1.4);
            P.grime(c, W, H, r, 0.3);
          },
          {tile: 2.4, r: 0.35}
        ),
      floorC: () => K.surf('concrete', 0x8e8c86),
      vinyl: () =>
        K.tri(
          'mk_vinyl',
          (c, W, H, r) => {
            c.fillStyle = '#b8b0a0';
            c.fillRect(0, 0, W, H);
            for (let i = 0; i < 300; i++) {
              c.fillStyle = `rgba(${r() < 0.5 ? '90,80,70' : '240,236,226'},.35)`;
              c.fillRect(r() * W, r() * H, 3 + r() * 6, 2 + r() * 4);
            }
            c.strokeStyle = 'rgba(70,60,50,.3)';
            for (let i = 0; i <= 2; i++) {
              c.beginPath();
              c.moveTo((i * W) / 2, 0);
              c.lineTo((i * W) / 2, H);
              c.moveTo(0, (i * H) / 2);
              c.lineTo(W, (i * H) / 2);
              c.stroke();
            }
            P.grime(c, W, H, r, 0.3);
          },
          {tile: 0.9, r: 0.5}
        ),
      ceil: () =>
        K.tri(
          'mk_ceil',
          (c, W, H, r) => {
            c.fillStyle = '#e8e6e0';
            c.fillRect(0, 0, W, H);
            P.noise(c, W, H, r, 6000, 0.25, '#b8b4aa', 1.2);
            c.fillStyle = '#c8c8c4';
            for (let i = 0; i <= 4; i++) {
              c.fillRect((i * W) / 4 - 3, 0, 6, H);
              c.fillRect(0, (i * H) / 4 - 3, W, 6);
            }
            for (let k = 0; k < 3; k++) {
              c.fillStyle = 'rgba(150,120,60,.18)';
              c.beginPath();
              c.arc(r() * W, r() * H, 20 + r() * 40, 0, PI * 2);
              c.fill();
            }
          },
          {tile: 2.4, r: 0.9}
        ),
      wall: () =>
        K.tri(
          'mk_wall',
          (c, W, H, r) => {
            c.fillStyle = '#e4e6ea';
            c.fillRect(0, 0, W, H);
            P.noise(c, W, H, r, 5000, 0.1, '#8a8e98', 1.4);
            P.grime(c, W, H, r, 0.35);
          },
          {tile: 2.0, r: 0.85}
        ),
      coping: () => K.mat(0x8a8478, 0.6, 0.3),
      alu: () => K.mat(0x3a3e44, 0.45, 0.6),
      grey: () => K.mat(0xc4c2ba, 0.9)
    }[k]());

  /* ===================== geometry ===================== */
  let CACHE = null;
  function build() {
    if (CACHE) return CACHE;
    const G = LK.geo('medikill'),
      b = G.b,
      S = G.S;
    const conc = surf('concrete'),
      asph = surf('asphalt'),
      rnd = b.rnd;
    /* ---------- grounds: sidewalk, front apron, side walks, car park behind ---------- */
    LK.pavement(b, conc, {kerb: true});
    b.box(40, 0.04, 3.4, conc, [0, 0.02, (Z1 + 15.9) / 2], null, 0); // front apron under the awning
    b.box(40, 0.02, 18 + Z0, asph, [0, 0.012, (-18 + Z0) / 2], null, 0); // the car park, out to the alley
    b.box(4.9, 0.04, Z1 - Z0, conc, [-17.55, 0.02, (Z0 + Z1) / 2], null, 0); // walk down the left
    b.box(2.4, 0.04, Z1 - Z0, conc, [16.2, 0.02, (Z0 + Z1) / 2], null, 0); // walk under the side awning
    b.box(2.6, 0.04, Z1 - Z0, surf('lawn'), [18.7, 0.03, (Z0 + Z1) / 2], null, 0);
    const tile = surf('tile'),
      brk = surf('brick'),
      cop = surf('coping'),
      alu = surf('alu'),
      dark = K.mat(0x1c1c1e, 0.5),
      steel = K.mat(0x9a9ea2, 0.4, 0.7),
      galv = K.mat(0xb8bcc0, 0.35, 0.8),
      lineW = K.mat(0xf2f2ea, 0.6),
      lineY = K.mat(0xf2c418, 0.6),
      wood = K.surf('wood', 0x6a4a2a);
    // a flat polygon (fan from the first point), both faces, uv in metres along its first edge
    const poly = (pts, mat, us) => {
      us = us || 1;
      const V = pts.map(p => new T.Vector3(...p)),
        e1 = V[1].clone().sub(V[0]).normalize(),
        nrm = V[1].clone().sub(V[0]).cross(V[2].clone().sub(V[0])).normalize(),
        e2 = nrm.clone().cross(e1);
      const pos = [],
        nor = [],
        uv = [];
      const put = (a, n) => {
        pos.push(a.x, a.y, a.z);
        nor.push(n.x, n.y, n.z);
        const d = a.clone().sub(V[0]);
        uv.push(d.dot(e1) / us, d.dot(e2) / us);
      };
      const back = nrm.clone().negate();
      for (let i = 1; i < V.length - 1; i++) {
        put(V[0], nrm);
        put(V[i], nrm);
        put(V[i + 1], nrm);
        put(V[0], back);
        put(V[i + 1], back);
        put(V[i], back);
      }
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      g.setAttribute('normal', new T.Float32BufferAttribute(nor, 3));
      g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
      b.add(g, mat);
    };

    /* ---------- exterior skin: tile cladding front and right, brick left and back, dark base band ---------- */
    const BAND = 0.45,
      baseM = K.mat(0x5a5248, 0.85);
    const skin = (ax, f, a0, a1, n, ops, m) => {
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
        put(y0, Math.min(y1, BAND), baseM);
        put(Math.max(y0, BAND), y1, m);
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
    skin(1, Z1, X0 - 0.15, X1 + 0.15, 1, FRONT, tile);
    skin(0, X1, Z0, Z1, 1, RIGHT, tile);
    skin(1, Z0, X0 - 0.15, X1 + 0.15, -1, BACK, brk);
    skin(0, X0, Z0, Z1, -1, [], brk);
    // window frames + sills (front and right)
    for (const w of FRONT.filter(p => p.k === 'w')) {
      b.box(1.62, 0.07, 0.16, cop, [w.c, 0.9, Z1 + 0.22], null, 0.01);
      b.frame(1.56, 1.9, 0.06, alu, [w.c, 1.825, Z1 + 0.19], 0.06);
    }
    for (const w of RIGHT.filter(p => p.k === 'w')) {
      b.box(0.16, 0.07, 1.62, cop, [X1 + 0.22, 0.9, w.c], null, 0.01);
      b.push([X1 + 0.19, 1.825, w.c], [0, PI / 2, 0]);
      b.frame(1.56, 1.9, 0.06, alu, [0, 0, 0], 0.06);
      b.pop();
    }
    // the entrance: a tile-faced header box over the sliding doors
    b.box(3.4, 0.5, 0.2, alu, [-4, 2.65, Z1 + 0.26], null, 0.01);
    // parapet with coping
    const par = (ax, f, a0, a1, m) => {
      const L = a1 - a0,
        u = (a0 + a1) / 2;
      if (ax) {
        b.box(L, 0.7, 0.3, m, [u, H + 0.35, f], null, 0);
        b.box(L + 0.1, 0.07, 0.42, cop, [u, H + 0.73, f], null, 0.01);
      } else {
        b.box(0.3, 0.7, L, m, [f, H + 0.35, u], null, 0);
        b.box(0.42, 0.07, L + 0.1, cop, [f, H + 0.73, u], null, 0.01);
      }
    };
    par(1, Z1, X0 - 0.15, X1 + 0.15, tile);
    par(1, Z0, X0 - 0.15, X1 + 0.15, brk);
    par(0, X0, Z0, Z1, brk);
    par(0, X1, Z0, Z1, tile);
    // flat roof: membrane, HVAC units, vents, a roof hatch
    b.box(X1 - X0, 0.12, Z1 - Z0, K.surf('concrete', 0x5a5a58), [(X0 + X1) / 2, H + 0.02, (Z0 + Z1) / 2], null, 0);
    b.box(X1 - X0 - 0.3, 0.02, Z1 - Z0 - 0.3, K.mat(0x3a3c40, 0.9), [(X0 + X1) / 2, H + 0.09, (Z0 + Z1) / 2], null, 0);
    for (const [hx, hz] of [
      [-10, 3],
      [9, 1]
    ]) {
      b.rbox(2.2, 1.1, 1.5, 0.03, K.mat(0xb0b4b8, 0.4, 0.7), [hx, H + 0.65, hz]);
      b.vents(6, 2.0, 0.8, K.mat(0x6a6c6e, 0.5, 0.6), [hx, H + 0.65, hz + 0.76]);
      b.cyl(0.55, 0.55, 0.1, K.mat(0x2a2a2a, 0.5, 0.4), [hx, H + 1.25, hz], null, 20);
    }
    for (const [vx, vz] of [
      [-13, -1],
      [-2, 0],
      [12, 8],
      [6, -1.5]
    ])
      b.cyl(0.08, 0.08, 0.8, K.mat(0x7a7c7e, 0.4, 0.7), [vx, H + 0.5, vz], null, 10);
    b.box(0.9, 0.3, 0.9, galv, [-6, H + 0.24, -0.5], null, 0.01);

    /* ---------- awning: blue fabric, hipped, wrapping the front and the right-hand side ---------- */
    {
      const fab = surf('fabric'),
        WF = Z1 + 0.2,
        XF = X1 + 0.2,
        XL = X0 - 0.4,
        ZB = Z0 + 0.3,
        D = 2.2,
        yT = 4.15,
        yB = 3.0;
      // front slope (mitred into the right slope at the corner), left hip
      poly(
        [
          [XL + D, yT, WF],
          [XF, yT, WF],
          [XF + D, yB, WF + D],
          [XL, yB, WF + D]
        ],
        fab
      );
      poly(
        [
          [XL + D, yT, WF],
          [XL, yB, WF + D],
          [XL, yB, WF]
        ],
        fab
      );
      // right slope, back hip
      poly(
        [
          [XF, yT, WF],
          [XF, yT, ZB + D],
          [XF + D, yB, ZB],
          [XF + D, yB, WF + D]
        ],
        fab
      );
      poly(
        [
          [XF, yT, ZB + D],
          [XF, yB, ZB],
          [XF + D, yB, ZB]
        ],
        fab
      );
      // valance round the outer edges, steel flashing along the wall
      const VH = 0.26,
        vm = K.mat(0x175f9e, 0.75);
      b.box(XF + D - XL, VH, 0.03, vm, [(XL + XF + D) / 2, yB - VH / 2, WF + D], null, 0);
      b.box(0.03, VH, WF + D - ZB, vm, [XF + D, yB - VH / 2, (ZB + WF + D) / 2], null, 0);
      b.box(0.03, VH, D, vm, [XL, yB - VH / 2, WF + D / 2], null, 0);
      b.box(D, VH, 0.03, vm, [XF + D / 2, yB - VH / 2, ZB], null, 0);
      b.box(XF - XL, 0.08, 0.08, galv, [(XL + XF) / 2, yT + 0.04, WF], null, 0.01);
      b.box(0.08, 0.08, WF - ZB, galv, [XF, yT + 0.04, (WF + ZB) / 2], null, 0.01);
      // steel tie rods from the wall to the front edge
      for (let x = XL + 1.6; x < XF; x += 3.4)
        b.tube(
          [
            [x, yT + 0.6, WF],
            [x, yB + 0.05, WF + D - 0.1]
          ],
          0.018,
          steel,
          2,
          6
        );
      for (let zz = WF - 1.2; zz > ZB + 1; zz -= 3.4)
        b.tube(
          [
            [XF, yT + 0.6, zz],
            [XF + D - 0.1, yB + 0.05, zz]
          ],
          0.018,
          steel,
          2,
          6
        );
    }

    /* ---------- roof sign: the MEDIKILL board on the front parapet, a giant pill capsule and a red cross ---------- */
    {
      const SX0 = -9,
        SX1 = 3,
        SY0 = H + 0.5,
        SY1 = H + 3.0,
        SZ = Z1 - 0.35;
      b.box(
        SX1 - SX0 + 0.3,
        SY1 - SY0 + 0.3,
        0.3,
        K.mat(0xe8e8e2, 0.5),
        [(SX0 + SX1) / 2, (SY0 + SY1) / 2, SZ - 0.05],
        null,
        0.02
      );
      b.label(SX1 - SX0, SY1 - SY0, signMat(), [(SX0 + SX1) / 2, (SY0 + SY1) / 2, SZ + 0.11]);
      for (const px of [SX0 + 1, (SX0 + SX1) / 2, SX1 - 1]) {
        b.box(0.14, SY0 - H + 0.2, 0.14, steel, [px, (H + SY0) / 2, SZ - 0.1], null, 0.01);
        b.tube(
          [
            [px, SY1 - 0.3, SZ - 0.25],
            [px, H + 0.1, SZ - 2.2]
          ],
          0.04,
          steel,
          2,
          6
        );
      }
      // gooseneck lamps over the board
      for (const lx of [SX0 + 2, (SX0 + SX1) / 2, SX1 - 2]) {
        b.tube(
          [
            [lx, SY1 + 0.05, SZ],
            [lx, SY1 + 0.4, SZ + 0.25],
            [lx, SY1 + 0.3, SZ + 0.55]
          ],
          0.025,
          dark,
          6,
          6
        );
        b.cyl(0.05, 0.16, 0.14, dark, [lx, SY1 + 0.24, SZ + 0.6], null, 12);
      }
      // the pill: red and white halves with round ends, tilted on a steel cradle
      b.push([5.2, H + 2.6, 9.6], [0, -0.3, 0.55]);
      const red = K.mat(0xc81c24, 0.35, 0.1),
        wht = K.mat(0xf4f4ee, 0.35, 0.1);
      b.cyl(0.85, 0.85, 1.4, red, [-0.7, 0, 0], [0, 0, PI / 2], 24);
      b.cyl(0.85, 0.85, 1.4, wht, [0.7, 0, 0], [0, 0, PI / 2], 24);
      b.sph(0.85, red, [-1.4, 0, 0], null, 22);
      b.sph(0.85, wht, [1.4, 0, 0], null, 22);
      b.cyl(0.87, 0.87, 0.06, K.mat(0x8a8a86, 0.4, 0.5), [0, 0, 0], [0, 0, PI / 2], 24);
      b.pop();
      for (const [px, pz] of [
        [4.2, 9.2],
        [6.2, 10.0]
      ])
        b.box(0.12, 2.0, 0.12, steel, [px, H + 1.0, pz], null, 0.01);
      // the red cross, standing on its own frame behind the sign
      b.push([-11.5, H + 2.6, 10.4], [0, 0.15, 0]);
      const cr = K.mat(0xd8222a, 0.4, 0.1, {emissive: 0x6a0808, emissiveIntensity: 0.4});
      b.box(0.85, 2.5, 0.6, cr, [0, 0, 0], null, 0.03);
      b.box(2.5, 0.85, 0.6, cr, [0, 0, 0], null, 0.03);
      b.box(0.12, 2.0, 0.12, steel, [-0.3, -2.0, -0.2], null, 0.01);
      b.box(0.12, 2.0, 0.12, steel, [0.3, -2.0, -0.2], null, 0.01);
      b.pop();
    }

    /* ---------- window decals ---------- */
    {
      const PO = [
        poster('mk_p1', ['FLU SHOTS', 'WALK-IN', ['TODAY', RED]]),
        poster('mk_p2', ['VITAMINS', ['2 FOR 1', RED], 'ALL WEEK'], {pill: true}),
        poster('mk_p3', ['PHOTO', 'DEVELOPING', ['1 HOUR', RED]]),
        poster('mk_p4', ['ASPIRIN', ['99¢', RED], 'WE KILL PAIN'], {pill: true}),
        poster('mk_p5', ['OPEN', ['24 HRS', RED], 'PHARMACY'], {bar: RED})
      ];
      const at = [-13.4, -10.0, 2.4, 7.5, 10.9];
      at.forEach((x, i) => b.label(0.62, 0.78, PO[i], [x + (i % 2 ? 0.3 : -0.3), 1.42, Z1 + 0.2]));
      b.push([X1 + 0.2, 1.42, 10.8], [0, PI / 2, 0]);
      b.label(0.62, 0.78, PO[3], [0, 0, 0]);
      b.pop();
      // hours card by the doors
      b.label(0.42, 0.56, board('mk_hours', 'MEDIKILL', 'MON-SUN · OPEN 24 HRS', '#f6f2e6', '#13305a', 220, 300), [
        -2.35,
        1.5,
        Z1 + 0.2
      ]);
      // a small blade sign at the side door
      b.push([X1 + 0.2, 2.75, 8.6], [0, PI / 2, 0]);
      b.label(1.6, 0.36, board('mk_side', 'PHARMACY ENTRANCE', null, '#1a3f74', '#ffffff', 512, 112), [0, 0, 0]);
      b.pop();
    }

    /* ---------- front apron: planters of red flowers, bench, bins, newspaper boxes ---------- */
    {
      const pl = K.surf('concrete', 0x9a968c),
        leaf = K.mat(0x2e5a24, 0.8),
        flw = K.mat(0xc8141c, 0.6);
      const planter = (px, pz, w, d) => {
        b.box(w, 0.45, d, pl, [px, 0.245, pz], null, 0.02);
        b.box(w - 0.12, 0.05, d - 0.12, K.surf('soil', 0x3a2a1e), [px, 0.46, pz], null, 0);
        for (let i = 0; i < Math.round(w * 10); i++) {
          const fx = px + (rnd() - 0.5) * (w - 0.2),
            fz = pz + (rnd() - 0.5) * (d - 0.2);
          b.sph(0.07 + rnd() * 0.04, leaf, [fx, 0.55, fz], null, 6);
          if (rnd() < 0.7) b.sph(0.045, flw, [fx + 0.03, 0.66 + rnd() * 0.06, fz], null, 6);
        }
        S(px - w / 2, px + w / 2, pz - d / 2, pz + d / 2, 0, 0.5, true);
      };
      planter(-12.0, 13.55, 2.2, 0.6);
      planter(-7.6, 13.55, 1.6, 0.6);
      planter(3.4, 13.55, 1.8, 0.6);
      planter(9.6, 13.55, 1.8, 0.6);
      // bench between the planters
      const bench = (bx, bz, ry) => {
        b.push([bx, 0, bz], [0, ry, 0]);
        for (let i = 0; i < 4; i++) b.box(1.8, 0.04, 0.09, wood, [0, 0.45, -0.17 + i * 0.11], null, 0.005);
        for (const lx of [-0.75, 0.75]) b.box(0.06, 0.44, 0.42, dark, [lx, 0.22, 0], null, 0.005);
        b.pop();
        S(bx - 0.9, bx + 0.9, bz - 0.25, bz + 0.25, 0, 0.5, true);
      };
      bench(6.5, 13.65, 0);
      // litter bins, newspaper boxes
      const bin = (bx, bz) => {
        b.cyl(0.26, 0.24, 0.85, K.mat(0x8a8e90, 0.5, 0.5), [bx, 0.47, bz], null, 16, true);
        b.cyl(0.27, 0.27, 0.04, dark, [bx, 0.9, bz], null, 16);
        S(bx - 0.27, bx + 0.27, bz - 0.27, bz + 0.27, 0, 0.9, true);
      };
      bin(-6.0, 13.3);
      bin(13.4, 13.3);
      const news = (nx, nz, col, ry) => {
        b.push([nx, 0, nz], [0, ry, 0]);
        b.box(0.5, 0.95, 0.45, K.mat(col, 0.5, 0.2), [0, 0.6, 0], null, 0.02);
        b.box(0.42, 0.3, 0.02, K.glass(0xdfeff4, 0.3), [0, 0.85, 0.23], null, 0);
        b.box(0.08, 0.12, 0.47, dark, [0, 0.06, 0], null, 0);
        b.pop();
        S(nx - 0.27, nx + 0.27, nz - 0.25, nz + 0.25, 0, 1.1, true);
      };
      news(-1.9, 13.3, 0x1f4aa8, 0);
      news(-1.25, 13.3, 0xc8b020, 0);
      news(15.75, 11.6, 0x1f4aa8, PI / 2);
    }

    /* ---------- car park behind: stalls, wheel stops, delivery apron, lamp mast ---------- */
    {
      const ws = K.surf('concrete', 0xc4c0b4);
      const lineZ = (x, z0, z1) => b.box(0.12, 0.01, Math.abs(z1 - z0), lineW, [x, 0.03, (z0 + z1) / 2], null, 0);
      const lineX = (z, x0, x1) => b.box(Math.abs(x1 - x0), 0.01, 0.12, lineW, [(x0 + x1) / 2, 0.03, z], null, 0);
      const stop = (x, z, ax) => {
        if (ax) b.box(0.18, 0.13, 1.7, ws, [x, 0.075, z], null, 0.02);
        else b.box(1.7, 0.13, 0.18, ws, [x, 0.075, z], null, 0.02);
      };
      // row along the back wall (nose to the building), right of the staff door
      for (let x = 4.0; x <= 14.5; x += 2.6) lineZ(x, Z0 - 0.6, Z0 - 5.6);
      for (let x = 5.3; x < 14.5; x += 2.6) stop(x, Z0 - 1.2, false);
      // rows down both side fences (nose to the fence)
      for (let z = -6.4; z >= -17; z -= 2.6) lineX(z, 14.4, 19.5);
      for (let z = -7.7; z > -17; z -= 2.6) stop(18.9, z, true);
      for (let z = -6.4; z >= -15; z -= 2.6) lineX(z, -19.5, -14.4);
      for (let z = -7.7; z > -15; z -= 2.6) stop(-18.9, z, true);
      // disabled bay sign by the back row
      b.box(0.06, 2.0, 0.06, galv, [14.9, 1.0, Z0 - 0.5], null, 0);
      b.label(0.4, 0.4, board('mk_dis', '♿', 'RESERVED', '#1f5aa8', '#ffffff', 160, 160), [14.9, 1.8, Z0 - 0.46]);
      // hatched delivery apron outside the roller shutter + the stock-room door, and outside the staff door
      const hatch = (x0, x1, z0, z1) => {
        lineX(z0, x0, x1);
        lineX(z1, x0, x1);
        lineZ(x0, z0, z1);
        lineZ(x1, z0, z1);
        for (let x = x0 + 0.6; x < x1; x += 0.8)
          b.box(0.1, 0.01, Math.abs(z1 - z0) * 1.2, lineY, [x, 0.031, (z0 + z1) / 2], [0, 0.6, 0], 0);
      };
      hatch(-10.2, -5.8, Z0 - 0.3, Z0 - 4.3);
      hatch(0.6, 3.4, Z0 - 0.3, Z0 - 2.3);
      // concrete step + light over each back door
      for (const dx of [-13.2, 2.0]) {
        b.box(1.8, 0.14, 1.0, conc, [dx, 0.07, Z0 - 0.7], null, 0.02);
        b.box(0.3, 0.16, 0.2, dark, [dx, 2.85, Z0 - 0.3], null, 0.01);
        b.box(
          0.24,
          0.04,
          0.16,
          K.mat(0xfff4d0, 0.4, 0, {emissive: 0xffe8b0, emissiveIntensity: 0.8}),
          [dx, 2.76, Z0 - 0.3],
          null,
          0
        );
      }
      // roller shutter box + guides on the back wall
      b.box(1.9, 0.35, 0.35, galv, [-8.0, 2.75, Z0 - 0.35], null, 0.02);
      for (const gx of [-8.85, -7.15]) b.box(0.1, 2.5, 0.12, galv, [gx, 1.25, Z0 - 0.22], null, 0);
      // lamp mast in the middle of the lot
      b.cyl(0.11, 0.16, 7.2, steel, [2, 3.6, -11.5], null, 12);
      b.cyl(0.32, 0.36, 0.5, ws, [2, 0.25, -11.5], null, 14);
      for (const s of [-1, 1]) {
        b.box(1.2, 0.08, 0.08, steel, [2 + s * 0.6, 7.1, -11.5], null, 0);
        b.box(0.6, 0.14, 0.32, K.mat(0x4a4c50, 0.5, 0.5), [2 + s * 1.2, 7.05, -11.5], null, 0.01);
        b.box(
          0.5,
          0.02,
          0.24,
          K.mat(0xffffff, 0.4, 0, {emissive: 0xfff2d8, emissiveIntensity: 0.9}),
          [2 + s * 1.2, 6.97, -11.5],
          null,
          0
        );
      }
      S(1.65, 2.35, -11.85, -11.15, 0, 7.2, true);
      // oil stains and a drain cover
      const stain = K.paint(
        'mk_stain',
        256,
        256,
        (c, W, H, r) => {
          c.clearRect(0, 0, W, H);
          for (let k = 0; k < 9; k++) {
            c.fillStyle = `rgba(10,10,12,${0.15 + r() * 0.25})`;
            c.beginPath();
            c.ellipse(
              W / 2 + (r() - 0.5) * 120,
              H / 2 + (r() - 0.5) * 120,
              20 + r() * 50,
              14 + r() * 30,
              r() * PI,
              0,
              PI * 2
            );
            c.fill();
          }
        },
        {alpha: true, r: 0.3}
      );
      for (const [sx, sz] of [
        [6.6, Z0 - 3],
        [11.8, Z0 - 3.2],
        [17, -10.4],
        [-17, -8.5],
        [-2, -10]
      ])
        b.label(1.6, 1.6, stain, [sx, 0.035, sz], [-PI / 2, 0, rnd() * PI]);
      b.cyl(0.35, 0.35, 0.02, K.mat(0x4a4a4a, 0.5, 0.6), [-1.0, 0.03, -13], null, 16);
    }

    /* ---------- board fences down both sides, short returns at the alley; power pole with wires ---------- */
    {
      const fm = surf('fence'),
        post = K.surf('wood', 0x5a4434);
      const fence = (ax, f, a0, a1) => {
        const L = a1 - a0,
          u = (a0 + a1) / 2;
        if (ax) b.box(L, 1.9, 0.05, fm, [u, 0.97, f], null, 0);
        else b.box(0.05, 1.9, L, fm, [f, 0.97, u], null, 0);
        for (let a = a0; a <= a1 + 0.01; a += 2.4) {
          if (ax) b.box(0.1, 2.0, 0.1, post, [a, 1.0, f + 0.06], null, 0.005);
          else b.box(0.1, 2.0, 0.1, post, [f + 0.06 * (f < 0 ? 1 : -1), 1.0, a], null, 0.005);
        }
        if (ax) S(a0, a1, f - 0.08, f + 0.08, 0, 1.95);
        else S(f - 0.08, f + 0.08, a0, a1, 0, 1.95);
      };
      fence(0, -19.92, -17.95, 12.0);
      fence(0, 19.92, -17.95, 0.5);
      fence(1, -17.95, -19.92, -16.6);
      fence(1, -17.95, 16.6, 19.92);
      // power pole on the right rear corner, wires running off over the alley
      const pole = K.surf('wood', 0x6a5038);
      // v090: a pole at each end of the run too (the wires ended in mid-air over the alley and the front)
      for (const pz of [-2.0, -18.4, 15.4]) {
        b.cyl(0.14, 0.18, 9.0, pole, [18.6, 4.5, pz], null, 10);
        b.box(2.2, 0.14, 0.14, pole, [18.6, 8.4, pz], null, 0.01);
        for (const wx of [17.7, 18.3, 18.9, 19.5])
          b.cyl(0.04, 0.05, 0.14, K.mat(0x3a6a5a, 0.3), [wx, 8.55, pz], null, 8);
        S(18.4, 18.8, pz - 0.2, pz + 0.2, 0, 9, true);
      }
      for (const wx of [17.7, 18.3, 18.9, 19.5]) {
        b.tube(
          [
            [wx, 8.6, -2.0],
            [wx, 7.6, -10.2],
            [wx, 8.6, -18.4]
          ],
          0.012,
          dark,
          12,
          4
        );
        b.tube(
          [
            [wx, 8.6, -2.0],
            [wx, 7.6, 6.7],
            [wx, 8.6, 15.4]
          ],
          0.012,
          dark,
          12,
          4
        );
      }
      b.cyl(0.28, 0.28, 0.8, K.mat(0x8a8e90, 0.5, 0.5), [18.6, 7.3, -1.75], null, 12);
    }

    /* ---------- interior: floors, linings, ceiling, lights ---------- */
    const wl = surf('wall'),
      gry = surf('grey'),
      base = K.mat(0x2a2a2c, 0.6),
      glass = K.glass(0xdfeff4, 0.2),
      lit = K.mat(0xffffff, 0.4, 0, {emissive: 0xf6f8ff, emissiveIntensity: 0.95}),
      hous = K.mat(0xd8d8d4, 0.5, 0.2),
      lam = K.mat(0xe8e4dc, 0.5),
      bluM = K.mat(0x1f6fb8, 0.55);
    const flr = (x0, x1, z0, z1, m) =>
      b.box(x1 - x0 - 0.2, 0.02, z1 - z0 - 0.2, m, [(x0 + x1) / 2, 0.035, (z0 + z1) / 2], null, 0);
    flr(X0, X1, PZ, Z1, surf('checker'));
    flr(X0, PX1, Z0, PZ, surf('floorC'));
    flr(PX1, PX2, Z0, PZ, surf('vinyl'));
    flr(PX2, X1, Z0, PZ, surf('vinyl'));
    b.box(X1 - X0 - 0.3, 0.04, Z1 - Z0 - 0.3, surf('ceil'), [(X0 + X1) / 2, CEIL + 0.02, (Z0 + Z1) / 2], null, 0);
    // shop: pale walls, black skirting, a blue band with a red pinstripe under the ceiling
    const shopSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, Math.min(y1, CEIL - 0.5), wl, 0.012, 0.006);
      if (y1 > CEIL - 0.5) pc(u0, u1, Math.max(y0, CEIL - 0.5), y1, bluM, 0.014, 0.007);
      if (y0 <= 0 && y1 > 0.15) pc(u0, u1, 0, 0.12, base, 0.03, 0.015);
      if (y0 <= CEIL - 0.56 && y1 >= CEIL - 0.5)
        pc(u0, u1, CEIL - 0.56, CEIL - 0.52, K.mat(0xd8222a, 0.5), 0.02, 0.012);
    };
    const backSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, y1, gry, 0.012, 0.006);
      if (y0 <= 0 && y1 > 0.15) pc(u0, u1, 0, 0.1, K.mat(0x4a4a48, 0.7), 0.03, 0.015);
    };
    const staffSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, y1, K.mat(0xd8d0bc, 0.85), 0.012, 0.006);
      if (y0 <= 0 && y1 > 0.15) pc(u0, u1, 0, 0.1, K.veneer(0x5a3c26), 0.03, 0.015);
    };
    const rxSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, y1, K.mat(0xf0f2f2, 0.8), 0.012, 0.006);
      if (y0 <= 0 && y1 > 0.15) pc(u0, u1, 0, 0.1, K.mat(0x3a5a7a, 0.6), 0.03, 0.015);
    };
    const R = (a, f) => a.filter(f);
    // shop floor
    LK.lineWall(b, 1, Z1, X0, X1, -1, FRONT, CEIL, shopSpan);
    LK.lineWall(b, 0, X0, PZ, Z1, 1, [], CEIL, shopSpan);
    LK.lineWall(b, 0, X1, PZ, Z1, -1, RIGHT, CEIL, shopSpan);
    LK.lineWall(b, 1, PZ - 0.07, X0, X1, 1, PART, CEIL, shopSpan);
    // stock room
    LK.lineWall(
      b,
      1,
      PZ + 0.07,
      X0,
      PX1,
      -1,
      R(PART, p => p.c < PX1),
      CEIL,
      backSpan
    );
    LK.lineWall(
      b,
      1,
      Z0,
      X0,
      PX1,
      1,
      R(BACK, p => p.c < PX1),
      CEIL,
      backSpan
    );
    LK.lineWall(b, 0, X0, Z0, PZ, 1, [], CEIL, backSpan);
    LK.lineWall(b, 0, PX1 + 0.07, Z0, PZ, -1, PARTX1, CEIL, backSpan);
    // staff room
    LK.lineWall(
      b,
      1,
      PZ + 0.07,
      PX1,
      PX2,
      -1,
      R(PART, p => p.c > PX1 && p.c < PX2),
      CEIL,
      staffSpan
    );
    LK.lineWall(
      b,
      1,
      Z0,
      PX1,
      PX2,
      1,
      R(BACK, p => p.c > PX1 && p.c < PX2),
      CEIL,
      staffSpan
    );
    LK.lineWall(b, 0, PX1 - 0.07, Z0, PZ, 1, PARTX1, CEIL, staffSpan);
    LK.lineWall(b, 0, PX2 + 0.07, Z0, PZ, -1, [], CEIL, staffSpan);
    // dispensary
    LK.lineWall(
      b,
      1,
      PZ + 0.07,
      PX2,
      X1,
      -1,
      R(PART, p => p.c > PX2),
      CEIL,
      rxSpan
    );
    LK.lineWall(b, 1, Z0, PX2, X1, 1, [], CEIL, rxSpan);
    LK.lineWall(b, 0, PX2 - 0.07, Z0, PZ, 1, [], CEIL, rxSpan);
    LK.lineWall(b, 0, X1, Z0, PZ, -1, [], CEIL, rxSpan);
    // fluorescent troffers over the shop, battens out back
    for (let lx = -13.5; lx < 14; lx += 2.7)
      for (const lz of [4.0, 6.9, 9.8]) {
        b.box(1.24, 0.04, 0.62, hous, [lx, CEIL - 0.01, lz], null, 0.005);
        b.box(1.16, 0.01, 0.54, lit, [lx, CEIL - 0.035, lz], null, 0);
      }
    for (const [lx, lz] of [
      [-12, 0],
      [-7, 0],
      [-0.5, 1],
      [3, -1],
      [7.5, 0],
      [12, 0]
    ]) {
      b.box(1.3, 0.07, 0.18, hous, [lx, CEIL - 0.04, lz], null, 0.01);
      b.box(1.22, 0.012, 0.12, lit, [lx, CEIL - 0.08, lz], null, 0);
    }

    /* ---------- shop: checkout counter by the doors, impulse racks, back counter under the windows ---------- */
    {
      const top = K.mat(0xd0ccc4, 0.4),
        face = K.mat(0x1f5a9a, 0.55);
      // the long counter, customers on the aisle side (south), cashier between it and the windows
      b.box(4.8, 0.95, 0.7, face, [-9.2, 0.475, 9.6], null, 0.01);
      b.box(4.9, 0.05, 0.78, top, [-9.2, 0.97, 9.6], null, 0.01);
      b.box(0.7, 0.95, 1.6, face, [-6.45, 0.475, 10.4], null, 0.01);
      b.box(0.78, 0.05, 1.68, top, [-6.45, 0.97, 10.4], null, 0.01);
      S(-11.6, -6.8, 9.25, 9.95, 0, 1.0);
      S(-6.8, -6.1, 9.6, 11.2, 0, 1.0);
      // stripe and MEDIKILL on the counter face
      b.box(4.8, 0.08, 0.01, K.mat(0xd8222a, 0.5), [-9.2, 0.75, 9.245], null, 0);
      b.label(1.4, 0.28, board('mk_ctr', 'MEDIKILL', null, '#1f5a9a', '#ffffff', 400, 80), [-9.2, 0.45, 9.245]);
      // impulse racks: gum, batteries, lighters
      const ims = [0xd8222a, 0x2a8a3a, 0xe8b020, 0x1f6fb8, 0xf2f2ee, 0x8a3ab8];
      for (const ix of [-11.0, -7.6]) {
        b.box(0.7, 1.0, 0.3, K.mat(0x3a3a3e, 0.5, 0.4), [ix, 0.5, 9.05], null, 0.01);
        for (let j = 0; j < 4; j++)
          for (let i = 0; i < 6; i++)
            b.box(
              0.09,
              0.12,
              0.04,
              K.mat(ims[(i + j) % 6], 0.6),
              [ix - 0.26 + i * 0.104, 0.32 + j * 0.2, 8.88],
              null,
              0
            );
        S(ix - 0.35, ix + 0.35, 8.9, 9.25, 0, 1.0, true);
      }
      // receipt printer, card reader, a monitor
      b.box(0.3, 0.3, 0.05, dark, [-9.0, 1.2, 9.75], [0.2, 0, 0], 0.01);
      b.box(0.1, 0.06, 0.16, dark, [-8.4, 1.03, 9.45], null, 0.005);
      // back counter under the front windows with cigarettes and lottery behind the cashier
      b.box(6.6, 0.88, 0.5, face, [-10.9, 0.44, 12.1], null, 0.01);
      b.box(6.7, 0.04, 0.56, top, [-10.9, 0.9, 12.1], null, 0.01);
      S(-14.2, -7.6, 11.85, 12.35, 0, 0.9, true);
      const cig = [0xf2f2ee, 0xd8222a, 0x1f3a7a, 0xe8c040, 0x2a6a3a];
      for (let i = 0; i < 26; i++)
        b.box(0.09, 0.14, 0.06, K.mat(cig[i % 5], 0.6), [-13.9 + i * 0.24, 0.99, 12.15], null, 0);
    }

    /* ---------- shop: the PHARMACY counter across the back right, back bar of medicines, signs ---------- */
    {
      const top = K.mat(0xe8e6e0, 0.35),
        face = K.mat(0xf2f2ee, 0.6),
        trimB = K.mat(0x1f6fb8, 0.5);
      const CZ = 4.7;
      b.box(8.8, 1.05, 0.6, face, [10.6, 0.525, CZ], null, 0.01);
      b.box(8.9, 0.05, 0.7, top, [10.6, 1.08, CZ], null, 0.01);
      b.box(8.8, 0.12, 0.01, trimB, [10.6, 0.9, CZ + 0.305], null, 0);
      b.box(8.8, 0.1, 0.62, base, [10.6, 0.05, CZ], null, 0);
      S(6.2, X1, CZ - 0.3, CZ + 0.3, 0, 1.1);
      // a glass screen over the counter with three service windows
      for (const sx of [6.3, 8.95, 11.65, 14.4]) b.box(0.06, 1.15, 0.06, alu, [sx, 1.68, CZ - 0.1], null, 0);
      b.box(8.7, 0.06, 0.06, alu, [10.6, 2.27, CZ - 0.1], null, 0);
      for (const [sx, w] of [
        [7.62, 2.55],
        [10.3, 2.6],
        [13.02, 2.65]
      ])
        b.box(w, 0.75, 0.02, glass, [sx, 1.85, CZ - 0.1], null, 0);
      // window labels over the service windows
      [
        ['DROP OFF', 7.62],
        ['PICK UP', 10.3],
        ['ASK YOUR PHARMACIST', 13.02]
      ].forEach(([s, x], i) =>
        b.label(1.5, 0.22, board('mk_win' + i, s, null, '#1f6fb8', '#ffffff', 384, 56), [x, 2.42, CZ - 0.09])
      );
      // the big PHARMACY sign on the partition above the back bar
      b.label(
        5.6,
        0.62,
        K.paint('mk_pharm', 1024, 114, (c, W, H) => {
          c.fillStyle = '#1a3f74';
          c.fillRect(0, 0, W, H);
          crossBadge(c, 70, H / 2, 46);
          crossBadge(c, W - 70, H / 2, 46);
          P.text(c, 'PHARMACY', W / 2, H / 2 + 4, {size: 84, col: '#ffffff', font: IMPACT, ls: 10, max: W - 220});
        }),
        [10.6, 3.0, PZ + 0.14]
      );
      // back bar: tall shelving full of white and amber bottles along the partition (either side of the door)
      const bot = [
        K.mat(0xf2f2ee, 0.4),
        K.mat(0xb8661a, 0.3, 0, {opacity: 0.9}),
        K.mat(0x2a6ab8, 0.5),
        K.mat(0xd8222a, 0.5)
      ];
      const backBar = (x0, x1) => {
        const w = x1 - x0,
          cx = (x0 + x1) / 2;
        b.box(w, 2.3, 0.04, lam, [cx, 1.15, PZ + 0.13], null, 0);
        for (const y of [0.1, 0.55, 1.0, 1.45, 1.9, 2.3]) b.box(w, 0.03, 0.42, lam, [cx, y, PZ + 0.36], null, 0);
        for (const sx of [x0, x1]) b.box(0.04, 2.32, 0.42, lam, [sx, 1.16, PZ + 0.36], null, 0);
        for (const y of [0.55, 1.0, 1.45, 1.9])
          for (let x = x0 + 0.1; x < x1 - 0.08; x += 0.11)
            if (rnd() < 0.82)
              b.cyl(
                0.035,
                0.035,
                0.1 + rnd() * 0.06,
                bot[Math.floor(rnd() * (rnd() < 0.7 ? 2 : 4))],
                [x, y + 0.08, PZ + 0.3 + rnd() * 0.12],
                null,
                8
              );
        S(x0, x1, PZ, PZ + 0.6, 0, 2.3, true);
      };
      backBar(5.3, 9.2);
      backBar(10.8, 14.8);
      // queue line: chrome posts with a blue belt, a floor sticker
      for (let i = 0; i < 4; i++) {
        const qx = 6.6 + i * 1.3;
        b.cyl(0.03, 0.03, 0.95, K.chrome(), [qx, 0.5, 5.7], null, 8);
        b.cyl(0.16, 0.16, 0.03, K.chrome(), [qx, 0.03, 5.7], null, 16);
        if (i < 3) b.box(1.24, 0.05, 0.01, bluM, [qx + 0.65, 0.9, 5.7], null, 0);
        S(qx - 0.16, qx + 0.16, 5.54, 5.86, 0, 1.0, true);
      }
      b.label(
        0.9,
        0.3,
        board('mk_wait', 'PLEASE WAIT HERE', null, '#f2c418', '#1a1a1a', 300, 100),
        [7.2, 0.048, 6.4],
        [-PI / 2, 0, 0]
      );
      // blood-pressure chair by the counter end
      b.box(0.6, 0.45, 0.6, K.mat(0x2a4a7a, 0.6), [14.4, 0.25, 6.4], null, 0.03);
      b.box(0.6, 0.8, 0.12, K.mat(0x2a4a7a, 0.6), [14.4, 0.85, 6.7], null, 0.03);
      b.box(0.4, 0.3, 0.35, K.mat(0xe8e8e2, 0.4), [14.0, 0.75, 6.4], null, 0.02);
      b.label(0.3, 0.16, board('mk_bp', 'BLOOD PRESSURE', null, '#ffffff', '#1f6fb8', 256, 128), [14.0, 0.82, 6.226]);
      S(13.75, 14.75, 6.05, 6.8, 0, 1.3, true);
    }

    /* ---------- shop: hanging aisle signs over the gondolas, health & beauty island ---------- */
    {
      const SIGNS = [
        [-11.5, 5.8, 'COLD & FLU'],
        [-8.8, 5.8, 'SNACKS & DRINKS'],
        [-1.0, 5.6, 'FIRST AID'],
        [1.6, 5.6, 'PAIN RELIEF'],
        [4.2, 5.6, 'VITAMINS'],
        [6.6, 7.2, 'BABY CARE'],
        [9.2, 7.2, 'PERSONAL CARE'],
        [11.8, 7.2, 'HOUSEHOLD']
      ];
      SIGNS.forEach(([x, z, s], i) => {
        const m = board('mk_aisle' + i, s, null, '#1f6fb8', '#ffffff', 384, 96);
        b.push([x, CEIL - 0.75, z], [0, PI / 2, 0]);
        b.box(1.5, 0.38, 0.03, K.mat(0xf2f2ee, 0.5), [0, 0, 0], null, 0.01);
        b.label(1.4, 0.32, m, [0, 0, 0.02]);
        b.label(1.4, 0.32, m, [0, 0, -0.02], [0, PI, 0]);
        b.pop();
        for (const s2 of [-0.6, 0.6]) b.box(0.01, 0.55, 0.01, galv, [x, CEIL - 0.28, z + s2], null, 0);
      });
      // the island: two low tiers of cosmetics and a mirror post
      const cos = [0xd8222a, 0xe86aa8, 0xf2f2ee, 0x2a2a2a, 0xc8a050, 0x8a3ab8, 0x1f6fb8];
      b.box(3.2, 0.7, 1.0, lam, [8.4, 0.35, 10.4], null, 0.02);
      b.box(2.6, 0.35, 0.5, lam, [8.4, 0.88, 10.4], null, 0.02);
      for (let i = 0; i < 40; i++)
        b.box(
          0.05,
          0.1 + rnd() * 0.06,
          0.05,
          K.mat(cos[i % 7], 0.4),
          [
            7.0 + (i % 20) * 0.14,
            i < 20 ? 0.76 : 1.1,
            10.4 + (i < 20 ? (rnd() < 0.5 ? -0.38 : 0.38) : (rnd() - 0.5) * 0.3)
          ],
          null,
          0
        );
      b.box(0.08, 1.8, 0.08, K.chrome(), [8.4, 0.9, 10.4], null, 0);
      b.box(0.5, 0.7, 0.03, K.mat(0xdfe8ec, 0.05, 0.9), [8.4, 1.75, 10.4], [0, PI / 2, 0], 0);
      b.label(1.5, 0.3, board('mk_beauty', 'BEAUTY', null, '#e86aa8', '#ffffff', 300, 60), [8.4, 0.4, 10.91]);
      S(6.8, 10.0, 9.9, 10.9, 0, 1.1);
      // a dump bin of discounted sunscreen and a greetings-card spinner by the doors
      b.cyl(0.45, 0.45, 0.7, K.mat(0xd8222a, 0.6), [-1.6, 0.35, 10.6], null, 16);
      for (let i = 0; i < 12; i++)
        b.box(
          0.08,
          0.16,
          0.05,
          K.mat(i % 2 ? 0xf2c418 : 0xf28a1a, 0.5),
          [-1.6 + (rnd() - 0.5) * 0.6, 0.74, 10.6 + (rnd() - 0.5) * 0.6],
          [rnd(), rnd() * PI, 0.4],
          0
        );
      b.label(0.8, 0.25, board('mk_sale', 'SALE 50%', null, '#ffffff', '#d8222a', 256, 80), [-1.6, 0.5, 11.06]);
      S(-2.05, -1.15, 10.15, 11.05, 0, 0.8, true);
      b.cyl(0.04, 0.04, 1.7, K.chrome(), [1.4, 0.85, 10.8], null, 8);
      for (let k = 0; k < 4; k++)
        for (let j = 0; j < 3; j++) {
          const a = (k * PI) / 2;
          b.box(
            0.22,
            0.3,
            0.01,
            K.mat(cos[(k + j) % 7], 0.6),
            [1.4 + Math.sin(a) * 0.2, 0.6 + j * 0.4, 10.8 + Math.cos(a) * 0.2],
            [0, a, 0],
            0
          );
        }
      S(1.15, 1.65, 10.55, 11.05, 0, 1.7, true);
    }

    /* ---------- stock room: pallets, shrink-wrapped stock, a pallet jack ---------- */
    {
      const pal = K.surf('wood', 0xa88a5a),
        card = K.surf('cardboard', 0xb38a58),
        wrap = K.mat(0xdfe6ea, 0.2, 0, {opacity: 0.85});
      const pallet = (px, pz, layers, wrapIt) => {
        b.box(1.2, 0.14, 1.0, pal, [px, 0.1, pz], null, 0.01);
        for (let l = 0; l < layers; l++)
          for (let q = 0; q < 4; q++)
            b.box(
              0.56,
              0.38,
              0.46,
              card,
              [px - 0.29 + (q % 2) * 0.58, 0.37 + l * 0.39, pz - 0.24 + Math.floor(q / 2) * 0.48],
              null,
              0.01
            );
        if (wrapIt) b.box(1.2, layers * 0.39 + 0.04, 1.0, wrap, [px, 0.17 + (layers * 0.39) / 2, pz], null, 0.02);
        S(px - 0.6, px + 0.6, pz - 0.5, pz + 0.5, 0, 0.2 + layers * 0.39);
      };
      pallet(-6.0, 0.4, 3, true);
      pallet(-6.0, 1.65, 2, false); // v089: was (-4.4, 0.4), in front of the staff-room door
      pallet(-11.6, 0.3, 2, true);
      // pallet jack
      b.box(0.55, 0.08, 1.2, K.mat(0xd8a020, 0.5, 0.4), [-8.0, 0.08, 0.2], null, 0.01);
      b.box(0.3, 0.3, 0.25, K.mat(0xd8a020, 0.5, 0.4), [-8.0, 0.3, 0.85], null, 0.01);
      b.tube(
        [
          [-8.0, 0.4, 0.9],
          [-8.0, 1.1, 1.1],
          [-8.0, 1.25, 1.15]
        ],
        0.025,
        dark,
        6,
        6
      );
      S(-8.3, -7.7, -0.4, 1.0, 0, 0.5, true);
      // walk lines on the floor
      b.box(0.08, 0.01, 4.6, lineY, [-9.9, 0.05, 0], null, 0);
      b.box(0.08, 0.01, 4.6, lineY, [-6.1, 0.05, -0.6], null, 0);
    }

    /* ---------- staff room: lockers, table + chairs, kitchenette, notice board ---------- */
    {
      const lk = K.mat(0x5a7a9a, 0.5, 0.5);
      for (let i = 0; i < 5; i++) {
        const lz = -2.0 + i * 0.42;
        b.box(0.45, 1.85, 0.4, lk, [PX2 - 0.32, 0.925, lz], null, 0.01);
        b.box(0.01, 0.1, 0.25, dark, [PX2 - 0.545, 1.6, lz], null, 0);
        b.box(0.01, 0.12, 0.03, K.chrome(), [PX2 - 0.545, 1.05, lz + 0.14], null, 0);
      }
      S(PX2 - 0.55, PX2 - 0.1, -2.2, -0.15, 0, 1.85);
      // table and four chairs
      b.box(1.4, 0.04, 0.8, lam, [1.0, 0.74, -0.4], null, 0.01);
      for (const [tx, tz] of [
        [0.4, -0.75],
        [1.6, -0.75],
        [0.4, -0.05],
        [1.6, -0.05]
      ])
        b.box(0.04, 0.72, 0.04, K.chrome(), [tx, 0.36, tz], null, 0);
      S(0.3, 1.7, -0.8, 0, 0, 0.76);
      for (const [cx, cz, ry] of [
        [0.6, -1.2, 0],
        [1.4, -1.2, 0],
        [0.6, 0.4, PI],
        [1.4, 0.4, PI]
      ]) {
        b.push([cx, 0, cz], [0, ry + (rnd() - 0.5) * 0.4, 0]);
        b.box(0.42, 0.04, 0.42, K.mat(0xb83a2a, 0.6), [0, 0.45, 0], null, 0.01);
        b.box(0.42, 0.4, 0.04, K.mat(0xb83a2a, 0.6), [0, 0.68, -0.2], null, 0.01);
        for (const [lx, lz] of [
          [-0.18, -0.18],
          [0.18, -0.18],
          [-0.18, 0.18],
          [0.18, 0.18]
        ])
          b.box(0.025, 0.45, 0.025, K.chrome(), [lx, 0.225, lz], null, 0);
        b.pop();
      }
      // kitchenette along the back wall: base units, sink, microwave, kettle
      b.box(2.6, 0.88, 0.6, K.mat(0xe8e4dc, 0.6), [-1.4, 0.44, Z0 + 0.45], null, 0.01);
      b.box(2.66, 0.04, 0.64, K.mat(0x3a3a3c, 0.4), [-1.4, 0.9, Z0 + 0.45], null, 0.01);
      b.box(0.5, 0.05, 0.4, K.chrome(), [-1.9, 0.91, Z0 + 0.45], null, 0);
      b.box(0.5, 0.3, 0.36, K.mat(0xf2f2ee, 0.4), [-0.6, 1.07, Z0 + 0.45], null, 0.02);
      b.box(0.3, 0.2, 0.01, dark, [-0.65, 1.07, Z0 + 0.635], null, 0);
      b.cyl(0.08, 0.09, 0.22, K.mat(0x2a2a2a, 0.4), [-2.5, 1.03, Z0 + 0.4], null, 12);
      S(-2.7, -0.1, Z0 + 0.12, Z0 + 0.78, 0, 0.95);
      // cork notice board
      b.box(1.2, 0.8, 0.03, K.surf('wood', 0xb08a5a), [PX1 + 0.1, 1.6, 1.4], [0, PI / 2, 0], 0.01);
      for (let i = 0; i < 6; i++)
        b.box(
          0.01,
          0.2,
          0.16,
          K.mat([0xf2f2ee, 0xf2e08a, 0xa8d8f0][i % 3], 0.7),
          [PX1 + 0.12, 1.4 + (i % 2) * 0.35, 1.0 + Math.floor(i / 2) * 0.35],
          null,
          0
        );
    }

    /* ---------- dispensary: work bench, pill shelving, a safe for controlled drugs, the pharmacist's desk ---------- */
    {
      const bot = [K.mat(0xf2f2ee, 0.4), K.mat(0xb8661a, 0.3)];
      // centre work bench with tablet counters and labels
      b.box(3.6, 0.9, 1.0, lam, [9.4, 0.45, -0.2], null, 0.01);
      b.box(3.7, 0.04, 1.08, K.mat(0xd8dcde, 0.35), [9.4, 0.92, -0.2], null, 0.01);
      for (const tx of [8.2, 10.6]) {
        b.box(0.32, 0.03, 0.22, K.mat(0x1f6fb8, 0.5), [tx, 0.95, -0.2], null, 0);
        b.box(0.24, 0.22, 0.2, K.mat(0xe8e8e2, 0.4), [tx + 0.4, 1.05, -0.3], null, 0.01);
      }
      for (let i = 0; i < 18; i++)
        b.cyl(0.035, 0.035, 0.1, bot[i % 2], [7.9 + rnd() * 3.0, 0.99, -0.55 + rnd() * 0.7], null, 8);
      S(7.6, 11.2, -0.7, 0.3, 0, 0.95);
      // open pill shelving along the back wall
      for (const [x0, x1] of [
        [5.4, 9.0],
        [11.6, 14.8]
      ]) {
        const w = x1 - x0,
          cx = (x0 + x1) / 2;
        for (const y of [0.1, 0.6, 1.1, 1.6, 2.1]) b.box(w, 0.03, 0.4, lam, [cx, y, Z0 + 0.36], null, 0);
        for (const sx of [x0, x1]) b.box(0.04, 2.12, 0.4, lam, [sx, 1.06, Z0 + 0.36], null, 0);
        for (const y of [0.6, 1.1, 1.6, 2.1])
          for (let x = x0 + 0.1; x < x1 - 0.08; x += 0.12)
            if (rnd() < 0.75)
              b.cyl(0.04, 0.04, 0.12, bot[Math.floor(rnd() * 2)], [x, y + 0.08, Z0 + 0.3 + rnd() * 0.12], null, 8);
        S(x0, x1, Z0 + 0.12, Z0 + 0.58, 0, 2.15, true);
      }
      // the safe (controlled drugs), bolted in the corner
      b.box(0.8, 1.1, 0.7, K.mat(0x3a3e44, 0.4, 0.7), [14.45, 0.55, 1.75], null, 0.03);
      b.cyl(0.09, 0.09, 0.05, K.chrome(), [14.0, 0.75, 1.75], [0, 0, PI / 2], 16);
      b.box(0.02, 0.06, 0.25, K.chrome(), [14.04, 0.5, 1.75], null, 0);
      b.label(
        0.4,
        0.12,
        board('mk_cd', 'CD — LOCKED', null, '#d8222a', '#ffffff', 256, 76),
        [14.04, 0.98, 1.75],
        [0, -PI / 2, 0]
      );
      S(14.05, X1 - 0.15, 1.4, 2.1, 0, 1.1);
      // a fridge for vaccines
      b.box(0.65, 0.9, 0.6, K.mat(0xf2f2ee, 0.4), [PX2 + 0.5, 0.45, 1.8], null, 0.02);
      b.box(0.5, 0.6, 0.01, glass, [PX2 + 0.82, 0.5, 1.8], [0, PI / 2, 0], 0);
      b.label(
        0.4,
        0.1,
        board('mk_vac', 'VACCINES 2-8°C', null, '#1f6fb8', '#ffffff', 256, 64),
        [PX2 + 0.83, 0.85, 1.8],
        [0, PI / 2, 0]
      );
      S(PX2 + 0.15, PX2 + 0.85, 1.5, 2.1, 0, 0.9, true);
    }

    /* ---------- dressing: spilled pills and packets, blood smears, a wet floor sign, scattered stock ---------- */
    {
      const packs = [0xd8222a, 0xe8b020, 0x1f6fb8, 0x3a8a2a, 0xf2f2ee, 0xe86aa8];
      for (const [px, pz] of [
        [-0.3, 5.8],
        [2.3, 8.6],
        [-10.1, 8.3],
        [5.2, 9.4],
        [10.4, 6.1],
        [-4.6, 7.4],
        [12.9, 9.3],
        [-13.2, 9.0],
        [4.9, 5.4]
      ])
        for (let k = 0; k < 2 + Math.floor(rnd() * 3); k++) {
          const big = rnd() < 0.4;
          b.box(
            big ? 0.16 : 0.1,
            0.05,
            big ? 0.24 : 0.07,
            K.mat(packs[Math.floor(rnd() * 6)], 0.6),
            [px + (rnd() - 0.5) * 0.7, 0.07, pz + (rnd() - 0.5) * 0.7],
            [0, rnd() * PI, 0],
            0.005
          );
        }
      // pill bottles rolled across the floor by the pharmacy counter, spilled tablets
      const bt = [K.mat(0xb8661a, 0.3), K.mat(0xf2f2ee, 0.4)];
      for (let k = 0; k < 9; k++)
        b.cyl(0.035, 0.035, 0.1, bt[k % 2], [7.0 + rnd() * 5, 0.08, 5.15 + rnd() * 0.4], [PI / 2, rnd() * PI, 0], 8);
      for (let k = 0; k < 60; k++)
        b.box(
          0.014,
          0.008,
          0.014,
          K.mat(k % 3 ? 0xf2f2ee : 0xe8a0b0, 0.5),
          [9.0 + (rnd() - 0.5) * 1.6, 0.05, 5.4 + (rnd() - 0.5) * 0.5],
          [0, rnd() * PI, 0],
          0
        );
      const smear = K.paint(
        'mk_smear',
        256,
        256,
        (c, W, H, r) => {
          c.clearRect(0, 0, W, H);
          c.fillStyle = 'rgba(110,8,8,.8)';
          for (let k = 0; k < 14; k++) {
            c.beginPath();
            c.arc(W / 2 + (r() - 0.5) * W * 0.6, H / 2 + (r() - 0.5) * H * 0.4, 8 + r() * 30, 0, PI * 2);
            c.fill();
          }
          c.fillRect(W * 0.45, H * 0.5, W * 0.4, 20);
        },
        {alpha: true, r: 0.3}
      );
      b.label(1.4, 1.4, smear, [8.2, 0.051, 5.3], [-PI / 2, 0, 0.4]);
      b.label(0.9, 0.9, smear, [-3.9, 0.051, 9.6], [-PI / 2, 0, 2.1]);
      b.label(1.1, 1.1, smear, [1.6, 0.051, 0.6], [-PI / 2, 0, 1.0]);
      // toppled wet floor sign
      const wet = board('mk_wet', 'CAUTION', 'WET FLOOR', '#f2c418', '#1a1a1a', 200, 260);
      b.label(0.3, 0.6, wet, [-6.1, 0.06, 7.9], [-PI / 2, 0, 0.7]);
      b.box(0.32, 0.02, 0.62, K.mat(0xf2c418, 0.5), [-6.1, 0.045, 7.9], [0, 0.7, 0], 0);
      // a shop basket dropped in the aisle
      b.box(0.45, 0.22, 0.32, K.mat(0xd8222a, 0.6), [-0.2, 0.13, 8.4], [0, 0.5, 0], 0.02);
      b.box(0.04, 0.2, 0.3, K.mat(0x2a2a2a, 0.5), [-0.2, 0.3, 8.4], [0, 0.5, 0.6], 0);
    }

    /* ---------- sidewalk: street lights, meter, hydrant, no parking ---------- */
    LK.lightPole(b, S, -10);
    LK.lightPole(b, S, 10);
    LK.hydrant(b, S, -16.5);
    LK.meter(b, S, 0.5);
    LK.noParking(b, -14, {key: 'mk_np1'});
    LK.noParking(b, 5, {key: 'mk_np2'});

    return (CACHE = G.done());
  }

  function bMedikill(x, z, t) {
    const B = mk(x, z, 40, 36, H, 0xd8c08a, 0xe0b8b8, 0x4a4a48);
    B.dx = 0;
    const PT = {th: 0.16, c: 0xe8e8e2};
    const cp = a => a.map(o => Object.assign({}, o));
    WL(B, 1, Z1, X0, X1, cp(FRONT), H);
    WL(B, 1, Z0, X0, X1, cp(BACK), H);
    WL(B, 0, X0, Z0, Z1, [], H);
    WL(B, 0, X1, Z0, Z1, cp(RIGHT), H);
    WL(B, 1, PZ, X0, X1, cp(PART), H, PT);
    WL(B, 0, PX1, Z0, PZ, cp(PARTX1), H, PT);
    WL(B, 0, PX2, Z0, PZ, [], H, PT);
    LK.attach(B, build());
    // shade trees on the right-hand lawn and at the far left of the car park
    for (const [tx, tz, ts] of [
      [18.7, 4.5, 1.0],
      [-18.6, -16.4, 0.85]
    ])
      try {
        bldTree(B, tx, tz, ts);
      } catch (e) {}
    // vehicles: a hatchback in the back row, a crashed wreck left askew in the lot
    const veh = (kind, vx, vz, ry, o) => {
      try {
        if (!window.MFZV) return;
        const g = MFZV.make(kind, WX(B, vx), WZ(B, vz), ry + (B.cs < 0 ? PI : 0), o);
        const h = g && g.userData && g.userData.half;
        const hx = h ? h[0] : 1.2,
          hz = h ? h[1] : 2.4;
        B.occ.push([vx - hx, vx + hx, vz - hz, vz + hz]);
      } catch (e) {}
    };
    veh('civilian', 9.2, Z0 - 3.7, 0, {dust: true});
    veh('wreck', -3.5, -13.5, 1.1, {wreck: 'crashed'});
    const SP = LK.spawner(B, 'pharmacy');
    // shop floor: drinks coolers down the left wall, gondolas, wall shelving along the back, tills
    for (let i = 0; i < 6; i++) SP(X0 + 0.51, 3.9 + i * 0.76, 'drinks_cooler', 'convenience', PI / 2);
    SP(-11.5, 5.8, 'shop_shelves_full', 'pharmacy', PI / 2);
    SP(-8.8, 5.8, 'shop_shelves_half', 'convenience', PI / 2);
    for (const [i, gx] of [-1.0, 1.6, 4.2].entries()) {
      // v089: 0.6 m right, so the staff door (x 0.6) opens onto an aisle, not the end of a gondola
      SP(gx, 4.6, i === 1 ? 'shop_shelves_half' : 'shop_shelves_full', 'pharmacy', PI / 2);
      SP(gx, 7.0, 'shop_shelves_full', 'pharmacy', PI / 2);
    }
    for (const [i, gx] of [6.6, 9.2, 11.8].entries())
      SP(gx, 7.6, i === 2 ? 'shop_shelves_half' : 'shop_shelves_full', 'pharmacy', PI / 2);
    // v090: wall shelving pulled back off the door edges (the run either side of the staff door stood against its posts; one less
    // unit there so the leaf can swing open)
    for (const wx of [-13.3, -11.4, -6.25, -4.35, -2.45, 2.45, 4.35])
      SP(wx, PZ + 0.45, 'shop_shelf_wall', 'pharmacy', 0);
    SP(-10.2, 9.6, 'cash_register', 'convenience', PI, 1.0);
    SP(-8.0, 9.6, 'cash_register', 'convenience', PI, 1.0);
    // the pharmacy counter: a till and a box of pills waiting for pick-up
    SP(10.3, 4.75, 'cash_register', 'pharmacy', 0, 1.1);
    SP(7.6, 4.75, 'pill_box', 'medikill_rx', 0.3, 1.1);
    // dispensary: medicine cabinets, pills on the bench, the pharmacist's desk
    for (const cz of [-1.3, -0.4, 0.5]) SP(X1 - 0.35, cz, 'medicine_cabinet', 'medikill_rx', -PI / 2);
    for (const cz of [-1.2, -0.3]) SP(PX2 + 0.35, cz, 'medicine_cabinet', 'medikill_rx', PI / 2);
    SP(8.6, -0.1, 'pill_box', 'medikill_rx', 0.2, 0.94);
    SP(9.8, -0.45, 'pill_box', 'medikill_rx', -0.4, 0.94);
    SP(10.9, 0.0, 'pill_box', 'medikill_rx', 1.0, 0.94);
    SP(12.6, 1.75, 'desk_office', 'medikill_rx', PI);
    // staff room: two vending machines, a cluttered desk
    SP(PX1 + 0.48, 1.85, 'vending_snack', 'convenience', PI / 2);
    SP(PX1 + 0.48, 0.85, 'vending_polar', 'convenience', PI / 2);
    SP(3.2, 1.9, 'desk_cluttered', 'medikill_staff', PI);
    // stock room: pallet racking, boxes waiting to be shelved
    SP(-11.0, Z0 + 0.65, 'pallet_racking', 'medikill_stock', 0);
    SP(-5.0, Z0 + 0.65, 'pallet_racking', 'medikill_stock', 0);
    SP(X0 + 0.65, 0.6, 'pallet_racking', 'medikill_stock', PI / 2);
    SP(-7.1, 1.8, 'cardboard_box_large', 'medikill_stock', 0.2); // v089: off the staff-room door
    SP(-7.0, -0.6, 'cardboard_box_medium', 'medikill_stock', -0.3); // v089: off the stock-room doors
    SP(-12.9, 1.9, 'cardboard_box_medium', 'medikill_stock', 0.5);
    // outside: vending machines under the side awning, dumpsters by the stock-room door
    SP(X1 + 0.75, 4.2, 'vending_snack', 'convenience', PI / 2);
    SP(X1 + 0.75, 3.1, 'vending_zest', 'convenience', PI / 2);
    SP(-17.4, -3.7, 'dumpster_blue', 'storage', 0);
    SP(-15.1, -3.7, 'dumpster_green', 'storage', 0);
    return LK.finish(B, t, {
      at: [(X0 + X1) / 2, (Z0 + Z1) / 2],
      w: X1 - X0,
      d: Z1 - Z0,
      loot: ['pharmacy', [-5, 5, 8.6, 11.4], 1],
      zombies: [
        [-6, 6.5],
        [2.3, 8.9],
        [9.5, 5.6],
        [-8, 0.8],
        [1.6, 0.9],
        [9.4, 1.2],
        [6, -9],
        [-9, -12]
      ]
    });
  }

  LK.register({
    id: 'morgans_drug',
    name: 'MediKill Drug & Pharmacy',
    build: bMedikill,
    note: 'full-block drugstore: big shop floor, pharmacy counter + dispensary, stock room, staff room; car park behind, open to the alley',
    globals: {bMedikill, MEDIKILL: {build}}
  });
  console.log('[medikill] MediKill ready');
})();
