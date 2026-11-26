import { PaginaView } from '@/products/notas/frontend/PaginaView'

export default async function NotasPaginaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <PaginaView key={id} id={id} />
}
