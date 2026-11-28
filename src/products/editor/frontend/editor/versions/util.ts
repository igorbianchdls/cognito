'use client'

// Peças das versões: o resumo do que mudou, a capa (um quadro pequeno do começo do vídeo) e os nomes na tela.
import { media } from '../project/data'
import { mediaUrl } from '../project/mediaUrls'
import { projectDuration } from '../project/ops'
import { quadroUnico } from '../timeline/filmstrip'
import { FPS, canvasSize, type Project, type TrackKind } from '../project/types'
import type { TipoVersao, Version } from '../project/store'

const nomes: Record<TrackKind, [string, string]> = {
  video: ['vídeo', 'vídeos'], imagem: ['imagem', 'imagens'], audio: ['áudio', 'áudios'], texto: ['texto', 'textos'], legenda: ['legenda', 'legendas'], forma: ['forma', 'formas'],
}
export const tempo = (segundos: number) => `${Math.floor(segundos / 60)}:${String(Math.round(segundos % 60)).padStart(2, '0')}`

/** "+3 vídeos, −1 texto, 0:20 → 0:18" (ou "Ajustes nos clipes" quando mudou só o que está dentro deles). */
export function resumoMudancas(antes: Project | undefined, depois: Project): string {
  if (!antes) return `${contar(depois)} · ${tempo(projectDuration(depois) / FPS)}`
  const partes: string[] = []
  for (const kind of Object.keys(nomes) as TrackKind[]) {
    const a = antes.tracks.filter(t => t.kind === kind).reduce((n, t) => n + t.clips.length, 0)
    const d = depois.tracks.filter(t => t.kind === kind).reduce((n, t) => n + t.clips.length, 0)
    if (a !== d) partes.push(`${d > a ? '+' : '−'}${Math.abs(d - a)} ${nomes[kind][Math.abs(d - a) > 1 ? 1 : 0]}`)
  }
  const da = projectDuration(antes) / FPS, dd = projectDuration(depois) / FPS
  if (Math.round(da) !== Math.round(dd)) partes.push(`${tempo(da)} → ${tempo(dd)}`)
  if (antes.format !== depois.format) partes.push(`${antes.format} → ${depois.format}`)
  if (antes.name !== depois.name) partes.push('novo nome')
  if (partes.length) return partes.join(', ')
  return JSON.stringify(antes.tracks) === JSON.stringify(depois.tracks) && antes.background === depois.background && JSON.stringify(antes.watermark) === JSON.stringify(depois.watermark)
    ? 'Igual à versão anterior' : 'Ajustes nos clipes'
}

function contar(p: Project) {
  const n = p.tracks.reduce((acc, t) => acc + t.clips.length, 0)
  return `${n} clipe${n === 1 ? '' : 's'}`
}

/** Um quadro pequeno do começo do vídeo: o primeiro vídeo ou imagem que aparece (null se não houver). */
export async function capaDoProjeto(p: Project): Promise<string | null> {
  const visiveis = p.tracks.filter(t => (t.kind === 'video' || t.kind === 'imagem') && !t.hidden).flatMap(t => t.clips.map(c => ({ c, kind: t.kind })))
  const primeiro = visiveis.sort((a, b) => a.c.start - b.c.start)[0]
  const fileId = primeiro?.c.props.fileId
  if (!fileId || !media(fileId)) return null
  const url = await mediaUrl(fileId)
  if (!url) return null
  if (primeiro.kind === 'video') return quadroUnico(fileId, url, primeiro.c.trimStart / FPS)
  const { width, height } = canvasSize[p.format]
  return new Promise(resolve => {
    const img = new Image()
    if (!url.startsWith('blob:')) img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        const c = document.createElement('canvas'); c.height = 96; c.width = Math.round(96 * width / height)
        const r = Math.max(c.width / img.width, c.height / img.height)
        c.getContext('2d')!.drawImage(img, (c.width - img.width * r) / 2, (c.height - img.height * r) / 2, img.width * r, img.height * r)
        resolve(c.toDataURL('image/jpeg', 0.6))
      } catch { resolve(null) }
    }
    img.onerror = () => resolve(null)
    img.src = url
  })
}

export const rotuloTipo: Record<TipoVersao, string> = { manual: 'Salva', auto: 'Automática', antes: 'Automática', exportacao: 'Exportação', restauracao: 'Restaurada' }

/** "Hoje", "Ontem" ou "28 de novembro" (para agrupar o histórico). */
export function rotuloDia(at: string, agora = new Date()) {
  const dia = at.slice(0, 10)
  const hoje = new Date(agora.getTime() - agora.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
  const ontem = new Date(agora.getTime() - agora.getTimezoneOffset() * 60000 - 86400000).toISOString().slice(0, 10)
  if (dia === hoje) return 'Hoje'
  if (dia === ontem) return 'Ontem'
  return new Date(`${dia}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', ...(dia.slice(0, 4) !== hoje.slice(0, 4) ? { year: 'numeric' } : {}) })
}

export function agruparPorDia(lista: Version[]) {
  const grupos: { dia: string; versoes: Version[] }[] = []
  for (const v of lista) {
    const dia = rotuloDia(v.at)
    if (grupos.at(-1)?.dia === dia) grupos.at(-1)!.versoes.push(v); else grupos.push({ dia, versoes: [v] })
  }
  return grupos
}
