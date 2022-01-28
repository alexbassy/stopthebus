import { manager, useGameConfigAlliteration } from '@/hooks/database'
import { Checkbox } from '@/components/visual'
import useSound from 'use-sound'

const Alliteration: React.FC = () => {
  const isAlliterationRewarded = useGameConfigAlliteration()

  const [playCheck] = useSound('/sounds/tap.mp3', { volume: 0.5 })

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
