import path from 'path'
import express from 'express'
import http from 'http'
import socketIO from 'socket.io'
import { Payload, ClientEvent, ServerEvent } from '../typings/socket-events'
import { Rooms, Player, GameConfig } from '../typings/game'
import { User } from '../helpers/getUserSession'

const app = express()
const server = http.createServer(app)
const port = 4000

const IO = socketIO(server)

app.use(express.static(path.resolve('build')))

app.get('*', (req, res) => {
  res.sendFile(path.resolve('build/index.html'))
})

const rooms: Rooms = {}

const players: { [uuid: string]: Player } = {}

const getUUID = (socket: SocketIO.Socket) => {
  return socket.handshake.query.sessionID
}

const getPlayerByUUID = (socket: SocketIO.Socket): Player | undefined => {
  const uuid = getUUID(socket)
  return players[uuid]
}

IO.use((socket, next) => {
  const uuid = getUUID(socket)

  if (!players[uuid]) {
    players[uuid] = { uuid, id: socket.id }
  }

  next()
})

IO.on('connection', (socket) => {
  const player = getPlayerByUUID(socket)

  console.log({ player })

  socket.on(
    ClientEvent.REQUEST_JOIN_GAME,
    ({ gameID, payload }: Payload<GameConfig>) => {
      const player = getPlayerByUUID(socket)
      console.log('[REQUEST_JOIN_GAME]', { gameID, player, payload })

      // If the game doesn’t exist yet, we should ask the user if they want
      // to create it
      if (!gameID || !player) {
        return
      }

      if (!rooms[gameID]) {
        console.log('There is no room with this name')
        return
      }

      socket.join(gameID, () => {
        // Add player from the room
        rooms[gameID].players.push(player)
        console.log('Emitting GAME_CONFIG', rooms[gameID].config)
        socket.emit(ServerEvent.GAME_CONFIG, rooms[gameID].config)
        console.log(
          `Emitting PLAYER_JOINED_GAME to ${gameID}`,
          rooms[gameID].players
        )
        socket
          .to(gameID)
          .emit(ServerEvent.PLAYER_JOINED_GAME, rooms[gameID].players)
      })

      socket.on(ClientEvent.DISCONNECT, () => {
        if (rooms[gameID] && player) {
          // Remove player from the room
          rooms[gameID].players = rooms[gameID].players.filter(
            ({ uuid }) => uuid !== player.uuid
          )
          console.log(`Removed ${player.uuid} from the room`)
        }
        socket.to(gameID).emit(ServerEvent.PLAYER_LEFT, rooms[gameID].players)
      })
    }
  )

  socket.on(
    ClientEvent.REQUEST_START_GAME,
    ({ gameID, payload }: Payload<GameConfig>) => {
      const player = getPlayerByUUID(socket)
      console.log('[REQUEST_START_GAME]', { gameID, player, payload })

      if (!gameID || !payload || !player) {
        return
      }

      if (
        rooms[gameID] &&
        rooms[gameID].players.find(({ uuid }) => uuid === player.uuid)
      ) {
        console.log('host rejoined')
      }

      rooms[gameID] = {
        config: { ...payload, lastAuthor: player.uuid },
        players: [player],
      }

      socket.join(gameID, () => {
        const { players, config } = rooms[gameID]
        console.log('Joining host to game and emitting things', players, config)
        socket.emit(ServerEvent.GAME_CONFIG, config)
        socket.emit(ServerEvent.PLAYER_JOINED_GAME, players)
      })
    }
  )

  socket.on(ClientEvent.SELF_IDENTIFY, ({ gameID }: Payload) => {
    const player = getPlayerByUUID(socket)
    console.log('[SELF_IDENTIFY]', { gameID, player })

    socket.emit('ping', 'self-identify')

    if (!gameID || !player) {
      return
    }

    socket.to(gameID).emit(ServerEvent.PLAYER_IDENTITY, { id: player.id })
  })

  socket.on(ClientEvent.GAME_CONFIG, ({ gameID, payload }: Payload) => {
    const player = getPlayerByUUID(socket)
    console.log('[GAME_CONFIG]', { gameID, player, payload })
    if (!gameID || !player) {
      return
    }

    const response = { ...payload, lastAuthor: player.uuid }
    socket.to(gameID).emit(ServerEvent.GAME_CONFIG, response)
  })
})

server.listen(port, () => console.log(`Listening on port ${port}`))

export default server
