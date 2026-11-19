// Starting points for a new project.
import { FPS, localStamp, type ClipProps, type Format, type Project, type Track } from './types'
import { defaultBox, stickerProps } from './data'

export type Template = { id: string; label: string; description: string; format: Format; seconds: number }

export const templates: Template[] = [
  { id: 'branco', label: 'Em branco', description: 'Comece do zero', format: '9:16', seconds: 0 },
  { id: 'reel15', label: 'Reel de 15s', description: 'Título, legendas, vídeo e trilha', format: '9:16', seconds: 15 },
  { id: 'story', label: 'Story', description: '10s com sticker e chamada', format: '9:16', seconds: 10 },
  { id: 'youtube', label: 'Vídeo 16:9', description: 'Para YouTube e LinkedIn', format: '16:9', seconds: 30 },
  { id: 'quadrado', label: 'Post quadrado', description: 'Feed 1:1 com título', format: '1:1', seconds: 8 },
]

// Ids come from the project id and a counter reset per template, so the server and the browser build the same
// project (an id from the clock made the page differ between them).
let seed = ''
let n = 0
const id = (p: string) => `${p}${seed}${++n}`
const f = (s: number) => Math.round(s * FPS)
const clip = (start: number, dur: number, props: ClipProps) => ({ id: id('c'), start: f(start), duration: f(dur), trimStart: 0, props })
const text = (t: string, extra: ClipProps = {}): ClipProps => ({ text: t, fontSize: 76, weight: 800, color: '#ffffff', align: 'center', anim: 'pop', box: defaultBox.texto, transOut: { type: 'fade', frames: 6 }, ...extra })
const placeholderVideo = (): ClipProps => ({ fileId: 'f15', box: { x: 0, y: 0, w: 100, h: 100 }, opacity: 1, volume: 1, fit: 'preencher' })

export function fromTemplate(projectId: string, templateId: string): Project | null {
  const t = templates.find(x => x.id === templateId)
  if (!t || t.id === 'branco') return null
  seed = projectId.replace(/[^a-z0-9]/gi, '').slice(-8)
  n = 0
  const tracks: Track[] = []
  const add = (kind: Track['kind'], clips: Track['clips']) => tracks.push({ id: id('t'), kind, clips })
  if (t.id === 'reel15') {
    add('texto', [clip(0, 3, text('Seu gancho aqui')), clip(12, 3, text('Comenta AQUI 👇', { color: '#111827', bg: '#facc15', anim: 'surgir', box: { x: 18, y: 42, w: 64, h: 10 } }))])
    add('legenda', [3, 6, 9].map(s => clip(s, 3, { text: 'Escreva a frase da legenda', captionStyle: 'amarela', box: defaultBox.legenda })))
    add('video', [clip(0, 15, placeholderVideo())])
    add('audio', [{ ...clip(0, 15, { fileId: 'a-lofi', volume: 0.35, fadeOut: f(1.5) }) }])
  }
  if (t.id === 'story') {
    add('texto', [clip(0, 10, stickerProps('👇')), clip(1, 9, text('Responde a enquete', { box: { x: 8, y: 18, w: 84, h: 12 } }))])
    add('video', [clip(0, 10, placeholderVideo())])
  }
  if (t.id === 'youtube') {
    add('texto', [clip(0, 4, text('Título do vídeo', { fontSize: 96, box: { x: 10, y: 38, w: 80, h: 24 } })), clip(5, 4, { text: 'Igor\nFundador da Otto', fontSize: 40, weight: 600, color: '#ffffff', bg: 'rgba(17,24,39,.82)', align: 'left', anim: 'nenhuma', transIn: { type: 'deslizar', frames: 10 }, box: { x: 5, y: 76, w: 40, h: 14 } })])
    add('video', [clip(0, 30, { fileId: 'f13', box: { x: 0, y: 0, w: 100, h: 100 }, opacity: 1, volume: 1, fit: 'preencher' })])
    add('audio', [clip(0, 30, { fileId: 'a-pop', volume: 0.2, fadeIn: f(1), fadeOut: f(2) })])
  }
  if (t.id === 'quadrado') {
    add('texto', [clip(0, 8, text('5 sinais de caixa apertado', { box: { x: 10, y: 38, w: 80, h: 24 } }))])
    add('forma', [clip(0, 8, { shape: 'retangulo', bg: '#111827', radius: 0, opacity: 0.55, box: { x: 0, y: 0, w: 100, h: 100 } })])
    add('imagem', [clip(0, 8, { fileId: 'f17', box: { x: 0, y: 0, w: 100, h: 100 }, opacity: 1, fit: 'preencher' })])
  }
  return { id: projectId, name: t.label, format: t.format, background: '#0b0d12', tracks, updatedAt: localStamp(), ducking: { on: true, level: 0.3 } }
}
