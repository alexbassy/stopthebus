import { useGameStateStage, useIsConnected } from '@/hooks/database'
import { GameStage } from '@stopthebus/shared'
import NewGame from '@/components/NewGame'
import ActiveRound from '@/components/ActiveRound'
import ReviewRound from '@/components/ReviewRound'
import GameEnd from '@/components/GameEnd'
import PageTitle from '@/components/PageTitle'
import GameName from '@/components/GameName'
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
      {/* <p>Connected: {isConnected ? 'Yes' : 'no'}</p> */}
      <EntryController>{Component ? <Component /> : null}</EntryController>
    </>
  )
}

export default GameViewController
