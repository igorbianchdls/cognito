import {NextResponse} from 'next/server'
import {z} from 'zod'
import {withErpHttp} from '../../http/handler'
import {resolveErpApiAccess} from '../../http/access'
import {parseErpBody,erpFailure} from '../../http/responses'
import {serviceInvoiceCreateSchema} from '../../../shared/serviceInvoiceContracts'
import {erpDateSchema} from '../../../shared/erpTransport'
import {createServiceInvoice,listServiceInvoices} from '../../../server/fiscal/serviceInvoiceRepository'

const access=async(manage=false)=>resolveErpApiAccess(manage?'erp.vendas.gerenciar':'erp.vendas.visualizar')
export const GET=withErpHttp(async(request:Request)=>{
 const ctx=await access();if(!ctx)return erpFailure('Acesso negado.',403)
 const p=new URL(request.url).searchParams
 const input=z.object({busca:z.string().max(200).optional(),status:z.enum(['rascunho','aguardando_retorno','emitida','cancelada','falha']).optional(),inicio:erpDateSchema.optional(),fim:erpDateSchema.optional(),pagina:z.coerce.number().int().min(1).max(10000),por_pagina:z.coerce.number().int().min(1).max(50)}).parse({busca:p.get('busca')||undefined,status:p.get('status')||undefined,inicio:p.get('inicio')||undefined,fim:p.get('fim')||undefined,pagina:p.get('pagina')||1,por_pagina:p.get('por_pagina')||20})
 return NextResponse.json(await listServiceInvoices(ctx.tenantId,input))
},{"operation":"GET /api/erp/notas-servico","authentication":"session","maxBodyBytes":65536})
export const POST=withErpHttp(async(request:Request)=>{
 const ctx=await access(true);if(!ctx)return erpFailure('Acesso negado.',403)
 const body=await parseErpBody(request,serviceInvoiceCreateSchema)
 const result=await createServiceInvoice(ctx.tenantId,ctx.sharedUserId,body.dados,body.chave_operacao)
 return NextResponse.json(result,{status:result.reused?200:201})
},{"operation":"POST /api/erp/notas-servico","authentication":"session","maxBodyBytes":65536})
