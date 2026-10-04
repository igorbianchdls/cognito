import { z } from 'zod'
import { pluginQuery } from '../shared/database'
import { PluginError,type PluginPrincipal } from '../shared/contracts'

export const preferencesSchema=z.object({empresa_preferida:z.string().regex(/^$|^[1-9]\d*$/).max(16),por_pagina:z.number().int().min(10).max(50)}).strict()
export type Preferences=z.infer<typeof preferencesSchema>
const defaults:Preferences={empresa_preferida:'',por_pagina:20}
export async function readPreferences(principal:PluginPrincipal):Promise<Preferences> {
  const rows=await pluginQuery<{values:Preferences}>("SELECT values FROM plugin.settings WHERE user_id=$1 AND oauth_client_id=$2 AND integration='chatgpt'",[principal.userId,principal.clientId])
  const values=preferencesSchema.parse({...defaults,...rows[0]?.values})
  if(values.empresa_preferida&&!principal.companies.some(c=>String(c.id)===values.empresa_preferida))values.empresa_preferida=''
  return values
}
export async function updatePreferences(principal:PluginPrincipal,input:unknown):Promise<Preferences> {
  const patch=preferencesSchema.partial().refine(v=>Object.keys(v).length>0).parse(input)
  if(patch.empresa_preferida&&!principal.companies.some(c=>String(c.id)===patch.empresa_preferida))throw new PluginError('ACCESS_DENIED','Empresa nao autorizada.',403)
  await pluginQuery(`INSERT INTO plugin.settings(user_id,oauth_client_id,values,integration) VALUES($1,$2,$3::jsonb,'chatgpt')
    ON CONFLICT(integration,user_id,oauth_client_id) DO UPDATE SET values=plugin.settings.values||EXCLUDED.values,updated_at=now()`,
    [principal.userId,principal.clientId,JSON.stringify(patch)])
  return readPreferences(principal)
}
export const preferencesDependencies={read:readPreferences,update:updatePreferences}
