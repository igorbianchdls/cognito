import type { ErpEntityConfig, ErpEntityRecord } from '@/products/erp/shared/types'

export const vendasConfig: ErpEntityConfig<ErpEntityRecord> = {
  id: 'pedidos',
  sectionId: 'vendas',
  label: 'Pedidos de venda',
  singularLabel: 'pedido de venda',
  description: 'Crie vendas em rascunho, confirme para gerar contas a receber e acompanhe o status.',
  route: '/erp/vendas/pedidos',
  searchPlaceholder: 'Buscar por numero, cliente ou status',
  primaryActionLabel: 'Nova venda',
  columns: [
    { key: 'numero', label: 'Numero', width: 'min-w-[120px]' },
    { key: 'cliente', label: 'Cliente', width: 'min-w-[220px]' },
    { key: 'data', label: 'Data', kind: 'date' },
    { key: 'total', label: 'Total', kind: 'currency' },
    { key: 'status', label: 'Status', kind: 'status' },
  ],
  fields: [
    { key: 'cliente_id', label: 'Cliente', type: 'number', placeholder: 'ID do cliente', required: true },
    { key: 'produto_id', label: 'Produto', type: 'number', placeholder: 'ID do produto', required: true },
    { key: 'descricao', label: 'Descricao do item', type: 'text', placeholder: 'Descricao que aparecera no pedido' },
    { key: 'quantidade', label: 'Quantidade', type: 'number', placeholder: '1', required: true },
    { key: 'valor_unitario', label: 'Valor unitario', type: 'number', placeholder: '0,00', required: true },
    { key: 'data_venda', label: 'Data da venda', type: 'date' },
    { key: 'data_vencimento', label: 'Vencimento', type: 'date' },
  ],
  filters: [
    {
      key: 'status',
      label: 'Status',
      allLabel: 'Todos os status',
      options: [
        { value: 'rascunho', label: 'Rascunho' },
        { value: 'confirmada', label: 'Confirmada' },
        { value: 'cancelada', label: 'Cancelada' },
      ],
    },
  ],
  metrics: [
    { label: 'Vendas', value: '0', detail: 'base conectada' },
    { label: 'Confirmadas', value: '0', detail: 'geram contas a receber', tone: 'success' },
    { label: 'Rascunhos', value: '0', detail: 'aguardando confirmacao', tone: 'warning' },
  ],
  emptyState: {
    title: 'Nenhuma venda encontrada',
    description: 'Crie uma venda simples para confirmar e gerar financeiro.',
  },
  actions: [
    { id: 'confirmar', label: 'Confirmar', tone: 'success', confirmMessage: 'Confirmar esta venda e gerar contas a receber?' },
    { id: 'atender', label: 'Atender', tone: 'success', confirmMessage: 'Atender esta venda e efetivar a saida do estoque?' },
    { id: 'cancelar', label: 'Cancelar', tone: 'danger', confirmMessage: 'Cancelar esta venda?' },
  ],
  statusMap: {
    rascunho: { label: 'Rascunho', tone: 'warning' },
    confirmada: { label: 'Confirmada', tone: 'success' },
    cancelada: { label: 'Cancelada', tone: 'danger' },
  },
}
