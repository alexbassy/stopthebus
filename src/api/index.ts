import path from 'path'
import express from 'express'
import http from 'http'
import socketIO from 'socket.io'
import { getRandomValue } from '../helpers/util'
import { Payload, ClientEvent, ServerEvent } from '../typings/socket-events'
import {
  Room,
  Rooms,
  Player,
  GameConfig,
  GameStage,
  GameRound,
  Round,
  RoundResults,
} from '../typings/game'

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
        socket.emit(ServerEvent.JOINED_GAME, rooms[gameID])
        socket
          .in(gameID)
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
        socket.in(gameID).emit(ServerEvent.PLAYER_LEFT, rooms[gameID].players)
      })
    }
  )

  socket.on(
    ClientEvent.REQUEST_CREATE_GAME,
    ({ gameID, payload }: Payload<GameConfig>) => {
      const player = getPlayerByUUID(socket)
      console.log('[REQUEST_CREATE_GAME]', { gameID, player, payload })

      if (!gameID || !payload || !player) {
        return
      }

      if (
        rooms[gameID] &&
        rooms[gameID].players.find(({ uuid }) => uuid === player.uuid)
      ) {
        console.log('host rejoined')
      }

      const newRoom: Room = {
        config: { ...payload, lastAuthor: player.uuid },
        players: [player],
        state: {
          stage: GameStage.PRE,
          rounds: [],
        },
      }

      rooms[gameID] = newRoom

      socket.join(gameID, () => {
        const { players, config } = rooms[gameID]
        console.log(
          '[REQUEST_CREATE_GAME] Emitting game config and player joined event to room',
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

  socket.on(ClientEvent.START_ROUND, ({ gameID }: Payload) => {
    const player = getPlayerByUUID(socket)
    if (!gameID || !player || !rooms[gameID]) {
      return
    }

    const room = rooms[gameID]

    const isGameActiveOrEnded =
      room.state.stage === GameStage.ACTIVE ||
      room.state.stage === GameStage.END
    const isGameInReview = room.state.stage === GameStage.REVIEW

    if (isGameActiveOrEnded) {
      console.log('Cannot start a round that is in progress or has ended')
      return
    }

    const answersTemplate: Round = room.players.reduce(
      (round: Round, player) => {
        round[player.uuid] = {}
        return round
      },
      {}
    )

    if (isGameInReview) {
      const roundResults = room.state.currentRound
      if (roundResults) room.state.rounds.push(roundResults)
      delete room.state.currentRound
    }

    // If on the start screen or review screen, we can go ahead
    room.state.stage = GameStage.ACTIVE
    const previouslyPlayedLetters = room.state.rounds.length
      ? room.state.rounds.map((round) => round.letter || '')
      : []
    const availableLetters = room.config.letters.filter(
      (letter) => !previouslyPlayedLetters.includes(letter)
    )
    const newRound: GameRound = {
      timeStarted: Date.now(),
      letter: getRandomValue(availableLetters),
      answers: answersTemplate,
    }
    room.state.currentRound = newRound

    // maybe this is not necessary but idk
    rooms[gameID].state = room.state

    IO.in(gameID).emit(ServerEvent.ROUND_STARTED, room.state)
  })

  socket.on(ClientEvent.END_ROUND, ({ gameID }: Payload) => {
    const player = getPlayerByUUID(socket)
    if (!gameID || !player || !rooms[gameID]) {
      return
    }

    const room = rooms[gameID]
    const isGameActive = room.state.stage === GameStage.ACTIVE

    if (!isGameActive) {
      console.log('Cannot end a round for a game not in progress')
      return
    }

    const numRoundsPlayed = room.state.rounds.length + 1
    const hasPlayedAllRounds = room.config.rounds === numRoundsPlayed
    room.state.stage = hasPlayedAllRounds ? GameStage.END : GameStage.REVIEW

    if (room.state?.currentRound) {
      room.state.currentRound.endedByPlayer = player.uuid
    }

    IO.in(gameID).emit(ServerEvent.ROUND_ENDED, room.state)
  })

  socket.on(
    ClientEvent.FILLED_ANSWER,
    ({ gameID, payload }: Payload<RoundResults>) => {
      const player = getPlayerByUUID(socket)
      if (!gameID || !player || !rooms[gameID]) {
        return
      }

      console.log('[FILLED_ANSWER]', payload)
      // fucking typescript
      const game = rooms[gameID]
      if (game.state.currentRound && payload) {
        console.log('has payload', payload)
        game.state.currentRound.answers[player.uuid] = payload
        rooms[gameID] = game
      } else {
        debugger
        console.log('something was false', payload)
      }
    }
  )
})

server.listen(port, () => console.log(`Listening on port ${port}`))

export default server
