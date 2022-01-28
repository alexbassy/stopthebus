import { manager, useGameConfigLetters } from '@/hooks/database'
import { Checkbox, H3, Item, List, Spacing } from '@/components/visual'
import { ENGLISH_LETTERS } from '@/constants/letters'
import { Flex } from '@/components/Grid'
import useSound from 'use-sound'

const Letters: React.FC = () => {
  const gameLetters = useGameConfigLetters()
  const [playCheck] = useSound('/sounds/tap.mp3', { volume: 0.5 })

  const handleChange = (letter: string) => () => {
    playCheck()
    const newLetters = new Set(gameLetters)
    newLetters.has(letter) ? newLetters.delete(letter) : newLetters.add(letter)
    manager.setGameConfigLetters([...newLetters])
  }

  return (
    <section>
      <H3>Letters</H3>
      <List>
        {gameLetters &&
          ENGLISH_LETTERS.map((letter) => {
            return (
              <Item key={letter} inline>
                <Spacing r={0.75} b={0.75}>
                  <label>
                    <Flex yCentre style={{ width: '3.15rem' }}>
                      <Checkbox
                        type='checkbox'
                        value={letter}
                        checked={gameLetters.includes(letter)}
                        onChange={handleChange(letter)}
                      />
                      {letter.toUpperCase()}
                    </Flex>
                  </label>
                </Spacing>
              </Item>
            )
          })}
      </List>
    </section>
  )
}

export default Letters
