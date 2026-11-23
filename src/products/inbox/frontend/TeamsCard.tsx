'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useAuth, useOrganization } from '@clerk/nextjs'
import { Card } from '@/products/analytics/frontend/ui'
import { deniedMessage, supabase } from './data'

type Team = { id: string; name: string; auto_assign: boolean; sla_minutes: number | null }
type Member = { team_id: string; user_id: string; available: boolean }
type Channel = { id: string; name: string; team_id: string | null }

const input = 'h-8 rounded-lg border border-[#e2e2e2] bg-white px-2 text-[13px] text-[#111]'

/** Teams, who answers in each, which channels they own, the response-time limit and the end-of-conversation rating. */
export function TeamsCard() {
  const { orgId, isLoaded } = useAuth()
  const { memberships } = useOrganization({ memberships: { pageSize: 100 } })
  const people = useMemo(() => (memberships?.data ?? []).map(m => ({ id: m.publicUserData?.userId ?? '', name: [m.publicUserData?.firstName, m.publicUserData?.lastName].filter(Boolean).join(' ') || m.publicUserData?.identifier || 'Pessoa' })).filter(p => p.id), [memberships?.data])
  const [teams, setTeams] = useState<Team[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [channels, setChannels] = useState<Channel[]>([])
  const [settings, setSettings] = useState({ sla_minutes: '', csat_enabled: false, csat_text: '' })
  const [message, setMessage] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const reload = () => setVersion(v => v + 1)

  const load = useCallback(async () => {
    if (!orgId) return null
    const [t, m, c, s] = await Promise.all([
      supabase().from('teams').select('id, name, auto_assign, sla_minutes').eq('workspace_id', orgId).order('name'),
      supabase().from('team_members').select('team_id, user_id, available').eq('workspace_id', orgId),
      supabase().from('channels').select('id, name, team_id').eq('workspace_id', orgId).neq('status', 'desconectado').order('name'),
      supabase().from('settings').select('sla_minutes, csat_enabled, csat_text').eq('workspace_id', orgId).maybeSingle(),
    ])
    return { teams: (t.data ?? []) as Team[], members: (m.data ?? []) as Member[], channels: (c.data ?? []) as Channel[], settings: s.data as { sla_minutes: number | null; csat_enabled: boolean; csat_text: string | null } | null }
  }, [orgId])
  useEffect(() => {
    if (!isLoaded) return
    let live = true
    void load().then(r => {
      if (!live || !r) return
      setTeams(r.teams); setMembers(r.members); setChannels(r.channels)
      setSettings({ sla_minutes: r.settings?.sla_minutes ? String(r.settings.sla_minutes) : '', csat_enabled: r.settings?.csat_enabled ?? false, csat_text: r.settings?.csat_text ?? '' })
    })
    return () => { live = false }
  }, [isLoaded, load, version])

  const done = (error: { code?: string; message?: string } | null, ok: string) => { setMessage(error ? deniedMessage(error, 'Não foi possível salvar.') : ok); if (!error) reload() }
  async function addTeam() {
    const name = window.prompt('Nome do time (ex.: Vendas, Suporte)')?.trim()
    if (!name) return
    const { error } = await supabase().from('teams').insert({ workspace_id: orgId, name })
    done(error, 'Time criado.')
  }
  async function saveTeam(t: Team, fields: Partial<Team>) { const { error } = await supabase().from('teams').update(fields).eq('id', t.id); done(error, 'Time salvo.') }
  async function toggleMember(teamId: string, uid: string, on: boolean) {
    const { error } = on ? await supabase().from('team_members').delete().eq('team_id', teamId).eq('user_id', uid)
      : await supabase().from('team_members').insert({ workspace_id: orgId, team_id: teamId, user_id: uid })
    done(error, on ? 'Pessoa removida do time.' : 'Pessoa adicionada ao time.')
  }
  async function setAvailable(m: Member, available: boolean) { const { error } = await supabase().from('team_members').update({ available }).eq('team_id', m.team_id).eq('user_id', m.user_id); done(error, available ? 'Disponível.' : 'Ausente: não recebe conversas novas.') }
  async function setChannelTeam(channelId: string, teamId: string) { const { error } = await supabase().from('channels').update({ team_id: teamId || null }).eq('id', channelId); done(error, 'Canal atualizado.') }
  async function saveSettings() {
    const minutes = settings.sla_minutes.trim() ? Number(settings.sla_minutes) : null
    if (minutes !== null && (!Number.isInteger(minutes) || minutes < 1 || minutes > 10080)) return setMessage('Prazo em minutos, de 1 a 10080.')
    const { error } = await supabase().from('settings').upsert({ workspace_id: orgId, sla_minutes: minutes, csat_enabled: settings.csat_enabled, csat_text: settings.csat_text.trim() || null })
    done(error, 'Ajustes salvos.')
  }

  return (
    <Card title="Times e distribuição">
      {message ? <p role="status" className="mb-3 text-[13px]">{message}</p> : null}
      <div className="grid gap-4 text-[13px]">
        {!teams.length ? <p className="text-[#777]">Crie um time para distribuir as conversas novas automaticamente entre quem está disponível (uma para cada, em rodízio).</p> : null}
        {teams.map(t => {
          const inTeam = members.filter(m => m.team_id === t.id)
          return (
            <div key={t.id} className="rounded-lg border border-[#ececec] p-3">
              <div className="flex flex-wrap items-center gap-2">
                <b className="text-[14px]">{t.name}</b>
                <label className="ml-auto inline-flex items-center gap-1.5"><input type="checkbox" checked={t.auto_assign} onChange={e => void saveTeam(t, { auto_assign: e.target.checked })} />Distribuir automaticamente</label>
                <label className="inline-flex items-center gap-1.5">Prazo
                  <input type="number" min={1} defaultValue={t.sla_minutes ?? ''} placeholder="padrão" onBlur={e => { const v = e.target.value ? Number(e.target.value) : null; if (v !== t.sla_minutes) void saveTeam(t, { sla_minutes: v }) }} className={`${input} w-20`} />min</label>
                <button type="button" onClick={async () => { if (!window.confirm(`Excluir o time ${t.name}? As conversas continuam com quem está.`)) return; const { error } = await supabase().from('teams').delete().eq('id', t.id); done(error, 'Time excluído.') }} className="text-[12px] text-[#a33] underline">Excluir</button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {people.map(p => { const m = inTeam.find(x => x.user_id === p.id); return (
                  <span key={p.id} className="inline-flex items-center overflow-hidden rounded-full border text-[12px]" style={m ? { borderColor: '#111' } : { borderColor: '#e2e2e2', color: '#777' }}>
                    <button type="button" aria-pressed={!!m} onClick={() => void toggleMember(t.id, p.id, !!m)} className={`px-2.5 py-0.5 ${m ? 'bg-[#111] text-white' : ''}`}>{p.name}</button>
                    {m ? <button type="button" title={m.available ? 'Disponível: clique para ficar ausente' : 'Ausente: clique para ficar disponível'}
                      onClick={() => void setAvailable(m, !m.available)} className="px-1.5 py-0.5">{m.available ? '🟢' : '⚪'}</button> : null}
                  </span>) })}
              </div>
              <p className="mt-2 text-[12px] text-[#777]">{inTeam.length ? `${inTeam.filter(m => m.available).length} de ${inTeam.length} disponível(is). 🟢 recebe conversas novas, ⚪ ausente.` : 'Clique nos nomes para colocar no time.'}</p>
            </div>
          )
        })}
        <button type="button" onClick={() => void addTeam()} className="h-8 w-fit rounded-lg border border-[#e2e2e2] px-3">+ Novo time</button>
        {teams.length && channels.length ? (
          <div>
            <p className="mb-1 font-medium">Quem cuida de cada canal</p>
            <div className="grid gap-1.5">{channels.map(c => (
              <label key={c.id} className="flex items-center gap-2"><span className="min-w-0 flex-1 truncate">{c.name}</span>
                <select value={c.team_id ?? ''} onChange={e => void setChannelTeam(c.id, e.target.value)} className={input}><option value="">Sem time</option>{teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select>
              </label>))}</div>
          </div>
        ) : null}
        <div className="grid gap-2 border-t border-[#f0f0f0] pt-3">
          <label className="flex items-center gap-2">Prazo para responder (padrão)
            <input type="number" min={1} value={settings.sla_minutes} onChange={e => setSettings({ ...settings, sla_minutes: e.target.value })} placeholder="sem prazo" className={`${input} w-24`} />min</label>
          <p className="text-[12px] text-[#777]">Passou do prazo sem resposta de uma pessoa, a conversa ganha a marca “Atrasada” e uma nota.</p>
          <label className="flex items-center gap-2"><input type="checkbox" checked={settings.csat_enabled} onChange={e => setSettings({ ...settings, csat_enabled: e.target.checked })} />Pedir avaliação (1 a 5) ao encerrar a conversa</label>
          {settings.csat_enabled ? <input value={settings.csat_text} onChange={e => setSettings({ ...settings, csat_text: e.target.value })} placeholder="Como você avalia nosso atendimento? Responda com uma nota de 1 a 5." className={`${input} w-full`} /> : null}
          <button type="button" onClick={() => void saveSettings()} className="h-8 w-fit rounded-lg bg-[#111] px-4 font-medium text-white">Salvar</button>
        </div>
      </div>
    </Card>
  )
}
