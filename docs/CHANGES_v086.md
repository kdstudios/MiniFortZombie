# Mini Fort Zombie v086: online co-op on map missions

One friend, anywhere, plays one of your survivors on a map mission. New file: `js/layers/coop.js` (loads after `loader.js`). Nothing else in the game was rewritten; the layer wraps functions (list at the end of `ARCHITECTURE.md`).

## How to play
- **Host**: at the HQ town map press **CO-OP** (bottom right), *Open a room*, pick the survivor to lend (a volunteer is used if you have none), give the 5-letter code to your friend, then plan and *Drive out* as normal.
- **Guest**: main menu > **Join Co-op**, type the code (or open the game with `?coop=CODE`). You load into the same town and start at the truck. A friend can also join a run already in progress.
- At the truck the guest presses E to go home with their pack (it goes back into the lent survivor). If the lent survivor dies, they are dead on the host's roster like any companion.
- Needs internet and the same game version on both sides. PeerJS is loaded from jsDelivr only when a room is opened or joined; single-player never loads it.

## How it works
- **Host-authoritative.** The host runs every zombie. The guest never runs zombie AI.
- **Same town from a seed.** The host picks a seed when the drive starts; `worldSteps` is wrapped so every build step draws from one seeded stream (the mission site has its own sub-seed, as Dev Mode does). Both sides then compare a signature (buildings, collision boxes, doors, containers and their contents, survivors, zombies). The guest warns if it differs.
- **Cold-cache fix.** The first build of a session differed from later ones: one-time caches (melee model textures in `modelFor`, outfit palettes in `makeHuman`) drew random numbers and shifted the stream. Both now run on a private random stream. This also touches single-player: zombie and survivor looks come from that stream, not the world's.
- **Zombies.** The guest keeps the zombies its own seeded build made and adopts them by id (`u.cid`, build order). From about 10 snapshots a second (zombies within 95 m of either player) it only moves them and plays the existing walk animation. Zombies spawned later are sent as new records. Kills, dismemberment and blood arrive as events.
- **The guest's survivor.** On the host it is a companion mesh that is in `smesh` but not in `comps`: the game's own zombie code attacks it and lowers `s.hp`, and there is no AI driving it. The guest controls it with their own camera, weapon and pack (`PINV`). Heals the guest uses are sent to the host; damage is the host's call.
- **Shooting.** The guest fires locally; `hitZ` / `dmgZ` on a zombie become a hit claim the host applies with the real functions (rate limited, damage clamped). Gunshots wake zombies on the host and are heard and seen (tracer) by both players.
- **Shared.** Doors (open, close, break, unlock), loot container contents (whole-list, last writer wins), rescuing survivors (the guest asks, the host recruits), the clock.

## Tested (headless Chromium, one browser at a time, scripted stand-in for the other player)
- Two independent builds from the same seed in separate browser sessions gave identical signatures, twice (140 and 147 zombies, all adopted).
- Host: room, handshake, start, roster, avatar follows poses, guest hit kills the right zombie and sends events, zombie damage to the lent survivor reaches the guest, heal, door and container updates, pack merged back on leave.
- Guest: pack and equipped weapon loaded, snapshots applied, host shown as a person, hit and damage claims sent, kill event applied, doors both ways, end screen.
- Single-player: unseeded builds still vary, fort builds, menu button present, no errors.

## Not tested / known limits
- Real PeerJS over the internet, and two real players at once. `?coopnet=local` (same browser) and a test bridge exist for development.
- The host's start through the real staged loading screen was only partly run (the town built and signed; the run was cut off before the avatar step).
- No relay or TURN server: peer-to-peer fails on some strict networks.
- Zombies far from the host's player are updated less often by the game's own level-of-detail code, so they move more choppily for a guest who is far away.
- Not done: more than one guest, host migration, spectating after death, syncing barricades, fire, vehicles and corpses, siege.
- Prettier was not run (not installed offline). The wrapper table in `ARCHITECTURE.md` was extended by hand (acorn missing).
