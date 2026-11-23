/* MINI FORT ZOMBIE - core 09/13: zombies
   Zombie spawn, sight/LOS, navigation flow field, doors, vaulting, obstacle attacks, zMove, updateZombies, look().
   Part of the old js/game/core.js (split in v080). Classic script: shares globals with the other core parts; load in numeric order. */
const ZT = {
  walker: {hp: 50, sp: 2.2, dmg: 12, c: 0x3f6212, s: 1},
  runner: {hp: 30, sp: 4.6, dmg: 8, c: 0x7a8a14, s: 0.9},
  brute: {hp: 140, sp: 1.8, dmg: 25, c: 0x5a1d1d, s: 1.35}
};
function zombie(x, z, kind, isFort) {
  if (blocked(x, z, 0.5)) return;
  const r = Math.random(),
    sg = G.mode === 'SIEGE';
  kind = kind || (r < 0.1 + (sg ? 0.12 : 0) ? 'brute' : r < 0.4 ? 'runner' : 'walker');
  const t = ZT[kind],
    g = new THREE.Group();
  g.position.set(x, 0, z);
  const P = makeHuman({zombie: 1, kind}, g);
  g.scale.setScalar(t.s);
  const hp = t.hp * FORTS[G.fort].z;
  g.userData = {
    kind: 'zombie',
    hp,
    sp: t.sp * rnd(0.9, 1.1) * ZSPD,
    dmg: t.dmg,
    cd: 0,
    lt: Math.random() * 0.2,
    hx: x,
    hz: z,
    w: 0,
    fort: !!isFort,
    hunt: 0,
    lx: x,
    lz: z,
    parts: P,
    run: kind === 'runner',
    tilt: rnd(-0.3, 0.3),
    big: kind === 'brute'
  };
  scene.add(g);
  zombies.push(g);
  if (Math.random() < 0.03) dismemberQuiet(g, 'armL');
  if (Math.random() < 0.03) dismemberQuiet(g, 'armR');
  if (Math.random() < 0.012) dismemberQuiet(g, Math.random() < 0.5 ? 'legL' : 'legR');
  if (!sg && !g.userData.crawl && Math.random() < 0.05) {
    g.userData.sleep = true;
    g.userData.pose = Math.random() < 0.65 ? 'lie' : 'sit';
    sleepPose(g);
  }
}

const sight = [],
  P3 = new THREE.Vector3();
function inBox2(q, p) {
  return p.x >= q.min.x && p.x <= q.max.x && p.z >= q.min.z && p.z <= q.max.z;
}
function segHit2(q, ax, az, bx, bz) {
  let t0 = 0,
    t1 = 1;
  const dx = bx - ax,
    dz = bz - az;
  for (let k = 0; k < 2; k++) {
    const p = k ? az : ax,
      d = k ? dz : dx,
      mn = k ? q.min.z : q.min.x,
      mx = k ? q.max.z : q.max.x;
    if (Math.abs(d) < 1e-9) {
      if (p < mn || p > mx) return false;
    } else {
      let u0 = (mn - p) / d,
        u1 = (mx - p) / d;
      if (u0 > u1) {
        const t = u0;
        u0 = u1;
        u1 = t;
      }
      t0 = Math.max(t0, u0);
      t1 = Math.min(t1, u1);
      if (t0 > t1) return false;
    }
  }
  return true;
}
// exact line-of-sight at head height: every wall / door box is tested as a real segment-vs-box intersection (the old point
// sampling could step right over a thin interior wall). strict = intact window glass blocks too (used for melee reach).
function los(a, b, strict) {
  const x0 = Math.min(a.x, b.x),
    x1 = Math.max(a.x, b.x),
    z0 = Math.min(a.z, b.z),
    z1 = Math.max(a.z, b.z);
  for (const q of solids) {
    if (
      !q ||
      q.bar ||
      (q.win && !strict) ||
      q.max.y <= 1.5 ||
      q.min.y >= 1.5 ||
      q.max.x < x0 ||
      q.min.x > x1 ||
      q.max.z < z0 ||
      q.min.z > z1
    )
      continue;
    if (inBox2(q, a) || inBox2(q, b)) continue;
    if (segHit2(q, a.x, a.z, b.x, b.z)) return false;
  }
  if (sight.length) {
    const dx = b.x - a.x,
      dz = b.z - a.z,
      d = Math.hypot(dx, dz),
      n = Math.ceil(d / 0.3);
    P3.y = 1.5;
    for (let i = 1; i < n; i++) {
      const t = i / n;
      if (t * d > 0.8 && (1 - t) * d > 0.8) {
        P3.x = a.x + dx * t;
        P3.z = a.z + dz * t;
        for (const q of sight) if (q.containsPoint(P3)) return false;
      }
    }
  }
  return true;
}
function idle(z, dt) {
  const u = z.userData,
    p = z.position;
  if (Math.random() < dt * 0.06) S.groan(p);
  u.t = (u.t === undefined ? rnd(0, 5) : u.t) - dt;
  if (u.t <= 0) {
    if (u.w) {
      u.w = 0;
      u.t = rnd(1, 2.5);
    } else if (Math.random() < 0.45) {
      u.w = 1;
      u.t = rnd(2, 5);
      u.a = Math.hypot(u.hx - p.x, u.hz - p.z) > 5 ? Math.atan2(u.hx - p.x, u.hz - p.z) : rnd(0, TAU);
      z.rotation.y = u.a;
    } else {
      u.t = rnd(1, 2.5);
      z.rotation.y += rnd(-1.2, 1.2);
    }
  }
  if (u.w) {
    const s = 0.8 * ZSPD * dt,
      nx = p.x + Math.sin(u.a) * s,
      nz = p.z + Math.cos(u.a) * s;
    // v081: walls at its own height (upstairs too), and never wander off a floor edge or a stair
    if (blocked(nx, nz, 0.4, p.y, 1.8) || (p.y > 0.6 && groundAt(nx, nz, p.y + 0.1) < p.y - 0.45)) {
      u.w = 0;
      u.t = rnd(2, 5);
    } else {
      p.x = nx;
      p.z = nz;
      if (p.y > 0.2) p.y = groundAt(nx, nz, p.y + 0.1);
    }
  }
}

function groundAt(x, z, fy) {
  let gy = 0;
  for (const q of solids) {
    if (!q) continue;
    if (
      q.max.y <= fy + 0.32 &&
      q.max.y > gy &&
      x > q.min.x - 0.3 &&
      x < q.max.x + 0.3 &&
      z > q.min.z - 0.3 &&
      z < q.max.z + 0.3
    )
      gy = q.max.y;
  }
  for (const q of walkables) {
    if (!q) continue;
    if (
      q.max.y <= fy + 0.32 &&
      q.max.y > gy &&
      x > q.min.x - 0.3 &&
      x < q.max.x + 0.3 &&
      z > q.min.z - 0.3 &&
      z < q.max.z + 0.3
    )
      gy = q.max.y;
  }
  return gy;
}

/* ===== NAVIGATION: one shared flow field (Dijkstra from the defenders outward). Walls block; doors, barricades and
   windows are passable at a cost, so zombies route to the cheapest way in and then bash/smash whatever is in the way. ===== */
let NAV = {ok: false, T: 0};
const HD = [],
  HI = [];
let hD = 0,
  hI = 0;
function hPush(d, i) {
  let k = HD.length;
  HD.push(d);
  HI.push(i);
  while (k > 0) {
    const q = (k - 1) >> 1;
    if (HD[q] <= d) break;
    HD[k] = HD[q];
    HI[k] = HI[q];
    k = q;
  }
  HD[k] = d;
  HI[k] = i;
}
function hPop() {
  hD = HD[0];
  hI = HI[0];
  const ld = HD.pop(),
    li = HI.pop(),
    n = HD.length;
  if (n) {
    let k = 0;
    for (;;) {
      let c = 2 * k + 1;
      if (c >= n) break;
      if (c + 1 < n && HD[c + 1] < HD[c]) c++;
      if (HD[c] >= ld) break;
      HD[k] = HD[c];
      HI[k] = HI[c];
      k = c;
    }
    HD[k] = ld;
    HI[k] = li;
  }
}
function navRect(x0, x1, z0, z1, fn) {
  const N = NAV,
    i0 = Math.max(0, Math.ceil((x0 - N.x0) / N.cs - 0.5)),
    i1 = Math.min(N.w - 1, Math.floor((x1 - N.x0) / N.cs - 0.5)),
    j0 = Math.max(0, Math.ceil((z0 - N.z0) / N.cs - 0.5)),
    j1 = Math.min(N.h - 1, Math.floor((z1 - N.z0) / N.cs - 0.5));
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) fn(j * N.w + i);
}
function buildNav() {
  const cs = 0.5,
    x0 = BND[0],
    z0 = BND[2],
    w = Math.ceil((BND[1] - x0) / cs),
    h = Math.ceil((BND[3] - z0) / cs);
  NAV = {
    cs,
    x0,
    z0,
    w,
    h,
    wall: new Uint8Array(w * h),
    extra: new Float32Array(w * h),
    dist: new Float64Array(w * h),
    softObj: new Array(w * h).fill(null),
    sl: [],
    T: 0,
    ok: true
  };
  const W = NAV.wall,
    R = 0.32;
  for (const q of solids) {
    if (!q || (q.door && !q.leaf) || q.bar || q.win) continue;
    if (q.max.y < 0.25 || q.min.y > 1.8) continue;
    navRect(q.min.x - R, q.max.x + R, q.min.z - R, q.max.z + R, i => (W[i] = 1));
  }
  // window openings are carved out of the wall (their cost is added in navSoft)
  for (const w of winList) {
    if (w.pseudo || w.p.y > 2.5) continue;
    const a = w.ax;
    navRect(
      w.p.x - (a ? 0.45 : 0.6),
      w.p.x + (a ? 0.45 : 0.6),
      w.p.z - (a ? 0.6 : 0.45),
      w.p.z + (a ? 0.6 : 0.45),
      i => (W[i] = 0)
    );
  }
  // v043: cells next to walls cost extra so zombies keep ~1 m off walls instead of hugging them
  const nr = (NAV.near = new Float32Array(w * h)),
    NW = NAV.w,
    NH = NAV.h;
  for (let j = 0; j < NH; j++)
    for (let i = 0; i < NW; i++) {
      if (!W[j * NW + i]) continue;
      for (let dj = -2; dj <= 2; dj++) {
        const jj = j + dj;
        if (jj < 0 || jj >= NH) continue;
        for (let di = -2; di <= 2; di++) {
          const ii = i + di;
          if (ii < 0 || ii >= NW) continue;
          const n = jj * NW + ii;
          if (W[n]) continue;
          const c = Math.abs(di) < 2 && Math.abs(dj) < 2 ? 1.2 : 0.6;
          if (c > nr[n]) nr[n] = c;
        }
      }
    }
}
function navSoft() {
  const N = NAV;
  for (const i of N.sl) {
    N.extra[i] = 0;
    N.softObj[i] = null;
  }
  N.sl = [];
  const add = (x0, x1, z0, z1, cost, o) =>
    navRect(x0, x1, z0, z1, i => {
      if (N.wall[i]) return;
      N.extra[i] += cost;
      N.softObj[i] = o;
      N.sl.push(i);
    });
  for (const d of doors) {
    if (d.open || !d.sol) continue;
    const q = d.sol,
      a = q.max.x - q.min.x > q.max.z - q.min.z;
    add(q.min.x - (a ? 0 : 0.3), q.max.x + (a ? 0 : 0.3), q.min.z - (a ? 0.3 : 0), q.max.z + (a ? 0.3 : 0), 6, {
      t: 'door',
      o: d
    });
  }
  for (const w of winList) {
    if (w.pseudo || w.p.y > 2.5) continue;
    const a = w.ax;
    add(
      w.p.x - (a ? 0.45 : 0.6),
      w.p.x + (a ? 0.45 : 0.6),
      w.p.z - (a ? 0.6 : 0.45),
      w.p.z + (a ? 0.6 : 0.45),
      w.alive ? 7 : 1.5,
      {t: 'win', o: w}
    );
  }
  for (const b of G.bars)
    for (const bx of b.boxes || [b.box])
      add(bx.min.x - 0.32, bx.max.x + 0.32, bx.min.z - 0.32, bx.max.z + 0.32, 4 + b.hp * 0.08, {t: 'bar', o: b});
}
const NDX = [1, -1, 0, 0, 1, 1, -1, -1],
  NDZ = [0, 0, 1, -1, 1, -1, 1, -1];
function navField(horde) {
  const N = NAV;
  if (!N.ok) return;
  const act = zombies.filter(z => horde || z.userData.see || z.userData.hunt > 0);
  if (!act.length) return;
  navSoft();
  const w = N.w,
    h = N.h,
    D = N.dist,
    W = N.wall,
    X = N.extra,
    cs = N.cs;
  D.fill(1e9);
  HD.length = 0;
  HI.length = 0;
  const cell = (x, z) =>
    Math.max(0, Math.min(h - 1, Math.floor((z - N.z0) / cs))) * w +
    Math.max(0, Math.min(w - 1, Math.floor((x - N.x0) / cs)));
  const seed = (x, z) => {
    const i = cell(x, z);
    if (D[i] > 0) {
      D[i] = 0;
      hPush(0, i);
    }
  };
  seed(pl.position.x, pl.position.z);
  smesh.forEach(m => {
    if (m.userData.s && m.userData.s.hp > 0) seed(m.position.x, m.position.z);
  });
  const need = new Set();
  act.forEach(z => need.add(cell(z.position.x, z.position.z)));
  const maxD = horde ? 1e9 : 90;
  while (HD.length) {
    hPop();
    const d = hD,
      i = hI;
    if (d > D[i]) continue;
    if (d > maxD || (need.delete(i) && !need.size)) break;
    const ix = i % w,
      iz = (i / w) | 0;
    for (let k = 0; k < 8; k++) {
      const nx = ix + NDX[k],
        nz = iz + NDZ[k];
      if (nx < 0 || nz < 0 || nx >= w || nz >= h) continue;
      const n = nz * w + nx;
      if (W[n]) continue;
      if (k > 3 && (W[iz * w + nx] || W[nz * w + ix])) continue;
      const nd = d + (k > 3 ? 1.414 * cs : cs) + X[n] + N.near[n];
      if (nd < D[n]) {
        D[n] = nd;
        hPush(nd, n);
      }
    }
  }
}
function navNext(x, z) {
  const N = NAV,
    w = N.w,
    D = N.dist,
    W = N.wall,
    ix = Math.floor((x - N.x0) / N.cs),
    iz = Math.floor((z - N.z0) / N.cs);
  if (ix < 0 || iz < 0 || ix >= w || iz >= N.h) return null;
  const i0 = iz * w + ix;
  let bd = D[i0],
    bi = -1;
  if (bd >= 1e8) return null;
  for (let k = 0; k < 8; k++) {
    const nx = ix + NDX[k],
      nz = iz + NDZ[k];
    if (nx < 0 || nz < 0 || nx >= w || nz >= N.h) continue;
    const n = nz * w + nx;
    if (W[n]) continue;
    if (k > 3 && (W[iz * w + nx] || W[nz * w + ix])) continue;
    if (D[n] < bd - 1e-3) {
      bd = D[n];
      bi = n;
    }
  }
  if (bi < 0) return null;
  return {x: N.x0 + ((bi % w) + 0.5) * N.cs, z: N.z0 + ((bi / w) | 0) * N.cs + N.cs * 0.5, o: N.softObj[bi]};
}
/* ===== shared movement helpers ===== */
const angD = (a, b) => {
  let d = a - b;
  while (d > Math.PI) d -= TAU;
  while (d < -Math.PI) d += TAU;
  return d;
};
function doorOf(b) {
  return b && b.door ? b.door : null;
}
/* v076 doors: always solid. Closed = d.sol across the doorway; open = d.solO, a box where the leaf actually stands at 90 degrees (marked .leaf,
   so the nav grid treats it as a wall and zombies route round it, or bash through it when it is in their way). There are no half-open doors:
   ruined buildings get doors that are fully open, closed or gone. A door swings away from whoever opens it, or whichever way is not into a wall. */
function doorLeaf(d) {
  return d.p && d.p.children.find(c => c.userData && c.userData.kind === 'door');
}
function doorBoxAt(d, ang) {
  const pv = d.p,
    dr = doorLeaf(d);
  if (!dr) return null;
  const r0 = pv.rotation.y;
  pv.rotation.y = (d.b || 0) + ang;
  pv.updateWorldMatrix(true, true);
  const b = new THREE.Box3().setFromObject(dr).expandByScalar(0.05);
  pv.rotation.y = r0;
  pv.updateWorldMatrix(true, true);
  return b;
}
function doorSwing(d, fx, fz) {
  const sg = d.sg || 1,
    opts = [];
  for (const s of [sg, -sg]) {
    const b = doorBoxAt(d, (-s * Math.PI) / 2);
    if (!b) continue;
    const t = b.clone().expandByScalar(-0.18);
    let hit = 0;
    for (const q of solids) {
      if (!q || q === d.sol || q === d.solO || q.door || q.win || q.bar || !isFinite(q.min.x) || q.max.y < 0.4)
        continue;
      if (t.intersectsBox(q)) {
        hit = 1;
        break;
      }
    }
    const c = b.getCenter(new THREE.Vector3()),
      away = fx === undefined ? 0 : Math.hypot(c.x - fx, c.z - fz);
    opts.push({s, b, hit, away});
  }
  opts.sort((a, b) => a.hit - b.hit || b.away - a.away);
  return opts[0] || null;
}
/* v089: a sliding glass leaf (d.slide) has no swing: it runs SLIDE_D along its track. Its open box is the leaf where it ends up. */
function slideBox(d) {
  const lf = d.lf,
    x0 = lf.position.x;
  lf.position.x = d.lx + d.slide * SLIDE_D;
  lf.updateMatrix();
  lf.updateWorldMatrix(true, true);
  const b = new THREE.Box3().setFromObject(lf).expandByScalar(0.05);
  lf.position.x = x0;
  lf.updateMatrix();
  lf.updateWorldMatrix(true, true);
  return b;
}
/* v089: a roller door (d.roll) rolls up into its head: the open box is the strip left at the top, above head height. */
function rollBox(d) {
  const lf = d.lf,
    s0 = lf.scale.y,
    y0 = lf.position.y;
  lf.scale.y = ROLL_MIN;
  lf.position.y = d.rh * (1 - ROLL_MIN / 2);
  lf.updateMatrix();
  lf.updateWorldMatrix(true, true);
  const b = new THREE.Box3().setFromObject(lf).expandByScalar(0.03);
  lf.scale.y = s0;
  lf.position.y = y0;
  lf.updateMatrix();
  lf.updateWorldMatrix(true, true);
  return b;
}
function doorOpen(d, fx, fz, instant) {
  if (!d || d.open) return false;
  if ((d.slide || d.roll) && d.lf) {
    const i = solids.indexOf(d.sol);
    if (i >= 0) solids.splice(i, 1);
    d.solO = d.roll ? rollBox(d) : slideBox(d);
    d.solO.door = d;
    d.solO.leaf = 1;
    solids.push(d.solO);
    d.open = 1;
    d.t = 1;
    if (instant) d.a = d.t;
    else S.door(1, d.sol.getCenter(P3));
  } else {
    const o = doorSwing(d, fx, fz);
    if (!o) return false;
    const i = solids.indexOf(d.sol);
    if (i >= 0) solids.splice(i, 1);
    d.solO = o.b;
    d.solO.door = d;
    d.solO.leaf = 1;
    solids.push(d.solO);
    d.open = 1;
    d.t = (-o.s * Math.PI) / 2;
    if (instant) d.a = d.t;
    else S.door(1, d.sol.getCenter(P3));
  }
  // v089: double doors open together (and an opened pair is no longer locked)
  if (d.pair) {
    d.locked = false;
    if (doors.indexOf(d.pair) >= 0) {
      d.pair.locked = false;
      if (!d.pair.open) doorOpen(d.pair, fx, fz, instant);
    }
  }
  return true;
}
function doorClose(d, instant) {
  if (!d || !d.open) return false;
  if (d.solO) {
    const i = solids.indexOf(d.solO);
    if (i >= 0) solids.splice(i, 1);
  }
  {
    const q = d.sol,
      c = q.getCenter(P3),
      tx = q.max.x - q.min.x < q.max.z - q.min.z,
      P = pl.position;
    if (P.x > q.min.x - 0.45 && P.x < q.max.x + 0.45 && P.z > q.min.z - 0.45 && P.z < q.max.z + 0.45) {
      const sg = (tx ? P.x - c.x : P.z - c.z) >= 0 ? 1 : -1;
      if (tx) P.x = sg > 0 ? q.max.x + 0.6 : q.min.x - 0.6;
      else P.z = sg > 0 ? q.max.z + 0.6 : q.min.z - 0.6;
    }
  }
  solids.push(d.sol);
  d.open = 0;
  d.t = 0;
  if (instant) d.a = 0;
  else S.door(0, d.sol.getCenter(P3));
  if (d.pair && d.pair.open && doors.indexOf(d.pair) >= 0) doorClose(d.pair, instant); // v089: double doors close together
  return true;
}
function openDoor(d) {
  if (d.open || d.locked) return;
  doorOpen(d);
}
function winNear(x, z, r) {
  for (const w of winList) if (!w.pseudo && w.p.y < 2.5 && Math.hypot(x - w.p.x, z - w.p.z) < r) return w;
  return null;
}
// vault over a low obstacle: scan for a free landing spot on the far side, then animate the hop (can't get stuck inside the sill)
function startVault(o, u, dx, dz) {
  const p = o.position,
    l = Math.hypot(dx, dz) || 1;
  dx /= l;
  dz /= l;
  let seen = false,
    lx = null,
    lz = null;
  for (let k = 0.25; k <= 5; k += 0.25) {
    const x = p.x + dx * k,
      z = p.z + dz * k;
    if (blocked(x, z, 0.3, 0, 1.8)) seen = true;
    else if (seen) {
      lx = x;
      lz = z;
      break;
    }
  }
  if (lx === null) return false;
  u.vs = [p.x, p.z];
  u.ve = [lx, lz];
  u.vt = 0;
  u.vd = 0.5 + Math.hypot(lx - p.x, lz - p.z) * 0.07;
  u.vh = 1.35;
  return true;
}
function stepVault(o, u, dt) {
  u.vt += dt;
  const k = Math.min(1, u.vt / u.vd),
    p = o.position;
  p.x = u.vs[0] + (u.ve[0] - u.vs[0]) * k;
  p.z = u.vs[1] + (u.ve[1] - u.vs[1]) * k;
  // v081: from the height it started at to the height it lands at (a stair foot, a step), not from / to the ground
  const y0 = u.vy0 || 0,
    y1 = u.vy1 === undefined ? y0 : u.vy1;
  p.y = y0 + (y1 - y0) * k + Math.sin(k * Math.PI) * u.vh;
  if (k >= 1) {
    u.vs = null;
    u.vt = 0;
    p.y = groundAt(p.x, p.z, y1 + 0.5);
    u.vy0 = u.vy1 = undefined;
  }
}
/* ===== committed obstacle attacks: once a zombie starts on a door / window / barricade it keeps at it until it is destroyed ===== */
function atkValid(u, p) {
  const a = u.atk;
  if (!a) return false;
  let ok = false,
    x,
    z;
  if (a.t === 'door') {
    ok = doors.includes(a.o);
    const q = a.o.open && a.o.solO ? a.o.solO : a.o.sol;
    x = (q.min.x + q.max.x) / 2;
    z = (q.min.z + q.max.z) / 2;
  } else if (a.t === 'win') {
    ok = a.o.alive;
    x = a.o.p.x;
    z = a.o.p.z;
  } else {
    ok = G.bars.includes(a.o);
    {
      const q = fzBarNear(a.o, p.x, p.z);
      x = q[0];
      z = q[1];
    }
    // a barricade is only worth bashing if the flow field still routes through it (doors and windows are always finished)
    if (ok && NAV.ok) {
      const n = navNext(p.x, p.z);
      if (n && !(n.o && n.o.o === a.o)) ok = false;
    }
  }
  if (ok && Math.hypot(p.x - x, p.z - z) > 3.2) ok = false;
  if (!ok) {
    u.atk = null;
    return false;
  }
  u.fx = x;
  u.fz = z;
  return true;
}
function atkDo(z, u, p, dt) {
  const a = u.atk,
    o = a.o;
  if (a.t === 'door') {
    if (u.cd <= 0) {
      u.cd = 0.5;
      S.zbash('door', p);
      u.wsw = 0.3;
    }
    o.sh = 0.25;
    if ((o.hp -= fzBar(u) * dt * 1.2) <= 0) doorBreak(o);
  } else if (a.t === 'win') {
    u.wh = (u.wh || 0) + dt;
    if (u.cd <= 0) {
      u.cd = 0.45;
      S.zbash('win', p);
      u.wsw = 0.3;
    }
    if (u.wh > 1.1) {
      u.wh = 0;
      breakWin(o);
    }
  } else {
    if (u.cd <= 0) {
      u.cd = 1;
      S.zbash('bar', p);
      u.wsw = 0.35;
      o.hp -= fzBar(u);
      if (o.hp <= 0) breakBar(o);
      else tint(o);
    }
  }
}
/* v090: zombie melee reach halved (was 1.9 standing / 1.4 crawling). They now walk in to just inside it before stopping. */
var ZREACH = (window.ZREACH = {stand: 0.95, crawl: 0.7});
function zStopAt(u) {
  return (u && u.crawl ? ZREACH.crawl : ZREACH.stand) - 0.2;
}
function zMove(z, u, p, dt, best, tp, useField) {
  if (best < zStopAt(u)) return;
  const night = G.time >= 20 || G.time < 5,
    sp = u.sp * (night ? 1.2 : 1) * dt;
  let wx = tp.x,
    wz = tp.z,
    nx0 = null;
  if (useField && NAV.ok) {
    nx0 = navNext(p.x, p.z);
    if (nx0) {
      wx = nx0.x;
      wz = nx0.z;
    }
  }
  let dx = wx - p.x,
    dz = wz - p.z,
    d = Math.hypot(dx, dz);
  if (d < 0.04) {
    dx = tp.x - p.x;
    dz = tp.z - p.z;
    d = Math.hypot(dx, dz) || 1;
  }
  const ux = dx / d,
    uz = dz / d,
    tx = p.x + ux * sp,
    tz = p.z + uz * sp,
    bl = blocked(tx, tz, 0.3, p.y, 1.8);
  if (!bl) {
    p.x = tx;
    p.z = tz;
    u.stk = 0;
    return;
  }
  // bash/smash only what the route goes through (or anything, if there is no route yet); otherwise just slide round it
  const wants = o => !nx0 || (nx0.o && nx0.o.o === o);
  if (bl.door && wants(bl.door)) {
    u.atk = {t: 'door', o: bl.door};
    if (bl.door.hp === undefined) bl.door.hp = 50;
    return;
  }
  if (bl.bar && wants(bl.bar)) {
    u.atk = {t: 'bar', o: bl.bar};
    return;
  }
  if (bl.win && wants(bl.win)) {
    u.atk = {t: 'win', o: bl.win};
    return;
  }
  if (bl.max.y <= 1.3 && !bl.bar && !bl.door && !bl.win) {
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
  if (!blocked(tx, p.z, 0.3, p.y, 1.8)) p.x = tx;
  else if (!blocked(p.x, tz, 0.3, p.y, 1.8)) p.z = tz;
  else {
    u.stk = (u.stk || 0) + dt;
    if (u.stk > 0.8) {
      u.stk = 0;
      const ax = p.x + rnd(-0.4, 0.4),
        az = p.z + rnd(-0.4, 0.4);
      if (!blocked(ax, az, 0.3, p.y, 1.8)) {
        p.x = ax;
        p.z = az;
      }
      NAV.T = 0;
    }
  }
}
/* v075: the player can shoot and melee doors down too. Bullets / blows chip the door's hp (the zombies' bash uses the same pool), it shakes on
   every hit, and at 0 it breaks off its hinges exactly like a zombie break-in. Locked doors have 110 hp instead of 50. */
function doorHit(d, dmg, src) {
  if (!d || doors.indexOf(d) < 0) return false;
  d.hp -= dmg;
  d.sh = 0.25;
  const pc = Math.max(0, Math.round((d.hp / (d.hp0 || 50)) * 100));
  if (d.hp <= 0) {
    doorBreak(d);
    fb('DOOR BROKEN', '#facc15');
    return true;
  }
  try {
    S.hit(src === 'melee' ? 'blunt' : 'blunt');
  } catch (e) {}
  fb((d.locked && !d.open ? 'LOCKED DOOR ' : 'DOOR ') + pc + '%', '#e9b43c');
  return true;
}
function doorBreak(d) {
  const k = solids.indexOf(d.sol);
  if (k >= 0) solids.splice(k, 1);
  if (d.solO) {
    const k2 = solids.indexOf(d.solO);
    if (k2 >= 0) solids.splice(k2, 1);
  }
  if (d.p.parent) d.p.parent.remove(d.p);
  const j = doors.indexOf(d);
  if (j >= 0) doors.splice(j, 1);
  S.door(1, d.sol.getCenter(P3));
}
function updateZombies(dt1) {
  const dt = dt1;
  const night = G.time >= 20 || G.time < 5,
    horde = G.mode === 'SIEGE',
    p0 = pl.position,
    sr = (night ? 14 : 24) * (K.ShiftLeft ? 1.3 : 1) * (G.crouch ? 0.7 : 1) * skSneakMul(G);
  NAV.T -= dt;
  if (NAV.ok && NAV.T <= 0) {
    NAV.T = 0.45;
    navField(horde);
  }
  zombies.forEach(z => {
    let dt = dt1;
    {
      const u0 = z.userData,
        dx0 = z.position.x - p0.x,
        dz0 = z.position.z - p0.z;
      if (
        !horde &&
        dx0 * dx0 + dz0 * dz0 > 3600 &&
        !u0.atk &&
        !u0.vs &&
        !(u0.ragT > 0) &&
        !(u0.rise > 0) &&
        !u0.sleep
      ) {
        u0.lod = (u0.lod || 0) + dt1;
        if (((PERF.n + (u0.zi || (u0.zi = ++PERF.zc))) & 3) !== 0) return;
        dt = u0.lod;
        u0.lod = 0;
      }
    }
    const u = z.userData,
      p = z.position;
    u.cd -= dt;
    u.lt -= dt;
    u.fx = undefined;
    if (u.kd) {
      if (typeof zKnockStep === 'function') zKnockStep(z, dt);
      else u.kd = null;
      return;
    } // v072: knocked down (failed jump / bowled over), ragdoll then get up
    if (
      u.md &&
      u.md.busy &&
      window.fzMedicTick &&
      !u.sleep &&
      !(u.rise > 0) &&
      !(u.ragT > 0) &&
      !(u.flop > 0) &&
      !u.vs
    ) {
      window.fzMedicTick(z, dt);
      return;
    }
    if (u.sleep) return;
    if (u.rise > 0) {
      riseStep(z, dt);
      return;
    }
    if (u.ragT > 0) {
      u.ragT -= dt;
      ragStep(z, dt);
      if (u.ragT <= 0) ragEnd(z);
      return;
    }
    if (u.flop > 0) {
      u.flop -= dt;
      z.rotation.x = -1.45;
      p.y = 0.25;
      if (u.flop <= 0) {
        p.y = 0;
        z.lookAt(p0.x, 0, p0.z);
        u.cl = rnd(1, 2);
      }
      return;
    }
    if (u.vs) {
      stepVault(z, u, dt);
      return;
    }
    if (u.tk) {
      if (typeof fzTackleStep === 'function' && !u.crawl) fzTackleStep(z, dt);
      else u.tk = null;
      return;
    }
    if (u.aimG) {
      if (window.fzAimStep && !u.crawl && u.gun) fzAimStep(z, dt);
      else u.aimG = null;
      return;
    } /* v075: an armed zombie taking aim stands still (skills.js) */ // v072: football kneel / charge owns the zombie
    let tp = p0,
      tS = null,
      best = Math.hypot(p.x - p0.x, p.z - p0.z);
    const committed = u.atk && atkValid(u, p);
    smesh.forEach(m => {
      const d = Math.hypot(p.x - m.position.x, p.z - m.position.z);
      if (m.userData.s.hp > 0 && d < best && (horde || (d < 20 * skSneakMul(m.userData.s) && losC(z, m)))) {
        best = d;
        tp = m.position;
        tS = m.userData.s;
      }
    });
    if (!horde && !tS && !committed) {
      if (u.lt <= 0) {
        u.lt = 0.2 + Math.random() * 0.1;
        const f = Math.sin(z.rotation.y) * (p0.x - p.x) + Math.cos(z.rotation.y) * (p0.z - p.z);
        u.see = best < sr * (u.see ? 1.15 : 1) && (u.see || f > best * 0.26) && los(p, p0);
      }
      if (u.see) {
        u.hunt = 2 * skForget(G);
        /* v079: memory halved again (was 4) */ u.lx = p0.x;
        u.lz = p0.z;
        u.ly = p0.y - (G.eyeUsed || 1.6); // v081: and which floor you were on
        u.was = 1;
        u.lk = 0;
        if (Math.random() < dt * 0.25) S.groan(p);
      }
      if (!u.see) {
        if (u.hunt > 0) {
          u.hunt -= dt;
          tp = {x: u.lx, z: u.lz, y: u.ly || 0, userData: {}};
          if (Math.hypot(p.x - u.lx, p.z - u.lz) < 0.9 && Math.abs(p.y - (u.ly || 0)) < 1.2) u.hunt = 0;
        } else if (u.was) {
          u.was = 0;
          S.lost(p);
          u.lk = rnd(1.5, 2.5);
          u.ld = z.rotation.y;
        }
        if (u.hunt <= 0) {
          if (u.lk > 0) {
            u.lk -= dt;
            const s = u.sp * 0.7 * dt,
              nx = p.x + Math.sin(u.ld) * s,
              nz = p.z + Math.cos(u.ld) * s;
            if (blocked(nx, nz)) u.lk = 0;
            else {
              p.x = nx;
              p.z = nz;
            }
            if (u.lk <= 0) {
              u.hx = p.x;
              u.hz = p.z;
              u.t = rnd(1, 2.5);
              u.w = 0;
            }
            return;
          }
          return idle(z, dt);
        }
      }
    }
    if (horde && Math.random() < dt * 0.08) S.groan(p);
    const tgt = tp;
    if (committed) atkDo(z, u, p, dt);
    else zMove(z, u, p, dt, best, tp, horde || tS || u.see);
    p.y = groundAt(p.x, p.z, p.y + 1);
    zombies.forEach(o => {
      if (o === z) return;
      const ox = p.x - o.position.x,
        oz = p.z - o.position.z,
        dd = Math.hypot(ox, oz);
      if (dd > 0 && dd < 0.8 && Math.abs(o.position.y - p.y) < 1.2) {
        // v081: only zombies on the same floor push apart, against walls at their own height
        const px = p.x + (ox / dd) * 3 * dt,
          pz = p.z + (oz / dd) * 3 * dt;
        if (!blocked(px, pz, 0.3, p.y, 1.8) && (p.y < 0.6 || groundAt(px, pz, p.y + 0.1) > p.y - 0.45)) {
          p.x = px;
          p.z = pz;
        }
      }
    });
    z.lookAt(u.fx !== undefined ? u.fx : tp.x, p.y, u.fx !== undefined ? u.fz : tp.z); // v081: level, on any floor (was y 0)
    const tfy = tgt === p0 ? p0.y - (G.eyeUsed || 1.6) : tgt.y || 0;
    if (
      best <= (u.crawl ? ZREACH.crawl : ZREACH.stand) && // v090: was 1.4 / 1.9
      u.cd <= 0 &&
      Math.abs(p.y - tfy) < 1.7 &&
      (horde ? los(p, tgt, 1) : tS ? los(p, tgt, 1) : los(p, p0, 1))
    ) {
      u.cd = 1;
      S.zclaw(p); // v093: claws / teeth land; the snarl stays for the first sighting, tackles and climbs
      if (tS && Math.random() < zMiss(tS)) {
        zMissFx(p, 0);
      } else if (tS) {
        tS.hp -= u.dmg * (horde ? 1.8 : 1.4) * skDmgMul(tS);
        {
          const sm = smesh.find(q => q.userData.s === tS);
          if (sm) {
            flashObj(sm, 0.3);
            bloodSpray(
              sm.position.x,
              sm.position.y + 1.1,
              sm.position.z,
              sm.position.x - p.x,
              sm.position.z - p.z,
              ri(6, 10),
              1
            );
          }
        }
        if (tS.hp <= 0) {
          toast(tS.name + ' has fallen!');
          const m = smesh.find(q => q.userData.s === tS);
          if (m) {
            S.scream(m.position);
            smesh = smesh.filter(q => q !== m);
            if (window.survDown) survDown(m, p);
            else scene.remove(m);
          }
        }
      } else {
        if (Math.random() < zMiss(G)) zMissFx(p, 1);
        else damage(u.dmg);
      }
    }
  });
  zombies.forEach(z => fzZAct(z, dt, horde));
  zombies.forEach(z => animZ(z, dt, horde));
  zombies.forEach(z => {
    const u = z.userData;
    if (u.wsw > 0) {
      u.wsw -= dt;
      const P = u.parts;
      if (P) P.armL.rotation.x = P.armR.rotation.x = -2.4 + Math.sin(u.wsw * 30) * 0.7;
    }
  });
  zombies.forEach(z => {
    const u = z.userData;
    if (u.flash > 0) {
      u.flash -= dt;
      if (u.flash <= 0) tintHit(z, 0);
    }
    if (u.stag > 0) {
      u.stag -= dt;
      const P = u.parts;
      if (P && !u.crawl) {
        P.body.rotation.x = -0.35;
        P.head.rotation.x = -0.5;
      }
    }
  });
  smesh.forEach(m => {
    hpDraw(m);
    const u = m.userData;
    if (u.flash > 0) {
      u.flash -= dt;
      if (u.flash <= 0) tintHit(m, 0);
    }
    if (u.aimT > 0) {
      u.aimT -= dt;
      if (u.aimT <= 0) armDefault(m);
    }
  });
  zombies.forEach(z => zHpTag(z, horde));
  G.spikes.slice().forEach(s => {
    s.t = (s.t || 0) - dt;
    if (s.t > 0) return;
    let hit = false;
    zombies.forEach(z => {
      if (Math.hypot(z.position.x - s.x, z.position.z - s.z) < 1.4) {
        hit = true;
        z.userData.hp -= 12;
        dmgNum(z, 12, '#c9d4e0');
        s.hp -= 3;
        if (z.userData.hp <= 0) window.MFZGORE && MFZGORE.lethal ? MFZGORE.lethal(z, 'torso', s) : killZ(z); // v089: spikes destroy the torso
      }
    });
    if (hit) {
      s.t = 0.5;
      if (s.hp <= 0) {
        scene.remove(s.mesh);
        G.spikes = G.spikes.filter(q => q !== s);
        toast('A spike trap wore out');
      }
    }
  });
}
function damage(a) {
  a *= skDmgMul(G);
  G.hp = Math.max(0, G.hp - a);
  S.hurt();
  $('dv').style.opacity = 1;
  setTimeout(() => ($('dv').style.opacity = 0), 300);
  if (G.hp <= 0) finish(false, 'You were killed.');
}

function own(o) {
  while (o && !o.userData.kind) o = o.parent;
  return o;
}
function look(thru, v) {
  ray.setFromCamera(v || C0, camera);
  ray.far = 40;
  for (const i of ray.intersectObjects(scene.children, true)) {
    const o = own(i.object);
    if (thru && o && o.userData.kind === 'glass') {
      breakWin(o.userData.w, true);
      continue;
    }
    if (thru && o && o.userData.thru) continue;
    return {
      o,
      d: i.distance,
      m: i.object,
      p: i.point,
      n: i.face ? i.face.normal.clone().transformDirection(i.object.matrixWorld) : null
    };
  }
  return null;
}
function fb(t, c) {
  const e = $('fb');
  e.textContent = t;
  e.style.color = c;
  e.style.opacity = 1;
  clearTimeout(fbT);
  fbT = setTimeout(() => (e.style.opacity = 0), 500);
}
let vms = [];
