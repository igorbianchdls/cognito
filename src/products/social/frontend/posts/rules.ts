// What each network accepts, and the problems a post would hit before it is published.
import type { DFile } from '@/products/editor/frontend/spaces/store'
import { networkLabel, type Network, type PostFormat } from './data'
import { getAccounts } from './accounts'

/** Caption limits per network. Instagram also caps hashtags. */
export const limits: Record<Network, { chars: number; hashtags?: number }> = {
  instagram: { chars: 2200, hashtags: 30 },
  tiktok: { chars: 4000 },
  linkedin: { chars: 3000 },
  youtube: { chars: 5000 },
}
/** Instagram shows about this many characters before "… mais". */
export const IG_VISIBLE = 125
export const CAROUSEL_MAX = 20

export type Issue = { level: 'erro' | 'aviso' | 'dica'; text: string }

export const hashtags = (caption: string) => caption.match(/#[\p{L}\p{N}_]+/gu) ?? []
export const mentions = (caption: string) => caption.match(/@[\w.]+/g) ?? []

export function networksOf(accountIds: string[]): Network[] {
  return [...new Set(accountIds.map(id => getAccounts().find(a => a.id === id)?.network).filter((n): n is Network => !!n))]
}

export function checkPost({ caption, accountIds, format, files }: { caption: string; accountIds: string[]; format: PostFormat; files: DFile[] }): Issue[] {
  const out: Issue[] = []
  const nets = networksOf(accountIds)
  const tags = hashtags(caption).length
  for (const n of nets) {
    const l = limits[n]
    if (caption.length > l.chars) out.push({ level: 'erro', text: `${networkLabel[n]}: a legenda passa do limite de ${l.chars.toLocaleString('pt-BR')} caracteres.` })
    if (l.hashtags && tags > l.hashtags) out.push({ level: 'erro', text: `${networkLabel[n]}: no máximo ${l.hashtags} hashtags (você tem ${tags}).` })
  }
  if (!files.length) return out
  const videos = files.filter(f => f.kind === 'video').length
  if (format === 'reel' && !videos) out.push({ level: 'erro', text: 'Reel precisa de um vídeo. Para imagens, use Feed ou Story.' })
  if ((format === 'reel' || format === 'story') && files.length > 1) out.push({ level: 'aviso', text: `Em ${format === 'reel' ? 'Reel' : 'Story'} só o primeiro arquivo é publicado. Para carrossel, use Feed.` })
  if (format === 'feed' && files.length > CAROUSEL_MAX) out.push({ level: 'erro', text: `Carrossel aceita até ${CAROUSEL_MAX} arquivos.` })
  if (format === 'story' && caption.trim()) out.push({ level: 'aviso', text: 'Stories não mostram legenda. Coloque o texto no próprio vídeo ou imagem.' })
  if (nets.includes('tiktok') && !videos) out.push({ level: 'aviso', text: 'No TikTok, imagens viram um carrossel de fotos.' })
  if (nets.includes('instagram') && format !== 'story' && caption.length > IG_VISIBLE) out.push({ level: 'dica', text: `No Instagram só os primeiros ${IG_VISIBLE} caracteres aparecem antes do “mais”. Deixe o gancho no começo.` })
  const long = files.find(f => f.kind === 'video' && (f.duration ?? 0) > (format === 'story' ? 60 : 180))
  if (long && nets.includes('instagram')) out.push({ level: 'aviso', text: `“${long.name}” tem mais de ${format === 'story' ? '60 segundos; o Story corta em partes' : '3 minutos; o Instagram pode não aceitar como Reel'}.` })
  return out
}
