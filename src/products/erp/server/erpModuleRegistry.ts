import type { ErpModuleId } from '@/products/erp/shared/types'
import type { ErpCapability } from '@/products/erp/shared/professionalContracts'

export type ErpConnectedModuleId = Extract<
  ErpModuleId,
  | 'clientes'
  | 'fornecedores'
  | 'vendedores'
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
    || value === 'vendedores'
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

const ERP_MODULE_CAPABILITIES: Record<
  ErpConnectedModuleId,
  { read: ErpCapability; manage: ErpCapability }
> = {
  clientes: { read: 'erp.cadastros.visualizar', manage: 'erp.cadastros.gerenciar' },
  fornecedores: { read: 'erp.cadastros.visualizar', manage: 'erp.cadastros.gerenciar' },
  vendedores: { read: 'erp.cadastros.visualizar', manage: 'erp.cadastros.gerenciar' },
  produtos: { read: 'erp.cadastros.visualizar', manage: 'erp.cadastros.gerenciar' },
  servicos: { read: 'erp.cadastros.visualizar', manage: 'erp.cadastros.gerenciar' },
  categorias: { read: 'erp.cadastros.visualizar', manage: 'erp.cadastros.gerenciar' },
  pedidos: { read: 'erp.vendas.visualizar', manage: 'erp.vendas.gerenciar' },
  'pedidos-compra': { read: 'erp.compras.visualizar', manage: 'erp.compras.gerenciar' },
  'contas-a-receber': { read: 'erp.financeiro.visualizar', manage: 'erp.financeiro.gerenciar' },
  'contas-a-pagar': { read: 'erp.financeiro.visualizar', manage: 'erp.financeiro.gerenciar' },
  'contas-financeiras': { read: 'erp.financeiro.visualizar', manage: 'erp.configuracoes.gerenciar' },
}

export function getErpModuleCapability(entityId: ErpConnectedModuleId, access: 'read' | 'manage') {
  return ERP_MODULE_CAPABILITIES[entityId][access]
}
