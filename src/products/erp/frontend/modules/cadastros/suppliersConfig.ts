import type { ErpEntityConfig, ErpEntityRecord } from '@/products/erp/shared/types'

export const suppliersConfig: ErpEntityConfig<ErpEntityRecord> = {
  id: 'fornecedores',
  sectionId: 'cadastros',
  label: 'Fornecedores',
  singularLabel: 'fornecedor',
  description: 'Organize fornecedores por categoria, contato e situacao operacional.',
  route: '/erp/cadastros/fornecedores',
  searchPlaceholder: 'Buscar por fornecedor, documento, email ou categoria',
  primaryActionLabel: 'Novo fornecedor',
  columns: [
    { key: 'nome', label: 'Fornecedor', width: 'min-w-[220px]' },
    { key: 'documento', label: 'Documento', width: 'min-w-[160px]' },
    { key: 'categoria', label: 'Categoria' },
    { key: 'email', label: 'Email', width: 'min-w-[220px]' },
    { key: 'cidade', label: 'Cidade' },
    { key: 'status', label: 'Status', kind: 'status' },
  ],
  fields: [
    { key: 'nome', label: 'Nome do fornecedor', type: 'text', required: true },
    { key: 'documento', label: 'CNPJ', type: 'text', required: true },
    { key: 'categoria', label: 'Categoria', type: 'select', options: [{ value: 'Distribuicao', label: 'Distribuicao' }, { value: 'Logistica', label: 'Logistica' }, { value: 'Insumos', label: 'Insumos' }] },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'cidade', label: 'Cidade', type: 'text' },
  ],
  filters: [
    { key: 'status', label: 'Status', allLabel: 'Todos os status', options: [{ value: 'ativo', label: 'Ativo' }, { value: 'analise', label: 'Em analise' }] },
    { key: 'categoria', label: 'Categoria', allLabel: 'Todas as categorias', options: [{ value: 'Distribuicao', label: 'Distribuicao' }, { value: 'Logistica', label: 'Logistica' }, { value: 'Insumos', label: 'Insumos' }] },
  ],
  metrics: [
    { label: 'Fornecedores ativos', value: '46', detail: '12 criticos' },
    { label: 'Lead time medio', value: '5,8 dias', detail: '-0,4 vs mes anterior', tone: 'success' },
    { label: 'Em homologacao', value: '3', detail: 'aguardando documentos', tone: 'warning' },
  ],
  emptyState: {
    title: 'Nenhum fornecedor encontrado',
    description: 'Revise os filtros ou crie um novo fornecedor.',
  },
  statusMap: {
    ativo: { label: 'Ativo', tone: 'success' },
    analise: { label: 'Em analise', tone: 'warning' },
  },
}

