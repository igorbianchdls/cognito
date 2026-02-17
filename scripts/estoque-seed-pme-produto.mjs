#!/usr/bin/env node

import { Client } from "pg";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

const TENANT_ID = 1;
const PERIOD_START = "2025-09-01";
const PERIOD_END = "2026-02-16";
const DOC_START = 200000;

const NEW_PRODUCTS = [
  {
    nome: "Conjunto Riviera Dourado Deluxe",
    descricao: "Conjunto premium de semijoias com banho dourado e zircônias.",
    categoria_id: 11,
    marca_id: 4,
  },
  {
    nome: "Brinco Gota Cristal Solar",
    descricao: "Brinco leve com cristal em formato de gota para uso diário.",
    categoria_id: 4,
    marca_id: 2,
  },
];

const MOV_TYPES = [
  { codigo: "ENTRADA_COMPRA", descricao: "Entrada por compra de fornecedor", natureza: "entrada", gera_financeiro: true, ativo: true },
  { codigo: "ENTRADA_DEVOLUCAO", descricao: "Entrada por devolução de cliente", natureza: "entrada", gera_financeiro: false, ativo: true },
  { codigo: "SAIDA_VENDA", descricao: "Saída por venda em loja/showroom", natureza: "saida", gera_financeiro: true, ativo: true },
  { codigo: "SAIDA_MARKETPLACE", descricao: "Saída por venda em marketplace/e-commerce", natureza: "saida", gera_financeiro: true, ativo: true },
  { codigo: "SAIDA_AJUSTE", descricao: "Saída por perda ou avaria", natureza: "saida", gera_financeiro: false, ativo: true },
  { codigo: "AJUSTE_INVENTARIO", descricao: "Ajuste positivo por inventário", natureza: "ajuste", gera_financeiro: false, ativo: true },
];

const WAREHOUSES = [
  {
    key: "central",
    nome: "Depósito Central",
    tipo: "matriz",
    endereco: "Av. Industrial, 1500 - Centro",
    responsavel: "Marina Oliveira",
    stockShare: 0.6,
    demandShare: 0.2,
    replenishOrigin: "Compra fornecedor",
    salesOrigin: "Venda atacado",
    weekendFactor: 0.85,
  },
  {
    key: "showroom",
    nome: "Showroom Recife",
    tipo: "filial",
    endereco: "Rua do Bom Jesus, 320 - Recife",
    responsavel: "Patricia Santos",
    stockShare: 0.15,
    demandShare: 0.35,
    replenishOrigin: "Reabastecimento showroom",
    salesOrigin: "Venda showroom",
    weekendFactor: 0.75,
  },
  {
    key: "ecommerce",
    nome: "E-commerce",
    tipo: "filial",
    endereco: "Canal digital",
    responsavel: "Equipe E-commerce",
    stockShare: 0.25,
    demandShare: 0.45,
    replenishOrigin: "Reabastecimento e-commerce",
    salesOrigin: "Venda e-commerce",
    weekendFactor: 1.05,
  },
];

function loadEnvFiles() {
  try {
    const cwd = process.cwd();
    const candidates = [
      ".env.local",
      ".env",
      ".env.development.local",
      ".env.development",
      ".env.production.local",
      ".env.production",
    ].map((f) => path.join(cwd, f));

    for (const envPath of candidates) {
      if (fs.existsSync(envPath)) dotenv.config({ path: envPath, override: false });
    }
  } catch {
    // ignore
  }
}

function createRng(seed = 20260217) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const intBetween = (rng, min, max) => Math.floor(rng() * (max - min + 1)) + min;
const pickBetween = (rng, min, max) => round2(min + rng() * (max - min));

function parseDateOnly(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

function toDateOnly(d) {
  return d.toISOString().slice(0, 10);
}

function dateRange(startIso, endIso) {
  const start = parseDateOnly(startIso);
  const end = parseDateOnly(endIso);
  const days = [];
  for (let dt = start; dt <= end; dt = new Date(dt.getTime() + 86400000)) {
    days.push(toDateOnly(dt));
  }
  return days;
}

function monthSeasonality(isoDate) {
  const month = Number(isoDate.slice(5, 7));
  if (month === 9) return 0.95;
  if (month === 10) return 1.0;
  if (month === 11) return 1.12;
  if (month === 12) return 1.3;
  if (month === 1) return 0.88;
  if (month === 2) return 0.98;
  return 1.0;
}

function dayOfWeek(isoDate) {
  return parseDateOnly(isoDate).getUTCDay();
}

function categoryCostRange(category) {
  const name = String(category || "").toLowerCase();
  if (name.includes("anel")) return [22, 45];
  if (name.includes("colar")) return [28, 62];
  if (name.includes("brinco")) return [18, 38];
  if (name.includes("pulseira")) return [24, 52];
  if (name.includes("tornozeleira")) return [16, 30];
  if (name.includes("conjunto")) return [48, 95];
  if (name.includes("joia")) return [35, 70];
  return [20, 50];
}

function classConfig(stockClass) {
  if (stockClass === "A") return { targetMin: 140, targetMax: 220, targetDays: 45, safetyFactor: 0.35 };
  if (stockClass === "B") return { targetMin: 80, targetMax: 140, targetDays: 30, safetyFactor: 0.25 };
  return { targetMin: 30, targetMax: 80, targetDays: 20, safetyFactor: 0.15 };
}

function sampleSalesQty(rng, mean, stockClass) {
  if (mean <= 0.02) return 0;
  let qty = Math.floor(mean);
  const frac = mean - qty;
  if (rng() < frac) qty += 1;
  if (rng() < Math.min(0.3, mean * 0.18)) qty += 1;
  if (stockClass === "A" && rng() < 0.08) qty += 1;
  return qty;
}

async function ensureTwentyFiveProducts(client) {
  const current = await client.query(
    `SELECT id, nome FROM produtos.produto ORDER BY id`
  );
  let total = current.rowCount;

  if (total < 25) {
    for (const p of NEW_PRODUCTS) {
      if (total >= 25) break;
      const exists = await client.query(
        `SELECT id FROM produtos.produto WHERE lower(nome) = lower($1) LIMIT 1`,
        [p.nome]
      );
      if (exists.rowCount > 0) continue;

      await client.query(
        `INSERT INTO produtos.produto (tenantid, nome, descricao, categoria_id, marca_id, ativo)
         VALUES ($1, $2, $3, $4, $5, true)`,
        [TENANT_ID, p.nome, p.descricao, p.categoria_id, p.marca_id]
      );
      total += 1;
    }
  }

  const products = await client.query(
    `SELECT p.id, p.nome, COALESCE(c.nome, 'Sem categoria') AS categoria
     FROM produtos.produto p
     LEFT JOIN produtos.categorias c ON c.id = p.categoria_id
     WHERE p.ativo = true
     ORDER BY p.id
     LIMIT 25`
  );

  if (products.rowCount < 25) {
    throw new Error(`Catálogo insuficiente para seed: ${products.rowCount} produto(s) ativo(s), esperado 25`);
  }

  return products.rows;
}

async function batchInsertMovements(client, rows) {
  if (!rows.length) return;
  const chunkSize = 500;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const values = [];
    const params = [];

    for (let j = 0; j < chunk.length; j += 1) {
      const r = chunk[j];
      const base = j * 11;
      values.push(
        `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6}, $${base + 7}, $${base + 8}, $${base + 9}, $${base + 10}, $${base + 11})`
      );
      params.push(
        r.tenant_id,
        r.produto_id,
        r.almoxarifado_id,
        r.tipo_movimento,
        r.tipo_codigo,
        r.origem,
        r.documento_origem_id,
        r.quantidade,
        r.valor_unitario,
        r.data_movimento,
        r.observacoes
      );
    }

    await client.query(
      `INSERT INTO estoque.movimentacoes_estoque
       (tenant_id, produto_id, almoxarifado_id, tipo_movimento, tipo_codigo, origem, documento_origem_id, quantidade, valor_unitario, data_movimento, observacoes)
       VALUES ${values.join(", ")}`,
      params
    );
  }
}

async function batchInsertEstoqueAtual(client, rows) {
  if (!rows.length) return;
  const chunkSize = 300;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const values = [];
    const params = [];

    for (let j = 0; j < chunk.length; j += 1) {
      const r = chunk[j];
      const base = j * 5;
      values.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`);
      params.push(
        r.produto_id,
        r.almoxarifado_id,
        r.quantidade,
        r.custo_medio,
        r.atualizado_em
      );
    }

    await client.query(
      `INSERT INTO estoque.estoques_atual (produto_id, almoxarifado_id, quantidade, custo_medio, atualizado_em)
       VALUES ${values.join(", ")}`,
      params
    );
  }
}

async function main() {
  loadEnvFiles();
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.error("SUPABASE_DB_URL ausente (adicione em .env.local).");
    process.exit(1);
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });
  const rng = createRng(20260217);

  let documentId = DOC_START;
  const movements = [];

  const pushMovement = (state, data) => {
    let qty = Math.max(0, Math.trunc(data.quantidade));
    if (qty <= 0) return;

    if (data.tipo_movimento === "saida") {
      qty = Math.min(qty, state.saldo);
      if (qty <= 0) return;
      state.saldo -= qty;
    } else {
      const previousValue = state.saldo * state.custoMedio;
      const newValue = previousValue + qty * data.avgUnitCost;
      state.saldo += qty;
      state.custoMedio = state.saldo > 0 ? round2(newValue / state.saldo) : state.custoMedio;
    }

    movements.push({
      tenant_id: TENANT_ID,
      produto_id: state.produtoId,
      almoxarifado_id: state.almoxarifadoId,
      tipo_movimento: data.tipo_movimento,
      tipo_codigo: data.tipo_codigo,
      origem: data.origem,
      documento_origem_id: documentId++,
      quantidade: qty,
      valor_unitario: data.valor_unitario,
      data_movimento: data.data_movimento,
      observacoes: data.observacoes,
    });
  };

  await client.connect();
  try {
    await client.query("BEGIN");

    const products = await ensureTwentyFiveProducts(client);

    // Reaponta FKs de produto para produtos.produto (sem variações).
    await client.query(`ALTER TABLE estoque.movimentacoes_estoque DROP CONSTRAINT IF EXISTS movimentacoes_estoque_produto_id_fkey`);
    await client.query(`ALTER TABLE estoque.estoques_atual DROP CONSTRAINT IF EXISTS estoques_atual_produto_id_fkey`);
    await client.query(`ALTER TABLE estoque.movimentacoes_estoque ADD CONSTRAINT movimentacoes_estoque_produto_id_fkey FOREIGN KEY (produto_id) REFERENCES produtos.produto(id)`);
    await client.query(`ALTER TABLE estoque.estoques_atual ADD CONSTRAINT estoques_atual_produto_id_fkey FOREIGN KEY (produto_id) REFERENCES produtos.produto(id)`);

    // Reinicia as 4 tabelas do MVP.
    await client.query(`
      TRUNCATE TABLE
        estoque.estoques_atual,
        estoque.movimentacoes_estoque,
        estoque.tipos_movimentacao,
        estoque.almoxarifados
      RESTART IDENTITY CASCADE
    `);

    // Tipos de movimentação
    for (const t of MOV_TYPES) {
      await client.query(
        `INSERT INTO estoque.tipos_movimentacao (codigo, descricao, natureza, gera_financeiro, ativo)
         VALUES ($1, $2, $3, $4, $5)`,
        [t.codigo, t.descricao, t.natureza, t.gera_financeiro, t.ativo]
      );
    }

    // Almoxarifados
    const warehouseByKey = new Map();
    for (const w of WAREHOUSES) {
      const r = await client.query(
        `INSERT INTO estoque.almoxarifados (tenant_id, nome, tipo, endereco, responsavel, ativo, criado_em)
         VALUES ($1, $2, $3, $4, $5, true, now())
         RETURNING id`,
        [TENANT_ID, w.nome, w.tipo, w.endereco, w.responsavel]
      );
      warehouseByKey.set(w.key, Number(r.rows[0].id));
    }

    // Construção dos perfis por produto e posição de estoque (produto x almox).
    const positions = [];
    for (let idx = 0; idx < products.length; idx += 1) {
      const p = products[idx];
      const stockClass = idx < 8 ? "A" : idx < 18 ? "B" : "C";
      const cfg = classConfig(stockClass);
      const targetTotal = intBetween(rng, cfg.targetMin, cfg.targetMax);
      const dailyDemandTotal = targetTotal / cfg.targetDays;
      const reorderDays = 12;
      const [costMin, costMax] = categoryCostRange(p.categoria);
      const baseCost = round2(pickBetween(rng, costMin, costMax));

      for (const wh of WAREHOUSES) {
        const almoxarifadoId = warehouseByKey.get(wh.key);
        const targetStock = Math.max(8, Math.round(targetTotal * wh.stockShare));
        const demand = dailyDemandTotal * wh.demandShare;
        const safety = demand * reorderDays * cfg.safetyFactor;
        const reorderPoint = Math.max(4, Math.round((demand * reorderDays) + safety));
        const initialStock = targetStock + intBetween(rng, 4, Math.max(8, Math.round(targetStock * 0.25)));

        const state = {
          produtoId: Number(p.id),
          produtoNome: p.nome,
          almoxarifadoId,
          almoxKey: wh.key,
          demand,
          targetStock,
          reorderPoint,
          baseCost,
          saldo: 0,
          custoMedio: baseCost,
        };

        // Entrada inicial para montar posição de estoque.
        pushMovement(state, {
          tipo_movimento: "entrada",
          tipo_codigo: "ENTRADA_COMPRA",
          quantidade: initialStock,
          valor_unitario: baseCost,
          avgUnitCost: baseCost,
          origem: wh.replenishOrigin,
          data_movimento: PERIOD_START,
          observacoes: "Carga inicial PME",
        });

        positions.push(state);
      }
    }

    // Geração diária de movimentações.
    const days = dateRange(PERIOD_START, PERIOD_END);
    for (const day of days) {
      const seasonality = monthSeasonality(day);
      const dow = dayOfWeek(day);
      const weekendFactor = dow === 0 ? 0.68 : dow === 6 ? 0.82 : 1.0;

      for (const s of positions) {
        const wh = WAREHOUSES.find((w) => w.key === s.almoxKey);
        const demandMean = s.demand * seasonality * weekendFactor * (wh?.weekendFactor ?? 1);
        const salesQty = sampleSalesQty(rng, demandMean, s.targetStock >= 140 ? "A" : s.targetStock >= 80 ? "B" : "C");

        if (salesQty > 0) {
          const isDigital = s.almoxKey === "ecommerce";
          const saleCode = isDigital ? "SAIDA_MARKETPLACE" : "SAIDA_VENDA";
          const sellUnit = round2(s.baseCost * pickBetween(rng, 1.65, 2.05));
          pushMovement(s, {
            tipo_movimento: "saida",
            tipo_codigo: saleCode,
            quantidade: salesQty,
            valor_unitario: sellUnit,
            avgUnitCost: s.baseCost,
            origem: wh?.salesOrigin || "Venda",
            data_movimento: day,
            observacoes: isDigital ? "Pedido digital" : "Pedido balcão/atacado",
          });
        }

        if (rng() < 0.012) {
          const returnQty = rng() < 0.2 ? 2 : 1;
          pushMovement(s, {
            tipo_movimento: "entrada",
            tipo_codigo: "ENTRADA_DEVOLUCAO",
            quantidade: returnQty,
            valor_unitario: round2(s.baseCost * 1.7),
            avgUnitCost: s.baseCost,
            origem: "Devolução de cliente",
            data_movimento: day,
            observacoes: "Retorno por troca/devolução",
          });
        }

        if (rng() < 0.006) {
          pushMovement(s, {
            tipo_movimento: "saida",
            tipo_codigo: "SAIDA_AJUSTE",
            quantidade: 1,
            valor_unitario: s.baseCost,
            avgUnitCost: s.baseCost,
            origem: "Perda / avaria",
            data_movimento: day,
            observacoes: "Perda operacional",
          });
        }

        if (rng() < 0.003) {
          pushMovement(s, {
            tipo_movimento: "ajuste",
            tipo_codigo: "AJUSTE_INVENTARIO",
            quantidade: 1,
            valor_unitario: s.baseCost,
            avgUnitCost: s.baseCost,
            origem: "Ajuste inventário",
            data_movimento: day,
            observacoes: "Diferença positiva de contagem",
          });
        }

        if (s.saldo < s.reorderPoint) {
          const needed = Math.max(0, s.targetStock - s.saldo);
          const extra = Math.max(3, Math.round(s.targetStock * pickBetween(rng, 0.15, 0.35)));
          const inQty = Math.max(6, needed + extra);
          const inCost = round2(s.baseCost * pickBetween(rng, 0.92, 1.08));
          pushMovement(s, {
            tipo_movimento: "entrada",
            tipo_codigo: "ENTRADA_COMPRA",
            quantidade: inQty,
            valor_unitario: inCost,
            avgUnitCost: inCost,
            origem: wh?.replenishOrigin || "Reposição",
            data_movimento: day,
            observacoes: "Reposição automática de nível",
          });
        }
      }
    }

    await batchInsertMovements(client, movements);

    // Consolidação de saldo atual.
    const estoqueAtual = positions
      .filter((p) => p.saldo > 0)
      .map((p) => ({
        produto_id: p.produtoId,
        almoxarifado_id: p.almoxarifadoId,
        quantidade: p.saldo,
        custo_medio: round2(p.custoMedio),
        atualizado_em: `${PERIOD_END}T23:59:59.000Z`,
      }));

    await batchInsertEstoqueAtual(client, estoqueAtual);

    await client.query("COMMIT");

    const countProducts = products.length;
    const countMovs = movements.length;
    const countSaldos = estoqueAtual.length;
    console.log(`Seed PME concluído com sucesso.`);
    console.log(`Produtos usados: ${countProducts}`);
    console.log(`Movimentações geradas: ${countMovs}`);
    console.log(`Posições em estoque_atual: ${countSaldos}`);
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore
    }
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

main();
