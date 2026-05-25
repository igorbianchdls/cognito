import { runSyncJob } from '@/products/integracoes/cloud/src/worker/jobs/runSyncJob'

export async function main() {
  return runSyncJob({
    tenantId: 1,
    connectionId: 'stub',
    trigger: 'manual',
  })
}

void main()
