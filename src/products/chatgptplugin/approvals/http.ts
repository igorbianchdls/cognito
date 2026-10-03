import { z } from 'zod'
import { resolveErpSession } from '@/products/erp/server/erpAccess'
import { ErpDomainError } from '@/products/erp/shared/erpErrors'
import { getPluginConfig } from '../shared/config'
import { PluginError } from '../shared/contracts'
import { loadApproval,decideApproval } from './approvalRepository'

const idSchema=z.string().uuid()
const decisionSchema=z.object({decision:z.enum(['save','cancel'])}).strict()
async function readDecision(request:Request) {
  if (Number(request.headers.get('content-length'))>1024) throw new PluginError('REQUEST_TOO_LARGE','Decisao invalida.',413)
  const reader=request.body?.getReader()
  if (!reader) throw new PluginError('INVALID_INPUT','Decisao invalida.')
  let timer:ReturnType<typeof setTimeout>|undefined
  try {
    return await Promise.race([ (async()=>{
      const chunks:Uint8Array[]=[];let length=0
      while(true){const part=await reader.read();if(part.done)break;length+=part.value.length;if(length>1024)throw new PluginError('REQUEST_TOO_LARGE','Decisao invalida.',413);chunks.push(part.value)}
      return Buffer.concat(chunks).toString('utf8')
    })(),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new PluginError('TIMEOUT','Decisao incompleta.',408)),5000)})])
  } finally {if(timer)clearTimeout(timer);await reader.cancel().catch(()=>undefined)}
}
export const approvalDependencies={session:resolveErpSession,config:getPluginConfig,load:loadApproval,decide:decideApproval}
export function assertApprovalOrigin(request:Request,resource:string) {
  if (request.headers.get('origin') !== new URL(resource).origin) throw new PluginError('ORIGIN_DENIED','Abra a revisao no ERP para confirmar.',403)
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new PluginError('INVALID_INPUT','Envie uma decisao valida.',415)
  const site=request.headers.get('sec-fetch-site')
  if (site && site !== 'same-origin') throw new PluginError('ORIGIN_DENIED','Origem nao autorizada.',403)
}
export async function approvalRequest(request:Request,id:string,deps=approvalDependencies) {
  const headers={'Cache-Control':'no-store'}
  try {
    if (!idSchema.safeParse(id).success) throw new PluginError('NOT_FOUND','Rascunho nao disponivel.',404)
    const config=deps.config()
    if (request.method === 'POST') assertApprovalOrigin(request,config.resource)
    const session=await deps.session()
    if (!session) throw new PluginError('UNAUTHENTICATED','Entre no ERP para revisar.',401)
    if (request.method === 'GET') return Response.json(await deps.load(id,session,config.resource),{headers})
    if (request.method !== 'POST') return new Response(null,{status:405,headers})
    const body=await readDecision(request)
    let value:unknown
    try {value=JSON.parse(body)} catch {throw new PluginError('INVALID_INPUT','Decisao invalida.')}
    const parsed=decisionSchema.safeParse(value)
    if (!parsed.success) throw new PluginError('INVALID_INPUT','Decisao invalida.')
    return Response.json(await deps.decide(id,session,parsed.data.decision),{headers})
  } catch(error) {
    const failure=error instanceof PluginError ? error : error instanceof ErpDomainError
      ? new PluginError(error.code,error.message,422) : new PluginError('ERP_UNAVAILABLE','Nao foi possivel concluir a revisao.',503)
    return Response.json({error:failure.code,message:failure.message},{status:failure.status,headers})
  }
}
