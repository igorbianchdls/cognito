import { Image as ImageIcon } from 'lucide-react'
import { media } from '../../project/data'
import type { Watermark as Mark } from '../../project/types'

/** Logo or handle fixed in a corner for the whole video. */
export function Watermark({ mark }: { mark: Mark }) {
  const pos = { tl: { top: 48, left: 48 }, tr: { top: 48, right: 48 }, bl: { bottom: 48, left: 48 }, br: { bottom: 48, right: 48 } }[mark.position]
  const logo = media(mark.fileId)
  return <div style={{ position: 'absolute', ...pos, opacity: mark.opacity, display: 'flex', alignItems: 'center', gap: 14, color: '#fff', fontSize: 34, fontWeight: 700, textShadow: '0 2px 10px rgba(0,0,0,.5)' }}>
    {logo && <span style={{ width: 84, height: 84, borderRadius: 20, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.9)', color: '#111827' }}><ImageIcon size={40} /></span>}
    {mark.text}
  </div>
}
