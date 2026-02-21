import crypto from 'crypto'

export type AgentTokenRecord = {
  token: string
  exp: number // epoch seconds
}

const TOKENS = new Map<string, AgentTokenRecord>()

function nowSec() {
  return Math.floor(Date.now() / 1000)
}

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

function base64UrlDecode(input: string): string {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padLen = (4 - (normalized.length % 4)) % 4
  return Buffer.from(normalized + '='.repeat(padLen), 'base64').toString('utf8')
}

function getSigningSecret(): string {
  return String(
    process.env.AGENT_TOKEN_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.AUTH_SECRET ||
    '',
  ).trim()
}

function signPayload(payloadB64: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url')
}

function buildStatelessToken(exp: number, chatId?: string): string | null {
  const secret = getSigningSecret()
  if (!secret) return null
  const payload = JSON.stringify({ v: 1, exp, chat_id: chatId || null })
  const payloadB64 = base64UrlEncode(payload)
  const sig = signPayload(payloadB64, secret)
  return `v1.${payloadB64}.${sig}`
}

function verifyStatelessToken(chatId: string | null | undefined, token: string | null | undefined): boolean {
  const tk = String(token || '').trim()
  if (!tk.startsWith('v1.')) return false
  const secret = getSigningSecret()
  if (!secret) return false

  const parts = tk.split('.')
  if (parts.length !== 3) return false
  const payloadB64 = parts[1]
  const sig = parts[2]
  const expectedSig = signPayload(payloadB64, secret)

  try {
    const a = Buffer.from(sig)
    const b = Buffer.from(expectedSig)
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false
  } catch {
    return false
  }

  try {
    const payloadRaw = base64UrlDecode(payloadB64)
    const payload = JSON.parse(payloadRaw) as { exp?: number; chat_id?: string | null }
    const exp = Number(payload.exp || 0)
    if (!Number.isFinite(exp) || nowSec() >= exp) return false
    const tokenChatId = payload.chat_id ? String(payload.chat_id) : ''
    if (tokenChatId && String(chatId || '') !== tokenChatId) return false
    return true
  } catch {
    return false
  }
}

export function generateAgentToken(ttlSeconds = 1800, chatId?: string): { token: string; exp: number } {
  const exp = nowSec() + Math.max(60, ttlSeconds)
  const token = buildStatelessToken(exp, chatId) || crypto.randomBytes(24).toString('hex')
  return { token, exp }
}

export function setAgentToken(chatId: string, token: string, exp: number) {
  TOKENS.set(chatId, { token, exp })
}

export function verifyAgentToken(chatId: string | null | undefined, token: string | null | undefined) {
  const tk = String(token || '').trim()
  const internalKey = String(process.env.AGENT_INTERNAL_API_KEY || '').trim()
  if (internalKey && tk && tk === internalKey) return true

  if (!chatId || !tk) return false

  if (verifyStatelessToken(chatId, tk)) return true

  const rec = TOKENS.get(chatId)
  if (!rec) return false
  if (nowSec() >= rec.exp) return false
  return rec.token === tk
}
