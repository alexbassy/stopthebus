import path from 'path'
import express from 'express'
import http from 'http'
import socketIO from 'socket.io'
import { promisify } from 'util'
import redis from 'redis'
import { getRandomValue } from '../helpers/util'
import {
  Payload,
  PlayerVote,
  ClientEvent,
  ServerEvent,
} from '../typings/socket-events'
import {
  Room,
  Rooms,
  Player,
  GameConfig,
  GameStage,
  GameRound,
  Round,
  RoundResults,
  Scores,
  PlayerScores,
} from '../typings/game'
import log from '../helpers/log'
import {
  scoreAnswer,
  getInitialScores,
  getFinalScores,
} from '../helpers/scores'

const app = express()
const server = http.createServer(app)
const port = process.env.PORT || 80

const client = redis.createClient(process.env.REDIS_URL as string)

client.on('error', (error) => {
  console.error(error)
})

const IO = socketIO(server)
const rooms: Rooms = {}
const players: { [uuid: string]: Player } = {}

const setAsync = promisify(client.set).bind(client)
const getAsync = promisify(client.get).bind(client)

const setRoom = (gameID: string, game: Room) => {
  return setAsync(`game:${gameID}`, JSON.stringify(game))
}

const getRoom = async (gameID: string): Promise<Room> => {
  const result = await getAsync(`game:${gameID}`)
  return JSON.parse(result)
}

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

  // Clean up any stale rooms
  Object.entries(rooms).forEach(([gameID, room]) => {
    const { created } = room.config
    const twoHours = 7200
    const isStale = created < Date.now() - twoHours
    if (isStale) {
      delete rooms[gameID]
    }
  })

  socket.on(
    ClientEvent.REQUEST_JOIN_GAME,
    async ({ gameID, payload }: Payload<GameConfig>) => {
      const player = getPlayerByUUID(socket)
      console.log('[REQUEST_JOIN_GAME]', { gameID, player, payload })

      // If the game doesn’t exist yet, we should ask the user if they want
      // to create it
      if (!gameID || !player) {
        return
      }

      const room = await getRoom(gameID)

      if (!room) {
        console.log('There is no room with this name')
        return
      }

      socket.join(gameID, async () => {
        // Add player from the room
        const isPlayerAlreadyInRoom = room.players.find(
          (player) => player.uuid === uuid
        )
        if (!isPlayerAlreadyInRoom) {
          room.players.push(player)
          await setRoom(gameID, room)
        }
        console.log('[REQUEST_JOIN_GAME] Emitting room')
        socket.emit(ServerEvent.JOINED_GAME, rooms[gameID])
        socket
          .in(gameID)
          .emit(ServerEvent.PLAYER_JOINED_GAME, rooms[gameID].players)
      })

      socket.on(ClientEvent.DISCONNECT, async () => {
        const room = await getRoom(gameID)

        if (room && player) {
          // Remove player from the room
          room.players = room.players.filter(({ uuid }) => uuid !== player.uuid)
          await setRoom(gameID, room)
          console.log(`Removed ${player.uuid} from the room`)
        }
        socket.in(gameID).emit(ServerEvent.PLAYER_LEFT, rooms[gameID].players)
      })
    }
  )

  socket.on(
    ClientEvent.REQUEST_CREATE_GAME,
    async ({ gameID, payload }: Payload<GameConfig>) => {
      const player = getPlayerByUUID(socket)
      console.log('[REQUEST_CREATE_GAME]', { gameID, player, payload })

      if (!gameID || !payload || !player) {
        return
      }

      const room = await getRoom(gameID)
      if (room && room.players.find(({ uuid }) => uuid === player.uuid)) {
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

      await setRoom(gameID, newRoom)

      socket.join(gameID, () => {
        const { players, config } = newRoom
        console.log(
          '[REQUEST_CREATE_GAME] Emitting game config and player joined event to room',
          config
        )
        IO.in(gameID).emit(ServerEvent.GAME_CONFIG, config)
        IO.in(gameID).emit(ServerEvent.PLAYER_JOINED_GAME, players)
      })
    }
  )

  socket.on(ClientEvent.GAME_CONFIG, async ({ gameID, payload }: Payload) => {
    const player = getPlayerByUUID(socket)
    console.log('[GAME_CONFIG]', { gameID, player, payload })
    if (!gameID || !player) {
      return
    }

    const room = await getRoom(gameID)

    if (!room) {
      console.log('There is no game with ID', gameID)
      socket.emit(ServerEvent.GAME_CONFIG, null)
      return
    }

    rooms.config = { ...payload, lastAuthor: player.uuid }
    await setRoom(gameID, room)
    socket.in(gameID).emit(ServerEvent.GAME_CONFIG, rooms[gameID].config)
  })

  socket.on(ClientEvent.START_ROUND, async ({ gameID }: Payload) => {
    const player = getPlayerByUUID(socket)
    if (!gameID || !player || !rooms[gameID]) {
      return
    }

    const room = await getRoom(gameID)

    if (!room) {
      return
    }

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

    const numRoundsPlayed = room.state.rounds.length
    const hasPlayedAllRounds = room.config.rounds === numRoundsPlayed
    room.state.stage = hasPlayedAllRounds ? GameStage.END : GameStage.ACTIVE

    // If on the start screen or review screen, we can go ahead
    if (!hasPlayedAllRounds) {
      const previouslyPlayedLetters = room.state.rounds.length
        ? room.state.rounds.map((round) => round.letter || '')
        : []

      const availableLetters = room.config.letters.filter(
        (letter) => !previouslyPlayedLetters.includes(letter)
      )

      const playerVotes = room.config.categories.reduce<PlayerScores>(
        (categories, category) => {
          categories[category] = 0
          return categories
        },
        {}
      )

      const newScores = room.players.reduce<Scores>((players, player) => {
        if (players[player.uuid]) players[player.uuid] = playerVotes
        return players
      }, {})

      const newRound: GameRound = {
        timeStarted: Date.now(),
        letter: getRandomValue(availableLetters),
        answers: answersTemplate,
        scores: newScores,
      }
      room.state.currentRound = newRound
    } else {
      room.state.finalScores = getFinalScores(room.state.rounds)
    }

    // maybe this is not necessary but idk
    await setRoom(gameID, room)

    IO.in(gameID).emit(ServerEvent.ROUND_STARTED, room.state)
  })

  socket.on(ClientEvent.END_ROUND, async ({ gameID }: Payload) => {
    const player = getPlayerByUUID(socket)
    if (!gameID || !player || !rooms[gameID]) {
      return
    }

    const room = await getRoom(gameID)
    if (!room) {
      return
    }
    const isGameActive = room.state.stage === GameStage.ACTIVE

    if (!isGameActive) {
      console.log('Cannot end a round for a game not in progress')
      return
    }

    room.state.stage = GameStage.REVIEW

    if (!room.state?.currentRound) {
      return log.e('Cannot end round that it not in progress')
    }

    room.state.currentRound.endedByPlayer = player.uuid

    const votes = getInitialScores(room)
    if (votes) room.state.currentRound.scores = votes

    await setRoom(gameID, room)

    IO.in(gameID).emit(ServerEvent.ROUND_ENDED, room.state)
  })

  socket.on(
    ClientEvent.FILLED_ANSWER,
    async ({ gameID, payload }: Payload<RoundResults>) => {
      const player = getPlayerByUUID(socket)
      if (!gameID || !player) {
        return
      }

      const room = await getRoom(gameID)

      // fucking typescript
      if (room.state.currentRound && payload) {
        room.state.currentRound.answers[player.uuid] = payload
        await setRoom(gameID, room)
      }
    }
  )

  socket.on(
    ClientEvent.VOTE_ANSWER,
    async ({ gameID, payload }: Payload<PlayerVote>) => {
      const player = getPlayerByUUID(socket)
      if (!gameID || !player || !payload) {
        return
      }

      const room = await getRoom(gameID)

      if (!room) {
        return
      }

      if (!room.state.currentRound) {
        console.log('Cannot vote while round in progress')
        return
      }
      const { playerID, category, value } = payload
      const answer = room.state.currentRound.answers[playerID][category]
      const letter = room.state.currentRound.letter as string

      room.state.currentRound.scores[playerID][category] =
        value === false ? 0 : scoreAnswer(room.config, letter, answer, false)

      await setRoom(gameID, room)

      IO.in(gameID).emit(
        ServerEvent.UPDATE_VOTES,
        room.state.currentRound.scores
      )
    }
  )
})

server.listen(port, () => console.log(`Listening on port ${port}`))

export default server
