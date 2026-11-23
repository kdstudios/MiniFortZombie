/* ==========================================================================================================
   MINI FORT ZOMBIE - SURVIVOR WALK CYCLE (v069)
   Survivors (fort residents and followers) get a natural gait instead of sliding with stiff legs: leg swing with a little hip spread,
   counter-swinging arms (the weapon arm keeps its guard / carry pose), weight shift, hip roll and shoulder counter-twist, a soft bob,
   and a gentle breathing sway when standing. Speed is measured from how far they actually moved, and blends in and out smoothly.
   Arms are left alone while a survivor aims a gun, swings a melee weapon or is carried by the player.
   Runs after the game's own NPC updates every frame (wraps survFight, which core calls right after updComps).
   ========================================================================================================== */
(function () {
  'use strict';
  if (typeof survFight !== 'function') {
    console.warn('[survwalk] core missing');
    return;
  }
  const SW = (window.SURVWALK = {on: true});
  function base(P) {
    if (!P._wb)
      P._wb = {
        by: P.body.position.y,
        bx: P.body.rotation.x,
        bpx: P.body.position.x,
        hx: P.head ? P.head.rotation.x : 0
      };
    return P._wb;
  }
  function anim(m, dt) {
    const u = m.userData,
      P = u.P;
    if (!P || !P.body || !P.legL || !P.legR || (typeof carry !== 'undefined' && carry && carry.m === m)) return;
    const B = base(P),
      p = m.position,
      d = u._wp ? Math.hypot(p.x - u._wp.x, p.z - u._wp.z) : 0;
    u._wp = {x: p.x, z: p.z};
    const spd = Math.min(6, d / Math.max(dt, 1e-3)),
      k = 1 - Math.exp(-8 * dt);
    u._ws = (u._ws || 0) + ((spd > 0.15 ? Math.min(1, spd / 2.6) : 0) - (u._ws || 0)) * k;
    const sw = u._ws;
    u._wph = (u._wph || Math.random() * 6) + d * 4.6;
    const ph = u._wph,
      s = Math.sin(ph),
      c = Math.cos(ph),
      t = performance.now() / 1000 + (u._wseed || (u._wseed = Math.random() * 9)),
      br = Math.sin(t * 1.6);
    const run = Math.min(1, spd / 4.5);
    // legs
    P.legL.rotation.x = s * (0.55 + 0.2 * run) * sw;
    P.legR.rotation.x = -s * (0.55 + 0.2 * run) * sw;
    P.legL.rotation.z = -0.03;
    P.legR.rotation.z = 0.03;
    // torso: bob, weight shift, hip roll, counter twist, lean into a run, breathing when still
    P.body.position.y = B.by - Math.abs(c) * 0.022 * sw + br * 0.003 * (1 - sw);
    P.body.position.x = B.bpx - s * 0.012 * sw;
    P.body.rotation.z = s * 0.04 * sw;
    P.body.rotation.y = -s * 0.08 * sw;
    P.body.rotation.x = B.bx + 0.06 * run * sw + br * 0.008 * (1 - sw);
    if (P.head) {
      P.head.rotation.y = s * 0.05 * sw;
      P.head.rotation.x = B.hx - 0.04 * run * sw;
    }
    // arms: skip while aiming, swinging or a gun is up
    const st = (u.c && u.c.st) || u.nf || {};
    if (u.aimT > 0 || st.sw > 0 || u.wk === 'gun') return;
    const melee = u.wk === 'melee',
      a = s * (0.42 + 0.25 * run) * sw;
    P.armR.rotation.x = (melee ? -0.15 : -0.12) + a;
    P.elR.rotation.x = -0.15 - 0.35 * run * sw - Math.max(0, a) * 0.3;
    P.armR.rotation.z = 0.06;
    if (melee) {
      P.armL.rotation.x = -0.55 - a * 0.25;
      P.elL.rotation.x = -1.0;
    } else {
      P.armL.rotation.x = -0.12 - a;
      P.elL.rotation.x = -0.15 - 0.35 * run * sw - Math.max(0, -a) * 0.3;
      P.armL.rotation.z = -0.06;
    }
  }
  const _sf = survFight;
  survFight = function (dt) {
    const r = _sf.apply(this, arguments);
    if (SW.on && typeof smesh !== 'undefined') {
      const d = Math.min(dt || 0.016, 0.05);
      for (const m of smesh) {
        const k = m.userData && m.userData.kind;
        if (k === 'surv' || k === 'comp')
          try {
            anim(m, d);
          } catch (e) {
            if (!SW.err) {
              SW.err = 1;
              console.warn('[survwalk]', e);
            }
          }
      }
    }
    return r;
  };
  console.log('[survwalk] survivor walk cycle');
})();
