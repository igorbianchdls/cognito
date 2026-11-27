'use client'

// Colunas no editor: aplica as larguras guardadas em cada bloco "colunas" (por um <style> fora do editor, sem mexer no
// HTML que o editor controla), desenha as alças entre as colunas para arrastar a divisão e, depois que a pessoa move
// blocos, tira a coluna que ficou vazia ou desfaz as colunas quando sobra uma só.
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { useEditorChange } from '@blocknote/react'
import { ajusteDeColunas, escreverLarguras, lerLarguras, moverDivisao } from '@/products/notas/shared/colunas'
import x from './notas.module.css'

type Bloco = { id: string; type: string; props?: Record<string, unknown>; children?: Bloco[] }
type EditorColunas = {
  document: Bloco[]
  updateBlock: (id: string, mudanca: { props: Record<string, unknown> }) => void
  removeBlocks: (ids: string[]) => void
  replaceBlocks: (ids: string[], novos: Bloco[]) => void
}
type Alca = { colunasId: string; i: number; x: number; top: number; altura: number; largura: number }

function blocosDeColunas(blocos: Bloco[], lista: { id: string; larguras: number[] }[] = []) {
  for (const b of blocos) {
    if (b.type === 'colunas') lista.push({ id: b.id, larguras: lerLarguras(b.props?.larguras, (b.children ?? []).filter(c => c.type === 'coluna').length) })
    blocosDeColunas(b.children ?? [], lista)
  }
  return lista
}

export function ColunasVivas({ editor, editavel, caixa }: { editor: EditorColunas; editavel: boolean; caixa: RefObject<HTMLDivElement | null> }) {
  const [versao, setVersao] = useState(0)
  const [alcas, setAlcas] = useState<Alca[]>([])
  const [arrasto, setArrasto] = useState<{ colunasId: string; i: number; x0: number; base: number[]; agora: number[] } | null>(null)
  const arrumando = useRef(false)

  // Depois de mover blocos (só quem está editando, não as mudanças que chegam de outra pessoa): arruma as colunas.
  const arrumar = useCallback(() => {
    if (!editavel || arrumando.current) return
    const local = caixa.current?.contains(document.activeElement)
    if (!local) return
    const ajuste = ajusteDeColunas(editor.document)
    if (!ajuste) return
    arrumando.current = true
    setTimeout(() => {
      try {
        if (ajuste.tipo === 'envolver') editor.replaceBlocks([ajuste.bloco.id], [{ type: 'coluna', children: [ajuste.bloco] } as Bloco])
        else if (ajuste.tipo === 'tirar_coluna') { editor.removeBlocks([ajuste.colunaId]); editor.updateBlock(ajuste.colunasId, { props: { larguras: ajuste.larguras } }) }
        else if (ajuste.conteudo.length) editor.replaceBlocks([ajuste.colunasId], ajuste.conteudo)
        else editor.removeBlocks([ajuste.colunasId])
      } catch { /* o bloco já mudou: a próxima mudança tenta de novo */ } finally { arrumando.current = false }
      // Um ajuste pode pedir outro (envolver o bloco solto e depois tirar a coluna que ficou vazia).
      setTimeout(() => refazer.current(), 0)
    }, 0)
  }, [editor, editavel, caixa])
  const refazer = useRef(arrumar)
  useEffect(() => { refazer.current = arrumar }, [arrumar])

  useEditorChange(() => { setVersao(v => v + 1); arrumar() }, editor as never)
  // O conteúdo colaborativo entra no editor antes deste componente começar a ouvir as mudanças: confere de novo logo
  // depois de montar (senão as larguras guardadas só apareceriam na primeira edição).
  useEffect(() => {
    const tempos = [0, 300, 1200].map(ms => setTimeout(() => setVersao(v => v + 1), ms))
    return () => tempos.forEach(clearTimeout)
  }, [editor])

  const colunas = useMemo(() => { void versao; return blocosDeColunas(editor.document) }, [editor, versao])
  const larguraDe = (id: string, padrao: number[]) => arrasto?.colunasId === id ? arrasto.agora : padrao
  const estilo = colunas.map(c => larguraDe(c.id, c.larguras).map((f, k) =>
    `.bn-block[data-id="${CSS.escape(c.id)}"] > .bn-block-group > .bn-block-outer:nth-child(${k + 1}){flex:${f.toFixed(4)} 1 0 !important}`).join('')).join('')

  // Onde ficam as divisões (medidas na tela; refeitas a cada mudança e quando a página muda de tamanho).
  const medir = useCallback(() => {
    const raiz = caixa.current
    if (!raiz || window.matchMedia('(max-width: 700px)').matches) { setAlcas([]); return }
    const r0 = raiz.getBoundingClientRect()
    const novas: Alca[] = []
    for (const c of colunas) {
      const grupo = raiz.querySelector(`.bn-block[data-id="${CSS.escape(c.id)}"] > .bn-block-group`)
      if (!grupo) continue
      const filhos = [...grupo.children].filter(e => e.classList.contains('bn-block-outer')).map(e => e.getBoundingClientRect())
      const g = grupo.getBoundingClientRect()
      for (let i = 0; i < filhos.length - 1; i++) {
        novas.push({ colunasId: c.id, i, x: (filhos[i].right + filhos[i + 1].left) / 2 - r0.left, top: g.top - r0.top, altura: g.height, largura: g.width })
      }
    }
    setAlcas(novas)
  }, [caixa, colunas])
  useLayoutEffect(() => { medir() }, [medir, estilo])
  useEffect(() => {
    const raiz = caixa.current
    if (!raiz) return
    const obs = new ResizeObserver(() => medir())
    obs.observe(raiz)
    window.addEventListener('resize', medir)
    return () => { obs.disconnect(); window.removeEventListener('resize', medir) }
  }, [caixa, medir])

  // Arrastar a divisão: mostra na hora e grava no bloco ao soltar.
  useEffect(() => {
    if (!arrasto) return
    const alca = alcas.find(a => a.colunasId === arrasto.colunasId && a.i === arrasto.i)
    const largura = alca?.largura || 1
    const mover = (e: MouseEvent) => setArrasto(a => a && { ...a, agora: moverDivisao(a.base, a.i, (e.clientX - a.x0) / largura) })
    const soltar = () => {
      setArrasto(a => {
        if (a) { try { editor.updateBlock(a.colunasId, { props: { larguras: escreverLarguras(a.agora) } }) } catch { /* bloco apagado no meio */ } }
        return null
      })
    }
    window.addEventListener('mousemove', mover)
    window.addEventListener('mouseup', soltar, { once: true })
    document.body.style.cursor = 'col-resize'
    return () => { window.removeEventListener('mousemove', mover); window.removeEventListener('mouseup', soltar); document.body.style.cursor = '' }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só ao começar/terminar o arrasto
  }, [arrasto?.colunasId, arrasto?.i])

  return <>
    {estilo && <style>{`@media (min-width: 701px){${estilo}}`}</style>}
    {editavel && alcas.map(a => <div key={`${a.colunasId}:${a.i}`} className={`${x.alcaColuna} ${arrasto?.colunasId === a.colunasId && arrasto.i === a.i ? x.alcaColunaAtiva : ''}`}
      style={{ left: a.x - 6, top: a.top, height: a.altura }} role="separator" aria-orientation="vertical" aria-label="Ajustar a largura das colunas"
      onMouseDown={e => {
        e.preventDefault()
        const base = colunas.find(c => c.id === a.colunasId)?.larguras ?? []
        setArrasto({ colunasId: a.colunasId, i: a.i, x0: e.clientX, base, agora: base })
      }}
      onDoubleClick={() => { const n = colunas.find(c => c.id === a.colunasId)?.larguras.length ?? 2; editor.updateBlock(a.colunasId, { props: { larguras: escreverLarguras(Array(n).fill(1 / n)) } }) }}
      title="Arraste para ajustar a largura (clique duas vezes para igualar)" />)}
  </>
}
