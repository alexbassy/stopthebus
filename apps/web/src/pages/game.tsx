import { useEffect } from 'react'
import Themed from '@/components/Themed'
import GameViewController from '@/components/GameViewController'
import useGameIdFromRoute from '@/hooks/useGameIdFromRoute'
import { manager } from '@/hooks/database'

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
