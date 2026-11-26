'use client'

// O editor em blocos (BlockNote) fica só aqui: se um dia trocarmos de biblioteca, a troca fica contida neste arquivo.
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import { useEffect, useMemo, useState } from 'react'
import { filterSuggestionItems, type PartialBlock } from '@blocknote/core'
import { pt } from '@blocknote/core/locales'
import { getDefaultReactSlashMenuItems, SuggestionMenuController, useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import { FileText } from 'lucide-react'
import { enviarArquivoNotas } from './api'

/** Segue o tema do Otto (classe .dark no html). */
function useTemaEscuro() {
  const [escuro, setEscuro] = useState(false)
  useEffect(() => {
    const ler = () => setEscuro(document.documentElement.classList.contains('dark'))
    ler()
    const observador = new MutationObserver(ler)
    observador.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observador.disconnect()
  }, [])
  return escuro
}

export type EditorProps = {
  /** Muda quando é outra página (ou a pessoa recarregou depois de um conflito): o editor recomeça com o conteúdo novo. */
  chave: string
  conteudo: unknown[]
  editavel: boolean
  onMudar: (blocos: unknown[]) => void
  /** "/página": cria a subpágina e devolve o id e o título para o link no texto. */
  criarSubpagina: () => Promise<{ id: string; titulo: string } | null>
}

export default function Editor({ chave, conteudo, editavel, onMudar, criarSubpagina }: EditorProps) {
  const escuro = useTemaEscuro()
  const inicial = useMemo(() => (Array.isArray(conteudo) && conteudo.length ? conteudo as PartialBlock[] : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- o conteúdo inicial só vale quando a página (chave) muda
    [chave])
  const editor = useCreateBlockNote({
    initialContent: inicial,
    dictionary: { ...pt, placeholders: { ...pt.placeholders, default: "Digite '/' para ver os comandos" } },
    uploadFile: enviarArquivoNotas,
  }, [chave])

  return <BlockNoteView editor={editor} editable={editavel} theme={escuro ? 'dark' : 'light'} slashMenu={false}
    onChange={() => onMudar(editor.document)}>
    <SuggestionMenuController triggerCharacter="/" getItems={async query => filterSuggestionItems([
      ...getDefaultReactSlashMenuItems(editor),
      {
        title: 'Página', subtext: 'Cria uma subpágina dentro desta', group: 'Básicos', aliases: ['pagina', 'page', 'subpagina'],
        icon: <FileText size={18} />,
        onItemClick: () => {
          void criarSubpagina().then(nova => {
            if (!nova) return
            const atual = editor.getTextCursorPosition().block
            editor.insertBlocks([{ type: 'paragraph', content: [{ type: 'link', href: `/notas/${nova.id}`, content: `📄 ${nova.titulo || 'Sem título'}` }] }], atual, 'after')
          })
        },
      },
    ], query)} />
  </BlockNoteView>
}
