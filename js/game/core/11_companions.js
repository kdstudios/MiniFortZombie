/* MINI FORT ZOMBIE - core 11/13: companions
   Companions, command wheel, travel, use/place/carry.
   Part of the old js/game/core.js (split in v080). Classic script: shares globals with the other core parts; load in numeric order. */
/* ===== companions (survivors that follow you on scavenger runs) ===== */
const comps = [];
let holdC = null;
function spawnComp(sv, x, z) {
  const m = makePerson(RC[sv.role] || 0x0284c7, x, z, sv.role || 'Generalist'),
    P = m.userData.P;
  sv.range = G.uRange || sv.range || 2;
  svInv(sv);
  const c = {m, s: sv, follow: G.uFollow !== false, range: sv.range, cd: rnd(0.4, 1), P, ph: 0};
  m.userData = {kind: 'comp', s: sv, c, P};
  hpBar(m);
  scene.add(m);
  smesh.push(m);
  comps.push(c);
  npcVisual(m, sv);
  return c;
}
// weapon arms pitch down/up to the target's height - crawling and lying zombies are low, so the gun must tip down at them
function tgtY(z) {
  const u = z.userData;
  return u.crawl || (u.sleep && u.pose === 'lie') ? 0.3 : 1.1;
}
function aimPose(m, tx, ty, tz) {
  const P = m.userData.P;
  if (!P) return;
  const d = Math.max(0.8, Math.hypot(tx - m.position.x, tz - m.position.z)),
    a = Math.atan2(1.3 - ty, d),
    base = -(PI / 2 - a);
  P.armL.rotation.set(base + 0.25, 0, 0);
  P.elL.rotation.x = -0.25;
  P.armR.rotation.x = base + 0.5;
  P.elR.rotation.x = -0.5;
}
function armDefault(m) {
  const P = m.userData.P;
  if (!P) return;
  const k = m.userData.wk || 'fist';
  if (k === 'gun') {
    P.armL.rotation.set(-1.25, 0, 0);
    P.elL.rotation.x = -0.25;
    P.armR.rotation.x = -1;
    P.elR.rotation.x = -0.5;
  } else if (k === 'melee') {
    P.armL.rotation.set(-0.55, 0, 0);
    P.elL.rotation.x = -1.0;
    P.armR.rotation.x = -0.15;
    P.elR.rotation.x = -0.15;
    if (m.userData.hold) m.userData.hold.rotation.x = Math.PI / 2 + 0.45;
  } else {
    P.armL.rotation.set(-0.12, 0, 0);
    P.elL.rotation.x = -0.12;
    P.armR.rotation.x = -0.12;
    P.elR.rotation.x = -0.12;
  }
}
function toggleFollow(c) {
  c.follow = !c.follow;
  c.home = c.follow ? null : {x: c.m.position.x, z: c.m.position.z};
  toast(c.s.name + (c.follow ? ' is following you' : ' stays here'));
  S.voice(c.m.position, c.follow ? 230 : 190);
}
function updComps(dt) {
  const p0 = pl.position;
  for (let i = comps.length - 1; i >= 0; i--) {
    const c = comps[i],
      m = c.m,
      p = m.position;
    if (c.s.hp <= 0 || !m.parent) {
      comps.splice(i, 1);
      continue;
    }
    let dx = p0.x - p.x,
      dz = p0.z - p.z,
      d = Math.hypot(dx, dz);
    let mv = 0;
    /* v081: followers walk a route along the floors (stairs, round walls, out of the window you used) when you are on another
       floor or out of a straight line (js/layers/zfloors.js); directly above or below you still counts as far */
    let wpt = null;
    if (c.follow && !c.vs && window.NAVF && NAVF.compWay) wpt = NAVF.compWay(c, dt);
    if (wpt && wpt.drop) continue;
    if (Math.abs(p0.y - (G.eyeUsed || 1.6) - p.y) > 1.5) d = Math.max(d, 4);
    if (c.face > 0) {
      c.face -= dt;
      m.rotation.y = Math.atan2(c.fx, c.fz);
      if (c.face <= 0) armDefault(m);
    }
    if (c.vs) {
      stepVault(m, c, dt);
      continue;
    }
    if (c.follow) c.home = null;
    else if (!c.home) c.home = {x: p.x, z: p.z};
    const fight = npcCombat(m, c.s, c.st || (c.st = {}), dt, {
      R: [0, 4.5, 12, 20][c.range],
      walk: true,
      c,
      leash: c.follow ? {x: p0.x, z: p0.z, r: 14} : {x: c.home.x, z: c.home.z, r: 9},
      home: c.follow ? null : c.home
    });
    if (fight.busy) {
      mv = fight.moved;
    } else if (c.follow && d > 3) {
      const sp = (d > 10 ? 7 : 4.4) * dt;
      if (wpt) {
        dx = wpt.x - p.x;
        dz = wpt.z - p.z;
      }
      const dl = Math.hypot(dx, dz) || 1;
      let ux = dx / dl,
        uz = dz / dl;
      if (c.av > 0) {
        c.av -= dt;
        const t = ux;
        ux = -uz * c.avs * 0.8 + ux * 0.4;
        uz = t * c.avs * 0.8 + uz * 0.4;
        const l = Math.hypot(ux, uz) || 1;
        ux /= l;
        uz /= l;
      }
      const nx = p.x + ux * sp,
        nz = p.z + uz * sp;
      let bk = blocked(nx, nz, 0.35, p.y + 0.31, 1.39); // v081: steps up like the player
      // v081: on a route that climbs, scramble up two treads at once (switchback stairs)
      c.scr = 0;
      // v081: already inside it (a door leaf swung onto them): any step that takes them further from its middle is allowed
      if (bk && bk === blocked(p.x, p.z, 0.35, p.y + 0.31, 1.39)) {
        const bx = (bk.min.x + bk.max.x) / 2,
          bz = (bk.min.z + bk.max.z) / 2,
          thinX = bk.max.x - bk.min.x < bk.max.z - bk.min.z,
          sx = thinX ? Math.sign(p.x - bx) || 1 : 0,
          sz = thinX ? 0 : Math.sign(p.z - bz) || 1;
        p.x += sx * sp;
        p.z += sz * sp;
        mv = sp;
        bk = 'out';
      }
      if (bk && bk !== 'out' && wpt && wpt.y > p.y + 0.15 && !bk.door && !bk.win && !bk.bar && bk.max.y <= p.y + 0.75)
        if (!blocked(nx, nz, 0.35, bk.max.y + 0.01, 1.7)) {
          bk = null;
          c.scr = 1;
        }
      if (bk === 'out') {
      } else if (!bk) {
        p.x = nx;
        p.z = nz;
        mv = sp;
        c.stk = 0;
      } else {
        const dr = doorOf(bk);
        if (dr && !dr.open) {
          if (!dr.locked) doorOpen(dr, p.x, p.z); // v081: swing it away from the follower (it could swing onto them)
        }
        // (v081: an open door's leaf in the way: slide round it below, instead of "opening" it again forever)
        // windows are off limits: glass is never smashed, and sills next to a window are treated as plain wall
        else if (
          p.y < 0.6 &&
          bk.max.y <= 1.35 &&
          !bk.bar &&
          !bk.win &&
          d > 2 &&
          !winNear(nx, nz, 2.4) &&
          startVault(m, c, ux, uz)
        ) {
        } else {
          // (v081: a slide along an axis it is barely moving on is no slide: count it as stuck so the side-step kicks in)
          if (Math.abs(ux) > 0.25 && !blocked(nx, p.z, 0.35, p.y + 0.31, 1.39)) {
            p.x = nx;
            mv = sp;
          } else if (Math.abs(uz) > 0.25 && !blocked(p.x, nz, 0.35, p.y + 0.31, 1.39)) {
            p.z = nz;
            mv = sp;
          } else c.stk = (c.stk || 0) + dt;
          if (c.stk > 0.6) {
            c.stk = 0;
            c.av = 1.2;
            c.avs = Math.random() < 0.5 ? 1 : -1;
          }
        }
      }
      if (!(c.face > 0)) m.rotation.y = Math.atan2(ux, uz);
    }
    // only followers rush back to the player; anyone told to stay stays put
    if (c.follow && d > 30) {
      for (let k = 0; k < 8; k++) {
        const tx = p0.x + rnd(-3, 3),
          tz = p0.z + rnd(-3, 3);
        if (!blocked(tx, tz, 0.4, p0.y - (G.eyeUsed || 1.6), 1.7)) {
          p.x = tx;
          p.z = tz;
          break;
        }
      }
    }
    p.y = groundAt(p.x, p.z, p.y + (c.scr ? 0.5 : 0.12)); // v081: up and down stairs (a scramble: two treads)
    c.scr = 0;
    c.ph += mv * 3;
    const sw = Math.min(1, mv / dt / 3 || 0),
      sn = Math.sin(c.ph);
    c.P.legL.rotation.x = sn * 0.7 * sw;
    c.P.legR.rotation.x = -sn * 0.7 * sw;
  }
}

/* ===== damage feedback, survivor health bars, command wheel ===== */
let wheel = null;
function tintHit(o, on) {
  o.traverse(c => {
    const m = c.material;
    if (!m || !m.emissive) return;
    const u = m.userData;
    if (on) {
      if (u.em0 === undefined) u.em0 = m.emissive.getHex();
      m.emissive.setHex(0xcc0000);
    } else if (u.em0 !== undefined) {
      m.emissive.setHex(u.em0);
      delete u.em0;
    }
  });
} // v063: original glow kept on the MATERIAL (parts share one material, so the 2nd mesh used to save the red)
function flashObj(o, t) {
  o.userData.flash = t;
  tintHit(o, 1);
}
function hpBar(m) {
  const cv = document.createElement('canvas');
  cv.width = 128;
  cv.height = 24;
  const t = new THREE.CanvasTexture(cv),
    sp = new THREE.Sprite(new THREE.SpriteMaterial({map: t, transparent: true, depthTest: false}));
  sp.scale.set(1.3, 0.24, 1);
  sp.position.y = 2.25;
  sp.raycast = () => {};
  sp.renderOrder = 5;
  m.add(sp);
  m.userData.hb = {cv, t, v: -1};
}
function hpDraw(m) {
  const u = m.userData,
    h = u.hb;
  if (!h) return;
  const v = Math.round(u.s.hp);
  if (v === h.v) return;
  h.v = v;
  const x = h.cv.getContext('2d');
  x.clearRect(0, 0, 128, 24);
  x.fillStyle = '#220000';
  x.fillRect(0, 0, 128, 24);
  x.fillStyle = '#d11';
  x.fillRect(2, 2, (124 * Math.max(0, Math.min(100, v))) / 100, 20);
  x.strokeStyle = '#000';
  x.lineWidth = 2;
  x.strokeRect(1, 1, 126, 22);
  x.fillStyle = '#fff';
  x.font = 'bold 17px monospace';
  x.textAlign = 'center';
  x.fillText(v, 64, 19);
  h.t.needsUpdate = true;
}
function fortComp(o) {
  const s = o.userData.s;
  return {s, m: o, surv: true, follow: false, range: s.range || 2};
}
// at the fort survivors are stand-in meshes; Follow turns one into a normal following survivor, Stop leaves them where they stand
function fortFollow(c) {
  const m = c.m,
    s = c.s,
    x = m.position.x,
    z = m.position.z;
  scene.remove(m);
  smesh = smesh.filter(q => q !== m);
  const nc = spawnComp(s, x, z);
  nc.follow = true;
  toast(s.name + ' is following you');
  S.voice(nc.m.position, 230);
}
function wheelOpen(c) {
  wheel = {c, x: 0, y: 0, sel: -1};
  let o = $('wh');
  if (!o) {
    o = document.createElement('div');
    o.id = 'wh';
    o.style.cssText =
      'position:absolute;left:50%;top:50%;width:360px;height:360px;margin:-180px 0 0 -180px;z-index:55;pointer-events:none;font:700 15px "Courier New",monospace;color:#eee';
    document.body.appendChild(o);
  }
  o.style.display = 'block';
  wheelUI();
}
function wheelUI() {
  const w = wheel,
    o = $('wh'),
    c = w.c,
    R = ['', 'SHORT', 'MEDIUM', 'FAR'];
  w.sel = Math.hypot(w.x, w.y) < 22 ? -1 : Math.abs(w.x) > Math.abs(w.y) ? (w.x > 0 ? 1 : 3) : w.y > 0 ? 2 : 0;
  const L = [
    ['Inventory', '50%', '4%'],
    [c.follow ? 'Stop following' : 'Follow me', '82%', '46%'],
    ['Range: ' + R[c.range], '50%', '88%'],
    ['Nevermind', '18%', '46%']
  ];
  o.innerHTML =
    `<div style="position:absolute;inset:60px;border-radius:50%;background:rgba(0,0,0,.65);border:2px solid #7f1d1d;text-align:center;line-height:240px;color:#facc15">${c.s.name}</div>` +
    L.map(
      (l, i) =>
        `<div style="position:absolute;left:${l[1]};top:${l[2]};transform:translate(-50%,0);padding:8px 12px;border-radius:8px;border:2px solid ${w.sel === i ? '#facc15' : '#555'};background:${w.sel === i ? '#7f1d1d' : 'rgba(0,0,0,.8)'};white-space:nowrap">${l[0]}</div>`
    ).join('') +
    `<div style="position:absolute;left:${175 + w.x * 0.8}px;top:${175 + w.y * 0.8}px;width:10px;height:10px;border-radius:50%;background:#facc15"></div>`;
}
function wheelDone() {
  const w = wheel;
  wheel = null;
  $('wh').style.display = 'none';
  const c = w.c;
  if (w.sel === 0) openContainer(svInv(c.s));
  else if (w.sel === 1) {
    if (c.surv) fortFollow(c);
    else toggleFollow(c);
  } else if (w.sel === 2) {
    c.range = (c.range % 3) + 1;
    c.s.range = c.range;
    toast('Shooting range: ' + ['', 'SHORT', 'MEDIUM', 'FAR'][c.range]);
  }
}
function bringHome() {
  comps.forEach(c => {
    if (c.s.pending) {
      if (c.follow && G.surv.length < 16) {
        delete c.s.pending;
        G.surv.push(c.s);
        fzJoined(c.s);
        toast(c.s.name + ' joined the fort');
      } else toast(c.s.name + ' was left behind');
    }
  });
  G.surv = G.surv.filter(q => q.hp > 0);
}
function travel(msg, cb) {
  G.hqPause = false;
  G.mode = 'TRAVEL';
  document.exitPointerLock();
  $('hud').classList.add('hide');
  ui(null);
  let o = $('trv');
  if (!o) {
    o = document.createElement('div');
    o.id = 'trv';
    o.style.cssText =
      'position:absolute;inset:0;z-index:70;background:#000;color:#facc15;display:flex;align-items:center;justify-content:center;font:700 34px Impact,sans-serif;letter-spacing:3px;opacity:0;transition:opacity .8s;pointer-events:none';
    document.body.appendChild(o);
  }
  o.textContent = msg;
  o.style.display = 'flex';
  setTimeout(() => (o.style.opacity = 1), 20);
  engineSnd(4);
  setTimeout(() => {
    cb();
    o.style.opacity = 0;
    setTimeout(() => (o.style.display = 'none'), 900);
  }, 4200);
}
function engineSnd(d) {
  if (!AC || !SFX) return;
  const t = AC.currentTime,
    o = AC.createOscillator(),
    o2 = AC.createOscillator(),
    f = AC.createBiquadFilter(),
    g = AC.createGain(),
    lf = AC.createOscillator(),
    lg = AC.createGain();
  o.type = 'sawtooth';
  o2.type = 'square';
  const fr = [
    [0.8, 38],
    [1.6, 72],
    [1.9, 52],
    [2.7, 88],
    [3, 62],
    [d - 0.4, 72],
    [d, 40]
  ];
  o.frequency.setValueAtTime(38, t);
  o2.frequency.setValueAtTime(19, t);
  fr.forEach(([a, b]) => {
    o.frequency.linearRampToValueAtTime(b, t + a);
    o2.frequency.linearRampToValueAtTime(b / 2, t + a);
  });
  f.type = 'lowpass';
  f.frequency.value = 420;
  lf.frequency.value = 14;
  lg.gain.value = 0.05;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(0.3, t + 0.5);
  g.gain.setValueAtTime(0.3, t + d - 0.6);
  g.gain.linearRampToValueAtTime(0, t + d);
  lf.connect(lg);
  lg.connect(g.gain);
  o.connect(f);
  o2.connect(f);
  f.connect(g);
  g.connect(SFX);
  [o, o2, lf].forEach(x => {
    x.start(t);
    x.stop(t + d + 0.1);
  });
  N(SFX, 'lowpass', 500, 200, 1, d, 0.1);
  T(SFX, 'triangle', 140, 50, 0.3, 0.5, 0);
  T(SFX, 'triangle', 140, 50, 0.3, 0.5, d - 0.1);
}
function placeCarry() {
  const f = [-Math.sin(yaw), -Math.cos(yaw)],
    x = Math.max(FORT.x - 14, Math.min(FORT.x + 14, pl.position.x + f[0] * 2.2)),
    z = Math.max(FORT.z - 14, Math.min(FORT.z + 14, pl.position.z + f[1] * 2.2)),
    s = carry.userData.s;
  carry.position.set(x, 0, z);
  carry.traverse(c => {
    delete c.raycast;
  });
  s.px = x;
  s.pz = z;
  toast(s.name + ' placed');
  carry = null;
}
// v056: truck reach measured from the truck body (collider -1.6..1.6 x, -4.6..5.5 z), not its centre: the old 5 m radius
// could not be reached from the front bumper (where you spawn) or the tailgate, so the truck seemed dead.
function nearTruck(r) {
  if (r == null) r = 2.6;
  const x = pl.position.x - TRUCK.x,
    z = pl.position.z - TRUCK.z,
    dx = Math.max(0, Math.abs(x) - 1.6),
    dz = Math.max(0, z - 5.5, -4.6 - z);
  return Math.hypot(dx, dz) < r && pl.position.y < 7;
}
function use() {
  if (carry) {
    placeCarry();
    return;
  }
  if (G.mode === 'EXPEDITION' && nearTruck()) {
    bringHome();
    advanceTime(G.tripH || skScoutHours());
    return travel('Driving back to the fort...', () => toHQ());
  }
  const h = look(false);
  if (!h || !h.o || h.d > 3.5) return;
  const o = h.o,
    u = o.userData;
  if (u.kind === 'loot') {
    skOpenCont(u.cont);
  } else if (u.kind === 'door' && u.d.locked && !u.d.open) {
    skLockpick({door: u.d});
  } else if (u.kind === 'door') {
    const d = u.d;
    if (d.open) doorClose(d);
    else doorOpen(d, pl.position.x, pl.position.z);
  } else if ((u.kind === 'surv' || u.kind === 'comp') && G.mode === 'FORT_BUILD') {
    if (u.c) u.c.follow = false;
    carry = o;
    o.traverse(c => {
      c.raycast = () => {};
    });
    toast('Carrying ' + u.s.name + ' - press E to put them down');
  } else if (u.kind === 'npc') {
    if (!skRecruitCheck(o)) return;
    scene.remove(o);
    npcList = npcList.filter(q => q !== o);
    S.voice(o.position, 210);
    const sv = fzSurvivor() || {
      id: Date.now() + ri(0, 999),
      name: NAMES[ri(0, 9)] + ' #' + ++G.rescued,
      role: 'Generalist',
      hp: 100,
      morale: 60,
      hunger: 0,
      skill: ri(1, 4),
      pending: 1
    };
    spawnComp(sv, o.position.x, o.position.z);
    toast(sv.name + ' will follow you. Get them to the truck to bring them home.');
  } else if (u.kind === 'bar' && G.mode === 'FORT_BUILD') {
    if (G.mat < 5) return toast('Need 5 materials');
    G.mat -= 5;
    u.bar.hp = Math.min(100, u.bar.hp + skRepair(G));
    trainSk(G, 'workman');
    tint(u.bar);
  }
}
function place(type) {
  if (G.mode !== 'FORT_BUILD') return;
  const f = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw)),
    p = pl.position,
    x = Math.round((p.x + f.x * 3.5) / 2) * 2,
    z = Math.round((p.z + f.z * 3.5) / 2) * 2,
    c = type === 'bar' ? 15 : 20;
  if (Math.abs(x - FORT.x) > 13 || z > FORT.z + 13 || z < FORT.z - 12) return toast('Build inside the fort yard');
  if (G.mat < c) return toast('Not enough materials');
  if (G.bars.concat(G.spikes).some(o => Math.abs(o.x - x) < (type === 'bar' ? 4 : 1.5) && Math.abs(o.z - z) < 1.5))
    return toast('Too close to another structure');
  trainSk(G, 'workman');
  G.mat -= c;
  if (type === 'bar') {
    const b = {x, z, hp: 100};
    G.bars.push(b);
    mkBar(b);
  } else {
    const s = {x, z, hp: 80, t: 0};
    G.spikes.push(s);
    mkSpike(s);
  }
}
