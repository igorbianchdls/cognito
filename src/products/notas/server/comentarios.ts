// Notas — comentários: discussões na página ou num bloco (com o trecho citado), respostas, resolver e reabrir.
import { comoPessoa, NotasError, type Contexto } from './db'
import { exigirLeitura, lerPagina, semPermissao } from './paginas'
import { avisar } from './notificacoes'

export type Comentario = {
  id: string; discussao_id: string | null; bloco_id: string | null; trecho: string | null; texto: string
  resolvido: boolean; autor: string; created_at: string; editado_em: string | null
}

export function listarComentarios(ctx: Contexto, paginaId: string) {
  return comoPessoa(ctx, async client => {
    await exigirLeitura(client, ctx)
    await lerPagina(client, ctx, paginaId, true)
    return (await client.query(`SELECT id, discussao_id, bloco_id, trecho, texto, resolvido, autor, created_at, editado_em
      FROM notas.comentarios WHERE pagina_id = $1 ORDER BY created_at LIMIT 2000`, [paginaId])).rows as Comentario[]
  })
}

/** Novo comentário: abre uma discussão (na página ou num bloco) ou responde a uma. */
export function comentar(ctx: Contexto, paginaId: string, dados: { texto: string; discussao_id?: string | null; bloco_id?: string | null; trecho?: string | null }) {
  const texto = dados.texto.trim()
  if (!texto || texto.length > 5000) throw new NotasError(400, 'O comentário precisa ter de 1 a 5.000 letras.')
  return comoPessoa(ctx, async client => {
    await exigirLeitura(client, ctx)
    await lerPagina(client, ctx, paginaId)
    if (dados.discussao_id) {
      const { rows } = await client.query('SELECT discussao_id FROM notas.comentarios WHERE id = $1 AND pagina_id = $2', [dados.discussao_id, paginaId])
      if (!rows[0] || rows[0].discussao_id) throw new NotasError(404, 'Discussão não encontrada.')
    }
    const { rows } = await client.query(`INSERT INTO notas.comentarios (pagina_id, workspace_id, discussao_id, bloco_id, trecho, texto)
      VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, discussao_id, bloco_id, trecho, texto, resolvido, autor, created_at, editado_em`,
    [paginaId, ctx.orgId, dados.discussao_id ?? null, dados.discussao_id ? null : dados.bloco_id ?? null,
      dados.discussao_id ? null : (dados.trecho ?? '').slice(0, 300) || null, texto]).catch(semPermissao)
    const pagina = await lerPagina(client, ctx, paginaId)
    const participantes = dados.discussao_id
      ? (await client.query('SELECT DISTINCT autor FROM notas.comentarios WHERE id = $1 OR discussao_id = $1', [dados.discussao_id])).rows.map((r: { autor: string }) => r.autor)
      : []
    await avisar(client, ctx, [pagina.created_by, ...participantes], { tipo: 'comentario', pagina_id: paginaId, texto: texto.slice(0, 200) })
    return rows[0] as Comentario
  })
}

/** Editar o texto (só o autor) ou resolver/reabrir a discussão (o autor ou quem edita a página). */
export function alterarComentario(ctx: Contexto, id: string, dados: { texto?: string; resolvido?: boolean }) {
  return comoPessoa(ctx, async client => {
    await exigirLeitura(client, ctx)
    const { rows } = await client.query('SELECT id, autor, discussao_id, pagina_id FROM notas.comentarios WHERE id = $1', [id])
    const atual = rows[0]
    if (!atual) throw new NotasError(404, 'Comentário não encontrado.')
    if (dados.texto !== undefined) {
      if (atual.autor !== ctx.userId) throw new NotasError(403, 'Só quem escreveu edita o comentário.')
      const texto = dados.texto.trim()
      if (!texto || texto.length > 5000) throw new NotasError(400, 'O comentário precisa ter de 1 a 5.000 letras.')
      await client.query('UPDATE notas.comentarios SET texto = $2, editado_em = now() WHERE id = $1', [id, texto]).catch(semPermissao)
    }
    if (dados.resolvido !== undefined) {
      if (atual.discussao_id) throw new NotasError(400, 'Resolva a discussão, não uma resposta.')
      const pagina = await lerPagina(client, ctx, atual.pagina_id)
      if (atual.autor !== ctx.userId && !pagina.pode_editar) throw new NotasError(403, 'Você não pode resolver esta discussão.')
      await client.query('UPDATE notas.comentarios SET resolvido = $2, resolvido_por = CASE WHEN $2 THEN editor.uid() END WHERE id = $1', [id, dados.resolvido]).catch(semPermissao)
    }
    return (await client.query('SELECT id, discussao_id, bloco_id, trecho, texto, resolvido, autor, created_at, editado_em FROM notas.comentarios WHERE id = $1', [id])).rows[0] as Comentario
  })
}

export function apagarComentario(ctx: Contexto, id: string) {
  return comoPessoa(ctx, async client => {
    await exigirLeitura(client, ctx)
    const { rowCount } = await client.query('DELETE FROM notas.comentarios WHERE id = $1 AND autor = editor.uid()', [id])
    if (!rowCount) throw new NotasError(404, 'Comentário não encontrado (ou não é seu).')
  })
}
