import React, { useState, SyntheticEvent, useEffect } from 'react'
import { useRouter } from 'next/router'
import { persistGameConfig } from '@/helpers/persistGame'
import * as random from '@/helpers/random'
import { Input, Button, H2, Spacing } from '@/components/visual'
import PageTitle from '@/components/PageTitle'
import FormControl from '@/components/FormControl'
import Themed from '@/components/Themed'

export default function Home() {
  const router = useRouter()
  const [gameID, setGameID] = useState<string>('')
  const [newGameID, setNewGameID] = useState<string>('')

  useEffect(() => {
    setNewGameID(random.getGameName())
  }, [])

  const handleJoinGame = (ev: SyntheticEvent<HTMLFormElement>) => {
    ev.preventDefault()
    const sanitised = gameID.trim().toLowerCase()
    if (sanitised.length) {
      router.push(`/game/${gameID}`)
    }
  }

  const handleCreateGame = (ev: SyntheticEvent<HTMLFormElement>) => {
    ev.preventDefault()
    persistGameConfig(newGameID)
    router.push(`/game/${newGameID}`)
  }

  return (
    <Themed>
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
          <Button
            type='button'
            onClick={() => setNewGameID(random.getGameName())}
          >
            Change
          </Button>
        </FormControl>
        <Spacing b={1} />
        <Button>Create game</Button>
      </form>
    </Themed>
  )
}
