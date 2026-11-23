/* ==========================================================================================================
   MINI FORT ZOMBIE - ONLINE CO-OP (v086)
   One friend, anywhere in the world, plays one of your survivors on a map mission.

   HOW IT WORKS (host-authoritative; the host's game is the only one that runs the zombies)
   - Transport: PeerJS / WebRTC, loaded from the CDN only when a room is opened or joined (same idea as Riposte Frontline's
     09c-net.js). A 5-letter room code is the whole address. ?coopnet=local swaps in a same-browser BroadcastChannel transport
     (two tabs on one machine); a test harness can also supply window.__coopBridge to pass messages between two browsers.
   - World: the host picks a seed when the drive starts. Both games build the mission town from that seed (worldSteps is wrapped so
     every build step draws from one seeded stream). modelFor / makeHuman are isolated onto a private random stream so their
     one-time texture caches cannot shift the world stream (this made the first build of a session differ from later ones).
     After the build both sides compare a signature (buildings, collision boxes, doors, loot, npcs, zombies).
   - Zombies: the host simulates them. The guest keeps the zombies its own seeded build made, adopts them by id, and just moves them
     from host snapshots (about 10 per second, only zombies near a player). The guest never runs updateZombies.
   - The guest's survivor: a normal survivor record lent from the host's G.surv. On the host it is a companion mesh that is NOT in
     comps (no AI) but IS in smesh, so the existing zombie code attacks it and hurts s.hp. The guest controls it with their own
     camera, weapon and backpack (PINV); the pack is saved back into the survivor's inventory when the mission ends.
   - Shooting: the guest fires locally for feel; hitZ / dmgZ on a puppet become a hit claim the host applies with the real functions.
   - Shared: doors (open/close/break), loot containers (contents), rescuing survivors (the host recruits them), the clock.
   ========================================================================================================== */
(function () {
  'use strict';
  if (typeof worldSteps !== 'function' || typeof go !== 'function' || typeof spawnComp !== 'function') {
    console.warn('[coop] core missing');
    return;
  }
  const C = (window.COOP = {
    ver: 4,
    role: 'off', // off | host | guest
    code: null,
    peer: null,
    conn: null,
    seed: null, // armed seed: the next EXPEDITION build is seeded
    mis: null, // {seed, sig, ...} the running co-op mission
    active: false, // guest: world built and snapshots flowing; host: guest present in the mission
    run: false, // the co-op run is live (both players loaded and the host pressed the key): the world never pauses
    began: false,
    lent: null,
    name: 'Player',
    dbg: {}
  });
  const PI = Math.PI;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const r2 = v => Math.round(v * 100) / 100;
  const now = () => performance.now();
  const $$ = id => document.getElementById(id);
  const say = t => {
    try {
      toast(t);
    } catch (e) {
      console.log('[coop]', t);
    }
  };
  const log = (...a) => console.log('[coop]', ...a);

  /* ---------------- seeded random ---------------- */
  function mb(a) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function h32(s) {
    let h = 2166136261;
    s = String(s);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }
  /* One-time caches (melee model textures, zombie outfit palettes) draw random numbers the first time they are built. Left alone
     that shifts the seeded world stream, so the first build of a session differed from every later one. Isolating these two
     builders onto their own stream makes cold and warm builds identical (verified: buildings, solids, doors, loot, trees). */
  let PRIV = mb((Date.now() ^ ((Math.random() * 4294967296) >>> 0)) >>> 0);
  function isolate(name) {
    const f = window[name];
    if (typeof f !== 'function' || f.__coopIso) return;
    const w = function () {
      const o = Math.random;
      Math.random = PRIV;
      try {
        return f.apply(this, arguments);
      } finally {
        Math.random = o;
      }
    };
    w.__coopIso = 1;
    window[name] = w;
  }
  isolate('modelFor');
  isolate('makeHuman');

  /* seeded world build: every worldSteps step draws from one stream; the mission site has its own sub-seed (as Dev Mode does) */
  const _ws = worldSteps;
  worldSteps = function () {
    const st = _ws.apply(this, arguments);
    if (C.seed == null) return st;
    const seed = C.seed >>> 0,
      rng = mb(seed);
    PRIV = mb((seed ^ 0x5bd1e995) >>> 0);
    return st.map(s => [
      s[0],
      function () {
        const o = Math.random;
        Math.random = rng;
        try {
          return s[1].apply(this, arguments);
        } finally {
          Math.random = o;
        }
      },
      s[2]
    ]);
  };
  if (typeof fzRumors === 'function') {
    const _fr = fzRumors;
    fzRumors = function () {
      if (C.seed == null) return _fr.apply(this, arguments);
      const o = Math.random;
      Math.random = mb(h32((C.seed >>> 0) + ':mission'));
      try {
        return _fr.apply(this, arguments);
      } finally {
        Math.random = o;
      }
    };
  }

  /* ---------------- helpers: items / inventories / survivors ---------------- */
  function prim(o) {
    const r = {};
    for (const k in o) {
      const v = o[k];
      if (v === null || ['number', 'string', 'boolean'].includes(typeof v)) r[k] = v;
    }
    return r;
  }
  /* a plain copy of a survivor record: no 3D objects, no links back to followers, and a hard cap so it can never run away */
  function plain(v, d = 0, cnt = {n: 0}) {
    if (v === null || typeof v !== 'object') return typeof v === 'function' ? undefined : v;
    if (d > 5 || v.isObject3D || ++cnt.n > 1500) return undefined;
    if (Array.isArray(v)) return v.map(x => plain(x, d + 1, cnt)).filter(x => x !== undefined);
    const r = {};
    for (const k in v) {
      if (k === 'invc' || k === 'eq' || k === 'm' || k === 'mesh' || k === 'c' || k === 'comp' || k[0] === '_') continue;
      const x = plain(v[k], d + 1, cnt);
      if (x !== undefined) r[k] = x;
    }
    return r;
  }
  function invDump(inv, eq) {
    const items = inv.items.map(q => prim(q));
    return {w: inv.w, h: inv.h, items, eq: eq ? inv.items.indexOf(eq) : -1};
  }
  /* returns the created instances in dump order (so an equipped index can be mapped back) */
  function invLoadInto(inv, dump) {
    inv.items.length = 0;
    inv.h = inv.minH || inv.h;
    inv.g = makeGrid(inv.w, inv.h);
    const out = [];
    const order = (dump.items || []).map((d, i) => [d, i]).sort((a, b) => (a[0].y | 0) - (b[0].y | 0) || (a[0].x | 0) - (b[0].x | 0));
    for (const [d, i] of order) {
      if (!ITEMS[d.id]) continue;
      const q = newInst(d.id);
      if (!q) continue;
      for (const k in d) if (k !== 'id' && k !== 'uid' && k !== 'x' && k !== 'y' && k !== 'rot') q[k] = d[k];
      if (invFits(inv, q, d.x | 0, d.y | 0, !!d.rot)) invPut(inv, q, d.x | 0, d.y | 0, !!d.rot);
      else if (!invAdd(inv, q)) continue;
      out[i] = q;
    }
    try {
      if (typeof invTrim === 'function') invTrim(inv);
    } catch (e) {}
    return out;
  }

  /* ---------------- transport ---------------- */
  const ABC = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789',
    PREFIX = 'mfzcoop-';
  const newCode = () => Array.from({length: 5}, () => ABC[(Math.random() * ABC.length) | 0]).join('');
  const useLocal = () => /[?&]coopnet=local/.test(location.search);
  /* same-browser transport with the PeerJS shape (tests, and two tabs on one machine) */
  function makeLocal() {
    /* test bridge: a harness can pass messages between two separate browsers via window.__coopBridge / __coopRecv */
    const bridged = typeof window.__coopBridge === 'function';
    const bc = bridged
      ? {
          postMessage: m => window.__coopBridge(JSON.stringify(m)),
          set onmessage(f) {
            window.__coopRecv = s => f({data: JSON.parse(s)});
          }
        }
      : new BroadcastChannel('mfz-coop-local');
    class Emitter {
      constructor() {
        this.h = {};
      }
      on(e, f) {
        (this.h[e] = this.h[e] || []).push(f);
        return this;
      }
      emit(e, ...a) {
        (this.h[e] || []).forEach(f => {
          try {
            f(...a);
          } catch (err) {
            console.error('[coop] handler', err);
          }
        });
      }
    }
    class LConn extends Emitter {
      constructor(peer, remote, cid) {
        super();
        Object.assign(this, {peer, remote, cid, open: false});
      }
      send(d) {
        bc.postMessage({k: 'd', to: this.remote, from: this.peer.id, cid: this.cid, d});
      }
      close() {
        bc.postMessage({k: 'x', to: this.remote, from: this.peer.id, cid: this.cid});
        this.emit('close');
      }
    }
    class LPeer extends Emitter {
      constructor(id) {
        super();
        this.id = id;
        this.conns = {};
        bc.onmessage = ev => {
          const m = ev.data;
          if (m.to !== this.id) return;
          if (m.k === 'hello') {
            const c = new LConn(this, m.from, m.cid);
            this.conns[m.cid] = c;
            c.open = true;
            this.emit('connection', c);
            bc.postMessage({k: 'ack', to: m.from, from: this.id, cid: m.cid});
            setTimeout(() => c.emit('open'), 0);
          } else if (m.k === 'ack') {
            const c = this.conns[m.cid];
            if (c) {
              c.open = true;
              c.emit('open');
            }
          } else if (m.k === 'd') {
            const c = this.conns[m.cid];
            if (c) c.emit('data', m.d);
          } else if (m.k === 'x') {
            const c = this.conns[m.cid];
            if (c) c.emit('close');
          }
        };
        setTimeout(() => this.emit('open', id), 0);
      }
      connect(rid) {
        const cid = Math.random().toString(36).slice(2);
        const c = new LConn(this, rid, cid);
        this.conns[cid] = c;
        bc.postMessage({k: 'hello', to: rid, from: this.id, cid});
        return c;
      }
      destroy() {
        bc.onmessage = null;
      }
    }
    return LPeer;
  }
  let peerLib = null;
  function loadPeer(cb) {
    if (useLocal()) return cb(null, makeLocal());
    if (window.Peer) return cb(null, window.Peer);
    if (peerLib) return peerLib.push(cb);
    peerLib = [cb];
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js';
    s.integrity = 'sha384-x0YgkOr/3UOZP2CRDxGW9e0Q+2Qjyr3uJrm4xU32Y7ZCNAo7Cc7bjhrZMi/dwczu';
    s.crossOrigin = 'anonymous';
    s.onload = () => {
      const l = peerLib;
      peerLib = null;
      l.forEach(f => f(null, window.Peer));
    };
    s.onerror = () => {
      const l = peerLib;
      peerLib = null;
      l.forEach(f => f('Could not load the online library (are you offline?)'));
    };
    document.head.appendChild(s);
  }
  function mkPeer(P, id) {
    return useLocal() ? new P(id) : new P(id, {debug: 0});
  }
  function send(m) {
    if (C.conn && (C.conn.open !== false || useLocal())) {
      try {
        C.conn.send(m);
        C.dbg.sent = (C.dbg.sent || 0) + 1;
      } catch (e) {
        console.warn('[coop] send', e);
      }
    }
  }
  let lastRx = 0;
  function bindConn(c, onData, onClose, slot) {
    if (!slot) C.conn = c; // a guest's single link to the host (the host keeps one per guest slot)
    c.on('data', m => {
      if (slot) slot.rx = now();
      else lastRx = now();
      try {
        if (m && m.t) onData(m);
      } catch (e) {
        console.error('[coop] message', m && m.t, e);
      }
    });
    c.on('close', onClose);
    c.on('error', onClose);
  }
  let hbLast = now();
  setInterval(() => {
    // a long build or a stall freezes this game's own timers: that is not the other side going quiet, so give everyone a fresh start
    const t = now(),
      stalled = t - hbLast > 6000;
    hbLast = t;
    if (stalled) {
      C.guests.forEach(g => (g.rx = t));
      if (lastRx) lastRx = t;
      return;
    }
    if (C.role === 'host') {
      for (const g of C.guests.slice()) {
        sendG(g, {t: 'pg'});
        if (g.rx && now() - g.rx > 60000) {
          g.rx = 0;
          guestGone(g, 'timed out');
        }
      }
    } else if (C.conn && C.role === 'guest') {
      send({t: 'pg'});
      if (lastRx && now() - lastRx > 60000) {
        lastRx = 0;
        hostGone('The host stopped responding.');
      }
    }
  }, 2000);

  /* ---------------- ids: both games number the same things the same way after an identical build ---------------- */
  function conts() {
    return scene.children.filter(o => o.userData && o.userData.kind === 'loot' && o.userData.cont && !o.userData.cont.drop);
  }
  function tagIds() {
    zombies.forEach((z, i) => (z.userData.cid = i));
    C.nextCid = zombies.length;
    doors.forEach((d, i) => (d.cid = i));
    conts().forEach((o, i) => (o.userData.cont.cid = i));
    npcList.forEach((n, i) => (n.userData.cid = i));
    C.zmap = {};
    zombies.forEach(z => (C.zmap[z.userData.cid] = z));
    C.cmap = {};
    conts().forEach(o => (C.cmap[o.userData.cont.cid] = o.userData.cont));
    C.csig = {};
    for (const k in C.cmap) C.csig[k] = csigOf(C.cmap[k]);
  }
  function csigOf(c) {
    let h = c.inv.items.length;
    for (const q of c.inv.items) h = (Math.imul(h, 31) + h32(q.id) + (q.n | 0) + (q.qty | 0)) >>> 0;
    return h + '';
  }
  /* a cheap fingerprint of a pack (what is where), used to see who changed it last */
  function packSig(inv) {
    let h = inv.items.length;
    for (const q of inv.items) h = (Math.imul(h, 31) + h32(q.id + ':' + q.x + ',' + q.y + ',' + (q.rot ? 1 : 0) + ':' + (q.clip | 0) + ':' + (q.n | 0) + ':' + (q.dur | 0))) >>> 0;
    return h + '';
  }
  const myPackSig = () => packSig(PINV) + ':' + (G.eq ? PINV.items.indexOf(G.eq) : -1);
  const LIMBS = [['head', 16], ['armL', 32], ['armR', 64], ['legL', 128], ['legR', 256]];
  const limbMask = u => (u.no_head ? 16 : 0) | (u.no_armL ? 32 : 0) | (u.no_armR ? 64 : 0) | (u.no_legL ? 128 : 0) | (u.no_legR ? 256 : 0);
  function applyLimbs(z, f) {
    const u = z.userData;
    if (!u.parts) return;
    for (const [p, b] of LIMBS)
      if (f & b && !u['no_' + p]) {
        try {
          dismemberQuiet(z, p);
        } catch (e) {}
      }
  }
  function sig() {
    let hh = 0;
    for (const b of buildings) hh = (Math.imul(hh, 31) + Math.round(b.x * 10) * 7 + Math.round(b.z * 10) * 13 + (b.t || '').length) >>> 0;
    let sh = 0;
    for (const s of solids) if (s && s.min) sh = (Math.imul(sh, 31) + Math.round((s.min.x + s.max.x + s.min.z + s.max.z) * 10)) >>> 0;
    let ch = 0;
    const cs = conts();
    for (const o of cs) ch = (Math.imul(ch, 31) + Math.round(o.userData.cont.x * 10) + o.userData.cont.inv.items.length * 7) >>> 0;
    // the fort and siege worlds are the same fixed fort every time (and their town list varies with what was built before), so only the
    // things that matter for walking around are compared there
    const fortish = G.mode !== 'EXPEDITION';
    return [fortish ? 0 : buildings.length, fortish ? 0 : hh, solids.length, sh, doors.length, cs.length, ch, npcList.length, fortish ? 0 : zombies.length].join('/');
  }

  /* ---------------- little UI ---------------- */
  const css = document.createElement('style');
  css.textContent = `
#coopBtn{position:fixed;right:14px;bottom:14px;z-index:55;background:#1a1d16;color:#facc15;border:1px solid #6b5d1a;padding:8px 14px;font:700 13px Impact,sans-serif;letter-spacing:.12em;cursor:pointer;display:none}
#coopBtn.on{background:#365314;color:#fff}
#coopBox{position:fixed;inset:0;z-index:90;background:rgba(0,0,0,.78);display:none;align-items:center;justify-content:center;font-family:system-ui,sans-serif}
#coopBox .cb{background:#14160f;border:1px solid #6b5d1a;color:#ddd;padding:22px 26px;min-width:340px;max-width:460px;text-align:center}
#coopBox h2{margin:0 0 8px;color:#facc15;font:700 26px Impact,sans-serif;letter-spacing:.1em}
#coopBox .code{font:700 44px monospace;letter-spacing:.25em;color:#fff;margin:6px 0;user-select:all}
#coopBox .st{margin:8px 0;font-size:14px;color:#aab}
#coopBox button{margin:4px;padding:7px 14px;background:#222;color:#eee;border:1px solid #555;cursor:pointer;font-size:14px}
#coopBox button.pri{background:#365314;border-color:#4d7c0f}
#coopBox select,#coopBox input{padding:6px;background:#0c0d09;color:#eee;border:1px solid #555;font-size:15px}
#coopBox input.cin{font:700 26px monospace;letter-spacing:.2em;text-align:center;width:9em;text-transform:uppercase}
#coopHud{position:fixed;left:50%;top:6px;transform:translateX(-50%);z-index:50;background:rgba(0,0,0,.55);color:#9ca;padding:3px 10px;font:12px monospace;display:none;pointer-events:none}
#coopLeave{position:fixed;left:10px;bottom:10px;z-index:56;background:#4a1a1a;color:#fff;border:1px solid #844;padding:5px 10px;font-size:12px;cursor:pointer;display:none}
`;
  document.head.appendChild(css);
  const box = document.createElement('div');
  box.id = 'coopBox';
  box.innerHTML = '<div class="cb"></div>';
  document.body.appendChild(box);
  const cbx = box.firstChild;
  const hud = document.createElement('div');
  hud.id = 'coopHud';
  document.body.appendChild(hud);
  const leaveBtn = document.createElement('button');
  leaveBtn.id = 'coopLeave';
  leaveBtn.textContent = 'Leave co-op';
  leaveBtn.onclick = () => {
    if (C.role === 'guest') guestQuit();
  };
  document.body.appendChild(leaveBtn);
  const showBox = h => {
    cbx.innerHTML = h;
    box.style.display = 'flex';
    try {
      document.exitPointerLock();
    } catch (e) {}
  };
  const hideBox = () => (box.style.display = 'none');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const cleanName = s => String(s || 'Player').replace(/[^\w \-.]/g, '').slice(0, 16) || 'Player';

  /* ===================================================== HOST ===================================================== */
  const MAXG = 4;
  C.guests = []; // up to four slots: {id, conn, name, active, ready, started, av, sv, mirror, mirSig, bk, downSent, pref}
  const linked = () => (C.role === 'host' ? C.guests.some(g => g.conn) : !!C.conn);
  function sendG(g, m) {
    if (g && g.conn) {
      try {
        g.conn.send(m);
        C.dbg.sent = (C.dbg.sent || 0) + 1;
      } catch (e) {
        console.warn('[coop] send', e);
      }
    }
  }
  const sendAll = (m, except) => C.guests.forEach(g => g !== except && g.conn && sendG(g, m));
  const sendRun = (m, except) => C.guests.forEach(g => g !== except && g.conn && g.active && sendG(g, m));
  /* one call for both roles: the guest sends to the host, the host sends to every guest in the run (except one) */
  const out = (m, except) => (C.role === 'host' ? sendRun(m, except) : send(m));
  function refreshFlags() {
    C.active = C.role === 'host' ? C.guests.some(g => g.active) : C.active;
    if (C.role === 'host') C.run = C.began && C.active;
  }
  const gOfComp = c => C.guests.find(g => g.av && c && (g.av.c === c || g.av.m === c.m));
  const gOfMesh = m => C.guests.find(g => g.av && g.av.m === m);

  const hbtn = document.createElement('button');
  hbtn.id = 'coopBtn';
  hbtn.textContent = 'CO-OP';
  hbtn.onclick = () => hostPanel();
  document.body.appendChild(hbtn);
  setInterval(() => {
    let show = false;
    try {
      show = C.role !== 'guest' && typeof hqShown === 'function' && hqShown() && !window.DEV_ON;
    } catch (e) {}
    hbtn.style.display = show ? 'block' : 'none';
    hbtn.classList.toggle('on', C.role === 'host');
    hbtn.textContent = C.role === 'host' ? 'CO-OP ' + C.code : 'CO-OP';
  }, 400);

  function lendable() {
    return (G.surv || []).filter(s => s.hp > 0);
  }
  function hostPanel() {
    if (C.role === 'host') return renderHostPanel();
    showBox(
      '<h2>ONLINE CO-OP</h2><div class="st">Let up to four friends play your survivors on a map mission. Their games join yours with a room code; ' +
        'the zombies, loot and your save stay on your machine.</div><button class="pri" id="cpOpen">Open a room</button><button id="cpX">Close</button>'
    );
    $$('cpX').onclick = hideBox;
    $$('cpOpen').onclick = () => {
      $$('cpOpen').disabled = true;
      $$('cpOpen').textContent = 'Opening...';
      hostOpen(err => {
        if (!err) return renderHostPanel();
        showBox('<h2>CO-OP</h2><div class="st">' + esc(err) + '</div><button id="cpX">Close</button>');
        $$('cpX').onclick = hideBox;
      });
    };
  }
  let panelOn = false;
  function rowsHtml() {
    const list = lendable();
    return C.guests
      .map(g => {
        const status = !g.started ? 'waiting' : !g.active ? 'loading...' : g.av && g.sv ? 'playing ' + esc(g.sv.name) : 'spectating';
        const cur = g.pref === 'vol' ? 'vol' : g.pref === 'spec' ? 'spec' : g.pref ? String(g.pref.id) : '';
        const opt = (v, label, extra) => `<option value="${v}"${cur === String(v) ? ' selected' : ''}${extra || ''}>${label}</option>`;
        const survs = list
          .map(sv => {
            const other = C.guests.find(q => q !== g && q.sv === sv);
            return opt(sv.id, esc(sv.name) + ' (' + esc(sv.role || '') + ', ' + Math.round(sv.hp) + ' hp)' + (other ? ' - with ' + esc(other.name) : ''), other ? ' disabled' : '');
          })
          .join('');
        return `<div class="cgrow"><div><b>${esc(g.name || '...')}</b> <span class="cgst">${status}</span></div><div><select data-g="${g.id}">${opt('', 'auto')}${opt('vol', 'volunteer')}${opt('spec', 'spectator')}${survs}</select> <button data-kick="${g.id}">Kick</button></div></div>`;
      })
      .join('');
  }
  function bindRows(root) {
    root.querySelectorAll('select[data-g]').forEach(sel => {
      sel.onchange = () => {
        const g = C.guests.find(q => String(q.id) === sel.dataset.g);
        if (g) hostAssign(g, sel.value === '' ? 'auto' : sel.value);
      };
    });
    root.querySelectorAll('button[data-kick]').forEach(b => {
      b.onclick = () => {
        const g = C.guests.find(q => String(q.id) === b.dataset.kick);
        if (g) hostKick(g);
      };
    });
  }
  function renderHostPanel() {
    panelOn = true;
    showBox(
      '<h2>CO-OP ROOM</h2><div class="code">' + C.code + '</div><div class="st">Up to four friends: Main menu > Join Co-op, then this code.</div>' +
        '<div class="st">' + (C.guests.length ? 'Connected (' + C.guests.length + '/' + MAXG + '): pick the survivor each one plays' : 'Waiting for your friends...') + '</div>' + rowsHtml() +
        '<div class="st">Plan a run on the map and Drive out as usual. Friends stay connected between runs; the same menu is in Options while you play.</div>' +
        '<button id="cpClose">Close room</button><button class="pri" id="cpHide">Done</button>'
    );
    bindRows(cbx);
    $$('cpHide').onclick = () => {
      panelOn = false;
      hideBox();
    };
    $$('cpClose').onclick = () => {
      panelOn = false;
      hostClose();
      hideBox();
    };
  }

  function hostStatus() {
    if (panelOn && box.style.display === 'flex' && C.role === 'host') renderHostPanel();
  }
  function hostOpen(cb, tries = 0) {
    loadPeer((err, P) => {
      if (err) return cb(err);
      C.code = newCode();
      let p;
      try {
        p = mkPeer(P, PREFIX + C.code);
      } catch (e) {
        return cb(String(e));
      }
      let opened = false;
      p.on('open', () => {
        opened = true;
        C.peer = p;
        C.role = 'host';
        C.guests = [];
        say('Co-op room ' + C.code + ' is open');
        cb();
      });
      p.on('connection', c => {
        if (C.guests.length >= MAXG) {
          c.on('open', () => {
            c.send({t: 'deny', r: 'This room is full (' + MAXG + ' guests).'});
            setTimeout(() => c.close(), 400);
          });
          return;
        }
        let id = 1;
        while (C.guests.some(q => q.id === id)) id++;
        const g = {id, conn: c, name: '', active: false, ready: false, started: false, av: null, sv: null, mirror: null, mirSig: '', bk: null, downSent: false, rx: now(), pref: null};
        C.guests.push(g);
        bindConn(c, m => hostMsg(g, m), () => guestGone(g, 'left'), g);
      });
      p.on('error', e => {
        if (!opened) {
          if (e && e.type === 'unavailable-id' && tries < 4) return hostOpen(cb, tries + 1);
          return cb('Could not open a room (' + ((e && e.type) || e) + ')');
        }
        console.warn('[coop] peer error', e);
      });
    });
  }
  function hostClose() {
    for (const g of C.guests.slice()) {
      try {
        sendG(g, {t: 'end', why: 'The host closed the room.'});
        g.conn.close();
      } catch (e) {}
      removeAvatar(g);
    }
    try {
      C.peer && C.peer.destroy();
    } catch (e) {}
    Object.assign(C, {role: 'off', peer: null, conn: null, active: false, run: false, code: null, guests: []});
  }
  const isMission = mode => mode === 'EXPEDITION' || mode === 'SIEGE' || mode === 'CLEAR';
  const alive = sv => sv && sv.hp > 0 && (sv.tmp || (G.surv || []).includes(sv));
  function pickLent(g) {
    if (g.pref === 'spec') {
      g.sv = null;
      return null;
    }
    const used = new Set(C.guests.filter(q => q !== g && q.sv).map(q => q.sv));
    const reserved = new Set(C.guests.filter(q => q !== g && q.pref && typeof q.pref === 'object').map(q => q.pref)); // kept for someone else
    const ok = s => s && s.hp > 0 && (G.surv || []).includes(s) && !used.has(s) && !reserved.has(s);
    let s = null;
    if (g.pref && typeof g.pref === 'object' && ok(g.pref)) s = g.pref;
    else if (g.pref !== 'vol') s = lendable().find(q => ok(q) && q.role === 'Scavenger') || lendable().find(ok) || null;
    if (!s) {
      s = {id: 'v' + Date.now() + g.id, name: g.name || 'Volunteer', role: 'Generalist', hp: 100, morale: 60, hunger: 0, skill: 2, tmp: 1};
      try {
        svInv(s).inv; // an empty pack
      } catch (e) {}
    }
    g.sv = s;
    return s;
  }
  /* who a guest plays when a world starts: whoever they already are, if that still fits what the host chose */
  function assignFor(g) {
    if (g.pref === 'spec' || !g.eligible) {
      g.sv = null;
      return null;
    }
    if (!g.sv && g.leftSv && alive(g.leftSv)) g.sv = g.leftSv; // they went home early: same survivor again
    g.leftSv = null;
    const fits = g.pref === 'vol' ? g.sv && g.sv.tmp : g.pref && typeof g.pref === 'object' ? g.sv === g.pref : true;
    if (alive(g.sv) && fits) return g.sv;
    return pickLent(g);
  }

  function hostMsg(g, m) {
    switch (m.t) {
      case 'hi': {
        if (m.v !== C.ver || m.gv !== String(typeof VERSION !== 'undefined' ? VERSION : '')) {
          sendG(g, {t: 'deny', r: 'Version mismatch. Host runs v' + (typeof VERSION !== 'undefined' ? VERSION : '?') + ', co-op protocol ' + C.ver + '. Everyone needs the same game build.'});
          const rejected = g.conn;
          setTimeout(() => rejected && rejected.close(), 400);
          g.conn = null;
          C.guests = C.guests.filter(q => q !== g);
          return;
        }
        g.name = cleanName(m.n);
        g.eligible = !(C.mis && isMission(C.mis.mode)); // joining a run in progress: you watch until the host gives you a survivor
        sendG(g, {t: 'welcome', host: cleanName(C.name), mission: !!C.mis, you: g.id});
        say(g.name + ' joined the co-op room');
        hostStatus();
        if (C.mis) hostSendStart(g);
        break;
      }
      case 'ready':
        hostGuestReady(g, m);
        break;
      case 'p':
        if (g.av) {
          const a = g.av;
          a.tx = +m.x || 0;
          a.ty = +m.y || 0;
          a.tz = +m.z || 0;
          a.yaw = +m.yaw || 0;
          a.pitch = +m.pt || 0;
          a.crouch = !!m.c;
          a.w = m.w || null;
          a.rx = now();
        }
        break;
      case 'hit':
        hostHit(g, m);
        break;
      case 'shot':
        hostShot(g, m);
        break;
      case 'door':
        applyDoor(m);
        sendRun(m, g);
        break;
      case 'lockreq':
        hostLockReq(g, m);
        break;
      case 'unlock':
        hostUnlock(g, m);
        break;
      case 'rec':
        hostRecruit(g, m);
        break;
      case 'dmg':
        if (g.av && g.sv && g.sv.hp > 0) hurtLent(g, clamp(+m.d || 0, 0, 60));
        break;
      case 'heal':
        if (g.sv && g.sv.hp > 0) g.sv.hp = Math.min(g.sv.maxHp || 100, g.sv.hp + clamp(+m.d || 0, 0, 100));
        break;
      case 'bk': {
        // the guest's pack changed: the host's view of it (the survivor's inventory) follows, unless the host has an unsent edit
        if (!g.sv || !g.mirror || !m.inv) break;
        g.bk = m.inv;
        if (g.mirSig === packSig(g.mirror.inv)) {
          const made = invLoadInto(g.mirror.inv, m.inv);
          g.sv.eq = m.inv.eq >= 0 && made[m.inv.eq] ? made[m.inv.eq] : null;
          g.mirSig = packSig(g.mirror.inv);
          if (currentContainer === g.mirror)
            try {
              renderInv();
            } catch (e) {}
        }
        break;
      }
      case 'chit': {
        const z = C.zmap && C.zmap[m.id];
        if (z && z.parent && !zombies.includes(z) && typeof corpseHit === 'function') corpseHit(z, typeof m.p === 'string' ? m.p : 'torso', clamp(+m.d || 10, 0, 200), avPos(g));
        break;
      }
      case 'tr':
        applyTracer(m);
        sendRun(m, g);
        break;
      case 'leave':
        if (m.inv) g.bk = m.inv;
        say(g.name + ' headed home with the loot');
        mergeBack(g);
        removeAvatar(g);
        g.leftSv = g.sv; // they are home: the same survivor plays again the next time the host starts a world
        g.sv = null;
        g.mirror = null;
        g.spec = true;
        refreshFlags();
        hostStatus();
        break;
      case 'pg':
        break;
    }
  }
  function guestGone(g, why) {
    if (!C.guests.includes(g)) return;
    say((g.name || 'A friend') + ' left the co-op session');
    mergeBack(g);
    removeAvatar(g);
    hostReleaseLocks(g.id);
    g.conn = null;
    g.active = false;
    g.mirror = null;
    C.guests = C.guests.filter(q => q !== g);
    refreshFlags();
    hostStatus();
  }
  /* the guest's backpack goes back into the lent survivor (what fits; a volunteer's loot goes to the fort stores) */
  function mergeBack(g) {
    const sv = g.sv;
    if (!sv || !g.bk) return;
    try {
      const inv = svInv(sv).inv,
        made = invLoadInto(inv, g.bk);
      sv.eq = g.bk.eq >= 0 && made[g.bk.eq] ? made[g.bk.eq] : null;
      if (sv.tmp) for (const q of inv.items.slice()) invTransfer(inv, HQINV, q);
      log('guest pack merged into', sv.name, inv.items.length, 'items left on them');
    } catch (e) {
      console.error('[coop] merge', e);
    }
    g.bk = null;
  }
  const barsList = () => (G.bars || []).map(b => ({x: b.x, z: b.z, hp: Math.round(b.hp), ry: b.ry || 0}));
  function hostSendStart(g) {
    if (!g.conn || !C.mis) return;
    const sv = assignFor(g);
    g.ready = false;
    g.started = true;
    g.spec = !sv;
    const m = {
      t: 'start',
      seed: C.mis.seed,
      mode: C.mis.mode,
      fort: G.fort,
      day: G.day,
      time: G.time,
      mission: C.mis.mission,
      bars: barsList(),
      spec: !sv,
      host: cleanName(C.name)
    };
    if (sv) {
      m.sv = plain(sv);
      m.inv = invDump(svInv(sv).inv, sv.eq);
    }
    sendG(g, m);
    hostStatus();
  }


  /* --- world start hooks on the host: every world (mission, fort, siege) is built from a seed so guests can build the same one --- */
  function hostArm(mode) {
    // whoever is in the old world takes their pack with them
    C.guests.forEach(g => {
      if (g.av) mergeBack(g);
      g.av = null;
      g.mirror = null;
    });
    C.seed = (Math.random() * 4294967296) >>> 0;
    const ms = G.mission;
    mode = mode || 'EXPEDITION';
    C.mis = {seed: C.seed, mode, mission: mode === 'EXPEDITION' && ms ? {t: ms.t, id: ms.id, h: ms.h} : null, sig: null};
    C.began = false;
    C.run = false;
    C.locks = {};
    C.guests.forEach(g => {
      g.ready = false;
      g.started = false;
      g.active = false;
    });
    C.guests.forEach(g => g.conn && hostSendStart(g));
    refreshFlags();
  }
  if (window.MFZLOAD && typeof MFZLOAD.mission === 'function') {
    const _m = MFZLOAD.mission;
    MFZLOAD.mission = function (mode, after) {
      if (C.role === 'host') hostArm(G.siegeDue && mode !== 'CLEAR' ? 'SIEGE' : mode || 'EXPEDITION');
      return _m.call(this, mode, after);
    };
  }
  /* test hook: what the loader wrapper does, then a plain go() (the staged loader's shader warm-up is heavy for headless runs) */
  C.testLaunch = function (mode) {
    hostArm(mode || 'EXPEDITION');
    go(mode || 'EXPEDITION');
  };
  const _go = go;
  go = function (m) {
    // a world built without the loader (back to the fort, a siege...) is armed here
    if (C.role === 'host' && C.seed == null && !(window.WB && WB.prebuilt)) hostArm(G.siegeDue && m !== 'CLEAR' ? 'SIEGE' : m);
    C.inGo = (C.inGo || 0) + 1;
    let r;
    try {
      r = _go.apply(this, arguments);
    } finally {
      C.inGo--;
    }
    try {
      if (C.seed != null) {
        if (C.role === 'host') hostBuilt();
        else if (C.role === 'guest') guestBuilt();
      }
    } catch (e) {
      console.error('[coop] go hook', e);
    }
    return r;
  };
  /* v089: the siege usually starts straight from the fort (the clock reaching day 14, or ending the day at the HQ), which calls
     startSiege() without going through go(). The guests were never told, so they stayed in the fort world with fort rules (look and
     run only, no attacking or doors). The host now arms and announces that world like any other; a guest never starts one itself. */
  if (typeof startSiege === 'function') {
    const _ss = startSiege;
    startSiege = function () {
      if (C.role === 'guest' && C.active && !C.loading) return; // the host's 'start' message brings the siege
      if (C.role !== 'host' || C.inGo) return _ss.apply(this, arguments);
      if (C.seed == null && !(window.WB && WB.prebuilt)) hostArm('SIEGE');
      const r = _ss.apply(this, arguments);
      try {
        if (C.seed != null) hostBuilt();
      } catch (e) {
        console.error('[coop] siege hook', e);
      }
      return r;
    };
  }
  /* the loading screen asks here before it shows "Press any key": every connected guest has to be loaded first (Esc starts without them) */
  C.gate = function (o) {
    return new Promise(res => {
      const waitingOn = () => C.guests.filter(g => g.conn && g.started && !g.ready);
      if (C.role === 'off' || (C.role === 'host' && !waitingOn().length) || (C.role === 'guest' && !C.conn)) return res();
      const h2 = o.el.querySelector('h2'),
        t0 = h2 ? h2.textContent : '';
      const msg = () => (C.role === 'host' ? 'Waiting on ' + waitingOn().map(g => g.name).join(', ') + '...' : 'Waiting on Host...');
      const hint = C.role === 'host' ? 'Esc: start without them' : 'Esc: leave';
      const fin = () => {
        clearInterval(iv);
        removeEventListener('keydown', esc2, true);
        if (h2) h2.textContent = t0;
        res();
      };
      const esc2 = e => {
        if (e.code !== 'Escape') return;
        if (C.role === 'guest') return leavePage();
        fin();
      };
      addEventListener('keydown', esc2, true);
      const paint = () => h2 && (h2.innerHTML = msg() + '<br><small style="font:12px system-ui;opacity:.7">' + hint + '</small>');
      paint();
      const iv = setInterval(() => {
        if (C.role === 'host') {
          if (!waitingOn().length) return fin();
          paint();
        } else if (!C.conn || C.role === 'off' || C.began) fin();
      }, 200);
    });
  };
  /* the host's key press on the loading screen: the co-op run goes live for everyone who is loaded */
  C.begin = function () {
    if (C.role !== 'host' || !C.mis) return;
    C.began = true;
    refreshFlags();
    sendRun({t: 'begin'});
  };
  // a world that was entered without the loader's key press (a siege, the fort): the first time the host takes control it starts
  setInterval(() => {
    if (C.role === 'host' && C.mis && C.mis.sig && !C.began && typeof locked !== 'undefined' && locked) C.begin();
  }, 400);
  function removeFortMesh(sv) {
    for (const m of smesh.slice())
      if (m.userData && m.userData.kind === 'surv' && m.userData.s === sv) {
        scene.remove(m);
        smesh = smesh.filter(q => q !== m);
      }
  }
  function hostBuilt() {
    C.seed = null;
    tagIds();
    C.mis.sig = sig();
    C.dbg.hostSig = C.mis.sig;
    log('host world built', C.mis.mode, C.mis.sig);
    sendAll({t: 'sig', sig: C.mis.sig});
    // a lent survivor is played by their guest, so they do not also stand in the fort as an AI survivor
    C.guests.forEach(g => g.sv && removeFortMesh(g.sv));
    // missions wait for the host's key press; the fort world just goes
    if (!isMission(C.mis.mode)) {
      C.began = true;
      refreshFlags();
    }
  }

  if (typeof finish === 'function') {
    const _f = finish;
    finish = function () {
      if (C.role === 'guest') return;
      return _f.apply(this, arguments);
    };
  }

  /* --- a guest's avatar in the running world --- */
  function spawnAvatar(g) {
    const sv = g.sv;
    if (!sv) return null;
    // the survivor may already be walking around as the host's follower or standing in the fort: the guest takes them over
    for (let i = comps.length - 1; i >= 0; i--)
      if (comps[i].s === sv) {
        try {
          scene.remove(comps[i].m);
          smesh = smesh.filter(q => q !== comps[i].m);
        } catch (e) {}
        comps.splice(i, 1);
      }
    removeFortMesh(sv);
    removeAvatar(g);
    const sp =
      G.mode === 'EXPEDITION'
        ? freeSpot(TRUCK.x + rnd(-2.5, 2.5), TRUCK.z + 6.5 + g.id * 0.8)
        : freeSpot(pl.position.x + rnd(-3, 3), pl.position.z + rnd(2, 5));
    C.spawning = true;
    try {
      const n0 = comps.length;
      spawnComp(sv, sp[0], sp[1]);
      const c = comps[comps.length - 1];
      if (comps.length > n0 && c) {
        comps.splice(comps.indexOf(c), 1);
        c.m.userData.coop = 1;
        g.av = {m: c.m, c, sv, tx: sp[0], ty: 0, tz: sp[1], yaw: 0, pitch: 0, rx: now()};
      }
    } finally {
      C.spawning = false;
    }
    g.mirror = svInv(sv);
    g.mirSig = packSig(g.mirror.inv);
    g.downSent = false;
    return sp;
  }
  function hostGuestReady(g, m) {
    if (!C.mis || !C.zmap) return;
    if (m.sig && C.mis.sig && m.sig !== C.mis.sig) say('Co-op: the two worlds do not match exactly (' + g.name + ' may see small differences)');
    C.dbg.guestSig = m.sig;
    g.ready = true;
    g.active = true;
    if (g.sv) spawnAvatar(g);
    g.spec = !g.sv;
    // roster: every zombie, so the guest can build them as they come into view
    sendG(g, {
      t: 'zr',
      z: zombies.map(z => {
        const u = z.userData;
        return [u.cid, u.big ? 'brute' : u.run ? 'runner' : 'walker', u.fzs || '', r2(z.position.x), r2(z.position.z), u.sleep ? 1 : 0];
      })
    });
    sendG(g, {t: 'np', n: npcList.map(n => n.userData.cid)});
    sendG(g, {t: 'doors', d: doors.filter(d => d.open).map(d => d.cid)});
    say(g.name + (g.sv ? ' is in the world' : ' is watching'));
    refreshFlags();
    if (C.began) {
      C.run = true; // joined a world that is already going: straight in
      sendG(g, {t: 'begin'});
    }
    hostStatus();
  }
  /* the host moves a guest to another survivor, a volunteer, or to spectating, even in the middle of a run */
  function hostAssign(g, choice) {
    g.pref = choice === 'auto' ? null : choice === 'vol' ? 'vol' : choice === 'spec' ? 'spec' : (G.surv || []).find(s => String(s.id) === String(choice)) || null;
    if (g.pref !== 'spec') g.eligible = true;
    if (!g.active || !g.ready) {
      hostStatus();
      return;
    }
    if (g.av) mergeBack(g);
    removeAvatar(g);
    g.sv = null;
    g.mirror = null;
    const sv = g.pref === 'spec' ? null : pickLent(g);
    if (sv) {
      const svp = plain(sv), // copied before the avatar exists (afterwards the record links back to it)
        invd = invDump(svInv(sv).inv, sv.eq);
      const sp = spawnAvatar(g);
      sendG(g, {t: 'assign', sv: svp, inv: invd, x: sp ? sp[0] : 0, z: sp ? sp[1] : 0});
    } else sendG(g, {t: 'assign', spec: true});
    g.spec = !sv;
    refreshFlags();
    hostStatus();
  }
  function hostKick(g) {
    const c = g.conn;
    sendG(g, {t: 'end', why: 'The host removed you from the game.'});
    guestGone(g, 'kicked');
    setTimeout(() => {
      try {
        c && c.close();
      } catch (e) {}
    }, 500);
  }
  function removeAvatar(g) {
    const a = g.av;
    if (!a) return;
    g.av = null;
    try {
      if (a.m.parent) scene.remove(a.m);
      smesh = smesh.filter(q => q !== a.m);
    } catch (e) {}
  }
  function hurtLent(g, d) {
    const sv = g.sv;
    sv.hp = Math.max(0, sv.hp - d);
    if (sv.hp <= 0 && g.av) {
      const m = g.av.m;
      try {
        if (window.survDown) survDown(m, m.position);
        else scene.remove(m);
        smesh = smesh.filter(q => q !== m);
      } catch (e) {}
    }
  }
  const spawnComp0 = spawnComp;
  spawnComp = function (sv) {
    // a lent survivor is played by a guest, so the game must not also spawn them as an AI follower
    if (C.role === 'host' && C.mis && !C.spawning && C.guests.some(g => g.sv === sv && g.conn)) return;
    return spawnComp0.apply(this, arguments);
  };

  /* --- host: hits, shots, recruits --- */
  let hitBudget = 0,
    hitT = 0;
  function avPos(g) {
    const a = g && g.av;
    return a ? {x: a.m.position.x, y: a.m.position.y, z: a.m.position.z} : {x: pl.position.x, y: 0, z: pl.position.z};
  }
  function hostHit(g, m) {
    if (!g.av) return;
    const t = now();
    if (t - hitT > 1000) {
      hitT = t;
      hitBudget = 0;
    }
    if (++hitBudget > 80 * MAXG) return;
    const z = C.zmap && C.zmap[m.id];
    if (!z) return;
    const d = clamp(+m.d || 0, 0, 400),
      fr = avPos(g);
    if (!zombies.includes(z)) {
      // a corpse: limbs come off, the torso gibs
      if (z.parent && typeof corpseHit === 'function') corpseHit(z, typeof m.p === 'string' ? m.p : 'torso', d, fr);
      return;
    }
    if (m.k === 'h') hitZ(z, d, typeof m.p === 'string' ? m.p : 'torso', !!m.m, fr);
    else dmgZ(z, d, fr);
    if (zombies.includes(z)) {
      z.userData.lx = fr.x;
      z.userData.lz = fr.z;
    }
  }
  function hostShot(g, m) {
    if (!g.av) return;
    const w = WDEF[m.w];
    if (!w || w.type !== 'gun') return;
    const p = new THREE.Vector3(+m.x || 0, +m.y || 0, +m.z || 0);
    try {
      S.shot(w.snd, p);
    } catch (e) {}
    const bang = typeof fzBang === 'function' ? fzBang(w) : 40;
    zombies.forEach(z => {
      if (z.position.distanceTo(p) < bang) {
        if (z.userData.sleep) wakeZ(z);
        z.userData.hunt = 4;
        z.userData.lx = p.x;
        z.userData.lz = p.z;
        z.userData.see = true;
      }
    });
    const dx = +m.dx || 0,
      dy = +m.dy || 0,
      dz = +m.dz || 0;
    if (g.av) {
      try {
        aimPose(g.av.m, p.x + dx * 12, p.y + dy * 12, p.z + dz * 12);
        g.av.m.userData.aimT = 0.8;
      } catch (e) {}
    }
    sendRun({t: 'ev', k: 'shot', who: 'g' + g.id, w: m.w, x: p.x, y: p.y, z: p.z, dx, dy, dz}, g);
  }
  function hostRecruit(g, m) {
    const o = npcList.find(n => n.userData.cid === m.i),
      a = g.av;
    if (!o || !a || Math.hypot(o.position.x - a.m.position.x, o.position.z - a.m.position.z) > 7) return;
    scene.remove(o);
    npcList = npcList.filter(q => q !== o);
    try {
      S.voice(o.position, 210);
    } catch (e) {}
    const sv = (typeof fzSurvivor === 'function' && fzSurvivor()) || {
      id: Date.now() + ri(0, 999),
      name: NAMES[ri(0, 9)] + ' #' + ++G.rescued,
      role: 'Generalist',
      hp: 100,
      morale: 60,
      hunger: 0,
      skill: ri(1, 4),
      pending: 1
    };
    spawnComp(sv, o.position.x, o.position.z);
    say(sv.name + ' will follow you. Get them to the truck to bring them home.');
  }

  /* --- host: the 10 Hz snapshot --- */
  setInterval(() => {
    if (C.role !== 'host' || !C.run || !C.zmap) return;
    try {
      hostSnapshot();
    } catch (e) {
      console.error('[coop] snapshot', e);
    }
  }, 100);
  let snapN = 0;
  function hostSnapshot() {
    const act = C.guests.filter(g => g.active && g.conn),
      R2 = 95 * 95,
      px = pl.position.x,
      pz = pl.position.z;
    const focus = [[px, pz]];
    act.forEach(g => g.av && focus.push([g.av.m.position.x, g.av.m.position.z]));
    const zn = [],
      zs = [];
    for (const z of zombies) {
      const u = z.userData;
      if (u.cid == null) {
        u.cid = C.nextCid++;
        C.zmap[u.cid] = z;
        zn.push([u.cid, u.big ? 'brute' : u.run ? 'runner' : 'walker', u.fzs || '', r2(z.position.x), r2(z.position.z), u.sleep ? 1 : 0]);
      }
      const p = z.position;
      if (!focus.some(f => (p.x - f[0]) * (p.x - f[0]) + (p.z - f[1]) * (p.z - f[1]) <= R2)) continue;
      zs.push([u.cid, r2(p.x), r2(p.y), r2(p.z), r2(z.rotation.y), (u.see || u.hunt > 0 ? 1 : 0) | (u.atk ? 2 : 0) | (u.sleep ? 4 : 0) | (u.crawl ? 8 : 0) | limbMask(u)]);
    }
    if (zn.length) sendRun({t: 'zn', z: zn});
    const eqId = G.eq ? G.eq.id : null,
      fy = pl.position.y - (G.eyeUsed || 1.6);
    // the host's own survivors, wherever they are: followers on a mission, defenders and residents in the fort
    const cs = smesh
      .filter(mm => mm.userData && mm.userData.s && !mm.userData.coop && !mm.userData.coopRemote && mm.parent)
      .map(mm => {
        const s = mm.userData.s;
        return [s.id, r2(mm.position.x), r2(mm.position.y), r2(mm.position.z), r2(mm.rotation.y), Math.round(s.hp), s.name, s.role || '', s.eq ? s.eq.id : null];
      });
    const others = act.filter(g => g.av).map(g => [g.id, g.name, r2(g.av.m.position.x), r2(g.av.m.position.y), r2(g.av.m.position.z), r2(g.av.yaw), g.av.w || null, g.av.crouch ? 1 : 0, g.sv ? g.sv.role || '' : '']);
    snapN++;
    const base = {
      t: 's',
      n: snapN,
      tm: r2(G.time),
      wx: window.RGATM ? RGATM.name : undefined, // v089: the host's weather preset, so every guest sees the same sky
      z: zs,
      c: cs,
      h: [r2(px), r2(fy), r2(pz), r2(yaw), r2(pitch), eqId, G.crouch ? 1 : 0],
      np: snapN % 10 === 0 ? npcList.map(n => n.userData.cid) : undefined
    };
    for (const g of act) {
      const sv = g.sv;
      sendG(g, Object.assign({}, base, {me: sv ? [Math.round(sv.hp * 10) / 10, sv.maxHp || 100] : null, pl: others.filter(o => o[0] !== g.id)}));
      if (sv && sv.hp <= 0 && !g.downSent) {
        g.downSent = true;
        sendG(g, {t: 'down'});
        setTimeout(() => {
          mergeBack(g);
          g.sv = null; // their survivor is dead: they watch until the host gives them another
          g.mirror = null;
          g.spec = true;
          hostStatus();
        }, 500);
      }
    }
  }
  setInterval(() => {
    if (C.role === 'host' && C.run) hostPacks();
  }, 300);
  /* barricades at the fort (and during a siege): hit points and what has been built or destroyed */
  let barsSig = '';
  setInterval(() => {
    if (C.role !== 'host' || !C.run || !C.mis || C.mis.mode === 'EXPEDITION') return;
    const b = barsList(),
      sg = b.map(q => q.x + ',' + q.z + ',' + q.hp).join(';');
    if (sg === barsSig) return;
    barsSig = sg;
    sendRun({t: 'bars', b});
  }, 1000);
  setInterval(() => {
    if (C.role !== 'host' || !C.run) return;
    const d = [];
    for (const c of dead) if (c.parent && !c.userData.gibbed && c.userData.cid != null) d.push(c.userData.cid);
    sendRun({t: 'dl', d});
  }, 3000);
  /* the host can open any guest's pack (E on them): what the host changes there goes to that guest within 0.3 s */
  function hostPacks() {
    for (const g of C.guests) {
      if (!g.active || !g.mirror || !g.sv) continue;
      const ms = packSig(g.mirror.inv);
      if (ms !== g.mirSig) {
        g.mirSig = ms;
        sendG(g, {t: 'invset', inv: invDump(g.mirror.inv, g.sv.eq)});
      }
    }
  }
  /* guests' avatars glide to the last pose they were sent, every frame */
  function avStep(dt) {
    for (const g of C.guests) {
      const a = g.av;
      if (!a || !a.m.parent) continue;
      const m = a.m,
        p = m.position,
        k = 1 - Math.exp(-14 * dt);
      const dx = a.tx - p.x,
        dz = a.tz - p.z;
      if (Math.hypot(dx, dz) > 8) {
        p.x = a.tx;
        p.z = a.tz;
      } else {
        p.x += dx * k;
        p.z += dz * k;
      }
      p.y += (a.ty - p.y) * k;
      const want = a.yaw + PI;
      let d = want - m.rotation.y;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      m.rotation.y += d * Math.min(1, dt * 14);
      if (a.w !== a.shownW) {
        a.shownW = a.w;
        try {
          m.userData.hidInit = false;
          npcVisual(m, {eq: a.w ? {id: a.w} : null});
        } catch (e) {}
      }
      gait(m, dt, a.crouch);
    }
  }
  /* walking and a basic crouch for remote people (legs and arms from how fast they move; sneaking lowers the hips and leans forward) */
  /* things hung on the model's root (skirts, coats) stay at hip height unless they are moved with the hips */
  function gaitKids(m) {
    const u = m.userData,
      P = u.P;
    if (!u._kids) {
      u._kids = m.children.filter(o => o !== P.body && o !== P.legL && o !== P.legR && !o.isSprite && !o.isLight && !(o.userData && o.userData.zaim));
      u._kids.forEach(o => (o.userData._cy0 = o.position.y));
    }
    return u._kids;
  }
  /* walking and a basic crouch for remote people: legs and arms from how fast they move, sneaking lowers the hips, leans the body forward,
     bends the legs and takes the skirts and coats down with it */
  function gait(m, dt, crouch) {
    const u = m.userData,
      P = u.P;
    if (!P || !P.legL) return;
    const p = m.position,
      d = u._cp ? Math.hypot(p.x - u._cp.x, p.z - u._cp.z) : 0;
    u._cp = {x: p.x, z: p.z};
    const spd = Math.min(7, d / Math.max(dt, 1e-3)),
      k = 1 - Math.exp(-8 * dt);
    u._cs = (u._cs || 0) + ((spd > 0.2 ? Math.min(1, spd / (crouch ? 1.6 : 2.6)) : 0) - (u._cs || 0)) * k;
    u._cr = (u._cr || 0) + ((crouch ? 1 : 0) - (u._cr || 0)) * (1 - Math.exp(-10 * dt));
    u._cph = (u._cph || 0) + d * (crouch ? 6.5 : 4.6);
    u._gs = Math.sin(u._cph) * u._cs;
    gaitPose(m);
    if (u.aimT > 0) u.aimT -= dt;
  }
  /* writes the pose from the stored state; run again after the game's own survivor walk animation, which would otherwise overwrite it */
  function gaitPose(m) {
    const u = m.userData,
      P = u.P;
    if (!P || !P.legL) return;
    if (u._hip0 === undefined) {
      u._hip0 = P.legL.position.y;
      u._body0 = P.body ? P.body.position.y : 0;
    }
    const cr = u._cr || 0,
      s = u._gs || 0,
      drop = 0.26 * cr;
    P.legL.position.y = P.legR.position.y = u._hip0 - drop;
    if (P.body) {
      P.body.position.y = u._body0 - drop;
      P.body.rotation.x = 0.32 * cr;
    }
    P.legL.rotation.x = s * (0.7 - 0.3 * cr) - 0.85 * cr;
    P.legR.rotation.x = -s * (0.7 - 0.3 * cr) - 0.85 * cr;
    if (!(u.aimT > 0) && u.wk !== 'gun') {
      P.armL.rotation.x = -s * 0.5 - 0.25 * cr;
      P.armR.rotation.x = s * 0.5 - 0.25 * cr;
    }
    if (P.head) P.head.rotation.x = -0.3 * cr;
    for (const o of gaitKids(m)) o.position.y = (o.userData._cy0 || 0) - drop;
  }


  /* --- container locks: one person at a time, so nothing can be duplicated or lost --- */
  C.locks = {};
  function hostReleaseLocks(by) {
    for (const k in C.locks) if (C.locks[k].by === by) delete C.locks[k];
  }
  function lockHolderName(l) {
    if (l.by === 'host') return 'The host';
    const g = C.guests.find(q => q.id === l.by);
    return g ? g.name : 'Someone';
  }
  function hostLockReq(g, m) {
    const c = C.cmap && C.cmap[m.i];
    if (!c) return sendG(g, {t: 'lockno', i: m.i, by: '', gone: 1});
    const l = C.locks[m.i];
    if (l && l.by !== g.id && now() - l.t < 180000) return sendG(g, {t: 'lockno', i: m.i, by: lockHolderName(l)});
    C.locks[m.i] = {by: g.id, t: now()};
    sendG(g, {t: 'lockok', i: m.i, inv: invDump(c.inv), op: c.opened ? 1 : 0});
  }
  function hostUnlock(g, m) {
    const c = C.cmap && C.cmap[m.i],
      l = C.locks[m.i];
    if (!c || !l || l.by !== g.id) return;
    if (m.inv) {
      invLoadInto(c.inv, m.inv);
      c.opened = true;
      try {
        refreshContainerVisual(c);
      } catch (e) {}
    }
    delete C.locks[m.i];
    sendRun({t: 'cont', i: m.i, inv: invDump(c.inv), op: 1}, g);
  }
  /* the host's own opening and closing of a loot container */
  setInterval(() => {
    if (C.role !== 'host') return;
    const h = C.hostHolds;
    if (h && currentContainer !== h) {
      C.hostHolds = null;
      delete C.locks[h.cid];
      h.opened = true;
      sendRun({t: 'cont', i: h.cid, inv: invDump(h.inv), op: 1});
    }
    for (const k in C.locks) if (C.locks[k].by !== 'host' && now() - C.locks[k].t > 180000) delete C.locks[k];
  }, 200);


  /* ===================================================== GUEST ===================================================== */
  function joinMenu(pre) {
    showBox(
      '<h2>JOIN CO-OP</h2><div class="st">Type the 5-letter room code your friend gives you.</div>' +
        '<input class="cin" id="cpCode" maxlength="5" value="' + esc(pre || '') + '" autocomplete="off" spellcheck="false"><div class="st">Your name: <input id="cpName" maxlength="16" value="' +
        esc(localStorage.getItem('mfz_coop_name') || 'Player') + '" style="width:9em"></div><div class="st" id="cpSt"></div>' +
        '<button class="pri" id="cpGo">Join</button><button id="cpX">Cancel</button>'
    );
    $$('cpX').onclick = () => {
      guestReset();
      hideBox();
    };
    $$('cpGo').onclick = () => {
      const code = $$('cpCode').value.trim().toUpperCase();
      if (code.length !== 5) return ($$('cpSt').textContent = 'The code is 5 letters/digits.');
      C.name = cleanName($$('cpName').value);
      try {
        localStorage.setItem('mfz_coop_name', C.name);
      } catch (e) {}
      $$('cpGo').disabled = true;
      $$('cpSt').textContent = 'Connecting...';
      guestJoin(code, err => {
        if (err) {
          $$('cpGo') && ($$('cpGo').disabled = false);
          $$('cpSt') && ($$('cpSt').textContent = err);
        }
      });
    };
    setTimeout(() => $$('cpCode') && $$('cpCode').focus(), 50);
  }
  C.joinMenu = joinMenu;
  function guestReset() {
    try {
      C.conn && C.conn.close();
    } catch (e) {}
    try {
      C.peer && C.peer.destroy();
    } catch (e) {}
    Object.assign(C, {role: 'off', peer: null, conn: null, active: false});
  }
  function guestJoin(code, cb) {
    loadPeer((err, P) => {
      if (err) return cb(err);
      let p;
      try {
        p = mkPeer(P, PREFIX + 'g' + newCode() + newCode());
      } catch (e) {
        return cb(String(e));
      }
      let done = false;
      const fail = e => {
        if (done) return;
        done = true;
        try {
          p.destroy();
        } catch (x) {}
        C.role = 'off';
        cb(e);
      };
      const timer = setTimeout(() => fail('No answer from room ' + code + '. Check the code, and that the host has the room open.'), 15000);
      p.on('error', e => fail(e && e.type === 'peer-unavailable' ? 'Room ' + code + ' was not found.' : 'Connection problem (' + ((e && e.type) || e) + ')'));
      p.on('open', () => {
        C.peer = p;
        C.role = 'guest';
        C.code = code;
        const c = p.connect(PREFIX + code, useLocal() ? undefined : {reliable: true, serialization: 'json'});
        c.on('open', () => {
          clearTimeout(timer);
          done = true;
          bindConn(c, guestMsg, () => hostGone('The host left.'));
          send({t: 'hi', v: C.ver, gv: String(typeof VERSION !== 'undefined' ? VERSION : ''), n: C.name});
        });
        c.on('error', () => fail('Could not connect to room ' + code + '.'));
      });
    });
  }
  function guestMsg(m) {
    switch (m.t) {
      case 'deny':
        say(m.r);
        showBox('<h2>CO-OP</h2><div class="st">' + esc(m.r) + '</div><button id="cpX">OK</button>');
        $$('cpX').onclick = () => {
          guestReset();
          hideBox();
        };
        break;
      case 'welcome':
        C.hostName = m.host;
        C.myId = m.you;
        showBox('<h2>CONNECTED</h2><div class="st">Joined ' + esc(m.host) + '\'s room.<br>Waiting for the host to drive out on a mission...</div><button id="cpX">Leave</button>');
        $$('cpX').onclick = () => {
          guestReset();
          hideBox();
        };
        break;
      case 'start':
        if (C.hold) C.pendingStart = m; // test hook: build later
        else guestStart(m);
        break;
      case 'sig':
        C.hostSig = m.sig;
        guestCheckSig();
        break;
      case 'zr':
        guestRoster(m);
        break;
      case 'zn':
        m.z.forEach(r => guestAdopt(r));
        break;
      case 's':
        guestSnap(m);
        break;
      case 'np':
        guestNpcs(m.n);
        break;
      case 'doors':
        guestDoors(m);
        break;
      case 'ev':
        guestEvent(m);
        break;
      case 'door':
        applyDoor(m);
        break;
      case 'cont':
        applyCont(m);
        break;
      case 'down':
        guestDown();
        break;
      case 'assign':
        guestAssign(m);
        break;
      case 'bars':
        guestBars(m.b);
        break;
      case 'begin':
        C.began = true;
        C.run = true;
        break;
      case 'lockok':
        guestLockOk(m);
        break;
      case 'lockno':
        guestLockNo(m);
        break;
      case 'invset': {
        // the host edited my pack through the survivor screen
        if (!m.inv) break;
        if (C.pkSig && C.pkSig !== myPackSig()) {
          send({t: 'bk', inv: invDump(PINV, G.eq), hp: G.hp}); // I have an unsent change: mine wins, the host sees it
          break;
        }
        const made = invLoadInto(PINV, m.inv);
        G.eq = m.inv.eq >= 0 && made[m.inv.eq] ? made[m.inv.eq] : null;
        C.pkSig = myPackSig();
        if (invOpen)
          try {
            renderInv();
          } catch (e) {}
        say('Your pack was changed by ' + (C.hostName || 'the host'));
        break;
      }
      case 'dl':
        guestCorpses(m.d || []);
        break;
      case 'tr':
        applyTracer(m);
        break;
      case 'end':
        guestEnded(m);
        break;
      case 'pg':
        break;
    }
  }
  function hostGone(why) {
    if (C.role !== 'guest' || C.ending) return;
    guestEnded({why});
  }
  const urlCode = (location.search.match(/[?&]coop=([A-Za-z0-9]{5})/) || [])[1];

  /* the survivor a guest plays (or none: they spectate) */
  function applySurvivor(m) {
    if (m.spec || !m.sv) {
      C.spec = true;
      try {
        invLoadInto(PINV, {items: []});
      } catch (e) {}
      G.eq = null;
      C.svName = '';
      C.pkSig = myPackSig();
      return;
    }
    C.spec = false;
    resetCam(); // v089: back to first person on the rig
    const sv = m.sv;
    G.maxHp = sv.maxHp || 100;
    G.hp = clamp(sv.hp != null ? sv.hp : G.maxHp, 1, G.maxHp);
    G.sk = sv.sk || null;
    try {
      skOf(G);
    } catch (e) {}
    const made = invLoadInto(PINV, m.inv || {items: []});
    G.eq = m.inv && m.inv.eq >= 0 && made[m.inv.eq] ? made[m.inv.eq] : null;
    C.svName = sv.name || 'Survivor';
    C.pkSig = myPackSig();
  }
  function guestStart(m) {
    if (C.loading) return; // a world is already being built
    hideBox();
    C.loading = true;
    C.mis = {seed: m.seed >>> 0, mode: m.mode || 'EXPEDITION'};
    C.hostName = m.host || C.hostName || 'Host';
    Object.assign(C, {hostSig: null, sigDone: false, began: false, run: false, built: false, killed: {}, roster: {}, dead: false, remote: {}, zmap: null, myLock: null, wxSet: false});
    try {
      // a throwaway campaign shell: the guest never touches a save
      G.fort = FORTS[m.fort] ? m.fort : 'police';
      if (!C.shell) {
        initCampaign(G.fort);
        C.shell = true;
      }
      G.surv = [];
      comps.length = 0;
      G.day = m.day || 1;
      G.time = m.time != null ? m.time : 8;
      G.name = C.name;
      G.mission = m.mission ? {t: m.mission.t, id: m.mission.id, h: m.mission.h} : null;
      G.siegeDue = C.mis.mode === 'SIEGE';
      G.bars = (m.bars || []).map(b => ({x: b.x, z: b.z, hp: b.hp, ry: b.ry || 0}));
      G.spikes = [];
      applySurvivor(m);
    } catch (e) {
      console.error('[coop] guestStart shell', e);
    }
    C.seed = C.mis.seed;
    const mode = C.mis.mode === 'SIEGE' ? 'FORT_BUILD' : C.mis.mode;
    // missions get the loading screen (and its ready check); the fort is quick and just loads
    if (window.MFZLOAD && MFZLOAD.mission && !C.noLoader && isMission(C.mis.mode) && C.mis.mode !== 'SIEGE') MFZLOAD.mission(mode, () => {});
    else go(mode);
  }

  function guestBuilt() {
    C.seed = null;
    C.loading = false;
    tagIds();
    C.mySig = sig();
    C.dbg.guestSig = C.mySig;
    C.built = true;
    log('guest world built', C.mis.mode, C.mySig);
    guestCheckSig();
    send({t: 'ready', sig: C.mySig});
    C.snapLast = now();
    leaveBtn.style.display = 'block';
    hud.style.display = 'block';
    C.active = true;
    specPaint();
  }
  /* what the guest may do: spectators only watch; in the fort (between missions) a survivor can only look and run around */
  function specPaint() {
    C.fortLimit = !C.spec && !!C.mis && C.mis.mode === 'FORT_BUILD';
    const b = $$('coopSpec');
    if (b) b.style.display = C.spec ? 'block' : 'none';
    try {
      $('hud').classList.toggle('hide', !!C.spec);
      if (C.spec) ui('');
    } catch (e) {}
  }
  function guestAssign(m) {
    applySurvivor(m);
    C.dead = false;
    hideBox();
    if (!C.spec) {
      if (m.x != null) {
        pl.position.set(m.x, 1.6, m.z);
        G.vy = 0;
      }
      say('The host gave you ' + (C.svName || 'a survivor'));
    } else say('You are spectating');
    specPaint();
  }
  /* barricades follow the host's: hit points, new and destroyed ones */
  function guestBars(list) {
    if (!C.built || !G.bars || G.mode === 'EXPEDITION') return;
    const keep = new Set();
    for (const e of list || []) {
      let b = G.bars.find(q => Math.abs(q.x - e.x) < 0.05 && Math.abs(q.z - e.z) < 0.05);
      if (!b) {
        b = {x: e.x, z: e.z, hp: e.hp, ry: e.ry || 0};
        G.bars.push(b);
        try {
          mkBar(b);
        } catch (er) {}
      } else {
        b.hp = e.hp;
        if (b.mesh)
          try {
            tint(b);
          } catch (er) {}
      }
      keep.add(b);
    }
    for (const b of G.bars.slice())
      if (!keep.has(b))
        try {
          breakBar(b);
        } catch (er) {}
  }

  function guestCheckSig() {
    if (!C.built || !C.hostSig || C.sigDone) return;
    C.sigDone = true;
    if (C.hostSig !== C.mySig) {
      console.warn('[coop] world signature differs', C.hostSig, C.mySig);
      say("Co-op: your copy of the town differs slightly from the host's.");
    } else log('world signatures match');
  }
  function newPuppetFor(rec, x, z) {
    const kind = rec[1],
      fz = rec[2];
    const n0 = zombies.length,
      ob = blocked;
    FZ.force = fz || null;
    blocked = () => false;
    try {
      zombie(x, z, kind, false);
    } finally {
      blocked = ob;
      FZ.force = null;
    }
    return zombies.length > n0 ? zombies[zombies.length - 1] : null;
  }

  function guestAdopt(r) {
    C.roster[r[0]] = r; // a zombie that appeared after the start: its puppet is built when it first shows up in a snapshot
  }

  function guestRoster(m) {
    // the guest's own copies of the zombies are thrown away: every zombie the guest sees is built from the host's record, so the
    // types and places always agree with the host no matter how the two towns were generated
    zombies.slice().forEach(z => {
      try {
        scene.remove(z);
      } catch (e) {}
    });
    zombies.length = 0;
    C.zmap = {};
    C.roster = {};
    C.killed = {};
    m.z.forEach(r => (C.roster[r[0]] = r));
    C.dbg.rosterN = m.z.length;
    log('roster', m.z.length, 'zombies (built from the host records as they come into view)');
  }

  function mkRemote(id, name, role, eq) {
    const sv = {id: 'coopR' + id, name, role: role || 'Generalist', hp: 100, morale: 60, hunger: 0, skill: 1, eq: eq ? {id: eq} : null};
    const n0 = comps.length;
    spawnComp0(sv, 0, 0);
    const c = comps[comps.length - 1];
    if (comps.length === n0 || !c) return null;
    comps.splice(comps.indexOf(c), 1);
    const m = c.m;
    smesh = smesh.filter(q => q !== m);
    m.userData.coopRemote = 1;
    m.children.forEach(ch => ch.isSprite && (ch.visible = false));
    return {m, sv, tx: 0, ty: 0, tz: 0, yaw: 0, init: false};
  }
  function remoteTo(key, name, role, eq, x, y, z, yw, crouch) {
    let r = C.remote[key];
    if (!r) {
      r = C.remote[key] = mkRemote(key, name, role, eq);
      if (!r) return;
    }
    if (!r.m.parent) scene.add(r.m);
    r.tx = x;
    r.ty = y;
    r.tz = z;
    r.yaw = yw;
    r.crouch = !!crouch;
    if (!r.init) {
      r.init = true;
      r.m.position.set(x, y, z);
      r.m.rotation.y = yw;
    }
    if (eq !== r.eq) {
      r.eq = eq;
      try {
        r.m.userData.hidInit = false;
        npcVisual(r.m, {eq: eq ? {id: eq} : null});
      } catch (e) {}
    }
  }
  function remoteStep(dt) {
    for (const k in C.remote) {
      const r = C.remote[k];
      if (!r || !r.m.parent) continue;
      const p = r.m.position,
        kk = 1 - Math.exp(-12 * dt),
        dx = r.tx - p.x,
        dz = r.tz - p.z;
      if (Math.hypot(dx, dz) > 8) {
        p.x = r.tx;
        p.z = r.tz;
      } else {
        p.x += dx * kk;
        p.z += dz * kk;
      }
      p.y += (r.ty - p.y) * kk;
      let d = r.yaw - r.m.rotation.y;
      d = Math.atan2(Math.sin(d), Math.cos(d));
      r.m.rotation.y += d * Math.min(1, dt * 12);
      gait(r.m, dt, r.crouch);
    }
  }
  function guestSnap(m) {
    if (!C.active || !C.built) return;
    C.snapLast = now();
    C.dbg.snaps = (C.dbg.snaps || 0) + 1;
    if (m.tm != null) G.time = m.tm;
    // v089: weather follows the host (snapped the first time in each world, blended after that like a normal change)
    if (m.wx && window.RGATM && RGATM.presets && RGATM.presets[m.wx]) {
      if (RGATM._coop !== m.wx || !C.wxSet) {
        RGATM._coop = m.wx;
        if (!C.wxSet && RGATM.snap) RGATM.snap();
        C.wxSet = true;
      }
    }
    const t = now();
    let made = 0;
    for (const e of m.z || []) {
      let z = C.zmap[e[0]];
      if (z && !zombies.includes(z)) continue; // dead on this side already
      if (!z) {
        const rec = C.roster[e[0]];
        if (!rec || C.killed[e[0]] || made >= 8) continue; // at most a few new puppets per snapshot
        z = newPuppetFor(rec, e[1], e[3]);
        if (!z) continue;
        made++;
        z.userData.cid = e[0];
        z.userData.puppet = 1;
        z.position.set(e[1], e[2], e[3]);
        z.rotation.y = e[4];
        C.zmap[e[0]] = z;
      }
      const u = z.userData;
      u.tx = e[1];
      u.ty = e[2];
      u.tz = e[3];
      u.tyaw = e[4];
      u.sn = t;
      z.visible = true;
      const f = e[5];
      u.see = !!(f & 1);
      u.hunt = f & 1 ? 1 : 0;
      if (f & 496) applyLimbs(z, f);
      if (u.sleep && !(f & 4)) {
        try {
          wakeZ(z);
        } catch (err) {
          u.sleep = false;
        }
      }
    }
    const h = m.h;
    if (h) remoteTo('host', C.hostName || 'Host', 'Guard', h[5], h[0], h[1], h[2], h[3] + PI, h[6]);
    for (const o of m.pl || []) remoteTo('g' + o[0], o[1], o[8] || 'Guard', o[6], o[2], o[3], o[4], o[5] + PI, o[7]);
    const seen = now();
    for (const c of m.c || []) {
      remoteTo('c' + c[0], c[6], c[7], c[8], c[1], c[2], c[3], c[4]);
      if (C.remote['c' + c[0]]) C.remote['c' + c[0]].last = seen;
    }
    for (const k in C.remote) {
      const r = C.remote[k];
      if (k[0] === 'c' && r && now() - (r.last || 0) > 3500) {
        if (r.m.parent) scene.remove(r.m);
        delete C.remote[k];
      }
    }
    // my own survivor's health is the host's call
    if (m.me) {
      const hp = m.me[0];
      C.myMax = m.me[1];
      if (!(C.healT && now() < C.healT)) {
        if (hp < G.hp - 0.01) {
          G.hp = hp;
          try {
            $('dv').style.opacity = 1;
            setTimeout(() => ($('dv').style.opacity = 0), 300);
            S.hurt();
          } catch (e) {}
        } else if (hp > G.hp + 0.01) G.hp = hp;
        C.hpSeen = G.hp;
      }
    }
    if (m.np) guestNpcs(m.np);
  }
  function guestNpcs(list) {
    const keep = new Set(list);
    npcList.slice().forEach(n => {
      if (n.userData.cid != null && !keep.has(n.userData.cid)) {
        scene.remove(n);
        npcList = npcList.filter(q => q !== n);
      }
    });
  }
  function guestDoors(m) {
    C.applying = true;
    try {
      (m.d || []).forEach(i => {
        const d = doors.find(q => q.cid === i);
        if (d && !d.open) doorOpen(d, d.sol.min.x, d.sol.min.z, true);
      });
    } finally {
      C.applying = false;
    }
  }
  function guestEvent(m) {
    const z = m.id != null ? C.zmap[m.id] : null,
      ok = !!z && zombies.includes(z),
      ex = !!z && (ok || !!z.parent);
    if (m.k === 'kz') {
      C.killed[m.id] = 1;
      if (ok) {
        if (m.f) applyLimbs(z, m.f);
        if (m.x != null) {
          z.position.x = m.x;
          z.position.z = m.z;
        }
        z.userData.kat = now();
        C.applying = true;
        try {
          killZ(z);
        } finally {
          C.applying = false;
        }
        z.userData.kat = now();
      }
    } else if (m.k === 'hl' && ex) {
      // a head or limb came off (live zombie or corpse)
      if (!z.userData['no_' + m.p]) {
        C.applying = true;
        try {
          try {
            spawnLimb(z, m.p, z.position.x - 1, z.position.z);
          } catch (e) {}
          dismemberQuiet(z, m.p);
          bloodSpray(z.position.x, z.position.y + 1, z.position.z, 0, 1, 10, 1);
        } catch (e) {
        } finally {
          C.applying = false;
        }
      }
    } else if (m.k === 'gib' && ex) {
      if (window.MFZGORE && MFZGORE.gib) {
        C.applying = true;
        try {
          MFZGORE.gib(z, {x: m.fx, z: m.fz});
        } finally {
          C.applying = false;
        }
      }
    } else if (m.k === 'hz' && ok) {
      try {
        bloodSpray(z.position.x, z.position.y + 1.1 * z.scale.x, z.position.z, m.dx || 0, m.dz || 0, ri(5, 9), 1);
        dmgNum(z, m.d || 0);
        flashObj(z, 0.25);
      } catch (e) {}
    } else if (m.k === 'shot') {
      try {
        const w = WDEF[m.w];
        if (w) S.shot(w.snd, new THREE.Vector3(m.x, m.y, m.z));
        const r = C.remote[m.who || 'host'];
        if (r) {
          aimPose(r.m, m.x + (m.dx || 0) * 12, m.y + (m.dy || 0) * 12, m.z + (m.dz || 0) * 12);
          r.m.userData.aimT = 0.8;
        }
      } catch (e) {}
    }
  }
  /* corpses the host no longer has (revived, gibbed, cleaned up) are removed here too */
  function guestCorpses(list) {
    const keep = new Set(list),
      t = now();
    for (const id in C.zmap) {
      const z = C.zmap[id];
      if (!z || zombies.includes(z) || !z.parent || keep.has(+id)) continue;
      if (z.userData.kat && t - z.userData.kat < 6000) continue;
      scene.remove(z);
      const di = dead.indexOf(z);
      if (di >= 0) dead.splice(di, 1);
    }
  }
  /* bullet trails are forwarded both ways (the real muzzle and hit points) */
  function applyTracer(m) {
    if (!m.a || !m.b) return;
    C.applying = true;
    try {
      addTracer(new THREE.Vector3(m.a[0], m.a[1], m.a[2]), new THREE.Vector3(m.b[0], m.b[1], m.b[2]), m.l, m.w, m.c);
    } catch (e) {
    } finally {
      C.applying = false;
    }
  }

  /* the guest's own copies of the zombies glide to where the host says they are */
  function puppetStep(dt) {
    const t = now(),
      k = 1 - Math.exp(-14 * dt);
    for (const z of zombies) {
      const u = z.userData;
      if (u.cid == null || u.tx === undefined) continue;
      if (u.ragT > 0 || u.rg) {
        try {
          ragStep(z, dt);
        } catch (e) {}
        continue;
      }
      const p = z.position,
        dx = u.tx - p.x,
        dz = u.tz - p.z;
      if (Math.hypot(dx, dz) > 6) {
        p.x = u.tx;
        p.z = u.tz;
      } else {
        p.x += dx * k;
        p.z += dz * k;
      }
      p.y += (u.ty - p.y) * k;
      if (u.tyaw !== undefined) {
        let d = u.tyaw - z.rotation.y;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        z.rotation.y += d * Math.min(1, dt * 12);
      }
      try {
        animZ(z, dt, false);
      } catch (e) {}
      if (u.sn && t - u.sn > 4000) z.visible = false;
    }
  }
  /* containers: ask the host for the lock first (it hands over the current contents), give the contents back when closed */
  function guestLockOk(m) {
    const c = C.cmap && C.cmap[m.i];
    C.lockWait = null;
    if (!c) return;
    invLoadInto(c.inv, m.inv);
    c.opened = c.opened || !!m.op;
    try {
      refreshContainerVisual(c);
    } catch (e) {}
    C.myLock = {i: m.i, c};
    C.openOK = true;
    try {
      openContainer(c);
    } finally {
      C.openOK = false;
    }
  }
  function guestLockNo(m) {
    C.lockWait = null;
    say(m.gone ? 'That container is not available.' : (m.by || 'Someone') + ' is using this container.');
  }
  setInterval(() => {
    if (C.role !== 'guest' || !C.myLock) return;
    if (currentContainer !== C.myLock.c) {
      const l = C.myLock;
      C.myLock = null;
      send({t: 'unlock', i: l.i, inv: invDump(l.c.inv)});
    }
  }, 200);
  /* ---- fade to black and the follow camera ---- */
  {
    const fd = document.createElement('div');
    fd.id = 'coopFade';
    fd.style.cssText = 'position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;z-index:80;transition:opacity .7s ease';
    document.body.appendChild(fd);
    const sp = document.createElement('div');
    sp.id = 'coopSpec';
    sp.style.cssText =
      'position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:70;background:rgba(0,0,0,.6);color:#ddd;padding:8px 16px;font:14px system-ui,sans-serif;text-align:center;display:none;pointer-events:none';
    document.body.appendChild(sp);
  }
  function fadeBlack(cb) {
    const fd = $$('coopFade');
    fd.style.opacity = 1;
    setTimeout(() => {
      try {
        cb();
      } catch (e) {
        console.error('[coop] fade', e);
      }
      setTimeout(() => (fd.style.opacity = 0), 250);
    }, 800);
  }
  const specList = () => {
    const R = C.remote || {};
    return ['host'].concat(Object.keys(R).filter(k => k[0] === 'g')).filter(k => R[k] && R[k].m.parent);
  };
  function specNext(d) {
    const l = specList();
    if (l.length) C.specIdx = ((C.specIdx || 0) + d + l.length) % l.length;
  }
  /* The follow camera is placed by the renderer wrapper just before each frame is drawn, so the game's own player physics (ground height,
     wall pushing) can no longer fight it. specStep only works out where the camera should be, smoothly. */
  function specStep(dt) {
    if (typeof K === 'object') for (const k in K) K[k] = false; // spectators never move themselves
    const l = specList(),
      key = l.length ? l[(C.specIdx || 0) % l.length] : null,
      r = key && (C.remote || {})[key],
      b = $$('coopSpec');
    if (b) b.textContent = r ? 'Spectating ' + r.sv.name + '  \u00b7  Q / E or click to switch  \u00b7  mouse wheel to zoom  \u00b7  the host can give you a survivor in the Co-op menu' : 'Waiting for someone to watch...';
    if (!r) return void (C.specCam = null);
    const t = r.m.position,
      ry = r.m.rotation.y;
    const sc = C.specCam || (C.specCam = {key: null, pos: new THREE.Vector3(), look: new THREE.Vector3(), ang: ry});
    if (sc.key !== key) {
      // switched target: start from where the camera is, no teleport
      sc.key = key;
      if (!sc.init) {
        sc.pos.set(t.x - Math.sin(ry) * 4.5, t.y + 2.6, t.z - Math.cos(ry) * 4.5);
        sc.look.set(t.x, t.y + 1.3, t.z);
        sc.ang = ry;
        sc.init = true;
      }
    }
    // swing round behind the target slowly, so a host who spins around does not whip the picture about
    let da = ry - sc.ang;
    da = Math.atan2(Math.sin(da), Math.cos(da));
    const over = Math.abs(da) - 0.45; // small turns are ignored; bigger ones are followed slowly (at most about 1 rad/s)
    if (over > 0) sc.ang += Math.sign(da) * Math.min(1.1, over * 1.2) * dt;
    // v089: the mouse wheel zooms (SPEC_MIN..SPEC_MAX m behind); the height grows with the distance so far views look down on the player
    const want = C.specDist || SPEC_DEF;
    sc.dist = sc.dist == null ? want : sc.dist + (want - sc.dist) * (1 - Math.exp(-8 * dt));
    const dist = sc.dist,
      up = 0.9 + dist * 0.38;
    const kp = 1 - Math.exp(-5 * dt),
      kl = 1 - Math.exp(-9 * dt);
    sc.pos.x += (t.x - Math.sin(sc.ang) * dist - sc.pos.x) * kp;
    sc.pos.y += (t.y + up - sc.pos.y) * kp;
    sc.pos.z += (t.z - Math.cos(sc.ang) * dist - sc.pos.z) * kp;
    sc.look.x += (t.x - sc.look.x) * kl;
    sc.look.y += (t.y + 1.3 - sc.look.y) * kl;
    sc.look.z += (t.z - sc.look.z) * kl;
    // the game's view-distance and level-of-detail logic follow the player: keep that over the watched area
    pl.position.x = t.x;
    pl.position.z = t.z;
  }
  /* v089: the camera is a child of the player rig (pl), so the old camera.position.copy(worldPoint) was read as an offset from the
     player and the frame was drawn from a stale matrix: in practice from inside the watched player's head. The follow camera is now
     placed in world space: its local transform is worked out from the rig's world matrix and its matrices are refreshed right
     before the frame is drawn. resetCam() puts it back on the rig for first-person play. */
  const _sObj = new THREE.Camera(),
    _sInv = new THREE.Matrix4(),
    _sLoc = new THREE.Matrix4();
  function specApply() {
    const sc = C.specCam;
    if (!sc || !(C.role === 'guest' && C.spec)) return;
    try {
      pl.updateMatrixWorld(true);
      // never into the floor under the camera (floors at or below the watched player's head; the smoothed path itself is left alone)
      const gy = typeof groundAt === 'function' ? groundAt(sc.pos.x, sc.pos.z, sc.look.y + 0.5) : -1e9;
      _sObj.position.copy(sc.pos);
      if (_sObj.position.y < gy + 0.6) _sObj.position.y = gy + 0.6;
      _sObj.lookAt(sc.look);
      _sObj.updateMatrix();
      _sLoc.multiplyMatrices(_sInv.copy(pl.matrixWorld).invert(), _sObj.matrix);
      _sLoc.decompose(camera.position, camera.quaternion, camera.scale);
      camera.updateMatrixWorld(true);
      C.camMoved = true;
    } catch (e) {}
  }
  function resetCam() {
    if (!C.camMoved) return;
    C.camMoved = false;
    C.specCam = null;
    camera.position.set(0, 0, 0);
    camera.quaternion.identity();
    camera.scale.set(1, 1, 1);
    camera.rotation.set(typeof pitch === 'number' ? pitch : 0, 0, 0);
  }
  C.resetCam = resetCam;
  const SPEC_MIN = 1.6,
    SPEC_MAX = 22,
    SPEC_DEF = 4.5;
  addEventListener(
    'wheel',
    e => {
      if (C.role !== 'guest' || !C.spec || !C.active) return;
      const d = C.specDist || SPEC_DEF;
      C.specDist = Math.max(SPEC_MIN, Math.min(SPEC_MAX, d * Math.pow(1.15, Math.sign(e.deltaY))));
      e.stopImmediatePropagation();
    },
    {capture: true, passive: true}
  );
  /* v089: this hook used to be installed only if the renderer already existed when coop.js loaded. It does not (init() makes it
     later), so specApply never ran and the camera simply sat on the player rig, which specStep parks on the watched player: the view
     from inside their head. It now waits for the renderer, like zbatch.js does. */
  (function hookRender() {
    if (typeof renderer === 'undefined' || !renderer || typeof renderer.render !== 'function') return setTimeout(hookRender, 200);
    if (renderer.__coopSpec) return;
    renderer.__coopSpec = 1;
    const _rr = renderer.render;
    renderer.render = function (sc, cam) {
      if (C.spec && C.role === 'guest' && cam === camera) specApply();
      return _rr.apply(this, arguments);
    };
  })();
  // v089: fort rules only between missions; once the siege is on (G.mode SIEGE) a guest has normal control
  const fortRules = () => !!C.fortLimit && typeof G !== 'undefined' && G.mode !== 'SIEGE';
  // spectators and fort guests: the keys and clicks the game would act on are swallowed (movement and Esc still work)
  addEventListener(
    'keydown',
    e => {
      if (C.role !== 'guest' || !(C.spec || fortRules())) return;
      if (C.spec) {
        if (e.code === 'KeyQ' || e.code === 'ArrowLeft') specNext(-1);
        else if (e.code === 'KeyE' || e.code === 'ArrowRight' || e.code === 'Tab') specNext(1);
        if (e.code !== 'Escape') {
          e.stopImmediatePropagation();
          e.preventDefault();
        }
        return;
      }
      const ok = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ShiftRight', 'Space', 'ControlLeft', 'ControlRight', 'KeyC', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      if (!ok.includes(e.code)) e.stopImmediatePropagation();
    },
    true
  );
  addEventListener(
    'mousedown',
    e => {
      if (C.role !== 'guest' || !(C.spec || fortRules()) || typeof locked === 'undefined' || !locked) return;
      if (C.spec && e.button === 0) specNext(1);
      e.stopImmediatePropagation();
    },
    true
  );
  {
    const _avm = window.animVM;
    if (typeof _avm === 'function')
      window.animVM = function (dt) {
        if (C.role === 'guest' && C.spec) {
          try {
            if (typeof VM !== 'undefined' && VM.root) VM.root.visible = false;
            if (window.RGX && RGX.vm) {
              RGX.vm.active = false;
              if (RGX.vm.cur) RGX.vm.cur.root.visible = false;
            }
          } catch (e) {}
          return;
        }
        return _avm.apply(this, arguments);
      };
  }
  function guestDown() {
    if (C.dead) return;
    C.dead = true;
    G.hp = 0;
    say('Your survivor was killed. You are spectating until the host gives you another.');
    fadeBlack(() => {
      applySurvivor({spec: true});
      specPaint();
    });
  }

  /* E at the truck: fade out, leave the map for good (nothing can attack you now) and follow the others */
  function guestLeave() {
    if (C.ending || C.spec || C.leaving) return;
    C.leaving = true;
    send({t: 'leave', inv: invDump(PINV, G.eq)});
    fadeBlack(() => {
      applySurvivor({spec: true});
      C.leaving = false;
      specPaint();
    });
  }
  /* the Leave button: out of the session altogether */
  function guestQuit() {
    if (C.ending) return;
    send({t: 'leave', inv: invDump(PINV, G.eq)});
    setTimeout(() => guestEnded({why: 'You left the co-op session.', home: 1}), 250);
  }

  function guestEnded(m) {
    if (C.ending) return;
    C.ending = true;
    C.run = false;
    C.active = false;
    leaveBtn.style.display = 'none';
    hud.style.display = 'none';
    try {
      document.exitPointerLock();
    } catch (e) {}
    showBox(
      '<h2>CO-OP OVER</h2><div class="st">' + esc(m.why || 'The session ended.') + '</div>' +
        (m.home ? "<div class=\"st\">Your survivor's pack went home with the host.</div>" : '') +
        '<button class="pri" id="cpX">Back to the menu</button>'
    );
    $$('cpX').onclick = () => leavePage();
  }
  function leavePage() {
    try {
      C.conn && C.conn.close();
    } catch (e) {}
    location.href = location.pathname + location.search; // v100: keep URL flags (?noa2c etc.)
  }

  /* --- guest: what it sends the host --- */
  setInterval(() => {
    if (C.role !== 'guest' || !C.active || !C.conn || C.dead || C.ending || C.spec) return;
    const fy = pl.position.y - (G.eyeUsed || 1.6);
    send({t: 'p', x: r2(pl.position.x), y: r2(fy), z: r2(pl.position.z), yaw: r2(yaw), pt: r2(pitch), c: G.crouch ? 1 : 0, w: G.eq ? G.eq.id : null});
    // a heal the guest used on their own survivor
    if (C.hpSeen != null && G.hp > C.hpSeen + 0.01) {
      send({t: 'heal', d: G.hp - C.hpSeen});
      C.hpSeen = G.hp;
      C.healT = now() + 600;
    }
    if (hud.style.display === 'block') hud.textContent = 'CO-OP with ' + (C.hostName || 'host') + ' \u00b7 ' + (C.svName || '') + (C.dead ? ' (down)' : '');
  }, 66);
  // my pack is the survivor's inventory on the host at all times (every 0.3 s a change is sent)
  setInterval(() => {
    if (C.role !== 'guest' || !C.active || !C.conn || C.ending) return;
    const ps = myPackSig();
    if (ps !== C.pkSig) {
      C.pkSig = ps;
      send({t: 'bk', inv: invDump(PINV, G.eq), hp: G.hp});
    }
  }, 300);

  /* ===================================================== SHARED HOOKS ===================================================== */
  /* doors: id by build order (broken doors leave the list, so the id sticks to the door itself) */
  const _dO = doorOpen,
    _dC = doorClose,
    _dB = doorBreak;
  function doorMsg(d, op, extra) {
    if (C.applying || !linked() || !C.active || d.cid == null) return;
    out(Object.assign({t: 'door', i: d.cid, op}, extra || {}));
  }
  doorOpen = function (d, fx, fz) {
    const r = _dO.apply(this, arguments);
    if (r && d) doorMsg(d, 'o', {fx: r2(fx || 0), fz: r2(fz || 0)});
    return r;
  };
  doorClose = function (d) {
    const r = _dC.apply(this, arguments);
    if (r && d) doorMsg(d, 'c');
    return r;
  };
  doorBreak = function (d) {
    if (d && d.cid != null) doorMsg(d, 'b');
    return _dB.apply(this, arguments);
  };
  function applyDoor(m) {
    const d = doors.find(q => q.cid === m.i);
    if (!d) return;
    C.applying = true;
    try {
      if (m.op === 'o') doorOpen(d, +m.fx || 0, +m.fz || 0);
      else if (m.op === 'c') doorClose(d);
      else if (m.op === 'b') doorBreak(d);
      else if (m.op === 'u') d.locked = false;
    } finally {
      C.applying = false;
    }
  }
  /* loot containers: only the lock holder can change one; the new contents are broadcast when they let go */
  function applyCont(m) {
    const c = C.cmap && C.cmap[m.i];
    if (!c || currentContainer === c || !m.inv) return;
    invLoadInto(c.inv, m.inv);
    c.opened = c.opened || !!m.op;
    try {
      refreshContainerVisual(c);
    } catch (e) {}
  }
  if (typeof openContainer === 'function') {
    const _oc = openContainer;
    openContainer = function (c) {
      if (C.run && c && c.cid != null && !C.openOK) {
        if (C.role === 'guest') {
          if (C.lockWait && now() - C.lockWait < 4000) return;
          C.lockWait = now();
          send({t: 'lockreq', i: c.cid});
          return;
        }
        if (C.role === 'host' && C.guests.some(g => g.active)) {
          const l = C.locks[c.cid];
          if (l && l.by !== 'host' && now() - l.t < 180000) return say(lockHolderName(l) + ' is using this container.');
          C.locks[c.cid] = {by: 'host', t: now()};
          C.hostHolds = c;
        }
      }
      return _oc.apply(this, arguments);
    };
  }

  /* ---- zombie / survivor hooks ---- */
  const _upd = updateZombies;
  updateZombies = function (dt) {
    if (C.role === 'guest' && C.active) {
      puppetStep(dt);
      if (C.spec) specStep(dt);
      return;
    }
    if (C.role === 'host' && C.guests.some(g => g.av)) avStep(dt);
    return _upd.apply(this, arguments);
  };
  const _comps = updComps;
  updComps = function (dt) {
    if (C.role === 'guest' && C.active) return remoteStep(dt);
    return _comps.apply(this, arguments);
  };
  const _sf = survFight;
  survFight = function () {
    if (C.role === 'guest' && C.active) return;
    const r = _sf.apply(this, arguments);
    if (C.role === 'host')
      for (const g of C.guests) if (g.av && g.av.m.parent) gaitPose(g.av.m); // after survwalk, so the crouch is not overwritten
    return r;
  };
  const _at = advanceTime;
  advanceTime = function () {
    if (C.role === 'guest' && C.active) return;
    return _at.apply(this, arguments);
  };
  const _dm = damage;
  damage = function (a) {
    if (C.role === 'guest' && C.active) {
      if (!C.spec) send({t: 'dmg', d: a});
      return;
    }
    return _dm.apply(this, arguments);
  };
  const _hz = hitZ;
  hitZ = function (z, dmg, part, melee) {
    if (C.role === 'guest' && C.active && z && z.userData.cid != null) {
      send({t: 'hit', k: 'h', id: z.userData.cid, d: r2(dmg), p: part || 'torso', m: melee ? 1 : 0});
      try {
        bloodSpray(z.position.x, z.position.y + 1.1 * z.scale.x, z.position.z, z.position.x - pl.position.x, z.position.z - pl.position.z, ri(5, 9), 1);
        flashObj(z, 0.25);
        dmgNum(z, dmg);
      } catch (e) {}
      return false;
    }
    return _hz.apply(this, arguments);
  };
  const _dz = dmgZ;
  dmgZ = function (z, d, fr) {
    if (C.role === 'guest' && C.active && z && z.userData.cid != null) {
      send({t: 'hit', k: 'd', id: z.userData.cid, d: r2(d)});
      return;
    }
    if (C.role === 'host' && C.active && z && z.userData.cid != null && !C.applying) {
      const f = fr || pl.position;
      sendRun({t: 'ev', k: 'hz', id: z.userData.cid, d: r2(d), dx: r2(z.position.x - f.x), dz: r2(z.position.z - f.z)});
    }
    return _dz.apply(this, arguments);
  };
  const _kz = killZ;
  killZ = function (z) {
    if (C.role === 'host' && C.active && z && z.userData.cid != null && !C.applying)
      sendRun({t: 'ev', k: 'kz', id: z.userData.cid, x: r2(z.position.x), z: r2(z.position.z), f: limbMask(z.userData)});
    return _kz.apply(this, arguments);
  };
  /* limbs and gibbing: every head or limb that comes off (live zombie or corpse) and every gibbed torso is sent to the guest */
  if (typeof hideLimb === 'function') {
    const _hl = hideLimb;
    hideLimb = function (z, part) {
      if (C.role === 'host' && C.run && z && z.userData.cid != null && !C.applying && !z.userData['no_' + part]) sendRun({t: 'ev', k: 'hl', id: z.userData.cid, p: part});
      return _hl.apply(this, arguments);
    };
  }
  if (window.MFZGORE && typeof MFZGORE.gib === 'function') {
    const _gib = MFZGORE.gib;
    MFZGORE.gib = function (z, from) {
      if (C.role === 'host' && C.run && z && z.userData.cid != null && !C.applying) {
        const f = from || pl.position;
        sendRun({t: 'ev', k: 'gib', id: z.userData.cid, fx: r2(f.x), fz: r2(f.z)});
      }
      return _gib.apply(this, arguments);
    };
  }
  if (typeof window.corpseHit === 'function') {
    const _ch = window.corpseHit;
    window.corpseHit = function (c, part, dmg, from) {
      if (C.role === 'guest' && C.active && c && c.userData.cid != null && !C.applying) {
        send({t: 'chit', id: c.userData.cid, p: part || 'torso', d: r2(dmg || 10)});
        return true;
      }
      return _ch.apply(this, arguments);
    };
  }
  /* bullet trails: the real muzzle and hit points go to the other player */
  {
    const _tr = addTracer;
    let trT = 0;
    addTracer = function (a, b, life, w, col) {
      if (C.run && linked() && !C.applying && a && b) {
        const t = now();
        if (t - trT > 30) {
          trT = t;
          out({t: 'tr', a: [r2(a.x), r2(a.y), r2(a.z)], b: [r2(b.x), r2(b.y), r2(b.z)], l: life, w, c: col});
        }
      }
      return _tr.apply(this, arguments);
    };
  }
  /* no survivor wheel for guests, and none on a guest's survivor: E on a guest opens their pack straight away (live). The wheel still
     works on the host's own followers. */
  {
    const openGuestPack = g => {
      if (g && g.mirror) openContainer(g.mirror);
    };
    if (typeof wheelOpen === 'function') {
      const _wo = wheelOpen;
      wheelOpen = function (c) {
        if (C.role === 'guest' && c && c.m && c.m.userData.coopRemote) return; // guests never command anyone
        if (C.role === 'host' && c) {
          const g = gOfComp(c);
          if (g) return openGuestPack(g);
        }
        return _wo.apply(this, arguments);
      };
    }
    if (typeof toggleFollow === 'function') {
      const _tf = toggleFollow;
      toggleFollow = function (c) {
        if (C.role === 'guest' && c && c.m && c.m.userData.coopRemote) return;
        if (C.role === 'host' && c) {
          const g = gOfComp(c);
          if (g) return openGuestPack(g);
        }
        return _tf.apply(this, arguments);
      };
    }
  }
  /* co-op never pauses: the pause screen still appears (you need it to get the mouse back) but the world keeps running */
  {
    const _fzn = frozen;
    frozen = function () {
      if (C.run) return false;
      return _fzn.apply(this, arguments);
    };
    setInterval(() => {
      const pz = $$('pz');
      if (!pz) return;
      let n = $$('coopNote');
      if (!n) {
        n = document.createElement('div');
        n.id = 'coopNote';
        n.style.cssText = 'margin-top:14px;color:#facc15;font:700 14px system-ui,sans-serif;text-align:center';
        n.textContent = 'CO-OP: the world keeps running while you are on this screen. Click to take control again.';
        pz.appendChild(n);
      }
      n.style.display = C.run ? 'block' : 'none';
    }, 500);
  }
  /* shots: tell the host (guest) / tell the guest (host) so each hears and sees the other fire */
  const _sh = shoot;
  shoot = function () {
    const w = G.eq,
      c0 = w ? w.clip : 0;
    const r = _sh.apply(this, arguments);
    if (C.active && w && WDEF[w.id] && WDEF[w.id].type === 'gun' && w.clip !== c0) {
      const f = new THREE.Vector3();
      camera.getWorldDirection(f);
      const msg = {w: w.id, x: r2(pl.position.x), y: r2(pl.position.y), z: r2(pl.position.z), dx: r2(f.x), dy: r2(f.y), dz: r2(f.z)};
      if (C.role === 'guest') send(Object.assign({t: 'shot'}, msg));
      else if (C.role === 'host') sendRun(Object.assign({t: 'ev', k: 'shot', who: 'host'}, msg));
    }
    return r;
  };
  /* the guest uses E on a survivor: ask the host; at the truck: go home */
  const _use = use;
  use = function () {
    if (C.role === 'guest' && C.active && !C.dead) {
      if (G.mode === 'EXPEDITION' && nearTruck()) {
        guestLeave('You made it back to the truck.');
        return;
      }
      let h = null;
      try {
        h = look(false);
      } catch (e) {}
      if (h && h.o && h.d <= 3.5 && h.o.userData.kind === 'npc') {
        send({t: 'rec', i: h.o.userData.cid});
        say('Asking ' + (C.hostName || 'the host') + ' to take them in...');
        return;
      }
    }
    return _use.apply(this, arguments);
  };
  /* lockpicking succeeds on one side: unlock on the other */
  if (typeof skLockpick === 'function') {
    const _lp = skLockpick;
    skLockpick = function (t) {
      const r = _lp.apply(this, arguments);
      if (t && t.door && t.door.cid != null && C.active) {
        const d = t.door;
        const iv = setInterval(() => {
          if (!d.locked) {
            clearInterval(iv);
            out({t: 'door', i: d.cid, op: 'u'});
          }
        }, 500);
        setTimeout(() => clearInterval(iv), 12000);
      }
      return r;
    };
  }

  /* the co-op menu on the left of the Options screen: the code, who is in, and (for the host) who plays whom, plus a kick button */
  {
    const st = document.createElement('style');
    st.textContent =
      '#coopCode{position:fixed;left:18px;top:50%;transform:translateY(-50%);z-index:85;background:rgba(10,12,8,.9);border:1px solid #6b5d1a;color:#ddd;padding:14px 18px;font:13px system-ui,sans-serif;display:none;min-width:230px;max-width:330px}' +
      '#coopCode b{color:#facc15;font:700 12px Impact,sans-serif;letter-spacing:.14em}' +
      '#coopCode .cc{font:700 30px monospace;letter-spacing:.2em;color:#fff;margin:4px 0 8px}' +
      '#coopCode .pp{color:#9ab;margin-top:2px}' +
      '.cgrow{margin:8px 0;text-align:left}.cgst{color:#9ab;font-size:12px}' +
      '#coopCode select,#coopBox .cgrow select{max-width:230px;padding:4px;background:#0c0d09;color:#eee;border:1px solid #555;font-size:13px}' +
      '#coopCode button,#coopBox .cgrow button{margin:2px 0 0 4px;padding:4px 10px;background:#4a1a1a;color:#fff;border:1px solid #844;cursor:pointer;font-size:12px}';
    document.head.appendChild(st);
    const el = document.createElement('div');
    el.id = 'coopCode';
    document.body.appendChild(el);
    let lastSig = '';
    setInterval(() => {
      let show = false;
      try {
        show = scrVis('opt') && (C.role === 'host' || (C.role === 'guest' && !!C.run));
      } catch (e) {}
      if (!show) return void (el.style.display = 'none');
      if (C.role === 'host') {
        const af = document.activeElement,
          editing = af && af.tagName === 'SELECT' && el.contains(af);
        const sg = JSON.stringify([C.code, C.guests.map(g => [g.id, g.name, g.started, g.active, !!g.av, g.sv && g.sv.name, g.pref && (g.pref.id || g.pref)]), (G.surv || []).map(q => q.id + ':' + Math.round(q.hp))]);
        if (sg !== lastSig && !editing) {
          lastSig = sg;
          el.innerHTML = '<b>CO-OP</b><div class="cc">' + esc(C.code || '') + '</div>' + (C.guests.length ? rowsHtml() : '<div class="pp">Nobody has joined yet</div>');
          bindRows(el);
        }
      } else {
        const people = [esc(C.hostName || 'Host') + ' (host)', 'You \u00b7 ' + esc(C.svName || 'spectating')].concat(Object.keys(C.remote || {}).filter(k => k[0] === 'g').map(k => esc(C.remote[k].sv.name)));
        el.innerHTML = '<b>CO-OP JOIN CODE</b><div class="cc">' + esc(C.code || '') + '</div>' + people.map(p => '<div class="pp">' + p + '</div>').join('');
        lastSig = '';
      }
      el.style.display = 'block';
    }, 400);
  }

  /* ---------------- menu entry ---------------- */
  (function addMenu() {
    const nav = document.querySelector('#menu .mmNav');
    if (!nav) return;
    const b = document.createElement('button');
    b.className = 'mbtn';
    b.innerHTML = "<i>+</i><span>Join Co-op</span><small>Play a survivor on a friend's mission</small>";
    b.onclick = () => joinMenu();
    b.onmouseenter = () => {
      try {
        S.ui();
      } catch (e) {}
    };
    const opt = [...nav.children].find(x => /options/i.test(x.textContent));
    nav.insertBefore(b, opt || null);
  })();
  if (urlCode) {
    const t = setInterval(() => {
      if (typeof scrNow !== 'undefined' && scrNow === 'menu') {
        clearInterval(t);
        joinMenu(urlCode.toUpperCase());
      }
    }, 500);
  }
  Object.assign(C, {specApply, guestLeave, hostAssign, hostKick, rowsHtml, specStep, guestAssign, guestBars, guestStart, gaitPose, gait, guestMsg, remoteTo, applyTracer, hostPacks, hostMsg, myPackSig, packSig, applyCont, linked, sendG, sendRun, sendAll, gOfComp, sig, tagIds, invLoadInto, invDump, hostOpen, guestJoin, guestStart, send});
  log('co-op ready (protocol ' + C.ver + ')');
})();
