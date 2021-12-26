import { updateLetters } from '@/client/functions'
import { useGameConfigLetters } from '@/hooks/supabase'
import useGameIdFromRoute from '@/hooks/useGameIdFromRoute'
import { Checkbox, H3, Item, List, Spacing } from '@/components/visual'
import { ENGLISH_LETTERS } from '@/constants/letters'
import { Flex } from '@/components/Grid'

const Letters: React.FC = (props) => {
  const gameId = useGameIdFromRoute()
  const gameLetters = useGameConfigLetters()

  console.log({ gameId, gameLetters })

  const handleChange = (letter: string) => () => {
    const newLetters = new Set(gameLetters)

    if (newLetters.has(letter)) {
      newLetters.delete(letter)
    } else {
      newLetters.add(letter)
    }

    updateLetters(gameId, [...newLetters])
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
