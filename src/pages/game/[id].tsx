import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { GameConfig, OpponentProgress } from '@/typings/game'
import PageTitle from '@/components/PageTitle'
import { ExternalLink } from '@/components/visual'
import GameName from '@/components/GameName'
import { joinGameWithID, leaveGameWithID, RequestError } from '@/client/rest'
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
  const [errorMessage, setErrorMessage] = useState<string>()

  useEffect(() => {
    if (gameId !== manager.gameId) {
      manager.setId(gameId)
    }
  }, [gameId])

  const [gameConfig, setGameConfig] = useState<GameConfig | null | undefined>()
  const [opponentProgress, setOpponentProgress] = useState<OpponentProgress>()

  const joinGame = useCallback(async () => {
    if (typeof gameId !== 'string' || hasJoined || !player) return
    try {
      await joinGameWithID(gameId, player)
      setHasJoined(true)
    } catch (error) {
      if (error instanceof RequestError) {
        setErrorMessage(error.message)
      } else {
        setErrorMessage('Something went wrong')
      }
    }
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

  if (errorMessage) {
    return (
      <Themed>
        <PageTitle />
        <GameName />
        <p>{errorMessage}</p>
        <p>
          Please refresh the page or <ExternalLink href='/'>create a new game</ExternalLink>
        </p>
      </Themed>
    )
  }

  if (!hasJoined) {
    return (
      <Themed>
        <PageTitle />
        <GameName />
        <p>Connecting…</p>
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
