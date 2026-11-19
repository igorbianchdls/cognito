import { DriveView } from '@/products/editor/frontend/spaces/drive/DriveView'

export default async function FolderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ arquivo?: string }> }) {
  const { id } = await params
  const { arquivo } = await searchParams
  return <DriveView key={id} folderId={id} openFileId={arquivo} />
}
