import log from '../../helpers/log'
import { getPlayerUUID } from '../../helpers/socket'
import { GameConfig, GameStage, Room } from '../../typings/game'
import { ClientEvent, Payload, ServerEvent } from '../../typings/socket-events'
import {
  gameConfigs,
  gamePlayers,
  gameStates,
  nextGame,
  players as playerClient,
  playerAnswers,
} from '../redis-client'

/**
 * ServerEvents.REQUEST_JOIN_GAME
 */
export const joinGame = (
  IO: SocketIO.Server,
  socket: SocketIO.Socket
) => async ({ gameID }: Payload) => {
  const uuid = getPlayerUUID(socket)
  const player = await playerClient.get(getPlayerUUID(socket))

  const { d: logD, e: logE } = log.n('REQUEST_JOIN_GAME')

  // If the game doesn’t exist yet, we should ask the
  // user if they want to create it
  if (!gameID || !player) {
    return
  }

  const previousGameID = await nextGame.get(gameID)

  if (previousGameID) {
    const previousGameConfig = await gameConfigs.get(previousGameID)
    await createGame(IO, socket)({ gameID, payload: previousGameConfig })
    await nextGame.del(gameID)
  }

  const config = await gameConfigs.get(gameID)

  if (!config) {
    logE(`There is no room with name "${gameID}"`)
    return
  }

  const [players, state, answersForPlayer] = await Promise.all([
    gamePlayers.get(gameID),
    gameStates.get(gameID),
    playerAnswers.get(gameID, uuid),
  ])

  if (answersForPlayer && state.stage === GameStage.ACTIVE) {
    state.currentRound!.answers[uuid] = answersForPlayer
  }

  const isExistingPlayer = players.find((player) => player.uuid === uuid)
  if (state.stage !== GameStage.PRE && !isExistingPlayer) {
    logD('Visitor is not a player, rejecting…')
    return
  }

  socket.join(gameID, async () => {
    // Add player from the room
    const isPlayerAlreadyInRoom = players.find((player) => player.uuid === uuid)

    if (!isPlayerAlreadyInRoom) {
      players.push(player)
      await gamePlayers.set(gameID, players)
    }

    logD('Joined room. Emitting JOINED_GAME and PLAYER_JOINED_GAME events.')
    socket.emit(ServerEvent.JOINED_GAME, { config, state, players })
    socket.in(gameID).emit(ServerEvent.PLAYER_JOINED_GAME, players)
  })

  // When the player disconnects before starting a game, they can be removed
  // from the game. If the game is in motion, they shouldn’t be removed
  // as the player nicknames will disappear.
  socket.on(ClientEvent.DISCONNECT, async () => {
    const gameState = await gameStates.get(gameID)
    let players = await gamePlayers.get(gameID)

    // If there’s no game, or the game has already started,
    // then there’s nothing to do.
    if (!gameState || !players || gameState.stage !== GameStage.PRE) {
      return
    }

    // If the game hasn’t started, then the players list should
    // be updated. There are no rounds referring to that user UUID.
    logD(`Player ${player.uuid} disconnected`)
    players = players.filter(({ uuid }) => uuid !== player.uuid)
    await gamePlayers.set(gameID, players)
    socket.in(gameID).emit(ServerEvent.PLAYER_LEFT, players)
  })
}

/**
 * ServerEvents.REQUEST_CREATE_GAME
 */
export const createGame = (
  IO: SocketIO.Server,
  socket: SocketIO.Socket
) => async ({ gameID, payload }: Payload<GameConfig>) => {
  const uuid = getPlayerUUID(socket)
  const player = await playerClient.get(uuid)
  const { d: logD, e: logE } = log.n('REQUEST_CREATE_GAME')

  if (!gameID || !payload || !player) {
    console.log({ gameID, payload, player })
    logE('No gameID, payload or player')
    return
  }

  const [config, players] = await Promise.all([
    gameConfigs.get(gameID),
    gamePlayers.get(gameID),
  ])

  if (config) {
    logD(`The room "${gameID} already exists, joining instead…`)
    return joinGame(IO, socket)({ gameID, payload })
  }

  if (players && players.find(({ uuid }) => uuid === player.uuid)) {
    logD(`Host rejoined room "${gameID}"`)
  }

  const room: Room = {
    config: { ...payload, lastAuthor: player.uuid },
    players: [player],
    state: {
      stage: GameStage.PRE,
      rounds: [],
    },
  }

  // Save the newly created room
  await Promise.all([
    await gameConfigs.set(gameID, room.config),
    await gamePlayers.set(gameID, room.players),
    await gameStates.set(gameID, room.state),
  ])

  socket.join(gameID, () => {
    logD(
      `Joined room "${gameID}", emitting GAME_CONFIG and PLAYER_JOINED_GAME event`
    )
    IO.in(gameID).emit(ServerEvent.GAME_CONFIG, room.config)
    IO.in(gameID).emit(ServerEvent.PLAYER_JOINED_GAME, room.players)
  })
}

export const updateGameConfig = (
  IO: SocketIO.Server,
  socket: SocketIO.Socket
) => async ({ gameID, payload }: Payload<GameConfig>) => {
  const uuid = getPlayerUUID(socket)
  const player = await playerClient.get(uuid)
  const { d: logD, e: logE } = log.n('GAME_CONFIG')
  logD({ gameID, player, payload })

  if (!gameID || !payload || !player) {
    console.log({ gameID, payload, player })
    logE('No gameID, payload or player')
    return
  }

  let config = await gameConfigs.get(gameID)

  if (!config) {
    logE('There is no game with ID', gameID)
    socket.emit(ServerEvent.GAME_CONFIG, null)
    return
  }

  // Sanitise
  payload.categories = payload.categories.filter(Boolean)

  config = { ...payload, lastAuthor: player.uuid }
  await gameConfigs.set(gameID, config)
  socket.in(gameID).emit(ServerEvent.GAME_CONFIG, config)
}
