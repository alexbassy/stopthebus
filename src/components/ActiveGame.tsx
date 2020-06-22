import React, { useContext, useState, ChangeEvent, SyntheticEvent } from 'react'
import GameContext from '../contexts/GameContext'
import EmitterContext from '../contexts/EmitterContext'
import { RoundResults } from '../typings/game'
import { ClientEvent } from '../typings/socket-events'

export default function ActiveGame() {
  const emit = useContext(EmitterContext)
  const game = useContext(GameContext)
  const [values, setValues] = useState<RoundResults>({})

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
      <ul>
        {config.categories.map((category) => {
          const stripped = category.replace(/\W/g, '')
          const id = `input-${stripped}`
          return (
            <li key={category}>
              <label htmlFor={id}>{category}</label>
              <div>
                <input
                  type='text'
                  id={id}
                  onBlur={handleBlur}
                  onChange={handleChange(category)}
                  value={values[category] ?? ''}
                />
              </div>
            </li>
          )
        })}
      </ul>
      <button onClick={handleEndRoundClick}>Finished</button>
    </div>
  )
}
