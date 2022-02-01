import { manager, useGameConfigLetters } from '@/hooks/database'
import { List } from '@/components/visual'
import { ENGLISH_LETTERS } from '@/constants/letters'
import useSound from 'use-sound'
import { Checkbox, Grid, Text } from '@nextui-org/react'

const Letters: React.FC = () => {
  const gameLetters = useGameConfigLetters()
  const [playCheck] = useSound('/sounds/tap.mp3', { volume: 0.1 })

  const handleChange = (letter: string) => () => {
    playCheck()
    const newLetters = new Set(gameLetters)
    newLetters.has(letter) ? newLetters.delete(letter) : newLetters.add(letter)
    manager.setGameConfigLetters([...newLetters])
  }

  return (
    <section>
      <Text h3>Letters</Text>
      <List>
        <Grid.Container gap={1}>
          {gameLetters &&
            ENGLISH_LETTERS.map((letter) => {
              return (
                <Grid key={letter} xs={2}>
                  <Checkbox
                    size='md'
                    key={letter}
                    value={letter}
                    checked={gameLetters.includes(letter)}
                    initialChecked={gameLetters.includes(letter)}
                    onChange={handleChange(letter)}
                  >
                    {letter.toUpperCase()}
                  </Checkbox>
                </Grid>
              )
            })}
        </Grid.Container>
      </List>
    </section>
  )
}

export default Letters
