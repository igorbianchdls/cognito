import { WhatsAppError } from './contracts'
export function whatsappConfiguration(){
 const enabled=process.env.WHATSAPP_MCP_ENABLED==='true'
 const clientId=process.env.WHATSAPP_MCP_CLIENT_ID||''
 const origin=process.env.WHATSAPP_BASE_URL||process.env.CHATGPTPLUGIN_BASE_URL||''
 let base:URL|undefined
 try{base=new URL(origin)}catch{}
 const validOrigin=!!base&&base.protocol==='https:'&&!base.username&&!base.password&&!base.search&&!base.hash&&base.pathname==='/'
 const keysReady=!!process.env.WHATSAPP_CREDENTIAL_KEYS&&!!process.env.WHATSAPP_CREDENTIAL_KEY_ID
 return {enabled,clientId,base:validOrigin?base!.origin:'',ready:enabled&&!!clientId&&validOrigin&&keysReady,
  reason:!enabled?'A conexão com o MCP da Meta ainda não foi habilitada para o Cognito.':!clientId?'É necessário um identificador de cliente aceito pela Meta.':!validOrigin?'Configure o endereço HTTPS do Cognito.':!keysReady?'Configure a proteção das credenciais.':null}
}
export function requireConfiguration(){const c=whatsappConfiguration();if(!c.ready)throw new WhatsAppError('META_CONNECTION_UNAVAILABLE',c.reason||'Conexão indisponível.',503);return c}
