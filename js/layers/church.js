/* ==========================================================================================================
   MINI FORT ZOMBIE - AISLE BE BACK CHURCH (v072; on the lot kit since v081, the template for new lots): a full-block church (40 x 36 m plot, front = +Z), our own design.
   Exterior: a 14 x 22 m white clapboard nave on a stone plinth with dark timber buttresses banded in iron, lancet windows with leaded
   stained glass, a steep dark-shingle gable roof with half-timbered gables, a front tower (twin arched doors in a stone portal, porch
   skirt roof, a big traceried gothic window, second skirt roof, an open timber belfry with a bronze bell, a 10 m shingled spire with
   a flared base, and a cross); giant white praying-hands statues either side of the steps, a gabled message board, hedges and a stone
   path; a side lawn with trees and picnic tables, a parking lot with chain posts, a small graveyard behind a board fence, and the
   sidewalk (street lights, meters, a traffic signal, hydrant, no-parking sign).
   Interior: black / white marble checkerboard, dark panelled wainscot under mauve plaster with string mouldings, open roof with king-
   post trusses and purlins, two banks of carved pews, iron chandeliers, a raised red-carpeted chancel with steps, pipe organ, red
   curtains, brass candelabra, altar with cross and cloth, pulpit, hymn boards, baptismal font, a narthex in the tower with a guest
   book, notice board and pamphlet rack, and a tri-lancet window over the altar.
   Structure from core WL (doors / windows work); detail is our own geometry and painted artwork, outside the static merge.
   ========================================================================================================== */
(function () {
  'use strict';
  const K = window.MFZK,
    LK = window.LOTKIT; // v081: shared lot plumbing (js/props/lotkit.js)
  if (!K || !LK || typeof WL !== 'function' || typeof NEWCAT === 'undefined') {
    console.warn('[church] core / prop kit missing');
    return;
  }
  const T = THREE,
    P = K.P,
    PI = Math.PI;
  const NX0 = -14,
    NX1 = 0,
    NZ0 = -14,
    NZ1 = 8,
    H = 6.0,
    CX = -7,
    TW = 2.6,
    TZ1 = 12.6,
    RISE = 6.8,
    EAVE = 0.7;
  const SIDEW = [-11.5, -8.5, -5.5, -2.5, 0.5, 3.5];

  /* ===================== artwork ===================== */
  function lancetPath(c, x, y, w, h) {
    c.beginPath();
    c.moveTo(x, y + h);
    c.lineTo(x, y + w * 0.6);
    c.quadraticCurveTo(x, y, x + w / 2, y - w * 0.15);
    c.quadraticCurveTo(x + w, y, x + w, y + w * 0.6);
    c.lineTo(x + w, y + h);
    c.closePath();
  }
  // stained glass in a lancet: jewel colours under a diamond lead lattice
  const stained = (key, lights, o) =>
    K.paint(
      key,
      256,
      512,
      (c, W, H, r) => {
        c.clearRect(0, 0, W, H);
        const n = lights,
          pad = 12,
          lw = (W - pad * 2) / n;
        for (let i = 0; i < n; i++) {
          const x = pad + i * lw + 3,
            y = pad + (n > 1 ? 40 : 0),
            w = lw - 6,
            h = H - pad - y;
          c.save();
          lancetPath(c, x, y, w, h);
          c.clip();
          const cols = ['#7a1a2a', '#1a3a8a', '#c8902a', '#2a6a3a', '#5a2a7a', '#b83a1a'];
          for (let k = 0; k < 60; k++) {
            c.fillStyle = cols[Math.floor(r() * 6)];
            c.globalAlpha = 0.85;
            c.fillRect(x + r() * w, y + r() * h, 12 + r() * 30, 12 + r() * 30);
          }
          c.globalAlpha = 1;
          c.strokeStyle = 'rgba(20,16,12,.85)';
          c.lineWidth = 2;
          for (let d = -H; d < W + H; d += 18) {
            c.beginPath();
            c.moveTo(d, 0);
            c.lineTo(d + H, H);
            c.stroke();
            c.beginPath();
            c.moveTo(d, H);
            c.lineTo(d + H, 0);
            c.stroke();
          }
          if (o && o.cross && i === Math.floor(n / 2)) {
            c.fillStyle = '#f4e8a8';
            c.fillRect(x + w / 2 - 6, y + 60, 12, 140);
            c.fillRect(x + w / 2 - 34, y + 100, 68, 12);
          }
          c.restore();
          c.strokeStyle = '#e8dcc0';
          c.lineWidth = 8;
          lancetPath(c, x, y, w, h);
          c.stroke();
        }
        if (n > 1) {
          c.strokeStyle = '#e8dcc0';
          c.lineWidth = 10;
          lancetPath(c, pad, pad, W - pad * 2, H - pad * 2);
          c.stroke();
          c.fillStyle = 'rgba(240,230,190,.9)';
          c.beginPath();
          c.arc(W / 2, pad + 34, 20, 0, PI * 2);
          c.fill();
        }
      },
      {alpha: true, glow: (o && o.glow) || 0.35, r: 0.2}
    );
  // the lead came pattern alone (lets you see in; stays after the glass breaks)
  const leadTex = () =>
    K.paint(
      'cb_lead',
      128,
      128,
      (c, W, H) => {
        c.clearRect(0, 0, W, H);
        c.strokeStyle = 'rgba(30,26,20,.9)';
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
        c.fillStyle = 'rgba(200,150,60,.18)';
        c.fillRect(0, 0, W, H);
      },
      {alpha: true, r: 0.3}
    );

  const SURF = {};
  const surf = k =>
    SURF[k] ||
    (SURF[k] = {
      clap: () =>
        K.tri(
          'cb_clap',
          (c, W, H, r) => {
            const n = 8,
              s = H / n;
            for (let i = 0; i < n; i++) {
              const g = c.createLinearGradient(0, i * s, 0, i * s + s);
              g.addColorStop(0, '#c8c2bc');
              g.addColorStop(0.15, '#e8e2dc');
              g.addColorStop(0.9, '#d8d2cc');
              g.addColorStop(1, '#8a8480');
              c.fillStyle = g;
              c.fillRect(0, i * s, W, s);
            }
            for (let i = 0; i < 40; i++) {
              c.fillStyle = 'rgba(90,80,70,.12)';
              c.fillRect(r() * W, r() * H, 20 + r() * 80, 1.5);
            }
            P.grime(c, W, H, r, 0.6);
            for (let i = 0; i < 12; i++) {
              const g = c.createLinearGradient(0, 0, 0, H);
              g.addColorStop(0, 'rgba(60,55,50,.25)');
              g.addColorStop(1, 'rgba(60,55,50,0)');
              c.fillStyle = g;
              c.fillRect(r() * W, 0, 6 + r() * 20, H * r());
            }
          },
          {tile: 0.55, r: 0.85}
        ),
      timber: () =>
        K.tri(
          'cb_timber',
          (c, W, H, r) => {
            c.fillStyle = '#4a2e1e';
            c.fillRect(0, 0, W, H);
            for (let i = 0; i < 70; i++) {
              c.strokeStyle = `rgba(${30 + r() * 30},${16 + r() * 16},8,.5)`;
              c.lineWidth = 1 + r() * 2;
              c.beginPath();
              const x = r() * W;
              c.moveTo(x, 0);
              c.bezierCurveTo(x + r() * 10, H * 0.3, x - r() * 10, H * 0.6, x + r() * 6, H);
              c.stroke();
            }
            P.grime(c, W, H, r, 0.5);
          },
          {tile: 0.6, r: 0.8}
        ),
      shingle: () =>
        K.tri(
          'cb_shingle',
          (c, W, H, r) => {
            c.fillStyle = '#2a2826';
            c.fillRect(0, 0, W, H);
            const rows = 10,
              rh = H / rows;
            for (let j = 0; j < rows; j++)
              for (let i = -1; i < 9; i++) {
                const w = W / 8,
                  x = i * w + ((j % 2) * w) / 2 + (r() - 0.5) * 6,
                  l = 18 + r() * 16;
                c.fillStyle = `hsl(${210 + r() * 30},${6 + r() * 8}%,${l}%)`;
                c.fillRect(x + 1, j * rh + 1, w - 2, rh - 1);
                c.fillStyle = 'rgba(0,0,0,.45)';
                c.fillRect(x, j * rh + rh - 3, w, 3);
              }
            P.grime(c, W, H, r, 0.5);
          },
          {tile: 0.5, r: 0.9}
        ),
      stone: () =>
        K.tri(
          'cb_stone',
          (c, W, H, r) => {
            c.fillStyle = '#8a8884';
            c.fillRect(0, 0, W, H);
            const rh = H / 4;
            for (let j = 0; j < 4; j++) {
              let x = -(j % 2) * 30;
              while (x < W) {
                const w = 40 + r() * 50;
                c.fillStyle = `hsl(40,${4 + r() * 4}%,${62 + r() * 14}%)`;
                c.fillRect(x + 2, j * rh + 2, w - 4, rh - 4);
                x += w;
              }
            }
            P.noise(c, W, H, r, 5000, 0.25, '#4a4844', 1.5);
            P.grime(c, W, H, r, 0.5);
          },
          {tile: 0.5, r: 0.95}
        ),
      marble: () =>
        K.tri(
          'cb_marble',
          (c, W, H, r) => {
            const n = 2,
              s = W / n;
            for (let i = 0; i < n; i++)
              for (let j = 0; j < n; j++) {
                const g = (i + j) % 2;
                c.fillStyle = g ? '#141416' : '#ecece8';
                c.fillRect(i * s, j * s, s, s);
                for (let k = 0; k < 20; k++) {
                  c.strokeStyle = g ? 'rgba(120,120,130,.25)' : 'rgba(140,140,150,.3)';
                  c.lineWidth = 0.6 + r() * 1.6;
                  c.beginPath();
                  let x = i * s + r() * s,
                    y = j * s + r() * s;
                  c.moveTo(x, y);
                  for (let q = 0; q < 6; q++) {
                    x += (r() - 0.4) * 40;
                    y += (r() - 0.5) * 36;
                    c.lineTo(Math.min(i * s + s, Math.max(i * s, x)), Math.min(j * s + s, Math.max(j * s, y)));
                  }
                  c.stroke();
                }
                c.fillStyle = 'rgba(80,80,80,.45)';
                c.fillRect(i * s, j * s, s, 2);
                c.fillRect(i * s, j * s, 2, s);
              }
            P.grime(c, W, H, r, 0.25);
          },
          {tile: 0.62, r: 0.12}
        ),
      plaster: () =>
        K.tri(
          'cb_plaster',
          (c, W, H, r) => {
            c.fillStyle = '#9a8e92';
            c.fillRect(0, 0, W, H);
            for (let i = 0; i < 20; i++) {
              const g = c.createRadialGradient(r() * W, r() * H, 4, r() * W, r() * H, 40 + r() * 80);
              g.addColorStop(0, 'rgba(60,50,56,.25)');
              g.addColorStop(1, 'rgba(60,50,56,0)');
              c.fillStyle = g;
              c.fillRect(0, 0, W, H);
            }
            P.noise(c, W, H, r, 6000, 0.1, '#5a5056', 2);
          },
          {tile: 0.35, r: 0.9}
        ),
      wains: () =>
        K.tri(
          'cb_wains',
          (c, W, H, r) => {
            c.fillStyle = '#3a2418';
            c.fillRect(0, 0, W, H);
            const n = 4,
              s = W / n;
            for (let i = 0; i < n; i++) {
              const g = c.createLinearGradient(i * s, 0, i * s + s, 0);
              g.addColorStop(0, '#2a1810');
              g.addColorStop(0.15, '#5a3a26');
              g.addColorStop(0.85, '#4a2e1e');
              g.addColorStop(1, '#2a1810');
              c.fillStyle = g;
              c.fillRect(i * s + 6, 10, s - 12, H - 20);
            }
            P.grime(c, W, H, r, 0.3);
          },
          {tile: 0.8, r: 0.6}
        ),
      pew: () => K.veneer(0x6a4a2a, {tile: 0.6}),
      carpet: () =>
        K.tri(
          'cb_carpet',
          (c, W, H, r) => {
            c.fillStyle = '#8a1418';
            c.fillRect(0, 0, W, H);
            P.noise(c, W, H, r, 20000, 0.3, '#5a0a0e', 1.3);
            P.noise(c, W, H, r, 8000, 0.2, '#b82a2a', 1.3);
          },
          {tile: 0.5, r: 0.95}
        ),
      lawn: () => K.surf('lawn', 0x4a6a2a),
      asphalt: () => K.surf('asphalt', 0x3a3c40),
      concrete: () => K.surf('concrete', 0xb0aea6),
      dirt: () => K.surf('dirt', 0x5a4632),
      marbleW: () =>
        K.tri(
          'cb_mw',
          (c, W, H, r) => {
            c.fillStyle = '#e8e6e2';
            c.fillRect(0, 0, W, H);
            for (let k = 0; k < 30; k++) {
              c.strokeStyle = 'rgba(150,150,160,.3)';
              c.lineWidth = 0.6 + r() * 1.4;
              c.beginPath();
              let x = r() * W,
                y = r() * H;
              c.moveTo(x, y);
              for (let q = 0; q < 6; q++) {
                x += (r() - 0.4) * 50;
                y += (r() - 0.5) * 40;
                c.lineTo(x, y);
              }
              c.stroke();
            }
            P.grime(c, W, H, r, 0.4);
          },
          {tile: 0.5, r: 0.35}
        ),
      fence: () =>
        K.tri(
          'cb_fence',
          (c, W, H, r) => {
            const n = 8,
              s = W / n;
            for (let i = 0; i < n; i++) {
              c.fillStyle = `hsl(${10 + r() * 12},${10 + r() * 8}%,${36 + r() * 10}%)`;
              c.fillRect(i * s + 1, 0, s - 2, H);
              for (let k = 0; k < 20; k++) {
                c.fillStyle = 'rgba(0,0,0,.18)';
                c.fillRect(i * s + 3 + r() * (s - 6), r() * H, 1, 10 + r() * 40);
              }
            }
            c.fillStyle = '#1a120e';
            for (let i = 0; i < n; i++) c.fillRect(i * s, 0, 1, H);
            P.grime(c, W, H, r, 0.6);
          },
          {tile: 1.0, r: 0.9}
        ),
      leaves: () =>
        K.tri(
          'cb_leaf',
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
      hedge: () =>
        K.tri(
          'cb_hedge',
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
        )
    }[k]());

  /* ===================== the geometry (built once, in building-local coordinates) ===================== */
  let CACHE = null;
  const LOTTREES = [];
  function build() {
    if (CACHE) return CACHE;
    const G = LK.geo('aislebeback'),
      b = G.b,
      S = G.S;
    const chrome = K.chrome(),
      rnd = b.rnd,
      conc = surf('concrete'),
      dark = K.mat(0x1a1a1c, 0.5),
      iron = K.mat(0x8a8c90, 0.4, 0.7),
      brass = K.mat(0xc8a03a, 0.3, 0.9);
    const clap = surf('clap'),
      tim = surf('timber'),
      shin = surf('shingle'),
      ston = surf('stone'),
      mw = surf('marbleW');
    const Wn = a => a.map(c => ({k: 'w', c})),
      Dr = a => a.map(c => ({k: 'd', c}));
    /* ---------- grounds ---------- */
    LK.pavement(b, conc, {kerb: true});
    b.box(40, 0.02, 33.8, surf('lawn'), [0, 0.012, -1.0], null, 0);
    b.box(19, 0.03, 16.6, surf('asphalt'), [10.5, 0.02, -9.7], null, 0);
    for (let i = 0; i < 6; i++) b.box(5, 0.012, 0.1, K.mat(0xf2c418, 0.6), [15.5, 0.04, -4.0 - i * 2.6], null, 0);
    for (let i = 0; i < 5; i++)
      b.box(1.6, 0.12, 0.2, K.surf('concrete', 0x9a9890), [17.6, 0.07, -5.3 - i * 2.6], [0, PI / 2, 0], 0.03);
    for (let x = 1.6; x < 20; x += 2.4) {
      b.cyl(0.06, 0.06, 0.75, K.mat(0xd8d8d0, 0.5), [x, 0.38, -1.2], null, 8);
      if (x + 2.4 < 20)
        b.tube(
          [
            [x, 0.65, -1.2],
            [x + 1.2, 0.48, -1.2],
            [x + 2.4, 0.65, -1.2]
          ],
          0.012,
          iron,
          12,
          4
        );
    }
    b.box(2.4, 0.05, 3.3, ston, [CX, 0.04, 14.25], null, 0);
    for (let i = 0; i < 3; i++)
      b.box(3.0 - i * 0.2, 0.12, 0.35, ston, [CX, 0.06 + i * 0.12, TZ1 + 0.85 - i * 0.35], null, 0.02);
    b.box(1.4, 0.04, 13.6, surf('dirt'), [0.75, 0.03, 6.2], null, 0); // worn path down the side of the nave
    // hedges either side of the steps and along the front of the nave
    for (const x of [CX - 1.55, CX + 1.55]) b.rbox(0.5, 0.7, 3.0, 0.2, surf('hedge'), [x, 0.35, 14.2]);
    for (const [x0, x1] of [
      [NX0 + 0.4, CX - TW - 0.2],
      [CX + TW + 0.2, NX1 - 0.4]
    ])
      b.rbox(x1 - x0, 0.6, 0.6, 0.2, surf('hedge'), [(x0 + x1) / 2, 0.3, NZ1 + 0.6]);
    S(CX - 1.8, CX - 1.3, 12.7, 15.7, 0, 0.7, true);
    S(CX + 1.3, CX + 1.8, 12.7, 15.7, 0, 0.7, true);
    /* ---------- nave exterior: plinth, clapboard skin, buttresses, window frames ---------- */
    const skin = (ax, f, a0, a1, n, ops) => {
      ops = (ops || []).slice().sort((p, q) => p.c - q.c);
      const pc = (u0, u1, y0, y1, m, dep) => {
        if (u1 - u0 < 0.04 || y1 - y0 < 0.02) return;
        const o = f + n * (0.15 + dep / 2),
          u = (u0 + u1) / 2,
          y = (y0 + y1) / 2;
        if (ax) b.box(u1 - u0, y1 - y0, dep, m, [u, y, o], null, 0);
        else b.box(dep, y1 - y0, u1 - u0, m, [o, y, u], null, 0);
      };
      const span = (u0, u1, y0, y1) => {
        pc(u0, u1, y0, y1, clap, 0.03);
        if (y0 < 0.5) pc(u0, u1, y0, Math.min(0.5, y1), ston, 0.08);
      };
      let a = a0;
      for (const p of ops) {
        const hw = p.k === 'w' ? 0.75 : p.k === 'g' ? 0.8 : 0.65;
        span(a, p.c - hw, 0, H);
        if (p.k === 'w') {
          span(p.c - hw, p.c + hw, 0, 0.9);
          span(p.c - hw, p.c + hw, 2.75, H);
        } else span(p.c - hw, p.c + hw, p.k === 'g' ? 2.5 : 2.4, H);
        a = p.c + hw;
      }
      span(a, a1, 0, H);
    };
    skin(0, NX0, NZ0, NZ1, -1, Wn(SIDEW));
    skin(0, NX1, NZ0, NZ1, 1, Wn(SIDEW));
    skin(1, NZ0, NX0, NX1, -1, [
      {k: 'w', c: -11.5},
      {k: 'w', c: -2.5},
      {k: 'd', c: -1.1}
    ]);
    skin(1, NZ1, NX0, NX1, 1, [...Wn([-11.5, -2.5]), {k: 'g', c: CX - 0.8}, {k: 'g', c: CX + 0.8}]);
    // lancet window dressing: stone frame + arched head with stained glass above the opening, lead came across the opening (both faces)
    const lancet = (ax, f, cpos, n, inside) => {
      const w = 1.5,
        sg = stained('cb_sg1', 1),
        ld = leadTex();
      for (const side of [n, -n]) {
        const off = f + side * (side === n ? 0.2 : 0.18);
        const rot = ax ? [0, side > 0 ? 0 : PI, 0] : [0, side > 0 ? PI / 2 : -PI / 2, 0];
        const at = (y, z) => (ax ? [cpos, y, off] : [off, y, cpos]);
        b.label(w + 0.08, 2.4, sg, at(3.25, 0), rot);
        b.label(w, 1.85, ld, at(1.825, 0), rot);
        if (side === n) {
          const fr = ax ? [w + 0.3, 0.12, 0.16] : [0.16, 0.12, w + 0.3];
          b.box(fr[0], fr[1], fr[2], mw, at(0.84, 0), null, 0.01);
          for (const s of [-1, 1]) {
            const p = ax ? [cpos + s * (w / 2 + 0.08), 2.8, off] : [off, 2.8, cpos + s * (w / 2 + 0.08)];
            b.box(ax ? 0.14 : 0.14, 4.0, ax ? 0.14 : 0.14, mw, p, null, 0.01);
          }
          const pk = ax ? [cpos, 4.6, off] : [off, 4.6, cpos];
          b.box(ax ? 0.6 : 0.14, 0.14, ax ? 0.14 : 0.6, mw, pk, ax ? [0, 0, 0.6] : [0.6, 0, 0], 0.01);
        }
      }
    };
    for (const z of SIDEW) {
      lancet(0, NX0, z, -1);
      lancet(0, NX1, z, 1);
    }
    for (const x of [-11.5, -2.5]) lancet(1, NZ1, x, 1);
    for (const x of [-11.5, -2.5]) lancet(1, NZ0, x, -1);
    const band = K.mat(0x9a9ca0, 0.4, 0.7);
    const buttress = (x, z, dx, dz) => {
      b.push([x, 0, z]);
      b.box(dx ? 0.55 : 0.6, H + 0.3, dz ? 0.55 : 0.6, tim, [dx * 0.2, (H + 0.3) / 2, dz * 0.2], null, 0.02);
      b.box(dx ? 0.75 : 0.8, 0.5, dz ? 0.75 : 0.8, ston, [dx * 0.25, 0.25, dz * 0.25], null, 0.02);
      for (const y of [1.6, 3.6, 5.4])
        b.box(dx ? 0.6 : 0.66, 0.14, dz ? 0.6 : 0.66, band, [dx * 0.2, y, dz * 0.2], null, 0.01);
      b.box(
        dx ? 0.62 : 0.68,
        0.3,
        dz ? 0.62 : 0.68,
        tim,
        [dx * 0.24, H + 0.3, dz * 0.24],
        [dz * 0.4, 0, -dx * 0.4],
        0.02
      );
      b.pop();
      S(
        x + (dx < 0 ? -0.55 : -0.3),
        x + (dx > 0 ? 0.55 : 0.3),
        z + (dz < 0 ? -0.55 : -0.3),
        z + (dz > 0 ? 0.55 : 0.3),
        0,
        H,
        true
      );
    };
    for (const z of [-13.85, -10, -7, -4, -1, 2, 5, 7.85]) {
      buttress(NX0, z, -1, 0);
      buttress(NX1, z, 1, 0);
    }
    for (const x of [-13.85, -9.2, -4.8, -0.15]) buttress(x, NZ0, 0, -1);
    /* ---------- roof: shingle planes, ridge, fascia, half-timbered gables ---------- */
    const half = (NX1 - NX0) / 2 + EAVE,
      L = NZ1 - NZ0 + 1.2,
      ang = Math.atan2(RISE, half - EAVE),
      slope = Math.hypot(half, (RISE * half) / (half - EAVE));
    for (const s of [-1, 1]) {
      const cx = CX + (s * half) / 2,
        cy = H + (RISE * half) / (half - EAVE) / 2 - (RISE * EAVE) / (half - EAVE);
      b.box(
        slope,
        0.16,
        L,
        shin,
        [CX + s * (half / 2), H - (RISE * EAVE) / (half - EAVE) + (RISE * half) / (half - EAVE) / 2, (NZ0 + NZ1) / 2],
        [0, 0, -s * ang],
        0
      );
      b.box(
        slope,
        0.04,
        L,
        K.mat(0x3a2a1e, 0.8),
        [
          CX + s * (half / 2) - s * Math.sin(ang) * 0.1,
          H - (RISE * EAVE) / (half - EAVE) + (RISE * half) / (half - EAVE) / 2 - Math.cos(ang) * 0.1,
          (NZ0 + NZ1) / 2
        ],
        [0, 0, -s * ang],
        0
      );
    }
    b.box(0.3, 0.3, L + 0.1, K.mat(0x2a2624, 0.6), [CX, H + RISE + 0.05, (NZ0 + NZ1) / 2], [0, 0, PI / 4], 0);
    const gable = (z, n) => {
      b.add(
        K.extrudeGeo(
          [
            [NX0 - 0.1, H],
            [NX1 + 0.1, H],
            [CX, H + RISE]
          ],
          0.3,
          0
        ),
        clap,
        {p: [0, 0, z]}
      );
      const zz = z + n * 0.17;
      b.box(NX1 - NX0 + 0.2, 0.28, 0.12, tim, [CX, H + 0.14, zz], null, 0.01);
      for (const dx of [-4.6, -2.3, 0, 2.3, 4.6]) {
        const hh = RISE * (1 - Math.abs(dx) / 7) - 0.3;
        if (hh > 0.3) b.box(0.22, hh, 0.1, tim, [CX + dx, H + 0.28 + hh / 2, zz], null, 0);
      }
      b.box(7.6, 0.22, 0.1, tim, [CX, H + 2.6, zz], null, 0);
      for (const s of [-1, 1])
        b.box(
          Math.hypot(7.2, RISE) + 0.3,
          0.26,
          0.14,
          K.mat(0x2a2624, 0.6),
          [CX + s * 3.6, H + RISE / 2, z + n * 0.22],
          [0, 0, -s * Math.atan2(RISE, 7.2)],
          0
        );
    };
    gable(NZ0, -1);
    gable(NZ1, 1);
    b.label(3.6, 3.0, stained('cb_sg3', 3, {cross: 1, glow: 0.4}), [CX, H + 2.2, NZ0 - 0.2], [0, PI, 0]);
    b.label(3.6, 3.0, stained('cb_sg3', 3, {cross: 1, glow: 0.4}), [CX, H + 2.2, NZ0 + 0.2]);
    /* ---------- tower ---------- */
    const TX0 = CX - TW,
      TX1 = CX + TW;
    skin(0, TX0, NZ1, TZ1, -1, []);
    skin(0, TX1, NZ1, TZ1, 1, []);
    skin(1, TZ1, TX0, TX1, 1, [
      {k: 'd', c: CX - 0.75},
      {k: 'd', c: CX + 0.75}
    ]);
    const TH = 13.2;
    // v090: nothing of the tower may cross the nave's front wall (z NZ1): the tower box, the two skirt roofs and their shingle
    // frustums stuck 0.2-1.1 m into the nave over the doors (the big square seen from the altar). Their nave side now stops at ZB.
    const ZB = NZ1 + 0.05;
    b.box(TW * 2 + 0.36, TH - H, TZ1 + 0.18 - ZB, clap, [CX, H + (TH - H) / 2, (ZB + TZ1 + 0.18) / 2], null, 0);
    const frust = (rt, rb, h, y, z, m, zc, clip) => {
      if (!clip)
        return b.add(new T.CylinderGeometry(rt, rb, h, 4, 1, true), m, {
          p: [CX, y, zc],
          r: [0, PI / 4, 0],
          s: [1, 1, 1]
        });
      const g = new T.CylinderGeometry(rt, rb, h, 4, 1, true).rotateY(PI / 4),
        hz = rb / Math.SQRT2,
        zf = zc + hz;
      g.scale(1, 1, (zf - ZB) / (2 * hz));
      return b.add(g, m, {p: [CX, y, (zf + ZB) / 2]});
    };
    const tz = (NZ1 + TZ1) / 2,
      tr = TW * Math.SQRT2;
    frust(tr * 1.0, tr * 1.32, 1.3, 4.25 + 0.65, 0, shin, tz, true);
    b.box(TW * 2 + 1.2, 0.12, TZ1 + 0.6 - ZB, K.mat(0x2a2624, 0.6), [CX, 4.25, (ZB + TZ1 + 0.6) / 2], null, 0.01); // porch skirt roof
    b.label(2.4, 3.4, stained('cb_sg2', 3, {glow: 0.45}), [CX, 7.6, TZ1 + 0.2]);
    b.box(2.7, 0.16, 0.2, mw, [CX, 5.85, TZ1 + 0.25], null, 0.01);
    for (const s of [-1, 1]) b.box(0.16, 3.6, 0.2, mw, [CX + s * 1.3, 7.6, TZ1 + 0.25], null, 0.01);
    b.add(
      K.extrudeGeo(
        [
          [-1.4, 0],
          [1.4, 0],
          [0, 1.0]
        ],
        0.2,
        0
      ),
      mw,
      {p: [CX, 9.35, TZ1 + 0.25]}
    );
    frust(tr * 1.0, tr * 1.32, 1.2, 10.2, 0, shin, tz, true);
    b.box(TW * 2 + 1.1, 0.12, TZ1 + 0.55 - ZB, K.mat(0x2a2624, 0.6), [CX, 9.6, (ZB + TZ1 + 0.55) / 2], null, 0.01);
    // belfry: timber posts and rails, louvres, the bell; then the spire
    const BY = TH,
      BH = 3.4;
    b.box(TW * 2 + 0.3, 0.3, TZ1 - NZ1 + 0.3, K.mat(0xe8e4dc, 0.7), [CX, BY + 0.15, tz], null, 0.01);
    for (const [dx, dz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0]
    ])
      b.box(0.42, BH, 0.42, tim, [CX + dx * (TW - 0.1), BY + BH / 2 + 0.3, tz + dz * (TW - 0.1)], null, 0.01);
    for (const s of [-1, 1]) {
      b.box(TW * 2, 0.3, 0.3, tim, [CX, BY + BH + 0.15, tz + s * (TW - 0.1)], null, 0.01);
      b.box(0.3, 0.3, TW * 2, tim, [CX + s * (TW - 0.1), BY + BH + 0.15, tz], null, 0.01);
      b.box(TW * 2, 0.18, 0.2, tim, [CX, BY + 1.1, tz + s * (TW - 0.1)], null, 0.01);
      b.box(0.2, 0.18, TW * 2, tim, [CX + s * (TW - 0.1), BY + 1.1, tz], null, 0.01);
    }
    b.lathe(
      [
        [0, 0],
        [0.75, 0],
        [0.72, 0.12],
        [0.62, 0.5],
        [0.5, 0.9],
        [0.38, 1.05],
        [0.12, 1.12],
        [0, 1.14]
      ],
      K.mat(0xa8782a, 0.35, 0.85),
      [CX, BY + 1.2, tz],
      24
    );
    b.cyl(0.06, 0.06, 0.5, dark, [CX, BY + 2.5, tz], null, 8);
    b.box(1.6, 0.2, 0.2, tim, [CX, BY + 2.75, tz], null, 0.01);
    b.sph(0.1, dark, [CX, BY + 1.15, tz]);
    frust(tr * 0.86, tr * 1.18, 1.0, BY + BH + 0.8, 0, shin, tz);
    const SPY = BY + BH + 1.3,
      SPH = 10;
    b.add(new T.ConeGeometry(tr * 0.86, SPH, 4, 1, true), shin, {p: [CX, SPY + SPH / 2, tz], r: [0, PI / 4, 0]});
    b.box(0.24, 2.6, 0.24, K.mat(0xc8c4bc, 0.4, 0.3), [CX, SPY + SPH + 1.1, tz], null, 0.02);
    b.box(1.4, 0.24, 0.24, K.mat(0xc8c4bc, 0.4, 0.3), [CX, SPY + SPH + 1.6, tz], null, 0.02);
    b.cyl(0.2, 0.14, 0.3, K.mat(0xc8c4bc, 0.4, 0.3), [CX, SPY + SPH - 0.1, tz], null, 8);
    // stone portal round the twin doors
    b.push([CX, 0, TZ1 + 0.17]);
    for (const s of [-1, 0, 1]) b.box(s ? 0.5 : 0.3, 2.6, 0.36, ston, [s * 1.5, 1.3, 0.1], null, 0.02);
    for (const s of [-1, 1]) {
      b.add(
        K.extrudeGeo(
          [
            [-0.85, 0],
            [0.85, 0],
            [0.85, 0.25],
            [0, 0.95],
            [-0.85, 0.25]
          ],
          0.4,
          0.02
        ),
        ston,
        {p: [s * 0.75, 2.5, 0.12]}
      );
      b.add(
        K.extrudeGeo(
          [
            [-0.6, 0],
            [0, 0.6],
            [0.6, 0],
            [0.45, 0],
            [0, 0.42],
            [-0.45, 0]
          ],
          0.5, // v089: was 0.42, which put its face exactly on the stone gable's bevelled face (both at z 0.34): z-fighting triangles
          0
        ),
        K.mat(0xe8e4dc, 0.5),
        {p: [s * 0.75, 2.45, 0.13]}
      );
    }
    b.add(new T.ConeGeometry(0.22, 0.9, 4), ston, {p: [0, 3.3, 0.12], r: [0, PI / 4, 0]});
    b.label(
      1.1,
      0.25,
      K.paint(
        'cb_lintel',
        300,
        68,
        (c, W, H) => {
          c.clearRect(0, 0, W, H);
          P.text(c, 'AISLE BE BACK', W / 2, H / 2, {size: 40, col: '#3a3634', font: "'MFZ Head'"});
        },
        {alpha: true}
      ),
      [0, 3.75, 0.31]
    );
    b.pop();
    /* ---------- praying-hands statues (our own sculpt) ---------- */
    const hands = (x, z, ry) => {
      b.push([x, 0, z], [0, ry, 0]);
      b.box(1.6, 0.5, 1.2, ston, [0, 0.25, 0], null, 0.03);
      b.box(1.3, 0.2, 1.0, mw, [0, 0.6, 0], null, 0.02);
      b.push([0, 0.7, 0]);
      for (const s of [-1, 1]) {
        b.push([s * 0.12, 0, 0], [0, 0, s * 0.12]);
        b.rbox(0.5, 1.1, 0.16, 0.07, mw, [0, 0.55, s * 0.02], [0, 0, 0]);
        b.rbox(0.34, 0.5, 0.4, 0.12, mw, [s * 0.05, 0.0, 0.0]);
        for (let f = 0; f < 4; f++) {
          const fl = [0.95, 1.1, 1.05, 0.85][f];
          b.add(K.rboxGeo(0.11, fl, 0.13, 0.05, 2), mw, {
            p: [-0.18 + f * 0.12, 1.1 + fl / 2, s * 0.0],
            r: [0, 0, (f - 1.5) * 0.03]
          });
        }
        b.add(K.rboxGeo(0.12, 0.55, 0.13, 0.05, 2), mw, {p: [0.3 * s * 0 + 0.27, 0.75, s * 0.06], r: [0, 0, -0.4]});
        b.pop();
      }
      b.cyl(0.2, 0.24, 0.5, mw, [0, -0.1, 0], null, 14);
      b.pop();
      b.pop();
      S(x - 0.8, x + 0.8, z - 0.6, z + 0.6, 0, 3.0, true);
    };
    hands(CX - 4.8, 14.4, 0.2);
    hands(CX + 4.8, 14.4, -0.2);
    /* ---------- message board ---------- */
    b.push([CX + 2.9, 0, 15.3], [0, -0.1, 0]);
    for (const s of [-1, 1]) b.box(0.14, 2.0, 0.14, K.mat(0xf2f2ee, 0.6), [s * 0.95, 1.0, 0], null, 0.01);
    b.box(2.0, 1.1, 0.12, K.mat(0xf2f2ee, 0.6), [0, 1.35, 0], null, 0.02);
    b.add(
      K.extrudeGeo(
        [
          [-1.15, 0],
          [1.15, 0],
          [0, 0.45]
        ],
        0.4,
        0.02
      ),
      shin,
      {p: [0, 1.95, 0]}
    );
    for (const sd of [1, -1])
      b.label(
        1.84,
        0.96,
        K.paint(
          'cb_board',
          512,
          268,
          (c, W, H) => {
            c.fillStyle = '#f8f8f4';
            c.fillRect(0, 0, W, H);
            c.strokeStyle = '#2a2a2a';
            c.lineWidth = 6;
            c.strokeRect(8, 8, W - 16, H - 16);
            P.text(c, 'AISLE BE BACK CHURCH', W / 2, 40, {size: 34, col: '#1a1a1a'});
            P.text(c, '"REPENT! THE END IS NIGH"', W / 2, 96, {size: 30, col: '#1a1a1a'});
            P.text(c, 'SUNDAY SERVICE 10AM', W / 2, 148, {size: 32, col: '#b81a1a'});
            P.text(c, 'ALL SOULS WELCOME', W / 2, 196, {size: 26, col: '#1a1a1a'});
            P.text(c, '(LIVING PREFERRED)', W / 2, 232, {size: 22, col: '#555'});
          },
          {r: 0.5}
        ),
        [0, 1.35, sd * 0.065],
        [0, sd > 0 ? 0 : PI, 0]
      );
    b.pop();
    S(CX + 1.85, CX + 3.95, 15.1, 15.5, 0, 2.2, true);
    /* ---------- side lawn: trees, picnic tables, a bench; graveyard; fence ---------- */
    const leaf = surf('leaves'),
      bark = K.surf('bark', 0x5a4a3a);
    const tree = (x, z, s) => {
      if (!LOTTREES.some(q => q[0] === x && q[1] === z)) LOTTREES.push([x, z, s]);
    }; /* v074: real flora trees, planted per instance (bldTree) */
    tree(6, 10.5, 1.2);
    tree(11.5, 4.5, 1.1);
    tree(15.5, 11, 1.0);
    tree(-17.2, 6.5, 0.9);
    const pt = K.mat(0x1e1a18, 0.7);
    for (const [x, z, ry] of [
      [8.8, 6.2, 0.1],
      [12.6, 8.8, -0.2],
      [5.8, 4.2, 0.3]
    ]) {
      b.push([x, 0, z], [0, ry, 0]);
      b.box(1.8, 0.06, 0.72, pt, [0, 0.74, 0], null, 0.01);
      for (const s of [-1, 1]) {
        b.box(1.8, 0.05, 0.28, pt, [0, 0.45, s * 0.6], null, 0.01);
        // v101: proper A-frame ends: each leg runs from under the table top out past the seat to the ground
        // (it used to lean the wrong way and stop short of the seats), plus bearers under the seats and the top
        for (const e of [0.8, -0.8]) b.box(0.07, 0.94, 0.07, pt, [e, 0.36, s * 0.5], [-s * 0.695, 0, 0], 0);
      }
      for (const e of [0.8, -0.8]) {
        b.box(0.07, 0.06, 1.56, pt, [e, 0.4, 0], null, 0);
        b.box(0.07, 0.06, 0.5, pt, [e, 0.7, 0], null, 0);
      }
      b.pop();
      S(x - 0.95, x + 0.95, z - 0.8, z + 0.8, 0, 0.78, true);
    }
    for (let i = 0; i < 10; i++) {
      const x = -18.0 + (i % 2) * 1.8,
        z = -12 + Math.floor(i / 2) * 3.2,
        ry = (rnd() - 0.5) * 0.2;
      b.push([x, 0, z], [0, PI / 2 + ry, 0]);
      const kind = i % 3;
      if (kind === 0) {
        b.rbox(0.7, 0.9, 0.16, 0.06, K.surf('stone', 0x8a8884), [0, 0.45, 0]);
        b.add(new T.CylinderGeometry(0.35, 0.35, 0.16, 16, 1, false, 0, PI), K.surf('stone', 0x8a8884), {
          p: [0, 0.9, 0],
          r: [PI / 2, 0, 0]
        });
      } else if (kind === 1) {
        b.box(0.12, 1.2, 0.12, K.surf('stone', 0x9a9894), [0, 0.6, 0], null, 0.01);
        b.box(0.6, 0.12, 0.12, K.surf('stone', 0x9a9894), [0, 0.9, 0], null, 0.01);
      } else b.rbox(0.8, 0.5, 0.3, 0.05, K.surf('stone', 0x7a7874), [0, 0.25, 0], [-0.2, 0, 0]);
      b.box(0.8, 0.04, 1.6, surf('dirt'), [0, 0.03, 0.95], null, 0);
      b.pop();
      S(x - 0.15, x + 0.15, z - 0.4, z + 0.4, 0, 1.2, true);
    }
    const fen = surf('fence'),
      post = K.surf('wood', 0x3a2a1e);
    const fenceRun = (x0, z0, x1, z1) => {
      const Lr = Math.hypot(x1 - x0, z1 - z0),
        a = Math.atan2(z1 - z0, x1 - x0);
      b.box(Lr, 1.7, 0.06, fen, [(x0 + x1) / 2, 0.9, (z0 + z1) / 2], [0, -a, 0], 0);
      for (let s = 0; s <= Lr; s += 2.5) {
        const x = x0 + ((x1 - x0) * s) / Lr,
          z = z0 + ((z1 - z0) * s) / Lr;
        b.box(0.12, 1.85, 0.12, post, [x, 0.92, z], null, 0);
      }
      S(
        Math.min(x0, x1) - 0.05,
        Math.max(x0, x1) + 0.05,
        Math.min(z0, z1) - 0.05,
        Math.max(z0, z1) + 0.05,
        0,
        1.8,
        true
      );
    };
    fenceRun(-19.7, -17.8, 1.2, -17.8);
    fenceRun(-19.7, -17.8, -19.7, 12.5);
    fenceRun(19.7, -17.8, 19.7, -2);
    /* ---------- sidewalk: street lights, meters, traffic signal, hydrant, no parking (v081: lot kit) ---------- */
    LK.lightPole(b, S, -17.5);
    LK.lightPole(b, S, 3.5);
    for (const x of [-13, 7]) LK.meter(b, S, x);
    LK.signal(b, S, 19.2);
    LK.hydrant(b, S, -5.2);
    LK.noParking(b, -4.3, {key: 'cb_nopark', lines: ['SERVICES', 'SUN 8-1']});
    /* ---------- interior: floor, wainscot, plaster, mouldings, trusses ---------- */
    b.box(13.7, 0.02, 21.7, surf('marble'), [CX, 0.035, (NZ0 + NZ1) / 2], null, 0);
    b.box(TW * 2 - 0.3, 0.02, TZ1 - NZ1 - 0.3, surf('marble'), [CX, 0.036, (NZ1 + TZ1) / 2], null, 0);
    b.box(3.3, 0.025, 0.5, mw, [CX, 0.037, NZ1], null, 0);
    const pl = surf('plaster'),
      wa = surf('wains'),
      mould = K.mat(0x5a4a44, 0.6);
    // v081: the opening walk is L.lineWall; this lot's layers are wainscot, chair rail, plaster and two string mouldings
    const span = (pc, u0, u1, y0, y1) => {
      if (y0 < 1.4) pc(u0, u1, y0, Math.min(1.4, y1), wa, 0.03, 0.015);
      if (y0 <= 1.4 && y1 >= 1.48) pc(u0, u1, 1.4, 1.48, mould, 0.07, 0.035);
      if (y1 > 1.4) pc(u0, u1, Math.max(1.42, y0), y1, pl, 0.012, 0.006);
      for (const yy of [3.2, 5.0]) if (y0 <= yy && y1 >= yy + 0.1) pc(u0, u1, yy, yy + 0.1, mould, 0.06, 0.03);
    };
    const lineWall = (ax, f, a0, a1, n, ops, top) => LK.lineWall(b, ax, f, a0, a1, n, ops, top || H, span);
    lineWall(0, NX0, NZ0, NZ1, 1, Wn(SIDEW));
    lineWall(0, NX1, NZ0, NZ1, -1, Wn(SIDEW));
    lineWall(1, NZ0, NX0, NX1, 1, [
      {k: 'w', c: -11.5},
      {k: 'w', c: -2.5},
      {k: 'd', c: -1.1}
    ]);
    lineWall(1, NZ1, NX0, NX1, -1, [...Wn([-11.5, -2.5]), {k: 'g', c: CX - 0.8}, {k: 'g', c: CX + 0.8}]);
    lineWall(0, TX0, NZ1, TZ1, 1, [], 4.2);
    lineWall(0, TX1, NZ1, TZ1, -1, [], 4.2);
    lineWall(
      1,
      TZ1,
      TX0,
      TX1,
      -1,
      [
        {k: 'd', c: CX - 0.75},
        {k: 'd', c: CX + 0.75}
      ],
      4.2
    );
    b.box(TW * 2 - 0.3, 0.08, TZ1 - NZ1 - 0.3, K.veneer(0x4a2e1e, {tile: 0.6}), [CX, 4.2, (NZ1 + TZ1) / 2], null, 0);
    // interior gable plaster + roof underside boards, trusses, purlins
    for (const [z, n] of [
      [NZ0 + 0.17, 1],
      [NZ1 - 0.17, -1]
    ])
      b.add(
        K.extrudeGeo(
          [
            [NX0 + 0.15, H],
            [NX1 - 0.15, H],
            [CX, H + RISE - 0.3]
          ],
          0.02,
          0
        ),
        pl,
        {p: [0, 0, z]}
      );
    const boards = K.tri(
      'cb_boards',
      (c, W, H, r) => {
        const n = 8,
          s = W / n;
        for (let i = 0; i < n; i++) {
          c.fillStyle = `hsl(25,${30 + r() * 10}%,${18 + r() * 8}%)`;
          c.fillRect(i * s + 1, 0, s - 2, H);
        }
        P.grime(c, W, H, r, 0.4);
      },
      {tile: 0.5, r: 0.8}
    );
    const inH = (NX1 - NX0) / 2 - 0.15,
      inS = Math.hypot(inH, RISE - 0.3),
      inA = Math.atan2(RISE - 0.3, inH);
    for (const s of [-1, 1])
      b.box(
        inS,
        0.03,
        NZ1 - NZ0 - 0.3,
        boards,
        [CX + (s * inH) / 2, H + (RISE - 0.3) / 2 - 0.05, (NZ0 + NZ1) / 2],
        [0, 0, -s * inA],
        0
      );
    for (let z = NZ0 + 2.2; z < NZ1 - 1; z += 3.0) {
      b.box(NX1 - NX0 - 0.3, 0.3, 0.24, tim, [CX, H + 0.2, z], null, 0.01);
      b.box(0.24, RISE - 0.5, 0.24, tim, [CX, H + (RISE - 0.5) / 2 + 0.2, z], null, 0.01);
      for (const s of [-1, 1]) {
        b.box(inS, 0.28, 0.22, tim, [CX + (s * inH) / 2, H + (RISE - 0.3) / 2 - 0.2, z], [0, 0, -s * inA], 0.01);
        b.box(0.18, 2.6, 0.18, tim, [CX + s * 2.2, H + 1.5, z], [0, 0, s * 0.6], 0.01);
      }
      b.box(0.06, 0.06, 1.0, iron, [CX, H + 0.36, z], null, 0);
    }
    for (const t of [0.33, 0.66])
      for (const s of [-1, 1])
        b.box(
          0.16,
          0.16,
          NZ1 - NZ0 - 0.3,
          tim,
          [CX + s * inH * t, H + (RISE - 0.3) * (1 - t) - 0.12, (NZ0 + NZ1) / 2],
          null,
          0
        );
    // iron chandeliers
    for (const z of [-6, 1]) {
      b.cyl(0.012, 0.012, 4.0, iron, [CX, H + 2.2, z], null, 4);
      b.add(K.torGeo(0.9, 0.03, 6, 32), iron, {p: [CX, 4.2, z], r: [PI / 2, 0, 0]});
      b.add(K.torGeo(0.5, 0.025, 6, 24), iron, {p: [CX, 4.5, z], r: [PI / 2, 0, 0]});
      for (let k = 0; k < 10; k++) {
        const a = (k * PI) / 5;
        b.cyl(0.025, 0.025, 0.18, K.mat(0xf4f0e0, 0.6), [CX + Math.cos(a) * 0.9, 4.32, z + Math.sin(a) * 0.9], null, 6);
        b.add(
          new T.ConeGeometry(0.025, 0.06, 6),
          K.mat(0xffd27a, 0.4, 0, {emissive: 0xffb040, emissiveIntensity: 0.9}),
          {p: [CX + Math.cos(a) * 0.9, 4.45, z + Math.sin(a) * 0.9]}
        );
      }
      for (let k = 0; k < 4; k++) {
        const a = (k * PI) / 2;
        b.cyl(
          0.01,
          0.01,
          1.0,
          iron,
          [CX + Math.cos(a) * 0.45, 4.6, z + Math.sin(a) * 0.45],
          [Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4],
          4
        );
      }
    }
    /* ---------- pews ---------- */
    const pw = surf('pew');
    const pew = (x, z, len) => {
      b.push([x, 0, z]);
      b.box(len, 0.06, 0.42, pw, [0, 0.44, 0], null, 0.01);
      b.box(len, 0.6, 0.05, pw, [0, 0.85, -0.2], [-0.12, 0, 0], 0.005);
      b.box(len, 0.05, 0.08, pw, [0, 1.16, -0.24], null, 0.01);
      b.box(len, 0.25, 0.03, pw, [0, 0.28, -0.15], null, 0);
      for (const s of [-1, 1]) {
        b.box(0.07, 1.0, 0.55, pw, [(s * len) / 2, 0.5, -0.05], null, 0.01);
        b.add(new T.CylinderGeometry(0.28, 0.28, 0.07, 12, 1, false, 0, PI), pw, {
          p: [(s * len) / 2, 1.0, -0.05],
          r: [0, 0, PI / 2]
        });
      }
      b.box(len - 0.1, 0.05, 0.18, pw, [0, 0.75, -0.38], null, 0);
      b.pop();
      S(x - len / 2 - 0.05, x + len / 2 + 0.05, z - 0.42, z + 0.25, 0, 1.1, true);
    };
    for (let i = 0; i < 10; i++) {
      const z = 4.4 - i * 1.15;
      pew(-10.55, z, 4.2);
      pew(-3.45, z, 4.2);
    }
    /* ---------- chancel ---------- */
    const cp = surf('carpet'),
      CZ1 = -9.0;
    b.box(13.7, 0.4, 4.85, cp, [CX, 0.2, (NZ0 + 0.15 + CZ1) / 2], null, 0.01);
    b.box(5.0, 0.2, 0.45, cp, [CX, 0.1, CZ1 + 0.225], null, 0.01);
    b.box(13.7, 0.04, 0.06, brass, [CX, 0.41, CZ1 - 0.02], null, 0);
    // organ: case, pipe flats, keydesk
    b.push([CX, 0.4, NZ0 + 0.75]);
    const oc = K.veneer(0x4a2e1e, {tile: 0.6});
    b.box(3.4, 1.2, 1.0, oc, [0, 0.6, 0], null, 0.02);
    b.box(3.6, 0.12, 1.1, oc, [0, 1.25, 0], null, 0.02);
    for (const [w, x, h] of [
      [1.2, 0, 3.4],
      [0.9, -1.1, 2.6],
      [0.9, 1.1, 2.6]
    ]) {
      b.box(w + 0.1, h, 0.6, oc, [x, 1.3 + h / 2, -0.15], null, 0.02);
      b.box(w + 0.2, 0.15, 0.7, oc, [x, 1.3 + h + 0.07, -0.15], null, 0.02);
      const n = Math.round(w / 0.13);
      for (let k = 0; k < n; k++) {
        const ph = h * 0.55 + Math.sin((k / (n - 1)) * PI) * h * 0.35 * (x === 0 ? 1 : -0.5) + (x === 0 ? 0 : h * 0.2);
        b.cyl(
          0.05,
          0.05,
          ph,
          K.mat(0xd8dadc, 0.25, 0.95),
          [x - w / 2 + 0.07 + (k * w) / n, 1.4 + ph / 2, 0.17],
          null,
          10
        );
        b.add(new T.ConeGeometry(0.05, 0.1, 10), K.mat(0xd8dadc, 0.25, 0.95), {
          p: [x - w / 2 + 0.07 + (k * w) / n, 1.4, 0.17],
          r: [PI, 0, 0]
        });
      }
    }
    b.box(1.6, 0.05, 0.3, K.mat(0xf4f0e0, 0.4), [0, 0.95, 0.5], [-0.15, 0, 0], 0);
    b.box(1.6, 0.05, 0.3, K.mat(0x1a1a1a, 0.4), [0, 1.02, 0.42], [-0.15, 0, 0], 0);
    b.box(1.2, 0.5, 0.35, oc, [0, 0.25, 1.0], null, 0.02);
    b.pop();
    S(CX - 1.8, CX + 1.8, NZ0 + 0.15, NZ0 + 1.4, 0, 4.5, true);
    // curtains, candelabra, altar, pulpit, hymn boards, font
    const cur = K.tri(
      'cb_curtain',
      (c, W, H, r) => {
        const n = 12,
          s = W / n;
        for (let i = 0; i < n; i++) {
          const g = c.createLinearGradient(i * s, 0, i * s + s, 0);
          g.addColorStop(0, '#5a0a0e');
          g.addColorStop(0.5, '#c41a22');
          g.addColorStop(1, '#5a0a0e');
          c.fillStyle = g;
          c.fillRect(i * s, 0, s, H);
        }
      },
      {tile: 0.6, r: 0.9}
    );
    for (const s of [-1, 1]) {
      b.box(1.4, 4.6, 0.12, cur, [CX + s * 3.0, 2.7, NZ0 + 0.35], null, 0);
      b.cyl(0.04, 0.04, 1.6, brass, [CX + s * 3.0, 5.02, NZ0 + 0.3], [0, 0, PI / 2], 8);
      b.tor(0.25, 0.03, K.mat(0xc8a03a, 0.3, 0.8), [CX + s * 2.5, 1.9, NZ0 + 0.42], [0, 0, 0], null, 12);
    }
    const candelabra = (x, z) => {
      b.cyl(0.18, 0.22, 0.06, brass, [x, 0.43, z], null, 14);
      b.lathe(
        [
          [0, 0],
          [0.06, 0],
          [0.04, 0.3],
          [0.05, 0.5],
          [0.025, 0.9],
          [0.04, 1.0],
          [0.02, 1.3],
          [0, 1.3]
        ],
        brass,
        [x, 0.46, z],
        12
      );
      b.add(K.torGeo(0.22, 0.015, 6, 16, PI), brass, {p: [x, 1.7, z], r: [0, 0, PI]});
      for (const dx of [-0.22, 0, 0.22]) {
        b.cyl(0.02, 0.02, 0.2, K.mat(0xf4f0e0, 0.6), [x + dx, dx ? 1.82 : 1.9, z], null, 6);
        b.add(
          new T.ConeGeometry(0.02, 0.05, 6),
          K.mat(0xffd27a, 0.4, 0, {emissive: 0xffb040, emissiveIntensity: 0.9}),
          {p: [x + dx, dx ? 1.95 : 2.03, z]}
        );
      }
    };
    for (const dx of [-4.6, -2.2, 2.2, 4.6]) candelabra(CX + dx, CZ1 - 0.6 - (Math.abs(dx) > 3 ? 1.5 : 0));
    b.push([CX, 0.4, -11.8]);
    b.box(2.2, 0.9, 0.9, K.veneer(0x4a2e1e, {tile: 0.6}), [0, 0.45, 0], null, 0.02);
    b.box(2.4, 0.02, 1.0, K.mat(0xf4f0e8, 0.7), [0, 0.91, 0], null, 0);
    b.box(0.9, 0.6, 1.02, K.mat(0x7a1418, 0.7), [0, 0.62, 0], null, 0);
    b.box(0.06, 0.5, 0.04, brass, [0, 1.17, 0], null, 0);
    b.box(0.3, 0.06, 0.04, brass, [0, 1.3, 0], null, 0);
    b.add(K.rboxGeo(0.3, 0.05, 0.22, 0.01, 1), K.mat(0x1a1410, 0.6), {p: [0.6, 0.95, 0.1], r: [0, 0.3, 0]});
    for (const s of [-0.8, 0.8]) {
      b.cyl(0.06, 0.08, 0.04, brass, [s, 0.93, -0.2], null, 10);
      b.cyl(0.025, 0.025, 0.3, K.mat(0xf4f0e0, 0.6), [s, 1.1, -0.2], null, 6);
    }
    b.pop();
    S(CX - 1.2, CX + 1.2, -12.3, -11.3, 0, 1.4, true);
    b.push([CX + 4.2, 0.4, CZ1 - 0.9], [0, -0.5, 0]);
    b.lathe(
      [
        [0, 0],
        [0.45, 0],
        [0.42, 0.1],
        [0.3, 0.2],
        [0.3, 0.9],
        [0.5, 1.0],
        [0.5, 1.15],
        [0, 1.15]
      ],
      K.veneer(0x4a2e1e, {tile: 0.6}),
      [0, 0, 0],
      8
    );
    b.box(0.7, 0.04, 0.5, K.veneer(0x4a2e1e, {tile: 0.6}), [0, 1.2, 0], [-0.3, 0, 0], 0);
    b.box(0.5, 0.03, 0.35, K.mat(0xf4f0e0, 0.6), [0, 1.23, 0], [-0.3, 0, 0], 0);
    b.pop();
    S(CX + 3.7, CX + 4.7, CZ1 - 1.4, CZ1 - 0.4, 0, 1.6, true);
    for (const x of [NX0 + 0.2, NX1 - 0.2]) {
      b.box(0.06, 1.2, 0.8, K.veneer(0x3a2418, {tile: 0.6}), [x, 2.2, -10.0], null, 0.01);
      b.label(
        0.7,
        1.0,
        K.paint('cb_hymn', 128, 184, (c, W, H) => {
          c.fillStyle = '#1a1410';
          c.fillRect(0, 0, W, H);
          ['HYMNS', '23', '117', '204', '331'].forEach((s, i) =>
            P.text(c, s, W / 2, 22 + i * 38, {size: i ? 30 : 18, col: '#f4e8c8'})
          );
        }),
        [x + (x < 0 ? 0.035 : -0.035), 2.2, -10.0],
        [0, x < 0 ? PI / 2 : -PI / 2, 0]
      );
    }
    b.push([CX - 3.4, 0, 6.6]);
    b.cyl(0.25, 0.35, 0.1, mw, [0, 0.05, 0], null, 8);
    b.cyl(0.12, 0.16, 0.75, mw, [0, 0.45, 0], null, 8);
    b.lathe(
      [
        [0, 0],
        [0.12, 0],
        [0.4, 0.12],
        [0.45, 0.28],
        [0.42, 0.3],
        [0, 0.18]
      ],
      mw,
      [0, 0.82, 0],
      16
    );
    b.cyl(0.38, 0.38, 0.01, K.mat(0x6a8aa8, 0.1, 0.2), [0, 1.06, 0], null, 16);
    b.pop();
    S(CX - 3.8, CX - 3.0, 6.2, 7.0, 0, 1.1, true);
    // narthex in the tower: guest book stand, notice board, pamphlet rack
    b.push([CX + 1.6, 0, 11.6]);
    b.box(0.06, 1.0, 0.06, K.veneer(0x4a2e1e, {tile: 0.6}), [0, 0.5, 0], null, 0);
    b.box(0.5, 0.04, 0.36, K.veneer(0x4a2e1e, {tile: 0.6}), [0, 1.02, 0], [-0.3, 0, 0], 0);
    b.box(0.42, 0.02, 0.3, K.mat(0xf4f0e0, 0.6), [0, 1.05, 0], [-0.3, 0, 0], 0);
    b.pop();
    b.box(
      0.04,
      0.9,
      1.2,
      K.tri(
        'cb_cork',
        (c, W, H, r) => {
          c.fillStyle = '#b8885a';
          c.fillRect(0, 0, W, H);
          P.noise(c, W, H, r, 8000, 0.4, '#6a4a2a', 2);
        },
        {tile: 0.5, r: 0.9}
      ),
      [TX0 + 0.19, 1.6, 10.3],
      null,
      0
    );
    for (let i = 0; i < 6; i++)
      b.box(
        0.005,
        0.22,
        0.18,
        K.mat([0xf4f4f0, 0xffe060, 0xf4f4f0, 0x9ad8ff][i % 4], 0.6),
        [TX0 + 0.215, 1.45 + (i % 2) * 0.32, 9.85 + i * 0.18],
        [rnd() * 0.2, 0, 0],
        0
      );
    b.rbox(0.5, 1.2, 0.25, 0.02, K.veneer(0x4a2e1e, {tile: 0.6}), [TX1 - 0.3, 0.6, 10.0]);
    for (let i = 0; i < 6; i++)
      b.box(
        0.02,
        0.24,
        0.14,
        K.mat([0xe8e0c8, 0xc8d8e8, 0xe8c8c8][i % 3], 0.6),
        [TX1 - 0.44, 0.4 + Math.floor(i / 2) * 0.35, 9.95 + (i % 2) * 0.1 - 0.05],
        null,
        0
      );
    CACHE = G.done();
    return CACHE;
  }

  /* ===================== the builder ===================== */
  function bAisleBeBack(x, z, t) {
    const B = mk(x, z, 40, 36, H, 0xe0dad4, 0x1a1a1a, 0x5a1a14);
    B.dx = 0;
    const PT = {th: 0.3};
    WL(B, 0, NX0, NZ0, NZ1, wins(SIDEW), H);
    WL(B, 0, NX1, NZ0, NZ1, wins(SIDEW), H);
    WL(
      B,
      1,
      NZ0,
      NX0,
      NX1,
      [
        {k: 'w', c: -11.5},
        {k: 'w', c: -2.5},
        {k: 'd', c: -1.1, s: -1} // v089: was -0.9, half behind the corner pier
      ],
      H
    );
    WL(B, 1, NZ1, NX0, NX1, [...wins([-11.5, -2.5]), {k: 'g', c: CX - 0.8}, {k: 'g', c: CX + 0.8}], H);
    WL(B, 0, CX - TW, NZ1, TZ1, [], H, PT);
    WL(B, 0, CX + TW, NZ1, TZ1, [], H, PT);
    WL(
      B,
      1,
      TZ1,
      CX - TW,
      CX + TW,
      [
        {k: 'd', c: CX - 0.75, dbl: 'swing'}, // v089: the twin portal doors are one double door
        {k: 'd', c: CX + 0.75, dbl: 'swing'}
      ],
      H,
      PT
    );
    LK.attach(B, build());
    for (const [tx, tz, ts] of LOTTREES)
      try {
        bldTree(B, tx, tz, ts * 0.85);
      } catch (e) {}
    const SP = LK.spawner(B, 'church');
    // lootable: the lectern, a trunk of hymnals in the narthex, a bookshelf and a dresser of vestments by the chancel
    SP(CX - 4.0, -9.9, 'church_podium', 'church', 0.4, 0.4);
    SP(CX - 2.0, 9.2, 'trunk_steamer', 'church', PI / 2); // v089: off the narthex gateway
    SP(NX0 + 0.45, -13.3, 'bookshelf', 'church', PI / 2);
    SP(NX1 - 0.45, -11.6, 'dresser', 'church', -PI / 2); // v089: was in front of the back door
    return LK.finish(B, t, {
      at: [CX, -1],
      w: 14,
      d: 26.6,
      loot: ['church', [NX0 + 1, NX1 - 1, -8, 5], 1],
      zombies: [
        [-8, 0],
        [-4, -4],
        [-11, 3],
        [-7, -10],
        [-7, 10],
        [8, 8],
        [10, -10]
      ]
    });
  }

  LK.register({
    id: 'church',
    name: 'Aisle Be Back Church',
    build: bAisleBeBack,
    note: 'full-block church: nave, tower and spire, chancel with organ, graveyard, lawn and parking',
    globals: {bAisleBeBack, AISLEBEBACK: {build}}
  });
  console.log('[church] Aisle Be Back ready');
})();
