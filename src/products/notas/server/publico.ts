// Notas — leitura pública por link (só leitura). A consulta roda como o servidor e exige o token exato de uma página
// publicada e fora da lixeira; devolve só o necessário para mostrar (sem ids de pessoas, sem subpáginas).
import { consultaDoServidor, NotasError, urlAssinada } from './db'
import type { Item, Propriedade, Visao } from '../shared/bases'

const TOKEN = /^[A-Za-z0-9_-]{20,100}$/

export type PaginaPublica = {
  titulo: string; icone: string | null; capa: string | null; capa_posicao: number; conteudo: unknown[]; tipo: 'pagina' | 'base'
  largura_total: boolean; texto_pequeno: boolean; fonte: string; updated_at: string
  base?: { esquema: Propriedade[]; visao: Visao; itens: Omit<Item, 'created_by' | 'updated_by'>[] }
}

async function paginaPorToken(token: string) {
  if (!TOKEN.test(token)) throw new NotasError(404, 'Página não encontrada.')
  const [pagina] = await consultaDoServidor<{ id: string; workspace_id: string } & Omit<PaginaPublica, 'base'> & { esquema: Propriedade[]; visoes: Visao[] }>(
    `SELECT id, workspace_id, titulo, icone, capa, capa_posicao, conteudo, tipo, largura_total, texto_pequeno, fonte, updated_at, esquema, visoes
     FROM notas.paginas WHERE token_publico = $1 AND publica AND arquivada_em IS NULL`, [token])
  if (!pagina) throw new NotasError(404, 'Página não encontrada ou não está mais publicada.')
  return pagina
}

export async function lerPaginaPublica(token: string): Promise<PaginaPublica> {
  const { id, workspace_id: _ws, esquema, visoes, ...pagina } = await paginaPorToken(token)
  if (pagina.tipo !== 'base') return pagina
  // Base publicada: a primeira visão e os itens (sem quem criou/editou).
  const itens = await consultaDoServidor<Omit<Item, 'created_by' | 'updated_by'>>(`SELECT id, titulo, icone, posicao, propriedades, capa, created_at, updated_at
    FROM notas.paginas WHERE base_id = $1 AND arquivada_em IS NULL AND NOT e_modelo ORDER BY posicao LIMIT 2000`, [id])
  // Pessoas não aparecem no link público.
  const semPessoas = esquema.filter(p => !['pessoa', 'criado_por', 'editado_por'].includes(p.tipo))
  return { ...pagina, base: { esquema: semPessoas, visao: visoes[0], itens } }
}

/** Arquivo de uma página pública (imagens do conteúdo e capa): só da mesma empresa da página. */
export async function arquivoPublico(token: string, caminho: string) {
  const pagina = await paginaPorToken(token)
  if (!caminho.startsWith(`${pagina.workspace_id}/`) || caminho.includes('..')) throw new NotasError(404, 'Arquivo não encontrado.')
  const referencia = `/api/notas/arquivos/${caminho}`
  const usado = JSON.stringify(pagina.conteudo).includes(referencia) || pagina.capa === referencia
  if (!usado) throw new NotasError(404, 'Arquivo não encontrado.')
  return urlAssinada(caminho, 600)
}
