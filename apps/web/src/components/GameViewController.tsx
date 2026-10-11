import { GameStage } from '@stopthebus/shared'

import ActiveRound from '@/components/ActiveRound'
import GameEnd from '@/components/GameEnd'
import GameName from '@/components/GameName'
import NewGame from '@/components/NewGame'
import PageTitle from '@/components/PageTitle'
import ReviewRound from '@/components/ReviewRound'
import { useGameStateStage, useIsConnected } from '@/hooks/database'

import EntryController from './new-game/EntryController'

const GameViewController: React.FC = () => {
  const gameStateStage = useGameStateStage()
  const isConnected = useIsConnected()

  let Component

  switch (gameStateStage) {
    case GameStage.active:
      Component = ActiveRound
      break
    case GameStage.review:
      Component = ReviewRound
      break
    case GameStage.finished:
      Component = GameEnd
      break
    case GameStage.pre:
      Component = NewGame
  }

  return (
    <>
      <PageTitle isInGame={gameStateStage !== GameStage.pre} />
      <GameName isShareable={gameStateStage === GameStage.pre} />
      {!isConnected && <p role='status'>Connection lost. Reconnecting…</p>}
      <EntryController>{Component ? <Component /> : null}</EntryController>
    </>
  )
}

export default GameViewController
