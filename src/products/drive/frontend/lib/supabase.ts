import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type ClerkGlobal = { session?: { getToken: () => Promise<string | null> } | null }

let client: SupabaseClient<any, 'drive'> | undefined // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * Browser client on the "drive" schema, with the Clerk session token like the editor's client; row level security
 * does the rest. Whether the app saves at all follows NEXT_PUBLIC_EDITOR_REMOTE (see editor/frontend/lib/supabase.ts).
 */
export function supabase() {
  client ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '', {
    db: { schema: 'drive' },
    async accessToken() {
      const clerk = (globalThis as { Clerk?: ClerkGlobal }).Clerk
      try { return (await clerk?.session?.getToken()) ?? null } catch { return null }
    },
  })
  return client
}
