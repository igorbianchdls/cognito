import ErpPage from '@/products/erp/frontend/pages/ErpPage'
import type { ErpModuleId, ErpSectionId } from '@/products/erp/shared/types'

export default async function ErpModuleRoute({
  params,
}: {
  params: Promise<{ section: string; module: string }>
}) {
  const { section, module } = await params

  return <ErpPage section={section as ErpSectionId} module={module as ErpModuleId} />
}

