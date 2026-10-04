import assert from 'node:assert/strict'
import { createHash, randomUUID } from 'node:crypto'

type Row = Record<string, any>
type Context = {
  client: { query(sql: string, params?: unknown[]): Promise<{ rows: Row[] }> }
  companyId: number; userId: number; clientId: string; resource: string; token: string
  rpc(method: string, params?: Row, options?: { modern?: boolean; authorization?: string }): Promise<{ status: number; body: Row }>
  call(name: string, args: Row, modern?: boolean): Promise<Row>
  check(name: string, fn: () => Promise<void>): Promise<void>
}
const cents = (v: unknown) => Math.round(Number(v) * 100)
const day = (v: unknown) => new Date(String(v)).toISOString().slice(0, 10)
const fingerprint = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex')

export async function runReadToolCases(ctx: Context) {
  const { client, companyId, userId, clientId, rpc, call, check } = ctx
  const sql = async (statement: string) => (await client.query(statement, [companyId])).rows
  const names = ['entidades','produtos','servicos','vendas','vendas_itens','compras','compras_itens','contas_receber','contas_receber_parcelas','contas_pagar','contas_pagar_parcelas','pagamentos','saldos_estoque','categorias','contas_financeiras','adiantamentos_aplicacoes','renegociacoes','renegociacoes_parcelas']
  const db: Record<string, Row[]> = {}
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
  try {
    await client.query("SELECT set_config('app.erp_tenant_id',$1,true),set_config('app.erp_user_id',$2,true)", [String(companyId), String(userId)])
    await client.query('SET LOCAL ROLE erp_runtime')
    for (const name of names) db[name] = await sql(`SELECT * FROM erp.${name} WHERE tenant_id=$1 ORDER BY id`)
  } finally { await client.query('ROLLBACK') }
  const pluginQuery = "SELECT * FROM (SELECT 'settings' kind,to_jsonb(s) value FROM plugin.settings s WHERE user_id=$1 AND oauth_client_id=$2 AND integration='chatgpt' UNION ALL SELECT 'draft',to_jsonb(d) FROM plugin.drafts d WHERE user_id=$1 AND oauth_client_id=$2 AND integration='chatgpt') records ORDER BY kind,value::text"
  const pluginSnapshot = (await client.query(pluginQuery, [userId,clientId])).rows
  const missingId = 2000000000
  const customer = db.entidades.find(r => r.eh_cliente && r.ativo && !r.excluido_em)!
  const sale = db.vendas.find(r => r.status === 'confirmada')!
  const purchase = db.compras.find(r => r.status === 'recebida')!
  assert(customer && sale && purchase, 'Dados reais de leitura necessários')
  const extensions = async (name: string, args: Row) => {
    const result = await rpc('tools/call', { name, arguments: args })
    assert.equal(result.status, 200)
    assert(!result.body.error && !result.body.result.isError)
    return result.body.result.structuredContent
  }
  const rejected = async (name: string, args: Row, code: string) => {
    const result = await rpc('tools/call', { name, arguments: args })
    assert.equal(result.status, 200)
    assert.equal(result.body.result.isError, true)
    assert.equal(JSON.parse(result.body.result.content[0].text).code, code)
  }
  await check('Todas leituras: catálogo distingue 25 consultas e 3 escritas', async () => {
    const result = await rpc('tools/list')
    const tools = result.body.result.tools
    assert.equal(tools.filter((t: Row) => t.annotations?.readOnlyHint).length, 25)
    assert.deepEqual(tools.filter((t: Row) => !t.annotations?.readOnlyHint).map((t: Row) => t.name).sort(), ['atualizar_configuracoes','preparar_formulario_nativo','preparar_rascunho'])
    for (const tool of tools.filter((t: Row) => t.annotations?.readOnlyHint)) assert.deepEqual(tool.securitySchemes, [{ type: 'oauth2', scopes: ['erp:read'] }])
  })
  await check('GET HTTP autenticado retorna 405 e anuncia POST/OPTIONS', async () => {
    const result = await fetch(ctx.resource, { headers: { authorization: 'Bearer ' + ctx.token }, signal: AbortSignal.timeout(20000) })
    assert.equal(result.status, 405)
    assert.equal(result.headers.get('allow'), 'POST, OPTIONS')
  })
  for (const [type, table, predicate] of [
    ['clientes','entidades',(r: Row) => r.eh_cliente], ['fornecedores','entidades',(r: Row) => r.eh_fornecedor],
    ['produtos','produtos',() => true], ['servicos','servicos',() => true],
  ] as const) {
    const expected = db[table].filter(r => predicate(r) && !r.excluido_em)
    await check('buscar_cadastros: ' + type, async () => {
      const result = (await call('buscar_cadastros', { empresa_id: companyId, tipo: type, por_pagina: 50 })).data
      assert.equal(result.total, expected.length)
      assert.deepEqual(result.records.map((r: Row) => r.id).sort(), expected.map(r => String(r.id)).sort())
    })
    await check('buscar_cadastros: busca e ausência em ' + type, async () => {
      const found = (await call('buscar_cadastros', { empresa_id: companyId, tipo: type, busca: expected[0].nome })).data
      assert(found.records.some((r: Row) => r.id === String(expected[0].id)))
      const empty = (await call('buscar_cadastros', { empresa_id: companyId, tipo: type, busca: 'inexistente-' + randomUUID() })).data
      assert.equal(empty.total, 0); assert.deepEqual(empty.records, [])
    })
  }
  await check('obter_cliente: registro corresponde ao Supabase', async () => {
    const result = (await call('obter_cliente', { empresa_id: companyId, cliente_id: Number(customer.id) })).data.record
    assert.equal(result.id, String(customer.id)); assert.equal(result.nome, customer.nome)
  })
  for (const [name, args] of [['obter_cliente',{ cliente_id: missingId }], ['obter_venda',{ venda_id: missingId }], ['obter_compra',{ compra_id: missingId }]] as const)
    await check(name + ': identificador inexistente', () => rejected(name, { empresa_id: companyId, ...args }, 'NOT_FOUND'))
  await check('verificar_fiscal_venda: pendências esperadas dos dados demonstrativos', async () => {
    const data = (await call('verificar_fiscal_venda', { empresa_id: companyId, venda_id: Number(sale.id) })).data
    assert(Array.isArray(data.issues)); assert(data.issues.length > 0)
    assert(data.issues.some((i: Row) => i.code === 'CUSTOMER_DOCUMENT_MISSING' || i.field === 'cliente.documento'))
  })
  await check('listar_contas_financeiras: contas reais e tipos', async () => {
    const result = (await call('listar_contas_financeiras', { empresa_id: companyId })).data
    const expected = db.contas_financeiras.filter(r => r.ativo && !r.excluido_em)
    assert.equal(result.records.length, expected.length)
    for (const row of result.records) { const original = expected.find(r => String(r.id) === row.id)!; assert(original); assert.equal(row.nome, original.nome); assert.equal(row.tipo, original.tipo) }
  })
  for (const side of ['receber','pagar']) await check('listar_pagamentos: ' + side + ', duas páginas', async () => {
    const expected = db.pagamentos.filter(r => r.tipo === side && !r.excluido_em).sort((a,b) => Number(b.id)-Number(a.id))
    for (const page of [1,2]) {
      const result = (await call('listar_pagamentos', { empresa_id: companyId, tipo: side, pagina: page, por_pagina: 10 })).data
      assert.deepEqual(result.records.map((r: Row) => r.id), expected.slice((page-1)*10,page*10).map(r => String(r.id)))
      for (const row of result.records) { const original = expected.find(r => String(r.id) === row.id)!; assert.equal(cents(row.valor), cents(original.valor)); assert.equal(cents(row.valor_liquido), cents(original.valor_liquido)) }
    }
  })
  await check('listar_orcamentos: somente documentos de orçamento', async () => {
    const result = (await call('listar_orcamentos', { empresa_id: companyId })).data
    assert.equal(result.total, db.vendas.filter(r => r.tipo_documento === 'orcamento' && !r.excluido_em).length)
    assert(result.records.every((r: Row) => r.tipo_documento === 'orcamento'))
  })
  for (const [tool, table, states] of [['listar_vendas','vendas',['confirmada','rascunho','cancelada']], ['listar_compras','compras',['recebida','rascunho','cancelada']]] as const)
    for (const status of states) await check(tool + ': filtro ' + status, async () => {
      const result = (await call(tool, { empresa_id: companyId, status })).data
      assert.equal(result.total, db[table].filter(r => r.status === status && !r.excluido_em).length)
      assert(result.records.every((r: Row) => r.status === status))
    })
  for (const [name, uri] of [['abrir_painel','ui://chatgptplugin/panel.html'],['abrir_formulario','ui://chatgptplugin/form.html']]) await check(name + ': resposta e recurso HTML', async () => {
    const data = await call(name, { empresa_id: companyId })
    assert.equal(data.data.empresa_selecionada, companyId)
    const resources = await rpc('resources/list')
    const resource = resources.body.result.resources.find((r: Row) => r.uri === uri || r.name === (name === 'abrir_painel' ? 'erp-panel' : 'erp-form'))
    assert(resource)
    const result = await rpc('resources/read', { uri: resource.uri })
    assert(!result.body.error); assert(result.body.result.contents[0].mimeType.startsWith('text/html'))
    assert(result.body.result.contents[0].text.includes('<html'))
  })
  await check('ler_configuracoes: leitura corresponde às preferências persistidas', async () => {
    const data = await extensions('ler_configuracoes', {})
    const saved = pluginSnapshot.find(r => r.kind === 'settings')?.value.values || {}
    assert.equal(data.values.por_pagina, saved.por_pagina || 20)
    assert.equal(data.values.empresa_preferida, saved.empresa_preferida || '')
    assert(data.schema && data.layout)
  })
  await check('search_mentions: cliente encontrado e recurso consultável', async () => {
    const data = await extensions('search_mentions', { query: customer.nome })
    const mention = data.items.find((r: Row) => r.resourceUri.endsWith('/' + customer.id))
    assert(mention)
    const result = await rpc('resources/read', { uri: mention.resourceUri })
    assert(!result.body.error)
    assert.equal(JSON.parse(result.body.result.contents[0].text).nome, customer.nome)
  })
  await check('search_mentions: consulta sem correspondência', async () => {
    const data = await extensions('search_mentions', { query: 'inexistente-' + randomUUID() })
    assert.deepEqual(data.items, [])
  })
  await check('listar_rascunhos: consulta isolada por usuário e conexão', async () => {
    const data = (await call('listar_rascunhos', { empresa_id: companyId })).data
    assert.equal(data.records.length, Math.min(20, pluginSnapshot.filter(r => r.kind === 'draft' && Number(r.value.tenant_id) === companyId).length))
  })
  const existingDraft = pluginSnapshot.find(r => r.kind === 'draft' && Number(r.value.tenant_id) === companyId)?.value
  await check('obter_rascunho: ' + (existingDraft ? 'consulta de registro existente' : 'ausência retorna NOT_FOUND'), async () => {
    if (existingDraft) { const data = (await call('obter_rascunho', { empresa_id: companyId, rascunho_id: existingDraft.id })).data; assert.equal(data.rascunho_id, existingDraft.id) }
    else await rejected('obter_rascunho', { empresa_id: companyId, rascunho_id: randomUUID() }, 'NOT_FOUND')
  })
  const from = '2026-07-01', to = '2026-12-31'
  const confirmedSales = db.vendas.filter(r => ['confirmada','faturada'].includes(r.status) && r.tipo_documento === 'venda' && !r.excluido_em && day(r.data_venda) >= from && day(r.data_venda) <= to)
  const receivedPurchases = db.compras.filter(r => ['confirmada','recebida'].includes(r.status) && r.tipo_movimento === 'compra' && !r.excluido_em && day(r.data_compra) >= from && day(r.data_compra) <= to)
  for (const type of ['dre-caixa','posicao-financeira','vendas-clientes','vendas-vendedores','vendas-produtos','compras-fornecedores','compras-categorias','valor-estoque']) await check('consultar_relatorio: ' + type, async () => {
    const records: Row[] = []
    for (let page = 1; page <= 10; page++) {
      const result = (await call('consultar_relatorio', { empresa_id: companyId, tipo: type, inicio: from, fim: to, pagina: page, por_pagina: 50 })).data
      assert.equal(result.report, type); assert.equal(result.from, from); assert.equal(result.to, to)
      records.push(...result.records)
      if (!result.hasMore) break
      assert(page < 10)
    }
    assert(records.length > 0)
    const total = (field: string) => records.reduce((sum,r) => sum + cents(r[field]), 0)
    if (type === 'vendas-clientes' || type === 'vendas-vendedores') assert.equal(total('total'), confirmedSales.reduce((s,r) => s+cents(r.total),0))
    if (type === 'vendas-produtos') assert(Math.abs(total('total') - confirmedSales.reduce((s,r) => s+cents(r.total),0)) <= records.length)
    if (type.startsWith('compras-')) assert.equal(total('total'), receivedPurchases.reduce((s,r) => s+cents(r.total),0))
    if (type === 'dre-caixa') assert.equal(total('valor'), db.pagamentos.filter(r => !r.excluido_em && day(r.data_pagamento) >= from && day(r.data_pagamento) <= to).reduce((s,r) => s+cents(r.valor_liquido)*(r.tipo === 'receber' ? 1 : -1)*(r.estorno_de_pagamento_id ? -1 : 1),0))
    if (type === 'valor-estoque') {
      assert.equal(records.length, db.saldos_estoque.length)
      assert.equal(total('valor_estoque'), db.saldos_estoque.reduce((s,r) => s+Math.round(Number(r.quantidade_fisica)*Number(r.custo_medio)*100),0))
    }
    if (type === 'posicao-financeira') {
      let expected = 0
      for (const side of ['receber','pagar']) for (const p of db['contas_' + side + '_parcelas']) {
        const title = db['contas_' + side].find(t => String(t.id) === String(p['conta_' + side + '_id']))!
        if (p.excluido_em || title.excluido_em || title.status === 'cancelado' || p.status === 'cancelado' || day(p.data_vencimento) < from || day(p.data_vencimento) > to || (side === 'pagar' && title.tipo_lancamento !== 'efetivo')) continue
        const paid = db.pagamentos.filter(m => String(m['conta_' + side + '_parcela_id']) === String(p.id) && !m.estornado_em && !m.estorno_de_pagamento_id && !m.excluido_em).reduce((s,m) => s+cents(m.valor),0)
        expected += cents(p.valor)-paid
      }
      assert.equal(total('saldo'), expected)
    }
  })
  await check('consultar_relatorio: período maior que 366 dias é recusado', () => rejected('consultar_relatorio', { empresa_id: companyId, tipo: 'dre-caixa', inicio: '2025-01-01', fim: '2026-12-31' }, 'INVALID_INPUT'))
  const today=String((await client.query('SELECT CURRENT_DATE::text AS today')).rows[0].today)
  const sevenDays=new Date(today+'T00:00:00Z');sevenDays.setUTCDate(sevenDays.getUTCDate()+7)
  const financialRows=(side:string)=>db['contas_'+side+'_parcelas'].filter(p=>!p.excluido_em).flatMap(p=>{
    const title=db['contas_'+side].find(t=>String(t.id)===String(p['conta_'+side+'_id']))
    if(!title||title.excluido_em)return []
    const cash=db.pagamentos.filter(m=>String(m['conta_'+side+'_parcela_id'])===String(p.id)&&!m.estornado_em&&!m.estorno_de_pagamento_id&&!m.excluido_em).reduce((s,m)=>s+cents(m.valor),0)
    const credit=db.adiantamentos_aplicacoes.filter(a=>String(a['conta_'+side+'_parcela_id'])===String(p.id)).reduce((s,a)=>s+cents(a.valor)*(a.reversao_de_id?-1:1),0)
    const transferred=db.renegociacoes_parcelas.filter(a=>String(a['conta_'+side+'_parcela_id'])===String(p.id)&&a.papel==='origem'&&db.renegociacoes.some(r=>String(r.id)===String(a.renegociacao_id)&&r.status==='efetivada')).reduce((s,a)=>s+cents(a.valor),0)
    const saldo=cents(p.valor)-cash-credit-transferred, due=day(p.data_vencimento)
    const status=title.status==='cancelado'||p.status==='cancelado'?'cancelado':transferred>0?'renegociado':saldo===0?'pago':due<today?'vencido':cash+credit>0?'parcial':p.status
    return [{id:String(p.id),valor:cents(p.valor),saldo,status,due}]
  })
  for(const side of ['pagar','receber']){
    const expected=financialRows(side),active=expected.filter(r=>!['cancelado','renegociado','pago'].includes(r.status))
    await check('Cards: totais completos, paginação e vazio no financeiro '+side,async()=>{
      const result=(await call('consultar_financeiro',{empresa_id:companyId,tipo:side,por_pagina:10})).data
      assert.equal(result.summary.quantidade,expected.length);assert.equal(cents(result.summary.em_aberto),active.reduce((s,r)=>s+r.saldo,0))
      assert.equal(cents(result.summary.vencidas),active.filter(r=>r.due<today).reduce((s,r)=>s+r.saldo,0))
      assert.equal(cents(result.summary.vence_em_7_dias),active.filter(r=>r.due>today&&r.due<=sevenDays.toISOString().slice(0,10)).reduce((s,r)=>s+r.saldo,0))
      const outside=(await call('consultar_financeiro',{empresa_id:companyId,tipo:side,pagina:10000})).data
      assert.deepEqual(outside.records,[]);assert.deepEqual(outside.summary,result.summary)
      const empty=(await call('consultar_financeiro',{empresa_id:companyId,tipo:side,busca:'inexistente-'+randomUUID()})).data
      assert.equal(empty.summary.quantidade,0);assert.equal(cents(empty.summary.em_aberto),0)
    })
    await check('Cards: filtros financeiros também filtram os indicadores '+side,async()=>{
      const filtered=active.filter(r=>r.status==='vencido'&&r.due>='2026-09-01'&&r.due<='2026-09-30')
      const result=(await call('consultar_financeiro',{empresa_id:companyId,tipo:side,status:'vencido',vencimento_inicio:'2026-09-01',vencimento_fim:'2026-09-30'})).data
      assert.equal(result.total,filtered.length);assert.equal(cents(result.summary.em_aberto),filtered.reduce((s,r)=>s+r.saldo,0))
    })
    await check('obter_parcela_financeira: saldo e histórico '+side,async()=>{
      const p=expected[0],result=(await call('obter_parcela_financeira',{empresa_id:companyId,tipo:side,parcela_id:Number(p.id)})).data
      assert.equal(String(result.record.id),p.id);assert.equal(cents(result.record.saldo),p.saldo)
      const history=db.pagamentos.filter(m=>String(m['conta_'+side+'_parcela_id'])===p.id&&!m.excluido_em)
      assert.equal(result.history.length,Math.min(100,history.length))
      for(const payment of result.history)assert.equal(cents(payment.valor),cents(history.find(m=>String(m.id)===payment.id)!.valor))
    })
  }
  for(const type of ['clientes','fornecedores','produtos','servicos'])await check('obter_cadastro: detalhe '+type,async()=>{
    const table=type==='clientes'||type==='fornecedores'?'entidades':type
    const record=db[table].find(r=>!r.excluido_em&&(type==='clientes'?r.eh_cliente:type==='fornecedores'?r.eh_fornecedor:true))!
    const data=(await call('obter_cadastro',{empresa_id:companyId,tipo:type,registro_id:Number(record.id)})).data
    assert.equal(String(data.record.id),String(record.id));assert.equal(data.record.nome,record.nome)
  })
  for(const type of ['vendas','compras','pagar','receber'])await check('analisar_periodo: agregados completos '+type,async()=>{
    const from='2026-07-01',to='2026-12-31'
    const expected=type==='pagar'||type==='receber'?financialRows(type).filter(r=>!['cancelado','renegociado','pago'].includes(r.status)&&r.due>=from&&r.due<=to).map(r=>({value:r.saldo,date:r.due}))
      :db[type].filter(r=>!r.excluido_em&&(type==='vendas'?['confirmada','faturada'].includes(r.status)&&r.tipo_documento==='venda':['confirmada','recebida'].includes(r.status)&&r.tipo_movimento==='compra')&&day(r[type==='vendas'?'data_venda':'data_compra'])>=from&&day(r[type==='vendas'?'data_venda':'data_compra'])<=to).map(r=>({value:cents(r.total),date:day(r[type==='vendas'?'data_venda':'data_compra'])}))
    const result=(await call('analisar_periodo',{empresa_id:companyId,tipo:type,inicio:from,fim:to})).data
    assert.equal(Number(result.summary.quantidade),expected.length);assert.equal(cents(result.summary.valor_total),expected.reduce((s,r)=>s+r.value,0))
    for(const group of result.records){const rows=expected.filter(r=>r.date.slice(0,7)===group.periodo);assert.equal(Number(group.quantidade),rows.length);assert.equal(cents(group.valor),rows.reduce((s,r)=>s+r.value,0))}
    assert.equal(result.records.reduce((s:number,r:Row)=>s+Number(r.quantidade),0),expected.length)
  })
  for(const type of ['vendas','compras'])await check('Cards: período comercial e total '+type,async()=>{
    const expected=db[type].filter(r=>!r.excluido_em&&day(r[type==='vendas'?'data_venda':'data_compra'])>='2026-09-01'&&day(r[type==='vendas'?'data_venda':'data_compra'])<='2026-09-30')
    const result=(await call(type==='vendas'?'listar_vendas':'listar_compras',{empresa_id:companyId,inicio:'2026-09-01',fim:'2026-09-30'})).data
    assert.equal(result.total,expected.length);assert.equal(cents(result.summary.valor_total),expected.reduce((s,r)=>s+cents(r.total),0))
  })
  for(const [card,consulta,parametros] of [
    ['tabela','consultar_financeiro',{tipo:'pagar'}],['detalhes','obter_venda',{venda_id:Number(sale.id)}],['analise','analisar_periodo',{tipo:'vendas',inicio:'2026-07-01',fim:'2026-09-30'}],['selecao','buscar_cadastros',{tipo:'clientes'}],
  ] as const)await check('renderizar_card: dados reais em '+card,async()=>{
    const result=(await call('renderizar_card',{empresa_id:companyId,card,consulta,parametros})).data
    assert.equal(result.card,card);assert.equal(result.empresa.id,companyId)
    const source=(await call(consulta,{empresa_id:companyId,...parametros})).data
    assert.deepEqual(result.dados,source)
  })
  for(const card of ['revisao','resultado'])await check('renderizar_card: rascunho '+card+' isolado',async()=>{
    if(existingDraft){const result=(await call('renderizar_card',{empresa_id:companyId,card,consulta:'obter_rascunho',parametros:{rascunho_id:existingDraft.id}})).data;assert.equal(result.dados.rascunho_id,existingDraft.id)}
    else await rejected('renderizar_card',{empresa_id:companyId,card,consulta:'obter_rascunho',parametros:{rascunho_id:randomUUID()}},'NOT_FOUND')
  })
  await check('Cards: recurso HTML e políticas sem destinos externos',async()=>{
    const result=await rpc('resources/read',{uri:'ui://chatgptplugin/cards/v1.html'})
    const resource=result.body.result.contents[0];assert.equal(resource.mimeType,'text/html;profile=mcp-app');assert.deepEqual(resource._meta.ui.csp,{connectDomains:[],resourceDomains:[]})
  })
  await check('Dados comerciais, rascunhos e preferências permanecem iguais', async () => {
    await client.query('BEGIN READ ONLY')
    try {
      for (const name of names) assert.equal(fingerprint((await sql(`SELECT * FROM erp.${name} WHERE tenant_id=$1 ORDER BY id`))), fingerprint(db[name]), name)
      const after = (await client.query(pluginQuery, [userId,clientId])).rows
      assert.equal(fingerprint(after), fingerprint(pluginSnapshot))
    } finally { await client.query('ROLLBACK') }
  })
  return { draftExistingRecordVerified: Boolean(existingDraft), quotationExistingRecordVerified: db.vendas.some(r => r.tipo_documento === 'orcamento'), reportTypesTested: 8, unchangedBusinessTables: names.length }
}
