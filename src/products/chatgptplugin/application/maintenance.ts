import { pluginQuery } from '../shared/database'

export async function maintainChatgptPlugin() {
  await pluginQuery("DELETE FROM plugin.rate_windows WHERE integration='chatgpt' AND window_start < now() - interval '2 days'",[])
  await pluginQuery("UPDATE plugin.executions SET status='failed',error_code='INTERRUPTED',finished_at=now() WHERE integration='chatgpt' AND status='running' AND started_at < now() - interval '10 minutes'",[])
  await pluginQuery("DELETE FROM plugin.executions WHERE integration='chatgpt' AND started_at < now() - interval '90 days'",[])
  await pluginQuery("UPDATE plugin.drafts SET status='expired',decided_at=now() WHERE integration='chatgpt' AND status='pending' AND expires_at <= now()",[])
  await pluginQuery("DELETE FROM plugin.drafts WHERE integration='chatgpt' AND created_at < now() - interval '90 days' AND status <> 'pending'",[])
  return {status:'completed',retentionDays:90}
}
