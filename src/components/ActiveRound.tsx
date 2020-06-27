import React, { useContext, useState, ChangeEvent, SyntheticEvent } from 'react'
import GameContext from '../contexts/GameContext'
import EmitterContext from '../contexts/EmitterContext'
import { RoundResults } from '../typings/game'
import { ClientEvent } from '../typings/socket-events'
import { getUserSessionID } from '../helpers/getUserSession'
import { Input, Button, List, Item, Spacing } from './visual'

export default function ActiveRound() {
  const uuid = getUserSessionID()
  const emit = useContext(EmitterContext)
  const game = useContext(GameContext)
  const [values, setValues] = useState<RoundResults>({})

  React.useEffect(() => {
    if (game?.state.currentRound?.answers?.[uuid]) {
      setValues(game?.state.currentRound?.answers?.[uuid])
    }
  }, [game, uuid])

  if (!game || !emit) return null

  const { config } = game

  const handleChange = (category: string) => (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const inputValue = event.target.value
    setValues((currentValues) => ({
      ...currentValues,
      [category]: inputValue,
    }))
  }

  const handleBlur = (event: SyntheticEvent<HTMLInputElement>) => {
    emit(ClientEvent.FILLED_ANSWER, values)
  }

  const handleEndRoundClick = (event: SyntheticEvent<HTMLButtonElement>) => {
    emit(ClientEvent.END_ROUND)
  }

  return (
    <div>
      <h1>Game {config.id}</h1>
      <p>
        The letter is{' '}
        <strong>{game.state.currentRound?.letter?.toUpperCase()}</strong>
      </p>
      <List>
        {config.categories.map((category) => {
          const stripped = category.replace(/\W/g, '')
          const id = `input-${stripped}`
          return (
            <Item key={category}>
              <Spacing b={1}>
                <label htmlFor={id}>{category}</label>
                <div>
                  <Input
                    type='text'
                    id={id}
                    onBlur={handleBlur}
                    onChange={handleChange(category)}
                    value={values[category] ?? ''}
                  />
                </div>
              </Spacing>
            </Item>
          )
        })}
      </List>
      <Button onClick={handleEndRoundClick}>Finished</Button>
    </div>
  )
}
