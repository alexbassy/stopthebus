# 04: Play a full game

**What to build:** Players can play a whole game end to end over WebSockets against one Game Durable Object per game. This covers creating and joining a game and renaming a player, with live player lists and reconnection after a drop. It covers configuring categories, letters, number of rounds and alliteration, with timer mode deleted. A round runs through the countdown, answering with lane progress, and a Stop by the stopper that ends it for everyone. After that come Review with up and down votes, further rounds, final scores and a rematch. Every client message is validated with the shared schemas, and each socket can only edit its own player's name and answers.

**Blocked by:** 02, 03

**Status:** ready-for-agent

- [ ] Two browsers can create, join, configure and play a complete game with live updates
- [ ] A dropped connection reconnects and resyncs state
- [ ] A message that fails validation, or one that edits another player's answers, is rejected
- [ ] The lobby, active round, review and finished screens all work
- [ ] The old Fauna client is no longer called by the web app
- [ ] Note: this ticket is large. If it overruns a context window, split at lobby, round and review boundaries.
