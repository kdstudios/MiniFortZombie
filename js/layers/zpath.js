/* ==========================================================================================================
   MINI FORT ZOMBIE - ZOMBIE PATHFINDING (v072, ported from Riposte Frontline's bot navigation: 03-nav.js, 07-bots.js, 07e-humain.js)
   v071 zombies stepped greedily to the cheapest of the 8 neighbouring 0.5 m cells of the shared flow field every frame: zig-zag
   movement, corner snagging, no route at all when hunting a last-known position (straight line into the wall), no field value when
   standing inside a wall's padding (straight line again), and a random 0.4 m jitter as the only way out of a jam.
   Now, as Riposte's bots do it:
   1. PATHS, not steps. A zombie hunting you reads a whole route out of the flow field (downhill from its cell to you, up to 24 m), and
      a zombie hunting a last-known position runs A* on the same grid (Riposte findPath: binary heap, stamped arrays, capped search,
      the best partial route if the cap is hit). The flow field is kept as the shared cost map, so a 100-zombie siege still costs one
      Dijkstra, and doors / windows / barricades keep their bash-through costs.
   2. STRING PULLING (Riposte smoothPath). The route is shortened to the furthest point that can be walked to in a straight line with
      body clearance, so zombies walk straight lines and round corners cleanly. A door, window or barricade on the route is a pinned
      point (Riposte's jump/drop pins): the line never cuts past it.
   3. WAYPOINTS (Riposte pathDir). A corner is only cut when the next point can be reached in a straight line from here; otherwise the
      zombie walks right up to it. Routes are refreshed every ~0.6 s, or sooner when the target moves away from the end of the route.
   4. NEAREST FREE CELL (Riposte botNearNode). A zombie pressed against a wall starts its route from the nearest free cell it can walk
      straight to, instead of losing the route.
   5. BUMP + UNSTICK (Riposte botBump / botUnstick). b.bump tracks how much of the wanted step the scenery took back. Pinned for 0.28 s:
      first try climbing it (zclimb), otherwise escalate: sidestep to the free side, walk back to the nearest free cell, back off and
      re-plan, and as a last resort settle on the nearest free cell.
   6. Zombies face where they are walking until they are close to their target, and keep going for a target standing on top of something.
   Hooks: zMove (replaced; zclimb wraps this one), killZ / clearWorld (cleanup). Turn off with ZPATH.on=false (falls back to v071 movement).
   ========================================================================================================== */
(function () {
  'use strict';
  if (typeof zMove !== 'function' || typeof NAV === 'undefined' || typeof blocked !== 'function') {
    console.warn('[zpath] core hooks missing');
    return;
  }
  const ZP = (window.ZPATH = {
    on: true,
    len: 48,
    smooth: 30,
    clr: 0.18,
    repath: 0.6,
    astarCap: 9000,
    astarFrame: 3, // v084: A* searches allowed per frame (the rest wait a frame or two)
    bumpTc: 0.18,
    bumpLost: 0.5,
    bumpHold: 0.28,
    face: 3.5,
    stats: {field: 0, astar: 0, partial: 0, unstick: 0, climbs: 0}
  });
  const hyp = Math.hypot,
    now = () => performance.now() / 1000;
  const DX = [1, -1, 0, 0, 1, 1, -1, -1],
    DZ = [0, 0, 1, -1, 1, -1, 1, -1];

  /* ---------------- grid helpers on core's NAV (0.5 m cells, wall mask padded by 0.32 m, flow field dist[], soft obstacles) ---------------- */
  const cellOf = (x, z) => {
    const N = NAV,
      ix = Math.floor((x - N.x0) / N.cs),
      iz = Math.floor((z - N.z0) / N.cs);
    return ix < 0 || iz < 0 || ix >= N.w || iz >= N.h ? -1 : iz * N.w + ix;
  };
  const cx = i => NAV.x0 + ((i % NAV.w) + 0.5) * NAV.cs,
    cz = i => NAV.z0 + (((i / NAV.w) | 0) + 0.5) * NAV.cs;
  const wallAt = (x, z) => {
    const i = cellOf(x, z);
    return i < 0 || NAV.wall[i] === 1;
  };
  /* straight walk from a to b with body clearance: the centre line and two lines offset by ZP.clr either side cross no wall cell, and no soft
   obstacle (door / window / barricade) unless it is the end point (Riposte navWalkable, plus a clearance margin like its NAV_R > body radius) */
  function walkable(ax, az, bx, bz, softEnd) {
    const dx = bx - ax,
      dz = bz - az,
      L = hyp(dx, dz);
    if (L < 1e-3) return true;
    const n = Math.ceil(L / 0.22),
      px = (-dz / L) * ZP.clr,
      pz = (dx / L) * ZP.clr,
      S = NAV.softObj,
      end = cellOf(bx, bz);
    for (let k = 1; k <= n; k++) {
      const t = k / n,
        x = ax + dx * t,
        z = az + dz * t,
        i = cellOf(x, z);
      if (i < 0 || NAV.wall[i]) return false;
      if (S[i] && !(softEnd && (i === end || (end >= 0 && S[i] === S[end])))) return false; // v081: any cell of the same door / window
      if (t < 0.97 && (wallAt(x + px, z + pz) || wallAt(x - px, z - pz))) return false;
    }
    return true;
  }
  /* nearest free cell the body can walk straight to (Riposte botNearNode); needField: only cells the flow field reached */
  function nearFree(x, z, needField) {
    const N = NAV,
      ix = Math.floor((x - N.x0) / N.cs),
      iz = Math.floor((z - N.z0) / N.cs);
    let best = -1,
      bd = 1e9;
    for (let r = 0; r <= 4 && best < 0; r++)
      for (let dz = -r; dz <= r; dz++)
        for (let dx = -r; dx <= r; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
          const jx = ix + dx,
            jz = iz + dz;
          if (jx < 0 || jz < 0 || jx >= N.w || jz >= N.h) continue;
          const i = jz * N.w + jx;
          if (N.wall[i] || (needField && !(N.dist[i] < 1e8))) continue;
          const d = hyp(cx(i) - x, cz(i) - z);
          if (d >= bd) continue;
          if (d > 0.35 && lineBlocked(x, z, cx(i), cz(i))) continue;
          bd = d;
          best = i;
        }
    return best;
  }
  function lineBlocked(ax, az, bx, bz) {
    const dx = bx - ax,
      dz = bz - az,
      L = hyp(dx, dz),
      n = Math.max(1, Math.ceil(L / 0.3));
    for (let k = 1; k <= n; k++) {
      const t = k / n;
      if (blocked(ax + dx * t, az + dz * t, 0.26, 0, 1.7)) return true;
    }
    return false;
  }

  /* ---------------- v081: ground cells keep their index; floor nodes (js/layers/zfloors.js, NAVF) are numbered after them ---------------- */
  const FL = () => (window.NAVF && NAVF.ok ? NAVF : null);
  const G0n = () => NAV.w * NAV.h;
  const nTot = () => (FL() ? NAVF.total() : G0n());
  const nx_ = i => (i >= G0n() ? NAVF.x(i) : cx(i)),
    nz_ = i => (i >= G0n() ? NAVF.z(i) : cz(i)),
    ny_ = i => (FL() ? NAVF.y(i) : 0);
  const tY = tp => (tp === pl.position ? pl.position.y - (G.eyeUsed || 1.6) : tp.y || 0);
  /* the node a body stands on (falls back to the nearest one it can walk to) */
  function startNode(x, z, y, needField) {
    const F = FL();
    if (F) {
      let i = F.nodeAt(x, z, y, 0.75);
      if (i >= 0 && (!needField || NAV.dist[i] < 1e8)) return i;
      i = F.nearNode(x, z, y, needField, 4);
      if (i >= 0) return i;
      if (y > 0.6) return -1;
    }
    let i = cellOf(x, z);
    if (i < 0) return -1;
    if (NAV.wall[i] || (needField && !(NAV.dist[i] < 1e8))) i = nearFree(x, z, needField);
    return i;
  }
  /* forward neighbours: cb(node, base cost, window drop link or null) */
  function eachFwd(i, cb) {
    const F = FL();
    if (F) return F.fwd(i, cb);
    const N = NAV,
      w = N.w,
      W = N.wall,
      cs = N.cs,
      ix = i % w,
      iz = (i / w) | 0;
    for (let k = 0; k < 8; k++) {
      const nx = ix + DX[k],
        nz = iz + DZ[k];
      if (nx < 0 || nz < 0 || nx >= w || nz >= N.h) continue;
      const m = nz * w + nx;
      if (W[m]) continue;
      if (k > 3 && (W[iz * w + nx] || W[nz * w + ix])) continue;
      cb(m, k > 3 ? 1.414 * cs : cs, null);
    }
  }
  /* can a body walk straight from a to b? ground-only legs use the core grid, anything touching a floor uses the floor nodes */
  function canWalk(a, b) {
    const F = FL();
    if (!F || (!a.e && !b.e && a.y < 0.3 && b.y < 0.3)) return walkable(a.x, a.z, b.x, b.z, b.soft);
    return F.lineOk(a.x, a.z, a.y, b.x, b.z, b.y, ZP.clr, b.soft);
  }
  const here = p => ({x: p.x, z: p.z, y: p.y, e: p.y > 0.3});

  /* ---------------- 1a. route out of the shared flow field: downhill from the zombie's node toward the defenders ---------------- */
  function fieldRoute(x, z, y) {
    const D = NAV.dist,
      S = NAV.softObj;
    let i = startNode(x, z, y || 0, true);
    if (i < 0) return null;
    const ids = [i];
    let soft = null,
      drop = null;
    for (let s = 0; s < ZP.len; s++) {
      const di = D[i];
      if (di <= 1e-6) break;
      let bi = -1,
        bv = 1e18,
        bl = null;
      eachFwd(i, (m, c, L) => {
        const dm = D[m];
        if (!(dm < di - 1e-3)) return;
        const v = dm + c;
        if (v < bv) {
          bv = v;
          bi = m;
          bl = L;
        }
      });
      if (bi < 0) break;
      if (bl) {
        drop = bl;
        break;
      } // v081: out of a window: the route ends at the sill, the zombie goes out (NAVF.startDrop)
      i = bi;
      ids.push(i);
      if (S[i]) {
        soft = S[i];
        break;
      }
    } // a door / window / barricade on the way: the route ends there, the zombie deals with it
    return {ids, soft, drop};
  }

  /* ---------------- 1b. A* on the same graph to any point (Riposte findPath), for last-known positions, targets the field does not
     cover, and followers (prof 'comp': doors are cheap, windows and barricades are off limits, and the only window drop allowed is
     the one the player just used) ---------------- */
  const AS = {n: 0, g: null, f: null, fr: null, st: null, cl: null, lk: null, gen: 1, ha: null, hn: 0};
  function asAlloc() {
    const n = nTot();
    if (AS.n === n) return;
    AS.n = n;
    AS.g = new Float32Array(n);
    AS.f = new Float32Array(n);
    AS.fr = new Int32Array(n);
    AS.st = new Int32Array(n);
    AS.cl = new Int32Array(n);
    AS.lk = new Int32Array(n);
    AS.ha = new Int32Array(Math.max(4096, n >> 2, ZP.astarCap * 8 + 64)); // v081: room for every push within the cap (small worlds overflowed)
    AS.gen = 1;
  }
  function hpush(id) {
    const a = AS.ha,
      f = AS.f;
    if (AS.hn >= a.length) return;
    let i = AS.hn++;
    a[i] = id;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (f[a[p]] <= f[a[i]]) break;
      const t = a[p];
      a[p] = a[i];
      a[i] = t;
      i = p;
    }
  }
  function hpop() {
    const a = AS.ha,
      f = AS.f,
      top = a[0];
    a[0] = a[--AS.hn];
    let i = 0;
    for (;;) {
      const l = i * 2 + 1,
        r = l + 1;
      let m = i;
      if (l < AS.hn && f[a[l]] < f[a[m]]) m = l;
      if (r < AS.hn && f[a[r]] < f[a[m]]) m = r;
      if (m === i) break;
      const t = a[m];
      a[m] = a[i];
      a[i] = t;
      i = m;
    }
    return top;
  }
  function astar(x, z, y, tx, tz, ty, prof) {
    const N = NAV,
      F = FL();
    asAlloc();
    const s = startNode(x, z, y || 0, false);
    if (s < 0) return null;
    let e = F ? F.nodeAt(tx, tz, ty || 0, 0.9) : -1;
    if (e < 0 && F) e = F.nearNode(tx, tz, ty || 0, false, 4);
    if (e < 0) {
      e = cellOf(tx, tz);
      if (e < 0) return null;
      if (N.wall[e]) {
        const e2 = nearFree(tx, tz, false);
        if (e2 >= 0) e = e2;
      }
    }
    const X = N.extra,
      NR = N.near,
      S = N.softObj,
      comp = prof === 'comp',
      g = AS.g,
      f = AS.f,
      fr = AS.fr,
      st = AS.st,
      cl = AS.cl,
      lk = AS.lk,
      gen = ++AS.gen,
      ex = nx_(e),
      ez = nz_(e);
    /* v081: a goal upstairs: NAVF.remFor gives the exact cost from anywhere on that floor and from the foot of its stairs, so the
       estimate aims at the stairs (nearest foot + its exact remainder) and the search ends as soon as it reaches that floor */
    const RM = F && e >= G0n() ? F.remFor(e, comp) : null,
      RD = RM ? RM.D : null,
      CL = RM ? RM.cl : null;
    const H = i => {
      if (RD) {
        const r = RD.get(i);
        if (r !== undefined) return r;
      }
      const xi = nx_(i),
        zi = nz_(i),
        ddx = Math.abs(xi - ex),
        ddz = Math.abs(zi - ez);
      let h = (Math.max(ddx, ddz) + 0.414 * Math.min(ddx, ddz)) * 1.05;
      if (CL && CL.length) {
        let m = 1e9;
        for (let j = 0; j < CL.length; j += 4) {
          const v = hyp(xi - CL[j], zi - CL[j + 1]) - CL[j + 2] + CL[j + 3];
          if (v < m) m = v;
        }
        if (m > h) h = m;
      }
      return h;
    };
    AS.hn = 0;
    st[s] = gen;
    g[s] = 0;
    f[s] = H(s);
    fr[s] = -1;
    lk[s] = -1;
    hpush(s);
    let it = 0,
      found = false,
      bestI = s,
      bestH = f[s],
      gn = 0,
      n = s,
      hit = -1;
    const relax = (m, c, L) => {
      if (cl[m] === gen) return;
      if (L && comp) {
        if (!F.playerUsed(L)) return;
        c = 0.2;
      }
      let x2 = X[m];
      if (comp) {
        const so = S[m];
        x2 = so ? (so.t === 'door' ? 0.6 : -1) : 0;
        if (x2 < 0) return;
      }
      const ng = gn + c + x2 + NR[m];
      if (st[m] !== gen || ng < g[m]) {
        st[m] = gen;
        g[m] = ng;
        fr[m] = n;
        lk[m] = L ? L.k : -1;
        f[m] = ng + H(m);
        hpush(m);
      }
    };
    while (AS.hn > 0 && it < ZP.astarCap) {
      n = hpop();
      if (cl[n] === gen) continue; // (v081: stale heap entries no longer count against the cap)
      cl[n] = gen;
      it++;
      if (n === e || (RD && RD.has(n))) {
        found = true;
        hit = n;
        break;
      }
      const h = f[n] - g[n];
      if (h < bestH) {
        bestH = h;
        bestI = n;
      }
      gn = g[n];
      eachFwd(n, relax);
    }
    const last = found ? hit : bestI;
    if (!found) ZP.stats.partial++;
    if (last === s && !found && !(RD && RD.has(s))) return null;
    const ids = [];
    for (let m = last; m >= 0; m = fr[m]) ids.push(m);
    ids.reverse();
    let soft = null,
      drop = null;
    // the rest of the way on the goal's floor: downhill on its exact costs
    if (found && RD && last !== e) {
      let i = last;
      for (let k = 0; k < 4000 && i !== e; k++) {
        const ri = RD.get(i);
        let bi = -1,
          bv = 1e18,
          bl = null;
        eachFwd(i, (m, c, L) => {
          const r = RD.get(m);
          if (r === undefined || !(r < ri - 1e-6)) return;
          if (L && comp && !F.playerUsed(L)) return;
          const v = r + c;
          if (v < bv) {
            bv = v;
            bi = m;
            bl = L;
          }
        });
        if (bi < 0) break;
        if (bl) {
          drop = bl;
          break;
        }
        ids.push(bi);
        i = bi;
      }
    }
    for (let k = 1; k < ids.length; k++) {
      if (F && k < ids.length && lk[ids[k]] >= 0 && st[ids[k]] === gen && fr[ids[k]] === ids[k - 1]) {
        drop = F.drops[lk[ids[k]]];
        ids.length = k;
        break;
      }
      if (!comp && S[ids[k]]) {
        soft = S[ids[k]];
        ids.length = k + 1;
        drop = null;
        break;
      }
    }
    return {ids, soft, drop, partial: !found && !drop};
  }

  /* ---------------- 2. string pulling (Riposte smoothPath): jump to the furthest point still walkable in a straight line; soft cells are pinned ---------------- */
  function smooth(ids) {
    const S = NAV.softObj,
      g0 = G0n();
    const P = ids.map(i => ({x: nx_(i), z: nz_(i), y: ny_(i), e: i >= g0, soft: !!S[i]}));
    if (P.length <= 2) return P;
    const out = [P[0]];
    let i = 0;
    while (i < P.length - 1) {
      let j = Math.min(P.length - 1, i + ZP.smooth);
      for (let k = i + 1; k < j; k++)
        if (P[k].soft) {
          j = k;
          break;
        }
      while (j > i + 1 && !canWalk(P[i], P[j])) j--;
      out.push(P[j]);
      i = j;
    }
    return out;
  }

  /* ---------------- 3. route per zombie + waypoint following (Riposte setPath / pathDir) ---------------- */
  function finish(r, R, p, tp, ty) {
    const pts = smooth(R.ids);
    // the end of a field route is the target's own cell (it may be on top of a wall): finish on the real target point when it is in a straight line
    if (!R.soft && !R.drop && !R.partial) {
      const L = pts[pts.length - 1];
      if (hyp(L.x - tp.x, L.z - tp.z) < 1.2 && Math.abs(L.y - ty) < 0.8)
        pts[pts.length - 1] = {x: tp.x, z: tp.z, y: L.y, e: L.e, end: 1};
    }
    r.pts = pts;
    r.soft = R.soft;
    r.drop = R.drop || null;
    r.i = pts.length > 1 ? 1 : 0;
    if (pts.length > 1 && !canWalk(here(p), pts[1])) r.i = 0; // no shortcut through a wall at the start: first the nearest free cell
    r.ex = pts[pts.length - 1].x;
    r.ez = pts[pts.length - 1].z;
    return r;
  }
  function plan(u, p, tp, useField) {
    const r = u.zp || (u.zp = {});
    let R = null;
    if (useField && NAV.dist) {
      R = fieldRoute(p.x, p.z, p.y);
      if (R) ZP.stats.field++;
    }
    // v084: A* budget per frame. A loud shot (combat / double-barrel shotgun: 60 m) alerted every zombie in range at once and each
    // ran a full A* in the same frame -> a lag spike per shot. Over budget, the zombie keeps its old route and asks again shortly.
    if (!R) {
      const fr = typeof renderer !== 'undefined' && renderer.info ? renderer.info.render.frame : performance.now() >> 4;
      if (fr !== ZP._bf) {
        ZP._bf = fr;
        ZP._bn = 0;
      }
      if (ZP._bn >= ZP.astarFrame) {
        r.T = 0.03 + Math.random() * 0.12;
        ZP.stats.defer = (ZP.stats.defer || 0) + 1;
        return r;
      }
      ZP._bn++;
    }
    r.T = ZP.repath * (0.8 + Math.random() * 0.5);
    r.tx = tp.x;
    r.tz = tp.z;
    r.ty = tY(tp);
    r.pts = null;
    r.soft = null;
    r.drop = null;
    r.i = 1;
    if (!R) {
      R = astar(p.x, p.z, p.y, tp.x, tp.z, r.ty);
      if (R) ZP.stats.astar++;
    }
    if (!R || !R.ids.length) return r;
    return finish(r, R, p, tp, r.ty);
  }
  function waypoint(z, u, p, tp, useField, dt) {
    let r = u.zp;
    const ty = tY(tp),
      moved =
        r &&
        r.pts &&
        (hyp(tp.x - r.tx, tp.z - r.tz) > Math.max(1.5, 0.25 * hyp(p.x - tp.x, p.z - tp.z)) ||
          Math.abs(ty - r.ty) > 1.2);
    if (!r || !r.pts || (r.T -= dt) <= 0 || moved || r.i >= r.pts.length) r = plan(u, p, tp, useField);
    const P = r.pts;
    if (!P) return null;
    while (r.i < P.length) {
      const q = P[r.i],
        d = hyp(q.x - p.x, q.z - p.z),
        last = r.i === P.length - 1;
      if (d < (last ? 0.45 : 0.6) && Math.abs(q.y - p.y) < 0.9 && (last || d < 0.22 || canWalk(here(p), P[r.i + 1]))) {
        r.i++;
        continue;
      } // a corner is cut only if the next point is in a straight line
      return {x: q.x, z: q.z, y: q.y, o: r.soft, far: !last || !q.end};
    }
    if (r.drop) return {x: p.x, z: p.z, y: p.y, drop: r.drop}; // v081: at the window
    // v081: at the door / window / barricade the route ends on: aim through it (bump the sill to vault, the door to bash it)
    const so = r.soft && r.soft.o;
    if (so) {
      let ox, oz;
      if (r.soft.t === 'win') {
        ox = so.p.x;
        oz = so.p.z;
      } else {
        const q = r.soft.t === 'door' ? so.sol : so.box || (so.boxes && so.boxes[0]);
        if (q) {
          ox = (q.min.x + q.max.x) / 2;
          oz = (q.min.z + q.max.z) / 2;
        }
      }
      if (ox !== undefined) {
        const dd = hyp(ox - p.x, oz - p.z);
        if (dd > 0.05 && dd < 2.5)
          return {x: ox + ((ox - p.x) / dd) * 1.2, z: oz + ((oz - p.z) / dd) * 1.2, y: p.y, o: r.soft};
      }
    }
    return null;
  }
  /* v081: a whole route for someone else (followers): {pts, drop} or null */
  ZP.route = function (p, t, prof) {
    if (!NAV.ok) return null;
    const R = astar(p.x, p.z, p.y, t.x, t.z, t.y || 0, prof);
    if (!R || !R.ids.length) return null;
    return finish({}, R, p, t, t.y || 0);
  };

  /* ---------------- 5. bump + unstick (Riposte botBump / botUnstick) ---------------- */
  function room(p, dx, dz, len) {
    for (let s = 0.35; s <= len + 0.01; s += 0.35) {
      if (blocked(p.x + dx * s, p.z + dz * s, 0.3, p.y + 0.31, 1.39)) return s - 0.35;
    }
    return len;
  }
  function unstick(z, u, p, hx, hz, tgtY) {
    const t = now(),
      n = t - (u.zuAt || -9) < 3 ? (u.zuN || 0) + 1 : 0;
    u.zuN = n;
    u.zuAt = t;
    u.zb = 0;
    u.zbT = 0;
    ZP.stats.unstick++;
    if (u.zp) {
      u.zp.pts = null;
      u.zp.T = 0;
    }
    // climbable thing in the way and the target is beyond / on top of it: climb instead (zclimb)
    if (n <= 1 && window.ZCLIMB && ZCLIMB.tryClimb && ZCLIMB.tryClimb(z, u, hx, hz, tgtY)) {
      ZP.stats.climbs++;
      u.zuN = 0;
      return;
    }
    if (n === 0) {
      const sd = Math.random() < 0.5 ? 1 : -1,
        rx = -hz,
        rz = hx;
      let s = 0;
      if (room(p, rx * sd, rz * sd, 1.2) >= 1) s = sd;
      else if (room(p, -rx * sd, -rz * sd, 1.2) >= 1) s = -sd;
      u.zs = s ? {t: 0.45, dx: rx * s, dz: rz * s} : {t: 0.5, dx: -hx, dz: -hz};
      return;
    }
    // v081: the nearest free node on this floor (a ground cell under an upper floor is not 'near')
    const near = () => (FL() ? NAVF.nearNode(p.x, p.z, p.y, false, 4) : nearFree(p.x, p.z, false));
    if (n <= 2 || n === 5) {
      const i = near();
      if (i >= 0) {
        u.zs = {t: 1, x: nx_(i), z: nz_(i)};
        return;
      }
    }
    if (n < 5) {
      u.zs = {t: 0.7, dx: -hx, dz: -hz};
      NAV.T = 0;
      return;
    }
    const i = near();
    if (i >= 0 && hyp(nx_(i) - p.x, nz_(i) - p.z) < 1.3) {
      p.x = nx_(i);
      p.z = nz_(i);
    }
    u.zuN = 0;
  }

  /* ---------------- the new zMove (core signature; zclimb wraps it) ---------------- */
  const _zm0 = zMove;
  zMove = function (z, u, p, dt, best, tp, useField) {
    if (!ZP.on || !NAV.ok) return _zm0.apply(this, arguments);
    const tgtY = tp === pl.position ? pl.position.y - (G.eyeUsed || 1.6) : tp.y || 0,
      up = tgtY > p.y + 0.8,
      below = p.y - tgtY > 1.7; // v081: a target on the floor below (or outside, under the window) is not 'there' either
    if (best < zStopAt(u) && !up && !below) {
      // v090: was 1.3 (reach halved)
      u.zb = 0;
      return;
    }
    if (best < 0.35 && !below && !(up && FL())) return; // v081: right under someone upstairs is not 'there' either
    const night = G.time >= 20 || G.time < 5,
      sp = u.sp * (night ? 1.2 : 1) * dt;
    let wx = tp.x,
      wz = tp.z,
      route = null,
      far = false,
      hasRoute = false,
      wy = p.y;
    // standing on top of something: no grid up here, head straight for it (zclimb handles the edge). v081: an upper floor has nodes
    const elev = p.y > 0.6 && (FL() ? startNode(p.x, p.z, p.y, false) < 0 : wallAt(p.x, p.z));
    if (!elev) {
      const w = waypoint(z, u, p, tp, useField, dt);
      hasRoute = !!(u.zp && u.zp.pts);
      if (w && w.drop) {
        // v081: at an upstairs window on the route: smash the glass, then go out (zfloors)
        if (w.drop.w.alive) {
          u.atk = {t: 'win', o: w.drop.w};
          u.zb = 0;
        } else NAVF.startDrop(z, u, w.drop);
        return;
      }
      if (!w && below && FL()) {
        u.zb = 0;
        return;
      } // v081: no way down from here (yet): don't walk off toward a target under the floor
      if (w) {
        wy = w.y === undefined ? p.y : w.y;
        wx = w.x;
        wz = w.z;
        route = w.o;
        far = w.far;
      }
    }
    // recovery move from an unstick (sidestep / back off / walk to a free cell)
    const R = u.zs;
    if (R) {
      R.t -= dt;
      if (R.t <= 0) u.zs = null;
      else if (R.x !== undefined) {
        if (hyp(R.x - p.x, R.z - p.z) < 0.2) u.zs = null;
        else {
          wx = R.x;
          wz = R.z;
        }
      } else {
        wx = p.x + R.dx;
        wz = p.z + R.dz;
      }
    }
    let dx = wx - p.x,
      dz = wz - p.z,
      d = hyp(dx, dz);
    if (d < 0.04) {
      dx = tp.x - p.x;
      dz = tp.z - p.z;
      d = hyp(dx, dz) || 1;
    }
    const ux = dx / d,
      uz = dz / d,
      st = Math.min(sp, d + 0.05),
      tx = p.x + ux * st,
      tz = p.z + uz * st,
      x0 = p.x,
      z0 = p.z;
    if (far && best > ZP.face && !u.zs) {
      u.fx = p.x + ux * 3;
      u.fz = p.z + uz * 3;
    } // face where it is walking until it is close to its target
    let bl = blocked(tx, tz, 0.3, p.y + 0.31, 1.49); // v081: steps up to ~0.35 m like the player (stairs, kerbs, porches)
    // v081: climbing a stair on its route, a zombie scrambles up two treads at once (a switchback turn, a tread under its other foot)
    if (bl && FL() && wy > p.y + 0.15 && !bl.door && !bl.win && !bl.bar && bl.max.y <= p.y + 0.75) {
      if (!blocked(tx, tz, 0.3, bl.max.y + 0.01, 1.7)) {
        p.y = Math.max(p.y, groundAt(tx, tz, bl.max.y + 0.05));
        bl = null;
      }
    }
    // v081: on a floor, never walk off an edge (stairwell, stair side, landing): the way down is the stairs or a window drop
    const guard = !!FL() && p.y > 0.6 && !elev,
      ledge = (x, zz) => guard && groundAt(x, zz, p.y + 0.1) < p.y - 0.45;
    if (!bl && !ledge(tx, tz)) {
      p.x = tx;
      p.z = tz;
    } else if (!bl) {
      if (!ledge(tx, p.z) && !blocked(tx, p.z, 0.3, p.y + 0.31, 1.49)) p.x = tx;
      else if (!ledge(p.x, tz) && !blocked(p.x, tz, 0.3, p.y + 0.31, 1.49)) p.z = tz;
    } else {
      // bash / smash only what the route goes through (anything, if there is no route); otherwise slide round it
      const wants = o => !hasRoute || (route && route.o === o);
      if (bl.door && wants(bl.door)) {
        u.atk = {t: 'door', o: bl.door};
        if (bl.door.hp === undefined) bl.door.hp = 50;
        u.zb = 0;
        return;
      }
      if (bl.bar && wants(bl.bar)) {
        u.atk = {t: 'bar', o: bl.bar};
        u.zb = 0;
        return;
      }
      if (bl.win && wants(bl.win)) {
        u.atk = {t: 'win', o: bl.win};
        u.zb = 0;
        return;
      }
      if (bl.max.y <= 1.3 + p.y && !bl.bar && !bl.door && !bl.win && !u.zs && p.y < 0.6) {
        // (v081: ground level only: core's vault and winNear are ground-floor helpers)
        const w = winNear(tx, tz, 1.7);
        if (w && w.alive) {
          if (wants(w)) {
            u.atk = {t: 'win', o: w};
            return;
          }
        } else {
          if (Math.random() < (G.mode === 'SIEGE' ? 0.12 : 0.22)) {
            failJump(z, u, ux, uz);
            return;
          }
          if (startVault(z, u, ux, uz)) return;
        }
      }
      if (!blocked(tx, p.z, 0.3, p.y + 0.31, 1.49) && !ledge(tx, p.z)) p.x = tx;
      else if (!blocked(p.x, tz, 0.3, p.y + 0.31, 1.49) && !ledge(p.x, tz)) p.z = tz;
    }
    // Riposte botBump: how much of the wanted step the scenery took back, smoothed; pinned for a moment -> unstick
    const c2 = (tx - x0) ** 2 + (tz - z0) ** 2;
    let lost = 0;
    if (c2 > 1e-8) lost = Math.max(0, Math.min(1, 1 - ((p.x - x0) * (tx - x0) + (p.z - z0) * (tz - z0)) / c2));
    u.zb = (u.zb || 0) + (lost - (u.zb || 0)) * (1 - Math.exp(-dt / ZP.bumpTc));
    if (u.zb > ZP.bumpLost && sp > 0.3 * dt) u.zbT = (u.zbT || 0) + dt;
    else u.zbT = Math.max(0, (u.zbT || 0) - dt * 2);
    if (u.zbT > ZP.bumpHold) unstick(z, u, p, ux, uz, tgtY);
  };

  /* ---------------- cleanup ---------------- */
  if (typeof killZ === 'function') {
    const _kz = killZ;
    killZ = function (z) {
      try {
        const u = z && z.userData;
        if (u) {
          u.zp = null;
          u.zs = null;
        }
      } catch (e) {}
      return _kz.apply(this, arguments);
    };
  }
  if (typeof clearWorld === 'function') {
    const _cw = clearWorld;
    clearWorld = function () {
      ZP.stats = {field: 0, astar: 0, partial: 0, unstick: 0, climbs: 0};
      AS.n = 0;
      return _cw.apply(this, arguments);
    };
  }
  window.zpathDebug = () => Object.assign({}, ZP.stats);
  console.log('[zpath] Riposte-style zombie pathfinding ready');
})();
