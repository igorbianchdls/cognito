export type IntegrationsCloudConfig = {
  projectId: string
  region: string
  artifactRegistryRepo: string
  bigQuery: {
    customRawDataset: string
    fivetranRawDataset: string
    normalizedDataset: string
  }
  pubSub: {
    syncTopic: string
    deadLetterTopic: string
    workerSubscription: string
  }
  secrets: {
    internalApiKey: string
    prefix: string
  }
  serviceAccounts: {
    controlApi: string
    worker: string
  }
}

function env(name: string, fallback: string): string {
  return process.env[name]?.trim() || fallback
}

export function getIntegrationsCloudConfig(): IntegrationsCloudConfig {
  return {
    projectId: env('GCP_PROJECT_ID', 'creatto-463117'),
    region: env('GCP_REGION', 'southamerica-east1'),
    artifactRegistryRepo: env('ARTIFACT_REGISTRY_REPO', 'integrations'),
    bigQuery: {
      customRawDataset: env('BIGQUERY_CUSTOM_RAW_DATASET', 'integrations_custom_raw'),
      fivetranRawDataset: env('BIGQUERY_FIVETRAN_RAW_DATASET', 'integrations_fivetran_raw'),
      normalizedDataset: env('BIGQUERY_NORMALIZED_DATASET', 'integrations_normalized'),
    },
    pubSub: {
      syncTopic: env('PUBSUB_SYNC_TOPIC', 'integrations-sync-requests'),
      deadLetterTopic: env('PUBSUB_DEAD_LETTER_TOPIC', 'integrations-sync-dead-letter'),
      workerSubscription: env('PUBSUB_WORKER_SUBSCRIPTION', 'integrations-sync-worker-sub'),
    },
    secrets: {
      internalApiKey: env('SECRET_INTERNAL_API_KEY', 'integrations-internal-api-key'),
      prefix: env('SECRET_PREFIX', 'integrations'),
    },
    serviceAccounts: {
      controlApi: env('CONTROL_API_SERVICE_ACCOUNT', 'integrations-control-api'),
      worker: env('WORKER_SERVICE_ACCOUNT', 'integrations-worker'),
    },
  }
}

export function getSecretName(parts: Array<string | number>): string {
  const config = getIntegrationsCloudConfig()
  return [config.secrets.prefix, ...parts].map((part) => String(part).trim()).filter(Boolean).join('/')
}
