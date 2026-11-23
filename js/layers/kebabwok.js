/* ==========================================================================================================
   MINI FORT ZOMBIE - KEBABSOLUTELY / NIGHTMARE ON WOK STREET (v089n): one half plot (20 x 36 m, front = +Z) holding TWO takeaways,
   our own design. Replaces the Mr. Foo's Takeout placeholder (core NEWCAT id mr_foos_takeout, half pool).
   One 18 x 15.5 m block split down the middle by a solid party wall (x = 0). Same plan both sides (mirrored), each with its own
   front door, back door, shopfront, fascia and interior.
   LEFT - KEBABSOLUTELY (kebab & burger takeaway): a red lightbox fascia with a grill photo panel and phone number, a projecting
   OPEN / doner blade sign, a red shopfront, a 0-star hygiene sticker. Inside: grey chequer floor, quilted steel lower walls under red
   paint, backlit menu boards, a waiting bench, a glass-fronted counter with salad wells and the till, two doner spits and a chip fryer
   on the back bar.
   RIGHT - NIGHTMARE ON WOK STREET (Chinese takeaway): a red fascia with yellow brush lettering, paper lanterns, a gold-and-red
   shopfront, a JUST EATEN sticker. Inside: red quarry tile, dark panelling under cream with a gold band, a waiting bench, a lucky cat
   and a fish tank, a red counter with the till and menu, a hot cabinet of foil trays behind.
   Both: a CUSTOMER TOILET off the waiting area, a kitchen behind the counter (kebab: prep tables, slicer, fridge, chest freezer;
   wok: a flaming wok range under a hood, rice cooker, steamer stack, rice sacks), and two questionable back rooms each: a store /
   "meat room" with a chained chest freezer, mincer and stains, and a back room with a camp bed, card table, cash and dodgy boxes.
   Outside: benches, bins, A-boards and two vending machines per shop on the front apron; a delivery scooter. Behind: a dingy yard
   open to the alley (bin bags, waste-oil drums, extract ducts, puddles, a dumped mattress, the smoke spot, weeds, board fences).
   Structure from core WL (doors / windows work); detail is our own geometry and painted artwork, outside the static merge.
   ========================================================================================================== */
(function () {
  'use strict';
  const K = window.MFZK,
    LK = window.LOTKIT;
  if (!K || !LK || typeof WL !== 'function' || typeof NEWCAT === 'undefined') {
    console.warn('[kebabwok] core / prop kit missing');
    return;
  }
  const T = THREE,
    P = K.P,
    PI = Math.PI;
  // the block (half plot: x -10..10), the party wall, heights
  const X0 = -9,
    X1 = 9,
    XM = 0, // party wall: Kebabsolutely to the left (-x), Nightmare on Wok Street to the right (+x)
    Z0 = -7.5,
    Z1 = 8,
    H = 4.2,
    CEIL = 3.0, // drop ceilings front and kitchen
    RC = 2.8, // rear rooms ceiling
    FAS = 2.95; // underside of the fascias
  // each shop in "u" = distance from the party wall (0..9); world x = s * u, s = -1 (kebab) or +1 (wok)
  const PZ = 2.6, // servery / kitchen partition
    KZ = -2.4, // kitchen / back rooms partition
    RU = 4.5, // back rooms divider (store u 0..RU, back room u RU..9)
    TU = 6.8, // customer toilet: u TU..9
    TZ = 5.8, // customer toilet: z PZ..TZ
    CZ = 4.8, // counter centre line (v101: was 4.4; the staff aisle behind it was 0.73 m, now 1.13 m)
    CU0 = 1.6, // counter runs u CU0..TU (the gap by the party wall leads to the kitchen door)
    CU1 = TU;
  const U_FRONT = [
    {k: 'w', c: 7.8},
    {k: 'w', c: 6.2},
    {k: 'd', c: 4.6},
    {k: 'w', c: 2.9}
  ];
  const U_BACK = [{k: 'd', c: 2.2, s: -1}];
  const SIDE = [
    {k: 'w', c: 0.2},
    {k: 'w', c: -5.0}
  ];
  const U_PART = [{k: 'd', c: 0.85}]; // servery / kitchen
  const U_KPART = [
    {k: 'd', c: 2.2},
    {k: 'd', c: 6.8}
  ]; // kitchen / store, kitchen / back room
  const U_WC = [{k: 'd', c: 7.55}]; // customer toilet front wall (z = TZ); v089: was 7.9, the cooler / fish tank stood in front of it
  // u-ops -> world ops for one side, sorted along +x
  const opsU = (ops, s) => ops.map(o => Object.assign({}, o, {c: s * o.c})).sort((p, q) => p.c - q.c);
  const FRONT = opsU(U_FRONT, -1).concat(opsU(U_FRONT, 1));
  const BACK = opsU(U_BACK, -1).concat(opsU(U_BACK, 1));

  /* ===================== loot tables (filler building: light) ===================== */
  const TABLES = ['kb_kitchen', 'nw_kitchen', 'kw_back', 'kw_wc'];
  try {
    Object.assign(LOOT_TABLES, {
      // Kebabsolutely kitchen: salad, sauces in jars, mystery meat, a knife
      kb_kitchen: {
        lamburger: 3,
        salad: 3,
        pickles: 2,
        sausages: 1,
        apollo_meat: 2,
        popzi_soft_drink: 2,
        butcher_knife: 1
      },
      // Nightmare on Wok Street kitchen: rice, noodles, soup
      nw_kitchen: {
        rice: 4,
        ramen_noodles: 3,
        instant_ramen: 2,
        tampopo_ramen: 1,
        kenball_soup: 2,
        pickled_eggs: 1,
        sugar: 1,
        butcher_knife: 1
      },
      // the questionable back rooms: odds the staff kept back there
      kw_back: {
        duct_tape: 2,
        rope: 2,
        z_energy_drink: 2,
        potato_chips: 1,
        salami: 1,
        painkiller: 1,
        spray_paint: 1,
        nails: 1
      },
      // the customer toilets: whatever is in the cabinet
      kw_wc: {painkiller: 1, cotton_balls: 2, hairspray: 1, gauze: 1}
    });
    for (const tn of TABLES)
      for (const id in LOOT_TABLES[tn])
        if (!ITEMS[id]) {
          console.error('[kebabwok] loot table ' + tn + ' has unknown item ' + id);
          delete LOOT_TABLES[tn][id];
        }
    if (typeof LOOT_PROP !== 'undefined')
      for (const tn of TABLES) LOOT_PROP[tn] = tn === 'kw_wc' ? 'cabinet' : tn === 'kw_back' ? 'box' : 'fridge';
    const A = window.MFZPROP && MFZPROP.auto;
    if (A) {
      const pick = (...ts) => [...new Set(ts.flatMap(t => A[t] || []))];
      A.kb_kitchen = pick('takeout', 'butcher', 'house');
      A.nw_kitchen = pick('takeout', 'house');
      A.kw_back = pick('storage', 'house');
      A.kw_wc = pick('house', 'clinic');
    }
  } catch (e) {
    console.warn('[kebabwok] loot tables', e);
  }

  /* ===================== artwork ===================== */
  const RED = '#c4141c',
    GOLD = '#f2c21a',
    INK = '#18191b',
    SERIF = 'Georgia, "Times New Roman", serif',
    SANS = 'Arial, Helvetica, sans-serif',
    IMPACT = 'Impact, "Arial Black", sans-serif',
    BRUSH = '"Brush Script MT", "Segoe Script", cursive';
  const strapMat = (key, text, font, bg, fg, w, h) =>
    K.paint(key, w || 512, h || 64, (c, W, H) => {
      c.fillStyle = bg;
      c.fillRect(0, 0, W, H);
      c.fillStyle = fg;
      c.font = font;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText(text, W / 2, H / 2 + 2);
    });
  // clear window lettering, lines of [text, font, colour, y]
  const decal = (key, lines, w, h) =>
    K.paint(
      key,
      w || 512,
      h || 256,
      (c, W, H) => {
        c.clearRect(0, 0, W, H);
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        for (const [t, f, col, y] of lines) {
          c.font = f;
          c.fillStyle = col;
          c.fillText(t, W / 2, y);
        }
      },
      {alpha: true}
    );

  const txt = (c, t, x, y, font, col, max, shadow) => {
    c.font = font;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    if (shadow) {
      c.fillStyle = shadow;
      c.fillText(t, x + 4, y + 4, max);
    }
    c.fillStyle = col;
    c.fillText(t, x, y, max);
  };
  // a burger seen side-on, centred at (x, y), ~s px wide
  function drawBurger(c, x, y, s) {
    c.fillStyle = '#d88a30';
    c.beginPath();
    c.ellipse(x, y - s * 0.12, s * 0.5, s * 0.3, 0, PI, 0);
    c.fill();
    c.fillStyle = '#f4e8b0';
    for (let i = 0; i < 6; i++) c.fillRect(x - s * 0.3 + i * s * 0.11, y - s * 0.3, 3, 2);
    c.fillStyle = '#5ab030';
    c.fillRect(x - s * 0.52, y - s * 0.12, s * 1.04, s * 0.07);
    c.fillStyle = '#f4b820';
    c.fillRect(x - s * 0.5, y - s * 0.06, s, s * 0.06);
    c.fillStyle = '#5a3018';
    c.fillRect(x - s * 0.48, y, s * 0.96, s * 0.14);
    c.fillStyle = '#d88a30';
    c.fillRect(x - s * 0.46, y + s * 0.14, s * 0.92, s * 0.12);
  }
  // kebab meat on skewers over grill bars (the fascia photo panel)
  function drawGrill(c, x0, y0, w, h, r) {
    c.fillStyle = '#1a1210';
    c.fillRect(x0, y0, w, h);
    c.fillStyle = '#ff8a20';
    c.globalAlpha = 0.35;
    c.fillRect(x0, y0 + h * 0.7, w, h * 0.3);
    c.globalAlpha = 1;
    c.strokeStyle = '#5a5048';
    c.lineWidth = 4;
    for (let i = 0; i < w; i += 16) {
      c.beginPath();
      c.moveTo(x0 + i, y0 + h);
      c.lineTo(x0 + i + h * 0.4, y0);
      c.stroke();
    }
    for (let k = 0; k < 4; k++) {
      const yy = y0 + 18 + k * (h / 4);
      c.strokeStyle = '#c8c8c8';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(x0, yy);
      c.lineTo(x0 + w, yy + 6);
      c.stroke();
      for (let i = 0; i < 6; i++) {
        c.fillStyle = `hsl(${18 + r() * 14},${60 + r() * 20}%,${28 + r() * 18}%)`;
        c.beginPath();
        c.ellipse(x0 + 14 + i * (w / 6), yy + 3, w / 15, h / 11, r() - 0.5, 0, PI * 2);
        c.fill();
        if (i % 2) {
          c.fillStyle = k % 2 ? '#3a8a2a' : '#e8c020';
          c.fillRect(x0 + 6 + i * (w / 6), yy - 4, 9, 8);
        }
      }
    }
  }
  const kbFascia = () =>
    K.paint('kb_fascia', 1024, 192, (c, W, H, r) => {
      const g = c.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#d8161e');
      g.addColorStop(1, '#a00e14');
      c.fillStyle = g;
      c.fillRect(0, 0, W, H);
      drawGrill(c, 0, 0, 250, H, r);
      c.fillStyle = '#d8161e';
      c.beginPath();
      c.moveTo(220, 0);
      c.lineTo(290, 0);
      c.lineTo(250, H);
      c.lineTo(180, H);
      c.fill();
      txt(c, 'KEBABSOLUTELY', 600, 70, 'bold 92px ' + SERIF, '#ffffff', 640, '#3a0406');
      txt(c, 'KEBAB & BURGER HOUSE', 600, 136, 'bold 38px ' + SERIF, '#ffffff', 600);
      txt(c, 'TEL : 0666 101 666', 600, 174, 'bold 24px ' + SANS, '#ffe8a0', 400);
      drawBurger(c, 960, 60, 90);
      drawBurger(c, 960, 146, 90);
    });
  // a wok tossing flames, centred at (x, y)
  function drawWok(c, x, y, s) {
    for (let i = 0; i < 5; i++) {
      c.fillStyle = ['#ffd23a', '#ff9a20', '#ff5a10'][i % 3];
      c.beginPath();
      c.moveTo(x - s * 0.4 + i * s * 0.2, y - s * 0.05);
      c.quadraticCurveTo(
        x - s * 0.5 + i * s * 0.22,
        y - s * 0.6,
        x - s * 0.3 + i * s * 0.18,
        y - s * (0.7 + (i % 2) * 0.2)
      );
      c.quadraticCurveTo(x - s * 0.25 + i * s * 0.2, y - s * 0.4, x - s * 0.25 + i * s * 0.2, y - s * 0.05);
      c.fill();
    }
    c.fillStyle = '#111';
    c.beginPath();
    c.ellipse(x, y, s * 0.55, s * 0.24, 0, 0, PI);
    c.fill();
    c.fillRect(x + s * 0.5, y - 4, s * 0.45, 8);
  }
  const nwFascia = () =>
    K.paint('nw_fascia', 1024, 192, c => {
      const g = c.createLinearGradient(0, 0, 0, 192);
      g.addColorStop(0, '#d0141a');
      g.addColorStop(1, '#980c12');
      c.fillStyle = g;
      c.fillRect(0, 0, 1024, 192);
      c.strokeStyle = GOLD;
      c.lineWidth = 5;
      c.strokeRect(8, 8, 1008, 176);
      drawWok(c, 100, 120, 130);
      c.save();
      c.transform(1, 0, -0.12, 1, 0, 0);
      // v090: both lines clear of the right-hand wok (the last letter of Street was under it)
      txt(c, 'Nightmare', 370, 72, 'italic bold 88px ' + BRUSH + ', ' + SERIF, GOLD, 330, '#4a0404');
      txt(c, 'on Wok Street', 690, 76, 'italic bold 68px ' + BRUSH + ', ' + SERIF, GOLD, 300, '#4a0404');
      c.restore();
      txt(c, 'CHINESE TAKEAWAY · DELIVERY', 560, 138, 'bold 34px ' + SANS, '#ffffff', 640);
      txt(c, 'TEL 0666 888 888', 560, 172, 'bold 26px ' + SANS, '#ffe8a0', 400);
      drawWok(c, 935, 120, 110);
    });
  // the 0-star food hygiene sticker (green, the 0 picked out)
  const hygMat = () =>
    K.paint('kw_hyg', 256, 160, c => {
      c.fillStyle = '#ffffff';
      c.fillRect(0, 0, 256, 160);
      c.fillStyle = '#1e8a3a';
      c.fillRect(6, 6, 244, 44);
      txt(c, 'FOOD HYGIENE RATING', 128, 29, 'bold 22px ' + SANS, '#ffffff', 236);
      for (let i = 0; i <= 5; i++) {
        c.fillStyle = i === 0 ? '#111' : '#d8e8d8';
        c.beginPath();
        c.arc(28 + i * 40, 92, 17, 0, PI * 2);
        c.fill();
        txt(c, String(i), 28 + i * 40, 93, 'bold 24px ' + SANS, i === 0 ? '#fff' : '#7a9a7a');
      }
      txt(c, 'URGENT IMPROVEMENT NECESSARY', 128, 136, 'bold 15px ' + SANS, '#c4141c', 240);
    });
  // JUST EATEN (orange delivery-app sticker)
  const eatenMat = () =>
    K.paint('kw_eaten', 256, 128, c => {
      c.fillStyle = '#ff5a00';
      c.fillRect(0, 0, 256, 128);
      c.fillStyle = '#ffffff';
      c.beginPath();
      c.moveTo(40, 72);
      c.lineTo(64, 40);
      c.lineTo(88, 72);
      c.fill();
      c.fillRect(48, 70, 32, 26);
      txt(c, 'JUST', 168, 46, 'bold 40px ' + SANS, '#ffffff');
      txt(c, 'EATEN', 168, 88, 'bold 40px ' + SANS, '#ffffff');
    });
  // a menu picture board: dish photos painted in code with a name and price
  const menuMat = (key, items, bg, fg) =>
    K.paint(key, 512, 256, (c, W, H, r) => {
      c.fillStyle = bg;
      c.fillRect(0, 0, W, H);
      const n = items.length,
        cw = W / n;
      items.forEach(([name, price, kind], i) => {
        const x = cw * i + cw / 2;
        c.fillStyle = '#1a1a1a';
        c.fillRect(cw * i + 8, 10, cw - 16, 150);
        if (kind === 'burger') drawBurger(c, x, 90, cw * 0.6);
        else if (kind === 'wrap') {
          c.fillStyle = '#e8c890';
          c.beginPath();
          c.moveTo(x - cw * 0.3, 140);
          c.lineTo(x + cw * 0.3, 140);
          c.lineTo(x, 30);
          c.fill();
          for (let k = 0; k < 14; k++) {
            c.fillStyle = k % 3 ? '#8a3a18' : k % 2 ? '#3a9a2a' : '#d82a1a';
            c.fillRect(x - 20 + r() * 40, 50 + r() * 50, 10, 8);
          }
        } else if (kind === 'chips') {
          c.fillStyle = '#c4141c';
          c.fillRect(x - 28, 90, 56, 60);
          c.fillStyle = '#f4c840';
          for (let k = 0; k < 12; k++) c.fillRect(x - 26 + k * 4.5, 40 + (k % 3) * 8, 5, 60);
        } else if (kind === 'rice' || kind === 'noodle') {
          c.fillStyle = '#f2f2ee';
          c.beginPath();
          c.ellipse(x, 110, cw * 0.36, 34, 0, 0, PI);
          c.fill();
          for (let k = 0; k < 40; k++) {
            c.fillStyle = kind === 'rice' ? (k % 4 ? '#f0d890' : '#5ab030') : k % 5 ? '#e8b860' : '#c43a1a';
            if (kind === 'rice') c.fillRect(x - 40 + r() * 80, 88 + r() * 24, 6, 4);
            else c.fillRect(x - 44 + r() * 88, 82 + r() * 26, 22, 3);
          }
        } else {
          c.fillStyle = '#c86a1a';
          for (let k = 0; k < 7; k++) {
            c.beginPath();
            c.arc(x - 30 + r() * 60, 80 + r() * 50, 12, 0, PI * 2);
            c.fill();
          }
        }
        txt(c, name, x, 186, 'bold 22px ' + SANS, fg, cw - 10);
        txt(c, price, x, 226, 'bold 34px ' + IMPACT, GOLD, cw - 10);
      });
    });
  // chalk / poster A-board face
  const boardMat = (key, lines, bg) =>
    K.paint(key, 256, 384, (c, W, H, r) => {
      c.fillStyle = bg || '#1f2421';
      c.fillRect(0, 0, W, H);
      P.noise(c, W, H, r, 1200, 0.08, '#ffffff', 1);
      let y = 0;
      for (const [t, f, col, dy] of lines) {
        y += dy || 46;
        txt(c, t, W / 2, y, f, col || '#f2efe4', W - 16);
      }
    });

  /* ===================== surfaces ===================== */
  const SURF = {};
  const surf = k =>
    SURF[k] ||
    (SURF[k] = {
      asphalt: () => K.surf('asphalt', 0x34363a),
      concrete: () => K.surf('concrete', 0xaeaaa0),
      fence: () => K.surf('wood', 0x5a4838),
      // yellow-grey London stock brick, sooty
      brick: () =>
        K.tri(
          'kw_brick',
          (c, W, H, r) => {
            c.fillStyle = '#7a766c';
            c.fillRect(0, 0, W, H);
            const rows = 16,
              bh = H / rows,
              bw = W / 4;
            for (let j = 0; j < rows; j++)
              for (let i = -1; i < 5; i++) {
                const x = i * bw + (j % 2 ? bw / 2 : 0);
                c.fillStyle = `hsl(${36 + r() * 14},${18 + r() * 14}%,${40 + r() * 14}%)`;
                c.fillRect(x + 2, j * bh + 2, bw - 4, bh - 4);
              }
            P.noise(c, W, H, r, 6000, 0.18, '#1a1a14', 1.3);
            P.grime(c, W, H, r, 0.5);
          },
          {tile: 1.2, r: 0.9}
        ),
      redP: () => K.mat(0xb8141c, 0.45),
      goldP: () => K.mat(0xc89a2a, 0.4, 0.4),
      blackP: () => K.mat(0x18191b, 0.5),
      coping: () => K.mat(0xb8b2a4, 0.7),
      alu: () => K.mat(0xb0b4b8, 0.35, 0.7)
    }[k]());

  /* ===================== geometry ===================== */
  let CACHE = null;
  function build() {
    if (CACHE) return CACHE;
    const G = LK.geo('kebabwok'),
      b = G.b,
      S = G.S;
    const conc = surf('concrete'),
      asph = surf('asphalt');
    /* ---------- grounds: sidewalk, front apron, side walks, back yard ---------- */
    LK.pavement(b, conc, {w: 20, kerb: true});
    b.box(20, 0.04, 15.9 - Z1, conc, [0, 0.02, (Z1 + 15.9) / 2], null, 0); // front apron
    b.box(1.0, 0.04, Z1 - Z0, conc, [-9.5, 0.02, (Z0 + Z1) / 2], null, 0); // side walks
    b.box(1.0, 0.04, Z1 - Z0, conc, [9.5, 0.02, (Z0 + Z1) / 2], null, 0);
    b.box(20, 0.02, 18 + Z0, asph, [0, 0.012, (-18 + Z0) / 2], null, 0); // back yard, out to the alley

    const brk = surf('brick'),
      redP = surf('redP'),
      goldP = surf('goldP'),
      blackP = surf('blackP'),
      cop = surf('coping'),
      alu = surf('alu'),
      dark = K.mat(0x1c1c1e, 0.5),
      steel = K.mat(0x9a9ea2, 0.4, 0.7),
      white = K.mat(0xf2f2ee, 0.6),
      warm = K.mat(0xfff2c8, 0.4, 0, {emissive: 0xffd890, emissiveIntensity: 1.3}),
      lit = K.mat(0xffffff, 0.4, 0, {emissive: 0xf6f8ff, emissiveIntensity: 0.95});
    const rb = (w, h, d, r, m, p, rot) => b.rbox(w, h, d, r, m, p, rot, 1);

    /* ---------- exterior skin: sooty brick all round; red shopfront (kebab), red and gold shopfront (wok) ---------- */
    const skin = (ax, f, a0, a1, n, ops, low, riser) => {
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
        if (low) {
          put(y0, Math.min(y1, 0.8), riser || low);
          put(Math.max(y0, 0.8), Math.min(y1, FAS), low);
          put(Math.max(y0, FAS), y1, brk);
        } else put(y0, y1, brk);
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
    skin(1, Z1, X0 - 0.15, XM, 1, opsU(U_FRONT, -1), redP, dark);
    skin(1, Z1, XM, X1 + 0.15, 1, opsU(U_FRONT, 1), redP, goldP);
    skin(0, X0, Z0, Z1, -1, SIDE);
    skin(0, X1, Z0, Z1, 1, SIDE);
    skin(1, Z0, X0 - 0.15, X1 + 0.15, -1, BACK);
    b.box(0.5, FAS, 0.12, brk, [XM, FAS / 2, Z1 + 0.22], null, 0.01); // brick pier between the shopfronts

    /* ---------- parapet, flat roof ---------- */
    const par = (ax, f, a0, a1) => {
      const L = a1 - a0,
        u = (a0 + a1) / 2;
      if (ax) {
        b.box(L, 0.7, 0.3, brk, [u, H + 0.35, f], null, 0);
        b.box(L + 0.1, 0.08, 0.42, cop, [u, H + 0.74, f], null, 0.01);
      } else {
        b.box(0.3, 0.7, L, brk, [f, H + 0.35, u], null, 0);
        b.box(0.42, 0.08, L + 0.1, cop, [f, H + 0.74, u], null, 0.01);
      }
    };
    par(1, Z1, X0 - 0.15, X1 + 0.15);
    par(1, Z0, X0 - 0.15, X1 + 0.15);
    par(0, X0, Z0, Z1);
    par(0, X1, Z0, Z1);
    par(0, XM, Z0, Z1); // the party wall rises through the roof
    b.box(X1 - X0, 0.12, Z1 - Z0, K.surf('concrete', 0x5a5a58), [0, H + 0.02, (Z0 + Z1) / 2], null, 0);
    b.box(X1 - X0 - 0.3, 0.02, Z1 - Z0 - 0.3, K.mat(0x3a3c40, 0.9), [0, H + 0.09, (Z0 + Z1) / 2], null, 0);

    /* ---------- shopfront frames: red on the kebab shop, red with gold beads on the wok ---------- */
    for (const s of [-1, 1]) {
      const fm = s < 0 ? redP : redP;
      for (const w of opsU(U_FRONT, s)) {
        if (w.k === 'w') {
          b.box(1.66, 0.08, 0.2, s < 0 ? dark : goldP, [w.c, 0.9, Z1 + 0.24], null, 0.01);
          b.frame(1.56, 1.9, 0.08, fm, [w.c, 1.825, Z1 + 0.19], 0.06);
          b.box(1.4, 0.04, 0.04, s < 0 ? white : goldP, [w.c, 2.3, Z1 + 0.2], null, 0); // transom bar
        } else b.frame(1.42, 2.5, 0.1, fm, [w.c, 1.25, Z1 + 0.19], 0.07);
      }
    }
    for (const [fx, nx] of [
      [X0, -1],
      [X1, 1]
    ])
      for (const w of SIDE) {
        b.box(0.16, 0.07, 1.62, cop, [fx + nx * 0.22, 0.9, w.c], null, 0.01);
        b.push([fx + nx * 0.19, 1.825, w.c], [0, PI / 2, 0]);
        b.frame(1.56, 1.9, 0.07, alu, [0, 0, 0], 0.06);
        b.pop();
        // rusty security bars over the side windows
        for (let k = -3; k <= 3; k++)
          b.cyl(0.012, 0.012, 1.9, K.mat(0x5a4030, 0.8, 0.4), [fx + nx * 0.26, 1.825, w.c + k * 0.22], null, 6);
        for (const by of [1.0, 2.65])
          b.box(0.03, 0.04, 1.5, K.mat(0x5a4030, 0.8, 0.4), [fx + nx * 0.26, by, w.c], null, 0);
      }

    /* ---------- fascias: the Kebabsolutely red lightbox, the Nightmare on Wok Street red and gold board ---------- */
    const fw = XM - X0 - 0.4;
    for (const s of [-1, 1]) {
      const cx = s * 4.5,
        kb = s < 0;
      // v090: the fascia box is sized round its artwork (the 1.6 m tall sign stuck out of a 0.9 m box, over both rails)
      const lw = fw - 0.3,
        lh = lw * (192 / 1024),
        bh = lh + 0.14,
        by = FAS + bh / 2;
      rb(fw + 0.1, bh, 0.3, 0.02, kb ? K.mat(0x8a0a10, 0.5) : redP, [cx, by, Z1 + 0.3]);
      b.label(lw, lh, kb ? kbFascia() : nwFascia(), [cx, by, Z1 + 0.455]);
      b.box(fw + 0.2, 0.06, 0.34, kb ? alu : goldP, [cx, FAS + bh + 0.02, Z1 + 0.3], null, 0.01);
      b.box(fw + 0.2, 0.06, 0.34, kb ? alu : goldP, [cx, FAS - 0.01, Z1 + 0.3], null, 0.01);
    }
    // Kebabsolutely projecting blade sign at the left corner: red box, OPEN, a doner cone
    {
      const bx = X0 + 0.45,
        bz = Z1 + 0.85;
      const blade = K.paint('kb_blade', 128, 256, c => {
        c.fillStyle = '#ffffff';
        c.fillRect(0, 0, 128, 256);
        c.fillStyle = RED;
        c.fillRect(6, 6, 116, 244);
        txt(c, 'OPEN', 64, 34, 'bold 34px ' + SANS, '#ffffff');
        c.fillStyle = '#8a4a20';
        c.beginPath();
        c.moveTo(34, 70);
        c.lineTo(94, 70);
        c.lineTo(74, 200);
        c.lineTo(54, 200);
        c.fill();
        c.strokeStyle = '#5a2a10';
        c.lineWidth = 3;
        for (let y = 82; y < 196; y += 12) {
          c.beginPath();
          c.moveTo(36 + (y - 70) * 0.15, y);
          c.lineTo(92 - (y - 70) * 0.15, y + 4);
          c.stroke();
        }
        c.fillStyle = '#cccccc';
        c.fillRect(62, 56, 4, 160);
        txt(c, 'KEBAB', 64, 232, 'bold 30px ' + SANS, '#ffffff');
      });
      b.box(0.08, 0.06, 0.9, steel, [bx, 3.95, bz - 0.35], null, 0);
      b.box(0.08, 0.06, 0.9, steel, [bx, 3.05, bz - 0.35], null, 0);
      b.box(0.14, 1.1, 0.62, K.mat(0xf2f2ee, 0.5), [bx, 3.5, bz], null, 0.02);
      b.label(0.58, 1.06, blade, [bx - 0.075, 3.5, bz], [0, -PI / 2, 0]);
      b.label(0.58, 1.06, blade, [bx + 0.075, 3.5, bz], [0, PI / 2, 0]);
    }
    // Nightmare on Wok Street: red paper lanterns under the fascia
    {
      const lan = K.mat(0xd01418, 0.6, 0, {emissive: 0xff2010, emissiveIntensity: 0.35});
      for (const lx of [1.6, 3.3, 6.0, 7.9]) {
        b.cyl(0.006, 0.006, 0.3, dark, [lx, FAS - 0.15, Z1 + 0.55], null, 4);
        b.add(K.sphGeo(0.2, 12, 8), lan, {p: [lx, FAS - 0.48, Z1 + 0.55], s: [1, 0.85, 1]});
        for (const dy of [-0.15, 0.15]) b.cyl(0.1, 0.1, 0.04, goldP, [lx, FAS - 0.48 + dy, Z1 + 0.55], null, 10);
        b.cyl(0.01, 0.03, 0.22, K.mat(0xf2c21a, 0.8), [lx, FAS - 0.78, Z1 + 0.55], null, 6); // tassel
      }
    }
    // window lettering and menu pictures
    for (const [x, key, lines] of [
      [
        -7.8,
        'kb_w1',
        [
          ['DONER · SHISH', 'bold 52px ' + IMPACT, '#ffffff', 70],
          ['BURGERS · WRAPS', 'bold 52px ' + IMPACT, '#ffd23a', 140],
          ['OPEN TILL 3AM', 'bold 40px ' + SANS, '#ffffff', 210]
        ]
      ],
      [
        -2.9,
        'kb_w2',
        [
          ['CHIPS WITH', 'bold 56px ' + IMPACT, '#ffffff', 80],
          ['EVERYTHING', 'bold 56px ' + IMPACT, '#ffd23a', 150],
          ['(DON’T ASK WHAT’S IN IT)', 'italic 26px ' + SANS, '#ffffff', 210]
        ]
      ],
      [
        2.9,
        'nw_w1',
        [
          ['SPECIAL', 'bold 56px ' + SERIF, GOLD, 70],
          ['FRIED RICE', 'bold 56px ' + SERIF, GOLD, 140],
          ['OPEN 7 DAYS', 'bold 38px ' + SANS, '#ffffff', 210]
        ]
      ],
      [
        7.8,
        'nw_w2',
        [
          ['FREE PRAWN', 'bold 50px ' + SANS, '#ffffff', 70],
          ['CRACKERS', 'bold 50px ' + SANS, GOLD, 135],
          ['ON ORDERS OVER £15', 'bold 30px ' + SANS, '#ffffff', 200]
        ]
      ]
    ])
      b.label(1.3, 0.65, decal(key, lines), [x, 1.7, Z1 + 0.235]);
    b.label(
      1.3,
      0.65,
      menuMat(
        'kb_wmenu',
        [
          ['DONER', '£7.50', 'wrap'],
          ['BURGER', '£5.99', 'burger'],
          ['CHIPS', '£2.99', 'chips']
        ],
        '#1a1a1a',
        '#ffffff'
      ),
      [-6.2, 1.7, Z1 + 0.235]
    );
    b.label(
      1.3,
      0.65,
      menuMat(
        'nw_wmenu',
        [
          ['FRIED RICE', '£4.80', 'rice'],
          ['CHOW MEIN', '£5.20', 'noodle'],
          ['BALLS', '£4.50', 'balls']
        ],
        '#5a0a0c',
        '#ffffff'
      ),
      [6.2, 1.7, Z1 + 0.235]
    );
    // door stickers: hygiene 0 on both, JUST EATEN on the wok door, OPEN
    for (const s of [-1, 1]) {
      b.label(0.26, 0.16, hygMat(), [s * 4.6 - 0.3, 1.35, Z1 + 0.23]);
      b.label(
        0.34,
        0.1,
        strapMat(s < 0 ? 'kb_open' : 'nw_open', 'OPEN', 'bold 44px ' + SANS, RED, '#ffffff', 256, 80),
        [s * 4.6 + 0.2, 1.6, Z1 + 0.23]
      );
    }
    b.label(0.26, 0.13, eatenMat(), [4.6 + 0.2, 1.3, Z1 + 0.23]);

    /* ---------- roof: extract fans, the kebab shop's tall flue, AC units ---------- */
    for (const s of [-1, 1]) {
      b.box(0.7, 0.5, 0.7, K.mat(0x8a8e92, 0.4, 0.6), [s * 3.4, H + 0.35, 0.2], null, 0.02);
      b.cyl(0.25, 0.25, 0.06, dark, [s * 3.4, H + 0.62, 0.2], null, 14);
      rb(1.2, 0.8, 0.6, 0.03, K.mat(0xb8bcc0, 0.5, 0.5), [s * 6.8, H + 0.5, -5.5]);
      b.cyl(0.26, 0.26, 0.04, dark, [s * 6.8, H + 0.5, -5.19], [PI / 2, 0, 0], 16);
    }
    // the kebab flue: galvanised duct up the back wall, over the parapet, with a cowl
    for (const s of [-1, 1]) {
      const dx = s * 6.6,
        galv = K.mat(0xa8acb0, 0.45, 0.65),
        grease = K.mat(0x4a3a24, 0.7);
      b.box(0.5, H + 1.2 - 1.6, 0.5, galv, [dx, (1.6 + H + 1.2) / 2, Z0 - 0.42], null, 0.01);
      b.box(0.52, 0.4, 0.52, grease, [dx, 1.8, Z0 - 0.42], null, 0.01); // greasy drip stain
      for (let y = 2.2; y < H + 1.1; y += 0.9) b.box(0.56, 0.04, 0.56, galv, [dx, y, Z0 - 0.42], null, 0);
      b.cyl(0.38, 0.3, 0.3, galv, [dx, H + 1.4, Z0 - 0.42], null, 12);
      b.box(0.6, 0.5, 0.4, galv, [dx, 1.4, Z0 - 0.35], null, 0.02); // fan box
      S(dx - 0.3, dx + 0.3, Z0 - 0.7, Z0 - 0.15, 0, 1.7, true);
    }

    /* ---------- front apron: benches, bins, A-boards, the wok delivery scooter ---------- */
    {
      const wood = K.surf('wood', 0x7a4a2a);
      const bench = (x, z) => {
        for (const s of [-0.6, 0.6]) b.box(0.06, 0.45, 0.42, dark, [x + s, 0.34, z], null, 0);
        for (let i = 0; i < 3; i++) b.box(1.5, 0.04, 0.11, wood, [x, 0.48, z - 0.14 + i * 0.14], null, 0.01);
        for (let i = 0; i < 2; i++) b.box(1.5, 0.1, 0.035, wood, [x, 0.66 + i * 0.14, z - 0.21], null, 0.01);
        S(x - 0.75, x + 0.75, z - 0.25, z + 0.25, 0, 0.8, true);
      };
      bench(-6.8, Z1 + 2.3);
      bench(6.8, Z1 + 2.3);
      bench(-2.4, Z1 + 3.4);
      // bins: one overflowing with chip papers
      for (const [x, full] of [
        [-8.6, true],
        [2.0, false]
      ]) {
        b.cyl(0.28, 0.25, 0.85, K.mat(0x1a1a1c, 0.6, 0.3), [x, 0.465, Z1 + 2.3], null, 16);
        b.cyl(0.3, 0.3, 0.06, dark, [x, 0.9, Z1 + 2.3], null, 16);
        if (full)
          for (let k = 0; k < 5; k++)
            b.box(
              0.18,
              0.06,
              0.14,
              k % 2 ? white : K.mat(0xc4141c, 0.6),
              [x + Math.cos(k) * 0.2, 0.96 + k * 0.03, Z1 + 2.3 + Math.sin(k) * 0.15],
              [0.3, k, 0.2],
              0
            );
        S(x - 0.3, x + 0.3, Z1 + 2.0, Z1 + 2.6, 0, 1.0, true);
      }
      // A-boards
      const aboard = (x, z, key, lines, bg, rot) => {
        const m = boardMat(key, lines, bg);
        b.push([x, 0, z], [0, rot || 0, 0]);
        for (const sd of [-1, 1]) {
          b.box(0.62, 0.96, 0.03, K.mat(0x2a2a2a, 0.6), [0, 0.5, sd * 0.13], [-sd * 0.14, 0, 0], 0); // v090: tops lean in (was upside down)
          b.label(0.54, 0.82, m, [0, 0.52, sd * 0.155], [-sd * 0.14, sd < 0 ? PI : 0, 0]);
        }
        b.pop();
        S(x - 0.34, x + 0.34, z - 0.25, z + 0.25, 0, 1.0, true);
      };
      aboard(-2.9, Z1 + 1.5, 'kb_aboard', [
        ['TODAY', 'bold 34px ' + SANS, '#ffd23a', 50],
        ['LARGE DONER', 'bold 34px ' + SANS],
        ['+ CHIPS', 'bold 34px ' + SANS],
        ['+ CAN', 'bold 34px ' + SANS],
        ['£9.99', 'bold 64px ' + IMPACT, '#ff5a3a', 70],
        ['MEAT: YES', 'italic 26px ' + SANS, '#cccccc', 60]
      ]);
      aboard(
        2.9,
        Z1 + 1.5,
        'nw_aboard',
        [
          ['MEAL DEAL', 'bold 36px ' + SANS, GOLD, 50],
          ['FOR 2', 'bold 40px ' + SANS],
          ['£19.99', 'bold 64px ' + IMPACT, '#ffffff', 70],
          ['NO REFUNDS', 'bold 26px ' + SANS, GOLD, 60],
          ['NO QUESTIONS', 'bold 26px ' + SANS, GOLD, 34]
        ],
        '#5a0a0c'
      );
      // delivery scooter on its stand, red top box
      b.push([8.6, 0, Z1 + 3.4], [0, 0.15, 0]);
      const body = K.mat(0xe8e8e4, 0.35, 0.2);
      for (const wz of [-0.62, 0.62]) {
        b.cyl(0.22, 0.22, 0.1, K.rubber(), [0, 0.22, wz], [0, 0, PI / 2], 14);
        b.cyl(0.11, 0.11, 0.11, steel, [0, 0.22, wz], [0, 0, PI / 2], 10);
      }
      rb(0.36, 0.3, 1.0, 0.1, body, [0, 0.42, -0.05]);
      rb(0.3, 0.12, 0.55, 0.05, dark, [0, 0.66, -0.2]);
      rb(0.34, 0.75, 0.16, 0.06, body, [0, 0.7, 0.5], [0.2, 0, 0]);
      b.cyl(0.02, 0.02, 0.6, dark, [0, 1.1, 0.6], [0, 0, PI / 2], 6);
      rb(0.44, 0.4, 0.44, 0.04, K.mat(0xc4141c, 0.5), [0, 0.95, -0.42]);
      b.label(
        0.38,
        0.12,
        strapMat('nw_box', 'WOK ST', 'bold 40px ' + SANS, RED, GOLD, 256, 80),
        [0.225, 0.95, -0.42],
        [0, PI / 2, 0]
      );
      b.pop();
      S(8.3, 8.9, Z1 + 2.7, Z1 + 4.1, 0, 1.2, true);
      // flattened chip boxes and a dropped kebab on the pavement
      for (const [x, z, r] of [
        [-4.0, 12.3, 0.4],
        [1.2, 13.4, 1.6],
        [-7.4, 11.0, 2.4]
      ])
        b.box(0.22, 0.01, 0.16, white, [x, 0.05, z], [0, r, 0], 0);
      b.add(K.sphGeo(0.08, 8, 6), K.mat(0x8a4a20, 0.7), {p: [-5.2, 0.06, 12.7], s: [1.6, 0.6, 1]});
    }

    /* ---------- sidewalk: street lights, meter, hydrant, no parking ---------- */
    LK.lightPole(b, S, -5.0);
    LK.lightPole(b, S, 5.0);
    LK.hydrant(b, S, -8.6);
    LK.meter(b, S, 1.2);
    LK.noParking(b, -1.4, {key: 'kw_np1'});

    /* ---------- back yard: door hoods and signs, board fences, a dingy service yard ---------- */
    for (const s of [-1, 1]) {
      const dx = s * 2.2;
      b.box(1.7, 0.06, 0.8, cop, [dx, 2.75, Z0 - 0.4], null, 0.01);
      b.label(
        1.6,
        0.2,
        strapMat(
          s < 0 ? 'kb_back' : 'nw_back',
          s < 0 ? 'KEBABSOLUTELY · KEEP CLEAR' : 'WOK STREET · NO ENTRY',
          'bold 30px ' + SANS,
          RED,
          '#ffffff'
        ),
        [dx, 3.0, Z0 - 0.17],
        [0, PI, 0]
      );
      b.box(0.3, 0.2, 0.2, dark, [dx, 3.35, Z0 - 0.26], null, 0.01);
      b.box(0.24, 0.02, 0.14, lit, [dx, 3.24, Z0 - 0.28], null, 0);
    }
    const fen = surf('fence');
    for (const fx of [-9.9, 9.9]) {
      b.box(0.06, 1.8, -17.6 - Z0, fen, [fx, 0.9, (Z0 - 17.6) / 2], null, 0);
      for (let pz = Z0 - 0.2; pz > -17.6; pz -= 2.2) b.box(0.1, 1.9, 0.1, fen, [fx, 0.95, pz], null, 0.01);
      b.box(0.1, 0.06, -17.6 - Z0, fen, [fx, 1.86, (Z0 - 17.6) / 2], null, 0);
      S(fx - 0.06, fx + 0.06, -17.6, Z0, 0, 1.9, true);
    }
    {
      const bag = K.mat(0x141416, 0.25),
        weed = K.mat(0x4a6a2a, 0.9),
        wet = K.mat(0x1a1c1e, 0.05, 0.3);
      // heaps of bin bags
      for (const [x, z, n] of [
        [-8.6, -9.0, 5],
        [-4.0, -8.6, 3],
        [8.5, -10.4, 4],
        [0.9, -9.2, 2]
      ])
        for (let k = 0; k < n; k++)
          b.add(K.sphGeo(0.3, 8, 6), bag, {
            p: [x + Math.cos(k * 2.1) * 0.35, 0.22 + (k > 2 ? 0.25 : 0), z + Math.sin(k * 2.1) * 0.3],
            s: [1, 0.8, 0.9],
            r: [0, k, 0.2]
          });
      S(-9.2, -8.0, -9.6, -8.4, 0, 0.6, true);
      S(7.9, 9.1, -11.0, -9.8, 0, 0.6, true);
      // waste cooking oil drums, one leaking
      const drum = K.mat(0x2a4a8a, 0.55, 0.3),
        oil = K.mat(0x6a5018, 0.1, 0.2);
      for (const [x, z, tip] of [
        [-6.2, -8.4, false],
        [-5.5, -8.5, false],
        [-5.9, -9.5, true],
        [5.6, -8.4, false]
      ]) {
        if (tip) b.cyl(0.29, 0.29, 0.88, drum, [x, 0.29, z], [0, 0.6, PI / 2], 14);
        else {
          b.cyl(0.29, 0.29, 0.88, drum, [x, 0.44, z], null, 14);
          b.cyl(0.3, 0.3, 0.03, K.mat(0x1a2a4a, 0.5, 0.4), [x, 0.89, z], null, 14);
        }
      }
      b.add(K.cylGeo(0.9, 0.9, 0.004, 16), oil, {p: [-5.6, 0.03, -10.2], s: [1.5, 1, 0.8]});
      b.label(
        0.4,
        0.2,
        strapMat('kw_oil', 'WASTE OIL', 'bold 40px ' + SANS, '#e8c020', '#111', 256, 128),
        [-6.2, 0.6, -8.11]
      );
      S(-6.55, -5.2, -8.75, -8.05, 0, 0.9, true);
      S(-6.4, -5.4, -9.9, -9.1, 0, 0.6, true);
      S(5.3, 5.9, -8.7, -8.1, 0, 0.9, true);
      // puddles and grease stains
      // v091: the puddles are real water now (MFZWATER, added per placement: see YARD_PUDDLES); without that layer, the old flat discs
      if (!window.MFZWATER)
        for (const [x, z, r] of YARD_PUDDLES)
          b.add(K.cylGeo(r, r, 0.004, 16), wet, {p: [x, 0.03, z], s: [1.4, 1, 0.8]});
      for (const [x, z, r] of [
        [1.8, -10.4, 0.6],
        [-2.6, -12.0, 0.5],
        [2.4, -8.6, 0.7]
      ])
        b.add(K.cylGeo(r, r, 0.004, 14), K.mat(0x2a2620, 0.6), {p: [x, 0.028, z], s: [1.2, 1, 0.9]});
      // a stained mattress dumped against the right fence, a broken office chair
      b.box(0.2, 1.8, 1.3, K.mat(0xc8c0a8, 0.95), [9.55, 0.88, -14.0], [0, 0, 0.18], 0.06);
      b.add(K.cylGeo(0.3, 0.3, 0.01, 12), K.mat(0x7a5a2a, 0.9), {
        p: [9.4, 1.0, -13.8],
        r: [0, 0, PI / 2 + 0.18],
        s: [1, 1, 1.4]
      });
      S(9.3, 9.8, -14.65, -13.35, 0, 1.8, true);
      b.push([-8.2, 0, -13.6], [0, 0.8, 1.4]);
      b.box(0.5, 0.08, 0.5, dark, [0, 0.45, 0], null, 0.02);
      b.box(0.5, 0.6, 0.08, dark, [0, 0.8, -0.25], null, 0.02);
      b.cyl(0.03, 0.03, 0.4, steel, [0, 0.2, 0], null, 6);
      b.pop();
      // the smoke spot by the wok back door: upturned crate, plastic chair, a tin of butts
      b.box(0.36, 0.3, 0.36, K.mat(0x2a6ac8, 0.6), [3.6, 0.15, Z0 - 1.6], [0, 0.3, 0], 0.01);
      b.box(0.44, 0.04, 0.42, K.mat(0xf0f0ec, 0.5), [4.4, 0.45, Z0 - 1.7], [0, 0.4, 0], 0.01);
      b.box(0.44, 0.38, 0.04, K.mat(0xf0f0ec, 0.5), [4.32, 0.68, Z0 - 1.9], [0, 0.4, 0], 0.01);
      for (const lx of [-0.19, 0.19])
        for (const lz of [-0.18, 0.18])
          b.cyl(0.015, 0.015, 0.45, K.mat(0xf0f0ec, 0.5), [4.4 + lx, 0.22, Z0 - 1.7 + lz], null, 6);
      S(4.1, 4.7, Z0 - 2.0, Z0 - 1.4, 0, 0.9, true);
      b.cyl(0.06, 0.06, 0.08, K.mat(0x8a8a88, 0.4, 0.6), [3.65, 0.34, Z0 - 1.6], null, 10);
      for (let k = 0; k < 12; k++)
        b.cyl(
          0.006,
          0.006,
          0.03,
          K.mat(0xe8d8b8, 0.8),
          [3.4 + Math.cos(k * 1.7) * 0.5, 0.035, Z0 - 1.3 + Math.sin(k * 1.9) * 0.4],
          [PI / 2, k, 0],
          4
        );
      // a chained chest freezer left out in the yard (what's in it?)
      rb(1.3, 0.85, 0.7, 0.04, K.mat(0xe4e2dc, 0.55), [-1.6, 0.43, -12.4]);
      for (const cx of [-1.9, -1.3])
        b.tor(0.42, 0.012, K.mat(0x7a7a78, 0.4, 0.8), [cx, 0.45, -12.4], [0, 0, PI / 2], PI * 2, 10);
      b.box(0.08, 0.1, 0.04, K.mat(0xc8a030, 0.3, 0.8), [-1.6, 0.6, -12.03], null, 0);
      S(-2.25, -0.95, -12.75, -12.05, 0, 0.9, true);
      // graffiti tag on the back wall
      // v101: moved from x -1.2 (it spanned the back door, so the opening door swept through it) to the clear wall
      // left of the flue, smaller
      b.label(
        1.9,
        0.71,
        decal('kw_tag', [
          ['DONT EAT', 'bold 80px ' + IMPACT, '#3ad05a', 90],
          ['THE BALLS', 'bold 80px ' + IMPACT, '#e83ad0', 180]
        ]),
        [-7.95, 1.3, Z0 - 0.19],
        [0, PI, 0]
      );
      // weeds along the fence bases and the back wall
      for (let k = 0; k < 24; k++) {
        const fx = k < 8 ? -9.75 : k < 16 ? 9.75 : -8 + (k - 16) * 2.2,
          fz = k < 16 ? -8.6 - ((k * 1.13) % 8) * 1.1 : Z0 - 0.3;
        b.add(K.sphGeo(0.12, 6, 4), weed, {p: [fx, 0.08, fz], s: [1.3, 0.8 + (k % 3) * 0.3, 1]});
      }
    }

    /* ---------- interior: floors, linings, ceilings, lights (both shops, mirrored) ---------- */
    const por = K.mat(0xf6f6f2, 0.15, 0.05),
      chrome = K.chrome(),
      ss = K.mat(0xc4c8cc, 0.3, 0.85),
      hous = K.mat(0xd8d8d4, 0.5, 0.2),
      skirt = K.mat(0x1e1e20, 0.6),
      cream = K.mat(0xeee4cc, 0.85),
      redB = K.mat(0xb8141c, 0.5),
      wcGreen = K.mat(0xc8d8c0, 0.85),
      bulb = K.mat(0xfff0c0, 0.4, 0, {emissive: 0xffd890, emissiveIntensity: 1.6});
    const quilt = K.tri(
      'kb_quilt',
      (c, W, H) => {
        c.fillStyle = '#2a2c30';
        c.fillRect(0, 0, W, H);
        const n = 8,
          s = W / n;
        for (let j = 0; j <= n; j++)
          for (let i = 0; i <= n; i++) {
            const g = c.createRadialGradient(i * s, j * s, 2, i * s, j * s, s * 0.7);
            g.addColorStop(0, '#6a6e74');
            g.addColorStop(1, '#2a2c30');
            c.fillStyle = g;
            c.beginPath();
            c.moveTo(i * s, j * s - s / 2);
            c.lineTo(i * s + s / 2, j * s);
            c.lineTo(i * s, j * s + s / 2);
            c.lineTo(i * s - s / 2, j * s);
            c.fill();
          }
      },
      {tile: 0.8, r: 0.35, m: 0.7}
    );
    const panelW = K.tri(
      'nw_panel',
      (c, W, H, r) => {
        c.fillStyle = '#3a1e14';
        c.fillRect(0, 0, W, H);
        for (let i = 0; i < 8; i++) {
          c.fillStyle = `hsl(14,${34 + r() * 10}%,${16 + r() * 6}%)`;
          c.fillRect((i * W) / 8 + 3, 0, W / 8 - 6, H);
        }
        P.noise(c, W, H, r, 2000, 0.1, '#000000', 1);
      },
      {tile: 1.2, r: 0.5}
    );
    const kitTile = K.tri(
      'kw_kittile',
      (c, W, H, r) => {
        c.fillStyle = '#a8a69c';
        c.fillRect(0, 0, W, H);
        const n = 8,
          s = W / n;
        for (let j = 0; j < n; j++)
          for (let i = 0; i < n; i++) {
            c.fillStyle = `hsl(48,${8 + r() * 10}%,${82 + r() * 8}%)`;
            c.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
          }
        P.grime(c, W, H, r, 0.55);
        P.noise(c, W, H, r, 1500, 0.15, '#6a5a2a', 1.5);
      },
      {tile: 1.2, r: 0.3}
    );
    const grimy = K.tri(
      'kw_grimy',
      (c, W, H, r) => {
        c.fillStyle = '#b4ac94';
        c.fillRect(0, 0, W, H);
        P.grime(c, W, H, r, 0.8);
        P.noise(c, W, H, r, 5000, 0.18, '#4a3a20', 1.4);
        for (let k = 0; k < 6; k++) {
          c.fillStyle = 'rgba(90,70,30,0.18)';
          c.beginPath();
          c.ellipse(r() * W, r() * H, 20 + r() * 50, 30 + r() * 80, 0, 0, PI * 2);
          c.fill();
        }
      },
      {tile: 1.6, r: 0.95}
    );
    const wcTile = K.tri(
      'kw_wctile',
      (c, W, H, r) => {
        c.fillStyle = '#9aa09a';
        c.fillRect(0, 0, W, H);
        const n = 10,
          s = W / n;
        c.fillStyle = '#eef0ec';
        for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) c.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
        P.grime(c, W, H, r, 0.4);
      },
      {tile: 1.0, r: 0.25}
    );
    const chequer = K.tri(
      'kb_chequer',
      (c, W, H, r) => {
        const n = 4,
          s = W / n;
        for (let j = 0; j < n; j++)
          for (let i = 0; i < n; i++) {
            c.fillStyle = (i + j) % 2 ? '#2a2a2c' : '#8a8a86';
            c.fillRect(i * s, j * s, s, s);
          }
        P.grime(c, W, H, r, 0.35);
      },
      {tile: 1.0, r: 0.4}
    );
    const quarry = K.tri(
      'nw_quarry',
      (c, W, H, r) => {
        c.fillStyle = '#3a1a14';
        c.fillRect(0, 0, W, H);
        const n = 4,
          s = W / n;
        for (let j = 0; j < n; j++)
          for (let i = 0; i < n; i++) {
            c.fillStyle = `hsl(${4 + r() * 8},${50 + r() * 10}%,${28 + r() * 8}%)`;
            c.fillRect(i * s + 3, j * s + 3, s - 6, s - 6);
          }
        P.grime(c, W, H, r, 0.3);
      },
      {tile: 0.8, r: 0.6}
    );
    const vinyl = K.tri(
      'kw_vinyl',
      (c, W, H, r) => {
        c.fillStyle = '#6a5e4e';
        c.fillRect(0, 0, W, H);
        P.noise(c, W, H, r, 9000, 0.25, '#c8b898', 1);
        P.grime(c, W, H, r, 0.7);
      },
      {tile: 1.2, r: 0.9}
    );
    const slab = K.tri(
      'kw_slab',
      (c, W, H, r) => {
        c.fillStyle = '#6e6a62';
        c.fillRect(0, 0, W, H);
        P.noise(c, W, H, r, 7000, 0.2, '#2a2620', 1.2);
        P.grime(c, W, H, r, 0.9);
        for (let k = 0; k < 4; k++) {
          c.fillStyle = 'rgba(60,20,14,0.25)';
          c.beginPath();
          c.ellipse(r() * W, r() * H, 10 + r() * 40, 10 + r() * 30, r() * 3, 0, PI * 2);
          c.fill();
        }
      },
      {tile: 1.6, r: 0.95}
    );
    const flr = (x0, x1, z0, z1, m, y) =>
      b.box(x1 - x0, 0.02, z1 - z0, m, [(x0 + x1) / 2, y || 0.035, (z0 + z1) / 2], null, 0);
    // u range -> world x range for side s
    const xr = (s, ua, ub) => (s < 0 ? [-ub, -ua] : [ua, ub]);
    // ops that fall inside a wall run
    const inR = (ops, a0, a1) => ops.filter(o => o.c > Math.min(a0, a1) && o.c < Math.max(a0, a1));
    // a lining on a wall whose centre is c, half-thickness half (0.15 for shell / party walls, 0.07 for partitions)
    const lw = (ax, c, a0, a1, n, ops, top, span, half) =>
      LK.lineWall(b, ax, c - n * (0.15 - (half === undefined ? 0.15 : half)), a0, a1, n, inR(ops, a0, a1), top, span);
    const kbSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, Math.min(y1, 1.2), quilt, 0.012, 0.006);
      if (y1 > 1.32) pc(u0, u1, Math.max(y0, 1.32), y1, cream, 0.012, 0.006);
      if (y0 < 1.32 && y1 > 1.2) pc(u0, u1, 1.2, 1.32, redB, 0.03, 0.015);
      if (y1 > 2.7) pc(u0, u1, Math.max(y0, 2.7), y1, redB, 0.03, 0.015); // v101: was 0.016 / 0.008, 4 mm proud of the cream = z-fighting
    };
    const nwSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, Math.min(y1, 1.0), panelW, 0.02, 0.01);
      if (y1 > 1.06) pc(u0, u1, Math.max(y0, 1.06), Math.min(y1, 2.7), cream, 0.012, 0.006);
      if (y0 < 1.06 && y1 > 1.0) pc(u0, u1, 1.0, 1.06, goldP, 0.035, 0.018);
      if (y1 > 2.7) pc(u0, u1, Math.max(y0, 2.7), y1, redB, 0.03, 0.015); // v101: was 0.016 / 0.008, 4 mm proud of the cream = z-fighting
    };
    const kitSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, Math.min(y1, 2.0), kitTile, 0.012, 0.006);
      if (y1 > 2.0) pc(u0, u1, Math.max(y0, 2.0), y1, grimy, 0.012, 0.006);
    };
    const grimSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, y1, grimy, 0.012, 0.006);
      if (y0 <= 0 && y1 > 0.2) pc(u0, u1, 0, 0.12, skirt, 0.03, 0.015);
    };
    const wcSpan = (pc, u0, u1, y0, y1) => {
      pc(u0, u1, y0, Math.min(y1, 1.5), wcTile, 0.012, 0.006);
      if (y1 > 1.5) pc(u0, u1, Math.max(y0, 1.5), y1, wcGreen, 0.012, 0.006);
    };
    const IN = 0.16,
      Q = 0.07,
      WCC = 2.6; // toilet ceiling
    for (const s of [-1, 1]) {
      const kb = s < 0,
        shopSpan = kb ? kbSpan : nwSpan;
      // floors
      flr(...xr(s, IN, TU - Q), PZ + Q, TZ + 0.02, kb ? chequer : quarry);
      flr(...xr(s, IN, 9 - IN), TZ + 0.02, Z1 - IN, kb ? chequer : quarry);
      flr(...xr(s, TU + Q, 9 - IN), PZ + Q, TZ - Q, wcTile);
      flr(...xr(s, IN, 9 - IN), KZ + Q, PZ - Q, vinyl);
      flr(...xr(s, IN, RU - Q), Z0 + IN, KZ - Q, slab);
      flr(...xr(s, RU + Q, 9 - IN), Z0 + IN, KZ - Q, slab);
      const [wx0, wx1] = xr(s, 0.15, 9);
      // linings: front shop / waiting area
      lw(1, Z1, wx0, wx1, -1, opsU(U_FRONT, s), CEIL, shopSpan);
      lw(0, XM, PZ + Q, Z1, s, [], CEIL, shopSpan);
      lw(0, s * 9, TZ + Q, Z1, -s, [], CEIL, shopSpan);
      lw(1, PZ, ...xr(s, 0.15, TU - Q), 1, opsU(U_PART, s), CEIL, shopSpan, Q);
      lw(0, s * TU, PZ + Q, TZ + Q, -s, [], CEIL, shopSpan, Q);
      lw(1, TZ, ...xr(s, TU - Q, 9), 1, opsU(U_WC, s), CEIL, shopSpan, Q);
      // customer toilet
      lw(1, TZ, ...xr(s, TU + Q, 9), -1, opsU(U_WC, s), WCC, wcSpan, Q);
      lw(1, PZ, ...xr(s, TU + Q, 9), 1, [], WCC, wcSpan, Q);
      lw(0, s * TU, PZ + Q, TZ - Q, s, [], WCC, wcSpan, Q);
      lw(0, s * 9, PZ + Q, TZ - Q, -s, [], WCC, wcSpan);
      // kitchen
      lw(1, PZ, wx0, wx1, -1, opsU(U_PART, s), CEIL, kitSpan, Q);
      lw(0, XM, KZ + Q, PZ - Q, s, [], CEIL, kitSpan);
      lw(0, s * 9, KZ + Q, PZ - Q, -s, SIDE, CEIL, kitSpan);
      lw(1, KZ, wx0, wx1, 1, opsU(U_KPART, s), CEIL, kitSpan, Q);
      // store (u 0..RU) and back room (u RU..9)
      lw(1, KZ, ...xr(s, 0.15, RU - Q), -1, opsU(U_KPART, s), RC, grimSpan, Q);
      lw(1, KZ, ...xr(s, RU + Q, 9), -1, opsU(U_KPART, s), RC, grimSpan, Q);
      lw(0, XM, Z0, KZ - Q, s, [], RC, grimSpan);
      lw(0, s * RU, Z0, KZ - Q, -s, [], RC, grimSpan, Q);
      lw(0, s * RU, Z0, KZ - Q, s, [], RC, grimSpan, Q);
      lw(0, s * 9, Z0, KZ - Q, -s, SIDE, RC, grimSpan);
      lw(1, Z0, ...xr(s, 0.15, RU - Q), 1, opsU(U_BACK, s), RC, grimSpan);
      lw(1, Z0, ...xr(s, RU + Q, 9), 1, [], RC, grimSpan);
      // ceilings: drop ceiling over shop + kitchen, low one in the toilet, stained board in the back rooms
      const cx = s * 4.5,
        ceilM = K.mat(0xeeece4, 0.9);
      b.box(8.7, 0.04, Z1 - KZ - 0.2, ceilM, [cx, CEIL + 0.02, (KZ + Z1) / 2], null, 0);
      b.box(9 - TU - 0.2, 0.04, TZ - PZ - 0.2, white, [s * ((TU + 9) / 2), WCC + 0.02, (PZ + TZ) / 2], null, 0);
      b.box(8.7, 0.04, KZ - Z0 - 0.2, grimy, [cx, RC + 0.02, (Z0 + KZ) / 2], null, 0);
      for (const [lu, lz] of [
        [2.2, -4.4],
        [6.6, -5.6]
      ])
        b.add(K.cylGeo(0.4, 0.4, 0.004, 14), K.mat(0x8a6a3a, 0.9), {p: [s * lu, RC - 0.002, lz], s: [1.3, 1, 0.9]}); // water stains
      // lights: troffers in the shop and kitchen, a downlight in the toilet, bare bulbs in the back rooms
      for (const [lu, lz] of [
        [2.4, 6.6],
        [5.6, 6.6],
        [3.2, 3.6],
        [3.0, 0.9],
        [6.6, 0.9],
        [3.0, -1.4],
        [6.6, -1.4]
      ]) {
        b.box(1.3, 0.07, 0.18, hous, [s * lu, CEIL - 0.04, lz], null, 0.01);
        b.box(1.22, 0.012, 0.12, lit, [s * lu, CEIL - 0.08, lz], null, 0);
      }
      b.cyl(0.14, 0.14, 0.03, hous, [s * ((TU + 9) / 2), WCC - 0.01, (PZ + TZ) / 2], null, 14);
      b.cyl(0.12, 0.12, 0.01, lit, [s * ((TU + 9) / 2), WCC - 0.025, (PZ + TZ) / 2], null, 14);
      for (const [lu, lz] of [
        [2.2, -5.0],
        [6.6, -4.8]
      ]) {
        b.cyl(0.006, 0.006, 0.6, dark, [s * lu, RC - 0.3, lz], null, 4);
        b.add(K.sphGeo(0.06, 8, 6), bulb, {p: [s * lu, RC - 0.66, lz], s: [1, 1.3, 1]});
      }
      // customer toilet: WC on the back wall, basin + cracked mirror on the outer wall, dryer, loo roll on the floor
      {
        const wx = s * 8.1,
          wz = PZ + Q + 0.4;
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
        b.add(K.cylGeo(0.22, 0.22, 0.03, 16), K.mat(0x1a1a1a, 0.4), {p: [0, 0.43, 0.12], s: [1, 1, 1.25]});
        b.rbox(0.42, 0.42, 0.2, 0.03, por, [0, 0.62, -0.18]);
        b.box(0.12, 0.04, 0.03, chrome, [0.12, 0.8, -0.07], null, 0);
        b.pop();
        S(wx - 0.3, wx + 0.3, PZ + Q, PZ + Q + 0.85, 0, 0.8, true);
        const bxu = s * (9 - 0.15 - 0.3);
        b.box(0.4, 0.15, 0.5, por, [bxu, 0.82, 4.3], null, 0.04);
        b.cyl(0.04, 0.05, 0.7, por, [bxu, 0.4, 4.3], null, 12);
        b.cyl(0.012, 0.012, 0.15, chrome, [bxu - s * 0.12, 0.95, 4.3], null, 8);
        b.label(
          0.45,
          0.6,
          K.paint('kw_mirror', 128, 160, (c, W, H, r) => {
            c.fillStyle = '#b8ccd4';
            c.fillRect(0, 0, W, H);
            c.strokeStyle = '#f4f8fa';
            c.lineWidth = 2;
            for (let k = 0; k < 7; k++) {
              c.beginPath();
              c.moveTo(70, 60);
              c.lineTo(70 + Math.cos(k * 0.9) * 90, 60 + Math.sin(k * 0.9) * 110);
              c.stroke();
            }
            P.grime(c, W, H, r, 0.3);
          }),
          [s * (9 - 0.15 - 0.03), 1.5, 4.3],
          [0, -s * (PI / 2), 0]
        );
        S(...xr(s, 8.35, 8.85), 4.05, 4.55, 0, 0.95, true);
        rb(0.25, 0.3, 0.16, 0.03, white, [s * (9 - 0.15 - 0.09), 1.35, 3.5], [0, s * (PI / 2), 0]); // hand dryer
        b.cyl(0.06, 0.06, 0.1, white, [s * 7.6, 0.06, 3.4], [0, 0, PI / 2], 10); // dropped loo roll
        b.box(0.1, 0.004, 0.9, white, [s * 7.6, 0.04, 3.95], [0, 0.2, 0], 0);
        b.label(
          0.5,
          0.32,
          K.paint('kw_wcsign' + s, 256, 160, c => {
            c.fillStyle = '#ffffff';
            c.fillRect(0, 0, 256, 160);
            txt(c, 'TOILET', 128, 44, 'bold 46px ' + SANS, '#111');
            txt(c, 'CUSTOMERS ONLY', 128, 92, 'bold 26px ' + SANS, RED, 240);
            txt(c, kb ? 'ASK FOR KEY' : 'NO DRUGS NO SMOKING', 128, 132, 'bold 20px ' + SANS, '#555', 240);
          }),
          [s * U_WC[0].c, 2.25, TZ + Q + 0.02]
        );
      }
      // door signs: STAFF ONLY to the kitchen, STORE and PRIVATE on the back-room doors
      b.label(
        0.7,
        0.16,
        strapMat(kb ? 'kb_staff' : 'nw_staff', 'STAFF ONLY', 'bold 40px ' + SANS, INK, '#ffffff', 512, 112),
        [s * 0.85, 2.55, PZ + Q + 0.02]
      );
      b.label(0.5, 0.14, strapMat('kw_store', 'STORE', 'bold 44px ' + SANS, '#3a3a3a', '#ffffff', 256, 72), [
        s * 2.2,
        2.5,
        KZ + Q + 0.02
      ]);
      b.label(
        0.6,
        0.3,
        K.paint('kw_private', 256, 128, c => {
          c.fillStyle = '#e8c020';
          c.fillRect(0, 0, 256, 128);
          txt(c, 'PRIVATE', 128, 46, 'bold 50px ' + SANS, '#111');
          txt(c, 'KEEP OUT!!', 128, 96, 'bold 36px ' + SANS, RED);
        }),
        [s * 6.8, 2.35, KZ + Q + 0.02]
      );
    }

    /* ---------- shared makers: steel table, wall shelving, folding chair, chained freezer, crate ---------- */
    const galvT = K.mat(0xb4b8bc, 0.35, 0.75);
    // steel prep table: top, undershelf, four legs (centre x, z, width along x, depth along z)
    const sTable = (x, z, w, d, h) => {
      h = h || 0.9;
      b.box(w, 0.04, d, ss, [x, h - 0.02, z], null, 0.005);
      b.box(w - 0.08, 0.02, d - 0.08, galvT, [x, 0.22, z], null, 0);
      for (const lx of [-w / 2 + 0.04, w / 2 - 0.04])
        for (const lz of [-d / 2 + 0.04, d / 2 - 0.04])
          b.cyl(0.02, 0.02, h - 0.04, galvT, [x + lx, (h - 0.04) / 2, z + lz], null, 6);
      S(x - w / 2, x + w / 2, z - d / 2, z + d / 2, 0, h, true);
    };
    // steel shelving run along z (ax 0) or x (ax 1), 4 shelves, filled by fill(px, py, pz) per bay
    const shelving = (ax, x, z, len, dep, fill) => {
      const n = 4;
      for (let k = 0; k < n; k++)
        if (ax) b.box(len, 0.03, dep, galvT, [x, 0.25 + k * 0.5, z], null, 0);
        else b.box(dep, 0.03, len, galvT, [x, 0.25 + k * 0.5, z], null, 0);
      for (const a of [-len / 2 + 0.02, len / 2 - 0.02])
        for (const dd of [-dep / 2 + 0.02, dep / 2 - 0.02])
          b.box(0.03, 1.85, 0.03, galvT, ax ? [x + a, 0.92, z + dd] : [x + dd, 0.92, z + a], null, 0);
      if (fill)
        for (let k = 0; k < n; k++)
          for (let i = 0; i < Math.floor(len / 0.4); i++) {
            const a = -len / 2 + 0.2 + i * 0.4;
            fill(ax ? x + a : x, 0.27 + k * 0.5, ax ? z : z + a, k, i);
          }
      if (ax) S(x - len / 2, x + len / 2, z - dep / 2, z + dep / 2, 0, 1.85, true);
      else S(x - dep / 2, x + dep / 2, z - len / 2, z + len / 2, 0, 1.85, true);
    };
    const fChair = (x, z, rot, m) => {
      b.push([x, 0, z], [0, rot, 0]);
      b.box(0.42, 0.03, 0.4, m, [0, 0.46, 0], null, 0.005);
      b.box(0.42, 0.3, 0.03, m, [0, 0.76, -0.2], null, 0.005);
      for (const lx of [-0.19, 0.19]) {
        b.cyl(0.012, 0.012, 0.9, galvT, [lx, 0.45, -0.05], [0.25, 0, 0], 6);
        b.cyl(0.012, 0.012, 0.6, galvT, [lx, 0.3, 0.05], [-0.35, 0, 0], 6);
      }
      b.pop();
    };
    const chainM = K.mat(0x8a8a86, 0.4, 0.85);
    // a chest freezer wrapped in chains with a padlock, long side along x or z
    const chainedFreezer = (x, z, alongZ, leak) => {
      const w = alongZ ? 0.7 : 1.3,
        d = alongZ ? 1.3 : 0.7;
      rb(w, 0.86, d, 0.04, K.mat(0xe2e0d8, 0.55), [x, 0.43, z]);
      b.box(w - 0.06, 0.02, d - 0.06, K.mat(0xd0cec6, 0.5), [x, 0.87, z], null, 0);
      for (const k of [-0.3, 0.3])
        b.tor(
          alongZ ? 0.38 : 0.42,
          0.012,
          chainM,
          alongZ ? [x, 0.45, z + k] : [x + k, 0.45, z],
          alongZ ? [0, PI / 2, PI / 2] : [0, 0, PI / 2],
          PI * 2,
          10
        );
      b.box(
        0.07,
        0.09,
        0.04,
        K.mat(0xc8a030, 0.3, 0.8),
        alongZ ? [x + (x > 0 ? -1 : 1) * (w / 2 + 0.02), 0.62, z] : [x, 0.62, z + d / 2 + 0.02],
        alongZ ? [0, PI / 2, 0] : null,
        0
      );
      if (leak)
        b.add(K.cylGeo(0.35, 0.35, 0.004, 14), K.mat(0x5a0a08, 0.15, 0.2), {
          p: [x + 0.2, 0.05, z + (alongZ ? 0.5 : 0.45)],
          s: [1.3, 1, 0.8]
        });
      S(x - w / 2, x + w / 2, z - d / 2, z + d / 2, 0, 0.9, true);
    };
    const crate = (x, y, z, w, h, d, m, rot) => b.box(w, h, d, m, [x, y + h / 2, z], rot ? [0, rot, 0] : null, 0.01);
    const card = K.mat(0xb08a5a, 0.85),
      card2 = K.mat(0x9a7448, 0.85),
      blood = K.mat(0x5a0806, 0.25, 0.1),
      grease = K.mat(0x3a3020, 0.4, 0.1),
      vinylR = K.mat(0x9a1418, 0.45),
      woodD = K.mat(0x4a2a1a, 0.55);
    const smear = (x, z, r, m, sx) =>
      b.add(K.cylGeo(r, r, 0.004, 14), m || blood, {p: [x, 0.048, z], s: [sx || 1.4, 1, 0.8]});
    // a box label painted with a few words
    const boxLabel = (key, text, col) => strapMat(key, text, 'bold 30px ' + SANS, '#e8dcc0', col || '#111', 256, 96);

    for (const s of [-1, 1]) {
      const kb = s < 0,
        X = u => s * u,
        out = -s * (PI / 2), // facing in from the outer wall
        inn = s * (PI / 2); // facing out from the party wall

      /* ---------- waiting area: bench along the party wall, menu boards, the cooler / fish tank ---------- */
      {
        const z0 = 5.0,
          z1 = 7.6,
          bu = 0.15 + 0.25;
        b.box(0.5, 0.42, z1 - z0, kb ? ss : woodD, [X(bu), 0.21, (z0 + z1) / 2], null, 0.01);
        b.box(0.5, 0.08, z1 - z0, kb ? vinylR : K.mat(0x2a1a14, 0.5), [X(bu), 0.46, (z0 + z1) / 2], null, 0.02);
        b.box(0.08, 0.45, z1 - z0, kb ? vinylR : K.mat(0x2a1a14, 0.5), [X(0.21), 0.85, (z0 + z1) / 2], null, 0.02);
        S(...xr(s, 0.15, 0.65), z0, z1, 0, 0.5, true);
        if (kb) {
          // a split in the vinyl, a free paper, a dropped chip
          b.box(0.12, 0.01, 0.3, K.mat(0xd8c8a0, 0.9), [X(0.4), 0.505, 6.0], [0, 0.4, 0], 0);
          b.box(0.3, 0.02, 0.4, K.mat(0xe8e4dc, 0.8), [X(0.45), 0.51, 6.9], [0, 0.2, 0], 0);
        } else b.box(0.3, 0.02, 0.4, K.mat(0xe8e4dc, 0.8), [X(0.45), 0.51, 5.6], [0, -0.3, 0], 0);
        // wall TV over the bench (kebab: football static; wok: a soap)
        rb(0.06, 0.5, 0.86, 0.01, dark, [X(0.2), 2.25, 6.3]);
        b.box(
          0.01,
          0.44,
          0.8,
          K.mat(kb ? 0x3a7a3a : 0x6a5a8a, 0.4, 0, {emissive: kb ? 0x2a6a2a : 0x5a4a7a, emissiveIntensity: 0.6}),
          [X(0.235), 2.25, 6.3],
          null,
          0
        );
        if (kb) {
          // drinks cooler on the outer wall
          const cu = 8.5,
            cz = 7.4; // v089: was 6.9 (in front of the toilet door)
          // v101: the cooler is now a hollow cabinet (it was a solid black block with the bottles buried inside it and a
          // glass pane sharing a plane with the body and the label = flicker). Open front behind a glass door, lit shelves.
          const dk = K.mat(0x1a1a1c, 0.5),
            F = cu - 0.375, // front plane (u)
            sh = K.mat(0xc8ccd0, 0.35, 0.7);
          b.box(0.04, 2.0, 0.85, dk, [X(cu + 0.355), 1.0, cz], null, 0.005); // back
          for (const k of [-1, 1]) b.box(0.75, 2.0, 0.04, dk, [X(cu), 1.0, cz + k * 0.405], null, 0.005); // sides
          b.box(0.75, 0.1, 0.85, dk, [X(cu), 0.05, cz], null, 0.005); // plinth
          b.box(0.75, 0.1, 0.85, dk, [X(cu), 1.95, cz], null, 0.005); // top
          b.box(0.06, 0.28, 0.77, dk, [X(F + 0.03), 1.81, cz], null, 0.005); // header box
          b.box(0.01, 1.55, 0.66, K.mat(0xe8f0ff, 0.5, 0, {emissive: 0xe0eaff, emissiveIntensity: 0.9}), [X(cu + 0.325), 1.0, cz], null, 0); // lit back panel
          for (let k = 0; k < 4; k++) {
            const sy = 0.3 + k * 0.38;
            b.box(0.6, 0.02, 0.74, sh, [X(cu - 0.02), sy, cz], null, 0);
            for (let i = 0; i < 5; i++)
              b.cyl(
                0.035,
                0.035,
                0.2,
                K.mat([0xc4141c, 0x1a5ac8, 0xe8c020, 0x2a9a3a][(i + k) % 4], 0.3, 0.5),
                [X(cu - 0.05), sy + 0.11, cz - 0.28 + i * 0.14],
                null,
                8
              );
          }
          b.box(0.012, 1.5, 0.7, K.glass(0xd8eef4, 0.18), [X(F + 0.012), 0.92, cz], null, 0); // glass door
          b.box(0.03, 1.56, 0.03, chrome, [X(F + 0.0), 0.92, cz - 0.31], null, 0); // door handle bar
          b.label(
            0.7,
            0.18,
            strapMat('kb_cool', 'ICE COLD DRINKS', 'bold 40px ' + SANS, RED, '#fff', 512, 112),
            [X(F - 0.004), 1.82, cz],
            [0, -s * (PI / 2), 0]
          );
          S(...xr(s, cu - 0.4, 8.85), cz - 0.45, cz + 0.45, 0, 2.0);
        } else {
          // fish tank on a cabinet; a lucky cat goes on the counter
          const cu = 8.55,
            cz = 7.35; // v089: was 6.9
          b.box(0.5, 0.75, 1.0, woodD, [X(cu), 0.375, cz], null, 0.01);
          b.box(0.46, 0.5, 0.96, K.glass(0xbfe8f0, 0.3), [X(cu), 1.0, cz], null, 0);
          b.box(
            0.42,
            0.42,
            0.92,
            K.mat(0x2a6a9a, 0.2, 0, {emissive: 0x1a5a8a, emissiveIntensity: 0.45}),
            [X(cu), 0.97, cz],
            null,
            0
          );
          for (let k = 0; k < 4; k++)
            b.add(K.sphGeo(0.03, 6, 4), K.mat(0xff8a10, 0.4), {
              p: [X(cu), 0.85 + (k % 2) * 0.15, cz - 0.3 + k * 0.2],
              s: [0.6, 0.8, 1.6]
            });
          b.add(K.sphGeo(0.03, 6, 4), K.mat(0xd8d8d0, 0.4), {
            p: [X(cu), 1.16, cz + 0.25],
            s: [0.6, 0.4, 1.6],
            r: [PI / 2, 0, 0]
          }); // floating one
          b.box(0.5, 0.06, 1.0, dark, [X(cu), 1.28, cz], null, 0);
          S(...xr(s, cu - 0.25, 8.85), cz - 0.5, cz + 0.5, 0, 1.3);
          // a red-and-gold calendar and a dried-up plant
          b.label(
            0.4,
            0.55,
            K.paint('nw_cal', 128, 176, c => {
              c.fillStyle = '#c4141c';
              c.fillRect(0, 0, 128, 176);
              txt(c, '2026', 64, 30, 'bold 30px ' + SANS, GOLD);
              c.fillStyle = '#fff';
              c.fillRect(10, 56, 108, 110);
              c.fillStyle = '#c4141c';
              for (let i = 0; i < 28; i++) c.fillRect(16 + (i % 7) * 15, 62 + Math.floor(i / 7) * 25, 9, 9);
            }),
            [X(8.83), 1.9, 7.2],
            [0, -s * (PI / 2), 0]
          );
        }
        // backlit menu boards over the back bar
        const items = kb
          ? [
              [
                ['DONER', '£7.50', 'wrap'],
                ['MIXED', '£9.50', 'wrap'],
                ['SHISH', '£8.50', 'balls']
              ],
              [
                ['BURGER', '£5.99', 'burger'],
                ['CHEESE', '£6.49', 'burger'],
                ['DOUBLE', '£7.99', 'burger']
              ],
              [
                ['CHIPS', '£2.99', 'chips'],
                ['CHEESY', '£3.99', 'chips'],
                ['MYSTERY', '£1.00', 'balls']
              ]
            ]
          : [
              [
                ['FRIED RICE', '£4.80', 'rice'],
                ['EGG RICE', '£3.90', 'rice'],
                ['BOILED', '£2.90', 'rice']
              ],
              [
                ['CHOW MEIN', '£5.20', 'noodle'],
                ['SINGAPORE', '£5.80', 'noodle'],
                ['NOODLE ?', '£4.00', 'noodle']
              ],
              [
                ['CHICKEN', '£4.50', 'balls'],
                ['"CHICKEN"', '£3.50', 'balls'],
                ['SPRING RL', '£2.50', 'balls']
              ]
            ];
        items.forEach((it, i) => {
          const mu = 2.0 + i * 1.65;
          rb(1.56, 0.66, 0.06, 0.01, dark, [X(mu), 2.32, PZ + Q + 0.04]);
          b.label(1.5, 0.6, menuMat((kb ? 'kb_menu' : 'nw_menu') + i, it, kb ? '#111' : '#4a0608', '#fff'), [
            X(mu),
            2.32,
            PZ + Q + 0.075
          ]);
        });
      }

      /* ---------- the counter: kebab steel with salad wells + sneeze guard; wok red with gold trim ---------- */
      {
        const L = CU1 - Q - CU0,
          cu = (CU0 + CU1 - Q) / 2,
          cx = X(cu),
          cd = 0.7;
        if (kb) {
          b.box(L, 0.9, cd, ss, [cx, 0.45, CZ], null, 0.01);
          b.box(L, 0.12, 0.02, redB, [cx, 0.06, CZ + cd / 2 + 0.01], null, 0);
          b.box(L + 0.04, 0.05, cd + 0.06, ss, [cx, 0.925, CZ], null, 0.005);
          // salad wells
          const cols = [0x6ab030, 0xd82a1a, 0xf0ece0, 0x7a2a6a, 0x3a8a2a, 0xe8c020, 0xf4f0e8, 0xd84a10];
          for (let i = 0; i < 8; i++)
            b.box(0.34, 0.03, 0.26, K.mat(cols[i], 0.7), [X(CU0 + 1.3 + i * 0.4), 0.95, CZ - 0.05], null, 0);
          // sloped sneeze guard
          b.box(3.4, 0.02, 0.4, K.glass(0xe0f0f4, 0.25), [X(CU0 + 2.7), 1.28, CZ + 0.12], [-0.6, 0, 0], 0);
          for (const gu of [CU0 + 1.05, CU0 + 4.35])
            b.cyl(0.012, 0.012, 0.4, chrome, [X(gu), 1.12, CZ + 0.15], null, 6);
          // sauce bottles: chilli and garlic
          for (let i = 0; i < 4; i++)
            b.cyl(
              0.035,
              0.035,
              0.2,
              K.mat(i % 2 ? 0xc4141c : 0xf4f0e0, 0.4),
              [X(CU0 + 4.9 + i * 0.1), 1.05, CZ + 0.1],
              null,
              8
            );
        } else {
          b.box(L, 0.95, cd, redP, [cx, 0.475, CZ], null, 0.01);
          for (const gy of [0.12, 0.88]) b.box(L + 0.02, 0.04, 0.02, goldP, [cx, gy, CZ + cd / 2 + 0.01], null, 0);
          b.box(L + 0.04, 0.05, cd + 0.08, K.mat(0x1a1a1a, 0.3), [cx, 0.975, CZ], null, 0.005);
          // lucky cat with a raised paw
          const gold = K.mat(0xe8c040, 0.3, 0.6);
          b.add(K.sphGeo(0.08, 10, 8), gold, {p: [X(CU0 + 4.6), 1.08, CZ], s: [1, 1.1, 0.9]});
          b.add(K.sphGeo(0.065, 10, 8), gold, {p: [X(CU0 + 4.6), 1.22, CZ]});
          b.cyl(0.018, 0.018, 0.1, gold, [X(CU0 + 4.6) + 0.06, 1.24, CZ + 0.02], [0, 0, 0.2], 6);
          // bags of prawn crackers, a bell, a stack of menus
          for (let i = 0; i < 4; i++)
            b.box(
              0.16,
              0.22,
              0.08,
              K.mat(0xf4f0e0, 0.6),
              [X(CU0 + 3.2 + i * 0.2), 1.11, CZ - 0.15],
              [0, 0.1 * i, 0.08],
              0.02
            );
          b.cyl(0.05, 0.06, 0.05, chrome, [X(CU0 + 1.8), 1.03, CZ + 0.15], null, 10);
          b.box(0.22, 0.04, 0.3, K.mat(0xc4141c, 0.6), [X(CU0 + 2.4), 1.02, CZ + 0.2], [0, 0.2, 0], 0);
        }
        S(...xr(s, CU0, CU1 - Q), CZ - cd / 2, CZ + cd / 2, 0, 1.0);
        // counter flap by the party wall, lifted up against the wall
        b.box(0.04, 0.9, cd, kb ? ss : K.mat(0x1a1a1a, 0.3), [X(0.2), 1.45, CZ], null, 0.005);
      }

      /* ---------- back bar: kebab doner spits, fryer, pitta warmer; wok hot cabinet, rice warmer, sauces ---------- */
      {
        const z0 = PZ + Q,
          dep = 0.65,
          bz = z0 + dep / 2,
          u0 = 1.65,
          u1 = 6.6;
        b.box(u1 - u0, 0.88, dep, ss, [X((u0 + u1) / 2), 0.44, bz], null, 0.01);
        S(...xr(s, u0, u1), z0, z0 + dep, 0, 0.9);
        if (kb) {
          const meatTex = K.paint('kb_meat', 128, 128, (c, W, H, r) => {
            c.fillStyle = '#7a3a18';
            c.fillRect(0, 0, W, H);
            for (let k = 0; k < 400; k++) {
              c.fillStyle = `hsl(${16 + r() * 16},${50 + r() * 20}%,${18 + r() * 26}%)`;
              c.fillRect(r() * W, r() * H, 6 + r() * 10, 2 + r() * 3);
            }
          });
          for (const su of [2.3, 3.4]) {
            b.box(0.55, 1.15, 0.12, ss, [X(su), 0.9 + 0.575, z0 + 0.06], null, 0.01);
            b.box(
              0.42,
              0.85,
              0.02,
              K.mat(0xff6a20, 0.5, 0, {emissive: 0xff4a10, emissiveIntensity: 1.1}),
              [X(su), 1.5, z0 + 0.125],
              null,
              0
            );
            b.cyl(0.008, 0.008, 1.0, steel, [X(su), 1.45, z0 + 0.36], null, 6);
            b.cyl(0.17, 0.1, 0.6, meatTex, [X(su), 1.42, z0 + 0.36], null, 14);
            b.cyl(0.12, 0.12, 0.03, ss, [X(su), 0.92, z0 + 0.36], null, 14); // drip tray
          }
          // twin-basket fryer
          b.box(0.6, 0.15, 0.55, ss, [X(4.6), 0.96, bz], null, 0.01);
          for (const k of [-0.14, 0.14]) {
            b.box(0.22, 0.01, 0.35, grease, [X(4.6) + k, 1.04, bz], null, 0);
            b.box(0.2, 0.1, 0.3, K.mat(0x8a8a88, 0.5, 0.6), [X(4.6) + k, 1.12, bz - 0.12], [0.6, 0, 0], 0);
          }
          // pitta warmer + bain marie of chilli sauce
          b.box(0.7, 0.3, 0.45, ss, [X(5.7), 1.03, bz], null, 0.01);
          b.box(0.6, 0.02, 0.35, K.mat(0xe8c890, 0.7), [X(5.7), 1.19, bz], null, 0);
          // a stack of polystyrene boxes
          for (let i = 0; i < 6; i++) b.box(0.24, 0.07, 0.22, white, [X(6.35), 0.92 + i * 0.075, bz], null, 0.01);
        } else {
          // heated glass cabinet of foil trays
          b.box(2.2, 0.55, 0.5, K.glass(0xf4e0c0, 0.25), [X(3.0), 1.16, bz], null, 0);
          b.box(2.2, 0.04, 0.5, ss, [X(3.0), 1.44, bz], null, 0);
          b.box(
            2.1,
            0.01,
            0.42,
            K.mat(0xffc080, 0.4, 0, {emissive: 0xff9a40, emissiveIntensity: 0.6}),
            [X(3.0), 1.42, bz],
            null,
            0
          );
          for (let k = 0; k < 2; k++)
            for (let i = 0; i < 5; i++) {
              b.box(
                0.3,
                0.06,
                0.18,
                K.mat(0xc8ccd0, 0.3, 0.8),
                [X(2.2 + i * 0.4), 0.95 + k * 0.25, bz - 0.1 + k * 0.1],
                null,
                0
              );
              b.box(
                0.26,
                0.01,
                0.14,
                K.mat([0xc86a1a, 0xe8c040, 0x8a2a10, 0x6a8a2a][(i + k) % 4], 0.6),
                [X(2.2 + i * 0.4), 0.985 + k * 0.25, bz - 0.1 + k * 0.1],
                null,
                0
              );
            }
          // rice warmer drum, soy and chilli oil bottles
          b.cyl(0.2, 0.2, 0.32, K.mat(0xe8e4dc, 0.4), [X(4.7), 1.04, bz], null, 16);
          b.cyl(0.21, 0.21, 0.04, K.mat(0x8a1418, 0.4), [X(4.7), 1.22, bz], null, 16);
          for (let i = 0; i < 6; i++)
            b.cyl(
              0.03,
              0.03,
              0.22,
              K.mat(i % 2 ? 0x1a0e08 : 0xa82a10, 0.2, 0.1),
              [X(5.3 + i * 0.1), 1.0, bz + 0.1],
              null,
              8
            );
          // takeaway bag stack + a wall of folded brown bags
          for (let i = 0; i < 3; i++)
            b.box(
              0.3,
              0.35,
              0.18,
              card,
              [X(6.0 + (i % 2) * 0.1), 1.06 + i * 0.02, bz - 0.05 + i * 0.03],
              [0, 0.2 * i, 0],
              0.01
            );
        }
      }

      /* ---------- kitchen ---------- */
      if (kb) {
        // prep island: two steel tables, a raw doner cone on a tray, onions, a slicer, sauce tubs
        sTable(X(3.6), 0.2, 1.4, 0.8);
        sTable(X(5.1), 0.2, 1.4, 0.8);
        b.cyl(0.2, 0.12, 0.55, K.mat(0xc87a6a, 0.6), [X(3.4), 1.18, 0.2], null, 14); // raw cone
        b.box(0.5, 0.02, 0.5, ss, [X(3.4), 0.91, 0.2], null, 0);
        for (let i = 0; i < 6; i++)
          b.add(K.sphGeo(0.05, 6, 5), K.mat(0xc8a0a8, 0.6), {
            p: [X(3.9 + (i % 3) * 0.1), 0.94, 0.0 + Math.floor(i / 3) * 0.1]
          });
        rb(0.35, 0.3, 0.3, 0.04, K.mat(0xd0d0cc, 0.4, 0.5), [X(5.4), 1.05, 0.25]);
        b.cyl(0.13, 0.13, 0.02, ss, [X(5.4) - s * 0.05, 1.15, 0.38], [PI / 2, 0, 0.3], 16);
        for (let i = 0; i < 3; i++)
          b.cyl(
            0.11,
            0.11,
            0.18,
            K.mat([0xf4f0e0, 0xc4141c, 0xe8e0a0][i], 0.5),
            [X(4.7 + i * 0.25), 0.99, 0.45],
            null,
            12
          );
        b.label(
          0.6,
          0.6,
          K.paint('kb_cleaning', 192, 192, c => {
            c.fillStyle = '#fff';
            c.fillRect(0, 0, 192, 192);
            txt(c, 'CLEANING', 96, 30, 'bold 26px ' + SANS, '#111');
            txt(c, 'ROTA', 96, 60, 'bold 26px ' + SANS, '#111');
            c.strokeStyle = '#999';
            for (let i = 0; i < 6; i++) c.strokeRect(14, 80 + i * 17, 164, 17);
            txt(c, 'never', 96, 150, 'italic 30px ' + SERIF, '#1a3ac8');
          }),
          [X(9 - 0.15 - 0.02), 1.6, -1.6],
          [0, -s * (PI / 2), 0]
        );
        // sacks of onions and a crate of lettuce by the party wall
        // v089: further from the kitchen door (they were right behind it)
        for (let i = 0; i < 3; i++)
          b.add(K.sphGeo(0.25, 8, 6), K.mat(0xc88a3a, 0.9), {p: [X(0.45), 0.24, 0.1 + i * 0.35], s: [1, 1.2, 0.9]});
        crate(X(1.05), 0.04, 0.5, 0.5, 0.3, 0.4, K.mat(0x3a7a3a, 0.6));
        S(...xr(s, 0.15, 1.3), -0.15, 1.05, 0, 0.6, true);
      } else {
        // wok range on the servery wall under a hood: three burners, one roaring
        const z1 = PZ - Q,
          rz = z1 - 0.42,
          ru0 = 2.6,
          ru1 = 6.4;
        b.box(ru1 - ru0, 0.82, 0.84, ss, [X((ru0 + ru1) / 2), 0.41, rz], null, 0.01);
        b.box(ru1 - ru0, 0.9, 0.04, ss, [X((ru0 + ru1) / 2), 1.27, z1 - 0.02], null, 0); // splashback
        S(...xr(s, ru0, ru1), z1 - 0.84, z1, 0, 0.9);
        for (let i = 0; i < 3; i++) {
          const wu = 3.2 + i * 1.3;
          b.tor(0.2, 0.03, K.mat(0x2a2a2a, 0.5, 0.6), [X(wu), 0.84, rz], [PI / 2, 0, 0], PI * 2, 14);
          b.add(K.sphGeo(0.3, 14, 8, PI / 2, PI / 2), K.mat(0x1a1a1a, 0.35, 0.7), {
            p: [X(wu), 1.06, rz],
            s: [1, 0.55, 1]
          });
          b.cyl(0.015, 0.015, 0.45, K.mat(0x6a4a2a, 0.6), [X(wu), 1.08, rz + 0.45], [PI / 2 - 0.2, 0, 0], 6);
          if (i === 1)
            for (let k = 0; k < 5; k++)
              b.add(
                K.cylGeo(0.0, 0.06 + (k % 2) * 0.03, 0.4 + k * 0.08, 8),
                K.mat(0xff8a20, 0.5, 0, {emissive: [0xff7a10, 0xffb020, 0xff4a10][k % 3], emissiveIntensity: 1.8}),
                {
                  p: [X(wu) + Math.cos(k * 1.3) * 0.18, 1.32 + (k % 2) * 0.08, rz + Math.sin(k * 1.3) * 0.16],
                  r: [0, 0, (k - 2) * 0.15]
                }
              );
        }
        // the hood
        b.box(ru1 - ru0 + 0.2, 0.5, 1.0, K.mat(0xb4b8bc, 0.35, 0.75), [X((ru0 + ru1) / 2), 2.45, z1 - 0.5], null, 0.01);
        b.box(ru1 - ru0, 0.02, 0.9, grease, [X((ru0 + ru1) / 2), 2.19, z1 - 0.5], null, 0);
        // prep island, rice cooker, steamer stack
        sTable(X(4.4), -0.4, 2.4, 0.8);
        b.cyl(0.24, 0.24, 0.32, K.mat(0xe8e4dc, 0.4), [X(3.6), 1.06, -0.4], null, 16);
        for (let k = 0; k < 4; k++)
          b.cyl(0.2, 0.2, 0.1, K.mat(0xc8a46a, 0.8), [X(4.4), 0.95 + k * 0.105, -0.4], null, 14);
        b.box(0.5, 0.06, 0.35, K.mat(0xe8d8b8, 0.7), [X(5.1), 0.93, -0.35], null, 0.01); // chopping board
        b.box(0.18, 0.08, 0.02, ss, [X(5.1), 0.98, -0.3], [0, 0.4, 0], 0); // cleaver
        // rice sacks on a pallet by the party wall
        // v089: further from the kitchen door
        crate(X(0.75), 0.0, 0.45, 1.1, 0.13, 0.9, K.mat(0x9a7a52, 0.85));
        for (let k = 0; k < 3; k++)
          for (let i = 0; i < 2; i++)
            rb(0.48, 0.18, 0.8, 0.06, K.mat(0xe8e0cc, 0.95), [X(0.5 + i * 0.52), 0.22 + k * 0.19, 0.45]);
        S(...xr(s, 0.15, 1.35), -0.05, 0.95, 0, 0.8, true);
      }
      // both kitchens: a mop in a grey bucket, grease on the floor, a fly zapper
      b.cyl(0.2, 0.17, 0.3, K.mat(0x6a6a6a, 0.6), [X(8.4), 0.17, -1.9], null, 14);
      b.cyl(0.012, 0.012, 1.2, K.mat(0x8a6a4a, 0.6), [X(8.45), 0.75, -1.9], [0.15, 0, 0.1], 6);
      smear(X(4.5), 1.4, 0.6, grease);
      smear(X(6.4), -1.0, 0.45, grease, 1.1);
      b.box(0.5, 0.18, 0.08, dark, [X(4.5), 2.6, KZ + Q + 0.05], null, 0.01);
      b.box(
        0.42,
        0.1,
        0.01,
        K.mat(0x6a3aff, 0.4, 0, {emissive: 0x7a4aff, emissiveIntensity: 1.4}),
        [X(4.5), 2.6, KZ + Q + 0.095],
        null,
        0
      );

      /* ---------- the store: chained freezer, mincer, shelving of tubs, MEAT (MIXED) boxes, stains ---------- */
      {
        chainedFreezer(X(3.9), -5.0, true, true);
        shelving(0, X(0.5), -5.2, 2.6, 0.55, (px, py, pz, k, i) => {
          if ((k + i) % 3 === 2) return;
          if (k % 2) b.cyl(0.12, 0.12, 0.26, K.mat(i % 2 ? 0xf0ece0 : 0xc4141c, 0.5), [px, py + 0.13, pz], null, 10);
          else crate(px, py, pz, 0.4, 0.28, 0.32, i % 2 ? card : card2);
        });
        // boxes labelled for what they are (or aren't)
        crate(X(3.4), 0.0, -7.0, 0.6, 0.4, 0.45, card);
        crate(X(3.4), 0.4, -7.0, 0.55, 0.35, 0.42, card2, 0.2);
        b.label(0.5, 0.18, boxLabel(kb ? 'kb_bx1' : 'nw_bx1', kb ? 'MEAT (MIXED)' : 'MEAT (OTHER)', '#8a0a0a'), [
          X(3.4),
          0.22,
          -6.77
        ]);
        b.label(0.45, 0.16, boxLabel('kw_bx2', 'DO NOT OPEN', '#111'), [X(3.4), 0.6, -6.78]);
        S(...xr(s, 3.1, 3.7), -7.25, -6.75, 0, 0.8, true);
        // butcher's block with a cleaver, and a mincer, beside the freezer
        b.box(0.6, 0.85, 0.6, K.mat(0x8a6a44, 0.8), [X(3.9), 0.425, -3.3], null, 0.02);
        b.box(0.58, 0.02, 0.58, blood, [X(3.9), 0.855, -3.3], null, 0);
        b.box(0.04, 0.16, 0.24, ss, [X(3.9), 0.98, -3.25], [0, 0, 0.3], 0);
        S(...xr(s, 3.6, 4.2), -3.6, -3.0, 0, 0.9, true);
        b.cyl(0.1, 0.12, 0.22, K.mat(0xc8ccd0, 0.35, 0.8), [X(0.55), 0.94 + 0.95, -6.6], null, 12); // mincer on the top shelf
        // a hacksaw on a nail, stains, a lone trainer
        b.box(0.02, 0.1, 0.5, ss, [X(4.5 - Q - 0.03), 1.6, -6.0], [0.2, 0, 0], 0);
        smear(X(3.2), -5.3, 0.55);
        smear(X(2.4), -6.4, 0.3, blood, 2.2);
        smear(X(3.6), -3.9, 0.25);
        rb(0.12, 0.1, 0.28, 0.04, K.mat(0xf2f2ee, 0.6), [X(1.4), 0.09, -3.1], [0, 0.7, 0]);
        b.box(0.1, 0.02, 0.24, K.mat(0x8a0a0a, 0.5), [X(1.4), 0.04, -3.1], [0, 0.7, 0], 0);
      }

      /* ---------- the back room: camp bed, card table, cash, dodgy boxes, CCTV, a safe ---------- */
      {
        // camp bed along the back wall with a sleeping bag
        const bu = 6.4,
          bz = Z0 + 0.15 + 0.4;
        b.box(1.9, 0.04, 0.72, K.mat(0x3a4a2a, 0.8), [X(bu), 0.4, bz], null, 0.01);
        for (const lx of [-0.85, 0, 0.85]) b.box(0.03, 0.4, 0.7, galvT, [X(bu) + lx, 0.2, bz], [0, 0, 0.3], 0);
        rb(1.6, 0.14, 0.66, 0.06, K.mat(kb ? 0x2a4a8a : 0x8a2a2a, 0.8), [X(bu + 0.1), 0.49, bz]);
        rb(0.4, 0.12, 0.3, 0.05, K.mat(0xd8d0c0, 0.9), [X(bu - 0.75), 0.5, bz]);
        S(...xr(s, bu - 0.95, bu + 0.95), bz - 0.36, bz + 0.36, 0, 0.6, true);
        // card table, two folding chairs, playing cards, cash, beer cans, an ashtray
        const tu = 6.3,
          tz = -4.6;
        b.box(0.9, 0.03, 0.9, K.mat(0x1a5a2a, 0.9), [X(tu), 0.72, tz], null, 0.005);
        for (const lx of [-0.4, 0.4])
          for (const lz of [-0.4, 0.4]) b.cyl(0.015, 0.015, 0.72, galvT, [X(tu) + lx, 0.36, tz + lz], null, 6);
        S(...xr(s, tu - 0.45, tu + 0.45), tz - 0.45, tz + 0.45, 0, 0.75, true);
        fChair(X(tu) - 0.55, tz + 0.1, PI / 2, K.mat(0x3a3a3a, 0.6));
        fChair(X(tu) + 0.55, tz - 0.1, -PI / 2, K.mat(0x3a3a3a, 0.6));
        for (let i = 0; i < 8; i++)
          b.box(0.06, 0.003, 0.09, white, [X(tu) - 0.3 + i * 0.08, 0.74, tz + (i % 3) * 0.1 - 0.1], [0, i, 0], 0);
        for (let i = 0; i < 4; i++)
          b.box(
            0.15,
            0.03 + i * 0.01,
            0.07,
            K.mat(0x6a8a5a, 0.8),
            [X(tu) + 0.2, 0.75 + i * 0.012, tz + 0.25 - i * 0.03],
            [0, 0.3 * i, 0],
            0
          );
        for (let i = 0; i < 3; i++)
          b.cyl(0.033, 0.033, 0.12, K.mat(0xc8b030, 0.3, 0.7), [X(tu) - 0.25 + i * 0.12, 0.8, tz - 0.3], null, 8);
        b.cyl(0.07, 0.06, 0.03, K.mat(0x5a5a5a, 0.3, 0.6), [X(tu), 0.75, tz - 0.05], null, 10);
        for (let i = 0; i < 4; i++)
          b.cyl(
            0.035,
            0.035,
            0.12,
            K.mat(0xc8b030, 0.3, 0.7),
            [X(tu + 0.9 + i * 0.12), 0.06, tz + 0.7],
            [PI / 2, i, 0],
            8
          ); // crushed cans
        // stacked boxes of who-knows-what by the divider wall
        for (let k = 0; k < 3; k++)
          for (let i = 0; i < 2; i++)
            crate(X(4.95 + i * 0.5), k * 0.4, -3.15, 0.46, 0.38, 0.5, (k + i) % 2 ? card : card2);
        b.label(0.4, 0.14, boxLabel(kb ? 'kb_bx3' : 'nw_bx3', kb ? 'CIGS · NOT FOR SALE' : 'GUCCY BAGS', '#111'), [
          X(4.95),
          0.6,
          -2.89
        ]);
        b.label(0.4, 0.14, boxLabel(kb ? 'kb_bx4' : 'nw_bx4', kb ? '"SPICES"' : 'DVDs (NEW)', '#111'), [
          X(5.45),
          1.0,
          -2.89
        ]);
        S(...xr(s, 4.65, 5.75), -3.4, -2.9, 0, 1.2, true);
        // a small safe on the floor by the outer wall, a CCTV monitor on a crate showing the counter
        rb(0.5, 0.55, 0.5, 0.02, K.mat(0x3a3e3a, 0.4, 0.6), [X(8.5), 0.28, -6.6]);
        b.cyl(0.05, 0.05, 0.03, chrome, [X(8.5) - s * 0.26, 0.35, -6.6], [0, 0, PI / 2], 10);
        S(...xr(s, 8.25, 8.85), -6.85, -6.35, 0, 0.6, true);
        crate(X(8.5), 0, -3.4, 0.6, 0.5, 0.5, K.mat(0x8a6a44, 0.8));
        rb(0.4, 0.34, 0.36, 0.02, K.mat(0x2a2a2a, 0.5), [X(8.5), 0.68, -3.4]);
        b.box(
          0.01,
          0.26,
          0.32,
          K.mat(0x7a8a7a, 0.4, 0, {emissive: 0x8aa08a, emissiveIntensity: 0.5}),
          [X(8.5) - s * 0.205, 0.68, -3.4],
          null,
          0
        );
        S(...xr(s, 8.2, 8.85), -3.65, -3.15, 0, 0.9, true);
        if (!kb) {
          // a rail of knock-off handbags along the divider wall
          b.cyl(0.015, 0.015, 1.6, galvT, [X(4.75), 1.6, -5.8], [PI / 2, 0, 0], 6);
          for (let i = 0; i < 6; i++)
            rb(0.12, 0.26, 0.3, 0.05, K.mat([0x8a5a2a, 0xc8a060, 0x1a1a1a, 0xc4141c][i % 4], 0.5), [
              X(4.8),
              1.32,
              -6.45 + i * 0.26
            ]);
          S(...xr(s, 4.6, 5.0), -6.65, -5.0, 0, 1.7, true);
        } else {
          // a pin-up of the hygiene inspector with darts in it
          b.label(
            0.5,
            0.6,
            K.paint('kb_dart', 128, 160, c => {
              c.fillStyle = '#e8e4d8';
              c.fillRect(0, 0, 128, 160);
              c.fillStyle = '#c8a088';
              c.beginPath();
              c.arc(64, 64, 34, 0, PI * 2);
              c.fill();
              c.fillStyle = '#2a3a6a';
              c.fillRect(24, 100, 80, 50);
              txt(c, 'INSPECTOR', 64, 20, 'bold 18px ' + SANS, '#c4141c');
              c.fillStyle = '#c4141c';
              for (const [dx, dy] of [
                [50, 56],
                [76, 70],
                [62, 88]
              ])
                c.fillRect(dx, dy, 6, 6);
            }),
            [X(RU + Q + 0.02), 1.6, -5.6],
            [0, s * (PI / 2), 0]
          );
        }
      }
    }

    /* ---------- dressing: chip papers, napkins, a wet floor sign ---------- */
    for (const [x, z, r] of [
      [-3.0, 6.2, 0.4],
      [-5.2, 7.0, 1.8],
      [3.6, 5.6, 2.4],
      [6.0, 7.2, 0.8],
      [-6.0, 2.0, 1.2]
    ])
      b.box(0.2, 0.004, 0.15, K.mat(0xf2f0e8, 0.8), [x, 0.05, z], [0, r, 0], 0);
    b.box(0.03, 0.6, 0.3, K.mat(0xf2c21a, 0.5), [5.4, 0.32, 5.4], [0, 0.4, 0.25], 0);
    b.box(0.03, 0.6, 0.3, K.mat(0xf2c21a, 0.5), [5.6, 0.32, 5.4], [0, 0.4, -0.25], 0);

    return (CACHE = G.done());
  }

  /* v091: back-yard puddles [x, z, radius], lot coordinates */
  const YARD_PUDDLES = [
    [-0.8, -11.2, 0.9],
    [4.2, -13.4, 0.7],
    [-3.6, -15.2, 1.1],
    [6.8, -15.6, 0.6]
  ];
  function bKebabWok(x, z, t) {
    const B = mk(x, z, 20, 36, H, 0x7a766c, 0x6a5a4a, 0x2a2c30);
    B.dx = 0;
    const PT = {th: 0.14, c: 0xe8e2d4};
    WL(B, 1, Z1, X0, X1, opsU(FRONT, 1), H);
    WL(B, 1, Z0, X0, X1, opsU(BACK, 1), H);
    WL(B, 0, X0, Z0, Z1, opsU(SIDE, 1), H);
    WL(B, 0, X1, Z0, Z1, opsU(SIDE, 1), H);
    WL(B, 0, XM, Z0, Z1, [], H, {th: 0.3}); // party wall: two separate shops
    for (const s of [-1, 1]) {
      const a0 = s < 0 ? X0 : XM,
        a1 = s < 0 ? XM : X1;
      WL(B, 1, PZ, a0, a1, opsU(U_PART, s), H, PT); // servery / kitchen
      WL(B, 1, KZ, a0, a1, opsU(U_KPART, s), H, PT); // kitchen / back rooms
      WL(B, 0, s * RU, Z0, KZ, [], H, PT); // store / back room
      WL(B, 1, TZ, Math.min(s * TU, s * 9), Math.max(s * TU, s * 9), opsU(U_WC, s), H, PT); // customer toilet front
      WL(B, 0, s * TU, PZ, TZ, [], H, PT); // customer toilet side (the counter ends on it)
    }
    LK.attach(B, build());
    if (window.MFZWATER)
      YARD_PUDDLES.forEach(([x, z, r], i) => MFZWATER.puddle(B.g, x, z, r * 2.8, r * 1.6, 0, 11 + i, 0.036)); // v091
    const SP = LK.spawner(B, 'takeout');
    for (const s of [-1, 1]) {
      const kb = s < 0,
        kt = kb ? 'kb_kitchen' : 'nw_kitchen',
        out = -s * (PI / 2), // facing in from the outer wall
        inn = s * (PI / 2); // facing out from the party wall
      // the till on the counter
      SP(s * 2.4, CZ, 'cash_register', 'takeout', 0, 1.0);
      // kitchen: fridge and sink on the outer wall, a chest freezer on the party wall
      SP(s * 8.5, -1.3, 'fridge_modern', kt, out);
      SP(s * 8.5, 1.8, 'kitchen_sink', kt, out);
      SP(s * 0.5, -1.0, 'chest_freezer_full', kt, inn);
      // the back rooms: one box each worth a look
      SP(s * 1.0, -7.0, 'cardboard_box_medium', 'kw_back', 0.3 * s);
      SP(s * 7.6, -4.4, 'cardboard_box_medium', 'kw_back', -0.2 * s); // v089: off the back-room door
      // customer toilet cabinet, on the toilet's side wall
      SP(s * (TU + 0.25), 3.6, 'medicine_cabinet', 'kw_wc', inn);
      // two vending machines each on the front apron, against the solid wall by the pier
      SP(s * 0.75, Z1 + 0.55, kb ? 'vending_snack' : 'vending_zest', 'convenience', 0);
      SP(s * 1.75, Z1 + 0.55, kb ? 'vending_polar' : 'vending_blitz', 'convenience', 0);
    }
    // the yard: one dumpster for both
    SP(7.4, -12.4, 'dumpster_green', 'storage', PI / 2);
    return LK.finish(B, t, {
      at: [(X0 + X1) / 2, (Z0 + Z1) / 2],
      w: X1 - X0,
      d: Z1 - Z0,
      loot: ['kw_back', [-8.4, -5.0, -7.0, -3.0], 1],
      zombies: [
        [-3.0, 6.6],
        [-3.5, 3.3],
        [-5.0, 0.0],
        [-6.8, -5.0],
        [3.0, 6.6],
        [3.5, 3.3],
        [5.0, 0.0],
        [6.8, -5.0],
        [-4.5, -12.5],
        [4.5, -14.5]
      ]
    });
  }

  const e = LK.register({
    id: 'mr_foos_takeout',
    name: 'Kebabsolutely & Nightmare on Wok Street',
    build: bKebabWok,
    note: 'half plot split into two takeaways: Kebabsolutely (kebab & burger: doner spits, salad counter) and Nightmare on Wok Street (Chinese: wok range, hot cabinet); waiting areas, customer toilets, kitchens and questionable back rooms; dingy yard',
    globals: {bKebabWok, KEBABWOK: {build}}
  });
  if (e) e.loot = 'takeout';
  console.log('[kebabwok] Kebabsolutely & Nightmare on Wok Street ready');
})();
