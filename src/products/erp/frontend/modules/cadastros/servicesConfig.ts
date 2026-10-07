import type { ErpEntityConfig, ErpEntityRecord } from '@/products/erp/shared/types'

export const servicesConfig: ErpEntityConfig<ErpEntityRecord> = {
  id: 'servicos',
  sectionId: 'cadastros',
  label: 'Serviços',
  singularLabel: 'servico',
  description: 'Cadastre serviços vendidos, preços, custos e classificação comercial.',
  route: '/erp/cadastros/servicos',
  searchPlaceholder: 'Buscar por serviço, código ou categoria',
  primaryActionLabel: 'Novo serviço',
  columns: [
    { key: 'nome', label: 'Serviço', width: 'min-w-[220px]' },
    { key: 'codigo', label: 'Código' },
    { key: 'categoria', label: 'Categoria' },
    { key: 'preco', label: 'Preço', kind: 'currency' },
    { key: 'custo', label: 'Custo', kind: 'currency' },
    { key: 'status', label: 'Status', kind: 'status' },
  ],
  fields: [
    { key: 'status', label: 'Situação', type: 'select', options: [{value:'ativo',label:'Ativo'},{value:'pausado',label:'Inativo'}] },
    { key: 'nome', label: 'Nome do serviço', type: 'text', required: true },
    { key: 'codigo', label: 'Código', type: 'text', placeholder: 'Ex: SERV-001' },
    { key: 'descricao', label: 'Descrição', type: 'textarea' },
    { key: 'categoria_id', label: 'Categoria', type: 'select' },
    { key: 'preco', label: 'Preço', type: 'number', required: true },
    { key: 'custo', label: 'Custo', type: 'number' },
  ],
  filters: [
    { key: 'status', label: 'Status', allLabel: 'Todos os status', options: [{ value: 'ativo', label: 'Ativo' }, { value: 'pausado', label: 'Pausado' }] },
  ],
  metrics: [
    { label: 'Serviços ativos', value: '0', detail: 'catálogo conectado' },
    { label: 'Categorias', value: '0', detail: 'classificação comercial' },
    { label: 'Preço médio', value: 'R$ 0,00', detail: 'serviços cadastrados' },
  ],
  emptyState: {
    title: 'Nenhum serviço encontrado',
    description: 'Altere a busca ou cadastre um novo serviço.',
  },
  statusMap: {
    ativo: { label: 'Ativo', tone: 'success' },
    pausado: { label: 'Pausado', tone: 'warning' },
  },
}
