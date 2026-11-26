// Testes de integração das Notas no banco local (scripts/notas/banco-local.sh): chamam o código real do servidor,
// como cada pessoa, para conferir SQL, gatilhos e as permissões do banco. Sem NOTAS_TEST_DB_URL, são pulados.
import { after, before, describe, test } from 'node:test'
import assert from 'node:assert/strict'

const url = process.env.NOTAS_TEST_DB_URL
const pular = !url
if (url) process.env.SUPABASE_DB_URL = url

const ana = { userId: 'ana', orgId: 'org_a' }   // dona
const bia = { userId: 'bia', orgId: 'org_a' }   // membro
const vic = { userId: 'vic', orgId: 'org_a' }   // só visualiza
const edu = { userId: 'edu', orgId: 'org_b' }   // outra empresa

type Modulos = typeof import('./paginas') & typeof import('./bases') & typeof import('./db')
let m: Modulos

const rejeita = async (promessa: Promise<unknown>, status: number) => {
  await assert.rejects(promessa, (e: { status?: number; message?: string }) => { assert.equal(e.status, status, e.message); return true })
}

describe('Notas no banco (integração)', { skip: pular ? 'defina NOTAS_TEST_DB_URL (scripts/notas/banco-local.sh)' : false }, () => {
  before(async () => { m = { ...await import('./paginas'), ...await import('./bases'), ...await import('./db') } as Modulos })
  after(async () => { await m.encerrarConexoes?.() })

  test('criar, ler, editar com versão e conflito', async () => {
    const p = await m.criarPagina(ana, { titulo: 'Plano' })
    assert.equal(p.titulo, 'Plano'); assert.equal(p.espaco, 'equipe'); assert.equal(p.pode_editar, true)
    const salva = await m.atualizarPagina(ana, p.id, p.versao, { conteudo: [{ type: 'paragraph', content: [{ type: 'text', text: 'olá mundo', styles: {} }] }] })
    assert.equal(salva.versao, p.versao + 1)
    await rejeita(m.atualizarPagina(bia, p.id, p.versao, { titulo: 'Outro' }), 409)
    const renomeada = await m.atualizarPagina(bia, p.id, null, { titulo: 'Plano 2027' })
    assert.equal(renomeada.titulo, 'Plano 2027')
    const busca = await m.buscar(ana, 'mundo') as { id: string }[]
    assert.ok(busca.some(r => r.id === p.id))
  })

  test('espaço particular só a dona vê; viewer não edita a equipe; outra empresa não vê nada', async () => {
    const minha = await m.criarPagina(ana, { espaco: 'particular', titulo: 'Diário' })
    const equipe = await m.criarPagina(ana, { titulo: 'Wiki' })
    await rejeita(m.obterPagina(bia, minha.id), 404)
    assert.equal((await m.obterPagina(vic, equipe.id)).pode_editar, false)
    await rejeita(m.atualizarPagina(vic, equipe.id, null, { titulo: 'x' }), 403)
    await rejeita(m.criarPagina(vic, { titulo: 'x' }), 403)
    await rejeita(m.obterPagina(edu, equipe.id), 404)
    const arvoreVic = await m.arvore(vic)
    assert.equal(arvoreVic.pode_editar_equipe, false)
    assert.ok(!arvoreVic.paginas.some(p => p.id === minha.id))
  })

  test('subpáginas, mover sem ciclo, duplicar, lixeira e restaurar', async () => {
    const mae = await m.criarPagina(ana, { titulo: 'Mãe' })
    const filha = await m.criarPagina(ana, { parent_id: mae.id, titulo: 'Filha' })
    const neta = await m.criarPagina(ana, { parent_id: filha.id, titulo: 'Neta' })
    await rejeita(m.moverPagina(ana, mae.id, { parent_id: neta.id, espaco: 'equipe', posicao: 1 }), 409)
    const copia = await m.duplicarPagina(ana, mae.id)
    const arvore = await m.arvore(ana)
    assert.equal(arvore.paginas.filter(p => p.parent_id === copia.id).length, 1)
    await m.arquivarPagina(ana, mae.id)
    assert.ok(!(await m.arvore(ana)).paginas.some(p => p.id === neta.id))
    assert.ok((await m.lixeira(ana) as { id: string }[]).some(i => i.id === mae.id))
    await m.restaurarPagina(ana, mae.id)
    assert.ok((await m.arvore(ana)).paginas.some(p => p.id === neta.id))
    await rejeita(m.apagarPagina(ana, mae.id), 409)
  })

  test('base: modelo tarefas, item, células validadas, conversão de tipo e exclusão de propriedade', async () => {
    const { base, itens } = await m.criarBase(ana, { modelo: 'tarefas', visao: 'quadro' })
    assert.equal(base.tipo, 'base'); assert.equal(itens.length, 3)
    const item = await m.criarItem(bia, base.id, { titulo: 'Gravar vídeo', propriedades: { status: 'em-andamento', prazo: '2026-12-10' } })
    assert.equal(item.propriedades.status, 'em-andamento')
    await rejeita(m.alterarItem(bia, item.id, { propriedades: { status: 'inexistente' } }), 400)
    await rejeita(m.alterarItem(vic, item.id, { propriedades: { status: 'concluida' } }), 403)
    const mudado = await m.alterarItem(bia, item.id, { propriedades: { prioridade: 'alta', prazo: null } })
    assert.equal(mudado.propriedades.prioridade, 'alta'); assert.equal(mudado.propriedades.prazo, undefined)
    // Prioridade (seleção) vira texto: o valor vira o nome da opção.
    const esquema = base.esquema.map(p => p.id === 'prioridade' ? { id: p.id, nome: p.nome, tipo: 'texto' as const } : p)
    const depois = await m.alterarBase(ana, base.id, { esquema })
    assert.equal(depois.itens.find(i => i.id === item.id)?.propriedades.prioridade, 'Alta')
    // E volta a seleção: cria a opção "Alta".
    const volta = await m.alterarBase(ana, base.id, { esquema: depois.base.esquema.map(p => p.id === 'prioridade' ? { ...p, tipo: 'selecao' as const, opcoes: [] } : p) })
    const prop = volta.base.esquema.find(p => p.id === 'prioridade')!
    assert.deepEqual(prop.opcoes?.map(o => o.nome).sort(), ['Alta', 'Baixa', 'Média'])
    assert.equal(volta.itens.find(i => i.id === item.id)?.propriedades.prioridade, prop.opcoes!.find(o => o.nome === 'Alta')!.id)
    const sem = await m.alterarBase(ana, base.id, { esquema: volta.base.esquema.filter(p => p.id !== 'prazo') })
    assert.ok(sem.itens.every(i => i.propriedades.prazo === undefined))
    assert.ok(sem.base.visoes.every(v => !v.visiveis.includes('prazo')))
  })

  test('itens: árvore esconde, página não entra numa base, "+" numa base cria item, lixeira junto com a base', async () => {
    const { base } = await m.criarBase(ana, { modelo: 'vazia', visao: 'tabela' })
    const solta = await m.criarPagina(ana, { titulo: 'Solta' })
    await rejeita(m.moverPagina(ana, solta.id, { parent_id: base.id, espaco: 'equipe', posicao: 1 }), 409)
    const viaMais = await m.criarPagina(ana, { parent_id: base.id, titulo: 'Item pelo +' })
    assert.equal(viaMais.base_id, base.id)
    await rejeita(m.criarPagina(ana, { parent_id: viaMais.id }), 409)
    const { itens } = await m.obterBase(ana, base.id)
    assert.equal(itens.length, 4)
    await m.arquivarPagina(ana, base.id)
    await rejeita(m.obterBase(ana, base.id), 404)
    await m.restaurarPagina(ana, base.id)
    assert.equal((await m.obterBase(ana, base.id)).itens.length, 4)
  })

  test('página vazia vira base; página com texto não', async () => {
    const vazia = await m.criarPagina(ana, { titulo: 'Projetos' })
    const { base } = await m.criarBase(ana, { modelo: 'vazia', visao: 'quadro', converter: vazia.id })
    assert.equal(base.id, vazia.id); assert.equal(base.tipo, 'base')
    const cheia = await m.criarPagina(ana, {})
    await m.atualizarPagina(ana, cheia.id, null, { titulo: 'x' })
    const comTexto = await m.atualizarPagina(ana, cheia.id, (await m.obterPagina(ana, cheia.id)).versao, { conteudo: [{ type: 'paragraph', content: [{ type: 'text', text: 'texto', styles: {} }] }] })
    await rejeita(m.criarBase(ana, { modelo: 'vazia', visao: 'tabela', converter: comTexto.id }), 409)
  })
})
