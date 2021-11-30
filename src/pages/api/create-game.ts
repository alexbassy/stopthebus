// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import getSupabaseClient from '@/client/supabase'
import { GameConfig, GameState, Players, Rooms } from '@/typings/supabase'
import { SupabaseClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

type Data = {
  game: Rooms
  gameConfig: GameConfig
  gameState: GameState
  players: Players[]
}

type ErrorResponse = any

function createGameConfig(client: SupabaseClient) {
  return client.from<GameConfig>('gameConfig').insert([
    {
      categories: [],
      numRounds: 3,
      mode: 'timer',
      durationMs: 0,
      alliteration: false,
      letters: 'abcdefghijklmnopqrstuvwxyz',
    },
  ])
}

// function getPlayer(client: SupabaseClient)

function createGameState(client: SupabaseClient) {
  return client.from<GameState>('gameStates').insert([{}])
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data | ErrorResponse>
) {
  const gameID = req.body.name || req.query.name
  const ownerID = req.body.owner || req.query.owner

  if (!gameID) {
    res.status(400).json({ message: 'Game ID required' })
  }

  if (!ownerID) {
    res.status(400).json({ message: 'Owner ID required' })
  }

  const start = Date.now()

  const supabase = getSupabaseClient()

  const [gameConfig, gameState] = await Promise.all([
    createGameConfig(supabase),
    createGameState(supabase),
  ])
  console.log(gameConfig)

  if (gameConfig.error) {
    console.error(gameConfig.error)
    return res.status(400).json({ message: JSON.stringify(gameConfig.error) })
  }

  if (gameState.error) {
    console.error(gameState.error)
    return res.status(400).json({ message: JSON.stringify(gameState.error) })
  }

  console.log(gameState)

  const { data: game, error: gameError } = await supabase.from<Rooms>('rooms').insert([
    {
      name: gameID,
      gameState: gameState.data?.[0].id,
      gameConfig: gameConfig.data?.[0].id,
      players: [ownerID],
    },
  ])

  if (gameError) {
    return res.status(400).json({ message: JSON.stringify(gameError) })
  }

  return res.status(201).send(
    JSON.stringify(
      {
        game: game?.[0],
        gameState: gameState.data[0],
        gameConfig: gameConfig.data[0],
        duration: Date.now() - start,
      },
      null,
      2
    )
  )
}
