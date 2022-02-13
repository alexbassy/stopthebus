import { manager } from '@/hooks/database'
import { Button, Description, Input, Spacing } from '@/components/visual'
import FormControl from '@/components/FormControl'
import { FormEventHandler, useState } from 'react'
import usePlayer from '@/hooks/usePlayer'

const PlayerName: React.FC = () => {
  const [player, updatePlayerName] = usePlayer()
  const [username, setUsername] = useState('')

  const handleSubmit: FormEventHandler<HTMLFormElement> = async (event) => {
    event.preventDefault()
    if (!player?.id) return
    await manager.setGamePlayerName(player.id, username)
    updatePlayerName(username)
    setUsername('')
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormControl>
        <Input
          type='text'
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder='Enter your nickname'
          aria-label='Nickname'
          aria-describedby='nickname-description'
        />
        <Button>Update</Button>
      </FormControl>
      <Spacing t={0.5}>
        <Description id='nickname-description'>
          Enter a nickname for other players to see you by.
        </Description>
      </Spacing>
    </form>
  )
}

export default PlayerName
