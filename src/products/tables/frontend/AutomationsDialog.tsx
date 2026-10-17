'use client'
import { useState } from 'react'
import { Copy, Send, Trash2 } from 'lucide-react'
import type { TableBundle } from '../shared/contracts'
import { send, useResource, type TablesApi } from './client'
import { Modal } from './dialogs'
import { ConfirmButton } from './FieldControl'

type Delivery = { id: string; evento: string; estado: string; tentativas: number; resposta: number | null; erro: string | null; criado_em: string }
type Automation = { id: string; nome: string; gatilho: string; url: string; ativa: boolean; versao: number; ultimas_entregas: Delivery[] }
const TRIGGER_LABELS: Record<string, string> = { registro_criado: 'Quando um registro é criado', registro_alterado: 'Quando um registro é alterado', registro_excluido: 'Quando um registro vai para a lixeira' }
const STATE_LABELS: Record<string, string> = { entregue: 'Entregue', pendente: 'Aguardando nova tentativa', falhou: 'Falhou', ignorada: 'Ignorada' }

/** Webhooks of a table: each event is sent as JSON, signed with the secret in X-Cognito-Assinatura. */
export function AutomationsDialog({ api, bundle, onClose }: { api: TablesApi; bundle: TableBundle; onClose: () => void }) {
  const [revision, setRevision] = useState(0), list = useResource<{ automacoes: Automation[] }>(api, `/tabelas/${bundle.tabela.id}/automacoes`, revision)
  const [form, setForm] = useState({ nome: '', gatilho: 'registro_criado', url: '' }), [secret, setSecret] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState<string | null>(null), [notice, setNotice] = useState('')
  async function act(invoke: () => Promise<void>) { setBusy(true); setError(null); setNotice(''); try { await invoke(); setRevision(v => v + 1) } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível concluir.') } finally { setBusy(false) } }
  return <Modal wide title="Automações" description={`Avise outro sistema (webhook) quando algo mudar em ${bundle.tabela.nome}.`} onClose={onClose} error={error ?? list.error}>
    <div className="tables-automations">
      {secret && <div className="tables-secret" role="status"><strong>Guarde o segredo desta automação.</strong><span>Ele assina cada envio no cabeçalho X-Cognito-Assinatura (HMAC SHA-256 do corpo) e não será mostrado de novo.</span><code>{secret}</code><button type="button" onClick={() => void navigator.clipboard?.writeText(secret).then(() => setNotice('Segredo copiado.'))}><Copy size={14} />Copiar</button></div>}
      {notice && <p className="tables-muted" role="status">{notice}</p>}
      {list.data?.automacoes.map(a => <article key={a.id} className="tables-automation">
        <header><strong>{a.nome}</strong><span className={a.ativa ? 'tables-badge-on' : 'tables-badge-off'}>{a.ativa ? 'Ativa' : 'Pausada'}</span></header>
        <p>{TRIGGER_LABELS[a.gatilho]} → <code>{a.url}</code></p>
        {a.ultimas_entregas.length > 0 && <ul>{a.ultimas_entregas.map(d => <li key={d.id}><span className={'tables-delivery-' + d.estado}>{STATE_LABELS[d.estado] ?? d.estado}</span>{d.evento === 'teste' ? ' · teste' : ''}{d.resposta ? ` · HTTP ${d.resposta}` : ''}{d.erro ? ` · ${d.erro}` : ''}<time>{new Date(d.criado_em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</time></li>)}</ul>}
        <div className="tables-automation-actions">
          <button type="button" disabled={busy} onClick={() => void act(async () => { const r = await api<{ entrega: Delivery }>(`/automacoes/${a.id}/testar`, send('POST')); setNotice(r.entrega?.estado === 'entregue' ? 'Teste entregue.' : `Teste não entregue: ${r.entrega?.erro ?? 'tente de novo'}`) })}><Send size={14} />Enviar teste</button>
          <button type="button" disabled={busy} onClick={() => void act(async () => { await api(`/automacoes/${a.id}`, send('PATCH', { ativa: !a.ativa, expectedVersion: a.versao })) })}>{a.ativa ? 'Pausar' : 'Ativar'}</button>
          <ConfirmButton disabled={busy} confirmLabel="Confirmar exclusão" onConfirm={() => void act(async () => { await api(`/automacoes/${a.id}`, send('DELETE')) })}><Trash2 size={14} />Excluir</ConfirmButton>
        </div>
      </article>)}
      {list.data && !list.data.automacoes.length && <p className="tables-muted">Nenhuma automação nesta tabela.</p>}
      <form className="tables-automation-new" onSubmit={e => { e.preventDefault(); void act(async () => { const r = await api<{ segredo: string }>(`/tabelas/${bundle.tabela.id}/automacoes`, send('POST', form)); setSecret(r.segredo); setForm({ nome: '', gatilho: 'registro_criado', url: '' }) }) }}>
        <h3>Nova automação</h3>
        <label>Nome<input required maxLength={120} value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Avisar o CRM" /></label>
        <label>Quando<select value={form.gatilho} onChange={e => setForm(f => ({ ...f, gatilho: e.target.value }))}>{Object.entries(TRIGGER_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label>Enviar para (HTTPS)<input required type="url" pattern="https://.*" value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} placeholder="https://hooks.exemplo.com/cognito" /></label>
        <div className="tables-dialog-footer"><button type="submit" className="tables-button-primary" disabled={busy}>{busy ? 'Salvando…' : 'Criar automação'}</button></div>
      </form>
    </div>
  </Modal>
}
