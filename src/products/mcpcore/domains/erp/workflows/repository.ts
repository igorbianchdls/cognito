import { runQuery, withTransaction, type SQLClient } from '@/lib/postgres'
import { suggestBankReconciliations } from '@/products/erp/server/erpProfessionalRepository'
import { createManagementOperation } from '@/products/erp/server/erpManagementRepository'
import { classifyExpenseWithClient } from '@/products/erp/server/erpCrudRepository'
import { createServiceInvoice, actOnServiceInvoice } from '@/products/erp/server/fiscal/serviceInvoiceRepository'
import { serviceInvoiceInputSchema, serviceInvoiceTotals } from '@/products/erp/shared/serviceInvoiceContracts'
import { erpToday } from '@/products/erp/server/erpBusinessDate'
import { PluginError } from '../../../shared/contracts'
import type { Fields, WorkflowKind, WorkflowItem, WorkflowRow } from './contracts'

export async function refreshWorkflowRow(company: number, row: WorkflowRow): Promise<WorkflowRow> {
  if (row.kind !== 'notas') return row
  const ids = row.items.filter(item => item.status === 'awaiting' && item.result?.nota_id).map(item => Number(item.result!.nota_id))
  if (!ids.length) return row
  const records = await runQuery<Fields>("SELECT id,status,erro_codigo,erro_mensagem FROM erp.notas_fiscais WHERE empresa_id=$1 AND id=ANY($2::bigint[]) AND tipo='nfse' AND direcao='saida' AND modo_operacao='simulacao' AND excluido_em IS NULL", [company, ids])
  return { ...row, items: row.items.map((item): WorkflowItem => {
    if (item.status !== 'awaiting') return item
    const record = records.find(record => Number(record.id) === Number(item.result?.nota_id))
    if (!record || !['emitida', 'falha', 'cancelada'].includes(String(record.status))) return item
    const success = record.status === 'emitida'
    return { ...item, status: success ? 'saved' : 'failed', result: { ...item.result, status: record.status }, code: success ? undefined : String(record.erro_codigo || record.status), message: success ? undefined : String(record.erro_mensagem || (record.status === 'cancelada' ? 'A nota foi cancelada no ERP.' : 'Revise a nota no ERP.')) }
  }) }
}

const dateText = (value: unknown) => value instanceof Date ? value.toISOString().slice(0, 10) : String(value || '').slice(0, 10)
const unavailable = (text: string): never => { throw new PluginError('INVALID_STATE', text, 409) }
export type CapturedWorkflowItem = { snapshot: Fields; preview: Fields; generatedInput?: ReturnType<typeof serviceInvoiceInputSchema.parse> }
export async function captureWorkflowItem(client: Pick<SQLClient, 'query'>, company: number, kind: WorkflowKind, input: Fields, lock: boolean): Promise<CapturedWorkflowItem> {
  const rows = async (sql: string, params: unknown[]) => (await client.query(sql, params)).rows
  const update = lock ? ' FOR UPDATE' : '', share = lock ? ' FOR SHARE' : ''
  if (kind === 'conciliacao') {
    const bank = (await rows('SELECT * FROM erp.transacoes_bancarias WHERE empresa_id=$1 AND id=$2 AND excluido_em IS NULL' + update, [company, input.transacao_bancaria_id]))[0]
    if (!bank || bank.status !== 'pendente') return unavailable('Movimentação não está disponível para conciliar.')
    const transfer = Boolean(input.transferencia_financeira_id), target = (await rows(`SELECT * FROM erp.${transfer ? 'transferencias_financeiras' : 'pagamentos'} WHERE empresa_id=$1 AND id=$2 AND excluido_em IS NULL${update}`, [company, input.transferencia_financeira_id || input.pagamento_id]))[0]
    if (!target) return unavailable('Correspondência não disponível nesta empresa.')
    if (transfer ? target.status !== 'pendente' || !target.pagamento_origem_id || bank.tipo !== 'credito' || Number(target.conta_destino_id) !== Number(bank.conta_financeira_id) : target.estornado_em || target.estorno_de_pagamento_id || target.conciliado || (bank.tipo === 'credito') !== (target.tipo === 'receber') || Number(target.conta_financeira_id) !== Number(bank.conta_financeira_id)) return unavailable('A correspondência mudou ou pertence a outra conta/sentido.')
    const associated = await rows(`SELECT * FROM erp.conciliacoes_bancarias_itens WHERE empresa_id=$1 AND desfeito_em IS NULL AND (transacao_bancaria_id=$2 OR ${transfer ? 'transferencia_financeira_id' : 'pagamento_id'}=$3) ORDER BY id${share}`, [company, bank.id, target.id])
    const bankUsed = associated.filter(item => Number(item.transacao_bancaria_id) === Number(bank.id)).reduce((sum, item) => sum + Number(item.valor_conciliado), 0)
    const targetUsed = associated.filter(item => Number(item[transfer ? 'transferencia_financeira_id' : 'pagamento_id']) === Number(target.id)).reduce((sum, item) => sum + Number(item.valor_conciliado), 0)
    const amount = transfer ? Number(bank.valor) : Math.round(Math.min(Number(bank.valor) - bankUsed, Number(target.valor_liquido) - targetUsed) * 100) / 100
    if (amount <= 0 || transfer && associated.length) return unavailable('Não há saldo disponível para conciliar.')
    const account = (await rows('SELECT id,nome FROM erp.contas_financeiras WHERE empresa_id=$1 AND id=$2 AND excluido_em IS NULL' + share, [company, bank.conta_financeira_id]))[0]
    const side = target.tipo === 'receber' ? 'receber' : 'pagar'
    const linked = transfer ? null : (await rows(`SELECT title.id,title.descricao,party.nome participante FROM erp.contas_${side}_parcelas part JOIN erp.contas_${side} title ON title.empresa_id=$1 AND title.id=part.conta_${side}_id LEFT JOIN erp.entidades party ON party.empresa_id=$1 AND party.id=title.${side === 'pagar' ? 'fornecedor_id' : 'cliente_id'} WHERE part.empresa_id=$1 AND part.id=$2${lock ? ' FOR SHARE OF part,title' : ''}`, [company, target['conta_' + side + '_parcela_id'] || null]))[0]
    return { snapshot: { bank, target, associated, account, linked }, preview: { registro_id: Number(bank.id), nome: String(bank.descricao), data: dateText(bank.data_transacao), valor: amount, valor_bancario: Number(bank.valor), saldo_bancario_restante: Math.round((Number(bank.valor) - bankUsed - amount) * 100) / 100, direcao: bank.tipo === 'credito' ? 'Entrada' : 'Saída', conta: account?.nome || 'Conta financeira', correspondencia: transfer ? 'Transferência #' + target.id : 'Pagamento #' + target.id, descricao_correspondencia: linked?.descricao || target.observacoes || null, participante: linked?.participante || null, valor_correspondencia: Number(transfer ? target.valor : target.valor_liquido), data_correspondencia: dateText(transfer ? target.data_transferencia : target.data_pagamento), pagamento_id: input.pagamento_id, transferencia_financeira_id: input.transferencia_financeira_id, aviso: transfer ? 'O repasse será concluído pela data e pelo valor creditados no extrato. Confira eventuais diferenças.' : 'Valores iguais não garantem que sejam a mesma transação. Confira a correspondência.' } }
  }
  if (kind === 'classificacao') {
    const title = (await rows('SELECT * FROM erp.contas_pagar WHERE empresa_id=$1 AND id=$2 AND excluido_em IS NULL' + update, [company, input.registro_id]))[0]
    if (!title || title.origem !== 'manual' || ['cancelado', 'renegociado'].includes(String(title.status))) return unavailable('Classificação pelo chat exige título manual ativo. Use o ERP para documentos vinculados.')
    const allocations = await rows('SELECT * FROM erp.rateios_financeiros WHERE empresa_id=$1 AND conta_pagar_id=$2 ORDER BY id' + share, [company, title.id])
    if (allocations.length) return unavailable('Título com rateio exige revisão no financeiro do ERP.')
    const category = (await rows("SELECT * FROM erp.categorias WHERE empresa_id=$1 AND id=$2 AND ativo AND excluido_em IS NULL AND tipo='despesa' AND NOT EXISTS(SELECT 1 FROM erp.categorias child WHERE child.empresa_id=$1 AND child.categoria_pai_id=$2 AND child.ativo AND child.excluido_em IS NULL)" + share, [company, input.categoria_id]))[0]
    if (!category) return unavailable('Escolha uma categoria de despesa ativa, sem subcategorias, desta empresa.')
    const parts = await rows('SELECT * FROM erp.contas_pagar_parcelas WHERE empresa_id=$1 AND conta_pagar_id=$2 ORDER BY id' + share, [company, title.id])
    const payments = await rows('SELECT * FROM erp.pagamentos WHERE empresa_id=$1 AND conta_pagar_parcela_id=ANY($2::bigint[]) ORDER BY id' + share, [company, parts.map(part => part.id)])
    const group = category.dre_grupo_id ? (await rows('SELECT id,nome FROM erp.dre_grupos WHERE empresa_id=$1 AND id=$2' + share, [company, category.dre_grupo_id]))[0] : null
    return { snapshot: { title, category, parts, payments, group }, preview: { registro_id: Number(title.id), nome: String(title.descricao), data: dateText(title.data_competencia), valor: Number(title.valor_total), categoria_id: Number(category.id), categoria: String(category.nome), categoria_anterior_id: title.categoria_id, grupo_dre: category.fora_dre ? 'Fora da DRE' : group?.nome || 'Não classificado na DRE' } }
  }
  const sale = (await rows('SELECT * FROM erp.vendas WHERE empresa_id=$1 AND id=$2 AND excluido_em IS NULL' + update, [company, input.venda_id]))[0]
  if (!sale || sale.tipo_documento !== 'venda' || !['confirmada', 'faturada'].includes(String(sale.status))) return unavailable('Selecione uma venda confirmada ou faturada.')
  const notes = await rows("SELECT * FROM erp.notas_fiscais WHERE empresa_id=$1 AND venda_id=$2 AND tipo='nfse' AND direcao='saida' AND excluido_em IS NULL ORDER BY id" + update, [company, sale.id])
  if (notes.length > 1 || notes.some(note => !['rascunho', 'falha'].includes(String(note.status)) || note.modo_operacao !== 'simulacao')) return unavailable('A venda já possui nota enviada/finalizada ou múltiplas notas. Revise no ERP; não emita outra automaticamente.')
  const items = await rows('SELECT * FROM erp.vendas_itens WHERE empresa_id=$1 AND venda_id=$2 AND excluido_em IS NULL ORDER BY id' + share, [company, sale.id])
  if (!items.length || items.length > 50 || items.some(item => !item.servico_id || item.produto_id)) return unavailable('O lote aceita vendas exclusivamente de serviços, com até 50 itens completos.')
  const customer = (await rows('SELECT * FROM erp.entidades WHERE empresa_id=$1 AND id=$2' + update, [company, sale.cliente_id]))[0]
  if (!customer?.ativo || !customer.eh_cliente || customer.excluido_em) return unavailable('O cliente da venda não está disponível.')
  const addresses = await rows('SELECT * FROM erp.entidades_enderecos WHERE empresa_id=$1 AND entidade_id=$2 AND ativo ORDER BY id' + share, [company, sale.cliente_id])
  const contacts = await rows('SELECT * FROM erp.entidades_contatos WHERE empresa_id=$1 AND entidade_id=$2 AND ativo ORDER BY id' + share, [company, sale.cliente_id])
  const services = await rows('SELECT * FROM erp.servicos WHERE empresa_id=$1 AND id=ANY($2::bigint[]) ORDER BY id' + share, [company, items.map(item => item.servico_id)])
  const fiscal = await rows('SELECT * FROM erp.configuracoes_fiscais WHERE empresa_id=$1 AND ativo AND excluido_em IS NULL ORDER BY padrao DESC,id' + share, [company])
  const note = notes[0] || null
  const noteItems = note ? await rows('SELECT * FROM erp.notas_fiscais_itens WHERE empresa_id=$1 AND nota_fiscal_id=$2 AND excluido_em IS NULL ORDER BY numero_item,id' + share, [company, note.id]) : []
  const noteTotals = note ? await rows('SELECT * FROM erp.notas_fiscais_totais WHERE empresa_id=$1 AND nota_fiscal_id=$2' + share, [company, note.id]) : []
  let generatedInput
  if (!note) {
    const config = fiscal[0]
    if (!config || !/^\d{7}$/.test(String(config.endereco_codigo_municipio || ''))) return unavailable('Configure os dados fiscais e o município no ERP antes de gerar notas pelo lote.')
    const prepared = serviceInvoiceInputSchema.safeParse({ cliente_id: Number(sale.cliente_id), venda_id: Number(sale.id), data_competencia: dateText(sale.data_venda), codigo_municipio_prestacao: String(config.endereco_codigo_municipio), modelo_emissao: 'nfse_nacional', aliquota_iss: Number(config.aliquota_iss_padrao || 0), itens: items.map(item => ({ tipo: 'servico', item_id: Number(item.servico_id), descricao: String(item.descricao), quantidade: Number(item.quantidade), valor_unitario: Number(item.valor_unitario), desconto: Number(item.desconto || 0) })) })
    if (!prepared.success) return unavailable('Os dados da venda exigem revisão fiscal individual: ' + prepared.error.issues.slice(0, 3).map(issue => issue.message).join(' '))
    generatedInput = prepared.data
    if (generatedInput.data_competencia > erpToday() || Math.round(serviceInvoiceTotals(generatedInput).total * 100) !== Math.round(Number(sale.total) * 100)) return unavailable('Venda com competência futura ou ajustes de total exige preparar a nota individualmente no ERP.')
  }
  return { snapshot: { sale, items, customer, addresses, contacts, services, fiscal, notes, noteItems, noteTotals }, preview: { venda_id: Number(sale.id), registro_id: note ? Number(note.id) : null, nome: String(customer.nome), numero: String(sale.numero), data: dateText(sale.data_venda), valor: Number(note?.valor_total ?? sale.total), aviso: 'SIMULAÇÃO - SEM VALIDADE FISCAL', municipio_prestacao: generatedInput?.codigo_municipio_prestacao || note?.codigo_municipio_prestacao, aliquota_iss: generatedInput?.aliquota_iss ?? Number(noteItems[0]?.aliquota_iss || 0), modelo_emissao: generatedInput?.modelo_emissao || note?.modelo_emissao, competencia: generatedInput?.data_competencia || dateText(note?.data_competencia), retencoes: generatedInput ? 'Sem retenções aplicadas neste rascunho; confirme se esta configuração está correta.' : 'Conforme o rascunho fiscal existente #' + note?.id }, generatedInput }
}

export async function applyWorkflowItem(client: SQLClient, company: number, actor: number, kind: WorkflowKind, input: Fields, key: string, captured: Awaited<ReturnType<typeof captureWorkflowItem>>): Promise<Pick<WorkflowItem, 'status' | 'result' | 'message' | 'code'>> {
  if (kind === 'conciliacao') {
    const result = await createManagementOperation({ tenantId: company, actorId: actor, resource: 'conciliar-transacao', idempotencyKey: key, values: { ...input, origem_conciliacao: 'sugerida', valor_conciliado: captured.preview.valor } })
    return { status: 'saved', result: { registro_id: String(result.id), situacao: Number(captured.preview.saldo_bancario_restante) > 0 ? 'Vínculo parcial registrado' : 'Conciliada', saldo_bancario_restante: captured.preview.saldo_bancario_restante } }
  }
  if (kind === 'classificacao') {
    await classifyExpenseWithClient(client, company, actor, Number(input.registro_id), Number(input.categoria_id))
    return { status: 'saved', result: { registro_id: String(input.registro_id), categoria: captured.preview.categoria, grupo_dre: captured.preview.grupo_dre } }
  }
  const note = captured.preview.registro_id ? { id: String(captured.preview.registro_id), versao: Number((captured.snapshot as { notes: Fields[] }).notes[0].versao) } : (await createServiceInvoice(company, actor, captured.generatedInput!, key + ':criar')).record
  const result = await actOnServiceInvoice(company, actor, Number(note.id), { chave_operacao: key + ':emitir', versao: Number(note.versao), acao: 'emitir', cenario: 'sucesso' })
  const record = result.record, state = record.status === 'emitida' ? 'saved' : record.status === 'falha' ? 'failed' : 'awaiting'
  return { status: state, result: { nota_id: Number(record.id), status: record.status, numero: record.numero, aviso: 'SIMULAÇÃO - SEM VALIDADE FISCAL' }, ...(state !== 'saved' ? { message: String(record.erro_mensagem || (state === 'awaiting' ? 'Aguardando retorno. Consulte a nota antes de reenviar.' : 'Revise os dados fiscais da nota.')), code: String(record.erro_codigo || record.status) } : {}) }
}

export async function listWorkflowCandidates(company: number, kind: WorkflowKind, input: Fields): Promise<Fields> {
  if (kind === 'conciliacao') {
    const suggestions = await suggestBankReconciliations(company)
    const page = Math.min(Number(input.pagina || 1), Math.max(1, Math.ceil(suggestions.length / 5))), local = suggestions.length < 40
    const records = (local ? suggestions : suggestions.slice((page - 1) * 5, page * 5)).map(row => ({ ...row, registro_id: Number(row.transacao_id), valor: Number(row.valor), data: dateText(row.data) }))
    return { workflow: kind, tela: 'selecao', records, total: suggestions.length, page, paginacao: { modo: local ? 'local' : 'servidor', por_pagina: 5 } }
  }
  return withTransaction(async client => {
    await client.query('SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY')
    const search = input.busca ? '%' + String(input.busca).replace(/[\\%_]/g, value => '\\' + value) + '%' : null
    const filters = kind === 'classificacao' ? "t.origem='manual' AND t.status NOT IN ('cancelado','renegociado') AND NOT EXISTS(SELECT 1 FROM erp.rateios_financeiros r WHERE r.empresa_id=$1 AND r.conta_pagar_id=t.id)" : "t.tipo_documento='venda' AND t.status IN ('confirmada','faturada') AND EXISTS(SELECT 1 FROM erp.vendas_itens vi WHERE vi.empresa_id=$1 AND vi.venda_id=t.id AND vi.servico_id IS NOT NULL AND vi.excluido_em IS NULL) AND NOT EXISTS(SELECT 1 FROM erp.vendas_itens vi WHERE vi.empresa_id=$1 AND vi.venda_id=t.id AND vi.produto_id IS NOT NULL AND vi.excluido_em IS NULL) AND NOT EXISTS(SELECT 1 FROM erp.notas_fiscais n WHERE n.empresa_id=$1 AND n.venda_id=t.id AND n.tipo='nfse' AND n.direcao='saida' AND n.excluido_em IS NULL AND (n.status NOT IN ('rascunho','falha') OR n.modo_operacao<>'simulacao')) AND (SELECT count(*) FROM erp.notas_fiscais n WHERE n.empresa_id=$1 AND n.venda_id=t.id AND n.tipo='nfse' AND n.direcao='saida' AND n.excluido_em IS NULL)<=1"
    const from = `FROM erp.${kind === 'classificacao' ? 'contas_pagar' : 'vendas'} t LEFT JOIN erp.entidades e ON e.empresa_id=$1 AND e.id=t.${kind === 'classificacao' ? 'fornecedor_id' : 'cliente_id'} WHERE t.empresa_id=$1 AND t.excluido_em IS NULL AND ${filters} AND ($2::text IS NULL OR concat_ws(' ',${kind === 'classificacao' ? 't.descricao' : 't.numero'},e.nome) ILIKE $2) AND ($3::date IS NULL OR t.${kind === 'classificacao' ? 'data_competencia' : 'data_venda'}>=$3::date) AND ($4::date IS NULL OR t.${kind === 'classificacao' ? 'data_competencia' : 'data_venda'}<=$4::date)`
    const params = [company, search, input.inicio || null, input.fim || null], count = Number((await client.query('SELECT count(*)::int total ' + from, params)).rows[0].total)
    const page = Math.min(Number(input.pagina || 1), Math.max(1, Math.ceil(count / 5))), local = count < 40
    const records = (await client.query(`SELECT t.id::text registro_id,${kind === 'classificacao' ? 't.descricao nome,t.valor_total valor,t.data_competencia::text data,t.categoria_id::text categoria_id' : "e.nome nome,t.total valor,t.data_venda::text data,t.numero,t.id::text venda_id,NULL::text categoria_id"} ${from} ORDER BY t.${kind === 'classificacao' ? 'data_competencia' : 'data_venda'} DESC,t.id DESC LIMIT $5 OFFSET $6`, [...params, local ? 39 : 5, local ? 0 : (page - 1) * 5])).rows
    const categories = kind === 'classificacao' ? (await client.query("SELECT c.id::text,c.nome,coalesce(g.nome,'Não classificado na DRE') grupo_dre,c.fora_dre FROM erp.categorias c LEFT JOIN erp.dre_grupos g ON g.empresa_id=$1 AND g.id=c.dre_grupo_id WHERE c.empresa_id=$1 AND c.tipo='despesa' AND c.ativo AND c.excluido_em IS NULL AND NOT EXISTS(SELECT 1 FROM erp.categorias child WHERE child.empresa_id=$1 AND child.categoria_pai_id=c.id AND child.ativo AND child.excluido_em IS NULL) ORDER BY c.nome,c.id LIMIT 201", [company])).rows : []
    const suggestions = (input.sugestoes || []) as { registro_id: number; categoria_id: number }[]
    if (suggestions.some(suggestion => !categories.slice(0, 200).some(category => Number(category.id) === suggestion.categoria_id))) throw new PluginError('INVALID_INPUT', 'Sugestão de categoria indisponível; escolha um ID das categorias retornadas.')
    return { workflow: kind, tela: 'selecao', records: records.map(row => ({ ...row, valor: Number(row.valor), ...(suggestions.find(suggestion => suggestion.registro_id === Number(row.registro_id)) ? { categoria_sugerida_id: suggestions.find(suggestion => suggestion.registro_id === Number(row.registro_id))!.categoria_id } : {}) })), total: count, page, paginacao: { modo: local ? 'local' : 'servidor', por_pagina: 5 }, categorias: categories.slice(0, 200), categorias_incompletas: categories.length > 200, ...(kind === 'classificacao' ? { sugestao_origem: suggestions.length ? 'modelo' : 'cadastro_atual', aviso: suggestions.length ? 'Sugestões do modelo para revisão. Nenhuma classificação foi alterada.' : 'As categorias exibidas são as atuais do título. Revise antes de confirmar; não são sugestões geradas por IA.' } : { aviso: 'SIMULAÇÃO - SEM VALIDADE FISCAL' }) }
  })
}
