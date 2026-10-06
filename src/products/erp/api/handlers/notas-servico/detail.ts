import {NextResponse} from 'next/server'
import {withErpHttp} from '../../http/handler'
import {resolveErpApiAccess} from '../../http/access'
import {parseErpBody,erpFailure} from '../../http/responses'
import {serviceInvoiceEditSchema} from '../../../shared/serviceInvoiceContracts'
import {editServiceInvoice,getServiceInvoice} from '../../../server/fiscal/serviceInvoiceRepository'

type RouteContext={params:Promise<{id:string;operation?:string}>}
const access=async(manage=false)=>resolveErpApiAccess(manage?'erp.vendas.gerenciar':'erp.vendas.visualizar')
export const GET=withErpHttp(async(_request:Request,route:RouteContext)=>{
 const ctx=await access();if(!ctx)return erpFailure('Acesso negado.',403)
 return NextResponse.json(await getServiceInvoice(ctx.tenantId,Number((await route.params).id)))
},{"operation":"GET /api/erp/notas-servico/[id]","authentication":"session","maxBodyBytes":65536})
export const PATCH=withErpHttp(async(request:Request,route:RouteContext)=>{
 const ctx=await access(true);if(!ctx)return erpFailure('Acesso negado.',403)
 const body=await parseErpBody(request,serviceInvoiceEditSchema)
 return NextResponse.json(await editServiceInvoice(ctx.tenantId,ctx.sharedUserId,Number((await route.params).id),body.dados,body.chave_operacao,body.versao))
},{"operation":"PATCH /api/erp/notas-servico/[id]","authentication":"session","maxBodyBytes":65536})
