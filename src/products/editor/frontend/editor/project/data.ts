// Sample projects and media until projects are stored in Supabase (phase 2).
import { files } from '@/products/editor/frontend/spaces/data'
import { getDrive, liveFiles, type Drive } from '@/products/editor/frontend/spaces/store'
import { FPS, localStamp, type Box, type Clip, type ClipProps, type Filter, type Project, type Track, type TrackKind } from './types'

/** role tells voice from music, so music can duck under the voice. */
export type MediaItem = { id: string; name: string; kind: 'video' | 'imagem' | 'audio'; duration?: number; tone: string; width?: number; height?: number; role?: 'voz' | 'musica' }

export const audioLibrary: MediaItem[] = [
  { id: 'a-lofi', name: 'Trilha — Lo-fi escritório.mp3', kind: 'audio', duration: 95, tone: 'green', role: 'musica' },
  { id: 'a-pop', name: 'Trilha — Pop animado.mp3', kind: 'audio', duration: 120, tone: 'green', role: 'musica' },
  { id: 'a-narr', name: 'Narração — nota fiscal.mp3', kind: 'audio', duration: 18, tone: 'green', role: 'voz' },
  { id: 'a-narr2', name: 'Narração — tour do hotel.mp3', kind: 'audio', duration: 12, tone: 'green', role: 'voz' },
]

/** Files from the Spaces (live, not in the trash) plus the audio library. Rebuilt only when the Spaces change. */
let cache: { drive: Drive; list: MediaItem[] } | null = null
export function mediaLibrary(drive: Drive = getDrive()): MediaItem[] {
  if (cache?.drive === drive) return cache.list
  const list = [
    ...liveFiles(drive).filter(f => f.kind !== 'text').map(f => ({ id: f.id, name: f.name, kind: f.kind === 'video' ? 'video' as const : f.kind === 'audio' ? 'audio' as const : 'imagem' as const, duration: f.duration, tone: f.tone, width: f.width, height: f.height, role: f.kind === 'audio' ? 'voz' as const : undefined })),
    ...audioLibrary,
  ]
  cache = { drive, list }
  return list
}

export const media = (id?: string) => mediaLibrary().find(m => m.id === id)
const fileId = (name: string) => files.find(f => f.name === name)!.id

export const fullBox: Box = { x: 0, y: 0, w: 100, h: 100 }
export const defaultBox: Record<TrackKind, Box> = {
  texto: { x: 8, y: 12, w: 84, h: 16 },
  legenda: { x: 6, y: 70, w: 88, h: 12 },
  forma: { x: 30, y: 40, w: 40, h: 20 },
  imagem: { x: 12, y: 28, w: 76, h: 40 },
  video: fullBox,
  audio: fullBox,
}

let n = 0
const s = (sec: number) => Math.round(sec * FPS)
const clip = (start: number, duration: number, props: ClipProps, trimStart = 0): Clip => ({ id: `s${++n}`, start: s(start), duration: s(duration), trimStart: s(trimStart), props })
const track = (kind: TrackKind, clips: Clip[]): Track => ({ id: `t${++n}`, kind, clips })
const title = (text: string, extra: ClipProps = {}): ClipProps => ({ text, fontSize: 76, weight: 800, color: '#ffffff', align: 'center', anim: 'pop', box: defaultBox.texto, transOut: { type: 'fade', frames: 6 }, ...extra })
const caption = (text: string): ClipProps => ({ text, captionStyle: 'amarela', box: defaultBox.legenda })

export const sampleProjects: Project[] = [
  {
    id: 'nota-fiscal', name: 'Reel — Nota fiscal no ChatGPT', format: '9:16', background: '#0b0d12', updatedAt: '2026-11-01T18:20', ducking: { on: true, level: 0.3 }, markers: [90, 510],
    tracks: [
      track('texto', [
        clip(0, 3, title('Emite a nota sem sair do ChatGPT')),
        clip(17, 3, title('Comenta NOTA 👇', { color: '#111827', bg: '#facc15', anim: 'surgir', box: { x: 18, y: 42, w: 64, h: 10 } })),
      ]),
      track('legenda', [
        clip(3, 3.5, caption('Você ainda emite nota no portal da prefeitura?')),
        clip(6.5, 3, caption('Agora é só pedir pro ChatGPT')),
        clip(9.5, 3.5, caption('Ele preenche, confere e emite pra você')),
        clip(13, 4, caption('Em segundos, sem sair da conversa')),
      ]),
      track('imagem', [clip(14, 3, { fileId: fileId('Capa — Nota fiscal no ChatGPT.png'), box: defaultBox.imagem, opacity: 1 })]),
      track('video', [
        clip(0, 10, { fileId: fileId('Tela ChatGPT iPhone.mov'), box: fullBox, volume: 1, opacity: 1 }, 2),
        clip(10, 10, { fileId: fileId('Gravação apresentador 01.mov'), box: fullBox, volume: 1, opacity: 1 }, 30),
      ]),
      track('audio', [clip(0.5, 16.5, { fileId: 'a-narr', volume: 1 })]),
      track('audio', [clip(0, 20, { fileId: 'a-lofi', volume: 0.3 })]),
    ],
  },
  {
    id: 'lumen-tour', name: 'Lumen Hotel — tour do app', format: '9:16', background: '#0b0d12', updatedAt: '2026-10-30T11:05',
    tracks: [
      track('texto', [clip(0, 3, title('Seu hotel inteiro no celular'))]),
      track('legenda', [
        clip(3, 4, caption('Chegadas, saídas e ocupação do dia')),
        clip(7, 4, caption('Manutenção e governança no mesmo lugar')),
      ]),
      track('video', [clip(0, 14, { fileId: fileId('Lumen Hotel no celular.mp4'), box: fullBox, volume: 1, opacity: 1 })]),
      track('audio', [clip(0, 14, { fileId: 'a-pop', volume: 0.35 })]),
    ],
  },
]

export const blankProject = (id: string, fileIds: string[] = []): Project => {
  const tracks: Track[] = []
  const items = fileIds.map(media).filter((m): m is MediaItem => !!m && m.kind !== 'audio')
  if (items.length) {
    let at = 0
    const clips = items.map((m, i) => {
      const duration = m.kind === 'video' ? s(Math.min(m.duration ?? 5, 15)) : s(3)
      const c: Clip = { id: `c${i}${Date.now().toString(36)}`, start: at, duration, trimStart: 0, props: { fileId: m.id, box: fullBox, volume: 1, opacity: 1 } }
      at += duration
      return c
    })
    tracks.push({ id: `t${Date.now().toString(36)}`, kind: 'video', clips })
  }
  return { id, name: 'Sem título', format: '9:16', background: '#0b0d12', tracks, updatedAt: localStamp() }
}

export const textPresets: { label: string; props: ClipProps; kind: 'texto' | 'legenda'; seconds: number }[] = [
  { label: 'Título', kind: 'texto', seconds: 3, props: title('Seu título aqui') },
  { label: 'Subtítulo', kind: 'texto', seconds: 3, props: { text: 'Um subtítulo curto', fontSize: 48, weight: 600, color: '#ffffff', align: 'center', anim: 'surgir', box: { x: 10, y: 30, w: 80, h: 10 } } },
  { label: 'Chamada', kind: 'texto', seconds: 3, props: title('Comenta AQUI 👇', { color: '#111827', bg: '#facc15', anim: 'surgir', box: { x: 18, y: 42, w: 64, h: 10 } }) },
  { label: 'Digitando', kind: 'texto', seconds: 3, props: { text: 'Emite a nota da Maria', fontSize: 54, weight: 600, color: '#ffffff', bg: 'rgba(17,24,39,.75)', align: 'left', anim: 'digitar', box: { x: 8, y: 56, w: 84, h: 10 } } },
  { label: 'Legenda', kind: 'legenda', seconds: 3, props: caption('Escreva a frase da legenda') },
  { label: 'Manchete', kind: 'texto', seconds: 3, props: { text: 'NOTA FISCAL EM 10 SEGUNDOS', font: 'bebas', fontSize: 130, weight: 400, color: '#facc15', align: 'center', anim: 'pop', stroke: { color: '#111827', width: 6 }, shadow: 0.6, transOut: { type: 'zoom', frames: 8 }, box: { x: 6, y: 14, w: 88, h: 18 } } },
  { label: 'Nome e cargo', kind: 'texto', seconds: 4, props: { text: 'Igor\nFundador da Otto', fontSize: 46, weight: 600, color: '#ffffff', bg: 'rgba(17,24,39,.82)', align: 'left', anim: 'nenhuma', transIn: { type: 'deslizar', frames: 10 }, transOut: { type: 'fade', frames: 8 }, box: { x: 6, y: 74, w: 70, h: 10 } } },
  { label: 'Destaque', kind: 'texto', seconds: 3, props: { text: 'GRÁTIS', font: 'bebas', fontSize: 150, weight: 400, color: '#ffffff', align: 'center', anim: 'pulsar', stroke: { color: '#e5484d', width: 8 }, shadow: 0.8, transIn: { type: 'zoom', frames: 8 }, box: { x: 15, y: 40, w: 70, h: 14 } } },
]

export const stickers = ['🔥', '👇', '✅', '💰', '🚀', '❤️', '😱', '👀', '⭐', '📈', '💡', '🎯', '⚡', '🤯', '👏', '📌']
export const stickerProps = (emoji: string, anim: 'pulsar' | 'balancar' = 'pulsar'): ClipProps =>
  ({ text: emoji, fontSize: 200, weight: 400, align: 'center', anim, transIn: { type: 'zoom', frames: 8 }, box: { x: 35, y: 40, w: 30, h: 15 } })

/** full: lasts the whole video. */
export const shapePresets: { label: string; props: ClipProps; full?: boolean }[] = [
  { label: 'Retângulo', props: { transIn: { type: 'zoom', frames: 8 }, shape: 'retangulo', bg: '#3b82f6', radius: 24, opacity: 1, box: defaultBox.forma } },
  { label: 'Círculo', props: { transIn: { type: 'zoom', frames: 8 }, shape: 'circulo', bg: '#f43f5e', opacity: 1, box: { x: 35, y: 40, w: 30, h: 17 } } },
  { label: 'Faixa', props: { transIn: { type: 'fade', frames: 8 }, shape: 'retangulo', bg: '#111827', radius: 0, opacity: 0.7, box: { x: 0, y: 66, w: 100, h: 18 } } },
  { label: 'Barra de progresso', full: true, props: { shape: 'progresso', bg: '#facc15', opacity: 1, box: { x: 0, y: 0, w: 100, h: 1.2 } } },
]

export const neutralFilter: Filter = { brightness: 1, contrast: 1, saturation: 1, grayscale: 0, sepia: 0 }
export const filterPresets: { id: string; label: string; filter?: Filter }[] = [
  { id: 'nenhum', label: 'Nenhum' },
  { id: 'pb', label: 'P&B', filter: { ...neutralFilter, preset: 'pb', grayscale: 1, contrast: 1.1 } },
  { id: 'vivido', label: 'Vívido', filter: { ...neutralFilter, preset: 'vivido', saturation: 1.5, contrast: 1.1 } },
  { id: 'quente', label: 'Quente', filter: { ...neutralFilter, preset: 'quente', sepia: 0.25, saturation: 1.2, brightness: 1.05 } },
  { id: 'vintage', label: 'Vintage', filter: { ...neutralFilter, preset: 'vintage', sepia: 0.45, contrast: 0.9, brightness: 1.05, saturation: 0.8 } },
  { id: 'escuro', label: 'Escuro', filter: { ...neutralFilter, preset: 'escuro', brightness: 0.8, contrast: 1.2 } },
]
export const speeds = [0.5, 1, 1.5, 2, 3]
