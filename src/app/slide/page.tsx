import { SlideArtifactPage } from '@/products/artifacts/slide/SlideArtifactPage'
import { SLIDE_TEMPLATE_SOURCE } from '@/products/artifacts/slide/templates/slideTemplate'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function SlidePage() {
  return <SlideArtifactPage source={SLIDE_TEMPLATE_SOURCE} />
}
