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
  | 'flow'
  | 'e2e'
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
const INTERNAL_TEST_API_BASE = '/api/internal/observability/connectors/test'
const CONTA_AZUL_FLOW_TEST_API = `${INTERNAL_TEST_API_BASE}/conta-azul-flow`
const SELECTED_RESOURCES = [
  'clientes',
  'fornecedores',
  'empresa_conectada',
  'produtos',
  'produto_categorias',
  'produto_cest',
  'produto_ecommerce_marcas',
  'produto_ncm',
  'produto_unidades_medida',
  'categorias',
  'categorias_dre',
  'centros_custo',
  'contas_receber',
  'contas_pagar',
  'contas_financeiras',
  'saldos_contas_financeiras',
  'transferencias',
  'eventos_financeiros_alteracoes',
  'saldos_iniciais',
  'servicos',
  'vendedores',
  'vendas',
  'venda_detalhes',
  'itens_venda',
  'venda_proximo_numero',
  'contratos',
  'contrato_proximo_numero',
  'notas_fiscais',
  'notas_fiscais_servico',
]
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
  flow: { status: 'idle' },
  e2e: { status: 'idle' },
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

function getStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => toText(item)).filter(Boolean) : []
}

async function requestJson(url: string, init?: RequestInit) {
  const headers = new Headers(init?.headers)

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

function FlowSummary({ data }: { data: unknown }) {
  const flow = asRecord(asRecord(data).flow)
  const connection = asRecord(flow.connection)
  const destination = asRecord(flow.destination)
  const pipeline = asRecord(flow.pipeline)
  const datasets = asRecord(flow.datasets)
  const raw = asRecord(datasets.raw)
  const normalized = asRecord(datasets.normalized)
  const selectedRun = asRecord(flow.selectedRun)
  const issues = getStringArray(flow.issues)

  if (!Object.keys(flow).length) {
    return <p className="text-sm text-slate-500">Rode a verificacao para carregar o estado do fluxo.</p>
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Conexao" value={`${toText(connection.status) || '-'} #${toText(connection.id) || '-'}`} />
        <Metric label="Pipeline" value={`${toText(pipeline.status) || '-'} #${toText(pipeline.id) || '-'}`} />
        <Metric label="Destination" value={`${toText(destination.status) || '-'} #${toText(destination.id) || '-'}`} />
        <Metric label="Pode rodar E2E" value={flow.canRunE2E ? 'sim' : 'nao'} />
        <Metric label="Raw" value={`${raw.tableCount || 0} tabelas / ${raw.totalRows || 0} linhas`} />
        <Metric label="Normalized" value={`${normalized.tableCount || 0} tabelas / ${normalized.totalRows || 0} linhas`} />
        <Metric label="Recursos" value={getStringArray(flow.resources).length} />
        <Metric label="Ultima run" value={`${toText(selectedRun.status) || '-'} #${toText(selectedRun.id) || '-'}`} />
      </div>
      {issues.length ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
          {issues.map((issue) => (
            <div key={issue}>{issue}</div>
          ))}
        </div>
      ) : (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-700">
          Fluxo Conta Azul para BigQuery sem pendencias no diagnostico.
        </div>
      )}
    </div>
  )
}

export default function ConnectorsSmokeTestPage() {
  const [steps, setSteps] = useState<Record<StepKey, StepState>>(INITIAL_STEPS)
  const [tenantId, setTenantId] = useState<number | null>(null)
  const [connectionId, setConnectionId] = useState('')
  const [destinationId, setDestinationId] = useState('')
  const [pipelineId, setPipelineId] = useState('')
  const [e2eRunId, setE2eRunId] = useState('')

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

  function flowQuery(input?: { runId?: string }) {
    const query = new URLSearchParams()
    if (tenantId) query.set('tenantId', String(tenantId))
    if (connectionId) query.set('connectionId', connectionId)
    if (input?.runId) query.set('runId', input.runId)
    const suffix = query.toString()
    return suffix ? `?${suffix}` : ''
  }

  function adoptFlowIds(data: unknown) {
    const flow = asRecord(asRecord(data).flow)
    const connection = asRecord(flow.connection)
    const destination = asRecord(flow.destination)
    const pipeline = asRecord(flow.pipeline)
    const selectedRun = asRecord(flow.selectedRun)
    const nextTenantId = Number(flow.tenantId || 0)
    const nextConnectionId = toText(connection.id)
    const nextDestinationId = toText(destination.id)
    const nextPipelineId = toText(pipeline.id)
    const nextRunId = toText(selectedRun.id)

    if (nextTenantId > 0) setTenantId(nextTenantId)
    if (nextConnectionId) setConnectionId(nextConnectionId)
    if (nextDestinationId) setDestinationId(nextDestinationId)
    if (nextPipelineId) setPipelineId(nextPipelineId)
    if (nextRunId) setE2eRunId(nextRunId)
  }

  async function testContaAzulFlow(input?: { runId?: string }) {
    const data = await runStep('flow', () => requestJson(`${CONTA_AZUL_FLOW_TEST_API}${flowQuery(input)}`))
    adoptFlowIds(data)
    return data
  }

  async function triggerContaAzulE2E() {
    let completedRunId = ''
    await runStep('e2e', async () => {
      const initial = await requestJson(CONTA_AZUL_FLOW_TEST_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          connectionId: connectionId || undefined,
        }),
      })
      const result = asRecord(asRecord(initial).result)
      const runId = toText(result.runId)
      if (!runId) throw new Error('E2E nao retornou runId.')
      setE2eRunId(runId)
      completedRunId = runId

      let latest: unknown = initial
      for (let attempt = 0; attempt < 40; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 3000))
        latest = await requestJson(`${CONTA_AZUL_FLOW_TEST_API}${flowQuery({ runId })}`)
        const selectedRun = asRecord(asRecord(asRecord(latest).flow).selectedRun)
        const status = toText(selectedRun.status)
        if (status && !['queued', 'running'].includes(status)) {
          adoptFlowIds(latest)
          return latest
        }
      }

      throw new Error(`Timeout aguardando sync_run ${runId}.`)
    })
    await testContaAzulFlow({ runId: completedRunId || e2eRunId || undefined }).catch(() => undefined)
  }

  async function testTenant() {
    const data = await runStep('tenant', () => requestJson(`${INTERNAL_TEST_API_BASE}/tenant${tenantQuery}`))
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
            source: 'observability-connectors-test',
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
            datasetMode: 'per_tenant',
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
            source: 'observability-connectors-test',
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
          requestedBy: 'observability-connectors-test',
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
    await runStep('gcloud', () => requestJson(`${INTERNAL_TEST_API_BASE}/gcloud${tenantQuery}`))
  }

  async function testBigQuery() {
    await runStep('bigquery', () => requestJson(`${INTERNAL_TEST_API_BASE}/bigquery${tenantQuery}`))
  }

  async function testPlugin() {
    await runStep('plugin', async () => {
      if (!connectionId) throw new Error('connectionId ausente.')
      return requestJson(`${INTERNAL_TEST_API_BASE}/plugin`, {
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
    await testGcloud()
    await testContaAzulFlow()
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Plug className="h-4 w-4" />
              Internal observability
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
          <Metric label="e2e runId" value={e2eRunId || '-'} />
        </section>

        <section className="grid gap-4 xl:grid-cols-2">
          <div className="xl:col-span-2">
            <StepPanel
              title="Conta Azul para BigQuery"
              icon={<Workflow className="h-4 w-4" />}
              state={steps.flow}
              action={
                <div className="flex items-center gap-2">
                  <ActionButton disabled={busy} onClick={() => void testContaAzulFlow()}>
                    <Activity className="h-4 w-4" />
                    Verificar fluxo
                  </ActionButton>
                  <ActionButton disabled={busy} onClick={() => void triggerContaAzulE2E()}>
                    <RefreshCw className="h-4 w-4" />
                    Disparar E2E
                  </ActionButton>
                </div>
              }
            >
              <FlowSummary data={steps.flow.data} />
            </StepPanel>
          </div>

          <div className="xl:col-span-2">
            <StepPanel
              title="E2E sync real"
              icon={<RefreshCw className="h-4 w-4" />}
              state={steps.e2e}
              action={<ActionButton disabled={busy} onClick={() => void triggerContaAzulE2E()}>Disparar</ActionButton>}
            />
          </div>

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
