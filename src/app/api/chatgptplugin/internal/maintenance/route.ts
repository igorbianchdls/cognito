import { NextResponse } from 'next/server'
import { maintainChatgptPlugin } from '@/products/chatgptplugin/application/maintenance'

export const runtime='nodejs'
export const dynamic='force-dynamic'
export async function GET(request:Request) {
  const secret=process.env.CRON_SECRET
  if(!secret) return NextResponse.json({error:'Manutenção não configurada.'},{status:503})
  if(request.headers.get('authorization')!==`Bearer ${secret}`) return NextResponse.json({error:'Acesso negado.'},{status:401})
  try { return NextResponse.json(await maintainChatgptPlugin()) }
  catch { return NextResponse.json({error:'Falha na manutenção do plugin.'},{status:503}) }
}
