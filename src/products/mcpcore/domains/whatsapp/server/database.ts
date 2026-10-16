import { Pool } from 'pg'
import { buildPostgresPoolConfig } from '@/lib/postgres'
import { WhatsAppError,type WhatsAppSession } from './contracts'
// Rows are mapped by repositories; compatible with the project's pg declarations.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database={query:(sql:string,values?:unknown[])=>Promise<{rows:Record<string,any>[]}>}
let pool:InstanceType<typeof Pool>|undefined
export async function transaction<T>(invoke:(db:Database)=>Promise<T>){
 if(!process.env.SUPABASE_DB_URL)throw new WhatsAppError('DATABASE_UNAVAILABLE','O banco não está configurado.',503)
 pool??=new Pool(buildPostgresPoolConfig(process.env.SUPABASE_DB_URL));const db=await pool.connect()
 try{await db.query('BEGIN');await db.query("SELECT set_config('statement_timeout','10000',true),set_config('lock_timeout','3000',true)");const data=await invoke(db);await db.query('COMMIT');return data}catch(e){await db.query('ROLLBACK').catch(()=>{});throw e}finally{db.release()}
}
export async function currentSession(db:Database,user:number,company:number,write=false):Promise<WhatsAppSession>{
 const row=(await db.query("SELECT m.role FROM shared.usuarios_empresas m JOIN shared.usuarios u ON u.id=m.usuario_id JOIN shared.empresas e ON e.id=m.empresa_id WHERE m.usuario_id=$1 AND m.empresa_id=$2 AND m.status='active' AND NOT m.suspenso_localmente AND u.status='active' AND e.status='active'",[user,company])).rows[0]
 if(!row||!['owner','admin','member','viewer'].includes(row.role))throw new WhatsAppError('ACCESS_DENIED','Vínculo com a empresa indisponível.',403)
 if(write&&row.role==='viewer')throw new WhatsAppError('READ_ONLY','Seu acesso permite somente consultas.',403)
 return {tenantId:company,sharedUserId:user,role:row.role}
}
export async function restricted<T>(session:WhatsAppSession,invoke:(db:Database)=>Promise<T>){return transaction(async db=>{await currentSession(db,session.sharedUserId,session.tenantId);await db.query("SELECT set_config('app.whatsapp_empresa_id',$1,true),set_config('app.whatsapp_usuario_id',$2,true),set_config('role','whatsapp_runtime',true)",[String(session.tenantId),String(session.sharedUserId)]);return invoke(db)})}
