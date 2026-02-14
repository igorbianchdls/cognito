export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(_req: Request) {
  // O schema `gestaodocumentos` foi removido por decisao do produto (ERP-only).
  return Response.json(
    { success: false, message: 'Processamento de documentos desativado (schema `gestaodocumentos` removido).' },
    { status: 410 }
  )
}

