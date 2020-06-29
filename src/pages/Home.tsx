import React, { useState, SyntheticEvent, useEffect } from 'react'
import { persistGameConfig } from '../helpers/persistGame'
import { useHistory } from 'react-router-dom'
import { Input, Button, H2, Spacing } from '../components/visual'
import PageTitle from '../components/PageTitle'
import * as random from '../helpers/random'

export default function Home() {
  const history = useHistory()
  const [gameID, setGameID] = useState<string>('')
  const [newGameID, setNewGameID] = useState<string>('')

  useEffect(() => {
    setNewGameID(random.getGameName())
  }, [])

  const handleJoinGame = (ev: SyntheticEvent<HTMLFormElement>) => {
    ev.preventDefault()
    const sanitised = gameID.trim().toLowerCase()
    if (sanitised.length) {
      history.push(`/game/${gameID}`)
    }
  }

  const handleCreateGame = (ev: SyntheticEvent<HTMLFormElement>) => {
    ev.preventDefault()
    persistGameConfig(newGameID)
    history.push(`/game/${newGameID}`)
  }

  return (
    <div>
      <PageTitle />
      <H2>Join a game</H2>
      <form onSubmit={handleJoinGame}>
        <Input
          type='text'
          id='game-id'
          aria-label='Enter a game ID, words separated with hyphens'
          value={gameID}
          onChange={(ev) => setGameID(ev.target.value.toLowerCase())}
          placeholder='Type in game name'
        />
        <Spacing r={0.5} inline />
        <Button>Join</Button>
      </form>
      <H2>Create a game</H2>
      <form onSubmit={handleCreateGame}>
        <Input
          type='text'
          id='new-game-id'
          value={newGameID}
          aria-label='New game name'
          readOnly
        />
        <Spacing r={0.5} inline />
        <Button
          type='button'
          onClick={() => setNewGameID(random.getGameName())}
        >
          Shuffle
        </Button>
        <br />
        <br />
        <Button>Create game</Button>
      </form>
    </div>
  )
}
