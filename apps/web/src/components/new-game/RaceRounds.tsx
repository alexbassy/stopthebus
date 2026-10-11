import { Select } from '@/components/visual'
import { range } from '@/helpers/util'
import { manager, useGameConfigRounds } from '@/hooks/database'
import { ChangeEvent } from 'react'

const RaceRounds: React.FC = () => {
  const rounds = useGameConfigRounds()

  const handleRoundCountChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = Number(event.target.value)
    if (value === rounds || rounds === 0) {
      return
    }
    manager.setGameConfigRounds(value)
  }

  return (
    <section>
      <label htmlFor='game-number-rounds'>Number of rounds </label>
      <Select
        id='game-number-rounds'
        value={rounds}
        onBlur={handleRoundCountChange}
        onChange={handleRoundCountChange}
      >
        {range(1, 10).map((val) => (
          <option key={val} value={val}>
            {val}
          </option>
        ))}
      </Select>
    </section>
  )
}

export default RaceRounds
