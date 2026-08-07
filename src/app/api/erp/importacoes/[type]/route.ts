import { NextResponse } from 'next/server'

import { resolveErpAccess } from '@/products/erp/server/erpAccess'
import { exportErpRecords, importErpRows, isImportType } from '@/products/erp/server/erpImportRepository'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

function csvCell(value: unknown) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`
}

export async function GET(_request: Request, context: { params: Promise<{ type: string }> }) {
  const tenant = await resolveErpAccess('erp.cadastros.visualizar')
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  const { type } = await context.params
  if (!isImportType(type)) return NextResponse.json({ error: 'Tipo de exportacao invalido.' }, { status: 404 })
  try {
    const records = await exportErpRecords(tenant.tenantId, type)
    const columns = records.length ? Object.keys(records[0]) : ['id']
    const csv = [columns.map(csvCell).join(';'), ...records.map((record) => columns.map((column) => csvCell(record[column])).join(';'))].join('\r\n')
    return new Response(`\uFEFF${csv}`, {
      headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${type}.csv"` },
    })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Nao foi possivel exportar os dados.' }, { status: 400 })
  }
}

export async function POST(request: Request, context: { params: Promise<{ type: string }> }) {
  const tenant = await resolveErpAccess('erp.cadastros.gerenciar')
  if (!tenant) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
  const { type } = await context.params
  if (!isImportType(type)) return NextResponse.json({ error: 'Tipo de importacao invalido.' }, { status: 404 })
  try {
    const body = (await request.json()) as { fileName?: string; rows?: Record<string, unknown>[] }
    const result = await importErpRows({
      tenantId: tenant.tenantId,
      actorId: tenant.sharedUserId,
      type,
      fileName: String(body.fileName || `${type}.csv`),
      rows: Array.isArray(body.rows) ? body.rows : [],
    })
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Nao foi possivel importar os dados.' }, { status: 400 })
  }
}
