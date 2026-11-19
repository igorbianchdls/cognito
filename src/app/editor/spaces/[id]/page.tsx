import { DriveView } from '@/products/editor/frontend/spaces/drive/DriveView'

export default async function SpacePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ arquivo?: string }> }) {
  const { id } = await params
  const { arquivo } = await searchParams
  return <DriveView key={id} spaceId={id} folderId={null} openFileId={arquivo} />
}
