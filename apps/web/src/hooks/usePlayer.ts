import { Player } from '@stopthebus/shared'
import { useCallback, useEffect } from 'react'

import { getUserSession, updatePersistedUserName } from '@/helpers/getPersistedPlayer'
import { manager, useGamePlayer } from '@/hooks/database'

function usePlayer(): [Player | null, (playerName: string) => void] {
  const player = useGamePlayer()

  useEffect(() => {
    manager.player$.next(getUserSession())
  }, [])

  const updatePlayerName = useCallback(
    (playerName: string) => {
      if (!player?.id) return
      manager.setGamePlayerName(playerName)
    },
    [player?.id],
  )

  return [player, updatePlayerName]
}

export default usePlayer
