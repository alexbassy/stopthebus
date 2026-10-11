import servertime from 'servertime'
import { getInitialScores } from '@/helpers/scores'
import {
  DocumentRef,
  FdbAllAnswersQuery,
  GameResponse,
  GameRound,
  GameStage,
  Player,
  Round,
  Scores,
} from '@/typings/game'
import { Handler } from 'worktop'
import { getFaunaError } from '../fauna-error'
import { workerClient, q } from '../client'
import httpStatuses from '@/constants/http-codes'
import { errors } from 'faunadb'

function getGame(id: string): Promise<GameResponse> {
  return workerClient.query<GameResponse>(q.Get(q.Match(q.Index('game_by_id'), id)))
}

async function getAnswers(gameId: string, round: number): Promise<Round> {
  const answers = await workerClient.query<FdbAllAnswersQuery>(
    q.Call('get-answers-for-round', gameId, round)
  )
  return answers.data.reduce<Round>((accum, data) => {
    accum[data.playerId] = data.answers
    return accum
  }, {})
}

async function deleteAnswers(gameId: string, round: number): Promise<void> {
  return workerClient
    .query<void>(q.Call('clear-answers-for-round', gameId, round))
    .then(() => undefined)
}

// Create a full answer record replacing missing entries with empty strings
// This is because the `currentRound` needs to be overwritten, as fauna writes are partial
function fillEmptyAnswers(answers: Round, categories: string[], players: Player[]): Round {
  return players.reduce<Round>((accum, player) => {
    accum[player.id] = Object.fromEntries(
      categories.map((category) => [category, answers?.[player.id]?.[category] || ''])
    )
    return accum
  }, {})
}

function updateRoundEnd(roundRef: DocumentRef, player: Player) {
  const endedRound: Partial<GameRound> = {
    endedByPlayer: player.id,
    timeEnded: Date.now(),
  }
  return workerClient.query(q.Update(roundRef, { data: { currentRound: endedRound } }))
}

function sleep(duration: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), duration)
  })
}

type RequestBody = { id?: string; player?: Player }

const handleEndRound: Handler = async (req, res) => {
  const timer = servertime.createTimer({ clock: 'ms' })
  const body = await req.body<RequestBody>()

  const id = body?.id
  const player = body?.player

  if (!id) return res.send(httpStatuses.UNPROCESSABLE_ENTITY, { message: 'Game ID required' })
  if (!player) return res.send(httpStatuses.UNPROCESSABLE_ENTITY, { message: 'Player required' })

  timer.start('getGame', 'Verify game')
  const { ref, data: game } = await getGame(id)
  timer.end('getGame')

  if (!game) {
    return res.send(httpStatuses.NOT_FOUND, { message: 'Game not found' })
  }

  const currentStage = game?.state.stage
  const wasStarted = currentStage === GameStage.ACTIVE

  if (!wasStarted || !game.currentRound) {
    return res.send(httpStatuses.NOT_ACCEPTABLE, { message: 'The game has not been started' })
  }

  timer.start('updateEnd', 'Mark game as ended')
  await updateRoundEnd(ref, player)
  timer.end('updateEnd')

  // Wait for players to submit final answers
  await sleep(2000)

  let answers: Round
  let scores: Scores
  try {
    answers = await getAnswers(id, game.currentRound.index)
    answers = fillEmptyAnswers(answers, game.config.categories, game.players)
  } catch (e) {
    return res.send(httpStatuses.INTERNAL_SERVER_ERROR, {
      message: 'The answers could not be found',
    })
  }

  try {
    const { players, config } = game
    const letter = game.currentRound.letter
    scores = getInitialScores(answers, letter, config, players)
  } catch (e) {
    console.error(`Answers for game "${id}" could not be scored`, e)
    return res.send(httpStatuses.INTERNAL_SERVER_ERROR, {
      message: 'The answers could not be scored',
    })
  }

  try {
    const newCurrentRound: Partial<GameRound> = { answers, scores, opponentProgress: null }

    await deleteAnswers(game.id, game.currentRound.index)

    timer.start('updateStage', 'Set game to review')
    await workerClient.query(
      q.Update(ref, {
        data: {
          state: { stage: GameStage.REVIEW },
          currentRound: newCurrentRound,
        },
      })
    )
    timer.end('updateStage')
  } catch (e) {
    console.error(e)
    const error = getFaunaError(e as errors.FaunaHTTPError)
    return res.send(error.status, { message: error.description })
  }

  res.setHeader('Server-Timing', timer.getHeader()!)
  return res.send(httpStatuses.ACCEPTED)
}

export default handleEndRound
