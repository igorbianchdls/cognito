// Testes de integração dos artefatos no banco local (scripts/notas/banco-local.sh): criar, ler, versões, permissões,
// lixeira, duplicar e link público, chamando o código real do servidor como cada pessoa. Sem NOTAS_TEST_DB_URL, pulados.
import { after, before, describe, test } from 'node:test'
import assert from 'node:assert/strict'

const url = process.env.NOTAS_TEST_DB_URL
if (url) process.env.SUPABASE_DB_URL = url

const ana = { userId: 'ana', orgId: 'org_a' }   // dona
const bia = { userId: 'bia', orgId: 'org_a' }   // membro
const vic = { userId: 'vic', orgId: 'org_a' }   // só visualiza
const edu = { userId: 'edu', orgId: 'org_b' }   // outra empresa

type Modulos = typeof import('./artefatos') & typeof import('./paginas') & typeof import('./db') & typeof import('./compartilhamento') & typeof import('./publico')
let m: Modulos
const rejeita = async (promessa: Promise<unknown>, status: number) => {
  await assert.rejects(promessa, (e: { status?: number; message?: string }) => { assert.equal(e.status, status, e.message); return true })
}
const HTML = '<!doctype html><html><head><title>Painel de vendas</title><style>h1{color:red}</style></head><body><h1>Vendas de novembro</h1><script>document.title="x"</script></body></html>'

describe('Artefatos no banco (integração)', { skip: url ? false : 'defina NOTAS_TEST_DB_URL (scripts/notas/banco-local.sh)' }, () => {
  before(async () => { m = { ...await import('./artefatos'), ...await import('./paginas'), ...await import('./db'), ...await import('./compartilhamento'), ...await import('./publico') } as Modulos })
  after(async () => { await m.encerrarConexoes?.() })

  test('criar usa o <title>, guarda a versão 1 e entra na busca e na árvore', async () => {
    const a = await m.criarArtefato(ana, { html: HTML })
    assert.equal(a.titulo, 'Painel de vendas'); assert.equal(a.versao, 1); assert.equal(a.html, HTML); assert.equal(a.pode_editar, true)
    const versoes = await m.versoesDoArtefato(ana, a.id)
    assert.equal(versoes.length, 1); assert.equal(versoes[0].resumo, 'Criado')
    assert.ok((await m.buscar(ana, 'novembro') as { id: string }[]).some(r => r.id === a.id), 'o texto visível entra na busca')
    assert.ok(!(await m.buscar(ana, 'document.title') as { id: string }[]).some(r => r.id === a.id), 'o script não entra na busca')
    const arvore = await m.arvore(ana)
    assert.equal(arvore.paginas.find(p => p.id === a.id)?.tipo, 'artefato')
  })

  test('atualizar cria versões; versão base antiga recusa; restaurar vira versão nova', async () => {
    const a = await m.criarArtefato(ana, { titulo: 'Calculadora', html: '<p>v1</p>' })
    const v2 = await m.atualizarArtefato(bia, a.id, { html: '<p>v2</p>', resumo: 'Botão de limpar', versaoBase: 1 })
    assert.equal(v2.versao, 2); assert.equal(v2.html, '<p>v2</p>')
    await rejeita(m.atualizarArtefato(ana, a.id, { html: '<p>conflito</p>', versaoBase: 1 }), 409)
    const restaurada = await m.restaurarVersaoArtefato(ana, a.id, 1)
    assert.equal(restaurada.versao, 3); assert.equal(restaurada.html, '<p>v1</p>')
    const versoes = await m.versoesDoArtefato(ana, a.id)
    assert.deepEqual(versoes.map(v => v.versao), [3, 2, 1])
    assert.equal(versoes[1].resumo, 'Botão de limpar'); assert.equal(versoes[1].created_by, 'bia')
    assert.equal((await m.versaoArtefato(ana, a.id, 2)).html, '<p>v2</p>')
  })

  test('HTML vazio ou acima de 1 MB é recusado', async () => {
    await rejeita(m.criarArtefato(ana, { html: '   ' }), 400)
    await rejeita(m.criarArtefato(ana, { html: 'x'.repeat(1024 * 1024 + 1) }), 400)
  })

  test('permissões: quem só visualiza lê mas não grava; outra empresa não vê; particular só a dona', async () => {
    const a = await m.criarArtefato(ana, { titulo: 'Da equipe', html: '<p>oi</p>' })
    assert.equal((await m.lerArtefato(vic, a.id)).html, '<p>oi</p>')
    await rejeita(m.atualizarArtefato(vic, a.id, { html: '<p>não</p>' }), 403)
    await rejeita(m.criarArtefato(vic, { html: '<p>não</p>' }), 403)
    await rejeita(m.lerArtefato(edu, a.id), 404)
    assert.ok(!(await m.listarArtefatos(edu)).some(x => x.id === a.id))
    const particular = await m.criarArtefato(ana, { titulo: 'Só meu', html: '<p>segredo</p>', espaco: 'particular' })
    await rejeita(m.lerArtefato(bia, particular.id), 404)
    assert.ok(!(await m.listarArtefatos(bia)).some(x => x.id === particular.id))
    assert.ok((await m.listarArtefatos(ana, { busca: 'segredo' })).some(x => x.id === particular.id))
    // Direto no banco, como a pessoa: a política também segura.
    await rejeita(m.comoPessoa(vic, c => c.query("UPDATE notas.artefatos SET html = 'x' WHERE pagina_id = $1 RETURNING 1", [a.id])
      .then((r: { rowCount: number | null }) => { if (!r.rowCount) throw Object.assign(new Error('nada mudou'), { status: 403 }) })), 403)
  })

  test('dentro de uma página herda o espaço; não entra em base; lixeira, duplicar e link público', async () => {
    const mae = await m.criarPagina(ana, { titulo: 'Relatórios', espaco: 'particular' })
    const a = await m.criarArtefato(ana, { titulo: 'Gráfico', html: '<p>g</p>', parent_id: mae.id, espaco: 'equipe' })
    assert.equal(a.espaco, 'particular'); assert.equal(a.parent_id, mae.id)
    const base = await m.consultaDoServidor<{ id: string }>("INSERT INTO notas.paginas (workspace_id, espaco, titulo, tipo, created_by) VALUES ('org_a', 'equipe', 'B', 'base', 'ana') RETURNING id", [])
    await rejeita(m.criarArtefato(ana, { html: '<p>x</p>', parent_id: base[0].id }), 409)
    const copia = await m.duplicarPagina(ana, a.id)
    assert.equal((await m.lerArtefato(ana, copia.id)).html, '<p>g</p>')
    await m.arquivarPagina(ana, a.id)
    assert.ok(!(await m.listarArtefatos(ana)).some(x => x.id === a.id))
    const publicado = await m.criarArtefato(ana, { titulo: 'Público', html: '<p>pra todos</p>' })
    const c = await m.alterarCompartilhamento(ana, publicado.id, { publica: true })
    assert.equal((await m.lerPaginaPublica(c.token!)).html, '<p>pra todos</p>')
  })

  test('ferramentas MCP: criar, ler em partes, trocar trecho, conflito de versão e listar', async () => {
    const { notasTools } = await import('../../mcpcore/domains/notas/tools/catalog')
    const ferramenta = (nome: string) => notasTools.find(t => t.name === nome)!
    const como = (userId: string) => ({ as: <T>(fn: (m: never) => Promise<T>) => fn({ db: null, ws: 'org_a', role: 'owner', userId } as never), origin: 'https://otto.test', assistant: 'Claude' })
    const rodar = async (nome: string, entrada: object, userId = 'ana') => {
      const t = ferramenta(nome)
      return await (t.run as (i: unknown, c: unknown) => Promise<Record<string, any>>)(t.schema.parse({ ...entrada }), como(userId)) // eslint-disable-line @typescript-eslint/no-explicit-any
    }
    const grande = `<html><body><h1>Relatório MCP</h1>${'<p>linha</p>'.repeat(20000)}</body></html>`
    const { artefato } = await rodar('notas_criar_artefato', { html: grande, icone: '📊', resumo: 'Primeira versão' })
    assert.equal(artefato.titulo, 'Artefato'); assert.equal(artefato.versao, 1); assert.match(artefato.link, /^https:\/\/otto\.test\/artefatos\//)
    const parte1 = await rodar('notas_ler_artefato', { artefato_id: artefato.id })
    assert.ok(parte1.proximo_inicio > 0, 'HTML grande vem em partes')
    const parte2 = await rodar('notas_ler_artefato', { artefato_id: artefato.id, inicio: parte1.proximo_inicio })
    assert.equal(parte1.html + parte2.html, grande)
    const trocado = await rodar('notas_atualizar_artefato', { artefato_id: artefato.id, versao_base: 1, substituicoes: [{ antigo: '<h1>Relatório MCP</h1>', novo: '<h1>Relatório de vendas</h1>' }], resumo: 'Novo título', titulo: 'Relatório' })
    assert.equal(trocado.artefato.versao, 2); assert.equal(trocado.artefato.titulo, 'Relatório')
    await assert.rejects(rodar('notas_atualizar_artefato', { artefato_id: artefato.id, versao_base: 1, html: '<p>velho</p>', resumo: 'x' }), (e: { code?: string }) => e.code === 'VERSION_CONFLICT')
    await assert.rejects(rodar('notas_atualizar_artefato', { artefato_id: artefato.id, resumo: 'x' }), (e: { code?: string }) => e.code === 'INVALID_INPUT')
    await assert.rejects(rodar('notas_atualizar_artefato', { artefato_id: artefato.id, substituicoes: [{ antigo: '<p>linha</p>', novo: '' }], resumo: 'x' }), (e: { code?: string }) => e.code === 'INVALID_INPUT')
    await assert.rejects(rodar('notas_atualizar_artefato', { artefato_id: artefato.id, html: '<p>não</p>', resumo: 'x' }, 'vic'), (e: { code?: string }) => e.code === 'ACCESS_DENIED')
    const { artefatos } = await rodar('notas_listar_artefatos', { busca: 'vendas' })
    assert.ok(artefatos.some((a: { id: string; versao: number }) => a.id === artefato.id && a.versao === 2))
    const lido = await rodar('notas_ler_artefato', { artefato_id: artefato.id })
    assert.equal(lido.artefato.versao, 2)
    assert.ok(Buffer.byteLength(JSON.stringify(lido)) < 256 * 1024, 'a resposta cabe no limite do MCP')
  })
})
