import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { createHash } from "node:crypto";
import dotenv from "dotenv";
import { connection } from "../erp/evolution-db.mjs";
const cfg = dotenv.parse(readFileSync(".env.local")),
  staged = JSON.parse(readFileSync(".cache/shared/deployment.json")),
  production = process.argv.includes("--production"),
  origin = production
    ? "https://cognito-seven.vercel.app"
    : "https://" + staged.url;
const c = connection(),
  checks = [];
async function check(name, fn) {
  await fn();
  checks.push(name);
  console.log("Passed: " + name);
}
function csvRows(csv) {
  let quoted = false,
    count = 0;
  for (let i = 0; i < csv.length; i++) {
    if (csv[i] === '"') {
      if (quoted && csv[i + 1] === '"') i++;
      else quoted = !quoted;
    } else if (!quoted && csv[i] === "\n") count++;
  }
  return count;
}
try {
  await c.connect();
  const owner = (
    await c.query(
      "SELECT u.clerk_user_id,e.clerk_organization_id,m.acesso_portal_contador FROM shared.usuarios u JOIN shared.usuarios_empresas m ON m.usuario_id=u.id JOIN shared.empresas e ON e.id=m.empresa_id WHERE u.id=3 AND e.id=2 AND m.role='owner' AND m.status='active'",
    )
  ).rows[0];
  assert(owner?.acesso_portal_contador);
  const clerk = createRequire(import.meta.url)(
      "@clerk/backend",
    ).createClerkClient({ secretKey: cfg.CLERK_SECRET_KEY }),
    sessions = await clerk.sessions.getSessionList({
      userId: owner.clerk_user_id,
      status: "active",
      limit: 100,
    }),
    session =
      sessions.data.find(
        (s) => s.lastActiveOrganizationId === owner.clerk_organization_id,
      ) || sessions.data.find((s) => !s.lastActiveOrganizationId);
  assert(session, "No active owner session");
  async function request(path, status = 200, init = {}) {
    const token = await clerk.sessions.getToken(session.id, undefined, 60);
    const response = await fetch(origin + path, {
      ...init,
      headers: { Authorization: "Bearer " + token.jwt, ...init.headers },
      redirect: "manual",
      signal: AbortSignal.timeout(60000),
    });
    if (response.status !== status) {
      const detail = await response.text();
      throw new Error(
        path + " HTTP " + response.status + " " + detail.slice(0, 350),
      );
    }
    return response;
  }
  const period = "from=2026-09-01&to=2026-11-30";
  await check(
    "Real Clerk session lists only companies granted to this account",
    async () => {
      const result = await (await request("/api/contador/empresas")).json();
      assert(result.companies.some((c) => c.id === 2));
      assert(!result.companies.some((c) => c.id === 1));
      assert(
        result.companies.every((c) =>
          c.capabilities.every((v) => v.endsWith(".visualizar")),
        ),
      );
    },
  );
  await check(
    "Cross-company access, invalid filters, missing routes and mutations are rejected",
    async () => {
      await request("/api/contador/empresas/1/financeiro?" + period, 403);
      await request(
        "/api/contador/empresas/2/financeiro?from=2026-02-30&to=2026-03-01",
        422,
      );
      await request(
        "/api/contador/empresas/2/financeiro?" + period + "&page=1&page=2",
        422,
      );
      await request("/api/contador/empresas/2/usuarios?" + period, 404);
      await request("/api/contador/empresas/2/financeiro", 405, {
        method: "POST",
      });
      const unauth = await fetch(origin + "/api/contador/empresas", {
        redirect: "manual",
        signal: AbortSignal.timeout(30000),
      });
      assert.equal(unauth.status, 401);
      assert((await unauth.json()).error);
    },
  );
  await check(
    "Financial tables, movements, reports and pending rows return valid pages",
    async () => {
      for (const resource of [
        "financeiro",
        "financeiro&side=receber",
        "financeiro&side=movimentacoes",
        "relatorios",
        "relatorios&report=dre-caixa",
        "relatorios&report=dre-competencia",
        "pendencias",
        "documentos",
      ]) {
        const [name, ...args] = resource.split("&"),
          result = await (
            await request(
              `/api/contador/empresas/2/${name}?${period}&pageSize=2&${args.join("&")}`,
            )
          ).json();
        assert.equal(result.company.id, 2);
        assert(result.table.columns.length);
        assert(Number.isInteger(result.table.total));
        assert.equal(result.table.pageSize, 2);
        assert(result.table.records.length <= 2);
      }
    },
  );
  await check(
    "Dashboard matches ERP values and exposes no ERP edit destinations",
    async () => {
      const portal = (
          await (
            await request("/api/contador/empresas/2/resumo?" + period)
          ).json()
        ).dashboard,
        erp = await (
          await request(
            "/api/erp/dashboards/visao-geral?" +
              period +
              "&compare=true&includeForecast=false",
          )
        ).json();
      assert(portal.metrics.length >= 4);
      for (const metric of portal.metrics) {
        const original = erp.metrics.find((m) => m.key === metric.key);
        assert(original);
        assert.equal(metric.value, original.value);
        assert(!metric.href);
      }
      assert(!JSON.stringify(portal).includes('"href":'));
    },
  );
  await check(
    "CSV exports all filtered records beyond the visible page and includes company/period",
    async () => {
      for (const source of [
        "financeiro",
        "documentos",
        "relatorios",
        "pendencias",
      ]) {
        const table = (
          await (
            await request(
              `/api/contador/empresas/2/${source}?${period}&pageSize=1`,
            )
          ).json()
        ).table;
        const response = await request(
          `/api/contador/empresas/2/exportar?source=${source}&${period}&page=2&pageSize=1`,
        );
        assert(response.headers.get("content-type").includes("text/csv"));
        const csv = await response.text();
        assert.equal(csvRows(csv), table.total + 1);
        assert(csv.includes("Empresa"));
        if (table.total) {
          assert(csv.includes("2026-09-01"));
          assert(csv.includes("2026-11-30"));
        }
      }
      const none = await (
        await request(
          `/api/contador/empresas/2/exportar?source=documentos&${period}&query=nonexistent-unique-portal-78219`,
        )
      ).text();
      assert.equal(csvRows(none), 1);
    },
  );
  await check(
    "Private simulation PDFs match stored bytes and other-company file ids are blocked",
    async () => {
      const docs = (
          await (
            await request(
              "/api/contador/empresas/2/documentos?" + period + "&pageSize=100",
            )
          ).json()
        ).table.records,
        document = docs.find((r) => String(r.id).startsWith("nfse:"));
      assert(document, "Expected a seeded service invoice PDF");
      assert(document.origem.includes("SIMULAÇÃO"));
      const id = Number(String(document.id).split(":")[1]),
        expected = (
          await c.query(
            "SELECT conteudo FROM erp.notas_fiscais_pdfs WHERE empresa_id=2 AND nota_fiscal_id=$1 ORDER BY versao DESC LIMIT 1",
            [id],
          )
        ).rows[0].conteudo,
        response = await request(
          `/api/contador/empresas/2/documentos/${document.id}`,
        ),
        bytes = Buffer.from(await response.arrayBuffer());
      assert.equal(response.headers.get("content-type"), "application/pdf");
      assert.equal(
        createHash("sha256").update(bytes).digest("hex"),
        createHash("sha256").update(expected).digest("hex"),
      );
      assert(bytes.subarray(0, 5).toString().startsWith("%PDF-"));
      await request(`/api/contador/empresas/1/documentos/${document.id}`, 403);
      await request(
        "/api/contador/empresas/2/documentos/nfse:9007199254740991",
        404,
      );
    },
  );
  await check(
    "Invitation management validates input and origin without sending real emails",
    async () => {
      const invites = await (
        await request("/api/contador/convites?companyId=2")
      ).json();
      assert(Array.isArray(invites.invitations));
      await request("/api/contador/convites", 422);
      await request("/api/contador/convites?companyId=1", 403);
      for (const method of ["POST", "DELETE"]) {
        await request("/api/contador/convites", 403, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(
            method === "POST"
              ? { companyId: 1, email: "review@example.invalid" }
              : { companyId: 1, invitationId: 9007199254740991 },
          ),
        });
      }
      await request("/api/contador/convites", 422, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: 2, email: "invalid" }),
      });
      await request("/api/contador/convites", 403, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Origin: "https://example.invalid",
        },
        body: "{}",
      });
      await request("/api/contador/convites", 409, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId: 2, invitationId: 9007199254740991 }),
      });
    },
  );
  await check(
    "Portal pages and responsive styles are deployed; existing ERP remains reachable",
    async () => {
      let css = "";
      for (const path of [
        "/contador",
        "/contador/empresas/2",
        "/contador/empresas/2/financeiro",
        "/contador/empresas/2/documentos",
        "/contador/empresas/2/relatorios",
        "/contador/empresas/2/pendencias",
      ]) {
        const html = await (await request(path)).text();
        assert(html.includes("contador-shell"));
        assert(html.includes("Portal do Contador"));
        if (!css) {
          const urls = [
            ...new Set(
              [...html.matchAll(/href="([^"<>]+\.css(?:\?[^"<>]*)?)"/g)].map(
                (m) => m[1].replaceAll("&amp;", "&"),
              ),
            ),
          ];
          assert(urls.length);
          for (const url of urls) css += await (await request(url)).text();
        }
      }
      for (const marker of [
        ".contador-sidebar",
        ".contador-table-scroll",
        ".contador-positive",
        ".contador-negative",
        "max-width:760px",
      ])
        assert(css.includes(marker), "Missing style " + marker);
      await request("/api/erp/acesso");
      await request("/erp/dashboards/visao-geral");
    },
  );
  const proof = {
    status: "passed",
    production,
    origin,
    deploymentId: staged.id,
    realClerkSession: true,
    businessDataWrites: 0,
    realEmailsSent: 0,
    browserVisualCheck: "not-performed",
    checks,
    at: new Date().toISOString(),
  };
  mkdirSync(".cache/portaldocontador", { recursive: true });
  writeFileSync(
    ".cache/portaldocontador/" +
      (production ? "production-http" : "staged-http") +
      ".json",
    JSON.stringify(proof, null, 2),
  );
  console.log(JSON.stringify(proof));
} catch (error) {
  console.error(
    JSON.stringify({
      status: "failed",
      message: error.message,
      completed: checks,
    }),
  );
  process.exitCode = 1;
} finally {
  await c.end();
}
