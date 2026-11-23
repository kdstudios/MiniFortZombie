/* MINI FORT ZOMBIE - core 03/13: audio
   Procedural audio (S.*), music, UI init, tooltips.
   Part of the old js/game/core.js (split in v080). Classic script: shares globals with the other core parts; load in numeric order. */
// ===== AUDIO (all procedural WebAudio) =====
const PI = Math.PI;
let SFX,
  MUS,
  MASTER,
  NB,
  MV = 0.6,
  MSV = 1,
  AV = 1,
  musMode = '',
  amb = {},
  aT = {g: 0, b: 2, v: 6, x: 20, m: 1, sil: 0, ss: 30},
  hov = null;
function initAudio() {
  if (AC) {
    if (AC.state === 'suspended') AC.resume();
    return;
  }
  AC = new (window.AudioContext || window.webkitAudioContext)();
  MASTER = AC.createGain();
  MASTER.gain.value = MSV;
  MASTER.connect(AC.destination);
  SFX = AC.createGain();
  SFX.gain.value = 0.8;
  SFX.connect(MASTER);
  MUS = AC.createGain();
  MUS.gain.value = MV;
  MUS.connect(MASTER);
  NB = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate);
  const d = NB.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = AC.createBufferSource(),
    f = AC.createBiquadFilter(),
    g = AC.createGain(),
    l = AC.createOscillator(),
    lg = AC.createGain();
  s.buffer = NB;
  s.loop = true;
  f.type = 'bandpass';
  f.Q.value = 0.7;
  f.frequency.value = 450;
  g.gain.value = 0;
  l.frequency.value = 0.12;
  lg.gain.value = 260;
  l.connect(lg);
  lg.connect(f.frequency);
  s.connect(f);
  f.connect(g);
  g.connect(SFX);
  s.start();
  l.start();
  amb.wind = g;
  const lf = AC.createBiquadFilter(),
    dg = AC.createGain(),
    l2 = AC.createOscillator(),
    lg2 = AC.createGain();
  lf.type = 'lowpass';
  lf.frequency.value = 240;
  lf.Q.value = 5;
  dg.gain.value = 0;
  lf.connect(dg);
  dg.connect(MUS);
  l2.frequency.value = 0.06;
  lg2.gain.value = 140;
  l2.connect(lg2);
  lg2.connect(lf.frequency);
  l2.start();
  for (const [t, fr, v] of [
    ['sawtooth', 55, 0.16],
    ['sawtooth', 55.6, 0.14],
    ['sine', 58.3, 0.2],
    ['sine', 82.4, 0.1],
    ['sawtooth', 110.8, 0.05]
  ]) {
    const o = AC.createOscillator(),
      og = AC.createGain();
    o.type = t;
    o.frequency.value = fr;
    og.gain.value = v;
    o.connect(og);
    og.connect(lf);
    o.start();
  }
  amb.dg = dg;
  amb.lf = lf;
}
function out(p, mx = 40) {
  if (!AC) return null;
  if (!p) return SFX;
  const dx = p.x - pl.position.x,
    dz = p.z - pl.position.z,
    d = Math.hypot(dx, dz);
  if (d > mx) return null;
  const g = AC.createGain();
  g.gain.value = Math.pow(1 - d / mx, 1.5);
  if (AC.createStereoPanner) {
    const s = AC.createStereoPanner();
    s.pan.value = Math.max(-1, Math.min(1, (dx * Math.cos(yaw) - dz * Math.sin(yaw)) / (d || 1)));
    g.connect(s);
    s.connect(SFX);
  } else g.connect(SFX);
  return g;
}
function T(o, type, f0, f1, dur, vol, del = 0, att = 0.005) {
  if (!o) return;
  const t = AC.currentTime + del,
    s = AC.createOscillator(),
    g = AC.createGain();
  s.type = type;
  s.frequency.setValueAtTime(f0, t);
  s.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + att);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(g);
  g.connect(o);
  s.start(t);
  s.stop(t + dur + 0.05);
}
function N(o, ft, f0, f1, q, dur, vol, del = 0) {
  if (!o) return;
  const t = AC.currentTime + del,
    s = AC.createBufferSource(),
    f = AC.createBiquadFilter(),
    g = AC.createGain();
  s.buffer = NB;
  s.loop = true;
  f.type = ft;
  f.Q.value = q;
  f.frequency.setValueAtTime(f0, t);
  f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f);
  f.connect(g);
  g.connect(o);
  s.start(t, Math.random());
  s.stop(t + dur + 0.05);
}
function V(o, f0, f1, dur, vol, fm, del = 0, rough = 1) {
  if (!o) return;
  const t = AC.currentTime + del,
    s = AC.createOscillator(),
    f = AC.createBiquadFilter(),
    g = AC.createGain(),
    l = AC.createOscillator(),
    lg = AC.createGain();
  s.type = 'sawtooth';
  s.frequency.setValueAtTime(f0, t);
  s.frequency.linearRampToValueAtTime(f1, t + dur);
  l.frequency.value = rnd(5, 9);
  lg.gain.value = f0 * 0.05 * rough;
  l.connect(lg);
  lg.connect(s.frequency);
  f.type = 'bandpass';
  f.Q.value = 3;
  f.frequency.setValueAtTime(fm[0], t);
  f.frequency.linearRampToValueAtTime(fm[1], t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + dur * 0.25);
  g.gain.linearRampToValueAtTime(0.0001, t + dur);
  s.connect(f);
  f.connect(g);
  g.connect(o);
  s.start(t);
  l.start(t);
  s.stop(t + dur + 0.05);
  l.stop(t + dur + 0.05);
}
const S = {
  groan(p) {
    if (!AC || AC.currentTime < aT.g) return;
    const o = out(p, 35);
    if (!o) return;
    aT.g = AC.currentTime + 0.3;
    const f = rnd(70, 120);
    V(o, f, f * rnd(0.55, 0.9), rnd(1, 1.9), 0.5, [rnd(300, 500), rnd(450, 750)], 0, 1);
    N(o, 'bandpass', 500, 300, 2, 1.2, 0.05);
  },
  snarl(p) {
    const o = out(p, 30),
      f = rnd(110, 160);
    V(o, f, f * 0.7, 0.45, 0.6, [700, 1100], 0, 3);
    N(o, 'bandpass', 900, 500, 3, 0.4, 0.15);
  },
  lost(p) {
    V(out(p, 35), rnd(120, 150), 55, 2.2, 0.5, [650, 250], 0, 1.5);
  },
  /* v093 (small fixes): zombies hitting a door / window / barricade (kind 'door' | 'win' | 'bar'): a heavy thud with a short effort grunt,
     not the "it has seen you" snarl */
  zbash(kind, p) {
    const o = out(p, 35);
    if (!o) return;
    T(o, 'sine', rnd(80, 100), 40, 0.16, 0.75);
    N(o, 'lowpass', 1000, 180, 1, 0.14, 0.6);
    V(o, rnd(85, 105), 65, 0.3, 0.22, [380, 260], 0.02, 1.5);
    if (kind === 'win') {
      N(o, 'highpass', 3200, 2200, 0.8, 0.12, 0.3, 0.01);
      T(o, 'triangle', 1700, 1250, 0.09, 0.14, 0.01);
    } else if (kind === 'bar') {
      T(o, 'triangle', 320, 190, 0.07, 0.3, 0.005);
      T(o, 'sawtooth', 190, 130, 0.2, 0.1, 0.06);
      N(o, 'bandpass', 700, 350, 2, 0.1, 0.18, 0.04);
    } else {
      T(o, 'triangle', 240, 150, 0.1, 0.25, 0.005);
      N(o, 'bandpass', 500, 220, 1.5, 0.1, 0.2, 0.03);
    }
  },
  /* a zombie's claws / teeth land on a person: a wet tearing rasp and a thud */
  zclaw(p) {
    const o = out(p, 30);
    if (!o) return;
    N(o, 'bandpass', rnd(1300, 1700), 600, 1, 0.18, 0.45);
    N(o, 'highpass', 2200, 1200, 0.7, 0.07, 0.2, 0.02);
    T(o, 'sine', 105, 48, 0.1, 0.5, 0.02);
    V(o, rnd(115, 140), 85, 0.28, 0.28, [600, 380], 0.03, 2);
  },
  /* something hits water (big: a heavy hit): a plunk, a spray of drops, a slow gurgle */
  splash(big, p) {
    const o = out(p, big ? 55 : 40);
    if (!o) return;
    const k = big ? 1.4 : 1;
    N(o, 'bandpass', rnd(900, 1400), 350, 0.9, 0.3 * k, 0.55);
    N(o, 'highpass', 2600, 1800, 0.7, 0.12, 0.3, 0.015);
    T(o, 'sine', rnd(380, 520) / k, 110 / k, 0.13 * k, 0.5, 0.01);
    for (let i = 0; i < (big ? 5 : 3); i++) T(o, 'sine', rnd(900, 1900), rnd(500, 900), 0.04, 0.08, 0.08 + i * rnd(0.04, 0.09));
    N(o, 'lowpass', 500, 120, 1, 0.22 * k, 0.3 * k, 0.05);
  },
  /* a foot comes down in water (deep: knee-deep or more): a wet slosh */
  wade(deep, p) {
    if (!AC || AC.currentTime < (aT.w || 0)) return;
    const o = out(p, 28);
    if (!o) return;
    aT.w = AC.currentTime + 0.07;
    N(o, 'bandpass', deep ? rnd(500, 750) : rnd(900, 1300), deep ? 220 : 500, 1, deep ? 0.34 : 0.2, deep ? 0.5 : 0.4);
    N(o, 'highpass', 2400, 1500, 0.7, 0.08, 0.2, 0.01);
    if (deep) {
      T(o, 'sine', rnd(240, 320), 90, 0.12, 0.3, 0.02);
      N(o, 'lowpass', 450, 110, 1, 0.3, 0.3, 0.06);
    }
  },
  die(p) {
    const o = out(p, 40);
    V(o, 150, 45, 1.1, 0.6, [800, 200], 0, 2);
    T(o, 'sine', 90, 35, 0.3, 0.6, 0.4);
    N(o, 'lowpass', 500, 100, 1, 0.3, 0.3, 0.4);
  },
  shot(w, p) {
    const o = out(p, 100);
    if (w === 2 || w === 'shotgun' || w === 'heavy') {
      N(o, 'lowpass', 2800, 250, 0.8, 0.55, 1);
      T(o, 'sine', 90, 25, 0.45, 1);
      N(o, 'highpass', 1500, 900, 0.7, 0.18, 0.6);
      N(o, 'lowpass', 1200, 300, 0.5, 0.7, 0.25, 0.12);
      if (w === 'heavy') {
        T(o, 'sine', 60, 20, 0.6, 0.9);
        N(o, 'bandpass', 900, 300, 0.6, 0.5, 0.7);
      } else {
        T(o, 'triangle', 900, 500, 0.04, 0.25, 0.45);
        T(o, 'triangle', 700, 400, 0.05, 0.25, 0.6);
      }
    } else if (w === 3 || w === 'smg' || w === 'rifle') {
      N(o, 'bandpass', w === 'smg' ? 2200 : 1800, 800, 1, 0.1, 0.7);
      T(o, 'square', w === 'smg' ? 230 : 180, 50, 0.09, 0.35);
      N(o, 'lowpass', 1000, 300, 0.5, 0.35, 0.15, 0.06);
      if (w === 'rifle') {
        T(o, 'sine', 110, 35, 0.22, 0.6);
        N(o, 'highpass', 2500, 1200, 0.7, 0.1, 0.5);
      }
    } else if (w === 'magnum' || w === 'revolver') {
      const v = w === 'magnum' ? 0.9 : 0.75;
      N(o, 'highpass', 2400, 1200, 0.7, 0.16, v);
      T(o, 'sine', 120, 30, 0.28, v);
      N(o, 'lowpass', 1200, 200, 0.5, 0.6, 0.2, 0.08);
    } else {
      N(o, 'highpass', 2600, 1400, 0.7, 0.13, 0.8);
      T(o, 'sine', 170, 40, 0.16, 0.7);
      N(o, 'lowpass', 1400, 300, 0.5, 0.45, 0.15, 0.08);
    }
  },
  rlStep(d, p) {
    const o = out(p, 40),
      k = (t, v) => {
        N(o, 'bandpass', 2800, 2200, 4, 0.035, v, t);
        T(o, 'square', 700, 350, 0.04, 0.1, t);
      };
    if (d.rlN === 1) {
      k(0, 0.35);
      T(o, 'sine', 140, 70, 0.1, 0.3, 0.08);
    } else {
      k(0.1, 0.4);
      T(o, 'sine', 140, 70, 0.1, 0.5, 0.62);
      k(0.95, 0.4);
    }
  },
  swing(w, p) {
    N(out(p, 30), 'bandpass', w ? 500 : 350, w ? 1400 : 1900, 1.2, 0.2, 0.3);
  },
  hit(w, p) {
    const o = out(p, 40);
    if (w === 'blade') {
      N(o, 'bandpass', 1800, 700, 1.5, 0.16, 0.6);
      T(o, 'sine', 100, 40, 0.12, 0.5);
    } else if (w === 'fist') {
      T(o, 'sine', 110, 45, 0.12, 0.65);
      N(o, 'lowpass', 900, 200, 1, 0.1, 0.45);
    } else {
      T(o, 'sine', 130, 40, 0.14, 0.7);
      N(o, 'lowpass', 1400, 200, 1, 0.14, 0.55);
      if (w === 'metal') T(o, 'triangle', 950, 700, 0.12, 0.2);
    }
  },
  click() {
    const o = out();
    N(o, 'bandpass', 3500, 3000, 4, 0.03, 0.4);
    T(o, 'square', 900, 500, 0.03, 0.12);
  },
  swap(w) {
    this.click();
    if (w === 2) T(out(), 'sine', 200, 150, 0.06, 0.1);
  },
  ui() {
    T(out(), 'sine', 320, 420, 0.07, 0.07);
  },
  reload(w) {
    const o = out(),
      k = (d, v = 0.3) => {
        N(o, 'bandpass', 2800, 2200, 4, 0.035, v, d);
        T(o, 'square', 700, 350, 0.04, 0.1, d);
      },
      c = (d, v = 0.5) => {
        T(o, 'sine', 140, 70, 0.1, v, d);
        N(o, 'lowpass', 900, 300, 1, 0.08, 0.3, d);
      };
    if (w === 1) {
      k(0.1);
      c(0.65);
      N(o, 'highpass', 2200, 900, 0.8, 0.09, 0.45, 0.95);
      k(0.97, 0.4);
    } else if (w === 2) {
      for (let i = 0; i < 4; i++) {
        k(0.3 + i * 0.4, 0.35);
        c(0.3 + i * 0.4, 0.2);
      }
      N(o, 'highpass', 1600, 700, 0.8, 0.1, 0.5, 1.9);
      N(o, 'highpass', 1600, 900, 0.8, 0.1, 0.5, 2.1);
    } else {
      c(0.2, 0.6);
      k(0.25);
      c(1.2, 0.7);
      k(1.25);
      N(o, 'highpass', 1800, 800, 0.8, 0.07, 0.5, 1.85);
      N(o, 'highpass', 1800, 800, 0.8, 0.07, 0.5, 1.93);
    }
  },
  door(op, p) {
    const o = out(p, 30);
    if (op) {
      T(o, 'sawtooth', 150, rnd(260, 340), 0.5, 0.07);
      T(o, 'sawtooth', 160, 300, 0.45, 0.05, 0.05);
      N(o, 'lowpass', 500, 250, 1, 0.35, 0.12);
    } else {
      T(o, 'sine', 110, 45, 0.16, 0.6);
      N(o, 'lowpass', 900, 200, 1, 0.14, 0.35);
      N(o, 'bandpass', 2500, 2000, 4, 0.03, 0.3, 0.14);
    }
  },
  glass(p) {
    const o = out(p, 50);
    N(o, 'highpass', 3000, 6000, 0.5, 0.5, 0.8);
    for (let i = 0; i < 10; i++) T(o, 'sine', rnd(3000, 7500), rnd(2000, 4000), 0.14, 0.1, rnd(0, 0.5));
  },
  hurt() {
    const o = out();
    V(o, 150, 90, 0.3, 0.6, [600, 900], 0, 1);
    T(o, 'sine', 90, 40, 0.15, 0.5);
  },
  voice(p, f = 190) {
    const o = out(p, 30);
    V(o, f, f * 1.3, 0.18, 0.45, [700, 1500]);
    V(o, f * 1.25, f * 0.9, 0.28, 0.45, [600, 1200], 0.22);
  },
  scream(p) {
    const o = out(p, 50);
    V(o, 420, 760, 0.45, 0.6, [900, 2000], 0, 2);
    V(o, 760, 300, 0.6, 0.6, [1500, 700], 0.45, 3);
  }
};
function bird() {
  const o = out({x: pl.position.x + rnd(-30, 30), z: pl.position.z + rnd(-30, 30)}, 50),
    f = rnd(2200, 4200);
  if (o) o.gain.value *= AV;
  for (let i = 0, n = ri(2, 5); i < n; i++) T(o, 'sine', f * rnd(0.9, 1.1), f * rnd(1.25, 1.7), 0.08, 0.1, i * 0.14);
}
function spook() {
  const o = out({x: pl.position.x + rnd(-60, 60), z: pl.position.z + rnd(-60, 60)}, 90),
    k = ri(0, 3);
  if (o) o.gain.value *= AV;
  if (k === 0) V(o, rnd(90, 120), 50, 3, 0.7, [500, 250], 0, 1.5);
  else if (k === 1) {
    V(o, 650, 420, 0.3, 0.5, [1100, 900], 0, 3);
    V(o, 620, 400, 0.3, 0.5, [1100, 900], 0.4, 3);
  } else if (k === 2) {
    T(o, 'sawtooth', 120, 260, 1.1, 0.1);
    N(o, 'lowpass', 400, 200, 1, 0.9, 0.1);
  } else {
    T(o, 'triangle', 700, 690, 1.8, 0.25);
    N(o, 'bandpass', 1500, 900, 3, 0.3, 0.4);
  }
}
function setMusic(m) {
  musMode = m;
  const t = AC.currentTime;
  amb.dg.gain.setTargetAtTime(m === 'siege' ? 0.9 : m === 'menu' ? 0.55 : 0.4, t, 2);
  amb.lf.frequency.setTargetAtTime(m === 'siege' ? 650 : m === 'menu' ? 240 : 200, t, 2);
}
/* v092: the procedural music, one phrase at a time: plays the next notes of a mode ('menu', 'siege', 'game') and returns the
   seconds until the next phrase. Split out of audioTick so Options > Game Assets can render it to a file (Export default sounds). */
function musicNotes(mm) {
  let d = 1;
  if (mm === 'menu') {
    d = rnd(0.9, 1.8);
    const n = PK([220, 261.6, 329.6, 293.7, 246.9, 196, 220, 174.6]) * (Math.random() < 0.25 ? 2 : 1);
    T(MUS, 'triangle', n, n * 0.997, 2.6, 0.2);
    T(MUS, 'sine', n * 2.01, n * 2, 1.4, 0.05);
  } else if (mm === 'siege') {
    d = 0.75;
    T(MUS, 'sine', 75, 35, 0.2, 0.9);
    T(MUS, 'sine', 65, 30, 0.22, 0.6, 0.22);
    if (Math.random() < 0.2) {
      const n = PK([110, 116.5, 155.6]);
      T(MUS, 'sawtooth', n, n * 0.97, 1.2, 0.12, 0, 0.3);
    }
  } else {
    d = rnd(6, 15);
    const n = PK([110, 116.5, 130.8, 98, 87.3, 164.8]) * (Math.random() < 0.3 ? 2 : 1);
    T(MUS, 'sine', n, n * 0.99, 6, 0.22, 0, 0.6);
    T(MUS, 'triangle', n * 1.414, n * 1.4, 5, 0.05, 0.5, 0.8);
  }
  return d;
}
function audioTick() {
  if (!AC) return;
  const dt = 0.25,
    md = G.mode,
    on = playing(),
    night = G.time >= 20 || G.time < 5.5,
    day = G.time > 6 && G.time < 19,
    mm = md === 'TITLE' || md === 'END' ? 'menu' : md === 'SIEGE' ? 'siege' : 'game';
  if (mm !== musMode) setMusic(mm);
  aT.sil -= dt;
  aT.ss -= dt;
  if (aT.ss <= 0) {
    aT.ss = rnd(40, 90);
    aT.sil = rnd(6, 12);
  }
  amb.wind.gain.setTargetAtTime(on ? (night ? 0.2 : 0.1) * (aT.sil > 0 ? 0.1 : 1) * AV : 0, AC.currentTime, 1.5);
  aT.m -= dt;
  /* v092: a custom music track for this mode (Options > Game Assets > Custom Sounds) replaces the procedural notes */
  if (aT.m <= 0) aT.m = window.MFZSND && MFZSND.musicFor(mm) ? 1 : musicNotes(mm);
  if (!on) return;
  if (day && aT.sil <= 0 && md !== 'SIEGE' && (aT.b -= dt) <= 0) {
    aT.b = rnd(1.2, 5);
    bird();
  }
  if ((aT.x -= dt) <= 0) {
    aT.x = rnd(15, 40);
    if (aT.sil <= 0 || Math.random() < 0.3) spook();
  }
  if (md === 'FORT_BUILD' && smesh.length && (aT.v -= dt) <= 0) {
    aT.v = rnd(8, 20);
    const m = PK(smesh);
    S.voice(m.position, m.userData.s.role === 'Medic' ? 230 : 170);
  }
}
function initUI() {
  $('icoFile').onchange = e => {
    const f = [...e.target.files];
    e.target.value = '';
    if (f.length) importIcons(f);
  };
  loadSavedIcons();
  document.addEventListener('pointerdown', initAudio);
  document.addEventListener('keydown', initAudio);
  document.addEventListener('keydown', titleAny);
  $('title').addEventListener('pointerdown', titleAny);
  const pct = (c, v) => document.querySelectorAll(c).forEach(x => (x.textContent = Math.round(v * 100) + '%'));
  const bind = (sel, get, set) =>
    document.querySelectorAll(sel).forEach(
      e =>
        (e.oninput = () => {
          set(e.value / 100);
          document.querySelectorAll(sel).forEach(x => (x.value = e.value));
          saveSet();
        })
    );
  bind(
    '.mastervol',
    () => MSV,
    v => {
      MSV = v;
      if (MASTER) MASTER.gain.setTargetAtTime(v, AC.currentTime, 0.05);
      pct('.vm', v);
    }
  );
  bind(
    '.mvol',
    () => MV,
    v => {
      MV = v;
      if (MUS) MUS.gain.setTargetAtTime(v, AC.currentTime, 0.05);
      pct('.vmu', v);
    }
  );
  bind(
    '.avol',
    () => AV,
    v => {
      AV = v;
      pct('.va', v);
    }
  );
  try {
    const o = JSON.parse(localStorage.getItem('gf_set') || 'null');
    if (o) {
      MSV = o.ms ?? 1;
      MV = o.mv ?? 0.6;
      AV = o.av ?? 1;
      if (o.sens) {
        G.sens = o.sens;
        document.querySelectorAll('.sens').forEach(x => (x.value = o.sens));
      }
      if (o.fov) {
        camera.fov = G.fov = o.fov;
        camera.updateProjectionMatrix();
        document.querySelectorAll('.fov').forEach(x => (x.value = o.fov));
        document.querySelectorAll('.fovv').forEach(x => (x.textContent = o.fov + '\u00b0'));
      }
      if (o.q !== undefined) setQuality(o.q);
    }
  } catch (e) {}
  document.querySelectorAll('.mastervol').forEach(x => (x.value = MSV * 100));
  document.querySelectorAll('.mvol').forEach(x => (x.value = MV * 100));
  document.querySelectorAll('.avol').forEach(x => (x.value = AV * 100));
  pct('.vm', MSV);
  pct('.vmu', MV);
  pct('.va', AV);
  document
    .querySelectorAll('.qb')
    .forEach(b => b.classList.toggle('on', +b.dataset.q === (G.q === undefined ? 2 : G.q)));
  setInterval(() => {
    const w = stuckLeft();
    document.querySelectorAll('.stuckBtn').forEach(b => {
      b.textContent = w > 0 ? "I'm Stuck (" + w + 's)' : "I'm Stuck";
      b.style.opacity = w > 0 ? 0.5 : 1;
    });
  }, 500);
  document.addEventListener('mouseover', e => {
    hov = (e.target.closest && e.target.closest('.item,.lootItem')) || null;
    tipUpdate(e);
  });
  document.addEventListener('mousemove', e => {
    if (e.clientX || e.clientY) {
      lastMouse.x = e.clientX;
      lastMouse.y = e.clientY;
    }
    if (tipEl.style.display === 'block') tipMove(e);
  });
  document.addEventListener('mousedown', e => {
    if (e.clientX || e.clientY) {
      lastMouse.x = e.clientX;
      lastMouse.y = e.clientY;
    }
  });
  setInterval(audioTick, 250);
}
const lastMouse = {x: innerWidth / 2, y: innerHeight / 2},
  tipEl = document.createElement('div');
tipEl.id = 'tt';
document.body.appendChild(tipEl);
function tipUpdate(e) {
  const it = e.target.closest && e.target.closest('.item');
  if (it && it.dataset.tip && !invDragging) {
    tipEl.innerHTML = it.dataset.tip;
    tipEl.style.display = 'block';
    tipMove(e);
  } else tipEl.style.display = 'none';
}
function tipMove(e) {
  const w = tipEl.offsetWidth,
    h = tipEl.offsetHeight;
  let x = e.clientX + 16,
    y = e.clientY + 18;
  if (x + w > innerWidth - 4) x = e.clientX - w - 12;
  if (y + h > innerHeight - 4) y = e.clientY - h - 12;
  tipEl.style.left = Math.max(2, x) + 'px';
  tipEl.style.top = Math.max(2, y) + 'px';
}
// E over ammo in inventory/container loads it into the guns
function hovUse() {
  if (!hov || !invOpen || !hov.isConnected || hov.dataset.uid === undefined) return false;
  const kind = hov.dataset.kind,
    inv = kind === 'cont' ? currentContainer && currentContainer.inv : PINV;
  if (!inv) return false;
  const inst = inv.items.find(q => q.uid == hov.dataset.uid);
  if (!inst) return false;
  const it = ITEMS[inst.id];
  if (it.cat === 'ammo') {
    const w = G.eq,
      wd = w && WDEF[w.id];
    if (!wd || wd.type !== 'gun') {
      toast('Equip a gun first (TAB) - hover ammo + E loads the equipped gun');
      return true;
    }
    if (wd.ammo !== inst.id) {
      toast(ITEMS[w.id].name + ' uses ' + ITEMS[wd.ammo].name + ' ammo');
      return true;
    }
    const room = wd.cap - w.clip;
    if (room <= 0) {
      toast(ITEMS[w.id].name + ' is already full');
      return true;
    }
    const n = Math.min(room, inst.rem);
    inst.rem -= n;
    w.clip += n;
    if (inst.rem <= 0) invRemove(inv, inst);
    S.click();
    toast('Loaded +' + n + ' (' + w.clip + '/' + wd.cap + ')');
    hov = null;
    renderInv();
    return true;
  }
  if (WDEF[inst.id] && WDEF[inst.id].type === 'gun') {
    const n = unloadGun(inv, inst);
    if (n > 0) {
      S.click();
      toast('Unloaded ' + n + ' rounds');
      hov = null;
      renderInv();
    } else toast(n < 0 ? 'No room in the inventory to unload' : 'Nothing to unload');
    return true;
  }
  if (it.use && it.cat === 'meds') {
    const sv = kind === 'cont' && currentContainer.comp ? currentContainer.sv : null,
      cur = sv ? sv.hp : G.hp,
      max = sv ? 100 : G.maxHp;
    if (cur >= max) {
      toast(sv ? sv.name + ' is already at full health' : 'You are already at full health');
      return true;
    }
    const cost = Math.min(inst.rem, it.use.cost),
      gain = Math.max(1, Math.round(((it.use.hp * cost) / it.use.cost) * skHealMult(G)));
    trainSk(G, 'first_aid');
    if (sv) sv.hp = Math.min(100, sv.hp + gain);
    else G.hp = Math.min(G.maxHp, G.hp + gain);
    const got = Math.min(gain, Math.round(max - cur));
    inst.rem -= cost;
    if (inst.rem <= 0) invRemove(inv, inst);
    S.click();
    toast(sv ? sv.name + ' healed +' + got + ' HP' : 'Used ' + it.name + ' (+' + got + ' HP)');
    hov = null;
    renderInv();
    return true;
  }
  return false;
}
