'use client'

import { FileText, Film, Image as ImageIcon, Music } from 'lucide-react'
import { formatDuration } from '@/products/editor/frontend/lib/format'
import { useFileUrl } from './hooks'
import type { DFile } from './store'
import s from '@/products/editor/frontend/shell/ui.module.css'

const icons = { video: Film, image: ImageIcon, audio: Music, text: FileText }

/** Real preview for uploaded images and videos; a colored placeholder for sample files. */
export function Thumb({ file, className, showKind = true }: { file: DFile; className?: string; showKind?: boolean }) {
  const got = useFileUrl(file, !!file.uploaded && (file.kind === 'image' || file.kind === 'video'), true)
  const url = got?.url
  // A saved thumbnail is a picture even for videos.
  const asImage = file.kind === 'image' || !!got?.thumb
  const Icon = icons[file.kind]
  const ext = file.name.split('.').pop()
  return <span className={`${s.thumb} ${file.kind === 'text' ? s.thumbText : s[`thumb_${file.tone}`]} ${className ?? ''}`} role="img" aria-label={file.name}>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    {url && asImage && <img src={url} alt="" className={s.thumbMedia} />}
    {url && !asImage && file.kind === 'video' && <video src={`${url}#t=0.1`} muted playsInline preload="metadata" className={s.thumbMedia} />}
    {!url && <Icon size={26} strokeWidth={1.5} />}
    {showKind && <i className={s.thumbKind}>{ext}</i>}
    {file.duration !== undefined && <i className={s.thumbBadge}>{formatDuration(file.duration)}</i>}
  </span>
}
