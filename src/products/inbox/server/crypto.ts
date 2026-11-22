// Channel tokens are stored sealed (AES-256-GCM). The key lives only in the server environment (INBOX_CREDENTIAL_KEY,
// 32 bytes in base64), so a copy of the database alone does not give access to anyone's WhatsApp or Instagram.
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { InboxError } from './db'

function key() {
  const raw = process.env.INBOX_CREDENTIAL_KEY
  const k = raw ? Buffer.from(raw, 'base64') : null
  if (!k || k.length !== 32) throw new InboxError('CREDENTIALS_UNAVAILABLE', 'A proteção das credenciais do Inbox ainda não está configurada no servidor.', 503)
  return k
}

export function seal(text: string) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key(), iv)
  const data = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  return ['v1', iv, cipher.getAuthTag(), data].map(p => typeof p === 'string' ? p : p.toString('base64url')).join('.')
}

export function unseal(sealed: string) {
  const [version, iv, tag, data] = sealed.split('.')
  if (version !== 'v1' || !iv || !tag || !data) throw new InboxError('CREDENTIALS_INVALID', 'Credencial do canal ilegível. Conecte o canal de novo.', 409)
  try {
    const decipher = createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64url'))
    decipher.setAuthTag(Buffer.from(tag, 'base64url'))
    return Buffer.concat([decipher.update(Buffer.from(data, 'base64url')), decipher.final()]).toString('utf8')
  } catch (error) {
    if (error instanceof InboxError) throw error
    throw new InboxError('CREDENTIALS_INVALID', 'Credencial do canal ilegível. Conecte o canal de novo.', 409)
  }
}
