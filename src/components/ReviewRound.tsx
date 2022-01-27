import React from 'react'
import Head from 'next/head'
import { Button } from './visual'
import Dialog from './Dialog'
import Countdown from './Countdown'
import ResultsTable from '@/components/round-review/ResultsTable'
import {
  useGameConfigCategories,
  useGameConfigRounds,
  useGameRoundAnswersByCategory,
  useGameRoundIndex,
  useGameRoundLetter,
  useGameRoundScoresByPlayer,
  useGameRoundTimeStarted,
} from '@/hooks/supabase'
import ReviewHeader from '@/components/round-review/ReviewHeader'
import { cancelStartGameWithID, startGameWithID } from '@/client/rest'
import useGameIdFromRoute from '@/hooks/useGameIdFromRoute'

export default function ReviewRound() {
  const gameId = useGameIdFromRoute()
  const gameAnswers = useGameRoundAnswersByCategory()
  const gameScores = useGameRoundScoresByPlayer()
  const gameRoundTimeStarted = useGameRoundTimeStarted()
  const gameRoundLetter = useGameRoundLetter()
  const categories = useGameConfigCategories()
  const numRounds = useGameConfigRounds()
  const roundIndex = useGameRoundIndex()

  if (!gameAnswers || !gameScores) {
    return null
  }

  const handleNextRoundClick = () => {
    startGameWithID(gameId)
  }

  const handleCancelStartGame = () => {
    cancelStartGameWithID(gameId)
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
          answers={gameAnswers[category]}
          scores={gameScores[category]}
        />
      ))}

      <Button onClick={handleNextRoundClick}>{isLastRound ? 'Finish game' : 'Next round'}</Button>

      <Dialog>
        {(gameRoundTimeStarted || 0) > Date.now() && (
          <Countdown
            from={3}
            onCancel={handleCancelStartGame}
            showAfter={gameRoundLetter?.toUpperCase()}
            // In reality it should be displayed for 1.5s, but instruct the
            // component to display it for longer to account for transport latency
            afterMessageDuration={3000}
          />
        )}
      </Dialog>
    </div>
  )
}
