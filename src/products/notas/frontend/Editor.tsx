'use client'

// O editor em blocos (BlockNote) fica só aqui: se um dia trocarmos de biblioteca, a troca fica contida neste arquivo.
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { BlockNoteEditor, BlockNoteSchema, defaultBlockSpecs, defaultInlineContentSpecs, filterSuggestionItems, type Block, type PartialBlock } from '@blocknote/core'
import { blocksToYXmlFragment, CollaborationExtension } from '@blocknote/core/yjs'
import * as Y from 'yjs'
import type { Awareness } from 'y-protocols/awareness'
import { pt } from '@blocknote/core/locales'
import { createReactBlockSpec, createReactInlineContentSpec, getDefaultReactSlashMenuItems, SuggestionMenuController, useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Columns3, FileText, ListChecks, Plus, Table2 } from 'lucide-react'
import type { TipoVisao } from '@/products/notas/shared/bases'
import { BaseView } from './base/BaseView'
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
  const router = useRouter()
  const pagina = arvore?.paginas.find(p => p.id === paginaId)
  const sumiu = arvore != null && !pagina
  // Dentro do texto editável o clique vira seleção; por isso a navegação é feita aqui (Ctrl/Cmd abre em outra aba).
  return <Link href={`/notas/${paginaId}`} className={`${x.mencao} ${sumiu ? x.mencaoSumiu : ''}`} contentEditable={false}
    title={sumiu ? 'Página na lixeira ou sem acesso' : undefined}
    onMouseDown={e => e.stopPropagation()}
    onClick={e => { if (e.metaKey || e.ctrlKey || e.shiftKey) return; e.preventDefault(); e.stopPropagation(); router.push(`/notas/${paginaId}`) }}>
    <span className={x.mencaoIcone}>{pagina?.icone ?? (icone || '📄')}</span>
    <span className={x.mencaoTitulo}>{tituloExibido(pagina?.titulo ?? titulo)}</span>
  </Link>
}

const MencaoPagina = createReactInlineContentSpec(
  { type: 'mencao', propSchema: { paginaId: { default: '' }, titulo: { default: '' }, icone: { default: '' } }, content: 'none' },
  { render: ({ inlineContent }) => <MencaoView {...inlineContent.props} /> },
)
/** Base de dados dentro da página (bloco "/tabela", "/quadro"…): a base é uma subpágina; o bloco só mostra ela. */
const BaseBloco = createReactBlockSpec(
  { type: 'base', propSchema: { baseId: { default: '' } }, content: 'none' },
  { render: ({ block }) => block.props.baseId ? <div style={{ width: '100%' }}><BaseView id={block.props.baseId} embutida /></div> : null },
)
const schema = BlockNoteSchema.create({
  blockSpecs: { ...defaultBlockSpecs, base: BaseBloco() },
  inlineContentSpecs: { ...defaultInlineContentSpecs, mencao: MencaoPagina },
})
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
  /** "/tabela", "/quadro", "/lista", "/tarefas": cria a base como subpágina e devolve o id para o bloco. */
  criarBase: (modelo: 'vazia' | 'tarefas', visao: TipoVisao) => Promise<{ id: string; titulo: string; icone: string | null } | null>
  /** Chamado quando o editor aparece na tela (para receber o foco pedido antes de ele carregar). */
  aoCarregar?: () => void
  /**
   * Edição simultânea: o documento (fragmento Yjs), a presença e quem é a pessoa. `semear`: o servidor ainda não tem o
   * documento colaborativo; ele nasce do conteúdo salvo, sempre do mesmo jeito (id de cliente fixo), para que duas
   * pessoas abrindo ao mesmo tempo não dupliquem o texto.
   */
  colaboracao?: { fragment: Y.XmlFragment; awareness: Awareness; usuario: { name: string; color: string }; semear: boolean }
  /** Preenchido pelo editor: exportar e saber o bloco onde está o cursor. */
  controle?: MutableRefObject<ControleEditor | null>
  /** Ctrl+Alt+M: comentar o bloco onde está o cursor. */
  onComentar?: (blocoId: string, trecho: string) => void
  /** Blocos com discussão aberta (ficam marcados). */
  destaques?: string[]
}

export type ControleEditor = {
  markdown: () => string
  html: () => string
  blocoAtual: () => { id: string; trecho: string } | null
  irPara: (blocoId: string) => void
}

/** Texto puro de um bloco (para citar no comentário). */
function textoDoBloco(bloco: { content?: unknown }) {
  return Array.isArray(bloco.content) ? bloco.content.map(c => (c as { text?: string }).text ?? '').join('').slice(0, 300) : ''
}

/** Semeia o documento colaborativo a partir do conteúdo salvo (sempre igual: id de cliente 1 e um editor só de conversão). */
function semear(fragment: Y.XmlFragment, conteudo: unknown[]) {
  if (fragment.length || !fragment.doc) return
  const conversor = BlockNoteEditor.create({ schema })
  const blocos = (conteudo.length ? conteudo : [{ id: 'inicio', type: 'paragraph', props: {}, content: [], children: [] }]) as Block<typeof schema.blockSchema, typeof schema.inlineContentSchema, typeof schema.styleSchema>[]
  const semente = new Y.Doc()
  semente.clientID = 1
  blocksToYXmlFragment(conversor as never, blocos as never, semente.getXmlFragment('conteudo'))
  Y.applyUpdate(fragment.doc, Y.encodeStateAsUpdate(semente))
}

export default function Editor({ chave, conteudo, editavel, onMudar, criarSubpagina, paginaId, criarBase, aoCarregar, colaboracao, controle, onComentar, destaques }: EditorProps) {
  const escuro = useTemaEscuro()
  const { arvore } = useNotas()
  const inicial = useMemo(() => (Array.isArray(conteudo) && conteudo.length ? conteudo as PartialBlock[] : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- o conteúdo inicial só vale quando a página (chave) muda
    [chave])
  // O documento colaborativo precisa existir antes do editor se ligar a ele.
  useState(() => { if (colaboracao?.semear) semear(colaboracao.fragment, Array.isArray(conteudo) ? conteudo : []); return true })
  const editor = useCreateBlockNote({
    schema,
    ...(colaboracao
      ? { extensions: [CollaborationExtension({ fragment: colaboracao.fragment, user: colaboracao.usuario, provider: { awareness: colaboracao.awareness }, showCursorLabels: 'activity' })] }
      : { initialContent: inicial as never }),
    dictionary: { ...pt, placeholders: { ...pt.placeholders, default: "Digite '/' para ver os comandos" } },
    uploadFile: enviarArquivoNotas,
  }, [chave])

  useEffect(() => {
    if (!controle) return
    controle.current = {
      markdown: () => editor.blocksToMarkdownLossy(editor.document),
      html: () => editor.blocksToHTMLLossy(editor.document),
      blocoAtual: () => { try { const b = editor.getTextCursorPosition().block; return { id: b.id, trecho: textoDoBloco(b) } } catch { return null } },
      irPara: id => {
        const el = document.querySelector(`.bn-block[data-id="${CSS.escape(id)}"]`)
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        try { editor.setTextCursorPosition(id, 'end'); editor.focus() } catch { /* bloco apagado */ }
      },
    }
    return () => { controle.current = null }
  }, [editor, controle])

  const carregou = useRef(aoCarregar)
  useEffect(() => { carregou.current = aoCarregar })
  useEffect(() => { const t = setTimeout(() => carregou.current?.(), 0); return () => clearTimeout(t) }, [editor])

  return <div onKeyDown={e => {
    if (!onComentar || !(e.ctrlKey || e.metaKey) || !e.altKey || e.code !== 'KeyM') return
    e.preventDefault()
    try { const b = editor.getTextCursorPosition().block; onComentar(b.id, textoDoBloco(b)) } catch { /* sem cursor */ }
  }}>
  {destaques && destaques.length > 0 && <style>{destaques.map(id => `.bn-block[data-id="${CSS.escape(id)}"] > .bn-block-content`).join(',') + '{background:rgba(255,212,0,.16);border-bottom:2px solid rgba(255,212,0,.6)}'}</style>}
  <BlockNoteView editor={editor} editable={editavel} theme={escuro ? 'dark' : 'light'} slashMenu={false}
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
      ...([
        ['Tabela (base de dados)', 'Base de dados em tabela, dentro desta página', 'vazia', 'tabela', Table2, ['tabela', 'table', 'base', 'database', 'banco']],
        ['Quadro (base de dados)', 'Base de dados em quadro (kanban)', 'vazia', 'quadro', Columns3, ['quadro', 'kanban', 'board']],
        ['Lista de tarefas', 'Base com status, responsável, prazo e prioridade', 'tarefas', 'quadro', ListChecks, ['tarefas', 'tasks', 'todo']],
      ] as const).map(([title, subtext, modelo, visao, Icone, aliases]) => ({
        title, subtext, group: 'Bases de dados', aliases: [...aliases], icon: <Icone size={18} />,
        onItemClick: () => {
          const atual = editor.getTextCursorPosition().block
          void criarBase(modelo, visao).then(nova => { if (nova) editor.insertBlocks([{ type: 'base', props: { baseId: nova.id } }, { type: 'paragraph' }], atual, 'after') })
        },
      })),
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
  </div>
}

/** Conteúdo da menção para inserir no texto. */
function mencao(pagina: { id: string; titulo: string; icone: string | null }) {
  return { type: 'mencao' as const, props: { paginaId: pagina.id, titulo: pagina.titulo, icone: pagina.icone ?? '' } }
}
