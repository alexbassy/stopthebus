import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { distinctUntilChanged, fromEvent, map, of, startWith } from 'rxjs'
import { joinGameWithID, leaveGameWithID, RequestError } from '@/client/rest'
import useGameIdFromRoute from '@/hooks/useGameIdFromRoute'
import usePlayer from '@/hooks/usePlayer'
import { JoinState, manager, useGameStateStage, useJoinState } from '@/hooks/supabase'
import { GameStage } from '@/typings/game'

const EntryController: React.FC = (props) => {
  const gameId = useGameIdFromRoute()
  const player = usePlayer()
  const joinState = useJoinState()
  const gameStateStage = useGameStateStage()
  const [hasJoined, setHasJoined] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>()
  const hasGameStarted = gameStateStage !== null && gameStateStage !== GameStage.PRE

  const joinGame = useCallback(async () => {
    if (!gameId || !player || joinState !== JoinState.NotRequested) return
    try {
      await joinGameWithID(gameId, player)
      manager.setJoinState(JoinState.CanJoin)
      setHasJoined(true)
    } catch (error) {
      setErrorMessage(error instanceof RequestError ? error.message : 'Something went wrong')
    }
  }, [gameId, joinState, player])

  const leaveGame = useCallback(() => {
    if (joinState !== JoinState.CanJoin || !player || hasGameStarted) return
    leaveGameWithID(gameId, player)
    setHasJoined(false)
    manager.setJoinState(JoinState.NotRequested)
  }, [gameId, joinState, player, hasGameStarted])

  const visibility$ = useMemo(() => {
    if (hasGameStarted || typeof document === 'undefined') return of(true)
    return fromEvent(document, 'visibilitychange').pipe(
      startWith(false),
      map(() => document.visibilityState === 'hidden'),
      distinctUntilChanged()
    )
  }, [hasGameStarted])

  // Join/leave game when visibility changes
  useEffect(() => {
    // Do not leave game when in play, so it is possible to reenter
    if (!player || hasGameStarted || typeof document === 'undefined') return

    const onVisibilityChange = visibility$.subscribe((isHidden) => {
      isHidden ? leaveGame() : joinGame()
    })

    return () => {
      onVisibilityChange.unsubscribe()
    }
  }, [joinGame, leaveGame, hasGameStarted, visibility$, player])

  if (errorMessage) {
    return <p>{errorMessage}</p>
  }

  if (!hasJoined) {
    return <p>Connecting…</p>
  }

  return <>{props.children}</>
}

export default EntryController
