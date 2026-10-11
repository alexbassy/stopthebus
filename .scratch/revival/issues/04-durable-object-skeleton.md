# 04: Replace Fauna with a Durable Object (create, join, live players)

**What to build:** The first slice of the move from Fauna to Cloudflare. A new Game Durable Object, one per game, holds the game's state and speaks to the browser over a single WebSocket. In the web app the Fauna client, its realtime stream, the direct database calls and the create and join worker routes are replaced by a WebSocket connection that carries zod-validated messages from the shared package. The Fauna client is removed from only the create, join, leave and rename paths in this ticket. Later tickets move the rest.

The behaviour to reproduce is the create, join and leave section of the spec. A player creates a game from the home page, which sends the client-chosen game ID and the creator's player. The Worker routes the WebSocket for that game to its Durable Object, which stores the state and broadcasts the full game state to every connected socket whenever it changes. Opening a game URL connects, joins and shows the lobby with the live player list in two browsers. Renaming a player updates both. The Durable Object binds each socket to the player ID it joined with and rejects edits to any other player. The client reconnects automatically after a drop, retrying every 2 seconds up to 15 times, and resyncs from a fresh full state on reconnect. The existing connection indicator keeps working. An unknown game ID gives a clear "not found" response instead of creating a game implicitly.

This ticket also sets up the Worker for Durable Objects: the Wrangler config with the Durable Object binding and migration, local development against workerd, and the Worker routing for `/api/*` and `/ws/:gameId` alongside static assets. The Worker's routing uses Hono (replacing the dead `worktop`, which is removed from `apps/worker` once the last old route is gone).

**Blocked by:** 02, 03

**Status:** ready-for-agent

- [ ] Two browsers can create a game, join it by URL, see each other's names live, and rename themselves
- [ ] Joining after the pre stage is refused unless the player was already in the game
- [ ] A message that fails the shared schema, or edits another player's name, is rejected without breaking the connection
- [ ] A dropped socket reconnects and resyncs; the connection indicator reflects it
- [ ] Opening an unknown game ID shows a not-found screen
- [ ] A Vitest test drives the Durable Object through create, join, rename and a rejected edit
- [ ] No Fauna code is called from the create, join, leave or rename paths

**Note (done):** The Vitest test drives `GameRules` (the logic behind the Durable Object) with fake storage and sockets, not the `Game` class itself, because `@cloudflare/vitest-pool-workers` needs Vitest 4 and the repo is on 5. The thin `game-object.ts` layer (upgrade, hibernation attachment, storage) is covered only by a manual workerd run. Revisit when pool-workers supports Vitest 5.
