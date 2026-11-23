/* MINI FORT ZOMBIE - PROPS 2/4: kitchen, appliances, vending, shop till (fridges, freezers, units, sink, prep table, dish station, coffee
   brewer, washing machine, drinks cooler, 5 vending machines with our own brands, cash register, dry goods). Original models + artwork. */
(function () {
  'use strict';
  const K = window.MFZK,
    P = K.P,
    PI = Math.PI,
    T = THREE;
  if (!K) return;
  const enamel = c => K.mat(c, 0.32, 0),
    steel = () => K.steelBrushed();

  /* ===== fridges ===== */
  function badge(key, txt, col) {
    return K.paint(
      'badge_' + key,
      256,
      64,
      (c, W, H, r) => {
        c.fillStyle = 'rgba(0,0,0,0)';
        c.clearRect(0, 0, W, H);
        P.text(c, txt, W / 2, H / 2, {
          size: 40,
          col: col || '#c9ccd0',
          font: "'MFZ Head',sans-serif",
          ls: 4,
          stroke: 'rgba(0,0,0,.35)',
          lw: 2
        });
      },
      {alpha: true, m: 0.9, r: 0.25}
    );
  }
  function magnets(key) {
    return K.paint(
      'mag_' + key,
      512,
      512,
      (c, W, H, r) => {
        c.clearRect(0, 0, W, H);
        // a child's drawing, a takeaway menu, a photo, a shopping list, held by magnets
        c.save();
        c.translate(130, 150);
        c.rotate(-0.12);
        c.fillStyle = '#fdfcf6';
        c.fillRect(-80, -60, 160, 120);
        c.strokeStyle = '#2a6ad8';
        c.lineWidth = 5;
        c.beginPath();
        c.moveTo(-60, 40);
        c.lineTo(-20, -20);
        c.lineTo(20, 40);
        c.stroke();
        c.fillStyle = '#f2c12e';
        c.beginPath();
        c.arc(45, -30, 16, 0, PI * 2);
        c.fill();
        c.strokeStyle = '#2a9a3a';
        c.beginPath();
        c.moveTo(-80, 45);
        c.lineTo(80, 45);
        c.stroke();
        c.fillStyle = '#d83a2a';
        c.beginPath();
        c.arc(0, -62, 9, 0, PI * 2);
        c.fill();
        c.restore();
        c.save();
        c.translate(360, 170);
        c.rotate(0.08);
        c.fillStyle = '#fff6d8';
        c.fillRect(-70, -90, 140, 180);
        P.text(c, 'GOLDEN WOK', 0, -66, {size: 20, col: '#b0221a'});
        c.fillStyle = '#555';
        for (let i = 0; i < 9; i++) c.fillRect(-56, -46 + i * 14, 80 + r() * 30, 4);
        P.text(c, '555-0142', 0, 76, {size: 16, col: '#222', font: "'MFZ Mono',monospace"});
        c.fillStyle = '#2a6ad8';
        c.beginPath();
        c.arc(0, -92, 9, 0, PI * 2);
        c.fill();
        c.restore();
        c.save();
        c.translate(170, 380);
        c.rotate(0.15);
        c.fillStyle = '#f4f1e8';
        c.fillRect(-70, -55, 140, 110);
        const g = c.createLinearGradient(0, -45, 0, 40);
        g.addColorStop(0, '#7aa6c8');
        g.addColorStop(0.6, '#c8b890');
        g.addColorStop(1, '#6a8a4a');
        c.fillStyle = g;
        c.fillRect(-62, -47, 124, 82);
        c.fillStyle = '#4a3a2a';
        for (const x of [-25, 0, 25]) {
          c.beginPath();
          c.arc(x, 0, 8, 0, PI * 2);
          c.fill();
          c.fillRect(x - 7, 6, 14, 28);
        }
        c.fillStyle = '#d8a020';
        c.beginPath();
        c.arc(0, -70, 9, 0, PI * 2);
        c.fill();
        c.restore();
        c.save();
        c.translate(380, 400);
        c.rotate(-0.06);
        c.fillStyle = '#fffbe8';
        c.fillRect(-60, -70, 120, 140);
        c.fillStyle = '#c8d8f0';
        for (let i = 0; i < 8; i++) c.fillRect(-60, -50 + i * 16, 120, 1);
        c.font = "16px 'MFZ Type',serif";
        c.fillStyle = '#223';
        c.textAlign = 'left';
        ['milk', 'eggs', 'batteries!!', 'bread', 'bleach', 'ammo?'].forEach((s, i) => c.fillText(s, -48, -36 + i * 16));
        c.fillStyle = '#3aa86a';
        c.beginPath();
        c.arc(0, -72, 9, 0, PI * 2);
        c.fill();
        c.restore();
        P.grime(c, W, H, r, 0.3);
      },
      {alpha: true, r: 0.85}
    );
  }
  function fridge(b, o) {
    const W = o.w || 0.8,
      H = o.h || 1.75,
      D = 0.72,
      col = enamel(o.col),
      r = 0.04;
    // body + doors (freezer on top / bottom), door seals, handles, kick grille, hinges
    b.rbox(W, H - 0.08, D - 0.06, 0.03, col, [0, H / 2 + 0.04, -0.03], null, 3);
    const split = o.split || 0.68,
      y1 = 0.1,
      y2 = H * split,
      y3 = H - 0.01;
    for (const [a, c2] of [
      [y1, y2 - 0.01],
      [y2 + 0.01, y3]
    ]) {
      b.rbox(W - 0.004, c2 - a, 0.06, r, col, [0, (a + c2) / 2, D / 2 - 0.03], null, 3);
      b.box(W - 0.03, c2 - a - 0.03, 0.012, K.rubber(), [0, (a + c2) / 2, D / 2 - 0.062], null, 0.004);
    }
    const hm = o.retro ? K.chrome() : K.mat(0x2a2b2d, 0.4, 0.3);
    if (o.retro) {
      b.push([W / 2 - 0.08, y2 + 0.25, D / 2 + 0.002]);
      b.rbox(0.05, 0.22, 0.06, 0.02, hm, [0, 0, 0.03]);
      b.pop();
      b.push([W / 2 - 0.08, y2 - 0.2, D / 2 + 0.002]);
      b.rbox(0.05, 0.18, 0.06, 0.02, hm, [0, 0, 0.03]);
      b.pop();
      b.label(0.3, 0.075, badge('retro', 'FROSTLINE', '#d8d8d8'), [0, H - 0.12, D / 2 + 0.002]);
    } else {
      b.handle(0.42, hm, [W / 2 - 0.06, y2 + 0.3, D / 2], true, 0.04);
      b.handle(0.3, hm, [W / 2 - 0.06, y2 - 0.25, D / 2], true, 0.04);
      b.label(0.24, 0.06, badge('mod', 'POLARIS', '#8a8e94'), [0, y3 - 0.08, D / 2 + 0.002]);
    }
    b.box(W - 0.1, 0.07, 0.01, K.mat(0x1a1a1a, 0.7), [0, 0.055, D / 2 - 0.03]);
    b.vents(4, W - 0.14, 0.06, K.mat(0x2a2a2a, 0.6, 0.4), [0, 0.055, D / 2 - 0.024], false);
    for (const y of [y1 + 0.04, y2 - 0.04, y2 + 0.05, y3 - 0.04])
      b.hinge(0.06, K.chrome(), [-W / 2 + 0.01, y, D / 2 - 0.01]);
    b.label(W * 0.7, W * 0.7, magnets(o.key), [-0.02, y2 - 0.32, D / 2 + 0.003]);
    b.label(
      0.12,
      0.12,
      K.paint(
        'fr_mag',
        128,
        128,
        (c, W, H) => {
          c.clearRect(0, 0, W, H);
          c.fillStyle = '#e8402a';
          c.beginPath();
          c.arc(64, 64, 50, 0, PI * 2);
          c.fill();
          P.text(c, 'NYC', 64, 64, {size: 34, col: '#fff'});
        },
        {alpha: true, r: 0.3}
      ),
      [0.22, y2 + 0.36, D / 2 + 0.004]
    );
    // dents and a smear of dried blood on one door
    b.label(
      0.3,
      0.4,
      K.paint(
        'fr_blood',
        256,
        320,
        (c, W, H, r) => {
          c.clearRect(0, 0, W, H);
          c.fillStyle = 'rgba(90,10,8,.85)';
          for (let i = 0; i < 4; i++) {
            c.beginPath();
            c.ellipse(60 + i * 28, 60 + r() * 30, 14, 20, 0, 0, PI * 2);
            c.fill();
            c.fillRect(56 + i * 28, 60, 6 + r() * 4, 140 + r() * 120);
          }
          P.noise(c, W, H, r, 300, 0.4, '#3a0604');
        },
        {alpha: true, r: 0.4}
      ),
      [-W * 0.18, y2 + 0.18, D / 2 + 0.003]
    );
  }
  K.def(
    'fridge_retro',
    {label: 'Fridge', table: 'house', items: [1, 3], auto: ['house', 'diner', 'restaurant', 'butcher']},
    b => fridge(b, {col: 0xe9e4d4, retro: true, split: 0.72, key: 'a', h: 1.62})
  );
  K.def(
    'fridge_modern',
    {label: 'Fridge', table: 'house', items: [1, 3], auto: ['house', 'diner', 'restaurant', 'butcher', 'bakery']},
    b => fridge(b, {col: 0xdfe1e2, split: 0.62, key: 'b', h: 1.8, w: 0.84})
  );
  K.def('fridge_blue', {label: 'Fridge', table: 'house', items: [1, 3], auto: ['house']}, b =>
    fridge(b, {col: 0x6f9fc0, retro: true, split: 0.7, key: 'c', h: 1.6})
  );

  /* ===== commercial upright freezer (reach-in, stainless, glass door, product inside) ===== */
  const frozen = K.paint(
    'frozen',
    512,
    512,
    (c, W, H, r) => {
      c.fillStyle = '#d8e4ea';
      c.fillRect(0, 0, W, H);
      for (let y = 0; y < 4; y++) {
        let x = 0;
        while (x < W) {
          const w = 40 + r() * 50,
            h = 70 + r() * 40,
            col = ['#e83a2a', '#2a6ad8', '#f2c12e', '#3aa86a', '#f4f1e8', '#8a3ab0'][Math.floor(r() * 6)];
          c.fillStyle = col;
          c.fillRect(x + 2, y * 128 + 128 - h, w - 4, h);
          c.fillStyle = 'rgba(255,255,255,.75)';
          c.fillRect(x + 6, y * 128 + 128 - h + 8, w - 12, 12);
          c.fillStyle = 'rgba(0,0,0,.2)';
          c.fillRect(x + w - 8, y * 128 + 128 - h, 4, h);
          x += w;
        }
        c.fillStyle = '#9aa4aa';
        c.fillRect(0, y * 128 + 124, W, 4);
      }
      c.fillStyle = 'rgba(230,245,255,.35)';
      c.fillRect(0, 0, W, H);
      P.noise(c, W, H, r, 2000, 0.25, '#fff', 2);
    },
    {r: 0.6}
  );
  K.def(
    'freezer_upright',
    {
      label: 'Upright freezer',
      table: 'diner',
      items: [1, 3],
      auto: ['diner', 'restaurant', 'burger', 'takeout', 'butcher']
    },
    b => {
      const W = 0.76,
        H = 2.0,
        D = 0.8,
        st = steel();
      b.rbox(W, H - 0.12, D, 0.01, st, [0, H / 2 + 0.06, 0]);
      for (const x of [-W / 2 + 0.04, W / 2 - 0.04])
        for (const z of [-D / 2 + 0.06, D / 2 - 0.06]) {
          b.cyl(0.02, 0.02, 0.08, K.chrome(), [x, 0.04, z], null, 10);
          b.cyl(0.035, 0.035, 0.012, K.rubber(), [x, 0.006, z], null, 12);
        }
      b.rbox(W - 0.02, 1.45, 0.05, 0.01, st, [0, 1.0, D / 2 + 0.02]);
      b.label(W - 0.14, 1.3, frozen, [0, 1.0, D / 2 + 0.0455]);
      b.plane(W - 0.14, 1.3, K.glass(0xe6f4ff, 0.35), [0, 1.0, D / 2 + 0.047]);
      b.box(0.03, 0.5, 0.04, K.chrome(), [W / 2 - 0.06, 1.05, D / 2 + 0.06], null, 0.01);
      b.vents(6, W - 0.1, 0.22, K.mat(0x2a2c2e, 0.5, 0.6), [0, 1.86, D / 2 + 0.004], true);
      b.label(
        0.3,
        0.08,
        K.paint(
          'fz_disp',
          200,
          56,
          (c, W, H) => {
            c.fillStyle = '#0a0f0a';
            c.fillRect(0, 0, W, H);
            P.text(c, '-18°C', W * 0.38, H / 2, {size: 40, col: '#3aff6a', font: "'MFZ Mono',monospace"});
            c.fillStyle = '#ff3a2a';
            c.beginPath();
            c.arc(W * 0.85, H / 2, 7, 0, PI * 2);
            c.fill();
          },
          {glow: 0.8}
        ),
        [-0.12, 1.86, D / 2 + 0.007]
      );
      b.label(0.22, 0.06, badge('cold', 'COLDLINE', '#3a3c40'), [0.15, 1.96 - 0.17, D / 2 + 0.007]);
    }
  );
  /* chest freezers */
  function chestFreezer(b, full) {
    const W = 1.9,
      H = 0.86,
      D = 0.86,
      body = enamel(0xf2f2ee),
      st = steel(),
      gl = K.glass(0xdaf0ff, 0.3);
    for (const z of [-D / 2 + 0.025, D / 2 - 0.025])
      b.rbox(W, H - 0.08, 0.05, 0.02, body, [0, (H - 0.08) / 2 + 0.08, z], null, 2);
    for (const x of [-W / 2 + 0.025, W / 2 - 0.025])
      b.rbox(0.05, H - 0.08, D, 0.02, body, [x, (H - 0.08) / 2 + 0.08, 0], null, 2);
    b.box(W, 0.34, D, body, [0, 0.25, 0]);
    b.box(W - 0.1, 0.08, D - 0.1, K.mat(0x2a2a2a, 0.6), [0, 0.04, 0]);
    const lin = K.mat(0xdfe6ea, 0.35, 0.1);
    b.box(W - 0.1, 0.012, D - 0.1, lin, [0, 0.42, 0]);
    for (const z of [-D / 2 + 0.05, D / 2 - 0.05]) b.box(W - 0.1, H - 0.42, 0.012, lin, [0, (H + 0.42) / 2, z]);
    for (const x of [-W / 2 + 0.05, W / 2 - 0.05]) b.box(0.012, H - 0.42, D - 0.1, lin, [x, (H + 0.42) / 2, 0]);
    for (const z of [-D / 2 + 0.03, D / 2 - 0.03]) b.box(W + 0.02, 0.06, 0.04, st, [0, H, z]);
    for (const x of [-W / 2 + 0.03, W / 2 - 0.03]) b.box(0.04, 0.06, D + 0.02, st, [x, H, 0]); // rim round a hollow bin
    b.label(
      W * 0.5,
      0.16,
      K.paint(
        'chest_band',
        512,
        80,
        (c, W, H, r) => {
          c.fillStyle = '#1e5aa8';
          c.fillRect(0, 0, W, H);
          P.text(c, 'ARCTIC FRESH  ❄  FROZEN FOODS', W / 2, H / 2, {size: 34, col: '#fff', max: W * 0.95});
        },
        {}
      ),
      [0, H - 0.2, D / 2 + 0.001]
    );
    // sliding glass lids, one half open
    b.plane(W / 2, D - 0.06, gl, [-W / 4 + 0.05, H + 0.045, 0], [-PI / 2, 0, 0]);
    b.plane(W / 2, D - 0.06, gl, [W / 4 - 0.25, H + 0.055, 0], [-PI / 2, 0, 0]);
    for (const x of [-W / 2 + 0.03, 0, W / 2 - 0.03]) b.box(0.025, 0.025, D, K.chrome(), [x, H + 0.05, 0]);
    if (full) {
      const rnd = b.rnd;
      for (let i = 0; i < 40; i++) {
        const w = 0.12 + rnd() * 0.14,
          d = 0.1 + rnd() * 0.12,
          h = 0.04 + rnd() * 0.06;
        b.add(
          K.rboxGeo(w, h, d, 0.01, 1),
          K.paint(
            'fpack' + (i % 6),
            128,
            128,
            (c, W, H, r) => {
              c.fillStyle = ['#e83a2a', '#2a6ad8', '#f2c12e', '#3aa86a', '#f4f1e8', '#8a3ab0'][i % 6];
              c.fillRect(0, 0, W, H);
              P.text(c, ['PEAS', 'PIZZA', 'FRIES', 'FISH', 'ICE', 'BERRY'][i % 6], W / 2, H / 2, {
                size: 26,
                col: '#fff'
              });
              c.fillStyle = 'rgba(255,255,255,.4)';
              c.fillRect(0, 0, W, 20);
            },
            {r: 0.4}
          ),
          {
            p: [-W / 2 + 0.15 + rnd() * (W - 0.3), 0.48 + rnd() * 0.3, -D / 2 + 0.15 + rnd() * (D - 0.3)],
            r: [rnd() * 0.3, rnd() * 3, rnd() * 0.3]
          }
        );
      }
    }
    b.label(
      0.24,
      0.24,
      K.paint(
        'chest_frost',
        256,
        256,
        (c, W, H, r) => {
          c.clearRect(0, 0, W, H);
          for (let i = 0; i < 500; i++) {
            c.fillStyle = 'rgba(255,255,255,' + r() * 0.4 + ')';
            c.fillRect(r() * W, r() * H, 2, 2);
          }
        },
        {alpha: true}
      ),
      [0.6, H - 0.4, D / 2 + 0.002]
    );
  }
  K.def('chest_freezer_full', {label: 'Chest freezer', table: 'supermarket', items: [2, 4]}, b =>
    chestFreezer(b, true)
  );
  K.def('chest_freezer_empty', {label: 'Chest freezer (empty)', table: 'supermarket', items: [1, 2]}, b =>
    chestFreezer(b, false)
  );

  /* ===== kitchen units ===== */
  function cabinetRun(b, W, o) {
    const D = 0.6,
      H = 0.9,
      carc = o.paint ? K.paintSteel(o.wood, {m: 0, r: 0.42, tile: 1}) : K.veneer(o.wood || 0x9a7448),
      top = o.top === 'wood' ? K.veneer(o.topCol, {tile: 0.9}) : K.surf('concrete', o.topCol || 0x8a8278),
      hw = o.hw || K.chrome();
    b.box(W - 0.02, 0.1, D - 0.08, K.mat(0x1e1e1e, 0.8), [0, 0.05, -0.04]); // recessed plinth
    b.box(W, H - 0.13, D - 0.04, carc, [0, 0.1 + (H - 0.13) / 2, -0.02], null, 0.004);
    b.rbox(W + 0.02, 0.04, D + 0.02, 0.008, top, [0, H - 0.02, 0]);
    b.box(W + 0.02, 0.08, 0.015, top, [0, H + 0.02, -D / 2 + 0.0075]); // worktop + upstand
    const n = Math.max(1, Math.round(W / 0.5)),
      dw = W / n;
    for (let i = 0; i < n; i++) {
      const x = -W / 2 + dw * (i + 0.5),
        drawer = o.drawers && i % 2 === 0;
      if (drawer) {
        for (let k = 0; k < 3; k++) {
          const h = (H - 0.16) / 3;
          b.rbox(dw - 0.012, h - 0.01, 0.02, 0.004, carc, [x, 0.12 + h * (k + 0.5), D / 2 - 0.03]);
          if (o.shaker) b.frame(dw - 0.06, h - 0.05, 0.025, carc, [x, 0.12 + h * (k + 0.5), D / 2 - 0.018], 0.006);
          b.pull(0.12, hw, [x, 0.12 + h * (k + 0.5) + h * 0.25, D / 2 - 0.015]);
        }
      } else {
        b.rbox(dw - 0.012, H - 0.17, 0.02, 0.004, carc, [x, 0.1 + (H - 0.15) / 2, D / 2 - 0.03]);
        if (o.shaker) b.frame(dw - 0.08, H - 0.24, 0.04, carc, [x, 0.1 + (H - 0.15) / 2, D / 2 - 0.018], 0.008);
        b.rbox(dw - 0.012, 0.12, 0.02, 0.004, carc, [x, H - 0.11, D / 2 - 0.03]);
        b.pull(0.12, hw, [x, H - 0.11, D / 2 - 0.015]);
        b.handle(0.1, hw, [x + (i % 2 ? -1 : 1) * (dw / 2 - 0.05), 0.6, D / 2 - 0.02], true, 0.025);
      }
    }
  }
  K.def('kitchen_unit_oak', {label: 'Kitchen cabinet', table: 'house', items: [1, 2], auto: ['house']}, b => {
    cabinetRun(b, 1.2, {wood: 0xa07a4a, shaker: true, drawers: true, topCol: 0x5a5650});
    b.cyl(0.09, 0.08, 0.18, K.mat(0xd8d2c6, 0.4), [0.35, 0.98, -0.12], null, 18);
    b.cyl(0.02, 0.02, 0.2, K.veneer(0x8a6a3a), [0.33, 1.1, -0.12], [0, 0, 0.3], 8);
    b.cyl(0.02, 0.02, 0.22, K.veneer(0x8a6a3a), [0.38, 1.1, -0.1], [0.2, 0, -0.2], 8);
  }); // utensil pot
  K.def('kitchen_unit_white', {label: 'Kitchen cabinet', table: 'house', items: [1, 2], auto: ['house']}, b => {
    cabinetRun(b, 1.2, {
      paint: true,
      wood: 0xeae6dc,
      shaker: true,
      top: 'wood',
      topCol: 0x9a6a3a,
      hw: K.mat(0x2a2a2a, 0.4, 0.6)
    });
    b.rbox(0.3, 0.2, 0.2, 0.03, K.mat(0xc8302a, 0.3), [-0.3, 1.0, -0.1]);
    b.cyl(0.02, 0.02, 0.05, K.mat(0x1a1a1a, 0.4), [-0.3, 1.12, -0.1], null, 10);
  }); // a toaster-ish box
  K.def('kitchen_unit_dark', {label: 'Kitchen cabinet', table: 'house', items: [1, 2], auto: ['house']}, b => {
    cabinetRun(b, 1.2, {wood: 0x3e2a1e, drawers: true, topCol: 0xd8d4cc, hw: K.mat(0xb08a3a, 0.35, 0.9)});
  });
  K.def(
    'kitchen_counter',
    {label: 'Kitchen counter', table: 'house', items: [1, 2], auto: ['house', 'diner', 'coffee', 'bakery']},
    b => {
      cabinetRun(b, 1.6, {wood: 0xb08a5a, drawers: true, topCol: 0x7a746a});
      // microwave + chopping board + knife block
      b.rbox(0.5, 0.3, 0.36, 0.015, K.mat(0xe8e8e6, 0.35), [0.45, 1.05, -0.06]);
      b.label(0.32, 0.2, K.glass(0x101418, 0.85), [0.4, 1.05, 0.121]);
      b.box(0.1, 0.22, 0.01, K.mat(0x2a2a2a, 0.4), [0.63, 1.05, 0.122]);
      b.label(
        0.08,
        0.03,
        K.paint(
          'mw',
          96,
          36,
          (c, W, H) => {
            c.fillStyle = '#000';
            c.fillRect(0, 0, W, H);
            P.text(c, '12:00', W / 2, H / 2, {size: 26, col: '#3aff6a', font: "'MFZ Mono',monospace"});
          },
          {glow: 1}
        ),
        [0.63, 1.14, 0.128]
      );
      b.box(0.4, 0.02, 0.28, K.veneer(0xc8a070, {fig: false}), [-0.3, 0.91, 0], [0, 0.15, 0]);
      b.rbox(0.12, 0.22, 0.16, 0.01, K.veneer(0x5a3a22), [-0.65, 1.0, -0.15], [-0.25, 0, 0]);
      for (let i = 0; i < 4; i++)
        b.box(0.016, 0.08, 0.02, K.mat(0x1a1a1a, 0.5), [-0.69 + i * 0.025, 1.12 + i * 0.004, -0.2], [-0.25, 0, 0]);
    }
  );
  K.def('kitchen_counter_corner', {label: 'Kitchen counter (corner)', table: 'house', items: [1, 2]}, b => {
    const carc = K.veneer(0xb08a5a),
      top = K.surf('concrete', 0x7a746a);
    b.box(0.88, 0.77, 0.88, carc, [0, 0.1 + 0.385, 0]);
    b.rbox(0.9, 0.04, 0.9, 0.008, top, [0, 0.88, 0]);
    b.box(0.84, 0.1, 0.84, K.mat(0x1e1e1e, 0.8), [0, 0.05, 0]);
    b.rbox(0.4, 0.75, 0.02, 0.004, carc, [0.2, 0.48, 0.44]);
    b.handle(0.1, K.chrome(), [0.05, 0.6, 0.45], true, 0.025);
  });
  K.def('kitchen_sink', {label: 'Kitchen sink', table: 'house', items: [1, 2], auto: ['house']}, b => {
    cabinetRun(b, 1.2, {wood: 0xb08a5a, shaker: true, topCol: 0x8a8278});
    const st = steel(),
      W = 0.8,
      D = 0.46,
      y = 0.9;
    b.box(W, 0.012, D, st, [0, y + 0.002, 0]);
    for (const x of [-0.18, 0.2]) {
      const bw = x < 0 ? 0.36 : 0.3;
      b.box(bw, 0.18, 0.005, st, [x, y - 0.09, D / 2 - 0.04]);
      b.box(bw, 0.18, 0.005, st, [x, y - 0.09, -D / 2 + 0.04]);
      b.box(0.005, 0.18, D - 0.08, st, [x - bw / 2, y - 0.09, 0]);
      b.box(0.005, 0.18, D - 0.08, st, [x + bw / 2, y - 0.09, 0]);
      b.box(bw, 0.005, D - 0.08, st, [x, y - 0.18, 0]);
      b.cyl(0.025, 0.025, 0.006, K.chrome(), [x, y - 0.175, 0], null, 16);
    }
    // mixer tap
    const ch = K.chrome();
    b.cyl(0.025, 0.03, 0.06, ch, [0, y + 0.03, -0.18], null, 16);
    b.tube(
      [
        [0, y + 0.05, -0.18],
        [0, y + 0.3, -0.18],
        [0, y + 0.36, -0.12],
        [0, y + 0.32, -0.04]
      ],
      0.012,
      ch,
      20,
      10
    );
    b.box(0.1, 0.012, 0.025, ch, [0, y + 0.08, -0.16], [0, 0, 0.3]);
    // dish rack with plates, a mug, washing-up bottle
    for (let i = 0; i < 4; i++)
      b.cyl(
        0.11,
        0.11,
        0.008,
        K.mat(0xf2f0ea, 0.3),
        [0.2, y - 0.05 + 0.11, -0.06 + i * 0.035],
        [PI / 2 - 0.15, 0, 0],
        24
      );
    b.cyl(0.04, 0.035, 0.09, K.mat(0x2a6ad8, 0.35), [-0.15, y - 0.13, 0.05], null, 14);
    b.cyl(0.03, 0.03, 0.16, K.mat(0x3ad86a, 0.3), [0.45, y + 0.08, -0.15], null, 12);
    b.label(
      0.05,
      0.08,
      K.paint(
        'soap',
        64,
        96,
        (c, W, H) => {
          c.fillStyle = '#3ad86a';
          c.fillRect(0, 0, W, H);
          P.text(c, 'SUDZ', W / 2, H * 0.4, {size: 20, col: '#fff'});
        },
        {}
      ),
      [0.45, y + 0.07, -0.119]
    );
  });

  /* ===== prep table + dish station (commercial kitchen, stainless) ===== */
  K.def(
    'prep_table',
    {label: 'Prep table', table: 'restaurant', items: [1, 3], auto: ['restaurant', 'diner', 'burger', 'takeout']},
    b => {
      const W = 1.8,
        D = 0.7,
        st = steel();
      b.rbox(W, 0.04, D, 0.006, st, [0, 0.9, 0]);
      b.box(W, 0.1, 0.01, st, [0, 0.97, -D / 2 + 0.005]);
      for (const y of [0.25]) b.box(W - 0.1, 0.025, D - 0.1, st, [0, y, 0]);
      for (const x of [-W / 2 + 0.04, W / 2 - 0.04])
        for (const z of [-D / 2 + 0.04, D / 2 - 0.04]) {
          b.cyl(0.02, 0.02, 0.88, st, [x, 0.44, z], null, 12);
          b.cyl(0.026, 0.03, 0.04, K.chrome(), [x, 0.02, z], null, 12);
        }
      // overshelf with heat lamps, chopping boards, stock pot, ladle, ticket rail
      for (const x of [-W / 2 + 0.04, W / 2 - 0.04]) b.cyl(0.015, 0.015, 0.75, st, [x, 1.3, -D / 2 + 0.08], null, 10);
      b.box(W, 0.03, 0.3, st, [0, 1.66, -D / 2 + 0.15]);
      b.rbox(W - 0.1, 0.012, 0.08, 0.004, st, [0, 1.4, -D / 2 + 0.06]);
      b.label(
        W - 0.2,
        0.08,
        K.paint(
          'tickets',
          512,
          48,
          (c, W, H, r) => {
            c.clearRect(0, 0, W, H);
            for (let x = 10; x < W; x += 60 + r() * 30) {
              c.fillStyle = '#fff';
              c.fillRect(x, 0, 44, H);
              c.fillStyle = '#333';
              for (let i = 0; i < 4; i++) c.fillRect(x + 4, 6 + i * 9, 30 + r() * 8, 2);
            }
          },
          {alpha: true}
        ),
        [0, 1.37, -D / 2 + 0.1]
      );
      b.cyl(0.15, 0.14, 0.28, st, [0.55, 1.06, -0.1], null, 20, true);
      b.tor(0.15, 0.01, st, [0.55, 1.2, -0.1], [PI / 2, 0, 0]);
      b.cyl(0.14, 0.14, 0.01, K.mat(0x6a3a1a, 0.3), [0.55, 1.16, -0.1], null, 20);
      b.box(0.5, 0.03, 0.32, K.mat(0xf2f2ee, 0.6), [-0.4, 0.935, 0.05]);
      b.box(0.4, 0.03, 0.28, K.mat(0x3aa86a, 0.6), [-0.38, 0.965, 0.02], [0, 0.2, 0]);
      b.box(0.22, 0.01, 0.04, K.mat(0x1a1a1a, 0.5), [-0.35, 0.985, 0.0], [0, 0.6, 0]);
      b.box(0.12, 0.004, 0.035, K.chrome(), [-0.21, 0.985, 0.06], [0, 0.6, 0]);
      b.tube(
        [
          [0.15, 1.0, 0.1],
          [0.25, 0.95, 0.12],
          [0.35, 0.95, 0.12]
        ],
        0.008,
        K.chrome(),
        12,
        8
      );
      b.sph(0.04, K.chrome(), [0.38, 0.95, 0.12], [1, 0.5, 1]);
    }
  );
  K.def(
    'dish_station',
    {label: 'Dish station', table: 'restaurant', items: [1, 2], auto: ['restaurant', 'diner', 'burger']},
    b => {
      const W = 1.6,
        D = 0.75,
        st = steel();
      b.rbox(W, 0.04, D, 0.006, st, [0, 0.88, 0]);
      b.box(W, 0.25, 0.012, st, [0, 1.0, -D / 2 + 0.006]);
      for (const x of [-W / 2 + 0.04, W / 2 - 0.04])
        for (const z of [-D / 2 + 0.04, D / 2 - 0.04]) b.cyl(0.02, 0.02, 0.86, st, [x, 0.43, z], null, 12);
      b.box(W - 0.1, 0.025, D - 0.1, st, [0, 0.2, 0]);
      // hood-type dishwasher on the left
      b.rbox(0.7, 0.7, 0.68, 0.01, st, [-0.4, 1.25, 0]);
      b.rbox(0.7, 0.12, 0.68, 0.01, st, [-0.4, 1.66, 0]);
      b.handle(0.5, st, [-0.4, 1.48, 0.34], false, 0.05);
      b.label(
        0.24,
        0.08,
        K.paint(
          'dw_panel',
          256,
          80,
          (c, W, H) => {
            c.fillStyle = '#1a1c1e';
            c.fillRect(0, 0, W, H);
            P.text(c, 'WASH 82°', W * 0.35, H * 0.5, {size: 30, col: '#ffb43a', font: "'MFZ Mono',monospace"});
            c.fillStyle = '#3aff6a';
            c.beginPath();
            c.arc(W * 0.82, H * 0.5, 8, 0, PI * 2);
            c.fill();
          },
          {glow: 0.6}
        ),
        [-0.4, 1.66, 0.342]
      );
      // pre-rinse spray arm over the sink basin on the right
      const ch = K.chrome();
      b.box(0.6, 0.2, 0.5, st, [0.45, 0.8, 0]);
      b.cyl(0.012, 0.012, 1.0, ch, [0.55, 1.4, -0.3], null, 10);
      b.tube(
        [
          [0.55, 1.9, -0.3],
          [0.55, 1.95, -0.2],
          [0.5, 1.9, -0.05]
        ],
        0.01,
        ch,
        12,
        8
      );
      b.tube(
        [
          [0.5, 1.88, -0.05],
          [0.42, 1.6, 0.0],
          [0.45, 1.3, 0.02],
          [0.5, 1.12, 0.03]
        ],
        0.008,
        K.mat(0x1a1a1a, 0.4, 0.4),
        24,
        8
      );
      b.cyl(0.03, 0.02, 0.12, ch, [0.5, 1.08, 0.03], null, 12);
      b.tor(0.1, 0.02, K.mat(0x1a1a1a, 0.5, 0.4), [0.5, 1.6, -0.25], [PI / 2, 0, 0]); // spring coil hint
      // racks of plates and cups
      for (let i = 0; i < 7; i++)
        b.cyl(0.12, 0.12, 0.008, K.mat(0xf2f0ea, 0.3), [0.4, 0.98 + 0.12, -0.18 + i * 0.05], [PI / 2, 0, 0], 24);
      b.box(0.5, 0.08, 0.5, K.mat(0x2a4a8a, 0.6), [-0.4, 0.94, 0]);
    }
  );

  /* ===== coffee brewer on a stand ===== */
  K.def('coffee_maker', {label: 'Coffee brewer', table: 'coffee', items: [1, 2], auto: ['coffee', 'office']}, b => {
    const st = steel(),
      blk = K.blackPlastic(),
      gl = K.glass(0x3a2210, 0.55);
    // little cabinet stand
    b.rbox(0.6, 0.74, 0.5, 0.008, K.veneer(0x4a3424), [0, 0.37, 0]);
    b.rbox(0.62, 0.03, 0.52, 0.006, K.surf('concrete', 0x2a2a2a), [0, 0.755, 0]);
    b.rbox(0.56, 0.6, 0.02, 0.004, K.veneer(0x4a3424), [0, 0.38, 0.25]);
    b.knob(K.chrome(), [0.2, 0.5, 0.26], 0.012);
    // brewer
    const y0 = 0.77;
    b.rbox(0.38, 0.08, 0.36, 0.01, st, [0, y0 + 0.04, 0]);
    b.rbox(0.38, 0.46, 0.12, 0.01, st, [0, y0 + 0.31, -0.12]);
    b.rbox(0.38, 0.1, 0.36, 0.01, st, [0, y0 + 0.59, 0]);
    b.rbox(0.16, 0.06, 0.16, 0.02, blk, [0, y0 + 0.52, 0.05]);
    b.cyl(0.06, 0.06, 0.012, K.mat(0x8a0a0a, 0.4), [0.13, y0 + 0.08, 0.12], null, 16);
    b.cyl(0.06, 0.06, 0.012, K.mat(0x8a0a0a, 0.4), [-0.13, y0 + 0.08, 0.12], null, 16); // basket + warmers
    for (const x of [0, 0.17]) {
      const y = x ? y0 + 0.62 : y0 + 0.09;
      b.lathe(
        [
          [0, 0],
          [0.07, 0],
          [0.085, 0.04],
          [0.09, 0.1],
          [0.07, 0.15],
          [0.04, 0.17],
          [0, 0.17]
        ],
        gl,
        [x ? 0.13 : 0, y, x ? 0.1 : 0.05],
        20
      );
      b.cyl(0.045, 0.05, 0.03, blk, [x ? 0.13 : 0, y + 0.17, x ? 0.1 : 0.05], null, 14);
      b.tube(
        [
          [x ? 0.13 : 0, y + 0.14, (x ? 0.1 : 0.05) + 0.06],
          [x ? 0.13 : 0, y + 0.12, (x ? 0.1 : 0.05) + 0.12],
          [x ? 0.13 : 0, y + 0.05, (x ? 0.1 : 0.05) + 0.1]
        ],
        0.012,
        blk,
        10,
        8
      );
    }
    b.label(
      0.32,
      0.1,
      K.paint(
        'brew',
        256,
        80,
        (c, W, H) => {
          c.fillStyle = '#1a1a1a';
          c.fillRect(0, 0, W, H);
          P.text(c, 'BREWMASTER', W / 2, H * 0.38, {size: 28, col: '#d8a03a'});
          c.fillStyle = '#3aff6a';
          c.beginPath();
          c.arc(W * 0.2, H * 0.78, 6, 0, PI * 2);
          c.fill();
          c.fillStyle = '#ff3a2a';
          c.beginPath();
          c.arc(W * 0.8, H * 0.78, 6, 0, PI * 2);
          c.fill();
        },
        {glow: 0.4}
      ),
      [0, y0 + 0.59, 0.181]
    );
    // cups, stirrers, sugar
    for (let i = 0; i < 5; i++) b.cyl(0.04, 0.03, 0.1, K.mat(0xf4f1e8, 0.6), [-0.22, 0.82 + i * 0.02, 0.12], null, 14);
    b.cyl(0.04, 0.03, 0.1, K.mat(0xf4f1e8, 0.6), [0.24, 0.82, 0.15], null, 14);
    b.cyl(0.035, 0.035, 0.006, K.mat(0x2a1408, 0.2), [0.24, 0.865, 0.15], null, 14);
    b.rbox(0.08, 0.1, 0.08, 0.01, K.mat(0xf2f2f2, 0.4), [0.22, 0.82, -0.12]);
  });

  /* ===== washing machine ===== */
  K.def(
    'washing_machine',
    {label: 'Washing machine', table: 'laundromat', items: [1, 2], auto: ['laundromat', 'house']},
    b => {
      const W = 0.6,
        H = 0.85,
        D = 0.6,
        body = enamel(0xf2f2f0),
        ch = K.chrome();
      b.rbox(W, H, D, 0.02, body, [0, H / 2, 0], null, 3);
      b.rbox(W - 0.004, 0.12, 0.04, 0.01, body, [0, H - 0.07, D / 2 - 0.01]);
      b.label(
        W - 0.04,
        0.1,
        K.paint(
          'wm_panel',
          512,
          88,
          (c, W, H, r) => {
            c.fillStyle = '#e8e8e6';
            c.fillRect(0, 0, W, H);
            c.fillStyle = '#d4d6d8';
            c.fillRect(0, 0, 160, H);
            P.text(c, 'AQUAMAX 1400', 80, H * 0.3, {size: 20, col: '#2a4a8a'});
            c.fillStyle = '#ccc';
            c.fillRect(20, H * 0.55, 120, 24);
            c.fillStyle = '#1a1a1a';
            c.fillRect(200, H * 0.2, 130, H * 0.6);
            P.text(c, '0:58', 265, H * 0.5, {size: 36, col: '#58c8ff', font: "'MFZ Mono',monospace"});
            ['COTTON', 'SYNTH', 'WOOL', 'QUICK', 'RINSE', 'SPIN'].forEach((s, i) => {
              const a = -PI * 0.8 + i * PI * 0.32,
                x = 430 + Math.cos(a) * 48,
                y = H / 2 + Math.sin(a) * 32;
              P.text(c, s, x, y, {size: 11, col: '#333'});
            });
          },
          {glow: 0.15, r: 0.4}
        ),
        [0, H - 0.07, D / 2 + 0.011]
      );
      b.cyl(0.04, 0.04, 0.03, K.mat(0xd8d8d8, 0.3, 0.2), [0.2, H - 0.07, D / 2 + 0.02], [PI / 2, 0, 0], 24);
      b.box(0.006, 0.03, 0.01, K.mat(0x333, 0.5), [0.2, H - 0.055, D / 2 + 0.037]); // program dial
      // the door: chrome ring, tinted glass bowl, gasket
      const z = D / 2;
      b.tor(0.19, 0.025, ch, [0, 0.42, z + 0.02], null, null, 36);
      b.tor(0.16, 0.02, K.mat(0xc8cacc, 0.35, 0.3), [0, 0.42, z + 0.03], null, null, 32);
      b.add(K.sphGeo(0.16, 24, 12, 0, PI / 2), K.glass(0x8aa0b0, 0.45), {
        p: [0, 0.42, z + 0.01],
        r: [PI / 2, 0, 0],
        s: [1, 0.35, 1]
      });
      b.tor(0.16, 0.03, K.rubber(), [0, 0.42, z], null, null, 28);
      b.rbox(0.05, 0.12, 0.03, 0.01, ch, [0.2, 0.42, z + 0.04]);
      b.label(
        0.12,
        0.1,
        K.paint(
          'wm_soap',
          128,
          104,
          (c, W, H) => {
            c.fillStyle = '#d8d8d6';
            c.fillRect(0, 0, W, H);
            for (let i = 0; i < 3; i++) {
              c.fillStyle = '#bbb';
              c.fillRect(8 + i * 40, 30, 32, 60);
            }
          },
          {}
        ),
        [-0.2, H - 0.07, D / 2 + 0.012]
      );
      b.vents(5, W - 0.12, 0.06, K.mat(0xc8c8c8, 0.5), [0, 0.06, D / 2 + 0.003], false);
      // laundry visible behind the glass
      for (let i = 0; i < 6; i++)
        b.sph(
          0.06,
          K.surf('linge', [0x3a5a8a, 0xe8e2d6, 0xc83a3a, 0x3a8a5a][i % 4]),
          [((i % 3) - 1) * 0.07, 0.36 + Math.floor(i / 3) * 0.07, z - 0.06],
          [1, 0.7, 1.2]
        );
    }
  );

  /* ===== drinks cooler (glass door merchandiser) ===== */
  const bottles = K.paint(
    'bottles',
    512,
    1024,
    (c, W, H, r) => {
      c.fillStyle = '#e8eef2';
      c.fillRect(0, 0, W, H);
      const rows = 5,
        rh = H / rows;
      for (let y = 0; y < rows; y++) {
        let x = 8;
        while (x < W - 30) {
          const col = ['#c8302a', '#2a6ad8', '#f2c12e', '#3ab86a', '#f4f4f0', '#7a3ab0'][Math.floor(r() * 6)],
            bw = 30 + r() * 10,
            bh = rh * (0.6 + r() * 0.25),
            y0 = y * rh + rh - 6;
          c.fillStyle = 'rgba(30,30,30,.25)';
          c.fillRect(x + 3, y0 - bh + 2, bw, bh);
          c.fillStyle = col;
          P.rrect(c, x, y0 - bh * 0.72, bw, bh * 0.72, 6);
          c.fill();
          c.fillRect(x + bw * 0.32, y0 - bh, bw * 0.36, bh * 0.3);
          c.fillStyle = '#ddd';
          c.fillRect(x + bw * 0.3, y0 - bh - 4, bw * 0.4, 6);
          c.fillStyle = 'rgba(255,255,255,.85)';
          c.fillRect(x + 3, y0 - bh * 0.5, bw - 6, bh * 0.18);
          c.fillStyle = 'rgba(255,255,255,.35)';
          c.fillRect(x + 4, y0 - bh * 0.7, 4, bh * 0.6);
          x += bw + 6;
        }
        c.fillStyle = '#b8c0c6';
        c.fillRect(0, y * rh + rh - 6, W, 6);
        c.fillStyle = '#f6f6f0';
        c.fillRect(0, y * rh + rh - 14, W, 8);
      }
      c.fillStyle = 'rgba(255,255,255,.12)';
      c.fillRect(0, 0, W, H);
    },
    {glow: 0.35, r: 0.5}
  );
  K.def(
    'drinks_cooler',
    {
      label: 'Drinks cooler',
      table: 'convenience',
      items: [1, 3],
      auto: ['convenience', 'gas', 'liquor', 'supermarket']
    },
    b => {
      const W = 0.72,
        H = 2.0,
        D = 0.72,
        body = K.paintSteel(0x1a1c1e, {m: 0.4}),
        ch = K.chrome();
      b.rbox(W, H, D, 0.01, body, [0, H / 2, 0]);
      b.rbox(W - 0.004, 1.6, 0.05, 0.01, K.mat(0x202224, 0.4, 0.6), [0, 0.98, D / 2 + 0.02]);
      b.label(W - 0.1, 1.5, bottles, [0, 0.98, D / 2 + 0.0452]);
      b.plane(W - 0.1, 1.5, K.glass(0xdaeef8, 0.22), [0, 0.98, D / 2 + 0.047]);
      b.box(0.03, 0.9, 0.035, ch, [W / 2 - 0.07, 0.98, D / 2 + 0.06], null, 0.01);
      b.label(
        W - 0.04,
        0.24,
        K.paint(
          'cool_head',
          512,
          170,
          (c, W, H, r) => {
            const g = c.createLinearGradient(0, 0, W, 0);
            g.addColorStop(0, '#b0221a');
            g.addColorStop(1, '#e8402a');
            c.fillStyle = g;
            c.fillRect(0, 0, W, H);
            P.text(c, 'ICE COLD', W / 2, H * 0.4, {size: 72, col: '#fff', stroke: '#600', lw: 4});
            P.text(c, 'DRINKS', W / 2, H * 0.8, {size: 40, col: '#ffe9a8', ls: 8});
          },
          {glow: 0.7, r: 0.3}
        ),
        [0, 1.89, D / 2 + 0.001]
      );
      b.vents(5, W - 0.1, 0.1, K.mat(0x2a2a2a, 0.6, 0.4), [0, 0.08, D / 2 + 0.004], false);
    }
  );

  /* ===== vending machines (our own brands) ===== */
  function brandPanel(key, o) {
    return K.paint(
      'vend_' + key,
      512,
      1024,
      (c, W, H, r) => {
        const g = c.createLinearGradient(0, 0, W, H);
        g.addColorStop(0, o.c1);
        g.addColorStop(1, o.c2);
        c.fillStyle = g;
        c.fillRect(0, 0, W, H);
        // big swoosh + condensation drops + the product
        c.fillStyle = 'rgba(255,255,255,.12)';
        c.beginPath();
        c.moveTo(0, H * 0.55);
        c.bezierCurveTo(W * 0.4, H * 0.35, W * 0.6, H * 0.8, W, H * 0.5);
        c.lineTo(W, H * 0.62);
        c.bezierCurveTo(W * 0.6, H * 0.9, W * 0.4, H * 0.45, 0, H * 0.67);
        c.fill();
        c.save();
        c.translate(W * 0.5, H * 0.55);
        c.rotate(-0.12);
        const bw = 150,
          bh = 420;
        const bg = c.createLinearGradient(-bw / 2, 0, bw / 2, 0);
        bg.addColorStop(0, o.can1);
        bg.addColorStop(0.45, o.can2);
        bg.addColorStop(1, o.can1);
        c.fillStyle = bg;
        P.rrect(c, -bw / 2, -bh / 2, bw, bh, 30);
        c.fill();
        c.fillStyle = '#d8d8d8';
        c.fillRect(-bw / 2 + 10, -bh / 2 - 12, bw - 20, 16);
        c.fillStyle = 'rgba(255,255,255,.85)';
        c.fillRect(-bw / 2, -40, bw, 80);
        P.text(c, o.name.split(' ')[0], 0, 0, {size: 44, col: o.ink, font: "'MFZ Head',sans-serif", max: bw - 14});
        for (let i = 0; i < 60; i++) {
          c.fillStyle = 'rgba(255,255,255,' + (0.25 + r() * 0.5) + ')';
          c.beginPath();
          c.ellipse(-bw / 2 + r() * bw, -bh / 2 + r() * bh, 2 + r() * 3, 3 + r() * 4, 0, 0, PI * 2);
          c.fill();
        }
        c.restore();
        P.text(c, o.name, W / 2, H * 0.12, {
          size: 96,
          col: '#fff',
          stroke: 'rgba(0,0,0,.4)',
          lw: 6,
          max: W * 0.92,
          font: "'MFZ Head',sans-serif"
        });
        P.text(c, o.tag, W / 2, H * 0.2, {size: 30, col: o.tagCol || '#fff', ls: 3, max: W * 0.9});
        P.text(c, 'ICE COLD  •  ' + o.price, W / 2, H * 0.93, {size: 34, col: '#fff', max: W * 0.9});
        P.scratches(c, W, H, r, 80);
        P.grime(c, W, H, r, 0.5);
      },
      {glow: 0.55, r: 0.35}
    );
  }
  const BRANDS = {
    blitz: {
      name: 'BLITZ COLA',
      tag: 'THE BIG FIZZ',
      c1: '#a0110c',
      c2: '#e83020',
      can1: '#8a0a08',
      can2: '#e8302a',
      ink: '#a0110c',
      price: '75¢'
    },
    polar: {
      name: 'POLAR POP',
      tag: 'ARCTIC BLAST',
      c1: '#0c3a8a',
      c2: '#3a9ae8',
      can1: '#0c3a8a',
      can2: '#5ab8ff',
      ink: '#0c3a8a',
      price: '75¢'
    },
    zest: {
      name: 'ZEST-O',
      tag: 'SUNSHINE IN A CAN',
      c1: '#e89a0c',
      c2: '#f8e04a',
      can1: '#c87a0a',
      can2: '#ffe25a',
      ink: '#c85a0a',
      price: '60¢',
      tagCol: '#6a2a0a'
    },
    rocket: {
      name: 'GREEN ROCKET',
      tag: 'LIFT OFF!',
      c1: '#0e5a2a',
      c2: '#4ad84a',
      can1: '#0e5a2a',
      can2: '#6af06a',
      ink: '#0e5a2a',
      price: '80¢'
    }
  };
  const keypad = K.paint(
    'vend_keys',
    256,
    512,
    (c, W, H, r) => {
      c.fillStyle = '#1c1e20';
      c.fillRect(0, 0, W, H);
      c.fillStyle = '#0a140a';
      c.fillRect(20, 20, W - 40, 60);
      P.text(c, 'INSERT COIN', W / 2, 50, {size: 26, col: '#ff4a2a', font: "'MFZ Mono',monospace"});
      c.fillStyle = '#2a2c2e';
      c.fillRect(30, 100, W - 60, 120);
      c.fillStyle = '#0a0a0a';
      c.fillRect(W / 2 - 10, 120, 20, 80);
      P.text(c, 'COINS', W / 2, 232, {size: 16, col: '#aaa'});
      c.fillStyle = '#2a2c2e';
      c.fillRect(40, 260, W - 80, 30);
      c.fillStyle = '#000';
      c.fillRect(50, 270, W - 100, 8);
      P.text(c, '$1 $5', W / 2, 304, {size: 14, col: '#aaa'});
      for (let i = 0; i < 6; i++) {
        const y = 330 + i * 28;
        c.fillStyle = '#d8d8d8';
        P.rrect(c, 60, y, W - 120, 22, 6);
        c.fill();
        P.text(c, 'SELECT ' + (i + 1), W / 2, y + 11, {size: 13, col: '#222'});
      }
      P.scratches(c, W, H, r, 30);
    },
    {glow: 0.25, r: 0.4}
  );
  function sodaMachine(b, brand) {
    const W = 0.98,
      H = 1.85,
      D = 0.82,
      o = BRANDS[brand],
      body = K.paintSteel(0x2a2c2e, {m: 0.4, worn: true}),
      ch = K.chrome();
    b.rbox(W, H, D, 0.02, body, [0, H / 2, 0]);
    b.rbox(W * 0.72, H - 0.12, 0.03, 0.01, K.mat(0x111111, 0.3, 0.4), [-W * 0.13, H / 2 + 0.02, D / 2 + 0.01]);
    b.label(W * 0.68, H - 0.2, brandPanel(brand, o), [-W * 0.13, H / 2 + 0.02, D / 2 + 0.0256]);
    b.plane(W * 0.68, H - 0.2, K.glass(0xffffff, 0.1), [-W * 0.13, H / 2 + 0.02, D / 2 + 0.0262]);
    b.label(W * 0.23, H * 0.5, keypad, [W * 0.375, H * 0.6, D / 2 + 0.001]);
    b.rbox(0.18, 0.12, 0.04, 0.01, K.mat(0x1a1a1a, 0.4, 0.6), [W * 0.375, 0.3, D / 2 + 0.01]);
    b.label(0.14, 0.07, K.mat(0x050505, 0.9), [W * 0.375, 0.3, D / 2 + 0.031]); // can flap
    b.cyl(0.012, 0.012, 0.02, ch, [W * 0.375, 0.95, D / 2 + 0.01], [PI / 2, 0, 0], 12);
    b.box(0.1, 0.04, 0.03, ch, [W * 0.375, 0.55, D / 2 + 0.015], null, 0.006); // coin return
    b.box(W, 0.06, D, K.mat(0x111111, 0.8), [0, 0.03, 0]);
    b.vents(4, W * 0.3, 0.06, K.mat(0x1a1a1a, 0.5, 0.5), [W * 0.375, 0.09, D / 2 + 0.003], false);
    for (const x of [-W / 2, W / 2])
      b.box(0.012, H - 0.04, D - 0.04, K.paintSteel(parseInt(o.c1.slice(1), 16), {m: 0.35, worn: true}), [
        x + (x > 0 ? 0.001 : -0.001),
        H / 2,
        0
      ]); // brand-coloured sides
    b.label(
      D * 0.7,
      H * 0.35,
      K.paint(
        'vend_side_' + brand,
        256,
        512,
        (c, W, H, r) => {
          c.clearRect(0, 0, W, H);
          c.save();
          c.translate(W / 2, H / 2);
          c.rotate(-PI / 2);
          P.text(c, o.name, 0, 0, {
            size: 90,
            col: 'rgba(255,255,255,.85)',
            max: H * 0.95,
            font: "'MFZ Head',sans-serif"
          });
          c.restore();
          P.scratches(c, W, H, r, 40);
        },
        {alpha: true, r: 0.4}
      ),
      [W / 2 + 0.008, H * 0.62, 0],
      [0, PI / 2, 0]
    );
  }
  K.def(
    'vending_blitz',
    {
      label: 'Blitz Cola machine',
      table: 'convenience',
      items: [1, 3],
      auto: ['gas', 'convenience', 'school', 'motel', 'bowling', 'cinema', 'laundromat']
    },
    b => sodaMachine(b, 'blitz')
  );
  K.def(
    'vending_polar',
    {
      label: 'Polar Pop machine',
      table: 'convenience',
      items: [1, 3],
      auto: ['gas', 'convenience', 'school', 'motel', 'bowling', 'cinema']
    },
    b => sodaMachine(b, 'polar')
  );
  K.def(
    'vending_zest',
    {label: 'Zest-O machine', table: 'convenience', items: [1, 3], auto: ['gas', 'convenience', 'school', 'cinema']},
    b => sodaMachine(b, 'zest')
  );
  K.def(
    'vending_rocket',
    {
      label: 'Green Rocket machine',
      table: 'convenience',
      items: [1, 3],
      auto: ['gas', 'convenience', 'school', 'motel', 'bowling']
    },
    b => sodaMachine(b, 'rocket')
  );
  // snack machine: glass front, spiral coils with individually painted packets
  K.def(
    'vending_snack',
    {
      label: 'Snack machine',
      table: 'convenience',
      items: [1, 3],
      auto: ['gas', 'convenience', 'school', 'office', 'motel', 'bowling', 'cinema', 'laundromat']
    },
    b => {
      const W = 0.95,
        H = 1.85,
        D = 0.85,
        body = K.paintSteel(0x26292c, {m: 0.4, worn: true}),
        ch = K.chrome(),
        rnd = b.rnd;
      const cx = -W * 0.13,
        cw = W * 0.72,
        ch0 = H * 0.7;
      b.rbox(W, H, 0.04, 0.01, body, [0, H / 2, -D / 2 + 0.02]);
      for (const x of [-W / 2 + 0.02, W / 2 - 0.02]) b.rbox(0.04, H, D, 0.01, body, [x, H / 2, 0]);
      b.rbox(W, 0.06, D, 0.01, body, [0, H - 0.03, 0]);
      b.rbox(W, 1.1 - ch0 / 2, D, 0.01, body, [0, (1.1 - ch0 / 2) / 2, 0]);
      b.rbox(W, H - (1.1 + ch0 / 2), D, 0.01, body, [0, (H + 1.1 + ch0 / 2) / 2, 0]);
      b.rbox(W - cw - 0.04, ch0, D, 0.01, body, [W / 2 - (W - cw - 0.04) / 2 - 0.02, 1.1, 0]);
      b.box(cw, ch0, 0.01, K.mat(0xdfe2e4, 0.5, 0.2), [cx, 1.1, -D / 2 + 0.045]);
      for (const x of [cx - cw / 2 + 0.02, cx + cw / 2 - 0.02])
        b.cyl(
          0.012,
          0.012,
          ch0 - 0.04,
          K.mat(0xffffff, 0.3, 0, {emissive: 0xe8f4ff, emissiveIntensity: 0.9}),
          [x, 1.1, D / 2 - 0.06],
          null,
          8
        ); // fluorescent tubes either side
      const snacks = [
        ['CRUNCHOS', '#e8402a', '#ffe25a'],
        ['MOON PIES', '#3a2a8a', '#ffd8a8'],
        ['SALTY JOE', '#2a6ad8', '#fff'],
        ['CHOCO BAR', '#5a2a14', '#f2c12e'],
        ['NUTZ', '#e8a02a', '#3a1a0a'],
        ['MINTZ', '#2ab8a0', '#fff'],
        ['CHEEZ', '#f2a01a', '#c8102a'],
        ['JERKY', '#7a2a14', '#f4f1e8']
      ];
      const shelves = 6,
        sw = W * 0.66,
        sh = (H * 0.62) / shelves;
      for (let s = 0; s < shelves; s++) {
        const y = 0.5 + s * sh + sh * 0.1;
        b.box(sw, 0.008, D - 0.2, K.mat(0x3a3c3e, 0.4, 0.6), [-W * 0.13, y, 0]);
        b.label(
          sw,
          0.03,
          K.paint(
            'vend_sh' + s,
            512,
            24,
            (c, W, H) => {
              c.fillStyle = '#1a1a1a';
              c.fillRect(0, 0, W, H);
              for (let i = 0; i < 5; i++)
                P.text(c, String.fromCharCode(65 + s) + (i + 1) + '  $1.' + (i * 10 + 25), (W * (i + 0.5)) / 5, H / 2, {
                  size: 14,
                  col: '#ffd23a',
                  font: "'MFZ Mono',monospace"
                });
            },
            {glow: 0.5}
          ),
          [-W * 0.13, y - 0.01, D / 2 - 0.09]
        );
        for (let i = 0; i < 5; i++) {
          const x = -W * 0.13 - sw / 2 + (sw * (i + 0.5)) / 5,
            sk = snacks[(s * 5 + i * 3) % snacks.length],
            key = 'snk' + ((s * 5 + i * 3) % snacks.length);
          b.add(K.torGeo(0.035, 0.003, 4, 10), ch, {p: [x, y + 0.045, -0.1], r: [0, 0, 0], s: [1, 1, 1]});
          for (let k = 0; k < 4; k++) b.add(K.torGeo(0.035, 0.003, 4, 10), ch, {p: [x, y + 0.045, -0.2 + k * 0.08]});
          const pm = K.paint(
            key,
            128,
            160,
            (c, W, H, r) => {
              c.fillStyle = sk[1];
              c.fillRect(0, 0, W, H);
              c.fillStyle = 'rgba(255,255,255,.25)';
              c.beginPath();
              c.moveTo(0, 0);
              c.lineTo(W, 0);
              c.lineTo(0, H * 0.5);
              c.fill();
              P.text(c, sk[0], W / 2, H * 0.45, {
                size: 24,
                col: sk[2],
                max: W * 0.92,
                stroke: 'rgba(0,0,0,.35)',
                lw: 3
              });
              c.fillStyle = sk[2];
              c.beginPath();
              c.arc(W / 2, H * 0.72, 18, 0, PI * 2);
              c.fill();
              c.fillStyle = 'rgba(0,0,0,.25)';
              c.fillRect(0, 0, W, 6);
              c.fillRect(0, H - 6, W, 6);
            },
            {r: 0.45}
          );
          if (rnd() < 0.85)
            for (let k = 0; k < 4; k++)
              b.add(K.rboxGeo(0.11, sh * 0.82, 0.03, 0.008, 1), pm, {
                p: [x, y + sh * 0.44, 0.2 - k * 0.09],
                r: [-0.12, 0, (rnd() - 0.5) * 0.08]
              });
        }
      }
      b.plane(W * 0.7, H * 0.68, K.glass(0xd8eef8, 0.16), [-W * 0.13, 1.1, D / 2 + 0.002]);
      b.frame(W * 0.72, H * 0.7, 0.03, K.mat(0x1a1a1a, 0.4, 0.5), [-W * 0.13, 1.1, D / 2 + 0.006], 0.012);
      b.label(
        W * 0.7,
        0.18,
        K.paint(
          'snack_head',
          512,
          128,
          (c, W, H, r) => {
            const g = c.createLinearGradient(0, 0, W, 0);
            g.addColorStop(0, '#f2a01a');
            g.addColorStop(1, '#e8402a');
            c.fillStyle = g;
            c.fillRect(0, 0, W, H);
            P.text(c, 'SNAX ATTAX', W / 2, H / 2, {
              size: 76,
              col: '#fff',
              stroke: '#5a1a0a',
              lw: 5,
              font: "'MFZ Head',sans-serif"
            });
            P.scratches(c, W, H, r, 30);
          },
          {glow: 0.6, r: 0.3}
        ),
        [-W * 0.13, H - 0.12, D / 2 + 0.001]
      );
      b.label(W * 0.23, H * 0.5, keypad, [W * 0.375, H * 0.6, D / 2 + 0.001]);
      b.box(W * 0.66, 0.16, 0.05, K.mat(0x111111, 0.6), [-W * 0.13, 0.28, D / 2 - 0.02]);
      b.box(W * 0.6, 0.12, 0.02, K.mat(0x1a1a1a, 0.4, 0.6), [-W * 0.13, 0.28, D / 2 + 0.012]);
      b.box(W, 0.06, D, K.mat(0x111111, 0.8), [0, 0.03, 0]);
    }
  );

  /* ===== cash register (on a little counter stand) ===== */
  K.def(
    'cash_register',
    {
      label: 'Cash register',
      table: 'convenience',
      items: [1, 3],
      auto: ['convenience', 'gas', 'liquor', 'pawn', 'pharmacy', 'clothing', 'bakery', 'coffee', 'takeout', 'burger']
    },
    b => {
      const body = K.paintSteel(0x3a3d42, {m: 0.3}),
        blk = K.blackPlastic(),
        ch = K.chrome();
      b.rbox(0.7, 0.72, 0.5, 0.01, K.veneer(0x5a4030), [0, 0.36, 0]);
      b.rbox(0.72, 0.03, 0.52, 0.006, K.surf('concrete', 0x3a3a3a), [0, 0.735, 0]);
      b.frame(0.64, 0.6, 0.03, K.veneer(0x5a4030), [0, 0.38, 0.252]);
      const y = 0.75;
      b.rbox(0.42, 0.1, 0.4, 0.012, body, [0, y + 0.05, 0]);
      b.rbox(0.4, 0.08, 0.02, 0.006, body, [0, y + 0.04, 0.2]);
      b.handle(0.12, ch, [0, y + 0.03, 0.21], false, 0.02); // cash drawer
      b.add(K.rboxGeo(0.42, 0.08, 0.26, 0.012, 2), body, {p: [0, y + 0.13, -0.02], r: [-0.32, 0, 0]});
      b.label(
        0.38,
        0.22,
        K.paint(
          'reg_keys',
          512,
          300,
          (c, W, H, r) => {
            c.fillStyle = '#2a2c30';
            c.fillRect(0, 0, W, H);
            const keys = ['7', '8', '9', 'QTY', '4', '5', '6', 'VOID', '1', '2', '3', 'SUB', '0', '00', '.', 'TOTAL'];
            keys.forEach((k, i) => {
              const x = 20 + ((i % 4) * (W - 40)) / 4,
                yy = 20 + (Math.floor(i / 4) * (H - 40)) / 4,
                w = (W - 40) / 4 - 12,
                h = (H - 40) / 4 - 12;
              c.fillStyle = i % 4 === 3 ? (k === 'TOTAL' ? '#2a9a3a' : '#c8302a') : '#e8e6de';
              P.rrect(c, x, yy, w, h, 8);
              c.fill();
              c.fillStyle = 'rgba(0,0,0,.25)';
              c.fillRect(x + 3, yy + h - 6, w - 6, 4);
              P.text(c, k, x + w / 2, yy + h / 2, {
                size: k.length > 2 ? 22 : 34,
                col: i % 4 === 3 ? '#fff' : '#222',
                font: "'MFZ Mono',monospace"
              });
            });
            P.scratches(c, W, H, r, 30);
          },
          {r: 0.5}
        ),
        [0, y + 0.135, 0.03],
        [-0.32, 0, 0]
      );
      // customer + cashier displays on a pole, receipt printer
      b.cyl(0.015, 0.015, 0.22, ch, [0.0, y + 0.28, -0.15], null, 10);
      b.rbox(0.26, 0.08, 0.05, 0.008, blk, [0, y + 0.42, -0.15]);
      for (const [z, ry] of [
        [-0.124, 0],
        [-0.176, PI]
      ])
        b.label(
          0.22,
          0.05,
          K.paint(
            'reg_disp',
            256,
            56,
            (c, W, H) => {
              c.fillStyle = '#061006';
              c.fillRect(0, 0, W, H);
              P.text(c, 'TOTAL  12.47', W / 2, H / 2, {size: 30, col: '#3aff6a', font: "'MFZ Mono',monospace"});
            },
            {glow: 0.9}
          ),
          [0, y + 0.42, z],
          [0, ry, 0]
        );
      b.rbox(0.14, 0.1, 0.16, 0.01, K.mat(0xd8d8d4, 0.4), [0.24, y + 0.1, -0.08]);
      b.box(0.07, 0.12, 0.002, K.mat(0xfffdf6, 0.8), [0.24, y + 0.2, -0.04], [-0.4, 0, 0]);
      b.label(
        0.2,
        0.12,
        K.paint(
          'reg_note',
          200,
          120,
          (c, W, H, r) => {
            c.fillStyle = '#fff69a';
            c.fillRect(0, 0, W, H);
            c.font = "20px 'MFZ Type',serif";
            c.fillStyle = '#223';
            c.textAlign = 'left';
            c.fillText('NO CHECKS', 14, 40);
            c.fillText('cash only!', 14, 76);
          },
          {}
        ),
        [-0.2, 0.55, 0.256],
        [0, 0, 0.05]
      );
    }
  );

  /* ===== dry goods ===== */
  function cereal(b, name, c1, c2, mascot, w, h, d, rot) {
    const m = K.paint(
      'cer_' + name,
      256,
      360,
      (c, W, H, r) => {
        const g = c.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, c1);
        g.addColorStop(1, c2);
        c.fillStyle = g;
        c.fillRect(0, 0, W, H);
        P.text(c, name, W / 2, H * 0.15, {size: 54, col: '#fff', stroke: 'rgba(0,0,0,.45)', lw: 5, max: W * 0.92});
        c.fillStyle = '#f4f1e8';
        c.beginPath();
        c.ellipse(W / 2, H * 0.62, W * 0.36, H * 0.2, 0, 0, PI * 2);
        c.fill();
        c.fillStyle = mascot;
        for (let i = 0; i < 14; i++) {
          c.beginPath();
          c.arc(W / 2 + (r() - 0.5) * W * 0.5, H * 0.6 + (r() - 0.5) * H * 0.2, 8 + r() * 6, 0, PI * 2);
          c.fill();
        }
        c.strokeStyle = '#aaa';
        c.lineWidth = 4;
        c.beginPath();
        c.ellipse(W / 2, H * 0.62, W * 0.36, H * 0.2, 0, 0, PI * 2);
        c.stroke();
        P.text(c, 'NET WT 18 OZ', W / 2, H * 0.93, {size: 16, col: '#fff'});
        c.fillStyle = '#f2c12e';
        c.beginPath();
        c.arc(W * 0.82, H * 0.33, 22, 0, PI * 2);
        c.fill();
        P.text(c, 'NEW!', W * 0.82, H * 0.33, {size: 16, col: '#a0110c'});
        P.grime(c, W, H, r, 0.3);
      },
      {r: 0.55}
    );
    b.add(K.rboxGeo(w, h, d, 0.003, 1), K.surf('cardboard', parseInt(c2.slice(1), 16)), {
      p: [0, h / 2, 0],
      r: [0, rot || 0, 0]
    });
    b.label(
      w * 0.98,
      h * 0.98,
      m,
      [Math.sin(rot || 0) * (d / 2 + 0.001), h / 2, Math.cos(rot || 0) * (d / 2 + 0.001)],
      [0, rot || 0, 0]
    );
  }
  K.def(
    'dry_goods_cereal',
    {label: 'Box of cereal', table: 'supermarket', items: [1, 1], auto: ['supermarket', 'convenience']},
    b => {
      cereal(b, 'OATY-OS', '#e8b02a', '#c8761a', '#a0601a', 0.2, 0.29, 0.07);
    }
  );
  K.def(
    'dry_goods_case',
    {label: 'Case of dry goods', table: 'supermarket', items: [1, 2], auto: ['supermarket', 'convenience']},
    b => {
      const card = K.surf('cardboard', 0xb38a58);
      b.rbox(0.4, 0.2, 0.28, 0.006, card, [0, 0.1, 0]);
      b.label(
        0.38,
        0.18,
        K.paint(
          'case_print',
          256,
          120,
          (c, W, H, r) => {
            c.fillStyle = '#b48a56';
            c.fillRect(0, 0, W, H);
            P.text(c, 'RICE  -  LONG GRAIN', W / 2, H * 0.35, {size: 24, col: '#2a3a6a', max: W * 0.9});
            P.text(c, '12 x 2 LB', W / 2, H * 0.65, {size: 22, col: '#3a2a1a'});
            P.grime(c, W, H, r, 0.5);
          },
          {r: 0.9}
        ),
        [0, 0.1, 0.141]
      );
      // open top showing bags of rice
      for (let i = 0; i < 3; i++)
        b.rbox(0.11, 0.08, 0.22, 0.03, K.surf('linge', 0xece6d6), [-0.12 + i * 0.12, 0.22, 0], [0, 0, (i - 1) * 0.15]);
    }
  );
  K.def(
    'dry_goods_pack',
    {label: 'Breakfast cereal x3', table: 'supermarket', items: [1, 1], auto: ['supermarket']},
    b => {
      b.push([-0.12, 0, 0]);
      cereal(b, 'CHOCO-BOMBS', '#5a2a14', '#2a1408', '#c88a3a', 0.2, 0.29, 0.07, 0.1);
      b.pop();
      b.push([0.12, 0, 0.02]);
      cereal(b, 'FROSTED STARS', '#2a6ad8', '#1a3a8a', '#f2c12e', 0.2, 0.29, 0.07, -0.08);
      b.pop();
      b.push([0, 0, -0.08], [0, 0, 0]);
      cereal(b, 'OATY-OS', '#e8b02a', '#c8761a', '#a0601a', 0.2, 0.29, 0.07, 0);
      b.pop();
    }
  );
})();
