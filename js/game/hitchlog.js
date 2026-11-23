/* MINI FORT ZOMBIE - v094: hitch recorder and frame profiler (diagnostics only: it changes no gameplay).
   Loaded LAST, so its wrappers are the outermost ones. ?nohitch turns the whole thing off.

   What it keeps: a ring of the last ~40 s of frames. Each frame has: the gap to the next frame (dt), how long the game logic and
   renderer.render took, shadow-map time (and whether the static shadow pass was redrawn in full), GPU time (timer query, when the
   browser offers it), draw calls, triangles, geometries / textures / shader programs, JS heap, zombie count, how long each part of the
   frame took (zombies, followers, HUD, corpses, viewmodel, lighting, fx), and the timed calls inside it (shoot, hitZ, killZ, sounds,
   tracers, decals, world build ...). Browser "long task" and "long animation frame" entries (with the script / function that blocked)
   are matched to the frame they hit.

   How to use it while playing:
     F9             grab the last 8 s now (do it right after you feel a hitch) -> a toast confirms it
     F10            download every grabbed report as a .txt file (works while the pointer is locked)
     (automatic)    any frame longer than 120 ms grabs a report by itself 1.5 s later
   From the browser console (F12):
     hitch()        same as F9, prints the summary and tries to copy the whole report to the clipboard (hitch(15) = last 15 s)
     prof(10)       frame profiler: where the last 10 s of frame time went (table), and a CPU-bound / GPU-bound verdict
     hitch.save()   same as F10      hitch.copy()  copy all reports      hitch.clear()  forget them
     hitch.auto(ms) change the auto-grab threshold (0 = off)             hitch.gpu(false)  turn the GPU timer off
   Send the downloaded text file back and the hitch can be read frame by frame. */
(function () {
  'use strict';
  if (/[?&]nohitch/.test(location.search)) return;
  const N = 2400, // frames kept
    now = () => performance.now(),
    SEC = {zombies: 'z', comps: 'c', hud: 'h', dead: 'd', vm: 'v', light: 'l', fx: 'f'},
    ring = new Array(N);
  let n = 0, // frames recorded so far
    cur = null, // the frame being run
    lastRec = null,
    depth = 0,
    on = true,
    autoMs = 120,
    autoAt = -1e9,
    autoN = 0,
    gpuOn = true;
  const EXP = {hide: null, running: false},
    seen = new Set(),
    loaf = [],
    ltask = [],
    snaps = [];
  const H = (window.HITCH = {ring, loaf, ltask, snaps, seen});

  /* ---------- events (timed calls) ---------- */
  function addEv(name, ms, first, extra) {
    const r = cur || lastRec;
    if (!r) return;
    (r.ev || (r.ev = [])).push({name, ms, d: depth, first, x: extra, at: now() - r.t, out: !cur});
  }
  /* mark a moment on the timeline (no duration) */
  function mark(name) {
    addEv(name, 0, false);
  }
  H.mark = mark;
  function resolve(path) {
    const p = path.split('.'),
      roots = {
        S: typeof S !== 'undefined' ? S : null,
        MFZGORE: typeof MFZGORE !== 'undefined' ? MFZGORE : null,
        MFZLOAD: typeof MFZLOAD !== 'undefined' ? MFZLOAD : null,
        window
      };
    if (p.length === 1) return [window, p[0]];
    return [roots[p[0]], p[1]];
  }
  function wrapEv(path, o) {
    o = o || {};
    try {
      const [obj, key] = resolve(path);
      if (!obj || typeof obj[key] !== 'function' || obj[key].__hl) return;
      const orig = obj[key],
        w = function () {
          if (!on) return orig.apply(this, arguments);
          let lab = '';
          if (o.label)
            try {
              lab = o.label.apply(this, arguments) || '';
            } catch (e) {}
          const t = now();
          depth++;
          try {
            return orig.apply(this, arguments);
          } finally {
            depth--;
            const ms = now() - t,
              k = path + ':' + lab,
              first = !seen.has(k);
            if (first) seen.add(k);
            if (o.always || ms >= (o.min === undefined ? 1 : o.min) || (first && ms >= 0.3))
              addEv(path + (lab ? '[' + lab + ']' : ''), ms, first);
          }
        };
      w.__hl = 1;
      obj[key] = w;
    } catch (e) {
      console.warn('[hitch] cannot wrap', path, e);
    }
  }
  function wrapSec(name, sec) {
    try {
      const orig = window[name];
      if (typeof orig !== 'function' || orig.__hl) return;
      const w = function () {
        if (!on || !cur) return orig.apply(this, arguments);
        const t = now();
        try {
          return orig.apply(this, arguments);
        } finally {
          cur.s[SEC[sec]] = (cur.s[SEC[sec]] || 0) + (now() - t);
        }
      };
      w.__hl = 1;
      window[name] = w;
    } catch (e) {
      console.warn('[hitch] cannot wrap', name, e);
    }
  }
  const wid = () => (typeof G !== 'undefined' && G.eq && G.eq.id) || '';
  /* every shader program compiled mid-play is a hitch: remember which material asked for it (Material.prototype.onBeforeCompile runs
     when a program is first needed; materials that set their own onBeforeCompile are not seen here, but the program diff still is) */
  const compiles = [];
  function matHook() {
    try {
      const P = THREE.Material.prototype;
      if (P.onBeforeCompile.__hl) return;
      const o = P.onBeforeCompile,
        w = function (p) {
          try {
            compiles.push(
              this.type +
                (this.name ? ' "' + this.name + '"' : '') +
                (p && p.skinning ? ' skinned' : '') +
                (p && p.instancing ? ' instanced' : '') +
                (p && p.vertexColors ? ' vcol' : '') +
                (p && p.map ? ' map' : '') +
                (p && p.shadowMapEnabled ? ' shadowrecv' : '') +
                (p && p.numPointLights ? ' pl' + p.numPointLights : '') +
                (p && p.numSpotLights ? ' sl' + p.numSpotLights : '') +
                (this.transparent ? ' transp' : '') +
                (p && p.alphaTest ? ' alphatest' : '') +
                (this.isShaderMaterial
                  ? ' uniforms[' +
                    Object.keys(this.uniforms || {})
                      .slice(0, 6)
                      .join(',') +
                    '] defines[' +
                    Object.keys(this.defines || {}).join(',') +
                    '] blend' +
                    this.blending
                  : this.color
                    ? ' col#' +
                      this.color.getHexString() +
                      ' r' +
                      this.roughness +
                      ' m' +
                      this.metalness +
                      (this.envMap ? ' env' : '')
                    : '')
            );
            if (compiles.length > 40) compiles.shift();
          } catch (e) {}
          return o.apply(this, arguments);
        };
      w.__hl = 1;
      P.onBeforeCompile = w;
    } catch (e) {}
  }
  let lastProg = 0;
  function progDiff(r) {
    const pr = renderer.info.programs || [];
    if (pr.length > lastProg && lastProg) {
      for (let i = lastProg; i < pr.length; i++)
        addEv('NEW SHADER PROGRAM ' + pr[i].name + ' [' + String(pr[i].cacheKey).slice(-110) + ']', 0, true);
      if (compiles.length) addEv('materials that asked for a program this frame: ' + compiles.join(' | '), 0, true);
    }
    compiles.length = 0;
    lastProg = pr.length;
  }
  function install() {
    matHook();
    wrapSec('updateZombies', 'zombies');
    wrapSec('updComps', 'comps');
    wrapSec('hud', 'hud');
    wrapSec('updDead', 'dead');
    wrapSec('animVM', 'vm');
    wrapSec('lighting', 'light');
    ['updShards', 'updBlood', 'updLimbs', 'updFloats', 'updDmgNums'].forEach(f => wrapSec(f, 'fx'));
    wrapEv('shoot', {always: true, label: wid});
    wrapEv('melee', {min: 1, label: wid});
    wrapEv('reload', {min: 1, label: wid});
    wrapEv('hitZ', {min: 0.5});
    wrapEv('dmgZ', {min: 0.5});
    wrapEv('killZ', {always: true});
    wrapEv('dismember', {min: 0.5});
    wrapEv('corpseHit', {min: 0.5});
    wrapEv('zKnock', {min: 0.5});
    wrapEv('ragInit', {min: 0.3});
    wrapEv('spawnLimb', {min: 0.5});
    wrapEv('MFZGORE.gib', {min: 0.3});
    wrapEv('bloodSpray', {min: 0.3});
    wrapEv('bloodPool', {min: 0.3});
    wrapEv('addDecal', {min: 0.3});
    wrapEv('addHole', {min: 0.3});
    wrapEv('addTracer', {min: 0.3});
    wrapEv('dmgNum', {min: 0.3});
    wrapEv('damage', {min: 1});
    wrapEv('breakWin', {min: 0.5});
    wrapEv('S.shot', {min: 0.2, label: a => (typeof a === 'string' ? a : '')});
    wrapEv('S.die', {min: 0.2});
    wrapEv('S.hit', {min: 0.2});
    wrapEv('S.hm', {min: 0.2});
    wrapEv('S.reload', {min: 0.2});
    wrapEv('S.groan', {min: 0.2});
    wrapEv('S.snarl', {min: 0.2});
    wrapEv('placeNpcs', {min: 1});
    wrapEv('zombie', {min: 1});
    wrapEv('spawnComp', {min: 1});
    wrapEv('go', {always: true});
    wrapEv('buildWorld', {always: true});
    wrapEv('clearWorld', {always: true});
    wrapEv('startSiege', {always: true});
    wrapEv('travel', {always: true});
    pointerDiag();
    observers();
  }
  /* ---------- pointer-lock / "press any key" diagnostics (issue: left click on the loading screen) ---------- */
  function pointerDiag() {
    const act = () => {
      const u = navigator.userActivation;
      return u ? 'activation ' + (u.isActive ? 'ACTIVE' : 'not active') : 'activation ?';
    };
    try {
      const orig = Element.prototype.requestPointerLock;
      if (orig && !orig.__hl)
        Element.prototype.requestPointerLock = function () {
          const a = act();
          let p;
          try {
            p = orig.apply(this, arguments);
          } catch (e) {
            mark('requestPointerLock THREW ' + e.name + ' (' + a + ')');
            throw e;
          }
          mark('requestPointerLock called (' + a + ')');
          if (p && p.then)
            p.then(
              () => mark('requestPointerLock resolved'),
              e => mark('requestPointerLock REJECTED: ' + (e && e.name + ' ' + e.message))
            );
          return p;
        };
      Element.prototype.requestPointerLock.__hl = 1;
    } catch (e) {}
    document.addEventListener('pointerlockchange', () =>
      mark('pointerlockchange locked=' + !!document.pointerLockElement)
    );
    document.addEventListener('pointerlockerror', () => mark('pointerlockerror'));
    const loading = () => {
      const el = document.getElementById('zlMis');
      return el && el.classList.contains('on');
    };
    ['pointerdown', 'mousedown', 'mouseup', 'click', 'keydown'].forEach(t =>
      addEventListener(
        t,
        e => {
          if (loading()) mark('loadscreen ' + t + (e.code ? ' ' + e.code : '') + ' (' + act() + ')');
        },
        true
      )
    );
  }
  /* ---------- browser long tasks / long animation frames ---------- */
  function observers() {
    try {
      new PerformanceObserver(l => {
        for (const e of l.getEntries()) {
          ltask.push({t: e.startTime, dur: e.duration});
          if (ltask.length > 300) ltask.shift();
        }
      }).observe({type: 'longtask'});
    } catch (e) {}
    try {
      new PerformanceObserver(l => {
        for (const e of l.getEntries()) {
          loaf.push({
            t: e.startTime,
            dur: e.duration,
            block: e.blockingDuration,
            rs: e.renderStart ? e.renderStart - e.startTime : 0,
            sl: e.styleAndLayoutStart ? e.styleAndLayoutStart - e.startTime : 0,
            sc: (e.scripts || [])
              .map(s => ({
                fn: s.sourceFunctionName || s.invoker || '',
                file: (s.sourceURL || '').split('/').pop(),
                pos: s.sourceCharPosition,
                dur: s.duration,
                forced: s.forcedStyleAndLayoutDuration,
                type: s.invokerType
              }))
              .sort((a, b) => b.dur - a.dur)
              .slice(0, 4)
          });
          if (loaf.length > 300) loaf.shift();
        }
      }).observe({type: 'long-animation-frame'});
    } catch (e) {}
  }

  /* ---------- GPU timer query ---------- */
  const gq = {ext: null, gl: null, active: false, pend: [], tried: null};
  function gpuInit() {
    if (gq.tried === renderer) return;
    gq.tried = renderer;
    gq.ext = gq.gl = null;
    gq.pend.length = 0;
    try {
      const gl = renderer.getContext();
      if (gl && gl.createQuery) {
        const e = gl.getExtension('EXT_disjoint_timer_query_webgl2');
        if (e) {
          gq.ext = e;
          gq.gl = gl;
        }
      }
    } catch (e) {}
  }
  function gpuPoll() {
    const gl = gq.gl;
    if (!gl) return;
    while (gq.pend.length) {
      const p = gq.pend[0];
      let ok = false;
      try {
        ok = gl.getQueryParameter(p.q, gl.QUERY_RESULT_AVAILABLE);
      } catch (e) {
        ok = true;
      }
      if (!ok) break;
      gq.pend.shift();
      try {
        const dis = gl.getParameter(gq.ext.GPU_DISJOINT_EXT);
        if (!dis) p.r.gpu = (p.r.gpu || 0) + gl.getQueryParameter(p.q, gl.QUERY_RESULT) / 1e6;
        gl.deleteQuery(p.q);
      } catch (e) {}
    }
    if (gq.pend.length > 8) gq.pend.length = 0; // never let it pile up
  }

  /* ---------- renderer hooks (re-applied if the renderer is replaced, e.g. the antialiasing toggle) ---------- */
  function hookRenderer() {
    if (!renderer || renderer.__hl) return;
    /* wait (a few frames) for perf.js to install its own render and shadow wrappers so ours are the outermost */
    if ((!renderer.__pf || (renderer.shadowMap && !renderer.shadowMap.__pfsc)) && n < 8) return;
    renderer.__hl = 1;
    gpuInit();
    const o = renderer.render;
    renderer.render = function () {
      const r = cur;
      let q = null;
      if (r && gpuOn && gq.gl && !gq.active) {
        try {
          q = gq.gl.createQuery();
          gq.gl.beginQuery(gq.ext.TIME_ELAPSED_EXT, q);
          gq.active = true;
        } catch (e) {
          q = null;
        }
      }
      const t = now();
      let sv = null;
      if (EXP.hide && arguments[0] === scene) {
        sv = [];
        for (const ch of scene.children) {
          if (ch === pl || ch.isLight) continue;
          const z = ch.userData && ch.userData.kind === 'zombie';
          if ((EXP.hide === 'zombies' && z) || (EXP.hide === 'world' && !z)) {
            sv.push(ch, ch.visible);
            ch.visible = false;
          }
        }
      }
      try {
        return o.apply(this, arguments);
      } finally {
        if (sv) for (let i = 0; i < sv.length; i += 2) sv[i].visible = sv[i + 1];
        if (q) {
          try {
            gq.gl.endQuery(gq.ext.TIME_ELAPSED_EXT);
            gq.pend.push({q, r});
          } catch (e) {}
          gq.active = false;
        }
        if (r) {
          r.rd += now() - t;
          r.rn++;
          const i = renderer.info.render;
          r.calls += i.calls;
          r.tris += i.triangles;
        }
      }
    };
    const sm = renderer.shadowMap;
    if (sm && !sm.__hl) {
      sm.__hl = 1;
      const so = sm.render;
      sm.render = function () {
        const r = cur;
        if (!r) return so.apply(this, arguments);
        const f0 = window.PF && PF.sc ? PF.sc.stats.full : 0,
          t = now();
        try {
          return so.apply(this, arguments);
        } finally {
          r.sh += now() - t;
          if (window.PF && PF.sc && PF.sc.stats.full > f0) r.full++;
        }
      };
    }
  }

  /* ---------- the per-frame hook ---------- */
  let started = false,
    lastBusy = false,
    lastHeap = 0;
  const _an = animate;
  animate = function () {
    const t0 = now();
    if (!started) {
      started = true;
      try {
        install();
      } catch (e) {
        console.warn('[hitch] install failed', e);
      }
    }
    if (on) {
      if (lastRec) {
        lastRec.dt = t0 - lastRec.t;
        const ev = lastRec.ev ? lastRec.ev.reduce((a, e) => a + (e.out && e.d === 0 ? e.ms : 0), 0) : 0;
        lastRec.idle = lastRec.dt - lastRec.ms - ev;
        if (lastRec.dt > autoMs && autoMs > 0) autoGrab(lastRec);
      }
      try {
        hookRenderer();
        gpuPoll();
      } catch (e) {}
      const r = {
        i: n,
        t: t0,
        dt: 0,
        ms: 0,
        rd: 0,
        rn: 0,
        sh: 0,
        full: 0,
        gpu: 0,
        calls: 0,
        tris: 0,
        geo: 0,
        tex: 0,
        prog: 0,
        heap: 0,
        gc: false,
        z: 0,
        busy: false,
        hid: document.hidden,
        idle: 0,
        s: {},
        ev: null
      };
      ring[n % N] = r;
      n++;
      lastRec = cur = r;
      try {
        const b = typeof MFZLOAD !== 'undefined' && !!MFZLOAD.busy;
        if (b !== lastBusy) {
          lastBusy = b;
          mark(b ? 'MFZLOAD busy ON (loading / warming)' : 'MFZLOAD busy OFF (world ready)');
        }
        r.busy = b;
      } catch (e) {}
    }
    try {
      _an.apply(this, arguments);
    } finally {
      if (on && cur) {
        const r = cur;
        r.ms = now() - t0;
        cur = null;
        try {
          const i = renderer.info;
          r.geo = i.memory.geometries;
          r.tex = i.memory.textures;
          r.prog = i.programs ? i.programs.length : 0;
          progDiff(r);
          r.z = typeof zombies !== 'undefined' ? zombies.length : 0;
          const pm = performance.memory;
          if (pm) {
            r.heap = pm.usedJSHeapSize / 1048576;
            if (lastHeap && r.heap < lastHeap - 2) r.gc = true;
            lastHeap = r.heap;
          }
        } catch (e) {}
      }
    }
  };

  /* ---------- reports ---------- */
  const f1 = x => (x >= 100 ? x.toFixed(0) : x.toFixed(1)),
    pct = (a, p) => a[Math.min(a.length - 1, Math.floor(a.length * p))];
  function recsSince(sec, until) {
    const out = [],
      end = until || now(),
      from = end - sec * 1000;
    for (let k = Math.max(0, n - N); k < n; k++) {
      const r = ring[k % N];
      if (r && r.t >= from && r.t <= end && r.dt > 0) out.push(r);
    }
    return out;
  }
  function stats(recs) {
    const a = recs.filter(r => !r.hid && r.dt < 3000),
      dts = a.map(r => r.dt).sort((x, y) => x - y),
      sum = k => a.reduce((s, r) => s + (r[k] || 0), 0),
      m = a.length || 1,
      S2 = {};
    for (const k in SEC) {
      const v = a.map(r => r.s[SEC[k]] || 0);
      S2[k] = {avg: v.reduce((x, y) => x + y, 0) / m, max: Math.max(0, ...v)};
    }
    const avgDt = sum('dt') / m,
      st = {
        frames: a.length,
        avgDt,
        fps: avgDt ? 1000 / avgDt : 0,
        p50: pct(dts, 0.5) || 0,
        p95: pct(dts, 0.95) || 0,
        p99: pct(dts, 0.99) || 0,
        max: dts[dts.length - 1] || 0,
        over33: dts.filter(x => x > 33.4).length,
        over50: dts.filter(x => x > 50).length,
        over100: dts.filter(x => x > 100).length,
        logic: sum('ms') / m - sum('rd') / m,
        render: sum('rd') / m,
        shadow: sum('sh') / m,
        fullShadow: sum('full'),
        gpu: sum('gpu') / m,
        gpuFrames: a.filter(r => r.gpu > 0).length,
        calls: sum('calls') / m,
        tris: sum('tris') / m,
        idle: sum('idle') / m,
        sec: S2
      };
    st.cpu = st.logic + st.render;
    let v;
    if (!st.frames) v = 'no frames in that window';
    else if (st.gpuFrames > st.frames * 0.5 && st.gpu > avgDt * 0.8)
      v = 'GPU-BOUND (the GPU needs ~' + f1(st.gpu) + ' ms of each ' + f1(avgDt) + ' ms frame)';
    else if (st.cpu > avgDt * 0.8)
      v = 'CPU-BOUND (the JS main thread uses ~' + f1(st.cpu) + ' ms of each ' + f1(avgDt) + ' ms frame)';
    else
      v =
        'NEITHER IS SATURATED (CPU ' +
        f1(st.cpu) +
        ' ms' +
        (st.gpuFrames ? ', GPU ' + f1(st.gpu) + ' ms' : '') +
        ' of a ' +
        f1(avgDt) +
        ' ms frame): waiting on vsync / the compositor, or work between frames';
    st.verdict = v;
    return st;
  }
  function statText(st) {
    const L = [];
    L.push(
      'frames ' +
        st.frames +
        '   avg ' +
        st.fps.toFixed(1) +
        ' fps (' +
        f1(st.avgDt) +
        ' ms)   median ' +
        f1(st.p50) +
        '   p95 ' +
        f1(st.p95) +
        '   p99 ' +
        f1(st.p99) +
        '   worst ' +
        f1(st.max) +
        ' ms'
    );
    L.push('frames over 33 ms: ' + st.over33 + '   over 50 ms: ' + st.over50 + '   over 100 ms: ' + st.over100);
    L.push(
      'per frame avg: game logic ' +
        f1(st.logic) +
        ' ms   renderer.render ' +
        f1(st.render) +
        ' ms (shadow map ' +
        f1(st.shadow) +
        ' ms, full static shadow redraws: ' +
        st.fullShadow +
        ')   GPU ' +
        (st.gpuFrames ? f1(st.gpu) + ' ms' : 'n/a') +
        '   idle/between-frame ' +
        f1(st.idle) +
        ' ms'
    );
    L.push('draw calls avg ' + st.calls.toFixed(0) + '   triangles avg ' + st.tris.toFixed(0));
    L.push(
      'logic split (avg / worst ms): ' +
        Object.keys(SEC)
          .map(k => k + ' ' + f1(st.sec[k].avg) + ' / ' + f1(st.sec[k].max))
          .join('   ')
    );
    L.push('verdict: ' + st.verdict);
    return L.join('\n');
  }
  function head() {
    const L = [];
    let gpu = '?';
    try {
      const gl = renderer.getContext(),
        e = gl.getExtension('WEBGL_debug_renderer_info');
      if (e) gpu = gl.getParameter(e.UNMASKED_RENDERER_WEBGL);
    } catch (er) {}
    L.push('Mini Fort Zombie v' + (typeof VERSION !== 'undefined' ? VERSION : '?') + '   ' + new Date().toISOString());
    L.push('UA: ' + navigator.userAgent);
    L.push(
      'GPU: ' +
        gpu +
        '   timer query: ' +
        (gq.gl ? 'yes' : 'no') +
        '   long-task API: ' +
        (typeof PerformanceObserver !== 'undefined' && (PerformanceObserver.supportedEntryTypes || []).join(','))
    );
    try {
      L.push(
        'window ' +
          innerWidth +
          'x' +
          innerHeight +
          '   dpr ' +
          devicePixelRatio +
          '   renderer pixel ratio ' +
          renderer.getPixelRatio().toFixed(2) +
          '   quality ' +
          G.q +
          '   AA ' +
          PERF.aa +
          '   mode ' +
          G.mode +
          '   zombies ' +
          zombies.length
      );
      L.push('url flags: ' + (location.search || '(none)'));
    } catch (e) {}
    try {
      const w = MFZLOAD.lastWarm;
      if (w)
        L.push(
          'last world warm-up: ' +
            w.newPrograms +
            ' shaders, ' +
            w.textures +
            ' textures, ' +
            w.ms +
            ' ms; programs it had to compile at the final draw: ' +
            ((w.late || []).length ? w.late.join(' | ') : 'none')
        );
    } catch (e) {}
    return L.join('\n');
  }
  function line(r) {
    const s = Object.keys(SEC)
      .filter(k => (r.s[SEC[k]] || 0) >= 0.2)
      .map(k => SEC[k] + f1(r.s[SEC[k]]))
      .join(' ');
    return (
      (r.dt > 50 ? '<<<< ' : r.dt > 33.4 ? '<<   ' : '     ') +
      '#' +
      r.i +
      ' dt ' +
      f1(r.dt).padStart(5) +
      ' | logic ' +
      f1(r.ms - r.rd).padStart(5) +
      ' rnd ' +
      f1(r.rd).padStart(5) +
      ' shd ' +
      f1(r.sh).padStart(4) +
      (r.full ? 'F' : ' ') +
      ' gpu ' +
      (r.gpu ? f1(r.gpu).padStart(5) : '  n/a') +
      ' idle ' +
      f1(r.idle).padStart(5) +
      ' | calls ' +
      r.calls +
      ' tris ' +
      r.tris +
      ' geo ' +
      r.geo +
      ' tex ' +
      r.tex +
      ' prog ' +
      r.prog +
      ' heap ' +
      r.heap.toFixed(0) +
      (r.gc ? ' GC?' : '') +
      ' z' +
      r.z +
      (r.busy ? ' LOADING' : '') +
      (r.hid ? ' HIDDEN' : '') +
      (s ? ' | ' + s : '')
    );
  }
  function evText(r) {
    return (r.ev || [])
      .map(
        e =>
          '        ' +
          '  '.repeat(e.d) +
          '@' +
          f1(e.at) +
          'ms ' +
          e.name +
          (e.ms ? ' took ' + f1(e.ms) + ' ms' : '') +
          (e.first ? '  (FIRST TIME this session)' : '')
      )
      .join('\n');
  }
  function reportFor(recs, label) {
    const L = [],
      st = stats(recs);
    L.push('=== ' + label + ' ===');
    L.push(head());
    L.push('');
    L.push(statText(st));
    L.push('');
    const hits = recs.filter(r => r.dt > 50 && !r.hid && r.dt < 3000);
    L.push('--- hitches (frames over 50 ms): ' + hits.length + ' ---');
    hits
      .slice()
      .sort((a, b) => b.dt - a.dt)
      .slice(0, 12)
      .forEach(r => {
        const prev = ring[(r.i - 1 + N * 2) % N],
          p = prev && prev.i === r.i - 1 ? prev : null;
        L.push('');
        L.push(
          'HITCH ' +
            f1(r.dt) +
            ' ms at frame #' +
            r.i +
            ' (' +
            ((r.t - recs[0].t) / 1000).toFixed(2) +
            ' s into this window)'
        );
        L.push(
          '  own work: logic ' +
            f1(r.ms - r.rd) +
            ' ms, render ' +
            f1(r.rd) +
            ' ms, shadow ' +
            f1(r.sh) +
            ' ms' +
            (r.full ? ' (FULL static shadow redraw)' : '') +
            ', GPU ' +
            (r.gpu ? f1(r.gpu) + ' ms' : 'n/a') +
            ', then ' +
            f1(r.idle) +
            ' ms idle / between frames'
        );
        if (p) {
          const d = [];
          if (r.prog !== p.prog) d.push('shader programs ' + p.prog + ' -> ' + r.prog);
          if (r.geo !== p.geo) d.push('geometries ' + p.geo + ' -> ' + r.geo);
          if (r.tex !== p.tex) d.push('textures ' + p.tex + ' -> ' + r.tex);
          if (r.z !== p.z) d.push('zombies ' + p.z + ' -> ' + r.z);
          if (r.gc) d.push('JS heap fell ' + f1(p.heap - r.heap) + ' MB (garbage collection?)');
          L.push('  vs previous frame: ' + (d.length ? d.join(', ') : 'no change in programs / geometries / textures'));
          L.push(
            '  previous frame: dt ' +
              f1(p.dt) +
              ' logic ' +
              f1(p.ms - p.rd) +
              ' render ' +
              f1(p.rd) +
              (p.ev ? '  events: ' + p.ev.map(e => e.name).join(', ') : '')
          );
        }
        const t1 = r.t,
          t2 = r.t + r.dt,
          lt = ltask.filter(x => x.t < t2 && x.t + x.dur > t1),
          la = loaf.filter(x => x.t < t2 && x.t + x.dur > t1);
        lt.forEach(x => L.push('  browser long task: ' + f1(x.dur) + ' ms'));
        la.forEach(x => {
          L.push(
            '  long animation frame: ' +
              f1(x.dur) +
              ' ms (blocking ' +
              f1(x.block) +
              ', render started +' +
              f1(x.rs) +
              ', style/layout +' +
              f1(x.sl) +
              ')'
          );
          x.sc.forEach(s =>
            L.push(
              '    script ' +
                f1(s.dur) +
                ' ms  ' +
                (s.fn || '(anonymous)') +
                '  ' +
                s.file +
                ':' +
                s.pos +
                (s.forced ? '  forced layout ' + f1(s.forced) + ' ms' : '')
            )
          );
        });
        if (r.ev) L.push('  events in this frame:\n' + evText(r));
      });
    L.push('');
    L.push(
      '--- every frame (<<<< over 50 ms, << over 33 ms; logic = JS minus render, F = full static shadow redraw) ---'
    );
    recs.forEach(r => {
      L.push(line(r));
      if (r.ev && (r.dt > 25 || r.ev.some(e => e.first || e.ms >= 4))) L.push(evText(r));
    });
    return L.join('\n');
  }
  function toast(t) {
    let e = document.getElementById('hitchToast');
    if (!e) {
      e = document.createElement('div');
      e.id = 'hitchToast';
      e.style.cssText =
        'position:fixed;left:10px;bottom:10px;z-index:2147483647;background:rgba(0,0,0,.8);color:#ff9;font:12px/1.3 monospace;padding:6px 9px;border:1px solid #650;pointer-events:none;transition:opacity .4s;opacity:0';
      document.body.appendChild(e);
    }
    e.textContent = t;
    e.style.opacity = 1;
    clearTimeout(e._t);
    e._t = setTimeout(() => (e.style.opacity = 0), 4500);
  }
  function persist() {
    try {
      localStorage.setItem('mfz_hitch', JSON.stringify(snaps));
    } catch (e) {
      try {
        snaps.shift();
        localStorage.setItem('mfz_hitch', JSON.stringify(snaps));
      } catch (e2) {}
    }
  }
  try {
    const o = JSON.parse(localStorage.getItem('mfz_hitch') || '[]');
    if (Array.isArray(o)) o.forEach(s => snaps.push(s));
  } catch (e) {}
  function grab(sec, label, until) {
    const recs = recsSince(sec, until),
      st = stats(recs),
      text = reportFor(recs, label + ' (last ' + sec + ' s, worst frame ' + f1(st.max) + ' ms)');
    snaps.push({label, worst: st.max, text});
    while (snaps.length > 12) snaps.shift();
    persist();
    return {st, text};
  }
  function autoGrab(r) {
    const t = now();
    if (r.hid || r.dt > 3000 || r.busy || t - autoAt < 4000 || autoN >= 25) return;
    autoAt = t;
    autoN++;
    const ms = r.dt;
    setTimeout(() => {
      const g = grab(8, 'AUTO ' + f1(ms) + ' ms hitch', now());
      toast('Hitch ' + f1(ms) + ' ms logged (' + snaps.length + ' saved). F10 downloads them.');
    }, 1500);
  }
  function download() {
    if (!snaps.length) {
      toast('No hitch reports yet. Press F9 right after a hitch.');
      return;
    }
    const txt = snaps.map(s => s.text).join('\n\n\n');
    const a = document.createElement('a'),
      d = new Date(),
      p = x => String(x).padStart(2, '0');
    a.href = URL.createObjectURL(new Blob([txt], {type: 'text/plain'}));
    a.download =
      'mfz_hitch_v' +
      (typeof VERSION !== 'undefined' ? VERSION : '') +
      '_' +
      d.getFullYear() +
      p(d.getMonth() + 1) +
      p(d.getDate()) +
      '-' +
      p(d.getHours()) +
      p(d.getMinutes()) +
      p(d.getSeconds()) +
      '.txt';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 1000);
    toast('Saved ' + snaps.length + ' hitch report(s) to your downloads.');
  }
  function copyAll() {
    const txt = snaps.map(s => s.text).join('\n\n\n');
    try {
      navigator.clipboard.writeText(txt).then(
        () => console.log('[hitch] copied ' + txt.length + ' characters to the clipboard'),
        () => console.log('[hitch] clipboard refused (click the page first); use hitch.save() instead')
      );
    } catch (e) {}
    return txt.length;
  }
  addEventListener('keydown', e => {
    if (e.repeat) return;
    if (e.code === 'F7') {
      e.preventDefault();
      runExp();
    } else if (e.code === 'F9') {
      e.preventDefault();
      const g = grab(8, 'MANUAL (F9)', now());
      toast(
        'Hitch report #' +
          snaps.length +
          ' saved: worst frame ' +
          f1(g.st.max) +
          ' ms, avg ' +
          g.st.fps.toFixed(0) +
          ' fps. F10 downloads.'
      );
    } else if (e.code === 'F10') {
      e.preventDefault();
      download();
    }
  });

  window.hitch = function (sec) {
    const g = grab(sec || 8, 'MANUAL (console)', now());
    console.log(statText(g.st));
    copyAll();
    return snaps.length + ' report(s) saved; worst frame ' + f1(g.st.max) + ' ms. hitch.save() downloads them.';
  };
  hitch.save = download;
  hitch.copy = copyAll;
  hitch.clear = () => {
    snaps.length = 0;
    persist();
    return 'cleared';
  };
  hitch.auto = ms => {
    autoMs = +ms || 0;
    return 'auto-grab threshold ' + (autoMs ? autoMs + ' ms' : 'off');
  };
  hitch.gpu = v => {
    gpuOn = !!v;
    return 'gpu timer ' + (gpuOn ? 'on' : 'off') + (gq.gl ? '' : ' (not offered by this browser)');
  };
  hitch.off = () => ((on = false), 'recorder off');
  hitch.on = () => ((on = true), 'recorder on');

  /* ---------- automatic A/B test: where does the frame time go in THIS spot? (F7 or hitch.exp()) ----------
     Stand still in town for ~12 s. It measures the normal frame, then the frame with the zombies not drawn, with the rest of the world not
     drawn, with the shadow pass skipped, and at half resolution, and prints/saves the differences. The screen flickers while it runs. */
  function sample(frames) {
    return new Promise(res => {
      const i0 = n;
      const iv = setInterval(() => {
        if (n - i0 >= frames + 1) {
          clearInterval(iv);
          const recs = [];
          for (let k = i0; k < n - 1; k++) {
            const r = ring[k % N];
            if (r && r.dt > 0) recs.push(r);
          }
          res(stats(recs));
        }
      }, 50);
    });
  }
  const settle = f =>
    new Promise(res => {
      const i0 = n,
        iv = setInterval(() => {
          if (n - i0 >= f) (clearInterval(iv), res());
        }, 50);
    });
  async function runExp() {
    if (EXP.running) return;
    if (typeof playing === 'function' && !playing()) return toast('Experiment needs you in a mission (not in a menu).');
    EXP.running = true;
    toast('Experiment running (~45 s): stand still, the screen will flicker. Wait for Experiment done before F10.');
    const pr0 = renderer.getPixelRatio(),
      au0 = renderer.shadowMap.autoUpdate,
      rows = [];
    const conds = [
      ['normal frame', () => {}, () => {}],
      ['zombies not drawn', () => (EXP.hide = 'zombies'), () => (EXP.hide = null)],
      ['rest of world not drawn (zombies + hands only)', () => (EXP.hide = 'world'), () => (EXP.hide = null)],
      /* autoUpdate (not .enabled): changing .enabled changes every shader and recompiles the whole world (1-2 s) */
      [
        'shadow pass skipped',
        () => ((renderer.shadowMap.autoUpdate = false), (renderer.shadowMap.needsUpdate = false)),
        () => (renderer.shadowMap.autoUpdate = au0)
      ],
      [
        'half resolution (tests GPU/fill-rate)',
        () => (renderer.setPixelRatio(pr0 * 0.5), renderer.setSize(innerWidth, innerHeight)),
        () => (renderer.setPixelRatio(pr0), renderer.setSize(innerWidth, innerHeight))
      ],
      /* v100: nothing is drawn (camera sees an empty layer) but three still walks the whole scene: that is the pure traversal / culling cost */
      [
        'nothing drawn, scene still traversed (traversal cost)',
        () => ((EXP.l0 = camera.layers.mask), camera.layers.set(7)),
        () => (camera.layers.mask = EXP.l0)
      ],
      /* v102: receiveShadow is a per-object uniform (no recompile): off = the fragment shaders skip the shadow-map lookups */
      [
        'no object receives shadows (shadow lookup cost)',
        () => {
          EXP.rs = [];
          scene.traverse(o => {
            if (o.isMesh && o.receiveShadow) {
              EXP.rs.push(o);
              o.receiveShadow = false;
            }
          });
        },
        () => {
          (EXP.rs || []).forEach(o => (o.receiveShadow = true));
          EXP.rs = null;
        }
      ],
      /* v103: which kind of lit material costs the time? swap one class at a time for a cheap unlit material (restored afterwards) */
      ...[
        [
          'custom-shader materials (world surface classes, flora...) unlit',
          m => m.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile && !m.isShaderMaterial
        ],
        [
          'plain MeshStandard materials unlit',
          m => m.isMeshStandardMaterial && m.onBeforeCompile === THREE.Material.prototype.onBeforeCompile
        ],
        ['Lambert / Phong materials unlit', m => m.isMeshLambertMaterial || m.isMeshPhongMaterial]
      ].map(([name, test]) => [
        name,
        () => {
          EXP.sw = [];
          EXP.c2 = EXP.c2 || new THREE.MeshBasicMaterial({color: 0x888888});
          scene.traverse(o => {
            const m = o.material;
            if (o.isMesh && m && !Array.isArray(m) && !m.transparent && test(m)) {
              EXP.sw.push([o, m]);
              o.material = EXP.c2;
            }
          });
        },
        () => {
          (EXP.sw || []).forEach(([o, m]) => (o.material = m));
          EXP.sw = null;
        }
      ]),
      /* every mesh drawn with one cheap unlit material: removes lighting / shadow uniform work, keeps the draw-call count */
      [
        'one cheap material for everything (material / light cost)',
        () => (scene.overrideMaterial = EXP.cheap || (EXP.cheap = new THREE.MeshBasicMaterial({color: 0x888888}))),
        () => (scene.overrideMaterial = null)
      ]
    ];
    try {
      for (const [name, on_, off_] of conds) {
        on_();
        await settle(20);
        const st = await sample(80);
        off_();
        await settle(10);
        rows.push({name, st});
      }
    } catch (e) {
      console.warn('[hitch] experiment failed', e);
    }
    EXP.hide = null;
    renderer.shadowMap.autoUpdate = au0;
    renderer.setPixelRatio(pr0);
    renderer.setSize(innerWidth, innerHeight);
    EXP.running = false;
    const base = rows[0] && rows[0].st,
      L = ['=== EXPERIMENT: where the frame time goes ===', head(), ''];
    L.push('condition'.padEnd(52) + 'fps   frame ms  js render ms  gpu ms   draw calls   triangles');
    rows.forEach(r => {
      const x = r.st;
      L.push(
        r.name.padEnd(52) +
          x.fps.toFixed(0).padStart(3) +
          f1(x.avgDt).padStart(11) +
          f1(x.render).padStart(11) +
          (x.gpuFrames ? f1(x.gpu) : 'n/a').padStart(11) +
          x.calls.toFixed(0).padStart(10) +
          x.tris.toFixed(0).padStart(13)
      );
    });
    if (base)
      L.push(
        '',
        'Reading it: zombies not drawn saves ' +
          f1(base.avgDt - rows[1].st.avgDt) +
          ' ms/frame; the rest of the world costs ' +
          f1(base.avgDt - rows[2].st.avgDt) +
          ' ms/frame; the shadow pass ' +
          f1(base.avgDt - rows[3].st.avgDt) +
          ' ms/frame; half resolution saves ' +
          f1(base.avgDt - rows[4].st.avgDt) +
          ' ms/frame (a large saving here means GPU-bound; little means the JS side).',
        rows[6]
          ? 'Without shadow lookups the frame is ' +
              f1(rows[6].st.avgDt) +
              ' ms (JS ' +
              f1(rows[6].st.render) +
              ', GPU ' +
              (rows[6].st.gpuFrames ? f1(rows[6].st.gpu) : 'n/a') +
              ').'
          : '',
        rows.length > 10
          ? 'Per material class, frame ms with that class unlit (normal ' +
              f1(base.avgDt) +
              '): ' +
              rows
                .slice(8)
                .map(r => r.name.split(' ')[0] + ' ' + f1(r.st.avgDt))
                .join(', ')
          : '',
        rows[5] && rows[10]
          ? 'Walking the scene alone costs about ' +
              f1(rows[5].st.render) +
              ' ms of JS; one cheap material for everything gives ' +
              f1(rows[10].st.render) +
              ' ms of JS (normal ' +
              f1(base.render) +
              ' ms).'
          : ''
      );
    try {
      L.push('', sceneReport());
    } catch (e) {
      L.push('scene breakdown failed: ' + e);
    }
    const text = L.join('\n');
    snaps.push({label: 'EXPERIMENT', worst: 0, text});
    persist();
    console.log(text);
    toast('Experiment done and saved. F10 downloads it.');
  }
  hitch.exp = runExp;

  /* ---------- draw-call breakdown: which parts of the scene produce the draw calls? (hitch.scene(), also appended to the F7 report) ----------
     Walks the visible scene the way the renderer does (visible flags, frustum culling) and counts, per kind of top-level object, the
     draw calls (one per mesh, one per material group), triangles, and how many distinct materials / geometries they use. A group with many
     draw calls and few distinct geometries is a candidate for merging or instancing. */
  function sceneReport() {
    const fr = new THREE.Frustum(),
      pm = new THREE.Matrix4(),
      sp = new THREE.Sphere(),
      rows = new Map();
    camera.updateMatrixWorld();
    pm.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    fr.setFromProjectionMatrix(pm);
    const keyOf = top => {
      const k = (top.userData && top.userData.kind) || '';
      return ((k ? k + ' / ' : '') + (top.name || top.type)).replace(/[0-9]+/g, '#').slice(0, 44);
    };
    let total = 0,
      totalTri = 0,
      shadowCalls = 0;
    for (const top of scene.children) {
      if (!top.visible || top.isLight) continue;
      const key = keyOf(top);
      let row = rows.get(key);
      if (!row)
        rows.set(
          key,
          (row = {key, tops: 0, calls: 0, tris: 0, inst: 0, skinned: 0, mats: new Set(), geos: new Set(), cast: 0})
        );
      row.tops++;
      (function walk(o) {
        if (!o.visible) return;
        if (o.isMesh || o.isSkinnedMesh) {
          let inView = true;
          if (o.frustumCulled && o.geometry) {
            if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
            sp.copy(o.geometry.boundingSphere).applyMatrix4(o.matrixWorld);
            inView = fr.intersectsSphere(sp);
          }
          if (inView && o.geometry && o.material) {
            const mats = Array.isArray(o.material) ? o.material : [o.material],
              g = o.geometry,
              tri = ((g.index ? g.index.count : g.attributes.position.count) / 3) * (o.isInstancedMesh ? o.count : 1),
              groups = Array.isArray(o.material) && g.groups.length ? g.groups.length : 1;
            row.calls += groups;
            total += groups;
            row.tris += tri;
            totalTri += tri;
            if (o.isInstancedMesh) row.inst++;
            if (o.isSkinnedMesh) row.skinned++;
            if (o.castShadow) row.cast++;
            mats.forEach(m => row.mats.add(m.uuid));
            row.geos.add(g.uuid);
          }
        }
        for (const c of o.children) walk(c);
      })(top);
    }
    const list = [...rows.values()].sort((a, b) => b.calls - a.calls),
      L = ['=== SCENE BREAKDOWN: visible meshes in the camera frustum (estimate of draw calls per group) ===', ''];
    L.push('group'.padEnd(46) + 'objs  calls  triangles  instanced  skinned  materials  geometries  shadow-casters');
    list
      .slice(0, 30)
      .forEach(r =>
        L.push(
          r.key.padEnd(46) +
            String(r.tops).padStart(4) +
            String(r.calls).padStart(7) +
            String(Math.round(r.tris)).padStart(11) +
            String(r.inst).padStart(9) +
            String(r.skinned).padStart(9) +
            String(r.mats.size).padStart(11) +
            String(r.geos.size).padStart(11) +
            String(r.cast).padStart(13)
        )
      );
    L.push(
      '',
      'total estimated draw calls ' +
        total +
        ' (renderer.info says ' +
        renderer.info.render.calls +
        ' for the last render call), triangles ' +
        Math.round(totalTri) +
        ', lights ' +
        scene.children.filter(c => c.isLight && c.visible).length
    );
    return L.join('\n');
  }
  hitch.scene = () => {
    const t = sceneReport();
    snaps.push({label: 'SCENE', worst: 0, text: t});
    persist();
    console.log(t);
    return 'saved; hitch.save() downloads it';
  };
  window.prof = function (sec) {
    const st = stats(recsSince(sec || 10, now()));
    console.log(statText(st));
    const rows = {};
    Object.keys(SEC).forEach(
      k => (rows[k] = {'avg ms': +st.sec[k].avg.toFixed(2), 'worst ms': +st.sec[k].max.toFixed(2)})
    );
    rows['renderer.render'] = {'avg ms': +st.render.toFixed(2), 'worst ms': ''};
    rows['  of which shadow map'] = {'avg ms': +st.shadow.toFixed(2), 'worst ms': ''};
    rows['GPU (timer query)'] = {'avg ms': st.gpuFrames ? +st.gpu.toFixed(2) : 'n/a', 'worst ms': ''};
    rows['other logic'] = {
      'avg ms': +Math.max(0, st.logic - Object.keys(SEC).reduce((s, k) => s + st.sec[k].avg, 0)).toFixed(2),
      'worst ms': ''
    };
    console.table(rows);
    return st.verdict;
  };
  console.log(
    '[hitch] recorder ready: F9 = grab last 8 s, F10 = download reports, F7 = 12 s A/B experiment, prof(10) in the console for the frame profiler'
  );
})();
