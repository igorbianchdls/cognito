// Notas — histórico de versões: listar, ver uma versão e restaurar (a versão atual vira foto antes, para dar para voltar).
import { comoPessoa, NotasError, type Contexto } from './db'
import { exigirEdicao, exigirLeitura, fotografar, lerPagina, semPermissao } from './paginas'
import { textoDoConteudo } from '../shared/arvore'

export type ResumoVersao = { id: string; titulo: string; icone: string | null; versao: number; autor: string | null; created_at: string }

export function listarVersoes(ctx: Contexto, paginaId: string) {
  return comoPessoa(ctx, async client => {
    await exigirLeitura(client, ctx)
    await lerPagina(client, ctx, paginaId, true)
    return (await client.query(`SELECT id, titulo, icone, versao, autor, created_at FROM notas.versoes WHERE pagina_id = $1
      ORDER BY created_at DESC LIMIT 100`, [paginaId])).rows as ResumoVersao[]
  })
}

export function obterVersao(ctx: Contexto, paginaId: string, versaoId: string) {
  return comoPessoa(ctx, async client => {
    await exigirLeitura(client, ctx)
    const { rows } = await client.query(`SELECT id, titulo, icone, conteudo, propriedades, versao, autor, created_at FROM notas.versoes
      WHERE id = $1 AND pagina_id = $2`, [versaoId, paginaId])
    if (!rows[0]) throw new NotasError(404, 'Versão não encontrada.')
    return rows[0]
  })
}

/** Volta a página para a versão escolhida (título, ícone e conteúdo). */
export function restaurarVersao(ctx: Contexto, paginaId: string, versaoId: string) {
  return comoPessoa(ctx, async client => {
    await exigirLeitura(client, ctx)
    const atual = await exigirEdicao(client, ctx, paginaId)
    if (atual.bloqueada) throw new NotasError(409, 'A página está bloqueada. Desbloqueie para restaurar.')
    const { rows } = await client.query('SELECT titulo, icone, conteudo FROM notas.versoes WHERE id = $1 AND pagina_id = $2', [versaoId, paginaId])
    if (!rows[0]) throw new NotasError(404, 'Versão não encontrada.')
    await fotografar(client, ctx, atual, true)
    await client.query(`UPDATE notas.paginas SET titulo = $2, icone = $3, conteudo = $4::jsonb, conteudo_texto = $5, versao = versao + 1, updated_by = editor.uid(),
      estado_yjs = NULL, geracao_yjs = geracao_yjs + 1
      WHERE id = $1`, [paginaId, rows[0].titulo, rows[0].icone, JSON.stringify(rows[0].conteudo), textoDoConteudo(rows[0].conteudo)]).catch(semPermissao)
    return lerPagina(client, ctx, paginaId)
  })
}
