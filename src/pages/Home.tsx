import React, { useState, SyntheticEvent, useEffect } from 'react'
import { persistGameConfig } from '../helpers/persistGame'
import { categories } from '../constants/categories'
import { hri } from 'human-readable-ids'
import { useHistory } from 'react-router-dom'
import { Title } from '../components/visual'

export default function Home() {
  const history = useHistory()
  const [gameID, setGameID] = useState<string>('')
  const [error, setError] = useState<string | undefined>()
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  useEffect(() => {
    setGameID(hri.random())
  }, [])

  const handleSubmit = (ev: SyntheticEvent<HTMLFormElement>) => {
    ev.preventDefault()

    if (selectedCategories.length < 3) {
      setError('You must select at least three categories')
      return
    } else {
      setError(undefined)
    }

    persistGameConfig(gameID, selectedCategories)
    history.push(`/game/${gameID}`)
  }

  return (
    <div>
      <Title>Stop The Bus</Title>
      <h2>Create a game</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor='game-id'>
          <span>Game ID: </span>
          <input id='game-id' value={gameID} readOnly />
        </label>
        <button type='button' onClick={() => setGameID(hri.random())}>
          Change game ID
        </button>

        <h3>Game categories</h3>
        <span>{selectedCategories.length} selected</span>
        <ul>
          {categories.map((category, index) => {
            return (
              <li key={index}>
                <label>
                  <input
                    type='checkbox'
                    onChange={() => {
                      const newState = new Set(selectedCategories)
                      newState.has(category)
                        ? newState.delete(category)
                        : newState.add(category)
                      setSelectedCategories(Array.from(newState))
                    }}
                    checked={selectedCategories.includes(category)}
                  />
                  <span>{category}</span>
                </label>
              </li>
            )
          })}
        </ul>
        <div aria-live='polite'>{error ? error : null}</div>
        <button>Create game</button>
      </form>
    </div>
  )
}
