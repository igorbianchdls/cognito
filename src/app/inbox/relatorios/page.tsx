import { Suspense } from 'react'
import { ReportsView } from '@/products/inbox/frontend/ReportsView'

export const metadata = { title: 'Relatórios · Inbox · Otto' }

export default function ReportsPage() {
  return <Suspense><ReportsView /></Suspense>
}
