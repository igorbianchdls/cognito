// Notas — bases de dados no servidor. Tudo roda como a pessoa (comoPessoa), então quem vê e quem altera continua
// decidido pelas políticas das páginas. As regras de tipos, valores e conversões vêm de shared/bases.ts.
import {
  COM_OPCOES, converterValor, modeloDeBase, validarEsquema, validarValor, validarVisoes,
  type BaseLigada, type Item, type Propriedade, type TipoVisao, type Visao,
} from '../shared/bases'
import { posicaoEntre, textoDoConteudo, type Espaco } from '../shared/arvore'
import { comoPessoa, NotasError, type Client, type Contexto } from './db'
import { exigirEdicao, exigirLeitura, lerPagina, proximaPosicao, semPermissao, type Pagina } from './paginas'

const LIMITE_ITENS = 5000
const ITEM = 'id, titulo, icone, posicao, propriedades, created_at, updated_at, created_by, updated_by, capa, e_modelo'

async function exigirBase(client: Client, ctx: Contexto, id: string, editar = false) {
  const base = editar ? await exigirEdicao(client, ctx, id) : await lerPagina(client, ctx, id)
  if (base.tipo !== 'base') throw new NotasError(404, 'Base de dados não encontrada.')
  return base
}

async function lerItens(client: Client, baseId: string) {
  return (await client.query(`SELECT ${ITEM} FROM notas.paginas WHERE base_id = $1 AND arquivada_em IS NULL ORDER BY posicao LIMIT ${LIMITE_ITENS}`, [baseId])).rows as Item[]
}

/** Bases ligadas por relação (as que a pessoa enxerga), com esquema e itens, para títulos e agregações. */
async function lerLigadas(client: Client, ctx: Contexto, esquema: Propriedade[]): Promise<BaseLigada[]> {
  const ids = [...new Set(esquema.filter(p => p.tipo === 'relacao' && p.baseRelacionada).map(p => p.baseRelacionada!))]
  const ligadas: BaseLigada[] = []
  for (const id of ids) {
    const { rows } = await client.query(`SELECT id, titulo, esquema FROM notas.paginas WHERE id = $1 AND workspace_id = $2 AND tipo = 'base' AND arquivada_em IS NULL`, [id, ctx.orgId])
    if (rows[0]) ligadas.push({ ...rows[0], itens: (await lerItens(client, id)).filter(i => !i.e_modelo) })
  }
  return ligadas
}
async function completa(client: Client, ctx: Contexto, id: string) {
  const base = await exigirBase(client, ctx, id)
  return { base, itens: await lerItens(client, id), ligadas: await lerLigadas(client, ctx, base.esquema) }
}

/** A base (esquema, visões, permissões), os itens dela (e os modelos) e as bases ligadas por relação. */
export function obterBase(ctx: Contexto, id: string, semItens = false) {
  return comoPessoa(ctx, async client => {
    await exigirLeitura(client, ctx)
    if (!semItens) return completa(client, ctx, id)
    const base = await exigirBase(client, ctx, id)
    return { base, itens: [] as Item[], ligadas: await lerLigadas(client, ctx, base.esquema) }
  })
}

/** Valores de um item conferidos contra o esquema; null apaga a chave. */
function conferirValores(esquema: Propriedade[], valores: Record<string, unknown>) {
  const limpos: Record<string, unknown> = {}
  for (const [chave, valor] of Object.entries(valores)) {
    const prop = esquema.find(p => p.id === chave)
    if (!prop) throw new NotasError(400, 'Propriedade inexistente nesta base.')
    const r = validarValor(prop, valor)
    if (!r.ok) throw new NotasError(400, r.erro)
    limpos[chave] = r.valor
  }
  return limpos
}
const semVazios = (valores: Record<string, unknown>) => Object.fromEntries(Object.entries(valores).filter(([, v]) => v !== null && v !== false))

async function inserirItens(client: Client, ctx: Contexto, base: Pagina, itens: { titulo: string; propriedades: Record<string, unknown> }[], depoisDe: number | null) {
  let posicao = depoisDe
  for (const item of itens) {
    posicao = posicaoEntre(posicao, null)
    await client.query(`INSERT INTO notas.paginas (workspace_id, espaco, parent_id, base_id, posicao, titulo, propriedades, restricao_id)
      VALUES ($1, $2, $3, $3, $4, $5, $6::jsonb, $7)`, [ctx.orgId, base.espaco, base.id, posicao, item.titulo, JSON.stringify(item.propriedades), base.restricao_id]).catch(semPermissao)
  }
}

/**
 * Cria uma base (página nova, ou transforma uma página vazia em base — "Comece com: Tabela/Quadro/Lista"). O modelo
 * "tarefas" já vem com Status, Responsável, Prazo, Prioridade, as visões Tabela e Quadro e três tarefas de exemplo.
 */
export function criarBase(ctx: Contexto, dados: {
  parent_id?: string | null; espaco?: Espaco; titulo?: string; modelo: 'vazia' | 'tarefas'; visao: TipoVisao; converter?: string
  /** Importar CSV: esquema e itens já montados pela tela (conferidos aqui). */
  importacao?: { esquema: unknown; itens: { titulo: string; propriedades: Record<string, unknown> }[] }
}) {
  return comoPessoa(ctx, async client => {
    await exigirLeitura(client, ctx)
    const modelo = modeloDeBase(dados.modelo, dados.visao)
    if (dados.importacao) {
      const esquema = validarEsquema(dados.importacao.esquema)
      if (!esquema.ok) throw new NotasError(400, esquema.erro)
      if (!Array.isArray(dados.importacao.itens) || dados.importacao.itens.length > 2000) throw new NotasError(400, 'O arquivo pode ter até 2.000 linhas.')
      modelo.esquema = esquema.valor
      modelo.visoes = [{ ...modelo.visoes[0], visiveis: esquema.valor.map(p => p.id).slice(0, 20) }]
      modelo.itens = dados.importacao.itens.map(i => ({ titulo: String(i?.titulo ?? '').slice(0, 500), propriedades: semVazios(conferirValores(esquema.valor, i?.propriedades ?? {})) }))
    }
    let id: string
    if (dados.converter) {
      const pagina = await exigirEdicao(client, ctx, dados.converter)
      if (pagina.tipo === 'base' || pagina.base_id) throw new NotasError(409, 'Esta página já é uma base ou um item de base.')
      if (textoDoConteudo(pagina.conteudo).trim()) throw new NotasError(409, 'A página já tem conteúdo. Crie a base numa página nova.')
      if ((await client.query('SELECT 1 FROM notas.paginas WHERE parent_id = $1 LIMIT 1', [pagina.id])).rowCount) throw new NotasError(409, 'A página tem subpáginas. Crie a base numa página nova.')
      await client.query(`UPDATE notas.paginas SET tipo = 'base', esquema = $2::jsonb, visoes = $3::jsonb, conteudo = '[]'::jsonb, conteudo_texto = '', estado_yjs = NULL, geracao_yjs = geracao_yjs + 1,
        titulo = CASE WHEN titulo = '' THEN $4 ELSE titulo END, versao = versao + 1, updated_by = editor.uid() WHERE id = $1`,
      [pagina.id, JSON.stringify(modelo.esquema), JSON.stringify(modelo.visoes), dados.modelo === 'tarefas' ? 'Tarefas' : '']).catch(semPermissao)
      id = pagina.id
    } else {
      let espaco: Espaco = dados.espaco === 'particular' ? 'particular' : 'equipe'
      const parentId = dados.parent_id || null
      let restricao: string | null = null
      if (parentId) {
        const mae = await exigirEdicao(client, ctx, parentId)
        if (mae.tipo === 'base' || mae.base_id) throw new NotasError(409, 'Não dá para criar uma base dentro de outra base.')
        espaco = mae.espaco
        restricao = mae.restricao_id
      }
      const { rows } = await client.query(`INSERT INTO notas.paginas (workspace_id, espaco, parent_id, posicao, titulo, tipo, esquema, visoes, restricao_id)
        VALUES ($1, $2, $3, $4, $5, 'base', $6::jsonb, $7::jsonb, $8) RETURNING id`,
      [ctx.orgId, espaco, parentId, await proximaPosicao(client, ctx, parentId, espaco), (dados.titulo ?? (dados.modelo === 'tarefas' ? 'Tarefas' : '')).slice(0, 500),
        JSON.stringify(modelo.esquema), JSON.stringify(modelo.visoes), restricao]).catch(semPermissao)
      id = rows[0].id
    }
    const base = await exigirBase(client, ctx, id)
    await inserirItens(client, ctx, base, modelo.itens, null)
    return completa(client, ctx, id)
  })
}

/**
 * Troca o esquema e/ou as visões. Quando uma propriedade muda de tipo, os valores dos itens são convertidos (texto
 * vira opção criando a opção, por exemplo); propriedade apagada some dos itens; opção apagada sai dos valores.
 */
export function alterarBase(ctx: Contexto, id: string, dados: { esquema?: unknown; visoes?: unknown }) {
  return comoPessoa(ctx, async client => {
    await exigirLeitura(client, ctx)
    const base = await exigirBase(client, ctx, id, true)
    const antigo = base.esquema as Propriedade[]
    let esquema = antigo
    if (dados.esquema !== undefined) {
      const r = validarEsquema(dados.esquema)
      if (!r.ok) throw new NotasError(400, r.erro)
      esquema = r.valor
      // A base ligada precisa existir e a pessoa precisa enxergá-la.
      for (const prop of esquema.filter(p => p.tipo === 'relacao')) {
        const outra = await lerPagina(client, ctx, prop.baseRelacionada!).catch(() => null)
        if (outra?.tipo !== 'base') throw new NotasError(400, `A base ligada em “${prop.nome}” não existe ou você não tem acesso.`)
      }
      const itens = (await client.query(`SELECT id, propriedades FROM notas.paginas WHERE base_id = $1 FOR UPDATE`, [id])).rows as { id: string; propriedades: Record<string, unknown> }[]
      const mudados: { id: string; propriedades: Record<string, unknown> }[] = []
      for (const item of itens) {
        const novo: Record<string, unknown> = {}
        for (const prop of esquema) {
          if (item.propriedades[prop.id] === undefined) continue
          const anterior = antigo.find(p => p.id === prop.id) ?? prop
          const { valor, opcoesNovas } = converterValor(anterior, prop, item.propriedades[prop.id])
          if (opcoesNovas.length) prop.opcoes = [...(prop.opcoes ?? []), ...opcoesNovas]
          // Opção apagada do esquema sai do valor.
          const limpo = COM_OPCOES.includes(prop.tipo)
            ? (Array.isArray(valor) ? valor.filter(v => prop.opcoes?.some(o => o.id === v)) : prop.opcoes?.some(o => o.id === valor) ? valor : null)
            : valor
          if (limpo !== null && limpo !== false && !(Array.isArray(limpo) && !limpo.length)) novo[prop.id] = limpo
        }
        if (JSON.stringify(novo) !== JSON.stringify(item.propriedades)) mudados.push({ id: item.id, propriedades: novo })
      }
      if (mudados.length) await client.query(`UPDATE notas.paginas p SET propriedades = v.valor FROM unnest($1::uuid[], $2::jsonb[]) AS v(id, valor) WHERE p.id = v.id`,
        [mudados.map(m => m.id), mudados.map(m => JSON.stringify(m.propriedades))]).catch(semPermissao)
    }
    const visoes = validarVisoes(dados.visoes ?? base.visoes, esquema)
    if (!visoes.ok) throw new NotasError(400, visoes.erro)
    await client.query(`UPDATE notas.paginas SET esquema = $2::jsonb, visoes = $3::jsonb, updated_by = editor.uid() WHERE id = $1`,
      [id, JSON.stringify(esquema), JSON.stringify(visoes.valor)]).catch(semPermissao)
    return completa(client, ctx, id)
  })
}

/** Os ids ligados numa relação precisam ser itens da base ligada. */
async function conferirRelacoes(client: Client, esquema: Propriedade[], valores: Record<string, unknown>) {
  for (const prop of esquema.filter(p => p.tipo === 'relacao')) {
    const ids = valores[prop.id]
    if (!Array.isArray(ids) || !ids.length) continue
    const { rows } = await client.query('SELECT count(*)::int AS n FROM notas.paginas WHERE base_id = $1 AND id = ANY($2::uuid[]) AND NOT e_modelo', [prop.baseRelacionada, ids])
    if (rows[0].n !== ids.length) throw new NotasError(400, `Há itens em “${prop.nome}” que não são da base ligada.`)
  }
}

/**
 * Item novo na base (com valores iniciais, por exemplo a coluna do quadro onde a pessoa clicou em "+ Novo"). Com
 * `modelo_id`, copia ícone, conteúdo e valores do modelo; com `e_modelo`, cria um modelo (não aparece nas visões).
 */
export function criarItem(ctx: Contexto, baseId: string, dados: { titulo?: string; propriedades?: Record<string, unknown>; posicao?: number; modelo_id?: string; e_modelo?: boolean }) {
  return comoPessoa(ctx, async client => {
    await exigirLeitura(client, ctx)
    const base = await exigirBase(client, ctx, baseId, true)
    let modelo: { titulo: string; icone: string | null; conteudo: unknown; conteudo_texto: string; propriedades: Record<string, unknown> } | null = null
    if (dados.modelo_id) {
      modelo = (await client.query(`SELECT titulo, icone, conteudo, conteudo_texto, propriedades FROM notas.paginas WHERE id = $1 AND base_id = $2 AND e_modelo AND arquivada_em IS NULL`,
        [dados.modelo_id, baseId])).rows[0] ?? null
      if (!modelo) throw new NotasError(404, 'Modelo não encontrado.')
    }
    const valores = semVazios({ ...(modelo?.propriedades ?? {}), ...conferirValores(base.esquema, dados.propriedades ?? {}) })
    await conferirRelacoes(client, base.esquema, valores)
    const posicao = Number.isFinite(dados.posicao) ? dados.posicao! : await proximaPosicao(client, ctx, baseId, base.espaco)
    const titulo = (dados.titulo || (modelo && !dados.e_modelo ? '' : dados.e_modelo ? 'Novo modelo' : '')).slice(0, 500)
    const { rows } = await client.query(`INSERT INTO notas.paginas (workspace_id, espaco, parent_id, base_id, posicao, titulo, propriedades, icone, conteudo, conteudo_texto, e_modelo, restricao_id)
      VALUES ($1, $2, $3, $3, $4, $5, $6::jsonb, $7, $8::jsonb, $9, $10, $11) RETURNING ${ITEM}`,
    [ctx.orgId, base.espaco, baseId, posicao, titulo, JSON.stringify(valores), modelo?.icone ?? null, JSON.stringify(modelo?.conteudo ?? []),
      modelo?.conteudo_texto ?? '', Boolean(dados.e_modelo), base.restricao_id]).catch(semPermissao)
    return rows[0] as Item
  })
}

/**
 * Muda células de um item (só as enviadas; as outras ficam como estão, mesmo que outra pessoa tenha mudado ao mesmo
 * tempo), o nome ou a posição (ordem manual e arrastar no quadro). Não muda a versão do conteúdo da página.
 */
export function alterarItem(ctx: Contexto, id: string, dados: { titulo?: string; propriedades?: Record<string, unknown>; posicao?: number }) {
  return comoPessoa(ctx, async client => {
    await exigirLeitura(client, ctx)
    const item = await exigirEdicao(client, ctx, id)
    if (!item.base_id) throw new NotasError(409, 'Esta página não é item de uma base.')
    const base = await exigirBase(client, ctx, item.base_id)
    const valores = conferirValores(base.esquema, dados.propriedades ?? {})
    await conferirRelacoes(client, base.esquema, valores)
    const apagar = Object.keys(valores).filter(k => valores[k] === null || valores[k] === false)
    const gravar = semVazios(valores)
    const { rows } = await client.query(`UPDATE notas.paginas SET propriedades = (propriedades || $2::jsonb) - $3::text[],
        titulo = coalesce($4, titulo), posicao = coalesce($5, posicao), updated_by = editor.uid()
      WHERE id = $1 RETURNING ${ITEM}`,
    [id, JSON.stringify(gravar), apagar, dados.titulo === undefined ? null : dados.titulo.slice(0, 500), Number.isFinite(dados.posicao) ? dados.posicao : null]).catch(semPermissao)
    return rows[0] as Item
  })
}

export type { Visao }
