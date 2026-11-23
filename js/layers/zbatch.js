/* =====================================================================================================
   MINI FORT ZOMBIE v088 - ZOMBIE DRAW BATCHING
   A zombie is ~18 separate meshes (head, torso, arm and leg pieces, outfit, eyes) animated part by part, so each zombie cost ~18
   draw calls in the view and as many again in the sun's shadow: with 30 zombies on screen they were most of a frame.
   Here every zombie also gets one render-only SkinnedMesh that merges its part meshes, one group per material (~4 draw calls). Each
   part mesh is a "bone" of it: the skeleton reads the parts' world matrices every frame, so all existing animation, ragdolls,
   knockdowns, climbing and crawling drive it unchanged. The original parts stay exactly where they are for everything else (hits,
   aimed parts, rays, gore): they are only taken out of rendering (a layers test that says no to the render cameras and yes to
   raycasters). A part that is hidden (cut-off limb, shot-off head) or removed collapses to nothing in the merged mesh.
   Anything added to a zombie later (stumps, held weapons) renders normally. A part whose geometry or material is swapped rebuilds
   that zombie's merged mesh. ?nozbatch turns it off.
   API: ZBATCH.all() merges every zombie now (the loader calls it before compiling shaders), ZBATCH.stats.
   ===================================================================================================== */
(function () {
  'use strict';
  const T = THREE;
  const ZB = (window.ZBATCH = {on: !/[?&]nozbatch/.test(location.search), stats: {merged: 0, rebuilt: 0, freed: 0}});
  if (!ZB.on) return;
  const LIST = []; // {z, parts, geos, mats, mesh, skel, gone}
  const REC = new WeakMap(); // zombie -> record (kept off userData, which other code serialises)
  const I16 = new T.Matrix4().elements.slice();
  const ZERO = new Array(16).fill(0);
  const RENDER_FLAG = '__render';
  /* parts answer "no" to cameras that render (main camera, sun shadow camera) and "yes" to everything else (raycasters) */
  function hideLayers(m) {
    const L = new T.Layers();
    L.mask = m.layers.mask;
    L.test = function (o) {
      return !o[RENDER_FLAG] && (this.mask & o.mask) !== 0;
    };
    L.__zb = m.layers;
    m.layers = L;
  }
  function showLayers(m) {
    if (m.layers.__zb) m.layers = m.layers.__zb;
  }
  function markCameras() {
    try {
      if (typeof camera !== 'undefined' && camera) camera.layers[RENDER_FLAG] = true;
      if (typeof dirL !== 'undefined' && dirL && dirL.shadow && dirL.shadow.camera)
        dirL.shadow.camera.layers[RENDER_FLAG] = true;
    } catch (e) {}
  }
  function partsOf(z) {
    const out = [];
    z.traverse(o => {
      if (
        o.isMesh &&
        !o.isSkinnedMesh &&
        !o.userData.zbMerged &&
        o.geometry &&
        o.geometry.attributes.position &&
        o.material &&
        !Array.isArray(o.material)
      )
        out.push(o);
    });
    return out;
  }
  function build(z) {
    const parts = partsOf(z);
    if (parts.length < 3) return null;
    /* groups by material, opaque first */
    const mats = [];
    for (const p of parts) if (!mats.includes(p.material)) mats.push(p.material);
    mats.sort((a, b) => (a.transparent ? 1 : 0) - (b.transparent ? 1 : 0));
    let nv = 0,
      ni = 0;
    for (const p of parts) {
      const g = p.geometry;
      nv += g.attributes.position.count;
      ni += g.index ? g.index.count : g.attributes.position.count;
    }
    if (nv > 65535 * 4) return null;
    const P = new Float32Array(nv * 3),
      N = new Float32Array(nv * 3),
      UV = new Float32Array(nv * 2),
      C = new Float32Array(nv * 3).fill(1),
      SI = new Uint8Array(nv * 4),
      SW = new Uint8Array(nv * 4),
      IDX = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
    let hasC = false,
      v0 = 0,
      i0 = 0;
    const groups = [];
    const order = [];
    for (const m of mats) for (let pi = 0; pi < parts.length; pi++) if (parts[pi].material === m) order.push(pi);
    const vStart = new Array(parts.length);
    for (let pi = 0; pi < parts.length; pi++) {
      const g = parts[pi].geometry,
        a = g.attributes,
        n = a.position.count;
      vStart[pi] = v0;
      for (let i = 0; i < n; i++) {
        P[(v0 + i) * 3] = a.position.getX(i);
        P[(v0 + i) * 3 + 1] = a.position.getY(i);
        P[(v0 + i) * 3 + 2] = a.position.getZ(i);
        if (a.normal) {
          N[(v0 + i) * 3] = a.normal.getX(i);
          N[(v0 + i) * 3 + 1] = a.normal.getY(i);
          N[(v0 + i) * 3 + 2] = a.normal.getZ(i);
        }
        if (a.uv) {
          UV[(v0 + i) * 2] = a.uv.getX(i);
          UV[(v0 + i) * 2 + 1] = a.uv.getY(i);
        }
        if (a.color) {
          hasC = true;
          C[(v0 + i) * 3] = a.color.getX(i);
          C[(v0 + i) * 3 + 1] = a.color.getY(i);
          C[(v0 + i) * 3 + 2] = a.color.getZ(i);
        }
        SI[(v0 + i) * 4] = pi;
        SW[(v0 + i) * 4] = 255;
      }
      v0 += n;
    }
    let gi = -1,
      gm = null;
    for (const pi of order) {
      const p = parts[pi],
        g = p.geometry,
        base = vStart[pi];
      if (p.material !== gm) {
        gm = p.material;
        gi = mats.indexOf(gm);
        groups.push({start: i0, count: 0, materialIndex: gi});
      }
      const grp = groups[groups.length - 1];
      if (g.index) for (let i = 0; i < g.index.count; i++) IDX[i0++] = g.index.getX(i) + base;
      else for (let i = 0; i < g.attributes.position.count; i++) IDX[i0++] = i + base;
      grp.count = i0 - grp.start;
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(P, 3));
    geo.setAttribute('normal', new T.BufferAttribute(N, 3));
    geo.setAttribute('uv', new T.BufferAttribute(UV, 2));
    if (hasC) geo.setAttribute('color', new T.BufferAttribute(C, 3));
    geo.setAttribute('skinIndex', new T.Uint8BufferAttribute(SI, 4));
    geo.setAttribute('skinWeight', new T.Uint8BufferAttribute(SW, 4, true));
    geo.setIndex(new T.BufferAttribute(IDX, 1));
    for (const g of groups) geo.addGroup(g.start, g.count, g.materialIndex);
    geo.boundingSphere = new T.Sphere(new T.Vector3(0, 0.9, 0), 3.2); // around the zombie, ragdoll included
    geo.boundingBox = new T.Box3(new T.Vector3(-3, -1, -3), new T.Vector3(3, 3, 3));
    geo.userData.zbMerged = 1;
    const mesh = new T.SkinnedMesh(geo, mats);
    mesh.userData.zbMerged = 1;
    mesh.name = 'zbatch';
    mesh.castShadow = parts.some(p => p.castShadow);
    mesh.receiveShadow = parts.some(p => p.receiveShadow);
    mesh.raycast = function () {};
    const skel = new T.Skeleton(
      parts,
      parts.map(() => new T.Matrix4())
    );
    /* the parts are the bones: their world matrices, or nothing when hidden / removed.
       v089: visibility is walked up to the ZOMBIE ROOT, not to the merged mesh's parent. The death ragdoll and the crawl pose re-parent
       everything hung on the root (except the legs) onto the pelvis, and that used to take this mesh with it: the legs, which stay on the
       root, then never met "root" on the way up, counted as detached and collapsed. That was the "legs vanish when it dies / shooting
       one leg takes both" bug. */
    skel.update = function () {
      const bm = this.boneMatrices,
        root = z;
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        let vis = true,
          o = p;
        while (o && o !== root) {
          if (!o.visible) {
            vis = false;
            break;
          }
          o = o.parent;
        }
        if (!o) vis = false; // detached from the zombie
        const e = vis ? p.matrixWorld.elements : ZERO;
        for (let k = 0; k < 16; k++) bm[i * 16 + k] = e[k];
      }
      if (this.boneTexture) this.boneTexture.needsUpdate = true;
    };
    mesh.bind(skel, new T.Matrix4()); // bindMode 'attached': the mesh sits on the zombie root, the part matrices are world space
    z.add(mesh);
    mesh.updateMatrixWorld(true);
    for (const p of parts) hideLayers(p);
    return {z, parts, geos: parts.map(p => p.geometry), mats: parts.map(p => p.material), mesh, skel, gone: 0};
  }
  function unbuild(r) {
    for (const p of r.parts) showLayers(p);
    if (r.mesh.parent) r.mesh.parent.remove(r.mesh);
    r.mesh.geometry.dispose();
    r.skel.dispose();
  }
  function merge(z) {
    if (!z || !z.isObject3D || REC.has(z)) return;
    try {
      const r = build(z);
      if (!r) {
        REC.set(z, 'skip');
        return;
      }
      REC.set(z, r);
      skipHidden(z);
      LIST.push(r);
      ZB.stats.merged++;
    } catch (e) {
      console.warn('[zbatch] merge failed', e);
      REC.set(z, 'skip');
    }
  }
  /* a zombie hidden by distance (animZ hides them past 80 m) needs no matrices: the per-frame scene update skips it. Direct calls
     (z.updateMatrixWorld(true) from game code) still run, and it is brought up to date the frame it is shown again. */
  let inScene = false;
  function skipHidden(z) {
    if (z.__zbUMW) return;
    const own = z.updateMatrixWorld;
    z.__zbUMW = 1;
    z.updateMatrixWorld = function (force) {
      if (inScene && !this.visible) return;
      return own.call(this, force);
    };
  }
  function wrapScene() {
    if (!scene || scene.__zbUMW) return;
    const own = scene.updateMatrixWorld;
    scene.__zbUMW = 1;
    scene.updateMatrixWorld = function (force) {
      inScene = true;
      try {
        return own.call(this, force);
      } finally {
        inScene = false;
      }
    };
  }
  ZB.all = function () {
    markCameras();
    if (typeof zombies === 'undefined') return;
    for (const z of zombies) merge(z);
  };
  let pruneT = 0;
  function tick() {
    if (typeof zombies === 'undefined' || typeof scene === 'undefined' || !scene) return;
    markCameras();
    wrapScene();
    /* new zombies: a few per frame (spawns, siege waves, guests' puppets) */
    let budget = 6;
    for (let i = 0; i < zombies.length && budget > 0; i++) {
      const z = zombies[i];
      if (!REC.has(z) && z.parent) {
        merge(z);
        budget--;
      }
    }
    /* parts whose geometry / material changed: rebuild that zombie */
    for (let i = 0; i < LIST.length; i++) {
      const r = LIST[i];
      if (!r.z.parent) continue;
      for (let k = 0; k < r.parts.length; k++) {
        const p = r.parts[k];
        if (p.geometry !== r.geos[k] || p.material !== r.mats[k]) {
          unbuild(r);
          REC.delete(r.z);
          LIST.splice(i--, 1);
          merge(r.z);
          ZB.stats.rebuilt++;
          break;
        }
      }
    }
    /* zombies gone from the world (corpse cleanup, gibbed, new world): free their merged mesh after a few seconds */
    if ((pruneT = (pruneT + 1) % 60) === 0)
      for (let i = LIST.length - 1; i >= 0; i--) {
        const r = LIST[i];
        let o = r.z;
        while (o && o.parent) o = o.parent;
        if (o === scene) {
          r.gone = 0;
          continue;
        }
        if (++r.gone >= 5) {
          unbuild(r);
          REC.delete(r.z);
          LIST.splice(i, 1);
          ZB.stats.freed++;
        }
      }
    ZB.stats.live = LIST.length;
  }
  ZB.tick = tick;
  /* runs just before each frame's main render */
  (function install() {
    if (typeof renderer === 'undefined' || !renderer || typeof scene === 'undefined' || !scene)
      return setTimeout(install, 200);
    const o = renderer.render;
    renderer.render = function (s, c) {
      if (s === scene)
        try {
          tick();
        } catch (e) {
          console.warn('[zbatch] tick', e);
        }
      return o.apply(this, arguments);
    };
  })();
  console.log('[zbatch] zombie draw batching ready');
})();
