import type { NextRequest } from 'next/server'
import { getAgentMailClient } from '@/features/email/backend/integrations/agentmailClient'
import { toEmailErrorResponse } from '@/features/email/backend/shared/http'

export async function getMessageAttachment(req: NextRequest, context: any) {
  try {
    const maybeParams = context?.params
    const params = maybeParams && typeof maybeParams.then === 'function' ? await maybeParams : maybeParams
    const id = params?.id as string | undefined
    const attachmentId = params?.attachmentId as string | undefined

    if (!id) return Response.json({ ok: false, error: 'Missing message id' }, { status: 400 })
    if (!attachmentId) return Response.json({ ok: false, error: 'Missing attachment id' }, { status: 400 })

    const { searchParams } = new URL(req.url)
    const inboxId = searchParams.get('inboxId') || ''
    if (!inboxId) return Response.json({ ok: false, error: 'Missing inboxId' }, { status: 400 })

    const client = await getAgentMailClient()
    const data = await client.inboxes.messages.getAttachment(inboxId, id, attachmentId)
    if (!data?.downloadUrl) {
      return Response.json({ ok: false, error: 'Attachment download URL not found' }, { status: 404 })
    }

    return Response.redirect(data.downloadUrl, 302)
  } catch (error) {
    return toEmailErrorResponse(error)
  }
}
