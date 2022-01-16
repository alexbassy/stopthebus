import React, {
  ChangeEvent,
  SyntheticEvent,
  useContext,
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
} from 'react'
import Head from 'next/head'
import { RoundResults, GameStage } from '@/typings/game'
import { ClientEvent } from '@/typings/socket-events'
import { Button, Input, Item, List, Spacing } from './visual'
import { Grid } from './Grid'
import Lanes from './Lanes'
import styled from '@emotion/styled'
import GameContext from '../contexts/GameContext'
import useScrollToTop from '../hooks/useScrollToTop'
import { useGameConfigCategories, useGameRoundLetter, useGameStateStage } from '@/hooks/supabase'

const Wrap = styled('div')`
  max-width: 400px;
`

interface QuestionPositions {
  [categoryIndex: string]: number // value is X offset
}

export default function ActiveRound() {
  const emit = (...args: any[]) => console.log(...args)
  const gameStateStage = useGameStateStage()
  const gameConfigCategories = useGameConfigCategories()
  const gameRoundLetter = useGameRoundLetter()
  const [values, setValues] = useState<RoundResults>({})
  const [hasEnded, setHasEnded] = useState<boolean>(false)
  const formRef = useRef<HTMLFormElement>(null)
  const [questionPositions, setQuestionPositions] = useState<QuestionPositions>({})

  useScrollToTop()

  useLayoutEffect(() => {
    const onResize = () => {
      if (!formRef.current || !gameConfigCategories) return
      const formYOffset = formRef.current.offsetTop
      const offsets: QuestionPositions = {}
      const elements = Array.from(formRef.current.elements) as HTMLElement[]
      const inputHeight = elements[0].offsetHeight

      for (const question of elements) {
        const name = question.getAttribute('name') || ''
        const index = gameConfigCategories.indexOf(name)
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
  }, [gameConfigCategories])

  useEffect(() => {
    if (gameStateStage === GameStage.REVIEW && !!emit && !hasEnded) {
      setHasEnded(true)
      emit(ClientEvent.FILLED_ANSWER, values)
    }
  }, [gameStateStage, emit, values, hasEnded])

  // useEffect(() => {
  //   if (gameStateStage === GameStage.ACTIVE) {
  //     emit(ClientEvent.RETRIEVE_ANSWERS)
  //   }
  // }, [emit, gameStateStage])

  // const answers = game?.answers
  // useEffect(() => {
  //   if (answers) {
  //     setValues(answers)
  //   }
  // }, [answers])

  const handleChange = (category: string) => (event: ChangeEvent<HTMLInputElement>) => {
    setValues((currentValues) => ({
      ...currentValues,
      [category]: event.target.value,
    }))
  }

  const handleFocus = (event: SyntheticEvent<HTMLInputElement>) => {
    emit(ClientEvent.FOCUSSED_ANSWER, gameConfigCategories.indexOf(event.currentTarget.name))
  }

  const handleBlur = () => {
    emit(ClientEvent.FILLED_ANSWER, values)
  }

  const handleEndRoundClick = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    const hasAnswerForAllCategories = gameConfigCategories.every((category) => {
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
      <Head>
        <title>Letter {gameRoundLetter?.toUpperCase()} - Stop The Bus</title>
      </Head>
      <p>
        The letter is <strong style={{ fontSize: '2rem' }}>{gameRoundLetter?.toUpperCase()}</strong>
      </p>
      <Wrap>
        <Grid columns={[3, 1]}>
          <form onSubmit={handleEndRoundClick} ref={formRef}>
            <List>
              {gameConfigCategories.map((category) => {
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
            <Button disabled={hasEnded}>{hasEnded ? 'Out of time!' : 'Finished'}</Button>
          </form>
          <Lanes questionPositions={questionPositions} />
        </Grid>
      </Wrap>
    </div>
  )
}
