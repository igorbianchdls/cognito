'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import { loadFrimousseData, searchEmojis } from '@blocknote/core/emoji-data'
import { useLocal } from './local'
import { enviarArquivoNotas } from './api'
import { CAPAS, EMOJIS, ILUSTRACOES, emojiAleatorio, estiloCapa } from './catalogo'
import { Menu } from './Menu'
import x from './notas.module.css'

type DadosEmoji = Awaited<ReturnType<typeof loadFrimousseData>>

/**
 * Seletor de ícone (como o do Notion): busca em português (nome e apelidos do emoji), os usados por último, sugestões
 * para páginas e todos os emojis por categoria; aleatório e remover.
 */
export function SeletorIcone({ ancora, onFechar, onEscolher }: { ancora: HTMLElement; onFechar: () => void; onEscolher: (icone: string | null) => void }) {
  const [busca, setBusca] = useState('')
  const [dados, setDados] = useState<DadosEmoji | null>(null)
  const [recentes, setRecentes] = useLocal<string[]>('notas:emojis-recentes', [])
  useEffect(() => { let ativo = true; void loadFrimousseData('pt').then(d => { if (ativo) setDados(d) }).catch(() => undefined); return () => { ativo = false } }, [])
  const escolher = (icone: string | null) => {
    if (icone) setRecentes([icone, ...recentes.filter(e => e !== icone)].slice(0, 20))
    onEscolher(icone); onFechar()
  }
  const encontrados = useMemo(() => dados && busca.trim() ? searchEmojis(dados.emojis, busca, 'pt').slice(0, 160) : null, [dados, busca])
  const grade = (lista: string[]) => <div className={x.emojiGrid}>
    {lista.map((emoji, i) => <button key={`${emoji}${i}`} type="button" aria-label={`Usar ${emoji}`} onClick={() => escolher(emoji)}>{emoji}</button>)}
  </div>
  return <Menu ancora={ancora} onFechar={onFechar} className={x.picker}>
    <div className={x.pickerTabs}>
      <button type="button" className={x.tabOn}>Emoji</button>
      <span className={x.spacer} />
      <button type="button" onClick={() => escolher(emojiAleatorio())}>Aleatório</button>
      <button type="button" onClick={() => escolher(null)}>Remover</button>
    </div>
    <label className={x.emojiBusca}><Search size={14} />
      <input autoFocus value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar emoji (ex.: foguete, calendário)…" aria-label="Buscar emoji"
        onKeyDown={e => { if (e.key === 'Enter' && encontrados?.[0]) escolher(encontrados[0].emoji) }} />
    </label>
    <div className={x.emojiRolagem}>
      {encontrados
        ? encontrados.length ? grade(encontrados.map(e => e.emoji)) : <div className={x.muted} style={{ padding: 16, fontSize: 13 }}>Nenhum emoji encontrado.</div>
        : <>
          {recentes.length > 0 && <><div className={x.emojiGrupo}>Recentes</div>{grade(recentes)}</>}
          <div className={x.emojiGrupo}>Para páginas</div>{grade(EMOJIS)}
          {dados?.categories.map(c => <div key={c.index}>
            <div className={x.emojiGrupo}>{c.label}</div>
            {grade(dados.emojis.filter(e => e.category === c.index && !e.countryFlag).map(e => e.emoji))}
          </div>)}
        </>}
    </div>
  </Menu>
}

/** Seletor de capa: galeria (gradientes e cores), enviar imagem ou link. */
export function SeletorCapa({ ancora, onFechar, onEscolher }: { ancora: HTMLElement; onFechar: () => void; onEscolher: (capa: string | null) => void }) {
  const [aba, setAba] = useState<'galeria' | 'enviar' | 'link'>('galeria')
  const [link, setLink] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const escolher = (capa: string | null) => { onEscolher(capa); onFechar() }
  const enviar = async (file: File) => {
    setEnviando(true); setErro('')
    try { escolher(await enviarArquivoNotas(file)) } catch (e) { setErro((e as Error).message) } finally { setEnviando(false) }
  }
  return <Menu ancora={ancora} onFechar={onFechar} alinhar="fim" className={x.picker}>
    <div className={x.pickerTabs}>
      {(['galeria', 'enviar', 'link'] as const).map(id => <button key={id} type="button" className={aba === id ? x.tabOn : ''} onClick={() => setAba(id)}>
        {id === 'galeria' ? 'Galeria' : id === 'enviar' ? 'Enviar' : 'Link'}
      </button>)}
      <span className={x.spacer} />
      <button type="button" onClick={() => escolher(null)}>Remover</button>
    </div>
    {aba === 'galeria' && <div className={x.capasRolagem}>
      <div className={x.emojiGrupo}>Ilustrações</div>
      <div className={`${x.coverGrid} ${x.coverGridIlustracoes}`}>
        {ILUSTRACOES.map(i => <button key={i.capa} type="button" aria-label={`Usar a capa ${i.nome}`} title={i.nome} style={{ ...estiloCapa(i.capa), backgroundSize: 'cover' }} onClick={() => escolher(i.capa)} />)}
      </div>
      <div className={x.emojiGrupo}>Cores e gradientes</div>
      <div className={x.coverGrid}>
        {CAPAS.map(capa => <button key={capa} type="button" aria-label="Usar esta capa" style={estiloCapa(capa)} onClick={() => escolher(capa)} />)}
      </div>
    </div>}
    {aba === 'enviar' && <div className={x.pickerBody}>
      <label className={x.primary} style={{ display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
        {enviando ? <Loader2 size={16} className={x.spin} /> : 'Enviar arquivo'}
        <input type="file" accept="image/*" hidden onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void enviar(f) }} />
      </label>
      <small className={x.muted}>Imagens com mais de 1500 pixels de largura ficam melhores.</small>
      {erro && <small style={{ color: '#eb5757' }}>{erro}</small>}
    </div>}
    {aba === 'link' && <form className={x.pickerBody} onSubmit={e => { e.preventDefault(); if (/^https:\/\//.test(link.trim())) escolher(link.trim()) }}>
      <input autoFocus value={link} onChange={e => setLink(e.target.value)} placeholder="Cole o link da imagem…" aria-label="Link da imagem" />
      <button type="submit" className={x.primary} disabled={!/^https:\/\//.test(link.trim())}>Usar imagem</button>
    </form>}
  </Menu>
}
