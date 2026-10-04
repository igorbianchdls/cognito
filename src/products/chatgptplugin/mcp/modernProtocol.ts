import { z } from 'zod'

// SDK 1.32 handles legacy MCP. This boundary implements the stateless 2026 wire
// contract, then delegates unchanged tool/resource execution to the same SDK.
export const MODERN_VERSION='2026-07-28'
export const SUPPORTED_VERSIONS=[MODERN_VERSION,'2025-11-25','2025-06-18','2025-03-26']
export const SERVER_INFO={name:'cognito-chatgptplugin',version:'1.4.0'}
export const versionKey='io.modelcontextprotocol/protocolVersion'
export const capabilitiesKey='io.modelcontextprotocol/clientCapabilities'
const envelope=z.object({jsonrpc:z.literal('2.0'),id:z.union([z.string(),z.number().finite()]),method:z.string().min(1),params:z.record(z.unknown())}).strict()
export class ProtocolFailure extends Error {
  constructor(public code:number,message:string,public status=400,public data?:object){super(message)}
}
export function isModern(request:Request,body:unknown) {
  const item=body as {method?:string;params?:{_meta?:Record<string,unknown>}}|null
  return item?.method==='server/discover'||item?.params?._meta?.[versionKey]!==undefined||(request.headers.get('mcp-protocol-version')||'')>='2026-01-01'
}
function decoded(value:string|null):string|null {
  if(value?.startsWith('=?base64?')&&value.endsWith('?=')) {
    const encoded=value.slice(9,-2)
    if(!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded))return null
    try{return new TextDecoder('utf-8',{fatal:true}).decode(Buffer.from(encoded,'base64'))}catch{return null}
  }
  return value
}
export function validateModern(request:Request,body:unknown) {
  const result=envelope.safeParse(body)
  if(!result.success)throw new ProtocolFailure(-32600,'Requisição JSON-RPC inválida.')
  const rpc=result.data,meta=rpc.params._meta
  if(!meta||typeof meta!=='object'||Array.isArray(meta))throw new ProtocolFailure(-32602,'Metadados MCP obrigatórios.')
  const fields=meta as Record<string,unknown>,version=fields[versionKey],capabilities=fields[capabilitiesKey]
  if(typeof version!=='string'||!capabilities||typeof capabilities!=='object'||Array.isArray(capabilities))throw new ProtocolFailure(-32602,'Versão e capacidades MCP obrigatórias.')
  if(request.headers.get('mcp-protocol-version')!==version||request.headers.get('mcp-method')!==rpc.method)
    throw new ProtocolFailure(-32020,'Cabeçalhos MCP ausentes ou diferentes do corpo.')
  const name=rpc.method==='resources/read'?rpc.params.uri:['tools/call','prompts/get'].includes(rpc.method)?rpc.params.name:undefined
  if(name!==undefined&&decoded(request.headers.get('mcp-name'))!==name)throw new ProtocolFailure(-32020,'Cabeçalho Mcp-Name ausente ou diferente do corpo.')
  if(version!==MODERN_VERSION)throw new ProtocolFailure(-32022,'Versão MCP não suportada.',400,{supported:SUPPORTED_VERSIONS,requested:version})
  const accept=request.headers.get('accept')||''
  if(!accept.includes('application/json')||!accept.includes('text/event-stream'))throw new ProtocolFailure(-32600,'Accept deve incluir JSON e SSE.',406)
  return {rpc,capabilities:capabilities as Record<string,unknown>}
}
export function requireNativeFormCapability(capabilities:Record<string,unknown>) {
  const schema=z.object({extensions:z.object({'openai/elicitation':z.object({form:z.object({})})})})
  if(!schema.safeParse(capabilities).success)throw new ProtocolFailure(-32021,'O cliente precisa suportar formulários OpenAI.',400,{requiredCapabilities:{extensions:{'openai/elicitation':{form:{}}}}})
}
