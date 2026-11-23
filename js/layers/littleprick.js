/* ==========================================================================================================
   MINI FORT ZOMBIE - LITTLE PRICK CLINIC (v089): a half-plot walk-in medical clinic (20 x 36 m plot, front = +Z), our own design.
   Replaces the Piety Medical Clinic placeholder (core NEWCAT id piety_medical_clinic, half pool, 'clinic' hook).
   Exterior: a 16 x 18 m single-storey red-brick clinic under a clay-tile gable roof (gables on the sides, dark fascia and gutters).
   A sage vertical-board sign panel over the shopfront carries the LITTLE PRICK CLINIC logo (a script LP in a ring, a little syringe).
   Dark grey aluminium shopfront with glazed double doors, window posters, a CCTV camera and an alarm box. Front forecourt: block paving,
   steel bollards with yellow bands, a chalk A-board, a bench, planters, a bin, a grass strip with trees; street lights, a meter,
   a hydrant and a no-parking sign. Behind: a small staff yard open to the alley (staff door with hood, yellow clinical-waste bins,
   a dumpster, an AC condenser, a parked car, board fences down both sides).
   Interior: the front room is the waiting area (herringbone oak floor, warm cove lights, teal upholstered bench seating on oak plinths,
   gold line art, a water cooler, magazines) with the reception desk (white counter with a smoked-glass front) and the secretary's
   area behind it (oak feature wall with the logo, workstation, filing cabinets). Through the clinic door, a corridor serves two
   consulting rooms, a treatment (jab) room, the doctor's small office and an accessible toilet.
   Structure from core WL (doors / windows work); detail is our own geometry and painted artwork, outside the static merge.
   ========================================================================================================== */
(function () {
  'use strict';
  const K = window.MFZK,
    LK = window.LOTKIT;
  if (!K || !LK || typeof WL !== 'function' || typeof NEWCAT === 'undefined') {
    console.warn('[littleprick] core / prop kit missing');
    return;
  }
  const T = THREE,
    P = K.P,
    PI = Math.PI;
  // the clinic box (half plot: x -10..10), the waiting room / clinic partition, the corridor, room dividers, heights
  const X0 = -8,
    X1 = 8,
    Z0 = -9,
    Z1 = 9,
    PZ = 1, // waiting room | clinic
    CX = 1.1, // corridor half width (x -CX..CX)
    LZ = -4, // consult 1 | treatment room
    RZ1 = -3.2, // consult 2 | office
    RZ2 = -6.4, // office | toilet
    H = 3.6, // eaves
    RH = 2.4, // ridge rise over the eaves
    RC = 2.9; // ceiling
  const FRONT = [
    {k: 'w', c: -6.5},
    {k: 'w', c: -4.5},
    {k: 'w', c: -2.5},
    {k: 'd', c: -0.65, dbl: 'swing'},
    {k: 'd', c: 0.65, dbl: 'swing'},
    {k: 'w', c: 2.5},
    {k: 'w', c: 4.5},
    {k: 'w', c: 6.5}
  ];
  const LEFT = [
    {k: 'w', c: -6.5}, // treatment room
    {k: 'w', c: -1.5} // consult 1
  ];
  const RIGHT = [
    {k: 'w', c: -4.8}, // office
    {k: 'w', c: -1.1}, // consult 2
    {k: 'w', c: 5.0} // waiting area
  ];
  const BACKD = [{k: 'd', c: 0, s: -1}]; // staff door at the end of the corridor
  const PART = [{k: 'd', c: 0}]; // waiting room -> corridor
  const CORL = [
    {k: 'd', c: -6.0}, // treatment room
    {k: 'd', c: -1.0} // consult 1
  ];
  const CORR = [
    {k: 'd', c: -7.7}, // toilet
    {k: 'd', c: -4.8}, // office
    {k: 'd', c: -1.0} // consult 2
  ];

  /* ===================== loot tables ===================== */
  // consulting rooms use the core 'clinic' table; these cover the reception, the jab room, the doctor's office and the toilet
  const TABLES = ['lpc_front', 'lpc_rx', 'lpc_office', 'lpc_wc'];
  try {
    Object.assign(LOOT_TABLES, {
      lpc_front: {
        painkiller: 3,
        gauze: 2,
        medical_tape: 2,
        cotton_balls: 2,
        stugots_coffee: 2,
        cookies: 2,
        colacola: 1,
        water_jug: 1,
        duct_tape: 1
      },
      lpc_rx: {
        antibiotics: 6,
        painkiller: 4,
        medkit: 3,
        gauze: 4,
        medical_tape: 3,
        cotton_balls: 3
      },
      lpc_office: {
        stugots_coffee: 2,
        cookies: 2,
        tweex: 2,
        colacola: 2,
        painkiller: 2,
        antibiotics: 1,
        medkit: 1,
        gauze: 1,
        colt_detective_special: 1,
        ammo_38_fed: 1
      },
      lpc_wc: {painkiller: 2, gauze: 2, cotton_balls: 2, medical_tape: 1, hairspray: 1}
    });
    for (const tn of TABLES)
      for (const id in LOOT_TABLES[tn])
        if (!ITEMS[id]) {
          console.error('[littleprick] loot table ' + tn + ' has unknown item ' + id);
          delete LOOT_TABLES[tn][id];
        }
    if (typeof LOOT_PROP !== 'undefined')
      Object.assign(LOOT_PROP, {lpc_front: 'cabinet', lpc_rx: 'cabinet', lpc_office: 'cabinet', lpc_wc: 'cabinet'});
    const A = window.MFZPROP && MFZPROP.auto;
    if (A) {
      const pick = (...ts) => [...new Set(ts.flatMap(t => A[t] || []))];
      A.lpc_front = pick('office', 'clinic');
      A.lpc_rx = pick('clinic', 'pharmacy');
      A.lpc_office = pick('office', 'clinic');
      A.lpc_wc = pick('house', 'clinic');
    }
  } catch (e) {
    console.warn('[littleprick] loot tables', e);
  }

  /* ===================== artwork ===================== */
  const TEAL = '#1d6a5c',
    SAGE = '#b9c4bd',
    INK = '#1c1e22';

  // the sign panel: sage vertical boards, the ring logo (script LP + a little syringe), LITTLE PRICK CLINIC in teal
  const logo = (c, cx, cy, R, col) => {
    c.strokeStyle = col;
    c.lineWidth = R * 0.07;
    c.beginPath();
    c.arc(cx, cy, R, 0, PI * 2);
    c.stroke();
    c.fillStyle = col;
    c.font = `italic 700 ${Math.round(R * 1.15)}px "Brush Script MT", "Segoe Script", Georgia, serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText('LP', cx - R * 0.06, cy + R * 0.06);
    // the little syringe, laid across the ring
    c.save();
    c.translate(cx + R * 0.1, cy + R * 0.55);
    c.rotate(-0.35);
    c.fillRect(-R * 0.5, -R * 0.07, R * 0.62, R * 0.14);
    c.fillRect(-R * 0.62, -R * 0.12, R * 0.06, R * 0.24);
    c.fillRect(-R * 0.7, -R * 0.03, R * 0.1, R * 0.06);
    c.fillRect(R * 0.12, -R * 0.015, R * 0.42, R * 0.03);
    c.restore();
  };
  const signMat = () =>
    K.paint('lpc_sign', 1024, 80, (c, W, H, r) => {
      c.fillStyle = SAGE;
      c.fillRect(0, 0, W, H);
      for (let x = 0; x < W; x += 9) {
        c.fillStyle = `rgba(255,255,255,${0.1 + r() * 0.08})`;
        c.fillRect(x, 0, 2, H);
        c.fillStyle = 'rgba(40,50,45,0.18)';
        c.fillRect(x + 7, 0, 1, H);
      }
      logo(c, 214, H / 2, 30, TEAL);
      c.fillStyle = TEAL;
      c.font = '600 44px "Montserrat", "Century Gothic", Arial, sans-serif';
      c.textAlign = 'left';
      c.textBaseline = 'middle';
      const txt = 'LITTLE PRICK CLINIC';
      let x = 268;
      for (const ch of txt) {
        c.fillText(ch, x, H / 2 + 3);
        x += c.measureText(ch).width + 7;
      }
    });
  // posters and boards (two lines of text on a coloured card)
  const card = (key, w, h, lines, bg, fg) =>
    K.paint(key, w, h, (c, W, H) => {
      c.fillStyle = bg;
      c.fillRect(0, 0, W, H);
      c.fillStyle = fg;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      const n = lines.length;
      lines.forEach((l, i) => {
        c.font = l[1];
        c.fillText(l[0], W / 2, (H * (i + 0.5)) / n);
      });
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
      // warm red-orange stretcher bond with pale mortar
      brick: () =>
        K.tri(
          'lpc_brick',
          (c, W, H, r) => {
            c.fillStyle = '#c8bfb0';
            c.fillRect(0, 0, W, H);
            const rows = 16,
              bh = H / rows,
              bw = W / 4;
            for (let j = 0; j < rows; j++)
              for (let i = -1; i < 5; i++) {
                const x = i * bw + (j % 2 ? bw / 2 : 0);
                c.fillStyle = `hsl(${12 + r() * 10},${48 + r() * 16}%,${40 + r() * 12}%)`;
                c.fillRect(x + 2, j * bh + 2, bw - 4, bh - 4);
              }
            P.noise(c, W, H, r, 6000, 0.14, '#3a1a10', 1.3);
            P.grime(c, W, H, r, 0.35);
          },
          {tile: 1.2, r: 0.9}
        ),
      // clay plain tiles in staggered courses
      tile: () =>
        K.tri(
          'lpc_tile',
          (c, W, H, r) => {
            c.fillStyle = '#5a2a1e';
            c.fillRect(0, 0, W, H);
            const rows = 10,
              th = H / rows,
              tw = W / 6;
            for (let j = 0; j < rows; j++)
              for (let i = -1; i < 7; i++) {
                const x = i * tw + (j % 2 ? tw / 2 : 0);
                c.fillStyle = `hsl(${10 + r() * 8},${40 + r() * 14}%,${34 + r() * 12}%)`;
                c.fillRect(x + 1.5, j * th, tw - 3, th - 3);
                c.fillStyle = 'rgba(20,8,4,0.35)';
                c.fillRect(x + 1.5, j * th + th - 6, tw - 3, 3);
              }
            P.noise(c, W, H, r, 4000, 0.12, '#1a0c08', 1.2);
          },
          {tile: 1.6, r: 0.85}
        ),
      // grey block paving, herringbone
      paving: () =>
        K.tri(
          'lpc_paving',
          (c, W, H, r) => {
            c.fillStyle = '#6a6a68';
            c.fillRect(0, 0, W, H);
            const s = W / 8;
            for (let j = -1; j < 9; j++)
              for (let i = -1; i < 9; i++) {
                c.fillStyle = `hsl(30,4%,${50 + r() * 14}%)`;
                const x = i * s,
                  y = j * s;
                if ((i + j) % 2) c.fillRect(x + 1, y + 1, s * 2 - 2, s - 2);
                else c.fillRect(x + 1, y + 1, s - 2, s * 2 - 2);
              }
            P.noise(c, W, H, r, 3000, 0.1, '#222', 1.2);
          },
          {tile: 1.6, r: 0.9}
        ),
      alu: () => K.mat(0x34383c, 0.4, 0.6)
    }[k]());

  /* ===================== geometry ===================== */
  let CACHE = null;
  function build() {
    if (CACHE) return CACHE;
    const G = LK.geo('littleprick'),
      b = G.b,
      S = G.S;
    const conc = surf('concrete'),
      asph = surf('asphalt');
    /* ---------- grounds: sidewalk, forecourt, grass strip, side walks, staff yard ---------- */
    LK.pavement(b, conc, {w: 20, kerb: true});
    b.box(20, 0.03, 1.2, surf('lawn'), [0, 0.025, 15.2], null, 0); // grass strip by the sidewalk
    b.box(1.9, 0.04, Z1 - Z0, conc, [-9.05, 0.02, (Z0 + Z1) / 2], null, 0); // side walks
    b.box(1.9, 0.04, Z1 - Z0, conc, [9.05, 0.02, (Z0 + Z1) / 2], null, 0);
    b.box(20, 0.02, 18 + Z0, asph, [0, 0.012, (-18 + Z0) / 2], null, 0); // staff yard, out to the alley
    b.box(20, 0.04, 14.6 - Z1, surf('paving'), [0, 0.02, (Z1 + 14.6) / 2], null, 0); // block-paved forecourt

    const brk = surf('brick'),
      alu = surf('alu'),
      dark = K.mat(0x26292c, 0.5, 0.3),
      black = K.mat(0x141416, 0.45, 0.4),
      white = K.mat(0xf2f2ee, 0.5),
      steel = K.mat(0x9a9ea2, 0.4, 0.7),
      chrome = K.chrome(),
      yel = K.mat(0xf2c418, 0.55),
      leaf = K.mat(0x3e6a2e, 0.85),
      leaf2 = K.mat(0x557f38, 0.85),
      soil = K.mat(0x3a2a1c, 0.95),
      warm = K.mat(0xfff2c8, 0.4, 0, {emissive: 0xffd890, emissiveIntensity: 1.3}),
      oak = K.veneer(0xb08452),
      tealM = K.mat(0x1d6a5c, 0.6);
    const rb = (w, h, d, r, m, p, rot) => b.rbox(w, h, d, r, m, p, rot, 1);
    let sd = 7;
    const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
    // any flat polygon, both faces (gables)
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

    /* ---------- exterior skin: red brick all round, soldier course, dark plinth ---------- */
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
    skin(1, Z1, X0 - 0.15, X1 + 0.15, 1, FRONT, brk);
    skin(1, Z0, X0 - 0.15, X1 + 0.15, -1, BACKD, brk);
    skin(0, X0, Z0, Z1, -1, LEFT, brk);
    skin(0, X1, Z0, Z1, 1, RIGHT, brk);
    // dark engineering-brick plinth and a band of buff headers at sill height
    const buff = K.mat(0xc8a878, 0.85);
    // v101: both runs are split at the doors (they ran straight across the doorways as a 30 cm dark step that crates and
    // debris then clipped into)
    for (const [zf, gap] of [
      [Z1 + 0.19, 1.3],
      [Z0 - 0.19, 0.7]
    ])
      for (const [pa, pb] of [
        [X0 - 0.18, -gap],
        [gap, X1 + 0.18]
      ])
        b.box(pb - pa, 0.3, 0.04, dark, [(pa + pb) / 2, 0.15, zf], null, 0);
    for (const s of [-1, 1]) b.box(0.04, 0.3, Z1 - Z0, dark, [s * (X1 + 0.19), 0.15, (Z0 + Z1) / 2], null, 0);
    for (const [u0, u1] of [
      [X0 - 0.17, -7.25],
      [X1 - 0.75, X1 + 0.17]
    ])
      b.box(u1 - u0, 0.22, 0.04, buff, [(u0 + u1) / 2, 2.95, Z1 + 0.2], null, 0);
    // brick piers either side of the shopfront, proud of the wall
    for (const px of [X0 + 0.25, X1 - 0.25]) b.box(0.6, H, 0.12, brk, [px, H / 2, Z1 + 0.24], null, 0);
    // shopfront: dark aluminium frames, dark stall risers, a continuous transom, the door surround
    for (const w of FRONT.filter(p => p.k === 'w')) {
      b.box(1.5, 0.9, 0.05, dark, [w.c, 0.45, Z1 + 0.2], null, 0);
      b.frame(1.56, 1.9, 0.07, alu, [w.c, 1.825, Z1 + 0.19], 0.06);
      // dotted manifestation band
      for (let k = 0; k < 7; k++)
        b.cyl(0.035, 0.035, 0.005, white, [w.c - 0.6 + k * 0.2, 1.45, Z1 + 0.2], [PI / 2, 0, 0], 10);
    }
    b.box(X1 - X0 - 1.0, 0.1, 0.12, alu, [0, 2.8, Z1 + 0.2], null, 0.01);
    b.frame(2.7, 2.45, 0.08, alu, [0, 1.225, Z1 + 0.19], 0.07);
    // v090: no fixed centre mullion (it stood in the open double doorway); handles and the OPEN card ride on the leaves (LK.openings)
    for (const s of [-1, 1]) {
      b.cyl(0.018, 0.018, 0.8, chrome, [s * 0.14, 1.1, Z1 + 0.29], null, 8); // D pull handles
      for (const y of [0.72, 1.48]) b.box(0.018, 0.018, 0.1, chrome, [s * 0.14, y, Z1 + 0.24], null, 0);
    }
    b.label(0.5, 0.18, card('lpc_open', 256, 96, [['OPEN', 'bold 60px Arial']], '#141416', '#f2f2ee'), [
      -0.35,
      1.75,
      Z1 + 0.235
    ]);
    // side windows: aluminium frames and sills
    for (const [f, n, ops] of [
      [X0, -1, LEFT],
      [X1, 1, RIGHT]
    ])
      for (const w of ops) {
        b.box(0.14, 0.06, 1.62, buff, [f + n * 0.22, 0.88, w.c], null, 0.01);
        b.push([f + n * 0.19, 1.825, w.c], [0, PI / 2, 0]);
        b.frame(1.56, 1.9, 0.07, alu, [0, 0, 0], 0.06);
        b.pop();
      }

    /* ---------- sign panel: sage boards with the LITTLE PRICK CLINIC logo, dark capping ---------- */
    {
      const sw = 9.6,
        sh = 0.72,
        sy = 3.17;
      b.box(sw + 0.1, sh + 0.1, 0.06, K.mat(0x8a948e, 0.6), [0, sy, Z1 + 0.2], null, 0.01);
      b.label(sw, sh, signMat(), [0, sy, Z1 + 0.235]);
      b.box(sw + 0.16, 0.05, 0.1, dark, [0, sy + sh / 2 + 0.06, Z1 + 0.22], null, 0.005);
      // CCTV camera and an alarm box on the brick to the left of the sign
      b.box(0.34, 0.44, 0.12, white, [-6.6, 3.2, Z1 + 0.25], null, 0.03);
      b.box(0.24, 0.06, 0.02, K.mat(0x2a6ad8, 0.4), [-6.6, 3.3, Z1 + 0.315], null, 0);
      b.box(0.1, 0.06, 0.18, white, [-7.2, 2.95, Z1 + 0.3], null, 0.01);
      b.cyl(0.07, 0.07, 0.24, white, [-7.2, 2.88, Z1 + 0.42], [PI / 2 - 0.3, 0, 0], 12);
      b.cyl(0.045, 0.045, 0.01, black, [-7.2, 2.84, Z1 + 0.545], [PI / 2 - 0.3, 0, 0], 12);
      // downpipes at the front corners
      for (const s of [-1, 1]) b.cyl(0.05, 0.05, H, dark, [s * (X1 + 0.05), H / 2, Z1 + 0.32], null, 8);
    }

    /* ---------- window posters ---------- */
    b.label(
      0.9,
      1.25,
      card(
        'lpc_post1',
        180,
        250,
        [
          ['FLU JABS', 'bold 30px Arial'],
          ['NOW ON', 'bold 30px Arial'],
          ['just a little', 'italic 22px Georgia'],
          ['scratch!', 'italic 22px Georgia']
        ],
        '#e8f2ee',
        TEAL
      ),
      [-6.5, 1.75, Z1 + 0.23]
    );
    b.label(
      0.9,
      1.25,
      card(
        'lpc_post2',
        180,
        250,
        [
          ['WALK-INS', 'bold 28px Arial'],
          ['WELCOME', 'bold 28px Arial'],
          ['MON - SAT', '20px Arial'],
          ['8AM - 6PM', '20px Arial']
        ],
        '#1d6a5c',
        '#f2f2ee'
      ),
      [6.5, 1.75, Z1 + 0.23]
    );

    /* ---------- roof: clay-tile gable (ridge along x), fascia, soffits, gutters, bargeboards, ridge tiles ---------- */
    {
      const tile = surf('tile'),
        OV = 0.45, // eaves overhang
        OG = 0.3, // verge overhang
        s = RH / (Z1 - 0),
        a = Math.atan(s),
        run = Z1 + OV,
        len = run / Math.cos(a) + 0.05,
        ye = H + 0.1 - OV * s, // eave height
        W = X1 - X0 + 0.34 + OG * 2;
      for (const n of [1, -1]) {
        const zc = (n * run) / 2,
          yc = H + 0.1 + s * (Z1 - run / 2) + 0.05;
        b.box(W, 0.1, len, tile, [0, yc, zc], [n * a, 0, 0], 0);
        b.box(W, 0.22, 0.05, dark, [0, ye - 0.06, n * (run + 0.02)], null, 0); // fascia
        b.box(W, 0.02, OV, K.mat(0xe8e6e0, 0.8), [0, H - 0.02, n * (Z1 + OV / 2 + 0.05)], null, 0); // soffit
        b.cyl(0.07, 0.07, W, dark, [0, ye - 0.16, n * (run + 0.1)], [0, 0, PI / 2], 8); // gutter
        // bargeboards up the verges
        for (const sx of [-1, 1]) b.box(0.05, 0.22, len, dark, [sx * (W / 2 + 0.02), yc - 0.04, zc], [n * a, 0, 0], 0);
      }
      b.cyl(0.13, 0.13, W, K.mat(0x4a2016, 0.8), [0, H + 0.1 + RH + 0.06, 0], [0, 0, PI / 2], 10); // ridge tiles
      // gables: brick triangles on the side walls, a louvred vent near the apex
      for (const sx of [-1, 1]) {
        const gx = sx * (X1 + 0.165);
        poly(
          [
            [gx, H, Z1 + 0.15],
            [gx, H, Z0 - 0.15],
            [gx, H + 0.1 + RH, 0]
          ],
          brk,
          1.2
        );
        b.box(0.04, 0.5, 0.7, dark, [gx + sx * 0.02, H + 1.3, 0], null, 0);
        for (let k = 0; k < 4; k++)
          b.box(0.06, 0.03, 0.62, K.mat(0x4a4e52, 0.5), [gx + sx * 0.05, H + 1.12 + k * 0.12, 0], [0, 0, sx * 0.4], 0);
      }
      // ceiling slab over the walls (closes the loft from below)
      b.box(X1 - X0 + 0.3, 0.06, Z1 - Z0 + 0.3, K.mat(0x5a5a58, 0.9), [0, H + 0.03, 0], null, 0);
    }

    /* ---------- forecourt: bollards, A-board, bench, bin, planters, bike hoops ---------- */
    {
      for (const bx of [-6.2, -3.6, 3.6, 6.2]) {
        b.cyl(0.08, 0.08, 1.0, steel, [bx, 0.5, 12.3], null, 12);
        b.cyl(0.085, 0.085, 0.08, yel, [bx, 0.82, 12.3], null, 12);
        b.sph(0.08, steel, [bx, 1.0, 12.3]);
        S(bx - 0.09, bx + 0.09, 12.21, 12.39, 0, 1.0, true);
      }
      // chalk A-board in the clinic's white frame
      {
        const ax = 2.1,
          az = 11.0,
          am = card(
            'lpc_aboard',
            200,
            300,
            [
              ['LITTLE PRICK', 'bold 24px Arial'],
              ['CLINIC', 'bold 24px Arial'],
              ['', '10px Arial'],
              ['Walk-ins', '24px Georgia'],
              ['welcome', '24px Georgia'],
              ['Flu jabs', '22px Georgia'],
              ['today', '22px Georgia'],
              ['It won’t hurt a bit*', 'italic 15px Georgia']
            ],
            '#f4f4f0',
            TEAL
          );
        b.push([ax, 0, az], [0, -0.25, 0]);
        for (const n of [1, -1]) {
          b.box(0.64, 0.94, 0.03, white, [0, 0.47, n * 0.17], [n * -0.18, 0, 0], 0.01);
          b.label(0.54, 0.8, am, [0, 0.48, n * 0.188], [n * -0.18, n > 0 ? 0 : PI, 0]);
        }
        b.pop();
        S(ax - 0.36, ax + 0.36, az - 0.28, az + 0.28, 0, 0.95, true);
      }
      // bench and a bin by the left window, planters at the front corners
      {
        const bx = -4.6,
          bz = 10.3;
        for (let k = 0; k < 4; k++) b.box(1.7, 0.04, 0.09, oak, [bx, 0.45, bz - 0.15 + k * 0.1], null, 0.005);
        for (let k = 0; k < 3; k++) b.box(1.7, 0.09, 0.03, oak, [bx, 0.6 + k * 0.12, bz - 0.24], [0.15, 0, 0], 0.005);
        for (const s of [-1, 1]) b.box(0.06, 0.45, 0.45, black, [bx + s * 0.75, 0.24, bz], null, 0.01);
        S(bx - 0.88, bx + 0.88, bz - 0.28, bz + 0.25, 0, 0.9, true);
        b.cyl(0.24, 0.22, 0.85, K.mat(0x2a4a42, 0.5, 0.3), [-6.6, 0.43, 10.2], null, 14);
        b.cyl(0.25, 0.25, 0.04, black, [-6.6, 0.87, 10.2], null, 14);
        S(-6.85, -6.35, 9.95, 10.45, 0, 0.9, true);
      }
      for (const px of [-7.6, 7.6]) {
        rb(0.6, 0.55, 0.6, 0.03, K.mat(0x3a3e42, 0.6), [px, 0.28, 9.85]);
        b.box(0.52, 0.04, 0.52, soil, [px, 0.55, 9.85], null, 0);
        for (let k = 0; k < 7; k++)
          b.sph(0.16 + rnd() * 0.08, k % 2 ? leaf : leaf2, [
            px - 0.18 + rnd() * 0.36,
            0.68 + rnd() * 0.25,
            9.85 - 0.18 + rnd() * 0.36
          ]);
        S(px - 0.3, px + 0.3, 9.55, 10.15, 0, 0.9, true);
      }
      // two Sheffield bike hoops
      for (const hx of [5.0, 5.8]) {
        b.cyl(0.03, 0.03, 0.7, steel, [hx, 0.35, 13.5 - 0.3], null, 8);
        b.cyl(0.03, 0.03, 0.7, steel, [hx, 0.35, 13.5 + 0.3], null, 8);
        b.cyl(0.03, 0.03, 0.6, steel, [hx, 0.7, 13.5], [PI / 2, 0, 0], 8);
        S(hx - 0.04, hx + 0.04, 13.17, 13.83, 0, 0.75, true);
      }
    }

    /* ---------- staff yard: door hood, wall lamp, clinical-waste bins, AC condenser, board fences ---------- */
    {
      b.box(1.8, 0.08, 0.8, dark, [0, 2.62, Z0 - 0.55], null, 0.01);
      for (const s of [-1, 1]) b.box(0.04, 0.4, 0.6, dark, [s * 0.86, 2.42, Z0 - 0.45], [0.6, 0, 0], 0);
      b.box(0.2, 0.26, 0.14, black, [1.2, 2.5, Z0 - 0.26], null, 0.02);
      b.box(0.16, 0.08, 0.02, warm, [1.2, 2.43, Z0 - 0.335], null, 0);
      b.label(
        0.6,
        0.2,
        card('lpc_staff', 256, 86, [['STAFF ONLY', 'bold 44px Arial']], '#1d6a5c', '#f2f2ee'),
        [-1.2, 2.0, Z0 - 0.2],
        [0, PI, 0]
      );
      // yellow clinical-waste wheelie bins
      const cw = card(
        'lpc_cwaste',
        256,
        128,
        [
          ['CLINICAL', 'bold 44px Arial'],
          ['WASTE', 'bold 44px Arial']
        ],
        '#f2c418',
        INK
      );
      for (const [wx, wa] of [
        [2.5, 0.05],
        [3.5, -0.08]
      ]) {
        b.push([wx, 0, Z0 - 0.8], [0, wa, 0]);
        rb(0.66, 1.0, 0.75, 0.04, K.mat(0xf2c418, 0.55), [0, 0.52, 0]);
        b.box(0.72, 0.06, 0.82, K.mat(0xe0b010, 0.5), [0, 1.05, 0.02], [0.05, 0, 0], 0.01);
        b.label(0.5, 0.25, cw, [0, 0.7, -0.38], [0, PI, 0]);
        b.cyl(0.1, 0.1, 0.06, black, [-0.28, 0.1, 0.3], [0, 0, PI / 2], 10);
        b.cyl(0.1, 0.1, 0.06, black, [0.28, 0.1, 0.3], [0, 0, PI / 2], 10);
        b.pop();
        S(wx - 0.38, wx + 0.38, Z0 - 1.22, Z0 - 0.38, 0, 1.1, true);
      }
      // AC condenser on a plinth
      b.box(1.2, 0.1, 0.6, K.surf('concrete', 0x8a8a86), [6.0, 0.05, Z0 - 0.6], null, 0);
      rb(1.0, 0.8, 0.42, 0.02, K.mat(0xd8d8d4, 0.5, 0.2), [6.0, 0.5, Z0 - 0.6]);
      b.cyl(0.3, 0.3, 0.02, black, [6.0, 0.52, Z0 - 0.82], [PI / 2, 0, 0], 18);
      S(5.48, 6.52, Z0 - 0.9, Z0 - 0.3, 0, 0.9, true);
      // board fences down both sides of the yard
      const fence = surf('fence');
      for (const fx of [-9.92, 9.92]) {
        const z0 = -17.6,
          z1 = Z0;
        b.box(0.04, 1.8, z1 - z0, fence, [fx, 0.9, (z0 + z1) / 2], null, 0);
        for (let pz = z0; pz <= z1 + 0.01; pz += 2.0)
          b.box(0.1, 1.9, 0.1, K.mat(0x4a3a2c, 0.9), [fx, 0.95, pz], null, 0);
        S(fx - 0.06, fx + 0.06, z0, z1, 0, 1.9);
      }
    }

    /* ---------- interior: floors, linings, ceilings, lights ---------- */
    const p = 0.075, // half a partition, so a lining lands on its face
      IN = 0.16;
    const flr = (x0, x1, z0, z1, m) => b.box(x1 - x0, 0.02, z1 - z0, m, [(x0 + x1) / 2, 0.035, (z0 + z1) / 2], null, 0);
    const herring = K.tri(
      'lpc_herring',
      (c, W, H, r) => {
        // pale oak blocks laid in zig-zag columns (each column alternates +45 / -45 blocks), thin dark joints
        c.fillStyle = '#9a7a56';
        c.fillRect(0, 0, W, H);
        const bw = W / 4, // column width
          bh = bw / 2; // step down per block
        for (let i = 0; i < 4; i++)
          for (let j = -2; j < H / bh + 2; j++) {
            const x0 = i * bw,
              y0 = j * bh,
              m = bw / 2;
            const blk = pts => {
              c.fillStyle = `hsl(${32 + r() * 5},${30 + r() * 8}%,${64 + r() * 7}%)`;
              c.beginPath();
              pts.forEach(([x, y], k) => (k ? c.lineTo(x, y) : c.moveTo(x, y)));
              c.fill();
            };
            blk([
              [x0 + 1, y0 + 1],
              [x0 + m - 1, y0 + m / 2 + 1],
              [x0 + m - 1, y0 + m / 2 + bh - 1],
              [x0 + 1, y0 + bh - 1]
            ]);
            blk([
              [x0 + m + 1, y0 + m / 2 + 1],
              [x0 + bw - 1, y0 + 1],
              [x0 + bw - 1, y0 + bh - 1],
              [x0 + m + 1, y0 + m / 2 + bh - 1]
            ]);
          }
        P.noise(c, W, H, r, 5000, 0.06, '#4a3420', 1.2);
      },
      {tile: 1.6, r: 0.45}
    );
    const vinyl = K.tri(
      'lpc_vinyl',
      (c, W, H, r) => {
        c.fillStyle = '#c4ccce';
        c.fillRect(0, 0, W, H);
        P.noise(c, W, H, r, 9000, 0.1, '#6a7a80', 1.1);
        P.noise(c, W, H, r, 3000, 0.08, '#fff', 1.1);
      },
      {tile: 2.0, r: 0.35}
    );
    const tileF = K.tri(
      'lpc_tilef',
      (c, W, H) => {
        c.fillStyle = '#8a9494';
        c.fillRect(0, 0, W, H);
        const n = 4,
          s = W / n;
        c.fillStyle = '#d8dcdc';
        for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) c.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
      },
      {tile: 1.2, r: 0.3}
    );
    const tileW = K.tri(
      'lpc_tilew',
      (c, W, H) => {
        c.fillStyle = '#c8d0d0';
        c.fillRect(0, 0, W, H);
        const n = 4,
          s = W / n;
        c.fillStyle = '#f4f6f4';
        for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) c.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
      },
      {tile: 0.6, r: 0.3}
    );
    flr(X0 + IN, X1 - IN, PZ + p, Z1 - IN, herring); // waiting room
    flr(-CX + p, CX - p, Z0 + IN, PZ - p, vinyl); // corridor
    flr(X0 + IN, -CX - p, LZ + p, PZ - p, vinyl); // consult 1
    flr(X0 + IN, -CX - p, Z0 + IN, LZ - p, vinyl); // treatment
    flr(CX + p, X1 - IN, RZ1 + p, PZ - p, vinyl); // consult 2
    flr(CX + p, X1 - IN, RZ2 + p, RZ1 - p, K.surf('concrete', 0x3e4a52)); // office carpet
    flr(CX + p, X1 - IN, Z0 + IN, RZ2 - p, tileF); // toilet
    // linings. Waiting room: warm beige plaster, white skirting. Clinic: pale walls with a teal bump rail. Office: sage. WC: tiles
    const beige = K.mat(0xe2d6c2, 0.85),
      paleW = K.mat(0xeef0ee, 0.85),
      sageW = K.mat(0xb9c4bd, 0.85),
      skirt = K.mat(0xf4f4f0, 0.5);
    const waitSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, y1, beige, 0.012, 0.006);
      if (y0 <= 0 && y1 > 0.2) pc(u0, u1, 0, 0.12, skirt, 0.03, 0.015);
    };
    const clinSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, y1, paleW, 0.012, 0.006);
      if (y0 <= 0.85 && y1 >= 1.0) pc(u0, u1, 0.85, 1.0, tealM, 0.035, 0.02);
      if (y0 <= 0 && y1 > 0.2) pc(u0, u1, 0, 0.1, tealM, 0.03, 0.015);
    };
    const offSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, y1, sageW, 0.012, 0.006);
      if (y0 <= 0 && y1 > 0.2) pc(u0, u1, 0, 0.1, skirt, 0.03, 0.015);
    };
    const tileSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, Math.min(y1, 1.5), tileW, 0.012, 0.006);
      if (y1 > 1.5) pc(u0, u1, Math.max(y0, 1.5), y1, paleW, 0.012, 0.006);
    };
    const inR = (ops, a0, a1) => ops.filter(o => o.c > a0 && o.c < a1);
    // waiting room
    LK.lineWall(b, 1, Z1, X0, X1, -1, FRONT, RC, waitSpan);
    LK.lineWall(b, 0, X0, PZ + p, Z1, 1, [], RC, waitSpan);
    LK.lineWall(b, 0, X1, PZ + p, Z1, -1, inR(RIGHT, PZ, Z1), RC, waitSpan);
    LK.lineWall(b, 1, PZ + p, X0, X1, 1, PART, RC, waitSpan);
    // corridor
    LK.lineWall(b, 0, -CX + p, Z0 + IN, PZ - p, 1, CORL, RC, clinSpan);
    LK.lineWall(b, 0, CX - p, Z0 + IN, PZ - p, -1, CORR, RC, clinSpan);
    LK.lineWall(b, 1, Z0, -CX + p, CX - p, 1, BACKD, RC, clinSpan);
    LK.lineWall(b, 1, PZ - p, -CX + p, CX - p, -1, PART, RC, clinSpan);
    // consult 1 and the treatment room (left)
    LK.lineWall(b, 1, PZ - p, X0, -CX - p, -1, [], RC, clinSpan);
    LK.lineWall(b, 0, X0, LZ + p, PZ - p, 1, inR(LEFT, LZ, PZ), RC, clinSpan);
    LK.lineWall(b, 1, LZ + p, X0, -CX - p, 1, [], RC, clinSpan);
    LK.lineWall(b, 0, -CX - p, LZ + p, PZ - p, -1, inR(CORL, LZ, PZ), RC, clinSpan);
    LK.lineWall(b, 1, LZ - p, X0, -CX - p, -1, [], RC, clinSpan);
    LK.lineWall(b, 0, X0, Z0, LZ - p, 1, inR(LEFT, Z0, LZ), RC, clinSpan);
    LK.lineWall(b, 1, Z0, X0, -CX - p, 1, [], RC, clinSpan);
    LK.lineWall(b, 0, -CX - p, Z0 + IN, LZ - p, -1, inR(CORL, Z0, LZ), RC, clinSpan);
    // consult 2, the office, the toilet (right)
    LK.lineWall(b, 1, PZ - p, CX + p, X1, -1, [], RC, clinSpan);
    LK.lineWall(b, 0, X1, RZ1 + p, PZ - p, -1, inR(RIGHT, RZ1, PZ), RC, clinSpan);
    LK.lineWall(b, 1, RZ1 + p, CX + p, X1, 1, [], RC, clinSpan);
    LK.lineWall(b, 0, CX + p, RZ1 + p, PZ - p, 1, inR(CORR, RZ1, PZ), RC, clinSpan);
    LK.lineWall(b, 1, RZ1 - p, CX + p, X1, -1, [], RC, offSpan);
    LK.lineWall(b, 0, X1, RZ2 + p, RZ1 - p, -1, inR(RIGHT, RZ2, RZ1), RC, offSpan);
    LK.lineWall(b, 1, RZ2 + p, CX + p, X1, 1, [], RC, offSpan);
    LK.lineWall(b, 0, CX + p, RZ2 + p, RZ1 - p, 1, inR(CORR, RZ2, RZ1), RC, offSpan);
    LK.lineWall(b, 1, RZ2 - p, CX + p, X1, -1, [], RC, tileSpan);
    LK.lineWall(b, 0, X1, Z0, RZ2 - p, -1, [], RC, tileSpan);
    LK.lineWall(b, 1, Z0, CX + p, X1, 1, [], RC, tileSpan);
    LK.lineWall(b, 0, CX + p, Z0 + IN, RZ2 - p, 1, inR(CORR, Z0, RZ2), RC, tileSpan);
    // ceiling over everything at RC
    const ceil = K.mat(0xf2f2ee, 0.9),
      hous = K.mat(0xe4e4e0, 0.5, 0.2),
      lit = K.mat(0xffffff, 0.4, 0, {emissive: 0xf6f8ff, emissiveIntensity: 0.95});
    b.box(X1 - X0 - 0.3, 0.04, Z1 - Z0 - 0.3, ceil, [0, RC + 0.02, 0], null, 0);
    // waiting room: warm recessed downlights and a cove strip along the partition and the right wall
    for (let dx = -6; dx <= 6.01; dx += 2)
      for (const dz of [3.0, 5.6, 8.0]) {
        b.cyl(0.09, 0.09, 0.012, warm, [dx, RC - 0.005, dz], null, 12);
        b.cyl(0.11, 0.11, 0.008, chrome, [dx, RC - 0.001, dz], null, 12);
      }
    b.box(X1 - X0 - 0.4, 0.1, 0.12, ceil, [0, RC - 0.05, PZ + p + 0.08], null, 0);
    b.box(X1 - X0 - 0.4, 0.015, 0.03, warm, [0, RC - 0.105, PZ + p + 0.13], null, 0);
    b.box(0.12, 0.1, Z1 - PZ - 0.5, ceil, [X1 - IN - 0.08, RC - 0.05, (PZ + Z1) / 2], null, 0);
    b.box(0.03, 0.015, Z1 - PZ - 0.5, warm, [X1 - IN - 0.13, RC - 0.105, (PZ + Z1) / 2], null, 0);
    // clinic: square LED panels
    for (const [lx, lz] of [
      [0, -1.2],
      [0, -4.6],
      [0, -7.8],
      [-4.5, -0.8],
      [-4.5, -2.9],
      [-4.5, -5.6],
      [-4.5, -7.6],
      [4.5, -0.6],
      [4.5, -2.3],
      [4.8, -4.8],
      [4.8, -7.7]
    ]) {
      b.box(0.62, 0.03, 0.62, hous, [lx, RC - 0.01, lz], null, 0.005);
      b.box(0.56, 0.01, 0.56, lit, [lx, RC - 0.03, lz], null, 0);
    }

    /* ---------- shared makers: exam couch, curtain rail, sink unit, chairs, wall plates ---------- */
    const vinylB = K.mat(0x2a6a7a, 0.55),
      paper = K.mat(0xf6f6f0, 0.9),
      por = K.mat(0xf4f4f0, 0.25),
      curtainM = K.mat(0x8ab4c8, 0.9),
      ws = K.mat(0xe8e8e4, 0.45, 0.3);
    // exam couch with a paper roll, along z (a = 0) or along x (a = PI/2)
    const couch = (x, z, a) => {
      b.push([x, 0, z], [0, a, 0]);
      for (const [cx, cz] of [
        [-0.28, -0.8],
        [0.28, -0.8],
        [-0.28, 0.8],
        [0.28, 0.8]
      ])
        b.cyl(0.025, 0.025, 0.6, chrome, [cx, 0.3, cz], null, 8);
      b.box(0.62, 0.06, 1.75, ws, [0, 0.6, 0], null, 0.01);
      rb(0.66, 0.1, 1.3, 0.04, vinylB, [0, 0.68, 0.24]);
      rb(0.66, 0.1, 0.55, 0.04, vinylB, [0, 0.76, -0.66], [-0.3, 0, 0]);
      b.box(0.5, 0.012, 1.7, paper, [0, 0.74, 0.05], [-0.02, 0, 0], 0);
      b.cyl(0.07, 0.07, 0.56, paper, [0, 0.7, 0.92], [0, 0, PI / 2], 10);
      b.box(0.5, 0.05, 1.5, ws, [0, 0.18, 0], null, 0.01); // bottom shelf
      b.pop();
      if (Math.abs(Math.sin(a)) > 0.5) S(x - 0.98, x + 0.98, z - 0.35, z + 0.35, 0, 0.85, true);
      else S(x - 0.35, x + 0.35, z - 0.98, z + 0.98, 0, 0.85, true);
    };
    // ceiling curtain rail along z at x, from z0 to z1, with the curtain bunched at z0 (length cl)
    const curtain = (x, z0, z1, cl) => {
      b.box(0.03, 0.03, Math.abs(z1 - z0), steel, [x, RC - 0.08, (z0 + z1) / 2], null, 0);
      const sg = Math.sign(z1 - z0),
        n = 7;
      for (let k = 0; k < n; k++)
        b.box(
          0.06,
          2.4,
          cl / n + 0.02,
          curtainM,
          [x + (k % 2 ? 0.05 : -0.05), 1.55, z0 + sg * (k + 0.5) * (cl / n)],
          null,
          0
        );
      S(x - 0.1, x + 0.1, Math.min(z0, z0 + sg * cl), Math.max(z0, z0 + sg * cl), 0.3, 2.8, true);
    };
    // white sink unit with a basin, a mixer tap and soap / towel dispensers above; against a z wall facing n
    const sink = (x, z, n) => {
      b.box(1.2, 0.85, 0.58, ws, [x, 0.43, z], null, 0.01);
      b.box(1.24, 0.04, 0.62, K.mat(0xd8dcdc, 0.3), [x, 0.87, z], null, 0.005);
      b.box(0.44, 0.04, 0.34, por, [x - 0.2, 0.9, z + n * 0.02], null, 0.03);
      b.cyl(0.015, 0.015, 0.25, chrome, [x - 0.2, 1.0, z - n * 0.2], null, 8);
      b.box(0.02, 0.02, 0.18, chrome, [x - 0.2, 1.12, z - n * 0.12], null, 0);
      b.box(0.28, 0.36, 0.1, white, [x + 0.3, 1.45, z - n * 0.25], null, 0.02); // paper towels
      b.box(0.1, 0.2, 0.08, white, [x - 0.45, 1.3, z - n * 0.26], null, 0.01); // soap
      b.box(0.26, 0.14, 0.12, K.mat(0x3a7ac8, 0.6), [x + 0.62, 1.35, z - n * 0.24], null, 0.01); // glove box
      b.box(0.22, 0.26, 0.16, yel, [x + 0.62, 1.1, z - n * 0.22], null, 0.02); // sharps bin
      b.box(0.22, 0.04, 0.16, K.mat(0xd82020, 0.5), [x + 0.62, 1.25, z - n * 0.22], null, 0.01);
      S(x - 0.62, x + 0.62, z - 0.3, z + 0.3, 0, 0.92, true);
    };
    // plastic visitor chair facing angle a
    const chair = (x, z, a, m) => {
      b.push([x, 0, z], [0, a, 0]);
      for (const [cx, cz] of [
        [-0.2, -0.2],
        [0.2, -0.2],
        [-0.2, 0.2],
        [0.2, 0.2]
      ])
        b.cyl(0.012, 0.012, 0.45, chrome, [cx, 0.23, cz], null, 6);
      rb(0.46, 0.05, 0.44, 0.02, m || tealM, [0, 0.47, 0]);
      rb(0.44, 0.38, 0.04, 0.02, m || tealM, [0, 0.72, -0.22], [-0.1, 0, 0]);
      b.pop();
      S(x - 0.25, x + 0.25, z - 0.25, z + 0.25, 0, 0.9, true);
    };
    // small door plate above a door head; ax: 1 for a z wall at f (normal n), 0 for an x wall
    const plate = (key, text, ax, f, u, n) => {
      const m = card(key, 256, 64, [[text, 'bold 34px Arial']], TEAL, '#f2f2ee');
      if (ax) b.label(0.7, 0.18, m, [u, 2.6, f + n * 0.01], [0, n > 0 ? 0 : PI, 0]);
      else b.label(0.7, 0.18, m, [f + n * 0.01, 2.6, u], [0, n > 0 ? PI / 2 : -PI / 2, 0]);
    };
    // monitor facing angle a (screen towards +z rotated by a)
    const scr = card(
      'lpc_pc',
      256,
      160,
      [
        ['PATIENT RECORDS', 'bold 22px Arial'],
        ['* * * *', '22px monospace']
      ],
      '#1a3a5a',
      '#cfe8ff'
    );
    const monitor = (x, y, z, a) => {
      b.push([x, y, z], [0, a, 0]);
      b.box(0.04, 0.012, 0.18, black, [0, 0, 0], null, 0);
      b.box(0.03, 0.22, 0.03, black, [0, 0.11, -0.03], null, 0);
      b.box(0.52, 0.32, 0.03, black, [0, 0.36, 0], null, 0.01);
      b.label(0.48, 0.28, scr, [0, 0.36, 0.017]);
      b.box(0.42, 0.015, 0.14, black, [0, 0.008, 0.22], null, 0.005);
      b.pop();
    };

    /* ---------- reception: white counter with a smoked-glass front, screen, monitors ---------- */
    {
      const CZ = 4.6, // main run (customer side +z)
        CXr = -3.4, // return (customer side +x)
        xL = X0 + IN,
        zR = 2.6,
        smoke = K.glass(0x2a2c30, 0.55);
      // carcass
      b.box(CXr + 0.35 - xL, 1.08, 0.7, white, [(xL + CXr + 0.35) / 2, 0.54, CZ], null, 0.01);
      b.box(0.7, 1.08, CZ - 0.35 - zR, white, [CXr, 0.54, (zR + CZ - 0.35) / 2], null, 0.01);
      // white top with a lip, a lower writing shelf on the inside
      b.box(CXr + 0.39 - xL, 0.04, 0.78, white, [(xL + CXr + 0.39) / 2, 1.1, CZ + 0.02], null, 0.005);
      b.box(0.78, 0.04, CZ - 0.35 - zR, white, [CXr + 0.02, 1.1, (zR + CZ - 0.35) / 2], null, 0.005);
      b.box(CXr - 0.35 - xL, 0.03, 0.45, white, [(xL + CXr - 0.35) / 2, 0.75, CZ - 0.55], null, 0.005);
      // smoked glass fronts and a glass screen on top
      b.box(CXr + 0.2 - xL - 0.3, 0.86, 0.02, smoke, [(xL + 0.3 + CXr + 0.2) / 2, 0.6, CZ + 0.37], null, 0);
      b.box(0.02, 0.86, CZ + 0.2 - zR - 0.15, smoke, [CXr + 0.37, 0.6, (zR + 0.15 + CZ + 0.2) / 2], null, 0);
      const gl = K.glass(0xdfeef2, 0.2);
      b.box(CXr - xL - 0.6, 0.42, 0.012, gl, [(xL + 0.3 + CXr - 0.3) / 2, 1.33, CZ + 0.1], null, 0);
      b.box(0.012, 0.42, CZ - zR - 0.6, gl, [CXr + 0.1, 1.33, (zR + 0.3 + CZ - 0.3) / 2], null, 0);
      // the RECEPTION label on the front, a bell, leaflets, a plant, a card machine
      b.label(1.1, 0.2, card('lpc_recep', 512, 96, [['RECEPTION', '600 56px Arial']], '#2a2c30', '#e8e8e4'), [
        -5.4,
        0.85,
        CZ + 0.385
      ]);
      b.cyl(0.05, 0.06, 0.05, K.mat(0xc8a040, 0.3, 0.9), [-4.4, 1.15, CZ + 0.3], null, 12);
      b.box(0.24, 0.02, 0.16, K.mat(0x8ac8b8, 0.6), [-6.4, 1.13, CZ + 0.28], [0, 0.2, 0], 0);
      b.box(0.08, 0.02, 0.14, black, [-3.9, 1.13, CZ + 0.25], null, 0.005);
      b.cyl(0.08, 0.07, 0.14, white, [-7.4, 1.19, CZ + 0.2], null, 12);
      for (let k = 0; k < 6; k++)
        b.sph(0.07, k % 2 ? leaf : leaf2, [
          -7.4 + (rnd() - 0.5) * 0.14,
          1.32 + rnd() * 0.08,
          CZ + 0.2 + (rnd() - 0.5) * 0.14
        ]);
      // two monitors, keyboards and a phone on the writing shelf, facing the secretary
      monitor(-6.0, 0.77, CZ - 0.6, PI);
      monitor(-4.7, 0.77, CZ - 0.6, PI);
      b.box(0.2, 0.06, 0.18, black, [-5.35, 0.79, CZ - 0.45], null, 0.01);
      S(xL, CXr + 0.38, CZ - 0.35, CZ + 0.39, 0, 1.12);
      S(CXr - 0.35, CXr + 0.38, zR, CZ - 0.35, 0, 1.12);
    }

    /* ---------- secretary's area: oak feature wall with the logo, chair, filing cabinets, printer ---------- */
    {
      const fz = PZ + p;
      b.box(3.6, RC - 0.05, 0.04, oak, [-5.0, (RC - 0.05) / 2, fz + 0.02], null, 0);
      const lg = K.paint(
        'lpc_wlogo',
        512,
        420,
        (c, W, H) => {
          c.clearRect(0, 0, W, H);
          logo(c, W / 2, 150, 110, '#f4f4f0');
          c.fillStyle = '#f4f4f0';
          c.textAlign = 'center';
          c.font = '500 56px "Montserrat", "Century Gothic", Arial, sans-serif';
          c.fillText('LITTLE PRICK', W / 2, 330);
          c.font = '500 40px "Montserrat", "Century Gothic", Arial, sans-serif';
          c.fillText('C L I N I C', W / 2, 390);
        },
        {alpha: true}
      );
      b.label(1.4, 1.15, lg, [-5.0, 1.95, fz + 0.045]);
      // secretary's chair at the counter
      const cs = K.mat(0x2a2c34, 0.7);
      b.cyl(0.25, 0.25, 0.04, black, [-5.3, 0.06, 3.55], null, 5);
      b.cyl(0.03, 0.03, 0.4, chrome, [-5.3, 0.28, 3.55], null, 8);
      rb(0.48, 0.08, 0.46, 0.03, cs, [-5.3, 0.52, 3.55]);
      rb(0.46, 0.55, 0.07, 0.03, cs, [-5.3, 0.85, 3.3], [-0.1, 0, 0]);
      S(-5.57, -5.03, 3.28, 3.82, 0, 1.1, true);
      // two grey four-drawer filing cabinets and a printer on a low unit against the feature wall
      for (const fx of [-7.45, -6.95]) {
        b.box(0.48, 1.32, 0.6, K.mat(0x8a9094, 0.45, 0.4), [fx, 0.66, fz + 0.32], null, 0.01);
        for (let k = 0; k < 4; k++) b.box(0.18, 0.03, 0.02, chrome, [fx, 1.15 - k * 0.32, fz + 0.63], null, 0);
      }
      S(-7.7, -6.7, fz, fz + 0.62, 0, 1.33);
      b.box(1.0, 0.7, 0.5, white, [-4.2, 0.35, fz + 0.27], null, 0.01);
      rb(0.5, 0.3, 0.42, 0.02, K.mat(0x3a3c40, 0.5), [-4.2, 0.86, fz + 0.27]);
      b.box(0.3, 0.01, 0.2, paper, [-4.2, 1.02, fz + 0.27], null, 0);
      S(-4.7, -3.7, fz, fz + 0.52, 0, 1.0, true);
    }

    /* ---------- waiting area: teal bench seating on oak plinths, ottoman, coffee table, art, water cooler, plants ---------- */
    {
      const cream = K.mat(0xece4d4, 0.7),
        teal = K.mat(0x2e8a80, 0.75),
        tealD = K.mat(0x23746c, 0.75);
      // bench run: x from u0 to u1 along a z wall (ax = 1, wall at f, normal n) or z along an x wall (ax = 0)
      const bench = (ax, f, n, u0, u1) => {
        const L = u1 - u0,
          u = (u0 + u1) / 2,
          c = f + n * 0.3;
        const box = (w, h, d, m, y, off, r) =>
          ax
            ? rb(w, h, d, r || 0.01, m, [u, y, c + n * (off || 0)])
            : rb(d, h, w, r || 0.01, m, [c + n * (off || 0), y, u]);
        box(L, 0.34, 0.6, oak, 0.17, 0, 0.01);
        box(L, 0.04, 0.6, cream, 0.36, 0, 0.01);
        box(L, 0.1, 0.58, teal, 0.43, 0, 0.04);
        // bolster cushions against the wall
        const nb = Math.max(1, Math.round(L / 1.8)),
          bl = L / nb;
        for (let k = 0; k < nb; k++) {
          const bu = u0 + (k + 0.5) * bl;
          if (ax) rb(bl - 0.06, 0.26, 0.18, 0.09, tealD, [bu, 0.7, f + n * 0.1]);
          else rb(0.18, 0.26, bl - 0.06, 0.09, tealD, [f + n * 0.1, 0.7, bu]);
        }
        if (ax) S(u0, u1, Math.min(f, f + n * 0.6), Math.max(f, f + n * 0.6), 0, 0.85, true);
        else S(Math.min(f, f + n * 0.6), Math.max(f, f + n * 0.6), u0, u1, 0, 0.85, true);
      };
      bench(1, PZ + p, 1, 2.2, X1 - IN);
      bench(0, X1 - IN, -1, PZ + p + 0.6, 7.4);
      // ottoman bench in the middle
      rb(2.6, 0.34, 0.7, 0.01, oak, [4.1, 0.17, 5.1]);
      rb(2.6, 0.04, 0.7, 0.01, cream, [4.1, 0.36, 5.1]);
      rb(2.56, 0.1, 0.66, 0.04, teal, [4.1, 0.43, 5.1]);
      S(2.8, 5.4, 4.75, 5.45, 0, 0.5, true);
      // coffee table with magazines
      b.cyl(0.4, 0.4, 0.04, oak, [6.3, 0.45, 2.55], null, 20);
      b.cyl(0.04, 0.04, 0.43, black, [6.3, 0.22, 2.55], null, 8);
      b.cyl(0.25, 0.25, 0.02, black, [6.3, 0.01, 2.55], null, 16);
      for (let k = 0; k < 4; k++)
        b.box(
          0.22,
          0.01,
          0.3,
          K.mat([0xd84a3a, 0x3a7ac8, 0xf2c418, 0xe8e8e4][k], 0.7),
          [6.2 + k * 0.06, 0.475 + k * 0.01, 2.5],
          [0, 0.3 * k - 0.4, 0],
          0
        );
      S(5.9, 6.7, 2.15, 2.95, 0, 0.5, true);
      // gold line art over the bench (faces in one stroke) and two framed prints
      const art = K.paint(
        'lpc_lineart',
        512,
        256,
        (c, W, H) => {
          c.clearRect(0, 0, W, H);
          c.strokeStyle = '#b8924a';
          c.lineWidth = 5;
          c.lineCap = 'round';
          c.beginPath();
          c.moveTo(40, 220);
          c.bezierCurveTo(60, 40, 200, 20, 230, 120);
          c.bezierCurveTo(250, 200, 160, 230, 150, 150);
          c.bezierCurveTo(140, 80, 260, 60, 290, 130);
          c.bezierCurveTo(320, 210, 420, 200, 420, 110);
          c.bezierCurveTo(420, 30, 300, 40, 330, 120);
          c.bezierCurveTo(360, 200, 470, 230, 480, 230);
          c.stroke();
          c.beginPath();
          c.arc(190, 110, 6, 0, PI * 2);
          c.arc(370, 105, 6, 0, PI * 2);
          c.stroke();
        },
        {alpha: true}
      );
      b.label(1.8, 0.9, art, [3.4, 1.85, PZ + p + 0.015]);
      const print = (key, x, col1, col2) => {
        const m = K.paint(key, 128, 160, (c, W, H) => {
          c.fillStyle = '#f2ece0';
          c.fillRect(0, 0, W, H);
          c.fillStyle = col1;
          for (let i = 0; i < 4; i++)
            for (let j = 0; j < 5; j++) if ((i + j) % 2) c.fillRect(24 + i * 20, 20 + j * 20, 20, 20);
          c.fillStyle = col2;
          c.beginPath();
          c.ellipse(W / 2, 135, 30, 14, 0, 0, PI * 2);
          c.fill();
        });
        b.box(0.5, 0.62, 0.03, oak, [x, 1.9, PZ + p + 0.02], null, 0.005);
        b.label(0.42, 0.54, m, [x, 1.9, PZ + p + 0.037]);
      };
      print('lpc_print1', 5.4, '#2a2a2a', '#c89a6a');
      print('lpc_print2', 6.2, '#b8924a', '#2e8a80');
      // brown lettering on the right wall over the bench
      b.label(
        1.6,
        0.6,
        K.paint(
          'lpc_seat',
          320,
          120,
          (c, W, H) => {
            c.clearRect(0, 0, W, H);
            c.fillStyle = '#7a3a2a';
            c.font = '600 34px "Montserrat", Arial, sans-serif';
            c.textAlign = 'center';
            c.fillText('PLEASE', W / 2, 36);
            c.fillText('TAKE A', W / 2, 74);
            c.fillText('SEAT', W / 2, 112);
          },
          {alpha: true}
        ),
        [X1 - IN - 0.015, 2.05, 2.7],
        [0, -PI / 2, 0]
      );
      // water cooler beside the clinic door
      b.box(0.34, 1.0, 0.34, white, [1.75, 0.5, PZ + p + 0.24], null, 0.02);
      b.cyl(0.15, 0.15, 0.4, K.glass(0x8ac8f0, 0.5), [1.75, 1.2, PZ + p + 0.24], null, 14);
      b.box(0.08, 0.06, 0.04, K.mat(0x2a6ad8, 0.5), [1.69, 0.8, PZ + p + 0.42], null, 0);
      b.box(0.08, 0.06, 0.04, K.mat(0xd82020, 0.5), [1.81, 0.8, PZ + p + 0.42], null, 0);
      S(1.57, 1.93, PZ + p, PZ + p + 0.42, 0, 1.4, true);
      // tall plants by the doors and the left window
      for (const [px, pz] of [
        [2.0, 8.3],
        [-1.9, 8.3]
      ]) {
        b.cyl(0.22, 0.17, 0.45, K.mat(0x2a2c30, 0.6), [px, 0.23, pz], null, 14);
        b.cyl(0.02, 0.025, 0.7, K.mat(0x5a4a2a, 0.8), [px, 0.8, pz], null, 6);
        for (let k = 0; k < 9; k++)
          b.sph(0.14 + rnd() * 0.06, k % 2 ? leaf : leaf2, [
            px + (rnd() - 0.5) * 0.4,
            0.9 + rnd() * 0.5,
            pz + (rnd() - 0.5) * 0.4
          ]);
        S(px - 0.24, px + 0.24, pz - 0.24, pz + 0.24, 0, 1.4, true);
      }
      // hand-gel stand and a leaflet rack on the left wall
      b.cyl(0.13, 0.15, 0.03, steel, [-1.8, 0.02, 7.1], null, 12);
      b.cyl(0.02, 0.02, 1.1, steel, [-1.8, 0.56, 7.1], null, 8);
      b.box(0.14, 0.24, 0.1, white, [-1.8, 1.2, 7.1], null, 0.02);
      S(-1.95, -1.65, 6.95, 7.25, 0, 1.3, true);
      b.box(0.08, 0.9, 0.6, K.mat(0xd8dcdc, 0.3, 0.6), [X0 + IN + 0.04, 1.3, 6.4], null, 0.01);
      for (let k = 0; k < 3; k++)
        for (let j = 0; j < 2; j++)
          b.box(
            0.01,
            0.22,
            0.15,
            K.mat([0x2e8a80, 0xf2c418, 0xd84a3a, 0x3a7ac8, 0xe8e8e4, 0x8ac8b8][k * 2 + j], 0.7),
            [X0 + IN + 0.09, 1.0 + k * 0.28, 6.25 + j * 0.3],
            null,
            0
          );
      // teal semicircle door mat with the LP ring
      const mat = K.paint('lpc_mat', 256, 128, (c, W, H) => {
        c.fillStyle = '#e2d6c2';
        c.fillRect(0, 0, W, H);
        c.fillStyle = '#1d4a52';
        c.beginPath();
        c.arc(W / 2, 0, W / 2 - 2, 0, PI);
        c.fill();
        logo(c, W / 2, 48, 30, '#d8e4e0');
      });
      b.add(K.planeGeo(1.8, 0.9), mat, {p: [0, 0.05, Z1 - IN - 0.45], r: [-PI / 2, 0, PI]});
    }

    /* ---------- corridor: door plates, hand gel, notice board, extinguisher ---------- */
    {
      plate('lpc_pl1', 'CONSULT 1', 0, -CX + p, -1.0, 1);
      plate('lpc_pl2', 'JAB ROOM', 0, -CX + p, -6.0, 1);
      plate('lpc_pl3', 'CONSULT 2', 0, CX - p, -1.0, -1);
      plate('lpc_pl4', 'DOCTOR', 0, CX - p, -4.8, -1);
      plate('lpc_pl5', 'WC', 0, CX - p, -7.7, -1);
      plate('lpc_pl6', 'CLINIC', 1, PZ + p, 0, 1);
      for (const [gx, gz] of [
        [-CX + p + 0.06, -2.1],
        [CX - p - 0.06, -3.6]
      ])
        b.box(0.1, 0.24, 0.14, white, [gx, 1.25, gz], null, 0.02);
      b.box(0.03, 0.8, 1.1, K.mat(0xb08a5a, 0.95), [-CX + p + 0.02, 1.6, -3.6], null, 0);
      for (let k = 0; k < 5; k++)
        b.box(
          0.005,
          0.26,
          0.2,
          K.mat([0xf8f8f0, 0xf2e88a, 0xa8d8f0, 0xf8f8f0, 0xf2b8c8][k], 0.9),
          [-CX + p + 0.04, 1.75 - (k % 2) * 0.32, -3.95 + k * 0.17],
          [(k - 2) * 0.05, 0, 0],
          0
        );
      b.cyl(0.08, 0.08, 0.5, K.mat(0xc81e1e, 0.4), [CX - p - 0.12, 0.45, Z0 + IN + 0.22], null, 12); // v089: off the toilet door jamb
      b.box(0.04, 0.3, 0.2, K.mat(0x2e8a3a, 0.6), [CX - p - 0.01, 2.1, Z0 + IN + 0.5], null, 0); // fire exit sign
    }

    /* ---------- consult 1 (left front): couch, curtain, sink, chairs, eye chart, scales ---------- */
    couch(X0 + IN + 0.4, -2.65, 0);
    curtain(-6.6, LZ + p + 0.05, -1.3, 0.9);
    sink(-3.6, LZ + p + 0.3, 1);
    chair(-3.15, -0.6, -PI / 2 - 0.4);
    chair(-6.0, -1.0, PI / 2 + 0.6);
    // eye chart and BP monitor
    const eye = K.paint('lpc_eye', 128, 192, (c, W, H) => {
      c.fillStyle = '#f8f8f4';
      c.fillRect(0, 0, W, H);
      c.fillStyle = '#111';
      c.textAlign = 'center';
      const rows = ['E', 'F P', 'T O Z', 'L P E D', 'P E C F D', 'E D F C Z P'];
      rows.forEach((r, i) => {
        c.font = `bold ${44 - i * 7}px Arial`;
        c.fillText(r, W / 2, 40 + i * 28);
      });
    });
    b.label(0.4, 0.6, eye, [-CX - p - 0.01, 1.6, -3.0], [0, -PI / 2, 0]);
    b.label(0.4, 0.6, eye, [CX + p + 0.01, 1.6, -2.6], [0, PI / 2, 0]);
    for (const [mx, mz, ma] of [
      [-4.0, PZ - p - 0.04, PI],
      [5.2, PZ - p - 0.04, PI]
    ]) {
      b.box(0.22, 0.3, 0.06, K.mat(0x6a7a80, 0.5), [mx, 1.5, mz], [0, ma, 0], 0.02);
      b.cyl(0.08, 0.08, 0.02, white, [mx, 1.55, mz - 0.035], [PI / 2, 0, 0], 14);
      b.box(0.3, 0.12, 0.06, K.mat(0x2a4a8a, 0.6), [mx, 1.25, mz - 0.02], null, 0.01);
    }
    // anatomy posters over the desks
    const anat = K.paint('lpc_anat', 128, 180, (c, W, H) => {
      c.fillStyle = '#f4f0e6';
      c.fillRect(0, 0, W, H);
      c.strokeStyle = '#a83a2a';
      c.lineWidth = 3;
      c.beginPath();
      c.arc(W / 2, 30, 14, 0, PI * 2);
      c.moveTo(W / 2, 44);
      c.lineTo(W / 2, 110);
      c.moveTo(W / 2 - 30, 60);
      c.lineTo(W / 2 + 30, 60);
      c.moveTo(W / 2, 110);
      c.lineTo(W / 2 - 18, 165);
      c.moveTo(W / 2, 110);
      c.lineTo(W / 2 + 18, 165);
      c.stroke();
      c.fillStyle = '#2a4a8a';
      c.font = 'bold 12px Arial';
      c.textAlign = 'center';
      c.fillText('THE HUMAN BODY', W / 2, 176);
    });
    b.label(0.5, 0.7, anat, [-5.6, 1.85, PZ - p - 0.012], [0, PI, 0]);
    b.label(0.5, 0.7, anat, [3.6, 1.85, PZ - p - 0.012], [0, PI, 0]);
    // floor scales
    const scales = (x, z) => {
      b.box(0.34, 0.06, 0.4, white, [x, 0.07, z], null, 0.02);
      b.cyl(0.025, 0.025, 1.1, steel, [x, 0.6, z - 0.17], null, 8);
      b.box(0.26, 0.18, 0.06, white, [x, 1.2, z - 0.17], null, 0.02);
      S(x - 0.18, x + 0.18, z - 0.22, z + 0.22, 0, 1.3, true);
    };
    scales(-2.0, LZ + p + 0.4);
    // instrument trolley
    const trolley = (x, z) => {
      for (const y of [0.25, 0.8]) b.box(0.5, 0.02, 0.4, steel, [x, y, z], null, 0);
      for (const [cx, cz] of [
        [-0.23, -0.18],
        [0.23, -0.18],
        [-0.23, 0.18],
        [0.23, 0.18]
      ])
        b.cyl(0.012, 0.012, 0.8, chrome, [x + cx, 0.42, z + cz], null, 6);
      b.box(0.3, 0.02, 0.22, K.mat(0xc8ccd0, 0.3, 0.8), [x, 0.82, z], null, 0.005);
      for (let k = 0; k < 4; k++)
        b.cyl(0.008, 0.008, 0.12, K.mat(0xe8f0f8, 0.3), [x - 0.1 + k * 0.06, 0.84, z], [0, 0, PI / 2], 6);
      S(x - 0.26, x + 0.26, z - 0.21, z + 0.21, 0, 0.9, true);
    };
    trolley(-6.0, LZ + p + 0.35);

    /* ---------- jab room (left back): phlebotomy chair, couch, trolley, worktop, posters ---------- */
    {
      // phlebotomy chair facing +x, both arm rests out
      const fx = -6.4,
        fz = -5.4;
      b.push([fx, 0, fz], [0, PI / 2, 0]);
      b.box(0.5, 0.4, 0.5, ws, [0, 0.2, 0], null, 0.02);
      rb(0.56, 0.12, 0.56, 0.04, vinylB, [0, 0.46, 0]);
      rb(0.56, 0.75, 0.12, 0.04, vinylB, [0, 0.85, -0.3], [-0.2, 0, 0]);
      rb(0.3, 0.14, 0.2, 0.05, vinylB, [0, 1.3, -0.4], [-0.2, 0, 0]);
      for (const s of [-1, 1]) {
        b.cyl(0.02, 0.02, 0.3, chrome, [s * 0.34, 0.55, 0.05], null, 6);
        rb(0.14, 0.07, 0.6, 0.03, vinylB, [s * 0.38, 0.72, 0.18], [0, s * -0.2, 0]);
      }
      b.pop();
      S(fx - 0.5, fx + 0.45, fz - 0.45, fz + 0.45, 0, 1.4, true);
      trolley(-5.45, -6.3);
      couch(-5.4, Z0 + IN + 0.4, PI / 2);
      // worktop by the door wall with a box of swabs
      b.box(1.0, 0.85, 0.55, ws, [-3.3, 0.43, LZ - p - 0.28], null, 0.01);
      b.box(1.04, 0.04, 0.58, K.mat(0xd8dcdc, 0.3), [-3.3, 0.87, LZ - p - 0.28], null, 0.005);
      b.box(0.22, 0.26, 0.16, yel, [-2.95, 1.02, LZ - p - 0.25], null, 0.02);
      b.box(0.22, 0.04, 0.16, K.mat(0xd82020, 0.5), [-2.95, 1.17, LZ - p - 0.25], null, 0.01);
      S(-3.8, -2.8, LZ - p - 0.56, LZ - p, 0, 0.92, true);
      // posters: a sticker chart and a jab-schedule
      b.label(
        0.7,
        0.9,
        card(
          'lpc_brave',
          140,
          180,
          [
            ['I WAS', 'bold 22px Arial'],
            ['BRAVE!', 'bold 26px Arial'],
            ['★ ★ ★', '24px Arial'],
            ['ask for a sticker', 'italic 13px Georgia']
          ],
          '#fff4c8',
          '#c8401a'
        ),
        [X0 + IN + 0.012, 1.7, -8.2],
        [0, PI / 2, 0]
      );
      b.label(
        0.8,
        0.55,
        card(
          'lpc_sched',
          200,
          140,
          [
            ['VACCINE', 'bold 22px Arial'],
            ['SCHEDULE', 'bold 22px Arial'],
            ['FLU · TETANUS · MMR', '13px Arial'],
            ['keep fridge 2-8°C', '13px Arial']
          ],
          '#e8f2ee',
          TEAL
        ),
        [-2.2, 1.8, LZ - p - 0.012],
        [0, PI, 0]
      );
    }

    /* ---------- consult 2 (right front): mirror of consult 1 ---------- */
    couch(X1 - IN - 0.4, -1.95, PI);
    curtain(6.6, RZ1 + p + 0.05, -0.6, 0.8);
    sink(3.4, RZ1 + p + 0.3, 1);
    chair(3.15, -0.6, PI / 2 + 0.4);
    scales(2.0, RZ1 + p + 0.45);
    trolley(5.95, RZ1 + p + 0.35);

    /* ---------- doctor's office: chair, visitor chair, filing cabinet, coat stand, certificates, rug ---------- */
    {
      chair(5.7, -4.1, PI + 0.3, K.mat(0x6a4a2c, 0.6));
      b.box(0.48, 1.32, 0.6, K.mat(0x8a9094, 0.45, 0.4), [X1 - IN - 0.32, 0.66, RZ1 - p - 0.3], [0, 0, 0], 0.01);
      for (let k = 0; k < 4; k++)
        b.box(0.02, 0.03, 0.18, chrome, [X1 - IN - 0.63, 1.15 - k * 0.32, RZ1 - p - 0.3], null, 0);
      S(X1 - IN - 0.62, X1 - IN, RZ1 - p - 0.55, RZ1 - p - 0.05, 0, 1.33);
      // coat stand with a white coat
      b.cyl(0.2, 0.22, 0.03, black, [3.0, 0.02, -6.0], null, 12);
      b.cyl(0.02, 0.02, 1.8, black, [3.0, 0.9, -6.0], null, 8);
      rb(0.4, 0.9, 0.18, 0.06, K.mat(0xf6f6f2, 0.8), [3.0, 1.25, -5.92]);
      S(2.8, 3.2, -6.2, -5.8, 0, 1.8, true);
      // certificates over the desk
      for (let k = 0; k < 3; k++) {
        b.box(0.34, 0.26, 0.02, K.mat(0x2a2a2a, 0.5), [4.4 + k * 0.5, 1.7, RZ2 + p + 0.012], null, 0);
        b.box(0.28, 0.2, 0.005, K.mat(0xf4ecd8, 0.9), [4.4 + k * 0.5, 1.7, RZ2 + p + 0.024], null, 0);
      }
      b.label(
        0.9,
        0.22,
        card(
          'lpc_dr',
          360,
          88,
          [
            ['DR. I. JABBEM', 'bold 36px Georgia'],
            ['M.D.', '24px Georgia']
          ],
          '#f4ecd8',
          '#2a2a2a'
        ),
        [CX + p + 0.012, 1.95, -3.75],
        [0, PI / 2, 0]
      );
      b.box(2.0, 0.01, 1.3, K.mat(0x7a2a2a, 0.95), [5.0, 0.05, -4.9], null, 0);
    }

    /* ---------- accessible toilet: WC, grab rails, basin, mirror, dryer, baby change, pull cord ---------- */
    {
      const wx = X1 - IN - 0.38,
        wz = -8.0;
      b.box(0.18, 0.4, 0.4, por, [X1 - IN - 0.1, 0.95, wz], null, 0.03); // cistern
      b.cyl(0.19, 0.15, 0.4, por, [wx, 0.2, wz], null, 14);
      b.cyl(0.2, 0.2, 0.03, K.mat(0xf8f8f8, 0.3), [wx - 0.02, 0.42, wz], null, 14);
      S(wx - 0.25, X1 - IN, wz - 0.22, wz + 0.22, 0, 1.15, true);
      // grab rails: wall rail on the back wall, a fold-down rail beside the WC
      b.cyl(0.02, 0.02, 0.8, chrome, [X1 - IN - 0.5, 0.85, Z0 + IN + 0.06], [0, 0, PI / 2], 8);
      b.cyl(0.02, 0.02, 0.7, chrome, [X1 - IN - 0.4, 0.8, wz + 0.42], [0, 0, PI / 2], 8);
      b.cyl(0.02, 0.02, 0.7, chrome, [X1 - IN - 0.4, 0.8, wz - 0.42], [0, 0, PI / 2], 8);
      // basin on the back wall, mirror over it
      b.box(0.5, 0.15, 0.4, por, [5.4, 0.82, Z0 + IN + 0.22], null, 0.04);
      b.cyl(0.015, 0.015, 0.2, chrome, [5.4, 0.98, Z0 + IN + 0.06], null, 8);
      b.box(0.45, 0.6, 0.02, K.mat(0xd8e6ee, 0.05, 0.95), [5.4, 1.5, Z0 + IN + 0.012], null, 0);
      S(5.15, 5.65, Z0 + IN, Z0 + IN + 0.42, 0, 0.95, true);
      // hand dryer and the folded baby change on the office wall
      b.box(0.25, 0.3, 0.18, K.mat(0xe8e8e4, 0.4, 0.3), [4.2, 1.2, RZ2 - p - 0.1], null, 0.03);
      b.box(0.85, 0.55, 0.1, K.mat(0xd8dcdc, 0.5), [6.3, 1.3, RZ2 - p - 0.06], null, 0.02);
      // red emergency pull cord
      b.cyl(0.004, 0.004, 2.0, K.mat(0xd82020, 0.5), [X1 - IN - 0.9, RC - 1.0, -7.4], null, 4);
      b.box(0.05, 0.05, 0.05, K.mat(0xd82020, 0.5), [X1 - IN - 0.9, 0.9, -7.4], null, 0.01);
      b.cyl(0.14, 0.12, 0.3, K.mat(0xe8e8e4, 0.5), [X1 - IN - 0.3, 0.15, Z0 + IN + 0.3], null, 12); // sanitary bin
      b.box(0.45, 0.2, 0.02, K.mat(0x2a5aa8, 0.6), [CX + p + 0.012, 1.7, -8.6], [0, PI / 2, 0], 0); // wheelchair sign
    }

    /* ---------- dressing: scattered papers, a dropped clipboard, spilled pills, used swabs, smears ---------- */
    {
      const pap = K.mat(0xf4f4ee, 0.9);
      for (const [x, z, n] of [
        [-2.4, 3.6, 5],
        [1.2, 4.2, 3],
        [0.2, -2.4, 4],
        [-5.0, -2.0, 3],
        [3.6, -5.6, 3]
      ])
        for (let k = 0; k < n; k++)
          b.box(
            0.21,
            0.004,
            0.29,
            pap,
            [x + (rnd() - 0.5) * 0.9, 0.05 + k * 0.001, z + (rnd() - 0.5) * 0.9],
            [0, rnd() * PI, 0],
            0
          );
      b.box(0.24, 0.012, 0.32, K.mat(0x6a4a2c, 0.7), [-0.4, 0.052, -5.2], [0, 0.7, 0], 0); // clipboard
      b.box(0.2, 0.004, 0.26, pap, [-0.4, 0.06, -5.2], [0, 0.7, 0], 0);
      for (let k = 0; k < 14; k++)
        b.cyl(
          0.012,
          0.012,
          0.008,
          K.mat([0xf4f4f0, 0xe85a3a, 0x3a7ac8][k % 3], 0.5),
          [-4.6 + (rnd() - 0.5) * 0.8, 0.05, -6.7 + (rnd() - 0.5) * 0.6],
          null,
          6
        );
      for (let k = 0; k < 5; k++)
        b.sph(0.025, K.mat(0xf6f6f2, 0.9), [-5.2 + (rnd() - 0.5) * 0.5, 0.06, -6.0 + (rnd() - 0.5) * 0.5]);
      const smear = K.paint(
        'lpc_smear',
        128,
        128,
        (c, W, H, r) => {
          c.clearRect(0, 0, W, H);
          c.fillStyle = 'rgba(90,10,8,0.75)';
          for (let i = 0; i < 9; i++) {
            c.beginPath();
            c.ellipse(
              W / 2 + (r() - 0.5) * 60,
              H / 2 + (r() - 0.5) * 60,
              8 + r() * 22,
              5 + r() * 12,
              r() * PI,
              0,
              PI * 2
            );
            c.fill();
          }
        },
        {alpha: true}
      );
      for (const [x, z, s] of [
        [0.3, -6.4, 1.0],
        [-1.0, 5.4, 0.8],
        [-5.8, -6.0, 0.7]
      ])
        b.add(K.planeGeo(s, s), smear, {p: [x, 0.048, z], r: [-PI / 2, 0, rnd() * PI]});
      // a knocked-over visitor chair in the waiting room
      b.push([-1.4, 0, 3.1], [0, 0.8, PI / 2]);
      rb(0.46, 0.05, 0.44, 0.02, tealM, [0.24, 0, 0]);
      rb(0.44, 0.38, 0.04, 0.02, tealM, [0.47, -0.2, -0.22]);
      for (const cz of [-0.2, 0.2]) b.cyl(0.012, 0.012, 0.45, chrome, [0.0, 0.2, cz], [0, 0, PI / 2], 6);
      b.pop();
      S(-1.75, -1.05, 2.75, 3.45, 0, 0.5, true);
    }

    /* ---------- sidewalk: street lights, meter, hydrant, no parking ---------- */
    LK.lightPole(b, S, -5.4);
    LK.lightPole(b, S, 5.4);
    LK.hydrant(b, S, 7.6);
    LK.meter(b, S, -2.8);
    LK.noParking(b, 2.8, {key: 'lpc_np1'});

    return (CACHE = G.done());
  }

  function bLittlePrick(x, z, t) {
    const B = mk(x, z, 20, 36, H, 0xb4553a, 0x1d6a5c, 0x34383c);
    B.dx = 0;
    const PT = {th: 0.15, c: 0xe8e2d6};
    const cp = a => a.map(o => Object.assign({}, o));
    WL(B, 1, Z1, X0, X1, cp(FRONT), H);
    WL(B, 1, Z0, X0, X1, cp(BACKD), H);
    WL(B, 0, X0, Z0, Z1, cp(LEFT), H);
    WL(B, 0, X1, Z0, Z1, cp(RIGHT), H);
    WL(B, 1, PZ, X0, X1, cp(PART), H, PT); // waiting room / clinic
    WL(B, 0, -CX, Z0, PZ, cp(CORL), H, PT); // corridor, left side
    WL(B, 0, CX, Z0, PZ, cp(CORR), H, PT); // corridor, right side
    WL(B, 1, LZ, X0, -CX, [], H, PT); // consult 1 / treatment
    WL(B, 1, RZ1, CX, X1, [], H, PT); // consult 2 / office
    WL(B, 1, RZ2, CX, X1, [], H, PT); // office / toilet
    LK.attach(B, build());
    // shade trees in the grass strip
    for (const tx of [-8.4, 8.4])
      try {
        bldTree(B, tx, 15.2, 0.85);
      } catch (e) {}
    // the doctor's hatchback in the staff yard (nose to the building)
    try {
      if (window.MFZV) {
        const vx = 5.2,
          vz = -14.2;
        const g = MFZV.make('hatchback', WX(B, vx), WZ(B, vz), PI + (B.cs < 0 ? PI : 0), {dust: true});
        const h = g && g.userData && g.userData.half;
        const hx = h ? h[0] : 0.9,
          hz = h ? h[1] : 2.1;
        B.occ.push([vx - hx, vx + hx, vz - hz, vz + hz]);
      }
    } catch (e) {}
    const SP = LK.spawner(B, 'clinic');
    // reception: patient records shelf, a box of pills behind the screen
    SP(X0 + 0.33, 2.4, 'bookshelf', 'lpc_front', PI / 2);
    SP(-6.9, 4.45, 'pill_box', 'lpc_front', 0.2, 1.12);
    // consulting rooms: desks and medical cabinets (core 'clinic')
    SP(-4.6, PZ - 0.5, 'desk_office', 'clinic', PI);
    SP(-5.2, LZ + 0.275, 'medicine_cabinet', 'clinic', 0);
    SP(4.6, PZ - 0.5, 'desk_office', 'clinic', PI);
    SP(5.0, RZ1 + 0.275, 'medicine_cabinet', 'clinic', 0);
    // jab room: drugs cabinet, the vaccine fridge, a box of pills on the worktop
    SP(-4.4, LZ - 0.275, 'medicine_cabinet', 'lpc_rx', PI);
    SP(-2.2, Z0 + 0.52, 'fridge_modern', 'lpc_rx', 0);
    SP(-3.45, LZ - 0.355, 'pill_box', 'lpc_rx', 0.3, 0.89);
    // doctor's office: desk and bookshelf; toilet cabinet
    SP(5.0, RZ2 + 0.475, 'desk_office', 'lpc_office', 0);
    SP(4.0, RZ1 - 0.245, 'bookshelf', 'lpc_office', PI);
    SP(3.4, Z0 + 0.36, 'medicine_cabinet', 'lpc_wc', 0);
    // yard: the dumpster
    SP(-4.5, -12.6, 'dumpster_blue', 'storage', PI);
    return LK.finish(B, t, {
      at: [(X0 + X1) / 2, (Z0 + Z1) / 2],
      w: X1 - X0,
      d: Z1 - Z0,
      loot: ['clinic', [-2.8, -1.4, 4.0, 6.4], 1],
      zombies: [
        [-1.8, 6.0],
        [3.5, 3.0],
        [-6.0, 7.4],
        [0, -3.0],
        [-4.5, -1.5],
        [-4.5, -6.5],
        [4.5, -1.0],
        [3.2, -4.6],
        [3.0, -13.5],
        [-1.0, -12.0]
      ]
    });
  }

  const e = LK.register({
    id: 'piety_medical_clinic',
    name: 'Little Prick Clinic',
    build: bLittlePrick,
    note: 'half-plot walk-in clinic: waiting area with reception and secretary area, two consulting rooms, a treatment (jab) room, the doctor’s office and an accessible toilet off a corridor; staff yard behind',
    globals: {bLittlePrick, LITTLEPRICK: {build}}
  });
  if (e) e.loot = 'clinic';
  console.log('[littleprick] Little Prick Clinic ready');
})();
