/* ==========================================================================================================
   MINI FORT ZOMBIE - INN-AND-OUT MOTEL (v072): a full-block courtyard motel (40 x 36 m plot, front = +Z), our own design.
   Plan: a U of single-storey lime-green clapboard wings (left 3 rooms, back 4 rooms, right 3 rooms) round a grass courtyard with a
   concrete path; covered brick-paved walkways on red timber columns under hipped shingle roofs with red fascias; a laundry room and
   a linen store in the back corners; the office at the front of the right wing; a raised pool deck with a drained kidney pool behind
   a brick wall and chain-link fence (coping, ladder, loungers, umbrella, gravel beds, hedges); a parking lot with stalls, wheel stops
   and cars; a grass median with a tree; the INN-AND-OUT sun sign on a tall pole (red MOTEL banner, NO VACANCY plate, bulbs); a brick
   perimeter wall with hedges; sidewalk with street lights, a traffic signal, hydrant and no-parking sign.
   Rooms: green carpet, beige walls, bed with headboard / footboard and coloured spread, nightstand + lamp, CRT TV on a stand,
   lootable dresser, table and chair by the window, picture, wardrobe rail, en-suite (tile, claw-foot tub, toilet, vanity, mirror).
   Structure from core WL (doors / windows work); detail is our own geometry and painted artwork, outside the static merge.
   ========================================================================================================== */
(function () {
  'use strict';
  const K = window.MFZK;
  if (!K || typeof WL !== 'function' || typeof NEWCAT === 'undefined') {
    console.warn('[motel] core / prop kit missing');
    return;
  }
  const T = THREE,
    P = K.P,
    PI = Math.PI;
  const H = 3.0,
    CEIL = 2.75,
    DH = 0.5;
  const RED = '#b8261c',
    YEL = '#f2c418';
  // rooms: [centre x, centre z, rotation] — local +z is the door side (walkway)
  const ROOMS = [
    [-15, -6, PI / 2],
    [-15, -2, PI / 2],
    [-15, 2, PI / 2],
    [-6, -12, 0],
    [-2, -12, 0],
    [2, -12, 0],
    [6, -12, 0],
    [15, -6, -PI / 2],
    [15, -2, -PI / 2],
    [15, 2, -PI / 2]
  ];
  const toPlot = (r, lx, lz) => {
    const [cx, cz, a] = r;
    return [cx + lx * Math.cos(a) + lz * Math.sin(a), cz - lx * Math.sin(a) + lz * Math.cos(a)];
  };

  /* ===================== artwork ===================== */
  const SURF = {};
  const surf = k =>
    SURF[k] ||
    (SURF[k] = {
      siding: () =>
        K.tri(
          'im_siding',
          (c, W, H, r) => {
            const n = 8,
              s = H / n;
            for (let i = 0; i < n; i++) {
              const g = c.createLinearGradient(0, i * s, 0, i * s + s);
              g.addColorStop(0, '#8a924a');
              g.addColorStop(0.15, '#b4bc6a');
              g.addColorStop(0.9, '#a4ac5c');
              g.addColorStop(1, '#5e6430');
              c.fillStyle = g;
              c.fillRect(0, i * s, W, s);
            }
            P.grime(c, W, H, r, 0.45);
            for (let i = 0; i < 10; i++) {
              const g = c.createLinearGradient(0, 0, 0, H);
              g.addColorStop(0, 'rgba(60,60,30,.2)');
              g.addColorStop(1, 'rgba(60,60,30,0)');
              c.fillStyle = g;
              c.fillRect(r() * W, 0, 4 + r() * 14, H * r());
            }
          },
          {tile: 0.5, r: 0.8}
        ),
      shingle: () =>
        K.tri(
          'im_shingle',
          (c, W, H, r) => {
            c.fillStyle = '#2a2422';
            c.fillRect(0, 0, W, H);
            const rows = 10,
              rh = H / rows;
            for (let j = 0; j < rows; j++)
              for (let i = -1; i < 9; i++) {
                const w = W / 8,
                  x = i * w + ((j % 2) * w) / 2 + (r() - 0.5) * 6;
                c.fillStyle = `hsl(${15 + r() * 20},${8 + r() * 10}%,${22 + r() * 16}%)`;
                c.fillRect(x + 1, j * rh + 1, w - 2, rh - 1);
                c.fillStyle = 'rgba(0,0,0,.5)';
                c.fillRect(x, j * rh + rh - 3, w, 3);
              }
            P.grime(c, W, H, r, 0.5);
          },
          {tile: 0.5, r: 0.9}
        ),
      pavers: () =>
        K.tri(
          'im_pavers',
          (c, W, H, r) => {
            c.fillStyle = '#5a3a30';
            c.fillRect(0, 0, W, H);
            const bw = W / 4,
              bh = H / 8;
            for (let j = 0; j < 8; j++)
              for (let i = -1; i < 5; i++) {
                const x = i * bw + ((j % 2) * bw) / 2;
                c.fillStyle = `hsl(${8 + r() * 10},${24 + r() * 12}%,${34 + r() * 12}%)`;
                c.fillRect(x + 2, j * bh + 2, bw - 4, bh - 4);
              }
            P.grime(c, W, H, r, 0.4);
          },
          {tile: 0.5, r: 0.9}
        ),
      path: () =>
        K.tri(
          'im_path',
          (c, W, H, r) => {
            c.fillStyle = '#a8a69e';
            c.fillRect(0, 0, W, H);
            P.noise(c, W, H, r, 12000, 0.25, '#6a6862', 1.6);
            c.strokeStyle = 'rgba(40,40,40,.6)';
            c.lineWidth = 3;
            c.beginPath();
            c.moveTo(0, H / 2);
            c.lineTo(W, H / 2);
            c.moveTo(W / 2, 0);
            c.lineTo(W / 2, H);
            c.stroke();
            c.lineWidth = 1.5;
            c.beginPath();
            let x = r() * W,
              y = r() * H;
            c.moveTo(x, y);
            for (let q = 0; q < 8; q++) {
              x += (r() - 0.5) * 40;
              y += (r() - 0.5) * 40;
              c.lineTo(x, y);
            }
            c.stroke();
          },
          {tile: 0.5, r: 0.85}
        ),
      brick: () =>
        K.tri(
          'im_brick',
          (c, W, H, r) => {
            c.fillStyle = '#6a4a40';
            c.fillRect(0, 0, W, H);
            const bw = W / 4,
              bh = H / 12;
            for (let j = 0; j < 12; j++)
              for (let i = -1; i < 5; i++) {
                const x = i * bw + ((j % 2) * bw) / 2;
                c.fillStyle = `hsl(${8 + r() * 10},${36 + r() * 14}%,${38 + r() * 12}%)`;
                c.fillRect(x + 2, j * bh + 2, bw - 4, bh - 4);
              }
            P.grime(c, W, H, r, 0.5);
          },
          {tile: 0.38, r: 0.9}
        ),
      carpet: () =>
        K.tri(
          'im_carpet',
          (c, W, H, r) => {
            c.fillStyle = '#3a5a3e';
            c.fillRect(0, 0, W, H);
            P.noise(c, W, H, r, 30000, 0.35, '#2a3a2a', 1.3);
            P.noise(c, W, H, r, 20000, 0.25, '#5a7a5a', 1.3);
            for (let i = 0; i < 4; i++) {
              const g = c.createRadialGradient(r() * W, r() * H, 4, r() * W, r() * H, 40 + r() * 60);
              g.addColorStop(0, 'rgba(30,24,16,.3)');
              g.addColorStop(1, 'rgba(30,24,16,0)');
              c.fillStyle = g;
              c.fillRect(0, 0, W, H);
            }
          },
          {tile: 0.6, r: 0.95}
        ),
      wall: () =>
        K.tri(
          'im_wall',
          (c, W, H, r) => {
            c.fillStyle = '#c4b29a';
            c.fillRect(0, 0, W, H);
            P.noise(c, W, H, r, 20000, 0.2, '#8a7a66', 1.6);
            P.noise(c, W, H, r, 10000, 0.2, '#e0d0b8', 1.6);
          },
          {tile: 0.5, r: 0.95}
        ),
      tile: () =>
        K.tri(
          'im_tile',
          (c, W, H, r) => {
            const n = 4,
              s = W / n;
            c.fillStyle = '#8a9094';
            c.fillRect(0, 0, W, H);
            for (let i = 0; i < n; i++)
              for (let j = 0; j < n; j++) {
                const g = c.createLinearGradient(i * s, j * s, i * s + s, j * s + s);
                g.addColorStop(0, '#eef2f4');
                g.addColorStop(1, '#d0d8dc');
                c.fillStyle = g;
                c.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
              }
            P.grime(c, W, H, r, 0.3);
          },
          {tile: 1.2, r: 0.2}
        ),
      ceil: () =>
        K.tri(
          'im_ceil',
          (c, W, H, r) => {
            c.fillStyle = '#e0dcd2';
            c.fillRect(0, 0, W, H);
            P.noise(c, W, H, r, 30000, 0.25, '#9a968c', 1.2);
          },
          {tile: 0.5, r: 0.95}
        ),
      wood: () => K.veneer(0xa8582a, {tile: 0.5}),
      asphalt: () => K.surf('asphalt', 0x3a3c40),
      concrete: () => K.surf('concrete', 0xb0aea6),
      lawn: () => K.surf('lawn', 0x4a6a2a),
      gravel: () => K.surf('galets', 0xb8a888),
      poolTile: () =>
        K.tri(
          'im_ptile',
          (c, W, H, r) => {
            const n = 8,
              s = W / n;
            c.fillStyle = '#4a7a8a';
            c.fillRect(0, 0, W, H);
            for (let i = 0; i < n; i++)
              for (let j = 0; j < n; j++) {
                c.fillStyle = `hsl(${190 + r() * 10},${30 + r() * 10}%,${56 + r() * 10}%)`;
                c.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
              }
            P.grime(c, W, H, r, 0.8);
          },
          {tile: 1.4, r: 0.25}
        ),
      coping: () =>
        K.tri(
          'im_coping',
          (c, W, H, r) => {
            c.fillStyle = '#c8c4b8';
            c.fillRect(0, 0, W, H);
            P.noise(c, W, H, r, 8000, 0.25, '#7a7468', 1.5);
            c.fillStyle = 'rgba(60,60,60,.5)';
            for (let x = 0; x < W; x += W / 4) c.fillRect(x, 0, 3, H);
          },
          {tile: 0.5, r: 0.8}
        ),
      deck: () =>
        K.tri(
          'im_deck',
          (c, W, H, r) => {
            c.fillStyle = '#8a7a68';
            c.fillRect(0, 0, W, H);
            for (let i = 0; i < 60; i++) {
              c.fillStyle = `hsl(${25 + r() * 15},${18 + r() * 12}%,${50 + r() * 16}%)`;
              c.beginPath();
              const x = r() * W,
                y = r() * H;
              for (let a = 0; a < 6; a++)
                c.lineTo(x + Math.cos(a) * (14 + r() * 10), y + Math.sin(a) * (10 + r() * 10));
              c.fill();
            }
          },
          {tile: 0.5, r: 0.9}
        ),
      hedge: () =>
        K.tri(
          'im_hedge',
          (c, W, H, r) => {
            c.fillStyle = '#1e3a14';
            c.fillRect(0, 0, W, H);
            for (let i = 0; i < 2200; i++) {
              c.fillStyle = `hsl(${90 + r() * 30},${30 + r() * 25}%,${12 + r() * 20}%)`;
              c.beginPath();
              c.ellipse(r() * W, r() * H, 3 + r() * 5, 2 + r() * 3, r() * PI, 0, PI * 2);
              c.fill();
            }
          },
          {tile: 0.6, r: 0.9}
        ),
      leaves: () =>
        K.tri(
          'im_leaf',
          (c, W, H, r) => {
            c.fillStyle = '#2e4a1e';
            c.fillRect(0, 0, W, H);
            for (let i = 0; i < 900; i++) {
              c.fillStyle = `hsl(${70 + r() * 30},${30 + r() * 25}%,${16 + r() * 22}%)`;
              c.beginPath();
              c.ellipse(r() * W, r() * H, 4 + r() * 7, 2 + r() * 4, r() * PI, 0, PI * 2);
              c.fill();
            }
          },
          {tile: 0.8, r: 0.8}
        ),
      chain: () =>
        K.paint(
          'im_chain',
          256,
          256,
          (c, W, H) => {
            c.clearRect(0, 0, W, H);
            c.strokeStyle = 'rgba(190,196,200,.95)';
            c.lineWidth = 2.4;
            for (let i = -H; i < W + H; i += 14) {
              c.beginPath();
              c.moveTo(i, 0);
              c.lineTo(i + H, H);
              c.stroke();
              c.beginPath();
              c.moveTo(i, H);
              c.lineTo(i + H, 0);
              c.stroke();
            }
          },
          {alpha: true, r: 0.4, m: 0.7}
        )
    }[k]());
  const spreadMat = i =>
    K.paint(
      'im_spread' + (i % 4),
      256,
      256,
      (c, W, H, r) => {
        const base = ['#2a4ab8', '#8a1a2a', '#2a6a3a', '#6a3a8a'][i % 4];
        c.fillStyle = base;
        c.fillRect(0, 0, W, H);
        c.strokeStyle = 'rgba(255,255,255,.18)';
        c.lineWidth = 6;
        for (let y = 0; y < H; y += 24) {
          c.beginPath();
          c.moveTo(0, y);
          for (let x = 0; x <= W; x += 16) c.lineTo(x, y + Math.sin(x / 20 + y) * 6);
          c.stroke();
        }
        P.grime(c, W, H, r, 0.2);
      },
      {r: 0.9}
    );
  const pictureMat = i =>
    K.paint(
      'im_pic' + (i % 4),
      256,
      160,
      (c, W, H, r) => {
        const g = c.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, ['#e89a5a', '#5a8ac8', '#c8b45a', '#8a5ac8'][i % 4]);
        g.addColorStop(1, '#f4e0b8');
        c.fillStyle = g;
        c.fillRect(0, 0, W, H);
        c.fillStyle = '#3a5a2a';
        c.beginPath();
        c.moveTo(0, H);
        c.lineTo(60, H * 0.55);
        c.lineTo(120, H * 0.75);
        c.lineTo(190, H * 0.45);
        c.lineTo(W, H * 0.7);
        c.lineTo(W, H);
        c.fill();
        c.fillStyle = '#ffd23a';
        c.beginPath();
        c.arc(W * 0.7, H * 0.3, 16, 0, PI * 2);
        c.fill();
        c.strokeStyle = '#c8a05a';
        c.lineWidth = 10;
        c.strokeRect(5, 5, W - 10, H - 10);
      },
      {r: 0.4}
    );

  /* ===================== the geometry ===================== */
  let CACHE = null;
  const LOTTREES = [];
  function build() {
    if (CACHE) return CACHE;
    const b = K.builder('innandout'),
      cols = [],
      occ = [];
    const S = (x0, x1, z0, z1, y0, y1, noOcc) => {
      cols.push([Math.min(x0, x1), y0, Math.min(z0, z1), Math.max(x0, x1), y1, Math.max(z0, z1)]);
      if (!noOcc) occ.push([Math.min(x0, x1), Math.max(x0, x1), Math.min(z0, z1), Math.max(z0, z1)]);
    };
    const chrome = K.chrome(),
      blk = K.blackPlastic(),
      rnd = b.rnd,
      conc = surf('concrete'),
      dark = K.mat(0x1a1a1c, 0.5),
      redW = K.veneer(0x8a2a1a, {tile: 0.4}),
      redT = K.mat(0x9a2a1e, 0.6),
      wd = surf('wood'),
      por = K.mat(0xf4f4f0, 0.2);
    // generic lining helper (works inside push frames)
    const lineWall = (ax, f, a0, a1, n, th, ops, mat, top, base) => {
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
        if (base && y0 <= 0) pc(u0, u1, 0, 0.1, base, 0.025, 0.012);
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
    b.box(40, 0.06, 2.1, conc, [0, 0.03, 16.95], null, 0);
    for (let x = -19.5; x < 20; x += 1.5) b.box(0.02, 0.062, 2.08, K.mat(0x8a8880, 0.8), [x, 0.031, 16.95], null, 0);
    b.box(40, 0.16, 0.2, conc, [0, 0.08, 15.9], null, 0);
    b.box(39.6, 0.02, 33.4, surf('lawn'), [0, 0.012, -1.0], null, 0);
    b.box(21.7, 0.03, 5.2, surf('asphalt'), [8.55, 0.02, 11.2], null, 0);
    b.box(3.5, 0.03, 2.3, surf('asphalt'), [-0.55, 0.02, 14.75], null, 0);
    b.box(18.2, 0.14, 1.6, conc, [10.3, 0.07, 14.6], null, 0.03);
    b.box(17.9, 0.03, 1.3, surf('lawn'), [10.3, 0.15, 14.6], null, 0);
    for (let i = 0; i < 8; i++) b.box(0.1, 0.012, 2.6, K.mat(0xeeeee4, 0.7), [-1.4 + i * 2.8, 0.04, 12.4], null, 0);
    for (let i = 0; i < 7; i++)
      b.box(1.6, 0.12, 0.2, K.surf('concrete', 0x9a9890), [0 + i * 2.8, 0.07, 13.4], null, 0.03);
    for (const [x, z] of [
      [3, 11],
      [12, 10.5],
      [-1, 10]
    ])
      b.label(
        1.3,
        1.3,
        K.paint(
          'im_stain',
          128,
          128,
          (c, W, H) => {
            c.clearRect(0, 0, W, H);
            const g = c.createRadialGradient(64, 64, 4, 64, 64, 60);
            g.addColorStop(0, 'rgba(8,6,4,.55)');
            g.addColorStop(1, 'rgba(8,6,4,0)');
            c.fillStyle = g;
            c.fillRect(0, 0, W, H);
          },
          {alpha: true}
        ),
        [x, 0.04, z],
        [-PI / 2, 0, 0]
      );
    // courtyard path, walkway pavers
    b.box(2.0, 0.04, 15.0, surf('path'), [0, 0.03, 1.1], null, 0);
    b.box(22, 0.04, 1.6, surf('pavers'), [0, 0.035, -7.2], null, 0);
    b.box(1.6, 0.04, 12, surf('pavers'), [-10.2, 0.035, -2.0], null, 0);
    b.box(1.6, 0.04, 12, surf('pavers'), [10.2, 0.035, -2.0], null, 0);
    b.box(2.0, 0.04, 2.6, surf('pavers'), [0, 0.036, 7.9], null, 0);
    /* ---------- exterior siding ---------- */
    const sid = surf('siding');
    const skin = (ax, f, a0, a1, n, ops, mat) => {
      ops = (ops || []).slice().sort((p, q) => p.c - q.c);
      const m = mat || sid;
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
        const hw = p.k === 'w' ? 0.75 : 0.65;
        pc(a, p.c - hw, 0, H);
        if (p.k === 'w') {
          pc(p.c - hw, p.c + hw, 0, 0.9);
          pc(p.c - hw, p.c + hw, 2.75, H);
        } else pc(p.c - hw, p.c + hw, 2.4, H);
        a = p.c + hw;
      }
      pc(a, a1, 0, H);
      const L = a1 - a0,
        u = (a0 + a1) / 2,
        o = f + n * 0.2;
      if (ax) b.box(L, 0.12, 0.06, K.mat(0x7a8a2a, 0.6), [u, 0.06, o], null, 0);
      else b.box(0.06, 0.12, L, K.mat(0x7a8a2a, 0.6), [o, 0.06, u], null, 0);
    };
    const roomOps = (list, doorSign) => {
      const o = [];
      for (const c of list) {
        o.push({k: 'd', c: c + doorSign * 1.1}, {k: 'w', c: c - doorSign * 0.9});
      }
      return o;
    };
    const OPS = {left: roomOps([-6, -2, 2], -1), back: roomOps([-6, -2, 2, 6], 1), right: roomOps([-6, -2, 2], 1)};
    skin(0, -11, -8, 4, 1, OPS.left);
    skin(1, 4, -19, -11, 1, []);
    skin(0, -19, -16, 4, -1, []);
    skin(1, -8, -11, -8, 1, [{k: 'd', c: -9.6}]);
    skin(1, -8, -8, 8, 1, OPS.back);
    skin(1, -16, -19, 19, -1, []);
    skin(1, -8, 8, 11, 1, [{k: 'd', c: 9.6}]);
    skin(0, 11, -8, 4, -1, OPS.right);
    skin(0, 19, -16, 8.6, 1, []);
    skin(1, 8.6, 11, 19, 1, [
      {k: 'd', c: 13},
      {k: 'w', c: 15.4},
      {k: 'w', c: 17.4}
    ]);
    skin(0, 11, 4, 8.6, -1, [{k: 'd', c: 6.6}]);
    // window frames (white), room-number plaques by the doors
    const frameAt = (x, z, ry) => {
      b.push([x, 1.825, z], [0, ry, 0]);
      b.frame(1.62, 1.95, 0.07, K.mat(0xd8d8d4, 0.4, 0.3), [0, 0, 0.0], 0.035);
      b.box(1.8, 0.06, 0.14, K.mat(0xd8d8d4, 0.4, 0.3), [0, -0.95, 0.05], null, 0.01);
      b.pop();
    };
    ROOMS.forEach((r, i) => {
      const [wx, wz] = toPlot(r, -0.9, 4.2),
        [px, pz] = toPlot(r, 1.95, 4.18);
      frameAt(wx, wz, r[2]);
      b.label(
        0.16,
        0.2,
        K.paint('im_num' + i, 64, 80, (c, W, H) => {
          c.fillStyle = '#c8a03a';
          P.rrect(c, 4, 4, W - 8, H - 8, 8);
          c.fill();
          P.text(c, String(i + 1), W / 2, H / 2 + 2, {size: 44, col: '#3a2a10'});
        }),
        [px, 1.6, pz],
        [0, r[2], 0]
      );
    });
    for (const x of [15.4, 17.4]) frameAt(x, 8.8, 0);
    /* ---------- walkway columns, fascia, soffits ---------- */
    const column = (x, z) => {
      b.box(0.26, 2.55, 0.26, redW, [x, 1.4, z], null, 0.01);
      b.box(0.42, 0.42, 0.42, redW, [x, 0.21, z], null, 0.02);
      b.box(0.36, 0.12, 0.36, redW, [x, 2.7, z], null, 0.01);
      S(x - 0.2, x + 0.2, z - 0.2, z + 0.2, 0, 2.8, true);
    };
    /* v089: columns between the doors (they stood 1.3 m in front of room doors and right outside the office and laundry doors);
       the corner columns sit 1.44 m from both walls */
    column(-9.35, -6.35);
    column(9.35, -6.35);
    for (const z of [-5.1, -1.1, 2.6, 4.3]) column(-9.5, z); // left wing doors at z -7.1, -3.1, 0.9
    for (const z of [-2.9, 1.1, 4.3]) column(9.5, z); // right wing doors at z -4.9, -0.9, 3.1
    for (const x of [-7.2, -2.9, 1.1, 5.1]) column(x, -6.5); // back row doors at x -4.9, -0.9, 3.1, 7.1
    b.box(0.2, 0.26, 12.6, redT, [-9.5, 2.88, -1.5], null, 0);
    b.box(0.2, 0.26, 12.6, redT, [9.5, 2.88, -1.5], null, 0);
    b.box(19.2, 0.26, 0.2, redT, [0, 2.88, -6.5], null, 0);
    b.box(1.6, 0.04, 12.2, K.mat(0xc8c4a8, 0.8), [-10.2, 2.84, -1.4], null, 0);
    b.box(1.6, 0.04, 12.2, K.mat(0xc8c4a8, 0.8), [10.2, 2.84, -1.4], null, 0);
    b.box(22, 0.04, 1.6, K.mat(0xc8c4a8, 0.8), [0, 2.84, -7.2], null, 0);
    for (const [x, z] of [
      [-10.2, -4],
      [-10.2, 1],
      [10.2, -4],
      [10.2, 1],
      [-4, -7.2],
      [4, -7.2]
    ]) {
      b.cyl(0.12, 0.14, 0.1, K.mat(0xf4f0e0, 0.4), [x, 2.78, z], null, 12);
      b.cyl(
        0.1,
        0.1,
        0.02,
        K.mat(0xffffff, 0.3, 0, {emissive: 0xfff0c8, emissiveIntensity: 0.6}),
        [x, 2.72, z],
        null,
        12
      );
    }
    /* ---------- hipped roofs ---------- */
    const shin = surf('shingle');
    const hip = (x0, x1, z0, z1, y, rise) => {
      const long = x1 - x0 >= z1 - z0;
      const cx = (x0 + x1) / 2,
        cz = (z0 + z1) / 2,
        L = long ? x1 - x0 : z1 - z0,
        Wd = long ? z1 - z0 : x1 - x0,
        hw = Wd / 2;
      b.push([cx, y, cz], [0, long ? 0 : PI / 2, 0]);
      const A = [-L / 2, 0, -hw],
        B2 = [L / 2, 0, -hw],
        C = [L / 2, 0, hw],
        D = [-L / 2, 0, hw],
        R1 = [-L / 2 + hw, rise, 0],
        R2 = [L / 2 - hw, rise, 0];
      const tris = [
        [D, C, R2],
        [D, R2, R1],
        [B2, A, R1],
        [B2, R1, R2],
        [A, D, R1],
        [C, B2, R2]
      ];
      const pos = [];
      for (const t of tris) {
        pos.push(...t[0], ...t[1], ...t[2]);
        pos.push(...t[0], ...t[2], ...t[1]);
      }
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.BufferAttribute(new Float32Array(pos), 3));
      g.setAttribute('uv', new T.BufferAttribute(new Float32Array((pos.length / 3) * 2), 2));
      g.computeVertexNormals();
      b.add(g, shin);
      b.box(L + 0.1, 0.2, 0.1, redT, [0, -0.06, hw], null, 0);
      b.box(L + 0.1, 0.2, 0.1, redT, [0, -0.06, -hw], null, 0);
      b.box(0.1, 0.2, Wd, redT, [L / 2, -0.06, 0], null, 0);
      b.box(0.1, 0.2, Wd, redT, [-L / 2, -0.06, 0], null, 0);
      const hipL = Math.hypot(hw, rise, hw);
      for (const [p, q] of [
        [A, R1],
        [D, R1],
        [B2, R2],
        [C, R2]
      ]) {
        const v = new T.Vector3(q[0] - p[0], q[1] - p[1], q[2] - p[2]),
          qq = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), v.clone().normalize()),
          eu = new T.Euler().setFromQuaternion(qq);
        b.add(new T.BoxGeometry(0.18, v.length(), 0.18), K.mat(0x2a2422, 0.8), {
          p: [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2 + 0.06, (p[2] + q[2]) / 2],
          r: [eu.x, eu.y, eu.z]
        });
      }
      b.box(R2[0] - R1[0] + 0.18, 0.18, 0.18, K.mat(0x2a2422, 0.8), [0, rise + 0.06, 0], null, 0);
      b.pop();
    };
    hip(-19.5, 19.5, -16.5, -6.15, 2.98, 1.9);
    hip(-19.5, -9.2, -6.15, 4.5, 2.98, 1.9);
    hip(9.2, 19.5, -6.15, 9.1, 2.98, 1.9);
    b.box(4, 0.6, 2.6, K.mat(0xb0b4b8, 0.4, 0.7), [0, 4.0, -13], null, 0.03);
    b.cyl(0.08, 0.08, 0.8, K.mat(0x8a8c8e, 0.4, 0.7), [-14, 4.4, -12], null, 8);
    b.cyl(0.08, 0.08, 0.8, K.mat(0x8a8c8e, 0.4, 0.7), [14, 4.4, -1], null, 8);
    /* ---------- room interiors (one template per room) ---------- */
    const cp = surf('carpet'),
      wl = surf('wall'),
      tl = surf('tile'),
      base = K.mat(0x5a4a3a, 0.6);
    const room = (r, i) => {
      b.push([r[0], 0, r[1]], [0, r[2], 0]);
      b.box(3.84, 0.02, 5.44, cp, [0, 0.035, 1.18], null, 0);
      b.box(3.84, 0.02, 2.24, tl, [0, 0.036, -2.78], null, 0);
      b.box(3.84, 0.03, 7.84, surf('ceil'), [0, CEIL + 0.01, 0], null, 0);
      lineWall(
        1,
        4,
        -2,
        2,
        -1,
        0.3,
        [
          {k: 'd', c: 1.1},
          {k: 'w', c: -0.9}
        ],
        wl,
        CEIL,
        base
      );
      lineWall(0, -2, -1.6, 4, 1, 0.16, [], wl, CEIL, base);
      lineWall(0, 2, -1.6, 4, -1, 0.16, [], wl, CEIL, base);
      lineWall(1, -1.6, -2, 2, 1, 0.16, [{k: 'g', c: -1.1}], wl, CEIL, base);
      lineWall(1, -1.6, -2, 2, -1, 0.16, [{k: 'g', c: -1.1}], tl);
      lineWall(0, -2, -4, -1.6, 1, 0.16, [], tl);
      lineWall(0, 2, -4, -1.6, -1, 0.16, [], tl);
      lineWall(1, -4, -2, 2, 1, 0.3, [], tl);
      b.cyl(0.2, 0.2, 0.04, K.mat(0xf4f0e0, 0.4), [0, CEIL - 0.02, 1.2], null, 16);
      b.cyl(
        0.16,
        0.16,
        0.02,
        K.mat(0xffffff, 0.3, 0, {emissive: 0xfff0c8, emissiveIntensity: 0.5}),
        [0, CEIL - 0.045, 1.2],
        null,
        16
      );
      // bed: head to the left wall
      b.push([-0.95, 0, 1.0]);
      b.box(2.0, 0.3, 1.42, wd, [0, 0.25, 0], null, 0.01);
      b.box(1.96, 0.2, 1.38, K.mat(0xf4f0e8, 0.8), [0, 0.5, 0], null, 0.02);
      b.box(1.6, 0.05, 1.46, spreadMat(i), [0.18, 0.62, 0], null, 0.01);
      for (const s of [-1, 1]) b.box(1.6, 0.32, 0.03, spreadMat(i), [0.18, 0.46, s * 0.73], null, 0);
      for (const s of [-0.35, 0.35]) b.rbox(0.4, 0.12, 0.55, 0.05, K.mat(0xf4f0e8, 0.8), [-0.75, 0.67, s]);
      b.box(0.08, 1.1, 1.5, wd, [-1.04, 0.55, 0], null, 0.01);
      b.box(0.1, 0.12, 1.56, wd, [-1.04, 1.12, 0], null, 0.01);
      for (const s of [-1, 1]) b.box(0.12, 1.2, 0.12, wd, [-1.04, 0.6, s * 0.76], null, 0.01);
      b.box(0.08, 0.7, 1.5, wd, [1.04, 0.35, 0], null, 0.01);
      for (const s of [-1, 1]) b.box(0.12, 0.8, 0.12, wd, [1.04, 0.4, s * 0.76], null, 0.01);
      b.pop();
      S(-2, 0.1, 0.2, 1.8, 0, 0.8, true);
      // nightstand + lamp, picture
      b.box(0.45, 0.55, 0.45, wd, [-1.72, 0.28, 2.15], null, 0.01);
      b.box(0.38, 0.14, 0.02, K.mat(0x7a3a1a, 0.6), [-1.5, 0.38, 2.15], [0, PI / 2, 0], 0);
      b.lathe(
        [
          [0, 0],
          [0.08, 0],
          [0.06, 0.04],
          [0.02, 0.1],
          [0.02, 0.38],
          [0, 0.38]
        ],
        K.mat(0xc8a03a, 0.3, 0.8),
        [-1.72, 0.56, 2.15],
        12
      );
      b.add(new T.CylinderGeometry(0.1, 0.16, 0.2, 14, 1, true), K.mat(0x3a4ab8, 0.7, 0, {side: T.DoubleSide}), {
        p: [-1.72, 1.0, 2.15]
      });
      b.label(1.0, 0.62, pictureMat(i), [-1.98 + 0.017, 1.75, 1.0], [0, PI / 2, 0]);
      // CRT on a stand, table + chair by the window, wardrobe rail
      b.push([1.62, 0, -0.8]);
      b.box(0.6, 0.6, 0.5, wd, [0, 0.3, 0], null, 0.01);
      b.box(0.5, 0.02, 0.42, K.mat(0x3a2a1a, 0.6), [-0.02, 0.3, 0], null, 0);
      b.rbox(0.48, 0.42, 0.46, 0.03, K.veneer(0x6a3a1a, {tile: 0.3}), [0, 0.82, 0]);
      b.box(0.02, 0.32, 0.36, K.mat(0x1a2a2a, 0.15, 0.3), [-0.24, 0.84, 0], null, 0);
      b.cyl(0.004, 0.004, 0.3, chrome, [0.05, 1.15, 0.08], [0.4, 0, 0.3], 4);
      b.cyl(0.004, 0.004, 0.3, chrome, [0.05, 1.15, -0.08], [-0.4, 0, 0.3], 4);
      b.pop();
      S(1.3, 1.95, -1.1, -0.5, 0, 1.0, true);
      b.push([-1.0, 0, 3.2]);
      b.box(0.7, 0.04, 0.7, wd, [0, 0.74, 0], null, 0.01);
      for (const [x, z] of [
        [-0.3, -0.3],
        [0.3, -0.3],
        [-0.3, 0.3],
        [0.3, 0.3]
      ])
        b.box(0.05, 0.72, 0.05, wd, [x, 0.36, z], null, 0);
      b.rbox(0.22, 0.02, 0.3, 0.005, K.mat(0xf4f0e0, 0.6), [0.1, 0.77, 0], [0, 0.4, 0]);
      b.pop();
      b.push([-0.1, 0, 3.1], [0, -PI / 2 + 0.3, 0]);
      b.box(0.42, 0.04, 0.42, wd, [0, 0.46, 0], null, 0.01);
      for (const [x, z] of [
        [-0.18, -0.18],
        [0.18, -0.18],
        [-0.18, 0.18],
        [0.18, 0.18]
      ])
        b.box(0.04, 0.46, 0.04, wd, [x, 0.23, z], null, 0);
      for (const x of [-0.18, 0.18]) b.box(0.04, 0.5, 0.04, wd, [x, 0.73, -0.19], null, 0);
      for (let k = 0; k < 4; k++) b.box(0.025, 0.42, 0.02, wd, [-0.12 + k * 0.08, 0.72, -0.19], null, 0);
      b.box(0.42, 0.06, 0.03, wd, [0, 0.97, -0.19], null, 0.005);
      b.pop();
      b.cyl(0.015, 0.015, 1.0, chrome, [1.7, 1.8, 2.6], [PI / 2, 0, 0], 6);
      for (let k = 0; k < 3; k++) b.tor(0.12, 0.006, chrome, [1.7, 1.68, 2.25 + k * 0.3], [0, PI / 2, 0], PI, 8);
      // en-suite: claw-foot tub, toilet, vanity, mirror
      b.push([-0.95, 0, -3.48]);
      b.rbox(1.5, 0.5, 0.66, 0.15, por, [0, 0.42, 0]);
      b.rbox(1.36, 0.06, 0.52, 0.12, K.mat(0xc8d0d4, 0.15, 0.1), [0, 0.64, 0]);
      for (const [x, z] of [
        [-0.6, -0.24],
        [0.6, -0.24],
        [-0.6, 0.24],
        [0.6, 0.24]
      ])
        b.sph(0.06, K.mat(0xc8a03a, 0.3, 0.8), [x, 0.08, z]);
      b.cyl(0.015, 0.015, 0.25, chrome, [-0.7, 0.8, -0.28], null, 6);
      b.box(0.12, 0.04, 0.04, chrome, [-0.7, 0.9, -0.24], null, 0);
      b.pop();
      b.push([0.8, 0, -3.58]);
      b.lathe(
        [
          [0, 0],
          [0.18, 0],
          [0.2, 0.1],
          [0.22, 0.4],
          [0, 0.4]
        ],
        por,
        [0, 0, 0.12],
        18
      );
      b.rbox(0.4, 0.4, 0.2, 0.03, por, [0, 0.6, -0.12]);
      b.cyl(0.2, 0.2, 0.03, K.mat(0x1a1a1a, 0.4), [0, 0.42, 0.12], null, 18);
      b.cyl(0.05, 0.05, 0.11, K.mat(0xf4f4f0, 0.8), [0.35, 0.7, -0.3], [0, 0, PI / 2], 10);
      b.pop();
      b.push([1.66, 0, -2.5], [0, -PI / 2, 0]);
      b.box(0.8, 0.8, 0.5, wd, [0, 0.4, 0], null, 0.01);
      b.box(0.84, 0.04, 0.54, K.surf('stone', 0x6a6a68), [0, 0.82, 0], null, 0.01);
      b.cyl(0.16, 0.13, 0.06, por, [0, 0.82, 0], null, 14);
      b.tube(
        [
          [0, 0.86, -0.2],
          [0, 0.98, -0.2],
          [0, 0.96, -0.08]
        ],
        0.008,
        chrome,
        8,
        5
      );
      b.plane(0.6, 0.7, K.mat(0xd8e2e6, 0.03, 1), [0, 1.5, -0.23]);
      b.pop();
      b.pop();
    };
    ROOMS.forEach((r, i) => room(r, i));
    /* ---------- laundry (back-left corner) ---------- */
    b.box(10.7, 0.02, 7.7, surf('tile'), [-13.5, 0.035, -12], null, 0);
    b.box(10.7, 0.03, 7.7, surf('ceil'), [-13.5, CEIL + 0.01, -12], null, 0);
    lineWall(1, -8, -19, -8, -1, 0.3, [{k: 'd', c: -9.6}], wl, CEIL, base);
    lineWall(1, -16, -19, -8, 1, 0.3, [], wl, CEIL, base);
    lineWall(0, -19, -16, -8, 1, 0.3, [], wl, CEIL, base);
    lineWall(0, -8, -16, -8, -1, 0.16, [], wl, CEIL, base);
    const wht = K.mat(0xf2f2ee, 0.35, 0.2);
    for (let i = 0; i < 4; i++) {
      b.push([-18.6, 0, -14.6 + i * 0.8], [0, PI / 2, 0]);
      b.rbox(0.68, 0.92, 0.66, 0.02, wht, [0, 0.46, 0]);
      if (i < 2) {
        b.cyl(0.22, 0.22, 0.02, K.mat(0x2a2c2e, 0.1, 0.4), [0, 0.6, 0.335], [PI / 2, 0, 0], 20);
        b.tor(0.22, 0.02, chrome, [0, 0.6, 0.34], null, null, 20);
      } else {
        b.box(0.6, 0.02, 0.5, K.mat(0xe8e8e4, 0.3, 0.2), [0, 0.925, 0.05], null, 0);
      }
      b.rbox(0.68, 0.16, 0.12, 0.02, wht, [0, 1.0, -0.27]);
      b.box(0.3, 0.08, 0.02, K.mat(0x1a1a1a, 0.4), [0, 1.0, -0.2], null, 0);
      b.pop();
    }
    S(-19, -18.2, -15, -11.6, 0, 1.1);
    b.push([-13.5, 0, -15.4]);
    b.box(2.4, 0.05, 0.7, K.mat(0xd8d4c8, 0.5), [0, 0.85, 0], null, 0.01);
    for (const x of [-1.1, 1.1]) b.box(0.05, 0.82, 0.6, K.mat(0x8a8c8e, 0.4, 0.6), [x, 0.42, 0], null, 0);
    for (let k = 0; k < 5; k++)
      b.rbox(0.4, 0.08, 0.3, 0.02, K.mat([0xf4f4f0, 0xd8e8f4, 0xf4e8d8][k % 3], 0.9), [
        -0.8 + k * 0.4,
        0.92 + (k % 2) * 0.08,
        0
      ]);
    b.rbox(0.3, 0.4, 0.2, 0.03, K.mat(0xe8701a, 0.5), [0.9, 1.07, 0.1]);
    b.pop();
    S(-14.7, -12.3, -15.75, -15.05, 0, 0.9);
    b.push([-11.2, 0, -9.4]);
    b.rbox(0.9, 1.6, 0.8, 0.03, K.mat(0xc8ccd0, 0.4, 0.6), [0, 0.8, 0]);
    b.label(
      0.6,
      0.16,
      K.paint(
        'im_ice',
        256,
        64,
        (c, W, H) => {
          c.fillStyle = '#1a4ea8';
          c.fillRect(0, 0, W, H);
          P.text(c, 'ICE', W / 2, H / 2, {size: 44, col: '#fff'});
        },
        {glow: 0.3}
      ),
      [0, 1.3, 0.41]
    );
    b.box(0.5, 0.3, 0.02, K.mat(0x2a2c2e, 0.4, 0.5), [0, 0.7, 0.41], null, 0);
    b.pop();
    S(-11.65, -10.75, -9.8, -9.0, 0, 1.6);
    b.label(
      1.0,
      0.25,
      K.paint('im_laundry', 300, 76, (c, W, H) => {
        c.fillStyle = '#1a1a1a';
        c.fillRect(0, 0, W, H);
        P.text(c, 'GUEST LAUNDRY', W / 2, H / 2, {size: 30, col: '#fff'});
      }),
      [-9.6, 2.65, -7.82]
    );
    /* ---------- linen store (back-right corner) ---------- */
    b.box(10.7, 0.02, 7.7, K.surf('concrete', 0x8a8884), [13.5, 0.035, -12], null, 0);
    b.box(10.7, 0.03, 7.7, surf('ceil'), [13.5, CEIL + 0.01, -12], null, 0);
    lineWall(1, -8, 8, 19, -1, 0.3, [{k: 'd', c: 9.6}], wl, CEIL, base);
    lineWall(1, -16, 8, 19, 1, 0.3, [], wl, CEIL, base);
    lineWall(0, 19, -16, -8, -1, 0.3, [], wl, CEIL, base);
    lineWall(0, 8, -16, -8, 1, 0.16, [], wl, CEIL, base);
    for (let s = 0; s < 2; s++) {
      b.push([12 + s * 3.2, 0, -15.4]);
      for (const [x, z] of [
        [-1.2, -0.3],
        [1.2, -0.3],
        [-1.2, 0.3],
        [1.2, 0.3]
      ])
        b.box(0.05, 1.9, 0.05, K.mat(0x9a9ea2, 0.4, 0.6), [x, 0.95, z], null, 0);
      for (let k = 0; k < 4; k++) {
        b.box(2.5, 0.03, 0.65, K.mat(0x9a9ea2, 0.4, 0.6), [0, 0.2 + k * 0.55, 0], null, 0);
        for (let q = 0; q < 6; q++)
          b.rbox(0.36, 0.12 + (q % 2) * 0.06, 0.5, 0.04, K.mat([0xf4f4f0, 0xe8e8e0, 0xd8e4ec][q % 3], 0.9), [
            -1.0 + q * 0.4,
            0.29 + k * 0.55,
            0
          ]);
      }
      b.pop();
    }
    S(10.7, 16.5, -15.75, -15.05, 0, 1.9, true);
    b.push([17.8, 0, -11.5], [0, 0, -0.3]);
    b.rbox(0.25, 2.0, 1.4, 0.08, K.mat(0xe8e4d8, 0.9), [0, 1.0, 0]);
    b.pop();
    S(17.4, 18.6, -12.3, -10.7, 0, 2.0, true);
    b.push([12.2, 0, -10.6]);
    b.box(1.0, 0.05, 0.55, K.mat(0x3a3c40, 0.5, 0.5), [0, 0.4, 0], null, 0);
    b.box(1.0, 0.05, 0.55, K.mat(0x3a3c40, 0.5, 0.5), [0, 0.9, 0], null, 0);
    for (const [x, z] of [
      [-0.45, -0.22],
      [0.45, -0.22],
      [-0.45, 0.22],
      [0.45, 0.22]
    ])
      b.box(0.03, 0.95, 0.03, K.mat(0x3a3c40, 0.5, 0.5), [x, 0.48, z], null, 0);
    b.cyl(0.15, 0.15, 0.35, K.mat(0x1a4ea8, 0.5), [-0.25, 0.6, 0], null, 12);
    b.cyl(0.12, 0.1, 0.3, K.mat(0xe8c020, 0.5), [0.25, 0.58, 0], null, 12);
    b.box(0.4, 0.6, 0.02, K.mat(0x2a2a2c, 0.8), [0.55, 0.6, 0], null, 0);
    b.pop();
    S(11.65, 12.75, -10.9, -10.3, 0, 1.0, true);
    /* ---------- office ---------- */
    b.box(
      7.7,
      0.02,
      4.3,
      K.tri(
        'im_ofloor',
        (c, W, H, r) => {
          const n = 4,
            s = W / n;
          for (let i = 0; i < n; i++)
            for (let j = 0; j < n; j++) {
              c.fillStyle = (i + j) % 2 ? '#b8a888' : '#d8ccb0';
              c.fillRect(i * s, j * s, s, s);
            }
          P.grime(c, W, H, r, 0.4);
        },
        {tile: 0.6, r: 0.6}
      ),
      [15, 0.035, 6.3],
      null,
      0
    );
    b.box(7.7, 0.03, 4.3, surf('ceil'), [15, CEIL + 0.01, 6.3], null, 0);
    lineWall(
      1,
      8.6,
      11,
      19,
      -1,
      0.3,
      [
        {k: 'd', c: 13},
        {k: 'w', c: 15.4},
        {k: 'w', c: 17.4}
      ],
      K.veneer(0x7a5a3a, {tile: 0.6}),
      CEIL,
      base
    );
    lineWall(0, 11, 4, 8.6, 1, 0.3, [{k: 'd', c: 6.6}], K.veneer(0x7a5a3a, {tile: 0.6}), CEIL, base);
    lineWall(0, 19, 4, 8.6, -1, 0.3, [], K.veneer(0x7a5a3a, {tile: 0.6}), CEIL, base);
    lineWall(1, 4, 11, 19, 1, 0.16, [], K.veneer(0x7a5a3a, {tile: 0.6}), CEIL, base);
    b.box(1.4, 1.0, 0.06, K.veneer(0x5a3a22, {tile: 0.5}), [16.6, 1.7, 4.12], null, 0.01);
    for (let r2 = 0; r2 < 3; r2++)
      for (let k = 0; k < 4; k++) {
        const x = 16.1 + k * 0.33,
          y = 2.0 - r2 * 0.3;
        b.cyl(0.006, 0.006, 0.05, chrome, [x, y, 4.17], [PI / 2, 0, 0], 4);
        b.box(0.04, 0.08, 0.01, K.mat(0xc8a03a, 0.3, 0.8), [x, y - 0.07, 4.18], null, 0);
        b.box(0.05, 0.07, 0.008, K.mat([0xc41a1a, 0x2a6ad8, 0x2a8a3a][k % 3], 0.5), [x, y - 0.15, 4.18], null, 0);
      }
    b.label(
      1.2,
      0.3,
      K.paint('im_keys', 300, 76, (c, W, H) => {
        c.fillStyle = '#3a2a1a';
        c.fillRect(0, 0, W, H);
        P.text(c, 'ROOM KEYS', W / 2, H / 2, {size: 30, col: '#f4e0a8'});
      }),
      [16.6, 2.4, 4.15]
    );
    b.rbox(0.4, 0.06, 0.3, 0.01, K.mat(0x1a1a1a, 0.5), [14.2, 1.1, 6.2]);
    b.cyl(0.05, 0.06, 0.04, K.mat(0xc8a03a, 0.3, 0.9), [15.3, 1.08, 6.4], null, 12);
    b.add(K.sphGeo(0.05, 12, 6, 0, PI / 2), K.mat(0xc8a03a, 0.3, 0.9), {p: [15.3, 1.1, 6.4]});
    b.push([12.0, 0, 7.9]);
    b.box(0.6, 1.4, 0.3, K.mat(0x8a5a2a, 0.6), [0, 0.7, 0], null, 0.01);
    for (let k = 0; k < 12; k++)
      b.box(
        0.12,
        0.2,
        0.02,
        K.mat([0xe85a1a, 0x2a8ac8, 0xf2c418, 0x5ab83a][k % 4], 0.5),
        [-0.2 + (k % 4) * 0.13, 0.4 + Math.floor(k / 4) * 0.4, 0.16],
        [-0.2, 0, 0],
        0
      );
    b.pop();
    b.label(
      1.3,
      0.4,
      K.paint(
        'im_vac',
        300,
        92,
        (c, W, H) => {
          c.fillStyle = '#1a1a1a';
          c.fillRect(0, 0, W, H);
          c.font = "bold 30px 'MFZ Head'";
          c.textAlign = 'center';
          c.textBaseline = 'middle';
          c.shadowColor = '#ff3a5a';
          c.shadowBlur = 14;
          c.fillStyle = '#ff5a7a';
          c.fillText('NO', 60, H / 2);
          c.fillText('VACANCY', 190, H / 2);
        },
        {alpha: false, glow: 0.9}
      ),
      [17.4, 2.25, 8.5],
      [0, PI, 0]
    );
    b.label(
      1.2,
      0.3,
      K.paint(
        'im_office',
        300,
        76,
        (c, W, H) => {
          c.fillStyle = RED;
          c.fillRect(0, 0, W, H);
          P.text(c, 'OFFICE', W / 2, H / 2, {size: 44, col: '#fff'});
        },
        {glow: 0.3}
      ),
      [13, 2.75, 8.82]
    );
    /* ---------- pool deck, drained kidney pool, fence, loungers ---------- */
    const PX = -11.6,
      PZ = 10.1;
    const outline = off => {
      const pts = [];
      for (let i = 0; i <= 48; i++) {
        const t = (i / 48) * PI * 2;
        let x = Math.cos(t) * (3.4 + off),
          z = Math.sin(t) * (2.0 + off);
        if (z > 0) z -= 0.6 * Math.exp(-Math.pow(x / 1.4, 2));
        pts.push(new T.Vector2(x, -z));
      }
      return pts;
    };
    const shapeOf = (outer, holes) => {
      const s = new T.Shape(outer);
      for (const h of holes || []) s.holes.push(new T.Path(h.slice().reverse()));
      return s;
    };
    const flat = (shape, depth, mat, y) => {
      const g = new T.ExtrudeGeometry(shape, {depth, bevelEnabled: false, curveSegments: 8});
      b.add(g, mat, {p: [PX, y, PZ], r: [-PI / 2, 0, 0]});
    };
    const deckRect = [
      new T.Vector2(-19.35 - PX, -(5.05 - PZ)),
      new T.Vector2(-2.95 - PX, -(5.05 - PZ)),
      new T.Vector2(-2.95 - PX, -(15.25 - PZ)),
      new T.Vector2(-19.35 - PX, -(15.25 - PZ))
    ];
    flat(shapeOf(deckRect, [outline(0.35)]), 0.05, surf('deck'), DH - 0.03);
    flat(shapeOf(outline(0.35), [outline(0)]), 0.1, surf('coping'), DH - 0.02);
    flat(shapeOf(outline(0.06), [outline(0)]), DH - 0.02, surf('poolTile'), 0.02);
    flat(shapeOf(outline(0)), 0.02, surf('poolTile'), 0.02);
    b.label(
      3.0,
      1.6,
      K.paint(
        'im_puddle',
        256,
        128,
        (c, W, H, r) => {
          c.clearRect(0, 0, W, H);
          c.fillStyle = 'rgba(50,80,40,.75)';
          c.beginPath();
          for (let a = 0; a < PI * 2; a += 0.3)
            c.lineTo(W / 2 + Math.cos(a) * (100 + r() * 20), H / 2 + Math.sin(a) * (40 + r() * 14));
          c.fill();
          c.fillStyle = 'rgba(120,90,40,.8)';
          for (let i = 0; i < 30; i++) {
            c.beginPath();
            c.ellipse(r() * W, r() * H, 5, 3, r() * 3, 0, PI * 2);
            c.fill();
          }
        },
        {alpha: true}
      ),
      [PX - 1.2, 0.05, PZ + 0.3],
      [-PI / 2, 0, 0]
    );
    for (const s of [-0.25, 0.25])
      b.tube(
        [
          [PX + 2.6 + s, 0.1, PZ - 1.0],
          [PX + 2.6 + s, 0.9, PZ - 1.25],
          [PX + 2.6 + s, 1.0, PZ - 1.6],
          [PX + 2.6 + s, 0.6, PZ - 1.75]
        ],
        0.025,
        chrome,
        20,
        6
      );
    for (let k = 0; k < 3; k++) b.box(0.5, 0.03, 0.1, chrome, [PX + 2.6, 0.25 + k * 0.22, PZ - 1.12], null, 0);
    b.box(1.0, 0.12, 0.5, K.mat(0x2a6ad8, 0.4, 0.3), [PX + 2.2, 0.08, PZ - 0.4], null, 0.02);
    /* v093: you can get into the pool. The blocker over it is gone; the deck between the four deck slabs and the pool's kidney outline
       is now solid in 0.25 m rows (it was only drawn, so you would have dropped through it), and a tiled step under the ladder is the
       way out (deck 0.5 m: too high to step, the step halves it). */
    {
      const ring = outline(0).map(v => [PX + v.x, PZ - v.y]),
        inPool = (x, z) => {
          let n = false;
          for (let a = 0, c = ring.length - 1; a < ring.length; c = a++)
            if (
              ring[a][1] > z !== ring[c][1] > z &&
              x < ((ring[c][0] - ring[a][0]) * (z - ring[a][1])) / (ring[c][1] - ring[a][1]) + ring[a][0]
            )
              n = !n;
          return n;
        };
      for (let z = 7.6; z < 12.6 - 1e-6; z += 0.25) {
        let run = null;
        for (let x = -15.4; x < -7.8 - 1e-6; x += 0.2) {
          if (!inPool(x + 0.1, z + 0.125)) run = run ? [run[0], x + 0.2] : [x, x + 0.2];
          else if (run) {
            S(run[0], run[1], z, z + 0.25, 0, DH, true);
            run = null;
          }
        }
        if (run) S(run[0], Math.min(run[1], -7.8), z, z + 0.25, 0, DH, true);
      }
      b.box(0.8, 0.26, 0.6, surf('poolTile'), [PX + 2.6, 0.13, PZ - 1.0], null, 0.02);
      S(PX + 2.2, PX + 3.0, PZ - 1.3, PZ - 0.7, 0, 0.26, true);
    }
    // deck edges + loungers + umbrella + planter beds + hedges
    b.box(16.4, DH, 0.06, surf('coping'), [-11.15, DH / 2, 5.02], null, 0);
    b.box(0.06, DH, 10.2, surf('coping'), [-2.92, DH / 2, 10.15], null, 0);
    const lounger = (x, z, a) => {
      b.push([x, DH, z], [0, a, 0]);
      const bl = K.mat(0x2a6ad8, 0.5, 0.2);
      b.box(0.62, 0.06, 1.3, bl, [0, 0.32, 0.2], null, 0.01);
      b.box(0.62, 0.06, 0.7, bl, [0, 0.5, -0.65], [0.6, 0, 0], 0.01);
      for (const [px, pz] of [
        [-0.28, 0.75],
        [0.28, 0.75],
        [-0.28, -0.5],
        [0.28, -0.5]
      ])
        b.box(0.04, 0.32, 0.04, K.mat(0xd8d8d8, 0.4, 0.6), [px, 0.16, pz], null, 0);
      b.pop();
      S(x - 0.4, x + 0.4, z - 0.9, z + 0.9, DH, DH + 0.6, true);
    };
    lounger(-17.6, 13.4, 0.1);
    lounger(-16.4, 13.4, -0.15);
    lounger(-5.0, 7.0, PI / 2);
    b.push([-6.0, DH, 13.4]);
    b.cyl(0.03, 0.03, 2.3, K.mat(0xd8d8d8, 0.4, 0.6), [0, 1.15, 0], null, 8);
    b.add(
      new T.ConeGeometry(1.3, 0.5, 8, 1, true),
      K.tri(
        'im_umb',
        (c, W, H) => {
          for (let i = 0; i < 8; i++) {
            c.fillStyle = i % 2 ? '#f4f0e8' : '#c8261c';
            c.fillRect((i * W) / 8, 0, W / 8, H);
          }
        },
        {tile: 0.4, r: 0.8}
      ),
      {p: [0, 2.4, 0]}
    );
    b.cyl(0.4, 0.4, 0.04, K.mat(0xf4f4f0, 0.5), [0, 0.7, 0], null, 16);
    b.cyl(0.04, 0.04, 0.7, K.mat(0xd8d8d8, 0.4, 0.6), [0, 0.35, 0], null, 8);
    b.pop();
    S(-6.5, -5.5, 12.9, 13.9, DH, DH + 0.8, true);
    b.box(1.2, 0.08, 9.4, surf('gravel'), [-18.7, DH + 0.04, 10.1], null, 0);
    b.box(13, 0.08, 1.0, surf('gravel'), [-11.5, DH + 0.04, 5.7], null, 0);
    for (let x = -18.6; x < -4; x += 1.4) b.rbox(1.2, 0.8, 0.9, 0.25, surf('hedge'), [x, DH + 0.4, 5.5]);
    // chain-link fence on the lot side with a gate gap (steps up to the deck are core slabs)
    const ch = surf('chain'),
      post = K.mat(0x9a9ea2, 0.4, 0.7);
    const fence = (z0, z1) => {
      b.box(0.02, 1.4, z1 - z0, ch, [-2.6, DH + 0.7, (z0 + z1) / 2], null, 0);
      b.cyl(0.025, 0.025, z1 - z0, post, [-2.6, DH + 1.4, (z0 + z1) / 2], [PI / 2, 0, 0], 6);
      for (let z = z0; z <= z1 + 0.01; z += 1.6)
        b.cyl(0.035, 0.035, 1.5 + DH, post, [-2.6, (1.5 + DH) / 2, Math.min(z, z1)], null, 8);
      S(-2.65, -2.55, z0, z1, 0, DH + 1.4, true);
    };
    fence(5.0, 8.0);
    fence(9.6, 15.2);
    // v090: one solid step on the core step slab (x -2.95..-2.35, top DH / 2); the deck edge is the second. The old pair of
    // treads stood on the same spot, the upper one floating over the lower step (legs went through it)
    b.box(0.6, DH / 2, 1.6, surf('coping'), [-2.65, DH / 4, 8.8], null, 0.01);
    b.box(0.08, 0.04, 1.6, surf('coping'), [-2.99, DH + 0.012, 8.8], null, 0.005);
    b.label(
      0.5,
      0.6,
      K.paint('im_pool', 160, 200, (c, W, H) => {
        c.fillStyle = '#fff';
        c.fillRect(0, 0, W, H);
        c.fillStyle = '#1a4ea8';
        c.fillRect(0, 0, W, 50);
        P.text(c, 'POOL', W / 2, 25, {size: 34, col: '#fff'});
        ['NO LIFEGUARD', 'ON DUTY', 'SWIM AT OWN', 'RISK'].forEach((t, i) =>
          P.text(c, t, W / 2, 76 + i * 30, {size: 18, col: '#1a1a1a'})
        );
      }),
      [-2.58, DH + 1.0, 6.6],
      [0, PI / 2, 0]
    );
    /* ---------- perimeter brick walls + hedges behind the wings ---------- */
    const brk = surf('brick');
    const bwall = (x0, z0, x1, z1, h) => {
      const L = Math.hypot(x1 - x0, z1 - z0),
        a = Math.atan2(z1 - z0, x1 - x0);
      b.box(L, h, 0.3, brk, [(x0 + x1) / 2, h / 2, (z0 + z1) / 2], [0, -a, 0], 0);
      b.box(L + 0.08, 0.08, 0.4, K.surf('brick', 0x8a5a48), [(x0 + x1) / 2, h + 0.04, (z0 + z1) / 2], [0, -a, 0], 0.01);
      S(Math.min(x0, x1) - 0.15, Math.max(x0, x1) + 0.15, Math.min(z0, z1) - 0.15, Math.max(z0, z1) + 0.15, 0, h, true);
    };
    bwall(-19.75, -17.6, 19.75, -17.6, 2.2);
    bwall(-19.75, -17.6, -19.75, 15.3, 2.2);
    bwall(19.75, -17.6, 19.75, 8.6, 2.2);
    bwall(-19.75, 15.3, -2.6, 15.3, 2.0);
    for (let x = -18.8; x < 19; x += 1.5) b.rbox(1.3, 1.0, 0.8, 0.3, surf('hedge'), [x, 0.5, -16.8]);
    for (let z = -15; z < 4; z += 1.5) {
      b.rbox(0.6, 0.9, 1.3, 0.25, surf('hedge'), [-19.4, 0.45, z]);
    }
    for (let z = -15; z < 8; z += 1.5) b.rbox(0.5, 0.9, 1.3, 0.25, surf('hedge'), [19.35, 0.45, z]);
    /* ---------- courtyard tree, median tree, benches ---------- */
    const leaf = surf('leaves'),
      bark = K.surf('bark', 0x5a4a3a);
    const tree = (x, z, s) => {
      if (!LOTTREES.some(q => q[0] === x && q[1] === z)) LOTTREES.push([x, z, s]);
    }; /* v074: real flora trees, planted per instance (bldTree) */
    tree(6.5, 4.5, 1.1);
    tree(7.0, 14.6, 1.0);
    tree(-6.0, 1.0, 0.8);
    for (const [x, z, a] of [
      [-3.0, -3.5, PI / 2],
      [3.0, 0.5, -PI / 2]
    ]) {
      b.push([x, 0, z], [0, a, 0]);
      const w2 = K.mat(0x2a1a14, 0.7);
      for (let i = 0; i < 3; i++) b.box(1.6, 0.05, 0.12, w2, [0, 0.46, -0.15 + i * 0.15], null, 0.01);
      b.box(1.6, 0.35, 0.05, w2, [0, 0.75, -0.25], null, 0.01);
      for (const s of [-1, 1]) b.box(0.06, 0.45, 0.5, K.mat(0x1a1a1a, 0.5, 0.5), [s * 0.72, 0.23, 0], null, 0.01);
      b.pop();
      S(x - 0.3, x + 0.3, z - 0.85, z + 0.85, 0, 0.9, true);
    }
    /* ---------- the INN-AND-OUT sun sign ---------- */
    b.push([17.0, 0, 14.6]);
    b.cyl(0.5, 0.6, 0.5, K.surf('concrete', 0x8a8a86), [0, 0.25, 0], null, 14);
    b.cyl(0.2, 0.24, 7.6, K.mat(0xb8b8b4, 0.6, 0.2), [0, 4.0, 0], null, 12);
    S(16.5, 17.5, 14.1, 15.1, 0, 7, true);
    const star = [];
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * PI * 2,
        rr = i % 2 ? 1.3 : 1.75;
      star.push([Math.cos(a) * rr, Math.sin(a) * rr]);
    }
    b.add(K.extrudeGeo(star, 0.3, 0.03), K.mat(0xe8b020, 0.4, 0.3), {p: [0, 8.4, 0]});
    for (const sd of [1, -1])
      b.label(
        2.5,
        2.5,
        K.paint(
          'im_sun',
          512,
          512,
          (c, W, H, r) => {
            c.clearRect(0, 0, W, H);
            const g = c.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, W * 0.36);
            g.addColorStop(0, '#ffe27a');
            g.addColorStop(1, '#e8a018');
            c.fillStyle = g;
            c.beginPath();
            c.arc(W / 2, H / 2, W * 0.36, 0, PI * 2);
            c.fill();
            c.strokeStyle = '#b87a10';
            c.lineWidth = 10;
            c.stroke();
            c.save();
            c.translate(W / 2, H * 0.3);
            c.rotate(-0.08);
            c.font = "italic bold 78px 'MFZ Type'";
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            c.fillStyle = '#c8261c';
            c.fillText('Inn-and-Out', 0, 0);
            c.restore();
            P.grime(c, W, H, r, 0.35);
            c.fillStyle = 'rgba(120,70,20,.4)';
            for (let i = 0; i < 20; i++)
              c.fillRect(W * 0.2 + r() * W * 0.6, H * 0.55 + r() * H * 0.3, 2, 10 + r() * 30);
          },
          {alpha: true, glow: 0.35, r: 0.5}
        ),
        [0, 8.4, sd * 0.18],
        [0, sd > 0 ? 0 : PI, 0]
      );
    b.push([0.2, 7.95, 0], [0, 0, 0.1]);
    b.rbox(3.6, 1.0, 0.45, 0.15, K.mat(0xb81a1a, 0.4, 0.2), [0, 0, 0]);
    b.rbox(3.7, 1.08, 0.38, 0.15, K.mat(0xd8d8d4, 0.4, 0.4), [0, 0, 0]);
    for (const sd of [1, -1]) {
      b.label(
        3.3,
        0.8,
        K.paint(
          'im_motel',
          768,
          186,
          (c, W, H) => {
            c.fillStyle = '#b81a1a';
            c.fillRect(0, 0, W, H);
            c.strokeStyle = '#f4e8c8';
            c.lineWidth = 8;
            c.strokeRect(10, 10, W - 20, H - 20);
            P.text(c, 'MOTEL', W / 2, H / 2 + 4, {size: 140, col: '#f4f0e4', ls: 16, stroke: '#5a0a0a', lw: 6});
          },
          {glow: 0.5, r: 0.4}
        ),
        [0, 0, sd * 0.231],
        [0, sd > 0 ? 0 : PI, 0]
      );
      for (let k = 0; k < 12; k++)
        b.sph(
          0.04,
          K.mat(0xfff4d0, 0.3, 0, {emissive: 0xffe0a0, emissiveIntensity: 1.0}),
          [-1.6 + k * 0.29, 0.5, sd * 0.23],
          null,
          8
        );
    }
    b.pop();
    b.push([1.1, 7.2, 0], [0, 0, 0.1]);
    b.rbox(1.9, 0.36, 0.3, 0.08, K.mat(0xe8b020, 0.4, 0.3), [0, 0, 0]);
    for (const sd of [1, -1])
      b.label(
        1.8,
        0.3,
        K.paint(
          'im_novac',
          384,
          64,
          (c, W, H) => {
            c.fillStyle = '#e8b020';
            c.fillRect(0, 0, W, H);
            P.text(c, 'NO VACANCY', W / 2, H / 2, {size: 42, col: '#7a1a0a'});
          },
          {glow: 0.35}
        ),
        [0, 0, sd * 0.155],
        [0, sd > 0 ? 0 : PI, 0]
      );
    b.pop();
    b.pop();
    /* ---------- sidewalk furniture ---------- */
    const lm = K.mat(0xb8bcc0, 0.35, 0.7);
    const lightPole = x => {
      b.push([x, 0, 17.55]);
      b.rbox(0.45, 0.6, 0.45, 0.04, lm, [0, 0.3, 0]);
      b.cyl(0.09, 0.14, 8.6, lm, [0, 4.3, 0], null, 12);
      b.tube(
        [
          [0, 8.3, 0],
          [0, 8.8, -0.6],
          [0, 8.8, -2.0]
        ],
        0.05,
        lm,
        12,
        6
      );
      b.rbox(0.4, 0.14, 0.7, 0.05, lm, [0, 8.75, -2.2]);
      b.box(
        0.3,
        0.02,
        0.5,
        K.mat(0xffffff, 0.4, 0, {emissive: 0xfff2d0, emissiveIntensity: 0.8}),
        [0, 8.67, -2.2],
        null,
        0
      );
      b.pop();
      S(x - 0.23, x + 0.23, 17.32, 17.78, 0, 8.6, true);
    };
    lightPole(-15);
    lightPole(4);
    b.push([19.2, 0, 17.6]);
    b.cyl(0.12, 0.16, 6.0, lm, [0, 3.0, 0], null, 12);
    b.cyl(0.08, 0.08, 3.6, lm, [-1.8, 5.8, 0], [0, 0, PI / 2], 10);
    for (const [x, y] of [
      [-3.2, 5.2],
      [0, 3.0]
    ]) {
      b.push([x, y, 0], [0, PI, 0]);
      b.rbox(0.36, 1.0, 0.3, 0.04, K.mat(0xe8c020, 0.5), [0, 0, 0]);
      for (let k = 0; k < 3; k++)
        b.cyl(
          0.11,
          0.11,
          0.02,
          K.mat([0x5a1010, 0x5a4a10, 0x105a20][k], 0.3, 0, {
            emissive: k === 2 ? 0x2aff5a : 0x000000,
            emissiveIntensity: 0.8
          }),
          [0, 0.3 - k * 0.3, 0.16],
          [PI / 2, 0, 0],
          14
        );
      b.pop();
    }
    b.pop();
    S(19.0, 19.4, 17.4, 17.8, 0, 6, true);
    b.push([10, 0, 17.5]);
    const hy = K.mat(0xc8261c, 0.45, 0.3);
    b.cyl(0.13, 0.15, 0.6, hy, [0, 0.32, 0], null, 16);
    b.add(K.sphGeo(0.14, 14, 8, 0, PI / 2), hy, {p: [0, 0.62, 0]});
    b.cyl(0.07, 0.07, 0.1, K.mat(0x1a4ea8, 0.4), [0, 0.42, 0.17], [PI / 2, 0, 0], 10);
    for (const s of [-1, 1]) b.cyl(0.05, 0.05, 0.12, hy, [s * 0.17, 0.42, 0], [0, 0, PI / 2], 10);
    b.cyl(0.2, 0.2, 0.05, hy, [0, 0.04, 0], null, 16);
    b.pop();
    S(9.8, 10.2, 17.3, 17.7, 0, 0.8, true);
    b.push([4.5, 0, 14.6]);
    b.cyl(0.03, 0.03, 2.3, K.mat(0x8a8c8e, 0.4, 0.6), [0, 1.15, 0], null, 8);
    b.label(
      0.35,
      0.5,
      K.paint('im_nopark', 140, 200, (c, W, H) => {
        c.fillStyle = '#fff';
        c.fillRect(0, 0, W, H);
        c.strokeStyle = '#c41a1a';
        c.lineWidth = 5;
        c.strokeRect(5, 5, W - 10, H - 10);
        P.text(c, 'NO', W / 2, 40, {size: 36, col: '#c41a1a'});
        P.text(c, 'PARKING', W / 2, 84, {size: 26, col: '#c41a1a'});
        P.text(c, 'GUESTS', W / 2, 126, {size: 24, col: '#c41a1a'});
        P.text(c, 'ONLY', W / 2, 160, {size: 24, col: '#c41a1a'});
      }),
      [0, 2.0, 0.035]
    );
    b.pop();
    // v090: the two parked cars are real models now (placed in the lot builder)
    CACHE = {M: b.done(), cols, occ};
    return CACHE;
  }

  /* ===================== the builder ===================== */
  function bInnAndOut(x, z, t) {
    const B = mk(x, z, 40, 36, H, 0xb8c454, 0x3a5a3e, 0xe8e8e4);
    B.dx = 0;
    const PT = {th: 0.16, c: 0xa8927a};
    const ops = (list, sg) =>
      list.flatMap(c => [
        {k: 'd', c: c + sg * 1.1},
        {k: 'w', c: c - sg * 0.9}
      ]);
    WL(B, 0, -11, -8, 4, ops([-6, -2, 2], -1), H);
    WL(B, 0, -19, -16, 4, [], H);
    WL(B, 1, 4, -19, -11, [], H);
    for (const zz of [-4, 0]) WL(B, 1, zz, -19, -11, [], H, PT);
    WL(B, 1, -8, -19, -11, [], H, PT);
    for (const c of [-6, -2, 2]) WL(B, 0, -16.6, c - 2, c + 2, [{k: 'g', c: c + 1.1}], H, PT);
    WL(B, 1, -8, -11, -8, [{k: 'd', c: -9.6}], H);
    WL(B, 0, -8, -16, -8, [], H, PT);
    WL(B, 1, -8, -8, 8, ops([-6, -2, 2, 6], 1), H);
    WL(B, 1, -16, -19, 19, [], H);
    for (const xx of [-4, 0, 4]) WL(B, 0, xx, -16, -8, [], H, PT);
    WL(B, 0, 8, -16, -8, [], H, PT);
    for (const c of [-6, -2, 2, 6]) WL(B, 1, -13.6, c - 2, c + 2, [{k: 'g', c: c - 1.1}], H, PT);
    WL(B, 1, -8, 8, 11, [{k: 'd', c: 9.6}], H);
    WL(B, 1, -8, 11, 19, [], H, PT);
    WL(B, 0, 11, -8, 4, ops([-6, -2, 2], 1), H);
    WL(B, 0, 19, -16, 8.6, [], H);
    for (const zz of [-4, 0]) WL(B, 1, zz, 11, 19, [], H, PT);
    WL(B, 1, 4, 11, 19, [], H, PT);
    for (const c of [-6, -2, 2]) WL(B, 0, 16.6, c - 2, c + 2, [{k: 'g', c: c - 1.1}], H, PT);
    WL(
      B,
      1,
      8.6,
      11,
      19,
      [
        {k: 'd', c: 13},
        {k: 'w', c: 15.4},
        {k: 'w', c: 17.4}
      ],
      H
    );
    WL(B, 0, 11, 4, 8.6, [{k: 'd', c: 6.6}], H);
    // pool deck (walkable) + two steps up from the lot
    const cd = 0xa8a69e;
    slab(B, -19.35, -2.95, 5.05, 7.6, 0, DH, cd, true);
    slab(B, -19.35, -2.95, 12.6, 15.25, 0, DH, cd, true);
    slab(B, -19.35, -15.4, 7.6, 12.6, 0, DH, cd, true);
    slab(B, -7.8, -2.95, 7.6, 12.6, 0, DH, cd, true);
    slab(B, -2.95, -2.35, 8.0, 9.6, 0, DH / 2, cd, true);
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
    /* v091: water in the kidney pool (same outline as the pool tiles: centre -11.6, 10.1). Intact: clear and full; looted: green and
       lower; ruined: a stagnant layer over the leaves on the bottom. */
    if (B.occ) B.occ.push([-15.4, -7.8, 7.6, 12.6]); // v093: the pool is no longer a solid block, so tell the ground cover to keep out of it
    if (window.MFZWATER) {
      const lv = (typeof CUR !== 'undefined' && CUR && CUR.lv) || 0,
        poly = [];
      for (let i = 0; i < 40; i++) {
        const a = (i / 40) * PI * 2,
          px = Math.cos(a) * 3.41;
        let pz = Math.sin(a) * 2.01;
        if (pz > 0) pz -= 0.6 * Math.exp(-Math.pow(px / 1.4, 2));
        poly.push([-11.6 + px, 10.1 + pz]);
      }
      MFZWATER.add({
        kind: lv ? 'green' : 'pool',
        parent: B.g,
        shape: 'poly',
        poly,
        cell: 0.4,
        y: lv > 1 ? 0.12 : lv ? 0.3 : 0.4,
        bed: lv > 1 ? 0.3 : lv ? 1.1 : 1.3, // v093: deeper (how deep it looks) ...
        sink: lv > 1 ? 0.25 : lv ? 0.8 : 0.9, // ... and how far you sink into it: chest deep when full
        vis: lv ? 0.4 : 1.0
      });
    }
    B.g.updateMatrixWorld(true);
    for (const c of C.cols) {
      const a = new THREE.Vector3(c[0], c[1], c[2]).applyMatrix4(B.g.matrixWorld),
        e = new THREE.Vector3(c[3], c[4], c[5]).applyMatrix4(B.g.matrixWorld);
      solids.push(new THREE.Box3(a.clone().min(e), a.clone().max(e)));
    }
    for (const o of C.occ) B.occ.push(o);
    // v090: real vehicle models (vehicles.js) instead of the hand-built ones
    window.LOTKIT.vehicle(B, 'sedan', 5.6, 11.4, 0, {tint: [0.16, 0.23, 0.42]});
    window.LOTKIT.vehicle(B, 'universal', 15.7, 11.4, PI, {tint: [0.42, 0.35, 0.23], dust: true});

    for (const [tx, tz, ts] of LOTTREES)
      try {
        bldTree(B, tx, tz, ts * 0.85);
      } catch (e) {}
    const ry = a => (B.cs > 0 ? a : a + PI),
      SP = (lx, lz, name, table, a, y0) => {
        try {
          if (window.spawnPropContainer) spawnPropContainer(WX(B, lx), WZ(B, lz), name, table, ry(a), y0 || 0);
          else cont(B, table || 'motel', lx, lz);
        } catch (e) {}
      };
    // each room: a lootable dresser against the right wall (facing into the room); a trunk in some
    ROOMS.forEach((r, i) => {
      const [px, pz] = toPlot(r, 1.66, 1.4);
      SP(px, pz, 'dresser', 'motel', r[2] - PI / 2);
      if (i % 3 === 1) {
        const [tx, tz] = toPlot(r, 0.6, -0.3);
        SP(tx, tz, 'trunk_leather', 'motel', r[2] + PI);
      }
    });
    SP(-16.2, -9.0, 'vending_polar', 'motel', 0);
    SP(-14.4, -9.0, 'washing_machine', 'laundromat', 0);
    SP(15, 6.2, 'reception_counter', 'motel', PI);
    SP(13.5, -9.0, 'cardboard_box_medium', 'motel', PI);
    SP(14.4, -9.0, 'cardboard_box_medium', 'motel', PI);
    buildings.push({x: WX(B, 0), z: WZ(B, -4), w: 38, d: 25, t: t.id});
    for (const [px, pz] of [
      [-15, -2],
      [-2, -12],
      [6, -12],
      [15, 2],
      [0, 3],
      [-11, 10],
      [8, 10]
    ].slice(0, ri(3, 6)))
      zombie(WX(B, px), WZ(B, pz));
    LASTB = B;
    return B;
  }

  if (typeof ruin === 'function') {
    const _r = ruin;
    ruin = function (x, z, t, lv) {
      if (t && t.id === 'sunshine_motel' && lv > 1) {
        arguments[3] = 1;
      }
      return _r.apply(this, arguments);
    };
  }
  const e = NEWCAT.find(d => d.id === 'sunshine_motel');
  if (e) {
    e.name = 'Inn-and-Out Motel';
    e.build = bInnAndOut;
    e.note = 'full-block courtyard motel: 10 rooms, office, laundry, linen store, pool, parking, sun sign';
  }
  if (typeof NOYARD !== 'undefined') NOYARD.add('sunshine_motel');
  window.bInnAndOut = bInnAndOut;
  window.INNANDOUT = {build};
  console.log('[motel] Inn-and-Out ready');
})();
