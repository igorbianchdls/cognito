import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { connection } from "../erp/evolution-db.mjs";
const migration = "20261009160000_portal_contador_access.sql",
  sql = readFileSync("supabase/migrations/" + migration, "utf8"),
  apply = process.argv.includes("--apply");
const dir = ".cache/portaldocontador/",
  c = connection();
mkdirSync(dir, { recursive: true });
const fingerprintSql = `SELECT (SELECT md5(coalesce(string_agg(md5(to_jsonb(t)::text),'' ORDER BY md5(to_jsonb(t)::text)),'')) FROM erp.contas_pagar t) pagar,
 (SELECT md5(coalesce(string_agg(md5(to_jsonb(t)::text),'' ORDER BY md5(to_jsonb(t)::text)),'')) FROM erp.contas_receber t) receber,
 (SELECT md5(coalesce(string_agg(md5(to_jsonb(t)::text),'' ORDER BY md5(to_jsonb(t)::text)),'')) FROM erp.pagamentos t) pagamentos,
 (SELECT md5(coalesce(string_agg(md5(to_jsonb(t)::text),'' ORDER BY md5(to_jsonb(t)::text)),'')) FROM erp.vendas t) vendas,
 (SELECT md5(coalesce(string_agg(md5(to_jsonb(t)::text),'' ORDER BY md5(to_jsonb(t)::text)),'')) FROM erp.compras t) compras`;
try {
  await c.connect();
  const present = (
    await c.query(
      "SELECT count(*)::int n FROM information_schema.columns WHERE table_schema='shared' AND column_name='acesso_portal_contador'",
    )
  ).rows[0].n;
  assert.equal(
    present,
    0,
    "Migração já aplicada; este executor não reaplica concessões.",
  );
  const tables = (
    await c.query(
      "SELECT tablename FROM pg_tables WHERE schemaname='shared' ORDER BY tablename",
    )
  ).rows;
  assert.equal(tables.length, 8);
  const fingerprint = (await c.query(fingerprintSql)).rows[0];
  if (apply) {
    const staged = JSON.parse(readFileSync(".cache/shared/deployment.json")),
      cfg = (await import("dotenv")).default.parse(readFileSync(".env.local"));
    const response = await fetch(
      `https://api.vercel.com/v13/deployments/${staged.id}?teamId=team_fI5lF5U1UZOCEfHWdB4QNpua`,
      {
        headers: { Authorization: "Bearer " + cfg.VERCEL_TOKEN },
        signal: AbortSignal.timeout(25000),
      },
    );
    assert(response.ok);
    const deployment = await response.json();
    assert.equal(deployment.readyState, "READY");
    assert.equal(deployment.projectId, "prj_mXGm0J5InfGNAR2lO4cHGLCrgoex");
    const backup = {
      at: new Date().toISOString(),
      tables: {},
      functions: (
        await c.query(
          "SELECT n.nspname,p.proname,pg_get_functiondef(p.oid) definition FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='shared' AND p.prokind='f'",
        )
      ).rows,
    };
    for (const { tablename } of tables) {
      assert(/^[a-z_]+$/.test(tablename));
      backup.tables[tablename] = (
        await c.query("SELECT * FROM shared." + tablename)
      ).rows;
    }
    mkdirSync("credentials/backups/portaldocontador", { recursive: true });
    const path =
      "credentials/backups/portaldocontador/" +
      new Date().toISOString().replaceAll(":", "-") +
      ".json";
    writeFileSync(path, JSON.stringify(backup));
    assert.deepEqual(
      JSON.parse(readFileSync(path)).tables.usuarios_empresas,
      JSON.parse(JSON.stringify(backup.tables.usuarios_empresas)),
    );
  }
  await c.query(sql.replace(/COMMIT;\s*$/, ""));
  const afterTables = (
    await c.query(
      "SELECT tablename FROM pg_tables WHERE schemaname='shared' ORDER BY tablename",
    )
  ).rows;
  assert.deepEqual(afterTables, tables);
  const caps = (
    await c.query(
      "SELECT capability FROM shared.permissoes_perfil WHERE perfil_acesso_id='contador' ORDER BY capability",
    )
  ).rows.map((r) => r.capability);
  assert.equal(caps.length, 5);
  assert(caps.every((cap) => cap.endsWith(".visualizar")));
  assert.equal(
    (
      await c.query(
        "SELECT count(*)::int n FROM shared.usuarios_empresas WHERE acesso_portal_contador",
      )
    ).rows[0].n,
    0,
  );
  const audit = (
    await c.query(
      "SELECT pg_get_functiondef('shared.auditar_acesso()'::regprocedure) definition",
    )
  ).rows[0].definition;
  for (const field of [
    "vendedor_id",
    "escopo_vendas",
    "desconto_maximo_percentual",
    "acesso_portal_contador",
  ])
    assert(audit.includes(field));
  assert.deepEqual((await c.query(fingerprintSql)).rows[0], fingerprint);
  await c.query(apply ? "COMMIT" : "ROLLBACK");
  const proof = {
    status: "passed",
    applied: apply,
    migration,
    digest: createHash("sha256").update(sql).digest("hex"),
    newTables: 0,
    newColumns: 2,
    existingSharedTables: 8,
    businessDataPreserved: true,
    at: new Date().toISOString(),
  };
  writeFileSync(
    dir + (apply ? "database-applied" : "database-check") + ".json",
    JSON.stringify(proof, null, 2),
  );
  console.log(JSON.stringify(proof));
  if (apply && process.argv.includes("--enable-owner")) {
    await c.query("BEGIN");
    await c.query(
      "SELECT set_config('app.shared_actor_id','3',true),set_config('app.shared_source','portal_initial_owner_access',true),set_config('app.shared_reason','Acesso do proprietário para validar o novo portal',true)",
    );
    const result = await c.query(
      "UPDATE shared.usuarios_empresas m SET acesso_portal_contador=true,metadata=m.metadata||jsonb_build_object('portalAccessManaged',true,'portalAccessManagedAt',now()),updated_at=now() FROM shared.usuarios u,shared.empresas e WHERE m.usuario_id=3 AND m.empresa_id=2 AND m.role='owner' AND m.status='active' AND NOT m.suspenso_localmente AND u.id=m.usuario_id AND u.status='active' AND u.clerk_user_id IS NOT NULL AND e.id=m.empresa_id AND e.status='active' AND e.clerk_organization_id=m.clerk_organization_id RETURNING m.role,m.perfil_acesso_id",
    );
    assert.equal(result.rowCount, 1);
    assert.equal(result.rows[0].role, "owner");
    assert.equal(result.rows[0].perfil_acesso_id, "administrador");
    await c.query("COMMIT");
    console.log(
      JSON.stringify({
        ownerPortalEnabled: true,
        erpProfilePreserved: true,
        companyId: 2,
        userId: 3,
      }),
    );
  }
} catch (error) {
  await c.query("ROLLBACK").catch(() => {});
  console.error(
    JSON.stringify({
      status: "failed",
      code: error.code || "ASSERTION",
      message: error.message,
    }),
  );
  process.exitCode = 1;
} finally {
  await c.end();
}
