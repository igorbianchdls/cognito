// Pure presets shared by the editor and the assistant tools on the server (no browser state here).
import { FPS, type Box, type ClipProps, type Filter, type TrackKind } from './types'

export const fullBox: Box = { x: 0, y: 0, w: 100, h: 100 }
export const defaultBox: Record<TrackKind, Box> = {
  texto: { x: 8, y: 12, w: 84, h: 16 },
  legenda: { x: 6, y: 70, w: 88, h: 12 },
  forma: { x: 30, y: 40, w: 40, h: 20 },
  imagem: { x: 12, y: 28, w: 76, h: 40 },
  video: fullBox,
  audio: fullBox,
}

export const title = (text: string, extra: ClipProps = {}): ClipProps => ({ text, fontSize: 76, weight: 800, color: '#ffffff', align: 'center', anim: 'pop', box: defaultBox.texto, transOut: { type: 'fade', frames: 6 }, ...extra })
export const caption = (text: string): ClipProps => ({ text, captionStyle: 'amarela', box: defaultBox.legenda })

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

export const seconds = (sec: number) => Math.round(sec * FPS)
