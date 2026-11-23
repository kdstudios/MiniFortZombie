/* ==========================================================================================================
   MINI FORT ZOMBIE - FIRE (v076): animated sprite flames with a glow and flicker, replacing the orange-cone placeholders.
   - Flames: the 23-frame flipbook (js/data/fire-tex.js) on quads that face you (v079: each quad turns AND tilts toward the camera,
     pivoting on its base, tilt capped at ~70 deg, so the flame follows your view from above and below too). Two layers: an additive core that glows and a softer alpha layer that gives body.
     Every fire starts on its own frame and runs at its own speed, so neighbours never flicker in step. A wide fire (dumpster, long bin)
     is several overlapping flames.
   - Glow: a soft additive halo round the flames and a warm pool of light on the ground under them, both flickering.
   - Light: one real flickering point light, always on the nearest fire within 28 m (one light, so shaders never recompile).
   Cost: one texture shared by every fire, a handful of quads per fire, no per-frame allocation. Nothing here collides or blocks bullets.
   API: MFZFIRE.add(x, y, z, size=1, {w, ry, light}) -> handle (world coords, y = where the flames start); MFZFIRE.remove(handle);
        MFZFIRE.addLocal(B, lx, ly, lz, size, o) for builders (building-local coords).
   ========================================================================================================== */
(function () {
  'use strict';
  const D = window.MFZ_FIRE_TEX,
    T = THREE;
  if (!D) {
    console.warn('[fire] no flipbook texture');
    return;
  }
  const FI = (window.MFZFIRE = {list: [], on: true, fps: 24, stats: {}});
  let BASE = null,
    HALO = null,
    POOL = null,
    LIGHT = null;
  FI.baseTex = () => baseTex(); // v092: Options > Game Assets > Custom Textures replaces this texture's image
  function baseTex() {
    if (BASE) return BASE;
    const img = new Image();
    BASE = new T.Texture(img);
    img.onload = () => {
      BASE.needsUpdate = true;
    };
    img.src = D.src;
    BASE.minFilter = T.LinearFilter;
    BASE.magFilter = T.LinearFilter;
    BASE.generateMipmaps = false;
    BASE.wrapS = BASE.wrapT = T.ClampToEdgeWrapping;
    return BASE;
  }
  function radial(stops) {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const q = c.getContext('2d'),
      g = q.createRadialGradient(64, 64, 0, 64, 64, 64);
    stops.forEach(s => g.addColorStop(s[0], s[1]));
    q.fillStyle = g;
    q.fillRect(0, 0, 128, 128);
    return new T.CanvasTexture(c);
  }
  function haloTex() {
    return (
      HALO ||
      (HALO = radial([
        [0, 'rgba(255,170,80,.85)'],
        [0.25, 'rgba(255,120,40,.45)'],
        [0.6, 'rgba(255,80,20,.12)'],
        [1, 'rgba(255,60,10,0)']
      ]))
    );
  }
  function poolTex() {
    return (
      POOL ||
      (POOL = radial([
        [0, 'rgba(255,150,70,.75)'],
        [0.35, 'rgba(255,110,40,.35)'],
        [1, 'rgba(255,80,20,0)']
      ]))
    );
  }
  baseTex(); /* start decoding the flipbook now, so it is ready before the first fire is built */
  const QUAD = new T.PlaneGeometry(1, 1);
  QUAD.translate(0, 0.5, 0);
  const FLAT = new T.PlaneGeometry(1, 1);
  FLAT.rotateX(-Math.PI / 2);
  const ASPECT = D.fw / D.fh,
    RX = 1 / D.cols,
    RY = 1 / D.rows;
  function flameMat(add) {
    const t = baseTex().clone();
    t.repeat.set(RX, RY);
    t.needsUpdate = true;
    return new T.MeshBasicMaterial({
      map: t,
      transparent: true,
      depthWrite: false,
      side: T.DoubleSide,
      toneMapped: false,
      fog: true,
      blending: add ? T.AdditiveBlending : T.NormalBlending,
      color: add ? new T.Color(2.1, 1.45, 0.95) : new T.Color(1.15, 0.85, 0.7),
      opacity: add ? 1 : 0.55
    });
  }
  function noRay(m) {
    m.raycast = function () {};
    m.frustumCulled = false;
    return m;
  }
  FI.add = function (x, y, z, size, o) {
    o = o || {};
    size = size || 1;
    if (typeof scene === 'undefined' || !scene) return null;
    const g = new T.Group();
    g.position.set(x, y, z);
    g.userData.kind = 'fire';
    scene.add(g);
    const w = o.w || 0,
      n = w > size * 0.9 ? Math.max(2, Math.round(w / (size * 0.42))) : 1,
      ry = o.ry || 0,
      cs = Math.cos(ry),
      sn = Math.sin(ry),
      fl = [];
    for (let i = 0; i < n; i++) {
      const u = n > 1 ? (i / (n - 1) - 0.5) * w : 0,
        s = size * (n > 1 ? 0.75 + Math.random() * 0.35 : 1),
        ox = u * cs,
        oz = -u * sn;
      for (const add of [false, true]) {
        const m = noRay(new T.Mesh(QUAD, flameMat(add)));
        m.position.set(ox, 0, oz);
        m.scale.set(s * ASPECT, s, 1);
        m.rotation.order = 'YXZ';
        m.renderOrder = add ? 6 : 5;
        g.add(m);
        fl.push({m, ph: Math.random() * D.frames, sp: 0.85 + Math.random() * 0.3, add, s, ox, oz});
      }
    }
    const halo = noRay(
      new T.Sprite(
        new T.SpriteMaterial({
          map: haloTex(),
          transparent: true,
          depthWrite: false,
          blending: T.AdditiveBlending,
          toneMapped: false,
          opacity: 0.55
        })
      )
    );
    halo.position.set(0, size * 0.45, 0);
    halo.scale.setScalar(size * 2.4 + w * 0.6);
    halo.renderOrder = 4;
    g.add(halo);
    const gy = (typeof groundAt === 'function' ? groundAt(x, z, y + 0.1) : 0) - y + 0.035,
      pr = size * 2.2 + w * 0.8;
    const pool = noRay(
      new T.Mesh(
        FLAT,
        new T.MeshBasicMaterial({
          map: poolTex(),
          transparent: true,
          depthWrite: false,
          blending: T.AdditiveBlending,
          toneMapped: false,
          opacity: 0.5
        })
      )
    );
    pool.position.set(0, gy, 0);
    pool.scale.set(pr * 2, 1, pr * 2);
    pool.renderOrder = 3;
    g.add(pool);
    const h = {g, fl, halo, pool, size, w, x, y, z, seed: Math.random() * 100, light: o.light !== false};
    FI.list.push(h);
    FI.stats.fires = FI.list.length;
    return h;
  };
  FI.addLocal = function (B, lx, ly, lz, size, o) {
    o = Object.assign({}, o || {});
    if (o.ry !== undefined && B.cs < 0) o.ry += Math.PI;
    return FI.add(WX(B, lx), (B.y || 0) + ly, WZ(B, lz), size, o);
  };
  FI.remove = function (h) {
    const i = FI.list.indexOf(h);
    if (i >= 0) FI.list.splice(i, 1);
    if (h && h.g && h.g.parent) h.g.parent.remove(h.g);
  };
  /* smooth pseudo-noise for the flicker */
  const nz = t => Math.sin(t * 7.3) * 0.45 + Math.sin(t * 13.1 + 1.7) * 0.3 + Math.sin(t * 23.7 + 4.1) * 0.25;
  const CAM = new T.Vector3();
  function tick() {
    requestAnimationFrame(tick);
    if (typeof scene === 'undefined' || !scene || typeof camera === 'undefined' || !camera) return;
    if (!LIGHT) {
      LIGHT = new T.PointLight(0xff8a3a, 0, 10, 2);
      LIGHT.userData.fireLight = 1;
    }
    if (LIGHT.parent !== scene) scene.add(LIGHT); /* always present (at 0) so the light count never changes */
    if (!FI.list.length) {
      LIGHT.intensity = 0;
      return;
    }
    // fires whose group left the scene (world cleared) are dropped
    if (FI.list.some(h => !h.g.parent)) {
      FI.list = FI.list.filter(h => h.g.parent);
      FI.stats.fires = FI.list.length;
    }
    const t = performance.now() / 1000;
    camera.getWorldPosition(CAM);
    let near = null,
      nd = 28 * 28;
    for (const h of FI.list) {
      const dx = CAM.x - h.x,
        dz = CAM.z - h.z,
        d2 = dx * dx + dz * dz;
      const vis = d2 < 90 * 90;
      h.g.visible = vis;
      if (!vis) continue;
      if (h.light && d2 < nd) {
        nd = d2;
        near = h;
      }
      const f = nz(t + h.seed);
      /* v079: every flame quad turns to face the camera on its own (yaw from its own spot, so the side flames of a wide fire face you too)
     and tilts toward the camera when you look down or up at it, pivoting on its base so it stays on the fuel. Tilt capped at ~70 deg. */
      for (const q of h.fl) {
        const qx = CAM.x - (h.x + q.ox),
          qz = CAM.z - (h.z + q.oz),
          qy = CAM.y - (h.y + q.s * 0.45),
          hd = Math.hypot(qx, qz);
        q.m.rotation.y = Math.atan2(qx, qz);
        q.m.rotation.x = -Math.max(-1.22, Math.min(1.22, Math.atan2(qy, Math.max(hd, 1e-3))));
        const fr = Math.floor((t * FI.fps * q.sp + q.ph) % D.frames),
          c = fr % D.cols,
          r = Math.floor(fr / D.cols);
        q.m.material.map.offset.set(c * RX, 1 - (r + 1) * RY);
        const k = 1 + f * 0.05;
        q.m.scale.y = q.s * k;
      }
      h.halo.material.opacity = 0.42 + f * 0.14;
      h.halo.scale.setScalar((h.size * 2.4 + h.w * 0.6) * (1 + f * 0.06));
      h.pool.material.opacity = 0.42 + f * 0.12;
    }
    if (near && FI.on) {
      const f = nz(t * 1.3 + near.seed);
      LIGHT.position.set(near.x, near.y + near.size * 0.7, near.z);
      LIGHT.intensity = (1.5 + f * 0.45) * Math.min(1.6, near.size + near.w * 0.25);
      LIGHT.distance = 8 + near.size * 3 + near.w;
    } else LIGHT.intensity = 0;
  }
  requestAnimationFrame(tick);
  if (typeof clearWorld === 'function') {
    const _cw = clearWorld;
    clearWorld = function () {
      FI.list.length = 0;
      return _cw.apply(this, arguments);
    };
  }
  console.log('[fire] sprite fire ready (' + D.frames + ' frames)');
})();
