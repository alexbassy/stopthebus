import log from 'shared/helpers/log'
import { getPlayerUUID } from 'shared/helpers/socket'
import { Payload, ServerEvent } from 'shared/typings/socket-events'
import { gamePlayers, players as playerClient } from '../redis-client'

export const updateNickname = (
  IO: SocketIO.Server,
  socket: SocketIO.Socket
) => async ({ gameID, payload }: Payload<string>) => {
  const { r: logR, e: logE, d: logD } = log.n('UPDATE_NICKNAME')
  logR('UPDATE_NICKNAME')

  const uuid = getPlayerUUID(socket)
  let player = await playerClient.get(getPlayerUUID(socket))

  if (!gameID || !player) {
    logE('No gameID or Player provided')
    return
  }

  if (!payload || payload.trim().length < 1) {
    logE('Nickname is too short')
    return
  }

  logD(`Updating player nickname to "${payload}"`)

  player.name = payload

  const playersInGame = await gamePlayers.get(gameID)

  // If there are no players in the game, this is probably
  // an expired room. There is nothing to do.
  if (!playersInGame) {
    return
  }

  // Update the name on the `gamePlayer` entity. I’m not really
  // sure why players are being stored twice to be honest but
  // here we are.
  const newPlayers = playersInGame.map((currentPlayer) => {
    if (currentPlayer.uuid === uuid)
      return { ...currentPlayer, name: player.name }
    return currentPlayer
  })

  await playerClient.set(uuid, player)
  await gamePlayers.set(gameID, newPlayers)

  IO.in(gameID).emit(ServerEvent.PLAYER_JOINED_GAME, newPlayers)
}
