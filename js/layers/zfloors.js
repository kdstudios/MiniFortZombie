/* ==========================================================================================================
   MINI FORT ZOMBIE - FLOORS: MULTI-STOREY NAVIGATION (v081)
   Core's NAV is one flat 0.5 m grid of the ground: upper floors were invisible to the AI and every staircase was a block of wall.
   This layer adds the floors above it, found automatically from the collision boxes (no per-building setup):
   1. FLOOR NODES. Every box top (solids + walkables) is a possible surface, read the way groundAt reads it (0.3 m margin). A surface is a node if a body fits on it (nothing between 0.36 m and 1.75 m above it, padded
      0.32 m like the ground grid). Nodes 0.42 m or less apart in height link to their 8 neighbours, so stairs are just a run of
      nodes 0.3 m apart, and the floor at the top links on. Only nodes that connect back to the ground are kept (car roofs, table
      tops and roofs drop out). Ground cells keep their core index; floor nodes are numbered from NAV.w * NAV.h up.
   2. WINDOW DROPS. Every upstairs window gets a one-way link from the floor inside it to the ground (or a lower roof that links
      back) outside it. Zombies use any of them when it is quicker (smashing the glass first); a window the player has just
      jumped out of is nearly free for zombies and is the ONLY window followers will use.
   3. FLOW FIELD + SOFT COSTS over ground and floors together (navField / navSoft replaced; doors, windows and barricades upstairs
      now cost upstairs, not on the ground under them). zpath reads routes from it, A* runs on it (js/layers/zpath.js).
   4. THE DROP: climb onto the sill, out, fall. A fall from higher than NAVF.ragH ragdolls the zombie (zKnock) or the survivor
      (same Riposte ragdoll, rebuilt and stood back up), then they carry on. zclimb drops off anything that high ragdoll too.
   5. FOLLOWERS path on the same graph (core updComps asks NAVF.compWay for a waypoint), so they take the stairs, go round walls,
      and follow you out of the window you used.
   Hooks: buildNav (wrapped), navField / navSoft (replaced), stepVault + animZ + killZ + clearWorld (wrapped), updComps (wrapped:
   player trail), survFight (wrapped: survivor ragdolls run after the walk cycle). Turn off with NAVF.on=false before a world builds.
   Debug: navFloorsDebug(true) shows the floor nodes (colour = height) and the window drops in the world.
   ========================================================================================================== */
(function () {
  'use strict';
  if (typeof buildNav !== 'function' || typeof navField !== 'function' || typeof stepVault !== 'function') {
    console.warn('[zfloors] core hooks missing');
    return;
  }
  const NF = (window.NAVF = {
    on: true,
    ok: false,
    G0: 0,
    E: 0,
    step: 0.42, // highest step between two linked surfaces (the player's step-up is 0.35 + a little)
    clrLo: 0.36, // headroom band checked above a surface: from here...
    clrHi: 1.75, // ...to here
    R: 0.32, // body padding, same as the ground grid
    margin: 0.3, // groundAt's margin round a box top
    minTop: 0.25, // box tops below this are ground (kerbs, pavements)
    ragH: 2.2, // falls higher than this ragdoll (a ground-floor window sill is ~0.9 m)
    plDropT: 60, // seconds a window the player jumped out of stays "the way they went"
    stats: {nodes: 0, cand: 0, links: 0, drops: 0, ms: 0, zdrops: 0, cdrops: 0, rags: 0}
  });
  const hyp = Math.hypot,
    now = () => performance.now() / 1000;
  const DX = [1, -1, 0, 0, 1, 1, -1, -1],
    DZ = [0, 0, 1, -1, 1, -1, 1, -1];
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v),
    ease = t => t * t * (3 - 2 * t);
  const feetOf = () => pl.position.y - (G.eyeUsed || 1.6);

  /* ---------------- node helpers (ground node = core cell index; floor node k = G0 + k) ---------------- */
  NF.isE = id => id >= NF.G0;
  NF.cell = id => (id >= NF.G0 ? NF.ec[id - NF.G0] : id);
  NF.x = id => NAV.x0 + ((NF.cell(id) % NAV.w) + 0.5) * NAV.cs;
  NF.z = id => NAV.z0 + (((NF.cell(id) / NAV.w) | 0) + 0.5) * NAV.cs;
  NF.y = id => (id >= NF.G0 ? NF.ey[id - NF.G0] : NF.low[id]);
  NF.total = () => NF.G0 + NF.E;
  function cellAt(x, z) {
    const N = NAV,
      ix = Math.floor((x - N.x0) / N.cs),
      iz = Math.floor((z - N.z0) / N.cs);
    return ix < 0 || iz < 0 || ix >= N.w || iz >= N.h ? -1 : iz * N.w + ix;
  }
  NF.cellAt = cellAt;
  /* the node a body standing at (x, y, z) is on: the ground cell or a floor node, whichever surface is nearest its feet */
  NF.nodeAt = function (x, z, y, tol) {
    if (!NF.ok) return -1;
    const c = cellAt(x, z);
    if (c < 0) return -1;
    let best = -1,
      bd = tol === undefined ? 0.7 : tol;
    if (!NAV.wall[c]) {
      const d = Math.abs(NF.low[c] - y);
      if (d <= bd) {
        bd = d;
        best = c;
      }
    }
    for (let k = NF.eHead[c]; k >= 0; k = NF.eNext[k]) {
      const d = Math.abs(NF.ey[k] - y);
      if (d <= bd) {
        bd = d;
        best = NF.G0 + k;
      }
    }
    return best;
  };
  /* nearest node within r cells at about this height (needField: only nodes the flow field reached) */
  NF.nearNode = function (x, z, y, needField, rMax) {
    if (!NF.ok) return -1;
    const N = NAV,
      ix = Math.floor((x - N.x0) / N.cs),
      iz = Math.floor((z - N.z0) / N.cs),
      D = N.dist;
    let best = -1,
      bd = 1e9;
    const R = rMax || 4,
      inside = !!blocked(x, z, 0.2, y + 0.31, 1.3); // starting inside something (furniture): don't ask for a clear line out of it
    for (let r = 0; r <= R && best < 0; r++)
      for (let dz = -r; dz <= r; dz++)
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
          const jx = ix + dx,
            jz = iz + dz;
          if (jx < 0 || jz < 0 || jx >= N.w || jz >= N.h) continue;
          const c = jz * N.w + jx,
            cxx = N.x0 + (jx + 0.5) * N.cs,
            czz = N.z0 + (jz + 0.5) * N.cs,
            d = hyp(cxx - x, czz - z);
          const test = id => {
            if (needField && !(D[id] < 1e8)) return;
            if (Math.abs(NF.y(id) - y) > 0.75 || d >= bd) return;
            if (d > 0.35 && !inside && lineHit(x, z, cxx, czz, y)) return;
            bd = d;
            best = id;
          };
          if (!N.wall[c]) test(c);
          for (let k = NF.eHead[c]; k >= 0; k = NF.eNext[k]) test(NF.G0 + k);
        }
    return best;
  };
  function lineHit(ax, az, bx, bz, y) {
    const dx = bx - ax,
      dz = bz - az,
      n = Math.max(1, Math.ceil(hyp(dx, dz) / 0.3));
    for (let k = 1; k <= n; k++) if (blocked(ax + (dx * k) / n, az + (dz * k) / n, 0.26, y + 0.31, 1.4)) return true;
    return false;
  }
  /* straight walk on the graph: every sample (and two lines ZPATH.clr either side) has a node at the interpolated height */
  NF.lineOk = function (ax, az, ay, bx, bz, by, clr, softEnd) {
    const dx = bx - ax,
      dz = bz - az,
      L = hyp(dx, dz);
    if (Math.abs(by - ay) > L * 0.75 + 0.45) return false; // steeper than any stair: a different floor, not a straight walk
    if (L < 1e-3) return true;
    const cw = clr, // (same width as the ground test: one-cell doorways must pass)
      tol = 0.3, // tight in height: across a stair's treads the surfaces don't match the line's height
      n = Math.ceil(L / 0.22),
      px = (-dz / L) * cw,
      pz = (dx / L) * cw,
      S = NAV.softObj,
      eId = softEnd ? NF.nodeAt(bx, bz, by, 0.45) : -1,
      eSoft = eId >= 0 ? S[eId] : null;
    let last = NF.nodeAt(ax, az, ay, 0.45);
    for (let k = 1; k <= n; k++) {
      const t = k / n,
        x = ax + dx * t,
        z = az + dz * t,
        y = ay + (by - ay) * t,
        id = NF.nodeAt(x, z, y, tol);
      if (id < 0) return false;
      if (last >= 0 && Math.abs(NF.y(id) - NF.y(last)) > NF.step + 0.02) return false; // no jumping a ledge between samples
      last = id;
      if (S[id] && !(softEnd && (k === n || S[id] === eSoft))) return false; // any cell of the door / window the line ends at
      if (t < 0.97 && (NF.nodeAt(x + px, z + pz, y, tol) < 0 || NF.nodeAt(x - px, z - pz, y, tol) < 0)) return false;
    }
    return true;
  };

  /* forward neighbours (the way a body walks): cb(node, base cost, dropLink) */
  NF.fwd = function (id, cb) {
    const N = NAV,
      w = N.w,
      W = N.wall,
      cs = N.cs;
    if (id < NF.G0) {
      const ix = id % w,
        iz = (id / w) | 0;
      for (let k = 0; k < 8; k++) {
        const nx = ix + DX[k],
          nz = iz + DZ[k];
        if (nx < 0 || nz < 0 || nx >= w || nz >= N.h) continue;
        const m = nz * w + nx;
        if (W[m]) continue;
        if (k > 3 && (W[iz * w + nx] || W[nz * w + ix])) continue;
        cb(m, k > 3 ? 1.414 * cs : cs, null);
      }
      if (NF.lf[id]) {
        const a = NF.gl.get(id);
        if (a) for (let j = 0; j < a.length; j += 2) cb(a[j], a[j + 1], null);
      }
      return;
    }
    const k = id - NF.G0;
    for (let j = NF.ao[k]; j < NF.ao[k + 1]; j++) cb(NF.at[j], NF.ac[j], null);
    const ds = NF.dOut.get(id);
    if (ds) for (const L of ds) cb(L.to, L.cost, L);
  };
  /* reverse neighbours (for the field, which grows from the target outward): cb(node, cost, dropLink) */
  function rev(id, cb) {
    if (id < NF.G0) {
      if (NF.lf[id]) {
        const a = NF.gl.get(id);
        if (a) for (let j = 0; j < a.length; j += 2) cb(a[j], a[j + 1], null);
        const ds = NF.dIn.get(id);
        if (ds) for (const L of ds) cb(L.from, L.cost, L);
      }
      return; // the 8 ground neighbours are walked inline by navField (hot loop)
    }
    const k = id - NF.G0;
    for (let j = NF.ao[k]; j < NF.ao[k + 1]; j++) cb(NF.at[j], NF.ac[j], null);
    const ds = NF.dIn.get(id);
    if (ds) for (const L of ds) cb(L.from, L.cost, L);
  }

  /* exact remaining cost to a floor node, over its own floor (+ the ground cells at the foot of its stairs, where it stops): A*'s tail
     and its estimate (zpath). Without it A* to someone upstairs floods the town (the straight-line estimate can't see the stairs).
     Same step costs as zpath's A*: entering a node costs its soft cost + near-wall cost. Cached a second per target and profile. */
  const remCache = new Map();
  NF.remFor = function (e, comp) {
    const key = comp ? -1 - e : e,
      t = now(),
      c0 = remCache.get(key);
    if (c0 && t - c0.t < 1.0) return c0;
    const N = NAV,
      X = N.extra,
      NR = N.near,
      S = N.softObj,
      G0 = NF.G0,
      D = new Map([[e, 0]]),
      hd = [0],
      hi = [e];
    const push = (d, i) => {
      let k = hd.length;
      hd.push(d);
      hi.push(i);
      while (k > 0) {
        const q = (k - 1) >> 1;
        if (hd[q] <= d) break;
        hd[k] = hd[q];
        hi[k] = hi[q];
        k = q;
      }
      hd[k] = d;
      hi[k] = i;
    };
    const pop = () => {
      const d = hd[0],
        i = hi[0],
        ld = hd.pop(),
        li = hi.pop(),
        n = hd.length;
      if (n) {
        let k = 0;
        for (;;) {
          let c = 2 * k + 1;
          if (c >= n) break;
          if (c + 1 < n && hd[c + 1] < hd[c]) c++;
          if (hd[c] >= ld) break;
          hd[k] = hd[c];
          hi[k] = hi[c];
          k = c;
        }
        hd[k] = ld;
        hi[k] = li;
      }
      return [d, i];
    };
    const xOf = i => {
      if (!comp) return X[i] + NR[i];
      const so = S[i];
      return so ? (so.t === 'door' ? 0.6 + NR[i] : Infinity) : NR[i];
    };
    let it = 0;
    while (hd.length && it++ < 30000) {
      const [d, i] = pop();
      if (d > D.get(i)) continue;
      if (i < G0) continue; // a stair foot on the ground: an entry, the search stays on the floors
      const xi = xOf(i);
      if (!isFinite(xi) && i !== e) continue;
      const xs = i === e ? 0 : xi;
      rev(i, (m, c, L) => {
        if (L && comp) {
          if (!NF.playerUsed(L)) return;
          c = 0.2;
        }
        const nd = d + c + xs;
        const o = D.get(m);
        if (o === undefined || nd < o) {
          D.set(m, nd);
          push(nd, m);
        }
      });
    }
    // estimate for nodes off this floor: via the nearest stair foot (grouped per 3 m)
    const cg = new Map();
    for (const [i, r] of D) {
      if (i >= G0) continue;
      const x = NF.x(i),
        z = NF.z(i),
        k = Math.floor(x / 3) + ',' + Math.floor(z / 3);
      let g = cg.get(k);
      if (!g) cg.set(k, (g = {pts: [], rem: 1e9}));
      g.pts.push(x, z);
      if (r < g.rem) g.rem = r;
    }
    const cl = [];
    for (const g of cg.values()) {
      let sx = 0,
        sz = 0;
      const n = g.pts.length / 2;
      for (let j = 0; j < g.pts.length; j += 2) {
        sx += g.pts[j];
        sz += g.pts[j + 1];
      }
      sx /= n;
      sz /= n;
      let r = 0;
      for (let j = 0; j < g.pts.length; j += 2) r = Math.max(r, hyp(g.pts[j] - sx, g.pts[j + 1] - sz));
      cl.push(sx, sz, r, g.rem);
    }
    const R = {t, D, cl};
    if (remCache.size > 24) remCache.clear();
    remCache.set(key, R);
    return R;
  };

  /* ---------------- 1. build the floors (after core's buildNav) ---------------- */
  function buildFloors() {
    const t0 = performance.now(),
      N = NAV,
      w = N.w,
      h = N.h,
      cs = N.cs,
      G0 = w * h,
      W = N.wall;
    NF.ok = false;
    NF.G0 = G0;
    NF.E = 0;
    remCache.clear();
    NF.drops = [];
    NF.dOut = new Map();
    NF.dIn = new Map();
    NF.gl = new Map();
    NF.lf = new Uint8Array(G0);
    NF.trail = null;
    if (!NF.on) return;
    const low = (NF.low = new Float32Array(G0)),
      M = NF.margin;
    const softBox = q => (q.door && !q.leaf) || q.bar || q.win;
    // 1a. candidate surfaces: key = cell * 2048 + round(y * 40)
    let keys = new Float64Array(1 << 16),
      nk = 0;
    const pushKey = v => {
      if (nk >= keys.length) {
        const k2 = new Float64Array(keys.length * 2);
        k2.set(keys);
        keys = k2;
      }
      keys[nk++] = v;
    };
    const tops = q => {
      if (!q || softBox(q)) return;
      const top = q.max.y;
      if (!(top > -1) || top > 48) return;
      if (top < NF.minTop) {
        if (top > 0)
          navRect(q.min.x - M, q.max.x + M, q.min.z - M, q.max.z + M, c => {
            if (top > low[c]) low[c] = top;
          });
        return;
      }
      const sx = q.max.x - q.min.x,
        sz = q.max.z - q.min.z;
      if (q.max.y - q.min.y > 1.2 && Math.min(sx, sz) < 0.36) return; // wall and post tops (<= 0.3 m thick): never a floor; stair columns (0.4 m+ runs) stay
      const qy = Math.round(top * 40);
      navRect(q.min.x - M, q.max.x + M, q.min.z - M, q.max.z + M, c => pushKey(c * 2048 + qy));
    };
    for (const q of solids) tops(q);
    for (const q of walkables) tops(q);
    NF.stats.cand = nk;
    const ks = keys.subarray(0, nk).slice().sort();
    // 1b. obstacles per candidate cell (only cells that have a candidate)
    const candCell = new Uint8Array(G0);
    for (let i = 0; i < nk; i++) candCell[Math.floor(ks[i] / 2048)] = 1;
    const obs = new Map(),
      R = NF.R;
    for (const q of solids) {
      if (!q || softBox(q)) continue;
      navRect(q.min.x - R, q.max.x + R, q.min.z - R, q.max.z + R, c => {
        if (!candCell[c]) return;
        let a = obs.get(c);
        if (!a) obs.set(c, (a = []));
        a.push(q.min.y, q.max.y);
      });
    }
    const clear = (c, y) => {
      const a = obs.get(c);
      if (!a) return true;
      const lo = y + NF.clrLo,
        hi = y + NF.clrHi;
      for (let j = 0; j < a.length; j += 2) if (a[j] < hi && a[j + 1] > lo) return false;
      return true;
    };
    // 1c. each cell's distinct tops (within 0.12 m = one surface) are its surfaces; keep the clear ones. Steps stay separate: with
    //     treads shorter than a cell, keeping only the highest made neighbouring cells two steps apart and broke the stair
    const ec0 = [],
      ey0 = [];
    for (let i = 0; i < nk; ) {
      const c = Math.floor(ks[i] / 2048);
      let j = i;
      while (j < nk && Math.floor(ks[j] / 2048) === c) j++;
      let top = -1;
      for (let k = i; k < j; k++) {
        const y = (ks[k] - c * 2048) / 40;
        if (top >= 0 && y - top > 0.12) {
          if (clear(c, top)) {
            ec0.push(c);
            ey0.push(top);
          }
        }
        top = y; // ascending: near-equal tops (one surface, e.g. a slab beside a wall top) end on the highest
      }
      if (top >= 0 && clear(c, top)) {
        ec0.push(c);
        ey0.push(top);
      }
      i = j;
    }
    const E0 = ec0.length,
      head0 = new Int32Array(G0).fill(-1),
      next0 = new Int32Array(E0);
    for (let k = E0 - 1; k >= 0; k--) {
      next0[k] = head0[ec0[k]];
      head0[ec0[k]] = k;
    }
    const step = NF.step;
    const eAt = (c, y) => {
      let b = -1,
        bd = step + 1e-3;
      for (let k = head0[c]; k >= 0; k = next0[k]) {
        const d = Math.abs(ey0[k] - y);
        if (d <= bd) {
          bd = d;
          b = k;
        }
      }
      return b;
    };
    const gOk = (c, y) => !W[c] && Math.abs(low[c] - y) <= step;
    const anyAt = (c, y) => gOk(c, y) || eAt(c, y) >= 0;
    // neighbours of a candidate: cb(kind 0 ground / 1 floor, index, cost)
    const nbs = (k, cb) => {
      const c = ec0[k],
        y = ey0[k],
        ix = c % w,
        iz = (c / w) | 0;
      for (let d = 0; d < 8; d++) {
        const nx = ix + DX[d],
          nz = iz + DZ[d];
        if (nx < 0 || nz < 0 || nx >= w || nz >= h) continue;
        const m = nz * w + nx;
        if (d > 3 && !(anyAt(iz * w + nx, y) && anyAt(nz * w + ix, y))) continue;
        const base = d > 3 ? 1.414 * cs : cs;
        // every surface within a step (a stair cell can hold two or three step tops)
        for (let e = head0[m]; e >= 0; e = next0[e]) {
          const dy = Math.abs(ey0[e] - y);
          if (dy <= step) cb(1, e, base + dy * 0.6);
        }
        if (gOk(m, y)) cb(0, m, base + Math.abs(low[m] - y) * 0.6);
      }
    };
    // 1d. keep only what connects to the ground (flood fill from the floor nodes that touch it)
    const keep = new Uint8Array(E0),
      Q = [];
    for (let k = 0; k < E0; k++) {
      let g = false;
      nbs(k, kind => {
        if (kind === 0) g = true;
      });
      if (g) {
        keep[k] = 1;
        Q.push(k);
      }
    }
    for (let qi = 0; qi < Q.length; qi++)
      nbs(Q[qi], (kind, e) => {
        if (kind === 1 && !keep[e]) {
          keep[e] = 1;
          Q.push(e);
        }
      });
    // 1e. compact
    const remap = new Int32Array(E0).fill(-1);
    let E = 0;
    for (let k = 0; k < E0; k++) if (keep[k]) remap[k] = E++;
    const ec = (NF.ec = new Int32Array(E)),
      ey = (NF.ey = new Float32Array(E));
    for (let k = 0; k < E0; k++)
      if (keep[k]) {
        ec[remap[k]] = ec0[k];
        ey[remap[k]] = ey0[k];
      }
    const eHead = (NF.eHead = new Int32Array(G0).fill(-1)),
      eNext = (NF.eNext = new Int32Array(E));
    for (let k = E - 1; k >= 0; k--) {
      eNext[k] = eHead[ec[k]];
      eHead[ec[k]] = k;
    }
    NF.E = E;
    // 1f. edges (CSR for floor nodes, a sparse list for ground cells that touch a floor node)
    const ao = (NF.ao = new Int32Array(E + 1)),
      at = [],
      ac = [];
    for (let k0 = 0; k0 < E0; k0++) {
      if (!keep[k0]) continue;
      const k = remap[k0];
      ao[k] = at.length;
      nbs(k0, (kind, i, cost) => {
        if (kind === 1) {
          if (remap[i] < 0) return;
          at.push(G0 + remap[i]);
          ac.push(cost);
        } else {
          at.push(i);
          ac.push(cost);
          let a = NF.gl.get(i);
          if (!a) NF.gl.set(i, (a = []));
          a.push(G0 + k, cost);
          NF.lf[i] = 1;
        }
      });
    }
    // CSR rows must be in node order: rebuild in order (remap preserves order, so ao is already monotone)
    ao[E] = at.length;
    NF.at = Int32Array.from(at);
    NF.ac = Float32Array.from(ac);
    NF.stats.links = at.length;
    // 1g. arrays core and zpath index by node: grow them to ground + floors
    const T = G0 + E;
    const grow = (a, Ctor) => {
      const b = new Ctor(T);
      b.set(a.subarray ? a.subarray(0, Math.min(a.length, G0)) : a.slice(0, G0));
      return b;
    };
    N.dist = new Float64Array(T).fill(1e9);
    N.extra = grow(N.extra, Float32Array);
    const so = new Array(T).fill(null);
    N.softObj = so;
    N.sl = [];
    const nr = grow(N.near, Float32Array);
    for (let k = 0; k < E; k++) {
      // keep off floor edges and walls upstairs like core keeps off walls downstairs
      const c = ec[k],
        y = ey[k],
        ix = c % w,
        iz = (c / w) | 0;
      let miss = 0;
      for (let d = 0; d < 8; d++) {
        const nx = ix + DX[d],
          nz = iz + DZ[d];
        if (nx < 0 || nz < 0 || nx >= w || nz >= h) {
          miss++;
          continue;
        }
        const m = nz * w + nx;
        let f = gOk(m, y);
        for (let j = eHead[m]; !f && j >= 0; j = eNext[j]) if (Math.abs(ey[j] - y) <= step) f = true;
        if (!f) miss++;
      }
      nr[G0 + k] = miss ? 1.2 : 0;
    }
    N.near = nr;
    NF.ok = true;
    // 2. window drops
    buildDrops();
    NF.stats.nodes = E;
    NF.stats.ms = Math.round(performance.now() - t0);
    if (NF.dbg) debugDraw();
  }
  function buildDrops() {
    NF.drops = [];
    NF.dOut = new Map();
    NF.dIn = new Map();
    for (const wn of winList) {
      if (!wn || wn.pseudo || !(wn.p.y > 2.5)) continue;
      const fy = wn.p.y - 1.8,
        nx = wn.ax ? 0 : 1,
        nz = wn.ax ? 1 : 0,
        px = wn.p.x,
        pz = wn.p.z;
      for (const s of [1, -1]) {
        let from = -1;
        for (const t of [0.55, 0.8, 1.05, 1.3, 1.6]) {
          const id = NF.nodeAt(px + nx * s * t, pz + nz * s * t, fy, 0.45);
          if (id >= NF.G0) {
            from = id;
            break;
          }
        }
        if (from < 0) continue;
        // the other side must be a drop, not more floor
        if (NF.nodeAt(px - nx * s * 0.8, pz - nz * s * 0.8, fy, 0.6) >= 0) continue;
        let to = -1,
          ly = 0,
          lx = 0,
          lz = 0;
        for (const t of [1.0, 1.35, 1.7, 2.1, 2.5]) {
          const x = px - nx * s * t,
            z = pz - nz * s * t,
            gy = groundAt(x, z, fy - 0.7);
          if (gy > fy - 1.0) continue;
          const id = NF.nodeAt(x, z, gy, 0.45);
          if (id >= 0) {
            to = id;
            ly = NF.y(id);
            lx = NF.x(id);
            lz = NF.z(id);
            break;
          }
        }
        if (to < 0) break;
        const L = {
          k: NF.drops.length,
          from,
          to,
          w: wn,
          fy,
          h: fy + 0.95 - ly,
          wx: px,
          wz: pz,
          nx: -nx * s, // outward
          nz: -nz * s,
          lx,
          ly,
          lz,
          pt: -1e9,
          cost: 0
        };
        dropCost(L);
        NF.drops.push(L);
        if (!NF.dOut.has(from)) NF.dOut.set(from, []);
        NF.dOut.get(from).push(L);
        if (!NF.dIn.has(to)) NF.dIn.set(to, []);
        NF.dIn.get(to).push(L);
        if (to < NF.G0) NF.lf[to] = 1;
        break;
      }
    }
    NF.stats.drops = NF.drops.length;
  }
  /* zombie cost of a drop: walking-distance equivalent. Brainless: a window is fine if it is quicker; glass costs the smash.
     The window the player just jumped out of is nearly free: they follow you. */
  function dropCost(L) {
    const recent = now() - L.pt < NF.plDropT;
    L.cost = recent ? 0.3 : 1.5 + L.h * 0.25 + (L.w.alive ? 4 : 0);
    return L.cost;
  }
  NF.playerUsed = L => now() - L.pt < NF.plDropT;

  const _bn = buildNav;
  buildNav = function () {
    const r = _bn.apply(this, arguments);
    try {
      buildFloors();
    } catch (e) {
      NF.ok = false;
      console.warn('[zfloors] build failed', e);
    }
    return r;
  };

  /* ---------------- 3. soft costs and the flow field over ground + floors ---------------- */
  const _ns0 = navSoft;
  navSoft = function () {
    const N = NAV;
    if (!NF.ok) return _ns0.apply(this, arguments);
    for (const i of N.sl) {
      N.extra[i] = 0;
      N.softObj[i] = null;
    }
    N.sl = [];
    const add = (x0, x1, z0, z1, ylo, cost, o) =>
      navRect(x0, x1, z0, z1, c => {
        if (ylo < 1.5 && !N.wall[c]) {
          N.extra[c] += cost;
          N.softObj[c] = o;
          N.sl.push(c);
        }
        for (let k = NF.eHead[c]; k >= 0; k = NF.eNext[k])
          if (Math.abs(NF.ey[k] - ylo) < 0.6) {
            const id = NF.G0 + k;
            N.extra[id] += cost;
            N.softObj[id] = o;
            N.sl.push(id);
          }
      });
    for (const d of doors) {
      if (d.open || !d.sol) continue;
      const q = d.sol,
        a = q.max.x - q.min.x > q.max.z - q.min.z;
      add(
        q.min.x - (a ? 0 : 0.3),
        q.max.x + (a ? 0 : 0.3),
        q.min.z - (a ? 0.3 : 0),
        q.max.z + (a ? 0.3 : 0),
        q.min.y + 0.08,
        6,
        {t: 'door', o: d}
      );
    }
    for (const w of winList) {
      if (w.pseudo || w.p.y > 2.5) continue; // upstairs windows are drop links, not doorways
      const a = w.ax;
      add(
        w.p.x - (a ? 0.45 : 0.6),
        w.p.x + (a ? 0.45 : 0.6),
        w.p.z - (a ? 0.6 : 0.45),
        w.p.z + (a ? 0.6 : 0.45),
        w.p.y - 1.8,
        w.alive ? 7 : 1.5,
        {t: 'win', o: w}
      );
    }
    for (const b of G.bars)
      for (const bx of b.boxes || [b.box])
        add(bx.min.x - 0.32, bx.max.x + 0.32, bx.min.z - 0.32, bx.max.z + 0.32, bx.min.y, 4 + b.hp * 0.08, {
          t: 'bar',
          o: b
        });
    for (const L of NF.drops) dropCost(L);
    NF.softT = now();
  };

  const _nf0 = navField;
  navField = function (horde) {
    const N = NAV;
    if (!N.ok) return;
    if (!NF.ok) return _nf0.apply(this, arguments);
    const act = zombies.filter(z => horde || z.userData.see || z.userData.hunt > 0);
    if (!act.length) return;
    navSoft();
    const w = N.w,
      h = N.h,
      D = N.dist,
      W = N.wall,
      X = N.extra,
      NR = N.near,
      cs = N.cs,
      G0 = NF.G0,
      LF = NF.lf;
    D.fill(1e9);
    HD.length = 0;
    HI.length = 0;
    const nodeOr = (x, z, y) => {
      let id = NF.nodeAt(x, z, y, 0.9);
      if (id < 0) id = NF.nearNode(x, z, y, false, 3); // by a wall or furniture: the nearest node on THIS floor, never the cell below
      if (id >= 0) return id;
      return (
        Math.max(0, Math.min(h - 1, Math.floor((z - N.z0) / cs))) * w +
        Math.max(0, Math.min(w - 1, Math.floor((x - N.x0) / cs)))
      );
    };
    const seed = (x, z, y) => {
      const i = nodeOr(x, z, y);
      if (D[i] > 0) {
        D[i] = 0;
        hPush(0, i);
      }
    };
    seed(pl.position.x, pl.position.z, feetOf());
    smesh.forEach(m => {
      if (m.userData.s && m.userData.s.hp > 0) seed(m.position.x, m.position.z, m.position.y);
    });
    const need = new Set();
    act.forEach(z => need.add(nodeOr(z.position.x, z.position.z, z.position.y)));
    const maxD = horde ? 1e9 : 90;
    let d = 0,
      i = 0;
    const relax = (n, c) => {
      const nd = d + c + X[n] + NR[n];
      if (nd < D[n]) {
        D[n] = nd;
        hPush(nd, n);
      }
    };
    while (HD.length) {
      hPop();
      d = hD;
      i = hI;
      if (d > D[i]) continue;
      if (d > maxD || (need.delete(i) && !need.size)) break;
      if (i < G0) {
        const ix = i % w,
          iz = (i / w) | 0;
        for (let k = 0; k < 8; k++) {
          const nx = ix + DX[k],
            nz = iz + DZ[k];
          if (nx < 0 || nz < 0 || nx >= w || nz >= h) continue;
          const n = nz * w + nx;
          if (W[n]) continue;
          if (k > 3 && (W[iz * w + nx] || W[nz * w + ix])) continue;
          const nd = d + (k > 3 ? 1.414 * cs : cs) + X[n] + NR[n];
          if (nd < D[n]) {
            D[n] = nd;
            hPush(nd, n);
          }
        }
        if (LF[i]) rev(i, relax);
      } else rev(i, relax);
    }
  };

  /* ---------------- 4. the drop: onto the sill, out, fall; high falls ragdoll ---------------- */
  NF.startDrop = function (o, u, L) {
    const p = o.position;
    u.wd = {L, t: 0, ph: 0, sx: p.x, sz: p.z, sy: p.y};
    u.vs = [p.x, p.z];
    u.atk = null;
    if (u.zp) u.zp.pts = null;
    try {
      o.lookAt(p.x + L.nx, p.y, p.z + L.nz);
    } catch (e) {}
    if (zombies.includes(o)) NF.stats.zdrops++;
    else NF.stats.cdrops++;
  };
  function stepDrop(o, u, dt) {
    const D = u.wd,
      L = D.L,
      p = o.position,
      sill = L.fy + 0.95;
    D.t += dt;
    if (D.ph === 0) {
      // up onto the sill
      const T = 0.45,
        k = clamp(D.t / T, 0, 1),
        ex = L.wx - L.nx * 0.1,
        ez = L.wz - L.nz * 0.1;
      p.x = D.sx + (ex - D.sx) * ease(k);
      p.z = D.sz + (ez - D.sz) * ease(k);
      p.y = D.sy + (sill - D.sy) * ease(k);
      if (k >= 1) {
        D.ph = 1;
        D.t = 0;
      }
    } else if (D.ph === 1) {
      // out through the frame
      const T = 0.25,
        k = clamp(D.t / T, 0, 1),
        sx = L.wx - L.nx * 0.1,
        sz = L.wz - L.nz * 0.1;
      p.x = sx + L.nx * 0.55 * k;
      p.z = sz + L.nz * 0.55 * k;
      p.y = sill + Math.sin(k * Math.PI) * 0.12;
      if (k >= 1) {
        D.ph = 2;
        D.t = 0;
        D.fx = p.x;
        D.fz = p.z;
        D.T = Math.max(0.25, Math.sqrt((2 * Math.max(0.1, sill - L.ly)) / 9.8));
      }
    } else {
      const k = clamp(D.t / D.T, 0, 1);
      p.x = D.fx + (L.lx - D.fx) * Math.min(1, k * 1.4);
      p.z = D.fz + (L.lz - D.fz) * Math.min(1, k * 1.4);
      p.y = sill + (L.ly - sill) * k * k;
      if (k >= 1) land(o, u, L.h, {x: L.nx, z: L.nz});
    }
  }
  function land(o, u, h, dir) {
    const p = o.position;
    u.wd = null;
    u.vs = null;
    u.vt = 0;
    p.y = groundAt(p.x, p.z, p.y + 0.3);
    if (u.zp) u.zp.pts = null;
    if (u.np) u.np.pts = null;
    if (h > NF.ragH) {
      NF.stats.rags++;
      if (zombies.includes(o)) {
        if (window.zKnock && zKnock(o, dir, 1.6 + h * 0.3, 0.25, 'body')) return;
      } else if (u.m === o) {
        if (compKnock(u, dir, 1.6 + h * 0.3)) return;
      }
    }
    u.landT = 0.28;
  }

  const _sv = stepVault;
  stepVault = function (o, u, dt) {
    if (u && u.wd) return stepDrop(o, u, dt);
    if (u && u.ck) return; // a survivor down after a fall: the ragdoll runs after survFight
    // zclimb dropping off something high: ragdoll on landing too
    const c = u && u.clb,
      fall = c && c.ph === 2 ? c.top - c.ly : 0,
      fdx = c ? c.lx - c.sx : 0,
      fdz = c ? c.lz - c.sz : 0;
    const r = _sv.apply(this, arguments);
    if (fall > NF.ragH && u && !u.clb && !u.vs && zombies.includes(o) && window.zKnock) {
      NF.stats.rags++;
      u.landT = 0;
      zKnock(o, {x: fdx || 0.01, z: fdz}, 1.6 + fall * 0.3, 0.2, 'body');
    }
    return r;
  };

  /* drop pose for zombies: arms thrown up, legs bracing (the landing crouch is zclimb's landT) */
  const _an = animZ;
  animZ = function (z, dt, horde) {
    _an.apply(this, arguments);
    const u = z.userData,
      P = u && u.parts;
    if (!u || !u.wd || !P || !z.visible) return;
    const set = (o, x, zr) => {
      if (!o) return;
      o.rotation.x = x;
      if (zr !== undefined) o.rotation.z = zr;
    };
    const D = u.wd,
      s = Math.sin(performance.now() / 90);
    if (D.ph === 0) {
      set(P.armL, -2.6 + s * 0.3, 0.15);
      set(P.armR, -2.6 - s * 0.3, -0.15);
      set(P.legL, -1.0, 0.05);
      set(P.legR, -0.3, -0.05);
      if (P.body) P.body.rotation.x = 0.35;
    } else {
      set(P.armL, -2.3 - s * 0.25, 0.5);
      set(P.armR, -2.3 + s * 0.25, -0.5);
      set(P.legL, -0.5, 0.12);
      set(P.legR, -0.25, -0.12);
      if (P.body) P.body.rotation.x = 0.3;
    }
  };

  /* ---------------- 4b. survivor ragdoll after a high fall (same Riposte ragdoll as zKnock, stood back up) ---------------- */
  const PARTS = ['body', 'head', 'armL', 'armR', 'elL', 'elR', 'legL', 'legR'];
  function compKnock(c, dir, mag) {
    const RG = window.RGRAG,
      m = c.m,
      P = c.P || (m.userData && m.userData.P);
    if (!RG || !RG.on || !RG.start || !P || !P.body) return false;
    try {
      const rest = {};
      for (const k of PARTS) {
        const o = P[k];
        if (o) rest[k] = {p: o.position.clone(), q: o.quaternion.clone(), par: o.parent};
      }
      const kids = new Set(m.children),
        yaw = m.rotation.y;
      const R = RG.start(m, P, {dir: new THREE.Vector3(dir.x, 0, dir.z), mag, lift: 0.25, part: 'body'}, null, yaw);
      c.ck = {ph: 'down', t: 0, R, rest, kids, yaw, y0: m.position.y};
      c.vs = [m.position.x, m.position.z];
      return true;
    } catch (e) {
      console.warn('[zfloors] survivor ragdoll', e);
      c.ck = null;
      c.vs = null;
      return false;
    }
  }
  function compRebuild(c) {
    const K = c.ck,
      m = c.m,
      P = c.P || m.userData.P,
      RG = window.RGRAG,
      R = K.R,
      p = R.p;
    const pel = p[0],
      che = p[1],
      head = p[2],
      fl = p[11],
      fr = p[14];
    const T = THREE,
      up = new T.Vector3().subVectors(che, pel).normalize(),
      side = new T.Vector3().subVectors(p[12], p[9]).normalize(),
      face = new T.Vector3().crossVectors(side, up),
      onBack = face.y >= 0;
    let hx = head.x - (fl.x + fr.x) / 2,
      hz = head.z - (fl.z + fr.z) / 2;
    const hl = hyp(hx, hz) || 1;
    hx /= hl;
    hz /= hl;
    const yaw = onBack ? Math.atan2(-hx, -hz) : Math.atan2(hx, hz);
    const u = m.userData;
    if (u && u.prag === R) {
      if (!R.sleep) RG.active--;
      u.prag = null;
    }
    for (const k of PARTS) {
      const o = P[k],
        r = K.rest[k];
      if (!o || !r) continue;
      o.position.copy(r.p);
      o.quaternion.copy(r.q);
    }
    m.rotation.order = 'YXZ';
    m.rotation.set(0, yaw, 0);
    let fx = (fl.x + fr.x) / 2,
      fz = (fl.z + fr.z) / 2;
    if (blocked(fx, fz, 0.25, m.position.y, 1.2)) {
      fx = pel.x;
      fz = pel.z;
      if (blocked(fx, fz, 0.25, m.position.y, 1.2)) {
        fx = m.position.x;
        fz = m.position.z;
      }
    }
    m.position.set(fx, groundAt(fx, fz, K.y0 + 0.5), fz);
    m.updateMatrixWorld(true);
    try {
      for (const o of P.body.children.slice()) if (K.kids.has(o)) m.attach(o);
    } catch (e) {}
    K.ph = 'up';
    K.t = 0;
    K.sgn = onBack ? -1 : 1;
    K.yaw = yaw;
  }
  function compStep(c, dt) {
    const K = c.ck,
      m = c.m,
      RG = window.RGRAG;
    K.t += dt;
    if (K.ph === 'down') {
      RG.step(m, dt);
      if ((K.R.sleep && K.t > 1.2) || K.t > 3) compRebuild(c);
      return;
    }
    const T = 1.15,
      k = 1 - ease(clamp(K.t / T, 0, 1));
    m.rotation.x = K.sgn * 1.45 * k;
    m.position.y = groundAt(m.position.x, m.position.z, m.position.y + 0.5) + 0.22 * k;
    if (K.t >= T) {
      c.ck = null;
      c.vs = null;
      m.rotation.set(0, K.yaw, 0);
      m.position.y = groundAt(m.position.x, m.position.z, m.position.y + 0.5);
      if (typeof armDefault === 'function') armDefault(m);
      if (c.np) c.np.pts = null;
    }
  }
  const _sf = survFight;
  survFight = function (dt) {
    const r = _sf.apply(this, arguments);
    if (typeof comps !== 'undefined')
      for (const c of comps)
        if (c.ck)
          try {
            compStep(c, Math.min(dt || 0.016, 0.05));
          } catch (e) {
            console.warn('[zfloors] survivor get-up', e);
            c.ck = null;
            c.vs = null;
            c.m.rotation.set(0, c.m.rotation.y, 0);
          }
    return r;
  };

  /* ---------------- 4c. vaulting (ground windows, low walls): land on what is there, stairs and steps included ----------------
     core's startVault looked for a spot clear from the ground up, so a window opening onto the foot of a staircase sent the vault
     on past the stairs (or back out). Now a landing is any surface within a step of where the vault started with room to stand. */
  const _stv = startVault;
  startVault = function (o, u, dx, dz) {
    if (!NF.ok) return _stv.apply(this, arguments);
    const p = o.position,
      l = hyp(dx, dz) || 1;
    dx /= l;
    dz /= l;
    let seen = false,
      lx = null,
      lz = null;
    for (let k = 0.25; k <= 5; k += 0.25) {
      const x = p.x + dx * k,
        z = p.z + dz * k,
        gy = groundAt(x, z, p.y + 0.5),
        free = Math.abs(gy - p.y) <= 0.45 && !blocked(x, z, 0.3, gy + 0.31, 1.49);
      if (!free) seen = true;
      else if (seen) {
        lx = x;
        lz = z;
        u.vy1 = gy;
        break;
      }
    }
    if (lx === null) return false;
    u.vs = [p.x, p.z];
    u.ve = [lx, lz];
    u.vt = 0;
    u.vd = 0.5 + hyp(lx - p.x, lz - p.z) * 0.07;
    u.vh = 1.35;
    u.vy0 = p.y;
    return true;
  };

  /* ---------------- 5. the player's trail: which window did they just jump out of? ---------------- */
  let plLast = {id: -1, x: 0, z: 0, y: 0};
  function tick() {
    if (!NF.ok || !NF.drops.length) return;
    const p = pl.position,
      fy = feetOf(),
      gy = groundAt(p.x, p.z, fy + 0.05);
    if (Math.abs(fy - gy) > 0.08) return; // in the air
    const id = NF.nodeAt(p.x, p.z, fy, 0.6);
    if (id < 0) return;
    const yl = NF.y(id);
    if (plLast.id >= 0 && plLast.y - yl > 1.5) {
      // came down a long way since the last time on a surface: through which window?
      let best = null,
        bd = 4;
      for (const L of NF.drops) {
        if (Math.abs(L.fy - plLast.y) > 0.6) continue;
        const d = hyp(L.wx - plLast.x, L.wz - plLast.z) + hyp(L.lx - p.x, L.lz - p.z) * 0.3;
        if (d < bd) {
          bd = d;
          best = L;
        }
      }
      if (best) {
        best.pt = now();
        NF.trail = {L: best, t: best.pt};
        dropCost(best);
        NAV.T = 0; // re-run the field now: zombies inside see the shortcut
      }
    }
    plLast = {id, x: p.x, z: p.z, y: yl};
  }
  if (typeof updComps === 'function') {
    const _uc = updComps;
    updComps = function (dt) {
      try {
        tick();
      } catch (e) {}
      return _uc.apply(this, arguments);
    };
  }

  /* ---------------- 6. followers: a waypoint toward the player along the floors (core updComps asks for it) ---------------- */
  NF.compWay = function (c, dt) {
    if (!NF.ok || !window.ZPATH || !ZPATH.route) return null;
    const m = c.m,
      p = m.position,
      t = {x: pl.position.x, z: pl.position.z, y: feetOf()},
      dy = Math.abs(t.y - p.y),
      d = hyp(t.x - p.x, t.z - p.z);
    if (!(now() - (NF.softT || 0) < 0.6)) navSoft(); // doors / windows marked even when no zombie is hunting (followers avoid windows)
    let r = c.np;
    // close and on the same level with a clear straight line: no route needed (core walks straight at you)
    if (dy < 1.0 && (d < 3 || (d < 14 && NF.lineOk(p.x, p.z, p.y, t.x, t.z, t.y, 0.18, false)))) {
      c.np = null;
      c.wd = 1e9;
      return null;
    }
    const moved = r && r.pts && (hyp(t.x - r.tx, t.z - r.tz) > 1.5 || Math.abs(t.y - r.ty) > 1.2);
    if (!r || !r.pts || (r.T -= dt) <= 0 || moved || r.i >= r.pts.length) {
      r = c.np = ZPATH.route(p, t, 'comp') || {pts: null};
      r.T = 0.5 + Math.random() * 0.2;
      r.tx = t.x;
      r.tz = t.z;
      r.ty = t.y;
      r.i = r.pts && r.pts.length > 1 ? 1 : 0;
    }
    const P = r.pts;
    if (!P) return null;
    while (r.i < P.length) {
      const q = P[r.i],
        dd = hyp(q.x - p.x, q.z - p.z),
        last = r.i === P.length - 1;
      // a corner is cut only when the next point is in a straight line from here (stair turns!)
      if (
        dd < (last ? 0.45 : 0.6) &&
        Math.abs(q.y - p.y) < 0.8 &&
        (last || dd < 0.22 || NF.lineOk(p.x, p.z, p.y, P[r.i + 1].x, P[r.i + 1].z, P[r.i + 1].y, 0.18, false))
      ) {
        r.i++;
        continue;
      }
      // no progress toward the player for 4 s (a door leaf on a corner, a crowd on the stairs): hop to the next route point, like
      // core's catch-up teleport for followers left 30 m behind
      const prog = d + dy * 2;
      if (!(c.wd < 1e9) || prog < c.wd - 0.5) {
        c.wd = prog;
        c.wt = 0;
      } else if ((c.wt += dt) > 4) {
        // the first clear point of the next few (the point itself can be under a door leaf that just swung into the way)
        for (let k = r.i; k < Math.min(P.length, r.i + 4); k++) {
          const h = P[k];
          if (blocked(h.x, h.z, 0.3, h.y + 0.05, 1.6)) continue;
          p.x = h.x;
          p.z = h.z;
          p.y = groundAt(h.x, h.z, h.y + 0.3);
          r.i = k + 1;
          NF.stats.hops = (NF.stats.hops || 0) + 1;
          break;
        }
        c.wt = 0;
        c.wd = 1e9;
        continue;
      }
      return {x: q.x, z: q.z, y: q.y};
    }
    // end of the route: a window the player went out of? follow them out
    if (r.drop && !r.drop.w.alive) {
      NF.startDrop(m, c, r.drop);
      c.np = null;
      return {x: p.x, z: p.z, y: p.y, drop: 1};
    }
    return null;
  };

  /* ---------------- cleanup ---------------- */
  if (typeof killZ === 'function') {
    const _kz = killZ;
    killZ = function (z) {
      try {
        const u = z && z.userData;
        if (u && u.wd) {
          u.wd = null;
          u.vs = null;
        }
      } catch (e) {}
      return _kz.apply(this, arguments);
    };
  }
  if (typeof clearWorld === 'function') {
    const _cw = clearWorld;
    clearWorld = function () {
      NF.ok = false;
      NF.drops = [];
      NF.trail = null;
      plLast = {id: -1, x: 0, z: 0, y: 0};
      debugClear();
      return _cw.apply(this, arguments);
    };
  }

  /* ---------------- debug view ---------------- */
  let dbgObj = null;
  function debugClear() {
    if (dbgObj && dbgObj.parent) dbgObj.parent.remove(dbgObj);
    dbgObj = null;
  }
  function debugDraw() {
    debugClear();
    if (!NF.ok || typeof scene === 'undefined') return;
    const T = THREE,
      g = new T.Group(),
      pos = [],
      col = [],
      cc = new T.Color();
    for (let k = 0; k < NF.E; k++) {
      const id = NF.G0 + k;
      pos.push(NF.x(id), NF.ey[k] + 0.06, NF.z(id));
      cc.setHSL(0.66 - Math.min(0.66, NF.ey[k] / 9), 0.9, 0.55);
      col.push(cc.r, cc.g, cc.b);
    }
    const pg = new T.BufferGeometry();
    pg.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    pg.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    g.add(new T.Points(pg, new T.PointsMaterial({size: 0.16, vertexColors: true, depthTest: false})));
    const lp = [];
    for (const L of NF.drops)
      lp.push(
        NF.x(L.from),
        NF.y(L.from) + 0.1,
        NF.z(L.from),
        L.wx,
        L.fy + 0.95,
        L.wz,
        L.wx,
        L.fy + 0.95,
        L.wz,
        L.lx,
        L.ly + 0.1,
        L.lz
      );
    const lg = new T.BufferGeometry();
    lg.setAttribute('position', new T.Float32BufferAttribute(lp, 3));
    g.add(new T.LineSegments(lg, new T.LineBasicMaterial({color: 0xff3366, depthTest: false})));
    g.renderOrder = 999;
    scene.add(g);
    dbgObj = g;
  }
  window.navFloorsDebug = on => {
    NF.dbg = on === undefined ? !NF.dbg : !!on;
    if (NF.dbg) debugDraw();
    else debugClear();
    return Object.assign({}, NF.stats);
  };
  console.log('[zfloors] multi-storey navigation ready');
})();
