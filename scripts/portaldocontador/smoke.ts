import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import dotenv from "dotenv";
import { runWithErpDatabaseContext } from "../../src/lib/erpDatabaseContext";
import {
  runQuery,
  runWithErpReadSnapshot,
  closePool,
} from "../../src/lib/postgres";
import { portalCapabilities } from "../../src/products/portaldocontador/server/access";
import {
  portalFinancial,
  portalDocuments,
  portalReports,
  portalPending,
} from "../../src/products/portaldocontador/server/queries";
import { portalCsv } from "../../src/products/portaldocontador/server/csv";
import {
  portalQuerySchema,
  PORTAL_READ_CAPABILITIES,
} from "../../src/products/portaldocontador/shared/contracts";
import { erpReadService } from "../../src/products/erp/server/erpReadService";
import type { ErpAccessContext } from "../../src/products/erp/server/erpAccess";
Object.assign(process.env, dotenv.parse(readFileSync(".env.local")));
const checks: string[] = [];
const session: ErpAccessContext = {
  authMode: "clerk",
  clerkUserId: "test-authenticated-owner",
  clerkOrganizationId: null,
  clerkOrganizationSlug: null,
  clerkMembershipId: null,
  sharedUserId: 3,
  tenantId: 2,
  tenantName: "Owner test",
  tenantSlug: null,
  role: "owner",
  email: "unused@example.invalid",
  erpProfile: "administrador",
  capabilities: [...PORTAL_READ_CAPABILITIES],
  timeZone: "America/Sao_Paulo",
};
const context = {
  tenantId: 2,
  userId: 3,
  timeZone: session.timeZone,
  readOnly: true,
  portalContador: true,
  statementTimeoutMs: 10000,
};
async function check(name: string, fn: () => unknown | Promise<unknown>) {
  await fn();
  checks.push(name);
}
async function main() {
  try {
    await check("Only read capabilities, including owner/admin", () => {
      assert.deepEqual(
        portalCapabilities("owner", []).sort(),
        [...PORTAL_READ_CAPABILITIES].sort(),
      );
      assert.deepEqual(
        portalCapabilities("viewer", [
          "erp.financeiro.visualizar",
          "erp.financeiro.gerenciar",
        ]),
        ["erp.financeiro.visualizar"],
      );
    });
    await check(
      "Invalid dates, ranges, source and extra parameters are rejected",
      () => {
        for (const input of [
          { from: "2026-02-30", to: "2026-03-01" },
          { from: "2026-10-10", to: "2026-10-01" },
          { from: "2025-01-01", to: "2026-10-01" },
          { from: "2026-10-01", to: "2026-10-09", source: "usuarios" },
          { from: "2026-10-01", to: "2026-10-09", tenant: 1 },
        ])
          assert(!portalQuerySchema.safeParse(input).success);
      },
    );
    await check(
      "CSV escapes textual formulas, delimiters and quotes; keeps signed numbers",
      () => {
        const csv = portalCsv(
          [
            { key: "name", label: "Nome" },
            { key: "valor", label: "Valor", format: "currency" },
          ],
          [
            { name: '=HYPERLINK("x")', valor: -10.5 },
            { name: " +CMD", valor: 12 },
            { name: "a;b\nc", valor: 0 },
          ],
        );
        assert(csv.startsWith("\uFEFF"));
        assert(csv.includes(`"'=HYPERLINK(""x"")"`));
        assert(csv.includes('"-10,5"'));
        assert(!csv.includes("'-10,5"));
        assert(csv.includes('"a;b\nc"'));
        assert.throws(() =>
          portalCsv(
            [],
            Array.from({ length: 5001 }, () => ({})),
          ),
        );
      },
    );
    const q = portalQuerySchema.parse({
      from: "2026-09-01",
      to: "2026-11-30",
      pageSize: 20,
    });
    await runWithErpDatabaseContext(context, async () => {
      await check(
        "Portal financial values match ERP page and total",
        async () => {
          for (const side of ["pagar", "receber"] as const) {
            const portal = await portalFinancial(session, { ...q, side });
            const erp = await erpReadService.page(
              2,
              side === "pagar" ? "contas-a-pagar" : "contas-a-receber",
              {
                page: 1,
                pageSize: 20,
                query: "",
                filters: {
                  vencimento_inicio: q.from,
                  vencimento_fim: q.to,
                  tipo_lancamento: "efetivo",
                },
                sort: "vencimento",
              },
            );
            assert.deepEqual(portal.records, erp.records);
            assert.equal(portal.total, erp.total);
            assert(portal.total > 0);
          }
        },
      );
      await check(
        "Payments, documents, DRE, cash flow and pending rows execute with RLS",
        async () => {
          for (const result of [
            await portalFinancial(session, { ...q, side: "movimentacoes" }),
            await portalDocuments(session, q),
            await portalReports(session, q),
            await portalReports(session, { ...q, report: "dre-caixa" }),
            await portalReports(session, { ...q, report: "dre-competencia" }),
            await portalPending(session, q),
          ]) {
            assert(Number.isInteger(result.total));
            assert(result.records.length <= 20);
            assert(result.columns.length > 0);
          }
        },
      );
      await check(
        "Paging and search are applied before count and export",
        async () => {
          const rows = await portalFinancial(session, {
            ...q,
            side: "movimentacoes",
            pageSize: 1,
          });
          const second = await portalFinancial(session, {
            ...q,
            side: "movimentacoes",
            pageSize: 1,
            page: 2,
          });
          assert.equal(rows.total, second.total);
          if (rows.total > 1)
            assert.notEqual(rows.records[0].id, second.records[0].id);
          for (const fn of [portalDocuments, portalPending]) {
            const empty = await fn(session, {
              ...q,
              query: "nonexistent-unique-portal-78219",
            });
            assert.equal(empty.total, 0);
            assert.equal(empty.records.length, 0);
          }
        },
      );
      await check(
        "Mismatched tenant and missing capability are denied",
        async () => {
          await assert.rejects(
            runQuery(
              "SELECT id FROM erp.contas_pagar WHERE empresa_id=$1",
              [1],
            ),
            /tenant diferente/,
          );
          await assert.rejects(
            portalFinancial({ ...session, capabilities: [] }, q),
            (e) => (e as { status?: number }).status === 403,
          );
          assert.equal(
            (
              await runQuery(
                "SELECT id FROM erp.portal_documentos(empresa_id=>$1)",
                [2],
              )
            ).some((r) => !r.id),
            false,
          );
        },
      );
      await check(
        "Snapshot keeps pages in one transaction and blocks writes and context escalation",
        async () => {
          await runWithErpReadSnapshot(async () => {
            const [first] = await runQuery<{ snapshot: string }>(
              "SELECT txid_current_snapshot()::text snapshot FROM erp.contas_pagar WHERE empresa_id=$1 LIMIT 1",
              [2],
            );
            const [second] = await runQuery<{ snapshot: string }>(
              "SELECT txid_current_snapshot()::text snapshot FROM erp.contas_pagar WHERE empresa_id=$1 LIMIT 1",
              [2],
            );
            assert.equal(first.snapshot, second.snapshot);
            await assert.rejects(
              runWithErpDatabaseContext({ ...context, readOnly: false }, () =>
                runQuery(
                  "SELECT id FROM erp.contas_pagar WHERE empresa_id=$1",
                  [2],
                ),
              ),
              /Contexto diferente/,
            );
          });
          await assert.rejects(
            runQuery(
              "UPDATE erp.contas_pagar SET descricao=descricao WHERE empresa_id=$1 AND false",
              [2],
            ),
            (e) => (e as { code?: string }).code === "25006",
          );
        },
      );
    });
    const report = {
      status: "passed",
      checks,
      businessDataWrites: 0,
      realEmailsSent: 0,
    };
    mkdirSync(".cache/portaldocontador", { recursive: true });
    writeFileSync(
      ".cache/portaldocontador/smoke.json",
      JSON.stringify(report, null, 2),
    );
    console.log(JSON.stringify(report));
  } finally {
    await closePool();
  }
}
void main().catch((error) => {
  console.error(
    JSON.stringify({
      status: "failed",
      code: error.code,
      message: error.message,
      checks,
    }),
  );
  process.exitCode = 1;
});
