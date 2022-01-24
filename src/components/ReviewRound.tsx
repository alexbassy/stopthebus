import React, { SyntheticEvent } from 'react'
import Head from 'next/head'
import { GameStage } from '@/typings/game'
import { Button } from './visual'
import Dialog from './Dialog'
import Countdown from './Countdown'
import ResultsTable from '@/components/round-review/ResultsTable'
import {
  useGameConfigCategories,
  useGameConfigRounds,
  useGameRoundAllAnswers,
  useGameRoundAllScores,
  useGameRoundIndex,
  useGameRoundNextLetter,
  useGameStateStage,
} from '@/hooks/supabase'
import ReviewHeader from '@/components/round-review/ReviewHeader'

export default function ReviewRound() {
  const gameAnswers = useGameRoundAllAnswers()
  const gameScores = useGameRoundAllScores()
  const nextLetter = useGameRoundNextLetter()
  const stage = useGameStateStage()
  const categories = useGameConfigCategories()
  const numRounds = useGameConfigRounds()
  const roundIndex = useGameRoundIndex()

  if (!gameAnswers || !gameScores) {
    return null
  }

  const handleNextRoundClick = (event: SyntheticEvent<HTMLButtonElement>) => {
    console.log('START_ROUND')
  }

  const handleCancelStartGame = () => {
    console.log('CANCEL_START_ROUND')
  }

  const isLastRound = (roundIndex || 0) + 1 === numRounds

  return (
    <div>
      <Head>
        <title>Review - Stop The Bus</title>
      </Head>

      <ReviewHeader />

      {categories.map((category) => (
        <ResultsTable
          key={category}
          categoryName={category}
          answers={gameAnswers}
          scores={gameScores}
        />
      ))}

      <Button onClick={handleNextRoundClick}>{isLastRound ? 'Finish game' : 'Next round'}</Button>

      <Dialog>
        {!isLastRound && stage === GameStage.ACTIVE && (
          <Countdown
            from={3}
            onCancel={handleCancelStartGame}
            showAfter={nextLetter?.toUpperCase()}
            // In reality it should be displayed for 1.5s, but instruct the
            // component to display it for longer to account for transport latency
            afterMessageDuration={3000}
          />
        )}
      </Dialog>
    </div>
  )
}
