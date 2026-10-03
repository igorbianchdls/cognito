import type { ErpCapability } from '@/products/erp/shared/professionalContracts'
import type { z } from 'zod'
import { prepareSchema,draftSchema,draftsSchema,proposalCapabilities,type Proposal } from './contracts'
import type { ActionDependencies } from './draftRepository'
import type { PluginPrincipal } from '../shared/contracts'
import type { PluginConfig } from '../shared/config'

export type ActionDefinition = {name:string;title:string;description:string;schema:z.AnyZodObject;write:boolean;
  requiredCapabilities:(input:Record<string,unknown>) => ErpCapability[];
  execute:(deps:ActionDependencies,principal:PluginPrincipal,id:number,input:Record<string,unknown>,config:PluginConfig) => Promise<unknown>}
export const actionTools:ActionDefinition[] = [
  {name:'preparar_rascunho',title:'Preparar proposta',description:'Preparar criacao, edicao de cliente/produto, confirmacao ou cancelamento de venda/compra, atendimento de estoque, baixa de parcela ou estorno para revisao humana. Nao executa a operacao. Reuse chave_operacao UUID ao repetir a mesma proposta. O usuario deve abrir revisao_url para aprovar.',schema:prepareSchema,write:true,
    requiredCapabilities:input => proposalCapabilities(input.proposta as Proposal),
    execute:(d,p,id,input,c) => d.prepare(p,id,String(input.chave_operacao),input.proposta as Proposal,c)},
  {name:'obter_rascunho',title:'Consultar rascunho',description:'Consultar sua proposta e saber se foi salva, cancelada ou expirou.',schema:draftSchema,write:false,requiredCapabilities:()=>[],
    execute:(d,p,id,input,c) => d.get(p,id,String(input.rascunho_id),c)},
  {name:'listar_rascunhos',title:'Listar meus rascunhos',description:'Listar apenas seus rascunhos desta conexao e empresa, com links de revisao.',schema:draftsSchema,write:false,requiredCapabilities:()=>[],
    execute:(d,p,id,input,c) => d.list(p,id,Number(input.pagina),Number(input.por_pagina),c)},
]
