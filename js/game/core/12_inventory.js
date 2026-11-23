/* MINI FORT ZOMBIE - core 12/13: inventory
   Inventory screens, grids, drag/drop, drop boxes, containers, HQ inventory, torch.
   Part of the old js/game/core.js (split in v080). Classic script: shares globals with the other core parts; load in numeric order. */
let CELL = 38;
let invOpen = false,
  invDragging = null,
  currentContainer = null,
  hqScroll = 0;
const HQCONT = {hq: true, inv: HQINV, pieces: []};
// every survivor owns ONE inventory object that lives on the survivor record, so it survives Fort HQ / mission trips
function svInv(sv) {
  if (!sv.invc) sv.invc = {inv: newInv(16, 16), pieces: [], comp: true, sv};
  return sv.invc;
}
function toggleInv() {
  invOpen ? closeInv() : openInv();
}
function showInvScr() {
  if (!$('invScr')) {
    const s = document.createElement('div');
    s.id = 'invScr';
    document.body.appendChild(s);
  }
  invOpen = true;
  document.exitPointerLock();
  $('hud').classList.add('hide');
  $('invScr').style.display = 'flex';
}
function openInv() {
  currentContainer = null;
  showInvScr();
  renderInv();
}
function closeInv() {
  pCheckEq();
  syncAllNpc();
  invOpen = false;
  invDragging = null;
  currentContainer = null;
  tipEl.style.display = 'none';
  if ($('invScr')) $('invScr').style.display = 'none';
  if (inHQ()) hqUI();
  else if (playing()) {
    $('hud').classList.remove('hide');
    ui(null);
    G.escTry = performance.now();
    lock();
    setTimeout(() => {
      if (
        playing() &&
        !locked &&
        !invOpen &&
        !inHQ() &&
        !['pz', 'hq', 'opt', 'dev', 'end', 'title', 'menu', 'sel'].some(scrVis)
      )
        showPause();
    }, 700);
  }
}
let contShift = {x: 0, y: 0},
  dropBoxes = [];
function calcCell(two) {
  const byW = Math.floor((innerWidth - (two ? 470 : 250)) / (two ? 32 : 16)),
    byH = Math.floor((innerHeight - 300) / 16);
  return Math.max(16, Math.min(38, byW, byH));
}
function resSide(inv, title) {
  const t = resTotals(inv);
  return `<div class="resSide"><div class="rsT">${title}</div>${RES_KEYS.map(k => `<div class="rsR"><span style="color:${RES_COL[k]}">${RES_LABEL[k]}</span><b>${t[k]}</b></div>`).join('')}</div>`;
}
function gridHtml(id, inv, scroll) {
  const w = inv.w * CELL,
    g = `<div class="grid" id="${id}" style="--cs:${CELL}px;width:${w}px;height:${inv.h * CELL}px"></div>`;
  return scroll
    ? `<div class="scWrap"><div class="scBtns"><button id="scUp" title="Scroll up">&#9650;</button><button id="scDn" title="Scroll down">&#9660;</button></div><div class="scrollView" id="contView" style="width:${w + 2}px;height:${16 * CELL + 2}px">${g}</div></div>`
    : g;
}
function renderInv() {
  const s = $('invScr');
  if (!s) return;
  const ov = $('contView');
  if (ov) hqScroll = ov.scrollTop;
  const c = currentContainer;
  CELL = calcCell(!!c);
  let containerHtml = '';
  if (c) {
    refreshContainerVisual(c);
    const title = c.hq
        ? 'Fort HQ storage'
        : c.drop
          ? 'Drop box'
          : c.corpse
            ? 'Body'
            : c.comp
              ? 'Survivor inventory'
              : 'Container',
      sub = c.corpse ? ` &middot; ${c.name}` : c.comp ? ` &middot; ${c.sv.name}` : '';
    const btns = c.hq
      ? `<button id="hqDepAll" style="background:#3a5a2a">Deposit ALL</button><button id="closeInvBtn">Close (E)</button>`
      : `<button id="takeAll">Take All</button><button id="takeAllQ">Take All Quick (R)</button><button id="closeInvBtn">Close (E)</button>`;
    containerHtml = `<div class="invBox" id="contBox" style="flex:0 0 auto;display:flex;gap:10px;align-items:flex-start;transform:translate(${contShift.x}px,${contShift.y}px)"><div style="width:${c.inv.w * CELL + 2 + (c.hq ? 44 : 0)}px"><div class="invTitle">${title}${sub} <span class="m" style="font-size:12px">${c.inv.w}&times;${c.inv.h}${c.hq ? ' (grows)' : ''}</span></div>
    <div class="row" style="margin-bottom:8px;gap:6px">${btns}</div>${gridHtml('contGrid', c.inv, !!c.hq)}
    <div class="help">Drag items between the grids or onto DROP &middot; R rotates while dragging &middot; Shift+click or right-click sends an item across &middot; hover ammo/meds + E to use${c.hq ? ' &middot; mouse wheel or the arrows scroll the HQ storage' : ''}</div></div>${resSide(c.inv, c.hq ? 'FORT HQ' : c.comp ? 'THEIRS' : 'HERE')}</div>`;
  }
  s.innerHTML = `<div id="invRow" style="display:flex;gap:14px;align-items:flex-start;flex:0 0 auto;margin:auto"><div class="invBox" id="invBox" style="flex:0 0 auto;display:flex;gap:10px;align-items:flex-start">${resSide(PINV, 'CARRIED')}<div style="width:${PINV.w * CELL + 2}px"><div class="invTitle">Inventory <span class="m" style="font-size:12px">${PINV.items.length} items &middot; 16&times;16</span></div>
    ${gridHtml('invGrid', PINV, false)}
    ${inHQ() ? '' : '<div id="dropBtn" class="dropZone">DROP</div>'}
    <div class="help">Click+drag to move &middot; R rotates while dragging &middot; drag onto DROP to leave an item on the floor &middot; hover meds/ammo + E to use</div>
    <div style="margin-top:8px"><button id="closeInvBtn2">Close (E)</button></div></div></div>${containerHtml}</div>`;
  buildGrid('inv');
  if (c) buildGrid('cont');
  if (c) {
    const tk = $('takeAll');
    if (tk) {
      tk.onclick = () => {
        takeAllItems();
        renderInv();
      };
      $('takeAllQ').onclick = takeAllQuick;
    }
    $('closeInvBtn').onclick = closeInv;
    const dp = $('hqDepAll');
    if (dp)
      dp.onclick = () => {
        depositToHQ(true);
        renderInv();
      };
    const v = $('contView');
    if (v) {
      v.scrollTop = hqScroll;
      v.onwheel = e => {
        e.preventDefault();
        e.stopPropagation();
        v.scrollTop += Math.sign(e.deltaY) * CELL * 3;
      };
      $('scUp').onclick = () => {
        v.scrollTop -= CELL * 4;
      };
      $('scDn').onclick = () => {
        v.scrollTop += CELL * 4;
      };
    }
  }
  $('closeInvBtn2').onclick = closeInv;
  document.onmousemove = e => {
    if (!invDragging) return;
    invDragging.mx = e.clientX;
    invDragging.my = e.clientY;
    drawGhost();
  };
  document.onmouseup = e => {
    if (invDragging) dropDrag(e);
  };
}
// the cursor reappears where it was when the mouse was captured, so slide the container panel so Take All sits under that spot
function anchorCont() {
  const b = $('takeAll'),
    p = $('contBox'),
    iv = $('invBox');
  if (!b || !p || !iv) return;
  p.style.transform = 'none';
  const br = b.getBoundingClientRect(),
    pr = p.getBoundingClientRect(),
    ir = iv.getBoundingClientRect();
  let dx = lastMouse.x - (br.left + br.width / 2),
    dy = 0;
  const minL = ir.right + 8,
    maxL = Math.max(minL, innerWidth - pr.width - 4);
  let nl = Math.max(minL, Math.min(maxL, pr.left + dx));
  dx = nl - pr.left;
  contShift = {x: Math.round(dx), y: Math.round(dy)};
  p.style.transform = `translate(${contShift.x}px,${contShift.y}px)`;
}
function tipHtml(inst, eqd) {
  const it = ITEMS[inst.id],
    k = resOf(inst.id);
  let h = `<b class="y">${it.name}</b><br><span class="m">${CATS[it.cat]} &middot; ${it.vh[0]}&times;${it.vh[1]}</span>`;
  if (k) h += `<br><span class="g">${inst.rem} / ${it.value[k]} ${RES_LABEL[k]} left</span>`;
  {
    const wd = WDEF[inst.id];
    if (wd) {
      if (wd.type === 'gun')
        h += `<br><span class="g">Loaded ${inst.clip || 0} / ${wd.cap} &middot; uses ${ITEMS[wd.ammo].name}</span><br><span class="m">${wd.mode} &middot; dmg ${fzTxt(wd)}${wd.pel > 1 ? ' x' + wd.pel + ' pellets' : ''}</span><br><span class="o">Hover + E: unload</span>`;
      else h += `<br><span class="m">Melee &middot; dmg ${fzTxt(wd)} &middot; reach ${wd.reach} m</span>`;
      if (eqd) h += '<br><span class="y">EQUIPPED</span>';
    }
  }
  if (it.cat === 'ammo') h += '<br><span class="o">Hover + E: load into the equipped gun</span>';
  else if (it.use) h += `<br><span class="o">Hover + E: heal up to +${it.use.hp} HP (uses ${it.use.cost} meds)</span>`;
  return h;
}
function gridCtx(kind) {
  if (kind === 'cont') {
    const c = currentContainer;
    return {el: $('contGrid'), inv: c.inv, view: $('contView')};
  }
  return {el: $('invGrid'), inv: PINV, view: null};
}
function buildGrid(kind) {
  pCheckEq();
  if (kind === 'cont' && currentContainer && currentContainer.comp && currentContainer.sv)
    npcSyncEquip(currentContainer.sv);
  const cx = gridCtx(kind),
    grid = cx.el,
    inv = cx.inv;
  grid.innerHTML = '';
  inv.items.forEach(inst => {
    const [tw, th] = fp(inst),
      it = ITEMS[inst.id],
      k = resOf(inst.id);
    const el = document.createElement('div');
    el.className = 'item';
    el.dataset.uid = inst.uid;
    el.dataset.kind = kind;
    el.style.left = inst.x * CELL + 'px';
    el.style.top = inst.y * CELL + 'px';
    el.style.width = tw * CELL + 'px';
    el.style.height = th * CELL + 'px';
    el.appendChild(iconCanvas(inst.id, tw * CELL - 2, th * CELL - 2, inst.rot));
    if (k) {
      const q = document.createElement('span');
      q.className = 'qty';
      q.textContent = inst.rem;
      el.appendChild(q);
    }
    const wd = WDEF[inst.id],
      eqd =
        wd &&
        ((kind !== 'cont' && inst === G.eq) ||
          (kind === 'cont' &&
            currentContainer &&
            currentContainer.comp &&
            currentContainer.sv &&
            currentContainer.sv.eq === inst));
    if (wd && wd.type === 'gun') {
      const q = document.createElement('span');
      q.className = 'qty';
      q.textContent = (inst.clip || 0) + '/' + wd.cap;
      el.appendChild(q);
    }
    if (eqd) el.style.boxShadow = 'inset 0 0 0 2px #facc15';
    el.dataset.tip = tipHtml(inst, eqd);
    el.addEventListener('mousedown', e => {
      if (e.button !== 0) return;
      e.preventDefault();
      if (e.shiftKey) {
        quickMove(kind, inst);
        return;
      }
      const rect = grid.getBoundingClientRect();
      const cellX = Math.floor((e.clientX - rect.left) / CELL),
        cellY = Math.floor((e.clientY - rect.top) / CELL);
      invDragging = {
        kind,
        uid: inst.uid,
        grabCellX: cellX - inst.x,
        grabCellY: cellY - inst.y,
        previewRot: inst.rot,
        mx: e.clientX,
        my: e.clientY
      };
      if (currentContainer && currentContainer.hq) {
        const g = $('contGrid');
        if (g) g.style.height = (currentContainer.inv.h + 9) * CELL + 'px';
      } // spare rows while dragging so items can go below the last row
      el.style.opacity = '0.5';
      tipEl.style.display = 'none';
    });
    el.addEventListener('contextmenu', e => {
      e.preventDefault();
      quickMove(kind, inst);
    });
    grid.appendChild(el);
  });
}
function quickMove(kind, inst) {
  if (!currentContainer) return;
  const src = kind === 'cont' ? currentContainer.inv : PINV,
    dst = kind === 'cont' ? PINV : currentContainer.inv;
  if (invTransfer(src, dst, inst)) {
    S.click();
    renderInv();
  } else toast((kind === 'cont' ? 'Your inventory' : 'The destination') + ' has no room for ' + ITEMS[inst.id].name);
}
function gridUnder(x, y) {
  for (const k of ['inv', 'cont']) {
    if (k === 'cont' && !currentContainer) continue;
    const cx = gridCtx(k);
    if (!cx.el) continue;
    const r = (cx.view || cx.el).getBoundingClientRect();
    if (x >= r.left && x < r.right && y >= r.top && y < r.bottom) return k;
  }
  return null;
}
function overDrop(x, y) {
  const d = $('dropBtn');
  if (!d) return false;
  const r = d.getBoundingClientRect();
  return x >= r.left && x < r.right && y >= r.top && y < r.bottom;
}
function drawGhost() {
  document.querySelectorAll('.ghost').forEach(e => e.remove());
  const dz = $('dropBtn');
  if (dz) dz.classList.toggle('hi', !!invDragging && overDrop(invDragging.mx, invDragging.my));
  if (!invDragging) return;
  const k = gridUnder(invDragging.mx, invDragging.my);
  if (!k) return;
  const src = gridCtx(invDragging.kind),
    inst = src.inv.items.find(i => i.uid === invDragging.uid);
  if (!inst) return;
  const dst = gridCtx(k),
    [tw, th] = fp(inst, invDragging.previewRot);
  const rect = dst.el.getBoundingClientRect();
  const placeX = Math.floor((invDragging.mx - rect.left) / CELL) - invDragging.grabCellX,
    placeY = Math.floor((invDragging.my - rect.top) / CELL) - invDragging.grabCellY;
  const valid = invFits(dst.inv, inst, placeX, placeY, invDragging.previewRot);
  const ghost = document.createElement('div');
  ghost.className = 'ghost';
  ghost.style.left = placeX * CELL + 'px';
  ghost.style.top = placeY * CELL + 'px';
  ghost.style.width = tw * CELL + 'px';
  ghost.style.height = th * CELL + 'px';
  ghost.style.borderColor = valid ? '#facc15' : '#ef4444';
  ghost.style.background = valid ? 'rgba(250,204,21,.15)' : 'rgba(239,68,68,.15)';
  ghost.appendChild(iconCanvas(inst.id, tw * CELL - 4, th * CELL - 4, invDragging.previewRot));
  dst.el.appendChild(ghost);
}
/* ===== DROP: leave an item on the floor in a green drop box (a full box never swallows items: a new box is made) ===== */
function makeDropBox(x, z) {
  const g = new THREE.Group(),
    y0 = groundAt(x, z, pl.position.y - (G.eyeUsed || 1.6) + 0.35);
  g.position.set(x, y0, z);
  g.rotation.y = rnd(0, PI);
  scene.add(g);
  const pieces = [],
    add = (w, h, d, px, py, pz, c) => {
      pieces.push(mesh(BX(w, h, d), c, px, py, pz, g));
    };
  add(0.8, 0.5, 0.8, 0, 0.25, 0, 0x2e7d32);
  add(0.86, 0.08, 0.86, 0, 0.54, 0, 0x1b5e20);
  add(0.22, 0.3, 0.02, 0, 0.3, 0.41, 0xa5d6a7);
  const cont = {x, z, inv: newInv(16, 16), pieces, group: g, drop: true};
  g.userData = {kind: 'loot', cont};
  pieces.forEach(p => (p.userData = {kind: 'loot', cont}));
  dropBoxes.push(cont);
  try {
    if (window.RGW && RGW.texContainer) {
      g.userData.rgcont = 1;
      RGW.texContainer(cont);
    }
  } catch (e) {}
  return cont;
}
function dropItem(inst, srcInv) {
  const ox = inst.x,
    oy = inst.y,
    or = inst.rot;
  invRemove(srcInv, inst);
  const f = [-Math.sin(yaw), -Math.cos(yaw)],
    sp = freeSpot(pl.position.x + f[0] * 1.2, pl.position.z + f[1] * 1.2);
  let box = null;
  for (const b of dropBoxes)
    if (Math.hypot(b.x - sp[0], b.z - sp[1]) < 2.2 && invAdd(b.inv, inst)) {
      box = b;
      break;
    }
  if (!box) {
    const p2 = freeSpot(sp[0] + rnd(-0.9, 0.9), sp[1] + rnd(-0.9, 0.9));
    box = makeDropBox(p2[0], p2[1]);
    if (!invAdd(box.inv, inst)) {
      invPut(srcInv, inst, ox, oy, or);
      toast('Could not drop that');
      return;
    }
  }
  S.click();
  toast('Dropped ' + ITEMS[inst.id].name);
}
function dropDrag(e) {
  const d = invDragging;
  invDragging = null;
  document.querySelectorAll('.ghost').forEach(x => x.remove());
  const dz = $('dropBtn');
  if (dz) dz.classList.remove('hi');
  const src = gridCtx(d.kind),
    inst = src.inv.items.find(q => q.uid === d.uid);
  if (!inst) {
    renderInv();
    return;
  }
  if (overDrop(e.clientX, e.clientY)) {
    dropItem(inst, src.inv);
    renderInv();
    return;
  }
  const k = gridUnder(e.clientX, e.clientY);
  if (k) {
    const dst = gridCtx(k),
      r = dst.el.getBoundingClientRect(),
      tx = Math.floor((e.clientX - r.left) / CELL) - d.grabCellX,
      ty = Math.floor((e.clientY - r.top) / CELL) - d.grabCellY;
    if (invMove(src.inv, dst.inv, inst, tx, ty, d.previewRot)) {
      if (k !== d.kind) S.click();
    } else if (k !== d.kind) toast('Cannot place ' + ITEMS[inst.id].name + ' there');
  }
  renderInv();
}
function takeAllItems() {
  const c = currentContainer;
  let left = 0;
  c.inv.items.slice().forEach(inst => {
    if (!invTransfer(c.inv, PINV, inst)) left++;
  });
  refreshContainerVisual(c);
  if (left) toast('Inventory full - ' + left + ' item(s) left behind');
  else beep('sine', 520, 660, 0.1, 0.15);
  return left;
}
function takeAllQuick() {
  if (!currentContainer || currentContainer.hq) return;
  const left = takeAllItems();
  if (!left) closeInv();
  else renderInv();
}
function addItem(id) {
  const q = newInst(id);
  return q && invAdd(PINV, q) ? q : null;
}
function removeItemByUid(uid) {
  const inst = PINV.items.find(i => i.uid === uid);
  return inst ? invRemove(PINV, inst) : null;
}
function openContainer(cont) {
  currentContainer = cont;
  contShift = {x: 0, y: 0};
  showInvScr();
  renderInv();
  if (!cont.hq) anchorCont();
}
// Deposit: the real item objects move into the Fort HQ inventory (nothing is copied, nothing can be lost; HQ grows as needed)
function depositToHQ(quiet) {
  let n = 0;
  const before = resTotals(HQINV);
  PINV.items.slice().forEach(inst => {
    if (invTransfer(PINV, HQINV, inst)) n++;
  });
  if (n && !quiet) {
    const a = resTotals(HQINV),
      s = RES_KEYS.map(k => [k, a[k] - before[k]])
        .filter(x => x[1] > 0)
        .map(x => `+${x[1]} ${x[0]}`)
        .join(', ');
    toast('Deposited ' + n + ' item(s)' + (s ? ': ' + s : ''));
  }
  return n;
}
function svInvFromHQ(id) {
  const s = G.surv.find(q => q.id === id);
  if (s) openContainer(svInv(s));
}
function openHQInv() {
  openContainer(HQCONT);
}

function toggleTorch() {
  G.torchOn = !G.torchOn;
  torchL.intensity = G.torchOn ? 1.2 : 0;
  if (G.torchOn) beep('square', 400, 600, 0.05, 0.1);
  else beep('square', 600, 300, 0.05, 0.1);
}

/* v071 starting kits: the Police Station armoury gives a crowbar, a 9mm pistol + 2 boxes, a combat shotgun + 2 boxes of 12 gauge.
   The Prison and the School give one random melee weapon and one random pistol with 2 boxes of that pistol's ammo. */
