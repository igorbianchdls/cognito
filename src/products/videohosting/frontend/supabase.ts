import { createClient, type SupabaseClient } from '@supabase/supabase-js'

type ClerkGlobal = { session?: { getToken: () => Promise<string | null> } | null }
let client: SupabaseClient<any, 'videohosting'> | undefined // eslint-disable-line @typescript-eslint/no-explicit-any

/** Browser client on the "videohosting" schema, with the Clerk session token; row level security does the rest. */
export function supabase() {
  client ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '', {
    db: { schema: 'videohosting' },
    async accessToken() {
      const clerk = (globalThis as { Clerk?: ClerkGlobal }).Clerk
      try { return (await clerk?.session?.getToken()) ?? null } catch { return null }
    },
  })
  return client
}

export const deniedMessage = (error: { code?: string } | null, fallback: string) => error?.code === '42501' ? 'Seu perfil só pode visualizar.' : fallback
