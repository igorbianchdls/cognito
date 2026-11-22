import { DriveView } from '@/products/drive/frontend/views/DriveView'

export default async function DrivePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ arquivo?: string }> }) {
  const { id } = await params
  const { arquivo } = await searchParams
  return <DriveView key={id} driveId={id} folderId={null} openFileId={arquivo} />
}
