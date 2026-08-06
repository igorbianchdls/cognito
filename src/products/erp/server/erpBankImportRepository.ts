import { createHash } from 'node:crypto'

import { withTransaction } from '@/lib/postgres'

function tag(block: string, name: string) {
  const match = block.match(new RegExp(`<${name}>\\s*([^<\\r\\n]+)`, 'i'))
  return match?.[1]?.trim() || ''
}

function parseDate(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length !== 8) throw new Error(`Data OFX invalida: ${value}`)
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
}

export function parseOfxTransactions(content: string) {
  const blocks = content.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi)
    || content.split(/<STMTTRN>/i).slice(1).map((part) => part.split(/<\/BANKTRANLIST>/i)[0])
  return blocks.map((block, index) => {
    const rawAmount = Number(tag(block, 'TRNAMT').replace(',', '.'))
    if (!Number.isFinite(rawAmount) || rawAmount === 0) throw new Error(`Valor invalido na transacao ${index + 1}.`)
    return {
      externalId: tag(block, 'FITID') || createHash('sha256').update(block).digest('hex'),
      date: parseDate(tag(block, 'DTPOSTED')),
      type: rawAmount >= 0 ? 'credito' : 'debito',
      amount: Math.abs(rawAmount),
      description: tag(block, 'MEMO') || tag(block, 'NAME') || tag(block, 'TRNTYPE') || 'Transacao OFX',
      counterpart: tag(block, 'NAME') || null,
      document: tag(block, 'CHECKNUM') || tag(block, 'REFNUM') || null,
    }
  })
}

export async function importErpBankStatement(input: {
  tenantId: number
  actorId: number
  accountId: number
  fileName: string
  content: string
}) {
  if (!Number.isInteger(input.accountId) || input.accountId <= 0) throw new Error('Conta financeira invalida.')
  if (!input.content.trim()) throw new Error('Arquivo OFX vazio.')
  const transactions = parseOfxTransactions(input.content)
  if (!transactions.length) throw new Error('Nenhuma transacao foi encontrada no OFX.')
  if (transactions.length > 10000) throw new Error('O extrato excede o limite de 10.000 transacoes.')
  const hash = createHash('sha256').update(input.content).digest('hex')

  return withTransaction(async (client) => {
    const account = await client.query(
      `SELECT id FROM erp.contas_financeiras
       WHERE tenant_id = $1 AND id = $2 AND ativo AND excluido_em IS NULL FOR UPDATE`,
      [input.tenantId, input.accountId],
    )
    if (!account.rows[0]) throw new Error('Conta financeira nao encontrada ou inativa.')
    const existing = await client.query(
      `SELECT id::text, total_importadas, total_ignoradas, status
       FROM erp.importacoes_bancarias
       WHERE tenant_id = $1 AND conta_financeira_id = $2 AND hash_arquivo = $3`,
      [input.tenantId, input.accountId, hash],
    )
    if (existing.rows[0]) return { ...existing.rows[0], reused: true }

    const dates = transactions.map((transaction) => transaction.date).sort()
    const importedFile = await client.query(
      `INSERT INTO erp.importacoes_bancarias
         (tenant_id, conta_financeira_id, formato, nome_arquivo, hash_arquivo,
          periodo_inicio, periodo_fim, status, total_linhas, criado_por)
       VALUES ($1, $2, 'ofx', $3, $4, $5, $6, 'processando', $7, $8) RETURNING id`,
      [input.tenantId, input.accountId, input.fileName, hash, dates[0], dates[dates.length - 1], transactions.length, input.actorId],
    )
    const importId = Number(importedFile.rows[0].id)
    let imported = 0
    let ignored = 0
    for (const transaction of transactions) {
      const result = await client.query(
        `INSERT INTO erp.transacoes_bancarias
           (tenant_id, conta_financeira_id, importacao_bancaria_id, identificador_externo,
            data_transacao, tipo, valor, descricao, documento, contraparte, criado_por, atualizado_por)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11)
         ON CONFLICT (tenant_id, conta_financeira_id, identificador_externo)
           WHERE identificador_externo IS NOT NULL AND excluido_em IS NULL DO NOTHING
         RETURNING id`,
        [input.tenantId, input.accountId, importId, transaction.externalId, transaction.date,
          transaction.type, transaction.amount, transaction.description, transaction.document,
          transaction.counterpart, input.actorId],
      )
      if (result.rows[0]) imported += 1
      else ignored += 1
    }
    const status = ignored === 0 ? 'concluida' : imported > 0 ? 'parcial' : 'concluida'
    await client.query(
      `UPDATE erp.importacoes_bancarias SET status = $3, total_importadas = $4,
         total_ignoradas = $5, concluido_em = now()
       WHERE tenant_id = $1 AND id = $2`,
      [input.tenantId, importId, status, imported, ignored],
    )
    return { id: String(importId), status, total: transactions.length, imported, ignored, reused: false }
  })
}
