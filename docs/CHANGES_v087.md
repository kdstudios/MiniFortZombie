# Mini Fort Zombie v087: co-op fixes from the first real session

Everything in `docs/CHANGES_v086.md` still applies. The co-op protocol is now 2 and the version is 087: a host and guest on different builds are refused at the door.

## Fixed
1. **Zombies out of sync / invisible attackers.** The guest used to keep the zombies its own town build made and "adopt" the host's. Where the two builds differed, the guest kept stationary duplicates beside the host's puppets. The guest now throws all its own zombies away and builds every zombie from the host's record (type, style, place) when it first comes into view, so the two always agree whatever the town build did. Not proven to be the only cause: the real staged loading screen could not be compared in the test sandbox.
2. **No pausing in co-op.** While the co-op run is live `frozen()` is false and the main loop's `locked || invOpen || hqShown()` condition also accepts `COOP.run`. The pause screen still appears (you need it to get the mouse back) and says so; the world, zombies and your survivor keep going, so stepping away means standing in the open.
3. **Shared inventories.** The host's pack is mirrored to the guest and the guest's pack is the lent survivor's inventory on the host, both updated within about 0.3 s of a change. The survivor wheel on the other player goes straight to their inventory (follow/range were meaningless for a human); items can be moved both ways. A guest cannot command the host's followers. If both edit the same pack at once the person who owns the pack wins.
4. **Menu music** stays off while a guest loads into a co-op run (`menumusic.js`).
5. **Ready check.** `loader.js` calls `COOP.gate` before "Press any key": a host with a connected guest sees "Waiting on Guest...", a guest sees "Waiting on Host...". Once both are loaded the host's key press (`COOP.begin`) starts the run for both. Esc starts without the guest (host) or leaves (guest). Joining a run in progress skips the wait. The world is held until then.
6. **Body damage.** Head and limb removal is sent as events (live zombies and corpses) and every update carries each zombie's missing-limb flags, so a missed event heals itself. Kill events carry the limb flags, gibbed torsos are sent (`MFZGORE.gib`) and a list of existing corpses every 3 s removes ones the host no longer has. Guest hits on corpses are applied by the host (`corpseHit`).
7. **Bullet trails.** `addTracer` calls (real muzzle and hit points) are forwarded both ways, rate limited to about 30 per second.

## Tested (headless Chromium, scripted stand-in for the other player)
- Host: world held until begin; arm hit sends a limb event and sets the limb flag in updates; torso kill sends the kill (with flags) and gib events; guest pack shows in the survivor's inventory; trails sent; wheel opens the inventory; pause screen does not freeze the world and shows the note.
- Guest: gate waits then releases on begin; zombies built from records match the host's types (28 of 28); limb, kill-with-limbs and gib events apply; limb hit, trail and pack changes are sent; host pack mirrored and editable; host edits replace the guest pack with no echo.
- Pack sync emits only on a change (unit test). Single-player: unseeded builds still vary, fort builds, no errors.

## Not tested
- Real internet play and two real players; the real staged loading screen end to end; the host's own gunshot sound and trails on the guest; revived zombies; Esc paths of the gate.
- Prettier was not run. The generated wrapper table in `ARCHITECTURE.md` was extended by hand.

## Files
`js/layers/coop.js` (most of it), `js/game/core/13_campaign.js` (loop condition), `js/game/loader.js` (gate and begin hooks), `js/game/menumusic.js`, `js/game/core/01_items.js` and `index.html` (version).


## Update: up to four guests, container locks, crouch, join-code panel (version number unchanged, co-op protocol 3)
- **Up to 4 guests.** The host keeps one slot per guest (own connection, survivor, avatar and pack). Each guest gets a different survivor (the host can pick them per guest in the CO-OP panel; "auto" prefers a Scavenger; if there are not enough survivors the rest get volunteers). Guests see each other and the host as people in the world, and doors, trails and gunshots are relayed between them. A fifth joiner is told the room is full.
- **Survivor wheel.** Guests never get one and cannot command anyone. On the host, E (tap or hold) on a guest opens that guest's pack directly and live: what the host moves there reaches that guest within about 0.3 s, and the guest's own changes reach the host the same way. The wheel still works on the host's own followers. Guests no longer see or edit the host's pack.
- **Containers.** Only one person can have a loot container open at a time. A guest asks the host for it; the host hands over the current contents and locks it (everyone else sees "<name> is using this container"). When it is closed the new contents go to everyone. This removes the duplication and the lost items. Live shared editing of one container was not built.
- **Crouch.** Remote people lower their hips, lean and bend their legs while crouching (and walk slower), for the host and every guest.
- **Join code.** Shown on the left of the Options screen, only during a co-op mission, with the players listed.
- **Heartbeat.** The connection timeout ignores time the game itself was frozen (a long town build on a slow machine used to drop guests).

## Tested for this update (headless, scripted stand-ins)
- Four guests accepted and a fifth refused; distinct survivors; guests see each other (with crouch flag); container locking (grant, deny with name, release and broadcast, host blocked while a guest has it and the reverse); E on a guest opens their pack; relayed door, tracer and shot; per-guest pack edits reach only that guest; leaving removes only that guest.
- Guest side (unit): remote people from the snapshot, crouch pose and recovery, wheel and follow ignored, lock request then open then unlock on close, join-code panel visible only in Options during a mission.
- Not tested with real players or the real loading screen.


## Update 2: persistent guests, spectating, fort and siege (version number unchanged, co-op protocol 4)
**Bug fixes**
- **Crouch for survivors.** The game's own survivor walk animation ran after the crouch pose and overwrote it for guest avatars (the host looked fine on a guest's screen because those people are not in that animation). The crouch is now re-applied after it, and anything hung on the model root (skirts, coats) moves down with the hips.
- **Survivor choices.** Each guest's menu now offers *auto*, *volunteer*, *spectator* and every survivor (a survivor already with another guest is greyed out). A survivor chosen for one guest is never given to another guest by *auto*, so the host can reserve or protect survivors by picking *volunteer* or a named survivor.
- **Co-op menu in Options.** The join code panel on the left of the Options screen is now the host's co-op menu: code, who is in, what each is doing, the survivor choice and a **Kick** button (removes them from the room, no ban). The same rows are in the CO-OP panel at the HQ. Changing a choice during a run swaps that guest to the new survivor at once (their pack goes back to the old survivor, the old avatar is removed).

**Guests stay connected, fort and siege**
- Every world the host builds (mission, fort, siege) is seeded and announced to all guests, who build it too. Guests stay connected between worlds; nobody has to rejoin.
- **Back at the fort:** each guest keeps (or gets back) their survivor and can only look and run around (keys and clicks other than movement are swallowed). Survivors that live at the fort walk around for everyone. The fort needs no seed (it is the same every time); the barricades are sent with the world and kept in step (hit points, built and destroyed ones) every second.
- **Siege:** guests join the same siege and can fight (no restrictions); zombies come in the same way as on missions (built on the guest's side as they appear); barricade damage is shown. Sieges wait for the host's first key press like missions.
- **Leaving at the truck (E):** the screen fades to black, your survivor goes home with the pack (the host keeps it), you can no longer be attacked and you drop into a follow camera. **Q / E, arrow keys or a click** switch between the host and the other guests. The next world, you get the same survivor back.
- **Dying** works the same way: you watch until the host gives you a survivor in the co-op menu.
- **Joining a mission in progress:** you start as a spectator until the host assigns you a survivor or a volunteer from the co-op menu. Joining at the fort gets you a survivor straight away (auto or the host's choice).

**Tested** (headless, scripted stand-ins; the headless browser itself crashes in fort worlds after a few seconds, so those runs stop the frame loop): fort worlds for guests (survivors kept, fort copies of lent survivors removed, other fort survivors shown, barricade sync), assignment to volunteer, spectator and named survivors, kick, late join as spectator then assignment, truck leave, mission to fort with guests staying, guest builds a fort and a siege world from the host's message, barricade add/update/remove, key blocking for fort guests and spectators, the follow camera and switching, death then reassignment, fade and leave. The fort build is identical for different seeds and repeat builds.
**Not tested:** real internet play and two real players; the real loading screen for guests; anything over many minutes of a live siege (zombie waves reaching a guest, barricades being repaired by a guest are not possible at the fort); the survivors that live at the fort are shown to guests as people but a guest cannot interact with them.
**Known gaps:** a lent survivor's fort copy is removed when a guest takes them and is not restored until the next world is built; spikes are not synced.

**Fix: spectator camera jumping.** The follow camera used to be moved through the player position, which the game's own physics (ground height, wall pushing) kept resetting every frame. It is now placed just before each frame is drawn, independent of that physics, and swings round behind the watched player slowly (small turns ignored, at most about 1 rad/s), so a host who spins around no longer whips the picture about. Tested against deliberately fighting physics and a fast, spinning target: no sudden jumps.
