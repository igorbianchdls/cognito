import { uploadBase64ToDrive } from '@/products/drive/backend/features/uploads/uploadBase64ToDrive'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

type Body = {
  workspace_id?: string
  folder_id?: string | null
  file_name?: string
  mime?: string
  content_base64?: string
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as Body
    const result = await uploadBase64ToDrive({
      workspace_id: body.workspace_id,
      folder_id: body.folder_id ?? null,
      file_name: body.file_name,
      mime: body.mime,
      content_base64: body.content_base64,
    })
    if (!result.success) {
      return Response.json({ success: false, message: result.message, code: result.code }, { status: result.status })
    }
    return Response.json(result)
  } catch (error) {
    return Response.json(
      { success: false, message: error instanceof Error ? error.message : String(error), code: 'DRIVE_UPLOAD_BASE64_ERROR' },
      { status: 500 },
    )
  }
}
