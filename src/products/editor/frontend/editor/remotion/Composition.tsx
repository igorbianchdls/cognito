'use client'

import { AbsoluteFill, Html5Audio, Sequence, useCurrentFrame, useVideoConfig } from 'remotion'
import { Audio as MediaAudio } from '@remotion/media'
import { volumeAt } from '../project/audio'
import { useMediaUrl } from '../project/mediaUrls'
import type { Clip, Project, TrackKind } from '../project/types'
import { fonts, layerStyle } from './animate'
import { CaptionBlock } from './blocks/CaptionBlock'
import { MediaBlock } from './blocks/MediaBlock'
import { ShapeBlock } from './blocks/ShapeBlock'
import { TextBlock } from './blocks/TextBlock'
import { Watermark } from './blocks/Watermark'
import { ExportingContext, useExporting } from './exporting'

/** exporting: rendering to a file (see ExportingContext). */
export type CompositionProps = { project: Project; exporting?: boolean }

/** Draws the whole project. The last track is the bottom layer, like in the timeline. */
export function EditorComposition({ project, exporting = false }: CompositionProps) {
  return <ExportingContext.Provider value={exporting}><AbsoluteFill style={{ background: project.background, fontFamily: fonts.geist.family, overflow: 'hidden' }}>
    {[...project.tracks].reverse().filter(t => !t.hidden && t.kind !== 'audio').map(t => t.clips.map(c =>
      <Sequence key={c.id} from={c.start} durationInFrames={c.duration} layout="none"><Layer kind={t.kind} clip={c} /></Sequence>))}
    {project.tracks.filter(t => t.kind === 'audio' && !t.muted).map(t => t.clips.map(c =>
      <Sequence key={c.id} from={c.start} durationInFrames={c.duration} layout="none"><AudioClip project={project} clip={c} /></Sequence>))}
    {project.watermark && (project.watermark.text || project.watermark.fileId) && <Watermark mark={project.watermark} />}
  </AbsoluteFill></ExportingContext.Provider>
}

/** Places the clip in its box and applies keyframes, transitions and opacity. */
function Layer({ kind, clip }: { kind: TrackKind; clip: Clip }) {
  const frame = useCurrentFrame()
  const { width, height } = useVideoConfig()
  const b = clip.props.box ?? { x: 0, y: 0, w: 100, h: 100 }
  return <div style={{ position: 'absolute', left: `${b.x}%`, top: `${b.y}%`, width: `${b.w}%`, height: `${b.h}%`, ...layerStyle(clip, frame, width, height) }}>
    {kind === 'video' ? <MediaBlock clip={clip} video /> : kind === 'imagem' ? <MediaBlock clip={clip} /> : kind === 'texto' ? <TextBlock clip={clip} /> : kind === 'legenda' ? <CaptionBlock clip={clip} /> : <ShapeBlock clip={clip} />}
  </div>
}

/** Plays an audio file from Spaces, with its trim, speed, fades and ducking. Library tracks have no file yet. */
function AudioClip({ project, clip }: { project: Project; clip: Clip }) {
  const url = useMediaUrl(clip.props.fileId)
  const exporting = useExporting()
  if (!url) return null
  if (exporting) return <MediaAudio src={url} trimBefore={clip.trimStart} playbackRate={clip.speed ?? 1} volume={f => volumeAt(project, clip, f)} />
  return <Html5Audio src={url} trimBefore={clip.trimStart} playbackRate={clip.speed ?? 1} volume={f => volumeAt(project, clip, f)} pauseWhenBuffering />
}
