import type { ErpModuleId } from '@/products/erp/shared/types'

export type ErpConnectedModuleId = Extract<ErpModuleId, 'clientes' | 'fornecedores' | 'produtos' | 'categorias'>

export function isErpConnectedModuleId(value: string): value is ErpConnectedModuleId {
  return value === 'clientes' || value === 'fornecedores' || value === 'produtos' || value === 'categorias'
}
