import type { ErpEntityConfig, ErpEntityRecord } from '@/products/erp/shared/types'

export const productsConfig: ErpEntityConfig<ErpEntityRecord> = {
  id: 'produtos',
  sectionId: 'cadastros',
  label: 'Produtos',
  singularLabel: 'produto',
  description: 'Controle SKUs, preços, categorias e disponibilidade comercial.',
  route: '/erp/cadastros/produtos',
  searchPlaceholder: 'Buscar por produto, SKU ou categoria',
  primaryActionLabel: 'Novo produto',
  columns: [
    { key: 'nome', label: 'Produto', width: 'min-w-[220px]' },
    { key: 'sku', label: 'SKU' },
    { key: 'categoria', label: 'Categoria' },
    { key: 'preco', label: 'Preço', kind: 'currency' },
    { key: 'controla_estoque', label: 'Estoque' },
    { key: 'estoque_minimo', label: 'Mínimo', kind: 'number' },
    { key: 'status', label: 'Status', kind: 'status' },
  ],
  fields: [
    { key: 'nome', label: 'Nome do produto', type: 'text', required: true },
    { key: 'sku', label: 'SKU', type: 'text', required: true },
    { key: 'categoria', label: 'Categoria', type: 'select' },
    { key: 'preco', label: 'Preço', type: 'number', required: true },
    { key: 'controla_estoque', label: 'Controlar estoque', type: 'select', options: [{ value: 'sim', label: 'Sim' }, { value: 'nao', label: 'Não' }] },
    { key: 'permite_estoque_negativo', label: 'Permitir estoque negativo', type: 'select', options: [{ value: 'nao', label: 'Não' }, { value: 'sim', label: 'Sim' }] },
    { key: 'estoque_minimo', label: 'Estoque mínimo', type: 'number' },
    { key: 'ponto_reposicao', label: 'Ponto de reposicao', type: 'number' },
  ],
  filters: [
    { key: 'status', label: 'Status', allLabel: 'Todos os status', options: [{ value: 'ativo', label: 'Ativo' }, { value: 'pausado', label: 'Pausado' }] },
  ],
  metrics: [
    { label: 'SKUs ativos', value: '0', detail: 'catálogo conectado' },
    { label: 'Categorias', value: '0', detail: 'classificação comercial' },
    { label: 'Preço médio', value: 'R$ 0,00', detail: 'produtos cadastrados' },
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
