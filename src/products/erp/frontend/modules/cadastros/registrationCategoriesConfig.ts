import type { ErpEntityConfig, ErpEntityRecord } from '@/products/erp/shared/types'

// Categorias de cadastro: só agrupam listas (produtos, serviços, clientes, fornecedores); não entram na DRE.
const typeOptions = [
  { value: 'produto', label: 'Produto' }, { value: 'servico', label: 'Serviço' },
  { value: 'cliente', label: 'Cliente' }, { value: 'fornecedor', label: 'Fornecedor' },
]

export const registrationCategoriesConfig: ErpEntityConfig<ErpEntityRecord> = {
  id: 'categorias-cadastro',
  sectionId: 'cadastros',
  label: 'Categorias de cadastro',
  singularLabel: 'categoria de cadastro',
  description: 'Agrupe produtos, serviços, clientes e fornecedores. Não classificam dinheiro.',
  route: '/erp/cadastros/categorias-cadastro',
  searchPlaceholder: 'Buscar por nome ou descrição',
  primaryActionLabel: 'Nova categoria',
  columns: [
    { key: 'nome', label: 'Categoria', width: 'min-w-[220px]' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'descricao', label: 'Descrição', width: 'min-w-[240px]' },
    { key: 'itens', label: 'Cadastros', kind: 'number' },
    { key: 'status', label: 'Status', kind: 'status' },
  ],
  fields: [
    { key: 'nome', label: 'Nome da categoria', type: 'text', required: true },
    { key: 'tipo', label: 'Agrupa', type: 'select', required: true, options: typeOptions },
    { key: 'categoria_pai_id', label: 'Categoria-pai', type: 'select', placeholder: 'Nenhuma: é uma categoria principal' },
    { key: 'descricao', label: 'Descrição', type: 'textarea' },
    { key: 'status', label: 'Status', type: 'select', options: [{ value: 'ativo', label: 'Ativo' }, { value: 'inativo', label: 'Inativo' }] },
  ],
  filters: [
    { key: 'tipo', label: 'Tipo', allLabel: 'Todos os tipos', options: typeOptions },
    { key: 'status', label: 'Status', allLabel: 'Todos os status', options: [{ value: 'ativo', label: 'Ativo' }, { value: 'inativo', label: 'Inativo' }] },
  ],
  metrics: [
    { label: 'Categorias ativas', value: '0', detail: 'todos os tipos' },
    { label: 'Produtos e serviços', value: '0', detail: 'categorias de catálogo' },
    { label: 'Clientes e fornecedores', value: '0', detail: 'categorias de pessoas' },
  ],
  emptyState: {
    title: 'Nenhuma categoria de cadastro',
    description: 'Crie categorias para agrupar produtos, serviços, clientes e fornecedores.',
  },
  statusMap: {
    ativo: { label: 'Ativo', tone: 'success' },
    inativo: { label: 'Inativo', tone: 'default' },
  },
}
