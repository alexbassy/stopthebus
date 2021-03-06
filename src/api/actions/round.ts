import log from '../../helpers/log'
import * as random from '../../helpers/random'
import { getNextLetterForGame } from '../../helpers/letters'
import {
  getFinalScores,
  getInitialScores,
  scoreAnswer,
} from '../../helpers/scores'
import {
  FINAL_ANSWERS_WAITING_TIME,
  TIME_BEFORE_GAME_START,
} from '../../constants/game'
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
import { Payload, ServerEvent, QueueEvent } from '../../typings/socket-events'
import {
  gameConfigs,
  gamePlayers,
  gameStates,
  nextGame,
  playerAnswers,
  players as playerClient,
  queue,
} from '../redis-client'

export const startRound = (
  IO: SocketIO.Server,
  socket: SocketIO.Socket
) => async ({ gameID }: Payload) => {
  const uuid = getPlayerUUID(socket)
  const player = await playerClient.get(uuid)
  const { e: logE } = log.n('START_ROUND')

  if (!gameID || !player) {
    return
  }

  let [config, state] = await Promise.all([
    gameConfigs.get(gameID),
    gameStates.get(gameID),
  ])

  if (!state) {
    logE('No game state found for room', gameID)
    return
  }

  const isGameActiveOrEnded =
    state.stage === GameStage.ACTIVE || state.stage === GameStage.FINISHED

  if (isGameActiveOrEnded) {
    logE('Cannot start a round that is in progress or has ended')
    return
  }

  if (state.stage !== GameStage.PRE && state.stage !== GameStage.REVIEW) {
    return
  }

  // Save the game state and instruct the clients to show a countdown
  state.stage =
    state.stage === GameStage.PRE ? GameStage.STARTING : GameStage.NEXT_STARTING

  // Select a letter for the round so that it can be shown at the end of the countdown
  if (!state.nextLetter) {
    state.nextLetter = getNextLetterForGame(config, state)
  }

  await gameStates.set(gameID, state)
  await queue.add(gameID, {
    name: QueueEvent.START_ROUND,
    data: { gameID },
    inProgress: false,
    due: Date.now() + TIME_BEFORE_GAME_START,
  })
  IO.in(gameID).emit(ServerEvent.ROUND_STARTING, state)
}

export const actuallyStartRound = async (
  IO: SocketIO.Server,
  gameID: string
) => {
  let [config, players, state] = await Promise.all([
    gameConfigs.get(gameID),
    gamePlayers.get(gameID),
    gameStates.get(gameID),
  ])

  if (!config || !state) {
    return
  }

  const isGameInReview = state.stage === GameStage.NEXT_STARTING

  // Create a template for player answers so it can be pushed to safely
  const answersTemplate: Round = players.reduce((round: Round, player) => {
    round[player.uuid] = {}
    return round
  }, {})

  // If the round is being started following another round, free up the
  // currentRound property
  if (isGameInReview) {
    const roundResults = state.currentRound
    if (roundResults) state.rounds.push(roundResults)
    delete state.currentRound
  }

  // If the configured number of rounds has met the number of rounds played,
  // the game will end rather than switch to active
  const numRoundsPlayed = state.rounds.length
  const hasPlayedAllRounds = config.rounds === numRoundsPlayed
  state.stage = hasPlayedAllRounds ? GameStage.FINISHED : GameStage.ACTIVE

  // If on the start screen or review screen, we can go ahead
  if (hasPlayedAllRounds) {
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

    return
  }

  // Scaffold out a new voting object ready for the next round.
  // This could easily be done in the END_ROUND event, but 🤷‍♂️
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

  // Create a new `currentRound` property upon which to play
  const newRound: GameRound = {
    timeStarted: Date.now(),
    letter: getNextLetterForGame(config, state),
    answers: answersTemplate,
    scores: newScores,
  }
  state.currentRound = newRound
  state.stage = GameStage.ACTIVE
  state.nextLetter = undefined

  // Save everything
  await gameStates.set(gameID, state)

  IO.in(gameID).emit(ServerEvent.ROUND_STARTED, state)
}

export const cancelStartRound = (
  IO: SocketIO.Server,
  socket: SocketIO.Socket
) => async ({ gameID }: Payload) => {
  const uuid = getPlayerUUID(socket)
  const player = await playerClient.get(uuid)
  const { e: logE, d: logD } = log.n('CANCEL_START_ROUND')

  if (!gameID || !player) {
    return
  }

  // First check if there are any game starts in the queue
  const jobsForGame = await queue.getJobsForGame(gameID)
  const roundStartCancellation = jobsForGame.filter(
    (job) => job.name === QueueEvent.START_ROUND
  )

  if (!jobsForGame.length || !roundStartCancellation.length) {
    return
  }

  logD(
    'Deleting queue items',
    roundStartCancellation.map((job) => job.id)
  )

  await Promise.all([
    roundStartCancellation.map((job) => queue.remove(job.id!)),
  ])

  let state = await gameStates.get(gameID)

  if (!state) {
    logE('No game config found for room', gameID)
    return
  }

  const isGameStarting = state.stage === GameStage.STARTING

  if (!isGameStarting) {
    logE('Too late, game has already started or already cancelled')
    return
  }

  state.stage = GameStage.PRE

  await gameStates.set(gameID, state)

  IO.in(gameID).emit(ServerEvent.GAME_STATE_CHANGE, state)
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

  state.currentRound.timeEnded = Date.now()
  state.currentRound.endedByPlayer = player.uuid

  await gameStates.set(gameID, state)
  IO.in(gameID).emit(ServerEvent.ROUND_ENDING, state)

  // Okay, so, if the server crashes and this never gets run, we’re screwed.
  // It would be useful to add a check for this relating to the ENDING state
  // paired with the timestamp.
  // There could also be a "queue" type to the redis store which runs things
  // like this as a sort of cron job.
  setTimeout(async () => {
    let [config, players, state, roundAnswers] = await Promise.all([
      gameConfigs.get(gameID),
      gamePlayers.get(gameID),
      gameStates.get(gameID),
      playerAnswers.getByGame(gameID),
    ])

    if (!state) {
      // Well, we’re pretty much fucked. Sorry players.
      return
    }

    state.currentRound!.answers = roundAnswers

    state.stage = GameStage.REVIEW

    const room: Room = { config, players, state }
    const votes = getInitialScores(room)
    if (votes) state.currentRound!.scores = votes

    await playerAnswers.delByGame(gameID)
    await gameStates.set(gameID, state)
    IO.in(gameID).emit(ServerEvent.ROUND_ENDED, state)
  }, FINAL_ANSWERS_WAITING_TIME)
}

export const focussedAnswer = (
  IO: SocketIO.Server,
  socket: SocketIO.Socket
) => async ({ gameID, payload }: Payload<number>) => {
  const uuid = getPlayerUUID(socket)
  const player = await playerClient.get(uuid)
  log.r('FOCUSSED_ANSWER', payload)

  if (!gameID || !player || typeof payload !== 'number') {
    return
  }

  const state = await gameStates.get(gameID)

  // If there’s no active game, then something is amiss
  if (!state || state.stage !== GameStage.ACTIVE) {
    return
  }

  IO.in(gameID).emit(ServerEvent.OPPONENT_CURRENT_CATEGORY, {
    [uuid]: payload,
  })
}

export const filledAnswer = (
  IO: SocketIO.Server,
  socket: SocketIO.Socket
) => async ({ gameID, payload }: Payload<RoundResults>) => {
  const uuid = getPlayerUUID(socket)
  const player = await playerClient.get(uuid)
  log.r('FILLED_ANSWER', payload)

  if (!gameID || !player || !payload) {
    return
  }

  const [config, state] = await Promise.all([
    gameConfigs.get(gameID),
    gameStates.get(gameID),
  ])

  const isGameActive =
    state.stage === GameStage.ACTIVE || state.stage === GameStage.ENDING

  // If there’s no active game, then something is amiss
  if (!state || !isGameActive || !config) {
    return
  }

  await playerAnswers.set(gameID, uuid, payload)
}

export const retrieveAnswers = (
  IO: SocketIO.Server,
  socket: SocketIO.Socket
) => async ({ gameID }: Payload) => {
  const uuid = getPlayerUUID(socket)
  const player = await playerClient.get(uuid)
  const { d: logD, e: logE } = log.n('RETRIEVE_ANSWERS')

  if (!gameID || !player) {
    logD({ gameID, player })
    logE('No gameID or player')
    return
  }

  let answers = await playerAnswers.get(gameID, uuid)

  if (!answers) {
    logD('The player has not recorded any answers')
    return
  }

  socket.emit(ServerEvent.SEND_ANSWERS, answers)
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
