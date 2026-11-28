import { PessoaView } from '@/products/analytics/frontend/PessoasView'

export default async function Page({ params }: { params: Promise<{ id: string }> }) { return <PessoaView id={decodeURIComponent((await params).id)} /> }
