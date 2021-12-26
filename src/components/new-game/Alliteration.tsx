import { updateAlliteration, updateLetters } from '@/client/functions'
import { useGameConfigAlliteration, useGameConfigLetters } from '@/hooks/supabase'
import useGameIdFromRoute from '@/hooks/useGameIdFromRoute'
import { Checkbox, H3, Item, List, Spacing } from '@/components/visual'
import { ENGLISH_LETTERS } from '@/constants/letters'
import { Flex } from '@/components/Grid'

const Alliteration: React.FC = () => {
  const gameId = useGameIdFromRoute()
  const isAlliterationRewarded = useGameConfigAlliteration()

  console.log({ gameId, isAlliterationRewarded })

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
