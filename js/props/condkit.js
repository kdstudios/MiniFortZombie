/* ==========================================================================================================
   MINI FORT ZOMBIE - CONDITION KIT (v089): every building has an INTACT, a LOOTED and a RUINED version, made from its own intact design.
   Loaded right after js/props/mfzkit.js (before any model is built); its ruin() hook goes on at DOMContentLoaded, after every lot
   layer has added its own wrapper, so it is the outermost one and sees the real condition before any lot caps it.

   1. Z-fighting (all K.builder models, props and lots): K.preMerge finds coplanar, overlapping, same-facing faces of two parts with
      different materials and nudges the smaller part 4 mm out along the face normal. MFZCOND.stats.zfix[name] counts the fixes.
   2. Conditions. bld() calls ruin(x, z, t, lv) for lv 1 (looted) and 2 (ruined). For a building with merged decor (bdecor: every lot
      on the prop kit) the core ruin only ever runs at level 1 (doors, glass, loot, rubble; it can't knock down skinned walls), and this
      kit swaps the decor for a copy made from the same parts:
      LOOTED  - stock cleared off shelves and counters (some of it dropped on the floor), loose furniture shoved or knocked over, half the
                glass smashed (shards under it), some lights and signs dead, a little grime, boarded windows, graffiti, litter, papers,
                stains and blood on the floors. No structural damage. Loot: the core 60 % cut.
      RUINED  - all of that, harder, plus holes torn in the roof and ceilings (jagged edges, broken joists, a rubble pile under each),
                fallen ceiling tiles, every light dead, soot and weathering on every surface (some buildings burnt out), puddles, dust,
                cracks, weeds outside, more doors ripped off. Loot: most of it gone, half the containers empty. Two more zombies.
      The copy is made once per building type and level (deterministic) and cached. Nothing added stands in a doorway: every door and
      gate keeps a 1.4 m deep clear zone each side, and the debris has no collision.
      Buildings without merged decor (core builders) keep the core ruin and get the floor / wall dressing on top.
   API: MFZCOND.variant(R, lv, info) (the cached copy), MFZCOND.last (what the last call did), MFZCOND.zones(B) (door clear zones).
   ========================================================================================================== */
(function () {
  'use strict';
  const K = window.MFZK;
  if (!K || typeof THREE === 'undefined') {
    console.warn('[condkit] prop kit missing');
    return;
  }
  const T = THREE,
    PI = Math.PI;
  const C = (window.MFZCOND = {stats: {zfix: {}}, last: null});

  /* ===================== part helpers ===================== */
  const GB = new WeakMap();
  const geoBox = g => {
    let b = GB.get(g);
    if (!b) {
      if (!g.boundingBox) g.computeBoundingBox();
      b = g.boundingBox.clone();
      GB.set(g, b);
    }
    return b;
  };
  // tag boxes made by the kit (rounded boxes are non-indexed BufferGeometry, so the type alone doesn't say "box")
  const _rb = K.rboxGeo;
  K.rboxGeo = function () {
    const g = _rb.apply(this, arguments);
    if (g && !g.userData.isBox) g.userData.isBox = 1;
    return g;
  };
  const isBoxGeo = g => g && (g.type === 'BoxGeometry' || (g.userData && g.userData.isBox));
  const axisAligned = m => {
    const e = m.elements;
    for (const c of [0, 4, 8]) {
      const x = Math.abs(e[c]),
        y = Math.abs(e[c + 1]),
        z = Math.abs(e[c + 2]),
        n = Math.hypot(x, y, z);
      if (n < 1e-9 || Math.max(x, y, z) / n < 0.99995) return false;
    }
    return true;
  };
  const boxOfItem = it => geoBox(it.geo).clone().applyMatrix4(it.m);

  /* ===================== 1. z-fighting: nudge coplanar faces apart ===================== */
  const ZD = 0.004; // final gap (m)
  /* v090: BURIED LABELS. A painted plane (sign text, decals) whose centre sits just inside an opaque box (a bevelled body, a door
     panel, a fascia a few mm thicker than planned) only shows through from far off, when depth precision drops ("the text only
     appears when I step back"). Such a label is moved out along its own normal to 4 mm in front of that box (up to 8 cm). */
  function unbury(name, items) {
    const boxes = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.geo || !it.mat || it.mat.transparent || !isBoxGeo(it.geo) || !axisAligned(it.m)) continue;
      boxes.push({i, b: boxOfItem(it)});
    }
    if (!boxes.length) return items;
    const c = new T.Vector3(),
      nrm = new T.Vector3();
    let out = null,
      n = 0;
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (!it.geo || it.geo.type !== 'PlaneGeometry' || !it.mat || !it.mat.map) continue;
      if (it.mat.transparent && it.mat.opacity < 0.7 && !it.mat.alphaTest && !it.mat.map) continue;
      const e = it.m.elements;
      nrm.set(e[8], e[9], e[10]).normalize();
      const a = Math.abs(nrm.x) > 0.999 ? 0 : Math.abs(nrm.y) > 0.999 ? 1 : Math.abs(nrm.z) > 0.999 ? 2 : -1;
      if (a < 0) continue;
      const sg = Math.sign(nrm.getComponent(a));
      c.set(e[12], e[13], e[14]);
      let push = 0;
      for (let k = 0; k < 4; k++) {
        let best = 0;
        for (const q of boxes) {
          if (q.i === i) continue;
          const b = q.b,
            p = c.getComponent(a) + sg * push;
          if (
            (a !== 0 && (c.x <= b.min.x + 1e-4 || c.x >= b.max.x - 1e-4)) ||
            (a !== 1 && (c.y <= b.min.y + 1e-4 || c.y >= b.max.y - 1e-4)) ||
            (a !== 2 && (c.z <= b.min.z + 1e-4 || c.z >= b.max.z - 1e-4))
          )
            continue;
          if (p <= b.min.getComponent(a) - 1e-4 || p >= b.max.getComponent(a) + 1e-4) continue;
          const face = sg > 0 ? b.max.getComponent(a) : b.min.getComponent(a),
            d = (face - p) * sg; // how far the box's face is in front of the label
          if (d > -1e-4 && d <= (a === 1 ? 0.03 : 0.08)) best = Math.max(best, d + ZD);
        }
        if (!best) break;
        push += best;
      }
      if (!push || push > 0.12) continue;
      if (!out) out = items.slice();
      const d = nrm.clone().multiplyScalar(push);
      out[i] = {geo: it.geo, mat: it.mat, m: new T.Matrix4().makeTranslation(d.x, d.y, d.z).multiply(it.m)};
      n++;
    }
    if (n) C.stats.unbury[name] = (C.stats.unbury[name] || 0) + n;
    return out || items;
  }
  C.stats.unbury = {};
  K.preMerge = function (name, items) {
    items = unbury(name, items);
    const F = new Map(),
      faces = [];
    const add = (i, a, s, c, mn, mx, mat) => {
      const u = (a + 1) % 3,
        v = (a + 2) % 3;
      if (a === 1 && s < 0 && c < 0.05) return; // undersides on the ground are never seen
      const f = {i, a, s, c, u0: mn[u], u1: mx[u], v0: mn[v], v1: mx[v], ar: (mx[u] - mn[u]) * (mx[v] - mn[v]), mat};
      faces.push(f);
      const k = a * 2 + (s > 0 ? 1 : 0) + '|' + Math.round(c / 0.003);
      let l = F.get(k);
      if (!l) F.set(k, (l = []));
      l.push(f);
    };
    for (let i = 0; i < items.length; i++) {
      const it = items[i],
        g = it.geo,
        mat = it.mat;
      if (!g || !mat || mat.polygonOffset) continue;
      const bx = isBoxGeo(g),
        pl = g.type === 'PlaneGeometry';
      if ((!bx && !pl) || !axisAligned(it.m)) continue;
      const b = boxOfItem(it),
        mn = [b.min.x, b.min.y, b.min.z],
        mx = [b.max.x, b.max.y, b.max.z];
      for (let a = 0; a < 3; a++) {
        if (pl) {
          if (mx[a] - mn[a] > 1e-4) continue;
          const e = it.m.elements,
            n = [e[8], e[9], e[10]][a];
          add(i, a, n >= 0 ? 1 : -1, mn[a], mn, mx, mat);
          if (mat.side === T.DoubleSide) add(i, a, n >= 0 ? -1 : 1, mn[a], mn, mx, mat);
        } else {
          add(i, a, -1, mn[a], mn, mx, mat);
          add(i, a, 1, mx[a], mn, mx, mat);
        }
      }
    }
    const sh = new Map(); // item -> [dx, dy, dz] (NaN = blocked both ways)
    for (const f of faces) {
      const b0 = Math.round(f.c / 0.003);
      for (let d = -1; d <= 1; d++) {
        const l = F.get(f.a * 2 + (f.s > 0 ? 1 : 0) + '|' + (b0 + d));
        if (!l) continue;
        for (const g of l) {
          if (g === f || g.i === f.i || g.mat === f.mat || Math.abs(g.c - f.c) > 0.0025) continue;
          if (
            Math.min(f.u1, g.u1) - Math.max(f.u0, g.u0) < 0.003 ||
            Math.min(f.v1, g.v1) - Math.max(f.v0, g.v0) < 0.003
          )
            continue;
          // the smaller face moves (ties: the later part)
          const mv = f.ar < g.ar || (f.ar === g.ar && f.i > g.i) ? f : g,
            st = mv === f ? g : f;
          if (mv !== f) continue; // each pair once, from the mover's side
          const need = st.c + mv.s * ZD - mv.c;
          let s = sh.get(mv.i);
          if (!s) sh.set(mv.i, (s = [0, 0, 0]));
          const cur = s[mv.a];
          if (Number.isNaN(cur)) continue;
          if (cur && Math.sign(cur) !== Math.sign(need)) s[mv.a] = NaN;
          else if (Math.abs(need) > Math.abs(cur)) s[mv.a] = need;
        }
      }
    }
    let n = 0;
    if (sh.size) {
      items = items.slice();
      for (const [i, s] of sh) {
        const d = s.map(v => (Number.isNaN(v) ? 0 : v));
        if (!d[0] && !d[1] && !d[2]) continue;
        const it = items[i];
        items[i] = {geo: it.geo, mat: it.mat, m: new T.Matrix4().makeTranslation(d[0], d[1], d[2]).multiply(it.m)};
        n++;
      }
    }
    if (n) C.stats.zfix[name] = (C.stats.zfix[name] || 0) + n;
    return items;
  };

  /* ===================== material tags (so a weathered copy of any kit material can be asked for) ===================== */
  const tag = (fn, kind) => {
    const f0 = K[fn];
    if (typeof f0 !== 'function') return;
    K[fn] = function () {
      const m = f0.apply(this, arguments);
      if (m && m.userData && !m.userData.mk) m.userData.mk = {k: kind, a: Array.prototype.slice.call(arguments)};
      return m;
    };
  };
  tag('surf', 'surf');
  tag('mat', 'mat');
  tag('tri', 'tri');
  tag('glass', 'glass');
  tag('paint', 'paint');
  // colour times f; ds pulls it toward its own grey first (charring)
  const scl = (c, f, ds) => {
    const q = new T.Color(c === undefined ? 0xffffff : c);
    if (ds) {
      const l = q.r * 0.3 + q.g * 0.59 + q.b * 0.11;
      q.lerp(new T.Color(l, l * 0.97, l * 0.93), ds);
    }
    return q.multiplyScalar(f).getHex();
  };
  const custom = m => m.onBeforeCompile && m.onBeforeCompile !== T.Material.prototype.onBeforeCompile;
  const MC = new Map();
  // f: colour factor; off: lights out; ds: desaturation (0 = keep the colour, 1 = grey: burnt)
  function wornMat(m, f, off, ds) {
    ds = ds || 0;
    if (!m) return m;
    const lit = m.emissive && m.emissive.getHex() && m.emissiveIntensity > 0;
    if (f >= 0.999 && !(off && lit)) return m;
    const key = f.toFixed(2) + (off ? 'o' : '') + (ds ? 'd' + ds.toFixed(2) : '');
    let c = MC.get(m);
    if (!c) MC.set(m, (c = {}));
    if (c[key]) return c[key];
    let r = m;
    const t = m.userData && m.userData.mk;
    try {
      if (t && t.k === 'surf') r = K.surf(t.a[0], scl(t.a[1], f, ds), t.a[2]);
      else if (t && t.k === 'tri')
        r = K.tri(t.a[0], t.a[1], Object.assign({}, t.a[2], {col: scl((t.a[2] || {}).col, f, ds)}));
      else if (t && t.k === 'glass')
        r = K.glass(scl(t.a[0] || 0xcfe6ee, Math.max(0.6, f)), Math.min(0.62, (t.a[1] || 0.22) + 0.16));
      else if (t && t.k === 'mat' && !(lit && !off)) {
        const o = Object.assign({}, t.a[3]);
        if (off) {
          delete o.emissive;
          delete o.emissiveIntensity;
        }
        r = K.mat(
          scl(t.a[0], f * (lit ? 0.55 : 1), ds),
          ds ? 1 : Math.min(1, (t.a[1] === undefined ? 0.6 : t.a[1]) + 0.12),
          ds ? 0 : t.a[2],
          o
        );
      } else {
        r = m.clone();
        if (custom(m)) {
          // world-shader and tri-planar materials: keep their shader hook (clone() drops it)
          r.onBeforeCompile = m.onBeforeCompile;
          r.customProgramCacheKey = m.customProgramCacheKey;
          r.defines = Object.assign({}, m.defines);
          r.userData = Object.assign({}, m.userData);
          delete r.userData.mk;
        }
        if (r.color) r.color.setHex(scl(r.color.getHex(), f * (lit && off ? 0.6 : 1), ds));
        if (ds) {
          if ('roughness' in r) r.roughness = 1;
          if ('metalness' in r) r.metalness = 0;
        }
        if (off && r.emissive) {
          r.emissive.setHex(0);
          r.emissiveIntensity = 0;
        }
      }
    } catch (e) {
      r = m;
    }
    if (r !== m) WB.set(r, {m, f, off, ds});
    return (c[key] = r);
  }
  const WB = new WeakMap(); // worn copy -> {m: base material, f, off}

  /* ===================== decal and debris artwork ===================== */
  const splat = (c, x, y, r, col, n, rr) => {
    c.fillStyle = col;
    for (let i = 0; i < n; i++) {
      const a = rr() * PI * 2,
        d = rr() * r;
      c.beginPath();
      c.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, (0.15 + rr() * 0.5) * r * (1 - d / r / 1.4), 0, PI * 2);
      c.fill();
    }
  };
  const DEC = {};
  const dec = (k, draw, o, w, h) =>
    DEC[k] || (DEC[k] = K.paint('cnd_' + k, w || 256, h || 256, draw, Object.assign({alpha: true, r: 0.92}, o)));
  const ART = {
    litter: () =>
      dec('litter', (c, W, H, r) => {
        c.clearRect(0, 0, W, H);
        for (let i = 0; i < 26; i++) {
          const x = 20 + r() * (W - 40),
            y = 20 + r() * (H - 40);
          c.save();
          c.translate(x, y);
          c.rotate(r() * 6.3);
          const k = r();
          if (k < 0.35) {
            c.fillStyle = ['#d8d4c8', '#c9b48a', '#e8e2d0'][i % 3];
            c.fillRect(-9, -6, 18 + r() * 10, 12 + r() * 6);
          } else if (k < 0.55) {
            c.fillStyle = ['#b8262a', '#2a5ab0', '#d8b020', '#2a8a3a'][i % 4];
            c.fillRect(-10, -4, 20, 8);
            c.fillStyle = '#ddd';
            c.fillRect(-10, -4, 3, 8);
          } else if (k < 0.75) {
            c.fillStyle = ['#7a5a3a', '#5a5a5a', '#e0e0e0'][i % 3];
            c.beginPath();
            c.ellipse(0, 0, 9, 6, 0, 0, PI * 2);
            c.fill();
          } else {
            c.strokeStyle = '#3a3a34';
            c.lineWidth = 2;
            c.beginPath();
            c.moveTo(-10, 0);
            c.quadraticCurveTo(0, -8, 12, 3);
            c.stroke();
          }
          c.restore();
        }
      }),
    papers: () =>
      dec('papers', (c, W, H, r) => {
        c.clearRect(0, 0, W, H);
        for (let i = 0; i < 9; i++) {
          c.save();
          c.translate(30 + r() * (W - 60), 30 + r() * (H - 60));
          c.rotate(r() * 6.3);
          c.fillStyle = ['#f2f0e8', '#e8e4d4', '#f4f4f0', '#ddd6b8'][i % 4];
          c.fillRect(-22, -30, 44, 60);
          c.fillStyle = 'rgba(40,40,40,0.55)';
          for (let l = 0; l < 7; l++) c.fillRect(-17, -24 + l * 7, 26 + r() * 8, 2);
          c.fillStyle = 'rgba(90,60,30,0.25)';
          c.beginPath();
          c.arc(r() * 20 - 10, r() * 30 - 15, 8 + r() * 6, 0, PI * 2);
          c.fill();
          c.restore();
        }
      }),
    stain: () =>
      dec('stain', (c, W, H, r) => {
        c.clearRect(0, 0, W, H);
        c.globalAlpha = 0.55;
        splat(c, W / 2, H / 2, 70, '#2a2016', 24, r);
        c.globalAlpha = 0.35;
        splat(c, W / 2, H / 2, 100, '#3a2c1c', 14, r);
      }),
    blood: () =>
      dec('blood', (c, W, H, r) => {
        c.clearRect(0, 0, W, H);
        c.globalAlpha = 0.9;
        splat(c, W * 0.45, H * 0.5, 40, '#4a0606', 18, r);
        for (let i = 0; i < 30; i++) {
          c.beginPath();
          c.arc(W / 2 + (r() - 0.5) * 200, H / 2 + (r() - 0.5) * 200, 1 + r() * 4, 0, PI * 2);
          c.fill();
        }
        c.globalAlpha = 0.6;
        c.strokeStyle = '#3a0404';
        c.lineWidth = 14;
        c.lineCap = 'round';
        c.beginPath();
        c.moveTo(W * 0.5, H * 0.5);
        c.bezierCurveTo(W * 0.62, H * 0.55, W * 0.75, H * 0.4, W * 0.95, H * 0.48);
        c.stroke();
      }),
    glass: () =>
      dec(
        'glass',
        (c, W, H, r) => {
          c.clearRect(0, 0, W, H);
          for (let i = 0; i < 70; i++) {
            const x = W / 2 + (r() - 0.5) * W * 0.9 * r(),
              y = H / 2 + (r() - 0.5) * H * 0.9,
              s = 2 + r() * 10;
            c.fillStyle = r() < 0.5 ? 'rgba(210,235,245,0.85)' : 'rgba(160,200,215,0.7)';
            c.beginPath();
            c.moveTo(x, y);
            c.lineTo(x + s, y + r() * s);
            c.lineTo(x + r() * s, y + s);
            c.closePath();
            c.fill();
          }
        },
        {r: 0.15, m: 0.3}
      ),
    soot: () =>
      dec('soot', (c, W, H, r) => {
        c.clearRect(0, 0, W, H);
        const g = c.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W / 2);
        g.addColorStop(0, 'rgba(8,6,4,0.9)');
        g.addColorStop(0.6, 'rgba(20,16,12,0.55)');
        g.addColorStop(1, 'rgba(20,16,12,0)');
        c.fillStyle = g;
        c.fillRect(0, 0, W, H);
        c.globalAlpha = 0.5;
        splat(c, W / 2, H / 2, 90, '#050403', 20, r);
      }),
    dust: () =>
      dec('dust', (c, W, H, r) => {
        c.clearRect(0, 0, W, H);
        const g = c.createRadialGradient(W / 2, H / 2, 6, W / 2, H / 2, W / 2);
        g.addColorStop(0, 'rgba(120,114,104,0.85)');
        g.addColorStop(0.7, 'rgba(120,114,104,0.4)');
        g.addColorStop(1, 'rgba(120,114,104,0)');
        c.fillStyle = g;
        c.fillRect(0, 0, W, H);
        for (let i = 0; i < 160; i++) {
          c.fillStyle = ['#6a6660', '#8a847a', '#4a4844', '#a49c90'][i % 4];
          const a = r() * 6.3,
            d = r() * r() * W * 0.45;
          c.fillRect(W / 2 + Math.cos(a) * d, H / 2 + Math.sin(a) * d, 2 + r() * 6, 2 + r() * 5);
        }
      }),
    puddle: () =>
      dec(
        'puddle',
        (c, W, H, r) => {
          c.clearRect(0, 0, W, H);
          c.globalAlpha = 0.7;
          splat(c, W / 2, H / 2, 80, '#14181a', 20, r);
        },
        {r: 0.05, m: 0.2}
      ),
    crack: () =>
      dec('crack', (c, W, H, r) => {
        c.clearRect(0, 0, W, H);
        c.strokeStyle = 'rgba(20,18,16,0.85)';
        const br = (x, y, a, l, w) => {
          if (l < 8 || w < 0.4) return;
          c.lineWidth = w;
          c.beginPath();
          c.moveTo(x, y);
          const x2 = x + Math.cos(a) * l,
            y2 = y + Math.sin(a) * l;
          c.lineTo(x2, y2);
          c.stroke();
          br(x2, y2, a + (r() - 0.5) * 0.9, l * 0.8, w * 0.8);
          if (r() < 0.4) br(x2, y2, a + (r() < 0.5 ? 0.9 : -0.9), l * 0.6, w * 0.6);
        };
        for (let i = 0; i < 3; i++) br(W / 2, H / 2, r() * 6.3, 30, 3);
      }),
    sootv: () =>
      dec('sootv', (c, W, H, r) => {
        c.clearRect(0, 0, W, H);
        for (let i = 0; i < 5; i++) {
          const x = W * (0.2 + r() * 0.6),
            g = c.createLinearGradient(0, H, 0, 0);
          g.addColorStop(0, 'rgba(10,8,6,0.85)');
          g.addColorStop(1, 'rgba(10,8,6,0)');
          c.fillStyle = g;
          c.beginPath();
          c.moveTo(x - 40, H);
          c.quadraticCurveTo(x - 10 + r() * 20, H * 0.4, x + (r() - 0.5) * 40, 0);
          c.quadraticCurveTo(x + 10, H * 0.5, x + 40, H);
          c.fill();
        }
      }),
    weed: () =>
      dec(
        'weed',
        (c, W, H, r) => {
          c.clearRect(0, 0, W, H);
          for (let i = 0; i < 22; i++) {
            c.strokeStyle = ['#4a6a2a', '#5a7a30', '#6a7a3a', '#7a6a3a'][i % 4];
            c.lineWidth = 3 + r() * 3;
            const x = W * (0.15 + r() * 0.7);
            c.beginPath();
            c.moveTo(x, H);
            c.quadraticCurveTo(x + (r() - 0.5) * 60, H * 0.5, x + (r() - 0.5) * 90, H * (0.05 + r() * 0.4));
            c.stroke();
          }
        },
        {r: 0.9}
      )
  };
  const TAGS = [
    ['LOOTED', '#d82a2a'],
    ['NO FOOD', '#f0f0f0'],
    ['DEAD INSIDE', '#e83a1a'],
    ['HELP US', '#f4e040'],
    ['KEEP OUT', '#ff4a2a'],
    ['THEY HEAR YOU', '#40d0f0'],
    ['NOTHING LEFT', '#e0e0e0'],
    ['DONT OPEN', '#ff3020'],
    ['GOD IS GONE', '#f0c020'],
    ['RUN', '#ff2a2a']
  ];
  const tagMat = i =>
    dec(
      'tag' + i,
      (c, W, H, r) => {
        c.clearRect(0, 0, W, H);
        const [t, col] = TAGS[i % TAGS.length];
        c.save();
        c.translate(W / 2, H / 2);
        c.rotate((r() - 0.5) * 0.18);
        c.font = 'bold ' + (t.length > 9 ? 34 : 46) + 'px Impact, Arial Black, sans-serif';
        c.textAlign = 'center';
        c.textBaseline = 'middle';
        c.lineWidth = 7;
        c.strokeStyle = 'rgba(0,0,0,0.6)';
        c.strokeText(t, 0, 0);
        c.fillStyle = col;
        c.fillText(t, 0, 0);
        c.restore();
        // drips under the letters
        c.fillStyle = col;
        for (let k = 0; k < 9; k++) c.fillRect(30 + r() * (W - 60), H / 2 + 14, 3, 10 + r() * 40);
        if (i % 3 === 0) {
          // search mark: an X with a date and a count
          c.strokeStyle = col;
          c.lineWidth = 5;
          c.beginPath();
          c.moveTo(W - 60, 20);
          c.lineTo(W - 10, 70);
          c.moveTo(W - 10, 20);
          c.lineTo(W - 60, 70);
          c.stroke();
        }
      },
      {r: 0.8},
      512,
      256
    );

  /* ===================== spatial index over the building's parts (building-local) ===================== */
  function Index(parts) {
    const cells = new Map(),
      big = [];
    parts.forEach((p, i) => {
      const b = p.b,
        x0 = Math.floor(b.min.x),
        x1 = Math.floor(b.max.x),
        z0 = Math.floor(b.min.z),
        z1 = Math.floor(b.max.z);
      if ((x1 - x0 + 1) * (z1 - z0 + 1) > 300) return big.push(i);
      for (let x = x0; x <= x1; x++)
        for (let z = z0; z <= z1; z++) {
          const k = x * 4096 + z;
          let l = cells.get(k);
          if (!l) cells.set(k, (l = []));
          l.push(i);
        }
    });
    const near = (x0, x1, z0, z1) => {
      const out = new Set(big);
      for (let x = Math.floor(x0); x <= Math.floor(x1); x++)
        for (let z = Math.floor(z0); z <= Math.floor(z1); z++) {
          const l = cells.get(x * 4096 + z);
          if (l) for (const i of l) out.add(i);
        }
      return out;
    };
    const flat = p => p.b.max.y - p.b.min.y < 0.12 && p.b.max.y < 0.7;
    return {
      parts,
      near,
      flat,
      // top of the floor under a point (the highest flat part under it)
      floor(x, z, y0) {
        let y = y0 || 0;
        for (const i of near(x, x, z, z)) {
          const p = parts[i],
            b = p.b;
          if (!p.gone && flat(p) && x >= b.min.x && x <= b.max.x && z >= b.min.z && z <= b.max.z && b.max.y > y)
            y = b.max.y;
        }
        return y;
      },
      // anything solid-looking in a footprint below yMax (except the parts in skip)
      busy(x0, x1, z0, z1, yMin, yMax, skip) {
        for (const i of near(x0, x1, z0, z1)) {
          const p = parts[i],
            b = p.b;
          if (p.gone || (skip && skip.has(i)) || flat(p)) continue;
          if (b.min.x < x1 && b.max.x > x0 && b.min.z < z1 && b.max.z > z0 && b.min.y < yMax && b.max.y > yMin)
            return true;
        }
        return false;
      }
    };
  }

  /* ===================== the building's plan: walls, openings, door zones ===================== */
  // WL is wrapped so each building remembers its walls and openings (B.__wl)
  function wrapWL() {
    if (typeof WL !== 'function' || WL.__cond) return;
    const _WL = WL;
    WL = function (B, ax, fx, a0, a1, ops, h, o) {
      try {
        (B.__wl || (B.__wl = [])).push({
          ax,
          fx,
          a0: Math.min(a0, a1),
          a1: Math.max(a0, a1),
          h,
          th: (o && o.th) || 0.3,
          y: B.y || 0,
          ops: (ops || []).map(p => ({k: p.k, c: p.c}))
        });
      } catch (e) {}
      return _WL.apply(this, arguments);
    };
    WL.__cond = 1;
  }
  wrapWL();
  const ZDEP = 1.4;
  // clear zones in building-local coords: [x0, x1, z0, z1] for every door and gate (1.4 m deep each side, opening + 0.1)
  C.zones = function (B) {
    const out = [];
    for (const w of B.__wl || [])
      for (const p of w.ops) {
        if (p.k !== 'd' && p.k !== 'g') continue;
        const hw = (p.k === 'g' ? 0.8 : 0.65) + 0.1;
        if (w.ax) out.push([p.c - hw, p.c + hw, w.fx - ZDEP, w.fx + ZDEP, p.k, w]);
        else out.push([w.fx - ZDEP, w.fx + ZDEP, p.c - hw, p.c + hw, p.k, w]);
      }
    return out;
  };
  const hitZone = (Z, x0, x1, z0, z1) => Z.some(r => x0 < r[1] && x1 > r[0] && z0 < r[3] && z1 > r[2]);
  function plan(B) {
    const W = B.__wl || [];
    let fp = null;
    for (const w of W) {
      const r = w.ax ? [w.a0, w.a1, w.fx, w.fx] : [w.fx, w.fx, w.a0, w.a1];
      if (!fp) fp = r.slice();
      else fp = [Math.min(fp[0], r[0]), Math.max(fp[1], r[1]), Math.min(fp[2], r[2]), Math.max(fp[3], r[3])];
    }
    if (fp && (fp[1] - fp[0] < 2 || fp[3] - fp[2] < 2)) fp = null;
    const H = W.reduce((m, w) => Math.max(m, w.h || 0), 0) || B.h || 4;
    return {
      fp,
      Z: C.zones(B),
      walls: W,
      H,
      lot: [-(B.w || 40) / 2, (B.w || 40) / 2, -(B.d || 36) / 2, (B.d || 36) / 2]
    };
  }

  /* ===================== the variant (building-local part list) ===================== */
  const bx = (w, h, d, mat, p, r, out) =>
    out.push({
      geo: K.rboxGeo(w, h, d, Math.min(0.02, Math.min(w, h, d) / 4), 1),
      mat,
      m: new T.Matrix4().compose(
        new T.Vector3(...p),
        new T.Quaternion().setFromEuler(new T.Euler(...(r || [0, 0, 0]))),
        new T.Vector3(1, 1, 1)
      )
    });
  const decal = (mat, w, d, x, y, z, yaw, out) =>
    out.push({
      geo: K.planeGeo(w, d),
      mat,
      m: new T.Matrix4().compose(
        new T.Vector3(x, y, z),
        new T.Quaternion().setFromEuler(new T.Euler(-PI / 2, 0, yaw)),
        new T.Vector3(1, 1, 1)
      )
    });
  let LOT = null; // the plot rect of the building being dressed: wall decals never hang over it
  const wallDecal = (mat, w, h, x, y, z, ax, s, out) => {
    if (LOT) {
      const hx = ax ? w / 2 : 0.01,
        hz = ax ? 0.01 : w / 2;
      if (x - hx < LOT[0] + 0.05 || x + hx > LOT[1] - 0.05 || z - hz < LOT[2] + 0.05 || z + hz > LOT[3] - 0.05) return;
    }
    // ax 1: wall along X, faces +Z (s = 1) or -Z; ax 0: wall along Z, faces +X / -X
    const ry = ax ? (s > 0 ? 0 : PI) : s > 0 ? PI / 2 : -PI / 2;
    out.push({
      geo: K.planeGeo(w, h),
      mat,
      m: new T.Matrix4().compose(
        new T.Vector3(x, y, z),
        new T.Quaternion().setFromEuler(new T.Euler(0, ry, 0)),
        new T.Vector3(1, 1, 1)
      )
    });
  };

  /* v090: is this material foliage? 'leaf' (leaves: canopies burn away) or 'hedge' (hedges, bushes: charred black) */
  function foliage(m) {
    const t = m && m.userData && m.userData.mk;
    if (!t || !t.a) return null;
    const n = String(t.a[0] || '').toLowerCase();
    if (t.k === 'surf') return /^lea(f|ves)/.test(n) ? 'leaf' : /hedge|shrub|bush/.test(n) ? 'hedge' : null;
    if (t.k === 'tri')
      return /hedge|shrub|bush|boxwood|topiary/.test(n)
        ? 'hedge'
        : /leaf|leaves|foliage|canopy/.test(n)
          ? 'leaf'
          : null;
    return null;
  }
  C.foliage = foliage;

  /* v090: lots whose ruined copy should be stripped harder: the share of loose floor stock / clutter carried off (removed, not
     shoved), and stock knocked off shelves no longer litters the floor. Pawnographic's ruined floor was too full. */
  C.thin = {golden_fences_pawn: 0.65};
  let CUR_ID = null;

  // parts: [{b: Box3 (local), it?: item, core?: mesh}], P: plan, lv, rnd. Returns {items (new list or null), add: [new items], holes, boarded}
  function makeVariant(src, parts, P, lv, rnd, opt) {
    const B0y = P.y || 0;
    LOT = P.lot;
    const ruined = lv >= 2,
      burnt = ruined, // v089: every ruin is a burnt-out shell
      Q = Index(parts),
      fp = P.fp,
      Z = P.Z,
      add = [],
      holes = [],
      st = {
        glass: 0,
        dark: 0,
        stock: 0,
        dropped: 0,
        shoved: 0,
        holes: 0,
        tiles: 0,
        decals: 0,
        tags: 0,
        boards: 0,
        weeds: 0
      };
    const R = (a, b) => a + (b - a) * rnd(),
      pick = a => a[Math.floor(rnd() * a.length) % a.length];
    const inFp = (x, z, m) =>
      fp && x > fp[0] + (m || 0) && x < fp[1] - (m || 0) && z > fp[2] + (m || 0) && z < fp[3] - (m || 0);
    const items = src ? src.items : null;
    const out = items ? items.map(it => it) : null; // edited in place (null = removed)
    const tint = ruined ? (burnt ? 0.46 : 0.66) : 0.93;

    if (items) {
      const isGlass = m => m && m.transparent && m.opacity < 0.7 && !m.map;
      const lit = m => m && m.emissive && m.emissive.getHex() && m.emissiveIntensity > 0;
      const info = parts.filter(p => p.it); // parts that are items carry .k (index into items)
      const off = new Set();
      /* --- glass smashed, shards under it --- */
      for (const p of info) {
        const it = items[p.k],
          b = p.b;
        if (!isGlass(it.mat)) continue;
        const sx = b.max.x - b.min.x,
          sy = b.max.y - b.min.y,
          sz = b.max.z - b.min.z;
        if (Math.min(sx, sy, sz) > 0.07 || sy < 0.3 || Math.max(sx, sz) < 0.3) continue;
        if (rnd() > (ruined ? 1 : 0.5)) continue; // ruined: every pane gone
        out[p.k] = null;
        p.gone = 1;
        st.glass++;
        const cx = (b.min.x + b.max.x) / 2,
          cz = (b.min.z + b.max.z) / 2,
          w = Math.max(sx, sz);
        if (b.min.y < 1.6 && !hitZone(Z, cx - 0.3, cx + 0.3, cz - 0.3, cz + 0.3))
          decal(ART.glass(), Math.min(2.4, w + 0.4), 1.0, cx, Q.floor(cx, cz) + 0.004, cz, sx > sz ? 0 : PI / 2, add);
      }
      /* --- lights and signs: some dead (all when ruined), and weathering --- */
      for (let k = 0; k < items.length; k++) {
        const it = out[k];
        if (!it) continue;
        const l = lit(it.mat);
        let o = false;
        if (l) {
          if (!off.has(it.mat) && rnd() < (ruined ? 0.95 : 0.45)) off.add(it.mat);
          o = off.has(it.mat);
          if (o) st.dark++;
        }
        let m2;
        if (ruined) {
          // v090: burnt foliage. Leaf canopies (above 1.2 m) burn away, hedges / bushes / low leaves go black
          const fol = foliage(it.mat);
          if (fol) {
            const b = src.__ab[k];
            if (fol === 'leaf' && b.min.y > 1.2) out[k] = null;
            else out[k] = {geo: it.geo, mat: K.mat(0x0b0b09, 1, 0), m: it.m};
            continue;
          }
          // burnt: the building charred (each material its own shade, charcoal to ash), the lot round it only grimy
          const b = src.__ab[k],
            cx = (b.min.x + b.max.x) / 2,
            cz = (b.min.z + b.max.z) / 2;
          const ground = b.max.y - b.min.y < 0.15 && b.max.y < 0.2; // a floor or the lot's ground
          const inB = ground
            ? fp && b.min.x > fp[0] - 0.8 && b.max.x < fp[1] + 0.8 && b.min.z > fp[2] - 0.8 && b.max.z < fp[3] + 0.8
            : inFp(cx, cz, -0.6) || (fp && b.max.y > 1.0 && inFp(cx, cz, -3.2));
          if (inB) {
            const h = ((parseInt(it.mat.uuid.slice(0, 6), 16) || 0) % 1000) / 1000;
            m2 = wornMat(it.mat, (0.2 + 0.2 * h) * (it.mat.map ? 0.5 : 1), o, 0.72); // textures keep their hue: char them harder
          } else m2 = wornMat(it.mat, 0.86, o, 0.15);
        } else m2 = wornMat(it.mat, tint, o);
        if (m2 !== it.mat) out[k] = {geo: it.geo, mat: m2, m: it.m};
      }
      /* --- clusters of loose parts (touching), for stock and furniture --- */
      const cand = info.filter(p => {
        if (p.gone) return false;
        const b = p.b,
          s = Math.max(b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z);
        return s <= 1.3 && !lit(items[p.k].mat);
      });
      const par = new Map(cand.map(p => [p, p]));
      const root = p => {
        while (par.get(p) !== p) {
          par.set(p, par.get(par.get(p)));
          p = par.get(p);
        }
        return p;
      };
      const QC = Index(cand),
        e = 0.004;
      cand.forEach((p, i) => {
        const b = p.b;
        for (const j of QC.near(b.min.x - e, b.max.x + e, b.min.z - e, b.max.z + e)) {
          if (j <= i) continue;
          const q = cand[j],
            c = q.b;
          if (
            b.min.x - e < c.max.x &&
            b.max.x + e > c.min.x &&
            b.min.y - e < c.max.y &&
            b.max.y + e > c.min.y &&
            b.min.z - e < c.max.z &&
            b.max.z + e > c.min.z
          ) {
            const a = root(p),
              d = root(q);
            if (a !== d) par.set(a, d);
          }
        }
      });
      const groups = new Map();
      for (const p of cand) {
        const r = root(p);
        let g = groups.get(r);
        if (!g) groups.set(r, (g = {ps: [], b: new T.Box3()}));
        g.ps.push(p);
        g.b.union(p.b);
      }
      const cols = opt.cols || [];
      const solidAt = b =>
        cols.some(
          c => b.min.x < c[3] && b.max.x > c[0] && b.min.z < c[5] && b.max.z > c[2] && b.min.y < c[4] && b.max.y > c[1]
        );
      const idxOf = new Map(parts.map((p, i) => [p, i]));
      const moveG = (g, M) => {
        for (const p of g.ps) {
          const it = out[p.k];
          if (it) out[p.k] = {geo: it.geo, mat: it.mat, m: M.clone().multiply(it.m)};
        }
      };
      const freeAt = (b, skip) =>
        !Q.busy(b.min.x, b.max.x, b.min.z, b.max.z, b.min.y + 0.02, b.max.y, skip) &&
        !hitZone(Z, b.min.x, b.max.x, b.min.z, b.max.z) &&
        b.min.x > P.lot[0] + 0.3 &&
        b.max.x < P.lot[1] - 0.3 &&
        b.min.z > P.lot[2] + 0.3 &&
        b.max.z < P.lot[3] - 0.3 &&
        !cols.some(
          c => b.min.x < c[3] && b.max.x > c[0] && b.min.z < c[5] && b.max.z > c[2] && b.min.y < c[4] && b.max.y > c[1]
        );
      for (const g of groups.values()) {
        const b = g.b,
          sx = b.max.x - b.min.x,
          sy = b.max.y - b.min.y,
          sz = b.max.z - b.min.z,
          cx = (b.min.x + b.max.x) / 2,
          cz = (b.min.z + b.max.z) / 2;
        if (!g.ps.some(p => items[p.k].geo.type !== 'PlaneGeometry')) continue; // posters and labels stay
        const inside = inFp(cx, cz, 0.2);
        // stock: a small loose group up on a shelf or counter
        if (inside && Math.max(sx, sy, sz) <= 0.6 && b.min.y >= 0.12 && b.max.y <= 2.4) {
          if (rnd() > (ruined ? 0.9 : 0.55)) continue;
          for (const p of g.ps) {
            out[p.k] = null;
            p.gone = 1;
          }
          st.stock++;
          // some of it ends up on the floor nearby
          if (rnd() < (ruined ? (C.thin[CUR_ID] ? 0.04 : 0.22) : 0.32)) {
            const skip = new Set(g.ps.map(p => idxOf.get(p)));
            for (let t = 0; t < 6; t++) {
              const nx = cx + R(-0.9, 0.9),
                nz = cz + R(-0.9, 0.9),
                fy = Q.floor(nx, nz),
                yaw = R(0, 6.28);
              const M = new T.Matrix4()
                .makeTranslation(nx, fy + 0.002, nz)
                .multiply(new T.Matrix4().makeRotationY(yaw))
                .multiply(new T.Matrix4().makeTranslation(-cx, -b.min.y, -cz));
              const nb = b.clone().applyMatrix4(M);
              if (!inFp(nx, nz, 0.3) || !freeAt(nb, skip)) continue;
              for (const p of g.ps) {
                const it = items[p.k];
                out[p.k] = {geo: it.geo, mat: wornMat(it.mat, tint, false), m: M.clone().multiply(it.m)};
              }
              st.dropped++;
              break;
            }
          }
          continue;
        }
        // loose furniture / clutter standing on the floor: shoved, turned or knocked over
        if (b.min.y <= 0.06 && Math.max(sx, sz) <= 1.4 && sy <= 1.5 && sy > 0.25) {
          if (ruined && inside && C.thin[CUR_ID] && rnd() < C.thin[CUR_ID] && !solidAt(b)) {
            for (const p of g.ps) {
              out[p.k] = null;
              p.gone = 1;
            }
            st.stock++;
            continue;
          }
          if (rnd() > (ruined ? 0.75 : 0.35)) continue;
          const skip = new Set(g.ps.map(p => idxOf.get(p))),
            hasCol = solidAt(b);
          for (let t = 0; t < 6; t++) {
            let M;
            const yaw = hasCol ? R(-0.22, 0.22) : R(-1.2, 1.2);
            if (!hasCol && sy >= 0.45 && Math.max(sx, sz) <= 0.9 && rnd() < 0.45) {
              // knocked over: tipped 90 degrees onto one side, about the bottom edge
              const dir = Math.floor(rnd() * 4),
                ax = dir < 2 ? new T.Vector3(1, 0, 0) : new T.Vector3(0, 0, 1),
                sg = dir % 2 ? 1 : -1,
                px = dir < 2 ? cx : sg > 0 ? b.min.x : b.max.x,
                pz = dir < 2 ? (sg > 0 ? b.max.z : b.min.z) : cz;
              M = new T.Matrix4()
                .makeTranslation(px, b.min.y, pz)
                .multiply(new T.Matrix4().makeRotationAxis(ax, (sg * PI) / 2))
                .multiply(new T.Matrix4().makeTranslation(-px, -b.min.y, -pz));
              // it rests on its side: lift so nothing goes under the floor
              const nb0 = b.clone().applyMatrix4(M);
              M = new T.Matrix4().makeTranslation(0, b.min.y - nb0.min.y + 0.002, 0).multiply(M);
            } else {
              const dx = hasCol ? 0 : R(-0.35, 0.35),
                dz = hasCol ? 0 : R(-0.35, 0.35);
              M = new T.Matrix4()
                .makeTranslation(cx + dx, 0, cz + dz)
                .multiply(new T.Matrix4().makeRotationY(yaw))
                .multiply(new T.Matrix4().makeTranslation(-cx, 0, -cz));
            }
            const nb = b.clone().applyMatrix4(M);
            if (!hasCol && !freeAt(nb, skip)) continue;
            if (hasCol && hitZone(Z, nb.min.x, nb.max.x, nb.min.z, nb.max.z)) continue;
            if (
              nb.min.x < P.lot[0] + 0.1 ||
              nb.max.x > P.lot[1] - 0.1 ||
              nb.min.z < P.lot[2] + 0.1 ||
              nb.max.z > P.lot[3] - 0.1
            )
              continue;
            moveG(g, M);
            st.shoved++;
            break;
          }
        }
      }
      /* --- roof and ceiling slabs: holes (ruined), fallen ceiling tiles --- */
      const slabInfo = p => {
        const it = items[p.k];
        if (!isBoxGeo(it.geo) || out[p.k] === null) return null;
        const gb = geoBox(it.geo),
          e = it.m.elements,
          sc = [Math.hypot(e[0], e[1], e[2]), Math.hypot(e[4], e[5], e[6]), Math.hypot(e[8], e[9], e[10])],
          d = [(gb.max.x - gb.min.x) * sc[0], (gb.max.y - gb.min.y) * sc[1], (gb.max.z - gb.min.z) * sc[2]];
        const th = d.indexOf(Math.min(...d)),
          nv = [e[th * 4], e[th * 4 + 1], e[th * 4 + 2]],
          ny = Math.abs(nv[1]) / (sc[th] || 1);
        const [a, c] = [0, 1, 2].filter(q => q !== th);
        return {p, it, gb, d, th, a, c, ny};
      };
      if (ruined && fp) {
        const slabs = [];
        for (const p of info) {
          if (p.gone || p.b.max.y < 2.2) continue;
          const s = slabInfo(p);
          if (!s || s.d[s.th] > 0.6 || s.ny < 0.5) continue;
          const cx = (p.b.min.x + p.b.max.x) / 2,
            cz = (p.b.min.z + p.b.max.z) / 2;
          if (!inFp(cx, cz, -1)) continue;
          if (s.d[s.a] >= 1.0 && s.d[s.c] >= 1.0) slabs.push(s);
        }
        const hosts = slabs.filter(s => s.d[s.a] >= 3.5 && s.d[s.c] >= 3.5).sort((u, v) => v.p.b.max.y - u.p.b.max.y);
        const area = (fp[1] - fp[0]) * (fp[3] - fp[2]),
          nh = Math.min(hosts.length ? 7 : 0, Math.max(2, Math.round(area / 90)) + (rnd() < 0.5 ? 1 : 0)); // burnt: most of the roof gone
        const topY = hosts.length ? hosts[0].p.b.max.y : 0,
          tops = hosts.filter(s => s.p.b.max.y > topY - 1.6);
        const V = new T.Vector3();
        for (let h = 0, tries = 0; h < nh && tries < 120; tries++) {
          const s = pick(tops),
            gb = s.gb;
          const lo = [gb.min.x, gb.min.y, gb.min.z],
            hi = [gb.max.x, gb.max.y, gb.max.z];
          const la = (hi[s.a] - lo[s.a]) * 1,
            lc = (hi[s.c] - lo[s.c]) * 1;
          const wa = Math.min(R(4.0, 9.0), la - 1.4),
            wc = Math.min(R(3.5, 7.5), lc - 1.4);
          if (wa < 1.4 || wc < 1.4) continue;
          const ca = lo[s.a] + 0.7 + wa / 2 + rnd() * (la - 1.4 - wa),
            cc = lo[s.c] + 0.7 + wc / 2 + rnd() * (lc - 1.4 - wc);
          // world (building-local) xz footprint of the hole
          const H = [1e9, -1e9, 1e9, -1e9];
          for (const [ua, uc] of [
            [-1, -1],
            [1, -1],
            [1, 1],
            [-1, 1]
          ]) {
            const q = [(lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, (lo[2] + hi[2]) / 2];
            q[s.a] = ca + (ua * wa) / 2;
            q[s.c] = cc + (uc * wc) / 2;
            V.set(q[0], q[1], q[2]).applyMatrix4(s.it.m);
            H[0] = Math.min(H[0], V.x);
            H[1] = Math.max(H[1], V.x);
            H[2] = Math.min(H[2], V.z);
            H[3] = Math.max(H[3], V.z);
          }
          if (!inFp(H[0], H[2], 0.3) || !inFp(H[1], H[3], 0.3)) continue;
          // (a hole may be over a doorway: its rubble keeps out of the clear zones piece by piece)
          if (holes.some(o => H[0] < o[1] + 1 && H[1] > o[0] - 1 && H[2] < o[3] + 1 && H[3] > o[2] - 1)) continue;
          H.push(s.p.b.min.y); // underside height of the slab the hole is in (for the hanging joists)
          holes.push(H);
          h++;
        }
        const cutMats = [];
        // every slab over a hole is cut round all its holes at once (in its own frame), with a ragged edge
        for (const s of slabs) {
          const b = s.p.b;
          const hs = holes.filter(H => !(b.max.x <= H[0] || b.min.x >= H[1] || b.max.z <= H[2] || b.min.z >= H[3]));
          if (!hs.length || out[s.p.k] === null) continue;
          const it = out[s.p.k] || s.it,
            inv = new T.Matrix4().copy(it.m).invert(),
            gb = s.gb,
            lo = [gb.min.x, gb.min.y, gb.min.z],
            hi = [gb.max.x, gb.max.y, gb.max.z];
          const cw = new T.Vector3((b.min.x + b.max.x) / 2, (b.min.y + b.max.y) / 2, (b.min.z + b.max.z) / 2);
          const e = it.m.elements,
            n = new T.Vector3(e[s.th * 4], e[s.th * 4 + 1], e[s.th * 4 + 2]).normalize();
          const rects = [];
          for (const H of hs) {
            const ha = [1e9, -1e9],
              hc = [1e9, -1e9];
            for (const [x, z] of [
              [H[0], H[2]],
              [H[1], H[2]],
              [H[1], H[3]],
              [H[0], H[3]]
            ]) {
              // the point of the slab's plane straight above the corner, in the slab's own frame
              const y = cw.y - (n.x * (x - cw.x) + n.z * (z - cw.z)) / n.y;
              V.set(x, y, z).applyMatrix4(inv);
              const q = [V.x, V.y, V.z];
              ha[0] = Math.min(ha[0], q[s.a]);
              ha[1] = Math.max(ha[1], q[s.a]);
              hc[0] = Math.min(hc[0], q[s.c]);
              hc[1] = Math.max(hc[1], q[s.c]);
            }
            const r = [
              Math.max(lo[s.a], ha[0]),
              Math.min(hi[s.a], ha[1]),
              Math.max(lo[s.c], hc[0]),
              Math.min(hi[s.c], hc[1])
            ];
            if (r[1] - r[0] > 0.05 && r[3] - r[2] > 0.05) rects.push(r);
          }
          if (!rects.length) continue;
          out[s.p.k] = null;
          s.p.gone = 1;
          if (!cutMats.includes(it.mat)) cutMats.push(it.mat);
          const piece = (pa0, pa1, pc0, pc1) => {
            if (pa1 - pa0 < 0.04 || pc1 - pc0 < 0.04) return;
            const size = [0, 0, 0],
              cen = [0, 0, 0];
            size[s.th] = hi[s.th] - lo[s.th];
            cen[s.th] = (hi[s.th] + lo[s.th]) / 2;
            size[s.a] = pa1 - pa0;
            cen[s.a] = (pa0 + pa1) / 2;
            size[s.c] = pc1 - pc0;
            cen[s.c] = (pc0 + pc1) / 2;
            add.push({
              geo: K.rboxGeo(size[0], size[1], size[2], 0),
              mat: it.mat,
              m: it.m.clone().multiply(new T.Matrix4().makeTranslation(cen[0], cen[1], cen[2]))
            });
          };
          // grid of cut lines; keep the cells outside every hole, merged along a
          const ua = [lo[s.a], hi[s.a]],
            uc = [lo[s.c], hi[s.c]];
          for (const r of rects) (ua.push(r[0], r[1]), uc.push(r[2], r[3]));
          const sa = [...new Set(ua)].sort((p, q) => p - q),
            sc = [...new Set(uc)].sort((p, q) => p - q);
          for (let j = 0; j + 1 < sc.length; j++) {
            const cm = (sc[j] + sc[j + 1]) / 2;
            let run = null;
            for (let i = 0; i + 1 < sa.length; i++) {
              const am = (sa[i] + sa[i + 1]) / 2,
                hole = rects.some(r => am > r[0] && am < r[1] && cm > r[2] && cm < r[3]);
              if (!hole) run = run === null ? sa[i] : run;
              if (run !== null && (hole || i + 2 === sa.length)) {
                piece(run, hole ? sa[i] : sa[i + 1], sc[j], sc[j + 1]);
                run = null;
              }
            }
          }
          // ragged edge: bites of slab left sticking into each hole
          for (const [a0, a1, c0, c1] of rects) {
            const ja = a1 - a0,
              jc = c1 - c0;
            for (let j = 0; j < 8; j++) {
              const side = j % 4,
                l = R(0.25, 0.9),
                dpt = R(0.1, 0.45);
              if (side < 2) {
                const u = a0 + rnd() * Math.max(0.01, ja - l);
                piece(u, Math.min(a1, u + l), side ? c1 - dpt : c0, side ? c1 : c0 + dpt);
              } else {
                const u = c0 + rnd() * Math.max(0.01, jc - l);
                piece(side === 3 ? a1 - dpt : a0, side === 3 ? a1 : a0 + dpt, u, Math.min(c1, u + l));
              }
            }
          }
        }
        for (const H of holes) {
          st.holes++;
          // fixtures hanging in the hole fall with it
          for (const p of info) {
            const b = p.b;
            if (p.gone || b.min.y < 2.0) continue;
            if (b.min.x >= H[0] - 0.2 && b.max.x <= H[1] + 0.2 && b.min.z >= H[2] - 0.2 && b.max.z <= H[3] + 0.2) {
              out[p.k] = null;
              p.gone = 1;
            }
          }
          // the pile under it: chunks, slab fragments, broken joists, dust. No collision.
          const cx = (H[0] + H[1]) / 2,
            cz = (H[2] + H[3]) / 2,
            fy = Q.floor(cx, cz),
            wx = H[1] - H[0],
            wz = H[3] - H[2];
          // (dust and ash: square to the walls and clipped to the plot)
          const clip = g => {
            const x0 = Math.max(P.lot[0] + 0.1, cx - (wx + g) / 2),
              x1 = Math.min(P.lot[1] - 0.1, cx + (wx + g) / 2),
              z0 = Math.max(P.lot[2] + 0.1, cz - (wz + g) / 2),
              z1 = Math.min(P.lot[3] - 0.1, cz + (wz + g) / 2);
            return [x1 - x0, z1 - z0, (x0 + x1) / 2, (z0 + z1) / 2];
          };
          {
            const [a, b2, x, z] = clip(1.2);
            decal(ART.dust(), a, b2, x, fy + 0.005, z, 0, add);
          }
          const cm = cutMats.length ? cutMats : [K.mat(0x8a8680, 0.9)],
            tim = K.mat(burnt ? 0x2a1e14 : 0x6a4a2a, 0.9),
            conc = K.mat(0x7a7670, 0.95),
            ins = K.mat(0xd89aa0, 0.95);
          for (let j = 0; j < 12; j++) {
            const x = cx + R(-wx / 2 + 0.3, wx / 2 - 0.3),
              z = cz + R(-wz / 2 + 0.3, wz / 2 - 0.3);
            if (
              Q.busy(x - 0.3, x + 0.3, z - 0.3, z + 0.3, fy + 0.02, fy + 0.6) ||
              hitZone(Z, x - 0.4, x + 0.4, z - 0.4, z + 0.4)
            )
              continue;
            const w = R(0.2, 0.7),
              h = R(0.08, 0.32),
              d = R(0.2, 0.6);
            bx(
              w,
              h,
              d,
              j % 4 === 3 ? ins : j % 3 ? pick(cm) : conc,
              [x, Q.floor(x, z) + h / 2 - 0.02, z],
              [R(-0.25, 0.25), R(0, 6.3), R(-0.25, 0.25)],
              add
            );
          }
          for (let j = 0; j < 3; j++) {
            const x = cx + R(-wx / 4, wx / 4),
              z = cz + R(-wz / 4, wz / 4),
              l = R(0.8, 1.5),
              t = R(0.25, 0.55);
            if (
              Q.busy(x - 0.6, x + 0.6, z - 0.6, z + 0.6, fy + 0.02, fy + 0.8) ||
              hitZone(Z, x - 0.8, x + 0.8, z - 0.8, z + 0.8)
            )
              continue;
            bx(
              l,
              0.08,
              R(0.6, 1.1),
              pick(cm),
              [x, Q.floor(x, z) + Math.sin(t) * (l / 2) + 0.02, z],
              [0, R(0, 6.3), t],
              add
            );
          }
          const top = H[4] || P.H;
          for (let j = 0; j < 4; j++) {
            const x = cx + R(-wx / 2, wx / 2) * 0.8,
              z = cz + R(-wz / 2, wz / 2) * 0.8,
              l = R(1.4, 2.8),
              t = R(0.5, 1.1),
              hh = (Math.sin(t) * l) / 2;
            if (hitZone(Z, x - l / 2, x + l / 2, z - l / 2, z + l / 2)) continue; // not down into a doorway
            // a joist hanging from under the edge of the hole down toward the floor (never above the roof)
            bx(
              0.07,
              0.2,
              l,
              tim,
              [x, Math.max(fy + hh + 0.1, Math.min(top - 0.25 - hh, top - 0.3)), z],
              [t, R(0, 6.3), 0],
              add
            );
          }
          // burnt: the charred rafters are left across the hole, some gone, some snapped and hanging
          const char = K.mat(0x17120e, 1),
            alongX = wx < wz, // rafters span the short way
            span = alongX ? wx : wz,
            run = alongX ? [H[2], H[3]] : [H[0], H[1]],
            ry = top - 0.12;
          for (let u = run[0] + 0.45; u < run[1] - 0.3; u += 0.85) {
            const k = rnd();
            if (k < 0.22) continue;
            if (k < 0.45) {
              // snapped: a stub from the edge, angled down
              const l = R(0.8, span * 0.5),
                t = R(0.25, 0.7),
                side = rnd() < 0.5 ? -1 : 1,
                e0 = alongX ? (side < 0 ? H[0] : H[1]) : side < 0 ? H[2] : H[3],
                c = e0 - (side * (Math.cos(t) * l)) / 2,
                y = ry - (Math.sin(t) * l) / 2;
              if (y - (Math.sin(t) * l) / 2 < (B0y || 0) + 2.2) {
                const hl = (Math.cos(t) * l) / 2 + 0.1;
                if (
                  alongX ? hitZone(Z, c - hl, c + hl, u - 0.1, u + 0.1) : hitZone(Z, u - 0.1, u + 0.1, c - hl, c + hl)
                )
                  continue;
              }
              if (alongX) bx(l, 0.18, 0.08, char, [c, y, u], [0, 0, side * t], add);
              else bx(0.08, 0.18, l, char, [u, y, c], [-side * t, 0, 0], add);
              continue;
            }
            const l = span + 0.6;
            if (alongX) bx(l, 0.18, 0.08, char, [(H[0] + H[1]) / 2, ry, u], [0, 0, R(-0.03, 0.03)], add);
            else bx(0.08, 0.18, l, char, [u, ry, (H[2] + H[3]) / 2], [R(-0.03, 0.03), 0, 0], add);
          }
          // ash and a few embers still glowing in the pile
          {
            const [a, b2, x, z] = clip(0.6);
            decal(ART.soot(), a, b2, x, fy + 0.0065, z, 0, add);
          }
          const ember = K.mat(0xff5a14, 0.9, 0, {emissive: 0xff3a00, emissiveIntensity: 1.4});
          for (let j = 0; j < 5; j++) {
            const x = cx + R(-wx / 3, wx / 3),
              z = cz + R(-wz / 3, wz / 3);
            if (Q.busy(x - 0.2, x + 0.2, z - 0.2, z + 0.2, fy + 0.02, fy + 0.5)) continue;
            bx(R(0.12, 0.3), 0.05, R(0.12, 0.3), ember, [x, Q.floor(x, z) + 0.03, z], [0, R(0, 6.3), 0], add);
          }
        }
        /* fallen ceiling tiles (small flat panels high up) */
        for (const p of info) {
          if (p.gone || p.b.min.y < 2.3) continue;
          const s = slabInfo(p);
          if (
            !s ||
            s.d[s.th] > 0.08 ||
            s.ny < 0.99 ||
            Math.max(s.d[s.a], s.d[s.c]) > 1.35 ||
            Math.min(s.d[s.a], s.d[s.c]) < 0.45
          )
            continue;
          const b = p.b,
            cx = (b.min.x + b.max.x) / 2,
            cz = (b.min.z + b.max.z) / 2;
          if (!inFp(cx, cz, 0.3) || rnd() > 0.2) continue;
          out[p.k] = null;
          p.gone = 1;
          st.tiles++;
          if (rnd() < 0.6) {
            const nx = cx + R(-0.6, 0.6),
              nz = cz + R(-0.6, 0.6),
              fy = Q.floor(nx, nz),
              t = R(0.08, 0.3),
              hl = Math.max(s.d[s.a], s.d[s.c]) / 2;
            const nb = new T.Box3(new T.Vector3(nx - hl, fy, nz - hl), new T.Vector3(nx + hl, fy + 0.4, nz + hl));
            if (
              Q.busy(nb.min.x, nb.max.x, nb.min.z, nb.max.z, fy + 0.03, fy + 0.4) ||
              hitZone(Z, nb.min.x, nb.max.x, nb.min.z, nb.max.z)
            )
              continue;
            const it = s.it,
              M = new T.Matrix4()
                .makeTranslation(nx, fy + Math.sin(t) * hl + 0.03, nz)
                .multiply(new T.Matrix4().makeRotationY(R(0, 6.3)))
                .multiply(new T.Matrix4().makeRotationX(t))
                .multiply(new T.Matrix4().makeTranslation(-cx, -(b.min.y + b.max.y) / 2, -cz));
            add.push({geo: it.geo, mat: wornMat(it.mat, tint, true), m: M.multiply(it.m)});
          }
        }
      }
    }

    /* --- floor dressing: litter, papers, stains, blood; dust, soot, puddles and cracks when ruined --- */
    let dk = 0;
    const dy = () => 0.003 + (dk++ % 6) * 0.0011;
    const floorDecal = (kind, x, z, s) => {
      const r = s * 0.72 + 0.05; // never over the plot edge (town validation)
      if (x - r < P.lot[0] || x + r > P.lot[1] || z - r < P.lot[2] || z + r > P.lot[3]) return false;
      const fy = Q.floor(x, z);
      if (Q.busy(x - 0.25, x + 0.25, z - 0.25, z + 0.25, fy + 0.03, fy + 0.9)) return false;
      decal(ART[kind](), s, s * R(0.7, 1.0), x, fy + dy(), z, R(0, 6.3), add);
      st.decals++;
      return true;
    };
    const W = ruined
      ? [
          ['litter', 0.6],
          ['papers', 0.3],
          ['stain', 1],
          ['blood', 0.5],
          ['dust', 2.5],
          ['soot', 6],
          ['puddle', 1.2],
          ['crack', 1.5]
        ]
      : [
          ['litter', 3],
          ['papers', 3],
          ['stain', 2],
          ['blood', 1.4]
        ];
    const wsum = W.reduce((a, w) => a + w[1], 0);
    const kind = () => {
      let r = rnd() * wsum;
      for (const [k, w] of W) if ((r -= w) <= 0) return k;
      return W[0][0];
    };
    if (fp) {
      const area = (fp[1] - fp[0]) * (fp[3] - fp[2]),
        n = Math.min(90, Math.round(area / (ruined ? 4.5 : 9)));
      for (let i = 0, t = 0; i < n && t < n * 4; t++) {
        const x = R(fp[0] + 0.5, fp[1] - 0.5),
          z = R(fp[2] + 0.5, fp[3] - 0.5);
        if (floorDecal(kind(), x, z, R(0.8, 2.0))) i++;
      }
    }
    // outside: litter, oil, papers on the lot and sidewalk
    for (let i = 0, t = 0, n = ruined ? 12 : 8; i < n && t < 60; t++) {
      const x = R(P.lot[0] + 1, P.lot[1] - 1),
        z = R(P.lot[2] + 1, P.lot[3] - 0.2);
      if (fp && inFp(x, z, -0.4)) continue;
      if (
        floorDecal(
          pick(ruined ? ['litter', 'stain', 'papers', 'crack', 'dust'] : ['litter', 'stain', 'papers']),
          x,
          z,
          R(0.9, 2.2)
        )
      )
        i++;
    }

    /* --- walls outside: graffiti, soot over the openings (burnt) --- */
    const outerFace = (w, s, u, y) => {
      // the outermost broad surface of this wall at (u, y): returns its coordinate along the normal
      const lo = w.fx - 0.3,
        hi = w.fx + 1.2;
      let best = null;
      const r = w.ax
        ? Q.near(u - 0.5, u + 0.5, w.fx - 1.5, w.fx + 1.5)
        : Q.near(w.fx - 1.5, w.fx + 1.5, u - 0.5, u + 0.5);
      for (const i of r) {
        const p = parts[i],
          b = p.b;
        if (p.gone || b.min.y > y - 0.6 || b.max.y < y + 0.6) continue;
        const u0 = w.ax ? b.min.x : b.min.z,
          u1 = w.ax ? b.max.x : b.max.z,
          n0 = w.ax ? b.min.z : b.min.x,
          n1 = w.ax ? b.max.z : b.max.x;
        if (u0 > u - 1.0 || u1 < u + 1.0) continue;
        const f = s > 0 ? n1 : n0,
          d = (f - w.fx) * s;
        if (d < -0.3 || d > 1.2 || (s > 0 ? n0 : n1) * s > (w.fx + s * 1.3) * s) continue;
        if (best === null || (f - best) * s > 0) best = f;
      }
      return best;
    };
    if (fp) {
      const outer = P.walls
        .map(w => {
          const ed = w.ax ? [fp[2], fp[3]] : [fp[0], fp[1]];
          const s = Math.abs(w.fx - ed[0]) < 0.6 ? -1 : Math.abs(w.fx - ed[1]) < 0.6 ? 1 : 0;
          return s && w.a1 - w.a0 > 3 ? {w, s} : null;
        })
        .filter(Boolean);
      const nt = outer.length ? (ruined ? 2 + Math.floor(rnd() * 3) : 1 + Math.floor(rnd() * 3)) : 0;
      for (let i = 0, t = 0; i < nt && t < 30; t++) {
        const {w, s} = pick(outer),
          gw = R(1.6, 2.6),
          gh = gw * 0.5,
          u = R(w.a0 + gw / 2 + 0.3, w.a1 - gw / 2 - 0.3),
          y = (w.y || 0) + R(0.8, 1.7);
        if (w.ops.some(p => Math.abs(p.c - u) < gw / 2 + 0.9)) continue;
        const f = outerFace(w, s, u, y);
        if (f === null) continue;
        const nrm = f + s * (0.005 + i * 0.001);
        wallDecal(tagMat(Math.floor(rnd() * TAGS.length)), gw, gh, w.ax ? u : nrm, y, w.ax ? nrm : u, w.ax, s, add);
        st.tags++;
        i++;
      }
      if (burnt)
        for (const {w, s} of outer)
          for (const p of w.ops) {
            if (p.k !== 'w' && p.k !== 'd') continue;
            if (rnd() < 0.1) continue;
            const y = (w.y || 0) + (p.k === 'w' ? 3.3 : 3.1),
              f = outerFace(w, s, p.c, y - 0.2);
            if (f === null) continue;
            wallDecal(ART.sootv(), 1.8, 1.6, w.ax ? p.c : f + s * 0.006, y, w.ax ? f + s * 0.006 : p.c, w.ax, s, add);
          }
    }

    /* --- windows boarded up (the window stays solid) --- */
    const boarded = [];
    if (opt.wins && fp) {
      const plank = K.mat(0x8a6a44, 0.85),
        plank2 = K.mat(0x6e5232, 0.9);
      opt.wins.forEach((wn, i) => {
        if (rnd() > (ruined ? 0.06 : 0.32)) return;
        const ax = wn.ax,
          c = ax ? wn.l.x : wn.l.z,
          fx = ax ? wn.l.z : wn.l.x,
          ed = ax ? [fp[2], fp[3]] : [fp[0], fp[1]],
          s = Math.abs(fx - ed[1]) < Math.abs(fx - ed[0]) ? 1 : -1,
          y0 = wn.l.y;
        const w = {ax, fx, a0: c - 2, a1: c + 2};
        let f = null;
        for (const u of [c - 0.95, c + 0.95]) {
          const q = outerFace(w, s, u, y0 + 1.0);
          if (q !== null && (f === null || (q - f) * s > 0)) f = q;
        }
        if (f === null) f = fx + s * 0.15;
        const n = f + s * 0.035;
        if (
          (ax ? n : n) + s * 0.05 > P.lot[ax ? 3 : 1] ||
          n + s * 0.05 < P.lot[ax ? 2 : 0] ||
          c - 1.0 < P.lot[ax ? 0 : 2] ||
          c + 1.0 > P.lot[ax ? 1 : 3]
        )
          return;
        for (let k = 0; k < 4; k++) {
          const y = y0 + 0.25 + k * 0.45 + R(-0.06, 0.06),
            t = R(-0.12, 0.12);
          bx(
            ax ? 1.95 : 0.025,
            0.17,
            ax ? 0.025 : 1.95,
            k % 2 ? plank2 : plank,
            [ax ? c : n + s * k * 0.004, y, ax ? n + s * k * 0.004 : c],
            ax ? [0, 0, t] : [t, 0, 0],
            add
          );
        }
        boarded.push(i);
        st.boards++;
      });
    }

    /* --- weeds outside when ruined --- */
    if (ruined && fp) {
      const wm = ART.weed();
      for (let i = 0, t = 0; i < 22 && t < 120; t++) {
        const side = Math.floor(rnd() * 4),
          x = side < 2 ? R(fp[0] - 0.3, fp[1] + 0.3) : side === 2 ? fp[0] - R(0.25, 0.7) : fp[1] + R(0.25, 0.7),
          z = side >= 2 ? R(fp[2] - 0.3, fp[3] + 0.3) : side === 0 ? fp[2] - R(0.25, 0.7) : fp[3] + R(0.25, 0.7);
        if (x < P.lot[0] + 0.5 || x > P.lot[1] - 0.5 || z < P.lot[2] + 0.5 || z > P.lot[3] - 0.5) continue;
        if (hitZone(Z, x - 0.3, x + 0.3, z - 0.3, z + 0.3)) continue;
        const fy = Q.floor(x, z);
        if (Q.busy(x - 0.2, x + 0.2, z - 0.2, z + 0.2, fy + 0.03, fy + 0.6)) continue;
        const h = R(0.3, 0.6),
          a = R(0, 3.1);
        for (const r of [a, a + PI / 2])
          add.push({
            geo: K.planeGeo(h * 1.2, h),
            mat: wm,
            m: new T.Matrix4().compose(
              new T.Vector3(x, fy + h / 2, z),
              new T.Quaternion().setFromEuler(new T.Euler(0, r, 0)),
              new T.Vector3(1, 1, 1)
            )
          });
        st.weeds++;
        i++;
      }
    }
    return {items: out ? out.filter(Boolean) : null, add, holes, boarded, burnt, st};
  }
  // weed planes are seen from both sides
  {
    const w = ART.weed();
    w.side = T.DoubleSide;
  }

  /* ===================== applying a condition to a built building ===================== */
  const inv4 = new T.Matrix4();
  function localBox(B, wb) {
    B.g.updateMatrixWorld(true);
    inv4.copy(B.g.matrixWorld).invert();
    return wb.clone().applyMatrix4(inv4);
  }
  // parts of the building in its own frame: the merged decor's source parts, plus plain meshes (core walls, furniture)
  function gatherParts(B, decs) {
    const parts = [];
    let src = null;
    const ident = D => D.position.lengthSq() < 1e-8 && D.quaternion.w > 0.99999 && Math.abs(D.scale.x - 1) < 1e-6;
    let mainD = null;
    for (const D of decs) {
      const R = D.children.length && D.children[0].geometry && D.children[0].geometry.userData.mfzSrc;
      if (R && R.items && ident(D) && (!src || R.items.length > src.items.length)) ((src = R), (mainD = D));
    }
    if (src) {
      if (!src.__ab) src.__ab = src.items.map(boxOfItem);
      src.items.forEach((it, k) => parts.push({b: src.__ab[k], it: 1, k}));
    }
    B.g.updateMatrixWorld(true);
    inv4.copy(B.g.matrixWorld).invert();
    const skip = new Set(mainD ? [mainD] : []); // other decor (yard modules) counts as plain meshes
    const walk = o => {
      if (skip.has(o) || (o.userData && (o.userData.kind === 'door' || o.userData.kind === 'loot'))) return;
      if (o.isMesh && o.geometry) {
        if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
        const m = new T.Matrix4().multiplyMatrices(inv4, o.matrixWorld);
        parts.push({b: o.geometry.boundingBox.clone().applyMatrix4(m), core: o});
      }
      for (const c of o.children) walk(c);
    };
    for (const c of B.g.children) walk(c);
    return {parts, src};
  }

  C.apply = function (B, t, lv, ctx) {
    CUR_ID = t && t.id;
    if (!B || !B.g || !lv) return;
    const P = plan(B),
      decs = B.g.children.filter(c => c.userData && c.userData.kind === 'bdecor');
    const {parts, src} = gatherParts(B, decs);
    const wins = winList.slice(ctx.w0).filter(w => w.g === B.g);
    // collision boxes of this building, building-local (so moved furniture never leaves its collision behind)
    const cols = solids.slice(ctx.s0).map(s => {
      const b = localBox(B, s);
      return [b.min.x, b.min.y, b.min.z, b.max.x, b.max.y, b.max.z];
    });
    let V;
    if (src) {
      // the decor copy is made once per building type and level
      const cache = src.__var || (src.__var = {});
      if (!cache[lv]) {
        const v = makeVariant(src, parts, P, lv, K.rng(src.name + '|cond' + lv), {cols, wins});
        v.merged = K.merge(src.name + '_c' + lv, v.items.concat(v.add));
        for (const q of v.merged.meshes) q.g.userData.mfzVar = v; // what it was made from (dev checks)
        cache[lv] = v;
      }
      V = cache[lv];
      const main = decs.find(D => D.children.length && D.children[0].geometry.userData.mfzSrc === src);
      if (main) {
        // materials the layer swapped in on this copy (half-plot houses repaint slot materials per house) carry over
        const remap = new Map();
        for (const m of main.children) {
          const q = src.meshes.find(q => q.g === m.geometry);
          if (q && q.mat !== m.material) remap.set(q.mat, m.material);
        }
        const matFor = mt => {
          if (remap.has(mt)) return remap.get(mt);
          const w = WB.get(mt);
          if (w && remap.has(w.m)) return wornMat(remap.get(w.m), w.f, w.off, w.ds);
          return mt;
        };
        for (const m of main.children.slice()) main.remove(m);
        for (const q of V.merged.meshes) {
          const m = new T.Mesh(q.g, matFor(q.mat));
          m.castShadow = !q.mat.transparent;
          m.receiveShadow = true;
          main.add(m);
        }
      }
    } else {
      V = makeVariant(null, parts, P, lv, K.rng((t && t.id) + '|cond' + lv + '|' + Math.random()), {cols, wins});
      if (V.add.length) {
        const M = K.merge('cond_' + (t && t.id), V.add),
          D = new T.Object3D();
        D.userData.kind = 'bdecor';
        D.userData.cond = V;
        for (const q of M.meshes) {
          const m = new T.Mesh(q.g, q.mat);
          m.receiveShadow = true;
          m.castShadow = !q.mat.transparent;
          D.add(m);
        }
        B.g.add(D);
      }
    }
    B.g.updateMatrixWorld(true);
    // burnt: the plain meshes char too (inner walls, door leaves, frames; all of a core-built building), the yard only grimy
    if (lv >= 2) {
      const cm = new Map(),
        skipD = new Set(
          decs.filter(D => D.children.length && (D.children[0].geometry.userData.mfzVar || D.userData.cond))
        );
      for (const D of B.g.children) if (D.userData && D.userData.cond) skipD.add(D);
      const inv = new T.Matrix4().copy(B.g.matrixWorld).invert(),
        v = new T.Vector3();
      const walk = o => {
        if (skipD.has(o) || (o.userData && (o.userData.kind === 'loot' || o.userData.kind === 'zombie'))) return;
        if (o.isMesh && o.material && o.material.color && !o.material.transparent) {
          o.geometry.boundingBox || o.geometry.computeBoundingBox();
          const bb = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld).applyMatrix4(inv);
          bb.getCenter(v);
          const e = bb.max.y > (B.y || 0) + 1.0 && bb.max.y - bb.min.y > 0.15 ? 3.2 : 0.8; // canopies, piers, awnings char too
          const inside =
            !P.fp ||
            (bb.max.y - bb.min.y < 0.15
              ? bb.min.x > P.fp[0] - 0.8 &&
                bb.max.x < P.fp[1] + 0.8 &&
                bb.min.z > P.fp[2] - 0.8 &&
                bb.max.z < P.fp[3] + 0.8
              : v.x > P.fp[0] - e && v.x < P.fp[1] + e && v.z > P.fp[2] - e && v.z < P.fp[3] + e);
          const key = o.material.uuid + (inside ? 'c' : 'g');
          let m = cm.get(key);
          if (!m) {
            m = o.material.clone();
            if (custom(o.material)) {
              m.onBeforeCompile = o.material.onBeforeCompile;
              m.customProgramCacheKey = o.material.customProgramCacheKey;
              m.defines = Object.assign({}, o.material.defines);
              m.userData = Object.assign({}, o.material.userData);
            }
            m.color.setHex(
              scl(o.material.color.getHex(), inside ? (o.material.map ? 0.14 : 0.26) : 0.86, inside ? 0.72 : 0.15)
            );
            if (inside && 'roughness' in m) ((m.roughness = 1), (m.metalness = 0));
            if (m.emissive) (m.emissive.setHex(0), (m.emissiveIntensity = 0));
            cm.set(key, m);
          }
          o.material = m;
        }
        for (const c of o.children) walk(c);
      };
      for (const c of B.g.children) walk(c);
    }
    // roof holes: open the roof collision over them
    if (V.holes.length) {
      const mine = solids.slice(ctx.s0);
      for (const H of V.holes) {
        const a = new T.Vector3(H[0], 0, H[2]).applyMatrix4(B.g.matrixWorld),
          c = new T.Vector3(H[1], 0, H[3]).applyMatrix4(B.g.matrixWorld),
          hx0 = Math.min(a.x, c.x),
          hx1 = Math.max(a.x, c.x),
          hz0 = Math.min(a.z, c.z),
          hz1 = Math.max(a.z, c.z);
        for (const s of mine) {
          if (s.min.y < (B.y || 0) + 2.0 || s.max.y - s.min.y > 0.9) continue;
          if (s.max.x <= hx0 || s.min.x >= hx1 || s.max.z <= hz0 || s.min.z >= hz1) continue;
          const i = solids.indexOf(s);
          if (i < 0) continue;
          solids.splice(i, 1);
          const piece = (x0, x1, z0, z1) => {
            if (x1 - x0 > 0.05 && z1 - z0 > 0.05)
              solids.push(new T.Box3(new T.Vector3(x0, s.min.y, z0), new T.Vector3(x1, s.max.y, z1)));
          };
          piece(s.min.x, Math.max(s.min.x, hx0), s.min.z, s.max.z);
          piece(Math.min(s.max.x, hx1), s.max.x, s.min.z, s.max.z);
          piece(Math.max(s.min.x, hx0), Math.min(s.max.x, hx1), s.min.z, Math.max(s.min.z, hz0));
          piece(Math.max(s.min.x, hx0), Math.min(s.max.x, hx1), Math.min(s.max.z, hz1), s.max.z);
        }
      }
    }
    // boarded windows stay shut
    for (const i of V.boarded) {
      const w = wins[i];
      if (w && w.box && solids.indexOf(w.box) < 0) solids.push(w.box);
    }
    if (lv >= 2 && src) {
      // ruined: more doors ripped off, most loot gone, two more zombies
      const ds = doors.slice(ctx.d0).filter(d => !d.keep && d.p && d.p.parent === B.g);
      for (const d of ds) {
        if (Math.random() > 0.55) continue;
        for (const s of [d.sol, d.solO]) {
          const k = s ? solids.indexOf(s) : -1;
          if (k >= 0) solids.splice(k, 1);
        }
        if (d.pair && d.pair.pair === d) d.pair.pair = null;
        if (d.p.parent) d.p.parent.remove(d.p);
        const k = doors.indexOf(d);
        if (k >= 0) doors.splice(k, 1);
      }
      for (const k of scene.children.slice(ctx.n0)) {
        const ct = k.userData && k.userData.kind === 'loot' && k.userData.cont;
        if (!ct || !ct.inv) continue;
        lootRuin(ct, 0.6);
        if (Math.random() < 0.5) lootRuin(ct, 1);
        try {
          refreshContainerVisual(ct);
        } catch (e) {}
      }
      if (P.fp)
        for (let i = 0, tr = 0; i < 2 && tr < 30; tr++) {
          const lx = P.fp[0] + 1 + Math.random() * (P.fp[1] - P.fp[0] - 2),
            lz = P.fp[2] + 1 + Math.random() * (P.fp[3] - P.fp[2] - 2),
            p = new T.Vector3(lx, (B.y || 0) + 1, lz).applyMatrix4(B.g.matrixWorld);
          if (solids.some(s => s.containsPoint(p))) continue;
          try {
            zombie(p.x, p.z);
          } catch (e) {}
          i++;
        }
    }
    C.last = {
      id: t && t.id,
      lv,
      cached: !!src,
      st: V.st,
      burnt: V.burnt,
      holes: V.holes.length,
      boarded: V.boarded.length
    };
    return C.last;
  };

  /* v090: real (flora) trees and bushes planted by a ruined lot: trees lose their leaves and the bark chars, bushes go black.
     The flora layer draws them later from spec (dead / burnt); with flora off the plain models are stripped / blackened here. */
  function burnFlora(n0) {
    if (typeof treeList === 'undefined') return;
    const mine = new Set(scene.children.slice(n0));
    const black = K.mat(0x0b0b09, 1, 0);
    for (const t of treeList) {
      if (!t || !t.g || !mine.has(t.g)) continue;
      const sp = t.g.userData && t.g.userData.spec;
      if (sp) {
        if (sp.k === 'tree') sp.dead = 1;
        sp.burnt = 1;
      } else {
        const ico = t.g.children.filter(c => c.geometry && c.geometry.type === 'IcosahedronGeometry');
        if (t.tb) ico.forEach(c => t.g.remove(c));
        else ico.forEach(c => (c.material = black));
        t.g.traverse(c => {
          if (c.isMesh && c.material && c.material !== black && c.material.color) {
            c.material = c.material.clone();
            c.material.color.setHex(0x1a1612);
          }
        });
      }
    }
  }
  C.burnFlora = burnFlora;

  /* ===================== hook: the outermost ruin() ===================== */
  function install() {
    if (typeof ruin !== 'function' || C.installed) return;
    C.installed = 1;
    const prev = ruin;
    ruin = function (x, z, t, lv, n0, s0, w0, d0) {
      const B =
        typeof LASTB !== 'undefined' && LASTB && LASTB.g && scene.children.indexOf(LASTB.g) >= n0 ? LASTB : null;
      const dec = B && B.g.children.some(c => c.userData && c.userData.kind === 'bdecor');
      const a = Array.prototype.slice.call(arguments);
      if (dec && lv > 1) a[3] = 1; // the core can't knock down skinned walls: this kit does the ruin
      const r = prev.apply(this, a);
      if (lv >= 2) burnFlora(n0);
      try {
        if (B) C.apply(B, t, lv, {n0, s0, w0, d0});
      } catch (e) {
        console.error('[condkit]', t && t.id, e);
      }
      return r;
    };
    ruin.__cond = 1;
    // lot layers' own caps (ruinMax) still apply inside; they no longer hide the ruined look
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
  C.install = install;
  console.log('[condkit] ready');
})();
