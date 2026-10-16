import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { resolveAuthTenant } from '@/products/auth/server/authTenantResolver'
import { whatsappConfiguration } from './config'
import { restricted } from './database'
import { connection,safeConnection } from './repository'
import { startOAuth,finishOAuth,chooseResources,disconnect } from './oauth'
import { sensitiveFields,saveSensitive } from './sensitiveStep'
import { WhatsAppError,type Json } from './contracts'
export async function whatsappHandler(request:Request,context:{params:Promise<{path?:string[]}>}){
 const headers={'Cache-Control':'private, no-store','Referrer-Policy':'no-referrer','X-Content-Type-Options':'nosniff'},json=(body:unknown,status=200)=>Response.json(body,{status,headers})
 try{
  const path=(await context.params).path||[],route=path.join('/'),method=request.method,url=new URL(request.url)
  if(!['GET','HEAD'].includes(method)&&(request.headers.get('sec-fetch-site')==='cross-site'||request.headers.get('origin')!==url.origin))throw new WhatsAppError('INVALID_ORIGIN','Atualize a página antes de continuar.',403)
  const session=await resolveAuthTenant({access:'read'}),identity=await auth()
  if(!session||!identity.sessionId)throw new WhatsAppError('UNAUTHENTICATED','Entre e selecione uma empresa para continuar.',401)
  if(url.searchParams.has('empresa_id')&&String(session.tenantId)!==url.searchParams.get('empresa_id'))throw new WhatsAppError('COMPANY_MISMATCH','Selecione no Cognito a empresa indicada pelo chat.',409)
  if(route==='conexao/callback'&&method==='GET'){
   if(url.searchParams.getAll('state').length!==1||url.searchParams.getAll('code').length!==1||url.searchParams.has('error'))throw new WhatsAppError('META_AUTH_FAILED','A autorização não foi concluída. Inicie uma nova conexão.',409)
   await finishOAuth(session,identity.sessionId,url.searchParams.get('state')!,url.searchParams.get('code')!)
   return new Response(null,{status:303,headers:{...headers,Location:whatsappConfiguration().base+'/whatsapp?resultado=conectado'}})
  }
  let body:Json={}
  if(method==='POST'){
   if(!/^application\/json(?:;|$)/i.test(request.headers.get('content-type')||''))throw new WhatsAppError('INVALID_BODY','Envie JSON.',415)
   const reader=request.body?.getReader();if(!reader)throw new WhatsAppError('INVALID_BODY','Informe os dados.',422);let size=0;const parts:Uint8Array[]=[];try{for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>32768){await reader.cancel();throw new WhatsAppError('INVALID_BODY','Dados muito grandes.',413)}parts.push(value)}}finally{reader.releaseLock()}
   try{body=z.record(z.unknown()).parse(JSON.parse(Buffer.concat(parts).toString('utf8')))}catch{throw new WhatsAppError('INVALID_BODY','Informe dados válidos.',422)}
  }
  if(route==='conexao'&&method==='GET'){const config=whatsappConfiguration();return json({empresa:session.tenantName,empresa_id:session.tenantId,conexao:safeConnection(await restricted(session,db=>connection(db,session))),disponivel:config.ready,motivo:config.reason})}
  if(route==='conexao/iniciar'&&method==='POST'){z.object({}).strict().parse(body);return json({url:await startOAuth(session,identity.sessionId)})}
  if(route==='conexao'&&method==='DELETE'){await disconnect(session);return json({ok:true,mensagem:'Conexão local removida. Você também pode revogar o acesso nas integrações da sua conta Meta.'})}
  if(route==='recursos'&&method==='GET')return json(await chooseResources(session,[]))
  if(route==='recursos'&&method==='POST'){const input=z.object({empresas:z.array(z.string().regex(/^\d{1,100}$/)).min(1).max(100)}).strict().parse(body);return json(await chooseResources(session,input.empresas))}
  if(path[0]==='etapas'&&path.length===2){if(method==='GET')return json(await sensitiveFields(session,path[1]));if(method==='POST')return json(await saveSensitive(session,path[1],identity.sessionId,body))}
  return json({ok:false,code:'NOT_FOUND',message:'Recurso não encontrado.'},404)
 }catch(error){const failure=error instanceof WhatsAppError?error:error instanceof z.ZodError?new WhatsAppError('INVALID_INPUT','Confira os campos informados.',422):new WhatsAppError('WHATSAPP_UNAVAILABLE','Não foi possível concluir a solicitação.',503);return json({ok:false,code:failure.code,message:failure.message},failure.status)}
}
