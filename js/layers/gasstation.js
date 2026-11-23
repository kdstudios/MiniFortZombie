/* ==========================================================================================================
   MINI FORT ZOMBIE - NUT & BOLT GAS STATION (v072): a full-block filling station (40 x 36 m plot, front = +Z), our own design.
   Exterior: convenience store with a one-bay service centre (roller shutter half up), green panel walls on a block plinth under a white
   fascia with blue pinstripes, a 20 x 10 m pump canopy (green / blue banded fascia, ribbed soffit, recessed lights) over three islands
   with six double-sided pumps, a price pylon on the corner, two propane tanks, an ice merchandiser, A-frame coffee sign, air / water
   machine, parking stalls, a pair of wrecks behind jersey barriers, a plumber's van at the pumps, a bus shelter, mailbox, hydrant,
   no-parking sign and double-arm street lights on the sidewalk.
   Interior: beige tile floor, sage tile wainscot with a blue band under grey walls, drop ceiling with fluorescent troffers, checkout
   counter with cigarette back-bar, coolers, gondolas, soda fountain + slush machine + coffee and hot-dog roller, a wire dump-bin of
   footballs, posters; restroom; service bay with a stripped sedan on jack stands (hood up, wheels off), tyre stacks, workbench and
   pegboard, tool chest, wall shelving, oil drums, compressor.
   Structure from core WL (doors / windows work), detail is our own geometry and painted artwork (prop kit), outside the static merge.
   ========================================================================================================== */
(function () {
  'use strict';
  const K = window.MFZK;
  if (!K || typeof WL !== 'function' || typeof NEWCAT === 'undefined') {
    console.warn('[gasstation] core / prop kit missing');
    return;
  }
  const T = THREE,
    P = K.P,
    PI = Math.PI;
  const XS0 = -18,
    XS1 = 2,
    ZS0 = -16,
    ZS1 = -4,
    H = 4.0,
    CEIL = 3.1,
    XBAY = -10; // store shell; bay is x<XBAY
  const GRN = '#1f8a3e',
    GRN2 = '#2fae55',
    BLU = '#1a4e9a',
    WHT = '#f2f2ee',
    YEL = '#ffd23a';

  /* ===================== artwork ===================== */
  function drawNut(c, x, y, r, col, hole) {
    c.save();
    c.fillStyle = col;
    c.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i * PI) / 3 + PI / 6;
      c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    c.closePath();
    c.fill();
    c.globalCompositeOperation = 'destination-out';
    c.beginPath();
    c.arc(x, y, r * 0.45, 0, PI * 2);
    c.fill();
    c.restore();
    if (hole) {
      c.fillStyle = hole;
      c.beginPath();
      c.arc(x, y, r * 0.45, 0, PI * 2);
      c.fill();
    }
  }
  // the logo: NUT [hex nut] BOLT with a blue swoosh under it
  function drawLogo(c, cx, cy, h, o) {
    o = o || {};
    c.save();
    c.translate(cx, cy);
    const f = h;
    c.font = `italic bold ${f}px 'MFZ Head'`;
    c.textBaseline = 'middle';
    const w1 = c.measureText('NUT').width,
      w2 = c.measureText('BOLT').width,
      nr = f * 0.42,
      gap = f * 0.1,
      W = w1 + w2 + nr * 2 + gap * 2,
      x0 = -W / 2;
    c.lineJoin = 'round';
    c.lineWidth = f * 0.16;
    c.strokeStyle = o.edge || '#fff';
    c.strokeText('NUT', x0, 0);
    c.strokeText('BOLT', x0 + w1 + nr * 2 + gap * 2, 0);
    c.fillStyle = o.col || GRN;
    c.fillText('NUT', x0, 0);
    c.fillText('BOLT', x0 + w1 + nr * 2 + gap * 2, 0);
    drawNut(c, x0 + w1 + gap + nr, f * 0.02, nr + f * 0.06, o.edge || '#fff');
    drawNut(c, x0 + w1 + gap + nr, f * 0.02, nr, o.col || GRN);
    c.fillStyle = o.col || GRN;
    c.font = `bold ${f * 0.36}px 'MFZ Head'`;
    c.textAlign = 'center';
    c.fillText('&', x0 + w1 + gap + nr, f * 0.04);
    c.strokeStyle = o.swoosh || BLU;
    c.lineWidth = f * 0.09;
    c.beginPath();
    c.moveTo(x0 + f * 0.1, f * 0.62);
    c.quadraticCurveTo(0, f * 0.9, x0 + W - f * 0.05, f * 0.5);
    c.stroke();
    c.restore();
  }
  const logoMat = (key, w, h, o) =>
    K.paint(
      key,
      w,
      h,
      (c, W, H) => {
        c.clearRect(0, 0, W, H);
        drawLogo(c, W / 2, H * 0.45, H * 0.55, o);
      },
      {alpha: true, r: 0.4, glow: o && o.glow}
    );
  const fasciaTex = (key, kind) =>
    K.paint(
      key,
      1024,
      128,
      (c, W, H, r) => {
        c.fillStyle = WHT;
        c.fillRect(0, 0, W, H);
        c.fillStyle = BLU;
        c.fillRect(0, 0, W, 11);
        c.fillRect(0, H - 11, W, 11);
        if (kind === 'canopy') {
          c.fillStyle = GRN;
          c.fillRect(0, 26, W, 30);
          c.fillRect(0, 68, W, 30);
          c.fillStyle = GRN2;
          c.fillRect(0, 26, W, 6);
          c.fillRect(0, 68, W, 6);
        } else {
          c.fillStyle = BLU;
          c.fillRect(0, H - 22, W, 4);
        }
        P.grime(c, W, H, r, 0.35);
        P.noise(c, W, H, r, 900, 0.12, '#3a3a2a', 2);
      },
      {r: 0.45, m: 0.15}
    );

  const SURF = {};
  const surf = k =>
    SURF[k] ||
    (SURF[k] = {
      panel: () =>
        K.tri(
          'nb_panel',
          (c, W, H, r) => {
            const n = 4,
              s = W / n;
            for (let i = 0; i < n; i++) {
              const g = c.createLinearGradient(i * s, 0, i * s + s, 0);
              g.addColorStop(0, '#1e7a3a');
              g.addColorStop(0.5, '#2a9a4a');
              g.addColorStop(1, '#1c7034');
              c.fillStyle = g;
              c.fillRect(i * s, 0, s, H);
              c.fillStyle = 'rgba(0,0,0,.4)';
              c.fillRect(i * s, 0, 3, H);
              c.fillStyle = 'rgba(255,255,255,.2)';
              c.fillRect(i * s + 3, 0, 2, H);
            }
            P.grime(c, W, H, r, 0.5);
            for (let i = 0; i < 30; i++) {
              c.fillStyle = 'rgba(40,30,20,.12)';
              c.fillRect(r() * W, H * 0.6 + r() * H * 0.4, 2 + r() * 3, 10 + r() * 60);
            }
          },
          {tile: 0.42, r: 0.45, m: 0.2}
        ),
      block: () =>
        K.tri(
          'nb_block',
          (c, W, H, r) => {
            c.fillStyle = '#6a6a66';
            c.fillRect(0, 0, W, H);
            const bw = W / 2,
              bh = H / 4;
            for (let j = 0; j < 4; j++)
              for (let i = -1; i < 3; i++) {
                const x = i * bw + ((j % 2) * bw) / 2;
                c.fillStyle = `hsl(40,4%,${62 + r() * 10}%)`;
                c.fillRect(x + 3, j * bh + 3, bw - 6, bh - 6);
              }
            P.noise(c, W, H, r, 5000, 0.3, '#3a3a36', 1.5);
            P.grime(c, W, H, r, 0.6);
          },
          {tile: 0.6, r: 0.9}
        ),
      floor: () =>
        K.tri(
          'nb_floor',
          (c, W, H, r) => {
            const n = 4,
              s = W / n;
            c.fillStyle = '#8a7a66';
            c.fillRect(0, 0, W, H);
            for (let i = 0; i < n; i++)
              for (let j = 0; j < n; j++) {
                const l = 74 + r() * 6;
                c.fillStyle = `hsl(34,${30 + r() * 6}%,${l}%)`;
                c.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
              }
            P.noise(c, W, H, r, 6000, 0.12, '#5a4a3a', 1.6);
            P.scratches(c, W, H, r, 30, 'rgba(90,70,50,.25)');
          },
          {tile: 0.42, r: 0.35}
        ),
      wains: () =>
        K.tri(
          'nb_wains',
          (c, W, H, r) => {
            const n = 4,
              s = W / n;
            c.fillStyle = '#7a7c6a';
            c.fillRect(0, 0, W, H);
            for (let i = 0; i < n; i++)
              for (let j = 0; j < n; j++) {
                c.fillStyle = `hsl(${60 + r() * 10},${10 + r() * 5}%,${58 + r() * 6}%)`;
                c.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
              }
            P.grime(c, W, H, r, 0.35);
          },
          {tile: 1.0, r: 0.3}
        ),
      paint: () =>
        K.tri(
          'nb_wall',
          (c, W, H, r) => {
            c.fillStyle = '#a8acb0';
            c.fillRect(0, 0, W, H);
            P.noise(c, W, H, r, 6000, 0.1, '#5a5e62', 2);
            P.grime(c, W, H, r, 0.3);
          },
          {tile: 0.5, r: 0.85}
        ),
      white: () =>
        K.tri(
          'nb_wtile',
          (c, W, H, r) => {
            const n = 6,
              s = W / n;
            c.fillStyle = '#9a9c98';
            c.fillRect(0, 0, W, H);
            for (let i = 0; i < n; i++)
              for (let j = 0; j < n; j++) {
                c.fillStyle = '#ecece6';
                c.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
              }
            P.grime(c, W, H, r, 0.3);
          },
          {tile: 0.7, r: 0.2}
        ),
      ceil: () =>
        K.tri(
          'nb_ceil',
          (c, W, H, r) => {
            c.fillStyle = '#d8d8d2';
            c.fillRect(0, 0, W, H);
            P.noise(c, W, H, r, 9000, 0.16, '#7a7a74', 1.3);
            c.fillStyle = '#8a8478';
            c.fillRect(0, 0, W, 5);
            c.fillRect(0, 0, 5, H);
            c.fillRect(0, H / 2, W, 3);
            c.fillRect(W / 2, 0, 3, H);
          },
          {tile: 0.84, r: 0.9}
        ),
      bayfloor: () =>
        K.tri(
          'nb_bayf',
          (c, W, H, r) => {
            c.fillStyle = '#4a4c4e';
            c.fillRect(0, 0, W, H);
            P.noise(c, W, H, r, 12000, 0.35, '#2a2a2a', 2);
            for (let i = 0; i < 6; i++) {
              const g = c.createRadialGradient(r() * W, r() * H, 2, r() * W, r() * H, 30 + r() * 70);
              g.addColorStop(0, 'rgba(10,8,6,.55)');
              g.addColorStop(1, 'rgba(10,8,6,0)');
              c.fillStyle = g;
              c.fillRect(0, 0, W, H);
            }
            c.strokeStyle = 'rgba(20,20,20,.5)';
            c.lineWidth = 2;
            c.strokeRect(0, 0, W, H);
          },
          {tile: 0.33, r: 0.5}
        ),
      asphalt: () => K.surf('asphalt', 0x3c3e42),
      concrete: () => K.surf('concrete', 0xb0aea6),
      soffit: () =>
        K.tri(
          'nb_soffit',
          (c, W, H, r) => {
            for (let y = 0; y < H; y += 16) {
              const g = c.createLinearGradient(0, y, 0, y + 16);
              g.addColorStop(0, '#5a5e62');
              g.addColorStop(0.5, '#c8ccd0');
              g.addColorStop(1, '#4a4e52');
              c.fillStyle = g;
              c.fillRect(0, y, W, 16);
            }
            P.grime(c, W, H, r, 0.4);
          },
          {tile: 0.5, r: 0.5, m: 0.5}
        ),
      jersey: () => K.surf('concrete', 0xc0bcb0),
      tank: () =>
        K.paint(
          'nb_tank',
          1024,
          512,
          (c, W, H, r) => {
            c.fillStyle = '#ecece8';
            c.fillRect(0, 0, W, H);
            P.grime(c, W, H, r, 0.5);
            for (let i = 0; i < 40; i++) {
              c.fillStyle = 'rgba(120,80,40,.12)';
              c.fillRect(r() * W, r() * H, 2, 20 + r() * 60);
            }
            c.save();
            c.translate(W * 0.25, H * 0.5);
            c.rotate(PI / 2);
            c.scale(-1, 1);
            drawLogo(c, 0, 0, 90, {});
            c.font = "bold 30px 'MFZ Head'";
            c.fillStyle = BLU;
            c.textAlign = 'center';
            c.fillText('PROPANE', 0, 95);
            c.restore();
            c.save();
            c.translate(W * 0.75, H * 0.5);
            c.rotate(PI / 2);
            c.scale(-1, 1);
            drawLogo(c, 0, 0, 90, {});
            c.font = "bold 30px 'MFZ Head'";
            c.fillStyle = BLU;
            c.textAlign = 'center';
            c.fillText('PROPANE', 0, 95);
            c.restore();
          },
          {r: 0.35, m: 0.25}
        ),
      leaves: () =>
        K.tri(
          'nb_leaf',
          (c, W, H, r) => {
            c.fillStyle = '#2e4a1e';
            c.fillRect(0, 0, W, H);
            for (let i = 0; i < 900; i++) {
              c.fillStyle = `hsl(${80 + r() * 30},${35 + r() * 25}%,${18 + r() * 22}%)`;
              c.beginPath();
              c.ellipse(r() * W, r() * H, 4 + r() * 7, 2 + r() * 4, r() * PI, 0, PI * 2);
              c.fill();
            }
          },
          {tile: 0.8, r: 0.8}
        )
    }[k]());

  /* ===================== vehicles (our own) ===================== */
  function sedan(b, S, x, z, ry, col, o) {
    o = o || {};
    b.push([x, o.lift || 0, z], [0, ry, 0]);
    const paint = o.burnt ? K.surf('rust', 0x2a2230, {m: 0.2}) : K.mat(col, 0.32, 0.35),
      dark = K.mat(0x141416, 0.6),
      glass = o.broken ? K.mat(0x0a0a0c, 0.9) : K.mat(0x1e2a34, 0.08, 0.6),
      chrome = K.chrome(),
      tyre = K.rubber();
    const prof = [
      [2.25, 0.32],
      [2.28, 0.62],
      [2.15, 0.8],
      [1.05, 0.9],
      [-1.55, 0.92],
      [-2.15, 0.9],
      [-2.27, 0.64],
      [-2.25, 0.32]
    ];
    b.add(K.extrudeGeo(prof, 1.74, 0.04), paint, {r: [0, PI / 2, 0]}); // lower body
    b.add(
      K.extrudeGeo(
        [
          [1.0, 0.9],
          [0.32, 1.32],
          [-0.9, 1.34],
          [-1.55, 0.93]
        ],
        1.5,
        0.02
      ),
      glass,
      {r: [0, PI / 2, 0]}
    ); // greenhouse
    b.add(
      K.extrudeGeo(
        [
          [0.3, 1.32],
          [-0.88, 1.35],
          [-0.9, 1.37],
          [0.28, 1.345]
        ],
        1.46,
        0.02
      ),
      paint,
      {r: [0, PI / 2, 0]}
    ); // roof skin
    for (const s of [-1, 1]) {
      b.add(
        K.extrudeGeo(
          [
            [1.0, 0.9],
            [0.32, 1.33],
            [0.24, 1.33],
            [0.9, 0.9]
          ],
          0.06,
          0
        ),
        paint,
        {p: [s * 0.74, 0, 0], r: [0, PI / 2, 0]}
      );
      b.add(
        K.extrudeGeo(
          [
            [-1.55, 0.93],
            [-0.9, 1.34],
            [-0.8, 1.34],
            [-1.4, 0.93]
          ],
          0.06,
          0
        ),
        paint,
        {p: [s * 0.74, 0, 0], r: [0, PI / 2, 0]}
      );
      b.box(0.06, 0.44, 0.06, paint, [s * 0.74, 1.12, -0.2], [0.0, 0, 0], 0);
      b.box(0.02, 0.03, 0.9, dark, [s * 0.88, 0.62, 0.6], null, 0);
      b.box(0.02, 0.03, 0.9, dark, [s * 0.88, 0.62, -0.5], null, 0);
      b.box(0.03, 0.05, 0.14, chrome, [s * 0.885, 0.78, 0.15], null, 0);
      b.box(0.03, 0.05, 0.14, chrome, [s * 0.885, 0.78, -0.85], null, 0);
    }
    b.box(1.76, 0.18, 0.14, K.mat(0x1a1a1c, 0.6), [0, 0.42, 2.27], null, 0.04);
    b.box(1.76, 0.18, 0.14, K.mat(0x1a1a1c, 0.6), [0, 0.42, -2.27], null, 0.04); // bumpers
    for (const s of [-1, 1]) {
      b.box(0.42, 0.13, 0.04, K.mat(0xf4f0e0, 0.2, 0.3, {emissive: 0x000000}), [s * 0.6, 0.68, 2.29], null, 0.01);
      b.box(0.38, 0.14, 0.04, K.mat(0xb01818, 0.3, 0.1), [s * 0.62, 0.72, -2.28], null, 0.01);
      b.box(0.14, 0.1, 0.04, K.mat(0xe88a20, 0.3), [s * 0.32, 0.7, -2.28], null, 0.01);
    }
    b.box(0.6, 0.12, 0.02, K.mat(0x2a2a2c, 0.5), [0, 0.62, 2.3], null, 0);
    b.label(
      0.36,
      0.18,
      K.paint('nb_plate', 128, 64, (c, W, H) => {
        c.fillStyle = '#f4f2e8';
        c.fillRect(0, 0, W, H);
        c.strokeStyle = '#1a3a6a';
        c.lineWidth = 4;
        c.strokeRect(2, 2, W - 4, H - 4);
        P.text(c, 'NB-0451', W / 2, H * 0.55, {size: 24, col: '#1a3a6a', font: "'MFZ Mono'"});
      }),
      [0, 0.5, -2.345],
      [0, PI, 0]
    );
    if (o.broken) {
      b.box(1.5, 0.4, 2.0, K.mat(0x2a1a14, 0.9), [0, 0.95, -0.3], null, 0);
    } // gutted interior seen through the empty frames
    const wheel = (wx, wz) => {
      b.cyl(0.33, 0.33, 0.22, tyre, [wx, 0.33, wz], [0, 0, PI / 2], 18);
      b.cyl(0.2, 0.2, 0.23, K.mat(0xb8bcc0, 0.3, 0.8), [wx, 0.33, wz], [0, 0, PI / 2], 14);
    };
    for (const [wx, wz] of [
      [-0.78, 1.38],
      [0.78, 1.38],
      [-0.78, -1.35],
      [0.78, -1.35]
    ]) {
      if (o.noWheels) {
        b.cyl(0.06, 0.06, 0.3, K.mat(0x5a5a5a, 0.5, 0.7), [wx * 0.9, 0.32, wz], [0, 0, PI / 2], 8);
        b.box(
          0.18,
          0.32 + (o.lift || 0),
          0.18,
          K.mat(0xc8261c, 0.5, 0.4),
          [wx * 0.88, (0.32 - (o.lift || 0)) / 2, wz],
          null,
          0.01
        );
      } else if (!(o.missing && o.missing.includes(wx + ',' + wz))) wheel(wx, wz);
      b.add(new T.CylinderGeometry(0.38, 0.38, 0.12, 16, 1, true, 0, PI), dark, {
        p: [wx * 1.0, 0.33, wz],
        r: [0, 0, PI / 2]
      });
    }
    if (o.hood) {
      b.push([0, 0.9, 1.05], [-1.0, 0, 0]);
      b.box(1.6, 0.04, 1.12, paint, [0, 0, 0.56], null, 0.02);
      b.pop();
      b.box(1.5, 0.35, 0.9, K.mat(0x3a3a3c, 0.5, 0.6), [0, 0.7, 1.6], null, 0.02);
      b.cyl(0.12, 0.12, 0.4, K.mat(0x8a8c8e, 0.4, 0.8), [0.4, 0.82, 1.6], [PI / 2, 0, 0], 12);
    } else b.box(1.64, 0.03, 1.1, paint, [0, 0.905, 1.6], [-0.08, 0, 0], 0);
    b.pop();
    const sw = Math.abs(Math.sin(ry)) > 0.5;
    S(x - (sw ? 2.3 : 0.95), x + (sw ? 2.3 : 0.95), z - (sw ? 0.95 : 2.3), z + (sw ? 0.95 : 2.3), 0, 1.4, true);
  }
  function van(b, S, x, z, ry) {
    b.push([x, 0, z], [0, ry, 0]);
    const wht = K.mat(0xf0f0ec, 0.35, 0.25),
      glass = K.mat(0x1e2a34, 0.08, 0.6),
      tyre = K.rubber(),
      dark = K.mat(0x141416, 0.6);
    b.rbox(2.0, 1.9, 3.9, 0.12, wht, [0, 1.35, -0.75]);
    b.add(
      K.extrudeGeo(
        [
          [2.6, 0.35],
          [2.62, 0.95],
          [2.3, 1.25],
          [1.75, 2.25],
          [1.15, 2.3],
          [1.15, 0.35]
        ],
        1.98,
        0.05
      ),
      wht,
      {r: [0, PI / 2, 0]}
    );
    b.add(
      K.extrudeGeo(
        [
          [2.28, 1.28],
          [1.76, 2.2],
          [1.62, 2.2],
          [2.14, 1.28]
        ],
        1.86,
        0.0
      ),
      glass,
      {r: [0, PI / 2, 0], p: [0, 0.0, 0.0]}
    );
    for (const s of [-1, 1]) b.box(0.02, 0.55, 0.75, glass, [s * 1.0, 1.75, 1.55], null, 0);
    for (const s of [-1, 1]) {
      b.label(
        3.6,
        0.5,
        K.paint(
          'nb_van',
          1024,
          140,
          (c, W, H) => {
            c.clearRect(0, 0, W, H);
            c.fillStyle = '#c8261c';
            c.fillRect(0, 40, W, 24);
            P.text(c, 'PIPEWORKS', W * 0.3, H * 0.36, {
              size: 52,
              col: '#c8261c',
              font: "'MFZ Head'",
              stroke: '#fff',
              lw: 6
            });
            P.text(c, 'PLUMBING & DRAINS  -  555-0187', W * 0.68, H * 0.78, {size: 30, col: '#1a1a1a'});
          },
          {alpha: true, r: 0.4}
        ),
        [s * 1.006, 1.3, -0.6],
        [0, (s * PI) / 2, 0]
      );
    }
    b.box(2.05, 0.22, 0.16, K.mat(0x2a2a2c, 0.6), [0, 0.45, 2.62], null, 0.04);
    b.box(2.05, 0.22, 0.16, K.mat(0x2a2a2c, 0.6), [0, 0.45, -2.75], null, 0.04);
    for (const s of [-1, 1]) {
      b.box(0.3, 0.2, 0.04, K.mat(0xf4f0e0, 0.2, 0.3), [s * 0.7, 0.8, 2.64], null, 0.01);
      b.box(0.14, 0.4, 0.04, K.mat(0xb01818, 0.3), [s * 0.88, 1.0, -2.72], null, 0.01);
    }
    b.box(0.02, 1.5, 0.02, dark, [0, 1.3, -2.71], null, 0);
    for (const [wx, wz] of [
      [-0.88, 1.8],
      [0.88, 1.8],
      [-0.88, -1.7],
      [0.88, -1.7]
    ]) {
      b.cyl(0.36, 0.36, 0.24, tyre, [wx, 0.36, wz], [0, 0, PI / 2], 18);
      b.cyl(0.2, 0.2, 0.25, K.mat(0xd8dadc, 0.3, 0.6), [wx, 0.36, wz], [0, 0, PI / 2], 12);
    }
    b.pop();
    S(x - 1.1, x + 1.1, z - 2.8, z + 2.7, 0, 2.3, true);
  }

  /* ===================== the geometry (built once, in building-local coordinates) ===================== */
  let CACHE = null;
  function build() {
    if (CACHE) return CACHE;
    const b = K.builder('nutbolt'),
      cols = [],
      occ = [];
    const S = (x0, x1, z0, z1, y0, y1, noOcc) => {
      cols.push([Math.min(x0, x1), y0, Math.min(z0, z1), Math.max(x0, x1), y1, Math.max(z0, z1)]);
      if (!noOcc) occ.push([Math.min(x0, x1), Math.max(x0, x1), Math.min(z0, z1), Math.max(z0, z1)]);
    };
    const chrome = K.chrome(),
      blk = K.blackPlastic(),
      st = K.steelBrushed(),
      rnd = b.rnd;
    const yel = K.mat(0xf2c418, 0.6),
      wline = K.mat(0xeeeee4, 0.7),
      conc = surf('concrete');
    /* ---------- ground ---------- */
    b.box(40, 0.025, 33.9, surf('asphalt'), [0, 0.012, -1.05], null, 0);
    b.box(40, 0.05, 2.1, conc, [0, 0.03, 16.95], null, 0);
    for (let x = -19.5; x < 20; x += 1.5) b.box(0.02, 0.052, 2.08, K.mat(0x8a8880, 0.8), [x, 0.031, 16.95], null, 0);
    b.box(40, 0.16, 0.18, conc, [0, 0.08, 15.9], null, 0);
    b.box(20.4, 0.1, 1.8, conc, [-8, 0.05, -3.1], null, 0);
    b.box(20.4, 0.12, 0.12, conc, [-8, 0.06, -2.22], null, 0); // store apron + curb
    for (let i = 0; i < 4; i++) {
      const x = -9.2 + i * 2.5;
      b.box(0.1, 0.012, 4.6, wline, [x, 0.03, 0.3], null, 0);
    }
    b.box(0.1, 0.012, 4.6, wline, [0.8, 0.03, 0.3], null, 0);
    for (let i = 0; i < 3; i++)
      b.box(1.6, 0.12, 0.2, K.surf('concrete', 0x9a9890), [-7.95 + i * 2.5, 0.06, -1.9], null, 0.03);
    // oil stains, cracks, a storm drain
    b.label(
      1.2,
      1.2,
      K.paint(
        'nb_stain',
        128,
        128,
        (c, W, H, r) => {
          c.clearRect(0, 0, W, H);
          const g = c.createRadialGradient(64, 64, 4, 64, 64, 60);
          g.addColorStop(0, 'rgba(8,6,4,.6)');
          g.addColorStop(1, 'rgba(8,6,4,0)');
          c.fillStyle = g;
          c.fillRect(0, 0, W, H);
        },
        {alpha: true}
      ),
      [5.8, 0.03, 6],
      [-PI / 2, 0, 0]
    );
    for (const [x, z] of [
      [12.2, 4],
      [-6.6, 0.6],
      [8, -10],
      [-14, 3]
    ])
      b.label(
        1.4,
        1.4,
        K.paint('nb_stain', 128, 128, () => {}, {alpha: true}),
        [x, 0.029, z],
        [-PI / 2, 0, rnd() * 3]
      );
    b.label(
      6,
      6,
      K.paint(
        'nb_crack',
        256,
        256,
        (c, W, H, r) => {
          c.clearRect(0, 0, W, H);
          c.strokeStyle = 'rgba(15,15,15,.7)';
          for (let k = 0; k < 5; k++) {
            c.lineWidth = 1 + r() * 2;
            c.beginPath();
            let x = r() * W,
              y = r() * H;
            c.moveTo(x, y);
            for (let q = 0; q < 10; q++) {
              x += (r() - 0.5) * 50;
              y += (r() - 0.5) * 50;
              c.lineTo(x, y);
            }
            c.stroke();
          }
        },
        {alpha: true}
      ),
      [-4, 0.031, 10],
      [-PI / 2, 0, 0]
    );
    b.box(0.9, 0.02, 0.5, K.mat(0x2a2a2a, 0.5, 0.6), [-1, 0.03, 13.5], null, 0);
    for (let i = 0; i < 7; i++)
      b.box(0.04, 0.022, 0.46, K.mat(0x111111, 0.6), [-1.36 + i * 0.12, 0.032, 13.5], null, 0);
    /* ---------- store: exterior skin ---------- */
    const pan = surf('panel'),
      blck = surf('block'),
      fasc = fasciaTex('nb_fascia', 'store');
    const skin = (ax, f, a0, a1, n, ops) => {
      ops = (ops || []).slice().sort((p, q) => p.c - q.c);
      const th = 0.3;
      const pc = (u0, u1, y0, y1, mat, dep, off) => {
        if (u1 - u0 < 0.04 || y1 - y0 < 0.02) return;
        const o = f + n * (th / 2 + off),
          u = (u0 + u1) / 2,
          y = (y0 + y1) / 2;
        if (ax) b.box(u1 - u0, y1 - y0, dep, mat, [u, y, o], null, 0);
        else b.box(dep, y1 - y0, u1 - u0, mat, [o, y, u], null, 0);
      };
      const span = (u0, u1, y0, y1) => {
        if (y0 < 0.6) pc(u0, u1, y0, Math.min(0.6, y1), blck, 0.06, 0.03);
        if (y0 <= 0.6 && y1 > 0.6) pc(u0, u1, 0.58, 0.66, K.mat(0x8a8a86, 0.8), 0.1, 0.05);
        if (y1 > 0.6) pc(u0, u1, Math.max(0.6, y0), Math.min(2.95, y1), pan, 0.03, 0.015);
      };
      let a = a0;
      for (const p of ops) {
        const hw = p.k === 'w' ? 0.75 : p.k === 'g' ? 0.8 : 0.65;
        span(a, p.c - hw, 0, 3);
        if (p.k === 'w') {
          span(p.c - hw, p.c + hw, 0, 0.9);
          span(p.c - hw, p.c + hw, 2.75, 3);
        } else if (p.k === 'd') span(p.c - hw, p.c + hw, 2.4, 3);
        else span(p.c - hw, p.c + hw, 2.5, 3);
        a = p.c + hw;
      }
      span(a, a1, 0, 3);
      // fascia band + parapet
      const L = a1 - a0,
        u = (a0 + a1) / 2,
        o = f + n * (0.15 + 0.14);
      if (ax) b.box(L + 0.56, 1.5, 0.28, fasc, [u, 3.65, o], null, 0);
      else b.box(0.28, 1.5, L + 0.56, fasc, [o, 3.65, u], null, 0);
    };
    const Wn = a => a.map(c => ({k: 'w', c})),
      Dr = a => a.map(c => ({k: 'd', c}));
    const FRONT = [{k: 'g', c: -15.4}, {k: 'g', c: -13.8}, ...Wn([-8.6, -6.9, -5.2, -3.5, 0.5]), {k: 'd', c: -1.5}];
    skin(1, ZS1, XS0, XS1, 1, FRONT);
    skin(1, ZS0, XS0, XS1, -1, Dr([-4]));
    skin(0, XS0, ZS0, ZS1, -1, Wn([-10]));
    skin(0, XS1, ZS0, ZS1, 1, Wn([-8]));
    b.box(20.6, 0.12, 12.6, K.surf('concrete', 0x5a5a58), [-8, H + 0.06, -10], null, 0);
    b.box(20.5, 0.02, 12.5, K.mat(0x3a3a3c, 0.9), [-8, H + 0.13, -10], null, 0); // roof deck + membrane
    // signs on the fascia
    b.label(6.4, 1.2, logoMat('nb_logo_store', 1024, 192, {}), [-6.5, 3.62, ZS1 + 0.44]);
    b.label(4.2, 0.8, logoMat('nb_logo_side', 768, 144, {}), [XS1 + 0.44, 3.62, -10], [0, PI / 2, 0]);
    b.rbox(4.4, 0.75, 0.12, 0.03, K.mat(0x3a3e44, 0.4, 0.3), [-14.6, 3.6, ZS1 + 0.5]);
    b.frame(4.4, 0.75, 0.04, K.mat(0xc8ccd0, 0.3, 0.8), [-14.6, 3.6, ZS1 + 0.56], 0.01);
    b.label(
      4.2,
      0.6,
      K.paint(
        'nb_svc',
        768,
        110,
        (c, W, H) => {
          c.clearRect(0, 0, W, H);
          P.text(c, 'Service Center', W / 2, H / 2, {size: 70, col: '#e8eaec', font: "'MFZ Head'"});
        },
        {alpha: true, glow: 0.3}
      ),
      [-14.6, 3.6, ZS1 + 0.58]
    );
    // roller shutter, half up over the bay opening (rolled drum in its hood + slats down to 2.5 m)
    b.rbox(3.6, 0.5, 0.5, 0.06, K.mat(0x8a8e92, 0.4, 0.6), [-14.6, 2.98, ZS1 + 0.38]);
    for (let i = 0; i < 5; i++)
      b.box(3.3, 0.1, 0.03, K.surf('rollshutter', 0x9a9ea2, {m: 0.5}), [-14.6, 2.55 + i * 0.08, ZS1 + 0.2], null, 0);
    b.box(3.3, 0.06, 0.05, K.mat(0x3a3a3c, 0.4, 0.7), [-14.6, 2.53, ZS1 + 0.2], null, 0);
    for (const s of [-1, 1])
      b.box(0.08, 2.6, 0.12, K.mat(0x6a6e72, 0.4, 0.7), [-14.6 + s * 1.68, 1.3, ZS1 + 0.2], null, 0);
    // rooftop: HVAC, vent stacks, a satellite dish
    b.rbox(1.8, 1.0, 1.3, 0.03, K.mat(0xb8bcc0, 0.4, 0.7), [-12, H + 0.65, -11]);
    b.vents(6, 1.6, 0.7, K.mat(0x6a6c6e, 0.5, 0.6), [-12, H + 0.65, -10.34]);
    b.cyl(0.5, 0.5, 0.1, K.mat(0x2a2a2a, 0.5, 0.4), [-12, H + 1.2, -11], null, 20);
    b.rbox(1.2, 0.7, 1.0, 0.03, K.mat(0xa8acb0, 0.4, 0.7), [-3, H + 0.5, -12.5]);
    for (const [x, z] of [
      [-6, -7],
      [-15, -14],
      [0, -8]
    ])
      b.cyl(0.07, 0.07, 0.7, K.mat(0x7a7c7e, 0.4, 0.7), [x, H + 0.45, z], null, 10);
    b.push([-1, H + 0.15, -14.5], [0, -0.6, 0]);
    b.cyl(0.03, 0.03, 0.6, K.mat(0x8a8c8e, 0.4, 0.7), [0, 0.3, 0], null, 8);
    b.add(K.sphGeo(0.4, 18, 8, 0, PI * 0.3), K.mat(0xd8d8d4, 0.5), {p: [0, 0.75, 0.1], r: [-1.1, 0, 0]});
    b.pop();
    /* ---------- store interior: floor, linings, ceiling, lights ---------- */
    b.box(11.7, 0.02, 11.7, surf('floor'), [-4, 0.035, -10], null, 0);
    b.box(7.7, 0.02, 11.7, surf('bayfloor'), [-14, 0.035, -10], null, 0);
    b.box(19.7, 0.04, 11.7, surf('ceil'), [-8, CEIL + 0.02, -10], null, 0);
    const wai = surf('wains'),
      pnt = surf('paint'),
      wt = surf('white'),
      bandM = K.mat(0x1a4e9a, 0.45),
      bayW = K.mat(0x7a7e82, 0.85);
    const lineWall = (ax, f, a0, a1, n, th, style, ops) => {
      ops = (ops || []).slice().sort((p, q) => p.c - q.c);
      const pc = (u0, u1, y0, y1, mat, dep, off) => {
        if (u1 - u0 < 0.04 || y1 - y0 < 0.02) return;
        const o = f + n * (th / 2 + off),
          u = (u0 + u1) / 2,
          y = (y0 + y1) / 2;
        if (ax) b.box(u1 - u0, y1 - y0, dep, mat, [u, y, o], null, 0);
        else b.box(dep, y1 - y0, u1 - u0, mat, [o, y, u], null, 0);
      };
      const span = (u0, u1, y0, y1) => {
        if (style === 'rest') {
          pc(u0, u1, y0, y1, wt, 0.02, 0.01);
          return;
        }
        const lo = style === 'bay' ? 1.25 : 1.1,
          top = style === 'bay' ? bayW : pnt;
        if (y0 < lo) pc(u0, u1, y0, Math.min(lo, y1), wai, 0.02, 0.01);
        if (y1 > lo) pc(u0, u1, Math.max(lo, y0), y1, top, 0.012, 0.006);
        if (style === 'shop') {
          if (y0 <= 2.25 && y1 >= 2.36) pc(u0, u1, 2.25, 2.36, bandM, 0.02, 0.012);
          if (y0 <= 2.42 && y1 >= 2.45) pc(u0, u1, 2.42, 2.45, bandM, 0.02, 0.012);
          if (y0 <= 1.1 && y1 >= 1.14) pc(u0, u1, 1.1, 1.14, K.mat(0x6a6e5a, 0.4), 0.03, 0.016);
        }
      };
      let a = a0;
      for (const p of ops) {
        const hw = p.k === 'w' ? 0.75 : p.k === 'g' ? 0.8 : 0.65;
        span(a, p.c - hw, 0, CEIL);
        if (p.k === 'w') {
          span(p.c - hw, p.c + hw, 0, 0.9);
          span(p.c - hw, p.c + hw, 2.75, CEIL);
        } else span(p.c - hw, p.c + hw, p.k === 'g' ? 2.5 : 2.4, CEIL);
        a = p.c + hw;
      }
      span(a, a1, 0, CEIL);
    };
    lineWall(1, ZS1, XBAY, XS1, -1, 0.3, 'shop', [...Wn([-8.6, -6.9, -5.2, -3.5, 0.5]), {k: 'd', c: -1.5}]);
    lineWall(0, XS1, ZS0, ZS1, -1, 0.3, 'shop', Wn([-8]));
    lineWall(1, ZS0, XBAY, -2, 1, 0.3, 'shop', Dr([-4]));
    lineWall(0, XBAY, ZS0, ZS1, 1, 0.16, 'shop', Dr([-13.5]));
    lineWall(0, -2, ZS0, -12.6, -1, 0.16, 'shop', Dr([-13.6]));
    lineWall(1, -12.6, -2, XS1, 1, 0.16, 'shop');
    lineWall(1, ZS1, XS0, XBAY, -1, 0.3, 'bay', [
      {k: 'g', c: -15.4},
      {k: 'g', c: -13.8}
    ]);
    lineWall(0, XS0, ZS0, ZS1, 1, 0.3, 'bay', Wn([-10]));
    lineWall(1, ZS0, XS0, XBAY, 1, 0.3, 'bay');
    lineWall(0, XBAY, ZS0, ZS1, -1, 0.16, 'bay', Dr([-13.5]));
    lineWall(1, ZS0, -2, XS1, 1, 0.3, 'rest');
    lineWall(0, XS1, ZS0, -12.6, -1, 0.3, 'rest');
    lineWall(0, -2, ZS0, -12.6, 1, 0.16, 'rest', Dr([-13.6]));
    lineWall(1, -12.6, -2, XS1, -1, 0.16, 'rest');
    const lit = K.mat(0xffffff, 0.4, 0, {emissive: 0xf4f8ff, emissiveIntensity: 0.95}),
      hous = K.mat(0xd8d8d4, 0.5, 0.2);
    for (const [x, z] of [
      [-7.5, -6.2],
      [-3.5, -6.2],
      [0.2, -7],
      [-7.5, -10.5],
      [-3.5, -10.5],
      [-7.5, -14],
      [-4.2, -14.6]
    ]) {
      b.box(1.25, 0.06, 0.62, hous, [x, CEIL - 0.03, z], null, 0.01);
      b.box(1.15, 0.012, 0.52, lit, [x, CEIL - 0.065, z], null, 0);
      for (let i = -1; i <= 1; i += 2) b.box(1.15, 0.01, 0.012, hous, [x, CEIL - 0.07, z + i * 0.13], null, 0);
    }
    for (const z of [-6.5, -10, -13.5]) {
      b.box(0.12, 0.1, 2.4, hous, [-14, CEIL - 0.3, z], null, 0.01);
      b.box(0.08, 0.02, 2.3, lit, [-14, CEIL - 0.36, z], null, 0);
      for (const e of [-1, 1]) b.cyl(0.004, 0.004, 0.25, blk, [-14, CEIL - 0.13, z + e * 1.0], null, 4);
    }
    /* ---------- shop: checkout counter + back bar ---------- */
    const slat = K.tri(
      'nb_slat',
      (c, W, H, r) => {
        const n = 10,
          s = W / n;
        for (let i = 0; i < n; i++) {
          const g = c.createLinearGradient(i * s, 0, i * s + s, 0);
          g.addColorStop(0, '#6a5034');
          g.addColorStop(0.3, '#a88a62');
          g.addColorStop(0.8, '#b8966a');
          g.addColorStop(1, '#5a4028');
          c.fillStyle = g;
          c.fillRect(i * s, 0, s, H);
        }
        P.grime(c, W, H, r, 0.4);
      },
      {tile: 0.5, r: 0.6}
    );
    const lam = K.veneer(0xb08a5a, {tile: 0.8});
    b.box(0.7, 1.0, 4.4, slat, [-0.2, 0.5, -7.4], null, 0.01);
    b.rbox(0.86, 0.05, 4.5, 0.01, lam, [-0.25, 1.02, -7.4]);
    b.box(2.0, 1.0, 0.7, slat, [0.85, 0.5, -9.95], null, 0.01);
    b.rbox(2.1, 0.05, 0.86, 0.01, lam, [0.85, 1.02, -9.95]);
    b.box(0.04, 0.08, 4.4, K.mat(0x2a2a2a, 0.5), [-0.57, 0.04, -7.4], null, 0);
    S(-0.6, 0.2, -9.6, -5.2, 0, 1.05);
    S(-0.2, 1.9, -10.35, -9.55, 0, 1.05);
    // till paraphernalia: lottery stand, gum rack, a scratch-card fan, impulse jars, newspaper
    b.rbox(0.3, 0.35, 0.25, 0.01, K.mat(0x1a4e9a, 0.4), [-0.35, 1.22, -6.0]);
    b.label(
      0.28,
      0.2,
      K.paint('nb_lotto', 128, 96, (c, W, H) => {
        c.fillStyle = YEL;
        c.fillRect(0, 0, W, H);
        P.text(c, 'LOTTO', W / 2, 30, {size: 30, col: '#c8261c'});
        P.text(c, '$1M', W / 2, 70, {size: 30, col: '#1a1a1a'});
      }),
      [-0.35, 1.25, -5.87],
      [0, 0, 0]
    );
    for (let i = 0; i < 4; i++)
      b.rbox(
        0.3,
        0.04,
        0.12,
        0.005,
        K.mat([0xc8261c, 0x1a8a3a, 0xf2c418, 0x2a6ad0][i], 0.5),
        [-0.4, 1.08 + i * 0.06, -8.2 + i * 0.01],
        [-0.3, 0, 0]
      );
    for (let i = 0; i < 3; i++) {
      b.cyl(0.07, 0.07, 0.18, K.glass(0xffffff, 0.4), [-0.45, 1.14, -8.9 + i * 0.17], null, 12);
      b.cyl(
        0.072,
        0.072,
        0.03,
        K.mat([0xc8261c, 0x1a8a3a, 0xf2c418][i], 0.4),
        [-0.45, 1.245, -8.9 + i * 0.17],
        null,
        12
      );
    }
    b.box(
      0.4,
      0.02,
      0.3,
      K.paint('nb_news', 256, 192, (c, W, H, r) => {
        c.fillStyle = '#e8e4d8';
        c.fillRect(0, 0, W, H);
        P.text(c, 'THE DAILY HERALD', W / 2, 20, {size: 22, col: '#111'});
        P.text(c, 'OUTBREAK SPREADS', W / 2, 58, {size: 28, col: '#111'});
        c.fillStyle = '#999';
        for (let i = 0; i < 8; i++) c.fillRect(10, 82 + i * 12, W - 20, 4);
      }),
      [-0.2, 1.055, -6.9],
      [0, 0.2, 0],
      0
    );
    // back bar on the right wall: cigarette gantry + small TV + lighters
    b.push([1.72, 0, -7.4], [0, -PI / 2, 0]);
    b.rbox(3.4, 1.0, 0.5, 0.01, K.mat(0x3a2a1e, 0.5), [0, 0.5, 0]);
    b.rbox(3.4, 1.1, 0.25, 0.01, K.mat(0x2a2a2c, 0.5), [0, 1.95, -0.12]);
    b.label(
      3.3,
      1.0,
      K.paint(
        'nb_cigs',
        1024,
        300,
        (c, W, H, r) => {
          c.fillStyle = '#1a1a1c';
          c.fillRect(0, 0, W, H);
          const cols = ['#c8261c', '#f4f2ee', '#1a5ac8', '#e8b020', '#1a8a3a', '#7a2a8a', '#2a2a2a'];
          for (let j = 0; j < 5; j++)
            for (let i = 0; i < 26; i++) {
              const x = 6 + i * 39,
                y = 6 + j * 58;
              c.fillStyle = cols[(i * 3 + j * 5) % 7];
              c.fillRect(x, y, 34, 50);
              c.fillStyle = 'rgba(255,255,255,.75)';
              c.fillRect(x + 3, y + 30, 28, 9);
              c.fillStyle = 'rgba(0,0,0,.25)';
              c.fillRect(x + 30, y, 4, 50);
            }
        },
        {r: 0.4}
      ),
      [0, 1.95, 0.012]
    );
    b.rbox(0.6, 0.4, 0.32, 0.02, K.mat(0x1a1a1c, 0.4), [1.1, 2.75, 0]);
    b.label(
      0.5,
      0.3,
      K.paint(
        'nb_tv',
        160,
        96,
        (c, W, H, r) => {
          c.fillStyle = '#08101a';
          c.fillRect(0, 0, W, H);
          c.fillStyle = '#c8261c';
          c.fillRect(0, H - 22, W, 22);
          P.text(c, 'EMERGENCY BROADCAST', W / 2, H - 11, {size: 12, col: '#fff'});
          P.text(c, 'STAY INDOORS', W / 2, 40, {size: 20, col: '#e8e8e8'});
        },
        {glow: 0.7}
      ),
      [1.1, 2.75, 0.165]
    );
    b.pop();
    S(1.4, 1.95, -9.1, -5.7, 0, 2.6);
    /* ---------- shop: soda fountain, slush machine, coffee + hot-dog roller along the partition ---------- */
    b.push([XBAY + 0.45, 0, -7.0], [0, PI / 2, 0]);
    b.rbox(3.8, 0.92, 0.62, 0.01, K.mat(0x3a5a3a, 0.5), [0, 0.46, 0]);
    b.rbox(3.9, 0.05, 0.68, 0.01, K.surf('concrete', 0x8a8478), [0, 0.94, 0]);
    b.push([-1.0, 0.96, -0.05]);
    b.rbox(1.2, 0.75, 0.5, 0.02, K.mat(0xd8dadc, 0.35, 0.5), [0, 0.375, 0]);
    b.label(
      1.16,
      0.3,
      K.paint(
        'nb_fount',
        512,
        128,
        (c, W, H) => {
          const n = 5;
          ['BLITZ', 'POLAR', 'ZEST-O', 'ROCKET', 'ROOT BR'].forEach((s, i) => {
            c.fillStyle = ['#c8261c', '#1e5aa8', '#e89a0c', '#1e8a3a', '#5a2a14'][i];
            c.fillRect((i * W) / n + 3, 0, W / n - 6, H);
            P.text(c, s, ((i + 0.5) * W) / n, H / 2, {size: 26, col: '#fff', max: W / n - 10});
          });
        },
        {glow: 0.5}
      ),
      [0, 0.55, 0.252]
    );
    for (let i = 0; i < 5; i++) {
      b.cyl(0.015, 0.012, 0.05, chrome, [-0.48 + i * 0.24, 0.22, 0.18], null, 8);
      b.box(0.1, 0.05, 0.05, K.mat(0x222222, 0.5), [-0.48 + i * 0.24, 0.28, 0.22]);
    }
    b.box(1.15, 0.02, 0.32, K.mat(0x8a8c8e, 0.4, 0.6), [0, 0.01, 0.12]);
    b.pop();
    for (let i = 0; i < 3; i++) {
      const x = -0.1 + i * 0.0;
      b.cyl(0.05, 0.045, 0.5, K.glass(0xffffff, 0.45), [0.12 + i * 0.12, 1.21, 0.2], null, 12);
    } // cup tower
    b.push([0.75, 0.96, -0.05]);
    b.rbox(0.9, 0.3, 0.5, 0.02, K.mat(0xd8dadc, 0.35, 0.5), [0, 0.15, 0]);
    for (const [s, colr] of [
      [-0.22, 0xd8202a],
      [0.22, 0x2a6ad8]
    ]) {
      b.cyl(0.17, 0.17, 0.5, K.glass(colr, 0.75), [s, 0.55, 0], null, 18);
      b.add(K.sphGeo(0.17, 18, 8, 0, PI / 2), K.glass(colr, 0.75), {p: [s, 0.8, 0]});
      b.cyl(0.04, 0.04, 0.12, K.mat(0x1a1a1a, 0.5), [s, 0.25, 0.2], [PI / 2, 0, 0], 8);
    }
    b.label(
      0.8,
      0.18,
      K.paint(
        'nb_slush',
        320,
        72,
        (c, W, H) => {
          c.fillStyle = '#1a1a1c';
          c.fillRect(0, 0, W, H);
          P.text(c, 'ARCTIC SLUSH', W / 2, H / 2, {size: 30, col: '#5ad8ff'});
        },
        {glow: 0.6}
      ),
      [0, 1.05, 0.0],
      [0, 0, 0]
    );
    b.box(0.8, 0.2, 0.04, K.mat(0x1a1a1c, 0.4), [0, 1.05, -0.02]);
    b.pop();
    b.push([1.6, 0.96, -0.05]);
    b.rbox(0.5, 0.45, 0.4, 0.01, K.mat(0x1a1a1c, 0.4, 0.2), [0, 0.225, 0]);
    for (const s of [-0.12, 0.12]) {
      b.lathe(
        [
          [0, 0],
          [0.06, 0],
          [0.075, 0.04],
          [0.08, 0.09],
          [0.06, 0.14],
          [0, 0.15]
        ],
        K.glass(0x3a2210, 0.55),
        [s, 0.01, 0.12],
        16
      );
      b.cyl(0.075, 0.075, 0.015, K.mat(0x3a3a3a, 0.4, 0.4), [s, 0.47, 0.06], null, 14);
    }
    b.pop();
    b.label(
      3.6,
      0.5,
      K.paint(
        'nb_bev',
        1024,
        140,
        (c, W, H) => {
          c.fillStyle = GRN;
          c.fillRect(0, 0, W, H);
          P.text(c, 'FOUNTAIN DRINKS  -  ANY SIZE 89c', W * 0.4, H / 2, {size: 54, col: '#fff'});
          P.text(c, 'HOT COFFEE', W * 0.86, H / 2, {size: 48, col: YEL});
        },
        {glow: 0.25}
      ),
      [0, 2.6, -0.28]
    );
    b.pop();
    S(XBAY + 0.1, XBAY + 0.8, -8.95, -5.05, 0, 1.8);
    // hot-dog roller on the counter end by the till
    b.push([-0.25, 1.045, -5.75], [0, PI / 2, 0]);
    b.rbox(0.5, 0.12, 0.32, 0.01, st, [0, 0.06, 0]);
    for (let i = 0; i < 6; i++) {
      b.cyl(0.016, 0.016, 0.42, K.mat(0xc8ccd0, 0.3, 0.9), [0, 0.13, -0.12 + i * 0.048], [0, 0, PI / 2], 8);
      if (i % 2)
        b.cyl(0.014, 0.014, 0.16, K.mat(0xa8482a, 0.5), [(i - 3) * 0.04, 0.15, -0.12 + i * 0.048], [0, 0, PI / 2], 8);
    }
    b.add(new T.BoxGeometry(0.52, 0.22, 0.34), K.glass(0xffffff, 0.25), {p: [0, 0.22, 0]});
    b.pop();
    /* ---------- shop: football dump bin, posters ---------- */
    b.push([-8.8, 0, -5.3]);
    const wr = K.mat(0xb8bcc0, 0.35, 0.8);
    for (const [w, d, x, z] of [
      [1.2, 0.02, 0, -0.4],
      [1.2, 0.02, 0, 0.4],
      [0.02, 0.8, -0.6, 0],
      [0.02, 0.8, 0.6, 0]
    ])
      for (let k = 0; k < 4; k++) b.box(w, 0.015, d, wr, [x, 0.12 + k * 0.2, z], null, 0);
    for (let i = -6; i <= 6; i++)
      for (const z of [-0.4, 0.4]) b.cyl(0.005, 0.005, 0.7, wr, [i * 0.1, 0.42, z], null, 4);
    for (let i = -4; i <= 4; i++)
      for (const x of [-0.6, 0.6]) b.cyl(0.005, 0.005, 0.7, wr, [x, 0.42, i * 0.1], null, 4);
    b.box(1.2, 0.01, 0.8, wr, [0, 0.1, 0], null, 0);
    const ballM = K.paint(
      'nb_ball',
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
    for (let i = 0; i < 9; i++)
      b.add(K.sphGeo(0.11, 14, 10), i % 4 === 2 ? K.mat(0xc8261c, 0.4) : ballM, {
        p: [-0.42 + (i % 4) * 0.28, 0.22 + Math.floor(i / 4) * 0.12, -0.2 + ((i * 7) % 3) * 0.18],
        r: [i, i * 2, 0]
      });
    b.pop();
    S(-9.45, -8.15, -5.75, -4.85, 0, 0.85);
    const poster = (key, draw, x, y, z, ry, w, h) => {
      b.label(w, h, K.paint(key, 256, Math.round((256 * h) / w), draw, {r: 0.5}), [x, y, z], [0, ry, 0]);
    };
    poster(
      'nb_wanted',
      (c, W, H, r) => {
        c.fillStyle = '#ece8d8';
        c.fillRect(0, 0, W, H);
        P.text(c, 'HAVE YOU SEEN', W / 2, 26, {size: 26, col: '#1a3a6a'});
        P.text(c, 'THIS CRIMINAL?', W / 2, 56, {size: 26, col: '#1a3a6a'});
        const g = c.createRadialGradient(W / 2, H * 0.52, 10, W / 2, H * 0.52, 90);
        g.addColorStop(0, '#b8b4a8');
        g.addColorStop(1, '#6a6a64');
        c.fillStyle = g;
        c.beginPath();
        c.ellipse(W / 2, H * 0.5, 58, 74, 0, 0, PI * 2);
        c.fill();
        c.fillStyle = '#4a4a46';
        c.fillRect(W / 2 - 70, H * 0.72, 140, 50);
        c.fillStyle = '#2a2a28';
        c.fillRect(W / 2 - 34, H * 0.45, 22, 7);
        c.fillRect(W / 2 + 12, H * 0.45, 22, 7);
        c.fillRect(W / 2 - 18, H * 0.62, 36, 4);
        P.text(c, 'REWARD $5,000  -  CALL COUNTY SHERIFF', W / 2, H - 18, {size: 14, col: '#1a1a1a', max: W - 20});
      },
      -9.62,
      1.85,
      ZS1 - 0.2,
      PI,
      0.55,
      0.75
    );
    poster(
      'nb_coffee',
      (c, W, H, r) => {
        c.fillStyle = '#f4eedc';
        c.fillRect(0, 0, W, H);
        P.text(c, 'FRESH', W / 2, 36, {size: 40, col: '#c8261c'});
        P.text(c, 'HOT COFFEE', W / 2, 74, {size: 34, col: '#5a2a14'});
        c.fillStyle = '#fff';
        c.fillRect(W / 2 - 46, 110, 92, 110);
        c.fillStyle = '#c8261c';
        c.fillRect(W / 2 - 46, 140, 92, 40);
        c.fillStyle = '#5a2a14';
        c.beginPath();
        c.ellipse(W / 2, 110, 46, 10, 0, 0, PI * 2);
        c.fill();
        P.text(c, 'ANY SIZE 99c', W / 2, H - 30, {size: 28, col: '#1a1a1a'});
      },
      XBAY + 0.17,
      2.0,
      -10.0,
      PI / 2,
      0.7,
      0.95
    );
    poster(
      'nb_rewards',
      (c, W, H, r) => {
        c.fillStyle = GRN;
        c.fillRect(0, 0, W, H);
        drawLogo(c, W / 2, 60, 40, {edge: '#fff', col: '#fff', swoosh: YEL});
        P.text(c, 'REWARDS', W / 2, 130, {size: 40, col: YEL});
        P.text(c, 'SAVE 5c / GAL', W / 2, 190, {size: 30, col: '#fff'});
        P.text(c, 'ASK AT THE COUNTER', W / 2, H - 30, {size: 18, col: '#fff'});
      },
      0,
      1.9,
      -12.48,
      0,
      0.7,
      0.95
    );
    // restroom: toilet, sink, mirror, dryer, sign
    const por = K.mat(0xf4f4f0, 0.2);
    b.push([0.9, 0, -15.5]);
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
    b.cyl(0.2, 0.2, 0.03, K.mat(0x1a1a1a, 0.4), [0, 0.42, 0], null, 18);
    b.pop();
    b.push([-1.5, 0, -14.6], [0, PI / 2, 0]);
    b.rbox(0.5, 0.18, 0.4, 0.03, por, [0, 0.85, 0.1]);
    b.tube(
      [
        [0, 0.95, -0.05],
        [0, 1.1, -0.05],
        [0, 1.08, 0.1]
      ],
      0.008,
      chrome,
      10,
      6
    );
    b.plane(0.5, 0.7, K.mat(0xd8e2e6, 0.03, 1), [0, 1.55, 0.02]);
    b.rbox(0.25, 0.3, 0.15, 0.03, K.mat(0xe8e8e4, 0.3, 0.3), [0.6, 1.3, 0.05]);
    b.pop();
    b.label(
      0.3,
      0.3,
      K.paint('nb_wc', 128, 128, (c, W, H) => {
        c.fillStyle = '#1a4e9a';
        P.rrect(c, 4, 4, W - 8, H - 8, 12);
        c.fill();
        P.text(c, 'RESTROOM', W / 2, H * 0.82, {size: 18, col: '#fff'});
        c.fillStyle = '#fff';
        c.beginPath();
        c.arc(W / 2, 30, 12, 0, PI * 2);
        c.fill();
        c.fillRect(W / 2 - 12, 46, 24, 36);
      }),
      [-2.1, 1.7, -12.7],
      [0, -PI / 2, 0]
    );
    /* ---------- service bay ---------- */
    // v090: the car on the service bay lift is a real model now (placed in the lot builder)
    const tyre = K.rubber(),
      hub = K.mat(0xb8bcc0, 0.3, 0.8);
    const tyreAt = (x, y, z, flat) => {
      if (flat) {
        b.cyl(0.33, 0.33, 0.22, tyre, [x, y + 0.11, z], null, 18);
        b.cyl(0.2, 0.2, 0.23, hub, [x, y + 0.11, z], null, 14);
      } else {
        b.cyl(0.33, 0.33, 0.22, tyre, [x, 0.33, z], [0, 0, PI / 2], 18);
        b.cyl(0.2, 0.2, 0.23, hub, [x, 0.33, z], [0, 0, PI / 2], 14);
      }
    };
    for (let i = 0; i < 3; i++) tyreAt(-11.0, i * 0.22, -5.0, 1);
    for (let i = 0; i < 2; i++) tyreAt(-11.8, i * 0.22, -5.6, 1);
    tyreAt(-12.2, 0, -7.4, 0);
    tyreAt(-16.6, 0, -6.4, 1);
    S(-11.4, -10.6, -5.4, -4.6, 0, 0.7);
    S(-12.2, -11.4, -6, -5.2, 0, 0.45);
    // pegboard + strip light above the bench, hanging tools
    b.box(
      2.4,
      1.2,
      0.02,
      K.tri(
        'nb_peg',
        (c, W, H, r) => {
          c.fillStyle = '#b89a6a';
          c.fillRect(0, 0, W, H);
          c.fillStyle = '#4a3a28';
          for (let y = 8; y < H; y += 16)
            for (let x = 8; x < W; x += 16) {
              c.beginPath();
              c.arc(x, y, 2.2, 0, PI * 2);
              c.fill();
            }
        },
        {tile: 0.4, r: 0.8}
      ),
      [-14.2, 2.0, ZS0 + 0.2],
      null,
      0
    );
    for (let i = 0; i < 9; i++) {
      const x = -15.2 + i * 0.24,
        tm = i % 3 ? K.mat(0xc8261c, 0.4) : st;
      b.box(0.04, 0.25 + (i % 4) * 0.06, 0.015, tm, [x, 2.0 - (i % 2) * 0.2, ZS0 + 0.24], null, 0);
      b.cyl(0.006, 0.006, 0.05, chrome, [x, 2.18 - (i % 2) * 0.2, ZS0 + 0.24], [PI / 2, 0, 0], 4);
    }
    b.tor(0.18, 0.025, K.mat(0x1a1a1a, 0.6), [-13.0, 1.9, ZS0 + 0.24], null, null, 20);
    b.box(0.5, 0.04, 0.12, K.mat(0x2a2a2a, 0.4, 0.5), [-12.8, 2.5, ZS0 + 0.24], null, 0);
    // oil drums, compressor, oil can, creeper, jack, drain pan
    for (const [x, z, colr] of [
      [-17.3, -15.3, 0x1a4e9a],
      [-16.6, -15.3, 0xc8261c]
    ]) {
      b.cyl(0.29, 0.29, 0.88, K.surf('rust', colr, {m: 0.4}), [x, 0.44, z], null, 18);
      for (const y of [0.2, 0.68]) b.tor(0.29, 0.014, K.mat(0x3a3a3a, 0.5, 0.6), [x, y, z], [PI / 2, 0, 0], null, 18);
      b.cyl(0.03, 0.03, 0.02, blk, [x + 0.12, 0.89, z], null, 8);
    }
    S(-17.65, -16.3, -15.65, -14.95, 0, 0.9);
    b.push([-17.3, 0, -6.2]);
    b.cyl(0.2, 0.2, 0.7, K.mat(0xc8261c, 0.4, 0.4), [0, 0.35, 0], [PI / 2, 0, 0], 16);
    b.rbox(0.3, 0.25, 0.25, 0.02, K.mat(0x2a2a2a, 0.5), [0, 0.62, 0]);
    b.cyl(0.06, 0.06, 0.06, chrome, [0.1, 0.8, 0.0], null, 10);
    b.tor(0.12, 0.012, K.mat(0x1a1a1a, 0.5), [0, 0.4, 0.3], [0, PI / 2, 0], null, 18);
    b.pop();
    b.box(0.5, 0.06, 1.0, K.mat(0x2a2a2a, 0.5), [-11.6, 0.12, -10], null, 0.02);
    for (const [x, z] of [
      [-11.8, -10.4],
      [-11.4, -10.4],
      [-11.8, -9.6],
      [-11.4, -9.6]
    ])
      b.cyl(0.04, 0.04, 0.06, blk, [x, 0.04, z], null, 8);
    b.cyl(0.35, 0.35, 0.06, K.mat(0x1a1a1a, 0.5, 0.3), [-14.3, 0.06, -8.4], null, 24);
    b.rbox(0.25, 0.15, 0.6, 0.02, K.mat(0xc8261c, 0.4, 0.4), [-12.6, 0.1, -12.6]);
    b.cyl(0.02, 0.02, 0.9, st, [-12.6, 0.4, -12.1], [-1.2, 0, 0], 8);
    b.rbox(
      0.16,
      0.24,
      0.08,
      0.01,
      K.paint('nb_oil', 96, 128, (c, W, H) => {
        c.fillStyle = '#1a4e9a';
        c.fillRect(0, 0, W, H);
        P.text(c, 'MOTOR', W / 2, 40, {size: 20, col: '#fff'});
        P.text(c, 'OIL', W / 2, 70, {size: 26, col: YEL});
        P.text(c, '10W-30', W / 2, 100, {size: 16, col: '#fff'});
      }),
      [-12.1, 0.12, -6.2],
      [0, 0.6, 0]
    );
    b.label(
      1.0,
      0.35,
      K.paint('nb_bayno', 300, 105, (c, W, H) => {
        c.fillStyle = YEL;
        c.fillRect(0, 0, W, H);
        P.text(c, 'BAY 1', W / 2, H / 2, {size: 60, col: '#1a1a1a'});
      }),
      [XS0 + 0.17, 2.3, -7],
      [0, PI / 2, 0]
    );
    b.label(
      1.2,
      0.5,
      K.paint('nb_nosmoke', 320, 130, (c, W, H) => {
        c.fillStyle = '#fff';
        c.fillRect(0, 0, W, H);
        c.strokeStyle = '#c8261c';
        c.lineWidth = 10;
        c.beginPath();
        c.arc(60, H / 2, 46, 0, PI * 2);
        c.moveTo(28, H / 2 - 32);
        c.lineTo(92, H / 2 + 32);
        c.stroke();
        P.text(c, 'NO SMOKING', 205, H / 2, {size: 34, col: '#1a1a1a'});
      }),
      [XBAY - 0.1, 2.3, -7.5],
      [0, -PI / 2, 0]
    );
    /* ---------- canopy, islands, pumps ---------- */
    const CX0 = -1,
      CX1 = 19,
      CZ0 = 1,
      CZ1 = 11,
      CY = 4.7,
      cf = fasciaTex('nb_cfascia', 'canopy');
    b.box(CX1 - CX0, 0.15, CZ1 - CZ0, K.mat(0x6a6c70, 0.6, 0.3), [(CX0 + CX1) / 2, CY + 1.0, (CZ0 + CZ1) / 2], null, 0);
    b.box(CX1 - CX0 + 0.1, 1.0, 0.12, cf, [(CX0 + CX1) / 2, CY + 0.5, CZ1], null, 0);
    b.box(CX1 - CX0 + 0.1, 1.0, 0.12, cf, [(CX0 + CX1) / 2, CY + 0.5, CZ0], null, 0);
    b.box(0.12, 1.0, CZ1 - CZ0, cf, [CX0, CY + 0.5, (CZ0 + CZ1) / 2], null, 0);
    b.box(0.12, 1.0, CZ1 - CZ0, cf, [CX1, CY + 0.5, (CZ0 + CZ1) / 2], null, 0);
    b.box(
      CX1 - CX0 - 0.1,
      0.02,
      CZ1 - CZ0 - 0.1,
      surf('soffit'),
      [(CX0 + CX1) / 2, CY + 0.02, (CZ0 + CZ1) / 2],
      null,
      0
    );
    b.label(5.2, 1.0, logoMat('nb_logo_can', 1024, 196, {}), [3.8, CY + 0.5, CZ1 + 0.07]);
    b.label(4.6, 0.9, logoMat('nb_logo_can', 1024, 196, {}), [CX1 + 0.07, CY + 0.5, 6], [0, PI / 2, 0]);
    b.label(4.6, 0.9, logoMat('nb_logo_can', 1024, 196, {}), [CX0 - 0.07, CY + 0.5, 6], [0, -PI / 2, 0]);
    b.label(5.2, 1.0, logoMat('nb_logo_can', 1024, 196, {}), [14, CY + 0.5, CZ0 - 0.07], [0, PI, 0]);
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 3; j++) {
        const x = 1.5 + i * 5,
          z = 3 + j * 3;
        b.box(1.6, 0.04, 0.5, lit, [x, CY - 0.005, z], null, 0);
        b.frame(1.66, 0.56, 0.03, K.mat(0xc8ccd0, 0.4, 0.6), [x, CY - 0.02, z], 0.01);
      }
    const isl = K.surf('concrete', 0xbab6aa);
    const pump = (x, z) => {
      b.push([x, 0.2, z], [0, PI / 2, 0]);
      const wht = K.mat(0xeeeeea, 0.35, 0.2),
        grn = K.mat(0x1f8a3e, 0.4, 0.2);
      b.rbox(0.95, 0.1, 0.62, 0.02, K.mat(0x7a7c7e, 0.5, 0.5), [0, 0.05, 0]);
      b.rbox(0.86, 1.0, 0.5, 0.03, grn, [0, 0.6, 0]);
      b.rbox(0.9, 0.8, 0.54, 0.03, wht, [0, 1.5, 0]);
      b.rbox(1.0, 0.32, 0.6, 0.04, grn, [0, 2.06, 0]);
      b.box(1.02, 0.04, 0.62, K.mat(0x1a4e9a, 0.4), [0, 1.9, 0], null, 0.01);
      for (const sd of [1, -1]) {
        b.push([0, 0, sd * 0.272], [0, sd > 0 ? 0 : PI, 0]);
        b.label(0.9, 0.24, logoMat('nb_logo_pump', 512, 136, {}), [0, 2.06, 0.033]);
        b.label(
          0.52,
          0.34,
          K.paint(
            'nb_disp',
            256,
            170,
            (c, W, H) => {
              c.fillStyle = '#1a1c1e';
              c.fillRect(0, 0, W, H);
              for (const [y, l, v] of [
                [30, 'TOTAL $', '0.00'],
                [85, 'GALLONS', '0.000'],
                [140, 'PRICE/GAL', '2.33⁹']
              ]) {
                c.fillStyle = '#0a2a10';
                c.fillRect(100, y - 20, 146, 40);
                P.text(c, v.replace('⁹', '9'), 236, y, {size: 32, col: '#7aff6a', font: "'MFZ Mono'", align: 'right'});
                P.text(c, l, 52, y, {size: 14, col: '#ccc'});
              }
            },
            {glow: 0.55}
          ),
          [0, 1.62, 0.012]
        );
        for (let i = 0; i < 3; i++) {
          b.rbox(0.18, 0.12, 0.03, 0.01, K.mat([0xd8d8d0, 0x1a8a3a, 0x1a4e9a][i], 0.4), [-0.25 + i * 0.25, 1.25, 0.01]);
          b.label(
            0.16,
            0.08,
            K.paint('nb_g' + i, 96, 48, (c, W, H) => {
              c.fillStyle = ['#e8e8e0', '#1a8a3a', '#1a4e9a'][i];
              c.fillRect(0, 0, W, H);
              P.text(c, ['87', '89', '93'][i], W / 2, H / 2, {size: 30, col: i ? '#fff' : '#111'});
            }),
            [-0.25 + i * 0.25, 1.25, 0.027]
          );
        }
        b.rbox(0.22, 0.28, 0.04, 0.01, K.mat(0x2a2c2e, 0.4, 0.4), [0.28, 0.8, 0.02]);
        b.box(0.12, 0.02, 0.02, K.mat(0x0a0a0a, 0.5), [0.28, 0.9, 0.045], null, 0);
        for (let k = 0; k < 9; k++)
          b.box(
            0.04,
            0.03,
            0.01,
            K.mat(0xc8c8c4, 0.5),
            [0.24 + (k % 3) * 0.04, 0.72 + Math.floor(k / 3) * 0.045, 0.045],
            null,
            0
          );
        b.label(
          0.36,
          0.5,
          K.paint(
            'nb_pumpad',
            128,
            180,
            (c, W, H) => {
              c.fillStyle = YEL;
              c.fillRect(0, 0, W, H);
              P.text(c, '2 FOR', W / 2, 30, {size: 26, col: '#c8261c'});
              P.text(c, '$3', W / 2, 80, {size: 56, col: '#c8261c'});
              P.text(c, 'COLD DRINKS', W / 2, H - 30, {size: 16, col: '#1a1a1a'});
            },
            {r: 0.5}
          ),
          [-0.2, 0.65, 0.012]
        );
        b.pop();
      }
      for (const sx of [-1, 1]) {
        b.box(0.08, 0.4, 0.2, K.mat(0x2a2a2a, 0.5), [sx * 0.49, 1.15, 0.0], null, 0.01);
        b.push([sx * 0.55, 1.15, 0]);
        b.box(0.08, 0.22, 0.06, blk, [0, 0, 0], null, 0.02);
        b.cyl(0.014, 0.014, 0.2, st, [0, -0.12, 0.08], [0.9, 0, 0], 8);
        b.box(0.06, 0.08, 0.08, K.mat(0x1a8a3a, 0.4), [0, 0.1, 0], null, 0.01);
        b.pop();
        b.tube(
          [
            [sx * 0.45, 1.85, 0],
            [sx * 0.62, 1.5, 0.12],
            [sx * 0.66, 0.5, 0.25],
            [sx * 0.6, 0.25, 0.15],
            [sx * 0.56, 1.0, 0.02],
            [sx * 0.55, 1.05, 0]
          ],
          0.016,
          K.rubber(),
          40,
          6
        );
      }
      b.pop();
      S(x - 0.35, x + 0.35, z - 0.55, z + 0.55, 0, 2.3);
    };
    for (const ix of [2.5, 9, 15.5]) {
      b.rbox(1.3, 0.2, 7.2, 0.06, isl, [ix, 0.1, 6]);
      // v090: the yellow nose caps stand 4 cm proud of the island all round (they were 5 mm: z-fighting)
      b.box(1.38, 0.24, 0.64, yel, [ix, 0.12, 2.7], null, 0.02);
      b.box(1.38, 0.24, 0.64, yel, [ix, 0.12, 9.3], null, 0.02);
      for (const z of [3.15, 8.85]) {
        b.box(0.42, CY - 0.2, 0.42, K.mat(0xc8ccd0, 0.35, 0.6), [ix, 0.2 + (CY - 0.2) / 2, z], null, 0.02);
        b.rbox(0.6, 0.7, 0.6, 0.06, K.surf('concrete', 0xd8d4c8), [ix, 0.55, z]);
        b.box(0.66, 0.14, 0.66, yel, [ix, 0.85, z], null, 0.02);
        S(ix - 0.31, ix + 0.31, z - 0.31, z + 0.31, 0, CY);
      }
      for (const z of [2.55, 9.45]) {
        b.cyl(0.12, 0.12, 1.0, yel, [ix, 0.6, z], null, 12);
        S(ix - 0.13, ix + 0.13, z - 0.13, z + 0.13, 0, 1.1, true);
      }
      pump(ix, 4.6);
      pump(ix, 7.4);
      // island services: trash can + squeegee bucket + towel dispenser
      b.push([ix, 0.2, 6]);
      b.cyl(0.22, 0.2, 0.85, K.mat(0x1f6a34, 0.5, 0.3), [0.2, 0.425, 0], null, 14);
      b.cyl(0.23, 0.23, 0.06, K.mat(0x1a1a1a, 0.5), [0.2, 0.88, 0], null, 14);
      b.cyl(0.12, 0.1, 0.3, K.mat(0x1a4e9a, 0.5), [-0.25, 0.15, 0], null, 12);
      b.cyl(0.012, 0.012, 0.6, K.mat(0xd8d8d8, 0.5), [-0.25, 0.45, 0.03], [0.15, 0, 0], 6);
      b.rbox(0.25, 0.3, 0.18, 0.02, K.mat(0x1a1a1c, 0.5), [0.2, 1.3, 0]);
      b.cyl(0.02, 0.02, 0.4, st, [0.2, 1.0, 0], null, 6);
      b.pop();
      S(ix - 0.5, ix + 0.5, 5.7, 6.3, 0, 1.0, true);
    }
    // the van at pump 3, a sedan waiting at pump 1
    // v090: real models now (placed in the lot builder)
    /* ---------- price pylon on the corner ---------- */
    b.push([17.4, 0, 13.6], [0, -0.45, 0]);
    for (const s of [-1, 1]) {
      b.box(0.18, 5.2, 0.25, K.mat(0x2a3a34, 0.5, 0.4), [s * 1.0, 2.6, 0], null, 0.02);
      b.rbox(0.5, 0.4, 0.5, 0.05, K.surf('concrete', 0x9a9890), [s * 1.0, 0.2, 0]);
    }
    b.rbox(2.3, 3.6, 0.32, 0.03, K.mat(0x1e2a26, 0.5, 0.3), [0, 3.1, 0]);
    b.rbox(2.4, 0.95, 0.36, 0.04, K.mat(0xf2f2ee, 0.4), [0, 5.2, 0]);
    b.box(2.42, 0.06, 0.37, K.mat(0x1a4e9a, 0.4), [0, 4.7, 0], null, 0.01);
    for (const sd of [1, -1]) {
      b.push([0, 0, sd * 0.17], [0, sd > 0 ? 0 : PI, 0]);
      b.label(2.2, 0.8, logoMat('nb_logo_pylon', 768, 280, {}), [0, 5.22, 0.025]);
      b.label(
        2.2,
        3.4,
        K.paint(
          'nb_prices',
          512,
          792,
          (c, W, H, r) => {
            c.fillStyle = '#1e2a26';
            c.fillRect(0, 0, W, H);
            c.fillStyle = '#2a3a6a';
            c.fillRect(0, 0, W, 90);
            P.text(c, 'Service Center', W / 2, 46, {size: 44, col: '#e8eaec'});
            [
              ['Regular', 172],
              ['Plus', 372],
              ['Premium', 572]
            ].forEach(([n, y]) => {
              P.text(c, n, 24, y, {size: 44, col: '#d8dad8', align: 'left'});
              c.fillStyle = '#0c0c0a';
              c.fillRect(230, y - 70, 260, 140);
              c.strokeStyle = '#4a4a46';
              c.lineWidth = 4;
              c.strokeRect(230, y - 70, 260, 140);
              P.text(c, ['2.33', '2.49', '2.65'][y === 172 ? 0 : y === 372 ? 1 : 2], 420, y, {
                size: 112,
                col: '#ffb428',
                font: "'MFZ Mono'",
                align: 'right'
              });
              P.text(c, '9', 466, y - 26, {size: 40, col: '#ffb428', font: "'MFZ Mono'"});
              P.text(c, '10', 466, y + 26, {size: 28, col: '#ffb428', font: "'MFZ Mono'"});
              c.fillStyle = '#ffb428';
              c.fillRect(452, y, 28, 3);
            });
            P.text(c, 'Gasoline', W / 2, H - 60, {size: 52, col: '#d8dad8'});
          },
          {glow: 0.45, r: 0.4}
        ),
        [0, 3.1, 0.0]
      );
      b.pop();
    }
    b.pop();
    S(16.2, 18.6, 13.0, 14.2, 0, 5.7, true);
    /* ---------- propane tanks ---------- */
    const propane = (x, z, ry) => {
      b.push([x, 0, z], [0, ry, 0]);
      const tm = surf('tank');
      b.add(K.cylGeo(0.62, 0.62, 2.4, 28, true), tm, {p: [0, 1.0, 0], r: [0, 0, PI / 2]});
      for (const s of [-1, 1])
        b.add(K.sphGeo(0.62, 28, 14), K.mat(0xecece8, 0.35, 0.25), {p: [s * 1.2, 1.0, 0], s: [0.45, 1, 1]});
      b.add(K.sphGeo(0.22, 16, 8, 0, PI / 2), K.mat(0xd8d8d4, 0.4, 0.3), {p: [0, 1.6, 0]});
      b.cyl(0.04, 0.04, 0.1, K.mat(0xb89a2a, 0.3, 0.8), [0, 1.8, 0], null, 8);
      b.cyl(0.03, 0.03, 0.08, K.mat(0x6a6a6a, 0.4, 0.8), [0.1, 1.62, 0.12], null, 8);
      for (const s of [-0.75, 0.75]) {
        b.box(0.14, 0.4, 0.9, K.mat(0xd8d8d4, 0.5, 0.3), [s, 0.3, 0], null, 0.01);
        b.box(0.2, 0.1, 1.0, K.mat(0xd8d8d4, 0.5, 0.3), [s, 0.05, 0], null, 0.01);
      }
      b.box(2.8, 0.12, 1.4, K.surf('concrete', 0xa8a69e), [0, 0.06, 0], null, 0.02);
      b.pop();
      const sw = Math.abs(Math.sin(ry)) > 0.5;
      S(x - (sw ? 0.7 : 1.75), x + (sw ? 0.7 : 1.75), z - (sw ? 1.75 : 0.7), z + (sw ? 1.75 : 0.7), 0, 1.7, true);
    };
    propane(-17.8, -0.6, 0);
    propane(16.5, -6.5, PI / 2);
    /* ---------- by the shop door: ice merchandiser, A-frame, trash can, air / water ---------- */
    b.push([-11.0, 0, -3.2]);
    b.rbox(1.2, 1.35, 0.75, 0.04, K.mat(0xeeeeea, 0.35, 0.2), [0, 0.675, 0]);
    b.box(1.0, 0.85, 0.02, K.mat(0x8a9aa4, 0.15, 0.5), [0, 0.75, 0.38], null, 0);
    b.label(
      1.1,
      0.42,
      K.paint(
        'nb_ice',
        512,
        196,
        (c, W, H, r) => {
          c.fillStyle = '#fff';
          c.fillRect(0, 0, W, H);
          for (let i = 0; i < 3; i++) {
            c.fillStyle = ['#1a4e9a', '#c8261c', '#1a4e9a'][i];
            c.font = "italic bold 150px 'MFZ Head'";
            c.textAlign = 'center';
            c.textBaseline = 'middle';
            c.fillText('ICE'[i], W * (0.25 + i * 0.25), H * 0.55);
          }
          c.fillStyle = 'rgba(200,230,255,.6)';
          for (let i = 0; i < 40; i++) c.fillRect(r() * W, r() * H, 3, 3);
        },
        {r: 0.4}
      ),
      [0, 1.15, 0.405] // v090: in front of the door panel (at 0.385 the panel's face, 0.39, hid it close up)
    );
    b.box(0.12, 0.2, 0.1, K.mat(0x2a2a2a, 0.5, 0.6), [0.4, 0.5, 0.42], null, 0.02);
    b.pop();
    S(-11.6, -10.4, -3.6, -2.8, 0, 1.4);
    b.push([-3.2, 0.1, -2.7], [0, 0.3, 0]);
    const af = K.paint(
      'nb_aframe',
      192,
      288,
      (c, W, H) => {
        c.fillStyle = '#f4f2ea';
        c.fillRect(0, 0, W, H);
        c.fillStyle = GRN;
        c.fillRect(0, 0, W, 46);
        P.text(c, 'GOURMET', W / 2, 23, {size: 28, col: '#fff'});
        c.fillStyle = '#fff';
        c.fillRect(46, 80, 100, 120);
        c.strokeStyle = '#5a2a14';
        c.lineWidth = 4;
        c.strokeRect(46, 80, 100, 120);
        c.fillStyle = '#c8261c';
        c.fillRect(46, 120, 100, 36);
        c.fillStyle = '#5a2a14';
        c.beginPath();
        c.ellipse(96, 80, 50, 10, 0, 0, PI * 2);
        c.fill();
        P.text(c, 'COFFEE', W / 2, 236, {size: 36, col: '#5a2a14'});
        P.text(c, '99c ANY SIZE', W / 2, 268, {size: 20, col: '#c8261c'});
      },
      {r: 0.5}
    );
    for (const s of [-1, 1])
      b.add(K.rboxGeo(0.5, 0.82, 0.025, 0.01, 1), af, {p: [0, 0.4, s * 0.13], r: [-s * 0.17, s > 0 ? 0 : PI, 0]});
    b.pop();
    b.cyl(
      0.24,
      0.22,
      0.9,
      K.tri(
        'nb_bin',
        (c, W, H, r) => {
          c.fillStyle = '#8a8e92';
          c.fillRect(0, 0, W, H);
          for (let x = 0; x < W; x += 12) {
            c.fillStyle = 'rgba(0,0,0,.35)';
            c.fillRect(x, 0, 3, H);
          }
        },
        {tile: 0.3, r: 0.4, m: 0.6}
      ),
      [0.95, 0.55, -2.7],
      null,
      18
    );
    b.cyl(0.25, 0.25, 0.05, K.mat(0x5a5e62, 0.4, 0.6), [0.95, 1.02, -2.7], null, 18);
    b.push([3.2, 0, -6.2], [0, PI / 2, 0]);
    b.rbox(0.7, 1.5, 0.45, 0.04, K.mat(0x1a4e9a, 0.4, 0.3), [0, 0.75, 0]);
    b.label(
      0.6,
      0.3,
      K.paint('nb_air', 256, 128, (c, W, H) => {
        c.fillStyle = '#fff';
        c.fillRect(0, 0, W, H);
        P.text(c, 'AIR', W / 2, 40, {size: 48, col: '#1a4e9a'});
        P.text(c, '& WATER  75c', W / 2, 96, {size: 30, col: '#c8261c'});
      }),
      [0, 1.15, 0.232]
    );
    b.tor(0.22, 0.014, K.rubber(), [0.38, 0.8, 0], [0, PI / 2, 0], null, 24);
    b.tor(0.18, 0.014, K.mat(0x1a4e9a, 0.6), [-0.38, 0.8, 0], [0, PI / 2, 0], null, 24);
    b.pop();
    S(2.95, 3.45, -6.55, -5.85, 0, 1.5);
    /* ---------- wrecks behind jersey barriers ---------- */
    // v090: the two wrecks are real models now (placed in the lot builder)
    const jersey = (x, z, ry) => {
      b.push([x, 0, z], [0, ry, 0]);
      b.add(
        K.extrudeGeo(
          [
            [-0.3, 0],
            [0.3, 0],
            [0.3, 0.08],
            [0.12, 0.3],
            [0.08, 0.8],
            [-0.08, 0.8],
            [-0.12, 0.3],
            [-0.3, 0.08]
          ],
          2.4,
          0.01
        ),
        surf('jersey'),
        {r: [0, PI / 2, 0]}
      );
      b.box(2.4, 0.08, 0.02, yel, [0, 0.5, 0.11], [-0.08, 0, 0], 0);
      b.box(2.4, 0.08, 0.02, yel, [0, 0.5, -0.11], [0.08, 0, 0], 0);
      b.pop();
      const sw = Math.abs(Math.sin(ry)) > 0.5;
      S(x - (sw ? 0.3 : 1.2), x + (sw ? 0.3 : 1.2), z - (sw ? 1.2 : 0.3), z + (sw ? 1.2 : 0.3), 0, 0.8, true);
    };
    jersey(-11.4, 11.3, 0);
    jersey(-8.6, 9.6, PI / 2 - 0.2);
    jersey(-16.0, 11.0, 0.15);
    jersey(-7.6, 4.3, PI / 2);
    for (let i = 0; i < 14; i++) {
      const a = rnd() * PI * 2,
        r = rnd() * 2.5;
      b.box(
        0.05 + rnd() * 0.1,
        0.01,
        0.05 + rnd() * 0.1,
        K.glass(0xcfe6ee, 0.5),
        [-11.8 + Math.cos(a) * r, 0.03, 7.2 + Math.sin(a) * r],
        [0, a, 0],
        0
      );
    }
    /* ---------- sidewalk: bus shelter, bus stop, mailbox, no parking, hydrant, street lights ---------- */
    b.push([-11.5, 0, 16.5]);
    const fr = K.mat(0x2a5a3a, 0.4, 0.5);
    for (const [x, z] of [
      [-1.6, -0.65],
      [1.6, -0.65],
      [-1.6, 0.65],
      [1.6, 0.65]
    ])
      b.box(0.08, 2.5, 0.08, fr, [x, 1.25, z], null, 0.01);
    b.box(3.4, 0.08, 1.5, fr, [0, 2.52, 0], null, 0.01);
    b.box(3.3, 0.03, 1.4, K.glass(0xb8e88a, 0.55), [0, 2.57, 0], null, 0);
    b.box(3.3, 1.8, 0.02, K.glass(0xcfe6ee, 0.25), [0, 1.3, -0.65], null, 0);
    b.box(0.04, 1.9, 1.3, fr, [-1.6, 1.25, 0], null, 0.01);
    b.label(
      1.2,
      1.7,
      K.paint(
        'nb_ad',
        256,
        360,
        (c, W, H, r) => {
          c.fillStyle = '#c8261c';
          c.fillRect(0, 0, W, H);
          c.fillStyle = '#fff';
          c.fillRect(14, 14, W - 28, H - 28);
          c.fillStyle = '#c8261c';
          c.fillRect(22, 22, W - 44, H - 44);
          drawNut(c, W / 2, 140, 64, '#fff');
          P.text(c, 'OIL CHANGE', W / 2, 250, {size: 32, col: '#fff'});
          P.text(c, '$19.99', W / 2, 296, {size: 42, col: YEL});
        },
        {glow: 0.35}
      ),
      [-1.57, 1.25, 0],
      [0, PI / 2, 0]
    );
    b.label(
      1.2,
      1.7,
      K.paint('nb_ad', 256, 360, () => {}, {glow: 0.35}),
      [-1.63, 1.25, 0],
      [0, -PI / 2, 0]
    );
    for (let i = 0; i < 4; i++)
      b.box(
        2.4,
        0.04,
        0.08,
        K.mat(0x1a3a8a, 0.4, 0.5),
        [0.2, 0.5 + (i < 2 ? 0 : 0.15 + (i - 2) * 0.14), -0.4 + (i < 2 ? i * 0.12 : 0.18)],
        [i < 2 ? 0 : -0.25, 0, 0],
        0
      );
    for (const x of [-0.8, 1.2]) b.box(0.05, 0.5, 0.4, K.mat(0x3a3a3c, 0.4, 0.6), [x, 0.25, -0.35], null, 0);
    b.pop();
    S(-13.2, -9.8, 15.75, 15.95, 0, 2.6, true);
    S(-13.2, -13.0, 15.8, 17.2, 0, 2.6, true);
    const signPost = (x, z, ry, key, draw, w, h, ph) => {
      b.push([x, 0, z], [0, ry, 0]);
      b.cyl(0.03, 0.03, ph, K.mat(0x8a8c8e, 0.4, 0.6), [0, ph / 2, 0], null, 8);
      b.label(w, h, K.paint(key, 192, Math.round((192 * h) / w), draw, {r: 0.5}), [0, ph - h / 2 - 0.05, 0.035]);
      b.box(w, h, 0.01, K.mat(0x9a9c9e, 0.4, 0.6), [0, ph - h / 2 - 0.05, 0.025], null, 0);
      b.pop();
      S(x - 0.05, x + 0.05, z - 0.05, z + 0.05, 0, ph, true);
    };
    signPost(
      -8.9,
      17.6,
      0,
      'nb_busstop',
      (c, W, H) => {
        c.fillStyle = '#fff';
        c.fillRect(0, 0, W, H);
        c.fillStyle = '#1a4e9a';
        c.fillRect(0, 0, W, H * 0.3);
        P.text(c, 'BUS STOP', W / 2, H * 0.15, {size: 30, col: '#fff'});
        c.fillStyle = '#1a4e9a';
        P.rrect(c, 40, H * 0.38, 112, H * 0.4, 10);
        c.fill();
        c.fillStyle = '#fff';
        c.fillRect(50, H * 0.43, 92, H * 0.14);
        P.text(c, 'ROUTE 9', W / 2, H * 0.88, {size: 24, col: '#1a1a1a'});
      },
      0.45,
      0.6,
      2.6
    );
    signPost(
      14.6,
      17.6,
      0,
      'nb_nopark',
      (c, W, H) => {
        c.fillStyle = '#fff';
        c.fillRect(0, 0, W, H);
        c.strokeStyle = '#c8261c';
        c.lineWidth = 6;
        c.strokeRect(6, 6, W - 12, H - 12);
        P.text(c, 'NO', W / 2, H * 0.2, {size: 44, col: '#c8261c'});
        P.text(c, 'PARKING', W / 2, H * 0.42, {size: 36, col: '#c8261c'});
        P.text(c, 'ANY', W / 2, H * 0.62, {size: 28, col: '#c8261c'});
        P.text(c, 'TIME', W / 2, H * 0.8, {size: 28, col: '#c8261c'});
      },
      0.35,
      0.55,
      2.3
    );
    b.push([12.6, 0, 17.4]);
    const mb = K.mat(0x1a3a8a, 0.45, 0.3);
    b.rbox(0.55, 0.85, 0.55, 0.06, mb, [0, 0.85, 0]);
    b.add(new T.CylinderGeometry(0.275, 0.275, 0.55, 18, 1, false, 0, PI), mb, {
      p: [0, 1.27, 0],
      r: [0, PI / 2, PI / 2]
    });
    for (const [x, z] of [
      [-0.24, -0.24],
      [0.24, -0.24],
      [-0.24, 0.24],
      [0.24, 0.24]
    ])
      b.box(0.05, 0.45, 0.05, mb, [x, 0.22, z], null, 0.01);
    b.box(0.4, 0.06, 0.02, K.mat(0x9a9c9e, 0.4, 0.6), [0, 1.3, 0.28], null, 0);
    b.label(
      0.4,
      0.3,
      K.paint('nb_mail', 160, 120, (c, W, H) => {
        c.fillStyle = '#1a3a8a';
        c.fillRect(0, 0, W, H);
        c.fillStyle = '#fff';
        c.fillRect(20, 20, W - 40, 40);
        c.fillStyle = '#c8261c';
        c.fillRect(20, 60, W - 40, 8);
        P.text(c, 'MAIL', W / 2, 92, {size: 30, col: '#fff'});
      }),
      [0, 0.95, 0.281]
    );
    b.pop();
    S(12.3, 12.9, 17.1, 17.7, 0, 1.5, true);
    b.push([-4.2, 0, 17.5]);
    const hy = K.mat(0xc8261c, 0.45, 0.3);
    b.cyl(0.13, 0.15, 0.6, hy, [0, 0.32, 0], null, 16);
    b.add(K.sphGeo(0.14, 14, 8, 0, PI / 2), hy, {p: [0, 0.62, 0]});
    b.cyl(0.04, 0.04, 0.06, hy, [0, 0.78, 0], null, 8);
    for (const s of [-1, 1]) b.cyl(0.05, 0.05, 0.12, hy, [s * 0.17, 0.42, 0], [0, 0, PI / 2], 10);
    b.cyl(0.07, 0.07, 0.1, hy, [0, 0.42, 0.17], [PI / 2, 0, 0], 10);
    b.cyl(0.2, 0.2, 0.05, hy, [0, 0.04, 0], null, 16);
    b.pop();
    S(-4.4, -4.0, 17.3, 17.7, 0, 0.8, true);
    const streetLight = (x, z) => {
      const m = K.mat(0xb8bcc0, 0.35, 0.7);
      b.push([x, 0, z]);
      b.rbox(0.45, 0.6, 0.45, 0.04, m, [0, 0.3, 0]);
      b.cyl(0.09, 0.14, 8.8, m, [0, 4.4, 0], null, 12);
      b.cyl(0.05, 0.05, 4.2, m, [0, 8.5, -2.0], [PI / 2, 0, 0], 8);
      b.cyl(0.035, 0.035, 3.0, m, [0, 7.9, -1.4], [PI / 2 - 0.35, 0, 0], 8);
      for (let i = 0; i < 6; i++)
        b.cyl(0.012, 0.012, 0.6, m, [0, 8.2 - (i % 2) * 0.1, -0.6 - i * 0.55], [i % 2 ? 0.5 : -0.5, 0, 0], 4);
      b.rbox(0.4, 0.14, 0.75, 0.05, m, [0, 8.45, -4.1]);
      b.box(
        0.3,
        0.02,
        0.55,
        K.mat(0xffffff, 0.4, 0, {emissive: 0xfff2d0, emissiveIntensity: 0.8}),
        [0, 8.37, -4.1],
        null,
        0
      );
      b.pop();
      S(x - 0.23, x + 0.23, z - 0.23, z + 0.23, 0, 8.8, true);
    };
    streetLight(-18.6, 17.5);
    streetLight(5.2, 17.5);
    /* ---------- behind the store: dumpster corner (the dumpster itself is lootable, placed at build) + a cardboard pile ---------- */
    for (let i = 0; i < 4; i++)
      b.rbox(0.6, 0.08, 0.8, 0.005, K.surf('cardboard', 0xb08a58), [8.6, 0.05 + i * 0.08, -15.4], [0, rnd() * 0.5, 0]);
    b.box(4.2, 1.8, 0.08, surf('panel'), [6.6, 0.9, -17.7], null, 0);
    b.box(0.08, 1.8, 2.4, surf('panel'), [4.5, 0.9, -16.5], null, 0);
    S(4.45, 8.7, -17.75, -17.65, 0, 1.8, true);
    S(4.45, 4.55, -17.75, -15.3, 0, 1.8, true);
    CACHE = {M: b.done(), cols, occ};
    return CACHE;
  }

  /* ===================== the builder ===================== */
  function bNutBolt(x, z, t) {
    const B = mk(x, z, 40, 36, H, 0x2a8a4a, 0xc8b8a0, 0x3a4a52);
    B.dx = 0;
    const PT = {th: 0.16, c: 0xb8b8b0};
    WL(
      B,
      1,
      ZS1,
      XS0,
      XS1,
      [{k: 'g', c: -15.4}, {k: 'g', c: -13.8}, ...wins([-8.6, -6.9, -5.2, -3.5, 0.5]), {k: 'd', c: -1.5}],
      H
    );
    WL(B, 1, ZS0, XS0, XS1, [{k: 'd', c: -4, s: -1}], H);
    WL(B, 0, XS0, ZS0, ZS1, wins([-10]), H);
    WL(B, 0, XS1, ZS0, ZS1, wins([-8]), H);
    WL(B, 0, XBAY, ZS0, ZS1, [{k: 'd', c: -13.5}], H, PT);
    WL(B, 0, -2, ZS0, -12.6, [{k: 'd', c: -13.6}], H, PT);
    WL(B, 1, -12.6, -2, XS1, [], H, PT);
    const C = build(),
      D = new T.Object3D();
    D.userData.kind = 'bdecor';
    for (const q of C.M.meshes) {
      const m = new T.Mesh(q.g, q.mat);
      m.castShadow = !q.mat.transparent;
      m.receiveShadow = true;
      D.add(m);
    }
    B.g.add(D);
    B.g.updateMatrixWorld(true);
    for (const c of C.cols) {
      const a = new T.Vector3(c[0], c[1], c[2]).applyMatrix4(B.g.matrixWorld),
        e = new T.Vector3(c[3], c[4], c[5]).applyMatrix4(B.g.matrixWorld);
      solids.push(new T.Box3(a.clone().min(e), a.clone().max(e)));
    }
    for (const o of C.occ) B.occ.push(o);
    // v090: real vehicle models (vehicles.js) instead of the hand-built ones
    window.LOTKIT.vehicle(B, 'sedan', -14.3, -9.8, 0, {tint: [0.54, 0.1, 0.14], dust: true, wreck: false, y: 0.18}); // up on the service bay lift
    window.LOTKIT.vehicle(B, 'van', 12.25, 6.2, 0, {
      label: 'PIPEWORKS PLUMBING',
      labelCol: '#1a4e9a',
      tint: [0.94, 0.94, 0.92]
    });
    window.LOTKIT.vehicle(B, 'sedan', 5.75, 5.6, PI, {tint: [0.23, 0.35, 0.48]});
    window.LOTKIT.vehicle(B, 'coupe', -13.2, 8.4, 0.25, {wreck: 'crashed', seed: 0});
    window.LOTKIT.vehicle(B, 'sedan', -10.6, 6.2, 1.9, {wreck: 'burnt', seed: 1});

    // lootable models (our prop kit): coolers, gondolas, wall shelf, register, snack machine; bay: workbench, tool chest, shelving, jerry cans
    const ry = a => (B.cs > 0 ? a : a + PI),
      SP = (lx, lz, name, table, a, y0) => {
        try {
          if (window.spawnPropContainer) spawnPropContainer(WX(B, lx), WZ(B, lz), name, table, ry(a), y0 || 0);
          else cont(B, table || 'gas', lx, lz);
        } catch (e) {}
      };
    for (let i = 0; i < 6; i++) SP(-9.3 + i * 0.76, -15.42, 'drinks_cooler', 'gas', 0);
    SP(-6.5, -11.2, 'shop_shelves_low', 'gas', 0);
    SP(-6.5, -8.6, 'shop_shelves_low', 'gas', PI);
    SP(-3.6, -11.2, 'shop_shelves_half', 'gas', 0);
    SP(-3.6, -8.6, 'shop_shelves_low', 'gas', PI);
    SP(1.57, -11.3, 'shop_shelf_wall', 'gas', -PI / 2);
    SP(1.15, -8.3, 'cash_register', 'gas', -PI / 2);
    SP(-9.45, -11.6, 'vending_snack', 'convenience', PI / 2);
    SP(-14.2, -15.35, 'tool_bench', 'hardware', 0);
    SP(-17.6, -12.5, 'tool_chest', 'hardware', PI / 2);
    SP(-10.45, -10.6, 'shop_shelf_wall', 'hardware', -PI / 2);
    SP(-17.55, -8.6, 'jerry_can', 'gas', PI / 2);
    SP(-17.55, -8.2, 'jerry_can', 'gas', PI / 2);
    SP(-10.6, -14.8, 'cardboard_box_medium', 'gas', 0);
    SP(6.6, -16.6, 'dumpster_green', 'house', 0);
    SP(-12.2, -3.3, 'propane_cylinder', 'hardware', 0);
    rc(B, 'gas', [-9.6, -0.4, -12.2, -5.4], 1);
    rc(B, 'gas', [-17.6, -10.6, -14.6, -5.0], 1);
    buildings.push({x: WX(B, -8), z: WZ(B, -10), w: 20, d: 12, t: t.id});
    for (const [px, pz] of [
      [-5, -7],
      [-7, -13],
      [-14, -12],
      [0, -14.5],
      [8, 6],
      [-12, 4],
      [14, -12]
    ].slice(0, ri(3, 6)))
      zombie(WX(B, px), WZ(B, pz));
    LASTB = B;
    return B;
  }

  if (typeof ruin === 'function') {
    const _r = ruin;
    ruin = function (x, z, t, lv) {
      if (t && t.id === 'eco_pump' && lv > 1) {
        arguments[3] = 1;
      }
      return _r.apply(this, arguments);
    };
  }
  const e = NEWCAT.find(d => d.id === 'eco_pump');
  if (e) {
    e.name = 'Nut & Bolt Gas Station';
    e.build = bNutBolt;
    e.note = 'full-block gas station: store + service bay, pump canopy, price pylon, propane, bus shelter';
  }
  if (typeof NOYARD !== 'undefined') NOYARD.add('eco_pump');
  window.bNutBolt = bNutBolt;
  window.NUTBOLT = {build, van, sedan};
  console.log('[gasstation] Nut & Bolt ready');
})();
