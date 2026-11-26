'use client'

// O editor em blocos (BlockNote) fica só aqui: se um dia trocarmos de biblioteca, a troca fica contida neste arquivo.
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import { useEffect, useMemo, useState } from 'react'
import { BlockNoteSchema, defaultInlineContentSpecs, filterSuggestionItems, type PartialBlock } from '@blocknote/core'
import { pt } from '@blocknote/core/locales'
import { createReactInlineContentSpec, getDefaultReactSlashMenuItems, SuggestionMenuController, useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import Link from 'next/link'
import { FileText, Plus } from 'lucide-react'
import { caminho, tituloExibido } from '@/products/notas/shared/arvore'
import { enviarArquivoNotas } from './api'
import { useNotas } from './NotasProvider'
import x from './notas.module.css'

/**
 * Menção de página (@): guarda o id e, de reserva, o título e o ícone de quando foi inserida. Mostra sempre o título e
 * o ícone atuais da página (pela árvore), como no Notion; página apagada aparece riscada.
 */
function MencaoView({ paginaId, titulo, icone }: { paginaId: string; titulo: string; icone: string }) {
  const { arvore } = useNotas()
  const pagina = arvore?.paginas.find(p => p.id === paginaId)
  const sumiu = arvore != null && !pagina
  return <Link href={`/notas/${paginaId}`} className={`${x.mencao} ${sumiu ? x.mencaoSumiu : ''}`} contentEditable={false}
    title={sumiu ? 'Página na lixeira ou sem acesso' : undefined}>
    <span className={x.mencaoIcone}>{pagina?.icone ?? (icone || '📄')}</span>
    <span className={x.mencaoTitulo}>{tituloExibido(pagina?.titulo ?? titulo)}</span>
  </Link>
}

const MencaoPagina = createReactInlineContentSpec(
  { type: 'mencao', propSchema: { paginaId: { default: '' }, titulo: { default: '' }, icone: { default: '' } }, content: 'none' },
  { render: ({ inlineContent }) => <MencaoView {...inlineContent.props} /> },
)
const schema = BlockNoteSchema.create({ inlineContentSpecs: { ...defaultInlineContentSpecs, mencao: MencaoPagina } })
const MAX_MENCOES = 10

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
  /** "/página" e "@nova": cria a página (subpágina desta) e devolve o id, o título e o ícone para a menção. */
  criarSubpagina: (titulo?: string) => Promise<{ id: string; titulo: string; icone: string | null } | null>
  /** Página aberta (não aparece no @ dela mesma). */
  paginaId: string
}

export default function Editor({ chave, conteudo, editavel, onMudar, criarSubpagina, paginaId }: EditorProps) {
  const escuro = useTemaEscuro()
  const { arvore } = useNotas()
  const inicial = useMemo(() => (Array.isArray(conteudo) && conteudo.length ? conteudo as PartialBlock[] : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- o conteúdo inicial só vale quando a página (chave) muda
    [chave])
  const editor = useCreateBlockNote({
    schema,
    initialContent: inicial as never,
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
            editor.insertBlocks([{ type: 'paragraph', content: [mencao(nova)] }], atual, 'after')
          })
        },
      },
    ], query)} />
    <SuggestionMenuController triggerCharacter="@" getItems={async query => {
      // Páginas que a pessoa vê, recentes primeiro; o texto filtra pelo título.
      const termo = query.trim().toLowerCase()
      const recentes = new Map((arvore?.recentes ?? []).map((id, i) => [id, i]))
      const paginas = (arvore?.paginas ?? []).filter(p => p.id !== paginaId && tituloExibido(p.titulo).toLowerCase().includes(termo))
        .sort((a, b) => (recentes.get(a.id) ?? 99) - (recentes.get(b.id) ?? 99) || tituloExibido(a.titulo).localeCompare(tituloExibido(b.titulo), 'pt-BR'))
        .slice(0, MAX_MENCOES)
      const local = (id: string) => arvore ? caminho(arvore.paginas, id).slice(0, -1).map(p => tituloExibido(p.titulo)).join(' / ') : ''
      return [
        ...paginas.map(p => ({
          title: tituloExibido(p.titulo), subtext: local(p.id) || (p.espaco === 'particular' ? 'Particular' : 'Equipe'), group: 'Mencionar página',
          icon: <span style={{ fontSize: 16 }}>{p.icone ?? '📄'}</span>,
          onItemClick: () => editor.insertInlineContent([mencao(p), ' ']),
        })),
        ...(editavel ? [{
          title: termo ? `Nova página “${query.trim()}”` : 'Nova página', subtext: 'Cria uma subpágina desta e menciona aqui', group: 'Criar',
          icon: <Plus size={16} />,
          onItemClick: () => { void criarSubpagina(query.trim()).then(nova => { if (nova) editor.insertInlineContent([mencao(nova), ' ']) }) },
        }] : []),
      ]
    }} />
  </BlockNoteView>
}

/** Conteúdo da menção para inserir no texto. */
function mencao(pagina: { id: string; titulo: string; icone: string | null }) {
  return { type: 'mencao' as const, props: { paginaId: pagina.id, titulo: pagina.titulo, icone: pagina.icone ?? '' } }
}
