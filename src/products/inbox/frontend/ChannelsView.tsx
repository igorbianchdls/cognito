'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Card, Notice, Page } from '@/products/analytics/frontend/ui'
import { CHANNEL_LABEL } from '../shared/rules'
import { deniedMessage, post, supabase, type Channel } from './data'
import { IntegrationsCard } from './IntegrationsCard'

const STATUS: Record<Channel['status'], { label: string; cls: string }> = {
  conectado: { label: 'Conectado', cls: 'bg-[#e8f7ee] text-[#166534]' }, erro: { label: 'Com erro', cls: 'bg-[#fdf2f2] text-[#8a2b2b]' }, desconectado: { label: 'Desconectado', cls: 'bg-[#f3f3f3] text-[#555]' },
}
const input = 'mt-1 h-9 w-full rounded-lg border border-[#e2e2e2] px-3 text-[14px] text-[#111]'

/** Connected numbers and accounts, how to connect new ones, and the test channel. */
export function ChannelsView() {
  const { orgId, isLoaded } = useAuth()
  const [channels, setChannels] = useState<Channel[] | null>(null)
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null)
  const [version, setVersion] = useState(0)
  const [busy, setBusy] = useState(false)
  const [wa, setWa] = useState({ nome: '', phoneNumberId: '', businessAccountId: '', token: '' })
  const [showWa, setShowWa] = useState(false)
  const [origin, setOrigin] = useState('')

  const fetchAll = useCallback(async () => {
    if (!orgId) return null
    const { data } = await supabase().from('channels').select('id, kind, name, external_id, display, status, last_error, created_at').eq('workspace_id', orgId).order('created_at')
    return (data ?? []) as Channel[]
  }, [orgId])
  useEffect(() => {
    if (!isLoaded) return
    let live = true
    void fetchAll().then(r => { if (live && r) { setChannels(r); setOrigin(window.location.origin) } })
    return () => { live = false }
  }, [isLoaded, fetchAll, version])
  const reload = () => setVersion(v => v + 1)

  async function run(fn: () => Promise<string>) {
    setBusy(true)
    try { setMessage({ text: await fn() }); reload() } catch (e) { setMessage({ text: (e as Error).message, error: true }) } finally { setBusy(false) }
  }

  if (!channels) return <Page title="Canais"><Notice>Carregando…</Notice></Page>
  return (
    <Page title="Canais" subtitle="Os números e contas que a equipe atende pelo Inbox.">
      {message ? <div role={message.error ? 'alert' : 'status'} className={`mb-4 rounded-xl border px-4 py-3 text-[14px] ${message.error ? 'border-[#f3d2d2] bg-[#fdf6f6] text-[#8a2b2b]' : 'border-[#ececec] bg-white'}`}>{message.text}</div> : null}

      <div className="grid gap-3">
        {!channels.length ? <Notice>Nenhum canal ainda. Comece por um canal de teste ou conecte um número de WhatsApp abaixo.</Notice> : null}
        {channels.map(ch => <ChannelCard key={ch.id} channel={ch} onChanged={reload} onMessage={setMessage} />)}
      </div>

      <h2 className="mb-3 mt-8 text-[16px] font-semibold text-[#111]">Conectar</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title="WhatsApp">
          <p className="text-[13px] text-[#555]">API oficial da Meta (WhatsApp Cloud API). A conexão em um clique chega quando o app da Meta for aprovado; até lá, use os dados do painel do app.</p>
          {!showWa ? <button type="button" onClick={() => setShowWa(true)} className="mt-3 h-9 rounded-lg bg-[#111] px-4 text-[14px] font-medium text-white">Conectar número</button> : (
            <form className="mt-3 grid gap-2" onSubmit={e => { e.preventDefault(); void run(async () => {
              const r = await post<{ numero: string; aviso: string | null }>('/api/inbox/canais', { tipo: 'whatsapp', ...wa })
              setWa({ nome: '', phoneNumberId: '', businessAccountId: '', token: '' }); setShowWa(false)
              return r.aviso ?? `WhatsApp ${r.numero} conectado.`
            }) }}>
              <label className="text-[13px] text-[#555]">Nome no Otto<input value={wa.nome} onChange={e => setWa({ ...wa, nome: e.target.value })} placeholder="Atendimento" className={input} /></label>
              <label className="text-[13px] text-[#555]">ID do número de telefone<input value={wa.phoneNumberId} onChange={e => setWa({ ...wa, phoneNumberId: e.target.value })} inputMode="numeric" required className={input} /></label>
              <label className="text-[13px] text-[#555]">ID da conta do WhatsApp Business<input value={wa.businessAccountId} onChange={e => setWa({ ...wa, businessAccountId: e.target.value })} inputMode="numeric" required className={input} /></label>
              <label className="text-[13px] text-[#555]">Token de acesso<input value={wa.token} onChange={e => setWa({ ...wa, token: e.target.value })} type="password" autoComplete="off" required className={input} /></label>
              <p className="text-[12px] text-[#777]">Ficam em Meta for Developers → seu app → WhatsApp → Configuração da API. Use um token permanente de usuário do sistema; o token temporário vence em 24 horas. Ele é guardado cifrado e nunca aparece de novo.</p>
              <div className="flex gap-2">
                <button type="submit" disabled={busy} className="h-9 rounded-lg bg-[#111] px-4 text-[14px] font-medium text-white disabled:opacity-50">{busy ? 'Conferindo com a Meta…' : 'Conectar'}</button>
                <button type="button" onClick={() => setShowWa(false)} className="h-9 rounded-lg border border-[#e2e2e2] px-4 text-[14px]">Cancelar</button>
              </div>
            </form>
          )}
        </Card>
        <Card title="Canal de teste">
          <p className="text-[13px] text-[#555]">Simula um canal para conhecer o Inbox sem a Meta: você escreve como se fosse o cliente e responde pela caixa de entrada.</p>
          <button type="button" disabled={busy} onClick={() => void run(async () => { await post('/api/inbox/canais', { tipo: 'teste', nome: 'Canal de teste' }); return 'Canal de teste criado, com uma conversa de exemplo na caixa de entrada.' })}
            className="mt-3 h-9 rounded-lg border border-[#e2e2e2] px-4 text-[14px] disabled:opacity-50">Criar canal de teste</button>
        </Card>
        <Card title="Instagram e Messenger">
          <p className="text-[13px] text-[#555]">Mensagens do Direct e da página do Facebook. A conexão precisa do app da Meta aprovado com as permissões de mensagens; o Inbox já recebe e responde por esses canais quando eles forem conectados.</p>
          <span className="mt-3 inline-block rounded-full bg-[#f3f3f3] px-3 py-1 text-[12px] text-[#555]">Aguardando o app da Meta</span>
        </Card>
        <Card title="Webhook da Meta">
          <p className="text-[13px] text-[#555]">No app da Meta, em Webhooks, use este endereço e o token de verificação configurado no servidor (INBOX_META_VERIFY_TOKEN). Assine <b>messages</b> no WhatsApp e <b>messages</b> e <b>messaging_postbacks</b> no Instagram e na página.</p>
          <code className="mt-3 block break-all rounded-lg bg-[#f6f6f6] px-3 py-2 text-[12px]">{origin}/api/inbox/webhook/meta</code>
        </Card>
      </div>
      <div className="mt-8"><IntegrationsCard /></div>
    </Page>
  )
}

function ChannelCard({ channel: ch, onChanged, onMessage }: { channel: Channel; onChanged: () => void; onMessage: (m: { text: string; error?: boolean }) => void }) {
  const [name, setName] = useState(ch.name)
  const [sim, setSim] = useState({ nome: 'Cliente de exemplo', texto: '' })
  const [busy, setBusy] = useState(false)
  async function rename() {
    if (name.trim() === ch.name || !name.trim()) return setName(ch.name)
    const { error } = await supabase().from('channels').update({ name: name.trim().slice(0, 80) }).eq('id', ch.id)
    onMessage(error ? { text: deniedMessage(error, 'Não foi possível renomear.'), error: true } : { text: 'Nome atualizado.' })
    if (error) setName(ch.name); else onChanged()
  }
  async function act(acao: 'desconectar' | 'reconectar') {
    if (acao === 'desconectar' && !window.confirm(`Desconectar "${ch.name}"? Ele para de receber e enviar mensagens, e o token é esquecido. O histórico de conversas fica guardado.`)) return
    try { await post(`/api/inbox/canais/${ch.id}`, { acao }); onMessage({ text: acao === 'desconectar' ? 'Canal desconectado. O histórico continua na caixa de entrada.' : 'Canal reconectado.' }); onChanged() }
    catch (error) { onMessage({ text: (error as Error).message, error: true }) }
  }
  async function remove() {
    const typed = window.prompt(`Excluir "${ch.name}" DE VEZ? Todas as conversas, mensagens e arquivos recebidos por ele serão apagados do Otto, sem volta. ${ch.kind === 'teste' ? '' : 'O número continua funcionando na Meta. '}Para confirmar, digite EXCLUIR.`)
    if (typed?.trim().toUpperCase() !== 'EXCLUIR') return
    const response = await fetch(`/api/inbox/canais/${ch.id}`, { method: 'DELETE' })
    const data = await response.json().catch(() => ({})) as { erro?: string }
    onMessage(response.ok ? { text: 'Canal excluído.' } : { text: data.erro ?? 'Não foi possível excluir.', error: true })
    if (response.ok) onChanged()
  }
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <input value={name} onChange={e => setName(e.target.value)} onBlur={() => void rename()} onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
            aria-label="Nome do canal" className="w-full max-w-sm rounded-md border border-transparent px-1 text-[15px] font-semibold text-[#111] hover:border-[#e2e2e2] focus:border-[#e2e2e2]" />
          <p className="px-1 text-[13px] text-[#666]">{CHANNEL_LABEL[ch.kind]}{ch.display ? ` · ${ch.display}` : ''}</p>
          {ch.last_error && ch.status !== 'conectado' ? <p className="px-1 text-[13px] text-[#8a2b2b]">{ch.last_error}</p> : null}
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[12px] font-medium ${STATUS[ch.status].cls}`}>{STATUS[ch.status].label}</span>
        {ch.status === 'desconectado'
          ? (ch.kind === 'teste' ? <button type="button" onClick={() => void act('reconectar')} className="text-[13px] text-[#2563eb] underline">Reconectar</button> : <span className="text-[12px] text-[#777]">Para reconectar, use Conectar número</span>)
          : <button type="button" onClick={() => void act('desconectar')} className="text-[13px] text-[#555] underline">Desconectar</button>}
        <button type="button" onClick={() => void remove()} className="text-[13px] text-[#a33] underline">Excluir</button>
      </div>
      {ch.kind === 'teste' && ch.status !== 'desconectado' ? (
        <form className="mt-3 flex flex-wrap gap-2 border-t border-[#f3f3f3] pt-3" onSubmit={async e => {
          e.preventDefault(); setBusy(true)
          try { await post(`/api/inbox/canais/${ch.id}/simular`, sim); setSim({ ...sim, texto: '' }); onMessage({ text: `Mensagem de ${sim.nome} enviada para a caixa de entrada.` }) }
          catch (error) { onMessage({ text: (error as Error).message, error: true }) } finally { setBusy(false) }
        }}>
          <input value={sim.nome} onChange={e => setSim({ ...sim, nome: e.target.value })} aria-label="Nome do cliente" className="h-9 w-44 rounded-lg border border-[#e2e2e2] px-3 text-[14px]" />
          <input value={sim.texto} onChange={e => setSim({ ...sim, texto: e.target.value })} placeholder="Mensagem do cliente…" aria-label="Mensagem do cliente" className="h-9 min-w-0 flex-1 rounded-lg border border-[#e2e2e2] px-3 text-[14px]" />
          <button type="submit" disabled={busy || !sim.texto.trim()} className="h-9 rounded-lg bg-[#111] px-4 text-[14px] font-medium text-white disabled:opacity-50">Simular mensagem</button>
        </form>
      ) : null}
    </Card>
  )
}
