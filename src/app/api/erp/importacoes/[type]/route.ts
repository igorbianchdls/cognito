import { erpFailure, erpErrorResponse as erpFailureResponse } from "@/products/erp/server/erpApi"
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
  if (!tenant) return erpFailure('Acesso negado.', 403)
  const { type } = await context.params
  if (!isImportType(type)) return erpFailure('Tipo de exportacao invalido.', 404)
  try {
    const records = await exportErpRecords(tenant.tenantId, type)
    const columns = records.length ? Object.keys(records[0]) : ['id']
    const csv = [columns.map(csvCell).join(';'), ...records.map((record) => columns.map((column) => csvCell(record[column])).join(';'))].join('\r\n')
    return new Response(`\uFEFF${csv}`, {
      headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="${type}.csv"` },
    })
  } catch (error) {
    return erpFailureResponse(error)
  }
}

export async function POST(request: Request, context: { params: Promise<{ type: string }> }) {
  const tenant = await resolveErpAccess('erp.cadastros.gerenciar')
  if (!tenant) return erpFailure('Acesso negado.', 403)
  const { type } = await context.params
  if (!isImportType(type)) return erpFailure('Tipo de importacao invalido.', 404)
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
    return erpFailureResponse(error)
  }
}
