import React, {
  ChangeEvent,
  SyntheticEvent,
  useContext,
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
} from 'react'
import { Helmet } from 'react-helmet'
import { Button, Input, Item, List, Spacing } from './visual'
import { Grid } from './Grid'
import Lanes from './Lanes'
import styled from './styled'
import EmitterContext from '../contexts/EmitterContext'
import GameContext from '../contexts/GameContext'
import useScrollToTop from '../hooks/useScrollToTop'
import { RoundResults, GameStage } from '../typings/game'
import { ClientEvent } from '../typings/socket-events'

const Wrap = styled('div')`
  max-width: 400px;
`

interface QuestionPositions {
  [categoryIndex: string]: number // value is X offset
}

export default function ActiveRound() {
  const emit = useContext(EmitterContext)
  const game = useContext(GameContext)
  const [values, setValues] = useState<RoundResults>({})
  const [hasEnded, setHasEnded] = useState<boolean>(false)
  const formRef = useRef<HTMLFormElement>(null)
  const [questionPositions, setQuestionPositions] = useState<QuestionPositions>(
    {}
  )

  useScrollToTop()

  const gameCategories = game?.config.categories

  useLayoutEffect(() => {
    const onResize = () => {
      if (!formRef.current || !gameCategories) return
      const formYOffset = formRef.current.offsetTop
      const offsets: QuestionPositions = {}
      const elements = Array.from(formRef.current.elements) as HTMLElement[]
      const inputHeight = elements[0].offsetHeight

      for (const question of elements) {
        const name = question.getAttribute('name') || ''
        const index = gameCategories.indexOf(name)
        if (question.tagName !== 'INPUT' || typeof index !== 'number') continue
        offsets[index] =
          // The offset starts from the form, which is the adjacent sibling of the <Lane/>
          question.offsetTop -
          // Minus the offset Y value of the question input
          formYOffset +
          // Plus half the height of the input, to center the player pin
          inputHeight / 2
      }
      setQuestionPositions(offsets)
      console.log({ offsets })
    }

    window.addEventListener('resize', onResize)
    onResize()

    return () => {
      window.removeEventListener('resize', onResize)
    }
  }, [gameCategories])

  const gameState = game?.state?.stage ?? null

  useEffect(() => {
    if (gameState && gameState === GameStage.ENDING && !!emit && !hasEnded) {
      setHasEnded(true)
      emit(ClientEvent.FILLED_ANSWER, values)
    }
  }, [gameState, emit, values, hasEnded])

  useEffect(() => {
    if (emit && gameState === GameStage.ACTIVE) {
      console.log('Retrieving answers')
      emit(ClientEvent.RETRIEVE_ANSWERS)
    }
  }, [emit, gameState])

  const answers = game?.answers
  useEffect(() => {
    if (answers) {
      setValues(answers)
    }
  }, [answers])

  if (!game || !emit) return null

  const { config } = game

  const categories = config.categories

  const handleChange = (category: string) => (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const inputValue = event.target.value
    setValues((currentValues) => ({
      ...currentValues,
      [category]: inputValue,
    }))
  }

  const handleFocus = (event: SyntheticEvent<HTMLInputElement>) => {
    emit(
      ClientEvent.FOCUSSED_ANSWER,
      categories.indexOf(event.currentTarget.name)
    )
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
      <p>
        The letter is{' '}
        <strong style={{ fontSize: '2rem' }}>
          {game.state.currentRound?.letter?.toUpperCase()}
        </strong>
      </p>
      <Wrap>
        <Grid columns={[3, 1]}>
          <form onSubmit={handleEndRoundClick} ref={formRef}>
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
                        name={category}
                        onBlur={handleBlur}
                        onFocus={handleFocus}
                        onChange={handleChange(category)}
                        value={values[category] ?? ''}
                        autoCorrect='off'
                        disabled={hasEnded}
                        grow
                      />
                    </Spacing>
                  </Item>
                )
              })}
            </List>
            <Button disabled={hasEnded}>
              {hasEnded ? 'Out of time!' : 'Finished'}
            </Button>
          </form>
          <Lanes questionPositions={questionPositions} />
        </Grid>
      </Wrap>
    </div>
  )
}
