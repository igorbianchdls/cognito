import { randomUUID } from 'crypto'
import { runQuery } from '@/lib/postgres'
import {
  getSupabaseAdmin,
  getWorkspaceOwnerId,
  parseUuid,
  sanitizeDriveFileName,
} from '@/products/drive/backend/lib'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

type SeedBody = {
  workspace_id?: string
  folder_id?: string | null
}

type SeedDoc = {
  name: string
  title: string
  lines: string[]
}

function escapePdfText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/\r?\n/g, ' ')
}

function wrapLine(text: string, maxLen = 90): string[] {
  const clean = String(text || '').trim()
  if (!clean) return ['']
  if (clean.length <= maxLen) return [clean]

  const words = clean.split(/\s+/)
  const out: string[] = []
  let acc = ''
  for (const word of words) {
    if (!acc) {
      acc = word
      continue
    }
    if (`${acc} ${word}`.length <= maxLen) {
      acc = `${acc} ${word}`
      continue
    }
    out.push(acc)
    acc = word
  }
  if (acc) out.push(acc)
  return out
}

function buildPdfBuffer(title: string, lines: string[]): Buffer {
  const bodyLines = lines.flatMap((line) => wrapLine(line, 92))
  const maxBodyLines = 46
  const finalBody = bodyLines.slice(0, maxBodyLines)
  if (bodyLines.length > maxBodyLines) {
    finalBody[finalBody.length - 1] = `${finalBody[finalBody.length - 1]} ...`
  }

  const streamParts: string[] = []
  streamParts.push('BT')
  streamParts.push('/F1 14 Tf')
  streamParts.push('50 795 Td')
  streamParts.push('15 TL')
  streamParts.push(`(${escapePdfText(title)}) Tj`)
  streamParts.push('/F1 11 Tf')
  streamParts.push('0 -22 Td')
  for (const line of finalBody) {
    streamParts.push(`(${escapePdfText(line)}) Tj`)
    streamParts.push('T*')
  }
  streamParts.push('ET')
  const stream = streamParts.join('\n')

  const objects: string[] = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj',
    '4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj',
    `5 0 obj\n<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream\nendobj`,
  ]

  let pdf = '%PDF-1.4\n'
  const offsets: number[] = [0]
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, 'utf8'))
    pdf += `${obj}\n`
  }
  const xrefOffset = Buffer.byteLength(pdf, 'utf8')
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'
  for (let i = 1; i < offsets.length; i += 1) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  return Buffer.from(pdf, 'utf8')
}

function buildSeedDocs(): SeedDoc[] {
  const ym = new Date().toISOString().slice(0, 7)
  const today = new Date().toISOString().slice(0, 10)
  return [
    {
      name: `Fatura-Fornecedor-Orion-${ym}.pdf`,
      title: 'FATURA DE SERVICO - FORNECEDOR ORION',
      lines: [
        'FATURA DE SERVICO',
        'Fornecedor: Orion Tecnologia Ltda',
        'CNPJ: 12.345.678/0001-90',
        'Fatura: FAT-2026-0184',
        `Data de emissao: ${today}`,
        'Vencimento: 2026-02-12',
        '',
        'Descricao:',
        '- Manutencao de infraestrutura de rede',
        '- Atendimento remoto e presencial',
        '- Atendimento de chamados criticos em horario estendido',
        '',
        'Valor bruto: R$ 6.340,00',
        'Impostos retidos: R$ 412,10',
        'Valor liquido: R$ 5.927,90',
        '',
        'Observacoes:',
        'Pagamento autorizado mediante envio de comprovante para fiscal@acme.local.',
        'Centro de custo: Tecnologia / Operacoes.',
        'Condicao comercial: 28 dias apos emissao.',
      ],
    },
    {
      name: `Recibo-Pagamento-Frete-SulLog-${ym}.pdf`,
      title: 'RECIBO DE PAGAMENTO - FRETE',
      lines: [
        'RECIBO DE PAGAMENTO',
        'Recebemos de: ACME Comercio e Servicos Ltda',
        'Pagador CNPJ: 45.332.110/0001-22',
        'Recebedor: SulLog Transportes',
        `Data: ${today}`,
        '',
        'Referente a: Transporte de mercadorias - rota SP > Campinas',
        'Periodo: Semana 06 / 2026',
        'Documento de referencia: CTRC-77192',
        'Valor recebido: R$ 4.820,00',
        'Forma de pagamento: TED',
        'Banco: 341 - Itau',
        '',
        'Declaro para os devidos fins que o valor acima foi recebido integralmente.',
        'Assinatura digital registrada no portal do transportador.',
      ],
    },
    {
      name: `Boleto-Cliente-Horizonte-${ym}.pdf`,
      title: 'BOLETO BANCARIO - CLIENTE HORIZONTE',
      lines: [
        'BOLETO BANCARIO',
        'Beneficiario: ACME Comercio e Servicos Ltda',
        'Pagador: Horizonte Distribuidora SA',
        'Nosso numero: 109938211',
        'Numero documento: VEN-2026-0041',
        'Vencimento: 2026-02-15',
        'Valor: R$ 9.480,00',
        '',
        'Linha digitavel: 34191.09937 82110.000000 40291.120007 1 96510000948000',
        '',
        'Instrucoes:',
        '- Nao receber apos 10 dias do vencimento sem autorizacao do financeiro.',
        '- Multa de 2% apos vencimento.',
        '- Juros de mora de 1% ao mes apos vencimento.',
      ],
    },
    {
      name: `Nota-Servico-TecService-9811-${ym}.pdf`,
      title: 'NOTA FISCAL DE SERVICO - TECSERVICE',
      lines: [
        'NOTA FISCAL DE SERVICO',
        'Prestador: TecService Manutencao Empresarial',
        'CNPJ: 56.981.220/0001-11',
        'Numero NFS-e: 9811',
        `Data emissao: ${today}`,
        '',
        'Servico:',
        '- Manutencao preventiva de estacoes de trabalho',
        '- Substituicao de componentes e limpeza tecnica',
        '- Revisao de ativos em sala de operacoes',
        '',
        'Base de calculo: R$ 3.210,00',
        'ISS (5%): R$ 160,50',
        'Total da nota: R$ 3.370,50',
        '',
        'Observacao interna: validar divergencia de aliquota com contrato vigente.',
      ],
    },
    {
      name: `Relatorio-Contas-a-Pagar-Semana-06-${ym}.pdf`,
      title: 'RELATORIO - CONTAS A PAGAR (SEMANA 06)',
      lines: [
        'Resumo operacional do financeiro para pagamentos da semana:',
        '',
        '1) Orion Tecnologia - FAT-2026-0184 - Venc.: 12/02 - R$ 6.340,00 - Status: A aprovar',
        '2) SulLog Transportes - CTRC-77192 - Venc.: 09/02 - R$ 4.820,00 - Status: Pago',
        '3) Energia Centro - EC-88412 - Venc.: 11/02 - R$ 2.145,34 - Status: A aprovar',
        '4) Link Business Internet - LBI-22018 - Venc.: 13/02 - R$ 689,90 - Status: A aprovar',
        '',
        'Total previsto da semana: R$ 13.995,24',
        'Prioridade: manter adimplencia de fornecedores criticos.',
      ],
    },
    {
      name: `Resumo-Financeiro-Mensal-${ym}.pdf`,
      title: 'RESUMO FINANCEIRO MENSAL',
      lines: [
        'RESUMO FINANCEIRO - FEVEREIRO/2026',
        '',
        'Receitas previstas: R$ 146.000,00',
        'Receitas realizadas ate o momento: R$ 98.420,00',
        '',
        'Despesas previstas: R$ 92.800,00',
        'Despesas realizadas ate o momento: R$ 61.275,74',
        '',
        'Principais pontos de atencao:',
        '- Concentracao de saidas na proxima segunda-feira',
        '- Dois pedidos dependentes de confirmacao documental',
        '- Necessidade de priorizar cobranca de clientes com vencimento ate sexta',
        '',
        'Recomendacao:',
        'Bloquear despesas nao essenciais ate fechamento da conciliacao de sexta-feira.',
      ],
    },
  ]
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as SeedBody
    const workspaceId = parseUuid(body.workspace_id || '')
    const folderIdRaw = body.folder_id ? String(body.folder_id) : ''
    const folderIdInput = folderIdRaw ? parseUuid(folderIdRaw) : null

    if (!workspaceId) {
      return Response.json({ success: false, message: 'workspace_id inválido' }, { status: 400 })
    }
    if (folderIdRaw && !folderIdInput) {
      return Response.json({ success: false, message: 'folder_id inválido' }, { status: 400 })
    }

    const ownerId = await getWorkspaceOwnerId(workspaceId)
    if (!ownerId) {
      return Response.json({ success: false, message: 'Workspace não encontrado' }, { status: 404 })
    }

    let folderId = folderIdInput
    if (!folderId) {
      const existing = await runQuery<{ id: string }>(
        `SELECT id::text AS id
           FROM drive.folders
          WHERE workspace_id = $1::uuid
            AND parent_id IS NULL
            AND deleted_at IS NULL
            AND lower(name) = lower($2)
          ORDER BY created_at ASC
          LIMIT 1`,
        [workspaceId, 'Financeiro - Faturas e Recibos']
      )
      if (existing[0]?.id) {
        folderId = existing[0].id
      } else {
        const created = await runQuery<{ id: string }>(
          `INSERT INTO drive.folders (workspace_id, parent_id, name, created_by)
           VALUES ($1::uuid, NULL, $2, $3)
           RETURNING id::text AS id`,
          [workspaceId, 'Financeiro - Faturas e Recibos', ownerId]
        )
        folderId = created[0]?.id || null
      }
    } else {
      const folderRows = await runQuery<{ id: string }>(
        `SELECT id::text AS id
           FROM drive.folders
          WHERE id = $1::uuid
            AND workspace_id = $2::uuid
            AND deleted_at IS NULL
          LIMIT 1`,
        [folderId, workspaceId]
      )
      if (!folderRows[0]) {
        return Response.json({ success: false, message: 'Pasta não encontrada para este workspace' }, { status: 404 })
      }
    }

    if (!folderId) {
      return Response.json({ success: false, message: 'Falha ao preparar pasta de destino' }, { status: 500 })
    }

    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return Response.json({ success: false, message: 'Supabase Storage não configurado no servidor' }, { status: 500 })
    }

    const docs = buildSeedDocs()
    const created: Array<{
      id: string
      name: string
      mime: string
      sizeBytes: number
      storagePath: string
      bucketId: string
    }> = []
    const errors: Array<{ name: string; error: string }> = []

    for (const doc of docs) {
      const fileId = randomUUID()
      const safeName = sanitizeDriveFileName(doc.name)
      const storagePath = `${workspaceId}/${folderId}/${fileId}-${safeName}`
      const payload = buildPdfBuffer(doc.title, doc.lines)

      const { error: uploadError } = await supabase.storage
        .from('drive')
        .upload(storagePath, payload, {
          contentType: 'application/pdf',
          upsert: false,
        })

      if (uploadError) {
        errors.push({ name: safeName, error: uploadError.message || 'Falha no upload' })
        continue
      }

      try {
        await runQuery(
          `INSERT INTO drive.files
            (id, workspace_id, folder_id, name, mime, size_bytes, bucket_id, storage_path, created_by)
           VALUES
            ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6::bigint, 'drive', $7, $8)`,
          [fileId, workspaceId, folderId, safeName, 'application/pdf', payload.length, storagePath, ownerId]
        )
        created.push({
          id: fileId,
          name: safeName,
          mime: 'application/pdf',
          sizeBytes: payload.length,
          storagePath,
          bucketId: 'drive',
        })
      } catch (insertError) {
        errors.push({
          name: safeName,
          error: insertError instanceof Error ? insertError.message : 'Falha ao gravar metadados',
        })
        try {
          await supabase.storage.from('drive').remove([storagePath])
        } catch {
          // No-op: não bloquear retorno.
        }
      }
    }

    return Response.json({
      success: errors.length === 0,
      folderId,
      requested: docs.length,
      createdCount: created.length,
      errorsCount: errors.length,
      created,
      errors,
    }, { status: errors.length === 0 ? 200 : 207 })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return Response.json({ success: false, message }, { status: 500 })
  }
}
