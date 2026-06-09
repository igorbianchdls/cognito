'use client'

import { useMemo, useState, type ReactNode } from 'react'
import {
  Activity,
  Boxes,
  CheckCircle2,
  Cloud,
  Database,
  FileJson,
  Link2,
  Loader2,
  Plug,
  RefreshCw,
  ShieldCheck,
  TriangleAlert,
  Workflow,
} from 'lucide-react'

type StepStatus = 'idle' | 'running' | 'ok' | 'error'

type StepState = {
  status: StepStatus
  data?: unknown
  error?: string
  updatedAt?: string
}

type StepKey =
  | 'tenant'
  | 'providers'
  | 'connections'
  | 'createConnection'
  | 'destination'
  | 'pipeline'
  | 'permissions'
  | 'sync'
  | 'detail'
  | 'gcloud'
  | 'bigquery'
  | 'plugin'

type JsonRecord = Record<string, unknown>

const CONTA_AZUL_PROVIDER = 'conta_azul'
const SELECTED_RESOURCES = ['clientes', 'fornecedores', 'produtos', 'contas_receber', 'contas_pagar', 'vendas', 'estoque']
const PLUGIN_READ_RESOURCES = [
  '*',
  'clientes',
  'fornecedores',
  'produtos',
  'contas-a-receber',
  'contas-a-pagar',
  'pedidos-venda',
  'estoque-atual',
  'contas_receber',
  'contas_pagar',
  'vendas',
  'estoque',
]

const INITIAL_STEPS: Record<StepKey, StepState> = {
  tenant: { status: 'idle' },
  providers: { status: 'idle' },
  connections: { status: 'idle' },
  createConnection: { status: 'idle' },
  destination: { status: 'idle' },
  pipeline: { status: 'idle' },
  permissions: { status: 'idle' },
  sync: { status: 'idle' },
  detail: { status: 'idle' },
  gcloud: { status: 'idle' },
  bigquery: { status: 'idle' },
  plugin: { status: 'idle' },
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as JsonRecord : {}
}

function toText(value: unknown) {
  return String(value ?? '').trim()
}

function getArray(value: unknown): JsonRecord[] {
  return Array.isArray(value) ? value.filter((item): item is JsonRecord => Boolean(item && typeof item === 'object')) : []
}

async function requestJson(url: string, init?: RequestInit) {
  const headers = new Headers(init?.headers)
  // TEMPORARIO: remover junto com o bypass smoke_test depois dos testes Conta Azul em producao.
  headers.set('x-integracoes-smoke-test', 'conta-azul-tenant-1')

  const response = await fetch(url, {
    ...init,
    headers,
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok || asRecord(payload).ok === false) {
    throw new Error(toText(asRecord(payload).error) || `HTTP ${response.status}`)
  }
  return payload
}

function formatJson(value: unknown) {
  return JSON.stringify(value, null, 2)
}

function getTone(status: StepStatus) {
  if (status === 'ok') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'error') return 'border-red-200 bg-red-50 text-red-700'
  if (status === 'running') return 'border-sky-200 bg-sky-50 text-sky-700'
  return 'border-slate-200 bg-white text-slate-700'
}

function StatusIcon({ status }: { status: StepStatus }) {
  if (status === 'running') return <Loader2 className="h-4 w-4 animate-spin" />
  if (status === 'ok') return <CheckCircle2 className="h-4 w-4" />
  if (status === 'error') return <TriangleAlert className="h-4 w-4" />
  return <Activity className="h-4 w-4" />
}

function StepPanel({
  action,
  children,
  icon,
  state,
  title,
}: {
  action: ReactNode
  children?: ReactNode
  icon: ReactNode
  state: StepState
  title: string
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-700">
            {icon}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-slate-950">{title}</h2>
            {state.updatedAt ? <p className="text-xs text-slate-500">{state.updatedAt}</p> : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`inline-flex h-8 items-center gap-1 rounded-md border px-2 text-xs font-medium ${getTone(state.status)}`}>
            <StatusIcon status={state.status} />
            {state.status}
          </span>
          {action}
        </div>
      </div>
      <div className="space-y-3 p-4">
        {children}
        {state.error ? (
          <pre className="max-h-40 overflow-auto rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-800">{state.error}</pre>
        ) : null}
        {state.data ? (
          <details className="rounded-md border border-slate-200 bg-slate-50">
            <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-slate-700">JSON</summary>
            <pre className="max-h-72 overflow-auto border-t border-slate-200 p-3 text-xs text-slate-700">{formatJson(state.data)}</pre>
          </details>
        ) : null}
      </div>
    </section>
  )
}

function ActionButton({
  children,
  disabled,
  onClick,
}: {
  children: ReactNode
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-8 items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-xs font-medium text-slate-800 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  )
}

function Metric({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-slate-950">{toText(value) || '-'}</p>
    </div>
  )
}

export default function IntegracoesTestePage() {
  const [steps, setSteps] = useState<Record<StepKey, StepState>>(INITIAL_STEPS)
  const [tenantId, setTenantId] = useState<number | null>(null)
  const [connectionId, setConnectionId] = useState('')
  const [destinationId, setDestinationId] = useState('')
  const [pipelineId, setPipelineId] = useState('')

  const busy = useMemo(() => Object.values(steps).some((step) => step.status === 'running'), [steps])
  const tenantQuery = tenantId ? `?tenantId=${tenantId}` : ''

  function setStep(key: StepKey, next: StepState) {
    setSteps((current) => ({
      ...current,
      [key]: {
        ...next,
        updatedAt: new Date().toLocaleTimeString(),
      },
    }))
  }

  async function runStep(key: StepKey, fn: () => Promise<unknown>) {
    setStep(key, { status: 'running' })
    try {
      const data = await fn()
      setStep(key, { status: 'ok', data })
      return data
    } catch (error) {
      setStep(key, {
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  async function testTenant() {
    const data = await runStep('tenant', () => requestJson(`/api/integracoes/test/tenant${tenantQuery}`))
    const resolvedTenantId = Number(asRecord(asRecord(data).tenant).tenantId || 0)
    if (resolvedTenantId > 0) setTenantId(resolvedTenantId)
  }

  async function testProviders() {
    await runStep('providers', async () => {
      const data = await requestJson('/api/integracoes/providers?domain=erp')
      const providers = getArray(asRecord(data).providers)
      const contaAzul = providers.find((provider) => provider.slug === CONTA_AZUL_PROVIDER)
      if (!contaAzul) throw new Error('Provider conta_azul nao encontrado no catalogo.')
      return { contaAzul, providers: providers.map((provider) => provider.slug) }
    })
  }

  async function listConnections() {
    const data = await runStep('connections', async () => {
      const suffix = tenantId ? `&tenantId=${tenantId}` : ''
      const payload = await requestJson(`/api/integracoes/connections?domain=erp&provider=${CONTA_AZUL_PROVIDER}&limit=20${suffix}`)
      const connections = getArray(asRecord(payload).connections)
      return { connections }
    })
    const firstConnection = getArray(asRecord(data).connections)[0]
    const nextConnectionId = toText(firstConnection?.id)
    if (nextConnectionId) setConnectionId(nextConnectionId)
    return nextConnectionId
  }

  async function createConnection() {
    const data = await runStep('createConnection', async () => {
      const payload = await requestJson('/api/integracoes/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          provider: CONTA_AZUL_PROVIDER,
          displayName: 'Conta Azul smoke test',
          selectedResources: SELECTED_RESOURCES,
          syncFrequency: 'manual',
          syncModes: ['manual'],
          metadata: {
            smokeTest: true,
            source: 'integracoes-teste',
          },
        }),
      })
      return payload
    })
    const connection = asRecord(asRecord(data).connection)
    const nextConnectionId = toText(connection.id)
    if (nextConnectionId) setConnectionId(nextConnectionId)
    return nextConnectionId
  }

  async function ensureDestination() {
    const data = await runStep('destination', async () => {
      const suffix = tenantId ? `?tenantId=${tenantId}&type=bigquery` : '?type=bigquery'
      const existing = await requestJson(`/api/integracoes/destinations${suffix}`)
      const firstDestination = getArray(asRecord(existing).destinations)[0]
      if (firstDestination?.id) return { destination: firstDestination, reused: true }

      const created = await requestJson('/api/integracoes/destinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          type: 'bigquery',
          name: 'BigQuery smoke test',
          status: 'active',
          config: {
            projectId: 'creatto-463117',
            dataset: 'integrations_custom_raw',
          },
          metadata: {
            smokeTest: true,
            isDefault: true,
          },
        }),
      })
      return { destination: asRecord(created).destination, reused: false }
    })
    const destination = asRecord(asRecord(data).destination)
    const nextDestinationId = toText(destination.id)
    if (nextDestinationId) setDestinationId(nextDestinationId)
    return nextDestinationId
  }

  async function ensurePipeline(input?: { connectionId?: string; destinationId?: string }) {
    const data = await runStep('pipeline', async () => {
      const effectiveConnectionId = input?.connectionId || connectionId
      const effectiveDestinationId = input?.destinationId || destinationId
      if (!effectiveConnectionId) throw new Error('connectionId ausente.')
      if (!effectiveDestinationId) throw new Error('destinationId ausente.')

      const query = new URLSearchParams({
        sourceConnectionId: effectiveConnectionId,
        destinationId: effectiveDestinationId,
      })
      if (tenantId) query.set('tenantId', String(tenantId))
      const existing = await requestJson(`/api/integracoes/pipelines?${query.toString()}`)
      const firstPipeline = getArray(asRecord(existing).pipelines)[0]
      if (firstPipeline?.id) return { pipeline: firstPipeline, reused: true }

      const created = await requestJson('/api/integracoes/pipelines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          sourceConnectionId: effectiveConnectionId,
          destinationId: effectiveDestinationId,
          name: 'Conta Azul para BigQuery',
          status: 'active',
          selectedResources: SELECTED_RESOURCES,
          syncFrequency: 'manual',
          syncEnabled: true,
          metadata: {
            smokeTest: true,
          },
        }),
      })
      return { pipeline: asRecord(created).pipeline, reused: false }
    })
    const pipeline = asRecord(asRecord(data).pipeline)
    const nextPipelineId = toText(pipeline.id)
    if (nextPipelineId) setPipelineId(nextPipelineId)
    return nextPipelineId
  }

  async function enablePlugin(inputConnectionId = connectionId) {
    await runStep('permissions', async () => {
      if (!inputConnectionId) throw new Error('connectionId ausente.')
      return requestJson(`/api/integracoes/connections/${encodeURIComponent(inputConnectionId)}/plugin-permissions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          enabled: true,
          readResources: PLUGIN_READ_RESOURCES,
          liveReadResources: ['clientes'],
          writeResources: [],
          destructiveResources: [],
          requireConfirmation: true,
          metadata: {
            smokeTest: true,
            source: 'integracoes-teste',
          },
        }),
      })
    })
  }

  async function triggerSync() {
    await runStep('sync', async () => {
      if (!connectionId) throw new Error('connectionId ausente.')
      return requestJson(`/api/integracoes/connections/${encodeURIComponent(connectionId)}/sync`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          pipelineId: pipelineId || undefined,
          destinationId: destinationId || undefined,
          trigger: 'manual',
          resources: ['clientes'],
          requestedBy: 'integracoes-teste',
        }),
      })
    })
  }

  async function refreshDetail() {
    await runStep('detail', async () => {
      if (!connectionId) throw new Error('connectionId ausente.')
      const suffix = tenantId ? `?tenantId=${tenantId}` : ''
      return requestJson(`/api/integracoes/connections/${encodeURIComponent(connectionId)}${suffix}`)
    })
  }

  async function testGcloud() {
    await runStep('gcloud', () => requestJson(`/api/integracoes/test/gcloud${tenantQuery}`))
  }

  async function testBigQuery() {
    await runStep('bigquery', () => requestJson(`/api/integracoes/test/bigquery${tenantQuery}`))
  }

  async function testPlugin() {
    await runStep('plugin', async () => {
      if (!connectionId) throw new Error('connectionId ausente.')
      return requestJson('/api/integracoes/test/plugin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          connectionId,
          provider: CONTA_AZUL_PROVIDER,
          action: 'listar',
          resource: 'clientes',
          limit: 5,
        }),
      })
    })
  }

  async function runCoreFlow() {
    await testTenant()
    await testProviders()
    let nextConnectionId = connectionId || await listConnections()
    if (!nextConnectionId) nextConnectionId = await createConnection()
    const nextDestinationId = destinationId || await ensureDestination()
    const nextPipelineId = pipelineId || await ensurePipeline({
      connectionId: nextConnectionId,
      destinationId: nextDestinationId,
    })
    if (nextPipelineId) setPipelineId(nextPipelineId)
    await enablePlugin(nextConnectionId)
    await testGcloud()
    await testBigQuery()
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Plug className="h-4 w-4" />
              Integracoes
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-normal text-slate-950">Teste de fluxo Conta Azul</h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ActionButton disabled={busy} onClick={() => void runCoreFlow()}>
              <RefreshCw className="h-4 w-4" />
              Rodar base
            </ActionButton>
            <ActionButton disabled={busy} onClick={() => setSteps(INITIAL_STEPS)}>
              <FileJson className="h-4 w-4" />
              Limpar logs
            </ActionButton>
          </div>
        </header>

        <section className="grid gap-3 md:grid-cols-3">
          <Metric label="tenantId" value={tenantId || '-'} />
          <Metric label="connectionId" value={connectionId || '-'} />
          <Metric label="destinationId / pipelineId" value={[destinationId, pipelineId].filter(Boolean).join(' / ') || '-'} />
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <StepPanel
            title="Tenant e membership"
            icon={<ShieldCheck className="h-4 w-4" />}
            state={steps.tenant}
            action={<ActionButton disabled={busy} onClick={() => void testTenant()}>Testar</ActionButton>}
          />

          <StepPanel
            title="Provider Conta Azul"
            icon={<Boxes className="h-4 w-4" />}
            state={steps.providers}
            action={<ActionButton disabled={busy} onClick={() => void testProviders()}>Testar</ActionButton>}
          />

          <StepPanel
            title="Conexoes"
            icon={<Link2 className="h-4 w-4" />}
            state={steps.connections}
            action={<ActionButton disabled={busy} onClick={() => void listConnections()}>Listar</ActionButton>}
          >
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <input
                value={connectionId}
                onChange={(event) => setConnectionId(event.target.value)}
                placeholder="connectionId"
                className="h-9 rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500"
              />
              <ActionButton disabled={busy} onClick={() => void createConnection()}>Criar</ActionButton>
            </div>
          </StepPanel>

          <StepPanel
            title="Destino BigQuery"
            icon={<Database className="h-4 w-4" />}
            state={steps.destination}
            action={<ActionButton disabled={busy} onClick={() => void ensureDestination()}>Garantir</ActionButton>}
          />

          <StepPanel
            title="Pipeline"
            icon={<Workflow className="h-4 w-4" />}
            state={steps.pipeline}
            action={<ActionButton disabled={busy || !connectionId || !destinationId} onClick={() => void ensurePipeline()}>Garantir</ActionButton>}
          />

          <StepPanel
            title="Permissoes do plugin"
            icon={<ShieldCheck className="h-4 w-4" />}
            state={steps.permissions}
            action={<ActionButton disabled={busy || !connectionId} onClick={() => void enablePlugin()}>Ativar</ActionButton>}
          />

          <StepPanel
            title="GCloud control-api"
            icon={<Cloud className="h-4 w-4" />}
            state={steps.gcloud}
            action={<ActionButton disabled={busy} onClick={() => void testGcloud()}>Testar</ActionButton>}
          />

          <StepPanel
            title="BigQuery datasets"
            icon={<Database className="h-4 w-4" />}
            state={steps.bigquery}
            action={<ActionButton disabled={busy} onClick={() => void testBigQuery()}>Testar</ActionButton>}
          />

          <StepPanel
            title="Disparo de sync"
            icon={<RefreshCw className="h-4 w-4" />}
            state={steps.sync}
            action={<ActionButton disabled={busy || !connectionId} onClick={() => void triggerSync()}>Disparar</ActionButton>}
          />

          <StepPanel
            title="Eventos e runs"
            icon={<Activity className="h-4 w-4" />}
            state={steps.detail}
            action={<ActionButton disabled={busy || !connectionId} onClick={() => void refreshDetail()}>Atualizar</ActionButton>}
          />

          <div className="xl:col-span-2">
            <StepPanel
              title="Plugin connected_erp"
              icon={<Plug className="h-4 w-4" />}
              state={steps.plugin}
              action={<ActionButton disabled={busy || !connectionId} onClick={() => void testPlugin()}>Testar</ActionButton>}
            />
          </div>
        </section>
      </div>
    </main>
  )
}
