import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

/**
 * Saving to the database is turned on with NEXT_PUBLIC_EDITOR_REMOTE=1, once Supabase accepts the Clerk
 * session token (third-party auth). Until then the editor runs as the offline demo: everything stays in this browser.
 */
export const supabaseConfigured = process.env.NEXT_PUBLIC_EDITOR_REMOTE === '1' && Boolean(SUPABASE_URL && SUPABASE_KEY)

type ClerkGlobal = { session?: { getToken: () => Promise<string | null> } | null }

let client: SupabaseClient<any, 'editor'> | undefined // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * One browser client for the editor, on the "editor" schema. Every request carries the Clerk session token
 * (with the active organization), which Supabase accepts as third-party auth; row level security does the rest.
 */
export function supabase() {
  client ??= createClient(SUPABASE_URL, SUPABASE_KEY, {
    db: { schema: 'editor' },
    async accessToken() {
      const clerk = (globalThis as { Clerk?: ClerkGlobal }).Clerk
      try { return (await clerk?.session?.getToken()) ?? null } catch { return null }
    },
  })
  return client
}
