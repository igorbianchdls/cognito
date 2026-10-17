import type { Metadata } from 'next'
import PublicAppPage from '@/products/apps/frontend/PublicAppPage'

export const metadata: Metadata = { title: 'App', robots: { index: false, follow: false } }
export default async function PublicAppRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <PublicAppPage slug={slug} />
}
