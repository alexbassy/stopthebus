import React, { useContext, useState, ChangeEvent, SyntheticEvent } from 'react'
import GameContext from '../contexts/GameContext'
import useScrollToTop from '../hooks/useScrollToTop'
import EmitterContext from '../contexts/EmitterContext'
import { RoundResults } from '../typings/game'
import { ClientEvent } from '../typings/socket-events'
import { getUserSessionID } from '../helpers/getUserSession'
import { GameName, Input, Button, List, Item, Spacing } from './visual'
import { Helmet } from 'react-helmet'

export default function ActiveRound() {
  const uuid = getUserSessionID()
  const emit = useContext(EmitterContext)
  const game = useContext(GameContext)
  const [values, setValues] = useState<RoundResults>({})

  useScrollToTop()

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

  const handleEndRoundClick = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    const hasAnswerForAllCategories = config.categories.every((category) => {
      const playerAnswer = values[category]
      return playerAnswer && playerAnswer.length > 1
    })
    let shouldEndRound = true
    if (!hasAnswerForAllCategories) {
      shouldEndRound = window.confirm(
        `You haven’t filled in all answers. Are you sure you want to end the round?`
      )
    }
    if (shouldEndRound) emit(ClientEvent.END_ROUND)
  }

  return (
    <div>
      <Helmet>
        <title>
          Letter {game.state.currentRound?.letter?.toUpperCase()} - Stop The Bus
        </title>
      </Helmet>
      <GameName>Game {config.id}</GameName>
      <p>
        The letter is{' '}
        <strong style={{ fontSize: '2rem' }}>
          {game.state.currentRound?.letter?.toUpperCase()}
        </strong>
      </p>
      <form onSubmit={handleEndRoundClick}>
        <List>
          {config.categories.map((category) => {
            const stripped = category.replace(/\W/g, '')
            const id = `input-${stripped}`
            return (
              <Item key={category}>
                <Spacing b={1}>
                  <label htmlFor={id}>{category}</label>
                  <Spacing b={0.5} />
                  <Input
                    type='text'
                    id={id}
                    onBlur={handleBlur}
                    onChange={handleChange(category)}
                    value={values[category] ?? ''}
                    autoCorrect='off'
                  />
                </Spacing>
              </Item>
            )
          })}
        </List>
        <Button>Finished</Button>
      </form>
    </div>
  )
}
