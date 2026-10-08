import { config } from 'dotenv'
import { closePluginDatabase } from '../src/products/mcpcore/shared/database'
import { maintainPluginStorage } from '../src/products/mcpcore/application/maintenance'
config({path:'.env.local',quiet:true})
async function main() {
  try {
    await maintainPluginStorage('chatgpt')
    await maintainPluginStorage('claude')
    console.log('Manutencao do ChatGPT Plugin concluida.')
  } finally { await closePluginDatabase() }
}
void main().catch(() => { console.error('Nao foi possivel concluir a manutencao.'); process.exitCode=1 })
