import { runQuery, type SQLClient } from '@/lib/postgres'
import { accountingAccountSchema, accountingLinkSchema, ACCOUNTING_CLASSIFICATIONS } from '../shared/accountingContracts'
import { ErpDomainError } from '../shared/erpErrors'
import type { ErpEntityRecord } from '../shared/types'

type Actor = { tenantId: number; actorId: number; values: Record<string, unknown> }
export async function lockAccountingCompany(client: Pick<SQLClient, 'query'>, company: number) {
  await client.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))', [`erp:contabilidade:${company}`])
}
export function accountingLink(value: unknown) {
  const parsed = accountingLinkSchema.safeParse(value)
  if (!parsed.success) throw new ErpDomainError('VALIDATION_ERROR', 'Selecione uma conta contábil válida.', 422)
  return parsed.data
}
function values(input: Record<string, unknown>) {
  const parsed = accountingAccountSchema.safeParse(input)
  if (!parsed.success) throw new ErpDomainError('VALIDATION_ERROR', parsed.error.issues[0]?.message || 'Confira a conta contábil.', 422)
  return parsed.data
}
export async function createAccountingAccount(client: SQLClient, input: Actor) {
  const v = values(input.values)
  await lockAccountingCompany(client, input.tenantId)
  const result = await client.query(`INSERT INTO erp.contas_contabeis
    (empresa_id,codigo,nome,descricao,conta_pai_id,tipo,classificacao,natureza,ativo,criado_por,atualizado_por)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10) RETURNING *`,
    [input.tenantId,v.codigo,v.nome,v.descricao,v.conta_pai_id,v.tipo,v.classificacao,v.natureza,v.status === 'ativo',input.actorId])
  const record = result.rows[0]
  await client.query(`INSERT INTO erp.cadastros_eventos(empresa_id,entidade_tipo,entidade_id,evento,versao,dados,criado_por)
    VALUES($1,'conta_contabil',$2,'criado',1,$3::jsonb,$4)`,
    [input.tenantId,record.id,JSON.stringify({ depois: record }),input.actorId])
  return { id: String(record.id) }
}
export async function updateAccountingAccount(client: SQLClient, input: Actor & { id: number; expectedVersion: number }, current: Record<string, unknown>) {
  const v = values({ codigo:current.codigo,nome:current.nome,descricao:current.descricao || '',conta_pai_id:current.conta_pai_id,
    tipo:current.tipo,classificacao:current.classificacao,natureza:current.natureza,status:current.ativo ? 'ativo' : 'inativo',...input.values })
  return client.query(`UPDATE erp.contas_contabeis SET codigo=$3,nome=$4,descricao=$5,conta_pai_id=$6,
    tipo=$7,classificacao=$8,natureza=$9,ativo=$10,atualizado_por=$11,versao=versao+1
    WHERE empresa_id=$1 AND id=$2 AND versao=$12 RETURNING *`,
    [input.tenantId,input.id,v.codigo,v.nome,v.descricao,v.conta_pai_id,v.tipo,v.classificacao,v.natureza,v.status === 'ativo',input.actorId,input.expectedVersion])
}
export async function listAccountingAccounts(input: { tenantId: number; page?: number; pageSize?: number; query?: string; filters?: Record<string,string> }): Promise<ErpEntityRecord[]> {
  const page = Math.min(10000, Math.max(1, Math.floor(input.page || 1))), size = Math.min(100, Math.max(1, Math.floor(input.pageSize || 50)))
  const filters = input.filters || {}
  const rows = await runQuery<Record<string, unknown>>(`WITH RECURSIVE contas AS (
    SELECT c.*,row_number() OVER(PARTITION BY conta_pai_id ORDER BY string_to_array(codigo,'.')::numeric[],id) posicao
    FROM erp.contas_contabeis c WHERE empresa_id=$1 AND excluido_em IS NULL
  ), arvore AS (
    SELECT c.*,0 nivel,ARRAY[c.posicao] caminho FROM contas c WHERE c.conta_pai_id IS NULL
    UNION ALL SELECT c.*,a.nivel+1,a.caminho||c.posicao
      FROM contas c JOIN arvore a ON c.empresa_id=a.empresa_id AND c.conta_pai_id=a.id
  ) SELECT a.id::text,a.codigo,a.nome,a.tipo,a.classificacao,a.natureza,a.ativo,a.versao,a.nivel,
    coalesce(p.codigo||' — '||p.nome,'') conta_superior,count(*) OVER()::int __total
    FROM arvore a LEFT JOIN erp.contas_contabeis p ON p.empresa_id=a.empresa_id AND p.id=a.conta_pai_id
    WHERE ($2='' OR concat_ws(' ',a.codigo,a.nome,p.nome) ILIKE '%'||$2||'%')
      AND ($3='' OR a.tipo=$3) AND ($4='' OR a.classificacao=$4)
      AND ($5='' OR a.ativo=($5='ativo'))
    ORDER BY a.caminho,a.id LIMIT $6 OFFSET $7`,
    [input.tenantId,(input.query || '').trim(),['analitica','sintetica'].includes(filters.tipo) ? filters.tipo : '',
      ACCOUNTING_CLASSIFICATIONS.some(c=>c.value === filters.classificacao) ? filters.classificacao : '',
      ['ativo','inativo'].includes(filters.status) ? filters.status : '',size,(page-1)*size])
  return rows.map(row=>({ ...row,id:String(row.id),tipo_label:row.tipo === 'sintetica' ? 'Sintética (grupo)' : 'Analítica',
    classificacao_label:ACCOUNTING_CLASSIFICATIONS.find(c=>c.value === row.classificacao)?.label || String(row.classificacao),
    natureza_label:row.natureza === 'credora' ? 'Credora' : 'Devedora',status:row.ativo ? 'ativo' : 'inativo',__total:Number(row.__total || 0) })) as ErpEntityRecord[]
}
export async function accountingSummary(company: number) {
  const [row] = await runQuery(`SELECT count(*) FILTER(WHERE ativo)::int ativas,
    count(*) FILTER(WHERE ativo AND tipo='sintetica')::int grupos,
    count(*) FILTER(WHERE ativo AND tipo='analitica')::int analiticas FROM erp.contas_contabeis WHERE empresa_id=$1`,[company])
  return { metrics: [ {label:'Contas ativas',value:String(row.ativas),detail:'estrutura contábil'},
    {label:'Grupos',value:String(row.grupos),detail:'contas sintéticas'}, {label:'Contas analíticas',value:String(row.analiticas),detail:'contas específicas'} ] }
}
export async function accountingOptions(company: number, query: string, page: number, kind: 'analitica' | 'sintetica', exclude?: number, classification?: string) {
  const rows = await runQuery(`WITH RECURSIVE descendentes AS (
    SELECT id FROM erp.contas_contabeis WHERE empresa_id=$1 AND id=$3
    UNION ALL SELECT c.id FROM erp.contas_contabeis c JOIN descendentes d ON c.conta_pai_id=d.id WHERE c.empresa_id=$1
  ) SELECT id::text AS value,codigo||' — '||nome AS label,classificacao
    FROM erp.contas_contabeis WHERE empresa_id=$1 AND ativo AND tipo=$2 AND excluido_em IS NULL
      AND id NOT IN (SELECT id FROM descendentes) AND ($4='' OR concat_ws(' ',codigo,nome) ILIKE '%'||$4||'%')
      AND ($6::text IS NULL OR classificacao=$6)
    ORDER BY string_to_array(codigo,'.')::numeric[],id LIMIT 51 OFFSET $5`,[company,kind,exclude || null,query,(page-1)*50,classification || null])
  return {options:rows.slice(0,50),hasMore:rows.length>50,page}
}
