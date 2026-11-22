'use client'

// Exports an editor project to MP4 in the browser (Remotion's web renderer: WebCodecs + canvas).
// Nothing goes to a server: the file is made on this computer, then downloaded and, if asked, saved to the Drive.
import { canRenderMediaOnWeb, renderMediaOnWeb, type WebRendererQuality } from '@remotion/web-renderer'
import { EditorComposition } from '../remotion/Composition'
import { projectDuration } from '../project/ops'
import { preloadMediaUrls } from '../project/mediaUrls'
import { FPS, canvasSize, type Project } from '../project/types'

export type Resolution = '720p' | '1080p'
export type Quality = 'recomendada' | 'alta' | 'menor'
export type ExportSettings = { name: string; resolution: Resolution; quality: Quality }

const qualityMap: Record<Quality, WebRendererQuality> = { recomendada: 'high', alta: 'very-high', menor: 'medium' }
// Rough bits per second at 1080p, for the size estimate shown before exporting.
const bitrate1080: Record<Quality, number> = { recomendada: 8_000_000, alta: 14_000_000, menor: 4_000_000 }

/** The output size: the project's canvas (1080 on the short side), scaled down for 720p. */
export function outputSize(project: Project, resolution: Resolution) {
  const { width, height } = canvasSize[project.format]
  const scale = resolution === '720p' ? 720 / Math.min(width, height) : 1
  // Encoders want even sizes.
  const even = (n: number) => Math.round(n * scale / 2) * 2
  return { width, height, scale, outWidth: even(width), outHeight: even(height) }
}

/** About how big the file will be, in bytes (video + audio). */
export function estimateBytes(project: Project, s: Pick<ExportSettings, 'resolution' | 'quality'>) {
  const seconds = projectDuration(project) / FPS
  const factor = s.resolution === '720p' ? 0.5 : 1
  return Math.round(seconds * (bitrate1080[s.quality] * factor + 128_000) / 8)
}

export class ExportError extends Error {}

/** Why this browser can't export, in plain words, or null when it can. */
export async function exportBlocker(project: Project, resolution: Resolution): Promise<string | null> {
  if (typeof window === 'undefined' || !('VideoEncoder' in window)) {
    return 'Este navegador não consegue gerar vídeo. Use o Google Chrome ou o Microsoft Edge no computador.'
  }
  const { outWidth, outHeight } = outputSize(project, resolution)
  const check = await canRenderMediaOnWeb({ width: outWidth, height: outHeight, container: 'mp4' }).catch(() => null)
  if (!check) return null
  const error = check.issues.find(i => i.severity === 'error')
  if (!check.canRender || error) {
    return error?.type === 'video-codec-unsupported' || error?.type === 'webcodecs-unavailable'
      ? 'Este navegador não consegue gerar MP4. Use o Google Chrome ou o Microsoft Edge no computador.'
      : `Não dá para exportar neste navegador (${error?.message ?? 'motivo desconhecido'}).`
  }
  return null
}

export type ExportProgress = { progress: number; secondsLeft: number | null }

/**
 * Renders the whole project to an MP4 Blob. Reports progress (0–1) and, every few frames, a small preview of
 * the frame being made. Cancel with the signal.
 */
export async function exportProject(project: Project, settings: ExportSettings, opts: {
  signal: AbortSignal
  onProgress: (p: ExportProgress) => void
  onPreview?: (bitmap: ImageBitmap) => void
}): Promise<Blob> {
  const fileIds = [...project.tracks.flatMap(t => t.clips.map(c => c.props.fileId)), project.watermark?.fileId].filter((x): x is string => !!x)
  await preloadMediaUrls(fileIds)
  if (typeof document !== 'undefined' && document.fonts) await document.fonts.ready
  if (opts.signal.aborted) throw new DOMException('Cancelado', 'AbortError')

  const { width, height, scale } = outputSize(project, settings.resolution)
  let frameNo = 0
  const { getBlob } = await renderMediaOnWeb({
    composition: { id: 'otto-editor-export', component: EditorComposition, width, height, fps: FPS, durationInFrames: projectDuration(project), defaultProps: { project, exporting: true } },
    inputProps: { project, exporting: true },
    scale,
    container: 'mp4',
    videoBitrate: qualityMap[settings.quality],
    audioBitrate: 'high',
    signal: opts.signal,
    licenseKey: process.env.NEXT_PUBLIC_REMOTION_LICENSE_KEY || 'free-license',
    isProduction: process.env.NODE_ENV === 'production',
    logLevel: 'error',
    onProgress: p => opts.onProgress({ progress: Math.min(1, p.progress), secondsLeft: p.renderEstimatedTime > 0 ? Math.ceil(p.renderEstimatedTime / 1000) : null }),
    onFrame: opts.onPreview ? async frame => {
      if (frameNo++ % 10 === 0) {
        try { opts.onPreview?.(await createImageBitmap(frame, { resizeWidth: 240, resizeQuality: 'medium' })) } catch { /* preview only */ }
      }
      return frame
    } : null,
  })
  return getBlob()
}

/** Starts the download of the file in the browser. */
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  // Without accents: some browsers drop a download name with them and save the file as "download".
  a.download = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\x20-\x7e]/g, '_')
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

/** "Meu vídeo.mp4" from the name typed (no slashes or odd characters). */
export const fileName = (name: string) => `${(name.trim() || 'Vídeo').replace(/[\\/:*?"<>|]+/g, '-').slice(0, 80)}.mp4`
