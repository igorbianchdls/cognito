import type { Metadata } from 'next'
import PublicAppPage from '@/products/apps/frontend/PublicAppPage'
import { publicInfo } from '@/products/apps/server/access'

export const dynamic = 'force-dynamic'
type Props = { params: Promise<{ slug: string }> }

// Title, description and icon of the app for the browser tab and for link previews in chats.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const info = await publicInfo((await params).slug)
  if (!info) return { title: 'Link indisponível', robots: { index: false, follow: false } }
  const letter = (info.nome.trim()[0] ?? 'A').toUpperCase().replace(/[<>&"']/g, '')
  const icon = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${/^#[0-9a-fA-F]{6}$/.test(info.cor) ? info.cor : '#7259d6'}"/><text x="32" y="43" font-family="Arial,sans-serif" font-size="32" font-weight="700" text-anchor="middle" fill="#fff">${letter}</text></svg>`)}`
  const description = info.descricao || `${info.nome}: app compartilhado pelo link.`
  return { title: info.nome, description, icons: { icon }, robots: { index: false, follow: false }, openGraph: { title: info.nome, description, type: 'website' } }
}
export default async function PublicAppRoute({ params }: Props) {
  const { slug } = await params
  return <PublicAppPage slug={slug} />
}
