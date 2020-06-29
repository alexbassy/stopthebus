import path from 'path'
import express from 'express'
import http from 'http'
import socketIO from 'socket.io'
import { ClientEvent } from '../typings/socket-events'
import client, { players, routeGetRooms } from './redis-client'
import { joinGame, createGame, updateGameConfig } from './actions/game'
import { updateNickname } from './actions/player'
import { startRound, endRound, filledAnswer, voteAnswer } from './actions/round'
import { getPlayerUUID } from '../helpers/socket'
import * as random from '../helpers/random'

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

IO.on('connection', async (socket) => {
  const uuid = getPlayerUUID(socket)
  let player = await players.get(uuid)

  // Add player to global players list
  if (!player) {
    player = await players.set(uuid, {
      uuid,
      id: socket.id,
      name: random.getPlayerName(),
    })
  }

  socket.on(ClientEvent.REQUEST_JOIN_GAME, joinGame(IO, socket))

  socket.on(ClientEvent.REQUEST_CREATE_GAME, createGame(IO, socket))

  socket.on(ClientEvent.UPDATE_NICKNAME, updateNickname(IO, socket))

  socket.on(ClientEvent.GAME_CONFIG, updateGameConfig(IO, socket))

  socket.on(ClientEvent.START_ROUND, startRound(IO, socket))

  socket.on(ClientEvent.END_ROUND, endRound(IO, socket))

  // This could end up rewriting other people’s answers,
  // but with any luck the state would update to the final
  // state when a user clicks the ”End game’ button.
  socket.on(ClientEvent.FILLED_ANSWER, filledAnswer(IO, socket))

  socket.on(ClientEvent.VOTE_ANSWER, voteAnswer(IO, socket))
})

server.listen(port, () => console.log(`Listening on port ${port}`))

export default server
