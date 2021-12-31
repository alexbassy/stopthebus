import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { GameConfig, OpponentProgress } from '@/typings/game'
import PageTitle from '@/components/PageTitle'
import { ExternalLink } from '@/components/visual'
import GameName from '@/components/GameName'
import { joinGameWithID, leaveGameWithID } from '@/client/rest'
import Themed from '@/components/Themed'
import { Subscribe } from '@react-rxjs/core'
import { manager } from '@/hooks/supabase'
import useGameIdFromRoute from '@/hooks/useGameIdFromRoute'
import { fromEvent, map, of, startWith } from 'rxjs'
import GameViewController from '@/components/GameViewController'
import usePlayer from '@/hooks/usePlayer'

export default function Game() {
  const gameId = useGameIdFromRoute()
  const player = usePlayer()
  const [hasJoined, setHasJoined] = useState<boolean>(false)

  useEffect(() => {
    if (gameId !== manager.gameId) {
      manager.setId(gameId)
    }
  }, [gameId])

  const [gameConfig, setGameConfig] = useState<GameConfig | null | undefined>()
  const [opponentProgress, setOpponentProgress] = useState<OpponentProgress>()

  const joinGame = useCallback(async () => {
    if (typeof gameId !== 'string' || hasJoined || !player) return
    const response = await joinGameWithID(gameId, player)
    setGameConfig(response.config)
    setHasJoined(true)
  }, [gameId, hasJoined, player])

  const leaveGame = useCallback(() => {
    if (!hasJoined || !player) return
    leaveGameWithID(gameId, player)
    setHasJoined(false)
  }, [gameId, hasJoined, player])

  const visibility$ = useMemo(() => {
    if (typeof document === 'undefined') return of(false)
    return fromEvent(document, 'visibilitychange').pipe(
      startWith(false),
      map(() => document.visibilityState === 'hidden')
    )
  }, [])

  // Join/leave game when visibility changes
  useEffect(() => {
    const onVisibilityChange = visibility$.subscribe((isHidden) =>
      isHidden ? leaveGame() : joinGame()
    )

    return () => {
      onVisibilityChange.unsubscribe()
    }
  }, [gameId, joinGame, leaveGame, visibility$])

  if (!hasJoined) {
    return (
      <Themed>
        <PageTitle />
        <GameName />
        <p>Connecting…</p>
      </Themed>
    )
  }

  if (!hasJoined && gameConfig === null) {
    return (
      <Themed>
        <PageTitle />
        <GameName />
        <p>Sorry! You disconnected from the server. Please refresh the page.</p>
      </Themed>
    )
  }

  if (hasJoined && gameConfig === null) {
    return (
      <Themed>
        <PageTitle />
        <GameName />
        <p>Sorry, the game does not exist.</p>
        <p>
          Please refresh the page or <ExternalLink href='/'>create a new game</ExternalLink>
        </p>
      </Themed>
    )
  }

  return (
    <Themed>
      <Subscribe>
        <GameViewController />
      </Subscribe>
    </Themed>
  )
}
