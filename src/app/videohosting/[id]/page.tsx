import { VideoView } from '@/products/videohosting/frontend/VideoView'

export default async function VideohostingVideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <VideoView key={id} id={id} />
}
