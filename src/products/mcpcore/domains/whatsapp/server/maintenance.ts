import { pluginQuery } from '../../../shared/database'
import type { PluginIntegration } from '../../../shared/config'
export async function maintainWhatsAppStorage(integration:PluginIntegration){
 await pluginQuery("DELETE FROM whatsapp.sessoes_autorizacao WHERE expira_em<=now() OR consumido_em IS NOT NULL",[])
 await pluginQuery("UPDATE whatsapp.execucoes_remotas SET estado='indeterminada',erro='WORKER_INTERRUPTED',finalizado_em=now() WHERE integration=$1 AND estado='em_execucao' AND iniciado_em<now()-interval '1 minute'",[integration])
 return {status:'completed'}
}
