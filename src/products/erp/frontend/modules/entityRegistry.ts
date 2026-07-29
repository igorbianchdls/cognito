import { cadastrosEntityConfigs } from '@/products/erp/frontend/modules/cadastros/cadastrosConfig'
import { comprasConfig } from '@/products/erp/frontend/modules/compras/comprasConfig'
import { financeiroEntityConfigs } from '@/products/erp/frontend/modules/financeiro/financeiroConfig'
import { vendasConfig } from '@/products/erp/frontend/modules/vendas/vendasConfig'
import type { ErpEntityConfig } from '@/products/erp/shared/types'

const entityConfigs = [
  ...cadastrosEntityConfigs,
  vendasConfig,
  comprasConfig,
  ...financeiroEntityConfigs,
]

export function getErpEntityConfig(sectionId?: string, moduleId?: string): ErpEntityConfig | undefined {
  return entityConfigs.find((config) => config.sectionId === sectionId && config.id === moduleId)
}
