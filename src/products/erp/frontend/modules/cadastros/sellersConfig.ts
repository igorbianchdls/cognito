import type { ErpEntityConfig, ErpEntityRecord } from '@/products/erp/shared/types'

export const sellersConfig: ErpEntityConfig<ErpEntityRecord> = {
  id: 'vendedores',
  sectionId: 'cadastros',
  label: 'Vendedores',
  singularLabel: 'vendedor',
  description: 'Gerencie os responsáveis comerciais usados em vendas, orçamentos e relatórios.',
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
    { key: 'status', label: 'Situação', type: 'select', options: [{value:'ativo',label:'Ativo'},{value:'inativo',label:'Inativo'}] },
    { key: 'nome', label: 'Nome', type: 'text', required: true },
    { key: 'tipo', label: 'Tipo de pessoa', type: 'select', options: [{ value: 'PF', label: 'Pessoa física' }, { value: 'PJ', label: 'Pessoa jurídica' }] },
    { key: 'documento', label: 'CPF/CNPJ', type: 'text' },
  ],
  filters: [{ key: 'status', label: 'Status', allLabel: 'Todos os status', options: [{ value: 'ativo', label: 'Ativo' }, { value: 'inativo', label: 'Inativo' }] }],
  metrics: [
    { label: 'Vendedores ativos', value: '0', detail: 'disponíveis nas vendas', tone: 'success' },
    { label: 'Inativos', value: '0', detail: 'cadastros pausados' },
    { label: 'Categorias', value: '0', detail: 'classificacoes em uso' },
  ],
  emptyState: { title: 'Nenhum vendedor encontrado', description: 'Cadastre o primeiro responsável comercial.' },
  statusMap: {
    ativo: { label: 'Ativo', tone: 'success' },
    inativo: { label: 'Inativo', tone: 'default' },
  },
}
