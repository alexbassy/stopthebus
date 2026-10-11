# 06: Game expiry

**What to build:** A game's stored state is deleted 24 hours after its last activity, using a Durable Object alarm that is pushed back on every message. Opening an expired game's URL shows a clear "game not found" screen.

**Blocked by:** 04

**Status:** ready-for-agent

- [x] A test shows the alarm deletes storage after the idle period
- [x] Activity resets the timer
- [x] An unknown or expired game ID shows a not-found screen

**Verification notes:** The first two are covered by `GameRules` tests with a fake clock, and were also run for real under workerd with the expiry temporarily set to 4 seconds (survives while active, `notFound` after idle). The third was checked in Chrome: opening an unknown game ID shows "We couldn't find a game by that name." with a link back to the start. Expired games take the same path because the Durable Object answers `notFound` once its storage is cleared.
