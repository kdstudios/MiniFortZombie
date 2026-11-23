# Mini Fort Zombie v092: more main menu scenes, custom textures, custom sounds and music

Everything in `docs/CHANGES_v091.md` still applies. No save format or co-op protocol change.

## 1. Main menu background: 12 scenes (was 6, of which 2 never showed)

The menu town had no church and its cemetery scene could not find a road, so only four of the six old scenes ever played. The town planner now takes a list of buildings a caller needs (`window.TOWN_MUST`, read by `planTownV2`); the menu asks for a church, the cemetery, PIZZABYTES, the motel, the gas station and the playground park. The seed is the same, but the town is laid out differently from v091 because of it.

Running order (each 10.5 s, fading through black):

| # | Scene | What happens |
|---|---|---|
| 1 | **The congregation** (new, always first) | 13 of the dead drift together in front of the church from every side of the street, very slowly; a low camera slides in and tilts up the tower |
| 2 | **The graves** (new) | A pan at grass height down an aisle of headstones. Four zombies asleep on their backs on the plots, three slumped sitting. One climbs out of the burst-open grave part-way through and shambles into the aisle |
| 3 | **PIZZABYTES** (new) | A long zoom across the street onto the neon sign (field of view 60° to 30°), customers still pawing at the door |
| 4 | Worm's eye | (old) lying in the road as they walk over you |
| 5 | **The bird** (new) | A slow turn 20 m above the crossroads, the dead as small figures converging below |
| 6 | Park | (old) the legless one in the playground |
| 7 | **The follower** (new) | Close behind one walker's shoulder as it heads down the middle of the road towards a waiting group |
| 8 | Gas station | (old) |
| 9 | **The pool** (new) | From the edge of the motel pool, one of them wading through the water |
| 10 | Main street | (old) |
| 11 | Church crane | (old; it shows now that the town has a church) |
| 12 | Cemetery corner | (old; only if the cemetery plot faces a road it can find) |

New in `js/game/menuworld.js` for anyone adding scenes: a shot can zoom (`fov: t => ...`), an actor can sleep (`sleep: 'lie' | 'sit'`), wake (`wakeAt: seconds`), stand on an exact spot (`exact`) and walk through things (`ghost`). Water keeps moving behind the menus.

## 2. Options > Game Assets: Icons, Custom Textures, Custom Sounds

The page is now three headings that open one at a time. Each shows how many of its items are custom. **Icons** is the old custom-icon page, unchanged, under its own heading. The two new ones work the same way: name a file after an ID, import any number of files at once, export the defaults, clear them all, filter by group, page through tiles, remove one at a time.

### Custom Textures (100 slots)
- Buttons: **Import textures**, **Export default textures**, **Clear custom textures**.
- Filters: All, Ground, Walls, Wood, Roofs & metal, Fabric & misc, Normal maps, Characters, Effects, Custom only.
- Slots: 47 world surfaces (`brick.png`, `asphalt.png`, ...), their 47 normal maps (`brick_n.png`), `zombie_skin`, `zombie_camo`, `zombie_normal`, `zombie_rm`, `survivor_skin`, `fire_strip`.
- A change shows at once, in the world you are standing in.
- The export is a zip of 100 PNGs and a README (about 49 MB).

Limits shown to the player:
- PNG, JPG or WebP; 16 MB a file; 4096 x 4096 px.
- World surfaces are stored at 512 x 512: other sizes are resized, non-square images are stretched, and they must tile.
- The game tints each surface towards its building's colour, so detail and contrast carry over more than hue.
- Normal maps: only red and green are read. Roughness and ambient occlusion cannot be replaced.
- Character textures are atlases: keep the layout. Transparency is ignored.
- Not replaceable: props, furniture, vehicles, weapons, the sky, the interface.

### Custom Sounds (34 slots, music included)
- Buttons: **Import sounds**, **Export default sounds**, **Clear custom sounds**.
- Filters: All, Zombies, Weapons, World, People, Interface, Ambience, Music, Custom only.
- **MP3 and WAV.** The file's content is checked, not just its extension.
- Every tile has a play button (plays the custom sound if there is one, else the default).
- Variants: `groan.wav`, `groan_2.wav` ... `groan_9.wav`; the game picks one at random each time.
- Music: `music_menu` replaces the menu track, `music_game` and `music_siege` replace the generated notes with a looping track that fades in and out with the game's music mode. The Options > Sound sliders still apply.
- The game's sounds are made by code, so **Export default sounds** records each one to a WAV (31 effects, a minute of in-game music, 24 s of siege music) and adds the menu MP3 and a README. About 13 MB.

Limits shown to the player:
- Sound effects: 8 MB and 30 seconds a file. Music: 80 MB a track.
- MP3: MPEG-1/2 Layer III, constant or variable bit rate, 32 to 320 kbps.
- WAV: uncompressed PCM, 8 / 16 / 24 bit or 32 bit float. Compressed WAV may not load.
- Mono or stereo, any sample rate; converted to the sound card's rate, so above 48 kHz gains nothing.
- Effects are held uncompressed in memory (about 11 MB a minute of stereo).
- MP3 has a short silence at the start and a gap when it loops: WAV for sharp sounds and for seamless music.
- World sounds are faded by distance and panned by the game: mono and dry works best. Volumes are not levelled.
- Not replaceable: the staged reload sounds of the detailed gun handling, wind, rain, water splashes.

### Where it is kept
In the browser (IndexedDB `mfz_assets`), like the icons (`gf_icons`). Not in save games; co-op partners do not get your files; clearing site data removes them.

## Code
- New: `js/game/assets.js` (`MFZASSETS`, `MFZTEX`, `MFZSND`), loaded after `menumusic.js`.
- `index.html`: the Game Assets page markup. `css/ui.css`: the headings and lists.
- `js/game/core/03_audio.js`: the generated music moved into `musicNotes(mode)` (so it can be recorded and switched off when a custom track plays). Behaviour is the same.
- `js/game/core/07_town.js`: `planTownV2` honours `window.TOWN_MUST`. Unset in normal play: towns generate as before.
- `js/game/menuworld.js`: the new scenes. `js/layers/water.js`: water also runs behind the menu.
- `js/layers/fire.js`, `js/modern/survivors.js`: one line each to expose their texture.
- Dev Mode: nothing to add (no new spawnable content).

## Tested (headless Chromium, software GL)
- Menu town builds with all six required buildings; 11 of 12 scenes are created (the old cemetery corner is skipped in this town). Every new scene was rendered at two or three moments and looked at. No page errors.
- Textures: import (valid, wrong name, wrong type, wrong size), live replacement of a world layer and of the zombie atlas, the surface's average colour updating, remove restoring the exact default, export (100 files), and all of it surviving a page reload.
- Sounds: import of WAVs (valid, variants, too long, wrong name, fake MP3, variant on a music slot), custom sound playing instead of the synth, music slot detection, every play button, export (34 files), surviving a reload.

## Not tested
- **By ear.** No sound was listened to: not the custom playback, the exported WAVs, nor the music cross-fade in a real game.
- A real MP3 import (the test used generated WAVs; MP3 goes through the same browser decoder, and the fake-MP3 rejection was tested).
- Custom `music_game` / `music_siege` during an actual expedition and siege.
- Custom textures on a real GPU, and the hitch when one world layer is replaced (the whole 47-layer array is re-uploaded).
- The scenes in motion at full frame rate, and the Play MFZ.exe wrapper.
