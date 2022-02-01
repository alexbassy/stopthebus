import { manager } from '@/hooks/database'
import { Description, Spacing } from '@/components/visual'
import FormControl from '@/components/FormControl'
import { FormEventHandler, useState } from 'react'
import usePlayer from '@/hooks/usePlayer'
import { Button, Input } from '@nextui-org/react'

const PlayerName: React.FC = () => {
  const [player, updatePlayerName] = usePlayer()
  const [username, setUsername] = useState('')

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault()
    if (!player?.id) return
    manager.setGamePlayerName(player.id, username).then(() => {
      updatePlayerName(username)
      setUsername('')
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormControl
        action={
          <Button shadow color='primary' disabled={!username}>
            Update
          </Button>
        }
      >
        <Input
          type='text'
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder='Enter your nickname'
          aria-label='Nickname'
          aria-describedby='nickname-description'
          helperText='Enter a nickname for other players to see you by.'
          fullWidth
        />
      </FormControl>
    </form>
  )
}

export default PlayerName
