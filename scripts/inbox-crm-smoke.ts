// Inbox CRM (automations and what came after) against a real Postgres with the inbox migrations.
//   INBOX_TEST_DB_URL=postgres://postgres:pg@localhost/otto_test pnpm inbox:crm-smoke
// Without the database only the pure rules run. Meta, payment platforms, SES and Claude are fakes.
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import pg from 'pg'
import { isOpen, validate, fill, type Graph } from '../src/products/inbox/shared/flows'

process.env.INBOX_CREDENTIAL_KEY = randomBytes(32).toString('base64')
const checks: string[] = []
const check = async (name: string, fn: () => Promise<void> | void) => { await fn(); checks.push(name); console.log('PASS', name) }

async function pure() {
  await check('fluxos: validação antes de publicar, horário de atendimento e textos com dados do contato', () => {
    assert.deepEqual(validate({ start: null, nodes: [] }), ['A automação não tem blocos.'])
    const bad: Graph = { start: 'x', nodes: [{ id: 'a', type: 'mensagem', texto: '', next: 'zz' }, { id: 'b', type: 'esperar', minutos: 0 }, { id: 'c', type: 'pergunta', texto: 'oi', campo: 'Email!' }] }
    const problems = validate(bad).join(' | ')
    for (const p of ['bloco inicial', 'não existe', 'sem texto', 'Espera entre', 'nome de campo']) assert(problems.includes(p), p)
    assert.deepEqual(validate({ start: 'a', nodes: [{ id: 'a', type: 'mensagem', texto: 'Oi', botoes: [{ id: '1', label: 'Sim', next: 'b' }] }, { id: 'b', type: 'humano' }] }), [])
    const hours = { seg: [['09:00', '18:00']] as [string, string][] }
    assert.equal(isOpen(hours, 'America/Sao_Paulo', new Date('2026-11-23T13:00:00Z')), true, 'segunda 10h em Brasília')
    assert.equal(isOpen(hours, 'America/Sao_Paulo', new Date('2026-11-23T22:00:00Z')), false, 'segunda 19h')
    assert.equal(isOpen(hours, 'America/Sao_Paulo', new Date('2026-11-24T13:00:00Z')), false, 'terça fechado')
    assert.equal(isOpen(null), true)
    assert.equal(fill('Oi {{primeiro_nome}}, tamanho {{ tamanho }}{{nada}}!', { primeiro_nome: 'Ana', tamanho: 38 }), 'Oi Ana, tamanho 38!')
  })
}

async function database(url: string) {
  const { makeDb } = await import('../src/products/inbox/server/db')
  const { createTestChannel, simulateCustomer } = await import('../src/products/inbox/server/actions')
  const { ingest } = await import('../src/products/inbox/server/ingest')
  const { wakeRuns } = await import('../src/products/inbox/server/flows')
  const pool = new pg.Pool({ connectionString: url, max: 4 })
  const db = makeDb(() => pool)
  const sql = async (q: string, p: unknown[] = []): Promise<any[]> => (await pool.query(q, p)).rows // eslint-disable-line @typescript-eslint/no-explicit-any
  const tag = randomBytes(4).toString('hex')
  const org = 'org_crm_' + tag, other = 'org_crm2_' + tag
  const owner = { userId: 'u_crm_owner_' + tag, orgId: org }, viewer = { userId: 'u_crm_view_' + tag, orgId: org }, stranger = { userId: 'u_crm_str_' + tag, orgId: other }
  const ids: number[] = []
  const seed = async (user: string, o: string, role: string) => {
    const e = 8e9 + Math.floor(Math.random() * 1e9), u = 8e9 + Math.floor(Math.random() * 1e9)
    const [known] = await sql('SELECT id FROM shared.empresas WHERE clerk_organization_id = $1', [o])
    const empresa = known?.id ?? e
    if (!known) { await sql('INSERT INTO shared.empresas (id, clerk_organization_id) VALUES ($1, $2)', [empresa, o]); ids.push(empresa) }
    await sql('INSERT INTO shared.usuarios (id, clerk_user_id) VALUES ($1, $2)', [u, user]); ids.push(u)
    await sql(`INSERT INTO shared.usuarios_empresas (usuario_id, empresa_id, role, status) VALUES ($1, $2, $3, 'active')`, [u, empresa, role])
  }
  await seed(owner.userId, org, 'owner'); await seed(viewer.userId, org, 'viewer'); await seed(stranger.userId, other, 'owner')
  const asBrowser = <T>(who: typeof owner, fn: (q: (s: string, p?: unknown[]) => Promise<Record<string, unknown>[]>) => Promise<T>) => db.asPerson(who, fn as never) as Promise<T>
  const msgs = async (contactName: string) => (await sql(`SELECT m.direction, m.body, m.buttons FROM inbox.messages m JOIN inbox.conversations c ON c.id = m.conversation_id
    JOIN inbox.contacts k ON k.id = c.contact_id WHERE k.workspace_id = $1 AND k.name = $2 ORDER BY m.created_at, m.id`, [org, contactName]))
  const run = async (contactName: string) => (await sql(`SELECT r.* FROM inbox.flow_runs r JOIN inbox.contacts k ON k.id = r.contact_id WHERE k.workspace_id = $1 AND k.name = $2 ORDER BY r.started_at DESC LIMIT 1`, [org, contactName]))[0]
  const say = (name: string, texto: string) => simulateCustomer(owner, channel.id, { nome: name, texto }, { db })

  let channel: { id: string }
  try {
    channel = await createTestChannel(owner, 'Teste CRM', { db })
    const [vip] = await sql(`INSERT INTO inbox.tags (workspace_id, name) VALUES ($1, 'Lead quente') RETURNING id`, [org])

    // A menu with buttons, a validated question, a condition, a tag, a wait and a follow-up.
    const graph: Graph = { start: 'n1', nodes: [
      { id: 'n1', type: 'mensagem', texto: 'Oi {{primeiro_nome}}! Escolha:', botoes: [{ id: 'a', label: 'Produtos', next: 'n2' }, { id: 'b', label: 'Atendente', next: 'n5' }] },
      { id: 'n2', type: 'pergunta', texto: 'Qual seu e-mail?', campo: 'email', validar: 'email', next: 'n3' },
      { id: 'n3', type: 'condicao', regra: { tipo: 'campo', campo: 'email', operador: 'existe' }, sim: 'n4', nao: null },
      { id: 'n4', type: 'etiqueta', acao: 'colocar', etiqueta: vip.id, next: 'n6' },
      { id: 'n6', type: 'esperar', minutos: 60, next: 'n7' },
      { id: 'n7', type: 'mensagem', texto: 'Oi de novo, {{primeiro_nome}}! Ficou alguma dúvida?' },
      { id: 'n5', type: 'humano', texto: 'Vou chamar alguém!' },
    ] }
    assert.deepEqual(validate(graph), [])
    const [flow] = await sql(`INSERT INTO inbox.flows (workspace_id, name, draft, graph, status, version) VALUES ($1, 'Menu', $2, $2, 'ativo', 1) RETURNING id`, [org, graph])
    await sql(`INSERT INTO inbox.triggers (workspace_id, flow_id, kind, config) VALUES ($1, $2, 'palavra_chave', '{"palavras": ["menu"]}')`, [org, flow.id])

    await check('automação: palavra-chave abre o menu com botões; clique, pergunta validada, condição e etiqueta', async () => {
      await say('Ana Souza', 'Quero ver o MENU por favor')
      let r = await run('Ana Souza')
      assert.deepEqual([r.status, r.node_id], ['esperando_resposta', 'n1'])
      let m = await msgs('Ana Souza')
      assert.deepEqual(m.at(-1), { direction: 'saida', body: 'Oi Ana! Escolha:', buttons: ['Produtos', 'Atendente'] })
      await say('Ana Souza', 'produtos')
      r = await run('Ana Souza'); assert.deepEqual([r.status, r.node_id], ['esperando_resposta', 'n2'])
      await say('Ana Souza', 'não sei')
      m = await msgs('Ana Souza'); assert.match(m.at(-1).body, /Não entendi o e-mail/)
      await say('Ana Souza', 'Ana@Exemplo.com')
      r = await run('Ana Souza'); assert.deepEqual([r.status, r.node_id], ['aguardando', 'n6'])
      assert(new Date(r.wake_at).getTime() > Date.now() + 50 * 60000, 'espera de 1 hora')
      const [k] = await sql(`SELECT email, fields FROM inbox.contacts WHERE workspace_id = $1 AND name = 'Ana Souza'`, [org])
      assert.deepEqual([k.email, k.fields.email], ['ana@exemplo.com', 'Ana@Exemplo.com'])
      const [t] = await sql(`SELECT 1 FROM inbox.contact_tags x JOIN inbox.contacts k ON k.id = x.contact_id WHERE k.name = 'Ana Souza' AND x.tag_id = $1`, [vip.id])
      assert(t, 'etiqueta colocada')
    })

    await check('automação: o relógio acorda a espera e a automação termina; eventos por bloco para o relatório', async () => {
      assert.deepEqual(await wakeRuns({ service: db.service }), { acordadas: 0, expiradas: 0 }, 'ainda não é hora')
      await sql(`UPDATE inbox.flow_runs SET wake_at = now() - interval '1 minute' WHERE status = 'aguardando' AND workspace_id = $1`, [org])
      assert.equal((await wakeRuns({ service: db.service })).acordadas, 1)
      assert.equal((await msgs('Ana Souza')).at(-1).body, 'Oi de novo, Ana! Ficou alguma dúvida?')
      assert.equal((await run('Ana Souza')).status, 'concluido')
      const ev = await sql(`SELECT node_id, kind, detail FROM inbox.flow_events WHERE flow_id = $1 ORDER BY id`, [flow.id])
      assert(ev.some(e => e.kind === 'clicou' && e.detail === 'Produtos') && ev.some(e => e.kind === 'respondeu' && e.node_id === 'n2') && ev.some(e => e.kind === 'concluiu'))
    })

    await check('automação: "falar com alguém" passa para a equipe com nota; resposta fora dos botões sai do fluxo', async () => {
      await say('Bruno Lima', 'menu'); await say('Bruno Lima', 'Atendente')
      assert.equal((await run('Bruno Lima')).status, 'concluido')
      const [note] = await sql(`SELECT n.body, n.author FROM inbox.notes n JOIN inbox.conversations c ON c.id = n.conversation_id JOIN inbox.contacts k ON k.id = c.contact_id WHERE k.name = 'Bruno Lima' AND k.workspace_id = $1`, [org])
      assert.match(note.body, /passou a conversa para a equipe/); assert.equal(note.author, null)
      await say('Carla Dias', 'menu'); await say('Carla Dias', 'qual o horário de vocês?')
      assert.equal((await run('Carla Dias')).status, 'concluido', 'texto livre encerra o menu')
    })

    await check('gatilhos: link com código (origem do lead), primeira mensagem, fora do horário (1x a cada 12 h) e comentário', async () => {
      const mk = async (name: string, g: Graph, kind: string, config: object) => {
        const [f] = await sql(`INSERT INTO inbox.flows (workspace_id, name, draft, graph, status, version) VALUES ($1, $2, $3, $3, 'ativo', 1) RETURNING id`, [org, name, g])
        await sql(`INSERT INTO inbox.triggers (workspace_id, flow_id, kind, config) VALUES ($1, $2, $3, $4)`, [org, f.id, kind, config])
        return f.id as string
      }
      const one = (texto: string): Graph => ({ start: 'x', nodes: [{ id: 'x', type: 'mensagem', texto }] })
      await mk('Anúncio', one('Vi que você veio do anúncio de verão!'), 'link_ref', { codigo: 'anuncio_verao' })
      await say('Diego Reis', 'Olá! anuncio_verao')
      assert.equal((await msgs('Diego Reis')).at(-1).body, 'Vi que você veio do anúncio de verão!')
      assert.equal((await sql(`SELECT source FROM inbox.contacts WHERE workspace_id = $1 AND name = 'Diego Reis'`, [org]))[0].source, 'anuncio_verao')

      await mk('Boas-vindas', one('Bem-vindo à loja!'), 'primeira_mensagem', {})
      await say('Eva Rocha', 'oi')
      assert.equal((await msgs('Eva Rocha')).at(-1).body, 'Bem-vindo à loja!')
      await say('Eva Rocha', 'oi de novo')
      assert.equal((await msgs('Eva Rocha')).filter(x => x.body === 'Bem-vindo à loja!').length, 1, 'só na primeira')

      await sql(`INSERT INTO inbox.settings (workspace_id, business_hours) VALUES ($1, '{}')`, [org])  // closed every day
      await mk('Fora do horário', one('Estamos fora do horário.'), 'fora_do_horario', {})
      await say('Eva Rocha', 'alguém aí?'); await say('Eva Rocha', 'alô?')
      assert.equal((await msgs('Eva Rocha')).filter(x => x.body === 'Estamos fora do horário.').length, 1)

      await mk('Comentário', one('Oi! Te mandei o link 😉'), 'comentario', { palavras: ['link'] })
      const [ch] = await sql('SELECT external_id FROM inbox.channels WHERE id = $1', [channel.id])
      await ingest([{ type: 'comment', channelKind: 'teste', channelId: ch.external_id, commentId: 'c1-' + tag, postId: 'p1', contactId: 'ig-fabi', username: 'fabi', text: 'quero o LINK', at: new Date() }], { service: db.service })
      const fabi = await msgs('@fabi')
      assert.deepEqual(fabi.map(x => x.body), ['Comentou no post: "quero o LINK"', 'Oi! Te mandei o link 😉'])
      assert.equal((await run('@fabi')).vars.comment_id, 'c1-' + tag)
    })

    await check('acesso: quem só visualiza não cria automação; outra empresa não vê; execuções só pelo servidor', async () => {
      await assert.rejects(asBrowser(viewer, q => q(`INSERT INTO inbox.flows (workspace_id, name) VALUES ($1, 'x')`, [org])), /row-level security/)
      assert.equal((await asBrowser(stranger, q => q('SELECT id FROM inbox.flows WHERE workspace_id = $1', [org]))).length, 0)
      assert((await asBrowser(viewer, q => q('SELECT id FROM inbox.flow_events WHERE flow_id = $1', [flow.id]))).length > 0, 'quem visualiza vê o relatório')
      await assert.rejects(asBrowser(owner, q => q(`INSERT INTO inbox.flow_runs (workspace_id, flow_id, contact_id) SELECT $1, $2, id FROM inbox.contacts WHERE workspace_id = $1 LIMIT 1`, [org, flow.id])), /permission denied/)
      const [otherFlow] = await sql(`INSERT INTO inbox.flows (workspace_id, name) VALUES ($1, 'de outra') RETURNING id`, [other])
      await assert.rejects(asBrowser(owner, q => q(`INSERT INTO inbox.triggers (workspace_id, flow_id, kind) VALUES ($1, $2, 'primeira_mensagem')`, [org, otherFlow.id])), /row-level security/, 'gatilho não aponta para fluxo de outra empresa')
      await asBrowser(owner, q => q(`UPDATE inbox.flows SET status = 'pausado' WHERE id = $1`, [flow.id]))
      await say('Gil Prado', 'menu')
      assert.notEqual((await run('Gil Prado'))?.flow_id, flow.id, 'automação pausada não roda')
    })
  } finally {
    for (const o of [org, other]) {
      await sql('DELETE FROM inbox.flows WHERE workspace_id = $1', [o]); await sql('DELETE FROM inbox.channels WHERE workspace_id = $1', [o])
      await sql('DELETE FROM inbox.contacts WHERE workspace_id = $1', [o]); await sql('DELETE FROM inbox.tags WHERE workspace_id = $1', [o]); await sql('DELETE FROM inbox.settings WHERE workspace_id = $1', [o])
    }
    await sql('DELETE FROM shared.usuarios_empresas WHERE empresa_id = ANY($1) OR usuario_id = ANY($1)', [ids])
    await sql('DELETE FROM shared.empresas WHERE id = ANY($1)', [ids]); await sql('DELETE FROM shared.usuarios WHERE id = ANY($1)', [ids])
    await pool.end()
  }
}

async function main() {
  await pure()
  const url = process.env.INBOX_TEST_DB_URL
  if (url) await database(url)
  console.log(JSON.stringify({ status: 'passed', checks: checks.length, database: url ? 'tested' : 'skipped (INBOX_TEST_DB_URL)' }))
}
main().catch(error => { console.error(error); process.exit(1) })
