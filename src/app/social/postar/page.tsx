import { Composer } from '@/products/social/frontend/posts/Composer'

export default async function PostarPage({ searchParams }: { searchParams: Promise<{ arquivos?: string; editar?: string }> }) {
  const { arquivos, editar } = await searchParams
  return <Composer key={editar ?? 'novo'} initialFiles={arquivos ? arquivos.split(',') : []} editId={editar} />
}
