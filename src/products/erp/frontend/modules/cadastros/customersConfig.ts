import type { ErpEntityConfig, ErpEntityRecord } from '@/products/erp/shared/types'

export const customersConfig: ErpEntityConfig<ErpEntityRecord> = {
  id: 'clientes',
  sectionId: 'cadastros',
  label: 'Clientes',
  singularLabel: 'cliente',
  description: 'Gerencie a base comercial, fiscal e de contato dos clientes.',
  route: '/erp/cadastros/clientes',
  searchPlaceholder: 'Buscar por nome, documento, email ou cidade',
  primaryActionLabel: 'Novo cliente',
  columns: [
    { key: 'nome', label: 'Nome', width: 'min-w-[220px]' },
    { key: 'documento', label: 'Documento', width: 'min-w-[160px]' },
    { key: 'email', label: 'Email', width: 'min-w-[220px]' },
    { key: 'cidade', label: 'Cidade' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'status', label: 'Status', kind: 'status' },
  ],
  fields: [
    { key: 'nome', label: 'Nome', type: 'text', placeholder: 'Nome completo ou razao social', required: true },
    { key: 'tipo', label: 'Tipo de pessoa', type: 'select', required: true, options: [{ value: 'PF', label: 'Pessoa fisica' }, { value: 'PJ', label: 'Pessoa juridica' }] },
    { key: 'documento', label: 'CPF/CNPJ', type: 'text', placeholder: 'Documento fiscal', required: true },
    { key: 'telefone', label: 'Telefone', type: 'tel', placeholder: '(00) 00000-0000' },
    { key: 'email', label: 'Email', type: 'email', placeholder: 'email@empresa.com' },
    { key: 'cidade', label: 'Cidade', type: 'text', placeholder: 'Cidade/UF' },
  ],
  filters: [
    { key: 'status', label: 'Status', allLabel: 'Todos os status', options: [{ value: 'ativo', label: 'Ativo' }, { value: 'inativo', label: 'Inativo' }] },
    { key: 'tipo', label: 'Tipo', allLabel: 'Todos os tipos', options: [{ value: 'PF', label: 'Pessoa fisica' }, { value: 'PJ', label: 'Pessoa juridica' }] },
  ],
  metrics: [
    { label: 'Clientes ativos', value: '0', detail: 'base conectada', tone: 'success' },
    { label: 'Inativos', value: '0', detail: 'cadastros pausados' },
    { label: 'Ticket medio', value: 'R$ 0,00', detail: 'vendas futuras' },
  ],
  emptyState: {
    title: 'Nenhum cliente encontrado',
    description: 'Ajuste a busca ou cadastre o primeiro cliente.',
  },
  statusMap: {
    ativo: { label: 'Ativo', tone: 'success' },
    inativo: { label: 'Inativo', tone: 'default' },
  },
}
