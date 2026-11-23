/* =====================================================================================================
   REVISION 039 - PERFORMANCE PASS (separate script block, loaded after the Dev Toolkit)
   Everything here either replaces a hot function (blocked / los / look / rayWorld / groundAt / lighting / streetLight /
   mesh / clearWorld / buildWorld) or adds a post-generation optimisation pass. Add ?noperf to the page URL to skip the
   post-generation pass (merge / instance / freeze / cull) for A/B comparison - the faster collision + ray code stays on.
   ===================================================================================================== */
(function () {
  const PF = (window.PF = {
    recs: [],
    pool: null,
    glow: null,
    mm: new Map(),
    im: new Map(),
    t: 0,
    lt: 0,
    fa: 0,
    fn: 0,
    cool: 0,
    stats: ''
  });
  const OFF = /[?&]noperf/.test(location.search);
  /* v088: the HUD rewrites a dozen text fields every frame (health, stamina, clock, day, objective, ammo...), almost always with the
     text they already show. Each write replaces the text node and makes the browser redo style and layout for the HUD. Writing the
     same text again is now skipped (the page ends up exactly the same). */
  {
    const d = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent');
    if (d && d.set && d.get)
      Object.defineProperty(Node.prototype, 'textContent', {
        configurable: true,
        enumerable: d.enumerable,
        get: d.get,
        set(v) {
          const f = this.firstChild;
          if (f && f.nodeType === 3 && !f.nextSibling && f.data === (v == null ? '' : String(v))) return;
          d.set.call(this, v);
        }
      });
  }
  /* v088: lights that give no light cost nothing. three evaluates the full lighting model for every point / spot light in every pixel
     of every lit material, lit or not: by day that is the torch, the street-lamp pool and the muzzle-flash light, five dark lights
     per pixel. Each light's contribution is now skipped when it is zero (dark, out of range or outside the cone). The result is
     identical (a zero light added zero); only the wasted work goes. Patched before any shader is compiled. */
  {
    const C = THREE.ShaderChunk,
      k = 'lights_fragment_begin',
      call = 'RE_Direct( directLight, geometry, material, reflectedLight );';
    if (C[k] && C[k].includes(call)) C[k] = C[k].split(call).join('if ( directLight.visible ) { ' + call + ' }');
  }
  const I4 = new THREE.Matrix4();

  /* ---------- spatial grid for solids (items 10, 11) ---------- */
  function Grid(cs) {
    this.cs = cs;
    this.m = new Map();
    this.big = [];
    this.count = 0;
    this.stamp = 0;
  }
  const gk = (ix, iz) => (ix + 2048) * 4096 + (iz + 2048);
  Grid.prototype.add = function (b) {
    this.count++;
    if (!b || !isFinite(b.min.x) || !isFinite(b.max.x) || !isFinite(b.min.z) || !isFinite(b.max.z)) return;
    const cs = this.cs,
      x0 = Math.floor(b.min.x / cs),
      x1 = Math.floor(b.max.x / cs),
      z0 = Math.floor(b.min.z / cs),
      z1 = Math.floor(b.max.z / cs);
    if ((x1 - x0 + 1) * (z1 - z0 + 1) > 64) {
      this.big.push(b);
      return;
    }
    for (let ix = x0; ix <= x1; ix++)
      for (let iz = z0; iz <= z1; iz++) {
        const k = gk(ix, iz);
        let a = this.m.get(k);
        if (!a) {
          a = [];
          this.m.set(k, a);
        }
        a.push(b);
      }
  };
  Grid.prototype.del = function (b) {
    this.count--;
    if (!b) return;
    const bi = this.big.indexOf(b);
    if (bi >= 0) {
      this.big.splice(bi, 1);
      return;
    }
    const cs = this.cs,
      x0 = Math.floor(b.min.x / cs),
      x1 = Math.floor(b.max.x / cs),
      z0 = Math.floor(b.min.z / cs),
      z1 = Math.floor(b.max.z / cs);
    for (let ix = x0; ix <= x1; ix++)
      for (let iz = z0; iz <= z1; iz++) {
        const a = this.m.get(gk(ix, iz));
        if (a) {
          const i = a.indexOf(b);
          if (i >= 0) a.splice(i, 1);
        }
      }
  };
  function SG() {
    let g = solids.G;
    if (!g || g.count !== solids.length) {
      g = solids.G = new Grid(4);
      for (const b of solids) g.add(b);
    }
    return g;
  }
  function WG() {
    let g = walkables.G;
    if (!g || g.count !== walkables.length) {
      g = walkables.G = new Grid(4);
      for (const b of walkables) g.add(b);
    }
    return g;
  }

  blocked = function (x, z, r = 0.4, fy = 0, hh = 1.8) {
    TB.min.set(x - r, fy + 0.05, z - r);
    TB.max.set(x + r, fy + hh, z + r);
    const g = SG(),
      cs = g.cs,
      x0 = Math.floor((x - r) / cs),
      x1 = Math.floor((x + r) / cs),
      z0 = Math.floor((z - r) / cs),
      z1 = Math.floor((z + r) / cs);
    for (let ix = x0; ix <= x1; ix++)
      for (let iz = z0; iz <= z1; iz++) {
        const a = g.m.get(gk(ix, iz));
        if (!a) continue;
        for (let i = 0; i < a.length; i++) {
          const s = a[i];
          if (s && s.intersectsBox(TB)) return s;
        }
      }
    for (const s of g.big) if (s && s.intersectsBox(TB)) return s;
    return null;
  };

  groundAt = function (x, z, fy) {
    let gy = 0;
    const test = q => {
      if (
        q.max.y <= fy + 0.32 &&
        q.max.y > gy &&
        x > q.min.x - 0.3 &&
        x < q.max.x + 0.3 &&
        z > q.min.z - 0.3 &&
        z < q.max.z + 0.3
      )
        gy = q.max.y;
    };
    for (const gr of [SG(), WG()]) {
      const cs = gr.cs,
        x0 = Math.floor((x - 0.3) / cs),
        x1 = Math.floor((x + 0.3) / cs),
        z0 = Math.floor((z - 0.3) / cs),
        z1 = Math.floor((z + 0.3) / cs);
      for (let ix = x0; ix <= x1; ix++)
        for (let iz = z0; iz <= z1; iz++) {
          const a = gr.m.get(gk(ix, iz));
          if (a)
            for (let i = 0; i < a.length; i++) {
              const q = a[i];
              if (q) test(q);
            }
        }
      for (const q of gr.big) if (q) test(q);
    }
    return gy;
  };

  /* v081: sight knows about floors. On one floor the 2D slice is 1.5 m above THAT floor (it was 1.5 m above the ground, so upstairs
     walls and doors never blocked it); between floors a real 3D segment test, so ceilings and floor slabs block it too. */
  const feetOf = v => (v === pl.position ? v.y - (G.eyeUsed || 1.6) : v.y || 0);
  const inB3 = (q, x, y, z) =>
    x >= q.min.x && x <= q.max.x && y >= q.min.y && y <= q.max.y && z >= q.min.z && z <= q.max.z;
  function seg3(q, ax, ay, az, bx, by, bz) {
    if (inB3(q, ax, ay, az) || inB3(q, bx, by, bz)) return false;
    let t0 = 0,
      t1 = 1;
    const o = [ax, ay, az],
      d = [bx - ax, by - ay, bz - az],
      mn = [q.min.x, q.min.y, q.min.z],
      mx = [q.max.x, q.max.y, q.max.z];
    for (let k = 0; k < 3; k++) {
      if (Math.abs(d[k]) < 1e-9) {
        if (o[k] < mn[k] || o[k] > mx[k]) return false;
        continue;
      }
      let ta = (mn[k] - o[k]) / d[k],
        tb = (mx[k] - o[k]) / d[k];
      if (ta > tb) {
        const t = ta;
        ta = tb;
        tb = t;
      }
      if (ta > t0) t0 = ta;
      if (tb < t1) t1 = tb;
      if (t0 > t1) return false;
    }
    return true;
  }
  los = function (a, b, strict) {
    const x0 = Math.min(a.x, b.x),
      x1 = Math.max(a.x, b.x),
      z0 = Math.min(a.z, b.z),
      z1 = Math.max(a.z, b.z),
      fA = feetOf(a),
      fB = feetOf(b),
      cross = Math.abs(fA - fB) > 1.2,
      hs = fA + 1.5,
      ay = fA + 1.5,
      by = fB + 1.5;
    const g = SG(),
      cs = g.cs,
      st = ++g.stamp,
      cx0 = Math.floor(x0 / cs),
      cx1 = Math.floor(x1 / cs),
      cz0 = Math.floor(z0 / cs),
      cz1 = Math.floor(z1 / cs);
    const hit = q => {
      if (!q || q.__s === st) return false;
      q.__s = st;
      if (q.bar || (q.win && !strict) || q.max.x < x0 || q.min.x > x1 || q.max.z < z0 || q.min.z > z1) return false;
      if (cross) return seg3(q, a.x, ay, a.z, b.x, by, b.z);
      if (q.max.y <= hs || q.min.y >= hs) return false;
      if (inBox2(q, a) || inBox2(q, b)) return false;
      return segHit2(q, a.x, a.z, b.x, b.z);
    };
    for (let ix = cx0; ix <= cx1; ix++)
      for (let iz = cz0; iz <= cz1; iz++) {
        const arr = g.m.get(gk(ix, iz));
        if (arr) for (let i = 0; i < arr.length; i++) if (hit(arr[i])) return false;
      }
    for (const q of g.big) if (hit(q)) return false;
    if (sight.length) {
      const dx = b.x - a.x,
        dz = b.z - a.z,
        d = Math.hypot(dx, dz),
        n = Math.ceil(d / 0.3);
      P3.y = hs;
      const near = [];
      for (const q of sight) if (!(q.max.x < x0 || q.min.x > x1 || q.max.z < z0 || q.min.z > z1)) near.push(q);
      if (near.length)
        for (let i = 1; i < n; i++) {
          const t = i / n;
          if (t * d > 0.8 && (1 - t) * d > 0.8) {
            P3.x = a.x + dx * t;
            P3.z = a.z + dz * t;
            if (cross) P3.y = ay + (by - ay) * t;
            for (const q of near) if (q.containsPoint(P3)) return false;
          }
        }
    }
    return true;
  };

  /* cached line of sight for zombie -> survivor checks (re-tested every ~0.2-0.3s, staggered by random jitter) */
  window.losC = function (z, m) {
    const u = z.userData,
      c = u.lcm || (u.lcm = new Map()),
      t = performance.now();
    let e = c.get(m);
    if (!e || t > e.t) {
      e = {v: los(z.position, m.position), t: t + 200 + Math.random() * 100};
      c.set(m, e);
    }
    return e.v;
  };

  /* ---------- ray scanning: only near / visible things (item 9) ---------- */
  const LIVEK = new Set(['zombie', 'corpse', 'surv', 'npc', 'comp', 'loot']),
    RB = new THREE.Vector3(),
    SPH = new THREE.Sphere();
  function scanRay(o, hits) {
    for (const c of o.children) {
      if (c === pl || c.visible === false) continue;
      const u = c.userData;
      if (c.parent === scene) {
        if (u.bb) {
          if (!u.bb.containsPoint(ray.ray.origin)) {
            if (!ray.ray.intersectBox(u.bb, RB) || RB.distanceToSquared(ray.ray.origin) > ray.far * ray.far) continue;
          }
        } else if (
          u.kind &&
          LIVEK.has(u.kind) &&
          c.position.distanceToSquared(ray.ray.origin) > (ray.far + 8) * (ray.far + 8)
        )
          continue;
      }
      if (c.isMesh || c.isLine || c.isPoints || c.isSprite) {
        /* v088: three's mesh raycast ignores ray.far until it reaches the triangles, so a short ray (a use prompt, 3.6 m) still
           walked every triangle of big merged meshes further along the line. Skip a mesh whose bounds lie wholly beyond the range. */
        const g = c.isMesh && !c.isInstancedMesh ? c.geometry : null;
        let skip = false;
        if (g && g.attributes && g.attributes.position) {
          if (!g.boundingSphere) g.computeBoundingSphere();
          SPH.copy(g.boundingSphere).applyMatrix4(c.matrixWorld);
          skip = SPH.center.distanceTo(ray.ray.origin) - SPH.radius > ray.far;
        }
        if (!skip) ray.intersectObject(c, false, hits);
      }
      if (c.children.length) scanRay(c, hits);
    }
  }
  look = function (thru, v, far) {
    ray.setFromCamera(v || C0, camera);
    ray.far = far || 40; // v088: callers that only care about something within reach pass a short range (far less to test)
    const hits = [];
    scanRay(scene, hits);
    hits.sort((a, b) => a.distance - b.distance);
    for (const i of hits) {
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
  };
  rayWorld = function (o, dir, far, skip) {
    ray.set(o, dir);
    ray.far = far;
    const hits = [];
    scanRay(scene, hits);
    hits.sort((a, b) => a.distance - b.distance);
    for (const i of hits) {
      if (i.object.isSprite || !i.object.visible || i.distance < 0.3) continue;
      const ow = own(i.object);
      if (ow && (ow === skip || ow.userData.thru)) continue;
      return {p: i.point, n: i.face ? i.face.normal.clone().transformDirection(i.object.matrixWorld) : null, o: ow};
    }
    return null;
  };

  /* ---------- bullet holes: only on static world surfaces (bug 2) + wounds on zombies (bug 3) ---------- */
  window.holeOK = function (h) {
    const m = h && h.m;
    if (!m || m.isSprite || !h.n) return false;
    const o = h.o;
    if (o && (LIVE.has(o.userData.kind) || o.userData.kind === 'loot' || o.userData.kind === 'door')) return false;
    for (let a = m; a && a !== scene; a = a.parent) {
      if (a.userData && (a.userData.part || a.userData.wound)) return false;
      for (const L of limbs) if (L.m === a) return false;
    }
    if (PF.built) return m.matrixAutoUpdate === false || !!m.userData.surf;
    for (let a = m; a; a = a.parent) if (a.userData && a.userData.kind) return false;
    return true;
  };
  let WND_MAT = null,
    WND_GEO = null;
  window.addWound = function (h) {
    if (!h || !h.m || !h.p || !h.n) return;
    const m = h.m;
    if (!WND_MAT) {
      const cv = document.createElement('canvas');
      cv.width = cv.height = 32;
      const c = cv.getContext('2d'),
        g = c.createRadialGradient(16, 16, 0, 16, 16, 15);
      g.addColorStop(0, 'rgba(70,0,0,1)');
      g.addColorStop(0.4, 'rgba(165,8,8,.97)');
      g.addColorStop(0.75, 'rgba(150,0,0,.6)');
      g.addColorStop(1, 'rgba(150,0,0,0)');
      c.fillStyle = g;
      c.fillRect(0, 0, 32, 32);
      WND_MAT = new THREE.MeshBasicMaterial({
        map: new THREE.CanvasTexture(cv),
        transparent: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -6,
        polygonOffsetUnits: -6
      });
      WND_GEO = new THREE.PlaneGeometry(0.1, 0.1);
    }
    m.updateWorldMatrix(true, false);
    const w = new THREE.Mesh(WND_GEO, WND_MAT),
      lp = m.worldToLocal(h.p.clone()),
      ln = m.worldToLocal(h.p.clone().add(h.n)).sub(lp).normalize();
    m.add(w);
    w.position.copy(lp).addScaledVector(ln, 0.012);
    w.lookAt(h.p.clone().add(h.n));
    w.rotateZ(rnd(0, TAU));
    const s = rnd(0.8, 1.4);
    w.scale.set(s, s, 1);
    w.raycast = () => {};
    w.renderOrder = 3;
    w.userData = {wound: 1};
    const L = m.userData.wl || (m.userData.wl = []);
    L.push(w);
    if (L.length > 6) m.remove(L.shift());
  };

  /* ---------- materials / meshes (items 2, 4) ---------- */
  function pfMat(c) {
    return PERF.mat === 'lambert'
      ? new THREE.MeshLambertMaterial({color: c})
      : new THREE.MeshPhongMaterial({color: c, specular: 0, shininess: 0});
  }
  /* v100: distance fade. Everything fogged (basic / lambert / phong / standard / points / lines, skinned and instanced too) fades out in a
     dither over the last part of the camera's far plane instead of popping when perfCull hides it. perfCull sets camera.far = 1.25 * the
     render distance D, so the fade is complete at D (where objects are culled) and starts at ~0.85 D (by then ~98% fogged, so the dither is hard to see). Done in three's fog chunks, so no
     per-material work and no uniforms: the far plane is read back from the projection matrix in the vertex shader. ?nofade disables. */
  /* Modes (Graphics > Distance fade, RGFX.s.fade): 2 Smooth (alpha-to-coverage, needs AA + WebGL2, else it falls back to Dither), 1 Dither,
     0 Off. The shaders are patched once; the mode is chosen per material through material.defines (RG_A2C / RG_DITHER), so changing it
     recompiles (material.needsUpdate) and the loader warm-up re-warms. URL: ?nofade forces Off, ?noa2c caps at Dither. */
  try {
    const SC = THREE.ShaderChunk,
      sub = (n, a, b) => {
        if (SC[n] && SC[n].indexOf(a) >= 0 && SC[n].indexOf('vRgFade') < 0) SC[n] = SC[n].replace(a, b);
      };
    sub('fog_pars_vertex', 'varying float vFogDepth;', 'varying float vFogDepth;\n\tvarying float vRgFade;');
    sub(
      'fog_vertex',
      'vFogDepth = - mvPosition.z;',
      'vFogDepth = - mvPosition.z;\n\tfloat rgF = isOrthographic ? 1.0e6 : projectionMatrix[3][2] / (projectionMatrix[2][2] + 1.0);\n\tvRgFade = (vFogDepth - rgF * 0.68) / (rgF * 0.12);'
    );
    sub('fog_pars_fragment', 'varying float vFogDepth;', 'varying float vFogDepth;\n\tvarying float vRgFade;');
    sub(
      'fog_fragment',
      '#ifdef USE_FOG',
      '#ifdef USE_FOG\n#ifdef RG_A2C\n\tgl_FragColor.a *= 1.0 - clamp(vRgFade, 0.0, 1.0);\n#elif defined(RG_DITHER)\n\tif (vRgFade > 0.0 && fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))) < min(vRgFade, 1.0)) discard;\n#endif'
    );
    const q = location.search,
      noFade = /[?&]nofade/.test(q),
      noA2C = /[?&]noa2c/.test(q);
    const mode = () => {
      let m = window.RGFX && RGFX.s && RGFX.s.fade != null ? RGFX.s.fade | 0 : 2;
      if (noFade) m = 0;
      else if (noA2C && m > 1) m = 1;
      return m;
    };
    const a2cOK = () =>
      mode() === 2 && typeof PERF !== 'undefined' && PERF.aa === true && typeof renderer !== 'undefined' && !!renderer.capabilities.isWebGL2;
    PERF.fadeMode = () => (mode() === 2 && !a2cOK() ? 1 : mode()); // the mode actually in use (Smooth falls back to Dither without AA)
    const A2C_DEF = {RG_A2C: 1},
      DITH_DEF = {RG_DITHER: 1},
      pick = m => {
        if (m.fog !== true || m.isShaderMaterial) return null;
        const k = mode();
        if (!k) return null;
        return k === 2 && !m.transparent && a2cOK() ? 'RG_A2C' : 'RG_DITHER';
      };
    const MP = THREE.Material.prototype;
    /* three r147 has no ALPHA_TO_COVERAGE shader define, so our own RG_A2C goes in material.defines next to the alphaToCoverage flag */
    Object.defineProperty(MP, 'alphaToCoverage', {configurable: true, get() { return pick(this) === 'RG_A2C'; }, set() {}});
    Object.defineProperty(MP, 'defines', {
      configurable: true,
      get() {
        const k = pick(this);
        return k === 'RG_A2C' ? A2C_DEF : k ? DITH_DEF : undefined;
      },
      set(v) {
        /* the stored object itself carries the define (set or removed on each read) so code that mutates material.defines keeps working */
        let d = v;
        const sh = this.isShaderMaterial;
        Object.defineProperty(this, 'defines', {
          configurable: true,
          enumerable: true,
          get() {
            if (!sh && d && typeof d === 'object') {
              const k = pick(this);
              if (k === 'RG_A2C') (d.RG_A2C = 1), delete d.RG_DITHER;
              else if (k) (d.RG_DITHER = 1), delete d.RG_A2C;
              else delete d.RG_A2C, delete d.RG_DITHER;
            }
            return d;
          },
          set(n) {
            d = n;
          }
        });
      }
    });
    /* changing the mode (or AA): every material recompiles, then the loader warms the new programs behind its Loading screen */
    PERF.applyFade = function () {
      try {
        const seen = new Set();
        for (const sc of [scene, window.RGX && RGX.vm && RGX.vm.scene].filter(Boolean))
          sc.traverse(o => {
            for (const m of [].concat(o.material || []))
              if (!seen.has(m)) {
                seen.add(m);
                m.needsUpdate = true;
              }
          });
        if (window.MFZLOAD && MFZLOAD.afterBuild && G && G.mode !== 'TITLE') MFZLOAD.afterBuild();
      } catch (e) {
        console.warn('[perf] applyFade', e);
      }
    };
    const reg = () => {
      if (window.RGFX && RGFX.onChange)
        RGFX.onChange(k => {
          if (k === 'fade' || k === '*') PERF.applyFade();
        });
      else setTimeout(reg, 300);
    };
    reg();
  } catch (e) {
    console.warn('[perf] fade patch', e);
  }
  mesh = function (g, c, x, y, z, p) {
    const m = new THREE.Mesh(g, pfMat(c));
    m.position.set(x, y, z);
    m.userData.pfm = 1;
    (p || scene).add(m);
    return m;
  };

  /* ---------- street lights: fake glow + a few real lights (item 3) ---------- */
  streetLight = function (x, z) {
    const g = new THREE.Group();
    g.position.set(x, 0, z);
    scene.add(g);
    mesh(new THREE.CylinderGeometry(0.1, 0.15, 6, 6), 0x2a2a2a, 0, 3, 0, g);
    const head = mesh(new THREE.BoxGeometry(0.8, 0.3, 0.8), 0x1a1a1a, 0, 6.15, 0, g);
    solids.push(new THREE.Box3(new THREE.Vector3(x - 0.15, 0, z - 0.15), new THREE.Vector3(x + 0.15, 6, z + 0.15)));
    g.userData = {kind: 'light', inst: 1};
    if (Math.random() < 0.55) {
      head.material.emissive.setHex(0x664400);
      streetLights.push({x, y: 5.9, z});
    }
  };
  const CL = new THREE.Color(),
    LA = new THREE.Color(0x05070a),
    LB = new THREE.Color(0x7092be),
    LS = new THREE.Color();
  lighting = function () {
    const d = THREE.MathUtils.clamp(Math.sin(((G.time - 6) / 24) * TAU) * 2 + 0.3, 0, 1);
    LS.copy(LA).lerp(LB, d);
    if (!scene.background || !scene.background.isColor) scene.background = new THREE.Color();
    scene.background.copy(LS);
    scene.fog.color.copy(LS);
    dirL.intensity = 0.2 + 0.9 * d;
    ambL.intensity = 0.18 + 0.5 * d;
    dirL.position.set(
      Math.cos(((G.time - 6) / 24) * TAU) * 80,
      Math.abs(Math.sin(((G.time - 6) / 24) * TAU)) * 80 + 10,
      20
    );
    PF.night = G.time >= 20 || G.time < 5;
    if (PF.glow) PF.glow.material.opacity = PF.night ? 0.95 : 0;
  };
  function glowTex() {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 64;
    const c = cv.getContext('2d'),
      g = c.createRadialGradient(32, 32, 0, 32, 32, 31);
    g.addColorStop(0, 'rgba(255,235,170,1)');
    g.addColorStop(0.25, 'rgba(255,205,110,.55)');
    g.addColorStop(1, 'rgba(255,190,90,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(cv);
  }
  /* v101: the lamp pool and the fire light are always in the scene "so the light count never changes", but at 0 intensity (all day) every
     lit pixel of the world still loops over 4 point lights. F7 showed lighting costs ~8 ms JS and ~9 ms GPU per frame. Hide them while
     they are all dark: two shader variants (lights on / off), both compiled in the loading warm-up (L.warm), so switching never compiles.
     OPT-IN (?lightgate): v101 test showed no frame-time gain and +12 s warm-up. */
  const gateLights = () => {
    const a = (PF.pool || []).slice();
    for (const c of scene.children)
      if (c.isPointLight && c.userData && c.userData.fireLight && !a.includes(c)) a.push(c);
    return a;
  };
  PERF.lightSet = function (on) {
    const a = gateLights(),
      prev = a.map(l => l.visible);
    a.forEach(l => (l.visible = on));
    return () => a.forEach((l, i) => (l.visible = prev[i]));
  };
  let gateHold = 0,
    gateT = 0;
  function lightGate() {
    if (!scene || !/[?&]lightgate/.test(location.search)) return;
    const now = performance.now(),
      a = gateLights();
    if (!a.length) return;
    const any = a.some(l => l.intensity > 0.001);
    if (any) gateHold = now + 2500;
    const want = any || now < gateHold;
    for (const l of a) if (l.visible !== want) l.visible = want;
    PF.gate = want;
  }
  function perfLamps() {
    lightGate();
    if (!PF.pool) return;
    const L = streetLights,
      pool = PF.pool;
    if (!PF.night || !L.length) {
      for (const l of pool) l.intensity = 0;
      return;
    }
    const px = pl.position.x,
      pz = pl.position.z,
      best = [];
    for (const s of L) {
      const d = (s.x - px) * (s.x - px) + (s.z - pz) * (s.z - pz);
      if (d > 2500) continue;
      let i = best.length;
      while (i > 0 && best[i - 1].d > d) i--;
      if (i < pool.length) {
        best.splice(i, 0, {s, d});
        if (best.length > pool.length) best.pop();
      }
    }
    pool.forEach((l, i) => {
      const b = best[i];
      if (b) {
        l.position.set(b.s.x, b.s.y, b.s.z);
        l.intensity = 1.4;
      } else l.intensity = 0;
    });
  }

  /* v105 (opt-in, ?lite): v104 F7 showed the PBR MeshStandard shader is the lit-material cost (plain Standard unlit saves 4.1 ms,
     custom-shader Standard 3.4 ms, Lambert/Phong 0.2 ms). Swap plain Standard materials for Lambert (same colour / map / vertex colours /
     alpha; no PBR specular and no environment light) on every mesh in the world. One Lambert per Standard, shared. */
  const LITE_OFF_MAPS = [
    'normalMap',
    'bumpMap',
    'roughnessMap',
    'metalnessMap',
    'aoMap',
    'lightMap',
    'emissiveMap',
    'displacementMap',
    'envMap'
  ];
  PERF.lite = function () {
    if (!/[?&]lite/.test(location.search) || !scene) return 0;
    const cache = (PERF.liteMap = PERF.liteMap || new Map());
    let n = 0;
    scene.traverse(o => {
      const m = o.material;
      if (!o.isMesh || !m || Array.isArray(m) || !m.isMeshStandardMaterial || m.isMeshPhysicalMaterial) return;
      if (m.onBeforeCompile !== THREE.Material.prototype.onBeforeCompile || m.flatShading || m.metalness > 0.3) return;
      if (m.userData && m.userData.noLite) return;
      let l = cache.get(m);
      if (l === undefined) {
        const ok = !LITE_OFF_MAPS.some(k => k !== 'envMap' && m[k]);
        l = ok
          ? new THREE.MeshLambertMaterial({
              color: m.color,
              map: m.map,
              vertexColors: m.vertexColors,
              side: m.side,
              transparent: m.transparent,
              opacity: m.opacity,
              alphaTest: m.alphaTest,
              depthWrite: m.depthWrite,
              emissive: m.emissive,
              emissiveIntensity: m.emissiveIntensity,
              alphaMap: m.alphaMap
            })
          : null;
        if (l) l.userData = Object.assign({}, m.userData, {lite: 1});
        cache.set(m, l);
      }
      if (l) {
        o.material = l;
        n++;
      }
    });
    PERF.liteN = (PERF.liteN || 0) + n;
    return n;
  };

  /* ---------- zombies / survivors: merge each rigid body part's meshes (28 meshes -> ~10) ---------- */
  window.mergeHuman = function (g, P) {
    if (OFF) return;
    try {
      for (const grp of [P.body, P.head, P.armL, P.elL, P.armR, P.elR, P.legL, P.legR]) {
        if (!grp) continue;
        const by = new Map();
        for (const m of grp.children) {
          if (!m.isMesh || !m.userData || m.userData.pfm !== 1 || !mergeable(m)) continue;
          const k = sigNC(m.material) + '|' + (m.userData.part || '');
          let a = by.get(k);
          if (!a) by.set(k, (a = []));
          a.push(m);
        }
        for (const ms of by.values()) {
          if (ms.length < 2) continue;
          const geo = buildMerged(ms, null, true),
            e = ms[0].material.emissive ? ms[0].material.emissive.getHex() : 0,
            mt =
              PERF.mat === 'lambert'
                ? new THREE.MeshLambertMaterial({vertexColors: true, emissive: e})
                : new THREE.MeshPhongMaterial({vertexColors: true, emissive: e, specular: 0, shininess: 0}),
            mm = new THREE.Mesh(geo, mt),
            ud = {pfm: 2};
          if (ms[0].userData.part !== undefined) ud.part = ms[0].userData.part;
          if (ms[0].userData.head) ud.head = 1;
          mm.userData = ud;
          mm.matrixAutoUpdate = false;
          grp.add(mm);
          for (const m of ms) grp.remove(m);
        }
      }
    } catch (err) {
      console.warn('[perf039] mergeHuman', err);
    }
  };

  /* ---------- build pass: merge static meshes, instance trees/lamps, freeze matrices (items 1, 5, 7) ---------- */
  const sigNC = m => m.type + '|' + (m.emissive ? m.emissive.getHex() : 0) + '|' + m.side;
  const sigC = m => sigNC(m) + '|' + m.color.getHex() + '|' + (m.flatShading ? 1 : 0);
  function mergeable(m) {
    const mt = m.material;
    if (
      !m.userData ||
      m.userData.pfm !== 1 ||
      !m.visible ||
      !mt ||
      Array.isArray(mt) ||
      mt.map ||
      mt.transparent ||
      mt.opacity < 1
    )
      return false;
    if (!(mt.isMeshPhongMaterial || mt.isMeshLambertMaterial || mt.isMeshBasicMaterial || mt.isMeshStandardMaterial))
      return false;
    const g = m.geometry;
    if (!g || !g.attributes || !g.attributes.position || !g.attributes.normal) return false;
    if (m.raycast !== THREE.Mesh.prototype.raycast) return false;
    const pr = g.parameters;
    if (pr && (pr.width >= 100 || pr.height >= 100)) return false;
    return true;
  }
  function mergedMat(m) {
    if (window.RGW) {
      const r = RGW.mergedMat(m);
      if (r) return r;
    }
    const k = sigNC(m.material);
    let x = PF.mm.get(k);
    if (!x) {
      const mt = m.material,
        o = {vertexColors: true, side: mt.side};
      if (mt.isMeshBasicMaterial) x = new THREE.MeshBasicMaterial(o);
      else {
        if (mt.emissive) o.emissive = mt.emissive.getHex();
        x =
          PERF.mat === 'lambert'
            ? new THREE.MeshLambertMaterial(o)
            : new THREE.MeshPhongMaterial(Object.assign(o, {specular: 0, shininess: 0}));
      }
      PF.mm.set(k, x);
    }
    return x;
  }
  const V1 = new THREE.Vector3(),
    V2 = new THREE.Vector3(),
    V3 = new THREE.Vector3(),
    NM = new THREE.Matrix3(),
    MM = new THREE.Matrix4();
  function buildMerged(list, inv, local) {
    const P = [],
      N = [],
      C = [],
      I = [],
      TC = [];
    let off = 0;
    for (const m of list) {
      const tcv = window.RGW ? RGW.tag(m) : 0;
      const g = m.geometry,
        pa = g.attributes.position,
        na = g.attributes.normal,
        ix = g.index,
        col = m.material.color,
        flat = !!m.material.flatShading;
      if (local) {
        m.updateMatrix();
        MM.copy(m.matrix);
      } else MM.multiplyMatrices(inv, m.matrixWorld);
      NM.getNormalMatrix(MM);
      const mir = MM.determinant() < 0;
      if (flat) {
        const n = ix ? ix.count : pa.count;
        for (let i = 0; i + 2 < n; i += 3) {
          const a = ix ? ix.getX(i) : i,
            b = ix ? ix.getX(i + 1) : i + 1,
            c = ix ? ix.getX(i + 2) : i + 2;
          V1.fromBufferAttribute(pa, a).applyMatrix4(MM);
          V2.fromBufferAttribute(pa, b).applyMatrix4(MM);
          V3.fromBufferAttribute(pa, c).applyMatrix4(MM);
          const ux = V2.x - V1.x,
            uy = V2.y - V1.y,
            uz = V2.z - V1.z,
            vx = V3.x - V1.x,
            vy = V3.y - V1.y,
            vz = V3.z - V1.z;
          let nx = uy * vz - uz * vy,
            ny = uz * vx - ux * vz,
            nz = ux * vy - uy * vx;
          const l = Math.hypot(nx, ny, nz) || 1;
          nx /= l;
          ny /= l;
          nz /= l;
          const pts = mir ? [V1, V3, V2] : [V1, V2, V3];
          if (mir) {
            nx = -nx;
            ny = -ny;
            nz = -nz;
          }
          for (const p of pts) {
            P.push(p.x, p.y, p.z);
            N.push(nx, ny, nz);
            C.push(col.r, col.g, col.b);
            TC.push(tcv);
          }
          I.push(off, off + 1, off + 2);
          off += 3;
        }
      } else {
        for (let i = 0; i < pa.count; i++) {
          V1.fromBufferAttribute(pa, i).applyMatrix4(MM);
          P.push(V1.x, V1.y, V1.z);
          V2.fromBufferAttribute(na, i).applyMatrix3(NM).normalize();
          N.push(V2.x, V2.y, V2.z);
          C.push(col.r, col.g, col.b);
          TC.push(tcv);
        }
        const n = ix ? ix.count : pa.count;
        for (let i = 0; i + 2 < n; i += 3) {
          const a = ix ? ix.getX(i) : i,
            b = ix ? ix.getX(i + 1) : i + 1,
            c = ix ? ix.getX(i + 2) : i + 2;
          if (mir) I.push(a + off, c + off, b + off);
          else I.push(a + off, b + off, c + off);
        }
        off += pa.count;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
    geo.setAttribute('aTc', new THREE.Float32BufferAttribute(TC, 1));
    geo.setIndex(off > 65535 ? new THREE.Uint32BufferAttribute(I, 1) : new THREE.Uint16BufferAttribute(I, 1));
    geo.computeBoundingSphere();
    geo.computeBoundingBox();
    return geo;
  }
  function instMat(m) {
    if (window.RGW) {
      const r = RGW.instMat(m);
      if (r) return r;
    }
    const k = sigC(m.material);
    let x = PF.im.get(k);
    if (!x) {
      const mt = m.material,
        o = {color: mt.color.getHex(), side: mt.side};
      if (mt.emissive) o.emissive = mt.emissive.getHex();
      x = mt.isMeshBasicMaterial
        ? new THREE.MeshBasicMaterial({color: o.color, side: o.side})
        : PERF.mat === 'lambert'
          ? new THREE.MeshLambertMaterial(o)
          : new THREE.MeshPhongMaterial(Object.assign(o, {specular: 0, shininess: 0}));
      PF.im.set(k, x);
    }
    return x;
  }

  /* v088: bounds that survive NaN vertices (three's own give a NaN sphere / box, which means "never culled" or "always hidden") */
  function safeSphere(g) {
    if (!g || !g.attributes || !g.attributes.position || (g.userData && g.userData.pfSafe)) return;
    g.userData.pfSafe = 1;
    const a = g.attributes.position;
    let bad = false;
    for (let i = 0, n = a.count; i < n && !bad; i++) if (!isFinite(a.getX(i) + a.getY(i) + a.getZ(i))) bad = true;
    if (!bad) {
      if (!g.boundingBox) g.computeBoundingBox();
      if (!g.boundingSphere) g.computeBoundingSphere();
      return;
    }
    const bb = new THREE.Box3(),
      v = new THREE.Vector3();
    for (let i = 0; i < a.count; i++) {
      v.fromBufferAttribute(a, i);
      if (isFinite(v.x + v.y + v.z)) bb.expandByPoint(v);
    }
    if (bb.isEmpty()) bb.set(v.set(0, 0, 0), v.clone());
    const c = bb.getCenter(new THREE.Vector3());
    let r2 = 0;
    for (let i = 0; i < a.count; i++) {
      v.fromBufferAttribute(a, i);
      if (isFinite(v.x + v.y + v.z)) r2 = Math.max(r2, c.distanceToSquared(v));
    }
    g.boundingBox = bb;
    g.boundingSphere = new THREE.Sphere(c, Math.sqrt(r2));
  }
  PERF.safeSphere = safeSphere;

  /* v088: three recomputed every object's matrix every frame (compose + multiply for ~10k objects), though cars, lot decor, prop
     batches, merged meshes and the ground cover / flora tiles never move. Those subtrees get their matrices once and then are skipped.
     The scene root itself never moves either, so it no longer forces every child to recompute. Anything that moves keeps updating. */
  const FREEZE_K = new Set(['vehicle', 'rgprop', 'truck', 'bdecor']);
  function freezeStatic() {
    if (!scene) return;
    let n = 0;
    const freeze = o => {
      o.updateMatrixWorld(true);
      o.traverse(d => {
        if (d.matrixAutoUpdate) {
          d.matrixAutoUpdate = false;
          n++;
        }
      });
    };
    const walk = o => {
      for (const c of o.children) {
        const u = c.userData || {};
        if (FREEZE_K.has(u.kind) || u.veh || u.pfTiles || u.surf || c.name === 'rg-detail' || (u.rgDetail && c.isGroup))
          freeze(c);
        else if (!u.kind && c.isGroup && c.children.length) walk(c); // e.g. lot decor inside a building group (doors stay live)
      }
    };
    walk(scene);
    if (DET_GROUP()) freeze(DET_GROUP());
    scene.matrixAutoUpdate = false;
    scene.updateMatrix();
    PF.frozen = n;
  }
  const DET_GROUP = () => (window.RGDET && RGDET.group) || null;

  /* v088: town-wide instanced meshes (ground cover, flora trees and shrubs) were one InstancedMesh per kind spread over the whole map,
     with culling off (three r147 culls an InstancedMesh by its geometry's sphere, which ignores the instances), so all of them were
     drawn every frame in the view and again in the sun's shadow pass. tileIM splits one into square tiles. Each tile gets a proxy
     geometry that shares the original's buffers (no extra GPU memory) but carries the tile's own bounding sphere, so three culls tiles
     against the view and the shadow camera, and perfCull hides tiles beyond `far`. Returns a Group (or the mesh itself if small). */
  PF.tiles = [];
  PERF.tileIM = function (im, cell, far) {
    try {
      const n = im.count,
        g = im.geometry;
      if (!g || !g.attributes || !g.attributes.position || n < 2) return im;
      safeSphere(g);
      const gs = g.boundingSphere,
        A = im.instanceMatrix.array,
        C = im.instanceColor ? im.instanceColor.array : null,
        cells = new Map();
      cell = cell || 24;
      for (let i = 0; i < n; i++) {
        const k = Math.floor(A[i * 16 + 12] / cell) + ',' + Math.floor(A[i * 16 + 14] / cell);
        let l = cells.get(k);
        if (!l) cells.set(k, (l = []));
        l.push(i);
      }
      const grp = new THREE.Group();
      grp.name = im.name;
      grp.userData = Object.assign({}, im.userData, {pfTiles: 1});
      grp.position.copy(im.position);
      grp.quaternion.copy(im.quaternion);
      grp.scale.copy(im.scale);
      const M = new THREE.Matrix4(),
        P = new THREE.Vector3(),
        c0 = new THREE.Vector3(),
        tmp = new THREE.Vector3();
      for (const list of cells.values()) {
        const t = new THREE.InstancedMesh(g, im.material, list.length);
        const ctr = new THREE.Vector3();
        list.forEach((src, j) => {
          M.fromArray(A, src * 16);
          t.setMatrixAt(j, M);
          if (C)
            t.instanceColor ||
              (t.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(list.length * 3), 3));
          if (C) t.instanceColor.setXYZ(j, C[src * 3], C[src * 3 + 1], C[src * 3 + 2]);
          ctr.add(c0.copy(gs.center).applyMatrix4(M));
        });
        ctr.multiplyScalar(1 / list.length);
        let r = 0;
        list.forEach(src => {
          M.fromArray(A, src * 16);
          const e = M.elements,
            sc = Math.sqrt(
              Math.max(
                e[0] * e[0] + e[1] * e[1] + e[2] * e[2],
                e[4] * e[4] + e[5] * e[5] + e[6] * e[6],
                e[8] * e[8] + e[9] * e[9] + e[10] * e[10]
              )
            );
          r = Math.max(r, tmp.copy(gs.center).applyMatrix4(M).distanceTo(ctr) + gs.radius * sc);
        });
        const pg = new THREE.BufferGeometry(); // proxy: same buffers, own bounds
        for (const k in g.attributes) pg.setAttribute(k, g.attributes[k]);
        pg.setIndex(g.index);
        for (const gr of g.groups) pg.addGroup(gr.start, gr.count, gr.materialIndex);
        pg.setDrawRange(g.drawRange.start, g.drawRange.count);
        pg.boundingSphere = new THREE.Sphere(ctr.clone(), r);
        pg.userData.pfProxy = 1;
        t.geometry = pg;
        t.instanceMatrix.needsUpdate = true;
        if (t.instanceColor) t.instanceColor.needsUpdate = true;
        t.frustumCulled = true;
        t.castShadow = im.castShadow;
        t.receiveShadow = im.receiveShadow;
        t.customDepthMaterial = im.customDepthMaterial;
        t.customDistanceMaterial = im.customDistanceMaterial;
        t.renderOrder = im.renderOrder;
        t.raycast = im.raycast;
        t.name = im.name;
        t.userData = Object.assign({}, im.userData);
        t.layers.mask = im.layers.mask;
        t.onBeforeRender = im.onBeforeRender;
        grp.add(t);
        if (far) PF.tiles.push({o: t, s: pg.boundingSphere, far});
      }
      return grp;
    } catch (e) {
      console.warn('[perf] tileIM', e);
      return im;
    }
  };
  function perfOptimize() {
    if (window.RGW) RGW.begin();
    const t0 = performance.now();
    let nIn = 0,
      nOut = 0,
      nInst = 0;
    scene.updateMatrixWorld(true);
    const dyn = new Set([pl]),
      add = o => {
        if (o && o.isObject3D) dyn.add(o);
      };
    zombies.forEach(add);
    smesh.forEach(add);
    npcList.forEach(add);
    dropBoxes.forEach(b => add(b.group));
    comps.forEach(c => add(c.m));
    doors.forEach(d => add(d.p));
    winList.forEach(w => add(w.m));
    limbs.forEach(l => add(l.m));
    add(carry);
    const DYNK = new Set(['zombie', 'corpse', 'surv', 'npc', 'comp', 'door', 'bar', 'spike', 'loot', 'glass']);
    const buckets = new Map(),
      instG = [],
      invs = new Map();
    const getInv = r => {
      let v = invs.get(r);
      if (!v) {
        v = new THREE.Matrix4().copy(r.matrixWorld).invert();
        invs.set(r, v);
      }
      return v;
    };
    const collect = (o, root, nm) => {
      if (dyn.has(o)) return;
      const k = o.userData && o.userData.kind;
      if (k && k !== 'truck') nm = true;
      if (o.isMesh && !o.isInstancedMesh && !nm && mergeable(o)) {
        let key;
        if (root) key = 'r' + root.id;
        else {
          const e = o.matrixWorld.elements;
          key = 'c' + Math.floor(e[12] / 64) + ',' + Math.floor(e[14] / 64);
        }
        let a = buckets.get(key);
        if (!a) buckets.set(key, (a = {root, list: []}));
        a.list.push(o);
      }
      for (const c of o.children) collect(c, root, nm);
    };
    const hasStd = o => {
      let f = false;
      o.traverse(c => {
        if (c.isMesh && c.material && c.material.isMeshStandardMaterial) f = true;
      });
      return f;
    };
    /* v041: road markings / cracks (loose Standard-material quads) and vehicles were never merged: ~190 + ~140 draw calls. Mark them so the merge takes them. */
    PF.det = [];
    PF.gl = new Map();
    for (const c of scene.children) {
      if (c === pl || c.isLight || dyn.has(c) || (c.userData && c.userData.dev)) continue;
      const k = c.userData && c.userData.kind;
      if (
        c.isMesh &&
        !c.isInstancedMesh &&
        c.userData &&
        !c.userData.pfm &&
        !k &&
        c.material &&
        !Array.isArray(c.material) &&
        c.material.isMeshStandardMaterial &&
        !c.material.map &&
        !c.material.transparent &&
        c.position.y < 0.05 &&
        c.geometry &&
        (c.geometry.type === 'PlaneGeometry' || c.geometry.type === 'CircleGeometry')
      )
        c.userData.pfm = 1;
      else if (c.isGroup && (!k || k === 'truck') && !(c.userData && (c.userData.bw || c.userData.bb)) && hasStd(c))
        c.traverse(m => {
          if (
            m.isMesh &&
            !m.isInstancedMesh &&
            m.material &&
            !Array.isArray(m.material) &&
            !m.material.transparent &&
            !m.material.map &&
            (m.material.isMeshStandardMaterial || m.material.isMeshPhongMaterial) &&
            m.userData &&
            !m.userData.kind
          )
            m.userData.pfm = 1;
        });
    }
    for (const c of scene.children.slice()) {
      if (c === pl || c.isLight || dyn.has(c) || (c.userData && c.userData.dev)) continue;
      const k = c.userData && c.userData.kind;
      if (c.userData && (c.userData.inst || k === 'tree' || k === 'light')) {
        instG.push(c);
        continue;
      }
      collect(c, c.isMesh ? null : c, false);
    }
    PF.recs = [];
    /* merge by (layer, material signature) per building / map cell */
    for (const [key, bk] of buckets) {
      const root = bk.root,
        inv = root ? getInv(root) : I4,
        ud = root ? root.userData : null,
        groups = new Map();
      for (const m of bk.list) {
        let layer = 's';
        if (ud && ud.bw) {
          const g = m.geometry;
          if (!g.boundingBox) g.computeBoundingBox();
          V1.copy(g.boundingBox.getCenter(V2)).applyMatrix4(m.matrixWorld).applyMatrix4(inv);
          if (Math.abs(V1.x) < ud.bw / 2 - 0.6 && Math.abs(V1.z) < ud.bd / 2 - 0.6 && V1.y > 0.12 && V1.y < ud.bh - 0.3)
            layer = 'i';
        }
        const k = layer + '#' + sigNC(m.material);
        let a = groups.get(k);
        if (!a) groups.set(k, (a = []));
        a.push(m);
      }
      const rec = {g: root, all: [], int: [], b: new THREE.Box3()};
      for (const [k, ms] of groups) {
        const geo = buildMerged(ms, inv),
          mm = new THREE.Mesh(geo, mergedMat(ms[0]));
        mm.userData = {surf: 1, pfm: 'merged'};
        mm.matrixAutoUpdate = false;
        if (root) {
          root.add(mm);
          mm.matrixWorld.copy(root.matrixWorld);
        } else scene.add(mm);
        ms.forEach(m => {
          if (m.parent) m.parent.remove(m);
        });
        nIn += ms.length;
        nOut++;
        (k[0] === 'i' ? rec.int : rec.all).push(mm);
        if (!root) rec.b.union(new THREE.Box3().copy(geo.boundingBox));
      }
      if (root) {
        rec.b.setFromObject(root);
        root.userData.bb = rec.b.clone().expandByScalar(0.5);
      }
      PF.recs.push(rec);
    }
    /* v041: each door was 2 draw calls (panel + handle): merge into the panel; far doors are hidden (fog is ~95% by 80 m) */
    let nDoor = 0;
    for (const d of doors) {
      const pv = d.p,
        dr = pv && pv.children && pv.children.find(c => c.isMesh && c.userData && c.userData.kind === 'door');
      if (!dr || dr.userData.dmerged) continue;
      const hs = dr.children.filter(c => c.isMesh && c.userData && c.userData.pfm === 1 && mergeable(c));
      if (hs.length) {
        const om = dr.material,
          pan = {geometry: dr.geometry, material: om, matrix: new THREE.Matrix4(), updateMatrix() {}},
          geo = buildMerged([pan, ...hs], null, true);
        dr.geometry = geo;
        dr.material = mergedMat({material: om});
        hs.forEach(h => dr.remove(h));
        dr.userData.dmerged = 1;
        nDoor++;
      }
      pv.updateWorldMatrix(true, false);
      PF.det.push({o: pv, x: pv.matrixWorld.elements[12], z: pv.matrixWorld.elements[14], far: 75});
    }
    /* v041: window panes were ~260 separate transparent draw calls. One merged glass mesh per building; the pane meshes stay in place (so shooting / breaking
    work unchanged) but use an invisible material so they cost nothing to draw. Breaking a window rebuilds that building's glass. */
    const HIDM = new THREE.MeshBasicMaterial({visible: false, side: THREE.DoubleSide});
    PF.hid = HIDM;
    PF.glassMat = new THREE.MeshPhongMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      side: THREE.DoubleSide,
      specular: 0,
      shininess: 0
    });
    let nGlass = 0;
    for (const w of winList) {
      if (w.pseudo || !w.m || !w.m.isMesh || !w.g || w.m.material === HIDM) continue;
      const mt = w.m.material;
      if (!mt || mt.map || Array.isArray(mt)) continue;
      w.m.updateWorldMatrix(true, false);
      w.gp = {
        geometry: w.m.geometry,
        material: {color: mt.color.clone(), flatShading: false},
        matrixWorld: w.m.matrixWorld.clone()
      };
      let r = PF.gl.get(w.g);
      if (!r) PF.gl.set(w.g, (r = {ws: [], mesh: null}));
      r.ws.push(w);
      if (w.alive && w.m.parent) w.m.material = HIDM;
    }
    for (const g of PF.gl.keys()) {
      PF.rebuildGlass(g);
      nGlass++;
    }
    /* instancing: trees, bushes, border trees, lamp posts (item 5) */
    const chunks = new Map(),
      ig = new Map();
    for (const g of instG) {
      g.updateMatrixWorld(true);
      g.traverse(m => {
        if (!m.isMesh || !m.userData || m.userData.pfm !== 1 || !mergeable(m)) return;
        const e = m.matrixWorld.elements,
          cx = Math.floor(e[12] / 50),
          cz = Math.floor(e[14] / 50),
          gk0 = m.geometry.type + JSON.stringify(m.geometry.parameters || {}),
          k = gk0 + '|' + sigC(m.material) + '#' + cx + ',' + cz;
        let c = chunks.get(k);
        if (!c) chunks.set(k, (c = {m, gk0, cx, cz, mats: []}));
        c.mats.push(m.matrixWorld.clone());
      });
      scene.remove(g);
    }
    for (const [k, c] of chunks) {
      const src = c.m;
      let geo = ig.get(c.gk0 + (src.material.flatShading ? 'f' : 's'));
      if (!geo) {
        geo = src.material.flatShading ? src.geometry.toNonIndexed() : src.geometry.clone();
        if (src.material.flatShading) geo.computeVertexNormals();
        ig.set(c.gk0 + (src.material.flatShading ? 'f' : 's'), geo);
      }
      const im = new THREE.InstancedMesh(geo, instMat(src), c.mats.length),
        bb = new THREE.Box3();
      c.mats.forEach((mx, i) => {
        im.setMatrixAt(i, mx);
        bb.expandByPoint(V1.setFromMatrixPosition(mx));
      });
      im.instanceMatrix.needsUpdate = true;
      im.frustumCulled = false;
      im.matrixAutoUpdate = false;
      im.raycast = () => {};
      im.userData = {surf: 1, inst: 1};
      scene.add(im);
      nInst += c.mats.length;
      bb.expandByScalar(4);
      PF.recs.push({g: null, all: [im], int: [], b: bb});
    }
    /* vehicles: were never frustum-culled and drawn at any distance -> cull them again; loot containers only draw when close */
    for (const c of scene.children) {
      if (c === pl || c.isLight || dyn.has(c) || !c.userData || c.userData.dev) continue;
      if (c.isGroup && !c.userData.kind && !c.userData.bb && hasStd(c)) {
        c.traverse(m => {
          if (m.isMesh) m.frustumCulled = true;
        });
        c.updateMatrixWorld(true);
        PF.recs.push({g: c, all: [], int: [], b: new THREE.Box3().setFromObject(c)});
      } else if (
        (c.isGroup || c.isMesh) &&
        (c.userData.veh || c.userData.kind === 'vehicle' || c.userData.kind === 'rgprop' || c.userData.kind === 'truck')
      ) {
        /* v088: the retro vehicles (vehicles.js, props.js) and prop batches were built with frustum culling off and were never in the
           distance cull either, so every car in town was drawn every frame, twice (view + sun shadow): ~400 draw calls and ~600k
           triangles at the town centre. Cull them like buildings (bounds-safe spheres first: a few car parts carry NaN vertices). */
        c.traverse(m => {
          if (m.isMesh && !m.isInstancedMesh) {
            safeSphere(m.geometry);
            m.frustumCulled = true;
          }
        });
        c.updateMatrixWorld(true);
        if (c.isGroup && c.userData.kind === 'rgprop' && !c.userData.veh && c.children.length > 1)
          for (const m of c.children) PF.recs.push({g: m, all: [], int: [], b: new THREE.Box3().setFromObject(m)}); // prop batch cells
        else PF.recs.push({g: c, all: [], int: [], b: new THREE.Box3().setFromObject(c)});
      } else if (c.isGroup && c.userData.kind === 'loot' && c.userData.cont && !c.userData.cont.drop) {
        c.updateMatrixWorld(true);
        PF.recs.push({g: c, all: [], int: [], b: new THREE.Box3().setFromObject(c), far: 45});
      }
    }
    /* lamp glow (one draw call) */
    if (PF.glow) {
      scene.remove(PF.glow);
      PF.glow.geometry.dispose();
      PF.glow = null;
    }
    if (streetLights.length) {
      const pos = new Float32Array(streetLights.length * 3);
      streetLights.forEach((s, i) => {
        pos[i * 3] = s.x;
        pos[i * 3 + 1] = s.y + 0.1;
        pos[i * 3 + 2] = s.z;
      });
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      if (!PF.gtex) PF.gtex = glowTex();
      const p = new THREE.Points(
        geo,
        new THREE.PointsMaterial({
          map: PF.gtex,
          size: 6,
          sizeAttenuation: true,
          transparent: true,
          depthWrite: false,
          blending: THREE.AdditiveBlending,
          opacity: 0
        })
      );
      p.frustumCulled = false;
      p.raycast = () => {};
      p.matrixAutoUpdate = false;
      p.userData = {surf: 1};
      scene.add(p);
      PF.glow = p;
    }
    /* freeze matrices of everything static (item 7) */
    const fz = o => {
      if (dyn.has(o) || o.isLight || o === pl || o.isCamera) return;
      const k = o.userData && o.userData.kind;
      if (k && DYNK.has(k)) return;
      if (o.userData && o.userData.anim) return;
      o.updateMatrix();
      o.matrixAutoUpdate = false;
      for (const c of o.children) fz(c);
    };
    for (const c of scene.children) {
      if (c === pl || c.isLight || dyn.has(c) || c.matrixAutoUpdate === false || (c.userData && c.userData.dev))
        continue;
      if (!c.isMesh && hasStd(c)) continue;
      fz(c);
    }
    PF.built = true;
    PERF.built = true;
    perfCull();
    PF.stats =
      'merged ' +
      nIn +
      ' meshes into ' +
      nOut +
      ', instanced ' +
      nInst +
      ' props, ' +
      nDoor +
      ' doors, ' +
      nGlass +
      ' glass groups, ' +
      (performance.now() - t0).toFixed(0) +
      ' ms';
    console.log('[perf039] ' + PF.stats);
    if (window.RGW) RGW.end();
    freezeStatic();
  }

  /* ---------- per-frame culling: far buildings, hidden interiors, far zombies (items 6, 12) ---------- */
  PF.noFar = /[?&]nofarobj/.test(location.search);
  PERF.viewOff = /[?&]noviewdist/.test(location.search);
  function perfCull() {
    if (!pl) return;
    const px = pl.position.x,
      pz = pl.position.z,
      /* v106: render distance follows the fog. Exponential fog leaves exp(-(d*density)^2) of a surface visible: 2.3/density is where
         about 98% is fog, so nothing beyond it can be seen anyway. The Render Distance (Fog Density) slider therefore sets both. */
      dens = (scene.fog && scene.fog.density) || 0,
      gs = window.RGFX && RGFX.s,
      wm = (window.RGATM && RGATM.cur && RGATM.cur.fog) || 1, // the weather's own fog multiplier (storm / fog days > 1), as in the combined mode
      /* split mode (Combine Fog & Render Distance unticked): the Render Distance slider sets D on its own, same formula as combined mode with the
         Render Distance % in place of the fog %, so equal sliders give equal distance in any weather (the Fog Density slider is ignored) */
      D = PERF.viewOff
        ? PERF.farB
        : gs && gs.fogLink === 0
          ? gs.rdist > 0
            ? Math.max(18, Math.min(260, 11500 / (gs.rdist * wm)))
            : 260
          : dens > 0.0001
            ? Math.max(18, Math.min(260, 2.3 / dens))
            : 260,
      S = D / 100,
      F = D,
      F2 = F * F,
      I = PERF.intR;
    PERF.viewDist = D;
    if (!PERF.viewOff) {
      const cf = Math.max(30, Math.min(300, D * 1.25));
      if (Math.abs(camera.far - cf) > 3) {
        camera.far = cf;
        camera.updateProjectionMatrix();
      }
    }
    let chg = false; // v088: anything shown or hidden here invalidates the cached sun shadow
    for (const r of PF.recs) {
      const b = r.b,
        dx = Math.max(b.min.x - px, 0, px - b.max.x),
        dz = Math.max(b.min.z - pz, 0, pz - b.max.z),
        d2 = dx * dx + dz * dz,
        vis = d2 < (r.far ? r.far * r.far * S * S : F2);
      if (r.g) {
        if (r.g.visible !== vis) ((r.g.visible = vis), (chg = true));
      } else for (const m of r.all) if (m.visible !== vis) ((m.visible = vis), (chg = true));
      if (r.int.length) {
        const iv = vis && d2 < I * I;
        for (const m of r.int) if (m.visible !== iv) ((m.visible = iv), (chg = true));
      }
    }
    const far = o => {
      const dx = o.position.x - px,
        dz = o.position.z - pz,
        v = dx * dx + dz * dz < F2;
      if (o.visible !== v) o.visible = v;
    };
    for (const m of smesh) far(m);
    for (const m of npcList) far(m);
    for (const e of PF.det || []) {
      const dx = e.x - px,
        dz = e.z - pz,
        v = dx * dx + dz * dz < e.far * e.far * S * S;
      if (e.o.visible !== v) ((e.o.visible = v), (chg = true));
    }
    /* v099: loot containers, vehicles and prop groups standing loose in the town were only frustum-culled, so everything in view out
       to the horizon was drawn (and shadowed) although fog hides it past ~80 m. Hide them beyond a per-kind range (restored when close;
       only objects this pass hid are ever re-shown, so other code's own visibility is never overridden). ?nofarobj disables. */
    if (!PF.noFar)
      for (const o of scene.children) {
        const u = o.userData;
        if (!u || o.isLight) continue;
        const k = u.kind,
          R = (k === 'loot' ? 0.55 : k === 'vehicle' || u.veh ? 0.85 : 0) * D;
        if (!R) continue;
        const dx = o.position.x - px,
          dz = o.position.z - pz,
          far = dx * dx + dz * dz > R * R;
        if (far && o.visible) {
          o.visible = false;
          u.pfFar = 1;
          chg = true;
        } else if (!far && u.pfFar) {
          u.pfFar = 0;
          o.visible = true;
          chg = true;
        }
      }
    if (chg && PF.sc) PF.sc.dirty = true;
    /* v088: instanced tiles (tileIM): hidden beyond their range (distance to the tile's sphere) */
    let drop = 0;
    for (const e of PF.tiles) {
      if (!e.o.parent || !e.o.parent.parent) {
        e.dead = 1;
        drop++;
        continue;
      }
      const c = e.s.center,
        d = Math.max(0, Math.hypot(c.x - px, c.z - pz) - e.s.radius),
        v = d < e.far * S;
      if (e.o.visible !== v) e.o.visible = v;
    }
    if (drop) PF.tiles = PF.tiles.filter(e => !e.dead);
  }

  /* ---------- v041: merged window glass ---------- */
  PF.rebuildGlass = function (g) {
    const r = PF.gl && PF.gl.get(g);
    if (!r) return;
    if (r.mesh) {
      g.remove(r.mesh);
      r.mesh.geometry.dispose();
      r.mesh = null;
    }
    const list = r.ws.filter(w => w.alive && w.gp).map(w => w.gp);
    if (!list.length) return;
    g.updateWorldMatrix(true, false);
    const geo = buildMerged(list, new THREE.Matrix4().copy(g.matrixWorld).invert()),
      m = new THREE.Mesh(geo, PF.glassMat);
    m.matrixAutoUpdate = false;
    m.userData = {surf: 1, pfm: 'glass'};
    m.raycast = () => {};
    m.matrixWorld.copy(g.matrixWorld);
    g.add(m);
    r.mesh = m;
  };
  {
    const _bk = breakWin;
    breakWin = function (w) {
      const was = w && w.alive,
        r = _bk.apply(this, arguments);
      if (was && w.g && PF.rebuildGlass) PF.rebuildGlass(w.g);
      if (PF.sc) PF.sc.dirty = true;
      return r;
    };
    const _qb = quietBreak;
    quietBreak = function (w) {
      const was = w && w.alive,
        r = _qb.apply(this, arguments);
      if (was && w.g && PF.rebuildGlass) PF.rebuildGlass(w.g);
      return r;
    };
  }

  /* ---------- world build / clear hooks ---------- */
  const _cw = clearWorld;
  clearWorld = function () {
    const old = scene ? scene.children.filter(c => c !== pl && !c.isLight) : [];
    PF.recs = [];
    PF.det = [];
    PF.tiles = [];
    if (PF.sc) {
      PF.sc.gen++;
      PF.sc.moved.clear();
    }
    PF.gl = null;
    PF.glow = null;
    PF.built = false;
    PERF.built = false;
    _cw();
    solids.G = null;
    walkables.G = null;
    /* v088: this used to dispose every material, its map and every geometry of the old world here. Most of them come from caches
       (prop kit, world surfaces, merged materials, car templates, painted signs) and are used again by the next world, so every world
       entry recompiled every shader and re-uploaded every texture. Now:
       - materials are never disposed: a material holds no GPU memory of its own, only a share of a compiled shader, and keeping it
         keeps that shader compiled for the next world (the number of distinct shaders is small and fixed);
       - geometries and maps become candidates here and are checked when the next world is warmed up (PERF.flushDisposals, called by
         the loader). One the new world uses stays. One it does not use gets one more world of grace (mission -> fort -> mission reuses
         almost every texture of the first mission) and is freed if the world after that does not use it either. The check runs
         before the new world's uploads, so the GPU never holds more than one world's worth plus what that world reuses. */
    try {
      for (const o of old)
        o.traverse(d => {
          if (d.isInstancedMesh && d.dispose) d.dispose();
          if (d.geometry && d.geometry.dispose && !STALE.has(d.geometry)) STALE.set(d.geometry, 0);
          const mt = d.material;
          for (const x of Array.isArray(mt) ? mt : [mt])
            if (x && x.map && x.map.dispose && !STALE.has(x.map)) STALE.set(x.map, 0);
        });
    } catch (e) {
      console.warn('dispose', e);
    }
    STALE.cleared = true;
    clearTimeout(STALE.t);
    STALE.t = setTimeout(() => {
      if (STALE.cleared && !(window.MFZLOAD && MFZLOAD.busy)) flushDisposals(); // a world that was never warmed up
    }, 4000);
  };
  const STALE = new Map(),
    GRACE = 2; // worlds a geometry / texture may go unused before it is freed
  function flushDisposals() {
    clearTimeout(STALE.t);
    STALE.cleared = false;
    if (!STALE.size) return;
    const use = new Set(),
      mark = root =>
        root &&
        root.traverse(d => {
          if (d.geometry) use.add(d.geometry);
          const mt = d.material;
          if (mt)
            for (const x of Array.isArray(mt) ? mt : [mt])
              if (x)
                for (const k in x) {
                  const v = x[k];
                  if (v && v.isTexture) use.add(v);
                }
        });
    let freed = 0,
      kept = 0;
    try {
      mark(scene);
      if (window.RGX && RGX.vm) mark(RGX.vm.scene);
      for (const [x, age] of STALE) {
        if (use.has(x)) STALE.delete(x);
        else if (age + 1 >= GRACE) {
          x.dispose();
          STALE.delete(x);
          freed++;
        } else {
          STALE.set(x, age + 1);
          kept++;
        }
      }
    } catch (e) {
      console.warn('dispose', e);
    }
    PERF.freed = {freed, graced: kept};
  }
  PERF.flushDisposals = flushDisposals; // (window.PF is taken over by the prop kit's prefab table later, so this lives on PERF)
  /* v075: hooks into the stepped world build (core WB) instead of wrapping buildWorld, so the loading screen runs them too */
  WB.pre.push(() => {
    if (!PF.pool && scene) {
      PF.pool = [0, 1, 2].map(() => {
        const l = new THREE.PointLight(0xffdd88, 0, 16, 2);
        scene.add(l);
        return l;
      });
    }
    PF.err = null;
  });
  WB.post.push(() => {
    if (PF.sc) PF.sc.gen++; // v088: a finished world: the shadow cache sorts static from moving again
    if (!OFF && scene) {
      try {
        perfOptimize();
      } catch (e) {
        PF.err = (e && e.message) || String(e);
        console.error('[perf039] optimise failed - world left unoptimised', e);
      }
    }
  });
  const _mk = mk;
  mk = function (x, z, w, d, h, c, fc, dc) {
    const B = _mk(x, z, w, d, h, c, fc, dc);
    B.g.userData.bw = w;
    B.g.userData.bd = d;
    B.g.userData.bh = h;
    return B;
  };

  /* ---------- profiler overlay: F3 toggles, F4 hides zombies, F6 hides the world (isolates what is slow) ---------- */
  const dg = document.createElement('div');
  dg.style.cssText =
    'position:fixed;left:50%;transform:translateX(-50%);top:6px;z-index:2147483647;background:rgba(0,0,0,.75);color:#9f9;font:11px/1.35 monospace;padding:6px 8px;white-space:pre;pointer-events:none;display:none';
  document.body.appendChild(dg);
  let dgOn = false,
    hideZ = false,
    hideW = false,
    rMs = 0,
    lgMs = 0,
    frMs = 16,
    frMax = 0,
    dgT = 0,
    objN = 0,
    objT = 0,
    lastF = performance.now();
  addEventListener('keydown', e => {
    if (e.code === 'F3') {
      e.preventDefault();
      dgOn = !dgOn;
      dg.style.display = dgOn ? 'block' : 'none';
    } else if (e.code === 'F4') {
      e.preventDefault();
      hideZ = !hideZ;
    } else if (e.code === 'F6') {
      e.preventDefault();
      hideW = !hideW;
    }
  });
  /* ---------- v088: cached sun shadow ----------
     The sun's shadow map was redrawn from scratch every frame: every caster within 46 m of the player (buildings' decor, cars, props,
     loot, zombies), which was about half of all draw calls and triangles in a frame. Almost all of it never moves. Now:
     - static pass (only when needed): everything except the moving things is drawn into the shadow map, which is then copied (colour
       and depth) into a second target;
     - every other frame: the copy is blitted back (one GPU copy, colour and depth) and only the moving things are drawn on top, with
       the depth test against the static depth, so the map is exactly what a full redraw would give.
     Moving things: zombies, corpses, survivors, NPCs, followers, drop boxes, carried items, limbs, doors, wind-swayed trees, anything added to
     the scene after the world was built, and anything that turns out to move. The static pass reruns when the world changes, the
     player has moved 6 m from where it was drawn (the light is held there meanwhile, so the map and the lighting always agree), the sun
     has turned 0.25 degrees, a window breaks, the distance cull shows or hides something, or a static object moves or
     is removed. ?noshadowcache turns it off. */
  const SC = (PF.sc = {
    on: !/[?&]noshadowcache/.test(location.search),
    dirty: true,
    gen: 0,
    snapGen: -1,
    moved: new Set(),
    stats: {full: 0, fast: 0}
  });
  PERF.shadowDirty = () => (SC.dirty = true);
  const SC_DYNK = new Set(['zombie', 'corpse', 'surv', 'npc', 'comp', 'person', 'limb', 'carry']);
  function scSnapshot() {
    const dynTop = new Set(),
      top = o => {
        while (o && o.parent && o.parent !== scene) o = o.parent;
        return o && o.parent === scene ? o : null;
      },
      mark = o => {
        const t = o && o.isObject3D ? top(o) : null;
        if (t) dynTop.add(t);
      };
    zombies.forEach(mark);
    (typeof dead !== 'undefined' ? dead : []).forEach(mark);
    smesh.forEach(mark);
    npcList.forEach(n => mark(n && (n.isObject3D ? n : n.m || n.mesh || n.g)));
    comps.forEach(c => mark(c && c.m));
    dropBoxes.forEach(b => mark(b && b.group));
    limbs.forEach(l => mark(l && l.m));
    mark(carry);
    SC.roots = [];
    SC.mats = [];
    for (const c of scene.children) {
      if (c === pl || c.isLight || dynTop.has(c) || SC.moved.has(c)) continue;
      const k = c.userData && c.userData.kind;
      if (k && SC_DYNK.has(k)) continue;
      if (/^rg-flora/.test(c.name || '')) continue; // tree shadows sway with the wind (depth shader)
      SC.roots.push(c);
      SC.mats.push(c.matrixWorld.elements.slice());
    }
    SC.set = new Set(SC.roots);
    /* doors swing (and shake when zombies hit them) inside otherwise static buildings: they are drawn with the moving things. A
       building with doors stays visible in the moving pass with everything but the door pivots hidden; the static pass hides the
       pivots. */
    const piv = new Set(),
      path = new Set();
    for (const d of doors)
      if (d && d.p && d.p.isObject3D) {
        const t = top(d.p);
        if (!t || !SC.set.has(t)) continue;
        piv.add(d.p);
        for (let o = d.p.parent; o && o !== scene; o = o.parent) path.add(o);
      }
    const mixed = new Map();
    for (const n of path) {
      const t = top(n);
      if (!mixed.has(t)) mixed.set(t, []);
      for (const c of n.children) if (!piv.has(c) && !path.has(c)) mixed.get(t).push(c);
    }
    SC.pure = SC.roots.filter(r => !mixed.has(r));
    SC.mixed = [...mixed.values()].flat();
    SC.pivots = [...piv];
    SC.snapGen = SC.gen;
    SC.dirty = true;
  }
  function scBlit(src, dst, w, h) {
    const gl = renderer.getContext(),
      P = renderer.properties,
      s = P.get(src).__webglFramebuffer,
      d = P.get(dst).__webglFramebuffer;
    if (!s || !d) return false;
    const rb = gl.getParameter(gl.READ_FRAMEBUFFER_BINDING),
      db = gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING),
      sc = gl.isEnabled(gl.SCISSOR_TEST);
    if (sc) gl.disable(gl.SCISSOR_TEST);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, s);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, d);
    gl.blitFramebuffer(0, 0, w, h, 0, 0, w, h, gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT, gl.NEAREST);
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, rb);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, db);
    if (sc) gl.enable(gl.SCISSOR_TEST);
    return true;
  }
  const SC_V = new THREE.Vector3(),
    SC_W = new THREE.Vector3();
  function installShadowCache() {
    const sm = renderer.shadowMap;
    if (sm.__pfsc) return;
    sm.__pfsc = 1;
    const orig = sm.render;
    sm.render = function (lights, sc, cam) {
      if (
        !SC.on ||
        (!this.autoUpdate && !this.needsUpdate) ||
        sc !== scene ||
        typeof dirL === 'undefined' ||
        !dirL ||
        !dirL.castShadow ||
        lights.length !== 1 ||
        lights[0] !== dirL ||
        !(typeof renderer.getContext().blitFramebuffer === 'function')
      )
        return orig.apply(this, arguments);
      try {
        if (SC.snapGen !== SC.gen) scSnapshot();
        const sh = dirL.shadow;
        /* where the world layer wants the light this frame */
        SC_V.copy(dirL.position).sub(dirL.target.position).normalize();
        let dirty = SC.dirty || !SC.rt || !sh.map || SC.map !== sh.map || !SC.pose;
        if (!dirty) {
          const p = SC.pose;
          SC_W.copy(p.pos).sub(p.tgt).normalize();
          if (
            SC_V.dot(SC_W) < 0.99999 ||
            Math.hypot(dirL.target.position.x - p.tgt.x, dirL.target.position.z - p.tgt.z) > 6
          )
            dirty = true;
        }
        /* static objects that moved become moving ones; removed ones mean a new static pass */
        if (!dirty && SC.roots)
          for (let i = 0; i < SC.roots.length; i++) {
            const o = SC.roots[i];
            if (o.parent !== scene) {
              SC.snapGen = -1;
              dirty = true;
              break;
            }
            const a = o.matrixWorld.elements,
              b = SC.mats[i];
            if (a[12] !== b[12] || a[13] !== b[13] || a[14] !== b[14] || a[0] !== b[0] || a[2] !== b[2]) {
              SC.moved.add(o); // it moves: from now on it is drawn every frame with the moving things
              SC.snapGen = -1;
              dirty = true;
              break;
            }
          }
        if (dirty && SC.snapGen !== SC.gen) scSnapshot();
        if (dirty) {
          /* static pass: hide the moving things, draw, copy the result */
          const hid = [];
          for (const c of scene.children)
            if (c.visible && !SC.set.has(c) && c !== pl && !c.isLight) ((c.visible = false), hid.push(c));
          for (const c of SC.pivots) if (c.visible) ((c.visible = false), hid.push(c));
          try {
            orig.apply(this, arguments);
          } finally {
            for (const c of hid) c.visible = true;
          }
          const m = sh.map;
          if (!SC.rt || SC.rt.width !== m.width || SC.rt.height !== m.height) {
            if (SC.rt) SC.rt.dispose();
            SC.rt = new THREE.WebGLRenderTarget(m.width, m.height, {
              minFilter: THREE.NearestFilter,
              magFilter: THREE.NearestFilter,
              format: THREE.RGBAFormat
            });
            const prev = renderer.getRenderTarget();
            renderer.setRenderTarget(SC.rt);
            renderer.setRenderTarget(prev);
          }
          SC.map = m;
          SC.pose = {pos: dirL.position.clone(), tgt: dirL.target.position.clone()};
          SC.mats = SC.roots.map(o => o.matrixWorld.elements.slice());
          if (!scBlit(m, SC.rt, m.width, m.height)) {
            SC.pose = null;
            return;
          }
          SC.dirty = false;
          SC.stats.full++;
        }
        /* moving things pass, on top of the static copy (held light pose: map and lighting agree) */
        const p = SC.pose;
        dirL.position.copy(p.pos);
        dirL.target.position.copy(p.tgt);
        dirL.updateMatrixWorld();
        dirL.target.updateMatrixWorld();
        if (!dirty && !scBlit(SC.rt, sh.map, sh.map.width, sh.map.height)) {
          SC.dirty = true;
          return orig.apply(this, arguments);
        }
        const hid = [];
        for (const c of SC.pure) if (c.visible) ((c.visible = false), hid.push(c));
        for (const c of SC.mixed) if (c.visible) ((c.visible = false), hid.push(c));
        const clr = renderer.clear;
        renderer.clear = function () {};
        try {
          orig.apply(this, arguments);
        } finally {
          renderer.clear = clr;
          for (const c of hid) c.visible = true;
        }
        if (!dirty) SC.stats.fast++;
      } catch (e) {
        console.warn('[perf] shadow cache off', e);
        SC.on = false;
        return orig.apply(this, arguments);
      }
    };
  }
  function hookRender() {
    if (renderer && renderer.shadowMap && !renderer.shadowMap.__pfsc) installShadowCache();
    if (!renderer || renderer.__pf) return;
    const o = renderer.render;
    renderer.render = function (s, c) {
      const t0 = performance.now();
      let sv = null;
      if (hideZ || hideW) {
        sv = [];
        for (const ch of s.children) {
          if (ch === pl || ch.isLight) continue;
          const z = ch.userData && ch.userData.kind === 'zombie';
          if ((z && hideZ) || (!z && hideW)) {
            sv.push(ch, ch.visible);
            ch.visible = false;
          }
        }
      }
      o.call(this, s, c);
      if (sv) for (let i = 0; i < sv.length; i += 2) sv[i].visible = sv[i + 1];
      rMs = performance.now() - t0;
    };
    renderer.__pf = 1;
  }
  function dgUpdate(dt) {
    frMax = Math.max(frMax, dt * 1000);
    dgT -= dt;
    if (dgT > 0 || !dgOn) return;
    dgT = 0.5;
    const inf = renderer.info,
      lights = scene.children.filter(c => c.isLight).length;
    objT -= 0.5;
    if (objT <= 0) {
      objT = 2;
      objN = 0;
      scene.traverse(o => {
        if (o.visible) objN++;
      });
    }
    dg.textContent =
      'FPS ' +
      (1000 / frMs).toFixed(0) +
      '   frame ' +
      frMs.toFixed(1) +
      ' ms (worst ' +
      frMax.toFixed(0) +
      ')\ngame logic ' +
      lgMs.toFixed(1) +
      ' ms   render submit ' +
      rMs.toFixed(1) +
      ' ms\n' +
      'draw calls ' +
      inf.render.calls +
      '   triangles ' +
      inf.render.triangles +
      '   geometries ' +
      inf.memory.geometries +
      '   textures ' +
      inf.memory.textures +
      '\n' +
      'visible objects ' +
      objN +
      '   zombies ' +
      zombies.length +
      ' (drawn ' +
      zombies.filter(z => z.visible).length +
      ')   scene lights ' +
      lights +
      '\n' +
      'perf pass: ' +
      (PF.err ? 'FAILED - ' + PF.err : PF.built ? PF.stats : OFF ? 'disabled (?noperf)' : 'not run yet') +
      '\n' +
      'AA ' +
      PERF.aa +
      '   quality ' +
      G.q +
      '   pixel ratio ' +
      renderer.getPixelRatio().toFixed(2) +
      '   material ' +
      PERF.mat +
      '\n' +
      'F3 hide this   F4 hide zombies [' +
      (hideZ ? 'ON' : 'off') +
      ']   F6 hide world [' +
      (hideW ? 'ON' : 'off') +
      ']';
    frMax = 0;
  }

  /* ---------- per-frame tick ---------- */
  let last = performance.now();
  const _an = animate;
  animate = function () {
    const t0 = performance.now();
    hookRender();
    _an();
    const now = performance.now(),
      dt = Math.min(0.25, (now - last) / 1000);
    last = now;
    if (!scene || !pl || !renderer) return;
    PERF.n++;
    frMs += (dt * 1000 - frMs) * 0.1;
    lgMs += (now - t0 - rMs - lgMs) * 0.1;
    dgUpdate(dt);
    PF.t -= dt;
    if (PF.t <= 0) {
      PF.t = 0.25;
      if (PF.recs.length || smesh.length || npcList.length) perfCull();
    }
    PF.lt -= dt;
    if (PF.lt <= 0) {
      PF.lt = 0.4;
      perfLamps();
    }
    if (G.q === 3 && renderer && playing()) {
      PF.fa += dt;
      PF.fn++;
      PF.cool -= dt;
      if (PF.fa >= 1.5) {
        const ms = (PF.fa / PF.fn) * 1000;
        PF.fa = PF.fn = 0;
        const mx = Math.min(devicePixelRatio, 2);
        let pr = PERF.pr || 1;
        if (ms > 21 && pr > 0.55) {
          pr = Math.max(0.55, pr - 0.15);
          PF.cool = 8;
        } else if (ms < 18 && pr < mx && PF.cool <= 0) {
          pr = Math.min(mx, pr + 0.1);
          PF.cool = 8;
        }
        if (Math.abs(pr - (PERF.pr || 1)) > 0.01) {
          PERF.pr = pr;
          renderer.setPixelRatio(pr);
          renderer.setSize(innerWidth, innerHeight);
        }
      }
    }
  };

  /* ---------- options: antialiasing toggle (item 8) ---------- */
  window.setAA = function (on) {
    on = !!on;
    PERF.aa = on;
    try {
      localStorage.setItem('gf_perf', JSON.stringify({aa: on}));
    } catch (e) {}
    document.querySelectorAll('.ab').forEach(b => b.classList.toggle('on', (+b.dataset.a === 1) === on));
    if (!renderer) return;
    let cur = null;
    try {
      cur = renderer.getContext().getContextAttributes();
    } catch (e) {}
    if (cur && cur.antialias === on) return;
    const old = renderer,
      od = old.domElement,
      r = new THREE.WebGLRenderer({antialias: on});
    r.setPixelRatio(old.getPixelRatio());
    r.setSize(innerWidth, innerHeight);
    od.parentNode.replaceChild(r.domElement, od);
    r.domElement.addEventListener('click', () => {
      if (playing() && !locked && !invOpen) lock();
    });
    renderer = r;
    try {
      if (window.RGFX && RGFX.refresh) RGFX.refresh();
    } catch (e) {}
    /* v100: the new renderer has none of the scene's shaders, geometries or textures: they used to be rebuilt one by one over the next
       minutes of play (the hitching after toggling AA). Run the loader's warm-up now (it shows its Loading screen when there is work), and
       free the old context a moment later, behind that screen: forceContextLoss on a full town is a multi-second stall. */
    try {
      if (window.MFZLOAD && MFZLOAD.afterBuild && G && G.mode !== 'TITLE') MFZLOAD.afterBuild();
    } catch (e) {
      console.warn('[perf] AA warm', e);
    }
    setTimeout(() => {
      try {
        old.dispose();
        old.forceContextLoss();
      } catch (e) {}
    }, 1500);
  };
  document.querySelectorAll('.ab').forEach(b => b.classList.toggle('on', (+b.dataset.a === 1) === PERF.aa));

  /* ---------- HUD text: only write when the value changed (item 13) ---------- */
  (function () {
    const d = Object.getOwnPropertyDescriptor(Node.prototype, 'textContent');
    document.querySelectorAll('[id]').forEach(el => {
      if (el.children.length || /^(INPUT|CANVAS|TEXTAREA|SELECT|SCRIPT|STYLE|BUTTON)$/.test(el.tagName)) return;
      Object.defineProperty(el, 'textContent', {
        configurable: true,
        get() {
          return d.get.call(this);
        },
        set(v) {
          v = String(v);
          if (d.get.call(this) !== v) d.set.call(this, v);
        }
      });
    });
  })();
})();
