import React, { useContext } from 'react'
import { Helmet } from 'react-helmet'
import { Item, List, ExternalLink, Spacing } from './visual'
import GameName from './GameName'
import Player from './Player'
import EmitterContext from '../contexts/EmitterContext'
import GameContext from '../contexts/GameContext'
import { Player as PlayerType } from '../typings/game'

export default function ReviewRound() {
  const emit = useContext(EmitterContext)
  const game = useContext(GameContext)

  if (!game || !emit) return null

  const { config, state, players } = game

  if (!state.finalScores) return null

  const sortedScores = Object.entries(state.finalScores).sort((a, b) => {
    const scoreA = a[1]
    const scoreB = b[1]
    return scoreA < scoreB ? 1 : -1
  })

  return (
    <div>
      <Helmet>
        <title>Game Finished - Stop The Bus</title>
      </Helmet>
      <GameName />
      <List>
        {sortedScores.map(([playerID, score], index) => {
          const playerData = players.find(
            ({ uuid }) => uuid === playerID
          ) as PlayerType

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
      <ExternalLink href={`/game/${state.nextGameID}`}>
        Play another game
      </ExternalLink>
    </div>
  )
}
