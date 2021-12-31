import { useGameStateStage } from '@/hooks/supabase'
import { GameStage } from '@/typings/game'
import NewGame from '@/components/NewGame'
import ActiveRound from '@/components/ActiveRound'
import ReviewRound from '@/components/ReviewRound'
import GameEnd from '@/components/GameEnd'
import PageTitle from '@/components/PageTitle'
import GameName from '@/components/GameName'

const GameViewController: React.FC = () => {
  const gameStateStage = useGameStateStage()

  let Component

  switch (gameStateStage) {
    // case GameStage.ACTIVE:
    //   Component = ActiveRound
    //   break
    // case GameStage.REVIEW:
    //   Component = ReviewRound
    //   break
    // case GameStage.FINISHED:
    //   Component = GameEnd
    //   break
    case GameStage.PRE:
    default:
      Component = NewGame
  }

  return (
    <>
      <PageTitle isInGame={gameStateStage !== GameStage.PRE} />
      <GameName isShareable={gameStateStage === GameStage.PRE} />
      <Component />
    </>
  )
}

export default GameViewController
