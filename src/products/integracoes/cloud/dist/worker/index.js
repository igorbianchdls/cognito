// src/products/integracoes/cloud/src/worker/index.ts
import { createServer } from "node:http";

// src/products/integracoes/cloud/src/worker/jobs/runSyncJob.ts
async function runSyncJob(input) {
  return {
    ok: true,
    mode: "stub",
    connectionId: input.connectionId,
    message: "Worker reservado. Nenhum ETL real foi executado."
  };
}

// src/products/integracoes/cloud/src/worker/index.ts
var syncTriggers = ["manual", "scheduled", "webhook", "initial"];
function parsePayloadFromEnv() {
  const rawPayload = process.env.SYNC_JOB_PAYLOAD?.trim();
  if (!rawPayload) return {};
  const payload = JSON.parse(rawPayload);
  return payload;
}
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function normalizePayload(value) {
  if (!isRecord(value)) return {};
  return {
    tenantId: typeof value.tenantId === "number" ? value.tenantId : void 0,
    connectionId: typeof value.connectionId === "string" ? value.connectionId : void 0,
    trigger: typeof value.trigger === "string" && syncTriggers.includes(value.trigger) ? value.trigger : void 0,
    resources: Array.isArray(value.resources) ? value.resources.filter((resource) => typeof resource === "string") : void 0
  };
}
function parsePubSubPushBody(body) {
  if (!isRecord(body)) return {};
  const pubSubBody = body;
  const encodedData = pubSubBody.message?.data;
  if (!encodedData) return normalizePayload(body);
  const decoded = Buffer.from(encodedData, "base64").toString("utf8").trim();
  if (!decoded) return {};
  return normalizePayload(JSON.parse(decoded));
}
function readRequestBody(request) {
  return new Promise((resolve) => {
    const chunks = [];
    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => {
      const rawBody = Buffer.concat(chunks).toString("utf8").trim();
      if (!rawBody) {
        resolve(void 0);
        return;
      }
      try {
        resolve(JSON.parse(rawBody));
      } catch {
        resolve(rawBody);
      }
    });
    request.on("error", () => resolve(void 0));
  });
}
function parseTrigger(value) {
  if (value && syncTriggers.includes(value)) {
    return value;
  }
  return "manual";
}
async function executeWorker(payload) {
  const result = await runSyncJob({
    tenantId: payload.tenantId || Number(process.env.SYNC_TENANT_ID || 1),
    connectionId: payload.connectionId || process.env.SYNC_CONNECTION_ID || "stub",
    trigger: payload.trigger || parseTrigger(process.env.SYNC_TRIGGER),
    resources: payload.resources
  });
  console.log(JSON.stringify({
    severity: "INFO",
    message: "Integration worker finished.",
    result
  }));
  return result;
}
async function main() {
  return executeWorker(parsePayloadFromEnv());
}
function startHttpServer() {
  const port = Number(process.env.PORT || 8080);
  const httpServer = createServer(async (request, response) => {
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    if (request.method === "GET" && url.pathname === "/health") {
      response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ ok: true, service: "integracoes-worker", mode: "stub" }));
      return;
    }
    if (request.method !== "POST" || url.pathname !== "/pubsub") {
      response.writeHead(404, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ ok: false, error: "Rota worker nao encontrada." }));
      return;
    }
    try {
      const result = await executeWorker(parsePubSubPushBody(await readRequestBody(request)));
      response.writeHead(204);
      response.end();
      void result;
    } catch (error) {
      console.error(JSON.stringify({
        severity: "ERROR",
        message: "Integration worker HTTP request failed.",
        error: error instanceof Error ? error.message : String(error)
      }));
      response.writeHead(500, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ ok: false, error: "Falha ao processar mensagem Pub/Sub." }));
    }
  });
  httpServer.listen(port, "0.0.0.0");
  return httpServer;
}
if (process.env.WORKER_HTTP_SERVER === "true" || process.env.PORT) {
  startHttpServer();
} else {
  void main().catch((error) => {
    console.error(JSON.stringify({
      severity: "ERROR",
      message: "Integration worker failed.",
      error: error instanceof Error ? error.message : String(error)
    }));
    process.exit(1);
  });
}
export {
  main,
  startHttpServer
};
