import type { ErpEntityConfig, ErpEntityRecord } from '@/products/erp/shared/types'

export const categoriesConfig: ErpEntityConfig<ErpEntityRecord> = {
  id: 'categorias',
  sectionId: 'cadastros',
  label: 'Categorias',
  singularLabel: 'categoria',
  description: 'Padronize classificacoes para produtos, compras e relatorios.',
  route: '/erp/cadastros/categorias',
  searchPlaceholder: 'Buscar por nome ou descricao',
  primaryActionLabel: 'Nova categoria',
  columns: [
    { key: 'nome', label: 'Categoria', width: 'min-w-[180px]' },
    { key: 'descricao', label: 'Descricao', width: 'min-w-[280px]' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'itens', label: 'Itens', kind: 'number' },
    { key: 'status', label: 'Status', kind: 'status' },
  ],
  fields: [
    { key: 'nome', label: 'Nome da categoria', type: 'text', required: true },
    { key: 'descricao', label: 'Descricao', type: 'textarea', placeholder: 'Como esta categoria deve ser usada' },
    { key: 'tipo', label: 'Finalidade', type: 'select', required: true, options: [
      { value: 'produto', label: 'Produto' }, { value: 'servico', label: 'Servico' },
      { value: 'receita', label: 'Receita' }, { value: 'despesa', label: 'Despesa' },
      { value: 'geral', label: 'Geral' },
    ] },
    { key: 'status', label: 'Status', type: 'select', options: [{ value: 'ativo', label: 'Ativo' }, { value: 'inativo', label: 'Inativo' }] },
  ],
  filters: [
    { key: 'status', label: 'Status', allLabel: 'Todos os status', options: [{ value: 'ativo', label: 'Ativo' }, { value: 'inativo', label: 'Inativo' }] },
  ],
  metrics: [
    { label: 'Categorias ativas', value: '0', detail: 'em uso no ERP' },
    { label: 'Sem itens', value: '0', detail: 'avaliar classificacao', tone: 'warning' },
    { label: 'Tipos em uso', value: '0', detail: 'finalidades distintas' },
  ],
  emptyState: {
    title: 'Nenhuma categoria encontrada',
    description: 'Cadastre categorias para organizar o catalogo.',
  },
  statusMap: {
    ativo: { label: 'Ativo', tone: 'success' },
    inativo: { label: 'Inativo', tone: 'default' },
  },
}
