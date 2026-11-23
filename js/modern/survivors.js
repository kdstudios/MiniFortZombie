/* ==========================================================================================================
   MINI FORT ZOMBIE - UNIQUE SURVIVOR MODELS (v066)
   Every named Fort Zombie survivor gets their own look on the Modern body (the same rigid parts as the zombies, js/modern/zbody.js),
   from js/data/survivors.js: skin tone, build, age (children / teens / stooped seniors), hair style + colour, facial hair, brows, eye
   colour, outfit and accessories. Anyone without a named design uses one of the 18 base persona models (age x gender x ethnicity).
   - clean survivor atlas (assets/survivor, no blood): js/data/rsurv-tex.js
   - hair, beards and brows are painted per pixel by the head shader in head space, so hairlines stay crisp on the low-poly head;
     volume (long hair, buns, braids, afros ...) is real geometry riding on the head
   - hiding survivors already wear the look of the person you will recruit (their id is reserved when they spawn)
   - at the fort a coloured armband shows the job (Guard / Builder / ...)
   Options > Graphics > Survivor models: Modern (this) or Classic (MFZ blocks).
   ========================================================================================================== */
(function () {
  'use strict';
  if (!window.RZ || !window.RZKIT || !window.RSURV || typeof makePerson !== 'function') {
    console.warn('[survivors] missing kit / data, classic survivors');
    return;
  }
  const T = THREE,
    K = RZKIT,
    RD = RSURV,
    GEO = RZ.GEO,
    R = RZB.reg,
    PI = Math.PI,
    C = h => (h instanceof T.Color ? h : new T.Color(h));
  const {dome, ball, box, cyl, tor, lathe, brim, H, HEAD, HEAD2, BODY, frontZ, backZ} = K;
  const add = (par, list, mat, part) => K.add(par, list, mat, part);
  const fr = v => v - Math.floor(v),
    inB = (v, a, b) => v >= a && v <= b,
    bell = (v, c, w) => Math.exp(-(((v - c) / w) ** 2));
  const on = () => !window.RGFX || RGFX.s.smodel !== 0;
  /* ---------------- deterministic randomness per survivor (outfit helpers use Math.random) ---------------- */
  function hash(s) {
    let h = 2166136261;
    s = String(s);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  /* ---------------- textures / materials ---------------- */
  let TXS = null;
  function tex() {
    if (TXS || !window.RSTEX) return TXS;
    const t = new T.Texture(),
      im = new Image();
    im.onload = () => {
      t.image = im;
      t.needsUpdate = true;
    };
    im.src = RSTEX.map;
    t.anisotropy = 4;
    return (TXS = t);
  }
  setTimeout(() => {
    try {
      tex();
    } catch (e) {}
  }, 0); // v069: start loading the atlas now, not when the first survivor appears
  function bodyMat() {
    return new T.MeshStandardMaterial({
      vertexColors: true,
      map: tex() || RZ.TX.map || null,
      normalMap: RZ.TX.normal || null,
      normalScale: new T.Vector2(0.3, 0.3),
      roughness: 0.88,
      metalness: 0,
      envMapIntensity: 0.2
    });
  }
  /* hair / beard / brow parameters (head space relative to the skull centre (0, .19, .018); y up, +z = face) */
  const HS = {
    bald: {a: 0},
    fringe: {f: 0.045, s: -0.025, b: -0.085, cr: 0.03},
    buzz: {f: 0.05, s: -0.01, b: -0.085, a: 0.62},
    short: {f: 0.046, s: -0.008, b: -0.085, vol: 'crop'},
    side: {f: 0.048, s: -0.008, b: -0.085, vol: 'side'},
    slick: {f: 0.052, s: -0.008, b: -0.085, vol: 'slick'},
    receding: {f: 0.075, s: -0.012, b: -0.085, rec: 0.03, a: 0.9},
    curly: {f: 0.045, s: -0.008, b: -0.08, vol: 'curly'},
    curlyshort: {f: 0.045, s: -0.008, b: -0.08, vol: 'curly'},
    kid: {f: 0.04, s: -0.008, b: -0.085, vol: 'kid'},
    fade: {f: 0.046, s: 0.0, b: -0.07, a: 0.75, vol: 'fade'},
    cornrows: {f: 0.046, s: -0.008, b: -0.085, str: 1},
    afro: {f: 0.045, s: -0.01, b: -0.08, vol: 'afro'},
    puffs: {f: 0.045, s: -0.01, b: -0.085, vol: 'puffs'},
    bob: {f: 0.05, s: -0.01, b: -0.09, vol: 'bob'},
    pixie: {f: 0.045, s: -0.01, b: -0.085, vol: 'pixie'},
    long: {f: 0.05, s: -0.01, b: -0.09, vol: 'long'},
    wavy: {f: 0.05, s: -0.01, b: -0.09, vol: 'wavy'},
    shaggy: {f: 0.04, s: -0.015, b: -0.095, vol: 'shaggy'},
    ponytail: {f: 0.05, s: -0.005, b: -0.085, vol: 'ponytail'},
    bun: {f: 0.05, s: -0.005, b: -0.085, vol: 'bun'},
    pigtails: {f: 0.05, s: -0.005, b: -0.085, vol: 'pigtails'},
    braids: {f: 0.05, s: -0.005, b: -0.085, str: 0.6, vol: 'braids'},
    locs: {f: 0.05, s: -0.008, b: -0.085, vol: 'locs'},
    updo: {f: 0.05, s: -0.005, b: -0.08, vol: 'updo'},
    headwrap: {f: 0.05, s: -0.01, b: -0.085}
  };
  const HATS = ['cap', 'beanie', 'fedora', 'strawhat', 'hardhat', 'stetson', 'boater', 'witchhat', 'wrap'];
  const FH = {
    stub: {a: 0.32, top: -0.035},
    beard: {a: 0.95, top: -0.05, m: 1},
    full: {a: 1, top: -0.03, m: 1, vol: 1},
    goat: {a: 0.95, top: -0.1, goat: 1, m: 1},
    chin: {a: 0.95, top: -0.1, goat: 1},
    mous: {a: 0, m: 1}
  };
  function headMat(base, d) {
    const m = base.clone(),
      hs = HS[d.hs] || HS.short,
      fh = FH[d.fh] || null,
      hc = C(RD.HAIR[d.hc] != null ? RD.HAIR[d.hc] : d.hc || 0x2a1c12),
      bc = C(d.bc != null ? RD.HAIR[d.bc] || d.bc : hc.getHex());
    const grey = /white|silver|grey/.test(d.hc || '');
    const U = {
      uHA: {value: hs.a != null ? hs.a : 1},
      uHC: {value: hc},
      uF: {value: hs.f || 0.05},
      uS: {value: hs.s || 0},
      uB: {value: hs.b || -0.085},
      uCr: {value: hs.cr != null ? hs.cr : 9},
      uRec: {value: hs.rec || 0},
      uStr: {value: hs.str || 0},
      uBA: {value: fh ? fh.a : 0},
      uBC: {value: bc},
      uBT: {value: fh ? fh.top : -0.1},
      uGoat: {value: fh && fh.goat ? 1 : 0},
      uMous: {value: fh && fh.m ? 1 : 0},
      uBrow: {value: d.brow || (d.g === 'F' ? 0.8 : 1)},
      uBrC: {value: grey ? bc.clone().multiplyScalar(0.8) : hc.clone().multiplyScalar(0.85)}
    };
    m.userData.hairU = U;
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader =
        'varying vec3 vHP;\n' +
        sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vHP=position;');
      sh.fragmentShader =
        'varying vec3 vHP;uniform float uHA,uF,uS,uB,uCr,uRec,uStr,uBA,uBT,uGoat,uMous,uBrow;uniform vec3 uHC,uBC,uBrC;\n' +
        sh.fragmentShader.replace(
          '#include <color_fragment>',
          `#include <color_fragment>
  {vec3 p=vHP-vec3(0.,.19,.018);float r=max(length(p),1e-3),f=p.z/r,ax=abs(p.x);
   float n=fract(sin(dot(floor(vec3(p.x*420.,p.y*70.,p.z*420.)),vec3(12.9898,78.233,37.719)))*43758.5453);
   float hl=mix(mix(uB,uS,smoothstep(-.8,-.15,f)),uF,smoothstep(.2,.75,f))+uRec*smoothstep(.015,.055,ax)*smoothstep(.3,.8,f);
   float hm=smoothstep(hl-.006,hl+.006,p.y)*(1.-smoothstep(uCr-.006,uCr+.006,p.y));
   hm*=1.-smoothstep(.62,.7,f)*(1.-smoothstep(uF-.01,uF+.012,p.y));                 // never paint the face
   if(uStr>0.)hm*=mix(1.,.45+.55*step(.42,fract(p.x*55.)),uStr*step(-.6,f));
   hm*=uHA;
   float bm=smoothstep(-.25,.2,f)*(1.-smoothstep(uBT-.006,uBT+.006,p.y))*smoothstep(-.125,-.108,p.y);
   bm*=mix(1.,1.-smoothstep(.022,.032,ax),uGoat);
   bm*=1.-step(-.083,p.y)*step(p.y,-.07)*(1.-smoothstep(.026,.034,ax))*step(.5,f)*(1.-uMous);   // shave the lip unless moustache
   float mm=uMous*(1.-smoothstep(.03,.036,ax))*smoothstep(-.088,-.083,p.y)*(1.-smoothstep(-.072,-.066,p.y))*step(.55,f);
   bm=max(bm*uBA,mm);
   float bw=(1.-smoothstep(.0035*uBrow,.0065*uBrow,abs(p.y-.012-ax*.08)))*smoothstep(.01,.016,ax)*(1.-smoothstep(.05,.058,ax))*smoothstep(.6,.7,f);
   vec3 hcol=uHC*(.82+.3*n),bcol=uBC*(.8+.3*n);
   diffuseColor.rgb=mix(diffuseColor.rgb,hcol,clamp(hm,0.,1.));
   diffuseColor.rgb=mix(diffuseColor.rgb,bcol,clamp(bm,0.,1.)*(1.-hm*.5));
   diffuseColor.rgb=mix(diffuseColor.rgb,uBrC,bw*.9);}`
        );
    };
    m.customProgramCacheKey = () => 'surv-head';
    return m;
  }
  /* ---------------- designs ---------------- */
  const ARCH_KEYS = Object.keys(RD.ARCH);
  function archFor(seed, age, sex) {
    const r = rng(seed);
    let ks = ARCH_KEYS;
    if (age != null) {
      const ag = age < 14 ? 'C' : age >= 60 ? 'S' : 'A';
      ks = ks.filter(k => k[2] === ag);
    }
    if (sex) {
      const g = sex[0] === 'F' ? 'F' : 'M';
      ks = ks.filter(k => k[1] === g);
    }
    if (!ks.length) ks = ARCH_KEYS;
    const k = ks[Math.floor(r() * ks.length)],
      a = Object.assign({}, RD.ARCH[k]);
    a.arch = k;
    // light variation so generic survivors are not clones of each other
    const tops = ['tee', 'long', 'hoodie', 'flannel', 'jacket', 'sweater', 'shirt'],
      cols = [0x3a5a8a, 0x7a3a3a, 0x4a6a4a, 0x6a6a6a, 0x8a6a3a, 0x2a2a30, 0x5a3a6a, 0xb8a888];
    if (a.b !== 'child' && r() < 0.6) {
      a.top = tops[Math.floor(r() * tops.length)];
      a.tc = cols[Math.floor(r() * cols.length)];
      a.tc2 = cols[Math.floor(r() * cols.length)];
    }
    return a;
  }
  const START = {'Sgt. Miller': 'npc_Miller', 'Dr. Aris': 'npc_Aris'},
    NAMESEX = {Ava: 'F', Ben: 'M', Cora: 'F', Dan: 'M', Eli: 'M', Faye: 'F', Gus: 'M', Hana: 'F', Ivo: 'M', Jo: 'F'};
  function designFor(s) {
    const D = RD.D;
    if (s && !s.fz && START[s.name]) return Object.assign({id: START[s.name]}, D[START[s.name]]);
    if (s && !s.fz) {
      const nm = String(s.name || '').split(/[ #]/)[0];
      return archFor(hash(s.id || s.name), s.age != null ? s.age : 30, s.sex || NAMESEX[nm] || null);
    }
    if (s && s.fz && D[s.fz]) {
      const c = (typeof FZ !== 'undefined' && FZ.cfg && FZ.cfg.chars && FZ.cfg.chars[s.fz]) || {};
      return Object.assign({id: s.fz, age: c.age != null ? c.age : s.age, g: (c.sex || 'M')[0]}, D[s.fz]);
    }
    return archFor(hash((s && (s.id || s.name)) || Math.random()), s && s.age, s && s.sex);
  }
  function charDesign(id) {
    const c = (typeof FZ !== 'undefined' && FZ.cfg && FZ.cfg.chars && FZ.cfg.chars[id]) || {};
    return RD.D[id] ? Object.assign({id, age: c.age, g: (c.sex || 'M')[0]}, RD.D[id]) : archFor(hash(id), c.age, c.sex);
  }
  /* ---------------- body shape: gender, build, age ---------------- */
  function shapeFor(d) {
    const fem = d.g === 'F',
      b = d.b || 'avg';
    return (k, x, y, z) => {
      let dx = 0,
        dy = 0,
        dz = 0;
      if (k === 'body') {
        if (fem) {
          dz += (z > 0 ? 0.05 : 0) * bell(y, 1.25, 0.065) * Math.max(0, 1 - Math.abs(x) / 0.13) * (z > 0 ? 1 : 0); // bust
          dx += x * (-0.1 * bell(y, 1.09, 0.06) + 0.1 * bell(y, 0.94, 0.07) - 0.07 * Math.max(0, (y - 1.3) / 0.1));
          dz += z * (-0.06 * bell(y, 1.09, 0.06));
        }
        if (b === 'slim' || b === 'petite') ((dx += x * -0.07), (dz += z * -0.07));
        if (b === 'heavy') {
          const w = bell(y, 1.08, 0.2);
          dx += x * (0.08 + 0.32 * w);
          dz += z * (0.08 + 0.35 * w) + (z > 0 ? 0.3 * w * z : 0);
        }
        if (b === 'strong') {
          const c = Math.max(0, Math.min(1, (y - 1.1) / 0.25));
          dx += x * 0.12 * c;
          dz += z * 0.1 * c;
        }
        if (b === 'officer') {
          const c = Math.max(0, Math.min(1, (y - 1.1) / 0.25));
          dx += x * 0.05 * c;
          dz += z > 0 ? z * 0.06 * c : 0;
        }
        if (b === 'child' || b === 'teen') ((dx += x * -0.05), (dz += z * -0.03));
      } else if (k === 'legL' || k === 'legR') {
        const x0 = x < 0 ? -0.088 : 0.088;
        if (b === 'heavy' && y > 0.15) {
          const f = 0.06 + 0.28 * Math.max(0, Math.min(1, (y - 0.45) / 0.45));
          dx += (x - x0) * f;
          dz += (z - 0.01) * f;
        }
        if (fem && y > 0.75) {
          dx += (x - x0) * 0.1 * Math.min(1, (y - 0.75) / 0.15) + (x < 0 ? -0.006 : 0.006);
        }
        if (b === 'slim' || b === 'petite') ((dx += (x - x0) * -0.08), (dz += (z - 0.01) * -0.08));
      } else if (k === 'armL' || k === 'armR') {
        const x0 = x < 0 ? -0.165 : 0.165;
        if (b === 'strong') ((dx += (x - x0) * 0.22), (dz += (z + 0.005) * 0.22));
        if (b === 'heavy') ((dx += (x - x0) * 0.22), (dz += (z + 0.005) * 0.22));
        if (fem || b === 'slim' || b === 'petite' || b === 'child')
          ((dx += (x - x0) * -0.1), (dz += (z + 0.005) * -0.1));
      } else if (k === 'foreL' || k === 'foreR') {
        const x0 = x < 0 ? -0.18 : 0.18;
        if (y > 0.88) {
          if (b === 'strong' || b === 'heavy') ((dx += (x - x0) * 0.14), (dz += (z - 0.02) * 0.14));
          if (fem) ((dx += (x - x0) * -0.08), (dz += (z - 0.02) * -0.08));
        }
      } else if (k === 'head' && b === 'heavy') dx += x * 0.05;
      return dx || dy || dz ? [dx, dy, dz] : null;
    };
  }
  /* ---------------- colours ----------------
   Vertex colours carry the big regions (top / sleeves / pants / shoes / skin); everything with a crisp edge (sleeve and hem lengths,
   V-necks, open fronts, plackets, ties, collars, buttons, plaid / stripes / camo) is drawn per pixel by the body shader from the rest-pose
   model-space position (attribute aMP) and a tag per vertex (aTag: 1 torso top, 2 legs, 3 arm sleeve). */
  const isLegK = k => k === 'legL' || k === 'legR',
    isArmK = k => k === 'armL' || k === 'armR',
    isForeK = k => k === 'foreL' || k === 'foreR';
  const front = q => q.nz > 0.35;
  function garment(d, pal) {
    const top = d.top || 'tee',
      bot = d.bot || 'jeans',
      tc = C(d.tc != null ? d.tc : 0x6a6a6a),
      tc2 = C(d.tc2 != null ? d.tc2 : 0xece8e0),
      pc = C(d.pc != null ? d.pc : 0x2a3448),
      acc = d.acc || [];
    const arg = a => {
        const x = acc.find(x => x.startsWith(a + ':'));
        return x ? C(+x.split(':')[1]) : null;
      },
      has = a => acc.some(x => x === a || x.startsWith(a + ':'));
    const u = {
      sleeve: 0,
      neck: 9,
      vY: 9,
      vS: 0,
      vC: tc2,
      tie: arg('tie'),
      strip: 0,
      stripY: 9,
      stripC: tc2,
      collar: null,
      btn: 0,
      pat: 0,
      p1: tc,
      p2: tc2,
      patP: 0,
      hem: -9,
      tights: has('tights') ? 1 : 0,
      armC: tc,
      lapel: 0
    };
    if (/^(tee|jersey|polo|scrubs)$/.test(top)) u.sleeve = 1.27;
    if (top === 'tank' || top === 'dress') u.sleeve = 9;
    if (top === 'tee' || top === 'jersey') u.neck = 1.36;
    if (top === 'tank') u.ah = 0.075;
    if (top === 'dress') u.ah = 0.085;
    if (top === 'jersey') u.ah = 0.088;
    if (top === 'tank' || top === 'dress') u.neck = 1.335;
    if (top === 'scrubs') {
      u.vY = 1.3;
      u.vS = 0.8;
      u.vC = pal[R.skin];
    }
    if (top === 'polo') {
      u.collar = tc.clone().multiplyScalar(0.85);
      u.btn = 1.3;
    }
    if (/^(shirt|blouse|workshirt|uniform)$/.test(top)) {
      u.collar = tc.clone().multiplyScalar(0.85);
      u.btn = 1.0;
    }
    if (top === 'suit' || top === 'blazer') {
      u.vY = 1.12;
      u.vS = 0.3;
      u.lapel = 1;
    }
    if (top === 'labcoat') {
      u.strip = 0.035;
      u.stripY = 1.08;
    }
    if (top === 'longcoat') {
      u.strip = 0.03;
      u.stripY = 1.15;
      u.collar = tc.clone().multiplyScalar(0.85);
    }
    if (top === 'jacket') {
      u.strip = 0.03;
      u.stripY = 1.0;
      u.collar = tc.clone().multiplyScalar(0.8);
    }
    if (top === 'cardigan') {
      u.strip = 0.026;
      u.stripY = 1.0;
    }
    if (top === 'safari') {
      u.strip = 0.02;
      u.stripY = 1.0;
      u.armC = tc2;
    }
    if (top === 'sweatervest') {
      u.vY = 1.22;
      u.vS = 0.5;
      u.armC = tc2;
    }
    if (top === 'clerical') {
      u.strip = 0.016;
      u.stripY = 1.37;
      u.stripC = C(0xf2f2ee);
    }
    if (top === 'track') {
      u.strip = 0.004;
      u.stripY = 1.0;
      u.stripC = C(0xc8c8c8);
    }
    if (top === 'coverall') {
      u.strip = 0.004;
      u.stripY = 1.05;
      u.stripC = tc.clone().multiplyScalar(0.55);
    }
    if (top === 'hoodie') {
      u.strip = 0.003;
      u.stripY = 1.25;
      u.stripC = tc.clone().multiplyScalar(0.6);
    }
    if (top === 'flannel') {
      u.pat = 1;
      u.btn = 1.0;
    }
    if (top === 'stripes') u.pat = 2;
    if (top === 'camo') u.pat = 3;
    if (bot === 'camo') u.patP = 3;
    if (bot === 'shorts') u.hem = 0.56;
    if (bot === 'skirt') u.hem = 0.86;
    return u;
  }
  function camo(q) {
    const v =
      Math.sin(q.x * 31 + q.y * 7) + Math.sin(q.z * 29 - q.y * 13) + Math.sin((q.x + q.z) * 17 + q.y * 23) * 0.8;
    return v > 1.1 ? C(0x3a3424) : v > 0.1 ? C(0x56603a) : v > -0.9 ? C(0x7a7350) : C(0x4a4a30);
  }
  function colourFn(d, pal, gu) {
    const top = d.top || 'tee',
      bot = d.bot || 'jeans',
      tc = C(d.tc != null ? d.tc : 0x6a6a6a),
      tc2 = C(d.tc2 != null ? d.tc2 : 0xece8e0),
      pc = C(d.pc != null ? d.pc : 0x2a3448),
      SKc = pal[R.skin],
      acc = d.acc || [],
      has = a => acc.some(x => x === a || x.startsWith(a + ':')),
      arg = (a, i = 1) => {
        const x = acc.find(x => x.startsWith(a + ':'));
        return x ? C(+x.split(':')[i]) : null;
      };
    const pdark = pc.clone().multiplyScalar(0.65),
      white = C(0xf2f2ee),
      grease = C(0x2a2622);
    const skirt = bot === 'skirt' || bot === 'longdress';
    return q => {
      const k = q.k,
        x = q.x,
        y = q.y,
        ax = Math.abs(x),
        reg = q.reg;
      q.tag = 0;
      if (reg === R.face) return null;
      if (reg === R.skin) {
        if (has('wraps') && isForeK(k) && y > 0.79) return arg('wraps') || white;
        if (has('grease') && fr(x * 37 + y * 11) < 0.18) return grease;
        return null;
      }
      /* ---- legs ---- */
      if (isLegK(k)) {
        if (reg === R.shoes) return null;
        q.tag = 2;
        if (bot === 'longdress') return pc;
        if (bot === 'turnout') {
          if (inB(y, 0.3, 0.34) || inB(y, 0.55, 0.58))
            return inB(y, 0.31, 0.33) || inB(y, 0.56, 0.57) ? C(0xc8ccd2) : C(0xd8e040);
          return pc;
        }
        if (bot === 'tracks' && q.nx * x > 0 && Math.abs(q.nx) > 0.6) return tc2;
        if (bot === 'cargo' && q.nx * x > 0 && Math.abs(q.nx) > 0.5 && inB(y, 0.55, 0.7)) return pdark;
        if (has('paint') && fr(x * 47 + y * 13) < 0.08)
          return C([0xd83030, 0x30a0d8, 0xe8c830][Math.floor(fr(y * 9) * 3)]);
        if (has('grease') && fr(x * 29 + y * 17) < 0.12) return grease;
        return skirt && !has('tights') ? pc : pc;
      }
      /* ---- arms (sleeve length is cut per pixel) ---- */
      if (isForeK(k) || isArmK(k)) {
        q.tag = 3;
        if (top === 'track' && q.nx * x > 0 && Math.abs(q.nx) > 0.6) return tc2;
        if (has('grease') && fr(x * 29 + y * 17) < 0.12) return grease;
        if ((top === 'labcoat' || top === 'longcoat') && y < 0.9) return tc.clone().multiplyScalar(0.9);
        return gu.armC;
      }
      /* ---- torso ---- */
      if (k === 'body') {
        const fz = front(q),
          bz = q.nz < -0.35;
        if (reg === R.pants || y < 1.0) {
          // pelvis
          if (skirt || top === 'dress') {
            q.tag = top === 'dress' ? 1 : 2;
            return top === 'dress' ? tc : pc;
          }
          if (bot === 'overalls') {
            q.tag = 2;
            return pc;
          }
          if (top === 'coverall') {
            q.tag = 1;
            return tc;
          }
          if (top === 'labcoat' || top === 'longcoat') {
            q.tag = 2;
            return pc;
          }
          if (inB(y, 0.975, 1.0) && !/scrubs|tracks|leggings/.test(bot))
            return has('sambrowne') ? C(0x5a3418) : C(0x1e1a16); // belt
          q.tag = 2;
          return pc;
        }
        q.tag = 1;
        if (bot === 'overalls' && ((fz && y < 1.3 && ax < 0.1) || (ax > 0.045 && ax < 0.075 && y > 1.25))) {
          q.tag = 0;
          return pc;
        }
        if (has('suspenders') && ax > 0.05 && ax < 0.068 && y > 1.0) {
          q.tag = 0;
          return arg('suspenders');
        }
        if (has('hivis')) {
          const hv = arg('hivis');
          if (y < 1.36 && !(fz && ax < 0.012)) {
            q.tag = 0;
            if (inB(y, 1.12, 1.16) || (y > 1.16 && ax > 0.055 && ax < 0.075)) return C(0xd8dce0);
            return hv;
          }
        }
        if (has('tactical') && y < 1.36 && y > 1.02 && !(fz && ax < 0.008)) {
          q.tag = 0;
          const tv = arg('tactical');
          return fz && inB(y, 1.08, 1.18) && fr(x * 16) < 0.8 ? tv.clone().multiplyScalar(0.8) : tv;
        }
        if (top === 'turtleneck' && y > 1.36) return tc.clone().multiplyScalar(1.15);
        if (top === 'hoodie' && fz && inB(y, 1.06, 1.16) && ax < 0.09) return tc.clone().multiplyScalar(0.75);
        if ((top === 'workshirt' || top === 'uniform') && fz && inB(y, 1.22, 1.29) && inB(ax, 0.04, 0.09))
          return top === 'workshirt' && x > 0 ? white : tc.clone().multiplyScalar(0.85);
        if (has('grease') && fr(x * 29 + y * 17) < 0.1) return grease;
        return tc;
      }
      return null;
    };
  }
  /* per-pixel garment details on the body parts */
  function clothMat(base, gu, skin) {
    const m = base.clone(),
      v3 = c => (c ? C(c) : new T.Color(0, 0, 0));
    const U = {
      uAh: {value: gu.ah || 9},
      uSl: {value: gu.sleeve},
      uNk: {value: gu.neck},
      uVY: {value: gu.vY},
      uVS: {value: gu.vS},
      uVC: {value: v3(gu.vC)},
      uTie: {value: gu.tie ? 1 : 0},
      uTieC: {value: v3(gu.tie)},
      uSw: {value: gu.strip},
      uSY: {value: gu.stripY},
      uSC: {value: v3(gu.stripC)},
      uCo: {value: gu.collar ? 1 : 0},
      uCoC: {value: v3(gu.collar)},
      uBtn: {value: gu.btn || 9},
      uPat: {value: gu.pat},
      uP1: {value: v3(gu.p1)},
      uP2: {value: v3(gu.p2)},
      uPatP: {value: gu.patP},
      uHem: {value: gu.hem},
      uTi: {value: gu.tights},
      uSk: {value: v3(skin)},
      uLap: {value: gu.lapel}
    };
    m.userData.clothU = U;
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader =
        'attribute vec3 aMP;attribute float aTag;varying vec3 vMP;varying vec3 vRN;varying float vTag;\n' +
        sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vMP=aMP;vRN=normal;vTag=aTag;');
      sh.fragmentShader = sh.fragmentShader.replace(
        '#include <normal_fragment_begin>',
        '#include <normal_fragment_begin>\n #ifdef DOUBLE_SIDED\n  normal=normal*faceDirection;\n #endif'
      );
      sh.fragmentShader =
        'varying vec3 vMP;varying vec3 vRN;varying float vTag;uniform float uAh,uSl,uNk,uVY,uVS,uTie,uSw,uSY,uCo,uBtn,uPat,uPatP,uHem,uTi,uLap;uniform vec3 uVC,uTieC,uSC,uCoC,uP1,uP2,uSk;\n' +
        'vec3 camoC(vec3 p){float v=sin(p.x*31.+p.y*7.)+sin(p.z*29.-p.y*13.)+sin((p.x+p.z)*17.+p.y*23.)*.8+sin(p.x*61.+p.z*53.)*.35;return v>1.1?vec3(.2,.18,.12):v>.1?vec3(.3,.35,.2):v>-.9?vec3(.45,.43,.29):vec3(.27,.27,.17);}\n' +
        sh.fragmentShader.replace(
          '#include <color_fragment>',
          `#include <color_fragment>
  #ifdef USE_COLOR
  if(vTag>.5){vec3 tx=diffuseColor.rgb/max(vColor.rgb,vec3(.03));vec3 p=vMP;float ax=abs(p.x);bool fz=vRN.z>.3;vec3 c=vColor.rgb;bool set=false;
   if(vTag>2.5){                                                                 // sleeves
    if(p.y<uSl){c=uSk;set=true;}
    else if(uPat>.5&&uPat<1.5){float a=step(.72,fract(p.x*9.+.5)),b=step(.72,fract(p.y*9.));c=mix(uP1,mix(uP1,uP2,.55),max(a,b));c=mix(c,uP2,a*b);set=true;}
    else if(uPat>1.5&&uPat<2.5){c=fract(p.y*24.)<.5?uP1:uP2;set=true;}
    else if(uPat>2.5){c=camoC(p);set=true;}
    if(uSl<9.&&uSl>0.&&p.y>=uSl&&p.y<uSl+.012){c*=.82;set=true;}               // hem band
   }else if(vTag>1.5){                                                           // legs / pelvis
    if(p.y<uHem&&p.y<.97){c=uTi>.5?(fract(p.y*28.)<.5?vec3(.08):vec3(.85)):uSk;set=true;}
    else if(uPatP>2.5){c=camoC(p);set=true;}
   }else if(p.y>1.0){                                                            // torso
    if(uPat>.5&&uPat<1.5){float a=step(.72,fract(p.x*9.+.5)),b=step(.72,fract(p.y*9.));c=mix(uP1,mix(uP1,uP2,.55),max(a,b));c=mix(c,uP2,a*b);set=true;}
    else if(uPat>1.5&&uPat<2.5){c=fract(p.y*24.)<.5?uP1:uP2;set=true;}
    else if(uPat>2.5){c=camoC(p);set=true;}
    float ve=(p.y-uVY)*uVS+.006;
    if(fz&&p.y>uVY&&ax<ve){c=uVC;set=true;if(uTie>.5&&ax<.0105-max(0.,(uVY+.03-p.y))*.4&&p.y<1.385){c=uTieC*(p.y>1.36?.8:1.);}}
    else if(uLap>.5&&fz&&p.y>uVY+.06&&ax<ve+.012){c*=.72;set=true;}
    if(fz&&uSw>0.&&ax<uSw&&p.y>uSY){c=uSC;set=true;if(uTie>.5&&ax<.0105&&p.y<1.385&&p.y>1.12)c=uTieC;}
    if(uTie>.5&&uVY>8.&&uSw<.01&&fz&&ax<.0105&&p.y>1.12&&p.y<1.385){c=uTieC;set=true;}
    if(uCo>.5&&p.y>1.372){c=uCoC;set=true;}
    if(fz&&p.y>uBtn&&p.y<1.37&&ax<.0032&&fract(p.y*20.)<.35){c*=.55;set=true;}
    if((fz||vRN.z<-.3)&&p.y>uNk+(ax/.052)*(ax/.052)*.03&&ax<.052){c=uSk;set=true;}
    if(p.y>1.27&&ax>uAh){c=uSk;set=true;}
   }
   if(set)diffuseColor.rgb=c*tx;}
  #endif`
        );
    };
    m.side = T.DoubleSide; // the cut seams between parts show the cloth inside, not a hole
    m.customProgramCacheKey = () => 'surv-cloth';
    return m;
  }
  /* ---------------- hair geometry ---------------- */
  function hairVol(P, mat, d) {
    const hc = RD.HAIR[d.hc] != null ? RD.HAIR[d.hc] : d.hc || 0x2a1c12,
      c = C(hc),
      c2 = c.clone().multiplyScalar(0.82),
      L = [],
      cy = H.cy,
      cz = H.cz,
      v = (HS[d.hs] || {}).vol;
    const hat = HATS.some(h => (d.acc || []).some(a => a === h || a.startsWith(h + ':')));
    const cap = (sx = 1, sy = 1, sz = 1, lift = 0.0) => {
      if (hat) return;
      L.push([dome(0.1, PI * 0.5, 22, 9), c, [0, 0.2 + lift, 0.014], [-0.3, 0, 0], [0.84 * sx, 1.08 * sy, 1.1 * sz]]);
    };
    const tails = (n, len, r, y0, z0, spread, col) => {
      for (let i = 0; i < n; i++) {
        const a = PI + (i - (n - 1) / 2) * spread;
        L.push([
          cyl(r, r * 0.8, len, 6),
          col || c,
          [Math.sin(a) * 0.07, y0 - len / 2, cz + Math.cos(a) * 0.075 + z0],
          [0, 0, 0]
        ]);
      }
    };
    switch (v) {
      case 'crop':
        cap(1, 0.82, 1.06);
        break;
      case 'side':
        cap(1.02, 1, 1.04, 0.003);
        break;
      case 'slick':
        cap(1.02, 0.86, 1.1);
        if (!hat) L.push([ball(0.06, 10), c, [0, H.top - 0.035, cz + 0.04], [0, 0, 0], [1.4, 0.5, 1.3]]);
        break;
      case 'kid':
        cap(1.04, 1, 1.04, 0.004);
        break;
      case 'fade':
        cap(0.95, 0.75, 1.0);
        if (!hat) L.push([ball(0.075, 12), c, [0, H.top - 0.025, cz + 0.005], [0, 0, 0], [1, 0.7, 1.1]]);
        break;
      case 'curly':
        cap(1.06, 0.95, 1.1, 0.005);
        if (!hat)
          for (let i = 0; i < 14; i++) {
            const a = i * 2.4,
              r = 0.05 + fr(i * 0.37) * 0.05;
            L.push([
              ball(0.024, 7),
              i % 2 ? c : c2,
              [Math.sin(a) * r, H.top - 0.03 - fr(i * 0.61) * 0.04, cz + Math.cos(a) * r - 0.005]
            ]);
          }
        break;
      case 'afro':
        if (!hat) L.push([ball(0.155, 16), c, [0, cy + 0.06, cz - 0.02], [0, 0, 0], [1, 0.92, 1]]);
        break;
      case 'puffs':
        cap(1, 0.86, 1.05);
        if (!hat) for (const s of [-1, 1]) L.push([ball(0.06, 12), c, [s * 0.075, H.top - 0.01, cz - 0.03]]);
        break;
      case 'bob':
        cap(1.06, 1.02, 1.05, 0.004);
        if (!hat)
          for (const sx of [-1, 1])
            L.push([ball(0.05, 12), c, [sx * 0.07, cy - 0.02, cz - 0.01], [0, 0, sx * 0.25], [0.5, 1.15, 1.5]]);
        L.push([ball(0.06, 12), c, [0, cy - 0.01, cz - 0.06], [0, 0, 0], [1.25, 1.05, 0.8]]);
        break;
      case 'pixie':
        cap(1.03, 1, 1.03, 0.002);
        break;
      case 'long':
      case 'wavy':
      case 'shaggy': {
        cap(1.06, 0.95, 1.1, 0.004);
        const len = v === 'shaggy' ? 0.16 : v === 'wavy' ? 0.22 : 0.27,
          y0 = cy + 0.02;
        L.push([
          lathe(
            [
              [0.098, 0],
              [0.104, -0.05],
              [0.108, -len * 0.7],
              [0.1, -len],
              [0.09, -len],
              [0.092, -len * 0.7],
              [0.09, -0.05],
              [0.088, 0]
            ],
            18,
            PI * 0.62,
            PI * 0.76
          ),
          v === 'wavy' ? (x, y, z) => (fr(y * 30 + x * 10) < 0.5 ? hc : c2.getHex()) : c,
          [0, y0, cz - 0.01],
          [0, 0, 0],
          [0.84, 1, 1.05]
        ]);
        break;
      }
      case 'ponytail':
        cap(1.02, 0.9, 1.08);
        L.push(
          [ball(0.03, 8), c, [0, cy + 0.035, cz - 0.1]],
          [cyl(0.026, 0.012, 0.2, 8), c, [0, cy - 0.06, cz - 0.115], [0.25, 0, 0]]
        );
        break;
      case 'bun':
        cap(1.02, 0.88, 1.08);
        if (!hat) L.push([ball(0.042, 12), c, [0, H.top - 0.02, cz - 0.075]]);
        break;
      case 'pigtails':
        cap(1.02, 0.9, 1.08);
        for (const s of [-1, 1])
          L.push(
            [ball(0.026, 8), c, [s * 0.1, cy + 0.03, cz - 0.045]],
            [cyl(0.024, 0.01, 0.16, 8), c, [s * 0.115, cy - 0.05, cz - 0.05], [0, 0, s * 0.18]]
          );
        break;
      case 'braids':
        cap(1.02, 0.88, 1.06);
        tails(9, 0.26, 0.011, cy + 0.04, -0.005, 0.33);
        break;
      case 'locs':
        cap(1.03, 0.9, 1.07, 0.002);
        tails(11, 0.17, 0.013, cy + 0.05, 0, 0.3);
        break;
      case 'updo':
        cap(1.05, 0.95, 1.08, 0.004);
        if (!hat)
          for (let i = 0; i < 9; i++) {
            const a = i * 0.7;
            L.push([
              ball(0.034, 8),
              i % 2 ? c : c2,
              [Math.sin(a) * 0.05, H.top - 0.005 + (i % 3) * 0.01, cz - 0.02 + Math.cos(a) * 0.05]
            ]);
          }
        break;
      default:
        break;
    }
    if (L.length) add(P.head, L, mat, 'head');
  }
  function beardVol(P, mat, d) {
    const fh = FH[d.fh];
    if (!fh || !fh.vol) return;
    const c = C(d.bc != null ? RD.HAIR[d.bc] || d.bc : RD.HAIR[d.hc] || 0x2a1c12);
    add(P.head, [[ball(0.05, 12), c, [0, H.mouth - 0.025, H.cz + 0.075], [0, 0, 0], [1.2, 0.8, 0.8]]], mat, 'head');
  }
  /* eyes: white + iris, sit on the face texture's eye marks */
  const EYEG = new T.SphereGeometry(0.0105, 12, 8),
    IRISG = new T.SphereGeometry(0.0062, 10, 6),
    SCL = new T.MeshStandardMaterial({color: 0xece8e0, roughness: 0.35});
  function eyes(P, d) {
    const ic = RD.EYE[d.ey] != null ? RD.EYE[d.ey] : 0x3a2414,
      im = new T.MeshStandardMaterial({color: ic, roughness: 0.3});
    for (const sx of [-1, 1]) {
      const e = new T.Mesh(EYEG, SCL);
      e.position.set(sx * 0.033, 0.182, 0.093);
      e.scale.set(1.15, 0.62, 0.45);
      e.userData.part = 'head';
      e.userData.head = 1;
      P.head.add(e);
      const i = new T.Mesh(IRISG, im);
      i.position.set(sx * 0.033, 0.182, 0.0978);
      i.scale.set(1, 1, 0.35);
      i.userData.part = 'head';
      i.userData.head = 1;
      P.head.add(i);
    }
  }
  /* ---------------- accessories ---------------- */
  function accessories(P, g, mat, d, pal) {
    const acc = d.acc || [],
      argC = (a, i = 1) => {
        const x = acc.find(x => x === a || x.startsWith(a + ':'));
        if (!x || !x.includes(':')) return null;
        return +x.split(':')[i];
      };
    const has = a => acc.some(x => x === a || x.startsWith(a + ':')),
      B = P.body,
      fz = y => frontZ - 0.004 - 0.04 * Math.max(0, 1.2 - y) * 0 + (y < 1.15 ? -0.012 : 0);
    const hc = RD.HAIR[d.hc] != null ? RD.HAIR[d.hc] : 0x2a1c12;
    if (has('glasses')) HEAD2.glasses(P, mat);
    if (has('cap')) {
      HEAD.cap(P, mat, argC('cap') || 0x2a2a2a, argC('cap', 2) || null, argC('cap') || null);
      const cm = P.head.children[P.head.children.length - 1];
      cm.scale.set(1.02, 1.12, 1.02);
      cm.position.y = -0.025;
    }
    if (has('beanie')) HEAD2.beanie(P, mat, argC('beanie') || 0x1a1a1a);
    if (has('fedora')) HEAD2.fedora(P, mat, argC('fedora') || 0x3a2a1a, 0x141414);
    if (has('strawhat')) HEAD2.strawHat(P, mat);
    if (has('hardhat')) HEAD2.hardHat(P, mat, argC('hardhat') || 0xf0c020);
    if (has('stetson')) {
      const c = argC('stetson') || 0x8a6a3a,
        y = H.brow - 0.008,
        z = H.cz - 0.006;
      add(
        P.head,
        [
          [
            lathe(
              [
                [0.104, 0],
                [0.1, 0.06],
                [0.07, 0.1],
                [0.0, 0.095]
              ],
              22
            ),
            c,
            [0, y, z],
            [0, 0, 0],
            [1, 1, 1.1]
          ],
          [brim(0.1, 0.2, 0.008, -0.012, 0, PI * 2), c, [0, y + 0.002, z], [0, 0, 0], [1, 1, 1.1]],
          [cyl(0.105, 0.105, 0.018, 22), 0x2a1a10, [0, y + 0.012, z], [0, 0, 0], [1, 1, 1.1]]
        ],
        mat,
        'head'
      );
    }
    if (has('boater')) {
      const y = H.brow - 0.005,
        z = H.cz - 0.006;
      add(
        P.head,
        [
          [cyl(0.1, 0.1, 0.055, 22), 0xe0c880, [0, y + 0.03, z], [0, 0, 0], [1, 1, 1.1]],
          [brim(0.098, 0.17, 0.007, 0, 0, PI * 2), 0xd8be74, [0, y + 0.003, z], [0, 0, 0], [1, 1, 1.1]],
          [cyl(0.102, 0.102, 0.018, 22), 0x1a1a2a, [0, y + 0.012, z], [0, 0, 0], [1, 1, 1.1]]
        ],
        mat,
        'head'
      );
    }
    if (has('witchhat')) {
      const y = H.brow - 0.005,
        z = H.cz - 0.01;
      add(
        P.head,
        [
          [cyl(0.0, 0.105, 0.24, 18), 0x141418, [0, y + 0.12, z - 0.02], [-0.18, 0, 0], [1, 1, 1.1]],
          [brim(0.1, 0.22, 0.008, 0.01, 0, PI * 2), 0x141418, [0, y + 0.002, z], [0, 0, 0], [1, 1, 1.1]],
          [cyl(0.106, 0.106, 0.02, 18), 0x5a2a7a, [0, y + 0.012, z], [0, 0, 0], [1, 1, 1.1]]
        ],
        mat,
        'head'
      );
    }
    if (has('tiara'))
      add(
        P.head,
        [
          [tor(0.09, 0.005, PI * 0.9, 16), 0xe8e0c8, [0, H.top - 0.035, H.cz + 0.01], [-1.2, 0, PI * 0.05]],
          [cyl(0.0, 0.012, 0.03, 4), 0xe8e0c8, [0, H.top - 0.0, H.cz + 0.075], [-0.35, 0, 0]]
        ],
        mat,
        'head'
      );
    if (has('headband')) HEAD.headband(P, mat, argC('headband') || 0xf0f0f0);
    if (has('wrap')) {
      const c = argC('wrap') || 0xd8642a;
      add(
        P.head,
        [
          [
            ball(0.118, 16),
            (x, y, z) => (fr(Math.atan2(x, z) * 3 + y * 20) < 0.5 ? c : new T.Color(c).multiplyScalar(0.75).getHex()),
            [0, H.top - 0.04, H.cz - 0.02],
            [-0.2, 0, 0],
            [1, 0.85, 1.12]
          ],
          [ball(0.05, 10), c, [0, H.top + 0.02, H.cz - 0.02]]
        ],
        mat,
        'head'
      );
    }
    /* body pieces (body pivot space: BODY(y)) */
    if (has('bowtie')) {
      const c = argC('bowtie') || 0x141418;
      add(
        B,
        [
          [box(0.032, 0.02, 0.012), c, [-0.018, BODY(1.385), frontZ - 0.012], [0, 0, 0.2]],
          [box(0.032, 0.02, 0.012), c, [0.018, BODY(1.385), frontZ - 0.012], [0, 0, -0.2]],
          [box(0.012, 0.014, 0.014), c, [0, BODY(1.385), frontZ - 0.008]]
        ],
        mat,
        null
      );
    }
    if (has('star'))
      add(B, [[cyl(0.016, 0.016, 0.004, 5), 0xd8b440, [0.065, BODY(1.29), frontZ + 0.002], [PI / 2, 0, 0]]], mat, null);
    if (has('badge'))
      add(B, [[box(0.04, 0.022, 0.004), argC('badge') || 0xf0f0f0, [-0.065, BODY(1.28), frontZ + 0.002]]], mat, null);
    if (has('beltbadge')) add(B, [[box(0.024, 0.03, 0.006), 0xd8b440, [-0.06, BODY(0.99), frontZ - 0.004]]], mat, null);
    if (has('lanyard')) {
      const c = argC('lanyard') || 0x2a5ad8;
      add(
        B,
        [
          [tor(0.072, 0.004, PI, 14), c, [0, BODY(1.3), frontZ - 0.04], [PI / 2 - 0.5, 0, PI]],
          [box(0.045, 0.065, 0.004), 0xf2f2f2, [0, BODY(1.2), frontZ + 0.004]]
        ],
        mat,
        null
      );
    }
    if (has('necklace'))
      add(
        B,
        [[tor(0.064, 0.0045, PI, 16), 0xece4d4, [0, BODY(1.37), frontZ - 0.05], [PI / 2 - 0.75, 0, PI]]],
        mat,
        null
      );
    if (has('cross'))
      add(
        B,
        [
          [tor(0.064, 0.002, PI, 12), 0x3a2a1a, [0, BODY(1.35), frontZ - 0.05], [PI / 2 - 0.6, 0, PI]],
          [box(0.008, 0.04, 0.006), 0x6a4a2a, [0, BODY(1.255), frontZ + 0.006]],
          [box(0.026, 0.008, 0.006), 0x6a4a2a, [0, BODY(1.265), frontZ + 0.006]]
        ],
        mat,
        null
      );
    if (has('dogtags'))
      add(
        B,
        [
          [tor(0.066, 0.002, PI, 12), 0x9a9ea4, [0, BODY(1.35), frontZ - 0.05], [PI / 2 - 0.6, 0, PI]],
          [box(0.016, 0.026, 0.004), 0xb8bcc2, [0, BODY(1.255), frontZ + 0.006]]
        ],
        mat,
        null
      );
    if (has('stethoscope'))
      add(
        B,
        [
          [tor(0.08, 0.006, PI * 1.1, 16), 0x2a2a2e, [0, BODY(1.34), frontZ - 0.06], [PI / 2 - 0.55, 0, PI * 1.05]],
          [cyl(0.012, 0.012, 0.008, 10), 0xc0c4c8, [0.03, BODY(1.22), frontZ + 0.004], [PI / 2, 0, 0]]
        ],
        mat,
        null
      );
    if (has('scarf')) {
      const c = argC('scarf') || 0xc83030;
      add(
        B,
        [
          [tor(0.085, 0.022, PI * 2, 18), c, [0, BODY(1.39), 0.0], [PI / 2, 0, 0], [1.05, 1.2, 1]],
          [box(0.05, 0.2, 0.014), c, [0.035, BODY(1.27), frontZ + 0.006], [0, 0, 0.08]]
        ],
        mat,
        null
      );
    }
    if (has('sash'))
      add(B, [[box(0.06, 0.42, 0.006), 0xf2f2ee, [0, BODY(1.2), frontZ + 0.004], [0, 0, 0.75]]], mat, null);
    if (has('ribbons'))
      add(
        B,
        [
          [
            box(0.05, 0.012, 0.005),
            (x, y, z) => (x < -0.0 ? 0x2a3a8a : x < 0.012 ? 0xb81e1e : 0xd8b440),
            [-0.065, BODY(1.31), frontZ + 0.003]
          ],
          [box(0.05, 0.012, 0.005), x => (x < 0 ? 0x1e6a3a : 0xe8e4dc), [-0.065, BODY(1.296), frontZ + 0.003]],
          [box(0.03, 0.02, 0.005), 0xd8b440, [0.095, BODY(1.395), 0.0], [0, 0, 0]],
          [box(0.03, 0.02, 0.005), 0xd8b440, [-0.095, BODY(1.395), 0.0]]
        ],
        mat,
        null
      );
    if (has('sambrowne'))
      add(
        B,
        [
          [box(0.024, 0.5, 0.006), 0x5a3418, [-0.01, BODY(1.2), frontZ + 0.006], [0, 0, 0.55]],
          [box(0.024, 0.5, 0.006), 0x5a3418, [0.0, BODY(1.2), backZ - 0.006], [0, 0, -0.55]]
        ],
        mat,
        null
      );
    if (has('apron'))
      add(
        B,
        [
          [box(0.2, 0.36, 0.008), 0xf6f4ee, [0, BODY(1.04), frontZ + 0.012]],
          [box(0.014, 0.12, 0.004), 0xf6f4ee, [-0.06, BODY(1.28), frontZ + 0.006]],
          [box(0.014, 0.12, 0.004), 0xf6f4ee, [0.06, BODY(1.28), frontZ + 0.006]]
        ],
        mat,
        null
      );
    if (has('toolbelt'))
      add(
        B,
        [
          [tor(0.165, 0.014, PI * 2, 24), 0x6a4a2a, [0, BODY(0.995), 0.003], [PI / 2, 0, 0], [1, 0.82, 1]],
          [box(0.06, 0.08, 0.04), 0x7a5a32, [-0.15, BODY(0.95), 0.04]],
          [box(0.05, 0.07, 0.04), 0x7a5a32, [0.15, BODY(0.95), 0.04]],
          [cyl(0.006, 0.006, 0.12, 6), 0x8a8a8a, [0.17, BODY(0.92), 0.0]]
        ],
        mat,
        null
      );
    if (has('backpack'))
      add(
        B,
        [
          [box(0.2, 0.24, 0.09), 0x2a4a8a, [0, BODY(1.2), backZ - 0.05]],
          [box(0.16, 0.08, 0.03), 0x1e3a6a, [0, BODY(1.13), backZ - 0.1]],
          [box(0.022, 0.24, 0.01), 0x1e1e22, [-0.06, BODY(1.25), frontZ - 0.004], [0.1, 0, 0]],
          [box(0.022, 0.24, 0.01), 0x1e1e22, [0.06, BODY(1.25), frontZ - 0.004], [0.1, 0, 0]]
        ],
        mat,
        null
      );
    if (has('camera'))
      add(
        B,
        [
          [box(0.1, 0.065, 0.05), 0x1a1a1c, [0, BODY(1.12), frontZ + 0.03]],
          [cyl(0.025, 0.025, 0.05, 12), 0x2a2a2e, [0, BODY(1.12), frontZ + 0.07], [PI / 2, 0, 0]],
          [tor(0.08, 0.004, PI, 12), 0x1a1a1c, [0, BODY(1.25), frontZ - 0.03], [PI / 2 - 0.4, 0, PI]]
        ],
        mat,
        null
      );
    if (has('satchel'))
      add(
        B,
        [
          [box(0.06, 0.18, 0.2), 0x2a3a5a, [0.17, BODY(0.95), 0.0]],
          [box(0.024, 0.55, 0.006), 0x2a3a5a, [0, BODY(1.15), frontZ + 0.006], [0, 0, -0.6]]
        ],
        mat,
        null
      );
    if (has('wraps'))
      for (const s of ['L', 'R'])
        add(P['el' + s], [[cyl(0.04, 0.04, 0.06, 10), argC('wraps') || 0xf2f2f2, [0, -0.235, 0.02]]], mat, 'arm' + s);
    if (has('decal:FIRE')) K.decal(B, 'FIRE', '#d8c040', 0.2, 0.09, [0, BODY(1.28), backZ - 0.022], PI);
    /* coats: open-front skirt to the knee, sits on the root (stays with the body) */
    if (d.top === 'labcoat' || d.top === 'longcoat') {
      const c = C(d.tc != null ? d.tc : 0xf2f2ee).getHex(),
        hem = d.top === 'labcoat' ? 0.6 : 0.5;
      K.add(
        g,
        [
          [
            lathe(
              [
                [0.18, 1.03],
                [0.205, 0.96],
                [0.235, 0.8],
                [0.255, hem + 0.02],
                [0.258, hem],
                [0.247, hem],
                [0.225, 0.8],
                [0.195, 0.96],
                [0.17, 1.03],
                [0.18, 1.03]
              ],
              26,
              0.32,
              PI * 2 - 0.64
            ),
            c
          ]
        ],
        mat,
        null
      );
    }
    if (d.top === 'hoodie')
      add(
        B,
        [
          [
            tor(0.075, 0.03, PI * 2, 16),
            C(d.tc != null ? d.tc : 0x3a3e46)
              .multiplyScalar(0.9)
              .getHex(),
            [0, BODY(1.4), backZ + 0.05],
            [PI / 2 + 0.5, 0, 0],
            [1.1, 1, 1]
          ]
        ],
        mat,
        null
      );
    if (d.top === 'turtleneck')
      add(B, [[cyl(0.058, 0.062, 0.05, 16), C(d.tc).getHex(), [0, BODY(1.43), 0.005]]], mat, null);
    if (d.top === 'dress' || d.bot === 'skirt' || d.bot === 'longdress') {
      const c = C(d.top === 'dress' ? d.tc : d.pc).getHex(),
        hem = d.bot === 'longdress' ? 0.13 : d.b === 'child' ? 0.66 : 0.62;
      K.skirt(P, g, mat, c, hem);
    }
  }
  /* survivors are never cut apart: drop the flesh-cap triangles (gore region) so no torn rims show at the joints */
  const NOCAP = {};
  function idxNoCaps(k) {
    if (NOCAP[k]) return NOCAP[k];
    const G = GEO[k],
      ix = G.idx.array,
      rg = G.reg,
      out = [];
    for (let i = 0; i < ix.length; i += 3) {
      const a = ix[i],
        b = ix[i + 1],
        c = ix[i + 2];
      if (rg[a] === R.gore || rg[b] === R.gore || rg[c] === R.gore) continue;
      const bad = isForeK(k) ? R.shirt : isArmK(k) ? R.sleeve : -1;
      if (bad >= 0 && (rg[a] === bad || rg[b] === bad || rg[c] === bad)) continue;
      out.push(a, b, c);
    }
    return (NOCAP[k] = new T.BufferAttribute(new Uint16Array(out), 1));
  }
  /* ---------------- builder ---------------- */
  function buildSurvivor(g, d, role) {
    const seed = hash(d.id || d.arch || JSON.stringify(d)),
      r = rng(seed),
      mr = Math.random;
    Math.random = r;
    try {
      const P = {},
        mat = bodyMat(),
        sk = C(RD.TONE[d.sk] != null ? RD.TONE[d.sk] : d.sk || 0xe0b090),
        pal = {
          [R.face]: sk.clone().multiplyScalar(1.02),
          [R.skin]: sk,
          [R.shirt]: C(d.tc || 0x6a6a6a),
          [R.sleeve]: C(d.tc || 0x6a6a6a),
          [R.pants]: C(d.pc || 0x2a3448),
          [R.shoes]: C(d.sh != null ? d.sh : 0x2a2018),
          [R.gore]: sk,
          [R.hair]: C(0x2a2018)
        };
      const gu = garment(d, pal),
        fn = colourFn(d, pal, gu),
        sh = shapeFor(d),
        hm = headMat(mat, d),
        cm = clothMat(mat, gu, sk);
      const grp = (par, piv) => {
        const q = new T.Group();
        q.position.set(piv[0], piv[1], piv[2]);
        par.add(q);
        return q;
      };
      const part = (k, m) => {
        const G = GEO[k],
          geo = new T.BufferGeometry(),
          pos = G.pos.array.slice(),
          mp = G.mp;
        for (let i = 0; i < pos.length; i += 3) {
          const o = sh(k, mp[i], mp[i + 1], mp[i + 2]);
          if (o) {
            pos[i] += o[0];
            pos[i + 1] += o[1];
            pos[i + 2] += o[2];
          }
        }
        geo.setAttribute('position', new T.BufferAttribute(pos, 3));
        geo.setAttribute('normal', G.nor);
        geo.setAttribute('uv', G.uv);
        const n = G.n,
          col = new Float32Array(n * 3),
          tg = new Float32Array(n),
          q = {k, reg: 0, x: 0, y: 0, z: 0, nx: 0, ny: 0, nz: 0, pal},
          nm = G.nor.array;
        for (let i = 0; i < n; i++) {
          q.reg = G.reg[i];
          q.x = mp[i * 3];
          q.y = mp[i * 3 + 1];
          q.z = mp[i * 3 + 2];
          q.nx = nm[i * 3];
          q.ny = nm[i * 3 + 1];
          q.nz = nm[i * 3 + 2];
          q.tag = 0;
          const c = fn(q) || pal[q.reg] || pal[R.shirt];
          col[i * 3] = c.r;
          col[i * 3 + 1] = c.g;
          col[i * 3 + 2] = c.b;
          tg[i] = q.tag || 0;
        }
        geo.setAttribute('color', new T.BufferAttribute(col, 3));
        geo.setAttribute('aMP', new T.BufferAttribute(mp, 3));
        geo.setAttribute('aTag', new T.BufferAttribute(tg, 1));
        geo.setIndex(idxNoCaps(k));
        geo.computeBoundingSphere();
        const me = new T.Mesh(geo, m || cm);
        me.castShadow = true;
        me.receiveShadow = true;
        return me;
      };
      P.body = grp(g, GEO.body.piv);
      P.body.add(part('body'));
      P.head = grp(P.body, GEO.head.piv);
      P.head.add(part('head', hm));
      for (const s of ['L', 'R']) {
        const a = grp(P.body, GEO['arm' + s].piv);
        a.add(part('arm' + s));
        const e = grp(a, GEO['fore' + s].piv);
        e.add(part('fore' + s));
        P['arm' + s] = a;
        P['el' + s] = e;
        const l = grp(g, GEO['leg' + s].piv);
        l.add(part('leg' + s));
        P['leg' + s] = l;
      }
      // build tweaks: shoulder / hip width
      const b = d.b || 'avg',
        fem = d.g === 'F';
      const aw = b === 'heavy' ? 1.16 : b === 'strong' ? 1.1 : fem ? 0.95 : 1,
        lw = b === 'heavy' ? 1.12 : fem ? 1.04 : 1;
      P.armL.position.x *= aw;
      P.armR.position.x *= aw;
      P.legL.position.x *= lw;
      P.legR.position.x *= lw;
      eyes(P, d);
      hairVol(P, mat, d);
      accessories(P, g, mat, d, pal);
      // age: children and teens are smaller with relatively bigger heads; seniors stoop a little
      const age = d.age != null ? d.age : 30;
      let sc = 1;
      if (age < 15) {
        sc = age === 0 ? 1 : Math.max(0.58, Math.min(0.9, 0.42 + age * 0.034));
        P.head.scale.setScalar(1 + 0.035 * (15 - age) * 0.6);
      } else if (age < 18) sc = 0.94;
      if (fem) sc *= 0.955;
      if (b === 'petite') sc *= 0.95;
      sc *= 0.985 + r() * 0.03;
      g.scale.setScalar(sc);
      P.body.rotation.x = age >= 65 || b === 'senior' ? 0.1 : b === 'officer' ? -0.03 : 0;
      if (age >= 65 || b === 'senior') P.head.rotation.x = -0.06;
      P.rz = true;
      P.surv = true;
      P.handY = -0.27;
      P.mat = mat;
      P.design = d;
      if (role && typeof RC !== 'undefined' && RC[role] != null) {
        add(
          P.armL,
          [[tor(0.058, 0.012, PI * 2, 16), RC[role], [0, -0.12, 0.0], [PI / 2, 0, 0], [1, 1.15, 1]]],
          mat,
          'armL'
        );
      }
      g.traverse(o => {
        if (o.isMesh && !o.userData.part) {
          o.userData.surv = 1;
        }
      });
      return P;
    } finally {
      Math.random = mr;
    }
  }
  function clearChildren(g) {
    for (let i = g.children.length - 1; i >= 0; i--) {
      const c = g.children[i];
      if (c.isSprite) continue;
      g.remove(c);
    }
  }
  function reskin(m, d, role) {
    if (!m || !d) return null;
    try {
      clearChildren(m);
      const P = buildSurvivor(m, d, role);
      m.userData.P = P;
      if (m.userData.c) m.userData.c.P = P;
      return P;
    } catch (e) {
      console.warn('[survivors] build failed', e);
      return null;
    }
  }
  /* ---------------- Sgt. Miller and Dr. Aris join the recruit pool (v067) ---------------- */
  const EXTRA = {
    npc_Miller: {
      n: 'Sgt. Miller',
      sex: 'Male',
      age: 44,
      fam: '',
      a: {smarts: 30, power: 45, speed: 32, finesse: 36, toughness: 46},
      sk: {Rifle: 45, HandToHand: 36, Spot: 30, Sneak: 20},
      occ: 'Soldier',
      tarot: false,
      rel: [],
      it: [],
      pr: []
    },
    npc_Aris: {
      n: 'Dr. Aris',
      sex: 'Female',
      age: 41,
      fam: '',
      a: {smarts: 48, power: 22, speed: 30, finesse: 40, toughness: 26},
      sk: {Medicine: 50, FirstAid: 55, Spot: 26},
      occ: 'Doctor',
      tarot: false,
      rel: [],
      it: [],
      pr: []
    }
  };
  function ensureExtra() {
    try {
      const Cc = typeof FZ !== 'undefined' && FZ.cfg && FZ.cfg.chars;
      if (!Cc) return false;
      for (const k in EXTRA) {
        if (!Cc[k]) {
          const e = JSON.parse(JSON.stringify(EXTRA[k]));
          if (FZ.cfg.occ && !FZ.cfg.occ[e.occ]) e.occ = Object.keys(FZ.cfg.occ)[0] || e.occ;
          Cc[k] = e;
        }
      }
      return true;
    } catch (e) {
      return false;
    }
  }
  if (!ensureExtra()) {
    let t = 0;
    const iv = setInterval(() => {
      if (ensureExtra() || ++t > 40) clearInterval(iv);
    }, 250);
  }
  /* ---------------- hooks ---------------- */
  const SV = {reserved: new Set(), errs: 0, designFor, charDesign, buildSurvivor, reskin, tex}; // v092: tex() for Options > Game Assets > Custom Textures
  function pickPending() {
    ensureExtra();
    const Cc = typeof FZ !== 'undefined' && FZ.cfg && FZ.cfg.chars;
    if (!Cc || !FZ.T || !FZ.T.on) return null;
    const used = G.fzUsed || [];
    const ids = Object.keys(Cc).filter(
      k =>
        !used.includes(k) &&
        !G.surv.some(s => s.fz === k) &&
        !SV.reserved.has(k) &&
        !(typeof comps !== 'undefined' && comps.some(c => c.s && c.s.fz === k))
    );
    if (!ids.length) return null;
    let pool = ids.filter(k => !Cc[k].tarot);
    if (!pool.length || Math.random() < 0.08) pool = ids;
    const kin = pool.filter(k => Cc[k].rel.some(r => used.includes(r[1]) || G.surv.some(q => q.fz === r[1])));
    if (kin.length && Math.random() < 0.35) pool = kin;
    const id = pool[Math.floor(Math.random() * pool.length)];
    SV.reserved.add(id);
    return id;
  }
  // hiding survivors: makePerson(0x0284c7, x, z) with no role. Reserve who they are now so the model matches the person who joins.
  const _mp = makePerson;
  makePerson = function (color, x, z, role) {
    const g = _mp.apply(this, arguments);
    if (!on() || role !== undefined || color !== 0x0284c7) return g;
    try {
      const id = pickPending();
      const d = id ? charDesign(id) : archFor(hash(Math.random()), null, null);
      if (id) g.fzPre = id;
      reskin(g, d, null);
    } catch (e) {
      if (SV.errs++ < 3) console.warn('[survivors] npc', e);
    }
    return g;
  };
  // recruiting: the reserved id becomes the survivor
  if (typeof skRecruitCheck === 'function') {
    const _rc = skRecruitCheck;
    skRecruitCheck = function (o) {
      const ok = _rc.apply(this, arguments);
      if (ok && o && o.fzPre) {
        window.__fzNext = o.fzPre;
        SV.reserved.delete(o.fzPre);
      }
      return ok;
    };
  }
  // fort survivors and followers get their own design (+ job armband at the fort)
  if (typeof survMeshes === 'function') {
    const _sm = survMeshes;
    survMeshes = function () {
      const r = _sm.apply(this, arguments);
      if (on())
        try {
          for (const m of smesh) {
            const u = m.userData;
            if (u.kind === 'surv' && u.s && !(u.P && u.P.surv)) {
              reskin(m, designFor(u.s), u.s.role);
              u.hid = undefined;
              u.hidInit = false;
              if (typeof npcVisual === 'function') npcVisual(m, u.s);
            }
          }
        } catch (e) {
          if (SV.errs++ < 3) console.warn('[survivors] fort', e);
        }
      return r;
    };
  }
  if (typeof spawnComp === 'function') {
    const _sc = spawnComp;
    spawnComp = function (sv) {
      const r = _sc.apply(this, arguments);
      if (on())
        try {
          const m = smesh[smesh.length - 1];
          if (m && m.userData.s === sv) {
            reskin(m, designFor(sv), null);
            m.userData.hid = undefined;
            m.userData.hidInit = false;
            if (typeof npcVisual === 'function') npcVisual(m, sv);
          }
        } catch (e) {
          if (SV.errs++ < 3) console.warn('[survivors] follower', e);
        }
      return r;
    };
  }
  // held weapon: Modern forearms are shorter than the classic block arm
  if (typeof npcVisual === 'function') {
    const _nv = npcVisual;
    npcVisual = function (m) {
      const r = _nv.apply(this, arguments);
      try {
        const u = m.userData,
          P = u && u.P;
        if (P && P.surv && u.hold) u.hold.position.y = P.handY;
      } catch (e) {}
      return r;
    };
  }
  // a new map clears the reservations
  if (typeof clearWorld === 'function') {
    const _cw = clearWorld;
    clearWorld = function () {
      SV.reserved.clear();
      return _cw.apply(this, arguments);
    };
  }
  /* ---------------- dev: survivor line-up ---------------- */
  SV.gallery = function (list, x0, z0) {
    list = list || Object.keys(RD.D);
    const p = typeof pl !== 'undefined' ? pl.position : {x: 0, z: 0},
      out = [];
    const cx = x0 != null ? x0 : p.x,
      cz = z0 != null ? z0 : p.z - 6;
    list.forEach((id, i) => {
      const g = new T.Group();
      g.position.set(cx + ((i % 13) - 6) * 1.1, 0, cz - Math.floor(i / 13) * 1.6);
      const d = RD.ARCH[id] ? Object.assign({arch: id}, RD.ARCH[id]) : charDesign(id);
      buildSurvivor(g, d, null);
      g.userData.gallery = 1;
      scene.add(g);
      out.push(g);
    });
    SV.shown = (SV.shown || []).concat(out);
    return out;
  };
  SV.clearGallery = function () {
    (SV.shown || []).forEach(g => g.parent && g.parent.remove(g));
    SV.shown = [];
  };
  (function () {
    const dv = document.querySelector('#dev [data-p="state"]');
    if (!dv) return;
    const w = document.createElement('div');
    w.innerHTML =
      '<h4>Survivor models (v066)</h4><div class="row"><button id="svGal">Line up named survivors</button><button id="svArch">Line up 18 base personas</button><button id="svClr">Clear line-up</button></div>';
    dv.appendChild(w);
    w.querySelector('#svGal').onclick = () => SV.gallery();
    w.querySelector('#svArch').onclick = () => SV.gallery(Object.keys(RD.ARCH));
    w.querySelector('#svClr').onclick = () => SV.clearGallery();
  })();
  window.RGSURV = SV;
  console.log(
    '[survivors] ' + Object.keys(RD.D).length + ' named survivor designs + ' + ARCH_KEYS.length + ' base personas'
  );
})();
