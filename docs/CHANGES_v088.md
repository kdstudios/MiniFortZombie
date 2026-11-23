# Mini Fort Zombie v088: loading performance

Everything in `docs/CHANGES_v087.md` still applies. This version is only about the freeze and stutter when you enter a world (Fort HQ, a mission map, a siege, a loaded save, Dev Mode worlds). Nothing about gameplay or looks changed. Co-op players need the same build: the version number moved to 088.

## What was wrong (measured)
Measured headless with a software GPU, so the times are much higher than on a real graphics card, but the proportions hold.

1. **All GPU work happened on the first frame.** The loading screen built the world and compiled shaders. Then the first frame drawn uploaded every texture and vertex buffer it could see. three.js also checked every shader for errors straight after linking it, which makes the browser wait for each one in turn. A mission's first frame took 6.5 s, mostly uploading textures. The fort, siege, save load and Dev worlds never went through the loading screen, so they compiled every shader on their first frame too (fort: 52 shaders, 1.9 s; All Props: 87 shaders, 6 s).
2. **Every world threw away the last world's GPU work.** `clearWorld` (perf.js) disposed every material, its texture and every geometry of the old world. Most of these come from caches (prop kit, world surfaces, merged materials, car templates, painted signs) and the next world uses them again. So every trip (fort → mission → fort → mission) recompiled about 80 shaders and re-uploaded about 450 textures.
3. **Too many shader variants.** The prop kit's tri-planar surfaces wrote their tile scale into the shader text (about 20 shaders that differ only by that number). The world surface layer wrote the surface class into the shader as a `#define` (about 45 more). A town compiled about 125 shaders.
4. Smaller costs: the town validation walked every vertex of every building (about 250 ms per mission). The procedural retro cars recomputed the same body cross-sections thousands of times. The viewmodel gun was built and its sights measured on the first frame.

## What changed
- **GPU warm-up (`js/game/loader.js`, `MFZLOAD.warm`).** It runs behind the loading screen, a slice per frame, so the bar keeps moving:
  1. `renderer.compile()` queues every shader without waiting (`renderer.debug.checkShaderErrors` is now off; add `?shadercheck` to the URL to turn the error log back on). With `KHR_parallel_shader_compile` the driver builds them on its own threads while the loader polls. Without it, they finish one at a time between frames.
  2. Every texture the scene uses is uploaded with `renderer.initTexture()`.
  3. One full render with frustum culling off, so geometry, shadow and post passes are ready whichever way you look.
  
  It also sets the lights to their in-game state and builds the equipped gun first.
- **Every way into a world is warmed.** The mission loader warms after `go()`, so your survivors and gun are included (bar: build 0-85 %, warm-up 85-100 %). Every other build (fort, siege, save load, Dev worlds, co-op rebuilds) is caught by a `WB.post` hook (`MFZLOAD.afterBuild`). That hook shows the loading overlay ("Loading...") over the HUD until the warm-up is done. If there is nothing to compile or upload, no overlay is shown. While `MFZLOAD.busy` is set nothing is drawn and the world does not advance (`animate()` in `13_campaign.js`), so zombies cannot act behind the overlay. The menu town warms after its own dead are removed (`menuworld.js`).
- **Resources are kept between worlds (`js/game/perf.js` `clearWorld`).** Materials are never disposed: they hold no GPU memory of their own, only a share of a compiled shader, and there is a small fixed number of shaders. Geometries and textures from the old world are checked at the next warm-up (`PERF.flushDisposals`). Anything the new world uses stays. Anything unused gets one more world of grace (mission → fort → mission reuses most of the first mission's textures). After that it is freed. The check runs before the new world's uploads, so GPU memory never holds more than one world plus what that world reuses. A world that is never warmed is flushed 4 s after it was cleared.
- **Shader variants collapsed.** `mfzkit.js` `K.tri` passes its tile scale as the uniform `uTriS` (one shader for every tri-planar surface). `world.js` passes the surface class as the per-material uniform `uRgTc` (the `RG_TC` define is now `RG_CLS`; `userData.rgTc` holds the class for code that checked the define). A town now compiles about 68 shaders instead of about 125. Pixels are unchanged.
- **Town validation fast path (`07_town.js` `checkPlacement`).** If the 8 corners of a mesh's bounding box are inside the plot, the mesh is inside, so the per-vertex walk is skipped. Only meshes that poke out get the exact check. The results are the same.
- **Retro cars (`tools/retro50_src/r50_core.js`, rebuilt into `js/modern/retro50.js`).** The body and cabin cross-section functions remember their results per z. Car generation is about 1.9× faster and the geometry is byte-identical (hash-checked over all 33 kinds, plain and wrecked).

## Results (same headless machine, software GPU)
| Entering | Before: shaders compiled on the first frame / textures | After: new shaders / textures (uploaded during the loading screen) | First frame after |
|---|---|---|---|
| Fort (new game) | 52 / about 30 (1.9 s stall) | 5 / 9 (warm-up 0.3 s) | 7 ms |
| First mission | 76 / about 580 (6.5 s stall) | 3 / 191 (warm-up 0.6 s) | 75 ms |
| Back to the fort | 45 recompiled | 0 / 4 | 8 ms |
| Second mission | 80 / about 450 | 0 / 159 | 30 ms |
| Siege | full recompile | 1 / 4 | 6 ms |
| Dev: All Props | 87 (6 s in shader linking) / 374 | 3 / 284 (warm-up 0.5 s) | 16 ms |

Shooting, blood, kills, melee, fire and new zombies after the warm-up compile no new shaders.

The title screen's "Waking the dead" bar now also warms the menu town (about 680 textures; 4 s on the software GPU, far less on a real card). The first mission reuses almost all of them.

## Tested
- Headless Chromium (SwiftShader): title → new game (fort) → mission → fort → mission → siege → Dev All Props in one session. No page errors or new console errors. The usual town-validation and bounding-sphere warnings appear in v087 too.
- Seeded mission screenshot against v087 from the same spot: buildings, cars, textures and lighting match. The only differences are grass and flower sway and the gun's idle bob (time-based animation).
- Car geometry hash identical to v087.

## Not tested
- A real GPU and the Windows launcher, and real co-op sessions (the co-op loader paths go through the same `MFZLOAD.mission` / `go()` code).
- How long the title screen warm-up takes on low-end hardware.

## Files
`js/game/loader.js` (warm-up, auto warm-up hook), `js/game/perf.js` (kept resources), `js/game/core/13_campaign.js` (no updates while busy), `js/game/menuworld.js`, `js/props/mfzkit.js`, `js/layers/world.js`, `js/game/core/07_town.js`, `tools/retro50_src/r50_core.js` + `js/modern/retro50.js`, `js/game/core/01_items.js` and `index.html` (version).


## Update: frame rate (version number unchanged)
The aim was a higher frame rate when the most is on screen. The test view was the town centre on maximum settings (detail Lush, particles High, bloom Strong, full architecture, quality High). Measured headless on a software GPU, frame by frame.

### What a frame cost (before)
- **2,630 draw calls and 2.69 million triangles.** Half of that was the sun's shadow map, which was redrawn from scratch every frame.
- **Every car in town was drawn every frame**, in the view and in the shadow. The retro vehicles were built with culling off and were never part of the distance cull.
- **Ground cover, trees and shrubs** were one instanced mesh per kind spread over the whole map. three r147 cannot cull those, so all of them were drawn every frame.
- **Street furniture and debris** were merged into a few meshes per material spanning the whole map. They could never be culled, and every use-prompt ray (10 times a second) and every shot walked all of their triangles: about 21 ms per ray on the test machine.
- **Every lit pixel ran the full lighting model for five lights that give no light.** By day these are the torch, the street-lamp pool and the muzzle-flash light.
- three recomputed the matrix of all ~10,000 objects every frame, and the HUD rewrote about a dozen text fields every frame with the text they already showed.

### What changed (all in `js/game/perf.js` unless noted)
- **Cached sun shadow.** Static casters are drawn into the shadow map only when needed, then copied (colour and depth) to a second target. On other frames that copy is blitted back and only the moving things are drawn on top, with the depth test against the static depth.
  - **Moving things:** zombies, corpses, survivors, NPCs, followers, drop boxes, carried items, limbs, wind-swayed trees, anything added after the world was built, and anything seen to move.
  - **The static pass reruns** when the world changes, the player is 6 m from where it was drawn (the light is held there meanwhile, so map and lighting always agree), the sun turns 0.25°, a door swings, a window breaks, the distance cull changes something, or a static object moves or disappears.
  - **Checked against a full redraw:** identical shadow map (all 16.7 million bytes) with zombies moving and a door swinging.
  - **Kill switch:** `?noshadowcache` in the URL.
- **Vehicles and prop batches are culled.** They get NaN-safe bounds (`PERF.safeSphere`), frustum culling back on, and the same 100 m distance cull as buildings.
- **Prop batches are split into 48 m cells** (`js/layers/props.js` `batch()`). Same props and materials, one mesh set per cell, culled per cell.
- **Instanced ground cover and flora are tiled** (`PERF.tileIM`, used by `detail.js` and `flora.js`). Each tile has a proxy geometry that shares the original buffers but carries its own bounding sphere, so three culls tiles against the view and the shadow camera. Ground cover tiles (24 m) hide past 75 m; trees (32 m) past 110 m, like buildings.
- **Dark lights are skipped in the shader.** `lights_fragment_begin` is patched once at load: a light's contribution is skipped when it is zero (off, out of range or outside the cone). The math is the same, so the result is too.
- **Static matrices are frozen** (`freezeStatic`, after the optimise pass). Cars, lot decor, prop batches, merged meshes and the instanced tiles compute their matrix once. The scene root no longer forces every child to recompute. Anything that moves keeps updating.
- **Short rays skip far meshes.** `scanRay` skips a mesh whose bounds lie wholly beyond the ray's range. `look()` takes a range, and the use prompt (`hud()`, `13_campaign.js`) asks for 3.6 m. The prompt ray went from about 21 ms to 1 ms.
- **The HUD skips unchanged text.** Setting `textContent` to the text a node already shows is skipped (patched on `Node.prototype`).

### Results, town centre, maximum settings
| | Before | After |
|---|---|---|
| Draw calls per frame | 2,630 | 1,330 |
| Triangles per frame | 2.69 M | 0.68 M |
| Sun shadow pass | 1,313 calls / 1.43 M triangles, every frame | 271 calls / 0.17 M (moving things only); a full pass about once per 10 s standing, more often while walking |
| JavaScript per frame (game + render submission) | 100 % | about 50 % |
| Use-prompt ray | about 21 ms | about 1 ms |

The biggest cost left is the zombies: about 18 meshes each, 267 draw calls in the view and 213 in the shadow at the test spot. They animate per part, so they can't be merged without rebuilding them as skinned meshes.

The gun and hands are drawn twice a frame, once into the post-processing buffer and once over the final image (85 meshes each time). This was left alone because the first draw feeds the bloom around the gun.

### Tested
- Seeded mission screenshots at three spots against the version before this update: everything matches. The only differences are wind sway and the radar (zombie positions).
- Point light and torch on and off, rendered synchronously: each light adds the same brightness in both builds.
- Shadow map cached against full redraw: identical, including moving zombies and a swinging door. After a kill and an 8 m walk the difference is the same as the ragdoll's own motion between frames.
- Title → fort → mission → fort → mission → siege → All Props: no errors, and loading is unchanged.

### Not tested
- Real GPUs: only relative numbers from a software GPU.
- Co-op sessions (remote players have kind `surv` / `npc` and are treated as moving; anything else that moves is detected and switched to moving).


## Update 2: zombies (version number unchanged)
Feedback after the first frame-rate update: towns were still at 31-35 fps, and hiding the zombies gave 50-60. Measured with 30 zombies chasing the player at the town centre (maximum settings), each zombie was **18 separate meshes**: 18 draw calls in the view and up to 18 in the sun shadow. That came to about 800 draw calls, most of the frame. Zombies also bang on doors, and every door shake forced a full redraw of the cached sun shadow.

### What changed
- **One skinned mesh per zombie for rendering (`js/layers/zbatch.js`, new).** Each zombie gets a render-only `SkinnedMesh` that merges its part meshes, one group per material (about 4 draw calls instead of 18).
  - **The parts are its bones.** The skeleton reads the parts' world matrices every frame, so animation, ragdolls, knockdowns, climbing, crawling and corpses drive it unchanged.
  - **The original parts stay in place for gameplay.** Hits, aimed parts, rays and gore still use them. They are only taken out of rendering, through a layers test that answers no to the render cameras (main camera and sun shadow camera) and yes to raycasters.
  - **Hidden or removed parts disappear from the merged mesh.** A cut-off limb or shot-off head collapses to nothing. Anything added to a zombie later (stumps, held weapons) renders normally. A part whose geometry or material is swapped rebuilds that zombie's merged mesh.
  - **Merging timing.** All zombies are merged before the loader compiles shaders, and new ones (siege waves, co-op puppets) up to 6 per frame. Merged meshes of zombies gone from the world are freed after about 5 s. Zombies hidden by distance (past 80 m) skip the per-frame matrix update.
  - **Kill switch:** `?nozbatch` in the URL.
- **Doors move with the moving things in the cached sun shadow (`perf.js`).** A building with doors stays in the moving pass with everything but its door pivots hidden, and the static pass hides the pivots. Door swings and shakes no longer force a full shadow redraw. Full redraws went from about 60 % of frames to about 8 % with zombies at the doors.

### Results (30 zombies chasing, town centre, maximum settings)
| | Before any v088 frame work | After update 1 | After update 2 |
|---|---|---|---|
| Draw calls per frame | 2,731 | 2,181 | 1,140-1,180 |
| Zombie draw calls (view + shadow) | ~800 | ~480 | ~190 |
| Triangles per frame | 2.74 M | | 0.80 M |

### Tested
- **Close-up of three zombies, one with an arm cut off,** against the build before this update: identical apart from the HUD prompt line.
- **Shadow map, cached against a full redraw:** a few texels differ where a door's edge has the same depth as its frame (equal-depth ties, no visible difference). After a kill and a walk, the difference matches the ragdoll's own motion between frames.
- **Shaders:** the zombies' skinned variants compile during the loading-screen warm-up.

### Not tested
- Real GPUs, co-op puppets, and long sieges (merged meshes are freed as corpses are cleaned up).
