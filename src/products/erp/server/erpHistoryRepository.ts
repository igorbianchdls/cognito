import { runQuery } from '@/lib/postgres'
import { ErpDomainError } from './erpApi'

const documents: Record<
  string,
  { table: string; foreign: string; events: string; files?: string }
> = {
  vendas: {
    table: 'vendas',
    foreign: 'venda_id',
    events: 'vendas_eventos',
    files: 'vendas_arquivos',
  },
  compras: {
    table: 'compras',
    foreign: 'compra_id',
    events: 'compras_eventos',
    files: 'compras_arquivos',
  },
  contratos: {
    table: 'contratos_vendas',
    foreign: 'contrato_id',
    events: 'contratos_vendas_eventos',
    files: 'contratos_vendas_arquivos',
  },
  'ordens-servico': {
    table: 'ordens_servico',
    foreign: 'ordem_servico_id',
    events: 'ordens_servico_eventos',
    files: 'ordens_servico_arquivos',
  },
  'contas-receber': {
    table: 'contas_receber',
    foreign: 'conta_receber_id',
    events: 'contas_receber_eventos',
    files: 'contas_receber_arquivos',
  },
  'contas-pagar': {
    table: 'contas_pagar',
    foreign: 'conta_pagar_id',
    events: 'contas_pagar_eventos',
    files: 'contas_pagar_arquivos',
  },
  'notas-fiscais': {
    table: 'notas_fiscais',
    foreign: 'nota_fiscal_id',
    events: 'notas_fiscais_eventos',
  },
  'notas-compra': {
    table: 'notas_fiscais',
    foreign: 'nota_fiscal_id',
    events: 'notas_fiscais_eventos',
  },
}

export function historyDocument(kind: string) {
  const definition = documents[kind]
  if (!definition) throw new ErpDomainError('NOT_FOUND', 'Tipo de documento não encontrado.', 404)
  return definition
}

async function assertDocument(tenantId: number, kind: string, id: string) {
  const definition = historyDocument(kind)
  if (!/^[1-9]\d*$/.test(id))
    throw new ErpDomainError('NOT_FOUND', 'Documento não encontrado.', 404)
  const rows = await runQuery(
    `SELECT id FROM erp.${definition.table} WHERE tenant_id=$1 AND id=$2 AND excluido_em IS NULL`,
    [tenantId, id],
  )
  if (!rows.length) throw new ErpDomainError('NOT_FOUND', 'Documento não encontrado.', 404)
  return definition
}

export async function getDocumentHistory(tenantId: number, kind: string, id: string, page = 1) {
  const d = await assertDocument(tenantId, kind, id)
  const offset = (Math.max(1, Math.min(10000, Math.floor(page) || 1)) - 1) * 30
  const events = await runQuery(
    `SELECT e.id::text, e.evento, e.criado_em,
      to_jsonb(e)->>'criado_por' AS responsavel_id, to_jsonb(e)->>'status_anterior' AS status_anterior,
      to_jsonb(e)->>'status_novo' AS status_novo, COALESCE(to_jsonb(e)->>'motivo',to_jsonb(e)->'dados'->>'motivo') AS motivo,
      COALESCE(to_jsonb(e)->>'versao',to_jsonb(e)->'dados'->>'versao') AS versao,
      to_jsonb(e)->>'pagamento_id' AS pagamento_id,
      to_jsonb(e)->>'conta_receber_parcela_id' AS parcela_id
    FROM erp.${d.events} e WHERE e.tenant_id=$1 AND e.${d.foreign}=$2
    ORDER BY e.criado_em DESC,e.id DESC LIMIT 31 OFFSET $3`,
    [tenantId, id, offset],
  )
  const files = d.files
    ? await runQuery(
        `SELECT a.id::text,a.nome,a.mime_type,a.tamanho_bytes,
      l.criado_em,l.criado_por::text AS responsavel_id,to_jsonb(l)->>'descricao' AS descricao,
      to_jsonb(l)->>'finalidade' AS finalidade,
      (a.excluido_em IS NULL AND to_jsonb(l)->>'excluido_em' IS NULL) AS disponivel
    FROM erp.${d.files} l JOIN erp.arquivos a ON a.tenant_id=l.tenant_id AND a.id=l.arquivo_id
    WHERE l.tenant_id=$1 AND l.${d.foreign}=$2 ORDER BY l.criado_em DESC,l.id DESC LIMIT 31 OFFSET $3`,
        [tenantId, id, offset],
      )
    : []
  return {
    events: events.slice(0, 30),
    files: files.slice(0, 30),
    hasMore: events.length > 30 || files.length > 30,
  }
}

export async function getDocumentFile(tenantId: number, kind: string, id: string, fileId: string) {
  const d = await assertDocument(tenantId, kind, id)
  if (!d.files || !/^[1-9]\d*$/.test(fileId))
    throw new ErpDomainError('NOT_FOUND', 'Anexo não encontrado.', 404)
  const rows = await runQuery<{ bucket: string; caminho: string; nome: string }>(
    `SELECT a.bucket,a.caminho,a.nome FROM erp.${d.files} l
    JOIN erp.arquivos a ON a.tenant_id=l.tenant_id AND a.id=l.arquivo_id
    WHERE l.tenant_id=$1 AND l.${d.foreign}=$2 AND a.id=$3 AND a.excluido_em IS NULL AND to_jsonb(l)->>'excluido_em' IS NULL`,
    [tenantId, id, fileId],
  )
  if (!rows.length) throw new ErpDomainError('NOT_FOUND', 'Anexo indisponível.', 404)
  return rows[0]
}

export async function getBillingHistory(tenantId: number, installmentId: string, page = 1) {
  if (!/^[1-9]\d*$/.test(installmentId))
    throw new ErpDomainError('NOT_FOUND', 'Parcela não encontrada.', 404)
  const offset = (Math.max(1, Math.min(10000, Math.floor(page) || 1)) - 1) * 30
  const charges = await runQuery(
    `SELECT id::text,tipo,provedor,status AS estado_externo,valor,data_vencimento FROM erp.cobrancas
    WHERE tenant_id=$1 AND conta_receber_parcela_id=$2 AND excluido_em IS NULL ORDER BY id DESC LIMIT 31 OFFSET $3`,
    [tenantId, installmentId, offset],
  )
  const events = await runQuery(
    `SELECT e.id::text,e.cobranca_id::text,e.evento,e.evento_externo_id,e.ocorrido_em,e.recebido_em,e.processado_em,
    CASE WHEN e.processado_em IS NULL THEN 'pendente' WHEN e.erro_mensagem IS NULL THEN 'concluida' ELSE 'falha' END AS processamento,
    e.erro_mensagem FROM erp.cobrancas_eventos e JOIN erp.cobrancas c ON c.tenant_id=e.tenant_id AND c.id=e.cobranca_id
    WHERE e.tenant_id=$1 AND c.conta_receber_parcela_id=$2 ORDER BY e.recebido_em DESC,e.id DESC LIMIT 31 OFFSET $3`,
    [tenantId, installmentId, offset],
  )
  const executions = await runQuery(
    `SELECT x.id::text,x.evento_cobranca_id::text,x.status,x.tentativas,x.iniciado_em,x.finalizado_em,x.resultado,x.erro,x.historico_estados
    FROM erp.execucoes_automacao x JOIN erp.cobrancas_eventos e ON e.tenant_id=x.tenant_id AND e.id=x.evento_cobranca_id
    JOIN erp.cobrancas c ON c.tenant_id=e.tenant_id AND c.id=e.cobranca_id
    WHERE x.tenant_id=$1 AND c.conta_receber_parcela_id=$2 ORDER BY x.criado_em DESC,x.id DESC LIMIT 31 OFFSET $3`,
    [tenantId, installmentId, offset],
  )
  const notifications = await runQuery(
    `SELECT n.id::text,n.cobranca_id::text,n.canal,n.destinatario,n.status,n.agendada_em,n.enviada_em,n.entregue_em,n.visualizada_em,
    n.erro_mensagem,to_jsonb(n)->>'tentativas' AS tentativas,n.historico_estados
    FROM erp.cobrancas_notificacoes n JOIN erp.cobrancas c ON c.tenant_id=n.tenant_id AND c.id=n.cobranca_id
    WHERE n.tenant_id=$1 AND c.conta_receber_parcela_id=$2 ORDER BY n.criado_em DESC,n.id DESC LIMIT 31 OFFSET $3`,
    [tenantId, installmentId, offset],
  )
  return {
    charges: charges.slice(0, 30),
    events: events.slice(0, 30),
    executions: executions.slice(0, 30),
    notifications: notifications.slice(0, 30),
    hasMore: [charges, events, executions, notifications].some((rows) => rows.length > 30),
  }
}
