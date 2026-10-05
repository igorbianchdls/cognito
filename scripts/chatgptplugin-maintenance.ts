import { config } from 'dotenv'
import { closePluginDatabase } from '../src/products/chatgptplugin/shared/database'
import { maintainChatgptPlugin } from '../src/products/chatgptplugin/application/maintenance'
config({path:'.env.local',quiet:true})
async function main() {
  try {
    await maintainChatgptPlugin()
    console.log('Manutencao do ChatGPT Plugin concluida.')
  } finally { await closePluginDatabase() }
}
void main().catch(() => { console.error('Nao foi possivel concluir a manutencao.'); process.exitCode=1 })
