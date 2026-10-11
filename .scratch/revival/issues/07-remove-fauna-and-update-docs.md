# 07: Remove Fauna and update docs

**What to build:** Everything left over from Fauna and the old deploy setup is deleted, and the project documents describe the new setup.

**Blocked by:** 05, 06

**Status:** ready-for-agent

- [x] The FQL files, the `faunadb` dependency, the Fauna and Splitbee environment variables and the old Worker deploy workflow are gone
- [x] The README covers pnpm, local dev and how deploys work
- [x] `.env.example` matches what the app uses
- [x] The glossary and ADR still match the code

**Notes:** Most of the removal had already happened in tickets 04 and 05 (FQL files, `faunadb`, Splitbee, the old Worker routes and deploy scripts); a grep for fauna, splitbee, worktop, vercel and `NEXT_PUBLIC` finds nothing outside this ticket folder and the ADR's history sentence. There was never a GitHub workflow in the repo by the time of this ticket. The app reads no environment variables (only the build-time `WORKERS_CI_COMMIT_SHA` that Workers Builds sets), so there is deliberately no `.env.example`. The glossary and ADR needed no changes: every term is used as defined, and the ADR's decision (one Durable Object per game, one WebSocket, zod-validated messages) is what the code does. The home page uses a short-lived second socket just to create a game.
