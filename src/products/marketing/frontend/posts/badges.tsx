import { Instagram, Linkedin, Youtube } from 'lucide-react'
import type { Network, PostStatus } from './data'
import s from '@/products/editor/frontend/shell/ui.module.css'

export function TikTokIcon({ size = 14 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-2.59-2.59c.27 0 .53.04.77.12V9.77a5.68 5.68 0 1 0 4.91 5.63V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.28 4.28 0 0 1-3.24-1.48z" /></svg>
}

export function NetworkIcon({ network, size = 22 }: { network: Network; size?: number }) {
  const inner = Math.round(size * .6)
  const icon = network === 'instagram' ? <Instagram size={inner} /> : network === 'tiktok' ? <TikTokIcon size={inner} /> : network === 'linkedin' ? <Linkedin size={inner} /> : <Youtube size={inner} />
  return <span className={`${s.net} ${s[`net_${network}`]}`} style={{ width: size, height: size }} title={network}>{icon}</span>
}

export function StatusPill({ status }: { status: PostStatus }) {
  const label = { agendado: 'Agendado', publicado: 'Publicado', erro: 'Erro', rascunho: 'Rascunho' }[status]
  return <em className={`${s.pill} ${s[`pill_${status}`]}`} style={{ fontStyle: 'normal' }}>{label}</em>
}
