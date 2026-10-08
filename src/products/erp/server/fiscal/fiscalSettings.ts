import {z} from 'zod'
import {runQuery,withTransaction} from '@/lib/postgres'
import {ErpDomainError} from '../../shared/erpErrors'
import {validCnpj} from './nfseDps'

// Dados fiscais da empresa (prestador do DPS). Na simulação só o ambiente de homologação é usado.
type Row=Record<string,unknown>
const digits=(value:string)=>value.replace(/\D/g,'')
export const fiscalSettingsSchema=z.object({
 cnpj:z.string().trim().transform(digits).refine(validCnpj,'CNPJ inválido.'),
 razao_social:z.string().trim().min(2).max(150),
 nome_fantasia:z.string().trim().max(150).optional().default(''),
 inscricao_municipal:z.string().trim().transform(digits).pipe(z.string().min(1,'Informe a inscrição municipal.').max(20)),
 regime_tributario:z.enum(['simples_nacional','simples_nacional_excesso','lucro_presumido','lucro_real','mei']),
 endereco_logradouro:z.string().trim().max(150).optional().default(''),
 endereco_numero:z.string().trim().max(20).optional().default(''),
 endereco_bairro:z.string().trim().max(80).optional().default(''),
 endereco_codigo_municipio:z.string().trim().regex(/^\d{7}$/,'Código IBGE do município tem 7 dígitos.'),
 endereco_municipio:z.string().trim().min(2).max(80),
 endereco_uf:z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/,'UF com 2 letras.'),
 endereco_cep:z.string().trim().transform(digits).pipe(z.string().regex(/^(\d{8})?$/,'CEP tem 8 dígitos.')),
 serie_dps:z.string().trim().regex(/^\d{1,5}$/,'Série do DPS: até 5 dígitos.').default('1'),
 aliquota_iss_padrao:z.number().min(2).max(5).nullable().optional(),
}).strict()
export type FiscalSettings=z.infer<typeof fiscalSettingsSchema>

const COLUMNS='id,cnpj,razao_social,nome_fantasia,inscricao_municipal,regime_tributario,ambiente,provedor,endereco_logradouro,endereco_numero,endereco_bairro,endereco_codigo_municipio,endereco_municipio,endereco_uf,endereco_cep,serie_dps,aliquota_iss_padrao'
const SELECT=`SELECT ${COLUMNS} FROM erp.configuracoes_fiscais WHERE empresa_id=$1 AND ativo AND excluido_em IS NULL ORDER BY padrao DESC,id LIMIT 1`
const publicSettings=(row:Row|undefined)=>row?{...row,id:String(row.id),aliquota_iss_padrao:row.aliquota_iss_padrao==null?null:Number(row.aliquota_iss_padrao)}:null

export async function getFiscalSettings(company:number){
 return {record:publicSettings((await runQuery<Row>(SELECT,[company]))[0])}
}

export async function saveFiscalSettings(company:number,actor:number,input:unknown){
 const data=fiscalSettingsSchema.parse(input)
 return withTransaction(async client=>{
  const current=(await client.query(SELECT+' FOR UPDATE',[company])).rows[0] as Row|undefined
  const values=[data.cnpj,data.razao_social,data.nome_fantasia||null,data.inscricao_municipal,data.regime_tributario,data.endereco_logradouro||null,data.endereco_numero||null,
   data.endereco_bairro||null,data.endereco_codigo_municipio,data.endereco_municipio,data.endereco_uf,data.endereco_cep||null,data.serie_dps,data.aliquota_iss_padrao??null,actor]
  try{
   const row=current
    ?(await client.query(`UPDATE erp.configuracoes_fiscais SET cnpj=$2,razao_social=$3,nome_fantasia=$4,inscricao_municipal=$5,regime_tributario=$6,endereco_logradouro=$7,endereco_numero=$8,
      endereco_bairro=$9,endereco_codigo_municipio=$10,endereco_municipio=$11,endereco_uf=$12,endereco_cep=$13,serie_dps=$14,aliquota_iss_padrao=$15,atualizado_por=$16
      WHERE empresa_id=$1 AND id=$17 RETURNING ${COLUMNS}`,[company,...values,current.id])).rows[0]
    :(await client.query(`INSERT INTO erp.configuracoes_fiscais(empresa_id,cnpj,razao_social,nome_fantasia,inscricao_municipal,regime_tributario,endereco_logradouro,endereco_numero,
      endereco_bairro,endereco_codigo_municipio,endereco_municipio,endereco_uf,endereco_cep,serie_dps,aliquota_iss_padrao,criado_por,atualizado_por,ambiente,provedor,padrao)
      VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$16,'homologacao','simulador_local',true) RETURNING ${COLUMNS}`,[company,...values])).rows[0]
   return {record:publicSettings(row)}
  }catch(error){
   if((error as {code?:string}).code==='23505')throw new ErpDomainError('CONFLICT','Já existe uma configuração fiscal com esse CNPJ.',409)
   throw error
  }
 })
}
