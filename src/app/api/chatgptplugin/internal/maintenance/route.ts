import { NextResponse } from 'next/server'
import { maintainPluginStorage } from '@/products/mcpcore/application/maintenance'
import { retryClerkOperations } from '@/products/auth/server/clerkOutbox'
import { maintainTablesStorage } from '@/products/tables/server/maintenance'

export const runtime='nodejs'
export const dynamic='force-dynamic'
export const maxDuration=120
export async function GET(request:Request) {
  const secret=process.env.CRON_SECRET
  if(!secret) return NextResponse.json({error:'Manutenção não configurada.'},{status:503})
  if(request.headers.get('authorization')!==`Bearer ${secret}`) return NextResponse.json({error:'Acesso negado.'},{status:401})
  try {
    // Rascunhos, auditoria e limites dos dois chats; cada integração é mantida separadamente.
    const chatgpt = await maintainPluginStorage('chatgpt'), claude = await maintainPluginStorage('claude')
    const tables = await maintainTablesStorage().catch(() => ({ status:'unavailable', removed:0, failed:1 }))
    return NextResponse.json({ ...chatgpt, integrations:{ chatgpt:chatgpt.status, claude:claude.status }, clerk: await retryClerkOperations(), tables })
  }
  catch { return NextResponse.json({error:'Falha na manutenção do plugin.'},{status:503}) }
}
