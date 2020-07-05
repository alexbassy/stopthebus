import React, {
  ChangeEvent,
  Dispatch,
  SetStateAction,
  SyntheticEvent,
  useContext,
  useState,
} from 'react'
import { Helmet } from 'react-helmet'
import { Flex, Grid } from './layout'
import {
  Button,
  Checkbox,
  H2,
  H3,
  Input,
  Item,
  List,
  Spacing,
  Select,
  Lighter,
  Description,
} from './visual'
import FormControl from './FormControl'
import CategoriesList from './CategoriesList'
import Player from './Player'
import Dialog from './Dialog'
import GameStarting from './GameStarting'
import GameContext from '../contexts/GameContext'
import { ENGLISH_LETTERS } from '../constants/letters'
import EmitterContext from '../contexts/EmitterContext'
import {
  getUserSessionID,
  updatePersistedUserName,
} from '../helpers/getUserSession'
import { range } from '../helpers/util'
import { GameConfig, GameMode, GameStage } from '../typings/game'
import { ClientEvent } from '../typings/socket-events'

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
        letters: [...newLetters].join(''),
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
    if (!game.config.categories.length) {
      alert('Please choose some categories to play with first')
      return
    }
    emit(ClientEvent.START_ROUND)
  }

  const handleNicknameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setNickname(event.target.value)
  }

  const handleNickNameUpdate = (event: SyntheticEvent<HTMLButtonElement>) => {
    updatePersistedUserName(nickname)
    emit(ClientEvent.UPDATE_NICKNAME, nickname)
  }

  const handleCancelStartGame = (event: SyntheticEvent<HTMLButtonElement>) => {
    emit(ClientEvent.CANCEL_START_ROUND)
  }

  const { config, players, state } = game
  const currentPlayer = players.find((player) => player.uuid === sessionID)

  if (!currentPlayer) return null

  return (
    <div>
      <Helmet>
        <title>New Game - Stop The Bus</title>
      </Helmet>
      <p>
        Welcome, <Player {...currentPlayer} inline />!
      </p>
      <FormControl>
        <Input
          type='text'
          value={nickname}
          onChange={handleNicknameChange}
          placeholder='Enter your nickname'
          aria-label='Nickname'
          aria-describedby='nickname-description'
        />
        <Button type='button' onClick={handleNickNameUpdate}>
          Update
        </Button>
      </FormControl>
      <Spacing t={0.5}>
        <Description id='nickname-description'>
          Enter a nickname for other players to see you by.
        </Description>
      </Spacing>
      <Grid columns={[2, 1]} stackOnMobile>
        <section>
          <H3>Letters</H3>
          <List>
            {config &&
              ENGLISH_LETTERS.map((letter) => {
                return (
                  <Item key={letter} inline>
                    <Spacing r={0.75} b={0.75}>
                      <label>
                        <Flex yCentre style={{ width: '3.15rem' }}>
                          <Checkbox
                            type='checkbox'
                            value={letter}
                            checked={config?.letters?.includes(letter)}
                            onChange={handleLetterChange(letter)}
                          />
                          {letter.toUpperCase()}
                        </Flex>
                      </label>
                    </Spacing>
                  </Item>
                )
              })}
          </List>
        </section>
        <section>
          <H3>Players</H3>
          <List>
            {players &&
              players.map((player) => (
                <Item key={player.uuid}>
                  <Player {...player} showMe />
                </Item>
              ))}
          </List>
        </section>
      </Grid>
      <section>
        <H3>
          Categories
          <Lighter> ({config?.categories?.length ?? 0} selected)</Lighter>
        </H3>
        <CategoriesList
          selectedCategories={config?.categories || []}
          onChange={handleCategoryChange}
        />
      </section>
      <section>
        <H3>Mode</H3>
        <p>You can race against each other, or with a time limit</p>
        <div aria-hidden style={{ display: 'none' }}>
          <label>
            Play mode{' '}
            <Select
              value={config?.mode}
              onBlur={handleModeChange}
              onChange={handleModeChange}
            >
              <option value={GameMode.RACE}>Race</option>
              <option value={GameMode.TIMER}>Timer</option>
            </Select>
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
          <label htmlFor='game-number-rounds'>Number of rounds </label>
          <Select
            id='game-number-rounds'
            value={config?.rounds}
            onBlur={handleRoundCountChange}
            onChange={handleRoundCountChange}
          >
            {range(1, 10).map((val) => (
              <option key={val} value={val}>
                {val}
              </option>
            ))}
          </Select>
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
      <Spacing b={2} />

      <Button large onClick={handleStartGameClick}>
        Start game
      </Button>

      {state.stage === GameStage.STARTING && (
        <Dialog>
          <GameStarting onCancel={handleCancelStartGame} />
        </Dialog>
      )}
    </div>
  )
}
