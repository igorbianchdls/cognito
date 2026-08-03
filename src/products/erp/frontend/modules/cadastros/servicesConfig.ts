import type { ErpEntityConfig, ErpEntityRecord } from '@/products/erp/shared/types'

export const servicesConfig: ErpEntityConfig<ErpEntityRecord> = {
  id: 'servicos',
  sectionId: 'cadastros',
  label: 'Servicos',
  singularLabel: 'servico',
  description: 'Cadastre servicos vendidos, precos, custos e classificacao comercial.',
  route: '/erp/cadastros/servicos',
  searchPlaceholder: 'Buscar por servico, codigo ou categoria',
  primaryActionLabel: 'Novo servico',
  columns: [
    { key: 'nome', label: 'Servico', width: 'min-w-[220px]' },
    { key: 'codigo', label: 'Codigo' },
    { key: 'categoria', label: 'Categoria' },
    { key: 'preco', label: 'Preco', kind: 'currency' },
    { key: 'custo', label: 'Custo', kind: 'currency' },
    { key: 'status', label: 'Status', kind: 'status' },
  ],
  fields: [
    { key: 'nome', label: 'Nome do servico', type: 'text', required: true },
    { key: 'codigo', label: 'Codigo', type: 'text', placeholder: 'Ex: SERV-001' },
    { key: 'descricao', label: 'Descricao', type: 'textarea' },
    { key: 'categoria', label: 'Categoria', type: 'select' },
    { key: 'preco', label: 'Preco', type: 'number', required: true },
    { key: 'custo', label: 'Custo', type: 'number' },
  ],
  filters: [
    { key: 'status', label: 'Status', allLabel: 'Todos os status', options: [{ value: 'ativo', label: 'Ativo' }, { value: 'pausado', label: 'Pausado' }] },
  ],
  metrics: [
    { label: 'Servicos ativos', value: '0', detail: 'catalogo conectado' },
    { label: 'Categorias', value: '0', detail: 'classificacao comercial' },
    { label: 'Preco medio', value: 'R$ 0,00', detail: 'servicos cadastrados' },
  ],
  emptyState: {
    title: 'Nenhum servico encontrado',
    description: 'Altere a busca ou cadastre um novo servico.',
  },
  statusMap: {
    ativo: { label: 'Ativo', tone: 'success' },
    pausado: { label: 'Pausado', tone: 'warning' },
  },
}
