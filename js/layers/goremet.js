/* ==========================================================================================================
   MINI FORT ZOMBIE - GORE-MET FOODS (v089): a full-block gourmet grocery & butcher (40 x 36 m plot, front = +Z), our own design.
   Replaces the Lucky Ducky placeholder (core NEWCAT id lucky_ducky).
   Exterior: a 26 x 18 m single-storey store. White render over a red brick plinth, a parapet with coping, a big red-and-white striped
   awning over the shopfront with the GORE-MET FOODS logo (chef's toque, cleaver, dripping lettering), window posters, sliding glass
   front doors, a pylon sign, a front walk with benches, an ice chest, a cart corral and an outdoor produce stand. Parking in front and
   down the right, with wheel stops and two parked cars. Behind: the delivery yard (roller-shutter dock, bumpers, a box truck, dumpster,
   pallets, bin bags), a hedge down the left. Sidewalk: street lights, meters, hydrant, no-parking sign.
   Interior: a large shop floor (blue / white checkerboard, cream walls with a red and gold band, drop ceiling with fluorescent
   troffers): produce stands, gondola aisles, wall shelves, chest freezers, drinks coolers, a dairy wall, three checkout lanes, and the
   GORE-MET BUTCHERY counter with a lit meat case. Behind: a walk-in meat cooler (hanging sides on a rail), a staff toilet, a small office
   (desk, files, CCTV, safe, lockers) and the stock room / receiving bay (pallet racking, pallets, a baler, pallet jack, roller shutters).
   Structure from core WL (doors / windows work); detail is our own geometry and painted artwork, outside the static merge.
   ========================================================================================================== */
(function () {
  'use strict';
  const K = window.MFZK,
    LK = window.LOTKIT;
  if (!K || !LK || typeof WL !== 'function' || typeof NEWCAT === 'undefined') {
    console.warn('[goremet] core / prop kit missing');
    return;
  }
  const T = THREE,
    P = K.P,
    PI = Math.PI;
  // the store box, the back partitions, heights
  const X0 = -18,
    X1 = 8,
    Z0 = -12,
    Z1 = 6,
    PZ = -4, // shop floor / back of house
    PX = -9, // office + toilet | stock room
    PZ2 = -7, // office | cooler + toilet
    CX = -12, // cooler | toilet
    H = 5.2,
    CEIL = 3.8;
  const RED = '#c8202a',
    CREAM = '#fff4dc',
    GRN = '#1f4a2c';
  const FRONT = [
    {k: 'w', c: -16.6},
    {k: 'w', c: -15.0},
    {k: 'w', c: -13.4},
    {k: 'w', c: -11.8},
    {k: 'w', c: -10.2},
    {k: 'w', c: -8.6},
    {k: 'd', c: -5.65, dbl: 'slide'},
    {k: 'd', c: -4.35, dbl: 'slide'},
    {k: 'w', c: -1.4},
    {k: 'w', c: 0.2},
    {k: 'w', c: 1.8},
    {k: 'w', c: 3.4},
    {k: 'w', c: 5.0},
    {k: 'w', c: 6.6}
  ];
  const RIGHT = [
    {k: 'w', c: 4.4},
    {k: 'w', c: 2.8},
    {k: 'd', c: -9.6, s: -1}
  ];
  const BACK = [
    {k: 'g', c: 0.8},
    {k: 'g', c: 2.4},
    {k: 'd', c: 5.8, s: -1}
  ];
  const PART = [
      {k: 'd', c: -16},
      {k: 'd', c: 3.35, dbl: 'swing'},
      {k: 'd', c: 4.65, dbl: 'swing'}
    ],
    PARTX = [
      {k: 'd', c: -10},
      {k: 'd', c: -5.6}
    ];

  /* ===================== loot tables ===================== */
  // the shop floor uses the core 'supermarket', 'butcher', 'bakery' and 'convenience' tables; these cover the back of house
  try {
    Object.assign(LOOT_TABLES, {
      goremet_stock: {
        kenball_soup: 4,
        pizan_pasta: 3,
        ramen_noodles: 4,
        brans: 3,
        granola: 3,
        cherry_preserves: 2,
        peach_preserves: 2,
        pickles: 2,
        pickled_herring: 2,
        natural_living: 2,
        water_jug: 4,
        colacola: 2,
        popzi_soft_drink: 2,
        military_rations: 1,
        duct_tape: 2,
        rope: 1,
        nails: 1,
        bug_spray: 1
      },
      goremet_office: {
        tweex: 3,
        cheezholes: 2,
        z_energy_drink: 3,
        colacola: 2,
        granola: 2,
        water_jug: 2,
        painkiller: 2,
        duct_tape: 2,
        gauze: 1,
        spring: 1,
        colt_detective_special: 1,
        ammo_38_fed: 1
      },
      goremet_wc: {
        cotton_balls: 3,
        painkiller: 3,
        gauze: 2,
        medical_tape: 2,
        bug_spray: 2,
        antibiotics: 1,
        water_jug: 1
      }
    });
    for (const tn of ['goremet_stock', 'goremet_office', 'goremet_wc'])
      for (const id in LOOT_TABLES[tn])
        if (!ITEMS[id]) {
          console.error('[goremet] loot table ' + tn + ' has unknown item ' + id);
          delete LOOT_TABLES[tn][id];
        }
    if (typeof LOOT_PROP !== 'undefined')
      Object.assign(LOOT_PROP, {goremet_stock: 'crate', goremet_office: 'cabinet', goremet_wc: 'cabinet'});
    const A = window.MFZPROP && MFZPROP.auto;
    if (A) {
      const pick = (...ts) => [...new Set(ts.flatMap(t => A[t] || []))];
      A.goremet_stock = pick('supermarket', 'warehouse', 'storage');
      A.goremet_office = pick('office');
      A.goremet_wc = pick('clinic');
    }
  } catch (e) {
    console.warn('[goremet] loot tables', e);
  }

  /* ===================== artwork ===================== */
  const IMPACT = "Impact,'Arial Black','MFZ Head',sans-serif";
  // red lettering with blood drips running off the bottom of the letters
  function drippy(c, s, x, y, size, col, rnd, maxW) {
    c.save();
    c.font = size + 'px ' + IMPACT;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    const m = c.measureText(s).width,
      sx = maxW ? Math.min(1, maxW / m) : 1,
      w = m * sx;
    c.translate(x, y);
    c.scale(sx, 1);
    c.fillStyle = 'rgba(40,0,0,.55)';
    c.fillText(s, size * 0.05, size * 0.06);
    c.lineWidth = size * 0.1;
    c.strokeStyle = '#2a0606';
    c.strokeText(s, 0, 0);
    c.fillStyle = col;
    c.fillText(s, 0, 0);
    c.restore();
    // drips: thin runs with a round bead at the end
    c.fillStyle = col;
    const n = Math.max(4, Math.round(s.length * 1.4));
    for (let i = 0; i < n; i++) {
      const dx = x - w / 2 + w * (0.04 + 0.92 * rnd()),
        y0 = y + size * 0.3,
        len = size * (0.12 + rnd() * 0.5),
        dw = size * (0.03 + rnd() * 0.035);
      c.fillRect(dx - dw / 2, y0, dw, len);
      c.beginPath();
      c.arc(dx, y0 + len, dw * 0.85, 0, PI * 2);
      c.fill();
    }
  }
  // the GORE-MET FOODS logo, centred at (x, y), designed for a 600 x 280 box at s = 1
  function drawLogo(c, x, y, s, rnd) {
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    // cream oval badge with a red rim
    c.fillStyle = CREAM;
    c.strokeStyle = RED;
    c.lineWidth = 12;
    c.beginPath();
    c.ellipse(0, 0, 292, 132, 0, 0, PI * 2);
    c.fill();
    c.stroke();
    c.strokeStyle = GRN;
    c.lineWidth = 3;
    c.beginPath();
    c.ellipse(0, 0, 276, 118, 0, 0, PI * 2);
    c.stroke();
    // chef's toque on the left
    c.save();
    c.translate(-206, -18);
    c.fillStyle = '#ffffff';
    c.strokeStyle = '#3a3a3a';
    c.lineWidth = 3;
    for (const [px, py, pr] of [
      [-26, -10, 26],
      [0, -26, 30],
      [26, -10, 26]
    ]) {
      c.beginPath();
      c.arc(px, py, pr, 0, PI * 2);
      c.fill();
      c.stroke();
    }
    c.fillRect(-34, -8, 68, 40);
    c.strokeRect(-34, -8, 68, 40);
    c.fillStyle = RED;
    c.fillRect(-34, 22, 68, 10);
    c.restore();
    // cleaver crossed under the hat
    c.save();
    c.translate(-206, 58);
    c.rotate(-0.5);
    c.fillStyle = '#5a3a1a';
    c.fillRect(-60, -6, 44, 12);
    const g = c.createLinearGradient(0, -20, 0, 20);
    g.addColorStop(0, '#f0f2f4');
    g.addColorStop(1, '#8a9096');
    c.fillStyle = g;
    c.fillRect(-18, -22, 62, 40);
    c.fillStyle = '#b81818';
    c.beginPath();
    c.arc(30, 18, 6, 0, PI * 2);
    c.fill();
    c.fillRect(27, 18, 6, 14);
    c.fillStyle = '#2a2a2a';
    c.beginPath();
    c.arc(30, -10, 5, 0, PI * 2);
    c.fill();
    c.restore();
    drippy(c, 'GORE-MET', 46, -34, 96, RED, rnd, 380);
    P.text(c, 'FOODS', 46, 52, {size: 58, col: GRN, font: IMPACT, max: 300});
    P.text(c, 'FINE FOODS · PRIME CUTS · EST. 1962', 0, 104, {size: 19, col: '#5a2a1a', max: 420});
    c.restore();
  }
  const logoMat = (key, W, H, o) =>
    K.paint(
      key,
      W,
      H,
      (c, w, h, r) => {
        c.clearRect(0, 0, w, h);
        if (o && o.bg) {
          c.fillStyle = o.bg;
          c.fillRect(0, 0, w, h);
        }
        drawLogo(c, w / 2, h / 2, Math.min(w / 600, h / 280) * 0.97, r);
      },
      Object.assign({alpha: true, r: 0.5, glow: 0.15}, o)
    );
  // red and cream awning stripes; v = scalloped valance (alpha under the scallops)
  const stripes = (key, n, v) =>
    K.paint(
      key,
      1024,
      v ? 96 : 256,
      (c, W, H, r) => {
        c.clearRect(0, 0, W, H);
        const sw = W / n;
        if (v) {
          c.beginPath();
          c.moveTo(0, 0);
          c.lineTo(W, 0);
          for (let i = n; i >= 0; i--) c.arc(i * sw, H * 0.62, sw / 2, 0, PI, false);
          c.closePath();
          c.clip();
        }
        for (let i = 0; i < n; i++) {
          c.fillStyle = i % 2 ? '#f6efe0' : RED;
          c.fillRect(i * sw, 0, sw + 1, H);
        }
        P.noise(c, W, H, r, 4000, 0.12, '#3a2a20', 1.4);
        P.grime(c, W, H, r, 0.35);
      },
      {alpha: !!v, r: 0.85}
    );
  // window poster: cream card, red header bar, dark lines (a line can be [text, colour])
  const poster = (key, lines, o) => {
    o = o || {};
    return K.paint(
      key,
      o.w || 256,
      o.h || 320,
      (c, W, H, r) => {
        c.fillStyle = o.bg || CREAM;
        c.fillRect(0, 0, W, H);
        c.fillStyle = o.bar || RED;
        c.fillRect(0, 0, W, H * 0.14);
        P.text(c, o.head || 'GORE-MET', W / 2, H * 0.07, {size: Math.round(H * 0.09), col: '#fff', font: IMPACT});
        const n = lines.length,
          lh = (H * 0.8) / n;
        lines.forEach((s, i) => {
          const col = Array.isArray(s) ? s[1] : o.col || '#2a1a10';
          P.text(c, Array.isArray(s) ? s[0] : s, W / 2, H * 0.17 + lh * (i + 0.5), {
            size: Math.round(lh * 0.7),
            col,
            font: IMPACT,
            max: W * 0.88
          });
        });
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

  const SURF = {};
  const surf = k =>
    SURF[k] ||
    (SURF[k] = {
      asphalt: () => K.surf('asphalt', 0x3a3c40),
      concrete: () => K.surf('concrete', 0xb4b0a6),
      lawn: () => K.surf('lawn', 0x4a6a2a),
      hedge: () => K.surf('leaves', 0x2e4a22),
      brick: () =>
        K.tri(
          'gmf_brick',
          (c, W, H, r) => {
            c.fillStyle = '#7a5a4c';
            c.fillRect(0, 0, W, H);
            const bw = W / 4,
              bh = H / 12;
            for (let j = 0; j < 12; j++)
              for (let i = -1; i < 5; i++) {
                const x = i * bw + ((j % 2) * bw) / 2;
                c.fillStyle = `hsl(${4 + r() * 10},${44 + r() * 14}%,${36 + r() * 12}%)`;
                c.fillRect(x + 2, j * bh + 2, bw - 4, bh - 4);
              }
            P.noise(c, W, H, r, 6000, 0.18, '#2a1a14', 1.6);
            P.grime(c, W, H, r, 0.45);
          },
          {tile: 0.38, r: 0.9}
        ),
      // white render, a bit weathered
      render: () =>
        K.tri(
          'gm_render',
          (c, W, H, r) => {
            c.fillStyle = '#e8e6e0';
            c.fillRect(0, 0, W, H);
            P.noise(c, W, H, r, 9000, 0.22, '#a8a49a', 1.6);
            P.noise(c, W, H, r, 3000, 0.25, '#ffffff', 1.4);
            P.grime(c, W, H, r, 0.35);
          },
          {tile: 1.3, r: 0.95}
        ),
      coping: () => K.mat(0x6a6e72, 0.5, 0.5),
      trim: () => K.mat(0x1f3a2a, 0.5, 0.3),
      // blue-grey and white checkerboard lino, scuffed
      checker: () =>
        K.tri(
          'gm_checker',
          (c, W, H, r) => {
            const n = 2,
              s = W / n;
            for (let j = 0; j < n; j++)
              for (let i = 0; i < n; i++) {
                c.fillStyle = (i + j) % 2 ? '#e8ecea' : '#5a7a88';
                c.fillRect(i * s, j * s, s, s);
              }
            P.noise(c, W, H, r, 5000, 0.12, '#2a3a40', 1.4);
            P.noise(c, W, H, r, 2000, 0.15, '#ffffff', 1.2);
            P.grime(c, W, H, r, 0.3);
          },
          {tile: 1.0, r: 0.35}
        ),
      floorC: () => K.surf('concrete', 0x8e8c86),
      carpet: () =>
        K.tri(
          'gmf_carpet',
          (c, W, H, r) => {
            c.fillStyle = '#4a4e58';
            c.fillRect(0, 0, W, H);
            P.noise(c, W, H, r, 14000, 0.3, '#2a2c34', 1.3);
            c.strokeStyle = 'rgba(20,20,26,.35)';
            c.lineWidth = 3;
            for (let i = 0; i <= 2; i++) {
              c.beginPath();
              c.moveTo((i * W) / 2, 0);
              c.lineTo((i * W) / 2, H);
              c.moveTo(0, (i * H) / 2);
              c.lineTo(W, (i * H) / 2);
              c.stroke();
            }
          },
          {tile: 1.0, r: 0.95}
        ),
      wctile: () =>
        K.tri(
          'gm_wctile',
          (c, W, H, r) => {
            c.fillStyle = '#9aa4a6';
            c.fillRect(0, 0, W, H);
            const n = 8,
              s = W / n;
            for (let j = 0; j < n; j++)
              for (let i = 0; i < n; i++) {
                c.fillStyle = `hsl(190,6%,${88 + r() * 6}%)`;
                c.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
              }
            P.grime(c, W, H, r, 0.25);
          },
          {tile: 0.8, r: 0.3}
        ),
      diamond: () =>
        K.tri(
          'gm_diamond',
          (c, W, H, r) => {
            c.fillStyle = '#9a9ea2';
            c.fillRect(0, 0, W, H);
            c.fillStyle = '#c8ccd0';
            for (let j = 0; j < 8; j++)
              for (let i = 0; i < 8; i++) {
                c.save();
                c.translate(i * 64 + (j % 2) * 32 + 16, j * 64 + 32);
                c.rotate(j % 2 ? 0.8 : -0.8);
                c.fillRect(-14, -3, 28, 6);
                c.restore();
              }
            P.grime(c, W, H, r, 0.4);
          },
          {tile: 0.6, r: 0.4, m: 0.6}
        ),
      ceil: () =>
        K.tri(
          'gm_ceil',
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
      // the cream shop walls (stained, like an old store)
      wall: () =>
        K.tri(
          'gm_wall',
          (c, W, H, r) => {
            c.fillStyle = '#e6dcb4';
            c.fillRect(0, 0, W, H);
            P.noise(c, W, H, r, 5000, 0.12, '#a89a6a', 1.4);
            P.grime(c, W, H, r, 0.45);
          },
          {tile: 2.0, r: 0.85}
        ),
      grey: () => K.mat(0xc4c2ba, 0.9),
      panel: () => K.mat(0xeef0f0, 0.45, 0.2)
    }[k]());

  /* ===================== geometry ===================== */
  let CACHE = null;
  function build() {
    if (CACHE) return CACHE;
    const G = LK.geo('goremet'),
      b = G.b,
      S = G.S;
    const conc = surf('concrete'),
      asph = surf('asphalt');
    /* ---------- grounds: sidewalk, asphalt lot, hedge strip ---------- */
    LK.pavement(b, conc, {kerb: true});
    b.box(38, 0.02, 33.8, asph, [1, 0.012, -1.0], null, 0);
    b.box(2.0, 0.04, 33.8, surf('lawn'), [-19, 0.03, -1.0], null, 0);
    const brk = surf('brick'),
      ren = surf('render'),
      cop = surf('coping'),
      trim = surf('trim'),
      dark = K.mat(0x1c1c1e, 0.5),
      steel = K.mat(0x9a9ea2, 0.4, 0.7),
      galv = K.mat(0xb8bcc0, 0.35, 0.8),
      lineW = K.mat(0xf2f2ea, 0.6),
      lineY = K.mat(0xf2c418, 0.6),
      rnd = b.rnd;
    // hedge down the left edge of the lot
    b.rbox(0.9, 1.25, 33.0, 0.25, surf('hedge'), [-19.1, 0.62, -1.4]);
    S(-19.55, -18.65, -17.9, 15.1, 0, 1.25);

    /* ---------- exterior skin: red brick plinth, white render above, parapet ---------- */
    const BAND = 0.9;
    const skin = (ax, f, a0, a1, n, ops) => {
      ops = (ops || []).slice().sort((p, q) => p.c - q.c);
      const pc = (u0, u1, y0, y1) => {
        if (u1 - u0 < 0.04 || y1 - y0 < 0.02) return;
        const o = f + n * 0.165,
          u = (u0 + u1) / 2;
        const put = (ya, yb, m) => {
          if (yb - ya < 0.02) return;
          const y = (ya + yb) / 2;
          if (ax) b.box(u1 - u0, yb - ya, 0.03, m, [u, y, o], null, 0);
          else b.box(0.03, yb - ya, u1 - u0, m, [o, y, u], null, 0);
        };
        put(y0, Math.min(y1, BAND), brk);
        put(Math.max(y0, BAND), y1, ren);
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
    skin(1, Z0, X0 - 0.15, X1 + 0.15, -1, BACK);
    skin(0, X0, Z0, Z1, -1);
    skin(0, X1, Z0, Z1, 1, RIGHT);
    // brick soldier course on top of the plinth, green window frames + sills
    // v090: the soldier course stops at the door (it ran across the sliding doors at knee height)
    {
      let u = X0 - 0.2;
      const runs = [];
      for (const p of FRONT.filter(q => q.k !== 'w').sort((p, q) => p.c - q.c)) {
        runs.push([u, p.c - (p.k === 'g' ? 0.8 : 0.65)]);
        u = p.c + (p.k === 'g' ? 0.8 : 0.65);
      }
      runs.push([u, X1 + 0.2]);
      for (const [u0, u1] of runs)
        if (u1 - u0 > 0.05) b.box(u1 - u0, 0.08, 0.06, brk, [(u0 + u1) / 2, BAND + 0.04, Z1 + 0.2], null, 0.01);
    }
    for (const w of FRONT.filter(p => p.k === 'w')) {
      b.box(1.62, 0.07, 0.16, cop, [w.c, 0.9, Z1 + 0.22], null, 0.01);
      b.frame(1.56, 1.9, 0.06, trim, [w.c, 1.825, Z1 + 0.19], 0.06);
    }
    for (const w of RIGHT.filter(p => p.k === 'w')) {
      b.box(0.16, 0.07, 1.62, cop, [X1 + 0.22, 0.9, w.c], null, 0.01);
      b.push([X1 + 0.19, 1.825, w.c], [0, PI / 2, 0]);
      b.frame(1.56, 1.9, 0.06, trim, [0, 0, 0], 0.06);
      b.pop();
    }
    // brick pilasters at the front corners and either side of the entrance
    for (const px of [X0 + 0.2, X1 - 0.2]) {
      b.box(0.7, H + 0.7, 0.5, brk, [px, (H + 0.7) / 2, Z1 + 0.25], null, 0.01);
      S(px - 0.35, px + 0.35, Z1, Z1 + 0.5, 0, H, true);
    }
    // parapet with metal coping
    const par = (ax, f, a0, a1) => {
      const L = a1 - a0,
        u = (a0 + a1) / 2;
      if (ax) {
        b.box(L, 0.7, 0.3, ren, [u, H + 0.35, f], null, 0);
        b.box(L + 0.1, 0.07, 0.42, cop, [u, H + 0.73, f], null, 0.01);
      } else {
        b.box(0.3, 0.7, L, ren, [f, H + 0.35, u], null, 0);
        b.box(0.42, 0.07, L + 0.1, cop, [f, H + 0.73, u], null, 0.01);
      }
    };
    par(1, Z1, X0 - 0.15, X1 + 0.15);
    par(1, Z0, X0 - 0.15, X1 + 0.15);
    par(0, X0, Z0, Z1);
    par(0, X1, Z0, Z1);
    // flat roof: membrane, HVAC units, condenser for the cooler, vent stacks, a roof hatch
    b.box(X1 - X0, 0.12, Z1 - Z0, K.surf('concrete', 0x5a5a58), [(X0 + X1) / 2, H + 0.02, (Z0 + Z1) / 2], null, 0);
    b.box(X1 - X0 - 0.3, 0.02, Z1 - Z0 - 0.3, K.mat(0x3a3c40, 0.9), [(X0 + X1) / 2, H + 0.09, (Z0 + Z1) / 2], null, 0);
    for (const [hx, hz] of [
      [-10, -1],
      [1, 0],
      [-3, -8]
    ]) {
      b.rbox(2.2, 1.1, 1.5, 0.03, K.mat(0xb0b4b8, 0.4, 0.7), [hx, H + 0.65, hz]);
      b.vents(6, 2.0, 0.8, K.mat(0x6a6c6e, 0.5, 0.6), [hx, H + 0.65, hz + 0.76]);
      b.cyl(0.55, 0.55, 0.1, K.mat(0x2a2a2a, 0.5, 0.4), [hx, H + 1.25, hz], null, 20);
    }
    b.rbox(1.6, 0.9, 1.0, 0.03, K.mat(0xc8ccc8, 0.4, 0.6), [-15, H + 0.55, -5.5]);
    for (const fx of [-15.4, -14.6]) b.cyl(0.32, 0.32, 0.04, dark, [fx, H + 1.02, -5.5], null, 18);
    for (const [vx, vz] of [
      [-16, -10],
      [5, -2],
      [-6, 3],
      [-10.5, -5.5]
    ])
      b.cyl(0.08, 0.08, 0.8, K.mat(0x7a7c7e, 0.4, 0.7), [vx, H + 0.5, vz], null, 10);
    b.box(0.9, 0.3, 0.9, galv, [4, H + 0.24, -9], null, 0.01);

    /* ---------- awning: red and cream stripes over the shopfront, the logo on its face ---------- */
    const AX0 = -13.2,
      AX1 = 3.2,
      AW = AX1 - AX0,
      AC = (AX0 + AX1) / 2,
      AYT = 4.7, // top, at the wall
      AYB = 3.25, // front edge
      AD = 1.9; // projection
    const slope = Math.atan2(AYT - AYB, AD),
      aLen = Math.hypot(AYT - AYB, AD);
    const awn = stripes('gm_awn', 40),
      val = stripes('gm_val', 40, true);
    b.box(AW, aLen, 0.03, awn, [AC, (AYT + AYB) / 2, Z1 + 0.18 + AD / 2], [-(PI / 2 - slope), 0, 0], 0);
    b.label(AW, 0.42, val, [AC, AYB - 0.2, Z1 + 0.19 + AD]);
    b.label(AW, 0.42, val, [AC, AYB - 0.2, Z1 + 0.17 + AD], [0, PI, 0]);
    const cheek = [
      [0, AYT],
      [AD, AYB],
      [AD, AYB - 0.4],
      [0, AYB - 0.4]
    ];
    for (const ex of [AX0 + 0.015, AX1 - 0.015])
      b.add(K.extrudeGeo(cheek, 0.03, 0), K.mat(0xc8202a, 0.85), {p: [ex, 0, Z1 + 0.18], r: [0, -PI / 2, 0]});
    // steel frame under the cloth: top rail, front rail, diagonal arms
    b.cyl(0.03, 0.03, AW, steel, [AC, AYT - 0.05, Z1 + 0.22], [0, 0, PI / 2], 8);
    b.cyl(0.03, 0.03, AW, steel, [AC, AYB + 0.02, Z1 + 0.16 + AD], [0, 0, PI / 2], 8);
    for (let ax = AX0 + 0.3; ax <= AX1 - 0.2; ax += 2.7)
      b.cyl(0.022, 0.022, aLen, steel, [ax, (AYT + AYB) / 2 - 0.05, Z1 + 0.18 + AD / 2], [-(PI / 2 - slope), 0, 0], 6);
    // v090: the logo is a proper shop sign now: an upright lit cabinet standing on the front parapet over the doors, braced back
    // to the roof (it lay flat on the awning's slope and could hardly be read from the street)
    {
      const logo = logoMat('gmf_logo', 1024, 478, {glow: 0.35}),
        SY = H + 0.75 + 1.3,
        SW = 5.6,
        SH = 2.6;
      b.box(SW, SH, 0.24, K.mat(0x1f3a2a, 0.5, 0.2), [-5, SY, Z1], null, 0.02);
      b.box(SW + 0.12, 0.08, 0.3, cop, [-5, SY + SH / 2 + 0.04, Z1], null, 0.01);
      b.label(SW - 0.2, (SW - 0.2) * (478 / 1024), logo, [-5, SY, Z1 + 0.125]);
      for (const sx of [-2.2, 2.2]) {
        b.box(0.1, SY - H, 0.1, steel, [-5 + sx, (H + SY) / 2, Z1 - 0.3], null, 0);
        b.box(0.08, 0.08, 1.4, steel, [-5 + sx, SY - 0.6, Z1 - 0.75], [0.6, 0, 0], 0);
      }
    }
    // fascia boards either side of the awning
    b.label(3.4, 0.6, board('gm_fasL', 'BUTCHER · DELI · BAKERY', null, GRN, CREAM, 768, 128), [-15.6, 3.9, Z1 + 0.19]);
    b.label(3.4, 0.6, board('gm_fasR', 'PRODUCE · GROCERY', null, GRN, CREAM, 768, 128), [5.5, 3.9, Z1 + 0.19]);
    for (const fx of [-15.6, 5.5]) b.box(3.5, 0.7, 0.04, trim, [fx, 3.9, Z1 + 0.17], null, 0.01);
    // gooseneck lamps over the fascia boards and the doors
    for (const lx of [-16.6, -14.6, 4.5, 6.5]) {
      b.cyl(0.015, 0.015, 0.5, dark, [lx, 4.45, Z1 + 0.38], [PI / 2.6, 0, 0], 6);
      b.cyl(0.04, 0.11, 0.1, dark, [lx, 4.35, Z1 + 0.6], null, 12);
      b.cyl(
        0.1,
        0.1,
        0.01,
        K.mat(0xfff4d8, 0.4, 0, {emissive: 0xffe8b8, emissiveIntensity: 0.9}),
        [lx, 4.3, Z1 + 0.6],
        null,
        12
      );
    }
    // the side of the building facing the car park: a painted logo and a DELIVERIES sign
    b.label(6.0, 2.8, logoMat('gm_logoW', 1024, 478, {glow: 0.05}), [X1 + 0.19, 3.3, -6.0], [0, PI / 2, 0]);
    b.label(
      1.6,
      0.5,
      board('gmf_deliv', 'DELIVERIES →', 'TRUCKS TO REAR', '#f2c418', '#1a1a1a', 384, 120),
      [X1 + 0.19, 2.2, -10.8],
      [0, PI / 2, 0]
    );

    /* ---------- window posters ---------- */
    const POST = [
      [-16.6, ['PRIME', 'CUTS', ['TO DIE FOR', RED]]],
      [-13.4, ['FRESH', 'MEAT', ['DAILY', RED]]],
      [-10.2, ['HAM', 'HOCKS', ['$1.29/lb', RED]]],
      [0.2, ['WEEKLY', 'SPECIALS', ['INSIDE', RED]]],
      [3.4, ['ORGANIC', 'LOCAL', ['PRODUCE', GRN]]],
      [6.6, ['WE', 'ACCEPT', ['FOOD STAMPS', GRN]]]
    ];
    for (const [px, lines] of POST) b.label(0.9, 1.12, poster('gm_post' + px, lines), [px, 2.08, Z1 + 0.2]);
    b.label(0.6, 0.38, board('gmf_hours', 'OPEN 7 DAYS', '7 AM - 11 PM', '#1a1a1a', '#f6efe0', 256, 160), [
      -6.55,
      1.55,
      Z1 + 0.2
    ]);
    b.label(0.5, 0.2, board('gm_push', 'AUTOMATIC DOOR', null, '#f6efe0', '#1a1a1a', 256, 100), [-3.45, 1.5, Z1 + 0.2]);

    /* ---------- front walk: slab, kerb, benches, bin, ice chest, outdoor produce stand ---------- */
    b.box(X1 - X0 + 0.6, 0.12, 2.4, conc, [(X0 + X1) / 2, 0.06, Z1 + 1.2], null, 0);
    b.box(X1 - X0 + 0.6, 0.14, 0.16, K.mat(0xd0ccc0, 0.8), [(X0 + X1) / 2, 0.07, Z1 + 2.42], null, 0.01);
    b.box(1.4, 0.006, 0.6, lineY, [-5, 0.123, Z1 + 0.6], null, 0);
    const wood = K.surf('wood', 0x8a5a32);
    const bench = (x, z) => {
      for (const s of [-0.6, 0.6]) b.box(0.06, 0.45, 0.42, dark, [x + s, 0.34, z], null, 0);
      for (let i = 0; i < 3; i++) b.box(1.5, 0.04, 0.11, wood, [x, 0.48, z - 0.14 + i * 0.14], null, 0.01);
      for (let i = 0; i < 2; i++) b.box(1.5, 0.1, 0.035, wood, [x, 0.66 + i * 0.14, z - 0.21], null, 0.01);
      S(x - 0.75, x + 0.75, z - 0.25, z + 0.25, 0, 0.8, true);
    };
    bench(-1.0, Z1 + 1.9);
    bench(-9.6, Z1 + 1.9);
    // bin
    b.cyl(0.28, 0.25, 0.85, K.mat(0x2a4a32, 0.6, 0.3), [-7.2, 0.545, Z1 + 1.9], null, 16);
    b.cyl(0.3, 0.3, 0.06, dark, [-7.2, 0.98, Z1 + 1.9], null, 16);
    S(-7.5, -6.9, Z1 + 1.6, Z1 + 2.2, 0, 1.0, true);
    // ice chest
    b.rbox(1.5, 1.2, 0.8, 0.03, K.mat(0xf2f4f6, 0.4, 0.2), [2.4, 0.72, Z1 + 0.55]);
    b.label(1.1, 0.42, board('gm_ice', 'ICE', 'PARTY ICE · BLOCK ICE', '#1f6ab8', '#ffffff', 384, 150), [
      2.4,
      0.86,
      Z1 + 0.96
    ]);
    for (const s of [-0.37, 0.37]) b.box(0.6, 0.04, 0.03, galv, [2.4 + s, 1.0, Z1 + 0.96], null, 0);
    S(1.65, 3.15, Z1 + 0.15, Z1 + 0.95, 0, 1.32);
    // carts and produce stands (helpers shared with the inside)
    const wire = K.mat(0xc8ccd0, 0.3, 0.8),
      hdl = K.mat(0xc8202a, 0.5);
    const cart = (x, z, ry, tip) => {
      b.push([x, tip ? 0.45 : 0, z], [tip ? PI / 2 : 0, ry, 0]);
      b.push([0, 0.55, 0]);
      const L = 0.9,
        W = 0.55,
        Hh = 0.45;
      for (let i = 0; i <= 8; i++) {
        const t = -L / 2 + (i * L) / 8;
        for (const s of [-1, 1]) b.box(0.008, Hh, 0.008, wire, [(s * W) / 2, Hh / 2, t], null, 0);
      }
      for (let i = 0; i <= 5; i++) {
        const t = -W / 2 + (i * W) / 5;
        b.box(0.008, Hh, 0.008, wire, [t, Hh / 2, L / 2], null, 0);
        b.box(0.008, Hh * 1.1, 0.008, wire, [t, Hh / 2, -L / 2 - 0.05], [-0.15, 0, 0], 0);
      }
      for (let k = 0; k <= 3; k++) {
        const y = (k * Hh) / 3;
        for (const s of [-1, 1]) b.box(0.008, 0.008, L, wire, [(s * W) / 2, y, 0], null, 0);
        b.box(W, 0.008, 0.008, wire, [0, y, L / 2], null, 0);
        b.box(W, 0.008, 0.008, wire, [0, y, -L / 2], null, 0);
      }
      for (let i = 0; i <= 6; i++) b.box(0.006, 0.006, L, wire, [-W / 2 + (i * W) / 6, 0, 0], null, 0);
      b.pop();
      b.box(0.6, 0.035, 0.035, hdl, [0, 1.05, -0.58], null, 0);
      for (const s of [-1, 1]) b.cyl(0.012, 0.012, 0.55, wire, [s * 0.28, 0.78, -0.52], [-0.25, 0, 0], 6);
      for (const s of [-1, 1]) {
        b.cyl(0.012, 0.012, 0.7, wire, [s * 0.22, 0.22, 0], [PI / 2, 0, 0], 6);
        b.cyl(0.012, 0.012, 0.55, wire, [s * 0.22, 0.4, -0.4], [0.6, 0, 0], 6);
      }
      for (const [wx, wz] of [
        [-0.22, 0.32],
        [0.22, 0.32],
        [-0.22, -0.32],
        [0.22, -0.32]
      ]) {
        b.cyl(0.05, 0.05, 0.03, K.rubber(), [wx, 0.05, wz], [0, 0, PI / 2], 12);
        b.box(0.03, 0.06, 0.03, wire, [wx, 0.09, wz], null, 0);
      }
      b.pop();
      const side = Math.abs(Math.sin(ry)) > 0.7;
      S(
        x - (side ? 0.55 : 0.4),
        x + (side ? 0.55 : 0.4),
        z - (side ? 0.4 : 0.55),
        z + (side ? 0.4 : 0.55),
        0,
        1.0,
        true
      );
    };
    const crateW = K.surf('wood', 0x9a6a3a),
      veg = [
        [0xe8701a, 'carrot'],
        [0x4aa82a, 'pea'],
        [0xc8202a, 'apple'],
        [0xf2d020, 'lemon'],
        [0x6a3a8a, 'aubergine'],
        [0x3a8a2a, 'lettuce'],
        [0xa86a2a, 'potato'],
        [0xe84a1a, 'tomato']
      ];
    const PRICES = ['59c/lb', '2 FOR $1', '99c', 'FRESH!', '3 FOR $2', 'LOCAL'];
    const stand = (x, z, ry) => {
      b.push([x, 0, z], [0, ry, 0]);
      b.box(2.4, 0.7, 1.2, crateW, [0, 0.35, 0], null, 0.02);
      for (const s of [-1, 1])
        b.box(2.4, 0.3, 0.6, crateW, [0, 0.85 + (s > 0 ? 0 : 0.2), s * 0.3], [s * -0.25, 0, 0], 0.02);
      for (let k = 0; k < 6; k++) {
        const cx = -0.9 + (k % 3) * 0.9,
          cz = Math.floor(k / 3) ? -0.3 : 0.3,
          yy = Math.floor(k / 3) ? 1.15 : 0.95,
          [col, kind] = veg[(k + Math.abs(Math.round(x * 3 + z))) % 8];
        b.box(0.8, 0.05, 0.5, K.mat(0x7a5a3a, 0.8), [cx, yy, cz], [cz > 0 ? 0.25 : -0.25, 0, 0], 0);
        for (let q = 0; q < 9; q++) {
          const px = cx - 0.3 + (q % 3) * 0.3,
            pz = cz - 0.15 + Math.floor(q / 3) * 0.15;
          if (kind === 'carrot') b.cyl(0.02, 0.005, 0.18, K.mat(col, 0.6), [px, yy + 0.05, pz], [0, 0, PI / 2], 6);
          else if (kind === 'lettuce')
            b.add(K.sphGeo(0.09, 10, 6), K.mat(col, 0.7), {p: [px, yy + 0.07, pz], s: [1, 0.8, 1]});
          else if (kind === 'aubergine')
            b.add(K.sphGeo(0.05, 10, 6), K.mat(col, 0.2, 0.1), {p: [px, yy + 0.05, pz], s: [1, 1, 2]});
          else
            b.add(
              K.sphGeo(kind === 'potato' ? 0.05 : 0.045, 10, 6),
              K.mat(col, kind === 'apple' || kind === 'tomato' ? 0.25 : 0.6),
              {p: [px, yy + 0.05, pz]}
            );
        }
      }
      const pk = Math.abs(Math.round(x * 7 + z)) % PRICES.length;
      b.label(
        0.5,
        0.25,
        K.paint('gm_price' + pk, 160, 80, (c, W, H) => {
          c.fillStyle = '#f2d020';
          c.fillRect(0, 0, W, H);
          P.text(c, PRICES[pk], W / 2, H / 2, {size: 30, col: RED});
        }),
        [0, 0.5, 0.605]
      );
      b.pop();
      const side = Math.abs(Math.sin(ry)) > 0.7;
      S(
        x - (side ? 0.65 : 1.25),
        x + (side ? 0.65 : 1.25),
        z - (side ? 1.25 : 0.65),
        z + (side ? 1.25 : 0.65),
        0,
        1.2,
        true
      );
    };
    stand(-15.4, Z1 + 0.9, 0);
    // a nest of carts by the doors
    for (let i = 0; i < 5; i++) cart(-1.6 + i * 0.42, Z1 + 0.75, -PI / 2);

    /* ---------- parking: front stalls, right-hand lot, wheel stops, cart corral ---------- */
    const WS = K.surf('concrete', 0xc4c0b4);
    for (let i = 0; i <= 9; i++) {
      const lx = -17.6 + i * 2.6;
      b.box(0.1, 0.006, 4.8, lineW, [lx, 0.026, 11.0], null, 0);
      if (i < 9) {
        b.rbox(1.6, 0.13, 0.22, 0.03, WS, [lx + 1.3, 0.085, 9.0]);
        b.box(1.0, 0.006, 0.05, lineY, [lx + 1.3, 0.152, 9.0], null, 0);
      }
    }
    for (let i = 0; i <= 9; i++) {
      const lz = -11.0 + i * 2.6;
      b.box(4.8, 0.006, 0.1, lineW, [17.4, 0.026, lz], null, 0);
      if (i < 9) {
        b.rbox(0.22, 0.13, 1.6, 0.03, WS, [19.4, 0.085, lz + 1.3]);
        b.box(0.05, 0.006, 1.0, lineY, [19.4, 0.152, lz + 1.3], null, 0);
      }
    }
    // lane arrows down the right-hand aisle (painted)
    const arrow = K.paint(
      'gm_arrow',
      128,
      256,
      (c, W, H) => {
        c.clearRect(0, 0, W, H);
        c.fillStyle = 'rgba(242,242,234,.9)';
        c.beginPath();
        c.moveTo(W / 2, 4);
        c.lineTo(W - 8, H * 0.38);
        c.lineTo(W * 0.66, H * 0.38);
        c.lineTo(W * 0.66, H - 4);
        c.lineTo(W * 0.34, H - 4);
        c.lineTo(W * 0.34, H * 0.38);
        c.lineTo(8, H * 0.38);
        c.closePath();
        c.fill();
      },
      {alpha: true, r: 0.7}
    );
    for (const az of [10, 0, -9]) b.label(0.9, 1.8, arrow, [11.6, 0.03, az], [-PI / 2, 0, PI]);
    // cart corral: galvanised rails on posts, a sign on top
    b.push([13.4, 0, 2.0]);
    for (const s of [-0.5, 0.5]) {
      for (let k = 0; k < 3; k++) b.cyl(0.03, 0.03, 3.0, galv, [s, 0.35 + k * 0.3, 0], [PI / 2, 0, 0], 8);
      for (const pz of [-1.5, 1.5]) b.cyl(0.04, 0.04, 1.0, galv, [s, 0.5, pz], null, 8);
    }
    b.cyl(0.03, 0.03, 1.0, galv, [0, 0.95, 1.5], [0, 0, PI / 2], 8);
    b.box(0.04, 1.1, 0.04, galv, [0, 1.5, 1.5], null, 0);
    b.label(0.9, 0.5, board('gm_corral', 'CART', 'RETURN', RED, '#ffffff', 256, 140), [0, 1.9, 1.52]);
    b.label(0.9, 0.5, board('gm_corral', 'CART', 'RETURN', RED, '#ffffff', 256, 140), [0, 1.9, 1.48], [0, PI, 0]);
    b.pop();
    S(12.85, 13.95, 0.45, 3.55, 0, 1.0, true);
    for (let i = 0; i < 3; i++) cart(13.4, 0.9 + i * 0.42, 0);
    cart(10.4, 6.5, 2.1);
    cart(-6.2, 13.9, 0.6, true);

    /* ---------- pylon sign on the front right corner of the lot ---------- */
    b.push([17.6, 0, 14.4]);
    for (const s of [-1.2, 1.2]) b.box(0.3, 4.6, 0.3, K.mat(0x3a3e42, 0.5, 0.5), [s, 2.3, 0], null, 0.01);
    b.rbox(3.5, 2.0, 0.5, 0.04, K.mat(0xf6efe0, 0.5), [0, 5.6, 0]);
    b.label(3.3, 1.54, logoMat('gm_logoP', 1024, 478, {glow: 0.5, bg: CREAM, alpha: false}), [0, 5.6, 0.26]);
    b.label(
      3.3,
      1.54,
      logoMat('gm_logoP', 1024, 478, {glow: 0.5, bg: CREAM, alpha: false}),
      [0, 5.6, -0.26],
      [0, PI, 0]
    );
    b.box(3.6, 0.12, 0.6, trim, [0, 6.66, 0], null, 0.01);
    b.box(3.2, 1.0, 0.24, K.mat(0xf2f2ee, 0.4), [0, 3.9, 0], null, 0.01);
    const spec = board(
      'gm_spec',
      'THIS WEEK: PRIME RIB · LIVER',
      'HAM HOCKS · OXTAIL · BRAWN',
      '#f2f2ee',
      '#1a1a1a',
      768,
      240
    );
    b.label(3.1, 0.92, spec, [0, 3.9, 0.125]);
    b.label(3.1, 0.92, spec, [0, 3.9, -0.125], [0, PI, 0]);
    b.box(3.0, 0.6, 0.6, WS, [0, 0.3, 0], null, 0.02);
    b.pop();
    S(16.1, 19.1, 14.1, 14.7, 0, 6.7);

    /* ---------- delivery yard behind: dock apron, bumpers, shutter boxes, pallets, bin bags ---------- */
    b.box(8.0, 0.1, 3.0, conc, [2.0, 0.05, Z0 - 1.5], null, 0);
    for (const bx of [-0.25, 3.45]) {
      b.box(0.3, 0.5, 0.18, K.rubber(), [bx, 0.55, Z0 - 0.26], null, 0.02);
      b.box(0.2, 0.06, 0.4, lineY, [bx, 1.0, Z0 - 0.35], null, 0);
    }
    b.box(3.4, 0.5, 0.5, galv, [1.6, 2.85, Z0 - 0.42], null, 0.01);
    for (const gx of [-0.06, 3.26]) b.box(0.08, 2.5, 0.1, galv, [gx, 1.25, Z0 - 0.22], null, 0);
    // hazard stripes on the dock edge
    const haz = K.paint('gm_haz', 512, 64, (c, W, H) => {
      c.fillStyle = '#f2c418';
      c.fillRect(0, 0, W, H);
      c.fillStyle = '#1a1a1a';
      for (let x = -H; x < W; x += 48) {
        c.beginPath();
        c.moveTo(x, H);
        c.lineTo(x + 24, H);
        c.lineTo(x + 24 + H, 0);
        c.lineTo(x + H, 0);
        c.closePath();
        c.fill();
      }
    });
    b.label(3.2, 0.12, haz, [1.6, 0.102, Z0 - 0.3], [-PI / 2, 0, 0]);
    // dock light on a swing arm, a sign by the back door, a caged light over it
    b.cyl(0.02, 0.02, 0.9, dark, [-0.7, 2.6, Z0 - 0.5], [PI / 2, 0, 0], 6);
    b.cyl(0.12, 0.06, 0.2, dark, [-0.7, 2.55, Z0 - 0.95], [PI / 2.4, 0, 0], 12);
    b.label(
      1.0,
      0.4,
      board('gm_staff', 'STAFF ENTRANCE', 'RING FOR DELIVERIES', '#1a1a1a', '#f6efe0', 320, 128),
      [5.8, 2.75, Z0 - 0.19],
      [0, PI, 0]
    );
    b.box(
      0.25,
      0.2,
      0.15,
      K.mat(0xfff4d8, 0.4, 0, {emissive: 0xffe8b8, emissiveIntensity: 0.8}),
      [5.8, 3.3, Z0 - 0.25],
      null,
      0.01
    );
    b.label(
      0.8,
      0.5,
      board('gm_noPark', 'NO PARKING', 'DOCK ACCESS', RED, '#ffffff', 256, 160),
      [1.6, 3.4, Z0 - 0.19],
      [0, PI, 0]
    );
    // pallets, a stack of cardboard bales, bin bags
    const pal = K.surf('wood', 0xa88a5a);
    const pallet = (x, z, n, ry) => {
      b.push([x, 0, z], [0, ry || 0, 0]);
      for (let k = 0; k < n; k++) {
        const y = k * 0.15;
        for (const s of [-0.5, 0, 0.5]) b.box(1.2, 0.09, 0.1, pal, [0, y + 0.045, s], null, 0.005);
        for (let i = 0; i < 6; i++) b.box(0.12, 0.03, 1.1, pal, [-0.5 + i * 0.2, y + 0.105, 0], null, 0.003);
      }
      b.pop();
      S(x - 0.6, x + 0.6, z - 0.6, z + 0.6, 0, n * 0.15, true);
    };
    pallet(-7.0, -13.2, 6);
    pallet(-7.0, -14.7, 3, 0.1);
    pallet(-8.6, -13.4, 9, -0.05);
    const card = K.surf('cardboard', 0xb38a58);
    for (let k = 0; k < 3; k++) b.box(1.1, 0.7, 0.75, card, [9.6, 0.35 + k * 0.72, -14.2], [0, k * 0.08, 0], 0.02);
    for (const sx of [-0.3, 0.3]) b.box(0.02, 2.2, 0.77, K.mat(0x2a2a2a, 0.6), [9.6 + sx, 1.1, -14.2], null, 0);
    S(9.0, 10.2, -14.6, -13.8, 0, 2.2);
    const bag = K.mat(0x1a1a1c, 0.35);
    for (const [gx, gz, gs] of [
      [10.2, -16.3, 1],
      [10.8, -16.0, 0.85],
      [10.5, -15.5, 0.9],
      [11.3, -16.4, 1.1]
    ])
      b.add(K.sphGeo(0.38 * gs, 12, 8), bag, {p: [gx, 0.3 * gs, gz], s: [1, 0.85, 1]});

    /* ---------- sidewalk: street lights, meters, hydrant, no parking ---------- */
    LK.lightPole(b, S, -12);
    LK.lightPole(b, S, 11);
    LK.hydrant(b, S, -15.5);
    LK.meter(b, S, -7.5);
    LK.meter(b, S, -1.5);
    LK.meter(b, S, 4.5);
    LK.noParking(b, 7.4, {key: 'gm_np'});

    /* ---------- interior: floors, linings, ceiling, lights ---------- */
    const wl = surf('wall'),
      gry = surf('grey'),
      pan = surf('panel'),
      base = K.mat(0x2a2a2c, 0.6),
      chrome = K.chrome(),
      glass = K.glass(0xdfeff4, 0.2),
      lit = K.mat(0xffffff, 0.4, 0, {emissive: 0xf6f8ff, emissiveIntensity: 0.95}),
      hous = K.mat(0xd8d8d4, 0.5, 0.2);
    const flr = (x0, x1, z0, z1, m) =>
      b.box(x1 - x0 - 0.2, 0.02, z1 - z0 - 0.2, m, [(x0 + x1) / 2, 0.035, (z0 + z1) / 2], null, 0);
    flr(X0, X1, PZ, Z1, surf('checker'));
    flr(PX, X1, Z0, PZ, surf('floorC'));
    flr(X0, PX, Z0, PZ2, surf('carpet'));
    flr(X0, CX, PZ2, PZ, surf('diamond'));
    flr(CX, PX, PZ2, PZ, surf('wctile'));
    b.box(X1 - X0 - 0.3, 0.04, Z1 - Z0 - 0.3, surf('ceil'), [(X0 + X1) / 2, CEIL + 0.02, (Z0 + Z1) / 2], null, 0);
    // shop: cream walls, black skirting, a red band with a gold pinstripe under the ceiling (like the old store)
    const shopSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, Math.min(y1, CEIL - 0.5), wl, 0.012, 0.006);
      if (y1 > CEIL - 0.5) pc(u0, u1, Math.max(y0, CEIL - 0.5), y1, K.mat(0xb81c24, 0.6), 0.014, 0.007);
      if (y0 <= 0 && y1 > 0.15) pc(u0, u1, 0, 0.12, base, 0.03, 0.015);
      if (y0 <= CEIL - 0.56 && y1 >= CEIL - 0.5)
        pc(u0, u1, CEIL - 0.56, CEIL - 0.52, K.mat(0xe8b020, 0.5), 0.02, 0.012);
      if (y0 <= CEIL - 0.3 && y1 >= CEIL - 0.24) pc(u0, u1, CEIL - 0.3, CEIL - 0.26, K.mat(0xe8b020, 0.5), 0.02, 0.012);
    };
    const backSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, y1, gry, 0.012, 0.006);
      if (y0 <= 0 && y1 > 0.15) pc(u0, u1, 0, 0.1, K.mat(0x4a4a48, 0.7), 0.03, 0.015);
    };
    const coolSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, y1, pan, 0.02, 0.01);
      if (y0 <= 0 && y1 > 0.3) pc(u0, u1, 0, 0.25, K.mat(0xb0b4b8, 0.4, 0.7), 0.03, 0.015);
    };
    const wcSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, Math.min(y1, 1.4), surf('wctile'), 0.014, 0.007);
      if (y1 > 1.4) pc(u0, u1, Math.max(y0, 1.4), y1, K.mat(0xdce8e4, 0.8), 0.012, 0.006);
    };
    const officeSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, y1, K.mat(0xd8d0bc, 0.85), 0.012, 0.006);
      if (y0 <= 0 && y1 > 0.15) pc(u0, u1, 0, 0.1, K.veneer(0x5a3c26), 0.03, 0.015);
    };
    const R = (a, f) => a.filter(f);
    // shop floor
    LK.lineWall(b, 1, Z1, X0, X1, -1, FRONT, CEIL, shopSpan);
    LK.lineWall(b, 0, X0, PZ, Z1, 1, [], CEIL, shopSpan);
    LK.lineWall(
      b,
      0,
      X1,
      PZ,
      Z1,
      -1,
      R(RIGHT, p => p.c > PZ),
      CEIL,
      shopSpan
    );
    LK.lineWall(b, 1, PZ - 0.07, X0, X1, 1, PART, CEIL, shopSpan);
    // stock room
    LK.lineWall(
      b,
      1,
      PZ + 0.07,
      PX,
      X1,
      -1,
      R(PART, p => p.c > PX),
      CEIL,
      backSpan
    );
    LK.lineWall(b, 1, Z0, PX, X1, 1, BACK, CEIL, backSpan);
    LK.lineWall(
      b,
      0,
      X1,
      Z0,
      PZ,
      -1,
      R(RIGHT, p => p.c < PZ),
      CEIL,
      backSpan
    );
    LK.lineWall(b, 0, PX - 0.07, Z0, PZ, 1, PARTX, CEIL, backSpan);
    // office
    LK.lineWall(b, 1, Z0, X0, PX, 1, [], CEIL, officeSpan);
    LK.lineWall(b, 0, X0, Z0, PZ2, 1, [], CEIL, officeSpan);
    LK.lineWall(
      b,
      0,
      PX + 0.07,
      Z0,
      PZ2,
      -1,
      R(PARTX, p => p.c < PZ2),
      CEIL,
      officeSpan
    );
    LK.lineWall(b, 1, PZ2 + 0.07, X0, PX, -1, [], CEIL, officeSpan);
    // walk-in cooler
    LK.lineWall(b, 1, PZ2 - 0.07, X0, CX, 1, [], CEIL, coolSpan);
    LK.lineWall(b, 0, X0, PZ2, PZ, 1, [], CEIL, coolSpan);
    LK.lineWall(b, 0, CX + 0.07, PZ2, PZ, -1, [], CEIL, coolSpan);
    LK.lineWall(
      b,
      1,
      PZ + 0.07,
      X0,
      CX,
      -1,
      R(PART, p => p.c < CX),
      CEIL,
      coolSpan
    );
    // toilet
    LK.lineWall(b, 1, PZ2 - 0.07, CX, PX, 1, [], CEIL, wcSpan);
    LK.lineWall(b, 0, CX - 0.07, PZ2, PZ, 1, [], CEIL, wcSpan);
    LK.lineWall(
      b,
      0,
      PX + 0.07,
      PZ2,
      PZ,
      -1,
      R(PARTX, p => p.c > PZ2),
      CEIL,
      wcSpan
    );
    LK.lineWall(b, 1, PZ + 0.07, CX, PX, -1, [], CEIL, wcSpan);
    // fluorescent troffers over the shop, battens out back
    for (let lx = -16; lx < 7.5; lx += 2.6)
      for (const lz of [-2.4, 0.6, 3.8]) {
        b.box(1.24, 0.04, 0.62, hous, [lx, CEIL - 0.01, lz], null, 0.005);
        b.box(1.16, 0.01, 0.54, lit, [lx, CEIL - 0.035, lz], null, 0);
      }
    for (const [lx, lz] of [
      [-6, -6],
      [-6, -10],
      [-1.5, -8],
      [3, -6],
      [3, -10.4],
      [6.6, -8],
      [-15, -5.5],
      [-13.5, -9.5],
      [-10.5, -5.5]
    ]) {
      b.box(1.3, 0.07, 0.18, hous, [lx, CEIL - 0.04, lz], null, 0.01);
      b.box(1.22, 0.012, 0.12, lit, [lx, CEIL - 0.08, lz], null, 0);
    }

    /* ---------- shop: department signs on the walls, hanging aisle signs ---------- */
    b.label(3.2, 0.5, board('gm_dMeat', 'GORE-MET BUTCHERY', null, '#b81c24', '#fff4dc', 768, 120), [
      -13.9,
      CEIL - 0.85,
      PZ + 0.1
    ]);
    b.label(2.2, 0.42, board('gm_dDairy', 'DAIRY · EGGS', null, '#1f4a7a', '#ffffff', 512, 100), [
      -3.1,
      CEIL - 0.85,
      PZ + 0.1
    ]);
    b.label(
      2.2,
      0.42,
      board('gm_dProd', 'FRESH PRODUCE', null, GRN, '#fff4dc', 512, 100),
      [X0 + 0.19, CEIL - 0.85, 3.4],
      [0, PI / 2, 0]
    );
    b.label(
      2.2,
      0.42,
      board('gm_dDrink', 'COLD DRINKS', null, '#1f4a7a', '#ffffff', 512, 100),
      [X1 - 0.19, CEIL - 0.85, -1.0],
      [0, -PI / 2, 0]
    );
    b.label(1.1, 0.28, board('gm_dStaff', 'STAFF ONLY', null, '#1a1a1a', '#ffffff', 320, 80), [4.0, 2.65, PZ + 0.1]);
    b.label(1.1, 0.28, board('gm_dCool', 'MEAT COOLER', 'KEEP CLOSED', '#1f4a7a', '#ffffff', 320, 100), [
      -16,
      2.65,
      PZ + 0.1
    ]);
    const AISLES = [
      [-14.6, '1', 'SOUP · CANS'],
      [-12.0, '2', 'PASTA · RICE'],
      [-9.4, '3', 'CEREAL · JAM'],
      [-0.8, '4', 'SNACKS · CANDY'],
      [1.8, '5', 'PICKLES · SAUCES'],
      [4.4, '6', 'HOUSEHOLD']
    ];
    for (const [ax, n, txt] of AISLES) {
      const m = K.paint('gm_aisle' + n, 320, 160, (c, W, H) => {
        c.fillStyle = '#1f4a2c';
        c.fillRect(0, 0, W, H);
        c.fillStyle = '#e8b020';
        c.fillRect(0, H - 14, W, 14);
        P.text(c, n, W * 0.16, H * 0.45, {size: 84, col: '#fff4dc', font: IMPACT});
        P.text(c, txt, W * 0.6, H * 0.45, {size: 30, col: '#fff4dc', font: IMPACT, max: W * 0.6});
      });
      b.box(1.0, 0.5, 0.03, dark, [ax, 2.95, 1.75], null, 0.005);
      b.label(0.96, 0.48, m, [ax, 2.95, 1.767]);
      b.label(0.96, 0.48, m, [ax, 2.95, 1.733], [0, PI, 0]);
      for (const s of [-0.4, 0.4]) b.cyl(0.004, 0.004, CEIL - 3.2, steel, [ax + s, (CEIL + 3.2) / 2, 1.75], null, 4);
    }

    /* ---------- shop: the GORE-MET BUTCHERY counter, lit meat case, hams on a rail ---------- */
    {
      const cw = K.mat(0xf4f0e6, 0.5),
        stM = K.mat(0xc8ccd0, 0.3, 0.8),
        BX0 = -17.6,
        BX1 = -11.0,
        BL = BX1 - BX0,
        BC = (BX0 + BX1) / 2,
        BZ = -2.2; // v089: 0.4 m forward (the staff aisle behind it, onto which the cooler door opens, was 0.9 m)
      b.push([BC, 0, BZ]);
      b.box(BL, 0.7, 0.95, cw, [0, 0.35, 0], null, 0.01);
      b.box(BL, 0.12, 0.04, K.mat(0xb81c24, 0.5), [0, 0.55, 0.49], null, 0);
      b.box(BL, 0.06, 1.0, stM, [0, 0.72, 0], null, 0.01);
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
      for (let i = 0; i < 16; i++) {
        const x = -BL / 2 + 0.25 + i * 0.4;
        b.rbox(0.32, 0.04, 0.24, 0.01, K.mat(0xd8d8d0, 0.4), [x, 0.8, i % 2 ? -0.15 : 0.15]);
        if (rnd() < 0.75)
          b.add(K.sphGeo(0.1, 10, 6), K.mat(cuts[i % 6], 0.4), {p: [x, 0.83, i % 2 ? -0.15 : 0.15], s: [1.3, 0.35, 1]});
        if (i % 3 === 0) b.box(0.08, 0.05, 0.005, K.mat(0xffffff, 0.6), [x, 0.86, 0.42], null, 0);
      }
      b.pop();
      // cash wrap at the end of the case (the register is a loot prop placed at build)
      b.box(0.8, 1.0, 0.95, cw, [-10.6, 0.5, BZ], null, 0.01);
      b.box(0.84, 0.04, 1.0, K.mat(0x3a2a20, 0.4), [-10.6, 1.0, BZ], null, 0.01);
      S(BX0 - 0.05, -10.2, BZ - 0.5, BZ + 0.5, 0, 1.4);
      // scale on the case, a meat slicer and a block on the staff side
      b.rbox(0.4, 0.25, 0.3, 0.02, K.mat(0xd8d8d4, 0.4, 0.3), [-12.0, 1.5, BZ + 0.05]);
      b.rbox(0.3, 0.04, 0.25, 0.01, stM, [-12.0, 1.64, BZ + 0.05]);
      // v089: the staff bench moved 0.6 m along, off the cooler door. v090: slimmer and back to the wall, so the staff aisle behind
      // the counter is walkable (it was 0.64 m beside the bench: the cooler door could not be reached)
      b.box(2.4, 0.9, 0.36, stM, [-14.0, 0.45, -3.72], null, 0.01);
      b.cyl(0.16, 0.16, 0.04, chrome, [-14.7, 1.05, -3.72], [PI / 2, 0, 0], 20);
      b.box(0.5, 0.15, 0.36, K.mat(0xd8d8d4, 0.4, 0.3), [-14.7, 0.98, -3.72], null, 0.01);
      b.box(0.7, 0.18, 0.44, K.surf('wood', 0xb08050), [-13.3, 0.99, -3.72], null, 0.02);
      b.box(0.04, 0.24, 0.12, K.mat(0x5a3a1a, 0.6), [-13.1, 1.12, -3.72], [0, 0, 0.3], 0);
      S(-15.2, -12.8, -3.9, -3.54, 0, 1.0, true);
      // the meat rail: hams and sausage strings over the staff side
      b.cyl(0.025, 0.025, BL, stM, [BC, 2.55, -3.55], [0, 0, PI / 2], 8);
      for (const bx of [BX0 + 0.2, BX1 - 0.2])
        b.box(0.04, CEIL - 2.55, 0.04, stM, [bx, (CEIL + 2.55) / 2, -3.55], null, 0);
      const ham = K.mat(0xa84a32, 0.45),
        fat = K.mat(0xe8d8c0, 0.6),
        sau = K.mat(0x8a3a22, 0.4);
      for (let i = 0; i < 9; i++) {
        const hx = BX0 + 0.5 + i * 0.72;
        b.cyl(0.006, 0.006, 0.18, stM, [hx, 2.46, -3.55], null, 4);
        if (i % 3 === 2) {
          for (let k = 0; k < 5; k++)
            b.add(K.sphGeo(0.045, 8, 6), sau, {p: [hx + (k % 2) * 0.03, 2.3 - k * 0.11, -3.55], s: [1, 1.5, 1]});
        } else {
          b.add(K.sphGeo(0.16, 12, 8), ham, {p: [hx, 2.1, -3.55], s: [0.85, 1.4, 0.75]});
          b.cyl(0.035, 0.02, 0.12, fat, [hx, 2.36, -3.55], null, 8);
        }
      }
      // price chalkboard on the wall behind
      const chalk = K.paint('gm_chalk', 512, 320, (c, W, H, r) => {
        c.fillStyle = '#1e2a24';
        c.fillRect(0, 0, W, H);
        P.noise(c, W, H, r, 2000, 0.12, '#ffffff', 1.4);
        P.text(c, "TODAY'S CUTS", W / 2, 34, {size: 36, col: '#fff4dc', font: IMPACT});
        const rows = [
          ['PRIME RIB', '$6.99'],
          ['PORK LOIN', '$3.49'],
          ['LIVER', '$1.19'],
          ['TONGUE', '$2.29'],
          ['OXTAIL', '$2.89'],
          ['SWEETBREADS', 'ASK!']
        ];
        rows.forEach(([a, p], i) => {
          c.font = '26px ' + IMPACT;
          c.fillStyle = '#e8e4d8';
          c.textAlign = 'left';
          c.fillText(a, 34, 90 + i * 38);
          c.textAlign = 'right';
          c.fillStyle = '#f2c418';
          c.fillText(p, W - 34, 90 + i * 38);
        });
      });
      b.box(1.5, 0.96, 0.04, K.surf('wood', 0x6a4a2a), [-12.3, 2.2, PZ + 0.11], null, 0.01);
      b.label(1.4, 0.88, chalk, [-12.3, 2.2, PZ + 0.135]);
    }

    /* ---------- shop: the dairy wall (lit reach-in cases along the back) ---------- */
    {
      const prod = K.paint(
        'gm_dairy',
        1024,
        512,
        (c, W, H, r) => {
          c.fillStyle = '#e8eef2';
          c.fillRect(0, 0, W, H);
          const cols = ['#ffffff', '#f2e6a0', '#e8a0b0', '#a0c8e8', '#f6f0e0', '#c8e0a0', '#f2c418', '#e86a3a'];
          for (let s = 0; s < 5; s++) {
            const y0 = 20 + s * 98;
            c.fillStyle = '#9aa0a6';
            c.fillRect(0, y0 + 84, W, 6);
            for (let x = 6; x < W - 30; ) {
              const w = 22 + r() * 30,
                h = 40 + r() * 40;
              if (r() < 0.12) {
                x += w;
                continue;
              }
              c.fillStyle = cols[Math.floor(r() * cols.length)];
              c.fillRect(x, y0 + 84 - h, w - 3, h);
              c.fillStyle = 'rgba(0,0,0,.15)';
              c.fillRect(x, y0 + 84 - h, w - 3, 6);
              x += w;
            }
          }
        },
        {glow: 0.35, r: 0.5}
      );
      const reachIn = (x0, x1) => {
        const L = x1 - x0,
          cx = (x0 + x1) / 2,
          z = PZ + 0.5;
        // v090: the stock sat 4 cm inside the case body (flickering behind the glass, contents unreadable). The body stops 11 cm
        // short of the glass now, the stock hangs just in front of it
        b.box(L, 2.3, 0.7, K.mat(0x2a2c30, 0.5, 0.3), [cx, 1.15, z - 0.05], null, 0.01);
        b.label(L - 0.1, 1.9, prod, [cx, 1.2, z + 0.32]);
        b.box(L, 0.3, 0.82, K.mat(0xf2f2ee, 0.5), [cx, 2.45, z], null, 0.01);
        b.box(L - 0.1, 1.95, 0.02, glass, [cx, 1.2, z + 0.41], null, 0);
        const n = Math.round(L / 0.8);
        for (let i = 0; i <= n; i++) b.box(0.05, 2.0, 0.05, dark, [x0 + (i * L) / n, 1.2, z + 0.42], null, 0);
        for (let i = 0; i < n; i++) b.box(0.03, 0.5, 0.04, chrome, [x0 + ((i + 0.85) * L) / n, 1.2, z + 0.46], null, 0);
        b.box(L - 0.1, 0.02, 0.05, lit, [cx, 2.22, z + 0.38], null, 0);
        S(x0, x1, PZ, z + 0.42, 0, 2.6);
      };
      reachIn(-8.6, -4.6);
      reachIn(-4.4, 2.4);
    }

    /* ---------- shop: checkout lanes ---------- */
    {
      const cw = K.mat(0x3a5a4a, 0.5),
        topM = K.mat(0xd8d4c8, 0.35),
        belt = K.mat(0x1a1a1a, 0.8);
      for (const [i, cx] of [-1.2, 1.8, 4.8].entries()) {
        b.box(0.7, 0.88, 2.6, cw, [cx, 0.44, 3.9], null, 0.02);
        b.box(0.74, 0.04, 2.64, topM, [cx, 0.9, 3.9], null, 0.01);
        b.box(0.5, 0.03, 1.5, belt, [cx, 0.93, 3.25], null, 0.01);
        for (const s of [-0.28, 0.28]) b.box(0.04, 0.05, 1.5, chrome, [cx + s, 0.94, 3.25], null, 0);
        b.box(0.6, 0.02, 0.4, glass, [cx, 0.925, 4.15], null, 0);
        // bagging well + bag rack
        b.box(0.64, 0.1, 0.6, K.mat(0x2a2a2a, 0.6), [cx, 0.86, 4.95], null, 0.01);
        b.box(0.3, 0.4, 0.02, chrome, [cx + 0.2, 1.12, 5.15], null, 0);
        // lane light: pole with a lit number
        b.cyl(0.03, 0.03, 1.4, chrome, [cx - 0.3, 1.6, 2.7], null, 8);
        b.box(
          0.32,
          0.32,
          0.12,
          K.mat(0xf2f2ee, 0.4, 0, {emissive: 0xffffff, emissiveIntensity: 0.4}),
          [cx - 0.3, 2.4, 2.7],
          null,
          0.02
        );
        const nm = board('gm_lane' + i, String(i + 1), null, '#b81c24', '#ffffff', 96, 96);
        b.label(0.28, 0.28, nm, [cx - 0.3, 2.4, 2.765]);
        b.label(0.28, 0.28, nm, [cx - 0.3, 2.4, 2.635], [0, PI, 0]);
        // impulse rack (candy, magazines) at the lane entrance
        b.box(0.5, 1.3, 0.35, K.mat(0x2a2a2a, 0.6, 0.3), [cx - 0.6, 0.65, 2.75], null, 0.01);
        for (let k = 0; k < 4; k++)
          b.box(
            0.44,
            0.12,
            0.05,
            K.mat([0xe8b020, 0xc8202a, 0x2a6ab8, 0x3a8a2a][k], 0.5),
            [cx - 0.6, 0.35 + k * 0.28, 2.94],
            null,
            0.005
          );
        // card reader, receipt printer
        b.box(0.12, 0.16, 0.08, K.blackPlastic(), [cx - 0.25, 1.0, 4.3], [-0.4, 0, 0], 0.01);
        S(cx - 0.36, cx + 0.36, 2.6, 5.2, 0, 1.0);
        S(cx - 0.85, cx - 0.35, 2.55, 2.95, 0, 1.3, true);
      }
      b.label(
        1.6,
        0.4,
        board('gm_express', 'EXPRESS', '10 ITEMS OR LESS', '#e8b020', '#1a1a1a', 384, 100),
        [-1.5, 3.1, 2.7]
      );
    }

    /* ---------- walk-in cooler: steel shelving, hanging sides on a rail, strip curtain ---------- */
    {
      const stM = K.mat(0xc8ccd0, 0.3, 0.8),
        side = K.mat(0xb84a3a, 0.45),
        fat = K.mat(0xeee0c8, 0.6);
      b.cyl(0.03, 0.03, 4.4, stM, [-15.0, 2.7, -6.2], [0, 0, PI / 2], 8);
      for (const rx of [-17.2, -12.8]) b.box(0.05, CEIL - 2.7, 0.05, stM, [rx, (CEIL + 2.7) / 2, -6.2], null, 0);
      for (let i = 0; i < 5; i++) {
        const hx = -16.8 + i * 0.85;
        b.cyl(0.008, 0.008, 0.25, stM, [hx, 2.58, -6.2], null, 4);
        b.add(K.sphGeo(0.24, 12, 10), side, {p: [hx, 1.75, -6.2], s: [0.7, 2.6, 0.45]});
        b.add(K.sphGeo(0.2, 10, 8), fat, {p: [hx + 0.05, 1.8, -6.13], s: [0.55, 2.3, 0.3]});
        b.cyl(0.03, 0.03, 0.2, fat, [hx, 2.4, -6.2], null, 6);
      }
      S(-17.2, -13.1, -6.45, -5.95, 0.9, 2.8, true); // v089: rail 0.7 m back from the door
      // wire shelving down the left wall with boxes and tubs
      for (let k = 0; k < 4; k++) b.box(0.6, 0.03, 2.6, stM, [X0 + 0.45, 0.3 + k * 0.5, -5.5], null, 0);
      for (const pz of [-6.75, -4.25])
        for (const px of [X0 + 0.17, X0 + 0.73]) b.cyl(0.015, 0.015, 1.9, stM, [px, 0.95, pz], null, 6);
      const tub = K.mat(0xf2f2ee, 0.5),
        boxC = K.surf('cardboard', 0xb38a58);
      for (let k = 0; k < 4; k++)
        for (let j = 0; j < 4; j++)
          if (rnd() < 0.8)
            j % 2
              ? b.box(0.45, 0.3, 0.5, boxC, [X0 + 0.45, 0.47 + k * 0.5, -6.5 + j * 0.62], null, 0.01)
              : b.rbox(0.4, 0.22, 0.45, 0.03, tub, [X0 + 0.45, 0.43 + k * 0.5, -6.5 + j * 0.62]);
      S(X0, X0 + 0.8, -6.8, -4.2, 0, 1.9);
      // PVC strip curtain inside the door, evaporator unit high on the wall
      for (let i = 0; i < 7; i++)
        b.box(
          0.18,
          2.3,
          0.006,
          K.glass(0xe8f4f8, 0.35),
          [-16.55 + i * 0.18, 1.2, PZ - 0.14 + (i % 2) * 0.012],
          null,
          0
        );
      b.box(1.4, 0.45, 0.5, pan, [-13.4, CEIL - 0.35, PZ2 + 0.35], null, 0.02);
      b.vents(5, 1.1, 0.3, dark, [-13.4, CEIL - 0.35, PZ2 + 0.61]);
      b.box(
        0.5,
        0.25,
        0.04,
        board('gm_temp', '-2°C', 'COOLER TEMP', '#1a1a1a', '#e83a3a', 200, 100),
        [-12.6, 2.0, PZ - 0.18],
        null,
        0
      );
    }

    /* ---------- staff toilet: WC, basin + mirror, dryer, mop bucket ---------- */
    {
      const por = K.mat(0xf6f6f2, 0.15, 0.05);
      // WC against the cooler wall, facing +x
      b.push([CX + 0.4, 0, -6.3]);
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
        [0.12, 0, 0],
        20
      );
      b.add(K.cylGeo(0.22, 0.22, 0.03, 20), por, {p: [0.12, 0.43, 0], s: [1.25, 1, 1]});
      b.rbox(0.2, 0.42, 0.45, 0.03, por, [-0.18, 0.62, 0]);
      b.box(0.03, 0.04, 0.12, chrome, [-0.07, 0.8, 0.15], null, 0);
      b.pop();
      S(CX + 0.08, CX + 0.85, -6.6, -6.0, 0, 0.8, true);
      // grab rail, toilet roll
      b.cyl(0.018, 0.018, 0.7, chrome, [-11.4, 0.85, PZ2 + 0.14], [0, 0, PI / 2], 8);
      b.cyl(0.055, 0.055, 0.11, K.mat(0xffffff, 0.8), [-11.5, 0.7, PZ2 + 0.14], [0, 0, PI / 2], 12);
      // basin + mirror on the shop-side wall
      b.box(0.5, 0.15, 0.4, por, [-10.9, 0.82, PZ - 0.3], null, 0.04);
      b.cyl(0.04, 0.05, 0.7, por, [-10.9, 0.4, PZ - 0.25], null, 12);
      b.cyl(0.012, 0.012, 0.15, chrome, [-10.9, 0.95, PZ - 0.42], null, 8);
      b.box(0.5, 0.65, 0.02, K.mat(0xcfe0e8, 0.05, 0.9), [-10.9, 1.55, PZ - 0.1], null, 0);
      b.box(0.24, 0.3, 0.14, K.mat(0xd8d8d4, 0.4, 0.4), [-10.1, 1.3, PZ - 0.16], null, 0.02);
      b.box(0.28, 0.35, 0.12, K.mat(0xf2f2ee, 0.5), [-11.6, 1.35, PZ - 0.15], null, 0.02);
      S(-11.15, -10.65, PZ - 0.5, PZ, 0, 0.95, true);
      // mop bucket + a wet floor sign stored in the corner
      b.cyl(0.2, 0.17, 0.3, K.mat(0xe8b020, 0.5), [-9.5, 0.17, -6.6], null, 14);
      b.cyl(0.012, 0.012, 1.2, K.mat(0x8a6a4a, 0.6), [-9.45, 0.75, -6.6], [0.15, 0, 0.1], 6);
      b.label(
        0.3,
        0.2,
        board('gmf_wc', 'STAFF', 'WASH YOUR HANDS', '#1a1a1a', '#ffffff', 200, 130),
        [-10.9, 2.05, PZ - 0.11],
        [0, PI, 0]
      );
    }

    /* ---------- office: filing cabinets, safe, CCTV, cork board, lockers, water cooler ---------- */
    {
      const beige = K.paintSteel(0xc8c0a8, {m: 0.3, r: 0.5}),
        gun = K.paintSteel(0x3a3e42, {m: 0.5, r: 0.4});
      // three filing cabinets on the back wall
      for (let i = 0; i < 3; i++) {
        const fx = -16.9 + i * 0.52;
        b.box(0.48, 1.32, 0.62, beige, [fx, 0.66, Z0 + 0.45], null, 0.01);
        for (let k = 0; k < 4; k++) b.pull(0.16, chrome, [fx, 0.3 + k * 0.32, Z0 + 0.77]);
      }
      S(-17.2, -15.6, Z0, Z0 + 0.78, 0, 1.32);
      // floor safe in the corner
      b.rbox(0.7, 0.8, 0.65, 0.02, gun, [X0 + 0.5, 0.4, PZ2 - 0.5]);
      b.cyl(0.08, 0.08, 0.04, chrome, [X0 + 0.5, 0.5, PZ2 - 0.82], [PI / 2, 0, 0], 16);
      b.box(0.04, 0.2, 0.04, chrome, [X0 + 0.7, 0.42, PZ2 - 0.84], null, 0);
      S(X0 + 0.15, X0 + 0.85, PZ2 - 0.83, PZ2 - 0.17, 0, 0.8);
      // CCTV monitors on a shelf on the cooler wall
      b.box(1.6, 0.04, 0.35, K.veneer(0x5a3c26), [-13.6, 1.6, PZ2 - 0.25], null, 0.005);
      const cctv = K.paint(
        'gm_cctv',
        256,
        192,
        (c, W, H, r) => {
          c.fillStyle = '#0a0e0c';
          c.fillRect(0, 0, W, H);
          for (let q = 0; q < 4; q++) {
            const x = (q % 2) * (W / 2) + 4,
              y = Math.floor(q / 2) * (H / 2) + 4;
            c.fillStyle = `rgb(${40 + r() * 30},${50 + r() * 30},${44 + r() * 20})`;
            c.fillRect(x, y, W / 2 - 8, H / 2 - 8);
            P.noise(c, W, H, r, 400, 0.2, '#9aa', 1.2);
            c.fillStyle = '#e8e8e8';
            c.font = '11px monospace';
            c.fillText('CAM ' + (q + 1), x + 4, y + 13);
          }
        },
        {glow: 0.8, r: 0.3}
      );
      for (const mx of [-14.1, -13.1]) {
        b.box(0.62, 0.46, 0.3, K.blackPlastic(), [mx, 1.86, PZ2 - 0.26], null, 0.02);
        b.label(0.54, 0.4, cctv, [mx, 1.86, PZ2 - 0.42], [0, PI, 0]);
      }
      b.box(0.36, 0.08, 0.26, K.blackPlastic(), [-12.4, 1.66, PZ2 - 0.25], null, 0.01);
      // cork board with rotas and notices
      const cork = K.paint('gm_cork', 384, 256, (c, W, H, r) => {
        c.fillStyle = '#b88a5a';
        c.fillRect(0, 0, W, H);
        P.noise(c, W, H, r, 3000, 0.3, '#6a4a2a', 1.6);
        const notes = [
          'ROTA',
          'DELIVERIES MON / THU',
          'NO STAFF IN COOLER ALONE',
          'WHO TOOK MY LUNCH?',
          'PRICE CHECK',
          'SAFE CODE: ASK BOSS'
        ];
        notes.forEach((s, i) => {
          const x = 14 + (i % 3) * 122,
            y = 14 + Math.floor(i / 3) * 118;
          c.save();
          c.translate(x + 50, y + 50);
          c.rotate((r() - 0.5) * 0.15);
          c.fillStyle = ['#ffffff', '#f6f0a0', '#f0c8d0'][i % 3];
          c.fillRect(-50, -50, 100, 96);
          c.fillStyle = '#c8202a';
          c.beginPath();
          c.arc(0, -42, 5, 0, PI * 2);
          c.fill();
          P.text(c, s, 0, 0, {size: 13, col: '#222', max: 90});
          c.restore();
        });
      });
      b.box(1.3, 0.9, 0.03, K.veneer(0x5a3c26), [X0 + 0.18, 1.6, -9.0], [0, PI / 2, 0], 0.01);
      b.label(1.22, 0.82, cork, [X0 + 0.2, 1.6, -9.0], [0, PI / 2, 0]);
      // a row of staff lockers on the back wall
      for (let i = 0; i < 5; i++) {
        const lx = -13.6 + i * 0.42;
        b.box(0.4, 1.85, 0.45, K.paintSteel(0x4a6a8a, {m: 0.4, r: 0.45}), [lx, 0.925, Z0 + 0.34], null, 0.005);
        b.vents(3, 0.25, 0.1, dark, [lx, 1.6, Z0 + 0.57]);
        b.box(0.03, 0.12, 0.03, chrome, [lx + 0.13, 1.0, Z0 + 0.58], null, 0);
      }
      S(-13.82, -11.7, Z0, Z0 + 0.57, 0, 1.85);
      // water cooler by the door, an office chair, a calendar
      b.box(0.32, 1.0, 0.32, K.mat(0xf2f2ee, 0.5), [PX - 0.35, 0.5, -11.4], null, 0.02);
      b.cyl(0.14, 0.14, 0.4, K.glass(0x8ac8f0, 0.5), [PX - 0.35, 1.2, -11.4], null, 14);
      S(PX - 0.52, PX - 0.18, -11.57, -11.23, 0, 1.4, true);
      b.label(
        0.4,
        0.55,
        poster('gm_cal', ['NOVEMBER', ['1 2 3 4 5 6 7', '#555'], ['8 9 10 11 12', '#555'], ['13 14 15 X X', RED]], {
          head: 'PRIME MEATS CO.',
          w: 200,
          h: 270
        }),
        [-10.6, 1.7, Z0 + 0.12]
      );
    }

    /* ---------- stock room: receiving bay, yellow walk lines, baler, pallet jack, stacked pallets ---------- */
    {
      // walkway lines from the shop doors to the dock and the back door
      for (const lx of [2.5, 5.5]) b.box(0.08, 0.006, 7.6, lineY, [lx, 0.05, (Z0 + PZ) / 2], null, 0);
      b.box(3.6, 0.006, 0.08, lineY, [1.6, 0.05, Z0 + 2.4], null, 0);
      // shrink-wrapped pallets waiting to be put away
      const wrap = K.glass(0xf0f4f6, 0.45),
        card = K.surf('cardboard', 0xb38a58),
        palW = K.surf('wood', 0xa88a5a);
      const loadP = (x, z, h, tint) => {
        for (const s of [-0.5, 0, 0.5]) b.box(1.2, 0.12, 0.1, palW, [x, 0.06, z + s], null, 0.005);
        b.box(1.16, 0.03, 1.0, palW, [x, 0.135, z], null, 0.003);
        const n = Math.round(h / 0.32);
        for (let k = 0; k < n; k++)
          for (let q = 0; q < 4; q++)
            b.box(
              0.54,
              0.3,
              0.46,
              tint && (k + q) % 3 === 0 ? K.surf('cardboard', tint) : card,
              [x - 0.28 + (q % 2) * 0.56, 0.3 + k * 0.32, z - 0.24 + Math.floor(q / 2) * 0.48],
              null,
              0.01
            );
        b.box(1.18, n * 0.32, 1.02, wrap, [x, 0.15 + (n * 0.32) / 2, z], null, 0.02);
        S(x - 0.6, x + 0.6, z - 0.55, z + 0.55, 0, 0.15 + n * 0.32);
      };
      loadP(0.4, -9.0, 1.3, 0xc8a070);
      loadP(0.4, -7.6, 0.95);
      loadP(-1.0, -9.0, 1.6, 0x9a7a50);
      // cardboard baler against the back wall
      b.box(1.2, 2.2, 0.9, K.paintSteel(0x2a5a9a, {m: 0.4, r: 0.45}), [7.2, 1.1, Z0 + 0.6], null, 0.02);
      b.box(1.0, 0.7, 0.04, K.mat(0x1a1a1a, 0.5), [7.2, 0.9, Z0 + 1.06], null, 0);
      b.box(0.2, 0.3, 0.1, K.mat(0xe8b020, 0.5), [7.65, 1.6, Z0 + 1.08], null, 0.01);
      b.label(0.8, 0.25, board('gm_baler', 'CARDBOARD ONLY', null, '#e8b020', '#1a1a1a', 256, 80), [
        7.2,
        1.95,
        Z0 + 1.06
      ]);
      S(6.6, 7.8, Z0, Z0 + 1.05, 0, 2.2);
      // pallet jack parked by the shutters
      b.push([-0.4, 0, -11.2], [0, 0.3, 0]);
      for (const s of [-0.2, 0.2]) b.box(0.16, 0.08, 1.15, K.mat(0xd84a1a, 0.5, 0.3), [s, 0.06, 0.2], null, 0.01);
      b.box(0.55, 0.35, 0.22, K.mat(0xd84a1a, 0.5, 0.3), [0, 0.22, -0.45], null, 0.02);
      b.cyl(0.02, 0.02, 1.1, dark, [0, 0.8, -0.65], [-0.35, 0, 0], 6);
      b.box(0.3, 0.05, 0.05, dark, [0, 1.3, -0.84], null, 0);
      b.pop();
      // receiving podium with a clipboard, milk crates, a step ladder
      b.box(0.6, 1.1, 0.5, K.paintSteel(0x6a6e72, {m: 0.4, r: 0.5}), [-1.6, 0.55, -11.5], null, 0.01);
      b.box(0.24, 0.32, 0.01, K.mat(0xf2f2ee, 0.7), [-1.6, 1.12, -11.4], [-1.2, 0, 0], 0);
      S(-1.9, -1.3, -11.75, -11.25, 0, 1.1, true);
      const crate = K.mat(0x2a6ab8, 0.6);
      for (let k = 0; k < 4; k++)
        b.box(
          0.38,
          0.28,
          0.38,
          k % 2 ? crate : K.mat(0xc8202a, 0.6),
          [6.9, 0.14 + k * 0.29, -4.8],
          [0, k * 0.1, 0],
          0.01
        );
      S(6.7, 7.1, -5.0, -4.6, 0, 1.2, true);
      for (const s of [-0.22, 0.22])
        b.box(0.05, 1.8, 0.05, K.mat(0xc8ccd0, 0.3, 0.8), [-5.4 + s, 0.9, -11.6], [0.12, 0, 0], 0);
      for (let k = 0; k < 5; k++)
        b.box(0.44, 0.03, 0.12, K.mat(0xc8ccd0, 0.3, 0.8), [7.6, 0.3 + k * 0.33, -8.4 + 0.04 * k], null, 0);
    }

    /* ---------- dressing: dropped packets, a smear by the butchery, wet floor sign, a cart left in the aisle ---------- */
    {
      const packs = [0xc8202a, 0xe8b020, 0x2a6ab8, 0x3a8a2a, 0xf2f2ee, 0xe86a3a];
      for (const [px, pz] of [
        [-13.3, 0.4],
        [-13.2, -0.9],
        [-10.7, 1.6],
        [-0.1, -0.4],
        [0.3, 1.9],
        [3.1, 0.8],
        [-6.4, 2.2],
        [-7.3, -1.8],
        [5.6, 1.3],
        [-15.6, 1.9]
      ])
        for (let k = 0; k < 2 + Math.floor(rnd() * 3); k++) {
          const big = rnd() < 0.4;
          b.box(
            big ? 0.22 : 0.14,
            0.05,
            big ? 0.3 : 0.1,
            K.mat(packs[Math.floor(rnd() * 6)], 0.6),
            [px + (rnd() - 0.5) * 0.7, 0.07, pz + (rnd() - 0.5) * 0.7],
            [0, rnd() * PI, 0],
            0.005
          );
        }
      // spilled cereal and a broken jar of preserves
      for (let k = 0; k < 40; k++)
        b.box(
          0.025,
          0.012,
          0.025,
          K.mat(0xd8a050, 0.8),
          [3.1 + (rnd() - 0.5) * 0.8, 0.052, -1.6 + (rnd() - 0.5) * 0.5],
          [0, rnd() * PI, 0],
          0
        );
      const smear = K.paint(
        'gm_smear',
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
      b.label(1.4, 1.4, smear, [-12.4, 0.051, -1.6], [-PI / 2, 0, 0.4]);
      b.label(0.8, 0.8, smear, [-5.8, 0.051, -0.1], [-PI / 2, 0, 2.1]);
      b.label(0.9, 0.9, smear, [-14.4, 0.051, -5.0], [-PI / 2, 0, 1.0]);
      // toppled wet floor sign
      const wet = board('gm_wet', 'CAUTION', 'WET FLOOR', '#f2c418', '#1a1a1a', 200, 260);
      b.label(0.3, 0.6, wet, [-6.6, 0.06, 1.2], [-PI / 2, 0, 0.7]);
      b.box(0.32, 0.02, 0.62, K.mat(0xf2c418, 0.5), [-6.6, 0.045, 1.2], [0, 0.7, 0], 0);
      cart(-2.6, 1.0, 2.6);
      cart(-11.6, -4.6 + 6.6, 1.2, true);
    }

    return (CACHE = G.done());
  }

  function bGoremet(x, z, t) {
    const B = mk(x, z, 40, 36, H, 0xe8e4dc, 0xa4483a, 0x4a4a48);
    B.dx = 0;
    const PT = {th: 0.16, c: 0xece6d6};
    const cp = a => a.map(o => Object.assign({}, o));
    WL(B, 1, Z1, X0, X1, cp(FRONT), H);
    WL(B, 1, Z0, X0, X1, cp(BACK), H);
    WL(B, 0, X0, Z0, Z1, [], H);
    WL(B, 0, X1, Z0, Z1, cp(RIGHT), H);
    WL(B, 1, PZ, X0, X1, cp(PART), H, PT);
    WL(B, 0, PX, Z0, PZ, cp(PARTX), H, PT);
    WL(B, 1, PZ2, X0, PX, [], H, PT);
    WL(B, 0, CX, PZ2, PZ, [], H, PT);
    LK.attach(B, build());
    // vehicles: a car in the front stalls, one in the side lot, the delivery truck in the yard
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
    veh('sedan', -8.5, 11.2, PI, {dust: true});
    veh('civilian', 17.2, 3.3, PI / 2, {dust: true});
    veh('boxtruck', -1.0, -15.6, -PI / 2, {label: 'GORE-MET FOODS', labelCol: '#c8202a', dust: true});
    const SP = LK.spawner(B, 'supermarket');
    // shop floor: wall shelves, gondola aisles, chest freezers, drinks coolers, upright freezers, bread rack, tills
    SP(X0 + 0.45, -0.95, 'shop_shelf_wall', 'supermarket', PI / 2);
    SP(X0 + 0.45, 0.9, 'shop_shelf_wall', 'supermarket', PI / 2);
    for (const [i, gx] of [-14.6, -12.0, -9.4, -0.8, 1.8, 4.4].entries())
      SP(gx, 0.5, i % 3 === 1 ? 'shop_shelves_half' : 'shop_shelves_full', 'supermarket', PI / 2); // v089: 0.5 m forward with the counter
    SP(-5, -0.55, 'chest_freezer_full', 'supermarket', 0);
    SP(-5, 0.55, 'chest_freezer_empty', 'supermarket', PI);
    for (let i = 0; i < 5; i++) SP(7.55, -2.4 + i * 0.76, 'drinks_cooler', 'convenience', -PI / 2);
    SP(5.9, PZ + 0.45, 'freezer_upright', 'supermarket', 0);
    SP(6.75, PZ + 0.45, 'freezer_upright', 'supermarket', 0);
    SP(-8.0, 3.6, 'shop_shelves_low', 'bakery', 0);
    SP(-10.6, -2.2, 'cash_register', 'butcher', PI, 1.02);
    for (const cx of [-1.2, 1.8, 4.8]) SP(cx, 4.4, 'cash_register', 'convenience', PI / 2, 0.92);
    SP(-6.8, -1.9, 'dry_goods_case', 'supermarket', 0.3);
    SP(3.1, 1.9, 'dry_goods_cereal', 'supermarket', 0.8);
    // walk-in cooler: upright freezers, a chest freezer, the prep table
    SP(-16.4, PZ2 + 0.45, 'freezer_upright', 'butcher', 0);
    SP(-15.55, PZ2 + 0.45, 'freezer_upright', 'butcher', 0);
    SP(-13.8, PZ2 + 0.5, 'chest_freezer_full', 'butcher', 0);
    SP(-12.45, -5.2, 'prep_table', 'butcher', -PI / 2);
    // toilet + office
    SP(-9.9, PZ2 + 0.25, 'medicine_cabinet', 'goremet_wc', 0);
    SP(-14.6, -10.2, 'desk_office', 'goremet_office', 0);
    SP(-11.0, PZ2 - 0.5, 'desk_cluttered', 'goremet_office', PI);
    SP(X0 + 0.3, -10.4, 'bookshelf', 'goremet_office', PI / 2);
    // stock room: pallet racking round the walls and an island, boxes and cases waiting to be shelved
    SP(PX + 0.65, -7.6, 'pallet_racking', 'goremet_stock', PI / 2);
    SP(-6.8, Z0 + 0.65, 'pallet_racking', 'goremet_stock', 0);
    SP(-3.9, Z0 + 0.65, 'pallet_racking', 'goremet_stock', 0);
    SP(X1 - 0.65, -6.5, 'pallet_racking', 'goremet_stock', -PI / 2);
    SP(-3.1, -7.85, 'pallet_racking', 'goremet_stock', PI);
    SP(-3.1, -6.75, 'pallet_racking', 'goremet_stock', 0);
    SP(1.6, -6.0, 'cardboard_box_large', 'goremet_stock', 0.2);
    SP(-6.0, -5.0, 'cardboard_box_large', 'goremet_stock', 0);
    SP(4.0, -9.5, 'dry_goods_case', 'goremet_stock', 0);
    SP(-1.8, -5.2, 'dry_goods_case', 'goremet_stock', 0.4);
    SP(3.9, -8.7, 'cardboard_box_medium', 'goremet_stock', -0.3);
    // outside: dumpster in the yard, vending machines on the front walk
    SP(6.0, -16.3, 'dumpster_blue', 'storage', 0);
    SP(6.6, Z1 + 0.45, 'vending_snack', 'convenience', 0);
    SP(-12.6, Z1 + 0.45, 'vending_polar', 'convenience', 0);
    return LK.finish(B, t, {
      at: [(X0 + X1) / 2, (Z0 + Z1) / 2],
      w: X1 - X0,
      d: Z1 - Z0,
      loot: ['supermarket', [-8, -2, 1.6, 2.4], 1],
      zombies: [
        [-5, 2],
        [-10.7, 0],
        [3.1, 0],
        [-12, -3.5],
        [2, -8],
        [-13, -9.5],
        [12, 4],
        [-4, 11]
      ]
    });
  }

  LK.register({
    id: 'lucky_ducky',
    name: 'Gore-met Foods',
    build: bGoremet,
    note: 'full-block gourmet grocery & butcher: big shop floor, butchery counter, walk-in cooler, stock room + delivery dock, office, toilet',
    globals: {bGoremet, GOREMET: {build}}
  });
  console.log('[goremet] Gore-met Foods ready');
})();
