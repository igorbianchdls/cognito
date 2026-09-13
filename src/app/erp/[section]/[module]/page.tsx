import ErpPage from '@/products/erp/frontend/pages/ErpPage'
import Link from 'next/link'
import type { ErpModuleId, ErpSectionId } from '@/products/erp/shared/types'
import { notFound, redirect } from 'next/navigation'
import { ERP_NAVIGATION } from '@/products/erp/shared/navigation'
import { isRetiredErpReport } from '@/products/erp/shared/reportCatalog'

export default async function ErpModuleRoute({
  params,
}: {
  params: Promise<{ section: string; module: string }>
}) {
  const { section, module } = await params
  if (isRetiredErpReport(module)) return <main className="mx-auto max-w-2xl p-10"><h1 className="text-2xl font-semibold">Relatório descontinuado</h1><p className="my-4">Este relatório foi retirado da operação.</p><Link className="underline" href="/erp">Abrir visão geral</Link><p className="mt-4"><Link className="underline" href="/erp/relatorios/posicao-financeira">Relatórios disponíveis</Link></p></main>
  if (section === 'relatorios' && module === 'automacoes') redirect('/erp/cadastros/automacoes')
  if (!ERP_NAVIGATION.some(item => item.id === section && item.modules.some(entry => entry.id === module))) notFound()

  return <ErpPage section={section as ErpSectionId} module={module as ErpModuleId} />
}
