import {createHmac,timingSafeEqual} from 'node:crypto'
import {ErpDomainError} from '../../shared/erpErrors'
import type {CommercialDocumentKind} from './commercialPdf'
export const COMMERCIAL_LINK_PATH='/api/public/documentos-comerciais/'
export const COMMERCIAL_LINK_TTL_SECONDS=900
type Link={empresa:number;usuario:number;tipo:CommercialDocumentKind;registro:number;versao:number;revisao?:number;exp:number}
const signature=(payload:string)=>{const key=process.env.CLERK_SECRET_KEY?.trim();if(!key)throw new ErpDomainError('UNAVAILABLE','Links temporários indisponíveis.',503);return createHmac('sha256',createHmac('sha256',key).update('cognito:commercial-pdf:v1').digest()).update(payload).digest('base64url')}
export function createCommercialLink(link:Omit<Link,'exp'>,now=Date.now()){const exp=Math.floor(now/1000)+COMMERCIAL_LINK_TTL_SECONDS,payload=Buffer.from(JSON.stringify({...link,exp})).toString('base64url');return {token:payload+'.'+signature(payload),expiresAt:new Date(exp*1000).toISOString()}}
export function verifyCommercialLink(token:string,now=Date.now()):Link{
 const invalid=new ErpDomainError('NOT_FOUND','Link inválido ou expirado. Solicite um novo PDF.',404);const [payload,sig,extra]=token.split('.');if(!payload||!sig||extra!==undefined||token.length>1800||!/^[A-Za-z0-9_.-]+$/.test(token))throw invalid;
 const a=Buffer.from(signature(payload)),b=Buffer.from(sig);if(a.length!==b.length||!timingSafeEqual(a,b))throw invalid;let link:Link;try{link=JSON.parse(Buffer.from(payload,'base64url').toString())}catch{throw invalid}
 if(![link.empresa,link.usuario,link.registro,link.versao,link.exp].every(v=>Number.isSafeInteger(v)&&v>0)||!['orcamento','ordem_servico'].includes(link.tipo)||(link.revisao!==undefined&&(!Number.isSafeInteger(link.revisao)||link.revisao<1))||link.exp*1000<=now)throw invalid;return link;
}
