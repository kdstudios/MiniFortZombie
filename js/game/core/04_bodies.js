/* MINI FORT ZOMBIE - core 04/13: bodies
   Blood, decals, floating text, damage numbers, HP tags, limbs, dismemberment, hitZ, ragdolls, sleep/rise, windows/shards, killZ, corpses.
   Part of the old js/game/core.js (split in v080). Classic script: shares globals with the other core parts; load in numeric order. */
/* ===== BLOOD, DECALS, LIMBS, FLOATING TEXT, DISMEMBERMENT ===== */
let bloodP = [],
  decals = [],
  limbs = [],
  floats = [];
const BG = new THREE.BoxGeometry(0.05, 0.05, 0.05),
  BMAT = [0x8a0303, 0x6e0000, 0xa50505].map(c => new THREE.MeshBasicMaterial({color: c})),
  DGEO = new THREE.PlaneGeometry(1, 1);
const DMAT = (() => {
  const a = [];
  for (let k = 0; k < 4; k++) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 64;
    const c = cv.getContext('2d');
    for (let i = 0, n = ri(5, 9); i < n; i++) {
      const r = rnd(3, 12),
        x = 32 + rnd(-16, 16),
        y = 32 + rnd(-16, 16),
        g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, 'rgba(115,0,0,.95)');
      g.addColorStop(0.7, 'rgba(90,0,0,.85)');
      g.addColorStop(1, 'rgba(70,0,0,0)');
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, y, r, 0, TAU);
      c.fill();
    }
    a.push(
      new THREE.MeshBasicMaterial({
        map: new THREE.CanvasTexture(cv),
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        polygonOffsetUnits: -4
      })
    );
  }
  return a;
})();
function addDecal(x, y, z, ry, rx, size) {
  const m = new THREE.Mesh(DGEO, PK(DMAT));
  m.position.set(x, y, z);
  m.rotation.set(rx, ry, rnd(0, TAU));
  m.scale.set(size, size, 1);
  m.raycast = () => {};
  m.renderOrder = 2;
  scene.add(m);
  decals.push(m);
  if (decals.length > 300) scene.remove(decals.shift());
}
function bloodPool(x, z, size) {
  addDecal(x, groundAt(x, z, pl.position.y) + 0.05, z, 0, -PI / 2, size || rnd(1.1, 1.8));
}
function bloodSpray(x, y, z, dx, dz, n, spd) {
  const l = Math.hypot(dx, dz) || 1;
  dx /= l;
  dz /= l;
  spd = spd || 1;
  for (let i = 0; i < n; i++) {
    if (bloodP.length > 240) scene.remove(bloodP.shift().m);
    const m = new THREE.Mesh(BG, PK(BMAT));
    m.position.set(x, y, z);
    m.raycast = () => {};
    m.scale.setScalar(rnd(0.6, 1.6));
    scene.add(m);
    bloodP.push({
      m,
      vx: dx * rnd(0.5, 3.5) * spd + rnd(-1.6, 1.6),
      vy: rnd(0.4, 3.4) * spd + 0.3,
      vz: dz * rnd(0.5, 3.5) * spd + rnd(-1.6, 1.6),
      t: 0
    });
  }
}
function updBlood(dt) {
  for (let i = bloodP.length - 1; i >= 0; i--) {
    const b = bloodP[i],
      m = b.m,
      p = m.position;
    b.t += dt;
    b.vy -= 14 * dt;
    const nx = p.x + b.vx * dt,
      ny = p.y + b.vy * dt,
      nz = p.z + b.vz * dt;
    let done = false;
    if (ny < 2.8) {
      const gy = groundAt(nx, nz, ny + 0.3);
      if (ny <= gy + 0.03) {
        if (Math.random() < 0.55) addDecal(nx, gy + 0.045 + Math.random() * 0.012, nz, 0, -PI / 2, rnd(0.25, 0.7));
        done = true;
      }
    }
    if (!done) {
      const q = blocked(nx, nz, 0.04, ny - 0.1, 0.2);
      if (q && !q.win) {
        let ry = null,
          fx = nx,
          fz = nz;
        if (p.x < q.min.x) {
          ry = -PI / 2;
          fx = q.min.x - 0.012;
        } else if (p.x > q.max.x) {
          ry = PI / 2;
          fx = q.max.x + 0.012;
        } else if (p.z < q.min.z) {
          ry = PI;
          fz = q.min.z - 0.012;
        } else if (p.z > q.max.z) {
          ry = 0;
          fz = q.max.z + 0.012;
        }
        if (ry !== null && ny < q.max.y && Math.random() < 0.5)
          addDecal(fx, Math.max(0.15, ny), fz, ry, 0, rnd(0.2, 0.55));
        done = true;
      }
    }
    if (done || b.t > 2.5) {
      scene.remove(m);
      bloodP.splice(i, 1);
      continue;
    }
    p.set(nx, ny, nz);
  }
}
function floatText(x, y, z, txt, col) {
  const cv = document.createElement('canvas');
  cv.width = 192;
  cv.height = 64;
  const c = cv.getContext('2d');
  c.font = 'bold 44px Impact,sans-serif';
  c.textAlign = 'center';
  c.lineWidth = 6;
  c.strokeStyle = '#000';
  c.strokeText(txt, 96, 46);
  c.fillStyle = col;
  c.fillText(txt, 96, 46);
  const sp = new THREE.Sprite(
    new THREE.SpriteMaterial({map: new THREE.CanvasTexture(cv), transparent: true, depthTest: false})
  );
  sp.scale.set(1.5, 0.5, 1);
  sp.position.set(x, y, z);
  sp.renderOrder = 10;
  sp.raycast = () => {};
  scene.add(sp);
  floats.push({sp, t: 0});
}
function updFloats(dt) {
  for (let i = floats.length - 1; i >= 0; i--) {
    const f = floats[i];
    f.t += dt;
    f.sp.position.y += dt * 0.9;
    f.sp.material.opacity = Math.max(0, 1 - f.t / 1.1);
    if (f.t > 1.1) {
      scene.remove(f.sp);
      floats.splice(i, 1);
    }
  }
}
/* ===== zombie HP tags (while hunting) + floating damage numbers: shared textures, pooled sprites, no per-hit allocation ===== */
const numTexCache = new Map();
function numTex(txt, col) {
  const key = txt + '|' + col;
  let t = numTexCache.get(key);
  if (!t) {
    const cv = document.createElement('canvas');
    cv.width = 128;
    cv.height = 48;
    const c = cv.getContext('2d');
    c.font = 'bold 38px Impact,Arial,sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.lineJoin = 'round';
    c.lineWidth = 7;
    c.strokeStyle = '#000';
    c.strokeText(txt, 64, 26);
    c.fillStyle = col;
    c.fillText(txt, 64, 26);
    t = new THREE.CanvasTexture(cv);
    numTexCache.set(key, t);
    if (numTexCache.size > 700) numTexCache.delete(numTexCache.keys().next().value);
  }
  return t;
}
let dnPool = [],
  dnAct = [];
function dmgNum(z, d, col) {
  const v = Math.round(d);
  if (!(v > 0) || !scene) return;
  let o = dnPool.pop();
  if (!o) {
    o = {sp: new THREE.Sprite(new THREE.SpriteMaterial({transparent: true, depthTest: false})), t: 0, vx: 0};
    o.sp.renderOrder = 11;
    o.sp.raycast = () => {};
  }
  if (dnAct.length >= 40) {
    const old = dnAct.shift();
    scene.remove(old.sp);
    dnPool.push(old);
  }
  o.sp.material.map = numTex(String(v), col || (v >= 40 ? '#ffd24a' : '#ff5a4a'));
  o.sp.material.needsUpdate = true;
  o.sp.material.opacity = 1;
  o.t = 0;
  o.vx = rnd(-0.5, 0.5);
  o.sp.position.set(z.position.x + rnd(-0.25, 0.25), z.position.y + 2.1 * z.scale.x, z.position.z + rnd(-0.25, 0.25));
  scene.add(o.sp);
  dnAct.push(o);
}
function updDmgNums(dt) {
  for (let i = dnAct.length - 1; i >= 0; i--) {
    const o = dnAct[i];
    o.t += dt;
    o.sp.position.y += dt * 1.1;
    o.sp.position.x += o.vx * dt;
    o.sp.material.opacity = Math.max(0, 1 - Math.max(0, o.t - 0.45) / 0.45);
    const k = Math.max(1, Math.min(3, o.sp.position.distanceTo(pl.position) / 10));
    o.sp.scale.set(0.9 * k, 0.34 * k, 1);
    if (o.t > 0.9) {
      scene.remove(o.sp);
      dnAct.splice(i, 1);
      dnPool.push(o);
    }
  }
}
function zHpTag(z, horde) {
  const u = z.userData;
  let s = u.hpTag;
  const on =
    false &&
    u.kind === 'zombie' &&
    !u.sleep &&
    !(u.ragT > 0) &&
    !(u.rise > 0) &&
    (u.hunt > 0 || (horde && Math.hypot(z.position.x - pl.position.x, z.position.z - pl.position.z) < 30));
  if (!on) {
    if (s && s.visible) s.visible = false;
    return;
  }
  if (!s) {
    s = new THREE.Sprite(new THREE.SpriteMaterial({transparent: true, depthTest: false}));
    s.renderOrder = 6;
    s.raycast = () => {};
    s.position.y = 2.25;
    z.add(s);
    u.hpTag = s;
    u.hpV = -1;
  }
  const v = Math.max(0, Math.ceil(u.hp));
  if (v !== u.hpV) {
    u.hpV = v;
    s.material.map = numTex(String(v), '#ffe066');
    s.material.needsUpdate = true;
  }
  const k =
    Math.max(1, Math.min(2.4, Math.hypot(z.position.x - pl.position.x, z.position.z - pl.position.z) / 12)) / z.scale.x;
  s.scale.set(1.0 * k, 0.375 * k, 1);
  s.visible = true;
}
// severed limbs fly off, land and STAY on the level
function spawnLimb(z, part, fx, fz) {
  const P = z.userData.parts,
    src = P && P[part];
  if (!src) return null;
  z.updateWorldMatrix(true, true);
  const c = src.clone(true);
  c.traverse(n => {
    n.raycast = () => {};
    if (n.userData) n.userData = {};
  });
  const pos = new THREE.Vector3(),
    q = new THREE.Quaternion(),
    sc = new THREE.Vector3();
  src.matrixWorld.decompose(pos, q, sc);
  c.visible = true;
  c.position.copy(pos);
  c.quaternion.copy(q);
  c.scale.copy(sc);
  scene.add(c);
  let dx = pos.x - fx,
    dz = pos.z - fz;
  const l = Math.hypot(dx, dz) || 1;
  dx /= l;
  dz /= l;
  limbs.push({
    m: c,
    vx: dx * rnd(1.2, 3.2) + rnd(-1, 1),
    vy: rnd(2.2, 4.5),
    vz: dz * rnd(1.2, 3.2) + rnd(-1, 1),
    sx: rnd(-9, 9),
    sz: rnd(-9, 9),
    rest: false,
    head: part === 'head',
    part: part
  });
  if (limbs.length > 160) scene.remove(limbs.shift().m);
  return pos;
}
function updLimbs(dt) {
  for (const L of limbs) {
    if (L.rest) continue;
    const m = L.m,
      p = m.position;
    L.vy -= 16 * dt;
    const nx = p.x + L.vx * dt,
      nz = p.z + L.vz * dt;
    if (!blocked(nx, nz, 0.1, p.y - 0.1, 0.3)) {
      p.x = nx;
      p.z = nz;
    } else {
      L.vx = L.vz = 0;
    }
    p.y += L.vy * dt;
    m.rotation.x += L.sx * dt;
    m.rotation.z += L.sz * dt;
    const gy = groundAt(p.x, p.z, p.y + 0.3) + (L.head ? 0.14 : 0.1);
    if (p.y <= gy && L.vy < 0) {
      p.y = gy;
      L.rest = true;
      if (L.head) m.rotation.set(rnd(-0.6, 0.6), rnd(0, TAU), rnd(-0.6, 0.6));
      else m.rotation.set(Math.random() < 0.5 ? PI / 2 : -PI / 2, rnd(0, TAU), rnd(-0.3, 0.3));
      addDecal(p.x, gy - (L.head ? 0.09 : 0.05) + 0.05, p.z, 0, -PI / 2, rnd(0.5, 0.9));
      bloodSpray(p.x, p.y + 0.1, p.z, 0, 0, 5, 0.5);
    }
  }
}
function stump(parent, x, y, z, w, h, d) {
  return mesh(BX(w, h, d), 0x7a0f0f, x, y, z, parent);
}
function hideLimb(z, part) {
  const u = z.userData,
    P = u.parts;
  u['no_' + part] = true;
  P[part].visible = false;
  const _n0 = scene.children.length;
  (function () {
    const st = u.stumps || (u.stumps = {});
    const s = _stumpFor(z, part);
    st[part] = s;
  })();
}
function _stumpFor(z, part) {
  const u = z.userData,
    P = u.parts;
  let r;
  if (part === 'head') r = stump(P.body, 0, 0.68, 0.04, 0.15, 0.1, 0.15);
  else if (part === 'armL' || part === 'armR')
    r = stump(P.body, (part === 'armL' ? -1 : 1) * (u.big ? 0.4 : 0.33), 0.5, 0, 0.17, 0.14, 0.17);
  else r = stump(z, (part === 'legL' ? -1 : 1) * 0.13, 0.86, 0, 0.2, 0.12, 0.22);
  return r;
}
function legsGone(u) {
  return !!(u.no_legL || u.no_legR);
}
// shot / cut off. Head = instant death. A missing leg drops the zombie into a ragdoll, then it crawls at 60% speed.
function dismember(z, part, fx, fz) {
  const u = z.userData,
    P = u.parts;
  if (!P || u['no_' + part] || !zombies.includes(z)) return false;
  if (u.sleep) wakeZ(z);
  const pos = spawnLimb(z, part, fx, fz);
  hideLimb(z, part);
  const p = pos || z.position;
  bloodSpray(p.x, p.y, p.z, p.x - fx, p.z - fz, part === 'head' ? 22 : 15, 1.4);
  if (part === 'head') {
    u.hp = 0;
    flashObj(z, 0.4);
    killZ(z);
    return true;
  }
  if ((part === 'legL' || part === 'legR') && !u.crawl) {
    u.crawl = true;
    u.sp *= 0.6;
    u.vs = null;
    u.atk = null;
    u.crawlRag = 1;
    try {
      crawlKids(z, P);
    } catch (e) {}
    ragInit(z, fx, fz, false, 1.3);
  }
  return true;
}
function dismemberQuiet(z, part) {
  const u = z.userData;
  if (!u.parts || u['no_' + part]) return;
  hideLimb(z, part);
  if ((part === 'legL' || part === 'legR') && !u.crawl) {
    u.crawl = true;
    u.sp *= 0.6;
    try {
      crawlKids(z, u.parts);
    } catch (e) {}
  }
}
const PARTS = ['head', 'armL', 'armR', 'legL', 'legR', 'torso', 'torso'];
// one damage call: random "Critical" chance on limbs/head from guns (part from the ray) and melee (random part)
function hitZ(z, dmg, part, melee, fr) {
  let crit = false;
  const u = z.userData;
  if (
    part &&
    part !== 'torso' &&
    !u['no_' + part] &&
    (Math.random() < (part === 'head' ? 0.1 : 0.14) * (melee ? 1.2 : 1) ||
      (part === 'head' && !melee && FZ.T.on && u.fzs))
  ) {
    crit = true;
    const f = fr || pl.position;
    dismember(z, part, f.x, f.z);
  }
  if (zombies.includes(z)) dmgZ(z, dmg * (crit ? 1.25 : 1), fr);
  return crit;
}

// ragdoll for living zombies (failed jumps, lost legs); corpses use the same physics
function ragInit(z, fx, fz, big, dur, soft) {
  const u = z.userData,
    P = u.parts;
  let dx = z.position.x - fx,
    dz = z.position.z - fz;
  const l = Math.hypot(dx, dz) || 1;
  dx /= l;
  dz /= l;
  const k = ri(0, 3),
    f = soft || 1;
  z.rotation.setFromQuaternion(z.quaternion, 'YXZ');
  u.rg = {
    vx: dx * rnd(1.5, 3) * (big ? 2.2 : 1) * f,
    vz: dz * rnd(1.5, 3) * (big ? 2.2 : 1) * f,
    vy: (big ? rnd(2.5, 4.5) : rnd(0.5, 2)) * (soft ? 1.2 : 1),
    tx: k === 1 ? PI / 2 : k === 2 ? rnd(-0.4, 0.4) : -PI / 2,
    tz: k === 2 ? ((Math.random() < 0.5 ? -1 : 1) * PI) / 2 : rnd(-0.4, 0.4),
    yw: rnd(-4, 4) * (big ? 2 : 1),
    t: 0,
    done: 0
  };
  if (P) {
    P.armL.rotation.x = rnd(-2.6, 0.6);
    P.armR.rotation.x = rnd(-2.6, 0.6);
    P.armL.rotation.z = rnd(-0.8, 0.2);
    P.armR.rotation.z = rnd(-0.2, 0.8);
    P.legL.rotation.x = rnd(-0.8, 0.8) + (k === 3 ? -1 : 0);
    P.legR.rotation.x = rnd(-0.8, 0.8) + (k === 3 ? -1 : 0);
    P.head.rotation.z = rnd(-0.6, 0.6);
    P.head.rotation.x = rnd(-0.5, 0.5);
    P.body.rotation.x = rnd(0, 0.4);
  }
  u.ragT = dur || 0;
}
function ragStep(z, dt) {
  const r = z.userData.rg;
  if (!r || r.done) return;
  r.t += dt;
  const p = z.position,
    rot = z.rotation,
    fl = groundAt(p.x, p.z, p.y + 1) + 0.2 * Math.min(1, (Math.abs(rot.x) + Math.abs(rot.z)) / 1.3);
  if (p.y > fl + 0.01 || r.vy > 0) {
    r.vy -= 18 * dt;
    p.y += r.vy * dt;
    if (p.y <= fl) {
      p.y = fl;
      r.vy = r.vy < -3 ? -r.vy * 0.3 : 0;
    }
  } else p.y = fl;
  const nx = p.x + r.vx * dt,
    nz = p.z + r.vz * dt;
  if (!blocked(nx, nz, 0.3, p.y)) {
    p.x = nx;
    p.z = nz;
  } else {
    r.vx = r.vz = 0;
  }
  const fr = Math.max(0, 1 - (p.y <= fl + 0.02 ? 4 : 0.3) * dt);
  r.vx *= fr;
  r.vz *= fr;
  const k = Math.min(1, dt * 5);
  rot.x += (r.tx - rot.x) * k;
  rot.z += (r.tz - rot.z) * k;
  rot.y += r.yw * dt;
  r.yw *= Math.max(0, 1 - 3 * dt);
  if (r.t > 1.5 && Math.abs(r.tx - rot.x) < 0.03 && p.y <= fl + 0.02) r.done = 1;
}
function ragEnd(z) {
  const u = z.userData,
    yv = z.rotation.y;
  z.rotation.set(0, yv, 0);
  z.position.y = groundAt(z.position.x, z.position.z, z.position.y + 1);
  u.rg = null;
  u.ragT = 0;
  u.cl = rnd(0.4, 1);
  u.crawlRag = 0;
  const P = u.parts;
  if (P) {
    P.armL.rotation.z = P.armR.rotation.z = 0;
    P.head.rotation.z = 0;
  }
}
// sleeping zombies (lying or sitting) wake on gunfire, the player sprinting nearby, the player smashing a window, or being hurt
function sleepPose(z) {
  const u = z.userData,
    P = u.parts,
    sc = z.scale.x;
  z.rotation.y = rnd(0, TAU);
  if (u.pose === 'lie') {
    z.rotation.x = -1.45;
    z.position.y = 0.22 * sc;
    P.armL.rotation.set(rnd(-0.5, 0.2), 0, -0.5);
    P.armR.rotation.set(rnd(-0.5, 0.2), 0, 0.5);
    P.head.rotation.set(rnd(-0.2, 0.2), 0, rnd(-0.4, 0.4));
  } else {
    z.position.y = -0.78 * sc;
    P.legL.rotation.x = P.legR.rotation.x = -1.45;
    P.body.rotation.x = 0.35;
    P.head.rotation.x = 0.75;
    P.armL.rotation.set(-0.3, 0, -0.15);
    P.armR.rotation.set(-0.2, 0, 0.15);
  }
}
function wakeZ(z) {
  const u = z.userData;
  if (!u.sleep) return;
  u.sleep = false;
  u.rise = 1.1;
  u.riseMax = 1.1;
  u.see = true;
  u.hunt = 2.5;
  u.lx = pl.position.x;
  u.lz = pl.position.z;
  // v084: at most 3 groans per 0.4 s - a loud shot woke a whole street at once, each groan building its own audio nodes
  const nw = performance.now();
  if (nw - (wakeZ.t || 0) > 400) {
    wakeZ.t = nw;
    wakeZ.n = 0;
  }
  if (wakeZ.n++ < 3) S.groan(z.position);
}
function riseStep(z, dt) {
  const u = z.userData,
    P = u.parts,
    sc = z.scale.x;
  u.rise -= dt;
  const k = Math.max(0, u.rise) / u.riseMax;
  if (u.pose === 'lie') {
    z.rotation.x = -1.45 * k;
    z.position.y = 0.22 * sc * k;
  } else {
    z.position.y = -0.78 * sc * k;
    P.legL.rotation.x = P.legR.rotation.x = -1.45 * k;
    P.body.rotation.x = 0.35 * k + 0.3 * (1 - k);
    P.head.rotation.x = 0.75 * k;
  }
  if (u.rise <= 0) {
    z.rotation.x = 0;
    z.position.y = 0;
    P.armL.rotation.set(0, 0, 0);
    P.armR.rotation.set(0, 0, 0);
    P.head.rotation.set(0, 0, 0);
    P.legL.rotation.x = P.legR.rotation.x = 0;
  }
}
function failJump(z, u, ux, uz) {
  const p = z.position;
  floatText(p.x, p.y + 2.1 * z.scale.x, p.z, 'Fail', '#f87171');
  ragInit(z, p.x + ux * 2, p.z + uz * 2, false, 1.7, 0.6);
  u.atk = null;
}
/* v076: things hung on the zombie's root at hip height (skirts, coats, the red leg stump) stayed up there when the body dropped into the crawl,
   so they floated. They ride on the pelvis while crawling (attached in the standing rest pose, so they sit where they did). */
function crawlKids(z, P) {
  let any = false;
  const keep = o => o === P.body || o === P.legL || o === P.legR || o.isSprite || o.isLight || (o.userData && (o.userData.zaim || o.userData.zbMerged)); // v089: the merged render mesh stays on the root
  for (const o of z.children)
    if (!keep(o)) {
      any = true;
      break;
    }
  if (!any) return;
  const bp = P.body.position.clone(),
    br = P.body.rotation.clone();
  P.body.position.set(0, 0.9, 0);
  P.body.rotation.set(0.3, 0, 0);
  z.updateMatrixWorld(true);
  for (const o of z.children.slice()) if (!keep(o)) P.body.attach(o);
  P.body.position.copy(bp);
  P.body.rotation.copy(br);
}
function crawlPose(z, dt) {
  const u = z.userData,
    P = u.parts,
    mv = u.cmv || 0,
    sw = Math.sin((u.ph || 0) * 1.1) * 0.5;
  try {
    crawlKids(z, P);
  } catch (e) {}
  P.body.position.y = 0.22;
  P.body.rotation.x = PI / 2 - 0.05;
  P.head.rotation.x = -1.35;
  P.head.rotation.z = 0;
  P.legL.position.y = P.legR.position.y = 0.22;
  P.legL.rotation.x = P.legR.rotation.x = PI / 2;
  P.armL.rotation.x = PI - 0.25 + sw;
  P.armR.rotation.x = PI - 0.25 - sw;
  P.armL.rotation.z = P.armR.rotation.z = 0;
  P.elL.rotation.x = P.elR.rotation.x = -0.2;
}

// ===== Windows (smashable), shards, ragdolls =====
const SG = new THREE.BoxGeometry(0.12, 0.12, 0.02),
  SM = new THREE.MeshBasicMaterial({color: 0xaad4ee, transparent: true, opacity: 0.7});
function breakWin(w, byPlayer) {
  if (!w.alive) return;
  w.alive = false;
  w.g.remove(w.m);
  const i = solids.indexOf(w.box);
  if (i >= 0) solids.splice(i, 1);
  S.glass(w.p);
  for (let k = 0; k < 20; k++) {
    const m = new THREE.Mesh(SG, SM);
    m.raycast = () => {};
    m.position.set(
      w.p.x + (w.ax ? rnd(-0.7, 0.7) : rnd(-0.05, 0.05)),
      w.p.y + rnd(-0.9, 0.9),
      w.p.z + (w.ax ? rnd(-0.05, 0.05) : rnd(-0.7, 0.7))
    );
    m.rotation.set(rnd(0, 3), rnd(0, 3), rnd(0, 3));
    scene.add(m);
    shards.push({m, v: new THREE.Vector3(rnd(-1.5, 1.5), rnd(0, 2.5), rnd(-1.5, 1.5)), t: 0});
  }
  for (let k = -1; k <= 1; k++) {
    const t = new THREE.Mesh(BX(0.07, rnd(0.15, 0.35), 0.02), SM);
    t.position.set(w.l.x + (w.ax ? k * 0.5 : 0), w.l.y + 0.15, w.l.z + (w.ax ? 0 : k * 0.5));
    t.rotation.z = rnd(-0.4, 0.4);
    t.raycast = () => {};
    w.g.add(t);
  }
  zombies.forEach(z => {
    if (z.position.distanceTo(w.p) < 25) {
      const u = z.userData;
      if (u.sleep) {
        if (byPlayer) wakeZ(z);
        return;
      }
      u.hunt = 2;
      u.lx = w.p.x;
      u.lz = w.p.z;
    }
  });
}
function updShards(dt) {
  for (let i = shards.length - 1; i >= 0; i--) {
    const s = shards[i],
      m = s.m;
    s.t += dt;
    s.v.y -= 12 * dt;
    m.position.addScaledVector(s.v, dt);
    m.rotation.x += dt * 6;
    m.rotation.z += dt * 4;
    if (m.position.y < 0.05) {
      m.position.y = 0.05;
      s.v.set(0, 0, 0);
    }
    if (s.t > 5) {
      const k = Math.max(0, 6 - s.t);
      m.scale.setScalar(k);
      if (k <= 0) {
        scene.remove(m);
        shards.splice(i, 1);
      }
    }
  }
}
function killZ(z) {
  zombies = zombies.filter(q => q !== z);
  G.kills++;
  if (z.userData.hpTag) z.userData.hpTag.visible = false;
  const u = z.userData,
    P = u.parts,
    dist = z.position.distanceTo(pl.position);
  u.kind = 'corpse';
  u.thru = true;
  u.sleep = false;
  u.rise = 0;
  u.ragT = 0;
  S.die(z.position);
  const big = u.ld >= 60 || (G.eq && WDEF[G.eq.id] && WDEF[G.eq.id].pel > 1 && dist < 12);
  if (P && u.crawl) {
    P.body.position.y = 0.9;
    P.legL.position.y = P.legR.position.y = 0.9;
  }
  ragInit(z, pl.position.x, pl.position.z, big, 0);
  bloodSpray(
    z.position.x,
    z.position.y + 1.1 * z.scale.x,
    z.position.z,
    z.position.x - pl.position.x,
    z.position.z - pl.position.z,
    big ? 16 : 10,
    1.1
  );
  bloodPool(z.position.x, z.position.z, rnd(1, 1.7));
  dead.push(z);
  if (dead.length > 35) scene.remove(dead.shift());
}
function updDead(dt) {
  for (const z of dead) {
    const fu = z.userData;
    if (fu.flash > 0) {
      fu.flash -= dt;
      if (fu.flash <= 0) tintHit(z, 0);
    }
  }
  for (const z of dead) ragStep(z, dt);
}
