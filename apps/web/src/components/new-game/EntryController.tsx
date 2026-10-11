import { GameStage } from '@stopthebus/shared'
import React, { useEffect } from 'react'
import { Link } from 'wouter'

import { manager, useGameError, useGamePlayers, useGameStateStage } from '@/hooks/database'
import usePlayer from '@/hooks/usePlayer'

// Shows the game once the server has confirmed this player is in it, or says why not
const EntryController: React.FC<React.PropsWithChildren> = (props) => {
  const [player] = usePlayer()
  const error = useGameError()
  const players = useGamePlayers()
  const gameStateStage = useGameStateStage()
  const hasGameStarted = gameStateStage !== null && gameStateStage !== GameStage.pre

  // Leave while the tab is hidden so the player list stays accurate. Once play
  // has begun players stay in the game so they can come back.
  useEffect(() => {
    if (!player || hasGameStarted) return
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') manager.leave()
      else manager.join()
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => document.removeEventListener('visibilitychange', onVisibilityChange)
  }, [player, hasGameStarted])

  const isInGame = players.some((p) => p.id === player?.id)

  // Joining failed, or the game has expired. Any other error, such as a message
  // the server didn't accept, shouldn't take the game away from a player in it.
  if (error && (!isInGame || error.code === 'notFound')) {
    return (
      <>
        <p>{error.code === 'notFound' ? 'We couldn’t find a game by that name.' : error.message}</p>
        <Link href='/'>Back to the start</Link>
      </>
    )
  }

  if (!isInGame) {
    return <p>Connecting…</p>
  }

  return <>{props.children}</>
}

export default EntryController
