import { config } from 'dotenv'
import { pluginQuery, closePluginDatabase } from '../src/products/chatgptplugin/shared/database'
config({path:'.env.local',quiet:true})
async function main() {
  try {
    await pluginQuery("DELETE FROM shared.chatgptplugin_rate_windows WHERE window_start < now() - interval '2 days'",[])
    await pluginQuery("UPDATE shared.chatgptplugin_executions SET status='failed',error_code='INTERRUPTED',finished_at=now() WHERE status='running' AND started_at < now() - interval '10 minutes'",[])
    await pluginQuery("DELETE FROM shared.chatgptplugin_executions WHERE started_at < now() - interval '90 days'",[])
    await pluginQuery("UPDATE shared.chatgptplugin_drafts SET status='expired',decided_at=now() WHERE status='pending' AND expires_at <= now()",[])
    await pluginQuery("DELETE FROM shared.chatgptplugin_drafts WHERE created_at < now() - interval '90 days' AND status <> 'pending'",[])
    console.log('Manutencao do ChatGPT Plugin concluida.')
  } finally { await closePluginDatabase() }
}
void main().catch(() => { console.error('Nao foi possivel concluir a manutencao.'); process.exitCode=1 })
