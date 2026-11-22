'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Card, Notice, Page } from '@/products/analytics/frontend/ui'
import { cleanDomain, mergeSettings, type PlayerSettings } from '../shared/settings'
import { deniedMessage, supabase } from './supabase'
import { SettingsForm } from './SettingsForm'

type Domain = { id: string; domain: string }

/** The company's player default and the domains where its videos may play. */
export function CompanySettingsView() {
  const { orgId, isLoaded } = useAuth()
  const [settings, setSettings] = useState<PlayerSettings | null>(null)
  const [domains, setDomains] = useState<Domain[]>([])
  const [newDomain, setNewDomain] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const fetchAll = useCallback(async () => {
    if (!orgId) return null
    const [p, d] = await Promise.all([
      supabase().from('presets').select('settings').eq('workspace_id', orgId).maybeSingle(),
      supabase().from('domains').select('id, domain').eq('workspace_id', orgId).order('domain'),
    ])
    return { settings: mergeSettings(p.data?.settings), domains: (d.data ?? []) as Domain[] }
  }, [orgId])
  const apply = (r: Awaited<ReturnType<typeof fetchAll>>) => { if (r) { setSettings(r.settings); setDomains(r.domains) } }
  useEffect(() => {
    if (!isLoaded) return
    let live = true
    void fetchAll().then(r => { if (live) apply(r) })
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- apply only sets state
  }, [isLoaded, fetchAll])

  if (!settings) return <Page title="Configurações"><Notice>Carregando…</Notice></Page>
  return (
    <Page title="Configurações" subtitle="O padrão do player para todos os vídeos da empresa e onde eles podem tocar.">
      {message ? <div className="mb-4 rounded-xl border border-[#ececec] bg-white px-4 py-3 text-[14px]" role="status">{message}</div> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Padrão do player">
          <SettingsForm value={settings} onChange={setSettings} />
          <button type="button" onClick={async () => {
            const { error } = await supabase().from('presets').upsert({ workspace_id: orgId, settings })
            setMessage(error ? deniedMessage(error, 'Não foi possível salvar.') : 'Padrão salvo. Vale para os vídeos que usam o padrão da empresa.')
          }} className="mt-4 h-10 rounded-lg bg-[#111] px-4 text-[14px] font-medium text-white">Salvar padrão</button>
        </Card>
        <Card title="Domínios">
          <p className="mb-3 text-[13px] text-[#666]">Os vídeos só tocam nestes sites (e subdomínios). Sem nenhum, tocam em qualquer site que tiver o código.</p>
          {!domains.length ? <p className="mb-3 rounded-lg bg-[#fff7e6] px-3 py-2 text-[13px] text-[#8a5a00]">Nenhum domínio cadastrado: qualquer site pode usar seus vídeos.</p> : null}
          <ul className="mb-3 grid gap-1.5">
            {domains.map(d => (
              <li key={d.id} className="flex items-center justify-between rounded-lg border border-[#ececec] px-3 py-2 text-[14px]">
                {d.domain}
                <button type="button" onClick={async () => { const { error } = await supabase().from('domains').delete().eq('id', d.id); setMessage(error ? deniedMessage(error, 'Não foi possível remover.') : null); apply(await fetchAll()) }} className="text-[13px] text-[#a33] underline">Remover</button>
              </li>
            ))}
          </ul>
          <form className="flex gap-2" onSubmit={async e => {
            e.preventDefault()
            const d = cleanDomain(newDomain)
            if (!d) return setMessage('Domínio inválido. Ex.: minhapagina.com.br')
            const { error } = await supabase().from('domains').insert({ workspace_id: orgId, domain: d })
            setMessage(error ? (error.code === '23505' ? 'Esse domínio já está na lista.' : deniedMessage(error, 'Não foi possível adicionar.')) : null)
            if (!error) setNewDomain('')
            apply(await fetchAll())
          }}>
            <input value={newDomain} onChange={e => setNewDomain(e.target.value)} placeholder="minhapagina.com.br" className="h-10 min-w-0 flex-1 rounded-lg border border-[#e2e2e2] px-3 text-[14px]" />
            <button type="submit" className="h-10 rounded-lg bg-[#111] px-4 text-[14px] font-medium text-white">Adicionar</button>
          </form>
        </Card>
      </div>
    </Page>
  )
}
