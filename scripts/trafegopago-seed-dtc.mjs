#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { Client } from "pg";

function getArg(name) {
  const i = process.argv.indexOf(name);
  if (i === -1) return null;
  return process.argv[i + 1] ?? null;
}

function loadEnvFiles() {
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
}

function createRng(seed = 20260226) {
  let s = seed >>> 0;
  return () => {
    s = (1664525 * s + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function parseDateOnly(iso) {
  const [y, m, d] = String(iso).split("-").map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

function toDateOnly(d) {
  return d.toISOString().slice(0, 10);
}

function addDays(iso, n) {
  const d = parseDateOnly(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return toDateOnly(d);
}

function dateRange(startIso, endIso) {
  const out = [];
  let d = parseDateOnly(startIso);
  const end = parseDateOnly(endIso);
  while (d <= end) {
    out.push(toDateOnly(d));
    d = new Date(d.getTime() + 86400000);
  }
  return out;
}

function utcTodayDateOnly() {
  return toDateOnly(new Date());
}

function round2(n) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function round4(n) {
  return Math.round((n + Number.EPSILON) * 10000) / 10000;
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

function randBetween(rng, min, max) {
  return min + (max - min) * rng();
}

function randInt(rng, min, max) {
  return Math.floor(randBetween(rng, min, max + 1));
}

function pick(rng, arr) {
  return arr[Math.floor(rng() * arr.length)];
}

function dayOfWeek(iso) {
  return parseDateOnly(iso).getUTCDay();
}

function monthOf(iso) {
  return Number(iso.slice(5, 7));
}

function weekdayFactorForPlatform(platform, iso) {
  const dow = dayOfWeek(iso);
  if (platform === "meta_ads") {
    if (dow === 0) return 1.06; // domingo
    if (dow === 6) return 1.04; // sabado
    if (dow === 1) return 0.96;
    return 1.0;
  }
  // google_ads
  if (dow === 0) return 0.88;
  if (dow === 6) return 0.9;
  if (dow === 1) return 1.03;
  if (dow === 2) return 1.04;
  return 1.0;
}

function paydayFactor(iso) {
  const day = Number(iso.slice(8, 10));
  if (day >= 3 && day <= 6) return 1.08;
  if (day >= 24 && day <= 27) return 1.12;
  return 1.0;
}

function monthSeasonality(iso) {
  const m = monthOf(iso);
  if (m === 11) return 1.15;
  if (m === 12) return 1.2;
  if (m === 1) return 0.92;
  if (m === 2) return 0.97;
  return 1.0;
}

function promoWindowFactor(iso) {
  const day = Number(iso.slice(8, 10));
  if (day >= 10 && day <= 13) return 1.1;
  if (day >= 20 && day <= 22) return 1.07;
  return 1.0;
}

function normalizeFrequency(level, defaults = {}) {
  return {
    frequency: defaults.frequency || "daily",
    hour: defaults.hour || "08",
    minute: defaults.minute || "00",
    level,
  };
}

const DTC = {
  brand: "Lumi Skin",
  currency: "BRL",
  timezone: "America/Sao_Paulo",
  aovByObjective: {
    conversao: 189,
    remarketing: 214,
    promo: 172,
    brand_search: 198,
    shopping: 205,
    pmax: 196,
    lead: 0,
    traffic: 0,
  },
};

const PLATFORM_CONFIGS = [
  {
    platform: "meta_ads",
    account: {
      externalId: "act_90213044512",
      name: "Lumi Skin | Meta Ads BR",
      status: "active",
      metadata: { business_unit: "DTC", country: "BR" },
    },
    campaigns: [
      { key: "meta-prospect-broad", name: "META | BR | CONV | Prospecting Broad | 2026Q1", monthlyBudget: 28000, objective: "conversao", type: "prospecting", status: "active" },
      { key: "meta-interests-skin", name: "META | BR | CONV | Interests Skincare | 2026Q1", monthlyBudget: 18000, objective: "conversao", type: "interests", status: "active" },
      { key: "meta-lal-purchasers", name: "META | BR | CONV | LAL Purchasers 1-3% | 2026Q1", monthlyBudget: 16000, objective: "conversao", type: "lookalike", status: "active" },
      { key: "meta-ugc-testing", name: "META | BR | CONV | UGC Creative Testing | 2026Q1", monthlyBudget: 12000, objective: "conversao", type: "creative_test", status: "active" },
      { key: "meta-rmkt-atc", name: "META | BR | RMKT | VC+ATC 7D | 2026Q1", monthlyBudget: 14000, objective: "remarketing", type: "remarketing", status: "active" },
      { key: "meta-rmkt-engagers", name: "META | BR | RMKT | Engagers 30D | 2026Q1", monthlyBudget: 8000, objective: "remarketing", type: "remarketing", status: "active" },
      { key: "meta-kits-promo", name: "META | BR | CONV | Kits Rotina Promo | 2026Q1", monthlyBudget: 7000, objective: "promo", type: "promo", status: "active" },
      { key: "meta-lead-quiz", name: "META | BR | LEAD | Quiz de Pele | 2026Q1", monthlyBudget: 5000, objective: "lead", type: "lead_gen", status: "active" },
    ],
  },
  {
    platform: "google_ads",
    account: {
      externalId: "123-456-7890",
      name: "Lumi Skin | Google Ads BR",
      status: "active",
      metadata: { business_unit: "DTC", country: "BR" },
    },
    campaigns: [
      { key: "gads-search-brand", name: "GADS | BR | Search | Brand | 2026Q1", monthlyBudget: 9000, objective: "brand_search", type: "search_brand", status: "active" },
      { key: "gads-search-generic", name: "GADS | BR | Search | Generic Skincare | 2026Q1", monthlyBudget: 16000, objective: "conversao", type: "search_generic", status: "active" },
      { key: "gads-search-acne", name: "GADS | BR | Search | Acne/Oleosidade | 2026Q1", monthlyBudget: 10000, objective: "conversao", type: "search_problem", status: "active" },
      { key: "gads-shopping-core", name: "GADS | BR | Shopping | Core Feed | 2026Q1", monthlyBudget: 14000, objective: "shopping", type: "shopping", status: "active" },
      { key: "gads-pmax-all", name: "GADS | BR | PMax | All Products | 2026Q1", monthlyBudget: 15000, objective: "pmax", type: "pmax", status: "active" },
      { key: "gads-search-competitors", name: "GADS | BR | Search | Competitors | 2026Q1", monthlyBudget: 3000, objective: "traffic", type: "search_competitor", status: "active" },
      { key: "gads-demandgen-rmkt", name: "GADS | BR | DemandGen | Remarketing | 2026Q1", monthlyBudget: 3000, objective: "remarketing", type: "demandgen_rmkt", status: "active" },
      { key: "gads-shopping-promo", name: "GADS | BR | Shopping | Promo Kits | 2026Q1", monthlyBudget: 2000, objective: "promo", type: "shopping_promo", status: "active" },
    ],
  },
];

function campaignProfile(c) {
  const k = c.key;
  if (k.includes("brand")) return { ctr: [0.16, 0.28], cpc: [0.9, 1.8], cvr: [0.07, 0.13], freq: [1.05, 1.35], roasFactor: [1.15, 1.5], leadRate: [0.01, 0.03] };
  if (k.includes("shopping-core")) return { ctr: [0.012, 0.024], cpc: [1.8, 3.8], cvr: [0.02, 0.05], freq: [1.1, 1.4], roasFactor: [0.95, 1.2], leadRate: [0.003, 0.015] };
  if (k.includes("shopping-promo")) return { ctr: [0.013, 0.028], cpc: [1.4, 3.2], cvr: [0.03, 0.065], freq: [1.1, 1.5], roasFactor: [0.85, 1.15], leadRate: [0.004, 0.012] };
  if (k.includes("pmax")) return { ctr: [0.01, 0.02], cpc: [1.6, 4.0], cvr: [0.02, 0.055], freq: [1.05, 1.45], roasFactor: [0.95, 1.2], leadRate: [0.002, 0.01] };
  if (k.includes("competitors")) return { ctr: [0.03, 0.07], cpc: [2.8, 6.3], cvr: [0.01, 0.03], freq: [1.0, 1.25], roasFactor: [0.7, 1.0], leadRate: [0.005, 0.02] };
  if (k.includes("demandgen")) return { ctr: [0.013, 0.03], cpc: [1.2, 3.0], cvr: [0.025, 0.07], freq: [1.3, 2.8], roasFactor: [1.05, 1.35], leadRate: [0.006, 0.02] };
  if (k.includes("lead")) return { ctr: [0.011, 0.024], cpc: [1.3, 2.7], cvr: [0.06, 0.16], freq: [1.2, 2.7], roasFactor: [0, 0], leadRate: [0.8, 1.0] };
  if (k.includes("rmkt")) return { ctr: [0.018, 0.035], cpc: [1.3, 3.0], cvr: [0.035, 0.09], freq: [1.7, 3.4], roasFactor: [1.2, 1.7], leadRate: [0.006, 0.02] };
  if (k.includes("ugc")) return { ctr: [0.009, 0.021], cpc: [1.8, 4.2], cvr: [0.015, 0.045], freq: [1.1, 2.0], roasFactor: [0.8, 1.05], leadRate: [0.005, 0.015] };
  if (k.includes("lal")) return { ctr: [0.011, 0.022], cpc: [1.6, 3.6], cvr: [0.02, 0.055], freq: [1.2, 2.1], roasFactor: [0.95, 1.2], leadRate: [0.004, 0.012] };
  if (k.includes("interests")) return { ctr: [0.009, 0.018], cpc: [1.9, 4.1], cvr: [0.013, 0.04], freq: [1.15, 2.0], roasFactor: [0.85, 1.1], leadRate: [0.004, 0.012] };
  if (k.includes("promo")) return { ctr: [0.012, 0.03], cpc: [1.4, 3.5], cvr: [0.03, 0.08], freq: [1.2, 2.5], roasFactor: [0.9, 1.25], leadRate: [0.004, 0.012] };
  if (k.includes("search")) return { ctr: [0.04, 0.11], cpc: [1.8, 5.8], cvr: [0.02, 0.06], freq: [1.0, 1.25], roasFactor: [0.9, 1.2], leadRate: [0.004, 0.014] };
  return { ctr: [0.01, 0.02], cpc: [1.5, 3.5], cvr: [0.015, 0.04], freq: [1.1, 1.8], roasFactor: [0.9, 1.1], leadRate: [0.003, 0.012] };
}

function makeAdGroups(campaign, platform) {
  const suffixes = platform === "meta_ads"
    ? ["Creative A", "Creative B", "Creative C"]
    : ["Grupo 1", "Grupo 2", "Grupo 3"];
  return suffixes.map((suffix, idx) => ({
    key: `${campaign.key}-g${idx + 1}`,
    externalId: `${campaign.key}_grp_${idx + 1}`.replace(/[^a-zA-Z0-9_:-]/g, "_"),
    name: `${campaign.name} | ${suffix}`,
    weight: idx === 0 ? 0.42 : idx === 1 ? 0.33 : 0.25,
    status: "active",
  }));
}

function makeAds(group, campaign, platform) {
  const count = platform === "meta_ads" ? 3 : 3;
  const labels = platform === "meta_ads"
    ? ["UGC Hook", "Oferta", "Prova Social"]
    : ["RSA Core", "RSA Variant", "Extension Mix"];
  return Array.from({ length: count }, (_, idx) => ({
    key: `${group.key}-a${idx + 1}`,
    externalId: `${group.key}_ad_${idx + 1}`.replace(/[^a-zA-Z0-9_:-]/g, "_"),
    name: `${campaign.name} | ${labels[idx]}`,
    weight: idx === 0 ? 0.45 : idx === 1 ? 0.33 : 0.22,
    creativeType: platform === "meta_ads" ? "video_image_mix" : "responsive_search",
    status: "active",
  }));
}

function buildScenario() {
  const scenario = [];
  for (const platformCfg of PLATFORM_CONFIGS) {
    const account = platformCfg.account;
    const campaigns = platformCfg.campaigns.map((c) => {
      const groups = makeAdGroups(c, platformCfg.platform).map((g) => ({
        ...g,
        ads: makeAds(g, c, platformCfg.platform),
      }));
      return {
        ...c,
        profile: campaignProfile(c),
        groups,
      };
    });
    scenario.push({ ...platformCfg, account, campaigns });
  }
  return scenario;
}

function buildDateWindow() {
  const end = (getArg("--end") || utcTodayDateOnly()).trim();
  const startArg = (getArg("--start") || "").trim();
  const days = Math.max(1, Number(getArg("--days") || 90));
  const start = startArg || addDays(end, -(days - 1));
  return { start, end, dates: dateRange(start, end) };
}

function computeDailySpend({ rng, iso, campaign, platform }) {
  const baseDaily = campaign.monthlyBudget / 30;
  const weekday = weekdayFactorForPlatform(platform, iso);
  const payday = paydayFactor(iso);
  const season = monthSeasonality(iso);
  const promo = campaign.objective === "promo" ? promoWindowFactor(iso) * 1.08 : promoWindowFactor(iso);
  const noise = randBetween(rng, 0.88, 1.14);
  const testPenalty = campaign.type === "creative_test" ? randBetween(rng, 0.72, 1.08) : 1;
  const leadVol = campaign.objective === "lead" ? randBetween(rng, 0.85, 1.18) : 1;
  return round2(baseDaily * weekday * payday * season * promo * noise * testPenalty * leadVol);
}

function maybePausedFactor(rng, campaign, iso) {
  if (campaign.type === "creative_test") {
    const day = Number(iso.slice(8, 10));
    if (day >= 27 && day <= 28 && rng() < 0.7) return 0;
  }
  if (campaign.type === "shopping_promo") {
    const day = Number(iso.slice(8, 10));
    if (day < 8 || day > 24) return 0.6;
  }
  if (campaign.type === "search_competitor" && rng() < 0.04) return 0;
  return 1;
}

function adMetricsForSpend({ rng, campaign, spend, platform }) {
  const p = campaign.profile;
  const ctr = clamp(randBetween(rng, p.ctr[0], p.ctr[1]) * randBetween(rng, 0.92, 1.08), 0.002, 0.45);
  const cpc = round4(clamp(randBetween(rng, p.cpc[0], p.cpc[1]) * randBetween(rng, 0.9, 1.12), 0.15, 50));
  const clicks = Math.max(0, Math.round(spend / cpc));
  const impressions = Math.max(clicks, Math.round(clicks / Math.max(ctr, 0.0001)));
  const freq = round4(clamp(randBetween(rng, p.freq[0], p.freq[1]) * randBetween(rng, 0.95, 1.08), 1, 8));
  const reach = Math.max(0, Math.round(impressions / Math.max(freq, 1)));
  const cvr = clamp(randBetween(rng, p.cvr[0], p.cvr[1]) * randBetween(rng, 0.92, 1.1), 0.001, 0.5);
  const conversions = round4(clicks * cvr);
  const leadRate = clamp(randBetween(rng, p.leadRate[0], p.leadRate[1]) * randBetween(rng, 0.9, 1.1), 0, 1);
  const leads = campaign.objective === "lead"
    ? round4(conversions)
    : round4(clicks * leadRate);

  const aovKey = campaign.objective in DTC.aovByObjective ? campaign.objective : "conversao";
  const baseAov = DTC.aovByObjective[aovKey];
  const roasFactor = p.roasFactor[1] > 0 ? randBetween(rng, p.roasFactor[0], p.roasFactor[1]) : 0;
  let revenue = 0;
  if (baseAov > 0) {
    revenue = round4(conversions * baseAov * roasFactor);
  } else if (campaign.objective === "lead") {
    revenue = 0;
  }

  if (platform === "google_ads" && campaign.type === "search_brand") {
    revenue = round4(revenue * randBetween(rng, 1.05, 1.22));
  }

  return {
    impressoes: impressions,
    cliques: clicks,
    alcance: reach,
    frequencia: freq,
    gasto: round4(spend),
    conversoes: round4(conversions),
    leads: round4(leads),
    receita_atribuida: round4(revenue),
  };
}

function sumMetrics(rows) {
  const out = {
    impressoes: 0,
    cliques: 0,
    alcance: 0,
    gasto: 0,
    conversoes: 0,
    leads: 0,
    receita_atribuida: 0,
  };
  for (const r of rows) {
    out.impressoes += Number(r.impressoes || 0);
    out.cliques += Number(r.cliques || 0);
    out.alcance += Number(r.alcance || 0);
    out.gasto += Number(r.gasto || 0);
    out.conversoes += Number(r.conversoes || 0);
    out.leads += Number(r.leads || 0);
    out.receita_atribuida += Number(r.receita_atribuida || 0);
  }
  const freq = out.alcance > 0 ? round4(out.impressoes / out.alcance) : null;
  return {
    ...out,
    impressoes: Math.round(out.impressoes),
    cliques: Math.round(out.cliques),
    alcance: Math.round(out.alcance),
    gasto: round4(out.gasto),
    conversoes: round4(out.conversoes),
    leads: round4(out.leads),
    receita_atribuida: round4(out.receita_atribuida),
    frequencia: freq,
  };
}

async function upsertConta(client, row) {
  const q = await client.query(
    `INSERT INTO trafegopago.contas_midia
      (tenant_id, plataforma, conta_externa_id, nome_conta, moeda, fuso_horario, status, ativo, metadata_json, ultimo_sync_em, atualizado_em)
     VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, now(), now())
     ON CONFLICT (tenant_id, plataforma, conta_externa_id)
     DO UPDATE SET
      nome_conta = EXCLUDED.nome_conta,
      moeda = EXCLUDED.moeda,
      fuso_horario = EXCLUDED.fuso_horario,
      status = EXCLUDED.status,
      ativo = EXCLUDED.ativo,
      metadata_json = EXCLUDED.metadata_json,
      ultimo_sync_em = now(),
      atualizado_em = now()
     RETURNING id`,
    [
      row.tenant_id, row.plataforma, row.conta_externa_id, row.nome_conta, row.moeda, row.fuso_horario,
      row.status, row.ativo, JSON.stringify(row.metadata_json || {}),
    ],
  );
  return q.rows[0].id;
}

async function upsertCampanha(client, row) {
  const q = await client.query(
    `INSERT INTO trafegopago.campanhas
      (tenant_id, conta_id, plataforma, campanha_externa_id, nome, status, objetivo, data_inicio, data_fim, ativo, metadata_json, ultimo_sync_em, atualizado_em)
     VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb, now(), now())
     ON CONFLICT (tenant_id, plataforma, campanha_externa_id)
     DO UPDATE SET
      conta_id = EXCLUDED.conta_id,
      nome = EXCLUDED.nome,
      status = EXCLUDED.status,
      objetivo = EXCLUDED.objetivo,
      data_inicio = EXCLUDED.data_inicio,
      data_fim = EXCLUDED.data_fim,
      ativo = EXCLUDED.ativo,
      metadata_json = EXCLUDED.metadata_json,
      ultimo_sync_em = now(),
      atualizado_em = now()
     RETURNING id`,
    [
      row.tenant_id, row.conta_id, row.plataforma, row.campanha_externa_id, row.nome, row.status, row.objetivo,
      row.data_inicio, row.data_fim, row.ativo, JSON.stringify(row.metadata_json || {}),
    ],
  );
  return q.rows[0].id;
}

async function upsertGrupo(client, row) {
  const q = await client.query(
    `INSERT INTO trafegopago.grupos_anuncio
      (tenant_id, conta_id, campanha_id, plataforma, grupo_externo_id, nome, status, data_inicio, data_fim, ativo, metadata_json, ultimo_sync_em, atualizado_em)
     VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb, now(), now())
     ON CONFLICT (tenant_id, plataforma, grupo_externo_id)
     DO UPDATE SET
      conta_id = EXCLUDED.conta_id,
      campanha_id = EXCLUDED.campanha_id,
      nome = EXCLUDED.nome,
      status = EXCLUDED.status,
      data_inicio = EXCLUDED.data_inicio,
      data_fim = EXCLUDED.data_fim,
      ativo = EXCLUDED.ativo,
      metadata_json = EXCLUDED.metadata_json,
      ultimo_sync_em = now(),
      atualizado_em = now()
     RETURNING id`,
    [
      row.tenant_id, row.conta_id, row.campanha_id, row.plataforma, row.grupo_externo_id, row.nome, row.status,
      row.data_inicio, row.data_fim, row.ativo, JSON.stringify(row.metadata_json || {}),
    ],
  );
  return q.rows[0].id;
}

async function upsertAnuncio(client, row) {
  const q = await client.query(
    `INSERT INTO trafegopago.anuncios
      (tenant_id, conta_id, campanha_id, grupo_id, plataforma, anuncio_externo_id, nome, status, creative_tipo, ativo, metadata_json, ultimo_sync_em, atualizado_em)
     VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11::jsonb, now(), now())
     ON CONFLICT (tenant_id, plataforma, anuncio_externo_id)
     DO UPDATE SET
      conta_id = EXCLUDED.conta_id,
      campanha_id = EXCLUDED.campanha_id,
      grupo_id = EXCLUDED.grupo_id,
      nome = EXCLUDED.nome,
      status = EXCLUDED.status,
      creative_tipo = EXCLUDED.creative_tipo,
      ativo = EXCLUDED.ativo,
      metadata_json = EXCLUDED.metadata_json,
      ultimo_sync_em = now(),
      atualizado_em = now()
     RETURNING id`,
    [
      row.tenant_id, row.conta_id, row.campanha_id, row.grupo_id, row.plataforma, row.anuncio_externo_id, row.nome,
      row.status, row.creative_tipo, row.ativo, JSON.stringify(row.metadata_json || {}),
    ],
  );
  return q.rows[0].id;
}

async function insertCarga(client, row) {
  const q = await client.query(
    `INSERT INTO trafegopago.cargas
      (tenant_id, plataforma, origem_conector, carga_externa_id, periodo_inicio, periodo_fim, status, metadata_json, iniciado_em, criado_em, atualizado_em)
     VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8::jsonb, now(), now(), now())
     RETURNING id`,
    [
      row.tenant_id, row.plataforma, row.origem_conector, row.carga_externa_id, row.periodo_inicio, row.periodo_fim, row.status,
      JSON.stringify(row.metadata_json || {}),
    ],
  );
  return q.rows[0].id;
}

async function batchInsertDesempenho(client, rows) {
  if (!rows.length) return;
  const chunkSize = 200;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const values = [];
    const params = [];
    for (let j = 0; j < chunk.length; j += 1) {
      const r = chunk[j];
      const b = j * 24;
      values.push(
        `($${b + 1},$${b + 2},$${b + 3},$${b + 4},$${b + 5},$${b + 6},$${b + 7},$${b + 8},$${b + 9},$${b + 10},$${b + 11},$${b + 12},$${b + 13},$${b + 14},$${b + 15},$${b + 16},$${b + 17},$${b + 18},$${b + 19},$${b + 20},$${b + 21},$${b + 22},$${b + 23}::jsonb,$${b + 24}::jsonb)`
      );
      params.push(
        r.tenant_id,
        r.carga_id,
        r.data_ref,
        r.plataforma,
        r.nivel,
        r.moeda,
        r.conta_id,
        r.campanha_id,
        r.grupo_id,
        r.anuncio_id,
        r.conta_externa_id,
        r.campanha_externa_id,
        r.grupo_externo_id,
        r.anuncio_externo_id,
        r.impressoes,
        r.cliques,
        r.alcance,
        r.frequencia,
        r.gasto,
        r.conversoes,
        r.leads,
        r.receita_atribuida,
        JSON.stringify(r.payload_raw || {}),
        JSON.stringify(r.metadata_json || {}),
      );
    }

    await client.query(
      `INSERT INTO trafegopago.desempenho_diario (
        tenant_id, carga_id, data_ref, plataforma, nivel, moeda,
        conta_id, campanha_id, grupo_id, anuncio_id,
        conta_externa_id, campanha_externa_id, grupo_externo_id, anuncio_externo_id,
        impressoes, cliques, alcance, frequencia, gasto, conversoes, leads, receita_atribuida,
        payload_raw, metadata_json
      ) VALUES ${values.join(",")}`,
      params,
    );
  }
}

function buildFactRows({ tenantId, dates, scenario, entityMaps, cargaByPlatform, seed }) {
  const rng = createRng(seed);
  const allRows = [];

  for (const platformCfg of scenario) {
    const platform = platformCfg.platform;
    const cargaId = cargaByPlatform[platform];
    const accountDb = entityMaps.contas.get(`${platform}|${platformCfg.account.externalId}`);

    for (const campaign of platformCfg.campaigns) {
      const campDb = entityMaps.campanhas.get(`${platform}|${campaign.key}`);
      const groups = campaign.groups.map((g) => ({
        ...g,
        db: entityMaps.grupos.get(`${platform}|${g.key}`),
        ads: g.ads.map((a) => ({ ...a, db: entityMaps.anuncios.get(`${platform}|${a.key}`) })),
      }));

      for (const iso of dates) {
        const pausedFactor = maybePausedFactor(rng, campaign, iso);
        const totalCampaignSpend = computeDailySpend({ rng, iso, campaign, platform }) * pausedFactor;

        const adRowsForDay = [];
        const groupRowsForDay = [];

        for (const group of groups) {
          const groupSpendBase = totalCampaignSpend * group.weight * randBetween(rng, 0.9, 1.1);
          const groupAdRows = [];

          for (const ad of group.ads) {
            const adSpend = round4(Math.max(0, groupSpendBase * ad.weight * randBetween(rng, 0.88, 1.12)));
            const metrics = adMetricsForSpend({ rng, campaign, spend: adSpend, platform });

            const row = {
              tenant_id: tenantId,
              carga_id: cargaId,
              data_ref: iso,
              plataforma: platform,
              nivel: "ad",
              moeda: DTC.currency,
              conta_id: accountDb.id,
              campanha_id: campDb.id,
              grupo_id: group.db.id,
              anuncio_id: ad.db.id,
              conta_externa_id: platformCfg.account.externalId,
              campanha_externa_id: campDb.externalId,
              grupo_externo_id: group.db.externalId,
              anuncio_externo_id: ad.db.externalId,
              ...metrics,
              payload_raw: {
                source: "simulated_fivetran",
                platform,
                campaign_key: campaign.key,
                group_key: group.key,
                ad_key: ad.key,
              },
              metadata_json: {
                objective: campaign.objective,
                campaign_type: campaign.type,
                brand: DTC.brand,
              },
            };

            groupAdRows.push(row);
            adRowsForDay.push(row);
          }

          const groupAgg = sumMetrics(groupAdRows);
          groupRowsForDay.push({
            tenant_id: tenantId,
            carga_id: cargaId,
            data_ref: iso,
            plataforma: platform,
            nivel: "ad_group",
            moeda: DTC.currency,
            conta_id: accountDb.id,
            campanha_id: campDb.id,
            grupo_id: group.db.id,
            anuncio_id: null,
            conta_externa_id: platformCfg.account.externalId,
            campanha_externa_id: campDb.externalId,
            grupo_externo_id: group.db.externalId,
            anuncio_externo_id: null,
            ...groupAgg,
            payload_raw: {
              source: "simulated_fivetran",
              platform,
              campaign_key: campaign.key,
              group_key: group.key,
              aggregated_from: "ad",
            },
            metadata_json: {
              objective: campaign.objective,
              campaign_type: campaign.type,
              brand: DTC.brand,
            },
          });
        }

        const campaignAgg = sumMetrics(groupRowsForDay);
        const campaignRow = {
          tenant_id: tenantId,
          carga_id: cargaId,
          data_ref: iso,
          plataforma: platform,
          nivel: "campaign",
          moeda: DTC.currency,
          conta_id: accountDb.id,
          campanha_id: campDb.id,
          grupo_id: null,
          anuncio_id: null,
          conta_externa_id: platformCfg.account.externalId,
          campanha_externa_id: campDb.externalId,
          grupo_externo_id: null,
          anuncio_externo_id: null,
          ...campaignAgg,
          payload_raw: {
            source: "simulated_fivetran",
            platform,
            campaign_key: campaign.key,
            aggregated_from: "ad_group",
          },
          metadata_json: {
            objective: campaign.objective,
            campaign_type: campaign.type,
            brand: DTC.brand,
          },
        };

        allRows.push(...adRowsForDay, ...groupRowsForDay, campaignRow);
      }
    }
  }

  return allRows;
}

async function main() {
  loadEnvFiles();

  const dbUrl = (getArg("--db-url") || process.env.SUPABASE_DB_URL || "").trim();
  if (!dbUrl) throw new Error("SUPABASE_DB_URL ausente");

  const tenantId = Number(getArg("--tenant") || 1);
  const seed = Number(getArg("--seed") || 20260226);
  const { start, end, dates } = buildDateWindow();

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
    query_timeout: 120000,
    statement_timeout: 120000,
  });

  const scenario = buildScenario();

  const entityMaps = {
    contas: new Map(),
    campanhas: new Map(),
    grupos: new Map(),
    anuncios: new Map(),
  };
  const cargaByPlatform = {};

  await client.connect();
  try {
    await client.query("BEGIN");

    for (const platformCfg of scenario) {
      const platform = platformCfg.platform;
      const cargaId = await insertCarga(client, {
        tenant_id: tenantId,
        plataforma: platform,
        origem_conector: "fivetran",
        carga_externa_id: `seed-${platform}-${start}-${end}-${Date.now()}`,
        periodo_inicio: start,
        periodo_fim: end,
        status: "running",
        metadata_json: {
          source: "simulated_seed",
          brand: DTC.brand,
          window: { start, end },
          note: "Meta Ads + Google Ads DTC seed",
        },
      });
      cargaByPlatform[platform] = cargaId;

      const contaId = await upsertConta(client, {
        tenant_id: tenantId,
        plataforma: platform,
        conta_externa_id: platformCfg.account.externalId,
        nome_conta: platformCfg.account.name,
        moeda: DTC.currency,
        fuso_horario: DTC.timezone,
        status: platformCfg.account.status,
        ativo: true,
        metadata_json: platformCfg.account.metadata,
      });
      entityMaps.contas.set(`${platform}|${platformCfg.account.externalId}`, { id: contaId, externalId: platformCfg.account.externalId });

      for (const campaign of platformCfg.campaigns) {
        const campId = await upsertCampanha(client, {
          tenant_id: tenantId,
          conta_id: contaId,
          plataforma: platform,
          campanha_externa_id: `camp_${campaign.key}`,
          nome: campaign.name,
          status: campaign.status,
          objetivo: campaign.objective,
          data_inicio: start,
          data_fim: null,
          ativo: true,
          metadata_json: {
            monthly_budget: campaign.monthlyBudget,
            type: campaign.type,
            brand: DTC.brand,
          },
        });
        entityMaps.campanhas.set(`${platform}|${campaign.key}`, { id: campId, externalId: `camp_${campaign.key}` });

        for (const group of campaign.groups) {
          const groupId = await upsertGrupo(client, {
            tenant_id: tenantId,
            conta_id: contaId,
            campanha_id: campId,
            plataforma: platform,
            grupo_externo_id: `grp_${group.externalId}`,
            nome: group.name,
            status: group.status,
            data_inicio: start,
            data_fim: null,
            ativo: true,
            metadata_json: { weight: group.weight, brand: DTC.brand },
          });
          entityMaps.grupos.set(`${platform}|${group.key}`, { id: groupId, externalId: `grp_${group.externalId}` });

          for (const ad of group.ads) {
            const adId = await upsertAnuncio(client, {
              tenant_id: tenantId,
              conta_id: contaId,
              campanha_id: campId,
              grupo_id: groupId,
              plataforma: platform,
              anuncio_externo_id: `ad_${ad.externalId}`,
              nome: ad.name,
              status: ad.status,
              creative_tipo: ad.creativeType,
              ativo: true,
              metadata_json: { weight: ad.weight, brand: DTC.brand },
            });
            entityMaps.anuncios.set(`${platform}|${ad.key}`, { id: adId, externalId: `ad_${ad.externalId}` });
          }
        }
      }
    }

    await client.query(
      `DELETE FROM trafegopago.desempenho_diario
       WHERE tenant_id = $1
         AND data_ref BETWEEN $2::date AND $3::date
         AND plataforma = ANY($4::text[])`,
      [tenantId, start, end, scenario.map((s) => s.platform)],
    );

    const factRows = buildFactRows({ tenantId, dates, scenario, entityMaps, cargaByPlatform, seed });
    await batchInsertDesempenho(client, factRows);

    for (const platformCfg of scenario) {
      const platform = platformCfg.platform;
      const cargaId = cargaByPlatform[platform];
      const rowsForPlatform = factRows.filter((r) => r.plataforma === platform);
      await client.query(
        `UPDATE trafegopago.cargas
         SET status = 'success',
             linhas_recebidas = $2,
             linhas_processadas = $2,
             finalizado_em = now(),
             atualizado_em = now()
         WHERE id = $1`,
        [cargaId, rowsForPlatform.length],
      );
    }

    await client.query("COMMIT");

    const summary = factRows.reduce((acc, r) => {
      const p = r.plataforma;
      if (!acc[p]) acc[p] = { rows: 0, spend: 0, revenue: 0, clicks: 0, impressions: 0, conversions: 0, leads: 0 };
      acc[p].rows += 1;
      if (r.nivel === "campaign") {
        acc[p].spend += Number(r.gasto || 0);
        acc[p].revenue += Number(r.receita_atribuida || 0);
        acc[p].clicks += Number(r.cliques || 0);
        acc[p].impressions += Number(r.impressoes || 0);
        acc[p].conversions += Number(r.conversoes || 0);
        acc[p].leads += Number(r.leads || 0);
      }
      return acc;
    }, {});

    console.log(JSON.stringify({
      ok: true,
      tenantId,
      brand: DTC.brand,
      period: { start, end, days: dates.length },
      counts: {
        contas_midia: entityMaps.contas.size,
        campanhas: entityMaps.campanhas.size,
        grupos_anuncio: entityMaps.grupos.size,
        anuncios: entityMaps.anuncios.size,
        desempenho_diario_rows: factRows.length,
      },
      campaignLevelTotalsByPlatform: Object.fromEntries(
        Object.entries(summary).map(([platform, v]) => [platform, {
          rows: v.rows,
          spend: round2(v.spend),
          revenue: round2(v.revenue),
          roas: v.spend > 0 ? round2(v.revenue / v.spend) : 0,
          clicks: Math.round(v.clicks),
          impressions: Math.round(v.impressions),
          conversions: round2(v.conversions),
          leads: round2(v.leads),
        }]),
      ),
    }, null, 2));
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    throw e;
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.stack || e.message : String(e));
  process.exit(1);
});
