import React, { useState, SyntheticEvent, useEffect } from 'react'
import { useLocation } from 'wouter'
import * as random from '@/helpers/random'
import { Input, Button, H2, Spacing } from '@/components/visual'
import PageTitle from '@/components/PageTitle'
import FormControl from '@/components/FormControl'
import Themed from '@/components/Themed'
import { createGame } from '@/client/socket'
import { Player } from '@stopthebus/shared'
import { getUserSession } from '@/helpers/getPersistedPlayer'
import { APP_ROUTES } from '@/client/api-routes'

export default function Home() {
  const [, navigate] = useLocation()
  const [player, setPlayer] = useState<Player>()
  const [gameID, setGameID] = useState<string>('')
  const [newGameID, setNewGameID] = useState<string>('')

  useEffect(() => {
    setNewGameID(random.getGameName())
    setPlayer(getUserSession())
  }, [])

  const handleJoinGame = (ev: SyntheticEvent<HTMLFormElement>) => {
    ev.preventDefault()
    const sanitised = gameID.trim().toLowerCase()
    if (sanitised.length) {
      navigate(APP_ROUTES.game(gameID))
    }
  }

  const handleCreateGame = async (ev: SyntheticEvent<HTMLFormElement>) => {
    ev.preventDefault()

    if (!player?.id) {
      alert('Failed to create player ID. Please try again.')
      return
    }

    try {
      await createGame(newGameID, player)
      navigate(APP_ROUTES.game(newGameID))
    } catch (error: any) {
      console.error('Something went wrong while creating a game', error)
      alert(`There was an error: ${error.message}`)
    }
  }

  return (
    <Themed>
      <title>Start or join - Stop the Bus</title>
      <PageTitle />
      <H2>Join a game</H2>
      <form onSubmit={handleJoinGame}>
        <FormControl>
          <Input
            type='text'
            id='game-id'
            aria-label='Enter a game ID, words separated with hyphens'
            value={gameID}
            onChange={(ev) => setGameID(ev.target.value.toLowerCase())}
            placeholder='Type in game name'
          />
          {/* <Spacing r={0.5} inline /> */}
          <Button>Join</Button>
        </FormControl>
      </form>
      <H2>Create a game</H2>
      <form onSubmit={handleCreateGame}>
        <FormControl>
          <Input
            type='text'
            id='new-game-id'
            value={newGameID}
            aria-label='New game name'
            readOnly
          />
          <Button type='button' onClick={() => setNewGameID(random.getGameName())}>
            Change
          </Button>
        </FormControl>
        <Spacing b={1} />
        <Button>Create game</Button>
      </form>
    </Themed>
  )
}
