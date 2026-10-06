import { createHash } from 'node:crypto'
import { withTransaction } from '@/lib/postgres'
import { getErpDatabaseContext } from '@/lib/erpDatabaseContext'
import { ErpDomainError } from '@/products/erp/shared/erpErrors'
import { canonicalRequest } from '@/products/erp/shared/commercialContracts'
import { fiscalAttemptSchema, fiscalReturnSchema, type FiscalAttempt, type FiscalReturn } from '@/products/erp/shared/fiscalContracts'

function fingerprint(value:unknown){return createHash('sha256').update(canonicalRequest(value)).digest('hex')}
function assertContext(tenantId:number,actorId?:number){
  const context=getErpDatabaseContext()
  if(!context||context.readOnly||context.tenantId!==tenantId||(actorId!==undefined&&context.userId!==actorId))
    throw new ErpDomainError('FORBIDDEN','Contexto fiscal autenticado inválido.',403)
}

/** Store a trusted, authenticated notification. The caller must verify the provider before calling. */
export async function recordFiscalReturn(tenantId:number,input:FiscalReturn){
  assertContext(tenantId)
  const notification=fiscalReturnSchema.parse(input)
  const key=fingerprint(notification.evento_externo_id
    ? {provedor:notification.provedor,ambiente:notification.ambiente,evento:notification.evento_externo_id}
    : notification)
  return withTransaction(async client=>{
    const note=await client.query(`SELECT id FROM erp.notas_fiscais WHERE empresa_id=$1
      AND provedor=$2 AND ambiente=$3 AND referencia_externa=$4 AND excluido_em IS NULL`,
    [tenantId,notification.provedor,notification.ambiente,notification.referencia_externa])
    const inserted=await client.query(`INSERT INTO erp.notas_fiscais_retornos
      (empresa_id,nota_fiscal_id,provedor,ambiente,referencia_externa,evento_externo_id,chave_deduplicacao,payload)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
      ON CONFLICT(empresa_id,provedor,ambiente,chave_deduplicacao) DO NOTHING RETURNING id::text,status`,
    [tenantId,note.rows[0]?.id??null,notification.provedor,notification.ambiente,notification.referencia_externa,
      notification.evento_externo_id??null,key,JSON.stringify(notification.payload)])
    if(inserted.rows[0])return {...inserted.rows[0],duplicado:false}
    const existing=await client.query(`SELECT id::text,status,referencia_externa,payload FROM erp.notas_fiscais_retornos
      WHERE empresa_id=$1 AND provedor=$2 AND ambiente=$3 AND chave_deduplicacao=$4`,
    [tenantId,notification.provedor,notification.ambiente,key])
    const row=existing.rows[0]
    if(!row||row.referencia_externa!==notification.referencia_externa||fingerprint(row.payload)!==fingerprint(notification.payload))
      throw new ErpDomainError('VALIDATION_ERROR','Evento fiscal repetido com dados diferentes.',409)
    return {id:row.id,status:row.status,duplicado:true}
  })
}

/** Persist a request only. This does not send it, claim a worker, or mark the invoice authorized. */
export async function recordFiscalAttempt(input:{tenantId:number;actorId:number;request:FiscalAttempt}){
  assertContext(input.tenantId,input.actorId)
  const request=fiscalAttemptSchema.parse(input.request)
  const hash=fingerprint({acao:request.acao,payload:request.payload})
  return withTransaction(async client=>{
    const result=await client.query(`SELECT id,provedor,ambiente,referencia_externa,status FROM erp.notas_fiscais
      WHERE empresa_id=$1 AND id=$2 AND excluido_em IS NULL FOR UPDATE`,[input.tenantId,request.nota_fiscal_id])
    const note=result.rows[0]
    if(!note)throw new ErpDomainError('NOT_FOUND','Nota fiscal não encontrada.',404)
    if(!note.provedor||!note.ambiente||!note.referencia_externa)
      throw new ErpDomainError('VALIDATION_ERROR','Selecione a configuração fiscal antes de registrar uma tentativa.')
    const existing=await client.query(`SELECT id::text,status,request_hash FROM erp.notas_fiscais_tentativas
      WHERE empresa_id=$1 AND nota_fiscal_id=$2 AND acao=$3 AND chave_idempotencia=$4 AND numero_tentativa=$5`,
    [input.tenantId,request.nota_fiscal_id,request.acao,request.chave_idempotencia,request.numero_tentativa])
    if(existing.rows[0]){
      if(existing.rows[0].request_hash!==hash)throw new ErpDomainError('VALIDATION_ERROR','Chave fiscal reutilizada com outro pedido.',409)
      return {id:existing.rows[0].id,status:existing.rows[0].status,duplicado:true}
    }
    const inserted=await client.query(`INSERT INTO erp.notas_fiscais_tentativas
      (empresa_id,nota_fiscal_id,acao,chave_idempotencia,numero_tentativa,request_hash,provedor,ambiente,referencia_externa,payload_enviado,criado_por,atualizado_por)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11,$11) RETURNING id::text,status`,
    [input.tenantId,request.nota_fiscal_id,request.acao,request.chave_idempotencia,request.numero_tentativa,hash,
      note.provedor,note.ambiente,note.referencia_externa,JSON.stringify(request.payload),input.actorId])
    return {...inserted.rows[0],duplicado:false}
  })
}
