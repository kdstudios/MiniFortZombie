# Mini Fort Zombie v079: HUD size, sights, aimed melee

## Options
- **Graphics > Display > In-game HUD size** (50 to 150 %, default 100 %). It scales only the HUD you see while walking around the Fort and towns: clock, operation panel, compass, companion orders, body status, health and stamina, radar, weapon panel, prompts and toasts. Menus, containers and the HQ are not affected. It multiplies the existing window-size scaling and is saved in this browser (`mfz_hudsize`). Code: `js/layers/hudui.js` `scale()`.
- The **Icons** tab is now called **Game Assets** (side button, breadcrumb and the main-menu hint).

## Fort HQ
- **Rest until morning** is now **End Day**. It is red and sits on the right, where Enter fort was.
- **Enter fort** sits to the right of Skills and is no longer red.

## Town map
- No distances. The pin panel only shows the travel time ("Travel time: 2h 25m each way"). The "½ mile" scale bar is gone from the map.
- The black dot at the foot of each pin is half the size.

## Zombies
- Memory halved again. After losing sight of you, a zombie now hunts your last-known spot for 2 s × the Sneak modifier (was 4 s). Every other "remember where you were" timer is halved too: noise 4 → 2 s, being hit 4 → 2 s, waking 5 → 2.5 s, an armed zombie losing its aim 10 → 5 s, a knocked-over zombie 3 → 1.5 s.

## Fire
- Flame sprites now follow your view. Each flame quad turns toward the camera from its own position (so the side flames of a wide fire face you too) and tilts toward you when you look down or up at it, pivoting on its base. The tilt stops at about 70°.

## Melee
- **The part you aim at is the part you hit.** Whether the blow lands is still the skill roll (`skMeleeHit`), and dismemberment is still a random chance, but the body part is now the one under the crosshair instead of a random pick.
  - The view ray is cast against the target's own meshes, and the first body part it meets is the one hit (head, left or right arm, left or right leg; anything else is torso).
  - If the crosshair is just beside the body but the zombie is in reach, the part comes from where the ray passes the zombie: height for head, torso or legs, and the side for arms or legs.
  - A limb that is already gone counts as torso. The same rule applies to melee on corpses.
  - Code: `meleeAimPart()` in `js/game/core.js`.

## Guns
- **Ironsights checked on every gun.** Each gun was rendered at full aim and the top of the front sight measured against the screen centre. Revolvers were about 12 px high (the frame covered the aim point), and the Glocks, Tommy gun, AR90, Lee-Enfield, M1911 and shotguns were 1 to 6 px off. Now every one is at 0 px. Fixes:
  - **Automatic calibration.** `calibrateSight()` in `js/layers/gunplay.js` measures each gun's real front-sight tip once, when the gun is built, and puts it exactly on the aim point.
  - **Model fixes** in `js/modern/guns.js`, where the model blocked the sight line:
    - Colt revolvers: the hammer spur stays under the sight line.
    - Python: the adjustable rear sight has an open notch.
    - Glock: the rear sight is cut into two halves around a notch.
    - Tommy gun: the front blade reaches the rear bar, and the top charging knob and rear dot are lowered.
    - AR90: the peep base no longer fills the aperture.
  - **Lee-Enfield:** the front post is lowered onto the aperture centre.
  - **No drift at full aim.** Turning-sway and walk-bob fade to zero on the sights, so they stay on the aim point; they used to keep 20 % and 15 %. Recoil kick still plays and settles back.
  - The Model 70 keeps its scope overlay.
- **Interrupting a round-by-round reload.** On guns that load one round at a time (revolvers, pump and double-barrel shotguns, combat shotgun, Model 70), press Reload again during the reload to stop it. Rounds already loaded stay in the gun. Holding the key does not toggle it; the first 0.18 s of a reload ignore a second press.
- **Ammo readout** shows rounds in the gun / rounds in your inventory (e.g. `13 / 133`). The magazine capacity is gone. Low-ammo and empty colours still work.

## Crosshair
- The crosshair hides while aiming down the sights or zooming.
- The cross lines are gone; the crosshair is just the small ring. It still turns red when a zombie is in melee reach.
- While crouched and aiming, the stealth eye hides its pupil so nothing sits over the sights; the eye outline still shows.

## Tools
- `RGX.getGun`, `RGX.GUNS` and `RGX.ensure` are exposed for the sight-alignment check (render each gun at full aim and measure the front-sight tip against the screen centre).

Version is 079 in the page title, menus and `VERSION`.
