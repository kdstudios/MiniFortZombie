/* ==========================================================================================================
   MINI FORT ZOMBIE - HIDE YOUR JUNK: STORAGE UNITS (v089): a half-plot self-storage yard (20 x 36 m plot, front = +Z), our own design.
   Replaces Ray's Storage & Containment Units (core NEWCAT id rays_storage_units, half pool; the old hRay is no longer used).
   Exterior: the whole yard sits inside a chain-link fence topped with razor-wire coils. The ONLY way in is the drive gate at the front
   (its rolling chain-link leaf parked open behind the fence). Three rows of white block storage units under red corrugated pitched roofs:
   row A down the left (6 units, doors facing the drive lane), row B down the right (5 units facing the lane, a bank of yellow lockers under a
   clear canopy on its back), row C across the back (5 units facing a cross aisle). Every unit has an orange steel roller door that rolls up
   (core mkRollDoor): they are locked (lockpick, or break them down) and only one to three each visit stand open. Unit numbers over the doors.
   At the front right, the small office: painted block, dark fascia with the HIDE YOUR JUNK board, barred street windows, a door onto the lane.
   Inside: blue carpet, a customer counter with the till, desk with CCTV, filing cabinets, a sofa under the all-seeing-eye picture, the unit
   key cabinet, water cooler, rules and price boards, and a staff toilet. Sidewalk: street lights, meter, hydrant, no-parking sign.
   Units: every one is cluttered with junk (boxes, totes, covered furniture, mattresses, tyres, bikes, chairs). Only two or three per visit,
   chosen at random, hold anything worth taking, each themed with a random loot table (prepper, gun nut, tradesman, pill hoarder, camper,
   fence's stash, bootlegger, mechanic). The lockers hold small junk and most are locked.
   Structure from core WL (office doors / windows) and mkRollDoor; detail is our own geometry and painted artwork, outside the static merge.
   ========================================================================================================== */
(function () {
  'use strict';
  const K = window.MFZK,
    LK = window.LOTKIT;
  if (!K || !LK || typeof WL !== 'function' || typeof mkRollDoor !== 'function' || typeof NEWCAT === 'undefined') {
    console.warn('[hideyourjunk] core / prop kit missing');
    return;
  }
  const T = THREE,
    P = K.P,
    PI = Math.PI;

  /* ===================== layout ===================== */
  // fence line (front / back / sides) and the drive gate in the front fence
  const FZ = 14.8,
    BZ = -17.6,
    SX = 9.7,
    GX0 = -5.0,
    GX1 = -0.6,
    FH = 2.2; // chain-link height (the coil sits on top)
  // storage units: eaves height, roof rise, roller door opening
  const HU = 3.0,
    RISE = 0.85,
    DW = 2.6,
    DH = 2.5;
  // rows: ax 1 = door wall runs along X at z = f, 0 = along Z at x = f; bk = back wall; a0..a1 the run; n units; tag for the numbers
  // noEnd1: the a1 end wall is someone else's (row B's front end is the office back wall)
  const ROWS = [
    {tag: 'A', ax: 0, f: -5.4, bk: -9.4, a0: -10.4, a1: 13.6, n: 6},
    {tag: 'B', ax: 0, f: 0.6, bk: 5.0, a0: -10.4, a1: 8.6, n: 5, noEnd1: true},
    {tag: 'C', ax: 1, f: -13.2, bk: -17.2, a0: -9.4, a1: 9.4, n: 5}
  ];
  // the cross aisle in front of row C (z -13.2 .. -10.4) joins the drive lane (x -5.4 .. 0.6) and the locker path (x 5 .. 9.7)
  // the office (front right): walls, height, openings
  const OX0 = 0.6,
    OX1 = 9.55,
    OZ0 = 8.6,
    OZ1 = 14.6,
    HO = 3.4,
    OCEIL = 2.85,
    WCX = 7.4, // toilet partition (x) and its front wall (z)
    WCZ = 10.9;
  const OFRONT = [
    {k: 'w', c: 3.0},
    {k: 'w', c: 6.3}
  ];
  const OLEFT = [
    {k: 'w', c: 10.3},
    {k: 'd', c: 12.9}
  ];
  const OBACK = [{k: 'd', c: 6.2, s: -1}];
  const OWC = [{k: 'd', c: 9.9}]; // v089: was 9.75 (the basin sat in the door's edge)
  // every unit: {row, i, c (door centre along the run), w (bay width), s (inward sign), tag}
  const UNITS = [];
  for (const r of ROWS) {
    const bw = (r.a1 - r.a0) / r.n;
    r.bw = bw;
    r.s = Math.sign(r.bk - r.f);
    r.D = Math.abs(r.bk - r.f);
    for (let i = 0; i < r.n; i++) UNITS.push({r, i, c: r.a0 + (i + 0.5) * bw, w: bw, s: r.s, tag: r.tag + (i + 1)});
  }
  // unit frame: origin on the door wall line at the door centre, local +Z = into the unit (v), local X = u (across). th = its turn.
  const uTh = U => (U.r.ax ? (U.s > 0 ? 0 : PI) : U.s > 0 ? PI / 2 : -PI / 2);
  const uOrg = U => (U.r.ax ? [U.c, U.r.f] : [U.r.f, U.c]);
  const toLot = (U, u, v) => {
    const t = uTh(U),
      [ox, oz] = uOrg(U);
    return [ox + u * Math.cos(t) + v * Math.sin(t), oz - u * Math.sin(t) + v * Math.cos(t)];
  };
  // angle (model front = +Z) for a prop facing the door, or facing -u (standing against the +u side wall)
  const faceDoor = U => uTh(U) + PI,
    faceIn = U => uTh(U) - PI / 2;
  const UIN = 3.7; // inside depth of every unit (v 0.15 .. 3.85)

  /* ===================== loot tables ===================== */
  // lockers: small junk; office: staff snacks, a revolver in the desk; toilet: first-aid bits
  try {
    Object.assign(LOOT_TABLES, {
      hyj_junk: {
        duct_tape: 2,
        rope: 2,
        nails: 2,
        bungie_cord: 2,
        spring: 2,
        hairspray: 1,
        cotton_balls: 1,
        spray_paint: 1,
        crackers: 1,
        painkiller: 1
      },
      hyj_office: {
        tweex: 2,
        cheezholes: 2,
        z_energy_drink: 2,
        colacola: 2,
        granola: 1,
        water_jug: 1,
        painkiller: 2,
        duct_tape: 2,
        nails: 1,
        colt_detective_special: 1,
        ammo_38_fed: 1
      },
      hyj_wc: {painkiller: 2, gauze: 2, cotton_balls: 2, medical_tape: 1, hairspray: 1}
    });
    for (const tn of ['hyj_junk', 'hyj_office', 'hyj_wc'])
      for (const id in LOOT_TABLES[tn])
        if (!ITEMS[id]) {
          console.error('[hideyourjunk] loot table ' + tn + ' has unknown item ' + id);
          delete LOOT_TABLES[tn][id];
        }
    if (typeof LOOT_PROP !== 'undefined')
      Object.assign(LOOT_PROP, {hyj_junk: 'crate', hyj_office: 'cabinet', hyj_wc: 'cabinet'});
    const A = window.MFZPROP && MFZPROP.auto;
    if (A) {
      const pick = (...ts) => [...new Set(ts.flatMap(t => A[t] || []))];
      A.hyj_junk = pick('storage', 'warehouse');
      A.hyj_office = pick('office');
      A.hyj_wc = pick('clinic');
    }
  } catch (e) {
    console.warn('[hideyourjunk] loot tables', e);
  }
  // the few units worth looting each visit: a theme = [prop, table] pairs (core tables, so "anything" can turn up)
  const THEMES = [
    ['prepper', ['cardboard_box_large', 'supermarket'], ['shop_shelves_low', 'supermarket'], ['jerry_can', 'gas']],
    ['gun nut', ['gun_cabinet', 'gunshop'], ['ammo_crate', 'gunshop'], ['weapon_crate', 'gunshop']],
    ['tradesman', ['tool_chest', 'hardware'], ['toolbox', 'hardware'], ['cardboard_box_medium', 'hardware']],
    ['pill hoarder', ['medicine_cabinet', 'pharmacy'], ['pill_box', 'pharmacy'], ['cardboard_box_medium', 'clinic']],
    ['camper', ['trunk_leather', 'sporting'], ['cardboard_box_large', 'sporting'], ['propane_cylinder', 'hardware']],
    ["fence's stash", ['display_case', 'pawn'], ['trunk_steamer', 'pawn'], ['cardboard_box_small', 'pawn']],
    ['bootlegger', ['cardboard_box_large', 'liquor'], ['cardboard_box_medium', 'liquor'], ['jerry_can', 'gas']],
    ['mechanic', ['tool_chest', 'auto'], ['jerry_can', 'auto'], ['toolbox', 'auto']]
  ];

  /* ===================== lootable prop: the yellow storage locker (front = +Z) ===================== */
  K.def('hyj_locker', {label: 'Storage locker', table: 'hyj_junk', items: [0, 2], auto: ['storage']}, b => {
    const body = K.paintSteel(0xe0a81c, {worn: true, m: 0.35}),
      door = K.paintSteel(0xf0b828, {m: 0.3}),
      dk = K.mat(0x2a2a2a, 0.5),
      ch = K.chrome(),
      brass = K.mat(0xc8a040, 0.3, 0.85),
      W = 0.6,
      H = 1.85,
      D = 0.5;
    b.box(W, H, D, body, [0, H / 2, 0], null, 0.006);
    for (const [y0, y1] of [
      [0.04, 0.9],
      [0.95, H - 0.04]
    ]) {
      const h = y1 - y0,
        yc = (y0 + y1) / 2;
      b.box(W - 0.06, h - 0.02, 0.02, door, [0, yc, D / 2 + 0.01], null, 0.004);
      for (let k = 0; k < 5; k++) b.box(0.3, 0.018, 0.006, dk, [0, y1 - 0.1 - k * 0.04, D / 2 + 0.022], null, 0); // vents
      b.box(0.04, 0.12, 0.03, ch, [W / 2 - 0.08, yc, D / 2 + 0.03], null, 0.005); // hasp
      b.rbox(0.05, 0.06, 0.025, 0.008, brass, [W / 2 - 0.08, yc - 0.08, D / 2 + 0.045], null, 1); // padlock
      b.box(0.1, 0.06, 0.004, K.mat(0xf4f2ea, 0.8), [-W / 2 + 0.12, y1 - 0.06, D / 2 + 0.022], null, 0); // number card
    }
    b.col(-W / 2, 0, -D / 2, W / 2, H, D / 2);
  });

  /* ===================== artwork ===================== */
  const NAVY = '#1c2a4a',
    ORANGE = '#e8782a',
    CREAM = '#f4efe2';
  // the roller door leaf: orange ribbed steel slats, scuffs and rust at the foot, a black rubber seal, the lock hasp and a lift handle.
  // Box UVs: one painting covers the whole leaf (it squashes as it rolls up, which reads as the slats coiling)
  let DOORMAT = null;
  const doorMat = () => {
    if (DOORMAT) return DOORMAT;
    const t = K.tex('hyj_rolldoor', 256, 256, (c, W, H, r) => {
      c.fillStyle = '#ec8430';
      c.fillRect(0, 0, W, H);
      const n = 22,
        sh = H / n;
      for (let j = 0; j < n; j++) {
        const y = j * sh;
        c.fillStyle = '#f8a050';
        c.fillRect(0, y + sh * 0.12, W, sh * 0.3);
        c.fillStyle = '#d06c20';
        c.fillRect(0, y + sh * 0.7, W, sh * 0.18);
        c.fillStyle = 'rgba(90,40,0,.4)';
        c.fillRect(0, y + sh * 0.9, W, sh * 0.1);
      }
      P.noise(c, W, H, r, 2500, 0.06, '#000', 1.2);
      P.scratches(c, W, H, r, 25, 'rgba(255,230,200,.35)');
      // rust and road grime at the foot
      const g = c.createLinearGradient(0, H * 0.72, 0, H);
      g.addColorStop(0, 'rgba(70,40,20,0)');
      g.addColorStop(1, 'rgba(70,40,20,.6)');
      c.fillStyle = g;
      c.fillRect(0, H * 0.72, W, H * 0.28);
      for (let i = 0; i < 40; i++) {
        c.fillStyle = `rgba(${90 + r() * 40},${40 + r() * 20},10,${0.2 + r() * 0.4})`;
        c.beginPath();
        c.arc(r() * W, H * 0.8 + r() * H * 0.2, 1 + r() * 4, 0, PI * 2);
        c.fill();
      }
      c.fillStyle = '#1a1a1a'; // rubber seal
      c.fillRect(0, H - 6, W, 6);
      c.fillStyle = '#9a9ea2'; // bottom rail, hasp and padlock, lift handle
      c.fillRect(0, H - 14, W, 8);
      c.fillRect(W / 2 - 10, H - 34, 20, 22);
      c.fillStyle = '#c8a040';
      c.fillRect(W / 2 - 7, H - 26, 14, 14);
      c.strokeStyle = '#c8ccd0';
      c.lineWidth = 3;
      c.beginPath();
      c.arc(W / 2, H - 27, 5, PI, 0);
      c.stroke();
      c.fillStyle = '#5a5e62';
      c.fillRect(W * 0.2, H - 44, W * 0.14, 6);
      c.fillRect(W * 0.66, H - 44, W * 0.14, 6);
    });
    DOORMAT = new T.MeshStandardMaterial({map: t, roughness: 0.5, metalness: 0.45});
    if (window.RGW && RGW.env) DOORMAT.envMap = RGW.env;
    DOORMAT.envMapIntensity = 0.6;
    DOORMAT.userData.mfz = 1;
    return DOORMAT;
  };
  // logo mark: a padlock with a pair of eyes peeking out of the keyhole slot
  function drawLock(c, x, y, s, body, shackle, eye) {
    c.save();
    c.translate(x, y);
    c.scale(s, s);
    c.strokeStyle = shackle;
    c.lineWidth = 14;
    c.beginPath();
    c.arc(0, -18, 30, PI, 0);
    c.lineTo(30, 6);
    c.moveTo(-30, -18);
    c.lineTo(-30, 6);
    c.stroke();
    c.fillStyle = body;
    c.beginPath();
    c.roundRect ? c.roundRect(-48, 0, 96, 78, 12) : c.rect(-48, 0, 96, 78);
    c.fill();
    c.fillStyle = '#101010';
    c.fillRect(-30, 22, 60, 22);
    c.fillStyle = eye;
    for (const ex of [-12, 12]) {
      c.beginPath();
      c.arc(ex, 33, 8, 0, PI * 2);
      c.fill();
    }
    c.fillStyle = '#101010';
    for (const ex of [-10, 14]) {
      c.beginPath();
      c.arc(ex, 34, 3.5, 0, PI * 2);
      c.fill();
    }
    c.restore();
  }
  // the yard sign on the front fence
  const yardSign = () =>
    K.paint('hyj_yardsign', 1024, 320, (c, W, H) => {
      c.fillStyle = NAVY;
      c.fillRect(0, 0, W, H);
      c.fillStyle = ORANGE;
      c.fillRect(0, 0, W, 18);
      c.fillRect(0, H - 18, W, 18);
      drawLock(c, 130, 120, 1.55, ORANGE, '#c8ccd0', CREAM);
      c.fillStyle = CREAM;
      c.textBaseline = 'middle';
      c.font = 'bold 104px Arial Black, Arial, sans-serif';
      c.fillText('HIDE YOUR', 250, 92);
      c.fillStyle = ORANGE;
      c.fillText('JUNK', 250, 190);
      const jw = c.measureText('JUNK').width;
      c.fillStyle = CREAM;
      c.font = 'bold 46px Arial, sans-serif';
      c.fillText('STORAGE UNITS', 270 + jw, 176);
      c.font = 'italic 34px Arial, sans-serif';
      c.fillText('Out of sight, out of mind.', 270 + jw, 214);
      c.font = 'bold 30px Arial, sans-serif';
      c.fillStyle = '#c8d0e0';
      c.fillText('UNITS FROM $29/MO  ·  LOCKERS  ·  24 HR ACCESS*', 60, 268);
      c.font = '20px Arial, sans-serif';
      c.fillText('*mostly', W - 110, 284);
    });
  // the office fascia board
  const officeSign = () =>
    K.paint(
      'hyj_officesign',
      1024,
      200,
      (c, W, H) => {
        c.fillStyle = '#f2ede0';
        c.fillRect(0, 0, W, H);
        c.strokeStyle = ORANGE;
        c.lineWidth = 10;
        c.strokeRect(6, 6, W - 12, H - 12);
        drawLock(c, 92, 88, 1.0, ORANGE, '#6a6e72', '#ffffff');
        c.fillStyle = NAVY;
        c.textBaseline = 'middle';
        c.font = 'bold 86px Arial Black, Arial, sans-serif';
        c.fillText('HIDE YOUR JUNK', 170, 82);
        c.font = 'bold 40px Arial, sans-serif';
        c.fillStyle = ORANGE;
        c.fillText('STORAGE UNITS  ·  OFFICE', 176, 152);
      },
      {glow: 0.25}
    );
  // white enamel strap signs (OFFICE, NO TRESPASSING, the gate)
  const strap = (key, lines, bg, fg, w, h) =>
    K.paint(key, w || 512, h || 160, (c, W, H) => {
      c.fillStyle = bg;
      c.fillRect(0, 0, W, H);
      c.strokeStyle = fg;
      c.lineWidth = 6;
      c.strokeRect(8, 8, W - 16, H - 16);
      c.fillStyle = fg;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      lines.forEach(([t, f], i) => {
        c.font = f;
        c.fillText(t, W / 2, (H * (i + 1)) / (lines.length + 1));
      });
    });
  // unit numbers: one atlas, a cell per unit (white enamel plate, navy number)
  const NCOL = 4,
    NROW = 5;
  const numMat = () =>
    K.paint('hyj_nums', 512, 320, (c, W, H) => {
      const cw = W / NCOL,
        ch = H / NROW;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      UNITS.forEach((U, i) => {
        const x = (i % NCOL) * cw,
          y = Math.floor(i / NCOL) * ch;
        c.fillStyle = '#f4f2ea';
        c.fillRect(x + 3, y + 3, cw - 6, ch - 6);
        c.strokeStyle = NAVY;
        c.lineWidth = 4;
        c.strokeRect(x + 8, y + 8, cw - 16, ch - 16);
        c.fillStyle = NAVY;
        c.font = 'bold 40px Arial, sans-serif';
        c.fillText(U.tag, x + cw / 2, y + ch / 2 + 2);
      });
    });
  const numGeo = i => {
    const g = new T.PlaneGeometry(0.62, 0.3),
      uv = g.attributes.uv,
      u0 = (i % NCOL) / NCOL,
      v1 = 1 - Math.floor(i / NCOL) / NROW;
    for (let k = 0; k < uv.count; k++) uv.setXY(k, u0 + uv.getX(k) / NCOL, v1 - (1 - uv.getY(k)) / NROW);
    return g;
  };

  /* ===================== surfaces ===================== */
  const SURF = {};
  const surf = k =>
    SURF[k] ||
    (SURF[k] = {
      asphalt: () => K.surf('asphalt', 0x34363a),
      concrete: () => K.surf('concrete', 0xb4b0a6),
      slab: () => K.surf('concrete', 0x8a8884),
      lawn: () => K.surf('lawn', 0x4a6a2a),
      // white painted block (the units), running bond, soft mortar lines, weather stains
      block: () =>
        K.tri(
          'hyj_block',
          (c, W, H, r) => {
            c.fillStyle = '#c8c8c2';
            c.fillRect(0, 0, W, H);
            const rows = 8,
              bh = H / rows,
              bw = W / 2;
            for (let j = 0; j < rows; j++)
              for (let i = -1; i < 3; i++) {
                const x = i * bw + (j % 2 ? bw / 2 : 0),
                  l = 86 + r() * 5;
                c.fillStyle = `hsl(60,4%,${l}%)`;
                c.fillRect(x + 2, j * bh + 2, bw - 4, bh - 4);
              }
            P.noise(c, W, H, r, 4000, 0.06, '#3a3a30', 1.2);
            P.grime(c, W, H, r, 0.35);
          },
          {tile: 1.6, r: 0.9}
        ),
      // the office: pale buff painted block
      oblock: () =>
        K.tri(
          'hyj_oblock',
          (c, W, H, r) => {
            c.fillStyle = '#b8b098';
            c.fillRect(0, 0, W, H);
            const rows = 8,
              bh = H / rows,
              bw = W / 2;
            for (let j = 0; j < rows; j++)
              for (let i = -1; i < 3; i++) {
                const x = i * bw + (j % 2 ? bw / 2 : 0);
                c.fillStyle = `hsl(46,${18 + r() * 6}%,${70 + r() * 6}%)`;
                c.fillRect(x + 2, j * bh + 2, bw - 4, bh - 4);
              }
            P.noise(c, W, H, r, 4000, 0.07, '#3a3020', 1.2);
            P.grime(c, W, H, r, 0.4);
          },
          {tile: 1.6, r: 0.9}
        ),
      // red corrugated roof sheet: ribs run along the canvas x (box UVs: lay the plane with its length down the slope)
      roof: () =>
        K.paint(
          'hyj_roof',
          256,
          256,
          (c, W, H, r) => {
            c.fillStyle = '#a8261a';
            c.fillRect(0, 0, W, H);
            const n = 16,
              s = H / n;
            for (let j = 0; j < n; j++) {
              const g = c.createLinearGradient(0, j * s, 0, (j + 1) * s);
              g.addColorStop(0, '#7a160e');
              g.addColorStop(0.35, '#d0402a');
              g.addColorStop(0.6, '#b02c1c');
              g.addColorStop(1, '#6a120a');
              c.fillStyle = g;
              c.fillRect(0, j * s, W, s);
            }
            P.noise(c, W, H, r, 3000, 0.07, '#000', 1.2);
            P.scratches(c, W, H, r, 20, 'rgba(255,200,180,.2)');
            P.grime(c, W, H, r, 0.3);
          },
          {r: 0.55, m: 0.35}
        ),
      galv: () => K.mat(0x9a9ea2, 0.45, 0.7),
      trim: () => K.mat(0xec8430, 0.5, 0.25),
      chain: () =>
        K.paint(
          'hyj_chain',
          256,
          256,
          (c, W, H) => {
            c.clearRect(0, 0, W, H);
            c.strokeStyle = 'rgba(176,182,186,.95)';
            c.lineWidth = 2.2;
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
        ),
      wire: () => K.mat(0x8a8e92, 0.35, 0.85),
      fascia: () => K.mat(0x1e2a44, 0.55, 0.2),
      coping: () => K.mat(0x8a8c8e, 0.45, 0.5)
    }[k]());

  /* ===================== geometry ===================== */
  let CACHE = null;
  function build() {
    if (CACHE) return CACHE;
    const G = LK.geo('hideyourjunk'),
      b = G.b,
      S = G.S;
    const conc = surf('concrete'),
      asph = surf('asphalt');
    /* ---------- grounds: sidewalk, gate apron, asphalt yard, unit slabs ---------- */
    LK.pavement(b, conc, {w: 20, kerb: true});
    b.box(20, 0.04, 15.9 - FZ, conc, [0, 0.02, (FZ + 15.9) / 2], null, 0); // strip between the fence and the kerb
    b.box(GX1 - GX0 + 1.2, 0.045, 15.9 - FZ, asph, [(GX0 + GX1) / 2, 0.024, (FZ + 15.9) / 2], null, 0); // gate apron
    b.box(2 * SX, 0.02, FZ - BZ, asph, [0, 0.012, (FZ + BZ) / 2], null, 0); // the yard
    b.box(20, 0.02, BZ + 18, asph, [0, 0.012, (BZ - 18) / 2], null, 0); // behind the back fence
    for (const r of ROWS) {
      const lo = Math.min(r.f, r.bk),
        hi = Math.max(r.f, r.bk),
        L = r.a1 - r.a0,
        u = (r.a0 + r.a1) / 2;
      if (r.ax) b.box(L, 0.03, hi - lo, surf('slab'), [u, 0.03, (lo + hi) / 2], null, 0);
      else b.box(hi - lo, 0.03, L, surf('slab'), [(lo + hi) / 2, 0.03, u], null, 0);
    }
    b.box(OX1 - OX0, 0.03, OZ1 - OZ0, surf('slab'), [(OX0 + OX1) / 2, 0.03, (OZ0 + OZ1) / 2], null, 0);

    /* ---------- fence collision (the look comes with the exterior) ---------- */
    const FT = 3.0; // nothing climbs over
    S(-SX - 0.05, GX0, FZ - 0.05, FZ + 0.05, 0, FT, true); // front, left of the gate
    S(GX1, OX0, FZ - 0.05, FZ + 0.05, 0, FT, true); // front, gate to the office corner
    S(-SX - 0.05, -SX + 0.05, BZ, FZ, 0, FT, true); // left side
    S(SX - 0.05, SX + 0.05, BZ, OZ1, 0, FT, true); // right side, back to the office
    S(-SX, SX, BZ - 0.05, BZ + 0.05, 0, FT, true); // back
    // headers over the roller doors (the walls either side are WL)
    for (const U of UNITS) {
      const r = U.r;
      if (r.ax) S(U.c - DW / 2, U.c + DW / 2, r.f - 0.15, r.f + 0.15, DH, HU, true);
      else S(r.f - 0.15, r.f + 0.15, U.c - DW / 2, U.c + DW / 2, DH, HU, true);
    }

    const blk = surf('block'),
      oblk = surf('oblock'),
      roofM = surf('roof'),
      galv = surf('galv'),
      trim = surf('trim'),
      chain = surf('chain'),
      wire = surf('wire'),
      fascia = surf('fascia'),
      cop = surf('coping'),
      dark = K.mat(0x1c1c1e, 0.5),
      lit = K.mat(0xffffff, 0.4, 0, {emissive: 0xfff2d8, emissiveIntensity: 0.9});
    const rb = (w, h, d, r, m, p, rot) => b.rbox(w, h, d, r, m, p, rot, 1); // one segment per rounded edge
    // a box against a wall: ax / f as WL, n = which side (+1 / -1), off = distance from the wall line, u0..u1 along it, dep thick
    const wbox = (ax, f, n, off, u0, u1, y0, y1, m, dep) => {
      if (u1 - u0 < 0.02 || y1 - y0 < 0.02) return;
      const o = f + n * off,
        u = (u0 + u1) / 2,
        y = (y0 + y1) / 2;
      if (ax) b.box(u1 - u0, y1 - y0, dep, m, [u, y, o], null, 0);
      else b.box(dep, y1 - y0, u1 - u0, m, [o, y, u], null, 0);
    };
    // skin round WL openings (windows / doors as core WL)
    const skinOps = (ax, f, a0, a1, n, ops, h, m) => {
      ops = (ops || []).slice().sort((p, q) => p.c - q.c);
      let a = a0;
      for (const p of ops) {
        const hw = p.k === 'w' ? 0.75 : 0.65;
        wbox(ax, f, n, 0.165, a, p.c - hw, 0, h, m, 0.03);
        if (p.k === 'w') {
          wbox(ax, f, n, 0.165, p.c - hw, p.c + hw, 0, 0.9, m, 0.03);
          wbox(ax, f, n, 0.165, p.c - hw, p.c + hw, 2.75, h, m, 0.03);
        } else wbox(ax, f, n, 0.165, p.c - hw, p.c + hw, 2.4, h, m, 0.03);
        a = p.c + hw;
      }
      wbox(ax, f, n, 0.165, a, a1, 0, h, m, 0.03);
    };

    /* ---------- storage rows: white block skin, orange door frames, red corrugated pitched roofs, gables, unit numbers ---------- */
    const NG = numMat();
    UNITS.forEach((U, i) => (U.k = i));
    for (const r of ROWS) {
      const lo = Math.min(r.f, r.bk),
        hi = Math.max(r.f, r.bk),
        so = -r.s; // outward from the door wall
      let a = r.a0 - 0.15;
      for (let i = 0; i < r.n; i++) {
        const c = r.a0 + (i + 0.5) * r.bw;
        wbox(r.ax, r.f, so, 0.165, a, c - DW / 2, 0, HU, blk, 0.03);
        wbox(r.ax, r.f, so, 0.165, c - DW / 2, c + DW / 2, DH, HU, blk, 0.03); // header
        // orange frame: jambs and head, a kick-plate strip either side
        for (const sg of [-1, 1])
          wbox(
            r.ax,
            r.f,
            so,
            0.2,
            c + sg * (DW / 2 + 0.05) - 0.05,
            c + sg * (DW / 2 + 0.05) + 0.05,
            0,
            DH + 0.1,
            trim,
            0.06
          );
        wbox(r.ax, r.f, so, 0.2, c - DW / 2 - 0.1, c + DW / 2 + 0.1, DH, DH + 0.12, trim, 0.06);
        // the roller drum box inside, over the opening
        wbox(r.ax, r.f, r.s, 0.34, c - DW / 2 - 0.12, c + DW / 2 + 0.12, DH - 0.05, DH + 0.4, galv, 0.36);
        a = c + DW / 2;
      }
      wbox(r.ax, r.f, so, 0.165, a, r.a1 + 0.15, 0, HU, blk, 0.03);
      wbox(r.ax, r.bk, r.s, 0.165, r.a0 - 0.15, r.a1 + 0.15, 0, HU, blk, 0.03);
      wbox(1 - r.ax, r.a0, -1, 0.165, lo - 0.15, hi + 0.15, 0, HU, blk, 0.03);
      if (!r.noEnd1) wbox(1 - r.ax, r.a1, 1, 0.165, lo - 0.15, hi + 0.15, 0, HU, blk, 0.03);
      // unit numbers on the headers
      for (let i = 0; i < r.n; i++) {
        const U = UNITS.find(q => q.r === r && q.i === i),
          c = U.c,
          o = r.f + so * 0.2;
        const rot = r.ax ? [0, so > 0 ? 0 : PI, 0] : [0, so > 0 ? PI / 2 : -PI / 2, 0];
        b.add(numGeo(U.k), NG, {p: r.ax ? [c, (DH + HU) / 2 + 0.06, o] : [o, (DH + HU) / 2 + 0.06, c], r: rot});
      }
      // roof, in the row's own frame: X across the depth (0 = ridge), Z along the run
      const xc = (r.f + r.bk) / 2,
        zc = (r.a0 + r.a1) / 2,
        L = r.a1 - r.a0,
        D = r.D,
        run = D / 2 + 0.15 + 0.32,
        ang = Math.atan2(RISE, D / 2),
        len = run / Math.cos(ang),
        top = HU + RISE + 0.04;
      // ax 1 (row C): frame X = -lot z, Z = lot x, so the origin is (run centre, row centre)
      if (r.ax) b.push([zc, 0, xc], [0, PI / 2, 0]);
      else b.push([xc, 0, zc]);
      const e1 = r.noEnd1 ? 0 : 0.25, // row B ends against the office wall: no overhang there
        zA = -L / 2 - 0.25,
        zB = L / 2 + e1;
      for (let i = 0; i < r.n; i++) {
        const z0 = -L / 2 + i * r.bw - (i === 0 ? 0.25 : 0),
          z1 = -L / 2 + (i + 1) * r.bw + (i === r.n - 1 ? e1 : 0);
        for (const sg of [-1, 1])
          b.box(
            len,
            0.05,
            z1 - z0,
            roofM,
            [(sg * run) / 2, top - (run / 2) * Math.tan(ang), (z0 + z1) / 2],
            [0, 0, -sg * ang],
            0
          );
      }
      b.box(0.26, 0.08, zB - zA, roofM, [0, top + 0.03, (zA + zB) / 2], null, 0); // ridge cap
      for (const sg of [-1, 1])
        b.box(0.05, 0.16, zB - zA, trim, [sg * run, top - run * Math.tan(ang) - 0.06, (zA + zB) / 2], null, 0); // fascia
      // gables: the two ends in block, the dividers plain (they close the roof space between units)
      const tri = (dep, m, z) =>
        b.extrude(
          [
            [-D / 2 - 0.15, HU],
            [D / 2 + 0.15, HU],
            [0, HU + RISE + 0.15 * Math.tan(ang)]
          ],
          dep,
          m,
          [0, 0, z]
        );
      tri(0.36, blk, -L / 2);
      if (!r.noEnd1) tri(0.36, blk, L / 2);
      for (let i = 1; i < r.n; i++) tri(0.15, K.mat(0xdcdcd6, 0.9), -L / 2 + i * r.bw);
      b.pop();
    }

    /* ---------- chain-link fence with razor-wire coils; the gate (open, its leaf parked inside); the yard sign ---------- */
    const coil = (len, rad, y) => {
      const turns = Math.max(3, Math.round(len * 2.1)),
        np = turns * 8,
        pts = [];
      for (let k = 0; k <= np; k++) {
        const t = k / np,
          q = t * turns * PI * 2;
        pts.push([t * len, y + rad * Math.sin(q), rad * Math.cos(q)]);
      }
      b.tube(pts, 0.009, wire, np, 3);
    };
    // one run of fence from (x0, z0) to (x1, z1): panels of up to 2.5 m
    const fence = (x0, z0, x1, z1) => {
      const L = Math.hypot(x1 - x0, z1 - z0),
        n = Math.max(1, Math.ceil(L / 2.5)),
        pl = L / n,
        ang = -Math.atan2(z1 - z0, x1 - x0);
      b.push([x0, 0, z0], [0, ang, 0]);
      for (let i = 0; i < n; i++) {
        const u = i * pl;
        b.box(pl, FH - 0.08, 0.015, chain, [u + pl / 2, (FH - 0.08) / 2 + 0.04, 0], null, 0);
        b.cyl(0.022, 0.022, pl, galv, [u + pl / 2, FH, 0], [0, 0, PI / 2], 6); // top rail
        b.push([u, 0, 0]);
        coil(pl, 0.24, FH + 0.32);
        b.pop();
      }
      for (let i = 0; i <= n; i++) {
        const u = i * pl;
        b.cyl(0.04, 0.04, FH + 0.12, galv, [u, (FH + 0.12) / 2, 0], null, 8);
        b.box(0.04, 0.5, 0.04, galv, [u, FH + 0.3, 0.12], [0.55, 0, 0], 0); // barb arm, leaning out
        b.sph(0.05, galv, [u, FH + 0.13, 0], null, 6);
      }
      b.pop();
    };
    fence(-SX, FZ, GX0, FZ);
    fence(GX1, FZ, OX0 - 0.15, FZ);
    fence(-SX, BZ, -SX, FZ);
    fence(SX, BZ, SX, OZ0);
    fence(-SX, BZ, SX, BZ);
    // gate posts (heavy), a chain-link leaf rolled open behind the left run, on wheels
    for (const gx of [GX0, GX1]) {
      b.cyl(0.07, 0.07, FH + 0.5, galv, [gx, (FH + 0.5) / 2, FZ], null, 10);
      b.sph(0.08, galv, [gx, FH + 0.5, FZ], null, 8);
    }
    {
      const gz = FZ - 0.32,
        gx0 = GX0 - 4.5,
        gx1 = GX0 + 0.05,
        gw = gx1 - gx0;
      b.box(gw, FH - 0.2, 0.015, chain, [(gx0 + gx1) / 2, FH / 2 + 0.05, gz], null, 0);
      for (const y of [0.16, FH + 0.02]) b.cyl(0.035, 0.035, gw, galv, [(gx0 + gx1) / 2, y, gz], [0, 0, PI / 2], 8);
      for (const x of [gx0, gx0 + gw / 2, gx1]) b.cyl(0.035, 0.035, FH - 0.14, galv, [x, FH / 2 + 0.09, gz], null, 8);
      const dl = Math.hypot(gw / 2, FH - 0.2);
      b.cyl(0.022, 0.022, dl, galv, [gx0 + gw / 4, FH / 2 + 0.09, gz], [0, 0, Math.atan2(gw / 2, FH - 0.2)], 6); // brace
      for (const x of [gx0 + 0.3, gx1 - 0.3]) b.cyl(0.08, 0.08, 0.05, dark, [x, 0.08, gz], [PI / 2, 0, 0], 12); // wheels
      b.push([gx0, 0, gz]);
      coil(gw, 0.2, FH + 0.28);
      b.pop();
      S(gx0, gx1, gz - 0.05, gz + 0.05, 0, FH + 0.4, true);
    }
    // the yard sign on two posts in front of the left run
    b.label(4.0, 1.25, yardSign(), [-7.35, 1.75, FZ + 0.09]);
    b.box(4.1, 1.33, 0.04, fascia, [-7.35, 1.75, FZ + 0.065], null, 0);
    for (const sx of [-9.2, -5.5]) b.box(0.08, 2.5, 0.08, galv, [sx, 1.25, FZ + 0.03], null, 0);
    b.label(
      0.62,
      0.42,
      strap(
        'hyj_trespass',
        [
          ['NO TRESPASSING', 'bold 54px Arial, sans-serif'],
          ['VIOLATORS WILL BE STORED', 'bold 30px Arial, sans-serif']
        ],
        '#c8281e',
        '#ffffff'
      ),
      [-SX - 0.03, 1.5, -2.0],
      [0, -PI / 2, 0]
    );
    b.label(
      0.62,
      0.42,
      strap(
        'hyj_trespass',
        [
          ['NO TRESPASSING', 'bold 54px Arial, sans-serif'],
          ['VIOLATORS WILL BE STORED', 'bold 30px Arial, sans-serif']
        ],
        '#c8281e',
        '#ffffff'
      ),
      [SX + 0.03, 1.5, -4.0],
      [0, PI / 2, 0]
    );
    // gate: access keypad on a post just outside, a GATE CLOSES AT DUSK strap on the right post
    b.cyl(0.05, 0.05, 1.2, galv, [GX1 + 0.55, 0.6, FZ + 0.5], null, 8);
    rb(0.22, 0.3, 0.12, 0.02, K.mat(0x2a2c30, 0.4, 0.6), [GX1 + 0.55, 1.3, FZ + 0.5]);
    b.box(0.14, 0.1, 0.01, lit, [GX1 + 0.55, 1.36, FZ + 0.565], null, 0);
    b.label(
      0.5,
      0.24,
      strap(
        'hyj_gate',
        [
          ['GATE CLOSES AT DUSK', 'bold 40px Arial, sans-serif'],
          ['ONE WAY IN · ONE WAY OUT', 'bold 30px Arial, sans-serif']
        ],
        '#f4f2ea',
        NAVY
      ),
      [GX1, 1.55, FZ + 0.08]
    );
    S(GX1 + 0.4, GX1 + 0.7, FZ + 0.35, FZ + 0.65, 0, 1.5, true);

    /* ---------- the locker canopy along row B's back (the lockers are props, placed at build) ---------- */
    {
      const cx0 = 5.15,
        cx1 = 6.75,
        cz0 = -7.6,
        cz1 = 3.6,
        y0 = 2.85,
        y1 = 2.55,
        cl = Math.hypot(cx1 - cx0, y0 - y1),
        ca = Math.atan2(y0 - y1, cx1 - cx0);
      b.box(
        cl,
        0.02,
        cz1 - cz0,
        K.glass(0xe8a080, 0.4),
        [(cx0 + cx1) / 2, (y0 + y1) / 2, (cz0 + cz1) / 2],
        [0, 0, -ca],
        0
      );
      for (let z = cz0; z <= cz1 + 0.01; z += (cz1 - cz0) / 4) {
        b.box(cl, 0.06, 0.06, galv, [(cx0 + cx1) / 2, (y0 + y1) / 2 - 0.04, z], [0, 0, -ca], 0);
        b.cyl(0.04, 0.04, y1, galv, [cx1 - 0.05, y1 / 2, z], null, 8);
        S(cx1 - 0.1, cx1, z - 0.05, z + 0.05, 0, y1, true);
      }
      b.box(0.08, 0.08, cz1 - cz0, galv, [cx1 - 0.05, y1 - 0.05, (cz0 + cz1) / 2], null, 0);
      b.box(0.6, 0.12, cz1 - cz0 + 0.2, K.surf('concrete', 0x9a9890), [5.45, 0.06, (cz0 + cz1) / 2], null, 0); // locker plinth
      b.label(
        1.2,
        0.3,
        strap('hyj_lockers', [['LOCKERS  L1 - L16', 'bold 50px Arial, sans-serif']], NAVY, '#f4f2ea', 512, 128),
        [5.19, 2.4, (cz0 + cz1) / 2],
        [0, PI / 2, 0]
      );
    }

    /* ---------- the office: buff block skin, navy fascia + parapet, the HIDE YOUR JUNK board, barred windows, door hood ---------- */
    const FB = 2.95; // fascia band starts
    skinOps(1, OZ1, OX0 - 0.15, OX1 + 0.15, 1, OFRONT, FB, oblk);
    skinOps(0, OX0, OZ0 - 0.15, OZ1 + 0.15, -1, OLEFT, FB, oblk);
    skinOps(1, OZ0, 5.15, OX1 + 0.15, -1, OBACK, FB, oblk);
    skinOps(0, OX1, OZ0 - 0.15, OZ1 + 0.15, 1, [], FB, oblk);
    const PH = HO + 0.6;
    wbox(1, OZ1, 1, 0.175, OX0 - 0.17, OX1 + 0.17, FB, PH, fascia, 0.05);
    wbox(0, OX0, -1, 0.175, OZ0 - 0.15, OZ1 + 0.17, FB, PH, fascia, 0.05);
    wbox(0, OX1, 1, 0.175, OZ0 - 0.15, OZ1 + 0.17, FB, PH, fascia, 0.05);
    wbox(1, OZ0, -1, 0.175, OX0 - 0.17, OX1 + 0.17, FB, PH, fascia, 0.05);
    for (const [ax, f, a0, a1] of [
      [1, OZ1, OX0 - 0.2, OX1 + 0.2],
      [1, OZ0, OX0 - 0.2, OX1 + 0.2],
      [0, OX0, OZ0, OZ1],
      [0, OX1, OZ0, OZ1]
    ]) {
      wbox(ax, f, 1, 0, a0, a1, HO, PH, fascia, 0.3); // parapet
      wbox(ax, f, 1, 0, a0 - 0.05, a1 + 0.05, PH, PH + 0.06, cop, 0.42);
    }
    b.box(
      OX1 - OX0,
      0.1,
      OZ1 - OZ0,
      K.surf('concrete', 0x6a6a66),
      [(OX0 + OX1) / 2, HO + 0.05, (OZ0 + OZ1) / 2],
      null,
      0
    );
    rb(1.4, 0.8, 1.0, 0.03, K.mat(0xb0b4b8, 0.4, 0.7), [7.6, HO + 0.5, 10.4]); // AC unit
    b.vents(5, 1.2, 0.5, K.mat(0x6a6c6e, 0.5, 0.6), [7.6, HO + 0.5, 10.91]);
    b.label(5.6, 1.1, officeSign(), [(OX0 + OX1) / 2, 3.45, OZ1 + 0.215]);
    // windows: frames, sills, security bars (bars block the street windows and the lane window)
    const winFrame = (ax, f, n, c) => {
      const o = f + n * 0.2;
      if (ax) {
        b.frame(1.56, 1.9, 0.07, dark, [c, 1.825, o], 0.06);
        b.box(1.62, 0.06, 0.16, cop, [c, 0.88, f + n * 0.24], null, 0);
      } else {
        b.push([o, 1.825, c], [0, PI / 2, 0]);
        b.frame(1.56, 1.9, 0.07, dark, [0, 0, 0], 0.06);
        b.pop();
        b.box(0.16, 0.06, 1.62, cop, [f + n * 0.24, 0.88, c], null, 0);
      }
      const bo = f + n * 0.3;
      for (let k = 0; k < 8; k++) {
        const u = c - 0.7 + k * 0.2;
        if (ax) b.cyl(0.014, 0.014, 1.95, galv, [u, 1.83, bo], null, 6);
        else b.cyl(0.014, 0.014, 1.95, galv, [bo, 1.83, u], null, 6);
      }
      for (const y of [0.95, 2.7]) wbox(ax, f, n, 0.3, c - 0.8, c + 0.8, y - 0.02, y + 0.02, galv, 0.04);
      if (ax) S(c - 0.8, c + 0.8, Math.min(f, bo) - 0.02, Math.max(f, bo) + 0.02, 0.8, 2.8, true);
      else S(Math.min(f, bo) - 0.02, Math.max(f, bo) + 0.02, c - 0.8, c + 0.8, 0.8, 2.8, true);
    };
    for (const w of OFRONT) winFrame(1, OZ1, 1, w.c);
    winFrame(0, OX0, -1, 10.3);
    // door hood + OFFICE plate + wall lamp over the lane door; a CCTV camera on the corner
    b.box(0.7, 0.08, 1.8, fascia, [OX0 - 0.5, 2.62, 12.9], null, 0);
    for (const s of [-1, 1]) b.box(0.6, 0.04, 0.04, galv, [OX0 - 0.45, 2.45, 12.9 + s * 0.8], [0, 0, 0.5], 0);
    b.label(
      1.0,
      0.28,
      strap('hyj_offplate', [['OFFICE', 'bold 70px Arial, sans-serif']], NAVY, '#f4f2ea', 512, 140),
      [OX0 - 0.19, 2.85, 12.9],
      [0, -PI / 2, 0]
    );
    for (const [lx, lz, ry] of [
      [OX0 - 0.2, 11.8, -PI / 2],
      [-5.4 + 0.2, 13.0, PI / 2],
      [-5.4 + 0.2, -9.6, PI / 2],
      [0.6 - 0.2, -9.6, -PI / 2]
    ]) {
      b.push([lx, 2.75, lz], [0, ry, 0]);
      rb(0.24, 0.16, 0.12, 0.02, dark, [0, 0, 0.04]);
      b.box(0.18, 0.08, 0.01, lit, [0, -0.02, 0.105], null, 0);
      b.pop();
    }
    b.push([OX0 - 0.25, 3.1, OZ1 - 0.1], [0, -PI * 0.75, 0]);
    rb(0.12, 0.12, 0.3, 0.02, K.mat(0xe8e8e4, 0.4), [0, 0, 0.1], [0.3, 0, 0]);
    b.cyl(0.03, 0.03, 0.15, dark, [0, 0.08, -0.05], null, 8);
    b.pop();

    /* ---------- units inside: galvanised sheet under the roof, a bare bulb, scuffs on the slab ---------- */
    const bulbM = K.mat(0xfff4d8, 0.4, 0, {emissive: 0xffe8b0, emissiveIntensity: 0.55}),
      cord = K.mat(0x1a1a1a, 0.6);
    for (const r of ROWS) {
      const xc = (r.f + r.bk) / 2,
        zc = (r.a0 + r.a1) / 2,
        L = r.a1 - r.a0,
        ang = Math.atan2(RISE, r.D / 2),
        ln = (r.D / 2 - 0.15) / Math.cos(ang);
      if (r.ax) b.push([zc, 0, xc], [0, PI / 2, 0]);
      else b.push([xc, 0, zc]);
      for (const sg of [-1, 1])
        b.box(
          ln,
          0.02,
          L - 0.3,
          galv,
          [(sg * (r.D / 2 - 0.15)) / 2, HU + RISE / 2 + 0.05 - 0.075 * RISE, 0],
          [0, 0, -sg * ang],
          0
        );
      for (let i = 0; i < r.n; i++) {
        const z = -L / 2 + (i + 0.5) * r.bw;
        b.cyl(0.006, 0.006, 0.7, cord, [0, HU + RISE - 0.4, z], null, 4);
        b.cyl(0.03, 0.04, 0.08, dark, [0, HU + RISE - 0.78, z], null, 8);
        b.sph(0.05, bulbM, [0, HU + RISE - 0.85, z], null, 8);
      }
      b.pop();
    }
    for (const U of UNITS)
      for (let k = 0; k < 2; k++) {
        const [px, pz] = toLot(U, (b.rnd() - 0.5) * 2.4, 0.6 + b.rnd() * 2.6);
        b.box(
          0.5 + b.rnd() * 0.9,
          0.004,
          0.3 + b.rnd() * 0.6,
          K.mat(0x4a4844, 0.95),
          [px, 0.047, pz],
          [0, b.rnd() * PI, 0],
          0
        );
      }

    /* ---------- office inside: blue carpet, cream walls over a navy dado, drop ceiling with troffers; tiled toilet ---------- */
    const carpet = K.surf('carpet', 0x34487a),
      cream = K.mat(0xe8e2d0, 0.9),
      navyW = K.mat(0x2a3656, 0.8),
      railM = K.mat(0x8a6a44, 0.6),
      tileW = K.mat(0xe8eef0, 0.35),
      ceilM = K.mat(0xeeeeea, 0.95);
    b.box(WCX - OX0 - 0.15, 0.02, OZ1 - OZ0 - 0.3, carpet, [(OX0 + WCX) / 2, 0.055, (OZ0 + OZ1) / 2], null, 0);
    b.box(OX1 - WCX - 0.15, 0.02, OZ1 - WCZ - 0.2, carpet, [(WCX + OX1) / 2, 0.055, (WCZ + OZ1) / 2], null, 0);
    b.box(
      OX1 - WCX - 0.2,
      0.02,
      WCZ - OZ0 - 0.2,
      K.mat(0xd8dcdc, 0.4),
      [(WCX + OX1) / 2, 0.055, (OZ0 + WCZ) / 2],
      null,
      0
    );
    // main room lining (off = -0.09 on the thin partitions so it sits on their face)
    const offSpan = off => (pc, u0, u1, y0, y1) => {
      if (y0 < 0.9) {
        pc(u0, u1, y0, Math.min(y1, 0.9), navyW, 0.02, off);
        if (y1 > 0.9) pc(u0, u1, 0.88, 0.94, railM, 0.04, off + 0.01);
      }
      if (y1 > 0.94) pc(u0, u1, Math.max(y0, 0.94), Math.min(y1, OCEIL), cream, 0.02, off);
    };
    const wcSpan = off => (pc, u0, u1, y0, y1) => pc(u0, u1, y0, Math.min(y1, OCEIL), tileW, 0.02, off);
    LK.lineWall(b, 1, OZ1, OX0, OX1, -1, OFRONT, OCEIL, offSpan(0));
    LK.lineWall(b, 0, OX0, OZ0, OZ1, 1, OLEFT, OCEIL, offSpan(0));
    LK.lineWall(b, 1, OZ0, OX0, WCX, 1, OBACK, OCEIL, offSpan(0));
    LK.lineWall(b, 0, OX1, WCZ, OZ1, -1, [], OCEIL, offSpan(0));
    LK.lineWall(b, 0, WCX, OZ0, WCZ, -1, OWC, OCEIL, offSpan(-0.09));
    LK.lineWall(b, 1, WCZ, WCX, OX1, 1, [], OCEIL, offSpan(-0.09));
    LK.lineWall(b, 0, WCX, OZ0, WCZ, 1, OWC, OCEIL, wcSpan(-0.09));
    LK.lineWall(b, 1, WCZ, WCX, OX1, -1, [], OCEIL, wcSpan(-0.09));
    LK.lineWall(b, 0, OX1, OZ0, WCZ, -1, [], OCEIL, wcSpan(0));
    LK.lineWall(b, 1, OZ0, WCX, OX1, 1, [], OCEIL, wcSpan(0));
    // drop ceiling: tiles with a grid, two troffers in the office, one light in the toilet
    b.box(OX1 - OX0 - 0.3, 0.03, OZ1 - OZ0 - 0.3, ceilM, [(OX0 + OX1) / 2, OCEIL + 0.015, (OZ0 + OZ1) / 2], null, 0);
    for (let x = OX0 + 0.75; x < OX1 - 0.2; x += 0.6)
      b.box(0.025, 0.012, OZ1 - OZ0 - 0.3, cop, [x, OCEIL - 0.005, (OZ0 + OZ1) / 2], null, 0);
    for (let z = OZ0 + 0.75; z < OZ1 - 0.2; z += 0.6)
      b.box(OX1 - OX0 - 0.3, 0.012, 0.025, cop, [(OX0 + OX1) / 2, OCEIL - 0.006, z], null, 0);
    for (const [lx, lz, w] of [
      [2.4, 11.8, 1.2],
      [5.4, 11.8, 1.2],
      [8.5, 9.75, 0.6]
    ])
      b.box(w, 0.03, 0.6, lit, [lx, OCEIL - 0.02, lz], null, 0);

    /* ---------- office: customer counter with the till, desk + CCTV, filing cabinets, sofa under the eye picture, key cabinet ---------- */
    const lam = K.mat(0x7a5a3a, 0.5),
      lamTop = K.mat(0xd8d0bc, 0.45),
      steel = K.mat(0xb8bcc0, 0.4, 0.6);
    // the counter runs along x = 2.9 from the back wall to z 13.2 (the staff gap is by the front wall)
    {
      const cx = 2.9,
        z0 = OZ0 + 0.2,
        z1 = 13.2;
      b.box(0.55, 1.0, z1 - z0, lam, [cx, 0.5, (z0 + z1) / 2], null, 0);
      b.box(0.7, 0.05, z1 - z0 + 0.06, lamTop, [cx - 0.05, 1.03, (z0 + z1) / 2], null, 0);
      b.box(0.02, 0.85, z1 - z0 - 0.1, navyW, [cx - 0.285, 0.5, (z0 + z1) / 2], null, 0);
      S(cx - 0.4, cx + 0.3, z0, z1, 0, 1.06);
      // a bell, a stack of rental forms, a pen pot; a rack of padlocks for sale on the customer side
      b.cyl(0.05, 0.06, 0.05, K.mat(0xc8c8c4, 0.25, 0.9), [cx - 0.2, 1.08, 10.6], null, 12);
      b.box(0.22, 0.03, 0.3, K.mat(0xf2f2ec, 0.9), [cx - 0.1, 1.07, 11.2], [0, 0.2, 0], 0);
      b.cyl(0.035, 0.035, 0.1, dark, [cx - 0.05, 1.1, 11.6], null, 8);
      b.box(0.04, 1.2, 0.8, K.mat(0x3a3c40, 0.6), [OX0 + 0.2, 1.4, 9.15], null, 0);
      for (let k = 0; k < 12; k++) {
        const pz = 8.85 + (k % 4) * 0.2,
          py = 1.0 + Math.floor(k / 4) * 0.3;
        rb(0.05, 0.07, 0.06, 0.01, K.mat(k % 3 ? 0xc8a040 : 0xb8bcc0, 0.3, 0.8), [OX0 + 0.26, py, pz]);
      }
    }
    // filing cabinets along the back wall (staff side)
    for (const fx of [3.6, 4.15, 4.7]) {
      rb(0.5, 1.32, 0.6, 0.01, steel, [fx, 0.66, OZ0 + 0.47]);
      for (let k = 0; k < 4; k++) {
        b.box(0.44, 0.28, 0.01, K.mat(0xc8ccd0, 0.35, 0.6), [fx, 0.2 + k * 0.31, OZ0 + 0.775], null, 0);
        b.box(0.12, 0.02, 0.03, dark, [fx, 0.28 + k * 0.31, OZ0 + 0.79], null, 0);
      }
    }
    S(3.33, 4.97, OZ0 + 0.15, OZ0 + 0.8, 0, 1.32);
    // CCTV: a wall shelf of monitors over the desk spot (front wall, right of the window)
    b.box(1.3, 0.04, 0.35, lam, [4.6, 1.9, OZ1 - 0.35], null, 0);
    for (const [mx, my] of [
      [4.25, 2.1],
      [4.95, 2.1],
      [4.6, 2.48]
    ]) {
      rb(0.5, 0.36, 0.3, 0.02, K.blackPlastic(), [mx, my, OZ1 - 0.36]);
      b.box(
        0.42,
        0.28,
        0.01,
        K.mat(0x8aa08a, 0.3, 0, {emissive: 0x4a6a5a, emissiveIntensity: 0.6}),
        [mx, my, OZ1 - 0.205],
        null,
        0
      );
    }
    // sofa along the right wall, the all-seeing-eye picture over it
    {
      const sx = OX1 - 0.6,
        sz = 12.6;
      const fab = K.mat(0x7a8486, 0.95),
        base = K.veneer(0xb8884a);
      b.push([sx, 0, sz], [0, -PI / 2, 0]);
      b.box(2.2, 0.16, 0.9, base, [0, 0.12, 0], null, 0);
      for (let k = 0; k < 3; k++) rb(0.68, 0.18, 0.66, 0.06, fab, [(k - 1) * 0.7, 0.3, 0.08], null, 2);
      rb(2.1, 0.5, 0.24, 0.08, fab, [0, 0.55, -0.34], null, 2);
      for (const s of [-1, 1]) rb(0.22, 0.38, 0.9, 0.06, fab, [s * 1.03, 0.36, 0], null, 2);
      b.pop();
      S(sx - 0.45, sx + 0.45, sz - 1.15, sz + 1.15, 0, 0.85);
      b.box(0.04, 0.72, 0.9, K.mat(0x8a5a2a, 0.5), [OX1 - 0.17, 1.95, sz], null, 0);
      b.label(
        0.78,
        0.6,
        K.paint('hyj_eye', 256, 200, (c, W, H) => {
          const g = c.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W * 0.6);
          g.addColorStop(0, '#9aa6d0');
          g.addColorStop(1, '#1a2040');
          c.fillStyle = g;
          c.fillRect(0, 0, W, H);
          c.strokeStyle = '#f0f0f8';
          c.lineWidth = 6;
          c.beginPath();
          c.moveTo(W / 2, 24);
          c.lineTo(W / 2 + 84, H - 30);
          c.lineTo(W / 2 - 84, H - 30);
          c.closePath();
          c.stroke();
          c.fillStyle = '#f0f0f8';
          c.beginPath();
          c.ellipse(W / 2, 108, 30, 16, 0, 0, PI * 2);
          c.fill();
          c.fillStyle = '#2a2e48';
          c.beginPath();
          c.arc(W / 2, 108, 11, 0, PI * 2);
          c.fill();
          for (let k = 0; k < 18; k++) {
            const a = (k / 18) * PI * 2;
            c.strokeStyle = 'rgba(240,240,255,.35)';
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(W / 2 + Math.cos(a) * 40, 108 + Math.sin(a) * 26);
            c.lineTo(W / 2 + Math.cos(a) * 70, 108 + Math.sin(a) * 50);
            c.stroke();
          }
        }),
        [OX1 - 0.195, 1.95, sz],
        [0, -PI / 2, 0]
      );
    }
    // the unit key cabinet on the toilet wall: a steel box with rows of tagged keys
    {
      const kz = WCZ + 0.1;
      rb(0.9, 0.7, 0.08, 0.01, steel, [8.6, 1.65, kz]);
      for (let k = 0; k < 20; k++) {
        const kx = 8.25 + (k % 5) * 0.18,
          ky = 1.88 - Math.floor(k / 5) * 0.16;
        if (k === 7 || k === 13) continue; // keys out
        b.cyl(0.005, 0.005, 0.02, galv, [kx, ky, kz + 0.05], [PI / 2, 0, 0], 4);
        b.box(0.03, 0.06, 0.005, K.mat(k % 2 ? 0xd8701e : 0xc8a040, 0.4, 0.6), [kx, ky - 0.05, kz + 0.06], null, 0);
      }
    }
    // water cooler, a coffee table with a machine, a plant by the door, the price and rules boards
    b.cyl(0.16, 0.16, 0.95, K.mat(0xe8e8e4, 0.4), [5.2, 0.48, OZ0 + 0.4], null, 14);
    b.cyl(0.14, 0.14, 0.4, K.glass(0x8ac0e8, 0.6), [5.2, 1.15, OZ0 + 0.4], null, 14);
    S(5.0, 5.4, OZ0 + 0.2, OZ0 + 0.6, 0, 1.3, true);
    // v089: the coffee table moved off the toilet door to beside the water cooler
    b.box(0.44, 0.75, 0.5, lam, [4.5, 0.38, OZ0 + 0.45], null, 0);
    rb(0.25, 0.32, 0.22, 0.02, K.blackPlastic(), [4.5, 0.92, OZ0 + 0.45]);
    S(4.28, 4.72, OZ0 + 0.2, OZ0 + 0.7, 0, 0.8, true);
    b.cyl(0.18, 0.14, 0.35, K.mat(0x8a5a3a, 0.7), [OX0 + 0.45, 0.2, 13.9], null, 12);
    b.sph(0.38, K.mat(0x3a6a2a, 0.9), [OX0 + 0.45, 0.7, 13.9], [1, 1.3, 1], 10);
    b.label(
      1.2,
      0.9,
      strap(
        'hyj_prices',
        [
          ['UNIT RATES', 'bold 46px Arial, sans-serif'],
          ['5x5  LOCKER .......... $29', '28px monospace'],
          ['10x10  UNIT .......... $89', '28px monospace'],
          ['10x15  UNIT ......... $119', '28px monospace'],
          ['BOLT CUTTER FEE ..... $45', '28px monospace']
        ],
        '#f4f2ea',
        NAVY,
        512,
        384
      ),
      [1.45, 1.75, OZ1 - 0.19],
      [0, PI, 0]
    );
    b.label(
      1.1,
      0.9,
      strap(
        'hyj_rules',
        [
          ['YARD RULES', 'bold 46px Arial, sans-serif'],
          ['NO LIVING IN UNITS', 'bold 28px Arial, sans-serif'],
          ['NO UNDEAD EITHER', 'bold 28px Arial, sans-serif'],
          ['NO FLAMMABLES  ·  NO PETS', '24px Arial, sans-serif'],
          ['WHAT YOU STORE IS YOUR PROBLEM', '20px Arial, sans-serif']
        ],
        '#f4f2ea',
        '#a8261a',
        512,
        420
      ),
      [1.7, 1.75, OZ0 + 0.19]
    );
    // the staff toilet: WC, basin, mirror
    {
      const wm = K.mat(0xf4f4f0, 0.25);
      rb(0.4, 0.4, 0.55, 0.08, wm, [OX1 - 0.5, 0.2, 9.2]);
      rb(0.42, 0.42, 0.18, 0.04, wm, [OX1 - 0.25, 0.65, 9.2]);
      b.cyl(0.2, 0.2, 0.04, K.mat(0x2a2a2a, 0.4), [OX1 - 0.55, 0.43, 9.2], null, 14);
      S(OX1 - 0.8, OX1 - 0.15, 8.95, 9.45, 0, 0.8, true);
      rb(0.5, 0.18, 0.4, 0.05, wm, [8.5, 0.82, OZ0 + 0.38]);
      b.cyl(0.04, 0.05, 0.75, wm, [8.5, 0.37, OZ0 + 0.3], null, 10);
      b.box(0.5, 0.65, 0.02, K.chrome(), [8.5, 1.55, OZ0 + 0.17], null, 0);
    }

    /* ---------- unit clutter: every unit is packed with junk along the back and down the left side; the right side and the middle
       stay clear (that's where the few units worth looting get their containers at build). Same junk every visit, varied per unit. ---------- */
    const rnd = b.rnd,
      card = [K.mat(0xa8804e, 0.9), K.mat(0x8e6a3e, 0.9), K.mat(0xb89466, 0.9)],
      tape = K.mat(0xc8b48a, 0.6),
      totes = [K.mat(0x2a5aa8, 0.5), K.mat(0x5a5e62, 0.5), K.mat(0x3a7a4a, 0.5)],
      lidM = K.mat(0x1e2a44, 0.5),
      sheet = K.mat(0xd8d4c8, 0.95),
      matt = K.mat(0xe0dcc8, 0.9),
      rubber = K.rubber(),
      chairM = K.mat(0xe8e6e0, 0.5),
      whiteG = K.mat(0xe8e8e2, 0.4, 0.1),
      rugM = [K.mat(0x8a2a2a, 0.95), K.mat(0x3a4a6a, 0.95)];
    // each maker builds at the current frame position (x, z) and returns its footprint along the wall it stands on
    const MAKERS = {
      boxes(x, z) {
        let y = 0;
        const n = 1 + Math.floor(rnd() * 3);
        for (let k = 0; k < n; k++) {
          const w = 0.45 + rnd() * 0.35,
            h = 0.3 + rnd() * 0.25,
            d = 0.4 + rnd() * 0.25;
          b.box(
            w,
            h,
            d,
            card[Math.floor(rnd() * 3)],
            [x + (rnd() - 0.5) * 0.08, y + h / 2 + 0.04, z],
            [0, (rnd() - 0.5) * 0.3, 0],
            0
          );
          b.box(w * 0.98, 0.005, 0.06, tape, [x, y + h + 0.045, z], null, 0);
          y += h;
        }
        return [0.8, 0.7, y];
      },
      totes(x, z) {
        const m = totes[Math.floor(rnd() * 3)],
          n = 2 + Math.floor(rnd() * 3);
        for (let k = 0; k < n; k++) {
          rb(0.6, 0.3, 0.42, 0.03, m, [x, 0.19 + k * 0.32, z]);
          b.box(0.64, 0.03, 0.46, lidM, [x, 0.355 + k * 0.32, z], null, 0);
        }
        return [0.7, 0.5, 0.04 + n * 0.32];
      },
      covered(x, z) {
        const w = 1.0 + rnd() * 0.5,
          h = 0.7 + rnd() * 0.6;
        rb(w, h, 0.7, 0.12, sheet, [x, h / 2 + 0.04, z]);
        rb(w + 0.06, 0.08, 0.76, 0.03, sheet, [x, 0.08, z]); // the hem
        return [w + 0.1, 0.8, h];
      },
      mattress(x, z) {
        rb(1.35, 1.9, 0.22, 0.08, matt, [x, 0.98, z + 0.15], [-0.12, 0, 0]);
        for (let k = 0; k < 4; k++)
          b.box(0.006, 1.7, 0.01, K.mat(0xc8c0a8, 0.9), [x - 0.5 + k * 0.33, 0.98, z + 0.03], [-0.12, 0, 0], 0);
        return [1.45, 0.45, 1.9];
      },
      tyres(x, z) {
        const n = 3 + Math.floor(rnd() * 2);
        for (let k = 0; k < n; k++) b.tor(0.27, 0.1, rubber, [x, 0.14 + k * 0.2, z], [PI / 2, 0, rnd()], null, 14);
        return [0.8, 0.8, 0.1 + n * 0.2];
      },
      bike(x, z) {
        b.push([x, 0, z], [0, PI / 2, 0]);
        for (const s of [-0.5, 0.5]) b.tor(0.32, 0.02, rubber, [s, 0.34, 0], null, null, 16);
        const fr = K.mat(rnd() < 0.5 ? 0xb82a22 : 0x2a5aa8, 0.4, 0.4);
        b.tube(
          [
            [-0.5, 0.34, 0],
            [-0.08, 0.36, 0],
            [0.36, 0.72, 0],
            [0.5, 0.34, 0]
          ],
          0.02,
          fr,
          10,
          5
        );
        b.cyl(0.018, 0.018, 0.5, fr, [-0.14, 0.56, 0], [0, 0, 0.35], 5);
        b.box(0.22, 0.05, 0.08, dark, [-0.22, 0.82, 0], null, 0);
        b.cyl(0.012, 0.012, 0.42, steel, [0.36, 0.82, 0], [PI / 2, 0, 0], 5);
        b.pop();
        return [0.4, 1.3, 0.9];
      },
      chairs(x, z) {
        const n = 3 + Math.floor(rnd() * 3);
        for (let k = 0; k < n; k++) {
          const y = k * 0.09;
          b.box(0.44, 0.03, 0.42, chairM, [x, 0.45 + y, z], null, 0);
          b.box(0.44, 0.4, 0.03, chairM, [x, 0.7 + y, z - 0.2], [-0.12, 0, 0], 0);
        }
        for (const sx of [-0.2, 0.2])
          for (const sz of [-0.18, 0.18]) b.cyl(0.012, 0.012, 0.45, chairM, [x + sx, 0.225, z + sz], null, 5);
        return [0.6, 0.55, 0.9 + n * 0.09];
      },
      fridge(x, z) {
        rb(0.7, 1.6, 0.66, 0.04, whiteG, [x, 0.84, z]);
        b.box(0.02, 0.4, 0.04, steel, [x + 0.28, 1.2, z + 0.34], null, 0);
        b.box(0.66, 0.01, 0.01, dark, [x, 1.0, z + 0.335], null, 0);
        return [0.8, 0.75, 1.6];
      },
      lamp(x, z) {
        b.cyl(0.14, 0.16, 0.03, dark, [x, 0.06, z], null, 10);
        b.cyl(0.015, 0.015, 1.4, steel, [x, 0.75, z], null, 5);
        b.cyl(0.12, 0.22, 0.26, K.mat(0xd8c8a0, 0.9), [x, 1.5, z], null, 12, true);
        return [0.5, 0.5, 1.6];
      },
      rug(x, z) {
        b.cyl(0.13, 0.13, 1.6, rugM[Math.floor(rnd() * 2)], [x, 0.17, z], [0, 0, PI / 2], 10);
        return [1.7, 0.3, 0.3];
      }
    };
    // nominal width along the wall (makers stay inside it); which ones go along the back, which down the side
    const WID = {
        boxes: 0.8,
        totes: 0.7,
        covered: 1.6,
        mattress: 1.45,
        tyres: 0.8,
        chairs: 0.6,
        fridge: 0.8,
        lamp: 0.5,
        rug: 1.7
      },
      BACK = ['boxes', 'boxes', 'totes', 'covered', 'mattress', 'tyres', 'chairs', 'fridge', 'lamp', 'rug'],
      SIDE = ['boxes', 'boxes', 'totes', 'tyres', 'chairs', 'fridge', 'lamp', 'bike'];
    for (const U of UNITS) {
      const W = U.w - 0.25,
        [ox, oz] = uOrg(U),
        th = uTh(U);
      b.push([ox, 0, oz], [0, th, 0]);
      // collision for a local box (u0..u1, v0..v1)
      const ucol = (u0, u1, v0, v1, y1) => {
        const A = toLot(U, u0, v0),
          C = toLot(U, u1, v1);
        S(Math.min(A[0], C[0]), Math.max(A[0], C[0]), Math.min(A[1], C[1]), Math.max(A[1], C[1]), 0, y1, true);
      };
      // along the back wall, packed side by side, each turned to face the door
      let u = -W / 2 + 0.05;
      for (let tries = 0; tries < 12 && u < W / 2 - 0.5; tries++) {
        const k = BACK[Math.floor(rnd() * BACK.length)],
          w = WID[k];
        if (u + w > W / 2 - 0.02) continue;
        const cu = u + w / 2,
          v = UIN + 0.15 - 0.5;
        b.push([cu, 0, v], [0, PI, 0]);
        const fp = MAKERS[k](0, 0);
        b.pop();
        ucol(cu - w / 2, cu + w / 2, v - fp[1] / 2, v + fp[1] / 2, Math.max(0.3, fp[2]));
        u += w + 0.05;
      }
      // a loose pile in front of the back row (left of centre, clear of the loot spots on the right and in the middle)
      {
        for (let j = 0; j < 1; j++) {
          const cu = -W / 2 + 1.1 + rnd() * 0.25,
            v = UIN + 0.15 - 1.25 - rnd() * 0.1,
            k = rnd() < 0.7 ? 'boxes' : 'totes';
          b.push([cu, 0, v], [0, PI + (rnd() - 0.5) * 0.6, 0]);
          const fp = MAKERS[k](0, 0);
          b.pop();
          ucol(cu - 0.35, cu + 0.35, v - 0.3, v + 0.3, Math.max(0.3, fp[2]));
        }
      }
      // down the left side wall: one or two things, turned to face across the unit
      const nL = 1 + Math.floor(rnd() * 2);
      for (let j = 0; j < nL; j++) {
        const k = SIDE[Math.floor(rnd() * SIDE.length)],
          v = 0.95 + j * 1.15,
          uu = -W / 2 + 0.42;
        b.push([uu, 0, v], [0, PI / 2, 0]);
        const fp = MAKERS[k](0, 0);
        b.pop();
        ucol(
          uu - fp[1] / 2,
          uu + fp[1] / 2,
          v - Math.min(0.5, fp[0] / 2),
          v + Math.min(0.5, fp[0] / 2),
          Math.max(0.3, fp[2])
        );
      }
      b.pop();
    }

    /* ---------- yard dressing: moving boxes and a hand truck by the van (the van is placed at build), bin bags, a dumped mattress ---------- */
    for (const [bx, bz, a] of [
      [-0.9, 1.4, 0.2],
      [-0.6, 0.6, -0.3],
      [-0.85, 2.2, 0.1]
    ]) {
      b.push([bx, 0, bz], [0, a, 0]);
      const fp = MAKERS.boxes(0, 0);
      b.pop();
      S(bx - 0.35, bx + 0.35, bz - 0.35, bz + 0.35, 0, fp[2], true);
    }
    b.push([-1.3, 0, -0.2], [0, 0.4, 0]);
    b.box(0.42, 0.03, 0.22, steel, [0, 0.03, 0.1], null, 0);
    for (const s of [-0.18, 0.18]) {
      b.cyl(0.015, 0.015, 1.2, K.mat(0xc82a22, 0.5, 0.3), [s, 0.62, 0], [0.08, 0, 0], 6);
      b.cyl(0.1, 0.1, 0.05, rubber, [s + Math.sign(s) * 0.05, 0.1, -0.05], [0, 0, PI / 2], 10);
    }
    b.pop();
    for (const [gx, gz] of [
      [8.9, 6.2],
      [9.2, 5.6],
      [-8.9, 14.2]
    ])
      b.sph(0.32, K.mat(0x1a1a1c, 0.35), [gx, 0.28, gz], [1, 0.85, 1], 8);
    b.push([4.3, 0, -11.6], [0, 0.3, 0]);
    rb(1.35, 0.22, 1.9, 0.08, matt, [0, 0.12, 0], [0, 0, 0.05]);
    b.pop();
    S(3.5, 5.1, -12.6, -10.6, 0, 0.25, true);

    /* ---------- sidewalk: street lights, meter, hydrant, no parking ---------- */
    LK.lightPole(b, S, -7.5);
    LK.lightPole(b, S, 6.5);
    LK.hydrant(b, S, 3.2);
    LK.meter(b, S, 8.6);
    LK.noParking(b, -1.6, {key: 'hyj_np1'});

    return (CACHE = G.done());
  }

  /* ===================== the lot ===================== */
  function bHideYourJunk(x, z, t) {
    const B = mk(x, z, 20, 36, HU, 0xdcdcd6, 0x8a8884, 0x5a4a3a);
    B.dx = 0;
    const cp = a => a.map(o => Object.assign({}, o));
    const PT = {th: 0.15};
    // storage rows: door wall in runs between the roller doors, back wall, end walls, unit dividers
    for (const r of ROWS) {
      const lo = Math.min(r.f, r.bk),
        hi = Math.max(r.f, r.bk);
      let a = r.a0;
      for (let i = 0; i < r.n; i++) {
        const c = r.a0 + (i + 0.5) * r.bw;
        WL(B, r.ax, r.f, a, c - DW / 2, [], HU);
        a = c + DW / 2;
      }
      WL(B, r.ax, r.f, a, r.a1, [], HU);
      WL(B, r.ax, r.bk, r.a0, r.a1, [], HU);
      WL(B, 1 - r.ax, r.a0, lo, hi, [], HU);
      if (!r.noEnd1) WL(B, 1 - r.ax, r.a1, lo, hi, [], HU);
      for (let i = 1; i < r.n; i++) WL(B, 1 - r.ax, r.a0 + i * r.bw, lo + 0.15, hi - 0.15, [], HU, PT);
    }
    // the office
    WL(B, 1, OZ1, OX0, OX1, cp(OFRONT), HO);
    WL(B, 1, OZ0, OX0, OX1, cp(OBACK), HO);
    WL(B, 0, OX0, OZ0, OZ1, cp(OLEFT), HO);
    WL(B, 0, OX1, OZ0, OZ1, [], HO);
    WL(B, 0, WCX, OZ0, WCZ, cp(OWC), HO, {th: 0.12});
    WL(B, 1, WCZ, WCX, OX1, [], HO, {th: 0.12});
    LK.attach(B, build());
    // roller doors: all locked; one to three (at random) stand open, unlocked
    const doors0 = [];
    for (const U of UNITS) {
      const inn = U.r.ax ? U.s : -U.s;
      doors0.push(mkRollDoor(B, U.r.ax, U.r.f, U.c, DW - 0.08, DH, {inn, mat: doorMat()}));
    }
    const order = UNITS.map((u, i) => i).sort(() => Math.random() - 0.5),
      nOpen = Math.random() < 0.25 ? 1 : Math.random() < 0.75 ? 2 : 3;
    for (let k = 0; k < nOpen; k++) {
      const d = doors0[order[k]];
      d.locked = false;
      d.hp = d.hp0 = 90;
      try {
        doorOpen(d, undefined, undefined, true);
      } catch (e) {}
    }
    // lootable props (this spawner hands back the container, so a locker can be locked)
    const ry = a => (B.cs > 0 ? a : a + PI);
    const SP = (lx, lz, name, table, a, y0) => {
      try {
        if (window.spawnPropContainer) return spawnPropContainer(WX(B, lx), WZ(B, lz), name, table, ry(a), y0 || 0);
        cont(B, table, lx, lz);
      } catch (e) {}
      return null;
    };
    // the locker bank under the canopy: small junk, most of them locked
    for (let k = 0; k < 16; k++) {
      const c = SP(5.47, -7.2 + k * 0.65, 'hyj_locker', 'hyj_junk', PI / 2, 0.12);
      if (c && typeof c === 'object' && Math.random() < 0.7) c.locked = true;
    }
    // the two or three units worth looting this visit, each with its own theme; the rest is just junk
    {
      const pool = UNITS.slice().sort(() => Math.random() - 0.5),
        themes = THEMES.slice().sort(() => Math.random() - 0.5),
        n = Math.random() < 0.35 ? 3 : 2;
      for (let k = 0; k < n; k++) {
        const U = pool[k],
          th = themes[k],
          W = U.w - 0.25,
          spots = [
            [W / 2 - 0.42, 1.35, faceIn(U)],
            [W / 2 - 0.42, 2.4, faceIn(U)],
            [0.15, 1.9, faceDoor(U)]
          ];
        U.theme = th[0];
        for (let j = 0; j < 3; j++) {
          const [pn, tb] = th[1 + j],
            [px, pz] = toLot(U, spots[j][0], spots[j][1]);
          SP(px, pz, pn, tb, spots[j][2]);
        }
      }
    }
    // the office: desk under the CCTV shelf, the till on the counter, a cabinet in the toilet; the dumpster by the office back door
    SP(4.6, OZ1 - 0.62, 'desk_office', 'hyj_office', PI);
    SP(2.92, 12.2, 'cash_register', 'hyj_office', -PI / 2, 1.055);
    SP(OX1 - 0.32, 10.35, 'medicine_cabinet', 'hyj_wc', -PI / 2);
    SP(8.6, 7.0, 'dumpster_blue', 'storage', -PI / 2);
    // a rental van left in the lane mid-move (front = +Z at rot 0)
    try {
      if (window.MFZV) {
        const vx = -2.9,
          vz = 2.4;
        const g = MFZV.make('van', WX(B, vx), WZ(B, vz), B.cs < 0 ? PI : 0, {
          label: 'MOVE IT OR LOSE IT',
          labelCol: '#e8782a',
          dust: true
        });
        const h = g && g.userData && g.userData.half;
        const hx = h ? h[0] : 1.1,
          hz = h ? h[1] : 2.7;
        B.occ.push([vx - hx, vx + hx, vz - hz, vz + hz]);
      }
    } catch (e) {}
    return LK.finish(B, t, {
      at: [0, (FZ + BZ) / 2],
      w: 2 * SX,
      d: FZ - BZ,
      loot: ['hyj_office', [OX0 + 0.6, WCX - 0.5, OZ0 + 0.6, OZ1 - 0.6], 1],
      zombies: [
        [-2.4, 9.5],
        [-2.0, -1.5],
        [7.4, 2.5],
        [3.4, 11.8],
        [-2.8, -8.5],
        [7.6, -6.5],
        [2.5, -11.8],
        [-1.0, -11.8],
        [7.8, -12.0],
        [-3.0, 4.0]
      ]
    });
  }

  const e = LK.register({
    id: 'rays_storage_units',
    name: 'Hide Your Junk: Storage Units',
    build: bHideYourJunk,
    note: 'half-plot self-storage yard behind razor-wire chain-link, one gate: 16 roller-door units (locked, a few open, only two or three worth looting), lockers, small office',
    globals: {bHideYourJunk, HIDEYOURJUNK: {build}}
  });
  if (e) e.loot = 'storage';
  console.log('[hideyourjunk] Hide Your Junk ready');
})();
