'use client'

import { useCallback, useEffect, useState } from 'react'
import { Check, RefreshCw, ShieldCheck, Unplug, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

type Connection = {
  id: string
  provider: string
  status: string
  write_enabled: boolean
  user_name: string
  user_email: string
  last_used_at?: string | null
}

type Approval = {
  id: string
  tool_name: string
  preview: Record<string, unknown>
  status: string
  requested_by_name: string
  requested_at: string
  expires_at: string
}

export default function AiIntegrationsPanel() {
  const [connections, setConnections] = useState<Connection[]>([])
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [connectionsResponse, approvalsResponse] = await Promise.all([
        fetch('/api/ai/connections', { cache: 'no-store' }),
        fetch('/api/ai/approvals', { cache: 'no-store' }),
      ])
      if (!connectionsResponse.ok || !approvalsResponse.ok) throw new Error('Nao foi possivel carregar as integracoes.')
      setConnections((await connectionsResponse.json()).records || [])
      setApprovals((await approvalsResponse.json()).records || [])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Falha ao carregar.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  async function patch(url: string, body: Record<string, unknown>) {
    const response = await fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!response.ok) throw new Error((await response.json()).error || 'Nao foi possivel concluir a acao.')
    await load()
  }

  const pending = approvals.filter((approval) => approval.status === 'pending')

  return (
    <div className="min-h-full bg-[#f7f8fa] px-5 py-7 text-[#202124] lg:px-10">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-start justify-between gap-4 border-b border-[#dfe1e5] pb-6">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase text-[#0b6bcb]">Configuracoes</p>
            <h1 className="text-3xl font-semibold tracking-normal">Integracoes de IA</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f6368]">Controle as conexoes do ChatGPT e Claude e aprove operacoes sensiveis antes que elas alterem o financeiro.</p>
          </div>
          <Button variant="outline" size="icon" title="Atualizar" onClick={() => void load()} disabled={loading}><RefreshCw className={loading ? 'animate-spin' : ''} /></Button>
        </header>

        {error && <div className="mb-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        <section className="mb-10">
          <div className="mb-3 flex items-center gap-2"><ShieldCheck className="size-5 text-[#0b6bcb]" /><h2 className="text-lg font-semibold">Aprovacoes pendentes</h2></div>
          <div className="overflow-hidden border border-[#dfe1e5] bg-white">
            {pending.length === 0 ? <p className="px-5 py-8 text-sm text-[#5f6368]">Nenhuma operacao aguardando aprovacao.</p> : pending.map((approval) => (
              <div key={approval.id} className="flex flex-col gap-4 border-b border-[#eceff1] px-5 py-4 last:border-0 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0"><p className="font-medium">{approval.tool_name}</p><p className="mt-1 text-sm text-[#5f6368]">Solicitada por {approval.requested_by_name} · expira em {new Date(approval.expires_at).toLocaleString('pt-BR')}</p></div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => void patch('/api/ai/approvals', { id: approval.id, decision: 'rejected' })}><X />Recusar</Button>
                  <Button onClick={() => void patch('/api/ai/approvals', { id: approval.id, decision: 'approved' })}><Check />Aprovar</Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Conexoes autorizadas</h2>
          <div className="overflow-hidden border border-[#dfe1e5] bg-white">
            {connections.length === 0 ? <p className="px-5 py-8 text-sm text-[#5f6368]">Nenhum cliente de IA conectado.</p> : connections.map((connection) => (
              <div key={connection.id} className="grid gap-4 border-b border-[#eceff1] px-5 py-4 last:border-0 md:grid-cols-[1fr_auto_auto] md:items-center">
                <div><p className="font-medium capitalize">{connection.provider}</p><p className="mt-1 text-sm text-[#5f6368]">{connection.user_name || connection.user_email} · {connection.status}</p></div>
                <label className="flex items-center gap-3 text-sm"><Switch checked={connection.write_enabled} disabled={connection.status !== 'active'} onCheckedChange={(checked) => void patch('/api/ai/connections', { id: connection.id, writeEnabled: checked })} />Permitir escrita</label>
                <Button variant="outline" disabled={connection.status === 'revoked'} onClick={() => void patch('/api/ai/connections', { id: connection.id, status: 'revoked', writeEnabled: false })}><Unplug />Revogar</Button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
