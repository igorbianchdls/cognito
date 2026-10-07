import type { PluginPrincipal } from '../shared/contracts'
import type { PluginConfig } from '../shared/config'
import type { Proposal } from './contracts'
import { prepareDraft,getDraft } from './draftRepository'
import { proposalReferences } from './references'
import { decideDraft } from '../approvals/approvalRepository'

type DraftView = Awaited<ReturnType<typeof getDraft>>
// No chat a confirmação acontece na própria tool; o link da página do ERP não é oferecido.
function chatView({revisao_url:_url,...view}:DraftView) { return view }

export const actionDependencies = {
  prepare:async(principal:PluginPrincipal,tenantId:number,key:string,proposal:Proposal,config:PluginConfig)=>{
    const view=chatView(await prepareDraft(principal,tenantId,key,proposal,config))
    // Nomes de cliente, fornecedor e itens para o card de revisão; IDs continuam na proposta.
    const referencias=await proposalReferences(tenantId,proposal).catch(()=>null)
    return {...view,referencias}
  },
  execute:async(principal:PluginPrincipal,tenantId:number,id:string,kinds:readonly Proposal['tipo'][],tool:string,config:PluginConfig)=>{
    await decideDraft(id,{tenantId,userId:principal.userId,clerkUserId:principal.clerkUserId,oauthClientId:principal.clientId,kinds,tool},'save')
    return chatView(await getDraft(principal,tenantId,id,config))
  },
}
export type ActionDependencies = typeof actionDependencies
