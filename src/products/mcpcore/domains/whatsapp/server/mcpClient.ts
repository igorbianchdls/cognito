import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { REMOTE,WhatsAppError,type Json } from './contracts'
import { mappings } from '../tools/catalog'
import type { RemoteContract } from '../schemas/upstreamContracts'
export type Tokens={access_token:string;refresh_token?:string;expires_at?:number;scope?:string;token_type?:string}
export type RemoteGateway={contracts:()=>Promise<RemoteContract[]>;call:(name:string,args:Json)=>Promise<Json>;close:()=>Promise<void>}
export async function openRemote(tokens:Tokens):Promise<RemoteGateway>{
 const transport=new StreamableHTTPClientTransport(new URL(REMOTE),{requestInit:{headers:{Authorization:'Bearer '+tokens.access_token}},reconnectionOptions:{maxRetries:0,initialReconnectionDelay:1000,maxReconnectionDelay:1000,reconnectionDelayGrowFactor:1},fetch:async(url,init)=>fetch(url,{...init,signal:AbortSignal.timeout(12000),redirect:'error'})})
 const client=new Client({name:'Cognito',version:'0.1.0'},{capabilities:{}})
 try{await client.connect(transport,{timeout:12000})}catch{await transport.close().catch(()=>{});throw new WhatsAppError('META_CONNECTION_FAILED','Não foi possível autenticar e iniciar o MCP da Meta. Reconecte sua conta.',503)}
 return {
  contracts:async()=>{const all:RemoteContract[]=[];let cursor:string|undefined;for(let page=0;page<5;page++){const r=await client.listTools(cursor?{cursor}:{},{timeout:12000});for(const t of r.tools)if(mappings.some(([,name])=>t.name==='whatsapp_biz_'+name))all.push({name:t.name,inputSchema:t.inputSchema as Json,description:t.description});cursor=r.nextCursor;if(!cursor)return all}throw new WhatsAppError('META_CONTRACT_UNAVAILABLE','O catálogo da Meta excedeu o limite de consulta.',503)},
  call:async(name,args)=>{const result=await client.callTool({name,arguments:args},undefined,{timeout:12000});if(Buffer.byteLength(JSON.stringify(result))>128*1024)throw new WhatsAppError('META_RESULT_TOO_LARGE','O resultado excedeu o limite. Reduza a consulta.',413);return result as Json},
  close:()=>client.close()
 }
}
