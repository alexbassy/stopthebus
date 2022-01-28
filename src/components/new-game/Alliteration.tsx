import { manager, useGameConfigAlliteration } from '@/hooks/database'
import { Checkbox } from '@/components/visual'

const Alliteration: React.FC = () => {
  const isAlliterationRewarded = useGameConfigAlliteration()

  const handleChange = () => {
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
