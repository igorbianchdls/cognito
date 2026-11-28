'use client'

// Histórico de versões do projeto: painel ao lado, agrupado por dia, com capa, quem fez, o que mudou e a duração.
// Clicar numa versão abre a prévia (o vídeo daquela versão no player, sem mexer no projeto); de lá dá para restaurar
// (vira uma versão nova, nada se perde), duplicar como projeto novo ou dar um nome.
import { useEffect, useState } from 'react'
import { Player } from '@remotion/player'
import { Copy, History, Loader2, Pencil, RotateCcw, Save, X } from 'lucide-react'
import { EditorComposition } from '../remotion/Composition'
import { projectDuration } from '../project/ops'
import { versionProject, type Version } from '../project/store'
import { FPS, canvasSize, type Project } from '../project/types'
import { agruparPorDia, rotuloTipo, tempo } from './util'
import e from '../editor.module.css'

type Props = {
  projectId: string
  versoes: Version[] | null
  onFechar: () => void
  onSalvar: (nome: string) => Promise<void>
  onRestaurar: (v: Version, p: Project) => void
  onDuplicar: (v: Version, p: Project) => void
  onRenomear: (v: Version, nome: string) => Promise<void>
}

export function Historico({ projectId, versoes, onFechar, onSalvar, onRestaurar, onDuplicar, onRenomear }: Props) {
  const [nome, setNome] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [aberta, setAberta] = useState<Version | null>(null)
  const [renomeando, setRenomeando] = useState<string | null>(null)
  const salvar = async () => { setSalvando(true); try { await onSalvar(nome.trim() || 'Versão salva'); setNome('') } finally { setSalvando(false) } }

  return <aside className={e.historico} aria-label="Histórico de versões">
    <div className={e.historicoTopo}>
      <b><History size={16} />Versões</b>
      <button type="button" className={e.mini} onClick={onFechar} aria-label="Fechar o histórico"><X size={16} /></button>
    </div>
    <form className={e.historicoSalvar} onSubmit={ev => { ev.preventDefault(); void salvar() }}>
      <input value={nome} onChange={ev => setNome(ev.target.value)} placeholder="Nome da versão (ex.: Corte final)" aria-label="Nome da versão" maxLength={120} />
      <button type="submit" disabled={salvando}>{salvando ? <Loader2 size={15} className={e.spin} /> : <Save size={15} />}Salvar</button>
    </form>
    <p className={e.historicoDica}>O editor também guarda versões sozinho enquanto você edita, antes de grandes mudanças e a cada exportação.</p>
    <div className={e.historicoLista}>
      {!versoes && <p className={e.hint}><Loader2 size={14} className={e.spin} /> Carregando…</p>}
      {versoes?.length === 0 && <p className={e.hint}>Nenhuma versão ainda. A primeira aparece depois de alguns minutos de edição, ou salve agora.</p>}
      {versoes && agruparPorDia(versoes).map(g => <section key={g.dia}>
        <h4 className={e.groupTitle}>{g.dia}</h4>
        {g.versoes.map(v => <div key={v.id} className={e.versao} data-versao={v.id}>
          <button type="button" className={e.versaoAbrir} onClick={() => setAberta(v)} aria-label={`Ver ${v.label}`}>
            <span className={e.versaoCapa} style={v.capa ? { backgroundImage: `url(${v.capa})` } : undefined} aria-hidden />
            <span className={e.versaoTexto}>
              {renomeando === v.id ? null : <b>{v.label}</b>}
              <small>{v.at.slice(11, 16)}{v.autor ? ` · ${v.autor}` : ''}{v.duracao != null ? ` · ${tempo(v.duracao)}` : ''}</small>
              {v.resumo && <small className={e.versaoResumo}>{v.resumo}</small>}
            </span>
            <i className={`${e.versaoTipo} ${e[`tipo_${v.tipo}`] ?? ''}`}>{v.nomeada && v.tipo === 'auto' ? 'Salva' : rotuloTipo[v.tipo]}</i>
          </button>
          {renomeando === v.id
            ? <form className={e.versaoRenomear} onSubmit={ev => { ev.preventDefault(); const n = new FormData(ev.currentTarget).get('nome'); void onRenomear(v, String(n ?? '')).then(() => setRenomeando(null)) }}>
              <input name="nome" defaultValue={v.nomeada ? v.label : ''} placeholder="Nome desta versão" aria-label="Novo nome da versão" autoFocus maxLength={120} />
              <button type="submit">OK</button>
            </form>
            : <button type="button" className={e.versaoNomear} onClick={() => setRenomeando(v.id)} aria-label={`Dar nome a ${v.label}`} title="Dar nome (versões com nome não são apagadas)"><Pencil size={13} /></button>}
        </div>)}
      </section>)}
    </div>
    {aberta && <PreviaVersao projectId={projectId} versao={aberta} onFechar={() => setAberta(null)}
      onRestaurar={p => { onRestaurar(aberta, p); setAberta(null) }} onDuplicar={p => { onDuplicar(aberta, p); setAberta(null) }} />}
  </aside>
}

/** O vídeo de uma versão no player, só para ver. */
function PreviaVersao({ projectId, versao, onFechar, onRestaurar, onDuplicar }: { projectId: string; versao: Version; onFechar: () => void; onRestaurar: (p: Project) => void; onDuplicar: (p: Project) => void }) {
  const [projeto, setProjeto] = useState<Project | null | undefined>(versao.project)
  useEffect(() => {
    if (versao.project) return
    let vivo = true
    void versionProject(projectId, versao).then(p => { if (vivo) setProjeto(p ?? null) })
    return () => { vivo = false }
  }, [projectId, versao])
  useEffect(() => {
    const esc = (ev: KeyboardEvent) => { if (ev.key === 'Escape') onFechar() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onFechar])
  const tamanho = projeto ? canvasSize[projeto.format] : canvasSize['9:16']
  return <div className={e.modalBack} onMouseDown={ev => { if (ev.target === ev.currentTarget) onFechar() }}>
    <div className={`${e.modal} ${e.previaVersao}`} role="dialog" aria-modal="true" aria-label={`Prévia: ${versao.label}`}>
      <div className={e.modalHead}><b>{versao.label}<small> · {versao.at.slice(8, 10)}/{versao.at.slice(5, 7)} às {versao.at.slice(11, 16)}</small></b><button type="button" onClick={onFechar} aria-label="Fechar"><X size={18} /></button></div>
      <div className={e.previaPalco}>
        {projeto === undefined && <Loader2 size={20} className={e.spin} />}
        {projeto === null && <p className={e.hint}>Não foi possível abrir esta versão.</p>}
        {projeto && <Player component={EditorComposition} inputProps={{ project: projeto }} durationInFrames={Math.max(1, projectDuration(projeto))} fps={FPS}
          compositionWidth={tamanho.width} compositionHeight={tamanho.height} controls
          style={{ height: '100%', width: 'auto', maxWidth: '100%', aspectRatio: `${tamanho.width} / ${tamanho.height}` }} />}
      </div>
      {versao.resumo && <p className={e.hint}>{versao.resumo}</p>}
      <div className={e.modalFoot}>
        <button type="button" className={e.ghostBtn} disabled={!projeto} onClick={() => projeto && onDuplicar(projeto)}><Copy size={15} />Duplicar como projeto</button>
        <button type="button" className={e.export} disabled={!projeto} onClick={() => projeto && onRestaurar(projeto)}><RotateCcw size={15} />Restaurar esta versão</button>
      </div>
    </div>
  </div>
}
