import React, {
  useContext,
  ChangeEvent,
  Dispatch,
  SetStateAction,
  SyntheticEvent,
} from 'react'
import GameContext from '../contexts/GameContext'
import EmitterContext from '../contexts/EmitterContext'
import { range } from '../helpers/util'
import { ENGLISH_LETTERS } from '../constants/letters'
import { GameConfig, GameMode } from '../typings/game'
import { ClientEvent } from '../typings/socket-events'
import { getUserSessionID } from '../helpers/getUserSession'
import CategoriesList from '../components/CategoriesList'

const sessionID = getUserSessionID()

interface NewGameProps {
  onChange: Dispatch<SetStateAction<GameConfig | null>>
}

export default function NewGame(props: NewGameProps) {
  const emit = useContext(EmitterContext)
  const game = useContext(GameContext)

  if (!game || !emit) return null

  const handleCategoryChange = (categories: string[]) => {
    props.onChange((gameConfig) => {
      const newGameConfig = {
        ...gameConfig,
        categories,
      }
      emit(ClientEvent.GAME_CONFIG, newGameConfig)
      return newGameConfig as GameConfig
    })
  }

  const handleLetterChange = (letter: string) => () => {
    props.onChange((gameConfig) => {
      const newLetters = new Set(gameConfig?.letters)
      newLetters.has(letter)
        ? newLetters.delete(letter)
        : newLetters.add(letter)

      const newGameConfig = {
        ...gameConfig,
        letters: [...newLetters],
      }

      emit(ClientEvent.GAME_CONFIG, newGameConfig)

      return newGameConfig as GameConfig
    })
  }

  const handleModeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    props.onChange((gameConfig) => {
      const newGameConfig = {
        ...gameConfig,
        mode: value as GameMode,
      }
      emit(ClientEvent.GAME_CONFIG, newGameConfig)
      return newGameConfig as GameConfig
    })
  }

  const handleTimeChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value)
    props.onChange((gameConfig) => {
      if (!gameConfig) return gameConfig
      const newGameConfig = {
        ...gameConfig,
        time: value * 1000,
      }
      emit(ClientEvent.GAME_CONFIG, newGameConfig)
      return newGameConfig
    })
  }

  const handleRoundCountChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value
    props.onChange((gameConfig) => {
      if (!gameConfig) return gameConfig
      const newGameConfig: GameConfig = {
        ...gameConfig,
        rounds: Number(value),
      }
      emit(ClientEvent.GAME_CONFIG, newGameConfig)
      return newGameConfig
    })
  }

  const handleAlliterationChange = (event: ChangeEvent<HTMLInputElement>) => {
    const isChecked = event.target.checked
    props.onChange((gameConfig) => {
      if (!gameConfig) return gameConfig
      const newGameConfig: GameConfig = {
        ...gameConfig,
        scoreWithAlliteration: isChecked,
      }
      emit(ClientEvent.GAME_CONFIG, newGameConfig)
      return newGameConfig
    })
  }

  const handleStartGameClick = (event: SyntheticEvent<HTMLButtonElement>) => {
    emit(ClientEvent.START_ROUND)
  }

  const { config, players } = game

  return (
    <div>
      <h1>Game {config.id}</h1>
      <p>Welcome, {sessionID}!</p>
      <h2>Game settings</h2>
      <section>
        <h3>Categories</h3>
        <CategoriesList
          selectedCategories={config?.categories || []}
          onChange={handleCategoryChange}
        />
      </section>
      <section>
        <h3>Mode</h3>
        <p>You can race against each other, or with a time limit</p>
        <div>
          <label>
            Play mode{' '}
            <select value={config?.mode} onChange={handleModeChange}>
              <option value={GameMode.RACE}>Race</option>
              <option value={GameMode.TIMER}>Timer</option>
            </select>
          </label>
        </div>
        <div>
          {config?.mode === GameMode.TIMER && (
            <label>
              Time (seconds){' '}
              <input
                type='number'
                value={Math.round(config.time ? config.time / 1000 : 60)}
                onChange={handleTimeChange}
              />
            </label>
          )}
        </div>
        <div>
          Number of rounds{' '}
          <select value={config?.rounds} onChange={handleRoundCountChange}>
            {range(1, 10).map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>
            <input
              type='checkbox'
              checked={config?.scoreWithAlliteration}
              onChange={handleAlliterationChange}
            />{' '}
            Points for alliteration
          </label>
        </div>
      </section>
      <section>
        <h3>Letters</h3>
        <ul>
          {config &&
            ENGLISH_LETTERS.map((letter) => {
              return (
                <li key={letter}>
                  <label>
                    <input
                      type='checkbox'
                      value={letter}
                      checked={config?.letters?.includes(letter)}
                      onChange={handleLetterChange(letter)}
                    />
                    {letter}
                  </label>
                </li>
              )
            })}
        </ul>
      </section>
      <section>
        <h3>Players</h3>
        <ul>
          {players &&
            players.map((player) => (
              <li key={player.uuid}>
                {player.uuid} {player.uuid === sessionID && ' (me)'}
              </li>
            ))}
        </ul>
      </section>
      <button onClick={handleStartGameClick}>Start game</button>
    </div>
  )
}
