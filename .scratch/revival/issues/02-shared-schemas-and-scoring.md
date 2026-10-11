# 02: Shared schemas and scoring

**What to build:** A shared package holds the zod schemas for Game, Player, Round, Answer and Score, with types inferred from them. It also holds the client-to-server and server-to-client message protocol, and the scoring logic moved out of the client. Both the web app and the worker import from it.

**Blocked by:** 01 (done)

**Status:** done

- [x] Types come from `z.infer`, with no hand-written duplicates
- [x] Every client message has a schema, and invalid messages fail `safeParse` in a test
- [x] Scoring tests (including alliteration) pass in the shared package
- [x] Terminology follows the glossary (Stop, stopper, Review)

## Notes

- `packages/shared/src`: `schemas.ts` (model), `protocol.ts` (`ClientMessageSchema`, `ServerMessageSchema`), `scores.ts`. Source TS is consumed directly; Next needs `transpilePackages`.
- Renames to match the glossary and schema names: `GameRound` → `Round`, `RoundResults` → `Answers`, old `Round` → `RoundAnswers`, `endedByPlayer` → `stopperId`. `GameStage` values are lowercase (`GameStage.pre`).
- Timer mode (`mode`, `time`) and `lastAuthor` are not in the schema; the worker no longer sets `mode`.
- Bug fixed: `getInitialScores` passed the whole config as the alliteration flag, so alliteration always applied. Covered by a new test.
- Protocol: the socket is bound to a player, so `rename`, `saveAnswer`, `setProgress`, `stop` and `leave` carry no player ID. Own saved answers come back as a server `answers` message rather than a client request. User text is capped at 100 chars.
- `apps/web/src/typings/game.ts` now holds only the Fauna wrapper types, which go with Fauna.
- For 04/05: the `state` message reuses `GameSchema`, so the types don't stop other players' answers leaking during an active round. The Durable Object must redact them. It must also check `numRounds` against the unplayed letters, because the schema can't.
