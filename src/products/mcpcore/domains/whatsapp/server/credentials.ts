import { createCipheriv,createDecipheriv,randomBytes } from 'node:crypto'
import { WhatsAppError } from './contracts'
function keys(){
 try {const value=JSON.parse(process.env.WHATSAPP_CREDENTIAL_KEYS||'{}') as Record<string,string>;return Object.fromEntries(Object.entries(value).map(([id,k])=>{const b=Buffer.from(k,'base64');if(!/^[\w-]{1,40}$/.test(id)||b.length!==32)throw Error();return [id,b]}))}
 catch{throw new WhatsAppError('CREDENTIAL_CONFIGURATION','Configure a proteção das credenciais.',503)}
}
export function seal(value:unknown,context:string){const id=process.env.WHATSAPP_CREDENTIAL_KEY_ID||'',key=keys()[id];if(!key)throw new WhatsAppError('CREDENTIAL_CONFIGURATION','Configure a proteção das credenciais.',503);const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',key,iv);cipher.setAAD(Buffer.from(context));const data=Buffer.concat([cipher.update(JSON.stringify(value),'utf8'),cipher.final()]);return [id,iv.toString('base64url'),cipher.getAuthTag().toString('base64url'),data.toString('base64url')].join('.')}
export function unseal<T>(value:string,context:string):T {try{const [id,iv,tag,data,...rest]=value.split('.');if(rest.length)throw Error();const key=keys()[id];if(!key)throw Error();const cipher=createDecipheriv('aes-256-gcm',key,Buffer.from(iv,'base64url'));cipher.setAAD(Buffer.from(context));cipher.setAuthTag(Buffer.from(tag,'base64url'));return JSON.parse(Buffer.concat([cipher.update(Buffer.from(data,'base64url')),cipher.final()]).toString('utf8'))}catch{throw new WhatsAppError('CREDENTIAL_UNAVAILABLE','Reconecte sua conta Meta.',503)}}
