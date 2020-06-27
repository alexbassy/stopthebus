import React, { useState, SyntheticEvent, useEffect } from 'react'
import { persistGameConfig } from '../helpers/persistGame'
import { hri } from 'human-readable-ids'
import { useHistory } from 'react-router-dom'
import { Title, Input, Button, H2 } from '../components/visual'

export default function Home() {
  const history = useHistory()
  const [gameID, setGameID] = useState<string>('')
  const [newGameID, setNewGameID] = useState<string>('')

  useEffect(() => {
    setNewGameID(hri.random())
  }, [])

  const handleJoinGame = (ev: SyntheticEvent<HTMLFormElement>) => {
    ev.preventDefault()
    history.push(`/game/${gameID}`)
  }

  const handleCreateGame = (ev: SyntheticEvent<HTMLFormElement>) => {
    ev.preventDefault()
    persistGameConfig(newGameID)
    history.push(`/game/${newGameID}`)
  }

  return (
    <div>
      <Title>Stop The Bus</Title>
      <H2>Join a game</H2>
      <form onSubmit={handleJoinGame}>
        <label>
          Game ID:{' '}
          <Input
            type='text'
            id='game-id'
            value={gameID}
            onChange={(ev) => setGameID(ev.target.value)}
          />
        </label>
        <Button>Join</Button>
      </form>
      <H2>Create a game</H2>
      <form onSubmit={handleCreateGame}>
        <label htmlFor='new-game-id'>
          <Input type='text' id='new-game-id' value={newGameID} readOnly />
        </label>
        <Button type='button' onClick={() => setNewGameID(hri.random())}>
          Change game ID
        </Button>
        <br />
        <br />
        <Button>Create game</Button>
      </form>
    </div>
  )
}
