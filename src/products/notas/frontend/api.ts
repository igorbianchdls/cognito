// Chamadas da tela de Notas ao servidor do Otto.
import type { Espaco, PaginaResumo } from '@/products/notas/shared/arvore'
import type { BaseLigada, Item, Propriedade, Visao } from '@/products/notas/shared/bases'

export type Pagina = PaginaResumo & {
  capa: string | null; capa_posicao: number; conteudo: unknown[]; largura_total: boolean; texto_pequeno: boolean
  fonte: 'padrao' | 'serifa' | 'mono'; bloqueada: boolean; versao: number; created_by: string; updated_by: string | null
  created_at: string; updated_at: string; arquivada_em: string | null; pode_editar: boolean; favorita: boolean
  tipo: 'pagina' | 'base' | 'artefato'; base_id: string | null; e_modelo?: boolean; geracao_yjs: number; estado_yjs?: string | null
  acesso: 'empresa' | 'restrito'; restricao_id: string | null; publica: boolean; canal?: string | null; esquema: Propriedade[]; visoes: Visao[]; propriedades: Record<string, unknown>
}
export type BaseCompleta = { base: Pagina; itens: Item[]; ligadas: BaseLigada[] }
export type Arvore = { paginas: PaginaResumo[]; favoritos: string[]; recentes: string[]; pode_editar_equipe: boolean; eu?: string }
export type ItemLixeira = { id: string; titulo: string; icone: string | null; espaco: Espaco; arquivada_em: string; mae: string | null }
export type ResultadoBusca = { id: string; titulo: string; icone: string | null; espaco: Espaco; parent_id: string | null; trecho: string; updated_at: string }

export class ErroNotas extends Error {
  constructor(public status: number, message: string, public atual?: Pagina, public preparacao = false) { super(message) }
}

export async function notasApi<T>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {}
  const response = await fetch(`/api/notas${url}`, {
    cache: 'no-store', ...rest,
    ...(json !== undefined ? { body: JSON.stringify(json), headers: { 'content-type': 'application/json', ...rest.headers } } : {}),
  })
  const body = await response.json().catch(() => ({})) as T & { erro?: string; atual?: Pagina; preparacao?: boolean }
  if (!response.ok) throw new ErroNotas(response.status, body.erro ?? (response.status >= 500 ? 'Não foi possível concluir. Tente de novo em instantes.' : `Erro ${response.status}`), body.atual, Boolean(body.preparacao))
  return body
}

export async function enviarArquivoNotas(file: File) {
  const form = new FormData(); form.append('arquivo', file)
  const response = await fetch('/api/notas/arquivos', { method: 'POST', body: form })
  const body = await response.json().catch(() => ({})) as { url?: string; erro?: string }
  if (!response.ok || !body.url) throw new Error(body.erro ?? 'Não foi possível enviar o arquivo.')
  return body.url
}

/** "Editado há 5 min", "Editado ontem"… */
export function editadoHa(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000
  if (s < 60) return 'Editado agora'
  if (s < 3600) return `Editado há ${Math.floor(s / 60)} min`
  if (s < 86400) return `Editado há ${Math.floor(s / 3600)} h`
  if (s < 172800) return 'Editado ontem'
  return `Editado em ${new Date(iso).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}`
}
