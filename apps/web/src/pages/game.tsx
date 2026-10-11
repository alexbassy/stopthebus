import { useEffect } from 'react'

import GameViewController from '@/components/GameViewController'
import Themed from '@/components/Themed'
import { manager } from '@/hooks/database'
import useGameIdFromRoute from '@/hooks/useGameIdFromRoute'

export default function Game() {
  const gameId = useGameIdFromRoute()

  useEffect(() => {
    manager.connect(gameId.trim().toLowerCase())
    return () => manager.disconnect()
  }, [gameId])

  return (
    <Themed>
      <title>Game - Stop The Bus</title>
      <GameViewController />
    </Themed>
  )
}
