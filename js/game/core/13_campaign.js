/* MINI FORT ZOMBIE - core 13/13: campaign
   Start kit, campaign start, go/siege/HQ/pause, I'm stuck, crouch, day cycle, hqUI, clock, lighting, hud(), animate loop.
   Part of the old js/game/core.js (split in v080). Classic script: shares globals with the other core parts; load in numeric order. */
function startKit(k) {
  const add = id => {
    const q = ITEMS[id] ? newInst(id) : null;
    if (q) invAdd(PINV, q);
    return q;
  };
  const pick = a => a[Math.floor(Math.random() * a.length)];
  let pg;
  if (k === 'police') {
    add('crowbar');
    pg = add('beretta_9mm');
    add('ammo_9mm');
    add('ammo_9mm');
    add('combat_shotgun');
    add('ammo_12_gauge');
    add('ammo_12_gauge');
  } else {
    const mel = ITEM_ORDER.filter(id => ITEMS[id].cat === 'melee' && WDEF[id]),
      pis = ITEM_ORDER.filter(id => ITEMS[id].cat === 'pistol' && WDEF[id] && WDEF[id].ammo && ITEMS[WDEF[id].ammo]);
    add(pick(mel));
    const pid = pick(pis);
    pg = add(pid);
    add(WDEF[pid].ammo);
    add(WDEF[pid].ammo);
  }
  G.eq = pg || PINV.items[0] || null;
}
function initCampaign(k) {
  G.fort = k;
  HQINV.items.length = 0;
  HQINV.h = 16;
  HQINV.g = makeGrid(16, 16);
  resGrant(HQINV, 'food', 80);
  resGrant(HQINV, 'mat', 35);
  resGrant(HQINV, 'meds', 10);
  const f = FORTS[k];
  G.maxHp = Math.round(100 * f.hp);
  G.hp = G.maxHp;
  G.rl = 0;
  G.draw = 0;
  PINV.items.length = 0;
  PINV.g = makeGrid(PINV.w, PINV.h);
  startKit(k);
  $('fn').textContent = 'HQ: ' + f.n.toUpperCase();
  G.day = 1;
  G.time = 8;
}
function pick(k) {
  initCampaign(k);
  go('CLEAR');
}
function freeSpot(x, z) {
  for (let r = 0; r <= 8; r += 0.5)
    for (let a = 0; a < 8; a++) {
      const tx = x + Math.cos(a * 0.785) * r,
        tz = z + Math.sin(a * 0.785) * r;
      if (!blocked(tx, tz, 0.55, 0, 1.8)) return [tx, tz];
    }
  return [x, z];
}
function go(m) {
  if (G.siegeDue && m !== 'CLEAR') return startSiege();
  G.hqPause = false;
  G.mode = m;
  ui(null);
  $('hud').classList.remove('hide');
  $('tip').classList.toggle('hide', m !== 'FORT_BUILD');
  buildWorld();
  if (m === 'EXPEDITION')
    toast(
      window.mzArriveToast ? mzArriveToast() : 'Survivors are hiding in buildings - watch for blue dots on the radar!'
    );
  const sp = m === 'EXPEDITION' ? [TRUCK.x, TRUCK.z + 6] : m === 'CLEAR' ? [FORT.x, FORT.z + 22] : [FORT.x, FORT.z + 5];
  {
    const fp = freeSpot(sp[0], sp[1]);
    sp[0] = fp[0];
    sp[1] = fp[1];
  }
  pl.position.set(sp[0], 1.6, sp[1]);
  G.vy = 0;
  G.crouch = false;
  G.eyeH = G.eyeUsed = 1.6;
  yaw = pitch = 0;
  pl.rotation.y = 0;
  camera.rotation.x = 0;
  ui('pz');
  lock();
  if (m === 'EXPEDITION')
    G.surv
      .filter(q => q.role === 'Scavenger' && q.hp > 0)
      .forEach(q => spawnComp(q, sp[0] + rnd(-2.5, 2.5), sp[1] + rnd(1, 3)));
}
function startSiege() {
  G.siegeDue = false;
  G.hqPause = false;
  G.day = 14;
  G.time = 21;
  G.mode = 'SIEGE';
  G.siegeToSpawn = (20 + G.surv.length * 2) * 4;
  G.spawnT = 3;
  ui(null);
  $('hud').classList.remove('hide');
  $('tip').classList.add('hide');
  buildWorld();
  {
    const fp = freeSpot(FORT.x, FORT.z + 5);
    pl.position.set(fp[0], 1.6, fp[1]);
  }
  G.crouch = false;
  G.eyeH = G.eyeUsed = 1.6;
  yaw = pitch = 0;
  pl.rotation.y = 0;
  ui('pz');
  lock();
  toast('THE HORDE IS HERE. Hold the fort!');
}
/* v100: the fort map is no longer kept loaded at the Fort HQ menu. Arriving at the fort (returning from a mission, loading a save) unloads the
   current map and opens the plain HQ menu; the fort itself is only built when the player clicks Enter fort (through the loading screen). */
function toHQ() {
  try {
    if (typeof WB !== 'undefined') for (const f of WB.pre) f();
    clearWorld();
  } catch (e) {
    console.error('[hq] unload', e);
  }
  G.clearT = null;
  openHQ();
  if (window.MFZSAVE && MFZSAVE.autosave) setTimeout(MFZSAVE.autosave, 200);
}
function enterFort() {
  if (G.siegeDue || !(window.MFZLOAD && MFZLOAD.mission) || MFZLOAD.busy) return go('FORT_BUILD');
  MFZLOAD.mission('FORT_BUILD');
}
function openHQ(pause) {
  G.hqPause = !!pause;
  if (!pause) G.mode = 'HQ_MENU';
  G.pauseAt = performance.now();
  document.exitPointerLock();
  $('hud').classList.add('hide');
  ui('hq');
  $('resumeBtn').style.display = pause ? '' : 'none';
  hqUI();
}
// at the fort the pause menu IS the Fort HQ menu (with the normal pause panel beside it); on a mission it's the plain pause screen
function showPause() {
  G.pauseAt = performance.now();
  if (G.mode === 'FORT_BUILD') openHQ(true);
  else ui('pz');
}
function resumeFort() {
  G.mode = 'FORT_BUILD';
  G.hqPause = false;
  G.escTry = performance.now();
  ui(null);
  $('hud').classList.remove('hide');
  lock();
}
function hqDeposit() {
  if (!PINV.items.length) {
    toast('Your inventory is empty');
    return;
  }
  depositToHQ(false);
  hqUI();
}
/* ===== I'M STUCK: move to the nearest safe standing spot on the same floor (30 s cooldown) ===== */
function stuckLeft() {
  return Math.max(0, Math.ceil(((G.stuckUntil || 0) - Date.now()) / 1000));
}
function imStuck() {
  const w = stuckLeft();
  if (w > 0) {
    toast("I'm Stuck is recharging (" + w + 's)');
    return;
  }
  const p = pl.position,
    eye = G.eyeUsed || 1.6,
    feet = p.y - eye;
  let best = null;
  const ok = (x, z) => {
    if (x < BND[0] + 0.8 || x > BND[1] - 0.8 || z < BND[2] + 0.8 || z > BND[3] - 0.8) return false;
    const gy = groundAt(x, z, feet + 0.35);
    return Math.abs(gy - feet) < 0.6 && !blocked(x, z, 0.5, gy + 0.02, 1.8) && !zb(x, z);
  };
  search: for (let r = 0.5; r <= 14; r += 0.5) {
    const n = Math.max(8, Math.round(r * 10));
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU,
        x = p.x + Math.cos(a) * r,
        z = p.z + Math.sin(a) * r;
      if (ok(x, z)) {
        best = [x, z];
        break search;
      }
    }
  }
  if (!best) {
    const sp = G.mode === 'EXPEDITION' ? [TRUCK.x, TRUCK.z + 6] : [FORT.x, FORT.z + 5],
      f = freeSpot(sp[0], sp[1]);
    best = f;
  }
  const gy = groundAt(best[0], best[1], feet + 0.5);
  G.crouch = false;
  G.eyeH = G.eyeUsed = 1.6;
  G.vy = 0;
  pl.position.set(best[0], 1.6 + gy, best[1]);
  G.feetY = gy;
  G.stuckUntil = Date.now() + 30000;
  toast('Moved you to a safe spot nearby');
  document.querySelectorAll('.stuckBtn').forEach(b => b.blur());
}
// crouch (C): lower view, smaller collision, zombies see you at half range, slower; entering/leaving costs stamina
const CROUCH_COST = 8;
function canStand() {
  const p = pl.position,
    feet = p.y - (G.eyeUsed || 1.6);
  return !blocked(p.x, p.z, 0.4, feet + 0.35, 1.45);
}
function toggleCrouch() {
  if (G.crouch) {
    if (!canStand()) return toast('No room to stand up');
    G.crouch = false;
    G.st = Math.max(0, G.st - CROUCH_COST);
  } else {
    if (G.st < CROUCH_COST) return toast('Too tired to crouch');
    G.crouch = true;
    G.st -= CROUCH_COST;
  }
}
function trip() {
  const h = skScoutHours();
  G.tripH = h;
  skScoutTrained();
  advanceTime(h);
  travel('Driving out to town (' + fmtH(h) + ')...', () => go('EXPEDITION'));
}
function endDay() {
  let n = (32 - G.time) % 24;
  if (n < 0.01) n = 24;
  advanceTime(n);
  G.siegeDue ? startSiege() : hqUI();
}
function advanceTime(h) {
  G.time += h;
  while (G.time >= 24) {
    G.time -= 24;
    newDay();
  }
}
function newDay() {
  G.day++;
  const n = (G.surv.length + 1) * 4;
  if (G.food >= n) {
    G.food -= n;
    G.surv.forEach(s => {
      s.hunger = 0;
      s.morale = Math.min(100, s.morale + 4);
    });
  } else {
    G.food = 0;
    toast('Starvation! Morale is collapsing.');
    G.surv.forEach(s => {
      s.hunger++;
      s.morale -= 15;
      s.hp -= 10;
    });
    G.hp = Math.max(1, G.hp - 10);
  }
  G.surv.forEach(s => {
    const k = s.role === 'Generalist' ? 0.5 : 1;
    if (s.role === 'Scavenger' || s.role === 'Generalist') {
      G.mat += Math.round(s.skill * 3 * k);
      G.food += Math.round(2 * k);
    }
    if (s.role === 'Builder' || s.role === 'Generalist')
      G.bars.forEach(b => {
        {
          b.hp = Math.min(100, b.hp + (10 + skTot(s, 'workman') * 0.5) * k);
          if (b.mesh) tint(b);
          trainSk(s, 'workman');
        }
      });
    if (s.role === 'Medic') skMedic(s);
  });
  G.surv = G.surv.filter(s => {
    if (s.hp <= 0) return false;
    if (s.morale < 20) {
      toast(s.name + ' left the fort.');
      return false;
    }
    return true;
  });
  skDayEnd();
  if (G.day >= 14) G.siegeDue = true;
  toast('Day ' + G.day + ' begins');
}
function heal() {
  if (G.meds > 0 && G.hp < G.maxHp) {
    G.meds--;
    G.hp = Math.min(G.maxHp, G.hp + 30);
    hqUI();
  }
}
function setRole(id, v) {
  const q = G.surv.find(x => x.id === id);
  if (!q) return;
  q.role = v;
  toast(q.name + ' is now a ' + v);
  hqUI();
}
function hqLive() {
  $('hqs').textContent =
    `DAY ${G.day} · ${Math.max(0, 14 - G.day)} DAYS TO THE SIEGE · YOUR HP ${Math.round(G.hp)}/${G.maxHp} · ROUNDS LOADED IN YOUR GUNS ${pWeapons().reduce((a, q) => a + (q.clip || 0), 0)}`;
  $('hqc').textContent = clockStr();
  const ig = G.bars.length ? Math.round(G.bars.reduce((a, b) => a + b.hp, 0) / G.bars.length) : 0;
  $('ri').textContent = G.bars.length + 'B/' + G.spikes.length + 'S ' + ig + '%';
}
function hqUI() {
  hqLive();
  $('hqPT').textContent = G.hqPause
    ? 'The game keeps running while the Fort HQ menu is open. Press Esc or Resume to continue.'
    : 'Time only passes when you act here.';
  {
    const t = resTotals(HQINV);
    $('rf').textContent = t.food;
    $('rm').textContent = t.mat;
    $('rd').textContent = t.meds;
    $('ra').textContent = t.ammo;
  }
  const ig = G.bars.length ? Math.round(G.bars.reduce((a, b) => a + b.hp, 0) / G.bars.length) : 0;
  $('ri').textContent = G.bars.length + 'B/' + G.spikes.length + 'S ' + ig + '%';
  $('sc').textContent = `${G.surv.length}/16`;
  $('sl').innerHTML = G.surv
    .map(
      s =>
        `<div class="sv"><div><b>${s.name}</b>${fzTag(s)} <span class="y">${'★'.repeat(s.skill)}</span><br><span class="m">HP ${Math.round(s.hp)} · Morale ${Math.round(s.morale)} · Hunger ${s.hunger}</span><br><span class="g" style="font-size:11px">${ROLEFX[s.role]}</span></div><div style="display:flex;flex-direction:column;gap:4px"><button onclick="svInvFromHQ(${s.id})">Inventory</button><button onclick="openSkills(${s.id})">Skills</button><select onchange="setRole(${s.id},this.value)">${Object.keys(
          RC
        )
          .map(r => `<option ${r === s.role ? 'selected' : ''}>${r}</option>`)
          .join('')}</select></div></div>`
    )
    .join('');
  $('ds').textContent =
    'Guards fire from the fort and use shared ammo. Builders repair barricades daily. Medics spend meds to heal everyone. Scavengers bring supplies.';
}
function finish(win, why) {
  G.hqPause = false;
  G.mode = 'END';
  document.exitPointerLock();
  $('hud').classList.add('hide');
  ui('end');
  const a = G.surv.filter(s => s.hp > 0).length;
  $('et').textContent = win ? 'FORT SURVIVED' : 'FORT FALLEN';
  $('es').textContent = why;
  $('est').textContent = `Day ${G.day}/14 · Kills ${G.kills} · Survivors alive ${a}`;
}

function clockStr() {
  const t = Math.floor(G.time * 3600 + 1e-6),
    p = n => String(n).padStart(2, '0');
  return `${p(Math.floor(t / 3600) % 24)}:${p(Math.floor(t / 60) % 60)}:${p(t % 60)}`;
}
function lighting() {
  const d = THREE.MathUtils.clamp(Math.sin(((G.time - 6) / 24) * TAU) * 2 + 0.3, 0, 1),
    sky = new THREE.Color(0x05070a).lerp(new THREE.Color(0x7092be), d);
  scene.background = sky;
  scene.fog.color.copy(sky);
  dirL.intensity = 0.2 + 0.9 * d;
  ambL.intensity = 0.18 + 0.5 * d;
  dirL.position.set(
    Math.cos(((G.time - 6) / 24) * TAU) * 80,
    Math.abs(Math.sin(((G.time - 6) / 24) * TAU)) * 80 + 10,
    20
  );
  const night = G.time >= 20 || G.time < 5;
  streetLights.forEach(L => {
    L.intensity = night ? 1.4 : 0;
  });
}
function hud() {
  if (carry) {
    carry.position.set(pl.position.x - Math.sin(yaw) * 1.6, pl.position.y - 1.1, pl.position.z - Math.cos(yaw) * 1.6);
    carry.rotation.y = yaw + Math.PI;
  }
  const z = zombies.length,
    m = G.mode;
  $('hpv').textContent = Math.round(G.hp) + '/' + G.maxHp;
  $('hpb').style.width = (G.hp / G.maxHp) * 100 + '%';
  $('stb').style.width = G.st + '%';
  $('stv').textContent = Math.round(G.st) + '/100';
  hudWeapon();
  $('day').textContent =
    m === 'CLEAR'
      ? 'Day 1: Clear the fort'
      : m === 'SIEGE'
        ? 'Day 14: The siege'
        : `Day ${G.day}: ${m === 'FORT_BUILD' ? 'Fort' : 'Expedition'}`;
  $('obj').textContent =
    m === 'CLEAR'
      ? `Kill the zombies inside the fort (${zombies.filter(q => q.userData.fort).length} left)`
      : m === 'SIEGE'
        ? `Survive! ${z + G.siegeToSpawn} zombies left`
        : m === 'FORT_BUILD'
          ? 'Fortify, then Esc for HQ'
          : window.mzObjective
            ? mzObjective()
            : 'Scavenge, then return to the truck (E)';
  $('clk').textContent = clockStr();
  $('tts').textContent = 'Siege in ' + Math.max(0, 14 - G.day) + ' days';
  const h = ((-yaw % TAU) + TAU) % TAU,
    deg = (h * 180) / Math.PI;
  $('cs').style.left = 128 - 180 - (deg * 40) / 45 + 'px';
  const mk = (el, t) => {
    let r = Math.atan2(t.x - pl.position.x, -(t.z - pl.position.z)) - h;
    r = (Math.atan2(Math.sin(r), Math.cos(r)) * 180) / Math.PI;
    el.style.left = 124 + Math.max(-116, Math.min(116, (r * 40) / 45)) + 'px';
  };
  $('cm').style.display = m === 'EXPEDITION' ? 'none' : 'block';
  $('cm2').style.display = m === 'EXPEDITION' ? 'block' : 'none';
  mk($(m === 'EXPEDITION' ? 'cm2' : 'cm'), m === 'EXPEDITION' ? TRUCK : FORT);
  let p = '';
  if (m === 'EXPEDITION' && nearTruck()) p = '[E] Return to the fort (+' + fmtH(G.tripH || skScoutHours()) + ')';
  else if (lookT <= 0) {
    lookT = 0.1;
    const l = look(false, null, 3.6); // v088: only things within 3.5 m give a prompt, so only those are tested
    if (l && l.o && l.d < 3.5) {
      const u = l.o.userData;
      p =
        u.kind === 'loot'
          ? skLootPrompt(u.cont)
          : u.kind === 'door'
            ? u.d.open
              ? '[E] Close door'
              : u.d.locked
                ? '[LOCKED]\nLockpick? (E)'
                : '[E] Open door'
            : u.kind === 'comp'
              ? m === 'FORT_BUILD'
                ? '[E] Pick up ' + u.s.name + '  -  hold E: orders'
                : '[E] ' + (u.c.follow ? 'Stop following' : 'Follow me') + '  -  hold E: orders'
              : u.kind === 'npc'
                ? skNpcPrompt(l.o)
                : u.kind === 'surv' && m === 'FORT_BUILD'
                  ? '[E] Pick up ' + u.s.name + '  -  hold E: orders'
                  : u.kind === 'bar' && m === 'FORT_BUILD'
                    ? `[E] Repair barricade (${Math.round(u.bar.hp)}%) - 5 mat`
                    : '';
    }
  } else p = $('pr').textContent;
  $('pr').textContent = p;
  $('pr').style.opacity = p ? 1 : 0;
  const c = mmCtx();
  if (!c) return;
  c.fillStyle = '#0a0a0a';
  c.fillRect(0, 0, 128, 128);
  {
    const fa = Math.atan2(-Math.cos(yaw), -Math.sin(yaw)),
      hf = Math.atan(Math.tan((camera.fov * Math.PI) / 360) * camera.aspect),
      gr = c.createRadialGradient(64, 64, 0, 64, 64, 60);
    gr.addColorStop(0, 'rgba(250,240,150,.6)');
    gr.addColorStop(1, 'rgba(250,240,150,0)');
    c.fillStyle = gr;
    c.beginPath();
    c.moveTo(64, 64);
    c.arc(64, 64, 60, fa - hf, fa + hf);
    c.closePath();
    c.fill();
  }
  const X = x => 64 + (x - pl.position.x) * 0.7,
    Z = z => 64 + (z - pl.position.z) * 0.7;
  if (m === 'EXPEDITION') {
    c.fillStyle = '#22c55e';
    c.fillRect(X(TRUCK.x) - 3, Z(TRUCK.z) - 3, 6, 6);
  } else {
    c.fillStyle = '#555';
    c.fillRect(X(FORT.x - 15), Z(FORT.z - 15), 21, 21);
  }
  c.fillStyle = '#ef4444';
  zombies.forEach(q => {
    c.fillRect(X(q.position.x) - 1, Z(q.position.z) - 1, 3, 3);
  });
  c.fillStyle = '#3b82f6';
  c.strokeStyle = '#fff';
  c.lineWidth = 1;
  smesh.concat(npcList).forEach(q => {
    c.beginPath();
    c.arc(X(q.position.x), Z(q.position.z), 3, 0, TAU);
    c.fill();
    c.stroke();
  });
  fzDrawRumors(c, X, Z);
  c.fillStyle = '#facc15';
  G.bars.forEach(b => {
    const cc = Math.cos(b.ry || 0),
      ss = Math.sin(b.ry || 0);
    c.beginPath();
    c.moveTo(X(b.x - cc * 2), Z(b.z + ss * 2));
    c.lineTo(X(b.x + cc * 2), Z(b.z - ss * 2));
    c.lineWidth = 2;
    c.strokeStyle = '#facc15';
    c.stroke();
  });
  c.fillStyle = '#fff';
  c.beginPath();
  c.arc(64, 64, 3, 0, TAU);
  c.fill();
}
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1);
  $('clk').textContent = clockStr();
  $('tts').textContent = 'Siege in ' + Math.max(0, 14 - G.day) + ' days';
  if (playing()) {
    lighting();
    animVM(dt);
    updDead(dt);
    updShards(dt);
    updBlood(dt);
    updLimbs(dt);
    updFloats(dt);
    updDmgNums(dt);
    doors.forEach(d => {
      {
        const e = d.t - d.a;
        if (Math.abs(e) > 1e-4) {
          const st = dt * Math.max(1.6, Math.abs(e) * 6.5);
          d.a += Math.sign(e) * Math.min(Math.abs(e), st);
        }
      }
      const shk = (d.sh = (d.sh || 0) - dt) > 0 ? Math.sin(d.sh * 70) : 0;
      if (d.slide && d.lf) {
        // v089: sliding glass leaf: runs along its track instead of turning
        d.lf.position.x = d.lx + d.slide * SLIDE_D * d.a + shk * 0.012;
        d.lf.updateMatrix();
        d.p.rotation.y = d.b || 0;
      } else if (d.roll && d.lf) {
        // v089: roller door: the leaf squashes up toward its top edge (rolls into the head)
        const s = 1 - (1 - ROLL_MIN) * d.a;
        d.lf.scale.y = s;
        d.lf.position.y = d.rh * (1 - s / 2);
        d.lf.position.z = d.rz + shk * 0.015;
        d.lf.updateMatrix();
      } else d.p.rotation.y = (d.b || 0) + d.a + shk * 0.04;
    });
    /* v076: eased swing */ if (
      !frozen() &&
      !(window.MFZLOAD && MFZLOAD.busy) /* v088: the world does not advance while the loading screen warms it up */ &&
      (locked || invOpen || hqShown() || (window.COOP && COOP.run))
    ) {
      /* v087: co-op never pauses */
      const ctl = locked && !invOpen;
      G.cdS -= dt;
      G.cdM -= dt;
      G.noise -= dt;
      lookT -= dt;
      if (G.mode !== 'SIEGE') advanceTime(dt / 3600);
      if (G.siegeDue && G.mode !== 'SIEGE') {
        startSiege();
        return;
      }
      const mv = ctl
          ? new THREE.Vector3((K.KeyD ? 1 : 0) - (K.KeyA ? 1 : 0), 0, (K.KeyS ? 1 : 0) - (K.KeyW ? 1 : 0))
          : new THREE.Vector3(),
        mo = mv.lengthSq() > 0;
      let sp = K.ShiftLeft && mo && G.st > 5 && !G.stLock;
      if (sp && G.crouch) {
        if (canStand()) G.crouch = false;
        else sp = false;
      }
      /* v093: G.wade (m, set by js/layers/water.js) is how far the player has sunk into deep water: the world's ground cannot go below
         y = 0, so depth is given by lowering the eye instead of the feet. Never below 0.7 m. */
      const eyeT = Math.max(0.7, (G.crouch ? 1.0 : 1.6) - (G.wade || 0));
      G.eyeH += (eyeT - G.eyeH) * Math.min(1, dt * (G.wade ? 6 : 12));
      if (Math.abs(eyeT - G.eyeH) < 0.01) G.eyeH = eyeT;
      G.st = THREE.MathUtils.clamp(G.st + (sp ? -35 * skStDrain(G) : 20) * dt, 0, 100);
      if (G.st <= 0.5 || (sp && G.st <= 5)) G.stLock = true;
      else if (G.stLock && G.st >= 50) G.stLock = false;
      /* v076: run dry and you cannot sprint again until stamina is back to 50 */ if (sp)
        for (const z of zombies)
          if (z.userData.sleep && Math.hypot(z.position.x - pl.position.x, z.position.z - pl.position.z) < 9) wakeZ(z);
      if (mo) {
        mv.normalize().applyAxisAngle(Y, yaw);
        const s = (sp ? 8 : G.crouch ? 3.1 : 4.2) * skSpeedMul(G) * dt,
          p = pl.position,
          cr = G.crouch ? 0.28 : 0.4,
          ch = G.crouch ? 0.85 : G.vy ? 1 : 1.45,
          fyy = p.y - (G.eyeUsed || 1.6) + 0.35;
        if (!blocked(p.x + mv.x * s, p.z, cr, fyy, ch) && !zb(p.x + mv.x * s, p.z)) p.x += mv.x * s;
        if (!blocked(p.x, p.z + mv.z * s, cr, fyy, ch) && !zb(p.x, p.z + mv.z * s)) p.z += mv.z * s;
        p.x = Math.max(BND[0] + 0.6, Math.min(BND[1] - 0.6, p.x));
        p.z = Math.max(BND[2] + 0.6, Math.min(BND[3] - 0.6, p.z));
      }
      updateZombies(dt);
      updComps(dt);
      survFight(dt);
      rlTick(dt);
      if (G.fbLeft > 0 && G.cdS <= 0 && G.eq && WDEF[G.eq.id].fbN) shoot();
      else if (ctl && K.m0 && G.eq && WDEF[G.eq.id].auto) shoot();
      jump(dt);
      if (G.mode === 'SIEGE') {
        if (G.siegeToSpawn > 0) {
          G.spawnT -= dt;
          if (G.spawnT <= 0 && zombies.length < 70) {
            G.spawnT = 0.7;
            G.siegeToSpawn--;
            const sd = Math.random() < 0.25;
            zombie(
              FORT.x + (sd ? (Math.random() < 0.5 ? -1 : 1) * rnd(30, 40) : rnd(-25, 25)),
              FORT.z + (sd ? rnd(-10, 10) : rnd(35, 55))
            );
          }
        }
        if (G.siegeToSpawn <= 0 && !zombies.length)
          finish(
            true,
            G.surv.some(s => s.hp > 0) ? 'The fort held. Dawn breaks.' : 'The fort held, but every survivor fell.'
          );
      }
      if (G.mode === 'CLEAR' && !zombies.some(q => q.userData.fort)) {
        if (G.clearT === undefined || G.clearT === null) {
          G.clearT = 3.2;
          toast('Fort cleared!');
        } else if ((G.clearT -= dt) <= 0) {
          G.clearT = null;
          G.day = 2;
          G.time = 8;
          openHQ();
        }
      } else if (G.mode !== 'CLEAR') G.clearT = null;
      /* v071: let the last body hit the floor before the HQ opens */ if (hqShown()) hqLive();
    }
    hud();
  }
  if (!(window.MFZLOAD && MFZLOAD.busy)) renderer.render(scene, camera);
} /* v075: no 3D render while a loading screen covers it (the build runs faster) */
onload = init;
