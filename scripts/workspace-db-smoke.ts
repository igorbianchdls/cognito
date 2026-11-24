// Drive and Analytics tools against a real Postgres with the drive/analytics schemas and their policies.
//   WORKSPACE_TEST_DB_URL=postgres://postgres:pg@localhost/mkt pnpm workspace:db-smoke
// The database needs the Supabase stubs and the migrations editor_schema, editor_social_roles, drive_schema,
// analytics_schema, analytics_goals and inbox_schema. Storage, downloads and BigQuery are fakes; nothing external is called.
import assert from 'node:assert/strict'
import { generateKeyPairSync } from 'node:crypto'
import pg from 'pg'
import { executeWorkspace, type WorkspaceDependencies } from '../src/products/mcpcore/domains/workspace/executeTool'
import type { PluginConfig } from '../src/products/mcpcore/shared/config'
import type { PluginCompany, PluginPrincipal } from '../src/products/mcpcore/shared/contracts'

const url = process.env.WORKSPACE_TEST_DB_URL
if (!url) { console.log(JSON.stringify({ status: 'skipped', reason: 'WORKSPACE_TEST_DB_URL não definido' })); process.exit(0) }
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://abcdefghijklmnopqrst.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'

const config: PluginConfig = { integration: 'chatgpt', resource: 'https://app.example.com/api/mcp', issuer: 'https://clerk.example.com', metadataUrl: 'https://app.example.com/.well-known/oauth-protected-resource',
  scope: 'erp:read', clientIds: ['t'], origins: [], toolTimeoutMs: 15000, requestsPerMinute: 60 }
const company = (id: number) => ({ id, name: 'Empresa ' + id, profile: 'admin', capabilities: [] }) as unknown as PluginCompany
const person = (clerkUserId: string, companies = [company(1)], scopes = ['erp:read', 'erp:write']): PluginPrincipal => ({ userId: 1, clerkUserId, clientId: 't', scopes, companies })
const owner = person('u_owner'), viewer = person('u_viewer'), stranger = person('u_owner', [company(2)])

// ---------- fakes ----------
const box = (type: string, ...parts: Buffer[]) => { const body = Buffer.concat(parts); const head = Buffer.alloc(8); head.writeUInt32BE(8 + body.length); head.write(type, 4, 'latin1'); return Buffer.concat([head, body]) }
function mp4(seconds: number) {
  const mvhd = Buffer.alloc(100); mvhd.writeUInt32BE(1000, 12); mvhd.writeUInt32BE(seconds * 1000, 16)
  const tkhd = Buffer.alloc(84); tkhd.writeUInt32BE(1080 * 65536, 76); tkhd.writeUInt32BE(1920 * 65536, 80)
  return Buffer.concat([box('ftyp', Buffer.from('isom\0\0\0\0isom', 'latin1')), box('moov', box('mvhd', mvhd), box('trak', box('tkhd', tkhd)))])
}
const storageCalls: { method: string; url: string; body?: string }[] = []
const storage: WorkspaceDependencies['storage'] = {
  download: async () => ({ bytes: mp4(20), name: 'video-loja.mp4' }),
  send: (async (target: string, init?: RequestInit) => {
    storageCalls.push({ method: init?.method ?? 'GET', url: String(target), body: typeof init?.body === 'string' ? init.body : undefined })
    if (String(target).includes('/object/sign/')) return new Response(JSON.stringify({ signedURL: '/object/sign/drive/x?token=abc' }), { status: 200 })
    return new Response('{}', { status: 200 })
  }) as unknown as typeof fetch,
}
const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048, privateKeyEncoding: { type: 'pkcs8', format: 'pem' }, publicKeyEncoding: { type: 'spki', format: 'pem' } })
const sqls: { sql: string; params: Record<string, string> }[] = []
const bqEnv = { GCP_SERVICE_ACCOUNT_JSON: JSON.stringify({ client_email: 'sa@proj.iam.gserviceaccount.com', private_key: privateKey, project_id: 'proj' }) }
// A column is numeric when every value in it is a number (like BigQuery would type it).
const answer = (fields: string[], rows: unknown[][]) => ({ jobComplete: true, schema: { fields: fields.map((name, i) => ({ name, type: rows.length && rows.every(r => r[i] !== null && /^-?\d+(\.\d+)?$/.test(String(r[i]))) ? 'INTEGER' : 'STRING' })) }, rows: rows.map(r => ({ f: r.map(v => ({ v })) })) })
const bigquery: WorkspaceDependencies['bigquery'] = {
  env: bqEnv,
  send: (async (input: string, init?: RequestInit) => {
    const u = String(input), method = init?.method ?? 'GET'
    const reply = (status: number, data: object) => new Response(JSON.stringify(data), { status })
    if (u.includes('oauth2')) return reply(200, { access_token: 'tok', expires_in: 3600 })
    if (method === 'GET') return reply(200, {})
    if (!u.endsWith('/queries')) return reply(200, {})
    const body = JSON.parse(String(init?.body)) as { query: string; queryParameters: { name: string; parameterValue: { value: string } }[] }
    sqls.push({ sql: body.query, params: Object.fromEntries(body.queryParameters.map(p => [p.name, p.parameterValue.value])) })
    const q = body.query
    if (q.includes('AS ultimo, COUNT(*) AS eventos')) return reply(200, answer(['ultimo', 'eventos'], [['2026-11-22T10:00:00Z', '120']]))
    if (q.includes('usuarios_identificados')) return reply(200, answer(['visitantes', 'sessoes', 'paginas_vistas', 'eventos', 'usuarios_identificados'], [['50', '60', '200', '260', '3']]))
    if (q.includes(' AS dia,')) return reply(200, answer(['dia', 'visitantes', 'sessoes', 'paginas_vistas'], [['2026-11-21', '20', '25', '80'], ['2026-11-22', '30', '35', '120']]))
    if (q.includes('evento_escolhido')) return reply(200, answer(['visitantes', 'sessoes', 'paginas_vistas', 'eventos', 'evento_escolhido'], [['50', '60', '200', '260', '5']]))
    if (q.includes('AS periodo') && q.includes('AS grupo')) return reply(200, answer(['periodo', 'grupo', 'valor'], [['2026-11-21', 'instagram', '12'], ['2026-11-21', 'Outros', '3']]))
    if (q.includes('AS periodo')) return reply(200, answer(['periodo', 'valor'], [['2026-11-21', '12'], ['2026-11-22', '18']]))
    if (q.includes('AS conversoes')) return reply(200, answer(['fonte', 'meio', 'campanha', 'visitantes', 'sessoes', 'conversoes'], [['instagram', 'social', 'natal', '40', '50', '5']]))
    if (q.includes('AS taxa') || q.includes('COUNTIF(ordem = 1) AS entradas, COUNTIF(seguinte IS NULL) AS saidas FROM pv GROUP')) return reply(200, answer(['pagina', 'visualizacoes', 'visitantes', 'entradas', 'saidas'], [['/precos', '100', '60', '40', '30']]))
    if (q.includes('AS valor, COUNT(*) AS total')) return reply(200, answer(['valor', 'total', 'visitantes'], [['assinou', '5', '5']]))
    if (q.includes('AS coorte')) return reply(200, answer(['coorte', 'semana', 'pessoas', 'tamanho'], [['2026-11-02', '0', '10', '10'], ['2026-11-02', '1', '4', '10']]))
    if (q.includes(' AS p1')) return reply(200, answer(['p1', 'p2', 'vezes'], [['/precos', '/assinar', '7']]))
    if (q.includes('TO_JSON_STRING(properties) AS p FROM')) return reply(200, answer(['p'], [['{"plano":"pro","valor":99}'], ['{"plano":"basico","valor":49}']]))
    if (q.includes('AS paginas_vistas, FORMAT_TIMESTAMP')) return reply(200, answer(['eventos', 'paginas_vistas', 'ultimo', 'enderecos'], [['0', '0', null, '']]))
    return reply(200, answer(['quando', 'evento'], []))
  }) as unknown as typeof fetch,
}
const deps: WorkspaceDependencies = { storage, bigquery, connect: async () => { const c = new pg.Client({ connectionString: url }); await c.connect(); return { query: (s: string, p?: unknown[]) => c.query(s, p as unknown[]), release: () => { void c.end() } } } }
const audit = { reserve: async () => crypto.randomUUID(), finish: async () => undefined } as unknown as Parameters<typeof executeWorkspace>[5]

type Result = { ok: boolean; code?: string; message?: string; data: Record<string, any> } // eslint-disable-line @typescript-eslint/no-explicit-any
async function call(name: string, args: Record<string, unknown>, who = owner, d = deps): Promise<Result> {
  const r = await executeWorkspace(who, name, args, config, d, audit)
  return JSON.parse((r.content[0] as { text: string }).text)
}
async function ok(name: string, args: Record<string, unknown>, who = owner, d = deps) { const r = await call(name, args, who, d); assert(r.ok, `${name}: ${r.code} ${r.message}`); return r.data }
async function fails(name: string, args: Record<string, unknown>, code: string, who = owner, d = deps) { const r = await call(name, args, who, d); assert(!r.ok, `${name} deveria falhar`); assert.equal(r.code, code, `${name}: ${r.message}`); return r }
const checks: string[] = []
async function check(name: string, fn: () => Promise<void>) { await fn(); checks.push(name); console.log('PASS', name) }

async function main() {
  const admin = new pg.Client({ connectionString: url }); await admin.connect()
  await admin.query('DELETE FROM drive.files; DELETE FROM drive.folders; DELETE FROM drive.drives; DELETE FROM drive.favorites; DELETE FROM analytics.properties')
  let driveId = '', folderId = '', sub = '', fileId = '', other = ''

  await check('Drive: criar drive e pastas, trazer arquivo de link, listar e buscar', async () => {
    driveId = (await ok('drive_criar_drive', { nome: 'Marketing' })).drive.id
    other = (await ok('drive_criar_drive', { nome: 'Produtos' })).drive.id
    folderId = (await ok('drive_criar_pasta', { drive_id: driveId, nome: 'Reels', etiquetas: ['Reels'] })).pasta.id
    sub = (await ok('drive_criar_pasta', { pasta_pai_id: folderId, nome: 'Natal' })).pasta.id
    const f = (await ok('drive_trazer_de_link', { url: 'https://cdn.example.com/video-loja.mp4', pasta_id: sub, nome: 'Loja natal' })).arquivo
    fileId = f.id; assert.deepEqual([f.tipo, f.duracao_s, f.largura], ['video', 20, 1080])
    const drives = (await ok('drive_listar_drives', {})).drives
    assert.deepEqual(drives.map((d: { nome: string; arquivos: number }) => [d.nome, d.arquivos]), [['Marketing', 1], ['Produtos', 0]])
    const root = await ok('drive_listar_pasta', { drive_id: driveId }); assert.deepEqual(root.pastas.map((p: { nome: string }) => p.nome), ['Reels'])
    const inSub = await ok('drive_listar_pasta', { pasta_id: sub }); assert.equal(inSub.arquivos[0].id, fileId)
    assert.equal((await ok('drive_buscar', { busca: 'natal', tipo: 'video' })).arquivos.length, 1)
    assert.equal((await ok('drive_buscar', { etiqueta: 'Reels', tipo: 'pasta' })).pastas.length, 1)
    await fails('drive_criar_pasta', { nome: 'x' }, 'INVALID_INPUT')
  })

  await check('Drive: link temporário, organizar (mover pasta entre drives, renomear, favoritar) e uso', async () => {
    const v = await ok('drive_ver_arquivo', { arquivo_id: fileId, baixar: true })
    assert.match(v.link_temporario, /^https:\/\/abcdefghijklmnopqrst\.supabase\.co\/storage\/v1\/object\/sign\/drive\/x\?token=abc&download=/)
    assert.equal(v.arquivo.drive, 'Marketing')
    await fails('drive_organizar', { mudancas: [{ item: { tipo: 'pasta', id: folderId }, mover_para_pasta_id: sub }] }, 'INVALID_INPUT')
    await ok('drive_organizar', { mudancas: [{ item: { tipo: 'pasta', id: folderId }, mover_para_drive_id: other, novo_nome: 'Reels 2026' }, { item: { tipo: 'arquivo', id: fileId }, favorito: true, etiquetas: ['Natal'] }] })
    const [{ drive_id }] = (await admin.query('SELECT drive_id FROM drive.files WHERE id = $1', [fileId])).rows
    assert.equal(drive_id, other, 'o arquivo da subpasta acompanha a pasta')
    assert.equal((await admin.query('SELECT drive_id FROM drive.folders WHERE id = $1', [sub])).rows[0].drive_id, other)
    const fav = (await ok('drive_recentes_favoritos', { lista: 'favoritos' })).itens; assert.equal(fav[0].id, fileId)
    const use = await ok('drive_uso', {}); assert.equal(use.por_tipo[0].tipo, 'video'); assert.equal(use.maiores[0].id, fileId)
  })

  await check('Drive: lixeira, restaurar e esvaziar apagando os arquivos do armazenamento', async () => {
    await fails('drive_lixeira', { acao: 'enviar', itens: [{ tipo: 'arquivo', id: fileId }] }, 'INVALID_INPUT')
    await ok('drive_lixeira', { acao: 'enviar', itens: [{ tipo: 'arquivo', id: fileId }], confirmado: true })
    assert.equal((await ok('drive_buscar', { busca: 'natal', tipo: 'video' })).arquivos.length, 0)
    await ok('drive_lixeira', { acao: 'restaurar', itens: [{ tipo: 'arquivo', id: fileId }], confirmado: true })
    await ok('drive_lixeira', { acao: 'enviar', itens: [{ tipo: 'pasta', id: folderId }], confirmado: true })
    await fails('drive_listar_pasta', { pasta_id: folderId }, 'INVALID_STATE')
    const r = await ok('drive_esvaziar_lixeira', { confirmado: true })
    assert.equal(r.arquivos_apagados, 1); assert.equal(r.pastas_apagadas, 2)
    const del = storageCalls.find(c => c.method === 'DELETE')!
    assert.deepEqual(JSON.parse(del.body!).prefixes.length, 1); assert(JSON.parse(del.body!).prefixes[0].startsWith('org_A/'))
    assert.equal((await admin.query('SELECT count(*) FROM drive.files')).rows[0].count, '0')
  })

  await check('Drive: quem só visualiza consulta e não altera; outra empresa não vê', async () => {
    assert.equal((await ok('drive_listar_drives', {}, viewer)).drives.length, 2)
    await fails('drive_criar_drive', { nome: 'x' }, 'ACCESS_DENIED', viewer)
    await fails('drive_listar_drives', {}, 'ACCESS_DENIED', stranger)
  })

  let siteId = ''
  await check('Analytics: cadastrar e editar site, código, verificar instalação, metas e definições', async () => {
    const c = await ok('analytics_criar_site', { nome: 'Loja', dominios: ['https://www.minhaloja.com.br/', 'lixo'], pedir_consentimento: true })
    siteId = c.site.id; assert.deepEqual(c.site.dominios, ['www.minhaloja.com.br'])
    assert.match(c.codigo, /^<script async src="https:\/\/app\.example\.com\/otto\.js" data-key="otto_[0-9a-f]{32}" data-consent="required"><\/script>$/)
    const e = await ok('analytics_editar_site', { site_id: siteId, dominios: ['minhaloja.com.br'], pedir_consentimento: false })
    assert.deepEqual(e.site.dominios, ['minhaloja.com.br']); assert(!e.codigo.includes('data-consent'))
    const v = await ok('analytics_verificar_instalacao', { site_id: siteId }); assert.equal(v.funcionando, false); assert(v.proximos_passos.length >= 3)
    const meta = (await ok('analytics_criar_meta', { site_id: siteId, nome: 'Contato', evento: '$pageview', pagina: '/obrigado' })).meta
    await fails('analytics_criar_meta', { site_id: siteId, nome: 'x', evento: '$pageview' }, 'INVALID_INPUT')
    assert.equal((await ok('analytics_editar_meta', { site_id: siteId })).metas.length, 1)
    assert.equal((await ok('analytics_editar_meta', { site_id: siteId, meta_id: meta.id, nome: 'Contato enviado' })).meta.nome, 'Contato enviado')
    await fails('analytics_editar_meta', { site_id: siteId, meta_id: meta.id, excluir: true }, 'CONFIRMATION_REQUIRED')
    await ok('analytics_definir_evento', { site_id: siteId, evento: 'assinou', nome: 'Assinatura', descricao: 'Cliente pagou o plano' })
    await ok('analytics_definir_evento', { site_id: siteId, evento: 'assinou', nome: 'Assinatura paga' })
    assert.equal((await admin.query('SELECT label FROM analytics.event_definitions')).rows[0].label, 'Assinatura paga')
    const code = await ok('analytics_gerar_codigo_eventos', { acoes: [{ evento: 'clicou_comprar', quando: 'clique', seletor: '#comprar"x', propriedades: { plano: 'pro' } }, { evento: 'viu_obrigado', quando: 'abrir_pagina', pagina: '/obrigado' }] })
    assert(code.codigo.includes('e.target.closest("#comprar\\"x")') && code.codigo.includes('otto.track("clicou_comprar", {"plano":"pro"})'))
    const lnk = await ok('analytics_criar_link_campanha', { url: 'https://minhaloja.com.br/natal', fonte: 'Instagram', meio: 'social', campanha: 'Natal Ação 2026' })
    assert.equal(lnk.link, 'https://minhaloja.com.br/natal?utm_source=instagram&utm_medium=social&utm_campaign=natal-acao-2026')
    await fails('analytics_criar_site', { nome: 'x' }, 'ACCESS_DENIED', viewer)
  })

  await check('Analytics: consultas vão ao BigQuery só da propriedade, com parâmetros', async () => {
    sqls.length = 0
    const sites = await ok('analytics_listar_sites', {}); assert.equal(sites.sites[0].eventos_7_dias, 120); assert.equal(sites.bigquery_conectado, true)
    const r = await ok('analytics_resumo', { site_id: siteId, de: '2026-11-01', ate: '2026-11-22' }); assert.equal(r.totais.visitantes, 50); assert.equal(r.por_dia.length, 2)
    assert.deepEqual(r.periodo, { de: '2026-11-01', ate: '2026-11-22' })
    const t = await ok('analytics_tendencia', { site_id: siteId, evento: 'assinou', medida: 'soma', propriedade: 'valor', dividir_por: 'origem', filtros: [{ campo: 'pais', operador: 'igual', valor: "BR' OR 1=1" }] })
    assert.equal(t.serie[0].grupo, 'instagram')
    const tq = sqls.at(-1)!
    assert(tq.sql.includes("SUM(SAFE_CAST(JSON_VALUE(properties, '$.valor') AS FLOAT64))") && tq.sql.includes('= @f0') && !tq.sql.includes('OR 1=1'))
    assert.equal(tq.params.f0, "BR' OR 1=1"); assert.equal(tq.params.p, siteId)
    await fails('analytics_tendencia', { site_id: siteId, dividir_por: "propriedade:x') OR 1=1 --" }, 'INVALID_INPUT')
    await fails('analytics_tendencia', { site_id: siteId, medida: 'soma' }, 'INVALID_INPUT')
    const cmp = await ok('analytics_comparar', { site_id: siteId, evento: 'assinou' }); assert.equal(cmp.metricas.at(-1).metrica, 'assinou')
    const rk = await ok('analytics_ranking', { site_id: siteId, campo: 'evento' }); assert.equal(rk.itens[0].nome, 'Assinatura paga')
    const metaId = (await admin.query('SELECT id FROM analytics.goals LIMIT 1')).rows[0].id
    const camp = await ok('analytics_campanhas', { site_id: siteId, meta_id: metaId }); assert.equal(camp.campanhas[0].taxa_conversao_pct, 10)
    assert.equal(sqls.at(-1)!.params.gp, '/obrigado')
    assert.equal((await ok('analytics_paginas', { site_id: siteId })).paginas[0].taxa_saida_pct, 30)
    assert.deepEqual((await ok('analytics_caminhos', { site_id: siteId, ponto: '/precos' })).caminhos[0], { sequencia: ['/precos', '/assinar'], vezes: 7 })
    assert.deepEqual((await ok('analytics_retencao', { site_id: siteId })).coortes[0].semanas, [100, 40])
    const props = await ok('analytics_propriedades_evento', { site_id: siteId, evento: 'assinou' })
    assert.deepEqual(props.propriedades.map((p: { nome: string }) => p.nome), ['plano', 'valor']); assert.equal(props.nome, 'Assinatura paga')
    await ok('analytics_eventos_recentes', { site_id: siteId, evento: '$pageview' })
    await fails('analytics_visitante', { site_id: siteId }, 'INVALID_INPUT')
    assert(sqls.every(s => s.sql.includes('property_id = @p') && s.params.p === siteId), 'toda consulta filtra a propriedade')
    assert(sqls.every(s => s.sql.includes('`proj.analytics.events`')))
  })

  await check('Analytics: sem BigQuery, avisa sem inventar; outra empresa não vê o site', async () => {
    const noBq = { ...deps, bigquery: { env: {} } }
    await fails('analytics_resumo', { site_id: siteId }, 'ANALYTICS_UNAVAILABLE', owner, noBq)
    assert.equal((await ok('analytics_listar_sites', {}, owner, noBq)).bigquery_conectado, false)
    await fails('analytics_resumo', { site_id: siteId }, 'ACCESS_DENIED', stranger)
    assert.equal((await ok('analytics_listar_sites', {}, viewer)).sites.length, 1)
    await fails('analytics_editar_site', { site_id: siteId, nome: 'x' }, 'ACCESS_DENIED', viewer)
  })

  // ---------- Inbox ----------
  const { makeDb } = await import('../src/products/inbox/server/db')
  const { createTestChannel } = await import('../src/products/inbox/server/actions')
  const inboxPool = new pg.Pool({ connectionString: url, max: 3 })
  const metaCalls: string[] = []
  const inbox = { db: makeDb(() => inboxPool), send: (async (u: string) => { metaCalls.push(String(u)); return new Response('{}') }) as unknown as typeof fetch }
  const withInbox = { ...deps, inbox }
  await admin.query("DELETE FROM inbox.channels WHERE workspace_id = 'org_A'; DELETE FROM inbox.contacts WHERE workspace_id = 'org_A'; DELETE FROM inbox.tags WHERE workspace_id = 'org_A'; DELETE FROM inbox.quick_replies WHERE workspace_id = 'org_A'")
  let convId = '', contactId = '', channelId = ''

  await check('Inbox: resumo, conversas, ler, simular cliente e responder pelo canal de teste', async () => {
    channelId = (await createTestChannel({ userId: 'u_owner', orgId: 'org_A' }, 'Teste', { db: inbox.db })).id
    await ok('inbox_simular_mensagem', { canal_id: channelId, nome_cliente: 'Maria', texto: 'Tem o tênis 38?' }, owner, withInbox)
    const r = await ok('inbox_resumo', {}, owner, withInbox)
    assert.deepEqual([r.abertas, r.sem_responsavel, r.com_nao_lidas], [2, 2, 2])
    const list = (await ok('inbox_listar_conversas', { busca: 'maria' }, owner, withInbox)).conversas
    assert.equal(list.length, 1); convId = list[0].id; contactId = list[0].contato_id
    assert.deepEqual([list[0].contato, list[0].pode_responder, list[0].nao_lidas], ['Maria', true, 1])
    await fails('inbox_responder', { conversa_id: convId, texto: 'Temos!' }, 'INVALID_INPUT', owner, withInbox)
    const sent = await ok('inbox_responder', { conversa_id: convId, texto: 'Temos sim!', confirmado: true }, owner, withInbox)
    assert.equal(sent.situacao, 'entregue'); assert.equal(metaCalls.length, 0, 'canal de teste não chama a Meta')
    const read = await ok('inbox_ler_conversa', { conversa_id: convId }, owner, withInbox)
    assert.deepEqual(read.mensagens.map((x: { de: string; texto: string }) => [x.de, x.texto]), [['cliente', 'Tem o tênis 38?'], ['empresa', 'Temos sim!']])
    await fails('inbox_responder', { conversa_id: convId, texto: 'x', confirmado: true }, 'ACCESS_DENIED', viewer, withInbox)
    await fails('inbox_listar_conversas', {}, 'ACCESS_DENIED', stranger, withInbox)
  })

  await check('Inbox: janela de 24 h, nota, responsável, situação, contato, etiquetas e respostas rápidas', async () => {
    await admin.query(`UPDATE inbox.channels SET kind = 'whatsapp', external_id = 'PN-test-' || id WHERE id = $1`, [channelId])
    await admin.query(`UPDATE inbox.conversations SET last_inbound_at = now() - interval '30 hours' WHERE id = $1`, [convId])
    const closed = await fails('inbox_responder', { conversa_id: convId, texto: 'oi', confirmado: true }, 'INVALID_STATE', owner, withInbox)
    assert.match(closed.message!, /24 horas/); assert.equal(metaCalls.length, 0)
    await ok('inbox_nota', { conversa_id: convId, texto: 'Pediu desconto' }, owner, withInbox)
    assert.equal((await admin.query('SELECT author FROM inbox.notes WHERE conversation_id = $1', [convId])).rows[0].author, 'u_owner')
    assert.equal((await ok('inbox_atribuir', { conversa_id: convId, responsavel: 'eu' })).e_voce, true)
    assert.equal((await ok('inbox_listar_conversas', { responsavel: 'eu' })).conversas.length, 1)
    await ok('inbox_atribuir', { conversa_id: convId, responsavel: 'u_member' })
    await ok('inbox_mudar_situacao', { conversa_id: convId, situacao: 'encerrada' })
    assert.equal((await ok('inbox_listar_conversas', { situacao: 'encerrada' })).conversas[0].nao_lidas, undefined)
    await ok('inbox_criar_etiqueta', { nome: 'Lead quente', cor: '#ef4444' })
    await fails('inbox_criar_etiqueta', { nome: 'lead quente' }, 'ALREADY_EXISTS')
    assert.deepEqual((await ok('inbox_etiquetar', { contato_id: contactId, colocar: ['lead quente'] })).etiquetas, ['Lead quente'])
    await fails('inbox_etiquetar', { contato_id: contactId, colocar: ['Inexistente'] }, 'NOT_FOUND')
    await ok('inbox_salvar_contato', { contato_id: contactId, telefone: '11 98888-7777', campos: { cidade: 'Campinas' } })
    const novo = await ok('inbox_salvar_contato', { nome: 'João', email: 'JOAO@x.com' })
    const ficha = await ok('inbox_obter_contato', { contato_id: contactId })
    assert.deepEqual([ficha.telefone, ficha.campos, ficha.etiquetas, ficha.conversas.length], ['+5511988887777', { cidade: 'Campinas' }, ['Lead quente'], 1])
    assert.equal((await ok('inbox_buscar_contatos', { etiqueta: 'Lead quente' })).contatos.length, 1)
    assert.equal((await ok('inbox_buscar_contatos', { busca: 'joao@x' })).contatos[0].id, novo.contato_id)
    await ok('inbox_salvar_resposta_rapida', { atalho: '/pix', texto: 'Chave: CNPJ' }); await ok('inbox_salvar_resposta_rapida', { atalho: 'pix', texto: 'Chave nova' })
    assert.deepEqual((await ok('inbox_listar_respostas_rapidas', {})).respostas.map((x: { atalho: string; texto: string }) => [x.atalho, x.texto]), [['pix', 'Chave nova']])
    assert.equal((await ok('inbox_listar_canais', {})).canais[0].tipo, 'WhatsApp')
    assert.equal((await ok('inbox_listar_etiquetas', {})).etiquetas[0].contatos, 1)
    await fails('inbox_nota', { conversa_id: convId, texto: 'x' }, 'ACCESS_DENIED', viewer)
    await fails('inbox_simular_mensagem', { canal_id: channelId, texto: 'x' }, 'INVALID_STATE', owner, withInbox)
  })

  await check('Inbox CRM: relatório, negócios, tarefas, segmentos, disparos, automações, base de conhecimento e sugestão de IA', async () => {
    await admin.query("DELETE FROM inbox.pipelines WHERE workspace_id = 'org_A'; DELETE FROM inbox.segments WHERE workspace_id = 'org_A'; DELETE FROM inbox.kb_articles WHERE workspace_id = 'org_A'; DELETE FROM inbox.tasks WHERE workspace_id = 'org_A'")
    const rel = await ok('inbox_relatorio', {}, owner, withInbox)
    assert(rel.atendimento.conversas_novas >= 2 && rel.periodo.de < rel.periodo.ate)
    await fails('inbox_relatorio', { de: '2026-12-01', ate: '2026-01-01' }, 'INVALID_INPUT', owner, withInbox)
    await fails('inbox_salvar_negocio', { titulo: 'x' }, 'NOT_FOUND')
    const { rows: [p] } = await admin.query("INSERT INTO inbox.pipelines (workspace_id, name) VALUES ('org_A', 'Vendas') RETURNING id")
    await admin.query(`INSERT INTO inbox.pipeline_stages (workspace_id, pipeline_id, name, kind, position) VALUES ('org_A', $1, 'Lead', 'aberto', 0), ('org_A', $1, 'Ganho', 'ganho', 1)`, [p.id])
    const deal = await ok('inbox_salvar_negocio', { titulo: 'Tênis da Maria', valor: 350, contato_id: contactId, responsavel: 'eu' })
    assert.equal((await ok('inbox_listar_negocios', {})).valor_total, 350)
    await ok('inbox_salvar_negocio', { negocio_id: deal.negocio_id, etapa: 'ganho' })
    const won = (await ok('inbox_listar_negocios', { situacao: 'ganho' })).negocios
    assert.deepEqual([won.length, won[0].responsavel_id, !!won[0].fechado_em], [1, 'u_owner', true])
    await fails('inbox_salvar_negocio', { negocio_id: deal.negocio_id, etapa: 'Inexistente' }, 'NOT_FOUND')
    const t = await ok('inbox_salvar_tarefa', { titulo: 'Ligar para a Maria', vence_em: '2020-01-01T10:00:00-03:00', contato_id: contactId, negocio_id: deal.negocio_id })
    assert.equal((await ok('inbox_listar_tarefas', { situacao: 'atrasadas', minhas: true })).tarefas[0].id, t.tarefa_id)
    await ok('inbox_salvar_tarefa', { tarefa_id: t.tarefa_id, concluida: true })
    assert.equal((await ok('inbox_listar_tarefas', {})).tarefas.length, 0)
    await admin.query(`INSERT INTO inbox.segments (workspace_id, name, rules) VALUES ('org_A', 'Maria e cia', '{"condicoes":[{"campo":"negocio","op":"ganho"}]}')`)
    const seg = (await ok('inbox_listar_segmentos', {})).segmentos[0]
    assert.deepEqual([seg.nome, seg.contatos, seg.regras], ['Maria e cia', 1, ['Tem negócio ganho']])
    assert.deepEqual((await ok('inbox_listar_disparos', {})).disparos, [])
    assert.deepEqual((await ok('inbox_listar_automacoes', {})).automacoes, [])
    await fails('inbox_salvar_artigo', { titulo: 'x', texto: 'y' }, 'ACCESS_DENIED', viewer)
    await ok('inbox_salvar_artigo', { titulo: 'Trocas', texto: 'Trocamos em até 7 dias com a etiqueta.' })
    assert.equal((await ok('inbox_buscar_conhecimento', { busca: 'posso trocar o tênis?' })).artigos[0].title, 'Trocas')
    const key = process.env.ANTHROPIC_API_KEY; delete process.env.ANTHROPIC_API_KEY
    const r = await call('inbox_sugerir_resposta', { conversa_id: convId }, owner, withInbox)
    assert(!r.ok && /ainda não foi ligada/.test(r.message ?? ''), 'IA desligada sem a chave')
    if (key) process.env.ANTHROPIC_API_KEY = key
    await fails('inbox_relatorio', {}, 'ACCESS_DENIED', stranger, withInbox)
  })
  await inboxPool.end()


  await admin.end()
  console.log(JSON.stringify({ status: 'passed', checks: checks.length }))
}
main().catch(error => { console.error(error); process.exit(1) })
