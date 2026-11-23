/* ==========================================================================================================
   MINI FORT ZOMBIE - PAWNOGRAPHIC (v089): a full-block pawn shop (40 x 36 m plot, front = +Z), our own design. Replaces Golden Fences.
   Exterior: a 26 x 18 m single-storey block. Pink split-face block piers and plinth under a cream stucco fascia, a terracotta tile pent
   roof that wraps the front and the right-hand corner over a covered walk on block piers, big yellow PAWNOGRAPHIC letters with the three
   gold balls, black window wraps (LOANS FOR DAILY NEEDS, LOAN / BUY / SELL, WE BUY GOLD), an OPEN neon, flood lights and a CCTV camera,
   sliding glass front doors. A parking lot in front with a disabled bay, wheel stops, a right-hand lane to a service yard behind
   (dumpster, pallets, cardboard), and the sidewalk (street lights, hydrant, no-parking sign).
   Interior: a large shop floor on oak strip flooring under a drop ceiling with LED panels and a navy brand band round the walls; a full
   wall of lit glass cabinets (phones, cameras, consoles), guitars hung above, an island jewellery counter, power-tool tables, a TV wall,
   bikes, an instruments corner; across the back a high BUYING COUNTER behind a security screen (BUY / LOANS / PICK-UP windows, scales,
   till). Behind it the pawn store: steel shelving with coloured bins, tagged bags and boxes (pawns + buybacks). Back left: a workshop
   with a caged gun vault and bulk materials.
   Structure from core WL (doors / windows work); detail is our own geometry and painted artwork, outside the static merge.
   ========================================================================================================== */
(function () {
  'use strict';
  const K = window.MFZK,
    LK = window.LOTKIT;
  if (!K || !LK || typeof WL !== 'function' || typeof NEWCAT === 'undefined') {
    console.warn('[pawnshop] core / prop kit missing');
    return;
  }
  const T = THREE,
    P = K.P,
    PI = Math.PI;
  // the store box, the back partitions, heights
  const X0 = -16,
    X1 = 10,
    Z0 = -13,
    Z1 = 5,
    PZ = -6, // shop floor / back rooms partition
    PX = -4, // workshop / pawn store partition
    H = 5.0,
    CEIL = 3.7,
    OV = 2.4; // covered walk depth (front and right)
  const YEL = '#f5c518',
    NAVY = '#16203a';
  const FRONT = [
    {k: 'w', c: -14.4},
    {k: 'w', c: -12.8},
    {k: 'w', c: -11.2},
    {k: 'w', c: -9.6},
    {k: 'w', c: -7.6},
    {k: 'd', c: -4.65, dbl: 'slide'},
    {k: 'd', c: -3.35, dbl: 'slide'},
    {k: 'w', c: -1.2},
    {k: 'w', c: 0.4},
    {k: 'w', c: 2.0},
    {k: 'w', c: 3.6},
    {k: 'w', c: 5.2},
    {k: 'w', c: 6.8},
    {k: 'w', c: 8.4}
  ];
  const RIGHT = [
    {k: 'w', c: 3.4},
    {k: 'w', c: 1.8},
    {k: 'w', c: 0.2},
    {k: 'w', c: -1.4},
    {k: 'w', c: -3.0},
    {k: 'd', c: -10.5, s: -1}
  ];
  const BACK = [
    {k: 'd', c: -6.0, s: -1},
    {k: 'd', c: 6.0, s: -1}
  ];
  const PART = [
      {k: 'd', c: -10.0},
      {k: 'd', c: 4.6}
    ],
    PARTX = [{k: 'd', c: -7.6}];

  /* ===================== loot tables ===================== */
  // the floor cases keep the core 'pawn' table; these three cover the gun vault, the workshop's bulk materials and the pawn store
  try {
    Object.assign(LOOT_TABLES, {
      pawn_guns: {
        beretta_9mm: 3,
        glock_22: 2,
        glock_21: 1,
        m1911a1: 2,
        colt_detective_special: 2,
        colt_python: 1,
        colt_new_service_revolver: 1,
        desert_eagle: 1,
        pump_shotgun: 2,
        shotgun: 1,
        lee_enfield: 1,
        model_70_safari: 1,
        ammo_9mm: 3,
        ammo_45: 2,
        ammo_38_fed: 2,
        ammo_357: 1,
        ammo_12_gauge: 2,
        ammo_303: 1
      },
      pawn_tools: {
        nails: 4,
        rope: 3,
        duct_tape: 4,
        bungie_cord: 3,
        spring: 3,
        car_battery: 3,
        gas_cylinder: 2,
        gas_can: 2,
        spray_paint: 2,
        fire_hose: 1,
        crowbar: 2,
        fire_axe: 1,
        shovel: 1,
        sickle: 1,
        machete: 1
      },
      pawn_back: {
        katana: 1,
        broadsword: 1,
        machete: 1,
        baseball_bat: 2,
        crowbar: 1,
        bowling_ball: 2,
        car_battery: 2,
        spring: 2,
        rope: 2,
        duct_tape: 2,
        nails: 2,
        bug_spray: 1,
        butcher_knife: 1,
        beretta_9mm: 1,
        colt_detective_special: 1,
        ammo_9mm: 1,
        ammo_38_fed: 1
      }
    });
    for (const tn of ['pawn_guns', 'pawn_tools', 'pawn_back'])
      for (const id in LOOT_TABLES[tn])
        if (!ITEMS[id]) {
          console.error('[pawnshop] loot table ' + tn + ' has unknown item ' + id);
          delete LOOT_TABLES[tn][id];
        }
    if (typeof LOOT_PROP !== 'undefined')
      Object.assign(LOOT_PROP, {pawn_guns: 'ammo_crate', pawn_tools: 'crate', pawn_back: 'crate'});
    const A = window.MFZPROP && MFZPROP.auto;
    if (A) {
      const pick = (...ts) => [...new Set(ts.flatMap(t => A[t] || []))];
      A.pawn_guns = pick('pawn', 'gunshop');
      A.pawn_tools = pick('hardware');
      A.pawn_back = pick('pawn', 'storage');
    }
  } catch (e) {
    console.warn('[pawnshop] loot tables', e);
  }

  /* ===================== artwork ===================== */
  const IMPACT = "Impact,'Arial Black','MFZ Head',sans-serif";
  // three gold balls, the old pawnbroker's sign
  function balls(c, x, y, r) {
    for (const [dx, dy] of [
      [-r * 1.05, -r * 0.9],
      [r * 1.05, -r * 0.9],
      [0, r * 0.95]
    ]) {
      const g = c.createRadialGradient(x + dx - r * 0.3, y + dy - r * 0.3, r * 0.1, x + dx, y + dy, r);
      g.addColorStop(0, '#fff3b0');
      g.addColorStop(0.45, '#e8b820');
      g.addColorStop(1, '#7a5a08');
      c.fillStyle = g;
      c.beginPath();
      c.arc(x + dx, y + dy, r, 0, PI * 2);
      c.fill();
    }
  }
  // the big raised channel letters (transparent round them)
  const letters = (key, s, w, h, o) =>
    K.paint(
      key,
      w,
      h,
      (c, W, H) => {
        c.clearRect(0, 0, W, H);
        const sz = Math.round(H * 0.86);
        c.font = sz + 'px ' + IMPACT;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        const m = c.measureText(s).width,
          sx = Math.min(1, (W * 0.98) / m);
        c.save();
        c.translate(W / 2, H / 2);
        c.scale(sx, 1);
        c.fillStyle = '#3a2a08';
        c.fillText(s, 5, 6);
        c.lineWidth = 8;
        c.strokeStyle = '#1a1408';
        c.strokeText(s, 0, 0);
        const g = c.createLinearGradient(0, -sz / 2, 0, sz / 2);
        g.addColorStop(0, '#ffe066');
        g.addColorStop(0.55, YEL);
        g.addColorStop(1, '#c8960a');
        c.fillStyle = g;
        c.fillText(s, 0, 0);
        c.restore();
      },
      Object.assign({alpha: true, glow: 0.3, r: 0.4}, o)
    );
  // a window wrap / poster: black panel, yellow headline lines, optional red badge
  const poster = (key, lines, o) => {
    o = o || {};
    return K.paint(
      key,
      o.w || 256,
      o.h || 320,
      (c, W, H, r) => {
        c.fillStyle = o.bg || 'rgba(12,12,14,.9)';
        c.fillRect(0, 0, W, H);
        if (o.stripe) {
          c.fillStyle = o.stripe;
          c.fillRect(0, 0, W, H * 0.16);
        }
        const n = lines.length,
          lh = (H * (o.stripe ? 0.8 : 0.92)) / n,
          y0 = H * (o.stripe ? 0.18 : 0.04);
        lines.forEach((s, i) => {
          const col = Array.isArray(s) ? s[1] : o.col || YEL;
          const t = Array.isArray(s) ? s[0] : s;
          P.text(c, t, W / 2, y0 + lh * (i + 0.5), {
            size: Math.round(lh * 0.82),
            col,
            font: IMPACT,
            max: W * 0.9,
            stroke: '#000',
            lw: 3
          });
        });
        if (o.badge) {
          const bx = W * o.badge[1],
            by = H * o.badge[2],
            br = H * 0.11;
          c.fillStyle = '#d42020';
          c.beginPath();
          for (let i = 0; i < 8; i++) {
            const a = PI / 8 + (i * PI) / 4;
            c.lineTo(bx + Math.cos(a) * br, by + Math.sin(a) * br);
          }
          c.closePath();
          c.fill();
          c.strokeStyle = '#fff';
          c.lineWidth = 4;
          c.stroke();
          P.text(c, o.badge[0], bx, by, {size: Math.round(br * 0.9), col: '#fff', font: IMPACT});
        }
        if (o.tag) P.text(c, o.tag, W / 2, H - 14, {size: 14, col: '#ccc'});
      },
      {alpha: true, r: 0.5, glow: o.glow || 0.12}
    );
  };
  // neon tubes on a dark backing (glows)
  const neon = (key, s, col, w, h) =>
    K.paint(
      key,
      w || 256,
      h || 128,
      (c, W, H) => {
        c.clearRect(0, 0, W, H);
        c.fillStyle = 'rgba(10,10,14,.75)';
        P.rrect(c, 4, 4, W - 8, H - 8, 16);
        c.fill();
        c.shadowColor = col;
        c.shadowBlur = 18;
        c.strokeStyle = col;
        c.lineWidth = 5;
        P.rrect(c, 12, 12, W - 24, H - 24, 12);
        c.stroke();
        c.font = Math.round(H * 0.5) + 'px ' + IMPACT;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.lineWidth = 4;
        c.strokeText(s, W / 2, H / 2 + 2);
        c.fillStyle = '#fff';
        c.fillText(s, W / 2, H / 2 + 2);
      },
      {alpha: true, glow: 1.0, r: 0.3}
    );

  const SURF = {};
  const surf = k =>
    SURF[k] ||
    (SURF[k] = {
      asphalt: () => K.surf('asphalt', 0x3a3c40),
      concrete: () => K.surf('concrete', 0xb4b0a6),
      // pink split-face concrete block
      block: () =>
        K.tri(
          'pg_block',
          (c, W, H, r) => {
            c.fillStyle = '#c8aca2';
            c.fillRect(0, 0, W, H);
            const bw = W / 2,
              bh = H / 4;
            for (let j = 0; j < 4; j++)
              for (let i = -1; i < 3; i++) {
                const x = i * bw + ((j % 2) * bw) / 2;
                c.fillStyle = `hsl(${8 + r() * 8},${30 + r() * 10}%,${74 + r() * 7}%)`;
                c.fillRect(x + 3, j * bh + 3, bw - 6, bh - 6);
                for (let k = 0; k < 220; k++) {
                  c.fillStyle = r() < 0.5 ? 'rgba(90,50,40,.18)' : 'rgba(255,235,225,.16)';
                  c.fillRect(x + 3 + r() * (bw - 8), j * bh + 3 + r() * (bh - 8), 2 + r() * 6, 2 + r() * 4);
                }
              }
            P.grime(c, W, H, r, 0.35);
          },
          {tile: 0.8, r: 0.92}
        ),
      stucco: () =>
        K.tri(
          'pg_stucco',
          (c, W, H, r) => {
            c.fillStyle = '#e6dcc4';
            c.fillRect(0, 0, W, H);
            P.noise(c, W, H, r, 9000, 0.25, '#a89c80', 1.6);
            P.noise(c, W, H, r, 3000, 0.25, '#fffaf0', 1.4);
            P.grime(c, W, H, r, 0.3);
          },
          {tile: 1.2, r: 0.95}
        ),
      // terracotta barrel tiles, courses running across the slope
      tile: () =>
        K.tri(
          'pg_tile',
          (c, W, H, r) => {
            const n = 6,
              m = 4,
              tw = W / n,
              th = H / m;
            c.fillStyle = '#6a2a18';
            c.fillRect(0, 0, W, H);
            for (let j = 0; j < m; j++)
              for (let i = 0; i < n; i++) {
                const x = i * tw,
                  y = j * th,
                  hue = 14 + r() * 8,
                  l = 38 + r() * 12;
                const g = c.createLinearGradient(x, 0, x + tw, 0);
                g.addColorStop(0, `hsl(${hue},55%,${l - 16}%)`);
                g.addColorStop(0.45, `hsl(${hue},60%,${l + 8}%)`);
                g.addColorStop(1, `hsl(${hue},55%,${l - 20}%)`);
                c.fillStyle = g;
                c.fillRect(x + 1, y, tw - 2, th - 4);
                c.fillStyle = 'rgba(30,10,4,.45)';
                c.fillRect(x, y + th - 5, tw, 5);
              }
            P.grime(c, W, H, r, 0.4);
          },
          {tile: 1.1, r: 0.8}
        ),
      // oak strip flooring
      oak: () =>
        K.tri(
          'pg_oak',
          (c, W, H, r) => {
            const n = 8,
              s = H / n;
            for (let i = 0; i < n; i++) {
              let x = -r() * 300;
              while (x < W) {
                const L = 160 + r() * 260;
                c.fillStyle = `hsl(${26 + r() * 8},${26 + r() * 10}%,${36 + r() * 12}%)`;
                c.fillRect(x, i * s, L, s);
                for (let k = 0; k < 6; k++) {
                  c.fillStyle = 'rgba(70,40,20,.18)';
                  c.fillRect(x, i * s + r() * s, L, 1);
                }
                c.fillStyle = 'rgba(40,24,12,.6)';
                c.fillRect(x, i * s, 2, s);
                x += L;
              }
              c.fillStyle = 'rgba(40,24,12,.55)';
              c.fillRect(0, i * s, W, 2);
            }
          },
          {tile: 1.4, r: 0.45}
        ),
      floorC: () => K.surf('concrete', 0x8e8c86),
      ceil: () =>
        K.tri(
          'pg_ceil',
          (c, W, H, r) => {
            c.fillStyle = '#e8e6e0';
            c.fillRect(0, 0, W, H);
            P.noise(c, W, H, r, 6000, 0.25, '#b8b4aa', 1.2);
            c.fillStyle = '#c8c8c4';
            for (let i = 0; i <= 4; i++) {
              c.fillRect((i * W) / 4 - 3, 0, 6, H);
              c.fillRect(0, (i * H) / 4 - 3, W, 6);
            }
          },
          {tile: 2.4, r: 0.9}
        ),
      wall: () => K.mat(0xf0eee8, 0.85),
      grey: () => K.mat(0xb8b8b0, 0.9),
      navy: () => K.mat(0x16203a, 0.6),
      paint: () => K.mat(0xf2f0ea, 0.7),
      coping: () => K.surf('concrete', 0xd8d4c8),
      lawn: () => K.surf('lawn', 0x4a6a2a)
    }[k]());

  let CACHE = null;
  function build() {
    if (CACHE) return CACHE;
    const G = LK.geo('pawnographic'),
      b = G.b,
      S = G.S;
    const conc = surf('concrete'),
      asph = surf('asphalt');
    /* ---------- grounds: sidewalk, asphalt lot ---------- */
    LK.pavement(b, conc, {kerb: true});
    b.box(40, 0.02, 33.8, asph, [0, 0.012, -1.0], null, 0);
    const blk = surf('block'),
      stu = surf('stucco'),
      tile = surf('tile'),
      wht = surf('paint'),
      cop = surf('coping'),
      dark = K.mat(0x1c1c1e, 0.5),
      steel = K.mat(0x9a9ea2, 0.4, 0.7),
      lineW = K.mat(0xf2f2ea, 0.6),
      lineY = K.mat(0xf2c418, 0.6),
      blue = K.mat(0x1f5aa8, 0.6);
    // grass strip down the left edge, with trees placed at build
    b.box(3.4, 0.04, 33.4, surf('lawn'), [-18.3, 0.03, -1.2], null, 0);
    b.box(0.16, 0.16, 33.4, conc, [-16.52, 0.08, -1.2], null, 0.01);

    /* ---------- exterior skin: pink block below, cream stucco fascia above, parapet ---------- */
    const BAND = 3.4;
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
        put(y0, Math.min(y1, BAND), blk);
        put(Math.max(y0, BAND), y1, stu);
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
    skin(1, Z1, X0 - 0.15, X1 + 0.15, 1, FRONT);
    skin(1, Z0, X0 - 0.15, X1 + 0.15, -1, BACK);
    skin(0, X0, Z0, Z1, -1);
    skin(0, X1, Z0, Z1, 1, RIGHT);
    // window trim: dark aluminium frames + a sill on each window
    for (const w of FRONT.filter(p => p.k === 'w')) b.box(1.56, 0.06, 0.12, dark, [w.c, 0.9, Z1 + 0.2], null, 0.01);
    for (const w of RIGHT.filter(p => p.k === 'w')) b.box(0.12, 0.06, 1.56, dark, [X1 + 0.2, 0.9, w.c], null, 0.01);
    // parapet with coping
    const par = (ax, f, a0, a1) => {
      const L = a1 - a0,
        u = (a0 + a1) / 2;
      if (ax) {
        b.box(L, 0.6, 0.3, stu, [u, H + 0.3, f], null, 0);
        b.box(L + 0.1, 0.08, 0.42, cop, [u, H + 0.64, f], null, 0.01);
      } else {
        b.box(0.3, 0.6, L, stu, [f, H + 0.3, u], null, 0);
        b.box(0.42, 0.08, L + 0.1, cop, [f, H + 0.64, u], null, 0.01);
      }
    };
    par(1, Z1, X0 - 0.15, X1 + 0.15);
    par(1, Z0, X0 - 0.15, X1 + 0.15);
    par(0, X0, Z0, Z1);
    par(0, X1, Z0, Z1);
    // flat roof: membrane, HVAC, vent stacks, a skylight
    b.box(X1 - X0, 0.12, Z1 - Z0, K.surf('concrete', 0x5a5a58), [(X0 + X1) / 2, H + 0.02, (Z0 + Z1) / 2], null, 0);
    b.box(X1 - X0 - 0.3, 0.02, Z1 - Z0 - 0.3, K.mat(0x3a3c40, 0.9), [(X0 + X1) / 2, H + 0.09, (Z0 + Z1) / 2], null, 0);
    for (const [hx, hz] of [
      [-8, -4],
      [3, -8]
    ]) {
      b.rbox(2.2, 1.1, 1.5, 0.03, K.mat(0xb0b4b8, 0.4, 0.7), [hx, H + 0.65, hz]);
      b.vents(6, 2.0, 0.8, K.mat(0x6a6c6e, 0.5, 0.6), [hx, H + 0.65, hz + 0.76]);
      b.cyl(0.55, 0.55, 0.1, K.mat(0x2a2a2a, 0.5, 0.4), [hx, H + 1.25, hz], null, 20);
    }
    for (const [vx, vz] of [
      [-13, -10],
      [6, -2],
      [-1, -11]
    ])
      b.cyl(0.08, 0.08, 0.8, K.mat(0x7a7c7e, 0.4, 0.7), [vx, H + 0.5, vz], null, 10);

    /* ---------- covered walk: tile pent roof wrapping the front and the right corner, block piers ---------- */
    const RY = 4.9, // where the tile meets the wall
      FY = 4.1, // fascia top
      SY = 3.5, // soffit
      ang = Math.atan((RY - FY) / OV),
      sl = Math.hypot(OV, RY - FY),
      FX0 = X0 - 0.3,
      FX1 = X1 + OV,
      RZ0 = -5.4; // where the right-hand walk ends
    // front run
    b.box(FX1 - FX0, 0.07, sl + 0.1, tile, [(FX0 + FX1) / 2, (RY + FY) / 2 + 0.05, Z1 + OV / 2], [ang, 0, 0], 0);
    b.box(FX1 - FX0, 0.04, OV, wht, [(FX0 + FX1) / 2, SY, Z1 + OV / 2], null, 0);
    b.box(FX1 - FX0 + 0.02, FY - SY + 0.12, 0.12, stu, [(FX0 + FX1) / 2, (FY + SY) / 2, Z1 + OV], null, 0.01);
    b.cyl(0.07, 0.07, FX1 - FX0, tile, [(FX0 + FX1) / 2, FY + 0.06, Z1 + OV + 0.02], [0, 0, PI / 2], 10);
    // right run
    const rl = Z1 - RZ0;
    b.box(sl + 0.1, 0.07, rl, tile, [X1 + OV / 2, (RY + FY) / 2 + 0.05, (Z1 + RZ0) / 2], [0, 0, -ang], 0);
    b.box(OV, 0.04, rl, wht, [X1 + OV / 2, SY, (Z1 + RZ0) / 2], null, 0);
    b.box(0.12, FY - SY + 0.12, rl + OV, stu, [X1 + OV, (FY + SY) / 2, (Z1 + OV + RZ0) / 2], null, 0.01);
    b.cyl(0.07, 0.07, rl + OV, tile, [X1 + OV + 0.02, FY + 0.06, (Z1 + OV + RZ0) / 2], [PI / 2, 0, 0], 10);
    // hip cap over the corner + gable-end returns
    {
      const hd = new T.Vector3(OV, FY - RY, OV),
        he = new T.Euler().setFromQuaternion(
          new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), hd.clone().normalize())
        );
      b.cyl(0.09, 0.09, hd.length(), tile, [X1 + OV / 2, (RY + FY) / 2 + 0.1, Z1 + OV / 2], [he.x, he.y, he.z], 10);
    }
    b.box(OV, FY - SY + 0.12, 0.12, stu, [X1 + OV / 2, (FY + SY) / 2, RZ0], null, 0.01);
    b.box(0.12, FY - SY + 0.12, OV, stu, [FX0, (FY + SY) / 2, Z1 + OV / 2], null, 0.01);
    // walk slabs
    b.box(FX1 - FX0, 0.14, OV, conc, [(FX0 + FX1) / 2, 0.07, Z1 + OV / 2], null, 0);
    b.box(OV, 0.14, rl, conc, [X1 + OV / 2, 0.07, (Z1 + RZ0) / 2], null, 0);
    // yellow tactile pad at the doors
    b.box(2.6, 0.02, 0.6, lineY, [-4, 0.15, Z1 + OV - 0.35], null, 0);
    // block piers
    const pier = (px, pz) => {
      b.box(0.6, SY, 0.6, blk, [px, SY / 2, pz], null, 0.01);
      b.box(0.7, 0.12, 0.7, cop, [px, SY - 0.06, pz], null, 0.01);
      S(px - 0.3, px + 0.3, pz - 0.3, pz + 0.3, 0, SY);
    };
    const PZ1 = Z1 + OV - 0.35;
    for (const px of [X0 + 0.2, -10.4, -6.3, -1.7, 3.0, 7.0]) pier(px, PZ1);
    pier(FX1 - 0.35, PZ1);
    for (const pz of [1.4, -2.2, RZ0 + 0.35]) pier(FX1 - 0.35, pz);
    // flood lights + a CCTV camera under the soffit
    const lamp = K.mat(0xffffff, 0.4, 0, {emissive: 0xfff4d8, emissiveIntensity: 0.9});
    for (const lx of [-13, -4, 5]) {
      b.box(0.5, 0.18, 0.3, K.mat(0x8a8c90, 0.4, 0.6), [lx, SY - 0.12, Z1 + 0.5], null, 0.01);
      b.box(0.42, 0.01, 0.22, lamp, [lx, SY - 0.215, Z1 + 0.5], null, 0);
    }
    b.push([X1 + OV - 0.5, SY - 0.25, Z1 + OV - 0.5], [0, PI * 0.75, 0]);
    b.box(0.06, 0.2, 0.06, wht, [0, 0.12, 0], null, 0);
    b.rbox(0.14, 0.13, 0.34, 0.03, wht, [0, -0.02, 0.12], [0.35, 0, 0]);
    b.cyl(0.045, 0.045, 0.02, dark, [0, -0.08, 0.3], [PI / 2 + 0.35, 0, 0], 12);
    b.pop();

    /* ---------- signs: PAWNOGRAPHIC letters + gold balls on the fascia, PAWN SHOP on the side, the pylon ---------- */
    b.label(8.4, 0.72, letters('pg_letters', 'PAWNOGRAPHIC', 2048, 176), [-3.4, (FY + SY) / 2 + 0.06, Z1 + OV + 0.07]);
    const gold = K.mat(0xe0b020, 0.25, 0.9),
      goldE = K.mat(0xe0b020, 0.3, 0.8, {emissive: 0x4a3400, emissiveIntensity: 0.6});
    // three balls hung from a bracket at each end of the lettering
    for (const bx of [-8.3, 1.5]) {
      b.box(0.06, 0.06, 0.5, dark, [bx, 3.95, Z1 + OV + 0.3], null, 0);
      b.cyl(0.012, 0.012, 0.4, dark, [bx, 3.75, Z1 + OV + 0.52], null, 6);
      b.push([bx, 3.38, Z1 + OV + 0.52]);
      b.sph(0.13, goldE, [-0.14, 0.12, 0]);
      b.sph(0.13, goldE, [0.14, 0.12, 0]);
      b.sph(0.13, goldE, [0, -0.12, 0]);
      b.box(0.36, 0.03, 0.03, gold, [0, 0.25, 0], null, 0);
      b.pop();
    }
    b.label(
      4.4,
      0.62,
      letters('pg_side', 'PAWN SHOP', 1024, 144),
      [X1 + OV + 0.07, (FY + SY) / 2 + 0.06, -0.6],
      [0, PI / 2, 0]
    );
    const disc = K.paint(
      'pg_disc',
      256,
      256,
      (c, W, H) => {
        c.clearRect(0, 0, W, H);
        c.fillStyle = '#1a1a1c';
        c.beginPath();
        c.arc(W / 2, H / 2, W / 2 - 4, 0, PI * 2);
        c.fill();
        c.strokeStyle = YEL;
        c.lineWidth = 10;
        c.stroke();
        balls(c, W / 2, H / 2 - 8, 34);
        P.text(c, 'EST. 1999', W / 2, H - 46, {size: 26, col: YEL, font: IMPACT});
      },
      {alpha: true, glow: 0.35, r: 0.4}
    );
    b.cyl(0.42, 0.42, 0.1, dark, [X1 + OV + 0.1, 3.8, 2.6], [0, 0, PI / 2], 24);
    b.label(0.8, 0.8, disc, [X1 + OV + 0.16, 3.8, 2.6], [0, PI / 2, 0]);
    // pylon sign on the front right corner of the lot
    const pyl = K.paint(
      'pg_pylon',
      512,
      400,
      (c, W, H) => {
        c.fillStyle = '#121216';
        c.fillRect(0, 0, W, H);
        c.fillStyle = YEL;
        c.fillRect(0, 0, W, 12);
        c.fillRect(0, H - 12, W, 12);
        balls(c, W / 2, 86, 36);
        P.text(c, 'PAWNOGRAPHIC', W / 2, 196, {size: 84, col: YEL, font: IMPACT, max: W - 30, stroke: '#000', lw: 4});
        c.fillStyle = '#d42020';
        c.fillRect(20, 250, W - 40, 4);
        P.text(c, 'LOANS · GOLD · GUNS · TOOLS', W / 2, 296, {size: 38, col: '#fff', font: IMPACT, max: W - 40});
        P.text(c, 'WE BUY ANYTHING*', W / 2, 352, {size: 34, col: YEL, font: IMPACT});
      },
      {glow: 0.45, r: 0.4}
    );
    const PYX = 17.4,
      PYZ = 14.6;
    for (const dx of [-1.1, 1.1]) {
      b.box(0.26, 6.2, 0.26, steel, [PYX + dx, 3.1, PYZ], null, 0.02);
      S(PYX + dx - 0.13, PYX + dx + 0.13, PYZ - 0.13, PYZ + 0.13, 0, 6.2, true);
    }
    b.box(3.3, 2.6, 0.42, dark, [PYX, 6.6, PYZ], null, 0.03);
    b.label(3.14, 2.44, pyl, [PYX, 6.6, PYZ + 0.215]);
    b.label(3.14, 2.44, pyl, [PYX, 6.6, PYZ - 0.215], [0, PI, 0]);
    b.box(3.5, 0.14, 0.5, steel, [PYX, 7.97, PYZ], null, 0.01);
    b.box(0.9, 0.5, 0.9, conc, [PYX, 0.25, PYZ], null, 0.02);

    /* ---------- window wraps, posters, neon ---------- */
    const WZ1 = Z1 + 0.175;
    // LOANS FOR DAILY NEEDS across the right-hand run of windows
    b.label(
      10.9,
      1.85,
      poster('pg_wrap_loans', ['LOANS', 'DAILY NEEDS'], {w: 1024, h: 180, badge: ['FOR', 0.86, 0.5], glow: 0.18}),
      [3.6, 1.825, WZ1]
    );
    // the left run: a poster in the top of each window
    [
      ['pg_p1', [['NOW', '#fff'], 'ACCEPTING', ['GOLD', '#fff']], {stripe: '#d42020'}],
      ['pg_p2', ['WE BUY', ['GIFT', '#fff'], ['CARDS', '#fff']], {}],
      ['pg_p3', ['WE LOAN', ['ON', '#fff'], 'TOOLS'], {stripe: YEL}],
      ['pg_p4', [['CASH', '#7cff7c'], '4', 'GOLD'], {}]
    ].forEach(([k, l, o], i) => b.label(1.42, 1.25, poster(k, l, o), [FRONT[i].c, 2.08, WZ1]));
    b.label(1.1, 0.5, neon('pg_open', 'OPEN', '#ff3a3a'), [-7.6, 2.3, Z1 - 0.12]);
    b.label(1.2, 0.3, neon('pg_30', '30 DAYS!', '#ff5a2a', 256, 64), [-7.6, 1.75, Z1 - 0.12]);
    // hours sign by the door
    b.label(
      0.46,
      0.56,
      K.paint(
        'pg_hours',
        200,
        240,
        (c, W, H) => {
          c.fillStyle = '#fff';
          c.fillRect(0, 0, W, H);
          c.fillStyle = NAVY;
          c.fillRect(0, 0, W, 44);
          P.text(c, 'PAWNOGRAPHIC', W / 2, 22, {size: 22, col: YEL, font: IMPACT});
          ['MON-FRI  9-7', 'SAT  9-6', 'SUN  CLOSED', '', 'ALL ITEMS', 'TESTED'].forEach((s, i) =>
            P.text(c, s, W / 2, 68 + i * 28, {size: 20, col: '#222'})
          );
        },
        {r: 0.5}
      ),
      [-5.6, 1.5, WZ1]
    );
    // right side: LOAN / BUY / SELL, neon
    const RX = X1 + 0.175;
    [
      ['pg_loan', ['L', 'O', 'A', 'N']],
      ['pg_buy', ['B', 'U', 'Y']],
      ['pg_sell', ['S', 'E', 'L', 'L']]
    ].forEach(([k, l], i) =>
      b.label(1.42, 1.8, poster(k, l, {w: 160, h: 220}), [RX, 1.83, RIGHT[i + 1].c], [0, PI / 2, 0])
    );
    b.label(
      1.2,
      0.55,
      neon('pg_gold', 'WE BUY GOLD', '#ffd23a', 384, 160),
      [X1 - 0.12, 2.2, RIGHT[0].c],
      [0, PI / 2, 0]
    );
    b.label(1.2, 0.55, neon('pg_cash', 'CA$H', '#3aff7a'), [X1 - 0.12, 2.2, RIGHT[4].c], [0, PI / 2, 0]);
    // blank left wall: a painted mural sign
    b.label(
      9,
      2.2,
      poster('pg_mural', ['PAWNOGRAPHIC', ['WE BUY · WE SELL · WE LOAN', '#fff']], {
        w: 1024,
        h: 250,
        bg: '#16203a',
        glow: 0.05
      }),
      [X0 - 0.18, 2.1, -1.5],
      [0, -PI / 2, 0]
    );

    /* ---------- parking: stalls, wheel stops, disabled bay, lane arrows ---------- */
    const SZ0 = Z1 + OV + 0.2,
      SZ1 = SZ0 + 5.2;
    for (let sx = -15.6; sx <= 9.8; sx += 2.8)
      if (Math.abs(sx + 7.6) > 1.2) b.box(0.1, 0.012, 5.2, lineW, [sx, 0.03, (SZ0 + SZ1) / 2], null, 0);
    for (let sx = -14.2; sx < 9.8; sx += 2.8) {
      if (Math.abs(sx + 4) < 1.6) continue; // the kerb ramp in front of the doors
      b.box(1.7, 0.12, 0.2, conc, [sx, 0.07, SZ0 + 0.6], null, 0.02);
    }
    // disabled bay + hatched access aisle (x -9.0 .. -6.2) and the ramp area by the doors
    b.box(2.7, 0.011, 5.1, blue, [-7.6, 0.026, (SZ0 + SZ1) / 2], null, 0);
    const chair = K.paint(
      'pg_chair',
      256,
      256,
      (c, W, H) => {
        c.clearRect(0, 0, W, H);
        c.strokeStyle = '#fff';
        c.fillStyle = '#fff';
        c.lineWidth = 14;
        c.beginPath();
        c.arc(118, 160, 58, 0.3, PI * 1.7);
        c.stroke();
        c.beginPath();
        c.arc(126, 48, 18, 0, PI * 2);
        c.fill();
        c.beginPath();
        c.moveTo(124, 72);
        c.lineTo(132, 140);
        c.lineTo(186, 140);
        c.lineTo(200, 200);
        c.stroke();
      },
      {alpha: true, r: 0.7}
    );
    b.label(1.6, 1.6, chair, [-7.6, 0.035, (SZ0 + SZ1) / 2 + 0.6], [-PI / 2, 0, 0]);
    for (let i = 0; i < 7; i++) b.box(1.6, 0.012, 0.1, lineW, [-4.0, 0.03, SZ0 + 0.5 + i * 0.7], [0, 0.6, 0], 0);
    b.box(0.1, 0.012, 5.2, lineW, [-5.0, 0.03, (SZ0 + SZ1) / 2], null, 0);
    b.box(0.1, 0.012, 5.2, lineW, [-3.0, 0.03, (SZ0 + SZ1) / 2], null, 0);
    // reserved sign on a post in front of the bay
    const res = K.paint(
      'pg_reserved',
      160,
      220,
      (c, W, H) => {
        c.fillStyle = '#1f4fa0';
        c.fillRect(0, 0, W, H);
        c.strokeStyle = '#fff';
        c.lineWidth = 5;
        c.strokeRect(6, 6, W - 12, H - 12);
        c.drawImage(chair.map.image, 20, 14, 120, 120);
        P.text(c, 'RESERVED', W / 2, 160, {size: 24, col: '#fff', font: IMPACT});
        P.text(c, 'FOR DISABLED', W / 2, 192, {size: 20, col: '#fff', font: IMPACT});
      },
      {r: 0.5}
    );
    b.cyl(0.035, 0.035, 2.2, steel, [-7.6, 1.1, SZ0 - 0.25], null, 8);
    // v090: plate and sign in front of the post (they were 4 cm back inside it)
    b.box(0.46, 0.62, 0.02, steel, [-7.6, 1.95, SZ0 - 0.2], null, 0);
    b.label(0.44, 0.6, res, [-7.6, 1.95, SZ0 - 0.186]);
    S(-7.66, -7.54, SZ0 - 0.31, SZ0 - 0.19, 0, 2.3, true);
    // lane arrows down the right side
    const arrow = K.paint(
      'pg_arrow',
      128,
      256,
      (c, W, H) => {
        c.clearRect(0, 0, W, H);
        c.fillStyle = '#f2f2ea';
        c.beginPath();
        c.moveTo(W / 2, 8);
        c.lineTo(W - 10, 90);
        c.lineTo(W * 0.65, 90);
        c.lineTo(W * 0.65, H - 8);
        c.lineTo(W * 0.35, H - 8);
        c.lineTo(W * 0.35, 90);
        c.lineTo(10, 90);
        c.closePath();
        c.fill();
      },
      {alpha: true, r: 0.7}
    );
    b.label(0.9, 1.8, arrow, [16, 0.03, 4], [-PI / 2, 0, PI]);
    b.label(0.9, 1.8, arrow, [16, 0.03, -8], [-PI / 2, 0, PI]);

    /* ---------- service yard behind: block wall, pallets, cardboard ---------- */
    b.box(32, 1.4, 0.3, blk, [-4, 0.7, -17.6], null, 0.01);
    b.box(32.1, 0.08, 0.4, cop, [-4, 1.44, -17.6], null, 0.01);
    S(-20, 12, -17.75, -17.45, 0, 1.4);
    const pal = K.veneer(0x9a7a50, {tile: 0.4});
    for (let i = 0; i < 4; i++) {
      const py = 0.07 + i * 0.15;
      for (let k = 0; k < 5; k++)
        b.box(1.2, 0.025, 0.14, pal, [-12, py + 0.06, -15.4 + (k - 2) * 0.24], [0, 0.05 * i, 0], 0);
      for (const dz of [-0.45, 0, 0.45]) b.box(1.2, 0.09, 0.1, pal, [-12, py, -15.4 + dz], [0, 0.05 * i, 0], 0);
    }
    S(-12.7, -11.3, -16.1, -14.7, 0, 0.66);
    const card = K.surf('cardboard', 0xb08a58);
    for (const [cx, cz, cw, ch, ca] of [
      [-9, -15.2, 0.8, 0.5, 0.2],
      [-9.4, -16.0, 0.6, 0.4, -0.3],
      [-8.6, -15.9, 1.0, 0.12, 0.8],
      [-9.1, -15.3, 0.5, 0.35, 0.5]
    ])
      b.box(cw, ch, cw * 0.8, card, [cx, ch / 2 + (cw === 0.5 ? 0.5 : 0), cz], [0, ca, 0], 0.01);
    S(-9.8, -8.2, -16.4, -14.8, 0, 0.9, true);
    // the old cardboard box left on the walk, and a bike rack
    b.box(1.5, 0.3, 0.5, card, [9.0, 0.29, Z1 + 0.6], [0, 0.05, 0], 0.01);
    for (let i = 0; i < 4; i++)
      b.tube(
        [
          [-13.8 + i * 0.6, 0.14, Z1 + 1.4],
          [-13.8 + i * 0.6, 0.9, Z1 + 1.4],
          [-13.8 + i * 0.6, 0.9, Z1 + 1.9],
          [-13.8 + i * 0.6, 0.14, Z1 + 1.9]
        ],
        0.025,
        steel,
        24,
        8
      );
    S(-14, -11.8, Z1 + 1.35, Z1 + 1.95, 0, 0.9, true);

    /* ---------- sidewalk: street lights, hydrant, no parking ---------- */
    LK.lightPole(b, S, -12);
    LK.lightPole(b, S, 8);
    LK.hydrant(b, S, 2.5);
    LK.noParking(b, -17);
    LK.meter(b, S, -4.5);

    /* ---------- interior: floors, linings, ceiling, lights ---------- */
    const wl = surf('wall'),
      gry = surf('grey'),
      nav = surf('navy'),
      base = K.mat(0x2a2a2c, 0.6),
      chrome = K.chrome(),
      glass = K.glass(0xdfeff4, 0.18),
      rnd = b.rnd;
    b.box(X1 - X0 - 0.3, 0.02, Z1 - PZ - 0.2, surf('oak'), [(X0 + X1) / 2, 0.035, (Z1 + PZ) / 2], null, 0);
    b.box(X1 - X0 - 0.3, 0.02, PZ - Z0 - 0.2, surf('floorC'), [(X0 + X1) / 2, 0.035, (PZ + Z0) / 2], null, 0);
    b.box(X1 - X0 - 0.3, 0.04, Z1 - Z0 - 0.3, surf('ceil'), [(X0 + X1) / 2, CEIL + 0.02, (Z0 + Z1) / 2], null, 0);
    // shop: white walls, black skirting, a navy brand band with a yellow pinstripe under the ceiling
    const shopSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, Math.min(y1, CEIL - 0.7), wl, 0.012, 0.006);
      if (y1 > CEIL - 0.7) pc(u0, u1, Math.max(y0, CEIL - 0.7), y1, nav, 0.014, 0.007);
      if (y0 <= 0 && y1 > 0.15) pc(u0, u1, 0, 0.12, base, 0.03, 0.015);
      if (y0 <= CEIL - 0.76 && y1 >= CEIL - 0.7)
        pc(u0, u1, CEIL - 0.76, CEIL - 0.72, K.mat(0xf5c518, 0.5), 0.02, 0.012);
    };
    const backSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, y1, gry, 0.012, 0.006);
      if (y0 <= 0 && y1 > 0.15) pc(u0, u1, 0, 0.1, K.mat(0x4a4a48, 0.7), 0.03, 0.015);
    };
    const rightShop = RIGHT.filter(p => p.c > PZ),
      rightBack = RIGHT.filter(p => p.c < PZ);
    LK.lineWall(b, 1, Z1, X0, X1, -1, FRONT, CEIL, shopSpan);
    LK.lineWall(b, 0, X0, PZ, Z1, 1, [], CEIL, shopSpan);
    LK.lineWall(b, 0, X1, PZ, Z1, -1, rightShop, CEIL, shopSpan);
    LK.lineWall(b, 1, PZ - 0.07, X0, X1, 1, PART, CEIL, shopSpan);
    LK.lineWall(
      b,
      1,
      PZ + 0.07,
      X0,
      PX,
      -1,
      PART.filter(p => p.c < PX),
      CEIL,
      backSpan
    );
    LK.lineWall(
      b,
      1,
      PZ + 0.07,
      PX,
      X1,
      -1,
      PART.filter(p => p.c > PX),
      CEIL,
      backSpan
    );
    LK.lineWall(b, 1, Z0, X0, X1, 1, BACK, CEIL, backSpan);
    LK.lineWall(b, 0, X0, Z0, PZ, 1, [], CEIL, backSpan);
    LK.lineWall(b, 0, X1, Z0, PZ, -1, rightBack, CEIL, backSpan);
    LK.lineWall(b, 0, PX - 0.07, Z0, PZ, 1, PARTX, CEIL, backSpan);
    LK.lineWall(b, 0, PX + 0.07, Z0, PZ, -1, PARTX, CEIL, backSpan);
    // brand lettering on the band
    const band = letters('pg_band', 'PAWNOGRAPHIC', 1024, 128, {glow: 0.5});
    b.label(3.2, 0.42, band, [X0 + 0.18, CEIL - 0.36, -0.6], [0, PI / 2, 0]);
    b.label(3.2, 0.42, band, [-5.6, CEIL - 0.36, PZ + 0.09]);
    // LED panels in the shop, fluorescent battens out back
    const lit = K.mat(0xffffff, 0.4, 0, {emissive: 0xf6f8ff, emissiveIntensity: 0.95}),
      hous = K.mat(0xd8d8d4, 0.5, 0.2);
    for (let lx = -14; lx < 9.5; lx += 3)
      for (const lz of [-3.6, 0, 3.4]) {
        b.box(0.62, 0.04, 0.62, hous, [lx, CEIL - 0.01, lz], null, 0.005);
        b.box(0.56, 0.01, 0.56, lit, [lx, CEIL - 0.035, lz], null, 0);
      }
    for (const [lx, lz] of [
      [-12, -8.4],
      [-8, -11],
      [-2, -9.6],
      [2.2, -8],
      [5.6, -11],
      [8, -7.6],
      [2.2, -11.6]
    ]) {
      b.box(1.3, 0.07, 0.18, hous, [lx, CEIL - 0.04, lz], null, 0.01);
      b.box(1.22, 0.012, 0.12, lit, [lx, CEIL - 0.08, lz], null, 0);
    }

    /* ---------- shop: wall of lit glass cabinets (phones, cameras, consoles) down the left wall ---------- */
    const cabW = K.mat(0xf4f4f0, 0.5),
      cabLit = K.mat(0xffffff, 0.5, 0, {emissive: 0xffffff, emissiveIntensity: 0.35}),
      goods = [0x1a1a1c, 0x2a2a2e, 0xd8d8d8, 0x3a5aa8, 0xc82a2a, 0x2a8a4a, 0xe8b820, 0x6a6a70];
    const CZ0 = PZ + 0.5,
      CZ1 = Z1 - 0.6,
      bays = Math.floor((CZ1 - CZ0) / 1.25);
    b.push([X0 + 0.15 + 0.29, 0, 0], [0, PI / 2, 0]); // local +z faces into the shop, local x runs along -world z
    for (let i = 0; i < bays; i++) {
      const u = -(CZ0 + 0.625 + i * 1.25);
      b.box(1.25, 0.32, 0.56, nav, [u, 0.16, 0], null, 0);
      b.box(1.2, 2.0, 0.02, cabLit, [u, 1.32, -0.26], null, 0);
      b.box(0.04, 2.0, 0.56, cabW, [u - 0.6, 1.32, 0], null, 0);
      for (let s = 0; s < 5; s++) {
        const y = 0.36 + s * 0.42;
        b.box(1.18, 0.012, 0.5, glass, [u, y, 0], null, 0);
        for (let k = 0; k < 6; k++) {
          if (rnd() < 0.2) continue;
          const w = 0.06 + rnd() * 0.12,
            h = 0.06 + rnd() * 0.2;
          b.box(
            w,
            h,
            0.06 + rnd() * 0.12,
            K.mat(goods[Math.floor(rnd() * goods.length)], 0.5),
            [u - 0.5 + k * 0.19, y + h / 2 + 0.01, -0.1 + rnd() * 0.12],
            [0, rnd() * 0.4 - 0.2, 0],
            0
          );
        }
        b.box(1.18, 0.03, 0.01, K.mat(0xf5c518, 0.5), [u, y - 0.02, 0.255], null, 0);
      }
      b.plane(1.18, 1.96, glass, [u, 1.34, 0.28]);
      b.box(1.25, 0.06, 0.58, cabW, [u, 2.35, 0], null, 0);
    }
    b.box(0.04, 2.0, 0.56, cabW, [-(CZ0 + bays * 1.25), 1.32, 0], null, 0);
    b.pop();
    S(X0 + 0.15, X0 + 0.75, CZ0, CZ0 + bays * 1.25, 0, 2.4);
    // a lit price strip over the cabinets
    b.label(
      4.6,
      0.32,
      poster('pg_cabstrip', [['PHONES · CAMERAS · GAMES · TABLETS', '#fff']], {
        w: 1024,
        h: 72,
        bg: '#16203a',
        glow: 0.4
      }),
      [X0 + 0.19, 2.62, -0.6],
      [0, PI / 2, 0]
    );

    /* ---------- shop: bikes in the front window, jewellery island ---------- */
    const bike = (x, z, ry, col) => {
      const fr = K.mat(col, 0.35, 0.6),
        tyre = K.rubber();
      b.push([x, 0.37, z], [0, ry, 0]);
      for (const wx of [-0.52, 0.52]) {
        b.tor(0.33, 0.025, tyre, [wx, 0, 0], null, null, 28);
        b.cyl(0.03, 0.03, 0.08, chrome, [wx, 0, 0], [PI / 2, 0, 0], 8);
      }
      b.tube(
        [
          [-0.52, 0, 0],
          [-0.1, 0.02, 0],
          [0.38, 0.42, 0],
          [-0.18, 0.46, 0],
          [-0.1, 0.02, 0]
        ],
        0.022,
        fr,
        40,
        6
      );
      b.tube(
        [
          [-0.52, 0, 0],
          [-0.18, 0.46, 0]
        ],
        0.016,
        fr,
        10,
        6
      );
      b.tube(
        [
          [0.52, 0, 0],
          [0.4, 0.62, 0]
        ],
        0.02,
        fr,
        10,
        6
      );
      b.box(0.04, 0.03, 0.5, K.mat(0x1a1a1a, 0.5), [0.38, 0.66, 0], null, 0);
      b.rbox(0.24, 0.05, 0.1, 0.02, K.mat(0x1a1a1a, 0.6), [-0.2, 0.52, 0]);
      b.pop();
    };
    bike(-14.2, 4.3, 0.15, 0x2aa84a);
    bike(-12.6, 4.25, -0.1, 0xc82a2a);
    bike(-11.0, 4.35, 0.05, 0x2a4aa8);
    S(-15, -10.2, 4.0, 4.7, 0, 1.0, true);
    // glass showcases: chrome-edged glass box on a white base, gold chains / rings / watches on black felt
    const felt = K.mat(0x121214, 0.95),
      silver = K.mat(0xd8dadc, 0.2, 1),
      baseW = K.paintSteel(0xf2f0ea, {m: 0, r: 0.5});
    const showcase = (x, z, ry, L) => {
      b.push([x, 0, z], [0, ry, 0]);
      b.rbox(L, 0.62, 0.62, 0.01, baseW, [0, 0.31, 0]);
      b.box(L, 0.08, 0.6, base, [0, 0.04, 0.02], null, 0);
      b.box(L - 0.04, 0.012, 0.58, felt, [0, 0.635, 0], null, 0);
      const gh = 0.36,
        y0 = 0.64;
      b.plane(L - 0.02, gh, glass, [0, y0 + gh / 2, 0.3]);
      b.plane(L - 0.02, gh, glass, [0, y0 + gh / 2, -0.3], [0, PI, 0]);
      b.plane(0.6, gh, glass, [L / 2 - 0.01, y0 + gh / 2, 0], [0, PI / 2, 0]);
      b.plane(0.6, gh, glass, [-L / 2 + 0.01, y0 + gh / 2, 0], [0, -PI / 2, 0]);
      b.plane(L - 0.02, 0.6, glass, [0, y0 + gh, 0], [-PI / 2, 0, 0]);
      for (const sx of [-1, 1])
        for (const sz of [-1, 1])
          b.box(0.014, gh, 0.014, chrome, [sx * (L / 2 - 0.01), y0 + gh / 2, sz * 0.29], null, 0);
      for (const sz of [-1, 1]) b.box(L, 0.014, 0.014, chrome, [0, y0 + gh, sz * 0.29], null, 0);
      for (let i = 0; i < Math.floor(L / 0.18); i++) {
        const px = -L / 2 + 0.12 + i * 0.18,
          pz = -0.15 + rnd() * 0.3,
          k = rnd();
        if (k < 0.45)
          b.tor(0.035 + rnd() * 0.03, 0.005, k < 0.3 ? gold : silver, [px, 0.65, pz], [PI / 2, 0, 0], null, 14);
        else if (k < 0.75) {
          b.tor(0.012, 0.003, gold, [px, 0.66, pz], [0, 0, 0], null, 10);
          b.sph(0.006, K.mat(0xeaf6ff, 0.05, 0.2), [px, 0.675, pz], null, 6);
        } else {
          b.cyl(0.02, 0.02, 0.008, silver, [px, 0.648, pz], null, 12);
          b.box(0.016, 0.004, 0.09, K.mat(0x3a2a1e, 0.6), [px, 0.646, pz], null, 0);
        }
      }
      b.pop();
      const sw = Math.abs(Math.sin(ry)) > 0.5;
      S(
        x - (sw ? 0.32 : L / 2),
        x + (sw ? 0.32 : L / 2),
        z - (sw ? L / 2 : 0.32),
        z + (sw ? L / 2 : 0.32),
        0,
        1.0,
        true
      );
    };
    // island: two loot display cases (placed at build) with these glass ends
    showcase(-9.85, 0.7, PI / 2, 2.0);
    showcase(-7.15, 0.7, PI / 2, 2.0);
    b.label(
      1.6,
      0.4,
      poster('pg_jewel', [['FINE JEWELLERY', '#fff']], {w: 512, h: 128, bg: '#16203a', glow: 0.5}),
      [-8.5, 3.0, 0.7]
    );
    b.cyl(0.006, 0.006, 0.5, chrome, [-9.2, 3.45, 0.7], null, 4);
    b.cyl(0.006, 0.006, 0.5, chrome, [-7.8, 3.45, 0.7], null, 4);

    /* ---------- shop: power-tool tables (drills, saws, sanders, cases) ---------- */
    const red = K.mat(0xc8202a, 0.5),
      blkM = K.mat(0x1a1a1c, 0.6);
    const drill = (x, y, z, ry, c) => {
      b.push([x, y, z], [0, ry, 0]);
      b.rbox(0.22, 0.08, 0.07, 0.02, K.mat(c, 0.5), [0, 0.2, 0]);
      b.rbox(0.06, 0.16, 0.06, 0.02, blkM, [-0.04, 0.09, 0]);
      b.rbox(0.11, 0.06, 0.09, 0.015, blkM, [-0.04, 0.03, 0]);
      b.cyl(0.02, 0.025, 0.07, chrome, [0.14, 0.2, 0], [0, 0, PI / 2], 10);
      b.pop();
    };
    const saw = (x, y, z, ry, c) => {
      b.push([x, y, z], [0, ry, 0]);
      b.rbox(0.3, 0.14, 0.2, 0.03, K.mat(c, 0.5), [0, 0.1, 0]);
      b.cyl(0.12, 0.12, 0.02, K.mat(0x8a8c90, 0.4, 0.6), [0, 0.12, 0.12], [PI / 2, 0, 0], 20);
      b.rbox(0.08, 0.1, 0.05, 0.02, blkM, [-0.1, 0.22, 0]);
      b.pop();
    };
    const toolTable = (cx, cz) => {
      const L = 4.2;
      b.box(L, 0.05, 1.0, blkM, [cx, 0.86, cz], null, 0.01);
      b.box(L - 0.1, 0.8, 0.9, blkM, [cx, 0.42, cz], null, 0.01);
      b.box(L, 0.06, 1.02, red, [cx, 0.83, cz], null, 0.005);
      // raised centre shelf
      b.box(L - 0.4, 0.04, 0.32, blkM, [cx, 1.22, cz], null, 0.01);
      for (const dx of [-1.8, 0, 1.8]) b.box(0.04, 0.36, 0.04, chrome, [cx + dx, 1.05, cz], null, 0);
      for (let i = 0; i < 10; i++) {
        const tx = cx - L / 2 + 0.25 + i * 0.41,
          side = i % 2 ? 0.3 : -0.3,
          c = [0xe8b820, 0x2a7ad8, 0xd84a1a, 0x2a8a3a][i % 4];
        if (i % 3 === 2) saw(tx, 0.88, cz + side, side > 0 ? 0 : PI, c);
        else drill(tx, 0.88, cz + side, side > 0 ? 0.3 : PI - 0.3, c);
      }
      for (let i = 0; i < 6; i++)
        b.rbox(0.42, 0.12, 0.3, 0.02, K.mat([0x2a7ad8, 0xe8b820, 0xd84a1a, 0x2a2a2e][i % 4], 0.5), [
          cx - L / 2 + 0.5 + i * 0.64,
          1.3,
          cz
        ]);
      S(cx - L / 2, cx + L / 2, cz - 0.5, cz + 0.5, 0, 1.3, true);
    };
    toolTable(0.2, 1.8);
    toolTable(0.2, -1.2);
    // price talkers over the tool tables
    b.label(
      1.1,
      0.28,
      poster('pg_tools', [['POWER TOOLS', '#fff']], {w: 512, h: 128, bg: '#c8202a', glow: 0.4}),
      [0.2, 3.2, 0.3]
    );

    /* ---------- shop: household / garden row along the front right windows ---------- */
    // a mower, a generator, a pressure washer, a stack of amp heads
    b.push([6.2, 0, 3.9]);
    b.rbox(0.55, 0.28, 0.75, 0.06, K.mat(0xc8202a, 0.5), [0, 0.32, 0]);
    for (const [wx, wz] of [
      [-0.28, -0.3],
      [0.28, -0.3],
      [-0.28, 0.3],
      [0.28, 0.3]
    ])
      b.cyl(0.1, 0.1, 0.05, K.rubber(), [wx, 0.1, wz], [0, 0, PI / 2], 14);
    b.tube(
      [
        [-0.22, 0.4, -0.3],
        [-0.22, 1.0, -0.8],
        [0.22, 1.0, -0.8],
        [0.22, 0.4, -0.3]
      ],
      0.015,
      blkM,
      20,
      6
    );
    b.pop();
    b.push([8.2, 0, 3.8]);
    b.rbox(0.7, 0.5, 0.48, 0.03, K.mat(0xe8b820, 0.5), [0, 0.38, 0]);
    b.box(0.74, 0.04, 0.04, blkM, [0, 0.65, 0.22], null, 0);
    b.box(0.74, 0.04, 0.04, blkM, [0, 0.65, -0.22], null, 0);
    b.box(0.74, 0.04, 0.04, blkM, [0, 0.12, 0.22], null, 0);
    b.box(0.74, 0.04, 0.04, blkM, [0, 0.12, -0.22], null, 0);
    b.pop();
    S(5.8, 8.6, 3.0, 4.4, 0, 0.9, true);

    /* ---------- shop: instruments corner + TV wall along the partition ---------- */
    const guitar = (x, y, z, ry, c) => {
      const body = K.mat(c, 0.25, 0.1);
      b.push([x, y, z], [0, ry, 0]);
      b.add(K.cylGeo(0.19, 0.19, 0.07, 22), body, {p: [0, -0.18, 0], r: [PI / 2, 0, 0]});
      b.add(K.cylGeo(0.15, 0.15, 0.07, 22), body, {p: [0, 0.06, 0], r: [PI / 2, 0, 0]});
      b.box(0.06, 0.62, 0.035, K.veneer(0x6a3a1e), [0, 0.48, 0.01], null, 0.005);
      b.box(0.09, 0.16, 0.03, blkM, [0, 0.86, 0.01], null, 0.005);
      b.cyl(0.05, 0.05, 0.01, blkM, [0, -0.08, 0.04], [PI / 2, 0, 0], 16);
      b.box(0.1, 0.03, 0.02, chrome, [0, -0.28, 0.045], null, 0);
      b.pop();
      b.box(0.04, 0.04, 0.1, blkM, [x, y + 0.92, z - 0.05], null, 0);
    };
    const GZ = PZ + 0.1;
    [0xc8202a, 0x1a1a1c, 0xe8d8b0, 0x2a5ab8, 0xd88a2a, 0x2a2a2a, 0x8a1a3a].forEach((c, i) =>
      guitar(-15.2 + i * 0.62, 1.55, GZ + 0.05, 0, c)
    );
    // amp stacks + a drum kit on a rug
    for (const [ax, as] of [
      [-15.2, 1],
      [-14.4, 0.8],
      [-12.0, 0.9]
    ]) {
      b.rbox(0.66 * as, 0.62 * as, 0.32, 0.02, blkM, [ax, 0.31 * as, GZ + 0.25]);
      b.box(0.58 * as, 0.5 * as, 0.005, K.mat(0x2a2a2a, 0.95), [ax, 0.3 * as, GZ + 0.412], null, 0);
      b.box(0.2 * as, 0.04, 0.005, gold, [ax, 0.58 * as, GZ + 0.414], null, 0);
    }
    S(-15.6, -11.6, GZ, GZ + 0.45, 0, 0.65, true);
    b.box(2.0, 0.012, 1.6, K.mat(0x5a1a1a, 0.95), [-13.6, 0.05, -3.6], null, 0);
    const shell = K.mat(0xd8d8dc, 0.2, 0.4);
    b.cyl(0.28, 0.28, 0.4, shell, [-13.6, 0.3, -3.2], [PI / 2, 0, 0], 20);
    for (const [dx, dz, r, h] of [
      [-0.45, -3.9, 0.17, 0.5],
      [0.35, -3.9, 0.15, 0.55],
      [0.55, -3.3, 0.2, 0.42],
      [-0.6, -3.3, 0.18, 0.45]
    ]) {
      b.cyl(r, r, 0.22, shell, [-13.6 + dx, h, dz], null, 18);
      b.cyl(r, r, 0.005, K.mat(0xf2f2ee, 0.6), [-13.6 + dx, h + 0.112, dz], null, 18);
      b.cyl(0.012, 0.012, h - 0.1, chrome, [-13.6 + dx, (h - 0.1) / 2, dz], null, 6);
    }
    for (const [dx, dz] of [
      [-0.85, -4.1],
      [0.85, -4.1]
    ]) {
      b.cyl(0.012, 0.012, 1.0, chrome, [-13.6 + dx, 0.5, dz], null, 6);
      b.cyl(0.2, 0.2, 0.01, gold, [-13.6 + dx, 1.0, dz], null, 18);
    }
    S(-14.5, -12.7, -4.3, -2.9, 0, 1.0, true);
    // TV wall: two shelf runs of flat screens
    const scr = K.paint(
      'pg_screens',
      512,
      128,
      (c, W, H) => {
        const cols = ['#e8e8e8', '#e8d820', '#20d8d8', '#20c820', '#d820d8', '#d82020', '#2020d8'];
        for (let s = 0; s < 4; s++)
          cols.forEach((cl, i) => {
            c.fillStyle = cl;
            c.fillRect(s * 128 + (i * 128) / 7, 0, 128 / 7 + 1, H * 0.7);
          });
        for (let s = 0; s < 4; s++) {
          const g = c.createLinearGradient(0, H * 0.7, 0, H);
          g.addColorStop(0, '#1a2a6a');
          g.addColorStop(1, '#0a0a20');
          c.fillStyle = g;
          c.fillRect(s * 128, H * 0.7, 128, H * 0.3);
          c.fillStyle = '#000';
          c.fillRect(s * 128, 0, 3, H);
        }
      },
      {glow: 0.7, r: 0.2}
    );
    const TX0 = -9.0,
      TX1 = -1.2;
    for (const sy of [0.85, 1.75]) {
      b.box(TX1 - TX0, 0.04, 0.42, blkM, [(TX0 + TX1) / 2, sy, GZ + 0.22], null, 0.01);
    }
    for (const sx of [TX0, (TX0 + TX1) / 2, TX1]) b.box(0.04, 2.6, 0.42, blkM, [sx, 1.3, GZ + 0.22], null, 0);
    b.box(TX1 - TX0, 0.04, 0.42, blkM, [(TX0 + TX1) / 2, 0.06, GZ + 0.22], null, 0);
    for (let i = 0; i < 6; i++) {
      const tx = TX0 + 0.68 + i * 1.28,
        s = 0.9 + (i % 3) * 0.12;
      for (const [sy, sc] of [
        [0.87, s],
        [1.77, s * 0.85]
      ]) {
        b.box(1.0 * sc, 0.6 * sc, 0.04, blkM, [tx, sy + 0.04 + 0.3 * sc + 0.06, GZ + 0.2], null, 0.005);
        b.label(0.94 * sc, 0.54 * sc, scr, [tx, sy + 0.04 + 0.3 * sc + 0.06, GZ + 0.222]);
        b.box(0.2, 0.06, 0.14, blkM, [tx, sy + 0.05, GZ + 0.2], null, 0);
      }
    }
    // games consoles + boxed controllers on the bottom deck
    for (let i = 0; i < 9; i++)
      b.rbox(0.36, 0.08 + (i % 3) * 0.03, 0.26, 0.01, K.mat(i % 2 ? 0x1a1a1c : 0xe8e8e8, 0.4), [
        TX0 + 0.5 + i * 0.85,
        0.15,
        GZ + 0.22
      ]);
    S(TX0, TX1, GZ, GZ + 0.45, 0, 2.6, true);

    /* ---------- the BUYING COUNTER: high counter, security screen, BUY / LOANS / PICK-UP windows ---------- */
    const BCX0 = 1.2,
      BCX1 = X1 - 0.15,
      BCZ = -4.3,
      BCH = 1.08,
      lam = K.veneer(0x6a4a30, {tile: 0.6}),
      alu = K.mat(0xa8acb0, 0.35, 0.8);
    b.box(BCX1 - BCX0, BCH - 0.06, 0.6, nav, [(BCX0 + BCX1) / 2, (BCH - 0.06) / 2, BCZ], null, 0.01);
    b.box(BCX1 - BCX0, 0.06, 0.74, lam, [(BCX0 + BCX1) / 2, BCH - 0.03, BCZ + 0.04], null, 0.01);
    b.box(BCX1 - BCX0, 0.03, 0.02, K.mat(0xf5c518, 0.5), [(BCX0 + BCX1) / 2, 0.8, BCZ + 0.305], null, 0);
    b.box(0.6, BCH, 0.74, nav, [BCX0 - 0.3 + 0.3, BCH / 2, BCZ + 0.04], null, 0.01);
    // staff-side work shelf
    b.box(BCX1 - BCX0, 0.03, 0.4, lam, [(BCX0 + BCX1) / 2, 0.85, BCZ - 0.5], null, 0);
    // the screen: glass panes between aluminium mullions, a header with the window signs
    const SCH = 2.55,
      paneN = 6,
      pw = (BCX1 - BCX0) / paneN;
    b.plane(BCX1 - BCX0, SCH - BCH, K.glass(0xd8eef4, 0.14), [(BCX0 + BCX1) / 2, (SCH + BCH) / 2, BCZ + 0.05]);
    for (let i = 0; i <= paneN; i++)
      b.box(0.05, SCH - BCH, 0.06, alu, [BCX0 + i * pw, (SCH + BCH) / 2, BCZ + 0.05], null, 0.005);
    b.box(BCX1 - BCX0, 0.05, 0.08, alu, [(BCX0 + BCX1) / 2, SCH, BCZ + 0.05], null, 0.005);
    b.box(BCX1 - BCX0, CEIL - SCH, 0.12, nav, [(BCX0 + BCX1) / 2, (CEIL + SCH) / 2, BCZ + 0.05], null, 0);
    // transaction slots (stainless trays) and speak-through grilles at each window
    for (let i = 0; i < paneN; i++) {
      const cx = BCX0 + (i + 0.5) * pw;
      b.box(0.5, 0.04, 0.36, K.steelBrushed(), [cx, BCH + 0.02, BCZ + 0.12], null, 0.005);
      b.cyl(0.07, 0.07, 0.012, alu, [cx, 1.62, BCZ + 0.06], [PI / 2, 0, 0], 16);
    }
    [
      ['pg_sbuy', 'BUY', '#2a9a3a'],
      ['pg_sloans', 'LOANS', '#c8202a'],
      ['pg_spick', 'PICK-UP', YEL]
    ].forEach(([k, s, cl], i) =>
      b.label(
        pw * 1.8,
        (CEIL - SCH) * 0.82,
        K.paint(
          k,
          512,
          160,
          (c, W, H) => {
            c.fillStyle = NAVY;
            c.fillRect(0, 0, W, H);
            c.fillStyle = cl;
            c.fillRect(0, H - 14, W, 14);
            P.text(c, s, W / 2, H / 2 - 6, {
              size: 96,
              col: cl === YEL ? YEL : '#fff',
              font: IMPACT,
              stroke: '#000',
              lw: 4
            });
          },
          {glow: 0.55, r: 0.4}
        ),
        [BCX0 + (i * 2 + 1) * pw, (CEIL + SCH) / 2, BCZ + 0.115]
      )
    );
    // on the counter: gold scale, card reader, ID scanner, test-acid kit, a loupe
    b.push([BCX0 + 0.5 * pw, BCH, BCZ - 0.15]);
    b.rbox(0.22, 0.05, 0.26, 0.01, K.mat(0x2a2a2e, 0.4), [0, 0.025, 0]);
    b.cyl(0.08, 0.08, 0.008, chrome, [0, 0.055, -0.02], null, 20);
    b.box(
      0.12,
      0.03,
      0.005,
      K.mat(0x3aff6a, 0.4, 0, {emissive: 0x3aff6a, emissiveIntensity: 0.6}),
      [0, 0.035, 0.131],
      null,
      0
    );
    b.pop();
    for (let i = 1; i < paneN; i += 2)
      b.rbox(0.08, 0.04, 0.16, 0.01, blkM, [BCX0 + (i + 0.5) * pw + 0.35, BCH + 0.02, BCZ - 0.1], [0.3, 0, 0]);
    for (let i = 0; i < 4; i++)
      b.cyl(
        0.012,
        0.012,
        0.07,
        K.mat([0xc82a2a, 0x2a2a8a, 0xe8b820, 0xf2f2f2][i], 0.4),
        [BCX0 + 2.5 * pw - 0.2 + i * 0.03, BCH + 0.035, BCZ - 0.25],
        null,
        8
      );
    S(BCX0, BCX1, BCZ - 0.33, BCZ + 0.41, 0, SCH);
    // staff stools
    for (const sx of [BCX0 + 1.5 * pw, BCX0 + 3.5 * pw, BCX0 + 5.5 * pw]) {
      b.cyl(0.18, 0.18, 0.06, blkM, [sx, 0.75, BCZ - 0.95], null, 16);
      b.cyl(0.025, 0.025, 0.72, chrome, [sx, 0.38, BCZ - 0.95], null, 8);
      b.cyl(0.2, 0.22, 0.03, chrome, [sx, 0.02, BCZ - 0.95], null, 16);
    }
    // long guns racked on the wall behind the counter (display), a TAKE A TICKET stand, queue posts
    const gunMat = K.mat(0x1d1e1f, 0.35, 0.85),
      stock = K.veneer(0x6a3a20);
    for (let i = 0; i < 7; i++) {
      const gx = BCX0 + 0.3 + i * 0.36;
      b.box(0.05, 0.95, 0.05, gunMat, [gx, 1.95, GZ + 0.07], null, 0.005);
      b.box(0.07, 0.42, 0.06, stock, [gx, 1.28, GZ + 0.07], [0, 0, 0.06], 0.01);
    }
    b.box(2.8, 0.06, 0.12, stock, [BCX0 + 1.38, 1.15, GZ + 0.07], null, 0.005);
    b.box(2.8, 0.06, 0.12, stock, [BCX0 + 1.38, 2.38, GZ + 0.07], null, 0.005);
    // v090: no queue posts / rope guides or floating PLEASE WAIT TO BE SERVED sign in front of the counter

    /* ---------- pawn store: steel shelving, coloured bins, tagged bags and boxes ---------- */
    const upr = K.mat(0x9a9ea4, 0.4, 0.7),
      binC = [0x1f5ac8, 0x1f5ac8, 0xd02a2a, 0x2a9a3a, 0xe8c020],
      bag = K.mat(0xeef2f4, 0.25, 0, {transparent: true, opacity: 0.75}),
      tag = K.mat(0xf2f0e6, 0.8),
      cardS = K.surf('cardboard', 0xb08a58);
    const shelf = (cx, cz, len, alongX, two) => {
      const D = two ? 1.0 : 0.5,
        LV = [0.12, 0.62, 1.12, 1.62, 2.12],
        nb = Math.max(1, Math.round(len / 1.8)),
        bl = len / nb;
      b.push([cx, 0, cz], [0, alongX ? 0 : PI / 2, 0]);
      for (let i = 0; i <= nb; i++)
        for (const dz of [-D / 2 + 0.02, D / 2 - 0.02])
          b.box(0.05, 2.4, 0.05, upr, [-len / 2 + i * bl, 1.2, dz], null, 0);
      for (const y of LV) b.box(len, 0.03, D, upr, [0, y, 0], null, 0);
      if (two) b.box(len, 2.3, 0.01, K.mat(0x8a8e94, 0.5, 0.5), [0, 1.2, 0], null, 0);
      for (let i = 0; i < nb; i++)
        for (const y of LV)
          for (const side of two ? [-1, 1] : [1]) {
            const zc = two ? side * 0.25 : 0;
            let u = -len / 2 + i * bl + 0.06;
            while (u < -len / 2 + (i + 1) * bl - 0.3) {
              const k = rnd();
              let w;
              if (k < 0.55) {
                w = 0.38;
                const h = 0.22 + rnd() * 0.08,
                  c = binC[Math.floor(rnd() * binC.length)];
                b.box(w - 0.02, h, 0.42, K.mat(c, 0.55), [u + w / 2, y + 0.015 + h / 2, zc], null, 0);
                b.box(0.12, 0.06, 0.005, tag, [u + w / 2, y + 0.015 + h * 0.6, zc + side * 0.212], null, 0);
                if (rnd() < 0.5) b.sph(0.1, bag, [u + w / 2, y + h + 0.05, zc], [1.4, 0.5, 1.2], 8);
              } else if (k < 0.8) {
                w = 0.3 + rnd() * 0.2;
                const h = 0.18 + rnd() * 0.24;
                b.box(w - 0.03, h, 0.38, cardS, [u + w / 2, y + 0.015 + h / 2, zc], [0, rnd() * 0.1 - 0.05, 0], 0);
                b.box(0.1, 0.07, 0.005, tag, [u + w / 2, y + 0.015 + h * 0.5, zc + side * 0.192], null, 0);
              } else if (k < 0.93) {
                w = 0.32;
                b.sph(0.14, bag, [u + w / 2, y + 0.11, zc], [1.1, 0.8, 1.2], 8);
                b.box(0.05, 0.08, 0.005, tag, [u + w / 2 + 0.06, y + 0.1, zc + side * 0.16], [0, 0, 0.3], 0);
              } else w = 0.2 + rnd() * 0.2;
              u += w;
            }
          }
      b.pop();
      const hx = alongX ? len / 2 : D / 2,
        hz = alongX ? D / 2 : len / 2;
      S(cx - hx, cx + hx, cz - hz, cz + hz, 0, 2.4);
    };
    shelf(PX + 0.38, -10.4, 4.0, false, false); // against the workshop wall
    shelf(0.4, -9.5, 4.2, false, true);
    shelf(3.4, -9.5, 4.2, false, true);
    shelf(7.0, -10.0, 3.2, false, true);
    shelf(X1 - 0.4, -12.0, 1.4, false, false);
    shelf(X1 - 0.4, -8.0, 2.6, false, false);
    shelf(0.8, Z0 + 0.4, 8.0, true, false); // along the back wall
    // end-cap signs
    const hold = poster('pg_hold', [['PAWN HOLD', '#fff'], 'DO NOT SELL'], {w: 256, h: 128, bg: '#c8202a'}),
      buyb = poster('pg_buyback', [['BUYBACKS', '#fff'], 'TAG + LOG'], {w: 256, h: 128, bg: '#16203a'});
    b.label(0.7, 0.35, hold, [0.4, 2.0, -7.39]);
    b.label(0.7, 0.35, buyb, [3.4, 2.0, -7.39]);
    b.label(0.7, 0.35, hold, [7.0, 2.0, -8.39]);
    // intake table with a label printer and a stack of tags
    b.box(1.8, 0.04, 0.7, lam, [7.6, 0.9, PZ - 0.55], null, 0.01);
    for (const [lx, lz] of [
      [-0.85, -0.3],
      [0.85, -0.3],
      [-0.85, 0.3],
      [0.85, 0.3]
    ])
      b.box(0.04, 0.88, 0.04, upr, [7.6 + lx, 0.44, PZ - 0.55 + lz], null, 0);
    b.rbox(0.2, 0.14, 0.24, 0.02, K.mat(0xe8e8e4, 0.4), [7.2, 0.99, PZ - 0.55]);
    b.box(0.3, 0.06, 0.2, tag, [7.9, 0.95, PZ - 0.6], null, 0);
    b.rbox(0.42, 0.3, 0.06, 0.01, blkM, [8.1, 1.1, PZ - 0.35]);
    S(6.7, 8.5, PZ - 0.9, PZ - 0.2, 0, 0.95, true);

    /* ---------- workshop: caged gun vault, bench, bulk materials ---------- */
    const CGX = -11.2,
      CGZ = -9.6,
      mesh = K.paint(
        'pg_mesh',
        128,
        128,
        (c, W, H) => {
          c.clearRect(0, 0, W, H);
          c.strokeStyle = 'rgba(170,175,180,.95)';
          c.lineWidth = 2;
          for (let d = -H; d < W + H; d += 16) {
            c.beginPath();
            c.moveTo(d, 0);
            c.lineTo(d + H, H);
            c.stroke();
            c.beginPath();
            c.moveTo(d, H);
            c.lineTo(d + H, 0);
            c.stroke();
          }
        },
        {alpha: true, r: 0.4, m: 0.6}
      );
    mesh.side = T.DoubleSide;
    mesh.map.wrapS = mesh.map.wrapT = T.RepeatWrapping;
    // cage front (z = CGZ) from the left wall to the gate, the gate standing open, the side (x = CGX)
    const cageH = 2.6;
    b.plane(CGX - 1.2 - (X0 + 0.15), cageH, mesh, [(X0 + 0.15 + CGX - 1.2) / 2, cageH / 2, CGZ]);
    b.plane(CGZ - (Z0 + 0.15), cageH, mesh, [CGX, cageH / 2, (CGZ + Z0 + 0.15) / 2], [0, PI / 2, 0]);
    for (const px of [X0 + 0.2, -13.6, CGX - 1.2, CGX]) b.box(0.05, cageH, 0.05, upr, [px, cageH / 2, CGZ], null, 0);
    for (const pz of [-11.4, Z0 + 0.2]) b.box(0.05, cageH, 0.05, upr, [CGX, cageH / 2, pz], null, 0);
    b.box(CGX - X0 - 0.15, 0.05, 0.05, upr, [(X0 + 0.15 + CGX) / 2, cageH, CGZ], null, 0);
    b.box(0.05, 0.05, CGZ - Z0 - 0.15, upr, [CGX, cageH, (CGZ + Z0 + 0.15) / 2], null, 0);
    b.push([CGX - 1.2, 0, CGZ], [0, -1.2, 0]);
    b.plane(1.15, 2.2, mesh, [0.58, 1.15, 0]);
    b.box(1.15, 0.04, 0.04, upr, [0.58, 2.25, 0], null, 0);
    b.box(1.15, 0.04, 0.04, upr, [0.58, 0.06, 0], null, 0);
    b.box(0.04, 2.2, 0.04, upr, [1.15, 1.15, 0], null, 0);
    b.pop();
    S(X0 + 0.15, CGX - 1.2, CGZ - 0.04, CGZ + 0.04, 0, cageH, true);
    S(CGX - 0.04, CGX + 0.04, Z0 + 0.15, CGZ, 0, cageH, true);
    b.label(0.7, 0.36, poster('pg_vault', [['FIREARMS', '#fff'], 'STAFF ONLY'], {w: 256, h: 128, bg: '#c8202a'}), [
      -13.6,
      2.0,
      CGZ + 0.03
    ]);
    // bulk buys: pallet of car batteries, copper wire spools, a scrap bin
    const PBX = -7.6,
      PBZ = -11.6;
    b.box(1.2, 0.14, 1.0, pal, [PBX, 0.07, PBZ], null, 0.005);
    for (let i = 0; i < 3; i++)
      for (let k = 0; k < 3; k++) {
        b.rbox(0.33, 0.22, 0.26, 0.01, blkM, [PBX - 0.38 + i * 0.38, 0.25, PBZ - 0.32 + k * 0.32]);
        b.cyl(0.02, 0.02, 0.03, red, [PBX - 0.45 + i * 0.38, 0.38, PBZ - 0.32 + k * 0.32], null, 8);
      }
    S(PBX - 0.6, PBX + 0.6, PBZ - 0.5, PBZ + 0.5, 0, 0.4, true);
    const copper = K.mat(0xc87a3a, 0.3, 0.9);
    // v089: the spools moved beside the battery pallet (they sat inside the workshop's back door)
    for (const [sx, sz] of [
      [-9.2, -12.2],
      [-9.2, -11.4],
      [-9.8, -11.8]
    ]) {
      b.cyl(0.3, 0.3, 0.06, pal, [sx, 0.03, sz], null, 18);
      b.cyl(0.22, 0.22, 0.34, copper, [sx, 0.23, sz], null, 18);
      b.cyl(0.3, 0.3, 0.06, pal, [sx, 0.43, sz], null, 18);
    }
    S(-10.1, -8.9, -12.5, -11.1, 0, 0.46, true);
    b.box(1.0, 0.7, 0.7, K.mat(0x4a6a8a, 0.5, 0.4), [-8.0, 0.35, -7.0], null, 0.02);
    for (let i = 0; i < 6; i++)
      b.box(
        0.5 + rnd() * 0.3,
        0.04,
        0.06,
        K.mat(0x8a8c90, 0.4, 0.7),
        [-8.0 + rnd() * 0.4 - 0.2, 0.72 + i * 0.03, -7 + rnd() * 0.4 - 0.2],
        [rnd(), rnd() * 3, 0],
        0
      );
    S(-8.5, -7.5, -7.35, -6.65, 0, 0.75, true);
    return (CACHE = G.done());
  }

  /* ===================== the builder ===================== */
  function bPawnographic(x, z, t) {
    const B = mk(x, z, 40, 36, H, 0xc89a8a, 0x8a6a48, 0x2a2a2c);
    B.dx = 0;
    const PT = {th: 0.16, c: 0xe8e4dc};
    WL(
      B,
      1,
      Z1,
      X0,
      X1,
      FRONT.map(o => Object.assign({}, o)),
      H
    );
    WL(
      B,
      1,
      Z0,
      X0,
      X1,
      BACK.map(o => Object.assign({}, o)),
      H
    );
    WL(B, 0, X0, Z0, Z1, [], H);
    WL(
      B,
      0,
      X1,
      Z0,
      Z1,
      RIGHT.map(o => Object.assign({}, o)),
      H
    );
    WL(
      B,
      1,
      PZ,
      X0,
      X1,
      PART.map(o => Object.assign({}, o)),
      H,
      PT
    );
    WL(
      B,
      0,
      PX,
      Z0,
      PZ,
      PARTX.map(o => Object.assign({}, o)),
      H,
      PT
    );
    LK.attach(B, build());
    for (const [tx, tz, ts] of [
      [-18.4, 10.5, 1.0],
      [-18.2, 1.5, 0.85],
      [-18.5, -6.5, 1.1],
      [-18.2, -14.5, 0.9]
    ])
      try {
        bldTree(B, tx, tz, ts);
      } catch (e) {}
    const SP = LK.spawner(B, 'pawn');
    // shop floor: the jewellery island's two cases, the till, a gun cabinet behind the counter, tool chests, the bargain table
    SP(-8.5, 2.0, 'display_case', 'pawn', 0);
    SP(-8.5, -0.62, 'display_case', 'pawn', PI);
    SP(7.68, -4.45, 'cash_register', 'pawn', 0, 1.08);
    SP(7.4, PZ + 0.32, 'gun_cabinet', 'pawn_guns', 0);
    SP(2.75, 1.8, 'tool_chest', 'pawn_tools', -PI / 2);
    SP(2.75, -1.2, 'tool_chest', 'pawn_tools', -PI / 2);
    SP(2.4, 4.1, 'yard_sale_table', 'pawn_back', PI);
    // pawn store: boxes and an old trunk in the aisles, a weapon crate waiting to be logged
    SP(-2.0, -11.8, 'cardboard_box_large', 'pawn_back', 0.1);
    SP(2.0, -11.8, 'cardboard_box_large', 'pawn_back', -0.2);
    SP(8.3, -11.8, 'cardboard_box_medium', 'pawn_back', 0.3);
    SP(-1.9, -7.3, 'trunk_leather', 'pawn_back', PI / 2);
    SP(4.2, -10.6, 'weapon_crate', 'pawn_guns', PI / 2); // v089: off the back door
    // workshop: the caged gun vault, the bench and chest, bulk materials
    SP(-15.2, Z0 + 0.4, 'gun_cabinet', 'pawn_guns', 0);
    SP(-14.0, Z0 + 0.4, 'gun_cabinet', 'pawn_guns', 0);
    SP(-12.6, -12.3, 'weapon_crate_long', 'pawn_guns', 0);
    SP(-14.6, -10.6, 'ammo_crate', 'pawn_guns', 0);
    SP(X0 + 0.5, -7.8, 'tool_bench', 'pawn_tools', PI / 2);
    SP(-13.5, PZ - 0.42, 'tool_chest', 'pawn_tools', PI);
    SP(-6.5, -9.5, 'jerry_can', 'pawn_tools', 0.4);
    SP(-9.5, -12.2, 'cardboard_box_large', 'pawn_tools', 0);
    // service yard
    SP(3.0, -15.8, 'dumpster_blue', 'storage', 0);
    return LK.finish(B, t, {
      at: [(X0 + X1) / 2, (Z0 + Z1) / 2],
      w: X1 - X0,
      d: Z1 - Z0,
      loot: ['pawn', [-6.4, -2.2, -3.4, -1.6], 1],
      zombies: [
        [-5.5, 1],
        [2.8, 0.3],
        [-12, 2],
        [2.0, -8.5],
        [-10, -10],
        [5, -3.2],
        [14, -4],
        [-6, 11]
      ]
    });
  }

  LK.register({
    id: 'golden_fences_pawn',
    name: 'Pawnographic',
    build: bPawnographic,
    note: 'full-block pawn shop: big shop floor, buying counter, pawn store, gun vault workshop, parking lot',
    globals: {bPawnographic, PAWNOGRAPHIC: {build}}
  });
  console.log('[pawnshop] Pawnographic ready');
})();
