import { updateAlliteration } from '@/client/functions'
import { useGameConfigAlliteration } from '@/hooks/supabase'
import useGameIdFromRoute from '@/hooks/useGameIdFromRoute'
import { Checkbox } from '@/components/visual'

const Alliteration: React.FC = () => {
  const gameId = useGameIdFromRoute()
  const isAlliterationRewarded = useGameConfigAlliteration()

  const handleChange = () => {
    updateAlliteration(gameId, !isAlliterationRewarded)
  }

  return (
    <section>
      <label>
        <Checkbox type='checkbox' checked={isAlliterationRewarded} onChange={handleChange} /> Points
        for alliteration
      </label>
    </section>
  )
}

export default Alliteration
