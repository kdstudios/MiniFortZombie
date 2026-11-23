/* MINI FORT ZOMBIE - core 07/13: town
   Town layout, catalogue of building types, lots (half-lots, compounds, yards), map generator v2, legacy town.
   Part of the old js/game/core.js (split in v080). Classic script: shares globals with the other core parts; load in numeric order. */
// ============ TOWN — bulletproof: each phase in its own try/catch ============
// ===================================================================================================================
//  v032 TOWN OVERHAUL — fixed 8x4 plot grid, data-driven building catalogue, intact/looted/ruined conditions
//  COORDINATE CONVENTION: world X = east(+), world Z = south(+), so NORTH IS -Z (top of the map / screen-up).
//  Every builder is AUTHORED facing SOUTH (its front door + sign are on local +Z). A plot whose frontage is
//  'north' rotates the whole building group by PI about Y; 'south' plots use yaw 0. Only 0/PI are produced by
//  this grid; any other front raises an explicit error (no random rotation, no silent fallback).
// ===================================================================================================================
const GRID = Object.freeze({COLS: 8, ROWS: 4, BW: 16, BD: 14, PW: 40, PD: 36, ROAD: 8, ALLEY: 4, CX: 0, CZ: -4}); // BW/BD = the ONE standard building footprint; PW/PD = plot (40x36: the 16x14 building centred in a 12m side / 11m front-back yard); only PW/PD drive spacing
const STD = Object.freeze({w: GRID.BW, d: GRID.BD}),
  AUTHORED_FRONT = 'south',
  COND_NAMES = ['intact', 'looted', 'ruined'];
function frontageForRow(row) {
  if (!(row >= 0 && row < GRID.ROWS)) throw new Error('plot row ' + row + ' outside grid');
  return row % 2 === 0 ? 'north' : 'south';
} // rows 0,2 face north; rows 1,3 face south; the alley is always behind
function yawFor(defFront, plotFront) {
  if (defFront !== AUTHORED_FRONT)
    throw new Error(
      'builders are authored facing ' + AUTHORED_FRONT + '; unsupported designated front "' + defFront + '"'
    );
  if (plotFront === 'south') return 0;
  if (plotFront === 'north') return Math.PI;
  throw new Error('this grid has no "' + plotFront + '" frontage');
}
function gridLayout(G = GRID) {
  const R = G.ROAD,
    A = G.ALLEY,
    W = 3 * R + 8 * G.PW,
    H = 3 * R + 2 * A + 4 * G.PD,
    X0 = G.CX - W / 2,
    Z0 = G.CZ - H / 2;
  const colX = c => X0 + R + (c < 4 ? c * G.PW : 4 * G.PW + R + (c - 4) * G.PW);
  const rowZ = r =>
    Z0 + R + (r < 2 ? r * G.PD + (r === 1 ? A : 0) : 2 * G.PD + A + R + (r - 2) * G.PD + (r === 3 ? A : 0));
  const plots = [];
  for (let r = 0; r < G.ROWS; r++)
    for (let c = 0; c < G.COLS; c++) {
      const x0 = colX(c),
        z0 = rowZ(r);
      plots.push({
        id: r * G.COLS + c,
        col: c,
        row: r,
        block: (r < 2 ? 0 : 2) + (c < 4 ? 0 : 1),
        front: frontageForRow(r),
        x0,
        x1: x0 + G.PW,
        z0,
        z1: z0 + G.PD,
        cx: x0 + G.PW / 2,
        cz: z0 + G.PD / 2
      });
    }
  const HC0 = Z0 + R + 2 * G.PD + A,
    top = [Z0 + R, HC0],
    bot = [HC0 + R, Z0 + H - R],
    roads = [];
  const rd = (kind, x0, x1, z0, z1) => roads.push({type: 'road', kind, x0, x1, z0, z1});
  rd('perimeter-north', X0, X0 + W, Z0, Z0 + R);
  rd('central-horizontal', X0, X0 + W, HC0, HC0 + R);
  rd('perimeter-south', X0, X0 + W, Z0 + H - R, Z0 + H);
  for (const [k, vx0] of [
    ['perimeter-west', X0],
    ['central-vertical', X0 + R + 4 * G.PW],
    ['perimeter-east', X0 + W - R]
  ]) {
    rd(k, vx0, vx0 + R, top[0], top[1]);
    rd(k, vx0, vx0 + R, bot[0], bot[1]);
  }
  const alleys = [];
  for (const r of [0, 2])
    for (const half of [0, 4]) {
      const x0 = colX(half),
        z0 = rowZ(r) + G.PD;
      alleys.push({
        type: 'alley',
        kind: 'alley',
        x0,
        x1: colX(half + 3) + G.PW,
        z0,
        z1: z0 + A,
        block: (r < 2 ? 0 : 2) + (half ? 1 : 0)
      });
    }
  return {X0, Z0, W, H, plots, roads, alleys, bounds: {x0: X0, x1: X0 + W, z0: Z0, z1: Z0 + H}};
}
function townBND(L = gridLayout()) {
  const B = L.bounds;
  return [B.x0 - 26, B.x1 + 26, B.z0 - 62, B.z1 + 64];
} // fence rectangle: previous margins around the town (26 E/W, 62 N for park+cemetery, 64 S for the truck)
function validateLayout(L, G = GRID) {
  const E = [],
    eps = 1e-6,
    P = L.plots;
  if (P.length !== 32) E.push('expected 32 plots, got ' + P.length);
  const cells = new Set(P.map(p => p.col + ',' + p.row));
  if (cells.size !== G.COLS * G.ROWS) E.push('plots are not a unique ' + G.COLS + 'x' + G.ROWS + ' grid');
  P.forEach(p => {
    if (Math.abs(p.x1 - p.x0 - G.PW) > eps || Math.abs(p.z1 - p.z0 - G.PD) > eps)
      E.push('plot ' + p.id + ' has non-standard size');
    if (p.front !== frontageForRow(p.row)) E.push('plot ' + p.id + ' frontage mismatch');
  });
  for (let b = 0; b < 4; b++) {
    if (P.filter(p => p.block === b).length !== 8) E.push('block ' + b + ' must hold 4x2 plots');
  }
  const all = [
    ...P.map(p => ({n: 'plot' + p.id, ...p})),
    ...L.roads.map((r, i) => ({n: 'road' + i, ...r})),
    ...L.alleys.map((r, i) => ({n: 'alley' + i, ...r}))
  ];
  let area = 0;
  for (let i = 0; i < all.length; i++) {
    const a = all[i];
    area += (a.x1 - a.x0) * (a.z1 - a.z0);
    const B = L.bounds;
    if (a.x0 < B.x0 - eps || a.x1 > B.x1 + eps || a.z0 < B.z0 - eps || a.z1 > B.z1 + eps)
      E.push(a.n + ' outside map boundary');
    for (let j = i + 1; j < all.length; j++) {
      const b = all[j];
      if (Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) > eps && Math.min(a.z1, b.z1) - Math.max(a.z0, b.z0) > eps)
        E.push(a.n + ' overlaps ' + b.n);
    }
  }
  if (Math.abs(area - L.W * L.H) > 1e-3)
    E.push(
      'plots+roads+alleys do not tile the map exactly (gap/overlap: ' +
        area.toFixed(2) +
        ' vs ' +
        (L.W * L.H).toFixed(2) +
        ')'
    );
  if (!(G.ROAD > G.ALLEY)) E.push('roads must be wider than alleys');
  const touchX = (r, x0, x1, z, which) => Math.abs(r[which] - z) < eps && r.x0 <= x0 + eps && r.x1 >= x1 - eps;
  P.forEach(p => {
    const fr = L.roads.some(r =>
      touchX(r, p.x0, p.x1, p.front === 'north' ? p.z0 : p.z1, p.front === 'north' ? 'z1' : 'z0')
    );
    if (!fr) E.push('plot ' + p.id + ' (' + p.front + ') has no road along its front edge');
    const back = L.alleys.some(a =>
      touchX(a, p.x0, p.x1, p.front === 'north' ? p.z1 : p.z0, p.front === 'north' ? 'z0' : 'z1')
    );
    if (!back) E.push('plot ' + p.id + ' has no alley behind it');
  });
  L.alleys.forEach(a => {
    if (!L.roads.some(r => Math.abs(r.x1 - a.x0) < eps && r.z0 <= a.z0 && r.z1 >= a.z1))
      E.push('alley ' + a.block + ' has no road at its west entrance');
    if (!L.roads.some(r => Math.abs(r.x0 - a.x1) < eps && r.z0 <= a.z0 && r.z1 >= a.z1))
      E.push('alley ' + a.block + ' has no road at its east entrance');
  });
  const perim = ['perimeter-north', 'perimeter-south', 'perimeter-west', 'perimeter-east'];
  perim.forEach(k => {
    if (!L.roads.some(r => r.kind === k)) E.push('missing ' + k + ' road');
  });
  return E;
}

// ------------------------------------------------------------ condition props & facade features (shared components)
const PF = B => ({
  g: B.g,
  fz: B.fz !== undefined ? B.fz : B.d / 2,
  dx: B.dx || 0,
  h: B.h || 4,
  w: B.w || 16,
  d: B.d || 14
});
const flatM = (w, d, c, x, y, z, g, ry = 0) => {
  const m = mesh(new THREE.PlaneGeometry(w, d), c, x, y, z, g);
  m.rotation.set(-PI / 2, 0, ry);
  return m;
};
const CP = {
  // condition/exterior props. Each draws into the building's own (already rotated) group, so they follow the facade orientation automatically.
  planters(B) {
    const {g, fz, dx} = PF(B);
    for (const s of [-1, 1]) {
      const x = dx + s * 2.6;
      if (Math.abs(x) > 7) continue;
      mesh(BX(1.2, 0.45, 0.4), 0x6b4a2e, x, 0.22, fz + 0.5, g);
      mesh(BX(1.1, 0.25, 0.3), 0x3a7a3a, x, 0.55, fz + 0.5, g);
    }
  },
  bin(B) {
    const {g, fz} = PF(B);
    mesh(BX(0.7, 1, 0.7), 0x2f5f3a, B.dx > 0 ? -6 : 6, 0.5, fz + 0.7, g);
  },
  bench(B) {
    const {g, fz, dx} = PF(B),
      x = dx > 0 ? -5 : 5;
    mesh(BX(1.8, 0.1, 0.5), 0x7a4a2a, x, 0.5, fz + 0.8, g);
    mesh(BX(0.1, 0.5, 0.5), 0x333333, x - 0.8, 0.25, fz + 0.8, g);
    mesh(BX(0.1, 0.5, 0.5), 0x333333, x + 0.8, 0.25, fz + 0.8, g);
  },
  flag(B) {
    const {g, fz} = PF(B);
    mesh(BX(0.1, 6, 0.1), 0xcccccc, -7, 3, fz + 0.8, g);
    mesh(BX(1.2, 0.7, 0.04), 0xb91c1c, -6.4, 5.6, fz + 0.8, g);
  },
  trash(B) {
    const {g, fz} = PF(B);
    for (let i = 0, n = ri(3, 5); i < n; i++) {
      const m = mesh(
        new THREE.IcosahedronGeometry(0.32, 0),
        PK([0x1c2a1c, 0x222222, 0x3a3a2a]),
        rnd(-7, 7),
        0.24,
        fz + rnd(0.4, 1.3),
        g
      );
      m.scale.set(1, 0.8, 1);
    }
  },
  glass(B) {
    const {g, fz} = PF(B);
    for (let i = 0; i < 14; i++)
      mesh(BX(rnd(0.1, 0.3), 0.02, rnd(0.1, 0.25)), 0xaed4ea, rnd(-7, 7), 0.03, fz + rnd(0.2, 1.2), g).rotation.y = rnd(
        0,
        3
      );
  },
  graffiti(B) {
    const {g, fz} = PF(B),
      cv = document.createElement('canvas');
    cv.width = 256;
    cv.height = 96;
    const q = cv.getContext('2d'),
      col = PK(['#c0262d', '#e5e5e5', '#3a8ad4']);
    q.fillStyle = col;
    q.font = 'bold 56px Impact,sans-serif';
    q.fillText(PK(['REPENT', 'HELP', 'NO FOOD', 'RIP', 'RUN']), 12, 66);
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 1.2),
      new THREE.MeshBasicMaterial({map: new THREE.CanvasTexture(cv), transparent: true})
    );
    m.position.set(rnd(-5, 5), rnd(1.6, 2.2), fz + 0.17);
    g.add(m);
  },
  crates(B) {
    const {g, fz} = PF(B);
    for (let i = 0; i < 3; i++) {
      const m = mesh(BX(0.9, 0.7, 0.9), 0x8a6a3a, rnd(-6, 6), 0.35, fz + rnd(0.5, 1.1), g);
      m.rotation.y = rnd(0, 3);
    }
    for (let i = 0; i < 4; i++)
      mesh(BX(0.9, 0.06, 0.15), 0x6a4a2a, rnd(-6, 6), 0.04, fz + rnd(0.4, 1.1), g).rotation.y = rnd(0, 3);
  },
  cart(B) {
    const {g, fz} = PF(B),
      c = new THREE.Group();
    c.position.set(rnd(-6, 6), 0.35, fz + 1.1);
    c.rotation.set(0, rnd(0, 3), 1.3);
    g.add(c);
    mesh(BX(1.1, 0.12, 0.7), 0x8a8a8a, 0, 0, 0, c);
    mesh(BX(1.1, 0.5, 0.08), 0x8a8a8a, 0, 0.25, 0.3, c);
    mesh(BX(1.1, 0.5, 0.08), 0x8a8a8a, 0, 0.25, -0.3, c);
  },
  papers(B) {
    const {g, fz} = PF(B);
    for (let i = 0; i < 10; i++) {
      const m = mesh(new THREE.PlaneGeometry(0.3, 0.4), 0xe8e4d0, rnd(-7, 7), 0.05, rnd(-4, fz + 1.4), g);
      m.rotation.set(-PI / 2, 0, rnd(0, 3));
    }
  },
  flour(B) {
    const {g, fz} = PF(B);
    for (let i = 0; i < 3; i++)
      flatM(rnd(1, 1.8), rnd(0.8, 1.3), 0xeeeeea, rnd(-5, 5), 0.06, rnd(-2, fz - 0.2), g, rnd(0, 3));
  },
  bottles(B) {
    const {g, fz} = PF(B);
    for (let i = 0; i < 9; i++) {
      const m = mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 0.3, 6),
        PK([0x2a5a2a, 0x6a3a1a, 0x8aa0a8]),
        rnd(-7, 7),
        0.07,
        fz + rnd(0.3, 1.6),
        g
      );
      m.rotation.z = 1.4;
      m.rotation.y = rnd(0, 3);
    }
  },
  books(B) {
    const {g, fz} = PF(B);
    for (let i = 0; i < 9; i++) {
      const m = mesh(
        BX(0.25, 0.04, 0.35),
        PK([0x7a2a2a, 0x2a4a7a, 0x3a6a3a, 0xa08a3a]),
        rnd(-7, 7),
        0.04,
        rnd(-3, fz + 1.5),
        g
      );
      m.rotation.y = rnd(0, 3);
    }
  },
  boards(B) {
    const {g, fz, dx} = PF(B);
    for (let i = 0; i < 3; i++) {
      const m = mesh(BX(1.5, 0.16, 0.05), 0x6a4a2a, dx, 0.7 + i * 0.55, fz + 0.12, g);
      m.rotation.z = rnd(-0.4, 0.4);
    }
  },
  scorch(B) {
    const {g, fz} = PF(B);
    for (let i = 0; i < 2; i++) {
      const m = mesh(
        new THREE.PlaneGeometry(rnd(2, 3.4), rnd(1.8, 2.8)),
        0x0a0a0a,
        rnd(-5, 5),
        rnd(1.4, 2.6),
        fz + 0.17,
        g
      );
      m.material.transparent = true;
      m.material.opacity = 0.72;
    }
  },
  beam(B) {
    const {g, h} = PF(B);
    for (let i = 0; i < 3; i++) {
      const m = mesh(BX(0.22, 0.22, rnd(3, 5)), 0x5a3a1a, rnd(-6, 6), rnd(0.5, 1.6), rnd(-5, 5), g);
      m.rotation.set(rnd(-0.3, 0.3), rnd(0, 3), 0);
    }
    for (let i = 0; i < 3; i++) {
      const p = mesh(BX(0.15, rnd(1.5, 2.8), 0.15), 0x5a3a1a, rnd(-7, 7), 0, PK([-6.9, 6.9, rnd(-6, 6)]), g);
      p.position.y = p.geometry.parameters.height / 2;
      p.rotation.z = rnd(-0.15, 0.15);
    }
  },
  tarp(B) {
    const {g, h} = PF(B);
    flatM(4, 3, 0x2a5a8a, rnd(-4, 4), h + 0.45, rnd(-3, 3), g, rnd(0, 1));
  },
  rubble(B) {
    const {g, fz} = PF(B),
      s = Math.random() < 0.5 ? -1 : 1,
      Z = window.MFZCOND ? MFZCOND.zones(B) : []; // v089: never in front of a door or gate
    for (let i = 0; i < 7; i++) {
      const px = s * rnd(3.5, 7.2),
        pz = fz + rnd(-0.6, 1);
      if (Z.some(r => px + 0.8 > r[0] - 0.4 && px - 0.8 < r[1] + 0.4 && pz + 0.8 > r[2] - 0.4 && pz - 0.8 < r[3] + 0.4))
        continue;
      const m = mesh(
        BX(rnd(0.4, 1.2), rnd(0.3, 0.9), rnd(0.4, 1.2)),
        PK([0x6a6a68, 0x5a4a3a, 0x8a8a86, 0x3a2a1a]),
        px,
        0,
        pz,
        g
      );
      const hh = m.geometry.parameters.height;
      m.position.y = hh / 2;
      m.rotation.y = rnd(0, 3);
      if (hh > 0.6) addSolid(m);
    }
  },
  wreck(B) {
    const {g, fz} = PF(B),
      Z = window.MFZCOND ? MFZCOND.zones(B) : [];
    // v089: the burnt-out car never parks across a door or gate (up to 12 tries, else none)
    let x = 0;
    for (let k = 0; k < 12; k++) {
      x = rnd(-5, 5);
      if (!Z.some(r => x + 2.3 > r[0] && x - 2.3 < r[1] && fz + 2.2 > r[2] && fz - 0.1 < r[3])) break;
      if (k === 11) return;
    }
    const c = new THREE.Group();
    c.position.set(x, 0, fz + 1.05);
    g.add(c);
    mesh(BX(4, 0.8, 1.8), 0x1a1a1a, 0, 0.6, 0, c);
    mesh(BX(2, 0.6, 1.6), 0x141414, -0.3, 1.2, 0, c);
    addSolid(c);
  },
  fallen_sign(B) {
    const {g, fz} = PF(B);
    const m = mesh(BX(3.2, 0.12, 0.9), 0x2a2a2a, rnd(-4, 4), 0.2, fz + 1.2, g);
    m.rotation.set(rnd(-0.2, 0.2), rnd(-0.4, 0.4), rnd(-0.3, 0.3));
    mesh(BX(2.6, 0.05, 0.4), 0xfacc15, 0, 0.08, 0, m);
  },
  mattress(B) {
    const {g, fz} = PF(B);
    const m = mesh(BX(1.9, 0.25, 1), 0x8a8a9a, rnd(-6, 6), 0.45, fz + 0.9, g);
    m.rotation.set(0.9, rnd(-0.4, 0.4), 0);
  },
  barrels(B) {
    const {g, fz} = PF(B);
    for (let i = 0; i < 3; i++) {
      const m = mesh(
        new THREE.CylinderGeometry(0.38, 0.38, 0.9, 8),
        PK([0x7a3a1a, 0x2a4a6a, 0x555555]),
        rnd(-7, 7),
        0.45,
        fz + rnd(0.6, 1.5),
        g
      );
      if (Math.random() < 0.4) {
        m.rotation.z = 1.5;
        m.position.y = 0.38;
      }
    }
  },
  blood(B) {
    const {g, fz, dx} = PF(B);
    flatM(1.6, 1.2, 0x4a0505, dx + rnd(-0.5, 0.5), 0.05, fz + 0.7, g, rnd(0, 3));
    flatM(1.2, 0.9, 0x4a0505, rnd(-5, 5), 0.05, fz + rnd(0.4, 0.9), g, rnd(0, 3));
  },
  tires(B) {
    const {g, fz} = PF(B);
    for (let i = 0; i < 3; i++) {
      const m = mesh(
        new THREE.TorusGeometry(0.38, 0.14, 6, 10),
        0x161616,
        rnd(-6, 6),
        0.16 + i * 0.0,
        fz + rnd(0.6, 1.4),
        g
      );
      m.rotation.x = PI / 2;
    }
  },
  pallets(B) {
    const {g, fz} = PF(B);
    for (let i = 0; i < 2; i++)
      for (let k = 0; k < 3; k++) mesh(BX(1.2, 0.1, 0.9), 0x9a7a4a, -5 + i * 1.6, 0.06 + k * 0.12, fz + 1, g);
  }
};
const CP_DISTURB = [
  'trash',
  'glass',
  'crates',
  'cart',
  'papers',
  'flour',
  'bottles',
  'books',
  'mattress',
  'barrels',
  'blood',
  'tires',
  'pallets',
  'graffiti',
  'fallen_sign'
]; // required in every 'looted' variant
const CP_STRUCT = ['beam', 'rubble', 'tarp', 'scorch', 'wreck']; // required in every 'ruined' variant
function applyCondProps(B, t, lv) {
  if (!B) return;
  if (PF(B).fz > 16.3) return;
  t.variants[COND_NAMES[lv]].props.forEach(k => CP[k](B));
}

const FEAT = {
  // facade / silhouette components, local coords, front = +Z. All stay inside the plot.
  porch(B) {
    const {g, d} = B,
      x = B.dx || 0;
    mesh(BX(4.4, 0.06, 2), 0x7a6a5a, x, 0.03, d / 2 + 1, g);
    mesh(BX(4.6, 0.15, 2), 0x4a3a2a, x, 2.85, d / 2 + 1, g);
    for (const s of [-1, 1]) mesh(BX(0.18, 2.8, 0.18), 0xe8e4d8, x + s * 2.1, 1.4, d / 2 + 1.85, g);
  },
  awning(B, o) {
    const {g, d} = B,
      c = o.awn || [0xb91c1c, 0xf1f1f1];
    for (let i = 0; i < 10; i++)
      mesh(BX(1.5, 0.1, 1.7), c[i % 2], -7.2 + i * 1.6, 3.2, d / 2 + 0.8, g).rotation.x = 0.3;
  },
  garage(B) {
    const {g, w, d} = B,
      x = w / 2 - 2.6;
    mesh(BX(4, 2.7, 0.14), 0xc8c8c0, x, 1.35, d / 2 + 0.1, g);
    for (let i = 0; i < 4; i++) mesh(BX(3.8, 0.05, 0.05), 0x999990, x, 0.5 + i * 0.6, d / 2 + 0.2, g);
    flatM(4.4, 2, 0x6a6a68, x, 0.02, d / 2 + 1, g);
  },
  balcony(B) {
    const {g, d} = B;
    mesh(BX(5, 0.15, 1.6), 0x5a5a5a, -2, 3.1, d / 2 + 0.8, g);
    mesh(BX(5, 0.8, 0.06), 0x333333, -2, 3.55, d / 2 + 1.55, g);
  },
  chimney(B) {
    const {g, w, h} = B;
    mesh(BX(1.1, 3.2, 1.1), 0x7a3a2a, -w / 4, h + 2, -B.d / 4, g);
    mesh(BX(1.3, 0.2, 1.3), 0x4a4a4a, -w / 4, h + 3.65, -B.d / 4, g);
  },
  columns(B, o) {
    const {g, d, h} = B,
      c = o.col || 0xe8e4d8;
    for (let i = 0; i < 5; i++)
      mesh(new THREE.CylinderGeometry(0.28, 0.28, 3.6, 10), c, -4 + i * 2, 1.8, d / 2 + 0.9, g);
    mesh(BX(10.4, 0.3, 2), c, 0, 3.75, d / 2 + 0.9, g);
    const pg = new THREE.CylinderGeometry(6, 6, 0.4, 3);
    pg.rotateX(-PI / 2);
    pg.scale(1, 1 / 6, 1);
    mesh(pg, c, 0, 4.4, d / 2 + 0.9, g);
  },
  dome(B, o) {
    const {g, h} = B;
    mesh(new THREE.CylinderGeometry(2.4, 2.4, 1.4, 14), 0xd8d4c8, 0, h + 0.7, 0, g);
    mesh(new THREE.SphereGeometry(2.4, 14, 8, 0, PI * 2, 0, PI / 2), o.dome || 0x3a8a6a, 0, h + 1.4, 0, g);
    mesh(BX(0.12, 1.2, 0.12), 0xcccccc, 0, h + 4.4, 0, g);
  },
  tower(B, o) {
    const {g, d, h} = B,
      x = o.tx !== undefined ? o.tx : -5,
      th = o.th || 5;
    mesh(BX(3, th, 3), o.tcol || B.c, x, h + th / 2, d / 2 - 1.8, g);
    mesh(new THREE.ConeGeometry(2.4, 2, 4), o.trc || 0x3a3a42, x, h + th + 1, d / 2 - 1.8, g).rotation.y = PI / 4;
    if (o.clock) {
      const c = mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.1, 16), 0xf4f1e6, x, h + th - 1.1, d / 2 - 0.25, g);
      c.rotation.x = PI / 2;
    }
  },
  tank(B) {
    const {g} = B;
    for (const sx of [-1, 1])
      for (const sz of [-1, 1]) mesh(BX(0.25, 6, 0.25), 0x555555, -4.5 + sx * 1.4, B.h + 3, -3.5 + sz * 1.4, g);
    mesh(new THREE.CylinderGeometry(2.2, 2.2, 3, 14), 0x8aa8b8, -4.5, B.h + 7.5, -3.5, g);
    mesh(new THREE.ConeGeometry(2.3, 1.2, 14), 0x6a8898, -4.5, B.h + 9.6, -3.5, g);
  },
  silo(B) {
    const {g, w, d} = B,
      x = -w / 2 + 1.7,
      z = -d / 2 + 1.7;
    mesh(new THREE.CylinderGeometry(1.7, 1.7, 9, 12), 0xb8b8b4, x, 4.5, z, g);
    mesh(new THREE.SphereGeometry(1.7, 12, 6, 0, PI * 2, 0, PI / 2), 0x8a8a88, x, 9, z, g);
  },
  bays(B, o) {
    const {g, d} = B,
      n = o.bays || 2,
      c = o.bayc || 0xa8321e;
    for (let i = 0; i < n; i++) {
      const x = (i - (n - 1) / 2) * (n > 2 ? 4.8 : 6.6);
      mesh(BX(4.2, 3.4, 0.12), c, x, 1.7, d / 2 + 0.1, g);
      for (let k = 0; k < 5; k++) mesh(BX(4, 0.05, 0.05), 0x00000a, x, 0.5 + k * 0.65, d / 2 + 0.19, g);
    }
  },
  marquee(B) {
    const {g, d} = B;
    mesh(BX(7, 1.1, 0.5), 0xf8e4a0, 0, 3.4, d / 2 + 0.6, g);
    for (let i = 0; i < 9; i++) {
      const m = mesh(BX(0.2, 0.2, 0.1), 0xfff7c0, -3.4 + i * 0.85, 3.4, d / 2 + 0.9, g);
      m.material.emissive.setHex(0x888844);
    }
  },
  walkway(B) {
    const {g, w, d} = B;
    mesh(BX(w, 0.15, 1.6), 0x8a8a82, 0, 3.3, d / 2 + 0.8, g);
    mesh(BX(w, 0.7, 0.06), 0x555555, 0, 3.7, d / 2 + 1.55, g);
    for (let i = 0; i < 5; i++) mesh(BX(0.15, 3.3, 0.15), 0x555555, -7.5 + i * 3.75, 1.65, d / 2 + 1.5, g);
    for (let i = 0; i < 5; i++) mesh(BX(0.9, 0.5, 0.05), 0xe8e0c0, -6 + i * 3, 2.5, d / 2 + 0.09, g);
  },
  cross_sign(B, o) {
    const {g, d, h} = B,
      c = o.cross || 0x16a34a;
    mesh(BX(2, 0.5, 0.1), c, 5.5, h - 0.8, d / 2 + 0.2, g);
    mesh(BX(0.5, 2, 0.1), c, 5.5, h - 0.8, d / 2 + 0.2, g);
  },
  cupola(B) {
    const {g, h} = B;
    mesh(BX(1.6, 1.4, 1.6), 0xe8e4d8, 0, h + 0.7, 0, g);
    mesh(new THREE.ConeGeometry(1.3, 1.3, 4), 0x4a4a52, 0, h + 2, 0, g).rotation.y = PI / 4;
  },
  beacon(B) {
    const m = mesh(BX(0.6, 0.4, 0.6), 0x2563eb, B.w / 2 - 1.5, B.h + 0.6, 0, B.g);
    m.material.emissive.setHex(0x1d3a9a);
  },
  neon(B, o) {
    const {g, d} = B;
    mesh(BX(0.2, 5, 0.2), 0x444444, -7.3, 2.5, d / 2 + 1, g);
    const m = mesh(BX(1.8, 1.2, 0.2), o.neonc || 0xff3a8a, -7.3, 5.2, d / 2 + 1, g);
    m.material.emissive.setHex(0x771133);
  },
  balls(B) {
    const {g, d} = B;
    mesh(BX(2.4, 0.12, 0.12), 0x444444, -6, 3.6, d / 2 + 0.5, g);
    for (let i = 0; i < 3; i++)
      mesh(new THREE.SphereGeometry(0.3, 8, 6), 0xd4a017, -6.7 + i * 0.7, 2.9 + (i === 1 ? 0.35 : 0), d / 2 + 0.5, g);
  },
  mast(B) {
    const {g} = B;
    mesh(new THREE.CylinderGeometry(0.12, 0.12, 12, 6), 0x555555, 5.5, B.h + 6, -3, g);
    mesh(BX(2.6, 0.1, 0.1), 0x555555, 5.5, B.h + 10, -3, g);
    mesh(BX(1.8, 0.1, 0.1), 0x555555, 5.5, B.h + 8.4, -3, g);
    for (const x of [-4, -1.8]) mesh(BX(1.6, 1.6, 1.6), 0x6a7a6a, x, B.h + 0.8, -4, g);
  },
  yardfence(B) {
    const {g, w} = B;
    for (let i = 0; i < 6; i++) mesh(BX(0.08, 1.4, 0.08), 0x555555, w / 2 + 1.4, 0.7, -5 + i * 2, g);
    mesh(BX(0.05, 0.06, 10), 0x555555, w / 2 + 1.4, 1.3, 0, g);
    mesh(BX(0.05, 0.06, 10), 0x555555, w / 2 + 1.4, 0.5, 0, g);
    mesh(BX(1.1, 0.8, 1), 0x8a5a3a, w / 2 + 0.9, 0.4, 4.5, g);
  },
  xdoors(B) {
    const {g, d, h} = B;
    for (const s of [-1, 1]) {
      mesh(BX(2.2, 3.6, 0.12), 0x8a2a22, s * 1.15, 1.8, d / 2 + 0.1, g);
      for (const r of [-1, 1]) mesh(BX(0.12, 4.2, 0.1), 0xf4f4f0, s * 1.15, 1.8, d / 2 + 0.2, g).rotation.z = r * 0.5;
    }
    mesh(BX(2.2, 2, 0.12), 0xf4f4f0, 0, h - 1.2, d / 2 + 0.1, g);
  },
  sawtooth(B) {
    const {g, w, d, h} = B;
    for (let i = 0; i < 4; i++) {
      const m = mesh(BX(w / 4 - 0.1, 0.12, d - 1), 0x8a8a86, -6 + i * 4, h + 1.1, 0, g);
      m.rotation.z = 0.5;
    }
  },
  ribbon(B) {
    const {g, w, d} = B;
    for (const y of [4.6, 6.1]) {
      const m = mesh(BX(w - 1, 0.9, 0.05), 0x6fa0c8, 0, y, d / 2 + 0.17, g);
      m.material.transparent = true;
      m.material.opacity = 0.6;
    }
  },
  loft(B) {
    const {g, d, h} = B;
    mesh(BX(2.2, 2.4, 0.12), 0xf4f4f0, 0, h - 1.2, d / 2 + 0.12, g);
  }
};

// ------------------------------------------------------------ extra loot tables (existing item ids only; validated below)
Object.assign(LOOT_TABLES, {
  convenience: {
    colacola: 3,
    citrol: 3,
    popzi_soft_drink: 3,
    sup_soft_drink: 3,
    z_energy_drink: 3,
    cheezholes: 3,
    tweex: 3,
    herkeys_jerkey: 3,
    granola: 2,
    fud: 2,
    milk: 2,
    ramen_noodles: 2,
    painkiller: 1,
    gauze: 1
  },
  restaurant: {
    salad: 3,
    lamburger: 3,
    pizan_pasta: 3,
    calzones: 3,
    kenball_soup: 3,
    bacon: 2,
    sausages: 2,
    pickles: 2,
    milk: 2,
    popzi_soft_drink: 2,
    butcher_knife: 1
  },
  bakery: {
    granola: 3,
    brans: 3,
    calzones: 3,
    milk: 2,
    tweex: 2,
    cherry_preserves: 2,
    peach_preserves: 2,
    fud: 1,
    butcher_knife: 1
  },
  butcher: {bacon: 4, sausages: 4, salami: 4, smoked_ham: 2, herkeys_jerkey: 3, butcher_knife: 4, pickled_herring: 1},
  liquor: {
    popzi_soft_drink: 2,
    colacola: 2,
    pickles: 2,
    herkeys_jerkey: 2,
    cheezholes: 2,
    baseball_bat: 1,
    bowling_ball: 1,
    spray_paint: 1,
    ammo_38_fed: 1
  },
  sporting: {
    baseball_bat: 4,
    bowling_ball: 2,
    machete: 2,
    rope: 3,
    bungie_cord: 3,
    water_jug: 2,
    granola: 2,
    military_rations: 1,
    ammo_12_gauge: 2,
    ammo_556: 1,
    sickle: 1,
    shotgun: 1,
    model_70_safari: 1,
    lee_enfield: 1,
    bug_spray: 2,
    duct_tape: 2
  },
  pawn: {
    beretta_9mm: 2,
    glock_22: 1,
    m1911a1: 1,
    colt_detective_special: 1,
    katana: 2,
    broadsword: 1,
    machete: 2,
    crowbar: 2,
    car_battery: 2,
    ammo_9mm: 2,
    ammo_45: 2,
    ammo_38_fed: 1,
    butcher_knife: 1
  },
  pharmacy: {
    cotton_balls: 5,
    antibiotics: 4,
    gauze: 5,
    medical_tape: 4,
    medkit: 2,
    painkiller: 6,
    bug_spray: 1,
    water_jug: 1
  },
  office: {
    duct_tape: 3,
    painkiller: 2,
    granola: 2,
    water_jug: 3,
    tweex: 2,
    popzi_soft_drink: 2,
    cotton_balls: 1,
    spring: 1,
    nails: 1
  },
  laundromat: {
    spray_paint: 1,
    bug_spray: 2,
    popzi_soft_drink: 2,
    colacola: 2,
    cheezholes: 2,
    tweex: 2,
    rope: 1,
    bungie_cord: 2,
    duct_tape: 1,
    spring: 1
  },
  warehouse: {
    nails: 3,
    rope: 3,
    duct_tape: 3,
    bungie_cord: 3,
    gas_can: 3,
    gas_cylinder: 2,
    car_battery: 2,
    spring: 2,
    fire_hose: 1,
    military_rations: 2,
    water_jug: 3,
    granola: 2,
    kenball_soup: 3,
    ramen_noodles: 3
  },
  auto: {
    car_battery: 5,
    gas_can: 4,
    duct_tape: 3,
    spring: 3,
    bungie_cord: 2,
    crowbar: 3,
    nails: 2,
    spray_paint: 2,
    rope: 1,
    fire_axe: 1
  },
  motel: {
    cotton_balls: 2,
    gauze: 1,
    painkiller: 2,
    ramen_noodles: 2,
    popzi_soft_drink: 2,
    tweex: 2,
    cheezholes: 2,
    water_jug: 2,
    duct_tape: 1,
    baseball_bat: 1,
    crowbar: 1
  },
  school: {
    granola: 3,
    milk: 3,
    tweex: 2,
    painkiller: 2,
    cotton_balls: 2,
    gauze: 2,
    baseball_bat: 2,
    bowling_ball: 1,
    spray_paint: 1,
    rope: 1,
    water_jug: 2,
    fud: 2
  },
  fire: {
    fire_axe: 5,
    fire_hose: 5,
    medkit: 2,
    gauze: 3,
    medical_tape: 3,
    rope: 3,
    gas_can: 2,
    crowbar: 3,
    water_jug: 2,
    military_rations: 1,
    duct_tape: 2
  },
  police: {
    ammo_9mm: 5,
    ammo_40: 4,
    ammo_12_gauge: 4,
    ammo_38_fed: 3,
    glock_22: 2,
    beretta_9mm: 2,
    pump_shotgun: 2,
    combat_shotgun: 1,
    m4: 1,
    mac10: 1,
    gauze: 2,
    medkit: 1,
    painkiller: 2,
    baseball_bat: 2
  },
  townhall: {
    water_jug: 2,
    granola: 2,
    painkiller: 1,
    duct_tape: 2,
    rope: 1,
    tweex: 1,
    military_rations: 1,
    cotton_balls: 1
  },
  library: {duct_tape: 1, painkiller: 1, water_jug: 2, granola: 1, cotton_balls: 1, bug_spray: 1, spray_paint: 1},
  cinema: {
    popzi_soft_drink: 4,
    colacola: 3,
    cheezholes: 4,
    tweex: 3,
    herkeys_jerkey: 2,
    fud: 3,
    granola: 1,
    spray_paint: 1
  },
  community: {
    water_jug: 3,
    granola: 3,
    kenball_soup: 3,
    ramen_noodles: 2,
    milk: 2,
    medkit: 1,
    gauze: 2,
    painkiller: 2,
    cotton_balls: 2,
    baseball_bat: 1,
    rope: 1
  },
  funeral: {
    cotton_balls: 3,
    gauze: 2,
    painkiller: 2,
    medical_tape: 2,
    shovel: 3,
    rope: 3,
    nails: 2,
    spray_paint: 1,
    butcher_knife: 1
  },
  vet: {
    cotton_balls: 4,
    antibiotics: 4,
    gauze: 4,
    medical_tape: 3,
    painkiller: 3,
    medkit: 1,
    water_jug: 2,
    granola: 1,
    rope: 1,
    bug_spray: 2
  },
  storage: {
    nails: 3,
    rope: 3,
    duct_tape: 3,
    spring: 2,
    gas_can: 2,
    bungie_cord: 3,
    car_battery: 2,
    spray_paint: 2,
    bug_spray: 2,
    military_rations: 1,
    water_jug: 2,
    kenball_soup: 2,
    ramen_noodles: 2
  },
  barn: {
    pitchfork: 3,
    shovel: 3,
    sickle: 3,
    rope: 4,
    nails: 2,
    milk: 3,
    granola: 2,
    salami: 1,
    smoked_ham: 1,
    cherry_preserves: 2,
    peach_preserves: 2,
    pickles: 2,
    gas_can: 2,
    machete: 1,
    shotgun: 2,
    ammo_12_gauge: 2
  },
  utility: {
    car_battery: 3,
    duct_tape: 3,
    spring: 2,
    nails: 2,
    rope: 2,
    fire_hose: 1,
    gas_can: 2,
    gas_cylinder: 3,
    spray_paint: 1,
    crowbar: 2
  },
  water: {water_jug: 6, rope: 2, duct_tape: 2, gas_can: 1, nails: 1, spring: 1, bug_spray: 1}
});
for (const t in LOOT_TABLES)
  for (const id in LOOT_TABLES[t]) if (!ITEMS[id]) throw new Error('loot table ' + t + ' has unknown item ' + id);
Object.assign(LOOT_PROP, {
  convenience: 'pump_shelf',
  restaurant: 'counter',
  bakery: 'counter',
  butcher: 'fridge',
  liquor: 'cabinet',
  sporting: 'toolchest',
  pawn: 'cabinet',
  pharmacy: 'cabinet',
  office: 'cabinet',
  laundromat: 'counter',
  auto: 'toolchest',
  motel: 'fridge',
  school: 'cabinet',
  fire: 'toolchest',
  police: 'ammo_crate',
  townhall: 'cabinet',
  library: 'counter',
  cinema: 'counter',
  community: 'fridge',
  funeral: 'cabinet',
  vet: 'cabinet',
  utility: 'toolchest'
});

// ------------------------------------------------------------ generic data-driven builder for the new building types
function bGen(x, z, t) {
  const o = t.gen,
    B = mk(x, z, STD.w, STD.d, o.h || 4.5, o.wall, o.floor || 0x8a8a82, o.door || 0x3a3a3a),
    {w, d, h} = B,
    dx = o.dx !== undefined ? o.dx : 0,
    bd = o.bd !== undefined ? o.bd : 5,
    zq = o.split !== undefined ? o.split : -1.5;
  B.dx = dx;
  shell(B, {
    f: [...fw(w, dx, o.ws || 3.2), {k: 'd', c: dx}],
    b: [...fw(w, bd, 3.4), {k: 'd', c: bd, s: -1}],
    l: fw(d, 99, 3.5),
    r: fw(d, 99, 3.5)
  });
  WL(
    B,
    1,
    zq,
    -w / 2 + 0.15,
    w / 2 - 0.15,
    [
      {k: 'd', c: o.sd !== undefined ? o.sd : -4.6},
      {k: 'g', c: o.sg !== undefined ? o.sg : 3.4}
    ],
    h,
    {th: 0.2, c: o.pc || 0xcbbfae}
  );
  const Fr = [-w / 2 + 0.15, w / 2 - 0.15, zq + 0.15, d / 2 - 0.15],
    Bk = [-w / 2 + 0.15, w / 2 - 0.15, -d / 2 + 0.15, zq - 0.15];
  (o.pr || []).forEach(p => put(B, p[0], p[1], p[2], p[3] || 0));
  (o.tbl || []).forEach(p => {
    put(B, 'table', p[0], p[1]);
    put(B, 'chair', p[0] - 0.4, p[1] + 0.85, PI);
    put(B, 'chair', p[0] + 0.4, p[1] + 0.85, PI);
    put(B, 'chair', p[0] - 0.4, p[1] - 0.85);
    put(B, 'chair', p[0] + 0.4, p[1] - 0.85);
  });
  if (o.fr) furn(B, o.fr, Fr);
  if (o.bk) furn(B, o.bk, Bk);
  rc(B, t.loot, Fr, o.nf || 1);
  rc(B, t.loot, Bk, o.nb || 1);
  roof(B, h, o.roof || 'flat', o.rc || 0x4a4a48);
  if (o.sign) sign(B, o.sign, o.sw || 5);
  (o.feats || []).forEach(f => FEAT[f](B, o));
  junk(B, o.junk || 5, Fr);
  const zz = o.z || [0, 1];
  done(B, t.id, ri(zz[0], zz[1]));
}
const BUILDERS = {
  house: bHouse,
  clinic: bClinic,
  gun: bGun,
  gas: bGas,
  diner: bDiner,
  hard: bHard,
  mart: bMart,
  church: bChurch,
  gen: bGen
};

// ------------------------------------------------------------ THE CATALOGUE (central, data-driven)
const CATALOGUE = [];
function def(id, name, category, builder, cfg, loot, i, l, r) {
  CATALOGUE.push({
    id,
    name,
    category,
    builder,
    footprint: 'standard',
    front: 'south',
    w: STD.w,
    d: STD.d,
    loot,
    ...cfg,
    variants: {intact: {props: i}, looted: {props: l}, ruined: {props: r}}
  });
}
// ---- residential (all share the proven two-storey/single-storey house builder; hv = per-type design data)
def(
  'small_detached_house',
  'Small Detached House',
  'residential',
  'house',
  {hv: {two: false, walls: [0x8a7f73, 0x7c8a73, 0x73808a], roof: 'gable'}},
  'house',
  ['planters'],
  ['trash', 'glass', 'boards'],
  ['beam', 'rubble', 'tarp']
);
def(
  'two_storey_family_house',
  'Two-Storey Family House',
  'residential',
  'house',
  {hv: {two: true, walls: [0xa09070, 0x6f7f8f, 0x8a8a7a], roof: 'gable', feats: ['chimney']}},
  'house',
  ['bin', 'planters'],
  ['glass', 'trash', 'mattress'],
  ['scorch', 'beam', 'rubble']
);
def(
  'weatherboard_house',
  'Weatherboard House',
  'residential',
  'house',
  {
    hv: {two: false, walls: [0xd8d4c4, 0xb8c4c8, 0xc9c0a8], roof: 'gable', rcol: [0x4a5a6a, 0x6a3a2a], feats: ['porch']}
  },
  'house',
  ['planters', 'bench'],
  ['glass', 'crates', 'graffiti'],
  ['tarp', 'rubble', 'beam']
);
def(
  'brick_suburban_house',
  'Brick Suburban House',
  'residential',
  'house',
  {
    hv: {
      two: false,
      walls: [0x8a4a3a, 0x7a3f32, 0x94503c],
      roof: 'gable',
      rcol: [0x3a3a42, 0x4a3a2a],
      feats: ['chimney']
    }
  },
  'house',
  ['planters', 'flag'],
  ['glass', 'trash', 'blood'],
  ['scorch', 'rubble', 'beam']
);
def(
  'run_down_rental',
  'Run-Down Rental Property',
  'residential',
  'house',
  {hv: {two: true, walls: [0x6a6a60, 0x7a7468], roof: 'flat', door: [0x2c4a5a, 0x5a2c2c]}},
  'house',
  ['bin'],
  ['mattress', 'trash', 'graffiti'],
  ['tarp', 'beam', 'rubble']
);
def(
  'rural_farmhouse',
  'Rural Farmhouse',
  'residential',
  'house',
  {hv: {two: true, walls: [0xe8e0cc, 0xd6d0b8], roof: 'gable', rcol: [0x7a2a22, 0x4a4a4a], feats: ['porch']}},
  'house',
  ['bench', 'planters'],
  ['barrels', 'glass', 'crates'],
  ['rubble', 'tarp', 'beam']
);
def(
  'small_bungalow',
  'Small Bungalow',
  'residential',
  'house',
  {hv: {two: false, walls: [0xa8b89a, 0xc4b08a], roof: 'pyr', rcol: [0x6a3a2a, 0x3a4a3a], feats: ['porch']}},
  'house',
  ['planters'],
  ['trash', 'glass', 'bottles'],
  ['scorch', 'rubble', 'tarp']
);
def(
  'older_traditional_house',
  'Older Traditional House',
  'residential',
  'house',
  {hv: {two: true, walls: [0x6a5a4a, 0x5a6a5a], roof: 'pyr', rcol: [0x2a2a2a, 0x3a2a2a], feats: ['porch', 'chimney']}},
  'house',
  ['bench', 'planters'],
  ['papers', 'glass', 'graffiti'],
  ['beam', 'tarp', 'rubble']
);
def(
  'modern_suburban_house',
  'Modern Suburban House',
  'residential',
  'house',
  {hv: {two: true, walls: [0xe0e0dc, 0x9aa0a6], roof: 'flat', door: [0x222222], feats: ['balcony']}},
  'house',
  ['planters', 'bin'],
  ['glass', 'trash', 'tires'],
  ['scorch', 'rubble', 'beam']
);
def(
  'porch_house',
  'House with Front Porch',
  'residential',
  'house',
  {hv: {two: false, walls: [0xc4b8a0, 0x9aa89a], roof: 'gable', feats: ['porch']}},
  'house',
  ['planters', 'bench'],
  ['glass', 'crates', 'blood'],
  ['beam', 'tarp', 'rubble']
);
def(
  'garage_house',
  'House with Integrated Garage',
  'residential',
  'house',
  {hv: {two: false, garage: true, walls: [0xb0a898, 0x8f9a8f], roof: 'gable', feats: ['garage']}},
  'house',
  ['bin'],
  ['tires', 'glass', 'trash'],
  ['wreck', 'rubble', 'beam']
);
def(
  'abandoned_house',
  'Abandoned House',
  'residential',
  'house',
  {hv: {two: false, walls: [0x5a5850, 0x4a4a44], roof: 'gable', rcol: [0x2a2a28], door: [0x2a2018]}},
  'house',
  ['bin'],
  ['mattress', 'graffiti', 'trash'],
  ['beam', 'scorch', 'rubble']
);
def(
  'dilapidated_cottage',
  'Dilapidated Cottage',
  'residential',
  'house',
  {hv: {two: false, walls: [0x6a6048, 0x5a5a48], roof: 'pyr', rcol: [0x3a2a1a], feats: ['porch']}},
  'house',
  ['bench'],
  ['barrels', 'glass', 'papers'],
  ['tarp', 'rubble', 'beam']
);
// ---- commercial (legacy hand-built interiors re-fitted to the standard footprint)
def(
  'grocery_store',
  'Grocery Store',
  'commercial',
  'mart',
  {},
  'supermarket',
  ['bin', 'flag'],
  ['cart', 'trash', 'crates'],
  ['rubble', 'beam', 'scorch']
);
def(
  'gas_station',
  'Gas Station',
  'commercial',
  'gas',
  {},
  'gas',
  ['bin', 'barrels'],
  ['trash', 'tires', 'glass'],
  ['wreck', 'scorch', 'rubble']
);
def(
  'diner',
  'Diner',
  'commercial',
  'diner',
  {},
  'diner',
  ['planters', 'bin'],
  ['trash', 'glass', 'bottles'],
  ['scorch', 'beam', 'tarp']
);
def(
  'hardware_store',
  'Hardware Store',
  'commercial',
  'hard',
  {},
  'hardware',
  ['pallets', 'bin'],
  ['pallets', 'crates', 'glass'],
  ['beam', 'rubble', 'tarp']
);
def(
  'gun_shop',
  'Gun Shop',
  'commercial',
  'gun',
  {},
  'gunshop',
  ['bin'],
  ['glass', 'blood', 'crates'],
  ['scorch', 'rubble', 'beam']
);
def(
  'medical_clinic',
  'Medical Clinic',
  'commercial',
  'clinic',
  {},
  'clinic',
  ['planters', 'bench'],
  ['papers', 'glass', 'blood'],
  ['rubble', 'tarp', 'beam']
);
// ---- commercial (new, generic data-driven builder)
const SHELVES = [
    ['shelf', 'w', 0.5],
    ['shelf', 'e', 0.5]
  ],
  OFFICE = [
    ['desk', 'n', 0.2],
    ['desk', 'n', 0.5],
    ['desk', 'n', 0.8],
    ['desk', 's', 0.3],
    ['desk', 's', 0.7],
    ['shelf', 'w', 0.5],
    ['plant', 'e', 0.1]
  ],
  CELLS = [
    ['cot', 'n', 0.5],
    ['toilet', 'w', 0.9]
  ];
def(
  'convenience_store',
  'Convenience Store',
  'commercial',
  'gen',
  {
    gen: {
      h: 4,
      wall: 0xd8d0b8,
      loot: 'convenience',
      sign: 'QUIK MART',
      sw: 6,
      feats: ['awning'],
      awn: [0x1d4ed8, 0xf1f1f1],
      pr: [
        ['aisle', -3.2, 2.4],
        ['aisle', -3.2, -0.2],
        ['aisle', 0.4, 2.4],
        ['aisle', 0.4, -0.2],
        ['register', -5.8, 5.6]
      ],
      fr: [
        ['freezer', 'e', 0.2],
        ['freezer', 'e', 0.55]
      ],
      bk: [
        ['crate', 'n', 0.2],
        ['shelf', 'w', 0.5],
        ['crate', 'n', 0.7],
        ['box', 's', 0.5]
      ]
    }
  },
  'convenience',
  ['bin', 'bench'],
  ['trash', 'glass', 'bottles'],
  ['scorch', 'rubble', 'tarp']
);
def(
  'restaurant',
  'Restaurant',
  'commercial',
  'gen',
  {
    gen: {
      h: 4.5,
      wall: 0x8a3a2a,
      loot: 'restaurant',
      sign: 'BISTRO',
      feats: ['awning'],
      awn: [0x7f1d1d, 0xf1f1f1],
      split: -2.5,
      tbl: [
        [-4, 3.8],
        [0, 3.8],
        [4, 3.8],
        [-4, 0.6],
        [0, 0.6],
        [4, 0.6]
      ],
      bk: [
        ['stove', 'n', 0.2],
        ['stove', 'n', 0.5],
        ['fridge', 'n', 0.95],
        ['counter', 's', 0.4],
        ['sink', 'e', 0.6]
      ]
    }
  },
  'restaurant',
  ['planters', 'bin'],
  ['trash', 'glass', 'bottles'],
  ['scorch', 'beam', 'rubble']
);
def(
  'bakery',
  'Bakery',
  'commercial',
  'gen',
  {
    gen: {
      h: 4,
      wall: 0xe8d8b8,
      roof: 'gable',
      rc: 0x8a5a3a,
      loot: 'bakery',
      sign: 'BAKERY',
      feats: ['awning', 'chimney'],
      awn: [0xe8a0b0, 0xf8f0e0],
      fr: [
        ['counter', 'w', 0.35],
        ['shelf', 'e', 0.3],
        ['shelf', 'e', 0.7],
        ['plant', 'n', 0.1],
        ['register', 'w', 0.8]
      ],
      bk: [
        ['stove', 'n', 0.3],
        ['stove', 'n', 0.6],
        ['counter', 's', 0.5],
        ['crate', 'e', 0.5]
      ]
    }
  },
  'bakery',
  ['planters', 'bench'],
  ['flour', 'trash', 'glass'],
  ['scorch', 'beam', 'tarp']
);
def(
  'butcher_shop',
  'Butcher Shop',
  'commercial',
  'gen',
  {
    gen: {
      h: 4,
      wall: 0xd8d8d0,
      loot: 'butcher',
      sign: 'BUTCHER',
      feats: ['awning'],
      awn: [0x991b1b, 0xf1f1f1],
      fr: [
        ['freezer', 'n', 0.15],
        ['freezer', 'n', 0.55],
        ['counter', 'w', 0.7],
        ['register', 'e', 0.8]
      ],
      bk: [
        ['freezer', 'n', 0.2],
        ['freezer', 'n', 0.6],
        ['counter', 's', 0.5]
      ]
    }
  },
  'butcher',
  ['bin'],
  ['blood', 'trash', 'glass'],
  ['scorch', 'rubble', 'beam']
);
def(
  'liquor_store',
  'Liquor Store',
  'commercial',
  'gen',
  {
    gen: {
      h: 4,
      wall: 0x3a3a4a,
      loot: 'liquor',
      sign: 'LIQUOR',
      feats: ['neon'],
      neonc: 0x22d3ee,
      pr: [
        ['aisle', -3.4, 2.6],
        ['aisle', 0, 2.6],
        ['aisle', 3.4, 2.6],
        ['register', 5.6, 5.4]
      ],
      fr: SHELVES,
      bk: [
        ['crate', 'n', 0.2],
        ['crate', 'n', 0.5],
        ['shelf', 'e', 0.5]
      ]
    }
  },
  'liquor',
  ['bin'],
  ['bottles', 'glass', 'trash'],
  ['scorch', 'rubble', 'tarp']
);
def(
  'sporting_goods',
  'Sporting Goods Shop',
  'commercial',
  'gen',
  {
    gen: {
      h: 4.5,
      wall: 0x2f5a8a,
      loot: 'sporting',
      sign: 'SPORTS',
      sw: 6,
      feats: ['awning'],
      awn: [0xea580c, 0x1f2937],
      fr: [
        ['rack', 'w', 0.3],
        ['rack', 'w', 0.7],
        ['rack', 'e', 0.3],
        ['rack', 'e', 0.7],
        ['bench', 'n', 0.5]
      ],
      pr: [
        ['register', -1, 5.5],
        ['counter', 1.4, 5.4]
      ],
      bk: [
        ['crate', 'n', 0.2],
        ['crate', 'n', 0.6],
        ['shelf', 'w', 0.5],
        ['box', 's', 0.3]
      ]
    }
  },
  'sporting',
  ['bench', 'flag'],
  ['crates', 'trash', 'glass'],
  ['rubble', 'beam', 'scorch']
);
def(
  'pawn_shop',
  'Pawn Shop',
  'commercial',
  'gen',
  {
    gen: {
      h: 4,
      wall: 0x6a5a4a,
      loot: 'pawn',
      sign: 'PAWN',
      feats: ['balls', 'neon'],
      neonc: 0xfacc15,
      fr: [
        ['rack', 'w', 0.3],
        ['rack', 'e', 0.3],
        ['counter', 'n', 0.5],
        ['shelf', 'e', 0.8]
      ],
      pr: [
        ['counter', -2, 3],
        ['register', -3, 3.2]
      ],
      bk: [
        ['crate', 'n', 0.2],
        ['shelf', 'w', 0.5],
        ['shelf', 'e', 0.5],
        ['box', 's', 0.5]
      ]
    }
  },
  'pawn',
  ['bin'],
  ['glass', 'blood', 'graffiti'],
  ['scorch', 'beam', 'rubble']
);
def(
  'pharmacy',
  'Pharmacy',
  'commercial',
  'gen',
  {
    gen: {
      h: 4.2,
      wall: 0xe8eef0,
      loot: 'pharmacy',
      sign: 'PHARMACY',
      sw: 6,
      feats: ['cross_sign', 'awning'],
      awn: [0x16a34a, 0xf1f1f1],
      fr: [
        ['shelf', 'w', 0.3],
        ['shelf', 'w', 0.7],
        ['shelf', 'e', 0.3],
        ['shelf', 'e', 0.7],
        ['plant', 'n', 0.1]
      ],
      pr: [
        ['counter', 0, 3.6],
        ['register', -0.6, 3.8]
      ],
      bk: RM.pharm
    }
  },
  'pharmacy',
  ['planters', 'bench'],
  ['papers', 'glass', 'trash'],
  ['scorch', 'rubble', 'tarp']
);
def(
  'small_office',
  'Small Office Building',
  'commercial',
  'gen',
  {
    gen: {
      h: 7,
      wall: 0x8a97a3,
      loot: 'office',
      sign: 'OFFICES',
      sw: 6,
      feats: ['ribbon'],
      fr: OFFICE,
      bk: [
        ['desk', 'n', 0.2],
        ['desk', 'n', 0.7],
        ['shelf', 'w', 0.5],
        ['plant', 'e', 0.5]
      ],
      ws: 3.4
    }
  },
  'office',
  ['planters', 'flag'],
  ['papers', 'glass', 'trash'],
  ['beam', 'scorch', 'rubble']
);
def(
  'laundromat',
  'Laundromat',
  'commercial',
  'gen',
  {
    gen: {
      h: 4,
      wall: 0x6aa0b0,
      loot: 'laundromat',
      sign: 'LAUNDRY',
      sw: 5,
      feats: ['awning'],
      awn: [0x2563eb, 0xf1f1f1],
      fr: [
        ['freezer', 'n', 0.15],
        ['freezer', 'n', 0.5],
        ['freezer', 'n', 0.85],
        ['bench', 's', 0.3],
        ['bench', 's', 0.7],
        ['plant', 'w', 0.5]
      ],
      bk: [
        ['box', 'n', 0.3],
        ['crate', 'e', 0.5],
        ['shelf', 'w', 0.5]
      ]
    }
  },
  'laundromat',
  ['bin', 'bench'],
  ['trash', 'glass', 'papers'],
  ['rubble', 'scorch', 'tarp']
);
def(
  'warehouse',
  'Warehouse',
  'commercial',
  'gen',
  {
    gen: {
      h: 6.5,
      wall: 0x7a7f84,
      loot: 'warehouse',
      sign: 'WAREHOUSE',
      sw: 7,
      feats: ['bays', 'sawtooth'],
      bays: 2,
      bayc: 0x5a6068,
      dx: 6.6,
      split: -3,
      fr: [
        ['crate', 'n', 0.1],
        ['crate', 'n', 0.4],
        ['lumber', 'w', 0.5],
        ['shelf', 'e', 0.3],
        ['shelf', 'e', 0.7],
        ['crate', 's', 0.5]
      ],
      bk: [
        ['crate', 'n', 0.1],
        ['crate', 'n', 0.5],
        ['crate', 'n', 0.9],
        ['lumber', 'w', 0.5],
        ['shelf', 'e', 0.5]
      ],
      z: [1, 2],
      nb: 2
    }
  },
  'warehouse',
  ['pallets'],
  ['crates', 'pallets', 'trash'],
  ['beam', 'rubble', 'tarp']
);
def(
  'auto_repair',
  'Auto Repair Shop',
  'commercial',
  'gen',
  {
    gen: {
      h: 4.5,
      wall: 0xb8b0a0,
      loot: 'auto',
      sign: 'AUTO',
      feats: ['bays'],
      bays: 2,
      dx: 6.6,
      fr: [
        ['rack', 'w', 0.4],
        ['rack', 'e', 0.4],
        ['bench', 'n', 0.5],
        ['crate', 's', 0.2]
      ],
      bk: [
        ['shelf', 'w', 0.5],
        ['shelf', 'e', 0.5],
        ['crate', 'n', 0.5],
        ['box', 's', 0.5]
      ],
      pr: [
        ['crate', -4, 2],
        ['box', 3, 2.2]
      ]
    }
  },
  'auto',
  ['tires', 'barrels'],
  ['tires', 'crates', 'trash'],
  ['wreck', 'scorch', 'beam']
);
def(
  'small_motel',
  'Small Motel',
  'commercial',
  'gen',
  {
    gen: {
      h: 3.6,
      wall: 0xd8c8a8,
      loot: 'motel',
      sign: 'MOTEL',
      sw: 6,
      feats: ['walkway', 'neon'],
      neonc: 0xef4444,
      fr: [
        ['bed', 'w', 0.3],
        ['bed', 'e', 0.3],
        ['wardrobe', 'n', 0.5],
        ['tv', 's', 0.5],
        ['desk', 'e', 0.8]
      ],
      bk: [
        ['bed', 'n', 0.3],
        ['bed', 'n', 0.75],
        ['bath', 'w', 0.9],
        ['toilet', 'e', 0.9]
      ]
    }
  },
  'motel',
  ['bin', 'bench'],
  ['mattress', 'trash', 'glass'],
  ['scorch', 'rubble', 'beam']
);
// ---- civic / public / special
def(
  'church',
  'Church',
  'civic',
  'church',
  {},
  'church',
  ['planters', 'flag'],
  ['trash', 'glass', 'graffiti'],
  ['rubble', 'beam', 'scorch']
);
def(
  'small_school',
  'Small School',
  'civic',
  'gen',
  {
    gen: {
      h: 4.5,
      wall: 0xb5784f,
      loot: 'school',
      sign: 'SCHOOL',
      feats: ['cupola'],
      fr: [
        ['desk', 'n', 0.2],
        ['desk', 'n', 0.5],
        ['desk', 'n', 0.8],
        ['desk', 's', 0.3],
        ['desk', 's', 0.7],
        ['shelf', 'w', 0.5]
      ],
      bk: [
        ['desk', 'n', 0.25],
        ['desk', 'n', 0.55],
        ['desk', 'n', 0.85],
        ['shelf', 'e', 0.5],
        ['plant', 's', 0.1]
      ]
    }
  },
  'school',
  ['flag', 'bench'],
  ['papers', 'books', 'graffiti'],
  ['beam', 'rubble', 'scorch']
);
def(
  'fire_station',
  'Fire Station',
  'civic',
  'gen',
  {
    gen: {
      h: 5,
      wall: 0xa83a2a,
      loot: 'fire',
      sign: 'FIRE DEPT',
      sw: 6,
      feats: ['bays', 'tower'],
      bays: 2,
      dx: 6.6,
      tx: -5.8,
      th: 5,
      tcol: 0x8a2a1e,
      trc: 0x333333,
      fr: [
        ['rack', 'w', 0.3],
        ['rack', 'e', 0.3],
        ['crate', 'n', 0.5],
        ['bench', 's', 0.2]
      ],
      bk: [
        ['cot', 'n', 0.2],
        ['cot', 'n', 0.5],
        ['cot', 'n', 0.8],
        ['wardrobe', 's', 0.5]
      ]
    }
  },
  'fire',
  ['flag'],
  ['crates', 'glass', 'trash'],
  ['rubble', 'scorch', 'beam']
);
def(
  'police_station',
  'Police Station',
  'civic',
  'gen',
  {
    gen: {
      h: 4.5,
      wall: 0x5a6a8a,
      loot: 'police',
      sign: 'POLICE',
      feats: ['beacon'],
      fr: [
        ['counter', 'n', 0.5],
        ['bench', 's', 0.2],
        ['bench', 's', 0.8],
        ['desk', 'e', 0.5],
        ['plant', 'w', 0.1]
      ],
      bk: [
        ['cot', 'w', 0.2],
        ['toilet', 'n', 0.1],
        ['desk', 'n', 0.5],
        ['desk', 'e', 0.7],
        ['rack', 'e', 0.3]
      ]
    }
  },
  'police',
  ['flag', 'bin'],
  ['papers', 'glass', 'blood'],
  ['scorch', 'beam', 'rubble']
);
def(
  'town_hall',
  'Town Hall',
  'civic',
  'gen',
  {
    gen: {
      h: 5.5,
      wall: 0xd8d0b8,
      loot: 'townhall',
      feats: ['columns', 'dome'],
      dome: 0x3a8a6a,
      fr: [
        ['counter', 'n', 0.5],
        ['bench', 's', 0.2],
        ['bench', 's', 0.8],
        ['plant', 'w', 0.1],
        ['plant', 'e', 0.1]
      ],
      bk: OFFICE,
      ws: 3.4
    }
  },
  'townhall',
  ['flag', 'planters'],
  ['papers', 'glass', 'trash'],
  ['beam', 'rubble', 'scorch']
);
def(
  'library',
  'Library',
  'civic',
  'gen',
  {
    gen: {
      h: 5,
      wall: 0x8a5a3a,
      roof: 'gable',
      rc: 0x3a4a5a,
      loot: 'library',
      sign: 'LIBRARY',
      pr: [
        ['aisle', -4.5, 2.4],
        ['aisle', -1.5, 2.4],
        ['aisle', 1.5, 2.4],
        ['aisle', -4.5, -0.4],
        ['aisle', -1.5, -0.4],
        ['aisle', 1.5, -0.4],
        ['counter', 5.2, 3.6]
      ],
      fr: [
        ['desk', 'e', 0.8],
        ['plant', 'w', 0.1]
      ],
      bk: [
        ['desk', 'n', 0.3],
        ['shelf', 'w', 0.5],
        ['shelf', 'e', 0.5],
        ['shelf', 'n', 0.8]
      ]
    }
  },
  'library',
  ['bench', 'planters'],
  ['books', 'papers', 'glass'],
  ['tarp', 'beam', 'rubble']
);
def(
  'cinema',
  'Cinema',
  'civic',
  'gen',
  {
    gen: {
      h: 6.5,
      wall: 0x3a2a4a,
      loot: 'cinema',
      sign: 'CINEMA',
      feats: ['marquee'],
      pr: [
        ['counter', -4, 5.2],
        ['register', -6, 5.3]
      ],
      fr: [['plant', 'e', 0.1]],
      tbl: [],
      bk: [
        ['bench', 'n', 0.2],
        ['bench', 'n', 0.5],
        ['bench', 'n', 0.8],
        ['bench', 's', 0.3],
        ['bench', 's', 0.7],
        ['crate', 'e', 0.5]
      ],
      split: -0.5
    }
  },
  'cinema',
  ['bench'],
  ['trash', 'glass', 'papers'],
  ['scorch', 'beam', 'rubble']
);
def(
  'community_centre',
  'Community Centre',
  'civic',
  'gen',
  {
    gen: {
      h: 4.5,
      wall: 0xc9b48a,
      roof: 'gable',
      rc: 0x5a4a3a,
      loot: 'community',
      sign: 'COMMUNITY',
      sw: 7,
      feats: ['porch'],
      tbl: [
        [-4, 3.6],
        [0, 3.6],
        [4, 3.6]
      ],
      bk: RM.kitchen
    }
  },
  'community',
  ['bench', 'flag'],
  ['trash', 'glass', 'crates'],
  ['beam', 'tarp', 'rubble']
);
def(
  'funeral_home',
  'Funeral Home',
  'civic',
  'gen',
  {
    gen: {
      h: 4.5,
      wall: 0xe0dcd0,
      roof: 'gable',
      rc: 0x3a3a42,
      loot: 'funeral',
      sign: 'FUNERAL HOME',
      sw: 8,
      feats: ['porch'],
      fr: [
        ['bench', 's', 0.2],
        ['bench', 's', 0.8],
        ['plant', 'w', 0.1],
        ['plant', 'e', 0.1]
      ],
      bk: [
        ['cot', 'n', 0.3],
        ['cot', 'n', 0.7],
        ['shelf', 'w', 0.5],
        ['box', 's', 0.5]
      ],
      pr: [['altar', 0, 2.2]]
    }
  },
  'funeral',
  ['planters', 'flag'],
  ['trash', 'glass', 'blood'],
  ['rubble', 'beam', 'scorch']
);
def(
  'veterinary_clinic',
  'Veterinary Clinic',
  'civic',
  'gen',
  {
    gen: {
      h: 4,
      wall: 0xb8d4c0,
      roof: 'gable',
      rc: 0x4a6a5a,
      loot: 'vet',
      sign: 'VET',
      feats: ['yardfence', 'cross_sign'],
      cross: 0x2563eb,
      fr: RM.wait,
      bk: RM.exam
    }
  },
  'vet',
  ['planters', 'bench'],
  ['papers', 'glass', 'blood'],
  ['tarp', 'rubble', 'beam']
);
def(
  'storage_building',
  'Storage Building',
  'civic',
  'gen',
  {
    gen: {
      h: 4,
      wall: 0x8a8f94,
      loot: 'storage',
      sign: 'SELF STORAGE',
      sw: 8,
      feats: ['bays'],
      bays: 3,
      bayc: 0xea7a1a,
      dx: -6.8,
      fr: [
        ['crate', 'n', 0.1],
        ['crate', 'n', 0.4],
        ['crate', 'n', 0.7],
        ['box', 's', 0.5],
        ['shelf', 'w', 0.5]
      ],
      bk: [
        ['crate', 'n', 0.1],
        ['crate', 'n', 0.4],
        ['crate', 'n', 0.7],
        ['shelf', 'e', 0.5],
        ['box', 's', 0.4]
      ]
    }
  },
  'storage',
  ['pallets'],
  ['crates', 'trash', 'pallets'],
  ['rubble', 'tarp', 'beam']
);
def(
  'barn',
  'Barn',
  'civic',
  'gen',
  {
    gen: {
      h: 6,
      wall: 0x8a2a22,
      roof: 'gable',
      rc: 0x4a4a4a,
      loot: 'barn',
      feats: ['xdoors', 'silo', 'loft'],
      split: -3,
      fr: [
        ['lumber', 'w', 0.5],
        ['crate', 'e', 0.3],
        ['crate', 'e', 0.7],
        ['box', 's', 0.5]
      ],
      bk: [
        ['lumber', 'n', 0.3],
        ['crate', 'n', 0.7],
        ['shelf', 'w', 0.5],
        ['crate', 'e', 0.5]
      ],
      pr: [['crate', -3, 2.6]]
    }
  },
  'barn',
  ['barrels', 'pallets'],
  ['crates', 'barrels', 'trash'],
  ['beam', 'tarp', 'rubble']
);
def(
  'utility_building',
  'Utility Building',
  'civic',
  'gen',
  {
    gen: {
      h: 4,
      wall: 0x7a8088,
      loot: 'utility',
      sign: 'POWER CO',
      sw: 5,
      feats: ['mast'],
      fr: [
        ['crate', 'n', 0.2],
        ['shelf', 'w', 0.5],
        ['shelf', 'e', 0.5],
        ['rack', 's', 0.5]
      ],
      bk: [
        ['crate', 'n', 0.2],
        ['crate', 'n', 0.6],
        ['shelf', 'e', 0.5],
        ['box', 's', 0.5]
      ]
    }
  },
  'utility',
  ['barrels'],
  ['trash', 'crates', 'tires'],
  ['scorch', 'beam', 'rubble']
);
def(
  'water_tower',
  'Water Tower',
  'civic',
  'gen',
  {
    gen: {
      h: 4,
      wall: 0x9aa0a8,
      loot: 'water',
      sign: 'WATER',
      sw: 4,
      feats: ['tank'],
      fr: [
        ['crate', 'n', 0.2],
        ['crate', 'e', 0.5],
        ['shelf', 'w', 0.5]
      ],
      bk: [
        ['crate', 'n', 0.3],
        ['box', 'n', 0.7],
        ['shelf', 'e', 0.5],
        ['rack', 'w', 0.5]
      ]
    }
  },
  'water',
  ['barrels'],
  ['barrels', 'trash', 'crates'],
  ['rubble', 'beam', 'scorch']
);

function validateCatalogue(cat = CATALOGUE) {
  const E = [],
    ids = new Set(),
    CATS = ['residential', 'commercial', 'civic'];
  if (!Array.isArray(cat) || cat.length < 40) E.push('catalogue too small (' + (cat && cat.length) + ')');
  for (const d of cat) {
    const n = (d && d.id) || '(unnamed)';
    if (!d.id || !/^[a-z][a-z0-9_]*$/.test(d.id)) E.push(n + ': bad id');
    if (ids.has(d.id)) E.push(n + ': duplicate id');
    ids.add(d.id);
    if (!d.name) E.push(n + ': missing name');
    if (!CATS.includes(d.category)) E.push(n + ': bad category');
    if (d.footprint !== 'standard' || d.w !== STD.w || d.d !== STD.d) E.push(n + ': must use the standard footprint');
    if (d.front !== AUTHORED_FRONT)
      E.push(n + ': designated front must be "' + AUTHORED_FRONT + '" (the authoring direction)');
    if (!BUILDERS[d.builder]) E.push(n + ': unknown builder ' + d.builder);
    if (d.builder === 'gen' && !d.gen) E.push(n + ': missing gen config');
    if (d.builder === 'house' && !d.hv) E.push(n + ': missing hv config');
    if (!LOOT_TABLES[d.loot]) E.push(n + ': unknown loot table ' + d.loot);
    if (d.gen) {
      const fe = d.gen.feats || [];
      fe.forEach(f => {
        if (!FEAT[f]) E.push(n + ': unknown feature ' + f);
      });
    }
    if (d.hv && d.hv.feats)
      d.hv.feats.forEach(f => {
        if (!FEAT[f]) E.push(n + ': unknown feature ' + f);
      });
    const ks = d.variants ? Object.keys(d.variants) : [];
    if (ks.length !== 3 || COND_NAMES.some(c => !d.variants || !d.variants[c]))
      E.push(n + ': needs exactly the variants ' + COND_NAMES.join('/'));
    for (const c of COND_NAMES) {
      const v = d.variants && d.variants[c];
      if (!v || !Array.isArray(v.props)) {
        E.push(n + ': variant ' + c + ' has no props list');
        continue;
      }
      v.props.forEach(p => {
        if (!CP[p]) E.push(n + ': ' + c + ' uses unknown prop ' + p);
      });
    }
    if (d.variants && d.variants.looted && d.variants.ruined && d.variants.intact) {
      const L = d.variants.looted.props,
        R = d.variants.ruined.props;
      if (L.length < 2 || R.length < 2) E.push(n + ': looted/ruined need at least 2 condition props');
      if (!L.some(p => CP_DISTURB.includes(p))) E.push(n + ': looted variant has no scavenging/disturbance prop');
      if (!R.some(p => CP_STRUCT.includes(p))) E.push(n + ': ruined variant has no structural-damage prop');
      if (L.some(p => CP_STRUCT.includes(p))) E.push(n + ': looted variant must not carry structural-damage props');
      if (L.join() === R.join()) E.push(n + ': looted and ruined variants are identical');
    }
  }
  return E;
}
{
  const e = validateCatalogue();
  window.__catalogueErrors = e;
  if (e.length) {
    const m = 'BUILDING CATALOGUE INVALID — refusing to start:\n' + e.join('\n');
    console.error(m);
    const b = document.createElement('pre');
    b.style.cssText =
      'position:fixed;z-index:99999;inset:10px;background:#300;color:#fdd;padding:12px;overflow:auto;font:12px monospace';
    b.textContent = m;
    document.body.appendChild(b);
    throw new Error(m);
  }
}

// ------------------------------------------------------------ rendering: roads, alleys, plots
function drawStreets(L) {
  const R = GRID.ROAD,
    F = (w, d, c, x, z, y) => {
      const m = mesh(new THREE.PlaneGeometry(w, d), c, x, y, z);
      m.rotation.x = -PI / 2;
      return m;
    };
  L.roads.forEach(r => F(r.x1 - r.x0, r.z1 - r.z0, 0x2a2d33, (r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, 0.01));
  L.alleys.forEach(r => F(r.x1 - r.x0, r.z1 - r.z0, 0x222429, (r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2, 0.012));
  const dg = new THREE.PlaneGeometry(2.4, 0.16),
    dm = new THREE.MeshStandardMaterial({color: 0xd9b82a, roughness: 0.9}),
    ck = new THREE.MeshStandardMaterial({color: 0x14161a, roughness: 1});
  /* v056: markings are batched into one mesh per material, kept out of perf's merge (kind 'mark') and drawn with a strong depth bias:
    the long perimeter roads are unmerged and carry their own polygonOffset, which beat the 1 cm lift of merged dashes beyond a few metres */
  const MK = new Map(),
    mkO = new THREE.Object3D(),
    mkAdd = (geo, mat, x, y, z, rx, rz) => {
      let a = MK.get(mat);
      if (!a) MK.set(mat, (a = []));
      mkO.position.set(x, y, z);
      mkO.rotation.set(rx, 0, rz);
      mkO.updateMatrix();
      const g = geo.index ? geo.toNonIndexed() : geo.clone();
      g.applyMatrix4(mkO.matrix);
      a.push(g);
    };
  const mkFlush = () => {
    for (const [mat, gs] of MK) {
      let n = 0;
      for (const g of gs) n += g.attributes.position.count;
      const P = new Float32Array(n * 3),
        N = new Float32Array(n * 3);
      let o = 0;
      for (const g of gs) {
        P.set(g.attributes.position.array, o * 3);
        N.set(g.attributes.normal.array, o * 3);
        o += g.attributes.position.count;
        g.dispose();
      }
      const bg = new THREE.BufferGeometry();
      bg.setAttribute('position', new THREE.BufferAttribute(P, 3));
      bg.setAttribute('normal', new THREE.BufferAttribute(N, 3));
      bg.computeBoundingSphere();
      mat.polygonOffset = true;
      mat.polygonOffsetFactor = -8;
      mat.polygonOffsetUnits = -16;
      const m = new THREE.Mesh(bg, mat);
      m.receiveShadow = true;
      m.userData = {kind: 'mark'};
      m.raycast = () => {};
      scene.add(m);
    }
  };
  const dash = (x, z, ry) => mkAdd(dg, dm, x, 0.022, z, -PI / 2, ry),
    vs = L.roads.filter(r => r.kind.includes('vertical') || r.kind.endsWith('west') || r.kind.endsWith('east'));
  const hz = [
    ...new Set(
      L.roads
        .filter(r => r.kind.includes('horizontal') || r.kind === 'perimeter-north' || r.kind === 'perimeter-south')
        .map(r => (r.z0 + r.z1) / 2)
    )
  ];
  for (const r of L.roads) {
    const horiz = r.x1 - r.x0 > r.z1 - r.z0;
    if (horiz) {
      const zc = (r.z0 + r.z1) / 2;
      for (let x = r.x0 + 3; x < r.x1 - 3; x += 5.4) {
        if (vs.some(v => x + 1.2 > v.x0 - 1 && x - 1.2 < v.x1 + 1)) continue;
        dash(x + 1.2, zc, 0);
      }
    } else {
      const xc = (r.x0 + r.x1) / 2;
      for (let z = r.z0 + 3; z < r.z1 - 3; z += 5.4) {
        if (z - r.z0 < R * 0.7 || r.z1 - z < R * 0.7) continue;
        dash(xc, z + 1.2, PI / 2);
      }
    }
  }
  const areas = L.roads.map(r => (r.x1 - r.x0) * (r.z1 - r.z0)),
    tot = areas.reduce((a, b) => a + b, 0);
  const pickRoad = () => {
    let k = Math.random() * tot;
    for (let i = 0; i < areas.length; i++) {
      if ((k -= areas[i]) <= 0) return L.roads[i];
    }
    return L.roads[0];
  };
  for (let i = 0; i < 46; i++) {
    const r = pickRoad(),
      cg = new THREE.PlaneGeometry(rnd(1.5, 4), 0.05),
      ca = rnd(0, 3.1);
    mkAdd(cg, ck, rnd(r.x0 + 0.5, r.x1 - 0.5), 0.016, rnd(r.z0 + 0.5, r.z1 - 0.5), -PI / 2, ca);
  }
  for (let i = 0; i < 12; i++) {
    const r = pickRoad();
    mkAdd(
      new THREE.CircleGeometry(rnd(0.45, 1), 10),
      ck,
      rnd(r.x0 + 1.5, r.x1 - 1.5),
      0.017,
      rnd(r.z0 + 1.5, r.z1 - 1.5),
      -PI / 2,
      0
    );
  }
  mkFlush();
  for (const a of L.alleys) {
    const zc = (a.z0 + a.z1) / 2;
    for (let k = 0; k < 2; k++) {
      const x = rnd(a.x0 + 6, a.x1 - 6),
        side = Math.random() < 0.5 ? -1 : 1,
        d = mesh(BX(2, 1.3, 1.1), 0x2f4f3a, x, 0.65, zc + side * 1.3);
      d.rotation.y = rnd(-0.15, 0.15);
      addSolid(d);
      mesh(BX(2.1, 0.1, 1.2), 0x1f3a2a, x, 1.35, zc + side * 1.3);
    }
    for (let k = 0; k < 7; k++) {
      const m = mesh(
        new THREE.IcosahedronGeometry(0.3, 0),
        PK([0x1c2a1c, 0x222222, 0x3a3a2a]),
        rnd(a.x0 + 1, a.x1 - 1),
        0.2,
        zc + rnd(-1.4, 1.4)
      );
      m.scale.set(1, 0.7, 1);
    }
    for (let k = 0; k < 4; k++) {
      const m = mesh(BX(0.5, 0.4, 0.4), 0x8a6a3a, rnd(a.x0 + 2, a.x1 - 2), 0.2, zc + rnd(-1.5, 1.5));
      m.rotation.y = rnd(0, 3);
    }
  }
}
function drawPlot(p, cat) {
  const F = (w, d, c, x, z, y) => {
    const m = mesh(new THREE.PlaneGeometry(w, d), c, x, y, z);
    m.rotation.x = -PI / 2;
    return m;
  };
  F(GRID.PW, GRID.PD, {residential: 0x2d3b26, commercial: 0x3b3c3e, civic: 0x3a4036}[cat], p.cx, p.cz, 0.008);
  F(GRID.PW, 1.6, 0x585a5d, p.cx, p.front === 'north' ? p.z0 + 0.8 : p.z1 - 0.8, 0.016);
}

// ===== v036 block begins =====

// ===================================================================================================================
//  v036 — AUTHENTIC PROPERTY CATALOGUE (INTACT PHASE) + DUAL SUB-PLOT MAP GENERATOR
//  The legacy v032 catalogue (CATALOGUE / planTownLegacy / townLegacy) is QUARANTINED below: preserved, never selected.
//  Zones (per 40x36 plot, front = +Z in building-local space): frontage ~15-20%, structure ~60-70%, rear service ~15-20%.
//  HALF lot (sub-plot 20x36): building 16x22 centred -> 7m frontage / 7m rear.  BIG lot (40x36): building 30x23 -> 6.5m / 6.5m.
// ===================================================================================================================
const HALFD = Object.freeze({w: 16, d: 22, fz: 7, rz: 7}),
  BIGD = Object.freeze({w: 30, d: 23, fz: 6.5, rz: 6.5});
const WX = (B, l) => B.x + B.cs * l,
  WZ = (B, l) => B.z + B.cs * l;
const wins = a => a.map(c => ({k: 'w', c}));
const slab = (B, x0, x1, z0, z1, y0, y1, col, walk) => {
  const m = mesh(BX(x1 - x0, y1 - y0, z1 - z0), col, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, B.g);
  const b = addSolid(m);
  if (walk) walkables.push(b);
  return m;
};
const deco = (B, w, h, d, x, y, z, col, em) => {
  const m = mesh(BX(w, h, d), col, x, y, z, B.g);
  if (em) m.material.emissive.setHex(em);
  return m;
};
const cyl = (B, r, h, x, y, z, col, solid, seg = 10) => {
  const m = mesh(new THREE.CylinderGeometry(r, r, h, seg), col, x, y, z, B.g);
  if (solid) addSolid(m);
  return m;
};
function tsign(par, txt, x, y, z, w, h, bg, fg, font, ry = 0) {
  const key = [txt, Math.max(32, Math.round((512 * h) / w)), bg, fg, font || '', 'v43'].join('|');
  let mt = TSC.get(key);
  if (!mt) {
    const cv = document.createElement('canvas');
    cv.width = 1024;
    cv.height = Math.max(48, Math.round((1024 * h) / w));
    const q = cv.getContext('2d');
    q.fillStyle = bg;
    q.fillRect(0, 0, cv.width, cv.height);
    q.fillStyle = fg;
    const fm = font || 'bold 72px Impact,sans-serif',
      mm = fm.match(/(\d+)px/);
    let sz = Math.min(mm ? +mm[1] * 2 : 144, Math.floor(cv.height * 0.72));
    const setF = () => {
      q.font = fm.replace(/\d+px/, sz + 'px');
    };
    setF();
    while (q.measureText(txt).width > cv.width * 0.94 && sz > 16) {
      sz -= 2;
      setF();
    }
    q.textAlign = 'center';
    q.textBaseline = 'middle';
    q.fillText(txt, cv.width / 2, cv.height / 2 + sz * 0.04);
    mt = new THREE.MeshBasicMaterial({map: new THREE.CanvasTexture(cv)});
    TSC.set(key, mt);
  }
  if (w >= 3 && h >= 0.8 && y >= 4 && z > 10.5 && z < 13) {
    w *= 1.25;
    h *= 1.25;
    z += 0.3;
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mt);
  m.position.set(x, y, z);
  m.rotation.y = ry;
  par.add(m);
  return m;
}
function glassP(B, x, y, z, w, h, ry = 0) {
  const m = mesh(BX(w, h, 0.08), 0x9cc8e8, x, y, z, B.g);
  m.rotation.y = ry;
  m.material.transparent = true;
  m.material.opacity = 0.3;
  m.material.depthWrite = false;
  addSolid(m);
  return m;
}
function stairs(B, x, zFrom, dz, n, rise, run, wid, col) {
  for (let i = 0; i < n; i++) {
    const a = zFrom + dz * i * run,
      b = zFrom + dz * (i + 1) * run;
    slab(B, x - wid / 2, x + wid / 2, Math.min(a, b), Math.max(a, b), 0, (i + 1) * rise, col || 0x8a8a82, true);
  }
}
function subB(B, lx, lz, w, d, h, wall, fl, dc, flip) {
  const cs0 = CUR.cs;
  CUR.cs = flip ? -B.cs : B.cs;
  const S = mk(WX(B, lx), WZ(B, lz), w, d, h, wall, fl, dc);
  CUR.cs = cs0;
  return S;
}

Object.assign(FT, {
  stan: [
    1.6,
    0.3,
    [
      [0.1, 1, 0.1, -0.7, 0.5, 0, 0xc8a020],
      [0.1, 1, 0.1, 0.7, 0.5, 0, 0xc8a020],
      [1.4, 0.04, 0.04, 0, 0.95, 0, 0xaa2020]
    ],
    1
  ],
  safe: [
    1,
    1,
    [
      [1, 1.2, 1, 0, 0.6, 0, 0x3a3a40],
      [0.5, 0.5, 0.05, 0, 0.7, 0.52, 0x8a8a90]
    ]
  ],
  vault: [
    2.4,
    0.6,
    [
      [2.4, 2.3, 0.6, 0, 1.15, 0, 0x4a4f55],
      [2.2, 0.08, 0.62, 0, 0.5, 0, 0x8a8f95],
      [2.2, 0.08, 0.62, 0, 1.1, 0, 0x8a8f95],
      [2.2, 0.08, 0.62, 0, 1.7, 0, 0x8a8f95]
    ]
  ],
  machine: [
    1,
    0.9,
    [
      [1, 1.8, 0.9, 0, 0.9, 0, 0xaa2222],
      [0.7, 0.6, 0.05, 0, 1.2, 0.47, 0x88ccee]
    ]
  ],
  washer: [
    0.9,
    0.8,
    [
      [0.9, 0.95, 0.8, 0, 0.47, 0, 0xe5e7eb],
      [0.5, 0.5, 0.05, 0, 0.55, 0.42, 0x223344]
    ]
  ],
  dryer: [
    0.9,
    0.8,
    [
      [0.9, 0.95, 0.8, 0, 0.47, 0, 0xc9d2d8],
      [0.5, 0.5, 0.05, 0, 0.55, 0.42, 0x442222]
    ]
  ],
  manne: [
    0.6,
    0.6,
    [
      [0.3, 1.4, 0.2, 0, 0.8, 0, 0xe8d8c8],
      [0.22, 0.22, 0.22, 0, 1.65, 0, 0xe8d8c8],
      [0.45, 0.6, 0.28, 0, 1.2, 0, 0x8a3a6a],
      [0.5, 0.05, 0.5, 0, 0.03, 0, 0x222222]
    ]
  ],
  mirror: [1, 0.12, [[1, 2, 0.08, 0, 1.1, 0, 0xaed4ea]]],
  locker: [
    0.9,
    0.9,
    [
      [0.9, 2.2, 0.9, 0, 1.1, 0, 0x5a6a7a],
      [0.7, 0.9, 0.05, 0, 1.1, 0.46, 0x7a8a9a]
    ]
  ],
  hood: [1.8, 0.9, [[1.8, 0.5, 0.9, 0, 2.5, 0, 0x9a9a9a]], 1],
  prack: [
    3,
    1.1,
    [
      [0.12, 4, 0.12, -1.45, 2, -0.5, 0x2a4a8a],
      [0.12, 4, 0.12, -1.45, 2, 0.5, 0x2a4a8a],
      [0.12, 4, 0.12, 1.45, 2, -0.5, 0x2a4a8a],
      [0.12, 4, 0.12, 1.45, 2, 0.5, 0x2a4a8a],
      [3, 0.1, 1.1, 0, 0.9, 0, 0xe08a1a],
      [3, 0.1, 1.1, 0, 2.1, 0, 0xe08a1a],
      [3, 0.1, 1.1, 0, 3.3, 0, 0xe08a1a],
      [0.9, 0.7, 0.8, -0.8, 1.3, 0, 0xa08050],
      [0.9, 0.7, 0.8, 0.8, 2.5, 0, 0xa08050]
    ]
  ],
  forklift: [
    1.6,
    2.6,
    [
      [1.4, 0.8, 2, 0, 0.7, 0, 0xe0a010],
      [1.2, 1.1, 1, 0, 1.4, 0.2, 0x333333],
      [0.12, 2.6, 0.12, -0.5, 1.3, -0.9, 0x555555],
      [0.12, 2.6, 0.12, 0.5, 1.3, -0.9, 0x555555],
      [0.08, 0.06, 1.2, -0.4, 0.2, -1.7, 0x777777],
      [0.08, 0.06, 1.2, 0.4, 0.2, -1.7, 0x777777]
    ]
  ],
  lane: [
    1.6,
    10,
    [
      [1.5, 0.05, 10, 0, 0.08, 0, 0xd8b070],
      [0.12, 0.06, 10, -0.8, 0.08, 0, 0x333333],
      [0.12, 0.06, 10, 0.8, 0.08, 0, 0x333333]
    ],
    1
  ],
  pinrow: [
    1.5,
    0.8,
    [
      [1.5, 1.2, 0.8, 0, 0.6, 0, 0x2a2a30],
      [0.14, 0.4, 0.14, -0.45, 1.4, 0, 0xf0f0f0],
      [0.14, 0.4, 0.14, 0, 1.4, 0, 0xf0f0f0],
      [0.14, 0.4, 0.14, 0.45, 1.4, 0, 0xf0f0f0]
    ]
  ],
  arcade: [
    0.9,
    0.8,
    [
      [0.9, 1.8, 0.8, 0, 0.9, 0, 0x3a2a6a],
      [0.7, 0.5, 0.05, 0, 1.3, 0.4, 0x55ffaa]
    ]
  ],
  bin2: [1, 1, [[0.8, 0.9, 0.8, 0, 0.45, 0, 0x555a55]]],
  ladder: [
    0.8,
    0.2,
    [
      [0.1, 3, 0.1, -0.35, 1.5, 0, 0xd08a20],
      [0.1, 3, 0.1, 0.35, 1.5, 0, 0xd08a20],
      [0.7, 0.06, 0.06, 0, 0.5, 0, 0xd08a20],
      [0.7, 0.06, 0.06, 0, 1.2, 0, 0xd08a20],
      [0.7, 0.06, 0.06, 0, 1.9, 0, 0xd08a20]
    ]
  ],
  monitor: [
    1.2,
    0.7,
    [
      [1.2, 0.75, 0.7, 0, 0.38, 0, 0x6a6a72],
      [0.6, 0.4, 0.05, 0, 1.0, -0.1, 0x111122]
    ]
  ],
  servrack: [
    0.9,
    0.9,
    [
      [0.9, 2.1, 0.9, 0, 1.05, 0, 0x2a2a30],
      [0.7, 0.1, 0.05, 0, 0.6, 0.46, 0x33ff66],
      [0.7, 0.1, 0.05, 0, 1.1, 0.46, 0x3366ff],
      [0.7, 0.1, 0.05, 0, 1.6, 0.46, 0x33ff66]
    ]
  ],
  ccase: [
    2.2,
    0.9,
    [
      [2.2, 1, 0.9, 0, 0.5, 0, 0x8a8a8a],
      [2.1, 0.06, 0.8, 0, 1.03, 0, 0xb8d8e8],
      [2.1, 0.04, 0.7, 0, 0.6, 0, 0xb8d8e8]
    ]
  ],
  gunrack: [
    1.8,
    0.3,
    [
      [1.8, 1.8, 0.1, 0, 1.2, 0, 0x2a2420],
      [1.5, 0.08, 0.3, 0, 1.9, 0.15, 0x111111],
      [1.5, 0.08, 0.3, 0, 1.3, 0.15, 0x111111]
    ]
  ],
  workbench: [
    2.2,
    0.9,
    [
      [2.2, 0.9, 0.9, 0, 0.45, 0, 0x5a4a3a],
      [0.4, 0.15, 0.5, -0.6, 1, 0, 0x777777]
    ]
  ],
  slicer: [0.8, 0.6, [[0.6, 0.3, 0.5, 0, 1.1, 0, 0xcccccc]]],
  cutblock: [1, 1, [[1, 0.9, 1, 0, 0.45, 0, 0x6a4a2a]]],
  key: [1, 0.2, [[1, 1, 0.1, 0, 1.4, 0, 0x6a5a3a]], 1],
  hbin: [
    1.2,
    0.8,
    [
      [1.2, 0.5, 0.8, 0, 0.25, 0, 0xb0b0aa],
      [1.1, 0.15, 0.7, 0, 0.6, 0, 0x777777]
    ]
  ],
  fryer: [
    0.8,
    0.8,
    [
      [0.8, 0.9, 0.8, 0, 0.45, 0, 0xaaaaaa],
      [0.6, 0.12, 0.6, 0, 0.95, 0, 0xe0a020]
    ]
  ],
  grave: [1.2, 0.4, [[1.2, 1.2, 0.3, 0, 0.6, 0, 0x8a8a88]]]
});
Object.assign(LOOT_TABLES, {
  bank: {
    painkiller: 2,
    granola: 2,
    water_jug: 2,
    duct_tape: 2,
    medkit: 1,
    ammo_9mm: 2,
    ammo_45: 1,
    beretta_9mm: 1,
    m1911a1: 1
  },
  bankvault: {
    ammo_9mm: 3,
    ammo_45: 3,
    ammo_38_fed: 2,
    ammo_357: 2,
    beretta_9mm: 2,
    m1911a1: 2,
    glock_22: 1,
    colt_python: 1,
    military_rations: 2,
    medkit: 2
  },
  coffee: {milk: 3, granola: 3, tweex: 2, brans: 2, cherry_preserves: 1, popzi_soft_drink: 1, calzones: 2, fud: 1},
  takeout: {
    ramen_noodles: 3,
    pickles: 2,
    salad: 2,
    sausages: 2,
    bacon: 1,
    popzi_soft_drink: 2,
    butcher_knife: 1,
    kenball_soup: 2
  },
  clothing: {rope: 2, duct_tape: 2, bungie_cord: 2, spray_paint: 1, cotton_balls: 1, painkiller: 1, granola: 1},
  bowling: {
    popzi_soft_drink: 3,
    colacola: 3,
    cheezholes: 3,
    tweex: 2,
    fud: 2,
    bowling_ball: 3,
    herkeys_jerkey: 2,
    baseball_bat: 1,
    granola: 1
  },
  burger: {lamburger: 4, calzones: 2, popzi_soft_drink: 3, colacola: 3, cheezholes: 2, salad: 2, fud: 2, milk: 1},
  cornmaze: {atomic_veggies: 3, pickles: 2, pitchfork: 3, sickle: 2, rope: 2, granola: 1, water_jug: 2}
});
for (const tn of ['bank', 'bankvault', 'coffee', 'takeout', 'clothing', 'bowling', 'burger', 'cornmaze'])
  for (const id in LOOT_TABLES[tn])
    if (!ITEMS[id]) throw new Error('v036 loot table ' + tn + ' has unknown item ' + id);

/* ===== v042: loot-table entries for the new items (existing weights untouched) ===== */
{
  const ADD = {
    supermarket: {
      cereo: 3,
      crackers: 3,
      '224_ramen': 2,
      apollo_meat: 1,
      potato_chips: 3,
      eat_flakes: 3,
      stugots_coffee: 2,
      sole_2_sole: 2,
      famished_guy: 2,
      salted_bacon: 1,
      salted_fish: 1,
      salted_kipper: 1,
      tampopo_ramen: 2,
      instant_ramen: 3,
      sugar: 3,
      rice: 3,
      tuna: 3,
      pickled_eggs: 1,
      sardines: 3,
      oysters: 1,
      cookies: 3,
      hairspray: 1,
      slaab_steak: 1
    },
    house: {
      cereo: 2,
      crackers: 2,
      '224_ramen': 2,
      potato_chips: 1,
      eat_flakes: 2,
      stugots_coffee: 1,
      instant_ramen: 2,
      sugar: 2,
      rice: 2,
      tuna: 2,
      sardines: 2,
      cookies: 2,
      hairspray: 2
    },
    gas: {potato_chips: 3, cookies: 2, crackers: 2, stugots_coffee: 2, salted_kipper: 1, hairspray: 1},
    convenience: {
      potato_chips: 3,
      cookies: 2,
      crackers: 2,
      stugots_coffee: 3,
      instant_ramen: 2,
      '224_ramen': 2,
      hairspray: 1,
      sardines: 1
    },
    diner: {
      apollo_meat: 1,
      salted_bacon: 1,
      sole_2_sole: 1,
      famished_guy: 2,
      tampopo_ramen: 2,
      slaab_steak: 1,
      stugots_coffee: 2,
      sugar: 1,
      rice: 1
    },
    restaurant: {
      apollo_meat: 1,
      sole_2_sole: 2,
      famished_guy: 2,
      tampopo_ramen: 2,
      oysters: 2,
      slaab_steak: 2,
      rice: 2,
      sugar: 1
    },
    takeout: {'224_ramen': 2, tampopo_ramen: 3, instant_ramen: 2, rice: 3, sole_2_sole: 2, oysters: 1, slaab_steak: 1},
    burger: {famished_guy: 3, potato_chips: 2, cookies: 1, slaab_steak: 1, sugar: 1},
    bakery: {cookies: 4, crackers: 2, cereo: 2, sugar: 3, eat_flakes: 1, stugots_coffee: 2},
    coffee: {stugots_coffee: 5, cookies: 3, sugar: 3, crackers: 1},
    butcher: {apollo_meat: 3, salted_bacon: 3, salted_fish: 2, salted_kipper: 2, slaab_steak: 3},
    liquor: {potato_chips: 2, pickled_eggs: 2, salted_kipper: 1, cookies: 1, crackers: 1},
    warehouse: {
      cereo: 2,
      crackers: 2,
      instant_ramen: 3,
      rice: 3,
      sugar: 2,
      tuna: 3,
      sardines: 3,
      eat_flakes: 2,
      salted_fish: 1,
      hairspray: 1
    },
    storage: {instant_ramen: 2, rice: 2, tuna: 2, sardines: 2, crackers: 1, hairspray: 1},
    sporting: {tuna: 2, sardines: 2, salted_fish: 1, rice: 1, crackers: 1},
    church: {cereo: 1, crackers: 2, rice: 1, sugar: 1, eat_flakes: 1},
    community: {cereo: 2, eat_flakes: 2, rice: 2, tuna: 2, sardines: 2, crackers: 2, instant_ramen: 2},
    school: {cereo: 3, eat_flakes: 3, cookies: 3, crackers: 2, potato_chips: 2, hairspray: 1},
    barn: {salted_bacon: 2, salted_fish: 1, pickled_eggs: 2, sugar: 1, rice: 1, apollo_meat: 1},
    cinema: {potato_chips: 3, cookies: 2, stugots_coffee: 1, sugar: 1},
    motel: {instant_ramen: 2, potato_chips: 2, cookies: 1, stugots_coffee: 2, hairspray: 2, '224_ramen': 1},
    office: {stugots_coffee: 3, cookies: 2, sugar: 2, crackers: 1, hairspray: 1},
    townhall: {stugots_coffee: 2, cookies: 1, crackers: 1},
    clothing: {hairspray: 3},
    laundromat: {hairspray: 2, potato_chips: 1, cookies: 1},
    bowling: {potato_chips: 2, cookies: 1, hairspray: 1},
    pharmacy: {hairspray: 3, sugar: 1},
    clinic: {hairspray: 1},
    fire: {tuna: 1, sardines: 1, crackers: 1, stugots_coffee: 1},
    funeral: {hairspray: 1},
    cornmaze: {pickled_eggs: 1, sugar: 1, cookies: 1},
    park: {potato_chips: 2, cookies: 1, stugots_coffee: 1},
    gunshop: {salted_kipper: 0}
  };
  for (const t in ADD) {
    if (!LOOT_TABLES[t]) continue;
    for (const id in ADD[t]) {
      if (!ITEMS[id]) throw new Error('v042 loot add: unknown item ' + id);
      if (ADD[t][id] > 0) LOOT_TABLES[t][id] = ADD[t][id];
    }
  }
}
Object.assign(LOOT_PROP, {
  bank: 'cabinet',
  bankvault: 'toolchest',
  coffee: 'counter',
  takeout: 'counter',
  clothing: 'cabinet',
  bowling: 'counter',
  burger: 'counter',
  cornmaze: 'crate'
});

// ---- frontage / rear-service props (local coords; front = +Z)
const PR = {
  pave: (B, x, w, z0, z1, c) => flatM(w, z1 - z0, c || 0x8e9093, x, 0.027, (z0 + z1) / 2, B.g),
  lawn: (B, x, w, z0, z1, c) => flatM(w, z1 - z0, c || 0x3f6a2f, x, 0.027, (z0 + z1) / 2, B.g),
  stalls: (B, x0, n, z0, z1, sw = 2.8) => {
    for (let i = 0; i <= n; i++) flatM(0.12, z1 - z0, 0xe8e8e0, x0 + i * sw, 0.03, (z0 + z1) / 2, B.g);
  },
  car: (B, x, z) => makeCar(WX(B, x), WZ(B, z), Math.random() < 0.5 ? 0 : PI),
  lamp: (B, x, y, z, side = -1) => {
    deco(B, 0.12, 0.12, 0.5, x, y, z + side * 0.25, 0x333333);
    deco(B, 0.3, 0.2, 0.3, x, y - 0.15, z + side * 0.5, 0xfff2a0, 0xaaaa55);
  },
  bin: (B, x, z, c) => {
    const m = cyl(B, 0.4, 0.9, x, 0.45, z, c || 0x2f5f3a, true, 8);
    return m;
  },
  bollard: (B, x, z, c) => cyl(B, 0.14, 1, x, 0.5, z, c || 0xf5c518, true, 8),
  dump: (B, x, z) => {
    slab(B, x - 1.1, x + 1.1, z - 0.6, z + 0.6, 0, 1.3, 0x2f4f3a);
    deco(B, 2.3, 0.1, 1.3, x, 1.35, z, 0x1f3a2a);
  },
  bistro: (B, x, z) => {
    const t = cyl(B, 0.5, 0.06, x, 0.78, z, 0x2a2a2a, true, 12);
    cyl(B, 0.05, 0.75, x, 0.38, z, 0x222222);
    for (const s of [-1, 1]) cyl(B, 0.22, 0.05, x + s * 0.85, 0.5, z, 0x7a5a3a, false, 8);
    return t;
  },
  chalk: (B, x, z, txt) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    B.g.add(g);
    const a = mesh(BX(0.8, 1.1, 0.06), 0x222c22, 0, 0.6, 0, g);
    tsign(g, txt, 0, 0.65, 0.04, 0.7, 0.95, '#1d2a20', '#e8e8d8', 'bold 52px Arial');
    return a;
  },
  corral: (B, x, z) => {
    for (const [w, d, px, pz] of [
      [3.6, 0.08, 0, -1],
      [0.08, 2, -1.8, 0],
      [0.08, 2, 1.8, 0],
      [3.6, 0.08, 0, 1]
    ]) {
      const m = mesh(BX(w, 0.9, d), 0x8a8f94, x + px, 0.55, z + pz, B.g);
      addSolid(m);
    }
    for (let i = 0; i < 4; i++) deco(B, 0.9, 0.6, 0.6, x - 1.2 + i * 0.8, 0.55 + i * 0.04, z, 0xa0a8b0);
  },
  pump: (B, x, z) => {
    slab(B, x - 3.2, x + 3.2, z - 0.55, z + 0.55, 0, 0.2, 0x8a8a88);
    slab(B, x - 0.35, x + 0.35, z - 0.3, z + 0.3, 0.2, 1.7, 0xdddddd);
    deco(B, 0.5, 0.5, 0.1, x, 1.3, z + 0.32, 0x222222);
    cyl(B, 0.1, 0.2, x, 1.8, z, 0xcc2222);
  },
  tile: (B, x, z, w, d) => {
    flatM(w, d, 0xdcdcd4, x, 0.03, z, B.g);
    for (let i = 0; i < w; i++)
      for (let j = 0; j < d; j++)
        if ((i + j) % 2) flatM(1, 1, 0x3a3a3a, x - w / 2 + 0.5 + i, 0.032, z - d / 2 + 0.5 + j, B.g);
  }
};
function rearDoorBits(B, x, wallZ, lampY = 3.1) {
  PR.lamp(B, x, lampY, wallZ);
  PR.pave(B, x, 3.2, wallZ - 3, wallZ, 0x7a7c7e);
}

// ---- generic property builder (shell + data-driven rooms)
function pb(x, z, t, o) {
  const w = o.w,
    d = o.d,
    h = o.h || 4.5,
    dx = o.dx || 0,
    bd = o.bd !== undefined ? o.bd : 0;
  const B = mk(x, z, w, d, h, o.wall, o.floor || 0x8a8a82, o.door || 0x3a3a3a);
  B.dx = dx;
  const P = {th: 0.2, c: o.pc || 0xcbbfae};
  shell(B, {
    f: o.f || [...fw(w, dx, o.ws || 3.4), {k: 'd', c: dx}],
    b: o.b || [...fw(w, bd, 3.6), {k: 'd', c: bd, s: -1}],
    l: o.l || fw(d, 99, 3.6),
    r: o.r || fw(d, 99, 3.6)
  });
  (o.walls || []).forEach(a => WL(B, a[0], a[1], a[2], a[3], a[4] || [], h, P));
  (o.rooms || []).forEach(r => {
    if (r.f) furn(B, r.f, r.r);
    if (r.loot) rc(B, r.loot, r.r, r.n || 1);
  });
  const ctr = (o.put || []).filter(p => p[0] === 'counter');
  (o.put || []).forEach(p => {
    if (p[0] !== 'register') return put(B, ...p);
    let c = ctr[0];
    for (const q of ctr) if (Math.hypot(q[1] - p[1], q[2] - p[2]) < Math.hypot(c[1] - p[1], c[2] - p[2])) c = q;
    if (c) {
      deco(B, 0.5, 0.3, 0.4, c[1] + 0.5, 1.17, c[2], 0x2a2a2e);
      deco(B, 0.3, 0.2, 0.04, c[1] + 0.5, 1.35, c[2] - 0.14, 0x55ccaa);
    }
  });
  if (o.x) o.x(B);
  if (o.roof !== false) roof(B, h, o.roof || 'flat', o.rc || 0x4a4a48);
  if (o.sign) sign(B, o.sign, o.sw || 5);
  done(B, t.id, o.z ? ri(o.z[0], o.z[1]) : w > 20 ? ri(1, 4) : ri(0, 2));
  LASTB = B;
  return B;
}
const X0 = -7.8,
  X1 = 7.8,
  Z0 = -10.8,
  Z1 = 10.8; // half-lot interior extents

// ================= POOL 1: HALF-LOTS (16x22 footprint, 7m frontage + 7m rear) =================
function hBank(x, z, t) {
  return pb(x, z, t, {
    w: 16,
    d: 22,
    h: 4.8,
    wall: 0xbfae8c,
    floor: 0xc9c3b4,
    dx: 0,
    bd: 0,
    f: [...wins([-6, -3.4, 3.4, 6]), {k: 'd', c: 0}],
    b: [
      {k: 'w', c: -5.5},
      {k: 'w', c: 5.5},
      {k: 'd', c: 0, s: -1}
    ],
    walls: [
      [1, -3.2, X0, X1, [{k: 'g', c: 0}]],
      [0, -1, Z0, -3.3, [{k: 'd', c: -6.5}]],
      [0, 1, Z0, -3.3, [{k: 'd', c: -6.5, s: -1}]]
    ],
    rooms: [
      {
        r: [X0, -1.15, Z0, -3.4],
        f: [
          ['desk', 'n', 0.5],
          ['wardrobe', 'w', 0.2],
          ['wardrobe', 'w', 0.8],
          ['shelf', 'e', 0.5],
          ['plant', 'e', 0.1]
        ],
        loot: 'bank',
        n: 1
      },
      {
        r: [1.15, X1, Z0, -3.4],
        f: [
          ['vault', 'n', 0.15],
          ['vault', 'n', 0.85],
          ['vault', 'e', 0.5],
          ['safe', 's', 0.2]
        ],
        loot: 'bankvault',
        n: 2
      },
      {
        r: [X0, X1, -3.0, 2.3],
        f: [
          ['stool', 'c', 0.15, 0, 0],
          ['stool', 'c', 0.38, 0, 0],
          ['stool', 'c', 0.62],
          ['stool', 'c', 0.85]
        ],
        loot: 'bank',
        n: 1
      },
      {
        r: [X0, X1, 4, Z1],
        f: [
          ['machine', 'e', 0.1],
          ['bench', 'w', 0.7],
          ['plant', 'n', 0.05]
        ],
        loot: 'bank',
        n: 1
      }
    ],
    put: [
      ['counter', -6.6, 3.1],
      ['counter', -4.15, 3.1],
      ['counter', 4.15, 3.1],
      ['counter', 6.6, 3.1],
      ['register', -5.4, 2.4],
      ['register', 5.4, 2.4],
      ['stan', -3.5, 7],
      ['stan', -3.5, 8.6],
      ['stan', -3.5, 5.4]
    ],
    x: B => {
      for (const px of [-6.6, -4.15, 4.15, 6.6]) {
        glassP(B, px, 1.6, 3.1, 2.4, 1.3);
        deco(B, 0.5, 0.05, 0.4, px, 1.02, 3.1, 0x9aa0a8);
      }
      const v = mesh(new THREE.TorusGeometry(1, 0.14, 8, 18), 0x666a70, 1, 1.4, -6.5, B.g);
      v.rotation.y = PI / 2;
      tsign(B.g, 'PIETY MUTUAL BANK', 0, 5.4, 11.12, 9, 1.3, '#0d2a52', '#d8c27a');
      PR.pave(B, 0, 16, 11, 14, 0xb4b4ae);
      PR.tile(B, 0, 12.6, 4, 3);
      for (const s of [-1, 1]) {
        slab(B, s * 6.6 - 0.6, s * 6.6 + 0.6, 12.8, 13.6, 0, 0.5, 0x6b4a2e);
        deco(B, 1, 0.3, 0.6, s * 6.6, 0.65, 13.2, 0x3a7a3a);
        PR.bollard(B, s * 3.2, 14.2, 0x888888);
      }
      tsign(B.g, 'BANK', -9.1, 2.2, 13.9, 0.1, 0.1, '#000', '#000');
      rearDoorBits(B, 0, -11.2);
      PR.bin(B, 5, -12.2);
      PR.bin(B, 6.4, -12.2);
    }
  });
}

function hClinic(x, z, t) {
  return pb(x, z, t, {
    w: 16,
    d: 22,
    h: 4.2,
    wall: 0xaec4d4,
    floor: 0xcfd8dc,
    door: 0x6a7a8a,
    pc: 0xe8eef0,
    dx: 0,
    bd: 0,
    f: [...wins([-6, -3.4, 3.4, 6]), {k: 'd', c: 0}],
    walls: [
      [1, 1.2, X0, X1, [{k: 'd', c: 0}]],
      [
        0,
        -1.2,
        Z0,
        1.1,
        [
          {k: 'd', c: -2.3},
          {k: 'd', c: -8.3}
        ]
      ],
      [
        0,
        1.2,
        Z0,
        1.1,
        [
          {k: 'd', c: -2.3, s: -1},
          {k: 'd', c: -8.3, s: -1}
        ]
      ],
      [1, -5.7, X0, -1.3, []],
      [1, -5.7, 1.3, X1, []]
    ],
    rooms: [
      {r: [X0, -1.35, -5.55, 1.05], f: RM.exam, loot: 'clinic'},
      {r: [1.35, X1, -5.55, 1.05], f: RM.exam, loot: 'clinic'},
      {r: [X0, -1.35, Z0, -5.85], f: RM.pharm, loot: 'clinic', n: 2},
      {
        r: [1.35, X1, Z0, -5.85],
        f: [
          ['toilet', 'n', 0.2],
          ['sink', 'e', 0.8],
          ['plant', 's', 0.1]
        ]
      },
      {r: [X0, X1, 1.4, Z1], f: RM.wait, loot: 'clinic'}
    ],
    x: B => {
      glassP(B, 0, 1.5, 5.2, 2.2, 0.9);
      tsign(B.g, 'CHECK IN', 0, 2.3, 5.2, 1.6, 0.4, '#e8eef0', '#1d4ed8', 'bold 40px Arial');
      tsign(B.g, 'PIETY MEDICAL CLINIC', 0, 5.5, 11.12, 8, 1, '#e8eef0', '#0d6a8a');
      deco(B, 2.4, 0.3, 0.1, 6.4, 4.9, 11.1, 0xcc2222);
      deco(B, 0.8, 2, 0.1, 6.4, 4.9, 11.1, 0xcc2222);
      for (const px of [-6, -3.4, 3.4, 6])
        tsign(B.g, 'OPEN', px, 2.6, 11.1, 0.7, 0.25, '#e8eef0', '#1d6a3a', 'bold 22px Arial');
      PR.pave(B, 0, 16, 11, 13.2, 0xb4b4ae);
      const r = mesh(BX(2, 0.14, 4), 0x9a9a94, -5, 0.15, 13, B.g);
      r.rotation.x = 0.08;
      for (const s of [-1, 1]) deco(B, 0.06, 0.9, 4, -5 + s * 1, 0.6, 13, 0x8a8f94);
      PR.stalls(B, -8, 6, 14, 17.5, 2.7);
      PR.car(B, 2.6, 15.4);
      rearDoorBits(B, 0, -11.2);
      PR.bin(B, 5, -12.2);
    }
  });
}

function hCoffee(x, z, t) {
  return pb(x, z, t, {
    w: 16,
    d: 22,
    h: 4,
    wall: 0x8a5a3a,
    floor: 0x9a8060,
    door: 0x4a2c14,
    dx: 0,
    bd: -4,
    f: [...wins([-6, -3.4, 3.4, 6]), {k: 'd', c: 0}],
    walls: [
      [
        1,
        -2.6,
        X0,
        X1,
        [
          {k: 'd', c: -4},
          {k: 'g', c: 3}
        ]
      ]
    ],
    rooms: [
      {r: [X0, X1, Z0, -2.8], f: RM.kitchen, loot: 'coffee', n: 2},
      {
        r: [X0, X1, -2.4, Z1],
        f: [
          ['plant', 'w', 0.05],
          ['plant', 'e', 0.05]
        ],
        loot: 'coffee',
        n: 1
      }
    ],
    put: [
      ['counter', -5.6, 1.4],
      ['counter', -3.2, 1.4],
      ['counter', -0.8, 1.4],
      ['register', 1.5, 1.2],
      ['freezer', 4.7, 1.1],
      ['stove', -5.6, 0.3],
      ['table', -5, 6.6],
      ['table', 0, 6.6],
      ['table', 5, 6.6],
      ['table', -5, 9.2],
      ['table', 5, 9.2],
      ['box', 6.8, -5],
      ['box', 6.8, -6],
      ['box', -6.8, -9.8]
    ],
    x: B => {
      for (const px of [-5, 0, 5]) {
        put(B, 'chair', px - 0.4, 5.6);
        put(B, 'chair', px + 0.4, 5.6);
        put(B, 'chair', px - 0.4, 7.6, PI);
        put(B, 'chair', px + 0.4, 7.6, PI);
      }
      deco(B, 1, 0.7, 0.7, -6, 1.35, 1.4, 0x777777);
      deco(B, 1.8, 0.5, 0.5, -4.2, 1.2, 1.1, 0xcfe8f0);
      FEAT.awning(B, {awn: [0x5a2a1a, 0xe8d8b8]});
      tsign(B.g, 'CUPPA JOE', 0, 4.9, 11.12, 5, 1, '#3a2414', '#f0d8a8');
      PR.pave(B, 0, 16, 11, 13.5, 0xb4b4ae);
      PR.chalk(B, -3.4, 12.4, 'TODAY: JOE');
      PR.bistro(B, 5, 13.2);
      PR.bistro(B, -6, 13.4);
      PR.bin(B, 2.6, 12.2);
      rearDoorBits(B, -4, -11.2);
      PR.dump(B, 5, -14);
    }
  });
}

function hFoo(x, z, t) {
  return pb(x, z, t, {
    w: 16,
    d: 22,
    h: 4,
    wall: 0x7a2a2a,
    floor: 0x8a8a82,
    door: 0x2a2a2a,
    dx: 0,
    bd: 0,
    f: [...wins([-6, -3.4, 3.4, 6]), {k: 'd', c: 0}],
    walls: [
      [
        1,
        4.2,
        X0,
        X1,
        [
          {k: 'g', c: -4},
          {k: 'g', c: 4}
        ]
      ],
      [1, -4.4, X0, X1, [{k: 'd', c: 0}]]
    ],
    rooms: [
      {
        r: [X0, X1, Z0, -4.6],
        f: [
          ['shelf', 'n', 0.15],
          ['shelf', 'n', 0.55],
          ['freezer', 'w', 0.5],
          ['crate', 'e', 0.5],
          ['box', 's', 0.5]
        ],
        loot: 'takeout',
        n: 2
      },
      {r: [X0, X1, -4.2, 3.9], loot: 'takeout', n: 1},
      {r: [X0, X1, 5.8, Z1], loot: 'takeout', n: 1}
    ],
    put: [
      ['counter', -2.4, 5.3],
      ['counter', 0, 5.3],
      ['counter', 2.4, 5.3],
      ['register', -1.2, 4.7],
      ['stove', -6.8, -3.4],
      ['stove', -5.8, -3.4],
      ['stove', -4.8, -3.4],
      ['stove', -3.8, -3.4],
      ['fryer', -2.6, -3.4],
      ['fryer', -1.6, -3.4],
      ['counter', 2.6, -3.4],
      ['counter', 5.1, -3.4],
      ['counter', -1, 1.2],
      ['counter', 1.4, 1.2],
      ['hood', -5.3, -3.6],
      ['hood', -2.1, -3.6],
      ['sink', 7.2, 0.5],
      ['bench', -6, 8],
      ['bench', 6, 8]
    ],
    x: B => {
      tsign(B.g, "MR. FOO'S TAKEOUT", 0, 4.9, 11.14, 6, 1.2, '#1a0a0a', '#ff3a3a', 'bold 80px Impact');
      deco(B, 5.6, 0.1, 0.2, 0, 4.2, 11.35, 0xff3a3a, 0xaa1010);
      tsign(B.g, 'MENU 1 2 3 4 5', -5.4, 3.1, 11.12, 2.4, 0.8, '#111', '#ffe060', 'bold 40px Arial');
      for (let i = 0; i < 5; i++) {
        const l = mesh(new THREE.SphereGeometry(0.3, 8, 6), 0xd81818, -6 + i * 3, 3.6, 11.8, B.g);
        l.material.emissive.setHex(0x661111);
      }
      PR.pave(B, 0, 16, 11, 13.5, 0xb4b4ae);
      PR.bin(B, -6, 12.4);
      PR.bin(B, 6.4, 12.4);
      rearDoorBits(B, 0, -11.2);
      PR.bin(B, -3, -12.4);
      PR.dump(B, 4, -14.5);
    }
  });
}

function hRay(x, z, t) {
  const rooms = [],
    walls = [
      [1, 3.8, X0, X1, [{k: 'd', c: 0}]],
      [
        0,
        -1.4,
        Z0,
        3.7,
        [
          {k: 'd', c: 1.75},
          {k: 'd', c: -2.15},
          {k: 'd', c: -6.05}
        ]
      ],
      [
        0,
        1.4,
        Z0,
        3.7,
        [
          {k: 'd', c: 1.75, s: -1},
          {k: 'd', c: -2.15, s: -1},
          {k: 'd', c: -6.05, s: -1}
        ]
      ]
    ];
  for (const zc of [-0.2, -4.1, -8]) walls.push([1, zc, X0, -1.5, []], [1, zc, 1.5, X1, []]);
  for (const [a, b] of [
    [-0.1, 3.6],
    [-4, -0.3],
    [-7.9, -4.2]
  ]) {
    rooms.push(
      {
        r: [X0, -1.55, a, b],
        f: [
          ['locker', 'w', 0.3],
          ['crate', 'n', 0.5],
          ['box', 'e', 0.5]
        ],
        loot: 'storage'
      },
      {
        r: [1.55, X1, a, b],
        f: [
          ['crate', 'e', 0.5],
          ['locker', 'e', 0.9],
          ['box', 's', 0.5]
        ],
        loot: 'storage'
      }
    );
  }
  rooms.push({
    r: [X0, X1, 4, Z1],
    f: [
      ['desk', 'n', 0.85],
      ['chair', 'n', 0.85, 0, 1.1, PI],
      ['shelf', 'w', 0.5],
      ['plant', 'e', 0.1],
      ['box', 'e', 0.8]
    ],
    loot: 'storage'
  });
  return pb(x, z, t, {
    w: 16,
    d: 22,
    h: 4,
    wall: 0x8a9096,
    floor: 0x8a8a82,
    door: 0x4a5058,
    dx: 0,
    bd: 0,
    f: [
      {k: 'w', c: -5},
      {k: 'w', c: 5},
      {k: 'd', c: 0}
    ],
    walls,
    rooms,
    x: B => {
      deco(B, 5.6, 1.1, 0.2, -4.8, 2.5, 11.15, 0x7a8086);
      for (let i = 0; i < 6; i++) deco(B, 5.5, 0.05, 0.05, -4.8, 2 + i * 0.18, 11.28, 0x555a60);
      tsign(B.g, "RAY'S STORAGE & CONTAINMENT", 0, 5, 11.12, 9, 1, '#1a2a4a', '#f0c030', 'bold 44px Arial');
      const cm = mesh(BX(0.3, 0.25, 0.5), 0x222222, 6.8, 3.8, 11.4, B.g);
      cyl(B, 0.1, 0.2, 6.8, 3.8, 11.7, 0x333333);
      cm.rotation.x = 0.2;
      PR.pave(B, 0, 16, 11, 13.6, 0xb4b4ae);
      PR.bollard(B, -6, 12.8);
      PR.bollard(B, 6, 12.8);
      rearDoorBits(B, 0, -11.2);
      deco(B, 2.4, 0.2, 0.3, 0, 3.2, -11.3, 0x666a70);
    }
  });
}

function hFancy(x, z, t) {
  return pb(x, z, t, {
    w: 16,
    d: 22,
    h: 4.2,
    wall: 0xa85a8a,
    floor: 0xc8b8a8,
    door: 0x3a2a3a,
    dx: 0,
    bd: -4,
    f: [...wins([-6, -3.4, 3.4, 6]), {k: 'd', c: 0}],
    walls: [
      [
        1,
        -3,
        X0,
        X1,
        [
          {k: 'd', c: -4},
          {k: 'g', c: 4}
        ]
      ]
    ],
    rooms: [
      {
        r: [X0, X1, Z0, -3.2],
        f: [
          ['rack', 'n', 0.2],
          ['rack', 'n', 0.6],
          ['rack', 'w', 0.5],
          ['crate', 'e', 0.5],
          ['box', 's', 0.5]
        ],
        loot: 'clothing',
        n: 2
      },
      {
        r: [X0, X1, -2.8, 6],
        f: [
          ['rack', 'w', 0.2],
          ['rack', 'w', 0.5],
          ['rack', 'e', 0.2],
          ['rack', 'e', 0.5],
          ['mirror', 'e', 0.8]
        ],
        loot: 'clothing',
        n: 2
      }
    ],
    put: [
      ['manne', -5.6, 9.8],
      ['manne', -2.8, 9.8],
      ['manne', 2.8, 9.8],
      ['manne', 5.6, 9.8],
      ['table', -3.5, 4.8],
      ['table', 0, 4.8],
      ['table', 3.5, 4.8],
      ['counter', -5, 7],
      ['register', -5.2, 6.3],
      ['mirror', 2, -2.6, PI]
    ],
    x: B => {
      const bx = [
        [3.5, 0, -1.2],
        [3.5, -2.6, 0],
        [3.5, 2.6, 0]
      ];
      slab(B, 5, 7.6, -2.4, -0.1, 0, 0.1, 0x6a4a5a);
      deco(B, 0.1, 2.3, 2.3, 5, 1.2, -1.25, 0x7a4a6a);
      deco(B, 2.6, 2.3, 0.1, 6.3, 1.2, -2.5, 0x7a4a6a);
      deco(B, 2.6, 2.3, 0.1, 6.3, 1.2, -0.1, 0x7a4a6a);
      deco(B, 0.06, 2.1, 2.2, 5.05, 1.15, -1.25, 0xd8506a);
      tsign(B.g, 'FANCYPANTZ WEARABLES', 0, 5, 11.12, 7, 1, '#2a0a2a', '#ff9ad8', 'bold 50px Impact');
      FEAT.awning(B, {awn: [0xa83a7a, 0xf1e1ee]});
      PR.pave(B, 0, 16, 11, 13.5, 0xb4b4ae);
      for (const px of [-6, 6]) PR.bin(B, px, 12.4, 0x444444);
      PR.chalk(B, 0, 12.6, 'SALE');
      rearDoorBits(B, -4, -11.2);
      deco(B, 2.2, 0.1, 1.2, 5, 0.2, -12.2, 0xa08050);
    }
  });
}

function hAndolini(x, z, t) {
  return pb(x, z, t, {
    w: 16,
    d: 22,
    h: 4,
    wall: 0xc8b890,
    floor: 0xb0a890,
    door: 0x2a4a2a,
    dx: 3,
    bd: -6,
    f: [...wins([-6, -3.2, -0.4, 6.2]), {k: 'd', c: 3}],
    walls: [
      [
        1,
        -4,
        X0,
        X1,
        [
          {k: 'd', c: -6},
          {k: 'g', c: 4}
        ]
      ]
    ],
    rooms: [
      {
        r: [X0, X1, Z0, -4.2],
        f: [
          ['crate', 'n', 0.2],
          ['crate', 'n', 0.6],
          ['shelf', 'w', 0.5],
          ['shelf', 'e', 0.5],
          ['box', 's', 0.5]
        ],
        loot: 'convenience',
        n: 2
      },
      {r: [X0, X1, -3.8, Z1], loot: 'convenience', n: 2}
    ],
    put: [
      ['aisle', -5, 6.2],
      ['aisle', -2.6, 6.2],
      ['aisle', -0.2, 6.2],
      ['aisle', -5, 3.8],
      ['aisle', -2.6, 3.8],
      ['aisle', -0.2, 3.8],
      ['freezer', -3.3, -3.4],
      ['freezer', -1, -3.4],
      ['freezer', 1.3, -3.4],
      ['counter', 5.2, 8.6, PI / 2],
      ['register', 4.4, 9.6],
      ['shelf', 7.3, 6.6, -PI / 2],
      ['counter', 6.6, -0.6, -PI / 2],
      ['slicer', 6.8, 0.6],
      ['freezer', 6.3, -3.4] // v089: was x 3.6, in the stock-room gateway
    ],
    x: B => {
      tsign(B.g, "ANDOLINI'S GROCERIA", 0, 5, 11.12, 8, 1, '#8a1a1a', '#f4e6c0', 'bold 44px Arial');
      deco(B, 6, 0.1, 1.3, -3, 3.5, 11.5, 0x2a7a2a).rotation.x = 0.4;
      slab(B, -8.4 + 1, -8.4 + 3.2, 11.4, 12.5, 0, 1, 0xdfe6ea);
      deco(B, 2.2, 0.08, 1.1, -6.2, 1.05, 11.95, 0x88ccee);
      deco(B, 0.8, 1.1, 0.4, 6, 0.55, 11.7, 0x7a7a7a);
      deco(B, 0.7, 0.4, 0.05, 6, 1, 11.55, 0xe8e4d0);
      PR.pave(B, 0, 16, 11, 13.5, 0xb4b4ae);
      PR.bin(B, -7, 12.6);
      rearDoorBits(B, -6, -11.2);
      PR.dump(B, 4, -14);
      for (let i = 0; i < 3; i++) deco(B, 0.9, 0.7, 0.9, -6.5 + i * 0.1, 0.35 + i * 0.7, -11.9 + rnd(0, 0.2), 0xa08050);
    }
  });
}

function hWhiteTrash(x, z, t) {
  return pb(x, z, t, {
    w: 16,
    d: 22,
    h: 3.2,
    wall: 0x8f8a6a,
    floor: 0x8a6a4a,
    door: 0x4a2c14,
    dx: -3,
    bd: 1.8,
    roof: 'gable',
    rc: 0x4a3a2a,
    f: [...wins([-6.4, 2, 5, 7]), {k: 'd', c: -3}],
    b: [
      {k: 'd', c: 1.8, s: -1},
      {k: 'w', c: -5},
      {k: 'w', c: 5.5}
    ],
    walls: [
      [
        1,
        1,
        X0,
        X1,
        [
          {k: 'd', c: -3.5},
          {k: 'd', c: 3.5}
        ]
      ],
      [0, 0.5, 1.1, Z1, [{k: 'g', c: 6}]],
      [0, 0, Z0, 0.9, [{k: 'd', c: -3.5}]],
      [0, 4, Z0, -6.9, []],
      [1, -6.8, 4, X1, [{k: 'd', c: 5.9}]]
    ],
    rooms: [
      {
        r: [X0, 0.35, 1.2, Z1],
        f: [
          ['sofa', 'n', 0.95],
          ['tv', 's', 0.05],
          ['rug', 'c', 0.5],
          ['ctable', 'c', 0.5],
          ['shelf', 'w', 0.5],
          ['lamp', 'w', 0.95],
          ['plant', 's', 0.9]
        ],
        loot: 'house'
      },
      {
        r: [0.65, X1, 1.2, Z1],
        f: [
          ['counter', 'e', 0.3],
          ['stove', 'e', 0.5],
          ['fridge', 'e', 0.75],
          ['sink', 'e', 0.12],
          ['table', 'c', 0.3, 0, 0.5],
          ['chair', 'c', 0.3, -0.4, 1.35, PI],
          ['chair', 'c', 0.3, 0.4, 1.35, PI]
        ],
        loot: 'house'
      },
      {r: [X0, -0.15, Z0, 0.8], f: RM.bedroom, loot: 'house'},
      {r: [4.15, X1, Z0, -6.95], f: RM.bath},
      {
        r: [0.15, X1, -6.7, 0.8],
        f: [
          ['box', 'e', 0.5],
          ['plant', 'n', 0.9]
        ]
      }
    ],
    x: B => {
      slab(B, -5.4, -0.6, 11, 13.2, 0, 0.25, 0x7a5a3a);
      slab(B, -4.9, -1.1, 12.8, 13.8, 0, 0.12, 0x6a4a2a);
      for (const px of [-5.2, -0.8]) deco(B, 0.18, 2.8, 0.18, px, 1.4, 13, 0xe8e4d8);
      deco(B, 5.2, 0.15, 2.4, -3, 2.9, 12.2, 0x4a3a2a);
      deco(B, 1.1, 2.3, 0.05, -3, 1.2, 11.2, 0x8a9a8a);
      // v090: the front lawn and its dirt patches sit a little higher (the lawn z-fought with the ground on the town map)
      flatM(16, 17.5 - 13.8, 0x6a7a3a, 0, 0.042, (13.8 + 17.5) / 2, B.g);
      for (let i = 0; i < 6; i++)
        flatM(rnd(1.2, 2.4), rnd(0.8, 1.5), 0x7a6a40, rnd(-6.5, 6.5), 0.048 + i * 0.0015, rnd(14, 16), B.g, rnd(0, 3));
      for (const px of [-6.5, -5.8]) {
        deco(B, 0.6, 0.1, 0.6, px, 0.45, 12.4, 0xe8e8f0);
        deco(B, 0.6, 0.5, 0.08, px, 0.8, 12.1, 0xe8e8f0);
      }
      deco(B, 0.12, 1, 0.12, 5.5, 0.5, 16.5, 0x777777);
      deco(B, 0.4, 0.3, 0.3, 5.5, 1.1, 16.5, 0x2a5a9a);
      slab(B, -2, 2, -12.8, -11, 0, 0.2, 0x7a5a3a);
      for (const s of [-1, 1]) {
        const fx = s * 9.4;
        for (let zz = -11.4; zz > -17.6; zz -= 1.4) deco(B, 0.12, 1.2, 0.12, fx, 0.6, zz, 0x8a7a5a);
        deco(B, 0.06, 0.1, 6.3, fx, 1, -14.5, 0x8a7a5a);
      }
      for (const [a, b] of [
        [-9.4, -1.2],
        [1.2, 9.4]
      ]) {
        for (let xx = a; xx <= b; xx += 1.4) deco(B, 0.12, 1.2, 0.12, xx, 0.6, -17.6, 0x8a7a5a);
        deco(B, b - a, 0.1, 0.06, (a + b) / 2, 1, -17.6, 0x8a7a5a);
      }
      deco(B, 0.7, 0.5, 0.7, -6, 0.25, -13.5, 0x6a4a2a);
      deco(B, 0.9, 0.12, 0.9, 3, 0.06, -14.5, 0x8a8a8a);
    }
  });
}

function hButcher(x, z, t) {
  return pb(x, z, t, {
    w: 16,
    d: 22,
    h: 4,
    wall: 0xb0a8a0,
    floor: 0xd0ccc4,
    door: 0x7a1a1a,
    dx: 0,
    bd: -4,
    f: [...wins([-6, -3.4, 3.4, 6]), {k: 'd', c: 0}],
    walls: [
      [
        1,
        -5.2,
        X0,
        X1,
        [
          {k: 'd', c: -4},
          {k: 'd', c: 4.4}
        ]
      ],
      [0, 1.2, Z0, -5.3, []]
    ],
    rooms: [
      {
        r: [X0, 1.05, Z0, -5.4],
        f: [
          ['crate', 'n', 0.3],
          ['shelf', 'w', 0.5],
          ['box', 's', 0.5]
        ],
        loot: 'butcher'
      },
      {
        r: [1.35, X1, Z0, -5.4],
        f: [
          ['freezer', 'e', 0.3],
          ['freezer', 'e', 0.7]
        ],
        loot: 'butcher',
        n: 2
      },
      {
        r: [X0, X1, -5, 1.8],
        f: [
          ['cutblock', 'c', 0.3, 0, 0],
          ['cutblock', 'c', 0.6, 0, 0],
          ['counter', 'w', 0.7]
        ],
        loot: 'butcher',
        n: 1
      },
      {r: [X0, X1, 2.7, Z1], f: [['plant', 'w', 0.05]], loot: 'butcher'}
    ],
    put: [
      ['freezer', -5.6, 2.2],
      ['freezer', -3.3, 2.2],
      ['freezer', -1, 2.2],
      ['freezer', 1.3, 2.2],
      ['freezer', 3.6, 2.2],
      ['register', 6, 3.4],
      ['box', 6.4, -2.2]
    ],
    x: B => {
      deco(B, 12, 0.08, 0.08, -1, 3.3, -1.6, 0x888888);
      for (let i = 0; i < 7; i++) {
        deco(B, 0.04, 0.5, 0.04, -6 + i * 1.5, 3, -1.6, 0xaaaaaa);
        deco(B, 0.32, 0.7, 0.28, -6 + i * 1.5, 2.5, -1.6, 0xa02a2a);
      }
      deco(B, 10, 0.08, 0.08, 4.4, 3.3, -8, 0x888888);
      for (let i = 0; i < 4; i++) deco(B, 0.35, 0.8, 0.3, 2.6 + i * 1.5, 2.6, -8, 0xb03030);
      deco(B, 0.6, 0.4, 0.5, 5.6, 1, 0.8, 0x9a9a9a);
      FEAT.awning(B, {awn: [0x991b1b, 0xf1f1f1]});
      tsign(B.g, "GEIN'S BUTCHERIA", 0, 5, 11.12, 7, 1, '#3a0a0a', '#f4e6c0', 'bold 52px Impact');
      for (const px of [-6, -3.4, 3.4, 6])
        for (let i = 0; i < 2; i++) deco(B, 0.5, 0.3, 0.4, px - 0.4 + i * 0.8, 0.98, 10.4, 0xc02a2a);
      PR.pave(B, 0, 16, 11, 13.5, 0xb4b4ae);
      rearDoorBits(B, -4, -11.2);
      PR.dump(B, 3, -14.5);
      PR.bin(B, -6, -12.2);
    }
  });
}

function hLaundro(x, z, t) {
  const put2 = [];
  for (let i = 0; i < 7; i++) {
    put2.push(['washer', -6 + i, -2.1, 0], ['dryer', -6 + i, -3.1, PI]);
  }
  for (const px of [-4, 0, 4]) put2.push(['table', px, 6]);
  put2.push(['machine', 7.1, 9.6, -PI / 2], ['machine', 7.1, 8.4, -PI / 2], ['bench', -6.2, 9.6]);
  return pb(x, z, t, {
    w: 16,
    d: 22,
    h: 4,
    wall: 0x5f8fa0,
    floor: 0xc8ccd0,
    door: 0x2a3a5a,
    dx: 0,
    bd: -3,
    f: [...wins([-6.4, -3.6, -1.5, 1.5, 3.6, 6.4]), {k: 'd', c: 0}],
    walls: [
      [
        1,
        -6.4,
        X0,
        X1,
        [
          {k: 'd', c: -3},
          {k: 'd', c: 5, s: -1}
        ]
      ]
    ],
    rooms: [
      {
        r: [X0, X1, Z0, -6.6],
        f: [
          ['shelf', 'w', 0.5],
          ['shelf', 'e', 0.5],
          ['crate', 'n', 0.5],
          ['box', 's', 0.5],
          ['sink', 'e', 0.9]
        ],
        loot: 'laundromat',
        n: 2
      },
      {r: [X0, X1, -6, Z1], loot: 'laundromat', n: 1}
    ],
    put: put2,
    x: B => {
      for (let i = 0; i < 3; i++) {
        const c = new THREE.Group();
        c.position.set(-6.5 + i * 1.1, 0, -5.4);
        B.g.add(c);
        mesh(BX(0.8, 0.1, 0.6), 0x8a8a8a, 0, 0.35, 0, c);
        mesh(BX(0.8, 0.5, 0.06), 0x6a8aca, 0, 0.65, -0.3, c);
        mesh(BX(0.06, 0.5, 0.6), 0x6a8aca, 0.4, 0.65, 0, c);
      }
      for (const px of [-6.4, -3.6, 3.6, 6.4])
        tsign(B.g, 'DETERGENT', px, 3.4, 10.95, 1.2, 0.5, '#2a6ad0', '#fff', 'bold 28px Arial');
      tsign(B.g, 'LAUNDROMAT', 0, 5, 11.12, 7, 1, '#0d2a52', '#9ad8ff');
      FEAT.awning(B, {awn: [0x2563eb, 0xf1f1f1]});
      for (let i = -1; i <= 1; i++) {
        const l = mesh(BX(2.4, 0.06, 0.3), 0xffffff, i * 4.6, 3.9, 2, B.g);
        l.material.emissive.setHex(0xcccccc);
      }
      PR.pave(B, 0, 16, 11, 13.5, 0xb4b4ae);
      PR.bin(B, -6, 12.4);
      rearDoorBits(B, -3, -11.2);
      PR.bin(B, 3, -12.4);
    }
  });
}

// ================= POOL 2: BIG COMPOUNDS (30x23 footprint, 6.5m frontage + 6.5m rear) =================
const BX0 = -14.8,
  BX1 = 14.8,
  BZ0 = -11.3,
  BZ1 = 11.3;
const stallsAndCars = (B, n = 1) => {
  PR.pave(B, 0, 30, 11.5, 13, 0xb4b4ae);
  PR.stalls(B, -14, 10, 13.2, 17.6);
  const used = new Set();
  for (let i = 0; i < n; i++) {
    let s = ri(0, 9);
    while (used.has(s)) s = ri(0, 9);
    used.add(s);
    PR.car(B, -12.6 + s * 2.8, 15.4);
  }
};

function bFoodLib(x, z, t) {
  const put2 = [];
  for (const px of [-12.5, -9.5, -6.5, 6.5, 9.5, 12.5]) {
    put2.push(['counter', px, 7.6, PI / 2], ['register', px + 0.9, 6.2]);
  }
  for (const rz of [1.2, -1.4])
    for (const px of [-12.6, -10.2, -7.8, -3.6, -1.2, 1.2, 3.6, 7.8, 10.2, 12.6]) put2.push(['aisle', px, rz]);
  put2.push(
    ['forklift', -3.8, -8.4, PI / 2],
    ['prack', -12.8, -10.3],
    ['prack', -9.4, -10.3],
    ['prack', -12.8, -6.9],
    ['prack', -9.4, -6.9],
    ['crate', 10, -6.3],
    ['crate', 13, -6.3],
    ['freezer', -14.2, 3.5, PI / 2],
    ['freezer', -14.2, 5.8, PI / 2]
  );
  return pb(x, z, t, {
    w: 30,
    d: 23,
    h: 6,
    wall: 0x7c8c9c,
    floor: 0xc8c8c0,
    dx: 0,
    bd: -6.4,
    f: [...wins([-13, -9.8, -7, -4.4, 4.4, 7, 9.8, 13]), {k: 'g', c: -1.8}, {k: 'g', c: 1.8}],
    b: [
      {k: 'g', c: -1.6},
      {k: 'g', c: 0},
      {k: 'g', c: 1.6},
      {k: 'd', c: -6.4, s: -1}
    ],
    walls: [
      [
        1,
        -5.2,
        BX0,
        BX1,
        [
          {k: 'd', c: -4.2},
          {k: 'd', c: 4.2, s: -1}
        ]
      ],
      [1, -8.2, 7.2, BX1, [{k: 'd', c: 11}]],
      [0, 7.2, BZ0, -8.3, []]
    ],
    rooms: [
      {
        r: [7.4, BX1, BZ0, -8.5],
        f: [
          ['freezer', 'n', 0.1],
          ['freezer', 'n', 0.9],
          ['box', 'e', 0.5]
        ],
        loot: 'supermarket',
        n: 2
      },
      {r: [BX0, BX1, -5, 11], loot: 'supermarket', n: 3},
      {r: [BX0, BX1, BZ0, -5.4], loot: 'supermarket', n: 2}
    ],
    put: put2,
    x: B => {
      tsign(B.g, 'THE FOOD LIBRARY', 0, 6.9, 11.62, 12, 1.6, '#0d4a2a', '#f4f4d8', 'bold 90px Impact');
      deco(B, 30.4, 0.5, 0.3, 0, 5.5, 11.7, 0x2a5a3a);
      slab(B, -3, 3, 11.5, 12.6, 0, 0.06, 0x555a60);
      for (const s of [-1, 1]) deco(B, 0.2, 3, 0.3, s * 2.6, 1.5, 11.7, 0x777777);
      for (let i = 0; i < 9; i++) PR.bollard(B, -6 + i * 1.5, 13.1);
      PR.corral(B, -11, 14.4);
      stallsAndCars(B, 3);
      slab(B, -3, 3, -14.4, -11.5, 0, 0.3, 0x7a7c7e, true);
      deco(B, 5.2, 1, 0.12, 0, 3.1, -11.45, 0x9a9ea2);
      rearDoorBits(B, -9, -11.7, 3.6);
      PR.dump(B, 8, -14.5);
      PR.dump(B, 11, -14.5);
    }
  });
}

function bLucky(x, z, t) {
  const put2 = [];
  for (const px of [-11.5, -9.1, -6.7, -4.3]) put2.push(['table', px, 7.8]);
  for (const rz of [3.8, 1.4])
    for (const px of [-12.6, -10.2, -7.8, -3.6, -1.2, 1.2, 3.6, 7.8, 10.2, 12.6]) put2.push(['aisle', px, rz]);
  for (const px of [6, 8.4, 10.8, 13]) put2.push(['register', px, 8.6], ['counter', px, 7.8]);
  put2.push(
    ['freezer', -4, -9.2],
    ['freezer', -1.7, -9.2],
    ['freezer', 0.6, -9.2],
    ['freezer', 2.9, -9.2],
    ['freezer', 5.2, -9.2],
    ['freezer', 7.5, -9.2],
    ['counter', -3.5, -7.6],
    ['counter', -1, -7.6],
    ['counter', 1.5, -7.6],
    ['counter', 4, -7.6],
    ['cutblock', -10.5, -9]
  );
  return pb(x, z, t, {
    w: 30,
    d: 23,
    h: 5.4,
    wall: 0xc4a46a,
    floor: 0xd0c8b8,
    door: 0x7a1a1a,
    dx: 0,
    bd: -12,
    f: [...wins([-12, -8, -4.5, 5, 8, 11.5, 14]), {k: 'd', c: -1.6}, {k: 'd', c: 1.6}],
    walls: [
      [1, -5.2, BX0, -8, []],
      [1, -5.2, -6, BX1, []],
      [0, -12, BZ0, -5.3, [{k: 'd', c: -8}]],
      [0, -8, BZ0, -5.3, []],
      [1, -5.2, -14.2, -12.1, []]
    ],
    rooms: [
      {
        r: [BX0, -12.2, BZ0, -5.4],
        f: [
          ['desk', 'n', 0.5],
          ['shelf', 'w', 0.5],
          ['box', 's', 0.5],
          ['crate', 'e', 0.5]
        ],
        loot: 'office'
      },
      {r: [-7.8, BX1, BZ0, -5.4], loot: 'butcher', n: 2},
      {r: [BX0, BX1, -5, 11], loot: 'supermarket', n: 3}
    ],
    put: put2,
    x: B => {
      deco(B, 0.3, 6, 0.3, -12.4, 4, 12.4, 0xd0c040);
      const sg = new THREE.Mesh(
        new THREE.CylinderGeometry(1.6, 1.6, 0.3, 16),
        new THREE.MeshBasicMaterial({color: 0xffcc22})
      );
      sg.rotation.x = PI / 2;
      sg.position.set(-12.4, 7, 12.4);
      B.g.add(sg);
      tsign(B.g, 'LUCKY DUCKY', 0, 6, 11.62, 9, 1.3, '#7a1a1a', '#ffe060', 'bold 80px Impact');
      tsign(B.g, 'GROCERY & MEATS', 0, 4.6, 11.62, 6, 0.8, '#ffe060', '#7a1a1a', 'bold 48px Arial');
      for (const px of [-8, -4.5, 5, 8])
        tsign(B.g, 'SALE!', px, 2.8, 11.55, 1.5, 1, '#ffe060', '#cc2222', 'bold 56px Impact');
      stallsAndCars(B, 4);
      for (const px of [-6, 0, 6]) PR.bollard(B, px, 13.1);
      rearDoorBits(B, -8, -11.7, 3.6);
      PR.dump(B, 6, -14.5);
      PR.bin(B, -4, -13.4);
    }
  });
}

function bBurger(x, z, t) {
  const put2 = [];
  for (const bz of [-1, 2.6, 6.2])
    for (const bx of [-12, -7, -2]) put2.push(['table', bx, bz], ['bench', bx, bz - 1.1], ['bench', bx, bz + 1.1, PI]);
  put2.push(
    ['counter', -8, -4.2],
    ['counter', -4.5, -4.2],
    ['counter', -1, -4.2],
    ['register', -7, -3.5],
    ['register', -3, -3.5],
    ['stove', 3, -9.6],
    ['stove', 5, -9.6],
    ['fryer', 7, -9.6],
    ['fryer', 8.2, -9.6],
    ['hood', 4, -9.8],
    ['hood', 7.6, -9.8],
    ['counter', 10.4, -9.6],
    ['counter', 12.6, -5.6, -PI / 2],
    ['freezer', 13.6, -8, -PI / 2],
    ['freezer', 13.6, -3, -PI / 2],
    ['machine', 13.8, -1, -PI / 2]
  );
  return pb(x, z, t, {
    w: 30,
    d: 23,
    h: 4.6,
    wall: 0xcc5a2a,
    floor: 0xd8d0c0,
    door: 0x3a2a1a,
    dx: -8,
    bd: 10,
    f: [...wins([-13, -4.5, -1.5, 2, 5]), {k: 'd', c: -8}],
    r: [
      {k: 'w', c: 7},
      {k: 'w', c: -2},
      {k: 'w', c: 3}
    ],
    b: [
      {k: 'd', c: 10, s: -1},
      {k: 'w', c: -6}
    ],
    walls: [
      [
        1,
        -6.4,
        BX0,
        BX1,
        [
          {k: 'g', c: -10},
          {k: 'g', c: -6},
          {k: 'g', c: -2},
          {k: 'd', c: 1.5},
          {k: 'd', c: 11}
        ]
      ]
    ],
    rooms: [
      {r: [BX0, BX1, -6, BZ1], loot: 'burger', n: 2},
      {
        r: [BX0, BX1, BZ0, -6.6],
        f: [
          ['shelf', 'n', 0.5],
          ['box', 'w', 0.5]
        ],
        loot: 'burger',
        n: 2
      }
    ],
    put: put2,
    x: B => {
      const g = new THREE.Group();
      g.position.set(-12.4, 0, 13.4);
      B.g.add(g);
      mesh(BX(0.3, 6, 0.3), 0x888888, 0, 3, 0, g);
      const hd = mesh(new THREE.SphereGeometry(1, 12, 10), 0xe07a1a, 0, 6.6, 0, g);
      for (const s of [-1, 1]) {
        const e = mesh(new THREE.ConeGeometry(0.35, 0.8, 6), 0xe07a1a, s * 0.8, 7.4, 0, g);
      }
      mesh(new THREE.SphereGeometry(0.3, 6, 6), 0x222222, 0, 6.5, 0.95, g);
      addSolid(g.children[0]);
      tsign(B.g, "WILLY THE FOX'S BURGERORIUM", 0, 5.3, 11.62, 13, 1, '#7a2a0a', '#ffe060', 'bold 52px Impact');
      slab(B, 15.6, 19.2, -16.4, 17.6, 0.02, 0.04, 0x555a5e);
      flatM(0.1, 32, 0xf0e040, 17.4, 0.06, 0, B.g);
      PR.car(B, 17.4, 5);
      deco(B, 0.9, 1.6, 0.2, 16.2, 0.8 + 0.2, 6.8, 0x777777);
      tsign(B.g, 'ORDER HERE', 16.3, 1.8, 6.95, 0.8, 1, '#222', '#ffe060', 'bold 22px Arial', -PI / 2);
      deco(B, 0.3, 3.2, 0.3, 15.9, 1.6, -1.8, 0x888888);
      deco(B, 0.2, 0.2, 0.9, 15.4, 3, -3.4, 0x333333);
      stallsAndCars(B, 2);
      rearDoorBits(B, 10, -11.7, 3.6);
      PR.dump(B, 4, -14.6);
      PR.dump(B, 7.5, -14.6);
    }
  });
}

function bHardware(x, z, t) {
  const put2 = [];
  for (const rz of [4.4, 1.8, -0.8]) for (const px of [-10.2, -7.8, -5.4, 5.4, 7.8, 10.2]) put2.push(['aisle', px, rz]);
  put2.push(
    ['counter', -6, 9],
    ['register', -5, 8.3],
    ['key', -8.5, 10.4],
    ['workbench', -9.4, 10.6],
    ['ladder', 12, -10.5],
    ['ladder', 13, -10.5],
    ['ladder', -13, -10.5],
    ['hbin', -13, -5.4],
    ['hbin', -13, -3.4],
    ['prack', -9, -10.2],
    ['prack', -5.6, -10.2],
    ['prack', 5.6, -10.2],
    ['prack', 9, -10.2],
    ['crate', 2, -9],
    ['crate', -2, -9]
  );
  return pb(x, z, t, {
    w: 30,
    d: 23,
    h: 5,
    wall: 0xb04a2a,
    floor: 0xa8a8a0,
    door: 0x4a3a2a,
    dx: 0,
    bd: 0,
    f: [...wins([-11, -7.5, 7.5, 11]), {k: 'd', c: -1.6}, {k: 'd', c: 1.6}],
    b: [
      {k: 'g', c: -2.4},
      {k: 'g', c: -0.8},
      {k: 'g', c: 0.8},
      {k: 'g', c: 2.4}
    ],
    walls: [
      [
        1,
        -6.4,
        BX0,
        BX1,
        [
          {k: 'd', c: -12},
          {k: 'g', c: -2.4},
          {k: 'g', c: -0.8},
          {k: 'g', c: 0.8},
          {k: 'g', c: 2.4},
          {k: 'd', c: 12}
        ]
      ]
    ],
    rooms: [
      {r: [BX0, BX1, -6, BZ1], loot: 'hardware', n: 3},
      {r: [BX0, BX1, BZ0, -6.6], loot: 'hardware', n: 3}
    ],
    put: put2,
    x: B => {
      tsign(B.g, 'HAMMERTIME', 0, 5.8, 11.62, 10, 1.4, '#e0a020', '#222', 'bold 90px Impact');
      for (const [a, b] of [
        [-13, -8],
        [8, 13]
      ])
        for (let i = 0; i < 4; i++) {
          slab(B, a, b, 12.2 + i * 0.01, 12.5 + i * 0.01, 0, 0.9, 0x6a4a2a);
          for (let k = 0; k < 4; k++) deco(B, 4.4, 0.15, 0.5, (a + b) / 2, 0.5 + k * 0.3, 12.35, 0xc09a60);
        }
      for (let i = 0; i < 4; i++) deco(B, 1.1, 0.4, 0.8, -3 + i * 1.4, 0.2, 12.6, 0x6a5a4a);
      deco(B, 0.3, 1, 0.2, -5, 0.5, 12.6, 0x888888);
      PR.pave(B, 0, 30, 11.5, 14, 0xa8a8a4);
      stallsAndCars(B, 2);
      slab(B, -4, 4, -14.4, -11.5, 0, 0.3, 0x7a7c7e, true);
      deco(B, 9.6, 1, 0.12, 0, 3.1, -11.45, 0x9a9ea2);
      rearDoorBits(B, -8, -11.7, 3.6);
      PR.dump(B, 9, -14.5);
    }
  });
}

function bPharmacy(x, z, t) {
  const put2 = [];
  for (const rz of [5.2, 2.8])
    for (const px of [-12.6, -10.2, -7.8, -3.6, -1.2, 1.2, 3.6, 7.8, 10.2, 12.6]) put2.push(['aisle', px, rz]);
  put2.push(
    ['counter', -8, -3.4],
    ['counter', -5.6, -3.4],
    ['counter', -3.2, -3.4],
    ['counter', 3.2, -3.4],
    ['counter', 5.6, -3.4],
    ['counter', 8, -3.4],
    ['register', -6, -4.2],
    ['register', 6, -4.2],
    ['table', -9, -7.4],
    ['table', -6, -7.4],
    ['shelf', -12, -9.8],
    ['shelf', -9, -9.8],
    ['shelf', -6, -9.8],
    ['shelf', 10, -9.8],
    ['shelf', 12.5, -8.4, -PI / 2],
    ['safe', 3, -10.2],
    ['safe', 4.2, -10.2],
    ['vault', 7.5, -10.8],
    ['freezer', 13.8, -4.8, -PI / 2]
  );
  return pb(x, z, t, {
    w: 30,
    d: 23,
    h: 5,
    wall: 0xe0e4e8,
    floor: 0xe8e8e8,
    door: 0x2a6a4a,
    pc: 0xe8eef0,
    dx: 0,
    bd: 12,
    f: [...wins([-11, -7.5, 7.5, 11]), {k: 'd', c: -1.6}, {k: 'd', c: 1.6}],
    b: [
      {k: 'd', c: 12, s: -1},
      {k: 'w', c: -6}
    ],
    walls: [
      [1, -5.6, BX0, -1.5, []],
      [1, -5.6, 1.5, BX1, [{k: 'd', c: 12}]],
      [0, -1.4, BZ0, -5.7, []],
      [0, 1.4, BZ0, -5.7, [{k: 'd', c: -8.5}]]
    ],
    rooms: [
      {r: [BX0, BX1, -3, BZ1], loot: 'pharmacy', n: 3},
      {r: [BX0, -1.6, BZ0, -5.8], loot: 'pharmacy', n: 2},
      {r: [1.6, BX1, BZ0, -5.8], loot: 'pharmacy', n: 2}
    ],
    put: put2,
    x: B => {
      for (const px of [-9, -5.2, 5.2, 9]) glassP(B, px, 1.6, -3.4, 2.4, 1.3);
      const cr = new THREE.Group();
      cr.position.set(11.6, 6.3, 11.8);
      B.g.add(cr);
      for (const [w, h] of [
        [1.8, 0.55],
        [0.55, 1.8]
      ])
        mesh(BX(w, h, 0.2), 0x16a34a, 0, 0, 0, cr).material.emissive.setHex(0x0a5a2a);
      tsign(B.g, "MORGAN'S DRUG & PHARMACY", -3, 6, 11.62, 12, 1.4, '#e8eef0', '#0d6a3a', 'bold 54px Arial');
      PR.pave(B, 0, 30, 11.5, 14, 0xb4b4ae);
      stallsAndCars(B, 3);
      rearDoorBits(B, 12, -11.7, 3.6);
      PR.dump(B, 5, -14.5);
      PR.bin(B, -5, -13.4);
    }
  });
}

function bEcoPump(x, z, t) {
  const cs = CUR.cs,
    OZ = -4; /* store is set back: local store z = plot z - OZ */
  const B = pb(x, z + cs * OZ, t, {
    w: 26,
    d: 12,
    h: 4.2,
    wall: 0xdadad0,
    floor: 0xbcbcb4,
    door: 0x2a6a3a,
    dx: 0,
    bd: 9,
    f: [...wins([-9, -6, -3.2, 6, 9]), {k: 'd', c: 0}],
    b: [
      {k: 'd', c: 9, s: -1},
      {k: 'w', c: -9},
      {k: 'w', c: -4}
    ],
    walls: [
      [0, 10, -5.9, 0.3, []],
      [1, 0.3, 10.1, 12.9, [{k: 'd', c: 11.5}]]
    ],
    rooms: [
      {r: [-12.85, 9.9, -5.85, 5.85], loot: 'gas', n: 2},
      {
        r: [10.2, 12.9, -5.8, 0.1],
        f: [
          ['toilet', 'n', 0.15],
          ['sink', 'n', 0.9]
        ]
      }
    ],
    put: [
      ['aisle', -8, -1.2],
      ['aisle', -5.6, -1.2],
      ['aisle', -3.2, -1.2],
      ['aisle', -8, 1.2],
      ['aisle', -5.6, 1.2],
      ['aisle', -3.2, 1.2],
      ['freezer', -12.2, -5.2],
      ['freezer', -9.9, -5.2],
      ['freezer', -7.6, -5.2],
      ['freezer', -5.3, -5.2],
      ['counter', 3, 3.2],
      ['register', 3.9, 2.6],
      ['shelf', 2.2, 2.2],
      ['counter', 7.4, -4.8, -PI / 2],
      ['stove', 8.4, -5.2],
      ['machine', -12.4, 3.6, PI / 2]
    ],
    x: B => {
      const cz = 14.9 - OZ * 0 + 4;
      const P = cz;
      slab(B, -11, 11, cz - 2.8, cz + 2.8, 4.4, 4.9, 0x2a8a4a);
      deco(B, 22, 0.5, 0.2, 0, 4.0, cz + 2.85, 0xe8e8d8);
      tsign(B.g, 'ECO PUMP', 0, 4.15, cz + 2.97, 6, 0.6, '#1a6a3a', '#f0f0e0');
      for (const [px, pz] of [
        [-9, cz - 2.4],
        [9, cz - 2.4],
        [-9, cz + 2.4],
        [9, cz + 2.4]
      ])
        slab(B, px - 0.2, px + 0.2, pz - 0.2, pz + 0.2, 0, 4.4, 0xdddddd);
      PR.pave(B, 0, 34, 6.2, 22, 0x6a6c70);
      PR.pump(B, -6.2, cz - 0.6);
      PR.pump(B, 6.2, cz - 0.6);
      for (const px of [-9.5, -2.8, 2.8, 9.5]) PR.bollard(B, px, cz - 0.6);
      makeCar(WX(B, -6.2), WZ(B, cz + 1.8), PI / 2);
      makeCar(WX(B, 6.2), WZ(B, cz - 3.4), PI / 2);
      PR.bin(B, -13.5, 8.2);
      PR.bin(B, -12.4, 8.2);
      cyl(B, 0.3, 1.1, 13.2, 0.55, 8.2, 0x2a6ad0, true);
      deco(B, 0.8, 0.4, 0.05, 13.2, 1.3, 8.5, 0x88ccee);
      tsign(B.g, 'AIR/WATER', 13.2, 2, 8.55, 0.9, 0.4, '#2a6ad0', '#fff', 'bold 28px Arial');
      const ex = -6.7,
        ez = -12.2;
      for (const [w, d, px, pz] of [
        [0.15, 3, ex - 1.9, ez],
        [0.15, 3, ex + 1.9, ez],
        [3.9, 0.15, ex, ez - 1.5]
      ])
        slab(B, px - w / 2, px + w / 2, pz - d / 2, pz + d / 2, 0, 1.8, 0x7a6a4a);
      PR.dump(B, ex, ez);
      rearDoorBits(B, 9, -6.2, 3.3);
      PR.bin(B, 12, -8.2);
    }
  });
  LASTB = B;
  return B;
}

function bTrigger(x, z, t) {
  const put2 = [
    ['ccase', -8, 5],
    ['ccase', -5.5, 5],
    ['ccase', -3, 5],
    ['ccase', 5.5, 5],
    ['ccase', 8, 5],
    ['ccase', 10.5, 5],
    ['register', -9, 3.6],
    ['gunrack', -14.5, 1, PI / 2],
    ['gunrack', -14.5, -1, PI / 2],
    ['gunrack', -14.5, -3, PI / 2],
    ['shelf', 13.9, 1, -PI / 2],
    ['shelf', 13.9, -1.4, -PI / 2],
    ['shelf', 13.9, -3.8, -PI / 2],
    ['safe', -3.4, -9.4],
    ['workbench', 4.8, -10.4],
    ['workbench', 9.2, -10.4],
    ['safe', 2.2, -9.4],
    ['key', 0, -5.4]
  ];
  return pb(x, z, t, {
    w: 30,
    d: 23,
    h: 4.6,
    wall: 0x5a5a60,
    floor: 0x7a7a74,
    door: 0x2a2a2e,
    dx: 0,
    bd: -3,
    f: [
      {k: 'w', c: -9},
      {k: 'w', c: -5.5},
      {k: 'w', c: 5.5},
      {k: 'w', c: 9},
      {k: 'd', c: 0}
    ],
    b: [{k: 'd', c: -3, s: -1}],
    walls: [[1, -7.5, BX0, BX1, [{k: 'd', c: -3, s: -1}]]],
    rooms: [
      {r: [BX0, BX1, -7.2, BZ1], loot: 'gunshop', n: 3},
      {r: [BX0, BX1, BZ0, -7.7], loot: 'gunshop', n: 3}
    ],
    put: put2,
    x: B => {
      for (const px of [-9, -5.5, 5.5, 9])
        for (let i = 0; i < 7; i++) deco(B, 0.06, 1.6, 0.06, px - 1 + i * 0.33, 1.9, 11.55, 0x222222);
      deco(B, 0.3, 0.4, 0.1, 1.4, 1.3, 11.66, 0x111111);
      deco(B, 0.2, 0.12, 0.04, 1.4, 1.4, 11.72, 0x33ff66, 0x228844);
      tsign(B.g, 'THE TRIGGER GUARD', 0, 4.2, 11.62, 10, 1.1, '#111', '#e0b020', 'bold 80px Impact');
      PR.pave(B, 0, 30, 11.5, 14, 0x9a9ca0);
      for (let i = 0; i < 7; i++) {
        if (i === 3) continue;
        PR.bollard(B, -6 + i * 2, 13, 0x555555);
      }
      stallsAndCars(B, 1);
      rearDoorBits(B, -3, -11.7, 3.2);
      PR.dump(B, 6, -14.5);
    }
  });
}

function bBowling(x, z, t) {
  const put2 = [];
  for (let i = 0; i < 6; i++) {
    put2.push(['lane', -9.6 + i * 2.1, -1.9], ['pinrow', -9.6 + i * 2.1, -7.4]);
  }
  put2.push(
    ['counter', -10, 9.3],
    ['arcade', -14.1, 7.2, PI / 2],
    ['arcade', -14.1, 8.4, PI / 2],
    ['arcade', -14.1, 9.6, PI / 2],
    ['counter', 10.6, -5.9],
    ['bench', 0, 8.2],
    ['bench', 3, 8.2],
    ['table', 6, 9],
    ['table', 9, 9],
    ['table', 12, 9]
  );
  return pb(x, z, t, {
    w: 30,
    d: 23,
    h: 6,
    wall: 0x4a5a8a,
    floor: 0xb0a890,
    door: 0x2a2a50,
    dx: 0,
    bd: -12,
    f: [...wins([-11, -7.5, 7.5, 11]), {k: 'd', c: -1.6}, {k: 'd', c: 1.6}],
    b: [
      {k: 'd', c: -12, s: -1},
      {k: 'd', c: 12, s: -1}
    ],
    walls: [
      [
        1,
        6.2,
        BX0,
        BX1,
        [
          {k: 'g', c: -9},
          {k: 'g', c: -1.6},
          {k: 'g', c: 1.6},
          {k: 'g', c: 9}
        ]
      ],
      [0, 11.2, BZ0, -4.8, [{k: 'd', c: -8.6}]],
      [1, -4.9, 11.2, BX1, []],
      [1, -9.9, BX0, -11.4, [{k: 'd', c: -13}]],
      [0, -11.5, BZ0, -9.9, []]
    ],
    rooms: [
      {r: [BX0, BX1, 6.4, BZ1], f: [['plant', 'w', 0.05]], loot: 'bowling', n: 2},
      {
        r: [11.4, BX1, BZ0, -5],
        f: [
          ['stove', 'e', 0.3],
          ['sink', 'e', 0.8],
          ['freezer', 's', 0.5]
        ],
        loot: 'bowling',
        n: 2
      },
      {r: [BX0, 11, -5, 6], loot: 'bowling', n: 2},
      {
        r: [BX0, -11.7, BZ0, -10.1],
        f: [
          ['crate', 'n', 0.5],
          ['box', 'w', 0.5],
          ['shelf', 's', 0.5]
        ],
        loot: 'bowling'
      }
    ],
    put: put2,
    x: B => {
      slab(B, -13.6, 11, 3.3, 5, 0, 0.35, 0x6a4a4a, true);
      slab(B, -13.6, 11, 5, 5.6, 0, 0.17, 0x6a4a4a, true);
      for (let i = 0; i < 6; i++) {
        deco(B, 1.4, 0.05, 0.5, -9.6 + i * 2.1, 1.1, 4, 0xdddddd);
        deco(B, 0.3, 0.5, 0.3, -9.6 + i * 2.1, 0.62, 3.6, 0x333333);
      }
      deco(B, 13, 2.4, 1.1, -4, 1.2, -9.3, 0x2a2a30);
      tsign(B.g, 'GUTTER LANES', 0, 6.4, 11.62, 10, 1.2, '#1a0a3a', '#ff5ac8', 'bold 80px Impact');
      const nb = mesh(new THREE.TorusGeometry(1.1, 0.14, 8, 20), 0xff2a8a, -9.6, 5.2, 11.75, B.g);
      nb.material = new THREE.MeshBasicMaterial({color: 0xff2a8a});
      for (const px of [-11.5, 11.5]) {
        cyl(B, 0.55, 1.3, px, 0.65, 13.4, 0xf5f5f0, true, 10);
        cyl(B, 0.3, 1, px, 1.8, 13.4, 0xf5f5f0, false, 10);
        mesh(new THREE.SphereGeometry(0.38, 8, 6), 0xf5f5f0, px, 2.5, 13.4, B.g);
        deco(B, 1.1, 0.12, 1.1, px, 1.1, 13.4, 0xcc2222);
      }
      PR.pave(B, 0, 30, 11.5, 14, 0xa8a8a4);
      stallsAndCars(B, 3);
      rearDoorBits(B, -12, -11.7, 3.6);
      rearDoorBits(B, 12, -11.7, 3.6);
      PR.dump(B, 0, -14.6);
    }
  });
}

function bPawn(x, z, t) {
  const cs = CUR.cs;
  const sh = pb(x, z + cs * 5.5, t, {
    w: 30,
    d: 14,
    h: 4.4,
    wall: 0x6a5a4a,
    floor: 0x8a8068,
    door: 0x2a2a2a,
    dx: -8,
    bd: -3,
    f: [
      {k: 'w', c: -12},
      {k: 'w', c: -4},
      {k: 'w', c: 4},
      {k: 'w', c: 11},
      {k: 'd', c: -8}
    ],
    b: [
      {k: 'd', c: -3, s: -1},
      {k: 'd', c: 8, s: -1}
    ],
    walls: [
      [
        1,
        -2.4,
        BX0,
        BX1,
        [
          {k: 'd', c: -3},
          {k: 'd', c: 8, s: -1}
        ]
      ]
    ],
    rooms: [
      {
        r: [BX0, BX1, -2.2, 6.85],
        f: [
          ['ccase', 'w', 0.2],
          ['ccase', 'w', 0.6],
          ['ccase', 'e', 0.3],
          ['rack', 'n', 0.2],
          ['aisle', 'c', 0.12, 0, 0],
          ['aisle', 'c', 0.3, 0, 0]
        ],
        loot: 'pawn',
        n: 3
      },
      {
        r: [BX0, BX1, -6.85, -2.6],
        f: [
          ['safe', 'n', 0.2],
          ['shelf', 'w', 0.5],
          ['crate', 's', 0.5],
          ['shelf', 'e', 0.5],
          ['crate', 'n', 0.8]
        ],
        loot: 'pawn',
        n: 3
      }
    ],
    put: [
      ['counter', 2, 2.4],
      ['counter', 4.4, 2.4],
      ['counter', 6.8, 2.4],
      ['register', 3.4, 1.7]
    ],
    x: B => {
      for (let i = 0; i < 9; i++) deco(B, 0.06, 1.2, 0.06, 1.4 + i * 0.5, 1.9, 2.4, 0x333333);
      deco(B, 9, 0.06, 0.06, 3.4, 2.5, 2.4, 0x333333);
      for (const px of [-12, -4, 4, 11])
        for (let i = 0; i < 5; i++) deco(B, 0.05, 1.4, 0.05, px - 0.6 + i * 0.3, 1.7, 7.05, 0x222222);
      const b3 = mesh(new THREE.TorusGeometry(0.7, 0.2, 8, 14), 0xd8a020, 10, 5.3, 7.2, B.g);
      b3.material.emissive.setHex(0x553a00);
      tsign(B.g, 'GOLDEN FENCES PAWN SHOP', -3, 5.3, 7.12, 10, 1, '#222', '#e8b820', 'bold 54px Impact');
      PR.pave(B, 0, 30, 7, 9.8, 0xb4b4ae);
      PR.pave(B, 16.8, 3.4, -23, 7, 0x7a7c80);
      PR.lamp(B, 0, 3.1, -7.0);
    }
  });
  for (let i = 0; i < 3; i++) {
    const g = subB(sh, -8.5 + i * 8.5, -14, 8, 6.5, 3.6, 0x7a7468, 0x7a7a74, 0x4a4a4a, true);
    g.dx = 0;
    shell(g, {
      f: [
        {k: 'g', c: -1.6},
        {k: 'g', c: 0},
        {k: 'g', c: 1.6}
      ],
      b: [{k: 'd', c: 0}],
      l: [],
      r: []
    });
    deco(g, 5, 1, 0.1, 0, 3.1, 3.2, 0x9a9ea2);
    slab(g, -4.1, 4.1, -3.35, 3.35, 3.6, 3.9, 0x3a3a38);
    rc(g, 'auto', [-3.6, 3.6, -2.6, 2.6], 1);
    if (i == 1) put(g, 'crate', 3, -1.5);
    done(g, 'pawn_garage', 0);
  }
  LASTB = sh;
  return sh;
}

function bCarLot(x, z, t) {
  const B = mk(x, z, 38, 34, 0, 0x777777, 0x606060, 0x333333);
  B.dx = 0;
  flatM(38, 34, 0x4c4e52, 0, 0.02, 0, B.g);
  const L = 18.6,
    F = 16.6;
  const post = (px, pz) => deco(B, 0.1, 2, 0.1, px, 1, pz, 0x8a8f94);
  for (let px = -L; px <= L + 0.01; px += 2)
    for (const pz of [-F, F]) {
      if (Math.abs(px) < 4.2 && pz == F) continue;
      if (Math.abs(px) < 4.2 && pz == -F) continue;
      post(px, pz);
    }
  for (let pz = -F; pz <= F + 0.01; pz += 2) for (const px of [-L, L]) post(px, pz);
  const wire = (w, d, px, pz) => {
    const m = mesh(BX(w, 1.8, d), 0x8a8f94, px, 1.2, pz, B.g);
    m.material.transparent = true;
    m.material.opacity = 0.35;
    addSolid(m);
  };
  wire(L - 4.2, 0.05, (-L - 4.2) / 2, F);
  wire(L - 4.2, 0.05, (L + 4.2) / 2, F);
  wire(L - 4.2, 0.05, (-L - 4.2) / 2, -F);
  wire(L - 4.2, 0.05, (L + 4.2) / 2, -F);
  wire(0.05, 2 * F, -L, 0);
  wire(0.05, 2 * F, L, 0);
  for (const pz of [-F, F]) {
    deco(B, 2 * L, 0.03, 0.03, 0, 4.2, pz, 0xe0e0e0);
    for (let i = 0; i < 19; i++)
      deco(B, 0.4, 0.35, 0.02, -L + 1 + i * 2, 4.0, pz, [0xdc2626, 0xfbbf24, 0x2563eb][i % 3]);
  }
  deco(B, 0.15, 5, 0.15, -4.2, 2.5, F, 0x666666);
  deco(B, 0.15, 5, 0.15, 4.2, 2.5, F, 0x666666);
  tsign(B.g, 'KRASCHE & BURNS USED AUTOS', 0, 4.6, F + 0.1, 8, 0.9, '#b01a1a', '#fff', 'bold 48px Impact');
  deco(B, 3.2, 1.8, 0.08, 5.6, 0.9, -F, 0x5a5e62);
  for (let i = 0; i < 8; i++) PR.car(B, -14 + (i % 4) * 5, i < 4 ? 6 : -2);
  for (let i = 0; i < 3; i++) PR.car(B, i * 5, -12);
  slab(B, 9, 15, 2, 7, 0, 0.6, 0x777c80, true);
  slab(B, 15, 15.8, 3, 6, 0, 0.4, 0x777c80, true);
  slab(B, 15.8, 16.6, 3, 6, 0, 0.2, 0x777c80, true);
  const dc = makeCar(WX(B, 12), WZ(B, 4.5), 0);
  if (dc && dc.position) dc.position.y = 0.6;
  const off = subB(B, -12, -12.4, 12, 8, 3.2, 0xb8b0a0, 0x8a8070, 0x3a2a2a);
  off.dx = 0;
  shell(off, {f: [...wins([-4.2, 4.2]), {k: 'd', c: 0}], b: [{k: 'd', c: 3, s: -1}], l: wins([0]), r: wins([0])});
  WL(off, 0, 2, -3.9, -1.2, [{k: 'd', c: -2.6}], 3.2, {th: 0.2, c: 0xcbbfae});
  WL(off, 1, -1.2, 2, 5.85, [], 3.2, {th: 0.2, c: 0xcbbfae});
  furn(
    off,
    [
      ['desk', 'n', 0.5],
      ['chair', 'n', 0.5, 0.9, 1.1, PI],
      ['shelf', 'w', 0.5],
      ['bench', 's', 0.2]
    ],
    [-5.8, 1.9, -3.8, 3.8]
  );
  furn(off, RM.bath, [2.15, 5.8, -3.8, -1.4]);
  rc(off, 'auto', [-5.7, 1.8, -3.7, 3.7], 2);
  roof(off, 3.2, 'flat', 0x4a4a48);
  tsign(off.g, 'SALES', 0, 3.7, 4.12, 2, 0.5, '#222', '#ffd24a', 'bold 40px Impact');
  done(off, 'carlot_office', ri(0, 1));
  buildings.push({x: B.x, z: B.z, w: 36, d: 32, t: t.id});
  for (let i = ri(1, 3); i > 0; i--) zAt(B, rnd(-16, 16), rnd(0.6, 3.4));
  LASTB = B;
  return B;
}

function bMotel(x, z, t) {
  const B = mk(x, z, 30, 23, 3.2, 0xc89a6a, 0x8a8a82, 0x4a2a1a);
  B.dx = 0;
  const P = {th: 0.2, c: 0xcbbfae},
    H = 3.2,
    UH = 2.9,
    zc = [-11.5, -5.75, 0, 5.75, 11.5];
  flatM(30, 23, 0x3a3c40, 0, 0.02, 0, B.g);
  flatM(13, 17.5, 0x4c4e52, 0, 0.025, 2.8, B.g);
  const rng = side => (side < 0 ? [-15, -7] : [7, 15]);
  for (const side of [-1, 1]) {
    const ox = side * 15,
      ix = side * 7,
      [a, b] = rng(side);
    for (const lv of [0, 1]) {
      B.y = lv ? H + 0.1 : 0;
      const hh = lv ? UH : H;
      const occK = B.occ;
      if (lv) B.occ = [];
      WL(B, 0, ox, -11.5, 11.5, wins([-8.6, -2.9, 2.9, 8.6]), hh, P);
      WL(
        B,
        0,
        ix,
        -11.5,
        11.5,
        [-9.3, -3.55, 2.2, 7.95].map(c => ({k: 'd', c, s: side})).concat(wins([-6.9, -1.15, 4.6, 10.1])),
        hh,
        P
      );
      for (let i = 1; i < 4; i++) WL(B, 1, zc[i], a, b, [], hh, P);
      if (!lv) {
        WL(B, 1, -11.5, a, b, [], hh, P);
        WL(
          B,
          1,
          11.5,
          a,
          b,
          side < 0
            ? [
                {k: 'd', c: -11},
                {k: 'w', c: -8.6}
              ]
            : [{k: 'w', c: 11}],
          hh,
          P
        );
      } else {
        WL(B, 1, -11.5, a, b, [], hh, P);
        WL(B, 1, 11.5, a, b, [{k: 'w', c: side * 11}], hh, P);
      }
      for (let i = 0; i < 4; i++) {
        const r = [a + 0.2, b - 0.2, zc[i] + 0.2, zc[i + 1] - 0.2];
        if (!lv && side < 0 && i == 3) {
          furn(
            B,
            [
              ['counter', 'n', 0.25],
              ['desk', 'n', 0.75],
              ['key', 'w', 0.5],
              ['machine', 'w', 0.12],
              ['machine', 'w', 0.3],
              ['bench', 's', 0.3],
              ['plant', 's', 0.9]
            ],
            r
          );
          rc(B, 'motel', r, 1);
        } else {
          furn(
            B,
            [
              ['bed', 'n', 0.5],
              ['tv', side < 0 ? 'w' : 'e', 0.92],
              ['box', side < 0 ? 'w' : 'e', 0.1]
            ],
            r
          );
          if (!lv) rc(B, 'motel', r, 1);
        }
      }
      if (lv) B.occ = occK;
    }
    B.y = 0;
    const wx0 = side < 0 ? -15 : 5.4,
      wx1 = side < 0 ? -5.4 : 15;
    slab(B, wx0, wx1, -11.5, 11.5, H - 0.05, H + 0.1, 0x7a7a74, true);
    slab(B, wx0, wx1, -11.5, 11.5, H + UH + 0.15, H + UH + 0.4, 0x5a4a3a);
    slab(B, side * 5.4 - 0.04, side * 5.4 + 0.04, -11.5, 11.5, H + 0.1, H + 1.1, 0x8a8f94);
    stairs(B, side * 4.7, 10.8, -1, 11, (H + 0.1) / 11, 0.58, 1.4, 0x8a8a82);
  }
  // back wing (maintenance/laundry in the centre room opens to the service alley)
  for (const lv of [0, 1]) {
    B.y = lv ? H + 0.1 : 0;
    const hh = lv ? UH : H;
    const occK2 = B.occ;
    if (lv) B.occ = [];
    WL(B, 1, -11.5, -7, 7, lv ? wins([-4.7, 4.7]) : [...wins([-4.7, 4.7]), {k: 'd', c: 0, s: -1}], hh, P);
    WL(
      B,
      1,
      -5,
      -7,
      7,
      [
        {k: 'd', c: -4.67},
        {k: 'd', c: 0},
        {k: 'd', c: 4.67}
      ],
      hh,
      P
    );
    WL(B, 0, -2.33, -11.5, -5, [], hh, P);
    WL(B, 0, 2.33, -11.5, -5, [], hh, P);
    for (const [a, b] of [
      [-5.5, -2.5],
      [2.5, 5.5]
    ]) {
      furn(
        B,
        [
          ['bed', 'n', 0.5],
          ['tv', 'e', 0.9]
        ],
        [a, b, -11.3, -5.2]
      );
      if (!lv) rc(B, 'motel', [a, b, -11.3, -5.2], 1);
    }
    if (lv)
      furn(
        B,
        [
          ['bed', 'n', 0.5],
          ['tv', 'e', 0.5]
        ],
        [-2.15, 2.15, -11.3, -5.2]
      );
    else {
      furn(
        B,
        [
          ['washer', 'n', 0.2],
          ['dryer', 'n', 0.5],
          ['shelf', 'e', 0.5],
          ['crate', 'w', 0.5]
        ],
        [-2.15, 2.15, -11.3, -5.2]
      );
      rc(B, 'hardware', [-2.15, 2.15, -11.3, -5.2], 1);
    }
    if (lv) B.occ = occK2;
  }
  B.y = 0;
  slab(B, -7, 7, -11.5, -5, H - 0.05, H + 0.1, 0x7a7a74, true);
  slab(B, -7, 7, -11.5, -5, H + UH + 0.15, H + UH + 0.4, 0x5a4a3a);
  const wy = -4.2;
  /* upper walkway across the back wing */ slab(B, -7, 7, -5, -3.4, H - 0.05, H + 0.1, 0x7a7a74, true);
  slab(B, -5.4, 5.4, -3.46, -3.34, H + 0.1, H + 1.1, 0x8a8f94);
  tsign(B.g, 'RECEPTION', -11, 2.6, 11.58, 2.2, 0.5, '#222', '#ffd24a', 'bold 36px Impact');
  deco(B, 0.3, 6, 0.3, 0, 3, 15.5, 0x888888);
  deco(B, 6.8, 2.4, 0.3, 0, 6.4, 15.5, 0xf0c020, 0x886600);
  tsign(B.g, 'SUNSHINE MOTEL', 0, 6.6, 15.7, 6.2, 1.2, '#f0c020', '#c0391a', 'bold 54px Impact');
  tsign(B.g, 'VACANCY', 0, 5.6, 15.7, 3.6, 0.5, '#222', '#ff3030', 'bold 40px Arial');
  PR.stalls(B, -2.8, 2, -3, 1);
  PR.car(B, -1.4, -1);
  PR.car(B, 1.4, -0.5);
  PR.pave(B, 0, 30, 11.5, 13.2, 0x8e9093);
  PR.bollard(B, -2, 11.6);
  PR.bollard(B, 2, 11.6);
  rearDoorBits(B, 0, -11.7, 2.9);
  PR.dump(B, 6, -14.5);
  PR.bin(B, -5, -13.4);
  buildings.push({x: B.x, z: B.z, w: 30, d: 23, t: t.id});
  Zs(B, ri(2, 4));
  LASTB = B;
  return B;
}

function bAztec(x, z, t) {
  const put2 = [
    ['counter', -6, 8.4],
    ['counter', -3.4, 8.4],
    ['register', -4.6, 7.7],
    ['freezer', 5.6, 9.6],
    ['freezer', 8, 9.6],
    ['machine', 12.6, 9.2],
    ['machine', 13.8, 9.2],
    ['bench', -12, 9.4],
    ['plant', -14, 10.4],
    ['plant', 14, 10.4]
  ];
  return pb(x, z, t, {
    w: 30,
    d: 23,
    h: 7,
    wall: 0x8a3a4a,
    floor: 0x6a3a3a,
    door: 0xd8a830,
    dx: 0,
    bd: -13.4,
    f: [
      {k: 'w', c: -11},
      {k: 'w', c: -7.5},
      {k: 'd', c: -1.6},
      {k: 'd', c: 1.6},
      {k: 'w', c: 7.5},
      {k: 'w', c: 11}
    ],
    b: [
      {k: 'd', c: -13.4, s: -1},
      {k: 'd', c: 13.4, s: -1},
      {k: 'd', c: 0, s: -1}
    ],
    walls: [
      [
        1,
        6,
        BX0,
        BX1,
        [
          {k: 'd', c: -12.5},
          {k: 'd', c: 12.5, s: -1}
        ]
      ]
    ],
    rooms: [
      {r: [BX0, BX1, 6.4, BZ1], loot: 'cinema', n: 2},
      {r: [BX0, BX1, BZ0, 5.6], loot: 'cinema', n: 2}
    ],
    put: put2,
    x: B => {
      /* sloped seating: 4 stepped tiers (0.3m rise) climbing away from the screen; benches sit on each tier */
      for (let r = 0; r < 4; r++) {
        const zc = 3.9 - r * 2.1,
          h = 0.3 * (r + 1);
        slab(B, -13.8, 13.8, zc - 1.05, zc + 1.05, 0, h, 0x5a2a2a, true);
        B.y = h;
        for (let c = 0; c < 9; c++) {
          if (c == 4) continue;
          put(B, 'bench', -10.4 + c * 2.6, zc, 0);
        }
        B.y = 0;
      }
      const sc = mesh(BX(18, 6, 0.2), 0xe8e8e0, 0, 3.8, 5.75, B.g);
      sc.material.emissive.setHex(0x333333);
      deco(B, 19, 0.4, 0.4, 0, 6.9, 5.7, 0x3a1a1a);
      deco(B, 4.5, 2, 2, 0, 5.2, -10.2, 0x4a4a50);
      deco(B, 3.6, 0.6, 0.06, 0, 5.4, -9.15, 0x9cc8e8);
      deco(B, 0.3, 0.3, 0.7, 0, 5.2, -9, 0x888888);
      deco(B, 0.12, 0.12, 14, 0, 5.3, -2, 0xfff8c0, 0x888866);
      const tb = mesh(BX(1.8, 1.3, 1.2), 0x7a2a2a, -9, 0.65, 13.5, B.g);
      addSolid(tb);
      glassP(B, -9, 1.3, 12.85, 1.5, 0.7);
      tsign(B.g, 'TICKETS', -9, 2.2, 12.9, 1.8, 0.4, '#222', '#ffd24a', 'bold 30px Impact');
      slab(B, -5, 5, 12.4, 16.4, 3.6, 3.9, 0xd8a830);
      for (const [sx, sz] of [
        [-4.8, 12.6],
        [4.8, 12.6],
        [-4.8, 16.2],
        [4.8, 16.2]
      ])
        slab(B, sx - 0.15, sx + 0.15, sz - 0.15, sz + 0.15, 0, 3.6, 0xc0c0b8);
      deco(B, 14, 2.2, 0.4, 0, 9, 11.7, 0x2a0a0a);
      tsign(B.g, 'THE AZTEC', 0, 8.4, 11.95, 10, 2, '#1a0a0a', '#ffcc44', 'bold 110px Impact');
      for (let i = 0; i < 14; i++) {
        const l = mesh(new THREE.SphereGeometry(0.14, 6, 5), 0xfff2a0, -6.5 + i, 7.1, 12, B.g);
        l.material = new THREE.MeshBasicMaterial({color: 0xfff2a0});
      }
      PR.pave(B, 0, 30, 11.5, 14, 0xa8a8a4);
      PR.bollard(B, -11, 13.2);
      PR.bollard(B, 11, 13.2);
      stallsAndCars(B, 1);
      for (const px of [-13.4, 0, 13.4]) rearDoorBits(B, px, -11.7, 3.6);
      PR.dump(B, 6, -14.5);
    }
  });
}

function bChurchN(x, z, t) {
  const put2 = [
    ['altar', 0, -9.6],
    ['desk', -3.4, -9.6],
    ['desk', 3.4, -10.2],
    ['plant', -12, -10.4],
    ['plant', 12, -10.4]
  ];
  for (let r = 0; r < 6; r++) {
    for (const s of [-1, 1])
      for (let k = 0; k < 2; k++) put2.push(['pew', s * (2.4 + k * 3.4) + (s > 0 ? 0.2 : -0.2), 5.4 - r * 2.2, PI]);
  }
  return pb(x, z, t, {
    w: 30,
    d: 23,
    h: 7.4,
    wall: 0xd8d0c0,
    floor: 0x7a6a5a,
    door: 0x5a3a1a,
    dx: 0,
    bd: 10,
    roof: 'gable',
    rc: 0x4a3a3a,
    f: [
      {k: 'w', c: -11},
      {k: 'w', c: -7.5},
      {k: 'd', c: -1},
      {k: 'd', c: 1},
      {k: 'w', c: 7.5},
      {k: 'w', c: 11}
    ],
    b: [{k: 'd', c: 10, s: -1}],
    l: wins([-7, -2.5, 2.5, 7]),
    r: wins([-7, -2.5, 2.5, 7]),
    walls: [
      [1, -7.2, 9, BX1, [{k: 'd', c: 10}]],
      [0, 9, -11.35, -7.3, []]
    ],
    rooms: [
      {
        r: [9.2, BX1, BZ0, -7.4],
        f: [
          ['desk', 'n', 0.5],
          ['shelf', 'e', 0.5],
          ['wardrobe', 's', 0.4]
        ],
        loot: 'church',
        n: 2
      },
      {r: [BX0, BX1, -7, BZ1], f: [['plant', 'n', 0.1]], loot: 'church', n: 2}
    ],
    put: put2,
    x: B => {
      slab(B, -4.2, 4.2, -11.2, -8.2, 0, 0.4, 0x6a4a3a, true);
      const ch = mesh(BX(0.2, 2, 0.2), 0xd8c060, 0, 2.6, -10.9, B.g);
      deco(B, 1.2, 0.2, 0.2, 0, 3, -10.9, 0xd8c060);
      // steeple / bell tower silhouette over the entrance
      slab(B, -3, 3, 8, 11, 7.4, 15, 0xd0c8b8);
      const sp = mesh(new THREE.ConeGeometry(3.6, 6, 4), 0x4a3a3a, 0, 18, 9.5, B.g);
      sp.rotation.y = PI / 4;
      deco(B, 0.2, 2.4, 0.2, 0, 22, 9.5, 0xd8c060);
      deco(B, 1.2, 0.2, 0.2, 0, 22.5, 9.5, 0xd8c060);
      for (const s of [-1, 1]) deco(B, 0.1, 2.4, 0.9, s * 3.01, 12, 9.5, 0x2a2a2a);
      slab(B, -2.5, 2.5, 11.5, 12.2, 0, 0.3, 0xb8b0a0, true);
      slab(B, -2.5, 2.5, 12.2, 12.9, 0, 0.15, 0xb8b0a0, true);
      for (const s of [-1, 1]) deco(B, 0.3, 3.2, 0.3, s * 2.4, 1.6, 11.9, 0xc8c0b0);
      deco(B, 5, 0.3, 0.1, 0, 3.4, 11.62, 0x4a3a2a);
      tsign(B.g, "ST. MARY'S", 0, 5.2, 11.58, 5, 0.8, '#d8d0c0', '#4a3a2a', 'bold 52px Georgia');
      PR.lawn(B, 0, 38, 13.8, 17.5, 0x3f6a2f);
      PR.pave(B, 0, 5, 13.4, 17.5, 0xb4b4ae);
      const nb = mesh(BX(1.6, 1.2, 0.15), 0x4a3a2a, 8, 1.1, 15.6, B.g);
      addSolid(nb);
      cyl(B, 0.08, 0.9, 7.4, 0.45, 15.6, 0x4a3a2a);
      cyl(B, 0.08, 0.9, 8.6, 0.45, 15.6, 0x4a3a2a);
      tsign(B.g, 'SERVICES SUN', 8, 1.2, 15.5, 1.4, 1, '#d8c8a8', '#222', 'bold 44px Arial');
      rearDoorBits(B, 10, -11.7, 3.2);
      PR.bin(B, 5, -13.4);
      PR.bin(B, 13, -13.4);
    }
  });
}

// ---- full-tile yards (no single main shell): cemetery, water tower compound, park, corn maze
const zAt = (B, x, z) => zombie(WX(B, x), WZ(B, z));
const yard = (x, z, t, kind) => {
  const B = mk(x, z, 38, 34, 0, 0x777777, 0x3a4a30, 0x333333);
  B.dx = 0;
  B.yardKind = kind;
  return B;
};
const wallRun = (B, x0, x1, z0, z1, h, col, th = 0.4) => {
  const m = mesh(BX(Math.max(th, x1 - x0), h, Math.max(th, z1 - z0)), col, (x0 + x1) / 2, h / 2, (z0 + z1) / 2, B.g);
  addSolid(m);
  return m;
};
function railFence(B, x0, x1, z0, z1, gaps) {
  /* split-rail fence on one axis-aligned run, gaps=[[a,b]] along the run */ const horiz = Math.abs(z1 - z0) < 0.01,
    L = horiz ? x1 - x0 : z1 - z0;
  const ok = u => !(gaps || []).some(g => u > g[0] && u < g[1]);
  for (let u = 0; u <= L + 0.01; u += 2.4) {
    const c = (horiz ? x0 : z0) + u;
    if (!ok(c)) continue;
    horiz ? deco(B, 0.16, 1.2, 0.16, c, 0.6, z0, 0x6a4a2a) : deco(B, 0.16, 1.2, 0.16, x0, 0.6, c, 0x6a4a2a);
  }
  const segs = [];
  let a = horiz ? x0 : z0;
  const e = horiz ? x1 : z1;
  const gs = (gaps || []).slice().sort((p, q) => p[0] - q[0]);
  for (const g of gs) {
    if (g[0] > a) segs.push([a, g[0]]);
    a = Math.max(a, g[1]);
  }
  if (a < e) segs.push([a, e]);
  for (const [s, f] of segs)
    for (const y of [0.55, 0.95]) {
      const m = mesh(
        BX(horiz ? f - s : 0.1, 0.1, horiz ? 0.1 : f - s),
        0x7a5a3a,
        horiz ? (s + f) / 2 : x0,
        y,
        horiz ? z0 : (s + f) / 2,
        B.g
      );
      if (y > 0.9) addSolid(m);
    }
}

function bCemetery(x, z, t) {
  const B = yard(x, z, t, 'cemetery');
  flatM(38, 34, 0x44563a, 0, 0.02, 0, B.g);
  flatM(2.6, 31, 0x8a8478, 0, 0.03, 0, B.g);
  flatM(32, 2, 0x8a8478, 0, 0.03, 2.5, B.g);
  const W = 18.6,
    F = 16.6;
  wallRun(B, -W, W, -F - 0.2, -F + 0.2, 1.9, 0x8a8a84);
  wallRun(B, -W - 0.2, -W + 0.2, -F, F, 1.9, 0x8a8a84);
  wallRun(B, W - 0.2, W + 0.2, -F, F, 1.9, 0x8a8a84);
  wallRun(B, -W, -2.2, F - 0.2, F + 0.2, 1.9, 0x8a8a84);
  wallRun(B, 2.2, W, F - 0.2, F + 0.2, 1.9, 0x8a8a84);
  for (const s of [-1, 1]) {
    deco(B, 0.6, 3, 0.6, s * 2.3, 1.5, F, 0x6a6a66);
    for (let i = 0; i < 5; i++) deco(B, 0.06, 2.2, 0.06, s * (0.4 + i * 0.34), 1.1, F, 0x222222);
  }
  deco(B, 4.6, 0.15, 0.15, 0, 2.9, F, 0x222222);
  tsign(B.g, "ST. JUDE'S CEMETERY", 0, 3.5, F + 0.1, 4.4, 0.5, '#2a2a2a', '#d8d0c0', 'bold 30px Georgia');
  for (let r = 0; r < 5; r++)
    for (let k = 0; k < 10; k++) {
      const gx = k < 5 ? -14.5 + k * 2.7 : 3.7 + (k - 5) * 2.7,
        gz = 13 - r * 3.4;
      if (Math.abs(gx) < 1.6) continue;
      if (gz < -3 && Math.abs(gx) < 6.5) continue;
      const big = Math.random() < 0.12;
      const hs = mesh(
        BX(big ? 0.6 : 0.8, big ? 2.2 : 1.1, 0.22),
        big ? 0x9a9a98 : 0x8a8a88,
        gx,
        big ? 1.1 : 0.55,
        gz - 0.9,
        B.g
      );
      addSolid(hs);
      flatM(0.9, 2, 0x3e4e34, gx, 0.045, gz, B.g);
      B.occ.push([gx - 0.7, gx + 0.7, gz - 1.3, gz + 0.5]);
    }
  const mz = subB(B, 0, -10, 10, 7, 4.6, 0x9a9a94, 0x6a6a66, 0x2a2a2a);
  shell(mz, {f: [{k: 'd', c: 0}], b: [], l: [], r: []}); /* open rear wall replaced below */
  furn(
    mz,
    [
      ['grave', 'n', 0.2],
      ['grave', 'n', 0.8],
      ['grave', 'w', 0.5],
      ['grave', 'e', 0.5]
    ],
    [-4.8, 4.8, -3.3, 3.3]
  );
  rc(mz, 'cemetery', [-4.8, 4.8, -3.3, 3.3], 2);
  roof(mz, 4.6, 'pyr', 0x7a7a74);
  deco(mz, 0.4, 0.9, 0.4, 0, 6.6, 0, 0xc8c8c0);
  deco(mz, 1.1, 0.3, 0.4, 0, 6.8, 0, 0xc8c8c0);
  done(mz, 'cemetery_mausoleum', ri(0, 1));
  const sd = subB(B, 13.5, -13, 4, 3, 2.6, 0x6a5a4a, 0x5a4a3a, 0x2a2a2a);
  shell(sd, {f: [{k: 'd', c: 0}], b: [], l: [], r: []});
  rc(sd, 'hardware', [-1.7, 1.7, -1.2, 1.2], 1);
  roof(sd, 2.6, 'gable', 0x4a3a2a);
  done(sd, 'cemetery_shed', 0);
  rc(B, 'cemetery', [-16, 16, -14, 14], 2);
  buildings.push({x: B.x, z: B.z, w: 36, d: 32, t: 'cemetery'});
  for (let i = ri(3, 6); i > 0; i--)
    Math.random() < 0.6 ? zAt(B, rnd(-1, 1), rnd(-3, 14)) : zAt(B, rnd(-14, 14), 2.5 + rnd(-0.8, 0.8));
  LASTB = B;
  return B;
}

function bWaterTower(x, z, t) {
  const B = yard(x, z, t, 'tower');
  flatM(38, 34, 0x6a6c70, 0, 0.02, 0, B.g);
  flatM(38, 10, 0x5a5c60, 0, 0.025, -4, B.g);
  const W = 18.6,
    F = 16.6,
    chain = (a, b, c, d) => {
      const m = mesh(
        BX(Math.max(0.05, b - a), 1.8, Math.max(0.05, d - c)),
        0x8a8f94,
        (a + b) / 2,
        1.2,
        (c + d) / 2,
        B.g
      );
      m.material.transparent = true;
      m.material.opacity = 0.35;
      addSolid(m);
    };
  chain(-W, -3.2, F, F);
  chain(3.2, W, F, F);
  chain(-W, -3, -F, -F);
  chain(3, W, -F, -F);
  chain(-W, -W, -F, F);
  chain(W, W, -F, F);
  deco(B, 3.4, 1.8, 0.08, 5.2, 0.9, -F, 0x5a5e62);
  for (let u = -W; u <= W + 0.01; u += 3)
    for (const zz of [-F, F]) if (Math.abs(u) > 3.2) deco(B, 0.1, 2, 0.1, u, 1, zz, 0x777c80);
  tsign(B.g, 'KERBEROS PRODUCTIONS - AUTHORISED ONLY', 0, 3.6, F + 0.1, 7, 0.6, '#222', '#e8e8e0', 'bold 26px Arial');
  const tz = -6;
  slab(B, -5, 5, tz - 5, tz + 5, 0, 0.3, 0x7a7c80, true);
  for (const [lx, lz] of [
    [-3.5, -3.5],
    [3.5, -3.5],
    [-3.5, 3.5],
    [3.5, 3.5]
  ])
    slab(B, lx - 0.3, lx + 0.3, tz + lz - 0.3, tz + lz + 0.3, 0.3, 13, 0x6a7a8a);
  for (let k = 0; k < 3; k++) {
    const yy = 3 + k * 3.6;
    deco(B, 7.4, 0.18, 0.18, 0, yy, tz - 3.5, 0x5a6a7a);
    deco(B, 7.4, 0.18, 0.18, 0, yy, tz + 3.5, 0x5a6a7a);
    deco(B, 0.18, 0.18, 7.4, -3.5, yy, tz, 0x5a6a7a);
    deco(B, 0.18, 0.18, 7.4, 3.5, yy, tz, 0x5a6a7a);
  }
  const tk = mesh(new THREE.CylinderGeometry(4.2, 4.2, 5.2, 20), 0xbfc6cc, 0, 15.6, tz, B.g);
  addSolid(tk);
  const rf = mesh(new THREE.ConeGeometry(4.5, 2.2, 20), 0x8a9298, 0, 19.3, tz, B.g);
  for (let k = 0; k < 3; k++) cyl(B, 4.25, 0.14, 0, 13.6 + k * 2.1, tz, 0x6a727a, false, 20);
  deco(B, 0.1, 13, 0.1, 3.2, 6.5, tz + 4.2, 0xc8a030);
  tsign(B.g, 'KERBEROS', 0, 15.6, tz + 4.25, 4, 1.1, '#bfc6cc', '#c0392b', 'bold 80px Impact');
  const off = subB(B, 0, 8.5, 20, 9, 3.6, 0x8a9aa8, 0x7a7a80, 0x2a3a4a);
  off.dx = 0;
  shell(off, {
    f: [...wins([-7.5, -4.5, 4.5, 7.5]), {k: 'd', c: 0}],
    b: [
      {k: 'd', c: 7, s: -1},
      {k: 'w', c: -4}
    ],
    l: wins([0]),
    r: wins([0])
  });
  WL(off, 0, 6, -4.4, 1.6, [], 3.6, {th: 0.2, c: 0xcbbfae});
  WL(off, 1, 1.7, 6, 9.8, [{k: 'd', c: 8}], 3.6, {th: 0.2, c: 0xcbbfae});
  furn(
    off,
    [
      ['servrack', 'n', 0.1],
      ['servrack', 'n', 0.5],
      ['servrack', 'n', 0.9],
      ['monitor', 'e', 0.5]
    ],
    [6.15, 9.8, -4.3, 1.5]
  );
  for (let i = 0; i < 5; i++) put(off, 'monitor', -8 + i * 2.4, i % 2 ? -0.6 : -2.8, i % 2 ? PI : 0);
  put(off, 'monitor', -8, 3, PI);
  put(off, 'desk', -1.5, 3.4);
  put(off, 'desk', 2.4, 3.4);
  rc(off, 'office', [-9.8, 5.8, -4.3, 4.3], 3);
  roof(off, 3.6, 'flat', 0x4a4a48);
  tsign(off.g, 'KERBEROS PRODUCTIONS', 0, 4.5, 4.62, 7, 0.9, '#1a1a22', '#e8e8e0', 'bold 40px Arial');
  PR.pave(off, 0, 20, 4.5, 6.8, 0x9a9ca0);
  done(off, 'kerberos_office', ri(1, 2));
  deco(B, 3, 0.1, 1, -14, 0.12, 12, 0x555);
  PR.dump(B, -12, -14);
  PR.lamp(B, 5.2, 3.2, -F + 0.2, 1);
  buildings.push({x: B.x, z: B.z, w: 36, d: 32, t: t.id});
  for (let i = ri(2, 4); i > 0; i--) zAt(B, (Math.random() < 0.5 ? -1 : 1) * rnd(11, 17), rnd(-14, 14));
  LASTB = B;
  return B;
}

function bPlayground(x, z, t) {
  const B = yard(x, z, t, 'park');
  flatM(38, 34, 0x3f7a2f, 0, 0.02, 0, B.g);
  const W = 18.6,
    F = 16.6,
    gap = [[-2.4, 2.4]];
  railFence(B, -W, W, F, F, gap);
  railFence(B, -W, W, -F, -F, [[-2.4, 2.4]]);
  railFence(B, -W, -W, -F, F, []);
  railFence(B, W, W, -F, F, []);
  flatM(3, 34, 0x9a927f, 0, 0.03, 0, B.g);
  flatM(34, 3, 0x9a927f, 0, 0.03, 0, B.g);
  flatM(7.4, 7.4, 0xa89f88, 0, 0.035, 0, B.g);
  const mon = slab(B, -1.6, 1.6, -1.6, 1.6, 0, 0.5, 0x8a8a88);
  slab(B, -0.9, 0.9, -0.9, 0.9, 0.5, 1, 0x9a9a98);
  slab(B, -0.5, 0.5, -0.5, 0.5, 1, 4.6, 0xaaaaa6);
  deco(B, 1.4, 0.8, 0.1, 0, 0.8, 1.65, 0x4a4a48);
  tsign(B.g, 'IN MEMORIAM', 0, 0.75, 1.72, 1.2, 0.6, '#3a3a38', '#d8d0c0', 'bold 40px Georgia');
  for (const [bx, bz, ry] of [
    [-5.5, 3, 0],
    [5.5, 3, 0],
    [-5.5, -3, PI],
    [5.5, -3, PI],
    [0, 10, 0],
    [-10, 0, PI / 2]
  ]) {
    slab(B, bx - 1, bx + 1, bz - 0.3, bz + 0.3, 0.35, 0.5, 0x6a4a2a);
    deco(B, 2, 0.4, 0.08, bx, 0.85, bz + (ry ? 0.28 : -0.28), 0x6a4a2a);
  }
  // playground zone (west half, rear): swings, slide, sandbox
  const sx = -11,
    sz = -9;
  for (const s of [-1, 1]) {
    slab(B, sx + s * 2.6 - 0.1, sx + s * 2.6 + 0.1, sz - 0.1, sz + 0.1, 0, 2.6, 0x8a8f94);
  }
  slab(B, sx - 2.7, sx + 2.7, sz - 0.08, sz + 0.08, 2.55, 2.7, 0x8a8f94);
  for (const s of [-0.9, 0.9]) {
    deco(B, 0.03, 2.4, 0.03, sx + s, 1.4, sz, 0x222222);
    deco(B, 0.5, 0.06, 0.2, sx + s, 0.45, sz, 0xc0392b);
  }
  const slx = -5,
    slz = -12;
  slab(B, slx - 1, slx + 1, slz - 0.5, slz + 0.5, 0, 2, 0x2a6ad0);
  const sl = mesh(BX(1, 0.1, 3.4), 0xe8b030, slx, 1, slz + 2.4, B.g);
  sl.rotation.x = 0.62;
  for (const [w, d, px, pz] of [
    [3.4, 0.2, -11, -14.5],
    [3.4, 0.2, -11, -11.5],
    [0.2, 3, -12.8, -13],
    [0.2, 3, -9.2, -13]
  ])
    slab(B, px - w / 2, px + w / 2, pz - d / 2, pz + d / 2, 0, 0.3, 0x7a5a3a);
  flatM(3.2, 2.8, 0xd8c890, -11, 0.05, -13, B.g);
  for (const [tx, tz] of [
    [-14, 10],
    [14, 10],
    [14, -10],
    [-3, -14]
  ])
    bldTree(B, tx, tz, 0.9);
  for (const o of [[-13, -8, -9, -2.6, -16.5, -8.4]]);
  B.occ.push([-14.5, -7, -15.5, -6]);
  B.occ.push([-3, 3, -3, 3]);
  rc(B, 'park', [-16, 16, -15, 15], 3);
  buildings.push({x: B.x, z: B.z, w: 36, d: 32, t: 'park'});
  for (let i = ri(2, 4); i > 0; i--)
    Math.random() < 0.5 ? zAt(B, rnd(-15, 15), rnd(-1.2, 1.2)) : zAt(B, rnd(-1.2, 1.2), rnd(-14, 14));
  LASTB = B;
  return B;
}

function bCornMaze(x, z, t) {
  const B = yard(x, z, t, 'maze');
  flatM(38, 34, 0x6a6a34, 0, 0.02, 0, B.g);
  const C = 9,
    R = 6,
    cs = 4.1,
    x0 = (-C * cs) / 2,
    z0 = -15.3,
    wt = 0.9; /* maze cells (col,row); row R is the front side (+Z) */
  const vis = [],
    Vw = [],
    Hw = [];
  for (let i = 0; i <= C; i++) {
    Vw.push([]);
    for (let j = 0; j < R; j++) Vw[i].push(1);
  }
  for (let j = 0; j <= R; j++) {
    Hw.push([]);
    for (let i = 0; i < C; i++) Hw[j].push(1);
  }
  const seen = new Set(),
    stack = [[4, R - 1]];
  seen.add(4 + ',' + (R - 1));
  while (stack.length) {
    const [ci, cj] = stack[stack.length - 1],
      nb = [
        [ci + 1, cj],
        [ci - 1, cj],
        [ci, cj + 1],
        [ci, cj - 1]
      ].filter(([a, b]) => a >= 0 && a < C && b >= 0 && b < R && !seen.has(a + ',' + b));
    if (!nb.length) {
      stack.pop();
      continue;
    }
    const [a, b] = nb[ri(0, nb.length - 1)];
    if (a !== ci) Vw[Math.max(a, ci)][cj] = 0;
    else Hw[Math.max(b, cj)][ci] = 0;
    seen.add(a + ',' + b);
    stack.push([a, b]);
  }
  for (let i = 3; i <= 5; i++)
    for (let j = 2; j <= 3; j++) {
      if (i < 5) Vw[i + 1][j] = 0;
      if (j < 3) Hw[j + 1][i] = 0;
    }
  Hw[R][4] = 0;
  Hw[0][1] = 0; /* entry (front) and rear exit */
  const corn = (w, d, px, pz) => {
    const m = mesh(BX(w, 2.7, d), [0x7f9a3a, 0x8aa03a, 0x6f8a30][ri(0, 2)], px, 1.35, pz, B.g);
    addSolid(m);
    deco(B, w * 0.94, 0.5, d * 0.9, px, 2.85, pz, 0xc8b040);
  };
  for (let i = 0; i <= C; i++)
    for (let j = 0; j < R; j++) if (Vw[i][j]) corn(wt, cs + wt, x0 + i * cs, z0 + j * cs + cs / 2);
  for (let j = 0; j <= R; j++)
    for (let i = 0; i < C; i++) if (Hw[j][i]) corn(cs, wt, x0 + i * cs + cs / 2, z0 + j * cs);
  flatM(3 * cs - 0.4, 2 * cs - 0.4, 0x9a8a4a, 0, 0.04, z0 + 2.5 * cs + 0, B.g);
  const FX = 19.2,
    FZ = 17.2;
  railFence(B, -FX, FX, FZ, FZ, [[-3, 3]]);
  railFence(B, -FX, FX, -FZ, -FZ, [[-5.2, -3.2]]);
  railFence(B, -FX, -FX, -FZ, FZ, []);
  railFence(B, FX, FX, -FZ, FZ, []);
  const ez = 12.4;
  for (const s of [-1, 1]) slab(B, s * 2.6 - 0.2, s * 2.6 + 0.2, ez - 0.2, ez + 0.2, 0, 3.4, 0x6a4a2a);
  slab(B, -2.8, 2.8, ez - 0.2, ez + 0.2, 3.3, 3.7, 0x6a4a2a);
  tsign(B.g, 'CORN MAZE', 0, 3.0, ez + 0.25, 4.6, 0.8, '#e8d8a0', '#6a3a10', 'bold 56px Impact');
  const tb = mesh(BX(2.4, 2.2, 1.8), 0x7a5a3a, 7, 1.1, 13.5, B.g);
  addSolid(tb);
  glassP(B, 7, 1.4, 12.55, 1.4, 0.7);
  tsign(B.g, 'TICKETS $5', 7, 2.5, 12.55, 2, 0.5, '#e8d8a0', '#6a3a10', 'bold 30px Impact');
  for (let i = 0; i < 3; i++) deco(B, 0.9, 0.9, 0.9, -8 + i * 1.1, 0.45, 14, 0xd08a20);
  rc(B, 'cornmaze', [-5.8, 5.8, z0 + 2.5 * cs - 3.8, z0 + 2.5 * cs + 3.8], 2);
  B.occ.push([6.5, 8.5, 12.5, 14.5]);
  buildings.push({x: B.x, z: B.z, w: 36, d: 34, t: 'park'});
  for (let i = ri(3, 6); i > 0; i--) zAt(B, x0 + ri(0, C - 1) * cs + cs / 2, z0 + ri(0, R - 1) * cs + cs / 2);
  LASTB = B;
  return B;
}

// ================= THE NEW CATALOGUE =================
const NEWCAT = [];
const nvar = () => ({intact: {props: []}, looted: {props: []}, ruined: {props: []}});
function defN(id, name, pool, cat, build, loot, note) {
  NEWCAT.push({
    id,
    name,
    pool,
    scope: pool,
    category: cat,
    front: 'south',
    builder: 'prop',
    build,
    loot,
    note: note || '',
    w: pool === 'half' ? HALFD.w : BIGD.w,
    d: pool === 'half' ? HALFD.d : BIGD.d,
    variants: nvar(),
    legacy: false
  });
}
BUILDERS.prop = (x, z, t) => t.build(x, z, t);
// POOL 1 — dynamic half-lots
defN('piety_mutual_bank', 'Piety Mutual Bank', 'half', 'commercial', hBank, 'bank');
defN('piety_medical_clinic', 'Piety Medical Clinic', 'half', 'commercial', hClinic, 'clinic');
defN('cuppa_joe', 'Cuppa Joe', 'half', 'commercial', hCoffee, 'coffee');
defN('mr_foos_takeout', "Mr. Foo's Takeout", 'half', 'commercial', hFoo, 'takeout');
defN('rays_storage_units', "Ray's Storage & Containment Units", 'half', 'commercial', hRay, 'storage');
defN('fancypantz_wearables', 'Fancypantz Wearables', 'half', 'commercial', hFancy, 'clothing');
defN('andolinis_groceria', "Andolini's Groceria", 'half', 'commercial', hAndolini, 'convenience');
defN('white_trash_house', 'White Trash House', 'half', 'residential', hWhiteTrash, 'house');
defN('geins_butcheria', "Gein's Butcheria", 'half', 'commercial', hButcher, 'butcher');
defN('laundromat', 'Laundromat', 'half', 'commercial', hLaundro, 'laundromat');
// POOL 2 — full-tile compounds
defN('food_library', 'The Food Library', 'big', 'commercial', bFoodLib, 'supermarket');
defN('lucky_ducky', 'Lucky Ducky: Grocery & Meats', 'big', 'commercial', bLucky, 'supermarket');
defN('eco_pump', 'Eco Pump', 'big', 'commercial', bEcoPump, 'gas');
defN('trigger_guard', 'The Trigger Guard', 'big', 'commercial', bTrigger, 'gunshop');
defN('gutter_lanes', 'Gutter Lanes', 'big', 'commercial', bBowling, 'bowling');
defN('willy_burgerorium', "Willy the Fox's Burgerorium", 'big', 'commercial', bBurger, 'burger');
defN('golden_fences_pawn', 'Golden Fences Pawn Shop', 'big', 'commercial', bPawn, 'pawn');
defN('morgans_drug', "Morgan's Drug & Pharmacy", 'big', 'commercial', bPharmacy, 'pharmacy');
defN('krasche_burns_autos', 'Krasche & Burns Used Autos', 'big', 'commercial', bCarLot, 'auto');
defN('hammertime', 'Hammertime', 'big', 'commercial', bHardware, 'hardware');
defN('sunshine_motel', 'Sunshine Motel', 'big', 'commercial', bMotel, 'motel');
defN('the_aztec', 'The Aztec', 'big', 'commercial', bAztec, 'cinema');
defN('church', 'Church', 'big', 'civic', bChurchN, 'church');
defN('cemetery', 'Cemetery', 'big', 'civic', bCemetery, 'cemetery');
defN('water_tower_kerberos', 'Water Tower & Kerberos Productions', 'big', 'civic', bWaterTower, 'office');
defN('playground_memorial_park', 'Playground & Memorial Park', 'big', 'civic', bPlayground, 'park');
defN('corn_maze', 'Corn Maze', 'big', 'civic', bCornMaze, 'cornmaze');
NEWCAT.forEach(d => {
  d.variants = {
    intact: {props: []},
    looted: {props: ['trash', 'glass', 'papers']},
    ruined: {props: ['rubble', 'beam', 'tarp']}
  };
});
const LABCAT = NEWCAT.concat(CATALOGUE); // dev toolkit browses the new catalogue first, then the quarantined legacy one
function validateNewCatalogue() {
  const E = [],
    ids = new Set();
  const H = NEWCAT.filter(d => d.pool === 'half'),
    Bg = NEWCAT.filter(d => d.pool === 'big');
  if (H.length < 10) E.push('half-lot pool has ' + H.length + ' entries, expected at least 10');
  if (Bg.length < 17) E.push('BIG pool has ' + Bg.length + ' entries, expected at least 17'); // v073: layers add more (newlots.js)
  for (const d of NEWCAT) {
    if (d.max !== undefined && !(d.max >= 1 && d.max <= 3))
      E.push(d.id + ': max must be 1-3 (a repeat needs a different condition)');
    if ((d.min || 0) > (d.max || 2)) E.push(d.id + ': min > max');
  }
  for (const d of NEWCAT) {
    if (ids.has(d.id)) E.push('duplicate id ' + d.id);
    ids.add(d.id);
    if (!d.name || typeof d.build !== 'function') E.push(d.id + ': missing name/build');
    if (d.loot && !LOOT_TABLES[d.loot]) E.push(d.id + ': missing loot table ' + d.loot);
  }
  return E;
}
window.__newCatalogueErrors = validateNewCatalogue();
if (window.__newCatalogueErrors.length) console.error('NEW CATALOGUE INVALID', window.__newCatalogueErrors);

// ================= MAP GENERATOR v2 =================
function slotOf(p, sub) {
  if (!sub)
    return {
      id: p.id,
      sub: null,
      col: p.col,
      row: p.row,
      block: p.block,
      front: p.front,
      x0: p.x0,
      x1: p.x1,
      z0: p.z0,
      z1: p.z1,
      cx: p.cx,
      cz: p.cz
    };
  const a = sub === 'A';
  const x0 = a ? p.x0 : p.cx,
    x1 = a ? p.cx : p.x1;
  return {
    id: p.id + sub,
    sub,
    col: p.col,
    row: p.row,
    block: p.block,
    front: p.front,
    x0,
    x1,
    z0: p.z0,
    z1: p.z1,
    cx: (x0 + x1) / 2,
    cz: p.cz
  };
}
function planTownV2(L) {
  const bigs = NEWCAT.filter(d => d.pool === 'big'),
    halves = NEWCAT.filter(d => d.pool === 'half'),
    n = L.plots.length;
  /* v044: every building appears at most twice, and a repeated building always has two different conditions (0 intact, 1 looted, 2 ruined).
    v073: d.max (1-3, default 2; zMissionMapDB MaxCount 1 -> max 1) and d.min (houses: every town gets some, Survivors rumours want a house 70% of the time).
    19 half-lot types now, so 10-12 two-building plots (20-24 half slots) and the rest are full-plot compounds. */
  const nDual = ri(10, 12),
    nBig = n - nDual,
    cnt = {},
    used = {},
    cap = d => d.max || 2;
  const take = (list, k) => {
    const out = [],
      MUST = window.TOWN_MUST || []; // v092: ids a caller needs in this town (the main menu's town: its scenes need a church, ...)
    for (const d of shuf(list))
      for (let i = 0; i < Math.min(Math.max(d.min || 0, MUST.includes(d.id) ? 1 : 0), cap(d)) && out.length < k; i++) {
        cnt[d.id] = (cnt[d.id] || 0) + 1;
        out.push(d);
      }
    let bag = [];
    while (out.length < k) {
      if (!bag.length) bag = shuf(list.filter(d => (cnt[d.id] || 0) < cap(d)));
      if (!bag.length) break;
      const d = bag.pop();
      if ((cnt[d.id] || 0) >= cap(d)) continue;
      cnt[d.id] = (cnt[d.id] || 0) + 1;
      out.push(d);
    }
    return shuf(out);
  };
  const cond = d => {
    const u = used[d.id] || (used[d.id] = []),
      o = [0, 1, 2].filter(c => !u.includes(c)),
      c = o[ri(0, o.length - 1)];
    u.push(c);
    return c;
  };
  const kinds = shuf([...Array(nDual).fill('dual'), ...Array(nBig).fill('big')]);
  let hs = take(halves, 2 * nDual),
    bs = take(bigs, nBig);
  for (let t = 0; t < 200; t++) {
    let bad = 0;
    for (let i = 0; i < hs.length; i += 2) if (hs[i + 1] && hs[i].id === hs[i + 1].id) bad++;
    if (!bad) break;
    hs = shuf(hs);
  }
  return L.plots.map((p, i) => {
    if (kinds[i] === 'big') {
      const d = bs.pop();
      return {plot: p, kind: 'big', defs: [d], lvs: [cond(d)]};
    }
    const A = hs.pop(),
      B = hs.pop();
    return {plot: p, kind: 'dual', defs: [A, B], lvs: [cond(A), cond(B)]};
  });
}
function drawSlotGround(p, it) {
  const F = (w, d, c, x, z, y) => {
      const m = mesh(new THREE.PlaneGeometry(w, d), c, x, y, z);
      m.rotation.x = -PI / 2;
      return m;
    },
    col = {residential: 0x2d3b26, commercial: 0x3b3c3e, civic: 0x3a4036};
  if (it.kind === 'big') return drawPlot(p, it.defs[0].category);
  drawPlot(p, it.defs[0].category);
  F(GRID.PW / 2, GRID.PD, col[it.defs[1].category], p.cx + GRID.PW / 4, p.cz, 0.009);
  F(4, 22, 0x4a4a48, p.cx, p.cz, 0.012);
}
function subPlotDivider(p) {
  /* central dividing wall + utility space between Sub-Plot A and B (parent-tile geometry) */
  const g = new THREE.Group();
  g.position.set(p.cx, 0, p.cz);
  scene.add(g);
  const m = (w, h, d, x, y, z, c) => mesh(BX(w, h, d), c, x, y, z, g);
  addSolid(m(0.3, 2.6, HALFD.d, 0, 1.3, 0, 0x8a8a86));
  m(0.5, 0.12, HALFD.d, 0, 2.66, 0, 0x6a6a66);
  for (const s of [-1, 1]) {
    m(0.5, 1.3, 0.45, s * 0.4, 0.9, -3.5, 0x5a6a5a);
    m(0.2, 0.3, 0.3, s * 0.4, 1.7, -3.5, 0xe8c020);
    for (const zz of [2.5, 4.5]) cyl2(g, 0.07, 2.6, s * 0.3, 1.3, zz, 0x7a7a7a);
    m(0.4, 0.5, 0.4, s * 0.35, 0.4, 7, 0x8a8a88);
    m(0.35, 0.12, 0.5, s * 0.3, 2.2, -8, 0x555555);
  }
  return g;
}
function cyl2(g, r, h, x, y, z, c) {
  const m = mesh(new THREE.CylinderGeometry(r, r, h, 6), c, x, y, z, g);
  return m;
}
const NOYARD = new Set([
  'eco_pump',
  'golden_fences_pawn',
  'krasche_burns_autos',
  'cemetery',
  'water_tower_kerberos',
  'playground_memorial_park',
  'corn_maze',
  'white_trash_house'
]);
/* v044: side/rear walls or fences with a rear gate. Local frame = the plot centre, front = +Z (same rotation as the building). */
function yardEnclosure(s, sub, t, lv, B) {
  if (NOYARD.has(t.id)) return null;
  const cs = s.front === 'south' ? 1 : -1,
    g = new THREE.Group();
  g.position.set(s.cx, 0, s.cz);
  g.rotation.y = cs < 0 ? PI : 0;
  scene.add(g);
  const hw = (s.x1 - s.x0) / 2 - 0.2,
    rz = -(GRID.PD / 2 - 0.2),
    fz = (t.pool === 'half' ? HALFD.d : BIGD.d) / 2,
    r = Math.random(),
    style = t.category === 'commercial' ? (r < 0.35 ? 'chain' : 'wall') : 'wood',
    H = style === 'wall' ? 2.3 : style === 'chain' ? 2.2 : 1.9,
    col = style === 'wall' ? 0x8d8a84 : style === 'chain' ? 0x8a8f94 : 0x6b4a2b,
    pc = style === 'wood' ? 0x4a3220 : 0x6a6f74;
  const seg = (x0, x1, z0, z1) => {
    if (x1 - x0 < 0.05 && z1 - z0 < 0.05) return;
    const hz = x1 - x0 > z1 - z0,
      L = hz ? x1 - x0 : z1 - z0,
      n = Math.max(1, Math.ceil(L / 5));
    for (let i = 0; i < n; i++) {
      if (lv === 2 && Math.random() < 0.35) continue;
      const a0 = i / n,
        a1 = (i + 1) / n,
        X0 = hz ? x0 + (x1 - x0) * a0 : x0,
        X1 = hz ? x0 + (x1 - x0) * a1 : x1,
        Z0 = hz ? z0 : z0 + (z1 - z0) * a0,
        Z1 = hz ? z1 : z0 + (z1 - z0) * a1;
      const m = mesh(
        BX(Math.max(0.2, X1 - X0), H, Math.max(0.2, Z1 - Z0)),
        col,
        (X0 + X1) / 2,
        H / 2,
        (Z0 + Z1) / 2,
        g
      );
      if (style === 'chain') {
        m.material.transparent = true;
        m.material.opacity = 0.4;
      }
      addSolid(m);
      mesh(
        BX(Math.max(0.3, X1 - X0) + 0.02, 0.12, Math.max(0.3, Z1 - Z0) + 0.02),
        pc,
        (X0 + X1) / 2,
        H + 0.04,
        (Z0 + Z1) / 2,
        g
      );
      mesh(BX(0.3, H + 0.15, 0.3), pc, hz ? X0 : (X0 + X1) / 2, (H + 0.15) / 2, hz ? (Z0 + Z1) / 2 : Z0, g);
    }
  };
  const inner = sub ? (sub === 'A' ? 1 : -1) * cs * hw : null;
  // gate: first free spot along the rear wall
  let gx = null;
  for (const c of [0, 4, -4, 7, -7, 9, -9, 11, -11]) {
    if (Math.abs(c) > hw - 1.6) continue;
    if (
      !blocked(s.cx + cs * c, s.cz + cs * (rz + 1.5), 0.8, 0, 1.8) &&
      !blocked(s.cx + cs * c, s.cz + cs * (rz + 3.2), 0.8, 0, 1.8)
    ) {
      gx = c;
      break;
    }
  }
  if (gx === null) seg(-hw, hw, rz - 0.1, rz + 0.1);
  else {
    seg(-hw, gx - 0.8, rz - 0.1, rz + 0.1);
    seg(gx + 0.8, hw, rz - 0.1, rz + 0.1);
    for (const sx of [-0.8, 0.8]) mesh(BX(0.3, H + 0.3, 0.3), pc, gx + sx, (H + 0.3) / 2, rz, g);
    mesh(BX(1.9, 0.12, 0.3), pc, gx, H + 0.34, rz, g);
    mkDoor({g, y: 0, dc: style === 'wood' ? 0x5a3a22 : 0x3a3a3a, occ: []}, 1, rz, gx, PK([1, -1]));
  }
  for (const sx of [-hw, hw]) {
    const isInner = inner !== null && Math.abs(sx - inner) < 0.01;
    seg(sx - 0.1, sx + 0.1, rz, isInner ? -fz : fz);
  }
  return g;
}
/* v075: the town is built in steps (plan, one step per plot, final checks) so a loading screen can show progress between them.
   buildTownV2 runs them all at once, as before. */
function buildPlotV2(it, R, pop) {
  const p = it.plot;
  try {
    drawSlotGround(p, it);
    if (it.kind === 'big') {
      const t = it.defs[0],
        lv = it.lvs[0],
        s = slotOf(p, null),
        r = bld(s.cx, s.cz, t, lv, s);
      {
        const b0 = buildings[buildings.length - 1];
        if (b0) {
          b0.cat = t.id;
          b0.cond = lv;
        }
      }
      try {
        yardEnclosure(s, null, t, lv, r.B);
      } catch (e) {
        console.error('yard', t.id, e);
      }
      R.placementErrors.push(...checkPlacement(s, t, r.n0, r.B));
      R.plan.push({plot: p.id, id: t.id, cond: COND_NAMES[lv], front: p.front, kind: 'BIG'});
    } else {
      const ids = [],
        cn = [];
      ['A', 'B'].forEach((sb, k) => {
        const t = it.defs[k],
          lv = it.lvs[k],
          s = slotOf(p, sb),
          r = bld(s.cx, s.cz, t, lv, s);
        try {
          yardEnclosure(s, sb, t, lv, r.B);
        } catch (e) {
          console.error('yard', t.id, e);
        }
        R.placementErrors.push(...checkPlacement(s, t, r.n0, r.B));
        ids.push(t.id);
        cn.push(COND_NAMES[lv]);
        const bn = buildings[buildings.length - 1];
        if (bn) {
          bn.sub = sb;
          bn.cat = t.id;
          bn.cond = lv;
        }
      });
      const n0 = scene.children.length,
        g = subPlotDivider(p);
      R.placementErrors.push(...checkPlacement(p, {id: 'divider'}, n0 - 1, null));
      R.plan.push({plot: p.id, id: ids.join('+'), cond: cn.join('/'), front: p.front, kind: '2 BUILD', subs: ids});
    }
    pop.add(p.id);
  } catch (err) {
    R.placementErrors.push('plot ' + p.id + ' failed: ' + err.message);
    console.error('plot build fail', p.id, err);
  }
}
function finishTownV2(plan, R, pop) {
  if (pop.size !== 32 || R.plan.length !== 32)
    R.placementErrors.push('only ' + R.plan.length + ' of 32 plots were populated');
  R.stats = {big: plan.filter(i => i.kind === 'big').length, dual: plan.filter(i => i.kind === 'dual').length};
  if (R.placementErrors.length)
    console.error('TOWN VALIDATION: ' + R.placementErrors.length + ' problem(s)', R.placementErrors);
  else {
    console.log('TOWN VALIDATION OK');
    console.log(
      '  ' +
        R.stats.big +
        ' BIG + ' +
        R.stats.dual +
        ' 2-BUILD tiles = 32 plots, ' +
        (R.stats.big + 2 * R.stats.dual) +
        ' properties'
    );
  }
}
function buildTownV2Steps(C) {
  const st = [
    [
      'Planning the town',
      () => {
        C.plan = planTownV2(C.L);
        C.pop = new Set();
      }
    ]
  ];
  for (let i = 0; i < GRID.COLS * GRID.ROWS; i++)
    st.push([
      () => {
        const it = C.plan && C.plan[i];
        return it ? 'Building ' + it.defs.map(d => d.name).join(' & ') : 'Building';
      },
      () => {
        const it = C.plan && C.plan[i];
        if (it) buildPlotV2(it, C.R, C.pop);
      },
      1
    ]);
  st.push(['Checking the town', () => finishTownV2(C.plan, C.R, C.pop)]);
  return st;
}
function buildTownV2(L, R) {
  const C = {L, R};
  for (const s of buildTownV2Steps(C)) s[1]();
}

// ===== v036 block ends =====
// ------------------------------------------------------------ procedural planning
function shuf(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
// QUARANTINED (v036): legacy v032 planner, not used by town().
function planTownLegacy(L) {
  const cats = {residential: [], commercial: [], civic: []};
  CATALOGUE.forEach(d => cats[d.category].push(d));
  const nR = ri(11, 14),
    nV = ri(5, 7),
    need = {residential: nR, civic: nV, commercial: 32 - nR - nV},
    must = ['medical_clinic', 'gun_shop', 'gas_station', 'diner', 'hardware_store', 'grocery_store', 'church'].map(id =>
      CATALOGUE.find(d => d.id === id)
    );
  const picks = must.slice();
  must.forEach(d => need[d.category]--);
  for (const c of Object.keys(need)) {
    let bag = shuf(cats[c].filter(d => !must.includes(d))),
      k = need[c];
    while (k-- > 0) {
      if (!bag.length) bag = shuf(cats[c]);
      picks.push(bag.pop());
    }
  }
  if (picks.length !== L.plots.length)
    throw new Error('planner produced ' + picks.length + ' buildings for ' + L.plots.length + ' plots');
  const bad = a => {
    let n = 0;
    L.plots.forEach((p, i) => {
      const q = L.plots[i + 1];
      if (q && q.row === p.row && q.col !== 0 && q.col !== 4 && a[i].id === a[i + 1].id) n++;
      if (p.row % 2 === 0) {
        const j = i + GRID.COLS;
        if (a[i].id === a[j].id) n++;
      }
    });
    return n;
  };
  let best = shuf(picks);
  for (let t = 0; t < 300 && bad(best) > 0; t++) best = shuf(picks);
  const lv = best.map(() => {
    const r = Math.random();
    return r < 0.38 ? 0 : r < 0.75 ? 1 : 2;
  });
  while (lv.filter(v => v === 0).length < 6) lv[ri(0, 31)] = 0;
  return L.plots.map((p, i) => ({plot: p, def: best[i], lv: lv[i]}));
}

function bld(x, z, t, lv, plot) {
  CUR = {cs: yawFor(t.front, plot.front) === 0 ? 1 : -1, px: x, pz: z, lv};
  const n0 = scene.children.length,
    s0 = solids.length,
    w0 = winList.length,
    d0 = doors.length;
  LASTB = null;
  BUILDERS[t.builder](x, z, t);
  const bB = LASTB;
  try {
    if (lv) ruin(x, z, t, lv, n0, s0, w0, d0);
  } catch (e) {
    console.error('ruin', t.id, e);
  }
  try {
    if (lv) litter(x, z, t);
  } catch (e) {
    console.error('litter', t.id, e);
  }
  try {
    applyCondProps(bB, t, lv);
  } catch (e) {
    console.error('condition props', t.id, e);
  }
  const b = buildings[buildings.length - 1];
  if (b) {
    b.id = t.id;
    b.cat = t.category;
    b.lv = lv;
    b.cond = COND_NAMES[lv];
    b.plot = plot.id;
    b.front = plot.front;
  }
  return {n0, B: bB};
}
function checkPlacement(p, t, n0, B) {
  const E = [],
    tol = 0.06,
    v = new THREE.Vector3();
  for (const o of scene.children.slice(n0)) {
    if (o.isLight || (o.userData && (o.userData.kind === 'zombie' || o.userData.kind === 'fire')))
      continue; /* v076: a fire's glow pool may spill over the plot edge */
    o.updateWorldMatrix(true, false);
    o.traverse(m => {
      if (!m.isMesh || !m.geometry || !m.geometry.attributes || !m.geometry.attributes.position) return;
      m.updateWorldMatrix(true, false);
      /* v088: if the 8 corners of the mesh's bounding box are inside the plot, every vertex is (the plot is a rectangle): skip the
         per-vertex walk, which cost ~250 ms per mission load. Only meshes poking out get the exact check below. */
      const gb = m.geometry.boundingBox || (m.geometry.computeBoundingBox(), m.geometry.boundingBox);
      if (gb && isFinite(gb.min.x)) {
        let inside = true;
        for (let c = 0; c < 8 && inside; c++) {
          v.set(c & 1 ? gb.max.x : gb.min.x, c & 2 ? gb.max.y : gb.min.y, c & 4 ? gb.max.z : gb.min.z).applyMatrix4(
            m.matrixWorld
          );
          if (v.x < p.x0 - tol || v.x > p.x1 + tol || v.z < p.z0 - tol || v.z > p.z1 + tol) inside = false;
        }
        if (inside) return;
      }
      const a = m.geometry.attributes.position;
      for (let i = 0; i < a.count; i++) {
        v.fromBufferAttribute(a, i).applyMatrix4(m.matrixWorld);
        if (v.x < p.x0 - tol || v.x > p.x1 + tol || v.z < p.z0 - tol || v.z > p.z1 + tol) {
          E.push(
            'plot ' +
              p.id +
              ' ' +
              t.id +
              ': geometry (' +
              m.geometry.type +
              ' h=' +
              m.position.y.toFixed(1) +
              ') leaves its plot at (' +
              v.x.toFixed(1) +
              ',' +
              v.z.toFixed(1) +
              ')'
          );
          return;
        }
      }
    });
    if (E.length) break;
  }
  if (B && B.g) {
    const f = new THREE.Vector3(0, 0, 1);
    B.g.updateWorldMatrix(true, false);
    f.transformDirection(B.g.matrixWorld);
    const want = p.front === 'north' ? -1 : 1;
    if (Math.sign(Math.round(f.z)) !== want)
      E.push(
        'plot ' +
          p.id +
          ' ' +
          t.id +
          ': front faces ' +
          (f.z > 0 ? 'south' : 'north') +
          ' but plot frontage is ' +
          p.front
      );
  }
  return E;
}

// QUARANTINED (v036): the v032 town generator is kept for reference only and is never called.
function townLegacy() {
  try {
    treeList = [];
    nNpc = 0;
    buildings = [];
    streetLights = [];
    walkables = [];
  } catch (e) {
    console.error('town init', e);
    return;
  }
  const L = gridLayout(),
    le = validateLayout(L);
  window.__fortZombieTown = {
    layout: L,
    layoutErrors: le,
    catalogueErrors: window.__catalogueErrors,
    placementErrors: [],
    plan: []
  };
  if (le.length) {
    console.error('Map layout invalid', le);
    throw new Error('Map layout invalid: ' + le.join('; '));
  }
  const inGrid = (x, z, pad) =>
      x > L.bounds.x0 - pad && x < L.bounds.x1 + pad && z > L.bounds.z0 - pad && z < L.bounds.z1 + pad,
    PARK = [-50, L.bounds.z0 - 32],
    CEM = [55, L.bounds.z0 - 32];
  try {
    drawStreets(L);
  } catch (e) {
    console.error('streets', e);
  }
  try {
    TRUCK.set(rnd(-20, 20), 0, L.bounds.z1 + 8);
    makeArmyTruck(TRUCK.x, TRUCK.z);
  } catch (e) {
    console.error('truck', e);
    TRUCK.set(0, 0, L.bounds.z1 + 8);
  }
  try {
    let placed = 0,
      tries = 0;
    while (placed < 80 && tries < 900) {
      tries++;
      const x = rnd(BND[0] + 6, BND[1] - 6),
        z = rnd(BND[2] + 6, BND[3] - 7);
      if (
        inGrid(x, z, 3) ||
        Math.hypot(x - TRUCK.x, z - TRUCK.z) < 6 ||
        Math.hypot(x - PARK[0], z - PARK[1]) < 20 ||
        Math.hypot(x - CEM[0], z - CEM[1]) < 18
      )
        continue;
      tree(x, z);
      placed++;
    }
  } catch (e) {
    console.error('trees', e);
  }
  try {
    let placed = 0,
      tries = 0;
    while (placed < 50 && tries < 700) {
      tries++;
      const x = rnd(BND[0] + 6, BND[1] - 6),
        z = rnd(BND[2] + 6, BND[3] - 7);
      if (
        inGrid(x, z, 3) ||
        Math.hypot(x - TRUCK.x, z - TRUCK.z) < 4 ||
        Math.hypot(x - PARK[0], z - PARK[1]) < 18 ||
        Math.hypot(x - CEM[0], z - CEM[1]) < 16
      )
        continue;
      bush(x, z);
      placed++;
    }
  } catch (e) {
    console.error('bushes', e);
  }
  const vxs = [...new Set(L.roads.filter(r => r.x1 - r.x0 < r.z1 - r.z0).map(r => (r.x0 + r.x1) / 2))],
    hzs = [...new Set(L.roads.filter(r => r.x1 - r.x0 > r.z1 - r.z0).map(r => (r.z0 + r.z1) / 2))];
  try {
    for (let i = 0; i < 30; i++) {
      const onV = Math.random() < 0.5,
        x = onV ? PK(vxs) + rnd(-2, 2) : rnd(L.bounds.x0 + 10, L.bounds.x1 - 10),
        z = onV ? rnd(L.bounds.z0 + 10, L.bounds.z1 - 10) : PK(hzs) + rnd(-2, 2);
      makeCar(x, z, onV ? rnd(-0.3, 0.3) : PI / 2 + rnd(-0.3, 0.3));
    }
  } catch (e) {
    console.error('cars', e);
  }
  // BUILDINGS: one per plot, from the catalogue, with a condition and a deterministic frontage-driven orientation
  const plan = planTownLegacy(L),
    R = window.__fortZombieTown;
  for (const it of plan) {
    const p = it.plot,
      t = it.def;
    try {
      drawPlot(p, t.category);
      const r = bld(p.cx, p.cz, t, it.lv, p),
        e = checkPlacement(p, t, r.n0, r.B);
      R.placementErrors.push(...e);
      R.plan.push({plot: p.id, id: t.id, cond: COND_NAMES[it.lv], front: p.front});
      if (p.col % 4 !== 0 && Math.random() < 0.45) fence(p.x0 + 0.3, p.cz + (p.front === 'south' ? 3 : -3), 0, 6);
    } catch (err) {
      R.placementErrors.push('plot ' + p.id + ' ' + t.id + ' failed: ' + err.message);
      console.error('bld fail ' + t.id, err);
    }
  }
  if (R.plan.length !== 32) R.placementErrors.push('only ' + R.plan.length + ' of 32 plots were populated');
  if (R.placementErrors.length)
    console.error('TOWN VALIDATION: ' + R.placementErrors.length + ' problem(s)', R.placementErrors);
  else console.log('TOWN VALIDATION OK — 32 plots, all fronts correct, all geometry inside plots');
  try {
    placeNpcs(ri(3, 4));
  } catch (e) {
    console.error('npc', e);
  }
  try {
    treeList.forEach(t => {
      if (inBuilding(t.x, t.z, 3)) {
        scene.remove(t.g);
        if (t.tb) {
          const i = solids.indexOf(t.tb);
          if (i >= 0) solids.splice(i, 1);
        }
      }
    });
  } catch (e) {
    console.error('tree cull', e);
  }
  try {
    makePark(PARK[0], PARK[1]);
  } catch (e) {
    console.error('park', e);
  }
  try {
    makeCemetery(CEM[0], CEM[1]);
  } catch (e) {
    console.error('cemetery', e);
  }
  try {
    for (const v of vxs)
      for (const h of hzs) {
        if (Math.random() < 0.6) continue;
        streetLight(v + 3, h + 3);
        streetLight(v - 3, h - 3);
      }
  } catch (e) {
    console.error('lights', e);
  }
  try {
    for (let i = 0; i < 35; i++) zombie(PK(vxs) + rnd(-3, 3), rnd(L.bounds.z0 + 4, L.bounds.z1 - 4));
    for (let i = 0; i < 15; i++) zombie(rnd(L.bounds.x0 + 4, L.bounds.x1 - 4), rnd(L.bounds.z0 + 4, L.bounds.z1 - 4));
  } catch (e) {
    console.error('zombies', e);
  }
}

/* v075: the town in steps (streets, trees, cars, one step per plot, the population) so a loading screen can show progress; town() runs them all.
   WB.townPost: hooks run once the town is complete (rumour missions). */
function townSteps() {
  const C = {};
  return [
    [
      'Laying out the streets',
      () => {
        try {
          treeList = [];
          nNpc = 0;
          buildings = [];
          streetLights = [];
          walkables = [];
        } catch (e) {
          console.error('town init', e);
        }
        const L = (C.L = gridLayout()),
          le = validateLayout(L);
        C.R = window.__fortZombieTown = {
          layout: L,
          layoutErrors: le,
          catalogueErrors: window.__catalogueErrors,
          newCatalogueErrors: window.__newCatalogueErrors,
          placementErrors: [],
          plan: []
        };
        if (le.length) {
          console.error('Map layout invalid', le);
          throw new Error('Map layout invalid: ' + le.join('; '));
        }
        C.inGrid = (x, z, pad) =>
          x > L.bounds.x0 - pad && x < L.bounds.x1 + pad && z > L.bounds.z0 - pad && z < L.bounds.z1 + pad;
        C.PARK = [1e6, 1e6];
        C.CEM = [1e6, 1e6];
        try {
          drawStreets(L);
        } catch (e) {
          console.error('streets', e);
        }
        try {
          TRUCK.set(rnd(-20, 20), 0, L.bounds.z1 + 8);
          makeArmyTruck(TRUCK.x, TRUCK.z);
        } catch (e) {
          console.error('truck', e);
          TRUCK.set(0, 0, L.bounds.z1 + 8);
        }
      }
    ],
    [
      'Planting trees',
      () => {
        const L = C.L;
        try {
          let placed = 0,
            tries = 0;
          while (placed < 80 && tries < 900) {
            tries++;
            const x = rnd(BND[0] + 6, BND[1] - 6),
              z = rnd(BND[2] + 6, BND[3] - 7);
            if (
              C.inGrid(x, z, 3) ||
              Math.hypot(x - TRUCK.x, z - TRUCK.z) < 6 ||
              Math.hypot(x - C.PARK[0], z - C.PARK[1]) < 20 ||
              Math.hypot(x - C.CEM[0], z - C.CEM[1]) < 18
            )
              continue;
            tree(x, z);
            placed++;
          }
        } catch (e) {
          console.error('trees', e);
        }
        try {
          let placed = 0,
            tries = 0;
          while (placed < 50 && tries < 700) {
            tries++;
            const x = rnd(BND[0] + 6, BND[1] - 6),
              z = rnd(BND[2] + 6, BND[3] - 7);
            if (
              C.inGrid(x, z, 3) ||
              Math.hypot(x - TRUCK.x, z - TRUCK.z) < 4 ||
              Math.hypot(x - C.PARK[0], z - C.PARK[1]) < 18 ||
              Math.hypot(x - C.CEM[0], z - C.CEM[1]) < 16
            )
              continue;
            bush(x, z);
            placed++;
          }
        } catch (e) {
          console.error('bushes', e);
        }
      }
    ],
    [
      'Parking cars',
      () => {
        const L = C.L;
        C.vxs = [...new Set(L.roads.filter(r => r.x1 - r.x0 < r.z1 - r.z0).map(r => (r.x0 + r.x1) / 2))];
        C.hzs = [...new Set(L.roads.filter(r => r.x1 - r.x0 > r.z1 - r.z0).map(r => (r.z0 + r.z1) / 2))];
        try {
          for (let i = 0; i < 30; i++) {
            const onV = Math.random() < 0.5,
              x = onV ? PK(C.vxs) + rnd(-2, 2) : rnd(L.bounds.x0 + 10, L.bounds.x1 - 10),
              z = onV ? rnd(L.bounds.z0 + 10, L.bounds.z1 - 10) : PK(C.hzs) + rnd(-2, 2);
            makeCar(x, z, onV ? rnd(-0.3, 0.3) : PI / 2 + rnd(-0.3, 0.3));
          }
        } catch (e) {
          console.error('cars', e);
        }
      }
    ],
    ...buildTownV2Steps(C),
    [
      'Raising the dead',
      () => {
        const L = C.L;
        try {
          placeNpcs(ri(3, 4));
        } catch (e) {
          console.error('npc', e);
        }
        try {
          treeList = treeList.filter(t => {
            if (!t.keep && inBuilding(t.x, t.z, 3)) {
              scene.remove(t.g);
              if (t.tb) {
                const i = solids.indexOf(t.tb);
                if (i >= 0) solids.splice(i, 1);
              }
              return false;
            }
            return true;
          });
        } catch (e) {
          console.error('tree cull', e);
        } /* v074: lot trees (bldTree) stay */
        try {
          for (const v of C.vxs)
            for (const h of C.hzs) {
              if (Math.random() < 0.6) continue;
              streetLight(v + 3, h + 3);
              streetLight(v - 3, h - 3);
            }
        } catch (e) {
          console.error('lights', e);
        }
        try {
          for (let i = 0; i < 35; i++) zombie(PK(C.vxs) + rnd(-3, 3), rnd(L.bounds.z0 + 4, L.bounds.z1 - 4));
          for (let i = 0; i < 15; i++)
            zombie(rnd(L.bounds.x0 + 4, L.bounds.x1 - 4), rnd(L.bounds.z0 + 4, L.bounds.z1 - 4));
        } catch (e) {
          console.error('zombies', e);
        }
        for (const f of WB.townPost)
          try {
            f();
          } catch (e) {
            console.error('town hook', e);
          }
      },
      2
    ]
  ];
}
function town() {
  for (const s of townSteps()) s[1]();
}
