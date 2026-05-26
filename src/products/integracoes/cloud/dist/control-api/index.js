// src/products/integracoes/cloud/src/control-api/index.ts
import { createServer } from "node:http";

// src/products/integracoes/cloud/src/control-api/routes/callbacks.ts
async function handleProviderCallback(_request) {
  return {
    status: 202,
    body: {
      ok: true,
      mode: "stub",
      message: "Callback cloud reservado para OAuth futuro."
    }
  };
}

// src/products/integracoes/cloud/src/control-api/routes/connections.ts
async function handleConnectionSetup(_request) {
  return {
    status: 202,
    body: {
      ok: true,
      mode: "stub",
      message: "Setup cloud reservado. A implementacao real sera adicionada quando Google Cloud entrar."
    }
  };
}

// src/products/integracoes/cloud/src/control-api/routes/health.ts
async function handleHealthCheck() {
  return {
    status: 200,
    body: {
      ok: true,
      service: "integracoes-control-api",
      mode: "stub"
    }
  };
}

// src/products/integracoes/cloud/src/config/gcpConfig.ts
function env(name, fallback) {
  return process.env[name]?.trim() || fallback;
}
function getIntegrationsCloudConfig() {
  return {
    projectId: env("GCP_PROJECT_ID", "creatto-463117"),
    region: env("GCP_REGION", "southamerica-east1"),
    artifactRegistryRepo: env("ARTIFACT_REGISTRY_REPO", "integrations"),
    bigQuery: {
      customRawDataset: env("BIGQUERY_CUSTOM_RAW_DATASET", "integrations_custom_raw"),
      fivetranRawDataset: env("BIGQUERY_FIVETRAN_RAW_DATASET", "integrations_fivetran_raw"),
      normalizedDataset: env("BIGQUERY_NORMALIZED_DATASET", "integrations_normalized")
    },
    pubSub: {
      syncTopic: env("PUBSUB_SYNC_TOPIC", "integrations-sync-requests"),
      deadLetterTopic: env("PUBSUB_DEAD_LETTER_TOPIC", "integrations-sync-dead-letter"),
      workerSubscription: env("PUBSUB_WORKER_SUBSCRIPTION", "integrations-sync-worker-sub")
    },
    secrets: {
      internalApiKey: env("SECRET_INTERNAL_API_KEY", "integrations-internal-api-key"),
      prefix: env("SECRET_PREFIX", "integrations")
    },
    serviceAccounts: {
      controlApi: env("CONTROL_API_SERVICE_ACCOUNT", "integrations-control-api"),
      worker: env("WORKER_SERVICE_ACCOUNT", "integrations-worker")
    }
  };
}

// src/products/integracoes/cloud/src/lib/pubsub.ts
async function getCloudRunAccessToken() {
  const response = await fetch("http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token", {
    headers: {
      "Metadata-Flavor": "Google"
    },
    signal: AbortSignal.timeout(5e3)
  });
  if (!response.ok) {
    throw new Error(`Falha ao obter token da metadata server: ${response.status}`);
  }
  const payload = await response.json();
  if (!payload.access_token) {
    throw new Error("Metadata server nao retornou access_token");
  }
  return payload.access_token;
}
async function publishSyncMessage(input) {
  const config = getIntegrationsCloudConfig();
  const accessToken = await getCloudRunAccessToken();
  const topic = `projects/${config.projectId}/topics/${config.pubSub.syncTopic}`;
  const data = Buffer.from(JSON.stringify({
    type: "integration.sync.requested",
    tenantId: input.tenantId,
    connectionId: input.connectionId,
    trigger: input.trigger,
    resources: input.resources || [],
    requestedBy: input.requestedBy || "control-api",
    requestedAt: (/* @__PURE__ */ new Date()).toISOString()
  })).toString("base64");
  const response = await fetch(`https://pubsub.googleapis.com/v1/${topic}:publish`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messages: [{
        data,
        attributes: {
          tenantId: String(input.tenantId),
          connectionId: input.connectionId,
          trigger: input.trigger
        }
      }]
    })
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error?.message || `Falha ao publicar no Pub/Sub: ${response.status}`);
  }
  const messageId = payload.messageIds?.[0];
  if (!messageId) {
    throw new Error("Pub/Sub nao retornou messageId");
  }
  return {
    ok: true,
    messageId,
    mode: "pubsub",
    topic: config.pubSub.syncTopic
  };
}

// src/products/integracoes/cloud/src/control-api/routes/sync.ts
var syncTriggers = ["manual", "scheduled", "webhook", "initial"];
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function parseSyncDispatchBody(body) {
  if (!isRecord(body)) return {};
  return {
    tenantId: typeof body.tenantId === "number" ? body.tenantId : void 0,
    connectionId: typeof body.connectionId === "string" ? body.connectionId : void 0,
    trigger: typeof body.trigger === "string" && syncTriggers.includes(body.trigger) ? body.trigger : void 0,
    resources: Array.isArray(body.resources) ? body.resources.filter((resource) => typeof resource === "string") : void 0,
    requestedBy: typeof body.requestedBy === "string" ? body.requestedBy : void 0
  };
}
async function handleSyncDispatch(request) {
  try {
    const body = parseSyncDispatchBody(request.body);
    if (!body.tenantId || !body.connectionId) {
      return {
        status: 400,
        body: {
          ok: false,
          error: "tenantId e connectionId sao obrigatorios para despachar sync."
        }
      };
    }
    const publish = await publishSyncMessage({
      tenantId: body.tenantId,
      connectionId: body.connectionId,
      trigger: body.trigger || "manual",
      resources: body.resources,
      requestedBy: body.requestedBy
    });
    return {
      status: 202,
      body: {
        ok: true,
        mode: publish.mode,
        message: "Sync publicado no Pub/Sub.",
        messageId: publish.messageId,
        topic: publish.topic
      }
    };
  } catch (error) {
    return {
      status: 500,
      body: {
        ok: false,
        error: error instanceof Error ? error.message : "Falha ao despachar sync."
      }
    };
  }
}

// src/products/integracoes/cloud/src/lib/internalAuth.ts
import { timingSafeEqual } from "node:crypto";
function headerValue(headers, name) {
  if (!headers) return void 0;
  const value = headers[name] || headers[name.toLowerCase()];
  if (Array.isArray(value)) return value[0];
  return value;
}
function safeEquals(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}
function getInternalApiKey() {
  const value = process.env.INTEGRATIONS_INTERNAL_API_KEY?.trim();
  return value || null;
}
function isInternalRequestAuthorized(headers) {
  const expected = getInternalApiKey();
  if (!expected) return false;
  const authorization = headerValue(headers, "authorization")?.trim();
  const bearerPrefix = "Bearer ";
  if (authorization?.startsWith(bearerPrefix)) {
    return safeEquals(authorization.slice(bearerPrefix.length).trim(), expected);
  }
  const apiKey = headerValue(headers, "x-internal-api-key")?.trim();
  return Boolean(apiKey && safeEquals(apiKey, expected));
}

// src/products/integracoes/cloud/src/control-api/server.ts
function createControlApiServer() {
  return {
    async handle(request) {
      if (request.path === "/health") return handleHealthCheck();
      if ((request.path === "/connections/setup" || request.path === "/sync") && !isInternalRequestAuthorized(request.headers)) {
        return {
          status: 401,
          body: {
            ok: false,
            error: "Token interno ausente ou invalido."
          }
        };
      }
      if (request.path === "/connections/setup") return handleConnectionSetup(request);
      if (request.path === "/callbacks/provider") return handleProviderCallback(request);
      if (request.path === "/sync") return handleSyncDispatch(request);
      return {
        status: 404,
        body: {
          ok: false,
          error: "Rota cloud de integracoes nao encontrada"
        }
      };
    }
  };
}

// src/products/integracoes/cloud/src/control-api/index.ts
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
function main() {
  const controlApi = createControlApiServer();
  const port = Number(process.env.PORT || 8080);
  const httpServer = createServer(async (request, response) => {
    const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
    const result = await controlApi.handle({
      method: request.method || "GET",
      path: url.pathname,
      headers: request.headers,
      body: await readRequestBody(request)
    });
    response.writeHead(result.status, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify(result.body));
  });
  httpServer.listen(port, "0.0.0.0");
  return httpServer;
}
void main();
export {
  main
};
