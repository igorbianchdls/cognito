import { EditorView } from '@/products/editor/frontend/editor/EditorView'
import { blankProject, sampleProjects } from '@/products/editor/frontend/editor/project/data'
import { fromTemplate } from '@/products/editor/frontend/editor/project/templates'

export default async function EditorProjectPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ arquivos?: string; modelo?: string }> }) {
  const { id } = await params
  const { arquivos, modelo } = await searchParams
  const initial = sampleProjects.find(p => p.id === id) ?? (modelo ? fromTemplate(id, modelo) : null) ?? blankProject(id, arquivos ? arquivos.split(',') : [])
  const isSample = sampleProjects.some(p => p.id === id) || !!modelo
  return <EditorView key={id} initial={initial} fileIds={!isSample && arquivos ? arquivos.split(',') : undefined} />
}
