import { getUserSession } from '@/helpers/getPersistedPlayer'
import { Player } from '@/typings/game'
import { useEffect, useState } from 'react'

function usePlayer() {
  const [player, setPlayer] = useState<Player | null>(null)

  useEffect(() => {
    setPlayer(getUserSession())
  }, [])

  return player
}

export default usePlayer
