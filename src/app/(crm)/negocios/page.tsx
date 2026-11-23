import { Suspense } from 'react'
import { DealsView } from '@/products/inbox/frontend/DealsView'

export const metadata = { title: 'Negócios · Otto' }

export default function DealsPage() {
  return <Suspense><DealsView /></Suspense>
}
