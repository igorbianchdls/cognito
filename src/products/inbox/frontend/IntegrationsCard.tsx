'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Card } from '@/products/analytics/frontend/ui'
import { deniedMessage, post, supabase } from './data'

type Provider = 'hotmart' | 'kiwify' | 'eduzz' | 'stripe'
type Integration = { id: string; provider: Provider; name: string; token: string; status: 'ativa' | 'pausada'; last_event_at: string | null; last_error: string | null; events: number }
const LABEL: Record<Provider, string> = { hotmart: 'Hotmart', kiwify: 'Kiwify', eduzz: 'Eduzz', stripe: 'Stripe' }
const HELP: Record<Provider, { secret: string; where: string; events: string }> = {
  hotmart: { secret: 'Hottok', where: 'Hotmart → Ferramentas → Webhook (API e notificações) → Cadastrar webhook. Copie o Hottok de lá.', events: 'Compra aprovada, completa, boleto impresso, reembolsada, cancelada, chargeback e abandono de carrinho.' },
  kiwify: { secret: 'Token do webhook', where: 'Kiwify → Apps → Webhooks → Criar webhook. Use o token que a Kiwify mostra.', events: 'Compra aprovada, reembolso, chargeback, pix/boleto gerado e carrinho abandonado.' },
  eduzz: { secret: 'Chave de assinatura', where: 'Eduzz (Console do desenvolvedor) → Webhooks → Nova URL. Copie a chave de assinatura.', events: 'Fatura paga, aberta, reembolsada, cancelada e abandono de carrinho.' },
  stripe: { secret: 'Signing secret (whsec_…)', where: 'Stripe → Developers → Webhooks → Add endpoint. Depois de criar, revele o Signing secret.', events: 'checkout.session.completed, checkout.session.async_payment_succeeded, checkout.session.expired, charge.refunded e charge.dispute.created.' },
}
const input = 'mt-1 h-9 w-full rounded-lg border border-[#e2e2e2] px-3 text-[14px] text-[#111]'

/** Sales platforms: purchases, refunds and abandoned carts reach the contact and start automations. */
export function IntegrationsCard() {
  const { orgId, isLoaded } = useAuth()
  const [list, setList] = useState<Integration[]>([])
  const [version, setVersion] = useState(0)
  const [form, setForm] = useState<{ provider: Provider; nome: string; segredo: string }>({ provider: 'hotmart', nome: '', segredo: '' })
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null)
  const [origin, setOrigin] = useState('')
  useEffect(() => {
    if (!isLoaded || !orgId) return
    let live = true
    void supabase().from('integrations').select('id, provider, name, token, status, last_event_at, last_error, events').eq('workspace_id', orgId).order('created_at')
      .then(r => { if (live) { setList((r.data ?? []) as Integration[]); setOrigin(window.location.origin) } })
    return () => { live = false }
  }, [isLoaded, orgId, version])
  async function create(e: React.FormEvent) {
    e.preventDefault()
    try {
      await post('/api/inbox/integracoes', form)
      setForm({ ...form, nome: '', segredo: '' }); setVersion(v => v + 1)
      setMessage({ text: `${LABEL[form.provider]} conectado. Agora cole o endereço abaixo no webhook da plataforma.` })
    } catch (error) { setMessage({ text: (error as Error).message, error: true }) }
  }
  const help = HELP[form.provider]
  return (
    <Card title="Integrações de venda">
      <p className="mb-3 text-[13px] text-[#555]">Compras, reembolsos e carrinhos abandonados entram na ficha do contato (pelo e-mail ou telefone) e podem iniciar automações.</p>
      {message ? <p role={message.error ? 'alert' : 'status'} className={`mb-3 rounded-lg px-3 py-2 text-[13px] ${message.error ? 'bg-[#fdf2f2] text-[#8a2b2b]' : 'bg-[#f2f7ff] text-[#1d4ed8]'}`}>{message.text}</p> : null}
      <ul className="mb-4 grid gap-2">
        {list.map(i => (
          <li key={i.id} className="rounded-lg border border-[#ececec] px-3 py-2 text-[13px]">
            <div className="flex flex-wrap items-center gap-2">
              <b>{i.name}</b><span className="text-[#888]">{LABEL[i.provider]}</span>
              <span className={`rounded-full px-2 py-0.5 text-[11px] ${i.status === 'ativa' ? 'bg-[#e8f7ee] text-[#166534]' : 'bg-[#f3f3f3] text-[#555]'}`}>{i.status === 'ativa' ? 'Ativa' : 'Pausada'}</span>
              <span className="ml-auto flex gap-3">
                <button type="button" className="underline" onClick={async () => { const { error } = await supabase().from('integrations').update({ status: i.status === 'ativa' ? 'pausada' : 'ativa' }).eq('id', i.id); if (error) setMessage({ text: deniedMessage(error, 'Não foi possível mudar.'), error: true }); setVersion(v => v + 1) }}>{i.status === 'ativa' ? 'Pausar' : 'Ativar'}</button>
                <button type="button" className="underline" onClick={async () => { const segredo = window.prompt(`Novo ${HELP[i.provider].secret}:`); if (!segredo) return; try { await post(`/api/inbox/integracoes/${i.id}`, { segredo }); setMessage({ text: 'Segredo trocado.' }); setVersion(v => v + 1) } catch (error) { setMessage({ text: (error as Error).message, error: true }) } }}>Trocar segredo</button>
                <button type="button" className="text-[#a33] underline" onClick={async () => { if (!window.confirm(`Desligar ${i.name}? As compras já registradas continuam nas fichas.`)) return; const { error } = await supabase().from('integrations').delete().eq('id', i.id); if (error) setMessage({ text: deniedMessage(error, 'Não foi possível excluir.'), error: true }); setVersion(v => v + 1) }}>Excluir</button>
              </span>
            </div>
            <code className="mt-1 block break-all rounded bg-[#f6f6f6] px-2 py-1 text-[11.5px]">{origin}/api/inbox/vendas/{i.token}</code>
            <p className="mt-1 text-[12px] text-[#777]">{i.events ? `${i.events} evento(s) recebidos · último em ${new Date(i.last_event_at!).toLocaleString('pt-BR')}` : 'Nenhum evento recebido ainda.'}</p>
            {i.last_error ? <p className="text-[12px] text-[#a12b2b]">Último erro: {i.last_error}</p> : null}
          </li>
        ))}
        {!list.length ? <li className="text-[13px] text-[#888]">Nenhuma plataforma conectada.</li> : null}
      </ul>
      <form onSubmit={create} className="grid gap-2 rounded-xl bg-[#f7f7f8] p-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-[13px] text-[#555]">Plataforma<select value={form.provider} onChange={e => setForm({ ...form, provider: e.target.value as Provider })} className={input}>
            {Object.entries(LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></label>
          <label className="text-[13px] text-[#555]">Nome no Otto<input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder={`${LABEL[form.provider]} – curso principal`} className={input} /></label>
        </div>
        <label className="text-[13px] text-[#555]">{help.secret}<input value={form.segredo} onChange={e => setForm({ ...form, segredo: e.target.value })} type="password" autoComplete="off" required className={input} /></label>
        <p className="text-[12px] text-[#777]">{help.where} Eventos usados: {help.events} O segredo fica cifrado e não aparece de novo.</p>
        <button type="submit" className="h-9 rounded-lg bg-[#111] px-4 text-[14px] font-medium text-white">Conectar {LABEL[form.provider]}</button>
      </form>
    </Card>
  )
}
