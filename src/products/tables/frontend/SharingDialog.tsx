'use client'
import { useState } from 'react'
import { Building2, Lock, X } from 'lucide-react'
import { ROLE_LABELS, BASE_ROLES, type BaseRole, type Sharing } from '../shared/contracts'
import { send, useResource, type TablesApi } from './client'
import { Modal } from './dialogs'

type Row = { usuario_id: string; papel: BaseRole }
const ROLE_HINT: Record<BaseRole, string> = { leitor: 'Só consulta', editor: 'Edita registros e visualizações', administrador: 'Também muda a estrutura e o compartilhamento' }

/** Who opens the base and with which role. Company owners and admins always administer every base. */
export function SharingDialog({ api, baseId, onClose, onSaved }: { api: TablesApi; baseId: string; onClose: () => void; onSaved: () => void }) {
  const [revision, setRevision] = useState(0)
  const resource = useResource<Sharing>(api, `/bases/${baseId}/compartilhamento`, revision)
  const [draft, setDraft] = useState<{ version: number; acesso: Sharing['acesso']; rows: Row[] } | null>(null)
  const [busy, setBusy] = useState(false), [error, setError] = useState<string | null>(null), [adding, setAdding] = useState('')
  const data = resource.data
  const current = draft && data && draft.version === data.versao ? draft : data ? { version: data.versao, acesso: data.acesso, rows: data.membros.filter(m => !m.administrador_empresa).map(m => ({ usuario_id: m.id, papel: m.papel })) } : null
  const admin = data?.papel === 'administrador'
  const person = (id: string) => data?.pessoas.find(p => p.id === id)
  const change = (next: Partial<NonNullable<typeof current>>) => current && setDraft({ ...current, ...next })
  const companyAdmins = data?.membros.filter(m => m.administrador_empresa) ?? []
  const available = data?.pessoas.filter(p => !companyAdmins.some(a => a.id === p.id) && !current?.rows.some(r => r.usuario_id === p.id)) ?? []

  async function save() {
    if (!current) return
    setBusy(true); setError(null)
    try { await api(`/bases/${baseId}/compartilhamento`, send('PUT', { acesso: current.acesso, membros: current.rows, expectedVersion: current.version })); setDraft(null); setRevision(v => v + 1); onSaved() }
    catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível salvar.'); setRevision(v => v + 1) }
    finally { setBusy(false) }
  }

  return <Modal title="Compartilhar base" description={admin ? 'Escolha quem abre esta base e o que cada pessoa pode fazer.' : 'Veja quem tem acesso a esta base.'} onClose={onClose} error={error ?? resource.error}>
    {!current ? <p className="tables-muted" role="status">Carregando…</p> : <div className="tables-sharing">
      <div className="tables-sharing-modes" role="radiogroup" aria-label="Quem abre a base">
        {([['empresa', Building2, 'Toda a empresa', 'Membros editam; leitores da empresa só consultam.'], ['restrito', Lock, 'Só pessoas convidadas', 'Quem não está na lista não vê a base.']] as const).map(([value, Icon, label, hint]) =>
          <button key={value} type="button" role="radio" aria-checked={current.acesso === value} disabled={!admin || busy} className={current.acesso === value ? 'is-active' : ''} onClick={() => change({ acesso: value })}><Icon size={17} /><span><strong>{label}</strong><small>{hint}</small></span></button>)}
      </div>
      <div className="tables-member-list">
        {companyAdmins.map(m => <div key={m.id}><span className="tables-avatar">{m.nome.slice(0, 2).toUpperCase()}</span><span><strong>{m.nome}</strong><small>{m.email}</small></span><em className="tables-role-fixed">Administrador da empresa</em></div>)}
        {current.rows.map(row => { const p = person(row.usuario_id); return <div key={row.usuario_id}><span className="tables-avatar">{(p?.nome ?? '?').slice(0, 2).toUpperCase()}</span><span><strong>{p?.nome ?? 'Pessoa removida'}</strong><small>{p?.email}</small></span>
          <select aria-label={`Papel de ${p?.nome}`} value={row.papel} disabled={!admin || busy} title={ROLE_HINT[row.papel]} onChange={e => change({ rows: current.rows.map(r => r.usuario_id === row.usuario_id ? { ...r, papel: e.target.value as BaseRole } : r) })}>{BASE_ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</select>
          {admin && <button type="button" className="tables-icon-button" aria-label={`Remover ${p?.nome}`} disabled={busy} onClick={() => change({ rows: current.rows.filter(r => r.usuario_id !== row.usuario_id) })}><X size={14} /></button>}</div> })}
      </div>
      {admin && available.length > 0 && <div className="tables-sharing-add"><select aria-label="Adicionar pessoa" value={adding} onChange={e => setAdding(e.target.value)}><option value="">Adicionar pessoa…</option>{available.map(p => <option key={p.id} value={p.id}>{p.nome} · {p.email}</option>)}</select><button type="button" disabled={!adding || busy} onClick={() => { change({ rows: [...current.rows, { usuario_id: adding, papel: 'editor' }] }); setAdding('') }}>Adicionar</button></div>}
      <p className="tables-muted">{current.acesso === 'empresa' ? 'Pessoas fora da lista também abrem a base: membros como editores e leitores da empresa só para consultar.' : 'Só as pessoas da lista e os administradores da empresa veem esta base.'}</p>
      {admin && <div className="tables-dialog-footer"><button type="button" onClick={onClose} disabled={busy}>Cancelar</button><button type="button" className="tables-button-primary" disabled={busy || !draft} onClick={() => void save()}>{busy ? 'Salvando…' : 'Salvar'}</button></div>}
    </div>}
  </Modal>
}
