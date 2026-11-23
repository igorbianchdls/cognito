import { Suspense } from 'react'
import { BroadcastsView } from '@/products/inbox/frontend/BroadcastsView'

export const metadata = { title: 'Disparos · Otto' }

export default function BroadcastsPage() {
  return <Suspense><BroadcastsView /></Suspense>
}
