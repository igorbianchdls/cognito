import { createHash } from 'node:crypto'
import { z } from 'zod'
import type { Json } from '../server/contracts'
export type RemoteContract={name:string;inputSchema:Json;description?:string}
export function canonical(value:unknown):string{if(Array.isArray(value))return '['+value.map(canonical).join(',')+']';if(value&&typeof value==='object')return '{'+Object.entries(value).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>JSON.stringify(k)+':'+canonical(v)).join(',')+'}';return JSON.stringify(value)??'null'}
export const digest=(value:unknown)=>createHash('sha256').update(canonical(value)).digest('hex')
export const sensitiveKey=(name:string)=>/^(code|verification_code|verificationCode|pin|verify_token|verifyToken|webhook_verify_token|access_token|client_secret)$/i.test(name)
export const sensitiveField=(name:string,parent='')=>sensitiveKey(name)&&!(name==='code'&&parent==='language')
export function publicContract(raw:Json){const properties=(raw.properties||{}) as Record<string,Json>,secretKeys=Object.keys(properties).filter(sensitiveKey);const publicProperties=Object.fromEntries(Object.entries(properties).filter(([k])=>!secretKeys.includes(k)));return {secretKeys,schema:contractSchema({...raw,properties:publicProperties,required:((raw.required||[]) as string[]).filter(k=>!secretKeys.includes(k)),additionalProperties:false})}}
/** Unsupported schema vocabulary disables the adapter instead of weakening its contract. */
export function contractSchema(raw:Json,root=raw,depth=0):z.ZodTypeAny {
 if(depth>12)throw Error('CONTRACT_DEPTH')
 if(raw.$ref){if(Object.keys(raw).some(k=>!['$ref','$schema','$id','$defs','definitions','description','title'].includes(k)))throw Error('REF_SIBLINGS_UNSUPPORTED');const ref=String(raw.$ref);if(!ref.startsWith('#/'))throw Error('EXTERNAL_REF');let value:unknown=root;for(const part of ref.slice(2).split('/'))value=(value as Json)?.[part.replace(/~1/g,'/').replace(/~0/g,'~')];if(!value||typeof value!=='object')throw Error('INVALID_REF');return contractSchema(value as Json,root,depth+1)}
 const supported=new Set(['$schema','$id','$defs','definitions','type','title','description','properties','required','additionalProperties','items','minItems','maxItems','uniqueItems','minLength','maxLength','pattern','format','minimum','maximum','exclusiveMinimum','exclusiveMaximum','enum','const','anyOf','default','examples','deprecated','readOnly','writeOnly'])
 if(Object.keys(raw).some(k=>!supported.has(k)))throw Error('UNSUPPORTED_CONTRACT')
 let schema:z.ZodTypeAny
 if(Array.isArray(raw.enum)&&raw.enum.length){const values=raw.enum.map(v=>z.literal(v as string|number|boolean|null));schema=values.length===1?values[0]:z.union([values[0],values[1],...values.slice(2)])}
 else if('const' in raw)schema=z.literal(raw.const as string|number|boolean|null)
 else if(Array.isArray(raw.anyOf)){const branches=raw.anyOf.map(v=>contractSchema(v as Json,root,depth+1));if(branches.length<2)throw Error('INVALID_UNION');schema=z.union(branches as [z.ZodTypeAny,z.ZodTypeAny,...z.ZodTypeAny[]])}
 else if(Array.isArray(raw.type)){const branches=raw.type.map(t=>contractSchema({...raw,type:t},root,depth+1));if(branches.length<2)throw Error('INVALID_UNION');schema=z.union(branches as [z.ZodTypeAny,z.ZodTypeAny,...z.ZodTypeAny[]])}
 else switch(raw.type){
  case 'object':{
   const required=new Set((raw.required||[]) as string[]),properties=(raw.properties||{}) as Record<string,Json>,shape:Record<string,z.ZodTypeAny>={}
   for(const [key,value] of Object.entries(properties)){let field=contractSchema(value,root,depth+1);if(required.has(key))field=field.refine(v=>v!==undefined,'Campo obrigatório.');else field=field.optional();shape[key]=field.describe(typeof value.description==='string'?value.description.slice(0,1500):key)}
   if([...required].some(k=>!(k in properties)))throw Error('UNDECLARED_REQUIRED')
   const obj=z.object(shape);schema=raw.additionalProperties===false?obj.strict():raw.additionalProperties&&typeof raw.additionalProperties==='object'?obj.catchall(contractSchema(raw.additionalProperties as Json,root,depth+1)):obj.passthrough();break
  }
  case 'array':{if(!raw.items||typeof raw.items!=='object')throw Error('INVALID_ITEMS');let a=z.array(contractSchema(raw.items as Json,root,depth+1));if(typeof raw.minItems==='number')a=a.min(raw.minItems);if(typeof raw.maxItems==='number')a=a.max(Math.min(raw.maxItems,1000));schema=raw.uniqueItems?a.refine(a=>new Set(a.map(canonical)).size===a.length,'Itens repetidos.'):a;break}
  case 'string':{let s=z.string();if(typeof raw.minLength==='number')s=s.min(raw.minLength);s=s.max(typeof raw.maxLength==='number'?Math.min(raw.maxLength,24000):24000);if(typeof raw.pattern==='string'){if(raw.pattern.length>500)throw Error('PATTERN_TOO_LARGE');s=s.regex(new RegExp(raw.pattern))}if(raw.format==='email')s=s.email();else if(raw.format==='uri')s=s.url();else if(raw.format==='uuid')s=s.uuid();else if(raw.format==='date-time')s=s.datetime({offset:true});else if(raw.format)throw Error('UNSUPPORTED_FORMAT');schema=s;break}
  case 'integer':case 'number':{let n=z.number().finite();if(raw.type==='integer')n=n.int();if(typeof raw.minimum==='number')n=n.min(raw.minimum);if(typeof raw.maximum==='number')n=n.max(raw.maximum);if(typeof raw.exclusiveMinimum==='number')n=n.gt(raw.exclusiveMinimum);if(typeof raw.exclusiveMaximum==='number')n=n.lt(raw.exclusiveMaximum);schema=n;break}
  case 'boolean':schema=z.boolean();break
  case 'null':schema=z.null();break
  case undefined:if(Object.keys(raw).some(k=>!['description','title','default','examples'].includes(k)))throw Error('MISSING_TYPE');schema=z.unknown();break
  default:throw Error('UNSUPPORTED_TYPE')
 }
 return schema
}
