import * as random from './random'
import { getFinalScores } from './scores'
import { gameStates, nextGame } from '../api/redis-client'
import { GameConfig, GameStage, GameState } from '../typings/game'
import { ServerEvent } from '../typings/socket-events'

interface IGameConfigState {
  state: GameState
  config: GameConfig
}

// Move the current round to the
export function finaliseRoundAnswers(state: GameState): GameState {
  const fresh = { ...state }
  const roundResults = fresh.currentRound
  if (roundResults) fresh.rounds.push(roundResults)
  delete state.currentRound
  return fresh
}

export function hasPlayedAllRounds({
  state,
  config,
}: IGameConfigState): boolean {
  const numRounds = state.rounds.length
  const roundsPlayed =
    numRounds + (Boolean(state.currentRound?.timeEnded) ? 1 : 0)
  return config.rounds === roundsPlayed
}

export async function endGame(
  IO: SocketIO.Server,
  gameID: string,
  { state, config }: IGameConfigState
): Promise<void> {
  state.stage = GameStage.FINISHED
  state.nextGameID = random.getGameName()
  state.finalScores = getFinalScores(state.rounds)

  // When a player clicks on the next game link, the game
  // will copy the config from the game ID returned.
  await nextGame.set(state.nextGameID, gameID)

  // Save everything and tell the clients to move to the end screen
  await gameStates.set(gameID, state)

  // Confusingly called ROUND_STARTED, `ROUND_STAGE_CHANGE` would
  // probably be a better name but that’s just not as cute
  IO.in(gameID).emit(ServerEvent.ROUND_STARTED, state)
}
