import { pluginQuery } from '../shared/database'
import type { PluginIntegration } from '../shared/config'

export async function maintainPluginStorage(integration: PluginIntegration) {
  await pluginQuery("DELETE FROM plugin.rate_windows WHERE integration=$1 AND window_start < now() - interval '2 days'",[integration])
  await pluginQuery("UPDATE plugin.executions SET status='failed',error_code='INTERRUPTED',finished_at=now() WHERE integration=$1 AND status='running' AND started_at < now() - interval '10 minutes'",[integration])
  await pluginQuery("DELETE FROM plugin.executions WHERE integration=$1 AND started_at < now() - interval '90 days'",[integration])
  await pluginQuery("UPDATE plugin.drafts SET status='expired',decided_at=now() WHERE integration=$1 AND status='pending' AND expires_at <= now()",[integration])
  await pluginQuery("DELETE FROM plugin.drafts WHERE integration=$1 AND created_at < now() - interval '90 days' AND status <> 'pending'",[integration])
  return {status:'completed',retentionDays:90}
}
