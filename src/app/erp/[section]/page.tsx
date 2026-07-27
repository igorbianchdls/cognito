import { redirect } from 'next/navigation'

import { getErpSection } from '@/products/erp/shared/navigation'

export default async function ErpSectionRoute({
  params,
}: {
  params: Promise<{ section: string }>
}) {
  const { section } = await params
  const sectionConfig = getErpSection(section)

  if (sectionConfig.id === 'overview' || sectionConfig.modules.length === 0) {
    redirect('/erp')
  }

  redirect(sectionConfig.modules[0].href)
}

