import log from '../../helpers/log'
import * as random from '../../helpers/random'
import {
  getFinalScores,
  getInitialScores,
  scoreAnswer,
} from '../../helpers/scores'
import { FINAL_ANSWERS_WAITING_TIME } from '../../constants/game'
import { getPlayerUUID } from '../../helpers/socket'
import {
  GameRound,
  GameStage,
  PlayerScores,
  Room,
  Round,
  RoundResults,
  Scores,
} from '../../typings/game'
import { Payload, ServerEvent } from '../../typings/socket-events'
import {
  gameConfigs,
  gamePlayers,
  gameStates,
  nextGame,
  players as playerClient,
} from '../redis-client'

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
    state.stage === GameStage.ACTIVE || state.stage === GameStage.FINISHED
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
  state.stage = hasPlayedAllRounds ? GameStage.FINISHED : GameStage.ACTIVE

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
    state.nextGameID = random.getGameName()
    state.finalScores = getFinalScores(state.rounds)

    // When a player clicks on the next game link, the game
    // ID will be searched for in the JOIN_GAME handler, which
    // will copy the config from the game ID returned.
    await nextGame.set(state.nextGameID, gameID)
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

  const state = await gameStates.get(gameID)

  if (!state) {
    return
  }

  const isGameActive = state.stage === GameStage.ACTIVE

  if (!isGameActive) {
    console.log('Cannot end a round for a game not in progress')
    return
  }

  state.stage = GameStage.ENDING

  if (!state?.currentRound) {
    return log.e('Cannot end round that it not in progress')
  }

  state.currentRound.endedByPlayer = player.uuid

  await gameStates.set(gameID, state)
  IO.in(gameID).emit(ServerEvent.ROUND_ENDING, state)

  // Okay, so, if the server crashes and this never gets run, we’re screwed.
  // It would be useful to add a check for this relating to the ENDING state
  // paired with the timestamp.
  // We could also add a "queue" type to the redis store which runs things
  // like this as a sort of cron job.
  setTimeout(async () => {
    let [config, players, state] = await Promise.all([
      gameConfigs.get(gameID),
      gamePlayers.get(gameID),
      gameStates.get(gameID),
    ])

    const room: Room = { config, players, state }

    if (!state) {
      // Well, we’re pretty much fucked. Sorry players.
      return
    }

    state.stage = GameStage.REVIEW

    const votes = getInitialScores(room)
    if (votes) state.currentRound!.scores = votes

    await gameStates.set(gameID, state)
    IO.in(gameID).emit(ServerEvent.ROUND_ENDED, state)
  }, FINAL_ANSWERS_WAITING_TIME)
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
