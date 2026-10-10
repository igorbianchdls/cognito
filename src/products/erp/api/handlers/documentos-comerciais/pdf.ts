import {z} from 'zod'
import {withErpHttp} from '../../http/handler'
import {resolveErpApiAccess} from '../../http/access'
import {parseErpBody} from '../../http/responses'
import {commercialDocumentPdf,archiveCommercialDocument} from '../../../server/documents/commercialDocumentRepository'
type Context={params:Promise<{tipo:string;id:string}>}
const kind=z.enum(['orcamento','ordem_servico'])
const revision=z.coerce.number().int().positive().safe()
export const commercialPdfHeaders={'Content-Type':'application/pdf','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','X-Robots-Tag':'noindex, nofollow','Referrer-Policy':'no-referrer'}
export const GET=withErpHttp(async(request:Request,context:Context)=>{
 const access=await resolveErpApiAccess('erp.vendas.visualizar');if(!access)return new Response(null,{status:403});const params=await context.params,url=new URL(request.url);
 const file=await commercialDocumentPdf(access.tenantId,kind.parse(params.tipo),revision.parse(params.id),{revision:url.searchParams.has('revisao')?revision.parse(url.searchParams.get('revisao')):undefined});
 return new Response(new Uint8Array(file.bytes),{headers:{...commercialPdfHeaders,'Content-Disposition':`inline; filename="${file.name}"`,'X-PDF-Archived':String(file.archived)}})
},{operation:'GET /api/erp/documentos-comerciais/[tipo]/[id]/pdf'})
export const POST=withErpHttp(async(request:Request,context:Context)=>{
 const access=await resolveErpApiAccess('erp.vendas.gerenciar');if(!access)return new Response(null,{status:403});const params=await context.params;
 const body=await parseErpBody(request,z.object({expectedVersion:revision}).strict()),tipo=kind.parse(params.tipo),id=revision.parse(params.id);
 const result=await archiveCommercialDocument(access.tenantId,access.sharedUserId,tipo,id,body.expectedVersion);
 return Response.json({...result,pdf_path:`/api/erp/documentos-comerciais/${tipo}/${id}/pdf?revisao=${result.revision}`});
},{operation:'POST /api/erp/documentos-comerciais/[tipo]/[id]/pdf'})
