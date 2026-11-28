import { InsightView } from '@/products/analytics/frontend/Construtor'

export default async function Page({ params }: { params: Promise<{ id: string }> }) { return <InsightView id={(await params).id} /> }
