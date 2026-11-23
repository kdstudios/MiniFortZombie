/* MINI FORT ZOMBIE - core 01/13: items
   Perf helpers, item registry (ITEMS), weapon data (WDEF), loot tables, item icons, icon import/export, IndexedDB.
   Part of the old js/game/core.js (split in v080). Classic script: shares globals with the other core parts; load in numeric order. */
/* ===== REV 039 early helpers (performance pass) ===== */
const PERF = {
  aa: true,
  mat: 'phong',
  built: false,
  farB: 100,
  intR: 16,
  n: 0,
  zc: 0,
  pr: 1,
  prFor(q) {
    return q === 0 ? 0.6 : q === 1 ? 1 : q === 3 ? this.pr || 1 : Math.min(devicePixelRatio, 2);
  }
};
try {
  const o = JSON.parse(localStorage.getItem('gf_perf') || 'null');
  if (o && o.aa !== undefined) PERF.aa = !!o.aa;
} catch (e) {}
class SolidList extends Array {
  static get [Symbol.species]() {
    return Array;
  }
  push(...a) {
    const n = super.push(...a);
    if (this.G) for (const b of a) this.G.add(b);
    return n;
  }
  splice(...args) {
    const r = super.splice(...args);
    if (this.G) {
      for (const b of r) this.G.del(b);
      for (const b of args.slice(2)) this.G.add(b);
    }
    return r;
  }
}
const TSC = new Map();
let _mmT = 0;
function mmCtx() {
  const n = performance.now();
  if (n - _mmT < 100) return null;
  _mmT = n;
  return $('mm').getContext('2d');
}
const VERSION = '100';
const ZSPD = 0.9; // v072: every zombie moves 10% slower than v071
const TAU = Math.PI * 2,
  $ = id => document.getElementById(id),
  rnd = (a, b) => a + Math.random() * (b - a),
  ri = (a, b) => Math.floor(rnd(a, b + 1)),
  Y = new THREE.Vector3(0, 1, 0);
const FORTS = {
  police: {n: 'Police Station', hp: 1.25, sg: 0.75, z: 1},
  prison: {n: 'The Prison', hp: 1, sg: 0, z: 1},
  school: {n: 'The School', hp: 1, sg: 0, z: 1.5}
};
const ROLEFX = {
  Guard: 'Fires from the fort in the siege (uses ammo)',
  Builder: 'Repairs barricades every day',
  Medic: 'Overnight heals the injured (incl. you) based on First Aid; uses meds',
  Scavenger: 'Brings in materials + food every day',
  Generalist: 'Does a bit of everything at half strength'
};
const RC = {Guard: 0x3b82f6, Builder: 0xfb923c, Medic: 0xe5e7eb, Scavenger: 0xfacc15, Generalist: 0x9ca3af};
const NAMES = ['Ava', 'Ben', 'Cora', 'Dan', 'Eli', 'Faye', 'Gus', 'Hana', 'Ivo', 'Jo'];

/* =====================================================================================================
   REVISION 30 - ITEM REGISTRY. Every system (loot, inventories, resources, icons, tooltips) reads items ONLY from ITEMS.
   Spec dimensions are VERTICAL x HORIZONTAL and are kept in vh:[rows,cols]. size:[width,height] is what the grid code uses.
   value = INITIAL resource value. Each item instance carries its own remaining value (inst.rem).
   ===================================================================================================== */
const ITEMS = {},
  ITEM_ORDER = [];
const CATS = {
  melee: 'Melee weapon',
  rifle: 'Rifle',
  pistol: 'Pistol',
  assault: 'Assault rifle',
  smg: 'Submachine gun',
  ammo: 'Ammo',
  food: 'Food',
  meds: 'Medical',
  mat: 'Materials'
};
const RES_KEYS = ['food', 'meds', 'mat', 'ammo'],
  RES_LABEL = {food: 'Food', meds: 'Meds', mat: 'Materials', ammo: 'Ammo'},
  RES_COL = {food: '#facc15', meds: '#ef4444', mat: '#60a5fa', ammo: '#22c55e'};
function defItems(cat, rk, rows) {
  rows.forEach(r => {
    const id = r[0],
      d = r[2].split('x').map(Number);
    if (ITEMS[id]) throw new Error('duplicate item id ' + id);
    ITEMS[id] = {
      id,
      name: r[1],
      cat,
      vh: [d[0], d[1]],
      size: [d[1], d[0]],
      value: rk && r[3] ? {[rk]: r[3]} : null,
      use: r[4] || null
    };
    ITEM_ORDER.push(id);
  });
}
defItems('melee', null, [
  ['sickle', 'Sickle', '3x2'],
  ['machete', 'Machete', '6x1'],
  ['crowbar', 'Crowbar', '6x2'],
  ['baseball_bat', 'Baseball Bat', '7x1'],
  ['shovel', 'Shovel', '9x2'],
  ['fire_axe', 'Fire Axe', '9x4'],
  ['pitchfork', 'Pitchfork', '9x2'],
  ['broadsword', 'Broadsword', '9x2'],
  ['katana', 'Katana', '9x1']
]);
defItems('rifle', null, [
  ['combat_shotgun', 'Combat Shotgun', '3x7'],
  ['model_70_safari', 'Model 70 Safari', '2x11'],
  ['lee_enfield', 'Lee-Enfield', '2x11'],
  ['pump_shotgun', 'Pump Shotgun', '2x7'],
  ['m1_garand', 'M1 Garand', '3x11'],
  ['shotgun', 'Shotgun', '2x9']
]);
defItems('pistol', null, [
  ['beretta_9mm', '9mm Beretta', '2x2'],
  ['desert_eagle', 'Desert Eagle', '2x2'],
  ['colt_detective_special', 'Colt Detective Special', '2x2'],
  ['colt_new_service_revolver', 'Colt New Service Revolver', '2x2'],
  ['colt_python', 'Colt Python', '2x2'],
  ['m1911a1', 'M1911A1', '2x2'],
  ['glock_21', 'Glock 21', '2x2'],
  ['glock_22', 'Glock 22', '2x2']
]);
defItems('assault', null, [
  ['ak47', 'AK-47', '3x8'],
  ['m16', 'M16', '3x8'],
  ['ar90', 'AR-90', '3x8'],
  ['m4', 'M4', '3x7']
]);
defItems('smg', null, [
  ['mac10', 'Mac-10', '3x3'],
  ['uzi', 'Uzi', '3x3'],
  ['tommygun', 'Tommygun', '2x7']
]);
defItems('ammo', 'ammo', [
  ['ammo_303', '.303', '2x2', 20],
  ['ammo_357', '.357', '2x2', 30],
  ['ammo_38_fed', '.38 fed', '2x2', 30],
  ['ammo_38_win', '.38 win', '2x2', 30],
  ['ammo_40', '.40', '2x2', 30],
  ['ammo_44', '.44', '2x2', 30],
  ['ammo_45', '.45', '2x2', 25],
  ['ammo_458', '.458', '2x2', 20],
  ['ammo_12_gauge', '12 Gauge', '2x2', 20],
  ['ammo_556', '5.56', '2x2', 25],
  ['ammo_762', '7.62', '2x2', 25],
  ['ammo_9mm', '9mm', '2x2', 30]
]);
defItems('food', 'food', [
  ['atomic_veggies', 'Atomic Veggies', '3x3', 5],
  ['bacon', 'Bacon', '4x5', 10],
  ['brans', 'Brans', '3x3', 3],
  ['calzones', 'Calzones', '3x3', 8],
  ['cheezholes', 'Cheezholes', '2x2', 2],
  ['cherry_preserves', 'Cherry Preserves', '5x4', 15],
  ['citrol', 'Citrol', '2x2', 1],
  ['colacola', 'ColaCola', '2x2', 1],
  ['fud', 'Fud', '2x2', 3],
  ['granola', 'Granola', '2x2', 10],
  ['herkeys_jerkey', "Herkey's Jerkey", '3x2', 5],
  ['kenball_soup', 'Kenball Soup', '2x2', 3],
  ['lamburger', 'Lamburger', '2x2', 3],
  ['military_rations', 'Military Rations', '3x3', 10],
  ['milk', 'Milk', '3x2', 5],
  ['natural_living', 'Natural Living', '3x3', 5],
  ['peach_preserves', 'Peach Preserves', '4x4', 12],
  ['pickled_herring', 'Pickled Herring', '5x4', 20],
  ['pickles', 'Pickles', '5x4', 15],
  ['pizan_pasta', 'Pizan Pasta', '3x3', 3],
  ['popzi_soft_drink', 'Popzi Soft Drink', '2x2', 1],
  ['ramen_noodles', 'Ramen Noodles', '2x2', 5],
  ['salad', 'Salad', '2x2', 3],
  ['salami', 'Salami', '4x4', 15],
  ['sausages', 'Sausages', '6x4', 12],
  ['smoked_ham', 'Smoked Ham', '5x6', 50],
  ['soylent_greens', 'Soylent Greens', '2x2', 8],
  ['sup_soft_drink', 'Sup soft drink', '2x2', 1],
  ['tweex', 'Tweex', '2x2', 8],
  ['water_jug', 'Water Jug', '3x3', 3],
  ['z_energy_drink', 'Z-Energy Drink', '2x2', 3]
]);
// meds can be used with hover+E: heals use.hp HP for use.cost Meds (less if the item has less left, scaled down)
defItems('meds', 'meds', [
  ['cotton_balls', 'Cotton Balls', '2x2', 1, {hp: 3, cost: 1}],
  ['antibiotics', 'Antibiotics', '2x2', 6, {hp: 12, cost: 3}],
  ['gauze', 'Gauze', '2x2', 3, {hp: 10, cost: 3}],
  ['medical_tape', 'Medical Tape', '2x2', 3, {hp: 8, cost: 3}],
  ['medkit', 'MedKit', '4x4', 10, {hp: 30, cost: 5}],
  ['painkiller', 'PainKiller', '2x2', 6, {hp: 15, cost: 3}]
]);
defItems('mat', 'mat', [
  ['bowling_ball', 'Bowling Ball', '3x3', 5],
  ['bug_spray', 'Bug Spray', '2x2', 5],
  ['bungie_cord', 'Bungie Cord', '3x2', 5],
  ['butcher_knife', 'Butcher Knife', '3x1', 6],
  ['car_battery', 'Car Battery', '2x3', 6],
  ['duct_tape', 'Duct Tape', '2x2', 6],
  ['fire_hose', 'Fire Hose', '4x4', 10],
  ['gas_can', 'Gas Can', '3x3', 8],
  ['gas_cylinder', 'Gas Cylinder', '4x2', 6],
  ['nails', 'Nails', '2x2', 3],
  ['rope', 'Rope', '3x2', 6],
  ['spray_paint', 'Spray Paint', '2x2', 4],
  ['spring', 'Spring', '3x2', 5]
]);

/* ===== v042 NEW ITEMS. Spec sizes are HORIZONTAL x VERTICAL (width x height) and are converted to the registry's vertical x horizontal form. ===== */
function defItemsHV(cat, rk, rows) {
  defItems(
    cat,
    rk,
    rows.map(r => {
      const d = r[2].split('x');
      return [r[0], r[1], d[1] + 'x' + d[0], r[3], r[4]];
    })
  );
}
defItemsHV('food', 'food', [
  ['cereo', 'Cereo', '3x3', 3],
  ['crackers', 'Crackers', '3x3', 2],
  ['224_ramen', '224 Ramen', '2x2', 2],
  ['apollo_meat', 'Apollo Meat', '2x2', 5],
  ['potato_chips', 'Potato Chips', '2x2', 2],
  ['eat_flakes', 'Eat Flakes', '3x3', 3],
  ['stugots_coffee', 'Stugots Coffee', '2x2', 3],
  ['sole_2_sole', 'Sole 2 Sole', '2x2', 3],
  ['famished_guy', 'Famished Guy', '3x3', 6],
  ['salted_bacon', 'Salted Bacon', '5x4', 10],
  ['salted_fish', 'Salted Fish', '3x5', 10],
  ['salted_kipper', 'Salted Kipper', '1x2', 2],
  ['tampopo_ramen', 'Tampopo Ramen', '2x2', 5],
  ['instant_ramen', 'Instant Ramen', '2x2', 2],
  ['sugar', 'Sugar', '2x2', 3],
  ['rice', 'Rice', '2x2', 6],
  ['tuna', 'Tuna', '2x2', 4],
  ['pickled_eggs', 'Pickled Eggs', '4x5', 16],
  ['sardines', 'Sardines', '2x2', 3],
  ['oysters', 'Oysters', '2x2', 2],
  ['cookies', 'Cookies', '3x3', 3],
  ['slaab_steak', 'Slaab Steak', '2x2', 3]
]);
defItemsHV('mat', 'mat', [['hairspray', 'HairSpray', '2x2', 3]]);
/* =====================================================================================================
   REVISION 037 - WEAPON DATA. Every gun and melee weapon, keyed by ITEM ID (so the item registry stays the single source of truth).
   The old 4-slot system (Crowbar / Pistol / Shotgun / Machine Gun, shared G.ammo pool) is gone. A weapon is only usable while the
   item is physically inside the holder's inventory. Guns carry their own loaded rounds on the item instance (inst.clip) and are
   reloaded ONLY from ammo items of their own calibre in that same inventory.
   GUN fields: ammo (item id), cap (rounds in the clip), dmg (per bullet / pellet), pel (pellets per shot), cd (s between shots),
     rlN (rounds loaded per reload step) / rlT (seconds per step; rlN=cap is a magazine swap, rlN=1 loads round by round),
     spr (aim spread), acc (hit chance bonus), rng (effective range m), kick (recoil), snd (sound class), mode (label), auto (hold to fire),
     npcCd / burst (NPC fire interval and rounds per burst), grip / lhand (model hand positions in sprite coords), cellM (model metres per sprite cell)
   MELEE fields: dmg, cd, st (stamina per swing), reach (m), hit (sound class), swing (animation), swD (swing seconds),
     aggro (how close a zombie must be before an NPC walks up to it), npcCd, grip
   ===================================================================================================== */
const FIST = {
  id: 'fist',
  name: 'Fist',
  type: 'melee',
  dmg: 8,
  cd: 0.4,
  st: 5,
  reach: 2.2,
  hit: 'fist',
  swing: 'punch',
  swD: 0.28,
  aggro: 3.2,
  npcCd: 0.8
};
const BASH = {
  id: 'bash',
  name: 'Gun butt',
  type: 'melee',
  dmg: 9,
  cd: 0.65,
  st: 10,
  reach: 2.4,
  hit: 'blunt',
  swing: 'bash',
  swD: 0.34
};
const WDEF = {};
(function () {
  const ML = (id, o) => {
    WDEF[id] = Object.assign({id, type: 'melee', aggro: 7, npcCd: 1.1, grip: [0.5, 0.8]}, o);
  };
  ML('sickle', {dmg: 24, cd: 0.5, st: 9, reach: 2.6, hit: 'blade', swing: 'slash', swD: 0.34, grip: [0.19, 0.82]});
  ML('machete', {dmg: 32, cd: 0.45, st: 10, reach: 2.8, hit: 'blade', swing: 'slash', swD: 0.32, grip: [0.5, 0.8]});
  ML('crowbar', {dmg: 36, cd: 0.6, st: 14, reach: 3.0, hit: 'metal', swing: 'chop', swD: 0.4, grip: [0.46, 0.72]});
  ML('baseball_bat', {dmg: 34, cd: 0.6, st: 14, reach: 3.1, hit: 'blunt', swing: 'chop', swD: 0.4, grip: [0.5, 0.84]});
  ML('shovel', {dmg: 34, cd: 0.8, st: 16, reach: 3.2, hit: 'metal', swing: 'chop', swD: 0.45, grip: [0.5, 0.36]});
  ML('fire_axe', {dmg: 56, cd: 0.95, st: 20, reach: 3.0, hit: 'blade', swing: 'chop', swD: 0.5, grip: [0.5, 0.8]});
  ML('pitchfork', {dmg: 38, cd: 0.8, st: 15, reach: 3.4, hit: 'blade', swing: 'jab', swD: 0.4, grip: [0.5, 0.72]});
  ML('broadsword', {dmg: 52, cd: 0.85, st: 19, reach: 3.1, hit: 'blade', swing: 'slash', swD: 0.42, grip: [0.5, 0.8]});
  ML('katana', {dmg: 48, cd: 0.5, st: 12, reach: 3.0, hit: 'blade', swing: 'slash', swD: 0.3, grip: [0.5, 0.8]});
  const GN = (id, ammo, cap, o) => {
    WDEF[id] = Object.assign(
      {
        id,
        type: 'gun',
        ammo,
        cap,
        rlN: cap,
        rlT: 1.4,
        pel: 1,
        spr: 0.006,
        auto: false,
        acc: 0,
        rng: 35,
        kick: 0.6,
        snd: 'pistol',
        mode: 'Semi-auto',
        cd: 0.25,
        npcCd: 0.7,
        burst: 1,
        grip: [0.4, 0.64],
        lhand: null,
        cellM: 0.105
      },
      o
    );
  };
  const PG = {grip: [0.23, 0.62], cellM: 0.13};
  // ---- pistols & revolvers (2x2 sprites) ----
  GN('beretta_9mm', 'ammo_9mm', 15, Object.assign({dmg: 24, cd: 0.22, rlT: 1.3, snd: 'pistol', npcCd: 0.7}, PG));
  GN(
    'desert_eagle',
    'ammo_44',
    8,
    Object.assign({dmg: 46, cd: 0.5, rlT: 1.6, snd: 'magnum', kick: 1.1, npcCd: 1.2, rng: 40}, PG)
  );
  GN(
    'colt_detective_special',
    'ammo_38_fed',
    6,
    Object.assign(
      {dmg: 22, cd: 0.4, rlN: 1, rlT: 0.5, snd: 'revolver', kick: 0.6, rng: 28, mode: 'Revolver', npcCd: 1.0},
      PG
    )
  );
  GN(
    'colt_new_service_revolver',
    'ammo_38_win',
    6,
    Object.assign(
      {dmg: 27, cd: 0.5, rlN: 1, rlT: 0.5, snd: 'revolver', kick: 0.8, rng: 34, mode: 'Revolver', npcCd: 1.1},
      PG
    )
  );
  GN(
    'colt_python',
    'ammo_357',
    6,
    Object.assign(
      {
        dmg: 36,
        cd: 0.45,
        rlN: 1,
        rlT: 0.5,
        snd: 'magnum',
        kick: 0.95,
        rng: 42,
        acc: 0.04,
        mode: 'Revolver',
        npcCd: 1.1
      },
      PG
    )
  );
  GN('m1911a1', 'ammo_45', 7, Object.assign({dmg: 31, cd: 0.25, rlT: 1.4, snd: 'pistol', kick: 0.7, npcCd: 0.8}, PG));
  GN('glock_21', 'ammo_45', 13, Object.assign({dmg: 30, cd: 0.2, rlT: 1.4, snd: 'pistol', kick: 0.65, npcCd: 0.7}, PG));
  GN('glock_22', 'ammo_40', 15, Object.assign({dmg: 28, cd: 0.2, rlT: 1.3, snd: 'pistol', kick: 0.6, npcCd: 0.7}, PG));
  // ---- submachine guns (automatic) ----
  GN('mac10', 'ammo_45', 30, {
    dmg: 21,
    cd: 0.065,
    auto: true,
    mode: 'Full-auto',
    spr: 0.03,
    rlT: 1.9,
    snd: 'smg',
    rng: 25,
    acc: -0.08,
    kick: 0.35,
    burst: 4,
    npcCd: 1.3,
    grip: [0.41, 0.64],
    cellM: 0.12
  });
  GN('uzi', 'ammo_9mm', 32, {
    dmg: 18,
    cd: 0.08,
    auto: true,
    mode: 'Full-auto',
    spr: 0.026,
    rlT: 1.8,
    snd: 'smg',
    rng: 28,
    acc: -0.05,
    kick: 0.35,
    burst: 4,
    npcCd: 1.3,
    grip: [0.45, 0.62],
    cellM: 0.12
  });
  GN('tommygun', 'ammo_45', 30, {
    dmg: 24,
    cd: 0.09,
    auto: true,
    mode: 'Full-auto',
    spr: 0.028,
    rlT: 2.2,
    snd: 'smg',
    rng: 30,
    acc: -0.03,
    kick: 0.45,
    burst: 4,
    npcCd: 1.4,
    grip: [0.4, 0.64],
    lhand: [0.65, 0.62],
    cellM: 0.115
  });
  // ---- assault rifles (automatic) ----
  GN('ak47', 'ammo_762', 30, {
    dmg: 36,
    cd: 0.11,
    auto: true,
    mode: 'Full-auto',
    spr: 0.02,
    rlT: 2.4,
    snd: 'rifle',
    rng: 55,
    acc: 0.04,
    kick: 0.75,
    burst: 3,
    npcCd: 1.3,
    grip: [0.395, 0.65],
    lhand: [0.72, 0.57]
  });
  GN('m16', 'ammo_556', 30, {
    dmg: 30,
    cd: 0.075,
    auto: true,
    mode: 'Full-auto',
    spr: 0.011,
    rlT: 2.2,
    snd: 'rifle',
    rng: 70,
    acc: 0.06,
    kick: 0.5,
    burst: 3,
    npcCd: 1.2,
    grip: [0.395, 0.65],
    lhand: [0.72, 0.58]
  });
  GN('ar90', 'ammo_556', 30, {
    dmg: 31,
    cd: 0.09,
    auto: true,
    mode: 'Full-auto',
    spr: 0.011,
    rlT: 2.2,
    snd: 'rifle',
    rng: 70,
    acc: 0.1,
    kick: 0.5,
    burst: 3,
    npcCd: 1.2,
    grip: [0.395, 0.65],
    lhand: [0.72, 0.58]
  });
  GN('m4', 'ammo_556', 30, {
    dmg: 29,
    cd: 0.075,
    auto: true,
    mode: 'Full-auto',
    spr: 0.014,
    rlT: 2.0,
    snd: 'rifle',
    rng: 60,
    acc: 0.06,
    kick: 0.45,
    burst: 3,
    npcCd: 1.2,
    grip: [0.395, 0.65],
    lhand: [0.7, 0.58]
  });
  // ---- rifles & shotguns ----
  GN('m1_garand', 'ammo_762', 8, {
    dmg: 42,
    cd: 0.22,
    rlN: 8,
    rlT: 2.3,
    spr: 0.004,
    rng: 80,
    acc: 0.08,
    kick: 0.9,
    snd: 'rifle',
    npcCd: 1.0,
    grip: [0.395, 0.65],
    lhand: [0.7, 0.56]
  });
  GN('lee_enfield', 'ammo_303', 10, {
    dmg: 44,
    cd: 1.0,
    rlN: 5,
    rlT: 1.6,
    spr: 0.003,
    rng: 85,
    acc: 0.1,
    kick: 1.2,
    snd: 'rifle',
    mode: 'Bolt-action',
    npcCd: 1.7,
    grip: [0.395, 0.65],
    lhand: [0.7, 0.56]
  });
  GN('model_70_safari', 'ammo_458', 4, {
    dmg: 95,
    cd: 1.3,
    rlN: 1,
    rlT: 0.9,
    spr: 0.003,
    rng: 90,
    acc: 0.14,
    kick: 2.0,
    snd: 'heavy',
    mode: 'Bolt-action',
    npcCd: 2.0,
    grip: [0.395, 0.65],
    lhand: [0.66, 0.56]
  });
  GN('pump_shotgun', 'ammo_12_gauge', 6, {
    dmg: 11,
    pel: 8,
    cd: 0.8,
    rlN: 1,
    rlT: 0.55,
    spr: 0.05,
    rng: 20,
    acc: 0.05,
    kick: 1.4,
    snd: 'shotgun',
    mode: 'Pump-action',
    npcCd: 1.5,
    grip: [0.395, 0.65],
    lhand: [0.72, 0.63]
  });
  GN('shotgun', 'ammo_12_gauge', 2, {
    dmg: 12,
    pel: 8,
    cd: 0.35,
    rlN: 1,
    rlT: 0.8,
    spr: 0.055,
    rng: 18,
    acc: 0.05,
    kick: 1.5,
    snd: 'shotgun',
    mode: 'Double-barrel',
    npcCd: 1.3,
    grip: [0.395, 0.65],
    lhand: [0.7, 0.56]
  });
  GN('combat_shotgun', 'ammo_12_gauge', 12, {
    dmg: 11,
    pel: 8,
    cd: 0.5,
    rlN: 4,
    rlT: 1.1,
    spr: 0.05,
    rng: 22,
    acc: 0.05,
    kick: 1.3,
    snd: 'shotgun',
    mode: 'Drum-fed pump',
    npcCd: 1.3,
    grip: [0.395, 0.65],
    lhand: [0.72, 0.63]
  });
})();
for (const id in WDEF) {
  const it = ITEMS[id],
    d = WDEF[id];
  if (!it) throw new Error('weapon def for unknown item ' + id);
  if (d.type === 'gun' && !ITEMS[d.ammo]) throw new Error('gun ' + id + ' uses unknown ammo ' + d.ammo);
}
for (const id of ITEM_ORDER) {
  const c = ITEMS[id].cat;
  if ((c === 'melee' || c === 'rifle' || c === 'pistol' || c === 'assault' || c === 'smg') && !WDEF[id])
    throw new Error('weapon item ' + id + ' has no weapon definition');
}
const resOf = id => {
  const it = ITEMS[id];
  return it && it.value ? Object.keys(it.value)[0] : null;
};

/* LOOT TABLES (weights per item id). Same table names / scavenging locations as before; every id is validated below. */
const LOOT_TABLES = {
  clinic: {
    cotton_balls: 5,
    antibiotics: 4,
    gauze: 5,
    medical_tape: 4,
    medkit: 3,
    painkiller: 5,
    water_jug: 1,
    milk: 1,
    duct_tape: 1
  },
  gunshop: {
    ammo_9mm: 5,
    ammo_45: 4,
    ammo_357: 3,
    ammo_38_fed: 3,
    ammo_38_win: 2,
    ammo_40: 3,
    ammo_44: 2,
    ammo_12_gauge: 5,
    ammo_556: 3,
    ammo_762: 3,
    ammo_303: 2,
    ammo_458: 1,
    beretta_9mm: 2,
    glock_21: 2,
    glock_22: 2,
    m1911a1: 2,
    desert_eagle: 1,
    colt_python: 1,
    colt_detective_special: 1,
    colt_new_service_revolver: 1,
    shotgun: 2,
    pump_shotgun: 1,
    combat_shotgun: 1,
    model_70_safari: 1,
    lee_enfield: 1,
    m1_garand: 1,
    ak47: 1,
    m16: 1,
    ar90: 1,
    m4: 1,
    mac10: 1,
    uzi: 1,
    tommygun: 1,
    machete: 1,
    katana: 1,
    baseball_bat: 1
  },
  gas: {
    colacola: 3,
    citrol: 3,
    popzi_soft_drink: 3,
    sup_soft_drink: 3,
    z_energy_drink: 3,
    cheezholes: 3,
    tweex: 3,
    herkeys_jerkey: 3,
    granola: 2,
    fud: 2,
    gas_can: 3,
    gas_cylinder: 2,
    car_battery: 2,
    duct_tape: 2,
    spray_paint: 2,
    bug_spray: 2,
    nails: 2,
    rope: 1,
    ammo_9mm: 1
  },
  diner: {
    bacon: 3,
    sausages: 3,
    smoked_ham: 1,
    salad: 3,
    lamburger: 3,
    pickles: 2,
    pizan_pasta: 3,
    calzones: 3,
    ramen_noodles: 3,
    milk: 2,
    kenball_soup: 3,
    colacola: 2,
    popzi_soft_drink: 1,
    pickled_herring: 1,
    butcher_knife: 1
  },
  hardware: {
    nails: 5,
    rope: 4,
    duct_tape: 4,
    bungie_cord: 4,
    spring: 3,
    fire_hose: 2,
    gas_can: 2,
    gas_cylinder: 2,
    spray_paint: 3,
    bug_spray: 2,
    car_battery: 2,
    bowling_ball: 1,
    butcher_knife: 2,
    crowbar: 3,
    shovel: 2,
    fire_axe: 2,
    pitchfork: 1,
    sickle: 2,
    machete: 2,
    baseball_bat: 1
  },
  house: {
    atomic_veggies: 2,
    brans: 2,
    calzones: 1,
    fud: 1,
    kenball_soup: 3,
    pizan_pasta: 2,
    ramen_noodles: 3,
    granola: 2,
    milk: 2,
    water_jug: 1,
    salad: 1,
    cherry_preserves: 1,
    peach_preserves: 1,
    pickles: 1,
    tweex: 1,
    colacola: 1,
    popzi_soft_drink: 1,
    cheezholes: 2,
    cotton_balls: 2,
    gauze: 2,
    painkiller: 2,
    medical_tape: 1,
    antibiotics: 1,
    nails: 2,
    rope: 2,
    duct_tape: 2,
    spray_paint: 1,
    bug_spray: 1,
    butcher_knife: 1,
    spring: 1,
    bungie_cord: 1,
    baseball_bat: 1,
    crowbar: 1,
    sickle: 1,
    beretta_9mm: 1,
    shotgun: 1,
    ammo_9mm: 1,
    ammo_12_gauge: 1,
    ammo_45: 1
  },
  supermarket: {
    atomic_veggies: 3,
    bacon: 2,
    brans: 3,
    calzones: 2,
    cheezholes: 3,
    cherry_preserves: 2,
    citrol: 3,
    colacola: 3,
    fud: 2,
    granola: 3,
    herkeys_jerkey: 3,
    kenball_soup: 3,
    lamburger: 2,
    military_rations: 1,
    milk: 3,
    natural_living: 3,
    peach_preserves: 2,
    pickled_herring: 1,
    pickles: 2,
    pizan_pasta: 3,
    popzi_soft_drink: 3,
    ramen_noodles: 3,
    salad: 2,
    salami: 2,
    sausages: 2,
    smoked_ham: 1,
    soylent_greens: 2,
    sup_soft_drink: 3,
    tweex: 3,
    water_jug: 2,
    z_energy_drink: 3,
    bug_spray: 1,
    painkiller: 1,
    cotton_balls: 1
  },
  church: {
    cotton_balls: 3,
    gauze: 3,
    painkiller: 2,
    medical_tape: 1,
    granola: 3,
    milk: 2,
    water_jug: 2,
    cherry_preserves: 2,
    peach_preserves: 2,
    pickles: 1,
    rope: 2,
    nails: 1,
    baseball_bat: 1,
    broadsword: 1
  },
  cemetery: {
    shovel: 4,
    sickle: 3,
    rope: 3,
    nails: 2,
    spray_paint: 2,
    bug_spray: 2,
    pitchfork: 2,
    crowbar: 2,
    painkiller: 1
  },
  park: {
    colacola: 2,
    popzi_soft_drink: 2,
    sup_soft_drink: 2,
    citrol: 2,
    tweex: 2,
    granola: 2,
    fud: 1,
    herkeys_jerkey: 1,
    baseball_bat: 3,
    bowling_ball: 1,
    bug_spray: 2,
    rope: 1,
    water_jug: 1,
    sickle: 1
  }
};
for (const t in LOOT_TABLES)
  for (const id in LOOT_TABLES[t]) if (!ITEMS[id]) throw new Error('loot table ' + t + ' has unknown item ' + id);

/* =====================================================================================================
   ICON SYSTEM. Default icons are procedural (kept as the source of truth) and drawn in the item's own aspect ratio at
   32 px per grid cell (so 2x2 = 64x64, 9x1 = 32x288...). Painters work in normalised 0..1 coordinates, so any footprint is filled.
   Resolution order: custom PNG (if loaded OK) -> original procedural icon.  Artwork never touches item ids/sizes/values.
   ===================================================================================================== */
const BPX = 32;
const ICON_SPEC = {
  // food / medical / materials / ammo: [template, main colour, accent colour, label]
  atomic_veggies: ['can', '#2e8b3a', '#9be37a', 'ATOM'],
  bacon: ['bacon'],
  brans: ['box', '#c98a2b', '#f4d58a', 'BRANS'],
  calzones: ['box', '#b5651d', '#f2c078', 'CALZ'],
  cheezholes: ['bag', '#f59e0b', '#fde68a', 'CHZ'],
  cherry_preserves: ['jar', '#9b1c31', '#e11d48', 'CHERRY'],
  citrol: ['drink', '#65a30d', '#ecfccb', 'CITROL'],
  colacola: ['drink', '#7f1d1d', '#ef4444', 'COLA'],
  fud: ['bag', '#64748b', '#cbd5e1', 'FUD'],
  granola: ['bag', '#a16207', '#fde68a', 'GRAN'],
  herkeys_jerkey: ['bag', '#7c2d12', '#fb923c', 'JERKY'],
  kenball_soup: ['can', '#b91c1c', '#fef2f2', 'SOUP'],
  lamburger: ['wrap', '#92400e', '#fcd34d', 'LAMB'],
  military_rations: ['box', '#4d5d2a', '#b7c77a', 'MRE'],
  milk: ['carton', '#f3f4f6', '#60a5fa', 'MILK'],
  natural_living: ['box', '#3f8f4f', '#d9f99d', 'NATURAL'],
  peach_preserves: ['jar', '#d97706', '#fdba74', 'PEACH'],
  pickled_herring: ['jar', '#0e7490', '#a5f3fc', 'HERRING'],
  pickles: ['jar', '#4d7c0f', '#bef264', 'PICKLE'],
  pizan_pasta: ['box', '#b91c1c', '#fde68a', 'PIZAN'],
  popzi_soft_drink: ['drink', '#1d4ed8', '#93c5fd', 'POPZI'],
  ramen_noodles: ['bag', '#dc2626', '#fde047', 'RAMEN'],
  salad: ['tub', '#22c55e', '#bbf7d0', 'SALAD'],
  salami: ['salami'],
  sausages: ['sausage'],
  smoked_ham: ['ham'],
  soylent_greens: ['bag', '#365314', '#a3e635', 'SOY'],
  sup_soft_drink: ['drink', '#f97316', '#fed7aa', 'SUP'],
  tweex: ['bar', '#92400e', '#fbbf24', 'TWEEX'],
  water_jug: ['jug', '#3b82f6', '#dbeafe', 'H2O'],
  z_energy_drink: ['drink', '#111827', '#22d3ee', 'Z'],
  cotton_balls: ['cotton'],
  antibiotics: ['pills', '#d97706', '#fff', 'ABX'],
  gauze: ['roll', '#f3f4f6', '#d1d5db', 'GAUZE'],
  medical_tape: ['roll', '#e8d8b0', '#2563eb', 'TAPE'],
  medkit: ['kit'],
  painkiller: ['pills', '#2563eb', '#fff', 'PAIN'],
  bowling_ball: ['ball'],
  bug_spray: ['spray', '#16a34a', '#fef08a', 'BUG'],
  bungie_cord: ['coil', '#f97316', '#111', 'BUNGIE'],
  butcher_knife: ['knife'],
  car_battery: ['battery'],
  duct_tape: ['roll', '#9ca3af', '#4b5563', 'DUCT'],
  fire_hose: ['coil', '#dc2626', '#fbbf24', 'HOSE'],
  gas_can: ['jerry'],
  gas_cylinder: ['tank'],
  nails: ['nails'],
  rope: ['coil', '#c8a02c', '#7a5a10', 'ROPE'],
  spray_paint: ['spray', '#7c3aed', '#ddd6fe', 'PAINT'],
  spring: ['spring'],
  ammo_303: ['ammo', '#7a5a2b', '.303'],
  ammo_357: ['ammo', '#6b7280', '.357'],
  ammo_38_fed: ['ammo', '#4b5563', '.38F'],
  ammo_38_win: ['ammo', '#71717a', '.38W'],
  ammo_40: ['ammo', '#1f2937', '.40'],
  ammo_44: ['ammo', '#92400e', '.44'],
  ammo_45: ['ammo', '#78350f', '.45'],
  ammo_458: ['ammo', '#3f3f46', '.458'],
  ammo_12_gauge: ['shells', '#b91c1c', '12GA'],
  ammo_556: ['ammo', '#365314', '5.56'],
  ammo_762: ['ammo', '#3f6212', '7.62'],
  ammo_9mm: ['ammo', '#1e3a8a', '9mm']
};
Object.assign(ICON_SPEC, {
  cereo: ['box', '#d97706', '#fde68a', 'CEREO'],
  crackers: ['box', '#c2410c', '#fde68a', 'CRACK'],
  '224_ramen': ['bag', '#b91c1c', '#fde047', '224'],
  apollo_meat: ['meat'],
  potato_chips: ['bag', '#eab308', '#fef9c3', 'CHIPS'],
  eat_flakes: ['box', '#0e7490', '#a5f3fc', 'FLAKES'],
  stugots_coffee: ['can', '#3b2a1a', '#d6b88a', 'JAVA'],
  sole_2_sole: ['tin', '#1e3a8a', '#93c5fd', 'SOLE'],
  famished_guy: ['box', '#7f1d1d', '#fca5a5', 'FAMISH'],
  salted_bacon: ['sbacon'],
  salted_fish: ['fish', '#9aa7b5', '#e5e7eb'],
  salted_kipper: ['fish', '#b8864a', '#f0d9a8'],
  tampopo_ramen: ['bag', '#0d9488', '#fde68a', 'TAMP'],
  instant_ramen: ['bag', '#ea580c', '#fde68a', 'INST'],
  sugar: ['bag', '#f3f4f6', '#93c5fd', 'SUGAR'],
  rice: ['bag', '#e5e7eb', '#a16207', 'RICE'],
  tuna: ['can', '#1d4ed8', '#bfdbfe', 'TUNA'],
  pickled_eggs: ['eggs', '#4d7c0f', '#bef264', 'EGGS'],
  sardines: ['tin', '#b45309', '#fde68a', 'SARD'],
  oysters: ['can', '#475569', '#e2e8f0', 'OYST'],
  cookies: ['box', '#92400e', '#fcd34d', 'COOKIE'],
  hairspray: ['spray', '#db2777', '#fbcfe8', 'HAIR'],
  slaab_steak: ['steak']
});
const TPL = {
  meat: (F, T, a, b, l, x, W, H) => {
    x.fillStyle = '#8a2a22';
    x.beginPath();
    x.ellipse(0.5 * W, 0.52 * H, 0.4 * W, 0.36 * H, 0, 0, 6.3);
    x.fill();
    x.fillStyle = '#c0483a';
    x.beginPath();
    x.ellipse(0.46 * W, 0.46 * H, 0.3 * W, 0.25 * H, 0, 0, 6.3);
    x.fill();
    F('#f1e6d0', 0.78, 0.45, 0.18, 0.1);
    F('#f8fafc', 0.9, 0.4, 0.07, 0.2);
    F('#00000033', 0.18, 0.8, 0.6, 0.05);
    T('APOLLO', '#fff', 0.46, 0.5, 0.11);
  },
  steak: (F, T, a, b, l, x, W, H) => {
    x.fillStyle = '#f3d7d0';
    x.beginPath();
    x.ellipse(0.5 * W, 0.5 * H, 0.42 * W, 0.38 * H, 0, 0, 6.3);
    x.fill();
    x.fillStyle = '#b8322a';
    x.beginPath();
    x.ellipse(0.5 * W, 0.5 * H, 0.35 * W, 0.31 * H, 0, 0, 6.3);
    x.fill();
    x.fillStyle = '#d9544a';
    x.beginPath();
    x.ellipse(0.44 * W, 0.44 * H, 0.2 * W, 0.17 * H, 0, 0, 6.3);
    x.fill();
    F('#f8fafc', 0.66, 0.38, 0.12, 0.1);
    T('SLAAB', '#fff', 0.5, 0.62, 0.13);
  },
  sbacon: (F, T, a, b, l, x, W, H) => {
    for (let i = 0; i < 7; i++) {
      const y = 0.08 + i * 0.125;
      F(i % 2 ? '#b91c1c' : '#f1a58f', 0.08, y, 0.84, 0.1);
      F(i % 2 ? '#f1a58f' : '#b91c1c', 0.08 + (i % 3) * 0.15, y + 0.03, 0.3, 0.04);
    }
    for (let i = 0; i < 22; i++) F('#ffffff', 0.1 + ((i * 37) % 80) / 100, 0.08 + ((i * 53) % 85) / 100, 0.03, 0.03);
    F('#00000044', 0.08, 0.95, 0.84, 0.03);
  },
  fish: (F, T, a, b, l, x, W, H) => {
    const L = Math.max(W, H),
      S = Math.min(W, H);
    x.save();
    x.translate(W / 2, H / 2);
    if (H > W) x.rotate(Math.PI / 2);
    x.fillStyle = a;
    x.beginPath();
    x.ellipse(-0.06 * L, 0, 0.4 * L, 0.3 * S, 0, 0, 6.3);
    x.fill();
    x.fillStyle = b;
    x.beginPath();
    x.ellipse(-0.1 * L, 0.08 * S, 0.3 * L, 0.14 * S, 0, 0, 6.3);
    x.fill();
    x.fillStyle = a;
    x.beginPath();
    x.moveTo(0.3 * L, 0);
    x.lineTo(0.48 * L, -0.3 * S);
    x.lineTo(0.48 * L, 0.3 * S);
    x.closePath();
    x.fill();
    x.fillStyle = '#111';
    x.beginPath();
    x.arc(-0.34 * L, -0.05 * S, Math.max(1.5, 0.035 * L), 0, 6.3);
    x.fill();
    x.fillStyle = '#ffffffcc';
    for (let i = 0; i < 8; i++)
      x.fillRect(
        (-0.3 + i * 0.07) * L,
        (-0.16 + ((i * 5) % 4) * 0.08) * S,
        Math.max(1, 0.02 * L),
        Math.max(1, 0.02 * L)
      );
    x.restore();
  },
  tin: (F, T, a, b, l, x, W, H) => {
    F('#9aa0a6', 0.1, 0.28, 0.8, 0.52);
    F(a, 0.14, 0.33, 0.72, 0.42);
    F('#cfd3d7', 0.1, 0.28, 0.8, 0.06);
    F('#00000044', 0.1, 0.78, 0.8, 0.04);
    F('#cfd3d7', 0.76, 0.2, 0.14, 0.1);
    x.fillStyle = b;
    x.beginPath();
    x.ellipse(0.3 * W, 0.54 * H, 0.14 * W, 0.07 * H, 0, 0, 6.3);
    x.fill();
    T(l, '#fff', 0.62, 0.55, 0.15);
  },
  eggs: (F, T, a, b, l, x, W, H) => {
    F('#cfe8f0', 0.14, 0.14, 0.72, 0.78);
    F(a, 0.18, 0.34, 0.64, 0.54);
    F('#d4a017', 0.12, 0.05, 0.76, 0.12);
    x.fillStyle = '#f8f3d8';
    [
      [0.32, 0.5],
      [0.55, 0.46],
      [0.7, 0.58],
      [0.4, 0.68],
      [0.62, 0.74],
      [0.3, 0.82]
    ].forEach(p => {
      x.beginPath();
      x.ellipse(p[0] * W, p[1] * H, 0.09 * W, 0.065 * H, 0, 0, 6.3);
      x.fill();
    });
    F('#f5f5f4', 0.2, 0.2, 0.6, 0.12);
    T(l, '#222', 0.5, 0.26, 0.07);
  },
  can: (F, T, a, b, l) => {
    F('#9aa0a6', 0.2, 0.1, 0.6, 0.8);
    F(a, 0.2, 0.16, 0.6, 0.68);
    F(b, 0.2, 0.38, 0.6, 0.26);
    F('#cfd3d7', 0.2, 0.1, 0.6, 0.06);
    F('#cfd3d7', 0.2, 0.84, 0.6, 0.06);
    F('#ffffff55', 0.27, 0.18, 0.06, 0.62);
    T(l, '#111', 0.5, 0.51, 0.17);
  },
  drink: (F, T, a, b, l) => {
    F('#bfc4c9', 0.25, 0.08, 0.5, 0.84);
    F(a, 0.25, 0.14, 0.5, 0.72);
    F(b, 0.25, 0.4, 0.5, 0.22);
    F('#e5e7eb', 0.3, 0.04, 0.4, 0.06);
    F('#ffffff55', 0.3, 0.16, 0.05, 0.66);
    T(l, '#fff', 0.5, 0.51, 0.15);
  },
  box: (F, T, a, b, l) => {
    F(a, 0.12, 0.08, 0.76, 0.84);
    F(b, 0.12, 0.08, 0.76, 0.2);
    F('#00000066', 0.12, 0.86, 0.76, 0.06);
    F(b, 0.2, 0.36, 0.6, 0.34);
    T(l, '#222', 0.5, 0.53, 0.15);
  },
  bag: (F, T, a, b, l) => {
    F(a, 0.14, 0.1, 0.72, 0.8);
    for (let i = 0; i < 6; i++) {
      F(b, 0.14 + i * 0.12, 0.06, 0.06, 0.05);
      F(b, 0.14 + i * 0.12, 0.9, 0.06, 0.05);
    }
    F(b, 0.24, 0.34, 0.52, 0.3);
    F('#ffffff44', 0.18, 0.14, 0.05, 0.7);
    T(l, '#222', 0.5, 0.49, 0.15);
  },
  jar: (F, T, a, b, l) => {
    F('#cfe8f0', 0.2, 0.16, 0.6, 0.76);
    F(a, 0.24, 0.34, 0.52, 0.54);
    F(b, 0.24, 0.34, 0.52, 0.06);
    F('#d4a017', 0.2, 0.06, 0.6, 0.12);
    F('#f5f5f4', 0.26, 0.5, 0.48, 0.24);
    T(l, '#222', 0.5, 0.62, 0.12);
  },
  jug: (F, T, a, b, l) => {
    F(a, 0.2, 0.2, 0.6, 0.72);
    F(b, 0.34, 0.04, 0.32, 0.18);
    F('#e5e7eb', 0.38, 0.02, 0.24, 0.05);
    F(b, 0.78, 0.28, 0.1, 0.3);
    F('#ffffff', 0.26, 0.42, 0.48, 0.26);
    T(l, '#222', 0.5, 0.55, 0.17);
  },
  carton: (F, T, a, b, l) => {
    F(a, 0.2, 0.28, 0.6, 0.64);
    F(b, 0.2, 0.28, 0.6, 0.14);
    F('#e5e7eb', 0.3, 0.1, 0.4, 0.2);
    F('#cbd5e1', 0.4, 0.04, 0.2, 0.08);
    T(l, '#1e3a8a', 0.5, 0.66, 0.16);
  },
  tub: (F, T, a, b, l) => {
    F('#e5e7eb', 0.12, 0.3, 0.76, 0.6);
    F(a, 0.16, 0.2, 0.68, 0.2);
    F(b, 0.2, 0.14, 0.2, 0.1);
    F(b, 0.5, 0.12, 0.2, 0.12);
    F('#ffffff88', 0.14, 0.5, 0.72, 0.2);
    T(l, '#222', 0.5, 0.62, 0.15);
  },
  bar: (F, T, a, b, l) => {
    F(a, 0.1, 0.28, 0.8, 0.44);
    F(b, 0.1, 0.28, 0.8, 0.1);
    F(b, 0.1, 0.62, 0.8, 0.1);
    F('#00000044', 0.1, 0.7, 0.8, 0.04);
    T(l, '#fff', 0.5, 0.5, 0.17);
  },
  wrap: (F, T, a, b, l) => {
    F('#d4d4d8', 0.1, 0.22, 0.8, 0.56);
    F(a, 0.14, 0.28, 0.72, 0.44);
    F(b, 0.14, 0.28, 0.72, 0.08);
    F(b, 0.14, 0.64, 0.72, 0.08);
    T(l, '#fff', 0.5, 0.5, 0.18);
  },
  ham: (F, T, a, b, l, x, W, H) => {
    x.fillStyle = '#e6b9a6';
    x.beginPath();
    x.ellipse(0.84 * W, 0.5 * H, 0.07 * W, 0.07 * H, 0, 0, 6.3);
    x.fill();
    F('#f8fafc', 0.84, 0.46, 0.14, 0.08);
    x.fillStyle = '#b4532a';
    x.beginPath();
    x.ellipse(0.5 * W, 0.5 * H, 0.4 * W, 0.36 * H, 0, 0, 6.3);
    x.fill();
    x.fillStyle = '#d9783f';
    x.beginPath();
    x.ellipse(0.46 * W, 0.44 * H, 0.3 * W, 0.24 * H, 0, 0, 6.3);
    x.fill();
    F('#f2d3b8', 0.2, 0.7, 0.5, 0.07);
    F('#00000033', 0.2, 0.16, 0.55, 0.04);
    T('HAM', '#fff', 0.46, 0.46, 0.14);
  },
  bacon: (F, T, a, b, l, x, W, H) => {
    for (let i = 0; i < 7; i++) {
      const y = 0.08 + i * 0.125;
      F(i % 2 ? '#b91c1c' : '#f1a58f', 0.08, y, 0.84, 0.1);
      F(i % 2 ? '#f1a58f' : '#b91c1c', 0.08 + (i % 3) * 0.15, y + 0.03, 0.3, 0.04);
    }
    F('#00000044', 0.08, 0.95, 0.84, 0.03);
  },
  salami: (F, T, a, b, l, x, W, H) => {
    x.save();
    x.translate(W / 2, H / 2);
    x.rotate(-0.7);
    x.fillStyle = '#7f1d1d';
    x.fillRect(-0.5 * W, -0.14 * H, W, 0.28 * H);
    x.fillStyle = '#b4533a';
    x.fillRect(-0.5 * W, -0.14 * H, W, 0.07 * H);
    x.fillStyle = '#e5e7eb';
    for (let i = -4; i < 5; i++) x.fillRect(i * 0.1 * W, -0.14 * H, 0.02 * W, 0.28 * H);
    x.fillStyle = '#d6c9a0';
    x.fillRect(0.46 * W, -0.14 * H, 0.05 * W, 0.28 * H);
    x.restore();
    F('#d6c9a0', 0.1, 0.1, 0.03, 0.2);
  },
  sausage: (F, T, a, b, l, x, W, H) => {
    for (let i = 0; i < 3; i++) {
      x.fillStyle = '#a8452f';
      x.beginPath();
      x.ellipse(0.5 * W, (0.2 + i * 0.3) * H, 0.3 * W, 0.13 * H, 0, 0, 6.3);
      x.fill();
      x.fillStyle = '#c9654a';
      x.fillRect(0.3 * W, (0.14 + i * 0.3) * H, 0.35 * W, 0.03 * H);
    }
    F('#e5e7eb', 0.47, 0.02, 0.06, 0.96);
  },
  cotton: (F, T, a, b, l, x, W, H) => {
    F('#93c5fd', 0.16, 0.3, 0.68, 0.6);
    F('#dbeafe', 0.16, 0.3, 0.68, 0.08);
    x.fillStyle = '#fff';
    [
      [0.3, 0.2],
      [0.5, 0.14],
      [0.7, 0.2],
      [0.42, 0.26],
      [0.6, 0.28]
    ].forEach(p => {
      x.beginPath();
      x.arc(p[0] * W, p[1] * H, 0.12 * W, 0, 6.3);
      x.fill();
    });
    T('COTTON', '#1e3a8a', 0.5, 0.62, 0.13);
  },
  pills: (F, T, a, b, l) => {
    F(a, 0.26, 0.24, 0.48, 0.68);
    F('#ffffff55', 0.3, 0.28, 0.05, 0.58);
    F('#f8fafc', 0.22, 0.1, 0.56, 0.16);
    F(b, 0.3, 0.44, 0.4, 0.3);
    T(l, '#222', 0.5, 0.59, 0.14);
  },
  roll: (F, T, a, b, l, x, W, H) => {
    x.fillStyle = a;
    x.beginPath();
    x.ellipse(0.5 * W, 0.5 * H, 0.4 * W, 0.4 * H, 0, 0, 6.3);
    x.fill();
    x.fillStyle = b;
    x.beginPath();
    x.ellipse(0.5 * W, 0.5 * H, 0.27 * W, 0.27 * H, 0, 0, 6.3);
    x.fill();
    x.fillStyle = '#0e0e0e';
    x.beginPath();
    x.ellipse(0.5 * W, 0.5 * H, 0.15 * W, 0.15 * H, 0, 0, 6.3);
    x.fill();
    T(l, '#fff', 0.5, 0.87, 0.11);
  },
  kit: (F, T) => {
    F('#c0392b', 0.08, 0.16, 0.84, 0.72);
    F('#7f1d1d', 0.36, 0.06, 0.28, 0.1);
    F('#00000055', 0.08, 0.82, 0.84, 0.06);
    F('#fff', 0.42, 0.28, 0.16, 0.48);
    F('#fff', 0.28, 0.42, 0.44, 0.2);
    F('#9ca3af', 0.08, 0.5, 0.84, 0.03);
  },
  ball: (F, T, a, b, l, x, W, H) => {
    x.fillStyle = '#1f2a5a';
    x.beginPath();
    x.ellipse(0.5 * W, 0.5 * H, 0.42 * W, 0.42 * H, 0, 0, 6.3);
    x.fill();
    x.fillStyle = '#3b4d9a';
    x.beginPath();
    x.ellipse(0.4 * W, 0.38 * H, 0.14 * W, 0.12 * H, 0, 0, 6.3);
    x.fill();
    x.fillStyle = '#050510';
    [
      [0.42, 0.46],
      [0.56, 0.42],
      [0.5, 0.6]
    ].forEach(p => {
      x.beginPath();
      x.arc(p[0] * W, p[1] * H, 0.05 * W, 0, 6.3);
      x.fill();
    });
  },
  spray: (F, T, a, b, l) => {
    F(a, 0.3, 0.3, 0.4, 0.62);
    F('#9aa0a6', 0.3, 0.2, 0.4, 0.12);
    F('#111', 0.4, 0.08, 0.2, 0.12);
    F('#fff', 0.5, 0.04, 0.14, 0.05);
    F(b, 0.3, 0.5, 0.4, 0.2);
    F('#ffffff44', 0.34, 0.32, 0.04, 0.58);
    T(l, '#111', 0.5, 0.6, 0.12);
  },
  coil: (F, T, a, b, l, x, W, H) => {
    x.lineWidth = Math.max(3, 0.1 * Math.min(W, H));
    x.strokeStyle = a;
    for (let i = 0; i < 3; i++) {
      x.beginPath();
      x.ellipse(0.5 * W, 0.5 * H, (0.36 - i * 0.09) * W, (0.36 - i * 0.09) * H, 0, 0, 6.3);
      x.stroke();
    }
    x.strokeStyle = b;
    x.lineWidth = Math.max(2, 0.03 * Math.min(W, H));
    x.beginPath();
    x.moveTo(0.78 * W, 0.7 * H);
    x.lineTo(0.94 * W, 0.9 * H);
    x.stroke();
    T(l, '#fff', 0.5, 0.5, 0.1);
  },
  knife: F => {
    F('#d1d5db', 0.3, 0.04, 0.55, 0.58);
    F('#f9fafb', 0.3, 0.04, 0.12, 0.58);
    F('#6b7280', 0.3, 0.58, 0.55, 0.04);
    F('#3b2a1a', 0.4, 0.62, 0.3, 0.34);
    F('#9ca3af', 0.46, 0.7, 0.04, 0.04);
    F('#9ca3af', 0.46, 0.84, 0.04, 0.04);
  },
  battery: (F, T) => {
    F('#1f2937', 0.06, 0.28, 0.88, 0.66);
    F('#facc15', 0.06, 0.28, 0.88, 0.1);
    F('#374151', 0.06, 0.7, 0.88, 0.24);
    F('#9ca3af', 0.16, 0.14, 0.14, 0.14);
    F('#9ca3af', 0.7, 0.14, 0.14, 0.14);
    T('+', '#ef4444', 0.23, 0.5, 0.2);
    T('-', '#60a5fa', 0.77, 0.5, 0.2);
    F('#e5e7eb', 0.3, 0.5, 0.4, 0.16);
  },
  jerry: (F, T) => {
    F('#3a5a2a', 0.12, 0.14, 0.76, 0.8);
    F('#2a4a1a', 0.12, 0.14, 0.76, 0.1);
    F('#4a7a2a', 0.22, 0.34, 0.56, 0.5);
    F('#111', 0.18, 0.04, 0.2, 0.12);
    F('#111', 0.18, 0.04, 0.5, 0.05);
    F('#888', 0.6, 0.04, 0.12, 0.1);
    F('#1a2a0a', 0.12, 0.9, 0.76, 0.04);
    F('#facc15', 0.42, 0.5, 0.16, 0.16);
  },
  tank: (F, T) => {
    F('#2563eb', 0.24, 0.18, 0.52, 0.78);
    F('#1e40af', 0.24, 0.18, 0.52, 0.08);
    F('#60a5fa', 0.3, 0.26, 0.07, 0.6);
    F('#9ca3af', 0.4, 0.08, 0.2, 0.1);
    F('#6b7280', 0.34, 0.02, 0.32, 0.07);
    F('#e5e7eb', 0.24, 0.5, 0.52, 0.14);
    T('GAS', '#111', 0.5, 0.57, 0.12);
  },
  nails: (F, T, a, b, l, x, W, H) => {
    F('#78350f', 0.1, 0.5, 0.8, 0.4);
    F('#92400e', 0.1, 0.5, 0.8, 0.08);
    for (let i = 0; i < 7; i++) {
      F('#d4d4d8', 0.16 + i * 0.1, 0.12 + (i % 2) * 0.06, 0.03, 0.46);
      F('#9ca3af', 0.14 + i * 0.1, 0.1 + (i % 2) * 0.06, 0.07, 0.04);
    }
    T('NAILS', '#fde68a', 0.5, 0.74, 0.15);
  },
  spring: (F, T, a, b, l, x, W, H) => {
    x.strokeStyle = '#cbd5e1';
    x.lineWidth = Math.max(2, 0.04 * Math.min(W, H));
    x.beginPath();
    for (let i = 0; i <= 7; i++) {
      const t = i / 7;
      x.lineTo((0.5 + (i % 2 ? 0.3 : -0.3)) * W, (0.08 + t * 0.84) * H);
    }
    x.stroke();
    x.strokeStyle = '#6b7280';
    x.lineWidth = 1;
    x.stroke();
  },
  ammo: (F, T, a, l) => {
    F(a, 0.1, 0.28, 0.8, 0.62);
    F('#00000055', 0.1, 0.84, 0.8, 0.06);
    F('#e5e7eb', 0.1, 0.28, 0.8, 0.1);
    for (let i = 0; i < 5; i++) {
      F('#d4a017', 0.16 + i * 0.15, 0.1, 0.1, 0.2);
      F('#f5d46a', 0.16 + i * 0.15, 0.1, 0.04, 0.2);
    }
    T(l, '#fff', 0.5, 0.62, 0.2);
  },
  shells: (F, T, a, l) => {
    F('#374151', 0.1, 0.5, 0.8, 0.4);
    for (let i = 0; i < 4; i++) {
      F(a, 0.12 + i * 0.2, 0.1, 0.14, 0.5);
      F('#d4a017', 0.12 + i * 0.2, 0.52, 0.14, 0.1);
      F('#f5d46a', 0.12 + i * 0.2, 0.1, 0.14, 0.06);
    }
    T(l, '#fff', 0.5, 0.74, 0.18);
  }
};
/* weapons: long guns, pistols, SMGs and melee tools are assembled from a few shared shapes with per-item parameters */
function gunLong(F, o) {
  const w = o.wood || '#7a4a22',
    m = o.metal || '#3a4046',
    d = '#15171a',
    p = '#23272b',
    S = o.stock === 'poly' || o.stock === 'fold' ? p : w;
  if (o.stock === 'fold') {
    F(m, 0.03, 0.4, 0.24, 0.05);
    F(m, 0.03, 0.4, 0.03, 0.26);
    F(p, 0.02, 0.38, 0.05, 0.3);
  } else if (o.stock !== 'none') {
    F(S, 0.02, 0.4, 0.07, 0.34);
    F(S, 0.07, 0.42, 0.26, 0.2);
    F(S, 0.18, 0.5, 0.15, 0.1);
  }
  F(m, 0.3, 0.38, 0.3, 0.2);
  F(d, 0.3, 0.38, 0.3, 0.03);
  F(d, 0.52, 0.42, 0.05, 0.06);
  F(d, 0.44, 0.58, 0.05, 0.1);
  F(o.pg ? p : w, 0.36, 0.58, 0.07, 0.2);
  if (o.hg === 'wood') F(w, 0.6, 0.4, 0.24, 0.17);
  else if (o.hg === 'poly') F(p, 0.6, 0.39, 0.26, 0.19);
  F(m, 0.6, 0.44, 0.38, 0.06);
  if (o.dbl) F(m, 0.6, 0.5, 0.38, 0.06);
  F(d, 0.95, 0.4, 0.04, 0.14);
  if (o.carry) F(m, 0.34, 0.3, 0.16, 0.08);
  if (o.scope) {
    F(d, 0.32, 0.2, 0.32, 0.08);
    F(m, 0.37, 0.28, 0.03, 0.1);
    F(m, 0.56, 0.28, 0.03, 0.1);
    F('#5ab6d8', 0.64, 0.2, 0.02, 0.08);
  }
  if (o.pump) F(w, 0.62, 0.55, 0.2, 0.1);
  if (o.mag === 'box') F(d, 0.46, 0.58, 0.08, 0.3);
  else if (o.mag === 'curve') {
    F(d, 0.46, 0.58, 0.08, 0.18);
    F(d, 0.5, 0.74, 0.08, 0.14);
    F(d, 0.54, 0.84, 0.06, 0.06);
  } else if (o.mag === 'drum') {
    F(d, 0.44, 0.58, 0.16, 0.3);
    F('#444', 0.47, 0.64, 0.1, 0.04);
  } else if (o.mag === 'tube') F(m, 0.58, 0.53, 0.36, 0.05);
}
function gunSmg(F, o) {
  const m = '#3a4046',
    d = '#15171a',
    p = '#23272b',
    w = '#7a4a22';
  if (o.id === 'tommygun') {
    F(w, 0.02, 0.4, 0.3, 0.22);
    F(w, 0.06, 0.44, 0.1, 0.2);
    F(m, 0.3, 0.36, 0.34, 0.2);
    F(d, 0.3, 0.36, 0.34, 0.03);
    F(w, 0.36, 0.56, 0.07, 0.2);
    F(d, 0.42, 0.54, 0.14, 0.32);
    F('#555', 0.45, 0.6, 0.08, 0.04);
    F(w, 0.62, 0.5, 0.06, 0.22);
    F(m, 0.64, 0.4, 0.34, 0.07);
    for (let i = 0; i < 4; i++) F(d, 0.68 + i * 0.06, 0.38, 0.025, 0.12);
  } else if (o.id === 'uzi') {
    F(m, 0.1, 0.24, 0.62, 0.3);
    F(d, 0.1, 0.24, 0.62, 0.05);
    F(d, 0.7, 0.3, 0.22, 0.08);
    F(p, 0.38, 0.54, 0.14, 0.36);
    F(m, 0.04, 0.3, 0.08, 0.04);
    F(m, 0.04, 0.3, 0.03, 0.24);
    F('#888', 0.2, 0.3, 0.2, 0.04);
    F(d, 0.5, 0.5, 0.04, 0.08);
  } else {
    F(m, 0.14, 0.28, 0.6, 0.28);
    F(d, 0.14, 0.28, 0.6, 0.05);
    F(d, 0.72, 0.34, 0.2, 0.07);
    F(p, 0.34, 0.56, 0.14, 0.34);
    F(m, 0.04, 0.34, 0.1, 0.03);
    F(m, 0.04, 0.34, 0.03, 0.22);
    F('#888', 0.22, 0.34, 0.28, 0.04);
  }
}
function gunPistol(F, o) {
  const m = o.col || '#3a4046',
    g = o.grip || '#222',
    d = '#111',
    T = o.T;
  if (o.rev) {
    F(m, 0.14, 0.3, 0.2, 0.16);
    F(g, 0.12, 0.44, 0.22, 0.4);
    F(m, 0.34, 0.3, 0.16, 0.24);
    F(d, 0.34, 0.38, 0.16, 0.02);
    F(m, 0.48, 0.34, o.long ? 0.44 : 0.28, 0.08);
    F(d, 0.48, 0.34, o.long ? 0.44 : 0.28, 0.02);
    if (o.long) F(m, 0.48, 0.42, 0.4, 0.04);
    F(m, 0.4, 0.5, 0.04, 0.1);
    F(d, 0.34, 0.5, 0.1, 0.04);
    F(m, 0.12, 0.26, 0.06, 0.06);
  } else {
    F(m, 0.12, 0.26, 0.72, o.big ? 0.26 : 0.2);
    F(d, 0.12, 0.26, 0.72, 0.03);
    F(m, 0.82, 0.3, 0.1, 0.12);
    F(g, 0.12, 0.46, 0.22, 0.42);
    F(m, 0.3, 0.5, 0.36, 0.05);
    F(d, 0.4, 0.55, 0.06, 0.1);
    if (o.big) F('#ffffff33', 0.2, 0.3, 0.5, 0.04);
    if (o.lab) T(o.lab, '#aaa', 0.55, 0.4, 0.12);
  }
}
function meleePaint(id, F, x, W, H) {
  const wd = '#7a4a22',
    st = '#cfd5da',
    dk = '#6b7280',
    red = '#a31212';
  if (id === 'machete') {
    F(st, 0.25, 0.04, 0.5, 0.6);
    F('#fff', 0.25, 0.04, 0.1, 0.6);
    F(dk, 0.25, 0.6, 0.5, 0.04);
    F('#222', 0.3, 0.64, 0.4, 0.3);
  } else if (id === 'baseball_bat') {
    F('#c89a5a', 0.3, 0.04, 0.4, 0.22);
    F('#c89a5a', 0.34, 0.26, 0.32, 0.3);
    F('#c89a5a', 0.4, 0.56, 0.2, 0.3);
    F('#8a5a2a', 0.4, 0.86, 0.2, 0.08);
    F('#8a5a2a', 0.34, 0.94, 0.32, 0.04);
    F('#fff5', 0.34, 0.06, 0.06, 0.7);
  } else if (id === 'katana') {
    F('#e5e7eb', 0.38, 0.02, 0.24, 0.62);
    F('#fff', 0.38, 0.02, 0.07, 0.6);
    F('#d4a017', 0.2, 0.64, 0.6, 0.04);
    F('#111', 0.4, 0.68, 0.2, 0.26);
    F('#b91c1c', 0.4, 0.74, 0.2, 0.03);
    F('#b91c1c', 0.4, 0.82, 0.2, 0.03);
    F('#d4a017', 0.36, 0.94, 0.28, 0.04);
  } else if (id === 'broadsword') {
    F(st, 0.32, 0.02, 0.36, 0.6);
    F('#fff', 0.32, 0.02, 0.08, 0.6);
    F('#9ca3af', 0.46, 0.06, 0.04, 0.5);
    F('#d4a017', 0.08, 0.62, 0.84, 0.06);
    F('#b8860b', 0.08, 0.68, 0.84, 0.02);
    F('#3b2a1a', 0.42, 0.7, 0.16, 0.2);
    F('#d4a017', 0.38, 0.9, 0.24, 0.07);
  } else if (id === 'shovel') {
    F(wd, 0.46, 0.1, 0.08, 0.55);
    F(wd, 0.3, 0.06, 0.4, 0.05);
    F(wd, 0.3, 0.06, 0.06, 0.12);
    F(wd, 0.64, 0.06, 0.06, 0.12);
    F('#9ca3af', 0.25, 0.62, 0.5, 0.32);
    F('#cbd5e1', 0.25, 0.62, 0.5, 0.05);
    F(dk, 0.46, 0.62, 0.08, 0.1);
    F('#00000033', 0.25, 0.9, 0.5, 0.04);
  } else if (id === 'pitchfork') {
    F(wd, 0.47, 0.3, 0.06, 0.68);
    F('#9ca3af', 0.25, 0.26, 0.5, 0.05);
    F('#9ca3af', 0.25, 0.02, 0.06, 0.26);
    F('#9ca3af', 0.47, 0.0, 0.06, 0.28);
    F('#9ca3af', 0.69, 0.02, 0.06, 0.26);
    F('#d1d5db', 0.25, 0.02, 0.02, 0.2);
  } else if (id === 'fire_axe') {
    F(wd, 0.46, 0.04, 0.08, 0.92);
    F(red, 0.1, 0.06, 0.36, 0.2);
    F('#cbd5e1', 0.04, 0.04, 0.12, 0.26);
    F('#9ca3af', 0.54, 0.1, 0.1, 0.1);
    F('#9ca3af', 0.54, 0.06, 0.3, 0.04);
    F(red, 0.54, 0.06, 0.2, 0.04);
    F('#3b2a1a', 0.44, 0.8, 0.12, 0.16);
    F('#fff4', 0.1, 0.08, 0.3, 0.03);
  } else if (id === 'crowbar') {
    F('#a31212', 0.4, 0.14, 0.12, 0.82);
    F('#c22', 0.4, 0.14, 0.04, 0.82);
    F('#a31212', 0.18, 0.08, 0.3, 0.1);
    F('#a31212', 0.14, 0.04, 0.1, 0.18);
    F('#7a0b0b', 0.14, 0.04, 0.1, 0.04);
    F('#a31212', 0.52, 0.9, 0.16, 0.06);
    F('#7a0b0b', 0.4, 0.94, 0.12, 0.04);
  } else if (id === 'sickle') {
    x.strokeStyle = '#d1d5db';
    x.lineWidth = Math.max(3, 0.1 * W);
    x.beginPath();
    x.arc(0.5 * W, 0.55 * H, 0.32 * W, Math.PI * 1.1, Math.PI * 2.2);
    x.stroke();
    x.strokeStyle = '#fff';
    x.lineWidth = 1;
    x.stroke();
    F(wd, 0.1, 0.7, 0.16, 0.26);
    F('#3b2a1a', 0.08, 0.9, 0.2, 0.06);
  } else F('#888', 0.4, 0.1, 0.2, 0.8);
}
const GUNS = {
  combat_shotgun: ['L', {stock: 'poly', hg: 'poly', mag: 'drum', pump: 1, pg: 1}],
  model_70_safari: ['L', {stock: 'wood', hg: 'none', mag: 'none', scope: 1}],
  lee_enfield: ['L', {stock: 'wood', hg: 'wood', mag: 'box'}],
  pump_shotgun: ['L', {stock: 'wood', mag: 'tube', pump: 1}],
  m1_garand: ['L', {stock: 'wood', hg: 'wood', mag: 'none', carry: 0}],
  shotgun: ['L', {stock: 'wood', dbl: 1, hg: 'wood'}],
  ak47: ['L', {stock: 'wood', hg: 'wood', mag: 'curve', pg: 0}],
  m16: ['L', {stock: 'poly', hg: 'poly', mag: 'box', carry: 1, pg: 1}],
  ar90: ['L', {stock: 'poly', hg: 'poly', mag: 'box', scope: 1, pg: 1}],
  m4: ['L', {stock: 'fold', hg: 'poly', mag: 'box', carry: 1, pg: 1}],
  mac10: ['S', {id: 'mac10'}],
  uzi: ['S', {id: 'uzi'}],
  tommygun: ['S', {id: 'tommygun'}],
  beretta_9mm: ['P', {col: '#2c3036', grip: '#4a3a2a'}],
  desert_eagle: ['P', {col: '#9aa1a8', grip: '#222', big: 1}],
  colt_detective_special: ['P', {rev: 1, col: '#5b6168', grip: '#5a3a1a'}],
  colt_new_service_revolver: ['P', {rev: 1, long: 1, col: '#33383d', grip: '#6a4a2a'}],
  colt_python: ['P', {rev: 1, long: 1, col: '#b5bbc1', grip: '#2a2a2a'}],
  m1911a1: ['P', {col: '#464c52', grip: '#3a2a1a'}],
  glock_21: ['P', {col: '#1c1f22', grip: '#1c1f22', big: 1, lab: '21'}],
  glock_22: ['P', {col: '#2a2d31', grip: '#2a2d31', lab: '22'}]
};
const DEFC = {};
function defaultIcon(id) {
  if (DEFC[id]) return DEFC[id];
  const it = ITEMS[id];
  if (!it) return null;
  const W = it.size[0] * BPX,
    H = it.size[1] * BPX,
    c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const x = c.getContext('2d');
  x.fillStyle = '#0e0e0e';
  x.fillRect(0, 0, W, H);
  const F = (col, a, b, w, h) => {
    x.fillStyle = col;
    const X = Math.round(a * W),
      Y = Math.round(b * H);
    x.fillRect(X, Y, Math.max(1, Math.round((a + w) * W) - X), Math.max(1, Math.round((b + h) * H) - Y));
  };
  const T = (t, col, cx, cy, sz) => {
    x.fillStyle = col;
    x.font = 'bold ' + Math.max(7, Math.round(sz * Math.min(W, H) * 1.15)) + 'px monospace';
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.fillText(t, cx * W, cy * H);
  };
  try {
    const g = GUNS[id],
      sp = ICON_SPEC[id];
    if (g) {
      if (g[0] === 'L') gunLong(F, g[1]);
      else if (g[0] === 'S') gunSmg(F, Object.assign({T}, g[1]));
      else gunPistol(F, Object.assign({T}, g[1]));
    } else if (it.cat === 'melee') meleePaint(id, F, x, W, H);
    else if (sp) {
      const f = TPL[sp[0]];
      if (sp[0] === 'ammo' || sp[0] === 'shells') f(F, T, sp[1], sp[2]);
      else f(F, T, sp[1], sp[2], sp[3], x, W, H);
    } else F('#666', 0.3, 0.3, 0.4, 0.4);
  } catch (e) {
    x.fillStyle = '#666';
    x.fillRect(W * 0.3, H * 0.3, W * 0.4, H * 0.4);
  }
  x.strokeStyle = '#222';
  x.lineWidth = 2;
  x.strokeRect(1, 1, W - 2, H - 2);
  DEFC[id] = c;
  return c;
}

/* custom PNG overrides (decoded ONCE and cached in ICU; nothing is re-decoded on redraw) */
const ICU = {};
let icoVer = 0,
  icoPersistOK = true;
function customSrc(id) {
  const u = ICU[id];
  return u && u.img ? u.img : null;
}
function hasCustom(id) {
  return !!customSrc(id);
}
function paintIcon(x, img, pw, ph, rot, custom) {
  x.imageSmoothingEnabled = !!custom;
  if (custom) x.imageSmoothingQuality = 'high';
  const draw = (w, h) => {
    // images are authored upright (as exported); closely-matching aspect ratios fill the footprint, others are letterboxed, never distorted badly
    const ia = img.width / img.height,
      ta = w / h;
    let dw = w,
      dh = h;
    if (custom && Math.abs(ia / ta - 1) > 0.2) {
      if (ia > ta) dh = w / ia;
      else dw = h * ia;
    }
    x.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  };
  if (!rot) {
    draw(pw, ph);
  } else {
    x.save();
    x.translate(pw / 2, ph / 2);
    x.rotate(Math.PI / 2);
    x.translate(-ph / 2, -pw / 2);
    draw(ph, pw);
    x.restore();
  }
}
/* THE icon resolver: every inventory screen asks this. pw/ph = pixel size of the occupied footprint AFTER rotation. forceDefault ignores overrides (used by export). */
function iconCanvas(id, pw, ph, rot, forceDefault) {
  pw = Math.max(1, Math.round(pw));
  ph = Math.max(1, Math.round(ph));
  const c = document.createElement('canvas');
  c.width = pw;
  c.height = ph;
  const x = c.getContext('2d');
  const cs = forceDefault ? null : customSrc(id);
  try {
    paintIcon(x, cs || defaultIcon(id), pw, ph, rot, !!cs);
  } catch (e) {
    if (cs) {
      try {
        x.clearRect(0, 0, pw, ph);
        paintIcon(x, defaultIcon(id), pw, ph, rot, false);
      } catch (e2) {}
    }
  }
  return c;
}
function drawIcon(id, size) {
  const it = ITEMS[id] || {size: [1, 1]},
    k = size / Math.max(it.size[0], it.size[1]);
  return iconCanvas(id, it.size[0] * k, it.size[1] * k, false);
} // legacy signature kept

/* ZIP (store only) so all default icons can be exported in one download */
const CRCT = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(u) {
  let c = 0xffffffff;
  for (let i = 0; i < u.length; i++) c = CRCT[(c ^ u[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function makeZip(files) {
  const enc = new TextEncoder(),
    parts = [],
    cd = [];
  let off = 0;
  files.forEach(f => {
    const nm = enc.encode(f.name),
      crc = crc32(f.data),
      sz = f.data.length,
      lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true);
    lh.setUint16(4, 20, true);
    lh.setUint16(12, 0x21, true);
    lh.setUint32(14, crc, true);
    lh.setUint32(18, sz, true);
    lh.setUint32(22, sz, true);
    lh.setUint16(26, nm.length, true);
    parts.push(new Uint8Array(lh.buffer), nm, f.data);
    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true);
    ch.setUint16(4, 20, true);
    ch.setUint16(6, 20, true);
    ch.setUint16(14, 0x21, true);
    ch.setUint32(16, crc, true);
    ch.setUint32(20, sz, true);
    ch.setUint32(24, sz, true);
    ch.setUint16(28, nm.length, true);
    ch.setUint32(42, off, true);
    cd.push(new Uint8Array(ch.buffer), nm);
    off += 30 + nm.length + sz;
  });
  const cds = cd.reduce((a, b) => a + b.length, 0),
    end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, cds, true);
  end.setUint32(16, off, true);
  return new Blob([...parts, ...cd, new Uint8Array(end.buffer)], {type: 'application/zip'});
}
function saveBlob(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(a.href);
    a.remove();
  }, 2000);
}
async function exportDefaultIcons() {
  icoMsg('Exporting ' + ITEM_ORDER.length + ' original icons...');
  try {
    const files = [];
    for (const id of ITEM_ORDER) {
      const c = defaultIcon(id),
        b = await new Promise(r => c.toBlob(r, 'image/png'));
      if (!b) throw new Error('could not encode ' + id);
      files.push({name: id + '.png', data: new Uint8Array(await b.arrayBuffer())});
    }
    saveBlob(makeZip(files), 'default_icons.zip');
    icoMsg(
      'Exported ' +
        files.length +
        ' original default icons to default_icons.zip (one PNG per item ID, 32 px per grid cell). Custom overrides were NOT used.',
      1
    );
  } catch (e) {
    icoMsg('Export failed: ' + ((e && e.message) || e), 0, 1);
  }
}

/* IndexedDB persistence (best effort: the game works fine if this is unavailable) */
function idbOpen() {
  return new Promise((res, rej) => {
    try {
      const r = indexedDB.open('gf_icons', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('i');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    } catch (e) {
      rej(e);
    }
  });
}
async function idbDo(mode, fn) {
  const d = await idbOpen();
  return new Promise((res, rej) => {
    const t = d.transaction('i', mode),
      s = t.objectStore('i'),
      r = fn(s);
    t.oncomplete = () => {
      d.close();
      res(r && r.result);
    };
    t.onerror = t.onabort = () => {
      d.close();
      rej(t.error);
    };
  });
}
const idbPut = (k, v) => idbDo('readwrite', s => s.put(v, k)),
  idbDel = k => idbDo('readwrite', s => s.delete(k)),
  idbClear = () => idbDo('readwrite', s => s.clear());
async function decodePng(buf) {
  const blob = new Blob([buf], {type: 'image/png'});
  if (window.createImageBitmap) {
    try {
      return await createImageBitmap(blob);
    } catch (e) {}
  }
  return await new Promise((res, rej) => {
    const im = new Image(),
      u = URL.createObjectURL(blob);
    im.onload = () => {
      URL.revokeObjectURL(u);
      res(im);
    };
    im.onerror = () => {
      URL.revokeObjectURL(u);
      rej(new Error('decode failed'));
    };
    im.src = u;
  });
}
const PNGSIG = [137, 80, 78, 71, 13, 10, 26, 10];
async function importIcons(files) {
  const ok = [],
    bad = [];
  for (const f of files) {
    const nm = f.name || '(unnamed)';
    try {
      if (!/\.png$/i.test(nm)) {
        bad.push(nm + ': not a .png file');
        continue;
      }
      const base = nm.replace(/\.png$/i, ''),
        id = ITEMS[base] ? base : ITEMS[base.toLowerCase()] ? base.toLowerCase() : null;
      if (!id) {
        bad.push(nm + ': no item has the ID "' + base + '" (use the internal ID, e.g. smoked_ham.png)');
        continue;
      }
      if (f.size > 6 * 1024 * 1024) {
        bad.push(nm + ': file is larger than 6 MB');
        continue;
      }
      const buf = await f.arrayBuffer(),
        u = new Uint8Array(buf);
      if (u.length < 8 || PNGSIG.some((b, i) => u[i] !== b)) {
        bad.push(nm + ': not a valid PNG (bad file signature)');
        continue;
      }
      const img = await decodePng(buf);
      if (!img || !img.width || !img.height || img.width > 4096 || img.height > 4096) {
        bad.push(nm + ': unreadable image or larger than 4096 px');
        continue;
      }
      const old = ICU[id];
      ICU[id] = {img, w: img.width, h: img.height};
      if (old && old.img && old.img.close)
        try {
          old.img.close();
        } catch (e) {}
      ok.push(id);
      idbPut(id, buf).catch(() => {
        icoPersistOK = false;
      });
    } catch (e) {
      bad.push(nm + ': ' + (e && e.message ? e.message : 'could not be read'));
    }
  }
  icoVer++;
  iconsChanged();
  icoMsg(
    (ok.length ? 'Imported ' + ok.length + ' icon(s): ' + ok.join(', ') + '. ' : '') +
      (bad.length
        ? '<br><span class="r">Skipped ' +
          bad.length +
          ':<br>' +
          bad.map(s => s.replace(/</g, '&lt;')).join('<br>') +
          '</span>'
        : '') +
      (ok.length && !icoPersistOK
        ? '<br><span class="o">Could not save to browser storage - these icons last until you reload.</span>'
        : ''),
    ok.length > 0,
    bad.length > 0 && !ok.length
  );
}
function removeCustomIcon(id) {
  const u = ICU[id];
  if (u && u.img && u.img.close)
    try {
      u.img.close();
    } catch (e) {}
  delete ICU[id];
  idbDel(id).catch(() => {});
  icoVer++;
  iconsChanged();
  icoMsg('Restored the default icon for ' + ITEMS[id].name + '.', 1);
}
function clearAllIcons() {
  const n = Object.keys(ICU).length;
  if (!n) {
    icoMsg('There are no custom icons to clear.');
    return;
  }
  if (!confirm('Remove all ' + n + ' custom icons and restore every default icon?')) return;
  for (const id in ICU) {
    const u = ICU[id];
    if (u && u.img && u.img.close)
      try {
        u.img.close();
      } catch (e) {}
    delete ICU[id];
  }
  idbClear().catch(() => {});
  icoVer++;
  iconsChanged();
  icoMsg('Cleared ' + n + ' custom icon(s). All default icons restored.', 1);
}
async function loadSavedIcons() {
  try {
    const d = await idbOpen();
    const all = await new Promise((res, rej) => {
      const out = [],
        q = d.transaction('i', 'readonly').objectStore('i').openCursor();
      q.onsuccess = () => {
        const c = q.result;
        if (c) {
          out.push([c.key, c.value]);
          c.continue();
        } else res(out);
      };
      q.onerror = () => rej(q.error);
    });
    d.close();
    for (const [id, buf] of all) {
      if (!ITEMS[id]) continue;
      try {
        const img = await decodePng(buf);
        if (img && img.width) ICU[id] = {img, w: img.width, h: img.height};
      } catch (e) {
        idbDel(id).catch(() => {});
      }
    }
    if (Object.keys(ICU).length) {
      icoVer++;
      iconsChanged();
    }
  } catch (e) {
    icoPersistOK = false;
  }
}
function icoMsg(h, good, err) {
  const e = document.getElementById('icoMsg');
  if (e) {
    e.innerHTML = h;
    e.style.color = err ? '#ef4444' : good ? '#22c55e' : '#aaa';
  }
}
function iconsChanged() {
  if (typeof invOpen !== 'undefined' && invOpen && $('invScr')) renderInv();
  icoList();
}
function icoList() {
  const L = document.getElementById('icoList');
  if (!L) return;
  const n = Object.keys(ICU).length;
  document.getElementById('icoCount').textContent = n + ' of ' + ITEM_ORDER.length + ' items have a custom icon';
  L.innerHTML = '';
  let last = '';
  ITEM_ORDER.forEach(id => {
    const it = ITEMS[id];
    if (it.cat !== last) {
      last = it.cat;
      const h = document.createElement('div');
      h.className = 'y';
      h.style.cssText = 'margin:8px 0 2px;font:700 14px Impact,sans-serif;letter-spacing:1px';
      h.textContent = CATS[it.cat].toUpperCase();
      L.appendChild(h);
    }
    const r = document.createElement('div');
    r.className = 'icoRow';
    const th = iconCanvas(
      id,
      Math.max(12, it.size[0] * Math.min(34, 92 / Math.max(it.size[0], it.size[1]))),
      Math.max(12, it.size[1] * Math.min(34, 92 / Math.max(it.size[0], it.size[1]))),
      false
    );
    th.style.cssText = 'flex:0 0 auto;border:1px solid #333';
    const tw = document.createElement('div');
    tw.style.cssText = 'flex:0 0 100px;display:flex;justify-content:center';
    tw.appendChild(th);
    r.appendChild(tw);
    const t = document.createElement('div');
    t.style.cssText = 'flex:1;min-width:0';
    t.innerHTML =
      '<b>' +
      it.name.replace(/</g, '&lt;') +
      '</b> <span class="m">' +
      it.vh[0] +
      'x' +
      it.vh[1] +
      '</span><br><span class="m" style="font-size:11px">' +
      id +
      '.png</span>';
    r.appendChild(t);
    const s = document.createElement('div');
    s.style.cssText = 'flex:0 0 auto;text-align:right';
    if (hasCustom(id)) {
      s.innerHTML = '<span class="g">CUSTOM</span> ';
      const b = document.createElement('button');
      b.textContent = 'Remove';
      b.onclick = () => removeCustomIcon(id);
      s.appendChild(b);
    } else s.innerHTML = '<span class="m">default</span>';
    r.appendChild(s);
    L.appendChild(r);
  });
}
