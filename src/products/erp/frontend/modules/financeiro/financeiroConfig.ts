import type { ErpEntityConfig, ErpEntityRecord } from '@/products/erp/shared/types'

const financialStatusMap = {
  aberto: { label: 'Aberto', tone: 'warning' },
  parcial: { label: 'Parcial', tone: 'warning' },
  pago: { label: 'Pago', tone: 'success' },
  cancelado: { label: 'Cancelado', tone: 'danger' },
  vencido: { label: 'Vencido', tone: 'danger' },
} satisfies ErpEntityConfig['statusMap']

export const receivablesConfig: ErpEntityConfig<ErpEntityRecord> = {
  id: 'contas-a-receber',
  sectionId: 'financeiro',
  label: 'Contas a receber',
  singularLabel: 'conta a receber',
  description: 'Acompanhe titulos gerados por vendas e registre baixas totais ou parciais.',
  route: '/erp/financeiro/contas-a-receber',
  searchPlaceholder: 'Buscar por descricao, documento, cliente ou status',
  primaryActionLabel: 'Nova conta',
  columns: [
    { key: 'descricao', label: 'Descricao', width: 'min-w-[220px]' },
    { key: 'cliente', label: 'Cliente', width: 'min-w-[200px]' },
    { key: 'vencimento', label: 'Vencimento', kind: 'date' },
    { key: 'valor', label: 'Valor', kind: 'currency' },
    { key: 'valor_pago', label: 'Pago', kind: 'currency' },
    { key: 'status', label: 'Status', kind: 'status' },
  ],
  fields: [],
  filters: [
    {
      key: 'status',
      label: 'Status',
      allLabel: 'Todos os status',
      options: [
        { value: 'aberto', label: 'Aberto' },
        { value: 'parcial', label: 'Parcial' },
        { value: 'pago', label: 'Pago' },
        { value: 'vencido', label: 'Vencido' },
      ],
    },
  ],
  metrics: [
    { label: 'A receber', value: 'R$ 0,00', detail: 'titulos abertos', tone: 'warning' },
    { label: 'Recebido', value: 'R$ 0,00', detail: 'baixas registradas', tone: 'success' },
    { label: 'Vencidos', value: '0', detail: 'acompanhar cobranca', tone: 'danger' },
  ],
  emptyState: {
    title: 'Nenhuma conta a receber encontrada',
    description: 'Confirme uma venda para gerar o primeiro titulo.',
  },
  actions: [
    { id: 'baixar', label: 'Baixar', tone: 'success', confirmMessage: 'Registrar baixa nesta conta a receber?' },
  ],
  statusMap: financialStatusMap,
}

export const payablesConfig: ErpEntityConfig<ErpEntityRecord> = {
  id: 'contas-a-pagar',
  sectionId: 'financeiro',
  label: 'Contas a pagar',
  singularLabel: 'conta a pagar',
  description: 'Acompanhe compromissos gerados por compras e registre pagamentos.',
  route: '/erp/financeiro/contas-a-pagar',
  searchPlaceholder: 'Buscar por descricao, documento, fornecedor ou status',
  primaryActionLabel: 'Nova conta',
  columns: [
    { key: 'descricao', label: 'Descricao', width: 'min-w-[220px]' },
    { key: 'fornecedor', label: 'Fornecedor', width: 'min-w-[200px]' },
    { key: 'vencimento', label: 'Vencimento', kind: 'date' },
    { key: 'valor', label: 'Valor', kind: 'currency' },
    { key: 'valor_pago', label: 'Pago', kind: 'currency' },
    { key: 'status', label: 'Status', kind: 'status' },
  ],
  fields: [],
  filters: [
    {
      key: 'status',
      label: 'Status',
      allLabel: 'Todos os status',
      options: [
        { value: 'aberto', label: 'Aberto' },
        { value: 'parcial', label: 'Parcial' },
        { value: 'pago', label: 'Pago' },
        { value: 'vencido', label: 'Vencido' },
      ],
    },
  ],
  metrics: [
    { label: 'A pagar', value: 'R$ 0,00', detail: 'titulos abertos', tone: 'warning' },
    { label: 'Pago', value: 'R$ 0,00', detail: 'baixas registradas', tone: 'success' },
    { label: 'Vencidos', value: '0', detail: 'acompanhar caixa', tone: 'danger' },
  ],
  emptyState: {
    title: 'Nenhuma conta a pagar encontrada',
    description: 'Confirme uma compra para gerar o primeiro compromisso.',
  },
  actions: [
    { id: 'baixar', label: 'Baixar', tone: 'success', confirmMessage: 'Registrar baixa nesta conta a pagar?' },
  ],
  statusMap: financialStatusMap,
}

export const financeiroEntityConfigs = [receivablesConfig, payablesConfig]
