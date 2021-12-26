import getSupabaseClient from './supabase'

enum Functions {
  UpdateLetters = 'game_update_letters',
  UpdateAlliteration = 'game_update_alliteration',
}

export async function updateLetters(gameId: string, letters: string[]) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.rpc(Functions.UpdateLetters, {
    game_id: gameId,
    new_letters: letters.join(''),
  })

  console.log({ data, error })
}

export async function updateAlliteration(gameId: string, alliteration: boolean) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.rpc(Functions.UpdateAlliteration, {
    game_id: gameId,
    new_alliteration: alliteration,
  })

  console.log({ data, error })
}
