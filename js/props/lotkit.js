/* ==========================================================================================================
   MINI FORT ZOMBIE - LOT KIT (v081): the shared plumbing for full-block lots (40 x 36 m plot, front = +Z), so a new building
   layer only holds its own design. Every helper here was lifted from code that was copied into all 11 full-block layers.
   Loaded after js/props/mfzkit.js (MFZK) and before the first lot layer. Template: js/layers/church.js. Catalogue: docs/FEATURES.md.

   In a lot layer: const K = window.MFZK, LK = window.LOTKIT (not L: build() code often uses L for a length).
   Geometry (inside build(), building-local coordinates, built once and cached by the layer):
     const G = LK.geo('mylot'), b = G.b, S = G.S;      // K.builder + collision boxes; S(x0,x1,z0,z1,y0,y1,noOcc)
     ... return (CACHE = G.done());                    // -> {M, cols, occ}
     LK.pavement(b, mat, o)                             // front sidewalk slab + expansion joints (+ optional kerb)
     LK.lineWall(b, ax, f, a0, a1, n, ops, top, span)   // interior wall lining that steps round WL doors / windows / gates
     LK.lightPole(b, S, x, o) / LK.meter(b, S, x, o) / LK.hydrant(b, S, x, o) / LK.signal(b, S, x, o) / LK.noParking(b, x, o)
   Lot (inside the bXxx(x, z, t) builder, after mk() and the WL walls):
     LK.attach(B, C)                                    // decor meshes + world solids + occluders
     const SP = LK.spawner(B, 'table')                  // SP(lx, lz, model, table, angle, y0): a lootable prop container
     LK.finish(B, t, {at: [lx, lz], w, d, loot: [table, rect, n], zombies: [[x, z]...]})
   Registration (once, at load):
     LK.register({id, name, note, build, ruinMax: 1, push: {...new NEWCAT fields}, globals: {bName: fn}})
   ========================================================================================================== */
(function () {
  'use strict';
  const K = window.MFZK;
  if (!K) {
    console.warn('[lotkit] MFZK prop kit missing');
    return;
  }
  const T = THREE,
    PI = Math.PI;
  const L = (window.LOTKIT = {});

  /* ---------------- geometry ---------------- */
  // a builder plus the collision list: S() adds a solid box and (unless noOcc) a camera occluder footprint
  L.geo = function (name) {
    const b = K.builder(name),
      cols = [],
      occ = [];
    const S = (x0, x1, z0, z1, y0, y1, noOcc) => {
      cols.push([Math.min(x0, x1), y0, Math.min(z0, z1), Math.max(x0, x1), y1, Math.max(z0, z1)]);
      if (!noOcc) occ.push([Math.min(x0, x1), Math.max(x0, x1), Math.min(z0, z1), Math.max(z0, z1)]);
    };
    b.keepSrc = 1; // v089: keep the part list for the looted / ruined copies (js/props/condkit.js)
    return {b, S, cols, occ, done: () => ({M: b.done(), cols, occ})};
  };

  // front sidewalk: slab, joints every 1.5 m. o.z / o.d: centre and depth (16.95 / 2.08 normal, 16.75 / 2.48 deep),
  // o.jh joint height (0.062; the gas station and gun shop use 0.052), o.kerb: kerb strip at z 15.9,
  // o.w / o.x: width and centre (40 / 0; a half plot is 20 wide)
  L.pavement = function (b, mat, o) {
    o = o || {};
    const z = o.z || 16.95,
      d = o.d || 2.08,
      w = o.w || 40,
      cx = o.x || 0;
    b.box(w, 0.06, d + 0.02, mat, [cx, 0.03, z], null, 0);
    for (let x = cx - w / 2 + 0.5; x < cx + w / 2; x += 1.5)
      b.box(0.02, o.jh || 0.062, d, K.mat(0x8a8880, 0.8), [x, 0.031, z], null, 0);
    if (o.kerb) b.box(w, 0.16, 0.2, mat, [cx, 0.08, 15.9], null, 0);
  };

  // interior lining along one wall. ax 1 = runs along X at z = f, 0 = along Z at x = f; a0..a1 the run; n = inward normal (+1 / -1);
  // ops = the same openings passed to WL ({k: 'w' | 'd' | 'g', c}); top = lining height.
  // span(pc, u0, u1, y0, y1) paints one solid stretch of wall; pc(u0, u1, y0, y1, mat, depth, offset) places one layer.
  // Openings match core WL: window 1.5 wide, 0.9-2.75 high; door 1.3 x 2.4; gate 1.6 x 2.5.
  L.lineWall = function (b, ax, f, a0, a1, n, ops, top, span) {
    ops = (ops || []).slice().sort((p, q) => p.c - q.c);
    const pc = (u0, u1, y0, y1, mat, dep, off) => {
      if (u1 - u0 < 0.04 || y1 - y0 < 0.02) return;
      const o = f + n * (0.15 + off),
        u = (u0 + u1) / 2,
        y = (y0 + y1) / 2;
      if (ax) b.box(u1 - u0, y1 - y0, dep, mat, [u, y, o], null, 0);
      else b.box(dep, y1 - y0, u1 - u0, mat, [o, y, u], null, 0);
    };
    const sp = (u0, u1, y0, y1) => span(pc, u0, u1, y0, y1);
    let a = a0;
    for (const p of ops) {
      const hw = p.k === 'w' ? 0.75 : p.k === 'g' ? 0.8 : 0.65;
      sp(a, p.c - hw, 0, top);
      if (p.k === 'w') {
        sp(p.c - hw, p.c + hw, 0, 0.9);
        sp(p.c - hw, p.c + hw, 2.75, top);
      } else sp(p.c - hw, p.c + hw, p.k === 'g' ? 2.5 : 2.4, top);
      a = p.c + hw;
    }
    sp(a, a1, 0, top);
  };

  /* ---------------- street furniture (front sidewalk, z about 17.5) ---------------- */
  const pole = () => K.mat(0xb8bcc0, 0.35, 0.7);

  // cobra-head street light on the front sidewalk, its arm reaching back toward the lot (-Z; the road is +Z beyond 18)
  // v090: the arm is short (1 m, was 2.4): the head hangs over the sidewalk, not over the lot's car park or yard, where it
  // looked like a floating lamp. It can't reach over the road: nothing may leave the plot (checkPlacement)
  // o.z (17.55), o.arm: arm reach (2.4; the motel's is 2.0), o.brace: diagonal brace (true)
  L.lightPole = function (b, S, x, o) {
    o = o || {};
    const lm = pole(),
      r = Math.min(o.arm || 2.4, 1.0),
      z = o.z || 17.55;
    b.push([x, 0, z]);
    b.rbox(0.45, 0.6, 0.45, 0.04, lm, [0, 0.3, 0]);
    b.cyl(0.09, 0.14, 8.6, lm, [0, 4.3, 0], null, 12);
    b.tube(
      [
        [0, 8.3, 0],
        [0, 8.8, -0.45],
        [0, 8.8, -r]
      ],
      0.05,
      lm,
      12,
      6
    );
    const long = r > 2.2;
    b.rbox(0.4, 0.14, long ? 0.75 : 0.7, 0.05, lm, [0, 8.75, -r - 0.2]);
    b.box(
      0.3,
      0.02,
      long ? 0.55 : 0.5,
      K.mat(0xffffff, 0.4, 0, {emissive: 0xfff2d0, emissiveIntensity: 0.8}),
      [0, 8.67, -r - 0.2],
      null,
      0
    );
    if (o.brace !== false) b.cyl(0.02, 0.02, 0.8, lm, [0, 8.35, -0.5], [1.1, 0, 0], 6);
    b.pop();
    S(x - 0.23, x + 0.23, z - 0.23, z + 0.23, 0, 8.6, true);
  };

  // single-head parking meter with a glass dome
  L.meter = function (b, S, x, o) {
    o = o || {};
    const z = o.z || 17.5;
    b.push([x, 0, z]);
    b.cyl(0.035, 0.035, 1.1, K.mat(0x3a3a3a, 0.4, 0.6), [0, 0.55, 0], null, 8);
    b.rbox(0.16, 0.26, 0.12, 0.04, K.mat(0x4a4c50, 0.4, 0.5), [0, 1.22, 0]);
    b.add(K.sphGeo(0.09, 12, 6, 0, PI / 2), K.glass(0xcfe6ee, 0.45), {p: [0, 1.35, 0]});
    b.pop();
    S(x - 0.1, x + 0.1, z - 0.1, z + 0.1, 0, 1.4, true);
  };

  // red fire hydrant
  L.hydrant = function (b, S, x, o) {
    o = o || {};
    const z = o.z || 17.5;
    b.push([x, 0, z]);
    const hy = K.mat(o.col || 0xc8261c, 0.45, 0.3);
    b.cyl(0.13, 0.15, 0.6, hy, [0, 0.32, 0], null, 16);
    b.add(K.sphGeo(0.14, 14, 8, 0, PI / 2), hy, {p: [0, 0.62, 0]});
    for (const s of [-1, 1]) b.cyl(0.05, 0.05, 0.12, hy, [s * 0.17, 0.42, 0], [0, 0, PI / 2], 10);
    b.cyl(0.2, 0.2, 0.05, hy, [0, 0.04, 0], null, 16);
    b.pop();
    S(x - 0.2, x + 0.2, z - 0.2, z + 0.2, 0, 0.8, true);
  };

  // corner traffic signal: a pole with a mast arm and two yellow 3-lamp heads (red lit)
  L.signal = function (b, S, x, o) {
    o = o || {};
    const z = o.z || 17.6,
      lm = pole();
    b.push([x, 0, z]);
    b.cyl(0.12, 0.16, 6.0, lm, [0, 3.0, 0], null, 12);
    b.cyl(0.08, 0.08, 4.5, lm, [-2.2, 5.8, 0], [0, 0, PI / 2], 10);
    for (const [hx, y, ry] of [
      [-3.8, 5.2, PI],
      [0, 3.0, PI]
    ]) {
      b.push([hx, y, 0], [0, ry, 0]);
      b.rbox(0.36, 1.0, 0.3, 0.04, K.mat(0xe8c020, 0.5), [0, 0, 0]);
      for (let k = 0; k < 3; k++) {
        b.cyl(
          0.11,
          0.11,
          0.02,
          K.mat([0x5a1010, 0x5a4a10, 0x105a20][k], 0.3, 0, {
            emissive: k === 0 ? 0xff2a1a : 0x000000,
            emissiveIntensity: 0.8
          }),
          [0, 0.3 - k * 0.3, 0.16],
          [PI / 2, 0, 0],
          14
        );
        b.add(new T.CylinderGeometry(0.14, 0.14, 0.12, 14, 1, true, 0, PI), K.mat(0x1a1a1a, 0.5), {
          p: [0, 0.3 - k * 0.3, 0.2],
          r: [PI / 2, 0, 0]
        });
      }
      b.pop();
    }
    b.pop();
    S(x - 0.2, x + 0.2, z - 0.2, z + 0.2, 0, 6, true);
  };

  // no-parking sign on a post. o.key: texture key (unique per lot), o.lines: extra red lines under NO PARKING
  L.noParking = function (b, x, o) {
    o = o || {};
    const z = o.z || 17.7,
      lines = o.lines || [];
    b.push([x, 0, z]);
    b.cyl(0.03, 0.03, 2.3, K.mat(0x8a8c8e, 0.4, 0.6), [0, 1.15, 0], null, 8);
    b.label(
      0.35,
      0.5,
      K.paint(o.key || 'lk_nopark', 140, 200, (c, W, H) => {
        c.fillStyle = '#fff';
        c.fillRect(0, 0, W, H);
        c.strokeStyle = '#c41a1a';
        c.lineWidth = 5;
        c.strokeRect(5, 5, W - 10, H - 10);
        K.P.text(c, 'NO', W / 2, 40, {size: 36, col: '#c41a1a'});
        K.P.text(c, 'PARKING', W / 2, 84, {size: 26, col: '#c41a1a'});
        lines.forEach((s, i) => K.P.text(c, s, W / 2, 126 + i * 34, {size: 22, col: '#c41a1a'}));
      }),
      [0, 2.0, 0.035]
    );
    b.pop();
  };

  /* ---------------- the lot ---------------- */
  // hang the cached decor on the building, turn its collision boxes into world solids, copy the occluders
  L.attach = function (B, C) {
    const D = new T.Object3D();
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
  };

  // SP(lx, lz, model, table, angle, y0): a lootable prop container in lot coordinates (angle turns with the lot)
  L.spawner = function (B, def) {
    const ry = a => (B.cs > 0 ? a : a + PI);
    return (lx, lz, name, table, a, y0) => {
      try {
        if (window.spawnPropContainer) spawnPropContainer(WX(B, lx), WZ(B, lz), name, table, ry(a), y0 || 0);
        else cont(B, table || def, lx, lz);
      } catch (e) {}
    };
  };

  // loot rooms, the town map footprint, 3-5 zombies from the candidate spots, LASTB
  // o.at: footprint centre (lot coords), o.w / o.d: footprint size, o.loot: [table, [x0, x1, z0, z1], n], o.zombies: [[x, z], ...]
  L.finish = function (B, t, o) {
    if (o.loot) rc(B, o.loot[0], o.loot[1], o.loot[2]);
    buildings.push({x: WX(B, o.at[0]), z: WZ(B, o.at[1]), w: o.w, d: o.d, t: t.id});
    for (const [px, pz] of (o.zombies || []).slice(0, ri(3, 6))) zombie(WX(B, px), WZ(B, pz));
    LASTB = B;
    return B;
  };

  /* v090: SIGNS ON DOORS AND WINDOWS. Painted decor drawn over a door leaf (OPEN / PUSH / hours cards, glazing, kick plates) stayed in
     the wall when the door swung open, and window decals hung in the air after the glass broke (and couldn't be read from inside).
     The first time a lot type is finished, every decor part that lies wholly on a door leaf (within 10 cm of its faces; 30 cm for a
     sliding leaf, which runs inside the wall line) or every painted part on a window pane is taken out of the merged decor (cached, so
     the condition copies are made without them too). Each instance then hangs those parts on its own door leaf (they swing / slide
     with it, and go when it is ripped off) or window pane (they go when it breaks; window signs are made double sided). */
  const _inv = new T.Matrix4(),
    _m = new T.Matrix4();
  function openingsOf(B) {
    B.g.updateMatrixWorld(true);
    _inv.copy(B.g.matrixWorld).invert();
    const out = [];
    for (const d of doors) {
      if (!d.p || d.p.parent !== B.g || d.roll) continue;
      const lf = d.lf || d.p.children.find(c => c.isMesh && c.userData && c.userData.kind === 'door');
      if (!lf) continue;
      lf.geometry.boundingBox || lf.geometry.computeBoundingBox();
      const m = new T.Matrix4().multiplyMatrices(_inv, lf.matrixWorld),
        b = lf.geometry.boundingBox.clone().applyMatrix4(m);
      if (d.slide && lf.parent === d.p) {
        // a sliding leaf runs inside the wall line: the opening reaches out to the wall face too
        const m0 = new T.Matrix4()
          .multiplyMatrices(_inv, d.p.matrixWorld)
          .multiply(new T.Matrix4().makeTranslation(lf.position.x, lf.position.y, 0));
        b.union(lf.geometry.boundingBox.clone().applyMatrix4(m0));
      }
      out.push({k: 'd', o: lf, m, b, n: 0.3, all: 1}); // signs, glazing and plates up to 30 cm off the leaf (thick shopfront skins)
    }
    // double doors: a fixed post between the two leaves stands in the open doorway (k 'x': dropped, only thin uprights)
    const seen = new Set();
    for (const a of out.slice()) {
      const d = a.o.userData && a.o.userData.d;
      if (!d || !d.pair || seen.has(d)) continue;
      const o2 = out.find(q => q.o.userData && q.o.userData.d === d.pair);
      if (!o2) continue;
      seen.add(d).add(d.pair);
      out.push({k: 'x', o: null, m: null, b: a.b.clone().union(o2.b), n: 0.3, all: 1});
    }
    for (const w of winList) {
      if (!w.m || w.g !== B.g || !w.alive) continue;
      w.m.geometry.boundingBox || w.m.geometry.computeBoundingBox();
      const m = new T.Matrix4().multiplyMatrices(_inv, w.m.matrixWorld),
        b = w.m.geometry.boundingBox.clone().applyMatrix4(m);
      out.push({k: 'w', o: w.m, m, b, n: 0.3, all: 0}); // lettering on the outer skin's glazing sits up to ~25 cm out
    }
    return out;
  }
  const _bb = new T.Box3();
  function onOpening(ib, op) {
    const b = op.b,
      ax = b.max.x - b.min.x < b.max.z - b.min.z ? 0 : 2, // the thin axis = the wall normal
      e = 0.02;
    if (ib.min.y < b.min.y + 0.03 - e || ib.max.y > b.max.y + e) return false;
    if (ax === 0) {
      if (ib.min.z < b.min.z - e || ib.max.z > b.max.z + e) return false;
      return ib.min.x > b.min.x - op.n && ib.max.x < b.max.x + op.n;
    }
    if (ib.min.x < b.min.x - e || ib.max.x > b.max.x + e) return false;
    return ib.min.z > b.min.z - op.n && ib.max.z < b.max.z + op.n;
  }
  const dbl = new Map();
  const twoSided = m => {
    if (m.side === T.DoubleSide) return m;
    let c = dbl.get(m);
    if (!c) {
      c = m.clone();
      c.side = T.DoubleSide;
      if (m.onBeforeCompile && m.onBeforeCompile !== T.Material.prototype.onBeforeCompile) {
        c.onBeforeCompile = m.onBeforeCompile;
        c.customProgramCacheKey = m.customProgramCacheKey;
      }
      dbl.set(m, c);
    }
    return c;
  };
  L.openStats = {};
  L.openings = function (B) {
    if (!B || !B.g || B.__opened) return;
    B.__opened = 1;
    // the lot's main merged decor (the one that kept its part list)
    let D = null,
      R = null;
    for (const c of B.g.children) {
      if (!c.userData || c.userData.kind !== 'bdecor' || !c.children.length) continue;
      const r = c.children[0].geometry && c.children[0].geometry.userData.mfzSrc;
      if (r && (r.items || r.__kept) && (!R || (r.items || []).length > (R.items || []).length)) ((R = r), (D = c));
    }
    if (!R) return;
    const ops = openingsOf(B);
    if (!R.__open) {
      const items = R.items;
      R.__open = [];
      if (!items || !ops.length) return;
      const keep = [];
      for (const it of items) {
        let hit = null;
        if (it.geo && it.mat) {
          _bb.copy(it.geo.boundingBox || (it.geo.computeBoundingBox(), it.geo.boundingBox)).applyMatrix4(it.m);
          for (const op of ops) {
            if (!op.all && !(it.mat.map && !(it.mat.transparent && it.mat.opacity < 0.7))) continue;
            if (op.k === 'x') {
              const bw =
                Math.min(_bb.max.x - _bb.min.x, _bb.max.z - _bb.min.z) < 0.4
                  ? Math.max(_bb.max.x - _bb.min.x, _bb.max.z - _bb.min.z)
                  : 9;
              if (bw < 0.16 && _bb.max.y - _bb.min.y > 1.4 && onOpening(_bb, op)) {
                hit = op;
                break;
              }
              continue;
            }
            if (onOpening(_bb, op)) {
              hit = op;
              break;
            }
          }
        }
        if (hit && hit.k === 'x') R.__drop = (R.__drop || 0) + 1;
        else if (hit) R.__open.push({it, k: hit.k, c: _bb.getCenter(new T.Vector3())});
        else keep.push(it);
      }
      if (!R.__open.length && !R.__drop) return;
      L.openStats[R.name] = R.__open
        .map(
          o =>
            o.k +
            '@' +
            o.c
              .toArray()
              .map(v => v.toFixed(1))
              .join(',')
        )
        .concat(R.__drop ? ['posts dropped: ' + R.__drop] : []);
      const M = K.merge(R.name, keep);
      M.items = keep;
      M.__open = [];
      for (const q of M.meshes) q.g.userData.mfzSrc = M;
      R.__kept = M;
    }
    if (!R.__kept) return;
    // swap this instance's decor for the copy without the door / window parts
    while (D.children.length) D.remove(D.children[0]);
    for (const q of R.__kept.meshes) {
      const m = new T.Mesh(q.g, q.mat);
      m.castShadow = !q.mat.transparent;
      m.receiveShadow = true;
      D.add(m);
    }
    for (const s of R.__open) {
      let op = null;
      for (const q of ops)
        if (
          !op &&
          q.k === s.k &&
          q.b
            .clone()
            .expandByScalar(q.n + 0.05)
            .containsPoint(s.c)
        )
          op = q;
      const mat = s.k === 'w' ? twoSided(s.it.mat) : s.it.mat,
        mesh = new T.Mesh(s.it.geo, mat);
      mesh.userData.sign = 1;
      mesh.receiveShadow = true;
      if (op) {
        _m.copy(op.m).invert().multiply(s.it.m);
        _m.decompose(mesh.position, mesh.quaternion, mesh.scale);
        op.o.add(mesh);
      } else {
        s.it.m.decompose(mesh.position, mesh.quaternion, mesh.scale);
        D.add(mesh);
      }
    }
  };
  // every NEWCAT lot builder runs it on the building it returns (before ruin(), so the condition copies and ripped-off doors agree)
  function wrapBuilds() {
    if (typeof NEWCAT === 'undefined') return;
    for (const t of NEWCAT) {
      if (!t.build || t.build.__open) continue;
      const f = t.build,
        w = function () {
          const B = f.apply(this, arguments);
          try {
            L.openings(B && B.g ? B : typeof LASTB !== 'undefined' ? LASTB : null);
          } catch (e) {
            console.warn('[lotkit] openings', t.id, e);
          }
          return B;
        };
      w.__open = 1;
      Object.defineProperty(w, 'name', {value: f.name});
      t.build = w;
    }
  }
  L.wrapBuilds = wrapBuilds;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wrapBuilds);
  else setTimeout(wrapBuilds, 0);
  window.addEventListener('load', wrapBuilds); // lots registered late

  /* v090: a real vehicle (vehicles.js / retro50 fleet) in lot coordinates. ry turns with the lot (front = +Z at 0). It goes into the
     world, not the lot group (MFZV.make adds its own collider and walkable top); its footprint is added to the occluders. A ruined lot
     gets a burnt-out wreck unless o.wreck says otherwise. */
  L.vehicle = function (B, kind, lx, lz, ry, o) {
    if (!window.MFZV) return null;
    o = Object.assign({}, o || {});
    if (o.wreck === undefined && typeof CUR !== 'undefined' && CUR && CUR.lv >= 2) o.wreck = 'burnt';
    let g = null;
    try {
      g = MFZV.make(kind, WX(B, lx), WZ(B, lz), (ry || 0) + (B.cs < 0 ? PI : 0), o);
    } catch (e) {
      console.warn('[lotkit] vehicle', kind, e);
      return null;
    }
    const h = g && g.userData && g.userData.half;
    if (h && B.occ) B.occ.push([lx - h[0], lx + h[0], lz - h[1], lz + h[1]]);
    if (g && o.y) g.position.y = o.y;
    return g;
  };

  /* v090: NO RANDOM CRATES IN THE AISLES. rc() drops a free-standing loot crate (up to 2.2 x 1 m) at a random clear spot of a room,
     and in a fitted-out lot that spot is a walkway, a doorway or the gap behind a counter (Burgerama's kitchen, MediKill's shop floor,
     Water Tower's back office, Beat The Meat's freezer...). In a lot with merged decor the same loot now goes into one of the lot's
     own containers in that room (or the nearest one in the building); only a lot with no container at all still gets a crate. */
  if (typeof rc === 'function') {
    const rc0 = rc;
    rc = function (B, t, r, n) {
      const lot = B && B.g && B.g.children.some(c => c.userData && c.userData.kind === 'bdecor');
      if (!lot || typeof rollLoot !== 'function') return rc0.apply(this, arguments);
      const a = [WX(B, r[0]), WZ(B, r[2])],
        c = [WX(B, r[1]), WZ(B, r[3])],
        x0 = Math.min(a[0], c[0]),
        x1 = Math.max(a[0], c[0]),
        z0 = Math.min(a[1], c[1]),
        z1 = Math.max(a[1], c[1]);
      const all = [];
      for (const o of scene.children) {
        const ct = o.userData && o.userData.kind === 'loot' && o.userData.cont;
        if (!ct || !ct.inv || ct.drop || ct.corpse) continue;
        const ox = o.position.x,
          oz = o.position.z;
        if (Math.abs(ox - B.x) > 20 || Math.abs(oz - B.z) > 18) continue; // this plot
        all.push({ct, ox, oz, inR: ox >= x0 - 0.5 && ox <= x1 + 0.5 && oz >= z0 - 0.5 && oz <= z1 + 0.5});
      }
      if (!all.length) return rc0.apply(this, arguments);
      const cx = (x0 + x1) / 2,
        cz = (z0 + z1) / 2;
      const inR = all.filter(q => q.inR),
        pool = inR.length
          ? inR
          : all.sort((p, q) => Math.hypot(p.ox - cx, p.oz - cz) - Math.hypot(q.ox - cx, q.oz - cz)).slice(0, 3);
      for (let i = 0; i < n; i++) {
        const q = pool[Math.floor(Math.random() * pool.length)];
        try {
          rollLoot(t, ri(1, 3)).forEach(id => {
            const it = newInst(id);
            if (typeof lootRoll === 'function') lootRoll(it);
            invAdd(q.ct.inv, it);
          });
          if (typeof refreshContainerVisual === 'function') refreshContainerVisual(q.ct);
        } catch (e) {}
      }
    };
  }

  /* ---------------- registration ---------------- */
  // o.id, o.name, o.note, o.build; o.ruinMax: cap ruin level (1 = never past light damage; default 1, null = no cap);
  // o.push: the extra NEWCAT fields when the id is new (pool, scope, category, loot, w, d...); o.globals: window names to export
  // Load order: a layer that REPLACES a newlots.js placeholder (diner, vet_clinic, auto_body_shop...) must load after newlots.js,
  // so this finds the placeholder's entry and keeps its pool / max / min / lots; newlots.js only adds ids that don't exist yet.
  L.register = function (o) {
    const cap = o.ruinMax === undefined ? 1 : o.ruinMax;
    if (cap !== null && typeof ruin === 'function') {
      const _r = ruin;
      ruin = function (x, z, t, lv) {
        if (t && t.id === o.id && lv > cap) {
          arguments[3] = cap;
        }
        return _r.apply(this, arguments);
      };
    }
    let e = NEWCAT.find(d => d.id === o.id);
    if (e) {
      e.name = o.name;
      e.build = o.build;
      if (o.note) e.note = o.note;
    } else if (o.push) {
      e = Object.assign(
        {
          id: o.id,
          name: o.name,
          pool: 'big',
          scope: 'big',
          category: 'commercial',
          front: 'south',
          builder: 'prop',
          build: o.build,
          note: o.note,
          variants:
            typeof nvar === 'function' ? nvar() : {intact: {props: []}, looted: {props: []}, ruined: {props: []}},
          legacy: false
        },
        o.push
      );
      NEWCAT.push(e);
      try {
        if (typeof LABCAT !== 'undefined' && !LABCAT.includes(e)) LABCAT.push(e); // dev toolkit lot list
      } catch (x) {}
    } else console.warn('[lotkit] no NEWCAT entry for ' + o.id + ' (pass push: {...} to add one)');
    if (typeof NOYARD !== 'undefined') NOYARD.add(o.id);
    Object.assign(window, o.globals || {});
    return e;
  };

  console.log('[lotkit] ready');
})();
