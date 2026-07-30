import type { ErpModuleId } from '@/products/erp/shared/types'

export type ErpConnectedModuleId = Extract<
  ErpModuleId,
  | 'clientes'
  | 'fornecedores'
  | 'produtos'
  | 'servicos'
  | 'categorias'
  | 'pedidos'
  | 'pedidos-compra'
  | 'contas-a-receber'
  | 'contas-a-pagar'
  | 'contas-financeiras'
>

export function isErpConnectedModuleId(value: string): value is ErpConnectedModuleId {
  return (
    value === 'clientes'
    || value === 'fornecedores'
    || value === 'produtos'
    || value === 'servicos'
    || value === 'categorias'
    || value === 'pedidos'
    || value === 'pedidos-compra'
    || value === 'contas-a-receber'
    || value === 'contas-a-pagar'
    || value === 'contas-financeiras'
  )
}
