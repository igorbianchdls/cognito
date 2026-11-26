'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Loader2, X } from 'lucide-react'
import { tituloExibido } from '@/products/notas/shared/arvore'
import { notasApi, type Pagina } from './api'
import { usePessoas } from './base/pessoas'
import x from './notas.module.css'

const Editor = dynamic(() => import('./Editor'), { ssr: false })

type ResumoVersao = { id: string; titulo: string; icone: string | null; versao: number; autor: string | null; created_at: string }
type Versao = ResumoVersao & { conteudo: unknown[] }

const quando = (iso: string) => new Date(iso).toLocaleString('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/** Histórico de versões: a lista à esquerda, a versão escolhida à direita (só leitura) e "Restaurar". */
export function Historico({ pagina, podeRestaurar, onFechar, onRestaurada }: {
  pagina: Pagina; podeRestaurar: boolean; onFechar: () => void; onRestaurada: (nova: Pagina) => void
}) {
  const pessoas = usePessoas()
  const [versoes, setVersoes] = useState<ResumoVersao[] | null>(null)
  const [escolhida, setEscolhida] = useState<string | null>(null)
  const [aberta, setAberta] = useState<Versao | null>(null)
  const [erro, setErro] = useState('')
  const [restaurando, setRestaurando] = useState(false)

  useEffect(() => {
    let ativo = true
    notasApi<ResumoVersao[]>(`/paginas/${pagina.id}/versoes`).then(v => { if (ativo) { setVersoes(v); setEscolhida(v[0]?.id ?? null) } }).catch(e => { if (ativo) setErro((e as Error).message) })
    return () => { ativo = false }
  }, [pagina.id])
  useEffect(() => {
    if (!escolhida) return
    let ativo = true
    notasApi<Versao>(`/paginas/${pagina.id}/versoes/${escolhida}`).then(v => { if (ativo) setAberta(v) }).catch(e => { if (ativo) setErro((e as Error).message) })
    return () => { ativo = false }
  }, [pagina.id, escolhida])
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') onFechar() }
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onFechar])

  const restaurar = async () => {
    if (!escolhida) return
    setRestaurando(true)
    try { onRestaurada(await notasApi<Pagina>(`/paginas/${pagina.id}/versoes/${escolhida}`, { method: 'POST' })) }
    catch (e) { setErro((e as Error).message) } finally { setRestaurando(false) }
  }
  const nome = (id: string | null) => pessoas.find(p => p.id === id)?.nome ?? 'Alguém'
  const mostrada = aberta?.id === escolhida ? aberta : null

  return <div className={x.overlay} onMouseDown={e => { if (e.target === e.currentTarget) onFechar() }}>
    <div className={x.historyDialog} role="dialog" aria-label="Histórico de versões">
      <div className={x.historyPreview}>
        {!versoes ? <Loader2 size={18} className={x.spin} />
          : !versoes.length ? <div className={x.muted} style={{ padding: 24 }}>Ainda não há versões anteriores. Elas aparecem conforme a página é editada (no máximo uma a cada 10 minutos por pessoa) e ficam por 30 dias.</div>
            : !mostrada ? <Loader2 size={18} className={x.spin} />
              : <div className={x.doc} style={{ paddingTop: 32 }}>
                {mostrada.icone && <div style={{ fontSize: 56, lineHeight: 1 }}>{mostrada.icone}</div>}
                <h1 className={x.title} style={{ margin: '8px 0' }}>{tituloExibido(mostrada.titulo)}</h1>
                <div className={x.editor}>
                  <Editor chave={mostrada.id} conteudo={mostrada.conteudo} editavel={false} onMudar={() => undefined} paginaId={pagina.id}
                    criarSubpagina={async () => null} criarBase={async () => null} />
                </div>
              </div>}
      </div>
      <aside className={x.historyList}>
        <div className={x.historyHead}><b>Histórico de versões</b><button type="button" className={x.topBtn} aria-label="Fechar" onClick={onFechar}><X size={16} /></button></div>
        <div className={x.historyCurrent}>Versão atual · {quando(pagina.updated_at)}</div>
        {(versoes ?? []).map(v => <button key={v.id} type="button" className={`${x.historyItem} ${escolhida === v.id ? x.historyItemOn : ''}`} onClick={() => setEscolhida(v.id)}>
          <b>{quando(v.created_at)}</b><span>{nome(v.autor)}</span>
        </button>)}
        {erro && <p className={x.formulaErro}>{erro}</p>}
        {podeRestaurar && Boolean(versoes?.length) && <button type="button" className={x.primary} style={{ margin: 12 }} disabled={!mostrada || restaurando} onClick={() => void restaurar()}>
          {restaurando ? 'Restaurando…' : 'Restaurar esta versão'}
        </button>}
      </aside>
    </div>
  </div>
}
