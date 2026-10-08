import {NextResponse} from 'next/server'
import {withErpHttp} from '../../http/handler'
import {resolveErpApiAccess} from '../../http/access'
import {parseErpBody} from '../../http/responses'
import {fiscalSettingsSchema,getFiscalSettings,saveFiscalSettings} from '../../../server/fiscal/fiscalSettings'

// Dados fiscais da empresa usados como prestador no DPS da NFS-e.
export const GET=withErpHttp(async()=>{
 const ctx=await resolveErpApiAccess('erp.vendas.visualizar')
 return NextResponse.json(await getFiscalSettings(ctx.tenantId))
},{operation:'GET /api/erp/notas-servico/configuracao',authentication:'session'})
export const PUT=withErpHttp(async(request:Request)=>{
 const ctx=await resolveErpApiAccess('erp.configuracoes.gerenciar')
 const body=await parseErpBody(request,fiscalSettingsSchema)
 return NextResponse.json(await saveFiscalSettings(ctx.tenantId,ctx.sharedUserId,body))
},{operation:'PUT /api/erp/notas-servico/configuracao',authentication:'session',maxBodyBytes:16384})
