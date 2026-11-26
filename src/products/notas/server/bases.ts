// Notas — bases de dados no servidor. Tudo roda como a pessoa (comoPessoa), então quem vê e quem altera continua
// decidido pelas políticas das páginas. As regras de tipos, valores e conversões vêm de shared/bases.ts.
import {
  COM_OPCOES, converterValor, modeloDeBase, validarEsquema, validarValor, validarVisoes,
  type Item, type Propriedade, type TipoVisao, type Visao,
} from '../shared/bases'
import { posicaoEntre, textoDoConteudo, type Espaco } from '../shared/arvore'
import { comoPessoa, NotasError, type Client, type Contexto } from './db'
import { exigirEdicao, exigirLeitura, lerPagina, proximaPosicao, semPermissao, type Pagina } from './paginas'

const LIMITE_ITENS = 5000
const ITEM = 'id, titulo, icone, posicao, propriedades, created_at, updated_at, created_by, updated_by'

async function exigirBase(client: Client, ctx: Contexto, id: string, editar = false) {
  const base = editar ? await exigirEdicao(client, ctx, id) : await lerPagina(client, ctx, id)
  if (base.tipo !== 'base') throw new NotasError(404, 'Base de dados não encontrada.')
  return base
}

async function lerItens(client: Client, baseId: string) {
  return (await client.query(`SELECT ${ITEM} FROM notas.paginas WHERE base_id = $1 AND arquivada_em IS NULL ORDER BY posicao LIMIT ${LIMITE_ITENS}`, [baseId])).rows as Item[]
}

/** A base (esquema, visões, permissões) e os itens dela. */
export function obterBase(ctx: Contexto, id: string, semItens = false) {
  return comoPessoa(ctx, async client => {
    await exigirLeitura(client, ctx)
    const base = await exigirBase(client, ctx, id)
    return { base, itens: semItens ? [] : await lerItens(client, id) }
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
    await client.query(`INSERT INTO notas.paginas (workspace_id, espaco, parent_id, base_id, posicao, titulo, propriedades)
      VALUES ($1, $2, $3, $3, $4, $5, $6::jsonb)`, [ctx.orgId, base.espaco, base.id, posicao, item.titulo, JSON.stringify(item.propriedades)]).catch(semPermissao)
  }
}

/**
 * Cria uma base (página nova, ou transforma uma página vazia em base — "Comece com: Tabela/Quadro/Lista"). O modelo
 * "tarefas" já vem com Status, Responsável, Prazo, Prioridade, as visões Tabela e Quadro e três tarefas de exemplo.
 */
export function criarBase(ctx: Contexto, dados: { parent_id?: string | null; espaco?: Espaco; titulo?: string; modelo: 'vazia' | 'tarefas'; visao: TipoVisao; converter?: string }) {
  return comoPessoa(ctx, async client => {
    await exigirLeitura(client, ctx)
    const modelo = modeloDeBase(dados.modelo, dados.visao)
    let id: string
    if (dados.converter) {
      const pagina = await exigirEdicao(client, ctx, dados.converter)
      if (pagina.tipo === 'base' || pagina.base_id) throw new NotasError(409, 'Esta página já é uma base ou um item de base.')
      if (textoDoConteudo(pagina.conteudo).trim()) throw new NotasError(409, 'A página já tem conteúdo. Crie a base numa página nova.')
      if ((await client.query('SELECT 1 FROM notas.paginas WHERE parent_id = $1 LIMIT 1', [pagina.id])).rowCount) throw new NotasError(409, 'A página tem subpáginas. Crie a base numa página nova.')
      await client.query(`UPDATE notas.paginas SET tipo = 'base', esquema = $2::jsonb, visoes = $3::jsonb, conteudo = '[]'::jsonb, conteudo_texto = '',
        titulo = CASE WHEN titulo = '' THEN $4 ELSE titulo END, versao = versao + 1, updated_by = editor.uid() WHERE id = $1`,
      [pagina.id, JSON.stringify(modelo.esquema), JSON.stringify(modelo.visoes), dados.modelo === 'tarefas' ? 'Tarefas' : '']).catch(semPermissao)
      id = pagina.id
    } else {
      let espaco: Espaco = dados.espaco === 'particular' ? 'particular' : 'equipe'
      const parentId = dados.parent_id || null
      if (parentId) {
        const mae = await exigirEdicao(client, ctx, parentId)
        if (mae.tipo === 'base' || mae.base_id) throw new NotasError(409, 'Não dá para criar uma base dentro de outra base.')
        espaco = mae.espaco
      }
      const { rows } = await client.query(`INSERT INTO notas.paginas (workspace_id, espaco, parent_id, posicao, titulo, tipo, esquema, visoes)
        VALUES ($1, $2, $3, $4, $5, 'base', $6::jsonb, $7::jsonb) RETURNING id`,
      [ctx.orgId, espaco, parentId, await proximaPosicao(client, ctx, parentId, espaco), (dados.titulo ?? (dados.modelo === 'tarefas' ? 'Tarefas' : '')).slice(0, 500),
        JSON.stringify(modelo.esquema), JSON.stringify(modelo.visoes)]).catch(semPermissao)
      id = rows[0].id
    }
    const base = await exigirBase(client, ctx, id)
    await inserirItens(client, ctx, base, modelo.itens, null)
    return { base, itens: await lerItens(client, id) }
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
    return { base: await exigirBase(client, ctx, id), itens: await lerItens(client, id) }
  })
}

/** Item novo na base (com valores iniciais, por exemplo a coluna do quadro onde a pessoa clicou em "+ Novo"). */
export function criarItem(ctx: Contexto, baseId: string, dados: { titulo?: string; propriedades?: Record<string, unknown>; posicao?: number }) {
  return comoPessoa(ctx, async client => {
    await exigirLeitura(client, ctx)
    const base = await exigirBase(client, ctx, baseId, true)
    const valores = semVazios(conferirValores(base.esquema as Propriedade[], dados.propriedades ?? {}))
    const posicao = Number.isFinite(dados.posicao) ? dados.posicao! : await proximaPosicao(client, ctx, baseId, base.espaco)
    const { rows } = await client.query(`INSERT INTO notas.paginas (workspace_id, espaco, parent_id, base_id, posicao, titulo, propriedades)
      VALUES ($1, $2, $3, $3, $4, $5, $6::jsonb) RETURNING ${ITEM}`, [ctx.orgId, base.espaco, baseId, posicao, (dados.titulo ?? '').slice(0, 500), JSON.stringify(valores)]).catch(semPermissao)
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
    const valores = conferirValores(base.esquema as Propriedade[], dados.propriedades ?? {})
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
