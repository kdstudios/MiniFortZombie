/* =====================================================================================================
   MINI FORT ZOMBIE v071 - MAIN MENU WORLD
   Behind the title, main menu, occupation, fort select and menu Options: a dedicated town (fixed seed, so it is the same place
   every launch) under the Doom sky at night, with hand-placed set pieces and a scripted camera that fades between shots:
   a crane over the church, a push-in on the cemetery, a worm's-eye view of the dead walking past, the park corner, the main
   street and the gas station forecourt. v092 adds six: the congregation (the dead gathering in front of the church: always
   the first scene), the graves (a low pan past sleepers, one of which gets up), a zoom onto PIZZABYTES, a bird's-eye turn over
   the crossroads, a follow shot behind a lone walker, and the motel pool. A shot can now zoom (fov) and hold sleepers. Shots are found by building type, so they survive generator changes; any shot whose
   building is missing is skipped.
   - built a moment after the title appears (the illustrated backdrop covers the build, then cross-fades out)
   - the whole thing stops the moment a game, a saved game or a Dev test world starts (their world build clears this one)
   - Options > Graphics > Display > Menu background switches back to the illustrated backdrop (saved: mfz_menuworld)
   Visual only: no AI, no gameplay state. G.time is only forced while no campaign exists (G.day < 1).
   ===================================================================================================== */
(function () {
  'use strict';
  const $ = id => document.getElementById(id);
  /* v092: buildings the scenes are staged at: the town planner (planTownV2) is asked to include one of each */
  const MUST = ['church', 'cemetery', 'bakery', 'sunshine_motel', 'eco_pump', 'playground_memorial_park'];
  const SEED = 1408,
    SHOT = 10.5,
    FADE = 1.3;
  const MW = (window.MENUWORLD = {
    on: false,
    building: false,
    built: false,
    shots: [],
    actors: [],
    cur: -1,
    t: 0,
    enabled: true,
    err: null
  });
  try {
    MW.enabled = localStorage.getItem('mfz_menuworld') !== '0';
  } catch (e) {}
  const lerp = (a, b, t) => a + (b - a) * t,
    ease = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  function seeded(seed, fn) {
    const o = Math.random;
    let a = seed >>> 0;
    Math.random = function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    try {
      return fn();
    } finally {
      Math.random = o;
    }
  }
  const titleState = () => typeof G !== 'undefined' && G.mode === 'TITLE';
  const free = (x, z, h) => !blocked(x, z, 0.35, h || 0, 1.7);

  /* ---------------- overlays ---------------- */
  const fade = document.createElement('div');
  fade.id = 'mwFade';
  document.body.appendChild(fade);

  /* ---------------- build ---------------- */
  function build() {
    if (
      MW.building ||
      MW.on ||
      MW.built ||
      !MW.enabled ||
      !titleState() ||
      typeof scene === 'undefined' ||
      !scene ||
      !renderer
    )
      return;
    MW.building = true;
    MW.err = null;
    const dayWas = G.day,
      fortWas = G.fort;
    try {
      G.fort = 'police';
      G.mode = 'EXPEDITION';
      const ms0 = G.mission;
      G.mission = null;
      const ce = console.error;
      console.error = function () {
        if (/TOWN VALIDATION/.test(String(arguments[0]))) return;
        return ce.apply(console, arguments);
      }; // the generator's own lot warnings are for Dev Mode, not the title screen
      window.TOWN_MUST = MUST;
      try {
        seeded(SEED, () => buildWorld());
      } finally {
        delete window.TOWN_MUST;
        console.error = ce;
        G.mode = 'TITLE';
        G.mission = ms0;
        G.fort = fortWas;
        G.day = dayWas;
      }
      // the town's own population would just stand there frozen: clear it, the set pieces bring their own dead
      zombies.slice().forEach(z => scene.remove(z));
      zombies.length = 0;
      (npcList || []).forEach(n => {
        const m = n && (n.isObject3D ? n : n.m || n.mesh || n.g);
        if (m && m.parent) m.parent.remove(m);
      });
      MW.marker = new THREE.Object3D();
      MW.marker.name = 'menuworld';
      scene.add(MW.marker);
      seeded(SEED + 7, () => makeShots());
      MW.built = true;
      start();
    } catch (e) {
      MW.err = e;
      console.warn('[menuworld] build failed, keeping the illustrated backdrop', e);
      try {
        clearWorld();
      } catch (_) {}
    }
    MW.building = false;
  }
  /* v075: built step by step behind the title's loading bar (js/game/loader.js); the camera only starts after "Press any key" (MW.startNow) */
  function rngOf(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  MW.buildStaged = async function (onP) {
    if (
      MW.building ||
      MW.on ||
      MW.built ||
      !MW.enabled ||
      !titleState() ||
      typeof scene === 'undefined' ||
      !scene ||
      !renderer ||
      typeof worldSteps !== 'function'
    )
      return false;
    MW.building = true;
    MW.err = null;
    const dayWas = G.day,
      fortWas = G.fort,
      ms0 = G.mission,
      rng = rngOf(SEED),
      ce = console.error;
    const filt = function () {
      if (/TOWN VALIDATION/.test(String(arguments[0]))) return;
      return ce.apply(console, arguments);
    };
    /* v085: a game or a Dev Mode world started while the menu town was still being built step by step: stop building at once
       (the remaining steps used to keep adding the menu town's pieces and zombies to the new world, then clearWorld() wiped it) */
    const ABORT = new Error('left the title while loading');
    const wrap = fn => {
      if (!titleState()) throw ABORT;
      const o = Math.random,
        mo = G.mode;
      Math.random = rng;
      console.error = filt;
      G.fort = 'police';
      G.mode = 'EXPEDITION';
      G.mission = null; // the same seeded town as the one-shot build: the RNG state carries over between steps
      window.TOWN_MUST = MUST;
      try {
        return fn();
      } finally {
        delete window.TOWN_MUST;
        Math.random = o;
        console.error = ce;
        G.mode = mo;
        G.mission = ms0;
        G.fort = fortWas;
        G.day = dayWas;
      }
    };
    try {
      const steps = wrap(() => worldSteps());
      await MFZLOAD.run(steps, {wrap, onProgress: onP, noWarm: true}); // v088: warmed below, once the town's own dead are gone
      if (!titleState()) throw new Error('left the title while loading');
      zombies.slice().forEach(z => scene.remove(z));
      zombies.length = 0;
      (npcList || []).forEach(n => {
        const m = n && (n.isObject3D ? n : n.m || n.mesh || n.g);
        if (m && m.parent) m.parent.remove(m);
      });
      MW.marker = new THREE.Object3D();
      MW.marker.name = 'menuworld';
      scene.add(MW.marker);
      seeded(SEED + 7, () => makeShots());
      if (MFZLOAD.warm && titleState()) await MFZLOAD.warm({bar: {set: onP}, f0: 0.9, f1: 1});
      if (!titleState()) throw new Error('left the title while loading');
      MW.built = true;
    } catch (e) {
      MW.err = e;
      if (e === ABORT || !titleState()) {
        MW.building = false; // another world owns the scene now: leave it alone
        return false;
      }
      console.warn('[menuworld] staged build failed, keeping the illustrated backdrop', e);
      try {
        clearWorld();
      } catch (_) {}
    }
    MW.building = false;
    return MW.built;
  };
  MW.startNow = function () {
    if (MW.built && !MW.on && titleState()) start();
  };
  function start() {
    MW.on = true;
    MW.cur = -1;
    MW.t = SHOT;
    document.body.classList.add('menuworld');
    MW.fovWas = camera.fov;
    camera.fov = 58;
    camera.updateProjectionMatrix();
    camera.children.forEach(c => {
      if (!c.isLight) {
        c.userData.mwVis = c.visible;
        c.visible = false;
      }
    });
    try {
      RGATM.force('doom');
      RGATM.snap();
    } catch (e) {}
    if (!(G.day >= 1)) G.time = 23.6;
    fade.style.opacity = '1';
    next();
  }
  function stop() {
    if (!MW.on && !MW.built) return;
    MW.on = false;
    MW.built = false;
    document.body.classList.remove('menuworld');
    if (MW.fovWas) {
      camera.fov = G.fov || MW.fovWas;
      camera.updateProjectionMatrix();
    }
    camera.children.forEach(c => {
      if (!c.isLight && c.userData.mwVis !== undefined) {
        c.visible = c.userData.mwVis;
        delete c.userData.mwVis;
      }
    });
    try {
      RGATM.force(null);
    } catch (e) {}
    MW.actors = [];
    MW.shots = [];
    fade.style.opacity = '0';
    camera.rotation.z = 0;
  }

  /* ---------------- actors ---------------- */
  function actor(x, z, o) {
    o = o || {};
    const n0 = zombies.length;
    let tries = 0;
    while (!o.exact && !free(x, z) && tries < 20) {
      x += (Math.random() - 0.5) * 1.5;
      z += (Math.random() - 0.5) * 1.5;
      tries++;
    }
    // v092: an exact spot (a grave plot, the pool) may be one zombie() refuses: spawn on the nearest free ground, then move it there
    let sx = x,
      sz = z;
    if (o.exact && blocked(x, z, 0.5)) {
      search: for (let r = 1; r < 14; r += 1)
        for (let k = 0; k < 10; k++) {
          const qx = x + Math.cos(k * 0.628) * r,
            qz = z + Math.sin(k * 0.628) * r;
          if (!blocked(qx, qz, 0.5)) {
            sx = qx;
            sz = qz;
            break search;
          }
        }
    }
    zombie(sx, sz, o.kind || (Math.random() < 0.2 ? 'brute' : 'walker'), false);
    if (zombies.length <= n0) return null;
    const g = zombies[zombies.length - 1],
      u = g.userData;
    g.position.set(x, 0, z);
    u.sleep = false;
    u.rise = 0;
    u.ragT = 0;
    u.flop = 0;
    u.see = !!o.reach;
    u.hunt = 0;
    g.rotation.set(0, o.face || 0, 0);
    try {
      if (g.userData.parts && g.userData.parts.body) {
        const P = g.userData.parts;
        P.body.rotation.set(0, 0, 0);
      }
    } catch (e) {}
    if (o.crawl) {
      try {
        dismember(g, 'legL', x, z);
        dismember(g, 'legR', x, z);
      } catch (e) {}
      u.crawl = true;
    }
    if (o.sleep) {
      // v092: a sleeper (lying on its back or sitting slumped); o.wakeAt (s into the shot) gets it up, slowly
      u.sleep = true;
      u.pose = o.sleep;
      try {
        sleepPose(g);
      } catch (e) {}
      g.rotation.y = o.face || 0;
    }
    const a = {
      g,
      u,
      sleep: o.sleep || null,
      ghost: !!o.ghost,
      wakeAt: o.wakeAt || 0,
      t: 0,
      home: [g.position.x, g.position.z],
      path: o.path || null,
      sp: o.sp || 0.75,
      mode: o.path ? 'walk' : 'idle',
      face: o.face || 0,
      k: 0,
      seg: 0,
      ph: Math.random() * 6.28
    };
    MW.actors.push(a);
    return a;
  }
  function resetActor(a) {
    a.seg = 0;
    a.k = 0;
    const p = a.path ? a.path[0] : a.home;
    a.g.position.set(p[0], 0, p[1]);
    a.u.px = p[0];
    a.u.pz = p[1];
    a.t = 0;
    a.u.rise = 0;
    if (a.sleep) {
      a.u.sleep = true;
      a.g.position.set(a.home[0], 0, a.home[1]);
      try {
        const P = a.u.parts;
        if (P) for (const k of ['body', 'head', 'armL', 'armR', 'legL', 'legR']) if (P[k]) P[k].rotation.set(0, 0, 0);
        a.g.rotation.set(0, 0, 0);
        sleepPose(a.g);
      } catch (e) {}
      a.g.rotation.y = a.face;
    } else if (!a.path) a.g.rotation.y = a.face;
  }
  function stepActor(a, dt) {
    const g = a.g,
      p = g.position;
    if (a.sleep) {
      a.t += dt;
      if (a.u.sleep) {
        if (!a.wakeAt || a.t < a.wakeAt) return;
        a.u.sleep = false;
        a.u.rise = a.u.riseMax = 2.6;
      }
      if (a.u.rise > 0) {
        try {
          riseStep(g, dt);
        } catch (e) {
          a.u.rise = 0;
        }
        return;
      }
    }
    if (a.path && a.seg < a.path.length - 1) {
      const q = a.path[a.seg + 1],
        dx = q[0] - p.x,
        dz = q[1] - p.z,
        d = Math.hypot(dx, dz),
        s = a.sp * dt * (a.u.crawl ? 0.45 : 1);
      if (d <= s) {
        p.x = q[0];
        p.z = q[1];
        a.seg++;
      } else {
        const nx = p.x + (dx / d) * s,
          nz = p.z + (dz / d) * s;
        if (a.ghost || free(nx, nz)) {
          p.x = nx;
          p.z = nz;
        } else {
          const sx = p.x - (dz / d) * s,
            sz = p.z + (dx / d) * s;
          if (free(sx, sz)) {
            p.x = sx;
            p.z = sz;
          }
        }
      }
      g.rotation.y = Math.atan2(dx, dz);
    } else if (!a.path) {
      a.ph += dt;
      g.rotation.y = a.face + Math.sin(a.ph * 0.4) * 0.35;
    }
    p.y = 0;
    try {
      animZ(g, dt, false);
    } catch (e) {}
  }

  /* ---------------- shots ---------------- */
  const bAll = id => buildings.filter(b => (b.id || b.t) === id || b.cat === id);
  const roadAt = (x, z) => {
    const L = window.__fortZombieTown && __fortZombieTown.layout;
    return !!(L && L.roads.some(r => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1));
  };
  function roadSide(b) {
    const s = [
      [0, 1],
      [0, -1],
      [1, 0],
      [-1, 0]
    ];
    for (const d of [4, 7, 10, 13])
      for (const [sx, sz] of s) {
        const x = b.x + sx * (b.w / 2 + d),
          z = b.z + sz * (b.d / 2 + d);
        if (roadAt(x, z)) return [sx, sz];
      }
    return null;
  }
  function camFree(x, y, z) {
    return !blocked(x, z, 0.3, Math.max(0, y - 0.5), 0.9);
  }
  function nudge(pts, y) {
    return pts.map(([x, z]) => {
      if (camFree(x, y, z)) return [x, z];
      for (let r = 0.5; r < 4; r += 0.5)
        for (let a = 0; a < 8; a++) {
          const nx = x + Math.cos(a * 0.785) * r,
            nz = z + Math.sin(a * 0.785) * r;
          if (camFree(nx, y, nz)) return [nx, nz];
        }
      return [x, z];
    });
  }
  function makeShots() {
    MW.actors = [];
    const S = [];
    // 1. crane down over a church with the dead milling in the street
    {
      const b = bAll('church').find(roadSide);
      if (b) {
        const [sx, sz] = roadSide(b),
          ox = sz !== 0,
          fx = b.x + sx * (b.w / 2 + 6),
          fz = b.z + sz * (b.d / 2 + 6),
          ax = ox ? 1 : 0,
          az = ox ? 0 : 1;
        const A = [];
        for (let i = 0; i < 7; i++) {
          const o = (i - 3) * 3.2,
            x = fx + ax * o + sx * (Math.random() * 3 - 1),
            z = fz + az * o + sz * (Math.random() * 3 - 1);
          A.push(
            actor(x, z, {
              path: [
                [x, z],
                [x - ax * 7 + sx * 0.5, z - az * 7 + sz * 0.5]
              ],
              sp: 0.35 + Math.random() * 0.35,
              reach: i % 3 === 0
            })
          );
        }
        const [c0, c1] = nudge(
          [
            [fx + ax * 22 + sx * 9, fz + az * 22 + sz * 9],
            [fx - ax * 8 + sx * 12, fz - az * 8 + sz * 12]
          ],
          8
        );
        S.push({
          n: 'church',
          f: 0.45,
          A,
          cam: t => ({x: lerp(c0[0], c1[0], ease(t)), y: lerp(15, 4.2, ease(t)), z: lerp(c0[1], c1[1], ease(t))}),
          look: t => ({x: b.x - sx * 2, y: lerp(2, 4.5, t), z: b.z - sz * 2})
        });
      }
    }
    // 2. cemetery corner push-in
    {
      const b = bAll('cemetery').find(roadSide);
      if (b) {
        const [sx, sz] = roadSide(b),
          ox = sz !== 0,
          ex = b.x + (sx * b.w) / 2,
          ez = b.z + (sz * b.d) / 2,
          cx = ex - (ox ? b.w / 2 - 2 : 0) * 1,
          cz = ez - (ox ? 0 : b.d / 2 - 2);
        const tx = ox ? -1 : 0,
          tz = ox ? 0 : -1; // along the edge
        const k0 = [cx + sx * 6 + tx * -1, cz + sz * 6 + tz * -1],
          k1 = [cx + sx * 3 + tx * -5, cz + sz * 3 + tz * -5],
          [c0, c1] = nudge([k0, k1], 3.5);
        const A = [
          actor(b.x + (ox ? -8 : -sx * 6), b.z + (ox ? -sz * 6 : 6), {face: Math.atan2(sx, sz)}),
          actor(b.x + (ox ? 3 : -sx * 2), b.z + (ox ? -sz * 2 : -3), {face: Math.atan2(sx, sz) + 0.6, reach: 1}),
          actor(b.x + (ox ? -2 : sx * 7), b.z + (ox ? sz * 7 : 2), {face: Math.atan2(sx, sz) - 0.4})
        ];
        {
          const x = b.x + (ox ? 7 : -sx * 9),
            z = b.z + (ox ? -sz * 9 : 7);
          A.push(
            actor(x, z, {
              path: [
                [x, z],
                [ex - sx * 2 + (ox ? -6 : 0), ez - sz * 2 + (ox ? 0 : -6)]
              ],
              sp: 0.45,
              reach: 1
            })
          );
        }
        // pull the set piece toward the camera corner so the dead read clearly between the headstones
        A.forEach(a => {
          if (!a) return;
          const p = a.g.position,
            nx = lerp(p.x, c1[0], 0.42),
            nz = lerp(p.z, c1[1], 0.42);
          if (free(nx, nz)) {
            p.x = nx;
            p.z = nz;
            a.home = [nx, nz];
            if (a.path) a.path[0] = [nx, nz];
          }
        });
        S.push({
          n: 'cemetery',
          f: 0.35,
          A,
          cam: t => ({x: lerp(c0[0], c1[0], ease(t)), y: lerp(4.4, 3.3, ease(t)), z: lerp(c0[1], c1[1], ease(t))}),
          look: t => ({x: b.x + (ox ? -3 : 0), y: 0.2, z: b.z + (ox ? 0 : -3)})
        });
      }
    }
    // 3. worm's eye: lying in the road as the dead walk past and over you
    {
      const L = __fortZombieTown.layout,
        r = L.roads.filter(q => q.x1 - q.x0 > q.z1 - q.z0).sort((p, q) => q.x1 - q.x0 - (p.x1 - p.x0))[0];
      if (r) {
        const zc = (r.z0 + r.z1) / 2;
        let x0 = (r.x0 + r.x1) / 2 + 21;
        for (let i = 0; i < 30 && !camFree(x0, 0.4, zc); i++) x0 += 2;
        const A = [];
        [
          [-1.3, 0.0],
          [1.0, 2.6],
          [2.3, 5.2],
          [-0.6, 7.6]
        ].forEach(([dz, lag], i) => {
          const sx = x0 - 8.5 - lag,
            ex = x0 + 9;
          A.push(
            actor(sx, zc + dz, {
              path: [
                [sx, zc + dz],
                [ex, zc + dz * 1.1]
              ],
              sp: 0.95 + i * 0.05,
              reach: i !== 1,
              kind: i === 2 ? 'brute' : 'walker'
            })
          );
        });
        S.push({
          n: 'worm',
          A,
          cam: t => ({x: x0 + t * 0.4, y: 0.34, z: zc + 0.15}),
          look: t => ({x: x0 - 7 + t * 2.5, y: 1.6 + t * 2.6, z: zc + 0.2})
        });
      }
    }
    // 4. park corner, a legless one dragging itself through the playground
    {
      const b = bAll('playground_memorial_park').find(roadSide);
      if (b) {
        const [sx, sz] = roadSide(b),
          ox = sz !== 0,
          ex = b.x + (ox ? b.w / 2 - 1 : (sx * b.w) / 2),
          ez = b.z + (ox ? (sz * b.d) / 2 : b.d / 2 - 1);
        const [c0, c1] = nudge(
          [
            [ex + sx * 3.5 + (ox ? 1 : 0), ez + sz * 3.5 + (ox ? 0 : 1)],
            [ex + sx * 2.5 + (ox ? -5 : 0), ez + sz * 2.5 + (ox ? 0 : -5)]
          ],
          1.2
        );
        const A = [
          actor(b.x + (ox ? 6 : sx * 4), b.z + (ox ? sz * 4 : 6), {
            path: [
              [b.x + (ox ? 6 : sx * 4), b.z + (ox ? sz * 4 : 6)],
              [ex + (ox ? -3 : -sx * 2), ez + (ox ? -sz * 2 : -3)]
            ],
            sp: 0.5,
            crawl: 1
          }),
          actor(b.x - (ox ? 4 : 0), b.z - (ox ? 0 : 4), {face: Math.atan2(sx, sz)}),
          actor(b.x + (ox ? -9 : -sx * 6), b.z + (ox ? -sz * 6 : -9), {face: Math.atan2(sx, sz) + 0.8, reach: 1})
        ];
        S.push({
          n: 'park',
          f: 0.55,
          A,
          cam: t => ({x: lerp(c0[0], c1[0], t), y: 2.1, z: lerp(c0[1], c1[1], t)}),
          look: t => ({
            x: lerp(b.x + (ox ? 8 : 0), b.x - (ox ? 4 : 0), ease(t)),
            y: 0.9,
            z: lerp(b.z + (ox ? 0 : 8), b.z - (ox ? 0 : 4), ease(t))
          })
        });
      }
    }
    // 5. main street dolly, a loose crowd coming the other way
    {
      const L = __fortZombieTown.layout,
        r = L.roads
          .filter(q => q.x1 - q.x0 > q.z1 - q.z0)
          .sort((p, q) => Math.abs((p.z0 + p.z1) / 2) - Math.abs((q.z0 + q.z1) / 2))[0];
      if (r) {
        const zc = (r.z0 + r.z1) / 2,
          xs = (r.x0 + r.x1) / 2 - 58;
        const [c0, c1] = nudge(
          [
            [xs, r.z0 + 1.6],
            [xs + 26, r.z0 + 1.6]
          ],
          2
        );
        const A = [];
        for (let i = 0; i < 8; i++) {
          const x = xs + 20 + i * 3.6 + Math.random() * 3,
            z = r.z0 + 1 + Math.random() * (r.z1 - r.z0 - 2);
          A.push(
            actor(x, z, {
              path: [
                [x, z],
                [x - 24, z + (Math.random() - 0.5) * 2]
              ],
              sp: 0.55 + Math.random() * 0.5,
              reach: Math.random() < 0.5,
              kind: Math.random() < 0.25 ? 'runner' : 'walker'
            })
          );
        }
        S.push({
          n: 'street',
          A,
          cam: t => ({x: lerp(c0[0], c1[0], t), y: 1.9, z: lerp(c0[1], c1[1], t)}),
          look: t => ({x: lerp(c0[0], c1[0], t) + 18, y: 1.4, z: zc + 0.5})
        });
      }
    }
    // 6. gas station forecourt at night
    {
      const b = bAll('eco_pump').find(roadSide) || bAll('eco_pump')[0];
      if (b) {
        const rs = roadSide(b) || [0, 1],
          [sx, sz] = rs,
          ox = sz !== 0,
          fx = b.x + sx * (b.w / 2 + 5),
          fz = b.z + sz * (b.d / 2 + 5);
        const [c0, c1] = nudge(
          [
            [fx + (ox ? 14 : sx * 3), fz + (ox ? sz * 3 : 14)],
            [fx + (ox ? 6 : sx * 1), fz + (ox ? sz * 1 : 6)]
          ],
          1.6
        );
        const A = [
          actor(b.x + (ox ? 2 : sx * (b.w / 2 + 1.2)), b.z + (ox ? sz * (b.d / 2 + 1.2) : 2), {
            face: Math.atan2(-sx, -sz)
          }),
          (() => {
            const x = fx + (ox ? -12 : 0),
              z = fz + (ox ? 0 : -12);
            return actor(x, z, {
              path: [
                [x, z],
                [fx + (ox ? 8 : sx * 0.5), fz + (ox ? sz * 0.5 : 8)]
              ],
              sp: 0.6,
              reach: 1
            });
          })(),
          (() => {
            const x = fx + (ox ? -4 : sx * 3),
              z = fz + (ox ? sz * 3 : -4);
            return actor(x, z, {
              path: [
                [x, z],
                [fx + (ox ? 10 : sx * 4), fz + (ox ? sz * 4 : 10)]
              ],
              sp: 0.45
            });
          })(),
          actor(b.x - (ox ? 6 : 0) + sx * (b.w / 2 + 2.5), b.z - (ox ? 0 : 6) + sz * (b.d / 2 + 2.5), {
            face: Math.atan2(sx, sz),
            reach: 1
          })
        ];
        S.push({
          n: 'gas',
          f: 0.3,
          A,
          cam: t => ({x: lerp(c0[0], c1[0], ease(t)), y: 1.65, z: lerp(c0[1], c1[1], ease(t))}),
          look: t => ({x: b.x, y: 1.6, z: b.z})
        });
      }
    }
    /* ============ v092: new scenes ============ */
    // A. the congregation: the dead drift together in front of the church, slowly, from every side of the street
    {
      const b = bAll('church').find(roadSide);
      if (b) {
        const [sx, sz] = roadSide(b),
          ox = sz !== 0,
          ax = ox ? 1 : 0,
          az = ox ? 0 : 1,
          gx = b.x + sx * (b.w / 2 + 5.5),
          gz = b.z + sz * (b.d / 2 + 5.5);
        const A = [];
        for (let i = 0; i < 13; i++) {
          const o = (i - 6) * 2.6 + (Math.random() - 0.5) * 2,
            r = 0.5 + Math.random() * 8,
            x = gx + ax * o + sx * r,
            z = gz + az * o + sz * r,
            ta = Math.random() * 6.28,
            tr = 0.8 + Math.random() * 2.2;
          A.push(
            actor(x, z, {
              path: [
                [x, z],
                [gx + Math.cos(ta) * tr, gz + Math.sin(ta) * tr]
              ],
              sp: 0.2 + Math.random() * 0.2,
              reach: i % 4 === 0,
              kind: i === 5 ? 'brute' : 'walker'
            })
          );
        }
        const [c0, c1] = nudge(
          [
            [gx - ax * 10 + sx * 11, gz - az * 10 + sz * 11],
            [gx + ax * 2 + sx * 8.5, gz + az * 2 + sz * 8.5]
          ],
          1.5
        );
        S.push({
          n: 'congregation',
          f: 0.5,
          A,
          cam: t => ({x: lerp(c0[0], c1[0], ease(t)), y: lerp(1.25, 1.9, ease(t)), z: lerp(c0[1], c1[1], ease(t))}),
          look: t => ({x: b.x, y: lerp(4.5, 6.5, t), z: b.z}),
          fov: t => lerp(62, 54, ease(t))
        });
      }
    }
    // B. the graves: a slow pan at grass height down an aisle of headstones, sleepers on the plots; one climbs out of its grave
    {
      const b = bAll('cemetery')[0],
        L = window.__fortZombieTown && __fortZombieTown.layout,
        // the buildings entry is the mausoleum: the scene needs the plot (its centre, and which way the lot faces)
        p = b && L && L.plots.find(q => Math.abs(b.x - q.cx) < GRID.PW / 2 && Math.abs(b.z - q.cz) < GRID.PD / 2);
      if (p) {
        const cs = p.front === 'south' ? 1 : -1,
          wx = lx => p.cx + cs * lx,
          wz = lz => p.cz + cs * lz,
          along = cs > 0 ? 0 : Math.PI; // facing the lot's front (+Z in lot coordinates)
        /* lot coordinates (js/layers/cemetery.js): front-left section, rows at z 3.4 / 6.0 / 8.6 / 11.2, graves every 1.8 m from
           x = -3; the aisle between the 6.0 and 8.6 rows is the camera's track; (-10.2, 6.0) is a burst-open grave */
        const A = [
          actor(wx(-8.4), wz(8.6), {sleep: 'lie', exact: 1, face: along + 0.1}),
          actor(wx(-13.8), wz(6.0), {sleep: 'lie', exact: 1, face: along + Math.PI - 0.15}),
          actor(wx(-6.6), wz(6.0), {sleep: 'lie', exact: 1, face: along - 0.2}),
          actor(wx(-4.8), wz(8.6), {sleep: 'lie', exact: 1, face: along + Math.PI}),
          actor(wx(-12.0), wz(8.2), {sleep: 'sit', exact: 1, face: along + Math.PI + 0.2}),
          actor(wx(-15.6), wz(8.3), {sleep: 'sit', exact: 1, face: along + Math.PI - 0.3}),
          actor(wx(-3.2), wz(6.5), {sleep: 'sit', exact: 1, face: along + 0.4}),
          actor(wx(-10.2), wz(6.0), {
            sleep: 'lie',
            exact: 1,
            face: along,
            wakeAt: 3.6,
            ghost: 1,
            sp: 0.3,
            path: [
              [wx(-10.2), wz(6.0)],
              [wx(-9.6), wz(7.3)],
              [wx(-5), wz(7.4)]
            ]
          }),
          actor(wx(0), wz(13), {
            exact: 1,
            ghost: 1,
            path: [
              [wx(0), wz(13)],
              [wx(0), wz(4)]
            ],
            sp: 0.25
          })
        ];
        /* the camera's lane: the aisle (and the stretch of it) with the longest clear run at lens height, so the pan never
           passes through a headstone, a cross or a tomb */
        let lane = {z: 7.3, x0: -16, x1: -6, len: 0};
        for (const lz of [7.3, 7.0, 7.6, 4.7, 4.4, 5.0, 9.9, 9.6, 10.2]) {
          let run = 0;
          for (let lx = -18; lx <= -2.5; lx += 0.5) {
            if (!blocked(wx(lx), wz(lz), 0.45, 0.3, 1.2)) {
              run += 0.5;
              if (run > lane.len) lane = {z: lz, x0: lx - run, x1: lx, len: run};
            } else run = 0;
          }
        }
        const px0 = lane.x0 + 0.4,
          px1 = Math.min(lane.x1 - 0.4, px0 + 11);
        S.push({
          n: 'graves',
          A,
          cam: t => ({x: wx(lerp(px0, px1, t)), y: lerp(0.8, 0.95, t), z: wz(lane.z)}),
          look: t => ({x: wx(lerp(px0, px1, t) + 7), y: lerp(0.5, 0.7, t), z: wz(lane.z + lerp(0.5, -0.4, t))}),
          fov: () => 52
        });
      }
    }
    // C. PIZZABYTES: a long zoom across the street onto the sign, customers still waiting at the door
    {
      const b = bAll('bakery').find(roadSide) || bAll('pizzabytes').find(roadSide);
      if (b) {
        const [sx, sz] = roadSide(b),
          ox = sz !== 0,
          ax = ox ? 1 : 0,
          az = ox ? 0 : 1,
          fx = b.x + (sx * b.w) / 2,
          fz = b.z + (sz * b.d) / 2;
        const A = [
          actor(fx + sx * 1.2 - ax * 0.8, fz + sz * 1.2 - az * 0.8, {face: Math.atan2(-sx, -sz), reach: 1}),
          actor(fx + sx * 1.5 + ax * 0.9, fz + sz * 1.5 + az * 0.9, {face: Math.atan2(-sx, -sz) + 0.3, reach: 1}),
          actor(fx + sx * 2.6 + ax * 3.4, fz + sz * 2.6 + az * 3.4, {face: Math.atan2(-sx, -sz) - 0.5}),
          (() => {
            const x = fx + sx * 6 - ax * 13,
              z = fz + sz * 6 - az * 13;
            return actor(x, z, {
              path: [
                [x, z],
                [fx + sx * 3 - ax * 2, fz + sz * 3 - az * 2]
              ],
              sp: 0.4
            });
          })()
        ];
        const [c0, c1] = nudge(
          [
            [fx + sx * 24 + ax * 5, fz + sz * 24 + az * 5],
            [fx + sx * 11 + ax * 1, fz + sz * 11 + az * 1]
          ],
          3
        );
        S.push({
          n: 'pizzabytes',
          A,
          cam: t => ({x: lerp(c0[0], c1[0], ease(t)), y: lerp(3.4, 2.6, ease(t)), z: lerp(c0[1], c1[1], ease(t))}),
          look: t => ({x: fx, y: lerp(3.2, 4.3, ease(t)), z: fz}),
          fov: t => lerp(60, 30, ease(t))
        });
      }
    }
    // D. the bird: a slow turn high over the crossroads, the dead as small figures on the streets below
    {
      const L = __fortZombieTown.layout,
        h = L.roads
          .filter(q => q.x1 - q.x0 > q.z1 - q.z0)
          .sort((p, q) => Math.abs((p.z0 + p.z1) / 2) - Math.abs((q.z0 + q.z1) / 2))[0],
        v = L.roads
          .filter(q => q.z1 - q.z0 > q.x1 - q.x0)
          .sort((p, q) => Math.abs((p.x0 + p.x1) / 2) - Math.abs((q.x0 + q.x1) / 2))[0];
      if (h && v) {
        const cx = (v.x0 + v.x1) / 2,
          cz = (h.z0 + h.z1) / 2,
          A = [];
        for (let i = 0; i < 12; i++) {
          const onH = i % 2 === 0,
            d = (Math.random() < 0.5 ? -1 : 1) * (6 + Math.random() * 22),
            o = (Math.random() - 0.5) * 4,
            x = onH ? cx + d : cx + o,
            z = onH ? cz + o : cz + d;
          A.push(
            actor(x, z, {
              path: [
                [x, z],
                [onH ? cx + d * 0.25 : cx + o * 0.5, onH ? cz + o * 0.5 : cz + d * 0.25]
              ],
              sp: 0.35 + Math.random() * 0.4
            })
          );
        }
        S.push({
          n: 'bird',
          A,
          cam: t => {
            const a = 0.5 + t * 0.75;
            return {x: cx + Math.cos(a) * 19, y: lerp(21, 17, t), z: cz + Math.sin(a) * 19};
          },
          look: () => ({x: cx, y: 0, z: cz}),
          fov: () => 54
        });
      }
    }
    // E. the follower: close behind one of them as it walks down the middle of the road towards the others
    {
      const L = __fortZombieTown.layout,
        r = L.roads.filter(q => q.z1 - q.z0 > q.x1 - q.x0).sort((p, q) => q.z1 - q.z0 - (p.z1 - p.z0))[0];
      if (r) {
        const xc = (r.x0 + r.x1) / 2,
          z0 = (r.z0 + r.z1) / 2 - 14,
          lead = actor(xc, z0, {
            exact: 1,
            path: [
              [xc, z0],
              [xc + 0.4, z0 + 9],
              [xc - 0.3, z0 + 18]
            ],
            sp: 0.8
          }),
          A = [lead];
        for (let i = 0; i < 5; i++)
          A.push(
            actor(xc + (i - 2) * 1.5 + (Math.random() - 0.5), z0 + 27 + Math.random() * 4, {
              face: Math.PI + (Math.random() - 0.5) * 0.6,
              reach: i % 2
            })
          );
        if (lead)
          S.push({
            n: 'follower',
            A,
            cam: () => ({x: lead.g.position.x + 0.55, y: 1.72, z: lead.g.position.z - 2.3}),
            look: () => ({x: lead.g.position.x - 0.2, y: 1.35, z: lead.g.position.z + 8}),
            fov: () => 52
          });
      }
    }
    // F. the pool: from the water's edge of the motel pool, one of them wading through it
    {
      const w =
        window.MFZWATER &&
        MFZWATER.list.find(q => q.o && q.o.shape === 'poly' && (q.o.kind === 'pool' || q.o.kind === 'green') && q.mesh);
      if (w) {
        w.mesh.updateWorldMatrix(true, false);
        const c = w.mesh.getWorldPosition(new THREE.Vector3()),
          a0 = Math.random() * 6.28,
          pts = [0, 1].map(i => [c.x + Math.cos(a0 + i * 0.8) * 4.3, c.z + Math.sin(a0 + i * 0.8) * 4.3]), // on the deck, inside the hedges
          [c0, c1] = pts;
        const A = [
          actor(c.x - 2.5, c.z + 0.2, {
            exact: 1,
            ghost: 1,
            path: [
              [c.x - 2.5, c.z + 0.2],
              [c.x + 2.5, c.z - 0.4]
            ],
            sp: 0.3
          }),
          actor(c.x + Math.cos(a0 + 3.4) * 5.2, c.z + Math.sin(a0 + 3.4) * 5.2, {exact: 1, face: a0, reach: 1}),
          actor(c.x + Math.cos(a0 + 2.5) * 6, c.z + Math.sin(a0 + 2.5) * 6, {exact: 1, face: a0 + 1})
        ];
        S.push({
          n: 'pool',
          f: 0.5,
          A,
          cam: t => ({x: lerp(c0[0], c1[0], ease(t)), y: c.y + lerp(0.5, 0.75, t), z: lerp(c0[1], c1[1], ease(t))}),
          look: () => ({x: c.x, y: c.y + 0.45, z: c.z}),
          fov: () => 66
        });
      }
    }
    S.forEach(s => (s.A = s.A.filter(Boolean)));
    /* running order: the congregation opens, then the graves and PIZZABYTES; old and new scenes alternate after that */
    {
      const want = [
          'congregation',
          'graves',
          'pizzabytes',
          'worm',
          'bird',
          'park',
          'follower',
          'gas',
          'pool',
          'street',
          'church',
          'cemetery'
        ],
        by = n => S.find(q => q.n === n),
        out = want.map(by).filter(Boolean);
      S.forEach(q => {
        if (!out.includes(q)) out.push(q);
      });
      S.length = 0;
      out.forEach(q => S.push(q));
    }
    // a few loners far in the background of every shot so the town never looks empty
    MW.shots = S;
    MW.order = S.map((q, i) => i);
    console.log(
      '[menuworld] ' +
        S.length +
        ' shots: ' +
        S.map(s => s.n).join(', ') +
        ', ' +
        MW.actors.length +
        ' set-piece zombies'
    );
  }
  function next() {
    if (!MW.shots.length) return;
    MW.cur = (MW.cur + 1) % MW.shots.length;
    MW.t = 0;
    const s = MW.shots[MW.cur];
    s.A.forEach(resetActor);
  }
  function place(s, t) {
    const k = Math.min(1, t / SHOT),
      c = s.cam(k),
      l = Object.assign({}, s.look(k)),
      tm = performance.now() / 1000;
    if (s.f && s.A.length) {
      let ax = 0,
        az = 0;
      s.A.forEach(a => {
        ax += a.g.position.x;
        az += a.g.position.z;
      });
      ax /= s.A.length;
      az /= s.A.length;
      l.x = lerp(l.x, ax, s.f);
      l.z = lerp(l.z, az, s.f);
      l.y = lerp(l.y, 1.1, s.f * 0.6);
    }
    const hx = Math.sin(tm * 0.9) * 0.05 + Math.sin(tm * 2.3) * 0.015,
      hy = Math.sin(tm * 1.3) * 0.035;
    const fv = s.fov ? s.fov(k) : 58;
    if (Math.abs(camera.fov - fv) > 0.01) {
      camera.fov = fv;
      camera.updateProjectionMatrix();
    }
    pl.position.set(c.x + hx, c.y + hy, c.z);
    const dx = l.x - c.x,
      dy = l.y - c.y,
      dz = l.z - c.z,
      h = Math.hypot(dx, dz);
    yaw = Math.atan2(-dx, -dz);
    pitch = Math.atan2(dy, h);
    pl.rotation.y = yaw;
    camera.rotation.x = pitch;
    camera.rotation.z = Math.sin(tm * 0.5) * 0.012;
  }

  /* ---------------- frame loop ---------------- */
  let last = performance.now();
  function loop() {
    requestAnimationFrame(loop);
    const now = performance.now(),
      dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (MW.on && (!titleState() || !MW.marker || MW.marker.parent !== scene)) {
      stop();
      return;
    }
    if (!MW.on) {
      if (window.MFZLOAD && !MFZLOAD.passed) return;
      if (MW.built && !MW.building && titleState()) {
        start();
        return;
      }
      if (
        MW.enabled &&
        titleState() &&
        !MW.building &&
        !(window.DEV && DEV.on) &&
        document.body.dataset.scr &&
        document.body.dataset.scr !== 'dev' &&
        (MW.queued === undefined || now > MW.queued)
      ) {
        MW.queued = now + 1e9;
        setTimeout(() => {
          MW.queued = undefined;
          if (titleState() && !MW.on) build();
        }, 450);
      }
      return;
    }
    if (!(G.day >= 1)) G.time = 23.6;
    try {
      lighting();
    } catch (e) {}
    if (MW.freeze) return;
    const s = MW.shots[MW.cur];
    if (!s) return;
    MW.t += dt;
    place(s, MW.t);
    for (const a of s.A) stepActor(a, dt);
    const fIn = Math.min(1, MW.t / FADE),
      fOut = Math.min(1, (SHOT - MW.t) / FADE);
    fade.style.opacity = String(1 - Math.min(fIn, fOut));
    if (MW.t >= SHOT) next();
  }
  requestAnimationFrame(loop);
  /* debug / screenshots: jump to shot i at time t (seconds) */
  MW.jump = function (i, t) {
    if (!MW.on) return false;
    MW.cur = i - 1;
    next();
    const s = MW.shots[MW.cur];
    place(s, 0);
    for (let x = 0; x < t; x += 1 / 30) s.A.forEach(a => stepActor(a, 1 / 30));
    MW.t = t;
    place(s, t);
    s.A.forEach(a => stepActor(a, 0.0001));
    fade.style.opacity = '0';
    return s.n;
  };

  /* ---------------- option: Graphics > Display > Menu background ---------------- */
  function optRow() {
    const pg = document.querySelector('#optG .gPage[data-g="disp"]');
    if (!pg || $('mwOpt')) return;
    const r = document.createElement('div');
    r.className = 'optRow';
    r.id = 'mwOpt';
    r.innerHTML =
      '<span>Menu background</span><div class="seg"><button data-v="1">Live 3D town</button><button data-v="0">Illustrated</button></div><div class="note">Live 3D builds a small night-time town behind the menus. Illustrated is lighter on slow machines.</div>';
    const sync = () =>
      r.querySelectorAll('button').forEach(b => b.classList.toggle('on', (b.dataset.v === '1') === MW.enabled));
    r.querySelectorAll('button').forEach(
      b =>
        (b.onclick = () => {
          MW.enabled = b.dataset.v === '1';
          try {
            localStorage.setItem('mfz_menuworld', MW.enabled ? '1' : '0');
          } catch (e) {}
          sync();
          if (!MW.enabled && MW.on) {
            stop();
            try {
              clearWorld();
            } catch (e) {}
          }
        })
    );
    sync();
    pg.appendChild(r);
  }
  const _ot = window.optTab;
  window.optTab = function (t) {
    const r = _ot.apply(this, arguments);
    if (t === 'G' || (!t && document.querySelector('#optMain .mbtn.on[data-t="G"]'))) setTimeout(optRow, 0);
    return r;
  };
  console.log('[menuworld] main menu world ready');
})();
