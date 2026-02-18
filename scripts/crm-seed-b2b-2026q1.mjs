#!/usr/bin/env node

import { Client } from "pg";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

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

// Deterministic PRNG (LCG) so the seed is reproducible.
function makeRng(seed = 20260213) {
  let state = seed >>> 0;
  return {
    next() {
      state = (1664525 * state + 1013904223) >>> 0;
      return state / 2 ** 32;
    },
    int(min, max) {
      // inclusive min/max
      return Math.floor(this.next() * (max - min + 1)) + min;
    },
    pick(arr) {
      return arr[this.int(0, arr.length - 1)];
    },
    chance(p) {
      return this.next() < p;
    },
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(this.next() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
  };
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

function fmtDate(d) {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

function fmtTs(d) {
  // timestamp without time zone (use a stable UTC representation)
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())} ${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}`;
}

function addDaysUtc(d, days) {
  const out = new Date(d.getTime());
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}

function clampDate(d, min, max) {
  const t = d.getTime();
  return new Date(Math.max(min.getTime(), Math.min(max.getTime(), t)));
}

function randomDateBetween(rng, start, end) {
  const t = start.getTime() + Math.floor(rng.next() * (end.getTime() - start.getTime() + 1));
  return new Date(t);
}

function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

function phoneBR(rng, ddd) {
  const n1 = rng.int(90000, 99999);
  const n2 = rng.int(1000, 9999);
  return `(${ddd}) ${n1}-${pad2(Math.floor(n2 / 100))}${pad2(n2 % 100)}`; // readable, not strict
}

function emailFor(name, domain) {
  const base = slugify(name).replace(/-/g, ".");
  const user = base.length ? base : "contato";
  return `${user}@${domain}`;
}

async function main() {
  loadEnvFiles();

  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.error("SUPABASE_DB_URL ausente (adicione em .env.local).");
    process.exit(1);
  }

  const tenantId = 1;
  const rng = makeRng(20260331);

  // Requested window: Feb 1 to Mar 31, 2026
  const START = new Date(Date.UTC(2026, 1, 1, 12, 0, 0)); // 2026-02-01 12:00 UTC
  const END = new Date(Date.UTC(2026, 2, 31, 20, 0, 0)); // 2026-03-31 20:00 UTC

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    await client.query("BEGIN");

    // Hard reset crm data (requested: generate a clean, coherent dataset)
    const tablesRes = await client.query(
      `
      select table_name
      from information_schema.tables
      where table_schema = 'crm' and table_type='BASE TABLE'
      order by table_name
    `
    );
    const tables = tablesRes.rows.map((r) => r.table_name).filter(Boolean);
    if (tables.length) {
      const qualified = tables.map((t) => `crm."${String(t).replaceAll('"', '""')}"`).join(", ");
      await client.query(`TRUNCATE TABLE ${qualified} RESTART IDENTITY CASCADE`);
    }

    // Pick 6 real sellers from comercial.vendedores + entidades.funcionarios
    const vendRes = await client.query(
      `
      select v.id, v.territorio_id, f.nome
      from comercial.vendedores v
      join entidades.funcionarios f
        on f.id = v.funcionario_id and f.tenant_id = v.tenant_id
      where v.tenant_id = $1 and coalesce(v.ativo,true) = true
      order by v.id asc
      limit 6
    `,
      [tenantId]
    );
    if (vendRes.rowCount < 1) throw new Error("Nenhum vendedor ativo encontrado em comercial.vendedores (tenant 1).");
    const vendedores = vendRes.rows.map((r) => ({
      id: Number(r.id),
      territorio_id: r.territorio_id ? Number(r.territorio_id) : null,
      nome: String(r.nome),
    }));

    // Clients (optional link on won opportunities for UI)
    const cliRes = await client.query(
      `
      select id, nome_fantasia
      from entidades.clientes
      where tenant_id = $1
      order by id asc
    `,
      [tenantId]
    );
    const clientes = cliRes.rows.map((r) => ({ id: Number(r.id), nome_fantasia: String(r.nome_fantasia || "") }));

    // 1) Lookups
    const sysTs = fmtTs(START);

    const pipelines = [
      { nome: "Pipeline B2B", descricao: "Servicos B2B (projeto/contrato)" },
      { nome: "Pipeline Inside Sales", descricao: "Inside Sales (ciclo curto)" },
    ];
    const pipelineIds = new Map();
    for (const p of pipelines) {
      const r = await client.query(
        `insert into crm.pipelines (tenant_id, nome, descricao, ativo, criado_em, atualizado_em)
         values ($1,$2,$3,true,$4,$4)
         returning id`,
        [tenantId, p.nome, p.descricao, sysTs]
      );
      pipelineIds.set(p.nome, Number(r.rows[0].id));
    }

    const fases = [
      // B2B
      { pipeline: "Pipeline B2B", nome: "Contato Inicial", ordem: 1, prob: 10 },
      { pipeline: "Pipeline B2B", nome: "Diagnostico", ordem: 2, prob: 25 },
      { pipeline: "Pipeline B2B", nome: "Proposta Enviada", ordem: 3, prob: 50 },
      { pipeline: "Pipeline B2B", nome: "Negociacao", ordem: 4, prob: 75 },
      { pipeline: "Pipeline B2B", nome: "Fechado", ordem: 5, prob: 100 },
      // Inside
      { pipeline: "Pipeline Inside Sales", nome: "Qualificacao", ordem: 1, prob: 15 },
      { pipeline: "Pipeline Inside Sales", nome: "Apresentacao", ordem: 2, prob: 35 },
      { pipeline: "Pipeline Inside Sales", nome: "Proposta", ordem: 3, prob: 60 },
      { pipeline: "Pipeline Inside Sales", nome: "Fechamento", ordem: 4, prob: 90 },
    ];
    const faseIds = [];
    for (const f of fases) {
      const r = await client.query(
        `insert into crm.fases_pipeline (tenant_id, pipeline_id, nome, ordem, probabilidade_padrao, ativo, criado_em, atualizado_em)
         values ($1,$2,$3,$4,$5,true,$6,$6)
         returning id`,
        [tenantId, pipelineIds.get(f.pipeline), f.nome, f.ordem, f.prob, sysTs]
      );
      faseIds.push({ id: Number(r.rows[0].id), ...f });
    }

    const origens = [
      "Google Ads",
      "Meta Ads",
      "LinkedIn Ads",
      "Organico (SEO)",
      "Indicacao",
      "WhatsApp",
      "Evento",
      "Outbound",
      "Parceiro",
      "Email",
      "Site (form)",
      "Reativacao",
    ];
    const origemIdByNome = new Map();
    for (const nome of origens) {
      const r = await client.query(
        `insert into crm.origens_lead (tenant_id, nome, descricao, ativo, criado_em, atualizado_em)
         values ($1,$2,null,true,$3,$3)
         returning id`,
        [tenantId, nome, sysTs]
      );
      origemIdByNome.set(nome, Number(r.rows[0].id));
    }

    const motivosPerda = [
      "Preco",
      "Sem orcamento",
      "Timing",
      "Concorrente",
      "Sem fit",
      "Decisor indisponivel",
      "Sem retorno",
      "Prioridade mudou",
      "Interno (erro)",
      "Contrato atual vigente",
    ];
    const motivoPerdaIdByNome = new Map();
    for (const nome of motivosPerda) {
      const r = await client.query(
        `insert into crm.motivos_perda (tenant_id, nome, descricao, ativo, criado_em, atualizado_em)
         values ($1,$2,null,true,$3,$3)
         returning id`,
        [tenantId, nome, sysTs]
      );
      motivoPerdaIdByNome.set(nome, Number(r.rows[0].id));
    }

    // 2) Accounts and contacts
    const ddds = [
      { uf: "SP", city: "Sao Paulo", ddd: "11" },
      { uf: "SP", city: "Campinas", ddd: "19" },
      { uf: "SP", city: "Santos", ddd: "13" },
      { uf: "RJ", city: "Rio de Janeiro", ddd: "21" },
      { uf: "MG", city: "Belo Horizonte", ddd: "31" },
      { uf: "PR", city: "Curitiba", ddd: "41" },
      { uf: "SC", city: "Florianopolis", ddd: "48" },
      { uf: "RS", city: "Porto Alegre", ddd: "51" },
      { uf: "BA", city: "Salvador", ddd: "71" },
      { uf: "PE", city: "Recife", ddd: "81" },
      { uf: "GO", city: "Goiania", ddd: "62" },
      { uf: "DF", city: "Brasilia", ddd: "61" },
    ];

    const setores = [
      "Industria leve",
      "Logistica",
      "Construcao",
      "Saude",
      "Educacao",
      "Varejo",
      "Servicos profissionais",
    ];

    const companyN1 = ["Alfa", "Horizonte", "Prime", "Atlas", "Norte", "Sul", "Triunfo", "Omega", "Verde", "Ponto", "Nova", "Sigma"];
    const companyN2 = ["Servicos", "Manutencao", "Facilities", "Engenharia", "Tecnologia", "Consultoria", "Operacoes", "Industrial", "Predial", "Seguranca"];
    const companyN3 = ["LTDA", "ME", "EIRELI", "S/A"];

    const firstNames = [
      "Joao",
      "Maria",
      "Ana",
      "Carlos",
      "Fernanda",
      "Marcos",
      "Patricia",
      "Camila",
      "Rafael",
      "Juliana",
      "Bruno",
      "Leticia",
      "Felipe",
      "Mariana",
      "Diego",
      "Renata",
      "Paulo",
      "Beatriz",
      "Rodrigo",
      "Aline",
    ];
    const lastNames = [
      "Silva",
      "Souza",
      "Oliveira",
      "Santos",
      "Pereira",
      "Almeida",
      "Costa",
      "Rodrigues",
      "Ferreira",
      "Gomes",
      "Ribeiro",
      "Carvalho",
      "Araujo",
      "Moura",
      "Barbosa",
      "Lima",
      "Cardoso",
      "Teixeira",
      "Vieira",
      "Batista",
    ];
    const cargos = ["Diretor", "Gerente de Operacoes", "Compras", "Financeiro", "TI", "RH", "Coordenador", "Supervisor"];

    const contaByNome = new Map();
    const contas = [];
    const contatos = [];

    const contasCount = 80;
    for (let i = 0; i < contasCount; i++) {
      const loc = rng.pick(ddds);
      const vendedor = rng.pick(vendedores);
      const setor = rng.pick(setores);
      const nome =
        `${rng.pick(companyN1)} ${rng.pick(companyN2)} ${loc.uf} ${rng.pick(companyN3)}`
          .replace(/\s+/g, " ")
          .trim();
      const domain = `${slugify(nome)}.com.br`;
      const site = rng.chance(0.85) ? `https://www.${domain}` : null;
      const telefone = phoneBR(rng, loc.ddd);
      const end = `${loc.city}/${loc.uf} - ${rng.pick(["Centro", "Jardins", "Vila Nova", "Industrial", "Zona Sul", "Zona Norte"])}, ${rng.pick(["Av.", "Rua"])} ${rng.pick(["Paulista", "Brasil", "das Nacoes", "Santo Antonio", "Independencia", "Getulio Vargas"])} ${rng.int(50, 2500)}`;
      const criadoEm = randomDateBetween(rng, START, addDaysUtc(END, -10));

      const r = await client.query(
        `insert into crm.contas
          (tenant_id, nome, setor, site, telefone, endereco_cobranca, responsavel_id, criado_em, atualizado_em)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$8)
         returning id`,
        [tenantId, nome, setor, site, telefone, end, vendedor.id, fmtTs(criadoEm)]
      );
      const contaId = Number(r.rows[0].id);
      contaByNome.set(nome.toLowerCase(), { id: contaId, domain, vendedor_id: vendedor.id });
      contas.push({ id: contaId, nome, domain, vendedor_id: vendedor.id, criado_em: criadoEm });

      const nContatos = rng.int(1, 3);
      for (let k = 0; k < nContatos; k++) {
        const fn = rng.pick(firstNames);
        const ln = rng.pick(lastNames);
        const contatoNome = `${fn} ${ln}`;
        const cargo = rng.pick(cargos);
        const email = rng.chance(0.25)
          ? `${rng.pick(["contato", "compras", "financeiro", "rh", "ti"])}@${domain}`
          : emailFor(contatoNome, domain);
        const tel = phoneBR(rng, loc.ddd);
        const cCriado = clampDate(addDaysUtc(criadoEm, rng.int(0, 10)), START, END);
        const rc = await client.query(
          `insert into crm.contatos
            (tenant_id, conta_id, nome, cargo, email, telefone, responsavel_id, criado_em, atualizado_em)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$8)
           returning id`,
          [tenantId, contaId, contatoNome, cargo, email, tel, vendedor.id, fmtTs(cCriado)]
        );
        const contatoId = Number(rc.rows[0].id);
        contatos.push({ id: contatoId, conta_id: contaId, nome: contatoNome, email, vendedor_id: vendedor.id, criado_em: cCriado });
      }
    }

    // 3) Leads
    const leadStatuses = [
      { status: "novo", w: 45 },
      { status: "qualificado", w: 40 },
      { status: "descartado", w: 15 },
    ];
    const weightedPick = (arr) => {
      const sum = arr.reduce((a, x) => a + x.w, 0);
      let r = rng.int(1, sum);
      for (const x of arr) {
        r -= x.w;
        if (r <= 0) return x;
      }
      return arr[arr.length - 1];
    };

    const leadTags = ["alto_potencial", "recorrencia", "urgente", "multiunidades", "sazonal", "sem_orcamento", "concorrencia"];

    const leads = [];
    const leadsCount = 300;
    for (let i = 0; i < leadsCount; i++) {
      const vendedor = rng.pick(vendedores);
      const loc = rng.pick(ddds);
      const fn = rng.pick(firstNames);
      const ln = rng.pick(lastNames);
      const nome = `${fn} ${ln}`;
      const status = weightedPick(leadStatuses).status;
      const origemNome = rng.pick(origens);
      const origem_id = origemIdByNome.get(origemNome);
      const empresaHint = rng.chance(0.55) ? rng.pick(contas).nome : `${rng.pick(companyN1)} ${rng.pick(companyN2)} ${loc.uf} ${rng.pick(companyN3)}`;
      const domain = `${slugify(empresaHint)}.com.br`;
      const email = emailFor(nome, domain);
      const telefone = phoneBR(rng, loc.ddd);
      const criadoEm = randomDateBetween(rng, START, END);
      const tag = rng.chance(0.35) ? rng.pick(leadTags) : null;
      const desc = rng.chance(0.6)
        ? rng.pick([
            "Solicitou proposta via site. Quer retorno ainda esta semana.",
            "Indicado por parceiro. Interesse em contrato mensal.",
            "Precisa terceirizar manutencao predial. Avaliando 3 fornecedores.",
            "Quer reduzir custo operacional sem perder SLA.",
            "Demanda urgente por adequacao e laudo.",
          ])
        : null;

      const r = await client.query(
        `insert into crm.leads
          (tenant_id, nome, empresa, email, telefone, origem_id, responsavel_id, status, tag, descricao, criado_em, atualizado_em)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$11)
         returning id`,
        [tenantId, nome, empresaHint, email, telefone, origem_id, vendedor.id, status, tag, desc, fmtTs(criadoEm)]
      );
      const leadId = Number(r.rows[0].id);
      leads.push({ id: leadId, nome, empresa: empresaHint, email, vendedor_id: vendedor.id, status, criado_em: criadoEm });
    }

    // 4) Conversions + Opportunities
    const qualificados = leads.filter((l) => l.status === "qualificado");
    const convertCount = Math.min(120, Math.floor(qualificados.length * 0.75));
    const convertLeads = rng.shuffle(qualificados).slice(0, convertCount);

    const oportunidades = [];

    const stagePlan = [
      // distribucao de fase (aprox)
      { nome: "Contato Inicial", w: 25 },
      { nome: "Diagnostico", w: 35 },
      { nome: "Proposta Enviada", w: 25 },
      { nome: "Negociacao", w: 10 },
      { nome: "Fechado", w: 5 },
      { nome: "Qualificacao", w: 10 },
      { nome: "Apresentacao", w: 15 },
      { nome: "Proposta", w: 20 },
      { nome: "Fechamento", w: 5 },
    ];
    const stagePick = () => weightedPick(stagePlan).nome;

    const tickets = () => {
      // lognormal-ish distribution in BRL
      const base = Math.exp((rng.next() * 1.2) + 8.6); // ~ 5k .. 60k
      const out = Math.min(180000, Math.max(3000, Math.round(base / 100) * 100));
      return out;
    };

    for (const lead of convertLeads) {
      const vendedor = vendedores.find((v) => v.id === lead.vendedor_id) || rng.pick(vendedores);
      const createdOpp = clampDate(addDaysUtc(lead.criado_em, rng.int(1, 18)), START, END);
      const dataPrev = clampDate(addDaysUtc(createdOpp, rng.int(3, 25)), START, END);

      // Link to an existing conta about 70% of the time, else create a new one quickly.
      let contaId = null;
      let contatoId = null;

      const matchedConta = contas.find((c) => c.nome.toLowerCase() === String(lead.empresa || "").toLowerCase());
      if (matchedConta && rng.chance(0.7)) {
        contaId = matchedConta.id;
        const possiveisContatos = contatos.filter((c) => c.conta_id === contaId);
        contatoId = possiveisContatos.length ? rng.pick(possiveisContatos).id : null;
      } else {
        // create a new conta + contato derived from lead
        const loc = rng.pick(ddds);
        const nomeConta = String(lead.empresa || "").trim() || `${rng.pick(companyN1)} ${rng.pick(companyN2)} ${loc.uf} ${rng.pick(companyN3)}`;
        const domain = `${slugify(nomeConta)}.com.br`;
        const site = rng.chance(0.75) ? `https://www.${domain}` : null;
        const tel = phoneBR(rng, loc.ddd);
        const end = `${loc.city}/${loc.uf} - ${rng.pick(["Centro", "Industrial", "Vila Nova"])}, ${rng.pick(["Rua", "Av."])} ${rng.pick(["Brasil", "das Flores", "dos Bandeirantes", "Santo Antonio"])} ${rng.int(10, 2200)}`;
        const setor = rng.pick(setores);

        const rc = await client.query(
          `insert into crm.contas
            (tenant_id, nome, setor, site, telefone, endereco_cobranca, responsavel_id, criado_em, atualizado_em)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$8)
           returning id`,
          [tenantId, nomeConta, setor, site, tel, end, vendedor.id, fmtTs(createdOpp)]
        );
        contaId = Number(rc.rows[0].id);
        contas.push({ id: contaId, nome: nomeConta, domain, vendedor_id: vendedor.id, criado_em: createdOpp });

        const rct = await client.query(
          `insert into crm.contatos
            (tenant_id, conta_id, nome, cargo, email, telefone, responsavel_id, criado_em, atualizado_em)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$8)
           returning id`,
          [
            tenantId,
            contaId,
            lead.nome,
            rng.pick(["Compras", "Gerente de Operacoes", "Diretor"]),
            lead.email,
            phoneBR(rng, loc.ddd),
            vendedor.id,
            fmtTs(createdOpp),
          ]
        );
        contatoId = Number(rct.rows[0].id);
        contatos.push({ id: contatoId, conta_id: contaId, nome: lead.nome, email: lead.email, vendedor_id: vendedor.id, criado_em: createdOpp });
      }

      const stage = stagePick();
      const fase = faseIds.find((f) => f.nome === stage) || faseIds[0];

      const valor = tickets();
      const prob = Math.max(0, Math.min(100, (fase.prob ?? 30) + rng.int(-10, 10)));

      let status = "aberta";
      let motivo_perda_id = null;
      let data_fechamento = null;
      let cliente_id = null;

      if (stage === "Fechado" || stage === "Fechamento") {
        status = rng.chance(0.65) ? "ganha" : "perdido";
        data_fechamento = fmtDate(clampDate(addDaysUtc(createdOpp, rng.int(7, 30)), START, END));
        if (status === "perdido") {
          motivo_perda_id = rng.pick(Array.from(motivoPerdaIdByNome.values()));
        } else if (clientes.length && rng.chance(0.7)) {
          cliente_id = rng.pick(clientes).id;
        }
      } else if (rng.chance(0.10)) {
        // some deals are lost before closing
        status = "perdido";
        motivo_perda_id = rng.pick(Array.from(motivoPerdaIdByNome.values()));
        data_fechamento = fmtDate(clampDate(addDaysUtc(createdOpp, rng.int(5, 25)), START, END));
      }

      const oppNome = `Contrato de Servicos - ${contaId ? (contas.find((c) => c.id === contaId)?.nome || "Conta") : "Conta"} (${stage})`;
      const desc = rng.pick([
        "Escopo: manutencao preventiva + corretiva com SLA. Proposta mensal.",
        "Escopo: facilities e operacao (limpeza + manutencao). Avaliacao tecnica.",
        "Escopo: consultoria e adequacao. Entrega em 30 dias.",
        "Escopo: suporte e atendimento 12x5. Contrato trimestral.",
      ]);

      const ro = await client.query(
        `insert into crm.oportunidades
          (tenant_id, nome, lead_id, conta_id, cliente_id, vendedor_id, territorio_id, fase_pipeline_id,
           valor_estimado, probabilidade, data_prevista, data_fechamento, status, motivo_perda_id, descricao, criado_em, atualizado_em)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$16)
         returning id`,
        [
          tenantId,
          oppNome,
          lead.id,
          contaId,
          cliente_id,
          vendedor.id,
          vendedor.territorio_id,
          fase.id,
          valor,
          prob,
          fmtDate(dataPrev),
          data_fechamento,
          status,
          motivo_perda_id,
          desc,
          fmtTs(createdOpp),
        ]
      );
      const oppId = Number(ro.rows[0].id);
      oportunidades.push({
        id: oppId,
        lead_id: lead.id,
        conta_id: contaId,
        contato_id: contatoId,
        vendedor_id: vendedor.id,
        fase_nome: stage,
        status,
        criado_em: createdOpp,
      });

      // Update lead conversion pointers
      await client.query(
        `update crm.leads
         set conta_id = $1, contato_id = $2, oportunidade_id = $3, convertido_em = $4, atualizado_em = $4
         where tenant_id = $5 and id = $6`,
        [contaId, contatoId, oppId, fmtTs(createdOpp), tenantId, lead.id]
      );
    }

    // Add additional opportunities not tied to converted leads (outbound/account-based)
    const extraOppCount = 30;
    for (let i = 0; i < extraOppCount; i++) {
      const vendedor = rng.pick(vendedores);
      const conta = rng.pick(contas);
      const createdOpp = randomDateBetween(rng, START, END);
      const dataPrev = clampDate(addDaysUtc(createdOpp, rng.int(5, 28)), START, END);
      const stage = rng.pick(["Contato Inicial", "Diagnostico", "Proposta Enviada", "Negociacao"]);
      const fase = faseIds.find((f) => f.nome === stage) || faseIds[0];
      const valor = tickets();
      const prob = Math.max(0, Math.min(100, (fase.prob ?? 30) + rng.int(-10, 10)));
      const contato = contatos.filter((c) => c.conta_id === conta.id);
      const contatoId = contato.length ? rng.pick(contato).id : null;

      const ro = await client.query(
        `insert into crm.oportunidades
          (tenant_id, nome, lead_id, conta_id, cliente_id, vendedor_id, territorio_id, fase_pipeline_id,
           valor_estimado, probabilidade, data_prevista, data_fechamento, status, motivo_perda_id, descricao, criado_em, atualizado_em)
         values ($1,$2,null,$3,null,$4,$5,$6,$7,$8,$9,null,'aberta',null,$10,$11,$11)
         returning id`,
        [
          tenantId,
          `Expansao/Upgrade - ${conta.nome} (${stage})`,
          conta.id,
          vendedor.id,
          vendedor.territorio_id,
          fase.id,
          valor,
          prob,
          fmtDate(dataPrev),
          rng.pick([
            "Conta atual com oportunidade de expandir escopo.",
            "Renovacao contratual com reajuste e novos servicos.",
            "Upgrade de SLA e aumento de cobertura.",
          ]),
          fmtTs(createdOpp),
        ]
      );
      const oppId = Number(ro.rows[0].id);
      oportunidades.push({
        id: oppId,
        lead_id: null,
        conta_id: conta.id,
        contato_id: contatoId,
        vendedor_id: vendedor.id,
        fase_nome: stage,
        status: "aberta",
        criado_em: createdOpp,
      });
    }

    // 5) Activities
    const activityTypes = ["ligacao", "reuniao", "email", "followup", "visita"];
    const activitySubjects = [
      "Alinhar escopo e SLA",
      "Reuniao de diagnostico",
      "Follow-up da proposta",
      "Coletar dados tecnicos",
      "Negociar condicoes comerciais",
      "Validar decisor e processo de compras",
      "Apresentacao institucional",
      "Revisar cronograma e inicio",
    ];

    const atividadesCountTarget = 600;
    let atividadesCriadas = 0;
    while (atividadesCriadas < atividadesCountTarget) {
      const isOpp = rng.chance(0.8) && oportunidades.length > 0;
      const refOpp = isOpp ? rng.pick(oportunidades) : null;
      const vendedor = refOpp ? vendedores.find((v) => v.id === refOpp.vendedor_id) || rng.pick(vendedores) : rng.pick(vendedores);
      const baseDate = refOpp ? refOpp.criado_em : randomDateBetween(rng, START, END);
      const prevista = clampDate(addDaysUtc(baseDate, rng.int(0, 20)), START, END);
      const tipo = rng.pick(activityTypes);
      const assunto = rng.pick(activitySubjects);
      const concluida = rng.chance(0.45);
      const dataConclusao = concluida ? fmtTs(clampDate(addDaysUtc(prevista, rng.int(0, 3)), START, END)) : null;
      const status = concluida ? "concluida" : "pendente";

      await client.query(
        `insert into crm.atividades
          (tenant_id, conta_id, contato_id, lead_id, oportunidade_id, tipo, descricao, data_prevista, data_conclusao, status, responsavel_id, assunto, anotacoes, criado_em, atualizado_em)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$14)`,
        [
          tenantId,
          refOpp ? refOpp.conta_id : null,
          refOpp ? refOpp.contato_id : null,
          refOpp ? refOpp.lead_id : null,
          refOpp ? refOpp.id : null,
          tipo,
          assunto,
          fmtTs(prevista),
          dataConclusao,
          status,
          vendedor.id,
          assunto,
          rng.chance(0.6)
            ? rng.pick([
                "Cliente pediu ajuste de escopo.",
                "Aguardando retorno do decisor.",
                "Enviar proposta revisada ainda hoje.",
                "Mapear concorrentes e prazo de contrato atual.",
                "Confirmar visita tecnica.",
              ])
            : null,
          fmtTs(clampDate(addDaysUtc(prevista, rng.int(-2, 0)), START, END)),
        ]
      );

      atividadesCriadas += 1;
    }

    // 6) Interactions
    const canais = ["whatsapp", "email", "ligacao", "nota", "reuniao"];
    const interactionSnippets = [
      "Enviado resumo do escopo e proximos passos.",
      "Cliente confirmou reuniao para alinhamento.",
      "Sem retorno. Reforcar contato amanha.",
      "Proposta enviada. Aguardando feedback do financeiro.",
      "Solicitou ajuste de prazo e forma de pagamento.",
      "Concorrente entrou com desconto. Reavaliar condicoes.",
      "Decisor pediu case e referencias.",
      "Agendada visita tecnica.",
      "Cliente pediu minuta de contrato.",
      "Negociacao em andamento. Retornar com contraproposta.",
    ];

    const interacoesCount = 900;
    for (let i = 0; i < interacoesCount; i++) {
      const refOpp = rng.chance(0.75) && oportunidades.length ? rng.pick(oportunidades) : null;
      const vendedor = refOpp ? vendedores.find((v) => v.id === refOpp.vendedor_id) || rng.pick(vendedores) : rng.pick(vendedores);
      const baseDate = refOpp ? refOpp.criado_em : randomDateBetween(rng, START, END);
      const when = clampDate(addDaysUtc(baseDate, rng.int(0, 30)), START, END);
      const canal = rng.pick(canais);
      const conteudo = rng.pick(interactionSnippets);

      await client.query(
        `insert into crm.interacoes
          (tenant_id, conta_id, contato_id, lead_id, oportunidade_id, canal, conteudo, data_interacao, responsavel_id, criado_em, atualizado_em)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10)`,
        [
          tenantId,
          refOpp ? refOpp.conta_id : null,
          refOpp ? refOpp.contato_id : null,
          refOpp ? refOpp.lead_id : null,
          refOpp ? refOpp.id : null,
          canal,
          conteudo,
          fmtTs(when),
          vendedor.id,
          fmtTs(when),
        ]
      );
    }

    // Sanity checks (date window)
    // Compare in SQL to avoid timezone ambiguity with "timestamp without time zone".
    const startTs = fmtTs(START);
    const endTs = fmtTs(END);
    const chk = await client.query(
      `
      select
        coalesce((select min(criado_em) < $2::timestamp from crm.leads where tenant_id=$1), false) as leads_before,
        coalesce((select max(criado_em) > $3::timestamp from crm.leads where tenant_id=$1), false) as leads_after,
        coalesce((select min(criado_em) < $2::timestamp from crm.oportunidades where tenant_id=$1), false) as opps_before,
        coalesce((select max(criado_em) > $3::timestamp from crm.oportunidades where tenant_id=$1), false) as opps_after
    `,
      [tenantId, startTs, endTs]
    );
    const row = chk.rows[0] || {};
    if (row.leads_before || row.leads_after || row.opps_before || row.opps_after) {
      throw new Error("Seed gerou datas fora da janela 2026-02..2026-03.");
    }

    await client.query("COMMIT");
    console.log("CRM seed B2B (2026-02..2026-03) aplicado com sucesso.");
    console.log(`Vendedores usados: ${vendedores.map((v) => `${v.id}:${v.nome}`).join(", ")}`);
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
