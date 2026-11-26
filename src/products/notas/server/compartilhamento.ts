// Notas — compartilhar: acesso geral (toda a empresa ou só convidados), convidados com nível e link público.
// Só quem criou a página muda isso. A restrição vale para as subpáginas (restricao_id, recalculada aqui).
import { randomBytes } from 'node:crypto'
import { comoPessoa, NotasError, type Contexto } from './db'
import { exigirLeitura, lerPagina, recalcularRestricao, semPermissao } from './paginas'

export type Convidado = { user_id: string; nivel: 'ver' | 'editar' }
export type Compartilhamento = {
  acesso: 'empresa' | 'restrito'; herdada: boolean; convidados: Convidado[]; publica: boolean; token: string | null; pode_gerir: boolean; dono: string
}

export function obterCompartilhamento(ctx: Contexto, id: string) {
  return comoPessoa(ctx, async client => {
    await exigirLeitura(client, ctx)
    const pagina = await lerPagina(client, ctx, id)
    const convidados = (await client.query('SELECT user_id, nivel FROM notas.permissoes WHERE pagina_id = $1 ORDER BY created_at', [id])).rows as Convidado[]
    const { rows } = await client.query('SELECT token_publico FROM notas.paginas WHERE id = $1', [id])
    return {
      acesso: pagina.acesso, herdada: pagina.acesso !== 'restrito' && Boolean(pagina.restricao_id), convidados,
      publica: pagina.publica, token: pagina.publica ? rows[0]?.token_publico ?? null : null,
      pode_gerir: pagina.created_by === ctx.userId, dono: pagina.created_by,
    } satisfies Compartilhamento
  })
}

/** Muda o acesso geral, a lista de convidados (substitui) e/ou o link público. */
export function alterarCompartilhamento(ctx: Contexto, id: string, dados: { acesso?: 'empresa' | 'restrito'; convidados?: Convidado[]; publica?: boolean }) {
  return comoPessoa(ctx, async client => {
    await exigirLeitura(client, ctx)
    const pagina = await lerPagina(client, ctx, id)
    if (pagina.created_by !== ctx.userId) throw new NotasError(403, 'Só quem criou a página muda o compartilhamento.')
    if (dados.convidados) {
      if (dados.convidados.length > 100) throw new NotasError(400, 'Até 100 convidados por página.')
      for (const c of dados.convidados) {
        const { rows } = await client.query('SELECT notas.membro_ativo($1, $2) AS ok', [ctx.orgId, c.user_id])
        if (!rows[0]?.ok) throw new NotasError(400, 'Só dá para convidar pessoas da empresa.')
      }
      await client.query('DELETE FROM notas.permissoes WHERE pagina_id = $1', [id]).catch(semPermissao)
      for (const c of dados.convidados.filter(c => c.user_id !== pagina.created_by)) {
        await client.query('INSERT INTO notas.permissoes (pagina_id, workspace_id, user_id, nivel) VALUES ($1, $2, $3, $4)',
          [id, ctx.orgId, c.user_id, c.nivel === 'editar' ? 'editar' : 'ver']).catch(semPermissao)
      }
    }
    if (dados.acesso && dados.acesso !== pagina.acesso) {
      await client.query('UPDATE notas.paginas SET acesso = $2 WHERE id = $1', [id, dados.acesso]).catch(semPermissao)
      await recalcularRestricao(client, id)
    }
    if (dados.publica !== undefined && dados.publica !== pagina.publica) {
      await client.query(`UPDATE notas.paginas SET publica = $2, token_publico = CASE WHEN $2 THEN coalesce(token_publico, $3) ELSE token_publico END WHERE id = $1`,
        [id, dados.publica, randomBytes(18).toString('base64url')]).catch(semPermissao)
    }
  }).then(() => obterCompartilhamento(ctx, id))
}
