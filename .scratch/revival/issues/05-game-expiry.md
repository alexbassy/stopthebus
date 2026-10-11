# 05: Game expiry

**What to build:** A game's stored state is deleted 24 hours after its last activity, using a Durable Object alarm that is pushed back on every message. Opening an expired game's URL shows a clear "game not found" screen.

**Blocked by:** 04

**Status:** ready-for-agent

- [ ] A test shows the alarm deletes storage after the idle period
- [ ] Activity resets the timer
- [ ] An unknown or expired game ID shows a not-found screen
