import { PainelView } from '@/products/analytics/frontend/InsightsView'

export default async function Page({ params }: { params: Promise<{ id: string }> }) { return <PainelView id={(await params).id} /> }
