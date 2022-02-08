import { Handler } from 'worktop'
import { Game, GameResponse, GameRound, GameStage } from '@/typings/game'
import { getFaunaError } from '../fauna-error'
import { workerClient, q } from '../client'
import { getGameName } from '@/helpers/random'
import { getFinalScores } from '@/helpers/scores'
import { getNextLetterForGame } from '@/helpers/letters'
import httpStatuses from '@/constants/http-codes'
import { errors } from 'faunadb'

function getGame(id: string): Promise<GameResponse> {
  return workerClient.query<GameResponse>(q.Get(q.Match(q.Index('game_by_id'), id)))
}

function getPreviouslyPlayedLetters(previousRounds: GameRound[] | null) {
  if (!previousRounds || !previousRounds.length) {
    return []
  }
  return previousRounds.map((round) => round.letter)
}

function getPreviousRounds(currentRound: GameRound | null, previousRounds: GameRound[] | null) {
  const newPreviousRounds = [...(previousRounds || [])]
  if (currentRound?.timeEnded) {
    newPreviousRounds.push(currentRound)
  }
  return newPreviousRounds
}

type RequestBody = { id?: string }

const handleStart: Handler = async (req, res) => {
  const body = await req.body<RequestBody>()

  const id = body?.id
  if (!id) return res.send(httpStatuses.UNPROCESSABLE_ENTITY, { message: 'Game ID required' })

  const { ref, data: game } = await getGame(id)

  if (!game) {
    return res.send(httpStatuses.NOT_FOUND, { message: 'Game not found' })
  }

  const currentStage = game?.state.stage
  const canStart = currentStage && [GameStage.PRE, GameStage.REVIEW].includes(currentStage)

  if (!canStart) {
    return res.send(400, { message: 'The game is either finished or already in play' })
  }

  try {
    let newData: Partial<Game>

    const isLastRound = game.currentRound?.index === game.config.numRounds - 1

    if (isLastRound) {
      const allRounds = [...(game.previousRounds || []), game.currentRound as GameRound]
      const finalScores = getFinalScores(allRounds)
      newData = {
        state: {
          stage: GameStage.FINISHED,
          finalScores,
          nextGameId: getGameName(),
        },
        previousRounds: allRounds,
        currentRound: null,
      }
    } else {
      // 3 seconds with a bit of buffer time to account for network delay
      const startTime = Date.now() + 3500

      const previousRounds = getPreviousRounds(game.currentRound, game.previousRounds)

      const newRound: GameRound = {
        index: previousRounds.length,
        letter: getNextLetterForGame(
          game.config.letters.split(''),
          getPreviouslyPlayedLetters(previousRounds)
        ),
        timeStarted: startTime,
        answers: {},
        scores: {},
      }

      newData = {
        state: {
          stage: GameStage.ACTIVE,
        },
        previousRounds,
        currentRound: newRound,
      }
    }

    await workerClient.query<GameResponse>(q.Update(ref, { data: newData }))
  } catch (e) {
    console.error(e)
    const error = getFaunaError(e as errors.FaunaHTTPError)
    return res.send(error.status, { message: error.description })
  }

  return res.send(httpStatuses.ACCEPTED)
}

export default handleStart
