import styled from '@emotion/styled'
import { Answers } from '@stopthebus/shared'
import React, {
  ChangeEvent,
  SyntheticEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { fromEvent, startWith } from 'rxjs'

import Dialog from '@/components/Dialog'
import EndRoundOverlay from '@/components/overlay/EndRoundOverlay'
import {
  manager,
  useGameConfigCategories,
  useGameRoundEndingPlayer,
  useGameRoundLetter,
} from '@/hooks/database'

import useScrollToTop from '../hooks/useScrollToTop'
import { Grid } from './Grid'
import Lanes from './Lanes'
import { Button, Input, Item, List, Spacing } from './visual'

const Wrap = styled.div`
  max-width: 400px;
`

interface QuestionPositions {
  [categoryIndex: string]: number // value is X offset
}

export default function ActiveRound() {
  const gameConfigCategories = useGameConfigCategories()
  const gameRoundLetter = useGameRoundLetter()
  const gameRoundEndingPlayer = useGameRoundEndingPlayer()
  const [values, setValues] = useState<Answers>({})
  const valuesRef = useRef<Answers>({})
  const [hasEnded, setHasEnded] = useState<boolean>(false)
  const formRef = useRef<HTMLFormElement>(null)
  const [questionPositions, setQuestionPositions] = useState<QuestionPositions>({})

  useEffect(() => {
    manager.getRoundAnswers().subscribe((answers) => {
      setValues(answers)
    })

    return () => setValues({})
  }, [])

  useEffect(() => {
    valuesRef.current = values
  }, [values])

  useScrollToTop()

  useLayoutEffect(() => {
    console.log(gameConfigCategories)
    const onResize = () => {
      if (!formRef.current || !gameConfigCategories.length) return
      console.log('onResize')
      const formYOffset = formRef.current.offsetTop
      const offsets: QuestionPositions = {}
      const elements = Array.from(formRef.current.elements) as HTMLElement[]
      const inputHeight = elements[0].offsetHeight

      for (const question of elements) {
        const name = question.getAttribute('name') || ''
        const index = gameConfigCategories.indexOf(name)
        if (question.tagName !== 'INPUT' || typeof index !== 'number') continue
        offsets[name] =
          // The offset starts from the form, which is the adjacent sibling of the <Lane/>
          question.offsetTop -
          // Minus the offset Y value of the question input
          formYOffset +
          // Plus half the height of the input, to center the player pin
          inputHeight / 2
      }
      console.log({ offsets })
      setQuestionPositions(offsets)
    }

    const resize$ = fromEvent(window, 'resize').pipe(startWith(0)).subscribe(onResize)

    return () => {
      resize$.unsubscribe()
    }
  }, [gameConfigCategories])

  useEffect(() => {
    if (!gameRoundEndingPlayer || hasEnded) {
      return
    }

    setHasEnded(true)
    // Everyone's answers go up in one message when the round is stopped, and
    // are resent until the server confirms them
    manager.submitRoundAnswers(values)
  }, [gameRoundEndingPlayer, hasEnded, values])

  useEffect(() => () => manager.cancelSubmit(), [])

  // Best-effort save for a player who switches away or reloads mid-round
  useEffect(() => {
    const save = () => {
      if (document.visibilityState === 'hidden') manager.saveRoundAnswers(valuesRef.current)
    }
    document.addEventListener('visibilitychange', save)
    return () => document.removeEventListener('visibilitychange', save)
  }, [])

  const handleChange = (category: string) => (event: ChangeEvent<HTMLInputElement>) => {
    setValues((currentValues) => ({
      ...currentValues,
      [category]: event.target.value,
    }))
  }

  const handleFocus = (event: SyntheticEvent<HTMLInputElement>) => {
    manager.setPlayerProgress(event.currentTarget.name)
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
        `You haven’t filled in all answers. Are you sure you want to end the round?`,
      )
    }
    if (shouldEndRound) manager.stop()
  }

  return (
    <div>
      <title>Letter {gameRoundLetter?.toUpperCase()} - Stop The Bus</title>
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
          <Lanes {...questionPositions} />
        </Grid>
      </Wrap>
      {/* <Dialog>
        <EndRoundOverlay text={`Ended by Phyllis`} duration={0} />
      </Dialog> */}
    </div>
  )
}
