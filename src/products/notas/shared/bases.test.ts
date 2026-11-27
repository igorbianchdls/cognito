import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  agrupar, calcular, computar, converterValor, filtrar, modeloDeBase, ordenar, passaNoFiltro, validarEsquema, validarValor, validarVisoes,
  type Item, type Propriedade,
} from './bases'

const esquema: Propriedade[] = [
  { id: 'status', nome: 'Status', tipo: 'status', opcoes: [{ id: 'a', nome: 'A fazer', cor: 'padrao', grupo: 'a_fazer' }, { id: 'b', nome: 'Feito', cor: 'verde', grupo: 'concluido' }] },
  { id: 'valor', nome: 'Valor', tipo: 'numero', formato: 'real' },
  { id: 'tags', nome: 'Tags', tipo: 'multisselecao', opcoes: [{ id: 'x', nome: 'Urgente', cor: 'vermelho' }, { id: 'y', nome: 'Cliente', cor: 'azul' }] },
  { id: 'feito', nome: 'Feito', tipo: 'checkbox' },
  { id: 'prazo', nome: 'Prazo', tipo: 'data' },
  { id: 'obs', nome: 'Obs', tipo: 'texto' },
]
const item = (id: string, titulo: string, propriedades: Record<string, unknown>, posicao = 0): Item =>
  ({ id, titulo, icone: null, posicao, propriedades, created_at: '2026-11-01T10:00:00Z', updated_at: '2026-11-02T10:00:00Z', created_by: 'u1', updated_by: null })
const itens = [
  item('1', 'Proposta Ação', { status: 'a', valor: 300, tags: ['x'], prazo: '2026-12-01', obs: 'ligar amanhã' }, 3),
  item('2', 'Contrato', { status: 'b', valor: 100, tags: ['x', 'y'], feito: true }, 1),
  item('3', 'Orçamento', { valor: 200 }, 2),
]

test('validarValor normaliza e recusa valores fora do tipo', () => {
  assert.deepEqual(validarValor(esquema[1], '1.234,5'), { ok: true, valor: 1234.5 })
  assert.equal(validarValor(esquema[1], 'abc').ok, false)
  assert.deepEqual(validarValor(esquema[0], 'b'), { ok: true, valor: 'b' })
  assert.equal(validarValor(esquema[0], 'zzz').ok, false)
  assert.deepEqual(validarValor(esquema[2], ['x', 'x', 'y']), { ok: true, valor: ['x', 'y'] })
  assert.deepEqual(validarValor(esquema[3], null), { ok: true, valor: false })
  assert.equal(validarValor(esquema[4], '2026-02-30x').ok, false)
  assert.equal(validarValor({ id: 'e', nome: 'E-mail', tipo: 'email' }, 'sem-arroba').ok, false)
  assert.equal(validarValor({ id: 'c', nome: 'Criado', tipo: 'criado_em' }, '2026-01-01').ok, false)
})

test('validarEsquema recusa nomes repetidos, ids inválidos e dá grupo ao status', () => {
  assert.equal(validarEsquema([{ id: 'a', nome: 'X', tipo: 'texto' }, { id: 'b', nome: 'x', tipo: 'numero' }]).ok, false)
  assert.equal(validarEsquema([{ id: 'titulo', nome: 'X', tipo: 'texto' }]).ok, false)
  assert.equal(validarEsquema([{ id: 'a', nome: 'X', tipo: 'inexistente' }]).ok, false)
  const r = validarEsquema([{ id: 's', nome: 'S', tipo: 'status', opcoes: [{ id: 'o', nome: 'O', cor: 'azul' }] }, { id: 'n', nome: 'N', tipo: 'numero' }])
  assert.ok(r.ok)
  if (r.ok) { assert.equal(r.valor[0].opcoes?.[0].grupo, 'a_fazer'); assert.equal(r.valor[1].formato, 'numero') }
})

test('validarVisoes descarta propriedades que sumiram e escolhe a coluna do quadro', () => {
  const r = validarVisoes([{ id: 'v', nome: 'Q', tipo: 'quadro', visiveis: ['valor', 'sumiu'], filtros: [{ prop: 'sumiu', operador: 'igual' }], ordenacao: [] }], esquema)
  assert.ok(r.ok)
  if (r.ok) { assert.deepEqual(r.valor[0].visiveis, ['valor']); assert.equal(r.valor[0].filtros.length, 0); assert.equal(r.valor[0].agruparPor, 'status') }
  assert.equal(validarVisoes([], esquema).ok, false)
})

test('converterValor: texto vira opção (criando), opção vira texto, número inválido fica vazio', () => {
  const texto: Propriedade = { id: 'p', nome: 'P', tipo: 'texto' }
  const selecao: Propriedade = { id: 'p', nome: 'P', tipo: 'selecao', opcoes: [{ id: 'k', nome: 'Alta', cor: 'vermelho' }] }
  assert.deepEqual(converterValor(texto, selecao, 'alta'), { valor: 'k', opcoesNovas: [] })
  const nova = converterValor(texto, selecao, 'Baixa')
  assert.equal(nova.opcoesNovas.length, 1)
  assert.equal(nova.valor, nova.opcoesNovas[0].id)
  assert.deepEqual(converterValor(selecao, texto, 'k'), { valor: 'Alta', opcoesNovas: [] })
  assert.deepEqual(converterValor(texto, { id: 'p', nome: 'P', tipo: 'numero' }, 'R$ dez'), { valor: null, opcoesNovas: [] })
  assert.deepEqual(converterValor(texto, { id: 'p', nome: 'P', tipo: 'numero' }, '1.500,25'), { valor: 1500.25, opcoesNovas: [] })
  const multi = converterValor(texto, { id: 'p', nome: 'P', tipo: 'multisselecao', opcoes: [] }, 'a, b, a')
  assert.equal((multi.valor as string[]).length, 2)
  assert.deepEqual(converterValor(esquema[2], { ...esquema[2], tipo: 'selecao' }, ['y', 'x']), { valor: 'y', opcoesNovas: [] })
})

test('filtros: texto sem acento, número, opções, data, checkbox, "e" e "ou"', () => {
  assert.ok(passaNoFiltro(itens[0], { prop: 'titulo', operador: 'contem', valor: 'acao' }, esquema))
  assert.ok(passaNoFiltro(itens[0], { prop: 'valor', operador: 'maior', valor: 250 }, esquema))
  assert.ok(!passaNoFiltro(itens[2], { prop: 'status', operador: 'igual', valor: 'a' }, esquema))
  assert.ok(passaNoFiltro(itens[2], { prop: 'status', operador: 'vazio' }, esquema))
  assert.ok(passaNoFiltro(itens[1], { prop: 'tags', operador: 'tem', valor: 'y' }, esquema))
  assert.ok(passaNoFiltro(itens[0], { prop: 'prazo', operador: 'antes', valor: '2026-12-02' }, esquema))
  assert.ok(passaNoFiltro(itens[1], { prop: 'feito', operador: 'marcado' }, esquema))
  assert.ok(passaNoFiltro(itens[0], { prop: 'obs', operador: 'contem', valor: '' }, esquema), 'filtro sem valor não filtra')
  const f = [{ prop: 'valor', operador: 'maior' as const, valor: 150 }, { prop: 'tags', operador: 'tem' as const, valor: 'y' }]
  assert.deepEqual(filtrar(itens, { filtros: f, juncao: 'e' }, esquema).map(i => i.id), [])
  assert.deepEqual(filtrar(itens, { filtros: f, juncao: 'ou' }, esquema).map(i => i.id), ['1', '2', '3'])
  assert.deepEqual(filtrar(itens, { filtros: [], juncao: 'e' }, esquema, 'urgente').map(i => i.id), ['1', '2'])
})

test('ordenar: por número, por opção (ordem do esquema), vazios no fim e posição como desempate', () => {
  assert.deepEqual(ordenar(itens, [{ prop: 'valor', direcao: 'desc' }], esquema).map(i => i.id), ['1', '3', '2'])
  assert.deepEqual(ordenar(itens, [{ prop: 'status', direcao: 'asc' }], esquema).map(i => i.id), ['1', '2', '3'])
  assert.deepEqual(ordenar(itens, [{ prop: 'status', direcao: 'desc' }], esquema).map(i => i.id), ['2', '1', '3'])
  assert.deepEqual(ordenar(itens, [], esquema).map(i => i.id), ['2', '3', '1'])
})

test('agrupar: coluna "Sem status" primeiro e uma por opção', () => {
  const grupos = agrupar(itens, 'status', esquema)
  assert.deepEqual(grupos.map(g => [g.id, g.itens.map(i => i.id)]), [['', ['3']], ['a', ['1']], ['b', ['2']]])
  assert.equal(agrupar(itens, 'valor', esquema).length, 1)
})

test('calcular: soma, média, únicos, % marcados', () => {
  assert.equal(calcular(itens, 'valor', 'soma', esquema), 600)
  assert.equal(calcular(itens, 'valor', 'media', esquema), 200)
  assert.equal(calcular(itens, 'tags', 'unicos', esquema), 2)
  assert.equal(calcular(itens, 'status', 'vazios', esquema), 1)
  assert.equal(Math.round(calcular(itens, 'feito', 'pct_marcados', esquema)!), 33)
  assert.equal(calcular([], 'valor', 'media', esquema), null)
})

test('modelos de base passam na validação', () => {
  for (const [modelo, visao] of [['tarefas', 'quadro'], ['vazia', 'tabela'], ['vazia', 'quadro'], ['vazia', 'lista']] as const) {
    const m = modeloDeBase(modelo, visao)
    const e = validarEsquema(m.esquema)
    assert.ok(e.ok)
    if (e.ok) assert.ok(validarVisoes(m.visoes, e.valor).ok)
    assert.equal(m.visoes[0].tipo, visao)
  }
})

test('relação, agregação e fórmula calculadas juntas (e fórmula que usa outra fórmula)', () => {
  const B = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
  const tarefas = { id: B, titulo: 'Tarefas', esquema: [{ id: 'horas', nome: 'Horas', tipo: 'numero' as const }, { id: 'ok', nome: 'Feita', tipo: 'checkbox' as const }],
    itens: [item('11111111-1111-4111-8111-111111111111', 'Roteiro', { horas: 3, ok: true }), item('22222222-2222-4222-8222-222222222222', 'Gravação', { horas: 5 })] }
  const esq: Propriedade[] = [
    { id: 'rel', nome: 'Tarefas', tipo: 'relacao', baseRelacionada: B },
    { id: 'total', nome: 'Horas totais', tipo: 'agregacao', relacao: 'rel', alvo: 'horas', calculo: 'soma' },
    { id: 'nomes', nome: 'Quais', tipo: 'agregacao', relacao: 'rel', alvo: 'titulo', calculo: 'mostrar' },
    { id: 'pct', nome: 'Feitas %', tipo: 'agregacao', relacao: 'rel', alvo: 'ok', calculo: 'pct_marcados' },
    { id: 'custo', nome: 'Custo', tipo: 'formula', expressao: 'prop("Horas totais") * prop("Valor hora")' },
    { id: 'vh', nome: 'Valor hora', tipo: 'numero' },
    { id: 'resumo', nome: 'Resumo', tipo: 'formula', expressao: 'concat(prop("Nome"), ": ", prop("Custo"), " (", prop("Quais"), ")")' },
    { id: 'ciclo', nome: 'Ciclo', tipo: 'formula', expressao: 'prop("Ciclo") + 1' },
  ]
  assert.ok(validarEsquema(esq).ok)
  const [r] = computar([item('p', 'Vídeo', { rel: [tarefas.itens[0].id, tarefas.itens[1].id], vh: 100 })], esq, [tarefas])
  assert.equal(r.propriedades.total, 8)
  assert.equal(r.propriedades.nomes, 'Roteiro, Gravação')
  assert.equal(r.propriedades.pct, 50)
  assert.equal(r.propriedades.custo, 800)
  assert.equal(r.propriedades.resumo, 'Vídeo: 800 (Roteiro, Gravação)')
  assert.equal(r.propriedades.ciclo, null)
  // Filtrar e ordenar pelo valor calculado.
  const itensCalc = computar([item('a', 'A', { rel: [tarefas.itens[0].id], vh: 10 }), item('b', 'B', { rel: [tarefas.itens[1].id], vh: 10 })], esq, [tarefas])
  assert.deepEqual(ordenar(itensCalc, [{ prop: 'custo', direcao: 'desc' }], esq).map(i => i.id), ['b', 'a'])
  assert.deepEqual(filtrar(itensCalc, { filtros: [{ prop: 'custo', operador: 'maior', valor: 40 }], juncao: 'e' }, esq).map(i => i.id), ['b'])
  assert.equal(validarEsquema([{ id: 'f', nome: 'F', tipo: 'formula', expressao: 'prop("X" +' }]).ok, false)
  assert.equal(validarEsquema([{ id: 'r', nome: 'R', tipo: 'relacao' }]).ok, false)
})

test('etapa 6: diferença de ids, subitens, período da linha do tempo e lembretes', async () => {
  const { diferencaIds, hierarquia, periodoDoItem, lembretesDevidos, somarDias } = await import('./bases')
  assert.deepEqual(diferencaIds(['a', 'b'], ['b', 'c']), { entraram: ['c'], sairam: ['a'] })
  const a = item('a', 'Projeto', {}, 1), b = item('b', 'Fase 1', { pai: ['a'] }, 2), c = item('c', 'Tarefa', { pai: ['b'] }, 3), d = item('d', 'Solta', { pai: ['x'] }, 4)
  assert.deepEqual(hierarquia([a, b, c, d], 'pai').map(h => [h.item.id, h.nivel, h.temFilhos]), [['a', 0, true], ['b', 1, true], ['c', 2, false], ['d', 0, false]])
  const ciclo = hierarquia([item('p', 'P', { pai: ['q'] }), item('q', 'Q', { pai: ['p'] })], 'pai')
  assert.equal(ciclo.length, 2, 'ciclo não some com itens')
  const esq: Propriedade[] = [{ id: 'ini', nome: 'Início', tipo: 'data' }, { id: 'fim', nome: 'Fim', tipo: 'data', lembrete: 'um_dia_antes' }, { id: 'resp', nome: 'Resp', tipo: 'pessoa' }]
  assert.deepEqual(periodoDoItem(item('1', 'x', { ini: '2026-12-01', fim: '2026-12-05' }), 'ini', 'fim', esq), { inicio: '2026-12-01', fim: '2026-12-05' })
  assert.deepEqual(periodoDoItem(item('1', 'x', { ini: '2026-12-05', fim: '2026-12-01' }), 'ini', 'fim', esq), { inicio: '2026-12-05', fim: '2026-12-05' })
  assert.equal(periodoDoItem(item('1', 'x', {}), 'ini', 'fim', esq), null)
  assert.equal(somarDias('2026-12-31', 1), '2027-01-01')
  const devidos = lembretesDevidos([item('1', 'Entrega', { fim: '2026-12-02', resp: ['bia'] }), item('2', 'Outra', { fim: '2026-12-09' })], esq, '2026-12-01')
  assert.deepEqual(devidos.map(x => [x.item.id, x.para]), [['1', ['bia']]])
})
