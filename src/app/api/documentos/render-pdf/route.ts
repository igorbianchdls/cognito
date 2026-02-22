import { renderTemplateToHtml } from '@/products/documentos/backend/features/rendering/renderTemplateToHtml'
import { renderHtmlToPdf } from '@/products/documentos/backend/features/rendering/renderHtmlToPdf'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 300

type RenderPdfRequestBody = {
  template_json?: unknown
  sample_data?: unknown
  dados?: unknown
  filename?: unknown
  title?: unknown
}

function toArrayBuffer(bytes: Uint8Array<ArrayBufferLike>): ArrayBuffer {
  const copy = new Uint8Array(bytes.byteLength)
  copy.set(bytes)
  return copy.buffer
}

function contentDispositionAttachment(fileName: string): string {
  const safe = String(fileName || 'documentos-preview.pdf').replace(/[\r\n"]/g, '').trim() || 'documentos-preview.pdf'
  return `attachment; filename*=UTF-8''${encodeURIComponent(safe)}`
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as RenderPdfRequestBody
    if (body.template_json == null) {
      return Response.json({ ok: false, error: 'template_json é obrigatório' }, { status: 400 })
    }

    const html = renderTemplateToHtml({
      templateJson: body.template_json,
      sampleData: body.sample_data ?? body.dados ?? {},
      fileName: typeof body.filename === 'string' ? body.filename : undefined,
      title: typeof body.title === 'string' ? body.title : undefined,
    })

    const pdf = await renderHtmlToPdf(html)
    const body = toArrayBuffer(pdf.bytes)

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': pdf.contentType,
        'Content-Disposition': contentDispositionAttachment(pdf.fileName),
        'Cache-Control': 'no-store',
        'X-Documentos-Pdf-Engine': pdf.engine,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const status = (
      /template_json|json|payload/i.test(message)
      || error instanceof SyntaxError
    ) ? 400 : 500
    return Response.json({ ok: false, error: message }, { status })
  }
}
