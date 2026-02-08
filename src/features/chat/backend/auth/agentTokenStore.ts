import crypto from 'crypto'

export type AgentTokenRecord = {
  token: string
  exp: number // epoch seconds
}

const TOKENS = new Map<string, AgentTokenRecord>()

export function generateAgentToken(ttlSeconds = 1800): { token: string; exp: number } {
  const token = crypto.randomBytes(24).toString('hex')
  const nowSec = Math.floor(Date.now() / 1000)
  const exp = nowSec + Math.max(60, ttlSeconds)
  return { token, exp }
}

export function setAgentToken(chatId: string, token: string, exp: number) {
  TOKENS.set(chatId, { token, exp })
}

export function verifyAgentToken(chatId: string | null | undefined, token: string | null | undefined) {
  if (!chatId || !token) return false
  const rec = TOKENS.get(chatId)
  if (!rec) return false
  const nowSec = Math.floor(Date.now() / 1000)
  if (nowSec >= rec.exp) return false
  return rec.token === token
}

