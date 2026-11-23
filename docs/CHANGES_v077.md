# Mini Fort Zombie v077: new in-game HUD

The gameplay HUD now matches the menus, containers and HQ. It uses the same "field kit" theme: dark steel panels with cut corners, film grain, blood-red and hazard-amber accents, and the MFZ Head typeface. It follows the UI concept art. All icons are new SVGs drawn for the HUD. They are inline, so there are no image files.

New files:
- `css/hud.css`: the styles.
- `js/layers/hudui.js`: builds the frames and icons and does the per-frame touches.

The version is 077 in the page title, both version labels and `VERSION`.

## What is where
| Block | Look | Notes |
|---|---|---|
| Top left: clock | Red-edged, glowing panel with a big clock, SIEGE IN N DAYS in red, and the HQ with a map-pin icon | |
| Operation | Crosshair icon, OPERATION in red, the objective | Keys in the text show as amber key caps |
| Mission / Rumors | Same frame with a checkbox icon | Confirmed sites get a green tick |
| Top centre: compass | Wide bar with tapered ends, tick marks every 15 degrees and a red needle. The fort (amber) or the truck (green) shows as an icon on the bar | Same headings as before |
| Top right: companion orders (1-5) | Short, Medium, Far, Follow, Stay tiles with icons (range rings, binoculars, group, shield) and the hotkey number. Active orders light up red | Still only shown with companions |
| Bottom left: body | The wound figure in a tall hexagon frame: green / amber / red per limb, white flash when a limb is hit | Same wound model as before |
| Health | Heart icon, red-edged arrow bar, segmented red fill | Pulses below 25% |
| Stamina | Bolt icon, green-edged arrow bar, segmented green fill | Goes grey with "WINDED" while sprint is locked (v076 rule: back at 50) |
| Bottom centre: radar | Octagon frame with red corner marks and a north tick | Same radar, drawn at twice the resolution, so it's sharper |
| Bottom right: weapon | Slanted slab with red slash accents, the weapon name, its slot [2/3] in red, the ammo type, the weapon picture, a bullet icon, a big clip count and the reserve | Clip turns amber at 25% or less and red when empty. Melee weapons show MELEE |
| Look-at prompt | Amber-edged panel under the crosshair | [E] becomes a key cap |
| Messages | Framed cards on the right, in three kinds: amber info (i), green success (tick), red alert (triangle) for shouted messages and the horde | |
| Fort building hint | Key caps | |
| Other elements | Action bar (search / lockpick) and the crosshair (small ticks added) restyled to match | The crosshair still turns red in melee reach |

The weapon picture is the inventory icon with its square backdrop removed, so the gun sits on the panel. Custom icons from Options > Icons are used too.

## Scaling
The whole HUD scales with the window. The scale is 1 at 1600 x 900, never below 0.62 and never above 1.3. It was checked at 1600 x 900, 1280 x 720 and 1024 x 640.

## Nothing else changes
Every element the game writes to keeps its id: clk, tts, fn, obj, day, cs, cm, cm2, cc1-5, hpv, hpb, stv, stb, mm, wsp, wn, ac, ar, pr, tw, tip. Core, skills, missions, the save system and the Dev toolkit keep driving the HUD as before. The new layer only adds frames and icons, redraws the compass strip and mirrors the prompt, objective and weapon text into styled markup after each `hud()` call. F8 diagnostics move to the top right so they don't cover the operation panel.

## Tested (headless browser)
- The HUD was screenshotted in each mode with no script errors:
  - expedition, with companions, low health, winded, all three message kinds and a gun;
  - fort building, with fists and the fort hint;
  - siege, with an empty clip.
