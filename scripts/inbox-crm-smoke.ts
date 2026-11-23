// Inbox CRM (automations and what came after) against a real Postgres with the inbox migrations.
//   INBOX_TEST_DB_URL=postgres://postgres:pg@localhost/otto_test pnpm inbox:crm-smoke
// Without the database only the pure rules run. Meta, payment platforms, SES and Claude are fakes.
import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import pg from 'pg'
import { createHmac } from 'node:crypto'
import { isOpen, validate, fill, type Graph } from '../src/products/inbox/shared/flows'
import { parseSale, SignatureError } from '../src/products/inbox/server/sales'

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

  await check('vendas: assinatura de Hotmart, Kiwify, Eduzz e Stripe conferida e formato de cada uma lido', () => {
    const H = (h: Record<string, string>) => new Headers(h), Q = (q = '') => new URLSearchParams(q)
    const hot = JSON.stringify({ event: 'PURCHASE_APPROVED', data: { product: { name: 'Curso X' }, buyer: { name: 'Ana', email: 'ANA@x.com', checkout_phone: '11988887777' }, purchase: { transaction: 'HP1', price: { value: 497, currency_value: 'BRL' } } } })
    assert.deepEqual(parseSale('hotmart', hot, H({ 'x-hotmart-hottok': 'segredo123' }), Q(), 'segredo123').map(e => [e.kind, e.externalId, e.product, e.amount, e.customer.email]), [['aprovada', 'HP1', 'Curso X', 497, 'ANA@x.com']])
    assert.throws(() => parseSale('hotmart', hot, H({ 'x-hotmart-hottok': 'errado' }), Q(), 'segredo123'), SignatureError)
    assert.deepEqual(parseSale('hotmart', JSON.stringify({ event: 'CLUB_FIRST_ACCESS' }), H({ 'x-hotmart-hottok': 'segredo123' }), Q(), 'segredo123'), [], 'evento que não usamos')
    const kiwi = JSON.stringify({ order_id: 'K1', order_status: 'refunded', Product: { product_name: 'Ebook' }, Customer: { full_name: 'Bia', email: 'bia@x.com', mobile: '+5511977776666' }, Commissions: { charge_amount: 4790 } })
    const kSig = createHmac('sha1', 'tokkiwi99').update(kiwi).digest('hex')
    assert.deepEqual(parseSale('kiwify', kiwi, H({}), Q('signature=' + kSig), 'tokkiwi99').map(e => [e.kind, e.amount]), [['reembolsada', 47.9]])
    assert.throws(() => parseSale('kiwify', kiwi, H({}), Q('signature=abc'), 'tokkiwi99'), SignatureError)
    const cart = JSON.stringify({ id: 'C1', name: 'Caio', email: 'caio@x.com', product_name: 'Curso X', checkout_link: 'https://pay.kiwify.com.br/abc' })
    assert.equal(parseSale('kiwify', cart, H({}), Q('signature=' + createHmac('sha1', 'tokkiwi99').update(cart).digest('hex')), 'tokkiwi99')[0].kind, 'carrinho')
    const edz = JSON.stringify({ event: 'myeduzz.invoice_paid', data: { id: 'E1', buyer: { name: 'Davi', email: 'davi@x.com' }, items: [{ name: 'Mentoria' }], price: { value: 1997, currency: 'BRL' } } })
    assert.equal(parseSale('eduzz', edz, H({ 'x-signature': createHmac('sha256', 'chave-eduzz').update(edz).digest('hex') }), Q(), 'chave-eduzz')[0].product, 'Mentoria')
    const now = Date.now(), t = Math.floor(now / 1000)
    const st = JSON.stringify({ type: 'checkout.session.completed', data: { object: { id: 'cs_1', payment_intent: 'pi_1', payment_status: 'paid', amount_total: 9900, currency: 'brl', customer_details: { name: 'Eva', email: 'eva@x.com' }, metadata: { produto: 'Plano Pro' } } } })
    const sSig = createHmac('sha256', 'whsec_teste').update(`${t}.${st}`).digest('hex')
    assert.deepEqual(parseSale('stripe', st, H({ 'stripe-signature': `t=${t},v1=${sSig}` }), Q(), 'whsec_teste', now).map(e => [e.kind, e.externalId, e.amount, e.currency, e.product]), [['aprovada', 'pi_1', 99, 'BRL', 'Plano Pro']])
    assert.throws(() => parseSale('stripe', st, H({ 'stripe-signature': `t=${t - 600},v1=${sSig}` }), Q(), 'whsec_teste', now), SignatureError, 'entrega antiga recusada')
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
  const asBrowser = <T>(who: typeof owner, fn: (q: (s: string, p?: unknown[]) => Promise<any[]>) => Promise<T>) => db.asPerson(who, fn as never) as Promise<T> // eslint-disable-line @typescript-eslint/no-explicit-any
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

    await check('vendas: integração com segredo cifrado; compra liga ao contato pelo e-mail e inicia automação; repetida não duplica', async () => {
      const { createIntegration, receiveSale } = await import('../src/products/inbox/server/sales')
      await assert.rejects(createIntegration(viewer, { provider: 'hotmart', segredo: 'hottok-123456' }, db), /só pode visualizar/)
      await assert.rejects(createIntegration(owner, { provider: 'stripe', segredo: 'sk_live_123456' }, db), /whsec_/)
      const integ = await createIntegration(owner, { provider: 'hotmart', nome: 'Hotmart curso', segredo: 'hottok-123456' }, db)
      const token = integ.caminho.split('/').pop()!
      const [sealed] = await sql('SELECT secret_sealed FROM inbox_private.integration_secrets s JOIN inbox.integrations i ON i.id = s.integration_id WHERE i.token = $1', [token])
      assert(!sealed.secret_sealed.includes('hottok'), 'segredo cifrado')
      const one = (g: string): Graph => ({ start: 'x', nodes: [{ id: 'x', type: 'mensagem', texto: g }] })
      for (const [kind, text] of [['compra', 'Obrigado pela compra do {{produto}}, {{primeiro_nome}}!'], ['reembolso', 'Seu reembolso foi registrado.'], ['carrinho_abandonado', 'Esqueceu algo? {{link_checkout}}']] as const) {
        const [f] = await sql(`INSERT INTO inbox.flows (workspace_id, name, draft, graph, status, version) VALUES ($1, $2, $3, $3, 'ativo', 1) RETURNING id`, [org, kind, one(text)])
        await sql(`INSERT INTO inbox.triggers (workspace_id, flow_id, kind) VALUES ($1, $2, $3)`, [org, f.id, kind])
      }
      const H = new Headers({ 'x-hotmart-hottok': 'hottok-123456' }), Q = new URLSearchParams()
      const hot = (event: string, tx: string) => JSON.stringify({ event, data: { product: { name: 'Curso X' }, buyer: { name: 'Ana Souza', email: 'ANA@exemplo.com' }, purchase: { transaction: tx, price: { value: 497 } }, checkout: { url: 'https://pay.hotmart.com/x' } } })
      assert.equal((await receiveSale(db.service, token, hot('PURCHASE_APPROVED', 'T1'), new Headers({ 'x-hotmart-hottok': 'errado' }), Q)).status, 401)
      assert.deepEqual((await receiveSale(db.service, token, hot('PURCHASE_OUT_OF_SHOPPING_CART', 'CART1'), H, Q)).done, ['carrinho'])
      assert.equal((await msgs('Ana Souza')).at(-1).body, 'Esqueceu algo? https://pay.hotmart.com/x')
      assert.deepEqual((await receiveSale(db.service, token, hot('PURCHASE_APPROVED', 'T1'), H, Q)).done, ['aprovada'])
      assert.equal((await msgs('Ana Souza')).at(-1).body, 'Obrigado pela compra do Curso X, Ana!')
      assert.deepEqual((await receiveSale(db.service, token, hot('PURCHASE_APPROVED', 'T1'), H, Q)).done, ['repetido'], 'entrega repetida')
      const [p] = await sql(`SELECT p.status, p.amount, k.name FROM inbox.purchases p JOIN inbox.contacts k ON k.id = p.contact_id WHERE p.workspace_id = $1 AND p.external_id = 'T1'`, [org])
      assert.deepEqual([p.status, Number(p.amount), p.name], ['aprovada', 497, 'Ana Souza'], 'ligada à Ana pelo e-mail (maiúsculas não importam)')
      assert((await sql(`SELECT recovered_at FROM inbox.abandoned_carts WHERE workspace_id = $1 AND external_id = 'CART1'`, [org]))[0].recovered_at, 'carrinho recuperado')
      assert.deepEqual((await receiveSale(db.service, token, hot('PURCHASE_REFUNDED', 'T1'), H, Q)).done, ['reembolsada'])
      assert.equal((await msgs('Ana Souza')).at(-1).body, 'Seu reembolso foi registrado.')
      const novo = JSON.stringify({ event: 'PURCHASE_APPROVED', data: { product: { name: 'Ebook' }, buyer: { name: 'Novo Cliente', email: 'novo@x.com', checkout_phone: '11966665555' }, purchase: { transaction: 'T2', price: { value: 47 } } } })
      await receiveSale(db.service, token, novo, H, Q)
      const [k] = await sql(`SELECT name, phone FROM inbox.contacts WHERE workspace_id = $1 AND email = 'novo@x.com'`, [org])
      assert.deepEqual([k.name, k.phone], ['Novo Cliente', '+5511966665555'], 'comprador novo vira contato')
      await sql(`UPDATE inbox.integrations SET status = 'pausada' WHERE token = $1`, [token])
      assert.deepEqual((await receiveSale(db.service, token, hot('PURCHASE_APPROVED', 'T3'), H, Q)).done, ['pausada'])
      await assert.rejects(asBrowser(owner, q => q(`INSERT INTO inbox.purchases (workspace_id, contact_id, provider, external_id, status) SELECT $1, id, 'hotmart', 'x', 'aprovada' FROM inbox.contacts WHERE workspace_id = $1 LIMIT 1`, [org])), /permission denied/, 'compra só pelo servidor')
      await assert.rejects(asBrowser(owner, q => q('SELECT * FROM inbox_private.integration_secrets')), /permission denied/)
      assert.equal((await asBrowser(stranger, q => q('SELECT id FROM inbox.purchases WHERE workspace_id = $1', [org]))).length, 0)
    })

    await check('negócios: funil e etapas pelo navegador; mover grava histórico e data de fechamento; automação cria negócio; compra marca ganho', async () => {
      const { wonFromPurchase } = await import('../src/products/inbox/server/deals')
      const { pipe, stages } = await asBrowser(owner, async q => {
        const [p] = await q(`INSERT INTO inbox.pipelines (workspace_id, name) VALUES ($1, 'Vendas') RETURNING id`, [org])
        const st: Record<string, string> = {}
        for (const [i, [n, k]] of [['Lead', 'aberto'], ['Proposta', 'aberto'], ['Ganho', 'ganho'], ['Perdido', 'perdido']].entries()) {
          const [r] = await q(`INSERT INTO inbox.pipeline_stages (workspace_id, pipeline_id, name, kind, position) VALUES ($1, $2, $3, $4, $5) RETURNING id`, [org, p.id, n, k, i]); st[n] = r.id as string
        }
        return { pipe: p.id as string, stages: st }
      })
      const [ana] = await sql(`SELECT id FROM inbox.contacts WHERE workspace_id = $1 AND name = 'Ana Souza'`, [org])
      const [deal] = await asBrowser(owner, q => q(`INSERT INTO inbox.deals (workspace_id, pipeline_id, stage_id, contact_id, title, value) VALUES ($1, $2, $3, $4, 'Mentoria Ana', 1500) RETURNING id, closed_at`, [org, pipe, stages.Lead, ana.id]))
      assert.equal(deal.closed_at, null)
      await asBrowser(owner, q => q('UPDATE inbox.deals SET stage_id = $2 WHERE id = $1', [deal.id, stages.Perdido]))
      let [d] = await sql('SELECT closed_at FROM inbox.deals WHERE id = $1', [deal.id]); assert(d.closed_at, 'perdido fecha')
      await asBrowser(owner, q => q('UPDATE inbox.deals SET stage_id = $2 WHERE id = $1', [deal.id, stages.Proposta]))
      ;[d] = await sql('SELECT closed_at FROM inbox.deals WHERE id = $1', [deal.id]); assert.equal(d.closed_at, null, 'reaberto')
      const ev = await sql('SELECT from_stage, to_stage, by FROM inbox.deal_events WHERE deal_id = $1 ORDER BY id', [deal.id])
      assert.deepEqual(ev.map(e => e.to_stage), [stages.Lead, stages.Perdido, stages.Proposta]); assert.equal(ev[1].by, owner.userId)
      await assert.rejects(asBrowser(viewer, q => q('UPDATE inbox.deals SET stage_id = $2 WHERE id = $1 RETURNING id', [deal.id, stages.Lead]).then(r => { if (!r.length) throw new Error('row-level security') })), /row-level security/)
      const [otherPipe] = await sql(`INSERT INTO inbox.pipelines (workspace_id, name) VALUES ($1, 'Outro') RETURNING id`, [org])
      await assert.rejects(asBrowser(owner, q => q(`INSERT INTO inbox.deals (workspace_id, pipeline_id, stage_id, title) VALUES ($1, $2, $3, 'x')`, [org, otherPipe.id, stages.Lead])), /row-level security/, 'etapa de outro funil')
      await assert.rejects(asBrowser(owner, q => q(`INSERT INTO inbox.deal_events (workspace_id, deal_id, to_stage) VALUES ($1, $2, $3)`, [org, deal.id, stages.Lead])), /permission denied/, 'histórico só pelo banco')
      // Automation block "Criar negócio".
      const g: Graph = { start: 'n', nodes: [{ id: 'n', type: 'negocio', funil: pipe, etapa: stages.Lead, titulo: 'Lead {{primeiro_nome}} – {{produto}}' }] }
      const [f] = await sql(`INSERT INTO inbox.flows (workspace_id, name, draft, graph, status, version) VALUES ($1, 'cria negócio', $2, $2, 'ativo', 1) RETURNING id`, [org, g])
      await sql(`INSERT INTO inbox.triggers (workspace_id, flow_id, kind, config) VALUES ($1, $2, 'palavra_chave', '{"palavras":["orcamento"]}')`, [org, f.id])
      await say('Hugo Melo', 'quero um orcamento')
      const [hd] = await sql(`SELECT d.title, d.stage_id FROM inbox.deals d JOIN inbox.contacts k ON k.id = d.contact_id WHERE k.name = 'Hugo Melo' AND k.workspace_id = $1`, [org])
      assert.deepEqual([hd.title, hd.stage_id], ['Lead Hugo – ', stages.Lead])
      await say('Hugo Melo', 'orcamento de novo')
      assert.equal((await sql(`SELECT count(*)::int n FROM inbox.deals d JOIN inbox.contacts k ON k.id = d.contact_id WHERE k.name = 'Hugo Melo'`))[0].n, 1, 'não duplica negócio aberto')
      // Approved purchase wins the open deal (value kept), lost/closed ones stay.
      await wonFromPurchase(db.service, org, ana.id, 497)
      ;[d] = await sql('SELECT stage_id, value, closed_at FROM inbox.deals WHERE id = $1', [deal.id])
      assert.deepEqual([d.stage_id, Number(d.value), !!d.closed_at], [stages.Ganho, 1500, true])
      await asBrowser(owner, q => q(`INSERT INTO inbox.tasks (workspace_id, title, deal_id, contact_id, assignee) VALUES ($1, 'Ligar', $2, $3, $4)`, [org, deal.id, ana.id, owner.userId]))
      const [otherContact] = await sql(`INSERT INTO inbox.contacts (workspace_id, name) VALUES ($1, 'de outra') RETURNING id`, [other])
      await assert.rejects(asBrowser(owner, q => q(`INSERT INTO inbox.tasks (workspace_id, title, contact_id) VALUES ($1, 'x', $2)`, [org, otherContact.id])), /row-level security/)
      assert.equal((await asBrowser(stranger, q => q('SELECT id FROM inbox.deals WHERE workspace_id = $1', [org]))).length, 0)
    })

    await check('segmentos: etiqueta, compra, reembolso, total gasto, negócio, origem e campo; "qualquer"; salvo; acesso por empresa', async () => {
      const { previewSegment, listSources } = await import('../src/products/inbox/server/segments')
      const names = async (regras: unknown, who = owner) => (await previewSegment(who, { regras, limite: 100 }, db)).contatos.map(c => c.name).sort()
      const C = (campo: string, op: string, valor?: unknown, chave?: string) => ({ campo, op, valor, chave })
      await asBrowser(owner, q => q(`UPDATE inbox.contacts SET source = 'anuncio-bf' WHERE workspace_id = $1 AND name = 'Ana Souza'`, [org]))
      await sql(`UPDATE inbox.contacts SET fields = fields || '{"cidade": "Recife"}' WHERE workspace_id = $1 AND name = 'Hugo Melo'`, [org])
      assert((await names({ condicoes: [C('etiqueta', 'tem', vip.id)] })).includes('Ana Souza'))
      assert.deepEqual(await names({ condicoes: [C('comprou', 'sim')] }), ['Novo Cliente'], 'Ana foi reembolsada')
      assert.deepEqual(await names({ condicoes: [C('reembolsou', 'sim', 'curso')] }), ['Ana Souza'])
      assert.deepEqual(await names({ condicoes: [C('comprou', 'sim', 'curso')] }), [])
      assert.deepEqual(await names({ condicoes: [C('total_gasto', 'maior', '40,5')] }), ['Novo Cliente'])
      assert.deepEqual(await names({ condicoes: [C('negocio', 'aberto')] }), ['Hugo Melo'])
      assert.deepEqual(await names({ condicoes: [C('negocio', 'ganho'), C('canal', 'tem', 'teste'), C('criado', 'ha_menos', 1)] }), ['Ana Souza'])
      assert.deepEqual(await names({ modo: 'qualquer', condicoes: [C('origem', 'igual', 'ANUNCIO-BF'), C('campo', 'igual', 'recife', 'cidade')] }), ['Ana Souza', 'Hugo Melo'])
      assert.deepEqual(await names({ condicoes: [C('origem', 'contem', '%')] }), [], '% é literal')
      assert(!(await names({ condicoes: [C('ultima_mensagem', 'ha_menos', 1)] })).includes('Novo Cliente'), 'comprador que nunca escreveu')
      const all = (await previewSegment(owner, { regras: {}, limite: 0 }, db)).total
      assert.equal(all, Number((await sql('SELECT count(*) n FROM inbox.contacts WHERE workspace_id = $1', [org]))[0].n), 'sem condições = todos')
      await assert.rejects(previewSegment(owner, { regras: { condicoes: [C('campo', 'igual', 'x', "a'; drop")] } }, db), /nome do campo/)
      await assert.rejects(previewSegment(owner, { regras: { condicoes: [C('etiqueta', 'tem', 'não-é-id')] } }, db), /etiqueta/)
      await assert.rejects(previewSegment(owner, { regras: { condicoes: [C('total_gasto', 'igual', 1)] } }, db), /opção válida/)
      const [seg] = await asBrowser(owner, q => q(`INSERT INTO inbox.segments (workspace_id, name, rules) VALUES ($1, 'Abertos', $2) RETURNING id`, [org, { modo: 'todas', condicoes: [C('negocio', 'aberto')] }]))
      assert.deepEqual((await previewSegment(viewer, { segmento_id: seg.id }, db)).contatos.map(c => c.name), ['Hugo Melo'], 'quem visualiza usa o segmento')
      await assert.rejects(asBrowser(viewer, q => q(`INSERT INTO inbox.segments (workspace_id, name) VALUES ($1, 'x')`, [org])), /row-level security/)
      await assert.rejects(previewSegment(stranger, { segmento_id: seg.id }, db), /não encontrado/)
      assert.equal((await previewSegment(stranger, { regras: {} }, db)).total, 1, 'outra empresa só vê os seus')
      assert.deepEqual((await listSources(owner, db)).find(s => s.origem === 'anuncio-bf')?.contatos, 1)
    })

    await check('disparos: modelo aprovado, SAIR/VOLTAR, segmento enviado aos poucos sem quem saiu; e-mail assinado com descadastro; agendar e cancelar', async () => {
      const B = await import('../src/products/inbox/server/broadcasts')
      const deps = { service: db.service }
      assert.deepEqual(B.templateProblems({ body: '{{1}} oi', variables: ['nome'], buttons: [], header: null, footer: null }).length, 1, 'variável no começo')
      assert.match(B.templateProblems({ body: 'Oi {{2}} tudo', variables: ['nome'], buttons: [], header: null, footer: null }).join(' '), /Falta a variável \{\{1\}\}/)
      const [tpl] = await asBrowser(owner, q => q(`INSERT INTO inbox.wa_templates (workspace_id, channel_id, name, body, variables, buttons) VALUES ($1, $2, 'promo', 'Oi {{1}}, a oferta acaba hoje!', '["primeiro_nome"]', '["Quero", "SAIR"]') RETURNING id`, [org, channel.id]))
      await assert.rejects(asBrowser(owner, q => q(`UPDATE inbox.wa_templates SET status = 'aprovado' WHERE id = $1`, [tpl.id])), /permission denied/, 'aprovação só pelo servidor')
      await assert.rejects(B.submitTemplateFor(viewer, tpl.id, db, deps), /só pode visualizar/)
      assert.deepEqual(await B.submitTemplateFor(owner, tpl.id, db, deps), { status: 'aprovado' }, 'canal de teste aprova na hora')
      // Ana answers SAIR: out of broadcasts, confirmation sent, automations not triggered.
      await say('Ana Souza', 'Sair!')
      assert.match((await msgs('Ana Souza')).at(-1).body, /não vai mais receber/)
      assert.equal((await sql(`SELECT count(*)::int n FROM inbox.optouts o JOIN inbox.contacts k ON k.id = o.contact_id WHERE k.name = 'Ana Souza' AND o.kind = 'whatsapp'`))[0].n, 1)
      const [seg] = await sql(`INSERT INTO inbox.segments (workspace_id, name, rules) VALUES ($1, 'Teste', '{"modo":"todas","condicoes":[{"campo":"canal","op":"tem","valor":"teste"}]}') RETURNING id`, [org])
      const reach = (await sql(`SELECT count(DISTINCT i.contact_id)::int n FROM inbox.contact_identities i WHERE i.channel_id = $1`, [channel.id]))[0].n
      const [bc] = await asBrowser(owner, q => q(`INSERT INTO inbox.broadcasts (workspace_id, name, kind, channel_id, template_id, segment_id) VALUES ($1, 'Promo', 'whatsapp', $2, $3, $4) RETURNING id`, [org, channel.id, tpl.id, seg.id]))
      const [foreign] = await sql(`INSERT INTO inbox.segments (workspace_id, name) VALUES ($1, 'x') RETURNING id`, [other])
      await assert.rejects(asBrowser(owner, q => q(`INSERT INTO inbox.broadcasts (workspace_id, name, kind, segment_id) VALUES ($1, 'x', 'email', $2)`, [org, foreign.id])), /row-level security/, 'segmento de outra empresa')
      await assert.rejects(B.startBroadcast(viewer, bc.id, db, deps), /só pode visualizar/)
      const started = await B.startBroadcast(owner, bc.id, db, deps)
      assert.deepEqual([started.status, started.total, started.ignorados], ['enviando', reach, 1], 'Ana fica de fora')
      await assert.rejects(B.startBroadcast(owner, bc.id, db, deps), /já foi iniciado/)
      assert.equal((await asBrowser(owner, q => q(`UPDATE inbox.broadcasts SET name = 'mudou' WHERE id = $1 RETURNING id`, [bc.id]))).length, 0, 'depois de iniciado, só o servidor')
      let r = await B.runBroadcasts(deps, { batch: 2 })
      assert.equal(r.enviados, 2, 'aos poucos')
      r = await B.runBroadcasts(deps, { batch: 100 })
      const [done] = await sql('SELECT status, sent, failed, skipped, total FROM inbox.broadcasts WHERE id = $1', [bc.id])
      assert.deepEqual([done.status, done.sent, done.failed, done.skipped], ['concluido', reach - 1, 0, 1])
      assert.equal((await msgs('Hugo Melo')).at(-1).body, 'Oi Hugo, a oferta acaba hoje!')
      assert.notEqual((await msgs('Ana Souza')).at(-1).body, 'Oi Ana, a oferta acaba hoje!')
      assert.equal((await B.runBroadcasts(deps)).enviados, 0, 'nada repetido')
      await say('Ana Souza', 'voltar')
      assert.equal((await sql(`SELECT count(*)::int n FROM inbox.optouts o JOIN inbox.contacts k ON k.id = o.contact_id WHERE k.name = 'Ana Souza'`))[0].n, 0)
      await assert.rejects(asBrowser(owner, q => q(`INSERT INTO inbox.broadcast_recipients (broadcast_id, workspace_id, contact_id) SELECT $1, $2, id FROM inbox.contacts WHERE workspace_id = $2 LIMIT 1`, [bc.id, org])), /permission denied/)
      // E-mail: off without SES; with SES, signed request, filled subject, legal footer and unsubscribe that works.
      const [eseg] = await sql(`INSERT INTO inbox.segments (workspace_id, name, rules) VALUES ($1, 'Com e-mail', '{"condicoes":[{"campo":"email","op":"preenchido"}]}') RETURNING id`, [org])
      const [em] = await asBrowser(owner, q => q(`INSERT INTO inbox.broadcasts (workspace_id, name, kind, segment_id, subject, body) VALUES ($1, 'News', 'email', $2, '{{primeiro_nome}}, novidade', 'Oi {{primeiro_nome}}!\n\nVeja https://x.com') RETURNING id`, [org, eseg.id]))
      await assert.rejects(B.startBroadcast(owner, em.id, db, { ...deps, ses: null }), /Amazon SES/)
      const ses = { region: 'sa-east-1', accessKeyId: 'AKIATEST', secretAccessKey: 'segredo', endpoint: 'https://ses.test' }
      await assert.rejects(B.startBroadcast(owner, em.id, db, { ...deps, ses }), /remetente/)
      await asBrowser(owner, q => q(`INSERT INTO inbox.email_settings (workspace_id, from_name, from_email, address) VALUES ($1, 'Loja "X"', 'oi@loja.com', 'Rua Y, 1') ON CONFLICT (workspace_id) DO UPDATE SET workspace_id = excluded.workspace_id, from_name = excluded.from_name, from_email = excluded.from_email, address = excluded.address`, [org]))
      const sent: { url: string; headers: Record<string, string>; body: Record<string, any> }[] = [] // eslint-disable-line @typescript-eslint/no-explicit-any
      const fakeSes = (async (url: URL, init: RequestInit) => { sent.push({ url: String(url), headers: init.headers as Record<string, string>, body: JSON.parse(String(init.body)) }); return Response.json({ MessageId: 'ses-' + sent.length }) }) as unknown as typeof fetch
      const emailCount = (await sql(`SELECT count(*)::int n FROM inbox.contacts WHERE workspace_id = $1 AND email IS NOT NULL`, [org]))[0].n
      assert((await B.startBroadcast(owner, em.id, db, { ...deps, ses })).total === emailCount)
      await B.runBroadcasts({ ...deps, ses, send: fakeSes, baseUrl: 'https://app.test' })
      assert.equal(sent.length, emailCount)
      const ana = sent.find(s => s.body.Destination.ToAddresses[0].startsWith('ana'))!
      assert.equal(ana.url, 'https://ses.test/v2/email/outbound-emails')
      assert.match(ana.headers.authorization, /^AWS4-HMAC-SHA256 Credential=AKIATEST\/\d{8}\/sa-east-1\/ses\/aws4_request, SignedHeaders=content-type;host;x-amz-date, Signature=[0-9a-f]{64}$/)
      assert.equal(ana.body.FromEmailAddress, '"Loja X" <oi@loja.com>')
      assert.equal(ana.body.Content.Simple.Subject.Data, 'Ana, novidade')
      const html: string = ana.body.Content.Simple.Body.Html.Data
      assert(html.includes('<a href="https://x.com">') && html.includes('Rua Y, 1'))
      const unsub = ana.body.Content.Simple.Headers[0].Value.slice(1, -1) as string
      assert(unsub.startsWith('https://app.test/api/inbox/sair?t='))
      const token = new URL(unsub).searchParams.get('t')!
      assert.equal(B.verifyOptoutToken(token.slice(0, -1) + (token.endsWith('A') ? 'B' : 'A')), null, 'link adulterado')
      assert(await B.optOutByToken(db.service, token))
      assert.equal((await sql(`SELECT kind FROM inbox.optouts o JOIN inbox.contacts k ON k.id = o.contact_id WHERE k.name = 'Ana Souza'`))[0].kind, 'email')
      // Scheduling and cancelling.
      const [later] = await asBrowser(owner, q => q(`INSERT INTO inbox.broadcasts (workspace_id, name, kind, channel_id, template_id, segment_id, scheduled_at) VALUES ($1, 'Depois', 'whatsapp', $2, $3, $4, now() + interval '1 day') RETURNING id`, [org, channel.id, tpl.id, seg.id]))
      assert.equal((await B.startBroadcast(owner, later.id, db, deps)).status, 'agendado')
      assert.equal((await B.runBroadcasts(deps)).iniciados, 0)
      await sql(`UPDATE inbox.broadcasts SET scheduled_at = now() - interval '1 minute' WHERE id = $1`, [later.id])
      assert.equal((await B.runBroadcasts(deps, { batch: 1 })).iniciados, 1)
      assert.equal((await B.cancelBroadcast(owner, later.id, db, deps)).status, 'cancelado')
      const [c] = await sql('SELECT status, sent, skipped, total FROM inbox.broadcasts WHERE id = $1', [later.id])
      assert.deepEqual([c.status, c.sent, c.skipped], ['cancelado', 1, c.total - 1])
      assert.equal((await B.runBroadcasts(deps)).enviados, 0, 'cancelado não envia mais')
    })

    await check('times: rodízio entre disponíveis, prazo de resposta com nota, avaliação 1-5 ao encerrar e envio de arquivo', async () => {
      const T = await import('../src/products/inbox/server/teams')
      const { reply, replyWithFile } = await import('../src/products/inbox/server/actions')
      await assert.rejects(asBrowser(viewer, q => q(`INSERT INTO inbox.teams (workspace_id, name) VALUES ($1, 'x')`, [org])), /row-level security/)
      const [team] = await asBrowser(owner, q => q(`INSERT INTO inbox.teams (workspace_id, name) VALUES ($1, 'Vendas') RETURNING id`, [org]))
      for (const u of [owner.userId, viewer.userId]) await asBrowser(owner, q => q(`INSERT INTO inbox.team_members (workspace_id, team_id, user_id) VALUES ($1, $2, $3)`, [org, team.id, u]))
      await asBrowser(owner, q => q('UPDATE inbox.channels SET team_id = $2 WHERE id = $1', [channel.id, team.id]))
      const [foreignTeam] = await sql(`INSERT INTO inbox.teams (workspace_id, name) VALUES ($1, 'Outro') RETURNING id`, [other])
      await assert.rejects(asBrowser(owner, q => q('UPDATE inbox.channels SET team_id = $2 WHERE id = $1', [channel.id, foreignTeam.id])), /outra empresa/)
      const conv = async (name: string) => (await sql(`SELECT c.* FROM inbox.conversations c JOIN inbox.contacts k ON k.id = c.contact_id WHERE k.workspace_id = $1 AND k.name = $2`, [org, name]))[0]
      await say('Ivo Alves', 'oi, tudo bem?'); await say('Joana Brito', 'olá')
      const [ivo, joana] = [await conv('Ivo Alves'), await conv('Joana Brito')]
      assert.deepEqual([ivo.team_id, joana.team_id], [team.id, team.id])
      assert.deepEqual(new Set([ivo.assignee, joana.assignee]), new Set([owner.userId, viewer.userId]), 'uma para cada')
      // The viewer marks themself away (own row only) and gets nothing new.
      await asBrowser(viewer, q => q('UPDATE inbox.team_members SET available = false WHERE team_id = $1 AND user_id = $2', [team.id, viewer.userId]))
      assert.equal((await asBrowser(viewer, q => q('UPDATE inbox.team_members SET available = false WHERE team_id = $1 AND user_id = $2 RETURNING 1', [team.id, owner.userId]))).length, 0, 'não muda os outros')
      await say('Kátia Lima', 'bom dia')
      assert.equal((await conv('Kátia Lima')).assignee, owner.userId)
      // Response clock: the customer waits until a person answers (automation does not count).
      assert(ivo.waiting_since && !ivo.first_response_at)
      await reply(owner, ivo.id, 'Oi Ivo!', { db })
      const ivo2 = await conv('Ivo Alves')
      assert.deepEqual([ivo2.waiting_since, !!ivo2.first_response_at], [null, true])
      // SLA: past the limit, one note and the mark; not repeated.
      await sql(`INSERT INTO inbox.settings (workspace_id, sla_minutes) VALUES ($1, 5) ON CONFLICT (workspace_id) DO UPDATE SET sla_minutes = 5`, [org])
      await sql(`UPDATE inbox.conversations SET waiting_since = now() - interval '10 minutes' WHERE id = $1`, [joana.id])
      assert((await T.slaAlerts(db.service)).alertas >= 1)
      assert.match((await sql('SELECT body FROM inbox.notes WHERE conversation_id = $1 ORDER BY created_at DESC LIMIT 1', [joana.id]))[0].body, /Prazo de resposta passou/)
      assert.equal((await sql('SELECT count(*)::int n FROM inbox.notes WHERE conversation_id = $1', [joana.id]))[0].n, 1)
      await T.slaAlerts(db.service)
      assert.equal((await sql('SELECT count(*)::int n FROM inbox.notes WHERE conversation_id = $1', [joana.id]))[0].n, 1, 'uma vez só')
      // Rating: closing asks (after a minute), "5" is stored with who attended and the conversation stays closed.
      await sql(`UPDATE inbox.settings SET csat_enabled = true WHERE workspace_id = $1`, [org])
      await asBrowser(owner, q => q(`UPDATE inbox.conversations SET status = 'fechada' WHERE id = $1`, [ivo.id]))
      assert((await conv('Ivo Alves')).closed_at)
      assert.equal((await T.askRatings({ service: db.service })).avaliacoes_pedidas, 0, 'espera um minuto')
      await sql(`UPDATE inbox.conversations SET closed_at = now() - interval '2 minutes' WHERE id = $1`, [ivo.id])
      assert.equal((await T.askRatings({ service: db.service })).avaliacoes_pedidas, 1)
      const asked = (await msgs('Ivo Alves')).at(-1)
      assert.deepEqual([asked.body, asked.buttons.length], [T.DEFAULT_CSAT, 5])
      await say('Ivo Alves', '5 - Excelente')
      const [r] = await sql('SELECT score, assignee, team_id FROM inbox.ratings WHERE conversation_id = $1', [ivo.id])
      assert.deepEqual([r.score, r.assignee, r.team_id], [5, ivo.assignee, team.id])
      assert.equal((await conv('Ivo Alves')).status, 'fechada')
      assert.equal((await msgs('Ivo Alves')).at(-1).body, 'Obrigado pela avaliação! 💙')
      assert.equal((await T.askRatings({ service: db.service })).avaliacoes_pedidas, 0, 'não pede de novo')
      await say('Ivo Alves', '3')
      assert.equal((await sql('SELECT count(*)::int n FROM inbox.ratings WHERE conversation_id = $1', [ivo.id]))[0].n, 1, 'uma avaliação por pedido')
      await assert.rejects(asBrowser(owner, q => q(`INSERT INTO inbox.ratings (workspace_id, conversation_id, contact_id, score) VALUES ($1, $2, $3, 1)`, [org, ivo.id, ivo.contact_id])), /permission denied/)
      // File: stored under the company's folder and sent; viewers and big files are refused.
      const uploaded: string[] = []
      const fileDeps = { db, upload: async (p: string) => { uploaded.push(p) }, sign: async () => 'https://signed.test/x' }
      const png = Buffer.from('89504e470d0a1a0a', 'hex')
      const sent = await replyWithFile(owner, joana.id, { bytes: png, name: 'catálogo final.png', mime: 'image/png' }, 'Segue o catálogo', fileDeps)
      assert.equal(sent.status, 'entregue')
      const [m] = await sql('SELECT kind, body, media_path, media_mime, sent_by FROM inbox.messages WHERE id = $1', [sent.id])
      assert.deepEqual([m.kind, m.body, m.media_mime, m.sent_by], ['imagem', 'Segue o catálogo', 'image/png', owner.userId])
      assert(m.media_path.startsWith(org + '/inbox/') && m.media_path.endsWith('/catalogo_final.png') && uploaded[0] === m.media_path)
      await assert.rejects(replyWithFile(viewer, joana.id, { bytes: png, name: 'a.png', mime: 'image/png' }, '', fileDeps), /só pode visualizar/)
      await assert.rejects(replyWithFile(owner, joana.id, { bytes: Buffer.alloc(4 * 1024 * 1024 + 1), name: 'a.pdf', mime: 'application/pdf' }, '', fileDeps), /até 4 MB/)
      assert.equal(uploaded.length, 1)
    })
  } finally {
    for (const o of [org, other]) {
      await sql('DELETE FROM inbox.flows WHERE workspace_id = $1', [o]); await sql('DELETE FROM inbox.channels WHERE workspace_id = $1', [o]); await sql('DELETE FROM inbox.integrations WHERE workspace_id = $1', [o]); await sql('DELETE FROM inbox.deals WHERE workspace_id = $1', [o]); await sql('DELETE FROM inbox.tasks WHERE workspace_id = $1', [o]); await sql('DELETE FROM inbox.pipelines WHERE workspace_id = $1', [o]); await sql('DELETE FROM inbox.broadcasts WHERE workspace_id = $1', [o]); await sql('DELETE FROM inbox.teams WHERE workspace_id = $1', [o]); await sql('DELETE FROM inbox.segments WHERE workspace_id = $1', [o]); await sql('DELETE FROM inbox.email_settings WHERE workspace_id = $1', [o])
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
