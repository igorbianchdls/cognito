// Brings a file from a public link into the company's Spaces: downloads it (public addresses only, with a size
// limit), reads its length and size from the file itself, stores it in the editor-media bucket and adds the row.
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { randomUUID } from 'node:crypto'
import { PluginError } from '../../../shared/contracts'
import type { Member } from './database'

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024
type Kind = 'video' | 'image' | 'audio'
export type Probe = { kind: Kind; mime: string; ext: string; duration: number | null; width: number; height: number }

// ---------- download (no private or local addresses) ----------

function privateAddress(ip: string) {
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase()
    if (v.startsWith('::ffff:')) return privateAddress(v.slice(7))
    return v === '::' || v === '::1' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe8') || v.startsWith('fe9') || v.startsWith('fea') || v.startsWith('feb') || v.startsWith('ff')
  }
  const [a, b] = ip.split('.').map(Number)
  return a === 0 || a === 10 || a === 127 || a >= 224 || (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 198 && (b === 18 || b === 19))
}

async function checkTarget(url: URL) {
  if (url.protocol !== 'https:') throw new PluginError('INVALID_INPUT', 'Use um link https.', 422)
  if (url.username || url.password) throw new PluginError('INVALID_INPUT', 'O link não pode ter usuário e senha.', 422)
  const host = url.hostname.replace(/^\[|\]$/g, '')
  const addresses = isIP(host) ? [host] : (await lookup(host, { all: true }).catch(() => [])).map(a => a.address)
  if (!addresses.length) throw new PluginError('INVALID_INPUT', 'Não encontrei o endereço desse link.', 422)
  if (addresses.some(privateAddress)) throw new PluginError('INVALID_INPUT', 'Esse link aponta para um endereço interno.', 422)
}

export async function download(link: string, send: typeof fetch = fetch): Promise<{ bytes: Buffer; name: string }> {
  let url: URL
  try { url = new URL(link) } catch { throw new PluginError('INVALID_INPUT', 'Link inválido.', 422) }
  for (let hop = 0; hop < 4; hop++) {
    await checkTarget(url)
    const response = await send(url, { redirect: 'manual', signal: AbortSignal.timeout(20000), headers: { 'user-agent': 'OttoEditor/1.0' } }).catch(() => null)
    if (!response) throw new PluginError('DOWNLOAD_FAILED', 'Não consegui baixar o arquivo desse link.', 502)
    if (response.status >= 300 && response.status < 400 && response.headers.get('location')) { url = new URL(response.headers.get('location')!, url); continue }
    if (!response.ok || !response.body) throw new PluginError('DOWNLOAD_FAILED', `O link respondeu com erro (${response.status}).`, 502)
    if (Number(response.headers.get('content-length') || 0) > MAX_UPLOAD_BYTES) throw new PluginError('FILE_TOO_LARGE', 'O arquivo passa de 50 MB. Envie pelo Spaces no Otto.', 413)
    const chunks: Buffer[] = []
    let size = 0
    const reader = response.body.getReader()
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_UPLOAD_BYTES) { await reader.cancel().catch(() => undefined); throw new PluginError('FILE_TOO_LARGE', 'O arquivo passa de 50 MB. Envie pelo Spaces no Otto.', 413) }
      chunks.push(Buffer.from(value))
    }
    const last = decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() || '')
    return { bytes: Buffer.concat(chunks), name: last }
  }
  throw new PluginError('DOWNLOAD_FAILED', 'O link redireciona demais.', 502)
}

// ---------- what the file is, read from its bytes ----------

/** MP4 / MOV / M4A: length from mvhd and picture size from the first video tkhd. */
function probeMp4(b: Buffer) {
  let duration: number | null = null, width = 0, height = 0
  const walk = (start: number, end: number, depth: number) => {
    let at = start
    while (at + 8 <= end && depth < 8) {
      let size = b.readUInt32BE(at), header = 8
      const type = b.toString('latin1', at + 4, at + 8)
      if (size === 1 && at + 16 <= end) { size = Number(b.readBigUInt64BE(at + 8)); header = 16 }
      if (size === 0) size = end - at
      if (size < header || at + size > end) break
      const body = at + header
      if (['moov', 'trak', 'mdia', 'minf', 'stbl'].includes(type)) walk(body, at + size, depth + 1)
      if (type === 'mvhd') {
        const v = b[body]
        const scale = v === 1 ? b.readUInt32BE(body + 20) : b.readUInt32BE(body + 12)
        const units = v === 1 ? Number(b.readBigUInt64BE(body + 24)) : b.readUInt32BE(body + 16)
        if (scale) duration = units / scale
      }
      if (type === 'tkhd' && !width) {
        const v = b[body], off = body + (v === 1 ? 88 : 76)
        if (off + 8 <= at + size) { const w = b.readUInt32BE(off) / 65536, h = b.readUInt32BE(off + 4) / 65536; if (w && h) { width = Math.round(w); height = Math.round(h) } }
      }
      at += size
    }
  }
  walk(0, b.length, 0)
  return { duration, width, height }
}

function jpegSize(b: Buffer) {
  let at = 2
  while (at + 9 < b.length) {
    if (b[at] !== 0xff) { at++; continue }
    const marker = b[at + 1]
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { height: b.readUInt16BE(at + 5), width: b.readUInt16BE(at + 7) }
    at += 2 + b.readUInt16BE(at + 2)
  }
  return { width: 0, height: 0 }
}

const MP3_RATES = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320]
function mp3Duration(b: Buffer) {
  let at = 0
  if (b.toString('latin1', 0, 3) === 'ID3') at = 10 + ((b[6] & 0x7f) << 21 | (b[7] & 0x7f) << 14 | (b[8] & 0x7f) << 7 | (b[9] & 0x7f))
  while (at + 4 < b.length && !(b[at] === 0xff && (b[at + 1] & 0xe0) === 0xe0)) at++
  const rate = MP3_RATES[(b[at + 2] ?? 0) >> 4]
  return rate ? (b.length - at) * 8 / (rate * 1000) : null
}

export function probe(b: Buffer): Probe | null {
  const ascii = (from: number, to: number) => b.toString('latin1', from, to)
  if (ascii(4, 8) === 'ftyp') {
    const brand = ascii(8, 12)
    const info = probeMp4(b)
    if (/^M4A|^M4B/.test(brand) || (!info.width && info.duration)) return { kind: 'audio', mime: 'audio/mp4', ext: 'm4a', ...info, width: 0, height: 0 }
    return brand.startsWith('qt') ? { kind: 'video', mime: 'video/quicktime', ext: 'mov', ...info } : { kind: 'video', mime: 'video/mp4', ext: 'mp4', ...info }
  }
  if (b.readUInt32BE(0) === 0x1a45dfa3) return { kind: 'video', mime: 'video/webm', ext: 'webm', duration: null, width: 0, height: 0 }
  if (b.readUInt32BE(0) === 0x89504e47) return { kind: 'image', mime: 'image/png', ext: 'png', duration: null, width: b.readUInt32BE(16), height: b.readUInt32BE(20) }
  if (b[0] === 0xff && b[1] === 0xd8) return { kind: 'image', mime: 'image/jpeg', ext: 'jpg', duration: null, ...jpegSize(b) }
  if (ascii(0, 4) === 'GIF8') return { kind: 'image', mime: 'image/gif', ext: 'gif', duration: null, width: b.readUInt16LE(6), height: b.readUInt16LE(8) }
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') {
    const chunk = ascii(12, 16)
    const size = chunk === 'VP8X' ? { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) }
      : chunk === 'VP8 ' ? { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff }
      : chunk === 'VP8L' ? { width: 1 + ((b[21] | b[22] << 8) & 0x3fff), height: 1 + ((b[22] >> 6 | b[23] << 2 | b[24] << 10) & 0x3fff) } : { width: 0, height: 0 }
    return { kind: 'image', mime: 'image/webp', ext: 'webp', duration: null, ...size }
  }
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WAVE') {
    const rate = b.readUInt32LE(28)
    return { kind: 'audio', mime: 'audio/wav', ext: 'wav', duration: rate ? (b.length - 44) / rate : null, width: 0, height: 0 }
  }
  if (ascii(0, 3) === 'ID3' || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0)) return { kind: 'audio', mime: 'audio/mpeg', ext: 'mp3', duration: mp3Duration(b), width: 0, height: 0 }
  return null
}

// ---------- storing ----------

function storageTarget() {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!base || !key) throw new PluginError('STORAGE_UNAVAILABLE', 'O armazenamento dos Spaces não está configurado.', 503)
  const origin = new URL(base)
  if (origin.protocol !== 'https:' || !/^[a-z0-9]{20}\.supabase\.co$/.test(origin.hostname)) throw new PluginError('STORAGE_UNAVAILABLE', 'Confira a configuração do armazenamento.', 503)
  return { origin: origin.origin, key }
}

export const safeName = (name: string) => name.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w.-]+/g, '_').replace(/_+/g, '_').slice(-120) || 'arquivo'

export type StoreDeps = { send?: typeof fetch }

/** Uploads to "<organization>/<file id>/<name>" (the path the storage policies check) and adds the Spaces row. */
export async function storeFile(m: Member, input: { bytes: Buffer; name: string; folderId?: string }, deps: StoreDeps = {}) {
  const info = probe(input.bytes)
  if (!info) throw new PluginError('UNSUPPORTED_FILE', 'Formato não aceito. Use MP4, MOV, WEBM, PNG, JPG, WEBP, GIF, MP3, M4A ou WAV.', 415)
  let spaceId: string | undefined, folderId: string | null = null
  if (input.folderId) {
    const [folder] = await m.db.query<{ space_id: string }>('SELECT space_id FROM editor.folders WHERE id = $1 AND workspace_id = $2 AND trashed_at IS NULL', [input.folderId, m.ws])
    if (!folder) throw new PluginError('NOT_FOUND', 'Pasta não encontrada nos Spaces desta empresa.', 404)
    spaceId = folder.space_id; folderId = input.folderId
  } else {
    const [space] = await m.db.query<{ id: string }>('SELECT id FROM editor.spaces WHERE workspace_id = $1 ORDER BY created_at LIMIT 1', [m.ws])
    spaceId = space?.id
    if (!spaceId) {
      spaceId = randomUUID()
      await m.db.query('INSERT INTO editor.spaces (id, workspace_id, name) VALUES ($1, $2, $3)', [spaceId, m.ws, 'Arquivos'])
    }
  }
  const id = randomUUID()
  const base = input.name.replace(/\.[a-z0-9]{2,5}$/i, '').trim() || 'Arquivo'
  const name = `${base}.${info.ext}`.slice(-255)
  const path = `${m.ws}/${id}/${safeName(name)}`
  const { origin, key } = storageTarget()
  const response = await (deps.send || fetch)(`${origin}/storage/v1/object/editor-media/${path.split('/').map(encodeURIComponent).join('/')}`, {
    method: 'POST', headers: { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': info.mime, 'x-upsert': 'false' },
    body: new Uint8Array(input.bytes), signal: AbortSignal.timeout(20000),
  }).catch(() => null)
  if (!response?.ok) throw new PluginError('STORAGE_UNAVAILABLE', 'Não foi possível guardar o arquivo nos Spaces. Tente de novo.', 503)
  await m.db.query(`INSERT INTO editor.files (id, workspace_id, space_id, folder_id, name, kind, mime, size, duration, width, height, storage_path, created_by)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
  [id, m.ws, spaceId, folderId, name, info.kind, info.mime, input.bytes.length, info.duration, info.width, info.height, path, m.userId])
  return { id, name, kind: info.kind, duration: info.duration, width: info.width, height: info.height, size: input.bytes.length }
}
