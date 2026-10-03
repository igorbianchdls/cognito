import { config } from 'dotenv'
import { getPluginConfig } from '../src/products/chatgptplugin/shared/config'
import { closePluginDatabase, pluginQuery } from '../src/products/chatgptplugin/shared/database'
config({path:'.env.local',quiet:true})
async function main() {
  const missing = ['CHATGPTPLUGIN_BASE_URL','CHATGPTPLUGIN_OAUTH_ISSUER','CHATGPTPLUGIN_OAUTH_CLIENT_IDS',
    'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY','CLERK_SECRET_KEY','SUPABASE_DB_URL'].filter(key => !process.env[key])
  if (missing.length) { console.log(JSON.stringify({ ready:false,missing })); process.exitCode=1; return }
  const settings = getPluginConfig()
  const metadata = await fetch(`${settings.issuer}/.well-known/oauth-authorization-server`,{ signal:AbortSignal.timeout(10000) })
  if (!metadata.ok) throw new Error('OAuth metadata unavailable')
  const oauth = await metadata.json()
  const validOAuth = oauth.issuer === settings.issuer && oauth.code_challenge_methods_supported?.includes('S256')
    && oauth.scopes_supported?.includes(settings.scope) && oauth.authorization_endpoint && oauth.token_endpoint
  const database = await pluginQuery<{ executions: boolean; limits: boolean; drafts:boolean;settings:boolean;operations:boolean }>(
    `SELECT to_regclass('shared.chatgptplugin_executions') IS NOT NULL AS executions,
      to_regclass('shared.chatgptplugin_rate_windows') IS NOT NULL AS limits,
      to_regclass('shared.chatgptplugin_drafts') IS NOT NULL AS drafts,
      to_regclass('shared.chatgptplugin_settings') IS NOT NULL AS settings,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='shared' AND table_name='chatgptplugin_drafts' AND column_name='target_snapshot') AS operations`,[])
  const databaseReady=Boolean(database[0]?.executions && database[0]?.limits && database[0]?.drafts && database[0]?.settings && database[0]?.operations)
  const writeScopeReady=Boolean(oauth.scopes_supported?.includes('erp:write'))
  const ready = Boolean(validOAuth && databaseReady && writeScopeReady)
  console.log(JSON.stringify({ready,oauthReady:Boolean(validOAuth),databaseReady,writeScopeReady,readReady:Boolean(validOAuth && databaseReady)}))
  if (!ready) process.exitCode=1
}
void main().catch(() => {console.error('Verificacao indisponivel. Revise OAuth e conexao do banco.');process.exitCode=1})
  .finally(closePluginDatabase)
