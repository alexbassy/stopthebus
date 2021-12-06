import React, { useState, SyntheticEvent, useEffect } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import { persistGameConfig } from '@/helpers/persistGame'
import * as random from '@/helpers/random'
import { Input, Button, H2, Spacing } from '@/components/visual'
import PageTitle from '@/components/PageTitle'
import FormControl from '@/components/FormControl'
import Themed from '@/components/Themed'
import { createGameWithID } from '@/client/rest'
import { Player } from '@/typings/game'
import { getUserSession } from '@/helpers/getPersistedPlayer'
import { APP_ROUTES } from '@/client/api-routes'
import log from '@/helpers/log'

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

    console.log({ player })

    if (!player?.id) {
      alert('Failed to create player ID. Please try again.')
      return
    }

    try {
      const response = await createGameWithID(newGameID, player.id)
      console.log({ response })
      router.push(APP_ROUTES.game(newGameID))
    } catch (e) {
      log.e(e)
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
