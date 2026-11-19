// The video project: plain data that the timeline edits, the AI edits and Remotion draws.

export const FPS = 30

export type TrackKind = 'texto' | 'legenda' | 'forma' | 'imagem' | 'video' | 'audio'
export type Format = '9:16' | '1:1' | '16:9'
/** Position and size in % of the canvas, from the top-left corner. */
export type Box = { x: number; y: number; w: number; h: number }
export type TextAnim = 'surgir' | 'pop' | 'digitar' | 'pulsar' | 'balancar' | 'nenhuma'
export type CaptionStyle = 'amarela' | 'branca' | 'caixa'

export type FontId = 'geist' | 'bebas' | 'serif' | 'caveat' | 'mono'
/** A point in time, relative to the clip start, with the clip's motion at that moment. */
/** color and fontSize are optional: only keyframes that set them animate the text's color and size. */
export type Keyframe = { frame: number; dx: number; dy: number; scale: number; rotation: number; opacity: number; color?: string; fontSize?: number }
export type Motion = { dx: number; dy: number; scale: number; rotation: number; opacity: number }
export type TransitionType = 'fade' | 'deslizar' | 'zoom' | 'desfoque'
export type Transition = { type: TransitionType; frames: number }
/** Color adjustments for video and images. 1 is unchanged. */
/** Crop in % of each side. */
export type Crop = { t: number; r: number; b: number; l: number }
/** How media fills its box: cover, contain, or contain over a blurred copy of itself. */
export type Fit = 'preencher' | 'ajustar' | 'desfoque'
export type Watermark = { text?: string; fileId?: string; position: 'tl' | 'tr' | 'bl' | 'br'; opacity: number }
export type Ducking = { on: boolean; level: number }
export type Filter = { preset?: string; brightness: number; contrast: number; saturation: number; grayscale: number; sepia: number }

export type ClipProps = {
  fileId?: string
  font?: FontId
  keyframes?: Keyframe[]
  transIn?: Transition
  transOut?: Transition
  filter?: Filter
  fadeIn?: number
  fadeOut?: number
  stroke?: { color: string; width: number }
  shadow?: number
  crop?: Crop
  flipX?: boolean
  flipY?: boolean
  fit?: Fit
  text?: string
  fontSize?: number
  color?: string
  bg?: string
  weight?: 400 | 600 | 800
  align?: 'left' | 'center' | 'right'
  anim?: TextAnim
  shape?: 'retangulo' | 'circulo' | 'progresso'
  radius?: number
  box?: Box
  opacity?: number
  volume?: number
  captionStyle?: CaptionStyle
}

/** Times are in timeline frames, except trimStart, which is in frames of the media file. speed 2 plays the file twice as fast. */
export type Clip = { id: string; start: number; duration: number; trimStart: number; speed?: number; group?: string; props: ClipProps }
export type Track = { id: string; kind: TrackKind; clips: Clip[]; muted?: boolean; hidden?: boolean; locked?: boolean }
export type Project = { id: string; name: string; format: Format; background: string; tracks: Track[]; updatedAt: string; markers?: number[]; ducking?: Ducking; watermark?: Watermark }

export const canvasSize: Record<Format, { width: number; height: number }> = {
  '9:16': { width: 1080, height: 1920 },
  '1:1': { width: 1080, height: 1080 },
  '16:9': { width: 1920, height: 1080 },
}

export const kindLabel: Record<TrackKind, string> = { texto: 'Texto', legenda: 'Legenda', forma: 'Forma', imagem: 'Imagem', video: 'Vídeo', audio: 'Áudio' }
/** Top-to-bottom order of tracks when a new one is created. */
export const kindRank: Record<TrackKind, number> = { texto: 0, legenda: 1, forma: 2, imagem: 3, video: 4, audio: 5 }
export const visualKinds: TrackKind[] = ['texto', 'legenda', 'forma', 'imagem', 'video']
export const mediaKinds: TrackKind[] = ['video', 'audio']

/** Local date and time as YYYY-MM-DDTHH:mm. */
export const localStamp = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) }
