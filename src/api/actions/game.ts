import log from '../../helpers/log'
import { getPlayerUUID } from '../../helpers/socket'
import { GameConfig, GameStage, Room, Player } from '../../typings/game'
import { ClientEvent, Payload, ServerEvent } from '../../typings/socket-events'
import {
  gameConfigs,
  gamePlayers,
  gameStates,
  nextGame,
  players as playerClient,
  playerAnswers,
} from '../redis-client'
import { getColour } from '../../helpers/playerColours'

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

  // Check if the player is coming from a previous game
  // and wants to play with the same configuration. If so,
  // load the previous game configuration, exclude the played
  // letters and create a new game.
  const previousGameID = await nextGame.get(gameID)
  if (previousGameID) {
    const previousGameConfig = await gameConfigs.get(previousGameID)
    previousGameConfig.id = gameID
    previousGameConfig.name = gameID
    const previousState = await gameStates.get(previousGameID)
    const playedLetters = previousState.rounds.map((round) => round.letter)
    previousGameConfig.letters = previousGameConfig.letters
      .split('')
      .filter((letter) => !playedLetters.includes(letter))
      .join('')
    await createGame(IO, socket)({ gameID, payload: previousGameConfig })
    await nextGame.del(gameID)
    return
  }

  const config = await gameConfigs.get(gameID)

  if (!config) {
    logE(`There is no room with name "${gameID}"`)
    socket.emit(ServerEvent.GAME_NOT_FOUND)
    return
  }

  const [players, state, answersForPlayer] = await Promise.all([
    gamePlayers.get(gameID),
    gameStates.get(gameID),
    playerAnswers.get(gameID, uuid),
  ])

  if (!state) {
    logD(`Game doesn’t exist, bye felicia 👋`)
    socket.emit(ServerEvent.GAME_NOT_FOUND)
    return
  }

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
      // Add a colour for the player to display a little circle
      // next to their name while the round is going.
      const otherPlayerColours = players
        .map((player) => player.colour)
        .filter(Boolean)
      const roomPlayer: Player = {
        ...player,
        colour: getColour(otherPlayerColours as string[]),
      }
      players.push(roomPlayer)
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
    logE('No gameID, payload or player')
    return
  }

  const config = await gameConfigs.get(gameID)

  if (config) {
    logD(`The room "${gameID} already exists, joining instead…`)
    return joinGame(IO, socket)({ gameID, payload })
  }

  // Assign a colour to the first player in the room
  const roomPlayer = {
    ...player,
    colour: getColour([]),
  }

  const room: Room = {
    config: { ...payload, lastAuthor: player.uuid },
    players: [roomPlayer],
    state: {
      stage: GameStage.PRE,
      rounds: [],
    },
  }

  // Save the newly created room
  await Promise.all([
    gameConfigs.set(gameID, room.config),
    gamePlayers.set(gameID, room.players),
    gameStates.set(gameID, room.state),
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
