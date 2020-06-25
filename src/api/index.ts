import path from 'path'
import express, { json } from 'express'
import http from 'http'
import socketIO from 'socket.io'
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
import client, {
  players,
  gameConfigs,
  gameStates,
  gamePlayers,
  routeGetRooms,
} from './redis-client'
import { joinGame, createGame } from './actions'

const app = express()
const server = http.createServer(app)
const port = process.env.PORT || 80

const IO = socketIO(server)

app.set('json spaces', 2)

app.use(express.static(path.resolve('build')))

// Add debugging route. Should figure out a way to make this secure,
// but for the meantime there is no sensitive data. Revealing the
// structure of the schema does make the app vulnerable though.
app.get('/__debug/rooms', routeGetRooms)

app.get('/_debug/players', (req, res) => {
  client.keys('player:*', function (err, keys) {
    if (err) return console.log(err)

    res.json(keys)
  })
})

app.get('*', (req, res) => {
  res.sendFile(path.resolve('build/index.html'))
})

const getUUID = (socket: SocketIO.Socket) => {
  return socket.handshake.query.sessionID
}

const getPlayerByUUID = (uuid: string): Promise<Player> => {
  return players.get(uuid)
}

IO.on('connection', async (socket) => {
  const uuid = getUUID(socket)
  let player = await getPlayerByUUID(uuid)

  // Add player to global players list
  if (!player) {
    player = await players.set(uuid, { uuid, id: socket.id })
  }

  // Remove player from global players list upon disconnection
  // socket.on(ClientEvent.DISCONNECT, async () => {
  //   const player = await getPlayer(uuid)

  //   if (player) {
  //     setPlayer(uuid, '')
  //   }
  // })

  // Clean up any stale rooms
  // Object.entries(rooms).forEach(([gameID, room]) => {
  //   const { created } = room.config
  //   const twoHours = 7200
  //   const isStale = created < Date.now() - twoHours
  //   if (isStale) {
  //     delete rooms[gameID]
  //   }
  // })

  socket.on(ClientEvent.REQUEST_JOIN_GAME, joinGame(IO, socket))

  socket.on(ClientEvent.REQUEST_CREATE_GAME, createGame(IO, socket))

  socket.on(ClientEvent.GAME_CONFIG, async ({ gameID, payload }: Payload) => {
    console.log('[GAME_CONFIG]', { gameID, player, payload })
    if (!gameID || !player) {
      return
    }

    let config = await gameConfigs.get(gameID)

    if (!config) {
      console.log('There is no game with ID', gameID)
      socket.emit(ServerEvent.GAME_CONFIG, null)
      return
    }

    config = { ...payload, lastAuthor: player.uuid }
    await gameConfigs.set(gameID, config)
    socket.in(gameID).emit(ServerEvent.GAME_CONFIG, config)
  })

  socket.on(ClientEvent.START_ROUND, async ({ gameID }: Payload) => {
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
      state.stage === GameStage.ACTIVE || state.stage === GameStage.END
    const isGameInReview = state.stage === GameStage.REVIEW

    if (isGameActiveOrEnded) {
      console.log('Cannot start a round that is in progress or has ended')
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
    state.stage = hasPlayedAllRounds ? GameStage.END : GameStage.ACTIVE

    // If on the start screen or review screen, we can go ahead
    if (!hasPlayedAllRounds) {
      const previouslyPlayedLetters = state.rounds.length
        ? state.rounds.map((round) => round.letter || '')
        : []

      const availableLetters = config.letters.filter(
        (letter) => !previouslyPlayedLetters.includes(letter)
      )

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
        letter: getRandomValue(availableLetters),
        answers: answersTemplate,
        scores: newScores,
      }
      state.currentRound = newRound
    } else {
      state.finalScores = getFinalScores(state.rounds)
    }

    // Save everything
    await Promise.all([
      gameConfigs.set(gameID, config),
      gamePlayers.set(gameID, players),
      gameStates.set(gameID, state),
    ])

    IO.in(gameID).emit(ServerEvent.ROUND_STARTED, state)
  })

  socket.on(ClientEvent.END_ROUND, async ({ gameID }: Payload) => {
    if (!gameID || !player) {
      return
    }

    let [config, players, state] = await Promise.all([
      gameConfigs.get(gameID),
      gamePlayers.get(gameID),
      gameStates.get(gameID),
    ])

    const room: Room = { config, players, state }

    if (!state) {
      return
    }

    const isGameActive = state.stage === GameStage.ACTIVE

    if (!isGameActive) {
      console.log('Cannot end a round for a game not in progress')
      return
    }

    state.stage = GameStage.REVIEW

    if (!state?.currentRound) {
      return log.e('Cannot end round that it not in progress')
    }

    state.currentRound.endedByPlayer = player.uuid

    const votes = getInitialScores(room)
    if (votes) state.currentRound.scores = votes

    await gameStates.set(gameID, state)
    IO.in(gameID).emit(ServerEvent.ROUND_ENDED, state)
  })

  socket.on(
    ClientEvent.FILLED_ANSWER,
    async ({ gameID, payload }: Payload<RoundResults>) => {
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
  )

  socket.on(
    ClientEvent.VOTE_ANSWER,
    async ({ gameID, payload }: Payload<PlayerVote>) => {
      if (!gameID || !player || !payload) {
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
  )
})

server.listen(port, () => console.log(`Listening on port ${port}`))

export default server
