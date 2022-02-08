import { getNextLetterForGame } from '@/helpers/letters'
import { getInitialScores } from '@/helpers/scores'
import {
  FdbAllAnswersQuery,
  Game,
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

function getPreviouslyPlayedLetters(rounds: GameRound[] | null) {
  if (!rounds || !rounds.length) {
    return []
  }
  return rounds.map((round) => round.letter)
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

type RequestBody = { id?: string; player?: Player }

const handleX: Handler = async (req, res) => {
  const body = await req.body<RequestBody>()

  const id = body?.id
  const player = body?.player

  if (!id) return res.send(httpStatuses.UNPROCESSABLE_ENTITY, { message: 'Game ID required' })
  if (!player) return res.send(httpStatuses.UNPROCESSABLE_ENTITY, { message: 'Player required' })

  const { ref, data: game } = await getGame(id)

  if (!game) {
    return res.send(httpStatuses.NOT_FOUND, { message: 'Game not found' })
  }

  const currentStage = game?.state.stage
  const wasStarted = currentStage === GameStage.ACTIVE

  if (!wasStarted || !game.currentRound) {
    return res.send(httpStatuses.NOT_ACCEPTABLE, { message: 'The game has not been started' })
  }

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
    const nextLetter = getNextLetterForGame(
      game.config.letters.split(''),
      getPreviouslyPlayedLetters([...(game.previousRounds || []), game.currentRound])
    )

    const newCurrentRound: Partial<GameRound> = {
      timeEnded: Date.now(),
      endedByPlayer: player.id,
      nextLetter,
      answers,
      scores,
    }

    await workerClient.query(
      q.Update(ref, {
        data: {
          state: { stage: GameStage.REVIEW },
          currentRound: newCurrentRound,
        },
      })
    )
  } catch (e) {
    console.error(e)
    const error = getFaunaError(e as errors.FaunaHTTPError)
    return res.send(error.status, { message: error.description })
  }

  return res.send(httpStatuses.ACCEPTED)
}

export default handleX
