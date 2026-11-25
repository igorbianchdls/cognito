'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ArrowUp, Check, Clock, Cpu, Loader2, Palette, Plus, RectangleHorizontal, RectangleVertical, Settings2, Square, X } from 'lucide-react'
import {
  ajustarAoModelo, ESTILOS_VIDEO, FORMATOS_VIDEO, MODELOS_VIDEO, modeloVideo, PROMPT_MAXIMO, validarPedidoVideo,
  type FormatoVideo,
} from '@/products/marketing/shared/videoModels'
import x from './videos.module.css'

export type Rascunho = { prompt: string; modelo: string; formato: FormatoVideo; duracao: number; estilo: string; referencia: { path: string; url: string | null } | null }
export const RASCUNHO_INICIAL: Rascunho = { prompt: '', modelo: MODELOS_VIDEO[0].id, formato: '9:16', duracao: 5, estilo: 'nenhum', referencia: null }

export const iconeFormato = (formato: FormatoVideo) => formato === '9:16' ? RectangleVertical : formato === '16:9' ? RectangleHorizontal : Square

/** Menu que abre acima de um botão da caixa de prompt. */
function Escolha({ rotulo, icone: Icone, children, aberto, setAberto, id }: {
  rotulo: string; icone: typeof Clock; children: ReactNode; aberto: string | null; setAberto: (id: string | null) => void; id: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (aberto !== id) return
    const fechar = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setAberto(null) }
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setAberto(null) }
    window.addEventListener('mousedown', fechar); window.addEventListener('keydown', esc)
    return () => { window.removeEventListener('mousedown', fechar); window.removeEventListener('keydown', esc) }
  }, [aberto, id, setAberto])
  return <div ref={ref} className={x.menuWrap}>
    <button type="button" className={x.tool} aria-haspopup="menu" aria-expanded={aberto === id} onClick={() => setAberto(aberto === id ? null : id)}>
      <Icone size={16} />{rotulo}
    </button>
    {aberto === id && <div className={`${x.menu} ${x.menuUp}`} role="menu">{children}</div>}
  </div>
}

function Opcao({ ativo, onClick, children }: { ativo: boolean; onClick: () => void; children: ReactNode }) {
  return <button type="button" role="menuitemradio" aria-checked={ativo} className={`${x.option} ${ativo ? x.optionOn : ''}`} onClick={onClick}>
    <span>{children}</span>{ativo && <Check size={15} className={x.check} />}
  </button>
}

/** Caixa de prompt fixa embaixo: descrição, imagem de referência e os controles do modelo escolhido. */
export function PromptBar({ rascunho, setRascunho, enviando, onEnviar }: {
  rascunho: Rascunho; setRascunho: (r: Rascunho) => void; enviando: boolean; onEnviar: () => void
}) {
  const [aberto, setAberto] = useState<string | null>(null)
  const [enviandoImagem, setEnviandoImagem] = useState(false)
  const [erro, setErro] = useState('')
  const arquivo = useRef<HTMLInputElement>(null)
  const texto = useRef<HTMLTextAreaElement>(null)
  const modelo = modeloVideo(rascunho.modelo) ?? MODELOS_VIDEO[0]
  const recusa = validarPedidoVideo({ ...rascunho, temReferencia: Boolean(rascunho.referencia) })
  const IconeFormato = iconeFormato(rascunho.formato)

  // A caixa cresce com o texto (até o limite do CSS).
  useEffect(() => {
    const t = texto.current
    if (!t) return
    t.style.height = 'auto'; t.style.height = `${t.scrollHeight}px`
  }, [rascunho.prompt])

  const mudar = (parcial: Partial<Rascunho>) => setRascunho({ ...rascunho, ...parcial })
  const escolherModelo = (id: string) => {
    const novo = modeloVideo(id)!
    mudar({ modelo: id, ...ajustarAoModelo(id, rascunho.formato, rascunho.duracao), referencia: novo.aceitaImagem ? rascunho.referencia : null })
    setAberto(null)
  }

  const enviarImagem = async (file: File) => {
    setErro(''); setEnviandoImagem(true)
    try {
      const form = new FormData(); form.append('imagem', file)
      const response = await fetch('/api/marketing/videos/referencia', { method: 'POST', body: form })
      const body = await response.json().catch(() => ({})) as { path?: string; url?: string | null; erro?: string }
      if (!response.ok || !body.path) throw new Error(body.erro ?? 'Não foi possível enviar a imagem.')
      mudar({ referencia: { path: body.path, url: body.url ?? URL.createObjectURL(file) } })
    } catch (e) { setErro((e as Error).message) } finally { setEnviandoImagem(false) }
  }

  const enviar = () => { if (!recusa && !enviando) onEnviar() }

  return <div className={x.composerDock}>
    <form className={x.composer} onSubmit={e => { e.preventDefault(); enviar() }}>
      {rascunho.referencia && <div className={x.reference}>
        {rascunho.referencia.url && <img src={rascunho.referencia.url} alt="Imagem de referência" />}
        <button type="button" aria-label="Remover imagem de referência" onClick={() => mudar({ referencia: null })}><X size={12} /></button>
      </div>}
      <textarea ref={texto} rows={1} maxLength={PROMPT_MAXIMO} value={rascunho.prompt} placeholder="Descreva o vídeo que você quer gerar…" aria-label="Descrição do vídeo"
        onChange={e => mudar({ prompt: e.target.value })}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }} />
      {erro && <p className={x.composerError} role="alert">{erro}</p>}
      <div className={x.composerRow}>
        <input ref={arquivo} type="file" accept="image/jpeg,image/png,image/webp" hidden
          onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void enviarImagem(f) }} />
        <button type="button" className={x.plus} disabled={!modelo.aceitaImagem || enviandoImagem}
          title={modelo.aceitaImagem ? 'Adicionar imagem de referência' : `${modelo.nome} não usa imagem de referência`}
          aria-label="Adicionar imagem de referência" onClick={() => arquivo.current?.click()}>
          {enviandoImagem ? <Loader2 size={16} className="animate-spin" /> : <Plus size={18} />}
        </button>

        <Escolha id="formato" rotulo={rascunho.formato} icone={IconeFormato} aberto={aberto} setAberto={setAberto}>
          <div className={x.menuTitle}>Formato</div>
          {FORMATOS_VIDEO.filter(f => modelo.formatos.includes(f.id)).map(f =>
            <Opcao key={f.id} ativo={rascunho.formato === f.id} onClick={() => { mudar({ formato: f.id }); setAberto(null) }}>{f.nome}</Opcao>)}
        </Escolha>
        <Escolha id="duracao" rotulo={`${rascunho.duracao}s`} icone={Clock} aberto={aberto} setAberto={setAberto}>
          <div className={x.menuTitle}>Duração</div>
          {modelo.duracoes.map(d => <Opcao key={d} ativo={rascunho.duracao === d} onClick={() => { mudar({ duracao: d }); setAberto(null) }}>{d} segundos</Opcao>)}
        </Escolha>
        <Escolha id="modelo" rotulo={modelo.nome} icone={Cpu} aberto={aberto} setAberto={setAberto}>
          <div className={x.menuTitle}>Modelo</div>
          {MODELOS_VIDEO.map(m => <Opcao key={m.id} ativo={rascunho.modelo === m.id} onClick={() => escolherModelo(m.id)}>
            {m.nome}<small>{m.descricao}</small>
          </Opcao>)}
        </Escolha>
        <Escolha id="estilo" rotulo={ESTILOS_VIDEO.find(e => e.id === rascunho.estilo)?.nome ?? 'Estilo'} icone={Palette} aberto={aberto} setAberto={setAberto}>
          <div className={x.menuTitle}>Estilo</div>
          {ESTILOS_VIDEO.map(e => <Opcao key={e.id} ativo={rascunho.estilo === e.id} onClick={() => { mudar({ estilo: e.id }); setAberto(null) }}>{e.nome}</Opcao>)}
        </Escolha>
        <Escolha id="info" rotulo="" icone={Settings2} aberto={aberto} setAberto={setAberto}>
          <div className={x.info}>
            <p><b>{modelo.nome}</b> — {modelo.descricao}</p>
            <p>Formatos: {modelo.formatos.join(', ')} · Durações: {modelo.duracoes.map(d => `${d}s`).join(', ')}</p>
            <p>{modelo.aceitaImagem ? 'Aceita imagem de referência.' : 'Não usa imagem de referência.'}</p>
          </div>
        </Escolha>

        <button type="submit" className={x.send} disabled={Boolean(recusa) || enviando} aria-label="Gerar vídeo" title={recusa ?? 'Gerar vídeo'}>
          {enviando ? <Loader2 size={18} className="animate-spin" /> : <ArrowUp size={18} />}
        </button>
      </div>
    </form>
  </div>
}
