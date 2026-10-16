import { PluginError } from '../../../shared/contracts'
export { PluginError as WhatsAppError }
export type WhatsAppSession={tenantId:number;sharedUserId:number;role:'owner'|'admin'|'member'|'viewer'}
export type Json=Record<string,unknown>
export const REMOTE='https://mcp.facebook.com/whatsapp_business_tools'
export const ISSUER='https://www.facebook.com/whatsapp_business_tools'
export const SCOPES=['business_management','whatsapp_business_management','whatsapp_business_messaging']
export function assertWrite(session:WhatsAppSession){if(session.role==='viewer')throw new PluginError('READ_ONLY','Seu acesso permite somente consultas.',403)}
