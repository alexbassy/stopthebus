import path from 'path'
import express from 'express'
import http from 'http'
import socketIO from 'socket.io'
import { Payload, ClientEvent, ServerEvent } from '../typings/socket-events'
import { Rooms, Player, GameConfig } from '../typings/game'

const app = express()
const server = http.createServer(app)
const port = 4000

const IO = socketIO(server)
const rooms: Rooms = {}
const players: { [uuid: string]: Player } = {}

app.set('json spaces', 2)

app.use(express.static(path.resolve('build')))

app.get('/_debug/rooms', (req, res) => {
  res.json(rooms)
})

app.get('/_debug/players', (req, res) => {
  res.json(players)
})

app.get('*', (req, res) => {
  res.sendFile(path.resolve('build/index.html'))
})

const getUUID = (socket: SocketIO.Socket) => {
  return socket.handshake.query.sessionID
}

const getPlayerByUUID = (socket: SocketIO.Socket): Player | undefined => {
  const uuid = getUUID(socket)
  return players[uuid]
}

IO.on('connection', (socket) => {
  const uuid = getUUID(socket)

  // Add player to global players list
  if (!players[uuid]) {
    players[uuid] = { uuid, id: socket.id }
  }

  // Remove player from global players list upon disconnection
  socket.on(ClientEvent.DISCONNECT, () => {
    if (players[uuid]) {
      delete players[uuid]
    }
  })

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
        const isPlayerAlreadyInRoom = rooms[gameID].players.find(
          (player) => player.uuid === uuid
        )
        if (!isPlayerAlreadyInRoom) {
          rooms[gameID].players.push(player)
        }
        console.log(
          '[REQUEST_JOIN_GAME] Emitting GAME_CONFIG',
          rooms[gameID].config
        )
        IO.in(gameID).emit(ServerEvent.GAME_CONFIG, rooms[gameID].config)
        IO.in(gameID).emit(
          ServerEvent.PLAYER_JOINED_GAME,
          rooms[gameID].players
        )
      })

      socket.on(ClientEvent.DISCONNECT, () => {
        if (rooms[gameID] && player) {
          // Remove player from the room
          rooms[gameID].players = rooms[gameID].players.filter(
            ({ uuid }) => uuid !== player.uuid
          )
          console.log(`Removed ${player.uuid} from the room`)
        }
        socket.in(gameID).emit(ServerEvent.PLAYER_LEFT, rooms[gameID].players)
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
        console.log(
          '[REQUEST_START_GAME] Emitting game config and player joined event to room',
          config
        )
        IO.in(gameID).emit(ServerEvent.GAME_CONFIG, config)
        IO.in(gameID).emit(ServerEvent.PLAYER_JOINED_GAME, players)
      })
    }
  )

  socket.on(ClientEvent.GAME_CONFIG, ({ gameID, payload }: Payload) => {
    const player = getPlayerByUUID(socket)
    console.log('[GAME_CONFIG]', { gameID, player, payload })
    if (!gameID || !player) {
      return
    }

    if (!rooms[gameID]) {
      console.log('There is no game with ID', gameID)
      socket.emit(ServerEvent.GAME_CONFIG, null)
      return
    }

    rooms[gameID].config = { ...payload, lastAuthor: player.uuid }
    socket.in(gameID).emit(ServerEvent.GAME_CONFIG, rooms[gameID].config)
  })
})

server.listen(port, () => console.log(`Listening on port ${port}`))

export default server
