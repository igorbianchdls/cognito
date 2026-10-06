import {NextResponse} from 'next/server'
import {z} from 'zod'
import {withErpHttp} from '../../http/handler'
import {resolveErpApiAccess} from '../../http/access'
import {parseErpBody,erpFailure} from '../../http/responses'
import {serviceInvoiceActionSchema,simulationScenarioSchema} from '../../../shared/serviceInvoiceContracts'
import {actOnServiceInvoice,validateServiceInvoice,getServiceInvoicePdf} from '../../../server/fiscal/serviceInvoiceRepository'

type RouteContext={params:Promise<{id:string;operation?:string}>}
const access=async(manage=false)=>resolveErpApiAccess(manage?'erp.vendas.gerenciar':'erp.vendas.visualizar')
export const GET=withErpHttp(async(request:Request,route:RouteContext)=>{
 const ctx=await access();if(!ctx)return erpFailure('Acesso negado.',403)
 const {id,operation}=await route.params
 if(operation==='validar')return NextResponse.json(await validateServiceInvoice(ctx.tenantId,Number(id)))
 if(operation==='pdf'){
  const requested=new URL(request.url).searchParams.get('versao'),version=requested?z.coerce.number().int().positive().parse(requested):undefined
  const file=await getServiceInvoicePdf(ctx.tenantId,Number(id),version)
  return new Response(new Uint8Array(file.bytes),{headers:{'Content-Type':'application/pdf','Content-Disposition':`inline; filename="${file.name}"`,'X-Content-Type-Options':'nosniff','X-Fiscal-Mode':'simulacao'}})
 }
 return erpFailure('Operação não encontrada.',404)
},{"operation":"GET /api/erp/notas-servico/[id]/[operation]","authentication":"session","maxBodyBytes":65536})
export const POST=withErpHttp(async(request:Request,route:RouteContext)=>{
 const ctx=await access(true);if(!ctx)return erpFailure('Acesso negado.',403)
 const {id,operation}=await route.params
 const action={simular:'emitir',consultar:'consultar',cancelar:'cancelar',excluir:'excluir'}[operation||'']
 if(!action)return erpFailure('Operação não encontrada.',404)
 const body=await parseErpBody(request,z.object({chave_operacao:serviceInvoiceActionSchema.shape.chave_operacao,versao:serviceInvoiceActionSchema.shape.versao,cenario:simulationScenarioSchema.optional(),motivo:serviceInvoiceActionSchema.shape.motivo}).strict())
 return NextResponse.json(await actOnServiceInvoice(ctx.tenantId,ctx.sharedUserId,Number(id),{...body,acao:action as 'emitir'}))
},{"operation":"POST /api/erp/notas-servico/[id]/[operation]","authentication":"session","maxBodyBytes":65536})
