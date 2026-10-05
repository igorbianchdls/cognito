import { verifyWebhook } from '@clerk/nextjs/webhooks'
import type { NextRequest } from 'next/server'
import { processVerifiedClerkEvent, type VerifiedClerkEvent } from '@/products/auth/server/clerkWebhookProcessor'
export const runtime='nodejs'
export const dynamic='force-dynamic'
export const revalidate=0

export async function POST(request:NextRequest) {
  let event:VerifiedClerkEvent
  try{
    const signingSecret=process.env.CLERK_WEBHOOK_SECRET||process.env.CLERK_WEBHOOK_SIGNING_SECRET
    event=await verifyWebhook(request,signingSecret?{signingSecret}:undefined) as VerifiedClerkEvent
  }catch{
    return Response.json({ok:false,error:'Assinatura do webhook invalida.'},{status:400})
  }
  try{
    const outcome=await processVerifiedClerkEvent(request.headers.get('svix-id')||'',event)
    return Response.json({ok:true,...outcome})
  }catch{
    return Response.json({ok:false,error:'Nao foi possivel processar o evento. Tente novamente.'},{status:503})
  }
}
