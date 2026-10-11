# 05: Play a full game on the Durable Object

**What to build:** The rest of the game logic moves from Fauna to the Game Durable Object so that a complete game can be played end to end with live updates. All behaviour comes from the "Current behaviour to port" section of the spec: config, start, cancel, answers, progress, stop, review scoring and the finished game with a rematch. Timer mode is deleted, so every game is a race.

In the lobby, categories, letters, number of rounds and alliteration sync live. Starting a game runs the countdown and begins a round with a letter that hasn't been played. Players enter answers and see each other's progress in the lanes. Answers stay private to their author until review, and the Durable Object must not broadcast them earlier. The first player to finish presses Stop, which ends the round for everyone, with the same 2 second grace window for final answers. Review shows everyone's answers with initial scores computed by the shared scoring logic, and any player can adjust scores. Starting again continues to the next round, and after the last round the game shows final scores and a link to the rematch game, which the Durable Object creates with the previous config minus the letters already played.

Cancelling the start during the countdown returns the game to its previous stage. Reloading during a round restores the player's own saved answers.

**Blocked by:** 04

**Status:** ready-for-agent

- [x] Two browsers can play a game of several rounds from lobby to final scores
- [x] Config changes made by one player appear for the other
- [x] During a round, a player's network traffic never contains another player's answers
- [x] Stop ends the round for everyone, and answers typed within the grace window are kept
- [x] Review score changes sync live, and final scores match the shared scoring tests
- [x] The rematch link opens a fresh lobby with the same config and the played letters removed
- [ ] Cancelling during the countdown restores the previous stage; reloading mid-round restores own answers
- [x] Timer mode no longer exists in the UI or the types
- [x] No web code calls Fauna any more
- [x] Tests cover the start, cancel and stop transitions in the Durable Object
- [ ] If this overruns a context window, split at the lobby, round and review boundaries

**Verification notes:** Checked by the `GameRules` tests, by two raw WebSocket clients against the real Worker and Durable Object under workerd, and by two isolated Chrome contexts playing a two-round game from lobby to final scores and into the rematch (live config, review, countdown between rounds, own answers restored after a reload mid-round, rematch lobby with the played letters removed). Playing it in a browser found three bugs, now fixed: a player who had not typed in any input got a server error page when someone pressed Stop; the next-round countdown rendered a blank screen; and the review header briefly showed the next round's data. "Cancelling during the countdown restores the previous stage" is not ticked because the server side is tested but the Cancel button was not clicked in a browser. The Durable Object class itself is not covered by Vitest (see ticket 04 note).
