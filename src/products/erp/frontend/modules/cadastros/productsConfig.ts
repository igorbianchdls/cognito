import type { ErpEntityConfig, ErpEntityRecord } from '@/products/erp/shared/types'

export const productsConfig: ErpEntityConfig<ErpEntityRecord> = {
  id: 'produtos',
  sectionId: 'cadastros',
  label: 'Produtos',
  singularLabel: 'produto',
  description: 'Controle SKUs, precos, categorias e disponibilidade comercial.',
  route: '/erp/cadastros/produtos',
  searchPlaceholder: 'Buscar por produto, SKU ou categoria',
  primaryActionLabel: 'Novo produto',
  columns: [
    { key: 'nome', label: 'Produto', width: 'min-w-[220px]' },
    { key: 'sku', label: 'SKU' },
    { key: 'categoria', label: 'Categoria' },
    { key: 'preco', label: 'Preco', kind: 'currency' },
    { key: 'status', label: 'Status', kind: 'status' },
  ],
  fields: [
    { key: 'nome', label: 'Nome do produto', type: 'text', required: true },
    { key: 'sku', label: 'SKU', type: 'text', required: true },
    { key: 'categoria', label: 'Categoria', type: 'select' },
    { key: 'preco', label: 'Preco', type: 'number', required: true },
  ],
  filters: [
    { key: 'status', label: 'Status', allLabel: 'Todos os status', options: [{ value: 'ativo', label: 'Ativo' }, { value: 'pausado', label: 'Pausado' }] },
  ],
  metrics: [
    { label: 'SKUs ativos', value: '0', detail: 'catalogo conectado' },
    { label: 'Categorias', value: '0', detail: 'classificacao comercial' },
    { label: 'Preco medio', value: 'R$ 0,00', detail: 'produtos cadastrados' },
  ],
  emptyState: {
    title: 'Nenhum produto encontrado',
    description: 'Altere a busca ou cadastre um novo produto.',
  },
  statusMap: {
    ativo: { label: 'Ativo', tone: 'success' },
    pausado: { label: 'Pausado', tone: 'warning' },
  },
}
