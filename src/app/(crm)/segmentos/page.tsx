import { Suspense } from 'react'
import { SegmentsView } from '@/products/inbox/frontend/SegmentsView'

export const metadata = { title: 'Segmentos · Otto' }

export default function SegmentsPage() {
  return <Suspense><SegmentsView /></Suspense>
}
