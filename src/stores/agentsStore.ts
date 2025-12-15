export type AgentVisibility = 'private' | 'org' | 'public'

export type Agent = {
  id: string
  name: string
  description?: string
  category: 'financeiro' | 'vendas' | 'contabilidade' | 'servicos' | 'crm' | 'produtos' | 'empresa' | string
  visibility: AgentVisibility
  version?: number
  updated_at?: string
}

const now = () => new Date().toISOString()

const AGENTS_MOCK: Agent[] = [
  { id: 'fin-analista-1', name: 'Analista Financeiro', description: 'KPIs de fluxo de caixa e inadimplência', category: 'financeiro', visibility: 'org', version: 2, updated_at: now() },
  { id: 'fin-pag-1', name: 'Gestor de Contas a Pagar', description: 'Acompanhamento de pagamentos e fornecedores', category: 'financeiro', visibility: 'private', version: 1, updated_at: now() },
  { id: 'ven-analista-1', name: 'Analista de Vendas', description: 'Pipeline e metas comerciais', category: 'vendas', visibility: 'org', version: 3, updated_at: now() },
  { id: 'ven-b2b-1', name: 'Vendas B2B', description: 'Análise de carteira e territórios', category: 'vendas', visibility: 'public', version: 1, updated_at: now() },
  { id: 'cont-dre-1', name: 'Contador DRE', description: 'Gera DRE e análises contábeis', category: 'contabilidade', visibility: 'org', version: 5, updated_at: now() },
  { id: 'srv-gestor-1', name: 'Gestor de Serviços', description: 'Ordens de serviço e SLAs', category: 'servicos', visibility: 'private', version: 1, updated_at: now() },
  { id: 'crm-leads-1', name: 'CRM Leads', description: 'Qualificação e acompanhamento de leads', category: 'crm', visibility: 'org', version: 1, updated_at: now() },
  { id: 'prd-catalogo-1', name: 'Catálogo de Produtos', description: 'Gestão de SKUs e variações', category: 'produtos', visibility: 'private', version: 2, updated_at: now() },
  { id: 'emp-cadastro-1', name: 'Cadastro Empresa', description: 'Dados cadastrais e compliance', category: 'empresa', visibility: 'org', version: 1, updated_at: now() },
]

export const agentsApi = {
  async list(params: { category?: Agent['category']; limit?: number } = {}): Promise<{ items: Agent[]; count: number }> {
    const { category, limit = 24 } = params
    const filtered = category ? AGENTS_MOCK.filter(a => a.category === category) : AGENTS_MOCK
    return { items: filtered.slice(0, limit), count: filtered.length }
  },
}

