// Notas: regras puras da árvore de páginas e do conteúdo (usadas pela tela e pelo servidor).

export type Espaco = 'equipe' | 'particular'
export type PaginaResumo = {
  id: string; parent_id: string | null; espaco: Espaco; titulo: string; icone: string | null; posicao: number
  /** 'base' = base de dados; itens de base têm base_id e não aparecem na árvore da barra lateral. */
  tipo?: 'pagina' | 'base'; base_id?: string | null
  /** Quem criou e o acesso (página restrita aparece com cadeado; particular de outra pessoa = compartilhada comigo). */
  created_by?: string; acesso?: 'empresa' | 'restrito'
}
export type NoArvore = PaginaResumo & { filhos: NoArvore[] }

export const SEM_TITULO = 'Sem título'
export const tituloExibido = (titulo: string | null | undefined) => (titulo ?? '').trim() || SEM_TITULO

/** Árvore de um espaço, ordenada pela posição (empate: título). Páginas cuja mãe não está na lista vão para a raiz. */
export function montarArvore(paginas: PaginaResumo[], espaco: Espaco): NoArvore[] {
  const doEspaco = paginas.filter(p => p.espaco === espaco && !p.base_id)
  const ids = new Set(doEspaco.map(p => p.id))
  const porPai = new Map<string | null, PaginaResumo[]>()
  for (const p of doEspaco) {
    const pai = p.parent_id && ids.has(p.parent_id) ? p.parent_id : null
    porPai.set(pai, [...(porPai.get(pai) ?? []), p])
  }
  const ordenar = (lista: PaginaResumo[]) => [...lista].sort((a, b) => a.posicao - b.posicao || a.titulo.localeCompare(b.titulo, 'pt-BR'))
  const montar = (pai: string | null, visitados: Set<string>): NoArvore[] =>
    ordenar(porPai.get(pai) ?? []).filter(p => !visitados.has(p.id))
      .map(p => ({ ...p, filhos: montar(p.id, new Set([...visitados, p.id])) }))
  return montar(null, new Set())
}

/** Caminho da raiz até a página (inclusive), para o topo da página. */
export function caminho(paginas: PaginaResumo[], id: string): PaginaResumo[] {
  const porId = new Map(paginas.map(p => [p.id, p]))
  const resultado: PaginaResumo[] = []
  const vistos = new Set<string>()
  let atual = porId.get(id)
  while (atual && !vistos.has(atual.id)) {
    resultado.unshift(atual); vistos.add(atual.id)
    atual = atual.parent_id ? porId.get(atual.parent_id) : undefined
  }
  return resultado
}

/** Ids da página e de todas as descendentes. */
export function descendentes(paginas: PaginaResumo[], id: string): string[] {
  const filhos = new Map<string, string[]>()
  for (const p of paginas) if (p.parent_id) filhos.set(p.parent_id, [...(filhos.get(p.parent_id) ?? []), p.id])
  const resultado: string[] = [], fila = [id], vistos = new Set<string>()
  while (fila.length) {
    const atual = fila.shift()!
    if (vistos.has(atual)) continue
    vistos.add(atual); resultado.push(atual)
    fila.push(...(filhos.get(atual) ?? []))
  }
  return resultado
}

/** Mover a página para dentro dela mesma ou de uma descendente criaria um ciclo. */
export function moverCriaCiclo(paginas: PaginaResumo[], id: string, novoPai: string | null) {
  return novoPai != null && descendentes(paginas, id).includes(novoPai)
}

/** Posição entre duas vizinhas (null = ponta). Números de ponto flutuante: arrastar não renumera as outras. */
export function posicaoEntre(antes: number | null, depois: number | null) {
  if (antes == null && depois == null) return 1000
  if (antes == null) return depois! - 1000
  if (depois == null) return antes + 1000
  return (antes + depois) / 2
}

type Bloco = { content?: unknown; children?: unknown; props?: Record<string, unknown> }
/** Texto puro dos blocos do BlockNote (para a busca): títulos, parágrafos, listas, tabelas e legendas. */
export function textoDoConteudo(blocos: unknown, limite = 100_000): string {
  const partes: string[] = []
  const visitar = (no: unknown): void => {
    if (partes.join(' ').length > limite || no == null) return
    if (typeof no === 'string') { partes.push(no); return }
    if (Array.isArray(no)) { no.forEach(visitar); return }
    if (typeof no !== 'object') return
    const obj = no as Bloco & { text?: unknown; type?: string; rows?: unknown; cells?: unknown }
    if (typeof obj.text === 'string') partes.push(obj.text)
    if (obj.props && typeof obj.props.caption === 'string') partes.push(obj.props.caption)
    if (obj.type === 'mencao' && obj.props && typeof obj.props.titulo === 'string') partes.push(obj.props.titulo)
    if (obj.type === 'pessoa' && obj.props && typeof obj.props.nome === 'string') partes.push(`@${obj.props.nome}`)
    if (obj.content !== undefined) visitar(obj.content)
    if (obj.rows !== undefined) visitar(obj.rows)
    if (obj.cells !== undefined) visitar(obj.cells)
    if (obj.children !== undefined) visitar(obj.children)
  }
  visitar(blocos)
  return partes.map(p => p.trim()).filter(Boolean).join(' ').slice(0, limite)
}

/** Pessoas mencionadas com @ no conteúdo (ids, sem repetir). */
export function pessoasMencionadas(blocos: unknown): string[] {
  const ids = new Set<string>()
  const visitar = (no: unknown): void => {
    if (no == null || typeof no !== 'object') return
    if (Array.isArray(no)) { no.forEach(visitar); return }
    const obj = no as { type?: string; props?: { userId?: unknown }; content?: unknown; children?: unknown; rows?: unknown; cells?: unknown }
    if (obj.type === 'pessoa' && typeof obj.props?.userId === 'string' && obj.props.userId) ids.add(obj.props.userId)
    for (const filho of [obj.content, obj.children, obj.rows, obj.cells]) if (filho !== undefined) visitar(filho)
  }
  visitar(blocos)
  return [...ids]
}
