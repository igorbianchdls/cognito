// O motor do Analytics contra um Postgres de verdade (banco local dos testes): coleta, tendência com quebra e comparação,
// funil, retenção, caminhos, pessoas (com identify), coortes, mapa de calor e as regras de acesso dos dados salvos.
// Uso: npm run produtos:integracao (sobe o banco local com as migrações).
import { after, before, describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'

const url = process.env.NOTAS_TEST_DB_URL
process.env.SUPABASE_DB_URL = url

describe('Analytics no Postgres', { skip: !url }, () => {
  let motor: typeof import('./motor'), pg: typeof import('./pg'), coleta: typeof import('./coleta'), dados: typeof import('./dados'), capture: typeof import('./capture')
  const ana = { userId: 'ana', orgId: 'org_a' }, vic = { userId: 'vic', orgId: 'org_a' }, edu = { userId: 'edu', orgId: 'org_b' }
  let site = ''
  const agora = new Date()
  const ha = (dias: number, min = 0) => new Date(agora.getTime() - dias * 86400000 - min * 60000).toISOString()
  const periodo = { de: ha(30), ate: new Date(agora.getTime() + 60000).toISOString() }

  before(async () => {
    motor = await import('./motor'); pg = await import('./pg'); coleta = await import('./coleta'); dados = await import('./dados'); capture = await import('./capture')
    const p = await pg.comoPessoa(ana, db => dados.criar(db, ana, 'sites', { name: 'Loja', domains: ['loja.com'] })) as { id: string; public_key: string; workspace_id?: string }
    site = p.id
    const prop = { id: site, workspace_id: 'org_a', domains: ['loja.com'] }
    const ua = 'Mozilla/5.0 (Windows NT 10.0) Chrome/120'
    const uaCel = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile Safari'
    const ev = (d: string, s: string, e: string, path: string, t: string, extra: Record<string, unknown> = {}) =>
      ({ e, d, s, t, url: `https://loja.com${path}${extra.utm ? `?utm_source=${extra.utm}` : ''}`, title: path, ...(extra.u ? { u: extra.u as string } : {}), ...(extra.p ? { p: extra.p as Record<string, unknown> } : {}) })
    const lote = async (events: ReturnType<typeof ev>[], uaUsada = ua, now = agora) => coleta.gravarEventos(capture.toRows(prop, { k: 'otto_' + '0'.repeat(32), events }, { ua: uaUsada, country: 'BR', now }))
    // Ana: home → preços → cadastro (instagram), depois se identifica e volta 8 dias depois.
    const dias = (n: number) => new Date(agora.getTime() - n * 86400000)
    await lote([ev('va', 's1', '$pageview', '/', ha(9, 30), { utm: 'instagram' }), ev('va', 's1', '$pageview', '/precos', ha(9, 29)), ev('va', 's1', 'cadastrou', '/cadastro', ha(9, 28)),
      ev('va', 's1', '$identify', '/cadastro', ha(9, 27), { u: 'user-ana', p: { plano: 'pro' } })], ua, dias(9))
    await lote([ev('va2', 's2', '$pageview', '/', ha(1, 10), { u: 'user-ana' }), ev('va2', 's2', '$pageview', '/blog', ha(1, 9), { u: 'user-ana' })], ua, dias(1))
    // Bia: home → preços (google), no celular; clica no botão de assinar.
    await lote([ev('vb', 's3', '$pageview', '/', ha(2, 5), { utm: 'google' }), ev('vb', 's3', '$pageview', '/precos', ha(2, 4)),
      ev('vb', 's3', '$autocapture', '/precos', ha(2, 3), { p: { x: 0.5, y: 820, vw: 390, dh: 2400, seletor: 'button.assinar', texto: 'Assinar', tag: 'button' } }),
      ev('vb', 's3', '$pageleave', '/precos', ha(2, 2), { p: { rolagem: 80 } })], uaCel, dias(2))
    // Caio: só a home (direto).
    await lote([ev('vc', 's4', '$pageview', '/', ha(0, 5))])
  })
  after(async () => { await (await import('./pg')).getPool().end() })

  test('tendência: páginas vistas por dia com quebra por origem e comparação', async () => {
    const r = await pg.comoPessoa(ana, db => motor.tendencia(db, { tipo: 'tendencia', series: [{ evento: '$pageview', metrica: 'pessoas', filtros: [] }], intervalo: 'dia', quebra: 'origem', filtros: [], comparar: true, ...periodo }, site))
    assert.equal(r.rotulos.length >= 30, true)
    const origens = Object.fromEntries(r.series.map(s => [s.quebra, s.total]))
    assert.deepEqual(origens, { instagram: 1, google: 1, '(direto)': 3 }, JSON.stringify(origens))
    assert.ok(r.anterior, 'comparação com o período anterior')
  })

  test('pessoa: as visitas antes e depois do identify contam como uma só', async () => {
    const r = await pg.comoPessoa(ana, db => motor.tendencia(db, { tipo: 'tendencia', series: [{ evento: '$pageview', metrica: 'pessoas', filtros: [] }], intervalo: 'semana', filtros: [], comparar: false, ...periodo }, site))
    assert.equal(r.series[0].total, 3, 'user-ana, vb e vc')
    const lista = await pg.comoPessoa(ana, db => motor.pessoas(db, site, {}))
    assert.deepEqual(lista.pessoas.map(p => (p as { pessoa: string }).pessoa).sort(), ['user-ana', 'vb', 'vc'])
    const perfil = await pg.comoPessoa(ana, db => motor.pessoa(db, site, 'user-ana')) as unknown as { eventos: unknown[]; origem_inicial: string; dados: { plano: string } }
    assert.equal(perfil.eventos.length, 6); assert.equal(perfil.origem_inicial, 'instagram'); assert.equal(perfil.dados.plano, 'pro')
  })

  test('funil: home → preços → cadastro, com conversão, tempo e quebra por aparelho', async () => {
    const r = await pg.comoPessoa(ana, db => motor.funil(db, { tipo: 'funil', passos: [
      { evento: '$pageview', filtros: [{ campo: 'pagina', op: 'igual', valor: '/' }] }, { evento: '$pageview', filtros: [{ campo: 'pagina', op: 'igual', valor: '/precos' }] }, { evento: 'cadastrou', filtros: [] },
    ], janela_dias: 7, quebra: 'aparelho', filtros: [], ...periodo }, site))
    assert.deepEqual(r.passos.map(p => p.pessoas), [3, 2, 1])
    assert.equal(r.passos[2].conversao, 33.3); assert.equal(r.passos[2].do_anterior, 50); assert.equal(r.passos[1].tempo_mediano_s, 60)
    assert.deepEqual(r.quebras.map(q => [q.quebra, q.passos.map(p => p.pessoas)]).sort(), [['desktop', [2, 1, 1]], ['mobile', [1, 1, 0]]])
  })

  test('retenção e caminhos', async () => {
    const ret = await pg.comoPessoa(ana, db => motor.retencao(db, { tipo: 'retencao', inicial: { evento: '$pageview', filtros: [] }, retorno: { evento: '$pageview', filtros: [] }, intervalo: 'semana', periodos: 4, filtros: [], ...periodo }, site))
    const total = ret.coortes.reduce((n, c) => n + c.tamanho, 0)
    assert.equal(total, 3)
    assert.ok(ret.coortes.every(c => c.valores[0] === 100), 'semana 0 é sempre 100%')
    assert.ok(ret.coortes.some(c => (c.valores[1] ?? 0) > 0), 'Ana volta na semana seguinte')
    const cam = await pg.comoPessoa(ana, db => motor.caminhos(db, { tipo: 'caminhos', pagina: '/', direcao: 'depois', passos: 3, filtros: [], ...periodo }, site))
    assert.deepEqual(cam.ligacoes.find(l => l.passo === 0 && l.para === '/precos')?.sessoes, 2)
    assert.equal(cam.inicio[0].pagina, '/')
  })

  test('coortes: quem viu preços e não cadastrou; vira filtro', async () => {
    const def = { combinar: 'todas' as const, regras: [
      { tipo: 'fez' as const, evento: '$pageview', vezes: 1, dias: 30, filtros: [{ campo: 'pagina' as const, op: 'igual' as const, valor: '/precos' }] },
      { tipo: 'nao_fez' as const, evento: 'cadastrou', dias: 30 }] }
    const m = await pg.comoPessoa(ana, db => motor.membrosDaCoorte(db, site, def))
    assert.deepEqual(m, { total: 1, amostra: ['vb'] })
    const c = await pg.comoPessoa(ana, db => dados.criar(db, ana, 'coortes', { property_id: site, name: 'Viu preço e não comprou', rules: def })) as { id: string }
    const r = await pg.comoPessoa(ana, db => motor.tendencia(db, { tipo: 'tendencia', series: [{ evento: '$pageview', metrica: 'total', filtros: [] }], intervalo: 'mes', filtros: [{ campo: 'coorte', op: 'igual', valor: c.id }], comparar: false, ...periodo }, site))
    assert.equal(r.series[0].total, 2, 'só as páginas da Bia')
    const lista = await pg.comoPessoa(ana, db => motor.pessoas(db, site, { coorte: c.id }))
    assert.deepEqual(lista.pessoas.map(p => (p as { pessoa: string }).pessoa), ['vb'])
  })

  test('mapa de calor: cliques e rolagem da página no celular', async () => {
    const r = await pg.comoPessoa(ana, db => motor.mapaDeCalor(db, site, { pagina: '/precos', aparelho: 'mobile', de: new Date(periodo.de), ate: new Date(periodo.ate) }))
    assert.deepEqual(r.pontos, [{ x: '50', y: '816', n: 1 }].map(p => ({ ...p, x: r.pontos[0].x, y: r.pontos[0].y })))
    assert.equal((r.elementos[0] as { seletor: string }).seletor, 'button.assinar')
    assert.deepEqual(r.rolagem.map(f => f.faixa), [0, 25, 50, 75])
    assert.equal(r.largura, 390)
  })

  test('flags: sorteio estável, porcentagem, regras e coorte', async () => {
    const flags = await import('./flags')
    const f = { key: 'nova-home', enabled: true, rollout: 30, rules: [], variants: null }
    const dentro = Array.from({ length: 2000 }, (_, i) => flags.decidirFlag(f, { distinct_id: `v${i}` })).filter(Boolean).length
    assert.ok(dentro > 480 && dentro < 720, `~30% (${dentro}/2000)`)
    assert.equal(flags.decidirFlag(f, { distinct_id: 'x1' }), flags.decidirFlag(f, { distinct_id: 'x1' }), 'o mesmo visitante recebe sempre o mesmo')
    assert.equal(flags.decidirFlag({ ...f, enabled: false, rollout: 100 }, { distinct_id: 'x' }), false)
    const ab = { ...f, rollout: 100, variants: [{ key: 'a', peso: 50 }, { key: 'b', peso: 50 }] }
    const vs = new Set(Array.from({ length: 200 }, (_, i) => flags.decidirFlag(ab, { distinct_id: `w${i}` })))
    assert.deepEqual([...vs].sort(), ['a', 'b'])
    assert.equal(flags.decidirFlag({ ...f, rollout: 100, rules: [{ tipo: 'campo', campo: 'aparelho', op: 'igual', valor: 'mobile' }] }, { distinct_id: 'x', aparelho: 'desktop' }), false)
    const c = await pg.comoPessoa(ana, db => dados.criar(db, ana, 'coortes', { property_id: site, name: 'Viu preços', rules: { combinar: 'todas', regras: [{ tipo: 'fez', evento: '$pageview', filtros: [{ campo: 'pagina', op: 'igual', valor: '/precos' }] }] } })) as { id: string }
    await pg.comoPessoa(ana, db => dados.criar(db, ana, 'flags', { property_id: site, key: 'oferta', enabled: true, rules: [{ tipo: 'coorte', coorte_id: c.id }] }))
    const vb = await pg.doServidor(db => flags.flagsDoVisitante(db, site, { distinct_id: 'vb' }))
    const vc = await pg.doServidor(db => flags.flagsDoVisitante(db, site, { distinct_id: 'vc' }))
    assert.equal(vb.oferta, true, 'Bia viu preços'); assert.equal(vc.oferta, false, 'Caio só viu a home')
    // A Ana viu preços antes de se identificar: o visitante antigo conta como o usuário.
    assert.equal((await pg.doServidor(db => flags.flagsDoVisitante(db, site, { distinct_id: 'va' }))).oferta, true)
  })

  test('experimento: conversão por variante e significância', async () => {
    const flags = await import('./flags')
    assert.deepEqual(flags.comparar({ expostos: 1000, convertidos: 100 }, { expostos: 1000, convertidos: 150 }).chance_melhor! > 99, true)
    assert.equal(flags.comparar({ expostos: 1000, convertidos: 100 }, { expostos: 1000, convertidos: 101 }).p_valor! > 0.5, true)
    const f = await pg.comoPessoa(ana, db => dados.criar(db, ana, 'flags', { property_id: site, key: 'botao', enabled: true, variants: [{ key: 'azul', peso: 50 }, { key: 'verde', peso: 50 }] })) as { id: string }
    const x = await pg.comoPessoa(ana, db => dados.criar(db, ana, 'experimentos', { property_id: site, flag_id: f.id, name: 'Cor do botão', goal_event: 'comprou', status: 'rodando', started_at: ha(0, 30) })) as { id: string }
    const prop = { id: site, workspace_id: 'org_a', domains: ['loja.com'] }
    const evs = [['p1', 'azul', true], ['p2', 'azul', false], ['p3', 'verde', true], ['p4', 'verde', true]].flatMap(([d, v, comprou], i) => [
      { e: '$flag', d: d as string, s: `x${i}`, t: ha(0, 20), url: 'https://loja.com/', p: { flag: 'botao', variante: v } },
      ...(comprou ? [{ e: 'comprou', d: d as string, s: `x${i}`, t: ha(0, 10), url: 'https://loja.com/ok' }] : [])])
    await coleta.gravarEventos(capture.toRows(prop, { k: 'otto_' + '0'.repeat(32), events: evs }, { ua: 'Mozilla/5.0 Chrome/120', now: agora }))
    const r = await pg.comoPessoa(ana, db => flags.resultadoExperimento(db, x.id))
    assert.deepEqual(r.variantes.map(v => [v.variante, v.expostos, v.convertidos, v.conversao]), [['azul', 2, 1, 50], ['verde', 2, 2, 100]])
    assert.equal(r.significativo, false, 'poucas pessoas')
  })

  test('gravações: pedaços comprimidos voltam em ordem; outra empresa não vê', async () => {
    const g = await import('./gravacoes')
    const t0 = Date.now()
    await g.gravarPedaco({ id: site, workspace_id: 'org_a' }, { k: 'otto_' + '0'.repeat(32), d: 'vb', s: 's3', seq: 1, eventos: [{ type: 3, timestamp: t0 + 2000, data: { x: 1 } }] })
    await g.gravarPedaco({ id: site, workspace_id: 'org_a' }, { k: 'otto_' + '0'.repeat(32), d: 'vb', s: 's3', seq: 0, url: 'https://loja.com/', eventos: [{ type: 4, timestamp: t0, data: {} }, { type: 2, timestamp: t0 + 1, data: { node: {} } }] })
    const lista = await pg.comoPessoa(ana, db => g.listarGravacoes(db, site, {}))
    assert.equal(lista.gravacoes.length, 1)
    const l0 = lista.gravacoes[0] as { pessoa: string; paginas: number; cliques: number; duracao_s: number }
    assert.equal(l0.pessoa, 'vb'); assert.equal(l0.paginas, 2); assert.equal(l0.cliques, 1); assert.equal(l0.duracao_s, 2)
    const r = await pg.comoPessoa(ana, db => g.lerGravacao(db, site, 's3'))
    assert.deepEqual(r.eventos.map(e => e.timestamp - t0), [0, 1, 2000])
    assert.ok(r.marcos.length >= 3)
    await assert.rejects(pg.comoPessoa(edu, db => g.lerGravacao(db, site, 's3')), /não encontrada/)
    await assert.rejects(pg.comoPessoa(vic, db => g.apagarGravacao(db, site, 's3')), /não encontrada/)
  })

  test('acesso: quem só visualiza não salva; outra empresa não vê o site nem os eventos', async () => {
    const insight = { property_id: site, name: 'Visitas', query: { tipo: 'tendencia', series: [{ evento: '$pageview', metrica: 'pessoas' }], ...periodo } }
    const criado = await pg.comoPessoa(ana, db => dados.criar(db, ana, 'insights', insight)) as { id: string; query: { intervalo: string } }
    assert.equal(criado.query.intervalo, 'dia', 'a consulta salva já vem com os padrões')
    await assert.rejects(pg.comoPessoa(vic, db => dados.criar(db, vic, 'insights', insight)), (e: { code?: string }) => e.code === '42501')
    assert.equal((await pg.comoPessoa(vic, db => dados.listar(db, 'insights', site))).length, 1, 'quem só visualiza lê')
    await assert.rejects(pg.comoPessoa(edu, db => motor.propriedadeVisivel(db, site)), /não encontrado/)
    assert.equal((await pg.comoPessoa(edu, db => db.query('SELECT count(*)::int AS n FROM analytics.events')))[0].n, 0)
    await assert.rejects(pg.comoPessoa(ana, db => dados.criar(db, ana, 'flags', { property_id: site, key: 'Com Espaço' })), /Chave/)
    void randomUUID
  })
})
