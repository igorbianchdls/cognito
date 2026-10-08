import { createHash } from 'node:crypto'

import { runQuery, withTransaction } from '@/lib/postgres'

function tag(block: string, name: string) {
  const match = block.match(new RegExp(`<${name}>\\s*([^<\\r\\n]+)`, 'i'))
  return match?.[1]?.trim() || ''
}

function parseDate(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length !== 8) throw new Error(`Data OFX inválida: ${value}`)
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
}

export type BankTransaction = {
  externalId: string; date: string; type: 'credito' | 'debito'; amount: number
  description: string; counterpart: string | null; document: string | null; balance?: number | null
}

export function parseOfxTransactions(content: string): BankTransaction[] {
  const blocks = content.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi)
    || content.split(/<STMTTRN>/i).slice(1).map((part) => part.split(/<\/BANKTRANLIST>/i)[0])
  return blocks.map((block, index) => {
    const rawAmount = Number(tag(block, 'TRNAMT').replace(',', '.'))
    if (!Number.isFinite(rawAmount) || rawAmount === 0) throw new Error(`Valor inválido na transacao ${index + 1}.`)
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

// Saldo informado pelo banco no OFX (LEDGERBAL): base da comparação extrato × ERP.
export function parseOfxBalance(content: string) {
  const ledger = content.match(/<LEDGERBAL>[\s\S]*?(<\/LEDGERBAL>|$)/i)?.[0]
  if (!ledger) return null
  const amount = Number(tag(ledger, 'BALAMT').replace(',', '.'))
  const date = tag(ledger, 'DTASOF')
  if (!Number.isFinite(amount) || !date) return null
  return { amount: Math.round(amount * 100) / 100, date: parseDate(date) }
}

// Mapeamento de colunas do CSV do banco (fica salvo na conta financeira para as próximas importações).
export type CsvMapping = {
  separador?: string; linhas_ignorar?: number; formato_data?: 'dd/mm/aaaa' | 'aaaa-mm-dd'; decimal?: ',' | '.'
  coluna_data: string; coluna_descricao: string; coluna_valor?: string; coluna_credito?: string; coluna_debito?: string
  coluna_documento?: string; coluna_saldo?: string
}

function splitCsvLine(line: string, separator: string) {
  const cells: string[] = []
  let current = '', quoted = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') { if (quoted && line[i + 1] === '"') { current += '"'; i++ } else quoted = !quoted }
    else if (char === separator && !quoted) { cells.push(current.trim()); current = '' }
    else current += char
  }
  cells.push(current.trim())
  return cells
}

function csvNumber(value: string, decimal: ',' | '.') {
  let text = value.replace(/[R$\s]/g, '')
  const negative = /^\(.*\)$/.test(text) || /-$/.test(text)
  text = text.replace(/[()]/g, '').replace(/-$/, '')
  text = decimal === ',' ? text.replace(/\./g, '').replace(',', '.') : text.replace(/,/g, '')
  const parsed = Number(text)
  if (!text || !Number.isFinite(parsed)) return null
  return negative ? -Math.abs(parsed) : parsed
}

function csvDate(value: string, format: CsvMapping['formato_data']) {
  const text = value.trim().slice(0, 10)
  const match = format === 'aaaa-mm-dd' ? text.match(/^(\d{4})-(\d{2})-(\d{2})$/) : text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null
  return format === 'aaaa-mm-dd' ? `${match[1]}-${match[2]}-${match[3]}` : `${match[3]}-${match[2]}-${match[1]}`
}

export function parseCsvTransactions(content: string, mapping: CsvMapping) {
  const separator = mapping.separador || (content.split(/\r?\n/)[mapping.linhas_ignorar || 0]?.includes(';') ? ';' : ',')
  const decimal = mapping.decimal || (separator === ';' ? ',' : '.')
  const lines = content.replace(/^﻿/, '').split(/\r?\n/).slice(mapping.linhas_ignorar || 0).filter(line => line.trim())
  if (lines.length < 2) throw new Error('O CSV precisa de cabeçalho e ao menos uma linha.')
  const header = splitCsvLine(lines[0], separator).map(cell => cell.toLowerCase())
  const column = (name?: string) => {
    if (!name) return -1
    const index = header.indexOf(name.trim().toLowerCase())
    if (index < 0) throw new Error(`Coluna "${name}" não encontrada no CSV.`)
    return index
  }
  const dateCol = column(mapping.coluna_data), descCol = column(mapping.coluna_descricao)
  const valueCol = column(mapping.coluna_valor), creditCol = column(mapping.coluna_credito), debitCol = column(mapping.coluna_debito)
  const docCol = column(mapping.coluna_documento), balanceCol = column(mapping.coluna_saldo)
  if (valueCol < 0 && (creditCol < 0 || debitCol < 0)) throw new Error('Informe a coluna de valor ou as colunas de crédito e débito.')
  const seen = new Map<string, number>()
  const transactions: BankTransaction[] = []
  lines.slice(1).forEach((line, index) => {
    const cells = splitCsvLine(line, separator)
    const date = csvDate(cells[dateCol] || '', mapping.formato_data || 'dd/mm/aaaa')
    if (!date) throw new Error(`Data inválida na linha ${index + 2}.`)
    let value = valueCol >= 0 ? csvNumber(cells[valueCol] || '', decimal) : null
    if (valueCol < 0) {
      const credit = csvNumber(cells[creditCol] || '', decimal), debit = csvNumber(cells[debitCol] || '', decimal)
      value = credit ? Math.abs(credit) : debit ? -Math.abs(debit) : null
    }
    if (!value) return // linhas de saldo ou sem movimento
    const description = (cells[descCol] || '').trim() || 'Transação CSV'
    // Identificador estável: mesma data, valor e descrição repetidos no arquivo recebem um sequencial.
    const base = `${date}|${value.toFixed(2)}|${description.toLowerCase()}`
    const occurrence = (seen.get(base) || 0) + 1
    seen.set(base, occurrence)
    transactions.push({
      externalId: 'csv:' + createHash('sha256').update(`${base}|${occurrence}`).digest('hex'),
      date, type: value > 0 ? 'credito' : 'debito', amount: Math.round(Math.abs(value) * 100) / 100,
      description, counterpart: null, document: docCol >= 0 ? cells[docCol] || null : null,
      balance: balanceCol >= 0 ? csvNumber(cells[balanceCol] || '', decimal) : null,
    })
  })
  return transactions
}

export async function importErpBankStatement(input: {
  tenantId: number
  actorId: number
  accountId: number
  fileName: string
  content: string
  format?: 'ofx' | 'csv'
  mapping?: CsvMapping
}) {
  if (!Number.isInteger(input.accountId) || input.accountId <= 0) throw new Error('Conta financeira inválida.')
  if (!input.content.trim()) throw new Error('Arquivo de extrato vazio.')
  const format = input.format === 'csv' ? 'csv' : 'ofx'
  let mapping = input.mapping
  if (format === 'csv' && !mapping) {
    // Sem mapeamento informado, usa o salvo na conta.
    const [saved] = await runQuery<{ mapeamento: CsvMapping | null }>(
      "SELECT metadata -> 'csv_mapeamento' AS mapeamento FROM erp.contas_financeiras WHERE empresa_id = $1 AND id = $2", [input.tenantId, input.accountId])
    mapping = saved?.mapeamento || undefined
    if (!mapping) throw new Error('Informe o mapeamento das colunas do CSV (data, descrição e valor).')
  }
  const transactions = format === 'csv' ? parseCsvTransactions(input.content, mapping!) : parseOfxTransactions(input.content)
  if (!transactions.length) throw new Error('Nenhuma transação foi encontrada no extrato.')
  if (transactions.length > 10000) throw new Error('O extrato excede o limite de 10.000 transacoes.')
  const hash = createHash('sha256').update(input.content).digest('hex')
  const ofxBalance = format === 'ofx' ? parseOfxBalance(input.content) : null
  const lastWithBalance = [...transactions].reverse().find(transaction => transaction.balance != null)
  const statementBalance = ofxBalance || (lastWithBalance ? { amount: lastWithBalance.balance!, date: lastWithBalance.date } : null)

  const result = await withTransaction(async (client) => {
    const account = await client.query(
      `SELECT id FROM erp.contas_financeiras
       WHERE empresa_id = $1 AND id = $2 AND ativo AND excluido_em IS NULL FOR UPDATE`,
      [input.tenantId, input.accountId],
    )
    if (!account.rows[0]) throw new Error('Conta financeira não encontrada ou inativa.')
    if (format === 'csv' && input.mapping) await client.query(
      "UPDATE erp.contas_financeiras SET metadata = metadata || jsonb_build_object('csv_mapeamento', $3::jsonb) WHERE empresa_id = $1 AND id = $2",
      [input.tenantId, input.accountId, JSON.stringify(input.mapping)])
    const existing = await client.query(
      `SELECT id::text, total_importadas, total_ignoradas, status
       FROM erp.importacoes_bancarias
       WHERE empresa_id = $1 AND conta_financeira_id = $2 AND hash_arquivo = $3`,
      [input.tenantId, input.accountId, hash],
    )
    if (existing.rows[0]) return { ...existing.rows[0], reused: true }

    const dates = transactions.map((transaction) => transaction.date).sort()
    const importedFile = await client.query(
      `INSERT INTO erp.importacoes_bancarias
         (empresa_id, conta_financeira_id, formato, nome_arquivo, hash_arquivo,
          periodo_inicio, periodo_fim, status, total_linhas, criado_por, saldo_extrato, saldo_extrato_data)
       VALUES ($1, $2, $9, $3, $4, $5, $6, 'processando', $7, $8, $10, $11) RETURNING id`,
      [input.tenantId, input.accountId, input.fileName, hash, dates[0], dates[dates.length - 1], transactions.length, input.actorId,
        format, statementBalance?.amount ?? null, statementBalance?.date ?? null],
    )
    const importId = Number(importedFile.rows[0].id)
    let imported = 0
    let ignored = 0
    for (const transaction of transactions) {
      const inserted = await client.query(
        `INSERT INTO erp.transacoes_bancarias
           (empresa_id, conta_financeira_id, importacao_bancaria_id, identificador_externo,
            data_transacao, tipo, valor, descricao, documento, contraparte, saldo_apos, criado_por, atualizado_por)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $12, $11, $11)
         ON CONFLICT (empresa_id, conta_financeira_id, identificador_externo)
           WHERE identificador_externo IS NOT NULL AND excluido_em IS NULL DO NOTHING
         RETURNING id`,
        [input.tenantId, input.accountId, importId, transaction.externalId, transaction.date,
          transaction.type, transaction.amount, transaction.description, transaction.document,
          transaction.counterpart, input.actorId, transaction.balance ?? null],
      )
      if (inserted.rows[0]) imported += 1
      else ignored += 1
    }
    const status = ignored === 0 ? 'concluida' : imported > 0 ? 'parcial' : 'concluida'
    await client.query(
      `UPDATE erp.importacoes_bancarias SET status = $3, total_importadas = $4,
         total_ignoradas = $5, concluido_em = now()
       WHERE empresa_id = $1 AND id = $2`,
      [input.tenantId, importId, status, imported, ignored],
    )
    return { id: String(importId), status, total: transactions.length, imported, ignored, reused: false }
  })
  return result
}
