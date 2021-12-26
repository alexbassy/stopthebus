import getSupabaseClient from '@/client/supabase'
import { IGame } from '@/typings/supabase'
import { bind } from '@react-rxjs/core'
import { SupabaseRealtimePayload } from '@supabase/supabase-js'
import { map, merge, Observable, of, share, startWith, tap } from 'rxjs'
import { filter, mergeMap, switchMapTo } from 'rxjs/operators'

type Payload = SupabaseRealtimePayload<any>

function fetchGame(id: string) {
  return new Observable<IGame>((subscriber) => {
    const supabase = getSupabaseClient()

    try {
      supabase
        .from<IGame>(`game`)
        .select()
        .eq('id', id)
        .limit(1)
        .single()
        .then((response) => {
          console.log('response', response)
          subscriber.next(response.data ?? undefined)
        })
    } catch (err) {
      console.log({ err })
    }
  })
}

const subscribeToGame = (id: string) => {
  return new Observable<IGame>((subscriber) => {
    const supabase = getSupabaseClient()
    const realtimeSubscription = supabase
      .from<IGame>(`game:id=eq.${id}`)
      .on('*', (payload) => {
        console.log('Change received', payload)
        subscriber.next(payload.new)
      })
      .subscribe()

    return () => {
      realtimeSubscription.unsubscribe()
    }
  })
}

class Manager {
  constructor() {
    console.log('instantiated')
  }

  gameId!: string

  setId(gameId: string) {
    if (typeof gameId !== 'string') return
    console.log('gameid is', gameId)
    this.gameId = gameId
  }

  get fetchGame$() {
    if (!this.gameId) return of(null)
    return fetchGame(this.gameId)
  }

  get gameSubscription$() {
    if (!this.gameId) return of(null)
    return subscribeToGame(this.gameId)
  }

  get game$() {
    return merge(this.gameSubscription$, this.fetchGame$).pipe(
      tap((value) => {
        console.log({ value })
      }),
      share()
    )
  }

  get gameConfig$() {
    return this.game$.pipe(
      filter(Boolean),
      map((game) => game.config)
    )
  }

  get gameConfigLetters$() {
    return this.gameConfig$.pipe(map((config) => config.letters.split('')))
  }
}

export const manager = new Manager()

export const [useGameConfigLetters] = bind(() => manager.gameConfigLetters$, [])
