/* ==========================================================================================================
   MINI FORT ZOMBIE - GREASY & NEEDY DINER (v089): a 1950s American diner on a half plot (20 x 36 m, front = +Z), our own design.
   Replaces the Moonlight Diner placeholder (newlots.js id diner, half pool). The building only takes the back half of the plot:
   the front half is the diner's car park, with 1950s cars nosed in under the neon.
   OUTSIDE: a 17 x 11 m diner car: fluted stainless steel skirt, cream enamel panels, a red enamel band, rounded front corners, a long
   strip of windows under a red metal awning, three red / cream neon stripes round the fascia, the big script GREASY & NEEDY / DINER neon
   on a frame over the roof, a kitchen exhaust stack, HVAC. Car park: two rows of stalls with wheel stops, a lane arrow, a planting strip
   and the driveway off the street, a pole sign (EATS · OPEN 24 HRS). Behind: a service strip to the alley (dumpster, grease drum, bins).
   INSIDE: black / white checkerboard floor, red walls over white wainscot, chrome trim. The dining room has red / white booths along the
   front windows, a long counter with chrome stools, a back bar (pie case, milkshake mixers, coffee urn, soda taps), a jukebox, a neon EAT
   sign, records, posters and a flag on the walls, domed pendants. Through the swing door: the kitchen (griddle, fryers, range, hood,
   prep tables, fridge, freezer, sink, dish station, dry stores). In the back corner: the customer toilet.
   Structure from core WL (doors / windows work); detail is our own geometry and painted artwork, outside the static merge.
   ========================================================================================================== */
(function () {
  'use strict';
  const K = window.MFZK,
    LK = window.LOTKIT;
  if (!K || !LK || typeof WL !== 'function' || typeof NEWCAT === 'undefined') {
    console.warn('[greasyneedy] core / prop kit missing');
    return;
  }
  const T = THREE,
    P = K.P,
    PI = Math.PI;
  // the diner (back half of the plot, x -8.5..8.5), heights
  const X0 = -8.5,
    X1 = 8.5,
    Z0 = -14,
    Z1 = -3,
    H = 4.0,
    CEIL = 3.1,
    AP = -1.4; // front edge of the walk in front of the diner (car park beyond)
  // kitchen behind the partition (x X0..KX, z Z0..PZ); customer toilet in the back-right corner (x KX..X1, z Z0..WZ)
  const PZ = -9.2,
    KX = 5.0,
    WZ = -10.8;
  const FRONT = [
    {k: 'w', c: -7.4},
    {k: 'w', c: -5.8},
    {k: 'w', c: -4.2},
    {k: 'w', c: -2.6},
    {k: 'd', c: -1.0},
    {k: 'w', c: 0.6},
    {k: 'w', c: 2.2},
    {k: 'w', c: 3.8},
    {k: 'w', c: 5.4},
    {k: 'w', c: 7.0}
  ];
  const LEFT = [
    {k: 'w', c: -5.4},
    {k: 'w', c: -11.6}
  ];
  const RIGHT = [{k: 'w', c: -5.6}];
  const BACK = [{k: 'd', c: -6.0, s: -1}];
  const PART = [{k: 'd', c: 4.2}]; // kitchen swing door, behind the end of the counter
  const WCF = [{k: 'd', c: 6.9}]; // toilet door (z = WZ)

  /* ===================== loot tables ===================== */
  try {
    Object.assign(LOOT_TABLES, {
      // the kitchen: fridge, freezer, prep tables, the line
      gn_kitchen: {
        bacon: 5,
        sausages: 5,
        lamburger: 5,
        smoked_ham: 2,
        pickles: 3,
        salad: 2,
        milk: 3,
        calzones: 2,
        pizan_pasta: 2,
        kenball_soup: 2,
        butcher_knife: 1
      },
      // dry stores and boxes: tins, packets, sugar, coffee
      gn_stores: {
        kenball_soup: 5,
        ramen_noodles: 4,
        pizan_pasta: 3,
        pickles: 3,
        cherry_preserves: 2,
        peach_preserves: 2,
        sugar: 3,
        stugots_coffee: 3,
        crackers: 2,
        cereo: 2,
        eat_flakes: 2,
        water_jug: 2
      },
      // behind the counter: pie, shakes, sodas, coffee
      gn_counter: {
        colacola: 4,
        popzi_soft_drink: 3,
        sup_soft_drink: 2,
        citrol: 2,
        milk: 3,
        cookies: 3,
        sugar: 2,
        stugots_coffee: 3,
        cherry_preserves: 1,
        peach_preserves: 1
      },
      // customer toilet: the first-aid box and odds
      gn_wc: {painkiller: 2, gauze: 2, cotton_balls: 2, medical_tape: 1, hairspray: 1}
    });
    for (const tn of ['gn_kitchen', 'gn_stores', 'gn_counter', 'gn_wc'])
      for (const id in LOOT_TABLES[tn])
        if (!ITEMS[id]) {
          console.error('[greasyneedy] loot table ' + tn + ' has unknown item ' + id);
          delete LOOT_TABLES[tn][id];
        }
    if (typeof LOOT_PROP !== 'undefined')
      Object.assign(LOOT_PROP, {gn_kitchen: 'cabinet', gn_stores: 'cabinet', gn_counter: 'counter', gn_wc: 'cabinet'});
    const A = window.MFZPROP && MFZPROP.auto;
    if (A) {
      const pick = (...ts) => [...new Set(ts.flatMap(t => A[t] || []))];
      A.gn_kitchen = pick('diner', 'house');
      A.gn_stores = pick('diner', 'house', 'storage');
      A.gn_counter = pick('diner', 'coffee');
      A.gn_wc = pick('house', 'clinic');
    }
  } catch (e) {
    console.warn('[greasyneedy] loot tables', e);
  }

  /* ===================== artwork ===================== */
  const RED = '#d8222a',
    CREAM = '#fff4dc';
  const SCRIPT = 'italic bold 150px "Brush Script MT", "Lucida Handwriting", Georgia, cursive';
  // glowing neon text: a wide soft halo, the tube, a white-hot core
  function neonText(c, txt, x, y, font, col, core) {
    c.font = font;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.lineJoin = 'round';
    c.shadowColor = col;
    c.shadowBlur = 30;
    c.strokeStyle = col;
    c.lineWidth = 14;
    c.strokeText(txt, x, y);
    c.shadowBlur = 12;
    c.lineWidth = 7;
    c.strokeText(txt, x, y);
    c.shadowBlur = 0;
    c.strokeStyle = core || '#ffffff';
    c.lineWidth = 2.5;
    c.strokeText(txt, x, y);
  }
  // the roof sign: GREASY & NEEDY in cream script, DINER in red block, on a dark open frame (transparent round the letters)
  const roofSign = () =>
    K.paint(
      'gn_roofsign',
      1024,
      420,
      (c, W, H) => {
        c.clearRect(0, 0, W, H);
        neonText(c, 'Greasy & Needy', W / 2, 150, SCRIPT, '#ff5a3c', CREAM);
        neonText(c, 'DINER', W / 2, 330, 'bold 130px Georgia, "Times New Roman", serif', RED, '#ffd0c8');
      },
      {alpha: true, glow: 1.6}
    );
  // pole sign by the driveway: red board, cream script, EATS, OPEN 24 HRS
  const poleSign = () =>
    K.paint(
      'gn_pole',
      512,
      640,
      (c, W, H) => {
        c.fillStyle = '#b81c22';
        c.fillRect(0, 0, W, H);
        c.strokeStyle = CREAM;
        c.lineWidth = 12;
        c.strokeRect(14, 14, W - 28, H - 28);
        c.fillStyle = CREAM;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.font = 'italic bold 66px "Brush Script MT", Georgia, cursive';
        c.fillText('Greasy &', W / 2, 92);
        c.fillText('Needy', W / 2, 160);
        c.fillStyle = '#ffd84a';
        c.font = 'bold 150px Georgia, serif';
        c.fillText('EATS', W / 2, 320);
        c.fillStyle = CREAM;
        c.font = 'bold 50px Arial, sans-serif';
        c.fillText('OPEN 24 HRS', W / 2, 450);
        c.font = 'italic 34px Georgia, serif';
        c.fillText('bottomless coffee', W / 2, 520);
        c.fillText('fries fried twice', W / 2, 568);
      },
      {glow: 0.55}
    );
  // fascia end plates and side-wall lettering
  const strap = (key, text, font, bg, fg, w, h, glow) =>
    K.paint(
      key,
      w || 512,
      h || 128,
      (c, W, H) => {
        if (bg) {
          c.fillStyle = bg;
          c.fillRect(0, 0, W, H);
        } else c.clearRect(0, 0, W, H);
        c.fillStyle = fg;
        c.font = font;
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.fillText(text, W / 2, H / 2 + 4);
      },
      bg ? (glow ? {glow} : {}) : {alpha: true}
    );
  // the menu boards over the back bar: white letters on black, pun prices
  const menuBoard = (key, title, lines) =>
    K.paint(key, 512, 384, (c, W, H) => {
      c.fillStyle = '#121212';
      c.fillRect(0, 0, W, H);
      c.strokeStyle = '#c8ccd0';
      c.lineWidth = 8;
      c.strokeRect(6, 6, W - 12, H - 12);
      c.fillStyle = '#ff4a3a';
      c.textAlign = 'center';
      c.font = 'bold 46px Georgia, serif';
      c.fillText(title, W / 2, 58);
      c.font = 'bold 28px Arial, sans-serif';
      lines.forEach(([t, p], i) => {
        const y = 112 + i * 44;
        c.fillStyle = '#f4f2ea';
        c.textAlign = 'left';
        c.fillText(t, 30, y);
        c.fillStyle = '#ffd84a';
        c.textAlign = 'right';
        c.fillText(p, W - 30, y);
      });
    });
  // 1950s posters, painted in code
  const poster = (key, draw) => K.paint(key, 256, 384, draw);
  const POSTERS = [
    poster('gn_p_rock', (c, W, H) => {
      c.fillStyle = '#f2d43a';
      c.fillRect(0, 0, W, H);
      c.fillStyle = '#1a1a1a';
      c.beginPath();
      c.arc(W / 2, 160, 90, 0, PI * 2);
      c.fill();
      c.fillStyle = RED;
      c.beginPath();
      c.arc(W / 2, 160, 30, 0, PI * 2);
      c.fill();
      c.fillStyle = '#1a1a1a';
      c.textAlign = 'center';
      c.font = 'bold 40px Georgia, serif';
      c.fillText("ROCK 'N'", W / 2, 300);
      c.fillText('ROT', W / 2, 345);
    }),
    poster('gn_p_shake', (c, W, H) => {
      c.fillStyle = '#7ad0d8';
      c.fillRect(0, 0, W, H);
      c.fillStyle = '#f8c8d8';
      c.beginPath();
      c.moveTo(80, 120);
      c.lineTo(176, 120);
      c.lineTo(156, 290);
      c.lineTo(100, 290);
      c.closePath();
      c.fill();
      c.beginPath();
      c.arc(128, 115, 50, PI, 0);
      c.fill();
      c.fillStyle = RED;
      c.beginPath();
      c.arc(128, 62, 14, 0, PI * 2);
      c.fill();
      c.fillStyle = '#1a1a1a';
      c.textAlign = 'center';
      c.font = 'bold 34px Georgia, serif';
      c.fillText('THICK SHAKES', W / 2, 340);
    }),
    poster('gn_p_car', (c, W, H) => {
      c.fillStyle = '#1e3a6a';
      c.fillRect(0, 0, W, H);
      c.fillStyle = RED;
      c.beginPath();
      c.moveTo(20, 230);
      c.quadraticCurveTo(60, 150, 140, 160);
      c.lineTo(236, 200);
      c.lineTo(236, 240);
      c.lineTo(20, 250);
      c.closePath();
      c.fill();
      c.fillStyle = '#121212';
      for (const x of [60, 190]) {
        c.beginPath();
        c.arc(x, 250, 22, 0, PI * 2);
        c.fill();
      }
      c.fillStyle = '#ffd84a';
      c.textAlign = 'center';
      c.font = 'bold 36px Georgia, serif';
      c.fillText('ROUTE 66.6', W / 2, 80);
      c.font = 'italic 26px Georgia, serif';
      c.fillText('get your kicks', W / 2, 330);
    }),
    poster('gn_p_pinup', (c, W, H) => {
      c.fillStyle = '#e8d8c0';
      c.fillRect(0, 0, W, H);
      c.fillStyle = '#2a2a2a';
      c.beginPath();
      c.ellipse(128, 130, 52, 62, 0, 0, PI * 2);
      c.fill();
      c.fillStyle = '#f0c8a8';
      c.beginPath();
      c.ellipse(128, 145, 40, 50, 0, 0, PI * 2);
      c.fill();
      c.fillStyle = RED;
      c.fillRect(110, 172, 36, 9);
      c.fillStyle = '#1a1a1a';
      c.textAlign = 'center';
      c.font = 'bold 30px Georgia, serif';
      c.fillText('SAY CHEESE', W / 2, 270);
      c.font = 'italic 24px Georgia, serif';
      c.fillText('(burger)', W / 2, 310);
    }),
    poster('gn_p_cola', (c, W, H) => {
      c.fillStyle = RED;
      c.fillRect(0, 0, W, H);
      c.fillStyle = '#ffffff';
      c.textAlign = 'center';
      c.font = 'italic bold 56px Georgia, serif';
      c.fillText('Cola', W / 2, 140);
      c.fillText('Cola', W / 2, 200);
      c.font = 'bold 26px Arial, sans-serif';
      c.fillText('ICE COLD 5¢', W / 2, 300);
    })
  ];
  // the stars and stripes (painted)
  const flagMat = () =>
    K.paint('gn_flag', 512, 270, (c, W, H) => {
      for (let i = 0; i < 13; i++) {
        c.fillStyle = i % 2 ? '#ffffff' : '#b22234';
        c.fillRect(0, (i * H) / 13, W, H / 13 + 1);
      }
      c.fillStyle = '#3c3b6e';
      c.fillRect(0, 0, W * 0.4, (H * 7) / 13);
      c.fillStyle = '#ffffff';
      for (let j = 0; j < 9; j++)
        for (let i = 0; i < (j % 2 ? 5 : 6); i++) {
          c.beginPath();
          c.arc(12 + i * 34 + (j % 2 ? 17 : 0), 10 + j * 15.5, 3.5, 0, PI * 2);
          c.fill();
        }
    });
  // a 45 record label (one atlas cell per colour is overkill; a few materials)
  const recordMat = col =>
    K.paint(
      'gn_rec' + col,
      128,
      128,
      (c, W, H) => {
        c.clearRect(0, 0, W, H);
        c.fillStyle = '#0e0e0e';
        c.beginPath();
        c.arc(64, 64, 62, 0, PI * 2);
        c.fill();
        c.strokeStyle = '#2a2a2a';
        for (let rr = 30; rr < 60; rr += 4) {
          c.beginPath();
          c.arc(64, 64, rr, 0, PI * 2);
          c.stroke();
        }
        c.fillStyle = col;
        c.beginPath();
        c.arc(64, 64, 22, 0, PI * 2);
        c.fill();
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.arc(64, 64, 3, 0, PI * 2);
        c.fill();
      },
      {alpha: true}
    );

  /* ===================== surfaces ===================== */
  const SURF = {};
  const surf = k =>
    SURF[k] ||
    (SURF[k] = {
      asphalt: () => K.surf('asphalt', 0x34363a),
      concrete: () => K.surf('concrete', 0xb4b0a6),
      fence: () => K.surf('wood', 0x6a5444),
      // fluted stainless steel: vertical ribs
      fluted: () =>
        K.tri(
          'gn_fluted',
          (c, W, H, r) => {
            c.fillStyle = '#b8bcc0';
            c.fillRect(0, 0, W, H);
            const n = 16,
              s = W / n;
            for (let i = 0; i < n; i++) {
              const g = c.createLinearGradient(i * s, 0, (i + 1) * s, 0);
              g.addColorStop(0, '#6e7276');
              g.addColorStop(0.35, '#e8ecf0');
              g.addColorStop(0.7, '#a0a4a8');
              g.addColorStop(1, '#5a5e62');
              c.fillStyle = g;
              c.fillRect(i * s, 0, s, H);
            }
            P.noise(c, W, H, r, 1500, 0.05, '#000000', 1);
          },
          {tile: 0.8, r: 0.3, m: 0.85}
        ),
      // cream enamel panels with seams
      enamel: () =>
        K.tri(
          'gn_enamel',
          (c, W, H, r) => {
            c.fillStyle = '#efe6cf';
            c.fillRect(0, 0, W, H);
            c.fillStyle = '#cfc4aa';
            c.fillRect(0, 0, W, 3);
            c.fillRect(0, 0, 3, H);
            P.noise(c, W, H, r, 1200, 0.04, '#5a4a30', 1);
          },
          {tile: 1.2, r: 0.35}
        ),
      // black and white checkerboard lino
      checker: () =>
        K.tri(
          'gn_checker',
          (c, W, H, r) => {
            const n = 4,
              s = W / n;
            for (let j = 0; j < n; j++)
              for (let i = 0; i < n; i++) {
                c.fillStyle = (i + j) % 2 ? '#161616' : '#ecebe4';
                c.fillRect(i * s, j * s, s, s);
              }
            P.noise(c, W, H, r, 2500, 0.05, '#7a6a50', 1);
          },
          {tile: 1.2, r: 0.35}
        ),
      // kitchen: red quarry tile
      quarry: () =>
        K.tri(
          'gn_quarry',
          (c, W, H, r) => {
            c.fillStyle = '#4a2a20';
            c.fillRect(0, 0, W, H);
            const n = 4,
              s = W / n;
            for (let j = 0; j < n; j++)
              for (let i = 0; i < n; i++) {
                c.fillStyle = `hsl(${8 + r() * 8},${48 + r() * 10}%,${32 + r() * 7}%)`;
                c.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
              }
            P.grime(c, W, H, r, 0.3);
          },
          {tile: 0.8, r: 0.7}
        ),
      // small white wall tile (kitchen, toilet)
      tile: () =>
        K.tri(
          'gn_tile',
          (c, W, H, r) => {
            c.fillStyle = '#b8b8b2';
            c.fillRect(0, 0, W, H);
            const n = 8,
              s = W / n;
            for (let j = 0; j < n; j++)
              for (let i = 0; i < n; i++) {
                c.fillStyle = '#f2f2ec';
                c.fillRect(i * s + 1.5, j * s + 1.5, s - 3, s - 3);
              }
          },
          {tile: 0.8, r: 0.25}
        ),
      // red vinyl upholstery with button tufting lines
      vinyl: () =>
        K.tri(
          'gn_vinyl',
          (c, W, H, r) => {
            c.fillStyle = '#b81820';
            c.fillRect(0, 0, W, H);
            c.fillStyle = '#8a1016';
            for (let i = 1; i < 4; i++) c.fillRect((i * W) / 4 - 2, 0, 4, H);
            P.noise(c, W, H, r, 1500, 0.05, '#ffffff', 1);
          },
          {tile: 0.6, r: 0.35}
        ),
      redEnamel: () => K.mat(0xc81e26, 0.35, 0.1),
      chrome: () => K.chrome()
    }[k]());

  /* ===================== geometry ===================== */
  let CACHE = null;
  function build() {
    if (CACHE) return CACHE;
    const G = LK.geo('greasyneedy'),
      b = G.b,
      S = G.S;
    const conc = surf('concrete'),
      asph = surf('asphalt');
    const rb = (w, h, d, r, m, p, rot) => b.rbox(w, h, d, r, m, p, rot, 1);
    /* ---------- grounds: sidewalk, car park asphalt, walk in front of the diner, service strip ---------- */
    LK.pavement(b, conc, {w: 20});
    b.box(20, 0.02, 15.9 - AP, asph, [0, 0.012, (AP + 15.9) / 2], null, 0); // car park
    b.box(18.6, 0.14, AP - Z1, conc, [0, 0.07, (Z1 + AP) / 2], null, 0); // raised walk along the front
    S(-9.3, 9.3, Z1, AP, 0, 0.14, true);
    b.box(20, 0.02, Z1 - Z0 + 0.6, asph, [0, 0.012, (Z0 + Z1) / 2], null, 0); // round the diner
    b.box(20, 0.02, 18 + Z0, asph, [0, 0.012, (-18 + Z0) / 2], null, 0); // service strip to the alley
    const flu = surf('fluted'),
      ena = surf('enamel'),
      redE = surf('redEnamel'),
      chrome = surf('chrome'),
      dark = K.mat(0x1c1c1e, 0.5),
      black = K.mat(0x141416, 0.45, 0.4),
      steel = K.mat(0x9a9ea2, 0.4, 0.7),
      white = K.mat(0xf4f2ec, 0.5),
      paint = K.mat(0xf2f0e8, 0.6),
      yellow = K.mat(0xe8c020, 0.6),
      leaf = K.mat(0x3e6a2e, 0.85),
      leaf2 = K.mat(0x557f38, 0.85),
      soil = K.mat(0x3a2a1c, 0.95),
      neonC = K.mat(0xfff0e0, 0.3, 0, {emissive: 0xffe8d8, emissiveIntensity: 2.2}),
      neonR = K.mat(0xff3030, 0.3, 0, {emissive: 0xff2020, emissiveIntensity: 2.4}),
      warm = K.mat(0xfff2c8, 0.4, 0, {emissive: 0xffd890, emissiveIntensity: 1.3});

    /* ---------- exterior skin: fluted steel skirt, cream enamel, red band under the fascia ---------- */
    const BANDS = [
      [0, 0.9, flu],
      [0.9, 2.78, ena],
      [2.78, 3.0, redE],
      [3.0, H, ena]
    ];
    const skin = (ax, f, a0, a1, n, ops) => {
      ops = (ops || []).slice().sort((p, q) => p.c - q.c);
      const pc = (u0, u1, y0, y1) => {
        if (u1 - u0 < 0.04 || y1 - y0 < 0.02) return;
        const o = f + n * 0.165,
          u = (u0 + u1) / 2;
        for (const [ba, bb, mm] of BANDS) {
          const ya = Math.max(y0, ba),
            yb = Math.min(y1, bb);
          if (yb - ya < 0.02) continue;
          const y = (ya + yb) / 2;
          if (ax) b.box(u1 - u0, yb - ya, 0.03, mm, [u, y, o], null, 0);
          else b.box(0.03, yb - ya, u1 - u0, mm, [o, y, u], null, 0);
        }
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
    };
    skin(1, Z1, X0 + 0.2, X1 - 0.2, 1, FRONT);
    skin(1, Z0, X0 - 0.15, X1 + 0.15, -1, BACK);
    skin(0, X0, Z0, Z1 - 0.2, -1, LEFT);
    skin(0, X1, Z0, Z1 - 0.2, 1, RIGHT);
    // rounded front corners: a fluted drum under an enamel drum
    for (const cx of [X0, X1]) {
      b.cyl(0.36, 0.36, 0.9, flu, [cx, 0.45, Z1], null, 20);
      b.cyl(0.36, 0.36, H - 0.9, ena, [cx, 0.9 + (H - 0.9) / 2, Z1], null, 20);
      b.cyl(0.37, 0.37, 0.22, redE, [cx, 2.89, Z1], null, 20);
      S(cx - 0.36, cx + 0.36, Z1 - 0.36, Z1 + 0.36, 0, H, true);
    }
    // chrome window frames + sills all round, chrome door surrounds
    for (const w of FRONT.filter(p => p.k === 'w')) {
      b.frame(1.52, 1.88, 0.06, chrome, [w.c, 1.825, Z1 + 0.19], 0.05);
      b.box(1.6, 0.05, 0.16, chrome, [w.c, 0.9, Z1 + 0.24], null, 0.01);
    }
    for (const [ws, fx, nx] of [
      [LEFT, X0, -1],
      [RIGHT, X1, 1]
    ])
      for (const w of ws) {
        b.box(0.16, 0.05, 1.6, chrome, [fx + nx * 0.24, 0.9, w.c], null, 0.01);
        b.push([fx + nx * 0.19, 1.825, w.c], [0, PI / 2, 0]);
        b.frame(1.52, 1.88, 0.06, chrome, [0, 0, 0], 0.05);
        b.pop();
      }
    b.frame(1.4, 2.48, 0.08, chrome, [-1.0, 1.24, Z1 + 0.19], 0.06);
    b.frame(1.4, 2.48, 0.06, steel, [-6.0, 1.24, Z0 - 0.19], 0.05);
    // chrome horizontal trim lines along the whole car
    for (const ty of [0.92, 2.76, 3.02]) {
      // v090: the low line stops either side of the front door (it ran across the doorway)
      if (ty < 2.4) {
        let u = X0 + 0.15;
        for (const d of FRONT.filter(p => p.k === 'd')) {
          b.box(d.c - 0.72 - u, 0.035, 0.05, chrome, [(u + d.c - 0.72) / 2, ty, Z1 + 0.2], null, 0);
          u = d.c + 0.72;
        }
        b.box(X1 - 0.15 - u, 0.035, 0.05, chrome, [(u + X1 - 0.15) / 2, ty, Z1 + 0.2], null, 0);
      } else b.box(X1 - X0 - 0.3, 0.035, 0.05, chrome, [0, ty, Z1 + 0.2], null, 0);
      for (const sx of [X0 - 0.2, X1 + 0.2])
        b.box(0.05, 0.035, Z1 - Z0 - 0.3, chrome, [sx, ty, (Z0 + Z1) / 2 - 0.1], null, 0);
    }

    /* ---------- fascia: a deep rounded red band with three neon stripes, front and both sides ---------- */
    const FY0 = 3.05,
      FY1 = H + 0.55,
      FD = 0.55; // how far the band stands out from the wall face
    const fy = (FY0 + FY1) / 2,
      fh = FY1 - FY0;
    rb(X1 - X0 + 2 * FD, fh, FD + 0.2, 0.18, redE, [0, fy, Z1 + FD / 2 + 0.1]);
    for (const s of [-1, 1])
      rb(FD + 0.2, fh, Z1 - Z0 + FD, 0.18, redE, [s * (X1 + FD / 2 + 0.1 - 0.1), fy, (Z0 + Z1) / 2 + FD / 2 - 0.1]);
    b.box(X1 - X0 + 2 * FD, 0.05, Z1 - Z0 + FD, ena, [0, FY0 - 0.02, (Z0 + Z1) / 2 + FD / 2 - 0.1], null, 0); // soffit
    const FZ = Z1 + FD + 0.2,
      FXs = X1 + FD + 0.2;
    for (let i = 0; i < 3; i++) {
      const sy = FY0 + 0.28 + i * 0.2;
      b.box(X1 - X0 + 2 * FD - 0.5, 0.06, 0.04, neonC, [0, sy, FZ + 0.01], null, 0);
      for (const s of [-1, 1])
        b.box(0.04, 0.06, Z1 - Z0 + FD - 0.6, neonC, [s * (FXs + 0.01), sy, (Z0 + Z1) / 2 + FD / 2], null, 0);
    }
    b.label(
      1.5,
      0.3,
      strap('gn_fascia_l', 'GREASY & NEEDY', 'bold 56px Georgia, serif', '#b81c22', CREAM, 512, 100, 0.4),
      [X0 - FD + 1.1, FY1 - 0.2, FZ + 0.02]
    );
    b.label(
      1.5,
      0.3,
      strap('gn_fascia_r', 'OPEN 24 HOURS', 'bold 56px Georgia, serif', '#b81c22', CREAM, 512, 100, 0.4),
      [X1 + FD - 1.1, FY1 - 0.2, FZ + 0.02]
    );
    // flat roof deck behind the band, plain parapet at the back
    b.box(X1 - X0, 0.12, Z1 - Z0, K.surf('concrete', 0x5a5a58), [0, H + 0.02, (Z0 + Z1) / 2], null, 0);
    b.box(X1 - X0 - 0.3, 0.02, Z1 - Z0 - 0.3, K.mat(0x3a3c40, 0.9), [0, H + 0.09, (Z0 + Z1) / 2], null, 0);
    b.box(X1 - X0 + 0.3, 0.55, 0.3, ena, [0, H + 0.27, Z0], null, 0);
    b.box(X1 - X0 + 0.4, 0.06, 0.4, chrome, [0, H + 0.57, Z0], null, 0);
    // HVAC and the kitchen exhaust stack (red, with a rain cap)
    for (const [hx, hz] of [
      [4.5, -11.5],
      [5.8, -6.5]
    ]) {
      rb(1.6, 0.9, 1.2, 0.03, K.mat(0xb0b4b8, 0.4, 0.7), [hx, H + 0.55, hz]);
      b.vents(5, 1.4, 0.6, K.mat(0x6a6c6e, 0.5, 0.6), [hx, H + 0.55, hz + 0.61]);
      b.cyl(0.4, 0.4, 0.08, K.mat(0x2a2a2a, 0.5, 0.4), [hx, H + 1.04, hz], null, 18);
    }
    rb(1.4, 0.5, 1.0, 0.03, steel, [-1.5, H + 0.35, -10.0]); // hood fan box over the line
    b.cyl(0.28, 0.28, 2.6, redE, [-0.2, H + 1.3, -12.2], null, 16);
    b.cyl(0.45, 0.45, 0.05, steel, [-0.2, H + 2.65, -12.2], null, 16);
    b.cyl(0.0, 0.45, 0.22, steel, [-0.2, H + 2.8, -12.2], null, 16);

    /* ---------- the GREASY & NEEDY / DINER neon on an open steel frame over the roof ---------- */
    {
      const sx = -3.4,
        sz = Z1 + 0.4,
        sw = 7.2,
        sh = 2.95,
        sy = FY1 + 0.25 + sh / 2;
      for (const px of [sx - 2.6, sx, sx + 2.6]) {
        b.box(0.1, sy - sh / 2 - H + 0.4, 0.1, steel, [px, (H + sy - sh / 2) / 2 + 0.1, sz - 0.35], null, 0);
        b.box(0.06, 0.06, 1.1, steel, [px, sy - sh / 2 + 0.15, sz - 0.2], [0.6, 0, 0], 0);
      }
      b.box(sw, 0.08, 0.08, steel, [sx, sy - sh / 2 + 0.05, sz - 0.28], null, 0);
      b.box(sw, 0.08, 0.08, steel, [sx, sy + sh / 2 - 0.1, sz - 0.28], null, 0);
      b.label(sw, sh, roofSign(), [sx, sy, sz - 0.2]);
      // v090: a red sign base on the fascia top and visible legs into it (the sign seemed to float over the band)
      b.box(sw * 0.86, sy - sh / 2 - FY1 + 0.02, 0.36, redE, [sx, (FY1 + sy - sh / 2) / 2, sz - 0.25], null, 0.02);
      b.box(sw * 0.88, 0.05, 0.4, chrome, [sx, sy - sh / 2 + 0.01, sz - 0.25], null, 0.01);
      for (const px of [sx - 3.2, sx + 3.2])
        b.box(0.12, sh * 0.6, 0.12, steel, [px, sy - sh * 0.2, sz - 0.32], null, 0);
    }

    /* ---------- red standing-seam awning over the window strip ---------- */
    {
      const ay = 2.98,
        drop = 0.32,
        out = 1.35,
        aw = X1 - X0 - 0.4,
        ang = Math.atan2(drop, out),
        al = Math.hypot(drop, out);
      b.push([0, ay - drop / 2, Z1 + 0.18 + out / 2], [ang, 0, 0]);
      b.box(aw, 0.05, al, redE, [0, 0, 0], null, 0);
      for (let x = -aw / 2 + 0.3; x < aw / 2; x += 0.45) b.box(0.03, 0.03, al, redE, [x, 0.035, 0], null, 0);
      b.pop();
      b.box(aw, 0.16, 0.04, chrome, [0, ay - drop - 0.06, Z1 + 0.2 + out], null, 0);
      for (const s of [-1, 1]) {
        b.push([s * (aw / 2), ay - drop / 2 - 0.08, Z1 + 0.18 + out / 2], [0, PI / 2, 0]);
        b.box(out, 0.2, 0.04, redE, [0, 0, 0], null, 0);
        b.pop();
      }
      for (let x = -aw / 2 + 0.8; x < aw / 2; x += 1.6)
        b.cyl(0.05, 0.05, 0.02, warm, [x, ay - drop - 0.03, Z1 + 0.18 + out * 0.75], null, 10);
    }
    // OPEN neon in the window beside the door, and a little EAT sign on the door glass side
    b.label(0.9, 0.36, strap('gn_open', 'OPEN', 'bold 90px Arial, sans-serif', null, '#ff3a3a', 256, 100), [
      0.6,
      2.35,
      Z1 + 0.05
    ]);

    /* ---------- the walk in front of the diner: kerb, benches, bin, news box, planters ---------- */
    b.box(18.6, 0.16, 0.14, K.mat(0xd8d4c8, 0.8), [0, 0.08, AP], null, 0);
    b.box(18.6, 0.02, 0.1, yellow, [0, 0.165, AP + 0.02], null, 0);
    const bench = (x, z) => {
      for (let i = 0; i < 3; i++) b.box(1.5, 0.04, 0.1, redE, [x, 0.6, z - 0.12 + i * 0.12], null, 0.01);
      b.box(1.5, 0.3, 0.04, redE, [x, 0.85, z - 0.22], [-0.15, 0, 0], 0.01);
      for (const s of [-1, 1]) b.box(0.05, 0.6, 0.4, chrome, [x + s * 0.65, 0.42, z], null, 0);
      S(x - 0.8, x + 0.8, z - 0.25, z + 0.22, 0, 0.9, true);
    };
    bench(-4.6, Z1 + 0.9);
    bench(3.0, Z1 + 0.9);
    b.cyl(0.26, 0.24, 0.9, K.mat(0x8a1a1e, 0.5, 0.3), [-2.4, 0.52, Z1 + 0.95], null, 16);
    b.cyl(0.28, 0.28, 0.06, chrome, [-2.4, 0.98, Z1 + 0.95], null, 16);
    S(-2.68, -2.12, Z1 + 0.67, Z1 + 1.23, 0, 1.0, true);
    rb(0.5, 1.0, 0.45, 0.03, K.mat(0x2a5aa8, 0.5, 0.3), [0.6, 0.64, Z1 + 0.95]); // newspaper box
    b.box(0.42, 0.3, 0.02, K.glass ? K.glass(0xcfe0e8, 0.4) : white, [0.6, 0.9, Z1 + 1.18], null, 0);
    S(0.35, 0.85, Z1 + 0.72, Z1 + 1.18, 0, 1.14, true);
    for (const px of [X0 + 0.2, X1 - 0.2]) {
      rb(0.9, 0.55, 0.9, 0.05, redE, [px + (px < 0 ? 0.6 : -0.6), 0.42, Z1 + 1.0]);
      b.box(0.8, 0.04, 0.8, soil, [px + (px < 0 ? 0.6 : -0.6), 0.7, Z1 + 1.0], null, 0);
      b.sph(0.42, leaf, [px + (px < 0 ? 0.6 : -0.6), 0.98, Z1 + 1.0], [1, 0.8, 1], 10);
      S(px + (px < 0 ? 0.15 : -1.05), px + (px < 0 ? 1.05 : -0.15), Z1 + 0.55, Z1 + 1.45, 0, 1.2, true);
    }

    /* ---------- car park: two rows of stalls, wheel stops, lane arrow, planting strip, driveway ---------- */
    const R1 = [AP, AP + 5.4], // stalls nosed in to the diner
      R2 = [10.0, 15.2], // stalls along the street side (left of the driveway)
      SW = 2.6;
    const stripe = (x, z0, z1) => b.box(0.1, 0.012, z1 - z0, paint, [x, 0.026, (z0 + z1) / 2], null, 0);
    for (let i = 0; i <= 7; i++) stripe(-9.1 + i * SW, R1[0] + 0.2, R1[1]);
    for (let i = 0; i <= 4; i++) stripe(-9.4 + i * 2.75, R2[0], R2[1]);
    const stop = (x, z) => {
      b.box(1.7, 0.12, 0.2, K.surf('concrete', 0xc4c0b4), [x, 0.06, z], null, 0.02);
      b.box(0.3, 0.01, 0.21, yellow, [x - 0.55, 0.125, z], null, 0);
      b.box(0.3, 0.01, 0.21, yellow, [x + 0.55, 0.125, z], null, 0);
      S(x - 0.85, x + 0.85, z - 0.1, z + 0.1, 0, 0.12, true);
    };
    for (let i = 0; i < 7; i++) stop(-9.1 + SW / 2 + i * SW, R1[0] + 0.9);
    for (let i = 0; i < 4; i++) stop(-9.4 + 1.375 + i * 2.75, R2[1] - 0.8);
    // lane arrows (painted): in from the driveway, round to the left
    for (const [ax, az, rot] of [
      [6.4, 12.2, 0],
      [0.5, 7.4, PI / 2]
    ]) {
      b.push([ax, 0.026, az], [0, rot, 0]);
      b.box(0.25, 0.012, 1.6, paint, [0, 0, 0.3], null, 0);
      b.add(K.cylGeo(0.0, 0.5, 0.012, 3), paint, {p: [0, 0, -0.7], r: [0, PI, 0]});
      b.pop();
    }
    // planting strip with a kerb along the sidewalk (left of the driveway), shrubs
    b.box(12.0, 0.16, 0.6, K.mat(0xd8d4c8, 0.8), [-4.0, 0.08, 15.55], null, 0);
    b.box(11.8, 0.02, 0.45, K.surf('grass', 0x4a6a2e), [-4.0, 0.17, 15.55], null, 0);
    for (let x = -9.3; x <= 1.3; x += 1.5)
      b.sph(0.32, Math.round(x * 2) & 1 ? leaf : leaf2, [x, 0.42, 15.55], [1.2, 0.8, 1], 8);
    S(-10, 2.0, 15.25, 15.85, 0, 0.6, true);
    // dropped kerb at the driveway (x 3..9.6)
    b.box(6.6, 0.015, 0.6, K.surf('concrete', 0xa8a49a), [6.3, 0.02, 15.55], null, 0);
    // stall row 2 ends in a kerbed island holding the pole sign
    rb(1.0, 0.16, 5.2, 0.04, K.mat(0xd8d4c8, 0.8), [2.4, 0.08, (R2[0] + R2[1]) / 2]);
    b.box(0.9, 0.02, 5.1, K.surf('grass', 0x4a6a2e), [2.4, 0.17, (R2[0] + R2[1]) / 2], null, 0);
    S(1.9, 2.9, R2[0], R2[1], 0, 0.16, true);
    {
      const px = 2.4,
        pz = 14.2;
      b.cyl(0.14, 0.16, 5.6, redE, [px, 2.8, pz], null, 14);
      b.cyl(0.3, 0.34, 0.3, K.surf('concrete', 0xb0aca2), [px, 0.32, pz], null, 14);
      rb(0.3, 3.4, 2.7, 0.08, K.mat(0x8a1418, 0.5), [px, 5.0, pz]);
      for (const s of [-1, 1]) {
        b.push([px + s * 0.16, 5.0, pz], [0, (s * PI) / 2, 0]);
        b.label(2.5, 3.15, poleSign(), [0, 0, 0]);
        b.pop();
      }
      // chasing bulbs round the board edge
      for (let k = 0; k < 9; k++)
        for (const s of [-1, 1]) b.sph(0.045, warm, [px + s * 0.17, 6.65, pz - 1.2 + k * 0.3], null, 6);
      // a cream arrow on top pointing down at the driveway
      b.box(0.12, 0.3, 2.2, neonC, [px, 6.9, pz], null, 0.02);
      S(px - 0.18, px + 0.18, pz - 0.18, pz + 0.18, 0, 6.8, true);
    }

    /* ---------- service strip behind: grease drum, bins, crates, board fences ---------- */
    b.cyl(0.3, 0.3, 0.9, K.mat(0x2a4a8a, 0.5, 0.4), [-3.6, 0.45, Z0 - 0.6], null, 16);
    b.cyl(0.31, 0.31, 0.04, K.mat(0x1a1a1a, 0.6), [-3.6, 0.91, Z0 - 0.6], null, 16);
    b.label(0.4, 0.2, strap('gn_grease', 'GREASE', 'bold 80px Arial, sans-serif', '#e8c020', '#1a1a1a', 256, 128), [
      -3.6,
      0.55,
      Z0 - 0.3
    ]);
    S(-3.9, -3.3, Z0 - 0.9, Z0 - 0.3, 0, 0.92, true);
    for (const [wx, col] of [
      [-1.8, 0x2a5a2a],
      [-1.0, 0x3a3c40]
    ]) {
      rb(0.6, 1.0, 0.7, 0.04, K.mat(col, 0.6), [wx, 0.52, Z0 - 0.55]);
      b.box(0.64, 0.05, 0.76, K.mat(col, 0.6), [wx, 1.04, Z0 - 0.58], [-0.1, 0, 0], 0);
      S(wx - 0.32, wx + 0.32, Z0 - 0.92, Z0 - 0.2, 0, 1.05, true);
    }
    for (let i = 0; i < 3; i++)
      rb(0.42, 0.28, 0.32, 0.02, K.mat(0x2a6ab0, 0.6), [7.0, 0.14 + i * 0.29, Z0 - 0.5], [0, i * 0.2, 0]);
    S(6.7, 7.3, Z0 - 0.75, Z0 - 0.25, 0, 0.9, true);
    const fence = surf('fence');
    for (const fx of [-9.9, 9.9]) {
      b.box(0.06, 1.8, 18 + Z0 + 0.6, fence, [fx, 0.9, (-18 + Z0 + 0.6) / 2], null, 0);
      S(fx - 0.05, fx + 0.05, -18, Z0 + 0.6, 0, 1.8, true);
    }

    /* ---------- interior: floors, linings, ceilings, lights ---------- */
    const chk = surf('checker'),
      quarry = surf('quarry'),
      tileW = surf('tile'),
      vinyl = surf('vinyl'),
      redW = K.mat(0xc8242c, 0.55),
      wains = K.mat(0xf4f0e6, 0.45),
      blackTop = K.mat(0x121214, 0.3, 0.2),
      por = K.mat(0xf6f6f2, 0.15, 0.05);
    const flr = (x0, x1, z0, z1, m) => b.box(x1 - x0, 0.02, z1 - z0, m, [(x0 + x1) / 2, 0.035, (z0 + z1) / 2], null, 0);
    const IN = 0.15,
      p = 0.075; // half a partition
    flr(X0 + IN, X1 - IN, PZ + p, Z1 - IN, chk);
    flr(KX + p, X1 - IN, WZ + p, PZ + p, chk);
    flr(X0 + IN, KX - p, Z0 + IN, PZ - p, quarry);
    flr(KX + p, X1 - IN, Z0 + IN, WZ - p, tileW);
    // dining: white wainscot, chrome rail, red band, red plaster above
    const dinSpan = (pc, u0, u1, y0, y1) => {
      if (y0 < 1.0) pc(u0, u1, y0, Math.min(y1, 1.0), wains, 0.02, 0.01);
      if (y1 > 1.12) pc(u0, u1, Math.max(y0, 1.12), y1, redW, 0.012, 0.006);
      if (y0 < 1.12 && y1 > 1.0) {
        pc(u0, u1, 1.0, 1.12, wains, 0.016, 0.008);
        pc(u0, u1, 1.02, 1.05, redW, 0.03, 0.015);
        pc(u0, u1, 1.1, 1.13, chrome, 0.035, 0.018);
      }
      if (y0 <= 0 && y1 > 0.2) pc(u0, u1, 0, 0.1, black, 0.03, 0.015);
    };
    const tileSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, Math.min(y1, 2.0), tileW, 0.012, 0.006);
      if (y1 > 2.0) pc(u0, u1, Math.max(y0, 2.0), y1, white, 0.012, 0.006);
      if (y0 < 1.25 && y1 > 1.2) pc(u0, u1, 1.2, 1.25, black, 0.02, 0.01);
    };
    const inR = (ops, a0, a1) => ops.filter(o => o.c > a0 && o.c < a1);
    // dining room + toilet hall
    LK.lineWall(b, 1, Z1, X0 + IN, X1 - IN, -1, FRONT, CEIL, dinSpan);
    LK.lineWall(b, 0, X0, PZ + p, Z1 - IN, 1, inR(LEFT, PZ, Z1), CEIL, dinSpan);
    LK.lineWall(b, 0, X1, WZ + p, Z1 - IN, -1, inR(RIGHT, WZ, Z1), CEIL, dinSpan);
    LK.lineWall(b, 1, PZ - p, X0 + IN, KX + p, 1, PART, CEIL, dinSpan);
    LK.lineWall(b, 0, KX - p, WZ + p, PZ + p, 1, [], CEIL, dinSpan);
    LK.lineWall(b, 1, WZ - p, KX + p, X1 - IN, 1, WCF, CEIL, dinSpan);
    // kitchen
    const KC = 2.9;
    LK.lineWall(b, 1, PZ + p, X0 + IN, KX - p, -1, PART, KC, tileSpan);
    LK.lineWall(b, 0, X0, Z0 + IN, PZ - p, 1, inR(LEFT, Z0, PZ), KC, tileSpan);
    LK.lineWall(b, 1, Z0, X0 + IN, KX - p, 1, BACK, KC, tileSpan);
    LK.lineWall(b, 0, KX + p, Z0 + IN, PZ - p, -1, [], KC, tileSpan);
    // toilet
    LK.lineWall(b, 1, WZ + p, KX + p, X1 - IN, -1, WCF, 2.7, tileSpan);
    LK.lineWall(b, 0, KX - p, Z0 + IN, WZ - p, 1, [], 2.7, tileSpan);
    LK.lineWall(b, 0, X1, Z0 + IN, WZ - p, -1, [], 2.7, tileSpan);
    LK.lineWall(b, 1, Z0, KX + p, X1 - IN, 1, [], 2.7, tileSpan);
    // ceilings: cream over the dining room with a red cove, white over the kitchen and toilet
    b.box(X1 - X0 - 0.3, 0.04, Z1 - PZ - 0.2, K.mat(0xf4ecd8, 0.85), [0, CEIL + 0.02, (PZ + Z1) / 2], null, 0);
    b.box(X1 - KX - 0.2, 0.04, PZ - WZ, K.mat(0xf4ecd8, 0.85), [(KX + X1) / 2, CEIL + 0.02, (WZ + PZ) / 2], null, 0);
    b.box(X1 - X0 - 0.3, 0.12, 0.06, redW, [0, CEIL - 0.06, Z1 - 0.2], null, 0);
    b.box(X1 - X0 - 0.3, 0.12, 0.06, redW, [0, CEIL - 0.06, PZ + 0.11], null, 0);
    b.box(KX - X0 - 0.2, 0.04, PZ - Z0 - 0.2, white, [(X0 + KX) / 2, KC + 0.02, (Z0 + PZ) / 2], null, 0);
    b.box(X1 - KX - 0.2, 0.04, WZ - Z0 - 0.2, white, [(KX + X1) / 2, 2.72, (Z0 + WZ) / 2], null, 0);
    // domed pendants over the counter (white shade, red cap, chrome stem)
    for (let px = -6.6; px <= 2.6; px += 1.85) {
      b.cyl(0.008, 0.008, 0.7, chrome, [px, CEIL - 0.35, -7.1], null, 4);
      b.cyl(0.06, 0.08, 0.1, redE, [px, CEIL - 0.72, -7.1], null, 12);
      b.lathe(
        [
          [0.07, 0],
          [0.2, -0.05],
          [0.28, -0.16],
          [0.3, -0.24],
          [0.0, -0.24]
        ],
        white,
        [px, CEIL - 0.76, -7.1],
        18
      );
      b.cyl(0.26, 0.26, 0.01, warm, [px, CEIL - 1.0, -7.1], null, 16);
    }
    // milk-glass globes over the booths and the hall
    for (const gx of [-6.9, -3.2, 1.7, 4.4, 7.0]) {
      b.cyl(0.05, 0.05, 0.05, chrome, [gx, CEIL - 0.03, -4.0], null, 10);
      b.sph(0.18, warm, [gx, CEIL - 0.22, -4.0], null, 12);
    }
    b.sph(0.16, warm, [6.8, CEIL - 0.2, -10.0], null, 12);
    // kitchen fluorescent battens, toilet light
    for (const lx of [-5.5, -1.5, 2.5]) {
      b.box(1.3, 0.06, 0.16, white, [lx, KC - 0.04, -11.4], null, 0);
      b.box(
        1.2,
        0.03,
        0.08,
        K.mat(0xffffff, 0.4, 0, {emissive: 0xf6f8ff, emissiveIntensity: 1.0}),
        [lx, KC - 0.08, -11.4],
        null,
        0
      );
    }
    b.cyl(
      0.16,
      0.16,
      0.04,
      K.mat(0xffffff, 0.4, 0, {emissive: 0xf6f8ff, emissiveIntensity: 0.9}),
      [6.8, 2.68, -12.4],
      null,
      14
    );

    /* ---------- booths along the front windows: red / white tuck-and-roll, black tops with chrome edges ---------- */
    const BZ0 = Z1 - IN; // inner face of the front wall
    const booth = (cx, face) => {
      // face: +1 = seat faces +x, -1 = faces -x
      const d = 1.32,
        cz = BZ0 - d / 2;
      b.box(0.55, 0.42, d, redE, [cx, 0.21, cz], null, 0.02); // plinth
      b.box(0.04, 0.42, d, chrome, [cx + face * 0.27, 0.21, cz], null, 0); // chrome kick
      rb(0.5, 0.12, d - 0.04, 0.04, vinyl, [cx + face * 0.02, 0.48, cz]);
      b.push([cx - face * 0.2, 0.86, cz], [0, 0, -face * 0.08]);
      rb(0.14, 0.72, d - 0.04, 0.05, white, [0, 0, 0]); // white back panel
      rb(0.08, 0.6, d - 0.2, 0.04, vinyl, [face * 0.09, 0.0, 0]); // red insert
      b.pop();
      b.box(0.18, 0.04, d, chrome, [cx - face * 0.22, 1.24, cz], null, 0.01);
      S(cx - 0.28, cx + 0.28, BZ0 - d, BZ0, 0, 0.6);
      S(cx - face * 0.28, cx - face * 0.1, BZ0 - d, BZ0, 0.6, 1.25, true);
    };
    const table = cx => {
      const cz = BZ0 - 0.6;
      rb(0.76, 0.04, 1.15, 0.02, blackTop, [cx, 0.76, cz]);
      b.box(0.78, 0.05, 1.17, chrome, [cx, 0.735, cz], null, 0.01);
      b.cyl(0.04, 0.04, 0.72, chrome, [cx, 0.37, cz - 0.3], null, 10);
      b.cyl(0.2, 0.22, 0.03, chrome, [cx, 0.02, cz - 0.3], null, 14);
      b.box(0.08, 0.06, 0.4, chrome, [cx, 0.72, BZ0 - 0.15], null, 0); // wall bracket
      // napkin dispenser, ketchup + mustard, salt + pepper, sugar pourer
      rb(0.1, 0.12, 0.08, 0.01, chrome, [cx - 0.15, 0.84, BZ0 - 0.18]);
      b.cyl(0.025, 0.03, 0.18, K.mat(0xc81818, 0.4), [cx + 0.05, 0.87, BZ0 - 0.16], null, 8);
      b.cyl(0.025, 0.03, 0.18, K.mat(0xe8c020, 0.4), [cx + 0.12, 0.87, BZ0 - 0.16], null, 8);
      for (const sx of [-0.04, 0.0])
        b.cyl(
          0.015,
          0.015,
          0.07,
          K.glass ? K.glass(0xffffff, 0.5) : white,
          [cx + 0.22 + sx, 0.81, BZ0 - 0.17],
          null,
          6
        );
      b.cyl(0.03, 0.03, 0.12, K.glass ? K.glass(0xffffff, 0.4) : white, [cx - 0.26, 0.84, BZ0 - 0.2], null, 8);
      S(cx - 0.39, cx + 0.39, BZ0 - 1.2, BZ0, 0, 0.78, true);
    };
    const booths = (x0, n) => {
      let x = x0;
      for (let i = 0; i < n; i++) {
        booth(x + 0.275, 1);
        table(x + 0.55 + 0.38);
        booth(x + 1.31 + 0.275, -1);
        x += 1.86;
      }
    };
    booths(-8.3, 3); // -8.3 .. -2.72, left of the door
    booths(-0.25, 3); // -0.25 .. 5.33, right of the door
    // the door gap at -1.65 .. -0.35 stays clear: a coat stand would sit right in it, so no stand here

    /* ---------- the counter: red front with white chevrons, black top, chrome edge; chrome stools ---------- */
    const CX0 = X0 + IN,
      CX1 = 3.3,
      CZF = -6.8, // customer face
      CZB = -7.55; // server side
    const chev = K.paint('gn_chev', 512, 256, (c, W, H) => {
      c.fillStyle = '#c8242c';
      c.fillRect(0, 0, W, H);
      c.fillStyle = '#f4f0e6';
      for (let i = 0; i < 4; i++) {
        const x = i * 128;
        c.beginPath();
        c.moveTo(x + 14, 10);
        c.lineTo(x + 64, H - 20);
        c.lineTo(x + 114, 10);
        c.lineTo(x + 92, 10);
        c.lineTo(x + 64, H - 80);
        c.lineTo(x + 36, 10);
        c.closePath();
        c.fill();
      }
    });
    b.box(CX1 - CX0, 0.95, 0.5, redE, [(CX0 + CX1) / 2, 0.475, CZF - 0.3], null, 0.01);
    for (let x = CX0 + 0.1; x < CX1 - 0.5; x += 2.0)
      b.label(Math.min(2.0, CX1 - 0.1 - x), 0.82, chev, [x + Math.min(2.0, CX1 - 0.1 - x) / 2, 0.5, CZF - 0.04]);
    b.box(CX1 - CX0, 0.1, 0.06, black, [(CX0 + CX1) / 2, 0.05, CZF - 0.02], null, 0); // kick
    b.box(CX1 - CX0, 0.05, 0.04, chrome, [(CX0 + CX1) / 2, 0.18, CZF + 0.06], null, 0); // foot rail
    rb(CX1 - CX0 + 0.05, 0.05, CZF - CZB + 0.08, 0.015, blackTop, [(CX0 + CX1) / 2, 1.0, (CZF + CZB) / 2]);
    b.box(CX1 - CX0 + 0.06, 0.04, 0.03, chrome, [(CX0 + CX1) / 2, 0.98, CZF + 0.05], null, 0);
    b.box(0.5, 0.95, CZF - CZB, redE, [CX1 - 0.25, 0.475, (CZF + CZB) / 2], null, 0.01); // end cap
    b.box(0.03, 0.95, CZF - CZB, chrome, [CX1 + 0.01, 0.475, (CZF + CZB) / 2], null, 0);
    b.box(CX1 - CX0 - 0.6, 0.06, 0.4, white, [(CX0 + CX1) / 2 - 0.3, 0.7, CZB + 0.25], null, 0); // under-counter shelf
    S(CX0, CX1, CZB, CZF, 0, 1.03);
    // on the counter: pie stands under domes, a cake, a sugar pourer row, a donut case, menus
    const glassC = K.glass ? K.glass(0xe8f4f8, 0.3) : white;
    for (const [px, col] of [
      [-5.8, 0xd8a050],
      [-2.4, 0xb82838],
      [0.9, 0xe8d8a0]
    ]) {
      b.cyl(0.03, 0.06, 0.12, chrome, [px, 1.09, (CZF + CZB) / 2], null, 10);
      b.cyl(0.17, 0.17, 0.015, chrome, [px, 1.16, (CZF + CZB) / 2], null, 16);
      b.cyl(0.14, 0.15, 0.06, K.mat(col, 0.7), [px, 1.2, (CZF + CZB) / 2], null, 14);
      b.sph(0.17, glassC, [px, 1.17, (CZF + CZB) / 2], [1, 1.1, 1], 14);
    }
    rb(0.6, 0.3, 0.35, 0.02, glassC, [-4.1, 1.18, (CZF + CZB) / 2]);
    for (let i = 0; i < 4; i++)
      b.tor(0.05, 0.02, K.mat(0xc88a50, 0.7), [-4.3 + i * 0.13, 1.08, (CZF + CZB) / 2], [PI / 2, 0, 0], PI * 2, 10);
    for (let x = -7.4; x < 3; x += 1.6) {
      b.cyl(0.03, 0.03, 0.12, glassC, [x, 1.09, CZF + 0.12 - 0.05], null, 8);
      b.box(0.12, 0.2, 0.01, K.mat(0xc81e26, 0.6), [x + 0.3, 1.13, CZF - 0.1], [-0.3, 0, 0], 0); // menu stand
    }
    // chrome stools with red tops, bolted to the floor
    const stool = sx => {
      const sz = CZF + 0.45;
      b.cyl(0.2, 0.2, 0.09, vinyl, [sx, 0.76, sz], null, 16);
      b.tor(0.2, 0.025, chrome, [sx, 0.74, sz], [PI / 2, 0, 0], PI * 2, 16);
      b.cyl(0.1, 0.12, 0.06, chrome, [sx, 0.69, sz], null, 12);
      b.cyl(0.04, 0.04, 0.62, chrome, [sx, 0.36, sz], null, 10);
      b.cyl(0.2, 0.24, 0.05, chrome, [sx, 0.03, sz], null, 16);
      S(sx - 0.2, sx + 0.2, sz - 0.2, sz + 0.2, 0, 0.8, true);
    };
    for (let sx = -7.6; sx <= 2.9; sx += 0.75) stool(sx);

    /* ---------- the back bar: stainless counter with a shake station, soda taps, coffee urns, menus over it ---------- */
    const BB0 = PZ + p; // dining face of the partition
    // our own short stainless runs either side of the loot units (the units are spawned in bGreasyNeedy)
    const ss = K.brushed ? K.brushed(0xc4c8cc) : steel;
    for (const [x0, x1] of [
      [X0 + IN, -7.0],
      [-2.2, -0.6],
      [2.6, 3.1]
    ]) {
      b.box(x1 - x0, 0.92, 0.6, ss, [(x0 + x1) / 2, 0.46, BB0 + 0.3], null, 0.01);
      rb(x1 - x0, 0.04, 0.62, 0.01, ss, [(x0 + x1) / 2, 0.94, BB0 + 0.31]);
      S(x0, x1, BB0, BB0 + 0.6, 0, 0.95);
    }
    // three-spindle milkshake mixer (mint green), steel cups
    rb(0.4, 0.5, 0.25, 0.04, K.mat(0x9ad8c0, 0.4, 0.2), [-1.8, 1.21, BB0 + 0.2]);
    for (let i = 0; i < 3; i++) b.cyl(0.05, 0.04, 0.18, chrome, [-1.92 + i * 0.12, 1.05, BB0 + 0.38], null, 10);
    // soda fountain tower with taps
    rb(0.5, 0.45, 0.3, 0.04, chrome, [-1.0, 1.18, BB0 + 0.22]);
    for (let i = 0; i < 4; i++)
      b.cyl(0.015, 0.015, 0.1, chrome, [-1.18 + i * 0.12, 1.02, BB0 + 0.4], [PI / 2, 0, 0], 6);
    b.label(0.4, 0.12, strap('gn_soda', 'SODA', 'bold 70px Georgia, serif', '#c8242c', '#ffffff', 256, 80), [
      -1.0,
      1.32,
      BB0 + 0.375
    ]);
    // twin coffee urns
    for (const ux of [2.75, 3.0]) {
      b.cyl(0.11, 0.11, 0.45, chrome, [ux, 1.2, BB0 + 0.25], null, 14);
      b.sph(0.11, chrome, [ux, 1.43, BB0 + 0.25], null, 10);
      b.cyl(0.012, 0.012, 0.06, black, [ux, 1.05, BB0 + 0.37], [PI / 2, 0, 0], 6);
    }
    // stacked cups and glasses on a shelf, a chrome shelf the length of the bar
    b.box(10.5, 0.04, 0.28, ss, [-2.9, 1.65, BB0 + 0.14], null, 0);
    for (let x = -7.9; x < 2.2; x += 0.5) {
      b.cyl(0.04, 0.035, 0.1, white, [x, 1.72, BB0 + 0.14], null, 8);
      b.cyl(0.035, 0.03, 0.14, glassC, [x + 0.2, 1.74, BB0 + 0.14], null, 8);
    }
    // menu boards over the shelf
    const MENUS = [
      menuBoard('gn_menu1', 'GRILL', [
        ['Greasy Burger', '35¢'],
        ['The Needy Melt', '45¢'],
        ['Heart Stopper', '60¢'],
        ['Chili Dog (no)', '25¢'],
        ['Twice-Fried Fries', '15¢']
      ]),
      menuBoard('gn_menu2', 'BREAKFAST', [
        ['Short Stack', '30¢'],
        ['Bacon & Regret', '40¢'],
        ['Hash Brownouts', '15¢'],
        ['Two Eggs Any Way', '25¢'],
        ['Coffee (forever)', '5¢']
      ]),
      menuBoard('gn_menu3', 'FOUNTAIN', [
        ['Thick Shake', '25¢'],
        ['Malted', '25¢'],
        ['Float', '20¢'],
        ['Cola', '5¢'],
        ['Pie a la Mode', '20¢']
      ])
    ];
    MENUS.forEach((m, i) => {
      const mx = -6.6 + i * 3.4;
      b.box(1.5, 1.12, 0.05, black, [mx, 2.42, BB0 + 0.03], null, 0.01);
      b.label(1.42, 1.06, m, [mx, 2.42, BB0 + 0.06]);
    });
    // neon EAT over the kitchen door end, wall clock
    b.label(1.1, 0.45, strap('gn_eat', 'EAT', 'bold 120px Georgia, serif', null, '#ff3030', 256, 110), [
      1.5,
      2.6,
      BB0 + 0.03
    ]);
    b.box(1.0, 0.36, 0.02, K.mat(0x1a0a0a, 0.6), [1.5, 2.6, BB0 + 0.01], null, 0);
    b.cyl(0.24, 0.24, 0.05, chrome, [3.3, 2.55, BB0 + 0.03], [PI / 2, 0, 0], 24);
    b.label(
      0.42,
      0.42,
      K.paint('gn_clock', 128, 128, (c, W, H) => {
        c.fillStyle = '#ffffff';
        c.beginPath();
        c.arc(64, 64, 62, 0, PI * 2);
        c.fill();
        c.strokeStyle = RED;
        c.lineWidth = 6;
        c.stroke();
        c.fillStyle = '#1a1a1a';
        for (let i = 0; i < 12; i++) {
          const a = (i * PI) / 6;
          c.fillRect(64 + Math.cos(a) * 50 - 2, 64 + Math.sin(a) * 50 - 2, 5, 5);
        }
        c.lineWidth = 5;
        c.strokeStyle = '#1a1a1a';
        c.beginPath();
        c.moveTo(64, 64);
        c.lineTo(64, 26);
        c.moveTo(64, 64);
        c.lineTo(92, 74);
        c.stroke();
      }),
      [3.3, 2.55, BB0 + 0.06]
    );

    /* ---------- jukebox, gumball machine, the toilet hall ---------- */
    {
      const jx = X1 - IN - 0.38,
        jz = -3.95;
      b.push([jx, 0, jz], [0, -PI / 2, 0]);
      rb(0.9, 1.15, 0.6, 0.05, K.veneer ? K.veneer(0x7a4a2a) : redE, [0, 0.575, 0]);
      b.cyl(
        0.45,
        0.45,
        0.6,
        K.mat(0xffa040, 0.3, 0, {emissive: 0xff8a20, emissiveIntensity: 1.2}),
        [0, 1.15, 0],
        [PI / 2, 0, 0],
        20,
        false
      );
      b.tor(0.45, 0.04, chrome, [0, 1.15, 0.31], null, PI, 20);
      b.box(0.7, 0.32, 0.02, glassC, [0, 1.0, 0.31], null, 0);
      for (let i = 0; i < 6; i++)
        b.box(
          0.1,
          0.012,
          0.01,
          K.mat(0xffe8a0, 0.4, 0, {emissive: 0xffe0a0, emissiveIntensity: 0.8}),
          [-0.25 + i * 0.1, 0.95, 0.3],
          null,
          0
        );
      b.box(0.6, 0.45, 0.02, K.mat(0x2a1a10, 0.5), [0, 0.42, 0.305], null, 0);
      for (let i = 0; i < 7; i++) b.box(0.035, 0.42, 0.03, chrome, [-0.24 + i * 0.08, 0.42, 0.31], null, 0);
      for (const s of [-1, 1])
        b.box(
          0.06,
          1.1,
          0.04,
          K.mat(0xff4040, 0.3, 0, {emissive: 0xff2a2a, emissiveIntensity: 1.4}),
          [s * 0.43, 0.6, 0.29],
          null,
          0
        );
      b.pop();
      S(jx - 0.32, jx + 0.32, jz - 0.47, jz + 0.47, 0, 1.6);
      // gumball machine on a chrome stand
      const gx = 6.6,
        gz = BZ0 - 0.3;
      b.cyl(0.03, 0.12, 0.9, chrome, [gx, 0.45, gz], null, 12);
      rb(0.22, 0.18, 0.22, 0.03, redE, [gx, 0.99, gz]);
      b.sph(0.17, glassC, [gx, 1.24, gz], null, 14);
      b.sph(0.14, K.mat(0xe85a8a, 0.4), [gx, 1.2, gz], [1, 0.8, 1], 10);
      b.cyl(0.06, 0.08, 0.06, redE, [gx, 1.41, gz], null, 10);
      S(gx - 0.18, gx + 0.18, gz - 0.18, gz + 0.18, 0, 1.45, true);
    }
    // RESTROOM sign over the hall
    b.label(
      1.2,
      0.26,
      strap('gnd_rr', 'RESTROOM  ⟶', 'bold 54px Arial, sans-serif', '#1a1a1a', '#ffffff', 512, 110, 0.3),
      [KX + p + 0.02, 2.5, (WZ + PZ) / 2],
      [0, PI / 2, 0]
    );
    b.label(0.5, 0.18, strap('gn_wcd', 'GUYS & DOLLS', 'bold 40px Arial, sans-serif', '#c8242c', '#ffffff', 256, 90), [
      6.9,
      2.6,
      WZ + p + 0.02
    ]);

    /* ---------- dining walls: flag, records, posters ---------- */
    {
      // the flag on the left wall over the end booth
      b.box(0.03, 0.82, 1.5, K.mat(0x5a3a1a, 0.6), [X0 + IN + 0.02, 2.2, -7.9], null, 0);
      b.label(1.42, 0.75, flagMat(), [X0 + IN + 0.04, 2.2, -7.9], [0, PI / 2, 0]);
      // a run of 45s along the front wall between the window heads and the cove
      const RC = ['#c8242c', '#2a6ab8', '#e8c020', '#2a9a5a'];
      let i = 0;
      for (let x = -7.6; x < 7.6; x += 0.8, i++)
        if (Math.abs(x + 1.0) > 0.8) b.label(0.22, 0.22, recordMat(RC[i % 4]), [x, 2.92, BZ0 - 0.025], [0, PI, 0]);
      // posters: right wall, kitchen-side wall of the hall, left wall
      const PS = [
        [X1 - IN - 0.01, -3.95, -PI / 2],
        [X1 - IN - 0.01, -6.9, -PI / 2],
        [X0 + IN + 0.01, -4.1, PI / 2],
        [KX + p + 0.02, -9.95, PI / 2]
      ];
      PS.forEach(([px, pz, a], k) => {
        b.box(0.02, 0.86, 0.6, chrome, [px - Math.sin(a) * 0.005, 2.0, pz], null, 0);
        b.label(0.54, 0.8, POSTERS[k % POSTERS.length], [px - Math.sin(a) * 0.02, 2.0, pz], [0, a, 0]);
      });
    }

    /* ---------- kitchen: the cook line (fryers, griddle, range, broiler) under a hood ---------- */
    {
      const LZ = PZ - p, // kitchen face of the partition
        lz = LZ - 0.42;
      // fryers
      for (const fx of [-4.6, -4.05]) {
        b.box(0.5, 0.9, 0.8, ss, [fx, 0.45, lz], null, 0.01);
        b.box(0.4, 0.05, 0.55, K.mat(0x6a4a10, 0.2, 0.3), [fx, 0.88, lz + 0.05], null, 0); // oil
        b.box(0.32, 0.18, 0.3, K.mat(0xb8bcc0, 0.4, 0.8), [fx, 1.0, lz + 0.05], null, 0); // basket
        b.box(0.03, 0.03, 0.3, black, [fx, 1.08, lz - 0.2], null, 0);
      }
      // flat-top griddle with a splash guard, a burger or two still on it
      b.box(1.3, 0.85, 0.8, ss, [-3.1, 0.425, lz], null, 0.01);
      b.box(1.24, 0.05, 0.72, K.mat(0x222224, 0.35, 0.7), [-3.1, 0.88, lz + 0.02], null, 0);
      b.box(1.3, 0.22, 0.03, ss, [-3.1, 1.0, LZ - 0.05], null, 0);
      for (const bx of [-3.4, -3.0, -2.75])
        b.cyl(0.06, 0.06, 0.02, K.mat(0x3a1a10, 0.8), [bx, 0.915, lz - 0.05], null, 10);
      for (let k = 0; k < 4; k++) b.cyl(0.02, 0.02, 0.05, black, [-3.6 + k * 0.33, 0.75, lz - 0.41], [PI / 2, 0, 0], 6); // knobs
      // six-burner range with an oven
      b.box(1.0, 0.88, 0.8, ss, [-1.9, 0.44, lz], null, 0.01);
      for (let r2 = 0; r2 < 2; r2++)
        for (let c2 = 0; c2 < 3; c2++)
          b.tor(0.09, 0.012, black, [-2.22 + c2 * 0.32, 0.9, lz - 0.18 + r2 * 0.34], [PI / 2, 0, 0], PI * 2, 12);
      b.box(0.8, 0.45, 0.02, K.mat(0x2a2a2c, 0.4, 0.6), [-1.9, 0.4, lz - 0.41], null, 0);
      b.box(0.5, 0.03, 0.04, chrome, [-1.9, 0.68, lz - 0.43], null, 0);
      b.cyl(0.13, 0.12, 0.2, ss, [-2.05, 1.01, lz - 0.1], null, 12); // stock pot
      // charbroiler
      b.box(0.9, 0.85, 0.8, ss, [-0.95, 0.425, lz], null, 0.01);
      for (let k = 0; k < 8; k++) b.box(0.02, 0.02, 0.6, black, [-1.3 + k * 0.1, 0.89, lz + 0.02], null, 0);
      S(-4.9, -0.45, LZ - 0.82, LZ, 0, 1.05);
      // the hood: stainless canopy over the whole line, filters, a pilot strip
      b.box(4.7, 0.5, 1.1, ss, [-2.7, 2.35, LZ - 0.55], null, 0.01);
      b.box(4.5, 0.25, 0.04, K.mat(0x6a6c6e, 0.5, 0.6), [-2.7, 2.1, LZ - 1.08], null, 0);
      b.box(4.6, 0.04, 1.0, K.mat(0x8a8c8e, 0.5, 0.6), [-2.7, 2.1, LZ - 0.52], null, 0);
      b.box(0.6, 0.6, 0.6, ss, [-1.5, 2.7, LZ - 0.6], null, 0);
      // ticket rail and a stainless pass shelf with heat lamps on the partition
      b.box(4.0, 0.03, 0.06, chrome, [-2.7, 1.55, LZ - 0.04], null, 0);
      for (let k = 0; k < 5; k++) b.box(0.08, 0.12, 0.004, white, [-4.2 + k * 0.7, 1.48, LZ - 0.06], null, 0);
      // fire extinguisher by the line
      b.cyl(0.08, 0.08, 0.5, K.mat(0xc81818, 0.4), [-5.25, 0.45, LZ - 0.12], null, 12);
      b.cyl(0.02, 0.03, 0.08, black, [-5.25, 0.74, LZ - 0.12], null, 6);
      // a mop bucket and a "GREASE IS THE WORD" chalk note
      b.cyl(0.2, 0.17, 0.3, K.mat(0xe8b020, 0.5), [3.0, 0.17, Z0 + IN + 0.4], null, 14);
      b.cyl(0.012, 0.012, 1.2, K.mat(0x8a6a4a, 0.6), [3.05, 0.75, Z0 + IN + 0.4], [0.15, 0, 0.1], 6);
      // a steel work table down the middle (not lootable; the prep tables either side are)
      b.box(1.6, 0.04, 0.7, ss, [0.8, 0.9, -11.6], null, 0);
      b.box(1.5, 0.03, 0.6, ss, [0.8, 0.25, -11.6], null, 0);
      for (const [dx, dz] of [
        [-0.75, -0.3],
        [0.75, -0.3],
        [-0.75, 0.3],
        [0.75, 0.3]
      ])
        b.cyl(0.02, 0.02, 0.9, ss, [0.8 + dx, 0.45, -11.6 + dz], null, 6);
      for (const [bx, bc] of [
        [0.4, 0xe8e0c8],
        [0.85, 0xc84a3a],
        [1.25, 0x9ac060]
      ])
        rb(0.3, 0.12, 0.22, 0.02, K.mat(bc, 0.5), [bx, 0.98, -11.6], null);
      S(0.0, 1.6, -11.95, -11.25, 0, 0.95);
    }

    /* ---------- toilet: WC, basin, mirror, dryer, a cubicle for the WC ---------- */
    {
      const wx = 7.7,
        wz = Z0 + IN + 0.3;
      b.push([wx, 0, wz], [0, 0, 0]);
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
        [0, 0, 0.12],
        16
      );
      b.add(K.cylGeo(0.22, 0.22, 0.03, 16), por, {p: [0, 0.43, 0.12], s: [1, 1, 1.25]});
      b.rbox(0.42, 0.42, 0.2, 0.03, por, [0, 0.62, -0.18]);
      b.box(0.12, 0.04, 0.03, chrome, [0.12, 0.8, -0.07], null, 0);
      b.pop();
      S(wx - 0.3, wx + 0.3, wz - 0.15, wz + 0.55, 0, 0.8, true);
      // cubicle partition (red laminate) beside the WC; the path from the door stays clear
      b.box(0.04, 1.9, 1.5, redE, [6.95, 1.05, Z0 + IN + 0.75], null, 0.01);
      S(6.93, 6.97, Z0 + IN, Z0 + IN + 1.5, 0, 2.0, true);
      b.cyl(0.055, 0.055, 0.11, K.mat(0xffffff, 0.8), [X1 - IN - 0.08, 0.7, wz + 0.2], [0, 0, PI / 2], 12);
      // basin + mirror on the hall-side wall
      const sx = KX + p + 0.25,
        sz = -12.0;
      b.box(0.5, 0.15, 0.42, por, [sx, 0.82, sz], null, 0.04);
      b.cyl(0.04, 0.05, 0.7, por, [sx + 0.03, 0.4, sz], null, 12);
      b.cyl(0.012, 0.012, 0.16, chrome, [sx - 0.15, 0.95, sz], [0, 0, 0.6], 6);
      b.box(0.02, 0.6, 0.5, K.mat(0xcfe0e8, 0.05, 0.9), [KX + p + 0.02, 1.5, sz], null, 0);
      S(sx - 0.25, sx + 0.25, sz - 0.25, sz + 0.25, 0, 0.95, true);
      rb(0.22, 0.25, 0.14, 0.03, white, [KX + p + 0.08, 1.3, -11.3]); // hand dryer
    }

    /* ---------- sidewalk: street lights, meter, hydrant, no parking at the driveway ---------- */
    LK.lightPole(b, S, -7);
    LK.lightPole(b, S, 8.8);
    LK.hydrant(b, S, -2.4);
    LK.meter(b, S, -5.0);
    LK.noParking(b, 0.4, {key: 'gn_np1'});

    return (CACHE = G.done());
  }

  function bGreasyNeedy(x, z, t) {
    const B = mk(x, z, 20, 36, H, 0xefe6cf, 0x8a8e92, 0x2a2c30);
    B.dx = 0;
    const PT = {th: 0.14, c: 0xf2ece0};
    const cp = a => a.map(o => Object.assign({}, o));
    WL(B, 1, Z1, X0, X1, cp(FRONT), H);
    WL(B, 1, Z0, X0, X1, cp(BACK), H);
    WL(B, 0, X0, Z0, Z1, cp(LEFT), H);
    WL(B, 0, X1, Z0, Z1, cp(RIGHT), H);
    // kitchen partition + its side wall; the toilet front
    WL(B, 1, PZ, X0, KX, cp(PART), H, PT);
    WL(B, 0, KX, Z0, PZ, [], H, PT);
    WL(B, 1, WZ, KX, X1, cp(WCF), H, PT);
    LK.attach(B, build());
    // 1950s cars in the car park: nosed in to the diner like the old postcards, one by the street
    try {
      if (window.MFZV) {
        const flip = B.cs < 0 ? PI : 0;
        for (const [kind, cx, cz, rot, tint] of [
          ['sedan', -7.8, 1.6, PI, [0.62, 0.08, 0.1]],
          ['coupe', 0.3, 1.5, PI, [0.55, 0.06, 0.08]],
          ['cabriolet', 5.5, 1.5, PI, [0.42, 0.66, 0.72]],
          ['pickup', -5.3, 12.4, 0, [0.85, 0.82, 0.7]]
        ]) {
          const g = MFZV.make(kind, WX(B, cx), WZ(B, cz), rot + flip, {tint, dust: true});
          const h = g && g.userData && g.userData.half;
          const hx = h ? h[0] : 1.1,
            hz = h ? h[1] : 2.5;
          B.occ.push([cx - hx, cx + hx, cz - hz, cz + hz]);
        }
      }
    } catch (e) {}
    const SP = LK.spawner(B, 'diner');
    const BB = PZ + 0.075 + 0.35, // back bar units, against the partition, facing the counter
      KB = Z0 + 0.15 + 0.4; // kitchen back wall
    // dining: the till on the counter end, back bar units, the jukebox-side drinks cooler
    SP(2.55, -7.17, 'cash_register', 'diner', PI, 1.03);
    for (const bx of [-6.2, -4.6, -3.0, 0.2, 1.8]) SP(bx, BB, 'kitchen_counter', 'gn_counter', 0);
    SP(X1 - 0.55, -8.35, 'drinks_cooler', 'convenience', -PI / 2);
    // kitchen: prep tables, back-wall fridges / freezer / sink / dish station, dry stores, boxes (back door x -6.65..-5.35 kept clear)
    SP(-3.6, -11.6, 'prep_table', 'gn_kitchen', 0);
    SP(-1.6, -11.6, 'prep_table', 'gn_kitchen', 0);
    SP(-7.85, KB + 0.07, 'fridge_modern', 'gn_kitchen', 0);
    SP(-4.3, KB, 'kitchen_sink', 'gn_kitchen', 0);
    SP(-2.8, KB, 'dish_station', 'gn_kitchen', 0);
    SP(-1.4, KB + 0.05, 'freezer_upright', 'gn_kitchen', 0);
    SP(-0.3, KB + 0.07, 'fridge_retro', 'gn_kitchen', 0);
    SP(1.4, KB, 'shop_shelf_wall', 'gn_stores', 0);
    SP(X0 + 0.5, -9.95, 'shop_shelf_wall', 'gn_stores', PI / 2);
    SP(KX - 0.5, -12.6, 'dry_goods_case', 'gn_stores', -PI / 2);
    SP(-7.7, -12.55, 'cardboard_box_medium', 'gn_stores', 0.3);
    SP(2.3, -12.9, 'cardboard_box_large', 'gn_stores', -0.2);
    SP(2.9, -12.4, 'cardboard_box_small', 'gn_stores', 0.5);
    // toilet: the first-aid cabinet
    SP(KX + 0.4, -13.3, 'medicine_cabinet', 'gn_wc', PI / 2);
    // service strip: the dumpster, clear of the back door
    SP(3.6, Z0 - 1.6, 'dumpster_blue', 'storage', PI);
    return LK.finish(B, t, {
      at: [(X0 + X1) / 2, (Z0 + Z1) / 2],
      w: X1 - X0,
      d: Z1 - Z0,
      loot: ['gn_counter', [-7, 2.5, -8.9, -7.9], 1],
      zombies: [
        [-5.5, -5.6],
        [1.5, -5.7],
        [6.8, -7.0],
        [-2.6, -10.65],
        [2.0, -12.8],
        [6.3, -11.6],
        [-4.0, 6.5],
        [4.5, 7.5],
        [-6.5, -16.0],
        [3.0, -16.5]
      ]
    });
  }

  const e = LK.register({
    id: 'diner',
    name: 'Greasy & Needy Diner',
    build: bGreasyNeedy,
    note: 'half plot: 1950s diner on the back half (booths, counter + stools, back bar, jukebox, kitchen, customer toilet), car park in front with 50s cars, neon roof sign',
    globals: {bGreasyNeedy, GREASYNEEDY: {build}}
  });
  if (e) e.loot = 'diner';
  console.log('[greasyneedy] Greasy & Needy Diner ready');
})();
