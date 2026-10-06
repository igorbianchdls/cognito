import { z } from 'zod'

export const fiscalEnvironmentSchema=z.enum(['homologacao','producao'])
export const fiscalModelSchema=z.enum(['nfe','nfce','nfse_municipal','nfse_nacional'])
export const fiscalActionSchema=z.enum(['emitir','consultar','cancelar','corrigir','substituir','inutilizar'])
const provider=z.string().regex(/^[a-z][a-z0-9_]{1,63}$/)
type JsonValue=string|number|boolean|null|JsonValue[]|{[key:string]:JsonValue}
const json:z.ZodType<JsonValue>=z.lazy(()=>z.union([
  z.string(),z.number().finite(),z.boolean(),z.null(),z.array(json),z.record(z.string(),json),
]))
const object=z.record(z.string(),json)
export const fiscalReturnSchema=z.object({
  provedor:provider,ambiente:fiscalEnvironmentSchema,
  referencia_externa:z.string().trim().min(1).max(200),
  evento_externo_id:z.string().trim().min(1).max(200).optional(),
  payload:object,
}).strict()
export const fiscalAttemptSchema=z.object({
  nota_fiscal_id:z.number().int().positive(),acao:fiscalActionSchema,
  chave_idempotencia:z.string().trim().min(1).max(200),
  numero_tentativa:z.number().int().positive().default(1),payload:object,
}).strict()
export type FiscalEnvironment=z.infer<typeof fiscalEnvironmentSchema>
export type FiscalModel=z.infer<typeof fiscalModelSchema>
export type FiscalReturn=z.infer<typeof fiscalReturnSchema>
export type FiscalAttempt=z.input<typeof fiscalAttemptSchema>

/** The future adapter normalizes its own payloads. Accepted requests are not authorized notes. */
export interface FiscalProviderAdapter {
  readonly id:string
  readonly models:readonly FiscalModel[]
  emit(request:FiscalProviderRequest):Promise<FiscalProviderResult>
  consult(request:Omit<FiscalProviderRequest,'payload'>):Promise<FiscalProviderResult>
  cancel(request:FiscalProviderRequest):Promise<FiscalProviderResult>
}
export type FiscalProviderRequest={
  ambiente:FiscalEnvironment;referencia_externa:string;payload:Record<string,unknown>
  // Resolve this reference on the server; never store the resolved credential in requests/audit.
  token_secret_ref:string
}
export type FiscalProviderResult={
  status:'aguardando_retorno'|'emitida'|'falha'|'cancelada'|'resultado_desconhecido'
  resposta:Record<string,unknown>;http_status?:number
}
