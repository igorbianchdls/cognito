import { z } from 'zod'
import { proposalSchema,type Proposal } from '../actions/contracts'
import { operationLabels } from '../actions/expandedContracts'
export { fieldLabels } from './fieldLabels'
import { fieldLabels } from './fieldLabels'
export function baseSchema(schema:z.ZodTypeAny):z.ZodTypeAny {
  if(schema instanceof z.ZodEffects)return baseSchema(schema.innerType())
  if(schema instanceof z.ZodOptional||schema instanceof z.ZodNullable)return baseSchema(schema.unwrap())
  if(schema instanceof z.ZodDefault)return baseSchema(schema.removeDefault())
  return schema
}
export function proposalFields(tipo:Proposal['tipo']) {
  const definition=proposalSchema.optionsMap.get(tipo)!
  return (baseSchema(definition.shape.dados) as z.AnyZodObject).shape as Record<string,z.ZodTypeAny>
}
export function browserProposalFields(){
  return Object.fromEntries(proposalSchema.options.map(def=>{
    const tipo=def.shape.tipo.value as Proposal['tipo'],shape=proposalFields(tipo)
    return [tipo,{title:operationLabels[tipo]||tipo,fields:Object.fromEntries(Object.entries(shape).map(([key,s])=>{
      const base=baseSchema(s),json=base instanceof z.ZodArray||base instanceof z.ZodObject
      return [key,{label:fieldLabels[key]||key.replaceAll('_',' '),json,boolean:base instanceof z.ZodBoolean,number:base instanceof z.ZodNumber,date:key.startsWith('data_'),choices:base instanceof z.ZodEnum?base.options:base instanceof z.ZodBoolean?['false','true']:undefined,required:!s.isOptional()}]
    }))}]
  }))
}
