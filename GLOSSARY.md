# Stop the Bus

A multiplayer word game (like Scattergories or Stadt Land Fluss) where players race to fill in one answer per category, all starting with the same letter.

## Language

**Game**:
A session shared by a group of players, made up of several rounds and identified by a short human-readable ID.
_Avoid_: Room, lobby, match

**Player**:
A person taking part in a game, identified by a locally stored ID, with a nickname and colour.
_Avoid_: User, opponent (except for "opponent progress" on the lanes)

**Round**:
One play-through of a single letter across all of the game's categories.
_Avoid_: Turn, level

**Stage**:
Where a game currently is in its life: setting up, playing a round, reviewing a round, or finished.
_Avoid_: Status, phase

**Category**:
A prompt that needs an answer, such as "Animal" or "City".
_Avoid_: Question, topic

**Answer**:
A player's word or phrase for one category in one round.

**Stop**:
The act of ending a round early because you have answered every category. The player who does it is the **stopper**, and it ends the round for everyone.
_Avoid_: End round, finish, bus stop

**Review**:
The stage after a stop, where players vote answers up or down and every answer receives a score.
_Avoid_: Voting, judging

**Score**:
The points an answer earns in review; the sum across rounds decides the winner.
_Avoid_: Points

**Alliteration**:
An optional game setting that awards one point per word in an answer starting with the round's letter, so "Tina Turner" is worth two.

**Lanes**:
The race view showing how far each player has got through the categories during a round.
_Avoid_: Progress bar
