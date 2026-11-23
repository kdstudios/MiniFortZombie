/* =====================================================================================================
   MINI FORT ZOMBIE v075 - LOADING SCREENS
   A progress bar made of zombie silhouettes that fill in blood red as the world is built step by step (core worldSteps(), one step a frame).
   - Title: the menu town builds behind the title while the bar fills. "Press any key" only appears once it is done. The menu town camera
     and the menu music only start after that key press.
   - Mission: after the drive to the pin, the "Loading map" screen shows the same bar while the mission town is built, then "Press any key".
     That key press locks the mouse, so the game starts straight away instead of on the pause screen.
   API: MFZLOAD.run(steps, {wrap, onProgress, noWarm}) runs [label, fn, weight] steps a frame apart, then warms the GPU; MFZLOAD.bar() makes a bar;
   MFZLOAD.mission(mode, after); v088: MFZLOAD.warm({bar, f0, f1}) and MFZLOAD.afterBuild() (see the GPU warm-up block below).
   ===================================================================================================== */
(function () {
  'use strict';
  const L = (window.MFZLOAD = {ready: false, passed: false});

  /* ---------------- the zombie silhouettes (three poses in one 132 x 60 tile) ---------------- */
  const FIG = `<circle cx="22" cy="8" r="5.5"/><path d="M16 15L26 14L29 35L17 36Z"/><path d="M22 16L40 19L40 23L21 21Z"/><path d="M19 20L37 25L36 28.5L18 25Z"/><path d="M17 34L22 34L15 58L10 58Z"/><path d="M21 34L26 33L31 58L26 58Z"/>
<g transform="translate(44 0)"><circle cx="27" cy="12" r="5.5"/><path d="M14 17L27 16L28 37L16 37Z"/><path d="M24 19L39 27L37 30.5L22 23Z"/><path d="M14 18L19 18L17 37L12.5 36Z"/><path d="M16 36L21 36L19 58L14 58Z"/><path d="M22 36L27 36L34 57L29 58Z"/></g>
<g transform="translate(88 0)"><circle cx="19" cy="9" r="5.5"/><path d="M14 15L25 16L26 36L16 36Z"/><path d="M22 17L37 11L38 14.5L23 21Z"/><path d="M18 19L34 21L34 24.5L18 23Z"/><path d="M16 35L21 35L20 58L15 58Z"/><path d="M21 35L26 35L35 56L30 58Z"/></g>`;
  const svg = col =>
    'url("data:image/svg+xml,' +
    encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="132" height="60" viewBox="0 0 132 60"><g fill="${col}">${FIG}</g></svg>`
    ) +
    '")';
  const BACK = svg('rgba(230,223,207,.13)'),
    FILL = svg('#c1281d'); /* layout CSS lives in css/ui.css (present from the first paint) */

  L.bar = function () {
    const el = document.createElement('div');
    el.className = 'zl';
    el.innerHTML =
      '<div class="zlBar"><div class="zlBack"></div><div class="zlFill"></div></div><div class="zlTxt"><span class="zlLab"></span><span class="zlPct">0%</span></div>';
    const fill = el.querySelector('.zlFill'),
      lab = el.querySelector('.zlLab'),
      pct = el.querySelector('.zlPct');
    el.querySelector('.zlBack').style.backgroundImage = BACK;
    fill.style.backgroundImage = FILL;
    let shown = 0,
      target = 0,
      raf = 0;
    const tick = () => {
      raf = 0;
      shown += (target - shown) * 0.25;
      if (Math.abs(target - shown) < 0.002) shown = target;
      fill.style.width = (shown * 100).toFixed(2) + '%';
      pct.textContent = Math.round(shown * 100) + '%';
      if (shown !== target) raf = requestAnimationFrame(tick);
    };
    return {
      el,
      set(f, l) {
        target = Math.max(target, Math.min(1, f));
        if (l !== undefined) lab.textContent = l;
        if (!raf) raf = requestAnimationFrame(tick);
      },
      reset() {
        shown = target = 0;
        fill.style.width = '0%';
        pct.textContent = '0%';
        lab.textContent = '';
      },
      snap() {
        shown = target;
        tick();
      }
    };
  };

  /* ---------------- run build steps a frame apart ---------------- */
  const nextFrame = () =>
    new Promise(r => {
      let d = 0;
      const f = () => {
        if (!d) {
          d = 1;
          setTimeout(r, 0);
        }
      };
      requestAnimationFrame(f);
      setTimeout(f, 80);
    }); // rAF lets the bar paint; the timeout keeps loading going in a background tab
  /* ---------------- v088: GPU warm-up ----------------
     A new world used to do all of its GPU work on the first frame it was drawn: every shader compiled and linked one after another
     (three checks each one for errors straight after linking, which makes the browser wait for it), every canvas texture uploaded,
     every vertex buffer sent. That was the multi-second freeze on joining a world, and the stutter while looking around after it.
     L.warm() does that work behind the loading screen, a little each frame, so the bar keeps moving and the first real frame is cheap:
       1. shaders: renderer.compile() queues every program without waiting (debug.checkShaderErrors is off; add ?shadercheck to the
          URL to get the error log back). With KHR_parallel_shader_compile the driver builds them on its own threads while we poll;
          without it each program is finished one at a time, between frames.
       2. textures: every texture the scene uses is uploaded with renderer.initTexture(), a time slice per frame.
       3. one full render with frustum culling off, so the geometry, shadow and post passes are ready for every direction you look.
     Every way into a world runs it: the mission loader (after go()), and any other build (fort, siege, save load, Dev worlds) through
     the WB.post hook below, which shows the loading overlay over the HUD until it is done. While L.busy is set nothing is drawn and the
     game does not advance (13_campaign.js animate()). */
  const SHADER_CHECK = /[?&]shadercheck/.test(location.search);
  let wGen = 0,
    PSC; // KHR_parallel_shader_compile (undefined: not asked yet, null: not available)
  const now = () => performance.now();
  function glCtx() {
    return renderer.getContext();
  }
  function texturesIn(root, out) {
    root.traverse(o => {
      const mt = o.material;
      if (!mt) return;
      for (const m of Array.isArray(mt) ? mt : [mt]) {
        if (!m) continue;
        for (const k in m) {
          const v = m[k];
          if (v && v.isTexture) out.add(v);
        }
        if (m.uniforms)
          for (const k in m.uniforms) {
            const v = m.uniforms[k] && m.uniforms[k].value;
            if (v && v.isTexture) out.add(v);
          }
      }
    });
    return out;
  }
  function needsUpload(t) {
    if (!t || t.isRenderTargetTexture || t.isVideoTexture || !(t.version > 0)) return false;
    const im = t.image;
    if (!im || im.complete === false) return false;
    if (t.isCubeTexture && !(Array.isArray(im) && im.length === 6 && im.every(x => x && x.complete !== false)))
      return false;
    return renderer.properties.get(t).__version !== t.version;
  }
  function warmScenes() {
    const s = [scene];
    try {
      if (window.RGX && RGX.vm && RGX.vm.scene && RGX.vm.scene !== scene) s.push(RGX.vm.scene);
    } catch (e) {}
    return s;
  }
  /* the viewmodel gun is built (and its sights measured) the first time it is drawn: do that now, behind the loading screen */
  function warmGun() {
    try {
      if (typeof playing === 'function' && playing() && typeof animVM === 'function') animVM(0);
    } catch (e) {}
  }
  /* bring the lights to their in-game state first: the number of lit lights is part of every shader, so a change on the first
     frame would recompile everything we just compiled */
  function warmLights() {
    try {
      if (typeof playing === 'function' && playing() && typeof lighting === 'function') lighting();
    } catch (e) {}
  }
  function cullFreeRender() {
    const saved = [];
    for (const sc of warmScenes())
      sc.traverse(o => {
        if (o.frustumCulled) {
          saved.push(o);
          o.frustumCulled = false;
        }
      });
    try {
      renderer.render(scene, camera); // the full chain: world pre-pass, viewmodel, post
    } finally {
      for (const o of saved) o.frustumCulled = true;
    }
  }
  /* v096: objects the distance culling (perf.js) or a layer has hidden are skipped by renderer.compile() and by the warm draw, so the first
     time one comes into view its shaders, geometry and textures were built mid-play. Show everything (but never a light: the number of
     lit lights is part of every shader) for the duration of one synchronous call. */
  function allVisible(fn) {
    const hid = [];
    for (const sc of warmScenes())
      sc.traverse(o => {
        if (o.visible === false && !o.isLight && o !== sc) {
          o.visible = true;
          hid.push(o);
        }
      });
    try {
      return fn();
    } finally {
      for (const o of hid) o.visible = false;
    }
  }
  /* v096: every weapon's viewmodel (model, hands, sights, shaders) is built the first time it is equipped, which is a hitch of up to a
     second each time you pick up and draw a new gun. Equip each one for a moment behind the loading screen (a throw-away item stands in
     for it in the inventory so nothing is kept), draw the viewmodel scene once, then put everything back. */
  async function warmWeapons(set, alive) {
    if (typeof WDEF === 'undefined' || typeof newInst !== 'function' || typeof animVM !== 'function') return 0;
    if (typeof PINV === 'undefined' || !(typeof playing === 'function' && playing())) return 0;
    const vm = window.RGX && RGX.vm,
      eq0 = G.eq,
      keep = {draw: G.draw, rl: G.rl, cdS: G.cdS, kick: G.kick, ads: G.ads, fbLeft: G.fbLeft},
      ids = Object.keys(WDEF);
    let i = 0,
      built = 0;
    try {
      while (i < ids.length) {
        if (!alive()) return built;
        const end = now() + 24;
        while (i < ids.length && now() < end) {
          const id = ids[i++];
          let q = null;
          try {
            q = newInst(id);
            PINV.items.push(q);
            G.eq = q;
            G.draw = 0;
            animVM(0);
            if (vm && vm.scene) renderer.render(vm.scene, vm.cam || camera);
            built++;
          } catch (e) {
            console.warn('[loader] weapon warm-up', id, e);
          } finally {
            if (q) {
              const k = PINV.items.indexOf(q);
              if (k >= 0) PINV.items.splice(k, 1);
            }
          }
        }
        set(i / ids.length, 'Preparing weapons');
        await nextFrame();
      }
    } finally {
      G.eq = eq0;
      Object.assign(G, keep);
      try {
        animVM(0);
      } catch (e) {}
    }
    return built;
  }
  /* v096: effects whose first appearance compiled a shader mid-play (the bullet tracer: transparent + additive). A throw-away mesh with the same
     material settings is drawn once during the warm-up. The probe materials are never disposed, so their programs stay in three.js's cache
     (a program is deleted when the last material using it is disposed). */
  const PROBE_MATS = [];
  function addProbes() {
    const out = [];
    try {
      const T = THREE,
        d = new T.Vector3(),
        p = new T.Vector3();
      camera.getWorldDirection(d);
      camera.getWorldPosition(p);
      p.addScaledVector(d, 2);
      if (!PROBE_MATS.length) {
        PROBE_MATS.push(
          new T.MeshBasicMaterial({
            color: 0xffe9a0,
            transparent: true,
            opacity: 0.9,
            depthWrite: false,
            blending: T.AdditiveBlending
          })
        );
      }
      try {
        if (window.MFZWATER && MFZWATER.warmObjs) for (const o of MFZWATER.warmObjs()) (o.frustumCulled = false), (o.raycast = () => {}), scene.add(o), out.push(o);
        if (window.MFZWATER && MFZWATER.warm) MFZWATER.warm();
      } catch (e) {
        console.warn('[loader] water warm', e);
      }
      const g = new T.BoxGeometry(0.01, 0.01, 0.01);
      for (const m of PROBE_MATS) {
        const o = new T.Mesh(g, m);
        o.position.copy(p);
        o.frustumCulled = false;
        o.raycast = () => {};
        scene.add(o);
        out.push(o);
      }
    } catch (e) {
      console.warn('[loader] probes', e);
    }
    return out;
  }
  /* bar: {set(f, label)} or null; f0..f1 is the part of the bar the warm-up fills */
  L.warm = async function (o) {
    o = o || {};
    if (typeof renderer === 'undefined' || !renderer || typeof scene === 'undefined' || !scene) return;
    const my = ++wGen,
      alive = () => my === wGen;
    const bar = o.bar,
      f0 = o.f0 || 0,
      f1 = o.f1 === undefined ? 1 : o.f1,
      set = (f, l) => bar && bar.set(f0 + (f1 - f0) * f, l);
    L.busy = true;
    L.warming = true;
    let probes = [];
    const t0 = now(),
      st = {programs: 0, newPrograms: 0, textures: 0, ms: 0};
    try {
      renderer.debug.checkShaderErrors = SHADER_CHECK;
      const gl = glCtx();
      if (PSC === undefined) PSC = gl.getExtension('KHR_parallel_shader_compile') || null;
      if (typeof PERF !== 'undefined' && PERF.flushDisposals) PERF.flushDisposals(); // free the last world's leftovers before the new uploads (perf.js)
      warmLights();
      warmGun();
      try {
        if (window.ZBATCH && ZBATCH.all) ZBATCH.all(); // v088: zombies' merged meshes exist before their shaders are compiled
      } catch (e) {}
      /* 0. v096: every weapon's viewmodel */
      st.weapons = await warmWeapons((f, l) => set(f * 0.1, l), alive);
      if (!alive()) return;
      /* 1. shaders */
      if (typeof PERF !== 'undefined' && PERF.lite) PERF.lite(); // v105: ?lite swaps plain Standard materials for Lambert before the shaders are built
      set(0, 'Warming up shaders');
      probes = addProbes();
      const before = new Set(renderer.info.programs);
      for (const sc of warmScenes())
        try {
          allVisible(() =>
            renderer.compile(sc, sc === scene ? camera : (window.RGX && RGX.vm && RGX.vm.cam) || camera)
          );
        } catch (e) {
          console.warn('[loader] compile', e);
        }
      /* v101: the second shader set, with the (dark) lamp / fire lights hidden, as perf.js's light gate will run it by day */
      if (typeof PERF !== 'undefined' && PERF.lightSet && /[?&]lightgate/.test(location.search)) {
        const back = PERF.lightSet(false);
        try {
          allVisible(() => renderer.compile(scene, camera));
        } catch (e) {
          console.warn('[loader] compile (lights off)', e);
        } finally {
          back();
        }
      }
      const progs = renderer.info.programs.filter(p => !before.has(p));
      st.programs = renderer.info.programs.length;
      st.newPrograms = progs.length;
      const texs = [];
      for (const sc of warmScenes()) texturesIn(sc, new Set()).forEach(t => needsUpload(t) && texs.push(t));
      if (o.onWork) o.onWork(progs.length, texs.length);
      const total = progs.length * 3 + texs.length + 2;
      let done = 0;
      const tLimit = now() + 30000;
      let i = 0;
      while (i < progs.length) {
        if (!alive()) return;
        const sliceEnd = now() + 24;
        while (i < progs.length && now() < sliceEnd) {
          const p = progs[i];
          if (PSC && now() < tLimit && !gl.getProgramParameter(p.program, PSC.COMPLETION_STATUS_KHR)) break; // still building: next frame
          try {
            p.getUniforms(); // the link has finished: reading the uniforms costs nothing now (and blocks for this one only otherwise)
            p.getAttributes();
          } catch (e) {}
          i++;
          done += 3;
        }
        set(done / total, 'Warming up shaders');
        if (i < progs.length) await nextFrame();
      }
      /* 2. textures */
      let j = 0;
      while (j < texs.length) {
        if (!alive()) return;
        const sliceEnd = now() + 24;
        while (j < texs.length && now() < sliceEnd) {
          try {
            if (needsUpload(texs[j])) renderer.initTexture(texs[j]);
          } catch (e) {}
          j++;
          done++;
        }
        set(done / total, 'Uploading textures');
        await nextFrame();
      }
      st.textures = texs.length;
      /* 3. everything drawn once, nothing culled */
      if (!alive()) return;
      set(done / total, 'Final touches');
      await nextFrame();
      if (!alive()) return;
      warmLights();
      const pBefore = new Set(renderer.info.programs);
      try {
        allVisible(cullFreeRender);
        if (typeof PERF !== 'undefined' && PERF.shadowDirty) PERF.shadowDirty();
      } catch (e) {
        console.warn('[loader] warm render', e);
      }
      st.late = renderer.info.programs.filter(p => !pBefore.has(p)).map(p => p.name + ' ' + p.cacheKey.slice(-60));
      set(1, 'Ready');
      st.ms = Math.round(now() - t0);
      L.lastWarm = st;
      console.log(
        '[loader] warm-up: ' +
          st.newPrograms +
          ' new shaders (' +
          st.programs +
          ' total), ' +
          st.textures +
          ' textures, ' +
          st.ms +
          ' ms'
      );
    } catch (e) {
      console.warn('[loader] warm-up', e);
    } finally {
      for (const o of probes) if (o.parent) o.parent.remove(o);
      if (alive()) {
        L.warming = false;
        L.busy = !!o.keepBusy;
        L.pendingWarm = false;
      }
    }
  };
  /* v096: the warm-up is finished, but the first frames of the real game loop still do one-off work (the first zombie update builds its
     navigation, the first real frame uploads whatever the warm draw did not reach). That used to happen AFTER "Press any key" appeared,
     as a 1-4 second freeze right at the start. Let the loop run behind the loading screen until it is smooth (at least 12 frames, none of
     the last 10 much slower than their median), then say ready. Never waits longer than 10 s. */
  L.settle = async function (bar, o) {
    o = o || {};
    const cap = o.cap || 10000,
      t0 = now(),
      dts = [];
    let last = now();
    if (bar) bar.set(1, 'Starting up');
    L.settling = true;
    try {
      while (now() - t0 < cap) {
        await nextFrame();
        const t = now();
        dts.push(t - last);
        last = t;
        if (L.busy) {
          dts.length = 0;
          continue;
        }
        if (dts.length < 12) continue;
        const w = dts.slice(-10),
          med = w.slice().sort((a, b) => a - b)[5];
        if (Math.max(...w) <= Math.max(45, med * 1.7)) break;
      }
    } finally {
      L.settling = false;
    }
    console.log('[loader] settled after ' + Math.round(now() - t0) + ' ms (' + dts.length + ' frames)');
  };
  L.run = async function (steps, o) {
    o = o || {};
    wGen++; // a warm-up still running for an older world stops here
    L.busy = true;
    L.flow = (L.flow || 0) + 1;
    try {
      await runSteps(steps, o);
      if (!o.noWarm) {
        const on = o.onProgress || (() => {});
        await L.warm({bar: {set: on}, f0: 0.9, f1: 1, keepBusy: true});
      }
    } finally {
      L.flow--;
      L.busy = false;
    }
  };
  /* any other world build (fort, siege, save load, Dev worlds, co-op rebuilds): warm it up as soon as the code that built it returns.
     L.busy is set at once so not a single frame is drawn before that. */
  let auto = 0;
  L.afterBuild = function () {
    if (L.flow) return; // the loader that is building this world warms it itself
    L.pendingWarm = true;
    L.busy = true;
    if (auto) return;
    auto = setTimeout(async () => {
      auto = 0;
      if (L.flow || !L.pendingWarm) return;
      const inGame =
        typeof scrVis === 'function' && !scrVis('title') && !scrVis('menu') && !scrVis('sel') && G.mode !== 'TITLE';
      let shown = null;
      await L.warm({
        onWork: (np, nt) => {
          if (inGame && np + nt > 0) {
            shown = overlay();
            shown.el.querySelector('h2').textContent = 'Loading...';
            shown.b.reset();
            shown.el.classList.remove('ready', 'out');
            shown.el.classList.add('on', 'auto');
          }
        },
        bar: {set: (f, l) => shown && shown.b.set(f, l)}
      });
      if (shown && !L.flow) {
        await L.settle(shown.b);
        shown.b.snap();
        shown.el.classList.add('out');
        setTimeout(() => !L.flow && shown.el.classList.remove('on', 'out', 'auto'), 520);
      }
    }, 0);
  };
  if (typeof WB !== 'undefined' && WB.post) WB.post.push(() => L.afterBuild());
  async function runSteps(steps, o) {
    const wrap = o.wrap || (f => f()),
      on = o.onProgress || (() => {});
    const W = steps.reduce((a, s) => a + (s[2] || 1), 0);
    let done = 0;
    for (const s of steps) {
      let lab = '';
      try {
        lab = typeof s[0] === 'function' ? s[0]() : s[0];
      } catch (e) {}
      on(done / W, lab);
      await nextFrame();
      wrap(s[1]);
      done += s[2] || 1;
    }
    on(1, 'Ready');
    await nextFrame();
  }
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  /* ---------------- title screen ---------------- */
  async function boot() {
    const t = document.getElementById('title');
    if (!t || typeof scrNow === 'undefined' || scrNow !== 'title' || typeof renderer === 'undefined' || !renderer) {
      setTimeout(boot, 60);
      return;
    }
    const b = L.bar(),
      slot = t.querySelector('.zlSlot') || t.querySelector('.press').parentNode;
    t.classList.add('zlLoading');
    slot.insertBefore(b.el, slot.firstChild);
    b.set(0, 'Waking the dead');
    let ok = false;
    try {
      if (window.MENUWORLD && MENUWORLD.buildStaged) ok = await MENUWORLD.buildStaged((f, l) => b.set(f * 0.97, l));
    } catch (e) {
      console.warn('[loader] menu town', e);
    }
    if (!ok) {
      for (let i = 1; i <= 10; i++) {
        b.set(i / 10, 'Waking the dead');
        await sleep(45);
      }
    } // illustrated menu background (or a failed build): nothing to build
    b.set(1, 'Ready');
    await sleep(350);
    L.ready = true;
    t.classList.remove('zlLoading');
    t.classList.add('zlReady');
    console.log('[loader] title ready');
    // v089: Options > Quit to Main Menu reloads the page; skip the title and go straight to the menu
    try {
      if (sessionStorage.getItem('mfz_toMenu')) {
        sessionStorage.removeItem('mfz_toMenu');
        // what titleAny() does, minus the click sound (audio is not unlocked before the first key or click after a reload)
        ui('menu');
        L.passTitle();
      }
    } catch (e) {
      console.warn('[loader] straight to menu', e);
    }
  }
  /* called by core titleAny() once the title is dismissed: start the menu town camera and the menu music */
  L.passTitle = function () {
    if (L.passed) return;
    L.passed = true;
    try {
      if (window.MENUWORLD && MENUWORLD.startNow) MENUWORLD.startNow();
    } catch (e) {
      console.warn(e);
    }
    try {
      if (window.MENUMUSIC && MENUMUSIC.kick) MENUMUSIC.kick();
    } catch (e) {}
  };
  boot();

  /* ---------------- mission loading screen ---------------- */
  let ov = null;
  function overlay() {
    if (ov) return ov;
    const el = document.createElement('div');
    el.id = 'zlMis';
    el.innerHTML = '<h2>Loading map...</h2><div class="zlPress">Press any key</div>';
    const b = L.bar();
    el.insertBefore(b.el, el.querySelector('.zlPress'));
    document.body.appendChild(el);
    return (ov = {el, b});
  }
  /* build the mission town step by step behind the black screen, then go() (which skips the build), then wait for a key / click to lock the mouse */
  L.mission = async function (mode, after) {
    mode = mode || 'EXPEDITION';
    const o = overlay();
    o.el.querySelector('h2').textContent = 'Loading map...';
    o.b.reset();
    o.el.classList.remove('ready', 'out');
    o.el.classList.add('on');
    o.b.set(0, 'Driving in');
    if (typeof G !== 'undefined' && G.siegeDue) {
      try {
        go(mode);
      } finally {
        if (after) after();
      }
      o.el.classList.remove('on');
      return;
    } // the horde comes first: go() starts the siege instead
    const wrap = fn => {
      const pm = G.mode;
      G.mode = mode;
      try {
        return fn();
      } finally {
        G.mode = pm;
      }
    };
    L.flow = (L.flow || 0) + 1; // v088: this flow warms the world itself (after go(), so the survivors and the gun are in it too)
    try {
      try {
        const steps = wrap(() => worldSteps());
        await L.run(steps, {wrap, noWarm: true, onProgress: (f, l) => o.b.set(f * 0.85, l)});
        WB.prebuilt = true;
      } catch (e) {
        console.error('[loader] mission build failed, building it in one go', e);
        WB.prebuilt = false;
      }
      try {
        go(mode);
      } catch (e) {
        console.error('[loader] go', e);
      } finally {
        WB.prebuilt = false;
        if (after)
          try {
            after();
          } catch (e) {}
      }
      await L.warm({bar: o.b, f0: 0.85, f1: 1});
      await L.settle(o.b); // v096: the first real frames run behind this screen, not after "Press any key"
    } finally {
      L.flow--;
      L.pendingWarm = false;
    }
    if (window.COOP && COOP.gate)
      try {
        await COOP.gate(o); /* v087: co-op waits here until both players have loaded */
      } catch (e) {
        console.warn('[loader] co-op gate', e);
      }
    o.b.snap();
    o.el.classList.add('ready');
    await new Promise(res => {
      const done = e => {
        if (e.type === 'keydown' && (e.code === 'Escape' || e.repeat)) return;
        removeEventListener('keydown', done, true);
        removeEventListener('pointerdown', done, true);
        removeEventListener('mousedown', done, true);
        o.el.removeEventListener('pointerdown', done);
        try {
          lock();
        } catch (_) {}
        if (e.type === 'pointerdown' || e.type === 'mousedown') {
          /* the click that dismisses "Press any key" must not reach the game as an attack (the pointer lock can be granted before
             its mousedown arrives, so it used to swing / fire at once): eat its mouse events for a moment */
          const eat = ev => {
            ev.stopImmediatePropagation();
            if (ev.type === 'mousedown' && typeof K !== 'undefined') K.m0 = K.m2 = false;
          };
          const ts = ['mousedown', 'mouseup', 'click'];
          ts.forEach(t => addEventListener(t, eat, true));
          setTimeout(() => ts.forEach(t => removeEventListener(t, eat, true)), 450);
        }
        res();
      };
      addEventListener('keydown', done, true);
      o.el.addEventListener('pointerdown', done);
      /* v096: go() may already have been granted the pointer lock behind this screen. While the pointer is locked the browser sends every
         mouse event to the game canvas, never to this overlay, so a click here did nothing (only a key worked). Listen on the window too. */
      addEventListener('pointerdown', done, true);
      addEventListener('mousedown', done, true);
    });
    try {
      if (window.COOP && COOP.begin) COOP.begin(); /* v087: the host's key press starts the co-op run for both */
    } catch (e) {}
    o.el.classList.add('out');
    setTimeout(() => o.el.classList.remove('on', 'out', 'ready'), 520);
  };
  console.log('[loader] loading screens ready');
})();
