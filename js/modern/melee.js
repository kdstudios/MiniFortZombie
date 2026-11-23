/* ==========================================================================================================
   MINI FORT ZOMBIE - DETAILED MELEE WEAPONS (v062)
   Replaces the icon-extruded melee models (core modelFor) with true-scale procedural models in the Modern gun style
   (lathed / extruded / tubed parts, PBR steel, painted metal, wood with grain, rubber, leather, brass; gun environment reflections).

   ORIENTATION CONTRACT (kept from MFZ 047-061, so every existing pose keeps working):
     - origin = the centre of the main hand on the handle (the grip point)
     - the weapon's long axis is +Y, the striking end / tip up (+Y)
     - the flat of a blade / axe head / shovel lies in the XY plane, thickness along Z
     - the cutting edge / striking face points to -X
   First person (core vmEnsure / animVM): the weapon group sits at [.30,-.32,-.50] in camera space, rotation x -.55, z -.12, scale .85,
   and the model inside is turned y -1.35 (so -X, the edge, faces forward / away from the player); swings move it along -Z.
   Zombies / survivors (skills.js fzHold, core survivor holds): the model hangs from the forearm at y = hand, rotated (PI/2+.45, PI/2, 0) XYZ
   (v069: the PI/2 spin about the handle turns the edge (-X) to face forward / down the swing instead of sideways).
   ========================================================================================================== */
(function () {
  'use strict';
  const T = THREE,
    V2 = (x, y) => new T.Vector2(x, y),
    V3 = (x, y, z) => new T.Vector3(x, y, z),
    PI = Math.PI;
  /* ---------------- materials (shared; zombies clone them for hit flashes) ---------------- */
  let ENV = null;
  function env() {
    if (ENV) return ENV;
    try {
      if (window.RGX && RGX.vm && RGX.vm.env) ENV = RGX.vm.env;
    } catch (e) {}
    return ENV;
  } // the gun viewmodel's PMREM (made on the first frame)
  function grainTex(base, dark, w = 64, h = 256, n = 70) {
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    const c = cv.getContext('2d');
    c.fillStyle = base;
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < n; i++) {
      const x = Math.random() * w,
        a = Math.random() * 0.25 + 0.05;
      c.strokeStyle = dark;
      c.globalAlpha = a;
      c.lineWidth = Math.random() * 1.6 + 0.4;
      c.beginPath();
      c.moveTo(x, 0);
      for (let y = 0; y <= h; y += 16) c.lineTo(x + Math.sin(y * 0.05 + i) * 1.5, y);
      c.stroke();
    }
    c.globalAlpha = 1;
    const t = new T.CanvasTexture(cv);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    return t;
  }
  const MATS = {};
  function M(k) {
    if (MATS[k]) return MATS[k];
    const S = o => new T.MeshStandardMaterial(Object.assign({envMapIntensity: 1}, o));
    let m;
    switch (k) {
      case 'steel':
        m = S({color: 0xccd2d8, metalness: 0.38, roughness: 0.4, envMapIntensity: 1.0});
        break;
      case 'edge':
        m = S({color: 0xd8dde2, metalness: 0.75, roughness: 0.3, envMapIntensity: 1.15});
        break;
      case 'dark':
        m = S({color: 0x2c2f33, metalness: 0.75, roughness: 0.48});
        break;
      case 'iron':
        m = S({color: 0x23201e, metalness: 0.7, roughness: 0.6});
        break;
      case 'brass':
        m = S({color: 0xb58f3e, metalness: 1, roughness: 0.3});
        break;
      case 'red':
        m = S({color: 0xb0170f, metalness: 0.25, roughness: 0.42});
        break;
      case 'green':
        m = S({color: 0x2f4a2c, metalness: 0.3, roughness: 0.5});
        break;
      case 'yellow':
        m = S({color: 0xe0b41a, metalness: 0.05, roughness: 0.38});
        break;
      case 'rubber':
        m = S({color: 0x151515, metalness: 0, roughness: 0.92});
        break;
      case 'tape':
        m = S({color: 0x1c1c1e, metalness: 0, roughness: 0.75});
        break;
      case 'poly':
        m = S({color: 0x1d1e20, metalness: 0.05, roughness: 0.62});
        break;
      case 'leather':
        m = S({color: 0x5a3a22, metalness: 0, roughness: 0.72});
        break;
      case 'ito':
        m = S({color: 0x1a1c2c, metalness: 0, roughness: 0.8});
        break;
      case 'same':
        m = S({color: 0xe6e2d4, metalness: 0, roughness: 0.6});
        break;
      case 'ash':
        m = S({color: 0xffffff, map: grainTex('#d4ab6e', '#7a5530'), metalness: 0, roughness: 0.55});
        break;
      case 'hickory':
        m = S({color: 0xffffff, map: grainTex('#a8763e', '#4a2c12'), metalness: 0, roughness: 0.6});
        break;
      case 'oak':
        m = S({color: 0xffffff, map: grainTex('#8a5a32', '#3a2410'), metalness: 0, roughness: 0.62});
        break;
    }
    m.envMap = null;
    m.envMapIntensity = 0;
    m.metalness = Math.min(m.metalness, 0.12);
    m.roughness = Math.max(m.roughness, k === 'edge' ? 0.55 : 0.62);
    if (k === 'edge') m.color.set(0xb8bcc0);
    if (k === 'steel') m.color.set(0x9ea3a8); // v065: matte, no reflections (the shine stood out)
    return (MATS[k] = m);
  }
  /* ---------------- geometry helpers ---------------- */
  function add(g, geo, mat, p, r, s) {
    const m = new T.Mesh(geo, typeof mat === 'string' ? M(mat) : mat);
    if (p) m.position.set(p[0], p[1], p[2]);
    if (r) m.rotation.set(r[0], r[1], r[2]);
    if (s) m.scale.set(s[0], s[1], s[2]);
    m.castShadow = true;
    g.add(m);
    return m;
  }
  const lathe = (pts, seg = 20) =>
    new T.LatheGeometry(
      pts.map(p => V2(p[0], p[1])),
      seg
    );
  function ext(pts, depth, bev, curve) {
    const sh = new T.Shape();
    sh.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) sh.lineTo(pts[i][0], pts[i][1]);
    sh.closePath();
    const b = bev || 0,
      g = new T.ExtrudeGeometry(sh, {
        depth: Math.max(0.0002, depth - 2 * b),
        bevelEnabled: b > 0,
        bevelThickness: b,
        bevelSize: b,
        bevelSegments: 2,
        curveSegments: curve || 6,
        steps: 1
      });
    g.translate(0, 0, -(depth - 2 * b) / 2);
    g.computeVertexNormals();
    return g;
  }
  function tube(pts, r, radial = 8, seg = 40, closed = false) {
    return new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p => V3(p[0], p[1], p[2] || 0))), seg, r, radial, closed);
  }
  const cyl = (r0, r1, h, s = 16) => new T.CylinderGeometry(r0, r1, h, s);
  const box = (w, h, d) => new T.BoxGeometry(w, h, d);
  const ball = (r, s = 14) => new T.SphereGeometry(r, s, Math.max(6, s >> 1));
  const tor = (R, t, arc = PI * 2, rs = 8, ts = 24) => new T.TorusGeometry(R, t, rs, ts, arc);
  /* polyline along a param function, used for blade outlines */
  const samp = (f, a, b, n) => {
    const o = [];
    for (let i = 0; i <= n; i++) o.push(f(a + ((b - a) * i) / n));
    return o;
  };
  /* ---------------- models ---------------- */
  const B = {};
  B.baseball_bat = g => {
    const P = [
      [0.0005, -0.088],
      [0.02, -0.086],
      [0.025, -0.08],
      [0.024, -0.071],
      [0.016, -0.064],
      [0.0128, -0.055],
      [0.0128, 0.12],
      [0.0138, 0.24],
      [0.0175, 0.36],
      [0.024, 0.46],
      [0.029, 0.55],
      [0.032, 0.64],
      [0.0335, 0.72],
      [0.033, 0.752],
      [0.026, 0.758],
      [0.016, 0.756],
      [0.0005, 0.75]
    ];
    add(g, lathe(P, 24), 'ash');
    add(
      g,
      lathe(
        [
          [0.0141, -0.058],
          [0.0141, 0.17],
          [0.0135, 0.175]
        ],
        20
      ),
      'tape'
    );
    for (let i = 0; i < 8; i++)
      add(g, tor(0.0142, 0.0012, PI * 2, 4, 20), 'rubber', [0, -0.05 + i * 0.028, 0], [PI / 2 + 0.28, 0, 0]);
    add(g, cyl(0.02, 0.02, 0.004, 20), 'tape', [0, -0.083, 0]);
    add(g, box(0.0005, 0.05, 0.018), 'iron', [-0.0295, 0.53, 0], [0, 0, 0.07]); // burned-in brand mark
  };
  B.crowbar = g => {
    const pts = [
      [0, -0.13],
      [0, 0.2],
      [0, 0.5],
      [-0.006, 0.55],
      [-0.03, 0.59],
      [-0.065, 0.603],
      [-0.098, 0.588],
      [-0.115, 0.556],
      [-0.118, 0.525]
    ];
    add(g, tube(pts, 0.0105, 6, 64), 'red');
    add(
      g,
      ext(
        [
          [-0.0035, 0],
          [0.0035, 0],
          [0.008, -0.045],
          [-0.008, -0.045]
        ],
        0.017,
        0.002
      ),
      'steel',
      [-0.118, 0.528, 0],
      [0, 0, 0.15]
    ); // claw neck
    for (const s of [-1, 1])
      add(
        g,
        ext(
          [
            [-0.003, 0],
            [0.003, 0],
            [0.0015, -0.03],
            [-0.0015, -0.03]
          ],
          0.006,
          0.0008
        ),
        'steel',
        [-0.119 + s * 0.0, 0.484, s * 0.0055],
        [0, 0, 0.15]
      );
    add(
      g,
      ext(
        [
          [-0.008, 0.0],
          [0.008, 0.0],
          [0.011, -0.05],
          [-0.011, -0.058]
        ],
        0.012,
        0.002
      ),
      'steel',
      [0, -0.13, 0],
      [0, 0, -0.22]
    ); // chisel end
    for (let i = 0; i < 3; i++)
      add(g, tor(0.0108, 0.0009, PI * 2, 4, 6), 'dark', [0, 0.05 + i * 0.02, 0], [PI / 2, 0, 0]); // knurl rings
  };
  B.machete = g => {
    const spine = y => 0.014 + 0.003 * Math.sin(((y - 0.08) / 0.44) * PI),
      edge = y => -0.028 - 0.022 * Math.pow((y - 0.08) / 0.4, 1.4);
    const out = [[0.013, 0.078]]
      .concat(samp(y => [spine(y), y], 0.09, 0.44, 14))
      .concat([
        [0.012, 0.49],
        [0.0, 0.515],
        [-0.018, 0.52],
        [-0.036, 0.508],
        [-0.048, 0.485]
      ])
      .concat(samp(y => [edge(y), y], 0.47, 0.09, 16))
      .concat([[-0.026, 0.078]]);
    add(g, ext(out, 0.0024, 0.0007, 12), 'steel');
    const eo = samp(y => [edge(y), y], 0.1, 0.47, 16),
      ei = samp(y => [edge(y) + 0.009, y], 0.47, 0.1, 16);
    add(
      g,
      ext(
        eo
          .concat([
            [-0.036, 0.508],
            [-0.026, 0.5]
          ])
          .concat(ei),
        0.003,
        0
      ),
      'edge'
    );
    const H = [
      [-0.016, -0.08],
      [0.012, -0.08],
      [0.017, -0.065],
      [0.015, -0.03],
      [0.018, 0.0],
      [0.015, 0.03],
      [0.017, 0.06],
      [0.019, 0.074],
      [-0.03, 0.074],
      [-0.026, 0.06],
      [-0.022, 0.04],
      [-0.026, 0.02],
      [-0.022, 0],
      [-0.026, -0.02],
      [-0.022, -0.04],
      [-0.02, -0.065]
    ];
    add(g, ext(H, 0.024, 0.007), 'poly');
    add(
      g,
      ext(
        [
          [-0.034, 0.072],
          [0.022, 0.072],
          [0.022, 0.082],
          [-0.034, 0.082]
        ],
        0.026,
        0.003
      ),
      'poly'
    ); // guard lip
    for (const y of [-0.045, 0, 0.045]) add(g, cyl(0.0045, 0.0045, 0.026, 10), 'brass', [-0.004, y, 0], [PI / 2, 0, 0]);
    add(g, tor(0.007, 0.002), 'dark', [-0.002, -0.07, 0], [0, 0, 0]);
  };
  B.katana = g => {
    const L = 0.7,
      y0 = 0.165,
      sori = 0.024,
      cx = t => sori * t * t; // spine curves back (+X)
    const wid = t => 0.031 - 0.006 * t,
      tipT = 0.92;
    const sp = samp(t => [cx(t) + 0.004, y0 + L * t], 0, tipT, 24),
      ed = samp(t => [cx(t) + 0.004 - wid(t), y0 + L * t], tipT, 0, 24);
    const kissaki = [
      [cx(0.96) + 0.003, y0 + L * 0.96],
      [cx(1) - 0.004, y0 + L],
      [cx(0.985) - 0.016, y0 + L * 0.985],
      [cx(tipT) - 0.022, y0 + L * tipT + 0.004]
    ];
    add(g, ext(sp.concat(kissaki).concat(ed), 0.0058, 0.0016, 10), 'steel');
    const ham = samp(t => [cx(t) + 0.004 - wid(t) * 0.55 + 0.003 * Math.sin(t * 40), y0 + L * t], 0, tipT, 48);
    add(
      g,
      ext(
        ed
          .slice()
          .reverse()
          .concat([
            [cx(tipT) - 0.022, y0 + L * tipT + 0.004],
            [cx(0.985) - 0.016, y0 + L * 0.985]
          ])
          .concat(ham.slice().reverse()),
        0.0064,
        0,
        8
      ),
      'edge'
    ); // hamon
    add(
      g,
      ext(
        [
          [-0.03, 0.135],
          [0.008, 0.135],
          [0.007, 0.168],
          [-0.026, 0.168]
        ],
        0.011,
        0.002
      ),
      'brass'
    ); // habaki
    add(g, cyl(0.04, 0.04, 0.007, 28), 'iron', [-0.008, 0.128, 0], [0, 0, 0], [1.08, 1, 0.9]); // tsuba
    add(g, tor(0.04, 0.0025, PI * 2, 6, 28), 'brass', [-0.008, 0.128, 0], [PI / 2, 0, 0], [1.08, 0.9, 1]);
    for (const a of [0, PI / 2, PI, PI * 1.5])
      add(g, cyl(0.005, 0.005, 0.008, 10), 'dark', [-0.008 + Math.cos(a) * 0.024, 0.128, Math.sin(a) * 0.02]);
    add(g, cyl(0.019, 0.019, 0.014, 20), 'brass', [-0.008, 0.114, 0], [0, 0, 0], [1.1, 1, 0.85]); // fuchi
    add(g, cyl(0.0165, 0.0175, 0.24, 18), 'same', [-0.008, -0.012, 0], [0, 0, 0], [1.12, 1, 0.82]); // tsuka core (ray skin)
    for (let i = 0; i < 8; i++) {
      const y = -0.115 + i * 0.029;
      for (const z of [-0.0146, 0.0146])
        for (const s of [-1, 1]) add(g, box(0.03, 0.0075, 0.003), 'ito', [-0.008, y, z], [0, 0, s * 0.62]);
    }
    add(g, cyl(0.0185, 0.017, 0.02, 18), 'iron', [-0.008, -0.142, 0], [0, 0, 0], [1.12, 1, 0.85]); // kashira
    for (const s of [-1, 1]) add(g, box(0.012, 0.02, 0.003), 'brass', [-0.008, 0.0, s * 0.0155]); // menuki
  };
  B.broadsword = g => {
    const y0 = 0.105,
      L = 0.79,
      w = t => 0.026 - 0.007 * t;
    const R = samp(t => [w(t), y0 + L * t], 0, 0.9, 10),
      Lf = samp(t => [-w(t), y0 + L * t], 0.9, 0, 10);
    add(g, ext(R.concat([[0, y0 + L]]).concat(Lf), 0.0058, 0.0014), 'steel');
    add(
      g,
      ext(
        [
          [-0.0055, y0 + 0.03],
          [0.0055, y0 + 0.03],
          [0.004, y0 + L * 0.62],
          [0, y0 + L * 0.66],
          [-0.004, y0 + L * 0.62]
        ],
        0.0064,
        0
      ),
      'dark'
    ); // fuller
    for (const s of [-1, 1]) {
      const e = samp(t => [s * w(t), y0 + L * t], 0.02, 0.9, 10),
        i = samp(t => [s * (w(t) - 0.007), y0 + L * t], 0.9, 0.02, 10);
      add(g, ext(e.concat([[0, y0 + L]]).concat(i), 0.0062, 0), 'edge');
    }
    add(g, box(0.03, 0.03, 0.012), 'steel', [0, 0.098, 0]); // ricasso block
    add(
      g,
      tube(
        [
          [-0.105, 0.11],
          [-0.09, 0.098],
          [-0.03, 0.09],
          [0.03, 0.09],
          [0.09, 0.098],
          [0.105, 0.11]
        ],
        0.0085,
        10,
        30
      ),
      'dark'
    ); // crossguard
    for (const s of [-1, 1]) add(g, ball(0.012, 12), 'dark', [s * 0.108, 0.113, 0]);
    add(
      g,
      lathe(
        [
          [0.0155, -0.085],
          [0.017, -0.06],
          [0.0165, 0],
          [0.017, 0.06],
          [0.0155, 0.083]
        ],
        18
      ),
      'leather'
    );
    for (let i = 0; i < 10; i++)
      add(g, tor(0.0168, 0.0011, PI * 2, 4, 18), 'brass', [0, -0.07 + i * 0.016, 0], [PI / 2, 0, 0]);
    add(g, cyl(0.028, 0.028, 0.018, 24), 'dark', [0, -0.103, 0], [0, 0, PI / 2], [1, 1, 1]); // wheel pommel
    add(g, cyl(0.012, 0.012, 0.022, 14), 'brass', [0, -0.103, 0], [0, 0, PI / 2]);
  };
  B.fire_axe = g => {
    add(
      g,
      lathe(
        [
          [0.001, -0.265],
          [0.021, -0.262],
          [0.023, -0.24],
          [0.018, -0.2],
          [0.0165, 0.1],
          [0.016, 0.45],
          [0.015, 0.62],
          [0.001, 0.625]
        ],
        20
      ),
      'yellow',
      null,
      null,
      [1, 1, 0.72]
    );
    add(
      g,
      lathe(
        [
          [0.0185, -0.255],
          [0.0185, 0.03],
          [0.0175, 0.034]
        ],
        18
      ),
      'rubber',
      null,
      null,
      [1.04, 1, 0.76]
    );
    for (let i = 0; i < 9; i++)
      add(g, tor(0.0189, 0.0016, PI * 2, 4, 16), 'rubber', [0, -0.23 + i * 0.028, 0], [PI / 2, 0, 0], [1.04, 0.76, 1]);
    const head = [
      [0.02, 0.5],
      [0.02, 0.635],
      [-0.02, 0.64],
      [-0.06, 0.655],
      [-0.11, 0.69],
      [-0.155, 0.71],
      [-0.172, 0.66],
      [-0.176, 0.6],
      [-0.168, 0.54],
      [-0.15, 0.5],
      [-0.11, 0.515],
      [-0.06, 0.53],
      [-0.02, 0.51]
    ];
    add(g, ext(head, 0.024, 0.004), 'red', [0, 0, 0]);
    const bit = [
      [-0.155, 0.71],
      [-0.172, 0.66],
      [-0.176, 0.6],
      [-0.168, 0.54],
      [-0.15, 0.5],
      [-0.135, 0.507],
      [-0.15, 0.545],
      [-0.157, 0.6],
      [-0.153, 0.655],
      [-0.14, 0.698]
    ];
    add(g, ext(bit, 0.026, 0), 'edge');
    add(
      g,
      ext(
        [
          [0.02, 0.545],
          [0.02, 0.6],
          [0.075, 0.585],
          [0.135, 0.575],
          [0.075, 0.565]
        ],
        0.02,
        0.003
      ),
      'red'
    ); // pick
    add(
      g,
      ext(
        [
          [0.11, 0.578],
          [0.135, 0.575],
          [0.11, 0.571]
        ],
        0.021,
        0
      ),
      'edge'
    );
    add(g, cyl(0.019, 0.019, 0.004, 16), 'dark', [0, 0.641, 0], [0, 0, 0], [1, 1, 0.7]); // eye wedge
  };
  B.shovel = g => {
    add(
      g,
      lathe(
        [
          [0.001, -0.36],
          [0.017, -0.36],
          [0.0175, 0.5],
          [0.016, 0.56]
        ],
        18
      ),
      'ash'
    );
    add(
      g,
      lathe(
        [
          [0.0172, 0.5],
          [0.019, 0.52],
          [0.024, 0.64],
          [0.03, 0.68],
          [0.001, 0.69]
        ],
        18
      ),
      'dark'
    ); // socket
    for (let i = 0; i < 2; i++) add(g, cyl(0.0035, 0.0035, 0.05, 8), 'steel', [0, 0.54 + i * 0.04, 0], [PI / 2, 0, 0]);
    const out = [
      [-0.115, 0.68],
      [0.115, 0.68],
      [0.118, 0.75],
      [0.11, 0.84],
      [0.085, 0.92],
      [0.045, 0.975],
      [0, 0.995],
      [-0.045, 0.975],
      [-0.085, 0.92],
      [-0.11, 0.84],
      [-0.118, 0.75]
    ];
    const geo = ext(out, 0.0026, 0.0006, 10),
      p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i),
        y = p.getY(i);
      p.setZ(i, p.getZ(i) - 4.2 * x * x + 0.12 * (y - 0.68) * (y - 0.68));
    }
    geo.computeVertexNormals();
    add(g, geo, 'green');
    const tip = [
        [-0.06, 0.945],
        [0, 0.995],
        [0.06, 0.945],
        [0.045, 0.96],
        [0, 0.982],
        [-0.045, 0.96]
      ],
      tg = ext(tip, 0.003, 0),
      tp = tg.attributes.position;
    for (let i = 0; i < tp.count; i++) {
      const x = tp.getX(i),
        y = tp.getY(i);
      tp.setZ(i, tp.getZ(i) - 4.2 * x * x + 0.12 * (y - 0.68) * (y - 0.68));
    }
    tg.computeVertexNormals();
    add(g, tg, 'steel');
    for (const s of [-1, 1]) add(g, box(0.1, 0.006, 0.024), 'green', [s * 0.062, 0.684, -0.018], [0.3, 0, 0]); // treads
    add(
      g,
      tube(
        [
          [0, -0.36],
          [-0.04, -0.39],
          [-0.05, -0.46],
          [0, -0.475],
          [0.05, -0.46],
          [0.04, -0.39],
          [0, -0.36]
        ],
        0.008,
        8,
        40
      ),
      'dark'
    ); // D-grip
    add(g, cyl(0.012, 0.012, 0.08, 14), 'ash', [0, -0.455, 0], [0, 0, PI / 2]);
  };
  B.pitchfork = g => {
    add(
      g,
      lathe(
        [
          [0.001, -0.46],
          [0.0175, -0.455],
          [0.0175, 0.6],
          [0.016, 0.64]
        ],
        18
      ),
      'hickory'
    );
    add(
      g,
      lathe(
        [
          [0.0168, 0.6],
          [0.0185, 0.62],
          [0.021, 0.7],
          [0.012, 0.725],
          [0.001, 0.73]
        ],
        16
      ),
      'dark'
    );
    add(
      g,
      tube(
        [
          [-0.085, 0.77],
          [-0.055, 0.738],
          [0, 0.728],
          [0.055, 0.738],
          [0.085, 0.77]
        ],
        0.0075,
        8,
        30
      ),
      'dark'
    );
    for (const x of [-0.085, -0.028, 0.028, 0.085]) {
      const sx = x * 0.45;
      add(
        g,
        tube(
          [
            [x, 0.765],
            [x + sx * 0.25, 0.85],
            [x + sx * 0.3, 0.95],
            [x + sx * 0.3, 1.04]
          ].map(p => [p[0], p[1], -(p[1] - 0.76) * 0.12]),
          0.0052,
          7,
          24
        ),
        'steel'
      );
      add(g, cyl(0.0052, 0.0004, 0.04, 7), 'steel', [x + sx * 0.3, 1.06, -0.036], [-0.12, 0, 0]);
    }
    add(
      g,
      tube(
        [
          [0, 0.728],
          [0, 0.73]
        ],
        0.0001
      ),
      'dark'
    );
  };
  B.sickle = g => {
    add(
      g,
      lathe(
        [
          [0.001, -0.075],
          [0.016, -0.073],
          [0.017, -0.06],
          [0.0145, -0.02],
          [0.0155, 0.04],
          [0.0175, 0.07],
          [0.001, 0.08]
        ],
        18
      ),
      'oak'
    );
    add(
      g,
      lathe(
        [
          [0.0165, 0.066],
          [0.0172, 0.07],
          [0.0172, 0.09],
          [0.012, 0.096]
        ],
        16
      ),
      'dark'
    );
    const c = [-0.105, 0.14],
      a0 = -0.46,
      a1 = a0 + 3.25,
      R = 0.16,
      w = a => 0.03 * Math.pow(1 - (a - a0) / (a1 - a0), 0.8);
    const out = samp(a => [c[0] + Math.cos(a) * R, c[1] + Math.sin(a) * R], a0, a1, 30),
      inn = samp(a => [c[0] + Math.cos(a) * (R - w(a)), c[1] + Math.sin(a) * (R - w(a))], a1 - 0.02, a0, 30);
    add(g, ext(out.concat(inn), 0.0024, 0.0006, 10), 'steel');
    const e1 = samp(a => [c[0] + Math.cos(a) * (R - w(a)), c[1] + Math.sin(a) * (R - w(a))], a0 + 0.1, a1 - 0.04, 28),
      e2 = samp(
        a => [c[0] + Math.cos(a) * (R - w(a) + 0.006), c[1] + Math.sin(a) * (R - w(a) + 0.006)],
        a1 - 0.04,
        a0 + 0.1,
        28
      );
    add(g, ext(e1.concat(e2), 0.0029, 0), 'edge');
    add(
      g,
      ext(
        [
          [-0.006, 0.084],
          [0.012, 0.084],
          [0.008, 0.12],
          [-0.004, 0.12]
        ],
        0.008,
        0.002
      ),
      'steel'
    ); // tang neck
  };
  /* ---------------- hook into modelFor (cloneModel / viewmodel / zombie holds use it) ---------------- */
  const CACHE = {};
  function detailed(id) {
    if (CACHE[id]) return CACHE[id];
    const f = B[id];
    if (!f) return null;
    const g = new T.Group();
    f(g);
    g.userData.rgMelee = id;
    const bb = new T.Box3().setFromObject(g),
      T0 = {
        g,
        mz: [0, bb.max.y, 0],
        len: bb.max.y - bb.min.y,
        Wm: bb.max.x - bb.min.x,
        Hm: bb.max.y - bb.min.y,
        top: bb.max.y,
        detailed: true
      };
    return (CACHE[id] = T0);
  }
  const _mf = window.modelFor;
  window.modelFor = function (id) {
    const d = typeof WDEF !== 'undefined' && WDEF[id];
    if (d && d.type === 'melee' && B[id] && (!window.RGFX || RGFX.s.melee !== 0)) {
      try {
        const t = detailed(id);
        if (t) return t;
      } catch (e) {
        console.warn('[melee] model failed', id, e);
      }
    }
    return _mf.apply(this, arguments);
  };
  /* first person: the core pose keeps the edge forward (model y -1.35); turn the flat of the weapon ~25 deg more toward the eye so the blade reads
   instead of showing only its spine (view model only; zombies / survivors keep the core orientation) */
  const _av = window.animVM;
  window.animVM = function (dt) {
    const r = _av.apply(this, arguments);
    try {
      const v = VM.cur;
      if (v && v.m && v.m.userData.rgMelee && v.o.visible) v.m.rotation.y = -0.92;
    } catch (e) {}
    return r;
  };
  /* metals pick up the gun environment once it exists (first gun drawn) */
  /* v065: no environment reflections on melee weapons */
  window.RGMELEE = {B, M, detailed, CACHE};
  console.log('[melee] detailed melee models ready (' + Object.keys(B).length + ')');
})();
