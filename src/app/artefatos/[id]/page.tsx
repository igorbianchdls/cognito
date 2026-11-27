import { PaginaView } from '@/products/notas/frontend/PaginaView'

/** Um artefato aberto pela aba Artefatos (a mesma tela das Notas, com o caminho de volta para a galeria). */
export default async function ArtefatoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <PaginaView key={id} id={id} />
}
