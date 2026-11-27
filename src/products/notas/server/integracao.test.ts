// Testes de integração das Notas no banco local (scripts/notas/banco-local.sh): chamam o código real do servidor,
// como cada pessoa, para conferir SQL, gatilhos e as permissões do banco. Sem NOTAS_TEST_DB_URL, são pulados.
import { after, before, describe, test } from 'node:test'
import assert from 'node:assert/strict'
import * as Y from 'yjs'

const url = process.env.NOTAS_TEST_DB_URL
const pular = !url
if (url) process.env.SUPABASE_DB_URL = url

const ana = { userId: 'ana', orgId: 'org_a' }   // dona
const bia = { userId: 'bia', orgId: 'org_a' }   // membro
const vic = { userId: 'vic', orgId: 'org_a' }   // só visualiza
const edu = { userId: 'edu', orgId: 'org_b' }   // outra empresa

type Modulos = typeof import('./paginas') & typeof import('./bases') & typeof import('./db') & typeof import('./versoes')
  & typeof import('./compartilhamento') & typeof import('./comentarios') & typeof import('./publico') & typeof import('./notificacoes')
let m: Modulos

const rejeita = async (promessa: Promise<unknown>, status: number) => {
  await assert.rejects(promessa, (e: { status?: number; message?: string }) => { assert.equal(e.status, status, e.message); return true })
}

describe('Notas no banco (integração)', { skip: pular ? 'defina NOTAS_TEST_DB_URL (scripts/notas/banco-local.sh)' : false }, () => {
  before(async () => { m = { ...await import('./paginas'), ...await import('./bases'), ...await import('./db'), ...await import('./versoes'), ...await import('./compartilhamento'), ...await import('./comentarios'), ...await import('./publico'), ...await import('./notificacoes') } as Modulos })
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
    const { base: criada, itens } = await m.criarBase(ana, { modelo: 'tarefas', visao: 'quadro' })
    const base = criada
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

  test('etapa 3: relação entre bases, ids de fora recusados, bases ligadas devolvidas', async () => {
    const { base: clientes } = await m.criarBase(ana, { modelo: 'vazia', visao: 'tabela', titulo: 'Clientes' })
    const cli = await m.criarItem(ana, clientes.id, { titulo: 'Padaria Sol' })
    const { base: projetos } = await m.criarBase(ana, { modelo: 'vazia', visao: 'tabela', titulo: 'Projetos' })
    const esquema = [...projetos.esquema, { id: 'cliente', nome: 'Cliente', tipo: 'relacao' as const, baseRelacionada: clientes.id },
      { id: 'qtd', nome: 'Qtd clientes', tipo: 'agregacao' as const, relacao: 'cliente', alvo: 'titulo', calculo: 'contar' as const },
      { id: 'f', nome: 'Rótulo', tipo: 'formula' as const, expressao: 'concat(prop("Nome"), " / ", prop("Cliente"))' }]
    const alterada = await m.alterarBase(ana, projetos.id, { esquema })
    assert.equal(alterada.ligadas.length, 1); assert.equal(alterada.ligadas[0].itens.length, 4)
    const proj = await m.criarItem(ana, projetos.id, { titulo: 'Site', propriedades: { cliente: [cli.id] } })
    assert.deepEqual(proj.propriedades.cliente, [cli.id])
    await rejeita(m.criarItem(ana, projetos.id, { propriedades: { cliente: [proj.id] } }), 400)
    await rejeita(m.alterarItem(ana, proj.id, { propriedades: { f: 'x' } }), 400)
    await rejeita(m.alterarBase(ana, projetos.id, { esquema: [{ id: 'r', nome: 'R', tipo: 'relacao', baseRelacionada: '00000000-0000-4000-8000-000000000000' }] }), 400)
    await rejeita(m.alterarBase(ana, projetos.id, { esquema: [{ id: 'f', nome: 'F', tipo: 'formula', expressao: 'prop(' }] }), 400)
  })

  test('etapa 3: modelos de item', async () => {
    const { base } = await m.criarBase(ana, { modelo: 'tarefas', visao: 'tabela' })
    const modelo = await m.criarItem(ana, base.id, { e_modelo: true, titulo: 'Bug', propriedades: { prioridade: 'alta' } })
    assert.equal(modelo.e_modelo, true)
    await m.atualizarPagina(ana, modelo.id, null, { icone: '🐞' })
    const doModelo = await m.criarItem(bia, base.id, { modelo_id: modelo.id, titulo: 'Erro no login' })
    assert.equal(doModelo.icone, '🐞'); assert.equal(doModelo.propriedades.prioridade, 'alta'); assert.equal(doModelo.e_modelo, false)
    assert.ok(!(await m.arvore(ana)).paginas.some(p => p.id === modelo.id))
  })

  test('etapa 3: histórico guarda versões, só uma a cada 10 min por pessoa, e restaura', async () => {
    const p = await m.criarPagina(ana, { titulo: 'Contrato' })
    const texto = (t: string) => [{ type: 'paragraph', content: [{ type: 'text', text: t, styles: {} }] }]
    let atual = await m.atualizarPagina(ana, p.id, p.versao, { conteudo: texto('versão A') })
    atual = await m.atualizarPagina(ana, p.id, atual.versao, { conteudo: texto('versão B') })
    await m.atualizarPagina(bia, p.id, atual.versao, { conteudo: texto('versão C') })
    const versoes = await m.listarVersoes(ana, p.id)
    assert.equal(versoes.length, 2, 'uma foto da ana (antes de A) e uma da bia (antes de C)')
    const daBia = await m.obterVersao(ana, p.id, versoes[0].id)
    assert.match(JSON.stringify(daBia.conteudo), /versão B/)
    const restaurada = await m.restaurarVersao(ana, p.id, versoes[0].id)
    assert.match(JSON.stringify(restaurada.conteudo), /versão B/)
    assert.equal((await m.listarVersoes(ana, p.id)).length, 3)
    await rejeita(m.restaurarVersao(vic, p.id, versoes[0].id), 403)
    await rejeita(m.listarVersoes(edu, p.id), 404)
  })

  test('etapa 4: edição simultânea funde os documentos de duas pessoas; geração antiga é recusada', async () => {
    const p = await m.criarPagina(ana, { titulo: 'Juntos' })
    const docA = new Y.Doc(), docB = new Y.Doc()
    docA.getText('t').insert(0, 'da Ana. ')
    docB.getText('t').insert(0, 'da Bia. ')
    const b64 = (d: Y.Doc) => Buffer.from(Y.encodeStateAsUpdate(d)).toString('base64')
    await m.atualizarPagina(ana, p.id, null, { estado_yjs: b64(docA), geracao_yjs: p.geracao_yjs, conteudo: [] })
    const salva = await m.atualizarPagina(bia, p.id, null, { estado_yjs: b64(docB), geracao_yjs: p.geracao_yjs, conteudo: [] })
    const junto = new Y.Doc(); Y.applyUpdate(junto, Buffer.from(salva.estado_yjs!, 'base64'))
    assert.match(junto.getText('t').toString(), /da Ana/); assert.match(junto.getText('t').toString(), /da Bia/)
    // Conteúdo trocado por fora (restaurar versão, modelo): nova geração; quem estava na antiga recebe 409.
    const trocada = await m.atualizarPagina(ana, p.id, null, { titulo: 'Juntos 2' })
    const comConteudo = await m.atualizarPagina(ana, p.id, trocada.versao, { conteudo: [] })
    assert.equal(comConteudo.geracao_yjs, p.geracao_yjs + 1)
    await rejeita(m.atualizarPagina(bia, p.id, null, { estado_yjs: b64(docB), geracao_yjs: p.geracao_yjs }), 409)
  })

  test('etapa 4: comentários — discutir, responder, resolver, só o autor edita e apaga', async () => {
    const p = await m.criarPagina(ana, { titulo: 'Proposta' })
    const d = await m.comentar(vic, p.id, { texto: 'Pode revisar o preço?', bloco_id: 'bloco-1', trecho: 'R$ 100' })
    const r = await m.comentar(ana, p.id, { texto: 'Revisado.', discussao_id: d.id })
    await rejeita(m.comentar(ana, p.id, { texto: 'x', discussao_id: r.id }), 404)
    await rejeita(m.alterarComentario(ana, d.id, { texto: 'mudei' }), 403)
    assert.equal((await m.alterarComentario(ana, d.id, { resolvido: true })).resolvido, true)
    await rejeita(m.apagarComentario(ana, d.id), 404)
    await m.apagarComentario(vic, d.id)
    assert.equal((await m.listarComentarios(ana, p.id)).length, 0, 'a resposta vai junto')
    await rejeita(m.listarComentarios(edu, p.id), 404)
  })

  test('etapa 5: página restrita — só convidados veem, inclusive as subpáginas; nível ver/editar', async () => {
    const p = await m.criarPagina(ana, { titulo: 'Salários' })
    const sub = await m.criarPagina(ana, { parent_id: p.id, titulo: 'Detalhe' })
    await m.alterarCompartilhamento(ana, p.id, { acesso: 'restrito' })
    await rejeita(m.obterPagina(bia, p.id), 404)
    await rejeita(m.obterPagina(bia, sub.id), 404)
    assert.ok(!(await m.arvore(bia)).paginas.some(x => x.id === sub.id))
    await rejeita(m.alterarCompartilhamento(bia, p.id, { acesso: 'empresa' }), 404)
    await m.alterarCompartilhamento(ana, p.id, { convidados: [{ user_id: 'bia', nivel: 'ver' }] })
    assert.equal((await m.obterPagina(bia, sub.id)).pode_editar, false)
    await rejeita(m.atualizarPagina(bia, sub.id, null, { titulo: 'x' }), 403)
    await m.alterarCompartilhamento(ana, p.id, { convidados: [{ user_id: 'bia', nivel: 'editar' }] })
    assert.equal((await m.atualizarPagina(bia, sub.id, null, { titulo: 'Detalhe 2' })).titulo, 'Detalhe 2')
    const neta = await m.criarPagina(bia, { parent_id: sub.id, titulo: 'Da Bia' })
    assert.equal(neta.restricao_id, p.id)
    await rejeita(m.obterPagina(vic, neta.id), 404)
    // Mover para fora da página restrita volta a ser da empresa.
    const solta = await m.moverPagina(ana, sub.id, { parent_id: null, espaco: 'equipe', posicao: 99 })
    assert.equal(solta.restricao_id, null)
    assert.equal((await m.obterPagina(vic, neta.id)).titulo, 'Da Bia')
    await rejeita(m.alterarCompartilhamento(ana, p.id, { convidados: [{ user_id: 'edu', nivel: 'ver' }] }), 400)
  })

  test('etapa 5: link público lê só páginas publicadas; arquivos só os usados na página', async () => {
    const p = await m.criarPagina(ana, { titulo: 'Política de trocas' })
    const c = await m.alterarCompartilhamento(ana, p.id, { publica: true })
    assert.ok(c.token)
    assert.equal((await m.lerPaginaPublica(c.token!)).titulo, 'Política de trocas')
    await rejeita(m.lerPaginaPublica('token-que-nao-existe-1234'), 404)
    await rejeita(m.arquivoPublico(c.token!, 'org_a/x/foto.png'), 404)
    await rejeita(m.arquivoPublico(c.token!, 'org_b/../org_a/x.png'), 404)
    await m.alterarCompartilhamento(ana, p.id, { publica: false })
    await rejeita(m.lerPaginaPublica(c.token!), 404)
    const { base } = await m.criarBase(ana, { modelo: 'tarefas', visao: 'tabela' })
    const cb = await m.alterarCompartilhamento(ana, base.id, { publica: true })
    const publica = await m.lerPaginaPublica(cb.token!)
    assert.equal(publica.base?.itens.length, 3)
    assert.ok(!publica.base?.esquema.some(x => x.tipo === 'pessoa'), 'pessoas não aparecem')
  })

  test('etapa 4: importar CSV cria a base com os valores conferidos', async () => {
    const esquema = [{ id: 'preco', nome: 'Preço', tipo: 'numero' }, { id: 'cat', nome: 'Categoria', tipo: 'selecao', opcoes: [{ id: 'a', nome: 'Bebida', cor: 'azul' }] }]
    const { base, itens } = await m.criarBase(ana, { modelo: 'vazia', visao: 'tabela', titulo: 'Produtos', importacao: { esquema, itens: [
      { titulo: 'Café', propriedades: { preco: 5.5, cat: 'a' } }, { titulo: 'Bolo', propriedades: { preco: 12 } }] } })
    assert.equal(base.titulo, 'Produtos'); assert.equal(itens.length, 2)
    assert.equal(itens.find(i => i.titulo === 'Café')?.propriedades.preco, 5.5)
    await rejeita(m.criarBase(ana, { modelo: 'vazia', visao: 'tabela', importacao: { esquema, itens: [{ titulo: 'x', propriedades: { cat: 'zzz' } }] } }), 400)
  })

  test('etapa 6: menção, comentário e atribuição avisam a pessoa uma vez; marcar como lido', async () => {
    const p = await m.criarPagina(ana, { titulo: 'Briefing' })
    const mencao = (id: string) => [{ type: 'paragraph', content: [{ type: 'text', text: 'Oi ', styles: {} }, { type: 'pessoa', props: { userId: id, nome: id } }] }]
    const v1 = await m.atualizarPagina(ana, p.id, p.versao, { conteudo: mencao('bia') })
    await m.atualizarPagina(ana, p.id, v1.versao, { conteudo: [...mencao('bia'), ...mencao('edu')] })
    let caixa = await m.listarNotificacoes(bia)
    assert.equal(caixa.notificacoes.filter(n => n.tipo === 'mencao' && n.pagina_id === p.id).length, 1, 'a mesma menção não repete')
    assert.equal((await m.listarNotificacoes(edu)).notificacoes.length, 0, 'outra empresa não recebe')
    await m.comentar(vic, p.id, { texto: 'Gostei' })
    assert.ok((await m.listarNotificacoes(ana)).notificacoes.some(n => n.tipo === 'comentario' && n.texto === 'Gostei'))
    const { base } = await m.criarBase(ana, { modelo: 'tarefas', visao: 'tabela' })
    const item = await m.criarItem(ana, base.id, { titulo: 'Revisar', propriedades: { responsavel: ['bia'] } })
    caixa = await m.listarNotificacoes(bia)
    assert.ok(caixa.notificacoes.some(n => n.tipo === 'atribuicao' && n.pagina_id === item.id))
    assert.ok(caixa.nao_lidas >= 2)
    await m.marcarLidas(bia, 'todas')
    assert.equal((await m.listarNotificacoes(bia)).nao_lidas, 0)
    assert.equal((await m.listarNotificacoes(ana)).notificacoes.some(n => n.autor === 'ana'), false, 'ninguém avisa a si mesmo')
  })

  test('etapa 6: relação nos dois sentidos espelha entrar e sair', async () => {
    const { base: clientes } = await m.criarBase(ana, { modelo: 'vazia', visao: 'tabela', titulo: 'Clientes 2' })
    const { base: projetos } = await m.criarBase(ana, { modelo: 'vazia', visao: 'tabela', titulo: 'Projetos 2' })
    await m.alterarBase(ana, projetos.id, { esquema: [...projetos.esquema, { id: 'cli', nome: 'Cliente', tipo: 'relacao', baseRelacionada: clientes.id, reciproca: 'proj' }] })
    await m.alterarBase(ana, clientes.id, { esquema: [...clientes.esquema, { id: 'proj', nome: 'Projetos', tipo: 'relacao', baseRelacionada: projetos.id, reciproca: 'cli' }] })
    const c1 = await m.criarItem(ana, clientes.id, { titulo: 'Padaria' })
    const p1 = await m.criarItem(ana, projetos.id, { titulo: 'Site', propriedades: { cli: [c1.id] } })
    const p2 = await m.criarItem(ana, projetos.id, { titulo: 'Logo', propriedades: { cli: [c1.id] } })
    const lerCliente = async () => (await m.obterBase(ana, clientes.id)).itens.find(i => i.id === c1.id)!
    assert.deepEqual([...(await lerCliente()).propriedades.proj as string[]].sort(), [p1.id, p2.id].sort())
    await m.alterarItem(ana, p1.id, { propriedades: { cli: [] } })
    assert.deepEqual((await lerCliente()).propriedades.proj, [p2.id])
    await m.alterarItem(ana, p2.id, { propriedades: { cli: null } })
    assert.equal((await lerCliente()).propriedades.proj, undefined)
  })

  test('etapa 6: canal de tempo real só para quem edita; tarefa diária manda lembretes e esvazia a lixeira antiga', async () => {
    process.env.NOTAS_CANAL_SEGREDO = 'segredo-de-teste-123456'
    const p = await m.criarPagina(ana, { titulo: 'Canal' })
    assert.match((await m.obterPagina(ana, p.id)).canal ?? '', /^notas-[\w-]{32}$/)
    assert.equal((await m.obterPagina(vic, p.id)).canal, null)
    const { base } = await m.criarBase(ana, { modelo: 'tarefas', visao: 'tabela' })
    await m.alterarBase(ana, base.id, { esquema: base.esquema.map(x => x.id === 'prazo' ? { ...x, lembrete: 'no_dia' as const } : x) })
    await m.criarItem(ana, base.id, { titulo: 'Entregar hoje', propriedades: { prazo: '2026-12-10', responsavel: ['bia'] } })
    const r1 = await m.tarefaDiaria('2026-12-10')
    const r2 = await m.tarefaDiaria('2026-12-10')
    assert.equal(r1.lembretes, 1); assert.equal(r2.lembretes, 0, 'não repete')
    assert.ok((await m.listarNotificacoes(bia)).notificacoes.some(n => n.tipo === 'lembrete'))
    const velha = await m.criarPagina(ana, { titulo: 'Velha' })
    await m.arquivarPagina(ana, velha.id)
    await m.consultaDoServidor("UPDATE notas.paginas SET arquivada_em = now() - interval '31 days' WHERE id = $1", [velha.id])
    assert.ok((await m.tarefaDiaria('2026-12-11')).apagadas >= 1)
    assert.equal((await m.consultaDoServidor('SELECT 1 FROM notas.paginas WHERE id = $1', [velha.id])).length, 0)
  })

  test('etapa 6: duas gravações colaborativas ao mesmo tempo não dão conflito e nada se perde', async () => {
    const p = await m.criarPagina(ana, { titulo: 'Simultânea' })
    const doc = (t: string) => { const d = new Y.Doc(); d.getText('t').insert(0, t); return Buffer.from(Y.encodeStateAsUpdate(d)).toString('base64') }
    const [a, b] = await Promise.all([
      m.atualizarPagina(ana, p.id, null, { estado_yjs: doc('A '), geracao_yjs: p.geracao_yjs, conteudo: [] }),
      m.atualizarPagina(bia, p.id, null, { estado_yjs: doc('B '), geracao_yjs: p.geracao_yjs, conteudo: [] }),
    ])
    assert.ok(a && b)
    const final = new Y.Doc(); Y.applyUpdate(final, Buffer.from((await m.obterPagina(ana, p.id)).estado_yjs!, 'base64'))
    assert.match(final.getText('t').toString(), /A/); assert.match(final.getText('t').toString(), /B/)
  })

  test('itens da base trazem o número de discussões abertas (resolvidas e respostas não contam)', async () => {
    const { base, itens } = await m.criarBase(ana, { modelo: 'tarefas', visao: 'quadro' })
    const alvo = itens[0]
    const d1 = await m.comentar(bia, alvo.id, { texto: 'Pode revisar?' }) as { id: string }
    await m.comentar(ana, alvo.id, { texto: 'Revisei', discussao_id: d1.id })
    const d2 = await m.comentar(ana, alvo.id, { texto: 'Outra coisa' }) as { id: string }
    await m.alterarComentario(ana, d2.id, { resolvido: true })
    const completa = await m.obterBase(ana, base.id) as { itens: { id: string; comentarios?: number }[] }
    assert.equal(completa.itens.find(i => i.id === alvo.id)?.comentarios, 1)
    assert.equal(completa.itens.find(i => i.id !== alvo.id)?.comentarios, 0)
  })
})
