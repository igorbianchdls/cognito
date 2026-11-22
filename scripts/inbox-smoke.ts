// Inbox without the network: reading Meta webhooks, signatures, sealed tokens, the 24-hour window and the Graph calls.
// With INBOX_TEST_DB_URL (a Postgres with the Supabase stubs and the editor, drive and inbox migrations), also the
// whole path in the database: webhook → contact/conversation/message, statuses, replies, test channel and access rules.
//   INBOX_TEST_DB_URL=postgres://postgres:pg@localhost/mkt pnpm inbox:smoke
import assert from 'node:assert/strict'
import { createHmac, randomBytes } from 'node:crypto'
import pg from 'pg'
import { windowLeft, windowOpen, previewOf } from '../src/products/inbox/shared/rules'
import { parseWebhook, sendText, validSignature, downloadMedia, type InboundMessage } from '../src/products/inbox/server/meta'

process.env.INBOX_CREDENTIAL_KEY = randomBytes(32).toString('base64')
process.env.INBOX_META_GRAPH_URL = 'https://graph.test/v23.0'

type Call = { url: string; method: string; auth?: string; body?: unknown }
function fakeMeta(calls: Call[], reply: (call: Call) => { status?: number; body: unknown } = () => ({ body: { messages: [{ id: 'wamid.OUT1' }], message_id: 'mid.OUT1' } })) {
  return (async (url: string, init?: RequestInit) => {
    const call = { url: String(url), method: init?.method ?? 'GET', auth: (init?.headers as Record<string, string> | undefined)?.Authorization, body: init?.body ? JSON.parse(String(init.body)) : undefined }
    calls.push(call)
    const r = reply(call)
    return new Response(JSON.stringify(r.body), { status: r.status ?? 200 })
  }) as unknown as typeof fetch
}

const waBody = (messages: object[], statuses: object[] = []) => ({ object: 'whatsapp_business_account', entry: [{ id: 'WABA1', changes: [{ field: 'messages', value: {
  messaging_product: 'whatsapp', metadata: { display_phone_number: '5511999990000', phone_number_id: 'PN1' },
  contacts: [{ profile: { name: 'Maria Souza' }, wa_id: '5511988887777' }], messages, statuses } }] }] })

async function pure() {
  // ---------- webhooks ----------
  const wa = parseWebhook(waBody([
    { from: '5511988887777', id: 'wamid.A', timestamp: '1763800000', type: 'text', text: { body: 'Oi, tem em estoque?' } },
    { from: '5511988887777', id: 'wamid.B', timestamp: '1763800001', type: 'image', image: { id: 'MEDIA1', mime_type: 'image/jpeg', caption: 'esse aqui' } },
    { from: '5511988887777', id: 'wamid.C', timestamp: '1763800002', type: 'interactive', interactive: { type: 'button_reply', button_reply: { id: 'b1', title: 'Quero comprar' } } },
    { from: '5511988887777', id: 'wamid.D', timestamp: '1763800003', type: 'unsupported' },
  ], [{ id: 'wamid.OUT1', status: 'read' }, { id: 'wamid.OUT2', status: 'failed', errors: [{ title: 'Re-engagement message' }] }, { id: 'x', status: 'weird' }]))
  const msgs = wa.filter((e): e is InboundMessage => e.type === 'message')
  assert.deepEqual(msgs.map(m => [m.kind, m.text]), [['texto', 'Oi, tem em estoque?'], ['imagem', 'esse aqui'], ['texto', 'Quero comprar'], ['outro', 'Tipo de mensagem ainda não suportado pelo Inbox.']])
  assert.deepEqual([msgs[0].channelId, msgs[0].contactId, msgs[0].contactName, msgs[0].at.toISOString()], ['PN1', '5511988887777', 'Maria Souza', new Date(1763800000000).toISOString()])
  assert.deepEqual(msgs[1].media, { id: 'MEDIA1', mime: 'image/jpeg', name: undefined })
  assert.deepEqual(wa.filter(e => e.type === 'status').map(s => s.type === 'status' && [s.messageId, s.status, s.error]), [['wamid.OUT1', 'lida', undefined], ['wamid.OUT2', 'falhou', 'Re-engagement message']])
  const ig = parseWebhook({ object: 'instagram', entry: [{ id: 'IG1', time: 1, messaging: [
    { sender: { id: 'IGSID9' }, recipient: { id: 'IG1' }, timestamp: 1763800000000, message: { mid: 'mid.1', text: 'Quanto custa?' } },
    { sender: { id: 'IG1' }, recipient: { id: 'IGSID9' }, timestamp: 1763800001000, message: { mid: 'mid.2', text: 'Respondido pelo celular', is_echo: true } },
    { sender: { id: 'IGSID9' }, recipient: { id: 'IG1' }, timestamp: 1763800002000, message: { mid: 'mid.3', attachments: [{ type: 'image', payload: { url: 'https://cdn.test/a.jpg' } }] } },
    { sender: { id: 'IGSID9' }, recipient: { id: 'IG1' }, timestamp: 1763800003000, message: { mid: 'mid.4', is_deleted: true } },
    { sender: { id: 'IGSID9' }, recipient: { id: 'IG1' }, timestamp: 1763800004000, read: { mid: 'mid.2' } },
  ] }] }) as InboundMessage[]
  assert.deepEqual(ig.map(m => [m.channelKind, m.channelId, m.contactId, m.direction, m.kind, m.text]), [
    ['instagram', 'IG1', 'IGSID9', 'entrada', 'texto', 'Quanto custa?'], ['instagram', 'IG1', 'IGSID9', 'saida', 'texto', 'Respondido pelo celular'], ['instagram', 'IG1', 'IGSID9', 'entrada', 'imagem', null]])
  const fb = parseWebhook({ object: 'page', entry: [{ id: 'PAGE1', messaging: [{ sender: { id: 'PSID1' }, recipient: { id: 'PAGE1' }, timestamp: 1, postback: { mid: 'mid.p', title: 'Começar' } }] }] })
  assert.deepEqual(fb.map(m => m.type === 'message' && [m.channelKind, m.text]), [['messenger', 'Começar']])
  assert.deepEqual(parseWebhook({ object: 'outra' }), []); assert.deepEqual(parseWebhook(null), []); assert.deepEqual(parseWebhook({ object: 'page', entry: 'x' }), [])

  const raw = JSON.stringify(waBody([]))
  const sig = 'sha256=' + createHmac('sha256', 'segredo').update(raw).digest('hex')
  assert.equal(validSignature(raw, sig, 'segredo'), true)
  assert.equal(validSignature(raw + ' ', sig, 'segredo'), false)
  assert.equal(validSignature(raw, sig, 'outro'), false)
  assert.equal(validSignature(raw, null, 'segredo'), false)
  assert.equal(validSignature(raw, sig, ''), false, 'sem segredo configurado, nada passa')
  console.log('PASS webhooks do WhatsApp, Instagram e Messenger viram mensagens e status; assinatura da Meta conferida')

  // ---------- tokens, window, preview ----------
  const { seal, unseal } = await import('../src/products/inbox/server/crypto')
  const sealed = seal('EAAG-token-secreto')
  assert(!sealed.includes('EAAG') && unseal(sealed) === 'EAAG-token-secreto')
  assert.notEqual(seal('x'), seal('x'), 'cada selo é diferente')
  const [v, iv, tag, data] = sealed.split('.')
  assert.throws(() => unseal([v, iv, tag, data.slice(0, -2) + 'AA'].join('.')), /ilegível/)
  const key = process.env.INBOX_CREDENTIAL_KEY; delete process.env.INBOX_CREDENTIAL_KEY
  assert.throws(() => seal('x'), /não está configurada/); process.env.INBOX_CREDENTIAL_KEY = key
  const now = Date.parse('2026-11-23T12:00:00Z')
  assert.equal(windowOpen('whatsapp', '2026-11-22T12:00:01Z', now), true)
  assert.equal(windowOpen('whatsapp', '2026-11-22T11:59:59Z', now), false)
  assert.equal(windowOpen('instagram', null, now), false); assert.equal(windowOpen('teste', null, now), true)
  assert.equal(windowLeft('whatsapp', '2026-11-23T09:30:00Z', now), '21 h'); assert.equal(windowLeft('whatsapp', '2026-11-22T12:30:00Z', now), '30 min')
  assert.equal(previewOf('imagem', 'olha'), '📷 Imagem: olha'); assert.equal(previewOf('texto', ' a\n b '), 'a b')
  console.log('PASS token guardado cifrado (e recusado sem a chave); janela de 24 h da Meta')

  // ---------- Graph calls ----------
  const calls: Call[] = []
  assert.equal(await sendText(fakeMeta(calls), { kind: 'whatsapp', externalId: 'PN1' }, 'TOK', '5511988887777', 'Temos sim!'), 'wamid.OUT1')
  assert.deepEqual(calls[0], { url: 'https://graph.test/v23.0/PN1/messages', method: 'POST', auth: 'Bearer TOK',
    body: { messaging_product: 'whatsapp', recipient_type: 'individual', to: '5511988887777', type: 'text', text: { body: 'Temos sim!', preview_url: true } } })
  assert.equal(await sendText(fakeMeta(calls), { kind: 'instagram', externalId: 'IG1' }, 'TOK', 'IGSID9', 'Oi'), 'mid.OUT1')
  assert.deepEqual(calls[1].body, { recipient: { id: 'IGSID9' }, messaging_type: 'RESPONSE', message: { text: 'Oi' } })
  await assert.rejects(sendText(fakeMeta(calls, () => ({ status: 401, body: { error: { message: 'Invalid OAuth access token.', code: 190 } } })), { kind: 'whatsapp', externalId: 'PN1' }, 'T', '1', 'x'),
    (e: Error & { tokenInvalid?: boolean }) => e.message === 'Invalid OAuth access token.' && e.tokenInvalid === true)
  const media = await downloadMedia(fakeMeta(calls, c => c.url.endsWith('/MEDIA1') ? { body: { url: 'https://lookaside.test/m1', mime_type: 'image/jpeg', file_size: 3 } } : { body: 'abc' }), { id: 'MEDIA1' }, 'TOK')
  assert.equal(media.mime, 'image/jpeg'); assert.equal(calls.at(-1)!.auth, 'Bearer TOK', 'o arquivo do WhatsApp é baixado com o token')
  await assert.rejects(downloadMedia(fakeMeta(calls), { url: 'http://inseguro.test/a' }, null), /sem endereço/)
  console.log('PASS envio pelo WhatsApp e Instagram no formato da Meta; token recusado é reconhecido; anexos baixados')
}

// ---------- database ----------
async function database(url: string) {
  const { makeDb } = await import('../src/products/inbox/server/db')
  const { ingest } = await import('../src/products/inbox/server/ingest')
  const { reply, createTestChannel, simulateCustomer, connectWhatsApp, mediaPath } = await import('../src/products/inbox/server/actions')
  const pool = new pg.Pool({ connectionString: url, max: 4 })
  const db = makeDb(() => pool)
  const sql = async (q: string, p: unknown[] = []) => (await pool.query(q, p)).rows
  const tag = randomBytes(4).toString('hex')
  const orgA = 'org_inboxA_' + tag, orgB = 'org_inboxB_' + tag
  const owner = { userId: 'u_owner_' + tag, orgId: orgA }, viewer = { userId: 'u_viewer_' + tag, orgId: orgA }, stranger = { userId: 'u_str_' + tag, orgId: orgB }
  // Companies and roles as in the ERP (shared.*): owner writes, viewer only reads, stranger is in another company.
  const ids = new Map<string, number>()
  const idOf = async (table: 'empresas' | 'usuarios', column: string, value: string) => {
    if (!ids.has(value)) {
      const id = 9e9 + Math.floor(Math.random() * 1e9)
      await sql(`INSERT INTO shared.${table} (id, ${column}) VALUES ($1, $2)`, [id, value])
      ids.set(value, id)
    }
    return ids.get(value)!
  }
  for (const [org, user, role] of [[orgA, owner.userId, 'admin'], [orgA, viewer.userId, 'viewer'], [orgB, stranger.userId, 'admin']]) {
    await sql(`INSERT INTO shared.usuarios_empresas (usuario_id, empresa_id, role, status) VALUES ($1, $2, $3, 'active')`,
      [await idOf('usuarios', 'clerk_user_id', user), await idOf('empresas', 'clerk_organization_id', org), role])
  }
  try {
    // A WhatsApp channel of company A, connected with a (fake) Meta.
    const calls: Call[] = []
    const meta = fakeMeta(calls, c => c.url.includes('fields=display_phone_number') ? { body: { display_phone_number: '+55 11 99999-0000', verified_name: 'Loja A' } }
      : c.url.endsWith('/subscribed_apps') ? { body: { success: true } } : { body: { messages: [{ id: 'wamid.OUT-' + calls.length }] } })
    const phoneId = String(Date.now())
    await assert.rejects(connectWhatsApp(viewer, { phoneNumberId: phoneId, businessAccountId: '123456', token: 'EAAG' + 'x'.repeat(30) }, { db, send: meta }), /só pode visualizar/)
    const wa = await connectWhatsApp(owner, { phoneNumberId: phoneId, businessAccountId: '123456', token: 'EAAG' + 'x'.repeat(30) }, { db, send: meta })
    assert.equal(wa.numero, '+55 11 99999-0000'); assert.equal(wa.aviso, null)
    const [cred] = await sql('SELECT token_sealed FROM inbox_private.channel_credentials WHERE channel_id = $1', [wa.id])
    assert(cred && !cred.token_sealed.includes('EAAG'), 'token guardado cifrado')
    await assert.rejects(connectWhatsApp(stranger, { phoneNumberId: phoneId, businessAccountId: '123456', token: 'EAAG' + 'y'.repeat(30) }, { db, send: meta }), /outra empresa/)

    // Customer writes twice (one webhook delivered twice), sends a photo; Meta sends a status for an unknown message.
    const events = parseWebhook(waBody([{ from: '5511988887777', id: 'wamid.IN1-' + tag, timestamp: String(Math.floor(Date.now() / 1000) - 60), type: 'text', text: { body: 'Oi, tem em estoque?' } }]).valueOf())
      .map(e => ({ ...e, channelId: phoneId }))
    const stored: string[] = []
    const storeMedia = async (_c: unknown, _m: unknown, path: (n: string) => string) => { const p = path('foto.jpg'); stored.push(p); return { path: p, mime: 'image/jpeg', name: null } }
    assert.deepEqual(await ingest(events, { service: db.service }), { messages: 1, statuses: 0, ignored: 0 })
    assert.deepEqual(await ingest(events, { service: db.service }), { messages: 0, statuses: 0, ignored: 1 }, 'entrega repetida não duplica')
    const photo = parseWebhook(waBody([{ from: '5511988887777', id: 'wamid.IN2-' + tag, timestamp: String(Math.floor(Date.now() / 1000)), type: 'image', image: { id: 'M1', mime_type: 'image/jpeg' } }])).map(e => ({ ...e, channelId: phoneId }))
    await ingest(photo, { service: db.service, storeMedia })
    assert(stored[0].startsWith(orgA + '/inbox/') && stored[0].endsWith('/foto.jpg'), 'anexo na pasta da empresa')
    assert.deepEqual(await ingest([{ type: 'message', channelKind: 'whatsapp', channelId: 'PN-desconhecido', contactId: '1', messageId: 'x', at: new Date(), direction: 'entrada', kind: 'texto', text: 'x' }], { service: db.service }),
      { messages: 0, statuses: 0, ignored: 1 }, 'número que não é de ninguém é ignorado')

    const [conv] = await sql(`SELECT c.*, k.name, k.phone FROM inbox.conversations c JOIN inbox.contacts k ON k.id = c.contact_id WHERE c.channel_id = $1`, [wa.id])
    assert.deepEqual([conv.name, conv.phone, conv.unread, conv.status, conv.last_preview], ['Maria Souza', '+5511988887777', 2, 'aberta', '📷 Imagem'])
    console.log('PASS mensagem do webhook cria contato, conversa e mensagem uma vez só; anexo vai para a pasta da empresa')

    // Replies: viewer can't, stranger doesn't see it, owner sends through Meta; status moves forward only.
    await assert.rejects(reply(viewer, conv.id, 'oi', { db, send: meta }), /só pode visualizar/)
    await assert.rejects(reply(stranger, conv.id, 'oi', { db, send: meta }), /não encontrada/)
    const sent = await reply(owner, conv.id, 'Temos sim! Quer o link?', { db, send: meta })
    assert.equal(sent.status, 'enviada')
    const out = calls.find(c => c.url.endsWith(`/${phoneId}/messages`))!
    assert.deepEqual([out.auth, (out.body as { to: string }).to], ['Bearer EAAG' + 'x'.repeat(30), '5511988887777'], 'envia com o token do canal para o número do cliente')
    const [{ external_id: wamid }] = await sql('SELECT external_id FROM inbox.messages WHERE id = $1', [sent.id])
    const status = (s: string) => ingest([{ type: 'status', channelKind: 'whatsapp', channelId: phoneId, messageId: wamid, status: s as 'lida' }], { service: db.service })
    await status('lida'); await status('entregue')
    const [{ status: final, sent_by }] = await sql('SELECT status, sent_by FROM inbox.messages WHERE id = $1', [sent.id])
    assert.deepEqual([final, sent_by], ['lida', owner.userId], '"entregue" atrasado não desfaz "lida"')
    const [after] = await sql('SELECT unread, last_preview FROM inbox.conversations WHERE id = $1', [conv.id])
    assert.deepEqual([after.unread, after.last_preview], [0, 'Temos sim! Quer o link?'])

    // 24 h later only templates are allowed; a revoked token marks the channel.
    await sql(`UPDATE inbox.conversations SET last_inbound_at = now() - interval '25 hours' WHERE id = $1`, [conv.id])
    await assert.rejects(reply(owner, conv.id, 'oi', { db, send: meta }), /24 horas/)
    await sql(`UPDATE inbox.conversations SET last_inbound_at = now() WHERE id = $1`, [conv.id])
    const failed = await reply(owner, conv.id, 'oi', { db, send: fakeMeta([], () => ({ status: 401, body: { error: { message: 'Session expired', code: 190 } } })) })
    assert.deepEqual([failed.status, failed.erro], ['falhou', 'Session expired'])
    const [ch] = await sql('SELECT status FROM inbox.channels WHERE id = $1', [wa.id])
    assert.equal(ch.status, 'erro')
    console.log('PASS resposta pela Meta com o papel certo; status só avança; janela de 24 h e token vencido avisados')

    // Test channel: creates a sample conversation; simulated customers; replies are "delivered" without Meta.
    await assert.rejects(createTestChannel(viewer, 'x', { db }), /só pode visualizar/)
    const test = await createTestChannel(owner, 'Meu teste', { db })
    await simulateCustomer(owner, test.id, { nome: 'João', texto: 'Qual o prazo de entrega?' }, { db })
    await assert.rejects(simulateCustomer(owner, wa.id, { nome: 'x', texto: 'y' }, { db }), /Só o canal de teste/)
    await assert.rejects(simulateCustomer(stranger, test.id, { nome: 'x', texto: 'y' }, { db }), /não encontrado/)
    const tconv = await sql(`SELECT c.id, k.name FROM inbox.conversations c JOIN inbox.contacts k ON k.id = c.contact_id WHERE c.channel_id = $1 ORDER BY k.name`, [test.id])
    assert.deepEqual(tconv.map((r: { name: string }) => r.name), ['Cliente de exemplo', 'João'])
    assert.equal((await reply(owner, tconv[1].id, 'Chega amanhã!', { db })).status, 'entregue')
    console.log('PASS canal de teste: conversa de exemplo, cliente simulado e resposta sem a Meta')

    // What the browser may do directly (row level security + column grants).
    const asBrowser = <T>(who: typeof owner, fn: (q: (s: string, p?: unknown[]) => Promise<Record<string, unknown>[]>) => Promise<T>) => db.asPerson(who, fn as never) as Promise<T>
    assert.equal((await asBrowser(stranger, q => q('SELECT id FROM inbox.conversations WHERE workspace_id = $1', [orgA]))).length, 0, 'outra empresa não vê nada')
    assert.equal((await asBrowser(viewer, q => q('SELECT id FROM inbox.messages WHERE conversation_id = $1', [conv.id]))).length, 4, 'quem só visualiza lê as mensagens')
    await assert.rejects(asBrowser(owner, q => q(`INSERT INTO inbox.messages (workspace_id, conversation_id, direction, status) VALUES ($1, $2, 'saida', 'enviada')`, [orgA, conv.id])), /permission denied/, 'mensagem não nasce pelo navegador')
    await assert.rejects(asBrowser(owner, q => q('SELECT * FROM inbox_private.channel_credentials')), /permission denied/, 'token nunca chega ao navegador')
    await assert.rejects(asBrowser(owner, q => q(`UPDATE inbox.channels SET external_id = 'x' WHERE id = $1`, [wa.id])), /permission denied/)
    const updated = await asBrowser(owner, q => q(`UPDATE inbox.conversations SET status = 'fechada', assignee = $2, unread = 0 WHERE id = $1 RETURNING id`, [conv.id, owner.userId]))
    assert.equal(updated.length, 1)
    assert.equal((await asBrowser(viewer, q => q(`UPDATE inbox.conversations SET status = 'aberta' WHERE id = $1 RETURNING id`, [conv.id]))).length, 0, 'quem só visualiza não muda a conversa')
    await asBrowser(owner, async q => {
      const [t] = await q(`INSERT INTO inbox.tags (workspace_id, name, color) VALUES ($1, 'Lead quente', '#ef4444') RETURNING id`, [orgA])
      await q('INSERT INTO inbox.contact_tags (workspace_id, contact_id, tag_id) VALUES ($1, $2, $3)', [orgA, conv.contact_id, t.id])
      await q('INSERT INTO inbox.notes (workspace_id, conversation_id, body, author) VALUES ($1, $2, $3, $4)', [orgA, conv.id, 'Cliente pediu desconto', owner.userId])
      await q(`INSERT INTO inbox.quick_replies (workspace_id, shortcut, body) VALUES ($1, 'pix', 'Nossa chave Pix é…')`, [orgA])
    })
    await assert.rejects(asBrowser(owner, q => q('INSERT INTO inbox.notes (workspace_id, conversation_id, body, author) VALUES ($1, $2, $3, $4)', [orgA, conv.id, 'x', 'outra-pessoa'])), /row-level security/, 'nota sempre em nome de quem escreve')
    const [{ id: tagB }] = await asBrowser(stranger, q => q(`INSERT INTO inbox.tags (workspace_id, name) VALUES ($1, 'B') RETURNING id`, [orgB]))
    await assert.rejects(asBrowser(owner, q => q('INSERT INTO inbox.contact_tags (workspace_id, contact_id, tag_id) VALUES ($1, $2, $3)', [orgA, conv.contact_id, tagB])), /row-level security/, 'tag de outra empresa não entra')
    await assert.rejects(mediaPath(stranger, (await sql(`SELECT id FROM inbox.messages WHERE media_path IS NOT NULL AND conversation_id = $1`, [conv.id]))[0].id, db), /não encontrado/)
    // Closed conversation reopens when the customer writes again.
    await ingest(parseWebhook(waBody([{ from: '5511988887777', id: 'wamid.IN3-' + tag, timestamp: String(Math.floor(Date.now() / 1000)), type: 'text', text: { body: 'Voltei' } }])).map(e => ({ ...e, channelId: phoneId })), { service: db.service })
    assert.equal((await sql('SELECT status FROM inbox.conversations WHERE id = $1', [conv.id]))[0].status, 'aberta')
    console.log('PASS navegador: outra empresa não vê, visualizador não altera, mensagens e tokens só pelo servidor; conversa fechada reabre')
  } finally {
    await sql('DELETE FROM inbox.channels WHERE workspace_id = ANY($1)', [[orgA, orgB]])
    await sql('DELETE FROM inbox.contacts WHERE workspace_id = ANY($1)', [[orgA, orgB]])
    await sql('DELETE FROM inbox.tags WHERE workspace_id = ANY($1)', [[orgA, orgB]])
    await sql('DELETE FROM inbox.quick_replies WHERE workspace_id = ANY($1)', [[orgA, orgB]])
    const created = [...ids.values()]
    await sql('DELETE FROM shared.usuarios_empresas WHERE empresa_id = ANY($1) OR usuario_id = ANY($1)', [created])
    await sql('DELETE FROM shared.empresas WHERE id = ANY($1)', [created])
    await sql('DELETE FROM shared.usuarios WHERE id = ANY($1)', [created])
    await pool.end()
  }
}

async function main() {
  await pure()
  const url = process.env.INBOX_TEST_DB_URL
  if (url) await database(url)
  console.log(JSON.stringify({ status: 'passed', checks: url ? 8 : 4, database: url ? 'tested' : 'skipped (INBOX_TEST_DB_URL)' }))
}
main().catch(error => { console.error(error); process.exit(1) })
