import { SlideArtifactPage } from '@/products/artifacts/slide/SlideArtifactPage'
import { SLIDE_PPTX_TEMPLATE_SOURCE } from '@/products/artifacts/slide/templates/slidePptxTemplate'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function SlidePage() {
  return <SlideArtifactPage source={SLIDE_PPTX_TEMPLATE_SOURCE} />
}
