import { useCallback, useEffect } from 'react'
import { getUserSession, updatePersistedUserName } from '@/helpers/getPersistedPlayer'
import { Player } from '@/typings/game'
import { manager, useGamePlayer } from '@/hooks/supabase'

function usePlayer(): [Player | null, (playerName: string) => void] {
  const player = useGamePlayer()

  useEffect(() => {
    manager.player$.next(getUserSession())
  }, [])

  const updatePlayerName = useCallback(
    (playerName: string) => {
      if (!player?.id) return
      manager.setGamePlayerName(player.id, playerName)
    },
    [player?.id]
  )

  return [player, updatePlayerName]
}

export default usePlayer
