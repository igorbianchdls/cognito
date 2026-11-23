import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { ChannelKind, MessageKind } from '../shared/rules'

type ClerkGlobal = { session?: { getToken: () => Promise<string | null> } | null }
let client: SupabaseClient<any, 'inbox'> | undefined // eslint-disable-line @typescript-eslint/no-explicit-any

/** Browser client on the "inbox" schema, with the Clerk session token; row level security does the rest. */
export function supabase() {
  client ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '', {
    db: { schema: 'inbox' },
    async accessToken() {
      const clerk = (globalThis as { Clerk?: ClerkGlobal }).Clerk
      try { return (await clerk?.session?.getToken()) ?? null } catch { return null }
    },
  })
  return client
}

export const deniedMessage = (error: { code?: string; message?: string } | null, fallback: string) =>
  error?.code === '42501' ? 'Seu perfil só pode visualizar.' : error?.code === '23505' ? 'Já existe um item com esse nome.' : error?.code === '23514' ? 'Confira os dados: algum campo está em formato inválido.' : fallback

/** POST to an Inbox route; resolves to the JSON body or throws an Error with the server's message. */
export async function post<T = Record<string, unknown>>(path: string, body: object): Promise<T> {
  const response = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const data = await response.json().catch(() => ({})) as T & { erro?: string }
  if (!response.ok && !(response.status === 502 && data)) throw new Error(data.erro ?? 'Não foi possível concluir. Tente de novo.')
  return data
}

export type Channel = { id: string; kind: ChannelKind; name: string; external_id: string; display: string | null; status: 'conectado' | 'erro' | 'desconectado'; last_error: string | null; created_at: string }
export type Contact = { id: string; name: string; phone: string | null; email: string | null; created_at: string; source?: string | null }
export type Tag = { id: string; name: string; color: string }
export type Conversation = {
  id: string; status: 'aberta' | 'pendente' | 'fechada'; assignee: string | null; last_message_at: string; last_inbound_at: string | null
  last_preview: string | null; unread: number; contact_id: string; channel_id: string; sla_alerted_at?: string | null; team_id?: string | null
  contact: Pick<Contact, 'id' | 'name' | 'phone' | 'email'> | null; channel: Pick<Channel, 'id' | 'kind' | 'name' | 'status'> | null
}
export type Message = {
  id: string; direction: 'entrada' | 'saida'; kind: MessageKind; body: string | null; media_path: string | null; media_mime: string | null; media_name: string | null
  status: 'recebida' | 'enviando' | 'enviada' | 'entregue' | 'lida' | 'falhou'; error: string | null; sent_by: string | null; created_at: string
}
export type Note = { id: string; body: string; author: string | null; created_at: string }
export type QuickReply = { id: string; shortcut: string; body: string }

/** "+55 11 98888-7777" for Brazilian numbers, the number as stored otherwise. */
export function formatPhone(phone: string | null) {
  if (!phone) return ''
  const m = /^\+55(\d{2})(\d{4,5})(\d{4})$/.exec(phone)
  return m ? `+55 ${m[1]} ${m[2]}-${m[3]}` : phone
}
/** Digits with country code ("11 98888-7777" → "+5511988887777"); null when it can't be a phone. */
export function cleanPhone(raw: string) {
  let digits = raw.replace(/\D/g, '')
  if (!digits) return null
  if (!raw.trim().startsWith('+') && (digits.length === 10 || digits.length === 11)) digits = '55' + digits
  return /^[0-9]{8,15}$/.test(digits) ? '+' + digits : null
}

export const time = (iso: string) => {
  const d = new Date(iso), now = new Date()
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  if (now.getTime() - d.getTime() < 6 * 86400000) return d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

/** Parses "nome;telefone;email" (or with commas); a first line with "nome" is the header. */
export function parseContactsCsv(text: string) {
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(l => l.trim())
  const sep = (lines[0]?.split(';').length ?? 0) >= (lines[0]?.split(',').length ?? 0) ? ';' : ','
  const rows = lines.map(l => l.split(sep).map(v => v.trim().replace(/^"|"$/g, '').replace(/""/g, '"')))
  let [iName, iPhone, iEmail] = [0, 1, 2]
  if (rows[0]?.some(v => /^nome$/i.test(v))) {
    const head = rows.shift()!.map(h => h.toLowerCase())
    iName = head.findIndex(h => h === 'nome'); iPhone = head.findIndex(h => /telefone|celular|whatsapp|fone/.test(h)); iEmail = head.findIndex(h => /e-?mail/.test(h))
  }
  const ok: { name: string; phone: string | null; email: string | null }[] = []
  let skipped = 0
  for (const r of rows) {
    const name = (r[iName] ?? '').slice(0, 120), phone = iPhone >= 0 && r[iPhone] ? cleanPhone(r[iPhone]) : null
    const email = iEmail >= 0 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(r[iEmail] ?? '') ? r[iEmail].toLowerCase() : null
    if (!name || (!phone && !email)) { skipped++; continue }
    ok.push({ name, phone, email })
  }
  return { ok, skipped }
}
