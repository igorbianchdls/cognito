'use client'

import { useEffect, useState } from 'react'
import { Globe, Link2, Lock, Users, X } from 'lucide-react'
import { notasApi } from './api'
import { Chave, Menu } from './Menu'
import { useNotas } from './NotasProvider'
import { usePessoas } from './base/pessoas'
import x from './notas.module.css'

type Convidado = { user_id: string; nivel: 'ver' | 'editar' }
export type Compartilhamento = { acesso: 'empresa' | 'restrito'; herdada: boolean; convidados: Convidado[]; publica: boolean; token: string | null; pode_gerir: boolean; dono: string }

/** Compartilhar (como o do Notion): quem tem acesso, convidados com nível, publicar na web e copiar o link. */
export function Compartilhar({ ancora, paginaId, espaco, onFechar, onMudou }: {
  ancora: HTMLElement; paginaId: string; espaco: 'equipe' | 'particular'; onFechar: () => void; onMudou: (c: Compartilhamento) => void
}) {
  const { avisar } = useNotas()
  const pessoas = usePessoas()
  const [dados, setDados] = useState<Compartilhamento | null>(null)
  const [novo, setNovo] = useState('')

  useEffect(() => {
    let ativo = true
    notasApi<Compartilhamento>(`/paginas/${paginaId}/compartilhar`).then(d => { if (ativo) setDados(d) }).catch(e => { if (ativo) avisar((e as Error).message) })
    return () => { ativo = false }
  }, [paginaId, avisar])

  const mudar = async (json: Partial<Pick<Compartilhamento, 'acesso' | 'convidados' | 'publica'>>) => {
    try { const d = await notasApi<Compartilhamento>(`/paginas/${paginaId}/compartilhar`, { method: 'PATCH', json }); setDados(d); onMudou(d) }
    catch (e) { avisar((e as Error).message) }
  }
  const copiar = (url: string, aviso: string) => void navigator.clipboard.writeText(url).then(() => avisar(aviso))
  const nome = (id: string) => pessoas.find(p => p.id === id)?.nome ?? 'Pessoa da empresa'
  const linkPublico = dados?.token ? `${location.origin}/n/${dados.token}` : ''
  const podeConvidar = pessoas.filter(p => p.id !== dados?.dono && !dados?.convidados.some(c => c.user_id === p.id))

  return <Menu ancora={ancora} onFechar={onFechar} alinhar="fim" className={x.shareMenu}>
    {!dados ? <div className={x.menuLabel}>Carregando…</div> : <>
      <div className={x.menuLabel}>Quem tem acesso</div>
      <div className={x.filterRow}>
        {dados.acesso === 'restrito' ? <Lock size={16} /> : <Users size={16} />}
        <select value={dados.acesso} aria-label="Acesso geral" disabled={!dados.pode_gerir} style={{ flex: 1 }} onChange={e => void mudar({ acesso: e.target.value as 'empresa' | 'restrito' })}>
          <option value="empresa">{espaco === 'particular' ? 'Só você' : 'Toda a empresa'}</option>
          <option value="restrito">{espaco === 'particular' ? 'Você e os convidados' : 'Só quem foi convidado'}</option>
        </select>
      </div>
      {dados.herdada && <div className={x.menuLabel} style={{ fontWeight: 400 }}>O acesso desta página segue o de uma página acima dela.</div>}
      {dados.acesso === 'restrito' && <>
        <div className={x.menuLabel}>Convidados</div>
        <div className={x.filterRow}><span className={x.person}><span className={x.avatar}>{nome(dados.dono).slice(0, 1)}</span>{nome(dados.dono)}</span><small className={x.muted} style={{ marginLeft: 'auto' }}>Dono</small></div>
        {dados.convidados.map(c => <div key={c.user_id} className={x.filterRow}>
          <span className={x.person} style={{ flex: 1 }}><span className={x.avatar}>{nome(c.user_id).slice(0, 1)}</span>{nome(c.user_id)}</span>
          <select value={c.nivel} aria-label={`Nível de ${nome(c.user_id)}`} disabled={!dados.pode_gerir}
            onChange={e => void mudar({ convidados: dados.convidados.map(o => o.user_id === c.user_id ? { ...o, nivel: e.target.value as 'ver' | 'editar' } : o) })}>
            <option value="ver">Pode ver</option><option value="editar">Pode editar</option>
          </select>
          {dados.pode_gerir && <button type="button" className={x.rowBtn} aria-label={`Tirar ${nome(c.user_id)}`} onClick={() => void mudar({ convidados: dados.convidados.filter(o => o.user_id !== c.user_id) })}><X size={14} /></button>}
        </div>)}
        {dados.pode_gerir && <div className={x.filterRow}>
          <select value={novo} aria-label="Convidar pessoa" style={{ flex: 1 }} onChange={e => setNovo(e.target.value)}>
            <option value="">Convidar alguém da empresa…</option>
            {podeConvidar.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
          <button type="button" className={x.primary} style={{ padding: '0 12px' }} disabled={!novo}
            onClick={() => { void mudar({ convidados: [...dados.convidados, { user_id: novo, nivel: 'ver' }] }); setNovo('') }}>Convidar</button>
        </div>}
      </>}
      <div className={x.menuSep} />
      <button type="button" className={x.menuItem} disabled={!dados.pode_gerir} onClick={() => void mudar({ publica: !dados.publica })}>
        <Globe size={16} /><span>Publicar na web</span><Chave ligada={dados.publica} />
      </button>
      {dados.publica && linkPublico && <div className={x.filterRow}>
        <input readOnly value={linkPublico} aria-label="Link público" onFocus={e => e.currentTarget.select()} />
        <button type="button" className={x.barBtn} onClick={() => copiar(linkPublico, 'Link público copiado.')}>Copiar</button>
      </div>}
      {dados.publica && <div className={x.menuLabel} style={{ fontWeight: 400 }}>Qualquer pessoa com o link vê esta página (só leitura, sem as subpáginas).</div>}
      {!dados.pode_gerir && <div className={x.menuLabel} style={{ fontWeight: 400 }}>Só quem criou a página muda o acesso.</div>}
      <div className={x.menuSep} />
      <button type="button" className={x.menuItem} onClick={() => copiar(`${location.origin}/notas/${paginaId}`, 'Link copiado.')}><Link2 size={16} /><span>Copiar link</span></button>
    </>}
  </Menu>
}
