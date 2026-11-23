/* MINI FORT ZOMBIE - core 05/13: init
   init(): renderer, camera, input listeners; solids/walkables, loot containers.
   Part of the old js/game/core.js (split in v080). Classic script: shares globals with the other core parts; load in numeric order. */
function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 300);
  pl = new THREE.Group();
  pl.position.set(0, 1.6, 0);
  pl.add(camera);
  scene.add(pl);
  renderer = new THREE.WebGLRenderer({antialias: PERF.aa});
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  $('cv').appendChild(renderer.domElement);
  clock = new THREE.Clock();
  VM.root = null;
  VM.set = {};
  VM.cur = null;
  ray = new THREE.Raycaster();
  scene.fog = new THREE.FogExp2(0x7092be, 0.02);
  ambL = new THREE.AmbientLight(0x667788, 0.6);
  scene.add(ambL);
  dirL = new THREE.DirectionalLight(0xffeedd, 1);
  scene.add(dirL);
  torchL = new THREE.SpotLight(0xfff0cc, 0, 30, Math.PI / 6, 0.4, 1.2);
  torchL.position.set(0, 0, 0);
  torchL.target.position.set(0, 0, -10);
  camera.add(torchL);
  camera.add(torchL.target);
  $('cs').innerHTML = Array(24)
    .fill(0)
    .map(
      (_, i) =>
        `<span style="display:inline-block;width:40px;text-align:center">${['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][i % 8]}</span>`
    )
    .join('');
  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
  addEventListener('keydown', e => {
    K[e.code] = true;
    if (e.code === 'Tab') e.preventDefault();
    if (e.code === 'Escape' && !e.repeat && escResume()) return;
    if (invOpen) {
      if (e.code === 'KeyE' && hovUse()) {
        e.preventDefault();
        return;
      }
      if (e.code === 'KeyI' || e.code === 'KeyE') {
        e.preventDefault();
        closeInv();
        return;
      }
      if (e.code === 'KeyR' && invDragging) {
        dragRot();
        return;
      }
      if (e.code === 'KeyR' && currentContainer) {
        e.preventDefault();
        takeAllQuick();
        return;
      }
      return;
    }
    if (skOpen) return;
    if (e.code === 'KeyI' && playing() && !inHQ()) {
      toggleInv();
      return;
    }
    if (e.code === 'KeyF' && playing()) {
      toggleTorch();
      return;
    }
    if (!locked || !playing()) return;
    if (/^(Digit|Numpad)[1-5]$/.test(e.code) && !e.repeat && comps.length) {
      ccApply(+e.code.slice(-1));
    }
    if (e.code === 'KeyR' && !e.repeat) reload(true);
    if (e.code === 'KeyQ' && !e.repeat) melee();
    if (e.code === 'KeyE') {
      const h = look(false),
        u = h && h.o && h.o.userData,
        fort = G.mode === 'FORT_BUILD';
      if (u && h.d < 3.5 && (u.kind === 'comp' || (u.kind === 'surv' && fort))) {
        if (!e.repeat) {
          const c = u.kind === 'comp' ? u.c : fortComp(h.o);
          holdC = {
            c,
            pick: fort,
            to: setTimeout(() => {
              if (holdC) {
                holdC.done = 1;
                wheelOpen(holdC.c);
              }
            }, 350)
          };
        }
      } else use();
    }
    if (e.code === 'KeyC' && !e.repeat) toggleCrouch();
    if (e.code === 'KeyZ') fzBarKey();
    if (e.code === 'KeyX') fzGhostOff(true);
    if (e.code === 'Tab') cycleWeapon();
  });
  addEventListener('keyup', e => {
    K[e.code] = false;
    if (e.code === 'KeyE' && holdC) {
      clearTimeout(holdC.to);
      if (wheel) wheelDone();
      else if (!holdC.done) {
        if (holdC.pick) use();
        else toggleFollow(holdC.c);
      }
      holdC = null;
    }
  });
  addEventListener('contextmenu', e => e.preventDefault());
  addEventListener('mousemove', e => {
    if (wheel && locked) {
      wheel.x = Math.max(-100, Math.min(100, wheel.x + e.movementX));
      wheel.y = Math.max(-100, Math.min(100, wheel.y + e.movementY));
      wheelUI();
      return;
    }
    if (!locked || invOpen) return;
    yaw -= e.movementX * 0.0022 * G.sens * (G.zoomK || 1);
    pitch = Math.max(-1.45, Math.min(1.45, pitch - e.movementY * 0.0022 * G.sens * (G.zoomK || 1)));
    pl.rotation.y = yaw;
    camera.rotation.x = pitch;
  });
  addEventListener('mousedown', e => {
    if (e.button === 0) K.m0 = true;
    if (e.button === 2) K.m2 = true;
    if (!locked || !playing() || invOpen) return;
    if (e.button === 0) shoot();
  });
  addEventListener('mouseup', e => {
    if (e.button === 0) K.m0 = false;
    if (e.button === 2) K.m2 = false;
  });
  renderer.domElement.addEventListener('click', () => {
    if (playing() && !locked && !invOpen) lock();
  });
  function escResume() {
    if (!playing() || invOpen || performance.now() - (G.pauseAt || 0) < 350) return false;
    if (G.hqPause && scrVis('hq')) {
      resumeFort();
      return true;
    }
    if (scrVis('pz') && !locked) {
      G.escTry = performance.now();
      lock();
      return true;
    }
    return false;
  }
  document.addEventListener('pointerlockerror', () => {
    if (G.escTry && performance.now() - G.escTry < 1500) {
      G.escTry = 0;
      if (playing() && !locked && !invOpen && !scrVis('hq') && !scrVis('dev') && !scrVis('opt')) ui('pz');
    }
  });
  document.addEventListener('pointerlockchange', () => {
    locked = document.pointerLockElement === renderer.domElement;
    if (playing() && !invOpen && !skOpen) {
      if (locked) ui(null);
      else showPause();
    }
  });
  document.querySelectorAll('.sens').forEach(
    e =>
      (e.oninput = () => {
        G.sens = +e.value;
        saveSet();
        document.querySelectorAll('.sens').forEach(x => (x.value = e.value));
      })
  );
  document.querySelectorAll('.fov').forEach(
    e =>
      (e.oninput = () => {
        camera.fov = G.fov = +e.value;
        saveSet();
        camera.updateProjectionMatrix();
        document.querySelectorAll('.fovv').forEach(x => (x.textContent = e.value + '\u00b0'));
        document.querySelectorAll('.fov').forEach(x => (x.value = e.value));
      })
  );
  ui('title');
  initUI();
  animate();
}

function addSolid(m, box) {
  if (m && m.updateWorldMatrix) m.updateWorldMatrix(true, false);
  const b = box || new THREE.Box3().setFromObject(m);
  solids.push(b);
  return b;
}
function addWalkable(m, box) {
  if (m && m.updateWorldMatrix) m.updateWorldMatrix(true, false);
  const b = box || new THREE.Box3().setFromObject(m);
  walkables.push(b);
  return b;
}
function blocked(x, z, r = 0.4, fy = 0, hh = 1.8) {
  TB.min.set(x - r, fy + 0.05, z - r);
  TB.max.set(x + r, fy + hh, z + r);
  for (const s of solids) if (s && s.intersectsBox(TB)) return s;
  return null;
}
function mesh(g, c, x, y, z, p) {
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({color: c, roughness: 0.85}));
  m.position.set(x, y, z);
  (p || scene).add(m);
  return m;
}

const LOOT_PROP = {
  clinic: 'cabinet',
  gunshop: 'ammo_crate',
  gas: 'pump_shelf',
  diner: 'counter',
  hardware: 'toolchest',
  house: 'fridge',
  supermarket: 'cart',
  church: 'pew',
  cemetery: 'grave',
  park: 'bench'
};

function rollLoot(table, n) {
  const ids = Object.keys(LOOT_TABLES[table]);
  const tot = ids.reduce((a, k) => a + LOOT_TABLES[table][k], 0);
  const out = [];
  for (let i = 0; i < n; i++) {
    let r = Math.random() * tot;
    for (const k of ids) {
      if ((r -= LOOT_TABLES[table][k]) <= 0) {
        out.push(k);
        break;
      }
    }
  }
  return out;
}

function spawnContainer(x, z, table, y0 = 0) {
  const g = new THREE.Group();
  g.position.set(x, y0, z);
  scene.add(g);
  const kind = LOOT_PROP[table] || 'crate';
  const pieces = [];
  const add = (geo, col, px, py, pz) => {
    const m = mesh(geo, col, px, py, pz, g);
    pieces.push(m);
    return m;
  };
  if (kind === 'cabinet') {
    add(new THREE.BoxGeometry(1.2, 2, 0.6), 0xd0d6dc, 0, 1, 0);
    add(new THREE.BoxGeometry(1.1, 0.4, 0.05), 0x88aacc, 0, 1.2, 0.32);
    add(new THREE.BoxGeometry(1.1, 0.4, 0.05), 0x88aacc, 0, 0.6, 0.32);
  } else if (kind === 'ammo_crate') {
    add(new THREE.BoxGeometry(1.4, 0.8, 1), 0x4d5a2a, 0, 0.4, 0);
    add(new THREE.BoxGeometry(1.5, 0.1, 1.1), 0x3a4a1a, 0, 0.85, 0);
    add(new THREE.BoxGeometry(0.4, 0.5, 0.05), 0xfacc15, 0, 0.4, 0.51);
  } else if (kind === 'pump_shelf') {
    add(new THREE.BoxGeometry(1.6, 0.4, 0.8), 0x883322, 0, 0.2, 0);
    add(new THREE.BoxGeometry(1.2, 1.6, 0.4), 0xcccccc, 0, 0.9, 0);
    add(new THREE.BoxGeometry(0.4, 0.3, 0.1), 0x222, 0, 1.2, 0.25);
  } else if (kind === 'counter') {
    add(new THREE.BoxGeometry(2.2, 0.9, 1), 0x8a5a2a, 0, 0.45, 0);
    add(new THREE.BoxGeometry(2.3, 0.1, 1.1), 0xa06030, 0, 0.95, 0);
  } else if (kind === 'toolchest') {
    add(new THREE.BoxGeometry(1.6, 1.2, 0.7), 0x9a1b1b, 0, 0.6, 0);
    add(new THREE.BoxGeometry(1.6, 0.05, 0.7), 0x666, 0, 0.3, 0);
    add(new THREE.BoxGeometry(1.6, 0.05, 0.7), 0x666, 0, 0.9, 0);
    add(new THREE.BoxGeometry(1.4, 0.06, 0.05), 0xccc, 0, 0.6, 0.36);
  } else if (kind === 'fridge') {
    add(new THREE.BoxGeometry(1, 2.2, 0.8), 0xe5e7eb, 0, 1.1, 0);
    add(new THREE.BoxGeometry(1.05, 0.05, 0.85), 0x999, 0, 1.5, 0);
    add(new THREE.BoxGeometry(0.1, 0.4, 0.05), 0x666, 0.4, 1.8, 0.42);
  } else if (kind === 'cart') {
    add(new THREE.BoxGeometry(1.2, 0.15, 0.8), 0x8a8a8a, 0, 0.4, 0);
    add(new THREE.BoxGeometry(1.2, 0.6, 0.15), 0x8a8a8a, 0, 0.7, -0.35);
    add(new THREE.BoxGeometry(1.2, 0.6, 0.15), 0x8a8a8a, 0, 0.7, 0.35);
    add(new THREE.BoxGeometry(0.15, 0.6, 0.8), 0x8a8a8a, -0.55, 0.7, 0);
    add(new THREE.BoxGeometry(0.15, 0.6, 0.8), 0x8a8a8a, 0.55, 0.7, 0);
    add(new THREE.BoxGeometry(1.2, 0.05, 0.05), 0x666, 0, 0.4, -0.55);
  } else if (kind === 'pew') {
    add(new THREE.BoxGeometry(2, 0.9, 0.6), 0x7a4a2a, 0, 0.45, 0);
    add(new THREE.BoxGeometry(2, 0.4, 0.15), 0x7a4a2a, 0, 0.95, -0.25);
  } else if (kind === 'grave') {
    add(new THREE.BoxGeometry(1, 0.3, 2), 0x3a3a3a, 0, 0.15, 0);
    add(new THREE.BoxGeometry(0.6, 1.2, 0.15), 0x8a8a8a, 0, 0.7, -0.8);
    add(new THREE.BoxGeometry(0.5, 0.1, 0.15), 0x666, 0, 1, -0.85);
  } else if (kind === 'bench') {
    add(new THREE.BoxGeometry(1.8, 0.15, 0.5), 0x7a4a2a, 0, 0.45, 0);
    add(new THREE.BoxGeometry(0.15, 0.4, 0.5), 0x3a3a3a, -0.7, 0.2, 0);
    add(new THREE.BoxGeometry(0.15, 0.4, 0.5), 0x3a3a3a, 0.7, 0.2, 0);
  } else {
    add(new THREE.BoxGeometry(1.4, 1.1, 1.4), 0xd97706, 0, 0.55, 0);
    add(new THREE.BoxGeometry(1.45, 0.1, 1.45), 0xa16207, 0, 1.1, 0);
  }
  const cont = {
    x,
    z,
    inv: newInv(16, 16),
    pieces,
    group: g,
    table,
    locked: G.mode === 'EXPEDITION' && Math.random() < 0.04
  };
  rollLoot(table, ri(1, 3) + (cont.locked ? ri(2, 4) : 0)).forEach(id => {
    const q = newInst(id);
    lootRoll(q);
    invAdd(cont.inv, q);
  });
  g.userData = {kind: 'loot', cont};
  pieces.forEach(p => (p.userData = {kind: 'loot', cont}));
  const h = kind === 'fridge' ? 2.2 : kind === 'cabinet' ? 2 : 1.1;
  solids.push(new THREE.Box3(new THREE.Vector3(x - 0.7, y0, z - 0.5), new THREE.Vector3(x + 0.7, y0 + h, z + 0.5)));
  return cont;
}
function refreshContainerVisual(cont) {
  if (cont.drop || cont.hq || cont.comp || cont.corpse || !cont.inv) return;
  if (!cont.inv.items.length) {
    cont.pieces.forEach(p => {
      p.material.color.setHex(0x444444);
      p.material.roughness = 1;
    });
  }
}
function lootRuin(ct, p) {
  ct.inv.items.slice().forEach(q => {
    if (Math.random() < p) invRemove(ct.inv, q);
  });
}

const BT = [
  {n: 'Clinic', c: 0x9db4c8, w: 14, d: 12, h: 5, t: 'clinic'},
  {n: 'Gun Shop', c: 0x4b4540, w: 10, d: 10, h: 4.5, t: 'gunshop'},
  {n: 'Gas Station', c: 0xb45309, w: 16, d: 14, h: 4, t: 'gas'},
  {n: 'Diner', c: 0xa16207, w: 16, d: 8, h: 4.5, t: 'diner'},
  {n: 'Hardware Store', c: 0x4d6b2a, w: 16, d: 14, h: 5, t: 'hardware'},
  {n: 'Supermarket', c: 0x6a7a8a, w: 20, d: 16, h: 6, t: 'supermarket'},
  {n: 'Church', c: 0xb0a890, w: 12, d: 16, h: 7, t: 'church'}
];
const HOUSE_TYPE = {n: 'House', t: 'house', w: 11, d: 11, h: 6, c: 0x8a7f73};
const CUSTOM_TYPES = ['clinic', 'gunshop', 'gas', 'diner', 'hardware', 'supermarket', 'church'];
let nNpc = 0,
  buildings = [],
  npcList = [],
  dead = [],
  shards = [],
  treeList = [],
  winList = [],
  carry = null,
  BND = [-198, 198, -154, 148];
const doors = [];
let CUR = {cs: 1, px: 0, pz: 0, lv: 0},
  LASTB = null; // CUR = orientation/placement of the building being generated; LASTB = its builder record
function fence(fx, fz, ax, L) {
  fenceWorld(fx, fz, ax, L);
  mesh(BX(ax ? L : 0.08, 0.08, ax ? 0.08 : L), 0x8a6a3a, fx, 0.9, fz);
  for (let i = 0; i <= L; i += 2)
    mesh(BX(0.12, 1.1, 0.12), 0x5a3a1a, ax ? fx - L / 2 + i : fx, 0.55, ax ? fz : fz - L / 2 + i);
}
function fenceWorld(fx, fz, ax, L) {
  return addSolid(mesh(new THREE.BoxGeometry(ax ? L : 0.12, 1, ax ? 0.12 : L), 0x6b4a2b, fx, 0.5, fz));
}
