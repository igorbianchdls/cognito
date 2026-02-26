#!/usr/bin/env node

import { Client } from "pg";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

function getArg(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

function hasFlag(name) {
  return process.argv.includes(name);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

function createRng(seed = 20260226) {
  let s = seed >>> 0;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function randInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randFloat(rng, min, max) {
  return min + (max - min) * rng();
}

function chance(rng, p) {
  return rng() < p;
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function weightedPick(rng, items) {
  const total = items.reduce((acc, x) => acc + Number(x.weight || 0), 0);
  if (!total) return items[0]?.value;
  let t = rng() * total;
  for (const item of items) {
    t -= Number(item.weight || 0);
    if (t <= 0) return item.value;
  }
  return items[items.length - 1]?.value;
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function round4(n) {
  return Math.round((n + Number.EPSILON) * 10000) / 10000;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function pad3(n) {
  return String(n).padStart(3, "0");
}

function startOfUtcDay(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0, 0));
}

function addDays(date, n) {
  const d = new Date(date.getTime());
  d.setUTCDate(d.getUTCDate() + n);
  return d;
}

function daysAgo(n) {
  const now = new Date();
  const d = startOfUtcDay(now);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

function randomDateInWindow(rng, startDate, endDate) {
  const a = startDate.getTime();
  const b = endDate.getTime();
  const t = a + Math.floor(rng() * (b - a + 1));
  return new Date(t);
}

function randomTimestampOnDate(rng, date) {
  const d = new Date(date.getTime());
  d.setUTCHours(randInt(rng, 8, 21), randInt(rng, 0, 59), randInt(rng, 0, 59), 0);
  return d;
}

function addHours(date, hours) {
  return new Date(date.getTime() + Math.round(hours * 3600000));
}

function toPgTs(date) {
  return date instanceof Date ? date.toISOString() : null;
}

function toPgDate(date) {
  return date instanceof Date ? date.toISOString().slice(0, 10) : null;
}

function slugify(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function quoteIdent(id) {
  return `"${String(id).replace(/"/g, '""')}"`;
}

function quoteTable(table) {
  return String(table)
    .split(".")
    .map((p) => quoteIdent(p))
    .join(".");
}

function normalizeReturnedRow(row) {
  const out = {};
  for (const [k, v] of Object.entries(row || {})) {
    if (typeof v === "string" && /^-?\d+$/.test(v) && Math.abs(Number(v)) <= Number.MAX_SAFE_INTEGER) {
      out[k] = Number(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

async function insertMany(client, table, columns, rows, opts = {}) {
  if (!Array.isArray(rows) || rows.length === 0) return [];
  const returning = Array.isArray(opts.returning) ? opts.returning.filter(Boolean) : [];
  const hardChunk = Number(opts.chunkSize || 0) > 0 ? Number(opts.chunkSize) : 0;
  const dynamicChunk = Math.max(25, Math.min(400, Math.floor(50000 / Math.max(1, columns.length))));
  const chunkSize = hardChunk || dynamicChunk;
  const out = [];

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const params = [];
    const valuesSql = [];

    for (let r = 0; r < chunk.length; r += 1) {
      const row = chunk[r];
      const base = r * columns.length;
      valuesSql.push(`(${columns.map((_, c) => `$${base + c + 1}`).join(",")})`);
      for (const col of columns) {
        const value = Object.prototype.hasOwnProperty.call(row, col) ? row[col] : null;
        // pg serializes JS arrays as postgres arrays; for json/jsonb payloads we need JSON text.
        params.push(Array.isArray(value) ? JSON.stringify(value) : value);
      }
    }

    const sql =
      `INSERT INTO ${quoteTable(table)} (${columns.map(quoteIdent).join(", ")}) VALUES ${valuesSql.join(", ")}` +
      (returning.length ? ` RETURNING ${returning.map(quoteIdent).join(", ")}` : "");
    const res = await client.query(sql, params);
    if (returning.length) out.push(...(res.rows || []).map(normalizeReturnedRow));
  }

  return out;
}

function buildProfiles() {
  return {
    small: { days: 90, products: 36, customers: 700, orders: 1100 },
    medium: { days: 180, products: 96, customers: 1800, orders: 3200 },
    large: { days: 365, products: 220, customers: 6000, orders: 14000 },
  };
}

const PLATFORMS = [
  {
    plataforma: "amazon",
    nomeConta: "Amazon Seller BR",
    nomeLoja: "Amazon BR - Oficial",
    orderWeight: 0.2,
    ticketMin: 90,
    ticketMax: 230,
    feeRate: 0.16,
    gatewayFeeRate: 0.012,
    shippingSubsidyRate: 0.04,
    payoutCycleDays: 14,
    customerRepeatBias: 0.35,
    itemCountWeights: [
      { value: 1, weight: 62 },
      { value: 2, weight: 26 },
      { value: 3, weight: 9 },
      { value: 4, weight: 3 },
    ],
    cancelRate: 0.06,
    refundRate: 0.04,
  },
  {
    plataforma: "mercadolivre",
    nomeConta: "Mercado Livre BR",
    nomeLoja: "ML BR - Loja Oficial",
    orderWeight: 0.33,
    ticketMin: 65,
    ticketMax: 190,
    feeRate: 0.145,
    gatewayFeeRate: 0.0,
    shippingSubsidyRate: 0.07,
    payoutCycleDays: 7,
    customerRepeatBias: 0.22,
    itemCountWeights: [
      { value: 1, weight: 69 },
      { value: 2, weight: 22 },
      { value: 3, weight: 7 },
      { value: 4, weight: 2 },
    ],
    cancelRate: 0.07,
    refundRate: 0.05,
  },
  {
    plataforma: "shopee",
    nomeConta: "Shopee BR",
    nomeLoja: "Shopee BR - Oficial",
    orderWeight: 0.25,
    ticketMin: 35,
    ticketMax: 130,
    feeRate: 0.12,
    gatewayFeeRate: 0.0,
    shippingSubsidyRate: 0.09,
    payoutCycleDays: 7,
    customerRepeatBias: 0.2,
    itemCountWeights: [
      { value: 1, weight: 74 },
      { value: 2, weight: 18 },
      { value: 3, weight: 6 },
      { value: 4, weight: 2 },
    ],
    cancelRate: 0.08,
    refundRate: 0.06,
  },
  {
    plataforma: "shopify",
    nomeConta: "Shopify DTC BR",
    nomeLoja: "DTC BR - Shopify",
    orderWeight: 0.22,
    ticketMin: 110,
    ticketMax: 320,
    feeRate: 0.0,
    gatewayFeeRate: 0.034,
    shippingSubsidyRate: 0.03,
    payoutCycleDays: 5,
    customerRepeatBias: 0.58,
    itemCountWeights: [
      { value: 1, weight: 57 },
      { value: 2, weight: 28 },
      { value: 3, weight: 11 },
      { value: 4, weight: 4 },
    ],
    cancelRate: 0.04,
    refundRate: 0.035,
  },
];

const CATEGORIES = [
  { slug: "skincare", nome: "Skincare", priceFactor: [0.9, 1.2] },
  { slug: "haircare", nome: "Haircare", priceFactor: [0.8, 1.15] },
  { slug: "supplements", nome: "Suplementos", priceFactor: [1.0, 1.45] },
  { slug: "beauty-tools", nome: "Beauty Tools", priceFactor: [0.7, 1.0] },
  { slug: "wellness", nome: "Wellness", priceFactor: [0.95, 1.35] },
];

const PRODUCT_BASES = [
  "Serum Vitamina C",
  "Creme Hidratante Facial",
  "Gel de Limpeza",
  "Protetor Solar Toque Seco",
  "Mascara de Argila",
  "Esfoliante Enzimatico",
  "Tonico Calmante",
  "Shampoo Fortalecedor",
  "Condicionador Reparacao",
  "Leave-in Termoprotetor",
  "Colageno Verisol",
  "Multivitaminico Mulher",
  "Multivitaminico Homem",
  "Omega 3 TG",
  "Magnesio Quelato",
  "Escova Facial de Silicone",
  "Roller Facial",
  "Kit Rotina Acne",
  "Kit Rotina Glow",
  "Kit Queda de Cabelo",
];

const BRANDS = ["Lumina", "AuraVita", "Nativa Care", "BioDerm", "WellPrime", "DTC Labs"];

const FIRST_NAMES = ["Ana", "Bruno", "Carla", "Daniel", "Eduarda", "Felipe", "Gabriela", "Henrique", "Isabela", "Joao", "Karen", "Lucas", "Mariana", "Nicolas", "Olivia", "Paulo", "Renata", "Samuel", "Tatiane", "Vinicius"];
const LAST_NAMES = ["Silva", "Souza", "Oliveira", "Lima", "Costa", "Ferreira", "Almeida", "Ribeiro", "Gomes", "Martins", "Barbosa", "Melo", "Cardoso", "Teixeira", "Rocha"];
const CITIES = [
  { cidade: "Sao Paulo", estado: "SP", cepPrefix: "01" },
  { cidade: "Rio de Janeiro", estado: "RJ", cepPrefix: "20" },
  { cidade: "Belo Horizonte", estado: "MG", cepPrefix: "30" },
  { cidade: "Curitiba", estado: "PR", cepPrefix: "80" },
  { cidade: "Porto Alegre", estado: "RS", cepPrefix: "90" },
  { cidade: "Recife", estado: "PE", cepPrefix: "50" },
  { cidade: "Salvador", estado: "BA", cepPrefix: "40" },
  { cidade: "Fortaleza", estado: "CE", cepPrefix: "60" },
];
const STREETS = ["Rua das Flores", "Av Paulista", "Rua Augusta", "Rua do Comercio", "Av Atlantica", "Rua Sete de Setembro", "Av Brasil", "Rua XV de Novembro", "Alameda Santos"];

function makeRunTag(seed) {
  const d = new Date();
  return `ecmvp${d.getUTCFullYear()}${pad2(d.getUTCMonth() + 1)}${pad2(d.getUTCDate())}${pad2(d.getUTCHours())}${pad2(d.getUTCMinutes())}${pad2(d.getUTCSeconds())}-s${seed}`;
}

function platformLabel(plataforma) {
  if (plataforma === "mercadolivre") return "Mercado Livre";
  if (plataforma === "shopee") return "Shopee";
  if (plataforma === "shopify") return "Shopify";
  if (plataforma === "amazon") return "Amazon";
  return plataforma;
}

function generateProductsAndVariants({ rng, tenantId, runTag, productCount, channelAccountsByPlatform }) {
  const produtos = [];
  const variantes = [];
  let productSeq = 1;
  let variantSeq = 1;

  for (let i = 0; i < productCount; i += 1) {
    const category = pick(rng, CATEGORIES);
    const baseName = pick(rng, PRODUCT_BASES);
    const brand = pick(rng, BRANDS);
    const name = `${baseName} ${randInt(rng, 1, 99)} ${chance(rng, 0.35) ? "Pro" : ""}`.trim();
    const codigo = `PRD-${runTag}-${String(productSeq).padStart(4, "0")}`;
    const skuBase = `SKU-${runTag}-${String(productSeq).padStart(4, "0")}`;
    const lojaShopify = channelAccountsByPlatform.get("shopify")?.loja_id || null;
    const canalShopify = channelAccountsByPlatform.get("shopify")?.id || null;
    const priceBase = randFloat(rng, 38, 220) * randFloat(rng, category.priceFactor[0], category.priceFactor[1]);
    const costBase = priceBase * randFloat(rng, 0.28, 0.56);

    produtos.push({
      tenant_id: tenantId,
      plataforma: "internal",
      canal_conta_id: canalShopify,
      loja_id: lojaShopify,
      external_id: `prd_${runTag}_${productSeq}`,
      sku_principal: `${skuBase}-01`,
      codigo_interno: codigo,
      nome: name,
      descricao: `${name} da linha ${brand} para rotina de ${category.nome.toLowerCase()}.`,
      marca: brand,
      categoria: category.nome,
      status: "active",
      ativo: true,
      peso_kg: round4(randFloat(rng, 0.08, 0.9)),
      altura_cm: round4(randFloat(rng, 4, 22)),
      largura_cm: round4(randFloat(rng, 4, 20)),
      comprimento_cm: round4(randFloat(rng, 4, 20)),
      atributos_jsonb: { categoria_slug: category.slug, linha: chance(rng, 0.4) ? "premium" : "core" },
      metadata_jsonb: { seed_run: runTag, product_seq: productSeq },
      payload_raw: { source: "seed_mvp", category: category.slug },
      source_created_at: new Date().toISOString(),
      source_updated_at: new Date().toISOString(),
      synced_at: new Date().toISOString(),
    });

    const variantCount = weightedPick(rng, [
      { value: 1, weight: 20 },
      { value: 2, weight: 42 },
      { value: 3, weight: 28 },
      { value: 4, weight: 10 },
    ]);
    const sizeLabels = ["30ml", "60ml", "90ml", "120ml", "Refil", "Kit"];
    const usedVariantNames = new Set();
    for (let v = 0; v < variantCount; v += 1) {
      let variantLabel = sizeLabels[v] || `${10 * (v + 1)}un`;
      if (usedVariantNames.has(variantLabel)) variantLabel = `${variantLabel}-${v + 1}`;
      usedVariantNames.add(variantLabel);
      const listPrice = round2(priceBase * randFloat(rng, 0.85, 1.35) * (1 + v * 0.06));
      const cost = round2(costBase * randFloat(rng, 0.9, 1.2) * (1 + v * 0.04));
      variantes.push({
        _tmp_product_seq: productSeq,
        _tmp_variant_seq: variantSeq,
        tenant_id: tenantId,
        plataforma: "internal",
        canal_conta_id: canalShopify,
        produto_id: null,
        external_id: `var_${runTag}_${variantSeq}`,
        sku: `${skuBase}-${String(v + 1).padStart(2, "0")}`,
        gtin: `${randInt(rng, 7891000000000, 7891999999999)}`,
        ean: null,
        asin: chance(rng, 0.12) ? `B0${Math.floor(rng() * 36 ** 8).toString(36).toUpperCase().padStart(8, "0")}` : null,
        mpn: `MPN-${runTag}-${variantSeq}`,
        nome: `${name} ${variantLabel}`,
        status: "active",
        ativo: true,
        preco_sugerido: listPrice,
        custo_unitario: cost,
        peso_kg: round4(randFloat(rng, 0.05, 0.8)),
        atributos_jsonb: { variant_label: variantLabel, size: variantLabel },
        metadata_jsonb: { seed_run: runTag, product_seq: productSeq, variant_seq: variantSeq },
        payload_raw: { source: "seed_mvp" },
        source_created_at: new Date().toISOString(),
        source_updated_at: new Date().toISOString(),
        synced_at: new Date().toISOString(),
      });
      variantSeq += 1;
    }
    productSeq += 1;
  }

  return { produtos, variantes };
}

function buildCustomers({ rng, tenantId, runTag, targetCount, channels }) {
  const clientes = [];
  const enderecos = [];
  const perChannel = new Map(channels.map((c) => [c.id, []]));
  let customerSeq = 1;
  let addressSeq = 1;

  const weightedChannels = channels.map((c) => {
    const cfg = c._cfg;
    return { value: c, weight: Math.max(1, Math.round(cfg.orderWeight * 100)) };
  });

  for (let i = 0; i < targetCount; i += 1) {
    const channel = weightedPick(rng, weightedChannels);
    const first = pick(rng, FIRST_NAMES);
    const last = pick(rng, LAST_NAMES);
    const city = pick(rng, CITIES);
    const fullName = `${first} ${last}`;
    const emailBase = `${slugify(first)}.${slugify(last)}.${String(customerSeq).padStart(4, "0")}`;
    const cliente = {
      _tmp_seq: customerSeq,
      _tmp_channel_id: channel.id,
      tenant_id: tenantId,
      plataforma: channel.plataforma,
      canal_conta_id: channel.id,
      loja_id: channel.loja_id,
      external_id: `cli_${channel.plataforma}_${runTag}_${customerSeq}`,
      codigo: `CLI-${runTag}-${String(customerSeq).padStart(5, "0")}`,
      nome: fullName,
      email: chance(rng, 0.94) ? `${emailBase}@${pick(rng, ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com.br"])}` : null,
      telefone: `55${randInt(rng, 11, 99)}9${randInt(rng, 1000, 9999)}${randInt(rng, 1000, 9999)}`,
      documento: chance(rng, 0.75) ? `${randInt(rng, 10000000000, 99999999999)}` : null,
      tipo_pessoa: "fisica",
      status: chance(rng, 0.97) ? "active" : "inactive",
      tags_jsonb: chance(rng, 0.2) ? ["vip"] : [],
      metadata_jsonb: { seed_run: runTag, segment: channel.plataforma },
      payload_raw: { source: "seed_mvp" },
      source_created_at: new Date().toISOString(),
      source_updated_at: new Date().toISOString(),
      synced_at: new Date().toISOString(),
    };
    clientes.push(cliente);
    perChannel.get(channel.id)?.push(cliente);

    const addrCount = chance(rng, 0.22) ? 2 : 1;
    for (let a = 0; a < addrCount; a += 1) {
      const tipo = a === 0 ? "shipping" : "billing";
      const c = chance(rng, 0.18) ? pick(rng, CITIES) : city;
      enderecos.push({
        _tmp_cliente_seq: customerSeq,
        _tmp_tipo: tipo,
        _tmp_addr_seq: addressSeq,
        tenant_id: tenantId,
        plataforma: channel.plataforma,
        canal_conta_id: channel.id,
        cliente_id: null,
        external_id: `addr_${channel.plataforma}_${runTag}_${addressSeq}`,
        tipo,
        nome_destinatario: fullName,
        documento_destinatario: cliente.documento,
        telefone: cliente.telefone,
        email: cliente.email,
        pais: "BR",
        estado: c.estado,
        cidade: c.cidade,
        bairro: `Bairro ${randInt(rng, 1, 40)}`,
        logradouro: pick(rng, STREETS),
        numero: `${randInt(rng, 10, 2200)}`,
        complemento: chance(rng, 0.25) ? `Apto ${randInt(rng, 1, 999)}` : null,
        cep: `${c.cepPrefix}${randInt(rng, 10000, 99999)}-${randInt(rng, 100, 999)}`,
        referencia: chance(rng, 0.18) ? "Portaria" : null,
        latitude: null,
        longitude: null,
        metadata_jsonb: { seed_run: runTag },
        payload_raw: { source: "seed_mvp" },
        source_created_at: new Date().toISOString(),
        source_updated_at: new Date().toISOString(),
        synced_at: new Date().toISOString(),
      });
      addressSeq += 1;
    }

    customerSeq += 1;
  }

  return { clientes, enderecos, customersByChannel: perChannel };
}

function buildListings({ rng, tenantId, runTag, variantsDb, productsById, channels }) {
  const listings = [];
  const listingVariantes = [];
  let listingSeq = 1;
  const byChannel = new Map(channels.map((c) => [c.id, []]));
  const priceMultiplier = { amazon: 1.08, mercadolivre: 1.03, shopee: 0.94, shopify: 1.0 };
  const listingProb = { amazon: 0.48, mercadolivre: 0.68, shopee: 0.62, shopify: 0.92 };

  for (const variant of variantsDb) {
    const product = productsById.get(variant.produto_id);
    if (!product) continue;
    const selected = [];
    for (const channel of channels) {
      if (chance(rng, listingProb[channel.plataforma] ?? 0.5)) selected.push(channel);
    }
    if (!selected.length) selected.push(pick(rng, channels));

    for (const channel of selected) {
      const title = `${product.nome} ${variant.atributos_jsonb?.variant_label || ""}`.trim();
      const basePrice = Number(variant.preco_sugerido || 0);
      const listPrice = round2(basePrice * (priceMultiplier[channel.plataforma] ?? 1) * randFloat(rng, 0.94, 1.12));
      const promoPrice = chance(rng, 0.33) ? round2(listPrice * randFloat(rng, 0.82, 0.96)) : null;
      const estoque = randInt(rng, 8, 160);
      const listing = {
        _tmp_listing_seq: listingSeq,
        _tmp_channel_id: channel.id,
        _tmp_prod_var_id: variant.id,
        tenant_id: tenantId,
        plataforma: channel.plataforma,
        canal_conta_id: channel.id,
        loja_id: channel.loja_id,
        produto_id: variant.produto_id,
        produto_variante_id: variant.id,
        external_id: `lst_${channel.plataforma}_${runTag}_${listingSeq}`,
        parent_external_id: null,
        sku: variant.sku,
        titulo: title,
        status: chance(rng, 0.9) ? "active" : chance(rng, 0.5) ? "paused" : "draft",
        condicao: "new",
        moeda: "BRL",
        preco_anunciado: listPrice,
        preco_promocional: promoPrice,
        estoque_disponivel: estoque,
        estoque_reservado: randInt(rng, 0, 8),
        url: `https://${channel.plataforma}.example.com/item/${runTag}/${listingSeq}`,
        imagem_url: `https://cdn.example.com/${slugify(product.nome)}-${listingSeq}.jpg`,
        categoria_canal_id: `${channel.plataforma}-${slugify(product.categoria || "geral")}`,
        categoria_canal_nome: product.categoria || "Geral",
        atributos_jsonb: { shipping_type: chance(rng, 0.6) ? "fulfillment" : "seller" },
        metadata_jsonb: { seed_run: runTag },
        payload_raw: { source: "seed_mvp" },
        source_created_at: new Date().toISOString(),
        source_updated_at: new Date().toISOString(),
        synced_at: new Date().toISOString(),
      };
      listings.push(listing);
      byChannel.get(channel.id)?.push(listing);
      listingVariantes.push({
        _tmp_listing_seq: listingSeq,
        tenant_id: tenantId,
        plataforma: channel.plataforma,
        canal_conta_id: channel.id,
        listing_id: null,
        produto_variante_id: variant.id,
        external_id: `lvar_${channel.plataforma}_${runTag}_${listingSeq}`,
        sku: variant.sku,
        status: listing.status,
        moeda: "BRL",
        preco: listPrice,
        preco_promocional: promoPrice,
        estoque_disponivel: estoque,
        atributos_jsonb: { seller_sku: variant.sku },
        metadata_jsonb: { seed_run: runTag },
        payload_raw: { source: "seed_mvp" },
        source_created_at: new Date().toISOString(),
        source_updated_at: new Date().toISOString(),
        synced_at: new Date().toISOString(),
      });
      listingSeq += 1;
    }
  }

  return { listings, listingVariantes, listingsByChannel: byChannel };
}

function mapOrderState(status) {
  switch (status) {
    case "cancelado":
      return { payment: "cancelled", fulfillment: "cancelled" };
    case "novo":
      return { payment: "pending", fulfillment: "unfulfilled" };
    case "pago":
      return { payment: "captured", fulfillment: "unfulfilled" };
    case "em_separacao":
      return { payment: "captured", fulfillment: "processing" };
    case "enviado":
      return { payment: "captured", fulfillment: "shipped" };
    case "entregue":
      return { payment: "captured", fulfillment: "delivered" };
    case "reembolsado_parcial":
      return { payment: "partially_refunded", fulfillment: "delivered" };
    case "reembolsado_total":
      return { payment: "refunded", fulfillment: "returned" };
    default:
      return { payment: "pending", fulfillment: "unfulfilled" };
  }
}

function chooseOrderStatus(rng, platformCfg) {
  const base = [
    { value: "novo", weight: 4 },
    { value: "pago", weight: 8 },
    { value: "em_separacao", weight: 5 },
    { value: "enviado", weight: 9 },
    { value: "entregue", weight: 100 - Math.round((platformCfg.cancelRate + platformCfg.refundRate) * 100) - 26 },
    { value: "cancelado", weight: Math.max(2, Math.round(platformCfg.cancelRate * 100)) },
    { value: "reembolsado_parcial", weight: Math.max(1, Math.round(platformCfg.refundRate * 55)) },
    { value: "reembolsado_total", weight: Math.max(1, Math.round(platformCfg.refundRate * 45)) },
  ];
  return weightedPick(rng, base);
}

function sampleDistinct(rng, arr, count) {
  if (arr.length <= count) return arr.slice();
  const used = new Set();
  const out = [];
  while (out.length < count && used.size < arr.length) {
    const idx = randInt(rng, 0, arr.length - 1);
    if (used.has(idx)) continue;
    used.add(idx);
    out.push(arr[idx]);
  }
  return out;
}

function buildOrdersPlan({
  rng,
  tenantId,
  runTag,
  orderCount,
  startDate,
  endDate,
  channels,
  customersByChannelId,
  addressesByCustomerId,
  listingsByChannelId,
}) {
  const orders = [];
  const items = [];
  const refundCandidates = [];
  let orderSeq = 1;
  let itemSeq = 1;

  const weightedChannels = channels.map((c) => ({ value: c, weight: Math.max(1, Math.round(c._cfg.orderWeight * 100)) }));
  const customerHistoryByChannel = new Map(channels.map((c) => [c.id, []]));

  for (let i = 0; i < orderCount; i += 1) {
    const channel = weightedPick(rng, weightedChannels);
    const platformCfg = channel._cfg;
    const channelListings = (listingsByChannelId.get(channel.id) || []).filter((l) => l.status !== "draft");
    if (!channelListings.length) continue;
    const channelCustomers = customersByChannelId.get(channel.id) || [];
    const history = customerHistoryByChannel.get(channel.id) || [];
    let customer = null;
    if (history.length && chance(rng, platformCfg.customerRepeatBias)) {
      customer = pick(rng, history);
    } else if (channelCustomers.length) {
      customer = pick(rng, channelCustomers);
      history.push(customer);
      customerHistoryByChannel.set(channel.id, history.slice(-250));
    } else {
      continue;
    }

    const customerAddresses = addressesByCustomerId.get(customer.id) || [];
    const shippingAddress = customerAddresses.find((a) => a.tipo === "shipping") || customerAddresses[0] || null;
    const billingAddress = customerAddresses.find((a) => a.tipo === "billing") || shippingAddress || null;

    const itemCount = weightedPick(rng, platformCfg.itemCountWeights);
    const selectedListings = sampleDistinct(rng, channelListings, itemCount);
    if (!selectedListings.length) continue;

    const orderDate = randomDateInWindow(rng, startDate, endDate);
    const orderTs = randomTimestampOnDate(rng, orderDate);
    const status = chooseOrderStatus(rng, platformCfg);
    const state = mapOrderState(status);

    let subtotal = 0;
    let discountTotal = 0;
    let taxesTotal = 0;

    const orderItemDrafts = [];
    for (let line = 0; line < selectedListings.length; line += 1) {
      const listing = selectedListings[line];
      const qty = weightedPick(rng, [
        { value: 1, weight: 76 },
        { value: 2, weight: 18 },
        { value: 3, weight: 5 },
        { value: 4, weight: 1 },
      ]);
      const unit = round2(Number(listing.preco_promocional || listing.preco_anunciado || randFloat(rng, platformCfg.ticketMin, platformCfg.ticketMax)));
      const gross = round2(unit * qty);
      const itemDiscount = chance(rng, 0.32) ? round2(gross * randFloat(rng, 0.03, 0.18)) : 0;
      const itemTaxes = round2((gross - itemDiscount) * randFloat(rng, 0.0, 0.06));
      subtotal += gross;
      discountTotal += itemDiscount;
      taxesTotal += itemTaxes;
      orderItemDrafts.push({ listing, qty, unit, gross, itemDiscount, itemTaxes, line });
    }

    const freightTotal = round2(randFloat(rng, 9, 28) * (1 + Math.max(0, selectedListings.length - 1) * 0.2));
    const total = round2(Math.max(0, subtotal - discountTotal + taxesTotal + freightTotal));

    const approvedAt = state.payment === "pending" || state.payment === "cancelled" ? null : addHours(orderTs, randFloat(rng, 0.05, 24));
    const shippedAt = (state.fulfillment === "shipped" || state.fulfillment === "delivered" || state.fulfillment === "returned")
      ? addHours(approvedAt || orderTs, randFloat(rng, 6, 72))
      : null;
    const deliveredAt = (state.fulfillment === "delivered" || state.fulfillment === "returned")
      ? addHours(shippedAt || approvedAt || orderTs, randFloat(rng, 24, 168))
      : null;
    const cancelledAt = status === "cancelado" ? addHours(orderTs, randFloat(rng, 0.2, 24)) : null;

    const refundAmount =
      status === "reembolsado_total"
        ? total
        : status === "reembolsado_parcial"
          ? round2(total * randFloat(rng, 0.2, 0.8))
          : 0;
    const paidAmount = state.payment === "cancelled" || state.payment === "pending" ? 0 : total;

    const platformFeeEstimate = round2((subtotal - discountTotal) * platformCfg.feeRate);
    const gatewayFeeEstimate = round2(total * platformCfg.gatewayFeeRate);
    const shippingSubsidyEstimate = round2(freightTotal * platformCfg.shippingSubsidyRate);
    const estimatedFees = platformFeeEstimate + gatewayFeeEstimate + shippingSubsidyEstimate;
    const netEstimate = round2(total - estimatedFees - refundAmount);

    const orderExternal = `ord_${channel.plataforma}_${runTag}_${String(orderSeq).padStart(6, "0")}`;
    orders.push({
      _tmp_order_seq: orderSeq,
      _tmp_channel_id: channel.id,
      _tmp_store_id: channel.loja_id,
      _tmp_customer_id: customer.id,
      _tmp_shipping_addr_id: shippingAddress?.id || null,
      _tmp_billing_addr_id: billingAddress?.id || null,
      _tmp_status: status,
      _tmp_payment_status: state.payment,
      _tmp_fulfillment_status: state.fulfillment,
      _tmp_order_ts: orderTs,
      _tmp_approved_at: approvedAt,
      _tmp_shipped_at: shippedAt,
      _tmp_delivered_at: deliveredAt,
      _tmp_cancelled_at: cancelledAt,
      _tmp_refund_amount: refundAmount,
      _tmp_fee_estimate: estimatedFees,
      tenant_id: tenantId,
      plataforma: channel.plataforma,
      canal_conta_id: channel.id,
      loja_id: channel.loja_id,
      cliente_id: customer.id,
      endereco_entrega_id: shippingAddress?.id || null,
      endereco_cobranca_id: billingAddress?.id || null,
      external_id: orderExternal,
      parent_external_id: null,
      numero_pedido: `EC-${String(orderSeq).padStart(8, "0")}`,
      numero_pedido_canal: `${platformLabel(channel.plataforma).slice(0, 2).toUpperCase()}-${String(orderSeq).padStart(8, "0")}`,
      status,
      status_pagamento: state.payment,
      status_fulfillment: state.fulfillment,
      moeda: "BRL",
      subtotal: round2(subtotal),
      desconto_total: round2(discountTotal),
      frete_total: freightTotal,
      impostos_total: round2(taxesTotal),
      taxa_total: round2(estimatedFees),
      valor_total: total,
      valor_pago: round2(paidAmount),
      valor_reembolsado: round2(refundAmount),
      valor_liquido_estimado: netEstimate,
      data_pedido: toPgTs(orderTs),
      data_aprovacao: toPgTs(approvedAt),
      data_cancelamento: toPgTs(cancelledAt),
      observacoes: chance(rng, 0.08) ? "Cliente solicitou observacao no envio." : null,
      tags_jsonb: ["seed_mvp", channel.plataforma],
      metadata_jsonb: { seed_run: runTag },
      payload_raw: { source: "seed_mvp" },
      source_created_at: toPgTs(orderTs),
      source_updated_at: toPgTs(addHours(orderTs, randFloat(rng, 0.2, 96))),
      synced_at: new Date().toISOString(),
    });

    let allocatedFreight = 0;
    for (let idx = 0; idx < orderItemDrafts.length; idx += 1) {
      const d = orderItemDrafts[idx];
      const isLast = idx === orderItemDrafts.length - 1;
      const proportional = subtotal > 0 ? (d.gross / subtotal) * freightTotal : 0;
      const itemFreight = isLast ? round2(freightTotal - allocatedFreight) : round2(proportional);
      allocatedFreight = round2(allocatedFreight + itemFreight);
      const itemTotal = round2(d.gross - d.itemDiscount + d.itemTaxes + itemFreight);
      const itemExternal = `ori_${orderSeq}_${String(idx + 1).padStart(2, "0")}_${runTag}`;
      items.push({
        _tmp_item_seq: itemSeq,
        _tmp_order_seq: orderSeq,
        _tmp_line: idx + 1,
        _tmp_listing_id: d.listing.id,
        _tmp_product_id: d.listing.produto_id,
        _tmp_product_var_id: d.listing.produto_variante_id,
        _tmp_order_external: orderExternal,
        tenant_id: tenantId,
        plataforma: channel.plataforma,
        canal_conta_id: channel.id,
        pedido_id: null,
        listing_id: d.listing.id,
        produto_id: d.listing.produto_id,
        produto_variante_id: d.listing.produto_variante_id,
        external_id: itemExternal,
        linha_numero: idx + 1,
        sku: d.listing.sku,
        titulo_item: d.listing.titulo,
        status: status === "cancelado" ? "cancelado" : "ativo",
        quantidade: d.qty,
        preco_unitario: d.unit,
        desconto_total: d.itemDiscount,
        impostos_total: d.itemTaxes,
        frete_rateado: itemFreight,
        valor_total: itemTotal,
        moeda: "BRL",
        metadata_jsonb: { seed_run: runTag },
        payload_raw: { source: "seed_mvp" },
        source_created_at: toPgTs(orderTs),
        source_updated_at: toPgTs(addHours(orderTs, randFloat(rng, 0.1, 48))),
        synced_at: new Date().toISOString(),
      });
      itemSeq += 1;
    }

    if (refundAmount > 0 && (deliveredAt || shippedAt)) {
      refundCandidates.push({
        orderExternal,
        orderSeq,
        refundAmount,
        tipo: status === "reembolsado_total" ? "total" : "parcial",
        occurredAt: deliveredAt || shippedAt,
      });
    }

    orderSeq += 1;
  }

  return { orders, items, refundCandidates };
}

function startOfPayoutPeriod(date, cycleDays) {
  const d = startOfUtcDay(date);
  const epoch = Date.UTC(2024, 0, 1);
  const diffDays = Math.floor((d.getTime() - epoch) / 86400000);
  const bucket = Math.floor(diffDays / cycleDays);
  return new Date(epoch + bucket * cycleDays * 86400000);
}

function buildPayoutsAndItems({
  rng,
  tenantId,
  runTag,
  channels,
  ordersDb,
  feesDb,
  refundsDb,
}) {
  const channelById = new Map(channels.map((c) => [c.id, c]));
  const groups = new Map();
  const items = [];

  function getGroup(channelId, refDate) {
    const ch = channelById.get(channelId);
    if (!ch) return null;
    const periodStart = startOfPayoutPeriod(new Date(refDate), ch._cfg.payoutCycleDays);
    const key = `${channelId}|${toPgDate(periodStart)}`;
    let g = groups.get(key);
    if (!g) {
      g = {
        key,
        tenant_id: tenantId,
        plataforma: ch.plataforma,
        canal_conta_id: ch.id,
        loja_id: ch.loja_id,
        periodStart,
        periodEnd: addDays(periodStart, ch._cfg.payoutCycleDays - 1),
        orderRows: [],
        feeRows: [],
        refundRows: [],
      };
      groups.set(key, g);
    }
    return g;
  }

  for (const o of ordersDb) {
    if (!["captured", "partially_refunded", "refunded"].includes(String(o.status_pagamento || ""))) continue;
    const ref = o.data_aprovacao || o.data_pedido;
    if (!ref) continue;
    const g = getGroup(o.canal_conta_id, ref);
    if (!g) continue;
    g.orderRows.push(o);
  }
  for (const f of feesDb) {
    const ref = f.competencia_em || f.source_created_at || new Date().toISOString();
    const g = getGroup(f.canal_conta_id, ref);
    if (!g) continue;
    g.feeRows.push(f);
  }
  for (const r of refundsDb) {
    const ref = r.processado_em || r.solicitado_em || new Date().toISOString();
    const g = getGroup(r.canal_conta_id, ref);
    if (!g) continue;
    g.refundRows.push(r);
  }

  const payouts = [];
  let payoutSeq = 1;
  for (const g of Array.from(groups.values()).sort((a, b) => a.periodStart - b.periodStart || a.canal_conta_id - b.canal_conta_id)) {
    const bruto = round2(g.orderRows.reduce((acc, r) => acc + Number(r.valor_total || 0), 0));
    const taxas = round2(g.feeRows.reduce((acc, r) => acc + Math.abs(Number(r.valor || 0)), 0));
    const reemb = round2(g.refundRows.reduce((acc, r) => acc + Math.abs(Number(r.valor || 0)), 0));
    const ajustes = chance(rng, 0.08) ? round2(randFloat(rng, -20, 30)) : 0;
    const liquido = round2(bruto - taxas - reemb + ajustes);
    if (bruto === 0 && taxas === 0 && reemb === 0 && ajustes === 0) continue;

    const external = `payout_${g.plataforma}_${runTag}_${String(payoutSeq).padStart(5, "0")}`;
    payouts.push({
      _tmp_key: g.key,
      _tmp_external: external,
      tenant_id: tenantId,
      plataforma: g.plataforma,
      canal_conta_id: g.canal_conta_id,
      loja_id: g.loja_id,
      external_id: external,
      status: chance(rng, 0.92) ? "paid" : "processing",
      moeda: "BRL",
      periodo_inicio: toPgTs(g.periodStart),
      periodo_fim: toPgTs(addHours(g.periodEnd, 23.99)),
      data_pagamento: toPgTs(addHours(addDays(g.periodEnd, randInt(rng, 1, 3)), 12)),
      valor_bruto: bruto,
      valor_taxas: taxas,
      valor_reembolsos: reemb,
      valor_ajustes: ajustes,
      valor_liquido: liquido,
      metadata_jsonb: { seed_run: runTag },
      payload_raw: { source: "seed_mvp" },
      source_created_at: toPgTs(g.periodEnd),
      source_updated_at: new Date().toISOString(),
      synced_at: new Date().toISOString(),
    });

    g._payoutExternal = external;
    payoutSeq += 1;
  }

  return { payouts, payoutGroups: groups, payoutItemDrafts: items };
}

async function main() {
  loadEnvFiles();

  const profiles = buildProfiles();
  const profileName = String(getArg("--profile") || "medium").trim().toLowerCase();
  const preset = profiles[profileName] || profiles.medium;
  const tenantId = Math.max(1, Number(getArg("--tenant") || 1));
  const seed = Number(getArg("--seed") || 20260301);
  const days = Math.max(30, Number(getArg("--days") || preset.days));
  const productsCount = Math.max(10, Number(getArg("--products") || preset.products));
  const customersCount = Math.max(50, Number(getArg("--customers") || preset.customers));
  const ordersCount = Math.max(100, Number(getArg("--orders") || preset.orders));
  const dryRun = hasFlag("--dry-run");
  const dbUrl = (getArg("--db-url") || process.env.SUPABASE_DB_URL || "").trim();

  if (!dbUrl && !dryRun) {
    throw new Error("SUPABASE_DB_URL ausente");
  }

  const rng = createRng(seed);
  const runTag = makeRunTag(seed);
  const endDate = startOfUtcDay(new Date());
  const startDate = addDays(endDate, -(days - 1));
  const nowIso = new Date().toISOString();

  const client = dryRun
    ? null
    : new Client({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 10000,
        query_timeout: 120000,
        statement_timeout: 120000,
      });

  const summary = {
    profile: profileName in profiles ? profileName : "medium",
    tenantId,
    seed,
    runTag,
    period: { start: toPgDate(startDate), end: toPgDate(endDate), days },
    requested: { products: productsCount, customers: customersCount, orders: ordersCount },
    generated: {},
    inserted: {},
  };

  if (dryRun) {
    console.log(JSON.stringify({ ok: true, dryRun, summary }, null, 2));
    return;
  }

  await client.connect();
  try {
    await client.query("BEGIN");

    const channelRows = [];
    let channelSeq = 1;
    for (const cfg of PLATFORMS) {
      channelRows.push({
        _cfg: cfg,
        tenant_id: tenantId,
        plataforma: cfg.plataforma,
        ambiente: "production",
        external_id: `acct_${cfg.plataforma}_${runTag}`,
        conta_slug: `${cfg.plataforma}-${runTag}`,
        nome_conta: cfg.nomeConta,
        status: "ativo",
        moeda_padrao: "BRL",
        pais: "BR",
        timezone: "America/Sao_Paulo",
        seller_id: `${cfg.plataforma.toUpperCase()}-${pad3(channelSeq)}-${runTag}`,
        loja_principal_external_id: `store_${cfg.plataforma}_${runTag}`,
        config_jsonb: { seed_run: runTag, marketplace: cfg.plataforma !== "shopify" },
        metadata_jsonb: { seed_run: runTag, order_weight: cfg.orderWeight },
        source_created_at: nowIso,
        source_updated_at: nowIso,
        synced_at: nowIso,
      });
      channelSeq += 1;
    }

    const canaisContasInserted = await insertMany(
      client,
      "ecommerce.canais_contas",
      [
        "tenant_id", "plataforma", "ambiente", "external_id", "conta_slug", "nome_conta", "status", "moeda_padrao", "pais",
        "timezone", "seller_id", "loja_principal_external_id", "config_jsonb", "metadata_jsonb", "source_created_at",
        "source_updated_at", "synced_at"
      ],
      channelRows,
      { returning: ["id", "plataforma", "external_id", "nome_conta"] },
    );
    const canaisByPlatform = new Map();
    for (const row of canaisContasInserted) {
      const cfg = PLATFORMS.find((p) => p.plataforma === row.plataforma);
      canaisByPlatform.set(row.plataforma, { ...row, _cfg: cfg });
    }
    const channels = Array.from(canaisByPlatform.values());

    const lojasRows = channels.map((ch) => ({
      tenant_id: tenantId,
      plataforma: ch.plataforma,
      canal_conta_id: ch.id,
      external_id: `store_${ch.plataforma}_${runTag}`,
      codigo: `LOJ-${ch.plataforma.toUpperCase()}-${runTag.slice(-6)}`,
      nome: ch._cfg.nomeLoja,
      status: "ativo",
      url: ch.plataforma === "shopify" ? `https://dtc-${runTag}.myshopify.com` : `https://${ch.plataforma}.example.com/${runTag}`,
      pais: "BR",
      moeda: "BRL",
      timezone: "America/Sao_Paulo",
      metadata_jsonb: { seed_run: runTag },
      payload_raw: { source: "seed_mvp" },
      source_created_at: nowIso,
      source_updated_at: nowIso,
      synced_at: nowIso,
    }));
    const lojasInserted = await insertMany(
      client,
      "ecommerce.lojas",
      [
        "tenant_id","plataforma","canal_conta_id","external_id","codigo","nome","status","url","pais","moeda","timezone",
        "metadata_jsonb","payload_raw","source_created_at","source_updated_at","synced_at"
      ],
      lojasRows,
      { returning: ["id", "canal_conta_id", "external_id", "nome"] },
    );
    const lojaByCanalId = new Map(lojasInserted.map((r) => [r.canal_conta_id, r]));
    for (const ch of channels) ch.loja_id = lojaByCanalId.get(ch.id)?.id || null;

    const credsRows = channels.map((ch) => ({
      tenant_id: tenantId,
      plataforma: ch.plataforma,
      canal_conta_id: ch.id,
      tipo: ch.plataforma === "shopify" ? "api_key" : "oauth",
      status: "ativo",
      segredo_ref: `vault://ecommerce/${runTag}/${ch.plataforma}`,
      credenciais_jsonb: { client_id: `${ch.plataforma}_${runTag}_client` },
      segredos_jsonb: { access_token: `tok_${ch.plataforma}_${runTag}` },
      escopos_jsonb: ch.plataforma === "shopify" ? ["orders", "products", "inventory"] : ["read_orders", "read_items"],
      expira_em: chance(rng, 0.4) ? toPgTs(addHours(new Date(), randInt(rng, 24, 24 * 90))) : null,
      rotacionado_em: nowIso,
      ultimo_erro: null,
      metadata_jsonb: { seed_run: runTag },
    }));
    await insertMany(
      client,
      "ecommerce.canais_credenciais",
      [
        "tenant_id","plataforma","canal_conta_id","tipo","status","segredo_ref","credenciais_jsonb","segredos_jsonb",
        "escopos_jsonb","expira_em","rotacionado_em","ultimo_erro","metadata_jsonb"
      ],
      credsRows,
    );

    const productsAndVariants = generateProductsAndVariants({
      rng,
      tenantId,
      runTag,
      productCount: productsCount,
      channelAccountsByPlatform: canaisByPlatform,
    });
    summary.generated.produtos = productsAndVariants.produtos.length;
    summary.generated.produto_variantes = productsAndVariants.variantes.length;

    const produtosInserted = await insertMany(
      client,
      "ecommerce.produtos",
      [
        "tenant_id","plataforma","canal_conta_id","loja_id","external_id","sku_principal","codigo_interno","nome","descricao","marca","categoria",
        "status","ativo","peso_kg","altura_cm","largura_cm","comprimento_cm","atributos_jsonb","metadata_jsonb","payload_raw",
        "source_created_at","source_updated_at","synced_at"
      ],
      productsAndVariants.produtos,
      { returning: ["id", "external_id", "nome", "categoria"] },
    );
    const produtoByExternal = new Map(produtosInserted.map((r) => [r.external_id, r]));
    const productsById = new Map(produtosInserted.map((r) => [r.id, r]));

    for (const v of productsAndVariants.variantes) {
      const productExternal = `prd_${runTag}_${v._tmp_product_seq}`;
      v.produto_id = produtoByExternal.get(productExternal)?.id || null;
      delete v._tmp_product_seq;
      delete v._tmp_variant_seq;
    }
    const variantesInserted = await insertMany(
      client,
      "ecommerce.produto_variantes",
      [
        "tenant_id","plataforma","canal_conta_id","produto_id","external_id","sku","gtin","ean","asin","mpn","nome","status","ativo",
        "preco_sugerido","custo_unitario","peso_kg","atributos_jsonb","metadata_jsonb","payload_raw","source_created_at","source_updated_at","synced_at"
      ],
      productsAndVariants.variantes,
      { returning: ["id", "produto_id", "external_id", "sku", "preco_sugerido", "custo_unitario", "atributos_jsonb"] },
    );

    const listingsPack = buildListings({
      rng,
      tenantId,
      runTag,
      variantsDb: variantesInserted,
      productsById,
      channels,
    });
    summary.generated.listings = listingsPack.listings.length;

    const listingsInserted = await insertMany(
      client,
      "ecommerce.listings",
      [
        "tenant_id","plataforma","canal_conta_id","loja_id","produto_id","produto_variante_id","external_id","parent_external_id","sku","titulo",
        "status","condicao","moeda","preco_anunciado","preco_promocional","estoque_disponivel","estoque_reservado","url","imagem_url",
        "categoria_canal_id","categoria_canal_nome","atributos_jsonb","metadata_jsonb","payload_raw","source_created_at","source_updated_at","synced_at"
      ],
      listingsPack.listings,
      { returning: ["id","canal_conta_id","plataforma","loja_id","produto_id","produto_variante_id","external_id","sku","titulo","status","preco_anunciado","preco_promocional","estoque_disponivel"] },
    );
    const listingByExternal = new Map(listingsInserted.map((r) => [r.external_id, r]));
    for (const lv of listingsPack.listingVariantes) {
      const ext = `lst_${lv.plataforma}_${runTag}_${lv._tmp_listing_seq}`;
      lv.listing_id = listingByExternal.get(ext)?.id || null;
      delete lv._tmp_listing_seq;
    }
    await insertMany(
      client,
      "ecommerce.listing_variantes",
      [
        "tenant_id","plataforma","canal_conta_id","listing_id","produto_variante_id","external_id","sku","status","moeda","preco","preco_promocional",
        "estoque_disponivel","atributos_jsonb","metadata_jsonb","payload_raw","source_created_at","source_updated_at","synced_at"
      ],
      listingsPack.listingVariantes,
    );

    const listingsByChannelId = new Map(channels.map((c) => [c.id, []]));
    for (const l of listingsInserted) listingsByChannelId.get(l.canal_conta_id)?.push(l);

    const customerPack = buildCustomers({
      rng,
      tenantId,
      runTag,
      targetCount: customersCount,
      channels,
    });
    summary.generated.clientes = customerPack.clientes.length;
    summary.generated.enderecos = customerPack.enderecos.length;

    const clientesInserted = await insertMany(
      client,
      "ecommerce.clientes",
      [
        "tenant_id","plataforma","canal_conta_id","loja_id","external_id","codigo","nome","email","telefone","documento","tipo_pessoa","status",
        "tags_jsonb","metadata_jsonb","payload_raw","source_created_at","source_updated_at","synced_at"
      ],
      customerPack.clientes,
      { returning: ["id","canal_conta_id","external_id","nome"] },
    );
    const clienteByExternal = new Map(clientesInserted.map((r) => [r.external_id, r]));
    const customersByChannelId = new Map(channels.map((c) => [c.id, []]));
    for (const c of clientesInserted) customersByChannelId.get(c.canal_conta_id)?.push(c);

    for (const a of customerPack.enderecos) {
      a.cliente_id = clienteByExternal.get(`cli_${a.plataforma}_${runTag}_${a._tmp_cliente_seq}`)?.id || null;
      delete a._tmp_cliente_seq;
      delete a._tmp_tipo;
      delete a._tmp_addr_seq;
    }
    const enderecosInserted = await insertMany(
      client,
      "ecommerce.enderecos",
      [
        "tenant_id","plataforma","canal_conta_id","cliente_id","external_id","tipo","nome_destinatario","documento_destinatario","telefone","email","pais",
        "estado","cidade","bairro","logradouro","numero","complemento","cep","referencia","latitude","longitude","metadata_jsonb","payload_raw",
        "source_created_at","source_updated_at","synced_at"
      ],
      customerPack.enderecos,
      { returning: ["id","cliente_id","tipo","external_id"] },
    );
    const addressesByCustomerId = new Map();
    for (const a of enderecosInserted) {
      if (!addressesByCustomerId.has(a.cliente_id)) addressesByCustomerId.set(a.cliente_id, []);
      addressesByCustomerId.get(a.cliente_id).push(a);
    }

    const ordersPlan = buildOrdersPlan({
      rng,
      tenantId,
      runTag,
      orderCount: ordersCount,
      startDate,
      endDate,
      channels,
      customersByChannelId,
      addressesByCustomerId,
      listingsByChannelId,
    });
    summary.generated.pedidos = ordersPlan.orders.length;
    summary.generated.pedido_itens = ordersPlan.items.length;

    const pedidosInserted = await insertMany(
      client,
      "ecommerce.pedidos",
      [
        "tenant_id","plataforma","canal_conta_id","loja_id","cliente_id","endereco_entrega_id","endereco_cobranca_id","external_id","parent_external_id",
        "numero_pedido","numero_pedido_canal","status","status_pagamento","status_fulfillment","moeda","subtotal","desconto_total","frete_total",
        "impostos_total","taxa_total","valor_total","valor_pago","valor_reembolsado","valor_liquido_estimado","data_pedido","data_aprovacao",
        "data_cancelamento","observacoes","tags_jsonb","metadata_jsonb","payload_raw","source_created_at","source_updated_at","synced_at"
      ],
      ordersPlan.orders,
      { returning: ["id","plataforma","external_id","canal_conta_id","loja_id","cliente_id","status","status_pagamento","status_fulfillment","valor_total","valor_pago","valor_reembolsado","data_pedido","data_aprovacao"] },
    );
    const pedidoByExternal = new Map(pedidosInserted.map((r) => [r.external_id, r]));

    for (const it of ordersPlan.items) {
      it.pedido_id = pedidoByExternal.get(it._tmp_order_external)?.id || null;
      delete it._tmp_item_seq;
      delete it._tmp_order_seq;
      delete it._tmp_line;
      delete it._tmp_listing_id;
      delete it._tmp_product_id;
      delete it._tmp_product_var_id;
      delete it._tmp_order_external;
    }
    const pedidoItensInserted = await insertMany(
      client,
      "ecommerce.pedido_itens",
      [
        "tenant_id","plataforma","canal_conta_id","pedido_id","listing_id","produto_id","produto_variante_id","external_id","linha_numero","sku",
        "titulo_item","status","quantidade","preco_unitario","desconto_total","impostos_total","frete_rateado","valor_total","moeda","metadata_jsonb",
        "payload_raw","source_created_at","source_updated_at","synced_at"
      ],
      ordersPlan.items,
      { returning: ["id","pedido_id","external_id","linha_numero","listing_id","produto_variante_id","quantidade","valor_total"] },
    );
    const pedidoItensByPedidoId = new Map();
    for (const it of pedidoItensInserted) {
      if (!pedidoItensByPedidoId.has(it.pedido_id)) pedidoItensByPedidoId.set(it.pedido_id, []);
      pedidoItensByPedidoId.get(it.pedido_id).push(it);
    }

    // Pagamentos
    const pagamentosRows = [];
    for (const p of pedidosInserted) {
      const paymentStatus = String(p.status_pagamento || "");
      if (paymentStatus === "cancelled" && chance(rng, 0.8)) continue;
      const paidValue = round2(Number(p.valor_pago || 0));
      const total = round2(Number(p.valor_total || 0));
      const gatewayRate = p.plataforma === "shopify" ? 0.029 : 0.012;
      const valorTaxa = round2(total * gatewayRate);
      const valorLiquido = round2(total - valorTaxa);
      pagamentosRows.push({
        _tmp_order_external: p.external_id,
        tenant_id: tenantId,
        plataforma: p.plataforma,
        canal_conta_id: p.canal_conta_id,
        pedido_id: p.id,
        external_id: `pay_${p.external_id}`,
        status: paymentStatus || "pending",
        metodo: p.plataforma === "shopify"
          ? weightedPick(rng, [{ value: "credit_card", weight: 70 }, { value: "pix", weight: 22 }, { value: "boleto", weight: 8 }])
          : weightedPick(rng, [{ value: "marketplace_wallet", weight: 65 }, { value: "credit_card", weight: 25 }, { value: "pix", weight: 10 }]),
        provedor: p.plataforma === "shopify" ? "shopify_payments" : `${p.plataforma}_payments`,
        parcelado_em: chance(rng, 0.42) ? randInt(rng, 2, 12) : 1,
        moeda: "BRL",
        valor_autorizado: round2(total),
        valor_capturado: ["captured","partially_refunded","refunded"].includes(paymentStatus) ? round2(total) : (paymentStatus === "authorized" ? round2(total) : round2(paidValue)),
        valor_taxa: valorTaxa,
        valor_liquido: valorLiquido,
        data_autorizacao: p.data_aprovacao || p.data_pedido,
        data_captura: ["captured","partially_refunded","refunded"].includes(paymentStatus) ? p.data_aprovacao || p.data_pedido : null,
        data_vencimento: paymentStatus === "pending" ? toPgTs(addHours(new Date(p.data_pedido), 48)) : null,
        metadata_jsonb: { seed_run: runTag },
        payload_raw: { source: "seed_mvp" },
        source_created_at: p.data_pedido,
        source_updated_at: p.data_aprovacao || p.data_pedido,
        synced_at: nowIso,
      });
    }
    const pagamentosInserted = await insertMany(
      client,
      "ecommerce.pagamentos",
      [
        "tenant_id","plataforma","canal_conta_id","pedido_id","external_id","status","metodo","provedor","parcelado_em","moeda","valor_autorizado",
        "valor_capturado","valor_taxa","valor_liquido","data_autorizacao","data_captura","data_vencimento","metadata_jsonb","payload_raw",
        "source_created_at","source_updated_at","synced_at"
      ],
      pagamentosRows,
      { returning: ["id","pedido_id","external_id","status","valor_autorizado","valor_capturado","data_autorizacao","data_captura"] },
    );
    const pagamentoByPedidoId = new Map(pagamentosInserted.map((r) => [r.pedido_id, r]));

    // Envios
    const enviosRows = [];
    for (const p of pedidosInserted) {
      const st = String(p.status_fulfillment || "");
      if (!["processing","shipped","delivered","returned"].includes(st)) continue;
      const created = new Date(p.data_aprovacao || p.data_pedido || new Date().toISOString());
      const desp = st === "processing" ? null : addHours(created, randFloat(rng, 8, 72));
      const ent = ["delivered","returned"].includes(st) ? addHours(desp || created, randFloat(rng, 18, 180)) : null;
      enviosRows.push({
        tenant_id: tenantId,
        plataforma: p.plataforma,
        canal_conta_id: p.canal_conta_id,
        pedido_id: p.id,
        loja_id: p.loja_id,
        endereco_entrega_id: null, // derivado no pedido; mantido simples no seed
        external_id: `shp_${p.external_id}`,
        status: st,
        transportadora: weightedPick(rng, [
          { value: "Correios", weight: 48 },
          { value: "Jadlog", weight: 16 },
          { value: "Loggi", weight: 12 },
          { value: "Total Express", weight: 14 },
          { value: "Fulfillment Canal", weight: 10 },
        ]),
        servico: chance(rng, 0.6) ? "economico" : "expresso",
        tracking_code: `TRK${randInt(rng, 100000000, 999999999)}BR`,
        tracking_url: `https://tracking.example.com/${p.external_id}`,
        etiqueta_url: chance(rng, 0.9) ? `https://labels.example.com/${p.external_id}.pdf` : null,
        moeda: "BRL",
        frete_cobrado: round2(randFloat(rng, 8, 29)),
        frete_custo: round2(randFloat(rng, 6, 24)),
        prazo_dias: randInt(rng, 2, 9),
        despachado_em: toPgTs(desp),
        entregue_em: toPgTs(ent),
        cancelado_em: null,
        metadata_jsonb: { seed_run: runTag },
        payload_raw: { source: "seed_mvp" },
        source_created_at: p.data_pedido,
        source_updated_at: toPgTs(ent || desp || created),
        synced_at: nowIso,
      });
    }
    const enviosInserted = await insertMany(
      client,
      "ecommerce.envios",
      [
        "tenant_id","plataforma","canal_conta_id","pedido_id","loja_id","endereco_entrega_id","external_id","status","transportadora","servico",
        "tracking_code","tracking_url","etiqueta_url","moeda","frete_cobrado","frete_custo","prazo_dias","despachado_em","entregue_em","cancelado_em",
        "metadata_jsonb","payload_raw","source_created_at","source_updated_at","synced_at"
      ],
      enviosRows,
      { returning: ["id","pedido_id","external_id","status","despachado_em","entregue_em"] },
    );
    const envioByPedidoId = new Map(enviosInserted.map((r) => [r.pedido_id, r]));

    // Eventos fulfillment
    const eventosRows = [];
    let eventoSeq = 1;
    for (const e of enviosInserted) {
      const pedido = pedidosInserted.find((p) => p.id === e.pedido_id);
      if (!pedido) continue;
      const createdAt = new Date(pedido.data_pedido || new Date().toISOString());
      const statuses = ["label_created"];
      if (e.despachado_em) statuses.push("posted", "in_transit");
      if (e.status === "delivered") statuses.push("delivered");
      if (e.status === "returned") statuses.push("delivery_failed", "returned");
      let cursor = createdAt;
      for (const st of statuses) {
        cursor = addHours(cursor, randFloat(rng, 2, 48));
        eventosRows.push({
          tenant_id: tenantId,
          plataforma: pedido.plataforma,
          canal_conta_id: pedido.canal_conta_id,
          envio_id: e.id,
          pedido_id: pedido.id,
          external_id: `evt_${runTag}_${eventoSeq}`,
          status: st,
          substatus: null,
          descricao: st.replace(/_/g, " "),
          local_evento: chance(rng, 0.6) ? pick(rng, CITIES).cidade : null,
          ocorrido_em: toPgTs(cursor),
          metadata_jsonb: { seed_run: runTag },
          payload_raw: { source: "seed_mvp" },
        });
        eventoSeq += 1;
      }
    }
    await insertMany(
      client,
      "ecommerce.eventos_fulfillment",
      [
        "tenant_id","plataforma","canal_conta_id","envio_id","pedido_id","external_id","status","substatus","descricao","local_evento",
        "ocorrido_em","metadata_jsonb","payload_raw"
      ],
      eventosRows,
    );

    // Devolucoes / Reembolsos
    const devolucoesRows = [];
    const reembolsosRows = [];
    for (const plan of ordersPlan.refundCandidates) {
      const pedido = pedidoByExternal.get(plan.orderExternal);
      if (!pedido) continue;
      const itens = pedidoItensByPedidoId.get(pedido.id) || [];
      const pagamento = pagamentoByPedidoId.get(pedido.id) || null;
      const envio = envioByPedidoId.get(pedido.id) || null;
      if (!itens.length) continue;
      const item = pick(rng, itens);
      const qtyTotal = Number(item.quantidade || 1);
      const qtyRefund = plan.tipo === "total" ? qtyTotal : Math.max(1, Math.min(qtyTotal, randInt(rng, 1, Math.ceil(qtyTotal))));
      const devolucaoExternal = `ret_${pedido.external_id}`;
      const refundAt = addHours(new Date(plan.occurredAt || pedido.data_pedido), randFloat(rng, 12, 120));
      devolucoesRows.push({
        _tmp_pedido_id: pedido.id,
        _tmp_external: devolucaoExternal,
        tenant_id: tenantId,
        plataforma: pedido.plataforma,
        canal_conta_id: pedido.canal_conta_id,
        pedido_id: pedido.id,
        pedido_item_id: item.id,
        envio_id: envio?.id || null,
        external_id: devolucaoExternal,
        status: "approved",
        motivo: pick(rng, ["arrependimento", "avaria", "item_errado", "nao_serviu", "defeito"]),
        quantidade: qtyRefund,
        valor_solicitado: round2(plan.refundAmount),
        valor_aprovado: round2(plan.refundAmount),
        moeda: "BRL",
        solicitado_em: toPgTs(addHours(refundAt, -randFloat(rng, 2, 12))),
        aprovado_em: toPgTs(addHours(refundAt, -randFloat(rng, 0.5, 2))),
        concluido_em: toPgTs(refundAt),
        metadata_jsonb: { seed_run: runTag },
        payload_raw: { source: "seed_mvp" },
        source_created_at: toPgTs(refundAt),
        source_updated_at: toPgTs(refundAt),
        synced_at: nowIso,
      });
      reembolsosRows.push({
        _tmp_pedido_id: pedido.id,
        _tmp_devolucao_external: devolucaoExternal,
        tenant_id: tenantId,
        plataforma: pedido.plataforma,
        canal_conta_id: pedido.canal_conta_id,
        pedido_id: pedido.id,
        pagamento_id: pagamento?.id || null,
        devolucao_id: null,
        external_id: `ref_${pedido.external_id}`,
        status: "processed",
        motivo: "devolucao",
        moeda: "BRL",
        valor: round2(plan.refundAmount),
        taxa: round2(chance(rng, 0.25) ? randFloat(rng, 0, 5) : 0),
        solicitado_em: toPgTs(addHours(refundAt, -randFloat(rng, 2, 24))),
        processado_em: toPgTs(refundAt),
        metadata_jsonb: { seed_run: runTag },
        payload_raw: { source: "seed_mvp" },
        source_created_at: toPgTs(refundAt),
        source_updated_at: toPgTs(refundAt),
        synced_at: nowIso,
      });
    }
    const devolucoesInserted = await insertMany(
      client,
      "ecommerce.devolucoes",
      [
        "tenant_id","plataforma","canal_conta_id","pedido_id","pedido_item_id","envio_id","external_id","status","motivo","quantidade",
        "valor_solicitado","valor_aprovado","moeda","solicitado_em","aprovado_em","concluido_em","metadata_jsonb","payload_raw",
        "source_created_at","source_updated_at","synced_at"
      ],
      devolucoesRows,
      { returning: ["id","pedido_id","external_id","valor_aprovado","concluido_em"] },
    );
    const devolucaoByExternal = new Map(devolucoesInserted.map((r) => [r.external_id, r]));
    for (const r of reembolsosRows) {
      r.devolucao_id = devolucaoByExternal.get(r._tmp_devolucao_external)?.id || null;
      delete r._tmp_devolucao_external;
      delete r._tmp_pedido_id;
    }
    const reembolsosInserted = await insertMany(
      client,
      "ecommerce.reembolsos",
      [
        "tenant_id","plataforma","canal_conta_id","pedido_id","pagamento_id","devolucao_id","external_id","status","motivo","moeda","valor","taxa",
        "solicitado_em","processado_em","metadata_jsonb","payload_raw","source_created_at","source_updated_at","synced_at"
      ],
      reembolsosRows,
      { returning: ["id","pedido_id","external_id","valor","processado_em","canal_conta_id","plataforma"] },
    );

    // Taxas por pedido
    const taxasRows = [];
    for (const pedido of pedidosInserted) {
      if (!["captured","partially_refunded","refunded"].includes(String(pedido.status_pagamento || ""))) continue;
      const ch = channels.find((c) => c.id === pedido.canal_conta_id);
      if (!ch) continue;
      const subtotalBase = Math.max(0, Number(pedido.valor_total || 0) - Number(pedido.frete_total || 0) - Number(pedido.impostos_total || 0));
      const commission = round2(subtotalBase * (ch._cfg.feeRate || 0));
      const gateway = round2(Number(pedido.valor_total || 0) * (ch._cfg.gatewayFeeRate || 0));
      const subsidy = round2(Number(pedido.frete_total || 0) * (ch._cfg.shippingSubsidyRate || 0));
      const dataRef = pedido.data_aprovacao || pedido.data_pedido;
      const rows = [
        { tipo: "comissao_marketplace", valor: commission },
        { tipo: "taxa_gateway", valor: gateway },
        { tipo: "frete_subsidiado", valor: subsidy },
      ].filter((x) => x.valor > 0.0001);
      if (chance(rng, 0.2)) rows.push({ tipo: "ajuste_operacional", valor: round2(randFloat(rng, -4, 8)) });
      for (let i = 0; i < rows.length; i += 1) {
        const t = rows[i];
        taxasRows.push({
          tenant_id: tenantId,
          plataforma: pedido.plataforma,
          canal_conta_id: pedido.canal_conta_id,
          pedido_id: pedido.id,
          pedido_item_id: null,
          external_id: `fee_${pedido.external_id}_${i + 1}`,
          tipo_taxa: t.tipo,
          descricao: t.tipo.replace(/_/g, " "),
          moeda: "BRL",
          base_calculo: subtotalBase,
          aliquota: t.tipo === "comissao_marketplace" ? ch._cfg.feeRate : t.tipo === "taxa_gateway" ? ch._cfg.gatewayFeeRate : null,
          valor: round2(t.valor),
          competencia_em: dataRef,
          metadata_jsonb: { seed_run: runTag },
          payload_raw: { source: "seed_mvp" },
          source_created_at: dataRef,
          source_updated_at: dataRef,
          synced_at: nowIso,
        });
      }
    }
    const taxasInserted = await insertMany(
      client,
      "ecommerce.taxas_pedido",
      [
        "tenant_id","plataforma","canal_conta_id","pedido_id","pedido_item_id","external_id","tipo_taxa","descricao","moeda","base_calculo","aliquota",
        "valor","competencia_em","metadata_jsonb","payload_raw","source_created_at","source_updated_at","synced_at"
      ],
      taxasRows,
      { returning: ["id","pedido_id","external_id","tipo_taxa","valor","competencia_em","canal_conta_id","plataforma"] },
    );

    // Transações de pagamento (agora com reembolsos disponíveis)
    const refundsByPedidoId = new Map();
    for (const r of reembolsosInserted) {
      if (!refundsByPedidoId.has(r.pedido_id)) refundsByPedidoId.set(r.pedido_id, []);
      refundsByPedidoId.get(r.pedido_id).push(r);
    }
    const transacoesRows = [];
    let trxSeq = 1;
    for (const pag of pagamentosInserted) {
      const pedido = pedidosInserted.find((p) => p.id === pag.pedido_id);
      if (!pedido) continue;
      const authAt = pag.data_autorizacao || pedido.data_pedido;
      transacoesRows.push({
        tenant_id: tenantId,
        plataforma: pedido.plataforma,
        canal_conta_id: pedido.canal_conta_id,
        pagamento_id: pag.id,
        pedido_id: pedido.id,
        external_id: `trx_${runTag}_${trxSeq++}`,
        tipo: "auth",
        status: ["cancelled","failed"].includes(String(pag.status || "")) ? "failed" : "approved",
        moeda: "BRL",
        valor: round2(Number(pag.valor_autorizado || 0)),
        taxa: 0,
        referencia_externa: pag.external_id,
        ocorrido_em: authAt,
        metadata_jsonb: { seed_run: runTag },
        payload_raw: { source: "seed_mvp" },
        source_created_at: authAt,
        source_updated_at: authAt,
        synced_at: nowIso,
      });
      if (["captured","partially_refunded","refunded"].includes(String(pag.status || ""))) {
        const capAt = pag.data_captura || authAt;
        transacoesRows.push({
          tenant_id: tenantId,
          plataforma: pedido.plataforma,
          canal_conta_id: pedido.canal_conta_id,
          pagamento_id: pag.id,
          pedido_id: pedido.id,
          external_id: `trx_${runTag}_${trxSeq++}`,
          tipo: "capture",
          status: "approved",
          moeda: "BRL",
          valor: round2(Number(pag.valor_capturado || 0)),
          taxa: 0,
          referencia_externa: pag.external_id,
          ocorrido_em: capAt,
          metadata_jsonb: { seed_run: runTag },
          payload_raw: { source: "seed_mvp" },
          source_created_at: capAt,
          source_updated_at: capAt,
          synced_at: nowIso,
        });
      }
      for (const refund of refundsByPedidoId.get(pedido.id) || []) {
        transacoesRows.push({
          tenant_id: tenantId,
          plataforma: pedido.plataforma,
          canal_conta_id: pedido.canal_conta_id,
          pagamento_id: pag.id,
          pedido_id: pedido.id,
          external_id: `trx_${runTag}_${trxSeq++}`,
          tipo: "refund",
          status: "approved",
          moeda: "BRL",
          valor: round2(Number(refund.valor || 0)),
          taxa: round2(Number(refund.taxa || 0)),
          referencia_externa: refund.external_id,
          ocorrido_em: refund.processado_em || refund.solicitado_em || pedido.data_pedido,
          metadata_jsonb: { seed_run: runTag },
          payload_raw: { source: "seed_mvp" },
          source_created_at: refund.processado_em || refund.solicitado_em || pedido.data_pedido,
          source_updated_at: refund.processado_em || refund.solicitado_em || pedido.data_pedido,
          synced_at: nowIso,
        });
      }
    }
    const transacoesInserted = await insertMany(
      client,
      "ecommerce.transacoes_pagamento",
      [
        "tenant_id","plataforma","canal_conta_id","pagamento_id","pedido_id","external_id","tipo","status","moeda","valor","taxa","referencia_externa",
        "ocorrido_em","metadata_jsonb","payload_raw","source_created_at","source_updated_at","synced_at"
      ],
      transacoesRows,
      { returning: ["id"] },
    );

    // Payouts + payout_itens
    const payoutPack = buildPayoutsAndItems({
      rng, tenantId, runTag, channels, ordersDb: pedidosInserted, feesDb: taxasInserted, refundsDb: reembolsosInserted,
    });
    const payoutsInserted = await insertMany(
      client,
      "ecommerce.payouts",
      [
        "tenant_id","plataforma","canal_conta_id","loja_id","external_id","status","moeda","periodo_inicio","periodo_fim","data_pagamento",
        "valor_bruto","valor_taxas","valor_reembolsos","valor_ajustes","valor_liquido","metadata_jsonb","payload_raw",
        "source_created_at","source_updated_at","synced_at"
      ],
      payoutPack.payouts,
      { returning: ["id","external_id","canal_conta_id","plataforma","periodo_inicio"] },
    );
    const payoutByExternal = new Map(payoutsInserted.map((p) => [p.external_id, p]));
    const payoutExternalByGroupKey = new Map((payoutPack.payouts || []).map((p) => [p._tmp_key, p.external_id]));

    const payoutItemsRows = [];
    let payoutItemSeq = 1;
    const feesByPedidoId = new Map();
    for (const fee of taxasInserted) {
      if (!feesByPedidoId.has(fee.pedido_id)) feesByPedidoId.set(fee.pedido_id, []);
      feesByPedidoId.get(fee.pedido_id).push(fee);
    }
    for (const p of pedidosInserted) {
      if (!["captured","partially_refunded","refunded"].includes(String(p.status_pagamento || ""))) continue;
      const ch = channels.find((c) => c.id === p.canal_conta_id);
      if (!ch) continue;
      const refDate = new Date(p.data_aprovacao || p.data_pedido || new Date().toISOString());
      const periodStart = startOfPayoutPeriod(refDate, ch._cfg.payoutCycleDays);
      const groupKey = `${ch.id}|${toPgDate(periodStart)}`;
      const payoutExternal = payoutExternalByGroupKey.get(groupKey);
      const payout = payoutByExternal.get(payoutExternal);
      if (!payout) continue;
      payoutItemsRows.push({
        tenant_id: tenantId,
        plataforma: p.plataforma,
        canal_conta_id: p.canal_conta_id,
        payout_id: payout.id,
        pedido_id: p.id,
        pedido_item_id: null,
        taxa_pedido_id: null,
        reembolso_id: null,
        external_id: `poi_${runTag}_${payoutItemSeq++}`,
        tipo_item: "pedido",
        descricao: "credito pedido",
        moeda: "BRL",
        valor_bruto: round2(Number(p.valor_total || 0)),
        valor_taxa: 0,
        valor_liquido: round2(Number(p.valor_total || 0)),
        data_referencia: p.data_aprovacao || p.data_pedido,
        metadata_jsonb: { seed_run: runTag },
        payload_raw: { source: "seed_mvp" },
        source_created_at: p.data_pedido,
        source_updated_at: p.data_aprovacao || p.data_pedido,
        synced_at: nowIso,
      });
      for (const fee of feesByPedidoId.get(p.id) || []) {
        payoutItemsRows.push({
          tenant_id: tenantId,
          plataforma: fee.plataforma,
          canal_conta_id: fee.canal_conta_id,
          payout_id: payout.id,
          pedido_id: fee.pedido_id,
          pedido_item_id: null,
          taxa_pedido_id: fee.id,
          reembolso_id: null,
          external_id: `poi_${runTag}_${payoutItemSeq++}`,
          tipo_item: "taxa",
          descricao: fee.tipo_taxa,
          moeda: "BRL",
          valor_bruto: 0,
          valor_taxa: Math.abs(Number(fee.valor || 0)),
          valor_liquido: round2(-Math.abs(Number(fee.valor || 0))),
          data_referencia: fee.competencia_em,
          metadata_jsonb: { seed_run: runTag },
          payload_raw: { source: "seed_mvp" },
          source_created_at: fee.competencia_em,
          source_updated_at: fee.competencia_em,
          synced_at: nowIso,
        });
      }
      for (const refund of refundsByPedidoId.get(p.id) || []) {
        payoutItemsRows.push({
          tenant_id: tenantId,
          plataforma: refund.plataforma,
          canal_conta_id: refund.canal_conta_id,
          payout_id: payout.id,
          pedido_id: refund.pedido_id,
          pedido_item_id: null,
          taxa_pedido_id: null,
          reembolso_id: refund.id,
          external_id: `poi_${runTag}_${payoutItemSeq++}`,
          tipo_item: "reembolso",
          descricao: "reembolso",
          moeda: "BRL",
          valor_bruto: 0,
          valor_taxa: 0,
          valor_liquido: round2(-Math.abs(Number(refund.valor || 0))),
          data_referencia: refund.processado_em || refund.solicitado_em,
          metadata_jsonb: { seed_run: runTag },
          payload_raw: { source: "seed_mvp" },
          source_created_at: refund.processado_em || refund.solicitado_em,
          source_updated_at: refund.processado_em || refund.solicitado_em,
          synced_at: nowIso,
        });
      }
    }
    const payoutItensInserted = await insertMany(
      client,
      "ecommerce.payout_itens",
      [
        "tenant_id","plataforma","canal_conta_id","payout_id","pedido_id","pedido_item_id","taxa_pedido_id","reembolso_id","external_id","tipo_item",
        "descricao","moeda","valor_bruto","valor_taxa","valor_liquido","data_referencia","metadata_jsonb","payload_raw","source_created_at","source_updated_at","synced_at"
      ],
      payoutItemsRows,
      { returning: ["id"] },
    );

    // Estoque movimentações / saldos
    const listingById = new Map(listingsInserted.map((l) => [l.id, l]));
    const estoqueState = new Map();
    for (const l of listingsInserted) {
      estoqueState.set(l.id, {
        qty: Number(l.estoque_disponivel || 0),
        reserved: Number(l.estoque_reservado || 0),
      });
    }
    const estoqueMovRows = [];
    let estSeq = 1;
    const periodStartTs = toPgTs(addHours(startDate, 9));
    for (const l of listingsInserted) {
      const state = estoqueState.get(l.id);
      estoqueMovRows.push({
        tenant_id: tenantId,
        plataforma: l.plataforma,
        canal_conta_id: l.canal_conta_id,
        loja_id: l.loja_id,
        produto_id: l.produto_id,
        produto_variante_id: l.produto_variante_id,
        listing_id: l.id,
        pedido_id: null,
        external_id: `stk_${runTag}_${estSeq++}`,
        tipo_movimento: "entrada",
        origem: "saldo_inicial",
        quantidade: round2(state.qty + state.reserved),
        saldo_apos: round2(state.qty + state.reserved),
        armazem_external_id: `WH-${l.plataforma}-01`,
        armazem_nome: `Armazem ${platformLabel(l.plataforma)}`,
        ocorrido_em: periodStartTs,
        metadata_jsonb: { seed_run: runTag },
        payload_raw: { source: "seed_mvp" },
        source_created_at: periodStartTs,
        source_updated_at: periodStartTs,
        synced_at: nowIso,
      });
    }
    for (const item of pedidoItensInserted) {
      const pedido = pedidosInserted.find((p) => p.id === item.pedido_id);
      if (!pedido || String(pedido.status) === "cancelado") continue;
      const listing = listingById.get(item.listing_id);
      if (!listing) continue;
      const state = estoqueState.get(listing.id);
      const qty = Math.abs(Number(item.quantidade || 0));
      state.qty = round2(state.qty - qty);
      if (state.qty < 0 && chance(rng, 0.6)) {
        const restock = round2(qty + randInt(rng, 5, 30));
        state.qty = round2(state.qty + restock);
        estoqueMovRows.push({
          tenant_id: tenantId,
          plataforma: listing.plataforma,
          canal_conta_id: listing.canal_conta_id,
          loja_id: listing.loja_id,
          produto_id: listing.produto_id,
          produto_variante_id: listing.produto_variante_id,
          listing_id: listing.id,
          pedido_id: null,
          external_id: `stk_${runTag}_${estSeq++}`,
          tipo_movimento: "entrada",
          origem: "reposicao",
          quantidade: restock,
          saldo_apos: state.qty,
          armazem_external_id: `WH-${listing.plataforma}-01`,
          armazem_nome: `Armazem ${platformLabel(listing.plataforma)}`,
          ocorrido_em: pedido.data_pedido,
          metadata_jsonb: { seed_run: runTag },
          payload_raw: { source: "seed_mvp" },
          source_created_at: pedido.data_pedido,
          source_updated_at: pedido.data_pedido,
          synced_at: nowIso,
        });
      }
      estoqueMovRows.push({
        tenant_id: tenantId,
        plataforma: listing.plataforma,
        canal_conta_id: listing.canal_conta_id,
        loja_id: listing.loja_id,
        produto_id: listing.produto_id,
        produto_variante_id: listing.produto_variante_id,
        listing_id: listing.id,
        pedido_id: pedido.id,
        external_id: `stk_${runTag}_${estSeq++}`,
        tipo_movimento: "saida",
        origem: "pedido",
        quantidade: round2(-qty),
        saldo_apos: round2(state.qty),
        armazem_external_id: `WH-${listing.plataforma}-01`,
        armazem_nome: `Armazem ${platformLabel(listing.plataforma)}`,
        ocorrido_em: pedido.data_pedido,
        metadata_jsonb: { seed_run: runTag },
        payload_raw: { source: "seed_mvp" },
        source_created_at: pedido.data_pedido,
        source_updated_at: pedido.data_pedido,
        synced_at: nowIso,
      });
    }
    for (const refund of reembolsosInserted) {
      if (!chance(rng, 0.65)) continue;
      const pedidoItems = pedidoItensByPedidoId.get(refund.pedido_id) || [];
      const anyItem = pedidoItems[0];
      if (!anyItem) continue;
      const listing = listingById.get(anyItem.listing_id);
      if (!listing) continue;
      const state = estoqueState.get(listing.id);
      const qty = round2(Math.max(1, Number(anyItem.quantidade || 1)));
      state.qty = round2(state.qty + qty);
      estoqueMovRows.push({
        tenant_id: tenantId,
        plataforma: listing.plataforma,
        canal_conta_id: listing.canal_conta_id,
        loja_id: listing.loja_id,
        produto_id: listing.produto_id,
        produto_variante_id: listing.produto_variante_id,
        listing_id: listing.id,
        pedido_id: refund.pedido_id,
        external_id: `stk_${runTag}_${estSeq++}`,
        tipo_movimento: "entrada",
        origem: "devolucao",
        quantidade: qty,
        saldo_apos: state.qty,
        armazem_external_id: `WH-${listing.plataforma}-01`,
        armazem_nome: `Armazem ${platformLabel(listing.plataforma)}`,
        ocorrido_em: refund.processado_em || refund.solicitado_em,
        metadata_jsonb: { seed_run: runTag },
        payload_raw: { source: "seed_mvp" },
        source_created_at: refund.processado_em || refund.solicitado_em,
        source_updated_at: refund.processado_em || refund.solicitado_em,
        synced_at: nowIso,
      });
    }
    const estoqueMovInserted = await insertMany(
      client,
      "ecommerce.estoque_movimentacoes",
      [
        "tenant_id","plataforma","canal_conta_id","loja_id","produto_id","produto_variante_id","listing_id","pedido_id","external_id","tipo_movimento",
        "origem","quantidade","saldo_apos","armazem_external_id","armazem_nome","ocorrido_em","metadata_jsonb","payload_raw","source_created_at",
        "source_updated_at","synced_at"
      ],
      estoqueMovRows,
      { returning: ["id"] },
    );

    const estoqueSaldosRows = [];
    for (const l of listingsInserted) {
      const state = estoqueState.get(l.id) || { qty: 0, reserved: 0 };
      const reserved = clamp(round2(state.reserved), 0, 20);
      const totalQty = round2(Math.max(0, state.qty) + reserved);
      estoqueSaldosRows.push({
        tenant_id: tenantId,
        plataforma: l.plataforma,
        canal_conta_id: l.canal_conta_id,
        loja_id: l.loja_id,
        produto_id: l.produto_id,
        produto_variante_id: l.produto_variante_id,
        listing_id: l.id,
        external_id: `stksnap_${l.external_id}`,
        armazem_external_id: `WH-${l.plataforma}-01`,
        armazem_nome: `Armazem ${platformLabel(l.plataforma)}`,
        status: "ok",
        quantidade_total: totalQty,
        quantidade_disponivel: round2(Math.max(0, state.qty)),
        quantidade_reservada: reserved,
        quantidade_em_transito: round2(chance(rng, 0.12) ? randFloat(rng, 0, 15) : 0),
        snapshot_date: toPgDate(endDate),
        capturado_em: nowIso,
        metadata_jsonb: { seed_run: runTag },
        payload_raw: { source: "seed_mvp" },
        source_created_at: nowIso,
        source_updated_at: nowIso,
        synced_at: nowIso,
      });
    }
    const estoqueSaldosInserted = await insertMany(
      client,
      "ecommerce.estoque_saldos",
      [
        "tenant_id","plataforma","canal_conta_id","loja_id","produto_id","produto_variante_id","listing_id","external_id","armazem_external_id",
        "armazem_nome","status","quantidade_total","quantidade_disponivel","quantidade_reservada","quantidade_em_transito","snapshot_date","capturado_em",
        "metadata_jsonb","payload_raw","source_created_at","source_updated_at","synced_at"
      ],
      estoqueSaldosRows,
      { returning: ["id"] },
    );

    // Sync / webhooks / raw payloads
    const entities = ["produtos", "pedidos", "estoque", "payouts"];
    const syncCursoresRows = [];
    const syncJobsRows = [];
    const webhookRows = [];
    const rawPayloadRows = [];
    let jobSeq = 1;
    let whSeq = 1;
    let rawSeq = 1;

    for (const ch of channels) {
      for (const ent of entities) {
        syncCursoresRows.push({
          tenant_id: tenantId,
          plataforma: ch.plataforma,
          canal_conta_id: ch.id,
          entidade: ent,
          escopo: "default",
          chave_cursor: "default",
          cursor_valor_jsonb: { page: randInt(rng, 1, 20), updated_at: new Date().toISOString() },
          cursor_texto: `cursor_${ent}_${runTag}`,
          cursor_data: new Date().toISOString(),
          ultima_execucao_em: new Date().toISOString(),
          metadata_jsonb: { seed_run: runTag },
        });

        const runs = randInt(rng, 4, 8);
        for (let i = 0; i < runs; i += 1) {
          const started = addHours(randomDateInWindow(rng, startDate, endDate), randFloat(rng, 0, 20));
          const status = weightedPick(rng, [
            { value: "success", weight: 84 },
            { value: "error", weight: 9 },
            { value: "running", weight: 2 },
            { value: "cancelled", weight: 2 },
            { value: "pending", weight: 3 },
          ]);
          const finished = ["success", "error", "cancelled"].includes(status) ? addHours(started, randFloat(rng, 0.02, 2.8)) : null;
          const rowsLidos = randInt(rng, 50, 1500);
          const rowsUp = status === "success" ? randInt(rng, Math.floor(rowsLidos * 0.5), rowsLidos) : randInt(rng, 0, Math.floor(rowsLidos * 0.4));
          syncJobsRows.push({
            tenant_id: tenantId,
            plataforma: ch.plataforma,
            canal_conta_id: ch.id,
            entidade: ent,
            escopo: "default",
            modo: chance(rng, 0.12) ? "full" : "incremental",
            status,
            prioridade: randInt(rng, 1, 9),
            requested_from: toPgTs(addHours(started, -randFloat(rng, 24, 240))),
            requested_to: toPgTs(started),
            started_at: toPgTs(started),
            finished_at: toPgTs(finished),
            rows_lidos: rowsLidos,
            rows_upsertados: rowsUp,
            rows_ignorados: Math.max(0, rowsLidos - rowsUp),
            request_params_jsonb: { tenant_id: tenantId, entity: ent },
            result_summary_jsonb: { seed_run: runTag, job_seq: jobSeq },
            erro_msg: status === "error" ? "429 rate limit (simulado)" : null,
            erro_detalhe_jsonb: status === "error" ? { code: "rate_limit", retryable: true } : {},
          });
          jobSeq += 1;
        }
      }

      const webhookCount = ch.plataforma === "shopify" ? randInt(rng, 90, 180) : randInt(rng, 30, 90);
      const topics = ch.plataforma === "shopify"
        ? ["orders/create", "orders/updated", "products/update", "inventory_levels/update"]
        : ["order_created", "order_updated", "shipment_updated", "refund_created"];
      for (let i = 0; i < webhookCount; i += 1) {
        const recv = addHours(randomDateInWindow(rng, startDate, endDate), randFloat(rng, 0, 23));
        const ok = chance(rng, 0.94);
        webhookRows.push({
          tenant_id: tenantId,
          plataforma: ch.plataforma,
          canal_conta_id: ch.id,
          external_event_id: `wh_${ch.plataforma}_${runTag}_${whSeq}`,
          topico: pick(rng, topics),
          tipo_evento: "webhook",
          status_processamento: ok ? "processado" : "erro",
          recebido_em: toPgTs(recv),
          processado_em: ok ? toPgTs(addHours(recv, randFloat(rng, 0.001, 0.3))) : null,
          tentativas: ok ? 1 : randInt(rng, 1, 4),
          headers_jsonb: { "x-seed": runTag },
          payload_raw: { source: "seed_mvp", topic: pick(rng, topics) },
          resultado_jsonb: ok ? { ok: true } : { ok: false, retry: true },
          erro_msg: ok ? null : "Falha transitória (simulada)",
        });
        whSeq += 1;
      }

      const rawCount = randInt(rng, 80, 180);
      const endpoints = ["/orders", "/products", "/inventory", "/finance/payouts"];
      for (let i = 0; i < rawCount; i += 1) {
        const when = addHours(randomDateInWindow(rng, startDate, endDate), randFloat(rng, 0, 23));
        const ok = chance(rng, 0.93);
        rawPayloadRows.push({
          tenant_id: tenantId,
          plataforma: ch.plataforma,
          canal_conta_id: ch.id,
          entidade: pick(rng, entities),
          operacao: pick(rng, ["list", "get", "sync"]),
          endpoint: pick(rng, endpoints),
          http_method: chance(rng, 0.85) ? "GET" : "POST",
          request_id: `req_${runTag}_${rawSeq}`,
          external_id: chance(rng, 0.4) ? `obj_${randInt(rng, 1000, 999999)}` : null,
          status_http: ok ? pick(rng, [200, 200, 200, 201, 204]) : pick(rng, [400, 401, 404, 429, 500]),
          erro_msg: ok ? null : "Erro simulado de integração",
          request_payload: { page: randInt(rng, 1, 20), limit: 50 },
          response_payload: ok ? { ok: true, items: randInt(rng, 0, 50) } : { ok: false },
          metadata_jsonb: { seed_run: runTag },
          ocorrido_em: toPgTs(when),
        });
        rawSeq += 1;
      }
    }

    const syncCursoresInserted = await insertMany(
      client,
      "ecommerce.sync_cursores",
      [
        "tenant_id","plataforma","canal_conta_id","entidade","escopo","chave_cursor","cursor_valor_jsonb","cursor_texto","cursor_data",
        "ultima_execucao_em","metadata_jsonb"
      ],
      syncCursoresRows,
      { returning: ["id"] },
    );
    const syncJobsInserted = await insertMany(
      client,
      "ecommerce.sync_jobs",
      [
        "tenant_id","plataforma","canal_conta_id","entidade","escopo","modo","status","prioridade","requested_from","requested_to","started_at","finished_at",
        "rows_lidos","rows_upsertados","rows_ignorados","request_params_jsonb","result_summary_jsonb","erro_msg","erro_detalhe_jsonb"
      ],
      syncJobsRows,
      { returning: ["id"] },
    );
    const webhookInserted = await insertMany(
      client,
      "ecommerce.webhook_eventos",
      [
        "tenant_id","plataforma","canal_conta_id","external_event_id","topico","tipo_evento","status_processamento","recebido_em","processado_em",
        "tentativas","headers_jsonb","payload_raw","resultado_jsonb","erro_msg"
      ],
      webhookRows,
      { returning: ["id"] },
    );
    const rawPayloadsInserted = await insertMany(
      client,
      "ecommerce.raw_api_payloads",
      [
        "tenant_id","plataforma","canal_conta_id","entidade","operacao","endpoint","http_method","request_id","external_id","status_http","erro_msg",
        "request_payload","response_payload","metadata_jsonb","ocorrido_em"
      ],
      rawPayloadRows,
      { returning: ["id"] },
    );

    await client.query("COMMIT");

    summary.inserted = {
      canais_contas: canaisContasInserted.length,
      canais_credenciais: credsRows.length,
      lojas: lojasInserted.length,
      produtos: produtosInserted.length,
      produto_variantes: variantesInserted.length,
      listings: listingsInserted.length,
      listing_variantes: listingsPack.listingVariantes.length,
      clientes: clientesInserted.length,
      enderecos: enderecosInserted.length,
      pedidos: pedidosInserted.length,
      pedido_itens: pedidoItensInserted.length,
      pagamentos: pagamentosInserted.length,
      transacoes_pagamento: transacoesInserted.length,
      envios: enviosInserted.length,
      eventos_fulfillment: eventosRows.length,
      devolucoes: devolucoesInserted.length,
      reembolsos: reembolsosInserted.length,
      taxas_pedido: taxasInserted.length,
      payouts: payoutsInserted.length,
      payout_itens: payoutItensInserted.length,
      estoque_movimentacoes: estoqueMovInserted.length,
      estoque_saldos: estoqueSaldosInserted.length,
      sync_cursores: syncCursoresInserted.length,
      sync_jobs: syncJobsInserted.length,
      webhook_eventos: webhookInserted.length,
      raw_api_payloads: rawPayloadsInserted.length,
    };

    const metrics = {
      pedidos_total: pedidosInserted.length,
      gmv_total: round2(pedidosInserted.reduce((acc, p) => acc + Number(p.valor_total || 0), 0)),
      pedidos_pagamentos_capturados: pedidosInserted.filter((p) => ["captured", "partially_refunded", "refunded"].includes(String(p.status_pagamento || ""))).length,
      pedidos_cancelados: pedidosInserted.filter((p) => String(p.status) === "cancelado").length,
      pedidos_reembolsados: pedidosInserted.filter((p) => String(p.status_pagamento || "").includes("refund")).length,
    };

    console.log(JSON.stringify({ ok: true, dryRun: false, summary, metrics }, null, 2));
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    await client.end().catch(() => {});
  }
}

async function runWithRetries() {
  const retries = Math.max(1, Number(getArg("--retries") || 6));
  let lastError = null;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      if (attempt > 1) {
        console.error(`[retry ${attempt}/${retries}] tentando novamente...`);
      }
      await main();
      return;
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      const isDns = /EAI_AGAIN|getaddrinfo/i.test(message);
      if (!isDns || attempt >= retries) break;
      await sleep(400 * attempt);
    }
  }
  console.error(lastError instanceof Error ? lastError.stack || lastError.message : String(lastError));
  process.exit(1);
}

await runWithRetries();
