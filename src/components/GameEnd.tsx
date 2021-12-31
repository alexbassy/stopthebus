import React, { useContext } from 'react'
import Head from 'next/head'
import { Player as PlayerType } from '@/typings/game'
import { Item, List, ExternalLink, Spacing } from './visual'
import Player from './Player'
import GameContext from '../contexts/GameContext'
import { APP_ROUTES } from '@/client/api-routes'

export default function ReviewRound() {
  const emit = (...args: any[]) => console.log(...args)
  const game = useContext(GameContext)

  if (!game || !emit) return null

  const { state, players } = game

  if (!state.finalScores) return null

  const sortedScores = Object.entries(state.finalScores).sort((a, b) => {
    const scoreA = a[1]
    const scoreB = b[1]
    return scoreA < scoreB ? 1 : -1
  })

  return (
    <div>
      <Head>
        <title>Game Finished - Stop The Bus</title>
      </Head>
      <List>
        {sortedScores.map(([playerID, score], index) => {
          const playerData = players.find(({ id }) => id === playerID) as PlayerType

          if (index === 0) {
            return (
              <Item key={playerID}>
                <Spacing b={0.5}>
                  <Player {...playerData} inline /> won with a score of {score}
                </Spacing>
              </Item>
            )
          }

          return (
            <Item key={playerID}>
              <Spacing b={0.5}>
                <Player {...playerData} inline /> scored {score}
              </Spacing>
            </Item>
          )
        })}
      </List>
      <ExternalLink href={APP_ROUTES.game(state.nextGameID as string)}>
        Play another game
      </ExternalLink>
    </div>
  )
}
