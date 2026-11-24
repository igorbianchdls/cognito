// Categories of a company (shared.empresas.categoria): the focus of Otto for it. They decide which sections of the menu
// show, in which order, and where the app opens. One place for the rule, used by the browser and the server.

export const CATEGORIAS = ['marketing', 'gestao', 'completo'] as const
export type Categoria = (typeof CATEGORIAS)[number]
export const isCategoria = (v: unknown): v is Categoria => typeof v === 'string' && (CATEGORIAS as readonly string[]).includes(v)

export const categoriaInfo: Record<Categoria, { nome: string; descricao: string }> = {
  marketing: { nome: 'Marketing', descricao: 'Vídeos, posts, sound effects, analytics e atendimento.' },
  gestao: { nome: 'Gestão', descricao: 'Vendas, financeiro, cadastros e atendimento.' },
  completo: { nome: 'Completo', descricao: 'Tudo do Otto: marketing e gestão.' },
}

/** Sections of the menu (their ids in nav/secoes.ts). */
export type SecaoId = 'vendas' | 'financeiro' | 'marketing' | 'drive' | 'analytics' | 'inbox' | 'automacao' | 'crm'

/** The sections each category shows, in the order they appear. */
export const secoesPorCategoria: Record<Categoria, SecaoId[]> = {
  marketing: ['marketing', 'analytics', 'automacao', 'inbox', 'crm', 'drive'],
  gestao: ['vendas', 'financeiro', 'inbox', 'crm', 'automacao', 'drive'],
  completo: ['marketing', 'analytics', 'automacao', 'vendas', 'financeiro', 'drive', 'inbox', 'crm'],
}

/** Where the app opens (the "/" address) for each category. */
export const inicioPorCategoria: Record<Categoria, string> = { marketing: '/editor', gestao: '/erp', completo: '/erp' }
