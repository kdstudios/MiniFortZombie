/* ==========================================================================================================
   MINI FORT ZOMBIE - VEHICLES (v078): the 1950s retro fleet.
   Every vehicle is built by js/modern/retro50.js (RGRETRO / PF.retro) and stamped through RGPROPS.retroGroup: ONE geometry per model,
   any paint (two-tone: primary + accent) through a per-instance material colour, dusty/weathered variants for the abandoned look.

   The 25 body types:   micro  sedan  hatchback  universal  liftback  coupe  cabriolet  roadster  targa  limousine  muscle  sportcar
                        supercar  suv  crossover  pickup  van  minivan  minibus  campervan  bus  towtruck  minitruck  dumptruck  truck
   Offshoots:           ambulance  firetruck  schoolbus  police  taxi          Also: jeep, army (cargo truck), boxtruck, wreck, civilian
   API: MFZV.make(kind, x, z, rot, opts) -> THREE.Group in world space, front = +Z at rot 0, with a collider and a walkable top.
        opts: {tint:[r,g,b] | {carpaint,carpaint2,...}, accent:[r,g,b], ci: palette index, dust:true|false, label:'TEXT', labelCol:'#hex',
         wreck: 'burnt' | 'rusted' | 'crashed' | true (random style), seed: 0..2 (damage variant)}  <- works on EVERY kind
        MFZV.kinds lists every kind; MFZV.paints lists the 50s paint schemes (index -> [name, body, accent]).
   Falls back to makeCar / makeArmyTruck when the Modern props are switched off (Options > Graphics > Props).
   ========================================================================================================== */
(function () {
  'use strict';
  const P = window.RGPROPS,
    K = window.RGPK,
    T = THREE,
    PI = Math.PI;
  const PF = K && K.PF;
  const RT = () => window.RGRETRO;
  const on = () => !!(P && P.retroGroup && PF && PF.retro && RT()) && !(window.RGFX && RGFX.s.props === 0);
  const pick = a => a[Math.floor(Math.random() * a.length)];

  /* ---------- painted text / emblems (shared materials) ---------- */
  const TX = new Map();
  function textMat(txt, aspect, fg, bg, font) {
    const k = [txt, aspect, fg, bg, font].join('|');
    let m = TX.get(k);
    if (m) return m;
    const cv = document.createElement('canvas');
    cv.width = 512;
    cv.height = Math.max(24, Math.round(512 / aspect));
    const q = cv.getContext('2d');
    if (bg) {
      q.fillStyle = bg;
      q.fillRect(0, 0, cv.width, cv.height);
    }
    let sz = Math.floor(cv.height * 0.78);
    const f = () => (q.font = 'bold ' + sz + 'px ' + (font || '"Arial Black", Arial, sans-serif'));
    f();
    while (q.measureText(txt).width > cv.width * 0.94 && sz > 8) {
      sz -= 2;
      f();
    }
    q.fillStyle = fg;
    q.textAlign = 'center';
    q.textBaseline = 'middle';
    q.fillText(txt, cv.width / 2, cv.height / 2 + sz * 0.04);
    const t = new T.CanvasTexture(cv);
    t.anisotropy = 4;
    m = new T.MeshBasicMaterial({map: t, transparent: !bg, alphaTest: bg ? 0 : 0.35, side: T.FrontSide});
    TX.set(k, m);
    return m;
  }
  function crossMat() {
    const k = '+cross';
    let m = TX.get(k);
    if (m) return m;
    const cv = document.createElement('canvas');
    cv.width = cv.height = 128;
    const q = cv.getContext('2d');
    q.fillStyle = '#c8141a';
    q.fillRect(44, 12, 40, 104);
    q.fillRect(12, 44, 104, 40);
    m = new T.MeshBasicMaterial({map: new T.CanvasTexture(cv), transparent: true, alphaTest: 0.35});
    TX.set(k, m);
    return m;
  }
  /* racing roundel: white disc, black number */
  function numMat(txt, fg, bg) {
    const k = '#' + [txt, fg, bg].join('|');
    let m = TX.get(k);
    if (m) return m;
    const cv = document.createElement('canvas');
    cv.width = cv.height = 128;
    const q = cv.getContext('2d');
    q.fillStyle = bg || '#f4f0e6';
    q.beginPath();
    q.arc(64, 64, 60, 0, PI * 2);
    q.fill();
    q.lineWidth = 4;
    q.strokeStyle = '#222';
    q.stroke();
    let sz = txt.length > 2 ? 52 : txt.length > 1 ? 68 : 84;
    q.font = 'bold ' + sz + 'px "Arial Black", Arial, sans-serif';
    q.fillStyle = fg || '#111';
    q.textAlign = 'center';
    q.textBaseline = 'middle';
    q.fillText(txt, 64, 68);
    m = new T.MeshBasicMaterial({map: new T.CanvasTexture(cv), transparent: true, alphaTest: 0.35});
    TX.set(k, m);
    return m;
  }
  function plane(g, mat, w, h, x, y, z, ry) {
    const m = new T.Mesh(new T.PlaneGeometry(w, h), mat);
    m.position.set(x, y, z);
    m.rotation.y = ry || 0;
    m.frustumCulled = false;
    m.userData.kind = 'rgprop';
    g.add(m);
    return m;
  }

  /* ---------- kinds ---------- */
  /* public kind -> retro model name */
  const MAP = {
    micro: 'micro',
    sedan: 'sedan',
    hatchback: 'hatch',
    universal: 'universal',
    liftback: 'liftback',
    coupe: 'coupe',
    cabriolet: 'cabrio',
    roadster: 'roadster',
    targa: 'targa',
    limousine: 'limo',
    muscle: 'muscle',
    sportcar: 'sport',
    supercar: 'supercar',
    suv: 'suv',
    crossover: 'crossover',
    pickup: 'pickup',
    van: 'van',
    minivan: 'minivan',
    minibus: 'minibus',
    campervan: 'camper',
    bus: 'bus',
    towtruck: 'tow',
    minitruck: 'minitruck',
    dumptruck: 'dump',
    truck: 'truck',
    ambulance: 'ambulance',
    firetruck: 'fire',
    schoolbus: 'schoolbus',
    police: 'police',
    taxi: 'taxi',
    jeep: 'jeep',
    army: 'army',
    boxtruck: 'boxtruck'
  };
  /* fixed liveries for the offshoots: [primary, accent] (50s service colours) */
  const LIVERY = {
    police: [
      [0.05, 0.05, 0.06],
      [0.95, 0.95, 0.95]
    ],
    taxi: [
      [0.96, 0.76, 0.08],
      [0.08, 0.08, 0.08]
    ],
    ambulance: [
      [0.95, 0.95, 0.92],
      [0.78, 0.06, 0.06]
    ],
    firetruck: [
      [0.7, 0.05, 0.05],
      [0.93, 0.82, 0.42]
    ],
    schoolbus: [
      [0.96, 0.72, 0.04],
      [0.05, 0.05, 0.05]
    ],
    army: [
      [0.32, 0.37, 0.2],
      [0.27, 0.31, 0.18]
    ],
    jeep: [
      [0.33, 0.38, 0.22],
      [0.3, 0.34, 0.2]
    ],
    van: [
      [0.94, 0.94, 0.92],
      [0.2, 0.32, 0.5]
    ],
    boxtruck: [
      [0.95, 0.95, 0.93],
      [0.78, 0.2, 0.15]
    ],
    towtruck: [
      [0.7, 0.12, 0.1],
      [0.94, 0.92, 0.85]
    ],
    bus: [
      [0.9, 0.82, 0.5],
      [0.15, 0.4, 0.3]
    ]
  };
  const STREET = [
    'sedan',
    'hatchback',
    'universal',
    'liftback',
    'coupe',
    'cabriolet',
    'roadster',
    'targa',
    'muscle',
    'sportcar',
    'micro',
    'suv',
    'crossover',
    'pickup',
    'van',
    'minivan',
    'minibus',
    'campervan'
  ];
  const LEGACY = {sedan: 'sedan', hatch: 'hatchback', suv: 'suv', mpv: 'minivan', cross: 'crossover', offroad: 'jeep'};

  function paint(kind, o) {
    if (o.tint && !Array.isArray(o.tint)) return o.tint;
    if (Array.isArray(o.tint)) return RT().tint({tint: o.tint, accent: o.accent});
    const L = LIVERY[kind];
    if (L && o.ci === undefined) return RT().tint({tint: L[0], accent: L[1]});
    const n = RT().paints.length;
    return RT().tint({ci: o.ci !== undefined ? o.ci : Math.floor(Math.random() * n)});
  }
  function spec(kind, o) {
    let k = kind,
      dust = o.dust,
      wreck = o.wreck;
    if (kind === 'civilian' || kind === 'wreck') {
      const m = (o.model && LEGACY[o.model]) || o.model;
      k =
        m && MAP[m]
          ? m
          : pick(
              kind === 'wreck'
                ? [
                    'sedan',
                    'hatchback',
                    'universal',
                    'coupe',
                    'suv',
                    'pickup',
                    'crossover',
                    'van',
                    'cabriolet',
                    'muscle',
                    'bus',
                    'minibus'
                  ]
                : STREET
            );
    }
    if (kind === 'wreck' && !wreck) wreck = true;
    const rk = MAP[k] || 'sedan',
      tint = paint(k, o),
      m = RT().meta[rk];
    let xo = null,
      t = tint;
    if (wreck) {
      const st = wreck === true || RT().wreckStyles.indexOf(wreck) < 0 ? pick(RT().wreckStyles) : wreck;
      xo = {
        wreck: st,
        seed: o.seed !== undefined ? o.seed : Math.floor(Math.random() * 3),
        pc: tint.carpaint,
        ac: tint.carpaint2
      };
      t = null;
      dust = true;
    } else if (dust === undefined)
      dust = kind === 'civilian' ? Math.random() < 0.5 : ['jeep', 'army'].indexOf(kind) >= 0;
    return {
      rk,
      tint: t,
      dust: !!dust,
      xo,
      wreck: !!wreck,
      dims: m.dims,
      label: o.label,
      labelCol: o.labelCol,
      labelBg: o.labelBg,
      noStar: o.noStar,
      kind: k
    };
  }

  /* ---------- lettering and emblems recorded by the model builders ---------- */
  function dress(g, sp) {
    const list = RT().decals[sp.rk] || [];
    for (const d of list) {
      let mat = null;
      if (d.t === 'text') mat = textMat(d.txt, d.asp, d.fg, d.bg);
      else if (d.t === 'num') mat = numMat(d.txt, d.fg, d.bg);
      else if (d.t === 'star') {
        if (sp.noStar) continue;
        mat = textMat(d.txt, 1, d.fg);
      } else if (d.t === 'cross') mat = crossMat();
      else if (d.t === 'label') {
        if (!sp.label) continue;
        mat = textMat(sp.label, d.asp, sp.labelCol || '#7a2a12', sp.labelBg !== undefined ? sp.labelBg : d.bg); // v090: sign panel (van)
      }
      if (!mat) continue;
      if (d.side) {
        const x = d.x;
        plane(g, mat, d.w, d.h, x, d.y, d.z, PI / 2);
        plane(g, mat, d.w, d.h, -x, d.y, d.z, -PI / 2);
      } else plane(g, mat, d.w, d.h, d.x || 0, d.y, d.z, d.end === 'rear' ? PI : 0);
    }
  }

  function make(kind, x, z, rot, o) {
    o = o || {};
    rot = rot || 0;
    if (!on()) {
      const g =
        /firetruck|army|boxtruck|bus|dumptruck|truck/.test(kind) && typeof makeArmyTruck === 'function'
          ? makeArmyTruck(x, z)
          : makeCar(x, z, rot);
      return g;
    }
    const sp = spec(kind, o),
      g = P.retroGroup(sp.rk, sp.dust, sp.tint, sp.xo);
    if (!sp.wreck) dress(g, sp);
    g.position.set(x, 0, z);
    g.rotation.y = rot;
    g.frustumCulled = false;
    g.userData = {veh: 1, kind: 'vehicle', vkind: kind, rkind: sp.rk};
    scene.add(g);
    g.userData.half = collide(g, x, z, rot);
    return g;
  }

  /* ---------- collision (v093): the vehicle's real outline and heights ----------
     Before: ONE box per vehicle, as long and wide as the model's listed size (mirrors and bumper tips included), grown to its
     world-aligned bounding box when the vehicle was turned, solid up to 55% of its height with a "walkable" lid at full height.
     So you stopped well short of a car, could not pass a slanted one, and a jump that landed between 55% and 100% of the height
     dropped you inside it.
     Now: the model is measured, once per model. Its triangles are drawn from above into a height map (6 cm cells), which is
     read in 25 cm cells: a cell is solid if the model covers at least a third of it, and as tall as the model is there (thin
     things are left out: aerials, exhaust stacks, mirrors, door handles; so is anything that only hangs overhead: an awning, a
     crane boom, a truck mirror). Neighbouring cells of about the same height become one box, solid from the ground to its top.
     So you can stand right against the paint, step from the bonnet to the roof and stand on either, and a pickup's bed is lower
     than its cab.
     A vehicle that is not parked square to the map uses 50 cm cells (collision boxes cannot turn), which follow its outline to
     within about 6 cm. */
  const PROF = new Map(),
    FINE = 0.0625,
    CELL = 0.25;
  function profile(g) {
    const key = g.children.length && g.children[0].geometry ? g.children[0].geometry.uuid : g.uuid;
    let P = PROF.get(key);
    if (P) return P;
    // 1. bounds
    const bb = new T.Box3(),
      v = new T.Vector3();
    const meshes = [];
    g.traverse(c => {
      if (c === g || !c.geometry || !c.geometry.attributes.position) return;
      c.updateMatrix();
      meshes.push(c);
    });
    const A = new T.Vector3(),
      B = new T.Vector3(),
      C = new T.Vector3(),
      m4 = new T.Matrix4();
    const local = c => {
      // matrix from the mesh to the vehicle group (meshes are direct children, or one level down)
      m4.identity();
      for (let o = c; o && o !== g; o = o.parent) m4.premultiply(o.matrix);
      return m4;
    };
    for (const c of meshes) {
      const a = c.geometry.attributes.position,
        m = local(c).clone();
      for (let i = 0; i < a.count; i += 3) bb.expandByPoint(v.fromBufferAttribute(a, i).applyMatrix4(m));
      c.userData._vm = m;
    }
    const x0 = Math.floor((bb.min.x - 0.2) / CELL) * CELL,
      z0 = Math.floor((bb.min.z - 0.2) / CELL) * CELL,
      nx = Math.ceil((bb.max.x + 0.2 - x0) / CELL),
      nz = Math.ceil((bb.max.z + 0.2 - z0) / CELL),
      fx = nx * 4,
      fz = nz * 4,
      top = new Float32Array(fx * fz), // highest point of the model over each fine cell
      low = new Float32Array(fx * fz).fill(99); // lowest
    // 2. every triangle, sampled every 5 cm, into the fine map
    const put = (x, y, z) => {
      const i = Math.floor((x - x0) / FINE),
        j = Math.floor((z - z0) / FINE);
      if (i < 0 || j < 0 || i >= fx || j >= fz) return;
      const k = j * fx + i;
      if (y > top[k]) top[k] = y;
      if (y < low[k]) low[k] = y;
    };
    for (const c of meshes) {
      const a = c.geometry.attributes.position,
        ix = c.geometry.index,
        m = c.userData._vm,
        n = ix ? ix.count : a.count;
      delete c.userData._vm;
      for (let t = 0; t + 2 < n; t += 3) {
        A.fromBufferAttribute(a, ix ? ix.getX(t) : t).applyMatrix4(m);
        B.fromBufferAttribute(a, ix ? ix.getX(t + 1) : t + 1).applyMatrix4(m);
        C.fromBufferAttribute(a, ix ? ix.getX(t + 2) : t + 2).applyMatrix4(m);
        // only the size seen from above matters: a tall flat side panel needs few samples
        const e = Math.max(
            Math.hypot(B.x - A.x, B.z - A.z),
            Math.hypot(C.x - A.x, C.z - A.z),
            Math.hypot(C.x - B.x, C.z - B.z)
          ),
          d = Math.min(120, Math.max(1, Math.ceil(e / 0.05)));
        for (let p = 0; p <= d; p++)
          for (let q = 0; q <= d - p; q++) {
            const u = p / d,
              w = q / d,
              r = 1 - u - w;
            put(A.x * r + B.x * u + C.x * w, A.y * r + B.y * u + C.y * w, A.z * r + B.z * u + C.z * w);
          }
      }
    }
    // 3. coarse cells: solid if a third is covered by something that reaches below 1.85 m; height = what most of the cell reaches
    const H = new Float32Array(nx * nz),
      tmp = [];
    for (let j = 0; j < nz; j++)
      for (let i = 0; i < nx; i++) {
        tmp.length = 0;
        let lo = 99;
        for (let b = 0; b < 4; b++)
          for (let a = 0; a < 4; a++) {
            const k = (j * 4 + b) * fx + i * 4 + a;
            if (top[k] > 0.25) {
              tmp.push(top[k]);
              if (low[k] < lo) lo = low[k];
            }
          }
        if (tmp.length < 6 || lo > 1.85) continue; // under a third covered, or it only hangs overhead (you walk under it)
        tmp.sort((p, q) => p - q);
        H[j * nx + i] = tmp[Math.min(tmp.length - 1, Math.floor(tmp.length * 0.8))];
      }
    // a lone cell (a mirror head, a bumper guard) is not worth a box; a hole of one cell inside the body is filled
    const at = (i, j) => (i < 0 || j < 0 || i >= nx || j >= nz ? 0 : H[j * nx + i]);
    const H2 = H.slice();
    for (let j = 0; j < nz; j++)
      for (let i = 0; i < nx; i++) {
        const nb = [at(i - 1, j), at(i + 1, j), at(i, j - 1), at(i, j + 1)],
          n = nb.filter(h => h > 0).length;
        if (H[j * nx + i] > 0 && n === 0) H2[j * nx + i] = 0;
        else if (!H[j * nx + i] && n >= 3) H2[j * nx + i] = Math.min(...nb.filter(h => h > 0));
      }
    // 4. boxes for a square-parked vehicle: runs across of about one height, then stacked along the length
    const boxes = [],
      open = new Map();
    for (let j = 0; j <= nz; j++) {
      const seen = new Set();
      if (j < nz)
        for (let i = 0; i < nx; ) {
          const h = H2[j * nx + i];
          if (!h) {
            i++;
            continue;
          }
          let e = i + 1,
            hi = h,
            lo = h;
          while (e < nx && H2[j * nx + e] && Math.max(hi, H2[j * nx + e]) - Math.min(lo, H2[j * nx + e]) < 0.16) {
            hi = Math.max(hi, H2[j * nx + e]);
            lo = Math.min(lo, H2[j * nx + e]);
            e++;
          }
          const k = i + ':' + e,
            b = open.get(k);
          if (b && Math.abs(b.h0 - hi) < 0.16) {
            b.j1 = j + 1;
            b.h = Math.max(b.h, hi);
          } else {
            if (b) boxes.push(b);
            open.set(k, {i0: i, i1: e, j0: j, j1: j + 1, h: hi, h0: hi});
          }
          seen.add(k);
          i = e;
        }
      for (const [k, b] of open)
        if (!seen.has(k)) {
          boxes.push(b);
          open.delete(k);
        }
    }
    const sq = boxes.map(b => [x0 + b.i0 * CELL, x0 + b.i1 * CELL, z0 + b.j0 * CELL, z0 + b.j1 * CELL, b.h]);
    // 5. 50 cm cells for a turned vehicle
    const tu = [];
    for (let j = 0; j < nz; j += 2)
      for (let i = 0; i < nx; i += 2) {
        const hs = [at(i, j), at(i + 1, j), at(i, j + 1), at(i + 1, j + 1)].map((h, k) =>
            H2[(j + (k >> 1)) * nx + i + (k & 1)] !== undefined && i + (k & 1) < nx && j + (k >> 1) < nz
              ? H2[(j + (k >> 1)) * nx + i + (k & 1)]
              : 0
          ),
          n = hs.filter(h => h > 0).length;
        if (n < 2) continue;
        // only as wide and long as its solid quarters
        const xa = hs[0] || hs[2] ? 0 : 1,
          xb = hs[1] || hs[3] ? 2 : 1,
          za = hs[0] || hs[1] ? 0 : 1,
          zb = hs[2] || hs[3] ? 2 : 1;
        tu.push([
          x0 + (i + xa) * CELL,
          x0 + (i + xb) * CELL,
          z0 + (j + za) * CELL,
          z0 + (j + zb) * CELL,
          Math.max(...hs)
        ]);
      }
    let hw = 0,
      l0 = 0,
      l1 = 0;
    for (const b of sq) {
      hw = Math.max(hw, -b[0], b[1]);
      l0 = Math.min(l0, b[2]);
      l1 = Math.max(l1, b[3]);
    }
    P = {sq, tu, hw, z0: l0, z1: l1, H: H2, nx, nz, x0, zo: z0};
    PROF.set(key, P);
    return P;
  }
  /* adds the solids of a vehicle group standing at (x, z), turned rot; returns its half extents on the map's axes */
  function collide(g, x, z, rot) {
    const P = profile(g),
      c = Math.cos(rot || 0),
      s = Math.sin(rot || 0),
      ac = Math.abs(c),
      as = Math.abs(s),
      square = as < 0.035 || ac < 0.035;
    for (const b of square ? P.sq : P.tu) {
      // local (x, z) -> world: the group is turned about Y by rot
      const cx = (b[0] + b[1]) / 2,
        cz = (b[2] + b[3]) / 2,
        hx = ((b[1] - b[0]) * ac + (b[3] - b[2]) * as) / 2,
        hz = ((b[1] - b[0]) * as + (b[3] - b[2]) * ac) / 2,
        wx = x + cx * c + cz * s,
        wz = z - cx * s + cz * c;
      solids.push(new T.Box3(new T.Vector3(wx - hx, 0, wz - hz), new T.Vector3(wx + hx, b[4], wz + hz)));
    }
    const L = Math.max(-P.z0, P.z1);
    return [P.hw * ac + L * as, P.hw * as + L * ac];
  }
  const kinds = ['civilian', 'wreck'].concat(Object.keys(MAP));
  window.MFZV = {
    make,
    collide, // (group, x, z, rot): the street cars of js/layers/props.js use it too
    profile,
    kinds,
    on,
    map: MAP,
    get paints() {
      return RT() && RT().paints;
    },
    retro: RT
  };
  console.log('[vehicles] ' + kinds.length + ' vehicle kinds ready (1950s retro fleet)');
})();
