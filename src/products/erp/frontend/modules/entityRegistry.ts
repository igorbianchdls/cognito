import { cadastrosEntityConfigs } from '@/products/erp/frontend/modules/cadastros/cadastrosConfig'
import type { ErpEntityConfig } from '@/products/erp/shared/types'

const entityConfigs = [...cadastrosEntityConfigs]

export function getErpEntityConfig(sectionId?: string, moduleId?: string): ErpEntityConfig | undefined {
  return entityConfigs.find((config) => config.sectionId === sectionId && config.id === moduleId)
}

