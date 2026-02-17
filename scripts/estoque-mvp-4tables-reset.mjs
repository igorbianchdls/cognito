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

async function main() {
  loadEnvFiles();

  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.error("SUPABASE_DB_URL ausente (adicione em .env.local).");
    process.exit(1);
  }

  let client = null;
  for (let attempt = 1; attempt <= 12; attempt += 1) {
    client = new Client({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
    });
    try {
      await client.connect();
      break;
    } catch (error) {
      await client.end().catch(() => {});
      if (attempt === 12) throw error;
      const ms = 1500 * attempt;
      console.warn(`Conexão falhou (tentativa ${attempt}/12). Retentando em ${ms}ms...`);
      await new Promise((resolve) => setTimeout(resolve, ms));
      client = null;
    }
  }

  if (!client) {
    throw new Error("Não foi possível conectar no banco");
  }

  try {
    await client.query("BEGIN");

    // Remove tabelas fora do escopo MVP (4 tabelas).
    await client.query("DROP TABLE IF EXISTS estoque.transferencias_itens");
    await client.query("DROP TABLE IF EXISTS estoque.transferencias_estoque");
    await client.query("DROP TABLE IF EXISTS estoque.inventarios_itens");
    await client.query("DROP TABLE IF EXISTS estoque.inventarios");
    await client.query("DROP TABLE IF EXISTS estoque.custos_estoque");

    // Limpa todos os dados das tabelas que permanecem.
    await client.query(`
      TRUNCATE TABLE
        estoque.estoques_atual,
        estoque.movimentacoes_estoque,
        estoque.tipos_movimentacao,
        estoque.almoxarifados
      RESTART IDENTITY CASCADE
    `);

    await client.query("COMMIT");
    console.log("Reset MVP do estoque concluído (4 tabelas mantidas, dados limpos).");
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
