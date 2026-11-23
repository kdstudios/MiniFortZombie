/* ==========================================================================================================
   MINI FORT ZOMBIE - IN-GAME HUD (v077)
   Rebuilds the gameplay HUD in the menu / container / HQ look (styles: css/hud.css). Nothing about how the game drives the HUD changes:
   every element the game scripts write to keeps its id (clk, tts, fn, obj, day, cs, cm, cm2, cc1-5, hpv, hpb, stv, stb, mm, wsp, wn,
   ac, ar, pr, tw, tip), so js/game/core/*.js / skills.js / missions.js / savegame.js keep writing to them as before. This layer only:
   - wraps those elements in the new frames and adds the icons;
   - after every hud() call, redraws the wider compass strip, mirrors the look-at prompt and the weapon line into styled markup,
     marks low health / winded stamina / empty or low clip, and draws the body-status figure from the wound model (skills.js fzW);
   - styles each new toast (info / success / danger) and turns [E]-style keys into key caps;
   - doubles the radar's resolution (drawn by core at 128 x 128, now on a 256 x 256 canvas);
   - scales the HUD with the window (--hs, 1 at 1600 x 900).
   ========================================================================================================== */
(function () {
  'use strict';
  const $ = id => document.getElementById(id),
    HUD = $('hud');
  if (!HUD || typeof hud !== 'function') {
    console.warn('[hudui] no HUD');
    return;
  }
  const svg = (p, vb) => '<svg viewBox="' + (vb || '0 0 24 24') + '" aria-hidden="true">' + p + '</svg>';
  const IC = {
    target: svg(
      '<circle cx="12" cy="12" r="7.2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="2.2" fill="currentColor"/><path d="M12 1.5v5M12 17.5v5M1.5 12h5M17.5 12h5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
    ),
    pin: svg(
      '<path fill="currentColor" fill-rule="evenodd" d="M12 1.8a7.2 7.2 0 0 0-7.2 7.2c0 5.4 7.2 13.2 7.2 13.2s7.2-7.8 7.2-13.2A7.2 7.2 0 0 0 12 1.8zm0 10a2.8 2.8 0 1 1 0-5.6 2.8 2.8 0 0 1 0 5.6z"/>'
    ),
    heart: svg(
      '<path fill="currentColor" d="M12 21.2s-7.9-4.9-10-9.9C.5 7.7 2.7 3.6 6.6 3.6c2.2 0 3.8 1.2 5.4 3.1 1.6-1.9 3.2-3.1 5.4-3.1 3.9 0 6.1 4.1 4.6 7.7-2.1 5-10 9.9-10 9.9z"/><path fill="none" stroke="#000" stroke-opacity=".35" stroke-width="1.6" stroke-linejoin="round" d="M3.5 12h4l1.6-3 2.6 6.2 2-4.2h6.8"/>'
    ),
    bolt: svg('<path fill="currentColor" d="M14.2 1.5 3.8 13.6h6.5L8.6 22.5 20.2 9.6h-6.6z"/>'),
    bullets: svg(
      '<g fill="currentColor"><path d="M2.5 9.5C2.5 6 4.25 3 4.25 3S6 6 6 9.5V21H2.5z"/><path d="M8.75 9.5C8.75 6 10.5 3 10.5 3s1.75 3 1.75 6.5V21H8.75z"/><path d="M15 9.5C15 6 16.75 3 16.75 3s1.75 3 1.75 6.5V21H15z"/></g><path d="M2.5 11h3.5M8.75 11h3.5M15 11h3.5" stroke="#000" stroke-opacity=".45" stroke-width="1.2"/>',
      '0 0 21 24'
    ),
    info: svg(
      '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="7.3" r="1.5" fill="currentColor"/><path d="M12 10.8v6.6" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>'
    ),
    ok: svg(
      '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M7 12.4l3.3 3.3 6.6-7.2" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'
    ),
    warn: svg(
      '<path fill="currentColor" d="M12 2.2 23 21.5H1z"/><path d="M12 9v6" stroke="#0b0b0a" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="18.2" r="1.5" fill="#0b0b0a"/>'
    ),
    short: svg(
      '<circle cx="12" cy="12" r="2.6" fill="currentColor"/><circle cx="12" cy="12" r="6.2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="1.4" stroke-opacity=".28" stroke-dasharray="2 2.6"/>'
    ),
    medium: svg(
      '<circle cx="12" cy="12" r="2.6" fill="currentColor"/><circle cx="12" cy="12" r="6.2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>'
    ),
    far: svg(
      '<g fill="currentColor"><path d="M6.4 4.5h3.2l1 4H5.6z"/><path d="M14.4 4.5h3.2l.8 4h-5z"/><path fill-rule="evenodd" d="M5.4 8.2h5.4l.6 3h1.2l.6-3h5.4l1.9 7.6a4.3 4.3 0 1 1-8.3 2.2v-1.2h-.4V18a4.3 4.3 0 1 1-8.3-2.2zM6.9 15.2a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2zm10.2 0a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2z"/></g>'
    ),
    follow: svg(
      '<g fill="currentColor"><circle cx="12" cy="5.2" r="3"/><path d="M7.4 10.6c0-1 .8-1.8 1.8-1.8h5.6c1 0 1.8.8 1.8 1.8v5.6h-2.1V22H9.5v-5.8H7.4z"/><circle cx="4.6" cy="8" r="2.3" opacity=".75"/><path d="M1 12.4c0-.8.6-1.4 1.4-1.4h4v5.2H5.2V21H2.6v-4.8H1z" opacity=".75"/><circle cx="19.4" cy="8" r="2.3" opacity=".75"/><path d="M23 12.4c0-.8-.6-1.4-1.4-1.4h-4v5.2h1.2V21h2.6v-4.8H23z" opacity=".75"/></g>'
    ),
    stay: svg(
      '<path fill="currentColor" d="M12 1.6 3.4 4.8v6.4c0 5.3 3.6 9.8 8.6 11.2 5-1.4 8.6-5.9 8.6-11.2V4.8z"/><path fill="#0b0b0a" d="M9 7.4h1.5v5.4h.9V6.3h1.5v6.5h.9V7h1.5v5.8h.6V9.4h1.4v4.8c0 2.5-1.8 4.3-4.3 4.3h-.6c-1.7 0-3-.9-3.8-2.4L6.8 13l1.2-.6 1 1.4z"/>'
    ),
    fort: svg(
      '<path fill="currentColor" d="M2.5 21V9.2l2.4-1.6V4h3v2.2h2.4V4h3.4v2.2h2.4V4h3v3.6l2.4 1.6V21h-7v-5.2a2 2 0 0 0-4 0V21z"/>'
    ),
    truck: svg(
      '<path fill="currentColor" d="M1.5 6h12.8v10.2H1.5zM15.3 9h4.2l3 3.6v3.6h-7.2z"/><circle cx="6" cy="18" r="2.4" fill="currentColor" stroke="#000" stroke-width="1.2"/><circle cx="18" cy="18" r="2.4" fill="currentColor" stroke="#000" stroke-width="1.2"/>'
    )
  };
  const H = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'})[c]);
  /* [E] / (E) / [LMB]-style keys become key caps */
  const keys = s =>
    H(s)
      .replace(/\[([A-Z0-9]|LMB|RMB|TAB|ESC|SPACE|SHIFT)\]/g, '<span class="hk">$1</span>')
      .replace(/\(([A-Z])\)/g, '<span class="hk">$1</span>');
  const el = (tag, cls, html) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  };

  /* ---------------------------------------------------------------- build */
  function build() {
    /* clock (lives outside #hud, z-index 50, shown by clkVis) */
    const ck = $('clkBox');
    if (ck && !ck.dataset.v77) {
      ck.dataset.v77 = 1;
      const clk = $('clk'),
        tts = $('tts'),
        fn = $('fn');
      clk.className = '';
      tts.className = '';
      fn.className = '';
      const f = el('div', 'hf hRed');
      f.appendChild(clk);
      f.appendChild(tts);
      f.appendChild(el('div', 'ckRule'));
      const hq = el('div', 'ckHq', '<i>' + IC.pin + '</i>');
      hq.appendChild(fn);
      f.appendChild(hq);
      ck.innerHTML = '';
      ck.appendChild(f);
    }
    /* the old blocks are found by what they hold */
    const opOld = $('obj') && $('obj').closest('.p'),
      vitOld = $('hpb') && $('hpb').closest('.p'),
      wOld = $('wsp') && $('wsp').closest('.p'),
      cmpOld = $('cs') && $('cs').parentNode,
      mm = $('mm');
    /* left column: operation + mission / rumours */
    const tl = el('div', 'hud-scale');
    tl.id = 'hTL';
    HUD.appendChild(tl);
    const op = el('div', 'hf');
    op.id = 'hOp';
    op.innerHTML = '<i class="opI">' + IC.target + '</i><div class="opH hT">Operation</div>';
    const obj = $('obj'),
      day = $('day');
    obj.className = '';
    obj.hidden = true;
    op.appendChild(obj);
    const ob = el('div');
    ob.id = 'hObj';
    op.appendChild(ob);
    if (day) op.appendChild(day);
    tl.appendChild(op);
    if (opOld) opOld.remove();
    /* compass */
    if (cmpOld) {
      const c = el('div', 'hf');
      c.id = 'hCmp';
      const win = el('div', 'cpWin'),
        cs = $('cs');
      cs.removeAttribute('style');
      win.appendChild(cs);
      const cm = $('cm'),
        cm2 = $('cm2');
      cm.innerHTML = IC.fort;
      cm2.innerHTML = IC.truck;
      cm.removeAttribute('style');
      cm2.removeAttribute('style');
      cm2.style.display = 'none';
      win.appendChild(cm);
      win.appendChild(cm2);
      c.appendChild(win);
      c.appendChild(el('i', 'cpNeedle'));
      c.appendChild(el('i', 'cpLine'));
      cmpOld.replaceWith(c);
      compassStrip();
    }
    /* companion orders */
    const OI = [0, 'short', 'medium', 'far', 'follow', 'stay'];
    for (let i = 1; i <= 5; i++) {
      const b = $('cc' + i);
      if (!b) continue;
      const t = b.textContent.replace(/^\d/, '').trim();
      b.innerHTML = '<b>' + i + '</b><i class="ccI">' + IC[OI[i]] + '</i><span>' + H(t) + '</span>';
    }
    /* bottom left: body + vitals */
    const bl = el('div', 'hud-scale');
    bl.id = 'hBL';
    HUD.appendChild(bl);
    const body = el('div', 'hf');
    body.id = 'hBody';
    body.innerHTML = bodySvg();
    bl.appendChild(body);
    const mk = (id, cls, ico, lab, v, b) => {
      const r = el('div', 'hf hv ' + cls);
      r.id = id;
      r.innerHTML =
        '<div class="hvI"><i>' +
        ico +
        '</i></div><div class="hvB"><div class="hvT"><span>' +
        lab +
        '</span><span></span></div><div class="bar"></div></div>';
      const vv = $(v),
        bb = $(b);
      vv.removeAttribute('class');
      r.querySelector('.hvT span:last-child').replaceWith(vv);
      bb.removeAttribute('style');
      r.querySelector('.bar').appendChild(bb);
      return r;
    };
    bl.appendChild(mk('hHp', 'hRed', IC.heart, 'Health', 'hpv', 'hpb'));
    bl.appendChild(mk('hSt', 'hGrn', IC.bolt, 'Stamina', 'stv', 'stb'));
    if (vitOld) vitOld.remove();
    /* radar: same drawing, twice the pixels, octagon frame */
    if (mm) {
      const f = el('div', 'hf hRed');
      f.id = 'hMap';
      mm.replaceWith(f);
      mm.removeAttribute('style');
      f.appendChild(mm);
      f.appendChild(el('i', 'mpTick'));
      f.appendChild(el('i', 'mpCor'));
      mm.width = 256;
      mm.height = 256;
      const c = mm.getContext('2d');
      c.setTransform(2, 0, 0, 2, 0, 0);
      c.imageSmoothingEnabled = true;
    }
    /* weapon */
    const wp = el('div', 'hf');
    wp.id = 'hWpn';
    wp.innerHTML =
      '<i class="wpSl"></i><i class="wpSl2"></i><div class="wpTop"><span class="wpName"></span><span class="wpIdx"></span></div><div class="wpSub"></div>' +
      '<div class="wpBot"><span class="wpMelee">Melee</span><span class="wpAmmo"><i class="wpB">' +
      IC.bullets +
      '</i><b id="hAc"></b><span class="wpRes">/ </span></span></div>';
    const wsp = $('wsp'),
      wn = $('wn'),
      ac = $('ac'),
      ar = $('ar');
    wsp.removeAttribute('style');
    wsp.hidden = true;
    wp.querySelector('.wpBot').prepend(wsp);
    const wk = el('canvas');
    wk.id = 'hWsp';
    wp.querySelector('.wpBot').prepend(wk);
    ac.removeAttribute('class');
    wp.querySelector('#hAc').replaceWith(ac);
    wp.querySelector('.wpRes').appendChild(ar);
    wn.hidden = true;
    wn.className = '';
    wp.appendChild(wn);
    HUD.appendChild(wp);
    if (wOld) wOld.remove();
    /* look-at prompt (mirrored from #pr, which stays as the game's text store) */
    const pr = el('div', 'hf hAmb');
    pr.id = 'hPr';
    HUD.appendChild(pr);
    /* fort building hint as key caps */
    const tip = $('tip');
    if (tip) {
      const K = k => '<span class="hk">' + k + '</span>';
      tip.innerHTML =
        K('Z') +
        ' Barricade ghost (15 mat) <b>\u00b7</b> ' +
        K('Scroll') +
        ' rotate <b>\u00b7</b> ' +
        K('Z') +
        ' place <b>\u00b7</b> ' +
        K('X') +
        ' cancel <b>\u00b7</b> ' +
        K('E') +
        ' on a barricade: repair (5 mat) <b>\u00b7</b> ' +
        K('Esc') +
        ' HQ';
    }
    window.addEventListener('resize', scale);
    scale();
    /* toasts */
    const tw = $('tw');
    if (tw)
      new MutationObserver(ms => {
        for (const m of ms)
          for (const n of m.addedNodes) if (n.nodeType === 1 && !n.classList.contains('hT2')) styleToast(n);
      }).observe(tw, {childList: true});
  }
  /* ---------------------------------------------------------------- scale with the window */
  /* v079: Options > Graphics > Display "In-game HUD size" multiplies the window scale (50-150 %, kept in localStorage "mfz_hudsize"). Only --hs (the walking-around HUD) uses it. */
  let hudUser = 1;
  try {
    const v = +localStorage.getItem('mfz_hudsize');
    if (v >= 50 && v <= 150) hudUser = v / 100;
  } catch (e) {}
  function scale() {
    const s = Math.max(0.62, Math.min(1.3, Math.min(innerWidth / 1600, innerHeight / 900))) * hudUser;
    document.documentElement.style.setProperty('--hs', s.toFixed(3));
  }
  function hudSizeUI() {
    const pc = Math.round(hudUser * 100);
    document.querySelectorAll('.hudsz').forEach(x => (x.value = pc));
    document.querySelectorAll('.hudszv').forEach(x => (x.textContent = pc + '%'));
  }
  document.querySelectorAll('.hudsz').forEach(e =>
    e.addEventListener('input', () => {
      const v = Math.max(50, Math.min(150, +e.value || 100));
      hudUser = v / 100;
      try {
        localStorage.setItem('mfz_hudsize', String(v));
      } catch (_) {}
      hudSizeUI();
      scale();
    })
  );
  hudSizeUI();
  /* ---------------------------------------------------------------- compass (2.4 px a degree, three turns so it never runs out) */
  const CW = 432,
    PX = 2.4,
    LAB = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  function compassStrip() {
    const cs = $('cs');
    let h = '';
    for (let d = 0; d <= 1080; d += 15) {
      const x = (d * PX).toFixed(1);
      if (d % 45 === 0) {
        const l = LAB[(4 + d / 45) % 8];
        h +=
          '<span class="' +
          (l.length === 1 ? 'c' : '') +
          (l === 'N' ? ' n' : '') +
          '" style="left:' +
          x +
          'px">' +
          l +
          '</span>';
      } else h += '<i class="' + (d % 45 === 15 || d % 45 === 30 ? '' : 'mid') + '" style="left:' + x + 'px"></i>';
    }
    cs.innerHTML = h;
    cs.dataset.v77 = 1;
  }
  let cx0 = null;
  function compass() {
    if (typeof yaw === 'undefined' || typeof TAU === 'undefined') return;
    const hd = ((-yaw % TAU) + TAU) % TAU,
      deg = (hd * 180) / Math.PI,
      x = Math.round((CW / 2 - (deg + 360) * PX) * 2) / 2;
    const cs = $('cs');
    if (cs.lastElementChild && !cs.lastElementChild.style.left) {
      compassStrip();
      cx0 = null;
    } /* core fills #cs with its own strip at start-up */
    if (x !== cx0) {
      cx0 = x;
      cs.style.transform = 'translateX(' + x + 'px)';
    }
    cs.style.left = '0px';
    const m = G.mode,
      t =
        m === 'EXPEDITION' ? (typeof TRUCK !== 'undefined' ? TRUCK : null) : typeof FORT !== 'undefined' ? FORT : null,
      e = $(m === 'EXPEDITION' ? 'cm2' : 'cm');
    if (!t || !e) return;
    let r = Math.atan2(t.x - pl.position.x, -(t.z - pl.position.z)) - hd;
    r = (Math.atan2(Math.sin(r), Math.cos(r)) * 180) / Math.PI;
    e.style.left = (CW / 2 + Math.max(-CW / 2 + 10, Math.min(CW / 2 - 10, r * PX))).toFixed(1) + 'px';
  }
  /* ---------------------------------------------------------------- body status (wound model from skills.js; falls back to overall health) */
  const PARTS = {
    head: '<circle data-p="head" cx="30" cy="10.5" r="8.5"/>',
    torso: '<path data-p="torso" d="M19.5 22.5h21c2 0 3.4 1.6 3.2 3.6L41.6 58H18.4l-2.1-31.9c-.2-2 1.2-3.6 3.2-3.6z"/>',
    armL: '<path data-p="armL" d="M14.6 24.2c-2.6.6-4.3 2.8-4.5 5.4L8.6 54.4l6.4 1.2 2.4-23.8z"/>',
    armR: '<path data-p="armR" d="M45.4 24.2c2.6.6 4.3 2.8 4.5 5.4l1.5 24.8-6.4 1.2-2.4-23.8z"/>',
    legL: '<path data-p="legL" d="M18.6 60h10.2l-1 52.5h-8.1z"/>',
    legR: '<path data-p="legR" d="M31.2 60h10.2l-1.1 52.5h-8.1z"/>'
  };
  function bodySvg() {
    return '<svg viewBox="0 0 60 116">' + Object.values(PARTS).join('') + '</svg>';
  }
  let bodyT = 0;
  const bodyC = {};
  function body() {
    const n = performance.now();
    if (n - bodyT < 120) return;
    bodyT = n;
    const b = $('hBody');
    if (!b) return;
    const W = window.fzW,
      Wt = window.fzWt || {},
      on = W && typeof FZ !== 'undefined' && FZ.T && FZ.T.on,
      hp = G.maxHp ? G.hp / G.maxHp : 1;
    for (const p of b.querySelectorAll('[data-p]')) {
      const k = p.dataset.p,
        f = on ? 1 - (W[k] || 0) : hp,
        fl = on && n - (Wt[k] || -1e9) < 700;
      const c = fl ? '#ffffff' : f < 0.25 ? '#d8342a' : f < 0.5 ? '#e9b43c' : '#5fc23a';
      if (bodyC[k] !== c) {
        bodyC[k] = c;
        p.setAttribute('fill', c);
      }
    }
  }
  /* ---------------------------------------------------------------- weapon line ("Name · Ammo  [i/n]") */
  let wnK = '';
  function weapon() {
    const wn = $('wn'),
      wp = $('hWpn');
    if (!wn || !wp) return;
    const t = wn.textContent,
      ac = $('ac').textContent;
    const k = t + '|' + ac;
    if (k === wnK) return;
    wnK = k;
    const m = t.match(/^(.*?)(?: · (.*?))?\s*\[(\d+)\/(\d+)\]\s*$/) || [0, t, '', 0, 0];
    wp.querySelector('.wpName').textContent = m[1] || 'Fist';
    wp.querySelector('.wpIdx').textContent = m[3] ? '[' + m[3] + '/' + m[4] + ']' : '';
    wp.querySelector('.wpSub').textContent = m[2] || '';
    const melee = !m[2] || ac === '-',
      eq = typeof G !== 'undefined' && G.eq && typeof WDEF !== 'undefined' ? WDEF[G.eq.id] : null,
      cl = [parseInt(ac, 10) || 0, (eq && eq.cap) || 0];
    /* v079: #ac is just the rounds in the gun */ wp.classList.toggle('melee', melee);
    wp.classList.toggle('empty', !melee && cl[0] === 0);
    wp.classList.toggle('low', !melee && cl[0] > 0 && cl[1] > 0 && cl[0] / cl[1] <= 0.25);
  }
  /* weapon picture: the inventory icon with its backdrop keyed out (flood fill from the edges), so the gun sits on the panel */
  let wkK = '',
    wkT = 0;
  function weaponPic() {
    const n = performance.now();
    if (n - wkT < 250) return;
    wkT = n;
    const s = $('wsp'),
      d = $('hWsp');
    if (!s || !d) return;
    if (s.style.display === 'none' || !s.width || s.width < 2) {
      d.style.display = 'none';
      wkK = '';
      return;
    }
    d.style.display = '';
    let x;
    try {
      x = s.getContext('2d').getImageData(0, 0, s.width, s.height);
    } catch (e) {
      return;
    }
    const w = s.width,
      h = s.height,
      p = x.data;
    let k = w + 'x' + h;
    for (let i = 0; i < 12; i++) {
      const j = ((i * 977) % (w * h)) * 4;
      k += ',' + p[j] + p[j + 1] + p[j + 2];
    }
    if (k === wkK) return;
    wkK = k;
    const at = i => [p[i * 4], p[i * 4 + 1], p[i * 4 + 2]],
      m = Math.min(4, w >> 3, h >> 3),
      BG = [
        at(0),
        at(m * w + m),
        at(Math.min(w * h - 1, (m + 2) * w + m + 2))
      ]; /* the frame line and the backdrop inside it */
    const near = i => {
      const q = i * 4;
      if (p[q + 3] < 16) return true;
      for (const b of BG) {
        const dr = p[q] - b[0],
          dg = p[q + 1] - b[1],
          db = p[q + 2] - b[2];
        if (dr * dr + dg * dg + db * db < 20 * 20) return true;
      }
      return false;
    };
    const seen = new Uint8Array(w * h),
      st = [];
    for (let i = 0; i < w; i++) {
      st.push(i, (h - 1) * w + i);
    }
    for (let j = 0; j < h; j++) {
      st.push(j * w, j * w + w - 1);
    }
    while (st.length) {
      const i = st.pop();
      if (seen[i] || !near(i)) continue;
      seen[i] = 1;
      p[i * 4 + 3] = 0;
      const cx = i % w,
        cy = (i - cx) / w;
      if (cx > 0) st.push(i - 1);
      if (cx < w - 1) st.push(i + 1);
      if (cy > 0) st.push(i - w);
      if (cy < h - 1) st.push(i + w);
    }
    d.width = w;
    d.height = h;
    d.getContext('2d').putImageData(x, 0, 0);
  }
  /* ---------------------------------------------------------------- prompt mirror */
  let prK = null,
    obK = null;
  function objective() {
    const o = $('obj'),
      d = $('hObj');
    if (!o || !d) return;
    const t = o.textContent;
    if (t === obK) return;
    obK = t;
    d.innerHTML = keys(t);
  }
  function prompt() {
    const pr = $('pr'),
      o = $('hPr');
    if (!pr || !o) return;
    const t = pr.style.opacity === '0' ? '' : pr.textContent;
    if (t === prK) return;
    prK = t;
    o.classList.toggle('on', !!t);
    if (t) o.innerHTML = keys(t);
  }
  /* ---------------------------------------------------------------- toasts */
  function styleToast(d) {
    const t = d.textContent;
    let k = 'info';
    const caps = /\b[A-Z]{4,}\b.*\b[A-Z]{3,}\b/.test(t); /* a shouted message (THE HORDE ...) */
    if (caps || /\bhorde\b|bitten|infected|you died|overrun|siege begins/i.test(t)) k = 'bad';
    if (
      /joined|recruited|confirmed|found|saved|repaired|crafted|returned|unlocked|learned|complete|picked up|rescued/i.test(
        t
      ) &&
      k !== 'bad'
    )
      k = 'ok';
    d.className = 'hT2 ' + k;
    d.innerHTML = '<i>' + (k === 'ok' ? IC.ok : k === 'bad' ? IC.warn : IC.info) + '</i><span>' + keys(t) + '</span>';
  }
  /* ---------------------------------------------------------------- per frame, after the game's own hud() */
  let st0 = null,
    hp0 = null;
  function post() {
    try {
      if (HUD.classList.contains('hide')) return;
      compass();
      prompt();
      objective();
      weapon();
      weaponPic();
      body();
      const lk = !!G.stLock;
      if (lk !== st0) {
        st0 = lk;
        $('hSt').classList.toggle('lock', lk);
      }
      const lo = G.maxHp > 0 && G.hp / G.maxHp <= 0.25;
      if (lo !== hp0) {
        hp0 = lo;
        $('hHp').classList.toggle('low', lo);
      }
      const rum = $('fzRum'),
        tl = $('hTL');
      if (rum && tl && rum.parentNode !== tl) tl.appendChild(rum);
    } catch (e) {
      if (!post.err) {
        post.err = 1;
        console.warn('[hudui]', e);
      }
    }
  }
  try {
    build();
  } catch (e) {
    console.error('[hudui] build failed', e);
  }
  const _h = hud;
  hud = function () {
    const r = _h.apply(this, arguments);
    post();
    return r;
  };
  console.log('[hudui] v080 HUD ready');
})();
