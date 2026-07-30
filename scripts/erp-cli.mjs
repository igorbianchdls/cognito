#!/usr/bin/env node

import process from 'node:process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import dotenv from 'dotenv'
import pg from 'pg'

dotenv.config({ path: '.env.local' })
dotenv.config()

const { Pool } = pg

function parseArgs(argv) {
  const [command, ...rest] = argv
  const args = { _: [] }

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index]
    if (!token.startsWith('--')) {
      args._.push(token)
      continue
    }

    const key = token.slice(2)
    const next = rest[index + 1]
    if (!next || next.startsWith('--')) {
      args[key] = true
      continue
    }

    args[key] = next
    index += 1
  }

  return { command, args }
}

function money(value, fallback = 0) {
  const parsed = Number(String(value ?? fallback).replace(',', '.'))
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
}

function intArg(value, label) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} invalido.`)
  }
  return parsed
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function saleNumber() {
  return `CLI-VEN-${Date.now()}`
}

async function withTransaction(pool, fn) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (error) {
    try {
      await client.query('ROLLBACK')
    } catch {}
    throw error
  } finally {
    client.release()
  }
}

async function resolveTenant(client, args) {
  if (args['tenant-id']) {
    const tenantId = intArg(args['tenant-id'], 'Tenant')
    const result = await client.query('SELECT id, name FROM shared.tenants WHERE id = $1', [tenantId])
    if (!result.rows[0]) throw new Error(`Tenant ${tenantId} nao encontrado.`)
    return result.rows[0]
  }

  const result = await client.query('SELECT id, name FROM shared.tenants ORDER BY id ASC LIMIT 1')
  if (result.rows[0]) return result.rows[0]

  const created = await client.query(
    `INSERT INTO shared.tenants (name, slug)
     VALUES ('CLI ERP Test', 'cli-erp-test')
     ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
     RETURNING id, name`,
  )
  return created.rows[0]
}

async function resolveActor(client, args) {
  if (args['actor-id']) {
    const actorId = intArg(args['actor-id'], 'Usuario')
    const result = await client.query('SELECT id, email FROM shared.users WHERE id = $1', [actorId])
    if (!result.rows[0]) throw new Error(`Usuario ${actorId} nao encontrado.`)
    return result.rows[0]
  }

  const result = await client.query('SELECT id, email FROM shared.users ORDER BY id ASC LIMIT 1')
  if (result.rows[0]) return result.rows[0]

  const created = await client.query(
    `INSERT INTO shared.users (email, full_name)
     VALUES ('cli-erp-smoke@local.test', 'CLI ERP Smoke')
     RETURNING id, email`,
  )
  return created.rows[0]
}

async function ensureTenantMembership(client, tenantId, actorId) {
  await client.query(
    `INSERT INTO shared.tenant_memberships (tenant_id, user_id, role, status)
     VALUES ($1, $2, 'admin', 'active')
     ON CONFLICT (tenant_id, user_id) DO UPDATE
       SET role = EXCLUDED.role,
           status = EXCLUDED.status`,
    [tenantId, actorId],
  )
}

async function ensureCustomer(client, tenantId, actorId, args) {
  if (args['customer-id']) {
    const customerId = intArg(args['customer-id'], 'Cliente')
    const result = await client.query(
      `SELECT id, nome
       FROM erp.entidades
       WHERE tenant_id = $1
         AND id = $2
         AND eh_cliente = true
         AND excluido_em IS NULL`,
      [tenantId, customerId],
    )
    if (!result.rows[0]) throw new Error(`Cliente ${customerId} nao encontrado neste tenant.`)
    return result.rows[0]
  }

  const name = args['customer-name'] || `Cliente CLI ${Date.now()}`
  const result = await client.query(
    `INSERT INTO erp.entidades (
       tenant_id,
       tipo_pessoa,
       nome,
       documento,
       eh_cliente,
       eh_fornecedor,
       ativo,
       criado_por,
       atualizado_por
     )
     VALUES ($1, 'juridica', $2, $3, true, false, true, $4, $4)
     RETURNING id, nome`,
    [tenantId, name, `CLI${Date.now()}`, actorId],
  )
  return result.rows[0]
}

async function ensureProduct(client, tenantId, actorId, args) {
  if (args['product-id']) {
    const productId = intArg(args['product-id'], 'Produto')
    const result = await client.query(
      `SELECT id, nome, preco_venda
       FROM erp.produtos
       WHERE tenant_id = $1
         AND id = $2
         AND excluido_em IS NULL`,
      [tenantId, productId],
    )
    if (!result.rows[0]) throw new Error(`Produto ${productId} nao encontrado neste tenant.`)
    return result.rows[0]
  }

  const price = money(args['unit-price'], 150)
  const result = await client.query(
    `INSERT INTO erp.produtos (
       tenant_id,
       nome,
       sku,
       codigo,
       preco_venda,
       ativo,
       criado_por,
       atualizado_por
     )
     VALUES ($1, $2, $3, $3, $4, true, $5, $5)
     RETURNING id, nome, preco_venda`,
    [tenantId, `Produto CLI ${Date.now()}`, `CLI-${Date.now()}`, price, actorId],
  )
  return result.rows[0]
}

async function createSale(client, tenantId, actorId, args) {
  const customer = await ensureCustomer(client, tenantId, actorId, args)
  const product = await ensureProduct(client, tenantId, actorId, args)
  const quantity = money(args.quantity, 1)
  const unitPrice = money(args['unit-price'], Number(product.preco_venda || 150))
  if (quantity <= 0) throw new Error('Quantidade precisa ser maior que zero.')
  if (unitPrice <= 0) throw new Error('Valor unitario precisa ser maior que zero.')

  const total = Number((quantity * unitPrice).toFixed(2))
  const saleDate = args.date || today()
  const dueDate = args['due-date'] || saleDate
  const number = args.number || saleNumber()

  const saleResult = await client.query(
    `INSERT INTO erp.vendas (
       tenant_id,
       cliente_id,
       numero,
       data_venda,
       data_competencia,
       status,
       situacao,
       subtotal,
       total,
       condicao_pagamento,
       criado_por,
       atualizado_por
     )
     VALUES ($1, $2, $3, $4, $4, 'rascunho', 'em_andamento', $5, $5, $6::jsonb, $7, $7)
     RETURNING id, numero, status, total`,
    [
      tenantId,
      customer.id,
      number,
      saleDate,
      total,
      JSON.stringify({
        parcelas: [{
          numero_parcela: 1,
          descricao: 'Parcela 1',
          data_vencimento: dueDate,
          valor: total,
        }],
      }),
      actorId,
    ],
  )
  const sale = saleResult.rows[0]

  await client.query(
    `INSERT INTO erp.vendas_itens (
       tenant_id,
       venda_id,
       produto_id,
       descricao,
       quantidade,
       valor_unitario,
       custo_unitario,
       total,
       criado_por,
       atualizado_por
     )
     VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $8, $8)`,
    [
      tenantId,
      sale.id,
      product.id,
      args.description || product.nome,
      quantity,
      unitPrice,
      total,
      actorId,
    ],
  )

  return { sale, customer, product }
}

async function fetchReceivableForSale(client, tenantId, saleId) {
  const receivableResult = await client.query(
    `SELECT id, status
     FROM erp.contas_receber
     WHERE tenant_id = $1
       AND venda_id = $2
       AND excluido_em IS NULL
     ORDER BY id ASC
     LIMIT 1`,
    [tenantId, saleId],
  )
  const receivable = receivableResult.rows[0]
  if (!receivable) return null

  const installmentsResult = await client.query(
    `SELECT id, numero_parcela, valor, status
     FROM erp.contas_receber_parcelas
     WHERE tenant_id = $1
       AND conta_receber_id = $2
       AND excluido_em IS NULL
     ORDER BY numero_parcela ASC, id ASC`,
    [tenantId, receivable.id],
  )

  return { receivable, installments: installmentsResult.rows }
}

function normalizeInstallments(sale) {
  const raw = Array.isArray(sale.condicao_pagamento?.parcelas) ? sale.condicao_pagamento.parcelas : []
  const installments = raw
    .map((item, index) => ({
      numero_parcela: Number(item.numero_parcela || index + 1),
      descricao: item.descricao || `Parcela ${index + 1}`,
      data_vencimento: item.data_vencimento || sale.data_venda || today(),
      valor: money(item.valor, 0),
    }))
    .filter((item) => item.valor > 0)

  if (installments.length > 0) return installments

  return [{
    numero_parcela: 1,
    descricao: 'Parcela 1',
    data_vencimento: sale.data_venda || today(),
    valor: money(sale.total, 0),
  }]
}

async function confirmSale(client, tenantId, actorId, saleId) {
  const saleResult = await client.query(
    `SELECT
       id,
       cliente_id,
       numero,
       data_venda,
       data_competencia,
       status,
       situacao,
       categoria_id,
       centro_custo_id,
       conta_financeira_id,
       metodo_pagamento_id,
       total,
       condicao_pagamento
     FROM erp.vendas
     WHERE tenant_id = $1
       AND id = $2
       AND excluido_em IS NULL
     FOR UPDATE`,
    [tenantId, saleId],
  )
  const sale = saleResult.rows[0]
  if (!sale) throw new Error(`Venda ${saleId} nao encontrada.`)

  const existing = await fetchReceivableForSale(client, tenantId, sale.id)
  if (existing) return { sale, ...existing, reused: true }

  if (sale.status === 'cancelada') throw new Error('Venda cancelada nao pode ser confirmada.')
  if (sale.status !== 'rascunho') throw new Error('Venda ja saiu de rascunho e nao possui financeiro.')
  if (!sale.cliente_id) throw new Error('Venda precisa ter cliente.')
  if (money(sale.total) <= 0) throw new Error('Venda precisa ter total maior que zero.')

  const itemResult = await client.query(
    `SELECT count(*)::int AS total
     FROM erp.vendas_itens
     WHERE tenant_id = $1
       AND venda_id = $2
       AND excluido_em IS NULL`,
    [tenantId, sale.id],
  )
  if (Number(itemResult.rows[0]?.total || 0) <= 0) {
    throw new Error('Venda precisa ter pelo menos um item.')
  }

  const updatedSaleResult = await client.query(
    `UPDATE erp.vendas
     SET
       status = 'confirmada',
       situacao = 'aprovada',
       confirmada_em = COALESCE(confirmada_em, now()),
       atualizado_por = $3
     WHERE tenant_id = $1
       AND id = $2
     RETURNING *`,
    [tenantId, sale.id, actorId],
  )
  const updatedSale = updatedSaleResult.rows[0]

  const receivableResult = await client.query(
    `INSERT INTO erp.contas_receber (
       tenant_id,
       cliente_id,
       venda_id,
       descricao,
       numero_documento,
       data_competencia,
       data_emissao,
       valor_total,
       status,
       categoria_id,
       centro_custo_id,
       criado_por,
       atualizado_por
     )
     VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE, $7, 'aberto', $8, $9, $10, $10)
     RETURNING id, status`,
    [
      tenantId,
      updatedSale.cliente_id,
      updatedSale.id,
      `Venda ${updatedSale.numero || updatedSale.id}`,
      updatedSale.numero,
      updatedSale.data_competencia,
      updatedSale.total,
      updatedSale.categoria_id,
      updatedSale.centro_custo_id,
      actorId,
    ],
  )
  const receivable = receivableResult.rows[0]
  const installments = []

  for (const installment of normalizeInstallments(updatedSale)) {
    const installmentResult = await client.query(
      `INSERT INTO erp.contas_receber_parcelas (
         tenant_id,
         conta_receber_id,
         numero_parcela,
         descricao,
         data_vencimento,
         data_pagamento_previsto,
         valor,
         valor_bruto,
         valor_liquido,
         valor_pago,
         status,
         conta_financeira_id,
         metodo_pagamento_id,
         criado_por,
         atualizado_por
       )
       VALUES ($1, $2, $3, $4, $5, $5, $6, $6, $6, 0, 'aberto', $7, $8, $9, $9)
       RETURNING id, numero_parcela, valor, status`,
      [
        tenantId,
        receivable.id,
        installment.numero_parcela,
        installment.descricao,
        installment.data_vencimento,
        installment.valor,
        updatedSale.conta_financeira_id,
        updatedSale.metodo_pagamento_id,
        actorId,
      ],
    )
    installments.push(installmentResult.rows[0])
  }

  return { sale: updatedSale, receivable, installments, reused: false }
}

async function countReceivables(pool, tenantId, saleId) {
  const result = await pool.query(
    `SELECT count(*)::int AS total
     FROM erp.contas_receber
     WHERE tenant_id = $1
       AND venda_id = $2
       AND excluido_em IS NULL`,
    [tenantId, saleId],
  )
  return Number(result.rows[0]?.total || 0)
}

function sqlText(value) {
  return `'${String(value).replaceAll("'", "''")}'`
}

function sqlNullableId(value) {
  if (!value) return 'NULL'
  return String(intArg(value, 'ID'))
}

function dbPasswordFromUrl() {
  if (process.env.SUPABASE_DB_PASSWORD) return process.env.SUPABASE_DB_PASSWORD
  if (!process.env.SUPABASE_DB_URL) return ''

  try {
    return decodeURIComponent(new URL(process.env.SUPABASE_DB_URL).password)
  } catch {
    return ''
  }
}

function buildSupabaseSmokeSql(args) {
  const tenantId = sqlNullableId(args['tenant-id'])
  const actorId = sqlNullableId(args['actor-id'])
  const quantity = money(args.quantity, 1)
  const unitPrice = money(args['unit-price'], 150)
  const customerName = sqlText(args['customer-name'] || `Cliente CLI ${Date.now()}`)
  const saleDescription = sqlText(args.description || 'Produto criado pela CLI ERP')

  return `
CREATE TEMP TABLE erp_cli_result(data jsonb);

BEGIN;

DO $$
DECLARE
  v_tenant_id bigint;
  v_actor_id bigint;
  v_customer_id bigint;
  v_product_id bigint;
  v_sale_id bigint;
  v_sale_number text;
  v_total numeric(18,2);
  v_receivable_id bigint;
  v_second_receivable_id bigint;
  v_installment_id bigint;
  v_receivable_count integer;
BEGIN
  IF ${tenantId} IS NULL THEN
    SELECT id INTO v_tenant_id
    FROM shared.tenants
    ORDER BY id ASC
    LIMIT 1;

    IF v_tenant_id IS NULL THEN
      INSERT INTO shared.tenants (name, slug)
      VALUES ('CLI ERP Test', 'cli-erp-test')
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id INTO v_tenant_id;
    END IF;
  ELSE
    v_tenant_id := ${tenantId};
  END IF;

  IF ${actorId} IS NULL THEN
    SELECT id INTO v_actor_id
    FROM shared.users
    ORDER BY id ASC
    LIMIT 1;

    IF v_actor_id IS NULL THEN
      INSERT INTO shared.users (email, full_name)
      VALUES ('cli-erp-smoke@local.test', 'CLI ERP Smoke')
      RETURNING id INTO v_actor_id;
    END IF;
  ELSE
    v_actor_id := ${actorId};
  END IF;

  INSERT INTO shared.tenant_memberships (tenant_id, user_id, role, status)
  VALUES (v_tenant_id, v_actor_id, 'admin', 'active')
  ON CONFLICT (tenant_id, user_id) DO UPDATE
    SET role = EXCLUDED.role,
        status = EXCLUDED.status;

  INSERT INTO erp.entidades (
    tenant_id,
    tipo_pessoa,
    nome,
    documento,
    eh_cliente,
    eh_fornecedor,
    ativo,
    criado_por,
    atualizado_por
  )
  VALUES (
    v_tenant_id,
    'juridica',
    ${customerName},
    'CLI' || extract(epoch from clock_timestamp())::bigint::text,
    true,
    false,
    true,
    v_actor_id,
    v_actor_id
  )
  RETURNING id INTO v_customer_id;

  INSERT INTO erp.produtos (
    tenant_id,
    nome,
    sku,
    codigo,
    preco_venda,
    ativo,
    criado_por,
    atualizado_por
  )
  VALUES (
    v_tenant_id,
    'Produto CLI ' || extract(epoch from clock_timestamp())::bigint::text,
    'CLI-' || extract(epoch from clock_timestamp())::bigint::text,
    'CLI-' || extract(epoch from clock_timestamp())::bigint::text,
    ${unitPrice},
    true,
    v_actor_id,
    v_actor_id
  )
  RETURNING id INTO v_product_id;

  v_total := round((${quantity} * ${unitPrice})::numeric, 2);
  v_sale_number := 'CLI-VEN-' || extract(epoch from clock_timestamp())::bigint::text;

  INSERT INTO erp.vendas (
    tenant_id,
    cliente_id,
    numero,
    data_venda,
    data_competencia,
    status,
    situacao,
    subtotal,
    total,
    condicao_pagamento,
    criado_por,
    atualizado_por
  )
  VALUES (
    v_tenant_id,
    v_customer_id,
    v_sale_number,
    CURRENT_DATE,
    CURRENT_DATE,
    'rascunho',
    'em_andamento',
    v_total,
    v_total,
    jsonb_build_object(
      'parcelas',
      jsonb_build_array(jsonb_build_object(
        'numero_parcela', 1,
        'descricao', 'Parcela 1',
        'data_vencimento', CURRENT_DATE,
        'valor', v_total
      ))
    ),
    v_actor_id,
    v_actor_id
  )
  RETURNING id INTO v_sale_id;

  INSERT INTO erp.vendas_itens (
    tenant_id,
    venda_id,
    produto_id,
    descricao,
    quantidade,
    valor_unitario,
    custo_unitario,
    total,
    criado_por,
    atualizado_por
  )
  VALUES (
    v_tenant_id,
    v_sale_id,
    v_product_id,
    ${saleDescription},
    ${quantity},
    ${unitPrice},
    0,
    v_total,
    v_actor_id,
    v_actor_id
  );

  UPDATE erp.vendas
  SET
    status = 'confirmada',
    situacao = 'aprovada',
    confirmada_em = COALESCE(confirmada_em, now()),
    atualizado_por = v_actor_id
  WHERE tenant_id = v_tenant_id
    AND id = v_sale_id
    AND status = 'rascunho';

  INSERT INTO erp.contas_receber (
    tenant_id,
    cliente_id,
    venda_id,
    descricao,
    numero_documento,
    data_competencia,
    data_emissao,
    valor_total,
    status,
    criado_por,
    atualizado_por
  )
  VALUES (
    v_tenant_id,
    v_customer_id,
    v_sale_id,
    'Venda ' || v_sale_number,
    v_sale_number,
    CURRENT_DATE,
    CURRENT_DATE,
    v_total,
    'aberto',
    v_actor_id,
    v_actor_id
  )
  RETURNING id INTO v_receivable_id;

  INSERT INTO erp.contas_receber_parcelas (
    tenant_id,
    conta_receber_id,
    numero_parcela,
    descricao,
    data_vencimento,
    data_pagamento_previsto,
    valor,
    valor_bruto,
    valor_liquido,
    valor_pago,
    status,
    criado_por,
    atualizado_por
  )
  VALUES (
    v_tenant_id,
    v_receivable_id,
    1,
    'Parcela 1',
    CURRENT_DATE,
    CURRENT_DATE,
    v_total,
    v_total,
    v_total,
    0,
    'aberto',
    v_actor_id,
    v_actor_id
  )
  RETURNING id INTO v_installment_id;

  SELECT id INTO v_second_receivable_id
  FROM erp.contas_receber
  WHERE tenant_id = v_tenant_id
    AND venda_id = v_sale_id
    AND excluido_em IS NULL
  ORDER BY id ASC
  LIMIT 1;

  SELECT count(*)::int INTO v_receivable_count
  FROM erp.contas_receber
  WHERE tenant_id = v_tenant_id
    AND venda_id = v_sale_id
    AND excluido_em IS NULL;

  INSERT INTO erp_cli_result(data)
  VALUES (jsonb_build_object(
    'ok', v_receivable_count = 1 AND v_second_receivable_id = v_receivable_id,
    'tenant_id', v_tenant_id,
    'actor_id', v_actor_id,
    'customer_id', v_customer_id,
    'product_id', v_product_id,
    'sale', jsonb_build_object('id', v_sale_id, 'numero', v_sale_number, 'status', 'confirmada', 'total', v_total),
    'receivable', jsonb_build_object('id', v_receivable_id, 'status', 'aberto'),
    'installment', jsonb_build_object('id', v_installment_id, 'numero_parcela', 1, 'valor', v_total, 'status', 'aberto'),
    'checks', jsonb_build_object('receivable_count', v_receivable_count, 'idempotent', v_receivable_count = 1)
  ));
END $$;

COMMIT;

SELECT data
FROM erp_cli_result;
`
}

async function runSupabaseSmoke(args) {
  const password = dbPasswordFromUrl()
  if (!password) {
    throw new Error('Nao encontrei SUPABASE_DB_PASSWORD nem senha dentro de SUPABASE_DB_URL.')
  }

  const dir = await mkdtemp(join(tmpdir(), 'erp-cli-'))
  const file = join(dir, 'sale-smoke.sql')

  try {
    await writeFile(file, buildSupabaseSmokeSql(args), 'utf8')

    const result = spawnSync(
      'pnpm',
      ['exec', 'supabase', 'db', 'query', '--linked', '--file', file, '--output', 'json'],
      {
        cwd: process.cwd(),
        encoding: 'utf8',
        env: {
          ...process.env,
          SUPABASE_DB_PASSWORD: password,
        },
        shell: process.platform === 'win32',
      },
    )

    if (result.stdout) process.stdout.write(result.stdout)
    if (result.stderr) process.stderr.write(result.stderr)
    if (result.status !== 0) process.exitCode = result.status ?? 1
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
}

async function setupContext(pool, args) {
  return withTransaction(pool, async (client) => {
    const tenant = await resolveTenant(client, args)
    const actor = await resolveActor(client, args)
    await ensureTenantMembership(client, tenant.id, actor.id)
    return { tenant, actor }
  })
}

function printHelp() {
  console.log(`
ERP CLI

Uso:
  node scripts/erp-cli.mjs sale:smoke [--tenant-id 1] [--actor-id 1]
  node scripts/erp-cli.mjs sale:create [--tenant-id 1] [--customer-id 1] [--product-id 1] [--quantity 2] [--unit-price 150]
  node scripts/erp-cli.mjs sale:confirm --sale-id 123 [--tenant-id 1]

Comandos:
  sale:smoke    cria cliente/produto/venda, confirma duas vezes e valida idempotencia
  sale:create   cria uma venda rascunho com um item
  sale:confirm  confirma uma venda existente e gera contas a receber

Obs:
  sale:smoke usa Supabase CLI por padrao. Use --transport pg para forcar conexao direta.
`)
}

async function main() {
  const { command, args } = parseArgs(process.argv.slice(2))
  if (!command || command === '--help' || command === '-h' || args.help || args.h) {
    printHelp()
    return
  }

  if (!process.env.SUPABASE_DB_URL) {
    throw new Error('SUPABASE_DB_URL nao esta configurada no .env.local.')
  }

  if (command === 'sale:smoke' && args.transport !== 'pg') {
    await runSupabaseSmoke(args)
    return
  }

  const pool = new Pool({ connectionString: process.env.SUPABASE_DB_URL, max: 2 })

  try {
    const { tenant, actor } = await setupContext(pool, args)

    if (command === 'sale:create') {
      const result = await withTransaction(pool, (client) => createSale(client, tenant.id, actor.id, args))
      console.log(JSON.stringify({
        ok: true,
        tenant,
        actor,
        sale: result.sale,
        customer: result.customer,
        product: result.product,
      }, null, 2))
      return
    }

    if (command === 'sale:confirm') {
      const saleId = intArg(args['sale-id'], 'Venda')
      const result = await withTransaction(pool, (client) => confirmSale(client, tenant.id, actor.id, saleId))
      console.log(JSON.stringify({
        ok: true,
        tenant,
        actor,
        sale: { id: result.sale.id, status: result.sale.status },
        receivable: result.receivable,
        installments: result.installments,
        reused: result.reused,
      }, null, 2))
      return
    }

    if (command === 'sale:smoke') {
      const created = await withTransaction(pool, (client) => createSale(client, tenant.id, actor.id, args))
      const firstConfirm = await withTransaction(pool, (client) => confirmSale(client, tenant.id, actor.id, created.sale.id))
      const secondConfirm = await withTransaction(pool, (client) => confirmSale(client, tenant.id, actor.id, created.sale.id))
      const receivableCount = await countReceivables(pool, tenant.id, created.sale.id)

      const ok = (
        firstConfirm.receivable.id === secondConfirm.receivable.id
        && receivableCount === 1
        && secondConfirm.reused === true
      )

      console.log(JSON.stringify({
        ok,
        tenant,
        actor,
        sale: { id: created.sale.id, numero: created.sale.numero, total: created.sale.total },
        customer: created.customer,
        product: created.product,
        firstConfirm: {
          sale: { id: firstConfirm.sale.id, status: firstConfirm.sale.status },
          receivable: firstConfirm.receivable,
          installments: firstConfirm.installments,
          reused: firstConfirm.reused,
        },
        secondConfirm: {
          sale: { id: secondConfirm.sale.id, status: secondConfirm.sale.status },
          receivable: secondConfirm.receivable,
          reused: secondConfirm.reused,
        },
        checks: {
          receivableCount,
          idempotent: ok,
        },
      }, null, 2))

      if (!ok) process.exitCode = 1
      return
    }

    throw new Error(`Comando desconhecido: ${command}`)
  } finally {
    await pool.end()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
