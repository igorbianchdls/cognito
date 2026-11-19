import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type ClerkGlobal = { session?: { getToken: () => Promise<string | null> } | null }

let client: SupabaseClient<any, 'social'> | undefined // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * Browser client on the "social" schema, with the Clerk session token like the editor's client.
 * Whether the app saves at all follows the editor (NEXT_PUBLIC_EDITOR_REMOTE): Social is built on its Spaces.
 */
export function supabase() {
  client ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '', {
    db: { schema: 'social' },
    async accessToken() {
      const clerk = (globalThis as { Clerk?: ClerkGlobal }).Clerk
      try { return (await clerk?.session?.getToken()) ?? null } catch { return null }
    },
  })
  return client
}
