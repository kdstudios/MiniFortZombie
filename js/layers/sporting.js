/* ==========================================================================================================
   MINI FORT ZOMBIE - DEAD WEIGHT SPORTING GOODS (v072): a full-block sporting goods store (40 x 36 m plot, front = +Z), our own design.
   New BIG-lot type (the old 'Sporting Goods Shop' was a small legacy lot that the v2 town generator never placed).
   Exterior: a 36 x 18 m grey stucco store with an orange trim band under a blue standing-seam roof band, a raised roof sign box,
   an orange barrel awning over glass double doors, framed windows, a freestanding sign wall, five-globe lamp posts; behind, a concrete
   tilt-up wall with the logo, a loading door (shutter half up) with the store van backed in, a pallet, a back door on steps with a
   wall lamp, an angled-stall concrete lot and a dumpster.
   Interior: blue carpet, grey plaster walls with a dark wood rail, fluorescent strips, concrete columns on wooden bases; the cash wrap;
   apparel (round racks and T-racks of hoodies, mannequins - a few knocked over); ball gondolas and wire ball bins; a shoe wall; the
   DEAD WEIGHT gym corner (dumbbell rack, bench press, plate tree, kettlebells, treadmill); outdoors (kayak rack, tents, rod racks,
   tackle boxes, coolers); a hunting counter (display case, gun racks, gun cabinet); a stock room with racking, boxes and crates; an
   office with a restroom.
   Structure from core WL (doors / windows work); detail is our own geometry and painted artwork, outside the static merge.
   ========================================================================================================== */
(function () {
  'use strict';
  const K = window.MFZK;
  if (!K || typeof WL !== 'function' || typeof NEWCAT === 'undefined') {
    console.warn('[sporting] core / prop kit missing');
    return;
  }
  const BDX = -10.8; // v089: the stock-room back door (was -10, against the inflatables rack)
  const T = THREE,
    P = K.P,
    PI = Math.PI;
  const X0 = -18,
    X1 = 18,
    Z0 = -6,
    Z1 = 12,
    H = 5.0,
    CEIL = 4.0;
  const RED = '#c41a1a',
    ORG = '#d8661a',
    BLU = '#1a3a8a',
    YEL = '#ffd23a';

  /* ===================== artwork ===================== */
  function dumbbell(c, x, y, s, col) {
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    c.fillStyle = col;
    c.fillRect(-40, -4, 80, 8);
    for (const sx of [-1, 1]) {
      c.fillRect(sx * 40 - (sx > 0 ? 0 : 16), -22, 16, 44);
      c.fillRect(sx * 58 - (sx > 0 ? 0 : 10), -15, 10, 30);
    }
    c.restore();
  }
  const logoTex = (key, w, h, o) =>
    K.paint(
      key,
      w,
      h,
      (c, W, H, r) => {
        c.fillStyle = '#d8d8d4';
        c.fillRect(0, 0, W, H);
        c.fillStyle = '#b81a1a';
        c.fillRect(H * 0.08, H * 0.1, W - H * 0.16, H * 0.8);
        c.strokeStyle = '#7a0a0a';
        c.lineWidth = 4;
        c.strokeRect(H * 0.08, H * 0.1, W - H * 0.16, H * 0.8);
        c.save();
        c.font = `bold ${H * 0.42}px 'MFZ Head'`;
        c.textBaseline = 'middle';
        c.textAlign = 'left';
        const t = 'dead weight',
          tw = c.measureText(t).width,
          x0 = W / 2 - tw / 2 + H * 0.36;
        c.lineJoin = 'round';
        c.lineWidth = H * 0.06;
        c.strokeStyle = '#5a0a0a';
        c.strokeText(t, x0, H * 0.42);
        c.fillStyle = '#f4f4f0';
        c.fillText(t, x0, H * 0.42);
        c.font = `bold ${H * 0.17}px 'MFZ Head'`;
        c.textAlign = 'right';
        c.fillText('sporting goods', x0 + tw, H * 0.74);
        c.restore();
        dumbbell(c, x0 - H * 0.5, H * 0.42, H * 0.0045, '#f4f4f0');
        P.grime(c, W, H, r, 0.3);
      },
      Object.assign({r: 0.45}, o || {})
    );
  const basket = () =>
    K.paint(
      'dw_bball',
      256,
      128,
      (c, W, H) => {
        c.fillStyle = '#e8701a';
        c.fillRect(0, 0, W, H);
        c.strokeStyle = '#2a1a10';
        c.lineWidth = 4;
        c.beginPath();
        c.moveTo(0, H / 2);
        c.lineTo(W, H / 2);
        c.moveTo(W / 4, 0);
        c.lineTo(W / 4, H);
        c.moveTo(W * 0.75, 0);
        c.lineTo(W * 0.75, H);
        c.stroke();
        c.beginPath();
        c.arc(W / 2, H / 2, H * 0.45, 0, PI * 2);
        c.stroke();
      },
      {r: 0.6}
    );
  const soccer = () =>
    K.paint(
      'dw_soc',
      256,
      128,
      (c, W, H) => {
        c.fillStyle = '#f4f4f0';
        c.fillRect(0, 0, W, H);
        c.fillStyle = '#141414';
        for (let j = 0; j < 3; j++)
          for (let i = 0; i < 6; i++) {
            const x = (i * W) / 6 + ((j % 2) * W) / 12,
              y = (j * H) / 3 + H / 6;
            c.beginPath();
            for (let a = 0; a < 5; a++) c.lineTo(x + Math.cos(a * 1.2566) * 14, y + Math.sin(a * 1.2566) * 14);
            c.fill();
          }
      },
      {r: 0.4}
    );
  const football = () =>
    K.paint(
      'dw_fball',
      256,
      128,
      (c, W, H) => {
        c.fillStyle = '#6a2a14';
        c.fillRect(0, 0, W, H);
        c.fillStyle = '#f4f4f0';
        c.fillRect(W * 0.45, H * 0.3, W * 0.1, H * 0.4);
        for (let i = 0; i < 5; i++) c.fillRect(W * 0.42, H * 0.34 + i * H * 0.07, W * 0.16, H * 0.02);
        c.fillRect(W * 0.1, 0, 8, H);
        c.fillRect(W * 0.85, 0, 8, H);
      },
      {r: 0.6}
    );
  const poster = (key, draw, w, h) => K.paint(key, 256, Math.round((256 * h) / w), draw, {r: 0.5});

  const SURF = {};
  const surf = k =>
    SURF[k] ||
    (SURF[k] = {
      stucco: () =>
        K.tri(
          'dw_stucco',
          (c, W, H, r) => {
            c.fillStyle = '#c4c4c0';
            c.fillRect(0, 0, W, H);
            P.noise(c, W, H, r, 30000, 0.15, '#7a7a76', 1.4);
            P.noise(c, W, H, r, 12000, 0.15, '#e0e0dc', 1.4);
            P.grime(c, W, H, r, 0.3);
          },
          {tile: 1.6, r: 0.95}
        ),
      tilt: () =>
        K.tri(
          'dw_tilt',
          (c, W, H, r) => {
            c.fillStyle = '#a8a6a0';
            c.fillRect(0, 0, W, H);
            P.noise(c, W, H, r, 30000, 0.2, '#6a6864', 1.5);
            for (let i = 0; i < 30; i++) {
              const g = c.createLinearGradient(0, 0, 0, H);
              g.addColorStop(0, 'rgba(40,36,30,.35)');
              g.addColorStop(1, 'rgba(40,36,30,0)');
              c.fillStyle = g;
              c.fillRect(r() * W, 0, 3 + r() * 10, H * (0.3 + r() * 0.7));
            }
            c.fillStyle = 'rgba(30,30,30,.55)';
            c.fillRect(0, 0, 4, H);
            c.fillRect(W / 2, 0, 3, H);
          },
          {tile: 0.25, r: 0.95}
        ),
      seam: () =>
        K.tri(
          'dw_seam',
          (c, W, H, r) => {
            c.fillStyle = '#1e3a7a';
            c.fillRect(0, 0, W, H);
            for (let x = 0; x < W; x += W / 8) {
              const g = c.createLinearGradient(x, 0, x + W / 8, 0);
              g.addColorStop(0, 'rgba(255,255,255,.3)');
              g.addColorStop(0.12, 'rgba(0,0,0,.3)');
              g.addColorStop(0.2, 'rgba(0,0,0,0)');
              c.fillStyle = g;
              c.fillRect(x, 0, W / 8, H);
            }
            P.grime(c, W, H, r, 0.5);
          },
          {tile: 1.2, r: 0.5, m: 0.4}
        ),
      carpet: () =>
        K.tri(
          'dw_carpet',
          (c, W, H, r) => {
            c.fillStyle = '#5e6478';
            c.fillRect(0, 0, W, H);
            P.noise(c, W, H, r, 40000, 0.4, '#353a4a', 1.3);
            P.noise(c, W, H, r, 30000, 0.35, '#8a90a4', 1.3);
          },
          {tile: 0.6, r: 0.95}
        ),
      wall: () =>
        K.tri(
          'dw_wall',
          (c, W, H, r) => {
            c.fillStyle = '#b4b4b0';
            c.fillRect(0, 0, W, H);
            P.noise(c, W, H, r, 30000, 0.12, '#6a6a66', 1.4);
            P.noise(c, W, H, r, 15000, 0.1, '#e0e0dc', 1.4);
          },
          {tile: 1.6, r: 0.95}
        ),
      ceil: () =>
        K.tri(
          'dw_ceil',
          (c, W, H, r) => {
            c.fillStyle = '#bcbcb8';
            c.fillRect(0, 0, W, H);
            P.noise(c, W, H, r, 9000, 0.16, '#7a7a74', 1.3);
            c.fillStyle = '#7a7a74';
            c.fillRect(0, 0, W, 5);
            c.fillRect(0, 0, 5, H);
            c.fillRect(0, H / 2, W, 3);
            c.fillRect(W / 2, 0, 3, H);
          },
          {tile: 0.84, r: 0.9}
        ),
      rail: () => K.veneer(0x4a2e1e, {tile: 0.5}),
      slat: () =>
        K.tri(
          'dw_slat',
          (c, W, H, r) => {
            const n = 10,
              s = W / n;
            for (let i = 0; i < n; i++) {
              const g = c.createLinearGradient(i * s, 0, i * s + s, 0);
              g.addColorStop(0, '#8a7050');
              g.addColorStop(0.4, '#c8a878');
              g.addColorStop(1, '#7a6040');
              c.fillStyle = g;
              c.fillRect(i * s, 0, s, H);
            }
            P.grime(c, W, H, r, 0.3);
          },
          {tile: 0.5, r: 0.6}
        ),
      peg: () =>
        K.tri(
          'dw_peg',
          (c, W, H, r) => {
            c.fillStyle = '#c8ccd0';
            c.fillRect(0, 0, W, H);
            c.fillStyle = '#6a6e72';
            for (let y = 8; y < H; y += 16)
              for (let x = 8; x < W; x += 16) {
                c.beginPath();
                c.arc(x, y, 2.2, 0, PI * 2);
                c.fill();
              }
          },
          {tile: 0.4, r: 0.5, m: 0.5}
        ),
      conc: () => K.surf('concrete', 0xb4b2aa),
      stock: () =>
        K.tri(
          'dw_stockfl',
          (c, W, H, r) => {
            c.fillStyle = '#6a6866';
            c.fillRect(0, 0, W, H);
            P.noise(c, W, H, r, 20000, 0.3, '#3a3836', 1.8);
            P.grime(c, W, H, r, 0.6);
          },
          {tile: 0.3, r: 0.85}
        )
    }[k]());

  /* ===================== the geometry ===================== */
  let CACHE = null;
  function build() {
    if (CACHE) return CACHE;
    const b = K.builder('deadweight'),
      cols = [],
      occ = [];
    const S = (x0, x1, z0, z1, y0, y1, noOcc) => {
      cols.push([Math.min(x0, x1), y0, Math.min(z0, z1), Math.max(x0, x1), y1, Math.max(z0, z1)]);
      if (!noOcc) occ.push([Math.min(x0, x1), Math.max(x0, x1), Math.min(z0, z1), Math.max(z0, z1)]);
    };
    const chrome = K.chrome(),
      blk = K.blackPlastic(),
      rnd = b.rnd,
      conc = surf('conc'),
      dark = K.mat(0x1a1a1c, 0.5),
      stl = K.mat(0x9a9ea2, 0.4, 0.6),
      org = K.mat(0xc8601a, 0.5);
    const Wn = a => a.map(c => ({k: 'w', c})),
      Dr = a => a.map(c => ({k: 'd', c}));
    const FRONT = [...Wn([-15.6, -13.8, -11.0]), {k: 'd', c: -6.65}, {k: 'd', c: -5.35}, ...Wn([9.6, 11.2, 12.8])],
      BACK = [
        {k: 'd', c: BDX, s: -1},
        {k: 'g', c: 12.8},
        {k: 'g', c: 14.4},
        {k: 'd', c: 17, s: -1}
      ];
    const lineWall = (ax, f, a0, a1, n, th, ops, mat, top, base, railM) => {
      top = top || CEIL;
      ops = (ops || []).slice().sort((p, q) => p.c - q.c);
      const pc = (u0, u1, y0, y1, m, dep, off) => {
        if (u1 - u0 < 0.04 || y1 - y0 < 0.02) return;
        const o = f + n * (th / 2 + off),
          u = (u0 + u1) / 2,
          y = (y0 + y1) / 2;
        if (ax) b.box(u1 - u0, y1 - y0, dep, m, [u, y, o], null, 0);
        else b.box(dep, y1 - y0, u1 - u0, m, [o, y, u], null, 0);
      };
      const span = (u0, u1, y0, y1) => {
        pc(u0, u1, y0, y1, mat, 0.012, 0.006);
        if (base && y0 <= 0) pc(u0, u1, 0, 0.14, base, 0.03, 0.015);
        if (railM && y0 <= 3.1 && y1 >= 3.35) pc(u0, u1, 3.1, 3.35, railM, 0.08, 0.04);
      };
      let a = a0;
      for (const p of ops) {
        const hw = p.k === 'w' ? 0.75 : p.k === 'g' ? 0.8 : 0.65;
        span(a, p.c - hw, 0, top);
        if (p.k === 'w') {
          span(p.c - hw, p.c + hw, 0, 0.9);
          span(p.c - hw, p.c + hw, 2.75, top);
        } else span(p.c - hw, p.c + hw, p.k === 'g' ? 2.5 : 2.4, top);
        a = p.c + hw;
      }
      span(a, a1, 0, top);
    };
    /* ---------- ground ---------- */
    b.box(40, 0.06, 2.1, K.surf('concrete', 0xb0aea6), [0, 0.03, 16.95], null, 0);
    for (let x = -19.5; x < 20; x += 1.5) b.box(0.02, 0.062, 2.08, K.mat(0x8a8880, 0.8), [x, 0.031, 16.95], null, 0);
    b.box(40, 0.16, 0.2, conc, [0, 0.08, 15.9], null, 0);
    b.box(40, 0.04, 3.8, K.surf('asphalt', 0x4a4c50), [0, 0.02, 13.95], null, 0);
    b.box(37, 0.06, 1.6, conc, [0, 0.03, 12.95], null, 0);
    for (const s of [-1, 1]) b.box(1.9, 0.03, 18.2, conc, [s * 19.0, 0.015, 3.0], null, 0);
    b.box(40, 0.03, 11.85, conc, [0, 0.015, -11.9], null, 0);
    for (let i = 0; i < 7; i++)
      b.box(0.12, 0.012, 4.4, K.mat(0xf2c418, 0.6), [-16 + i * 3.0, 0.035, -14.4], [0, 0.4, 0], 0);
    for (const [x, z] of [
      [-6, -12],
      [4, -10],
      [10, -14]
    ])
      b.label(
        1.4,
        1.4,
        K.paint(
          'dw_stain',
          128,
          128,
          (c, W, H) => {
            c.clearRect(0, 0, W, H);
            const g = c.createRadialGradient(64, 64, 4, 64, 64, 60);
            g.addColorStop(0, 'rgba(20,16,12,.4)');
            g.addColorStop(1, 'rgba(20,16,12,0)');
            c.fillStyle = g;
            c.fillRect(0, 0, W, H);
          },
          {alpha: true}
        ),
        [x, 0.035, z],
        [-PI / 2, 0, 0]
      );
    /* ---------- exterior skins ---------- */
    const st = surf('stucco'),
      tt = surf('tilt');
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
        } else pc(p.c - hw, p.c + hw, p.k === 'g' ? 2.5 : 2.4, H);
        a = p.c + hw;
      }
      pc(a, a1, 0, H);
    };
    skin(1, Z1, X0, X1, 1, FRONT, st);
    skin(0, X0, Z0, Z1, -1, [], st);
    skin(0, X1, Z0, Z1, 1, [], st);
    skin(1, Z0, X0, X1, -1, BACK, tt);
    for (const c of [-15.6, -13.8, -11.0, 9.6, 11.2, 12.8])
      b.frame(1.62, 1.95, 0.08, K.mat(0x1e2a5a, 0.4, 0.4), [c, 1.825, Z1 + 0.21], 0.04);
    // entrance bay (projecting), orange trim band, blue standing-seam roof band, raised sign box
    // v089: the bay front used to be one full-height block (y 0 to H + 0.4) that walled over the doors; it is a header over a
    // 2.6 m opening on two piers, which is what its collision always was
    b.box(7.2, H + 0.4 - 2.6, 0.6, st, [-6, (H + 0.4 + 2.6) / 2, Z1 + 0.45], null, 0);
    b.box(6.0, 0.04, 0.6, K.mat(0x2a2c30, 0.7), [-6, 2.58, Z1 + 0.45], null, 0); // soffit under the header
    S(-9.6, -2.4, Z1, Z1 + 0.75, 2.6, H + 0.4, true);
    for (const s of [-1, 1]) b.box(0.6, 2.6, 0.6, st, [-6 + s * 3.3, 1.3, Z1 + 0.45], null, 0);
    S(-9.6, -8.7, Z1, Z1 + 0.75, 0, 2.6, true);
    S(-3.3, -2.4, Z1, Z1 + 0.75, 0, 2.6, true);
    const band = (ax, f, a0, a1, n, y, d) => {
      const L = a1 - a0,
        u = (a0 + a1) / 2;
      if (ax) b.box(L, 0.22, d, org, [u, y, f + (n * d) / 2], null, 0.02);
      else b.box(d, 0.22, L, org, [f + (n * d) / 2, y, u], null, 0.02);
    };
    band(1, Z1, X0 - 0.3, X1 + 0.3, 1, 4.2, 0.35);
    band(1, Z1 + 0.75, -9.7, -2.3, 1, 4.25, 0.2);
    band(0, X0, Z0, Z1, -1, 4.2, 0.35);
    band(0, X1, Z0, Z1, 1, 4.2, 0.35);
    band(1, Z0, X0, X1, -1, 4.2, 0.2);
    const seam = surf('seam');
    const roofBand = (ax, f, a0, a1, n) => {
      const L = a1 - a0 + 1.2,
        u = (a0 + a1) / 2;
      if (ax) b.box(L, 0.08, 1.3, seam, [u, H + 0.35, f + n * 0.45], [n * 0.42, 0, 0], 0);
      else b.box(1.3, 0.08, L, seam, [f + n * 0.45, H + 0.35, u], [0, 0, -n * 0.42], 0);
    };
    roofBand(1, Z1, X0, X1, 1);
    roofBand(0, X0, Z0, Z1, -1);
    roofBand(0, X1, Z0, Z1, 1);
    roofBand(1, Z0, X0, X1, -1);
    b.box(7.8, 0.08, 1.3, seam, [-6, H + 0.75, Z1 + 1.1], [0.42, 0, 0], 0);
    b.box(36.4, 0.12, 18.4, K.surf('concrete', 0x5a5a58), [0, H + 0.02, 3], null, 0);
    b.box(36.2, 0.02, 18.2, K.mat(0x34363a, 0.9), [0, H + 0.09, 3], null, 0);
    b.box(7, 2.8, 1.2, st, [-6, H + 1.4, 10.6], null, 0.02);
    b.label(6.4, 2.0, logoTex('dw_logo_roof', 1024, 320, {glow: 0.3}), [-6, H + 1.45, 11.21]);
    for (const [x, z] of [
      [4, 4],
      [-12, 0],
      [10, -2]
    ]) {
      b.rbox(2.0, 1.0, 1.4, 0.03, K.mat(0xb0b4b8, 0.4, 0.7), [x, H + 0.6, z]);
      b.cyl(0.55, 0.55, 0.1, K.mat(0x2a2a2a, 0.5, 0.4), [x, H + 1.15, z], null, 20);
    }
    // orange barrel awning over the doors
    b.add(
      new T.CylinderGeometry(1.1, 1.1, 5.6, 20, 1, true, 0, PI),
      K.tri(
        'dw_awn',
        (c, W, H, r) => {
          c.fillStyle = '#d8661a';
          c.fillRect(0, 0, W, H);
          for (let i = 0; i < 40; i++) {
            c.fillStyle = 'rgba(0,0,0,.1)';
            c.fillRect(r() * W, 0, 2, H);
          }
          P.grime(c, W, H, r, 0.5);
        },
        {tile: 0.5, r: 0.8}
      ),
      {p: [-6, 3.3, Z1 + 0.75], r: [0, 0, PI / 2], s: [1, 1, 0.9]}
    );
    for (const s of [-1, 1])
      b.add(new T.CircleGeometry(1.1, 20, 0, PI), K.mat(0xc8561a, 0.8), {
        p: [-6 + s * 2.8, 3.3, Z1 + 0.75],
        r: [0, (s * PI) / 2, PI / 2],
        s: [1, 0.9, 1]
      });
    b.label(
      0.6,
      0.8,
      poster(
        'dw_p_kids',
        (c, W, H) => {
          c.fillStyle = '#2a8ac8';
          c.fillRect(0, 0, W, H);
          c.fillStyle = '#f4f4f0';
          c.beginPath();
          c.arc(W / 2, H * 0.4, 60, 0, PI * 2);
          c.fill();
          c.fillStyle = '#1a1a1a';
          c.beginPath();
          c.arc(W / 2 - 24, H * 0.38, 14, 0, PI * 2);
          c.arc(W / 2 + 24, H * 0.38, 14, 0, PI * 2);
          c.fill();
          P.text(c, 'LITTLE LEAGUE', W / 2, H * 0.72, {size: 26, col: '#fff'});
          P.text(c, 'SIGN-UPS', W / 2, H * 0.84, {size: 24, col: YEL});
        },
        0.6,
        0.8
      ),
      [-8.15, 1.6, Z1 + 0.19] // v089: on the shop front inside the bay (the bay face it hung on is open now)
    );
    // freestanding sign wall
    b.box(7.0, 1.8, 0.6, st, [10.6, 0.9, 14.0], null, 0.02);
    b.box(7.1, 0.1, 0.7, K.mat(0x8a8a86, 0.6), [10.6, 1.85, 14.0], null, 0.01);
    b.label(6.4, 1.4, logoTex('dw_logo_wall', 1024, 224), [10.6, 0.95, 14.31]);
    b.label(6.4, 1.4, logoTex('dw_logo_wall', 1024, 224), [10.6, 0.95, 13.69], [0, PI, 0]);
    S(7.1, 14.1, 13.7, 14.3, 0, 1.9, true);
    // five-globe lamp posts
    const lampPost = (x, z) => {
      const m = K.mat(0x2a3a38, 0.4, 0.6),
        glo = K.mat(0xf4f4f0, 0.2, 0, {emissive: 0xfff6e0, emissiveIntensity: 0.6});
      b.push([x, 0, z]);
      b.cyl(0.28, 0.32, 0.5, m, [0, 0.25, 0], null, 12);
      b.cyl(0.07, 0.1, 3.4, m, [0, 2.1, 0], null, 10);
      for (let k = 0; k < 4; k++) b.tor(0.08, 0.02, m, [0, 1.2 + k * 0.6, 0], [PI / 2, 0, 0], null, 10);
      b.sph(0.17, glo, [0, 4.3, 0]);
      for (let k = 0; k < 4; k++) {
        const a = (k * PI) / 2 + PI / 4;
        b.tube(
          [
            [0, 3.7, 0],
            [Math.cos(a) * 0.3, 3.75, Math.sin(a) * 0.3],
            [Math.cos(a) * 0.42, 3.9, Math.sin(a) * 0.42]
          ],
          0.025,
          m,
          10,
          5
        );
        b.sph(0.15, glo, [Math.cos(a) * 0.42, 4.04, Math.sin(a) * 0.42]);
      }
      b.pop();
      S(x - 0.32, x + 0.32, z - 0.32, z + 0.32, 0, 4.3, true);
    };
    for (const x of [-16, -9.4, -1.4, 16.4]) lampPost(x, 15.3);
    // back: logo, loading door with half-raised shutter, back door steps + lamp, pallet
    b.label(3.2, 1.2, logoTex('dw_logo_back', 768, 288), [-4, 3.4, Z0 - 0.2], [0, PI, 0]);
    b.box(3.4, 1.4, 0.06, K.mat(0x9a9894, 0.5), [-4, 3.4, Z0 - 0.17], null, 0);
    b.rbox(3.6, 0.5, 0.5, 0.06, K.mat(0x8a8e92, 0.4, 0.6), [13.6, 2.8, Z0 - 0.35]);
    for (let i = 0; i < 4; i++)
      b.box(3.2, 0.1, 0.04, K.surf('rollshutter', 0xb8bcc0, {m: 0.5}), [13.6, 2.52 + i * 0.07, Z0 - 0.2], null, 0);
    for (const s of [-1, 1])
      b.box(0.1, 2.5, 0.14, K.mat(0x5a6062, 0.4, 0.6), [13.6 + s * 1.66, 1.25, Z0 - 0.2], null, 0);
    for (const x of [BDX, 17]) {
      for (let i = 0; i < 3; i++)
        b.box(
          1.6,
          0.17 * (3 - i),
          0.35,
          K.surf('concrete', 0xa8a69e),
          [x, 0.085 * (3 - i), Z0 - 0.32 - i * 0.35],
          null,
          0.01
        );
      b.cyl(0.06, 0.1, 0.12, dark, [x + 0.9, 2.8, Z0 - 0.25], [PI / 2, 0, 0], 10);
      b.box(0.04, 0.04, 0.25, dark, [x + 0.9, 2.9, Z0 - 0.12], null, 0);
    }
    b.push([11.0, 0, -9.6], [0, 0.3, 0]);
    const pw = K.surf('wood', 0xa87a4a);
    for (let i = 0; i < 5; i++) b.box(1.2, 0.02, 0.14, pw, [0, 0.13, -0.45 + i * 0.225], null, 0);
    for (const s of [-0.5, 0, 0.5]) b.box(0.1, 0.1, 1.0, pw, [s, 0.07, 0], null, 0);
    b.pop();
    // v090: the store van is a real model now (placed in bDeadWeight)
    /* ---------- interior: floor, walls, ceiling, columns ---------- */
    const cp = surf('carpet'),
      wl = surf('wall'),
      rl = surf('rail');
    b.box(35.7, 0.02, 17.7, cp, [0, 0.035, 3], null, 0);
    b.box(9.7, 0.02, 4.7, surf('stock'), [13, 0.037, -3.5], null, 0);
    b.box(5.7, 0.02, 3.7, surf('stock'), [-15, 0.037, -4], null, 0);
    lineWall(1, Z1, X0, X1, -1, 0.3, FRONT, wl, CEIL, rl, rl);
    lineWall(0, X0, -2, Z1, 1, 0.3, [], wl, CEIL, rl, rl);
    lineWall(0, X1, -1, Z1, -1, 0.3, [], wl, CEIL, rl, rl);
    lineWall(1, Z0, -12, 8, 1, 0.3, [], wl, CEIL, rl, rl);
    lineWall(1, -1, 8, X1, 1, 0.16, Dr([10]), wl, CEIL, rl, rl);
    lineWall(0, 8, Z0, -1, -1, 0.16, [], wl, CEIL, rl, rl);
    lineWall(1, -2, X0, -12, 1, 0.16, Dr([-14]), wl, CEIL, rl, rl);
    lineWall(0, -12, Z0, -2, 1, 0.16, [], wl, CEIL, rl, rl);
    lineWall(1, -1, 8, X1, -1, 0.16, Dr([10]), wl);
    lineWall(0, 8, Z0, -1, 1, 0.16, [], wl);
    lineWall(
      1,
      Z0,
      8,
      X1,
      1,
      0.3,
      BACK.filter(p => p.c > 8),
      wl
    );
    lineWall(0, X1, Z0, -1, -1, 0.3, [], wl);
    lineWall(1, -2, X0, -12, -1, 0.16, Dr([-14]), wl);
    lineWall(0, -12, Z0, -2, -1, 0.16, [], wl);
    lineWall(1, Z0, X0, -12, 1, 0.3, [], wl);
    lineWall(0, X0, Z0, -2, 1, 0.3, [], wl);
    b.box(35.7, 0.04, 17.7, surf('ceil'), [0, CEIL + 0.02, 3], null, 0);
    const lit = K.mat(0xffffff, 0.4, 0, {emissive: 0xf4f8ff, emissiveIntensity: 0.95}),
      hous = K.mat(0xd8d8d4, 0.5, 0.2);
    for (let x = -15; x < 17; x += 5)
      for (const z of [0, 4, 8]) {
        b.box(2.4, 0.1, 0.32, hous, [x, CEIL - 0.05, z], null, 0.01);
        b.box(2.3, 0.012, 0.22, lit, [x, CEIL - 0.105, z], null, 0);
      }
    for (const [x, z] of [
      [-6, 1.5],
      [4, 1.5],
      [-6, 7],
      [4, 7]
    ]) {
      b.box(0.6, CEIL, 0.6, K.surf('concrete', 0x9a9894), [x, CEIL / 2, z], null, 0.01);
      b.box(0.8, 0.5, 0.8, rl, [x, 0.25, z], null, 0.02);
      b.box(0.8, 0.25, 0.8, rl, [x, CEIL - 0.12, z], null, 0.02);
      S(x - 0.4, x + 0.4, z - 0.4, z + 0.4, 0, CEIL);
    }
    /* ---------- cash wrap ---------- */
    const sl = surf('slat'),
      top = K.veneer(0xb8905a, {tile: 0.8});
    b.box(3.6, 1.0, 0.8, sl, [-1, 0.5, 4.4], null, 0.01);
    b.box(3.7, 0.05, 0.9, top, [-1, 1.025, 4.4], null, 0.01);
    b.box(0.8, 1.0, 2.4, sl, [0.6, 0.5, 3.0], null, 0.01);
    b.box(0.9, 0.05, 2.5, top, [0.6, 1.025, 3.0], null, 0.01);
    S(-2.85, 0.85, 4.0, 4.8, 0, 1.05);
    S(0.2, 1.0, 1.8, 4.0, 0, 1.05);
    b.add(K.sphGeo(0.12, 14, 10), K.mat(0xc8306a, 0.5), {p: [-0.3, 1.17, 4.4]});
    b.add(K.sphGeo(0.06, 10, 8), K.mat(0x2a4ab8, 0.5), {p: [-2.4, 1.11, 4.5]});
    const chair = (x, z, a) => {
      b.push([x, 0, z], [0, a, 0]);
      const fr = K.mat(0x1e1f22, 0.5, 0.2),
        mesh = K.mat(0x2a2c30, 0.7);
      b.rbox(0.5, 0.08, 0.48, 0.03, mesh, [0, 0.48, 0]);
      b.rbox(0.46, 0.62, 0.05, 0.04, mesh, [0, 0.88, -0.24], [0.12, 0, 0]);
      b.cyl(0.03, 0.03, 0.36, K.mat(0x8a8c8e, 0.3, 0.8), [0, 0.27, 0], null, 8);
      for (let k = 0; k < 5; k++) {
        const q = (k * PI * 2) / 5;
        b.box(0.3, 0.03, 0.04, fr, [Math.cos(q) * 0.15, 0.07, Math.sin(q) * 0.15], [0, -q, 0], 0);
        b.sph(0.03, fr, [Math.cos(q) * 0.3, 0.03, Math.sin(q) * 0.3]);
      }
      b.pop();
    };
    chair(-0.6, 3.4, 0.5);
    /* ---------- apparel: round racks + T-racks of hoodies, mannequins ---------- */
    const hoodCol = [0xb81a1a, 0x4a5a5a, 0x6a7a3a, 0x2a3a5a, 0x8a8a86, 0xe8b020];
    const hoodie = (x, y, z, a, ci) => {
      b.push([x, y, z], [0, a, 0]);
      const m = K.mat(hoodCol[((ci % 6) + 6) % 6], 0.9);
      b.tor(0.06, 0.006, chrome, [0, 0.04, 0], [0, PI / 2, 0], PI, 8);
      b.box(0.42, 0.03, 0.02, chrome, [0, -0.02, 0], [0, 0, 0], 0);
      b.rbox(0.44, 0.6, 0.12, 0.05, m, [0, -0.34, 0]);
      b.add(K.sphGeo(0.13, 10, 6, 0, PI / 2), m, {p: [0, -0.06, -0.04], s: [1, 1, 1.1], r: [-0.3, 0, 0]});
      for (const s of [-1, 1]) b.cyl(0.055, 0.05, 0.56, m, [s * 0.25, -0.36, 0], [0, 0, s * 0.06], 8);
      b.box(0.18, 0.14, 0.02, K.mat(0x1a1a1a, 0.8), [0, -0.46, 0.065], null, 0);
      b.pop();
    };
    const roundRack = (x, z) => {
      b.cyl(0.025, 0.025, 1.3, stl, [x, 0.65, z], null, 8);
      for (let k = 0; k < 4; k++) {
        const q = (k * PI) / 2;
        b.box(0.6, 0.03, 0.04, stl, [x + Math.cos(q) * 0.3, 0.03, z + Math.sin(q) * 0.3], [0, -q, 0], 0);
      }
      b.add(K.torGeo(0.55, 0.015, 6, 32), stl, {p: [x, 1.35, z], r: [PI / 2, 0, 0]});
      for (let k = 0; k < 4; k++) b.box(1.1, 0.02, 0.02, stl, [x, 1.35, z], [0, (k * PI) / 4, 0], 0);
      for (let k = 0; k < 8; k++) {
        if (rnd() < 0.2) continue;
        const q = (k * PI) / 4;
        hoodie(x + Math.cos(q) * 0.55, 1.35, z + Math.sin(q) * 0.55, -q + PI / 2, k + Math.round(x));
      }
      S(x - 0.7, x + 0.7, z - 0.7, z + 0.7, 0, 1.4, true);
    };
    roundRack(-15.2, 9.0);
    roundRack(-12.4, 9.4);
    roundRack(-14.0, 6.4);
    const tRack = (x, z, a) => {
      b.push([x, 0, z], [0, a, 0]);
      b.cyl(0.025, 0.025, 1.4, stl, [0, 0.7, 0], null, 8);
      b.box(0.6, 0.03, 0.6, stl, [0, 0.02, 0], null, 0);
      b.box(1.2, 0.025, 0.025, stl, [0, 1.4, 0], null, 0);
      for (const s of [-1, 1]) b.box(0.025, 0.025, 0.8, stl, [s * 0.6, 1.4, 0], null, 0);
      for (let k = 0; k < 5; k++) hoodie(0.6, 1.4, -0.32 + k * 0.16, PI / 2, k + 2);
      for (let k = 0; k < 4; k++) hoodie(-0.6, 1.4, -0.24 + k * 0.16, -PI / 2, k);
      b.pop();
      S(x - 0.8, x + 0.8, z - 0.6, z + 0.6, 0, 1.4, true);
    };
    tRack(-10.0, 7.6, 0);
    tRack(-16.6, 3.6, PI / 2);
    const skin2 = K.mat(0xd8a878, 0.6),
      joint = K.mat(0x8a5a38, 0.6);
    const mannequin = (x, z, a, fallen) => {
      b.push([x, fallen ? 0.2 : 0, z], fallen ? [PI / 2, a, 0] : [0, a, 0]);
      b.cyl(0.15, 0.18, 0.04, K.mat(0x2a2a2a, 0.5), [0, 0.02, 0], null, 14);
      b.cyl(0.012, 0.012, 0.25, chrome, [0.1, 0.15, 0], null, 6);
      for (const s of [-1, 1]) {
        b.cyl(0.06, 0.05, 0.42, skin2, [s * 0.09, 0.3, 0], null, 8);
        b.cyl(0.07, 0.06, 0.42, skin2, [s * 0.09, 0.75, 0], null, 8);
        b.sph(0.055, joint, [s * 0.09, 0.53, 0]);
        b.box(0.1, 0.05, 0.2, skin2, [s * 0.09, 0.04, 0.05], null, 0.01);
      }
      b.rbox(0.3, 0.22, 0.18, 0.06, skin2, [0, 1.05, 0]);
      b.rbox(0.36, 0.44, 0.2, 0.08, skin2, [0, 1.38, 0]);
      b.cyl(0.04, 0.05, 0.1, skin2, [0, 1.65, 0], null, 8);
      b.add(K.sphGeo(0.11, 14, 10), skin2, {p: [0, 1.8, 0], s: [0.9, 1.15, 1]});
      for (const s of [-1, 1]) {
        b.sph(0.05, joint, [s * 0.21, 1.54, 0]);
        b.cyl(0.04, 0.035, 0.3, skin2, [s * 0.23, 1.37, 0], [0, 0, s * 0.08], 8);
        b.sph(0.035, joint, [s * 0.24, 1.21, 0]);
        b.cyl(0.035, 0.03, 0.28, skin2, [s * 0.25, 1.06, 0.02], null, 8);
      }
      b.pop();
      if (!fallen) S(x - 0.2, x + 0.2, z - 0.2, z + 0.2, 0, 1.9, true);
    };
    mannequin(1.8, 5.8, -0.6);
    mannequin(2.4, 5.6, -0.8);
    mannequin(-10.8, 10.6, PI);
    mannequin(-8.4, 4.4, 0, true);
    mannequin(-9.4, 2.6, 1.4, true);
    b.label(
      0.8,
      1.1,
      poster(
        'dw_p_sonar',
        (c, W, H) => {
          c.fillStyle = '#f4f4f0';
          c.fillRect(0, 0, W, H);
          P.text(c, 'SONAR-MATIC', W / 2, 30, {size: 30, col: '#1a1a1a'});
          P.text(c, '9000', W / 2, 66, {size: 40, col: '#1a1a1a'});
          c.fillStyle = '#2a2c30';
          P.rrect(c, 50, 100, 156, 120, 12);
          c.fill();
          c.fillStyle = '#3a8ab8';
          c.fillRect(64, 112, 128, 90);
          c.fillStyle = '#7aff6a';
          for (let i = 0; i < 6; i++) {
            c.beginPath();
            c.arc(80 + i * 20, 150 + Math.sin(i) * 20, 4, 0, PI * 2);
            c.fill();
          }
          P.text(c, 'ONE PING ONLY!', W / 2, H - 30, {size: 22, col: '#1a1a1a'});
        },
        0.8,
        1.1
      ),
      [X0 + 0.18, 2.1, 9.0],
      [0, PI / 2, 0]
    );
    /* ---------- balls: gondolas + wire bins; shoe wall ---------- */
    const bb = basket(),
      sb = soccer(),
      fb = football(),
      peg = surf('peg');
    const ball = (x, y, z, k) => {
      if (k === 0) b.add(K.sphGeo(0.12, 14, 10), bb, {p: [x, y + 0.12, z], r: [rnd(), rnd(), 0]});
      else if (k === 1) b.add(K.sphGeo(0.11, 14, 10), sb, {p: [x, y + 0.11, z], r: [rnd(), rnd(), 0]});
      else b.add(K.sphGeo(0.09, 12, 8), fb, {p: [x, y + 0.09, z], s: [1, 1, 1.7], r: [0, rnd() * 3, PI / 2]});
    };
    const gondola = (x, z, a) => {
      b.push([x, 0, z], [0, a, 0]);
      b.box(2.4, 0.12, 0.9, dark, [0, 0.06, 0], null, 0);
      b.box(2.4, 1.5, 0.04, peg, [0, 0.9, 0], null, 0);
      for (const s of [-1, 1]) b.box(0.04, 1.6, 0.9, stl, [s * 1.2, 0.8, 0], null, 0);
      for (const side of [-1, 1])
        for (let k = 0; k < 3; k++) {
          const y = 0.2 + k * 0.45;
          b.box(2.36, 0.03, 0.4, stl, [0, y, side * 0.22], [side * -0.08, 0, 0], 0);
          for (let q = 0; q < 7; q++) if (rnd() < 0.65) ball(-1.0 + q * 0.33, y + 0.02, side * 0.24, (q + k) % 3);
        }
      b.pop();
      S(x - 1.25, x + 1.25, z - 0.5, z + 0.5, 0, 1.6, true);
    };
    gondola(7.2, 8.6, 0);
    gondola(7.2, 5.4, 0);
    gondola(12.6, 8.6, 0);
    gondola(12.6, 5.4, 0);
    for (let i = 0; i < 6; i++) ball(9.8 + rnd() * 2, 0, 6.6 + rnd() * 1.6, i % 3);
    const bin = (x, z, k) => {
      b.push([x, 0, z]);
      for (const [w, d, px, pz] of [
        [1.0, 0.01, 0, -0.5],
        [1.0, 0.01, 0, 0.5],
        [0.01, 1.0, -0.5, 0],
        [0.01, 1.0, 0.5, 0]
      ])
        for (let q = 0; q < 4; q++) b.box(w, 0.015, d, K.mat(0xc8261c, 0.4, 0.5), [px, 0.15 + q * 0.25, pz], null, 0);
      for (let i = -4; i <= 4; i++) {
        for (const zz of [-0.5, 0.5])
          b.cyl(0.006, 0.006, 0.9, K.mat(0xc8261c, 0.4, 0.5), [i * 0.12, 0.48, zz], null, 4);
        for (const xx of [-0.5, 0.5])
          b.cyl(0.006, 0.006, 0.9, K.mat(0xc8261c, 0.4, 0.5), [xx, 0.48, i * 0.12], null, 4);
      }
      for (let i = 0; i < 14; i++)
        ball((rnd() - 0.5) * 0.7, 0.05 + Math.floor(i / 7) * 0.22 + rnd() * 0.05, (rnd() - 0.5) * 0.7, k);
      b.pop();
      S(x - 0.52, x + 0.52, z - 0.52, z + 0.52, 0, 0.95, true);
    };
    bin(15.6, 9.6, 1);
    bin(15.6, 7.8, 0);
    bin(10.0, 3.0, 2);
    b.box(0.06, 2.0, 5.0, sl, [X1 - 0.2, 1.6, 6.5], null, 0);
    for (let r = 0; r < 5; r++)
      for (let k = 0; k < 10; k++) {
        const y = 0.9 + r * 0.32,
          z = 4.25 + k * 0.45;
        b.box(0.3, 0.02, 0.4, K.mat(0xc8ccd0, 0.3, 0.6), [X1 - 0.36, y, z], [0, 0, -0.2], 0);
        if (rnd() < 0.75) {
          const c2 = [0xf4f4f0, 0xc41a1a, 0x1a1a1a, 0x2a6ad8, 0xe8a020][(r + k) % 5];
          for (const s of [-0.08, 0.08])
            b.rbox(0.26, 0.09, 0.11, 0.04, K.mat(c2, 0.6), [X1 - 0.38, y + 0.06, z + s], [0, 0, -0.2]);
        }
      }
    b.label(
      2.4,
      0.4,
      K.paint(
        'dw_shoes',
        512,
        86,
        (c, W, H) => {
          c.fillStyle = RED;
          c.fillRect(0, 0, W, H);
          P.text(c, 'RUN FOR YOUR LIFE', W / 2, H / 2, {size: 40, col: '#fff'});
        },
        {glow: 0.3}
      ),
      [X1 - 0.22, 3.0, 6.5],
      [0, -PI / 2, 0]
    );
    S(X1 - 0.6, X1 - 0.15, 4.0, 9.0, 0, 2.6, true);
    /* ---------- the DEAD WEIGHT gym corner ---------- */
    const iron = K.mat(0x2a2a2c, 0.45, 0.7),
      pad = K.mat(0x1a1a1c, 0.8),
      chr = chrome;
    b.push([1.5, 0, -5.2]);
    b.box(3.4, 0.06, 0.6, iron, [0, 0.55, 0], [0.25, 0, 0], 0);
    b.box(3.4, 0.06, 0.6, iron, [0, 0.95, -0.1], [0.25, 0, 0], 0);
    for (const x of [-1.6, 0, 1.6]) b.box(0.08, 1.0, 0.7, iron, [x, 0.5, 0], null, 0);
    for (let t = 0; t < 2; t++)
      for (let i = 0; i < 6; i++) {
        const x = -1.4 + i * 0.56,
          y = 0.62 + t * 0.4,
          z = t ? -0.1 : 0.0,
          r2 = 0.06 + i * 0.012;
        b.cyl(0.018, 0.018, 0.32, chr, [x, y + r2, z], [0, 0, PI / 2], 8);
        for (const s of [-1, 1]) b.cyl(r2, r2, 0.08, iron, [x + s * 0.16, y + r2, z], [0, 0, PI / 2], 6);
      }
    b.pop();
    S(-0.3, 3.3, -5.75, -4.65, 0, 1.2, true);
    b.push([-2.6, 0, -3.6]);
    b.rbox(0.32, 0.1, 1.2, 0.03, pad, [0, 0.45, 0.1]);
    b.box(0.08, 0.4, 0.08, iron, [0, 0.2, 0.4], null, 0);
    b.box(0.08, 0.4, 0.08, iron, [0, 0.2, -0.3], null, 0);
    for (const s of [-1, 1]) {
      b.box(0.06, 1.3, 0.06, iron, [s * 0.55, 0.65, -0.55], null, 0);
      b.box(0.06, 0.12, 0.12, chr, [s * 0.55, 1.2, -0.5], null, 0);
    }
    b.cyl(0.016, 0.016, 2.0, chr, [0, 1.27, -0.5], [0, 0, PI / 2], 8);
    for (const s of [-1, 1])
      for (let q = 0; q < 2; q++)
        b.cyl(0.22 - q * 0.04, 0.22 - q * 0.04, 0.04, iron, [s * (0.78 + q * 0.05), 1.27, -0.5], [0, 0, PI / 2], 18);
    b.pop();
    S(-3.3, -1.9, -4.4, -2.7, 0, 1.4, true);
    b.push([4.6, 0, -3.2]);
    b.cyl(0.03, 0.03, 1.3, iron, [0, 0.65, 0], null, 8);
    b.box(0.6, 0.05, 0.6, iron, [0, 0.03, 0], null, 0);
    for (let k = 0; k < 6; k++) {
      const a = (k * PI) / 3,
        y = 0.35 + (k % 3) * 0.35;
      b.cyl(0.012, 0.012, 0.2, chr, [Math.cos(a) * 0.1, y, Math.sin(a) * 0.1], [0, 0, PI / 2], 6);
      b.cyl(
        0.15 + (k % 3) * 0.03,
        0.15 + (k % 3) * 0.03,
        0.04,
        iron,
        [Math.cos(a) * 0.18, y, Math.sin(a) * 0.18],
        [0, 0, PI / 2],
        16
      );
    }
    b.pop();
    S(4.2, 5.0, -3.6, -2.8, 0, 1.3, true);
    for (let i = 0; i < 5; i++) {
      const x = -4.2 + i * 0.42;
      b.add(K.sphGeo(0.11 + i * 0.01, 12, 8), iron, {p: [x, 0.12 + i * 0.01, -1.2]});
      b.add(K.torGeo(0.07, 0.016, 6, 14, PI), iron, {p: [x, 0.24 + i * 0.02, -1.2], r: [0, 0, 0]});
    }
    b.push([6.6, 0, -1.6], [0, PI / 2, 0]);
    b.rbox(0.8, 0.18, 1.8, 0.04, K.mat(0x3a3c40, 0.5, 0.3), [0, 0.12, 0]);
    b.box(0.6, 0.02, 1.6, K.mat(0x121212, 0.9), [0, 0.22, 0], null, 0);
    for (const s of [-1, 1]) b.box(0.05, 1.2, 0.05, K.mat(0x8a8c8e, 0.4, 0.6), [s * 0.34, 0.75, -0.8], [0.2, 0, 0], 0);
    b.rbox(0.7, 0.32, 0.18, 0.03, K.mat(0x2a2c30, 0.4, 0.3), [0, 1.36, -0.95], [0.4, 0, 0]);
    b.box(
      0.4,
      0.18,
      0.01,
      K.mat(0x3a8a3a, 0.3, 0, {emissive: 0x2a6a2a, emissiveIntensity: 0.5}),
      [0, 1.38, -0.85],
      [0.4, 0, 0],
      0
    );
    b.pop();
    S(5.7, 7.5, -2.0, -1.2, 0, 1.5, true);
    b.label(
      3.2,
      0.7,
      K.paint(
        'dw_gym',
        768,
        168,
        (c, W, H) => {
          c.fillStyle = '#1a1a1a';
          c.fillRect(0, 0, W, H);
          dumbbell(c, 80, H / 2, 1.0, YEL);
          P.text(c, 'LIFT LIKE YOU ARE BEING CHASED', W * 0.56, H * 0.38, {size: 40, col: '#fff', max: W - 180});
          P.text(c, '(YOU PROBABLY ARE)', W * 0.56, H * 0.75, {size: 30, col: YEL});
        },
        {r: 0.5, glow: 0.2}
      ),
      [1.0, 2.9, Z0 + 0.17]
    );
    /* ---------- outdoors: kayak rack, tents, rod racks, tackle, coolers ---------- */
    b.push([-8.5, 0, -5.4]);
    for (const [x, z] of [
      [-1.3, -0.35],
      [1.3, -0.35],
      [-1.3, 0.35],
      [1.3, 0.35]
    ])
      b.box(0.05, 2.0, 0.05, stl, [x, 1.0, z], null, 0);
    for (let k = 0; k < 3; k++) b.box(2.7, 0.03, 0.75, stl, [0, 0.3 + k * 0.75, 0], null, 0);
    for (const [y, c2] of [
      [1.05, 0x1a3aa8],
      [1.8, 0xc41a1a]
    ])
      b.add(K.sphGeo(0.38, 18, 10), K.mat(c2, 0.3, 0.2), {p: [0, y + 0.12, 0], s: [3.6, 0.45, 1]});
    b.pop();
    S(-9.9, -7.1, -5.8, -5.0, 0, 2.0, true);
    const tent = (x, z, ry) => {
      b.push([x, 0, z], [0, ry, 0]);
      const tc = K.tri(
        'dw_tent',
        (c, W, H, r) => {
          c.fillStyle = '#e8901a';
          c.fillRect(0, 0, W, H);
          for (let i = 0; i < 20; i++) {
            c.strokeStyle = 'rgba(120,60,10,.25)';
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(r() * W, 0);
            c.lineTo(r() * W, H);
            c.stroke();
          }
        },
        {tile: 0.6, r: 0.85}
      );
      for (const s of [-1, 1]) b.box(1.6, 0.02, 1.2, tc, [0, 0.5, s * 0.42], [s * 0.95, 0, 0], 0); // v090: was -0.95 (upside down)
      b.pop();
      S(x - 0.9, x + 0.9, z - 0.8, z + 0.8, 0, 1.0, true);
    };
    tent(-16.2, 0.9, 0.2); // v089: was (-14.6, -0.4), pitched outside the office door
    tent(-10.6, 0.2, -0.3);
    const rodRack = (x, z) => {
      b.push([x, 0, z]);
      const yl = K.mat(0xe8c020, 0.5, 0.3);
      b.box(1.4, 0.12, 0.4, yl, [0, 0.06, 0], null, 0);
      b.box(1.4, 0.1, 0.1, yl, [0, 1.1, -0.12], null, 0);
      for (const s of [-1, 1]) b.box(0.06, 1.2, 0.4, yl, [s * 0.7, 0.6, 0], null, 0);
      for (let i = 0; i < 12; i++)
        b.cyl(
          0.006,
          0.004,
          2.0,
          K.mat([0x2a2a2a, 0x7a2a1a, 0x1a3a6a][i % 3], 0.4, 0.3),
          [-0.62 + i * 0.11, 1.1, -0.05 + (i % 2) * 0.08],
          [0.05 * (i % 2 ? 1 : -1), 0, 0],
          5
        );
      b.pop();
      S(x - 0.75, x + 0.75, z - 0.25, z + 0.25, 0, 2.0, true);
    };
    rodRack(-16.8, 1.2);
    rodRack(-16.8, -0.4 + 0 * 0);
    for (let i = 0; i < 4; i++)
      b.rbox(0.45, 0.2, 0.25, 0.03, K.mat([0x2a6a3a, 0x7a7a7a, 0xc41a1a, 0x1a3a8a][i], 0.4, 0.2), [
        -11.4 + i * 0.55,
        0.12,
        -1.2
      ]);
    for (let i = 0; i < 3; i++) {
      b.rbox(0.6, 0.42, 0.4, 0.06, K.mat([0xc41a1a, 0x1a4ea8, 0xe8e8e4][i], 0.4, 0.2), [-6.6 - i * 0.7, 0.21, 0.6]);
      b.box(0.62, 0.06, 0.42, K.mat(0xf4f4f0, 0.4), [-6.6 - i * 0.7, 0.44, 0.6], null, 0.01);
    }
    b.label(
      0.9,
      0.6,
      poster(
        'dw_p_clean',
        (c, W, H) => {
          c.fillStyle = '#f4f4f0';
          c.fillRect(0, 0, W, H);
          c.save();
          c.translate(50, 50);
          c.rotate(-0.15);
          c.fillStyle = YEL;
          c.fillRect(-40, -22, 80, 44);
          P.text(c, 'FREE', 0, 0, {size: 30, col: RED});
          c.restore();
          P.text(c, 'CLEANING KIT', W / 2 + 30, 50, {size: 28, col: '#1a1a1a'});
          P.text(c, 'WITH EVERY RIFLE', W / 2, 110, {size: 20, col: '#333'});
          P.text(c, '(WHILE STOCKS LAST)', W / 2, 140, {size: 16, col: '#666'});
        },
        0.9,
        0.6
      ),
      [-12.17, 2.2, -0.5],
      [0, PI / 2, 0]
    );
    /* ---------- hunting counter area (right side) — racks + case are lootable models ---------- */
    b.label(
      2.6,
      0.4,
      K.paint(
        'dw_hunt',
        512,
        80,
        (c, W, H) => {
          c.fillStyle = '#3a4a2a';
          c.fillRect(0, 0, W, H);
          P.text(c, 'HUNTING & FIREARMS', W / 2, H / 2, {size: 36, col: '#f4e8c8'});
        },
        {r: 0.6}
      ),
      [X1 - 0.18, 3.0, 1.6],
      [0, -PI / 2, 0]
    );
    b.box(0.04, 1.4, 3.0, K.veneer(0x5a3a22, {tile: 0.5}), [X1 - 0.18, 1.8, 1.6], null, 0);
    /* ---------- stock room + office ---------- */
    const shelf = (x, z, a) => {
      b.push([x, 0, z], [0, a, 0]);
      for (const [px, pz] of [
        [-0.95, -0.3],
        [0.95, -0.3],
        [-0.95, 0.3],
        [0.95, 0.3]
      ])
        b.box(0.05, 1.9, 0.05, stl, [px, 0.95, pz], null, 0);
      for (let k = 0; k < 4; k++) b.box(2.0, 0.04, 0.65, stl, [0, 0.2 + k * 0.55, 0], null, 0.01);
      for (let k = 0; k < 4; k++)
        for (let q = 0; q < 3; q++)
          if (rnd() < 0.6)
            b.rbox(
              0.5,
              0.35,
              0.45,
              0.02,
              K.surf('cardboard', 0xb08a58),
              [-0.6 + q * 0.6, 0.4 + k * 0.55, 0],
              [0, (rnd() - 0.5) * 0.3, 0]
            );
      b.pop();
      S(x - 1.0, x + 1.0, z - 0.35, z + 0.35, 0, 1.9, true);
    };
    shelf(10.4, -5.5, 0);
    shelf(17.5, -3.6, PI / 2);
    for (let i = 0; i < 8; i++) {
      // v089: kept out of the bay and stock-room doorways
      const x = 10.9 + rnd() * 4,
        z = -4.1 + rnd() * 1.2,
        s = 0.4 + rnd() * 0.4;
      b.rbox(s, s * 0.8, s * 0.9, 0.02, K.surf('cardboard', 0xb08a58), [x, s * 0.4, z], [0, rnd(), 0]);
    }
    for (let i = 0; i < 2; i++) b.rbox(0.6, 0.3, 0.4, 0.03, K.mat(0x5a6062, 0.5, 0.3), [9.0 + i * 0.8, 0.15, -3.2]);
    b.label(
      0.5,
      0.2,
      K.paint(
        'dw_exit',
        180,
        72,
        (c, W, H) => {
          c.fillStyle = '#f4f4f0';
          c.fillRect(0, 0, W, H);
          P.text(c, 'EXIT', W / 2, H / 2, {size: 46, col: '#c41a1a'});
        },
        {glow: 0.8}
      ),
      [17, 2.75, Z0 + 0.17]
    );
    b.label(
      0.5,
      0.2,
      K.paint('dw_exit', 180, 72, () => {}, {glow: 0.8}),
      [BDX, 2.75, Z0 + 0.17]
    );
    b.label(
      0.9,
      0.24,
      K.paint('dw_staff', 300, 80, (c, W, H) => {
        c.fillStyle = '#1a1a1a';
        c.fillRect(0, 0, W, H);
        P.text(c, 'STAFF ONLY', W / 2, H / 2, {size: 34, col: '#fff'});
      }),
      [10, 2.7, -0.9]
    );
    b.push([-16.6, 0, -5.2]);
    b.box(1.6, 0.05, 0.75, K.veneer(0x8a5a36, {tile: 0.6}), [0, 0.75, 0], null, 0.01);
    for (const s of [-0.75, 0.75]) b.box(0.05, 0.72, 0.7, K.veneer(0x6a3a1e, {tile: 0.6}), [s, 0.36, 0], null, 0);
    b.rbox(0.45, 0.3, 0.04, 0.01, blk, [0, 1.0, -0.2]);
    b.box(0.04, 0.12, 0.04, blk, [0, 0.84, -0.2], null, 0);
    b.pop();
    chair(-16.4, -4.3, PI);
    S(-17.45, -15.75, -5.6, -4.8, 0, 0.8);
    const por = K.mat(0xf4f4f0, 0.2);
    b.push([-12.6, 0, -5.4]);
    b.lathe(
      [
        [0, 0],
        [0.18, 0],
        [0.2, 0.1],
        [0.22, 0.4],
        [0, 0.4]
      ],
      por,
      [0, 0, 0],
      18
    );
    b.rbox(0.4, 0.4, 0.2, 0.03, por, [0, 0.6, -0.25]);
    b.pop();
    CACHE = {M: b.done(), cols, occ};
    return CACHE;
  }

  /* ===================== the builder ===================== */
  function bDeadWeight(x, z, t) {
    const B = mk(x, z, 40, 36, H, 0xa8a8a4, 0x3a4a7a, 0x3a4a52);
    B.dx = 0;
    const PT = {th: 0.16, c: 0x9a9a96};
    WL(
      B,
      1,
      Z1,
      X0,
      X1,
      [
        ...wins([-15.6, -13.8, -11.0]),
        {k: 'd', c: -6.65, dbl: 'slide'},
        {k: 'd', c: -5.35, dbl: 'slide'},
        ...wins([9.6, 11.2, 12.8])
      ], // v089: sliding glass doors
      H
    );
    WL(
      B,
      1,
      Z0,
      X0,
      X1,
      [
        {k: 'd', c: BDX, s: -1},
        {k: 'g', c: 12.8},
        {k: 'g', c: 14.4},
        {k: 'd', c: 17, s: -1}
      ],
      H
    );
    WL(B, 0, X0, Z0, Z1, [], H);
    WL(B, 0, X1, Z0, Z1, [], H);
    WL(B, 1, -1, 8, X1, [{k: 'd', c: 10}], H, PT);
    WL(B, 0, 8, Z0, -1, [], H, PT);
    WL(B, 1, -2, X0, -12, [{k: 'd', c: -14}], H, PT);
    WL(B, 0, -12, Z0, -2, [], H, PT);
    const C = build(),
      D = new THREE.Object3D();
    D.userData.kind = 'bdecor';
    for (const q of C.M.meshes) {
      const m = new THREE.Mesh(q.g, q.mat);
      m.castShadow = !q.mat.transparent;
      m.receiveShadow = true;
      D.add(m);
    }
    B.g.add(D);
    B.g.updateMatrixWorld(true);
    for (const c of C.cols) {
      const a = new THREE.Vector3(c[0], c[1], c[2]).applyMatrix4(B.g.matrixWorld),
        e = new THREE.Vector3(c[3], c[4], c[5]).applyMatrix4(B.g.matrixWorld);
      solids.push(new THREE.Box3(a.clone().min(e), a.clone().max(e)));
    }
    for (const o of C.occ) B.occ.push(o);
    // v090: real vehicle models (vehicles.js) instead of the hand-built ones
    window.LOTKIT.vehicle(B, 'van', 13.6, -11.0, PI, {
      label: 'DEAD WEIGHT SPORTING GOODS',
      labelCol: '#1a1a1a',
      tint: [0.94, 0.94, 0.92],
      dust: true
    });

    const ry = a => (B.cs > 0 ? a : a + PI),
      SP = (lx, lz, name, table, a, y0) => {
        try {
          if (window.spawnPropContainer) spawnPropContainer(WX(B, lx), WZ(B, lz), name, table, ry(a), y0 || 0);
          else cont(B, table || 'sporting', lx, lz);
        } catch (e) {}
      };
    // lootable: cash register on the wrap, hunting counter (display case, gun racks, gun cabinet), stock-room racking + boxes, office desk, dumpster
    SP(-1.6, 4.45, 'cash_register', 'sporting', PI, 1.05);
    SP(14.6, 2.0, 'display_case', 'gunshop', PI / 2);
    SP(X1 - 0.3, 0.8, 'gun_rack', 'gunshop', -PI / 2, 0);
    SP(X1 - 0.3, 2.4, 'gun_rack', 'gunshop', -PI / 2, 0);
    SP(X1 - 0.4, -0.0 + 3.9, 'gun_cabinet', 'gunshop', -PI / 2);
    SP(12.4, -1.9, 'shop_shelves_half', 'sporting', PI); // v089: was x 9.6, behind the stock-room door
    SP(15.4, -1.7, 'cardboard_box_large', 'sporting', PI);
    SP(16.3, -1.6, 'cardboard_box_medium', 'sporting', PI);
    SP(-14.4, -5.4, 'bookshelf', 'office', 0);
    SP(4.5, -15.6, 'dumpster_blue', 'house', 0);
    rc(B, 'sporting', [-17, 6, 0, 11], 1);
    buildings.push({x: WX(B, 0), z: WZ(B, 3), w: 36, d: 18, t: t.id});
    for (const [px, pz] of [
      [-12, 8],
      [0, 6],
      [10, 7],
      [-8, -2],
      [2, -3],
      [13, -3],
      [0, -12]
    ].slice(0, ri(3, 6)))
      zombie(WX(B, px), WZ(B, pz));
    LASTB = B;
    return B;
  }

  /* register as a new BIG-lot type (the old sporting goods shop was only a small legacy lot) */
  if (typeof ruin === 'function') {
    const _r = ruin;
    ruin = function (x, z, t, lv) {
      if (t && t.id === 'dead_weight_sporting' && lv > 1) {
        arguments[3] = 1;
      }
      return _r.apply(this, arguments);
    };
  }
  if (!NEWCAT.find(d => d.id === 'dead_weight_sporting'))
    NEWCAT.push({
      id: 'dead_weight_sporting',
      name: 'Dead Weight Sporting Goods',
      pool: 'big',
      scope: 'big',
      category: 'commercial',
      front: 'south',
      builder: 'prop',
      build: bDeadWeight,
      loot: 'sporting',
      note: 'full-block sporting goods store: apparel, balls, gym corner, outdoors, hunting, stock room',
      w: 30,
      d: 23,
      variants: typeof nvar === 'function' ? nvar() : {intact: {props: []}, looted: {props: []}, ruined: {props: []}},
      legacy: false
    });
  if (typeof NOYARD !== 'undefined') NOYARD.add('dead_weight_sporting');
  window.bDeadWeight = bDeadWeight;
  window.DEADWEIGHT = {build};
  console.log('[sporting] Dead Weight ready');
})();
