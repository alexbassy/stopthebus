import { GameConfig } from '@/typings/supabase'
import { Observable } from 'rxjs'
import getSupabaseClient from './supabase'

export function gameConfig(id: string): Observable<GameConfig> {
  const supabase = getSupabaseClient()

  return new Observable((subscriber) => {
    const subscription = supabase
      .from<GameConfig>(`gameConfig:id=${id}`)
      .on('*', (payload) => {
        console.log('Change received!', payload)
        subscriber.next(payload.new)
      })
      .subscribe()

    return () => subscription.unsubscribe()
  })
}
