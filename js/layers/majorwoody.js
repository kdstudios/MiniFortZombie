/* ==========================================================================================================
   MINI FORT ZOMBIE - MAJOR WOODY'S ARMY SURPLUS (v089): a half-plot army surplus store (20 x 36 m plot, front = +Z), our own design.
   Replaces the Boots & Bullets Army Surplus placeholder (newlots id army_surplus, half pool).
   Exterior: a 17 x 14.4 m single-storey shop set near the street. Cream render over a red brick plinth, a raised central fascia frame
   carrying a big olive-drab BOMB sign (MAJOR WOODY'S / ARMY SURPLUS, gold lettering, fins and nose), two smaller bomb signs on the
   end bays, a GRAND OPENING banner over the door, a brass plaque, glazed shopfront, sandbags, an ammo-crate bench, sidewalk props.
   Behind: a board-fenced motor pool open to the alley through a wide gap: a block garage with a rolled-up shutter and an army cargo
   truck inside, a second truck and a jeep in the yard, oil drums, jerry cans, tyres, camo netting.
   Interior: the shop floor (beige tile, grey walls, drop ceiling, fluorescent troffers, green APOCALYPSE WOW neon): camo jacket rails,
   pegboard gondolas of fatigues, berets, packs and pouches, a wooden service counter, crates and ration shelving, survival kits.
   Back of house: the AMMO ROOM (crate shelving of 7.62 / 5.56, steel ammo boxes, a counter and till, posters), the manager's office,
   a stock room with the back door, and a staff toilet.
   Structure from core WL (doors / windows work); detail is our own geometry and painted artwork, outside the static merge.
   ========================================================================================================== */
(function () {
  'use strict';
  const K = window.MFZK,
    LK = window.LOTKIT;
  if (!K || !LK || typeof WL !== 'function' || typeof NEWCAT === 'undefined') {
    console.warn('[majorwoody] core / prop kit missing');
    return;
  }
  const T = THREE,
    P = K.P,
    PI = Math.PI;
  // the store box (half plot: x -10..10), heights
  const X0 = -8.5,
    X1 = 8.5,
    Z0 = -1,
    Z1 = 13.4,
    PZ = 5.2, // shop floor / back of house
    XA = 1.6, // ammo room | office + stock room
    ZO = 2.2, // office | stock room
    XW = 6.4, // stock room | staff toilet
    H = 5.0,
    CEIL = 3.7;
  // the garage at the back left of the motor pool, its shutter bay facing the alley
  const GX0 = -9.3,
    GX1 = -2.5,
    GZ0 = -13.6,
    GZ1 = -4.6,
    GH = 4.2,
    GB = [-5.9, 4.2], // bay centre, width
    BH = 3.6; // bay opening height
  const GAP = [-8.6, 1.4]; // the gap in the back fence (alley access)
  const FRONT = [
    {k: 'w', c: -6.9},
    {k: 'w', c: -5.3},
    {k: 'w', c: -3.7},
    {k: 'w', c: -2.1},
    {k: 'd', c: 0},
    {k: 'w', c: 2.1},
    {k: 'w', c: 3.7},
    {k: 'w', c: 5.3},
    {k: 'w', c: 6.9}
  ];
  const RIGHT = [
    {k: 'w', c: 3.7},
    {k: 'w', c: 7.4},
    {k: 'w', c: 10.4}
  ];
  const BACK = [{k: 'd', c: 4.0, s: -1}];
  const PART = [
    {k: 'd', c: -3.2},
    {k: 'd', c: 5.0}
  ];
  const WAOPS = [{k: 'd', c: 0.6}]; // ammo room -> stock room
  const WOOPS = [{k: 'd', c: 3.0}]; // office -> stock room
  const WWOPS = [{k: 'd', c: 0.6, inn: -1}]; // stock room -> toilet
  const GSIDE = [
    {k: 'd', c: -6.4, inn: 1},
    {k: 'w', c: -10.6}
  ];
  const GRUNS = [
    [GX0, GB[0] - GB[1] / 2],
    [GB[0] + GB[1] / 2, GX1]
  ];

  /* ===================== loot tables ===================== */
  try {
    Object.assign(LOOT_TABLES, {
      // the shop floor: field gear, rations, tools
      mw_shop: {
        military_rations: 5,
        herkeys_jerkey: 2,
        water_jug: 3,
        rope: 3,
        duct_tape: 2,
        bungie_cord: 2,
        bug_spray: 2,
        gauze: 2,
        medical_tape: 1,
        machete: 2,
        shovel: 1,
        crowbar: 1
      },
      // ration shelves and food crates
      mw_food: {
        military_rations: 6,
        herkeys_jerkey: 3,
        granola: 2,
        brans: 2,
        crackers: 2,
        tuna: 2,
        sardines: 1,
        rice: 1,
        instant_ramen: 2,
        kenball_soup: 2,
        water_jug: 3,
        stugots_coffee: 1,
        sugar: 1
      },
      // the ammo room
      mw_ammo: {
        ammo_762: 5,
        ammo_556: 5,
        ammo_45: 4,
        ammo_303: 2,
        ammo_12_gauge: 3,
        m1911a1: 2,
        m1_garand: 1,
        lee_enfield: 1,
        pump_shotgun: 1,
        m16: 1,
        machete: 1
      },
      // the motor pool: truck beds, garage
      mw_motor: {
        gas_can: 3,
        car_battery: 2,
        rope: 2,
        duct_tape: 2,
        nails: 2,
        spring: 1,
        military_rations: 2,
        water_jug: 1,
        shovel: 1,
        crowbar: 1,
        ammo_762: 1
      },
      // the office
      mw_office: {
        stugots_coffee: 2,
        cookies: 1,
        colacola: 1,
        painkiller: 2,
        military_rations: 1,
        ammo_45: 2,
        m1911a1: 1
      },
      mw_wc: {gauze: 2, cotton_balls: 2, painkiller: 2, medical_tape: 1, antibiotics: 1}
    });
    const TN = ['mw_shop', 'mw_food', 'mw_ammo', 'mw_motor', 'mw_office', 'mw_wc'];
    for (const tn of TN)
      for (const id in LOOT_TABLES[tn])
        if (!ITEMS[id]) {
          console.error('[majorwoody] loot table ' + tn + ' has unknown item ' + id);
          delete LOOT_TABLES[tn][id];
        }
    if (typeof LOOT_PROP !== 'undefined')
      Object.assign(LOOT_PROP, {
        mw_shop: 'crate',
        mw_food: 'crate',
        mw_ammo: 'ammo_crate',
        mw_motor: 'crate',
        mw_office: 'cabinet',
        mw_wc: 'cabinet'
      });
    const A = window.MFZPROP && MFZPROP.auto;
    if (A) {
      const pick = (...ts) => [...new Set(ts.flatMap(t => A[t] || []))];
      A.mw_shop = pick('gunshop', 'warehouse', 'storage');
      A.mw_food = pick('warehouse', 'storage');
      A.mw_ammo = pick('gunshop');
      A.mw_motor = pick('auto', 'warehouse', 'storage');
      A.mw_office = pick('office');
      A.mw_wc = pick('clinic', 'house');
    }
  } catch (e) {
    console.warn('[majorwoody] loot tables', e);
  }

  /* ===================== artwork ===================== */
  const GOLD = '#e8c45a';
  // the lettering on a bomb: gold serif with a dark outline, transparent elsewhere (laid over the bomb's flank)
  const bombText = (key, l1, l2) =>
    K.paint(
      key,
      1024,
      256,
      (c, W, H) => {
        c.clearRect(0, 0, W, H);
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.lineJoin = 'round';
        const line = (txt, y, px, max) => {
          c.font = 'bold ' + px + 'px Georgia, "Times New Roman", serif';
          const w = c.measureText(txt).width,
            sx = Math.min(1, max / w);
          c.save();
          c.translate(W / 2, y);
          c.scale(sx, 1);
          c.lineWidth = px * 0.12;
          c.strokeStyle = '#1a200c';
          c.strokeText(txt, 0, 0);
          c.fillStyle = GOLD;
          c.fillText(txt, 0, 0);
          c.restore();
        };
        line(l1, 98, 116, W * 0.9);
        line(l2, 196, 58, W * 0.62);
      },
      {glow: 0.15, alpha: true}
    );
  // GRAND OPENING banner, plaque, posters, neon, strap signs
  const strapMat = (key, text, font, bg, fg, w, h) =>
    K.paint(key, w || 512, h || 64, (c, W, H) => {
      c.fillStyle = bg;
      c.fillRect(0, 0, W, H);
      c.fillStyle = fg;
      c.font = font;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      const tw = c.measureText(text).width,
        sx = Math.min(1, (W * 0.94) / tw);
      c.save();
      c.translate(W / 2, H / 2 + 2);
      c.scale(sx, 1);
      c.fillText(text, 0, 0);
      c.restore();
    });
  const plaqueMat = () =>
    K.paint('mw_plaque', 256, 160, (c, W, H) => {
      c.fillStyle = '#6a5420';
      c.fillRect(0, 0, W, H);
      c.strokeStyle = '#d8b860';
      c.lineWidth = 6;
      c.strokeRect(8, 8, W - 16, H - 16);
      c.fillStyle = '#f0d890';
      c.textAlign = 'center';
      c.font = 'bold 30px Georgia, serif';
      c.fillText("MAJOR WOODY'S", W / 2, 50);
      c.font = '20px Georgia, serif';
      c.fillText('Established 1953', W / 2, 84);
      c.fillText('Stand At Ease.', W / 2, 114);
      c.font = 'italic 16px Georgia, serif';
      c.fillText('Shoplifters will be court-martialled', W / 2, 140);
    });
  // painted recruiting-style posters: [key, headline, sub, background, figure colour]
  const POSTERS = [
    ['mw_p1', 'UNCLE SAM', 'WANTS YOUR BRAINS', '#e8dcc0', '#2a3a6a'],
    ['mw_p2', 'LOOSE LIPS', 'GET BITTEN', '#c8b890', '#7a2a1a'],
    ['mw_p3', 'BUY BONDS', 'BUY BULLETS', '#d8c8a0', '#3e4a22'],
    ['mw_p4', 'DIG IN!', 'FOXHOLES 1/2 PRICE', '#e0d0b0', '#5a4020'],
    ['mw_p5', 'KEEP CALM', 'AND AIM FOR THE HEAD', '#b8c098', '#2a2a2a']
  ];
  const posterMat = i => {
    const [key, h1, h2, bg, fg] = POSTERS[i % POSTERS.length];
    return K.paint(key, 192, 288, (c, W, H) => {
      c.fillStyle = bg;
      c.fillRect(0, 0, W, H);
      c.strokeStyle = fg;
      c.lineWidth = 6;
      c.strokeRect(6, 6, W - 12, H - 12);
      // a helmeted head and shoulders
      c.fillStyle = fg;
      c.beginPath();
      c.ellipse(W / 2, 128, 34, 40, 0, 0, PI * 2);
      c.fill();
      c.beginPath();
      c.ellipse(W / 2, 96, 50, 26, 0, PI, PI * 2);
      c.fill();
      c.fillRect(W / 2 - 54, 94, 108, 8);
      c.beginPath();
      c.moveTo(W / 2 - 62, 220);
      c.quadraticCurveTo(W / 2, 150, W / 2 + 62, 220);
      c.fill();
      c.fillStyle = bg;
      c.fillRect(W / 2 - 16, 122, 9, 6);
      c.fillRect(W / 2 + 7, 122, 9, 6);
      c.fillStyle = fg;
      c.textAlign = 'center';
      c.font = 'bold 28px Impact, Arial Black, sans-serif';
      c.fillText(h1, W / 2, 34, W - 24);
      c.font = 'bold 19px Impact, Arial Black, sans-serif';
      c.fillText(h2, W / 2, 252, W - 22);
    });
  };
  // neon script: glow halo + tube + core (one texture, glowing)
  const neonMat = (key, text, col) =>
    K.paint(
      key,
      1024,
      192,
      (c, W, H) => {
        c.clearRect(0, 0, W, H);
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.font = 'italic bold 104px "Brush Script MT", "Segoe Script", cursive';
        const tw = c.measureText(text).width,
          sx = Math.min(1, (W * 0.92) / tw);
        c.save();
        c.translate(W / 2, H / 2);
        c.scale(sx, 1);
        c.shadowColor = col;
        c.shadowBlur = 30;
        c.lineWidth = 10;
        c.strokeStyle = col;
        c.strokeText(text, 0, 0);
        c.shadowBlur = 12;
        c.lineWidth = 5;
        c.strokeStyle = '#e8ffe0';
        c.strokeText(text, 0, 0);
        c.restore();
      },
      {glow: 1.4, alpha: true}
    );

  /* ===================== surfaces ===================== */
  const SURF = {};
  const surf = k =>
    SURF[k] ||
    (SURF[k] = {
      asphalt: () => K.surf('asphalt', 0x3a3c40),
      concrete: () => K.surf('concrete', 0xb4b0a6),
      lawn: () => K.surf('lawn', 0x4a6a2a),
      fence: () => K.surf('wood', 0x5e5048),
      // red brick plinth, stretcher bond
      brick: () =>
        K.tri(
          'mwy_brick',
          (c, W, H, r) => {
            c.fillStyle = '#8a7a6e';
            c.fillRect(0, 0, W, H);
            const rows = 16,
              bh = H / rows,
              bw = W / 4;
            for (let j = 0; j < rows; j++)
              for (let i = -1; i < 5; i++) {
                const x = i * bw + (j % 2 ? bw / 2 : 0);
                c.fillStyle = `hsl(${8 + r() * 10},${42 + r() * 15}%,${38 + r() * 12}%)`;
                c.fillRect(x + 2, j * bh + 2, bw - 4, bh - 4);
              }
            P.noise(c, W, H, r, 6000, 0.15, '#2a1a10', 1.3);
            P.grime(c, W, H, r, 0.3);
          },
          {tile: 1.2, r: 0.9}
        ),
      // pale cream render
      render: () =>
        K.tri(
          'mw_render',
          (c, W, H, r) => {
            c.fillStyle = '#d8d4c8';
            c.fillRect(0, 0, W, H);
            P.noise(c, W, H, r, 9000, 0.08, '#8a8678', 1.2);
            P.noise(c, W, H, r, 4000, 0.06, '#ffffff', 1);
            P.grime(c, W, H, r, 0.25);
          },
          {tile: 2.5, r: 0.95}
        ),
      // painted grey block (garage)
      block: () =>
        K.tri(
          'mw_block',
          (c, W, H, r) => {
            c.fillStyle = '#5c5f62';
            c.fillRect(0, 0, W, H);
            const rows = 8,
              bh = H / rows,
              bw = W / 2;
            c.fillStyle = '#4a4d50';
            for (let j = 0; j < rows; j++) {
              c.fillRect(0, j * bh, W, 3);
              for (let i = 0; i < 3; i++) c.fillRect(i * bw + (j % 2 ? bw / 2 : 0), j * bh, 3, bh);
            }
            P.noise(c, W, H, r, 8000, 0.1, '#2a2c2e', 1.2);
            P.grime(c, W, H, r, 0.5);
          },
          {tile: 1.6, r: 0.92}
        ),
      tile: () =>
        K.tri(
          'mw_tile',
          (c, W, H, r) => {
            c.fillStyle = '#b8b2a4';
            c.fillRect(0, 0, W, H);
            const n = 4,
              s = W / n;
            for (let i = 0; i < n; i++)
              for (let j = 0; j < n; j++) {
                const v = 205 + r() * 14;
                c.fillStyle = `rgb(${v},${v - 4},${v - 14})`;
                c.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
              }
            P.noise(c, W, H, r, 3000, 0.05, '#6a6458', 1);
          },
          {tile: 2.4, r: 0.45}
        ),
      coping: () => K.mat(0x9a968c, 0.7),
      alu: () => K.mat(0x34363a, 0.4, 0.6),
      shutter: () => K.surf('rollshutter', 0x8a9070, {m: 0.4}),
      roof: () => K.surf('concrete', 0x4a4c4e)
    }[k]());

  /* ===================== geometry ===================== */
  let CACHE = null;
  function build() {
    if (CACHE) return CACHE;
    const G = LK.geo('majorwoody'),
      b = G.b,
      S = G.S;
    const conc = surf('concrete'),
      asph = surf('asphalt');
    /* ---------- grounds: sidewalk, front apron, side walks, motor pool ---------- */
    LK.pavement(b, conc, {w: 20, kerb: true});
    b.box(20, 0.04, 15.8 - Z1, conc, [0, 0.02, (Z1 + 15.8) / 2], null, 0); // front apron
    b.box(1.5, 0.04, Z1 - Z0, conc, [-9.25, 0.02, (Z0 + Z1) / 2], null, 0); // side walks
    b.box(1.5, 0.04, Z1 - Z0, conc, [9.25, 0.02, (Z0 + Z1) / 2], null, 0);
    b.box(20, 0.02, 18 + Z0, asph, [0, 0.012, (-18 + Z0) / 2], null, 0); // motor pool, out to the alley
    const brk = surf('brick'),
      rend = surf('render'),
      blk = surf('block'),
      cop = surf('coping'),
      alu = surf('alu'),
      dark = K.mat(0x1c1c1e, 0.5),
      steel = K.mat(0x9a9ea2, 0.4, 0.7),
      galv = K.mat(0xb8bcc0, 0.35, 0.8),
      yel = K.mat(0xf2c418, 0.55),
      lit = K.mat(0xffffff, 0.4, 0, {emissive: 0xf6f8ff, emissiveIntensity: 0.95}),
      wood = K.surf('wood', 0x6a4a2a),
      olive = K.mat(0x1f4a1e, 0.28, 0.25), // glossy bomb green
      oliveM = K.mat(0x4a5230, 0.75), // matt olive drab
      khaki = K.mat(0x8a7e58, 0.85),
      gold = K.mat(0xc8a040, 0.3, 0.85),
      canvas = K.mat(0x55603a, 0.95),
      crateW = K.surf('crate', 0x6a5a3a);
    const rb = (w, h, d, r, m, p, rot) => b.rbox(w, h, d, r, m, p, rot, 1);

    /* ---------- exterior skin: red brick plinth to the sills, cream render above ---------- */
    const SILL = 0.9;
    // ax 1 = along X at z = f; n = outward normal; lo / hi: lower and upper materials, split height
    const skin = (ax, f, a0, a1, n, ops, h, lo, hi, split) => {
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
        put(y0, Math.min(y1, split), lo);
        put(Math.max(y0, split), y1, hi);
      };
      let a = a0;
      for (const p of ops) {
        const hw = p.k === 'w' ? 0.75 : p.k === 'g' ? 0.8 : 0.65;
        pc(a, p.c - hw, 0, h);
        if (p.k === 'w') {
          pc(p.c - hw, p.c + hw, 0, 0.9);
          pc(p.c - hw, p.c + hw, 2.75, h);
        } else pc(p.c - hw, p.c + hw, p.k === 'g' ? 2.5 : 2.4, h);
        a = p.c + hw;
      }
      pc(a, a1, 0, h);
    };
    skin(1, Z1, X0 - 0.15, X1 + 0.15, 1, FRONT, H, brk, rend, SILL);
    skin(1, Z0, X0 - 0.15, X1 + 0.15, -1, BACK, H, brk, rend, SILL);
    skin(0, X1, Z0, Z1, 1, RIGHT, H, brk, rend, SILL);
    skin(0, X0, Z0, Z1, -1, [], H, brk, rend, SILL);
    // the garage: painted block all over, a dark plinth
    const gplinth = K.mat(0x3a3c3e, 0.9);
    skin(1, GZ1, GX0 - 0.15, GX1 + 0.15, 1, [], GH, gplinth, blk, 0.3);
    skin(0, GX0, GZ0, GZ1, -1, [], GH, gplinth, blk, 0.3);
    skin(0, GX1, GZ0, GZ1, 1, GSIDE, GH, gplinth, blk, 0.3);
    for (const [a0, a1] of GRUNS)
      skin(1, GZ0, a0 - (a0 === GX0 ? 0.15 : 0), a1 + (a1 === GX1 ? 0.15 : 0), -1, [], GH, gplinth, blk, 0.3);
    b.box(GB[1], GH - BH, 0.3, blk, [GB[0], (GH + BH) / 2, GZ0], null, 0); // bay header
    // a brick soldier course along the top of the plinth
    b.box(X1 - X0 + 0.36, 0.08, 0.06, cop, [0, SILL, Z1 + 0.2], null, 0);
    for (const s of [-1, 1]) b.box(0.06, 0.08, Z1 - Z0 + 0.3, cop, [s * (X1 + 0.2), SILL, (Z0 + Z1) / 2], null, 0);

    // window frames (dark aluminium) and sills; door frame
    for (const w of FRONT.filter(p => p.k === 'w')) {
      b.box(1.62, 0.07, 0.18, cop, [w.c, 0.9, Z1 + 0.22], null, 0.01);
      b.frame(1.56, 1.9, 0.07, alu, [w.c, 1.825, Z1 + 0.19], 0.06);
    }
    for (const w of RIGHT) {
      b.box(0.18, 0.07, 1.62, cop, [X1 + 0.22, 0.9, w.c], null, 0.01);
      b.push([X1 + 0.19, 1.825, w.c], [0, PI / 2, 0]);
      b.frame(1.56, 1.9, 0.07, alu, [0, 0, 0], 0.06);
      b.pop();
    }
    b.frame(1.42, 2.46, 0.08, alu, [0, 1.23, Z1 + 0.19], 0.08);
    b.frame(1.42, 2.46, 0.08, alu, [BACK[0].c, 1.23, Z0 - 0.19], 0.08);
    b.push([GX1 + 0.19, 1.825, GSIDE[1].c], [0, PI / 2, 0]);
    b.frame(1.56, 1.9, 0.07, alu, [0, 0, 0], 0.06);
    b.pop();
    b.push([GX1 + 0.19, 1.23, GSIDE[0].c], [0, PI / 2, 0]);
    b.frame(1.42, 2.46, 0.08, alu, [0, 0, 0], 0.08);
    b.pop();

    /* ---------- parapet, coping, raised centre fascia, flat roof ---------- */
    b.box(X1 - X0 + 0.4, 0.12, 0.42, cop, [0, H + 0.06, Z1], null, 0.01);
    b.box(X1 - X0 + 0.4, 0.12, 0.42, cop, [0, H + 0.06, Z0], null, 0.01);
    for (const s of [-1, 1]) b.box(0.42, 0.12, Z1 - Z0, cop, [s * X1, H + 0.06, (Z0 + Z1) / 2], null, 0.01);
    b.box(8.0, 1.25, 0.32, rend, [0, H + 0.62, Z1], null, 0); // raised centre over the sign
    b.box(8.3, 0.12, 0.46, cop, [0, H + 1.3, Z1], null, 0.01);
    for (const s of [-1, 1]) b.box(0.3, 1.25, 0.6, rend, [s * 3.85, H + 0.62, Z1 - 0.3], null, 0); // returns
    // the sign frame: a projecting surround with a recessed panel
    b.frame(7.8, 3.3, 0.24, rend, [0, 4.55, Z1 + 0.32], 0.36);
    b.box(7.4, 2.9, 0.04, K.mat(0xe8e6de, 0.9), [0, 4.55, Z1 + 0.2], null, 0);
    b.box(7.9, 0.1, 0.42, cop, [0, 2.88, Z1 + 0.33], null, 0.01);
    // the roof deck, HVAC, vents
    b.box(X1 - X0 - 0.3, 0.06, Z1 - Z0 - 0.3, surf('roof'), [0, H - 0.3, (Z0 + Z1) / 2], null, 0);
    rb(2.2, 1.1, 1.4, 0.05, galv, [-4.5, H + 0.25, 3.5]);
    b.cyl(0.42, 0.42, 0.06, dark, [-4.5, H + 0.82, 3.5], null, 18);
    rb(1.4, 0.8, 1.0, 0.05, galv, [4.8, H + 0.1, -0.2]);
    for (const [vx, vz] of [
      [1.5, 1.0],
      [-1.8, 8.0],
      [6.4, 9.0]
    ])
      b.cyl(0.12, 0.12, 0.6, galv, [vx, H, vz], null, 10);

    /* ---------- the bomb signs ---------- */
    // a horizontal bomb at (x, y, z) facing +Z: len overall, r body radius, dir +1 = fins on the left, tm = lettering (alpha)
    const bomb = (x, y, z, len, r, dir, tm, tw, th) => {
      b.push([x, y, z]);
      const rz = (dir * PI) / 2;
      b.cyl(r, r, len * 0.58, olive, [dir * 0.03 * len, 0, 0], [0, 0, rz], 28);
      b.sph(r, olive, [dir * 0.32 * len, 0, 0], [(0.2 * len) / r, 1, 1], 24); // nose
      b.cyl(r * 0.32, r, len * 0.14, olive, [-dir * 0.33 * len, 0, 0], [0, 0, rz], 24); // tail cone
      b.cyl(r * 0.36, r * 0.36, len * 0.08, olive, [-dir * 0.43 * len, 0, 0], [0, 0, rz], 18); // tail tube
      for (const a of [PI / 4, -PI / 4])
        b.box(len * 0.15, r * 2.8, 0.035, olive, [-dir * 0.42 * len, 0, 0], [a, 0, 0], 0.01); // X fins
      b.cyl(r * 1.02, r * 1.02, 0.08, gold, [dir * 0.26 * len, 0, 0], [0, 0, rz], 28); // gold bands
      b.cyl(r * 1.02, r * 1.02, 0.08, gold, [-dir * 0.24 * len, 0, 0], [0, 0, rz], 28);
      b.sph(r * 0.08, gold, [dir * 0.52 * len - dir * 0.01, 0, 0], null, 8); // fuze tip
      b.label(tw, th, tm, [dir * 0.02 * len, 0, r + 0.02]);
      // brackets back to the wall
      for (const s of [-0.18, 0.18]) b.cyl(0.04, 0.04, 0.6, steel, [s * len, 0, -r - 0.2], [PI / 2, 0, 0], 8);
      b.pop();
    };
    bomb(0, 4.55, Z1 + 1.05, 6.2, 0.66, 1, bombText('mw_bomb1', "MAJOR WOODY'S", 'ARMY SURPLUS'), 3.7, 0.92);
    bomb(-6.5, 3.75, Z1 + 0.62, 3.2, 0.38, 1, bombText('mw_bomb2', "MAJOR WOODY'S", 'ARMY SURPLUS'), 1.9, 0.48);
    bomb(6.5, 3.75, Z1 + 0.62, 3.2, 0.38, -1, bombText('mw_bomb3', "MAJOR WOODY'S", 'ARMY SURPLUS'), 1.9, 0.48);
    // spot lamps over the big bomb
    for (const s of [-2.4, 2.4]) {
      b.cyl(0.03, 0.03, 0.7, dark, [s, 6.05, Z1 + 0.55], [PI / 2.6, 0, 0], 6);
      b.cyl(0.1, 0.14, 0.18, dark, [s, 5.95, Z1 + 0.9], [PI / 1.6, 0, 0], 12);
    }

    /* ---------- shopfront: GRAND OPENING banner, plaque, posters in the glass ---------- */
    b.box(2.2, 0.4, 0.03, K.mat(0xf0ece0, 0.9), [0, 2.66, Z1 + 0.23], null, 0);
    b.label(
      2.12,
      0.34,
      strapMat('mw_grand', 'GRAND OPENING', 'bold 44px Georgia, serif', '#f0ece0', '#7a1a1a', 512, 80),
      [0, 2.66, Z1 + 0.25]
    );
    for (const s of [-1.12, 1.12]) b.cyl(0.012, 0.012, 0.3, steel, [s, 2.72, Z1 + 0.24], [0, 0, s * 0.6], 4);
    b.box(0.52, 0.34, 0.04, gold, [1.0, 1.6, Z1 + 0.2], null, 0.01);
    b.label(0.48, 0.3, plaqueMat(), [1.0, 1.6, Z1 + 0.225]);
    [-5.3, -2.1, 3.7, 6.9].forEach((c, i) =>
      b.label(0.5, 0.75, posterMat(i), [c + (i % 2 ? 0.35 : -0.35), 1.45, Z1 + 0.13])
    );
    b.label(
      1.3,
      0.2,
      strapMat(
        'mw_strap',
        'BOOTS · FATIGUES · RATIONS · CAMPING · AMMO',
        'bold 30px Arial, sans-serif',
        '#3e4a22',
        '#e8c45a',
        1024,
        64
      ),
      [-4.5, 2.6, Z1 + 0.13]
    );
    b.label(
      1.3,
      0.2,
      strapMat(
        'mw_strap2',
        'WE BUY & SELL GOVERNMENT SURPLUS',
        'bold 30px Arial, sans-serif',
        '#3e4a22',
        '#e8c45a',
        1024,
        64
      ),
      [4.5, 2.6, Z1 + 0.13]
    );

    /* ---------- front apron: sandbag walls, an ammo-crate bench, an A-board ---------- */
    const bag = K.mat(0x9a8a62, 0.98);
    const sandbags = (x0, x1, z, rows) => {
      for (let j = 0; j < rows; j++)
        for (let x = x0 + (j % 2 ? 0.28 : 0); x < x1 - 0.2; x += 0.56)
          rb(0.54, 0.2, 0.34, 0.08, bag, [x + 0.27, 0.1 + j * 0.19, z], [0, (j + x) % 2 ? 0.04 : -0.04, 0]);
      S(x0, x1, z - 0.2, z + 0.2, 0, rows * 0.19 + 0.02, true);
    };
    sandbags(-7.9, -2.8, Z1 + 0.5, 3);
    sandbags(2.8, 5.2, Z1 + 0.5, 2);
    // bench of two ammo crates and a plank
    for (const s of [6.1, 7.5]) {
      b.box(0.5, 0.42, 0.45, crateW, [s, 0.21, Z1 + 0.6], null, 0.01);
      b.box(0.52, 0.03, 0.47, oliveM, [s, 0.43, Z1 + 0.6], null, 0);
    }
    b.box(2.0, 0.05, 0.36, wood, [6.8, 0.47, Z1 + 0.6], null, 0.01);
    S(5.8, 7.8, Z1 + 0.35, Z1 + 0.85, 0, 0.5, true);
    // A-board
    b.push([2.4, 0, Z1 + 1.6], [0, 0.3, 0]);
    for (const s of [-1, 1]) {
      b.box(0.6, 0.9, 0.03, K.mat(0x2a2c28, 0.8), [0, 0.45, s * 0.14], [s * 0.16, 0, 0], 0);
      b.label(
        0.52,
        0.78,
        strapMat('mw_aboard', 'FOXHOLES ½ PRICE', 'bold 34px Arial, sans-serif', '#2a2c28', '#f0ece0', 256, 64),
        [0, 0.5, s * 0.16],
        [s * 0.16, s > 0 ? 0 : PI, 0]
      );
    }
    b.pop();
    S(2.1, 2.7, Z1 + 1.35, Z1 + 1.85, 0, 0.9, true);

    /* ---------- the back: door hood, wall lights, STAFF strip ---------- */
    b.box(1.6, 0.06, 0.8, cop, [BACK[0].c, 2.75, Z0 - 0.4], null, 0.01);
    b.label(
      1.5,
      0.19,
      strapMat('mwy_staff', 'STAFF ONLY - NO SALUTING', 'bold 36px Arial, sans-serif', '#3e4a22', '#f0ece0'),
      [BACK[0].c, 3.0, Z0 - 0.17],
      [0, PI, 0]
    );
    for (const lx of [-5, 0.5, 7]) {
      b.box(0.36, 0.22, 0.2, dark, [lx, 3.6, Z0 - 0.26], null, 0.01);
      b.box(0.3, 0.02, 0.14, lit, [lx, 3.49, Z0 - 0.28], null, 0);
    }

    /* ---------- garage: corrugated roof, rolled-up shutter, jamb guards, MOTOR POOL sign ---------- */
    const corr = K.mat(0x4a5638, 0.6, 0.4);
    const gw = GX1 - GX0 + 0.7,
      gd = GZ1 - GZ0 + 0.7;
    b.push([(GX0 + GX1) / 2, GH + 0.18, (GZ0 + GZ1) / 2], [0.04, 0, 0]);
    b.box(gw, 0.05, gd, corr, [0, 0, 0], null, 0);
    for (let x = -gw / 2 + 0.2; x < gw / 2; x += 0.36) b.box(0.06, 0.05, gd, corr, [x, 0.04, 0], null, 0);
    b.pop();
    b.box(gw, 0.3, 0.06, oliveM, [(GX0 + GX1) / 2, GH + 0.06, GZ0 - 0.32], null, 0); // fascia over the bay
    rb(GB[1] + 0.3, 0.5, 0.5, 0.06, K.mat(0x6a7058, 0.45, 0.5), [GB[0], BH + 0.28, GZ0 - 0.4]);
    for (const s of [-1, 1]) {
      b.box(0.1, BH, 0.14, K.mat(0x4a4e44, 0.4, 0.6), [GB[0] + s * (GB[1] / 2 - 0.03), BH / 2, GZ0 - 0.24], null, 0);
      b.box(0.14, 1.2, 0.36, yel, [GB[0] + s * (GB[1] / 2 + 0.07), 0.6, GZ0], null, 0.01);
    }
    b.box(GB[1] - 0.1, 0.08, 0.08, K.mat(0x5a604a, 0.4, 0.6), [GB[0], BH - 0.06, GZ0 - 0.25], null, 0);
    b.box(2.8, 0.42, 0.04, oliveM, [GB[0], GH - 0.28, GZ0 - 0.2], null, 0);
    b.label(
      2.7,
      0.34,
      strapMat(
        'mw_motor',
        'MOTOR POOL · AUTHORIZED PERSONNEL ONLY',
        'bold 32px Arial, sans-serif',
        '#4a5230',
        '#f0ece0',
        1024,
        96
      ),
      [GB[0], GH - 0.28, GZ0 - 0.225],
      [0, PI, 0]
    );
    b.box(0.36, 0.22, 0.2, dark, [GX1 + 0.26, 3.2, GSIDE[0].c], null, 0.01);
    b.box(0.14, 0.02, 0.3, lit, [GX1 + 0.28, 3.09, GSIDE[0].c], null, 0);
    // concrete apron out of the bay
    b.box(GB[1] + 1.2, 0.03, 3.6, K.surf('concrete', 0x9a9890), [GB[0], 0.025, GZ0 - 1.8], null, 0);

    /* ---------- board fences round the motor pool, the gap to the alley with its gates swung open ---------- */
    const fen = surf('fence');
    const fenceRun = (ax, f, a0, a1) => {
      const L = a1 - a0,
        m = (a0 + a1) / 2;
      if (ax) {
        b.box(L, 1.8, 0.06, fen, [m, 0.9, f], null, 0);
        b.box(L, 0.06, 0.1, fen, [m, 1.86, f], null, 0);
        for (let u = a0; u <= a1 + 0.01; u += 2.2) b.box(0.1, 1.9, 0.1, fen, [Math.min(u, a1), 0.95, f], null, 0.01);
        S(a0, a1, f - 0.06, f + 0.06, 0, 1.9, true);
      } else {
        b.box(0.06, 1.8, L, fen, [f, 0.9, m], null, 0);
        b.box(0.1, 0.06, L, fen, [f, 1.86, m], null, 0);
        for (let u = a0; u <= a1 + 0.01; u += 2.2) b.box(0.1, 1.9, 0.1, fen, [f, 0.95, Math.min(u, a1)], null, 0.01);
        S(f - 0.06, f + 0.06, a0, a1, 0, 1.9, true);
      }
    };
    fenceRun(0, -9.9, -17.6, Z0);
    fenceRun(0, 9.9, -17.6, Z0);
    fenceRun(1, -17.6, -9.9, GAP[0]);
    fenceRun(1, -17.6, GAP[1], 9.9);
    // gate leaves swung in against the fence line (board panels on a frame)
    for (const [hx, s] of [
      [GAP[0], 1],
      [GAP[1], -1]
    ]) {
      b.push([hx, 0, -17.6], [0, s * 0.22, 0]);
      b.box(0.06, 1.7, 2.4, fen, [0, 0.95, 1.25], null, 0);
      b.box(0.08, 0.08, 2.4, oliveM, [0.04 * s, 1.6, 1.25], null, 0);
      b.box(0.08, 0.08, 2.4, oliveM, [0.04 * s, 0.35, 1.25], null, 0);
      b.pop();
      S(hx - 0.12 + s * 0.14, hx + 0.12 + s * 0.4, -17.6, -15.2, 0, 1.8, true);
    }
    b.label(
      1.4,
      0.4,
      strapMat('mw_slow', 'CONVOY ENTRANCE - DEAD SLOW', 'bold 34px Arial, sans-serif', '#f2c418', '#1a1a1a', 512, 128),
      [GAP[1] + 1.6, 1.3, -17.66],
      [0, PI, 0]
    );
    /* ---------- interior: floors, linings, ceiling, lights ---------- */
    const greyW = K.mat(0xc4c4be, 0.9),
      greyD = K.mat(0x8a8c8a, 0.9),
      skirt = K.mat(0x3a4228, 0.6),
      hous = K.mat(0xd8d8d4, 0.5, 0.2),
      white = K.mat(0xeeeeea, 0.6),
      tileW = K.mat(0xe8eae6, 0.35),
      oak = K.veneer(0x8a5a32),
      shelfW = K.mat(0xe4e4e0, 0.6, 0.1),
      crateG = K.surf('crate', 0x4d5a2e),
      card = K.surf('cardboard', 0xb8946a),
      red = K.mat(0x8a1a1a, 0.8),
      orange = K.mat(0xe0601a, 0.55),
      camo = K.tri(
        'mw_camo',
        (c, W, H, r) => {
          c.fillStyle = '#6a6a3e';
          c.fillRect(0, 0, W, H);
          for (const col of ['#3e4426', '#8a7a4e', '#2a2a1e', '#56602e'])
            for (let i = 0; i < 26; i++) {
              c.fillStyle = col;
              c.beginPath();
              const x = r() * W,
                y = r() * H;
              c.ellipse(x, y, 10 + r() * 26, 6 + r() * 14, r() * PI, 0, PI * 2);
              c.fill();
            }
        },
        {tile: 0.8, r: 0.95}
      );
    const flr = (x0, x1, z0, z1, m, y) =>
      b.box(x1 - x0 - 0.2, 0.02, z1 - z0 - 0.2, m, [(x0 + x1) / 2, y || 0.035, (z0 + z1) / 2], null, 0);
    flr(X0, X1, PZ, Z1, surf('tile'));
    flr(X0, XA, Z0, PZ, K.surf('concrete', 0x8e8e8a));
    flr(XA, X1, ZO, PZ, K.mat(0x5a5e4a, 0.95)); // office: olive lino
    flr(XA, XW, Z0, ZO, K.surf('concrete', 0x8e8c86));
    flr(XW, X1, Z0, ZO, tileW);
    flr(GX0, GX1, GZ0, GZ1, K.surf('concrete', 0x7e7c78));
    // drop ceiling over the store
    b.box(X1 - X0 - 0.3, 0.04, Z1 - Z0 - 0.3, K.mat(0xe8e6e0, 0.9), [0, CEIL + 0.02, (Z0 + Z1) / 2], null, 0);
    // linings: f is the wall line moved so the lining face sits on a 0.16 partition (or a 0.3 outer wall)
    const shopSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, y1, greyW, 0.012, 0.006);
      if (y0 <= 0 && y1 > 0.2) pc(u0, u1, 0, 0.14, skirt, 0.03, 0.015);
      if (y0 <= 1.0 && y1 >= 1.1) pc(u0, u1, 1.0, 1.06, skirt, 0.02, 0.012);
    };
    const backSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, y1, greyD, 0.012, 0.006);
      if (y0 <= 0 && y1 > 0.2) pc(u0, u1, 0, 0.14, skirt, 0.03, 0.015);
    };
    const wcSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, y1, white, 0.012, 0.006);
      if (y0 <= 0 && y1 > 1.2) pc(u0, u1, 0, 1.3, tileW, 0.02, 0.01);
    };
    const pt = (w, n) => w - n * 0.07; // partition lining line
    const inR = (ops, a0, a1) => ops.filter(o => o.c > a0 && o.c < a1);
    // shop
    LK.lineWall(b, 1, Z1, X0, X1, -1, FRONT, CEIL, shopSpan);
    LK.lineWall(b, 0, X0, PZ, Z1, 1, [], CEIL, shopSpan);
    LK.lineWall(b, 0, X1, PZ, Z1, -1, inR(RIGHT, PZ, Z1), CEIL, shopSpan);
    LK.lineWall(b, 1, pt(PZ, 1), X0, X1, 1, PART, CEIL, shopSpan);
    // ammo room
    LK.lineWall(b, 1, pt(PZ, -1), X0, XA, -1, inR(PART, X0, XA), CEIL, backSpan);
    LK.lineWall(b, 0, X0, Z0, PZ, 1, [], CEIL, backSpan);
    LK.lineWall(b, 1, Z0, X0, XA, 1, [], CEIL, backSpan);
    LK.lineWall(b, 0, pt(XA, -1), Z0, PZ, -1, WAOPS, CEIL, backSpan);
    // office
    LK.lineWall(b, 1, pt(PZ, -1), XA, X1, -1, inR(PART, XA, X1), CEIL, backSpan);
    LK.lineWall(b, 0, X1, ZO, PZ, -1, inR(RIGHT, ZO, PZ), CEIL, backSpan);
    LK.lineWall(b, 0, pt(XA, 1), ZO, PZ, 1, [], CEIL, backSpan);
    LK.lineWall(b, 1, pt(ZO, 1), XA, X1, 1, WOOPS, CEIL, backSpan);
    // stock room
    LK.lineWall(b, 1, pt(ZO, -1), XA, XW, -1, WOOPS, CEIL, backSpan);
    LK.lineWall(b, 1, Z0, XA, XW, 1, BACK, CEIL, backSpan);
    LK.lineWall(b, 0, pt(XA, 1), Z0, ZO, 1, WAOPS, CEIL, backSpan);
    LK.lineWall(b, 0, pt(XW, -1), Z0, ZO, -1, WWOPS, CEIL, backSpan);
    // staff toilet
    LK.lineWall(b, 0, pt(XW, 1), Z0, ZO, 1, WWOPS, CEIL, wcSpan);
    LK.lineWall(b, 1, Z0, XW, X1, 1, [], CEIL, wcSpan);
    LK.lineWall(b, 0, X1, Z0, ZO, -1, [], CEIL, wcSpan);
    LK.lineWall(b, 1, pt(ZO, -1), XW, X1, -1, [], CEIL, wcSpan);
    // troffers over the shop, one or two in each back room; battens in the garage
    const troffer = (lx, lz) => {
      b.box(1.24, 0.04, 0.62, hous, [lx, CEIL - 0.01, lz], null, 0.005);
      b.box(1.16, 0.01, 0.54, lit, [lx, CEIL - 0.035, lz], null, 0);
    };
    for (const lx of [-6.2, -2.4, 1.4, 5.2]) for (const lz of [6.6, 9.4, 12.2]) troffer(lx, lz);
    for (const [lx, lz] of [
      [-6, 2],
      [-2.2, 2],
      [5.2, 3.7],
      [4, 0.6],
      [7.45, 0.6]
    ])
      troffer(lx, lz);
    for (let jz = GZ0 + 1; jz < GZ1; jz += 1.8)
      b.box(GX1 - GX0 - 0.3, 0.2, 0.08, K.mat(0x4a5040, 0.5, 0.6), [(GX0 + GX1) / 2, GH - 0.1, jz], null, 0);
    for (const lz of [-11, -7]) {
      b.box(1.3, 0.07, 0.18, hous, [-5.9, GH - 0.3, lz], null, 0.01);
      b.box(1.22, 0.012, 0.12, lit, [-5.9, GH - 0.34, lz], null, 0);
    }

    /* ---------- shop: the APOCALYPSE WOW neon, a flag, posters ---------- */
    b.box(3.6, 0.7, 0.04, K.mat(0x1a1c18, 0.6, 0.2), [0.9, 2.95, PZ + 0.1], null, 0.01);
    b.label(3.5, 0.66, neonMat('mw_neon', 'Apocalypse Wow', '#4aff6a'), [0.9, 2.95, PZ + 0.13]);
    b.box(0.5, 0.36, 0.03, gold, [-1.6, 2.2, PZ + 0.1], null, 0.01);
    b.label(0.46, 0.32, plaqueMat(), [-1.6, 2.2, PZ + 0.12]);
    // US flag on the left wall
    const flag = K.paint('mw_flag', 256, 160, (c, W, H) => {
      for (let i = 0; i < 13; i++) {
        c.fillStyle = i % 2 ? '#f0ece0' : '#a8202a';
        c.fillRect(0, (i * H) / 13, W, H / 13 + 1);
      }
      c.fillStyle = '#2a3a6a';
      c.fillRect(0, 0, W * 0.42, H * 0.54);
      c.fillStyle = '#f0ece0';
      for (let j = 0; j < 5; j++) for (let i = 0; i < 6; i++) c.fillRect(8 + i * 17, 8 + j * 16, 4, 4);
    });
    b.label(1.4, 0.9, flag, [X0 + 0.19, 2.9, 9.4], [0, PI / 2, 0]);
    [
      [X0 + 0.18, 2.95, 6.4, PI / 2],
      [X0 + 0.18, 2.95, 12.4, PI / 2],
      [X1 - 0.18, 2.95, 8.9, -PI / 2],
      [-6.6, 2.9, PZ + 0.18, 0]
    ].forEach(([px, py, pz, a], i) => b.label(0.5, 0.75, posterMat(i + 1), [px, py, pz], [0, a, 0]));

    /* ---------- shop: camo jacket rails down the left wall, a shelf of helmets over them ---------- */
    const hangRail = (x, z0, z1, sx) => {
      b.cyl(0.015, 0.015, z1 - z0, steel, [x, 1.75, (z0 + z1) / 2], [PI / 2, 0, 0], 6);
      for (const zz of [z0, z1]) b.box(0.04, 0.04, 0.4, steel, [x - sx * 0.2, 1.75, zz], [0, PI / 2, 0], 0);
      for (let zz = z0 + 0.12; zz < z1 - 0.05; zz += 0.11) {
        const m = (zz * 7.3) % 1 > 0.25 ? camo : (zz * 3.1) % 1 > 0.5 ? oliveM : khaki;
        b.box(0.5, 0.78, 0.05, m, [x, 1.32, zz], null, 0.01); // jacket body
        b.box(0.62, 0.12, 0.05, m, [x, 1.66, zz], null, 0); // shoulders
        b.box(0.03, 0.04, 0.03, steel, [x, 1.78, zz], null, 0);
      }
    };
    hangRail(X0 + 0.55, 6.0, 9.0, -1);
    hangRail(X0 + 0.55, 9.8, 12.6, -1);
    S(X0 + 0.15, X0 + 0.85, 5.9, 12.7, 0, 1.9, true);
    b.box(0.4, 0.04, 6.8, shelfW, [X0 + 0.36, 2.25, 9.3], null, 0.01);
    for (let zz = 6.2; zz < 12.6; zz += 0.55) {
      b.sph(0.15, oliveM, [X0 + 0.34, 2.28, zz], [1, 0.62, 1.15], 12); // M1 helmets
      b.box(0.26, 0.012, 0.3, oliveM, [X0 + 0.34, 2.28, zz], null, 0);
    }

    /* ---------- shop: pegboard gondolas of fatigues, berets, packs and kits (right half) ---------- */
    const peg = K.paint('mwy_peg', 256, 256, (c, W, H) => {
      c.fillStyle = '#9a9c9a';
      c.fillRect(0, 0, W, H);
      c.fillStyle = '#5a5c5a';
      for (let y = 8; y < H; y += 16) for (let x = 8; x < W; x += 16) c.fillRect(x - 2, y - 2, 4, 4);
    });
    const folded = (x, y, z, m, n, a) => {
      for (let i = 0; i < n; i++)
        b.box(0.42, 0.07, 0.3, m, [x, y + 0.035 + i * 0.072, z], [0, a + (i % 2 ? 0.05 : -0.04), 0], 0.01);
    };
    const pack = (x, y, z, a, m) => {
      b.push([x, y, z], [0, a, 0]);
      rb(0.4, 0.5, 0.24, 0.07, m || oliveM, [0, 0.25, 0]);
      rb(0.3, 0.18, 0.08, 0.04, m || oliveM, [0, 0.18, 0.14]);
      for (const s of [-0.12, 0.12]) b.box(0.05, 0.42, 0.02, dark, [s, 0.27, -0.13], null, 0);
      b.pop();
    };
    const beret = (x, y, z, m) => b.cyl(0.13, 0.15, 0.06, m, [x, y + 0.03, z], [0.1, 0, 0.12], 14);
    const kit = (x, y, z, m, cross) => {
      rb(0.36, 0.22, 0.24, 0.03, m, [x, y + 0.11, z]);
      if (cross) {
        b.box(0.12, 0.035, 0.012, K.mat(0x2a8a3a, 0.6), [x, y + 0.13, z + 0.125], null, 0);
        b.box(0.035, 0.12, 0.012, K.mat(0x2a8a3a, 0.6), [x, y + 0.13, z + 0.125], null, 0);
      }
    };
    // one double-sided gondola along Z at x, z0..z1
    const gondola = (x, z0, z1) => {
      const L = z1 - z0,
        zc = (z0 + z1) / 2;
      b.box(0.08, 1.8, L, K.mat(0x7a7c7a, 0.5, 0.4), [x, 0.95, zc], null, 0);
      for (const s of [-1, 1]) b.label(L, 1.4, peg, [x + s * 0.045, 1.25, zc], [0, (s * PI) / 2, 0]);
      b.box(0.62, 0.12, L, K.mat(0x5a5c5a, 0.6, 0.3), [x, 0.06, zc], null, 0);
      for (const zz of [z0, z1]) b.box(0.66, 1.86, 0.06, K.mat(0x6a6c6a, 0.5, 0.4), [x, 0.93, zz], null, 0);
      for (const s of [-1, 1])
        for (const y of [0.32, 0.86]) b.box(0.28, 0.025, L - 0.08, shelfW, [x + s * 0.18, y, zc], null, 0);
      // stock: folded fatigues low, kits and packs on the middle shelf, berets and pouches on pegs
      for (const s of [-1, 1]) {
        let k = 0;
        for (let zz = z0 + 0.35; zz < z1 - 0.25; zz += 0.5, k++) {
          folded(x + s * 0.19, 0.335, zz, k % 3 === 2 ? khaki : camo, 3 + (k % 2), 0);
          if (k % 3 === 0) pack(x + s * 0.2, 0.875, zz, s > 0 ? PI / 2 : -PI / 2);
          else if (k % 3 === 1) kit(x + s * 0.2, 0.875, zz, k % 2 ? orange : white, k % 2 === 0);
          else folded(x + s * 0.19, 0.875, zz, oliveM, 2, 0.1);
          if (k % 2) beret(x + s * 0.12, 1.42, zz, k % 4 === 1 ? red : K.mat(0x2a4a2a, 0.9));
          else rb(0.08, 0.16, 0.2, 0.03, oliveM, [x + s * 0.1, 1.45, zz]);
          b.box(0.02, 0.02, 0.1, steel, [x + s * 0.06, 1.55, zz], null, 0); // peg hook
        }
      }
      S(x - 0.34, x + 0.34, z0 - 0.04, z1 + 0.04, 0, 1.9);
    };
    gondola(3.95, 8.4, 12.0);
    gondola(6.55, 8.4, 12.0);

    /* ---------- shop: the service counter, back shelf ---------- */
    const counter = (x0, x1, z0, z1) => {
      const w = x1 - x0,
        d = z1 - z0;
      b.box(w, 0.92, d, oak, [(x0 + x1) / 2, 0.46, (z0 + z1) / 2], null, 0.01);
      b.box(w + 0.06, 0.05, d + 0.06, K.veneer(0x6a4222), [(x0 + x1) / 2, 0.945, (z0 + z1) / 2], null, 0.01);
      b.box(w - 0.04, 0.1, d - 0.04, dark, [(x0 + x1) / 2, 0.05, (z0 + z1) / 2], null, 0);
      S(x0, x1, z0, z1, 0, 1.0);
    };
    counter(-1.6, 2.4, 7.3, 8.0);
    counter(1.7, 2.4, 6.2, 7.3);
    // knives and compasses under glass on the counter, a stack of field manuals, a bell
    b.box(0.9, 0.2, 0.5, K.glass(0xd8eef0, 0.3), [-0.8, 1.07, 7.65], null, 0);
    for (let i = 0; i < 4; i++) b.box(0.18, 0.02, 0.04, steel, [-1.1 + i * 0.2, 0.99, 7.65], [0, 0.3, 0], 0);
    for (let i = 0; i < 4; i++)
      b.box(
        0.22,
        0.03,
        0.3,
        K.mat([0x4a5230, 0x6a5a3a, 0x3a3a2a, 0x5a5e4a][i], 0.9),
        [1.3, 0.985 + i * 0.03, 7.6],
        [0, i * 0.2, 0],
        0
      );
    b.cyl(0.05, 0.06, 0.05, gold, [0.2, 0.995, 7.55], null, 10);
    // back shelf behind the counter: rations by the case
    b.box(3.2, 1.6, 0.42, shelfW, [0.4, 0.8, PZ + 0.32], null, 0);
    for (const y of [0.42, 0.82, 1.22])
      for (let x = -1.0; x < 1.9; x += 0.42)
        b.box(0.36, 0.26, 0.3, (x * 10) % 2 > 1 ? card : crateG, [x, y + 0.13, PZ + 0.32], null, 0.01);
    S(-1.2, 2.0, PZ + 0.1, PZ + 0.55, 0, 1.6, true);

    /* ---------- shop: crate shelving on the back wall, packing crates, window mannequins ---------- */
    const steelShelf = (x0, x1, z, d, h, n, m) => {
      const w = x1 - x0,
        xc = (x0 + x1) / 2;
      for (const sx of [x0 + 0.03, x1 - 0.03])
        for (const sz of [-1, 1]) b.box(0.04, h, 0.04, m, [sx, h / 2, z + sz * (d / 2 - 0.02)], null, 0);
      for (let i = 0; i < n; i++) b.box(w, 0.03, d, m, [xc, 0.15 + (i * (h - 0.2)) / (n - 1), z], null, 0);
    };
    steelShelf(-8.3, -5.4, PZ + 0.4, 0.5, 2.0, 4, shelfW);
    for (const y of [0.17, 0.77, 1.37])
      for (let x = -8.0; x < -5.6; x += 0.62)
        b.box(0.56, 0.36, 0.4, (x * 3) % 2 > 1 ? crateG : crateW, [x, y + 0.18, PZ + 0.4], null, 0.01);
    S(-8.35, -5.35, PZ + 0.12, PZ + 0.68, 0, 2.0, true);
    steelShelf(6.1, 8.3, PZ + 0.4, 0.5, 2.0, 4, shelfW);
    for (const y of [0.17, 0.77, 1.37])
      for (let x = 6.4; x < 8.2; x += 0.6) kit(x, y, PZ + 0.4, y > 1 ? white : oliveM, y > 1);
    S(6.05, 8.35, PZ + 0.12, PZ + 0.68, 0, 2.0, true);
    // wooden packing crates (stencilled)
    const stencil = K.paint('mw_stencil', 256, 128, (c, W, H) => {
      c.fillStyle = '#9a7a4a';
      c.fillRect(0, 0, W, H);
      P.noise(c, W, H, K.rng('mwst'), 2000, 0.12, '#5a4020', 1.2);
      c.fillStyle = '#2a2018';
      c.textAlign = 'center';
      c.font = 'bold 26px "Courier New", monospace';
      c.fillText('PACKING CRATE', W / 2, 44);
      c.font = 'bold 20px "Courier New", monospace';
      c.fillText('U.S. ARMY  ·  THIS SIDE UP', W / 2, 78);
      c.fillText('M.W. SURPLUS 1953', W / 2, 106);
    });
    const crate = (x, z, w, h, d, a) => {
      b.push([x, 0, z], [0, a || 0, 0]);
      b.box(w, h, d, crateW, [0, h / 2, 0], null, 0.01);
      b.label(w * 0.8, h * 0.55, stencil, [0, h * 0.55, d / 2 + 0.006]);
      for (const s of [-1, 1]) b.box(0.06, h, d + 0.02, K.veneer(0x5a3e22), [s * (w / 2 - 0.03), h / 2, 0], null, 0);
      b.pop();
      const c = Math.abs(Math.cos(a || 0)) > 0.7,
        hw = (c ? w : d) / 2 + 0.03,
        hd = (c ? d : w) / 2 + 0.03;
      S(x - hw, x + hw, z - hd, z + hd, 0, h, true);
    };
    crate(-2.5, 12.6, 0.9, 0.7, 0.7, 0.1);
    crate(7.3, 6.6, 1.1, 0.75, 0.8, -0.15); // v089: was (5.3, 6.4), in front of the back-of-house door
    crate(-6.6, 6.5, 0.9, 0.6, 0.7, 0.4);
    // window mannequins in full kit (helmet, jacket, trousers, boots)
    const manne = (x, z, a) => {
      const skin2 = K.mat(0xd8cfc0, 0.5);
      b.push([x, 0, z], [0, a, 0]);
      b.cyl(0.18, 0.2, 0.04, dark, [0, 0.02, 0], null, 16);
      b.cyl(0.015, 0.015, 0.2, steel, [0, 0.12, 0], null, 6);
      for (const s of [-0.09, 0.09]) {
        rb(0.13, 0.82, 0.15, 0.05, camo, [s, 0.62, 0]);
        rb(0.13, 0.12, 0.26, 0.04, dark, [s, 0.16, 0.04]);
      }
      rb(0.44, 0.6, 0.26, 0.08, camo, [0, 1.32, 0]);
      for (const s of [-1, 1]) rb(0.11, 0.56, 0.12, 0.04, camo, [s * 0.27, 1.3, 0], [0, 0, s * 0.08]);
      b.cyl(0.05, 0.05, 0.1, skin2, [0, 1.67, 0], null, 8);
      b.sph(0.11, skin2, [0, 1.8, 0], [1, 1.15, 1], 12);
      b.sph(0.15, oliveM, [0, 1.86, 0], [1, 0.6, 1.1], 14);
      b.pop();
      S(x - 0.25, x + 0.25, z - 0.25, z + 0.25, 0, 1.9, true);
    };
    manne(-6.1, 12.6, 0.3);
    manne(5.9, 12.6, -0.3);

    /* ---------- AMMO ROOM: crate shelving, counter, back bar, posters ---------- */
    // white shelving down the left wall (the loot crates sit on it; see the builder)
    const sideShelf = (x, z0, z1, d, h, n, m) => {
      const zc = (z0 + z1) / 2,
        L = z1 - z0;
      for (const sz of [z0 + 0.03, z1 - 0.03])
        for (const sx of [-1, 1]) b.box(0.05, h, 0.05, m, [x + sx * (d / 2 - 0.02), h / 2, sz], null, 0);
      for (let i = 0; i < n; i++) b.box(d, 0.04, L, m, [x, 0.12 + (i * (h - 0.2)) / (n - 1), zc], null, 0.005);
    };
    sideShelf(X0 + 0.45, -0.4, 4.0, 0.6, 1.9, 3, shelfW);
    S(X0 + 0.12, X0 + 0.78, -0.45, 4.05, 0, 1.9, true);
    // stencilled ammo cases on the top shelf (decor: 7.62 / 5.56)
    const ammoLbl = (k, t) =>
      K.paint('mw_al' + k, 128, 48, (c, W, Hh) => {
        c.fillStyle = k % 2 ? '#9a7a4a' : '#4d5a2e';
        c.fillRect(0, 0, W, Hh);
        c.fillStyle = k % 2 ? '#2a2018' : '#e8e0c0';
        c.font = 'bold 22px "Courier New", monospace';
        c.textAlign = 'center';
        c.fillText(t, W / 2, 32);
      });
    for (let i = 0; i < 6; i++) {
      const zz = -0.05 + i * 0.7,
        lab = i % 2 ? '7.62x51mm' : '5.56x45mm';
      b.box(0.5, 0.3, 0.62, i % 2 ? crateW : crateG, [X0 + 0.45, 1.97, zz], null, 0.01);
      b.label(0.4, 0.15, ammoLbl(i % 2, lab), [X0 + 0.76, 1.98, zz], [0, PI / 2, 0]);
    }
    // the counter (an L: along Z, then a return to the toilet-side wall) with the clerk behind it
    counter(-0.9, -0.2, -0.2, 3.4);
    counter(-0.2, 0.9, 2.8, 3.4);
    b.box(0.4, 0.25, 0.5, K.glass(0xd8eef0, 0.3), [-0.55, 1.1, 1.0], null, 0);
    for (let i = 0; i < 3; i++) rb(0.14, 0.09, 0.08, 0.01, oliveM, [-0.55, 1.03, 0.82 + i * 0.16]);
    // back bar along the partition: boxed rounds on a short shelf
    b.box(0.45, 1.5, 2.0, shelfW, [XA - 0.35, 0.75, 3.95], null, 0);
    for (const y of [0.55, 1.05, 1.52])
      for (let zz = 3.1; zz < 4.85; zz += 0.24)
        b.box(
          0.18,
          0.12,
          0.2,
          K.mat([0x6a2a1a, 0x2a4a6a, 0xc8a040][Math.round(zz * 4) % 3], 0.7),
          [XA - 0.35, y + 0.06, zz],
          null,
          0
        );
    S(XA - 0.6, XA - 0.1, 2.9, 5.0, 0, 1.6, true);
    // chairs (one for the clerk, one by the door)
    const chair = (x, z, a) => {
      b.push([x, 0, z], [0, a, 0]);
      b.box(0.42, 0.04, 0.4, K.veneer(0xb8904a), [0, 0.46, 0], null, 0.01);
      b.box(0.42, 0.3, 0.03, K.veneer(0xb8904a), [0, 0.78, -0.2], [-0.08, 0, 0], 0.01);
      for (const sx of [-0.18, 0.18])
        for (const sz of [-0.17, 0.17]) b.box(0.025, 0.46, 0.025, steel, [sx, 0.23, sz], null, 0);
      b.pop();
      S(x - 0.25, x + 0.25, z - 0.25, z + 0.25, 0, 0.9, true);
    };
    chair(0.5, 1.6, -PI / 2);
    chair(-5.2, 4.5, 0.3);
    [
      [-1.9, 2.4, Z0 + 0.17, 0],
      [-1.2, 2.4, Z0 + 0.17, 0],
      [X0 + 0.17, 2.6, 4.6, PI / 2]
    ].forEach(([px, py, pz, a], i) => b.label(0.5, 0.75, posterMat(i), [px, py, pz], [0, a, 0]));
    // EXIT box over the stock-room door
    b.box(
      0.4,
      0.16,
      0.06,
      K.mat(0xf0ece0, 0.5, 0, {emissive: 0xb02020, emissiveIntensity: 0.6}),
      [XA - 0.2, 2.65, 0.6],
      [0, PI / 2, 0],
      0.01
    );

    /* ---------- OFFICE: desk, map board, flag, safe ---------- */
    b.box(1.6, 0.9, 0.04, K.mat(0x9a8a62, 0.8), [3.4, 1.8, PZ - 0.12], null, 0.01);
    b.label(
      1.5,
      0.8,
      K.paint('mw_map', 256, 160, (c, W, Hh) => {
        c.fillStyle = '#d8cca0';
        c.fillRect(0, 0, W, Hh);
        c.strokeStyle = '#6a8a5a';
        c.lineWidth = 2;
        for (let i = 0; i < 12; i++) {
          c.beginPath();
          c.ellipse(60 + i * 9, 80, 20 + i * 8, 12 + i * 5, 0.3, 0, PI * 2);
          c.stroke();
        }
        c.fillStyle = '#b02020';
        for (const [x, y] of [
          [60, 50],
          [150, 90],
          [200, 40],
          [110, 120]
        ])
          c.fillRect(x - 4, y - 4, 8, 8);
        c.fillStyle = '#2a2018';
        c.font = 'bold 16px "Courier New", monospace';
        c.fillText('SECTOR Z - CLASSIFIED', 10, 150);
      }),
      [3.4, 1.8, PZ - 0.145],
      [0, PI, 0]
    );
    b.label(0.9, 0.58, flag, [X1 - 0.17, 2.4, 4.7], [0, -PI / 2, 0]);
    rb(0.6, 0.7, 0.6, 0.03, K.mat(0x3a3e36, 0.5, 0.5), [7.9, 0.35, PZ - 0.5]); // safe
    b.cyl(0.08, 0.08, 0.03, gold, [7.6, 0.45, PZ - 0.5], [0, 0, PI / 2], 14);
    S(7.6, 8.25, PZ - 0.8, PZ - 0.2, 0, 0.7, true);

    /* ---------- STOCK ROOM: boxes, a stack of crates; STAFF TOILET: WC, basin, mirror ---------- */
    crate(5.85, 1.65, 0.8, 0.6, 0.7, 0);
    b.box(0.7, 0.45, 0.6, crateG, [5.85, 0.83, 1.65], null, 0.01);
    S(5.45, 6.25, 1.25, 2.05, 0, 1.06, true);
    // WC against the back wall, basin and mirror on the right wall
    b.push([7.9, 0, -0.5]);
    rb(0.4, 0.42, 0.55, 0.12, white, [0, 0.21, 0.05]);
    rb(0.44, 0.06, 0.5, 0.15, white, [0, 0.44, 0.1]);
    rb(0.42, 0.4, 0.2, 0.04, white, [0, 0.68, -0.22]);
    b.pop();
    S(7.65, 8.15, -0.85, -0.15, 0, 0.9, true);
    b.box(0.45, 0.16, 0.38, white, [X1 - 0.38, 0.84, 1.45], null, 0.04);
    b.cyl(0.03, 0.03, 0.15, galv, [X1 - 0.24, 0.98, 1.45], null, 8);
    b.box(0.03, 0.6, 0.45, K.mat(0xcfe0e8, 0.08, 0.9), [X1 - 0.17, 1.55, 1.45], null, 0);
    S(X1 - 0.6, X1 - 0.15, 1.2, 1.7, 0, 1.0, true);

    /* ---------- GARAGE interior: oil-stained floor, tyre stack, drums, shelving ---------- */
    const oil = K.mat(0x1a1a18, 0.3, 0, {transparent: true, opacity: 0.55});
    for (const [ox, oz, r] of [
      [-5.9, -9.6, 0.7],
      [-5.6, -7.2, 0.45],
      [4.6, -6.6, 0.55]
    ])
      b.cyl(r, r, 0.004, oil, [ox, 0.05, oz], null, 18);
    const drum = (x, z, m, tip) => {
      if (tip) {
        b.cyl(0.29, 0.29, 0.88, m, [x, 0.29, z], [PI / 2, 0, tip], 16);
        S(x - 0.45, x + 0.45, z - 0.45, z + 0.45, 0, 0.6, true);
        return;
      }
      b.cyl(0.29, 0.29, 0.88, m, [x, 0.44, z], null, 16);
      for (const y of [0.3, 0.6]) b.cyl(0.3, 0.3, 0.03, m, [x, y, z], null, 16);
      b.cyl(0.27, 0.27, 0.01, dark, [x, 0.885, z], null, 16);
      S(x - 0.3, x + 0.3, z - 0.3, z + 0.3, 0, 0.9, true);
    };
    const tyres = (x, z, n) => {
      for (let i = 0; i < n; i++)
        b.tor(0.34, 0.12, K.rubber(), [x + (i % 2) * 0.04, 0.12 + i * 0.22, z], [PI / 2, 0, 0], null, 18);
      S(x - 0.48, x + 0.48, z - 0.48, z + 0.48, 0, n * 0.22, true);
    };
    drum(-3.1, -12.9, oliveM);
    drum(-3.1, -12.2, red);
    drum(-3.7, -12.7, oliveM);
    tyres(-8.75, -12.9, 4);
    tyres(-8.75, -11.9, 2);
    // shelving of olive boxes on the right wall behind the door swing
    sideShelf(GX1 - 0.4, -11.4, -8.6, 0.5, 1.9, 4, K.mat(0x6a6c62, 0.5, 0.4));
    for (const y of [0.14, 0.7, 1.26])
      for (let zz = -11.1; zz < -8.8; zz += 0.55)
        rb(0.36, 0.3, 0.44, 0.02, (zz * 5) % 2 > 1 ? oliveM : khaki, [GX1 - 0.4, y + 0.17, zz]);
    S(GX1 - 0.67, GX1 - 0.13, -11.45, -8.55, 0, 1.9, true);
    // a hanging tyre on the wall, a spare engine on a stand
    b.tor(0.4, 0.13, K.rubber(), [GX0 + 0.3, 2.3, -5.6], [0, PI / 2, 0], null, 18);
    b.box(0.8, 0.6, 0.6, K.mat(0x3a3c3a, 0.5, 0.6), [-8.6, 0.75, -10.3], null, 0.02);
    b.box(0.7, 0.45, 0.04, steel, [-8.6, 0.22, -10.3], null, 0);
    S(-9.05, -8.15, -10.65, -9.95, 0, 1.1, true);

    /* ---------- motor pool: camo net over a crate dump, drums, tyres, sandbags by the back door ---------- */
    const netM = K.paint(
      'mw_net',
      256,
      256,
      (c, W, Hh) => {
        c.clearRect(0, 0, W, Hh);
        const r = K.rng('mwnet');
        for (const col of ['#4a5230', '#6a6a3e', '#2e3420', '#7a6e48'])
          for (let i = 0; i < 70; i++) {
            c.fillStyle = col;
            c.beginPath();
            c.ellipse(r() * W, r() * Hh, 6 + r() * 14, 4 + r() * 8, r() * PI, 0, PI * 2);
            c.fill();
          }
        c.strokeStyle = '#2a2a1e';
        c.lineWidth = 2;
        for (let i = 0; i < W; i += 16) {
          c.beginPath();
          c.moveTo(i, 0);
          c.lineTo(i, Hh);
          c.moveTo(0, i);
          c.lineTo(W, i);
          c.stroke();
        }
      },
      {alpha: true, r: 0.95}
    );
    const NX0 = -0.6, // v089: the net moved 1.1 m east, its corner pole and skirt hung 0.8 m outside the garage side door
      NX1 = 3.0,
      NZ0 = -6.8,
      NZ1 = -3.2;
    for (const [px, pz] of [
      [NX0, NZ0],
      [NX1, NZ0],
      [NX0, NZ1],
      [NX1, NZ1]
    ]) {
      b.cyl(0.04, 0.05, 2.5, wood, [px, 1.25, pz], null, 8);
      S(px - 0.06, px + 0.06, pz - 0.06, pz + 0.06, 0, 2.5, true);
    }
    // two sagging halves of net (planes tilted to a low middle)
    const nw = NX1 - NX0,
      nd = (NZ1 - NZ0) / 2;
    for (const s of [-1, 1]) {
      b.label(
        nw + 0.4,
        nd + 0.15,
        netM,
        [(NX0 + NX1) / 2, 2.3, (NZ0 + NZ1) / 2 + s * nd * 0.5],
        [-PI / 2 + s * 0.18, 0, 0]
      );
      b.label(
        nw + 0.4,
        nd + 0.15,
        netM,
        [(NX0 + NX1) / 2, 2.299, (NZ0 + NZ1) / 2 + s * nd * 0.5],
        [PI / 2 - s * 0.18, 0, 0]
      );
    }
    for (const [px, pz] of [
      [NX0 - 0.2, NZ0],
      [NX1 + 0.2, NZ1]
    ])
      b.label(0.6, 1.2, netM, [px, 1.75, pz], [0, PI / 2, 0.15]); // hanging skirt
    crate(0.9, -6.2, 0.9, 0.7, 0.7, 0.2); // v089: was x -1.1, outside the garage side door
    crate(1.3, -3.8, 1.0, 0.6, 0.7, -0.3);
    // drums along the right fence, one tipped over
    drum(9.3, -1.9, oliveM);
    drum(9.3, -2.55, oliveM);
    drum(8.7, -2.2, red);
    drum(8.6, -3.4, oliveM, 0.4);
    tyres(2.7, -16.7, 3);
    tyres(3.6, -16.9, 5);
    // a sandbag wall by the back door
    sandbags(-1.6, 2.6, Z0 - 0.45, 2);
    // a field telephone pole with a wire over the yard
    b.cyl(0.11, 0.13, 7.5, K.surf('wood', 0x4a3a2a), [9.4, 3.75, -16.8], null, 10);
    b.box(1.4, 0.1, 0.1, K.surf('wood', 0x4a3a2a), [9.4, 7.0, -16.8], null, 0);
    S(9.27, 9.53, -16.93, -16.67, 0, 7.5, true);

    /* ---------- garage bay header (the walls themselves are core WL) ---------- */
    S(GB[0] - GB[1] / 2, GB[0] + GB[1] / 2, GZ0 - 0.15, GZ0 + 0.15, BH, GH, true);

    /* ---------- sidewalk: street lights, meters, hydrant, no parking ---------- */
    LK.lightPole(b, S, -8.2);
    LK.lightPole(b, S, 8.2);
    LK.meter(b, S, -6.4);
    LK.meter(b, S, 4.0);
    LK.hydrant(b, S, 6.3);
    LK.noParking(b, -2.6, {key: 'mw_np1', lines: ['LOADING ZONE']});

    return (CACHE = G.done());
  }

  function bMajorWoody(x, z, t) {
    const B = mk(x, z, 20, 36, H, 0xd8d4c8, 0xb8b2a4, 0x3a4228);
    B.dx = 0;
    const PT = {th: 0.16, c: 0x8a8c88};
    const cp = a => a.map(o => Object.assign({}, o));
    // the store
    WL(B, 1, Z1, X0, X1, cp(FRONT), H);
    WL(B, 1, Z0, X0, X1, cp(BACK), H);
    WL(B, 0, X0, Z0, Z1, [], H);
    WL(B, 0, X1, Z0, Z1, cp(RIGHT), H);
    WL(B, 1, PZ, X0, X1, cp(PART), CEIL + 0.1, PT);
    WL(B, 0, XA, Z0, PZ, cp(WAOPS), CEIL + 0.1, PT);
    WL(B, 1, ZO, XA, X1, cp(WOOPS), CEIL + 0.1, PT);
    WL(B, 0, XW, Z0, ZO, cp(WWOPS), CEIL + 0.1, PT);
    // the garage
    const GW = {c: 0x5c5f62};
    WL(B, 1, GZ1, GX0, GX1, [], GH, GW);
    WL(B, 0, GX0, GZ0, GZ1, [], GH, GW);
    WL(B, 0, GX1, GZ0, GZ1, cp(GSIDE), GH, GW);
    for (const [a0, a1] of GRUNS) WL(B, 1, GZ0, a0, a1, [], GH, GW);
    LK.attach(B, build());
    // army cargo trucks (one in the garage, nose to the bay; one in the yard facing the alley) and a jeep by the gap
    const veh = (kind, lx, lz, rot, o) => {
      try {
        if (!window.MFZV) return;
        const g = MFZV.make(kind, WX(B, lx), WZ(B, lz), rot + (B.cs < 0 ? PI : 0), o || {});
        const h = g && g.userData && g.userData.half;
        const hx = h ? h[0] : 1.3,
          hz = h ? h[1] : 3.6;
        const sw = Math.abs(Math.sin(rot)) > 0.5;
        B.occ.push(sw ? [lx - hz, lx + hz, lz - hx, lz + hx] : [lx - hx, lx + hx, lz - hz, lz + hz]);
      } catch (e) {}
    };
    veh('army', GB[0], -9.2, PI, {dust: true});
    veh('army', 5.0, -9.4, PI, {dust: true});
    veh('jeep', 6.6, -15.4, PI / 2, {dust: true});
    const SP = LK.spawner(B, 'mw_shop');
    // shop floor: ration gondolas, a weapon crate, the till
    SP(-4.2, 10.6, 'shop_shelves_full', 'mw_food', 0);
    SP(-4.2, 8.0, 'shop_shelves_half', 'mw_food', 0);
    SP(1.6, 10.6, 'weapon_crate', 'mw_shop', 0.05);
    SP(0.6, 7.65, 'cash_register', 'convenience', PI, 1.0);
    // ammo room: ammo crates on the shelving, long cases and a stack on the back wall, a gun rack, the till
    for (const [zz, y] of [
      [0.3, 0.14],
      [1.6, 0.14],
      [2.9, 0.14],
      [0.9, 0.99],
      [2.3, 0.99],
      [3.5, 0.99]
    ])
      SP(X0 + 0.45, zz, 'ammo_crate', 'mw_ammo', PI / 2, y);
    SP(-6.4, Z0 + 0.5, 'weapon_crate_long', 'mw_ammo', 0);
    SP(-4.7, Z0 + 0.5, 'weapon_crate_long', 'mw_ammo', 0);
    SP(-2.7, Z0 + 0.6, 'weapon_crate_stack', 'mw_ammo', 0);
    SP(-6.9, PZ - 0.28, 'gun_rack', 'mw_ammo', PI);
    SP(-0.55, 2.2, 'cash_register', 'convenience', -PI / 2, 1.0);
    // office: desk, gun cabinet; toilet: medical cabinet; stock room: boxes
    SP(6.5, 3.0, 'desk_office', 'mw_office', 0);
    SP(XA + 0.32, 3.7, 'gun_cabinet', 'mw_ammo', PI / 2);
    SP(7.0, ZO - 0.3, 'medicine_cabinet', 'mw_wc', PI);
    SP(5.75, -0.45, 'cardboard_box_large', 'mw_food', 0.1);
    SP(2.15, -0.5, 'cardboard_box_medium', 'mw_food', -0.2);
    SP(2.05, 1.75, 'cardboard_box_small', 'mw_shop', 0.3);
    // garage: workbench, tool chest, jerry cans
    SP(GX0 + 0.45, -7.4, 'tool_bench', 'mw_motor', PI / 2);
    SP(GX0 + 0.38, -9.2, 'tool_chest', 'mw_motor', PI / 2);
    SP(-3.0, -7.9, 'jerry_can', 'mw_motor', 0.2);
    SP(-3.6, -11.8, 'jerry_can', 'mw_motor', -0.4);
    // motor pool: the crate dump under the net, a crate by the truck, jerry cans by the store, the dumpster
    SP(0.1, -5.0, 'weapon_crate_stack', 'mw_ammo', 0.1);
    SP(2.55, -9.6, 'weapon_crate', 'mw_motor', PI / 2);
    SP(-2.1, -2.0, 'jerry_can', 'mw_motor', 0.5);
    SP(9.0, -5.4, 'dumpster_green', 'storage', -PI / 2);
    return LK.finish(B, t, {
      at: [(X0 + X1) / 2, (Z0 + Z1) / 2],
      w: X1 - X0,
      d: Z1 - Z0,
      loot: ['mw_shop', [-2, 3, 8, 11], 1],
      zombies: [
        [-5.5, 9.5],
        [3.0, 10.5],
        [-1.0, 6.2],
        [-4.5, 2.5],
        [5.0, 3.8],
        [4.2, 0.6],
        [-0.5, -8.5],
        [2.0, -14.5],
        [-8.2, -9.0],
        [7.6, -3.5]
      ]
    });
  }

  const e = LK.register({
    id: 'army_surplus',
    name: "Major Woody's Army Surplus",
    build: bMajorWoody,
    note: 'half-plot army surplus store: shop floor (camo rails, pegboard gondolas, counter, rations), ammo room, office, stock room; fenced motor pool behind with a garage, army trucks and a jeep, open to the alley',
    globals: {bMajorWoody, MAJORWOODY: {build}}
  });
  if (e) e.loot = 'mw_shop';
  console.log("[majorwoody] Major Woody's Army Surplus ready");
})();
