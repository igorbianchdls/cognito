#!/usr/bin/env node

import { Client } from 'pg'
import dotenv from 'dotenv'
import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

const TENANT_ID = 1
const TODAY_ISO = '2026-03-31'

function loadEnvFiles() {
  try {
    const cwd = process.cwd()
    const candidates = [
      '.env.local',
      '.env',
      '.env.development.local',
      '.env.development',
      '.env.production.local',
      '.env.production',
    ].map((f) => path.join(cwd, f))

    for (const envPath of candidates) {
      if (fs.existsSync(envPath)) dotenv.config({ path: envPath, override: false })
    }
  } catch {
    // ignore
  }
}

function createRng(seed = 20260217) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function sanitizeName(value, max = 72) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\-_. ]+/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, max)
}

function toDateOnly(value) {
  const s = String(value || '').slice(0, 10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  return TODAY_ISO
}

function parseDateOnly(value) {
  const v = toDateOnly(value)
  return new Date(`${v}T12:00:00.000Z`)
}

function fmtDate(d) {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`
}

function addDays(isoDate, days) {
  const d = parseDateOnly(isoDate)
  d.setUTCDate(d.getUTCDate() + days)
  return fmtDate(d)
}

function daysDiff(aIso, bIso) {
  const a = parseDateOnly(aIso).getTime()
  const b = parseDateOnly(bIso).getTime()
  return Math.floor((a - b) / 86400000)
}

function pickIdsByCount(rng, ids, count) {
  const pool = ids.slice()
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, Math.max(0, Math.min(count, pool.length)))
}

function toRecipientList(value) {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (!item) return null
        if (typeof item === 'string') {
          const email = item.trim()
          if (!email) return null
          return { email }
        }
        if (typeof item === 'object') {
          const email = String(item.email || '').trim()
          const name = String(item.name || '').trim()
          if (!email && !name) return null
          return { email, name }
        }
        return null
      })
      .filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
      .map((email) => ({ email }))
  }

  return []
}

async function ensureFinanceMasterData(client) {
  const bankSeed = [
    { nome_banco: 'Itaú Unibanco', numero_banco: '341', agencia: '4321' },
    { nome_banco: 'Banco do Brasil', numero_banco: '001', agencia: '1204' },
    { nome_banco: 'Sicoob', numero_banco: '756', agencia: '3019' },
  ]

  const bankByName = new Map()
  for (const bank of bankSeed) {
    const found = await client.query(
      `SELECT id FROM financeiro.bancos WHERE tenant_id = $1 AND lower(nome_banco) = lower($2) LIMIT 1`,
      [TENANT_ID, bank.nome_banco]
    )
    if (found.rowCount > 0) {
      bankByName.set(bank.nome_banco, Number(found.rows[0].id))
      continue
    }

    const created = await client.query(
      `INSERT INTO financeiro.bancos (tenant_id, nome_banco, numero_banco, agencia, criado_em, atualizado_em)
       VALUES ($1,$2,$3,$4,now(),now())
       RETURNING id`,
      [TENANT_ID, bank.nome_banco, bank.numero_banco, bank.agencia]
    )
    bankByName.set(bank.nome_banco, Number(created.rows[0].id))
  }

  const accountSeed = [
    {
      nome_conta: 'Conta Corrente Operacional',
      tipo_conta: 'corrente',
      banco: 'Itaú Unibanco',
      agencia: '4321',
      numero_conta: '112233-4',
      pix_chave: 'financeiro@aurorasemijoias.com.br',
      saldo_inicial: 185000,
      saldo_atual: 212480,
      data_abertura: '2024-01-10',
    },
    {
      nome_conta: 'Conta Recebimentos PIX',
      tipo_conta: 'corrente',
      banco: 'Banco do Brasil',
      agencia: '1204',
      numero_conta: '889977-1',
      pix_chave: 'pix@aurorasemijoias.com.br',
      saldo_inicial: 85000,
      saldo_atual: 96870,
      data_abertura: '2024-04-03',
    },
    {
      nome_conta: 'Conta Pagamentos Fornecedores',
      tipo_conta: 'corrente',
      banco: 'Sicoob',
      agencia: '3019',
      numero_conta: '556611-9',
      pix_chave: 'pagamentos@aurorasemijoias.com.br',
      saldo_inicial: 62000,
      saldo_atual: 54890,
      data_abertura: '2024-07-15',
    },
  ]

  const accountIds = []
  for (const acc of accountSeed) {
    const found = await client.query(
      `SELECT id FROM financeiro.contas_financeiras WHERE tenant_id = $1 AND lower(nome_conta) = lower($2) LIMIT 1`,
      [TENANT_ID, acc.nome_conta]
    )

    if (found.rowCount > 0) {
      const id = Number(found.rows[0].id)
      accountIds.push(id)
      await client.query(
        `UPDATE financeiro.contas_financeiras
            SET banco_id = $1,
                tipo_conta = $2,
                agencia = $3,
                numero_conta = $4,
                pix_chave = $5,
                saldo_inicial = $6,
                saldo_atual = $7,
                data_abertura = $8,
                ativo = true,
                atualizado_em = now()
          WHERE id = $9`,
        [
          bankByName.get(acc.banco),
          acc.tipo_conta,
          acc.agencia,
          acc.numero_conta,
          acc.pix_chave,
          acc.saldo_inicial,
          acc.saldo_atual,
          acc.data_abertura,
          id,
        ]
      )
      continue
    }

    const created = await client.query(
      `INSERT INTO financeiro.contas_financeiras
        (tenant_id, banco_id, nome_conta, tipo_conta, agencia, numero_conta, pix_chave, saldo_inicial, saldo_atual, data_abertura, ativo, criado_em, atualizado_em)
       VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true,now(),now())
       RETURNING id`,
      [
        TENANT_ID,
        bankByName.get(acc.banco),
        acc.nome_conta,
        acc.tipo_conta,
        acc.agencia,
        acc.numero_conta,
        acc.pix_chave,
        acc.saldo_inicial,
        acc.saldo_atual,
        acc.data_abertura,
      ]
    )
    accountIds.push(Number(created.rows[0].id))
  }

  const methodSeed = [
    { nome: 'PIX', descricao: 'Transferência instantânea' },
    { nome: 'Boleto', descricao: 'Cobrança por boleto bancário' },
    { nome: 'TED', descricao: 'Transferência bancária TED' },
    { nome: 'Cartão Corporativo', descricao: 'Despesa em cartão empresarial' },
    { nome: 'Transferência Interna', descricao: 'Movimentação interna entre contas' },
  ]

  const methodIds = []
  for (const method of methodSeed) {
    const found = await client.query(
      `SELECT id FROM financeiro.metodos_pagamento WHERE tenant_id = $1 AND lower(nome) = lower($2) LIMIT 1`,
      [TENANT_ID, method.nome]
    )
    if (found.rowCount > 0) {
      const id = Number(found.rows[0].id)
      methodIds.push(id)
      await client.query(
        `UPDATE financeiro.metodos_pagamento
            SET descricao = $1,
                ativo = true,
                atualizado_em = now()
          WHERE id = $2`,
        [method.descricao, id]
      )
      continue
    }

    const created = await client.query(
      `INSERT INTO financeiro.metodos_pagamento (tenant_id, nome, descricao, ativo, criado_em, atualizado_em)
       VALUES ($1,$2,$3,true,now(),now())
       RETURNING id`,
      [TENANT_ID, method.nome, method.descricao]
    )
    methodIds.push(Number(created.rows[0].id))
  }

  return { accountIds, methodIds }
}

function computeLifecycleBuckets(rows, rng, options) {
  const ids = rows.map((r) => Number(r.id))
  const cancelCount = Math.round(rows.length * options.cancelRatio)
  const paidCount = Math.round(rows.length * options.paidRatio)
  const overdueTarget = Math.round(rows.length * options.overdueRatio)

  const canceled = new Set(pickIdsByCount(rng, ids, cancelCount))

  const eligiblePaid = ids.filter((id) => !canceled.has(id))
  const paid = new Set(pickIdsByCount(rng, eligiblePaid, paidCount))

  const eligibleOverdue = rows
    .filter((r) => !canceled.has(Number(r.id)) && !paid.has(Number(r.id)) && daysDiff(TODAY_ISO, toDateOnly(r.data_vencimento)) > 0)
    .map((r) => Number(r.id))
  const overdue = new Set(pickIdsByCount(rng, eligibleOverdue, overdueTarget))

  const pending = new Set(ids.filter((id) => !canceled.has(id) && !paid.has(id) && !overdue.has(id)))

  return { canceled, paid, overdue, pending }
}

function pickPaymentDate(rng, row) {
  const doc = toDateOnly(row.data_documento)
  const due = toDateOnly(row.data_vencimento)
  const shift = Math.floor(rng() * 8) - 3 // -3..+4
  const raw = addDays(due, shift)

  let date = raw
  if (daysDiff(doc, date) > 0) date = doc
  if (daysDiff(date, TODAY_ISO) > 0) date = TODAY_ISO
  return date
}

async function reseedFinanceLifecycle(client, financeMaster, rng) {
  await client.query('DELETE FROM financeiro.pagamentos_recebidos_linhas')
  await client.query('DELETE FROM financeiro.pagamentos_recebidos')
  await client.query('DELETE FROM financeiro.pagamentos_efetuados_linhas')
  await client.query('DELETE FROM financeiro.pagamentos_efetuados')

  const arRes = await client.query(
    `SELECT id, numero_documento, cliente_id, data_documento, data_vencimento, valor_liquido
       FROM financeiro.contas_receber
      WHERE tenant_id = $1
      ORDER BY data_vencimento ASC, id ASC`,
    [TENANT_ID]
  )

  const apRes = await client.query(
    `SELECT id, numero_documento, fornecedor_id, data_documento, data_vencimento, valor_liquido
       FROM financeiro.contas_pagar
      WHERE tenant_id = $1
      ORDER BY data_vencimento ASC, id ASC`,
    [TENANT_ID]
  )

  const arBuckets = computeLifecycleBuckets(arRes.rows, rng, {
    paidRatio: 0.38,
    cancelRatio: 0.06,
    overdueRatio: 0.18,
  })

  const apBuckets = computeLifecycleBuckets(apRes.rows, rng, {
    paidRatio: 0.34,
    cancelRatio: 0.08,
    overdueRatio: 0.2,
  })

  await client.query(`UPDATE financeiro.contas_receber SET status = 'pendente', atualizado_em = now() WHERE tenant_id = $1`, [TENANT_ID])
  await client.query(`UPDATE financeiro.contas_pagar SET status = 'pendente', atualizado_em = now() WHERE tenant_id = $1`, [TENANT_ID])

  if (arBuckets.overdue.size > 0) {
    await client.query(
      `UPDATE financeiro.contas_receber
          SET status = 'vencido', atualizado_em = now()
        WHERE id = ANY($1::bigint[])`,
      [Array.from(arBuckets.overdue)]
    )
  }

  if (arBuckets.canceled.size > 0) {
    await client.query(
      `UPDATE financeiro.contas_receber
          SET status = 'cancelado', atualizado_em = now()
        WHERE id = ANY($1::bigint[])`,
      [Array.from(arBuckets.canceled)]
    )
  }

  if (apBuckets.overdue.size > 0) {
    await client.query(
      `UPDATE financeiro.contas_pagar
          SET status = 'vencido', atualizado_em = now()
        WHERE id = ANY($1::bigint[])`,
      [Array.from(apBuckets.overdue)]
    )
  }

  if (apBuckets.canceled.size > 0) {
    await client.query(
      `UPDATE financeiro.contas_pagar
          SET status = 'cancelado', atualizado_em = now()
        WHERE id = ANY($1::bigint[])`,
      [Array.from(apBuckets.canceled)]
    )
  }

  let nextPrId = Number((await client.query(`SELECT COALESCE(MAX(id),0) AS id FROM financeiro.pagamentos_recebidos`)).rows[0].id) + 1
  let nextPrLineId = Number((await client.query(`SELECT COALESCE(MAX(id),0) AS id FROM financeiro.pagamentos_recebidos_linhas`)).rows[0].id) + 1
  let nextPeId = Number((await client.query(`SELECT COALESCE(MAX(id),0) AS id FROM financeiro.pagamentos_efetuados`)).rows[0].id) + 1
  let nextPeLineId = Number((await client.query(`SELECT COALESCE(MAX(id),0) AS id FROM financeiro.pagamentos_efetuados_linhas`)).rows[0].id) + 1

  const accountIds = financeMaster.accountIds
  const methodIds = financeMaster.methodIds

  let arPaidIndex = 0
  for (const row of arRes.rows) {
    const id = Number(row.id)
    if (!arBuckets.paid.has(id)) continue

    const amount = Number(row.valor_liquido || 0)
    const paymentDate = pickPaymentDate(rng, row)
    const accountId = accountIds[arPaidIndex % accountIds.length]
    const methodId = methodIds[arPaidIndex % Math.max(methodIds.length, 1)]
    const num = `PR-${paymentDate.slice(0, 7).replace('-', '')}-${String(id).padStart(5, '0')}`

    await client.query(
      `INSERT INTO financeiro.pagamentos_recebidos
        (id, tenant_id, numero_pagamento, data_recebimento, data_lancamento, conta_financeira_id, metodo_pagamento_id, valor_total_recebido, status, observacao, criado_em, atualizado_em)
       VALUES
        ($1,$2,$3,$4,$4,$5,$6,$7,'confirmado',$8,now(),now())`,
      [
        nextPrId,
        TENANT_ID,
        num,
        paymentDate,
        accountId,
        methodId,
        amount,
        `Baixa automática de ${row.numero_documento}`,
      ]
    )

    await client.query(
      `INSERT INTO financeiro.pagamentos_recebidos_linhas
        (id, pagamento_id, conta_receber_id, valor_original_documento, valor_recebido, saldo_apos_recebimento, desconto_financeiro, juros, multa, criado_em)
       VALUES
        ($1,$2,$3,$4,$4,0,0,0,0,now())`,
      [nextPrLineId, nextPrId, id, amount]
    )

    await client.query(
      `UPDATE financeiro.contas_receber
          SET status = 'recebido',
              atualizado_em = now()
        WHERE id = $1`,
      [id]
    )

    nextPrId += 1
    nextPrLineId += 1
    arPaidIndex += 1
  }

  let apPaidIndex = 0
  for (const row of apRes.rows) {
    const id = Number(row.id)
    if (!apBuckets.paid.has(id)) continue

    const amount = Number(row.valor_liquido || 0)
    const paymentDate = pickPaymentDate(rng, row)
    const accountId = accountIds[apPaidIndex % accountIds.length]
    const methodId = methodIds[(apPaidIndex + 1) % Math.max(methodIds.length, 1)]
    const num = `PE-${paymentDate.slice(0, 7).replace('-', '')}-${String(id).padStart(5, '0')}`

    await client.query(
      `INSERT INTO financeiro.pagamentos_efetuados
        (id, tenant_id, numero_pagamento, data_pagamento, data_lancamento, conta_financeira_id, metodo_pagamento_id, valor_total_pagamento, status, observacao, criado_em, atualizado_em)
       VALUES
        ($1,$2,$3,$4,$4,$5,$6,$7,'confirmado',$8,now(),now())`,
      [
        nextPeId,
        TENANT_ID,
        num,
        paymentDate,
        accountId,
        methodId,
        amount,
        `Pagamento automático de ${row.numero_documento}`,
      ]
    )

    await client.query(
      `INSERT INTO financeiro.pagamentos_efetuados_linhas
        (id, pagamento_id, conta_pagar_id, valor_original_documento, valor_pago, saldo_apos_pagamento, desconto_financeiro, juros, multa, criado_em)
       VALUES
        ($1,$2,$3,$4,$4,0,0,0,0,now())`,
      [nextPeLineId, nextPeId, id, amount]
    )

    await client.query(
      `UPDATE financeiro.contas_pagar
          SET status = 'pago',
              conta_financeira_id = $1,
              atualizado_em = now()
        WHERE id = $2`,
      [accountId, id]
    )

    nextPeId += 1
    nextPeLineId += 1
    apPaidIndex += 1
  }

  return {
    contasReceber: {
      total: arRes.rowCount,
      pendente: arBuckets.pending.size,
      vencido: arBuckets.overdue.size,
      recebido: arBuckets.paid.size,
      cancelado: arBuckets.canceled.size,
    },
    contasPagar: {
      total: apRes.rowCount,
      pendente: apBuckets.pending.size,
      vencido: apBuckets.overdue.size,
      pago: apBuckets.paid.size,
      cancelado: apBuckets.canceled.size,
    },
  }
}

async function fixCrmOrphanActivities(client) {
  const orphanRes = await client.query(
    `SELECT id, responsavel_id
       FROM crm.atividades
      WHERE tenant_id = $1
        AND lead_id IS NULL
        AND oportunidade_id IS NULL
        AND conta_id IS NULL
        AND contato_id IS NULL
      ORDER BY id ASC`,
    [TENANT_ID]
  )

  if (orphanRes.rowCount === 0) return { total: 0, linked: 0 }

  const oppRes = await client.query(
    `SELECT id, vendedor_id, lead_id, conta_id
       FROM crm.oportunidades
      WHERE tenant_id = $1
      ORDER BY id ASC`,
    [TENANT_ID]
  )

  const leadRes = await client.query(
    `SELECT id, responsavel_id, conta_id, contato_id
       FROM crm.leads
      WHERE tenant_id = $1
      ORDER BY id ASC`,
    [TENANT_ID]
  )

  const contatoRes = await client.query(
    `SELECT id, conta_id
       FROM crm.contatos
      WHERE tenant_id = $1
      ORDER BY id ASC`,
    [TENANT_ID]
  )

  const leadById = new Map(leadRes.rows.map((r) => [Number(r.id), r]))
  const oppByResp = new Map()
  const leadByResp = new Map()
  const contatoByConta = new Map()

  for (const opp of oppRes.rows) {
    const key = Number(opp.vendedor_id || 0)
    if (!oppByResp.has(key)) oppByResp.set(key, [])
    oppByResp.get(key).push(opp)
  }

  for (const lead of leadRes.rows) {
    const key = Number(lead.responsavel_id || 0)
    if (!leadByResp.has(key)) leadByResp.set(key, [])
    leadByResp.get(key).push(lead)
  }

  for (const contato of contatoRes.rows) {
    const contaId = Number(contato.conta_id || 0)
    if (!contatoByConta.has(contaId)) contatoByConta.set(contaId, [])
    contatoByConta.get(contaId).push(Number(contato.id))
  }

  const anyOpp = oppRes.rows
  const anyLead = leadRes.rows
  let linked = 0

  for (let i = 0; i < orphanRes.rows.length; i += 1) {
    const act = orphanRes.rows[i]
    const respId = Number(act.responsavel_id || 0)

    const respOppList = oppByResp.get(respId) || []
    const respLeadList = leadByResp.get(respId) || []

    const opp = respOppList.length > 0
      ? respOppList[i % respOppList.length]
      : (anyOpp.length > 0 ? anyOpp[i % anyOpp.length] : null)

    let lead = null
    if (opp?.lead_id) {
      lead = leadById.get(Number(opp.lead_id)) || null
    }
    if (!lead) {
      if (respLeadList.length > 0) lead = respLeadList[i % respLeadList.length]
      else if (anyLead.length > 0) lead = anyLead[i % anyLead.length]
    }

    const oportunidadeId = opp ? Number(opp.id) : null
    const leadId = lead ? Number(lead.id) : (opp?.lead_id ? Number(opp.lead_id) : null)
    const contaId =
      (opp?.conta_id ? Number(opp.conta_id) : null)
      || (lead?.conta_id ? Number(lead.conta_id) : null)
      || null

    let contatoId = lead?.contato_id ? Number(lead.contato_id) : null
    if (!contatoId && contaId && contatoByConta.get(contaId)?.length) {
      const list = contatoByConta.get(contaId)
      contatoId = list[i % list.length]
    }

    await client.query(
      `UPDATE crm.atividades
          SET oportunidade_id = COALESCE($1, oportunidade_id),
              lead_id = COALESCE($2, lead_id),
              conta_id = COALESCE($3, conta_id),
              contato_id = COALESCE($4, contato_id),
              atualizado_em = now()
        WHERE id = $5`,
      [oportunidadeId, leadId, contaId, contatoId, Number(act.id)]
    )

    linked += 1
  }

  return { total: orphanRes.rowCount, linked }
}

async function ensureDriveFolders(client, workspaceId, ownerId, names) {
  const out = new Map()
  for (const name of names) {
    const found = await client.query(
      `SELECT id::text AS id
         FROM drive.folders
        WHERE workspace_id = $1::uuid
          AND parent_id IS NULL
          AND lower(name) = lower($2)
        ORDER BY created_at ASC
        LIMIT 1`,
      [workspaceId, name]
    )

    if (found.rowCount > 0) {
      const id = String(found.rows[0].id)
      out.set(name, id)
      await client.query(`UPDATE drive.folders SET deleted_at = NULL, updated_at = now() WHERE id = $1::uuid`, [id])
      continue
    }

    const created = await client.query(
      `INSERT INTO drive.folders (workspace_id, parent_id, name, created_by)
       VALUES ($1::uuid, NULL, $2, $3)
       RETURNING id::text AS id`,
      [workspaceId, name, ownerId]
    )
    out.set(name, String(created.rows[0].id))
  }
  return out
}

async function sanitizeDriveData(client, rng) {
  const wsRes = await client.query(
    `SELECT id::text AS id, owner_id
       FROM drive.workspaces
      WHERE archived_at IS NULL
      ORDER BY created_at ASC
      LIMIT 1`
  )
  if (wsRes.rowCount === 0) return { movedFiles: 0, deletedFiles: 0 }

  const workspaceId = String(wsRes.rows[0].id)
  const ownerId = Number(wsRes.rows[0].owner_id || 1)

  const targetFolderNames = [
    'Financeiro - Titulos e Comprovantes',
    'Comercial - CRM e Vendas',
    'Compras - Fornecedores',
    'Estoque - Catalogo e Inventario',
    'Administrativo - Contratos',
  ]

  const folderMap = await ensureDriveFolders(client, workspaceId, ownerId, targetFolderNames)
  const financeFolderId = folderMap.get('Financeiro - Titulos e Comprovantes')

  const filesRes = await client.query(
    `SELECT id::text AS id, folder_id::text AS folder_id, name, mime
       FROM drive.files
      WHERE workspace_id = $1::uuid
        AND deleted_at IS NULL
      ORDER BY created_at ASC`,
    [workspaceId]
  )

  const arDocs = await client.query(
    `SELECT cr.numero_documento,
            cr.data_vencimento::text AS data_vencimento,
            c.nome_fantasia AS entidade
       FROM financeiro.contas_receber cr
       JOIN entidades.clientes c ON c.id = cr.cliente_id
      WHERE cr.tenant_id = $1
      ORDER BY cr.valor_liquido DESC, cr.id ASC
      LIMIT 3`,
    [TENANT_ID]
  )

  const apDocs = await client.query(
    `SELECT cp.numero_documento,
            cp.data_vencimento::text AS data_vencimento,
            f.nome_fantasia AS entidade
       FROM financeiro.contas_pagar cp
       JOIN entidades.fornecedores f ON f.id = cp.fornecedor_id
      WHERE cp.tenant_id = $1
      ORDER BY cp.valor_liquido DESC, cp.id ASC
      LIMIT 3`,
    [TENANT_ID]
  )

  const renameTargets = []
  for (const row of apDocs.rows) {
    renameTargets.push(
      `AP_${sanitizeName(row.numero_documento, 30)}_${sanitizeName(row.entidade, 34)}_venc-${toDateOnly(row.data_vencimento)}.pdf`
    )
  }
  for (const row of arDocs.rows) {
    renameTargets.push(
      `AR_${sanitizeName(row.numero_documento, 30)}_${sanitizeName(row.entidade, 34)}_venc-${toDateOnly(row.data_vencimento)}.pdf`
    )
  }

  const financeCandidates = filesRes.rows.filter((f) => String(f.mime || '').toLowerCase().includes('pdf'))
  const selectedForKeep = financeCandidates.slice(0, Math.min(financeCandidates.length, renameTargets.length))

  let movedFiles = 0
  for (let i = 0; i < selectedForKeep.length; i += 1) {
    const file = selectedForKeep[i]
    const newName = renameTargets[i]
    await client.query(
      `UPDATE drive.files
          SET folder_id = $1::uuid,
              name = $2,
              updated_at = now(),
              deleted_at = NULL
        WHERE id = $3::uuid`,
      [financeFolderId, newName, file.id]
    )
    movedFiles += 1
  }

  const keepFileIds = new Set(selectedForKeep.map((f) => String(f.id)))
  const toDeleteIds = filesRes.rows
    .map((f) => String(f.id))
    .filter((id) => !keepFileIds.has(id))

  if (toDeleteIds.length > 0) {
    await client.query(
      `UPDATE drive.files
          SET deleted_at = now(),
              updated_at = now()
        WHERE id = ANY($1::uuid[])`,
      [toDeleteIds]
    )
  }

  const keepFolderIds = Array.from(folderMap.values())
  await client.query(
    `UPDATE drive.folders
        SET deleted_at = CASE WHEN id::text = ANY($2::text[]) THEN NULL ELSE now() END,
            updated_at = now()
      WHERE workspace_id = $1::uuid`,
    [workspaceId, keepFolderIds]
  )

  return {
    movedFiles,
    deletedFiles: toDeleteIds.length,
    activeFolders: keepFolderIds.length,
  }
}

async function ensureLocalEmailSchema(client) {
  await client.query(`CREATE SCHEMA IF NOT EXISTS email`)

  await client.query(
    `CREATE TABLE IF NOT EXISTS email.inboxes (
      id text PRIMARY KEY,
      username text NOT NULL,
      domain text NOT NULL DEFAULT 'aurorasemijoias.com.br',
      email text NOT NULL,
      display_name text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      archived_at timestamptz NULL
    )`
  )

  await client.query(
    `CREATE TABLE IF NOT EXISTS email.messages (
      id text PRIMARY KEY,
      inbox_id text NOT NULL REFERENCES email.inboxes(id) ON DELETE CASCADE,
      thread_id text NULL,
      subject text NOT NULL,
      snippet text NOT NULL,
      text_body text NULL,
      html_body text NULL,
      from_name text NULL,
      from_email text NULL,
      to_recipients jsonb NOT NULL DEFAULT '[]'::jsonb,
      cc_recipients jsonb NOT NULL DEFAULT '[]'::jsonb,
      bcc_recipients jsonb NOT NULL DEFAULT '[]'::jsonb,
      labels jsonb NOT NULL DEFAULT '[]'::jsonb,
      attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
      unread boolean NOT NULL DEFAULT true,
      draft boolean NOT NULL DEFAULT false,
      sent boolean NOT NULL DEFAULT false,
      junk boolean NOT NULL DEFAULT false,
      trashed boolean NOT NULL DEFAULT false,
      archived boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      deleted_at timestamptz NULL
    )`
  )

  await client.query(`CREATE INDEX IF NOT EXISTS idx_email_messages_inbox_created ON email.messages (inbox_id, created_at DESC)`)
}

async function seedLocalEmail(client, rng) {
  await ensureLocalEmailSchema(client)

  await client.query(`DELETE FROM email.messages`)
  await client.query(`DELETE FROM email.inboxes`)

  const inboxes = [
    {
      id: 'ibx-financeiro',
      username: 'financeiro',
      domain: 'aurorasemijoias.com.br',
      email: 'financeiro@aurorasemijoias.com.br',
      display_name: 'Financeiro',
    },
    {
      id: 'ibx-compras',
      username: 'compras',
      domain: 'aurorasemijoias.com.br',
      email: 'compras@aurorasemijoias.com.br',
      display_name: 'Compras',
    },
    {
      id: 'ibx-comercial',
      username: 'comercial',
      domain: 'aurorasemijoias.com.br',
      email: 'comercial@aurorasemijoias.com.br',
      display_name: 'Comercial',
    },
    {
      id: 'ibx-operacoes',
      username: 'operacoes',
      domain: 'aurorasemijoias.com.br',
      email: 'operacoes@aurorasemijoias.com.br',
      display_name: 'Operações',
    },
  ]

  for (const inbox of inboxes) {
    await client.query(
      `INSERT INTO email.inboxes (id, username, domain, email, display_name, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,now(),now())`,
      [inbox.id, inbox.username, inbox.domain, inbox.email, inbox.display_name]
    )
  }

  const arRows = await client.query(
    `SELECT cr.numero_documento,
            cr.status,
            cr.data_vencimento::text AS data_vencimento,
            cr.valor_liquido,
            c.nome_fantasia AS cliente_nome,
            c.email AS cliente_email
       FROM financeiro.contas_receber cr
       JOIN entidades.clientes c ON c.id = cr.cliente_id
      WHERE cr.tenant_id = $1
      ORDER BY cr.data_vencimento ASC, cr.id ASC
      LIMIT 16`,
    [TENANT_ID]
  )

  const apRows = await client.query(
    `SELECT cp.numero_documento,
            cp.status,
            cp.data_vencimento::text AS data_vencimento,
            cp.valor_liquido,
            f.nome_fantasia AS fornecedor_nome,
            f.email AS fornecedor_email
       FROM financeiro.contas_pagar cp
       JOIN entidades.fornecedores f ON f.id = cp.fornecedor_id
      WHERE cp.tenant_id = $1
      ORDER BY cp.data_vencimento ASC, cp.id ASC
      LIMIT 14`,
    [TENANT_ID]
  )

  const oppRows = await client.query(
    `SELECT o.nome,
            o.status,
            o.valor_estimado,
            COALESCE(ct.nome, l.nome, c.nome, 'Lead') AS contato_nome,
            COALESCE(ct.email, l.email, 'contato@cliente.com') AS contato_email,
            COALESCE(c.nome, l.empresa, 'Conta') AS conta_nome
       FROM crm.oportunidades o
       LEFT JOIN crm.leads l ON l.id = o.lead_id
       LEFT JOIN crm.contas c ON c.id = o.conta_id
       LEFT JOIN crm.contatos ct ON ct.id = l.contato_id
      WHERE o.tenant_id = $1
      ORDER BY o.atualizado_em DESC, o.id DESC
      LIMIT 14`,
    [TENANT_ID]
  )

  const estoqueRows = await client.query(
    `SELECT p.nome AS produto_nome,
            COALESCE(SUM(e.quantidade),0)::int AS saldo_total
       FROM estoque.estoques_atual e
       JOIN produtos.produto p ON p.id = e.produto_id
      GROUP BY p.id, p.nome
      ORDER BY saldo_total ASC, p.nome ASC
      LIMIT 8`
  )

  const messages = []
  let cursorDay = -20

  function nextTimestamp(stepHours = 5) {
    const rawDayBase = addDays(TODAY_ISO, cursorDay)
    const dayBase = rawDayBase > TODAY_ISO ? TODAY_ISO : rawDayBase
    const hour = 8 + Math.floor((messages.length * stepHours) % 10)
    const minute = Math.floor(rng() * 60)
    if (messages.length % 3 === 0) cursorDay += 1
    return `${dayBase} ${pad2(hour)}:${pad2(minute)}:00+00`
  }

  function addMessage(payload) {
    const id = `msg-${String(messages.length + 1).padStart(4, '0')}`
    const subject = String(payload.subject || 'Sem assunto').trim()
    const textBody = String(payload.text || '').trim()
    const snippet = (textBody || subject).slice(0, 180)

    messages.push({
      id,
      inbox_id: payload.inbox_id,
      thread_id: payload.thread_id || `thr-${id}`,
      subject,
      snippet,
      text_body: textBody,
      html_body: payload.html || null,
      from_name: payload.from_name || null,
      from_email: payload.from_email || null,
      to_recipients: JSON.stringify(toRecipientList(payload.to || [])),
      cc_recipients: JSON.stringify(toRecipientList(payload.cc || [])),
      bcc_recipients: JSON.stringify(toRecipientList(payload.bcc || [])),
      labels: JSON.stringify(Array.isArray(payload.labels) ? payload.labels : []),
      attachments: JSON.stringify(Array.isArray(payload.attachments) ? payload.attachments : []),
      unread: Boolean(payload.unread),
      draft: Boolean(payload.draft),
      sent: Boolean(payload.sent),
      junk: Boolean(payload.junk),
      trashed: Boolean(payload.trashed),
      archived: Boolean(payload.archived),
      created_at: payload.created_at || nextTimestamp(),
    })
  }

  for (const row of arRows.rows) {
    const clientName = String(row.cliente_nome || 'Cliente')
    const clientEmail = String(row.cliente_email || 'financeiro.cliente@empresa.com').trim() || 'financeiro.cliente@empresa.com'
    const amount = Number(row.valor_liquido || 0).toFixed(2)
    const due = toDateOnly(row.data_vencimento)
    const status = String(row.status || '').toLowerCase()

    addMessage({
      inbox_id: 'ibx-financeiro',
      thread_id: `thr-ar-${sanitizeName(row.numero_documento, 32)}`,
      subject: `Título ${row.numero_documento} - ${clientName}`,
      text: `Olá, time financeiro. Confirmam o envio do boleto do título ${row.numero_documento}? Valor R$ ${amount} com vencimento em ${due}.`,
      from_name: clientName,
      from_email: clientEmail,
      to: [{ name: 'Financeiro Aurora', email: 'financeiro@aurorasemijoias.com.br' }],
      labels: ['inbox', 'updates', 'financeiro', status],
      unread: status !== 'recebido',
    })

    if (status === 'vencido') {
      addMessage({
        inbox_id: 'ibx-financeiro',
        thread_id: `thr-ar-${sanitizeName(row.numero_documento, 32)}`,
        subject: `Follow-up cobrança ${row.numero_documento}`,
        text: `Prezados, segue reforço da cobrança do documento ${row.numero_documento}. Favor programar quitação hoje para evitar bloqueio de novos pedidos.`,
        from_name: 'Financeiro Aurora',
        from_email: 'financeiro@aurorasemijoias.com.br',
        to: [{ name: clientName, email: clientEmail }],
        labels: ['sent', 'financeiro', 'cobranca'],
        sent: true,
        unread: false,
      })
    }

    if (status === 'recebido') {
      addMessage({
        inbox_id: 'ibx-financeiro',
        thread_id: `thr-ar-${sanitizeName(row.numero_documento, 32)}`,
        subject: `Comprovante recebido ${row.numero_documento}`,
        text: `Recebimento identificado para ${row.numero_documento}. Valor conciliado e título baixado em sistema.`,
        from_name: 'Financeiro Aurora',
        from_email: 'financeiro@aurorasemijoias.com.br',
        to: [{ name: clientName, email: clientEmail }],
        labels: ['sent', 'financeiro', 'conciliado'],
        sent: true,
        unread: false,
      })
    }
  }

  for (const row of apRows.rows) {
    const supplierName = String(row.fornecedor_nome || 'Fornecedor')
    const supplierEmail = String(row.fornecedor_email || 'financeiro@fornecedor.com').trim() || 'financeiro@fornecedor.com'
    const amount = Number(row.valor_liquido || 0).toFixed(2)
    const due = toDateOnly(row.data_vencimento)
    const status = String(row.status || '').toLowerCase()

    addMessage({
      inbox_id: 'ibx-compras',
      thread_id: `thr-ap-${sanitizeName(row.numero_documento, 32)}`,
      subject: `Fatura ${row.numero_documento} - ${supplierName}`,
      text: `Bom dia. Enviamos a fatura ${row.numero_documento} no valor de R$ ${amount}, vencimento ${due}. Favor confirmar programação de pagamento.`,
      from_name: supplierName,
      from_email: supplierEmail,
      to: [{ name: 'Compras Aurora', email: 'compras@aurorasemijoias.com.br' }],
      labels: ['inbox', 'updates', 'fornecedor', status],
      unread: status !== 'pago',
    })

    if (status === 'pago') {
      addMessage({
        inbox_id: 'ibx-compras',
        thread_id: `thr-ap-${sanitizeName(row.numero_documento, 32)}`,
        subject: `Comprovante de pagamento ${row.numero_documento}`,
        text: `Pagamento do documento ${row.numero_documento} concluído. Valor de R$ ${amount} liquidado e comprovante enviado ao fornecedor.`,
        from_name: 'Financeiro Aurora',
        from_email: 'financeiro@aurorasemijoias.com.br',
        to: [{ name: supplierName, email: supplierEmail }],
        labels: ['sent', 'financeiro', 'pagamento'],
        sent: true,
        unread: false,
      })
    }
  }

  for (const row of oppRows.rows) {
    const contatoNome = String(row.contato_nome || 'Contato')
    const contatoEmail = String(row.contato_email || 'contato@empresa.com').trim() || 'contato@empresa.com'
    const contaNome = String(row.conta_nome || 'Conta')
    const valor = Number(row.valor_estimado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })

    addMessage({
      inbox_id: 'ibx-comercial',
      thread_id: `thr-opp-${sanitizeName(row.nome, 28)}`,
      subject: `Próximos passos - ${row.nome}`,
      text: `Olá, ${contatoNome}. Segue proposta atualizada para ${contaNome}, com escopo revisado e estimativa de R$ ${valor}. Podemos fechar agenda de validação comercial amanhã?`,
      from_name: 'Comercial Aurora',
      from_email: 'comercial@aurorasemijoias.com.br',
      to: [{ name: contatoNome, email: contatoEmail }],
      labels: ['sent', 'crm', String(row.status || 'aberta').toLowerCase()],
      sent: true,
      unread: false,
    })

    addMessage({
      inbox_id: 'ibx-comercial',
      thread_id: `thr-opp-${sanitizeName(row.nome, 28)}`,
      subject: `RE: ${row.nome}`,
      text: `Recebido. Podemos avançar com o cronograma e SLA, mantendo início na próxima semana?`,
      from_name: contatoNome,
      from_email: contatoEmail,
      to: [{ name: 'Comercial Aurora', email: 'comercial@aurorasemijoias.com.br' }],
      labels: ['inbox', 'crm', 'updates'],
      unread: true,
    })
  }

  for (const row of estoqueRows.rows) {
    const saldo = Number(row.saldo_total || 0)
    const produto = String(row.produto_nome || 'Produto')
    const criticidade = saldo <= 24 ? 'alto' : (saldo <= 45 ? 'medio' : 'baixo')

    addMessage({
      inbox_id: 'ibx-operacoes',
      thread_id: `thr-stock-${sanitizeName(produto, 28)}`,
      subject: `Alerta de estoque ${produto}`,
      text: `Produto ${produto} com saldo consolidado de ${saldo} unidades. Criticidade ${criticidade}. Recomendar reposição e ajuste de ponto de pedido.`,
      from_name: 'WMS Bot',
      from_email: 'wms@aurorasemijoias.com.br',
      to: [{ name: 'Operações Aurora', email: 'operacoes@aurorasemijoias.com.br' }],
      labels: ['inbox', 'estoque', criticidade === 'alto' ? 'updates' : 'forums'],
      unread: criticidade !== 'baixo',
    })
  }

  for (const msg of messages) {
    await client.query(
      `INSERT INTO email.messages
        (id, inbox_id, thread_id, subject, snippet, text_body, html_body, from_name, from_email, to_recipients, cc_recipients, bcc_recipients, labels, attachments, unread, draft, sent, junk, trashed, archived, created_at, updated_at)
       VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb,$12::jsonb,$13::jsonb,$14::jsonb,$15,$16,$17,$18,$19,$20,$21,now())`,
      [
        msg.id,
        msg.inbox_id,
        msg.thread_id,
        msg.subject,
        msg.snippet,
        msg.text_body,
        msg.html_body,
        msg.from_name,
        msg.from_email,
        msg.to_recipients,
        msg.cc_recipients,
        msg.bcc_recipients,
        msg.labels,
        msg.attachments,
        msg.unread,
        msg.draft,
        msg.sent,
        msg.junk,
        msg.trashed,
        msg.archived,
        msg.created_at,
      ]
    )
  }

  return { inboxes: inboxes.length, messages: messages.length }
}

function getArg(name) {
  const idx = process.argv.indexOf(name)
  if (idx === -1) return null
  return process.argv[idx + 1] ?? null
}

async function runInTransaction(client, fn) {
  await client.query('BEGIN')
  try {
    const result = await fn()
    await client.query('COMMIT')
    return result
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  }
}

async function main() {
  loadEnvFiles()

  const dbUrl = process.env.SUPABASE_DB_URL
  if (!dbUrl) {
    console.error('SUPABASE_DB_URL ausente.')
    process.exit(1)
  }

  const requestedStep = String(getArg('--step') || '').trim().toLowerCase()
  const allSteps = [
    'finance_master',
    'finance_lifecycle',
    'crm_orphans',
    'drive_cleanup',
    'email_seed',
  ]

  const steps = requestedStep ? [requestedStep] : allSteps
  for (const step of steps) {
    if (!allSteps.includes(step)) {
      throw new Error(`Step inválido: ${step}. Use: ${allSteps.join(', ')}`)
    }
  }

  const rng = createRng(2026021701)
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()
  try {
    const summary = { ok: true, steps: {} }

    for (const step of steps) {
      if (step === 'finance_master') {
        const result = await runInTransaction(client, async () => ensureFinanceMasterData(client))
        summary.steps[step] = { success: true, result }
        continue
      }

      if (step === 'finance_lifecycle') {
        const result = await runInTransaction(client, async () => {
          const master = await ensureFinanceMasterData(client)
          return reseedFinanceLifecycle(client, master, rng)
        })
        summary.steps[step] = { success: true, result }
        continue
      }

      if (step === 'crm_orphans') {
        const result = await runInTransaction(client, async () => fixCrmOrphanActivities(client))
        summary.steps[step] = { success: true, result }
        continue
      }

      if (step === 'drive_cleanup') {
        const result = await runInTransaction(client, async () => sanitizeDriveData(client, rng))
        summary.steps[step] = { success: true, result }
        continue
      }

      if (step === 'email_seed') {
        const result = await runInTransaction(client, async () => seedLocalEmail(client, rng))
        summary.steps[step] = { success: true, result }
        continue
      }
    }

    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`)
  } finally {
    await client.end().catch(() => {})
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error))
  process.exit(1)
})
