import type { ErpEntityConfig, ErpEntityRecord } from '@/products/erp/shared/types'

export const sellersConfig: ErpEntityConfig<ErpEntityRecord> = {
  id: 'vendedores',
  sectionId: 'cadastros',
  label: 'Vendedores',
  singularLabel: 'vendedor',
  description: 'Gerencie os responsaveis comerciais usados em vendas, orcamentos e relatorios.',
  route: '/erp/cadastros/vendedores',
  searchPlaceholder: 'Buscar por nome, documento, email ou cidade',
  primaryActionLabel: 'Novo vendedor',
  columns: [
    { key: 'nome', label: 'Nome', width: 'min-w-[220px]' },
    { key: 'documento', label: 'Documento', width: 'min-w-[160px]' },
    { key: 'email', label: 'Email', width: 'min-w-[220px]' },
    { key: 'telefone', label: 'Telefone' },
    { key: 'status', label: 'Status', kind: 'status' },
  ],
  fields: [
    { key: 'nome', label: 'Nome', type: 'text', required: true },
    { key: 'tipo', label: 'Tipo de pessoa', type: 'select', options: [{ value: 'PF', label: 'Pessoa fisica' }, { value: 'PJ', label: 'Pessoa juridica' }] },
    { key: 'documento', label: 'CPF/CNPJ', type: 'text' },
    { key: 'telefone', label: 'Telefone', type: 'tel' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'cidade', label: 'Cidade', type: 'text' },
  ],
  filters: [{ key: 'status', label: 'Status', allLabel: 'Todos os status', options: [{ value: 'ativo', label: 'Ativo' }, { value: 'inativo', label: 'Inativo' }] }],
  metrics: [
    { label: 'Vendedores ativos', value: '0', detail: 'disponiveis nas vendas', tone: 'success' },
    { label: 'Inativos', value: '0', detail: 'cadastros pausados' },
    { label: 'Categorias', value: '0', detail: 'classificacoes em uso' },
  ],
  emptyState: { title: 'Nenhum vendedor encontrado', description: 'Cadastre o primeiro responsavel comercial.' },
  statusMap: {
    ativo: { label: 'Ativo', tone: 'success' },
    inativo: { label: 'Inativo', tone: 'default' },
  },
}
