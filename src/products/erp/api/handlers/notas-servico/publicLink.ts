import { runWithErpDatabaseContext } from '@/lib/erpDatabaseContext'
import { withErpHttp } from '../../http/handler'
import { verifyServiceInvoiceLinkToken } from '../../../server/fiscal/serviceInvoiceLinks'
import { getServiceInvoicePdf, getServiceInvoiceXml } from '../../../server/fiscal/serviceInvoiceRepository'

type RouteContext = { params: Promise<{ token: string }> }
// Sem sessão: o token assinado e com validade curta é a credencial. A leitura roda com o contexto
// (empresa e usuário) de quem gerou o link, então o RLS e as permissões continuam valendo.
const privateHeaders = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'no-referrer', 'X-Fiscal-Mode': 'simulacao' }
export const GET = withErpHttp(async (_request: Request, route: RouteContext) => {
  const link = verifyServiceInvoiceLinkToken(decodeURIComponent((await route.params).token))
  return runWithErpDatabaseContext({ tenantId: link.empresa, userId: link.usuario, readOnly: true, statementTimeoutMs: 10000 }, async () => {
    if (link.tipo === 'xml') {
      const file = await getServiceInvoiceXml(link.empresa, link.nota)
      return new Response(file.content, { headers: { ...privateHeaders, 'Content-Type': 'application/xml; charset=utf-8', 'Content-Disposition': `attachment; filename="${file.name}"` } })
    }
    const file = await getServiceInvoicePdf(link.empresa, link.nota)
    return new Response(new Uint8Array(file.bytes), { headers: { ...privateHeaders, 'Content-Type': 'application/pdf', 'X-PDF-Layout-Version':String(file.layoutVersion), 'X-PDF-Storage':file.source, 'Content-Disposition': `inline; filename="${file.name}"` } })
  })
}, { operation: 'GET /api/public/nfse/[token]', authentication: 'none' })
