# Revival: move Stop the Bus off Fauna onto Cloudflare

**Status:** agreed in a grilling session; tickets in `issues/`.

## Problem

Stop the Bus hasn't been played in a long time and is stuck on old tooling. FaunaDB has shut down, so the app can't run at all. The browser also talks to the database directly with a public key, and the dependencies (Next 12, Wrangler 1, Jest 27, TypeScript 4.5, ESLint 7) are years out of date.

## Goal

A working, deployable revival of the game on Cloudflare, with current tooling and a smaller, simpler architecture. Gameplay stays the same, apart from the removal of timer mode.

## Decisions

### Backend

- One **Durable Object per Game** holds all game state. Clients connect to it over a single WebSocket.
- Every mutation is a message over that socket. There are no REST routes and no stored database functions.
- Cross-region play is fine. A Durable Object lives in one data centre, so distant players see roughly 100–150 ms of latency, which the game tolerates.
- The model is new. Nothing is migrated from Fauna and old game URLs stop working.
- A game's storage is deleted by an alarm 24 hours after its last activity.
- **Trust:** each socket is bound to the player ID it joined with, and can only change its own name and answers. Config, scoring and starting a game stay open to everyone. There is no real auth.
- Every incoming message is validated with zod at the Durable Object boundary. The client also parses server messages.
- The ADR is `docs/adr/0001-durable-objects-for-game-state.md`.

### Frontend and hosting

- Next is replaced by **Vite, React and wouter** (a small client-side router). There is no SSR. The app needs JavaScript and SEO doesn't matter, and the app has three routes.
- emotion, rxjs and framer-motion stay; they are bumped to current versions.
- **One Worker** serves the static build through Workers Static Assets, handles `/api/*` and `/ws/:gameId`, and exports the Game Durable Object. The Cloudflare Vite plugin runs everything in one dev process.
- Production URL is `stopthebus.bass.dev`; `workers.dev` is the fallback until DNS is set up.
- Deploys use Cloudflare Workers Builds, with no GitHub workflow.

### Repo and tooling

- pnpm workspaces and Turborepo, with `apps/web`, `apps/worker` and `packages/shared`.
- `packages/shared` holds the zod schemas, the types inferred from them, the message protocol and the scoring logic.
- oxlint and oxfmt replace ESLint and Prettier. Vitest replaces Jest. TypeScript 7 replaces 4.5.
- Dependencies are bumped to current wherever possible.

### Vocabulary

- Use the terms in `GLOSSARY.md`. The action of ending a round early is a **Stop**, and the player who does it is the **stopper**. The code may keep `endRound` as its technical name.

## Current behaviour to port

Read from the Fauna-based code; the Durable Object must reproduce it unless noted.

- **Create:** the client picks a human-readable game ID. The creator becomes the first player. A new game starts in the pre stage with 3 rounds, the letters `abcdefghijklmnoprstuvwyz`, no categories and alliteration off.
- **Join and leave:** joining is only allowed in the pre stage, except that a player already in the game can always come back. Joining twice, or leaving when not in the game, is accepted and does nothing. Late joiners get a refusal. Renaming a player updates the player list for everyone.
- **Config:** letters, number of rounds and alliteration are replaced as a whole. Toggling a category adds it if absent and removes it if present.
- **Start** (allowed in the pre and review stages only):
  - If the round just played was the last one, the game becomes finished. It stores the final scores and archives all rounds. It also creates a **new game** with the same config minus the letters already played and no players, and records its ID as the next game for a rematch link.
  - Otherwise a new round begins. Its letter is chosen from the letters not yet played, the start time is about 3.5 s in the future so every client can show a countdown, and the stage becomes active. Clients delay showing the active stage by 4.5 s.
- **Cancel start** (active stage only): undoes the start. The game returns to review if an earlier round exists, otherwise to the pre stage.
- **Answers:** each player saves answers one category at a time while the round is active, and can fetch their own saved answers to restore their inputs after a reload. **Other players' answers must not be sent to anyone until review.**
- **Progress:** as a player completes categories the other players see only which category that player is on. This drives the lanes view.
- **Stop** (active stage only): records the stopper and the end time, and the stage moves toward review. There is a 2 second grace window for the other players' final answers to arrive. Missing answers become empty strings. Initial scores are computed (letter match, alliteration, duplicates), stored answers are cleared, and the stage becomes review with all answers and scores visible.
- **Review:** any player can change any player's score for a category.
- **Dropped:** the client auto-retries a lost connection every 2 seconds, up to 15 times, and shows a connection indicator.

## Out of scope

- Timer mode (deleted).
- Analytics: Splitbee is removed, and PostHog is a low-priority later item.
- Real authentication, game history and any change to the game rules.

## Risks

- Next's type check may not work under TypeScript 7, but the web app moves to Vite, so this mostly goes away.
- `oxfmt` is pre-1.0 and may have rough edges.
- The Durable Object skeleton (04) carries the biggest architectural risk, which is why it comes before the rest of the game logic (05).

## Tickets

See `issues/` (01 to 07). Ticket 01 is done.
