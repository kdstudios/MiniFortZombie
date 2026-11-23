/* ==========================================================================================================
   MINI FORT ZOMBIE - WATER (v091): one water shader for pools, ponds, fountains, streams and rain puddles.
   Ported from Riposte: Frontline 5.6.0 (MIT, (c) 2026 BenDBSS): src/02m-water.js ("petites eaux": pondAdd) and
   src/02mb-ondes.js (the ripple field), plus the "ripple" surface of its texture lab. Its licence text is kept in
   docs/licenses/RIPOSTE_FRONTLINE_LICENSE.txt. What was changed for MFZ is listed in docs/CHANGES_v091.md (sky reflection from the weather layer, raw MFZ colours, rain rings, growing rain puddles).

   How the water is drawn (one MeshStandardMaterial program, patched in onBeforeCompile; every number is a uniform):
   - Depth: each vertex carries its distance to the bank (aRim). The bed is `bed` m under the surface and the banks slope
     down at `slope` from the edge, so the water is thin at the rim and deep in the middle.
   - Transparency: Beer-Lambert along the refracted view ray. The water body turns opaque over `vis` m and goes from the
     `shallow` to the `deep` colour, so the real floor (pool tiles, lawn, asphalt) shows where the water is thin.
   - Fresnel + premultiplied alpha: looking down you see the floor, at a glancing angle you see the sky. The sky comes from
     the atmosphere layer's current colours, so it follows the weather and the time of day.
   - Caustics: the sun's light net on the floor, read at the point the refracted ray lands, two scrolling layers; it is
     shadowed like the rest of the sun's light.
   - Ripples: three scrolling normal layers, jet rings (fountains), rain rings (weather), and the ripple field below.
   The ripple field: a 32 m window (256 x 256 cells) round the camera that runs the wave equation on the GPU. Footsteps,
   bullets and fountain jets press dents into it; rings travel, cross and bounce off the banks (a mask of where the water
   is). It sleeps 6 s after the last dent, so still water costs nothing.
   Rain puddles: fixed spots on a 7 m grid (the same for every player), tested once with five rays (open sky above, flat
   ground). A wetness value rises while it rains and falls afterwards; each puddle grows from its middle and dries back.

   API (lot code: local coordinates and a parent group; everything else: world coordinates):
     MFZWATER.add({kind, parent, shape, x, y, z, rot, ...}) -> record. shape: 'disc' (r), 'rect' (w, d), 'poly' (poly: [[x, z], ...]),
       'blob' (w, d, seed). y is the water surface. kind is a key of MFZWATER.kinds; any of its values can be overridden:
       bed, slope, vis, murk, alpha, deep, shallow, scatter, caus, calm, shore, jet, jc, flow, refl, f0, sink, sinkSlope.
       v093 depth: `bed` is how deep the water LOOKS. `sink` is how deep it IS for walkers: the world's ground cannot go below
       y = 0, so the player's eye (G.wade, read by the core) and the zombies' bodies are lowered by up to `sink` m while they are
       in it, growing from the bank at `sinkSlope` m per m (99 = a pool: full depth at the wall).
     MFZWATER.puddle(parent, x, z, w, d, rot, seed, y) -> a standing puddle (always there, whatever the weather).
     MFZWATER.at(x, z, y) -> the water record under a point (y optional: feet height), or null.
     MFZWATER.splash(p, big), MFZWATER.ripple(x, z, r, amp, foam), MFZWATER.remove(record).
   Nothing here collides, blocks bullets or changes gameplay. Settings: Graphics > Water, Rain puddles (RGFX.s.water / puddles).
   ========================================================================================================== */
(function () {
  'use strict';
  const T = THREE,
    V2 = T.Vector2,
    V3 = T.Vector3,
    V4 = T.Vector4,
    TAU = Math.PI * 2;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x)),
    lerp = (a, b, t) => a + (b - a) * t,
    sstep = (a, b, x) => {
      const t = clamp((x - a) / (b - a), 0, 1);
      return t * t * (3 - 2 * t);
    };
  const WA = (window.MFZWATER = {list: [], on: true, wet: 0, stats: {}, err: 0});
  const FXS = () => (window.RGFX && RGFX.s) || {water: 1, puddles: 1};
  const warn = (tag, e) => {
    if (WA.err++ < 4) console.warn('[water] ' + tag, e);
  };

  /* ------------------------------------------ kinds (the registry: add a look here) ------------------------------------------
     Colours are MFZ's raw display colours (the renderer applies no gamma), not Riposte's linear ones. */
  WA.kinds = {
    pool: {
      sinkSlope: 99,
      sink: 0.9,
      bed: 1.3,
      slope: 6,
      vis: 2.2,
      calm: 0.5,
      caus: 1,
      refl: 0.9,
      deep: [0.05, 0.3, 0.42],
      shallow: [0.3, 0.62, 0.68],
      scatter: [0.05, 0.22, 0.26]
    },
    green: {
      sinkSlope: 99,
      sink: 0.8,
      bed: 1.1,
      slope: 6,
      vis: 0.45,
      murk: 0.3,
      calm: 0.3,
      caus: 0.25,
      refl: 0.85,
      deep: [0.05, 0.12, 0.05],
      shallow: [0.2, 0.3, 0.12],
      scatter: [0.04, 0.1, 0.03]
    },
    pond: {
      sinkSlope: 0.5,
      sink: 0.9,
      bed: 1.0,
      slope: 0.5,
      vis: 0.6,
      calm: 0.6,
      caus: 0.7,
      refl: 0.9,
      deep: [0.04, 0.12, 0.11],
      shallow: [0.16, 0.27, 0.2],
      scatter: [0.04, 0.12, 0.1]
    },
    fountain: {
      bed: 0.5,
      slope: 4,
      vis: 0.7,
      calm: 0.8,
      caus: 1,
      refl: 0.85,
      jet: 0.6,
      deep: [0.06, 0.2, 0.2],
      shallow: [0.22, 0.4, 0.38],
      scatter: [0.05, 0.16, 0.15]
    },
    stream: {
      sinkSlope: 0.6,
      sink: 0.4,
      bed: 0.6,
      slope: 1.5,
      vis: 0.22,
      murk: 0.2,
      alpha: 0.9,
      calm: 1,
      caus: 0.5,
      refl: 0.9,
      f0: 1.6,
      shore: 0.5,
      deep: [0.08, 0.17, 0.14],
      shallow: [0.2, 0.3, 0.24],
      scatter: [0.05, 0.14, 0.11]
    },
    puddle: {
      sinkSlope: 0.4,
      sink: 0.05,
      bed: 0.07,
      slope: 4,
      vis: 0.2,
      murk: 0.62,
      alpha: 0.92,
      calm: 0.2,
      caus: 0,
      refl: 1,
      f0: 2.6,
      deep: [0.03, 0.035, 0.04],
      shallow: [0.05, 0.06, 0.065],
      scatter: [0.03, 0.05, 0.05]
    },
    stagnant: {
      sinkSlope: 0.4,
      sink: 0.08,
      bed: 0.12,
      slope: 3,
      vis: 0.12,
      murk: 0.55,
      alpha: 0.92,
      calm: 0.15,
      caus: 0,
      refl: 0.8,
      f0: 2.5,
      deep: [0.07, 0.09, 0.04],
      shallow: [0.16, 0.18, 0.09],
      scatter: [0.03, 0.05, 0.02]
    }
  };

  /* ------------------------------------------ shared uniforms ------------------------------------------ */
  const SH = {
    uWT: {value: 0},
    uWRain: {value: 0},
    uWQ: {value: 1},
    tWRip: {value: null},
    tWPat: {value: null},
    tRip: {value: null},
    uRipB: {value: new V4(-1e5, -1e5, 1 / 32, 1 / 256)},
    uRipG: {value: 6.5},
    uSkyZ: {value: new T.Color(0x3a78c4)},
    uSkyM: {value: new T.Color(0x7098c8)},
    uSkyH: {value: new T.Color(0xb8d0e4)}
  };

  /* ------------------------------------------ GLSL ------------------------------------------ */
  /* slope of the ripple field (in normal units), height, foam and curvature at a world (x, z) */
  const RIP_GLSL = `
uniform sampler2D tRip; uniform vec4 uRipB; uniform float uRipG;
void ripple(vec2 xz, out vec2 slope, out float foam, out float height, out float lap) {
  vec2 uv = (xz - uRipB.xy) * uRipB.z;
  float edge = min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y));
  slope = vec2(0.0); foam = 0.0; height = 0.0; lap = 0.0;
  if (edge < 0.0) return;
  float k = smoothstep(0.0, 0.07, edge);
  vec4 c = texture2D(tRip, uv);
  float hl = texture2D(tRip, uv - vec2(uRipB.w, 0.0)).r, hr = texture2D(tRip, uv + vec2(uRipB.w, 0.0)).r;
  float hd = texture2D(tRip, uv - vec2(0.0, uRipB.w)).r, hu = texture2D(tRip, uv + vec2(0.0, uRipB.w)).r;
  float texel = uRipB.w / uRipB.z;
  slope = vec2(hl - hr, hd - hu) / (2.0 * texel) * k;
  height = c.r * k; lap = (hl + hr + hd + hu - 4.0 * c.r) / (texel * texel) * k;
  foam = clamp(max(c.b, max(smoothstep(0.04, 0.16, length(slope)) * 0.6, smoothstep(0.012, 0.05, c.r) * 0.5)), 0.0, 1.0) * k;
}`;
  const VERT_HEAD = `#include <common>
attribute float aRim; varying float vRim; varying vec3 vPw;`;
  const FRAG_HEAD =
    `#include <common>
uniform float uWT, uWRain, uWQ, uPRing, uPFoam, uPAlpha, uPBed, uPSlope, uPVis, uPMurk, uPCaus, uPCalm, uPRefl, uPF0;
uniform vec2 uPC, uPFlow; uniform vec3 uPDeep, uPShal, uPScat, uPFill, uSkyZ, uSkyM, uSkyH;
uniform sampler2D tWRip, tWPat;
varying float vRim; varying vec3 vPw; vec3 pdN, pdUp, pdCL; float pdFoam, pdA, pdF, pdK, pdRim;
float wH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
/* rain rings: one drop per cell and per layer, a ring that widens and fades (slope of the surface) */
vec2 wRain(vec2 p, float t) {
  vec2 s = vec2(0.0);
  for (int k = 0; k < 2; k++) {
    float fk = float(k); vec2 q = p * (k == 0 ? 3.1 : 4.7) + fk * 17.3, i = floor(q), f = fract(q) - 0.5;
    float h = wH(i + fk * 7.0), ph = fract(t * (0.9 + h * 0.6) + h * 13.0);
    vec2 d = f - (vec2(wH(i + 3.1), wH(i + 9.7)) - 0.5) * 0.5; float r = length(d), rad = ph * 0.42;
    s += d / max(r, 1e-3) * sin((r - rad) * 40.0) * smoothstep(0.07, 0.0, abs(r - rad)) * (1.0 - ph);
  }
  return s;
}
/* the sky the atmosphere layer is showing (zenith, mid, horizon) */
vec3 wSky(vec3 R) {
  float h = clamp(R.y, 0.0, 1.0); vec3 c = mix(uSkyH, uSkyM, smoothstep(0.0, 0.22, h));
  return mix(c, uSkyZ, smoothstep(0.12, 0.85, h));
}` + RIP_GLSL;
  /* colour, normal, opacity (replaces color_fragment) */
  const COLOR = `{
  pdRim = (vRim - (1.0 - uPFill.x) * uPFill.y) * uPFill.z; // a rain puddle grows from its middle (uPFill.x: 0 dry, 1 full)
  if (pdRim <= 0.0) discard;
  vec2 p = vPw.xz - uPFlow * uWT, t = vec2(uWT);
  vec3 r1 = texture2D(tWRip, p * 0.9 + t * vec2(0.03, 0.012)).xyz * 2.0 - 1.0;
  vec3 r2 = texture2D(tWRip, p.yx * 1.7 + t * vec2(-0.045, 0.05)).xyz * 2.0 - 1.0;
  vec3 r3 = texture2D(tWRip, p * 0.35 + t * vec2(0.01, -0.007)).xyz * 2.0 - 1.0;
  vec2 sl = (r1.xy / max(r1.z, 0.25) * 0.42 + r2.yx / max(r2.z, 0.25) * 0.3 + r3.xy / max(r3.z, 0.25) * 0.4) * uPCalm;
  vec2 dv = vPw.xz - uPC; float rr = length(dv);
  float ring = uPRing * cos(rr * 15.0 - uWT * 3.4) * exp(-rr * 1.4) / (1.0 + rr * 2.0);
  sl += dv / max(rr, 1e-3) * ring * 0.8;
  vec2 rps; float rpf, rph, rpl; ripple(vPw.xz, rps, rpf, rph, rpl);
  if (uWRain > 0.01) sl += wRain(vPw.xz, uWT) * uWRain * 0.9;
  pdN = normalize(vec3(sl.x * 0.5 + rps.x * uRipG, 1.0, sl.y * 0.5 + rps.y * uRipG));
  float pat = texture2D(tWPat, p * 0.8 + t * vec2(0.008, 0.002)).a, pat2 = texture2D(tWPat, p * 0.3 - t * vec2(0.003, 0.005)).a;
  float shore = (1.0 - smoothstep(0.0, 0.05 + pat2 * 0.09, pdRim)) * uPFoam;
  pdFoam = clamp(max(shore * (pat * 1.5 - 0.1), rpf * 0.16 * (0.5 + pat)), 0.0, 0.3); // inland water has no white foam: it only lightens where it is churned
  // depth under this point, refracted ray (air to water), path through the water
  vec3 V = normalize(cameraPosition - vPw), Tr = refract(-V, pdN, 0.75);
  float dep = min(uPBed, pdRim * uPSlope), cosT = max(-Tr.y, 0.3), L = dep / cosT;
  // opacity of the water body: Beer-Lambert over uPVis m, a floor for murky water, a ceiling, zero right at the bank
  pdA = clamp(max(1.0 - exp(-L / uPVis), uPMurk) * uPAlpha, 0.0, 1.0) * smoothstep(0.0, 0.03, pdRim);
  pdF = 0.03 * uPF0; pdF += (1.0 - pdF) * pow(1.0 - clamp(dot(V, pdN), 0.0, 1.0), 5.0); // uPF0: a thin film on dark ground mirrors more head-on
  // caustics where the refracted ray meets the bed: two scrolling reads of the net, tightened by the ripple field's curvature
  vec2 bp = vPw.xz + Tr.xz / cosT * dep - uPFlow * uWT * 0.6;
  float c1 = texture2D(tWPat, bp * 0.47 + t * vec2(0.019, 0.011)).r, c2 = texture2D(tWPat, bp.yx * 0.39 - t * vec2(0.014, 0.022) + 0.37).r;
  float cn = (c1 + c2) * 0.5;
  pdK = cn * cn * 2.2 * clamp(1.0 - rpl * dep * 0.25, 0.5, 2.0) * uPCaus * uWQ * smoothstep(0.0, 0.06, dep) * exp(-dep * 1.6 - dep / uPVis);
  pdCL = vec3(0.0); pdUp = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
  vec3 body = mix(uPShal, uPDeep, pdA) * (0.9 + pat2 * 0.2);
  diffuseColor.rgb = mix(body, body * 1.5 + vec3(0.04, 0.05, 0.05), pdFoam * 2.0);
}`;
  /* back-lit glow through the water, and the light that reaches the bed (for the caustics): both follow the shadows */
  const DIRECT = `#include <lights_physical_pars_fragment>
void RE_Direct_Water( const in IncidentLight directLight, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
  RE_Direct_Physical( directLight, geometry, material, reflectedLight );
  float back = saturate( dot( geometry.viewDir, - directLight.direction ) );
  reflectedLight.directDiffuse += directLight.color * uPScat * ( pow( back, 4.0 ) * 0.5 + 0.05 ) * ( 1.0 - pdFoam );
  pdCL += directLight.color * saturate( dot( directLight.direction, pdUp ) );
}
#undef RE_Direct
#define RE_Direct RE_Direct_Water`;
  const REFL = `#if defined( RE_IndirectSpecular )
{
  vec3 V = normalize(cameraPosition - vPw), R = reflect(-V, pdN); R.y = max(R.y, 0.015);
  radiance += wSky(normalize(R)) * uPRefl * mix(uPF0, 1.0, pow(1.0 - clamp(dot(V, pdN), 0.0, 1.0), 5.0));
}
#endif`;
  /* premultiplied alpha: the bed shows for (1 - Fresnel) x (1 - opacity); the body, the caustics and the reflection go on top.
     The sun's mirror glint is capped: MFZ has no tone mapping, so an uncapped glint turned the bloom pass into a white blob. */
  const OUT = `float pdO = max(pdA, pdFoam * 1.2), pdT = (1.0 - pdF) * (1.0 - pdO);
vec3 pdSpec = min(reflectedLight.directSpecular, vec3(1.6)) + reflectedLight.indirectSpecular;
gl_FragColor = vec4((totalDiffuse * pdO + pdCL * pdK * 0.2 * (1.0 - pdO)) * (1.0 - pdF) + pdSpec + totalEmissiveRadiance, 1.0 - pdT);
gl_FragColor *= smoothstep(0.0, 0.04, pdRim); // the mirror fades out with the body at the bank (a thin film left a bright outline)`;
  const FOG = `#ifdef USE_FOG
#ifdef FOG_EXP2
float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
#else
float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
#endif
gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor * gl_FragColor.a, fogFactor );
#endif`;
  /* one function for every water material, so three keeps ONE program (its cache key is this function's text) */
  function patch(s) {
    Object.assign(s.uniforms, this.userData.U, SH);
    s.vertexShader = s.vertexShader
      .replace('#include <common>', VERT_HEAD)
      .replace(
        '#include <project_vertex>',
        '#include <project_vertex>\nvRim = aRim; vPw = (modelMatrix * vec4(transformed, 1.0)).xyz;'
      );
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', FRAG_HEAD)
      .replace('#include <color_fragment>', COLOR)
      .replace('#include <roughnessmap_fragment>', 'float roughnessFactor = mix(0.035, 0.7, pdFoam);')
      .replace('#include <normal_fragment_maps>', 'normal = normalize((viewMatrix * vec4(pdN, 0.0)).xyz);')
      .replace('#include <lights_physical_pars_fragment>', DIRECT)
      .replace('#include <lights_fragment_maps>', REFL)
      .replace('#include <output_fragment>', OUT)
      .replace('#include <fog_fragment>', FOG);
  }

  /* ------------------------------------------ geometry ------------------------------------------ */
  function rngOf(seed) {
    let s = (seed | 0) % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  }
  function inPoly(Q, x, z) {
    let n = false;
    for (let a = 0, b = Q.length - 1; a < Q.length; b = a++)
      if (Q[a][1] > z !== Q[b][1] > z && x < ((Q[b][0] - Q[a][0]) * (z - Q[a][1])) / (Q[b][1] - Q[a][1]) + Q[a][0])
        n = !n;
    return n;
  }
  /* nearest point of a polygon's outline: [x, z, distance] */
  function polyNearest(Q, x, z) {
    let bx = x,
      bz = z,
      bd = 1e9;
    for (let a = 0, b = Q.length - 1; a < Q.length; b = a++) {
      const ex = Q[a][0] - Q[b][0],
        ez = Q[a][1] - Q[b][1],
        l2 = ex * ex + ez * ez || 1e-9,
        t = clamp(((x - Q[b][0]) * ex + (z - Q[b][1]) * ez) / l2, 0, 1),
        px = Q[b][0] + ex * t,
        pz = Q[b][1] + ez * t,
        d = Math.hypot(x - px, z - pz);
      if (d < bd) {
        bd = d;
        bx = px;
        bz = pz;
      }
    }
    return [bx, bz, bd];
  }
  const polyDist = (Q, x, z) => polyNearest(Q, x, z)[2] * (inPoly(Q, x, z) ? 1 : -1);
  /* flat mesh round (0, 0, 0), the distance to the bank (m) in aRim */
  function geometry(o) {
    const P = [],
      I = [],
      E = [];
    const rings = o.rings || 6,
      seg = o.seg || 24;
    if (o.shape === 'rect') {
      const nx = o.n || 8,
        nz = Math.max(2, Math.round((nx * o.d) / o.w));
      for (let j = 0; j <= nz; j++)
        for (let i = 0; i <= nx; i++) {
          const x = (i / nx - 0.5) * o.w,
            z = (j / nz - 0.5) * o.d;
          P.push(x, 0, z);
          E.push(Math.max(0, Math.min(o.w / 2 - Math.abs(x), o.d / 2 - Math.abs(z))));
        }
      for (let j = 0; j < nz; j++)
        for (let i = 0; i < nx; i++) {
          const a = j * (nx + 1) + i,
            b = a + 1,
            c = a + nx + 1,
            d = c + 1;
          I.push(a, c, b, b, c, d);
        }
    } else if (o.shape === 'poly') {
      // free outline: a regular grid whose outside vertices are pulled onto the outline
      const Q = o.poly,
        st = o.cell || 0.5;
      let x0 = 1e9,
        x1 = -1e9,
        z0 = 1e9,
        z1 = -1e9;
      for (const [x, z] of Q) {
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        z0 = Math.min(z0, z);
        z1 = Math.max(z1, z);
      }
      const nx = Math.ceil((x1 - x0) / st) + 1,
        nz = Math.ceil((z1 - z0) / st) + 1,
        sd = new Float32Array(nx * nz),
        idx = new Int32Array(nx * nz).fill(-1);
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) sd[j * nx + i] = polyDist(Q, x0 + i * st, z0 + j * st);
      const vert = (i, j) => {
        const k = j * nx + i;
        if (idx[k] >= 0) return idx[k];
        let x = x0 + i * st,
          z = z0 + j * st,
          d = sd[k];
        if (d < 0) {
          const q = polyNearest(Q, x, z);
          x = q[0];
          z = q[1];
          d = 0;
        }
        P.push(x, 0, z);
        E.push(d);
        return (idx[k] = P.length / 3 - 1);
      };
      for (let j = 0; j < nz - 1; j++)
        for (let i = 0; i < nx - 1; i++) {
          if (Math.max(sd[j * nx + i], sd[j * nx + i + 1], sd[(j + 1) * nx + i], sd[(j + 1) * nx + i + 1]) <= 0)
            continue;
          const a = vert(i, j),
            b = vert(i + 1, j),
            c = vert(i, j + 1),
            d = vert(i + 1, j + 1);
          I.push(a, c, b, b, c, d);
        }
    } else {
      const blob = o.shape === 'blob',
        R = rngOf((o.seed || 1) * 31 + 7),
        ph = [R() * TAU, R() * TAU, R() * TAU];
      const rx = blob ? o.w / 2 : o.r,
        rz = blob ? o.d / 2 : o.r,
        rmin = Math.min(rx, rz) * (blob ? 0.8 : 1);
      P.push(0, 0, 0);
      E.push(rmin);
      for (let k = 1; k <= rings; k++) {
        const f = k / rings;
        for (let i = 0; i < seg; i++) {
          const a = (i / seg) * TAU,
            wob = blob
              ? 1 + 0.16 * Math.sin(3 * a + ph[0]) + 0.1 * Math.sin(5 * a + ph[1]) + 0.05 * Math.sin(7 * a + ph[2])
              : 1;
          P.push(Math.cos(a) * rx * f * wob, 0, Math.sin(a) * rz * f * wob);
          E.push((1 - f) * rmin);
        }
      }
      for (let i = 0; i < seg; i++) I.push(0, 1 + ((i + 1) % seg), 1 + i);
      for (let k = 1; k < rings; k++)
        for (let i = 0; i < seg; i++) {
          const a = 1 + (k - 1) * seg + i,
            b = 1 + (k - 1) * seg + ((i + 1) % seg),
            c = 1 + k * seg + i,
            d = 1 + k * seg + ((i + 1) % seg);
          I.push(a, b, c, b, d, c);
        }
    }
    const g = new T.BufferGeometry(),
      N = new Float32Array(P.length);
    for (let i = 1; i < N.length; i += 3) N[i] = 1;
    g.setAttribute('position', new T.Float32BufferAttribute(P, 3));
    g.setAttribute('normal', new T.BufferAttribute(N, 3));
    g.setAttribute('aRim', new T.Float32BufferAttribute(E, 1));
    g.setIndex(I);
    g.computeBoundingSphere();
    g.computeBoundingBox();
    return g;
  }
  WA.geometry = geometry;

  /* ------------------------------------------ adding water ------------------------------------------ */
  const NORAY = function () {}; // rays (bullets, the use prompt, zombie sight) go straight through the surface
  function material(o, U) {
    const m = new T.MeshStandardMaterial({color: 0xffffff, roughness: 0.05, metalness: 0});
    m.userData.U = U;
    m.onBeforeCompile = patch;
    Object.assign(m, {
      transparent: true,
      depthWrite: false,
      blending: T.CustomBlending,
      blendEquation: T.AddEquation,
      blendSrc: T.OneFactor,
      blendDst: T.OneMinusSrcAlphaFactor
    });
    if (o.shape === 'blob') {
      m.polygonOffset = true;
      m.polygonOffsetFactor = -2;
      m.polygonOffsetUnits = -2;
    }
    return m;
  }
  function uniformsOf(o) {
    const puddle = o.shape === 'blob',
      v3 = (a, d) => new V3(...(a || d));
    return {
      uPRing: {value: o.jet || 0},
      uPFoam: {value: o.shore || 0},
      uPAlpha: {value: o.alpha || 1},
      uPBed: {value: o.bed !== undefined ? o.bed : puddle ? 0.07 : 0.5},
      uPSlope: {value: o.slope || 4},
      uPVis: {value: o.vis || (puddle ? 0.2 : 0.7)},
      uPMurk: {value: o.murk !== undefined ? o.murk : puddle ? 0.35 : 0},
      uPCaus: {value: o.caus !== undefined ? o.caus : puddle ? 0 : 1},
      uPCalm: {value: o.calm !== undefined ? o.calm : puddle ? 0.2 : 1},
      uPRefl: {value: o.refl !== undefined ? o.refl : 0.9},
      uPF0: {value: o.f0 || 1},
      uPC: {value: new V2()},
      uPFlow: {value: new V2()},
      uPDeep: {value: v3(o.deep, [0.05, 0.16, 0.18])},
      uPShal: {value: v3(o.shallow, [0.2, 0.36, 0.36])},
      uPScat: {value: v3(o.scatter, [0.05, 0.15, 0.14])},
      uPFill: {value: new V3(1, 0, 1)}
    };
  }
  WA.add = function (opt) {
    const o = Object.assign({shape: 'disc', x: 0, y: 0, z: 0}, WA.kinds[opt.kind] || {}, opt);
    if (o.shape === 'poly') {
      // the mesh is local round the middle of the outline's box
      let x0 = 1e9,
        x1 = -1e9,
        z0 = 1e9,
        z1 = -1e9;
      for (const [x, z] of o.poly) {
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        z0 = Math.min(z0, z);
        z1 = Math.max(z1, z);
      }
      const cx = (x0 + x1) / 2,
        cz = (z0 + z1) / 2;
      o.poly = o.poly.map(([x, z]) => [x - cx, z - cz]);
      o.x += cx;
      o.z += cz;
    }
    const U = uniformsOf(o),
      mesh = new T.Mesh(o.geo || geometry(o), material(o, U));
    mesh.name = 'water:' + (o.kind || o.shape);
    mesh.userData.kind = 'water';
    mesh.userData.thru = true;
    mesh.raycast = NORAY;
    mesh.position.set(o.x, o.y, o.z);
    mesh.rotation.y = o.rot || 0;
    if (o.scale) mesh.scale.set(o.scale[0], 1, o.scale[1]);
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    mesh.renderOrder = -1; // before the other see-through things (glass, fire, tracers), which then draw over the water
    const par = o.parent || (typeof scene !== 'undefined' && scene) || null;
    if (par) par.add(mesh);
    const w = {
      mesh,
      U,
      o,
      ready: false,
      y: o.y,
      inv: new T.Matrix4(),
      bb: [0, 0, 0, 0],
      jets: null,
      mask: null,
      on: true
    };
    WA.list.push(w);
    WA.stats.waters = WA.list.length;
    return w;
  };
  WA.puddle = (parent, x, z, w, d, rot, seed, y) =>
    WA.add({
      kind: 'puddle',
      shape: 'blob',
      parent,
      x,
      y: y === undefined ? 0.022 : y,
      z,
      w,
      d,
      rot,
      seed,
      seg: 20,
      rings: 4
    });
  WA.remove = function (w) {
    const i = WA.list.indexOf(w);
    if (i >= 0) WA.list.splice(i, 1);
    if (w && w.mesh && w.mesh.parent) w.mesh.parent.remove(w.mesh);
    if (w && w.mask && w.mask.parent) w.mask.parent.remove(w.mask);
    RIP.maskDirty = true;
  };
  /* world placement of a water: done once the world is built (lot groups are in place), and again when a rain puddle moves */
  const _m4 = new T.Matrix4(),
    _a = new V3(),
    _q = new T.Quaternion(),
    _s = new V3(),
    _e = new T.Euler();
  function place(w) {
    const m = w.mesh,
      o = w.o;
    m.updateMatrix();
    m.matrixWorld.copy(m.matrix);
    m.matrixAutoUpdate = false;
    w.inv.copy(m.matrix).invert();
    const b = m.geometry.boundingBox;
    let x0 = 1e9,
      x1 = -1e9,
      z0 = 1e9,
      z1 = -1e9;
    for (const cx of [b.min.x, b.max.x])
      for (const cz of [b.min.z, b.max.z]) {
        _a.set(cx, 0, cz).applyMatrix4(m.matrix);
        x0 = Math.min(x0, _a.x);
        x1 = Math.max(x1, _a.x);
        z0 = Math.min(z0, _a.z);
        z1 = Math.max(z1, _a.z);
      }
    w.bb = [x0, z0, x1, z1];
    w.y = m.matrix.elements[13];
    const ry = _e.setFromRotationMatrix(_m4.extractRotation(m.matrix), 'YXZ').y,
      c = Math.cos(ry),
      s = Math.sin(ry);
    // jet centre and current, turned with the lot
    const jc = o.jc || [0, 0];
    _a.set(jc[0], 0, jc[1]).applyMatrix4(m.matrix);
    w.U.uPC.value.set(_a.x, _a.z);
    const fl = o.flow || [0, 0];
    w.U.uPFlow.value.set(fl[0] * c + fl[1] * s, -fl[0] * s + fl[1] * c);
    w.jet =
      o.jet > 0
        ? {x: _a.x, z: _a.z, r: 0.26 + 0.1 * o.jet, amp: -0.034 * o.jet, every: 0.24, foam: 0.3, t: Math.random()}
        : null;
    if (w.mask) {
      w.mask.matrix.copy(m.matrix);
      w.mask.matrixWorld.copy(m.matrix);
    }
    RIP.maskDirty = true;
    w.fp = null;
    w.ready = true;
  }
  function finalize(w) {
    const m = w.mesh;
    if (typeof scene === 'undefined' || !scene) return;
    let top = m;
    while (top.parent) top = top.parent;
    if (top !== scene) return; // its lot is not in the world (yet)
    m.updateWorldMatrix(true, false);
    if (m.parent !== scene) {
      // out of the lot group, into the world: the perf pass may merge or drop the group, and a water must stay its own mesh
      _m4.copy(m.matrixWorld);
      m.parent.remove(m);
      scene.add(m);
      _m4.decompose(m.position, _q, _s);
      m.quaternion.copy(_q);
      m.scale.copy(_s);
    }
    place(w);
  }
  function finalizeAll() {
    for (const w of WA.list) if (!w.ready) finalize(w);
  }
  /* is (x, z) over this water? (in its own shape, whatever the lot's turn) */
  function inside(w, x, z) {
    const b = w.bb;
    if (x < b[0] || x > b[2] || z < b[1] || z > b[3]) return false;
    _a.set(x, w.y, z).applyMatrix4(w.inv);
    const o = w.o,
      lx = _a.x,
      lz = _a.z;
    if (o.shape === 'rect') return Math.abs(lx) < o.w / 2 && Math.abs(lz) < o.d / 2;
    if (o.shape === 'poly') return inPoly(o.poly, lx, lz);
    if (o.shape === 'blob') {
      const k = 0.5 + 0.5 * w.U.uPFill.value.x; // a half-dry puddle is smaller
      return (lx * lx) / (o.w * o.w * 0.25) + (lz * lz) / (o.d * o.d * 0.25) < 0.8 * k * k;
    }
    return lx * lx + lz * lz < o.r * o.r;
  }
  /* is (x, z) over any fixed water? Works while the world is still being built (before the waters are placed), so the ground cover
     (js/layers/detail.js) can keep its grass and flowers out of pools, ponds and the stream. Rain puddles do not count. */
  const _b = new V3();
  WA.over = function (x, z) {
    for (const w of WA.list) {
      if (w.pool) continue;
      let q = w.fp;
      if (!q) {
        const m = w.mesh,
          bs = m.geometry.boundingSphere;
        m.updateWorldMatrix(true, false);
        q = w.fp = {
          inv: new T.Matrix4().copy(m.matrixWorld).invert(),
          c: m.getWorldPosition(new V3()),
          r: bs.radius + bs.center.length() + 0.4
        };
      }
      if (Math.abs(x - q.c.x) > q.r || Math.abs(z - q.c.z) > q.r) continue;
      _b.set(x, q.c.y, z).applyMatrix4(q.inv);
      const o = w.o,
        lx = _b.x,
        lz = _b.z,
        pad = 0.25;
      if (
        o.shape === 'rect'
          ? Math.abs(lx) < o.w / 2 + pad && Math.abs(lz) < o.d / 2 + pad
          : o.shape === 'poly'
            ? polyDist(o.poly, lx, lz) > -pad
            : o.shape === 'blob'
              ? (lx * lx) / (o.w * o.w * 0.25) + (lz * lz) / (o.d * o.d * 0.25) < 1
              : Math.hypot(lx, lz) < o.r + pad
      )
        return true;
    }
    return false;
  };
  /* distance (m) from a point over a water to its bank, in the water's own shape */
  function rimAt(w, x, z) {
    _a.set(x, w.y, z).applyMatrix4(w.inv);
    const o = w.o,
      lx = _a.x,
      lz = _a.z;
    if (o.shape === 'rect') return Math.min(o.w / 2 - Math.abs(lx), o.d / 2 - Math.abs(lz));
    if (o.shape === 'poly') return polyDist(o.poly, lx, lz);
    if (o.shape === 'blob')
      return (
        (1 - Math.sqrt((lx * lx) / (o.w * o.w * 0.25) + (lz * lz) / (o.d * o.d * 0.25))) *
        Math.min(o.w, o.d) *
        0.4 *
        (w.pool ? w.mesh.scale.x : 1)
      );
    return o.r - Math.hypot(lx, lz);
  }
  /* how far a walker standing at (x, z) with its feet at y sinks into the water there (0: no water, or it does not sink) */
  WA.sinkAt = function (x, z, y) {
    const w = WA.at(x, z, y);
    if (!w || !w.mesh.visible || !w.o.sink) return 0;
    const fill = w.pool ? w.U.uPFill.value.x : 1;
    return Math.max(0, Math.min(w.o.sink * fill, rimAt(w, x, z) * (w.o.sinkSlope || 1), w.y - y + w.o.sink));
  };
  /* the water under a point; y (optional): only water whose surface is within reach of that height (feet in it, or just above) */
  WA.at = function (x, z, y) {
    for (const w of WA.list) {
      if (!w.ready || !w.on) continue;
      if (y !== undefined && (y > w.y + 0.12 || y < w.y - 2.5)) continue;
      if (inside(w, x, z)) return w;
    }
    return null;
  };

  /* ------------------------------------------ GPU resources (made once, when a renderer exists) ------------------------------------------ */
  const GPU = {ok: false, tried: false, gl2: false};
  /* The "ripple" surface of Riposte's texture lab: periodic noise, so the tile repeats without a seam.
     normal map = the ripples; pattern map: rgb = caustic net (edges of warped Voronoi cells, two sizes), a = foam / mottling */
  const TEX_LIB = `precision highp float; precision highp int;
uniform float uSeed; uniform vec2 uRes; varying vec2 vUv;
uint _hu(uvec3 v) { v = v * 1664525u + 1013904223u; v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y; v ^= v >> 16u; v.x += v.y * v.z; v.y += v.z * v.x; v.z += v.x * v.y; return v.x ^ v.y ^ v.z; }
float hs(vec2 i, float k) { return float(_hu(uvec3(uint(i.x + 8192.0), uint(i.y + 8192.0), uint(uSeed * 97.0 + k * 131.0 + 7.0)))) * (1.0 / 4294967295.0); }
vec2 hs2(vec2 i, float k) { return vec2(hs(i, k), hs(i, k + 17.0)); }
float gn(vec2 p, vec2 per, float k) {
  vec2 i = floor(p), f = fract(p), u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  vec2 i0 = mod(i, per), i1 = mod(i + 1.0, per);
  float a0 = hs(i0, k) * 6.2831853, a1 = hs(vec2(i1.x, i0.y), k) * 6.2831853, a2 = hs(vec2(i0.x, i1.y), k) * 6.2831853, a3 = hs(i1, k) * 6.2831853;
  float v0 = dot(vec2(cos(a0), sin(a0)), f), v1 = dot(vec2(cos(a1), sin(a1)), f - vec2(1.0, 0.0));
  float v2 = dot(vec2(cos(a2), sin(a2)), f - vec2(0.0, 1.0)), v3 = dot(vec2(cos(a3), sin(a3)), f - vec2(1.0));
  return mix(mix(v0, v1, u.x), mix(v2, v3, u.x), u.y) * 1.414;
}
float gfbm(vec2 uv, vec2 f0, int oct, float k) {
  float s = 0.0, a = 0.5, t = 0.0; vec2 f = f0;
  for (int o = 0; o < 8; o++) { if (o >= oct) break; s += a * gn(uv * f, f, k + float(o) * 3.0); t += a; a *= 0.5; f *= 2.0; }
  return s / t * 0.5 + 0.5;
}
vec4 vor(vec2 uv, vec2 cells, float k, float jit) {
  vec2 p = uv * cells, i = floor(p), f = fract(p);
  float d1 = 9.0, d2 = 9.0, id = 0.0; vec2 m1 = vec2(0.0), c1 = vec2(0.0);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y)), c = mod(i + g, cells), o = 0.5 + (hs2(c, k) - 0.5) * jit, r = g + o - f;
    float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; id = hs(c, k + 5.0); m1 = r; c1 = g; } else if (d < d2) d2 = d;
  }
  float be = 9.0;
  for (int y = -2; y <= 2; y++) for (int x = -2; x <= 2; x++) {
    vec2 g = c1 + vec2(float(x), float(y)), c = mod(i + g, cells), o = 0.5 + (hs2(c, k) - 0.5) * jit, r = g + o - f;
    if (dot(m1 - r, m1 - r) > 1e-5) be = min(be, dot(0.5 * (m1 + r), normalize(r - m1)));
  }
  return vec4(sqrt(d1), sqrt(d2), id, be);
}
void surf(vec2 uv, out vec3 a, out float h, out float x) {
  vec2 ww = vec2(gfbm(uv, vec2(4.0), 3, 7.0), gfbm(uv + 0.37, vec2(4.0), 3, 8.0)) - 0.5;
  float w1 = gfbm(uv + ww * 0.09, vec2(5.0, 7.0), 5, 1.0), w2 = gfbm(uv - ww * 0.07, vec2(12.0, 9.0), 4, 2.0);
  float cr = 1.0 - abs(gfbm(uv + ww * 0.05, vec2(8.0, 11.0), 4, 3.0) * 2.0 - 1.0);
  h = w1 * 0.5 + w2 * 0.25 + cr * cr * 0.25;
  vec4 v1 = vor(uv + ww * 0.12, vec2(18.0), 4.0, 1.0), v2 = vor(uv + 0.5, vec2(37.0), 5.0, 1.0);
  float lines = (1.0 - smoothstep(0.02, 0.1, v1.w)) * 0.75 + (1.0 - smoothstep(0.02, 0.08, v2.w)) * 0.5;
  float blot = gfbm(uv, vec2(5.0), 4, 9.0);
  x = clamp(lines * smoothstep(0.3, 0.6, blot) + smoothstep(0.5, 0.75, blot) * 0.7, 0.0, 1.0);
  vec2 cw = vec2(gfbm(uv, vec2(3.0), 3, 21.0), gfbm(uv + 0.31, vec2(3.0), 3, 22.0)) - 0.5;
  vec4 c1 = vor(uv + cw * 0.16, vec2(7.0), 31.0, 1.0), c2 = vor(uv - cw * 0.1 + 0.27, vec2(12.0), 33.0, 1.0);
  float cs = exp(-c1.w * c1.w * 420.0) + exp(-c1.w * c1.w * 45.0) * 0.3 + exp(-c2.w * c2.w * 520.0) * 0.55 + exp(-c2.w * c2.w * 60.0) * 0.15;
  a = vec3(clamp(cs * 0.85, 0.0, 1.0));
}
`;
  const QUAD_VERT = 'varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  function quad(frag, uniforms) {
    return new T.FullScreenQuad(
      new T.ShaderMaterial({
        uniforms: Object.assign({uSeed: {value: 83}, uRes: {value: new V2()}}, uniforms || {}),
        vertexShader: QUAD_VERT,
        fragmentShader: frag,
        depthTest: false,
        depthWrite: false,
        blending: T.NoBlending
      })
    );
  }
  function draw(q, rt) {
    const prev = renderer.getRenderTarget(),
      ac = renderer.autoClear;
    if (q.material.uniforms.uRes) q.material.uniforms.uRes.value.set(rt.width, rt.height);
    renderer.autoClear = false;
    renderer.setRenderTarget(rt);
    q.render(renderer);
    renderer.setRenderTarget(prev);
    renderer.autoClear = ac;
  }
  function flatTex(r, g, b, a) {
    const t = new T.DataTexture(new Uint8Array([r, g, b, a]), 1, 1, T.RGBAFormat);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.needsUpdate = true;
    return t;
  }
  function rippleTextures() {
    const size = 512,
      tgt = float =>
        new T.WebGLRenderTarget(size, size, {
          type: float ? T.HalfFloatType : T.UnsignedByteType,
          depthBuffer: false,
          wrapS: T.RepeatWrapping,
          wrapT: T.RepeatWrapping,
          minFilter: float ? T.LinearFilter : T.LinearMipmapLinearFilter,
          magFilter: T.LinearFilter,
          generateMipmaps: !float,
          anisotropy: 8
        });
    const qH = quad(
        TEX_LIB + 'void main(){ vec3 a; float h, x; surf(vUv, a, h, x); gl_FragColor = vec4(h, 0.0, 0.0, 1.0); }'
      ),
      qA = quad(TEX_LIB + 'void main(){ vec3 a; float h, x; surf(vUv, a, h, x); gl_FragColor = vec4(a, x); }'),
      qN = quad(
        `precision highp float; varying vec2 vUv; uniform vec2 uRes; uniform sampler2D tH; uniform float uBump;
      void main(){ vec2 e = 1.0 / uRes;
        float hl = texture2D(tH, vUv - vec2(e.x, 0.0)).r, hr = texture2D(tH, vUv + vec2(e.x, 0.0)).r, hd = texture2D(tH, vUv - vec2(0.0, e.y)).r, hu = texture2D(tH, vUv + vec2(0.0, e.y)).r;
        gl_FragColor = vec4(normalize(vec3((hl - hr) * uBump, (hd - hu) * uBump, 1.0)) * 0.5 + 0.5, 1.0); }`,
        {tH: {value: null}, uBump: {value: (1.6 * size) / 32}}
      );
    const tmp = tgt(true),
      pat = tgt(false),
      nor = tgt(false);
    draw(qH, tmp);
    draw(qA, pat);
    qN.material.uniforms.tH.value = tmp.texture;
    draw(qN, nor);
    for (const q of [qH, qA, qN]) q.material.dispose();
    tmp.dispose();
    SH.tWRip.value = nor.texture;
    SH.tWPat.value = pat.texture;
  }
  function ensureGPU() {
    if (GPU.tried) return GPU.ok;
    if (typeof renderer === 'undefined' || !renderer) return false;
    GPU.tried = true;
    GPU.gl2 = !!renderer.capabilities.isWebGL2;
    SH.tWRip.value = flatTex(128, 128, 255, 255);
    SH.tWPat.value = flatTex(40, 40, 40, 128);
    try {
      if (GPU.gl2) {
        rippleTextures();
        rippleInit();
        GPU.ok = true;
      }
    } catch (e) {
      warn('GPU set-up failed: plain water', e);
    }
    return GPU.ok;
  }

  /* ------------------------------------------ the ripple field ------------------------------------------ */
  const RIP = {
    N: 256,
    size: 32,
    sleep: 6,
    rt: null,
    cur: 0,
    cx: 0,
    cz: 0,
    pend: [],
    idle: 99,
    quad: null,
    mat: null,
    awake: false,
    c: 1.8,
    damp: 0.9945,
    hDamp: 0.9995,
    foamDamp: 0.965,
    step: 1 / 60,
    acc: 0,
    mask: null,
    maskScene: null,
    maskMat: null,
    maskDirty: true,
    mox: 1e9,
    moz: 1e9
  };
  /* one step of the wave equation; the window slid by uShift (whole cells); up to 24 dents; a dry cell stays at zero and its
     neighbours see it as a mirror, so a ring bounces off a pool wall or a bank */
  const RIP_FRAG = `precision highp float;
varying vec2 vUv;
uniform sampler2D tPrev, tMask; uniform vec2 uShift, uOrigin; uniform float uTexel, uSize, uC2, uDamp, uHDamp, uFoamDamp; uniform int uNS; uniform vec4 uS[24], uQ[24];
vec4 at(vec2 uv) { return (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) ? vec4(0.0) : texture2D(tPrev, uv); }
float wet(vec2 uv) { return (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) ? 0.0 : step(0.5, texture2D(tMask, uv).r); }
void main() {
  vec2 uv = vUv + uShift; vec4 c = at(uv); vec2 wp = uOrigin + vUv * uSize;
  if (wet(vUv) < 0.5) { gl_FragColor = vec4(0.0); return; }
  float hl = at(uv - vec2(uTexel, 0.0)).r, hr = at(uv + vec2(uTexel, 0.0)).r, hd = at(uv - vec2(0.0, uTexel)).r, hu = at(uv + vec2(0.0, uTexel)).r;
  hl = mix(c.r, hl, wet(vUv - vec2(uTexel, 0.0))); hr = mix(c.r, hr, wet(vUv + vec2(uTexel, 0.0))); hd = mix(c.r, hd, wet(vUv - vec2(0.0, uTexel))); hu = mix(c.r, hu, wet(vUv + vec2(0.0, uTexel)));
  float v = (c.g + uC2 * (hl + hr + hd + hu - 4.0 * c.r)) * uDamp, h = (c.r + v) * uHDamp, foam = c.b * uFoamDamp;
  vec2 e = min(vUv, 1.0 - vUv) / (8.0 * uTexel); float ab = clamp(min(e.x, e.y), 0.0, 1.0); ab = ab * ab * (3.0 - 2.0 * ab);
  v *= mix(0.55, 1.0, ab); h *= mix(0.9, 1.0, ab);
  for (int i = 0; i < 24; i++) {
    if (i >= uNS) break;
    vec2 d = wp - uS[i].xy; float r = uS[i].z, q = dot(d, d) / (r * r), w = exp(-q);
    h += uS[i].w * (2.0 * w - exp(-0.5 * q)); foam += uQ[i].x * w; // a dent with a rim round it: the water keeps its volume
  }
  gl_FragColor = vec4(h, v, clamp(foam, 0.0, 1.0), 0.0);
}`;
  function rippleInit() {
    const mk = () =>
      new T.WebGLRenderTarget(RIP.N, RIP.N, {
        type: T.HalfFloatType,
        format: T.RGBAFormat,
        minFilter: T.LinearFilter,
        magFilter: T.LinearFilter,
        wrapS: T.ClampToEdgeWrapping,
        wrapT: T.ClampToEdgeWrapping,
        depthBuffer: false,
        stencilBuffer: false
      });
    RIP.rt = [mk(), mk()];
    RIP.mask = new T.WebGLRenderTarget(RIP.N, RIP.N, {
      minFilter: T.NearestFilter,
      magFilter: T.NearestFilter,
      depthBuffer: false,
      stencilBuffer: false
    });
    const sn = RIP.size / RIP.N,
      dx = (RIP.c * RIP.step) / sn;
    RIP.mat = new T.ShaderMaterial({
      uniforms: {
        tPrev: {value: null},
        tMask: {value: RIP.mask.texture},
        uShift: {value: new V2()},
        uOrigin: {value: new V2()},
        uTexel: {value: 1 / RIP.N},
        uSize: {value: RIP.size},
        uC2: {value: dx * dx},
        uDamp: {value: RIP.damp},
        uHDamp: {value: RIP.hDamp},
        uFoamDamp: {value: RIP.foamDamp},
        uNS: {value: 0},
        uS: {value: Array.from({length: 24}, () => new V4())},
        uQ: {value: Array.from({length: 24}, () => new V4())}
      },
      vertexShader: QUAD_VERT,
      fragmentShader: RIP_FRAG,
      depthTest: false,
      depthWrite: false,
      blending: T.NoBlending
    });
    RIP.quad = new T.FullScreenQuad(RIP.mat);
    /* the mask: every water mesh drawn from above into the window (white = water) */
    RIP.maskScene = new T.Scene();
    RIP.maskCam = new T.Camera();
    RIP.maskMat = new T.ShaderMaterial({
      uniforms: {uO: {value: new V2()}, uS: {value: RIP.size}},
      vertexShader:
        'uniform vec2 uO; uniform float uS; void main() { vec4 w = modelMatrix * vec4(position, 1.0); gl_Position = vec4((w.xz - uO) / uS * 2.0 - 1.0, 0.0, 1.0); }',
      fragmentShader: 'void main() { gl_FragColor = vec4(1.0); }',
      side: T.DoubleSide,
      depthTest: false,
      depthWrite: false
    });
    rippleClear();
    SH.tRip.value = RIP.rt[0].texture;
  }
  const _cc = new T.Color();
  function clearRT(rt) {
    const prev = renderer.getRenderTarget(),
      ca = renderer.getClearAlpha();
    renderer.getClearColor(_cc);
    renderer.setClearColor(0x000000, 0);
    renderer.setRenderTarget(rt);
    renderer.clear();
    renderer.setClearColor(_cc, ca);
    renderer.setRenderTarget(prev);
  }
  function rippleClear() {
    for (const r of RIP.rt) clearRT(r);
    RIP.cur = 0;
    SH.tRip.value = RIP.rt[0].texture;
  }
  function maskDraw(ox, oz) {
    for (const w of WA.list) {
      if (!w.ready) continue;
      if (!w.mask) {
        w.mask = new T.Mesh(w.mesh.geometry, RIP.maskMat);
        w.mask.matrixAutoUpdate = false;
        w.mask.frustumCulled = false;
        w.mask.matrix.copy(w.mesh.matrix);
        w.mask.matrixWorld.copy(w.mesh.matrix);
      }
      if (w.mask.parent !== RIP.maskScene) RIP.maskScene.add(w.mask);
      w.mask.visible = w.on && w.mesh.visible;
    }
    RIP.maskMat.uniforms.uO.value.set(ox, oz);
    clearRT(RIP.mask);
    const prev = renderer.getRenderTarget(),
      ac = renderer.autoClear;
    renderer.autoClear = false;
    renderer.setRenderTarget(RIP.mask);
    renderer.render(RIP.maskScene, RIP.maskCam);
    renderer.setRenderTarget(prev);
    renderer.autoClear = ac;
    RIP.mox = ox;
    RIP.moz = oz;
    RIP.maskDirty = false;
  }
  const CAM = new V3(),
    FWD = new V3();
  /* a dent in the water at (x, z): r (m), amp (m: negative pushes the water down), foam (0 to 1) */
  WA.ripple = function (x, z, r, amp, foam, wake) {
    if (!GPU.ok || RIP.pend.length >= 24 || !FXS().water) return;
    const h = RIP.size / 2 - 1;
    if (Math.abs(x - CAM.x) > h || Math.abs(z - CAM.z) > h) return;
    RIP.pend.push([x, z, r, amp, foam || 0]);
    if (wake !== false) RIP.idle = 0;
  };
  function rippleUpdate(dt) {
    if (!GPU.ok) return;
    const sn = RIP.size / RIP.N,
      cx = Math.round(CAM.x / sn) * sn,
      cz = Math.round(CAM.z / sn) * sn,
      U = SH.uRipB.value;
    RIP.idle += dt;
    if (RIP.idle > RIP.sleep || !FXS().water) {
      // still water: the window follows the camera, nothing is computed
      if (RIP.awake) {
        RIP.awake = false;
        rippleClear();
      }
      RIP.pend.length = 0;
      RIP.cx = cx;
      RIP.cz = cz;
      U.set(cx - RIP.size / 2, cz - RIP.size / 2, 1 / RIP.size, 1 / RIP.N);
      return;
    }
    RIP.awake = true;
    RIP.acc = Math.min(RIP.acc + dt, 3 * RIP.step);
    const steps = Math.floor(RIP.acc / RIP.step);
    RIP.acc -= steps * RIP.step;
    if (!steps) return;
    const ox = cx - RIP.size / 2,
      oz = cz - RIP.size / 2;
    if (RIP.maskDirty || ox !== RIP.mox || oz !== RIP.moz) maskDraw(ox, oz);
    const shiftX = Math.round((cx - RIP.cx) / sn),
      shiftZ = Math.round((cz - RIP.cz) / sn);
    const M = RIP.mat.uniforms,
      prev = renderer.getRenderTarget(),
      ac = renderer.autoClear;
    M.uOrigin.value.set(ox, oz);
    renderer.autoClear = false;
    for (let s = 0; s < steps; s++) {
      const n = s === 0 ? Math.min(24, RIP.pend.length) : 0;
      for (let i = 0; i < n; i++) {
        const p = RIP.pend[i];
        M.uS.value[i].set(p[0], p[1], Math.max(0.14, p[2]), p[3]);
        M.uQ.value[i].set(p[4], 0, 0, 0);
      }
      M.uNS.value = n;
      if (s === 0) RIP.pend.splice(0, n);
      M.uShift.value.set(s === 0 ? shiftX / RIP.N : 0, s === 0 ? shiftZ / RIP.N : 0);
      M.tPrev.value = RIP.rt[RIP.cur].texture;
      renderer.setRenderTarget(RIP.rt[1 - RIP.cur]);
      RIP.quad.render(renderer);
      RIP.cur = 1 - RIP.cur;
    }
    renderer.autoClear = ac;
    renderer.setRenderTarget(prev);
    RIP.cx = cx;
    RIP.cz = cz;
    U.set(ox, oz, 1 / RIP.size, 1 / RIP.N);
    SH.tRip.value = RIP.rt[RIP.cur].texture;
  }

  /* ------------------------------------------ droplets ------------------------------------------ */
  const DR = {n: 192, live: 0, p: null, v: null, life: null, max: null, size: null, pts: null, next: 0};
  function dropsInit() {
    DR.p = new Float32Array(DR.n * 3);
    DR.v = new Float32Array(DR.n * 3);
    DR.life = new Float32Array(DR.n);
    DR.max = new Float32Array(DR.n);
    DR.size = new Float32Array(DR.n);
    DR.al = new Float32Array(DR.n);
    DR.floor = new Float32Array(DR.n);
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(DR.p, 3));
    g.setAttribute('aA', new T.BufferAttribute(DR.al, 1));
    g.setAttribute('aS', new T.BufferAttribute(DR.size, 1));
    const m = new T.ShaderMaterial({
      uniforms: {uPx: {value: 600}, uCol: {value: new V3(0.8, 0.86, 0.9)}},
      vertexShader:
        'attribute float aA, aS; varying float vA; uniform float uPx; void main() { vA = aA; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = aS * uPx / max(-mv.z, 0.1); }',
      fragmentShader:
        'uniform vec3 uCol; varying float vA; void main() { float a = smoothstep(0.5, 0.15, length(gl_PointCoord - 0.5)) * vA; if (a < 0.01) discard; gl_FragColor = vec4(uCol, a); }',
      transparent: true,
      depthWrite: false
    });
    DR.pts = new T.Points(g, m);
    DR.pts.frustumCulled = false;
    DR.pts.renderOrder = 2;
    DR.pts.raycast = NORAY;
    DR.pts.userData.kind = 'waterfx';
    DR.pts.visible = false;
  }
  /* v100: first-use shader compiles (the splash droplets and the ripple passes) used to land mid-play as 0.2 to 1.6 s hitches. The loader calls
     these behind the loading screen: warmObjs() gives throw-away points that share the droplet material (drawn once by the warm-up),
     warm() runs one ripple pass and one mask pass into their own render targets. */
  WA.warmObjs = function () {
    try {
      if (!DR.pts) dropsInit();
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.BufferAttribute(new Float32Array(3), 3));
      g.setAttribute('aA', new T.BufferAttribute(new Float32Array(1), 1));
      g.setAttribute('aS', new T.BufferAttribute(new Float32Array(1), 1));
      return [new T.Points(g, DR.pts.material)];
    } catch (e) {
      return [];
    }
  };
  WA.warm = function () {
    try {
      if (!GPU.ok || !RIP.mat || !RIP.rt || !RIP.maskMat) return;
      const prev = renderer.getRenderTarget(),
        ac = renderer.autoClear,
        M = RIP.mat.uniforms,
        n0 = M.uNS.value;
      renderer.autoClear = false;
      M.uNS.value = 0;
      M.tPrev.value = RIP.rt[RIP.cur].texture;
      renderer.setRenderTarget(RIP.rt[1 - RIP.cur]);
      RIP.quad.render(renderer);
      const sc = new T.Scene(),
        pl = new T.Mesh(new T.PlaneGeometry(1, 1), RIP.maskMat);
      pl.frustumCulled = false;
      sc.add(pl);
      renderer.setRenderTarget(RIP.mask);
      renderer.render(sc, RIP.maskCam);
      M.uNS.value = n0;
      renderer.setRenderTarget(prev);
      renderer.autoClear = ac;
      rippleClear();
    } catch (e) {
      console.warn('[water] warm', e);
    }
  };
  function drop(x, y, z, vx, vy, vz, life, size, floor) {
    if (!DR.pts) dropsInit();
    const i = DR.next;
    DR.next = (DR.next + 1) % DR.n;
    DR.p[i * 3] = x;
    DR.p[i * 3 + 1] = y;
    DR.p[i * 3 + 2] = z;
    DR.v[i * 3] = vx;
    DR.v[i * 3 + 1] = vy;
    DR.v[i * 3 + 2] = vz;
    DR.life[i] = DR.max[i] = life;
    DR.size[i] = size;
    DR.floor[i] = floor;
    DR.live = DR.n;
  }
  function dropsUpdate(dt) {
    if (!DR.pts || !DR.live) return;
    if (DR.pts.parent !== scene) scene.add(DR.pts);
    let live = 0;
    for (let i = 0; i < DR.n; i++) {
      if (DR.life[i] <= 0) {
        DR.al[i] = 0;
        continue;
      }
      DR.life[i] -= dt;
      DR.v[i * 3 + 1] -= 9.8 * dt;
      DR.p[i * 3] += DR.v[i * 3] * dt;
      DR.p[i * 3 + 1] += DR.v[i * 3 + 1] * dt;
      DR.p[i * 3 + 2] += DR.v[i * 3 + 2] * dt;
      if (DR.p[i * 3 + 1] < DR.floor[i] && DR.v[i * 3 + 1] < 0) DR.life[i] = 0; // back in the water
      DR.al[i] = DR.life[i] > 0 ? Math.min(1, (DR.life[i] / DR.max[i]) * 2.5) * 0.85 : 0;
      if (DR.life[i] > 0) live++;
    }
    DR.live = live;
    DR.pts.visible = live > 0;
    const g = DR.pts.geometry;
    g.attributes.position.needsUpdate = true;
    g.attributes.aA.needsUpdate = true;
    g.attributes.aS.needsUpdate = true;
    const u = DR.pts.material.uniforms,
      lum = clamp((ambL ? ambL.intensity : 0.6) * 0.8 + (dirL ? dirL.intensity : 1) * 0.45, 0.1, 1);
    u.uCol.value.set(0.8 * lum, 0.86 * lum, 0.9 * lum);
    u.uPx.value = (renderer.domElement.height * 0.5) / Math.tan(((camera.fov || 75) * Math.PI) / 360);
  }
  const rnd = (a, b) => a + Math.random() * (b - a);
  /* v093: real synthesised sounds (S.splash / S.wade in js/game/core/03_audio.js; they are also Game Assets slots). This used to be a
     faint noise burst that could not be heard over the footsteps and gunfire. */
  function sound(p, big, wadeDeep) {
    try {
      if (typeof S === 'undefined' || typeof AC === 'undefined' || !AC) return;
      if (big === 'wade') S.wade(wadeDeep, p);
      else S.splash(!!big, p);
    } catch (e) {}
  }
  /* a bullet (big: a heavy hit) lands in water at p (p.y = the surface): droplets, a column of spray, rings */
  WA.splash = function (p, big) {
    const k = big ? 1.4 : 1;
    WA.ripple(p.x, p.z, big ? 0.55 : 0.36, big ? -0.34 : -0.17, big ? 0.38 : 0.24);
    if (FXS().water) {
      for (let i = 0; i < (big ? 16 : 10); i++)
        drop(
          p.x,
          p.y + 0.02,
          p.z,
          rnd(-0.9, 0.9) * k,
          rnd(2.2, 4.6) * k,
          rnd(-0.9, 0.9) * k,
          rnd(0.45, 0.8),
          rnd(0.05, 0.09) * k,
          p.y
        );
      for (let i = 0; i < 4; i++)
        drop(p.x, p.y + 0.05, p.z, rnd(-0.2, 0.2), rnd(1.2, 2.2) * k, rnd(-0.2, 0.2), 0.5, 0.16 * k, p.y);
    }
    sound(p, !!big);
  };
  /* a foot comes down in water: a few drops ahead of the foot, a sharper dent */
  function stepSplash(x, z, y, sp, vx, vz, depth, loud) {
    const k = clamp(sp / 5, 0.4, 1.3) * (depth < 0.06 ? 0.6 : 1),
      vl = Math.hypot(vx, vz),
      ox = vl > 0.1 ? (vx / vl) * 0.25 : 0,
      oz = vl > 0.1 ? (vz / vl) * 0.25 : 0;
    WA.ripple(x + ox, z + oz, 0.26 + 0.1 * k, -0.17 * k, 0.2 * k);
    if (FXS().water)
      for (let i = 0; i < 3 + Math.floor(3 * k); i++)
        drop(
          x + ox + rnd(-0.15, 0.15),
          y + 0.04,
          z + oz + rnd(-0.15, 0.15),
          rnd(-0.6, 0.6) * k,
          rnd(1.2, 2.6) * k,
          rnd(-0.6, 0.6) * k,
          rnd(0.3, 0.55),
          0.035 * k,
          y
        );
  }

  /* ------------------------------------------ what disturbs the water ------------------------------------------ */
  /* shots: every tracer (the player's, armed zombies', survivors', co-op guests') that crosses a water surface splashes there */
  WA.shot = function (a, b) {
    if (!WA.list.length || !a || !b) return;
    for (const w of WA.list) {
      if (!w.ready || !w.on || !w.mesh.visible) continue;
      const da = a.y - w.y,
        db = b.y - w.y;
      if (da * db >= 0) continue;
      const t = da / (da - db),
        x = a.x + (b.x - a.x) * t,
        z = a.z + (b.z - a.z) * t;
      if (inside(w, x, z)) {
        WA.splash({x, y: w.y, z}, false);
        return;
      }
    }
  };
  if (typeof addTracer === 'function') {
    const _at = addTracer;
    addTracer = function (a, b) {
      try {
        WA.shot(a, b);
      } catch (e) {
        warn('shot', e);
      }
      return _at.apply(this, arguments);
    };
  }
  /* walkers: the player, zombies and followers leave a wake while they wade, and splash every 0.7 m */
  const TRACK = new WeakMap();
  function wade(obj, x, y, z, dt, isPlayer) {
    let s = TRACK.get(obj);
    if (!s) {
      TRACK.set(obj, (s = {x, z, acc: 0}));
      return;
    }
    const dx = x - s.x,
      dz = z - s.z,
      d = Math.hypot(dx, dz);
    s.x = x;
    s.z = z;
    if (d < 1e-4 || d > 3 || dt <= 0) return;
    const w = WA.at(x, z, y);
    if (!w || !w.mesh.visible) return;
    const sp = d / dt,
      depth = Math.max(w.o.sink || 0, Math.min(w.U.uPBed.value, Math.max(0, w.y - y)));
    if (sp < 0.15) return;
    const f = Math.min(dt * 60, 2),
      q = Math.min(sp, 6.5);
    WA.ripple(
      x + (dx / d) * 0.3,
      z + (dz / d) * 0.3,
      0.26 + q * 0.045,
      -0.0055 * (0.5 + q / 2.2) * f,
      Math.min(0.035, sp * 0.006) * f
    );
    s.acc += d;
    if (s.acc > 0.7) {
      s.acc = 0;
      stepSplash(x, z, w.y, sp, dx / dt, dz / dt, depth, isPlayer || Math.hypot(x - CAM.x, z - CAM.z) < 14);
    }
    /* v101: the wading SOUND now has its own, slower rhythm (every 1.9 m in the shallows, 2.4 m in deep water, and never closer
       than 0.42 s). It used to ride on the 0.7 m visual splash, so at a walk it fired about six times a second. The drops and
       ripples above still come every 0.7 m. */
    s.snd = (s.snd || 0) + d;
    if (s.snd > (depth > 0.1 ? 2.4 : 1.9)) {
      const now = typeof performance !== 'undefined' ? performance.now() : 0;
      if (now - (s.sndT || 0) > 420) {
        s.snd = 0;
        s.sndT = now;
        if (isPlayer || Math.hypot(x - CAM.x, z - CAM.z) < 14) sound({x, z}, 'wade', depth > 0.1);
      } else s.snd = 1.5; // too soon: try again a little later rather than skipping a whole stride
    }
  }
  function walkers(dt) {
    if (typeof pl === 'undefined' || !pl) return;
    if (!WA.list.length) {
      if (typeof G !== 'undefined' && G) G.wade = 0;
      return;
    }
    const eye = (typeof G !== 'undefined' && G && G.eyeUsed) || 1.6,
      h = RIP.size / 2 - 1;
    wade(pl, pl.position.x, pl.position.y - eye, pl.position.z, dt, true);
    // deep water: the core lowers the player's eye by G.wade (not while jumping out of it)
    if (typeof G !== 'undefined' && G) G.wade = G.vy ? 0 : WA.sinkAt(pl.position.x, pl.position.z, pl.position.y - eye);
    for (const arr of [typeof zombies !== 'undefined' ? zombies : null, typeof comps !== 'undefined' ? comps : null]) {
      if (!arr) continue;
      for (const e of arr) {
        const o = e && e.position ? e : e && e.m && e.m.position ? e.m : null;
        if (!o) continue;
        const p = o.position;
        if (Math.abs(p.x - CAM.x) > h || Math.abs(p.z - CAM.z) > h) {
          if (o.userData) o.userData.wsink = 0;
          continue;
        }
        wade(o, p.x, p.y, p.z, dt, false);
        // zombies and followers sink too: eased, and applied only while the frame is drawn (see sinkDraw)
        if (o.userData) {
          const u = o.userData,
            t = u.sleep || u.flop > 0 || u.ragT > 0 ? 0 : WA.sinkAt(p.x, p.z, p.y);
          u.wsink = (u.wsink || 0) + (t - (u.wsink || 0)) * Math.min(1, dt * 5);
          if (u.wsink < 0.005) u.wsink = 0;
        }
      }
    }
  }
  /* The game sets every walker's height from the ground each frame, and the ground cannot go below 0. So a walker in deep water is
     lowered just before the frame is drawn (RGW.pre) and put back at the start of the next tick: game logic never sees it. */
  const SUNK = [];
  function sinkDraw() {
    if (SUNK.length) return;
    for (const arr of [typeof zombies !== 'undefined' ? zombies : null, typeof comps !== 'undefined' ? comps : null]) {
      if (!arr) continue;
      for (const e of arr) {
        const o = e && e.position ? e : e && e.m && e.m.position ? e.m : null,
          s = o && o.userData && o.userData.wsink;
        if (s > 0.005) {
          o.position.y -= s;
          o.updateMatrixWorld(true);
          SUNK.push(o, s);
        }
      }
    }
  }
  function sinkRestore() {
    for (let i = 0; i < SUNK.length; i += 2) SUNK[i].position.y += SUNK[i + 1];
    SUNK.length = 0;
  }
  if (window.RGW) {
    const _pre = RGW.pre;
    RGW.pre = function () {
      const r = _pre && _pre.apply(this, arguments);
      try {
        if (WA.list.length) sinkDraw();
      } catch (e) {
        warn('sink', e);
      }
      return r;
    };
  }
  /* fountain jets: they only wake the field in front of the player (or right next to them) */
  function jets(dt) {
    const awake = RIP.idle <= RIP.sleep;
    for (const w of WA.list) {
      const j = w.jet;
      if (!j || !w.ready) continue;
      j.t -= dt;
      if (j.t > 0) continue;
      j.t = j.every;
      const dx = j.x - CAM.x,
        dz = j.z - CAM.z,
        d2 = dx * dx + dz * dz,
        seen = d2 < 16 || dx * FWD.x + dz * FWD.z > 0.3 * Math.sqrt(d2);
      if (seen || awake) WA.ripple(j.x, j.z, j.r, j.amp, j.foam, seen);
    }
  }

  /* ------------------------------------------ rain puddles ------------------------------------------ */
  const PD = {cell: 7, range: 30, n: 26, pool: [], sites: new Map(), geos: null, t: 0, DOWN: new V3(0, -1, 0)};
  WA.puddles = PD;
  function hsh(ix, iz, k) {
    let n = (Math.imul(ix, 374761393) + Math.imul(iz, 668265263) + Math.imul(k, 1274126177)) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    n ^= n >>> 16;
    return (n >>> 0) / 4294967296;
  }
  function siteOf(ix, iz) {
    const key = ix + ',' + iz;
    let s = PD.sites.get(key);
    if (s !== undefined) return s;
    if (hsh(ix, iz, 1) > 0.5) s = null;
    else {
      const w = lerp(1.3, 3.6, hsh(ix, iz, 4)),
        d = w * lerp(0.5, 0.85, hsh(ix, iz, 5));
      s = {
        x: (ix + 0.2 + 0.6 * hsh(ix, iz, 2)) * PD.cell,
        z: (iz + 0.2 + 0.6 * hsh(ix, iz, 3)) * PD.cell,
        w,
        d,
        rot: hsh(ix, iz, 6) * TAU,
        v: Math.floor(hsh(ix, iz, 7) * 4),
        th: hsh(ix, iz, 8) * 0.5,
        ok: undefined,
        y: 0,
        tries: 0,
        rec: null
      };
    }
    PD.sites.set(key, s);
    return s;
  }
  const LIVEK = {zombie: 1, corpse: 1, surv: 1, npc: 1, comp: 1, person: 1, limb: 1, carry: 1, loot: 1, door: 1};
  /* a spot holds a puddle if five rays from above land on flat ground at one height (so: open sky, no kerb, no car, no roof) */
  function testSite(s) {
    if (typeof rayWorld !== 'function') return;
    if (WA.at(s.x, s.z)) {
      s.ok = false;
      return;
    }
    const c = Math.cos(s.rot),
      sn = Math.sin(s.rot);
    let y0 = 1e9,
      y1 = -1e9;
    for (const [a, b] of [
      [0, 0],
      [0.55, 0],
      [-0.55, 0],
      [0, 0.55],
      [0, -0.55]
    ]) {
      const lx = (a * s.w) / 2,
        lz = (b * s.d) / 2,
        h = rayWorld(_a.set(s.x + lx * c + lz * sn, 7, s.z - lx * sn + lz * c), PD.DOWN, 8);
      if (!h || !h.p) {
        s.ok = false;
        return;
      }
      const k = h.o && h.o.userData && h.o.userData.kind;
      if ((k && LIVEK[k]) || (h.p.y > 0.14 && Math.hypot(h.p.x - CAM.x, h.p.z - CAM.z) < 2.5)) {
        // somebody is standing there: ask again later
        if (++s.tries > 6) s.ok = false;
        return;
      }
      if (h.p.y > 0.14 || !h.n || h.n.y < 0.92) {
        s.ok = false;
        return;
      }
      y0 = Math.min(y0, h.p.y);
      y1 = Math.max(y1, h.p.y);
    }
    s.ok = y1 - y0 < 0.015;
    s.y = y1 + 0.012;
  }
  PD.test = testSite; // (Dev / tests: MFZWATER.puddles.siteOf(ix, iz), .test(site))
  PD.siteOf = siteOf;
  function poolRec() {
    if (!PD.geos) PD.geos = [1, 2, 3, 4].map(seed => geometry({shape: 'blob', w: 2, d: 2, seed, seg: 20, rings: 4}));
    const w = WA.add({kind: 'puddle', shape: 'blob', w: 2, d: 2, geo: PD.geos[0], y: -50});
    w.pool = true;
    w.on = false;
    w.mesh.visible = false;
    w.ready = true;
    return w;
  }
  function puddleFill(s) {
    return sstep(s.th, s.th + 0.45, WA.wet);
  }
  function puddlesUpdate(dt) {
    if (typeof scene === 'undefined' || !scene || typeof G === 'undefined' || !G || !G.mode) return;
    const on = FXS().puddles !== 0 && WA.wet > 0.01;
    if (!on) {
      for (const w of PD.pool)
        if (w.on) {
          w.on = false;
          w.mesh.visible = false;
          if (w.site) w.site.rec = null;
          w.site = null;
          RIP.maskDirty = true;
        }
      return;
    }
    const cx = Math.floor(CAM.x / PD.cell),
      cz = Math.floor(CAM.z / PD.cell),
      n = Math.ceil(PD.range / PD.cell);
    PD.t -= dt;
    // one untested spot per frame (five rays), nearest first
    let best = null,
      bd = 1e9;
    const want = [];
    for (let iz = cz - n; iz <= cz + n; iz++)
      for (let ix = cx - n; ix <= cx + n; ix++) {
        const s = siteOf(ix, iz);
        if (!s || s.ok === false) continue;
        const d = Math.hypot(s.x - CAM.x, s.z - CAM.z);
        if (d > PD.range) continue;
        if (s.ok === undefined) {
          if (d < bd) {
            bd = d;
            best = s;
          }
        } else if (puddleFill(s) > 0.01) want.push([d, s]);
      }
    if (best) testSite(best);
    for (const w of PD.pool)
      if (w.on && w.site) {
        w.U.uPFill.value.x = puddleFill(w.site);
        if (w.mesh.parent !== scene) scene.add(w.mesh);
      }
    if (PD.t > 0) return;
    PD.t = 0.4;
    // puddles out of range or dry go back to the pool; free ones go to the nearest spots that have none
    for (const w of PD.pool)
      if (w.on && (Math.hypot(w.site.x - CAM.x, w.site.z - CAM.z) > PD.range + 4 || puddleFill(w.site) <= 0.01)) {
        w.on = false;
        w.mesh.visible = false;
        w.site.rec = null;
        w.site = null;
        RIP.maskDirty = true;
      }
    want.sort((p, q) => p[0] - q[0]);
    for (const [, s] of want) {
      if (s.rec) continue;
      let w = PD.pool.find(q => !q.on);
      if (!w) {
        if (PD.pool.length >= PD.n) break;
        PD.pool.push((w = poolRec()));
      }
      s.rec = w;
      w.site = s;
      w.on = true;
      const m = w.mesh;
      m.geometry = PD.geos[s.v];
      if (w.mask) w.mask.geometry = m.geometry;
      m.position.set(s.x, s.y, s.z);
      m.rotation.set(0, s.rot, 0);
      m.scale.set(s.w / 2, 1, s.d / 2);
      m.visible = true;
      if (m.parent !== scene) scene.add(m);
      w.U.uPFill.value.set(puddleFill(s), 0.8, Math.min(s.w, s.d) / 2);
      place(w);
    }
    WA.stats.puddles = PD.pool.filter(w => w.on).length;
  }

  /* ------------------------------------------ weather, sky, per frame ------------------------------------------ */
  const _c1 = new T.Color(),
    _c2 = new T.Color();
  function skyUpdate() {
    const A = window.RGATM,
      cur = A && A.cur;
    if (cur && A.active && FXS().sky !== 0) {
      // the dome's cloud layer, averaged: the clouds' colour mixed in by the cover
      const day = A.day === undefined ? 1 : A.day,
        k = clamp(cur.cloud * (0.55 + 0.4 * cur.cloud), 0, 1) * 0.8,
        b = lerp(0.1, 1, sstep(0, 0.5, day) * 0.9 + 0.1);
      _c1.setRGB(lerp(1, 0.28, cur.dark) * b, lerp(1, 0.3, cur.dark) * b, lerp(1, 0.34, cur.dark) * b);
      _c2.copy(cur.hor).multiplyScalar(1.2);
      _c1.lerp(_c2, 0.25 + 0.3 * (1 - cur.dark));
      const fl = (A.flash || 0) * 0.5;
      SH.uSkyZ.value.copy(cur.zen).lerp(_c1, k).addScalar(fl);
      SH.uSkyM.value
        .copy(cur.mid)
        .lerp(_c1, k * 0.8)
        .addScalar(fl);
      SH.uSkyH.value
        .copy(cur.hor)
        .lerp(_c1, k * 0.4)
        .addScalar(fl);
      SH.uWRain.value = clamp(cur.rain || 0, 0, 1);
    } else {
      const c = typeof scene !== 'undefined' && scene && scene.fog ? scene.fog.color : _c1.set(0x9ab4c8);
      SH.uSkyZ.value.copy(c);
      SH.uSkyM.value.copy(c);
      SH.uSkyH.value.copy(c);
      SH.uWRain.value = 0;
    }
  }
  /* wetness: up in about 40 s of rain, down over about 5 minutes; a world that starts in the rain starts wet */
  function wetUpdate(dt) {
    const r = SH.uWRain.value;
    if (r > 0.05) WA.wet = Math.min(1, WA.wet + (dt * r) / 40);
    else WA.wet = Math.max(0, WA.wet - dt / 300);
  }
  let last = performance.now(),
    wasPlaying = false;
  function tick() {
    requestAnimationFrame(tick);
    sinkRestore(); // first thing: walkers lowered for the last drawn frame get their real height back before any game logic runs
    const now = performance.now(),
      dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (
      typeof scene === 'undefined' ||
      !scene ||
      typeof camera === 'undefined' ||
      !camera ||
      typeof renderer === 'undefined' ||
      !renderer
    )
      return;
    if (window.MFZLOAD && MFZLOAD.busy) return;
    try {
      ensureGPU();
      const play = (typeof playing === 'function' ? !!playing() : true) || !!(window.MENUWORLD && MENUWORLD.on); // v092: the menu's town too
      if (WA.list.some(w => !w.ready)) finalizeAll();
      // waters whose mesh left the world (cleared) are dropped
      if (WA.list.some(w => !w.pool && w.ready && !w.mesh.parent)) {
        WA.list = WA.list.filter(w => w.pool || !w.ready || w.mesh.parent);
        RIP.maskDirty = true;
      }
      camera.getWorldPosition(CAM);
      camera.getWorldDirection(FWD);
      skyUpdate();
      SH.uWQ.value = FXS().water ? 1 : 0;
      if (!play) {
        wasPlaying = false;
        return;
      }
      if (!wasPlaying) {
        wasPlaying = true;
        if (SH.uWRain.value > 0.5 && WA.wet < 0.7) WA.wet = 0.7;
      }
      SH.uWT.value += dt;
      wetUpdate(dt);
      puddlesUpdate(dt);
      walkers(dt);
      jets(dt);
      rippleUpdate(dt);
      dropsUpdate(dt);
      WA.stats.awake = RIP.awake;
      WA.stats.wet = +WA.wet.toFixed(2);
    } catch (e) {
      warn('tick', e);
    }
  }
  requestAnimationFrame(tick);

  /* ------------------------------------------ world hooks ------------------------------------------ */
  if (typeof clearWorld === 'function') {
    const _cw = clearWorld;
    clearWorld = function () {
      WA.list = WA.list.filter(w => w.pool);
      for (const w of PD.pool) {
        w.on = false;
        w.mesh.visible = false;
        if (w.site) w.site.rec = null;
        w.site = null;
      }
      PD.sites.clear();
      WA.wet = 0;
      SUNK.length = 0;
      if (typeof G !== 'undefined' && G) G.wade = 0;
      wasPlaying = false;
      RIP.maskDirty = true;
      RIP.pend.length = 0;
      return _cw.apply(this, arguments);
    };
  }
  /* first of the post-build passes: the waters leave their lot groups before the perf pass merges those */
  if (typeof WB !== 'undefined' && WB.post)
    WB.post.unshift(() => {
      try {
        ensureGPU(); // textures and the ripple field exist before the loading screen compiles and draws the world
        finalizeAll();
      } catch (e) {
        warn('finalize', e);
      }
    });
  console.log('[water] water layer ready (' + Object.keys(WA.kinds).join(', ') + ')');
})();
