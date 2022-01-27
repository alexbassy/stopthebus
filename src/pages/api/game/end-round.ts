import { q, serverClient } from '@/client/fauna'
import httpStatuses from '@/constants/http-codes'
import { assertMethod, getGameId, getGamePlayer } from '@/helpers/api/validation'
import { getNextLetterForGame } from '@/helpers/letters'
import log from '@/helpers/log'
import { getGameName } from '@/helpers/random'
import { getFinalScores, getInitialScores } from '@/helpers/scores'
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
import type { NextApiRequest, NextApiResponse } from 'next'

type ErrorResponse = any

function getGame(id: string): Promise<GameResponse> {
  return serverClient.query<GameResponse>(q.Get(q.Match(q.Index('game_by_id'), id)))
}

function getPreviouslyPlayedLetters(rounds: GameRound[] | null) {
  if (!rounds || !rounds.length) {
    return []
  }
  return rounds.map((round) => round.letter)
}

async function getAnswers(gameId: string, round: number): Promise<Round> {
  const answers = await serverClient.query<FdbAllAnswersQuery>(
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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Game | ErrorResponse>
) {
  if (!assertMethod('POST', { req, res })) {
    return
  }

  const [id, idError] = getGameId({ req, res })
  if (idError) return

  const [player, playerError] = getGamePlayer({ req, res })
  if (playerError) return

  const start = Date.now()

  const { ref, data: game } = await getGame(id)

  if (!game) {
    return res.status(404).json({ error: true })
  }

  const currentStage = game?.state.stage
  const wasStarted = currentStage === GameStage.ACTIVE

  if (!wasStarted || !game.currentRound) {
    return res.status(400).json({ message: 'The game has not been started' })
  }

  let answers: Round
  let scores: Scores
  try {
    answers = await getAnswers(id, game.currentRound.index)
    answers = fillEmptyAnswers(answers, game.config.categories, game.players)
  } catch (e) {
    console.log(e)
    return res.status(400).json({ message: 'The answers could not be found' })
  }

  try {
    const { players, config } = game
    const letter = game.currentRound.letter
    scores = getInitialScores(answers, letter, config, players)
  } catch (e) {
    console.log(e)
    return res.status(400).json({ message: 'The answers could not be scored' })
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

    await serverClient.query(
      q.Update(ref, {
        data: {
          state: {
            stage: GameStage.REVIEW,
          },
          currentRound: newCurrentRound,
        },
      })
    )
  } catch (e) {
    return res.status(httpStatuses.BAD_REQUEST).json({ message: e })
  } finally {
    log.d(`Took ${Date.now() - start}ms to end round`)
  }

  return res.status(200).end()
}
