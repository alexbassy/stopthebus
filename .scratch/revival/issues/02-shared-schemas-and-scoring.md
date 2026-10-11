# 02: Shared schemas and scoring

**What to build:** A shared package holds the zod schemas for Game, Player, Round, Answer and Score, with types inferred from them. It also holds the client-to-server and server-to-client message protocol, and the scoring logic moved out of the client. Both the web app and the worker import from it.

**Blocked by:** 01 (done)

**Status:** ready-for-agent

- [ ] Types come from `z.infer`, with no hand-written duplicates
- [ ] Every client message has a schema, and invalid messages fail `safeParse` in a test
- [ ] Scoring tests (including alliteration) pass in the shared package
- [ ] Terminology follows the glossary (Stop, stopper, Review)
