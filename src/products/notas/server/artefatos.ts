// Notas: artefatos (páginas em HTML escritas por um agente pelo MCP). A página (tipo "artefato") dá o lugar na árvore,
// as permissões, o compartilhamento e a lixeira; o HTML e as versões ficam em notas.artefatos e notas.artefato_versoes.
// Tudo roda como a pessoa (comoPessoa): o banco decide quem lê e quem grava, pela política da página.
import type { Espaco } from '../shared/arvore'
import { textoDoHtml, tituloDoHtml, validarHtml } from '../shared/artefatos'
import { comoPessoa, NotasError, type Client, type Contexto } from './db'
import { exigirEdicao, exigirLeitura, lerPagina, proximaPosicao, semPermissao, type Pagina } from './paginas'

export type Artefato = {
  id: string; titulo: string; icone: string | null; espaco: Espaco; parent_id: string | null
  html: string; versao: number; atualizado_em: string; atualizado_por: string; pode_editar: boolean
}
export type VersaoArtefato = { versao: number; resumo: string; created_by: string; created_at: string; tamanho: number }

const MAX_RESUMO = 300

function htmlValido(html: unknown) {
  const r = validarHtml(html)
  if (!r.ok) throw new NotasError(400, r.erro)
  return r.valor
}

async function lerArtefatoDe(client: Client, ctx: Contexto, id: string, incluirLixeira = false): Promise<Artefato> {
  const pagina = await lerPagina(client, ctx, id, incluirLixeira)
  if (pagina.tipo !== 'artefato') throw new NotasError(404, 'Esta página não é um artefato.')
  const { rows } = await client.query('SELECT html, versao, updated_at, updated_by FROM notas.artefatos WHERE pagina_id = $1', [id])
  if (!rows[0]) throw new NotasError(404, 'Artefato não encontrado.')
  return comoArtefato(pagina, rows[0])
}

const comoArtefato = (p: Pagina, a: { html: string; versao: number; updated_at: string; updated_by: string }): Artefato => ({
  id: p.id, titulo: p.titulo, icone: p.icone, espaco: p.espaco, parent_id: p.parent_id,
  html: a.html, versao: a.versao, atualizado_em: a.updated_at, atualizado_por: a.updated_by, pode_editar: p.pode_editar,
})

/**
 * Cria um artefato: a página (no fim da lista do lugar escolhido; dentro de outra página herda o espaço dela) e a
 * versão 1 do HTML. Sem título, usa o <title> do HTML.
 */
export async function criarArtefato(ctx: Contexto, dados: { titulo?: string; html: unknown; icone?: string | null; parent_id?: string | null; espaco?: Espaco; resumo?: string }) {
  const html = htmlValido(dados.html)
  return comoPessoa(ctx, async client => {
    await exigirLeitura(client, ctx)
    let espaco: Espaco = dados.espaco === 'particular' ? 'particular' : 'equipe'
    let restricao: string | null = null
    const parentId = dados.parent_id || null
    if (parentId) {
      const mae = await exigirEdicao(client, ctx, parentId)
      if (mae.tipo === 'base' || mae.base_id) throw new NotasError(409, 'Um artefato não pode ficar dentro de uma base de dados. Escolha uma página.')
      espaco = mae.espaco
      restricao = mae.restricao_id
    }
    const titulo = (dados.titulo?.trim() || tituloDoHtml(html) || 'Artefato').slice(0, 500)
    const posicao = await proximaPosicao(client, ctx, parentId, espaco)
    const { rows } = await client.query(`INSERT INTO notas.paginas (workspace_id, espaco, parent_id, posicao, titulo, icone, restricao_id, tipo, conteudo_texto)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'artefato', $8) RETURNING id`,
    [ctx.orgId, espaco, parentId, posicao, titulo, dados.icone?.slice(0, 16) || null, restricao, textoDoHtml(html)]).catch(semPermissao)
    const id = rows[0].id as string
    await client.query('INSERT INTO notas.artefatos (pagina_id, workspace_id, html) VALUES ($1, $2, $3)', [id, ctx.orgId, html]).catch(semPermissao)
    await client.query('INSERT INTO notas.artefato_versoes (pagina_id, workspace_id, versao, html, resumo) VALUES ($1, $2, 1, $3, $4)',
      [id, ctx.orgId, html, (dados.resumo?.trim() || 'Criado').slice(0, MAX_RESUMO)]).catch(semPermissao)
    return lerArtefatoDe(client, ctx, id)
  })
}

/** O artefato com o HTML atual (para ver, ou para o agente editar em cima). */
export function lerArtefato(ctx: Contexto, id: string) {
  return comoPessoa(ctx, async client => {
    await exigirLeitura(client, ctx)
    return lerArtefatoDe(client, ctx, id, true)
  })
}

/**
 * Grava um HTML novo (vira a próxima versão; as anteriores ficam guardadas). `versaoBase`, se enviada, protege contra
 * sobrescrever uma mudança feita no meio tempo: o agente leu a versão 3, mas alguém já gravou a 4.
 */
export async function atualizarArtefato(ctx: Contexto, id: string, dados: { html: unknown; titulo?: string; icone?: string | null; resumo?: string; versaoBase?: number }) {
  const html = htmlValido(dados.html)
  return comoPessoa(ctx, async client => {
    await exigirLeitura(client, ctx)
    const pagina = await exigirEdicao(client, ctx, id)
    if (pagina.tipo !== 'artefato') throw new NotasError(404, 'Esta página não é um artefato.')
    if (pagina.bloqueada) throw new NotasError(409, 'O artefato está bloqueado. Desbloqueie a página para mudar.')
    const atual = (await client.query('SELECT versao FROM notas.artefatos WHERE pagina_id = $1 FOR UPDATE', [id])).rows[0] as { versao: number } | undefined
    if (!atual) throw new NotasError(404, 'Artefato não encontrado.')
    if (dados.versaoBase !== undefined && dados.versaoBase !== atual.versao) {
      throw new NotasError(409, `O artefato mudou desde a versão ${dados.versaoBase} (agora está na ${atual.versao}). Leia de novo antes de gravar.`)
    }
    const versao = atual.versao + 1
    await client.query('UPDATE notas.artefatos SET html = $2, versao = $3, updated_by = editor.uid(), updated_at = now() WHERE pagina_id = $1', [id, html, versao]).catch(semPermissao)
    await client.query('INSERT INTO notas.artefato_versoes (pagina_id, workspace_id, versao, html, resumo) VALUES ($1, $2, $3, $4, $5)',
      [id, ctx.orgId, versao, html, (dados.resumo?.trim() || `Versão ${versao}`).slice(0, MAX_RESUMO)]).catch(semPermissao)
    const titulo = dados.titulo?.trim()
    await client.query(`UPDATE notas.paginas SET conteudo_texto = $2, titulo = coalesce($3, titulo), icone = CASE WHEN $5 THEN $4 ELSE icone END,
        versao = versao + 1, updated_by = editor.uid() WHERE id = $1`,
    [id, textoDoHtml(html), titulo ? titulo.slice(0, 500) : null, dados.icone?.slice(0, 16) || null, dados.icone !== undefined]).catch(semPermissao)
    return lerArtefatoDe(client, ctx, id)
  })
}

/** As versões do artefato, da mais nova para a mais antiga (sem o HTML; `versaoArtefato` traz o de uma). */
export function versoesDoArtefato(ctx: Contexto, id: string) {
  return comoPessoa(ctx, async client => {
    await exigirLeitura(client, ctx)
    await lerArtefatoDe(client, ctx, id, true)
    const { rows } = await client.query(`SELECT versao, resumo, created_by, created_at, octet_length(html) AS tamanho
      FROM notas.artefato_versoes WHERE pagina_id = $1 ORDER BY versao DESC LIMIT 200`, [id])
    return rows as VersaoArtefato[]
  })
}

/** O HTML de uma versão (para ver antes de restaurar). */
export function versaoArtefato(ctx: Contexto, id: string, versao: number) {
  return comoPessoa(ctx, async client => {
    await exigirLeitura(client, ctx)
    await lerArtefatoDe(client, ctx, id, true)
    const { rows } = await client.query('SELECT versao, resumo, html, created_by, created_at FROM notas.artefato_versoes WHERE pagina_id = $1 AND versao = $2', [id, versao])
    if (!rows[0]) throw new NotasError(404, 'Versão não encontrada.')
    return rows[0] as VersaoArtefato & { html: string }
  })
}

/** Restaurar = gravar o HTML daquela versão como uma versão nova (nada se perde). */
export async function restaurarVersaoArtefato(ctx: Contexto, id: string, versao: number) {
  const antiga = await versaoArtefato(ctx, id, versao)
  return atualizarArtefato(ctx, id, { html: antiga.html, resumo: `Restaurada a versão ${versao}` })
}

/** Os artefatos que a pessoa vê, os editados mais recentemente primeiro; `busca` filtra pelo título ou pelo texto. */
export function listarArtefatos(ctx: Contexto, opcoes: { busca?: string; limite?: number } = {}) {
  const limite = Math.min(Math.max(1, Math.trunc(opcoes.limite ?? 30)), 100)
  const termo = opcoes.busca?.trim().slice(0, 200) ?? ''
  return comoPessoa(ctx, async client => {
    await exigirLeitura(client, ctx)
    const { rows } = await client.query(`SELECT p.id, p.titulo, p.icone, p.espaco, p.parent_id, a.versao, a.updated_at AS atualizado_em, octet_length(a.html) AS tamanho
      FROM notas.paginas p JOIN notas.artefatos a ON a.pagina_id = p.id
      WHERE p.workspace_id = $1 AND p.tipo = 'artefato' AND p.arquivada_em IS NULL
        AND ($2 = '' OR p.titulo ILIKE '%' || $3 || '%' OR p.conteudo_texto ILIKE '%' || $3 || '%')
      ORDER BY a.updated_at DESC LIMIT $4`, [ctx.orgId, termo, termo.replace(/[%_\\]/g, m => `\\${m}`), limite])
    return rows as { id: string; titulo: string; icone: string | null; espaco: Espaco; parent_id: string | null; versao: number; atualizado_em: string; tamanho: number }[]
  })
}
