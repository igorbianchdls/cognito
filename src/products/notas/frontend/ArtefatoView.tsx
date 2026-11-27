'use client'

// Artefato aberto nas Notas: o HTML que o agente escreveu, rodando numa moldura isolada (iframe em sandbox, sem a
// mesma origem e sem rede), com versões, código, baixar e tela cheia.
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, Code2, Copy, Download, History, Maximize2, RotateCcw, Sparkles, X } from 'lucide-react'
import { documentoIsolado, SANDBOX_ARTEFATO } from '@/products/notas/shared/artefatos'
import { editadoHa, notasApi } from './api'
import { usePessoas } from './base/pessoas'
import { useNotas } from './NotasProvider'
import x from './notas.module.css'

type Artefato = { id: string; titulo: string; html: string; versao: number; atualizado_em: string; atualizado_por: string; pode_editar: boolean }
type Versao = { versao: number; resumo: string; created_by: string; created_at: string; tamanho: number }

const nomeDoArquivo = (titulo: string) => (titulo.trim() || 'artefato').replace(/[\\/:*?"<>|]+/g, '-').slice(0, 80)

/** A moldura isolada: só o HTML do artefato, com a política de segurança na frente. */
export function MolduraArtefato({ html, titulo, className }: { html: string; titulo: string; className?: string }) {
  const documento = useMemo(() => documentoIsolado(html), [html])
  return <iframe className={className ?? x.artefatoMoldura} title={titulo || 'Artefato'} sandbox={SANDBOX_ARTEFATO} srcDoc={documento}
    referrerPolicy="no-referrer" allow="fullscreen; clipboard-write" />
}

export function ArtefatoView({ paginaId, titulo, editavel, onMudou }: { paginaId: string; titulo: string; editavel: boolean; onMudou?: () => void }) {
  const { avisar } = useNotas()
  const pessoas = usePessoas()
  const [artefato, setArtefato] = useState<Artefato | null>(null)
  const [erro, setErro] = useState('')
  const [painel, setPainel] = useState<'versoes' | 'codigo' | null>(null)
  const [versoes, setVersoes] = useState<Versao[] | null>(null)
  const [vendo, setVendo] = useState<{ versao: number; html: string } | null>(null)
  const [copiado, setCopiado] = useState(false)
  const caixa = useRef<HTMLDivElement>(null)

  const carregar = useCallback(() => notasApi<Artefato>(`/artefatos/${paginaId}`)
    .then(a => { setArtefato(atual => atual && atual.versao === a.versao && atual.html === a.html ? atual : a); setErro('') })
    .catch(e => setErro((e as Error).message)), [paginaId])
  const carregarVersoes = useCallback(() => notasApi<Versao[]>(`/artefatos/${paginaId}/versoes`).then(setVersoes).catch(e => avisar((e as Error).message)), [paginaId, avisar])

  // Quando o agente grava uma versão nova, ela aparece ao voltar para a aba.
  useEffect(() => {
    const t = setTimeout(() => void carregar(), 0)
    const voltar = () => { if (document.visibilityState === 'visible') void carregar() }
    document.addEventListener('visibilitychange', voltar)
    window.addEventListener('focus', voltar)
    return () => { clearTimeout(t); document.removeEventListener('visibilitychange', voltar); window.removeEventListener('focus', voltar) }
  }, [carregar])
  useEffect(() => { if (painel === 'versoes') { const t = setTimeout(() => void carregarVersoes(), 0); return () => clearTimeout(t) } }, [painel, carregarVersoes, artefato?.versao])

  const nome = (id: string) => pessoas.find(p => p.id === id)?.nome ?? 'Alguém da equipe'
  const html = vendo?.html ?? artefato?.html ?? ''
  const baixar = () => {
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html;charset=utf-8' }))
    const a = document.createElement('a'); a.href = url; a.download = `${nomeDoArquivo(titulo)}${vendo ? `-v${vendo.versao}` : ''}.html`; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const telaCheia = () => { void caixa.current?.requestFullscreen?.().catch(() => avisar('O navegador não permitiu a tela cheia.')) }
  const ver = async (v: number) => {
    if (v === artefato?.versao) { setVendo(null); return }
    try { const r = await notasApi<{ versao: number; html: string }>(`/artefatos/${paginaId}/versoes/${v}`); setVendo({ versao: r.versao, html: r.html }) } catch (e) { avisar((e as Error).message) }
  }
  const restaurar = async (v: number) => {
    try {
      const novo = await notasApi<Artefato>(`/artefatos/${paginaId}/versoes/${v}`, { method: 'POST' })
      setArtefato(novo); setVendo(null); void carregarVersoes(); onMudou?.(); avisar(`Versão ${v} restaurada (virou a versão ${novo.versao}).`)
    } catch (e) { avisar((e as Error).message) }
  }

  if (erro) return <div className={x.artefatoVazio}><Sparkles size={28} /><b>Não foi possível abrir o artefato</b><span>{erro}</span></div>
  if (!artefato) return <div className={x.artefatoVazio}><span className={x.muted}>Carregando o artefato…</span></div>

  return <div className={x.artefato}>
    <div className={x.artefatoBarra}>
      <span className={x.artefatoInfo}><Sparkles size={14} />Artefato · versão {artefato.versao} · {editadoHa(artefato.atualizado_em).toLowerCase()}</span>
      <span className={x.barSpacer} />
      <button type="button" className={`${x.barBtn} ${painel === 'versoes' ? x.barBtnOn : ''}`} aria-label="Versões" onClick={() => setPainel(painel === 'versoes' ? null : 'versoes')}><History size={15} /><span className={x.soComputador}>Versões</span></button>
      <button type="button" className={`${x.barBtn} ${painel === 'codigo' ? x.barBtnOn : ''}`} aria-label="Código" onClick={() => setPainel(painel === 'codigo' ? null : 'codigo')}><Code2 size={15} /><span className={x.soComputador}>Código</span></button>
      <button type="button" className={x.barBtn} onClick={baixar} title="Baixar o HTML" aria-label="Baixar"><Download size={15} /><span className={x.soComputador}>Baixar</span></button>
      <button type="button" className={x.barBtn} onClick={telaCheia} aria-label="Tela cheia" title="Tela cheia"><Maximize2 size={15} /></button>
    </div>
    {vendo && <div className={x.banner}>
      Vendo a versão {vendo.versao}.
      {editavel && <button type="button" className={x.bannerBtn} onClick={() => void restaurar(vendo.versao)}>Restaurar esta versão</button>}
      <button type="button" className={x.bannerBtn} onClick={() => setVendo(null)}>Voltar para a atual</button>
    </div>}
    <div className={x.artefatoCorpo}>
      <div ref={caixa} className={x.artefatoCaixa}><MolduraArtefato key={vendo ? `v${vendo.versao}` : `atual${artefato.versao}`} html={html} titulo={titulo} /></div>
      {painel && <aside className={x.artefatoPainel} aria-label={painel === 'versoes' ? 'Versões do artefato' : 'Código do artefato'}>
        <div className={x.artefatoPainelTopo}>
          <b>{painel === 'versoes' ? 'Versões' : vendo ? `Código da versão ${vendo.versao}` : 'Código'}</b>
          {painel === 'codigo' && <button type="button" className={x.barBtn} onClick={() => void navigator.clipboard.writeText(html).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 1500) })}>
            {copiado ? <Check size={14} /> : <Copy size={14} />}{copiado ? 'Copiado' : 'Copiar'}</button>}
          <button type="button" className={x.rowBtn} aria-label="Fechar" onClick={() => setPainel(null)}><X size={16} /></button>
        </div>
        {painel === 'codigo'
          ? <pre className={x.artefatoCodigo}><code>{html}</code></pre>
          : <div className={x.artefatoVersoes}>
            {!versoes && <div className={x.muted} style={{ padding: 12 }}>Carregando…</div>}
            {versoes?.map(v => {
              const atual = v.versao === artefato.versao, selecionada = vendo ? vendo.versao === v.versao : atual
              return <div key={v.versao} className={`${x.artefatoVersao} ${selecionada ? x.artefatoVersaoOn : ''}`} role="button" tabIndex={0}
                onClick={() => void ver(v.versao)} onKeyDown={e => { if (e.key === 'Enter') void ver(v.versao) }}>
                <span className={x.artefatoVersaoNum}>v{v.versao}</span>
                <span className={x.artefatoVersaoTexto}>
                  <b>{v.resumo || `Versão ${v.versao}`}</b>
                  <small>{nome(v.created_by)} · {editadoHa(v.created_at).replace(/^Editado /, '')}{atual ? ' · atual' : ''}</small>
                </span>
                {editavel && !atual && <button type="button" className={x.rowBtn} title="Restaurar esta versão" aria-label={`Restaurar a versão ${v.versao}`}
                  onClick={e => { e.stopPropagation(); void restaurar(v.versao) }}><RotateCcw size={14} /></button>}
              </div>
            })}
          </div>}
      </aside>}
    </div>
  </div>
}
