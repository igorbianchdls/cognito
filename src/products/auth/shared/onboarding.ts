// Choices offered during onboarding. Shared by the wizard (labels) and the server (validation and the first page).

export const ONBOARDING_SEGMENTS = [
  { id: 'comercio', label: 'Comércio e loja' },
  { id: 'servicos', label: 'Prestação de serviços' },
  { id: 'industria', label: 'Indústria e produção' },
  { id: 'alimentacao', label: 'Alimentação' },
  { id: 'saude-beleza', label: 'Saúde e beleza' },
  { id: 'construcao', label: 'Construção e reformas' },
  { id: 'educacao', label: 'Educação e cursos' },
  { id: 'outro', label: 'Outro' },
] as const

export const ONBOARDING_START_AREAS = [
  { id: 'vendas', label: 'Vendas e pedidos', description: 'Orçamentos, pedidos e clientes.', href: '/erp/vendas/pedidos' },
  { id: 'financeiro', label: 'Financeiro', description: 'Contas a pagar e a receber, caixa.', href: '/erp/financeiro/contas-a-receber' },
  { id: 'notas', label: 'Notas fiscais', description: 'Emissão e histórico de notas.', href: '/erp/vendas/notas-fiscais' },
  { id: 'estoque', label: 'Estoque', description: 'Produtos, saldos e movimentações.', href: '/erp/estoque/posicao-estoque' },
  { id: 'geral', label: 'Ver tudo', description: 'Começar pela visão geral.', href: '/erp' },
] as const

export type OnboardingSegment = (typeof ONBOARDING_SEGMENTS)[number]['id']
export type OnboardingStartArea = (typeof ONBOARDING_START_AREAS)[number]['id']

export const isOnboardingSegment = (value: unknown): value is OnboardingSegment => ONBOARDING_SEGMENTS.some((item) => item.id === value)
export const isOnboardingStartArea = (value: unknown): value is OnboardingStartArea => ONBOARDING_START_AREAS.some((item) => item.id === value)
export const startAreaHref = (value: unknown) => ONBOARDING_START_AREAS.find((item) => item.id === value)?.href ?? '/erp'

export const TEAM_INVITE_LIMIT = 10
export type TeamInviteRole = 'admin' | 'member'
export type TeamInviteResult = { email: string; ok: boolean; error?: string }
