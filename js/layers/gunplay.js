/* ==========================================================================================================
   MINI FORT ZOMBIE - GUNPLAY LAYER (054)
   Replaces the icon-extruded gun models and the block viewmodel with Modern gun geometry
   (MIT, (c) 2026 BenDBSS) and a new animation / recoil layer. The MFZ rules (skills, dice damage, hit chance,
   ammo, inventory) are untouched: this layer only changes how guns LOOK, MOVE and KICK.
   - separate viewmodel pass (depth cleared: the gun never clips into walls, own 54deg -> 44deg FOV)
   - ADS aligns the sight line exactly (info.sightY / info.adsZ), spring recoil, bob, sway, sprint pose
   - choreographed reloads (mag out / in, charging handle, shell-by-shell for tube guns), bolt / slide / pump cycling
   - camera recoil with climb / SMG / random patterns and aim return after bursts (ported from Modern 07ca-recul)
   - muzzle flash + light, ejected brass and dropped magazines in the world
   ========================================================================================================== */
(function () {
  'use strict';
  if (!window.RGUN || typeof WDEF === 'undefined' || typeof animVM !== 'function') {
    console.warn('[gunplay054] prerequisites missing, layer disabled');
    return;
  }
  const T = THREE,
    V3 = T.Vector3,
    RG = window.RGUN;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v),
    lerp = (a, b, t) => a + (b - a) * t,
    ss = t => t * t * (3 - 2 * t),
    rr = (a, b) => a + Math.random() * (b - a),
    c01 = t => clamp(t, 0, 1);
  const seg = (p, a, b) => c01((p - a) / (b - a));

  /* ---------------- which Modern model each MFZ gun uses (bespoke period models come in a later pass) ---------------- */
  const GUNS = {
    beretta_9mm: ['m9'],
    desert_eagle: ['deagle'],
    glock_21: ['glock18'],
    glock_22: ['glock22', {tan: 'poly'}],
    m1911a1: ['usp'],
    colt_detective_special: ['dspecial'],
    colt_new_service_revolver: ['newservice'],
    colt_python: ['python'],
    mac10: ['mp7'],
    uzi: ['mp5'],
    tommygun: ['tommy'],
    ak47: ['ak47'],
    m16: ['m4~long'],
    ar90: ['ar90'],
    m4: ['m4'],
    m1_garand: ['garand'],
    lee_enfield: ['l96', {taupe: 'woodB'}, 'irons'],
    model_70_safari: ['l96', {taupe: 'woodR'}, 'scope'],
    pump_shotgun: ['rem870'],
    shotgun: ['rem870'],
    combat_shotgun: ['aa12']
  };
  /* feel categories (values from Modern's RECOIL / FEEL tables) */
  const CAT = {
    pistol: {
      pat: 'rand',
      kick: 0.045,
      rot: 0.1,
      roll: 0.25,
      spr: [340, 24],
      flash: 1.2,
      adsT: 0.15,
      zoom: 0.22,
      fovk: 1.6,
      mul: 1.3,
      back: 0.85,
      hip: 'pistol'
    },
    smg: {
      pat: 'smg',
      kick: 0.02,
      rot: 0.034,
      roll: 0.5,
      spr: [360, 26],
      flash: 0.9,
      adsT: 0.17,
      zoom: 0.26,
      fovk: 0.6,
      mul: 1.45,
      back: 0.7,
      hip: 'smg'
    },
    ar: {
      pat: 'climb',
      kick: 0.03,
      rot: 0.045,
      roll: 0.4,
      spr: [260, 20],
      flash: 1.2,
      adsT: 0.22,
      zoom: 0.3,
      fovk: 1.1,
      mul: 1.55,
      back: 0.7,
      hip: 'rifle'
    },
    dmr: {
      pat: 'rand',
      kick: 0.07,
      rot: 0.07,
      roll: 0.6,
      spr: [110, 10],
      flash: 1.7,
      adsT: 0.28,
      zoom: 0.42,
      fovk: 3.0,
      mul: 1.15,
      back: 0.9,
      hip: 'sniper'
    },
    shot: {
      pat: 'rand',
      kick: 0.09,
      rot: 0.11,
      roll: 1.0,
      spr: [115, 10],
      flash: 2.2,
      adsT: 0.24,
      zoom: 0.28,
      fovk: 4.0,
      mul: 1.15,
      back: 0.9,
      hip: 'shotgun'
    }
  };
  /* id: [category, vertical recoil (rad), horizontal (rad), ejection ('rifle'|'pistol'|'shotgun'|'none'), cycle ('auto'|'manual'|'none')] */
  const GF = {
    beretta_9mm: ['pistol', 0.018, 0.006, 'pistol', 'auto'],
    glock_21: ['pistol', 0.016, 0.006, 'pistol', 'auto'],
    glock_22: ['pistol', 0.015, 0.006, 'pistol', 'auto'],
    m1911a1: ['pistol', 0.02, 0.006, 'pistol', 'auto'],
    desert_eagle: ['pistol', 0.036, 0.012, 'pistol', 'auto'],
    colt_detective_special: ['pistol', 0.022, 0.008, 'none', 'none'],
    colt_new_service_revolver: ['pistol', 0.026, 0.009, 'none', 'none'],
    colt_python: ['pistol', 0.034, 0.011, 'none', 'none'],
    mac10: ['smg', 0.0085, 0.007, 'pistol', 'auto'],
    uzi: ['smg', 0.0078, 0.0062, 'pistol', 'auto'],
    tommygun: ['smg', 0.0095, 0.007, 'pistol', 'auto'],
    ak47: ['ar', 0.0135, 0.0055, 'rifle', 'auto'],
    m16: ['ar', 0.0092, 0.004, 'rifle', 'auto'],
    ar90: ['ar', 0.0088, 0.0036, 'rifle', 'auto'],
    m4: ['ar', 0.0105, 0.0045, 'rifle', 'auto'],
    m1_garand: ['dmr', 0.02, 0.004, 'rifle', 'auto'],
    lee_enfield: ['dmr', 0.03, 0.005, 'rifle', 'manual'],
    model_70_safari: ['dmr', 0.05, 0.008, 'rifle', 'manual'],
    pump_shotgun: ['shot', 0.038, 0.01, 'shotgun', 'manual'],
    shotgun: ['shot', 0.045, 0.012, 'none', 'none'],
    combat_shotgun: ['shot', 0.03, 0.008, 'shotgun', 'manual']
  };
  /* viewmodel hip poses [x,y,z, rx,ry,rz] (Modern VM_HIP) */
  const HIP = {
    rifle: [0.13, -0.15, -0.28, 0.07, 0.12, -0.04],
    smg: [0.13, -0.14, -0.28, 0.06, 0.12, -0.04],
    sniper: [0.14, -0.16, -0.26, 0.015, 0.08, -0.02],
    shotgun: [0.13, -0.144, -0.27, 0.02, 0.09, -0.03],
    pistol: [0.1, -0.088, -0.38, 0.03, 0.06, -0.02]
  };

  const X = (window.RGX = {
    on: true,
    sp: {z: 0, vz: 0, rx: 0, vrx: 0, rz: 0, vrz: 0, ry: 0, vry: 0},
    recPend: 0,
    recArm: false,
    lastShot: -9,
    burst: 0,
    bloom: 0,
    fovk: 0,
    swX: 0,
    swY: 0,
    bobT: 0,
    sprintK: 0,
    pPrev: 0,
    pPrevS: 0,
    yPrev: 0,
    errs: 0,
    shells: [],
    mags: [],
    fx: null
  });
  const VMX = (X.vm = {
    ready: false,
    scene: null,
    cam: null,
    hemi: null,
    dir: null,
    torch: null,
    flashL: null,
    cache: {},
    cur: null,
    rdr: null,
    env: null,
    active: false
  });

  /* ---------------- viewmodel scene ---------------- */
  function ensure() {
    if (VMX.ready && VMX.rdr === renderer) return true;
    if (typeof renderer === 'undefined' || !renderer) return false;
    if (!VMX.ready) {
      VMX.scene = new T.Scene();
      VMX.cam = new T.PerspectiveCamera(58, innerWidth / innerHeight, 0.008, 8);
      VMX.hemi = new T.HemisphereLight(0xdfe8ff, 0x3a3630, 0.6);
      VMX.dir = new T.DirectionalLight(0xffffff, 1);
      VMX.scene.add(VMX.hemi, VMX.dir, VMX.dir.target);
      VMX.torch = new T.SpotLight(0xfff0cc, 0, 6, Math.PI / 5, 0.5, 1.4);
      VMX.torch.position.set(0, 0, 0);
      VMX.torch.target.position.set(0, 0, -2);
      VMX.scene.add(VMX.torch, VMX.torch.target);
      VMX.flashL = new T.PointLight(0xffa850, 0, 1.6, 2);
      VMX.scene.add(VMX.flashL);
      X.fx = {
        flashTex: flashTexture(),
        skin: new T.MeshStandardMaterial({color: 0x2a2622, roughness: 0.82, metalness: 0.02, envMapIntensity: 0.25}),
        sleeve: new T.MeshStandardMaterial({color: 0x3b4730, roughness: 0.95, envMapIntensity: 0.2}),
        brass: new T.MeshStandardMaterial({color: 0xb58f3e, roughness: 0.3, metalness: 1, envMapIntensity: 0.5}),
        red: new T.MeshStandardMaterial({color: 0x9c2a1c, roughness: 0.5})
      };
      if (window.RGHAND) {
        const H = RGHAND;
        H.LOOK.hand = new T.MeshStandardMaterial({
          vertexColors: true,
          color: 0x4d4c47,
          roughness: 0.8,
          metalness: 0.02,
          envMapIntensity: 0.3
        });
        H.LOOK.arm = new T.MeshStandardMaterial({
          vertexColors: true,
          color: 0x59643f,
          roughness: 0.95,
          side: T.DoubleSide,
          envMapIntensity: 0.2
        });
      }
      VMX.ready = true;
    }
    VMX.rdr = renderer;
    if (!X.scopeEl) {
      const e = document.createElement('div');
      e.id = 'rgScope';
      const svg =
        "<svg xmlns='http://www.w3.org/2000/svg' viewBox='-100 -100 200 200' preserveAspectRatio='xMidYMid slice'><g stroke='black' fill='none'><line x1='-100' y1='0' x2='-6' y2='0' stroke-width='.35'/><line x1='6' y1='0' x2='100' y2='0' stroke-width='.35'/><line x1='0' y1='-100' x2='0' y2='-6' stroke-width='.35'/><line x1='0' y1='6' x2='0' y2='100' stroke-width='.35'/><line x1='-100' y1='0' x2='-26' y2='0' stroke-width='1.6'/><line x1='26' y1='0' x2='100' y2='0' stroke-width='1.6'/><line x1='0' y1='-100' x2='0' y2='-26' stroke-width='1.6'/><line x1='0' y1='26' x2='0' y2='100' stroke-width='1.6'/><circle r='.5' fill='black'/></g></svg>";
      e.style.cssText =
        'position:fixed;inset:0;pointer-events:none;opacity:0;z-index:3;background:url("data:image/svg+xml,' +
        encodeURIComponent(svg) +
        '") center/cover no-repeat,radial-gradient(circle at 50% 50%,rgba(0,0,0,0) 0,rgba(0,0,0,0) 37vmin,rgba(0,0,0,.55) 37.4vmin,#000 40vmin)';
      document.body.appendChild(e);
      X.scopeEl = e;
    }
    if (!renderer.__rg) {
      renderer.__rg = 1;
      const o = renderer.render; // viewmodel pass: depth cleared, own camera (three r147 defines render() per instance, not on the prototype)
      renderer.render = function (s, c) {
        if (VMX.active && s === scene && c === camera) {
          o.call(this, s, c);
          const ac = this.autoClear;
          this.autoClear = false;
          this.clearDepth();
          o.call(this, VMX.scene, VMX.cam);
          this.autoClear = ac;
          return;
        }
        return o.call(this, s, c);
      };
    }
    VMX.env = window.RGUN_makeEnv(renderer);
    const M = RG.gunMaterials();
    for (const k in M)
      if (M[k].isMeshStandardMaterial) {
        M[k].envMap = VMX.env;
        M[k].needsUpdate = true;
      }
    for (const k of ['skin', 'sleeve', 'brass', 'red']) {
      X.fx[k].envMap = VMX.env;
      X.fx[k].needsUpdate = true;
    }
    if (window.RGHAND) {
      for (const k of ['hand', 'arm']) {
        const m = RGHAND.LOOK[k];
        if (m) {
          m.envMap = VMX.env;
          m.needsUpdate = true;
        }
      }
    }
    return true;
  }
  function flashTexture() {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d'),
      r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, 'rgba(255,255,235,1)');
    r.addColorStop(0.25, 'rgba(255,214,120,.95)');
    r.addColorStop(0.6, 'rgba(255,140,40,.45)');
    r.addColorStop(1, 'rgba(255,90,0,0)');
    g.fillStyle = r;
    g.fillRect(0, 0, 64, 64);
    g.strokeStyle = 'rgba(255,230,160,.9)';
    g.lineWidth = 3;
    for (let i = 0; i < 6; i++) {
      const a = (i * Math.PI) / 3 + 0.3;
      g.beginPath();
      g.moveTo(32, 32);
      g.lineTo(32 + Math.cos(a) * 31, 32 + Math.sin(a) * 31);
      g.stroke();
    }
    const t = new T.CanvasTexture(c);
    return t;
  }

  /* ---------------- hands (stylised gloves, sleeves) ---------------- */
  function cap(par, mat, a, b, r) {
    const d = new V3().subVectors(b, a),
      L = d.length(),
      m = new T.Mesh(new T.CapsuleGeometry(r, Math.max(0.0002, L - 2 * r), 3, 8), mat);
    m.position.copy(a).addScaledVector(d, 0.5);
    m.quaternion.setFromUnitVectors(new V3(0, 1, 0), d.normalize());
    par.add(m);
    return m;
  }
  function bxm(par, mat, c, sx, sy, sz, rx = 0, ry = 0, rz = 0) {
    const m = new T.Mesh(new T.BoxGeometry(sx, sy, sz), mat);
    m.position.copy(c);
    m.rotation.set(rx, ry, rz);
    par.add(m);
    return m;
  }
  const P = (x, y, z) => new V3(x, y, z);
  function buildHands(info) {
    const F = X.fx,
      R = new T.Group(),
      L = new T.Group(),
      G0 = info.gripR,
      pis = info.kind === 'pistol';
    // ---- right hand: palm on the right/back of the grip, fingers wrapping the front, index on the trigger
    const g = G0;
    bxm(R, F.skin, P(g.x + 0.026, g.y + 0.002, g.z + 0.014), 0.026, 0.088, 0.05);
    [0.03, 0.011, -0.008, -0.027].forEach((y, i) => {
      if (i === 0) {
        cap(R, F.skin, P(g.x + 0.02, g.y + y, g.z - 0.012), P(g.x + 0.012, g.y + y, g.z - 0.052), 0.0095);
        cap(R, F.skin, P(g.x + 0.012, g.y + y, g.z - 0.052), P(g.x + 0.012, g.y + y, g.z - 0.07), 0.0085);
      } else {
        cap(R, F.skin, P(g.x + 0.021, g.y + y, g.z - 0.014), P(g.x - 0.018, g.y + y, g.z - 0.03), 0.0098);
        cap(R, F.skin, P(g.x - 0.018, g.y + y, g.z - 0.03), P(g.x - 0.026, g.y + y, g.z - 0.004), 0.0088);
      }
    });
    cap(R, F.skin, P(g.x + 0.03, g.y + 0.042, g.z + 0.022), P(g.x + 0.006, g.y + 0.05, g.z - 0.03), 0.0105);
    cap(R, F.sleeve, P(g.x + 0.034, g.y + 0.024, g.z + 0.04), P(g.x + 0.1, g.y - 0.05, g.z + 0.4), 0.036);
    bxm(R, F.skin, P(g.x + 0.034, g.y + 0.022, g.z + 0.042), 0.05, 0.05, 0.03);
    // ---- left (support) hand
    let q = info.gripL || P(0, -0.03, -0.2);
    if (pis) {
      q = P(g.x, g.y, g.z);
      bxm(L, F.skin, P(q.x - 0.027, q.y + 0.002, q.z + 0.014), 0.024, 0.082, 0.05);
      [-0.018, -0.04, -0.062].forEach(y => {
        cap(L, F.skin, P(q.x - 0.02, q.y + y, q.z - 0.012), P(q.x + 0.016, q.y + y, q.z - 0.036), 0.0098);
        cap(L, F.skin, P(q.x + 0.016, q.y + y, q.z - 0.036), P(q.x + 0.02, q.y + y, q.z - 0.012), 0.009);
      });
      cap(L, F.skin, P(q.x - 0.028, q.y + 0.034, q.z + 0.012), P(q.x - 0.02, q.y + 0.036, q.z - 0.058), 0.0105);
      cap(L, F.sleeve, P(q.x - 0.034, q.y - 0.01, q.z + 0.04), P(q.x - 0.2, q.y - 0.13, q.z + 0.42), 0.036);
    } else {
      bxm(L, F.skin, P(q.x, q.y - 0.034, q.z + 0.012), 0.056, 0.02, 0.07);
      [0.026, 0.009, -0.008, -0.025].forEach(z => {
        cap(L, F.skin, P(q.x - 0.012, q.y - 0.034, q.z + z), P(q.x + 0.032, q.y - 0.03, q.z + z), 0.0092);
        cap(L, F.skin, P(q.x + 0.032, q.y - 0.03, q.z + z), P(q.x + 0.03, q.y + 0.004, q.z + z), 0.0086);
      });
      cap(L, F.skin, P(q.x - 0.03, q.y - 0.03, q.z + 0.026), P(q.x - 0.034, q.y + 0.012, q.z - 0.014), 0.0105);
      cap(L, F.sleeve, P(q.x - 0.012, q.y - 0.04, q.z + 0.05), P(q.x - 0.2, q.y - 0.15, q.z + 0.46), 0.036);
    }
    L.userData.rest = q.clone();
    R.traverse(o => {
      if (o.isMesh) o.frustumCulled = false;
    });
    L.traverse(o => {
      if (o.isMesh) o.frustumCulled = false;
    });
    return {R, L, q};
  }

  /* ---------------- scope handling: l96 carries an integral scope. 'irons' (Lee-Enfield) swaps it for Modern-style iron sights,
   'scope' (Model 70) keeps it but lets the scope be seen through: the scope model hides on aim and a scope overlay takes over ---------------- */
  function prepSights(info, flag) {
    if (!flag || info.__sx) return;
    info.__sx = 1;
    info.group.updateMatrixWorld(true);
    const sc = [];
    info.group.traverse(o => {
      if (!o.isMesh) return;
      const b = new T.Box3().setFromObject(o);
      if (b.min.y > 0.056 && b.min.z > -0.3 && b.max.z < 0.06) sc.push(o);
    });
    if (flag === 'scope') {
      info.scopeMeshes = sc;
      return;
    }
    for (const o of sc) o.parent && o.parent.remove(o);
    const M = RG.gunMaterials(),
      g = info.group,
      dk = M.dark,
      mt = M.metal;
    const bx = (m, x, y, z, w, h, d) => {
      const q = new T.Mesh(new T.BoxGeometry(w, h, d), m);
      q.position.set(x, y, z);
      g.add(q);
      return q;
    };
    // rear: receiver bridge with two guard wings and a peep aperture ring
    bx(dk, 0, 0.0575, -0.018, 0.03, 0.012, 0.032);
    for (const sd of [-1, 1]) {
      bx(dk, sd * 0.0125, 0.0715, -0.0185, 0.004, 0.026, 0.016);
      bx(mt, sd * 0.0125, 0.0845, -0.0185, 0.0042, 0.002, 0.0165);
    }
    bx(dk, 0, 0.0635, -0.0105, 0.006, 0.016, 0.006);
    const ring = new T.Mesh(new T.TorusGeometry(0.0069, 0.0015, 8, 24), dk);
    ring.position.set(0, 0.0745, -0.0105);
    g.add(ring);
    const ap = new T.Mesh(new T.TorusGeometry(0.005, 0.0007, 6, 16), mt);
    ap.position.set(0, 0.0745, -0.0112);
    g.add(ap);
    // front: barrel band, blade post and protective ears (Lee-Enfield style hood)
    bx(dk, 0, 0.0555, -0.7, 0.0225, 0.012, 0.024);
    bx(dk, 0, 0.0651, -0.7, 0.0032, 0.01875, 0.004); // v079: post top = aperture centre .0745 (was .0783)
    for (const sd of [-1, 1]) {
      bx(dk, sd * 0.0085, 0.0685, -0.7, 0.0028, 0.0285, 0.026);
      bx(dk, sd * 0.0085, 0.0838, -0.7, 0.0044, 0.0022, 0.0262);
    }
    bx(mt, 0, 0.0737, -0.7005, 0.0026, 0.0016, 0.0034);
    info.sightY = 0.0745;
    info.adsZ = 0.0105 * 0 + 0.15;
    info.irons = true;
  }

  /* ---------------- v079: sight calibration. The ADS pose puts info.sightY on the screen centre, but several models' sightY did not match
   their real front sight (revolvers ~12 px high, Glocks / Tommy gun / AR90 / shotguns / Enfield a few px), so the gun covered the aim point.
   Here the real sight line is measured once per gun: rays are cast straight down the bore axis (x = 0) at heights around sightY; the top
   of the FRONT sight is the height where a ray stops hitting geometry in the front part of the gun (front post / blade / bead; a hood or
   ring around it is skipped because the edge closest to the old sightY is used). sightY becomes that height, so the tip of the front sight
   sits exactly on the aim point. Scoped guns (overlay takes over) keep their value. ---------------- */
  function calibrateSight(info) {
    if (info.__cal || info.scopeMeshes) return;
    info.__cal = 1;
    try {
      const g = info.group;
      g.updateMatrixWorld(true);
      const inv = new T.Matrix4().copy(g.matrixWorld).invert(),
        mz = info.muzzle.getWorldPosition(new V3()).applyMatrix4(inv).z,
        ez = info.adsZ,
        len = ez - mz;
      if (!(len > 0.05)) return;
      const meshes = [];
      g.traverse(o => {
        if (!o.isMesh) return;
        for (let p = o; p && p !== g.parent; p = p.parent) if (p.visible === false) return;
        meshes.push(o);
      });
      const rc = new T.Raycaster(),
        o = new V3(),
        dir = new V3(0, 0, -1).transformDirection(g.matrixWorld),
        y0 = info.sightY,
        stp = 0.00015,
        N = 240;
      const front = y => {
        o.set(0, y, ez).applyMatrix4(g.matrixWorld);
        rc.set(o, dir);
        rc.far = len * 1.6;
        const h = rc.intersectObjects(meshes, false)[0];
        if (!h) return false;
        const lz = h.point.clone().applyMatrix4(inv).z;
        return (ez - lz) / len > 0.78;
      };
      const F = [];
      for (let i = -N; i <= N; i++) F.push(front(y0 + i * stp));
      let best = null;
      for (let i = 0; i < F.length - 1; i++)
        if (F[i] && !F[i + 1]) {
          const y = y0 + (i - N) * stp + stp * 0.5;
          if (best === null || Math.abs(y - y0) < Math.abs(best - y0)) best = y;
        }
      if (best !== null && Math.abs(best - y0) < 0.03) {
        info.sightY0 = y0;
        info.sightY = best;
      }
    } catch (e) {
      console.warn('[gunplay] sight calibration', e);
    }
  }

  /* ---------------- per-gun instance ---------------- */
  function feelOf(id) {
    const f = GF[id] || ['ar', 0.01, 0.005, 'rifle', 'auto'],
      c = CAT[f[0]];
    return Object.assign({id, cat: f[0], v: f[1], h: f[2], eject: f[3], cyc: f[4]}, c);
  }
  function getGun(id) {
    let g = VMX.cache[id];
    if (g) return g;
    const m = GUNS[id] || GUNS.ak47,
      info = RG.buildGunModel(m[0]);
    if (m[1]) {
      const M = RG.gunMaterials();
      info.group.traverse(o => {
        if (o.isMesh) for (const a in m[1]) if (o.material === M[a]) o.material = M[m[1][a]];
      });
    }
    prepSights(info, m[2]);
    calibrateSight(info);
    const root = new T.Group();
    root.add(info.group);
    const hands = buildHands(info);
    let arms = null;
    if (window.RGHAND && RGHAND.LOOK.hand) {
      try {
        arms = {R: RGHAND.makeArm(null, root, -1), L: RGHAND.makeArm(null, root, 1)};
        arms.R.hand.userData.trigSrc = () => (g && g.trigK) || 0;
      } catch (e) {
        console.warn('[gunplay] modern arms failed', e);
        arms = null;
      }
    }
    if (!arms) root.add(hands.R, hands.L);
    // muzzle flash
    const fl = new T.Group(),
      fm = new T.MeshBasicMaterial({
        map: X.fx.flashTex,
        transparent: true,
        depthWrite: false,
        blending: T.AdditiveBlending,
        color: 0xffffff
      });
    const p1 = new T.Mesh(new T.PlaneGeometry(1, 1), fm),
      p2 = p1.clone();
    p2.rotation.z = Math.PI / 2;
    const p3 = new T.Mesh(new T.PlaneGeometry(1, 1), fm);
    p3.rotation.y = Math.PI / 2; // side plane seen from the shooter
    fl.add(p1, p2, p3);
    fl.position.copy(info.muzzle.position);
    fl.visible = false;
    root.add(fl);
    root.visible = false;
    VMX.scene.add(root);
    g = {
      id,
      key: m[0],
      info,
      root,
      hands,
      arms,
      trigK: 0,
      flash: fl,
      F: feelOf(id),
      d: WDEF[id],
      st: {cyc: -1, cycT: 0, ejDelay: -1, hold: 0, dropped: false, mt: 0, empty: false, rl: 0, pumpDone: true},
      base: {
        mag: info.mag.position.clone(),
        slide: info.slide ? info.slide.position.clone() : null,
        bolt: info.bolt ? info.bolt.position.clone() : null,
        pump: info.pump ? info.pump.position.clone() : null
      }
    };
    VMX.cache[id] = g;
    return g;
  }

  X.getGun = getGun;
  X.GUNS = GUNS;
  X.ensure = ensure; /* v079: used by the sight-alignment check (tools/sightcheck) */
  /* ---------------- static merged model for NPCs / world (grip at origin, barrel -Z, same as the old models) ---------------- */
  const STAT = {};
  function mergeStatic(root, off) {
    root.updateMatrixWorld(true);
    const groups = new Map();
    root.traverse(o => {
      if (!o.isMesh || !o.geometry.attributes.position) return;
      for (let p = o; p; p = p.parent) if (p.visible === false) return;
      (groups.get(o.material) || groups.set(o.material, []).get(o.material)).push(o);
    });
    const out = new T.Group(),
      m4 = new T.Matrix4(),
      n3 = new T.Matrix3(),
      v = new V3(),
      tr = new T.Matrix4().makeTranslation(off.x, off.y, off.z);
    for (const [mat, list] of groups) {
      let nv = 0,
        ni = 0;
      for (const o of list) {
        const gg = o.geometry;
        nv += gg.attributes.position.count;
        ni += gg.index ? gg.index.count : gg.attributes.position.count;
      }
      const pos = new Float32Array(nv * 3),
        nor = new Float32Array(nv * 3),
        idx = new Uint32Array(ni);
      let vo = 0,
        io = 0;
      for (const o of list) {
        const gg = o.geometry,
          Pa = gg.attributes.position,
          N = gg.attributes.normal;
        m4.multiplyMatrices(tr, o.matrixWorld);
        n3.getNormalMatrix(m4);
        for (let i = 0; i < Pa.count; i++) {
          v.fromBufferAttribute(Pa, i).applyMatrix4(m4);
          pos[(vo + i) * 3] = v.x;
          pos[(vo + i) * 3 + 1] = v.y;
          pos[(vo + i) * 3 + 2] = v.z;
          if (N) {
            v.fromBufferAttribute(N, i).applyMatrix3(n3).normalize();
            nor[(vo + i) * 3] = v.x;
            nor[(vo + i) * 3 + 1] = v.y;
            nor[(vo + i) * 3 + 2] = v.z;
          }
        }
        if (gg.index) {
          for (let i = 0; i < gg.index.count; i++) idx[io + i] = gg.index.getX(i) + vo;
          io += gg.index.count;
        } else {
          for (let i = 0; i < Pa.count; i++) idx[io + i] = vo + i;
          io += Pa.count;
        }
        vo += Pa.count;
      }
      const geo = new T.BufferGeometry();
      geo.setAttribute('position', new T.BufferAttribute(pos, 3));
      geo.setAttribute('normal', new T.BufferAttribute(nor, 3));
      geo.setIndex(new T.BufferAttribute(idx, 1));
      out.add(new T.Mesh(geo, mat));
    }
    return out;
  }
  function staticModel(id) {
    if (STAT[id]) return STAT[id];
    const m = GUNS[id] || GUNS.ak47,
      info = RG.buildGunModel(m[0]);
    if (m[1]) {
      const M = RG.gunMaterials();
      info.group.traverse(o => {
        if (o.isMesh) for (const a in m[1]) if (o.material === M[a]) o.material = M[m[1][a]];
      });
    }
    prepSights(info, m[2]);
    const off = info.gripR.clone().negate(),
      g = mergeStatic(info.group, off),
      mz = info.muzzle.position.clone().add(off),
      b = new T.Box3().setFromObject(g),
      top = b.max.y;
    return (STAT[id] = {g, mz: [mz.x, mz.y, mz.z], len: -b.min.z, Wm: 0.1, Hm: 0.1, top});
  }
  const _modelFor = window.modelFor;
  window.modelFor = function (id) {
    const d = WDEF[id];
    if (d && d.type === 'gun' && GUNS[id] && X.on && window.RGUN_makeEnv) {
      try {
        ensure();
        return staticModel(id);
      } catch (e) {
        console.warn('[gunplay054] static model failed', id, e);
      }
    }
    return _modelFor(id);
  };

  /* ---------------- world helpers: brass, dropped magazines ---------------- */
  function toWorld(p) {
    camera.updateMatrixWorld(true);
    return camera.localToWorld(p.clone());
  }
  function dirWorld(v) {
    camera.updateMatrixWorld(true);
    return v.clone().transformDirection(camera.matrixWorld).multiplyScalar(v.length());
  }
  const shellGeo = {rifle: null, pistol: null, shotgun: null};
  function spawnShell(g, kind) {
    if (kind === 'none' || !g.info.eject) return;
    if (!shellGeo.rifle) {
      shellGeo.rifle = new T.CylinderGeometry(0.0058, 0.0058, 0.05, 8);
      shellGeo.pistol = new T.CylinderGeometry(0.0048, 0.0048, 0.02, 8);
      shellGeo.shotgun = new T.CylinderGeometry(0.0105, 0.0105, 0.07, 10);
    }
    const m = new T.Mesh(shellGeo[kind], kind === 'shotgun' ? X.fx.red : X.fx.brass);
    g.root.updateMatrixWorld(true);
    const p = g.info.eject.getWorldPosition(new V3());
    m.position.copy(toWorld(p));
    m.rotation.set(rr(0, 6), rr(0, 6), rr(0, 6));
    const v = dirWorld(new V3(rr(1.3, 2.4), rr(1.1, 2.1), rr(-0.2, 0.5)));
    scene.add(m);
    X.shells.push({m, v, w: new V3(rr(-14, 14), rr(-14, 14), rr(-14, 14)), t: 0, life: 9, mag: false});
    if (X.shells.length > 36) {
      const o = X.shells.shift();
      scene.remove(o.m);
    }
  }
  function dropMag(g) {
    const mg = g.info.mag;
    if (!mg || !mg.children.length || !mg.visible) return;
    const m = mg.clone(true);
    g.root.updateMatrixWorld(true);
    const p = mg.getWorldPosition(new V3()),
      q = mg.getWorldQuaternion(new T.Quaternion());
    m.position.copy(toWorld(p));
    m.quaternion.copy(camera.getWorldQuaternion(new T.Quaternion()).multiply(q));
    m.scale.set(1, 1, 1);
    scene.add(m);
    const v = dirWorld(new V3(rr(-0.3, 0.3), -0.6, rr(-0.1, 0.3)));
    X.shells.push({m, v, w: new V3(rr(-4, 4), rr(-3, 3), rr(-4, 4)), t: 0, life: 12, mag: true});
    if (X.shells.length > 36) {
      const o = X.shells.shift();
      scene.remove(o.m);
    }
  }
  function updShells(dt) {
    for (let i = X.shells.length - 1; i >= 0; i--) {
      const s = X.shells[i];
      s.t += dt;
      if (s.t > s.life) {
        scene.remove(s.m);
        X.shells.splice(i, 1);
        continue;
      }
      if (!s.rest) {
        s.v.y -= 9.8 * dt;
        s.m.position.addScaledVector(s.v, dt);
        s.m.rotation.x += s.w.x * dt;
        s.m.rotation.y += s.w.y * dt;
        s.m.rotation.z += s.w.z * dt;
        let gy = 0;
        try {
          gy = groundAt(s.m.position.x, s.m.position.z, s.m.position.y);
        } catch (e) {}
        const fl = gy + (s.mag ? 0.03 : 0.006);
        if (s.m.position.y < fl) {
          s.m.position.y = fl;
          if (Math.abs(s.v.y) > 0.7) {
            s.v.y *= -0.32;
            s.v.x *= 0.55;
            s.v.z *= 0.55;
            s.w.multiplyScalar(0.5);
          } else {
            s.rest = true;
          }
        }
      }
    }
  }

  /* ---------------- camera recoil (Modern 07ca-recul, adapted) ---------------- */
  function applyRecoil(F) {
    const now = performance.now() / 1000;
    if (now - X.lastShot > 0.32) X.burst = 0;
    else X.burst++;
    const spd = K.KeyW || K.KeyA || K.KeyS || K.KeyD ? (K.ShiftLeft ? 6 : 3) : 0;
    let m = F.mul * lerp(1, 0.66, G.ads) * (G.crouch ? 0.75 : 1);
    if (spd > 2.5) m *= 1.2;
    if (G.vy && Math.abs(G.vy) > 0.5) m *= 1.5;
    let kv = F.v * m * rr(0.9, 1.1),
      kh;
    const n = X.burst;
    if (F.pat === 'climb') {
      kv *= lerp(0.85, 1.25, c01(n / 5));
      kh = (Math.sin(n * 0.55 + 0.6) * 1.2 + (Math.random() - 0.5) * 0.6) * F.h;
    } else if (F.pat === 'smg') {
      kv *= n ? 1 : 0.95;
      kh = (Math.random() - 0.5) * 2.6 * F.h;
    } else kh = (Math.random() - 0.5) * 2 * F.h;
    pitch = clamp(pitch + kv, -1.45, 1.45);
    yaw -= kh * m;
    pl.rotation.y = yaw;
    camera.rotation.x = pitch;
    X.recPend += kv;
    X.lastShot = now;
    X.recArm = false;
  }
  function recoilTick(dt) {
    const now = performance.now() / 1000,
      F = VMX.cur ? VMX.cur.F : CAT.ar;
    const manual = pitch - X.pPrev;
    if (X.recPend > 0) {
      if (manual < 0) X.recPend = Math.max(0, X.recPend + manual);
      if (now - X.lastShot >= 0.1) {
        if (!X.recArm) {
          X.recArm = true;
          X.recPend *= F.back;
        }
        const dp = X.recPend * (1 - Math.exp(-7 * dt));
        pitch -= dp;
        X.recPend -= dp;
        if (X.recPend < 1e-4) X.recPend = 0;
        camera.rotation.x = pitch;
      }
    }
    X.pPrev = pitch;
  }
  /* spread: keep MFZ's numbers, add bloom during sustained fire */
  X.spread = function (d, aim, mv) {
    const b = 1 + X.bloom;
    return aim ? (d.pel > 1 ? d.spr * 0.5 : d.spr * 0.22 * X.bloom) : d.spr * (mv ? 1.5 : 1) * (G.crouch ? 0.7 : 1) * b;
  };

  /* ---------------- shot effects ---------------- */
  X.afterShot = function (d, w) {
    try {
      const g = getGun(w.id),
        F = g.F,
        st = g.st,
        s = X.sp,
        a = 1 - G.ads * 0.35;
      g.trigK = 1;
      applyRecoil(F);
      X.bloom = Math.min(1.1, X.bloom + 0.22);
      const sc = 0.6 + 0.8 * (d.kick || 0.6),
        vis = 1.45;
      s.z += F.kick * vis * sc * a * 0.9;
      s.rx += F.rot * vis * sc * a;
      s.rz += (Math.random() - 0.5) * 2 * F.roll * F.rot * vis * a;
      s.ry += (Math.random() - 0.5) * F.rot * vis * 0.6 * a;
      X.fovk = Math.min(5, X.fovk + F.fovk * (1 - G.ads * 0.5) * (0.6 + 0.4 * sc));
      // flash
      g.flash.visible = true;
      g.flash.userData.t = 0.055;
      const fs = 0.11 * F.flash * (1 - G.ads * 0.4);
      g.flash.scale.setScalar(fs);
      g.flash.rotation.z = rr(0, 6.28);
      g.flash.children[0].scale.set(1, 1, 1);
      VMX.flashL.intensity = 2.2 * F.flash;
      VMX.flashL.userData.t = 0.05;
      // cycling + brass
      if (F.cyc === 'auto') {
        st.cyc = 0;
        st.cycT = Math.min(0.09, Math.max(0.045, d.cd * 0.7));
        st.cycK = 'auto';
      } else if (F.cyc === 'manual') {
        st.cyc = 0;
        st.cycT = Math.max(0.35, Math.min(0.9, d.cd * 0.62));
        st.cycK = 'manual';
        st.ejDelay = st.cycT * 0.4;
      }
      if (F.cyc === 'auto' || F.eject === 'none') {
      }
      if (F.cyc === 'auto') spawnShell(g, F.eject);
    } catch (e) {
      if (X.errs++ < 3) console.warn('[gunplay054] afterShot', e);
    }
  };

  /* ---------------- viewmodel per-frame ---------------- */
  function isGunEq() {
    const w = G.eq,
      d = w && WDEF[w.id];
    return !!(d && d.type === 'gun' && GUNS[w.id] && X.on);
  }
  function syncLights(dt) {
    const d = clamp((ambL.intensity - 0.18) / 0.5, 0, 1);
    VMX.hemi.intensity = 0.14 + ambL.intensity * 0.6;
    VMX.dir.intensity = dirL.intensity * 0.6;
    VMX.dir.color.copy(dirL.color);
    const q = camera.getWorldQuaternion(new T.Quaternion()).invert(),
      dd = dirL.position.clone().sub(dirL.target.position).normalize().applyQuaternion(q);
    VMX.dir.position.copy(dd).multiplyScalar(4);
    VMX.torch.intensity = torchL.intensity * 1.3;
    const M = RG.gunMaterials(),
      k = 0.3 + 0.7 * d;
    for (const n in M)
      if (M[n].isMeshStandardMaterial)
        M[n].envMapIntensity = (n === 'glass' || n === 'lens' || n === 'lensR' ? 2 : 1) * k;
    X.fx.brass.envMapIntensity = 0.5 * k;
  }
  function isSprinting() {
    return !!(locked && (K.KeyW || K.KeyA || K.KeyS || K.KeyD) && K.ShiftLeft && G.st > 5 && !G.stLock && !G.crouch);
  }
  function pose(g, dt) {
    const d = g.d,
      F = g.F,
      info = g.info,
      st = g.st,
      s = X.sp;
    const hip = HIP[F.hip],
      a = ss(G.ads);
    let px = lerp(hip[0], 0, a),
      py = lerp(hip[1], -info.sightY, a),
      pz = lerp(hip[2], -info.adsZ, a),
      rx = hip[3] * (1 - a),
      ry = hip[4] * (1 - a),
      rz = hip[5] * (1 - a);
    // movement bob, sway, sprint
    const moving = locked && (K.KeyW || K.KeyA || K.KeyS || K.KeyD),
      spr = isSprinting(),
      bobS = 1 - a; // v079: no bob on the sights (was 15 % left), so they stay on the aim point
    if (moving) X.bobT += dt * (spr ? 11 : G.crouch ? 5.5 : 8);
    const bx = Math.cos(X.bobT),
      by = (Math.cos(2 * X.bobT) - 1) * 0.5,
      amt = moving ? (spr ? 1.5 : 1) : 0;
    px += bx * 0.011 * amt * bobS;
    py += by * 0.012 * amt * bobS;
    rz += bx * 0.018 * amt * bobS;
    rx += Math.sin(X.bobT * 2) * 0.008 * amt * bobS;
    let dy = yaw - X.yPrev;
    dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    const dp = pitch - X.pPrevS;
    X.swX += (clamp(-dy * 2.2, -0.05, 0.05) - X.swX) * Math.min(1, dt * 10);
    X.swY += (clamp(-dp * 2.2, -0.05, 0.05) - X.swY) * Math.min(1, dt * 10);
    X.yPrev = yaw;
    X.pPrevS = pitch;
    px += X.swX * (1 - a);
    py += X.swY * (1 - a);
    ry += X.swX * 1.4 * (1 - a);
    rx += X.swY * 1.1 * (1 - a); // v079: no turn-sway on the sights (20 % = up to 1 cm drift)
    X.sprintK += ((spr && !(G.rl > 0) ? 1 : 0) - X.sprintK) * Math.min(1, dt * 9);
    const sk = ss(X.sprintK);
    if (sk > 0.001) {
      px -= 0.05 * sk;
      py -= 0.06 * sk;
      pz += 0.02 * sk;
      rx -= 0.4 * sk;
      ry += 0.55 * sk;
      rz -= 0.1 * sk;
    }
    // draw
    const dr = G.draw > 0 ? G.draw / 0.3 : 0;
    py -= dr * 0.35;
    rx += dr * 0.9;
    ry -= dr * 0.3;
    // reload choreography
    const rl = reloadPose(g, dt);
    px += rl.x;
    py += rl.y;
    pz += rl.z;
    rx += rl.rx;
    ry += rl.ry;
    rz += rl.rz;
    // v063: melee with the gun (Q): butt-stroke jab - the rifle cants, lifts and drives forward, then recovers
    if (G.swT > 0 && (G.swK === 'bash' || G.swK)) {
      const p = c01(1 - G.swT / (G.swD || 0.34)),
        w = ss(c01(p / 0.25)),
        hit = ss(c01((p - 0.18) / 0.25)),
        bk = ss(c01((p - 0.55) / 0.45)),
        k = hit * (1 - bk);
      px += 0.03 * w - 0.1 * k;
      py += 0.02 * w + 0.05 * k;
      pz += 0.05 * w - 0.3 * k;
      rx += -0.1 * w + 0.35 * k;
      ry += 0.15 * w - 0.25 * k;
      rz += 0.2 * w + 0.75 * k;
    }
    // recoil springs
    const k = F.spr[0],
      c = F.spr[1];
    for (let i = 0, n = Math.ceil(dt / 0.008); i < n; i++) {
      const h = dt / n;
      s.vz += (-k * s.z - c * s.vz) * h;
      s.z += s.vz * h;
      s.vrx += (-k * s.rx - c * s.vrx) * h;
      s.rx += s.vrx * h;
      s.vrz += (-k * s.rz - c * s.vrz) * h;
      s.rz += s.vrz * h;
      s.vry += (-k * s.ry - c * s.vry) * h;
      s.ry += s.vry * h;
    }
    g.root.position.set(px, py, pz + s.z);
    g.root.rotation.set(rx + s.rx, ry + s.ry, rz + s.rz, 'YXZ');
    return rl;
  }
  /* returns pose offsets and animates mag / left hand / moving parts */
  function reloadPose(g, dt) {
    const d = g.d,
      F = g.F,
      info = g.info,
      st = g.st,
      L = g.hands.L,
      rest = g.hands.q,
      out = {x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0};
    const rl = G.rl > 0,
      tube = info.tubeFed || d.rlN === 1;
    let handOff = new V3(),
      magShow = true,
      magPos = g.base.mag.clone();
    st.rlK = (st.rlK || 0) + ((rl ? 1 : 0) - (st.rlK || 0)) * Math.min(1, dt * 9);
    if (rl) {
      const p = 1 - G.rl / (G.rlT || 1);
      if (!tube) {
        const ax = (info.magAxis || P(0, -1, 0)).clone().normalize(),
          grip = info.magGrip || P(0, -0.05, 0),
          mh = g.base.mag;
        const tilt = ss(seg(p, 0, 0.14)) - ss(seg(p, 0.86, 1));
        out.rz = -0.36 * tilt;
        out.rx = 0.12 * tilt;
        out.x = -0.06 * tilt;
        out.y = 0.13 * tilt;
        out.z = -0.22 * tilt;
        out.ry = -0.1 * tilt;
        const below = P(rest.x - 0.07, rest.y - 0.2, rest.z + 0.12);
        let handTarget;
        if (p < 0.1) handTarget = rest.clone().lerp(mh.clone().add(grip), ss(seg(p, 0, 0.1)));
        else if (p < 0.3) {
          const o = ax.clone().multiplyScalar(0.17 * ss(seg(p, 0.14, 0.3)));
          magPos = mh.clone().add(o);
          handTarget = magPos.clone().add(grip);
        } else if (p < 0.46) {
          handTarget = mh
            .clone()
            .add(ax.clone().multiplyScalar(0.17))
            .add(grip)
            .lerp(below, ss(seg(p, 0.3, 0.46)));
          magShow = false;
          if (!st.dropped) {
            st.dropped = true;
            dropMag(g);
          }
        } else if (p < 0.74) {
          const e1 = ss(seg(p, 0.46, 0.62)),
            e2 = ss(seg(p, 0.62, 0.74)),
            start = mh.clone().add(ax.clone().multiplyScalar(0.17));
          magPos = below.clone().sub(grip).lerp(start, e1).lerp(mh, e2);
          magShow = true;
          handTarget = magPos.clone().add(grip);
        } else if (p < 0.9) {
          const hs = P(0, 0.05, 0.075),
            pull = Math.sin(Math.PI * seg(p, 0.78, 0.88));
          handTarget = mh
            .clone()
            .add(grip)
            .lerp(hs, ss(seg(p, 0.74, 0.8)))
            .add(P(0, 0, 0.05 * pull));
          if (!st.bolted && p > 0.8) {
            st.bolted = true;
            st.cyc = 0;
            st.cycT = 0.14;
            st.cycK = 'auto';
          }
        } else handTarget = P(0, 0.05, 0.075).lerp(rest, ss(seg(p, 0.9, 1)));
        handOff.copy(handTarget).sub(rest);
      } else {
        // shell-by-shell: gun tilts, support hand dips to the loading gate once per round
        const tilt = 1,
          pr = Math.sin(Math.PI * p);
        const port = info.magHome ? info.magHome.clone().add(P(0, -0.03, 0.02)) : P(0, -0.05, 0.0);
        out.rz = -0.3 * st.rlK;
        out.rx = 0.14 * st.rlK;
        out.x = -0.03 * st.rlK;
        out.y = 0.05 * st.rlK;
        out.z = -0.09 * st.rlK;
        handOff.copy(port).sub(rest).multiplyScalar(pr);
      }
    } else {
      st.dropped = false;
      st.bolted = false;
    }
    // hand + mag
    L.position.copy(handOff);
    info.mag.visible = !info.tubeFed && magShow;
    info.mag.position.copy(magPos);
    // moving parts (slide / bolt / pump) cycling after each shot
    let off = 0;
    if (st.cyc >= 0) {
      st.cyc += dt;
      const u = st.cyc / st.cycT;
      if (st.cycK === 'auto') off = u < 1 ? Math.sin(Math.PI * u) : 0;
      else off = u < 0.35 ? ss(u / 0.35) : u < 0.5 ? 1 : u < 1 ? 1 - ss((u - 0.5) / 0.5) : 0;
      if (st.cycK === 'manual' && st.ejDelay >= 0 && st.cyc >= st.ejDelay) {
        st.ejDelay = -1;
        spawnShell(g, g.F.eject);
      }
      if (u >= 1) {
        st.cyc = -1;
        off = 0;
      }
    }
    if (info.slide && g.base.slide) info.slide.position.z = g.base.slide.z + (info.slideTravel || 0.034) * off;
    if (info.bolt && g.base.bolt) info.bolt.position.z = g.base.bolt.z + 0.05 * off;
    if (info.pump && g.base.pump) info.pump.position.z = g.base.pump.z + 0.075 * (st.cycK === 'manual' ? off : 0);
    return out;
  }

  /* ---------------- Modern gloved hands + IK arms on the gun (06c-models placeHands, simplified: no palm-lift measurement) ---------------- */
  const _hs = {
    R: new V3(),
    L: new V3(),
    pR: new V3(),
    pL: new V3(),
    inv: new T.Matrix4(),
    tmp: new V3(),
    H: new V3(),
    G: new V3()
  };
  function placeArms(g, dt) {
    const A = g.arms,
      H = window.RGHAND;
    if (!A || !H) return;
    const info = g.info,
      pis = info.kind === 'pistol',
      B = H.VM_BODY,
      FR = H.HAND_FRAMES;
    H.VM.handDt = Math.min(dt, 0.05) || 1 / 60;
    g.root.updateMatrix();
    _hs.inv.copy(g.root.matrix).invert();
    const toGun = v => v.clone().applyMatrix4(_hs.inv);
    const ka = ss(G.ads),
      sp = X.sprintK * (G.rl > 0 ? 0 : 1);
    _hs.R.lerpVectors(pis ? B.Rp : B.R, pis ? B.RAp : B.RA, ka);
    _hs.L.lerpVectors(pis ? B.Lp : B.L, pis ? B.LAp : B.LA, ka);
    _hs.pR.lerpVectors(pis ? B.poleRp : B.poleR, pis ? B.poleRAp : B.poleRA, ka);
    _hs.pL.lerpVectors(pis ? B.poleLp : B.poleL, pis ? B.poleLAp : B.poleLA, ka);
    if (sp > 0) {
      _hs.pR.lerp(B.poleRs, sp);
      _hs.pL.lerp(B.poleLs, sp);
    }
    const GS = H.gripShapes({key: g.key, gripDef: info.gripDef, trigDef: info.trigDef});
    g.trigK = Math.max(0, (g.trigK || 0) - dt * 7);
    const off = g.hands.L.position,
      away = off.length(),
      pairs = [
        [A.R, info.gripR, _hs.R, _hs.pR, FR[pis ? 'Rp' : 'R'], 0.33, pis ? 'ptrig' : 'trigger', GS && GS.R],
        [
          A.L,
          info.gripL,
          _hs.L,
          _hs.pL,
          pis ? FR.Lp : FR[info.lFrame || 'L'],
          0.34,
          pis ? 'psup' : 'support',
          GS && GS.L
        ]
      ];
    for (const [arm, G0, Sb, Pb0, F, fore, pose, shapes0] of pairs) {
      let Pb = Pb0,
        pz = pose,
        shapes = shapes0 || null;
      const G1 = G0.clone();
      if (arm === A.L) {
        if (pis) G1.copy(info.gripR);
        if (away > 0.01) {
          G1.add(off);
          pz = away > 0.03 ? 'mag' : pose;
          if (away > 0.03) shapes = null;
          Pb = _hs.tmp.lerpVectors(_hs.pL, new V3(-0.1, -1, 0.15), ss(c01((away - 0.01) / 0.1))).clone();
          Pb0.copy(Pb);
        }
        if (pis && shapes && A.R.hand && !(away > 0.03)) {
          A.R.hand.updateMatrix();
          try {
            shapes = H.handCapsules ? H.handCapsules(A.R.hand.userData, A.R.hand.matrix, []).concat(shapes) : shapes;
          } catch (e) {}
        }
      }
      const Hh = G1.clone().sub(F.off.clone().applyQuaternion(F.q));
      H.poseArmToHand(
        arm,
        toGun(Sb),
        Hh,
        F.q,
        toGun(Sb.clone().add(Pb)),
        pz,
        0,
        0.34,
        fore,
        F.off,
        F.axis,
        F.range,
        F.axis2,
        F.range2,
        shapes,
        null
      );
    }
  }

  const _animVM = window.animVM;
  window.animVM = function (dt) {
    if (!X.on || !ensure() || !isGunEq()) {
      if (X.scopeEl) X.scopeEl.style.opacity = '0';
      VMX.active = false;
      if (VMX.cur) {
        VMX.cur.root.visible = false;
        VMX.cur = null;
      }
      if (VM.root) VM.root.visible = true;
      return _animVM(dt);
    }
    try {
      pCheckEq();
      if (!isGunEq()) {
        VMX.active = false;
        return _animVM(dt);
      }
      const w = G.eq,
        d = WDEF[w.id],
        g = getGun(w.id);
      G.kick = Math.max(0, G.kick - dt * 8);
      G.swT = Math.max(0, G.swT - dt);
      G.draw = Math.max(0, G.draw - dt);
      G.flashT = Math.max(0, G.flashT - dt);
      G.dry = Math.max(0, (G.dry || 0) - dt);
      if (VM.root) VM.root.visible = false;
      if (VM.cur) {
        VM.cur.o.visible = false;
      }
      if (VMX.cur !== g) {
        if (VMX.cur) VMX.cur.root.visible = false;
        VMX.cur = g;
        g.root.visible = true;
        g.st.cyc = -1;
      }
      VMX.active = true;
      // ADS (MFZ rule: not while reloading / drawing / menus)
      const aimOn = !!(K.m2 && locked && !invOpen && !wheel && G.draw < 0.15 && G.rl <= 0 && !isSprinting());
      G.ads += ((aimOn ? 1 : 0) - G.ads) * (1 - Math.exp((-dt * 3.4) / g.F.adsT));
      G.zoom += (0 - G.zoom) * Math.min(1, dt * 8);
      X.bloom = Math.max(0, X.bloom - dt * 1.9);
      X.fovk = Math.max(0, X.fovk - dt * 14);
      {
        const sk = g.info.scopeMeshes ? ss(G.ads) : 0;
        if (g.info.scopeMeshes) {
          if (!g.F.zs) {
            g.F.zs = 1;
            g.F.zoom = 0.7;
          }
          const sv = sk > 0.5;
          for (const o of g.info.scopeMeshes) if (o.visible === sv) o.visible = !sv;
          g.root.visible = !(sk > 0.93);
          if (X.scopeEl) X.scopeEl.style.opacity = String(clamp((sk - 0.55) / 0.35, 0, 1));
        } else if (X.scopeEl && X.scopeEl.style.opacity !== '0') X.scopeEl.style.opacity = '0';
      }
      {
        const tf = G.fov * (1 - g.F.zoom * G.ads) + X.fovk;
        if (Math.abs(camera.fov - tf) > 0.02) {
          camera.fov = tf;
          camera.updateProjectionMatrix();
        }
        G.zoomK = (G.fov * (1 - g.F.zoom * G.ads)) / G.fov;
      }
      recoilTick(dt);
      syncLights(dt);
      pose(g, dt);
      placeArms(g, dt);
      // viewmodel camera: fixed 54deg at the hip, 44deg on the sights (Modern); aspect follows the main camera
      const vf = lerp(58, 44, ss(G.ads)),
        vn = lerp(0.012, 0.04, ss(G.ads));
      if (Math.abs(VMX.cam.fov - vf) > 0.01 || VMX.cam.aspect !== camera.aspect || VMX.cam.near !== vn) {
        VMX.cam.fov = vf;
        VMX.cam.near = vn;
        VMX.cam.aspect = camera.aspect;
        VMX.cam.updateProjectionMatrix();
      }
      // flash timers
      if (g.flash.visible) {
        g.flash.userData.t -= dt;
        if (g.flash.userData.t <= 0) g.flash.visible = false;
        else g.flash.rotation.z = rr(0, 6.28);
      }
      if (VMX.flashL.intensity > 0) {
        VMX.flashL.userData.t -= dt;
        if (VMX.flashL.userData.t <= 0) VMX.flashL.intensity = 0;
        else {
          g.root.updateMatrixWorld(true);
          VMX.flashL.position.copy(g.info.muzzle.getWorldPosition(new V3()));
        }
      }
      updShells(dt);
      updFx(dt);
    } catch (e) {
      if (X.errs++ < 3) console.warn('[gunplay054] animVM fallback', e);
      VMX.active = false;
      return _animVM(dt);
    }
  };

  /* player muzzle: world position of the real barrel end */
  window.playerMuzzle = function () {
    const p = new V3();
    if (VMX.active && VMX.cur) {
      VMX.cur.root.updateMatrixWorld(true);
      VMX.cur.info.muzzle.getWorldPosition(p);
      return toWorld(p);
    }
    const v = VM.cur;
    if (v && v.mz) {
      p.set(v.mz[0], v.mz[1], v.mz[2]);
      v.o.updateWorldMatrix(true, false);
      v.o.localToWorld(p);
    } else camera.getWorldPosition(p);
    return p;
  };

  /* shoot(): v080 - the spread bloom (RGX.spread) and after-shot hook (RGX.afterShot) are called directly from shoot() in
   js/game/core/10_weapons.js (they used to be patched into shoot()'s source text and re-eval'd, which broke on any reformat). */

  console.log('[gunplay054] gunplay layer ready: ' + Object.keys(GUNS).length + ' guns on Modern geometry');
})();
