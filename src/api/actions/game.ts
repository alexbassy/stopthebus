import {
  players as playerClient,
  gameConfigs,
  gamePlayers,
  gameStates,
} from '../redis-client'
import { Payload, ServerEvent, ClientEvent } from '../../typings/socket-events'
import { GameConfig, GameStage, Room } from '../../typings/game'
import log from '../../helpers/log'
import { getPlayerUUID } from '../../helpers/socket'

/**
 * ServerEvents.REQUEST_JOIN_GAME
 */
export const joinGame = (
  IO: SocketIO.Server,
  socket: SocketIO.Socket
) => async ({ gameID, payload }: Payload<GameConfig>) => {
  const uuid = getPlayerUUID(socket)
  const player = await playerClient.get(getPlayerUUID(socket))

  const { d: logD, e: logE, r: logR } = log.n('REQUEST_JOIN_GAME')
  logR({ gameID, player, payload })

  // If the game doesn’t exist yet, we should ask the
  // user if they want to create it
  if (!gameID || !player) {
    return
  }

  const config = await gameConfigs.get(gameID)

  if (!config) {
    logE(`There is no room with name "${gameID}"`)
    return
  }

  const [players, state] = await Promise.all([
    await gamePlayers.get(gameID),
    await gameStates.get(gameID),
  ])

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

  socket.on(ClientEvent.DISCONNECT, async () => {
    let players = await gamePlayers.get(gameID)

    if (players) {
      // Update the client state to reflect the user’s disconnection
      // but do not update the store so that they can rejoin.
      players = players.filter(({ uuid }) => uuid !== player.uuid)
      logD(`Player ${player.uuid} disconnected`)
    }
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
  logD({ gameID, player, payload })

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

  config = { ...payload, lastAuthor: player.uuid }
  await gameConfigs.set(gameID, config)
  socket.in(gameID).emit(ServerEvent.GAME_CONFIG, config)
}
