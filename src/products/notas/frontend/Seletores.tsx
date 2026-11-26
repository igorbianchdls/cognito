'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { enviarArquivoNotas } from './api'
import { CAPAS, EMOJIS, emojiAleatorio, estiloCapa } from './catalogo'
import { Menu } from './Menu'
import x from './notas.module.css'

/** Seletor de ícone: emojis, aleatório e remover (como o do Notion). */
export function SeletorIcone({ ancora, onFechar, onEscolher }: { ancora: HTMLElement; onFechar: () => void; onEscolher: (icone: string | null) => void }) {
  const escolher = (icone: string | null) => { onEscolher(icone); onFechar() }
  return <Menu ancora={ancora} onFechar={onFechar} className={x.picker}>
    <div className={x.pickerTabs}>
      <button type="button" className={x.tabOn}>Emoji</button>
      <span className={x.spacer} />
      <button type="button" onClick={() => escolher(emojiAleatorio())}>Aleatório</button>
      <button type="button" onClick={() => escolher(null)}>Remover</button>
    </div>
    <div className={x.emojiGrid}>
      {EMOJIS.map(emoji => <button key={emoji} type="button" aria-label={`Usar ${emoji}`} onClick={() => escolher(emoji)}>{emoji}</button>)}
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
    {aba === 'galeria' && <div className={x.coverGrid}>
      {CAPAS.map(capa => <button key={capa} type="button" aria-label="Usar esta capa" style={estiloCapa(capa)} onClick={() => escolher(capa)} />)}
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
