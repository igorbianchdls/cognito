// Sample projects and media until projects are stored in Supabase (phase 2).
import { files } from '@/products/editor/frontend/spaces/data'
import { getDrive, liveFiles, type Drive } from '@/products/editor/frontend/spaces/store'
import { FPS, localStamp, type Clip, type ClipProps, type Project, type Track, type TrackKind } from './types'
import { caption, defaultBox, fullBox, title } from './presets'
import { setMediaDuration } from './ops'

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
/** Seconds of a media file, for the timeline limits in ops.ts. */
setMediaDuration(id => media(id)?.duration)
const fileId = (name: string) => files.find(f => f.name === name)!.id

export { caption, defaultBox, filterPresets, fullBox, neutralFilter, shapePresets, speeds, stickerProps, stickers, textPresets, title } from './presets'

let n = 0
const s = (sec: number) => Math.round(sec * FPS)
const clip = (start: number, duration: number, props: ClipProps, trimStart = 0): Clip => ({ id: `s${++n}`, start: s(start), duration: s(duration), trimStart: s(trimStart), props })
const track = (kind: TrackKind, clips: Clip[]): Track => ({ id: `t${++n}`, kind, clips })

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
