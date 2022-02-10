import React, {
  ChangeEvent,
  SyntheticEvent,
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
} from 'react'
import Head from 'next/head'
import { RoundResults } from '@/typings/game'
import { Button, Input, Item, List, Spacing } from './visual'
import { Grid } from './Grid'
import Lanes from './Lanes'
import styled from '@emotion/styled'
import useScrollToTop from '../hooks/useScrollToTop'
import {
  manager,
  useGameConfigCategories,
  useGameRoundLetter,
  useGameRoundEndingPlayer,
} from '@/hooks/database'
import { endRoundWithGameID } from '@/client/rest'
import usePlayer from '@/hooks/usePlayer'
import Dialog from '@/components/Dialog'
import EndRoundOverlay from '@/components/overlay/EndRoundOverlay'
import { fromEvent, startWith } from 'rxjs'

const Wrap = styled.div`
  max-width: 400px;
`

interface QuestionPositions {
  [categoryIndex: string]: number // value is X offset
}

export default function ActiveRound() {
  const [player] = usePlayer()
  const gameConfigCategories = useGameConfigCategories()
  const gameRoundLetter = useGameRoundLetter()
  const gameRoundEndingPlayer = useGameRoundEndingPlayer()
  const [values, setValues] = useState<RoundResults>({})
  const [lastFocusedCategory, setLastFocusedCategory] = useState<string>('')
  const [hasEnded, setHasEnded] = useState<boolean>(false)
  const formRef = useRef<HTMLFormElement>(null)
  const [questionPositions, setQuestionPositions] = useState<QuestionPositions>({})

  useEffect(() => {
    manager.getRoundAnswers().subscribe((answers) => {
      setValues(answers)
    })

    return () => setValues({})
  }, [])

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
    manager.setRoundAnswer(lastFocusedCategory, values[lastFocusedCategory])
  }, [gameRoundEndingPlayer, hasEnded, values, lastFocusedCategory])

  const handleChange = (category: string) => (event: ChangeEvent<HTMLInputElement>) => {
    setValues((currentValues) => ({
      ...currentValues,
      [category]: event.target.value,
    }))
  }

  const handleFocus = (event: SyntheticEvent<HTMLInputElement>) => {
    setLastFocusedCategory(event.currentTarget.name)
    manager.setPlayerProgress(event.currentTarget.name)
  }

  const pushAnswer = (category: string, answer: string) => {
    manager.setRoundAnswer(category, answer)
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
    if (!player) {
      return
    }
    if (shouldEndRound) endRoundWithGameID(manager.gameId, player)
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
                        onBlur={(event) => pushAnswer(category, event.target.value)}
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
