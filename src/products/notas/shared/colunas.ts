// Notas: regras puras dos blocos de colunas. O bloco "colunas" guarda as proporções (ex.: "0.6,0.4") e tem como
// filhos blocos "coluna", cada um com o conteúdo como filhos.

/** Menor fatia de uma coluna (10% da largura). */
export const COLUNA_MINIMA = 0.1

/** Proporções das `n` colunas (somam 1). Valor ausente, inválido ou de outro número de colunas vira divisão igual. */
export function lerLarguras(texto: unknown, n: number): number[] {
  const iguais = Array.from({ length: n }, () => 1 / n)
  if (typeof texto !== 'string' || !texto.trim() || n < 1) return iguais
  const v = texto.split(',').map(Number)
  if (v.length !== n || v.some(x => !Number.isFinite(x) || x <= 0)) return iguais
  const soma = v.reduce((a, b) => a + b, 0)
  return v.map(x => x / soma)
}

/** Texto guardado no bloco (3 casas decimais). */
export const escreverLarguras = (v: number[]) => v.map(x => Math.round(x * 1000) / 1000).join(',')

/**
 * Arrastar a divisão entre a coluna `i` e a `i + 1` em `delta` (fração da largura total, positivo = para a direita):
 * uma cresce o que a outra perde, e nenhuma fica menor que COLUNA_MINIMA.
 */
export function moverDivisao(larguras: number[], i: number, delta: number): number[] {
  if (i < 0 || i >= larguras.length - 1) return larguras
  const par = larguras[i] + larguras[i + 1]
  const esquerda = Math.min(par - COLUNA_MINIMA, Math.max(COLUNA_MINIMA, larguras[i] + delta))
  const nova = [...larguras]
  nova[i] = esquerda
  nova[i + 1] = par - esquerda
  return nova
}

type BlocoMin = { id: string; type: string; props?: Record<string, unknown>; children?: BlocoMin[] }
export type AjusteColunas =
  | { tipo: 'envolver'; colunasId: string; bloco: BlocoMin }
  | { tipo: 'tirar_coluna'; colunasId: string; colunaId: string; larguras: string }
  | { tipo: 'desfazer'; colunasId: string; conteudo: BlocoMin[] }

/**
 * Depois de mover blocos:
 *   * bloco solto direto entre as colunas (o editor deixa soltar ali) vira uma coluna nova, como no Notion;
 *   * coluna que ficou vazia sai (a largura dela vai para as outras);
 *   * se sobrar uma coluna só (ou nenhuma), as colunas se desfazem e o conteúdo volta para o lugar delas.
 * Nunca descarta conteúdo. Devolve o primeiro ajuste a fazer (o editor aplica e chama de novo).
 */
export function ajusteDeColunas(blocos: BlocoMin[]): AjusteColunas | null {
  for (const b of blocos) {
    if (b.type === 'colunas') {
      const solto = (b.children ?? []).find(c => c.type !== 'coluna')
      if (solto) return { tipo: 'envolver', colunasId: b.id, bloco: solto }
      const colunas = (b.children ?? []).filter(c => c.type === 'coluna')
      const larguras = lerLarguras(b.props?.larguras, colunas.length)
      const vazia = colunas.findIndex(c => !(c.children ?? []).length)
      if (vazia >= 0 && colunas.length > 2) {
        const resto = larguras.filter((_, j) => j !== vazia)
        return { tipo: 'tirar_coluna', colunasId: b.id, colunaId: colunas[vazia].id, larguras: escreverLarguras(lerLarguras(resto.join(','), resto.length)) }
      }
      const cheias = colunas.filter(c => (c.children ?? []).length)
      if (cheias.length < 2) return { tipo: 'desfazer', colunasId: b.id, conteudo: cheias.flatMap(c => c.children ?? []) }
    }
    const dentro = ajusteDeColunas(b.children ?? [])
    if (dentro) return dentro
  }
  return null
}
