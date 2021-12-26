import getSupabaseClient from './supabase'

enum Functions {
  UpdateLetters = 'game_update_letters',
}

export async function updateLetters(gameId: string, letters: string[]) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.rpc(Functions.UpdateLetters, {
    game_id: gameId,
    new_letters: letters.join(''),
  })

  console.log({ data, error })
}
