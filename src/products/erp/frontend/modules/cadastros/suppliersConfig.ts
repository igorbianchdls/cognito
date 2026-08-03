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
    { key: 'categoria', label: 'Categoria', type: 'text', placeholder: 'Ex: Distribuicao, logistica ou insumos' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'cidade', label: 'Cidade', type: 'text' },
  ],
  filters: [
    { key: 'status', label: 'Status', allLabel: 'Todos os status', options: [{ value: 'ativo', label: 'Ativo' }, { value: 'inativo', label: 'Inativo' }] },
  ],
  metrics: [
    { label: 'Fornecedores ativos', value: '0', detail: 'base conectada' },
    { label: 'Categorias', value: '0', detail: 'classificacao operacional' },
    { label: 'Em uso', value: '0', detail: 'compras futuras' },
  ],
  emptyState: {
    title: 'Nenhum fornecedor encontrado',
    description: 'Revise os filtros ou crie um novo fornecedor.',
  },
  statusMap: {
    ativo: { label: 'Ativo', tone: 'success' },
    inativo: { label: 'Inativo', tone: 'default' },
  },
}
