import {runWithErpDatabaseContext} from '@/lib/erpDatabaseContext'
import {withErpHttp} from '../../http/handler'
import {verifyCommercialLink} from '../../../server/documents/commercialDocumentLinks'
import {commercialDocumentPdf} from '../../../server/documents/commercialDocumentRepository'
import {commercialPdfHeaders} from './pdf'
export const GET=withErpHttp(async(_request:Request,context:{params:Promise<{token:string}>})=>{
 const link=verifyCommercialLink((await context.params).token);
 return runWithErpDatabaseContext({tenantId:link.empresa,userId:link.usuario,readOnly:true,statementTimeoutMs:10000},async()=>{
  const file=await commercialDocumentPdf(link.empresa,link.tipo,link.registro,{revision:link.revisao,expectedVersion:link.versao});
  return new Response(new Uint8Array(file.bytes),{headers:{...commercialPdfHeaders,'Content-Disposition':`inline; filename="${file.name}"`,'X-PDF-Archived':String(file.archived)}});
 });
},{operation:'GET /api/public/documentos-comerciais/[token]',authentication:'none'})
