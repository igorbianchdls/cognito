'use client'

// Soltar um bloco na lateral de outro cria colunas (como no Notion): ao arrastar pela alça (⋮⋮) e passar perto da
// borda esquerda ou direita de um bloco, aparece uma barra azul vertical; soltando ali, os dois ficam lado a lado.
// Se o bloco de destino já está numa coluna, entra uma coluna nova ao lado dela. Fora das bordas, o arraste normal
// do editor (acima/abaixo) continua igual.
import { useEffect, useRef, useState, type RefObject } from 'react'
import { useBlockNoteEditor, useExtensionState } from '@blocknote/react'
import { SideMenuExtension } from '@blocknote/core/extensions'
import { semIds } from './MenuDoBloco'
import x from './notas.module.css'

type Bloco = { id: string; type: string; props?: Record<string, unknown>; children?: Bloco[] }
type EditorLateral = {
  getBlock: (id: string) => Bloco | undefined
  getParentBlock: (id: string) => Bloco | undefined
  insertBlocks: (b: unknown[], ref: string, onde: 'before' | 'after') => unknown
  replaceBlocks: (ids: string[], novos: unknown[]) => unknown
  removeBlocks: (ids: string[]) => unknown
  updateBlock: (id: string, m: unknown) => unknown
  transact: <T>(f: () => T) => T
}
type Alvo = { id: string; lado: 'esquerda' | 'direita'; x: number; top: number; altura: number }

const contem = (b: Bloco, id: string): boolean => (b.children ?? []).some(f => f.id === id || contem(f, id))

export function ArrasteLateral({ caixa, editavel }: { caixa: RefObject<HTMLDivElement | null>; editavel: boolean }) {
  const editor = useBlockNoteEditor() as unknown as EditorLateral
  const doMenu = useExtensionState(SideMenuExtension, { editor: editor as never, selector: s => s?.block?.id }) as string | undefined
  const blocoDoMenu = useRef<string | undefined>(undefined)
  useEffect(() => { blocoDoMenu.current = doMenu }, [doMenu])
  const arrastado = useRef<string | null>(null)
  const [alvo, setAlvo] = useState<Alvo | null>(null)
  const alvoAtual = useRef<Alvo | null>(null)

  useEffect(() => {
    const raiz = caixa.current
    if (!raiz || !editavel) return
    const mostrar = (a: Alvo | null) => { alvoAtual.current = a; setAlvo(a) }
    // A linha de "soltar acima/abaixo" do editor some quando o arraste passa a ser nosso (o editor não recebe o resto).
    const apagarLinhaDoEditor = () => raiz.querySelector('.ProseMirror')?.dispatchEvent(new DragEvent('dragleave', { bubbles: true, relatedTarget: null }))

    const comecar = (e: DragEvent) => { arrastado.current = (e.target as HTMLElement | null)?.closest('.bn-side-menu') ? blocoDoMenu.current ?? null : null }
    const passar = (e: DragEvent) => {
      const id = arrastado.current
      if (!id) return
      const sob = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('.bn-block[data-id]')
      const conteudo = sob?.querySelector<HTMLElement>(':scope > .bn-block-content')
      const tipo = conteudo?.dataset.contentType
      const alvoId = sob?.dataset.id
      if (!sob || !conteudo || !alvoId || tipo === 'colunas' || tipo === 'coluna' || alvoId === id) { if (alvoAtual.current) mostrar(null); return }
      const movido = editor.getBlock(id)
      if (!movido || contem(movido, alvoId)) { if (alvoAtual.current) mostrar(null); return }
      const r = conteudo.getBoundingClientRect()
      const borda = Math.min(64, r.width * 0.2)
      const lado = e.clientX < r.left + borda ? 'esquerda' : e.clientX > r.right - borda ? 'direita' : null
      if (!lado || e.clientY < r.top || e.clientY > r.bottom) { if (alvoAtual.current) mostrar(null); return }
      // Na borda: este arraste é nosso (o editor não mostra a linha de soltar acima/abaixo).
      e.preventDefault(); e.stopPropagation()
      if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
      const a = { id: alvoId, lado, x: lado === 'esquerda' ? r.left - 4 : r.right + 2, top: r.top, altura: r.height } as Alvo
      const antes = alvoAtual.current
      if (!antes || antes.id !== a.id || antes.lado !== a.lado || antes.top !== a.top) { mostrar(a); apagarLinhaDoEditor() }
    }
    const soltar = (e: DragEvent) => {
      const a = alvoAtual.current, id = arrastado.current
      if (!a || !id) return
      e.preventDefault(); e.stopPropagation()
      mostrar(null); arrastado.current = null
      apagarLinhaDoEditor()
      const destino = editor.getBlock(a.id), movido = editor.getBlock(id)
      if (!destino || !movido) return
      const copia = semIds(movido as never)
      const coluna = editor.getParentBlock(a.id)
      try {
        editor.transact(() => {
          if (coluna?.type === 'coluna') {
            // Já numa coluna: uma coluna nova ao lado dela (as larguras voltam a ser iguais).
            const colunas = editor.getParentBlock(coluna.id)
            editor.insertBlocks([{ type: 'coluna', children: [copia] }], coluna.id, a.lado === 'esquerda' ? 'before' : 'after')
            if (colunas) editor.updateBlock(colunas.id, { props: { larguras: '' } })
          } else {
            const lado = [{ type: 'coluna', children: [copia] }, { type: 'coluna', children: [destino] }]
            editor.replaceBlocks([destino.id], [{ type: 'colunas', children: a.lado === 'esquerda' ? lado : lado.reverse() }])
          }
          if (editor.getBlock(id)) editor.removeBlocks([id])
        })
      } catch { /* o documento mudou no meio do arraste: nada a fazer */ }
    }
    const terminar = () => { arrastado.current = null; mostrar(null) }

    raiz.addEventListener('dragstart', comecar, true)
    raiz.addEventListener('dragover', passar, true)
    raiz.addEventListener('drop', soltar, true)
    window.addEventListener('dragend', terminar, true)
    return () => {
      raiz.removeEventListener('dragstart', comecar, true)
      raiz.removeEventListener('dragover', passar, true)
      raiz.removeEventListener('drop', soltar, true)
      window.removeEventListener('dragend', terminar, true)
    }
  }, [caixa, editor, editavel])

  return alvo ? <div className={x.soltarLateral} style={{ left: alvo.x, top: alvo.top, height: alvo.altura }} aria-hidden /> : null
}
