/* =====================================================================================================
   REVISION 034 - DEVELOPER TOOLKIT
   Separate script block. It reuses the game's real systems (ITEMS/CATS/LOOT_TABLES, CATALOGUE/bld/checkPlacement, town(),
   zombie()/ZT, spawnContainer, initCampaign/go/startSiege/openHQ ...) and only hooks the few functions listed in WRAP below.
   Nothing here runs unless Dev Mode is enabled from Main Menu -> Options -> Developer Toolkit. (v070: UI rebuilt into rail + pages; sandbox now starts from a real New Game state.)
   Isolation: enabling Dev Mode snapshots G / HQINV / PINV; leaving Dev Mode restores them. Dev settings are never written to
   'gf_set' (normal settings) - only saved test scenarios use their own localStorage key 'gf_dev_scenarios'.
   ===================================================================================================== */
(function () {
  const REV = VERSION;
  const DF = {
    hpAll: false,
    hpSel: false,
    hitP: false,
    hitZ: false,
    coll: false,
    walk: false,
    bBounds: false,
    spawns: false,
    doorR: false,
    lootR: false,
    labels: false,
    diag: false,
    noclip: false,
    pInv: false,
    infSt: false,
    zFreeze: false,
    zInv: false,
    zBeh: 'normal',
    unlimited: false,
    pause: false,
    timeRun: false,
    fly: 12,
    hpM: 1,
    dmgM: 1,
    spM: 1
  };
  const D = (window.DEV = {
    on: false,
    snap: null,
    open: false,
    opening: false,
    s: Object.assign({}, DF),
    w: {kind: null, seed: 0, fort: 'police', mode: null, spawn: null, gen: null, bld: null, info: null},
    sel: null,
    zid: 0,
    base: null,
    force: false,
    genHist: [],
    overflow: [],
    tab: 'world',
    lastDebug: ''
  });
  const TAU2 = Math.PI * 2;
  /* ---------- small utilities ---------- */
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'})[c]);
  const LOGS = [];
  function log(l, t) {
    LOGS.push(new Date().toISOString().slice(11, 23) + ' [' + l + '] ' + String(t).slice(0, 400));
    if (LOGS.length > 300) LOGS.shift();
    const b = $('dvLogB');
    if (b) {
      const n = LOGS.filter(x => /\[(ERROR|FAIL|EXCEPTION)\]/.test(x)).length;
      b.textContent = 'Log (' + LOGS.length + (n ? ', ' + n + ' errors' : '') + ')';
    }
    const w = $('dvLogW'),
      e = $('dvLog');
    if (e && w && !w.classList.contains('hide')) {
      e.textContent = LOGS.join('\n');
      e.scrollTop = e.scrollHeight;
    }
  }
  addEventListener('error', e =>
    log(
      'EXCEPTION',
      (e.message || '') +
        ' @' +
        String(e.filename || '')
          .split('/')
          .pop() +
        ':' +
        e.lineno +
        ':' +
        e.colno
    )
  );
  addEventListener('unhandledrejection', e =>
    log('EXCEPTION', 'promise: ' + ((e.reason && e.reason.message) || e.reason))
  );
  ['error', 'warn'].forEach(k => {
    const o = console[k];
    console[k] = function () {
      try {
        log(
          k === 'error' ? 'ERROR' : 'WARN',
          [].map
            .call(arguments, x =>
              x && x.stack
                ? x.stack.split('\n').slice(0, 3).join(' | ')
                : typeof x === 'object'
                  ? JSON.stringify(x)
                  : String(x)
            )
            .join(' ')
        );
      } catch (e) {}
      return o.apply(console, arguments);
    };
  });
  log('info', 'Dev toolkit module loaded (Revision ' + REV + ')');
  function msg(t, ok) {
    ok = ok !== false;
    log(ok ? 'info' : 'FAIL', t);
    const e = $('dvMsg');
    if (e) {
      e.textContent = (ok ? 'OK: ' : 'FAILED: ') + t;
      e.style.color = ok ? '#22c55e' : '#ef4444';
    }
    try {
      toast((ok ? '[DEV] ' : '[DEV FAILED] ') + t);
    } catch (e2) {}
    if (!ok) console.warn('[DEV]', t);
  }
  function mulberry32(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash32(s) {
    let h = 2166136261;
    s = String(s);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function parseSeed(v) {
    v = String(v == null ? '' : v).trim();
    if (!v) return (Math.random() * 4294967296) >>> 0;
    if (/^\d{1,10}$/.test(v) && Number(v) < 4294967296) return Number(v) >>> 0;
    return hash32(v);
  }
  function withSeed(seed, fn) {
    const o = Math.random;
    Math.random = mulberry32(seed >>> 0);
    try {
      return fn();
    } finally {
      Math.random = o;
    }
  }
  const countScene = () => {
    let n = 0;
    scene.traverse(() => n++);
    return n;
  };
  const lootConts = () =>
    scene.children
      .filter(o => o.userData && o.userData.kind === 'loot' && o.userData.cont && !o.userData.cont.drop)
      .map(o => o.userData.cont);
  const dist2 = (x, z) => Math.hypot(x - pl.position.x, z - pl.position.z);
  function inScene(o) {
    while (o) {
      if (o === scene) return true;
      o = o.parent;
    }
    return false;
  }
  function groundPlane(c) {
    const g = mesh(new THREE.PlaneGeometry(500, 500), c, 0, 0, 0);
    g.rotation.x = -Math.PI / 2;
    return g;
  }
  function clampN(v, a, b, d) {
    v = Number(v);
    if (!isFinite(v)) return d;
    return Math.max(a, Math.min(b, v));
  }

  /* ---------- state isolation ----------
   v070: entering Dev Mode before a campaign exists used to run every test world on the game's raw on-load state (Day 0, no starting
   kit, 100 HP on every fort, no skills / town map, "Siege in 14 days"), which is not what the real game ever builds. Now Dev Mode
   creates the same fresh Day-1 campaign New Game creates (initCampaign) inside the sandbox. Restoring also removes any G keys the
   sandbox added and keeps the equipped weapon pointing at the restored inventory. */
  function deep(v) {
    try {
      return structuredClone(v);
    } catch (e) {
      return v;
    }
  }
  function snapshot() {
    const g = {};
    for (const k of Object.keys(G)) {
      const d = Object.getOwnPropertyDescriptor(G, k);
      if (d && !d.get) g[k] = G[k];
    }
    let s = null;
    try {
      s = structuredClone({g, hq: Object.assign({}, HQINV), p: Object.assign({}, PINV)});
    } catch (e) {
      s = {g: {}, hq: {}, p: {}};
      for (const k in g) s.g[k] = deep(g[k]);
      for (const k in HQINV) s.hq[k] = deep(HQINV[k]);
      for (const k in PINV) s.p[k] = deep(PINV[k]);
    }
    s.keys = Object.keys(g);
    s.eqI = PINV.items.indexOf(G.eq);
    s.fn = $('fn') ? $('fn').textContent : '';
    D.snap = s;
  }
  function restoreSnapshot() {
    if (!D.snap) return;
    const s = D.snap,
      keep = new Set(s.keys);
    for (const k of Object.keys(G)) {
      const d = Object.getOwnPropertyDescriptor(G, k);
      if (d && !d.get && d.configurable && !keep.has(k)) delete G[k];
    }
    Object.assign(G, s.g);
    Object.assign(HQINV, s.hq);
    Object.assign(PINV, s.p);
    if (G.eq && !PINV.items.includes(G.eq)) G.eq = s.eqI >= 0 ? PINV.items[s.eqI] || null : null;
    if ($('fn')) $('fn').textContent = s.fn;
    D.snap = null;
  }
  function freshCampaign(fort) {
    initCampaign(fort);
    D.fresh = true;
    D.w.fort = G.fort;
    D.base = {hp: G.hp, maxHp: G.maxHp, st: G.st};
  }
  function enable() {
    if (D.on) return;
    snapshot();
    D.on = true;
    D.fresh = false;
    if (!(G.day >= 1)) {
      try {
        freshCampaign(D.w.fort || G.fort || 'police');
      } catch (e) {
        log('ERROR', 'fresh campaign failed: ' + e.message);
      }
    }
    D.w.fort = G.fort;
    D.base = {hp: G.hp, maxHp: G.maxHp, st: G.st};
    msg(
      D.fresh
        ? 'Dev Mode on: fresh Day-1 ' +
            FORTS[G.fort].n +
            ' campaign, identical to New Game. Your real state comes back when you leave.'
        : 'Dev Mode on: working on a copy of your campaign (Day ' + G.day + '). The original comes back when you leave.'
    );
  }
  function disable() {
    if (!D.on) return;
    D.s = Object.assign({}, DF);
    D.sel = null;
    D.overflow = [];
    D.open = false;
    D.opening = false;
    G.mode = 'TITLE';
    try {
      clearWorld();
    } catch (e) {
      console.error(e);
    }
    restoreSnapshot();
    G.mode = 'TITLE';
    D.on = false;
    D.fresh = false;
    D.w = {kind: null, seed: 0, fort: G.fort || 'police', mode: null, spawn: null, gen: null, bld: null, info: null};
    if (invOpen) {
      invOpen = false;
      const s = $('invScr');
      if (s) s.style.display = 'none';
    }
    try {
      document.exitPointerLock();
    } catch (e) {}
    $('hud').classList.add('hide');
    ui('menu');
    syncBadge();
  }

  /* ---------- world cleanup hook (called from clearWorld) ---------- */
  window.devOnClear = function (removed) {
    O.reset();
    D.sel = null;
    D.overflow = [];
    if (!D.on) return;
    const seen = new Set();
    removed.forEach(r =>
      r.traverse(o => {
        if (o.geometry && !seen.has(o.geometry)) {
          seen.add(o.geometry);
          o.geometry.dispose();
        }
        const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
        ms.forEach(m => {
          if (!seen.has(m)) {
            seen.add(m);
            m.dispose();
          }
        });
      })
    );
    TTC.forEach(t => t.dispose());
    TTC.clear();
  };

  /* ---------- text sprites ---------- */
  const TTC = new Map();
  function textTex(t, c) {
    const k = t + '|' + c;
    let r = TTC.get(k);
    if (r) return r;
    const cv = document.createElement('canvas');
    cv.width = 256;
    cv.height = 64;
    const x = cv.getContext('2d');
    x.fillStyle = 'rgba(0,0,0,.65)';
    x.fillRect(0, 0, 256, 64);
    x.fillStyle = c || '#facc15';
    x.font = 'bold 24px monospace';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(String(t).slice(0, 20), 128, 32);
    r = new THREE.CanvasTexture(cv);
    TTC.set(k, r);
    return r;
  }
  function label(t, c, x, y, z, sc, parent) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({map: textTex(t, c), transparent: true, depthTest: false}));
    s.position.set(x, y, z);
    s.scale.set(sc * 4, sc, 1);
    s.raycast = () => {};
    s.renderOrder = 9;
    (parent || scene).add(s);
    return s;
  }

  /* ---------- teleport / safety ---------- */
  function settle() {
    const p = pl.position;
    G.vy = 0;
    G.crouch = false;
    G.eyeH = G.eyeUsed = 1.6;
    let x = p.x,
      z = p.z,
      feet = Math.max(0, p.y - 1.6);
    let gy = groundAt(x, z, feet + 0.35);
    if (blocked(x, z, 0.4, gy + 0.02, 1.8)) {
      const f = freeSpot(x, z);
      x = f[0];
      z = f[1];
      gy = groundAt(x, z, feet + 0.35);
    }
    p.set(x, 1.6 + gy, z);
    G.feetY = gy;
  }
  function tp(x, z, fy, why) {
    x = Number(x);
    z = Number(z);
    if (!isFinite(x) || !isFinite(z)) {
      msg('Teleport target is invalid (' + (why || '?') + ')', false);
      return false;
    }
    x = Math.max(BND[0] + 0.8, Math.min(BND[1] - 0.8, x));
    z = Math.max(BND[2] + 0.8, Math.min(BND[3] - 0.8, z));
    const f = freeSpot(x, z),
      ok = !blocked(f[0], f[1], 0.55, 0, 1.8),
      gy = groundAt(f[0], f[1], (fy || 0) + 0.35);
    pl.position.set(f[0], 1.6 + gy, f[1]);
    G.vy = 0;
    G.crouch = false;
    G.eyeH = G.eyeUsed = 1.6;
    G.feetY = gy;
    msg(
      'Teleported to ' +
        (why || 'target') +
        ' (' +
        f[0].toFixed(1) +
        ', ' +
        f[1].toFixed(1) +
        ')' +
        (ok ? '' : ' - destination was blocked, nearest free spot not found'),
      ok
    );
    return ok;
  }
  function worldOK() {
    if (!playing()) {
      msg('Load a test world first (World & Maps / Building Inspector / Items).', false);
      return false;
    }
    return true;
  }

  /* ---------- world builders ---------- */
  function begin() {
    G.hqPause = false;
    if (!D.on) enable();
    if (invOpen) {
      invOpen = false;
      const s = $('invScr');
      if (s) s.style.display = 'none';
    }
    D.open = false;
    G.siegeDue = false;
    G.mode = 'DEV';
    D.w.dummy = false;
  }
  function arrive(sp) {
    const f = freeSpot(sp[0], sp[1]);
    D.w.spawn = f;
    pl.position.set(f[0], 1.6 + groundAt(f[0], f[1], 0.35), f[1]);
    G.vy = 0;
    G.crouch = false;
    G.eyeH = G.eyeUsed = 1.6;
    yaw = pitch = 0;
    pl.rotation.y = 0;
    camera.rotation.x = 0;
    if (D.base) {
      G.hp = D.base.hp;
      G.maxHp = D.base.maxHp;
      G.st = D.base.st;
    }
    $('hud').classList.remove('hide');
    $('tip').classList.add('hide');
    ui('pz');
    lock();
    syncBadge();
    refreshAll();
  }
  function captureWarn(fn) {
    const w = [],
      ce = console.error;
    console.error = (...a) => {
      w.push(
        a
          .map(x => (x && x.message ? x.message : typeof x === 'object' ? JSON.stringify(x).slice(0, 160) : String(x)))
          .join(' ')
          .slice(0, 220)
      );
      ce.apply(console, a);
    };
    let err = null;
    try {
      fn();
    } catch (e) {
      err = e;
    } finally {
      console.error = ce;
    }
    return {w, err};
  }
  /* v085: Random map = a real mission. It picks a mission type with the map screen's own weights (MZ.pickType), sets G.mission
     exactly as clicking a pin does (MZ.launch) and runs the game's go('EXPEDITION'), so the town, the mission site, its loot,
     survivors and zombies, the weather roll and the arrival are whatever the current game builds. Only the drive and the clock
     advance are skipped. The seed covers the mission type pick and the whole build. */
  function buildMapCore(seed, mtype) {
    G.fort = D.w.fort;
    const t0 = performance.now();
    D.w.kind = 'map';
    D.w.seed = seed >>> 0;
    D.w.mode = 'EXPEDITION';
    D.w.bld = null;
    D.w.info = null;
    /* the mission site is placed by the rumour hook right after the town; it gets its own sub-seed so caches the town build
       warms up (which use a varying number of random calls) can't change which building the same seed picks */
    const fr0 = fzRumors;
    fzRumors = function () {
      return withSeed(hash32(seed + ':mission'), () => fr0.apply(this, arguments));
    };
    const r = captureWarn(() => {
      try {
        withSeed(seed, () => {
          const T = REG.missions(),
            t = mtype === 'none' || !T.length ? null : T.includes(mtype) ? mtype : MZ.pickType();
          G.mission = t ? {t, id: -1, h: 0, dev: 1} : null;
          D.w.mission = t;
          go('EXPEDITION');
        });
      } finally {
        fzRumors = fr0;
      }
    });
    const R = window.__fortZombieTown || {},
      ms = +(performance.now() - t0).toFixed(1),
      MT = D.w.mission && window.MZ && MZ.TYPES[D.w.mission];
    D.w.gen = {
      kind: 'map',
      seed: seed >>> 0,
      fort: G.fort,
      mission: MT ? MT.full || D.w.mission : 'none (free roam)',
      site: G.mission && G.mission.b ? G.mission.b.t : null,
      ms,
      buildings: buildings.length,
      plots: (R.plan || []).length,
      zombies: zombies.length,
      containers: lootConts().length,
      doors: doors.length,
      solids: solids.length,
      windows: winList.length,
      sceneObjs: countScene(),
      warnings: (R.placementErrors || []).concat(r.w),
      err: r.err ? r.err.message : null
    };
    D.genHist.push({
      seed: D.w.seed,
      fort: G.fort,
      objs: D.w.gen.sceneObjs,
      solids: solids.length,
      zombies: zombies.length,
      doors: doors.length,
      buildings: buildings.length
    });
    if (D.genHist.length > 30) D.genHist.shift();
    return D.w.gen;
  }
  function loadMap(seed, mtype) {
    begin();
    if (mtype === undefined) mtype = ($('dvMis') && $('dvMis').value) || 'random';
    const g = buildMapCore(seed, mtype);
    $('dvSeed').value = String(D.w.seed);
    D.w.spawn = [pl.position.x, pl.position.z];
    if (D.base) {
      G.hp = D.base.hp;
      G.maxHp = D.base.maxHp;
      G.st = D.base.st;
    }
    syncBadge();
    refreshAll();
    g.err
      ? msg('Map generation threw: ' + g.err, false)
      : msg(
          'Mission map, seed ' +
            D.w.seed +
            ': ' +
            g.mission +
            (g.site ? ' at ' + g.site : '') +
            ', built in ' +
            g.ms +
            ' ms (' +
            g.buildings +
            ' buildings, ' +
            g.zombies +
            ' zombies' +
            (g.warnings.length ? ', ' + g.warnings.length + ' warning(s)' : '') +
            ')'
        );
  }
  const fakePlot = (cat, front) => ({
    id: -1,
    col: 1,
    row: front === 'north' ? 0 : 1,
    block: 0,
    front,
    x0: -GRID.PW / 2,
    x1: GRID.PW / 2,
    z0: -GRID.PD / 2,
    z1: GRID.PD / 2,
    cx: 0,
    cz: 0
  });
  function findDoor(B) {
    const v = new THREE.Vector3();
    let best = null,
      bd = 1e9;
    doors.forEach(d => {
      d.sol.getCenter(v);
      const dz = Math.abs(v.z - (B.cs * B.d) / 2);
      if (dz < bd) {
        bd = dz;
        best = {x: v.x, z: v.z};
      }
    });
    return bd < 2.2 ? best : null;
  }
  /* v085: the Inspector builds a building the way a town plot does (buildPlotV2 in 07_town.js): the plot ground, bld() in its slot
     (a half-plot building in sub-plot A), its yard enclosure, the placement check, then the game's post-build passes. */
  function buildLabCore(id, lv, front, seed) {
    const t = REG.building(id);
    if (!t) throw new Error('no building "' + id + '" in the town catalogue (NEWCAT)');
    const p = fakePlot(t.category, front),
      sub = t.pool === 'half' ? 'A' : null,
      s = slotOf(p, sub);
    const r = captureWarn(() => {
      clearWorld();
      G.mode = 'DEV';
      groundPlane(0x2a2c2a);
      BND = [-45, 45, -40, 40];
      treeList = [];
      buildings = [];
      streetLights = [];
      withSeed(seed, () => {
        drawPlot(p, t.category);
        const res = bld(s.cx, s.cz, t, lv, s);
        const b0 = buildings[buildings.length - 1];
        if (b0) {
          b0.cat = t.id;
          b0.cond = lv;
          if (sub) b0.sub = sub;
        }
        try {
          yardEnclosure(s, sub, t, lv, res.B);
        } catch (e) {
          console.error('yard', t.id, e);
        }
        D.w.info = {t, lv, front, res, errors: checkPlacement(s, t, res.n0, res.B)};
      });
      border(...BND);
      zFix();
      buildNav();
      realPost();
    });
    if (r.err) throw r.err;
    const B = D.w.info.res.B,
      dr = B && findDoor(B),
      cs = B ? B.cs : front === 'south' ? 1 : -1;
    const ex = dr ? [dr.x, dr.z + cs * 2.5] : [B ? B.x + cs * (B.dx || 0) : s.cx, cs * 10],
      inn = dr ? [dr.x, dr.z - cs * 2.5] : [s.cx, cs * 3];
    Object.assign(D.w.info, {entrance: ex, inside: inn, door: dr, warn: r.w, cs});
    D.w.kind = 'building';
    D.w.bld = {id, lv, front, seed: seed >>> 0};
    D.w.mode = null;
    D.w.gen = {
      kind: 'building',
      seed: seed >>> 0,
      id: t.id,
      cond: COND_NAMES[lv],
      ms: 0,
      buildings: buildings.length,
      zombies: zombies.length,
      containers: lootConts().length,
      doors: doors.length,
      solids: solids.length,
      windows: winList.length,
      sceneObjs: countScene(),
      warnings: D.w.info.errors.concat(r.w)
    };
  }
  /* id: a NEWCAT id (a number is read as a position in the live list, for tests saved before v085) */
  function bldId(v) {
    const L = REG.buildings();
    if (typeof v === 'number' || /^\d+$/.test(String(v))) return L.length ? L[((+v % L.length) + L.length) % L.length].id : null;
    return v;
  }
  function loadBld(id, lv, front, seed, keepPos) {
    begin();
    id = bldId(id);
    try {
      buildLabCore(id, lv, front, seed);
    } catch (e) {
      msg('Building failed to load: ' + e.message, false);
      return;
    }
    const I = D.w.info;
    if (keepPos) {
      $('hud').classList.remove('hide');
      ui('pz');
      lock();
      const f = freeSpot(pl.position.x, pl.position.z);
      pl.position.set(f[0], 1.6 + groundAt(f[0], f[1], 0.35), f[1]);
    } else arrive(I.entrance);
    liveSelects();
    $('dvBld').value = id;
    $('dvCond').value = String(lv);
    $('dvFront').value = front;
    msg(
      I.t.name +
        ' [' +
        I.t.id +
        '] ' +
        COND_NAMES[lv] +
        ' loaded' +
        (I.errors.length ? ' - ' + I.errors.length + ' placement problem(s) reported' : '')
    );
    refreshAll();
  }
  /* v085: builds every building in the town catalogue in turn (each condition) and reports the ones that throw or leave their plot */
  async function checkAllBuildings() {
    if (D.checking) return;
    D.checking = true;
    begin();
    const L = REG.buildings(),
      out = [],
      bad = [];
    let n = 0,
      ty = performance.now();
    const t0 = performance.now();
    try {
      for (const t of L)
        for (let lv = 0; lv < COND_NAMES.length; lv++) {
          let line = t.id + ' [' + COND_NAMES[lv] + ']: ';
          try {
            buildLabCore(t.id, lv, 'south', 1);
            const I = D.w.info,
              w = I.errors.concat(I.warn);
            line += w.length ? w.length + ' warning(s): ' + w.slice(0, 2).join(' | ') : 'OK';
            if (w.length) bad.push(line);
          } catch (e) {
            line += 'FAILED: ' + e.message;
            bad.push(line);
          }
          out.push(line);
          n++;
          if (performance.now() - ty > 250) {
            const e = $('dvMsg');
            if (e) e.textContent = 'Checking every building: ' + n + ' / ' + L.length * COND_NAMES.length + ' (' + t.name + ')';
            await new Promise(r => setTimeout(r, 0)); // let the progress line paint now and then, not after every build
            ty = performance.now();
          }
        }
    } finally {
      D.checking = false;
    }
    const ms = Math.round(performance.now() - t0),
      head =
        L.length +
        ' buildings x ' +
        COND_NAMES.length +
        ' conditions = ' +
        n +
        ' builds in ' +
        (ms / 1000).toFixed(1) +
        ' s. ' +
        (bad.length ? bad.length + ' with problems:' : 'All built cleanly.');
    D.lastCheck = head + '\n' + (bad.length ? bad.join('\n') + '\n\nAll results:\n' : '') + out.join('\n');
    loadBld(L[0].id, 0, 'south', 1);
    log(bad.length ? 'WARN' : 'info', 'check every building: ' + head + (bad.length ? ' ' + bad.join(' || ') : ''));
    msg(head + ' (report under Building > Inspector)', !bad.some(l => /FAILED/.test(l)));
    return D.lastCheck;
  }
  const WH_TABLE = {
    melee: 'hardware',
    rifle: 'gunshop',
    pistol: 'gunshop',
    assault: 'gunshop',
    smg: 'gunshop',
    ammo: 'gunshop',
    food: 'diner',
    meds: 'clinic',
    mat: 'hardware'
  };
  function whPlan() {
    const cats = Object.keys(CATS);
    ITEM_ORDER.forEach(id => {
      if (!cats.includes(ITEMS[id].cat)) cats.push(ITEMS[id].cat);
    });
    const plan = [];
    cats.forEach(cat => {
      const ids = ITEM_ORDER.filter(i => ITEMS[i].cat === cat);
      if (!ids.length) return;
      let probe = newInv(16, 16),
        cur = [];
      ids.forEach(id => {
        if (!invAdd(probe, newInst(id))) {
          plan.push({cat, ids: cur});
          probe = newInv(16, 16);
          cur = [];
          invAdd(probe, newInst(id));
        }
        cur.push(id);
      });
      if (cur.length) plan.push({cat, ids: cur});
    });
    const per = {};
    plan.forEach(p => {
      per[p.cat] = (per[p.cat] || 0) + 1;
      p.part = per[p.cat];
    });
    plan.forEach(p => (p.of = per[p.cat]));
    return plan;
  }
  function clearInv(inv) {
    inv.items.length = 0;
    inv.g = makeGrid(inv.w, inv.h);
  }
  function fillIds(c, ids) {
    clearInv(c.inv);
    const bad = [];
    ids.forEach(id => {
      const q = newInst(id);
      if (!q || !invAdd(c.inv, q)) bad.push(id);
    });
    refreshContainerVisual(c);
    recolor(c);
    return bad;
  }
  function recolor(c) {
    if (c.dev && c.dev.cols && c.inv.items.length)
      c.pieces.forEach((p, i) => {
        if (c.dev.cols[i] !== undefined) p.material.color.setHex(c.dev.cols[i]);
      });
  }
  /* ================================= v085: LIVE REGISTRIES =================================
     Dev Mode keeps NO list of game content of its own. Every list it shows is read from the game's own registry at the moment
     it is used, and every drop-down is rebuilt from them each time the panel opens (this file loads before most of the game, so
     nothing may be read at load time). Register new content in the game and it appears here with no change to this file:
       buildings   NEWCAT: defN (07_town.js), LK.register (lotkit.js), add (newlots.js)   -> Building > Inspector, Check every building
       zombies     FZ.cfg.zst styles (fzcfg.js) -> outfits RZO (zoutfits.js)             -> Zombies > Spawn & AI, All zombies
       survivors   RSURV.D + RSURV.ARCH (data/survivors.js)                               -> All survivors
       vehicles    MFZV.kinds (vehicles.js)                                               -> All models
       props       MFZPROP (mfzm_*.js lootable props) + RGPK.PF (prop kit prefabs)         -> All props
       trees       RGFLORA.treeKinds() (flora.js)                                         -> All models
       weapons     WDEF (01_items.js), each drawn with modelFor() like the game            -> All models
       items       ITEMS / CATS / LOOT_TABLES                                             -> Items pages, Warehouse
       missions    MZ.ORDER / MZ.pickType (missions.js)                                   -> World > Map
     Every world is finished by the game's own post-build passes (WB.post: merge, decor, world textures, flora), so it looks the
     way it does in a mission. Never add a hard-coded content list here: add a registry to the game and read it in REG. */
  const REG = (D.reg = {
    /* the exact pool planTownV2 draws from (07_town.js): every NEWCAT entry in the half or big pool */
    buildings: () => NEWCAT.filter(d => d && typeof d.build === 'function' && (d.pool === 'half' || d.pool === 'big')),
    building: id => REG.buildings().find(d => d.id === id) || null,
    zStyles: () => (typeof FZ !== 'undefined' && FZ.cfg && FZ.cfg.zst ? Object.keys(FZ.cfg.zst) : []),
    fzOn: () => typeof FZ !== 'undefined' && !!(FZ.T && FZ.T.on) && REG.zStyles().length > 0,
    outfitOf: st => (window.RZ && RZ.outfitKey ? RZ.outfitKey(st) : null),
    /* outfits no FZ style resolves to: they exist as models but never spawn */
    outfitsOnly: () => {
      const used = new Set(REG.zStyles().map(REG.outfitOf).filter(Boolean));
      return Object.keys(window.RZO || {}).filter(k => !used.has(k));
    },
    survivors: () => (window.RSURV ? Object.keys(RSURV.D || {}) : []),
    personas: () => (window.RSURV ? Object.keys(RSURV.ARCH || {}) : []),
    survName: id => {
      const c = typeof FZ !== 'undefined' && FZ.cfg && FZ.cfg.chars && FZ.cfg.chars[id],
        d = window.RSURV && ((RSURV.D || {})[id] || (RSURV.ARCH || {})[id]);
      return (c && c.n) || (d && (d.n || d.l)) || id;
    },
    vehicles: () => (window.MFZV ? MFZV.kinds.slice() : []),
    lootProps: () => (window.MFZPROP && MFZPROP.names ? MFZPROP.names() : []),
    prefabs: () => (window.RGPK && RGPK.PF ? Object.keys(RGPK.PF).filter(k => typeof RGPK.PF[k] === 'function') : []),
    trees: () => (window.RGFLORA && RGFLORA.treeKinds ? RGFLORA.treeKinds() : ['oak']),
    weapons: () => ITEM_ORDER.filter(id => WDEF[id]),
    lootTables: () => Object.keys(LOOT_TABLES),
    missions: () => (window.MZ && MZ.ORDER ? MZ.ORDER.slice() : [])
  });
  /* the game's post-build passes, exactly as the last step of buildWorld runs them */
  function realPost() {
    for (const f of WB.post)
      try {
        f();
      } catch (e) {
        console.warn('[dev] post-build pass', e);
      }
  }

  function buildWhCore() {
    clearWorld();
    G.mode = 'DEV';
    treeList = [];
    buildings = [];
    streetLights = [];
    D.w.ground = 0x303236;
    D.w.kind = 'warehouse'; // before spawning: mfzprops keeps warehouse containers as plain crates
    const plan = whPlan(),
      S = Showcase(44, 2.2);
    S.section('Item warehouse: one container per category', plan.length);
    plan.forEach(p => {
      const name = (CATS[p.cat] || p.cat) + (p.of > 1 ? ' ' + p.part + '/' + p.of : '');
      let c = null;
      S.add(
        name,
        (x, z) => {
          c = spawnContainer(x, z, WH_TABLE[p.cat] || 'house', 0);
        },
        {lh: 0.3, col: '#facc15'}
      );
      if (!c) return;
      c.dev = {
        cols: c.pieces.map(m => m.material.color.getHex()),
        cat: p.cat,
        part: p.part,
        of: p.of,
        ids: p.ids.slice(),
        name,
        wh: true
      };
      c.dev.init = p.ids.slice();
      fillIds(c, p.ids);
    });
    D.w.spawn0 = S.finish();
    D.w.kind = 'warehouse';
    D.w.mode = null;
    D.w.bld = null;
    D.w.info = null;
    worldGround();
    border(...BND);
    buildNav();
    realPost();
    D.w.gen = {
      kind: 'warehouse',
      seed: 0,
      ms: 0,
      buildings: 0,
      zombies: 0,
      containers: plan.length,
      doors: doors.length,
      solids: solids.length,
      windows: 0,
      sceneObjs: countScene(),
      warnings: S.fails
    };
  }
  function loadWh() {
    begin();
    buildWhCore();
    arrive(D.w.spawn0);
    msg(
      'Item warehouse loaded: ' +
        D.w.gen.containers +
        ' containers for ' +
        Object.keys(CATS).length +
        ' categories, ' +
        ITEM_ORDER.length +
        ' items'
    );
  }

  /* ---------------- v085: showcase layout for the test worlds ----------------
     Each model is built once at a far-away staging spot, measured, then moved (with its collision boxes, walkable tops, loot
     container, zombie home and tree record) into a slot sized to its own footprint and its name tag. Slots fill rows of a fixed
     width; rows and labelled sections run away from the spawn (-Z). The world (ground, bounds, border, nav grid) is sized to
     whatever was placed, so a registry can grow without limit and nothing ever lands on top of anything else. */
  const STAGE = [0, 3000],
    V3 = new THREE.Vector3();
  function nameTag(text, col, x, y, z, h) {
    const cv = document.createElement('canvas'),
      c = cv.getContext('2d'),
      F = 'bold 30px Arial,sans-serif';
    c.font = F;
    const w = Math.ceil(c.measureText(text).width) + 24;
    cv.width = w;
    cv.height = 44;
    c.font = F;
    c.fillStyle = 'rgba(0,0,0,.62)';
    c.fillRect(0, 0, w, 44);
    c.fillStyle = col || '#fff';
    c.textBaseline = 'middle';
    c.fillText(text, 12, 23);
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({map: new THREE.CanvasTexture(cv), transparent: true, depthTest: false})
    );
    h = h || 0.22;
    s.scale.set((w / 44) * h, h, 1);
    s.position.set(x, y, z);
    s.raycast = () => {};
    s.renderOrder = 9;
    s.userData.devTag = 1;
    scene.add(s);
    return s;
  }
  const tagW = (t, h) => ((String(t).length * 17 + 24) / 44) * (h || 0.22);
  function stage(build) {
    const c0 = scene.children.length,
      s0 = solids.length,
      w0 = typeof walkables !== 'undefined' ? walkables.length : 0,
      z0 = zombies.length,
      t0 = treeList.length,
      st = {objs: [], sol: [], wk: [], zs: [], tr: [], box: new THREE.Box3()};
    try {
      const r = build(STAGE[0], STAGE[1]);
      if (r && r.isObject3D && !r.parent) scene.add(r);
    } catch (e) {
      st.err = e;
    }
    st.objs = scene.children.slice(c0);
    st.sol = solids.slice(s0);
    st.wk = typeof walkables !== 'undefined' ? walkables.slice(w0) : [];
    st.zs = zombies.slice(z0);
    st.tr = treeList.slice(t0);
    const tmp = new THREE.Box3();
    st.objs.forEach(o => {
      if (o.isSprite || o.isLight) return;
      tmp.setFromObject(o);
      if (!tmp.isEmpty()) st.box.union(tmp);
    });
    st.sol.forEach(b => b && b.min && st.box.union(b));
    return st;
  }
  /* a model whose geometry holds NaN positions (three.js logs it every frame and it can't be measured or drawn) */
  const okGeo = new WeakSet();
  function badGeo(objs) {
    let bad = false;
    for (const o of objs)
      o.traverse(m => {
        const g = m.isMesh && m.geometry,
          a = g && g.attributes && g.attributes.position;
        if (!a || bad || okGeo.has(g)) return;
        const A = a.array;
        for (let i = 0; i < A.length; i++)
          if (A[i] !== A[i]) {
            bad = true;
            return;
          }
        okGeo.add(g);
      });
    return bad;
  }
  function unstage(st) {
    st.objs.forEach(o => scene.remove(o));
    const rm = (a, l) =>
      l.forEach(b => {
        const i = a.indexOf(b);
        if (i >= 0) a.splice(i, 1);
      });
    rm(solids, st.sol);
    if (typeof walkables !== 'undefined') rm(walkables, st.wk);
    rm(treeList, st.tr);
    if (st.zs.length) zombies = zombies.filter(z => !st.zs.includes(z));
  }
  function shift(st, dx, dz) {
    V3.set(dx, 0, dz);
    st.objs.forEach(o => {
      o.position.x += dx;
      o.position.z += dz;
      const c = o.userData && o.userData.cont;
      if (c && typeof c.x === 'number') {
        c.x += dx;
        c.z += dz;
      }
    });
    st.sol.concat(st.wk).forEach(b => b && b.translate && b.translate(V3));
    st.zs.forEach(z => {
      const u = z.userData;
      for (const [a, b] of [
        ['hx', 'hz'],
        ['lx', 'lz']
      ])
        if (typeof u[a] === 'number') {
          u[a] += dx;
          u[b] += dz;
        }
    });
    st.tr.forEach(t => {
      t.x += dx;
      t.z += dz;
    });
  }
  function Showcase(rowW, gap) {
    const S = {rowW: rowW || 60, gap: gap || 1.2, z: 0, rowD: 0, secs: 0, n: 0, fails: [], placed: [], e: [1e9, -1e9, 1e9, -1e9]};
    D.show = S; // the last test world's layout: every model's name and final bounds (Diagnostics, tests)
    const L = -S.rowW / 2;
    S.x = L;
    BND = [-6000, 6000, -6000, 6000]; // open while building; S.finish() sizes the world to what was placed
    const grow = (x0, x1, z0, z1) => {
      S.e[0] = Math.min(S.e[0], x0);
      S.e[1] = Math.max(S.e[1], x1);
      S.e[2] = Math.min(S.e[2], z0);
      S.e[3] = Math.max(S.e[3], z1);
    };
    S.row = () => {
      if (S.rowD) S.z -= S.rowD;
      S.rowD = 0;
      S.x = L;
    };
    S.section = (title, n, col) => {
      S.row();
      if (S.secs++) S.z -= 4;
      const t = title + (n != null ? '  (' + n + ')' : '');
      nameTag(t, col || '#facc15', 0, 3, S.z - 0.5, 0.6);
      grow(-tagW(t, 0.6) / 2, tagW(t, 0.6) / 2, S.z - 1, S.z);
      S.z -= 2.4;
    };
    /* build(x, z) builds one model at (x, z) (it may add to the scene, solids, zombies... or return a group). o: {col, lh} */
    S.add = (name, build, o) => {
      o = o || {};
      const st = stage(build),
        b = st.box,
        ok = !st.err && !b.isEmpty() && [b.min.x, b.max.x, b.min.z, b.max.z, b.max.y].every(isFinite),
        nan = ok && badGeo(st.objs);
      const w = ok ? b.max.x - b.min.x : 0,
        d = ok ? b.max.z - b.min.z : 0;
      if (!ok || nan || w > 400 || d > 400) {
        unstage(st);
        S.fails.push(
          name + ': ' + (st.err ? st.err.message : !ok ? 'built nothing' : nan ? 'NaN geometry' : 'implausible size')
        );
        return null;
      }
      const lh = o.lh || 0.22,
        sw = Math.max(w, name ? tagW(name, lh) : 0) + S.gap,
        sd = d + S.gap;
      if (S.x > L + 1e-6 && S.x + sw > -L) S.row();
      const px = S.x + sw / 2,
        pz = S.z - sd / 2;
      const dx = px - (b.min.x + b.max.x) / 2,
        dz = pz - (b.min.z + b.max.z) / 2;
      shift(st, dx, dz);
      S.placed.push({name, box: b.clone().translate(V3.set(dx, 0, dz))});
      S.x += sw;
      S.rowD = Math.max(S.rowD, sd);
      grow(px - sw / 2, px + sw / 2, pz - sd / 2, pz + sd / 2);
      if (name) nameTag(name, o.col || '#fff', px, Math.max(0.8, b.max.y) + 0.4, pz, lh);
      S.n++;
      return st;
    };
    /* sizes the world to the content; returns the spawn point (in front of the first row, facing -Z) */
    S.finish = () => {
      S.row();
      if (S.e[0] > S.e[1]) S.e = [-10, 10, -10, 0];
      const m = 12;
      BND = [Math.floor(S.e[0] - m), Math.ceil(S.e[1] + m), Math.floor(S.e[2] - m), Math.ceil(S.e[3] + 16)];
      if (solids.G) solids.G = null;
      if (typeof walkables !== 'undefined' && walkables.G) walkables.G = null;
      if (S.fails.length) log('WARN', 'test world: ' + S.fails.length + ' model(s) failed: ' + S.fails.join(' | '));
      return [0, S.e[3] + 8];
    };
    return S;
  }
  /* a ground plane sized to the current bounds (the old one was a fixed 500 m square) */
  function worldGround() {
    const w = BND[1] - BND[0] + 60,
      d = BND[3] - BND[2] + 60,
      g = mesh(new THREE.PlaneGeometry(Math.max(500, w), Math.max(500, d)), D.w.ground || 0x2e3230, 0, 0, 0);
    g.position.set((BND[0] + BND[1]) / 2, 0, (BND[2] + BND[3]) / 2);
    g.rotation.x = -Math.PI / 2;
    return g;
  }

  /* ---------------- v076 / v085: Building > Test worlds (props, models, survivors, zombies, AI test areas) ---------------- */
  /* Test dummies: zombies flagged u.dummy stand still and never attack while D.w.dummy is on (they can still be shot, hit, dismembered and killed). */
  function testBase(kind, bnd, col) {
    clearWorld();
    G.mode = 'DEV';
    D.w.ground = col || 0x2e3230;
    BND = bnd || [-45, 45, -45, 45];
    treeList = [];
    buildings = [];
    streetLights = [];
    D.w.kind = 'test ' + kind;
    D.w.mode = null;
    D.w.bld = null;
    D.w.info = null;
    D.w.dummy = true;
    try {
      CUR.cs = 1;
      CUR.lv = 0;
    } catch (e) {}
  }
  function testEnd(kind, spawn, extra) {
    worldGround();
    border(...BND);
    try {
      zFix();
    } catch (e) {}
    buildNav();
    realPost();
    D.w.gen = Object.assign(
      {
        kind: 'test ' + kind,
        seed: 0,
        ms: 0,
        buildings: buildings.length,
        zombies: zombies.length,
        containers: lootConts().length,
        doors: doors.length,
        solids: solids.length,
        windows: winList.length,
        sceneObjs: countScene(),
        warnings: []
      },
      extra || {}
    );
    arrive(spawn);
    refreshAll();
  }
  /* v085: dummies spawn standing (as in a siege: never asleep) through the game's own zombie(), with FZ.force picking the style */
  function dummyZ(x, z, style, base) {
    const F = typeof FZ !== 'undefined' ? FZ : null,
      f0 = F && F.force,
      on0 = F && F.T && F.T.on,
      m0 = G.mode,
      n0 = zombies.length;
    try {
      if (F) {
        if (base) {
          if (F.T) F.T.on = false;
        } else F.force = style || null;
      }
      G.mode = 'SIEGE';
      zombie(x, z, base || undefined, false);
    } finally {
      G.mode = m0;
      if (F) {
        F.force = f0;
        if (F.T) F.T.on = on0;
      }
    }
    const g = zombies.length > n0 ? zombies[zombies.length - 1] : null;
    if (!g) return null;
    const u = g.userData;
    u.dummy = 1;
    u.sleep = false;
    u.hx = x;
    u.hz = z;
    u.lx = x;
    u.lz = z;
    g.rotation.y = 0;
    return g;
  }
  function tagAt(t, c, x, y, z, s) {
    try {
      nameTag(t, c || '#facc15', x, y, z, (s || 0.6) * 0.5);
    } catch (e) {}
  }
  /* prefab arguments for the few prop-kit prefabs that need one to build (anything not listed is called with none) */
  const PF_ARGS = {jersey: [3]};
  function prefabBuilder(n) {
    return (x, z) => {
      const RP = window.RGPROPS,
        s = RP.session(),
        pf = RGPK.PF[n].apply(null, PF_ARGS[n] || []);
      if (!pf) throw new Error('prefab returned nothing');
      s.M.save().move(x, 0, z);
      s.M.put(pf, {nocol: true});
      s.M.restore();
      const g = s.build({cull: true});
      g.userData.kind = 'rgprop';
      scene.add(g);
      const b = new THREE.Box3().setFromObject(g);
      if (!b.isEmpty() && b.max.y > 0.35) solids.push(b);
      return g;
    };
  }
  function twProps() {
    begin();
    testBase('props');
    const S = Showcase(72, 1.4),
      LP = REG.lootProps(),
      PFK = window.RGPROPS ? REG.prefabs() : [];
    if (LP.length) {
      S.section('LOOTABLE PROPS (walk up, E to search)', LP.length);
      LP.forEach(n => {
        const d = MFZPROP.CATALOGUE && MFZPROP.CATALOGUE[n];
        S.add((d && d.label ? d.label + '  ' : '') + '(' + n + ')', (x, z) => {
          spawnPropContainer(x, z, n, undefined, 0, 0);
        });
      });
    }
    if (PFK.length) {
      S.section('PROP KIT PREFABS (street furniture, clutter, scenery)', PFK.length, '#fde68a');
      PFK.forEach(n => S.add(n, prefabBuilder(n), {col: '#fde68a'}));
    }
    const sp = S.finish();
    testEnd('props', sp, {warnings: S.fails});
    msg(
      'Props test world: ' +
        LP.length +
        ' lootable props + ' +
        PFK.length +
        ' prop kit prefabs' +
        (S.fails.length
          ? '. ' + S.fails.length + ' prefabs in the kit cannot build in this game and were skipped (list in the Log)'
          : '')
    );
  }
  function weaponBuilder(id) {
    return (x, z) => {
      const m = cloneModel(id, true); // the game's own copy of the model it draws for this weapon
      m.traverse(o => {
        if (o.isMesh && o.geometry) o.geometry = o.geometry.clone(); // the merge pass must never touch the game's cached model
      });
      const g = new THREE.Group();
      g.add(m);
      const b = new THREE.Box3().setFromObject(g);
      if (b.isEmpty()) throw new Error('empty model');
      if (b.max.z - b.min.z > b.max.x - b.min.x) g.rotation.y = Math.PI / 2; // long side across the row
      g.updateMatrixWorld(true);
      b.setFromObject(g);
      g.position.set(x - (b.min.x + b.max.x) / 2, 1 - b.min.y, z - (b.min.z + b.max.z) / 2);
      scene.add(g);
      const w = b.max.x - b.min.x,
        d = b.max.z - b.min.z,
        p = mesh(new THREE.BoxGeometry(w + 0.16, 1, Math.max(0.3, d + 0.16)), 0x3a3836, x, 0.5, z);
      solids.push(new THREE.Box3().setFromObject(p));
      return g;
    };
  }
  function twModels() {
    begin();
    testBase('models', null, 0x2c302e);
    const S = Showcase(72, 1.6),
      VK = REG.vehicles(),
      WP = REG.weapons(),
      TK = REG.trees();
    if (VK.length) {
      S.section('VEHICLES (MFZV, every kind)', VK.length, '#93c5fd');
      VK.forEach(k => S.add(k, (x, z) => MFZV.make(k, x, z, 0, {}), {col: '#93c5fd', lh: 0.3}));
    }
    if (WP.length) {
      S.section('WEAPONS (every gun and melee weapon, game models)', WP.length, '#fca5a5');
      WP.forEach(id => S.add((ITEMS[id] && ITEMS[id].name) || id, weaponBuilder(id), {col: '#fca5a5', lh: 0.16}));
    }
    S.section('TREES AND PLANTS (flora)', TK.length + 3, '#86efac');
    const tr = (k, dead) => (x, z) => {
      tree(x, z);
      const t = treeList[treeList.length - 1];
      if (!t) return;
      t.keep = 1;
      const sp = t.g.userData && t.g.userData.spec;
      if (sp) {
        sp.kind = k;
        if (dead) sp.dead = 1;
      }
      /* flora swaps the placeholder for the real tree later: reserve its canopy */
      const r = new THREE.Box3(new THREE.Vector3(x - 3, 0, z - 3), new THREE.Vector3(x + 3, 0.01, z + 3));
      r.devRes = 1;
      solids.push(r);
    };
    TK.forEach(k => S.add(k, tr(k), {col: '#86efac', lh: 0.3}));
    S.add('dead tree', tr('oak', true), {col: '#86efac', lh: 0.3});
    S.add('bush', (x, z) => bush(x, z), {col: '#86efac'});
    S.add('street light', (x, z) => streetLight(x, z), {col: '#fde68a'});
    const sp = S.finish();
    /* the canopy reservations only kept the slots apart: drop them before the nav grid is built */
    for (let i = solids.length - 1; i >= 0; i--) if (solids[i] && solids[i].devRes) solids.splice(i, 1);
    solids.G = null;
    testEnd('models', sp, {warnings: S.fails});
    msg(
      'Models test world: ' +
        VK.length +
        ' vehicles, ' +
        WP.length +
        ' weapons, ' +
        (TK.length + 1) +
        ' trees' +
        (S.fails.length ? ' (' + S.fails.length + ' could not be built: see Log)' : '')
    );
  }
  function survBuilder(id, arch) {
    return (x, z) => {
      const SV = window.RGSURV,
        g = new THREE.Group();
      g.position.set(x, 0, z);
      const d = arch ? Object.assign({arch: id}, RSURV.ARCH[id]) : SV.charDesign(id);
      SV.buildSurvivor(g, d, null);
      g.userData.gallery = 1;
      scene.add(g);
      return g;
    };
  }
  function twSurvivors() {
    begin();
    testBase('survivors');
    const S = Showcase(46, 0.5),
      SD = window.RGSURV && RGSURV.buildSurvivor ? REG.survivors() : [],
      AR = SD.length ? REG.personas() : [];
    if (SD.length) {
      S.section('NAMED SURVIVORS', SD.length);
      SD.slice()
        .sort((a, b) => REG.survName(a).localeCompare(REG.survName(b)))
        .forEach(id => S.add(REG.survName(id), survBuilder(id, false), {lh: 0.17}));
    }
    if (AR.length) {
      S.section('BASE PERSONAS', AR.length);
      AR.forEach(id => S.add(REG.survName(id), survBuilder(id, true), {col: '#facc15', lh: 0.17}));
    }
    const sp = S.finish();
    testEnd('survivors', sp, {warnings: S.fails});
    msg('Survivor test world: ' + (S.n || 0) + ' survivor models' + (S.fails.length ? ' (' + S.fails.length + ' failed)' : ''));
  }
  function twZombies() {
    begin();
    testBase('zombies');
    const S = Showcase(48, 0.6),
      ST = REG.fzOn() ? REG.zStyles().slice().sort() : [],
      OO = window.RZ && RZ.makeRZ ? REG.outfitsOnly() : [];
    if (ST.length) {
      S.section('FZ ZOMBIE STYLES (live, spawned exactly as in game)', ST.length, '#fca5a5');
      ST.forEach(s =>
        S.add(s + (REG.outfitOf(s) ? '' : ' (plain body)'), (x, z) => dummyZ(x, z, s), {col: '#fca5a5', lh: 0.17})
      );
    } else {
      const K = Object.keys(ZT);
      S.section('ZOMBIE TYPES (FZ styles are off)', K.length, '#fde68a');
      K.forEach(k => S.add(k, (x, z) => dummyZ(x, z, null, k), {col: '#fde68a'}));
    }
    if (OO.length) {
      S.section('OUTFITS NO STYLE USES (static model, never spawns)', OO.length, '#fde68a');
      OO.forEach(k =>
        S.add(
          k,
          (x, z) => {
            const g = new THREE.Group(),
              fo = window.FZS;
            g.position.set(x, 0, z);
            window.FZS = null;
            try {
              RZ.makeRZ({zombie: 1, style: k}, g);
            } finally {
              window.FZS = fo;
            }
            g.userData.gallery = 1;
            scene.add(g);
            return g;
          },
          {col: '#fde68a', lh: 0.17}
        )
      );
    }
    const sp = S.finish();
    testEnd('zombies', sp, {warnings: S.fails});
    msg(
      'Zombie test world: ' +
        zombies.length +
        ' live zombies' +
        (OO.length ? ' + ' + OO.length + ' outfit-only models' : '') +
        ', AI off (Building > Test worlds > AI on / off)' +
        (S.fails.length ? '. ' + S.fails.length + ' failed: see Log' : '')
    );
  }
  /* AI test areas: a wall to walk round, a room with only a window, a room with only a door, and stairs to an upper floor */
  function twRoom(x, z, w, d, ops, col) {
    const B = mk(x, z, w, d, 3, col || 0x8f8a7e, 0x5b5650, 0x5a3a22);
    B.g.userData.bwall = 1;
    shell(B, ops);
    buildings.push({x: B.x, z: B.z, w: B.w, d: B.d, t: 'test'});
    return B;
  }
  function twAI() {
    begin();
    testBase('ai areas', [-45, 45, -35, 30], 0x34383a);
    /* 1. wall */
    {
      const B = mk(-30, -10, 14, 1, 3, 0x8f8a7e, 0x5b5650, 0x5a3a22);
      B.g.userData.bwall = 1;
      WL(B, 1, 0, -7, 7, [], 3);
      dummyZ(-30, -15);
      tagAt('WALL: walks round it', '#facc15', -30, 4.2, -10, 0.8);
    }
    /* 2. window only (front, facing the spawn) */
    {
      twRoom(-10, -14, 8, 7, {f: [{k: 'w', c: 0}]});
      dummyZ(-10, -15);
      tagAt('WINDOW: climbs out', '#facc15', -10, 4.6, -10.5, 0.8);
    }
    /* 3. door only */
    {
      twRoom(10, -14, 8, 7, {f: [{k: 'd', c: 0, s: 1}]});
      dummyZ(10, -15);
      tagAt('DOOR: opens / breaks it', '#facc15', 10, 4.6, -10.5, 0.8);
    }
    /* 4. upper floor with stairs */
    {
      const B = mk(30, -16, 10, 8, 3, 0x8f8a7e, 0x5b5650, 0x5a3a22);
      slab(B, -5, 5, -4, 4, 2.8, 3.1, 0x6b655c, true);
      stairs(B, 3.6, 8.2, -1, 10, 0.31, 0.42, 1.6, 0x77716a); /* climbs north onto the floor's front edge */
      slab(B, -5, 5, -4.05, -3.95, 3.1, 4.1, 0x4a4038, false);
      slab(B, -5, 2.7, 3.95, 4.05, 3.1, 4.1, 0x4a4038, false);
      slab(B, -5.05, -4.95, -4, 4, 3.1, 4.1, 0x4a4038, false);
      slab(B, 4.95, 5.05, -4, 4, 3.1, 4.1, 0x4a4038, false);
      buildings.push({x: B.x, z: B.z, w: B.w, d: B.d, t: 'test'});
      const g = dummyZ(20, -24);
      if (g) {
        g.position.set(29, 3.1, -17);
        g.userData.hx = 29;
        g.userData.hz = -17;
      }
      dummyZ(24, -6);
      tagAt('UPSTAIRS: one up, one below', '#facc15', 30, 6, -16, 0.8);
    }
    tagAt('AI is OFF: Dev Mode > Building > Test worlds > AI on / off', '#fca5a5', 0, 3.2, 8, 0.7);
    testEnd('ai areas', [0, 18]);
    msg('AI test areas loaded: wall, window, door, upstairs. Turn the AI on to watch them path');
  }
  function twToggleAI() {
    D.w.dummy = !D.w.dummy;
    if (!D.w.dummy)
      zombies.forEach(z => {
        const u = z.userData;
        if (u.dummy) {
          u.see = false;
          u.hunt = 0;
        }
      });
    msg('Test zombies: AI ' + (D.w.dummy ? 'OFF (dummies)' : 'ON'));
    refreshAll();
  }
  /* test-world loaders by D.w.kind (Reset test world, saved tests) */
  const TW = {
    'test props': twProps,
    'test models': twModels,
    'test survivors': twSurvivors,
    'test zombies': twZombies,
    'test ai areas': twAI
  };
  function scenario(m) {
    G.hqPause = false;
    if (!D.on) enable();
    D.open = false;
    if (invOpen) {
      invOpen = false;
      ($('invScr') || {style: {}}).style.display = 'none';
    }
    if (!G.day || G.day < 1 || !HQINV.items.length) initCampaign(D.w.fort);
    G.fort = D.w.fort;
    const seed = m === 'EXPEDITION' ? parseSeed($('dvSeed').value) : 0;
    D.w.kind = 'scenario';
    D.w.mode = m;
    D.w.seed = seed;
    D.w.bld = null;
    D.w.info = null;
    const run = () => {
      m === 'SIEGE' ? startSiege() : go(m);
    };
    m === 'EXPEDITION' ? withSeed(seed, run) : run();
    D.w.gen = {
      kind: 'scenario ' + m,
      seed,
      ms: 0,
      buildings: buildings.length,
      zombies: zombies.length,
      containers: lootConts().length,
      doors: doors.length,
      solids: solids.length,
      windows: winList.length,
      sceneObjs: countScene(),
      warnings: (window.__fortZombieTown && m === 'EXPEDITION' ? window.__fortZombieTown.placementErrors : []) || []
    };
    D.sel = null;
    syncBadge();
    refreshAll();
    msg('Scenario ' + m + ' started inside the dev sandbox (campaign state restored on exit)');
  }
  function resetEnv() {
    if (!D.w.kind) {
      msg('Nothing to reset: no test world is loaded yet', false);
      return;
    }
    if (!confirm('Reset the test environment? The current test world and everything spawned in it will be rebuilt.'))
      return;
    const k = D.w.kind;
    if (k === 'map') loadMap(D.w.seed, D.w.mission || 'none');
    else if (k === 'building') {
      const b = D.w.bld;
      loadBld(b.id, b.lv, b.front, b.seed);
    } else if (k === 'warehouse') loadWh();
    else if (k === 'scenario') scenario(D.w.mode);
    else if (TW[k]) TW[k]();
  }

  /* ---------- zombies / combat ---------- */
  const baseOf = z => {
    const u = z.userData;
    if (!u.dev) u.dev = {hp0: u.hp, sp0: u.sp, dmg0: u.dmg, hpMax: u.hp};
    return u.dev;
  };
  function applyStats(z) {
    const b = baseOf(z),
      u = z.userData;
    u.sp = b.sp0 * D.s.spM;
    u.dmg = b.dmg0 * D.s.dmgM;
    u.hp = b.hp0 * D.s.hpM;
    b.hpMax = u.hp;
  }
  const zid = z => z.userData.devId || (z.userData.devId = ++D.zid);
  /* v085: one zombie through the game's own zombie(): kind = an FZ style (forced with FZ.force, as fzSpawn does), 'random'
     (the in-game style mix) or, when FZ styles are off, a core ZT type. Returns the new zombie or null. */
  function spawnOne(kind, x, z) {
    const F = typeof FZ !== 'undefined' ? FZ : null,
      st = REG.fzOn() && REG.zStyles().includes(kind),
      f0 = F && F.force,
      c0 = zombies.length;
    try {
      if (F) F.force = st ? kind : null;
      zombie(x, z, !st && ZT[kind] ? kind : undefined, false);
    } finally {
      if (F) F.force = f0;
    }
    return zombies.length > c0 ? zombies[zombies.length - 1] : null;
  }
  const zKnown = k => k === 'random' || !!ZT[k] || REG.zStyles().includes(k);
  function spawnZ(kind, n) {
    if (!worldOK()) return;
    if (!zKnown(kind)) {
      msg('Unknown zombie type ' + kind, false);
      return;
    }
    let made = 0;
    const base = Math.atan2(-Math.cos(yaw), -Math.sin(yaw));
    for (let t = 0; t < n * 40 && made < n; t++) {
      const a = base + (Math.random() - 0.5) * 1.5,
        r = 5 + Math.random() * (6 + n * 0.6),
        x = pl.position.x + Math.cos(a) * r,
        z = pl.position.z + Math.sin(a) * r;
      if (x < BND[0] + 2 || x > BND[1] - 2 || z < BND[2] + 2 || z > BND[3] - 2) continue;
      const q = spawnOne(kind, x, z);
      if (q) {
        const u = q.userData;
        u.devTest = true;
        u.devKind = kind === 'random' ? u.fzs || 'random' : kind;
        if (u.sleep) wakeZ(q);
        zid(q);
        applyStats(q);
        made++;
      }
    }
    made < n
      ? msg('Spawned ' + made + ' of ' + n + ' ' + kind + ' (not enough free space)', made > 0)
      : msg('Spawned ' + made + ' ' + kind);
    refreshAll();
  }
  function removeZ(list, why) {
    const set = new Set(list);
    zombies = zombies.filter(z => !set.has(z));
    list.forEach(z => {
      scene.remove(z);
      z.traverse(o => {
        if (o.isSprite && o.material) o.material.dispose();
      });
    });
    if (set.has(D.sel)) D.sel = null;
    msg('Removed ' + list.length + ' ' + why);
    refreshAll();
  }
  function killZs(list) {
    let n = 0;
    D.force = true;
    try {
      list.slice().forEach(z => {
        if (zombies.includes(z)) {
          z.userData.hp = 0;
          killZ(z);
          n++;
        }
      });
    } finally {
      D.force = false;
    }
    msg('Killed ' + n + ' zombie(s)');
    refreshAll();
  }
  function zombieList() {
    return zombies
      .slice()
      .sort((a, b) => dist2(a.position.x, a.position.z) - dist2(b.position.x, b.position.z))
      .slice(0, 60);
  }
  function applyAllStats() {
    D.s.hpM = clampN($('dvHpM').value, 0.01, 1000, 1);
    D.s.dmgM = clampN($('dvDmgM').value, 0, 1000, 1);
    D.s.spM = clampN($('dvSpM').value, 0, 10, 1);
    zombies.forEach(applyStats);
    msg(
      'Applied HP x' +
        D.s.hpM +
        ', damage x' +
        D.s.dmgM +
        ', speed x' +
        D.s.spM +
        ' to ' +
        zombies.length +
        ' zombie(s)'
    );
  }
  function resetStats() {
    D.s.hpM = D.s.dmgM = D.s.spM = 1;
    $('dvHpM').value = $('dvDmgM').value = $('dvSpM').value = 1;
    zombies.forEach(z => {
      const b = baseOf(z),
        u = z.userData;
      u.hp = b.hp0;
      u.sp = b.sp0;
      u.dmg = b.dmg0;
      b.hpMax = b.hp0;
    });
    D.s.zBeh = 'normal';
    D.s.zFreeze = false;
    D.s.zInv = false;
    msg('Zombie stats, AI mode and invulnerability reset to normal');
    refreshAll();
  }

  /* ---------- loot / containers ---------- */
  const contIds = c => c.inv.items.map(q => q.id);
  function nearestCont(maxD) {
    let b = null,
      bd = maxD || 8;
    lootConts().forEach(c => {
      const d = dist2(c.x, c.z);
      if (d < bd) {
        bd = d;
        b = c;
      }
    });
    if (!b) msg('No loot container within ' + (maxD || 8) + ' m of you', false);
    return b;
  }
  function initOf(c) {
    if (!c.dev) c.dev = {};
    if (!c.dev.init) c.dev.init = contIds(c);
    return c.dev;
  }
  function spawnContainerNear(table, n) {
    if (!worldOK()) return null;
    if (!LOOT_TABLES[table]) {
      msg('Unknown loot table ' + table, false);
      return null;
    }
    const x = pl.position.x - Math.sin(yaw) * 3,
      z = pl.position.z - Math.cos(yaw) * 3,
      f = freeSpot(x, z);
    const c = spawnContainer(f[0], f[1], table, groundAt(f[0], f[1], pl.position.y - 1.6 + 0.35));
    c.dev = {cols: c.pieces.map(m => m.material.color.getHex()), name: 'dev ' + table, spawned: true};
    clearInv(c.inv);
    const bad = fillIds(c, rollLoot(table, n));
    c.dev.init = contIds(c);
    msg(
      'Spawned ' +
        table +
        ' container with ' +
        c.inv.items.length +
        ' item(s)' +
        (bad.length ? ' (' + bad.length + ' did not fit)' : '')
    );
    return c;
  }
  function describeCont(c) {
    const m = {};
    c.inv.items.forEach(q => {
      m[q.id] = (m[q.id] || 0) + 1;
    });
    return (
      'container table=' +
      c.table +
      ' at (' +
      c.x.toFixed(1) +
      ',' +
      c.z.toFixed(1) +
      ') items=' +
      c.inv.items.length +
      '\n' +
      Object.keys(m)
        .map(id => '  ' + id + ' x' + m[id] + '  (' + (ITEMS[id] ? ITEMS[id].name : 'MISSING DEFINITION') + ')')
        .join('\n')
    );
  }
  function out(t) {
    const e = $('dvOut');
    if (e) e.textContent = t;
  }
  function lootSample(table, n) {
    const t = LOOT_TABLES[table];
    if (!t) return 'unknown table';
    const ids = Object.keys(t),
      tot = ids.reduce((a, k) => a + t[k], 0),
      cnt = {};
    rollLoot(table, n).forEach(id => {
      cnt[id] = (cnt[id] || 0) + 1;
    });
    return (
      'Loot table "' +
      table +
      '": ' +
      n +
      ' rolls (rollLoot, unmodified game probabilities)\nid  count  actual%  expected%\n' +
      ids
        .sort((a, b) => (cnt[b] || 0) - (cnt[a] || 0))
        .map(
          id =>
            id +
            '  ' +
            (cnt[id] || 0) +
            '  ' +
            (((cnt[id] || 0) / n) * 100).toFixed(1) +
            '  ' +
            ((t[id] / tot) * 100).toFixed(1) +
            (ITEMS[id] ? '' : '  <-- MISSING ITEM')
        )
        .join('\n')
    );
  }
  function lootCheck() {
    const r = [];
    for (const tn in LOOT_TABLES) {
      const t = LOOT_TABLES[tn];
      if (!Object.keys(t).length) r.push('table ' + tn + ' is empty');
      for (const id in t) {
        if (!ITEMS[id]) r.push('table ' + tn + ': unknown item ' + id);
        if (!(t[id] > 0) || !isFinite(t[id])) r.push('table ' + tn + ': bad weight for ' + id + ' (' + t[id] + ')');
      }
    }
    REG.buildings().forEach(d => {
      if (!LOOT_TABLES[d.loot]) r.push('building ' + d.id + ' uses missing loot table ' + d.loot);
    });
    ITEM_ORDER.forEach(id => {
      const it = ITEMS[id];
      if (!it || !it.name || !it.size || !(it.size[0] > 0) || !(it.size[1] > 0))
        r.push('item ' + id + ' has an invalid definition');
      else if (!CATS[it.cat]) r.push('item ' + id + ' has category ' + it.cat + ' that is not in CATS');
    });
    for (const tn in LOOT_TABLES)
      if (!LOOT_PROP[tn]) r.push('loot table ' + tn + ' has no container prop in LOOT_PROP (falls back to a crate)');
    return r;
  }
  /* v085: what Dev Mode reads from each game registry right now, and anything orphaned between them */
  function syncReport() {
    const B = REG.buildings(),
      ST = REG.zStyles(),
      noOutfit = ST.filter(k => !REG.outfitOf(k)),
      OO = REG.outfitsOnly(),
      L = [
        'Dev Mode reads these live from the game (nothing is listed by hand):',
        '  Buildings (town catalogue NEWCAT): ' +
          B.length +
          ' (' +
          B.filter(d => d.pool === 'big').length +
          ' full-block, ' +
          B.filter(d => d.pool === 'half').length +
          ' half-plot)',
        '  Zombie styles (FZ.cfg.zst): ' + ST.length + (REG.fzOn() ? '' : ' (FZ styles are OFF: core walker/runner/brute)'),
        '  Zombie outfits (RZO): ' + Object.keys(window.RZO || {}).length,
        '  Survivors: ' + REG.survivors().length + ' named + ' + REG.personas().length + ' base personas',
        '  Vehicles (MFZV.kinds): ' + REG.vehicles().length,
        '  Lootable props (MFZPROP): ' + REG.lootProps().length,
        '  Prop kit prefabs (RGPK.PF): ' + REG.prefabs().length,
        '  Tree species (flora): ' + REG.trees().length,
        '  Weapons (WDEF): ' + REG.weapons().length,
        '  Items: ' + ITEM_ORDER.length + ' in ' + Object.keys(CATS).length + ' categories, ' + REG.lootTables().length + ' loot tables',
        '  Mission types: ' + REG.missions().join(', '),
        ''
      ];
    if (noOutfit.length) L.push('Styles drawn with the plain body (no outfit in RZO): ' + noOutfit.join(', '));
    if (OO.length) L.push('Outfits no style uses (never spawn): ' + OO.join(', '));
    const nonPool = NEWCAT.filter(d => !B.includes(d));
    if (nonPool.length) L.push('NEWCAT entries the town never places (no build / not half or big pool): ' + nonPool.map(d => d.id).join(', '));
    const legacy = typeof CATALOGUE !== 'undefined' ? CATALOGUE.length : 0;
    if (legacy) L.push('Legacy catalogue (quarantined, never placed, hidden from Dev Mode): ' + legacy + ' entries');
    if (D.show && D.show.fails.length) L.push('Last test world, models that could not be built: ' + D.show.fails.join(' | '));
    return L.join('\n');
  }
  D.syncReport = syncReport;
  D.buildLab = (id, lv, front, seed) => buildLabCore(id, lv || 0, front || 'south', seed || 1); // console / tests
  function giveItem(id, qty) {
    if (!ITEMS[id]) {
      msg('Unknown item id ' + id, false);
      return;
    }
    qty = Math.max(1, Math.min(500, qty | 0 || 1));
    let added = 0,
      over = 0;
    for (let i = 0; i < qty; i++) {
      const q = newInst(id);
      if (invAdd(PINV, q)) {
        added++;
        continue;
      }
      if (D.s.unlimited && playing()) {
        let c = D.overflow.find(k => inScene(k.group) && invAdd(k.inv, q));
        if (!c) {
          c = spawnContainerNear('house', 0);
          if (c) {
            D.overflow.push(c);
            if (invAdd(c.inv, q)) c = c;
            else c = null;
          }
        }
        if (c) {
          over++;
          added++;
          continue;
        }
      }
      break;
    }
    added < qty
      ? msg(
          'Added ' +
            added +
            ' of ' +
            qty +
            ' x ' +
            ITEMS[id].name +
            ' - player inventory is full' +
            (D.s.unlimited ? '' : ' (enable Unlimited capacity to overflow into a crate)'),
          added > 0
        )
      : msg(
          'Added ' +
            added +
            ' x ' +
            ITEMS[id].name +
            ' [' +
            id +
            ']' +
            (over ? ' (' + over + ' placed in an overflow crate next to you)' : '')
        );
  }
  function renderItems() {
    const L = $('dvItems');
    if (!L) return;
    const q = ($('dvQ').value || '').toLowerCase().trim(),
      cat = $('dvCat').value;
    const ids = ITEM_ORDER.filter(id => {
      const it = ITEMS[id];
      return (!cat || it.cat === cat) && (!q || id.includes(q) || it.name.toLowerCase().includes(q));
    });
    const H = L.clientHeight,
      W = L.clientWidth,
      cols = W > 560 ? 2 : 1,
      rows = H > 0 ? Math.max(1, Math.floor((H + 6) / (50 + 6))) : 6,
      per = rows * cols,
      pages = Math.max(1, Math.ceil(ids.length / per));
    D.itemPage = Math.max(0, Math.min(D.itemPage, pages - 1));
    L.style.setProperty('--dc', cols);
    L.innerHTML = '';
    ids.slice(D.itemPage * per, D.itemPage * per + per).forEach(id => {
      const it = ITEMS[id];
      const r = document.createElement('div');
      r.className = 'dvItem';
      const th = document.createElement('div');
      th.className = 'th';
      th.appendChild(drawIcon(id, 36));
      const t = document.createElement('div');
      t.className = 'tx';
      t.innerHTML =
        '<b>' +
        esc(it.name) +
        '</b><small>' +
        id +
        ' &middot; ' +
        esc(CATS[it.cat] || it.cat) +
        ' &middot; ' +
        it.vh[0] +
        'x' +
        it.vh[1] +
        (it.value
          ? ' &middot; ' +
            Object.entries(it.value)
              .map(e => e[0] + ' ' + e[1])
              .join(', ')
          : '') +
        '</small>';
      const b = document.createElement('button');
      b.textContent = 'Add';
      b.dataset.a = 'give';
      b.dataset.id = id;
      r.append(th, t, b);
      L.appendChild(r);
    });
    if (!ids.length) L.innerHTML = '<div class="m" style="padding:10px">No items match.</div>';
    $('dvIc').textContent = ids.length + ' of ' + ITEM_ORDER.length + ' items';
    const P = $('dvItemsPg');
    if (P)
      P.innerHTML =
        pages > 1
          ? '<button data-a="iPg" data-d="-1"' +
            (D.itemPage <= 0 ? ' disabled' : '') +
            '>&larr; Prev</button><span>Page ' +
            (D.itemPage + 1) +
            ' / ' +
            pages +
            '</span><button data-a="iPg" data-d="1"' +
            (D.itemPage >= pages - 1 ? ' disabled' : '') +
            '>Next &rarr;</button>'
          : '';
  }
  /* ---------- time / state ---------- */
  function setTime(h) {
    G.time = ((h % 24) + 24) % 24;
    msg('Time set to ' + clockStr());
    syncFields();
  }
  function setDay(d) {
    d = clampN(d, 1, 14, G.day || 1) | 0;
    G.day = d;
    msg('Day set to ' + d + (d >= 14 ? ' (siege flag NOT set - use Trigger Siege)' : ''));
    syncFields();
  }
  function showScreen(n) {
    if (!D.on) {
      msg('Enable Dev Mode first', false);
      return;
    }
    D.open = false;
    if (n === 'menu') {
      G.mode = 'TITLE';
      document.exitPointerLock();
      $('hud').classList.add('hide');
      ui('menu');
    } else if (n === 'options') {
      G.mode = 'TITLE';
      document.exitPointerLock();
      $('hud').classList.add('hide');
      openOptions('menu');
    } else if (n === 'sel') {
      G.mode = 'TITLE';
      document.exitPointerLock();
      $('hud').classList.add('hide');
      ui('sel');
    } else if (n === 'hq') {
      if (!G.day || G.day < 1 || !HQINV.items.length) initCampaign(D.w.fort);
      openHQ(false);
    } else if (n === 'inv') {
      if (!playing()) loadWh();
      else ui(null);
      setTimeout(() => {
        if (!invOpen) openInv();
      }, 60);
    } else if (n === 'cont') {
      if (!playing()) {
        msg('Load a world that has containers first', false);
        openPanel();
        return;
      }
      const c = nearestCont(8);
      if (!c) {
        openPanel();
        return;
      }
      ui(null);
      openContainer(c);
    } else if (n === 'pause') {
      ui('pz');
    }
  }

  /* ---------- overlays ---------- */
  const O = {
    root: null,
    m: {},
    zb: new Map(),
    pb: null,
    lastR: 0,
    reset() {
      this.root = null;
      this.m = {};
      this.zb = new Map();
      this.pb = null;
      this.lastR = 0;
    }
  };
  function oroot() {
    if (!O.root) {
      O.root = new THREE.Group();
      O.root.userData = {dev: 1};
      scene.add(O.root);
    }
    return O.root;
  }
  function setLayer(name, obj) {
    const r = oroot(),
      old = O.m[name];
    if (old) {
      r.remove(old);
      old.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) o.material.dispose();
      });
    }
    if (obj) {
      obj.traverse(o => {
        o.raycast = () => {};
      });
      r.add(obj);
      O.m[name] = obj;
    } else delete O.m[name];
  }
  function segs(a, c, op) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(a, 3));
    const l = new THREE.LineSegments(
      g,
      new THREE.LineBasicMaterial({color: c, transparent: true, opacity: op || 0.8, depthTest: false})
    );
    l.frustumCulled = false;
    l.renderOrder = 8;
    return l;
  }
  const EDG = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7]
  ];
  function boxEdges(b, a) {
    const n = b.min,
      m = b.max,
      v = [
        [n.x, n.y, n.z],
        [m.x, n.y, n.z],
        [m.x, n.y, m.z],
        [n.x, n.y, m.z],
        [n.x, m.y, n.z],
        [m.x, m.y, n.z],
        [m.x, m.y, m.z],
        [n.x, m.y, m.z]
      ];
    EDG.forEach(e => a.push(...v[e[0]], ...v[e[1]]));
  }
  function ring(a, x, y, z, r) {
    for (let i = 0; i < 24; i++) {
      const t0 = (i / 24) * TAU2,
        t1 = ((i + 1) / 24) * TAU2;
      a.push(x + Math.cos(t0) * r, y, z + Math.sin(t0) * r, x + Math.cos(t1) * r, y, z + Math.sin(t1) * r);
    }
  }
  function rectEdges(a, x0, x1, z0, z1, y0, y1) {
    boxEdges({min: {x: x0, y: y0, z: z0}, max: {x: x1, y: y1, z: z1}}, a);
  }
  function layer(name, on, build) {
    if (!on) {
      if (O.m[name]) setLayer(name, null);
      return;
    }
    setLayer(name, build());
  }
  function refreshLayers() {
    const s = D.s,
      p = pl.position,
      R = 45,
      near = b =>
        b &&
        isFinite(b.min.x) &&
        isFinite(b.max.x) &&
        b.max.x > p.x - R &&
        b.min.x < p.x + R &&
        b.max.z > p.z - R &&
        b.min.z < p.z + R;
    layer('coll', s.coll, () => {
      const a = [];
      let n = 0;
      for (const b of solids) {
        if (near(b)) {
          boxEdges(b, a);
          if (++n > 5000) break;
        }
      }
      return segs(a, 0x22d3ee, 0.55);
    });
    layer('walk', s.walk, () => {
      const a = [];
      let n = 0;
      for (const b of walkables) {
        if (near(b)) {
          boxEdges(b, a);
          if (++n > 3000) break;
        }
      }
      return segs(a, 0x22c55e, 0.6);
    });
    layer('bb', s.bBounds, () => {
      const a = [];
      buildings.forEach(b => rectEdges(a, b.x - b.w / 2, b.x + b.w / 2, b.z - b.d / 2, b.z + b.d / 2, 0.05, 6));
      const R2 = window.__fortZombieTown;
      if (D.w.kind === 'building' && D.w.info) {
        const P = fakePlot('', D.w.info.front);
        rectEdges(a, P.x0, P.x1, P.z0, P.z1, 0.1, 0.2);
      } else if (R2 && R2.layout && D.w.kind === 'map')
        R2.layout.plots.forEach(q => rectEdges(a, q.x0, q.x1, q.z0, q.z1, 0.1, 0.2));
      return segs(a, 0xfb923c, 0.8);
    });
    layer('spawns', s.spawns, () => {
      const a = [],
        pt = (x, z, h) => {
          a.push(x, 0, z, x, h || 6, z);
          ring(a, x, 0.1, z, 0.8);
        };
      if (D.w.spawn) pt(D.w.spawn[0], D.w.spawn[1]);
      if (D.w.kind === 'map') pt(TRUCK.x, TRUCK.z + 6);
      if (D.w.kind === 'building' && D.w.info) {
        pt(D.w.info.entrance[0], D.w.info.entrance[1], 4);
        pt(D.w.info.inside[0], D.w.info.inside[1], 4);
      }
      if (G.mode === 'SIEGE') {
        rectEdges(a, FORT.x - 25, FORT.x + 25, FORT.z + 35, FORT.z + 55, 0.1, 0.3);
        rectEdges(a, FORT.x - 40, FORT.x - 30, FORT.z - 10, FORT.z + 10, 0.1, 0.3);
        rectEdges(a, FORT.x + 30, FORT.x + 40, FORT.z - 10, FORT.z + 10, 0.1, 0.3);
      }
      return segs(a, 0x4ade80, 0.9);
    });
    layer('doorR', s.doorR, () => {
      const a = [],
        v = new THREE.Vector3();
      doors.forEach(d => {
        d.sol.getCenter(v);
        if (Math.hypot(v.x - p.x, v.z - p.z) < R) ring(a, v.x, 0.1, v.z, 3.5);
      });
      return segs(a, 0xf472b6, 0.8);
    });
    layer('lootR', s.lootR, () => {
      const a = [];
      lootConts().forEach(c => {
        if (dist2(c.x, c.z) < R) ring(a, c.x, 0.12, c.z, 3.5);
      });
      scene.children.forEach(o => {
        const c = o.userData && o.userData.cont;
        if (c && c.drop && dist2(o.position.x, o.position.z) < R) ring(a, o.position.x, 0.12, o.position.z, 3.5);
      });
      return segs(a, 0xfacc15, 0.8);
    });
    layer('labels', s.labels, () => {
      const g = new THREE.Group(),
        v = new THREE.Vector3();
      let n = 0;
      doors.forEach((d, i) => {
        d.sol.getCenter(v);
        if (n < 70 && Math.hypot(v.x - p.x, v.z - p.z) < 22) {
          label('door#' + i + (d.open ? ' open' : ''), '#f472b6', v.x, 2.9, v.z, 0.45, g);
          n++;
        }
      });
      lootConts().forEach(c => {
        if (n < 110 && dist2(c.x, c.z) < 22) {
          label(
            (c.dev && c.dev.name ? c.dev.name : c.table) + ' x' + c.inv.items.length,
            '#facc15',
            c.x,
            2.6,
            c.z,
            0.45,
            g
          );
          n++;
        }
      });
      buildings.forEach(b => {
        if (n < 140 && dist2(b.x, b.z) < 70) {
          label(
            (b.id || b.t) + (b.cond ? ' [' + b.cond + ']' : '') + (b.plot !== undefined ? ' #' + b.plot : ''),
            '#fb923c',
            b.x,
            8,
            b.z,
            0.9,
            g
          );
          n++;
        }
      });
      zombies.forEach(z => {
        if (n < 180 && dist2(z.position.x, z.position.z) < 22) {
          label(
            (z.userData.devKind || 'zombie') + ' #' + zid(z),
            '#ef4444',
            z.position.x,
            2.9 * z.scale.y,
            z.position.z,
            0.4,
            g
          );
          n++;
        }
      });
      return g;
    });
  }
  function frameLayers() {
    const s = D.s;
    if (s.hitP) {
      if (!O.pb) {
        O.pb = new THREE.Box3Helper(new THREE.Box3(), 0x38bdf8);
        O.pb.material.depthTest = false;
        O.pb.raycast = () => {};
        oroot().add(O.pb);
      }
      const p = pl.position,
        feet = p.y - (G.eyeUsed || 1.6),
        r = G.crouch ? 0.28 : 0.4;
      O.pb.box.min.set(p.x - r, feet + 0.4, p.z - r);
      O.pb.box.max.set(p.x + r, feet + 0.35 + (G.crouch ? 0.85 : 1.45), p.z + r);
      O.pb.visible = true;
    } else if (O.pb) O.pb.visible = false;
    if (s.hitZ) {
      const live = new Set();
      zombies.forEach(z => {
        if (dist2(z.position.x, z.position.z) > 45) return;
        live.add(z);
        let h = O.zb.get(z);
        if (!h) {
          h = new THREE.Box3Helper(new THREE.Box3(), 0xef4444);
          h.material.depthTest = false;
          h.raycast = () => {};
          oroot().add(h);
          O.zb.set(z, h);
        }
        const b = h.box;
        b.makeEmpty();
        z.traverse(o => {
          if (o.isMesh && o.visible) b.expandByObject(o);
        });
      });
      O.zb.forEach((h, z) => {
        if (!live.has(z)) {
          oroot().remove(h);
          h.geometry.dispose();
          h.material.dispose();
          O.zb.delete(z);
        }
      });
    } else if (O.zb.size) {
      O.zb.forEach(h => {
        oroot().remove(h);
        h.geometry.dispose();
        h.material.dispose();
      });
      O.zb.clear();
    }
  }

  /* ---------- diagnostics ---------- */
  let fpsAcc = [],
    lastT = 0,
    diagT = 0,
    layT = 0,
    sceneN = 0,
    sceneT = 0;
  function diagLines() {
    const p = pl.position,
      avg = fpsAcc.length ? fpsAcc.reduce((a, b) => a + b, 0) / fpsAcc.length : 0,
      g = D.w.gen;
    return [
      'FPS ' + (avg ? (1000 / avg).toFixed(0) : '-') + '  frame ' + avg.toFixed(1) + ' ms',
      'zombies ' + zombies.length + '  buildings ' + buildings.length + '  doors ' + doors.length,
      'scene objects ' + sceneN + '  solids ' + solids.length + '  walkables ' + walkables.length,
      'pos ' + p.x.toFixed(1) + ', ' + (p.y - 1.6).toFixed(1) + ', ' + p.z.toFixed(1),
      'seed ' +
        (D.w.kind === 'map' || D.w.kind === 'scenario'
          ? D.w.seed
          : D.w.kind === 'building' && D.w.bld
            ? D.w.bld.seed
            : '-') +
        '  world ' +
        (D.w.kind || 'none') +
        (D.w.mode ? ':' + D.w.mode : ''),
      'mode ' + G.mode + '  screen ' + scrNow,
      'map gen ' +
        (g ? g.ms + ' ms' : '-') +
        '  warnings ' +
        (g ? g.warnings.length : 0) +
        (D.s.noclip ? '  NOCLIP' : '')
    ];
  }
  function audit() {
    const r = [],
      dup = zombies.length - new Set(zombies).size;
    if (dup) r.push('FAIL duplicate zombie entries: ' + dup);
    else r.push('ok  no duplicate zombie entries');
    const orph = zombies.filter(z => z.parent !== scene).length;
    orph
      ? r.push('FAIL ' + orph + ' zombie(s) in the list are not in the scene')
      : r.push('ok  every listed zombie is in the scene');
    const od = doors.filter(d => !inScene(d.p)).length;
    od
      ? r.push('FAIL ' + od + ' door record(s) reference objects outside the scene (stale)')
      : r.push('ok  all ' + doors.length + ' doors are in the scene');
    const bs = solids.filter(b => !b || !isFinite(b.min.x) || !isFinite(b.max.x) || b.isEmpty()).length;
    bs
      ? r.push('WARN ' + bs + ' empty/invalid collision boxes')
      : r.push('ok  ' + solids.length + ' collision boxes all valid');
    const oc = scene.children.filter(o => o.userData && o.userData.kind === 'loot').length;
    r.push('info ' + oc + ' loot containers in scene, ' + lootConts().length + ' non-drop');
    const wl = winList.filter(w => w && w.p && !isFinite(w.p.x)).length;
    wl
      ? r.push('FAIL ' + wl + ' window records have invalid positions')
      : r.push('ok  window records valid (' + winList.length + ')');
    const grp = {};
    D.genHist.forEach(h => {
      const k = h.seed + '/' + h.fort;
      (grp[k] = grp[k] || []).push(h);
    });
    let mism = 0;
    for (const k in grp) {
      const l = grp[k];
      if (
        l.length > 1 &&
        l.some(
          h => h.objs !== l[0].objs || h.solids !== l[0].solids || h.zombies !== l[0].zombies || h.doors !== l[0].doors
        )
      ) {
        mism++;
        r.push(
          'FAIL seed/fort ' +
            k +
            ': regenerations of the same seed differ in object counts (stale objects or non-determinism)'
        );
      }
    }
    if (!mism)
      r.push('ok  regeneration history (' + D.genHist.length + ' builds): same-seed builds have identical counts');
    const lc = lootCheck();
    r.push(
      lc.length
        ? 'WARN ' + lc.length + ' registry problem(s):\n    ' + lc.join('\n    ')
        : 'ok  items, loot tables and catalogue loot references are consistent'
    );
    const R = window.__fortZombieTown;
    if (R && R.layoutErrors && R.layoutErrors.length) r.push('FAIL layout errors: ' + R.layoutErrors.join('; '));
    if (window.__catalogueErrors && window.__catalogueErrors.length)
      r.push('FAIL catalogue errors: ' + window.__catalogueErrors.join('; '));
    if (D.w.gen && D.w.gen.warnings.length)
      r.push(
        'WARN generation warnings (' +
          D.w.gen.warnings.length +
          '):\n    ' +
          D.w.gen.warnings.slice(0, 25).join('\n    ')
      );
    return r.join('\n');
  }
  function sig() {
    const R = window.__fortZombieTown || {};
    return hash32(
      [
        (R.plan || []).map(p => p.id + p.cond + p.front).join(','),
        buildings.map(b => b.id + ':' + b.x.toFixed(2) + ',' + b.z.toFixed(2)).join('|'),
        zombies
          .map(
            z =>
              z.userData.devKind ||
              '' +
                z.position.x.toFixed(2) +
                ',' +
                z.position.z.toFixed(2) +
                (z.userData.run ? 'r' : '') +
                (z.userData.big ? 'b' : '')
          )
          .join('|'),
        solids.length,
        doors.length,
        lootConts()
          .map(c => c.table + c.inv.items.map(q => q.id).join('.'))
          .join('|'),
        TRUCK.x.toFixed(3),
        scene.children.length
      ].join('#')
    );
  }
  function detTest() {
    if (!D.on) enable();
    const seed = D.w.kind === 'map' ? D.w.seed : parseSeed($('dvSeed').value),
      saved = D.w.kind;
    begin();
    let a,
      b,
      c,
      e = null;
    const mt = D.w.kind === 'map' ? D.w.mission || 'none' : ($('dvMis') && $('dvMis').value) || 'random';
    try {
      /* v085: the different seed builds first: the first build of a session also fills caches (textures, models) that use
         random numbers, so A and B are compared only once those exist, as they would be in any later mission */
      buildMapCore((seed + 1) >>> 0, mt);
      c = sig();
      buildMapCore(seed, mt);
      a = sig();
      buildMapCore(seed, mt);
      b = sig();
    } catch (x) {
      e = x;
    }
    const res = e
      ? 'Determinism test errored: ' + e.message
      : 'Determinism test (seed ' +
        seed +
        ', fort ' +
        D.w.fort +
        '): build A ' +
        a +
        ', build B ' +
        b +
        ', different seed ' +
        c +
        '\n' +
        (a === b
          ? 'PASS - same seed produced an identical map signature (plan, building positions, zombies, loot, collision count).'
          : 'FAIL - same seed produced different maps.') +
        (c === a ? '\nWARN different seed gave the same signature (seed may not be used).' : '');
    D.w.spawn = [pl.position.x, pl.position.z];
    refreshAll();
    out(res);
    msg(e ? res : a === b ? 'Determinism PASS' : 'Determinism FAIL', !e && a === b);
    return res;
  }
  function debugText() {
    const p = pl.position,
      I = D.w.info,
      L = [];
    L.push(
      'Fort Zombie Revision ' + REV + ' debug information',
      'Time: ' + new Date().toISOString(),
      'Dev Mode: ' + (D.on ? 'ON' : 'off'),
      'Game mode: ' +
        G.mode +
        '  screen: ' +
        scrNow +
        '  world: ' +
        (D.w.kind || 'none') +
        (D.w.mode ? ' (' + D.w.mode + ')' : ''),
      'Player: ' +
        p.x.toFixed(2) +
        ', ' +
        (p.y - (G.eyeUsed || 1.6)).toFixed(2) +
        ', ' +
        p.z.toFixed(2) +
        '  yaw ' +
        yaw.toFixed(2) +
        '  hp ' +
        Math.round(G.hp) +
        '/' +
        G.maxHp +
        '  st ' +
        Math.round(G.st),
      'Map seed: ' + (D.w.seed || '-') + '  fort setting: ' + D.w.fort,
      'Building: ' +
        (I && I.t
          ? I.t.id + ' [' + COND_NAMES[I.lv] + '] front ' + I.front + ' seed ' + (D.w.bld ? D.w.bld.seed : '-')
          : '-'),
      'Selected zombie: ' +
        (D.sel
          ? (D.sel.userData.devKind || 'zombie') + ' #' + zid(D.sel) + ' hp ' + Math.ceil(D.sel.userData.hp)
          : '-'),
      'Counts: zombies ' +
        zombies.length +
        ', buildings ' +
        buildings.length +
        ', doors ' +
        doors.length +
        ', solids ' +
        solids.length +
        ', scene objects ' +
        countScene(),
      'Generation: ' +
        (D.w.gen ? JSON.stringify(Object.assign({}, D.w.gen, {warnings: D.w.gen.warnings.length})) : '-'),
      'Dev settings: ' + JSON.stringify(D.s)
    );
    if (D.w.gen && D.w.gen.warnings.length) L.push('Warnings:', ...D.w.gen.warnings.slice(0, 30).map(x => '  - ' + x));
    L.push('Audit:', audit(), 'Registries:', syncReport(), 'Recent log:', ...LOGS.slice(-40));
    return L.join('\n');
  }
  function fbCopy(t) {
    try {
      const ta = document.createElement('textarea');
      ta.value = t;
      ta.style.cssText = 'position:fixed;left:-999px;top:0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch (e) {
      return false;
    }
  }
  function copyDebug() {
    const t = debugText();
    D.lastDebug = t;
    const ta = $('dvDebug');
    if (ta) ta.value = t;
    const done = ok =>
      msg(
        ok
          ? 'Debug information copied to the clipboard'
          : 'Clipboard unavailable - the text is shown below; select it and copy manually',
        ok
      );
    if (navigator.clipboard && navigator.clipboard.writeText)
      navigator.clipboard.writeText(t).then(
        () => done(true),
        () => done(fbCopy(t))
      );
    else done(fbCopy(t));
  }

  /* ---------- saved test scenarios ---------- */
  const SKEY = 'gf_dev_scenarios';
  function sLoad() {
    try {
      return JSON.parse(localStorage.getItem(SKEY) || '{}') || {};
    } catch (e) {
      return {};
    }
  }
  function sSave(o) {
    try {
      localStorage.setItem(SKEY, JSON.stringify(o));
      return true;
    } catch (e) {
      return false;
    }
  }
  function capture() {
    const p = pl.position;
    return {
      v: 1,
      rev: REV,
      w: {kind: D.w.kind, seed: D.w.seed, fort: D.w.fort, mode: D.w.mode, bld: D.w.bld, mission: D.w.mission || 'none'},
      player: {
        x: p.x,
        y: p.y - 1.6,
        z: p.z,
        yaw,
        pitch,
        hp: G.hp,
        maxHp: G.maxHp,
        st: G.st,
        eq: PINV.items.indexOf(G.eq)
      },
      time: {day: G.day, time: G.time},
      settings: Object.assign({}, D.s),
      inv: PINV.items.map(q => ({id: q.id, x: q.x, y: q.y, rot: q.rot, rem: q.rem, clip: q.clip})),
      zombies: zombies
        .filter(z => z.userData.devTest)
        .map(z => ({kind: z.userData.devKind, x: z.position.x, z: z.position.z, hp: z.userData.hp})),
      containers: lootConts()
        .filter(c => c.dev && (c.dev.wh || c.dev.spawned))
        .map(c => ({x: c.x, z: c.z, table: c.table, name: c.dev.name, wh: !!c.dev.wh, ids: contIds(c)})),
      recorded:
        'world kind/seed/fort, building selection, player position+stats+weapons, PINV items, dev-spawned zombies, warehouse + dev-spawned containers, time/day, dev settings. NOT recorded: map-generated zombies/containers individual state, doors, barricades, survivors.'
    };
  }
  function sApply(s) {
    if (!s || s.v !== 1) {
      msg('Not a valid scenario', false);
      return;
    }
    if (!D.on) enable();
    D.w.fort = s.w.fort || 'police';
    $('dvFort').value = D.w.fort;
    const w = s.w;
    if (w.kind === 'map') loadMap(w.seed, w.mission || 'none');
    else if (w.kind === 'building' && w.bld)
      loadBld(w.bld.id != null ? w.bld.id : w.bld.idx, w.bld.lv, w.bld.front, w.bld.seed);
    else if (TW[w.kind]) TW[w.kind]();
    else if (w.kind === 'warehouse') loadWh();
    else if (w.kind === 'scenario') scenario(w.mode);
    else {
      msg('Scenario has no world to recreate', false);
      return;
    }
    if (!playing()) {
      msg('World did not start', false);
      return;
    }
    Object.assign(D.s, DF, s.settings || {});
    const p = s.player;
    pl.position.set(p.x, p.y + 1.6, p.z);
    yaw = p.yaw;
    pitch = p.pitch;
    pl.rotation.y = yaw;
    camera.rotation.x = pitch;
    G.hp = p.hp;
    G.maxHp = p.maxHp;
    G.st = p.st;
    G.day = s.time.day;
    G.time = s.time.time;
    clearInv(PINV);
    s.inv.forEach(r => {
      const q = newInst(r.id);
      if (q) {
        q.rem = r.rem;
        if (r.clip !== undefined) q.clip = r.clip;
        if (invFits(PINV, q, r.x, r.y, r.rot)) invPut(PINV, q, r.x, r.y, r.rot);
        else invAdd(PINV, q);
      }
    });
    G.eq = (p.eq >= 0 && PINV.items[p.eq]) || null;
    lootConts().forEach(c => {
      const r = s.containers.find(k => k.wh && c.dev && c.dev.wh && k.name === c.dev.name);
      if (r) fillIds(c, r.ids);
    });
    s.containers
      .filter(k => !k.wh)
      .forEach(k => {
        const c = spawnContainer(k.x, k.z, k.table, 0);
        c.dev = {cols: c.pieces.map(m => m.material.color.getHex()), name: k.name, spawned: true};
        fillIds(c, k.ids);
        c.dev.init = k.ids.slice();
      });
    s.zombies.forEach(r => {
      const q = spawnOne(zKnown(r.kind) ? r.kind : 'random', r.x, r.z);
      if (q) {
        q.userData.devTest = true;
        q.userData.devKind = r.kind;
        if (q.userData.sleep) wakeZ(q);
        zid(q);
        baseOf(q);
        q.userData.hp = r.hp;
      }
    });
    syncBadge();
    refreshAll();
    msg(
      'Scenario loaded (' +
        s.zombies.length +
        ' zombies, ' +
        s.inv.length +
        ' inventory items, ' +
        s.containers.length +
        ' containers)'
    );
  }
  function renderScen() {
    const L = $('dvScen');
    if (!L) return;
    const all = sLoad(),
      n = Object.keys(all);
    L.innerHTML = n.length
      ? n
          .map(
            k =>
              '<div class="icoRow"><b style="flex:1">' +
              esc(k) +
              '</b><span class="m">' +
              esc(all[k].w.kind) +
              ' ' +
              (all[k].w.seed || '') +
              '</span><button data-a="scLoad" data-n="' +
              esc(k) +
              '">Load</button><button data-a="scExp" data-n="' +
              esc(k) +
              '">Export</button><button data-a="scDel" data-n="' +
              esc(k) +
              '">Delete</button></div>'
          )
          .join('')
      : '<span class="m">No saved scenarios.</span>';
  }

  /* ---------- wrappers around existing game functions ---------- */
  const _uz = updateZombies;
  updateZombies = function (dt) {
    if (!D.on) return _uz(dt);
    const s = D.s;
    if (s.pause || s.zFreeze) {
      zombies.forEach(z => zHpTag(z, false));
      return;
    }
    /* v076: test-world dummies stand still (they still take hits; a knocked-down or rising one is left to the normal update) */
    let dum = null;
    if (D.w.dummy) {
      dum = [];
      zombies = zombies.filter(z => {
        const u = z.userData;
        if (u.dummy && u.kind === 'zombie' && !(u.ragT > 0 || u.flop > 0 || u.rise > 0 || u.vs)) {
          dum.push(z);
          return false;
        }
        return true;
      });
      dum.forEach(z => {
        const u = z.userData;
        u.see = false;
        u.hunt = 0;
        u.aimG = null;
        u.lt = 0;
        try {
          animZ(z, dt, false);
        } catch (e) {}
        zHpTag(z, false);
      });
    }
    if (s.zBeh === 'aggressive') {
      zombies.forEach(z => {
        const u = z.userData;
        if (u.sleep) wakeZ(z);
        u.see = true;
        u.hunt = 8;
        u.lx = pl.position.x;
        u.lz = pl.position.z;
        u.ly = pl.position.y - (G.eyeUsed || 1.6); // v081
        u.was = 1;
        u.lk = 0;
        u.lt = 1;
      });
    }
    let held = null;
    if (s.zBeh === 'passive') {
      held = zombies.slice();
      zombies = [];
      held.forEach(z => {
        const u = z.userData;
        if (u.sleep || u.rise > 0 || u.ragT > 0 || u.flop > 0 || u.vs) return;
        u.see = false;
        idle(z, dt);
        animZ(z, dt, false);
        zHpTag(z, false);
      });
    }
    let sp = null;
    if (s.zBeh === 'stationary') {
      sp = zombies.map(z => [z, z.userData.sp]);
      sp.forEach(a => (a[0].userData.sp = 0));
    }
    try {
      _uz(dt);
    } finally {
      if (sp)
        sp.forEach(a => {
          if (a[0].userData) a[0].userData.sp = a[1];
        });
    }
    if (dum) zombies = dum.filter(z => z.userData.kind === 'zombie' && !zombies.includes(z)).concat(zombies);
    if (held) {
      const alive = new Set(held);
      zombies = zombies.concat(held.filter(z => !zombies.includes(z) && z.userData.kind === 'zombie'));
    }
    if (s.zInv)
      zombies.forEach(z => {
        const b = baseOf(z);
        if (z.userData.hp < b.hpMax) z.userData.hp = b.hpMax;
      });
  };
  const _kz = killZ;
  killZ = function (z) {
    if (D.on && D.s.zInv && !D.force && z && z.userData.kind === 'zombie') {
      z.userData.hp = baseOf(z).hpMax;
      return;
    }
    return _kz(z);
  };
  const _dis = dismember;
  dismember = function (z, part, fx, fz) {
    if (D.on && D.s.zInv && !D.force) return false;
    return _dis(z, part, fx, fz);
  };
  const _zh = zHpTag;
  zHpTag = function (z, h) {
    if (D.on && (D.s.hpAll || (D.s.hpSel && D.sel === z)) && z.userData.kind === 'zombie' && !z.userData.sleep) {
      const u = z.userData;
      let s = u.hpTag;
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
        s.material.map = numTex(String(v), D.sel === z ? '#38bdf8' : '#ffe066');
        s.material.needsUpdate = true;
      }
      const k = Math.max(1, Math.min(2.4, dist2(z.position.x, z.position.z) / 12)) / z.scale.x;
      s.scale.set(k, 0.375 * k, 1);
      s.visible = true;
      return;
    }
    return _zh(z, h);
  };
  const _dm = damage;
  damage = function (a) {
    if (!D.on) return _dm(a);
    if (D.s.pInv) return;
    if (G.mode === 'DEV') {
      G.hp = Math.max(0, G.hp - a);
      try {
        S.hurt();
      } catch (e) {}
      $('dv').style.opacity = 1;
      setTimeout(() => ($('dv').style.opacity = 0), 300);
      if (G.hp <= 0) {
        G.hp = G.maxHp;
        G.st = 100;
        if (D.w.spawn) {
          const f = D.w.spawn;
          pl.position.set(f[0], 1.6 + groundAt(f[0], f[1], 0.35), f[1]);
        }
        toast('[DEV] You died - respawned at the safe spawn');
      }
      return;
    }
    return _dm(a);
  };
  const _at = advanceTime;
  advanceTime = function (h) {
    if (D.on && h < 0.02 && (D.s.pause || (G.mode === 'DEV' && !D.s.timeRun))) return;
    return _at(h);
  };
  const _uc = updComps;
  updComps = function (dt) {
    if (D.on && D.s.pause) return;
    return _uc(dt);
  };
  const _jp = jump;
  jump = function (dt) {
    if (D.on && D.s.noclip) return;
    return _jp(dt);
  };
  const _sp = showPause;
  showPause = function () {
    if (D.on && (D.opening || G.mode === 'DEV')) {
      D.opening = false;
      openPanel();
      return;
    }
    return _sp();
  };
  const _an = animate;
  animate = function () {
    let keys = null;
    const now = performance.now(),
      dt = Math.min(0.1, Math.max(0, (now - lastT) / 1000));
    lastT = now;
    if (D.on && dt > 0) {
      fpsAcc.push(dt * 1000);
      if (fpsAcc.length > 40) fpsAcc.shift();
      if (D.s.noclip && playing() && !invOpen && locked && !wheel) {
        const sp = D.s.fly * (K.ShiftLeft ? 2.2 : 1) * dt,
          fx = -Math.sin(yaw),
          fz = -Math.cos(yaw),
          c = Math.cos(pitch),
          f = (K.KeyW ? 1 : 0) - (K.KeyS ? 1 : 0),
          r = (K.KeyD ? 1 : 0) - (K.KeyA ? 1 : 0),
          u = (K.Space ? 1 : 0) - (K.KeyQ ? 1 : 0);
        pl.position.x += (fx * c * f + Math.cos(yaw) * r) * sp;
        pl.position.z += (fz * c * f - Math.sin(yaw) * r) * sp;
        pl.position.y += (Math.sin(pitch) * f + u) * sp;
        G.vy = 0;
        G.crouch = false;
        G.eyeH = G.eyeUsed = 1.6;
        keys = {W: K.KeyW, A: K.KeyA, S: K.KeyS, D: K.KeyD, Sp: K.Space};
        K.KeyW = K.KeyA = K.KeyS = K.KeyD = K.Space = false;
      }
    }
    _an();
    if (keys) {
      K.KeyW = keys.W;
      K.KeyA = keys.A;
      K.KeyS = keys.S;
      K.KeyD = keys.D;
      K.Space = keys.Sp;
    }
    if (D.on) post(dt);
    else diagOnly(dt);
  };
  /* v076: F8 toggles the diagnostic HUD + coordinates in normal play too (no Dev Mode needed; F8 does nothing in the browser). Remembered. */
  try {
    D.diagG = localStorage.getItem('mfz_diagF8') === '1';
  } catch (e) {
    D.diagG = false;
  }
  addEventListener(
    'keydown',
    e => {
      if (e.code !== 'F8' || e.repeat) return;
      e.preventDefault();
      D.diagG = !D.diagG;
      try {
        localStorage.setItem('mfz_diagF8', D.diagG ? '1' : '0');
      } catch (_) {}
      if (!D.diagG && !D.on) {
        const el = $('devDiag');
        if (el) el.style.display = 'none';
      }
    },
    true
  );
  let diagOT = 0;
  function diagOnly(dt) {
    if (!D.diagG) return;
    if (dt > 0) {
      fpsAcc.push(dt * 1000);
      if (fpsAcc.length > 40) fpsAcc.shift();
    }
    sceneT -= dt;
    if (sceneT <= 0) {
      sceneT = 1;
      sceneN = countScene();
    }
    diagOT -= dt;
    if (diagOT <= 0) {
      diagOT = 0.25;
      const el = $('devDiag');
      if (el) {
        el.style.display = 'block';
        el.textContent = diagLines().join('\n');
      }
    }
  }
  function post(dt) {
    const s = D.s;
    if (s.infSt) G.st = 100;
    if (G.mode === 'DEV' && playing()) {
      $('day').textContent = 'DEV: ' + (D.w.kind || 'lab').toUpperCase();
      $('obj').textContent =
        D.w.kind === 'building' && D.w.info
          ? D.w.info.t.name + ' [' + COND_NAMES[D.w.info.lv] + ']  -  ` opens the toolkit'
          : '` opens the Dev Toolkit';
    }
    if (playing() && !invOpen) {
      layT -= dt;
      if (layT <= 0) {
        layT = 0.4;
        refreshLayers();
      }
      frameLayers();
    }
    sceneT -= dt;
    if (sceneT <= 0 && (s.diag || D.open)) {
      sceneT = 1;
      sceneN = countScene();
    }
    diagT -= dt;
    if (diagT <= 0) {
      diagT = 0.25;
      const e = $('devDiag');
      if (e) {
        const on = (s.diag && D.on) || D.diagG;
        e.style.display = on ? 'block' : 'none';
        if (on) e.textContent = diagLines().join('\n');
      }
      syncBadge();
      if (D.open) {
        if (D.tab === 'diag' && D.sub.diag === 'live') $('dvLive').textContent = diagLines().join('\n');
        syncFields();
      }
    }
  }

  /* ---------- UI (v070 rebuild) ----------
   Right-hand drawer: category rail + sub-pages, one tool group per page, nothing scrolls. Styling lives in css/ui.css (#dev).
   Panels added by other modules (skills.js, survivors.js, devlineup.js) append to the two hidden inboxes [data-p="state"] and
   [data-p="zomb"]; DEV.adopt() moves each into its own page (anything unknown lands on a "More" page, so nothing is lost). */
  const NAV = [
    [
      'world',
      'World',
      [
        ['gen', 'Map'],
        ['tp', 'Teleport'],
        ['scen', 'Scenarios']
      ]
    ],
    [
      'bld',
      'Building',
      [
        ['insp', 'Inspector'],
        ['test', 'Test worlds']
      ]
    ],
    [
      'items',
      'Items',
      [
        ['browse', 'Item browser'],
        ['wh', 'Warehouse'],
        ['loot', 'Loot & containers']
      ]
    ],
    [
      'zomb',
      'Zombies',
      [
        ['spawn', 'Spawn & AI'],
        ['sel', 'Selected'],
        ['medic', 'Medics'],
        ['models', 'Model line-up']
      ]
    ],
    [
      'player',
      'Player',
      [
        ['vit', 'Vitals & kit'],
        ['skills', 'Skills'],
        ['occ', 'Occupation'],
        ['surv', 'Survivors']
      ]
    ],
    [
      'time',
      'Time & Weather',
      [
        ['clock', 'Clock & campaign'],
        ['wx', 'Weather']
      ]
    ],
    ['vis', 'Overlays', [['ov', 'Debug overlays']]],
    [
      'diag',
      'Diagnostics',
      [
        ['live', 'Live & audit'],
        ['debug', 'Debug report'],
        ['saved', 'Saved tests'],
        ['fz', 'FZ data'],
        ['log', 'Log']
      ]
    ]
  ];
  D.sub = {};
  NAV.forEach(n => (D.sub[n[0]] = n[2][0][0]));
  D.itemPage = 0;
  const bt = (a, t, x) => '<button data-a="' + a + '"' + (x ? ' ' + x : '') + '>' + t + '</button>',
    ck = (k, t) => '<label class="dvl"><input type="checkbox" data-k="' + k + '"> ' + t + '</label>';
  const opt = (l, f) => l.map(f).join(''),
    card = (t, h, x) =>
      '<div class="dvCard' + (x ? ' ' + x : '') + '">' + (t ? '<h5>' + t + '</h5>' : '') + h + '</div>',
    row = h => '<div class="dvRow">' + h + '</div>',
    fl = (l, c) => '<label class="dvF"><span>' + l + '</span>' + c + '</label>',
    note = t => '<div class="dvNote">' + t + '</div>';
  const WXL = [
    ['auto', 'Auto (by day)'],
    ['clear', 'Clear'],
    ['overcast', 'Overcast'],
    ['fog', 'Fog'],
    ['rain', 'Storm'],
    ['snow', 'Snow'],
    ['dust', 'Sandstorm'],
    ['doom', 'Doom']
  ];
  function pageHTML() {
    /* v085: every list (buildings, loot tables, zombie types, forts, item categories, mission types) is filled by liveSelects()
       from the game's registries each time the panel opens. This file loads before most of the game, so nothing is read here. */
    const seg = (k, l) =>
        '<div class="dvSeg" data-wk="' +
        k +
        '">' +
        l.map(x => bt('wx', x[1], 'data-k="' + k + '" data-v="' + x[0] + '"')).join('') +
        '</div>';
    const P = {
      'world/gen':
        card(
          'Generate a town',
          row(
            fl('Seed', '<input type="text" id="dvSeed" placeholder="blank = random" style="width:150px">') +
              fl('Fort setting', '<select id="dvFort"></select>') +
              fl('Mission', '<select id="dvMis"></select>')
          ) +
            row(
              bt('mapRandom', 'Random map', 'class="priBtn"') +
                bt('mapSeed', 'Seed from field') +
                bt('mapRegen', 'New seed') +
                bt('mapSame', 'Same seed again')
            ) +
            note(
              'Random map launches a real mission, exactly as clicking a pin on the town map does (only the drive and the clock advance are skipped): same mission-type weights, same town generator, mission site, loot, survivors, zombies and weather. The seed covers all of it, so the same seed + fort + mission gives the same map. "None" is a free-roam expedition with no pinned mission.'
            )
        ) + card('Last build', '<div id="dvGen" class="dvInfo"></div>', 'grow'),
      'world/tp':
        card(
          'Quick teleport',
          row(
            bt('tpTruck', 'Truck') +
              bt('tpFort', 'Fort') +
              bt('tpCenter', 'Map centre') +
              bt('tpSpawn', 'Safe spawn') +
              bt('tpRefresh', 'Refresh lists')
          )
        ) +
        card(
          'Go to',
          row('<select id="dvTpB"></select>' + bt('tpB', 'Building')) +
            row('<select id="dvTpZ"></select>' + bt('tpZ', 'Zombie')) +
            row('<select id="dvTpC"></select>' + bt('tpC', 'Container'))
        ) +
        card(
          'Movement',
          row(
            ck('noclip', 'Noclip / fly') +
              fl('Fly speed', '<input type="number" id="dvFly" value="12" style="width:70px">')
          ) + note('Fly with WASD, Space up, Q down, Shift for speed. Turning noclip off settles you onto safe ground.')
        ),
      'world/scen':
        card(
          'Test worlds',
          row(bt('wMap', 'Random town map') + bt('wLab', 'Item warehouse') + bt('wBld', 'Building inspector'))
        ) +
        card(
          'Campaign scenarios',
          row(
            [
              'CLEAR:Day 1 fort clear',
              'EXPEDITION:Expedition (skip drive)',
              'FORT_BUILD:Fort building',
              'SIEGE:Trigger siege now'
            ]
              .map(x => bt('sc_' + x.split(':')[0], x.split(':')[1]))
              .join('')
          ) +
            note(
              'These run the real game code on the sandbox campaign. Your actual campaign is restored when you leave Dev Mode.'
            )
        ) +
        card(
          'Jump to a screen',
          row(
            [
              'menu:Main menu',
              'options:Options',
              'sel:Fort selection',
              'hq:Fort HQ',
              'inv:Player inventory',
              'cont:Nearest container',
              'pause:Pause screen'
            ]
              .map(x => bt('scr_' + x.split(':')[0], x.split(':')[1]))
              .join('')
          )
        ),
      'bld/test': card(
        'Test worlds',
        row(
          bt('twProps', 'All props', 'class="priBtn"') +
            bt('twModels', 'All models') +
            bt('twSurv', 'All survivors') +
            bt('twZomb', 'All zombies')
        ) +
          row(bt('twAI', 'AI test areas (wall / window / door / upstairs)')) +
          row(bt('twTog', 'AI on / off') + bt('wpns', 'Give all weapons + ammo')) +
          row(bt('nfDbg', 'Floor nav overlay (stairs, upper floors, window drops)')) +
          note(
            'Each world is laid out from the game\'s own registries every time it loads, sized to fit, one labelled slot per model, so anything new (props, prefabs, vehicles, weapons, trees, survivors, zombie styles and outfits) shows up by itself and nothing overlaps. Props are lootable. Zombies are live (shoot, hit, dismember, kill) but their AI is off until you press AI on / off.'
          )
      ),
      'bld/insp':
        card(
          'Building',
          row('<select id="dvBld" style="flex:1;min-width:0"></select>') +
            row(
              fl(
                'Condition',
                '<select id="dvCond">' +
                  opt(COND_NAMES, (c, i) => '<option value="' + i + '">' + c + '</option>') +
                  '</select>'
              ) +
                fl('Front', '<select id="dvFront"><option>south</option><option>north</option></select>') +
                fl('Seed', '<input type="text" id="dvBSeed" value="1" style="width:90px">')
            ) +
            row(
              bt('bLoad', 'Load', 'class="priBtn"') +
                bt('bPrev', '&larr; Previous') +
                bt('bNext', 'Next &rarr;') +
                bt('bReset', 'Reload')
            ) +
            row(
              bt('bExt', 'Go to entrance') +
                bt('bInt', 'Go inside') +
                bt('bSpawn', 'Safe spawn') +
                bt('bAll', 'Check every building')
            ) +
            row(
              ck('bBounds', 'Plot bounds') +
                ck('doorR', 'Door ranges') +
                ck('coll', 'Collision') +
                ck('noclip', 'Noclip')
            ) +
            note(
              'Lists exactly the buildings the town generator places in a mission (the town catalogue), built the way a town plot builds them. New buildings appear here by themselves.'
            )
        ) + card('Report', '<div id="dvBInfo" class="dvInfo"></div>', 'grow'),
      'items/browse':
        card(
          '',
          row(
            '<input type="text" id="dvQ" placeholder="Search name or id" style="flex:1;min-width:120px"><select id="dvCat"></select>' +
              fl('Qty', '<input type="number" id="dvQty" value="1" min="1" max="500" style="width:64px">')
          ) +
            row(
              ck('unlimited', 'Overflow into a crate when full') +
                '<span id="dvIc" class="m" style="margin-left:auto"></span>'
            )
        ) +
        '<div id="dvItems"></div><div id="dvItemsPg" class="pager"></div>' +
        row(
          bt('invOpen', 'Open player inventory') + bt('invClear', 'Clear inventory') + bt('wpns', 'Give weapons + ammo')
        ),
      'items/wh':
        card(
          'Item warehouse',
          row(bt('whLoad', 'Load warehouse', 'class="priBtn"')) +
            note(
              'One container per item category holding every item in it, labelled in the world. Walk up and press E to open.'
            )
        ) +
        card(
          'Restock',
          row(
            bt('whRefill', 'Refill all') +
              bt('whReset', 'Reset all') +
              bt('whRefillN', 'Refill nearest') +
              bt('whResetN', 'Reset nearest')
          ) + note('Refill only adds what is missing. Reset restores each container to its original contents.')
        ),
      'items/loot':
        card(
          'Containers',
          row(
            fl('Loot table', '<select id="dvTbl"></select>') +
              fl('Rolls', '<input type="number" id="dvRolls" value="3" style="width:64px">')
          ) +
            row(
              bt('cSpawn', 'Spawn near me', 'class="priBtn"') +
                bt('cInspect', 'Inspect nearest') +
                bt('cRefill', 'Add loot to nearest') +
                bt('cReset', 'Reset nearest') +
                bt('cOpen', 'Open nearest') +
                bt('cSample', 'Sample table x1000')
            ) +
            row(
              '<input type="text" id="dvKnown" placeholder="Known contents: id, id, id" style="flex:1;min-width:0">' +
                bt('cKnown', 'Set nearest')
            )
        ) + card('Result', '<pre id="dvOut" class="dvOut">Results appear here.</pre>', 'grow'),
      'zomb/spawn':
        card(
          'Spawn',
          row(
            fl('Type', '<select id="dvZk" style="max-width:240px"></select>') +
              fl('Count', '<input type="number" id="dvZn" value="5" min="1" max="100" style="width:64px">') +
              bt('zSpawn', 'Spawn', 'class="priBtn"')
          ) +
            row(bt('zRemT', 'Remove test zombies') + bt('zRemA', 'Remove all') + bt('zKillA', 'Kill all')) +
            note(
              'Every zombie style the game can spawn is listed (read live from the FZ style table). Each one is spawned through the game\'s own zombie(), so the model, outfit, size, HP, speed, abilities and weapons are exactly what a mission gives it. "Random mix" uses the in-game style weights.'
            )
        ) +
        card(
          'Behaviour',
          row(
            ck('zFreeze', 'Freeze AI') +
              ck('zInv', 'Invulnerable') +
              fl(
                'AI mode',
                '<select id="dvBeh" data-k="zBeh"><option>normal</option><option>passive</option><option>aggressive</option><option>stationary</option></select>'
              )
          )
        ) +
        card(
          'Stat multipliers',
          row(
            fl('HP x', '<input type="number" id="dvHpM" value="1" step="0.1" style="width:70px">') +
              fl('Damage x', '<input type="number" id="dvDmgM" value="1" step="0.1" style="width:70px">') +
              fl('Speed x', '<input type="number" id="dvSpM" value="1" step="0.1" style="width:70px">')
          ) + row(bt('zApply', 'Apply to all') + bt('zReset', 'Reset zombies to normal'))
        ) +
        card('Labels', row(ck('hpAll', 'HP over every zombie') + ck('hpSel', 'HP over the selected one'))),
      'zomb/sel': card(
        'Selected zombie',
        row('<select id="dvZs" style="flex:1;min-width:0"></select>') +
          row(bt('zSel', 'Select') + bt('zTp', 'Teleport to') + bt('zKill', 'Kill') + bt('zRem', 'Remove')) +
          note('Tip: press ` while looking at a zombie to select it. The list shows the 60 nearest.')
      ),
      'player/vit':
        card(
          'Vitals',
          row(
            fl('Health', '<input type="number" id="dvHp" value="100" style="width:70px">') +
              bt('pHp', 'Set') +
              fl('Stamina', '<input type="number" id="dvSt" value="100" style="width:70px">') +
              bt('pSt', 'Set')
          ) +
            row(bt('pRestore', 'Restore health + stamina') + bt('pSafe', 'Back to safe position')) +
            row(ck('pInv', 'Invulnerable') + ck('infSt', 'Infinite stamina'))
        ) +
        card(
          'Kit',
          row(bt('wpns', 'Give weapons + ammo') + bt('invOpen', 'Open inventory') + bt('invClear', 'Clear inventory')) +
            note('Weapons are added smallest first until the 16x16 grid is full.')
        ),
      'time/clock':
        card(
          'Clock',
          row(
            fl('Day', '<input type="number" id="dvDay" value="1" min="1" max="14" style="width:64px">') +
              bt('setDay', 'Set day') +
              fl('Time (h)', '<input type="number" id="dvTime" value="8" step="0.5" style="width:70px">') +
              bt('setTime', 'Set time')
          ) +
            row(
              bt('t6', 'Dawn') +
                bt('t12', 'Noon') +
                bt('t19', 'Dusk') +
                bt('t23', 'Night') +
                ck('timeRun', 'Clock runs in lab worlds')
            )
        ) +
        card(
          'Sandbox campaign',
          '<div id="dvCamp" class="dvInfo"></div>' + row(bt('freshCamp', 'Start a fresh Day-1 campaign'))
        ) +
        note(
          'Lighting follows the clock. Setting Day 14 does not start the siege by itself; use Scenarios &rarr; Trigger siege.'
        ),
      'time/wx':
        card('Weather', seg('weather', WXL)) +
        card(
          'Siege weather (Day 14)',
          seg('siegeWx', [
            ['doom', 'Doom'],
            ['same', 'Same as other days'],
            ['off', 'Plain']
          ])
        ) +
        card(
          'Weather particles',
          seg('particles', [
            [0, 'Off'],
            [1, 'Low'],
            [2, 'Medium'],
            [3, 'High']
          ])
        ) +
        card(
          'Lightning',
          seg('lightning', [
            [1, 'On'],
            [0, 'Off']
          ])
        ) +
        note(
          'These are the real game settings (Options &rarr; Graphics) and are saved. Auto picks a different sky for each day of the campaign.'
        ),
      'vis/ov': card(
        'Overlays',
        '<div class="dvGrid2">' +
          [
            ['hpAll', 'Zombie HP labels'],
            ['hitP', 'Player hitbox'],
            ['hitZ', 'Zombie hitboxes'],
            ['coll', 'Collision geometry (45 m)'],
            ['walk', 'Walkable surfaces'],
            ['bBounds', 'Building / plot bounds'],
            ['spawns', 'Spawn points'],
            ['doorR', 'Door range (3.5 m)'],
            ['lootR', 'Loot range (3.5 m)'],
            ['labels', 'Labels + internal IDs'],
            ['diag', 'Diagnostic HUD + coordinates (F8)']
          ]
            .map(x => ck(x[0], x[1]))
            .join('') +
          '</div>' +
          note('Overlays are separate debug objects. They never change real collision data and ignore raycasts.')
      ),
      'diag/live':
        card('Live metrics', '<pre id="dvLive" class="dvOut"></pre>') +
        card(
          'Checks',
          row(
            bt('audit', 'Run audit') +
              bt('det', 'Determinism test') +
              bt('lootChk', 'Validate registries') +
              bt('syncRep', 'Registry sync report') +
              bt('dResetAll', 'Reset all dev settings', 'class="warnBtn"')
          )
        ) +
        card('Report', '<pre id="dvAudit" class="dvOut">Run a check to see its report.</pre>', 'grow'),
      'diag/debug':
        card(
          'Debug report',
          row(bt('copy', 'Copy debug information', 'class="priBtn"')) +
            note(
              'Everything useful for a bug report: mode, world, seed, player, counts, warnings, audit and the recent log.'
            )
        ) + card('', '<textarea id="dvDebug" readonly placeholder="The debug text appears here"></textarea>', 'grow'),
      'diag/saved':
        card(
          'Save the current test',
          row(
            '<input type="text" id="dvScName" placeholder="Scenario name" style="flex:1;min-width:0">' +
              bt('scSave', 'Save', 'class="priBtn"') +
              bt('scImp', 'Import JSON')
          ) +
            '<textarea id="dvScJson" rows="2" placeholder="Export / import JSON"></textarea>' +
            note(
              'Records world kind/seed/fort, building, player position/stats/inventory, dev-spawned zombies and containers, time and dev settings.'
            )
        ) + card('Saved', '<div id="dvScen" class="dvOut"></div>', 'grow'),
      'diag/log':
        card(
          '',
          row(
            bt('logCopy', 'Copy log') +
              bt('logClear', 'Clear log') +
              '<span class="m">Errors, warnings and every tool result are recorded here.</span>'
          )
        ) + '<pre id="dvLog" class="dvOut grow"></pre>'
    };
    return P;
  }
  function buildUI() {
    const el = document.createElement('div');
    el.id = 'dev';
    el.className = 'hide';
    const P = pageHTML();
    el.innerHTML =
      '<header class="dvHead"><div><div class="kicker">Revision ' +
      REV +
      '</div><div class="dvTitle">Developer Toolkit</div></div>' +
      '<label class="dvMaster"><input type="checkbox" id="dvMaster"> Dev Mode</label></header>' +
      '<div class="dvBar">' +
      bt('resume', 'Return to game', 'class="priBtn"') +
      bt('pauseSim', 'Pause simulation', 'id="dvPauseB"') +
      bt('reset', 'Reset test world') +
      bt('openOpt', 'Options') +
      bt('logGo', 'Log (0)', 'id="dvLogB"') +
      bt('menu', 'Leave Dev Mode', 'class="warnBtn"') +
      '</div>' +
      '<div id="dvMsg">Load a test world from World, Building or Items. Press ` in a test world to open this panel; click the world to resume.</div>' +
      '<div class="dvBody"><nav class="dvRail">' +
      NAV.map(n => '<button data-a="tab" data-t="' + n[0] + '">' + n[1] + '</button>').join('') +
      '</nav>' +
      '<div class="dvMain"><div class="dvSubs"></div><fieldset id="dvFs" class="dvPages">' +
      NAV.map(n =>
        n[2]
          .map(s => {
            const k = n[0] + '/' + s[0];
            return (
              '<section class="dvPage hide" data-pg="' +
              k +
              '"' +
              (k === 'diag/log' ? ' id="dvLogW"' : '') +
              '>' +
              (P[k] || '') +
              '</section>'
            );
          })
          .join('')
      ).join('') +
      '</fieldset></div></div>' +
      '<div class="dvInbox hide" data-p="state"></div><div class="dvInbox hide" data-p="zomb"></div>';
    document.body.appendChild(el);
    const b = document.createElement('div');
    b.id = 'devBadge';
    document.body.appendChild(b);
    const dg = document.createElement('div');
    dg.id = 'devDiag';
    document.body.appendChild(dg);
    ['keydown', 'keyup'].forEach(t => el.addEventListener(t, e => e.stopPropagation()));
    el.addEventListener('click', onClick);
    el.addEventListener('change', onChange);
    el.addEventListener('input', e => {
      if (e.target.id === 'dvQ') {
        D.itemPage = 0;
        renderItems();
      }
    });
    el.addEventListener(
      'wheel',
      e => {
        const L = $('dvItems');
        if (L && L.contains(e.target)) {
          const p = $('dvItemsPg').querySelectorAll('button');
          if (p.length) {
            e.preventDefault();
            (e.deltaY > 0 ? p[1] : p[0]).click();
          }
        }
      },
      {passive: false}
    );
  }
  const ADOPT = [
    [e => e.id === 'devSk', 'player/skills'],
    [e => /occupation/i.test(h4t(e)), 'player/occ'],
    [e => /survivor models/i.test(h4t(e)), 'player/surv'],
    [e => e.id === 'devFz', 'diag/fz'],
    [e => /fz zombie/i.test(h4t(e)), 'zomb/spawn'], // v085: the FZ tuning panel sits under Spawn & AI (its style list is the Type list)
    [e => e.id === 'devMedic', 'zomb/medic'],
    [e => /zombie models/i.test(h4t(e)), 'zomb/models']
  ];
  function h4t(e) {
    const h = e.querySelector('h4');
    return h ? h.textContent : '';
  }
  D.adopt = function () {
    let n = 0;
    document.querySelectorAll('#dev .dvInbox').forEach(ib => {
      const cat = ib.dataset.p === 'zomb' ? 'zomb' : 'player';
      [...ib.children].forEach(c => {
        const hit = ADOPT.find(a => a[0](c));
        let key = hit ? hit[1] : cat + '/more';
        let pg = document.querySelector('#dev [data-pg="' + key + '"]');
        if (!pg) {
          const N = NAV.find(x => x[0] === cat);
          N[2].push(['more', 'More']);
          pg = document.createElement('section');
          pg.className = 'dvPage hide';
          pg.dataset.pg = key;
          $('dvFs').appendChild(pg);
        }
        c.classList.add('adopt');
        pg.appendChild(c);
        n++;
      });
    });
    if (n) {
      log('info', 'adopted ' + n + ' module panel(s) into Dev Toolkit pages');
      if (D.open) refreshAll();
    }
  };
  D.fit = function () {
    if (D.open && D.tab === 'items' && D.sub.items === 'browse') renderItems();
  };
  function syncBadge() {
    const b = $('devBadge');
    if (!b) return;
    b.style.display = D.on ? 'block' : 'none';
    if (D.on)
      b.textContent =
        'DEV MODE' +
        (D.w.kind ? ' · ' + D.w.kind.toUpperCase() : '') +
        (D.s.noclip ? ' · NOCLIP' : '') +
        (D.s.pInv ? ' · GOD' : '') +
        (D.s.pause ? ' · SIM PAUSED' : '') +
        (D.s.zFreeze ? ' · AI FROZEN' : '');
  }
  function fillSel(id, html) {
    const e = $(id);
    if (!e) return;
    const v = e.value;
    e.innerHTML = html;
    if ([...e.options].some(o => o.value === v)) e.value = v;
  }
  /* v085: every drop-down is rebuilt from the game's registries (only when its contents changed, keeping the selection) */
  const LS = {};
  function liveSel(id, html) {
    if (LS[id] === html && $(id) && $(id).options.length) return;
    LS[id] = html;
    fillSel(id, html);
  }
  function liveSelects() {
    const o = (v, t) => '<option value="' + esc(v) + '">' + esc(t) + '</option>',
      grp = (t, h) => (h ? '<optgroup label="' + esc(t) + '">' + h + '</optgroup>' : '');
    const B = REG.buildings(),
      bo = (pool, t) =>
        grp(
          t + ' (' + B.filter(d => d.pool === pool).length + ')',
          B.filter(d => d.pool === pool)
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .map(d => o(d.id, d.name + '  [' + d.id + ']'))
            .join('')
        );
    liveSel('dvBld', bo('big', 'Full-block lots') + bo('half', 'Half-plot lots'));
    liveSel('dvTbl', REG.lootTables().map(k => o(k, k)).join(''));
    liveSel('dvFort', Object.keys(FORTS).map(k => o(k, FORTS[k].n)).join(''));
    liveSel('dvCat', o('', 'All categories') + Object.keys(CATS).map(k => o(k, CATS[k])).join(''));
    const M = REG.missions();
    liveSel(
      'dvMis',
      o('random', 'Random (map-screen weights)') +
        M.map(k => o(k, (MZ.TYPES[k] && MZ.TYPES[k].full) || k)).join('') +
        o('none', 'None (free roam)')
    );
    const ST = REG.fzOn() ? REG.zStyles().slice().sort() : [];
    liveSel(
      'dvZk',
      ST.length
        ? o('random', 'Random mix (as in game)') +
            grp(
              'FZ styles (' + ST.length + ')',
              ST.map(k => o(k, k + (REG.outfitOf(k) ? '' : '  (plain body)'))).join('')
            )
        : grp('Zombie types (FZ styles off)', Object.keys(ZT).map(k => o(k, k)).join(''))
    );
  }
  D.liveSelects = liveSelects;
  function setVal(id, v) {
    const e = $(id);
    if (e && document.activeElement !== e) e.value = v;
  }
  function syncFields() {
    setVal('dvDay', G.day || 1);
    setVal('dvTime', (+G.time || 0).toFixed(1));
    setVal('dvHp', Math.round(G.hp));
    setVal('dvSt', Math.round(G.st));
    setVal('dvHpM', D.s.hpM);
    setVal('dvDmgM', D.s.dmgM);
    setVal('dvSpM', D.s.spM);
    setVal('dvFort', D.w.fort);
    setVal('dvFly', D.s.fly);
    const c = $('dvCamp');
    if (c)
      c.innerHTML = !D.on
        ? '<span class="m">Dev Mode is off.</span>'
        : (D.fresh ? '<b>Fresh campaign</b> created by Dev Mode' : '<b>Copy of your campaign</b>') +
          ' &middot; ' +
          esc(FORTS[G.fort] ? FORTS[G.fort].n : G.fort) +
          ' &middot; Day ' +
          (G.day || 0) +
          ' ' +
          (typeof clockStr === 'function' ? clockStr() : '') +
          ' &middot; HP ' +
          Math.round(G.hp) +
          '/' +
          G.maxHp +
          ' &middot; ' +
          PINV.items.length +
          ' items carried &middot; ' +
          (G.surv ? G.surv.length : 0) +
          ' survivors';
    if (window.RGFX)
      document
        .querySelectorAll('#dev .dvSeg button')
        .forEach(b => b.classList.toggle('on', String(RGFX.s[b.dataset.k]) === b.dataset.v));
  }
  function showPages() {
    const N = NAV.find(n => n[0] === D.tab) || NAV[0];
    D.tab = N[0];
    const sub = D.sub[N[0]] || N[2][0][0],
      key = N[0] + '/' + sub;
    document.querySelectorAll('#dev .dvRail button').forEach(b => b.classList.toggle('on', b.dataset.t === D.tab));
    const S = document.querySelector('#dev .dvSubs');
    S.innerHTML = N[2]
      .map(
        s =>
          '<button data-a="sub" data-s="' + s[0] + '"' + (s[0] === sub ? ' class="on"' : '') + '>' + s[1] + '</button>'
      )
      .join('');
    document.querySelectorAll('#dev .dvPage').forEach(p => p.classList.toggle('hide', p.dataset.pg !== key));
    if (key === 'diag/log') {
      const e = $('dvLog');
      e.textContent = LOGS.join('\n');
      e.scrollTop = e.scrollHeight;
    }
  }
  function refreshAll() {
    const m = $('dvMaster');
    if (!m) return;
    m.checked = D.on;
    $('dvFs').disabled = false;
    liveSelects();
    document.querySelectorAll('#dev [data-k]').forEach(e => {
      const k = e.dataset.k;
      if (!(k in D.s)) return;
      if (e.type === 'checkbox') e.checked = !!D.s[k];
      else e.value = D.s[k];
    });
    showPages();
    $('dvPauseB').textContent = D.s.pause ? 'Resume simulation' : 'Pause simulation';
    syncFields();
    const g = D.w.gen,
      W = g ? g.warnings.length : 0;
    $('dvGen').innerHTML = g
      ? '<div class="kv"><span>World</span><b>' +
        esc(g.kind) +
        '</b><span>Seed</span><b>' +
        g.seed +
        '</b><span>Fort</span><b>' +
        (g.fort || '-') +
        (g.mission
          ? '</b><span>Mission</span><b>' + esc(g.mission) + (g.site ? ' &middot; site: ' + esc(g.site) : '')
          : '') +
        '</b><span>Build time</span><b>' +
        (g.ms ? g.ms + ' ms' : '-') +
        '</b>' +
        '<span>Buildings</span><b>' +
        g.buildings +
        (g.plots !== undefined ? ' / ' + g.plots + ' plots' : '') +
        '</b><span>Zombies</span><b>' +
        g.zombies +
        '</b><span>Containers</span><b>' +
        g.containers +
        '</b><span>Doors</span><b>' +
        g.doors +
        '</b><span>Windows</span><b>' +
        g.windows +
        '</b><span>Collision boxes</span><b>' +
        g.solids +
        '</b><span>Scene objects</span><b>' +
        g.sceneObjs +
        '</b></div>' +
        (g.err ? '<div class="r">ERROR: ' + esc(g.err) + '</div>' : '') +
        (W
          ? '<div class="warn">' +
            W +
            ' warning(s):</div><div class="m small">' +
            g.warnings.slice(0, 5).map(esc).join('<br>') +
            (W > 5 ? '<br>+' + (W - 5) + ' more (Diagnostics &rarr; Debug report)' : '') +
            '</div>'
          : '<div class="g">No placement failures or warnings.</div>')
      : '<span class="m">No world generated yet.</span>';
    const I = D.w.info;
    $('dvBInfo').innerHTML =
      (I && I.t
        ? '<div class="kv"><span>Building</span><b>' +
          esc(I.t.name) +
          ' (' +
          I.t.id +
          ')</b><span>Category</span><b>' +
          I.t.category +
          '</b><span>Builder</span><b>' +
          I.t.builder +
          '</b><span>Loot table</span><b>' +
          I.t.loot +
          '</b><span>In towns</span><b>' +
          (I.t.pool === 'half' ? 'half plot' : 'full block') +
          ', ' +
          (I.t.min ? 'at least ' + I.t.min + ', ' : '') +
          'up to ' +
          (I.t.max || 2) +
          ' per town' +
          '</b><span>Built by</span><b>' +
          esc((I.t.build && I.t.build.name) || '?') +
          '</b><span>Condition</span><b>' +
          COND_NAMES[I.lv] +
          ', front ' +
          I.front +
          '</b>' +
          '<span>Doors / containers / zombies</span><b>' +
          doors.length +
          ' / ' +
          lootConts().length +
          ' / ' +
          zombies.length +
          '</b><span>Entrance</span><b>' +
          I.entrance.map(v => v.toFixed(1)).join(', ') +
          '</b><span>Interior</span><b>' +
          I.inside.map(v => v.toFixed(1)).join(', ') +
          '</b></div>' +
          (I.errors.length
            ? '<div class="warn">Placement problems:</div><div class="m small">' +
              I.errors.slice(0, 5).map(esc).join('<br>') +
              '</div>'
            : '<div class="g">Placement check OK: geometry inside the plot, front faces the frontage.</div>')
        : '<span class="m">No building loaded.</span>') +
      (D.lastCheck ? '<pre class="dvOut" style="max-height:260px;overflow:auto">' + esc(D.lastCheck) + '</pre>' : '');
    fillSel(
      'dvTpB',
      buildings
        .map(
          (b, i) =>
            '<option value="' +
            i +
            '">' +
            esc((b.id || b.t) + (b.cond ? ' [' + b.cond + ']' : '')) +
            ' (' +
            b.x.toFixed(0) +
            ',' +
            b.z.toFixed(0) +
            ')</option>'
        )
        .join('') || '<option value="">(no buildings)</option>'
    );
    const zl = zombieList();
    fillSel(
      'dvTpZ',
      zl
        .map(
          z =>
            '<option value="' +
            zid(z) +
            '">' +
            (z.userData.devKind || z.userData.fzs || 'zombie') +
            ' #' +
            zid(z) +
            ' · hp ' +
            Math.ceil(z.userData.hp) +
            ' · ' +
            dist2(z.position.x, z.position.z).toFixed(0) +
            ' m</option>'
        )
        .join('') || '<option value="">(no zombies)</option>'
    );
    fillSel('dvZs', $('dvTpZ').innerHTML);
    const lc = lootConts();
    fillSel(
      'dvTpC',
      lc
        .slice()
        .sort((a, b) => dist2(a.x, a.z) - dist2(b.x, b.z))
        .slice(0, 60)
        .map(
          c =>
            '<option value="' +
            lc.indexOf(c) +
            '">' +
            esc((c.dev && c.dev.name) || c.table) +
            ' x' +
            c.inv.items.length +
            ' · ' +
            dist2(c.x, c.z).toFixed(0) +
            ' m</option>'
        )
        .join('') || '<option value="">(no containers)</option>'
    );
    if (D.sel && $('dvZs')) $('dvZs').value = String(zid(D.sel));
    renderItems();
    renderScen();
    syncBadge();
  }
  function openPanel() {
    D.open = true;
    D.opening = false;
    try {
      D.adopt();
    } catch (e) {}
    ui('dev');
    refreshAll();
  }
  function closePanel() {
    D.open = false;
    if (playing()) {
      lock();
      return;
    }
    if (scrNow === 'dev' && G.mode === 'TITLE') openOptions('menu');
    else ui(null);
  }
  function zByVal(id) {
    return zombies.find(z => zid(z) === Number(id));
  }
  function onChange(e) {
    const t = e.target;
    if (t.id === 'dvMaster') {
      if (t.checked) {
        enable();
        refreshAll();
      } else if (confirm('Leave Dev Mode? The test world is discarded and the campaign snapshot is restored.'))
        disable();
      else t.checked = true;
      return;
    }
    if (t.id === 'dvFort') {
      D.w.fort = t.value;
      const nm = FORTS[t.value].n;
      if (D.on && D.fresh) {
        freshCampaign(t.value);
        msg('Fresh Day-1 campaign re-created at ' + nm + ' (health and starting kit reset)');
      } else
        msg(
          'Fort setting ' +
            nm +
            ' is used by the next generated map' +
            (D.on
              ? '. Your campaign copy keeps its own fort; use Time & Weather > Start a fresh Day-1 campaign to switch fully.'
              : '')
        );
      refreshAll();
      return;
    }
    if (t.id === 'dvFly') {
      D.s.fly = clampN(t.value, 1, 200, 12);
      return;
    }
    if (t.id === 'dvCat') {
      D.itemPage = 0;
      renderItems();
      return;
    }
    const k = t.dataset && t.dataset.k;
    if (!k) return;
    D.s[k] = t.type === 'checkbox' ? t.checked : t.value;
    if (k === 'noclip') {
      if (!t.checked && playing()) settle();
      msg('Noclip ' + (t.checked ? 'ON - collision ignored' : 'OFF - player settled onto safe ground'));
    }
    if (
      k === 'zBeh' ||
      k === 'zFreeze' ||
      k === 'zInv' ||
      k === 'pInv' ||
      k === 'infSt' ||
      k === 'pause' ||
      k === 'timeRun'
    )
      msg(k + ' = ' + D.s[k]);
    layT = 0;
    refreshAll();
  }
  function bId() {
    liveSelects();
    return $('dvBld').value || (REG.buildings()[0] || {}).id;
  }
  function bStep(k) {
    const cur = bId(),
      L = [...$('dvBld').options].map(o => o.value), // the order shown in the list
      i = Math.max(0, L.indexOf(cur));
    return L[(i + k + L.length) % L.length];
  }
  function bLoad(i) {
    const s = parseSeed($('dvBSeed').value);
    $('dvBSeed').value = String(s);
    loadBld(i, Number($('dvCond').value) || 0, $('dvFront').value, s);
  }
  const ACT = {
    logGo: () => {
      D.tab = 'diag';
      D.sub.diag = 'log';
      refreshAll();
    },
    sub: b => {
      D.sub[D.tab] = b.dataset.s;
      showPages();
      syncFields();
      if (D.tab === 'items') renderItems();
    },
    iPg: b => {
      D.itemPage += Number(b.dataset.d) || 0;
      renderItems();
    },
    wx: b => {
      if (!window.RGFX) return msg('Graphics settings module is not loaded', false);
      const k = b.dataset.k,
        v = typeof RGFX.def[k] === 'number' ? Number(b.dataset.v) : b.dataset.v;
      RGFX.set(k, v);
      syncFields();
      msg(k + ' set to ' + b.textContent + ' (saved, same as Options > Graphics)');
    },
    freshCamp: () => {
      if (
        !confirm(
          'Start a fresh Day-1 campaign at ' +
            FORTS[D.w.fort].n +
            ' inside the sandbox? Inventory, survivors and progress in the sandbox are reset. Your real campaign is untouched.'
        )
      )
        return;
      freshCampaign(D.w.fort);
      refreshAll();
      msg('Fresh Day-1 campaign at ' + FORTS[G.fort].n + ' (same state as New Game)');
    },
    logClear: () => {
      LOGS.length = 0;
      log('info', 'log cleared');
    },
    logCopy: () => {
      const t = LOGS.join('\n');
      $('dvLog').textContent = t;
      const ok =
        navigator.clipboard && navigator.clipboard.writeText
          ? navigator.clipboard.writeText(t).then(
              () => msg('Log copied'),
              () => msg('Clipboard blocked - select the log text and copy it manually', false)
            )
          : msg(fbCopy(t) ? 'Log copied' : 'Clipboard unavailable - select the log text manually', fbCopy(t));
    },
    resume: () => closePanel(),
    reset: resetEnv,
    menu: () => {
      if (
        confirm('Leave Dev Mode and return to the main menu? The test world is discarded and campaign state restored.')
      )
        disable();
    },
    openOpt: () => {
      if (typeof openOptions === 'function') openOptions('dev');
    },
    pauseSim: () => {
      D.s.pause = !D.s.pause;
      msg('Simulation ' + (D.s.pause ? 'paused (zombies, survivors and clock)' : 'resumed'));
      refreshAll();
    },
    tab: b => {
      D.tab = b.dataset.t;
      refreshAll();
    },
    mapRandom: () => loadMap(parseSeed('')),
    mapSeed: () => loadMap(parseSeed($('dvSeed').value)),
    mapRegen: () => loadMap(parseSeed('')),
    mapSame: () => {
      if (D.w.kind !== 'map' && !D.w.seed) return msg('No map generated yet', false);
      loadMap(D.w.seed, $('dvMis').value === 'random' ? D.w.mission || 'none' : undefined);
    },
    tpTruck: () => {
      if (!worldOK()) return;
      if (G.mode === 'EXPEDITION') tp(TRUCK.x, TRUCK.z + 6, 0, 'truck');
      else msg('This world has no truck', false);
    },
    tpFort: () => {
      if (!worldOK()) return;
      if (G.mode === 'DEV' || G.mode === 'EXPEDITION')
        return msg('The fort only exists in the fort scenarios (World > Scenarios)', false);
      tp(FORT.x, FORT.z + 5, 0, 'fort');
    },
    tpCenter: () => {
      if (!worldOK()) return;
      const R = window.__fortZombieTown;
      tp(
        R && R.layout && D.w.kind === 'map' ? (R.layout.bounds.x0 + R.layout.bounds.x1) / 2 : (BND[0] + BND[1]) / 2,
        R && R.layout && D.w.kind === 'map' ? (R.layout.bounds.z0 + R.layout.bounds.z1) / 2 : (BND[2] + BND[3]) / 2,
        0,
        'map centre'
      );
    },
    tpSpawn: () => {
      if (!worldOK()) return;
      if (!D.w.spawn) return msg('No safe spawn recorded', false);
      tp(D.w.spawn[0], D.w.spawn[1], 0, 'safe spawn');
    },
    tpRefresh: () => {
      refreshAll();
      msg('Lists refreshed');
    },
    tpB: () => {
      if (!worldOK()) return;
      const b = buildings[Number($('dvTpB').value)];
      if (!b) return msg('No such building', false);
      tp(b.x, b.z + b.d / 2 + 3, 0, 'building ' + (b.id || b.t));
    },
    tpZ: () => {
      if (!worldOK()) return;
      const z = zByVal($('dvTpZ').value);
      if (!z) return msg('Zombie no longer exists', false);
      tp(z.position.x, z.position.z + 2, z.position.y, 'zombie');
    },
    tpC: () => {
      if (!worldOK()) return;
      const c = lootConts()[Number($('dvTpC').value)];
      if (!c) return msg('Container no longer exists', false);
      tp(c.x, c.z + 2, 0, 'container');
    },
    twProps: twProps,
    twModels: twModels,
    twSurv: twSurvivors,
    twZomb: twZombies,
    twAI: twAI,
    twTog: twToggleAI,
    /* v081: show / hide the multi-storey nav (js/layers/zfloors.js): floor nodes coloured by height, window drops in red */
    nfDbg: () => {
      if (!window.navFloorsDebug) return msg('Floor nav not loaded', false);
      const st = navFloorsDebug();
      msg(
        NAVF.dbg
          ? 'Floor nav: ' + st.nodes + ' floor nodes, ' + st.drops + ' window drops (built in ' + st.ms + ' ms)'
          : 'Floor nav overlay off'
      );
    },
    bLoad: () => bLoad(bId()),
    bPrev: () => bLoad(bStep(-1)),
    bNext: () => bLoad(bStep(1)),
    bReset: () => {
      const b = D.w.bld;
      if (!b) return msg('No building loaded', false);
      loadBld(b.id, b.lv, b.front, b.seed);
    },
    bAll: () => {
      if (confirm('Build every building in the town catalogue in all ' + COND_NAMES.length + ' conditions and report problems? This takes a little while.'))
        checkAllBuildings();
    },
    bExt: () => {
      const I = D.w.info;
      if (!I || !worldOK()) return;
      tp(I.entrance[0], I.entrance[1], 0, 'entrance (exterior)');
    },
    bInt: () => {
      const I = D.w.info;
      if (!I || !worldOK()) return;
      tp(I.inside[0], I.inside[1], 0, 'interior');
    },
    bSpawn: () => ACT.tpSpawn(),
    whLoad: loadWh,
    whRefill: () => {
      let n = 0;
      lootConts().forEach(c => {
        if (c.dev && c.dev.wh) {
          const have = new Set(contIds(c));
          c.dev.ids.forEach(id => {
            if (!have.has(id)) {
              const q = newInst(id);
              if (invAdd(c.inv, q)) n++;
            }
          });
          recolor(c);
        }
      });
      msg('Refill added ' + n + ' missing item(s) to warehouse containers');
    },
    whReset: () => {
      let n = 0;
      lootConts().forEach(c => {
        if (c.dev && c.dev.wh) {
          fillIds(c, c.dev.ids);
          n++;
        }
      });
      n ? msg('Reset ' + n + ' warehouse containers to full contents') : msg('Load the warehouse first', false);
    },
    whRefillN: () => {
      const c = nearestCont();
      if (!c) return;
      if (c.dev && c.dev.ids) {
        const have = new Set(contIds(c));
        c.dev.ids.forEach(id => {
          if (!have.has(id)) invAdd(c.inv, newInst(id));
        });
        recolor(c);
      } else {
        rollLoot(c.table, ri(1, 3)).forEach(id => invAdd(c.inv, newInst(id)));
        recolor(c);
      }
      msg('Refilled nearest container');
    },
    whResetN: () => ACT.cReset(),
    give: b => giveItem(b.dataset.id, Number($('dvQty').value) || 1),
    invOpen: () => {
      if (!worldOK()) return;
      showScreen('inv');
    },
    invClear: () => {
      if (confirm('Clear the player test inventory?')) {
        clearInv(PINV);
        msg('Player inventory cleared');
      }
    },
    wpns: () => {
      let n = 0;
      const ids = ITEM_ORDER.filter(id => ITEMS[id].cat === 'ammo').concat(
        ITEM_ORDER.filter(id => WDEF[id]).sort(
          (a, b) => ITEMS[a].size[0] * ITEMS[a].size[1] - ITEMS[b].size[0] * ITEMS[b].size[1]
        )
      );
      ids.forEach(id => {
        if (addItem(id)) n++;
      });
      msg('Gave ' + n + ' of ' + ids.length + ' weapon/ammo items (inventory is 16x16)');
    },
    cSpawn: () => {
      spawnContainerNear($('dvTbl').value, Math.max(0, Number($('dvRolls').value) | 0));
      refreshAll();
    },
    cInspect: () => {
      const c = nearestCont();
      if (c) out(describeCont(c));
    },
    cRefill: () => {
      const c = nearestCont();
      if (!c) return;
      initOf(c);
      const bad = [];
      rollLoot(c.table, Math.max(1, Number($('dvRolls').value) | 0)).forEach(id => {
        if (!invAdd(c.inv, newInst(id))) bad.push(id);
      });
      recolor(c);
      out(describeCont(c));
      msg('Added loot from table ' + c.table + (bad.length ? ' (' + bad.length + ' did not fit)' : ''));
    },
    cReset: () => {
      const c = nearestCont();
      if (!c) return;
      if (!c.dev || !c.dev.init)
        return msg('This container has no recorded initial contents (dev tools have not modified it yet)', false);
      const bad = fillIds(c, c.dev.init);
      out(describeCont(c));
      msg('Container reset to its initial contents' + (bad.length ? ' (' + bad.length + ' failed)' : ''));
    },
    cOpen: () => showScreen('cont'),
    cKnown: () => {
      const c = nearestCont();
      if (!c) return;
      const ids = $('dvKnown')
          .value.split(/[\s,]+/)
          .filter(Boolean),
        bad = ids.filter(id => !ITEMS[id]);
      if (bad.length) return msg('Unknown item id(s): ' + bad.join(', '), false);
      initOf(c);
      const f = fillIds(c, ids);
      out(describeCont(c));
      msg('Container set to ' + ids.length + ' known item(s)' + (f.length ? ' (' + f.length + ' did not fit)' : ''));
    },
    cSample: () => {
      out(lootSample($('dvTbl').value, 1000));
      msg('Sampled loot table ' + $('dvTbl').value);
    },
    zSpawn: () => spawnZ($('dvZk').value, Math.max(1, Math.min(100, Number($('dvZn').value) | 0 || 1))),
    zRemT: () =>
      removeZ(
        zombies.filter(z => z.userData.devTest),
        'test zombie(s)'
      ),
    zRemA: () => {
      if (zombies.length && confirm('Remove all ' + zombies.length + ' zombies from the world?'))
        removeZ(zombies.slice(), 'zombie(s)');
    },
    zKillA: () => killZs(zombies),
    zApply: applyAllStats,
    zReset: resetStats,
    zSel: () => {
      const z = zByVal($('dvZs').value);
      if (!z) return msg('Zombie no longer exists', false);
      D.sel = z;
      msg('Selected ' + (z.userData.devKind || 'zombie') + ' #' + zid(z));
    },
    zTp: () => {
      if (!worldOK()) return;
      const z = zByVal($('dvZs').value);
      if (!z) return msg('Zombie no longer exists', false);
      D.sel = z;
      tp(z.position.x, z.position.z + 2, z.position.y, 'zombie');
    },
    zKill: () => {
      if (!D.sel || !zombies.includes(D.sel)) return msg('No selected zombie', false);
      killZs([D.sel]);
    },
    zRem: () => {
      if (!D.sel || !zombies.includes(D.sel)) return msg('No selected zombie', false);
      removeZ([D.sel], 'selected zombie');
    },
    pHp: () => {
      G.hp = clampN($('dvHp').value, 1, G.maxHp, G.hp);
      msg('Health set to ' + G.hp);
    },
    pSt: () => {
      G.st = clampN($('dvSt').value, 0, 100, G.st);
      msg('Stamina set to ' + G.st);
    },
    pRestore: () => {
      G.hp = G.maxHp;
      G.st = 100;
      msg('Health and stamina restored');
    },
    pSafe: () => {
      if (!worldOK()) return;
      if (D.w.spawn) tp(D.w.spawn[0], D.w.spawn[1], 0, 'safe spawn');
      else {
        settle();
        msg('Settled onto safe ground');
      }
    },
    wMap: () => loadMap(parseSeed($('dvSeed').value)),
    wLab: loadWh,
    wBld: () => bLoad(bId()),
    setDay: () => setDay($('dvDay').value),
    setTime: () => setTime(Number($('dvTime').value) || 0),
    t6: () => setTime(6),
    t12: () => setTime(12),
    t19: () => setTime(19),
    t23: () => setTime(23),
    audit: () => {
      const e = $('dvAudit');
      e.classList.remove('hide');
      e.textContent = audit();
      msg('Audit finished (see report)');
    },
    det: () => {
      const e = $('dvAudit');
      e.classList.remove('hide');
      e.textContent = detTest();
    },
    lootChk: () => {
      const r = lootCheck(),
        e = $('dvAudit');
      e.classList.remove('hide');
      e.textContent = r.length
        ? r.join('\n')
        : 'OK: all loot tables, catalogue loot references and item definitions are valid';
      msg(r.length ? r.length + ' registry problem(s)' : 'registries valid', !r.length);
    },
    syncRep: () => {
      const e = $('dvAudit');
      e.classList.remove('hide');
      e.textContent = syncReport();
      msg('Registry sync report ready (Diagnostics > Live & audit)');
    },
    copy: copyDebug,
    dResetAll: () => {
      if (D.s.noclip && playing()) settle();
      D.s = Object.assign({}, DF);
      zombies.forEach(z => {
        const b = baseOf(z),
          u = z.userData;
        u.hp = b.hp0;
        u.sp = b.sp0;
        u.dmg = b.dmg0;
        b.hpMax = b.hp0;
      });
      if (D.base) {
        G.hp = D.base.hp;
        G.maxHp = D.base.maxHp;
        G.st = D.base.st;
      }
      layT = 0;
      refreshAll();
      msg('All developer settings and test modifications reset to defaults');
    },
    scSave: () => {
      const n = ($('dvScName').value || '').trim();
      if (!n) return msg('Enter a scenario name', false);
      if (!playing() || !D.w.kind) return msg('Load a test world first', false);
      const a = sLoad();
      a[n] = capture();
      sSave(a)
        ? msg('Scenario "' + n + '" saved (separate storage key ' + SKEY + ')')
        : msg('Could not write localStorage', false);
      renderScen();
    },
    scLoad: b => {
      const s = sLoad()[b.dataset.n];
      s ? sApply(s) : msg('Scenario not found', false);
    },
    scExp: b => {
      const s = sLoad()[b.dataset.n];
      if (s) {
        $('dvScJson').value = JSON.stringify(s);
        msg('Scenario JSON placed in the box');
      }
    },
    scDel: b => {
      if (!confirm('Delete scenario "' + b.dataset.n + '"?')) return;
      const a = sLoad();
      delete a[b.dataset.n];
      sSave(a);
      renderScen();
      msg('Scenario deleted');
    },
    scImp: () => {
      try {
        const s = JSON.parse($('dvScJson').value);
        const n = ($('dvScName').value || 'imported').trim();
        const a = sLoad();
        a[n] = s;
        sSave(a);
        renderScen();
        msg('Imported as "' + n + '"');
      } catch (e) {
        msg('Invalid JSON: ' + e.message, false);
      }
    }
  };
  ['menu', 'options', 'sel', 'hq', 'inv', 'cont', 'pause'].forEach(n => (ACT['scr_' + n] = () => showScreen(n)));
  ['CLEAR', 'EXPEDITION', 'FORT_BUILD', 'SIEGE'].forEach(
    m =>
      (ACT['sc_' + m] = () => {
        if (m === 'SIEGE' && !confirm('Start the siege now? (runs in the dev sandbox)')) return;
        scenario(m);
      })
  );
  function onClick(e) {
    const b = e.target.closest('[data-a]');
    if (!b || b.disabled) return;
    const f = ACT[b.dataset.a];
    if (!f) {
      log('ERROR', 'no handler for action ' + b.dataset.a);
      return;
    }
    log('click', b.dataset.a);
    try {
      if (!D.on && !/^(tab|sub|wx|iPg|log.*)$/.test(b.dataset.a)) enable();
      f(b);
    } catch (err) {
      log('EXCEPTION', b.dataset.a + ': ' + (err.stack || err.message).split('\n').slice(0, 4).join(' | '));
      msg(b.dataset.a + ' failed: ' + err.message + ' (see Log)', false);
    }
  }

  /* ---------- entry points ---------- */
  window.devOpen = function () {
    try {
      S.ui();
    } catch (e) {
      log('ERROR', 'S.ui ' + e.message);
    }
    try {
      if (!D.on) enable();
      openPanel();
    } catch (e) {
      log('EXCEPTION', 'devOpen: ' + (e.stack || e.message));
    }
  };
  addEventListener(
    'keydown',
    e => {
      if (e.code !== 'Backquote' || !D.on) return;
      const t = e.target && e.target.tagName;
      if (t === 'INPUT' || t === 'TEXTAREA' || t === 'SELECT') return;
      e.preventDefault();
      e.stopPropagation();
      if (D.open) {
        closePanel();
        return;
      }
      if (playing() && !invOpen) {
        try {
          const h = look(false);
          if (h && h.o && h.o.userData && h.o.userData.kind === 'zombie') D.sel = h.o;
        } catch (x) {}
        D.opening = true;
        document.exitPointerLock();
        setTimeout(() => {
          if (D.opening) {
            D.opening = false;
            if (!D.open) openPanel();
          }
        }, 150);
      } else if (scrNow === 'menu' || scrNow === 'opt') openPanel();
    },
    true
  );
  buildUI();
})();
