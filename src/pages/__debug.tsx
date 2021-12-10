import getSupabaseClient from '@/client/supabase'
import { useEffect, useState } from 'react'

const DebugPage: React.FC = (props) => {
  const [state, setState] = useState<any>(() => [])

  useEffect(() => {
    const supabase = getSupabaseClient()
    const mySubscription = supabase
      .from('*')
      .on('*', (payload) => {
        console.log('Change received!', payload)
        setState((current: any[]) => [...current, payload])
      })
      .subscribe()

    return () => {
      mySubscription.unsubscribe()
    }
  }, [])

  return (
    <div>
      <pre>{JSON.stringify(state, null, 2)}</pre>
    </div>
  )
}

export default DebugPage
