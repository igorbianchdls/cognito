'use client'

// Botão "Copiar" no canto de cada bloco de código (como no Notion). Fica por cima do editor, posicionado pela tela,
// sem mexer no HTML que o editor controla.
import { useEffect, useState, type RefObject } from 'react'
import { useEditorChange } from '@blocknote/react'
import { Check, Copy } from 'lucide-react'
import x from './notas.module.css'

type Bloco = { id: string; type: string; content?: unknown; children?: Bloco[] }
type Botao = { id: string; top: number; direita: number }

const texto = (b: Bloco) => Array.isArray(b.content) ? b.content.map(c => (c as { text?: string }).text ?? '').join('') : ''
function codigos(blocos: Bloco[], lista: Bloco[] = []) {
  for (const b of blocos) { if (b.type === 'codeBlock') lista.push(b); codigos(b.children ?? [], lista) }
  return lista
}

export function BotoesDoCodigo({ editor, caixa }: { editor: { document: Bloco[] }; caixa: RefObject<HTMLDivElement | null> }) {
  const [versao, setVersao] = useState(0)
  const [botoes, setBotoes] = useState<Botao[]>([])
  const [copiado, setCopiado] = useState<string | null>(null)
  useEditorChange(() => setVersao(v => v + 1), editor as never)
  useEffect(() => { const t = [0, 400, 1500].map(ms => setTimeout(() => setVersao(v => v + 1), ms)); return () => t.forEach(clearTimeout) }, [editor])

  // Mede onde ficam os blocos de código (no próximo quadro, e de novo quando a área muda de tamanho).
  useEffect(() => {
    const raiz = caixa.current
    if (!raiz) return
    const medir = () => {
      const r0 = raiz.getBoundingClientRect()
      setBotoes(codigos(editor.document).flatMap(b => {
        const el = raiz.querySelector(`.bn-block[data-id="${CSS.escape(b.id)}"] > .bn-block-content`)
        if (!el) return []
        const r = el.getBoundingClientRect()
        return [{ id: b.id, top: r.top - r0.top + 6, direita: r0.right - r.right + 6 }]
      }))
    }
    const quadro = requestAnimationFrame(medir)
    const obs = new ResizeObserver(medir); obs.observe(raiz)
    return () => { cancelAnimationFrame(quadro); obs.disconnect() }
  }, [caixa, editor, versao])

  const copiar = (id: string) => {
    const b = codigos(editor.document).find(c => c.id === id)
    if (!b) return
    void navigator.clipboard.writeText(texto(b)).then(() => { setCopiado(id); setTimeout(() => setCopiado(c => c === id ? null : c), 1500) })
  }
  return <>{botoes.map(b => <button key={b.id} type="button" className={x.codigoCopiar} style={{ top: b.top, right: b.direita }}
    onMouseDown={e => e.preventDefault()} onClick={() => copiar(b.id)} aria-label="Copiar código">
    {copiado === b.id ? <><Check size={13} />Copiado</> : <><Copy size={13} />Copiar</>}
  </button>)}</>
}
