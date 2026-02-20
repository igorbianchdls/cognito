#!/usr/bin/env node

import { Client } from "pg";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

const TENANT_ID = 1;
const DATE_START = "2026-02-01";
const DATE_END = "2026-03-31";
const SALES_COUNT = 220;
const PURCHASE_COUNT = 40;

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

function createRng(seed = 20260331) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function parseDateOnly(s) {
  const [y, m, d] = String(s).split("-").map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1, 12, 0, 0));
}

function toDateOnly(d) {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

function addDays(dateIso, days) {
  const d = parseDateOnly(dateIso);
  d.setUTCDate(d.getUTCDate() + days);
  return toDateOnly(d);
}

function clampDate(iso, minIso, maxIso) {
  if (iso < minIso) return minIso;
  if (iso > maxIso) return maxIso;
  return iso;
}

function randomDateIso(rng, startIso, endIso) {
  const start = parseDateOnly(startIso).getTime();
  const end = parseDateOnly(endIso).getTime();
  const t = start + Math.floor(rng() * (end - start + 1));
  return toDateOnly(new Date(t));
}

function randomTimeTs(rng, dateIso) {
  const hour = 8 + Math.floor(rng() * 10);
  const min = Math.floor(rng() * 60);
  const sec = Math.floor(rng() * 60);
  return `${dateIso} ${pad2(hour)}:${pad2(min)}:${pad2(sec)}`;
}

function randomInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randomFloat(rng, min, max) {
  return min + rng() * (max - min);
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function pick(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

function pickUnique(rng, list, count) {
  const copy = list.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.max(0, Math.min(count, copy.length)));
}

function weightedChoice(rng, weightedItems) {
  const total = weightedItems.reduce((acc, item) => acc + item.weight, 0);
  const target = rng() * total;
  let acc = 0;
  for (const item of weightedItems) {
    acc += item.weight;
    if (target <= acc) return item.value;
  }
  return weightedItems[weightedItems.length - 1].value;
}

function productCostRange(category) {
  const c = String(category || "").toLowerCase();
  if (c.includes("anel")) return [20, 40];
  if (c.includes("colar")) return [26, 58];
  if (c.includes("brinco")) return [16, 36];
  if (c.includes("pulseira")) return [22, 50];
  if (c.includes("tornozeleira")) return [14, 28];
  if (c.includes("conjunto")) return [44, 88];
  if (c.includes("joia")) return [30, 64];
  return [18, 42];
}

function classByIndex(idx) {
  if (idx < 5) return "A";
  if (idx < 15) return "B";
  return "C";
}

function salesQtyRange(stockClass) {
  if (stockClass === "A") return [6, 22];
  if (stockClass === "B") return [3, 14];
  return [1, 8];
}

function purchaseQtyRange(stockClass) {
  if (stockClass === "A") return [90, 220];
  if (stockClass === "B") return [45, 130];
  return [18, 70];
}

async function insertMany(client, table, columns, rows, chunkSize = 200) {
  if (!rows.length) return;

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const valuesSql = [];
    const params = [];

    for (let r = 0; r < chunk.length; r += 1) {
      const row = chunk[r];
      const base = r * columns.length;
      valuesSql.push(`(${columns.map((_, c) => `$${base + c + 1}`).join(",")})`);
      for (const col of columns) params.push(row[col] ?? null);
    }

    await client.query(
      `INSERT INTO ${table} (${columns.join(",")}) VALUES ${valuesSql.join(",")}`,
      params
    );
  }
}

async function alignIdSequence(client, table, column = "id") {
  const seqRes = await client.query(
    `SELECT pg_get_serial_sequence($1, $2) AS seq`,
    [table, column]
  );
  const seq = seqRes.rows?.[0]?.seq || null;
  if (!seq) {
    return { table, column, sequence: null, max_id: null, last_value: null, ok: true, skipped: true };
  }

  const maxRes = await client.query(
    `SELECT COALESCE(MAX(${column}), 0)::bigint AS max_id FROM ${table}`
  );
  const maxId = Number(maxRes.rows?.[0]?.max_id || 0);
  const nextBase = Math.max(1, maxId);

  await client.query(`SELECT setval($1, $2, true)`, [seq, nextBase]);

  let lastValue = null;
  try {
    const lastRes = await client.query(`SELECT last_value::bigint AS last_value FROM ${seq}`);
    lastValue = Number(lastRes.rows?.[0]?.last_value || 0);
  } catch {
    // fallback: if we cannot read sequence directly, consider sync successful after setval.
  }

  return {
    table,
    column,
    sequence: seq,
    max_id: maxId,
    last_value: lastValue,
    ok: lastValue === null ? true : lastValue >= maxId,
    skipped: false,
  };
}

async function main() {
  loadEnvFiles();

  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.error("SUPABASE_DB_URL ausente (adicione em .env.local).");
    process.exit(1);
  }

  const rng = createRng(20260331);
  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    await client.query("BEGIN");

    const [clientesRes, fornecedoresRes, produtosRes, vendedoresRes, canaisRes, servicosRes] = await Promise.all([
      client.query(
        `SELECT id, COALESCE(nome_fantasia, nome_razao, 'Cliente') AS nome
           FROM entidades.clientes
          WHERE tenant_id = $1
          ORDER BY id`,
        [TENANT_ID]
      ),
      client.query(
        `SELECT id, COALESCE(nome_fantasia, 'Fornecedor') AS nome
           FROM entidades.fornecedores
          ORDER BY id`
      ),
      client.query(
        `SELECT p.id,
                p.nome,
                COALESCE(c.nome, 'Sem categoria') AS categoria
           FROM produtos.produto p
      LEFT JOIN produtos.categorias c ON c.id = p.categoria_id
          WHERE COALESCE(p.ativo, true) = true
          ORDER BY p.id
          LIMIT 25`
      ),
      client.query(
        `SELECT id, territorio_id
           FROM comercial.vendedores
          WHERE tenant_id = $1 AND COALESCE(ativo, true) = true
          ORDER BY id`,
        [TENANT_ID]
      ),
      client.query(`SELECT id FROM vendas.canais_venda ORDER BY id`),
      client.query(`SELECT id FROM servicos.catalogo_servicos ORDER BY id LIMIT 1`),
    ]);

    const filiaisRes = await client.query(`SELECT id FROM empresa.filiais ORDER BY id`);
    const departamentosRes = await client.query(`SELECT id FROM empresa.departamentos ORDER BY id`);
    const centrosCustoRes = await client.query(`SELECT id FROM empresa.centros_custo ORDER BY id`);
    const centrosLucroRes = await client.query(`SELECT id FROM empresa.centros_lucro ORDER BY id`);
    const unidadesRes = await client.query(`SELECT id FROM empresa.unidades_negocio ORDER BY id`);
    const categoriasReceitaRes = await client.query(`SELECT id FROM financeiro.categorias_receita ORDER BY id`);
    const categoriasDespesaRes = await client.query(`SELECT id FROM financeiro.categorias_despesa ORDER BY id`);

    if (clientesRes.rowCount < 8) throw new Error("Base de clientes insuficiente.");
    if (fornecedoresRes.rowCount < 8) throw new Error("Base de fornecedores insuficiente.");
    if (produtosRes.rowCount < 25) throw new Error("Esperado 25 produtos ativos em produtos.produto.");
    if (vendedoresRes.rowCount < 3) throw new Error("Vendedores insuficientes em comercial.vendedores.");
    if (canaisRes.rowCount < 1) throw new Error("Sem canais de venda.");
    if (servicosRes.rowCount < 1) throw new Error("Sem servicos.catalogo_servicos para vendas.pedidos_itens.servico_id.");
    if (filiaisRes.rowCount < 1 || departamentosRes.rowCount < 1 || centrosCustoRes.rowCount < 1 || centrosLucroRes.rowCount < 1 || unidadesRes.rowCount < 1) {
      throw new Error("Dimensoes de empresa insuficientes (filiais/departamentos/centros/unidades).");
    }
    if (categoriasReceitaRes.rowCount < 1 || categoriasDespesaRes.rowCount < 1) {
      throw new Error("Categorias financeiras insuficientes.");
    }

    const clientes = clientesRes.rows.map((r) => ({ id: Number(r.id), nome: String(r.nome) }));
    const fornecedores = fornecedoresRes.rows.map((r) => ({ id: Number(r.id), nome: String(r.nome) }));
    const vendedores = vendedoresRes.rows.map((r) => ({ id: Number(r.id), territorio_id: r.territorio_id ? Number(r.territorio_id) : null }));
    const canais = canaisRes.rows.map((r) => Number(r.id));
    const servicoId = Number(servicosRes.rows[0].id);
    const filiais = filiaisRes.rows.map((r) => Number(r.id));
    const departamentos = departamentosRes.rows.map((r) => Number(r.id));
    const centrosCusto = centrosCustoRes.rows.map((r) => Number(r.id));
    const centrosLucro = centrosLucroRes.rows.map((r) => Number(r.id));
    const unidades = unidadesRes.rows.map((r) => Number(r.id));
    const categoriasReceita = categoriasReceitaRes.rows.map((r) => Number(r.id));
    const categoriasDespesa = categoriasDespesaRes.rows.map((r) => Number(r.id));

    const produtos = produtosRes.rows.map((r, idx) => {
      const stockClass = classByIndex(idx);
      const [minCost, maxCost] = productCostRange(r.categoria);
      const baseCost = round2(randomFloat(rng, minCost, maxCost));
      const markup = stockClass === "A" ? randomFloat(rng, 2.0, 2.35) : stockClass === "B" ? randomFloat(rng, 1.85, 2.25) : randomFloat(rng, 1.75, 2.1);
      const basePrice = round2(baseCost * markup);
      return {
        id: Number(r.id),
        nome: String(r.nome),
        categoria: String(r.categoria),
        stockClass,
        baseCost,
        basePrice,
      };
    });

    const productById = new Map(produtos.map((p) => [p.id, p]));
    const weightedProducts = produtos.map((p) => ({
      value: p,
      weight: p.stockClass === "A" ? 5 : p.stockClass === "B" ? 3 : 1.5,
    }));

    await client.query(`
      TRUNCATE TABLE
        financeiro.pagamentos_recebidos_linhas,
        financeiro.pagamentos_recebidos,
        financeiro.pagamentos_efetuados_linhas,
        financeiro.pagamentos_efetuados,
        financeiro.contas_receber_linhas,
        financeiro.contas_receber,
        financeiro.contas_pagar_linhas,
        financeiro.contas_pagar,
        vendas.pedidos_itens,
        vendas.pedidos,
        compras.compras_linhas,
        compras.compras
      RESTART IDENTITY CASCADE
    `);

    const compras = [];
    const comprasLinhas = [];
    let compraLinhaId = 1;

    for (let i = 0; i < PURCHASE_COUNT; i += 1) {
      const id = i + 1;
      const fornecedor = pick(rng, fornecedores);
      const filialId = pick(rng, filiais);
      const departamentoId = pick(rng, departamentos);
      const centroCustoId = pick(rng, centrosCusto);
      const categoriaDespesaId = pick(rng, categoriasDespesa);
      const dataPedido = randomDateIso(rng, DATE_START, DATE_END);
      const dataVencimento = clampDate(addDays(dataPedido, randomInt(rng, 10, 22)), DATE_START, DATE_END);
      const status = weightedChoice(rng, [
        { value: "aprovado", weight: 0.66 },
        { value: "recebimento_parcial", weight: 0.22 },
        { value: "em_analise", weight: 0.12 },
      ]);

      const lineCount = weightedChoice(rng, [
        { value: 2, weight: 0.48 },
        { value: 3, weight: 0.37 },
        { value: 4, weight: 0.15 },
      ]);

      const chosenProducts = pickUnique(
        rng,
        Array.from({ length: 200 }, () => weightedChoice(rng, weightedProducts)),
        lineCount
      );

      let totalCompra = 0;
      for (const produto of chosenProducts) {
        const [minQ, maxQ] = purchaseQtyRange(produto.stockClass);
        const quantidade = randomInt(rng, minQ, maxQ);
        const precoUnitario = round2(produto.baseCost * randomFloat(rng, 0.93, 1.09));
        const totalLinha = round2(quantidade * precoUnitario);
        const quantidadeRecebida =
          status === "aprovado"
            ? quantidade
            : status === "recebimento_parcial"
              ? Math.max(1, Math.floor(quantidade * randomFloat(rng, 0.35, 0.8)))
              : 0;

        comprasLinhas.push({
          id: compraLinhaId++,
          tenant_id: TENANT_ID,
          compra_id: id,
          produto_id: produto.id,
          quantidade,
          quantidade_recebida: quantidadeRecebida,
          unidade_medida: "UN",
          preco_unitario: precoUnitario,
          total: totalLinha,
          centro_custo_id: centroCustoId,
          projeto_id: null,
          categoria_financeira_id: null,
          criado_em: randomTimeTs(rng, dataPedido),
          categoria_despesa_id: categoriaDespesaId,
        });

        totalCompra = round2(totalCompra + totalLinha);
      }

      compras.push({
        id,
        tenant_id: TENANT_ID,
        fornecedor_id: fornecedor.id,
        filial_id: filialId,
        centro_custo_id: centroCustoId,
        projeto_id: null,
        categoria_financeira_id: null,
        numero_oc: `OC-2026-${String(id).padStart(4, "0")}`,
        data_pedido: dataPedido,
        data_entrega_prevista: clampDate(addDays(dataPedido, randomInt(rng, 2, 12)), DATE_START, DATE_END),
        status,
        valor_total: totalCompra,
        observacoes: "Reposicao de semijoias para distribuicao regional.",
        criado_por: null,
        criado_em: randomTimeTs(rng, dataPedido),
        atualizado_em: randomTimeTs(rng, dataPedido),
        categoria_despesa_id: categoriaDespesaId,
        data_documento: dataPedido,
        data_lancamento: dataPedido,
        data_vencimento: dataVencimento,
        departamento_id: departamentoId,
      });
    }

    await insertMany(
      client,
      "compras.compras",
      [
        "id",
        "tenant_id",
        "fornecedor_id",
        "filial_id",
        "centro_custo_id",
        "projeto_id",
        "categoria_financeira_id",
        "numero_oc",
        "data_pedido",
        "data_entrega_prevista",
        "status",
        "valor_total",
        "observacoes",
        "criado_por",
        "criado_em",
        "atualizado_em",
        "categoria_despesa_id",
        "data_documento",
        "data_lancamento",
        "data_vencimento",
        "departamento_id",
      ],
      compras
    );

    await insertMany(
      client,
      "compras.compras_linhas",
      [
        "id",
        "tenant_id",
        "compra_id",
        "produto_id",
        "quantidade",
        "quantidade_recebida",
        "unidade_medida",
        "preco_unitario",
        "total",
        "centro_custo_id",
        "projeto_id",
        "categoria_financeira_id",
        "criado_em",
        "categoria_despesa_id",
      ],
      comprasLinhas
    );

    const pedidos = [];
    const pedidosItens = [];
    let pedidoItemId = 1;

    for (let i = 0; i < SALES_COUNT; i += 1) {
      const id = i + 1;
      const cliente = pick(rng, clientes);
      const vendedor = pick(rng, vendedores);
      const filialId = pick(rng, filiais);
      const departamentoId = pick(rng, departamentos);
      const unidadeNegocioId = pick(rng, unidades);
      const centroLucroId = pick(rng, centrosLucro);
      const categoriaReceitaId = pick(rng, categoriasReceita);
      const canalVendaId = pick(rng, canais);
      const dataPedido = randomDateIso(rng, DATE_START, DATE_END);
      const dataVencimento = clampDate(addDays(dataPedido, randomInt(rng, 7, 20)), DATE_START, DATE_END);
      const status = weightedChoice(rng, [
        { value: "concluido", weight: 0.45 },
        { value: "aprovado", weight: 0.25 },
        { value: "pendente", weight: 0.3 },
      ]);

      const lineCount = weightedChoice(rng, [
        { value: 1, weight: 0.38 },
        { value: 2, weight: 0.42 },
        { value: 3, weight: 0.2 },
      ]);
      const chosenProducts = pickUnique(
        rng,
        Array.from({ length: 200 }, () => weightedChoice(rng, weightedProducts)),
        lineCount
      );

      let subtotal = 0;
      let descontoTotal = 0;

      for (const produto of chosenProducts) {
        const [minQ, maxQ] = salesQtyRange(produto.stockClass);
        const quantidade = randomInt(rng, minQ, maxQ);
        const precoUnitario = round2(produto.basePrice * randomFloat(rng, 0.9, 1.12));
        const bruto = round2(quantidade * precoUnitario);
        const desconto = round2(bruto * randomFloat(rng, 0, 0.08));
        const subtotalLinha = round2(bruto - desconto);

        pedidosItens.push({
          id: pedidoItemId++,
          tenant_id: TENANT_ID,
          pedido_id: id,
          produto_id: produto.id,
          quantidade,
          preco_unitario: precoUnitario,
          desconto,
          subtotal: subtotalLinha,
          criado_em: randomTimeTs(rng, dataPedido),
          atualizado_em: randomTimeTs(rng, dataPedido),
          servico_id: servicoId,
        });

        subtotal = round2(subtotal + bruto);
        descontoTotal = round2(descontoTotal + desconto);
      }

      const valorTotal = round2(subtotal - descontoTotal);
      pedidos.push({
        id,
        tenant_id: TENANT_ID,
        cliente_id: cliente.id,
        vendedor_id: vendedor.id,
        territorio_id: vendedor.territorio_id,
        canal_venda_id: canalVendaId,
        data_pedido: randomTimeTs(rng, dataPedido),
        status,
        subtotal,
        desconto_total: descontoTotal,
        valor_total: valorTotal,
        criado_em: randomTimeTs(rng, dataPedido),
        atualizado_em: randomTimeTs(rng, dataPedido),
        cupom_id: null,
        centro_lucro_id: centroLucroId,
        campanha_venda_id: null,
        filial_id: filialId,
        unidade_negocio_id: unidadeNegocioId,
        sales_office_id: null,
        observacoes: "Pedido B2B de distribuicao de semijoias.",
        descricao: "Venda atacado com mix de produtos.",
        categoria_receita_id: categoriaReceitaId,
        data_documento: dataPedido,
        data_lancamento: dataPedido,
        data_vencimento: dataVencimento,
        departamento_id: departamentoId,
      });
    }

    await insertMany(
      client,
      "vendas.pedidos",
      [
        "id",
        "tenant_id",
        "cliente_id",
        "vendedor_id",
        "territorio_id",
        "canal_venda_id",
        "data_pedido",
        "status",
        "subtotal",
        "desconto_total",
        "valor_total",
        "criado_em",
        "atualizado_em",
        "cupom_id",
        "centro_lucro_id",
        "campanha_venda_id",
        "filial_id",
        "unidade_negocio_id",
        "sales_office_id",
        "observacoes",
        "descricao",
        "categoria_receita_id",
        "data_documento",
        "data_lancamento",
        "data_vencimento",
        "departamento_id",
      ],
      pedidos
    );

    await insertMany(
      client,
      "vendas.pedidos_itens",
      [
        "id",
        "tenant_id",
        "pedido_id",
        "produto_id",
        "quantidade",
        "preco_unitario",
        "desconto",
        "subtotal",
        "criado_em",
        "atualizado_em",
        "servico_id",
      ],
      pedidosItens
    );

    const contasReceber = [];
    const contasReceberLinhas = [];
    let contaReceberId = 1;
    let contaReceberLinhaId = 1;

    const pedidosById = new Map(pedidos.map((p) => [p.id, p]));
    const clienteById = new Map(clientes.map((c) => [c.id, c]));

    for (const pedido of pedidos) {
      const contaId = contaReceberId++;
      const cliente = clienteById.get(pedido.cliente_id);

      contasReceber.push({
        id: contaId,
        tenant_id: TENANT_ID,
        numero_documento: `PV-2026-${String(pedido.id).padStart(6, "0")}`,
        serie_documento: "A",
        tipo_documento: "fatura",
        moeda: "BRL",
        cliente_id: pedido.cliente_id,
        nome_cliente_snapshot: cliente?.nome || "Cliente",
        data_documento: pedido.data_documento,
        data_lancamento: pedido.data_lancamento,
        data_vencimento: pedido.data_vencimento,
        valor_bruto: pedido.valor_total,
        valor_desconto: 0,
        valor_impostos: 0,
        valor_liquido: pedido.valor_total,
        status: "pendente",
        categoria_financeira_id: null,
        centro_custo_id: null,
        departamento_id: pedido.departamento_id,
        projeto_id: null,
        filial_id: pedido.filial_id,
        unidade_negocio_id: pedido.unidade_negocio_id,
        observacao: `Gerado a partir do pedido ${pedido.id}.`,
        lancamento_contabil_id: null,
        criado_em: pedido.criado_em,
        atualizado_em: pedido.atualizado_em,
        criado_por: null,
        centro_lucro_id: pedido.centro_lucro_id,
        categoria_receita_id: pedido.categoria_receita_id,
      });

      const itensPedido = pedidosItens.filter((it) => it.pedido_id === pedido.id);
      for (const item of itensPedido) {
        const p = productById.get(item.produto_id);
        contasReceberLinhas.push({
          id: contaReceberLinhaId++,
          conta_receber_id: contaId,
          tipo_linha: "servico",
          produto_id: item.produto_id,
          servico_id: item.servico_id,
          descricao: p ? p.nome : `Item pedido ${pedido.id}`,
          quantidade: item.quantidade,
          valor_unitario: item.preco_unitario,
          valor_bruto: round2(item.quantidade * item.preco_unitario),
          desconto: item.desconto,
          impostos: 0,
          valor_liquido: item.subtotal,
          categoria_financeira_id: null,
          centro_custo_id: null,
          departamento_id: pedido.departamento_id,
          projeto_id: null,
          unidade_negocio_id: pedido.unidade_negocio_id,
          criado_em: pedido.criado_em,
        });
      }
    }

    const contasPagar = [];
    const contasPagarLinhas = [];
    let contaPagarId = 1;
    let contaPagarLinhaId = 1;

    const fornecedorById = new Map(fornecedores.map((f) => [f.id, f]));
    const linhasCompraByCompra = new Map();
    for (const linha of comprasLinhas) {
      if (!linhasCompraByCompra.has(linha.compra_id)) linhasCompraByCompra.set(linha.compra_id, []);
      linhasCompraByCompra.get(linha.compra_id).push(linha);
    }

    for (const compra of compras) {
      const contaId = contaPagarId++;
      const fornecedor = fornecedorById.get(compra.fornecedor_id);

      contasPagar.push({
        id: contaId,
        tenant_id: TENANT_ID,
        numero_documento: compra.numero_oc,
        serie_documento: "A",
        tipo_documento: "fatura",
        moeda: "BRL",
        fornecedor_id: compra.fornecedor_id,
        nome_fornecedor_snapshot: fornecedor?.nome || "Fornecedor",
        data_documento: compra.data_documento,
        data_lancamento: compra.data_lancamento,
        data_vencimento: compra.data_vencimento,
        valor_bruto: compra.valor_total,
        valor_desconto: 0,
        valor_impostos: 0,
        valor_liquido: compra.valor_total,
        status: "pendente",
        categoria_financeira_id: null,
        centro_custo_id: compra.centro_custo_id,
        departamento_id: compra.departamento_id,
        projeto_id: null,
        filial_id: compra.filial_id,
        unidade_negocio_id: null,
        observacao: `Gerado a partir da compra ${compra.id}.`,
        criado_em: compra.criado_em,
        atualizado_em: compra.atualizado_em,
        criado_por: null,
        categoria_despesa_id: compra.categoria_despesa_id,
        lancamento_contabil_id: null,
        conta_financeira_id: null,
      });

      const linhas = linhasCompraByCompra.get(compra.id) || [];
      for (const linha of linhas) {
        const p = productById.get(linha.produto_id);
        contasPagarLinhas.push({
          id: contaPagarLinhaId++,
          conta_pagar_id: contaId,
          tipo_linha: "despesa",
          produto_id: linha.produto_id,
          servico_id: null,
          descricao: p ? p.nome : `Item compra ${compra.id}`,
          quantidade: linha.quantidade,
          valor_unitario: linha.preco_unitario,
          valor_bruto: linha.total,
          desconto: 0,
          impostos: 0,
          valor_liquido: linha.total,
          categoria_financeira_id: null,
          centro_custo_id: compra.centro_custo_id,
          departamento_id: compra.departamento_id,
          projeto_id: null,
          criado_em: compra.criado_em,
          categoria_despesa_id: compra.categoria_despesa_id,
          unidade_negocio_id: null,
        });
      }
    }

    await insertMany(
      client,
      "financeiro.contas_receber",
      [
        "id",
        "tenant_id",
        "numero_documento",
        "serie_documento",
        "tipo_documento",
        "moeda",
        "cliente_id",
        "nome_cliente_snapshot",
        "data_documento",
        "data_lancamento",
        "data_vencimento",
        "valor_bruto",
        "valor_desconto",
        "valor_impostos",
        "valor_liquido",
        "status",
        "categoria_financeira_id",
        "centro_custo_id",
        "departamento_id",
        "projeto_id",
        "filial_id",
        "unidade_negocio_id",
        "observacao",
        "lancamento_contabil_id",
        "criado_em",
        "atualizado_em",
        "criado_por",
        "centro_lucro_id",
        "categoria_receita_id",
      ],
      contasReceber
    );

    await insertMany(
      client,
      "financeiro.contas_receber_linhas",
      [
        "id",
        "conta_receber_id",
        "tipo_linha",
        "produto_id",
        "servico_id",
        "descricao",
        "quantidade",
        "valor_unitario",
        "valor_bruto",
        "desconto",
        "impostos",
        "valor_liquido",
        "categoria_financeira_id",
        "centro_custo_id",
        "departamento_id",
        "projeto_id",
        "unidade_negocio_id",
        "criado_em",
      ],
      contasReceberLinhas
    );

    await insertMany(
      client,
      "financeiro.contas_pagar",
      [
        "id",
        "tenant_id",
        "numero_documento",
        "serie_documento",
        "tipo_documento",
        "moeda",
        "fornecedor_id",
        "nome_fornecedor_snapshot",
        "data_documento",
        "data_lancamento",
        "data_vencimento",
        "valor_bruto",
        "valor_desconto",
        "valor_impostos",
        "valor_liquido",
        "status",
        "categoria_financeira_id",
        "centro_custo_id",
        "departamento_id",
        "projeto_id",
        "filial_id",
        "unidade_negocio_id",
        "observacao",
        "criado_em",
        "atualizado_em",
        "criado_por",
        "categoria_despesa_id",
        "lancamento_contabil_id",
        "conta_financeira_id",
      ],
      contasPagar
    );

    await insertMany(
      client,
      "financeiro.contas_pagar_linhas",
      [
        "id",
        "conta_pagar_id",
        "tipo_linha",
        "produto_id",
        "servico_id",
        "descricao",
        "quantidade",
        "valor_unitario",
        "valor_bruto",
        "desconto",
        "impostos",
        "valor_liquido",
        "categoria_financeira_id",
        "centro_custo_id",
        "departamento_id",
        "projeto_id",
        "criado_em",
        "categoria_despesa_id",
        "unidade_negocio_id",
      ],
      contasPagarLinhas
    );

    const sequenceSync = [];
    const sequenceTables = [
      "compras.compras",
      "compras.compras_linhas",
      "vendas.pedidos",
      "vendas.pedidos_itens",
      "financeiro.contas_pagar",
      "financeiro.contas_pagar_linhas",
      "financeiro.contas_receber",
      "financeiro.contas_receber_linhas",
    ];
    for (const table of sequenceTables) {
      sequenceSync.push(await alignIdSequence(client, table, "id"));
    }

    const sequenceErrors = sequenceSync.filter((s) => !s.ok);
    if (sequenceErrors.length > 0) {
      throw new Error(
        `Falha ao sincronizar sequences: ${sequenceErrors.map((s) => s.table).join(", ")}`
      );
    }

    await client.query("COMMIT");

    const summary = {
      ok: true,
      period: { start: DATE_START, end: DATE_END },
      vendas: {
        pedidos: pedidos.length,
        itens: pedidosItens.length,
      },
      compras: {
        compras: compras.length,
        itens: comprasLinhas.length,
      },
      financeiro: {
        contas_receber: contasReceber.length,
        linhas_receber: contasReceberLinhas.length,
        contas_pagar: contasPagar.length,
        linhas_pagar: contasPagarLinhas.length,
      },
      sequence_sync: sequenceSync,
    };
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  } catch (error) {
    try {
      await client.query("ROLLBACK");
    } catch {
      // ignore
    }
    console.error(error instanceof Error ? error.stack || error.message : String(error));
    process.exit(1);
  } finally {
    await client.end().catch(() => {});
  }
}

main();
