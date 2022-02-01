import React, { useState, SyntheticEvent, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import * as random from '@/helpers/random'
import { H2, Spacing } from '@/components/visual'
import PageTitle from '@/components/PageTitle'
import FormControl from '@/components/FormControl'
import Themed from '@/components/Themed'
import { createGameWithID } from '@/client/rest'
import { Player } from '@/typings/game'
import { getUserSession } from '@/helpers/getPersistedPlayer'
import { APP_ROUTES } from '@/client/api-routes'
import { Button, Input } from '@nextui-org/react'

export default function Home() {
  const router = useRouter()
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
      router.push(APP_ROUTES.game(gameID))
    }
  }

  const handleCreateGame = async (ev: SyntheticEvent<HTMLFormElement>) => {
    ev.preventDefault()

    if (!player?.id) {
      alert('Failed to create player ID. Please try again.')
      return
    }

    try {
      await createGameWithID(newGameID, player)
      router.push(APP_ROUTES.game(newGameID))
    } catch (e) {
      console.error('Something went wrong while creating a game', e)
      alert('Sorry, something went wrong')
    }
  }

  return (
    <Themed>
      <Head>
        <title>Start or join - Stop the Bus</title>
      </Head>
      <PageTitle />
      <H2>Join a game</H2>
      <form onSubmit={handleJoinGame}>
        <FormControl
          action={
            <Button shadow color='primary'>
              Join
            </Button>
          }
        >
          <Input
            type='text'
            id='game-id'
            aria-label='Enter a game ID, words separated with hyphens'
            value={gameID}
            onChange={(ev) => setGameID(ev.target.value.toLowerCase())}
            placeholder='Type in game name'
            fullWidth
            clearable
          />
        </FormControl>
      </form>
      <H2>Create a game</H2>
      <form onSubmit={handleCreateGame}>
        <FormControl
          action={
            <Button
              type='button'
              shadow
              color='primary'
              onClick={() => setNewGameID(random.getGameName())}
            >
              Change
            </Button>
          }
        >
          <Input
            type='text'
            id='new-game-id'
            value={newGameID}
            aria-label='New game name'
            readOnly
            fullWidth
          />
        </FormControl>
        <Spacing b={1} />
        <Button shadow color='primary' auto>
          Create game
        </Button>
      </form>
    </Themed>
  )
}
