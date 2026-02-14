#!/usr/bin/env node

import { Client } from "pg";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

function loadEnvFiles() {
  // Do not override already-set env vars.
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

function slugify(input) {
  const s = String(input || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
  return s || "untitled";
}

async function main() {
  loadEnvFiles();
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.error("SUPABASE_DB_URL missing (add to .env.local).");
    process.exit(1);
  }

  const tenantIdEnv = Number.parseInt(String(process.env.DEFAULT_TENANT_ID || "").trim(), 10);
  const tenantId = Number.isFinite(tenantIdEnv) && tenantIdEnv > 0 ? tenantIdEnv : 1;

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    await client.query("BEGIN");

    const schemaNames = ["DEMO - Vendas B2B", "DEMO - Operacoes & Financeiro"];
    await client.query(
      `delete from airtable."schema" where tenant_id = $1 and name = any($2::text[])`,
      [tenantId, schemaNames]
    );

    async function createSchema(name, description) {
      const q = await client.query(
        `insert into airtable."schema" (tenant_id, name, description)
         values ($1, $2, $3)
         returning id::text as id`,
        [tenantId, name, description]
      );
      return q.rows[0].id;
    }

    async function createTable(schemaId, name, description) {
      const slug = slugify(name);
      const q = await client.query(
        `insert into airtable."table" (tenant_id, schema_id, name, slug, description)
         values ($1, $2::uuid, $3, $4, $5)
         returning id::text as id`,
        [tenantId, schemaId, name, slug, description]
      );
      return q.rows[0].id;
    }

    async function createField(schemaId, tableId, { name, type, required = false, config = {}, order = 0 }) {
      const slug = slugify(name);
      const q = await client.query(
        `insert into airtable."field" (tenant_id, schema_id, table_id, name, slug, type, required, config, "order")
         values ($1, $2::uuid, $3::uuid, $4, $5, $6, $7, $8::jsonb, $9)
         returning id::text as id, slug`,
        [tenantId, schemaId, tableId, name, slug, type, required, JSON.stringify(config), order]
      );
      return { id: q.rows[0].id, slug: q.rows[0].slug };
    }

    async function createRecord(schemaId, tableId, title) {
      const q = await client.query(
        `insert into airtable."record" (tenant_id, schema_id, table_id, title)
         values ($1, $2::uuid, $3::uuid, $4)
         returning id::text as id`,
        [tenantId, schemaId, tableId, title]
      );
      return q.rows[0].id;
    }

    async function upsertCell({ schemaId, tableId, recordId, fieldId, fieldType, value }) {
      let text = null, number = null, bool = null, date = null, json = null;
      if (value == null || value === "") {
        // clear
      } else if (fieldType === "number") {
        number = String(Number(value));
      } else if (fieldType === "bool") {
        bool = !!value;
      } else if (fieldType === "date") {
        date = String(value);
      } else if (fieldType === "json") {
        json = JSON.stringify(value);
      } else {
        text = String(value);
      }

      await client.query(
        `
        insert into airtable."cell" (tenant_id, schema_id, table_id, record_id, field_id, text, number, bool, date, json, updated_at)
        values ($1, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $6, $7::numeric, $8::boolean, $9::date, $10::jsonb, now())
        on conflict (record_id, field_id) do update
        set text = excluded.text,
            number = excluded.number,
            bool = excluded.bool,
            date = excluded.date,
            json = excluded.json,
            updated_at = now()
        `,
        [tenantId, schemaId, tableId, recordId, fieldId, text, number, bool, date, json]
      );
    }

    // -------------------------
    // Schema 1: DEMO - Vendas B2B
    // -------------------------
    const schema1 = await createSchema(
      "DEMO - Vendas B2B",
      "Pipeline B2B com empresas, contatos e oportunidades"
    );

    const tEmpresas = await createTable(schema1, "Empresas", "Cadastro de contas B2B (clientes e prospects)");
    const tContatos = await createTable(schema1, "Contatos", "Stakeholders por empresa");
    const tOpps = await createTable(schema1, "Oportunidades", "Negociacoes em andamento");

    const fEmp = {};
    for (const spec of [
      { name: "Razao Social", type: "text", required: true, order: 10 },
      { name: "Nome Fantasia", type: "text", order: 20 },
      { name: "CNPJ", type: "text", required: true, order: 30 },
      { name: "Segmento", type: "select", config: { options: ["Tecnologia", "Industria", "Servicos", "Varejo", "Saude"] }, order: 40 },
      { name: "Porte", type: "select", config: { options: ["ME", "EPP", "Media", "Grande"] }, order: 50 },
      { name: "Cidade", type: "text", order: 60 },
      { name: "UF", type: "text", order: 70 },
      { name: "Site", type: "text", order: 80 },
      { name: "Status", type: "select", config: { options: ["Prospect", "Cliente", "Inativo"] }, order: 90 },
    ]) {
      fEmp[slugify(spec.name)] = { ...(await createField(schema1, tEmpresas, spec)), type: spec.type };
    }

    const fCon = {};
    for (const spec of [
      { name: "Nome", type: "text", required: true, order: 10 },
      { name: "Email", type: "text", order: 20 },
      { name: "Telefone", type: "text", order: 30 },
      { name: "Cargo", type: "text", order: 40 },
      { name: "Empresa (CNPJ)", type: "text", order: 50 },
      { name: "Canal", type: "select", config: { options: ["Inbound", "Outbound", "Indicacao", "Evento", "Parceria"] }, order: 60 },
      { name: "Ativo", type: "bool", order: 70 },
    ]) {
      fCon[slugify(spec.name)] = { ...(await createField(schema1, tContatos, spec)), type: spec.type };
    }

    const fOpp = {};
    for (const spec of [
      { name: "Empresa (CNPJ)", type: "text", order: 10 },
      { name: "Valor Estimado (BRL)", type: "number", order: 20 },
      { name: "Etapa", type: "select", config: { options: ["Qualificacao", "Diagnostico", "Proposta", "Negociacao", "Fechado - Ganhou", "Fechado - Perdeu"] }, order: 30 },
      { name: "Probabilidade (%)", type: "number", order: 40 },
      { name: "Data Prevista", type: "date", order: 50 },
      { name: "Origem", type: "select", config: { options: ["Inbound", "Outbound", "Indicacao", "Parceria"] }, order: 60 },
      { name: "Responsavel", type: "text", order: 70 },
      { name: "Notas", type: "text", order: 80 },
    ]) {
      fOpp[slugify(spec.name)] = { ...(await createField(schema1, tOpps, spec)), type: spec.type };
    }

    const empresas = [
      {
        title: "Alpha Tecnologia LTDA",
        razao_social: "ALPHA TECNOLOGIA LTDA",
        nome_fantasia: "AlphaTech",
        cnpj: "12.345.678/0001-90",
        segmento: "Tecnologia",
        porte: "Media",
        cidade: "Sao Paulo",
        uf: "SP",
        site: "https://alphatech.com.br",
        status: "Prospect",
      },
      {
        title: "Metalurgica Horizonte SA",
        razao_social: "METALURGICA HORIZONTE S.A.",
        nome_fantasia: "Horizonte Metal",
        cnpj: "45.789.123/0001-10",
        segmento: "Industria",
        porte: "Grande",
        cidade: "Joinville",
        uf: "SC",
        site: "https://horizontemetal.com.br",
        status: "Cliente",
      },
      {
        title: "Clinica VidaMais",
        razao_social: "VIDAMAIS SERVICOS MEDICOS LTDA",
        nome_fantasia: "VidaMais",
        cnpj: "98.765.432/0001-55",
        segmento: "Saude",
        porte: "EPP",
        cidade: "Belo Horizonte",
        uf: "MG",
        site: "https://vidamais.com.br",
        status: "Prospect",
      },
    ];

    for (const e of empresas) {
      const recId = await createRecord(schema1, tEmpresas, e.title);
      await upsertCell({ schemaId: schema1, tableId: tEmpresas, recordId: recId, fieldId: fEmp.razao_social.id, fieldType: fEmp.razao_social.type, value: e.razao_social });
      await upsertCell({ schemaId: schema1, tableId: tEmpresas, recordId: recId, fieldId: fEmp.nome_fantasia.id, fieldType: fEmp.nome_fantasia.type, value: e.nome_fantasia });
      await upsertCell({ schemaId: schema1, tableId: tEmpresas, recordId: recId, fieldId: fEmp.cnpj.id, fieldType: fEmp.cnpj.type, value: e.cnpj });
      await upsertCell({ schemaId: schema1, tableId: tEmpresas, recordId: recId, fieldId: fEmp.segmento.id, fieldType: fEmp.segmento.type, value: e.segmento });
      await upsertCell({ schemaId: schema1, tableId: tEmpresas, recordId: recId, fieldId: fEmp.porte.id, fieldType: fEmp.porte.type, value: e.porte });
      await upsertCell({ schemaId: schema1, tableId: tEmpresas, recordId: recId, fieldId: fEmp.cidade.id, fieldType: fEmp.cidade.type, value: e.cidade });
      await upsertCell({ schemaId: schema1, tableId: tEmpresas, recordId: recId, fieldId: fEmp.uf.id, fieldType: fEmp.uf.type, value: e.uf });
      await upsertCell({ schemaId: schema1, tableId: tEmpresas, recordId: recId, fieldId: fEmp.site.id, fieldType: fEmp.site.type, value: e.site });
      await upsertCell({ schemaId: schema1, tableId: tEmpresas, recordId: recId, fieldId: fEmp.status.id, fieldType: fEmp.status.type, value: e.status });
    }

    const contatos = [
      { title: "Carla Souza", nome: "Carla Souza", email: "carla.souza@alphatech.com.br", telefone: "+55 11 98888-1234", cargo: "Coordenadora de Compras", empresa_cnpj: "12.345.678/0001-90", canal: "Outbound", ativo: true },
      { title: "Rafael Lima", nome: "Rafael Lima", email: "rafael.lima@horizontemetal.com.br", telefone: "+55 47 97777-8899", cargo: "Gerente de Operacoes", empresa_cnpj: "45.789.123/0001-10", canal: "Indicacao", ativo: true },
      { title: "Dra. Marcia Antunes", nome: "Marcia Antunes", email: "marcia@vidamais.com.br", telefone: "+55 31 93333-2211", cargo: "Diretora Clinica", empresa_cnpj: "98.765.432/0001-55", canal: "Inbound", ativo: true },
    ];
    for (const c of contatos) {
      const recId = await createRecord(schema1, tContatos, c.title);
      await upsertCell({ schemaId: schema1, tableId: tContatos, recordId: recId, fieldId: fCon.nome.id, fieldType: fCon.nome.type, value: c.nome });
      await upsertCell({ schemaId: schema1, tableId: tContatos, recordId: recId, fieldId: fCon.email.id, fieldType: fCon.email.type, value: c.email });
      await upsertCell({ schemaId: schema1, tableId: tContatos, recordId: recId, fieldId: fCon.telefone.id, fieldType: fCon.telefone.type, value: c.telefone });
      await upsertCell({ schemaId: schema1, tableId: tContatos, recordId: recId, fieldId: fCon.cargo.id, fieldType: fCon.cargo.type, value: c.cargo });
      await upsertCell({ schemaId: schema1, tableId: tContatos, recordId: recId, fieldId: fCon.empresa_cnpj.id, fieldType: fCon.empresa_cnpj.type, value: c.empresa_cnpj });
      await upsertCell({ schemaId: schema1, tableId: tContatos, recordId: recId, fieldId: fCon.canal.id, fieldType: fCon.canal.type, value: c.canal });
      await upsertCell({ schemaId: schema1, tableId: tContatos, recordId: recId, fieldId: fCon.ativo.id, fieldType: fCon.ativo.type, value: c.ativo });
    }

    const opps = [
      { title: "ERP + CRM (AlphaTech)", empresa_cnpj: "12.345.678/0001-90", valor: 78000, etapa: "Diagnostico", prob: 35, data_prevista: "2026-02-28", origem: "Outbound", responsavel: "Juliana Sales", notas: "Mapear integracoes (NF-e + financeiro). Proposta em 10 dias." },
      { title: "Contrato anual de suporte (Horizonte)", empresa_cnpj: "45.789.123/0001-10", valor: 120000, etapa: "Negociacao", prob: 70, data_prevista: "2026-01-31", origem: "Indicacao", responsavel: "Marcos Pires", notas: "Cliente quer SLA 24x7 e desconto por volume." },
      { title: "Implantacao modulo servicos (VidaMais)", empresa_cnpj: "98.765.432/0001-55", valor: 42000, etapa: "Proposta", prob: 55, data_prevista: "2026-03-15", origem: "Inbound", responsavel: "Aline Rocha", notas: "Decisor: diretoria. Mostrar casos de uso em clinicas." },
    ];
    for (const o of opps) {
      const recId = await createRecord(schema1, tOpps, o.title);
      await upsertCell({ schemaId: schema1, tableId: tOpps, recordId: recId, fieldId: fOpp.empresa_cnpj.id, fieldType: fOpp.empresa_cnpj.type, value: o.empresa_cnpj });
      await upsertCell({ schemaId: schema1, tableId: tOpps, recordId: recId, fieldId: fOpp.valor_estimado_brl.id, fieldType: fOpp.valor_estimado_brl.type, value: o.valor });
      await upsertCell({ schemaId: schema1, tableId: tOpps, recordId: recId, fieldId: fOpp.etapa.id, fieldType: fOpp.etapa.type, value: o.etapa });
      await upsertCell({ schemaId: schema1, tableId: tOpps, recordId: recId, fieldId: fOpp.probabilidade.id, fieldType: fOpp.probabilidade.type, value: o.prob });
      await upsertCell({ schemaId: schema1, tableId: tOpps, recordId: recId, fieldId: fOpp.data_prevista.id, fieldType: fOpp.data_prevista.type, value: o.data_prevista });
      await upsertCell({ schemaId: schema1, tableId: tOpps, recordId: recId, fieldId: fOpp.origem.id, fieldType: fOpp.origem.type, value: o.origem });
      await upsertCell({ schemaId: schema1, tableId: tOpps, recordId: recId, fieldId: fOpp.responsavel.id, fieldType: fOpp.responsavel.type, value: o.responsavel });
      await upsertCell({ schemaId: schema1, tableId: tOpps, recordId: recId, fieldId: fOpp.notas.id, fieldType: fOpp.notas.type, value: o.notas });
    }

    // -------------------------
    // Schema 2: DEMO - Operacoes & Financeiro
    // -------------------------
    const schema2 = await createSchema(
      "DEMO - Operacoes & Financeiro",
      "Contratos, faturas e atendimentos (operacao de servicos)"
    );

    const tContratos = await createTable(schema2, "Contratos", "Controle de contratos de servicos recorrentes");
    const tFaturas = await createTable(schema2, "Faturas", "Cobranca mensal por contrato");
    const tChamados = await createTable(schema2, "Chamados", "Suporte e operacao (tickets)");

    const fCtr = {};
    for (const spec of [
      { name: "Cliente", type: "text", required: true, order: 10 },
      { name: "Plano", type: "select", config: { options: ["Basico", "Profissional", "Enterprise"] }, order: 20 },
      { name: "Valor Mensal (BRL)", type: "number", order: 30 },
      { name: "Inicio", type: "date", order: 40 },
      { name: "Renovacao", type: "date", order: 50 },
      { name: "Ativo", type: "bool", order: 60 },
    ]) {
      fCtr[slugify(spec.name)] = { ...(await createField(schema2, tContratos, spec)), type: spec.type };
    }

    const fFat = {};
    for (const spec of [
      { name: "Contrato", type: "text", required: true, order: 10 },
      { name: "Competencia", type: "text", order: 20 },
      { name: "Vencimento", type: "date", order: 30 },
      { name: "Valor (BRL)", type: "number", order: 40 },
      { name: "Status", type: "select", config: { options: ["Aberta", "Paga", "Atrasada", "Cancelada"] }, order: 50 },
      { name: "Forma de Pagamento", type: "select", config: { options: ["Boleto", "PIX", "Cartao", "Transferencia"] }, order: 60 },
    ]) {
      fFat[slugify(spec.name)] = { ...(await createField(schema2, tFaturas, spec)), type: spec.type };
    }

    const fCha = {};
    for (const spec of [
      { name: "Cliente", type: "text", required: true, order: 10 },
      { name: "Assunto", type: "text", order: 20 },
      { name: "Prioridade", type: "select", config: { options: ["Baixa", "Media", "Alta", "Critica"] }, order: 30 },
      { name: "Status", type: "select", config: { options: ["Novo", "Em andamento", "Aguardando cliente", "Resolvido", "Cancelado"] }, order: 40 },
      { name: "Responsavel", type: "text", order: 50 },
      { name: "Aberto em", type: "date", order: 60 },
      { name: "SLA (h)", type: "number", order: 70 },
    ]) {
      fCha[slugify(spec.name)] = { ...(await createField(schema2, tChamados, spec)), type: spec.type };
    }

    const contratos = [
      { title: "AlphaTech - Profissional", cliente: "AlphaTech", plano: "Profissional", valor: 6500, inicio: "2026-01-05", renovacao: "2027-01-05", ativo: true },
      { title: "Horizonte Metal - Enterprise", cliente: "Horizonte Metal", plano: "Enterprise", valor: 12000, inicio: "2025-10-01", renovacao: "2026-10-01", ativo: true },
      { title: "VidaMais - Basico", cliente: "VidaMais", plano: "Basico", valor: 2900, inicio: "2026-02-01", renovacao: "2027-02-01", ativo: true },
    ];
    for (const c of contratos) {
      const recId = await createRecord(schema2, tContratos, c.title);
      await upsertCell({ schemaId: schema2, tableId: tContratos, recordId: recId, fieldId: fCtr.cliente.id, fieldType: fCtr.cliente.type, value: c.cliente });
      await upsertCell({ schemaId: schema2, tableId: tContratos, recordId: recId, fieldId: fCtr.plano.id, fieldType: fCtr.plano.type, value: c.plano });
      await upsertCell({ schemaId: schema2, tableId: tContratos, recordId: recId, fieldId: fCtr.valor_mensal_brl.id, fieldType: fCtr.valor_mensal_brl.type, value: c.valor });
      await upsertCell({ schemaId: schema2, tableId: tContratos, recordId: recId, fieldId: fCtr.inicio.id, fieldType: fCtr.inicio.type, value: c.inicio });
      await upsertCell({ schemaId: schema2, tableId: tContratos, recordId: recId, fieldId: fCtr.renovacao.id, fieldType: fCtr.renovacao.type, value: c.renovacao });
      await upsertCell({ schemaId: schema2, tableId: tContratos, recordId: recId, fieldId: fCtr.ativo.id, fieldType: fCtr.ativo.type, value: c.ativo });
    }

    const faturas = [
      { title: "AlphaTech - 2026-01", contrato: "AlphaTech - Profissional", competencia: "2026-01", vencimento: "2026-01-10", valor: 6500, status: "Paga", forma: "PIX" },
      { title: "AlphaTech - 2026-02", contrato: "AlphaTech - Profissional", competencia: "2026-02", vencimento: "2026-02-10", valor: 6500, status: "Aberta", forma: "Boleto" },
      { title: "Horizonte - 2026-01", contrato: "Horizonte Metal - Enterprise", competencia: "2026-01", vencimento: "2026-01-05", valor: 12000, status: "Atrasada", forma: "Boleto" },
      { title: "VidaMais - 2026-02", contrato: "VidaMais - Basico", competencia: "2026-02", vencimento: "2026-02-05", valor: 2900, status: "Paga", forma: "Cartao" },
    ];
    for (const f of faturas) {
      const recId = await createRecord(schema2, tFaturas, f.title);
      await upsertCell({ schemaId: schema2, tableId: tFaturas, recordId: recId, fieldId: fFat.contrato.id, fieldType: fFat.contrato.type, value: f.contrato });
      await upsertCell({ schemaId: schema2, tableId: tFaturas, recordId: recId, fieldId: fFat.competencia.id, fieldType: fFat.competencia.type, value: f.competencia });
      await upsertCell({ schemaId: schema2, tableId: tFaturas, recordId: recId, fieldId: fFat.vencimento.id, fieldType: fFat.vencimento.type, value: f.vencimento });
      await upsertCell({ schemaId: schema2, tableId: tFaturas, recordId: recId, fieldId: fFat.valor_brl.id, fieldType: fFat.valor_brl.type, value: f.valor });
      await upsertCell({ schemaId: schema2, tableId: tFaturas, recordId: recId, fieldId: fFat.status.id, fieldType: fFat.status.type, value: f.status });
      await upsertCell({ schemaId: schema2, tableId: tFaturas, recordId: recId, fieldId: fFat.forma_de_pagamento.id, fieldType: fFat.forma_de_pagamento.type, value: f.forma });
    }

    const chamados = [
      { title: "Erro ao emitir boleto", cliente: "Horizonte Metal", assunto: "Boleto nao gerou PDF", prioridade: "Alta", status: "Em andamento", responsavel: "Suporte N1", aberto_em: "2026-01-07", sla: 8 },
      { title: "Treinamento para novos usuarios", cliente: "AlphaTech", assunto: "Onboarding do time financeiro", prioridade: "Media", status: "Aguardando cliente", responsavel: "CS", aberto_em: "2026-02-03", sla: 48 },
      { title: "Ajuste de permissao", cliente: "VidaMais", assunto: "Usuario sem acesso ao CRM", prioridade: "Baixa", status: "Resolvido", responsavel: "Suporte N2", aberto_em: "2026-03-01", sla: 24 },
    ];
    for (const ch of chamados) {
      const recId = await createRecord(schema2, tChamados, ch.title);
      await upsertCell({ schemaId: schema2, tableId: tChamados, recordId: recId, fieldId: fCha.cliente.id, fieldType: fCha.cliente.type, value: ch.cliente });
      await upsertCell({ schemaId: schema2, tableId: tChamados, recordId: recId, fieldId: fCha.assunto.id, fieldType: fCha.assunto.type, value: ch.assunto });
      await upsertCell({ schemaId: schema2, tableId: tChamados, recordId: recId, fieldId: fCha.prioridade.id, fieldType: fCha.prioridade.type, value: ch.prioridade });
      await upsertCell({ schemaId: schema2, tableId: tChamados, recordId: recId, fieldId: fCha.status.id, fieldType: fCha.status.type, value: ch.status });
      await upsertCell({ schemaId: schema2, tableId: tChamados, recordId: recId, fieldId: fCha.responsavel.id, fieldType: fCha.responsavel.type, value: ch.responsavel });
      await upsertCell({ schemaId: schema2, tableId: tChamados, recordId: recId, fieldId: fCha.aberto_em.id, fieldType: fCha.aberto_em.type, value: ch.aberto_em });
      await upsertCell({ schemaId: schema2, tableId: tChamados, recordId: recId, fieldId: fCha.sla_h.id, fieldType: fCha.sla_h.type, value: ch.sla });
    }

    const counts = await client.query(
      `
      select
        (select count(*)::int from airtable."schema" where tenant_id=$1 and name like 'DEMO - %') as schemas,
        (select count(*)::int from airtable."table" where tenant_id=$1 and schema_id in (select id from airtable."schema" where tenant_id=$1 and name like 'DEMO - %')) as tables,
        (select count(*)::int from airtable."field" where tenant_id=$1 and schema_id in (select id from airtable."schema" where tenant_id=$1 and name like 'DEMO - %')) as fields,
        (select count(*)::int from airtable."record" where tenant_id=$1 and schema_id in (select id from airtable."schema" where tenant_id=$1 and name like 'DEMO - %')) as records,
        (select count(*)::int from airtable."cell" where tenant_id=$1 and schema_id in (select id from airtable."schema" where tenant_id=$1 and name like 'DEMO - %')) as cells
      `,
      [tenantId]
    );

    await client.query("COMMIT");
    console.log(JSON.stringify({ ok: true, tenantId, counts: counts.rows[0] }, null, 2));
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error(e instanceof Error ? e.message : String(e));
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

main();

