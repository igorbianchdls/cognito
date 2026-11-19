import { Html5Video, Img, interpolate, useCurrentFrame, useVideoConfig } from 'remotion'
import { Video as MediaVideo } from '@remotion/media'
import { useExporting } from '../exporting'
import { Film, Image as ImageIcon } from 'lucide-react'
import { media } from '../../project/data'
import { FPS, type Clip } from '../../project/types'
import { filterCss } from '../animate'
import { useMediaUrl } from '../../project/mediaUrls'

const tones: Record<string, [string, string]> = {
  sand: ['#d8c3a3', '#6f5638'], blue: ['#a9b6c4', '#3e4d62'], rose: ['#d8a291', '#7c3a27'],
  green: ['#b4bf9c', '#4d5a38'], violet: ['#c3a6b4', '#5a3a4b'], amber: ['#ddbd82', '#7d5a1c'],
}
const clock = (frames: number) => { const sec = Math.floor(frames / FPS); return `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}` }

/**
 * The clip's file from Spaces (video or image), sized by fit (fill, fit, fit over blur), crop and flip.
 * Sample files and files still loading get a stand-in: gradient, name and the file timecode.
 */
export function MediaBlock({ clip, video }: { clip: Clip; video?: boolean }) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const m = media(clip.props.fileId)
  const p = clip.props
  const box = p.box ?? { x: 0, y: 0, w: 100, h: 100 }
  const bw = box.w / 100 * width, bh = box.h / 100 * height
  const ratio = m?.width && m?.height ? m.width / m.height : bw / bh
  const cover = ratio > bw / bh ? { w: bh * ratio, h: bh } : { w: bw, h: bw / ratio }
  const contain = ratio > bw / bh ? { w: bw, h: bw / ratio } : { w: bh * ratio, h: bh }
  const fit = p.fit ?? 'preencher'
  const crop = p.crop
  const flip = `scale(${p.flipX ? -1 : 1}, ${p.flipY ? -1 : 1})`
  const content = (size: { w: number; h: number }, blurred = false) => <Content clip={clip} video={video} frame={frame} size={size} blurred={blurred} flip={flip} />
  return <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: video ? 0 : 28, filter: filterCss(p.filter), clipPath: crop ? `inset(${crop.t}% ${crop.r}% ${crop.b}% ${crop.l}%)` : undefined }}>
    {fit === 'desfoque' && content(cover, true)}
    {content(fit === 'preencher' ? cover : contain)}
    {!m && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#fff' }}>Arquivo</div>}
  </div>
}

function Content({ clip, video, frame, size, blurred, flip }: { clip: Clip; video?: boolean; frame: number; size: { w: number; h: number }; blurred: boolean; flip: string }) {
  const m = media(clip.props.fileId)
  const url = useMediaUrl(clip.props.fileId)
  const exporting = useExporting()
  const box = { position: 'absolute', left: '50%', top: '50%', width: size.w, height: size.h, transform: `translate(-50%, -50%) ${flip}`, overflow: 'hidden', filter: blurred ? 'blur(40px) brightness(.75)' : undefined } as const
  const fill = { width: '100%', height: '100%', objectFit: 'fill' } as const
  if (url && video && exporting) return <div style={box}><MediaVideo src={url} trimBefore={clip.trimStart} playbackRate={clip.speed ?? 1} muted={blurred} volume={clip.props.volume ?? 1} objectFit="fill" style={{ width: '100%', height: '100%' }} /></div>
  if (url && video) return <div style={box}><Html5Video src={url} trimBefore={clip.trimStart} playbackRate={clip.speed ?? 1} muted={blurred} volume={clip.props.volume ?? 1} style={fill} pauseWhenBuffering /></div>
  if (url) return <div style={box}><Img src={url} style={fill} /></div>
  const [a, b] = tones[m?.tone ?? 'blue'] ?? tones.blue
  const speed = clip.speed ?? 1
  const zoom = interpolate(frame, [0, clip.duration], [1, 1.08])
  const Icon = video ? Film : ImageIcon
  return <div style={{ position: 'absolute', left: '50%', top: '50%', width: size.w, height: size.h, transform: `translate(-50%, -50%) ${flip}`, overflow: 'hidden', filter: blurred ? 'blur(40px) brightness(.75)' : undefined }}>
    <div style={{ position: 'absolute', inset: 0, background: exporting ? `linear-gradient(160deg, ${a}, ${b} 80%)` : `radial-gradient(circle at 30% 20%, ${a}, ${b} 75%)`, transform: `scale(${zoom})` }} />
    {!blurred && <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 18, color: 'rgba(255,255,255,.9)', textAlign: 'center', padding: 40 }}>
      <Icon size={video ? 120 : 90} strokeWidth={1.2} />
      <div style={{ fontSize: video ? 40 : 34, fontWeight: 600, maxWidth: '90%' }}>{m?.name ?? 'Arquivo'}</div>
      {video && <div style={{ fontSize: 30, padding: '6px 16px', borderRadius: 999, background: 'rgba(0,0,0,.28)', fontVariantNumeric: 'tabular-nums' }}>{clock(clip.trimStart + Math.round(frame * speed))}{speed !== 1 ? ` · ${speed}x` : ''}</div>}
    </div>}
  </div>
}
