import React, { useEffect, useState } from 'react'
import Themed from '@/components/Themed'
import { Subscribe } from '@react-rxjs/core'
import { manager } from '@/hooks/database'
import useGameIdFromRoute from '@/hooks/useGameIdFromRoute'
import GameViewController from '@/components/GameViewController'
import EntryController from '@/components/new-game/EntryController'

export default function Game() {
  const gameId = useGameIdFromRoute()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (gameId !== manager.gameId) {
      manager.setId(gameId)
      setIsReady(true)
    }
  }, [gameId])

  return (
    <Themed>
      <Subscribe>{isReady && <GameViewController />}</Subscribe>
    </Themed>
  )
}
