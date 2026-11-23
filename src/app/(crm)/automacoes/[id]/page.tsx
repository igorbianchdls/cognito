import { FlowEditor } from '@/products/inbox/frontend/FlowEditor'

export const metadata = { title: 'Automação · Otto' }

export default async function FlowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <FlowEditor flowId={id} />
}
