import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { mkdirSync, writeFileSync } from "node:fs";
import { config as loadEnv } from "dotenv";
import { connection } from "./erp/evolution-db.mjs";
import { closePool } from "../src/lib/postgres";
import {
  handlePluginRequest,
  type HttpDependencies,
} from "../src/products/chatgptplugin/mcp/handleRequest";
import { executionDependencies } from "../src/products/chatgptplugin/application/executeTool";
import { closePluginDatabase } from "../src/products/chatgptplugin/shared/database";
import { loadPluginPrincipal } from "../src/products/chatgptplugin/auth/resolvePrincipal";
import { consumeRequestLimit } from "../src/products/chatgptplugin/audit/executionRepository";
import {
  PluginError,
  type PluginPrincipal,
} from "../src/products/chatgptplugin/shared/contracts";
import {
  approvalRequest,
  approvalDependencies,
} from "../src/products/chatgptplugin/approvals/http";
import type { PluginConfig } from "../src/products/chatgptplugin/shared/config";
import type { ErpAccessContext } from "../src/products/erp/server/erpAccess";
import { dashboardToday } from "../src/products/erp/shared/dashboardContracts";

// Human-authorized test of actual HTTP/MCP/approval/ERP code on the real database.
// External authentication and the review decision are fixtures only in this
// loopback server. No production auth configuration is modified.
loadEnv({ path: ".env.local", quiet: true });
const db = connection();
const companyId = 2,
  userId = 3,
  runId = randomUUID(),
  marker = "TESTE-MCP-" + runId.slice(0, 8);
const clientId = "mcp-crud-test-" + runId;
const directory = ".cache/chatgptplugin-crud/" + runId;
mkdirSync(directory, { recursive: true });
const token = randomBytes(32).toString("hex"),
  readToken = randomBytes(32).toString("hex"),
  restrictedToken = randomBytes(32).toString("hex");
type Kind =
  | "cliente"
  | "fornecedor"
  | "conta_pagar"
  | "conta_receber"
  | "venda"
  | "compra";
type Created = { kind: Kind; id: number; draft: string; deleted: boolean };
type DraftResult = {
  rascunho_id: string;
  status: string;
  empresa_id: number;
  registro_id: number;
};
// Projection of response fields inspected by the scenarios below. Assertions
// verify the returned values for the requested tool before accepting a check.
type ToolResult = DraftResult & {
  usuario_id: number;
  empresa_selecionada: number;
  total: number;
  records: { id: number; conta_id: number }[];
  record: Record<string, unknown>;
  installments: Record<string, unknown>[];
  items: Record<string, unknown>[];
  sale: Record<string, unknown>;
  purchase: Record<string, unknown>;
};
type AuditRow = {
  tool_name: string;
  status: string;
  user_id: string;
  empresa_id: string;
};
type DraftRow = {
  id: string;
  status: string;
  user_id: string;
  empresa_id: string;
};
const created: Created[] = [];
const checks: {
  name: string;
  status: string;
  elapsedMs: number;
  message?: string;
}[] = [];
const report = {
  status: "running",
  runId,
  marker,
  companyId,
  userId,
  authentication:
    "Loopback fixture; principal and permissions loaded from real shared membership",
  oauthVerified: false,
  approvals:
    "Explicitly authorized test decisions through real approval HTTP/repository",
  checks,
  limitations: [] as string[],
  created,
  mcpCalls: 0,
  approvalCalls: 0,
  tools: [] as string[],
  originalRowsUnchanged: false,
  activeTestRecords: null as number | null,
};
let principal: PluginPrincipal,
  session: ErpAccessContext,
  settings: PluginConfig,
  deps: HttpDependencies;
let server: ReturnType<typeof createServer> | undefined,
  connected = false,
  seq = 0,
  minute = 0,
  count = 0;
let baseline:
  | Record<string, { id: string; empresa_id: number; hash: string }[]>
  | undefined;
const calledTools = new Set<string>();
const tableFor: Record<Kind, string> = {
  cliente: "entidades",
  fornecedor: "entidades",
  conta_pagar: "contas_pagar",
  conta_receber: "contas_receber",
  venda: "vendas",
  compra: "compras",
};
function saveReport() {
  report.tools = [...calledTools];
  writeFileSync(directory + "/report.json", JSON.stringify(report, null, 2));
  writeFileSync(
    ".cache/chatgptplugin-crud/latest.json",
    JSON.stringify({ runId, directory, status: report.status }, null, 2),
  );
}
async function check(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    checks.push({ name, status: "passed", elapsedMs: Date.now() - start });
    console.log("PASS " + name);
    saveReport();
  } catch (error) {
    checks.push({
      name,
      status: "failed",
      elapsedMs: Date.now() - start,
      message: String((error as Error).message).slice(0, 600),
    });
    console.log(
      "FAIL " + name + ": " + String((error as Error).message).slice(0, 400),
    );
    saveReport();
    throw error;
  }
}
async function pace() {
  const current = Math.floor(Date.now() / 60000);
  if (current !== minute) {
    minute = current;
    count = 0;
  }
  if (count >= 44) {
    console.log("Aguardando a próxima janela do limite real de chamadas.");
    await new Promise((done) =>
      setTimeout(done, Math.min(59000, 60000 - (Date.now() % 60000) + 200)),
    );
    return pace();
  }
  count++;
}
async function rpc(
  method: string,
  params: Record<string, unknown> = {},
  credential = token,
) {
  await pace();
  if (method === "tools/call") {
    calledTools.add(String(params.name));
    report.mcpCalls++;
  }
  const response = await fetch(settings.resource, {
    method: "POST",
    signal: AbortSignal.timeout(30000),
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      ...(credential ? { authorization: "Bearer " + credential } : {}),
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++seq, method, params }),
  });
  const result = { status: response.status, body: await response.json() };
  writeFileSync(
    directory + "/rpc-" + seq + ".json",
    JSON.stringify({ method, params, ...result }, null, 2),
  );
  return result;
}
async function call(
  name: string,
  args: Record<string, unknown>,
  credential = token,
): Promise<ToolResult> {
  const response = await rpc(
    "tools/call",
    { name, arguments: args },
    credential,
  );
  assert.equal(response.status, 200, JSON.stringify(response.body));
  assert(!response.body.error, JSON.stringify(response.body.error));
  const result = response.body.result;
  if (result?.isError) {
    const text = String(result.content[0].text);
    let error: { code: string; message: string };
    try {
      error = JSON.parse(text);
    } catch {
      throw new PluginError(
        text.includes("-32602") ? "INVALID_INPUT" : "MCP_ERROR",
        text,
      );
    }
    throw new PluginError(error.code, error.message);
  }
  assert.equal(result?.structuredContent?.ok, true, JSON.stringify(result));
  assert.deepEqual(
    JSON.parse(result.content[0].text),
    result.structuredContent,
  );
  return result.structuredContent.data;
}
async function expectCode(
  name: string,
  args: Record<string, unknown>,
  code: string,
  credential = token,
) {
  await assert.rejects(
    () => call(name, args, credential),
    (error: unknown) => error instanceof PluginError && error.code === code,
  );
}
async function approval(id: string, method: "GET" | "POST", decision = "save") {
  report.approvalCalls++;
  const origin = new URL(settings.resource).origin;
  const response = await fetch(origin + "/api/chatgptplugin/approvals/" + id, {
    method,
    signal: AbortSignal.timeout(60000),
    headers: {
      authorization: "Bearer " + token,
      ...(method === "POST"
        ? {
            origin,
            "sec-fetch-site": "same-origin",
            "content-type": "application/json",
          }
        : {}),
    },
    ...(method === "POST" ? { body: JSON.stringify({ decision }) } : {}),
  });
  const data = await response.json();
  assert.equal(response.status, 200, JSON.stringify(data));
  return data;
}
async function rawRecord(item: Created) {
  return (
    await db.query(
      `SELECT * FROM erp.${tableFor[item.kind]} WHERE empresa_id=$1 AND id=$2`,
      [companyId, item.id],
    )
  ).rows[0];
}
async function prepare(
  kind: string,
  data: Record<string, unknown>,
  key = randomUUID(),
) {
  if ("registro_id" in data) {
    const base = kind.replace(/^(editar|excluir)_/, "") as Kind;
    assert(
      created.some((r) => r.kind === base && r.id === Number(data.registro_id)),
      "Only test-created IDs may be edited/approved/deleted",
    );
  } else
    assert(
      String(data.nome || data.descricao || data.observacoes).includes(marker),
      "All created records must carry test marker",
    );
  const draft = await call("preparar_rascunho", {
    empresa_id: companyId,
    chave_operacao: key,
    proposta: { tipo: kind, dados: data },
  });
  assert.equal(draft.status, "pending");
  assert.equal(draft.empresa_id, companyId);
  saveReport();
  return draft;
}
async function save(draft: DraftResult) {
  const review = await approval(draft.rascunho_id, "GET");
  assert.equal(review.empresa_id, companyId);
  assert.equal(review.status, "pending");
  const result = await approval(draft.rascunho_id, "POST");
  assert.equal(result.status, "saved");
  const state = await call("obter_rascunho", {
    empresa_id: companyId,
    rascunho_id: draft.rascunho_id,
  });
  assert.equal(state.status, "saved");
  assert.equal(state.registro_id, result.registro_id);
  return Number(result.registro_id);
}
async function read(item: Created) {
  if (item.kind === "cliente" || item.kind === "fornecedor")
    return call("obter_cadastro", {
      empresa_id: companyId,
      tipo: item.kind === "cliente" ? "clientes" : "fornecedores",
      registro_id: item.id,
    });
  if (item.kind === "conta_pagar" || item.kind === "conta_receber")
    return call("obter_titulo_financeiro", {
      empresa_id: companyId,
      tipo: item.kind === "conta_pagar" ? "pagar" : "receber",
      conta_id: item.id,
    });
  return call(item.kind === "venda" ? "obter_venda" : "obter_compra", {
    empresa_id: companyId,
    [item.kind === "venda" ? "venda_id" : "compra_id"]: item.id,
  });
}
async function verifyList(item: Created, expected: number) {
  const row = await rawRecord(item);
  const financial = item.kind.startsWith("conta_"),
    registration = ["cliente", "fornecedor"].includes(item.kind);
  const args = {
    empresa_id: companyId,
    busca: String(
      registration ? row.nome : financial ? row.descricao : row.numero,
    ),
  };
  const data = await call(
    registration
      ? "buscar_cadastros"
      : financial
        ? "consultar_financeiro"
        : item.kind === "venda"
          ? "listar_vendas"
          : "listar_compras",
    {
      ...args,
      ...(registration
        ? { tipo: item.kind === "cliente" ? "clientes" : "fornecedores" }
        : financial
          ? { tipo: item.kind === "conta_pagar" ? "pagar" : "receber" }
          : {}),
    },
  );
  assert.equal(data.total, expected, JSON.stringify(data));
  if (expected)
    assert(
      data.records.some(
        (r) => Number(financial ? r.conta_id : r.id) === item.id,
      ),
    );
}
async function exclude(item: Created) {
  const row = await rawRecord(item);
  if (row?.excluido_em) {
    item.deleted = true;
    return;
  }
  assert(
    row &&
      Number(row.criado_por) === userId &&
      String(row.nome || row.descricao || row.observacoes).includes(marker),
    "Deletion requires a marker and the test user",
  );
  const draft = await prepare("excluir_" + item.kind, {
    registro_id: item.id,
    motivo: marker + ": encerramento do teste autorizado de CRUD",
  });
  const id = await save(draft);
  assert.equal(id, item.id);
  assert((await rawRecord(item)).excluido_em);
  item.deleted = true;
  saveReport();
  await verifyList(item, 0);
  await assert.rejects(
    () => read(item),
    (e: unknown) => e instanceof PluginError && e.code === "NOT_FOUND",
  );
}
async function fingerprint() {
  const tables = (
    await db.query(
      "SELECT c.table_name FROM information_schema.columns c JOIN information_schema.tables t ON t.table_schema=c.table_schema AND t.table_name=c.table_name WHERE c.table_schema='erp' AND c.column_name='empresa_id' AND t.table_type='BASE TABLE' AND EXISTS(SELECT 1 FROM information_schema.columns i WHERE i.table_schema=c.table_schema AND i.table_name=c.table_name AND i.column_name='id') ORDER BY c.table_name",
    )
  ).rows;
  const snapshot: NonNullable<typeof baseline> = {};
  for (const { table_name: table } of tables) {
    assert(/^[a-z_]+$/.test(table));
    snapshot[table] = (
      await db.query(
        `SELECT id::text,empresa_id,md5(to_jsonb(r)::text) hash FROM erp.${table} r WHERE empresa_id IN (1,2) ORDER BY empresa_id,id`,
      )
    ).rows;
  }
  return snapshot;
}
async function originalsUnchanged() {
  assert(baseline);
  const after = await fingerprint();
  for (const [table, rows] of Object.entries(baseline))
    for (const before of rows)
      assert.deepEqual(
        after[table].find(
          (r) => r.id === before.id && r.empresa_id === before.empresa_id,
        ),
        before,
        "Existing record changed: " + table + "/" + before.id,
      );
  report.originalRowsUnchanged = true;
}
async function recoverCreated() {
  const saved = (
    await db.query(
      "SELECT id,proposal,record_id FROM plugin.drafts WHERE user_id=$1 AND empresa_id=$2 AND oauth_client_id=$3 AND status='saved' AND integration='chatgpt'",
      [userId, companyId, clientId],
    )
  ).rows;
  for (const d of saved)
    if (
      d.proposal.tipo in tableFor &&
      !created.some(
        (r) => r.kind === d.proposal.tipo && r.id === Number(d.record_id),
      )
    )
      created.push({
        kind: d.proposal.tipo,
        id: Number(d.record_id),
        draft: d.id,
        deleted: false,
      });
}
async function cleanup() {
  await recoverCreated();
  for (const item of [...created].reverse())
    if (!item.deleted)
      await check("Limpeza: " + item.kind, () => exclude(item));
  const pending = (
    await db.query(
      "SELECT id FROM plugin.drafts WHERE user_id=$1 AND empresa_id=$2 AND oauth_client_id=$3 AND status='pending' AND integration='chatgpt'",
      [userId, companyId, clientId],
    )
  ).rows;
  for (const row of pending) await approval(row.id, "POST", "cancel");
  let active = 0;
  for (const item of created)
    if (!(await rawRecord(item))?.excluido_em) active++;
  report.activeTestRecords = active;
  assert.equal(active, 0);
}
async function main() {
  await db.connect();
  connected = true;
  // This inspection client only issues SELECTs. Session-wide READ ONLY leaks
  // to other requests when the Supabase URL uses a transaction pooler.
  const identity = (
    await db.query(
      "SELECT e.name,u.clerk_user_id,u.full_name,u.email,m.role,m.perfil_acesso_id FROM shared.empresas e JOIN shared.usuarios_empresas m ON m.empresa_id=e.id JOIN shared.usuarios u ON u.id=m.usuario_id WHERE e.id=$1 AND u.id=$2 AND m.status='active' AND NOT m.suspenso_localmente AND e.status='active' AND u.status='active' AND m.role='owner'",
      [companyId, userId],
    )
  ).rows[0];
  assert(
    identity && identity.clerk_user_id === "user_3EyO1rFYG4ysjCm0aeJf34NOxv1",
    "Must use verified Igor identity",
  );
  principal = await loadPluginPrincipal(identity.clerk_user_id, clientId, [
    "erp:read",
    "erp:write",
  ]);
  assert.equal(principal.userId, userId);
  const company = principal.companies.find((c) => c.id === companyId);
  assert(company);
  session = {
    tenantId: companyId,
    sharedUserId: userId,
    clerkUserId: identity.clerk_user_id,
    email: identity.email,
    tenantName: identity.name,
    role: "owner",
    authMode: "clerk",
    erpProfile: company.profile,
    capabilities: company.capabilities,
  };
  const refs = (
    await db.query(
      `SELECT
    (SELECT id FROM erp.entidades WHERE empresa_id=$1 AND ativo AND eh_cliente AND excluido_em IS NULL ORDER BY id LIMIT 1) cliente,
    (SELECT id FROM erp.entidades WHERE empresa_id=$1 AND ativo AND eh_fornecedor AND excluido_em IS NULL ORDER BY id LIMIT 1) fornecedor,
    (SELECT id FROM erp.produtos WHERE empresa_id=$1 AND ativo AND excluido_em IS NULL ORDER BY id LIMIT 1) produto,
    (SELECT id FROM erp.categorias WHERE empresa_id=$1 AND ativo AND tipo='despesa' AND excluido_em IS NULL ORDER BY id LIMIT 1) despesa,
    (SELECT id FROM erp.categorias WHERE empresa_id=$1 AND ativo AND tipo='receita' AND excluido_em IS NULL ORDER BY id LIMIT 1) receita,
    (SELECT id FROM erp.contas_financeiras WHERE empresa_id=$1 AND ativo AND excluido_em IS NULL ORDER BY id LIMIT 1) conta`,
      [companyId],
    )
  ).rows[0];
  assert(
    Object.values(refs).every((v) => Number(v) > 0),
    "Reference records required",
  );
  const today = dashboardToday(),
    due = new Date(Date.parse(today) + 7 * 86400000).toISOString().slice(0, 10);
  assert.equal(
    (
      await db.query(
        "SELECT id FROM erp.fechamentos_periodos WHERE empresa_id=$1 AND reaberto_em IS NULL AND ($2::date BETWEEN periodo_inicio AND periodo_fim OR $3::date BETWEEN periodo_inicio AND periodo_fim)",
        [companyId, today, due],
      )
    ).rows.length,
    0,
    "Test dates must be open",
  );
  baseline = await fingerprint();
  writeFileSync(directory + "/baseline.json", JSON.stringify(baseline));
  const realWindow = (
    await db.query(
      "SELECT requests FROM plugin.rate_windows WHERE user_id=$1 AND integration='chatgpt' AND window_start=date_trunc('minute',now())",
      [userId],
    )
  ).rows[0];
  minute = Math.floor(Date.now() / 60000);
  count = Number(realWindow?.requests || 0);
  server = createServer(async (req, res) => {
    try {
      const chunks: Buffer[] = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 65536) {
          res.writeHead(413).end();
          return;
        }
        chunks.push(Buffer.from(chunk));
      }
      const origin = new URL(settings.resource).origin,
        url = new URL(req.url || "/", origin),
        headers = new Headers();
      for (const [key, value] of Object.entries(req.headers))
        if (value !== undefined)
          headers.set(key, Array.isArray(value) ? value.join(",") : value);
      const request = new Request(url, {
        method: req.method,
        headers,
        ...(req.method === "POST" ? { body: Buffer.concat(chunks) } : {}),
      });
      let response: Response;
      if (url.pathname === "/api/mcp")
        response = await handlePluginRequest(request, deps);
      else {
        const match = url.pathname.match(
          /^\/api\/chatgptplugin\/approvals\/([a-f0-9-]+)$/,
        );
        if (!match) {
          res.writeHead(404).end();
          return;
        }
        response = await approvalRequest(request, match[1], {
          ...approvalDependencies,
          config: () => settings,
          session: async () =>
            headers.get("authorization") === "Bearer " + token ? session : null,
        });
      }
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
    } catch (e) {
      console.error("Local handler failure: " + (e as Error).message);
      res.writeHead(500).end("{}");
    }
  });
  await new Promise<void>((done) => server!.listen(0, "127.0.0.1", done));
  const address = server.address();
  assert(address && typeof address === "object");
  const origin = "http://127.0.0.1:" + address.port;
  settings = {
    resource: origin + "/api/mcp",
    metadataUrl: origin + "/.well-known/oauth-protected-resource/api/mcp",
    issuer: "https://oauth-test.invalid",
    scope: "erp:read",
    clientIds: [clientId],
    origins: [origin],
    requestsPerMinute: 60,
    toolTimeoutMs: 15000,
  };
  deps = {
    config: () => settings,
    execution: executionDependencies,
    limit: async (identity, maximum) => {
      try { await consumeRequestLimit(identity, maximum); }
      catch (error) {
        console.error("Request-limit database failure: " + ((error as {code?:string}).code || (error as Error).name));
        throw error;
      }
    },
    resolve: async (request) => {
      const credential = request.headers.get("authorization");
      if (credential === "Bearer " + token) return principal;
      if (credential === "Bearer " + readToken)
        return { ...principal, scopes: ["erp:read"] };
      if (credential === "Bearer " + restrictedToken)
        return {
          ...principal,
          companies: principal.companies.map((c) => ({
            ...c,
            capabilities: c.capabilities.filter(
              (cap) => !cap.endsWith(".gerenciar"),
            ),
          })),
        };
      throw new PluginError(
        "UNAUTHENTICATED",
        "Identidade de teste obrigatória.",
        401,
      );
    },
  };
  await check("Inicialização MCP e identidade de Igor", async () => {
    const init = await rpc("initialize", {
      protocolVersion: "2025-11-25",
      capabilities: {},
      clientInfo: { name: "live-crud-test", version: "1" },
    });
    assert.equal(init.status, 200);
    const tools = await rpc("tools/list");
    assert(
      tools.body.result.tools.some(
        (t: { name: string }) => t.name === "preparar_rascunho",
      ),
    );
    const access = await call("meu_acesso", { empresa_id: companyId });
    assert.equal(access.usuario_id, userId);
    assert.equal(access.empresa_selecionada, companyId);
  });
  await check(
    "Proteções de login, escopo, permissão, empresa e valor",
    async () => {
      assert.equal(
        (await rpc("tools/call", { name: "meu_acesso", arguments: {} }, ""))
          .status,
        401,
      );
      const args = {
        empresa_id: companyId,
        chave_operacao: randomUUID(),
        proposta: {
          tipo: "cliente",
          dados: { nome: marker + " Negativo", tipo: "fisica" },
        },
      };
      await expectCode(
        "preparar_rascunho",
        args,
        "INSUFFICIENT_SCOPE",
        readToken,
      );
      await expectCode(
        "preparar_rascunho",
        args,
        "ACCESS_DENIED",
        restrictedToken,
      );
      const other = (
        await db.query(
          "SELECT id FROM shared.empresas WHERE NOT(id=ANY($1::bigint[])) ORDER BY id LIMIT 1",
          [principal.companies.map((c) => c.id)],
        )
      ).rows[0];
      assert(other);
      await expectCode(
        "preparar_rascunho",
        { ...args, empresa_id: Number(other.id) },
        "ACCESS_DENIED",
      );
      await expectCode(
        "preparar_rascunho",
        {
          ...args,
          proposta: { tipo: "conta_pagar", dados: { valor_total: -125 } },
        },
        "INVALID_INPUT",
      );
    },
  );
  const proposals: {
    kind: Kind;
    create: Record<string, unknown>;
    update: (id: number) => Record<string, unknown>;
  }[] = [
    {
      kind: "cliente",
      create: {
        nome: marker + " Cliente",
        tipo: "fisica",
        email: "cliente." + runId.slice(0, 8) + "@example.invalid",
        telefone: "11999990000",
      },
      update: (id) => ({
        registro_id: id,
        nome: marker + " Cliente atualizado",
        status: "ativo",
      }),
    },
    {
      kind: "fornecedor",
      create: {
        nome: marker + " Fornecedor",
        tipo: "fisica",
        email: "fornecedor." + runId.slice(0, 8) + "@example.invalid",
        telefone: "11999990001",
      },
      update: (id) => ({
        registro_id: id,
        nome: marker + " Fornecedor atualizado",
        status: "ativo",
      }),
    },
    ...(["conta_pagar", "conta_receber"] as const).map((kind) => {
      const pay = kind === "conta_pagar",
        value = pay ? 125 : 300;
      const common = {
        [pay ? "fornecedor_id" : "cliente_id"]: Number(
          refs[pay ? "fornecedor" : "cliente"],
        ),
        descricao: marker + " " + kind,
        numero_documento: marker,
        valor_total: value,
        data_competencia: today,
        data_emissao: today,
        categoria_id: Number(refs[pay ? "despesa" : "receita"]),
        conta_financeira_id: Number(refs.conta),
        parcelas: [{ data_vencimento: due, valor: value }],
      };
      return {
        kind,
        create: common,
        update: (id: number) => ({
          ...common,
          registro_id: id,
          descricao: marker + " " + kind + " atualizado",
          valor_total: pay ? 175 : 350,
          parcelas: [{ data_vencimento: due, valor: pay ? 175 : 350 }],
        }),
      };
    }),
    ...(["venda", "compra"] as const).map((kind) => {
      const sale = kind === "venda";
      const common = {
        [sale ? "cliente_id" : "fornecedor_id"]: Number(
          refs[sale ? "cliente" : "fornecedor"],
        ),
        [sale ? "data_venda" : "data_compra"]: today,
        data_vencimento: due,
        itens: [
          {
            tipo: "produto",
            item_id: Number(refs.produto),
            quantidade: 1,
            valor_unitario: sale ? 100 : 50,
            desconto: 0,
          },
        ],
        observacoes: marker + " " + kind,
      };
      return {
        kind,
        create: common,
        update: (id: number) => ({
          ...common,
          registro_id: id,
          observacoes: marker + " " + kind + " atualizado",
          itens: [{ ...common.itens[0], quantidade: 2 }],
        }),
      };
    }),
  ];
  for (const scenario of proposals) {
    let item: Created;
    await check(
      scenario.kind + ": preparar, revisar, criar e consultar",
      async () => {
        const key = randomUUID(),
          draft = await prepare(scenario.kind, scenario.create, key);
        const pending = await call("obter_rascunho", {
          empresa_id: companyId,
          rascunho_id: draft.rascunho_id,
        });
        assert.equal(pending.status, "pending");
        const column = ["cliente", "fornecedor"].includes(scenario.kind)
          ? "nome"
          : scenario.kind.startsWith("conta_")
            ? "descricao"
            : "observacoes";
        assert.equal(
          Number(
            (
              await db.query(
                `SELECT count(*) n FROM erp.${tableFor[scenario.kind]} WHERE empresa_id=$1 AND ${column}=$2`,
                [companyId, scenario.create[column]],
              )
            ).rows[0].n,
          ),
          0,
          "Proposal is not a persisted ERP record",
        );
        if (scenario.kind === "cliente") {
          const repeat = await call("preparar_rascunho", {
            empresa_id: companyId,
            chave_operacao: key,
            proposta: { tipo: scenario.kind, dados: scenario.create },
          });
          assert.equal(repeat.rascunho_id, draft.rascunho_id);
          await expectCode(
            "preparar_rascunho",
            {
              empresa_id: companyId,
              chave_operacao: key,
              proposta: {
                tipo: scenario.kind,
                dados: {
                  ...scenario.create,
                  nome: marker + " Conteúdo diferente",
                },
              },
            },
            "IDEMPOTENCY_CONFLICT",
          );
        }
        // Journal the created ID immediately after the approval commits; recovery
        // can also obtain it from this run's saved drafts after an interrupted call.
        const review = await approval(draft.rascunho_id, "GET");
        assert.equal(review.empresa_id, companyId);
        const saved = await approval(draft.rascunho_id, "POST");
        assert.equal(saved.status, "saved");
        item = {
          kind: scenario.kind,
          id: Number(saved.registro_id),
          draft: draft.rascunho_id,
          deleted: false,
        };
        created.push(item);
        saveReport();
        if (scenario.kind === "cliente") {
          const repeat = await approval(draft.rascunho_id, "POST");
          assert.equal(repeat.registro_id, saved.registro_id);
        }
        const state = await call("obter_rascunho", {
          empresa_id: companyId,
          rascunho_id: draft.rascunho_id,
        });
        assert.equal(state.status, "saved");
        assert.equal(Number(state.registro_id), item.id);
        const raw = await rawRecord(item);
        assert.equal(Number(raw.criado_por), userId);
        assert.equal(Number(raw.empresa_id), companyId);
        const data = await read(item);
        if (scenario.kind.startsWith("conta_")) {
          assert.equal(
            Number(data.record.valor_total),
            scenario.create.valor_total,
          );
          assert.equal(data.installments.length, 1);
          assert.equal(
            Number(data.installments[0].valor),
            scenario.create.valor_total,
          );
        } else if (
          scenario.kind === "cliente" ||
          scenario.kind === "fornecedor"
        ) {
          assert.equal(data.record.nome, scenario.create.nome);
          assert.equal(data.record.telefone, scenario.create.telefone);
        } else {
          assert.equal(
            data[scenario.kind === "venda" ? "sale" : "purchase"].status,
            "rascunho",
          );
          assert.equal(Number(data.items[0].quantidade), 1);
          assert.equal(
            Number(data[scenario.kind === "venda" ? "sale" : "purchase"].total),
            scenario.kind === "venda" ? 100 : 50,
          );
        }
        await verifyList(item, 1);
      },
    );
    const current = created.find((r) => r.kind === scenario.kind)!;
    if (scenario.kind === "cliente" || scenario.kind === "fornecedor")
      await check(
        scenario.kind + ": limitação de edição de telefone identificada",
        async () => {
          await expectCode(
            "preparar_rascunho",
            {
              empresa_id: companyId,
              chave_operacao: randomUUID(),
              proposta: {
                tipo: "editar_" + scenario.kind,
                dados: { registro_id: current.id, telefone: "11999990002" },
              },
            },
            "INVALID_INPUT",
          );
          report.limitations.push(
            "editar_" +
              scenario.kind +
              ": telefone/email não estão disponíveis no contrato de edição atual; testados nome/status.",
          );
        },
      );
    await check(
      scenario.kind + ": atualizar e conferir no MCP e banco",
      async () => {
        const data = scenario.update(current.id),
          draft = await prepare("editar_" + scenario.kind, data);
        assert.equal(await save(draft), current.id);
        const readback = await read(current),
          raw = await rawRecord(current);
        assert.equal(Number(raw.atualizado_por), userId);
        if (scenario.kind.startsWith("conta_")) {
          assert.equal(Number(raw.valor_total), data.valor_total);
          assert.equal(Number(readback.record.valor_total), data.valor_total);
          assert.equal(readback.installments.length, 1);
          assert.equal(
            Number(readback.installments[0].valor),
            data.valor_total,
          );
        } else if (
          scenario.kind === "cliente" ||
          scenario.kind === "fornecedor"
        )
          assert.equal(readback.record.nome, data.nome);
        else {
          assert.equal(Number(readback.items[0].quantidade), 2);
          assert.equal(
            Number(raw.total),
            scenario.kind === "venda" ? 200 : 100,
          );
          assert.equal(
            readback[scenario.kind === "venda" ? "sale" : "purchase"]
              .observacoes,
            data.observacoes,
          );
        }
        await verifyList(current, 1);
      },
    );
    await check(
      scenario.kind + ": excluir e verificar ausência nas consultas",
      () => exclude(current),
    );
  }
  await check(
    "Auditoria identifica usuário e empresa em todas as gravações",
    async () => {
      const audits = (
        await db.query(
          "SELECT tool_name,status,user_id,empresa_id FROM plugin.executions WHERE oauth_client_id=$1 AND integration='chatgpt'",
          [clientId],
        )
      ).rows;
      const approvals = (audits as AuditRow[]).filter(
        (r) => r.tool_name === "aprovar_rascunho",
      );
      assert.equal(approvals.length, 18);
      assert(
        approvals.every(
          (r) =>
            r.status === "succeeded" &&
            Number(r.user_id) === userId &&
            Number(r.empresa_id) === companyId,
        ),
      );
      const drafts = (
        await db.query(
          "SELECT id,status,user_id,empresa_id FROM plugin.drafts WHERE oauth_client_id=$1 AND integration='chatgpt'",
          [clientId],
        )
      ).rows;
      assert.equal(drafts.length, 18);
      assert(
        (drafts as DraftRow[]).every(
          (r) =>
            r.status === "saved" &&
            Number(r.user_id) === userId &&
            Number(r.empresa_id) === companyId,
        ),
      );
    },
  );
}
async function execute() {
  try {
    await main();
  } catch (error) {
    report.status = "failed";
    checks.push({
      name: "Execução",
      status: "failed",
      elapsedMs: 0,
      message: String((error as Error).message),
    });
    console.error((error as Error).message);
  } finally {
    if (server && settings) {
      try {
        await check("Limpeza final de todos os registros do teste", cleanup);
      } catch {
        report.status = "failed";
      }
    }
    if (connected && baseline) {
      try {
        await check(
          "Dados anteriores das duas empresas preservados",
          originalsUnchanged,
        );
      } catch {
        report.status = "failed";
      }
    }
    if (report.status !== "failed") report.status = "passed";
    saveReport();
    if (server) await new Promise<void>((done) => server!.close(() => done()));
    await db.end().catch(() => {});
    await closePool();
    await closePluginDatabase();
    console.log(
      JSON.stringify({
        status: report.status,
        checks: checks.length,
        mcpCalls: report.mcpCalls,
        approvalCalls: report.approvalCalls,
        created: created.length,
        activeTestRecords: report.activeTestRecords,
        originalRowsUnchanged: report.originalRowsUnchanged,
        limitations: report.limitations,
        report: directory + "/report.json",
      }),
    );
    if (report.status !== "passed") process.exitCode = 1;
  }
}
void execute();
