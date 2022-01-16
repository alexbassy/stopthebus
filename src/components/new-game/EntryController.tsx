import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { fromEvent, map, of, startWith } from 'rxjs'
import { joinGameWithID, leaveGameWithID, RequestError } from '@/client/rest'
import useGameIdFromRoute from '@/hooks/useGameIdFromRoute'
import usePlayer from '@/hooks/usePlayer'
import { useGameStateStage } from '@/hooks/supabase'
import { GameStage } from '@/typings/game'

const EntryController: React.FC = (props) => {
  const gameId = useGameIdFromRoute()
  const player = usePlayer()
  const gameStateStage = useGameStateStage()
  const [hasJoined, setHasJoined] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string>()
  const hasGameStarted = gameStateStage !== GameStage.PRE

  console.log('EntryController')

  const joinGame = useCallback(async () => {
    console.log('joinGame')
    if (!gameId || hasJoined || !player) return
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
    console.log('leaveGame')
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
    if (hasGameStarted) return

    const onVisibilityChange = visibility$.subscribe((isHidden) =>
      isHidden ? leaveGame() : joinGame()
    )

    return () => {
      onVisibilityChange.unsubscribe()
    }
  }, [gameId, joinGame, leaveGame, visibility$, hasGameStarted])

  useEffect(() => {
    if (hasGameStarted) {
      joinGame()
    }
  })

  if (errorMessage) {
    return <p>{errorMessage}</p>
  }

  if (!hasJoined) {
    return <p>Connecting…</p>
  }

  return <>{props.children}</>
}

export default EntryController
