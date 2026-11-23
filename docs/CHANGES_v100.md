# v100

Release notes for v100. Everything from the performance / hitch-recorder work since v093 is folded into this one version
(the intermediate test builds were never separate releases; their notes follow below, oldest first, for reference).

## Summary

- Hitch recorder (`js/game/hitchlog.js`): F9 grabs the last 8 s, F10 downloads, F7 runs a frame-time experiment; console `hitch()`.
- Loading: the world warm-up finishes (shaders, weapons, hidden objects, a settle phase) before "Press any key"; clicking the
  overlay now starts the game.
- Render Distance (Fog Density): one slider (0-300%, default 100%) sets fog and how far things are drawn. Untick
  "Combine Fog & Render Distance" to get separate Fog Density and Render Distance sliders.
- Fewer draw calls: plain props share one vertex-coloured material (`?novc` turns it off); loose loot / vehicles hidden by distance.
- Opt-in experiments, off by default: `?lite` (Lambert instead of PBR), `?lightgate`, `?noviewdist` (old fixed 100 m),
  `?nofarobj`, `?nohitch`.

## Distance fade

Things no longer pop at the render distance: they dither out. three's fog chunks (`fog_pars_vertex/fog_vertex/fog_pars_fragment/
fog_fragment`) are patched once in perf.js, so every fogged material (basic, lambert, phong, standard, skinned, instanced) gets it
with no per-material work and no extra uniforms. The vertex shader reads the far plane from the projection matrix and passes
`vRgFade`, deliberately NOT clamped per vertex (large road / ground triangles would otherwise fade across their whole surface: the road vanished at some angles); the fragment shader clamps (0 at 0.68 x far, 1 at 0.8 x far); the fragment shader discards a screen-door dither share of pixels equal to it.
perfCull sets camera.far = 1.25 x D, so the fade completes exactly at D, where objects are hidden, and starts at ~0.85 D.
Not faded: water, the sky dome and weather particles (own shaders). `?nofade` turns it off. Shaders compile clean (`?shadercheck`);
the look itself was not checked on screen in the headless test.

### Alpha-to-coverage fade (smooth variant)
When anti-aliasing is on (WebGL2 MSAA), opaque fogged materials now fade out through the multisample coverage mask instead of the dither: smooth, no stipple. Transparent materials and ShaderMaterials keep the dither, as does everything when AA is off. Implementation note: three r147 has no ALPHA_TO_COVERAGE shader define, so perf.js adds its own `RG_A2C` define (material.defines) alongside the `alphaToCoverage` flag. Add `?noa2c` to the URL to use the dither everywhere for comparison; `?nofade` disables the fade entirely.

### Fort HQ no longer keeps the fort loaded
Loading a save or driving back from a mission now unloads the current map and opens the plain Fort HQ menu (`toHQ()` in `13_campaign.js`). The fort map is only built when the player clicks **Enter fort** (`enterFort()`, through the loading screen with "Press any key"). Saves are data-driven (`G.bars` etc.), so saving from the HQ menu works as before; an autosave is written when the HQ menu opens. A save made on siege day still goes straight into the siege.

### Warm-up of first-use shaders
The loader now also compiles the splash-droplet material and the water ripple / mask passes (`MFZWATER.warmObjs()` / `MFZWATER.warm()`) behind the loading screen; they used to compile mid-play (0.2 to 1.6 s hitches).

### Toggling anti-aliasing mid-game
Switching AA recreates the renderer, which has none of the scene's shaders, geometries or textures; they were rebuilt piecemeal over the next minutes (multi-second stalls, then constant hitching). The loader's warm-up now runs straight after the switch behind its Loading screen, and the old context is released 1.5 s later instead of in the same frame.

### URL flags survive Quit to Main Menu
Quit to Main Menu (and leaving a co-op page) reloaded `location.pathname` only, which dropped any `?flag` from the address. It now keeps the query string.

### Graphics > Distance fade (Smooth / Dither / Off)
New setting in the Render Distance group. Smooth = alpha-to-coverage (needs Anti-aliasing + WebGL2; the button is greyed out while AA is off and Smooth falls back to Dither), Dither = stipple fade, Off = pop-out. Default Smooth. The mode is picked per material through `material.defines` (`RG_A2C` / `RG_DITHER`); changing it marks every material for recompile and the loader warm-up runs behind its Loading screen. `?nofade` forces Off, `?noa2c` caps at Dither.

## Render Distance details

Exponential fog leaves exp(-(d*density)^2) visible, so D = 2.3/density m (clamped 18-260) is where ~99.5% is fog. perfCull (perf.js)
uses D for buildings, zombies/NPCs, loot (0.55 D), vehicles (0.85 D), detail and instanced tiles (own ranges scale with D/100);
camera far = D*1.2+15 (60-300 m). Combined mode: density comes from the slider times the weather, so storms shorten the view.
Split mode: the Render Distance slider alone sets D = 11500/(slider x weather fog multiplier) m, i.e. the same formula with the Render
Distance % in place of the fog %, so equal sliders give the same distance in any weather (clear 100% = ~115 m, 0% = 260 m); the
Fog Density slider then only changes how the fog looks.
Test (storm, town centre, F7): 0% 17 fps, 50% 31, 100% 50, 150% 60, 200% 60, 300% 60.

---

# Mini Fort Zombie v094: hitch recorder and frame profiler (diagnostics only)

Everything in `docs/CHANGES_v093.md` still applies. No gameplay, save format or co-op protocol change. `?nohitch` disables the new file.

New file `js/game/hitchlog.js`, loaded last (after `coop.js`) so its wrappers are the outermost ones.

## What it records
A ring of the last ~40 s of frames. Per frame: gap to the next frame, game logic ms, `renderer.render` ms, shadow-map ms (and whether `perf.js` redrew the static shadow in full), GPU ms (timer query, when the browser offers it), draw calls, triangles, geometries, textures, shader programs, JS heap (a drop = garbage collection), zombie count, `MFZLOAD.busy`, and ms per part of the frame (zombies, followers, HUD, corpses, viewmodel, lighting, fx). Timed calls inside it: `shoot`, `melee`, `reload`, `hitZ`, `dmgZ`, `killZ`, `dismember`, `corpseHit`, `zKnock`, `ragInit`, `spawnLimb`, `MFZGORE.gib`, blood / decal / hole / tracer / damage-number helpers, `damage`, `breakWin`, the `S.*` sounds, `zombie`, `spawnComp`, `placeNpcs`, `go`, `buildWorld`, `clearWorld`, `startSiege`, `travel`. Each call is tagged "FIRST TIME this session" the first time that call (and weapon) happens, which separates one-off shader / texture warm-up from a per-shot cost. Browser long tasks and long animation frames (with the blocking script and function) are matched to the frame they hit.

Pointer-lock diagnostics for the "click on Press any key" bug: every `requestPointerLock` call, whether it resolved or was rejected (and why), whether the browser counted the click as a user activation, and the loading-screen `pointerdown` / `mousedown` / `click` / `keydown` events appear on the timeline.

## Use
- **F9**: grab the last 8 s (toast confirms). **F10**: download all grabbed reports as a .txt. Any frame over 120 ms grabs a report itself 1.5 s later (max 25, 4 s apart). Reports are also kept in `localStorage` (`mfz_hitch`) so a page reload does not lose them.
- Console: `hitch(sec)`, `prof(sec)` (per-part table plus a CPU-bound / GPU-bound verdict), `hitch.save()`, `hitch.copy()`, `hitch.clear()`, `hitch.auto(ms)`, `hitch.gpu(bool)`, `hitch.on()` / `hitch.off()`. `HITCH.mark('text')` puts a custom marker on the timeline.
- F8 is the existing diagnostic HUD, F3/F4/F6 the existing profiler overlay; the new keys are F9 and F10.

## Changed
`index.html` (script tag, version), `js/game/core/01_items.js` (`VERSION`). Nothing else.

---

# Mini Fort Zombie v095: hitch recorder update (diagnostics only)

Everything in `docs/CHANGES_v094.md` still applies. Still no gameplay change.

- **Fix:** the per-part split (zombies, followers, HUD, corpses, viewmodel, lighting, fx) was recorded under the wrong key, so every report showed 0.0. It now works.
- **New shader programs are logged by name** (with the tail of the cache key and the materials that asked for them) on the frame they appear: each one is a mid-play compile and a hitch. Reports also list what the last world warm-up still had to compile at its final draw.
- **F7 / `hitch.exp()`: A/B experiment** (~12 s, stand still in a mission): normal frame, zombies not drawn, rest of world not drawn, shadow pass skipped, half resolution. It prints and saves a table with the ms each part costs in that spot; F10 downloads it.

---

# Mini Fort Zombie v096: hitch fixes (shader warm-up v2, click on "Press any key"), draw-call breakdown

Everything in `docs/CHANGES_v095.md` still applies. No save format or co-op protocol change.

## Why (from the v094/v095 hitch reports)
Every 0.3-2 s freeze was a shader program being compiled the first time something was drawn (shader count went up on that exact frame): the gun viewmodel of a weapon not yet drawn, a bullet tracer, objects the distance culling had hidden when the world warm-up ran. The first frames after a mission load also did 1-4 s of one-off work (first zombie update, uploads) AFTER "Press any key" was already showing. Clicking on "Press any key" did nothing because `go()` is granted the pointer lock behind the loading screen, and while the pointer is locked the browser delivers mouse events to the game canvas, not the overlay.

## Changed (`js/game/loader.js`)
- **Weapons:** the warm-up equips every weapon in `WDEF` for a moment (a throw-away item stands in for it in the inventory, then it is removed), builds its viewmodel (model, hands, sight calibration) and draws the viewmodel scene once. `G.eq`, draw / reload / cooldown state are put back. Progress label "Preparing weapons".
- **Hidden objects:** `renderer.compile` and the final draw-everything render now run inside `allVisible()`, which shows everything the distance culling or a layer had hidden (never lights: the lit-light count is part of every shader) for that one synchronous call. `PERF.shadowDirty()` afterwards.
- **Tracer probe:** a throw-away mesh with the bullet tracer's material settings (transparent, additive) is drawn during the warm-up. Probe materials are kept (a program is deleted when its last material is disposed).
- **`L.settle()`:** after the warm-up (and before the co-op gate / "Press any key"), the real game loop runs behind the loading screen until it is smooth (12+ frames, none of the last 10 slower than 1.7x their median and over 45 ms), max 10 s. "Starting up" on the bar. Used by the mission loader and by the automatic overlay of other world builds.
- **Click on "Press any key":** `pointerdown` / `mousedown` are also listened for on the window (capture), so a click works while the pointer is already locked.

## Changed (`js/game/hitchlog.js`)
- F7 experiment: "shadow pass skipped" now uses `shadowMap.autoUpdate` instead of `shadowMap.enabled`. Changing `.enabled` changes every shader and recompiled the whole world, which showed up as the 2.3 s / 0.5 s bursts in the v095 reports (self-inflicted).
- `hitch.scene()` (also appended to the F7 report): draw-call breakdown. Walks the visible scene with the renderer's rules (visible flags, frustum) and lists, per kind of top-level object, draw calls, triangles, instanced / skinned meshes, distinct materials and geometries, shadow casters.

## Not changed
No gameplay, no draw-call reduction yet: see the breakdown in the reply to the v095 reports (buildings ~820 calls, loot containers ~800, zombies ~355, vehicles ~167).

---

# v097

- perf: OPTIONAL shared vertex-colour material for plain untextured building props (`js/props/mfzkit.js` `finish()`).
  Off by default. Enable with `?vc` on the URL. Building meshes drop ~25% (4722 -> 3514 across 49 buildings, headless);
  one extra shader. Lighting maths are identical (vertex colour x white). NOT yet verified on a real GPU: in the headless
  SwiftShader test the renderer process crashed intermittently with it on (never with it off), so it stays opt-in until
  you compare with `?vc` using F9 / F7 / `hitch.scene()`.
- Finding: building decor (`bdecor`) was already merged per material; the remaining ~1,600 building draw calls are
  distinct plain-colour materials plus textured ones, which is what `?vc` collapses.

---

# v098

- perf: shared vertex-colour material for plain untextured props is now ON by default (`?novc` turns it off).
  User test (RTX 3090, same town): draw calls 2892 -> 1992, frame 36.1 -> 27.3 ms, 28 -> 37 fps; building group 1866 -> 930 calls.
- hitchlog: shader-compile entries now say more about the material (ShaderMaterial uniform names / defines / blending; colour,
  roughness, metalness, envMap for lit materials) so the remaining first-sight compiles (weather particles, flora wind variants,
  depth materials) can be identified exactly.

---

# v099

- perf: loose loot containers, vehicles and prop groups are now hidden beyond 55 m / 85 m / 70 m (fog hides them past ~80 m anyway).
  They were only frustum-culled, so the whole street out to the horizon was drawn and shadowed (loot alone was 320-485 draw calls
  in view). `perfCull()` in perf.js; only objects this pass hid are re-shown. `?nofarobj` disables it.
- Headless check: 458 of 557 containers and 32 of 43 vehicles hidden from the spawn point.

---

# v100

- fix: concrete barricades (and other town-wide prop batches, "rgprop") popped in close to the player. Those groups hold many
  props at the origin, so the v099 distance cull measured from the wrong point. rgprop is no longer distance-culled.
- perf: loot/vehicle cull range now scales with fog density (full range only when fog is as thick as in rain).
- hitchlog F7: two new rows - "nothing drawn, scene still traversed" (pure three.js scene-walk cost) and "one cheap material for
  everything" (lighting/material cost) - to find where the ~26 ms of JS per frame goes.

---

# v101

- perf: light gate. The lamp pool + fire light (4 point lights) were always in the scene at intensity 0 in daytime, so every lit
  pixel still looped over them. F7 (v100): drawing everything with one cheap material took the frame from 26.2 to 18.5 ms
  (JS 23.4 -> 15.7, GPU 18.5 -> 9.5), scene traversal alone only ~7 ms. Now those lights are hidden while all are dark and shown
  (held 2.5 s) when any is lit. Both shader sets are compiled in the loading warm-up (`L.warm`), so switching never compiles.
  `?nolightgate` disables. Headless: lights hidden by day, no new programs after the game starts.
- Cost: warm-up compiles a second shader set (a few extra seconds behind "Press any key", ~more GPU memory for programs).

---

# v102

- revert: the v101 light gate is now opt-in (`?lightgate`). Your three v101 runs: normal frame 26.6 / 26.2 / 24.3 ms against
  26.2 / 28.8 ms in v100 - no real gain - and the warm-up grew from ~5 s to ~17 s. Point-light count is not the cost.
- hitchlog F7: new row "no object receives shadows" (per-object uniform, no recompile) to test whether the shadow-map lookups in
  the fragment shaders are the lit-material cost (cheap unlit material = 18 ms vs 26 ms normal).

---

# v103

- Your v102 F7: switching off shadow *receiving* changed nothing (24.9 ms either way) and neither did skipping the shadow pass, so
  shadows are not the lit-material cost. A single cheap unlit material still gives 17.3 ms vs 24.9 ms.
- hitchlog F7: three new rows swap one material class at a time for an unlit one (custom-shader materials; plain MeshStandard;
  Lambert/Phong) to show which class carries the ~8 ms. Report line "Per material class ..." sums them up.

---

# v104

- hitchlog: the F7 experiment now has 11 conditions and takes ~45 s (the unlit swaps compile a few extra shader variants, 1-2 s each,
  before each measurement). The start message says so and to wait for "Experiment done" before F10 (the v103 file was downloaded
  mid-run, so it had no per-material-class rows).

---

# v105

- Your v104 F7 (normal 24.0 ms): plain MeshStandard unlit 19.9 ms (-4.1), custom-shader Standard (world surface classes, flora) unlit
  20.6 ms (-3.4), Lambert/Phong unlit 23.8 ms (-0.2). So the PBR Standard shader is the cost; Lambert/Phong is cheap.
- OPT-IN `?lite` (perf.js `PERF.lite`, called from the loader before shader warm-up): plain Standard materials (no normal/rough/
  metal/ao maps, metalness <= 0.3, no custom shader) become Lambert (same colour, map, vertex colours, alpha, emissive). Loses PBR
  specular and environment light, so surfaces can look flatter/darker: judge the look, then F7. Headless: ~8,900 meshes swapped,
  ~7,100 Standard remain (world surface-class shader, metals).
- Next if it is worth it: a cheaper version of the world surface-class shader (the other ~3.4 ms).

---

# v106

- Render distance is now tied to fog. The Graphics > Atmosphere slider is renamed "Render Distance (Fog Density)" and runs 0-300%
  (was 50-200%). Exponential fog leaves exp(-(d*density)^2) visible, so everything beyond d = 2.3/density (about 99.5% fog) is culled:
  `perfCull()` in perf.js uses D = clamp(2.3/density, 18, 260) m for buildings, zombies/NPCs, loot (0.55 D), vehicles (0.85 D),
  detail and instanced tiles (their own ranges scale by D/100), and the camera far plane follows (D*1.2+15, 60-300 m).
  Slider 100% in clear weather = ~115 m; 150% ~77 m; 200% ~58 m; 300% ~38 m; 0% = no fog, 260 m (heaviest).
  Weather multiplies the density, so storms / fog days get a shorter distance automatically.
  Headless: slider 100/200/300/0 -> D 98/49/33/260 m, camera far 132/74/60/300, buildings drawn 14/3/2/55 of 55.
- `?noviewdist` restores the old fixed 100 m.
- Reverted: nothing. `?lite`, `?lightgate`, `?vc` unchanged (vc on by default).

---

# v107

- Default Render Distance (Fog Density) is now 150% (was 100%). Your v106 test, town centre, F7 normal frame:
  0% -> 17 fps (6276 calls), 50% -> 31 fps (2238), 100% -> 50 fps (717), 150% -> 60 fps (462, 13.7 ms), 200% -> 60 fps (426),
  300% -> 60 fps (449). A saved setting from before still wins; move the slider to change it.

---

