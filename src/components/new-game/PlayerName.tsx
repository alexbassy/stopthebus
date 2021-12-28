import { manager } from '@/hooks/supabase'
import { Button, Description, Input, Spacing } from '@/components/visual'
import FormControl from '@/components/FormControl'
import { useState } from 'react'
import {
  getUserSession,
  getUserSessionID,
  updatePersistedUserName,
} from '@/helpers/getPersistedPlayer'

const PlayerName: React.FC = () => {
  const [username, setUsername] = useState('')

  const handleSubmit = async () => {
    const playerId = getUserSessionID()
    await manager.setGamePlayerName(playerId, username)
    updatePersistedUserName(username)
    setUsername('')
  }

  return (
    <section>
      <FormControl>
        <Input
          type='text'
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder='Enter your nickname'
          aria-label='Nickname'
          aria-describedby='nickname-description'
        />
        <Button type='button' onClick={handleSubmit}>
          Update
        </Button>
      </FormControl>
      <Spacing t={0.5}>
        <Description id='nickname-description'>
          Enter a nickname for other players to see you by.
        </Description>
      </Spacing>
    </section>
  )
}

export default PlayerName
