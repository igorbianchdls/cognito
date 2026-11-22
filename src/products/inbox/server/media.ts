// Incoming attachments are copied from Meta (their links expire) to the drive bucket, under "<empresa>/inbox/…".
import { uploadObject } from '@/products/mcpcore/domains/editor/server/media'
import type { Query } from './db'
import { unseal } from './crypto'
import type { IngestDeps } from './ingest'
import { downloadMedia } from './meta'

const EXT: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'audio/ogg': 'ogg', 'audio/mpeg': 'mp3', 'audio/mp4': 'm4a',
  'audio/aac': 'aac', 'video/mp4': 'mp4', 'video/3gpp': '3gp', 'application/pdf': 'pdf' }

export function mediaStore(service: Query, send: typeof fetch = fetch): NonNullable<IngestDeps['storeMedia']> {
  return async (channel, message, path) => {
    if (!message.media) return null
    let token: string | null = null
    if (message.media.id) {
      const [cred] = await service<{ token_sealed: string }>('SELECT token_sealed FROM inbox_private.channel_credentials WHERE channel_id = $1', [channel.id])
      if (!cred) return null
      token = unseal(cred.token_sealed)
    }
    const { bytes, mime } = await downloadMedia(send, message.media, token)
    const clean = mime.split(';')[0].trim().toLowerCase()
    const name = message.media.name ?? `${message.kind}.${EXT[clean] ?? 'bin'}`
    const target = path(name)
    await uploadObject(target, bytes, clean, { send })
    return { path: target, mime: clean, name: message.media.name ?? null }
  }
}
