import React, {
  useContext,
  ChangeEvent,
  Dispatch,
  SetStateAction,
  SyntheticEvent,
  useState,
} from 'react'
import GameContext from '../contexts/GameContext'
import EmitterContext from '../contexts/EmitterContext'
import { range } from '../helpers/util'
import { ENGLISH_LETTERS } from '../constants/letters'
import { GameConfig, GameMode } from '../typings/game'
import { ClientEvent } from '../typings/socket-events'
import {
  getUserSessionID,
  updatePersistedUserName,
} from '../helpers/getUserSession'
import CategoriesList from '../components/CategoriesList'
import { Input, Button, H2, H3, List, Item, Checkbox, Spacing } from './visual'
import { Distribute } from './layout'

const sessionID = getUserSessionID()

interface NewGameProps {
  onChange: Dispatch<SetStateAction<GameConfig | null>>
}

export default function NewGame(props: NewGameProps) {
  const [nickname, setNickname] = useState<string>('')
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

  const handleNicknameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNickname(event.target.value)
  }

  const handleNickNameUpdate = (event: SyntheticEvent<HTMLButtonElement>) => {
    updatePersistedUserName(nickname)
    emit(ClientEvent.UPDATE_NICKNAME, nickname)
  }

  const { config, players } = game
  const currentPlayer = players.find((player) => player.uuid === sessionID)

  if (!currentPlayer) return null

  return (
    <div>
      <H2>Game {config.id}</H2>
      <p>Welcome, {currentPlayer.name || currentPlayer.uuid}!</p>
      <p>
        Set a nickname{' '}
        <Input type='text' value={nickname} onChange={handleNicknameChange} />{' '}
        <Button type='button' onClick={handleNickNameUpdate}>
          Change
        </Button>
      </p>
      <H2>Game settings</H2>
      <section>
        <H3>Letters</H3>
        <List>
          {config &&
            ENGLISH_LETTERS.map((letter) => {
              return (
                <Item key={letter} inline>
                  <Spacing r={0.75} b={0.75}>
                    <label>
                      <Checkbox
                        type='checkbox'
                        value={letter}
                        checked={config?.letters?.includes(letter)}
                        onChange={handleLetterChange(letter)}
                      />
                      {letter.toUpperCase()}
                    </label>
                  </Spacing>
                </Item>
              )
            })}
        </List>
      </section>
      <Distribute columns={[1, 1]}>
        <section>
          <H3>Categories</H3>
          <CategoriesList
            selectedCategories={config?.categories || []}
            onChange={handleCategoryChange}
          />
        </section>
        <section>
          <H3>Mode</H3>
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
                <Input
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
              <Checkbox
                type='checkbox'
                checked={config?.scoreWithAlliteration}
                onChange={handleAlliterationChange}
              />{' '}
              Points for alliteration
            </label>
          </div>
        </section>
      </Distribute>
      <section>
        <H3>Players</H3>
        <List>
          {players &&
            players.map((player) => (
              <Item key={player.uuid}>
                {player.name || player.uuid}{' '}
                {player.uuid === sessionID && ' (me)'}
              </Item>
            ))}
        </List>
      </section>
      <Button onClick={handleStartGameClick}>Start game</Button>
    </div>
  )
}
