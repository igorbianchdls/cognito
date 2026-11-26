import { notFound } from 'next/navigation'
import { PaginaPublica } from '@/products/notas/frontend/PaginaPublica'
import { lerPaginaPublica } from '@/products/notas/server/publico'

export const dynamic = 'force-dynamic'
export const metadata = { robots: { index: false, follow: false } }

/** Página das Notas publicada na web (só leitura, sem login). */
export default async function NotaPublica({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const dados = await lerPaginaPublica(token).catch(() => null)
  if (!dados) notFound()
  return <PaginaPublica dados={dados} token={token} />
}
