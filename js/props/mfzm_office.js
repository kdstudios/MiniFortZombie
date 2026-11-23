/* MINI FORT ZOMBIE - PROPS 3/4: office + furniture + tools + fire station + shop counters (desks, dresser, coffee tables, podium,
   medicine cabinet, pill box, firefighter locker, hose cabinet, coiled hose, toolbox, tool chest, workbench, jerry can, propane cylinder,
   hay bale, yard-sale table, shop counter, reception counter). Original models + artwork. */
(function () {
  'use strict';
  const K = window.MFZK,
    P = K.P,
    PI = Math.PI,
    T = THREE;
  if (!K) return;

  /* ===== paper, screens, small desk things ===== */
  const paperM = K.paint(
    'paper',
    256,
    330,
    (c, W, H, r) => {
      c.fillStyle = '#f6f4ec';
      c.fillRect(0, 0, W, H);
      c.fillStyle = '#333';
      c.font = "bold 18px 'MFZ Type',serif";
      c.fillText('MEMORANDUM', 20, 34);
      c.fillStyle = '#555';
      for (let i = 0; i < 16; i++) c.fillRect(20, 60 + i * 15, (W - 40) * (0.5 + r() * 0.5), 3);
      c.fillStyle = 'rgba(120,70,30,.25)';
      c.beginPath();
      c.arc(W * 0.7, H * 0.75, 34, 0, PI * 2);
      c.lineWidth = 6;
      c.strokeStyle = 'rgba(120,70,30,.3)';
      c.stroke();
    },
    {r: 0.9}
  );
  const folderM = K.paint(
    'folder',
    256,
    200,
    (c, W, H, r) => {
      c.fillStyle = '#d8b878';
      c.fillRect(0, 0, W, H);
      c.fillStyle = '#c8a868';
      c.fillRect(0, 0, W, 24);
      P.text(c, 'CASE FILE 0419', W / 2, H * 0.5, {size: 22, col: '#5a2a1a', font: "'MFZ Type',serif"});
      c.fillStyle = '#b0221a';
      c.fillRect(W * 0.6, H * 0.68, 80, 26);
      P.text(c, 'CONFIDENTIAL', W * 0.6 + 40, H * 0.68 + 13, {size: 11, col: '#fff'});
      P.grime(c, W, H, r, 0.4);
    },
    {r: 0.85}
  );
  const screenM = K.paint(
    'crt',
    256,
    200,
    (c, W, H, r) => {
      c.fillStyle = '#061208';
      c.fillRect(0, 0, W, H);
      c.fillStyle = '#3aff6a';
      c.font = "14px 'MFZ Mono',monospace";
      [
        'C:\\> DIR',
        'EMERGENCY.TXT   2,048',
        'ROSTER.XLS      9,216',
        'EVAC_ROUTE.DOC  4,610',
        '',
        'C:\\> TYPE EMERGENCY.TXT',
        'STAY INDOORS. DO NOT',
        'APPROACH THE INFECTED.',
        '_'
      ].forEach((s, i) => c.fillText(s, 12, 22 + i * 19));
      for (let y = 0; y < H; y += 3) {
        c.fillStyle = 'rgba(0,0,0,.25)';
        c.fillRect(0, y, W, 1);
      }
    },
    {glow: 0.9, r: 0.2}
  );
  function pcSet(b, x, z, ry, y) {
    b.push([x, y === undefined ? 0.755 : y, z], [0, ry, 0]);
    const beige = K.mat(0xd8d0bc, 0.5);
    b.rbox(0.36, 0.32, 0.36, 0.02, beige, [0, 0.16, 0]);
    b.label(0.27, 0.21, screenM, [0, 0.17, 0.181]);
    b.frame(0.31, 0.25, 0.02, beige, [0, 0.17, 0.182], 0.01);
    b.rbox(0.2, 0.03, 0.16, 0.01, beige, [0, 0.015, -0.02]); // CRT
    b.rbox(0.44, 0.025, 0.16, 0.006, beige, [0, 0.0125, 0.32]);
    for (let i = 0; i < 4; i++)
      for (let k = 0; k < 12; k++)
        b.box(0.026, 0.008, 0.026, K.mat(0xc8c0ac, 0.6), [-0.17 + k * 0.031, 0.03, 0.27 + i * 0.031]); // keyboard
    b.tube(
      [
        [0, 0.02, 0.24],
        [0.05, 0.0, 0.12],
        [0, 0.0, 0],
        [-0.05, 0.02, -0.15]
      ],
      0.004,
      K.mat(0x2a2a2a, 0.5),
      20,
      6
    );
    b.rbox(0.06, 0.025, 0.1, 0.02, beige, [0.32, 0.0125, 0.32]);
    b.pop();
  }
  function lamp(b, x, z) {
    b.push([0, 0.755, 0]);
    const g = K.mat(0x2a5a3a, 0.3, 0.2),
      br = K.mat(0xb08a3a, 0.35, 0.9);
    b.cyl(0.06, 0.07, 0.02, br, [x, 0.01, z], null, 18);
    b.cyl(0.008, 0.008, 0.3, br, [x, 0.16, z], null, 8);
    b.add(new T.CylinderGeometry(0.06, 0.1, 0.1, 20, 1, true), g, {p: [x, 0.33, z + 0.05], r: [0.5, 0, 0]});
    b.sph(0.025, K.mat(0xfff6d8, 0.2, 0, {emissive: 0xffe8b0, emissiveIntensity: 0.5}), [x, 0.31, z + 0.06]);
    b.pop();
  }
  function mug(b, x, y, z, col) {
    b.cyl(0.04, 0.035, 0.1, K.mat(col || 0xf4f1e8, 0.4), [x, y + 0.05, z], null, 16);
    b.tor(0.03, 0.008, K.mat(col || 0xf4f1e8, 0.4), [x + 0.045, y + 0.05, z], [0, 0, PI / 2], PI * 1.2);
  }
  function paperStack(b, x, y, z, n, ry) {
    for (let i = 0; i < n; i++)
      b.add(K.planeGeo(0.21, 0.297), paperM, {
        p: [x + (b.rnd() - 0.5) * 0.02, y + 0.002 + i * 0.003, z],
        r: [-PI / 2, 0, ry + (b.rnd() - 0.5) * 0.3]
      });
  }

  /* ===== desks ===== */
  function desk(b, W, D, wood, o) {
    o = o || {};
    const H = 0.76,
      top = 0.035;
    b.rbox(W, top, D, 0.008, wood, [0, H - top / 2, 0]);
    // pedestals with drawers (left: 3 drawers, right: file drawer + small) and modesty panel
    const pw = 0.42;
    for (const sd of o.oneSide ? [1] : [-1, 1]) {
      const x = sd * (W / 2 - pw / 2);
      b.box(pw, H - top - 0.02, D - 0.02, wood, [x, (H - top) / 2, 0]);
      const n = sd < 0 ? 3 : 2;
      for (let i = 0; i < n; i++) {
        const h = (H - top - 0.06) / n;
        b.rbox(pw - 0.02, h - 0.012, 0.02, 0.004, wood, [x, 0.03 + h * (i + 0.5), D / 2]);
        b.pull(0.11, o.hw || K.mat(0xb08a3a, 0.35, 0.9), [x, 0.03 + h * (i + 0.5) + h * 0.22, D / 2 + 0.01]);
      }
    }
    b.box(W - (o.oneSide ? pw : 2 * pw), 0.45, 0.018, wood, [o.oneSide ? -pw / 2 : 0, H - top - 0.25, -D / 2 + 0.06]);
    // centre drawer
    b.rbox(W - 2 * pw - 0.04, 0.07, 0.02, 0.004, wood, [o.oneSide ? -pw / 2 : 0, H - top - 0.05, D / 2 - 0.01]);
  }
  K.def(
    'desk_teacher',
    {
      label: 'Desk',
      table: 'office',
      items: [1, 3],
      auto: ['office', 'townhall', 'school', 'bank', 'library', 'motel', 'funeral', 'vet', 'clinic']
    },
    b => {
      const wood = K.veneer(0x7a5232);
      desk(b, 1.5, 0.75, wood);
      b.box(1.3, 0.003, 0.55, K.surf('linge', 0x2a4a2a), [0, 0.762, 0]); // green blotter
      lamp(b, -0.55, -0.2);
      paperStack(b, 0.2, 0.76, 0.05, 6, 0.1);
      mug(b, 0.5, 0.76, -0.15, 0xc8302a);
      b.box(0.18, 0.04, 0.12, K.veneer(0x4a3020), [-0.15, 0.78, -0.22]);
      for (let i = 0; i < 3; i++)
        b.cyl(
          0.004,
          0.004,
          0.14,
          K.mat([0xd8302a, 0x2a4ad8, 0x1a1a1a][i], 0.5),
          [-0.2 + i * 0.02, 0.83, -0.22],
          [0.3, 0, (i - 1) * 0.2],
          6
        );
      b.sph(0.07, K.mat(0xc8402a, 0.4), [0.6, 0.83, 0.15]);
      b.cyl(0.004, 0.004, 0.03, K.surf('wood', 0x5a3a1a), [0.6, 0.9, 0.15], null, 6);
    }
  ); // an apple
  K.def(
    'desk_cluttered',
    {label: 'Desk', table: 'office', items: [1, 3], auto: ['office', 'townhall', 'school', 'bank', 'library']},
    b => {
      const wood = K.veneer(0x5a3c26);
      desk(b, 1.5, 0.75, wood);
      pcSet(b, -0.25, -0.12, 0.15);
      paperStack(b, 0.45, 0.76, 0.05, 14, 0.4);
      b.add(K.planeGeo(0.24, 0.32), folderM, {p: [0.48, 0.806, 0.05], r: [-PI / 2, 0, 0.3]});
      mug(b, 0.2, 0.76, 0.25);
      // spilled pen pot, phone with coiled cord, sticky notes
      const ph = K.mat(0x2a2a2a, 0.45);
      b.rbox(0.2, 0.06, 0.18, 0.02, ph, [0.55, 0.79, -0.22]);
      b.rbox(0.2, 0.04, 0.06, 0.02, ph, [0.55, 0.84, -0.24], [0, 0, 0.08]);
      b.tube(
        [
          [0.47, 0.8, -0.2],
          [0.4, 0.78, -0.1],
          [0.42, 0.77, 0],
          [0.35, 0.77, 0.05]
        ],
        0.004,
        ph,
        30,
        6
      );
      for (let i = 0; i < 3; i++)
        b.add(K.planeGeo(0.07, 0.07), K.mat([0xfff69a, 0xffb0d0, 0xa8f0ff][i], 0.8), {
          p: [-0.6 + i * 0.08, 0.762, 0.25],
          r: [-PI / 2, 0, i * 0.3]
        });
    }
  );
  K.def(
    'desk_office',
    {label: 'Office desk', table: 'office', items: [1, 3], auto: ['office', 'townhall', 'bank', 'community']},
    b => {
      // modern laminate desk on steel legs + side return with cabinet, monitor, chair
      const lam = K.veneer(0xc8b494, {fig: false, tile: 1.2}),
        st = K.paintSteel(0x4a4c50, {m: 0.5}),
        W = 1.6,
        D = 0.8;
      b.rbox(W, 0.03, D, 0.004, lam, [0, 0.735, 0]);
      for (const x of [-W / 2 + 0.05, W / 2 - 0.05]) {
        b.box(0.05, 0.7, 0.05, st, [x, 0.36, -D / 2 + 0.06]);
        b.box(0.05, 0.7, 0.05, st, [x, 0.36, D / 2 - 0.1]);
        b.box(0.05, 0.04, D - 0.1, st, [x, 0.03, -0.02]);
      }
      b.box(W - 0.1, 0.3, 0.015, st, [0, 0.5, -D / 2 + 0.07]);
      b.rbox(0.42, 0.6, 0.55, 0.006, st, [W / 2 - 0.3, 0.3, -0.05]);
      for (let i = 0; i < 3; i++) {
        b.rbox(0.4, 0.18, 0.02, 0.004, K.mat(0x5a5c60, 0.4, 0.6), [W / 2 - 0.3, 0.1 + i * 0.19, 0.23]);
        b.pull(0.12, K.chrome(), [W / 2 - 0.3, 0.16 + i * 0.19, 0.245]);
      }
      // flat monitor + keyboard + mouse + desk phone + binder
      const blk = K.blackPlastic();
      b.rbox(0.56, 0.34, 0.03, 0.01, blk, [-0.15, 1.02, -0.2]);
      b.label(
        0.52,
        0.3,
        K.paint(
          'lcd',
          512,
          300,
          (c, W, H, r) => {
            const g = c.createLinearGradient(0, 0, W, H);
            g.addColorStop(0, '#1a3a6a');
            g.addColorStop(1, '#0a1a2a');
            c.fillStyle = g;
            c.fillRect(0, 0, W, H);
            c.fillStyle = '#e8402a';
            c.fillRect(30, 40, W - 60, 50);
            P.text(c, 'EMERGENCY BROADCAST', W / 2, 65, {size: 28, col: '#fff'});
            c.fillStyle = '#ddd';
            for (let i = 0; i < 7; i++) c.fillRect(30, 120 + i * 22, (W - 60) * (0.4 + r() * 0.6), 8);
          },
          {glow: 0.7, r: 0.15}
        ),
        [-0.15, 1.02, -0.184]
      );
      b.cyl(0.012, 0.012, 0.16, blk, [-0.15, 0.82, -0.22], null, 8);
      b.rbox(0.22, 0.012, 0.16, 0.004, blk, [-0.15, 0.756, -0.22]);
      b.rbox(0.42, 0.02, 0.14, 0.006, blk, [-0.15, 0.76, 0.12]);
      b.rbox(0.06, 0.02, 0.1, 0.03, blk, [0.18, 0.76, 0.14]);
      b.rbox(0.28, 0.05, 0.35, 0.008, K.mat(0x2a4a8a, 0.5), [0.5, 0.775, 0.1], [0, 0.2, 0]);
      paperStack(b, 0.45, 0.75, -0.15, 8, -0.2);
      mug(b, -0.6, 0.75, 0.1, 0x2a6ad8);
      // office chair, pushed back and turned
      b.push([-0.1, 0, 0.75], [0, 0.6, 0]);
      const cs = K.surf('laine', 0x2a2c34);
      b.rbox(0.48, 0.08, 0.46, 0.03, cs, [0, 0.48, 0]);
      b.rbox(0.46, 0.55, 0.07, 0.03, cs, [0, 0.82, -0.22], [-0.12, 0, 0]);
      b.cyl(0.025, 0.025, 0.36, K.chrome(), [0, 0.28, 0], null, 10);
      for (let i = 0; i < 5; i++) {
        const a = (i * PI * 2) / 5;
        b.box(0.3, 0.03, 0.04, blk, [Math.cos(a) * 0.15, 0.07, Math.sin(a) * 0.15], [0, -a, 0]);
        b.sph(0.025, blk, [Math.cos(a) * 0.3, 0.03, Math.sin(a) * 0.3]);
      }
      b.pop();
      b.col(-W / 2, 0, -D / 2, W / 2, 0.76, D / 2);
    }
  );

  K.def(
    'desk_steel',
    {
      label: 'Steel office desk',
      table: 'office',
      items: [1, 3],
      auto: ['office', 'townhall', 'school', 'bank', 'fire', 'utility']
    },
    b => {
      const st = K.paintSteel(0x8a9096, {m: 0.45, worn: true}),
        top = K.mat(0x5a6a5a, 0.55),
        W = 1.5,
        D = 0.76,
        H = 0.76,
        ch = K.chrome();
      // 1960s tanker desk: grey steel pedestals, green linoleum top with an aluminium edge band, chrome pulls, a typewriter and an in-tray
      desk(b, W, D, st, {hw: ch});
      b.rbox(W + 0.02, 0.012, D + 0.02, 0.003, top, [0, H + 0.006, 0]);
      b.box(W + 0.03, 0.03, 0.01, K.mat(0xb8bcc0, 0.35, 0.9), [0, H - 0.005, D / 2 + 0.012]);
      b.box(W + 0.03, 0.03, 0.01, K.mat(0xb8bcc0, 0.35, 0.9), [0, H - 0.005, -D / 2 - 0.012]);
      b.push([-0.2, H + 0.012, -0.02]);
      const tw = K.mat(0x2a2c2a, 0.4, 0.3);
      b.rbox(0.42, 0.1, 0.34, 0.03, tw, [0, 0.05, 0]);
      b.add(K.rboxGeo(0.42, 0.08, 0.14, 0.02, 2), tw, {p: [0, 0.12, -0.1], r: [0.3, 0, 0]});
      b.cyl(0.025, 0.025, 0.48, K.blackPlastic(), [0, 0.17, -0.12], [0, 0, PI / 2], 12);
      for (let r = 0; r < 4; r++)
        for (let i = 0; i < 10; i++)
          b.cyl(
            0.009,
            0.009,
            0.012,
            K.mat(0xe8e2d6, 0.4),
            [-0.15 + i * 0.033 + r * 0.008, 0.105 + r * 0.012, 0.06 + r * -0.03],
            null,
            8
          );
      b.box(0.2, 0.26, 0.002, K.mat(0xfbf8ee, 0.8), [0, 0.3, -0.13], [-0.25, 0, 0]);
      b.pop();
      b.box(0.3, 0.06, 0.24, K.mat(0x6a5a3a, 0.6), [0.45, H + 0.04, -0.15]);
      paperStack(b, 0.45, H + 0.04, -0.15, 8, 0);
      mug(b, 0.62, H + 0.012, 0.15, 0x3a3a3a);
      b.col(-W / 2, 0, -D / 2, W / 2, H + 0.02, D / 2);
    }
  );

  /* ===== dresser ===== */
  K.def('dresser', {label: 'Dresser', table: 'house', items: [1, 3], auto: ['house', 'motel', 'clothing']}, b => {
    const W = 1.1,
      H = 0.86,
      D = 0.5,
      wood = K.veneer(0x6a4a2e),
      br = K.mat(0xb08a3a, 0.3, 0.95);
    b.rbox(W, H - 0.1, D - 0.02, 0.01, wood, [0, 0.1 + (H - 0.1) / 2, -0.01]);
    b.rbox(W + 0.04, 0.035, D + 0.03, 0.012, wood, [0, H + 0.0175, 0]);
    for (const x of [-W / 2 + 0.04, W / 2 - 0.04])
      for (const z of [-D / 2 + 0.04, D / 2 - 0.06])
        b.lathe(
          [
            [0, 0],
            [0.03, 0],
            [0.035, 0.03],
            [0.022, 0.06],
            [0.03, 0.09],
            [0, 0.1]
          ],
          wood,
          [x, 0, z],
          12
        ); // turned feet
    const rows = [
      [0.18, 2],
      [0.18, 1],
      [0.2, 1],
      [0.2, 1]
    ];
    let y = 0.12;
    for (const [h, n] of rows) {
      for (let i = 0; i < n; i++) {
        const w = (W - 0.04) / n,
          x = -W / 2 + 0.02 + w * (i + 0.5);
        b.rbox(w - 0.012, h - 0.012, 0.022, 0.006, wood, [x, y + h / 2, D / 2 - 0.01]);
        b.frame(w - 0.06, h - 0.05, 0.02, wood, [x, y + h / 2, D / 2 + 0.002], 0.006);
        for (const dx of n === 1 ? [-w * 0.28, w * 0.28] : [0]) {
          b.cyl(0.02, 0.02, 0.008, br, [x + dx, y + h / 2, D / 2 + 0.012], [PI / 2, 0, 0], 14);
          b.tor(0.022, 0.004, br, [x + dx, y + h / 2 - 0.018, D / 2 + 0.016], [PI * 0.15, 0, 0], PI, 12);
        }
      }
      y += h;
    }
    // top: mirror tray, perfume bottles, jewellery box, a photo frame face down
    b.rbox(0.28, 0.012, 0.18, 0.005, K.chrome(), [-0.25, H + 0.04, -0.02]);
    for (let i = 0; i < 3; i++)
      b.lathe(
        [
          [0, 0],
          [0.025, 0],
          [0.028, 0.05],
          [0.012, 0.07],
          [0.008, 0.09],
          [0, 0.09]
        ],
        K.glass([0xe8b0c0, 0xb0d0e8, 0xf0e0a0][i], 0.55),
        [-0.33 + i * 0.08, H + 0.046, -0.02],
        14
      );
    b.rbox(0.18, 0.08, 0.12, 0.01, K.surf('laine', 0x6a1a2a), [0.3, H + 0.075, -0.05]);
    b.rbox(0.16, 0.012, 0.12, 0.004, K.mat(0x3a2a1a, 0.4), [0.05, H + 0.042, 0.1], [0, 0.3, 0]);
  });

  /* ===== coffee tables ===== */
  K.def('coffee_table', {label: 'Coffee table', table: 'house', items: [1, 2], auto: ['house', 'motel']}, b => {
    const wood = K.veneer(0x5a3a22),
      W = 1.2,
      D = 0.6,
      H = 0.45;
    b.rbox(W, 0.04, D, 0.012, wood, [0, H - 0.02, 0]);
    b.box(W - 0.12, 0.02, D - 0.12, wood, [0, 0.12, 0]);
    for (const x of [-W / 2 + 0.05, W / 2 - 0.05])
      for (const z of [-D / 2 + 0.05, D / 2 - 0.05])
        b.lathe(
          [
            [0, 0],
            [0.022, 0],
            [0.026, 0.08],
            [0.018, 0.2],
            [0.026, 0.38],
            [0.03, 0.43],
            [0, 0.43]
          ],
          wood,
          [x, 0, z],
          12
        );
    b.box(W - 0.1, 0.07, 0.018, wood, [0, H - 0.07, D / 2 - 0.04]);
    b.box(W - 0.1, 0.07, 0.018, wood, [0, H - 0.07, -D / 2 + 0.04]);
    // magazines on the shelf, remote, a bowl, coasters
    const mags = ['#c8302a', '#2a6ad8', '#f2c12e'];
    mags.forEach((col, i) =>
      b.add(
        K.planeGeo(0.22, 0.3),
        K.paint(
          'mag' + i,
          220,
          300,
          (c, W, H, r) => {
            c.fillStyle = col;
            c.fillRect(0, 0, W, H);
            P.text(c, ['LIFE & HOME', 'SPORTS WEEK', 'AUTO TODAY'][i], W / 2, 30, {
              size: 30,
              col: '#fff',
              max: W * 0.9
            });
            c.fillStyle = 'rgba(255,255,255,.4)';
            c.fillRect(20, 60, W - 40, H * 0.55);
            P.text(c, 'SPECIAL ISSUE', W / 2, H * 0.85, {size: 20, col: '#fff'});
          },
          {r: 0.4}
        ),
        {p: [-0.3 + i * 0.05, 0.132 + i * 0.003, 0], r: [-PI / 2, 0, 0.3 - i * 0.25]}
      )
    );
    b.rbox(0.05, 0.02, 0.17, 0.01, K.blackPlastic(), [0.3, H + 0.01, 0.1], [0, 0.5, 0]);
    b.lathe(
      [
        [0, 0],
        [0.05, 0],
        [0.11, 0.06],
        [0.12, 0.07],
        [0, 0.03]
      ],
      K.mat(0x2a6a8a, 0.25),
      [0.0, H, -0.08],
      24
    );
    for (let i = 0; i < 3; i++)
      b.sph(0.03, K.mat([0xc8402a, 0xf2c12e, 0x3aa86a][i], 0.4), [(i - 1) * 0.04, H + 0.05, -0.08]);
  });
  K.def(
    'coffee_table_round',
    {label: 'Round coffee table', table: 'house', items: [1, 2], auto: ['house', 'motel', 'community']},
    b => {
      const wood = K.veneer(0x8a5a32),
        gl = K.glass(0xd8f0e8, 0.3);
      b.cyl(0.48, 0.48, 0.012, gl, [0, 0.46, 0], null, 40);
      b.tor(0.48, 0.012, K.mat(0xb08a3a, 0.35, 0.9), [0, 0.46, 0], [PI / 2, 0, 0], null, 48);
      b.cyl(0.3, 0.3, 0.03, wood, [0, 0.12, 0], null, 32);
      for (let i = 0; i < 3; i++) {
        const a = (i * PI * 2) / 3;
        b.tube(
          [
            [Math.cos(a) * 0.32, 0, Math.sin(a) * 0.32],
            [Math.cos(a) * 0.36, 0.2, Math.sin(a) * 0.36],
            [Math.cos(a) * 0.42, 0.45, Math.sin(a) * 0.42]
          ],
          0.018,
          wood,
          16,
          10
        );
      }
      b.lathe(
        [
          [0, 0],
          [0.04, 0],
          [0.06, 0.12],
          [0.03, 0.22],
          [0.035, 0.26],
          [0, 0.26]
        ],
        K.glass(0x6a9a8a, 0.6),
        [0.15, 0.47, 0.1],
        18
      );
      b.cyl(0.004, 0.004, 0.2, K.mat(0x3a6a2a, 0.6), [0.15, 0.8, 0.1], null, 6);
      b.sph(0.03, K.mat(0xd83a5a, 0.5), [0.15, 0.9, 0.1]);
      b.rbox(0.25, 0.04, 0.18, 0.01, K.mat(0x3a2a6a, 0.6), [-0.2, 0.49, -0.05], [0, 0.4, 0]);
    }
  );

  /* ===== church podium (lectern) ===== */
  K.def(
    'church_podium',
    {label: 'Lectern', table: 'church', items: [1, 2], auto: ['church', 'funeral', 'community', 'school']},
    b => {
      const wood = K.veneer(0x4a2c18),
        gold = K.mat(0xc8a040, 0.3, 0.95);
      b.rbox(0.7, 0.08, 0.5, 0.01, wood, [0, 0.04, 0]);
      b.lathe(
        [
          [0, 0],
          [0.2, 0],
          [0.2, 0.06],
          [0.14, 0.12],
          [0.12, 0.9],
          [0.16, 0.96],
          [0.22, 1.0],
          [0, 1.0]
        ].map(p => [p[0] * 0.9, p[1]]),
        wood,
        [0, 0.08, 0],
        8
      ); // octagonal turned column
      b.add(K.rboxGeo(0.64, 0.05, 0.46, 0.01, 2), wood, {p: [0, 1.15, 0], r: [-0.35, 0, 0]});
      b.box(0.6, 0.03, 0.03, wood, [0, 1.06, 0.21], [-0.35, 0, 0]);
      b.label(
        0.24,
        0.24,
        K.paint(
          'cross',
          256,
          256,
          (c, W, H) => {
            c.clearRect(0, 0, W, H);
            c.fillStyle = '#c8a040';
            c.fillRect(W * 0.43, W * 0.1, W * 0.14, H * 0.8);
            c.fillRect(W * 0.2, H * 0.3, W * 0.6, H * 0.13);
            c.strokeStyle = '#7a5a1a';
            c.lineWidth = 3;
            c.strokeRect(W * 0.43, W * 0.1, W * 0.14, H * 0.8);
          },
          {alpha: true, m: 0.9, r: 0.3}
        ),
        [0, 0.55, 0.165]
      );
      // open bible with ribbon, tea light candle
      b.push([0, 1.18, 0.02], [-0.35, 0, 0]);
      for (const sd of [-1, 1]) {
        b.add(new T.CylinderGeometry(0.13, 0.13, 0.21, 16, 1, false, 0, PI * 0.5), K.mat(0xf6f0dc, 0.8), {
          p: [sd * 0.0, 0.04, 0],
          r: [PI / 2, sd > 0 ? 0 : PI * 0.5, 0],
          s: [1.1, 1, 0.3]
        });
      }
      b.add(
        K.planeGeo(0.36, 0.26),
        K.paint(
          'bible',
          360,
          260,
          (c, W, H, r) => {
            c.fillStyle = '#f6f0dc';
            c.fillRect(0, 0, W, H);
            c.fillStyle = '#3a2a1a';
            for (let p = 0; p < 2; p++)
              for (let i = 0; i < 18; i++) c.fillRect(20 + (p * W) / 2, 20 + i * 12, W / 2 - 40, 3);
            c.fillStyle = '#8a1a1a';
            P.text(c, 'PSALM 23', W * 0.25, 14, {size: 12, col: '#8a1a1a', font: "'MFZ Type',serif"});
            c.fillStyle = 'rgba(0,0,0,.18)';
            c.fillRect(W / 2 - 4, 0, 8, H);
          },
          {r: 0.85}
        ),
        {p: [0, 0.075, 0], r: [-PI / 2, 0, 0]}
      );
      b.box(0.01, 0.002, 0.2, K.mat(0x8a1a1a, 0.6), [0.04, 0.078, 0.08]);
      b.pop();
    }
  );

  /* ===== medicine cabinet (wall-hung, mirrored door slightly open) ===== */
  K.def(
    'medicine_cabinet',
    {label: 'Medical cabinet', table: 'clinic', items: [1, 3], auto: ['clinic', 'pharmacy', 'vet']},
    b => {
      const body = K.paintSteel(0xf2f2ee, {m: 0.2, r: 0.35}),
        ch = K.chrome(),
        W = 0.8,
        H = 1.85,
        D = 0.4,
        gl = K.glass(0xdfeef2, 0.2);
      // steel cabinet: glass-doored upper half with shelves of medicine, solid lower doors, red cross, feet
      b.box(W, H - 0.06, 0.02, body, [0, H / 2 + 0.03, -D / 2 + 0.01]);
      for (const x of [-W / 2 + 0.01, W / 2 - 0.01]) b.box(0.02, H - 0.06, D, body, [x, H / 2 + 0.03, 0]);
      b.rbox(W + 0.02, 0.03, D + 0.02, 0.008, body, [0, H - 0.015, 0]);
      b.box(W, 0.02, D, body, [0, 0.06, 0]);
      for (const x of [-W / 2 + 0.05, W / 2 - 0.05])
        for (const z of [-D / 2 + 0.05, D / 2 - 0.05]) b.cyl(0.012, 0.016, 0.06, K.chrome(), [x, 0.03, z], null, 8);
      b.box(W - 0.04, 0.02, D - 0.02, body, [0, 0.95, 0]);
      for (const sd of [-1, 1]) {
        b.rbox(W / 2 - 0.02, 0.84, 0.02, 0.006, body, [(sd * W) / 4, 0.52, D / 2 - 0.01]);
        b.handle(0.14, ch, [sd * 0.06, 0.62, D / 2], true, 0.025);
      }
      const meds = [
        [0xb07a2a, 0.6],
        [0xf4f4f0, 0.5],
        [0x2a6ad8, 0.4],
        [0xc8302a, 0.4],
        [0x3aa86a, 0.4],
        [0xe8e2d6, 0.5]
      ];
      for (let s = 0; s < 3; s++) {
        const y = 1.0 + s * 0.27;
        if (s) b.box(W - 0.04, 0.01, D - 0.06, K.glass(0xeef6f8, 0.5), [0, y - 0.02, -0.01]);
        for (let i = 0; i < 8; i++) {
          const [c] = meds[(s * 3 + i) % 6],
            h = 0.07 + ((i * 7 + s) % 3) * 0.025;
          if ((i + s) % 3 === 0)
            b.rbox(0.07, h * 0.9, 0.05, 0.004, K.mat(c, 0.5), [-W / 2 + 0.07 + i * 0.09, y + h * 0.45, -0.04]);
          else {
            b.cyl(0.022, 0.022, h, K.mat(c, 0.3), [-W / 2 + 0.07 + i * 0.09, y + h / 2, -0.04], null, 12);
            b.cyl(
              0.023,
              0.023,
              0.015,
              K.mat(0xf4f4f0, 0.5),
              [-W / 2 + 0.07 + i * 0.09, y + h + 0.007, -0.04],
              null,
              12
            );
          }
        }
      }
      for (const sd of [-1, 1]) {
        const x = (sd * W) / 4;
        b.frame(W / 2 - 0.02, 0.84, 0.04, body, [x, 1.38, D / 2 - 0.01], 0.02);
        b.plane(W / 2 - 0.08, 0.78, gl, [x, 1.38, D / 2 - 0.012]);
        b.knob(ch, [x - sd * (W / 4 - 0.05), 1.3, D / 2], 0.01);
      }
      b.label(
        0.2,
        0.2,
        K.paint(
          'redx_big',
          256,
          256,
          (c, W, H) => {
            c.clearRect(0, 0, W, H);
            c.fillStyle = '#d8201a';
            c.fillRect(W * 0.36, W * 0.08, W * 0.28, H * 0.84);
            c.fillRect(W * 0.08, H * 0.36, W * 0.84, H * 0.28);
          },
          {alpha: true}
        ),
        [0, 0.75, D / 2 + 0.002]
      );
      b.label(
        0.3,
        0.06,
        K.paint(
          'med_lbl',
          300,
          60,
          (c, W, H) => {
            c.fillStyle = '#1e5aa8';
            c.fillRect(0, 0, W, H);
            P.text(c, 'MEDICAL SUPPLIES', W / 2, H / 2, {size: 24, col: '#fff', max: W * 0.92});
          },
          {}
        ),
        [0, 1.82, D / 2 + 0.012]
      );
    }
  );
  K.def('pill_box', {label: 'Box of pills', table: 'pharmacy', items: [1, 1], auto: ['pharmacy']}, b => {
    const m = K.paint(
      'pills',
      256,
      180,
      (c, W, H, r) => {
        c.fillStyle = '#f4f4f0';
        c.fillRect(0, 0, W, H);
        c.fillStyle = '#2a6ad8';
        c.fillRect(0, 0, W, 50);
        P.text(c, 'PAINEX', W / 2, 26, {size: 34, col: '#fff'});
        P.text(c, 'EXTRA STRENGTH', W / 2, 72, {size: 18, col: '#2a6ad8'});
        c.fillStyle = '#e8402a';
        c.beginPath();
        c.ellipse(W * 0.3, H * 0.72, 24, 12, 0, 0, PI * 2);
        c.fill();
        c.fillStyle = '#f4f4f0';
        c.fillRect(W * 0.3, H * 0.72 - 12, 24, 24);
        P.text(c, '24 CAPLETS', W * 0.68, H * 0.72, {size: 18, col: '#333'});
      },
      {r: 0.4}
    );
    b.rbox(0.14, 0.1, 0.04, 0.003, K.mat(0xf4f4f0, 0.4), [0, 0.05, 0]);
    b.label(0.138, 0.098, m, [0, 0.05, 0.0205]);
    b.label(0.138, 0.098, m, [0, 0.05, -0.0205], [0, PI, 0]);
    b.rbox(0.1, 0.06, 0.03, 0.003, K.mat(0xf4f4f0, 0.4), [0.02, 0.13, 0], [0, 0.4, 0]);
  });

  /* ===== fire station ===== */
  K.def(
    'fire_locker',
    {label: 'Firefighter locker', table: 'fire', items: [1, 3], auto: ['fire', 'school', 'sporting', 'bowling']},
    b => {
      // open-front gear locker: jacket, helmet, boots, name plate
      const st = K.surf('mecha', 0x8a949c, {m: 0.5}),
        W = 0.6,
        H = 1.95,
        D = 0.5,
        tan = K.surf('canvas', 0x8a7a4a),
        refl = K.paint(
          'refl',
          256,
          32,
          (c, W, H) => {
            c.fillStyle = '#d8e030';
            c.fillRect(0, 0, W, H);
            c.fillStyle = '#c8ccd0';
            c.fillRect(0, 10, W, 12);
          },
          {r: 0.3, m: 0.3}
        );
      b.box(W, H, 0.02, st, [0, H / 2, -D / 2 + 0.01]);
      for (const x of [-W / 2 + 0.01, W / 2 - 0.01]) b.box(0.02, H, D, st, [x, H / 2, 0]);
      b.box(W, 0.02, D, st, [0, H - 0.01, 0]);
      b.box(W, 0.02, D, st, [0, 0.3, 0]);
      b.box(W, 0.02, D, st, [0, 1.6, 0]);
      for (const x of [-W / 2 + 0.012, W / 2 - 0.012])
        b.vents(8, 0.004, 0.4, K.mat(0x2a2a2a, 0.6), [x, 1.0, D / 2 - 0.1]);
      b.label(
        0.3,
        0.06,
        K.paint(
          'locker_name',
          256,
          52,
          (c, W, H) => {
            c.fillStyle = '#1a1a1a';
            c.fillRect(0, 0, W, H);
            P.text(c, 'LT. RAMIREZ  - ENG 4', W / 2, H / 2, {size: 22, col: '#fff', max: W * 0.92});
          },
          {}
        ),
        [0, 1.66, D / 2 + 0.002]
      );
      // turnout coat hung on a hook (rounded torso shape + sleeves + reflective bands)
      b.cyl(0.01, 0.01, 0.08, K.chrome(), [0, 1.52, -0.15], [PI / 2, 0, 0], 8);
      b.push([0, 1.08, -0.06]);
      b.add(K.rboxGeo(0.42, 0.7, 0.22, 0.09, 3), tan, {p: [0, 0, 0]});
      for (const y of [-0.25, 0.05]) b.add(K.planeGeo(0.43, 0.04), refl, {p: [0, y, 0.111]});
      for (const sd of [-1, 1]) {
        b.add(K.rboxGeo(0.12, 0.62, 0.12, 0.05, 2), tan, {p: [sd * 0.24, -0.02, 0], r: [0, 0, sd * 0.08]});
        b.add(K.planeGeo(0.12, 0.035), refl, {p: [sd * 0.25, -0.22, 0.061], r: [0, 0, sd * 0.08]});
      }
      b.add(K.rboxGeo(0.3, 0.12, 0.18, 0.05, 2), tan, {p: [0, 0.38, -0.02]});
      b.pop();
      // helmet on the shelf, boots + trousers on the floor
      b.push([0, 1.61, 0]);
      b.add(K.sphGeo(0.14, 20, 10, 0, PI / 2), K.mat(0x1a1a1a, 0.35), {p: [0, 0.02, 0], s: [1, 0.9, 1.1]});
      b.add(new T.CylinderGeometry(0.22, 0.24, 0.02, 24), K.mat(0x1a1a1a, 0.35), {
        p: [0, 0.015, 0.03],
        s: [1, 1, 1.25]
      });
      b.label(
        0.08,
        0.08,
        K.paint(
          'shield',
          128,
          128,
          (c, W, H) => {
            c.clearRect(0, 0, W, H);
            c.fillStyle = '#b8862a';
            c.beginPath();
            c.moveTo(64, 6);
            c.lineTo(118, 40);
            c.lineTo(100, 120);
            c.lineTo(28, 120);
            c.lineTo(10, 40);
            c.fill();
            P.text(c, '4', 64, 70, {size: 60, col: '#fff'});
          },
          {alpha: true, m: 0.6}
        ),
        [0, 0.1, 0.13],
        [-0.25, 0, 0]
      );
      b.pop();
      for (const sd of [-1, 1]) {
        b.push([sd * 0.09, 0, 0.04]);
        b.rbox(0.11, 0.36, 0.14, 0.04, K.rubber(), [0, 0.2, 0]);
        b.rbox(0.12, 0.08, 0.26, 0.04, K.rubber(), [0, 0.04, 0.05]);
        b.add(K.planeGeo(0.11, 0.03), refl, {p: [0, 0.3, 0.071]});
        b.pop();
      }
      b.add(K.rboxGeo(0.38, 0.18, 0.2, 0.08, 2), tan, {p: [0, 0.42, 0.02]});
      b.col(-W / 2, 0, -D / 2, W / 2, H, D / 2);
    }
  );
  K.def('fire_hose_cabinet', {label: 'Fire hose cabinet (wall)', table: 'fire', items: [1, 1]}, b => {
    const red = K.paintSteel(0xb0221a, {m: 0.4, worn: true}),
      y0 = 0.9;
    b.box(0.7, 0.7, 0.02, red, [0, y0 + 0.35, -0.09]);
    for (const x of [-0.34, 0.34]) b.box(0.02, 0.7, 0.2, red, [x, y0 + 0.35, 0]);
    for (const y of [0, 0.7]) b.box(0.7, 0.02, 0.2, red, [0, y0 + y, 0]);
    // hose reel inside behind the glass
    b.cyl(0.27, 0.27, 0.02, red, [0, y0 + 0.35, -0.06], [PI / 2, 0, 0], 32);
    b.tor(0.18, 0.05, K.surf('canvas', 0xc8bc9a), [0, y0 + 0.35, -0.02], null, null, 32);
    b.tor(0.12, 0.045, K.surf('canvas', 0xc8bc9a), [0, y0 + 0.35, -0.02], null, null, 28);
    b.cyl(0.06, 0.06, 0.14, K.mat(0xc8a040, 0.3, 0.9), [0, y0 + 0.35, -0.02], [PI / 2, 0, 0], 16);
    b.cyl(0.03, 0.02, 0.16, K.mat(0xc8a040, 0.3, 0.9), [0.22, y0 + 0.12, 0.0], [0, 0, -0.6], 12); // brass nozzle
    b.frame(0.66, 0.66, 0.04, K.mat(0x8a1a12, 0.4, 0.5), [0, y0 + 0.35, 0.1], 0.02);
    b.plane(0.58, 0.58, K.glass(0xffffff, 0.2), [0, y0 + 0.35, 0.095]);
    b.label(
      0.5,
      0.12,
      K.paint(
        'hose_lbl',
        512,
        120,
        (c, W, H) => {
          c.clearRect(0, 0, W, H);
          P.text(c, 'FIRE HOSE', W / 2, H * 0.4, {size: 64, col: '#fff', font: "'MFZ Head',sans-serif", ls: 6});
          P.text(c, 'BREAK GLASS IN EMERGENCY', W / 2, H * 0.85, {size: 24, col: '#fff'});
        },
        {alpha: true}
      ),
      [0, y0 + 0.6, 0.097]
    );
    b.cyl(0.012, 0.012, 0.12, K.chrome(), [0.37, y0 + 0.35, 0.08], null, 8);
    b.col(-0.35, y0, -0.1, 0.35, y0 + 0.7, 0.11);
  });
  K.def('fire_hose_coil', {label: 'Coiled fire hose', table: 'fire', items: [1, 1], auto: ['fire']}, b => {
    const can = K.surf('canvas', 0xd8ccaa),
      brass = K.mat(0xc8a040, 0.3, 0.9);
    for (let i = 0; i < 5; i++) b.tor(0.12 + i * 0.045, 0.024, can, [0, 0.025, 0], [PI / 2, 0, 0], null, 48);
    b.tor(0.14 + 5 * 0.045, 0.024, can, [0, 0.075, 0], [PI / 2, 0, 0], PI * 1.3, 40);
    b.cyl(0.04, 0.04, 0.07, brass, [0.36, 0.03, 0.1], [0, 0, PI / 2], 16);
    b.cyl(0.045, 0.045, 0.02, brass, [0.39, 0.03, 0.1], [0, 0, PI / 2], 10);
    b.cyl(0.025, 0.04, 0.16, brass, [-0.15, 0.03, 0.36], [PI / 2, 0, 0], 16);
  });

  /* ===== tools ===== */
  K.def('toolbox', {label: 'Toolbox', table: 'hardware', items: [1, 2], auto: ['hardware', 'auto', 'utility']}, b => {
    const red = K.surf('mecha', 0xc0261c, {m: 0.4}),
      ch = K.chrome(),
      W = 0.52,
      H = 0.24,
      D = 0.24;
    b.rbox(W, H * 0.62, D, 0.01, red, [0, H * 0.31, 0]);
    b.add(new T.CylinderGeometry(D / 2, D / 2, W - 0.004, 20, 1, false, 0, PI), red, {
      p: [0, H * 0.62, 0],
      r: [0, 0, PI / 2],
      s: [0.7, 1, 1]
    });
    b.box(W + 0.004, 0.012, D + 0.004, K.mat(0x8a1a12, 0.4, 0.4), [0, H * 0.62, 0]);
    for (const x of [-0.16, 0.16]) {
      b.box(0.04, 0.05, 0.01, ch, [x, H * 0.6, D / 2 + 0.006]);
      b.cyl(0.006, 0.006, 0.03, ch, [x, H * 0.62, D / 2 + 0.012], [0, 0, PI / 2], 8);
    }
    b.tube(
      [
        [-0.12, H * 0.62 + 0.08, 0],
        [-0.1, H * 0.62 + 0.14, 0],
        [0.1, H * 0.62 + 0.14, 0],
        [0.12, H * 0.62 + 0.08, 0]
      ],
      0.012,
      K.blackPlastic(),
      20,
      10
    );
    b.label(
      0.2,
      0.05,
      K.paint(
        'tb_logo',
        256,
        64,
        (c, W, H) => {
          c.clearRect(0, 0, W, H);
          P.text(c, 'IRONCLAD', W / 2, H / 2, {size: 44, col: '#e8e6de', font: "'MFZ Head',sans-serif", ls: 3});
        },
        {alpha: true}
      ),
      [0, H * 0.3, D / 2 + 0.002]
    );
    // a screwdriver + hammer lying beside it
    b.cyl(0.012, 0.012, 0.12, K.mat(0xf2c12e, 0.4), [0.35, 0.012, 0.05], [0, 0, PI / 2], 10);
    b.cyl(0.004, 0.004, 0.14, ch, [0.48, 0.012, 0.05], [0, 0, PI / 2], 8);
    b.box(0.3, 0.02, 0.025, K.surf('wood', 0x8a5a2a), [-0.35, 0.012, 0.1], [0, 0.4, 0]);
    b.box(0.04, 0.03, 0.11, K.mat(0x3a3a3a, 0.4, 0.8), [-0.48, 0.016, 0.16], [0, 0.4, 0], 0.004);
  });
  K.def(
    'tool_chest',
    {label: 'Tool chest', table: 'hardware', items: [1, 3], auto: ['hardware', 'auto', 'utility', 'fire']},
    b => {
      const red = K.surf('mecha', 0xb8231a, {m: 0.45}),
        ch = K.chrome(),
        blk = K.blackPlastic(),
        W = 0.68,
        D = 0.46;
      // rolling cabinet + top chest, ball-bearing drawers with full-width pulls, casters, side handle, stickers
      b.rbox(W, 0.82, D, 0.01, red, [0, 0.12 + 0.41, 0]);
      for (let i = 0; i < 5; i++) {
        const h = [0.12, 0.12, 0.16, 0.18, 0.2][i],
          y = 0.14 + [0, 0.13, 0.26, 0.43, 0.62][i];
        b.rbox(W - 0.03, h - 0.01, 0.02, 0.004, red, [0, y + h / 2, D / 2]);
        b.box(W - 0.08, 0.014, 0.02, ch, [0, y + h - 0.025, D / 2 + 0.016], null, 0.005);
      }
      for (const x of [-W / 2 + 0.06, W / 2 - 0.06])
        for (const z of [-D / 2 + 0.06, D / 2 - 0.06]) {
          b.box(0.06, 0.04, 0.06, ch, [x, 0.1, z]);
          b.cyl(0.045, 0.045, 0.03, K.rubber(), [x, 0.05, z], [0, 0, PI / 2], 16);
          b.cyl(0.02, 0.02, 0.04, ch, [x, 0.05, z], [0, 0, PI / 2], 8);
        }
      b.tube(
        [
          [W / 2, 0.85, -0.15],
          [W / 2 + 0.06, 0.85, -0.12],
          [W / 2 + 0.06, 0.85, 0.12],
          [W / 2, 0.85, 0.15]
        ],
        0.012,
        ch,
        16,
        8
      );
      b.rbox(W, 0.36, D - 0.04, 0.01, red, [0, 1.13, -0.02]);
      b.rbox(W, 0.06, D - 0.04, 0.01, red, [0, 1.34, -0.02]);
      for (let i = 0; i < 3; i++) {
        b.rbox(W - 0.03, 0.09, 0.02, 0.004, red, [0, 1.0 + i * 0.1, D / 2 - 0.03]);
        b.box(W - 0.08, 0.012, 0.02, ch, [0, 1.03 + i * 0.1, D / 2 - 0.014], null, 0.005);
      }
      b.label(
        0.3,
        0.08,
        K.paint(
          'tc_brand',
          300,
          80,
          (c, W, H) => {
            c.clearRect(0, 0, W, H);
            P.text(c, 'IRONCLAD PRO', W / 2, H / 2, {size: 42, col: '#f0eee6', font: "'MFZ Head',sans-serif"});
          },
          {alpha: true}
        ),
        [0, 1.32, D / 2 - 0.009]
      );
      b.label(
        0.16,
        0.16,
        K.paint(
          'tc_stk',
          200,
          200,
          (c, W, H, r) => {
            c.clearRect(0, 0, W, H);
            c.fillStyle = '#f2c12e';
            c.beginPath();
            c.arc(100, 100, 90, 0, PI * 2);
            c.fill();
            P.text(c, "GUS'S", 100, 80, {size: 40, col: '#1a1a1a'});
            P.text(c, 'GARAGE', 100, 124, {size: 30, col: '#1a1a1a'});
            P.grime(c, W, H, r, 0.5);
          },
          {alpha: true}
        ),
        [W / 2 + 0.001, 0.6, 0],
        [0, PI / 2, 0]
      );
      // wrenches and a rag on top
      for (let i = 0; i < 3; i++) {
        b.box(0.2 - i * 0.03, 0.006, 0.02, ch, [-0.15 + i * 0.03, 1.375, 0.05 + i * 0.04], [0, 0.3, 0]);
        b.tor(0.016, 0.005, ch, [-0.05 + i * 0.02, 1.375, 0.08 + i * 0.04], [PI / 2, 0, 0]);
      }
      b.rbox(0.18, 0.02, 0.14, 0.01, K.surf('linge', 0x3a5a8a), [0.18, 1.38, 0], [0, 0.5, 0]);
    }
  );
  K.def(
    'tool_bench',
    {label: 'Workbench', table: 'hardware', items: [2, 4], auto: ['hardware', 'auto', 'utility', 'barn']},
    b => {
      const wood = K.surf('wood', 0x8a6a42),
        top = K.surf('boards', 0x7a5a3a),
        st = K.surf('mecha', 0x3a4a5a, {m: 0.5}),
        ch = K.chrome(),
        W = 1.9,
        D = 0.7;
      b.rbox(W, 0.06, D, 0.006, top, [0, 0.9, 0]);
      for (const x of [-W / 2 + 0.06, W / 2 - 0.06])
        for (const z of [-D / 2 + 0.06, D / 2 - 0.06]) b.box(0.08, 0.87, 0.08, wood, [x, 0.435, z]);
      b.box(W - 0.1, 0.025, D - 0.1, wood, [0, 0.2, 0]);
      // pegboard with outlines + tools, shelf, vise, clamped plank, coffee-can of nails, lamp
      b.box(W, 1.0, 0.02, K.surf('cardboard', 0xb8a07a), [0, 1.45, -D / 2 + 0.01]);
      b.label(
        W - 0.02,
        0.98,
        K.paint(
          'peg',
          1024,
          512,
          (c, W, H, r) => {
            c.fillStyle = 'rgba(0,0,0,0)';
            c.clearRect(0, 0, W, H);
            c.fillStyle = 'rgba(40,30,20,.65)';
            for (let x = 12; x < W; x += 24)
              for (let y = 12; y < H; y += 24) {
                c.beginPath();
                c.arc(x, y, 3.2, 0, PI * 2);
                c.fill();
              }
            c.strokeStyle = 'rgba(20,20,20,.75)';
            c.lineWidth = 5;
            [
              [120, 140, 200, 40],
              [360, 120, 30, 220],
              [460, 120, 30, 200],
              [600, 100, 160, 90],
              [820, 140, 40, 240]
            ].forEach(q => {
              c.strokeRect(q[0], q[1], q[2], q[3]);
            });
          },
          {alpha: true, r: 0.8}
        ),
        [0, 1.45, -D / 2 + 0.021]
      );
      const hang = [
        [-0.6, 1.75, 0.36, 0],
        [-0.24, 1.62, 0.02, 1],
        [-0.04, 1.62, 0.02, 1],
        [0.3, 1.8, 0.2, 2],
        [0.68, 1.62, 0.02, 3]
      ];
      hang.forEach(([x, y, w, k]) => {
        b.cyl(0.005, 0.005, 0.06, ch, [x, y + 0.12, -D / 2 + 0.05], [PI / 2, 0, 0], 6);
        if (k === 0) {
          b.box(0.3, 0.03, 0.004, ch, [x, y, -D / 2 + 0.04]);
          b.box(0.06, 0.12, 0.004, ch, [x + 0.15, y - 0.04, -D / 2 + 0.04]);
        } // handsaw blade
        else if (k === 1) {
          b.cyl(0.014, 0.014, 0.12, K.mat(0xd83a1a, 0.4), [x, y + 0.03, -D / 2 + 0.04], null, 10);
          b.cyl(0.004, 0.004, 0.12, ch, [x, y - 0.09, -D / 2 + 0.04], null, 6);
        } // screwdrivers
        else if (k === 2) {
          b.box(0.26, 0.06, 0.025, K.surf('wood', 0xa87a4a), [x, y - 0.12, -D / 2 + 0.045], [0, 0, PI / 2]);
          b.box(0.12, 0.03, 0.04, K.mat(0x2a2a2a, 0.4, 0.8), [x, y, -D / 2 + 0.05]);
        } // hammer
        else {
          b.box(0.03, 0.24, 0.02, ch, [x, y - 0.05, -D / 2 + 0.04]);
          b.tor(0.03, 0.008, ch, [x, y + 0.08, -D / 2 + 0.04], [0, 0, 0]);
        }
      });
      b.box(W, 0.025, 0.2, wood, [0, 1.95, -D / 2 + 0.1]);
      for (let i = 0; i < 5; i++)
        b.cyl(
          0.06,
          0.06,
          0.12,
          K.mat([0xb0221a, 0x2a6ad8, 0x3a3a3a, 0xd8a01a, 0x1a6a3a][i], 0.4, 0.3),
          [-0.8 + i * 0.35, 2.03, -D / 2 + 0.1],
          null,
          16
        ); // paint tins
      b.push([W / 2 - 0.2, 0.93, D / 2 - 0.08]);
      b.box(0.12, 0.09, 0.16, st, [0, 0.045, 0]);
      b.box(0.16, 0.1, 0.04, st, [0, 0.1, 0.1]);
      b.box(0.16, 0.1, 0.04, st, [0, 0.1, -0.02]);
      b.cyl(0.012, 0.012, 0.3, ch, [0, 0.1, 0.25], [PI / 2, 0, 0], 10);
      b.cyl(0.008, 0.008, 0.18, ch, [0, 0.1, 0.4], [0, 0, PI / 2], 8);
      b.pop(); // bench vise
      b.box(0.7, 0.03, 0.12, K.surf('wood', 0xc8a070), [-0.2, 0.945, 0.12], [0, 0.08, 0]);
      b.push([-0.45, 0.93, 0.15]);
      b.box(0.02, 0.14, 0.08, K.mat(0xd8a01a, 0.4, 0.3), [0, 0.04, 0]);
      b.cyl(0.006, 0.006, 0.14, ch, [0, 0.04, 0.02], null, 8);
      b.pop();
      b.cyl(0.07, 0.07, 0.13, K.surf('rust', 0x8a6a4a, {m: 0.5}), [0.3, 0.995, -0.15], null, 18, true);
      for (let i = 0; i < 20; i++)
        b.cyl(
          0.0018,
          0.0018,
          0.07,
          K.mat(0x7a7a78, 0.4, 0.9),
          [0.3 + (b.rnd() - 0.5) * 0.1, 1.05, -0.15 + (b.rnd() - 0.5) * 0.1],
          [(b.rnd() - 0.5) * 0.6, 0, (b.rnd() - 0.5) * 0.6],
          4
        );
      // clamp lamp
      b.push([-W / 2 + 0.1, 1.95, -D / 2 + 0.15]);
      b.box(0.04, 0.06, 0.06, K.blackPlastic(), [0, 0, 0]);
      b.tube(
        [
          [0, 0.03, 0],
          [0.05, 0.25, 0.1],
          [0.15, 0.3, 0.25]
        ],
        0.008,
        K.blackPlastic(),
        20,
        8
      );
      b.add(new T.CylinderGeometry(0.05, 0.09, 0.1, 18, 1, true), K.mat(0xd8d8d8, 0.35, 0.8), {
        p: [0.17, 0.26, 0.3],
        r: [1.1, 0, 0]
      });
      b.pop();
      b.col(-W / 2, 0, -D / 2, W / 2, 0.93, D / 2);
    }
  );
  K.def('jerry_can', {label: 'Jerry can', table: 'hardware', items: [1, 1], auto: ['gas', 'auto', 'barn']}, b => {
    const red = K.surf('mecha', 0xb8231a, {m: 0.4}),
      W = 0.17,
      H = 0.46,
      D = 0.34;
    b.rbox(W, H, D, 0.03, red, [0, H / 2, 0], null, 3);
    // embossed X on the sides, three-bar handle, spout cap, label
    for (const sd of [-1, 1])
      for (const a of [-1, 1])
        b.box(
          0.008,
          0.03,
          Math.hypot(H * 0.75, D * 0.75),
          red,
          [sd * (W / 2 + 0.002), H / 2, 0],
          [Math.atan2(H * 0.75, D * 0.75) * a, 0, 0],
          0.006
        );
    for (const z of [-0.1, 0, 0.1]) b.box(0.03, 0.06, 0.025, red, [0, H + 0.03, z], null, 0.008);
    b.box(0.035, 0.025, 0.26, red, [0, H + 0.07, 0], null, 0.01);
    b.push([0, H, 0.12], [0.6, 0, 0]);
    b.cyl(0.03, 0.03, 0.06, red, [0, 0.03, 0], null, 14);
    b.box(0.05, 0.02, 0.06, K.mat(0x2a2a2a, 0.4, 0.8), [0, 0.065, -0.02], null, 0.006);
    b.pop();
    b.label(
      0.2,
      0.14,
      K.paint(
        'jc_lbl',
        256,
        180,
        (c, W, H, r) => {
          c.fillStyle = '#f2c12e';
          c.fillRect(0, 0, W, H);
          c.fillStyle = '#1a1a1a';
          c.fillRect(0, 0, W, 36);
          P.text(c, 'GASOLINE', W / 2, 18, {size: 28, col: '#f2c12e'});
          c.fillStyle = '#d8201a';
          c.beginPath();
          c.moveTo(W * 0.22, H * 0.45);
          c.lineTo(W * 0.36, H * 0.85);
          c.lineTo(W * 0.08, H * 0.85);
          c.fill();
          P.text(c, 'FLAMMABLE', W * 0.66, H * 0.55, {size: 22, col: '#1a1a1a'});
          P.text(c, '20 L / 5 GAL', W * 0.66, H * 0.8, {size: 18, col: '#1a1a1a'});
          P.grime(c, W, H, r, 0.7);
          P.scratches(c, W, H, r, 30);
        },
        {r: 0.6}
      ),
      [W / 2 + 0.012, H / 2, 0],
      [0, PI / 2, 0]
    );
  });
  K.def(
    'propane_cylinder',
    {label: 'Propane cylinder', table: 'hardware', items: [1, 1], auto: ['utility', 'hardware']},
    b => {
      const body = K.surf('mecha', 0xe8e6de, {m: 0.3}),
        ch = K.chrome(),
        brass = K.mat(0xc8a040, 0.3, 0.9);
      b.lathe(
        [
          [0, 0],
          [0.14, 0],
          [0.15, 0.02],
          [0.15, 0.9],
          [0.13, 1.0],
          [0.06, 1.05],
          [0, 1.05]
        ],
        body,
        [0, 0.06, 0],
        32
      );
      b.cyl(0.15, 0.15, 0.06, K.surf('rust', 0x8a7a6a, {m: 0.5}), [0, 0.03, 0], null, 28, true); // foot ring
      b.cyl(0.025, 0.025, 0.08, brass, [0, 1.14, 0], null, 12);
      b.cyl(0.04, 0.04, 0.015, brass, [0, 1.2, 0], null, 8);
      b.cyl(0.012, 0.012, 0.07, brass, [0.05, 1.14, 0], [0, 0, PI / 2], 8);
      b.tor(0.09, 0.015, body, [0, 1.18, 0], [PI / 2, 0, 0], null, 24);
      for (const a of [0, PI]) b.box(0.02, 0.12, 0.02, body, [Math.cos(a) * 0.09, 1.12, Math.sin(a) * 0.09]); // guard collar
      b.label(
        0.22,
        0.3,
        K.paint(
          'prop_lbl',
          256,
          350,
          (c, W, H, r) => {
            c.clearRect(0, 0, W, H);
            c.fillStyle = '#d8201a';
            c.fillRect(0, 0, W, 80);
            P.text(c, 'PROPANE', W / 2, 42, {size: 52, col: '#fff'});
            c.fillStyle = '#1a1a1a';
            c.font = "18px 'MFZ Mono',monospace";
            c.textAlign = 'left';
            ['NET WT 20 LB', 'UN1075', 'TARE 17.6', 'DANGER: HIGHLY', 'FLAMMABLE GAS'].forEach((s, i) =>
              c.fillText(s, 14, 120 + i * 30)
            );
            c.fillStyle = '#f2c12e';
            c.beginPath();
            c.moveTo(W * 0.5, H * 0.86);
            c.lineTo(W * 0.7, H * 0.98);
            c.lineTo(W * 0.3, H * 0.98);
            c.fill();
            P.grime(c, W, H, r, 0.6);
          },
          {alpha: true, r: 0.5}
        ),
        [0, 0.6, 0.151]
      );
    }
  );

  /* ===== hay bale ===== */
  K.def('hay_bale', {label: 'Hay bale', table: 'barn', items: [1, 1], auto: ['barn', 'cornmaze']}, b => {
    const hay = K.surf('burlap', 0xc8a850),
      W = 0.48,
      H = 0.38,
      D = 0.92;
    b.rbox(W, H, D, 0.06, hay, [0, H / 2, 0], null, 3);
    // straggling straws + two twine bands
    for (const z of [-0.24, 0.24]) {
      b.tor((Math.hypot(W, H) / 2) * 0.9, 0.006, K.mat(0x8a6a3a, 0.9), [0, H / 2, z], [0, 0, 0], null, 32);
    }
    const rnd = b.rnd,
      straw = K.mat(0xd8b860, 0.9);
    for (let i = 0; i < 70; i++) {
      const side = Math.floor(rnd() * 4),
        l = 0.06 + rnd() * 0.12,
        y = rnd() * H,
        z = (rnd() - 0.5) * D;
      let p, r;
      if (side < 2) {
        p = [(side ? 1 : -1) * (W / 2), y, z];
        r = [rnd() * 3, rnd() * 3, PI / 2 + (rnd() - 0.5)];
      } else {
        p = [(rnd() - 0.5) * W, side === 2 ? H : 0.01, z];
        r = [PI / 2 + (rnd() - 0.5), rnd() * 3, 0];
      }
      b.cyl(0.002, 0.002, l, straw, p, r, 3);
    }
  });

  /* ===== yard-sale table ===== */
  K.def('yard_sale_table', {label: 'Yard-sale table', table: 'house', items: [2, 4], auto: ['house', 'park']}, b => {
    const W = 1.8,
      D = 0.75,
      top = K.mat(0xe8e6de, 0.6),
      leg = K.mat(0x8a8c90, 0.4, 0.8);
    b.rbox(W, 0.04, D, 0.015, top, [0, 0.73, 0]);
    for (const sd of [-1, 1]) {
      b.tube(
        [
          [sd * (W / 2 - 0.15), 0.71, -D / 2 + 0.08],
          [sd * (W / 2 - 0.2), 0, -D / 2 + 0.08]
        ],
        0.012,
        leg,
        4,
        8
      );
      b.tube(
        [
          [sd * (W / 2 - 0.15), 0.71, D / 2 - 0.08],
          [sd * (W / 2 - 0.2), 0, D / 2 - 0.08]
        ],
        0.012,
        leg,
        4,
        8
      );
      b.cyl(0.01, 0.01, D - 0.16, leg, [sd * (W / 2 - 0.18), 0.3, 0], [PI / 2, 0, 0], 8);
    }
    // junk for sale: lamp, records, a trophy, toaster, books, a bowling ball, price stickers + cardboard sign
    b.label(
      0.5,
      0.3,
      K.paint(
        'yard_sign',
        512,
        300,
        (c, W, H, r) => {
          c.fillStyle = '#c8a46e';
          c.fillRect(0, 0, W, H);
          P.text(c, 'YARD SALE', W / 2, H * 0.32, {size: 86, col: '#b0221a', font: "'MFZ Head',sans-serif"});
          P.text(c, 'EVERYTHING $1', W / 2, H * 0.7, {size: 50, col: '#1a1a1a', font: "'MFZ Type',serif"});
          P.grime(c, W, H, r, 0.6);
        },
        {r: 0.9}
      ),
      [0, 0.6, D / 2 + 0.01],
      [-0.1, 0, 0]
    );
    lampOnTable(b, -0.7, 0.75, -0.15);
    for (let i = 0; i < 6; i++)
      b.box(
        0.31,
        0.31,
        0.004,
        K.paint(
          'rec' + (i % 3),
          128,
          128,
          (c, W, H) => {
            c.fillStyle = ['#2a4a8a', '#b0221a', '#e8b02a'][i % 3];
            c.fillRect(0, 0, W, H);
            c.fillStyle = '#111';
            c.beginPath();
            c.arc(W * 0.8, H / 2, 40, 0, PI * 2);
            c.fill();
            P.text(c, ['JAZZ', 'ROCK', 'DISCO'][i % 3], W * 0.35, H / 2, {size: 26, col: '#fff'});
          },
          {r: 0.6}
        ),
        [-0.25, 0.9, -0.1 + i * 0.006],
        [-0.15, 0, 0]
      );
    b.lathe(
      [
        [0, 0],
        [0.06, 0],
        [0.06, 0.02],
        [0.02, 0.04],
        [0.015, 0.12],
        [0.05, 0.16],
        [0.06, 0.24],
        [0, 0.25]
      ],
      K.mat(0xd8b040, 0.3, 0.95),
      [0.2, 0.75, -0.15],
      18
    );
    b.box(0.12, 0.04, 0.12, K.mat(0x1a1a1a, 0.5), [0.2, 0.77, -0.15]);
    b.rbox(0.26, 0.18, 0.15, 0.03, K.mat(0xd8d8d4, 0.3, 0.6), [0.55, 0.84, -0.1]);
    b.sph(0.11, K.mat(0x2a3a8a, 0.2, 0.1), [0.72, 0.86, 0.17]);
    for (let i = 0; i < 3; i++)
      b.box(
        0.18,
        0.04,
        0.25,
        K.mat([0x6b1d1d, 0x1d3b6b, 0x2f5a2a][i], 0.7),
        [0.25, 0.77 + i * 0.042, 0.18],
        [0, 0.2 * i, 0]
      );
    b.rbox(0.12, 0.07, 0.12, 0.01, K.mat(0xf2c12e, 0.4), [-0.3, 0.785, 0.2]);
    for (let i = 0; i < 6; i++) b.cyl(0.012, 0.012, 0.003, K.mat(0xff6a3a, 0.6), [-0.8 + i * 0.3, 0.752, 0.3], null, 8);
    b.col(-W / 2, 0, -D / 2, W / 2, 0.76, D / 2);
  });
  function lampOnTable(b, x, y, z) {
    b.lathe(
      [
        [0, 0],
        [0.07, 0],
        [0.08, 0.04],
        [0.04, 0.1],
        [0.05, 0.2],
        [0.02, 0.3],
        [0, 0.3]
      ],
      K.mat(0x6a8a6a, 0.3),
      [x, y, z],
      18
    );
    b.add(new T.CylinderGeometry(0.08, 0.14, 0.16, 20, 1, true), K.surf('linge', 0xe8dcc0), {p: [x, y + 0.36, z]});
  }

  /* ===== shop counters ===== */
  K.def('shop_counter', {label: 'Shop counter', table: 'convenience', items: [1, 3]}, b => {
    const W = 2.2,
      D = 0.62,
      H = 1.0,
      front = K.paintSteel(0x8a2a22, {m: 0, r: 0.5, worn: true}),
      top = K.surf('concrete', 0x2a2a2c),
      st = K.chrome();
    // L-shaped counter with display front, kick plate, lottery display, gum rack, register spot, stool
    b.rbox(W, H - 0.05, D, 0.008, front, [0, (H - 0.05) / 2, 0]);
    b.rbox(D, H - 0.05, 1.4, 0.008, front, [W / 2 - D / 2, (H - 0.05) / 2, -0.7 - D / 2 + 0.01]);
    b.rbox(W + 0.04, 0.04, D + 0.04, 0.008, top, [0, H - 0.02, 0]);
    b.rbox(D + 0.04, 0.04, 1.4, 0.008, top, [W / 2 - D / 2, H - 0.02, -0.7 - D / 2 + 0.01]);
    b.box(W, 0.1, 0.01, st, [0, 0.05, D / 2 + 0.002]);
    for (let i = 0; i < 5; i++)
      b.frame(0.38, 0.6, 0.03, K.paintSteel(0x6a1a14, {m: 0, r: 0.5}), [-W / 2 + 0.24 + i * 0.43, 0.48, D / 2 + 0.002]);
    // gum / candy rack on the front
    b.push([-0.4, 0.62, D / 2 + 0.08]);
    b.box(0.6, 0.4, 0.12, K.mat(0x2a2a2a, 0.5, 0.5), [0, 0, 0]);
    for (let r = 0; r < 3; r++)
      for (let i = 0; i < 6; i++)
        b.box(0.08, 0.1, 0.08, K.mat([0xd83a2a, 0x2a8ad8, 0xf2c12e, 0x3ab86a, 0xe86ab0, 0xf4f1e8][(r + i) % 6], 0.4), [
          -0.25 + i * 0.1,
          -0.13 + r * 0.13,
          0.02
        ]);
    b.pop();
    b.rbox(0.4, 0.25, 0.25, 0.02, K.mat(0x1a1a1a, 0.4), [0.6, H + 0.125, -0.05]);
    b.label(
      0.36,
      0.15,
      K.paint(
        'lotto',
        256,
        110,
        (c, W, H, r) => {
          const g = c.createLinearGradient(0, 0, W, 0);
          g.addColorStop(0, '#7a1ab0');
          g.addColorStop(1, '#d83a8a');
          c.fillStyle = g;
          c.fillRect(0, 0, W, H);
          P.text(c, 'LUCKY 7 LOTTO', W / 2, H * 0.4, {size: 34, col: '#ffd23a'});
          P.text(c, 'TODAY: $2,000,000', W / 2, H * 0.78, {size: 20, col: '#fff'});
        },
        {glow: 0.4}
      ),
      [0.6, H + 0.15, 0.076]
    );
    b.lathe(
      [
        [0, 0],
        [0.18, 0],
        [0.18, 0.02],
        [0.03, 0.04],
        [0.03, 0.62],
        [0.2, 0.64],
        [0.2, 0.7],
        [0, 0.7]
      ],
      K.mat(0x8a8c90, 0.35, 0.8),
      [0, 0, -1.0],
      20
    );
    b.cyl(0.2, 0.2, 0.06, K.surf('laine', 0x8a1a1a), [0, 0.73, -1.0], null, 20);
    b.col(-W / 2, 0, -D / 2, W / 2, H, D / 2).col(W / 2 - D, 0, -1.4 - D / 2, W / 2, H, -D / 2);
  });
  K.def('reception_counter', {label: 'Reception counter', table: 'office', items: [1, 3]}, b => {
    const W = 2.0,
      D = 0.7,
      H = 1.1,
      gran = K.surf('concrete', 0x6a6560),
      tile = K.veneer(0x3a2a20),
      st = K.chrome();
    b.rbox(W, H - 0.05, 0.06, 0.008, tile, [0, (H - 0.05) / 2, D / 2 - 0.03]);
    b.rbox(W, 0.75, D - 0.06, 0.006, K.veneer(0x6a4a2e), [0, 0.375, -0.03]);
    b.rbox(W + 0.06, 0.04, 0.3, 0.01, gran, [0, H, D / 2 - 0.1]);
    b.rbox(W, 0.03, D, 0.006, gran, [0, 0.76, 0]);
    for (let i = 0; i < 5; i++)
      b.box(0.012, H - 0.1, 0.012, st, [-W / 2 + 0.2 + i * 0.4, (H - 0.05) / 2, D / 2 + 0.002]);
    b.label(
      0.8,
      0.16,
      K.paint(
        'recep',
        512,
        100,
        (c, W, H) => {
          c.clearRect(0, 0, W, H);
          P.text(c, 'RECEPTION', W / 2, H / 2, {size: 70, col: '#d8d8d8', font: "'MFZ Head',sans-serif", ls: 10});
        },
        {alpha: true, m: 0.8, r: 0.3}
      ),
      [0, 0.75, D / 2 + 0.002]
    );
    b.box(0.24, 0.15, 0.002, K.mat(0xc8a040, 0.3, 0.9), [0.6, H + 0.1, D / 2 - 0.12], [-0.3, 0, 0]);
    b.box(0.04, 0.05, 0.1, K.mat(0xc8a040, 0.3, 0.9), [0.6, H + 0.025, D / 2 - 0.1]); // bell + sign stand
    b.sph(0.035, K.mat(0xc8c8c8, 0.2, 1), [-0.6, H + 0.03, D / 2 - 0.1], [1, 0.5, 1]);
    b.cyl(0.04, 0.04, 0.01, K.mat(0x1a1a1a, 0.4), [-0.6, H + 0.025, D / 2 - 0.1], null, 16);
    pcSet(b, 0.2, -0.05, PI);
    paperStack(b, -0.4, 0.775, -0.1, 10, 0.2);
    b.col(-W / 2, 0, -D / 2, W / 2, H, D / 2);
  });
})();
