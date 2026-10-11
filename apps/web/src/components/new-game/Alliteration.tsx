import useSound from 'use-sound'

import { Checkbox } from '@/components/visual'
import { manager, useGameConfigAlliteration } from '@/hooks/database'

const Alliteration: React.FC = () => {
  const isAlliterationRewarded = useGameConfigAlliteration()

  const [playCheck] = useSound('/sounds/tap.mp3', { volume: 0.1 })

  const handleChange = () => {
    playCheck()
    manager.setGameConfigAlliteration(!isAlliterationRewarded)
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
