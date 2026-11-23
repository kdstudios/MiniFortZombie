/* MINI FORT ZOMBIE - core 08/13: fortworld
   Melee reach/aim tests, the fort, barricades, clearWorld, buildWorld.
   Part of the old js/game/core.js (split in v080). Classic script: shares globals with the other core parts; load in numeric order. */
function zb(x, z) {
  const feet = pl.position.y - (G.eyeUsed || 1.6);
  return zombies.some(q => {
    const d = Math.hypot(q.position.x - x, q.position.z - z);
    if (!(d < 0.9 && d < Math.hypot(q.position.x - pl.position.x, q.position.z - pl.position.z))) return false;
    const zt = q.position.y + (q.userData && q.userData.crawl ? 0.6 : 1.75) * (q.scale.x || 1);
    return q.position.y < feet + 1.6 && zt > feet + 0.25;
  });
} // v072: a zombie only blocks you when your bodies overlap in height (not from on top of a wall)
/* v072: ONE melee reach test, shared by melee(), the red crosshair and the corpse-gib check, so the indicator is always the truth.
   Measured between bodies in 3D: the swing band (knee height to just over your eyes) against the zombie's body (feet to head). A zombie more
   than 0.6 m below that band (you are on top of a wall) or behind a wall is out of reach, however close it is on the map. Returns the distance or -1. */
function meleeReach(z, reach) {
  const u = z.userData;
  if (!u || u.hp <= 0) return -1;
  const fx = -Math.sin(yaw),
    fz = -Math.cos(yaw),
    feet = pl.position.y - (G.eyeUsed || 1.6);
  const dx = z.position.x - pl.position.x,
    dz = z.position.z - pl.position.z,
    h = Math.hypot(dx, dz);
  if (h > 1e-4 && h > 0.45 && (dx * fx + dz * fz) / h <= 0.5) return -1;
  const zb0 = z.position.y,
    zt = zb0 + (u.crawl ? 0.6 : 1.8) * (z.scale.x || 1),
    lo = feet + 0.35,
    hi = pl.position.y + 0.25,
    gap = zt < lo ? lo - zt : zb0 > hi ? zb0 - hi : 0;
  if (gap > 0.6) return -1;
  const d = Math.hypot(h, gap);
  if (d >= reach) return -1;
  if (h > 0.6 && !los(pl.position, z.position, 1)) return -1;
  return d;
}
function meleeTarget(reach) {
  let t = null,
    bd = 1e9;
  for (const z of zombies) {
    const d = meleeReach(z, reach);
    if (d >= 0 && d < bd) {
      bd = d;
      t = z;
    }
  }
  return t;
}
/* v079: AIMED MELEE. The skill roll still decides whether the blow lands, but WHERE it lands is the part under the crosshair.
   1. The view ray is cast against the target's own meshes: the first mesh carrying a body part (head / armL / armR / legL / legR) is the part hit;
      other meshes of the body (torso, clothes without a slot) count as the torso.
   2. If the ray misses the body (the blow is in reach but the crosshair is just beside the zombie), the part comes from where the ray passes the
      zombie: height up the body (head / torso / legs) and, at torso height, how far to the side (arms). Left/right are the zombie's own sides.
   3. A part that is already gone falls back to the torso. Works for living zombies and for corpses (gore.js). */
const _mRay = new THREE.Raycaster(),
  _mV = new THREE.Vector3(),
  _mD = new THREE.Vector3();
function meleePartOf(m, root) {
  return zPartOf(m, root);
}
/* v089: which body part a mesh of a zombie (or corpse) belongs to. A mesh's own userData.part wins; otherwise the limb pivot it hangs
   under decides, so outfit pieces, boots, hoods and hair on a limb or the head count as that limb (they used to count as the torso, and
   a torso hit can destroy the body). Anything else on the body is the torso. */
function zPartOf(m, root) {
  const P = root && root.userData && root.userData.parts;
  for (let o = m; o; o = o.parent) {
    const p = o.userData && o.userData.part;
    if (p) return p;
    if (P) {
      if (o === P.head) return 'head';
      if (o === P.armL || o === P.elL) return 'armL';
      if (o === P.armR || o === P.elR) return 'armR';
      if (o === P.legL) return 'legL';
      if (o === P.legR) return 'legR';
    }
    if (o === root) break;
  }
  return 'torso';
}
function meleeAimPart(z) {
  if (!z) return 'torso';
  const u = z.userData || {};
  let part = null;
  try {
    _mRay.setFromCamera(C0, camera);
    _mRay.far = 6;
    const hits = _mRay.intersectObject(z, true);
    for (const h of hits) {
      if (!h.object.visible) continue;
      let vis = true;
      for (let o = h.object; o && o !== z; o = o.parent)
        if (!o.visible) {
          vis = false;
          break;
        }
      if (!vis) continue;
      part = meleePartOf(h.object, z);
      break;
    }
  } catch (e) {
    part = null;
  }
  if (!part) {
    // closest approach of the view ray to the zombie's vertical axis
    camera.getWorldPosition(_mV);
    camera.getWorldDirection(_mD);
    const zp = z.position,
      sc = z.scale.x || 1,
      ht = (u.crawl ? 0.6 : 1.8) * sc;
    const dx = zp.x - _mV.x,
      dz = zp.z - _mV.z,
      hd = Math.hypot(_mD.x, _mD.z) || 1e-4,
      tt = Math.max(0, (dx * _mD.x + dz * _mD.z) / (hd * hd)),
      px = _mV.x + _mD.x * tt,
      py = _mV.y + _mD.y * tt,
      pz = _mV.z + _mD.z * tt;
    const f = (py - zp.y) / ht;
    if (u.crawl) {
      part = f > 0.55 ? 'head' : 'torso';
    } else if (f >= 0.83) part = 'head';
    else if (f < 0.48)
      part = (px - zp.x) * Math.cos(z.rotation.y) - (pz - zp.z) * Math.sin(z.rotation.y) < 0 ? 'legL' : 'legR';
    else {
      const side = (px - zp.x) * Math.cos(z.rotation.y) - (pz - zp.z) * Math.sin(z.rotation.y); // the zombie's local X: armL / legL sit on -X
      part = Math.abs(side) > 0.2 * sc ? (side < 0 ? 'armL' : 'armR') : 'torso';
    }
  }
  if (part !== 'torso' && (u['no_' + part] || (u.parts && !u.parts[part]))) part = 'torso';
  return part;
}

const TXT = (t, c, bg) => {
  const k = document.createElement('canvas');
  k.width = 512;
  k.height = 128;
  const q = k.getContext('2d');
  q.fillStyle = bg;
  q.fillRect(0, 0, 512, 128);
  q.fillStyle = c;
  q.font = 'bold 88px Impact,sans-serif';
  q.textAlign = 'center';
  q.fillText(t, 256, 100);
  return new THREE.CanvasTexture(k);
};
let barT = null;
function fort() {
  const T = G.fort,
    PI = Math.PI,
    h = 4.4,
    C = {
      police: [0x7a4a3a, 0x4a4d52, 0x3a3a44],
      prison: [0x8a8a86, 0x3a3a38, 0x555555],
      school: [0xa8795a, 0x6a6a5a, 0x5a2a1a]
    }[T],
    B = mk(FORT.x, FORT.z, 30, 30, h, C[0], C[1], C[2]),
    g = B.g;
  const W4 = [
      {k: 'w', c: -9},
      {k: 'w', c: -3},
      {k: 'w', c: 3},
      {k: 'w', c: 9}
    ],
    R = (a, b, c, d) => [a, b, c, d];
  WL(B, 1, -15, -15, 15, W4, h);
  WL(B, 0, -15, -15, 15, W4, h);
  WL(B, 0, 15, -15, 15, W4, h);
  WL(
    B,
    1,
    15,
    -15,
    -3.6,
    [
      {k: 'w', c: -12},
      {k: 'w', c: -8.5},
      {k: 'w', c: -5.2}
    ],
    h
  );
  WL(
    B,
    1,
    15,
    3.6,
    15,
    [
      {k: 'w', c: 5.2},
      {k: 'w', c: 8.5},
      {k: 'w', c: 12}
    ],
    h
  );
  addSolid(mesh(BX(7.2, 1.4, 0.3), C[0], 0, h - 0.7, 15, g));
  const fl = mesh(new THREE.PlaneGeometry(29.7, 29.7), C[1], 0, 0.03, 0, g);
  fl.rotation.x = -PI / 2;
  winList.push({p: new THREE.Vector3(FORT.x, 1, FORT.z + 16.5), alive: false, pseudo: 1}); // the front entrance: a waypoint for zombie pathing
  if (T === 'police') {
    WL(
      B,
      1,
      5,
      -15,
      15,
      [
        {k: 'd', c: -9},
        {k: 'g', c: 0},
        {k: 'd', c: 9, s: -1}
      ],
      h
    );
    WL(
      B,
      0,
      -5,
      -15,
      5,
      [
        {k: 'd', c: -11.8},
        {k: 'd', c: -5.3},
        {k: 'd', c: 1.5}
      ],
      h
    );
    WL(B, 1, -8.5, -15, -5, [], h);
    WL(B, 1, -2, -15, -5, [], h);
    WL(B, 0, 7, -15, -6, [{k: 'd', c: -10.5}], h);
    WL(B, 1, -6, 7, 15, [], h);
    furn(
      B,
      [
        ['counter', 'n', 0.5],
        ['bench', 's', 0.2],
        ['bench', 's', 0.8],
        ['plant', 'e', 0.1],
        ['plant', 'w', 0.1]
      ],
      R(-14.8, 14.8, 5.3, 14.8)
    );
    [
      [-14.8, -5.3, -14.8, -8.8],
      [-14.8, -5.3, -8.2, -2.3],
      [-14.8, -5.3, -1.7, 4.7]
    ].forEach(r =>
      furn(
        B,
        [
          ['cot', 'w', 0.5],
          ['toilet', 'n', 0.1]
        ],
        r
      )
    );
    furn(
      B,
      [
        ['desk', 'n', 0.15],
        ['desk', 'n', 0.5],
        ['desk', 's', 0.3],
        ['desk', 's', 0.7],
        ['shelf', 'e', 0.5],
        ['plant', 'e', 0.1]
      ],
      R(-4.7, 6.7, -14.8, 4.7)
    );
    furn(
      B,
      [
        ['rack', 'e', 0.3],
        ['rack', 'e', 0.7],
        ['crate', 'n', 0.5],
        ['crate', 'w', 0.8]
      ],
      R(7.3, 14.8, -14.8, -6.3)
    );
    sign(B, 'POLICE');
    for (const sx of [-1, 1]) {
      const x = FORT.x + sx * 9,
        z = FORT.z + 27;
      if (window.MFZV) MFZV.make('police', x, z, sx * 0.3);
      else {
        makeCar(x, z, sx * 0.3);
        mesh(BX(0.9, 0.14, 0.3), 0xff2020, x, 1.45, z);
      }
    }
  }
  if (T === 'prison') {
    WL(
      B,
      1,
      8,
      -15,
      15,
      [
        {k: 'd', c: -8},
        {k: 'g', c: 0},
        {k: 'd', c: 8, s: -1}
      ],
      h
    );
    WL(
      B,
      1,
      -2,
      -15,
      15,
      [-12.5, -7.5, -2.5, 2.5, 7.5, 12.5].map(c => ({k: 'd', c})),
      h
    );
    for (const x of [-10, -5, 0, 5, 10]) WL(B, 0, x, -15, -2, [], h);
    [-15, -10, -5, 0, 5, 10].forEach(x =>
      furn(
        B,
        [
          ['cot', 'n', 0.5],
          ['toilet', 'w', 0.9]
        ],
        R(x + 0.2, x + 4.8, -14.8, -2.3)
      )
    );
    furn(
      B,
      [
        ['desk', 'n', 0.2],
        ['desk', 'n', 0.8],
        ['counter', 's', 0.5],
        ['bench', 's', 0.15],
        ['shelf', 'w', 0.5]
      ],
      R(-14.8, 14.8, 8.3, 14.8)
    );
    furn(
      B,
      [
        ['bench', 'n', 0.2],
        ['bench', 'n', 0.8],
        ['bench', 's', 0.3],
        ['bench', 's', 0.7]
      ],
      R(-14.8, 14.8, -1.7, 7.7)
    );
    sign(B, 'PRISON');
    for (const sx of [-1, 1]) {
      const x = FORT.x + sx * 18.5,
        z = FORT.z + 17;
      addSolid(mesh(BX(3, 9, 3), 0x77776f, x, 4.5, z));
      mesh(BX(4.2, 1.8, 4.2), 0x2a3a4a, x, 9.9, z);
      mesh(BX(4.8, 0.3, 4.8), 0x333333, x, 11, z);
      mesh(BX(0.6, 0.4, 0.6), 0xfff2a0, x - sx * 1.6, 9.9, z - 1.6).material.emissive.setHex(0x888844);
    }
  }
  if (T === 'school') {
    WL(
      B,
      1,
      -3,
      -15,
      15,
      [
        {k: 'd', c: -10},
        {k: 'd', c: 0},
        {k: 'd', c: 10, s: -1}
      ],
      h
    );
    WL(B, 0, -5, -15, -3, [], h);
    WL(B, 0, 5, -15, -3, [], h);
    WL(B, 1, 5, -15, -5, [], h);
    WL(B, 1, 5, 5, 15, [], h);
    WL(B, 0, -5, 5, 15, [{k: 'd', c: 10}], h);
    WL(B, 0, 5, 5, 15, [{k: 'd', c: 10, s: -1}], h);
    [
      [-14.8, -5.3],
      [-4.7, 4.7],
      [5.3, 14.8]
    ].forEach(x =>
      furn(
        B,
        [
          ['desk', 'n', 0.2],
          ['desk', 'n', 0.5],
          ['desk', 'n', 0.8],
          ['desk', 's', 0.3],
          ['desk', 's', 0.7],
          ['shelf', 'w', 0.5]
        ],
        R(x[0], x[1], -14.8, -3.3)
      )
    );
    furn(
      B,
      [
        ['desk', 'n', 0.3],
        ['shelf', 'w', 0.5],
        ['plant', 'e', 0.1]
      ],
      R(-14.8, -5.3, 5.3, 14.8)
    );
    furn(
      B,
      [
        ['shelf', 'e', 0.3],
        ['shelf', 'e', 0.7],
        ['table', 'c', 0.5],
        ['chair', 'c', 0.5]
      ],
      R(5.3, 14.8, 5.3, 14.8)
    );
    furn(
      B,
      [
        ['bench', 'n', 0.2],
        ['bench', 'n', 0.8],
        ['plant', 's', 0.1],
        ['plant', 's', 0.9]
      ],
      R(-14.8, 14.8, -2.7, 4.7)
    );
    sign(B, 'SCHOOL');
    mesh(BX(0.1, 9, 0.1), 0xaaaaaa, FORT.x + 19, 4.5, FORT.z + 12);
    mesh(BX(2, 1.2, 0.05), 0xb91c1c, FORT.x + 20, 8.2, FORT.z + 12);
    const bx = FORT.x + 24,
      bz = FORT.z + 4,
      bus = mesh(BX(2.6, 2.4, 9), 0xf2b705, bx, 1.6, bz);
    addSolid(bus);
    mesh(BX(2.7, 0.3, 9.1), 0x111111, bx, 1.5, bz);
    mesh(BX(2.65, 0.7, 8.4), 0x335577, bx, 2.2, bz);
    for (const dz of [-3, 3])
      for (const dx of [-1.3, 1.3])
        mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.3, 10), 0x111111, bx + dx, 0.5, bz + dz).rotation.z = PI / 2;
  }
  roof(B, h, 'flat');
}
function mkBar(b) {
  const ry = b.ry || 0,
    m = mesh(new THREE.BoxGeometry(4, 2, 0.8), 0x78350f, b.x, 1, b.z);
  m.rotation.y = ry;
  m.updateMatrixWorld(true);
  m.userData = {kind: 'bar', thru: true, bar: b};
  b.mesh = m;
  b.boxes = [];
  const c = Math.cos(ry),
    s = Math.sin(ry);
  for (let t = -1.8; t <= 1.81; t += 0.6) {
    const x = b.x + c * t,
      z = b.z - s * t,
      bx = new THREE.Box3(new THREE.Vector3(x - 0.45, 0, z - 0.45), new THREE.Vector3(x + 0.45, 2, z + 0.45));
    bx.bar = b;
    solids.push(bx);
    b.boxes.push(bx);
  }
  b.box = b.boxes[0];
  tint(b);
}
function tint(b) {
  b.mesh.material.color.setHSL(0.07, 0.6, 0.1 + (0.28 * b.hp) / 100);
}
function breakBar(b) {
  scene.remove(b.mesh);
  (b.boxes || [b.box]).forEach(x => {
    const i = solids.indexOf(x);
    if (i >= 0) solids.splice(i, 1);
  });
  G.bars = G.bars.filter(x => x !== b);
  toast('A barricade was destroyed!');
}
function mkSpike(s) {
  const m = mesh(new THREE.ConeGeometry(0.5, 1, 4), 0x94a3b8, s.x, 0.5, s.z);
  m.userData = {kind: 'spike', thru: true};
  s.mesh = m;
}
function survMeshes() {
  G.surv.forEach((s, i) => {
    if (s.hp <= 0) return;
    const m = makePerson(
      RC[s.role],
      s.px !== undefined ? s.px : FORT.x - 12 + (i % 8) * 3.4,
      s.pz !== undefined ? s.pz : FORT.z + 9 + Math.floor(i / 8) * 2.5,
      s.role
    );
    m.userData = {kind: 'surv', s, P: m.userData.P, role: s.role};
    hpBar(m);
    smesh.push(m);
    scene.add(m);
    npcVisual(m, s);
  });
}
// Rev 034: world cleanup split out of buildWorld so the Dev Toolkit can reuse it (behaviour unchanged for the normal game)
function clearWorld() {
  const rm = [];
  for (let i = scene.children.length - 1; i >= 0; i--) {
    const c = scene.children[i];
    if (c !== pl && !c.isLight) {
      scene.remove(c);
      rm.push(c);
    }
  }
  zombies = [];
  npcList = [];
  carry = null;
  dropBoxes = [];
  bloodP = [];
  decals = [];
  limbs = [];
  floats = [];
  dnAct.length = 0;
  dnPool.length = 0;
  comps.length = 0;
  winList.length = 0;
  dead.length = 0;
  shards.length = 0;
  solids.length = 0;
  walkables.length = 0;
  sight.length = 0;
  doors.length = 0;
  smesh = [];
  streetLights = [];
  if (typeof devOnClear === 'function') devOnClear(rm);
}
/* v075: the world build is a list of steps [label, fn, weight] so the loading screen (js/game/loader.js) can run them a frame apart and show
   progress. buildWorld() runs them all at once, as before. WB.pre / WB.post: hooks before clearing and after building (perf.js optimise pass).
   WB.prebuilt: the loader already built this world step by step, so the next buildWorld() (from go()) skips the build. */
const WB = {pre: [], post: [], townPost: [], prebuilt: false};
function worldSteps() {
  const m = G.mode,
    st = [];
  st.push([
    'Clearing the ground',
    () => {
      for (const f of WB.pre) f();
      clearWorld();
      const gr = mesh(
        new THREE.PlaneGeometry(500, 500),
        m === 'EXPEDITION' ? 0x1a1c20 : {police: 0x2a2c30, prison: 0x4a4538, school: 0x2d5a2a}[G.fort] || 0x1a1c20,
        0,
        0,
        0
      );
      gr.rotation.x = -Math.PI / 2;
      if (m !== 'EXPEDITION') {
        fort();
        G.bars.forEach(mkBar);
        G.spikes = [];
      }
    }
  ]);
  if (m === 'EXPEDITION') {
    st.push([
      'Surveying the town',
      () => {
        BND = townBND();
      }
    ]);
    st.push(...townSteps());
    st.push(['Fencing the town', () => border(...BND)]);
  } else
    st.push([
      'Fencing the fort',
      () => {
        BND = [FORT.x - 62, FORT.x + 62, FORT.z - 55, FORT.z + 62];
        border(...BND);
        if (m === 'CLEAR')
          for (let i = 0, t = 0; i < 8 && t < 120; t++) {
            const c0 = zombies.length;
            zombie(FORT.x + rnd(-13, 13), FORT.z + rnd(-13, 13), 'walker', true);
            if (zombies.length > c0) i++;
          }
      }
    ]);
  st.push([
    'Teaching the dead to walk',
    () => {
      if (m === 'FORT_BUILD' || m === 'SIEGE') survMeshes();
      zFix();
      buildNav();
    },
    2
  ]);
  st.push([
    'Lighting and optimising',
    () => {
      for (const f of WB.post) f();
    },
    5
  ]);
  return st;
}
function buildWorld() {
  if (WB.prebuilt) {
    WB.prebuilt = false;
    return;
  }
  for (const s of worldSteps()) s[1]();
}
