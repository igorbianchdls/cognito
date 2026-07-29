import type { ErpEntityConfig, ErpEntityRecord } from '@/products/erp/shared/types'

export const comprasConfig: ErpEntityConfig<ErpEntityRecord> = {
  id: 'pedidos-compra',
  sectionId: 'compras',
  label: 'Pedidos de compra',
  singularLabel: 'pedido de compra',
  description: 'Registre compras, confirme para gerar contas a pagar e cancele antes de haver pagamento.',
  route: '/erp/compras/pedidos-compra',
  searchPlaceholder: 'Buscar por numero, fornecedor ou status',
  primaryActionLabel: 'Nova compra',
  columns: [
    { key: 'numero', label: 'Numero', width: 'min-w-[120px]' },
    { key: 'fornecedor', label: 'Fornecedor', width: 'min-w-[220px]' },
    { key: 'data', label: 'Data', kind: 'date' },
    { key: 'total', label: 'Total', kind: 'currency' },
    { key: 'gera_financeiro', label: 'Financeiro' },
    { key: 'status', label: 'Status', kind: 'status' },
  ],
  fields: [
    { key: 'fornecedor_id', label: 'Fornecedor', type: 'number', placeholder: 'ID do fornecedor', required: true },
    { key: 'produto_id', label: 'Produto', type: 'number', placeholder: 'ID do produto', required: true },
    { key: 'descricao', label: 'Descricao do item', type: 'text', placeholder: 'Descricao que aparecera no pedido' },
    { key: 'quantidade', label: 'Quantidade', type: 'number', placeholder: '1', required: true },
    { key: 'valor_unitario', label: 'Valor unitario', type: 'number', placeholder: '0,00', required: true },
    { key: 'data_compra', label: 'Data da compra', type: 'date' },
    { key: 'data_vencimento', label: 'Vencimento', type: 'date' },
    {
      key: 'gera_financeiro',
      label: 'Gerar financeiro',
      type: 'select',
      options: [
        { value: 'sim', label: 'Sim' },
        { value: 'nao', label: 'Nao' },
      ],
    },
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
    { label: 'Compras', value: '0', detail: 'base conectada' },
    { label: 'Confirmadas', value: '0', detail: 'geram contas a pagar', tone: 'success' },
    { label: 'Rascunhos', value: '0', detail: 'aguardando confirmacao', tone: 'warning' },
  ],
  emptyState: {
    title: 'Nenhuma compra encontrada',
    description: 'Crie uma compra simples para confirmar e gerar financeiro.',
  },
  actions: [
    { id: 'confirmar', label: 'Confirmar', tone: 'success', confirmMessage: 'Confirmar esta compra e gerar contas a pagar?' },
    { id: 'cancelar', label: 'Cancelar', tone: 'danger', confirmMessage: 'Cancelar esta compra?' },
  ],
  statusMap: {
    rascunho: { label: 'Rascunho', tone: 'warning' },
    confirmada: { label: 'Confirmada', tone: 'success' },
    recebida: { label: 'Recebida', tone: 'success' },
    cancelada: { label: 'Cancelada', tone: 'danger' },
  },
}
