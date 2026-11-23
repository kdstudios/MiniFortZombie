/* MINI FORT ZOMBIE - core 02/13: state
   Inventory grids, resources, game state G, screen switching (ui), options glue, quality/settings.
   Part of the old js/game/core.js (split in v080). Classic script: shares globals with the other core parts; load in numeric order. */
/* =====================================================================================================
   INVENTORY MODEL (one implementation for Player, Survivor, Container, Drop box and Fort HQ).
   inv = {w,h,minH,items:[inst],g:[rows of inst|null],grow?}. inst = {uid,id,x,y,rot,rem}. No stacking: one instance = one object.
   ===================================================================================================== */
let uidCounter = 1;
function newInst(id) {
  const it = ITEMS[id];
  if (!it) return null;
  const k = resOf(id);
  const o = {uid: uidCounter++, id, x: 0, y: 0, rot: false, rem: k ? it.value[k] : 0};
  if (WDEF[id] && WDEF[id].type === 'gun') o.clip = WDEF[id].cap;
  return o;
}
function makeGrid(w, h) {
  const g = [];
  for (let y = 0; y < h; y++) g.push(new Array(w).fill(null));
  return g;
}
function newInv(w, h, o) {
  return Object.assign({w, h, minH: h, items: [], g: makeGrid(w, h)}, o || {});
}
function fp(inst, rot) {
  const s = ITEMS[inst.id].size;
  return (rot === undefined ? inst.rot : rot) ? [s[1], s[0]] : [s[0], s[1]];
}
function invGrow(inv, n) {
  while (inv.g.length < n) inv.g.push(new Array(inv.w).fill(null));
  if (inv.h < n) inv.h = n;
}
function invFits(inv, inst, x, y, rot) {
  const [tw, th] = fp(inst, rot);
  if (x < 0 || y < 0 || x + tw > inv.w) return false;
  if (!inv.grow && y + th > inv.h) return false;
  for (let dy = 0; dy < th; dy++) {
    const r = inv.g[y + dy];
    if (!r) continue;
    for (let dx = 0; dx < tw; dx++) {
      const c = r[x + dx];
      if (c && c !== inst) return false;
    }
  }
  return true;
}
function invPut(inv, inst, x, y, rot) {
  inst.x = x;
  inst.y = y;
  inst.rot = !!rot;
  const [tw, th] = fp(inst);
  if (inv.grow) invGrow(inv, y + th);
  for (let dy = 0; dy < th; dy++) for (let dx = 0; dx < tw; dx++) inv.g[y + dy][x + dx] = inst;
  if (!inv.items.includes(inst)) inv.items.push(inst);
}
function invLift(inv, inst) {
  const [tw, th] = fp(inst);
  for (let dy = 0; dy < th; dy++) {
    const r = inv.g[inst.y + dy];
    if (!r) continue;
    for (let dx = 0; dx < tw; dx++) if (r[inst.x + dx] === inst) r[inst.x + dx] = null;
  }
}
function invTrim(inv) {
  if (!inv.grow) return;
  let b = 0;
  inv.items.forEach(q => {
    b = Math.max(b, q.y + fp(q)[1]);
  });
  const H = Math.max(inv.minH, b);
  inv.h = H;
  inv.g.length = H;
  while (inv.g.length < H) inv.g.push(new Array(inv.w).fill(null));
}
function invRemove(inv, inst) {
  invLift(inv, inst);
  const i = inv.items.indexOf(inst);
  if (i >= 0) inv.items.splice(i, 1);
  invTrim(inv);
  return inst;
}
// first free spot (unrotated first, then rotated, like the old findFit); the HQ inventory always has room because it grows downward
function invFind(inv, inst) {
  for (const r of [false, true]) {
    const [tw, th] = fp(inst, r);
    for (let y = 0; y + th <= inv.h; y++)
      for (let x = 0; x + tw <= inv.w; x++) if (invFits(inv, inst, x, y, r)) return {x, y, rot: r};
  }
  if (inv.grow) return {x: 0, y: inv.h, rot: false};
  return null;
}
function invAdd(inv, inst) {
  const f = invFind(inv, inst);
  if (!f) return false;
  invPut(inv, inst, f.x, f.y, f.rot);
  return true;
}
// move an item between inventories safely: if the destination has no room the item stays exactly where it was
function invTransfer(src, dst, inst) {
  const ox = inst.x,
    oy = inst.y,
    or = inst.rot;
  invRemove(src, inst);
  if (invAdd(dst, inst)) return true;
  invPut(src, inst, ox, oy, or);
  return false;
}
function invMove(src, dst, inst, x, y, rot) {
  if (src === dst) {
    const ox = inst.x,
      oy = inst.y,
      or = inst.rot;
    invLift(src, inst);
    if (invFits(dst, inst, x, y, rot)) {
      invPut(dst, inst, x, y, rot);
      invTrim(dst);
      return true;
    }
    invPut(src, inst, ox, oy, or);
    return false;
  }
  if (!invFits(dst, inst, x, y, rot)) return false;
  invRemove(src, inst);
  invPut(dst, inst, x, y, rot);
  return true;
}
/* resources: ALWAYS derived from the remaining value of the items currently in an inventory */
function resTotals(inv) {
  const t = {food: 0, meds: 0, mat: 0, ammo: 0};
  inv.items.forEach(q => {
    const k = resOf(q.id);
    if (k) t[k] += Math.max(0, q.rem);
  });
  return t;
}
function resTotal(inv, k) {
  return resTotals(inv)[k];
}
function resConsume(inv, k, amt) {
  let need = Math.max(0, amt),
    taken = 0;
  const l = inv.items.filter(q => resOf(q.id) === k && q.rem > 0).sort((a, b) => a.rem - b.rem || a.uid - b.uid);
  for (const q of l) {
    if (need <= 0) break;
    const t = Math.min(q.rem, need);
    q.rem -= t;
    need -= t;
    taken += t;
  }
  inv.items.filter(q => resOf(q.id) && q.rem <= 0).forEach(q => invRemove(inv, q));
  return taken;
}
// new supplies (scavenger income etc.) are created as real items; partial values are allowed
function resGrant(inv, k, amt) {
  const pool = ITEM_ORDER.filter(id => resOf(id) === k);
  let left = Math.round(amt),
    guard = 0;
  while (left > 0 && guard++ < 300) {
    const fit = pool.filter(id => ITEMS[id].value[k] <= left),
      id = fit.length ? fit[ri(0, fit.length - 1)] : pool[ri(0, pool.length - 1)],
      q = newInst(id);
    q.rem = Math.min(q.rem, left);
    left -= q.rem;
    if (!invAdd(inv, q)) break;
  }
}
const HQINV = newInv(16, 16, {grow: true}),
  PINV = newInv(16, 16);

const G = {
  day: 0,
  mode: 'TITLE',
  time: 8,
  fort: 'police',
  hp: 100,
  maxHp: 100,
  st: 100,
  eq: null,
  kills: 0,
  skill: 3,
  bars: [],
  spikes: [],
  surv: [], // v067: Sgt. Miller and Dr. Aris are now in the survivor pool
  sens: 1,
  fov: 75,
  siegeToSpawn: 0,
  spawnT: 0,
  guardT: 0,
  siegeDue: false,
  noise: 0,
  cdS: 0,
  cdM: 0,
  rescued: 0,
  rl: 0,
  vy: 0,
  kick: 0,
  swT: 0,
  swD: 0.3,
  swK: 'punch',
  draw: 0,
  rlT: 1,
  flashT: 0,
  dry: 0,
  ads: 0,
  zoom: 0,
  zoomK: 1,
  torchOn: false,
  eyeH: 1.6,
  eyeUsed: 1.6,
  crouch: false
};
// Fort HQ resources are NOT stored anywhere: G.food/G.mat/G.meds read the items in the HQ inventory, and writes consume or create real items
for (const k of ['food', 'mat', 'meds'])
  Object.defineProperty(G, k, {
    enumerable: true,
    configurable: true,
    get() {
      return resTotal(HQINV, k);
    },
    set(v) {
      const cur = resTotal(HQINV, k);
      v = Math.max(0, Math.round(v));
      if (v < cur) resConsume(HQINV, k, cur - v);
      else if (v > cur) resGrant(HQINV, k, v - cur);
    }
  });

const FORT = new THREE.Vector3(0, 0, -70),
  TRUCK = new THREE.Vector3(0, 0, 15);
const BOUND_X = 180,
  BOUND_Z_MIN = -180,
  BOUND_Z_MAX = 130;
let scene,
  camera,
  renderer,
  clock,
  dirL,
  ambL,
  torchL,
  pl,
  ray,
  yaw = 0,
  pitch = 0,
  locked = false,
  zombies = [],
  solids = new SolidList(),
  walkables = [],
  smesh = [],
  K = {},
  AC,
  lookT = 0,
  fbT,
  streetLights = [];
const C0 = new THREE.Vector2(0, 0),
  TB = new THREE.Box3(),
  playing = () => ['CLEAR', 'EXPEDITION', 'FORT_BUILD', 'SIEGE', 'DEV'].includes(G.mode);

function beep(t, a, b, d, v) {
  if (!AC) return;
  const o = AC.createOscillator(),
    g = AC.createGain(),
    n = AC.currentTime;
  o.type = t;
  o.frequency.setValueAtTime(a, n);
  o.frequency.exponentialRampToValueAtTime(b, n + d);
  g.gain.setValueAtTime(v, n);
  g.gain.exponentialRampToValueAtTime(0.01, n + d);
  o.connect(g);
  g.connect(SFX || AC.destination);
  o.start();
  o.stop(n + d);
}
function toast(m) {
  const d = document.createElement('div');
  d.textContent = m;
  $('tw').appendChild(d);
  setTimeout(() => d.remove(), 3500);
}
let scrNow = 'title',
  optFrom = 'menu';
function ui(id) {
  ['title', 'menu', 'opt', 'sel', 'hq', 'pz', 'end', 'dev'].forEach(i => $(i).classList.toggle('hide', i !== id));
  if (id) scrNow = id;
  clkVis();
}
const scrVis = n => !$(n).classList.contains('hide');
// clock / siege text is hidden on the title, main menu, fort select, menu-Options and Developer Toolkit screens
function clkVis() {
  const b = $('clkBox');
  if (b)
    b.classList.toggle(
      'hide',
      scrVis('hq') || scrVis('title') || scrVis('menu') || scrVis('sel') || (scrVis('opt') && optFrom === 'menu')
    );
}
// the world only freezes inside the plain pause menu (and Options opened from it, and the Dev panel)
function frozen() {
  return scrVis('pz') || (scrVis('opt') && (optFrom === 'pz' || optFrom === 'dev')) || scrVis('dev');
}
// Fort HQ opened with Esc at the fort: the game keeps running behind it
function hqShown() {
  return !!G.hqPause && (scrVis('hq') || (scrVis('opt') && optFrom === 'hq'));
}
function inHQ() {
  return G.mode === 'HQ_MENU' || (!!G.hqPause && scrVis('hq'));
}
function titleAny() {
  if (scrNow !== 'title') return;
  if (window.MFZLOAD && !MFZLOAD.ready) return;
  S.ui();
  ui('menu');
  if (window.MFZLOAD) MFZLOAD.passTitle();
} /* v075: not until the loading bar is done; then the menu town + music start */
function newGame() {
  S.ui();
  ui('sel');
}
function openOptions(from) {
  optFrom = from;
  $('optDev').classList.toggle('hide', from !== 'menu');
  if ($('optQuit')) $('optQuit').classList.toggle('hide', from === 'menu'); // v089: only offered in a game
  ui('opt');
  optTab(null);
}
/* v089: Options > Quit to Main Menu (in a game only). The page is reloaded straight to the main menu (no title screen), which tears
   everything down cleanly: the world, the campaign state and any co-op connection. Progress since the last save or autosave is lost. */
function quitToMenu() {
  const go = () => {
    try {
      sessionStorage.setItem('mfz_toMenu', '1');
    } catch (e) {}
    location.href = location.pathname + location.search; // v100: keep URL flags (?noa2c etc.)
  };
  const co = window.COOP && COOP.role && COOP.role !== 'off';
  const msg =
    'Leave this game and go back to the main menu?<br>Anything since your last save or autosave (made each time you arrive at the fort) is lost.' +
    (co ? '<br><b>This also ends the co-op session.</b>' : '');
  if (window.MFZSAVE && MFZSAVE.modal) MFZSAVE.modal('Quit to Main Menu', msg, [['Quit to Main Menu', go], ['Cancel']]);
  else if (confirm(msg.replace(/<br>/g, '\n').replace(/<\/?b>/g, ''))) go();
}
function optTab(t) {
  $('optMain').classList.toggle('hide', !!t);
  $('optV').classList.toggle('hide', t !== 'V');
  $('optS').classList.toggle('hide', t !== 'S');
  $('optI').classList.toggle('hide', t !== 'I');
  $('optK').classList.toggle('hide', t !== 'K');
  $('optB').classList.toggle('hide', t !== 'B');
  if (t === 'B') $('bugRepChk').checked = !!(window.bugReportOn && window.bugReportOn());
  if (t === 'I') icoList();
  if (t === 'K') kbRender();
}
function setBugReport(on) {
  try {
    localStorage.setItem('mfz_bugrep', on ? '1' : '0');
  } catch (e) {}
}
function optBack() {
  if ($('optMain').classList.contains('hide')) optTab(null);
  else ui(optFrom);
}
function setQuality(q) {
  G.q = q;
  if (renderer) {
    renderer.setPixelRatio(PERF.prFor(q));
    renderer.setSize(innerWidth, innerHeight);
  }
  document.querySelectorAll('.qb').forEach(b => b.classList.toggle('on', +b.dataset.q === q));
  saveSet();
}
function saveSet() {
  try {
    localStorage.setItem('gf_set', JSON.stringify({ms: MSV, mv: MV, av: AV, sens: G.sens, fov: G.fov, q: G.q}));
  } catch (e) {}
}
function lock() {
  initAudio();
  try {
    const r = renderer.domElement.requestPointerLock();
    if (r && r.catch) r.catch(() => {});
  } catch (e) {}
} /* v075: a lock without a key press / click just fails quietly (the loading screen asks for the key) */
