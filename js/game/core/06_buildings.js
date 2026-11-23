/* MINI FORT ZOMBIE - core 06/13: buildings
   Building shells v2, interiors, people/zombie block models (makeHuman, animZ), building conditions, trees, cars, park, cemetery.
   Part of the old js/game/core.js (split in v080). Classic script: shares globals with the other core parts; load in numeric order. */
// ============ BUILDINGS v2: data-driven shells, rooms, furniture, smashable windows ============
const FT = {
  // [w,d,[parts: w,h,d,x,y,z,col],flat,goods]
  bed: [
    2,
    2.2,
    [
      [2, 0.4, 2.2, 0, 0.2, 0, 0x5a3a2a],
      [1.8, 0.25, 2, 0, 0.5, 0, 0x8a9ab0],
      [0.9, 0.15, 0.4, 0, 0.68, -0.8, 0xeeeeee]
    ]
  ],
  cot: [
    1,
    2,
    [
      [0.9, 0.5, 1.9, 0, 0.3, 0, 0xdddddd],
      [0.8, 0.1, 1.8, 0, 0.6, 0, 0x88aacc]
    ]
  ],
  sofa: [
    2.2,
    1,
    [
      [2.2, 0.45, 1, 0, 0.22, 0, 0x6a3a3a],
      [2.2, 0.55, 0.25, 0, 0.65, -0.4, 0x5a2a2a],
      [0.25, 0.3, 0.9, -1, 0.5, 0, 0x5a2a2a],
      [0.25, 0.3, 0.9, 1, 0.5, 0, 0x5a2a2a]
    ]
  ],
  tv: [
    1.4,
    0.6,
    [
      [1.4, 0.5, 0.5, 0, 0.25, 0, 0x3a2a1a],
      [1.1, 0.7, 0.1, 0, 0.85, 0, 0x111111]
    ]
  ],
  table: [
    1.6,
    1.1,
    [
      [1.6, 0.08, 1.1, 0, 0.75, 0, 0x7a5a3a],
      [0.2, 0.7, 0.2, 0, 0.35, 0, 0x5a3a2a]
    ]
  ],
  ctable: [
    1.1,
    0.6,
    [
      [1.1, 0.06, 0.6, 0, 0.4, 0, 0x5a3a2a],
      [0.1, 0.4, 0.1, 0, 0.2, 0, 0x3a2a1a]
    ]
  ],
  chair: [
    0.5,
    0.5,
    [
      [0.45, 0.06, 0.45, 0, 0.45, 0, 0x6a4a2a],
      [0.45, 0.5, 0.06, 0, 0.72, -0.2, 0x6a4a2a],
      [0.08, 0.45, 0.08, 0, 0.22, 0, 0x4a3a2a]
    ]
  ],
  wardrobe: [1.2, 0.6, [[1.2, 2, 0.6, 0, 1, 0, 0x5a4030]]],
  shelf: [1.8, 0.45, [[1.8, 2, 0.4, 0, 1, 0, 0x6a5a4a]], 0, 1],
  aisle: [
    2.4,
    0.7,
    [
      [2.4, 0.25, 0.7, 0, 0.12, 0, 0x888888],
      [2.4, 1.8, 0.12, 0, 0.9, 0, 0x999999],
      [2.4, 0.05, 0.7, 0, 0.6, 0, 0xaaaaaa],
      [2.4, 0.05, 0.7, 0, 1.2, 0, 0xaaaaaa]
    ],
    0,
    1
  ],
  counter: [
    2.4,
    0.8,
    [
      [2.4, 0.95, 0.8, 0, 0.47, 0, 0x8a6a4a],
      [2.5, 0.08, 0.9, 0, 0.97, 0, 0x3a3a3a]
    ]
  ],
  stove: [
    0.8,
    0.7,
    [
      [0.8, 0.9, 0.7, 0, 0.45, 0, 0xbbbbbb],
      [0.7, 0.05, 0.6, 0, 0.92, 0, 0x222222]
    ]
  ],
  fridge: [
    0.9,
    0.8,
    [
      [0.9, 2, 0.8, 0, 1, 0, 0xe5e7eb],
      [0.05, 0.5, 0.05, 0.38, 1.4, 0.42, 0x777777]
    ]
  ],
  freezer: [
    2.2,
    0.9,
    [
      [2.2, 1.2, 0.9, 0, 0.6, 0, 0xdfe6ea],
      [2, 0.05, 0.7, 0, 1.22, 0, 0x88ccee]
    ]
  ],
  bath: [1.7, 0.8, [[1.7, 0.55, 0.8, 0, 0.28, 0, 0xe8eef0]]],
  toilet: [
    0.5,
    0.7,
    [
      [0.45, 0.4, 0.6, 0, 0.2, 0, 0xf0f0f0],
      [0.45, 0.5, 0.2, 0, 0.6, -0.25, 0xf0f0f0]
    ]
  ],
  sink: [0.7, 0.5, [[0.7, 0.9, 0.5, 0, 0.45, 0, 0xdddddd]]],
  booth: [
    2,
    1.8,
    [
      [0.5, 0.9, 1.8, -0.75, 0.45, 0, 0xa02020],
      [0.5, 0.9, 1.8, 0.75, 0.45, 0, 0xa02020],
      [0.9, 0.08, 1.2, 0, 0.75, 0, 0xcccccc]
    ]
  ],
  stool: [0.5, 0.5, [[0.4, 0.7, 0.4, 0, 0.35, 0, 0x882222]]],
  pew: [
    3,
    0.8,
    [
      [3, 0.5, 0.8, 0, 0.25, 0, 0x6a4a2a],
      [3, 0.6, 0.12, 0, 0.75, -0.34, 0x6a4a2a]
    ]
  ],
  altar: [
    2.4,
    1,
    [
      [2.4, 1, 0.8, 0, 0.5, 0, 0xc8c0b0],
      [0.12, 0.9, 0.12, 0, 1.45, 0, 0xdddddd],
      [0.6, 0.1, 0.1, 0, 1.7, 0, 0xdddddd]
    ]
  ],
  rack: [
    1.8,
    0.3,
    [
      [1.8, 1.6, 0.12, 0, 1.2, 0, 0x3a3028],
      [1.5, 0.08, 0.5, 0, 1.5, 0.2, 0x222222],
      [1.5, 0.08, 0.5, 0, 1.1, 0.2, 0x222222]
    ]
  ],
  register: [
    1,
    0.7,
    [
      [1, 0.9, 0.7, 0, 0.45, 0, 0x555555],
      [0.4, 0.3, 0.3, 0, 1.05, 0, 0x222222]
    ]
  ],
  bench: [
    2.4,
    0.9,
    [
      [2.4, 0.9, 0.9, 0, 0.45, 0, 0x7a5a3a],
      [2.4, 0.08, 1, 0, 0.92, 0, 0x5a4a3a]
    ]
  ],
  crate: [1, 1, [[1, 0.8, 1, 0, 0.4, 0, 0x8a6a3a]]],
  box: [0.6, 0.6, [[0.6, 0.5, 0.6, 0, 0.25, 0, 0xa08050]]],
  desk: [1.6, 0.8, [[1.6, 0.75, 0.8, 0, 0.38, 0, 0x6a5a4a]]],
  lamp: [
    0.4,
    0.4,
    [
      [0.1, 1.5, 0.1, 0, 0.75, 0, 0x333333],
      [0.3, 0.25, 0.3, 0, 1.5, 0, 0xffe8a0]
    ]
  ],
  plant: [0.5, 0.5, [[0.4, 0.8, 0.4, 0, 0.4, 0, 0x2a5a2a]]],
  lumber: [
    2.4,
    0.8,
    [
      [2.4, 0.2, 0.8, 0, 0.1, 0, 0xa16207],
      [2.4, 0.2, 0.7, 0, 0.3, 0, 0x8a5a05],
      [2.4, 0.2, 0.6, 0, 0.5, 0, 0xa16207]
    ]
  ],
  rug: [2.6, 1.8, [[2.6, 0.02, 1.8, 0, 0.06, 0, 0x7a2a2a]], 1],
  paper: [0.4, 0.3, [[0.4, 0.01, 0.3, 0, 0.085, 0, 0xe8e4d0]], 1],
  blood: [1.4, 1.1, [[1.4, 0.01, 1.1, 0, 0.1, 0, 0x4a0505]], 1]
};
const RM = {
  living: [
    ['sofa', 's', 0.5],
    ['tv', 'n', 0.5],
    ['rug', 'c', 0.5],
    ['ctable', 'c', 0.5],
    ['shelf', 'w', 0.2],
    ['lamp', 'e', 0.95],
    ['plant', 'e', 0.05],
    ['plant', 'w', 0.95]
  ],
  dining: [
    ['table', 'c', 0.5],
    ['chair', 'c', 0.5, -0.4, 0.85, PI],
    ['chair', 'c', 0.5, 0.4, 0.85, PI],
    ['chair', 'c', 0.5, -0.4, -0.85, 0],
    ['chair', 'c', 0.5, 0.4, -0.85, 0],
    ['shelf', 'n', 0.85],
    ['plant', 's', 0.1]
  ],
  kitchen: [
    ['counter', 'n', 0.2],
    ['stove', 'n', 0.6],
    ['fridge', 'n', 0.95],
    ['sink', 'w', 0.5],
    ['table', 'c', 0.5, 0, 0.2],
    ['chair', 'c', 0.5, -0.4, 1.05, PI],
    ['chair', 'c', 0.5, 0.4, 1.05, PI],
    ['chair', 'c', 0.5, -0.4, -0.65, 0]
  ],
  bedroom: [
    ['bed', 'n', 0.75],
    ['box', 'n', 0.35],
    ['wardrobe', 'w', 0.8],
    ['desk', 'e', 0.6],
    ['chair', 'e', 0.6, -0.7, 0, PI / 2],
    ['rug', 'c', 0.5]
  ],
  bath: [
    ['bath', 'n', 0.5],
    ['toilet', 'w', 0.9],
    ['sink', 'e', 0.9]
  ],
  exam: [
    ['cot', 'n', 0.5],
    ['desk', 'e', 0.7],
    ['sink', 'w', 0.85],
    ['chair', 'e', 0.3, -0.7, 0, PI / 2],
    ['box', 's', 0.1]
  ],
  pharm: [
    ['shelf', 'n', 0.2],
    ['shelf', 'n', 0.8],
    ['shelf', 'w', 0.5],
    ['shelf', 'e', 0.5],
    ['fridge', 's', 0.5]
  ],
  wait: [
    ...[0.04, 0.11, 0.18, 0.25, 0.32, 0.7, 0.78, 0.86, 0.94].map(u => ['chair', 's', u]),
    ['plant', 'n', 0.05],
    ['counter', 'c', 0.35, 0, -0.8],
    ['counter', 'c', 0.52, 0, -0.8],
    ['plant', 'n', 0.95],
    ['box', 'n', 0.5]
  ]
};
const fw = (len, dc = 99, st = 3) => {
  const a = [];
  for (let c = -len / 2 + 2; c <= len / 2 - 1.9; c += st) if (Math.abs(c - dc) > 1.9) a.push({k: 'w', c});
  return a;
};
function mk(x, z, w, d, h, c, fc, dc) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = CUR.cs < 0 ? PI : 0;
  scene.add(g);
  return (LASTB = {g, x, z, w, d, h, c, fc, dc, y: 0, occ: [], cs: CUR.cs, dx: 0});
}
/* v089: double doors. Two door ops side by side in one WL wall, both marked dbl ('swing' or 'slide'), become one double door: the two
   leaves are hinged on the OUTER edges (o.hinge 'L' / 'R') and linked (d.pair), so opening or closing either opens or closes both.
   Each leaf keeps its own hit points, so they are broken down (by zombies, shots or blows) like any other door, one leaf at a time.
   'slide' leaves are glass shop doors on a track just inside the wall: they slide apart along it (d.slide = -1 / +1, the leaf is d.lf)
   instead of swinging. o.inn: which local z side is indoors (WL works it out). */
let GLASS_DOOR = null;
function glassDoorMats() {
  return (
    GLASS_DOOR ||
    (GLASS_DOOR = {
      glass: new THREE.MeshStandardMaterial({
        color: 0xa9cad8,
        roughness: 0.06,
        metalness: 0.2,
        transparent: true,
        opacity: 0.34,
        depthWrite: false
      }),
      frame: new THREE.MeshStandardMaterial({color: 0x33363a, roughness: 0.35, metalness: 0.75}),
      bar: new THREE.MeshStandardMaterial({color: 0xc8ccd0, roughness: 0.25, metalness: 0.9}),
      sign: new THREE.MeshStandardMaterial({color: 0xd23a2a, roughness: 0.5})
    })
  );
}
const SLIDE_D = 1.27; // how far a glass leaf slides open (m)
function mkDoor(B, ax, fx, c, s = 1, o) {
  o = o || {};
  const R = o.hinge === 'R',
    hx = R ? c + 0.65 : c - 0.65,
    lx = R ? -0.65 : 0.65;
  const pv = new THREE.Group();
  pv.position.set(ax ? hx : fx, B.y, ax ? fx : hx);
  pv.rotation.y = ax ? 0 : -PI / 2;
  B.g.add(pv);
  let dr;
  if (o.slide) {
    const M = glassDoorMats();
    dr = new THREE.Mesh(BX(1.32, 2.36, 0.03), M.glass);
    dr.position.set(lx, 1.18, (o.inn || -1) * 0.22);
    pv.add(dr);
    const part = (w, h, d, m, x, y) => {
      const q = new THREE.Mesh(BX(w, h, d), m);
      q.position.set(x, y, 0);
      dr.add(q);
      return q;
    };
    part(1.32, 0.1, 0.05, M.frame, 0, 1.13);
    part(1.32, 0.18, 0.05, M.frame, 0, -1.09);
    part(0.07, 2.36, 0.05, M.frame, -0.625, 0);
    part(0.07, 2.36, 0.05, M.frame, 0.625, 0);
    part(0.86, 0.045, 0.08, M.bar, 0, -0.12); // push bar
    part(0.3, 0.06, 0.035, M.sign, R ? -0.3 : 0.3, 0.35); // safety strip
  } else {
    dr = mesh(BX(1.3, 2.4, 0.12), B.dc || 0x4a2c14, lx, 1.2, 0, pv);
    mesh(BX(0.08, 0.08, 0.2), 0xccaa44, R ? -0.45 : 0.45, -0.1, 0, dr);
  }
  dr.updateWorldMatrix(true, false);
  const dd = {
    p: pv,
    b: pv.rotation.y,
    a: 0,
    t: 0,
    open: 0,
    sg: s,
    locked: G.mode === 'EXPEDITION' && Math.random() < 0.06,
    sol: new THREE.Box3().setFromObject(dr).expandByScalar(0.08)
  };
  if (o.slide) {
    dd.slide = R ? 1 : -1;
    dd.lf = dr;
    dd.lx = lx;
  }
  dd.sol.door = dd;
  dd.hp = dd.hp0 = dd.locked ? 110 : 50;
  /* v075: locked doors take over twice the punishment */ solids.push(dd.sol);
  doors.push(dd);
  dr.userData = {kind: 'door', d: dd};
  if (o.slide) {
    dr.userData.dmerged = 1; // perf.js would merge the frame into the glass (one material); world.js would repaint it as wood
    dr.userData.rgdoor = 1;
  }
  B.occ.push(ax ? [c - 1, c + 1, fx - 1.4, fx + 1.4] : [fx - 1.4, fx + 1.4, c - 1, c + 1]);
  return dd;
}
/* v089: roller door (garage / storage unit). One leaf, w wide and h high, at c along a wall (ax / fx as WL). The caller leaves the opening in
   its walls and builds the header and drum box. Opening rolls the leaf up into the head: the main loop squashes it toward its top edge (d.roll,
   d.lf, d.rh) and the open box is the strip left at the head, above head height, so nothing walks into it. o.mat: leaf material (default
   orange steel), o.inn: which local z side is indoors (the leaf sits 0.1 m that way), o.locked (default true), o.hp. d.keep: ruin leaves it alone. */
const ROLL_MIN = 0.07; // what's left of the leaf when rolled up (fraction of its height)
let ROLL_MAT = null;
function mkRollDoor(B, ax, fx, c, w, h, o) {
  o = o || {};
  const pv = new THREE.Group();
  pv.position.set(ax ? c : fx, B.y, ax ? fx : c);
  pv.rotation.y = ax ? 0 : -PI / 2;
  B.g.add(pv);
  const mt =
    o.mat ||
    ROLL_MAT ||
    (ROLL_MAT = new THREE.MeshStandardMaterial({color: 0xe0782a, roughness: 0.5, metalness: 0.45}));
  const lf = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.05), mt),
    rz = (o.inn || -1) * 0.1;
  lf.position.set(0, h / 2, rz);
  pv.add(lf);
  lf.updateWorldMatrix(true, false);
  const locked = o.locked === undefined ? true : !!o.locked;
  const dd = {
    p: pv,
    b: pv.rotation.y,
    a: 0,
    t: 0,
    open: 0,
    sg: 1,
    locked,
    roll: 1,
    keep: 1,
    lf,
    rh: h,
    rz,
    sol: new THREE.Box3().setFromObject(lf).expandByScalar(0.06)
  };
  dd.sol.door = dd;
  dd.hp = dd.hp0 = o.hp || (locked ? 170 : 90); // steel: tougher than a timber door
  solids.push(dd.sol);
  doors.push(dd);
  lf.userData = {kind: 'door', d: dd, dmerged: 1, rgdoor: 1};
  B.occ.push(
    ax ? [c - w / 2 - 0.3, c + w / 2 + 0.3, fx - 1.4, fx + 1.4] : [fx - 1.4, fx + 1.4, c - w / 2 - 0.3, c + w / 2 + 0.3]
  );
  return dd;
}
function mkWin(B, ax, fx, c) {
  const y = B.y + 1.825,
    x = ax ? c : fx,
    z = ax ? fx : c,
    m = mesh(BX(ax ? 1.5 : 0.05, 1.85, ax ? 0.05 : 1.5), 0x9cc8e8, x, y, z, B.g),
    mt = m.material;
  mt.transparent = true;
  mt.opacity = 0.3;
  mt.depthWrite = false;
  mt.side = THREE.DoubleSide;
  for (const dy of [0.9, 2.78]) mesh(BX(ax ? 1.7 : 0.12, 0.08, ax ? 0.12 : 1.7), 0x4a4038, x, B.y + dy, z, B.g);
  for (const s of [-0.78, 0.78])
    mesh(BX(ax ? 0.08 : 0.12, 1.9, ax ? 0.12 : 0.08), 0x4a4038, x + (ax ? s : 0), y, z + (ax ? 0 : s), B.g);
  const bx = addSolid(m),
    w = {
      m,
      box: bx,
      g: B.g,
      ax,
      alive: true,
      l: {x, y: B.y + 0.9, z},
      p: new THREE.Vector3(B.x + B.cs * x, B.y + 1.8, B.z + B.cs * z)
    };
  bx.win = w;
  m.userData = {kind: 'glass', w};
  winList.push(w);
}
function WL(B, ax, fx, a0, a1, ops, h, o = {}) {
  const th = o.th || 0.3,
    col = o.c || B.c;
  ops.sort((p, q) => p.c - q.c);
  let a = a0;
  const sg = (u0, u1, ya, yb) => {
    if (u1 - u0 < 0.05 || yb - ya < 0.05) return;
    addSolid(
      mesh(
        BX(ax ? u1 - u0 : th, yb - ya, ax ? th : u1 - u0),
        col,
        ax ? (u0 + u1) / 2 : fx,
        B.y + (ya + yb) / 2,
        ax ? fx : (u0 + u1) / 2,
        B.g
      )
    );
  };
  // v089: double doors: two neighbouring door ops with the same dbl ('swing' / 'slide') and at most 1.75 m apart
  const dbl = new Map();
  for (let i = 0; i + 1 < ops.length; i++) {
    const p = ops[i],
      q = ops[i + 1];
    if (p.k === 'd' && q.k === 'd' && p.dbl && p.dbl === q.dbl && q.c - p.c < 1.75 && !dbl.has(p)) {
      const inn = p.inn || (ax ? (fx > 0 ? -1 : 1) : fx > 0 ? 1 : -1),
        sl = p.dbl === 'slide';
      dbl.set(p, {hinge: 'L', slide: sl, inn});
      dbl.set(q, {hinge: 'R', slide: sl, inn, mate: p});
    }
  }
  const made = new Map();
  for (const p of ops) {
    const hw = p.k === 'w' ? 0.75 : p.k === 'd' ? 0.65 : 0.8;
    sg(a, p.c - hw, 0, h);
    if (p.k === 'w') {
      sg(p.c - hw, p.c + hw, 0, 0.9);
      sg(p.c - hw, p.c + hw, 2.75, h);
      mkWin(B, ax, fx, p.c);
    } else if (p.k === 'd') {
      sg(p.c - hw, p.c + hw, 2.4, h);
      const dd = mkDoor(B, ax, fx, p.c, p.s, dbl.get(p));
      made.set(p, dd);
      const m = dbl.get(p);
      if (m && m.mate && made.get(m.mate)) {
        const a0 = made.get(m.mate);
        a0.pair = dd;
        dd.pair = a0;
        dd.locked = a0.locked; // one lock for the pair
        dd.hp = dd.hp0 = a0.hp0;
      }
    } else sg(p.c - hw, p.c + hw, 2.5, h);
    a = p.c + hw;
  }
  sg(a, a1, 0, h);
}
function shell(B, o) {
  const {g, w, d, h, fc} = B;
  WL(B, 1, d / 2, -w / 2, w / 2, o.f || [], h);
  WL(B, 1, -d / 2, -w / 2, w / 2, o.b || [], h);
  WL(B, 0, -w / 2, -d / 2, d / 2, o.l || [], h);
  WL(B, 0, w / 2, -d / 2, d / 2, o.r || [], h);
  const f = mesh(new THREE.PlaneGeometry(w - 0.3, d - 0.3), fc, 0, 0.03, 0, g);
  f.rotation.x = -PI / 2;
}
const NOCOL = new Set(['chair', 'stool', 'box', 'plant', 'lamp', 'ctable']); // tiny clutter: no collision (keeps rooms walkable & pathing clean)
function put(B, t, x, z, ry = 0) {
  const f = FT[t],
    sw = Math.abs(Math.sin(ry)) > 0.5,
    hw = (sw ? f[1] : f[0]) / 2,
    hd = (sw ? f[0] : f[1]) / 2;
  if (x - hw < -B.w / 2 + 0.2 || x + hw > B.w / 2 - 0.2 || z - hd < -B.d / 2 + 0.2 || z + hd > B.d / 2 - 0.2) return 0;
  /* v089: nothing that stands up goes in front of a door or gate (1.2 m each side, the opening's width): such a piece is left out */
  if (!f[3] && window.MFZCOND && B.__wl) {
    if (!B.__zn || B.__znN !== B.__wl.length) {
      B.__zn = MFZCOND.zones(B);
      B.__znN = B.__wl.length;
    }
    for (const r of B.__zn) {
      if (Math.abs((r[5].y || 0) - (B.y || 0)) > 0.5) continue; // another storey
      const w = r[5],
        hx = w.ax ? (r[1] - r[0]) / 2 - 0.05 : 1.2,
        hz = w.ax ? 1.2 : (r[3] - r[2]) / 2 - 0.05,
        cx = (r[0] + r[1]) / 2,
        cz = (r[2] + r[3]) / 2;
      if (x - hw < cx + hx && x + hw > cx - hx && z - hd < cz + hz && z + hd > cz - hz) return 0;
    }
  }
  if (!f[3]) {
    for (const o of B.occ)
      if (x - hw < o[1] - 0.003 && x + hw > o[0] + 0.003 && z - hd < o[3] - 0.003 && z + hd > o[2] + 0.003) return 0;
    B.occ.push([x - hw, x + hw, z - hd, z + hd]);
  }
  const fg = new THREE.Group();
  fg.position.set(x, B.y, z);
  fg.rotation.y = ry;
  B.g.add(fg);
  for (const p of f[2]) mesh(BX(p[0], p[1], p[2]), p[6], p[3], p[4], p[5], fg);
  if (f[4])
    for (let i = 0; i < 7; i++)
      mesh(
        BX(0.3, 0.3, 0.25),
        PK([0xdc2626, 0x2563eb, 0x16a34a, 0xeab308, 0xf97316, 0xe5e7eb]),
        rnd(-f[0] / 2 + 0.2, f[0] / 2 - 0.2),
        rnd(0.3, 1.6),
        0.2,
        fg
      );
  if (!f[3] && !NOCOL.has(t)) addSolid(fg);
  return 1;
}
function furn(B, L, r) {
  const [x0, x1, z0, z1] = r;
  for (const [t, sd, u, ox = 0, oz = 0, ry] of L) {
    const f = FT[t],
      hw = f[0] / 2,
      hd = f[1] / 2;
    let x,
      z,
      a = 0;
    if (sd === 'n') {
      z = z0 + hd + 0.02;
      x = x0 + hw + u * (x1 - x0 - 2 * hw);
    } else if (sd === 's') {
      z = z1 - hd - 0.02;
      x = x0 + hw + u * (x1 - x0 - 2 * hw);
      a = PI;
    } else if (sd === 'w') {
      x = x0 + hd + 0.02;
      z = z0 + hw + u * (z1 - z0 - 2 * hw);
      a = PI / 2;
    } else if (sd === 'e') {
      x = x1 - hd - 0.02;
      z = z0 + hw + u * (z1 - z0 - 2 * hw);
      a = -PI / 2;
    } else {
      x = (x0 + x1) / 2 + (u - 0.5) * (x1 - x0 - 2 * hw);
      z = (z0 + z1) / 2;
    }
    put(B, t, x + ox, z + oz, ry === undefined ? a : ry);
  }
}
function cont(B, t, x, z) {
  for (const o of B.occ) if (x - 0.75 < o[1] && x + 0.75 > o[0] && z - 0.6 < o[3] && z + 0.6 > o[2]) return 0;
  // v089: random loot crates keep out of door and gate clear zones too (same storey)
  if (window.MFZCOND && B.__wl)
    for (const r of MFZCOND.zones(B))
      if (
        Math.abs((r[5].y || 0) - (B.y || 0)) < 0.5 &&
        x - 0.75 < r[1] &&
        x + 0.75 > r[0] &&
        z - 0.6 < r[3] &&
        z + 0.6 > r[2]
      )
        return 0;
  B.occ.push([x - 0.75, x + 0.75, z - 0.6, z + 0.6]);
  spawnContainer(B.x + B.cs * x, B.z + B.cs * z, t, B.y);
  return 1;
}
function rc(B, t, r, n) {
  for (let i = 0; i < n; i++)
    for (let k = 0; k < 25; k++) if (cont(B, t, rnd(r[0] + 0.8, r[1] - 0.8), rnd(r[2] + 0.7, r[3] - 0.7))) break;
}
function junk(B, n, r) {
  for (let i = 0; i < n; i++)
    put(
      B,
      PK(['crate', 'box', 'box', 'chair', 'paper', 'paper', 'blood']),
      rnd(r[0] + 0.6, r[1] - 0.6),
      rnd(r[2] + 0.6, r[3] - 0.6),
      rnd(0, 6)
    );
}
function Zs(B, n) {
  for (let i = 0; i < n; i++)
    zombie(B.x + rnd(-B.w / 2 + 1.5, B.w / 2 - 1.5), B.z + rnd(-B.d / 2 + 1.5, B.d / 2 - 1.5));
}
function roof(B, H, ty, col) {
  const {g, w, d} = B;
  addSolid(mesh(BX(w + 0.4, 0.25, d + 0.4), 0x4a4a48, 0, H + 0.12, 0, g));
  if (ty === 'flat') {
    for (const [x, z, sw, sd] of [
      [0, d / 2 + 0.1, w + 0.4, 0.2],
      [0, -d / 2 - 0.1, w + 0.4, 0.2],
      [w / 2 + 0.1, 0, 0.2, d + 0.4],
      [-w / 2 - 0.1, 0, 0.2, d + 0.4]
    ])
      mesh(BX(sw, 0.5, sd), 0x6a6a68, x, H + 0.5, z, g);
    mesh(BX(1.5, 0.9, 1.5), 0x8a8f94, rnd(-w / 4, w / 4), H + 0.7, rnd(-d / 4, d / 4), g);
    for (let i = -1; i <= 1; i++) {
      const l = mesh(BX(1.2, 0.08, 0.25), 0xfffbe0, (i * w) / 4, H - 0.2, 0, g);
      l.material.emissive.setHex(0x555544);
    }
  } else if (ty === 'pyr') {
    const r = mesh(new THREE.ConeGeometry(Math.max(w, d) * 0.75, 2.4, 4), col, 0, H + 1.4, 0, g);
    r.rotation.y = PI / 4;
  } else {
    const rise = Math.min(d * 0.3, 3),
      a = Math.atan(rise / (d / 2)),
      L = Math.hypot(d / 2, rise) + 0.5;
    mesh(BX(w + 0.8, 0.15, L), col, 0, H + rise / 2 + 0.2, d / 4, g).rotation.x = a;
    mesh(BX(w + 0.8, 0.15, L), col, 0, H + rise / 2 + 0.2, -d / 4, g).rotation.x = -a;
    const gg = new THREE.CylinderGeometry(0.577 * d, 0.577 * d, 0.3, 3);
    gg.rotateX(-PI / 2);
    gg.scale(1, rise / (0.866 * d), 1);
    for (const s of [-1, 1]) {
      const e = mesh(gg, 0x8a7f73, (s * w) / 2, H + rise / 3 + 0.1, 0, g);
      e.rotation.y = PI / 2;
    }
  }
  if (ty !== 'flat') mesh(BX(0.8, 2, 0.8), 0x5a3a2a, w / 3 - 0.5, H + 1.6, -d / 4, g);
}
function sign(B, txt, wd = 5) {
  const key = 'S|' + txt;
  let mt = TSC.get(key);
  if (!mt) {
    const cv = document.createElement('canvas');
    cv.width = 256;
    cv.height = 64;
    const x = cv.getContext('2d');
    x.fillStyle = '#111';
    x.fillRect(0, 0, 256, 64);
    x.fillStyle = '#facc15';
    x.font = 'bold 30px Impact,sans-serif';
    x.textAlign = 'center';
    x.fillText(txt, 128, 44);
    mt = new THREE.MeshBasicMaterial({map: new THREE.CanvasTexture(cv)});
    TSC.set(key, mt);
  }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(wd, wd / 4), mt);
  m.position.set(0, B.h + 1.1, B.d / 2 + 0.12);
  B.g.add(m);
}
function done(B, t, n) {
  buildings.push({x: B.x, z: B.z, w: B.w, d: B.d, t});
  Zs(B, n);
}
const IN = B => [-B.w / 2 + 0.15, B.w / 2 - 0.15, -B.d / 2 + 0.15, B.d / 2 - 0.15];

function bHouse(x, z, t) {
  const hv = (t && t.hv) || {},
    w = 16,
    d = 14,
    two = hv.two !== undefined ? hv.two : Math.random() < 0.65,
    H1 = 3,
    B = mk(
      x,
      z,
      w,
      d,
      H1,
      PK(hv.walls || [0x8a7f73, 0x7c8a73, 0x73808a, 0x8a7373, 0xa09070, 0x6f7f8f]),
      PK(hv.floor || [0x8a6a4a, 0x6a6a6a, 0x9a8a6a]),
      PK(hv.door || [0x4a2c14, 0x2c4a5a, 0x5a2c2c])
    ),
    g = B.g;
  const dx = rnd(-w / 2 + 3.5, hv.garage ? -0.5 : w / 2 - 2.2),
    bx = rnd(-w / 2 + 3.5, w / 2 - 2.5),
    rf = hv.roof || PK(['pyr', 'gable', 'flat']),
    rcol = PK(hv.rcol || [0x5b2a1f, 0x3a3a42, 0x4a3a2a, 0x2a4a3a]);
  B.dx = dx;
  B.occ.push([-w / 2, -w / 2 + 2, -d / 2, -d / 2 + 6.6]);
  shell(B, {
    f: [...fw(w, dx, 3.2), {k: 'd', c: dx}],
    b: [...fw(w, bx, 3.2), {k: 'd', c: bx, s: -1}],
    l: fw(d, 99, 3.2),
    r: fw(d, 99, 3.2)
  });
  const zp = -d / 2 + ri(4, 5),
    P = {th: 0.2, c: 0xcbbfae};
  WL(B, 1, zp, -w / 2 + 2, w / 2 - 0.15, [{k: 'd', c: rnd(-w / 2 + 3.2, w / 2 - 1.4), s: PK([1, -1])}], H1, P);
  let fr = [-w / 2 + 2.1, w / 2 - 0.15, zp + 0.15, d / 2 - 0.15];
  const br = [-w / 2 + 2.1, w / 2 - 0.15, -d / 2 + 0.15, zp - 0.15];
  if (w >= 10 && Math.random() < 0.6) {
    const xp = w / 6;
    WL(B, 0, xp, zp + 0.1, d / 2 - 0.15, [{k: 'g', c: (zp + d / 2) / 2}], H1, P);
    furn(B, RM.dining, [xp + 0.1, w / 2 - 0.15, zp + 0.15, d / 2 - 0.15]);
    fr = [-w / 2 + 2.1, xp - 0.1, zp + 0.15, d / 2 - 0.15];
  }
  furn(B, RM.living, fr);
  furn(B, Math.random() < 0.6 ? RM.kitchen : RM.bedroom, br);
  put(B, 'plant', -w / 2 + 1.2, d / 2 - 0.6);
  rc(B, 'house', br, 1);
  rc(B, 'house', fr, 1);
  junk(B, 5, IN(B));
  mesh(BX(2.4, 0.25, 1.2), 0x777770, dx, 0.12, d / 2 + 0.7, g);
  if (two) {
    const rs = H1 / 10;
    for (let i = 0; i < 10; i++) {
      const sy = (i + 1) * rs,
        sz = -d / 2 + 1 + i * 0.55,
        sx = -w / 2 + 1.2;
      mesh(BX(1.4, rs, 0.55), 0x8a6a4a, sx, sy - rs / 2, sz, g);
      const sb = new THREE.Box3(
        new THREE.Vector3(x + B.cs * sx - 0.7, sy - rs, z + B.cs * sz - 0.275),
        new THREE.Vector3(x + B.cs * sx + 0.7, sy, z + B.cs * sz + 0.275)
      );
      solids.push(sb);
      walkables.push(sb);
    }
    addSolid(mesh(BX(w - 1.9, 0.2, d), 0x6a5a4a, 0.95, H1, 0, g));
    addSolid(mesh(BX(1.9, 0.2, d - 6.225), 0x6a5a4a, -w / 2 + 0.95, H1, (d / 2 + (-d / 2 + 6.225)) / 2, g));
    B.y = 3.1;
    B.occ = [[-w / 2, -w / 2 + 2, -d / 2, -d / 2 + 7.2]];
    const h2 = 2.9;
    WL(B, 1, d / 2, -w / 2, w / 2, fw(w, 99, 3.2), h2);
    WL(B, 1, -d / 2, -w / 2, w / 2, fw(w, 99, 3.2), h2);
    WL(B, 0, -w / 2, -d / 2, d / 2, fw(d, 99, 3.2), h2);
    WL(B, 0, w / 2, -d / 2, d / 2, fw(d, 99, 3.2), h2);
    const zq = -d / 2 + ri(4, 5);
    WL(B, 1, zq, -w / 2 + 2, w / 2 - 0.15, [{k: 'd', c: rnd(-w / 2 + 3.2, w / 2 - 1.4)}], h2, P);
    furn(B, RM.bedroom, [-w / 2 + 2.1, w / 2 - 0.15, -d / 2 + 0.15, zq - 0.15]);
    furn(B, Math.random() < 0.5 ? RM.bedroom : RM.bath, [-w / 2 + 2.1, w / 2 - 0.15, zq + 0.15, d / 2 - 0.15]);
    rc(B, 'house', [-w / 2 + 2.1, w / 2 - 0.15, -d / 2 + 0.15, zq - 0.15], 1);
    junk(B, 4, IN(B));
    roof(B, 6, rf, rcol);
  } else roof(B, H1, rf, rcol);
  if (hv.feats) hv.feats.forEach(f => FEAT[f](B, hv));
  done(B, (t && t.id) || 'house', Math.random() < 0.5 ? 1 : 0);
}

function bClinic(x, z, t) {
  const B = mk(x, z, 16, 14, 4.2, 0x9db4c8, 0xcfd8dc, 0x6a7a8a),
    {w, d, h, g} = B,
    zh = -1,
    P = {th: 0.2, c: 0xe8eef0};
  shell(B, {f: [...fw(w, 0), {k: 'd', c: 0}], b: fw(w), l: fw(d), r: fw(d)});
  WL(
    B,
    1,
    zh,
    -w / 2 + 0.15,
    w / 2 - 0.15,
    [
      {k: 'd', c: -4.8},
      {k: 'g', c: 0},
      {k: 'd', c: 4.8, s: -1}
    ],
    h,
    P
  );
  for (const sx of [-2.6, 2.6]) WL(B, 0, sx, -d / 2 + 0.15, zh, [], h, P);
  const E = [-w / 2 + 0.15, -2.7, -d / 2 + 0.15, zh - 0.1],
    E2 = [2.7, w / 2 - 0.15, E[2], E[3]],
    Ph = [-2.5, 2.5, E[2], E[3]],
    Wr = [-w / 2 + 0.15, w / 2 - 0.15, zh + 0.1, d / 2 - 0.15];
  furn(B, RM.exam, E);
  furn(B, RM.exam, E2);
  furn(B, RM.pharm, Ph);
  furn(B, RM.wait, Wr);
  rc(B, 'clinic', E, 1);
  rc(B, 'clinic', E2, 1);
  rc(B, 'clinic', Ph, 2);
  rc(B, 'clinic', Wr, 1);
  roof(B, h, 'flat');
  mesh(BX(2.4, 0.3, 0.8), 0xcc2222, 0, h + 1, 0, g);
  mesh(BX(0.8, 0.3, 2.4), 0xcc2222, 0, h + 1, 0, g);
  sign(B, 'CLINIC');
  junk(B, 6, Wr);
  junk(B, 3, E);
  done(B, 'clinic', ri(1, 2));
}

function bGun(x, z, t) {
  const B = mk(x, z, 16, 14, 4.5, 0x4b4540, 0x5a5650, 0x2a2a2a),
    {w, d, h} = B;
  shell(B, {f: [...fw(w, 0), {k: 'd', c: 0}], b: fw(w), l: fw(d), r: fw(d)});
  WL(B, 1, -2.2, -w / 2 + 0.15, w / 2 - 0.15, [{k: 'd', c: 3}], h, {th: 0.2, c: 0x6a6560});
  const Fr = [-w / 2 + 0.15, w / 2 - 0.15, -2.1, d / 2 - 0.15],
    Bk = [-w / 2 + 0.15, w / 2 - 0.15, -d / 2 + 0.15, -2.3];
  put(B, 'counter', -3, -0.5);
  put(B, 'counter', -0.6, -0.5);
  put(B, 'register', -1.6, -1.3);
  furn(
    B,
    [
      ['rack', 'w', 0.25],
      ['rack', 'w', 0.75],
      ['rack', 'e', 0.25],
      ['rack', 'e', 0.75],
      ['plant', 'e', 0.5],
      ['box', 's', 0.9]
    ],
    Fr
  );
  furn(
    B,
    [
      ['crate', 'n', 0.1],
      ['crate', 'n', 0.35],
      ['shelf', 'w', 0.5],
      ['shelf', 'e', 0.3],
      ['box', 'n', 0.9]
    ],
    Bk
  );
  rc(B, 'gunshop', Bk, 2);
  rc(B, 'gunshop', Fr, 1);
  roof(B, h, 'flat');
  sign(B, 'GUN SHOP');
  junk(B, 7, Fr);
  done(B, t.id || 'gunshop', ri(0, 1));
}

function bGas(x, z, t) {
  const cs = CUR.cs,
    B = mk(x, z - 4 * cs, 16, 6, 3.6, 0xdddddd, 0x8a8a8a, 0x333333),
    {w, d, h} = B;
  B.dx = -3;
  shell(B, {f: [...fw(w, -3), {k: 'd', c: -3}], b: fw(w), l: fw(d, 99, 3.5), r: fw(d, 99, 3.5)});
  put(B, 'aisle', -2, -0.3);
  put(B, 'aisle', 2.2, -0.3);
  furn(
    B,
    [
      ['freezer', 'n', 0.1],
      ['freezer', 'n', 0.5],
      ['freezer', 'n', 0.9],
      ['counter', 's', 0.9],
      ['box', 's', 0.5]
    ],
    IN(B)
  );
  rc(B, 'gas', IN(B), 2);
  roof(B, h, 'flat');
  sign(B, 'GAS', 3);
  junk(B, 4, IN(B));
  const G0 = new THREE.Group();
  G0.position.set(x, 0, z);
  G0.rotation.y = cs < 0 ? PI : 0;
  scene.add(G0);
  const pad = mesh(new THREE.PlaneGeometry(16, 14), 0x777777, 0, 0.015, 0, G0);
  pad.rotation.x = -PI / 2;
  addSolid(mesh(BX(12, 0.4, 5.4), 0xcc2222, 0, 4.6, 4.2, G0));
  for (const px of [-5.5, 5.5])
    for (const pz of [2, 6.4])
      addSolid(mesh(new THREE.CylinderGeometry(0.15, 0.15, 4.5, 8), 0xdddddd, px, 2.25, pz, G0));
  for (const px of [-2.2, 2.2]) {
    addSolid(mesh(BX(0.9, 1.6, 0.6), 0x666666, px, 0.8, 4.2, G0));
    mesh(BX(0.6, 0.6, 0.2), 0x222222, px, 1.3, 4.55, G0);
  }
  spawnContainer(x + cs * rnd(-5, -3.5), z + cs * 6, 'gas');
  buildings.push({x, z, w: 16, d: 14, t: t.id || 'gas'});
  Zs(B, ri(0, 1));
  zombie(x + rnd(-5, 5), z + cs * rnd(2, 6));
  LASTB = {g: G0, x, z, w: 16, d: 14, h: 3.6, cs, fz: -1, dx: -3, y: 0, occ: []};
}

function bDiner(x, z, t) {
  const B = mk(x, z, 16, 14, 4.2, 0xc8d0d4, 0xb8b090, 0x883322),
    {w, d, h} = B;
  B.dx = 6;
  shell(B, {f: [...fw(w, 6, 2.6), {k: 'd', c: 6}], b: fw(w, 99, 3.2), l: fw(d), r: fw(d)});
  WL(B, 1, -1.3, -w / 2 + 0.15, -1.5, [{k: 'd', c: -5.2}], h, {th: 0.2, c: 0xdddddd});
  const K = [-w / 2 + 0.15, -1.7, -d / 2 + 0.15, -1.4],
    Fr = [-w / 2 + 0.15, w / 2 - 0.15, -1.2, d / 2 - 0.15];
  furn(
    B,
    [
      ['stove', 'n', 0.2],
      ['stove', 'n', 0.5],
      ['counter', 's', 0.2],
      ['fridge', 'n', 0.95],
      ['box', 'e', 0.5]
    ],
    K
  );
  for (const bx of [-6.8, -4.6, -2.4]) put(B, 'booth', bx, d / 2 - 1.1, PI);
  for (const bx of [1.2, 3.6]) {
    put(B, 'counter', bx, -0.6);
    put(B, 'stool', bx - 0.5, 0.5);
    put(B, 'stool', bx + 0.5, 0.5);
  }
  for (const tx of [-5, -2.2]) {
    put(B, 'table', tx, 0.2);
    put(B, 'chair', tx - 0.4, 1.05, PI);
    put(B, 'chair', tx + 0.4, 1.05, PI);
    put(B, 'chair', tx - 0.4, -0.65);
    put(B, 'chair', tx + 0.4, -0.65);
  }
  for (const tx of [-5, -2.2, 1.8, 4.6]) {
    put(B, 'table', tx, 3.1);
    put(B, 'chair', tx - 0.4, 3.95, PI);
    put(B, 'chair', tx + 0.4, 3.95, PI);
    put(B, 'chair', tx - 0.4, 2.25);
    put(B, 'chair', tx + 0.4, 2.25);
  }
  rc(B, 'diner', K, 1);
  rc(B, 'diner', Fr, 1);
  roof(B, h, 'flat');
  sign(B, 'DINER', 4);
  junk(B, 5, Fr);
  done(B, 'diner', ri(1, 2));
}

function bHard(x, z, t) {
  const B = mk(x, z, 16, 14, 5, 0x4d6b2a, 0x7a7a72, 0x3a3a3a),
    {w, d, h} = B;
  shell(B, {f: [...fw(w, 0), {k: 'd', c: 0}], b: fw(w, 99, 3.5), l: fw(d, 99, 3.5), r: fw(d, 99, 3.5)});
  WL(
    B,
    1,
    -2.5,
    -w / 2 + 0.15,
    w / 2 - 0.15,
    [
      {k: 'd', c: -4},
      {k: 'g', c: 4.5}
    ],
    h,
    {th: 0.2, c: 0x6a7a5a}
  );
  const Bk = [-w / 2 + 0.15, w / 2 - 0.15, -d / 2 + 0.15, -2.7],
    Fr = [-w / 2 + 0.15, w / 2 - 0.15, -2.3, d / 2 - 0.15];
  for (const rz of [2, -0.4]) for (const ax of [-5.5, -3.1, 3.1, 5.5]) put(B, 'aisle', ax, rz);
  put(B, 'counter', 5.5, 5.3, PI);
  put(B, 'register', 3.6, 5.2);
  furn(
    B,
    [
      ['bench', 'e', 0.5],
      ['bench', 'w', 0.7],
      ['plant', 'w', 0.1]
    ],
    Fr
  );
  furn(
    B,
    [
      ['lumber', 'n', 0.2],
      ['lumber', 'n', 0.55],
      ['crate', 'n', 0.9],
      ['shelf', 'w', 0.5],
      ['shelf', 'e', 0.5]
    ],
    Bk
  );
  rc(B, 'hardware', Bk, 2);
  rc(B, 'hardware', Fr, 1);
  roof(B, h, 'flat');
  sign(B, 'HARDWARE', 6);
  junk(B, 6, Fr);
  done(B, 'hardware', ri(1, 2));
}

function bMart(x, z, t) {
  const B = mk(x, z, 16, 14, 6, 0x6a7a8a, 0xc8c8c0, 0x3a3a3a),
    {w, d, h} = B;
  B.dx = -4;
  shell(B, {f: [...fw(w, -4, 2.6), {k: 'd', c: -4}], b: fw(w, 99, 3.4), l: fw(d, 99, 3.4), r: fw(d, 99, 3.4)});
  WL(
    B,
    1,
    -4.4,
    -w / 2 + 0.15,
    w / 2 - 0.15,
    [
      {k: 'd', c: 6.5},
      {k: 'g', c: -3}
    ],
    h,
    {th: 0.2, c: 0x8a9aaa}
  );
  const Bk = [-w / 2 + 0.15, w / 2 - 0.15, -d / 2 + 0.15, -4.6],
    Fr = [-w / 2 + 0.15, w / 2 - 0.15, -4.2, d / 2 - 0.15];
  for (const rz of [2.4, -0.1, -2.6]) for (const ax of [-5.4, -3, -0.6, 1.8, 4.2]) put(B, 'aisle', ax, rz);
  for (const rx of [4.2, 5.4, 6.6]) put(B, 'register', rx, 5.3);
  furn(
    B,
    [
      ['freezer', 'e', 0.15],
      ['freezer', 'e', 0.4],
      ['freezer', 'e', 0.65]
    ],
    Fr
  );
  furn(
    B,
    [
      ['shelf', 'n', 0.1],
      ['shelf', 'n', 0.35],
      ['crate', 'n', 0.7],
      ['crate', 'n', 0.9],
      ['shelf', 'w', 0.5],
      ['crate', 'e', 0.5]
    ],
    Bk
  );
  rc(B, 'supermarket', Fr, 3);
  rc(B, 'supermarket', Bk, 1);
  roof(B, h, 'flat');
  sign(B, 'MEGA MART', 8);
  junk(B, 8, Fr);
  done(B, 'supermarket', 2);
}

function bChurch(x, z, t) {
  const B = mk(x, z, 16, 14, 7, 0xb0a890, 0x6a5a4a, 0x3a2a1a),
    {w, d, h, g} = B;
  shell(B, {f: [...fw(w, 0, 3), {k: 'd', c: 0}], b: [{k: 'w', c: 0}], l: fw(d, 99, 3.4), r: fw(d, 99, 3.4)});
  const P = {th: 0.2, c: 0x8a7a6a};
  WL(B, 1, -3.7, -w / 2 + 0.15, -2.2, [{k: 'd', c: -3.6}], h, P);
  WL(B, 0, -2.2, -d / 2 + 0.15, -3.7, [], h, P);
  const V = [-w / 2 + 0.15, -2.3, -d / 2 + 0.15, -3.8];
  for (let r = 0; r < 6; r++) for (const px of [-5.6, -2.4, 2.4, 5.6]) put(B, 'pew', px, 5.2 - r * 1.6);
  put(B, 'altar', 0, -6.1);
  put(B, 'desk', 5.2, -4.6, -PI / 2);
  put(B, 'plant', -1.6, -6.2);
  put(B, 'plant', 1.6, -6.2);
  furn(
    B,
    [
      ['wardrobe', 'w', 0.5],
      ['desk', 'e', 0.5],
      ['shelf', 'n', 0.5],
      ['box', 's', 0.3]
    ],
    V
  );
  rc(B, 'church', V, 1);
  rc(B, 'church', [-w / 2 + 0.15, w / 2 - 0.15, -6.6, -3.8], 1);
  roof(B, h, 'gable', 0x5a4a3a);
  mesh(BX(2.4, 5, 2.4), 0x8a7a6a, 0, h + 2.8, d / 2 - 1.4, g);
  mesh(new THREE.ConeGeometry(1.8, 3.5, 4), 0x5a4a3a, 0, h + 7, d / 2 - 1.4, g).rotation.y = PI / 4;
  mesh(BX(0.15, 1.8, 0.15), 0xcccccc, 0, h + 9.6, d / 2 - 1.4, g);
  mesh(BX(1, 0.15, 0.15), 0xcccccc, 0, h + 9.9, d / 2 - 1.4, g);
  junk(B, 5, [-w / 2 + 0.15, w / 2 - 0.15, -3.5, d / 2 - 0.15]);
  done(B, 'church', ri(1, 2));
}
function placeNpcs(n) {
  const cand = buildings.filter(b => b.t !== 'park' && b.t !== 'cemetery');
  let k = 0,
    tr = 0;
  const add = (px, pz) => {
    const m = makePerson(0x0284c7, px, pz);
    m.rotation.y = rnd(0, TAU);
    m.userData = {kind: 'npc'};
    scene.add(m);
    npcList.push(m);
    k++;
  };
  while (k < n && tr < 500 && cand.length) {
    tr++;
    const b = PK(cand),
      px = b.x + rnd(-b.w / 2 + 1.5, b.w / 2 - 1.5),
      pz = b.z + rnd(-b.d / 2 + 1.5, b.d / 2 - 1.5);
    if (!blocked(px, pz, 0.6)) add(px, pz);
  }
  while (k < n) {
    const px = TRUCK.x + rnd(-14, 14),
      pz = TRUCK.z - rnd(8, 25);
    if (!blocked(px, pz, 0.6)) add(px, pz);
  }
}

const BX = (w, h, d) => new THREE.BoxGeometry(w, h, d),
  PK = a => a[ri(0, a.length - 1)];
// Detailed articulated humanoid (zombies + survivors). Returns pivots for animation.
function makeHuman(o, g) {
  const Z = !!o.zombie,
    brute = o.kind === 'brute',
    P = {},
    sk = Z ? PK([0x6b7d58, 0x7a8567, 0x8a8f72, 0x5e6b55]) : PK([0xe0b090, 0xc68642, 0x8d5524, 0xf1c27d]),
    shirt =
      o.shirt != null
        ? o.shirt
        : Z && FZS && FZS.shirt != null
          ? FZS.shirt
          : PK(
              Z
                ? [0x5a4a3a, 0x3a4a5a, 0x6a3a3a, 0x4a5a3a, 0x7a7a6a, 0x2a2a35]
                : [0x3a5a8a, 0x7a3a3a, 0x4a6a4a, 0x6a6a6a]
            ),
    pants = Z && FZS && FZS.pants != null ? FZS.pants : PK([0x2a3040, 0x3a3a2a, 0x4a3a2a, 0x202020, 0x39455a]),
    hair = PK([0x1a1410, 0x3a2a1a, 0x6a5030, 0x8a8a8a, 0xb08a50]);
  const m = (geo, c, x, y, z, p) => mesh(geo, c, x, y, z, p || g);
  const body = new THREE.Group();
  body.position.y = 0.9;
  g.add(body);
  P.body = body;
  m(BX(brute ? 0.62 : 0.5, 0.6, 0.28), brute ? sk : shirt, 0, 0.3, 0, body);
  m(BX(0.52, 0.07, 0.3), 0x1a1a1a, 0, 0.02, 0, body);
  m(BX(0.12, 0.1, 0.12), sk, 0, 0.64, 0, body);
  if (Z) {
    for (let i = 0, n = ri(1, 3); i < n; i++)
      m(BX(rnd(0.08, 0.18), rnd(0.1, 0.2), 0.02), 0x5a0a0a, rnd(-0.18, 0.18), rnd(0.1, 0.5), 0.15, body);
    if (Math.random() < 0.4) m(BX(0.14, 0.12, 0.02), 0xd8d0c0, rnd(-0.1, 0.1), rnd(0.25, 0.4), 0.145, body);
    m(BX(0.5, 0.14, 0.28), shirt, rnd(-0.03, 0.03), -0.08, 0.01, body).rotation.z = rnd(-0.1, 0.1);
    body.rotation.x = 0.3;
  } else {
    if (o.role === 'Medic') {
      m(BX(0.12, 0.12, 0.02), 0xffffff, 0.1, 0.38, 0.145, body);
      m(BX(0.08, 0.02, 0.025), 0xcc1111, 0.1, 0.38, 0.15, body);
      m(BX(0.02, 0.08, 0.025), 0xcc1111, 0.1, 0.38, 0.15, body);
    }
    if (o.role === 'Builder') m(BX(0.55, 0.08, 0.3), 0x8a5a2a, 0, -0.02, 0, body);
    m(
      ...(o.role === 'Scavenger'
        ? [BX(0.42, 0.55, 0.22), 0x4a5a3a, 0, 0.3, -0.22]
        : [BX(0.34, 0.42, 0.18), 0x4a5a3a, 0, 0.3, -0.2]),
      body
    );
  }
  const head = new THREE.Group();
  head.position.set(0, 0.7, Z ? 0.04 : 0);
  body.add(head);
  P.head = head;
  const hm = (geo, c, x, y, z) => {
    const q = m(geo, c, x, y, z, head);
    q.userData.head = 1;
    q.userData.part = 'head';
    return q;
  };
  hm(BX(0.24, 0.26, 0.24), sk, 0, 0.13, 0);
  hm(BX(0.2, 0.07, 0.2), Z ? 0x7a3030 : sk, 0, -0.03, 0.015).rotation.x = Z ? 0.35 : 0;
  if (Math.random() < (Z ? 0.55 : 0.9)) hm(BX(0.26, 0.09, 0.26), hair, 0, 0.27, -0.01);
  for (const sx of [-0.06, 0.06]) {
    const e = hm(BX(0.045, 0.035, 0.02), Z ? 0xe8e8c8 : 0x222222, sx, 0.15, 0.125);
    if (Z) e.material.emissive.setHex(0x888866);
  }
  if (Z && Math.random() < 0.6) hm(BX(0.07, 0.09, 0.02), 0x6a0a0a, rnd(-0.08, 0.08), rnd(0.08, 0.2), 0.125);
  if (o.helmet) hm(BX(0.28, 0.13, 0.28), 0x3a4a2a, 0, 0.29, 0);
  if (o.hat) hm(BX(0.28, 0.1, 0.28), 0xf2c200, 0, 0.3, 0);
  if (o.cap) hm(BX(0.27, 0.07, 0.3), 0x2a3a5a, 0, 0.29, 0.02);
  const arm = s => {
    const sh = new THREE.Group();
    sh.position.set(s * (brute ? 0.4 : 0.33), 0.52, 0);
    body.add(sh);
    m(BX(0.17, 0.5, 0.17), Z && brute ? sk : shirt, 0, -0.25, 0, sh).userData.part = s < 0 ? 'armL' : 'armR';
    const el = new THREE.Group();
    el.position.y = -0.5;
    sh.add(el);
    m(BX(0.14, 0.42, 0.14), sk, 0, -0.21, 0, el).userData.part = s < 0 ? 'armL' : 'armR';
    m(BX(0.15, 0.13, 0.1), sk, 0, -0.47, 0, el).userData.part = s < 0 ? 'armL' : 'armR';
    return [sh, el];
  };
  [P.armL, P.elL] = arm(-1);
  [P.armR, P.elR] = arm(1);
  const leg = s => {
    const h = new THREE.Group();
    h.position.set(s * 0.13, 0.9, 0);
    g.add(h);
    m(BX(0.2, 0.85, 0.22), pants, 0, -0.45, 0, h).userData.part = s < 0 ? 'legL' : 'legR';
    m(BX(0.22, 0.1, 0.32), 0x1a1a1a, 0, -0.88, 0.04, h).userData.part = s < 0 ? 'legL' : 'legR';
    return h;
  };
  P.legL = leg(-1);
  P.legR = leg(1);
  if (window.mergeHuman) mergeHuman(g, P);
  return P;
}
function animZ(z, dt, horde) {
  const u = z.userData,
    P = u.parts;
  if (!P) return;
  const dx = z.position.x - pl.position.x,
    dz = z.position.z - pl.position.z;
  z.visible = dx * dx + dz * dz < 6400;
  if (!z.visible || u.flop > 0 || u.sleep || u.rise > 0 || u.ragT > 0) return;
  if (u.crawl) {
    const m0 = Math.hypot(
      z.position.x - (u.px === undefined ? z.position.x : u.px),
      z.position.z - (u.pz === undefined ? z.position.z : u.pz)
    );
    u.px = z.position.x;
    u.pz = z.position.z;
    u.ph = (u.ph || 0) + m0 * 6;
    crawlPose(z, dt);
    return;
  }
  const mv = Math.hypot(
    z.position.x - (u.px === undefined ? z.position.x : u.px),
    z.position.z - (u.pz === undefined ? z.position.z : u.pz)
  );
  u.px = z.position.x;
  u.pz = z.position.z;
  u.ph = (u.ph || 0) + mv * (u.run ? 5 : 3.2);
  const ch = u.see || u.hunt > 0 || horde,
    sw = Math.min(1, mv / dt / 2.5),
    s = Math.sin(u.ph),
    r = ch ? -1.35 : -0.25,
    sy = Math.sin(u.ph * 0.5 + 1) * 0.12;
  P.legL.rotation.x = s * 0.7 * sw;
  P.legR.rotation.x = -s * 0.7 * sw;
  P.armL.rotation.x = r + (ch ? sy : -s * 0.3 * sw);
  P.armR.rotation.x = r + (ch ? -sy : s * 0.3 * sw);
  P.elL.rotation.x = P.elR.rotation.x = ch ? -0.3 : -0.15;
  P.body.rotation.x = 0.3 + (ch ? 0.12 : 0) + s * 0.04 * sw;
  P.body.position.y = 0.9 + Math.abs(s) * 0.03 * sw;
  P.head.rotation.z = Math.sin(u.ph * 0.5) * 0.12 * sw + (u.tilt || 0);
  P.head.rotation.x = ch ? -0.15 : 0.1;
  if (ch && !u.atk) {
    u.wpT = (u.wpT || 0) - dt;
    if (u.wpT <= 0) {
      u.wpT = 0.25 + Math.random() * 0.1;
      const fx = Math.sin(z.rotation.y),
        fz = Math.cos(z.rotation.y),
        px = z.position.x,
        pz = z.position.z;
      u.wallN = !!(
        blocked(px + fx * 0.95, pz + fz * 0.95, 0.2, 0, 1.8) || blocked(px + fx * 0.55, pz + fz * 0.55, 0.2, 0, 1.8)
      );
    }
    if (u.wallN) {
      P.armL.rotation.x = P.armR.rotation.x = -0.25;
      P.elL.rotation.x = P.elR.rotation.x = -0.1;
    }
  }
}
function makePerson(color, x, z, role) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  const P = makeHuman(
    {shirt: color, role, helmet: role === 'Guard', hat: role === 'Builder', cap: role === 'Generalist'},
    g
  );
  g.userData.P = P;
  g.userData.role = role;
  return g;
}

const FLOOR = {
  clinic: 0xcfd8dc,
  gunshop: 0x5a5650,
  gas: 0x8a8a8a,
  diner: 0xb8b090,
  hardware: 0x7a7a72,
  supermarket: 0xc8c8c0,
  church: 0x6a5a4a
};
function frameWin(g, cx, cz, ax, o) {
  const x = cx + (ax ? o : 0),
    z = cz + (ax ? 0 : o);
  for (const y of [1.28, 2.94]) {
    const m = mesh(BX(ax ? 1.9 : 0.34, 0.1, ax ? 0.34 : 1.9), 0xd8d4c8, x, y, z, g);
  }
}
function detail(g, w, d, h, t) {
  const m = (geo, c, x, y, z) => mesh(geo, c, x, y, z, g);
  const fl = m(new THREE.PlaneGeometry(w - 0.6, d - 0.6), FLOOR[t] || 0x8a8478, 0, 0.03, 0);
  fl.rotation.x = -Math.PI / 2;
  m(BX(w + 0.2, 0.35, d + 0.2), 0x6a6a68, 0, 0.17, 0);
  for (const [sx, sz, lx, lz] of [
    [0, d / 2, w + 0.4, 0.3],
    [0, -d / 2, w + 0.4, 0.3],
    [-w / 2, 0, 0.3, d + 0.4],
    [w / 2, 0, 0.3, d + 0.4]
  ])
    m(BX(lx, 0.5, lz), 0x77736a, sx, h + 0.45, sz);
  m(BX(1.5, 0.9, 1.5), 0x8a8f94, rnd(-w / 3, w / 3), h + 0.7, rnd(-d / 3, d / 3));
  m(new THREE.CylinderGeometry(0.12, 0.12, 0.8, 6), 0x555555, rnd(-w / 3, w / 3), h + 0.8, rnd(-d / 3, d / 3));
  m(BX(4, 0.1, 1.5), PK([0xb91c1c, 0x1d4ed8, 0x15803d, 0x7c2d12]), 0, 3.3, d / 2 + 0.75).rotation.x = 0.18;
  for (const sx of [-1.65, 1.65]) m(BX(0.2, 3, 0.35), 0x3a2a1a, sx, 1.5, d / 2 + 0.02);
  m(BX(3.5, 0.2, 0.35), 0x3a2a1a, 0, 3, d / 2 + 0.02);
  for (let i = 0; i < 3; i++) {
    const q = m(
      new THREE.PlaneGeometry(rnd(1, 2.5), rnd(1.5, 3)),
      0x000000,
      rnd(-w / 2 + 1, w / 2 - 1),
      rnd(1.5, 3),
      d / 2 + 0.22
    );
    q.material.transparent = true;
    q.material.opacity = 0.15;
  }
  for (let i = -1; i <= 1; i++) {
    const l = m(BX(1.2, 0.08, 0.25), 0xfffbe0, (i * w) / 4, h - 0.25, 0);
    l.material.emissive.setHex(0x555544);
  }
}
function detailHouse(g, w, d) {
  const m = (geo, c, x, y, z) => mesh(geo, c, x, y, z, g);
  m(BX(3.4, 0.3, 1.6), 0x6a4a2a, 0, 0.15, d / 2 + 0.9);
  for (const sx of [-1.5, 1.5]) m(BX(0.15, 2.4, 0.15), 0xe8e4d8, sx, 1.25, d / 2 + 1.6);
  m(BX(3.8, 0.12, 1.9), 0x4a2a1a, 0, 2.5, d / 2 + 0.95);
  m(BX(2, 0.2, 0.4), 0x7a7a74, 0, 0.1, d / 2 + 1.9);
  m(BX(w + 0.2, 0.4, d + 0.2), 0x6a6a68, 0, 0.2, 0);
  m(BX(0.12, 1, 0.12), 0x5a3a1a, w / 2 - 0.5, 0.5, d / 2 + 5.5);
  m(BX(0.35, 0.25, 0.5), 0x2a4a8a, w / 2 - 0.5, 1.1, d / 2 + 5.5);
  for (let i = -1; i <= 1; i++) m(BX(1.6, 0.1, 0.3), 0xd8d4c8, i * 3, 4.05, d / 2 + 0.15);
}
function litter(x, z, t) {
  const d = t.d || 10,
    w = t.w || 10,
    fz = z + (CUR.cs * d) / 2;
  if (Math.random() < 0.6) {
    const b = mesh(new THREE.PlaneGeometry(2, 1.5), 0x3a0505, x + rnd(-2, 2), 0.03, fz + CUR.cs * 1.2);
    b.rotation.x = -Math.PI / 2;
  }
  for (let i = 0, n = ri(2, 5); i < n; i++) {
    const px = x + rnd(-w / 2, w / 2),
      pz = fz + CUR.cs * rnd(0.5, 1.3),
      k = Math.random();
    if (k < 0.4) mesh(new THREE.IcosahedronGeometry(0.3, 0), 0x151515, px, 0.22, pz).scale.set(1, 0.8, 1);
    else if (k < 0.7) mesh(BX(0.5, 0.4, 0.4), 0x8a6a3a, px, 0.2, pz).rotation.y = rnd(0, 3);
    else {
      const c = mesh(new THREE.CylinderGeometry(0.3, 0.28, 0.9, 8), 0x2a4a2a, px, 0.45, pz);
      if (Math.random() < 0.5) {
        c.rotation.z = 1.4;
        c.position.y = 0.28;
      }
    }
  }
}

/* ===== building condition variants: intact / damaged / ruined / collapsed ===== */
function quietBreak(w) {
  if (!w.alive) return;
  w.alive = false;
  w.g.remove(w.m);
  const i = solids.indexOf(w.box);
  if (i >= 0) solids.splice(i, 1);
}
function ruin(x, z, t, lv, n0, s0, w0, d0) {
  const kids = scene.children.slice(n0),
    conts = kids.filter(k => k.userData && k.userData.kind === 'loot'),
    grp = kids.filter(k => k.isGroup && !(k.userData && k.userData.kind)),
    mine = solids.slice(s0),
    meshes = [],
    W = t.w || 10,
    D = t.d || 10;
  grp.forEach(g =>
    g.traverse(m => {
      if (m.isMesh && m.geometry && (m.geometry.type === 'BoxGeometry' || m.geometry.type === 'ConeGeometry'))
        meshes.push(m);
    })
  );
  const boxOf = m => {
    const b = new THREE.Box3().setFromObject(m),
      e = 0.07;
    return mine.find(
      q =>
        Math.abs(q.min.x - b.min.x) < e &&
        Math.abs(q.max.x - b.max.x) < e &&
        Math.abs(q.min.y - b.min.y) < e &&
        Math.abs(q.max.y - b.max.y) < e &&
        Math.abs(q.min.z - b.min.z) < e &&
        Math.abs(q.max.z - b.max.z) < e
    );
  };
  const dropBox = b => {
      if (!b) return;
      const i = solids.indexOf(b);
      if (i >= 0) solids.splice(i, 1);
    },
    walls = [],
    roofs = [];
  meshes.forEach(m => {
    const p = m.geometry.parameters;
    if (m.geometry.type === 'ConeGeometry') {
      roofs.push(m);
      return;
    }
    const th = Math.min(p.width, p.depth),
      lg = Math.max(p.width, p.depth);
    if (p.height >= 2.2 && th <= 0.5 && lg >= 1.2) walls.push(m);
    else if (m.position.y >= 2.8 && p.height <= 0.5 && lg >= 3) roofs.push(m);
    else if (m.rotation.x && p.height <= 0.2 && lg >= 3) roofs.push(m);
  });
  // windows smashed, doors hanging or ripped off
  winList.slice(w0).forEach(w => {
    if (lv > 1 || Math.random() < 0.82) quietBreak(w);
  });
  doors.slice(d0).forEach(d => {
    if (d.keep) return; // v089: roller doors keep their lock and state
    if (lv === 1 && Math.random() < 0.5)
      return; /* v076: no half-open (crooked) doors: closed, fully open or ripped off */
    if (lv >= 2 && Math.random() < 0.8) {
      const k = solids.indexOf(d.sol);
      if (k >= 0) solids.splice(k, 1);
      if (d.solO && solids.indexOf(d.solO) >= 0) solids.splice(solids.indexOf(d.solO), 1); // v089: a double door's other leaf may have opened it
      if (d.p.parent) d.p.parent.remove(d.p);
      doors.splice(doors.indexOf(d), 1);
    } else {
      if (d.locked) d.locked = false;
      doorOpen(d, undefined, undefined, true);
    }
  });
  // loot: the more damaged, the more is gone (and some containers are spoiled outright)
  conts.forEach(c => {
    const ct = c.userData.cont;
    if (!ct || !ct.inv) return;
    lootRuin(ct, [0, 0.6, 0.8, 0.9][lv]);
    if (lv >= 2 && Math.random() < (lv === 2 ? 0.35 : 0.7)) lootRuin(ct, 1);
    refreshContainerVisual(ct);
  });
  // structural damage
  if (lv >= 2) {
    const nb = ri(2, 4);
    for (let i = 0; i < nb && walls.length; i++) {
      const m = walls.splice(ri(0, walls.length - 1), 1)[0];
      dropBox(boxOf(m));
      m.parent.remove(m);
    }
  }
  /* v076: only the top of the building goes. Upper floors of two-storey houses (a flat slab at 3 m) were classed as roof too, so the
    upstairs furniture and loot were left floating; a roof piece is now only one at the building's highest level. */
  {
    const wy = m => {
      m.updateWorldMatrix(true, false);
      return new THREE.Vector3().setFromMatrixPosition(m.matrixWorld).y;
    };
    let top = -1e9;
    for (const m of roofs) if (m.geometry.type !== 'ConeGeometry') top = Math.max(top, wy(m));
    for (let i = roofs.length - 1; i >= 0; i--) {
      const m = roofs[i];
      if (m.geometry.type !== 'ConeGeometry' && wy(m) < top - 1.2) roofs.splice(i, 1);
    }
  }
  roofs.forEach(m => {
    if (lv === 1) return;
    dropBox(boxOf(m));
    m.parent.remove(m);
  }); /* v076: a ruined roof is gone; tilted roof pieces could be walked through */
  if (lv === 3)
    walls.forEach(m => {
      const b = boxOf(m),
        p = m.geometry.parameters,
        k = rnd(0.3, 0.55),
        base = m.position.y - p.height / 2;
      m.scale.y = k;
      m.position.y = base + (p.height * k) / 2;
      if (b) b.max.y = b.min.y + (b.max.y - b.min.y) * k;
    });
  // soot / burn tint, overturned furniture, hanging signs
  const burnt = lv >= 2 && Math.random() < 0.4,
    f = [1, 0.95, 0.6, 0.4][lv] * (burnt ? 0.55 : 1);
  meshes.forEach(m => {
    if (m.material && m.material.color && !m.material.transparent)
      m.material.color.multiplyScalar(f * (0.9 + Math.random() * 0.2));
  });
  // v089: door pivots and window groups are never twisted (the leaf turned but its collision did not, so it blocked the doorway)
  const pivots = new Set(doors.map(d => d.p));
  if (lv >= 1)
    grp.forEach(g => {
      g.children.forEach(k => {
        if (pivots.has(k) || k.userData.cond) return;
        if (k.isGroup && !(k.userData && k.userData.kind) && Math.random() < (lv >= 2 ? 0.4 : 0.18)) {
          k.rotation.y += rnd(-0.7, 0.7);
        }
      });
      /* v076: shoved askew on the floor, not tipped over and lifted (they hung in the air) */ g.traverse(m => {
        if (m.geometry && m.geometry.type === 'PlaneGeometry' && m.material && m.material.map && Math.random() < 0.7)
          m.rotation.z = rnd(-0.5, 0.5) * (lv >= 2 ? 1 : 0.35);
      });
    });
  // rubble inside and around, extra zombies in the worst ones
  /* v089: a piece of rubble never lands within 1.8 m of a door of this building or inside another solid (it used to block doorways
     and sink into counters and walls); if no clear spot turns up in 10 tries, that piece is left out */
  const dps = doors.slice(d0).map(d => {
    const v = new THREE.Vector3();
    d.p.getWorldPosition(v);
    return v;
  });
  // ...and out of every door and gate clear zone (world rects from the building's walls, js/props/condkit.js)
  const LB =
    typeof LASTB !== 'undefined' && LASTB && LASTB.__wl && Math.abs(LASTB.x - x) < 0.01 && Math.abs(LASTB.z - z) < 0.01
      ? LASTB
      : null;
  const wz =
    LB && window.MFZCOND
      ? MFZCOND.zones(LB).map(r => {
          const a = [LB.x + LB.cs * r[0], LB.x + LB.cs * r[1]],
            c = [LB.z + LB.cs * r[2], LB.z + LB.cs * r[3]];
          return [Math.min(...a) - 0.3, Math.max(...a) + 0.3, Math.min(...c) - 0.3, Math.max(...c) + 0.3];
        })
      : [];
  for (let i = 0, n = 2 + lv * 3; i < n; i++) {
    const w = rnd(0.3, 1.1),
      h = rnd(0.2, 0.8),
      d = rnd(0.3, 1.1);
    let px = 0,
      pz = 0,
      ok = false;
    for (let k = 0; k < 10 && !ok; k++) {
      px = x + rnd(-W / 2 - (i % 2 ? 0.9 : 0), W / 2 + (i % 2 ? 0.9 : 0));
      pz = z + rnd(-D / 2 - (i % 2 ? 0.9 : 0), D / 2 + (i % 2 ? 0.9 : 0));
      const r = Math.max(w, d) * 0.75,
        bb = new THREE.Box3(new THREE.Vector3(px - r, 0.05, pz - r), new THREE.Vector3(px + r, h, pz + r));
      ok =
        !dps.some(p => Math.hypot(p.x - px, p.z - pz) < 1.8 + r) &&
        !wz.some(q => px + r > q[0] && px - r < q[1] && pz + r > q[2] && pz - r < q[3]) &&
        !solids.some(s => s.intersectsBox(bb));
    }
    if (!ok) continue;
    const m = mesh(BX(w, h, d), PK([0x6a6a68, 0x5a4a3a, 0x8a8a86, 0x3a2a1a]), px, 0, pz);
    m.position.y = h / 2;
    m.rotation.y = rnd(0, 3);
    if (h > 0.4) addSolid(m);
  }
  for (let i = 0; i < (lv >= 2 ? lv : 0); i++) zombie(x + rnd(-W / 3, W / 3), z + rnd(-D / 3, D / 3));
  const b = buildings[buildings.length - 1];
  if (b) b.lv = lv;
}
function inBuilding(x, z, pad = 2) {
  for (const b of buildings) {
    if (x > b.x - b.w / 2 - pad && x < b.x + b.w / 2 + pad && z > b.z - b.d / 2 - pad && z < b.z + b.d / 2 + pad)
      return true;
  }
  return false;
}
function inRoad(x, z, vx, hz) {
  for (const v of vx) if (Math.abs(x - v) < 5) return true;
  for (const h of hz) if (Math.abs(z - h) < 5) return true;
  return false;
}

let wireT = null;
function border(x0, x1, z0, z1) {
  if (!wireT) {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const q = c.getContext('2d');
    q.strokeStyle = '#c4c8cc';
    q.lineWidth = 2;
    for (let i = -64; i < 128; i += 16) {
      q.beginPath();
      q.moveTo(i, 0);
      q.lineTo(i + 64, 64);
      q.stroke();
      q.beginPath();
      q.moveTo(i + 64, 0);
      q.lineTo(i, 64);
      q.stroke();
    }
    wireT = new THREE.CanvasTexture(c);
    wireT.wrapS = wireT.wrapT = THREE.RepeatWrapping;
  }
  const mx = (x0 + x1) / 2,
    mz = (z0 + z1) / 2;
  [
    [x0, z0, x1, z0],
    [x1, z0, x1, z1],
    [x1, z1, x0, z1],
    [x0, z1, x0, z0]
  ].forEach(([ax, az, bx, bz]) => {
    const hz = Math.abs(bz - az) < 1,
      L = Math.hypot(bx - ax, bz - az),
      cx = (ax + bx) / 2,
      cz = (az + bz) / 2;
    const t = wireT.clone();
    t.needsUpdate = true;
    t.repeat.set(L / 1.2, 3);
    const w = new THREE.Mesh(
      new THREE.PlaneGeometry(L, 3.6),
      new THREE.MeshBasicMaterial({map: t, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide})
    );
    w.position.set(cx, 1.8, cz);
    if (!hz) w.rotation.y = Math.PI / 2;
    w.raycast = () => {};
    scene.add(w);
    const r = mesh(new THREE.CylinderGeometry(0.06, 0.06, L, 6), 0x7a7f84, cx, 3.65, cz);
    if (hz) r.rotation.z = Math.PI / 2;
    else r.rotation.x = Math.PI / 2;
    for (let i = 0; i <= L; i += 4) {
      const px = hz ? ax + (bx > ax ? i : -i) : ax,
        pz = hz ? az : az + (bz > az ? i : -i);
      mesh(new THREE.CylinderGeometry(0.09, 0.09, 3.8, 6), 0x6a6f74, px, 1.9, pz);
    }
    solids.push(
      hz
        ? new THREE.Box3(
            new THREE.Vector3(Math.min(ax, bx), 0, az - 0.3),
            new THREE.Vector3(Math.max(ax, bx), 4, az + 0.3)
          )
        : new THREE.Box3(
            new THREE.Vector3(ax - 0.3, 0, Math.min(az, bz)),
            new THREE.Vector3(ax + 0.3, 4, Math.max(az, bz))
          )
    );
    const nx = hz ? 0 : Math.sign(cx - mx),
      nz = hz ? Math.sign(cz - mz) : 0;
    for (let s = 0; s < L; s += rnd(4, 7)) {
      const off = rnd(5, 20),
        px = hz ? Math.min(ax, bx) + s : cx + nx * off,
        pz = hz ? cz + nz * off : Math.min(az, bz) + s,
        k = rnd(0.8, 1.5),
        tg = new THREE.Group();
      tg.position.set(px, 0, pz);
      tg.scale.setScalar(k);
      tg.userData.inst = 1;
      scene.add(tg);
      mesh(new THREE.CylinderGeometry(0.3, 0.4, 3, 6), 0x3a2a1a, 0, 1.5, 0, tg);
      mesh(new THREE.ConeGeometry(2.2, 4.5, 7), 0x15361a, 0, 4.5, 0, tg).material.flatShading = true;
      mesh(new THREE.ConeGeometry(1.5, 3.5, 7), 0x1d4a22, 0, 6.8, 0, tg).material.flatShading = true;
    }
  });
}
function tree(x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  scene.add(g);
  mesh(new THREE.CylinderGeometry(0.35, 0.5, 3, 6), 0x4a3020, 0, 1.5, 0, g);
  for (let i = 0; i < 3; i++) {
    const cy = 2.6 + i * 0.7,
      cr = 1.6 - i * 0.35,
      cm = mesh(
        new THREE.IcosahedronGeometry(cr, 0),
        [0x1a3d1a, 0x234d23, 0x2d5d2d][i],
        rnd(-0.3, 0.3),
        cy,
        rnd(-0.3, 0.3),
        g
      );
    cm.material.flatShading = true;
  }
  const tb = new THREE.Box3(new THREE.Vector3(x - 0.5, 0, z - 0.5), new THREE.Vector3(x + 0.5, 3, z + 0.5));
  solids.push(tb);
  treeList.push({g, x, z, tb});
  g.userData = {kind: 'tree'};
}
/* v074: a real (flora) tree inside a building lot, local coords. Kept by the town's tree cull. o.kind forces the species (oak, linden, maple, ginkgo,
   cherry, cedar), o.dead leaves only trunk + branches. */
function bldTree(B, lx, lz, s = 1, o = {}) {
  tree(WX(B, lx), WZ(B, lz));
  const t = treeList[treeList.length - 1];
  if (!t) return null;
  t.keep = 1;
  t.g.scale.setScalar(s);
  const sp = t.g.userData && t.g.userData.spec;
  if (sp) {
    if (o.kind) sp.kind = o.kind;
    if (o.dead) sp.dead = 1;
  } else if (o.dead)
    t.g.children.filter(c => c.geometry && c.geometry.type === 'IcosahedronGeometry').forEach(c => t.g.remove(c));
  if (B.occ) B.occ.push([lx - 0.8, lx + 0.8, lz - 0.8, lz + 0.8]);
  return t;
}
function bush(x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  scene.add(g);
  g.userData.inst = 1;
  treeList.push({g, x, z});
  const bb = new THREE.Box3(new THREE.Vector3(x - 0.55, 0, z - 0.55), new THREE.Vector3(x + 0.55, 0.8, z + 0.55));
  bb.bush = true;
  solids.push(bb);
  const m = mesh(new THREE.IcosahedronGeometry(0.7, 0), 0x2d4d1a, 0, 0.55, 0, g);
  m.material.flatShading = true;
  m.scale.set(1.3, 0.9, 1.3);
  const m2 = mesh(new THREE.IcosahedronGeometry(0.5, 0), 0x3a5d22, 0.5, 0.45, 0.2, g);
  m2.material.flatShading = true;
}
function streetLight(x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  scene.add(g);
  mesh(new THREE.CylinderGeometry(0.1, 0.15, 6, 6), 0x2a2a2a, 0, 3, 0, g);
  const head = mesh(new THREE.BoxGeometry(0.8, 0.3, 0.8), 0x1a1a1a, 0, 6.15, 0, g);
  solids.push(new THREE.Box3(new THREE.Vector3(x - 0.15, 0, z - 0.15), new THREE.Vector3(x + 0.15, 6, z + 0.15)));
  g.userData = {kind: 'light'};
  if (Math.random() < 0.55) {
    const L = new THREE.PointLight(0xffdd88, 0, 14, 2);
    L.position.set(0, 5.9, 0);
    g.add(L);
    head.material.emissive.setHex(0x664400);
    streetLights.push(L);
  }
}

function makeCar(x, z, rot) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.rotation.y = rot;
  g.frustumCulled = false;
  const col = [0x7a1a1a, 0x1a3a7a, 0x3a3a3a, 0x2a5a2a, 0x6a5a3a, 0x8a8a8a][ri(0, 5)];
  const bodyMat = new THREE.MeshStandardMaterial({color: col, roughness: 0.5, metalness: 0.2});
  const glassMat = new THREE.MeshStandardMaterial({color: 0x88bbdd, roughness: 0.3});
  const tireMat = new THREE.MeshStandardMaterial({color: 0x111111, roughness: 1});
  const add = (geo, mat, px, py, pz) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(px, py, pz);
    m.frustumCulled = false;
    g.add(m);
    return m;
  };
  add(new THREE.BoxGeometry(1.9, 0.6, 4.2), bodyMat, 0, 0.55, 0);
  add(new THREE.BoxGeometry(1.7, 0.7, 2.2), bodyMat, 0, 1.15, -0.2);
  add(new THREE.BoxGeometry(1.55, 0.5, 0.1), glassMat, 0, 1.15, 1);
  add(new THREE.BoxGeometry(1.55, 0.5, 0.1), glassMat, 0, 1.15, -1.4);
  for (const [wx, wz] of [
    [-0.85, 1.3],
    [0.85, 1.3],
    [-0.85, -1.3],
    [0.85, -1.3]
  ]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.25, 10), tireMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, 0.4, wz);
    wheel.frustumCulled = false;
    g.add(wheel);
  }
  add(new THREE.BoxGeometry(1.7, 0.1, 0.1), bodyMat, 0, 0.4, 2.1);
  g.userData.veh = 1;
  scene.add(g);
  const sw = Math.abs(Math.sin(rot)) > 0.7,
    hx = sw ? 2.2 : 1.1,
    hz = sw ? 1.1 : 2.2;
  solids.push(new THREE.Box3(new THREE.Vector3(x - hx, 0, z - hz), new THREE.Vector3(x + hx, 1, z + hz)));
  walkables.push(new THREE.Box3(new THREE.Vector3(x - hx, 0, z - hz), new THREE.Vector3(x + hx, 1.5, z + hz)));
  return g;
}

function makeArmyTruck(x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.frustumCulled = false;
  const oliveMat = new THREE.MeshStandardMaterial({color: 0x445a2a, roughness: 0.8});
  const darkMat = new THREE.MeshStandardMaterial({color: 0x334420, roughness: 0.9});
  const canvasMat = new THREE.MeshStandardMaterial({color: 0x556638, roughness: 1});
  const tireMat = new THREE.MeshStandardMaterial({color: 0x111111, roughness: 1});
  const chromeMat = new THREE.MeshStandardMaterial({color: 0x999999, roughness: 0.3, metalness: 0.6});
  const glassMat = new THREE.MeshStandardMaterial({color: 0x88bbdd, roughness: 0.3});
  const add = (geo, mat, px, py, pz) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(px, py, pz);
    m.frustumCulled = false;
    g.add(m);
    return m;
  };
  add(new THREE.BoxGeometry(2.8, 0.4, 9), darkMat, 0, 0.7, 0);
  add(new THREE.BoxGeometry(2.8, 1.4, 2.6), oliveMat, 0, 1.7, 3.2);
  add(new THREE.BoxGeometry(2.65, 0.5, 1.2), glassMat, 0, 2.1, 4.35);
  add(new THREE.BoxGeometry(2.4, 0.4, 0.06), glassMat, 0, 2.1, 4.42);
  add(new THREE.BoxGeometry(2.6, 0.8, 1.4), oliveMat, 0, 1.3, 4.6);
  add(new THREE.BoxGeometry(2.9, 0.3, 6), darkMat, 0, 1.1, -0.4);
  add(new THREE.BoxGeometry(2.7, 2.4, 5.8), canvasMat, 0, 2.4, -0.4);
  for (let i = -2; i <= 2; i++) add(new THREE.BoxGeometry(2.75, 0.1, 0.1), darkMat, 0, 2.4 + i * 0.4, -0.4);
  add(new THREE.BoxGeometry(2.4, 1.8, 0.1), oliveMat, 0, 2.1, -3.35);
  for (const [wx, wz] of [
    [-1.3, 3.3],
    [1.3, 3.3],
    [-1.3, -1.5],
    [1.3, -1.5],
    [-1.3, -3],
    [1.3, -3]
  ]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.35, 12), tireMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(wx, 0.55, wz);
    wheel.frustumCulled = false;
    g.add(wheel);
  }
  add(new THREE.BoxGeometry(2.9, 0.3, 0.2), darkMat, 0, 0.7, 5.4);
  add(new THREE.BoxGeometry(2.8, 0.15, 0.15), chromeMat, 0, 1.0, 5.4);
  add(new THREE.CylinderGeometry(0.1, 0.1, 2.4, 8), chromeMat, 1.3, 2.6, 3.6);
  const spare = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.25, 12), tireMat);
  spare.rotation.x = Math.PI / 2;
  spare.position.set(0, 1.8, -3.4);
  spare.frustumCulled = false;
  g.add(spare);
  const cv = document.createElement('canvas');
  cv.width = 256;
  cv.height = 32;
  const cx = cv.getContext('2d');
  cx.fillStyle = '#445a2a';
  cx.fillRect(0, 0, 256, 32);
  cx.fillStyle = '#c8c8a0';
  cx.font = 'bold 22px Impact';
  cx.textAlign = 'center';
  cx.fillText('★ U.S. ARMY ★', 128, 24);
  const strip = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 0.35),
    new THREE.MeshBasicMaterial({map: new THREE.CanvasTexture(cv)})
  );
  strip.position.set(0, 1.6, 4.5);
  strip.frustumCulled = false;
  g.add(strip);
  scene.add(g);
  solids.push(new THREE.Box3(new THREE.Vector3(x - 1.6, 0, z - 4.6), new THREE.Vector3(x + 1.6, 2, z + 5.5)));
  walkables.push(new THREE.Box3(new THREE.Vector3(x - 1.6, 0, z - 4.6), new THREE.Vector3(x + 1.6, 3.6, z + 5.5)));
  g.userData = {kind: 'truck'};
  return g;
}

function makePark(x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  scene.add(g);
  mesh(new THREE.PlaneGeometry(28, 28), 0x2d5a2a, 0, 0.02, 0, g).rotation.x = -Math.PI / 2;
  mesh(new THREE.PlaneGeometry(4, 26), 0x8a7a5a, 0, 0.03, 0, g).rotation.x = -Math.PI / 2;
  mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.6, 6), 0x555555, -3, 1.8, 4, g);
  mesh(new THREE.CylinderGeometry(0.1, 0.1, 3.6, 6), 0x555555, 3, 1.8, 4, g);
  const bar = mesh(new THREE.CylinderGeometry(0.1, 0.1, 6.2, 6), 0x555555, 0, 3.6, 4, g);
  bar.rotation.z = Math.PI / 2;
  solids.push(new THREE.Box3(new THREE.Vector3(x - 3.2, 0, z + 3.7), new THREE.Vector3(x - 2.8, 3.6, z + 4.3)));
  solids.push(new THREE.Box3(new THREE.Vector3(x + 2.8, 0, z + 3.7), new THREE.Vector3(x + 3.2, 3.6, z + 4.3)));
  mesh(new THREE.BoxGeometry(0.5, 0.06, 0.3), 0x8a5a2a, -1.5, 0.6, 4, g);
  mesh(new THREE.BoxGeometry(0.5, 0.06, 0.3), 0x8a5a2a, 1.5, 0.6, 4, g);
  mesh(new THREE.BoxGeometry(0.8, 2.5, 0.8), 0xcc3333, -4, 1.25, -3, g);
  solids.push(new THREE.Box3(new THREE.Vector3(x - 4.4, 0, z - 3.4), new THREE.Vector3(x - 3.6, 2.5, z - 2.6)));
  const slide = mesh(new THREE.BoxGeometry(1, 2.6, 0.3), 0x88aacc, -4, 1.2, -1, g);
  slide.rotation.x = -Math.PI / 5;
  mesh(new THREE.BoxGeometry(4, 0.3, 4), 0xd4c088, 0, 0.15, -4, g);
  for (const [sx, sz, sw, sd] of [
    [-2, 0.3, 4, 0.4],
    [2, 0.3, 4, 0.4],
    [0, -2.3, 0.4, 4],
    [0, 1.7, 0.4, 4]
  ])
    mesh(new THREE.BoxGeometry(sw, 0.6, sd), 0x8a5a2a, sx, 0.3, -4 + sz, g);
  for (const bx of [-8, 8]) {
    mesh(new THREE.BoxGeometry(2, 0.15, 0.5), 0x7a4a2a, bx, 0.45, -8, g);
    mesh(new THREE.BoxGeometry(0.2, 0.4, 0.5), 0x333, bx - 0.8, 0.2, -8, g);
    mesh(new THREE.BoxGeometry(0.2, 0.4, 0.5), 0x333, bx + 0.8, 0.2, -8, g);
    solids.push(
      new THREE.Box3(new THREE.Vector3(x + bx - 1, 0, z - 8 - 0.25), new THREE.Vector3(x + bx + 1, 0.6, z - 8 + 0.25))
    );
  }
  for (const [tx, tz] of [
    [-12, -12],
    [12, -12],
    [-12, 12],
    [12, 12]
  ])
    tree(x + tx, z + tz);
  spawnContainer(x + 8, z - 8, 'park');
  buildings.push({x, z, w: 28, d: 28, t: 'park'});
}
function makeCemetery(x, z) {
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  scene.add(g);
  mesh(new THREE.PlaneGeometry(24, 24), 0x2a3a2a, 0, 0.02, 0, g).rotation.x = -Math.PI / 2;
  for (let i = -12; i < 12; i += 2) {
    mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 4), 0x333333, i, 0.75, -12, g);
    mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 4), 0x333333, i, 0.75, 12, g);
    mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 4), 0x333333, -12, 0.75, i, g);
    mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 4), 0x333333, 12, 0.75, i, g);
  }
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 6; j++) {
      const tx = -9 + i * 6,
        tz = -8 + j * 3;
      const stone = mesh(new THREE.BoxGeometry(1.2, 1.4, 0.3), 0x888888, tx, 0.7, tz, g);
      if (Math.random() < 0.15) stone.rotation.z = rnd(-0.2, 0.2);
      solids.push(
        new THREE.Box3(
          new THREE.Vector3(x + tx - 0.6, 0, z + tz - 0.15),
          new THREE.Vector3(x + tx + 0.6, 1.4, z + tz + 0.15)
        )
      );
    }
  for (let i = 0; i < 3; i++) spawnContainer(x + rnd(-9, 9), z + rnd(-9, 9), 'cemetery');
  buildings.push({x, z, w: 24, d: 24, t: 'cemetery'});
}
