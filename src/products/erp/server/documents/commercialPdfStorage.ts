import {createHash} from 'node:crypto'
import {ErpDomainError} from '../../shared/erpErrors'
import {fiscalStorageConfiguration} from '../fiscal/fiscalPdfStorage'
import type {CommercialDocumentKind} from './commercialPdf'
export const COMMERCIAL_PDF_BUCKET='erp-comercial'
const MAX=2*1024*1024
export type CommercialFile={company:number;kind:CommercialDocumentKind;id:number;revision:number;layout:number;path:string;size:number;hash:string}
export function commercialPdfPath(company:number,kind:CommercialDocumentKind,id:number,revision:number,layout:number,hash:string){
 if(![company,id,revision,layout].every(v=>Number.isSafeInteger(v)&&v>0)||!['orcamento','ordem_servico'].includes(kind)||!/^[a-f0-9]{64}$/.test(hash))throw new ErpDomainError('VALIDATION_ERROR','Referência do PDF comercial inválida.',422)
 return `${company}/${kind}/${id}/r${revision}/layout-${layout}/${hash}.pdf`
}
export function commercialStorageConfiguration(configuration:Parameters<typeof fiscalStorageConfiguration>[0]={}){
 return fiscalStorageConfiguration({...configuration,base:configuration.base??process.env.ERP_DOCUMENTS_SUPABASE_URL??process.env.ERP_FISCAL_SUPABASE_URL,key:configuration.key??process.env.ERP_DOCUMENTS_SUPABASE_SERVICE_ROLE_KEY??process.env.ERP_FISCAL_SUPABASE_SERVICE_ROLE_KEY})
}
function target(file:CommercialFile){
 if(file.path!==commercialPdfPath(file.company,file.kind,file.id,file.revision,file.layout,file.hash)||!Number.isSafeInteger(file.size)||file.size<100||file.size>MAX)throw new ErpDomainError('FILE_UNAVAILABLE','Metadados do PDF comercial inválidos.',422)
 try {const config=commercialStorageConfiguration();return {...config,path:[COMMERCIAL_PDF_BUCKET,...file.path.split('/')].map(encodeURIComponent).join('/')}}
 catch{throw new ErpDomainError('STORAGE_UNAVAILABLE','Configure o Storage privado do projeto do ERP para arquivar documentos comerciais. O PDF atual pode ser baixado sem arquivamento.',503)}
}
export async function readCommercialPdf(file:CommercialFile){const config=target(file);
 try {const response=await config.send(`${config.origin}/storage/v1/object/authenticated/${config.path}`,{headers:{apikey:config.key,Authorization:`Bearer ${config.key}`},cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)});
  if(!response.ok||!response.body)throw new Error();if(Number(response.headers.get('content-length'))>MAX){await response.body.cancel();throw new Error()}
  const reader=response.body.getReader(),parts:Uint8Array[]=[];let size=0;try{for(;;){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>MAX){await reader.cancel();throw new Error()}parts.push(part.value)}}finally{reader.releaseLock()}
  const bytes=Buffer.concat(parts);if(size!==file.size||createHash('sha256').update(bytes).digest('hex')!==file.hash||bytes.subarray(0,5).toString()!=='%PDF-')throw new Error();return bytes;
 }catch{throw new ErpDomainError('FILE_UNAVAILABLE','Não foi possível conferir ou baixar este PDF comercial.',503)}
}
export async function uploadCommercialPdf(file:CommercialFile,bytes:Buffer){const config=target(file);
 if(bytes.length!==file.size||createHash('sha256').update(bytes).digest('hex')!==file.hash||bytes.subarray(0,5).toString()!=='%PDF-')throw new ErpDomainError('VALIDATION_ERROR','Conteúdo do PDF inválido.',422)
 try{await config.send(`${config.origin}/storage/v1/object/${config.path}`,{method:'POST',headers:{apikey:config.key,Authorization:`Bearer ${config.key}`,'Content-Type':'application/pdf','x-upsert':'false'},body:new Uint8Array(bytes),cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)})}catch{/* A resposta perdida é resolvida conferindo o objeto antes de registrar metadados. */}
 await readCommercialPdf(file);
}
