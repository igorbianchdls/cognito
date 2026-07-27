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
    { key: 'estoque', label: 'Estoque', kind: 'number' },
    { key: 'status', label: 'Status', kind: 'status' },
  ],
  fields: [
    { key: 'nome', label: 'Nome do produto', type: 'text', required: true },
    { key: 'sku', label: 'SKU', type: 'text', required: true },
    { key: 'categoria', label: 'Categoria', type: 'select', options: [{ value: 'Kits', label: 'Kits' }, { value: 'Eletronicos', label: 'Eletronicos' }, { value: 'Cabos', label: 'Cabos' }, { value: 'Estrutura', label: 'Estrutura' }] },
    { key: 'preco', label: 'Preco', type: 'number', required: true },
    { key: 'estoque', label: 'Estoque inicial', type: 'number' },
  ],
  filters: [
    { key: 'status', label: 'Status', allLabel: 'Todos os status', options: [{ value: 'ativo', label: 'Ativo' }, { value: 'pausado', label: 'Pausado' }] },
    { key: 'categoria', label: 'Categoria', allLabel: 'Todas as categorias', options: [{ value: 'Kits', label: 'Kits' }, { value: 'Eletronicos', label: 'Eletronicos' }, { value: 'Cabos', label: 'Cabos' }, { value: 'Estrutura', label: 'Estrutura' }] },
  ],
  metrics: [
    { label: 'SKUs ativos', value: '312', detail: '28 categorias' },
    { label: 'Sem estoque', value: '9', detail: 'precisam reposicao', tone: 'danger' },
    { label: 'Valor em estoque', value: 'R$ 842 mil', detail: 'custo estimado' },
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

