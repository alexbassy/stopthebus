import getSupabaseClient from '@/client/supabase'
import { DatabaseFunctions } from '@/constants/database-functions'
import { assertMethod, getGameId, getRequestPropertyOrReject } from '@/helpers/api/validation'
import { Game } from '@/typings/game'
import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse<Game | any>) {
  if (!assertMethod('POST', { req, res })) {
    return
  }

  const [id, idError] = getGameId({ req, res })
  if (idError) return

  const [letters, lettersError] = getRequestPropertyOrReject<string>('letters', { req, res })
  if (lettersError) return

  if (!/^[a-z]*$/i.test(letters)) {
    return res.status(401).json({ message: 'Only latin letters are allowed' })
  }

  const supabase = getSupabaseClient()

  const { error } = await supabase.rpc(DatabaseFunctions.UpdateLetters, {
    game_id: id,
    new_letters: letters.toLowerCase(),
  })

  if (error) {
    return res.status(400).end()
  }

  return res.status(200).end()
}
