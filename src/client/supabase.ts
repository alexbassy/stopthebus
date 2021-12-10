import { createClient, SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY
const SUPABASE_ENDPOINT = process.env.NEXT_PUBLIC_SUPABASE_ENDPOINT

export default function getSupabaseClient(): SupabaseClient {
  if (!SUPABASE_KEY || !SUPABASE_ENDPOINT) {
    throw Error('Missing Supabase environment variables')
  }
  return createClient(SUPABASE_ENDPOINT, SUPABASE_KEY)
}
