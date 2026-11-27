// Notas — caixa de entrada: avisos de menção (@pessoa), comentário, atribuição (propriedade de pessoa) e lembretes de
// datas. Quem age grava o aviso para a outra pessoa (como ela mesma, pela política do banco); a tarefa diária grava os
// lembretes e esvazia a lixeira de mais de 30 dias.
import { createHmac } from 'node:crypto'
import { lembretesDevidos, type Item, type Propriedade } from '../shared/bases'
import { comoPessoa, consultaDoServidor, type Client, type Contexto } from './db'

export type TipoAviso = 'mencao' | 'comentario' | 'atribuicao' | 'lembrete'
export type Notificacao = { id: string; tipo: TipoAviso; pagina_id: string | null; autor: string | null; texto: string; lida_em: string | null; created_at: string; titulo: string | null; icone: string | null }

/**
 * Avisa as pessoas (menos quem age). Quem não é da empresa é ignorado pela política; cada aviso vai num savepoint para
 * uma recusa não desfazer o resto da operação. `chave` evita repetir o mesmo aviso.
 */
export async function avisar(client: Client, ctx: Contexto, para: string[], aviso: { tipo: Exclude<TipoAviso, 'lembrete'>; pagina_id: string; texto: string; chave?: (pessoa: string) => string }) {
  for (const pessoa of [...new Set(para)].filter(p => p && p !== ctx.userId).slice(0, 50)) {
    await client.query('SAVEPOINT aviso')
    try {
      // Sem ON CONFLICT: ele exige que a linha nova passe na política de leitura (só a própria pessoa lê os avisos dela).
      // Aviso repetido (mesma chave) dá erro de unicidade e é desfeito pelo savepoint, como os de quem não é da empresa.
      await client.query(`INSERT INTO notas.notificacoes (workspace_id, user_id, tipo, pagina_id, autor, texto, chave)
        VALUES ($1, $2, $3, $4, editor.uid(), $5, $6)`,
      [ctx.orgId, pessoa, aviso.tipo, aviso.pagina_id, aviso.texto.slice(0, 500), aviso.chave?.(pessoa) ?? null])
      await client.query('RELEASE SAVEPOINT aviso')
    } catch {
      await client.query('ROLLBACK TO SAVEPOINT aviso')
    }
  }
}

/** Os avisos da pessoa (os 50 mais recentes) e quantos não foram lidos. */
export function listarNotificacoes(ctx: Contexto) {
  return comoPessoa(ctx, async client => {
    const { rows } = await client.query(`SELECT n.id, n.tipo, n.pagina_id, n.autor, n.texto, n.lida_em, n.created_at, p.titulo, p.icone
      FROM notas.notificacoes n LEFT JOIN notas.paginas p ON p.id = n.pagina_id
      WHERE n.workspace_id = $1 AND n.user_id = editor.uid() ORDER BY n.created_at DESC LIMIT 50`, [ctx.orgId])
    const naoLidas = (await client.query('SELECT count(*)::int AS n FROM notas.notificacoes WHERE workspace_id = $1 AND user_id = editor.uid() AND lida_em IS NULL', [ctx.orgId])).rows[0].n as number
    return { notificacoes: rows as Notificacao[], nao_lidas: naoLidas }
  })
}

/** Marca como lidos os avisos indicados (ou todos). */
export function marcarLidas(ctx: Contexto, ids: string[] | 'todas') {
  return comoPessoa(ctx, async client => {
    if (ids === 'todas') await client.query('UPDATE notas.notificacoes SET lida_em = now() WHERE workspace_id = $1 AND user_id = editor.uid() AND lida_em IS NULL', [ctx.orgId])
    else await client.query('UPDATE notas.notificacoes SET lida_em = now() WHERE id = ANY($1::uuid[]) AND user_id = editor.uid() AND lida_em IS NULL', [ids])
  })
}

/**
 * Nome do canal de tempo real de uma página (por geração do documento): derivado de uma chave do servidor, então só
 * quem recebe da API (quem pode editar a página) consegue entrar. Não depende do login do navegador no Supabase.
 */
export function canalDaPagina(paginaId: string, geracao: number) {
  const segredo = process.env.NOTAS_CANAL_SEGREDO || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.CLERK_SECRET_KEY
  if (!segredo) return null
  return `notas-${createHmac('sha256', segredo).update(`${paginaId}:${geracao}`).digest('base64url').slice(0, 32)}`
}

const hojeEmSaoPaulo = () => new Date(Date.now() - 3 * 3600_000).toISOString().slice(0, 10)

/**
 * Tarefa diária (Vercel Cron): lembretes de datas devidos hoje e limpeza da lixeira (páginas na lixeira há mais de
 * 30 dias são apagadas de vez, com as subpáginas). Roda como o servidor.
 */
export async function tarefaDiaria(hoje = hojeEmSaoPaulo()) {
  const bases = await consultaDoServidor<{ id: string; workspace_id: string; titulo: string; esquema: Propriedade[] }>(
    `SELECT id, workspace_id, titulo, esquema FROM notas.paginas WHERE tipo = 'base' AND arquivada_em IS NULL
     AND EXISTS (SELECT 1 FROM jsonb_array_elements(esquema) e WHERE e->>'lembrete' IS NOT NULL)`, [])
  let lembretes = 0
  for (const base of bases) {
    const itens = await consultaDoServidor<Item>(`SELECT id, titulo, icone, posicao, propriedades, created_at, updated_at, created_by, updated_by
      FROM notas.paginas WHERE base_id = $1 AND arquivada_em IS NULL AND NOT e_modelo LIMIT 5000`, [base.id])
    for (const devido of lembretesDevidos(itens, base.esquema, hoje)) {
      for (const pessoa of devido.para) {
        const texto = `${devido.prop.nome}: ${devido.prop.lembrete === 'no_dia' ? 'é hoje' : 'é amanhã'}`
        const linhas = await consultaDoServidor(`INSERT INTO notas.notificacoes (workspace_id, user_id, tipo, pagina_id, texto, chave)
          VALUES ($1, $2, 'lembrete', $3, $4, $5) ON CONFLICT (chave) DO NOTHING RETURNING id`,
        [base.workspace_id, pessoa, devido.item.id, texto, `lembrete:${devido.item.id}:${devido.prop.id}:${devido.data}:${pessoa}`])
        lembretes += linhas.length
      }
    }
  }
  // Lixeira: só as raízes (as subpáginas vão junto pela chave estrangeira).
  const apagadas = await consultaDoServidor(`DELETE FROM notas.paginas WHERE arquivada_em < now() - interval '30 days' RETURNING id`, [])
  return { lembretes, apagadas: apagadas.length }
}
