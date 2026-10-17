'use client'
import { useState } from 'react'
import { Copy } from 'lucide-react'
import { send, useResource, type TablesApi } from './client'
import { Modal } from './dialogs'
import { ConfirmButton } from './FieldControl'

type Key = { id: string; nome: string; prefixo: string; escopo: 'leitura' | 'escrita'; criado_em: string; ultimo_uso_em: string | null; revogada_em: string | null; propria: boolean; criada_por: string }

/** API keys of Tables: each key acts with the permissions of whoever created it. */
export function ApiKeysDialog({ api, onClose }: { api: TablesApi; onClose: () => void }) {
  const [revision, setRevision] = useState(0), list = useResource<{ chaves: Key[] }>(api, '/chaves', revision)
  const [name, setName] = useState(''), [scope, setScope] = useState<'leitura' | 'escrita'>('leitura'), [secret, setSecret] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState<string | null>(null)
  const origin = typeof window === 'undefined' ? '' : window.location.origin
  async function act(invoke: () => Promise<void>) { setBusy(true); setError(null); try { await invoke(); setRevision(v => v + 1) } catch (e) { setError(e instanceof Error ? e.message : 'Não foi possível concluir.') } finally { setBusy(false) } }
  return <Modal wide title="API do Tables" description="Integre outros sistemas com chaves de API. Cada chave tem as permissões de quem a criou, nas bases que essa pessoa abre." onClose={onClose} error={error ?? list.error}>
    <div className="tables-automations">
      {secret && <div className="tables-secret" role="status"><strong>Copie a chave agora.</strong><span>Ela não será mostrada de novo. Envie no cabeçalho Authorization: Bearer.</span><code>{secret}</code><button type="button" onClick={() => void navigator.clipboard?.writeText(secret)}><Copy size={14} />Copiar</button></div>}
      <details className="tables-api-docs"><summary>Como usar</summary>
        <p>Endereço base: <code>{origin}/api/v1/tables</code>. Os recursos são os mesmos do app: <code>GET /bases</code>, <code>GET /tabelas/:id</code>, <code>GET /tabelas/:id/registros</code> (com <code>pagina</code>, <code>tamanho</code>, <code>busca</code>, <code>filtros</code> e <code>combinacao</code>), <code>POST /tabelas/:id/registros</code>, <code>PATCH /registros/:id</code>, <code>GET /tabelas/:id/exportar</code> (CSV). Limite de 600 requisições por minuto por chave.</p>
        <pre>{`curl -H "Authorization: Bearer ctk_..." ${origin}/api/v1/tables/bases`}</pre>
      </details>
      {list.data?.chaves.map(k => <article key={k.id} className="tables-automation">
        <header><strong>{k.nome}</strong><span className={k.revogada_em ? 'tables-badge-off' : 'tables-badge-on'}>{k.revogada_em ? 'Revogada' : k.escopo === 'escrita' ? 'Leitura e escrita' : 'Só leitura'}</span></header>
        <p><code>{k.prefixo}…</code> · criada por {k.criada_por} em {new Date(k.criado_em).toLocaleDateString('pt-BR')} · {k.ultimo_uso_em ? `último uso em ${new Date(k.ultimo_uso_em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}` : 'nunca usada'}</p>
        {!k.revogada_em && <div className="tables-automation-actions"><ConfirmButton disabled={busy} confirmLabel="Confirmar: revogar agora" onConfirm={() => void act(async () => { await api(`/chaves/${k.id}`, send('DELETE')) })}>Revogar</ConfirmButton></div>}
      </article>)}
      {list.data && !list.data.chaves.length && <p className="tables-muted">Nenhuma chave criada.</p>}
      <form className="tables-automation-new" onSubmit={e => { e.preventDefault(); void act(async () => { const r = await api<{ segredo: string }>('/chaves', send('POST', { nome: name, escopo: scope })); setSecret(r.segredo); setName('') }) }}>
        <h3>Nova chave</h3>
        <label>Nome<input required maxLength={120} value={name} placeholder="Integração com o site" onChange={e => setName(e.target.value)} /></label>
        <label>Permissão<select value={scope} onChange={e => setScope(e.target.value as 'leitura' | 'escrita')}><option value="leitura">Só leitura</option><option value="escrita">Leitura e escrita</option></select></label>
        <div className="tables-dialog-footer"><button type="submit" className="tables-button-primary" disabled={busy}>{busy ? 'Criando…' : 'Criar chave'}</button></div>
      </form>
    </div>
  </Modal>
}
