import React, { useState, SyntheticEvent, useEffect } from 'react'
import { persistGameConfig } from '../helpers/persistGame'
import { categories } from '../constants/categories'
import { hri } from 'human-readable-ids'
import { useHistory } from 'react-router-dom'
import { Title } from '../components/visual'

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
      <h2>Join a game</h2>
      <form onSubmit={handleJoinGame}>
        <label>
          Game ID:{' '}
          <input
            id='game-id'
            value={gameID}
            onChange={(ev) => setGameID(ev.target.value)}
          />
        </label>
        <button>Join</button>
      </form>
      <h2>Create a game</h2>
      <form onSubmit={handleCreateGame}>
        <label htmlFor='new-game-id'>
          <span>New game ID: </span>
          <input id='new-game-id' value={newGameID} readOnly />
        </label>
        <button type='button' onClick={() => setNewGameID(hri.random())}>
          Change game ID
        </button>
        <button>Create game</button>
      </form>
    </div>
  )
}
