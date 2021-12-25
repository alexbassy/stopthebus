import getSupabaseClient from '@/client/supabase'
import { bind } from '@react-rxjs/core'
import { filter, Observable, scan, share } from 'rxjs'
import { SupabaseRealtimePayload } from '@supabase/supabase-js'

type Payload = SupabaseRealtimePayload<any>

const all$ = new Observable<Payload>((subscriber) => {
  const supabase = getSupabaseClient()
  const mySubscription = supabase
    .from('*')
    .on('*', (payload) => {
      console.log('Change received!', payload)
      subscriber.next(payload)
    })
    .subscribe()

  return () => {
    mySubscription.unsubscribe()
  }
})

const allMulti$ = all$.pipe(share())

const accumulate = () =>
  scan<Payload, Payload[]>((acc, curr) => {
    return [...acc, curr]
  }, [])

const gameStates$ = allMulti$.pipe(
  filter((payload) => payload.table === 'gameStates'),
  accumulate()
)

const gameConfig$ = allMulti$.pipe(
  filter((payload) => payload.table === 'gameConfig'),
  accumulate()
)

const room$ = allMulti$.pipe(
  filter((payload) => payload.table === 'room'),
  accumulate()
)

const allBuffer$ = all$.pipe(accumulate())

const [useGameState] = bind(gameStates$, [])

const [useGameConfig] = bind(gameConfig$, [])

const DebugPage: React.FC = (props) => {
  const gameStateLog = useGameState()
  const gameConfigLog = useGameConfig()

  console.log('rerendered')

  return (
    <div>
      <h2>Game states</h2>
      <pre>{JSON.stringify(gameStateLog, null, 2)}</pre>

      <h2>Game configs</h2>
      <pre>{JSON.stringify(gameConfigLog, null, 2)}</pre>
    </div>
  )
}

export default DebugPage
