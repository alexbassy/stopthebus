import {
  players as playerClient,
  gameConfigs,
  gamePlayers,
  gameStates,
} from '../redis-client'
import { Payload, ServerEvent } from '../../typings/socket-events'
import {
  GameStage,
  Room,
  Round,
  PlayerScores,
  Scores,
  GameRound,
  RoundResults,
} from '../../typings/game'
import log from '../../helpers/log'
import { getPlayerUUID } from '../../helpers/socket'
import * as random from '../../helpers/random'
import {
  getFinalScores,
  getInitialScores,
  scoreAnswer,
} from '../../helpers/scores'

export const startRound = (
  IO: SocketIO.Server,
  socket: SocketIO.Socket
) => async ({ gameID }: Payload) => {
  const uuid = getPlayerUUID(socket)
  const player = await playerClient.get(uuid)

  if (!gameID || !player) {
    return
  }

  let [config, players, state] = await Promise.all([
    gameConfigs.get(gameID),
    gamePlayers.get(gameID),
    gameStates.get(gameID),
  ])

  if (!config) {
    log.e('START_ROUND', 'No game config found for room', gameID)
    return
  }

  const isGameActiveOrEnded =
    state.stage === GameStage.ACTIVE || state.stage === GameStage.END
  const isGameInReview = state.stage === GameStage.REVIEW

  if (isGameActiveOrEnded) {
    log.e(
      'START_ROUND',
      'Cannot start a round that is in progress or has ended'
    )
    return
  }

  const answersTemplate: Round = players.reduce((round: Round, player) => {
    round[player.uuid] = {}
    return round
  }, {})

  if (isGameInReview) {
    const roundResults = state.currentRound
    if (roundResults) state.rounds.push(roundResults)
    delete state.currentRound
  }

  const numRoundsPlayed = state.rounds.length
  const hasPlayedAllRounds = config.rounds === numRoundsPlayed
  state.stage = hasPlayedAllRounds ? GameStage.END : GameStage.ACTIVE

  // If on the start screen or review screen, we can go ahead
  if (!hasPlayedAllRounds) {
    const previouslyPlayedLetters = state.rounds.length
      ? state.rounds.map((round) => round.letter || '')
      : []

    const availableLetters = config.letters
      .split('')
      .filter((letter) => !previouslyPlayedLetters.includes(letter))

    const playerVotes = config.categories.reduce<PlayerScores>(
      (categories, category) => {
        categories[category] = 0
        return categories
      },
      {}
    )

    const newScores = players.reduce<Scores>((players, player) => {
      if (players[player.uuid]) players[player.uuid] = playerVotes
      return players
    }, {})

    const newRound: GameRound = {
      timeStarted: Date.now(),
      letter: random.getValue(availableLetters),
      answers: answersTemplate,
      scores: newScores,
    }
    state.currentRound = newRound
  } else {
    state.finalScores = getFinalScores(state.rounds)
  }

  // Save everything
  await Promise.all([
    gameConfigs.set(gameID, config),
    gamePlayers.set(gameID, players),
    gameStates.set(gameID, state),
  ])

  IO.in(gameID).emit(ServerEvent.ROUND_STARTED, state)
}

export const endRound = (
  IO: SocketIO.Server,
  socket: SocketIO.Socket
) => async ({ gameID }: Payload) => {
  const uuid = getPlayerUUID(socket)
  const player = await playerClient.get(uuid)

  if (!gameID || !player) {
    return
  }

  let [config, players, state] = await Promise.all([
    gameConfigs.get(gameID),
    gamePlayers.get(gameID),
    gameStates.get(gameID),
  ])

  const room: Room = { config, players, state }

  if (!state) {
    return
  }

  const isGameActive = state.stage === GameStage.ACTIVE

  if (!isGameActive) {
    console.log('Cannot end a round for a game not in progress')
    return
  }

  state.stage = GameStage.REVIEW

  if (!state?.currentRound) {
    return log.e('Cannot end round that it not in progress')
  }

  state.currentRound.endedByPlayer = player.uuid

  const votes = getInitialScores(room)
  if (votes) state.currentRound.scores = votes

  await gameStates.set(gameID, state)
  IO.in(gameID).emit(ServerEvent.ROUND_ENDED, state)
}

export const filledAnswer = (
  IO: SocketIO.Server,
  socket: SocketIO.Socket
) => async ({ gameID, payload }: Payload<RoundResults>) => {
  const uuid = getPlayerUUID(socket)
  const player = await playerClient.get(uuid)

  if (!gameID || !player) {
    return
  }

  const state = await gameStates.get(gameID)

  // fucking typescript
  if (state.currentRound && payload) {
    state.currentRound.answers[player.uuid] = payload
    await gameStates.set(gameID, state)
  }
}

export const voteAnswer = (
  IO: SocketIO.Server,
  socket: SocketIO.Socket
) => async ({ gameID, payload }: Payload) => {
  const uuid = getPlayerUUID(socket)
  const player = await playerClient.get(uuid)

  if (!gameID || !player) {
    return
  }

  let [config, state] = await Promise.all([
    gameConfigs.get(gameID),
    gameStates.get(gameID),
  ])

  if (!config) {
    return
  }

  if (!state.currentRound) {
    console.log('Cannot vote while round in progress')
    return
  }

  const { playerID, category, value } = payload
  const answer = state.currentRound.answers[playerID][category]
  const letter = state.currentRound.letter as string

  state.currentRound.scores[playerID][category] =
    value === false ? 0 : scoreAnswer(config, letter, answer, false)

  await gameStates.set(gameID, state)

  IO.in(gameID).emit(ServerEvent.UPDATE_VOTES, state.currentRound.scores)
}
