import type { ErpEntityConfig, ErpEntityRecord } from '@/products/erp/shared/types'

// Categorias financeiras: classificam o dinheiro que entra (receita) e sai (despesa) e montam a DRE pelo grupo.
// Agrupamentos de produtos, serviços, clientes e fornecedores ficam nos próprios cadastros.
export const categoriesConfig: ErpEntityConfig<ErpEntityRecord> = {
  id: 'categorias',
  sectionId: 'cadastros',
  label: 'Categorias financeiras',
  singularLabel: 'categoria',
  description: 'Classifique receitas e despesas e defina em que linha da DRE cada uma aparece.',
  route: '/erp/cadastros/categorias',
  searchPlaceholder: 'Buscar por nome, categoria-pai ou grupo da DRE',
  primaryActionLabel: 'Nova categoria',
  columns: [
    { key: 'nome', label: 'Categoria', width: 'min-w-[220px]' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'grupo_dre', label: 'Grupo da DRE', width: 'min-w-[200px]' },
    { key: 'itens', label: 'Lançamentos', kind: 'number' },
    { key: 'status', label: 'Status', kind: 'status' },
  ],
  fields: [
    { key: 'nome', label: 'Nome da categoria', type: 'text', required: true },
    { key: 'tipo', label: 'Tipo', type: 'select', required: true, options: [
      { value: 'receita', label: 'Receita (dinheiro que entra)' }, { value: 'despesa', label: 'Despesa (dinheiro que sai)' },
    ] },
    { key: 'categoria_pai_id', label: 'Categoria-pai', type: 'select', placeholder: 'Nenhuma: é uma categoria principal' },
    { key: 'dre_grupo_id', label: 'Grupo da DRE', type: 'select', placeholder: 'Subcategorias usam o grupo da categoria-pai' },
    { key: 'descricao', label: 'Descrição', type: 'textarea', placeholder: 'Como esta categoria deve ser usada' },
    { key: 'status', label: 'Status', type: 'select', options: [{ value: 'ativo', label: 'Ativo' }, { value: 'inativo', label: 'Inativo' }] },
  ],
  filters: [
    { key: 'tipo', label: 'Tipo', allLabel: 'Receitas e despesas', options: [{ value: 'receita', label: 'Receita' }, { value: 'despesa', label: 'Despesa' }] },
    { key: 'status', label: 'Status', allLabel: 'Todos os status', options: [{ value: 'ativo', label: 'Ativo' }, { value: 'inativo', label: 'Inativo' }] },
  ],
  metrics: [
    { label: 'Categorias ativas', value: '0', detail: 'receitas e despesas' },
    { label: 'Não classificadas', value: '0', detail: 'sem grupo da DRE', tone: 'warning' },
    { label: 'Sem lançamentos', value: '0', detail: 'ainda não usadas' },
  ],
  emptyState: {
    title: 'Nenhuma categoria encontrada',
    description: 'Cadastre categorias de receita e de despesa para classificar o financeiro e montar a DRE.',
  },
  statusMap: {
    ativo: { label: 'Ativo', tone: 'success' },
    inativo: { label: 'Inativo', tone: 'default' },
  },
}
