/* MINI FORT ZOMBIE - core 10/13: weapons
   Weapon models, classic viewmodel, ammo, reload, tracers/sparks, shoot, melee, NPC equipment + combat, dmgZ.
   Part of the old js/game/core.js (split in v080). Classic script: shares globals with the other core parts; load in numeric order. */
function bx(g, w, h, d, x, y, z, c) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({color: c, roughness: 0.6}));
  m.position.set(x, y, z);
  g.add(m);
  return m;
}
/* =====================================================================================================
   REVISION 037 - WEAPON SYSTEM
   1. Models are generated from the SAME shape lists the inventory sprites are painted from (gunLong / gunSmg / gunPistol / meleePaint),
      so every weapon's 3D model follows its sprite design. They are used for the first-person view and in NPC hands.
   2. A weapon only works while its item is in the holder's inventory. Player: TAB cycles Fist + every weapon in the inventory.
   3. Guns track rounds in the clip on the item (inst.clip) and reload from ammo items of their own calibre in the same inventory.
   4. NPCs equip the first usable weapon they hold, show it in the right hand, shoot only with ammo from their own inventory, and
      walk up to and hit nearby zombies with melee weapons (or fists).
   ===================================================================================================== */
const CELLM_DEF = 0.105,
  MODEL_T = {},
  MC = {},
  VM = {root: null, set: {}, cur: null};
const matOf = c =>
  MC[c] || (MC[c] = new THREE.MeshStandardMaterial({color: new THREE.Color(c), roughness: 0.65, metalness: 0.15}));
function recordShapes(id) {
  const it = ITEMS[id],
    W = it.size[0] * BPX,
    H = it.size[1] * BPX,
    rects = [],
    arcs = [];
  const F = (c, a, b, w, h) => rects.push([c, a, b, w, h]),
    T = () => {};
  const x = {
    lineWidth: 3,
    strokeStyle: '',
    fillStyle: '',
    beginPath() {},
    stroke() {},
    arc(cx, cy, r, a0, a1) {
      arcs.push([cx, cy, r, a0, a1, this.lineWidth]);
    }
  };
  const g = GUNS[id];
  if (g) {
    if (g[0] === 'L') gunLong(F, g[1]);
    else if (g[0] === 'S') gunSmg(F, Object.assign({T}, g[1]));
    else gunPistol(F, Object.assign({T}, g[1]));
  } else if (it.cat === 'melee') meleePaint(id, F, x, W, H);
  return {rects, arcs, W, H};
}
const hexRGB = c => {
  let s = c.replace('#', '');
  if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
};
function isBladeCol(c) {
  const [r, g, b] = hexRGB(c);
  return (r + g + b) / 3 > 150 && Math.max(r, g, b) - Math.min(r, g, b) < 40;
}
// Build a model (grip at the origin; guns point down -Z with up = +Y; melee tips point up +Y). Cached per item id.
function modelFor(id) {
  if (MODEL_T[id]) return MODEL_T[id];
  const it = ITEMS[id],
    d = WDEF[id],
    gun = d.type === 'gun',
    cm = d.cellM || CELLM_DEF,
    Wm = it.size[0] * cm,
    Hm = it.size[1] * cm,
    rec = recordShapes(id),
    g = new THREE.Group(),
    gx = d.grip[0],
    gy = d.grip[1];
  let i = 0,
    mx = 0,
    myc = 0,
    tp = -9;
  rec.rects.forEach(r => {
    const [col, a, b, w, h] = r;
    if (col.length === 5 || col.length === 9) return; // translucent shading strips from the sprite are skipped
    const wm = w * Wm,
      hm = h * Hm,
      cu = (a + w / 2 - gx) * Wm,
      cv = (gy - (b + h / 2)) * Hm;
    let th;
    if (gun) th = Math.min(0.05, Math.max(0.013, Math.min(wm, hm) * 0.85));
    else
      th = isBladeCol(col)
        ? col.length === 4 && col !== '#ccc' && hexRGB(col)[0] > 240
          ? 0.016
          : 0.012
        : Math.min(0.034, Math.max(0.014, Math.min(wm, hm) * 0.7));
    th += (i++ % 6) * 0.0005;
    const me = new THREE.Mesh(new THREE.BoxGeometry(gun ? th : wm, hm, gun ? wm : th), matOf(col));
    if (gun) {
      me.position.set(0, cv, -cu);
      const f = (a + w - gx) * Wm;
      if (f > mx) {
        mx = f;
        myc = cv;
      }
      tp = Math.max(tp, cv + hm / 2);
    } else me.position.set(cu, cv, 0);
    g.add(me);
  });
  rec.arcs.forEach(A => {
    const [cx, cy, r, a0, a1, lw] = A,
      pm = v => (v / BPX) * cm,
      n = 12,
      wd = pm(lw);
    let px = null;
    for (let k = 0; k <= n; k++) {
      const t = a0 + ((a1 - a0) * k) / n,
        u = pm(cx + Math.cos(t) * r) - gx * Wm,
        v = gy * Hm - pm(cy + Math.sin(t) * r);
      if (px) {
        const dx = u - px[0],
          dy = v - px[1],
          len = Math.hypot(dx, dy) + 0.004,
          me = new THREE.Mesh(new THREE.BoxGeometry(len, wd, 0.012 + (k % 2) * 0.0006), matOf('#d1d5db'));
        me.position.set((u + px[0]) / 2, (v + px[1]) / 2, 0);
        me.rotation.z = Math.atan2(dy, dx);
        g.add(me);
      }
      px = [u, v];
    }
  });
  const T = {g, mz: [0, myc, -mx - 0.01], len: mx, Wm, Hm, top: tp};
  MODEL_T[id] = T;
  return T;
}
function cloneModel(id, ownMat) {
  const c = modelFor(id).g.clone(true);
  if (ownMat)
    c.traverse(o => {
      if (o.isMesh) o.material = o.material.clone();
    });
  return c;
}

/* ---------- first person viewmodel ---------- */
const SKIN = 0xd9a47a,
  SLEEVE = 0x4a5a3a;
function vmBase(d) {
  return d.type === 'gun' ? [0.25, -0.26, -0.46] : d === FIST ? [0.24, -0.3, -0.42] : [0.3, -0.32, -0.5];
}
function vmEnsure(key) {
  if (!VM.root) {
    VM.root = new THREE.Group();
    camera.add(VM.root);
  }
  if (VM.set[key]) return VM.set[key];
  const gun = key !== 'fist' && WDEF[key].type === 'gun',
    d = key === 'fist' ? FIST : WDEF[key],
    o = new THREE.Group(),
    v = {o, d, fl: null};
  VM.root.add(o);
  o.visible = false;
  if (key === 'fist') {
    bx(o, 0.1, 0.1, 0.13, 0, 0, 0, SKIN);
    const fa = bx(o, 0.09, 0.09, 0.55, 0.01, -0.1, 0.3, SLEEVE);
    fa.rotation.x = 0.3;
  } else {
    const t = modelFor(key),
      m = cloneModel(key, false);
    o.add(m);
    v.m = m;
    bx(o, 0.075, 0.085, 0.11, 0, -0.01, 0.02, SKIN);
    const fa = bx(o, 0.085, 0.085, 0.5, 0.02, -0.1, 0.27, SLEEVE);
    fa.rotation.x = 0.35;
    if (gun && d.lhand) {
      const lu = (d.lhand[0] - d.grip[0]) * t.Wm,
        lv = (d.grip[1] - d.lhand[1]) * t.Hm;
      bx(o, 0.075, 0.08, 0.1, -0.01, lv, -lu, SKIN);
      const fl = bx(o, 0.08, 0.08, 0.55, -0.08, lv - 0.1, -lu + 0.26, SLEEVE);
      fl.rotation.x = 0.4;
      fl.rotation.y = -0.3;
    }
    if (gun) {
      v.mz = t.mz;
      const sy = t.top + 0.014,
        rz = -((gun && d.grip[0] > 0.3 ? 0.3 : 0.2) - d.grip[0]) * t.Wm;
      bx(o, 0.006, 0.016, 0.012, -0.012, t.top + 0.006, rz, 0x0b0b0b);
      bx(o, 0.006, 0.016, 0.012, 0.012, t.top + 0.006, rz, 0x0b0b0b);
      bx(o, 0.007, sy - t.mz[1], 0.008, 0, (sy + t.mz[1]) / 2, t.mz[2] + 0.05, 0x0b0b0b);
      v.sy = sy;
      const f = new THREE.Group();
      f.position.set(t.mz[0], t.mz[1], t.mz[2] - 0.02);
      const a = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.02), new THREE.MeshBasicMaterial({color: 0xffd070})),
        b = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.02), new THREE.MeshBasicMaterial({color: 0xffa030})),
        c = b.clone();
      c.rotation.z = Math.PI / 2;
      f.add(a, b, c);
      f.visible = false;
      o.add(f);
      v.fl = f;
    }
    if (!gun) {
      o.scale.setScalar(0.85);
    }
  }
  VM.set[key] = v;
  return v;
}
function pWeapons() {
  return PINV.items.filter(q => WDEF[q.id]);
}
function pCheckEq() {
  if (G.eq && !PINV.items.includes(G.eq)) {
    G.eq = null;
    G.rl = 0;
    G.draw = 0.25;
  }
}
function equip(inst) {
  if (inst === G.eq) return;
  G.rl = 0;
  G.fbLeft = 0;
  G.eq = inst || null;
  G.draw = 0.3;
  G.cdS = Math.max(G.cdS, 0.2);
  S.swap(inst && WDEF[inst.id].type === 'gun' ? 1 : 0);
}
function cycleWeapon() {
  pCheckEq();
  const l = [null].concat(pWeapons()),
    i = Math.max(0, l.indexOf(G.eq));
  equip(l[(i + 1) % l.length]);
}
function animVM(dt) {
  pCheckEq();
  G.kick = Math.max(0, G.kick - dt * 8);
  G.swT = Math.max(0, G.swT - dt);
  G.draw = Math.max(0, G.draw - dt);
  G.flashT = Math.max(0, G.flashT - dt);
  G.dry = Math.max(0, (G.dry || 0) - dt);
  const w = G.eq,
    key = w ? w.id : 'fist',
    d = w ? WDEF[key] : FIST,
    v = vmEnsure(key);
  if (VM.cur !== v) {
    if (VM.cur) VM.cur.o.visible = false;
    VM.cur = v;
    v.o.visible = true;
  }
  const gun = d.type === 'gun',
    bs = vmBase(d);
  let px = bs[0],
    py = bs[1],
    pz = bs[2],
    rx = 0,
    ry = 0,
    rz = 0;
  const aimOn = !!(K.m2 && locked && !invOpen && !wheel && G.draw < 0.15 && (!gun || G.rl <= 0));
  G.ads += ((aimOn && gun ? 1 : 0) - G.ads) * Math.min(1, dt * 10);
  G.zoom += ((aimOn && !gun ? 1 : 0) - G.zoom) * Math.min(1, dt * 8);
  {
    const tf = G.fov * (1 - 0.3 * G.ads - 0.12 * G.zoom);
    if (Math.abs(camera.fov - tf) > 0.02) {
      camera.fov = tf;
      camera.updateProjectionMatrix();
    }
    G.zoomK = tf / G.fov;
  }
  if (!gun && d !== FIST) {
    rx = -0.55;
    rz = -0.12;
    if (v.m) v.m.rotation.y = -1.35;
  } else if (gun) ry = 0.03;
  const moving = locked && (K.KeyW || K.KeyA || K.KeyS || K.KeyD),
    bob = moving ? Math.sin(performance.now() * 0.009 * (K.ShiftLeft ? 1.4 : 1)) * 0.008 : 0;
  py += bob;
  px += bob * 0.5;
  const dr = G.draw > 0 ? G.draw / 0.3 : 0;
  py -= dr * 0.35;
  rx += dr * 0.8;
  if (gun) {
    const rl = G.rl > 0,
      p = rl ? 1 - G.rl / (G.rlT || 1) : 0,
      dip = rl ? Math.sin(p * Math.PI) : 0;
    py -= dip * 0.2;
    rx += -dip * 0.5;
    rz += dip * 0.7;
    if (rl && d.rlN === 1) pz += Math.sin(p * Math.PI * 3) * 0.03;
    pz += G.kick * 0.07 * d.kick * (1 - 0.5 * G.ads);
    rx += G.kick * 0.16 * d.kick * (1 - 0.5 * G.ads);
    if (G.ads > 0.001 && v.sy !== undefined) {
      const a = G.ads;
      px += (0 - px) * a;
      py += (-0.04 - v.sy - py) * a;
      pz += (-0.45 - pz) * a;
      ry *= 1 - a;
    }
    if (v.fl) {
      v.fl.visible = G.flashT > 0;
      if (v.fl.visible) {
        v.fl.rotation.z = Math.random() * 6;
        v.fl.scale.setScalar(0.8 + Math.random() * 0.6);
      }
    }
  }
  if (G.swT > 0) {
    const sp = 1 - G.swT / G.swD,
      sw = Math.sin(sp * Math.PI),
      e = 1 - Math.pow(1 - sp, 2.2);
    switch (G.swK) {
      case 'slash':
        pz -= sw * 0.55;
        px -= sw * 0.1;
        ry += sw * 0.12;
        break;
      case 'chop':
        pz -= sw * 0.6;
        py -= sw * 0.04;
        break;
      case 'jab':
        pz -= sw * 0.7;
        break;
      case 'punch':
        pz -= sw * 0.5;
        py += sw * 0.03;
        px -= sw * 0.1;
        break;
      case 'bash':
        pz -= sw * 0.5;
        rx -= sw * 0.3;
        break;
    }
  }
  v.o.position.set(px, py, pz);
  v.o.rotation.set(rx, ry, rz);
  updFx(dt);
}

/* ---------- ammo (type-specific; works on any inventory: player, survivor, container) ---------- */
function ammoCount(inv, aid) {
  let n = 0;
  inv.items.forEach(q => {
    if (q.id === aid) n += Math.max(0, q.rem);
  });
  return n;
}
function ammoTake(inv, aid, n) {
  let taken = 0;
  const l = inv.items.filter(q => q.id === aid && q.rem > 0).sort((a, b) => a.rem - b.rem || a.uid - b.uid);
  for (const q of l) {
    if (taken >= n) break;
    const t = Math.min(q.rem, n - taken);
    q.rem -= t;
    taken += t;
  }
  inv.items.filter(q => q.id === aid && q.rem <= 0).forEach(q => invRemove(inv, q));
  return taken;
}
// take the rounds out of a gun and put them back into the inventory as ammo (topping up part-used boxes first)
function unloadGun(inv, inst) {
  const d = WDEF[inst.id];
  if (!d || d.type !== 'gun' || !(inst.clip > 0)) return 0;
  const ai = d.ammo,
    mx = ITEMS[ai].value.ammo,
    n = inst.clip;
  let r = n;
  const fills = [],
    added = [];
  inv.items.forEach(q => {
    if (r > 0 && q.id === ai && q.rem < mx) {
      const t = Math.min(mx - q.rem, r);
      fills.push([q, t]);
      r -= t;
    }
  });
  while (r > 0) {
    const t = Math.min(mx, r),
      q = newInst(ai);
    q.rem = t;
    if (!invAdd(inv, q)) {
      added.forEach(a => invRemove(inv, a));
      return -1;
    }
    added.push(q);
    r -= t;
  }
  fills.forEach(([q, t]) => (q.rem += t));
  inst.clip = 0;
  if (G.eq === inst) G.rl = 0;
  return n;
}

/* ---------- player: reload, shoot, melee ---------- */
/* v079: pressing Reload again during a round-by-round reload (revolvers, shotguns, Model 70) stops it; rounds already loaded stay in. */
function reload(manual) {
  const w = G.eq,
    d = w && WDEF[w.id];
  if (!d || d.type !== 'gun') return;
  if (G.rl > 0) {
    if (manual && d.rlN === 1 && performance.now() - (G.rlT0 || 0) > 180) {
      G.rl = 0;
      try {
        fb('RELOAD STOPPED', '#aaa');
      } catch (e) {}
    }
    return;
  }
  if (w.clip >= d.cap) return;
  G.rlT0 = performance.now();
  if (ammoCount(PINV, d.ammo) <= 0) {
    toast('No ' + ITEMS[d.ammo].name + ' ammo in your inventory');
    S.click();
    return;
  }
  G.rlT = G.rl = d.rlT;
  S.rlStep(d);
}
function rlTick(dt) {
  if (G.rl <= 0) return;
  G.rl -= dt;
  if (G.rl > 0) return;
  G.rl = 0;
  const w = G.eq,
    d = w && WDEF[w.id];
  if (!d || d.type !== 'gun') return;
  const n = Math.min(d.rlN, d.cap - w.clip, ammoCount(PINV, d.ammo));
  if (n > 0) {
    ammoTake(PINV, d.ammo, n);
    w.clip += n;
  }
  if (w.clip < d.cap && ammoCount(PINV, d.ammo) > 0) {
    G.rlT = G.rl = d.rlT;
    S.rlStep(d);
  }
}
const LIVE = new Set(['zombie', 'comp', 'surv', 'npc', 'corpse']),
  FXT = {t: [], h: []},
  HOLE_MAX = 60,
  HOLE_LIFE = 40;
let HOLE_MAT = null,
  HOLE_GEO = null,
  TR_GEO = null;
function fxInit() {
  HOLE_GEO = new THREE.PlaneGeometry(0.09, 0.09);
  const cv = document.createElement('canvas');
  cv.width = cv.height = 32;
  const c = cv.getContext('2d'),
    g = c.createRadialGradient(16, 16, 0, 16, 16, 15);
  g.addColorStop(0, 'rgba(5,5,5,1)');
  g.addColorStop(0.35, 'rgba(15,12,10,.95)');
  g.addColorStop(0.6, 'rgba(70,60,50,.7)');
  g.addColorStop(1, 'rgba(70,60,50,0)');
  c.fillStyle = g;
  c.fillRect(0, 0, 32, 32);
  HOLE_MAT = new THREE.MeshBasicMaterial({
    map: new THREE.CanvasTexture(cv),
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -6,
    polygonOffsetUnits: -6
  });
  TR_GEO = new THREE.BoxGeometry(1, 1, 1);
}
function addHole(p, n) {
  if (!HOLE_MAT) fxInit();
  const m = new THREE.Mesh(HOLE_GEO, HOLE_MAT);
  m.position.copy(p).addScaledVector(n, 0.012);
  scene.add(m);
  m.lookAt(p.clone().add(n));
  m.rotateZ(rnd(0, TAU));
  const s = rnd(0.8, 1.3);
  m.scale.set(s, s, 1);
  m.raycast = () => {};
  m.renderOrder = 3;
  m.userData.t = 0;
  m.userData.s = s;
  FXT.h.push(m);
  while (FXT.h.length > HOLE_MAX) scene.remove(FXT.h.shift());
}
function addTracer(a, b, life, w, col) {
  if (!TR_GEO) fxInit();
  const len = a.distanceTo(b);
  if (len < 0.05) return;
  w = w || 0.012;
  const m = new THREE.Mesh(
    TR_GEO,
    new THREE.MeshBasicMaterial({
      color: col || 0xffe9a0,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })
  );
  m.position.copy(a).lerp(b, 0.5);
  m.scale.set(w, w, len);
  scene.add(m);
  m.lookAt(b);
  m.raycast = () => {};
  m.renderOrder = 4;
  m.frustumCulled = false;
  m.userData.t = 0;
  m.userData.life = life || 0.1;
  FXT.t.push(m);
  if (FXT.t.length > 90) scene.remove(FXT.t.shift());
}
function addSpark(p) {
  addTracer(
    p.clone().add(new THREE.Vector3(0, 0, -0.03)),
    p.clone().add(new THREE.Vector3(0, 0, 0.03)),
    0.08,
    0.07,
    0xffb050
  );
}
function updFx(dt) {
  for (let i = FXT.t.length - 1; i >= 0; i--) {
    const m = FXT.t[i];
    m.userData.t += dt;
    const k = 1 - m.userData.t / m.userData.life;
    if (k <= 0 || !m.parent) {
      scene.remove(m);
      FXT.t.splice(i, 1);
    } else m.material.opacity = 0.9 * k;
  }
  for (let i = FXT.h.length - 1; i >= 0; i--) {
    const m = FXT.h[i];
    if (!m.parent) {
      FXT.h.splice(i, 1);
      continue;
    }
    m.userData.t += dt;
    const r = HOLE_LIFE - m.userData.t;
    if (r <= 0) {
      scene.remove(m);
      FXT.h.splice(i, 1);
    } else if (r < 3) {
      const s = (m.userData.s * r) / 3;
      m.scale.set(s, s, 1);
    }
  }
}
function rayWorld(o, dir, far, skip) {
  ray.set(o, dir);
  ray.far = far;
  for (const i of ray.intersectObjects(scene.children, true)) {
    if (i.object.isSprite || !i.object.visible || i.distance < 0.3) continue;
    const ow = own(i.object);
    if (ow && (ow === skip || ow.userData.thru)) continue;
    return {p: i.point, n: i.face ? i.face.normal.clone().transformDirection(i.object.matrixWorld) : null, o: ow};
  }
  return null;
}
function playerMuzzle() {
  const v = VM.cur,
    p = new THREE.Vector3();
  if (v && v.mz) {
    p.set(v.mz[0], v.mz[1], v.mz[2]);
    v.o.updateWorldMatrix(true, false);
    v.o.localToWorld(p);
  } else camera.getWorldPosition(p);
  return p;
}
function npcMuzzle(m) {
  const u = m.userData,
    v = new THREE.Vector3();
  m.updateMatrixWorld(true);
  if (u.hold && u.hid) {
    const t = modelFor(u.hid);
    v.set(t.mz[0], t.mz[1], t.mz[2]);
    u.hold.localToWorld(v);
  } else v.set(m.position.x, m.position.y + 1.3, m.position.z);
  return v;
}
function npcTrace(o, b, hit, m) {
  const tp = new THREE.Vector3(b.position.x, b.position.y + tgtY(b) * (b.scale.x || 1), b.position.z);
  if (hit) {
    addTracer(o, tp);
    addSpark(tp);
    return;
  }
  const dir = tp.clone().sub(o).normalize();
  dir.x += rnd(-0.07, 0.07);
  dir.y += rnd(-0.05, 0.05);
  dir.z += rnd(-0.07, 0.07);
  dir.normalize();
  const r = rayWorld(o, dir, 45, m),
    e = r ? r.p : o.clone().addScaledVector(dir, 45);
  addTracer(o, e);
  if (r) {
    addSpark(e);
    if (r.n && !(r.o && LIVE.has(r.o.userData.kind))) {
      if (r.n.dot(dir) > 0) r.n.negate();
      addHole(e, r.n);
    }
  }
}
function shoot() {
  const w = G.eq,
    d = w && WDEF[w.id];
  if (!d || d.type !== 'gun') return melee();
  if (G.cdS > 0 || G.draw > 0.1) return;
  if (G.rl > 0) {
    if (d.rlN === 1 && w.clip > 0) G.rl = 0;
    else return;
  } // round-by-round guns can be fired mid-reload
  if (w.clip <= 0) {
    G.fbLeft = 0;
    if (ammoCount(PINV, d.ammo) > 0) reload();
    else {
      if (G.dry <= 0) {
        toast('Out of ' + ITEMS[d.ammo].name + ' ammo');
        G.dry = 1.5;
      }
      S.click();
    }
    G.cdS = 0.3;
    return;
  }
  G.cdS = d.cd;
  w.clip--;
  if (d.fbN) {
    if (G.fbLeft > 0) {
      G.fbLeft--;
    } else {
      G.fbLeft = d.fbN - 1;
    }
    if (G.fbLeft <= 0) {
      G.fbLeft = 0;
      G.cdS = d.fbPause;
    }
  }
  G.kick = 1;
  G.flashT = 0.06;
  S.shot(d.snd);
  zombies.forEach(z => {
    if (z.position.distanceTo(pl.position) < fzBang(d)) {
      if (z.userData.sleep) wakeZ(z);
      z.userData.hunt = 4;
      z.userData.lx = pl.position.x;
      z.userData.lz = pl.position.z;
      z.userData.see = true;
    }
  });
  const mv = K.KeyW || K.KeyA || K.KeyS || K.KeyD,
    aim = G.ads > 0.8;
  let res = 'MISS',
    col = '#aaa';
  const mzp = playerMuzzle();
  for (let k = 0; k < d.pel; k++) {
    const sp =
        window.RGX && RGX.spread
          ? RGX.spread(d, aim, mv)
          : aim
            ? d.pel > 1
              ? d.spr * 0.5
              : 0
            : d.spr * (mv ? 1.5 : 1) * (G.crouch ? 0.7 : 1),
      h = look(true, new THREE.Vector2(rnd(-sp, sp), rnd(-sp, sp)));
    const rd = ray.ray.direction.clone(),
      far = ray.ray.origin.clone().addScaledVector(rd, 40);
    let ep = h && h.p ? h.p : far,
      hole = null;
    if (h && h.o && h.o.userData.kind === 'corpse' && window.corpseHit) {
      addWound(h);
      corpseHit(h.o, zPartOf(h.m, h.o), d.dmg, pl.position); // v089: part from the limb pivot too
      if (res === 'MISS') {
        res = 'HIT';
        col = '#f87171';
      }
    } else if (h && h.o && h.o.userData.kind === 'zombie') {
      trainSk(G, 'guns');
      const over = h.d > d.rng,
        ch = Math.min(
          0.99,
          Math.max(
            0.1,
            skGunBase(h.d) +
              d.acc +
              (aim ? 0.3 : 0) -
              (mv ? 0.1 : 0) -
              (over ? Math.min(0.4, (h.d - d.rng) / d.rng) : 0) +
              (d.pel > 1 && h.d < 10 ? 0.15 : 0)
          )
        );
      if (Math.random() < ch) {
        addWound(h);
        const dm = Math.max(1, d.dmg + fzBand(d, h.d)) * (over ? Math.max(0.4, d.rng / h.d) : 1),
          c = hitZ(h.o, dm, zPartOf(h.m, h.o), false); // v089: part from the limb pivot too
        if (c) {
          res = 'CRITICAL!';
          col = '#facc15';
        } else if (res !== 'CRITICAL!') {
          res = 'HIT';
          col = '#f87171';
        }
      } else ep = far;
    } else if (h && h.o && h.o.userData.kind === 'door' && h.o.userData.d) {
      const dd = h.o.userData.d,
        dm = Math.max(1, d.dmg + fzBand(d, h.d)) * (h.d > d.rng ? Math.max(0.4, d.rng / h.d) : 1);
      if (doorHit(dd, dm, 'gun') && res === 'MISS') {
        res = 'DOOR';
        col = '#e9b43c';
      }
    } else if (h && h.p && h.n && holeOK(h)) hole = h;
    if (k < 4) {
      addTracer(mzp, ep);
      if (ep !== far) addSpark(ep);
    }
    if (hole) {
      const n = hole.n.clone();
      if (n.dot(rd) > 0) n.negate();
      addHole(hole.p, n);
    }
  }
  if (res === 'DOOR') return;
  if (window.RGX && RGX.afterShot) RGX.afterShot(d, w);
  if (res !== 'MISS') hitMark(res === 'CRITICAL!');
  fb(res, col);
}
function melee() {
  const w = G.eq,
    d0 = w ? WDEF[w.id] : FIST,
    d = d0.type === 'gun' ? BASH : d0;
  if (G.cdM > 0 || G.st < d.st || G.draw > 0.1) return;
  G.cdM = d.cd;
  G.st -= d.st;
  G.swT = G.swD = d.swD;
  G.swK = d.swing;
  S.swing(w ? 1 : 0);
  const t = meleeTarget(d.reach); // v072: 3D body-to-body reach + wall check (was flat map distance, so you could hit zombies far below you)
  const _sid = skWid(d);
  // v063: stealth kill - a melee hit on a zombie that is not hunting you (or asleep) kills it outright, silently (nothing else is alerted)
  if (t) {
    const tu = t.userData;
    if (tu.sleep || (!tu.see && !(tu.hunt > 0) && !tu.atk && G.mode !== 'SIEGE')) {
      trainSk(G, _sid);
      S.hit(d.hit);
      tu.ld = 0;
      tu.hp = -1;
      flashObj(t, 0.3);
      bloodSpray(
        t.position.x,
        t.position.y + 1.2 * t.scale.x,
        t.position.z,
        t.position.x - pl.position.x,
        t.position.z - pl.position.z,
        ri(8, 12),
        1.2
      );
      killZ(t);
      fb('STEALTH KILL', '#e5e7eb');
      return;
    }
  }
  if (t && Math.random() < skMeleeHit(G, _sid)) {
    trainSk(G, _sid);
    S.hit(d.hit);
    const crit = hitZ(t, d.dmg * (0.9 + (0.2 * skTot(G, _sid)) / 100), meleeAimPart(t), true);
    /* v079: the part you aimed at */ fb(crit ? 'CRITICAL!' : 'HIT', crit ? '#facc15' : '#f87171');
  } else {
    const gh = look(false);
    if (gh && gh.o && gh.o.userData.kind === 'glass' && gh.d < d.reach + 0.2) {
      breakWin(gh.o.userData.w, true);
      S.hit(d.hit);
    } else if (gh && gh.o && gh.o.userData.kind === 'door' && gh.o.userData.d && gh.d < d.reach + 0.3) {
      trainSk(G, _sid);
      doorHit(gh.o.userData.d, d.dmg * (0.9 + (0.2 * skTot(G, _sid)) / 100), 'melee');
    } /* v075: melee on doors */ else fb('MISS', '#aaa');
  }
}
function hudWeapon() {
  const w = G.eq,
    d = w ? WDEF[w.id] : null,
    l = pWeapons(),
    i = w ? l.indexOf(w) + 1 : 0;
  $('wn').textContent =
    (w ? ITEMS[w.id].name : 'Fist') +
    (d && d.type === 'gun' ? ' \u00b7 ' + ITEMS[d.ammo].name : '') +
    '  [' +
    (i + 1) +
    '/' +
    (l.length + 1) +
    ']';
  if (d && d.type === 'gun') {
    $('ac').textContent = String(w.clip);
    /* v079: rounds in the gun / rounds in your inventory (no capacity) */ $('ar').textContent = ammoCount(
      PINV,
      d.ammo
    );
  } else {
    $('ac').textContent = '-';
    $('ar').textContent = '-';
  }
}
function lootRoll(q) {
  const d = WDEF[q.id];
  if (d && d.type === 'gun') q.clip = ri(0, d.cap);
}
function syncAllNpc() {
  smesh.forEach(m => {
    const s = m.userData.s;
    if (s) {
      npcSyncEquip(s);
      npcVisual(m, s);
    }
  });
}

/* ---------- NPC equipment: first usable weapon in their own inventory, shown in the right hand ---------- */
function npcInv(sv) {
  return svInv(sv).inv;
}
function npcUsable(sv, q) {
  const d = WDEF[q.id];
  if (!d) return false;
  if (d.type === 'melee') return true;
  return (q.clip || 0) > 0 || ammoCount(npcInv(sv), d.ammo) > 0;
}
function npcSyncEquip(sv) {
  const inv = npcInv(sv);
  if (sv.eq && (!inv.items.includes(sv.eq) || !npcUsable(sv, sv.eq))) sv.eq = null; // weapon gone, or a gun with no bullets and no ammo: back to fists
  if (!sv.eq) {
    const q = inv.items.find(q => npcUsable(sv, q));
    if (q) sv.eq = q;
  } // fists are swapped out as soon as something usable is held
  return sv.eq || null;
}
function npcVisual(m, sv) {
  const u = m.userData,
    P = u.P;
  if (!P) return;
  const q = sv.eq,
    id = q ? q.id : null;
  if (u.hid === id && u.hidInit) return;
  u.hid = id;
  u.hidInit = true;
  if (u.hold) {
    P.elL.remove(u.hold);
    u.hold = null;
  }
  const d = q ? WDEF[id] : null;
  u.wk = !d ? 'fist' : d.type === 'gun' ? 'gun' : 'melee';
  if (d) {
    const h = new THREE.Group();
    h.add(cloneModel(id, true));
    if (d.type === 'gun') h.rotation.set(-Math.PI / 2, 0, Math.PI);
    else h.rotation.set(Math.PI / 2 + 0.45, Math.PI / 2, 0);
    h.position.set(0, -0.5, 0.02);
    P.elL.add(h);
    u.hold = h;
  }
  armDefault(m);
}
function npcFace(m, c, x, z) {
  const dx = x - m.position.x,
    dz = z - m.position.z;
  if (c) {
    c.fx = dx;
    c.fz = dz;
    c.face = 0.6;
  }
  m.rotation.y = Math.atan2(dx, dz);
}
function npcStep(m, tx, tz, sp) {
  const p = m.position,
    dx = tx - p.x,
    dz = tz - p.z,
    l = Math.hypot(dx, dz) || 1,
    nx = p.x + (dx / l) * sp,
    nz = p.z + (dz / l) * sp;
  let mv = 0;
  if (!blocked(nx, nz, 0.35, p.y, 1.7)) {
    p.x = nx;
    p.z = nz;
    mv = sp;
  } else if (!blocked(nx, p.z, 0.35, p.y, 1.7)) {
    p.x = nx;
    mv = sp;
  } else if (!blocked(p.x, nz, 0.35, p.y, 1.7)) {
    p.z = nz;
    mv = sp;
  }
  p.y = groundAt(p.x, p.z, p.y);
  return mv;
}
function npcSwingPose(m, st, d) {
  const u = m.userData,
    P = u.P,
    p = Math.min(1, 1 - st.sw / st.swD),
    s = Math.sin(p * Math.PI),
    e = 1 - Math.pow(1 - p, 2),
    A = P.armL,
    E = P.elL,
    h = u.hold;
  switch (d.swing) {
    case 'chop':
      A.rotation.x = -2.6 + e * 1.6;
      E.rotation.x = -0.5 + e * 0.35;
      if (h) h.rotation.x = 2.0 + e * 0.9;
      break;
    case 'slash':
      A.rotation.x = -1.35;
      A.rotation.z = -0.9 + p * 1.9;
      E.rotation.x = -0.4;
      if (h) h.rotation.x = Math.PI / 2 + 0.2;
      break;
    case 'jab':
      A.rotation.x = -1.4;
      E.rotation.x = -1.3 + s * 1.15;
      if (h) h.rotation.x = Math.PI - 0.15;
      break;
    default:
      A.rotation.x = -1.3;
      E.rotation.x = -1.9 + s * 1.7;
  }
}
// One NPC's whole fighting brain. o={R gun range, leash:{x,z,r}|null, home:{x,z}|null, walk, c:companion record|null}
function npcCombat(m, sv, st, dt, o) {
  const p = m.position,
    u = m.userData,
    res = {busy: false, moved: 0};
  st.sync = (st.sync || 0) - dt;
  if (st.sync <= 0) {
    st.sync = 0.5;
    npcSyncEquip(sv);
    npcVisual(m, sv);
  }
  const q = sv.eq,
    d = q ? WDEF[q.id] : FIST,
    gun = d.type === 'gun',
    inv = npcInv(sv);
  st.cd = (st.cd || 0) - dt;
  st.rl = st.rl || 0;
  if (st.sw > 0) {
    st.sw -= dt;
    res.busy = true;
    npcSwingPose(m, st, d);
    const pr = 1 - st.sw / st.swD;
    if (!st.hit && pr >= 0.5) {
      st.hit = true;
      const t = st.tgt;
      if (
        t &&
        zombies.includes(t) &&
        Math.hypot(t.position.x - p.x, t.position.z - p.z) < d.reach * 0.75 + 0.6 &&
        (trainSk(sv, skWid(d)), Math.random() < skMeleeHit(sv, skWid(d)))
      ) {
        S.hit(d.hit, p);
        hitZ(t, d.dmg * (0.9 + (0.2 * skTot(sv, skWid(d))) / 100), PK(PARTS), true, p);
      }
    }
    if (st.sw <= 0) {
      st.sw = 0;
      armDefault(m);
    }
    return res;
  }
  if (gun) {
    if (st.rl > 0) {
      st.rl -= dt;
      if (st.rl <= 0) {
        st.rl = 0;
        const n = Math.min(d.rlN, d.cap - q.clip, ammoCount(inv, d.ammo));
        if (n > 0) {
          ammoTake(inv, d.ammo, n);
          q.clip += n;
        }
        if (q.clip < d.cap && ammoCount(inv, d.ammo) > 0) {
          st.rl = d.rlT * 1.2;
          S.rlStep(d, p);
        }
      }
    }
    let b = null,
      bd = o.R;
    zombies.forEach(z => {
      if (z.userData.sleep) return;
      const dd = z.position.distanceTo(p);
      if (dd < bd && los(p, z.position)) {
        bd = dd;
        b = z;
      }
    });
    if (!b) {
      if (q.clip < d.cap && st.rl <= 0 && ammoCount(inv, d.ammo) > 0) {
        st.rl = d.rlT * 1.2;
        S.rlStep(d, p);
      }
      return res;
    }
    npcFace(m, o.c, b.position.x, b.position.z);
    if (q.clip <= 0) {
      if (ammoCount(inv, d.ammo) <= 0) {
        npcSyncEquip(sv);
        npcVisual(m, sv);
      } else if (st.rl <= 0) {
        st.rl = d.rlT * 1.2;
        S.rlStep(d, p);
      }
      return res;
    }
    if (st.rl > 0) {
      if (d.rlN === 1) st.rl = 0;
      else return res;
    }
    if (st.cd > 0) {
      aimPose(m, b.position.x, tgtY(b), b.position.z);
      return res;
    }
    const ns = Math.min(d.burst, q.clip);
    st.cd = d.npcCd + rnd(0, 0.25);
    q.clip -= ns;
    S.shot(d.snd, p);
    aimPose(m, b.position.x, tgtY(b), b.position.z);
    u.aimT = 0.8;
    const ch = Math.min(
      0.95,
      Math.max(0.1, (0.95 - bd / (d.rng * 1.15)) * skNpcAcc(sv) + d.acc * 0.6 - (d.pel > 1 ? bd / (d.rng * 2.4) : 0))
    );
    trainSk(sv, 'guns');
    const mzp = npcMuzzle(m);
    for (let i = 0; i < ns; i++)
      for (let k = 0; k < d.pel; k++) {
        const hit = Math.random() < ch;
        if (k < 3) npcTrace(mzp, b, hit, m);
        if (hit && zombies.includes(b))
          dmgZ(
            b,
            Math.max(1, d.dmg + fzBand(d, bd)) *
              (0.9 + (0.2 * skTot(sv, 'guns')) / 100) *
              (bd > d.rng ? Math.max(0.4, d.rng / bd) : 1),
            p
          );
      }
    return res;
  }
  // ---- melee / fists: only zombies that are really close ----
  let t = null,
    td = d.aggro || 7;
  zombies.forEach(z => {
    const zu = z.userData;
    if (zu.sleep || Math.abs(z.position.y - p.y) > 1.7) return;
    const dd = Math.hypot(z.position.x - p.x, z.position.z - p.z);
    if (dd >= td) return;
    if (o.leash && Math.hypot(z.position.x - o.leash.x, z.position.z - o.leash.z) > o.leash.r + 2) return;
    if (!los(p, z.position)) return;
    t = z;
    td = dd;
  });
  if (t) {
    st.tgt = t;
    res.busy = true;
    npcFace(m, o.c, t.position.x, t.position.z);
    const eng = d.reach * 0.75;
    if (td > eng - 0.25) {
      if (o.walk) {
        const sp = 3.6 * dt,
          dx = t.position.x - p.x,
          dz = t.position.z - p.z,
          l = Math.hypot(dx, dz) || 1,
          nx = p.x + (dx / l) * sp,
          nz = p.z + (dz / l) * sp;
        if (!o.leash || Math.hypot(nx - o.leash.x, nz - o.leash.z) <= o.leash.r)
          res.moved = npcStep(m, t.position.x, t.position.z, sp);
      }
    } else if (st.cd <= 0) {
      st.sw = st.swD = d.swD;
      st.hit = false;
      st.cd = d.npcCd + rnd(0, 0.3);
      S.swing(q ? 1 : 0, p);
    }
    return res;
  }
  if (o.home && Math.hypot(p.x - o.home.x, p.z - o.home.z) > 1.8) {
    res.busy = true;
    npcFace(m, o.c, o.home.x, o.home.z);
    res.moved = npcStep(m, o.home.x, o.home.z, 3.2 * dt);
  }
  return res;
}
function legAnim(m, u, mv, dt) {
  const P = u.P;
  if (!P) return;
  u.ph = (u.ph || 0) + mv * 3;
  const sw = Math.min(1, mv / dt / 3 || 0),
    sn = Math.sin(u.ph);
  P.legL.rotation.x = sn * 0.7 * sw;
  P.legR.rotation.x = -sn * 0.7 * sw;
}
// fort survivors (siege / base): same brain, anchored to their post
function survFight(dt) {
  if (!zombies.length) return;
  smesh.forEach(m => {
    const u = m.userData;
    if (u.kind !== 'surv' || !u.s || u.s.hp <= 0) return;
    const st = u.nf || (u.nf = {});
    if (!st.home) st.home = {x: m.position.x, z: m.position.z};
    const r = npcCombat(m, u.s, st, dt, {
      R: 24,
      walk: true,
      leash: {x: st.home.x, z: st.home.z, r: 6},
      home: st.home,
      c: null
    });
    legAnim(m, u, r.moved, dt);
  });
}
function jump(dt) {
  const p = pl.position;
  let fy = p.y - (G.eyeUsed || 1.6),
    gy = groundAt(p.x, p.z, fy);
  if (fy <= gy + 0.02 && G.vy <= 0) {
    fy = gy;
    G.vy = 0;
    if (K.Space && !G.crouch && locked && !invOpen) {
      G.vy = 7.2;
      fy += 0.01;
    }
  }
  if (fy > gy + 0.02 || G.vy > 0) {
    G.vy -= 18 * dt;
    fy += G.vy * dt;
    if (fy <= gy && G.vy <= 0) {
      fy = gy;
      G.vy = 0;
    }
  }
  G.eyeUsed = G.eyeH;
  p.y = G.eyeH + fy;
}
function dmgZ(z, d, fr) {
  fr = fr || pl.position;
  const u = z.userData;
  u.see = true;
  u.hunt = 2;
  u.lx = pl.position.x;
  u.lz = pl.position.z;
  u.lt = 1;
  u.ld = d;
  u.hp -= d;
  dmgNum(z, d);
  bloodSpray(
    z.position.x,
    z.position.y + 1.1 * z.scale.x,
    z.position.z,
    z.position.x - fr.x,
    z.position.z - fr.z,
    ri(5, 9),
    1
  );
  if (u.hp > 0) {
    if (u.sleep) wakeZ(z);
    flashObj(z, 0.25);
    const dx = z.position.x - fr.x,
      dz = z.position.z - fr.z,
      l = Math.hypot(dx, dz) || 1,
      k = Math.min(0.45, d / 60 + 0.15),
      nx = z.position.x + (dx / l) * k,
      nz = z.position.z + (dz / l) * k;
    if (!blocked(nx, nz)) {
      z.position.x = nx;
      z.position.z = nz;
    }
    u.stag = 0.22;
    u.cd = Math.max(u.cd || 0, 0.4);
  } else {
    flashObj(z, 0.4);
    killZ(z);
  }
}
