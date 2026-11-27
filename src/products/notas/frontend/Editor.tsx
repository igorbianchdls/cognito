'use client'

// O editor em blocos (BlockNote) fica só aqui: se um dia trocarmos de biblioteca, a troca fica contida neste arquivo.
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import { BlockNoteEditor, BlockNoteSchema, createCodeBlockSpec, defaultBlockSpecs, defaultInlineContentSpecs, filterSuggestionItems, type Block, type PartialBlock } from '@blocknote/core'
import { codeBlockOptions, syntaxHighlighter } from '@blocknote/code-block'
import { blocksToYXmlFragment, CollaborationExtension } from '@blocknote/core/yjs'
import * as Y from 'yjs'
import type { Awareness } from 'y-protocols/awareness'
import { DICIONARIO, arrumarMenu } from './menuBarra'
import { IconePagina } from './IconePagina'
import { ColunasVivas } from './ColunasVivas'
import { BotoesDoCodigo } from './BotoesDoCodigo'
import { AcoesDoBlocoContexto, MenuDoBloco, semIds } from './MenuDoBloco'
import { Menu } from './Menu'
import { createReactBlockSpec, createReactInlineContentSpec, getDefaultReactSlashMenuItems, SideMenu, SideMenuController, SuggestionMenuController, useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Columns2, Columns3, FileText, Globe, ListChecks, MessageSquareWarning, MousePointerClick, Plus, Table2 } from 'lucide-react'
import type { TipoVisao } from '@/products/notas/shared/bases'
import { BaseView } from './base/BaseView'
import { Botao, Coluna, Colunas, Destaque, Incorporar, MencaoPessoa } from './blocos'
import { usePessoas } from './base/pessoas'
import { caminho, tituloExibido } from '@/products/notas/shared/arvore'
import { enviarArquivoNotas, notasApi, type Pagina } from './api'
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
/** Bloco de código com a linguagem escolhida e cores de sintaxe (as linguagens carregam só quando usadas). */
export const BLOCO_DE_CODIGO = createCodeBlockSpec({
  ...codeBlockOptions,
  defaultLanguage: 'text',
  supportedLanguages: { ...codeBlockOptions.supportedLanguages, text: { name: 'Texto', aliases: ['text', 'txt', 'texto'] } },
})
const schema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs, codeBlock: BLOCO_DE_CODIGO, base: BaseBloco(), destaque: Destaque(), colunas: Colunas(), coluna: Coluna(), incorporar: Incorporar(), botao: Botao(),
  },
  inlineContentSpecs: { ...defaultInlineContentSpecs, mencao: MencaoPagina, pessoa: MencaoPessoa },
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
  const pessoas = usePessoas()
  const { arvore, avisar } = useNotas()
  const inicial = useMemo(() => (Array.isArray(conteudo) && conteudo.length ? conteudo as PartialBlock[] : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- o conteúdo inicial só vale quando a página (chave) muda
    [chave])
  // O documento colaborativo precisa existir antes do editor se ligar a ele.
  useState(() => { if (colaboracao?.semear) semear(colaboracao.fragment, Array.isArray(conteudo) ? conteudo : []); return true })
  const editor = useCreateBlockNote({
    schema,
    ...(colaboracao
      ? { extensions: [syntaxHighlighter, CollaborationExtension({ fragment: colaboracao.fragment, user: colaboracao.usuario, provider: { awareness: colaboracao.awareness }, showCursorLabels: 'activity' })] }
      : { initialContent: inicial as never, extensions: [syntaxHighlighter] }),
    dictionary: DICIONARIO,
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

  /** Troca o bloco vazio do cursor (onde se digitou "/") pelo novo, ou insere abaixo. */
  const trocarBloco = (novo: Record<string, unknown>) => {
    const atual = editor.getTextCursorPosition().block
    const vazio = atual.type === 'paragraph' && !(atual.content as unknown[]).length
    if (vazio) editor.replaceBlocks([atual], [novo as never])
    else editor.insertBlocks([novo as never], atual, 'after')
  }

  const caixa = useRef<HTMLDivElement>(null)
  const [mover, setMover] = useState<{ bloco: { id: string }; ancora: HTMLElement } | null>(null)
  const [buscaMover, setBuscaMover] = useState('')
  const acoesDoBloco = useMemo(() => ({
    avisar: (texto: string) => avisar(texto),
    comentar: onComentar ? (b: { id: string; content?: unknown }) => onComentar(b.id, textoDoBloco(b)) : undefined,
    mover: editavel ? (bloco: { id: string }, ancora: HTMLElement) => { setBuscaMover(''); setMover({ bloco, ancora }) } : undefined,
  }), [avisar, onComentar, editavel])
  /** Leva o bloco (com o que tem dentro) para o fim de outra página e tira daqui. */
  const moverPara = async (destino: { id: string; titulo: string }) => {
    const alvo = mover; setMover(null)
    if (!alvo) return
    const bloco = editor.getBlock(alvo.bloco.id)
    if (!bloco) return
    try {
      const pagina = await notasApi<Pagina>(`/paginas/${destino.id}`)
      await notasApi(`/paginas/${destino.id}`, { method: 'PATCH', json: { versao: pagina.versao, conteudo: [...(pagina.conteudo as unknown[] ?? []), semIds(bloco as never)] } })
      editor.removeBlocks([bloco])
      avisar(`Movido para “${tituloExibido(destino.titulo)}”.`)
    } catch (e) { avisar((e as Error).message) }
  }
  // Link de um bloco (#b-<id>): ao abrir a página, rola até ele (o conteúdo colaborativo pode chegar um pouco depois).
  useEffect(() => {
    const id = location.hash.startsWith('#b-') ? decodeURIComponent(location.hash.slice(3)) : ''
    if (!id) return
    let tentativas = 0
    const t = setInterval(() => {
      const el = document.querySelector(`.bn-block[data-id="${CSS.escape(id)}"]`)
      if (el || ++tentativas > 20) {
        clearInterval(t)
        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add(x.blocoDestacado); setTimeout(() => el.classList.remove(x.blocoDestacado), 2400) }
      }
    }, 250)
    return () => clearInterval(t)
  }, [editor])
  // Testes de tela (só em desenvolvimento): o documento do editor fica acessível para conferir a estrutura.
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return
    ;(window as unknown as { __notasEditor?: unknown }).__notasEditor = editor
  }, [editor])
  const carregou = useRef(aoCarregar)
  useEffect(() => { carregou.current = aoCarregar })
  useEffect(() => { const t = setTimeout(() => carregou.current?.(), 0); return () => clearTimeout(t) }, [editor])

  return <div ref={caixa} className={x.editorCaixa} onKeyDown={e => {
    if (!onComentar || !(e.ctrlKey || e.metaKey) || !e.altKey || e.code !== 'KeyM') return
    e.preventDefault()
    try { const b = editor.getTextCursorPosition().block; onComentar(b.id, textoDoBloco(b)) } catch { /* sem cursor */ }
  }}>
  {destaques && destaques.length > 0 && <style>{destaques.map(id => `.bn-block[data-id="${CSS.escape(id)}"] > .bn-block-content`).join(',') + '{background:rgba(255,212,0,.16);border-bottom:2px solid rgba(255,212,0,.6)}'}</style>}
  <AcoesDoBlocoContexto.Provider value={acoesDoBloco}>
  <BlockNoteView editor={editor} editable={editavel} theme={escuro ? 'dark' : 'light'} slashMenu={false} sideMenu={false}
    onChange={() => onMudar(editor.document)}>
    <SuggestionMenuController triggerCharacter="/" getItems={async query => arrumarMenu(filterSuggestionItems([
      ...getDefaultReactSlashMenuItems(editor),
      {
        title: 'Página', subtext: 'Uma página dentro desta', group: 'Básicos', aliases: ['pagina', 'page', 'subpagina'],
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
        ['Tabela (base de dados)', 'Base com colunas tipadas, filtros e visões', 'vazia', 'tabela', Table2, ['tabela', 'table', 'base', 'database', 'banco']],
        ['Quadro (base de dados)', 'Cartões em colunas, como um kanban', 'vazia', 'quadro', Columns3, ['quadro', 'kanban', 'board']],
        ['Lista de tarefas', 'Base com status, responsável, prazo e prioridade', 'tarefas', 'quadro', ListChecks, ['tarefas', 'tasks', 'todo']],
      ] as const).map(([title, subtext, modelo, visao, Icone, aliases]) => ({
        title, subtext, group: 'Bases de dados', aliases: [...aliases], icon: <Icone size={18} />,
        onItemClick: () => {
          const atual = editor.getTextCursorPosition().block
          void criarBase(modelo, visao).then(nova => { if (nova) editor.insertBlocks([{ type: 'base', props: { baseId: nova.id } }, { type: 'paragraph' }], atual, 'after') })
        },
      })),
      {
        title: 'Destaque', subtext: 'Texto em evidência, com ícone e cor de fundo', group: 'Básicos', aliases: ['destaque', 'callout', 'aviso', 'nota'],
        icon: <MessageSquareWarning size={18} />, onItemClick: () => trocarBloco({ type: 'destaque' }),
      },
      ...([2, 3] as const).map(n => ({
        title: `${n} colunas`, subtext: `Blocos lado a lado em ${n} colunas`, group: 'Layout', aliases: ['colunas', 'columns', `${n}`],
        icon: n === 2 ? <Columns2 size={18} /> : <Columns3 size={18} />,
        onItemClick: () => {
          trocarBloco({ type: 'colunas', children: Array.from({ length: n }, () => ({ type: 'coluna', children: [{ type: 'paragraph' }] })) })
          // O cursor vai para o texto da primeira coluna.
          const colunas = editor.document.find(b => b.type === 'colunas' && b.children.length === n && b.children.every(c => c.children.length === 1 && !(c.children[0].content as unknown[]).length))
          const primeiro = colunas?.children[0]?.children[0]
          if (primeiro) editor.setTextCursorPosition(primeiro.id, 'start')
        },
      })),
      {
        title: 'Incorporar', subtext: 'YouTube, Vimeo, Loom, Figma, Google Maps ou PDF por link', group: 'Mídia', aliases: ['incorporar', 'embed', 'youtube', 'video', 'figma', 'mapa'],
        icon: <Globe size={18} />, onItemClick: () => trocarBloco({ type: 'incorporar' }),
      },
      {
        title: 'Botão', subtext: 'Um clique insere texto pronto ou cria um item', group: 'Avançados', aliases: ['botao', 'button', 'acao'],
        icon: <MousePointerClick size={18} />, onItemClick: () => trocarBloco({ type: 'botao' }),
      },
    ], query))} />
    <SuggestionMenuController triggerCharacter="@" getItems={async query => {
      const termoPessoa = query.trim().toLowerCase()
      const listaPessoas = pessoas.filter(p => p.nome.toLowerCase().includes(termoPessoa)).slice(0, 6).map(p => ({
        title: p.nome, subtext: 'Avisa a pessoa em Atualizações', group: 'Pessoas', aliases: [],
        icon: <span className={x.avatar}>{p.nome.slice(0, 1).toUpperCase()}</span>,
        onItemClick: () => editor.insertInlineContent([{ type: 'pessoa', props: { userId: p.id, nome: p.nome } }, ' ']),
      }))
      // Páginas que a pessoa vê, recentes primeiro; o texto filtra pelo título.
      const termo = query.trim().toLowerCase()
      const recentes = new Map((arvore?.recentes ?? []).map((id, i) => [id, i]))
      const paginas = (arvore?.paginas ?? []).filter(p => p.id !== paginaId && tituloExibido(p.titulo).toLowerCase().includes(termo))
        .sort((a, b) => (recentes.get(a.id) ?? 99) - (recentes.get(b.id) ?? 99) || tituloExibido(a.titulo).localeCompare(tituloExibido(b.titulo), 'pt-BR'))
        .slice(0, MAX_MENCOES)
      const local = (id: string) => arvore ? caminho(arvore.paginas, id).slice(0, -1).map(p => tituloExibido(p.titulo)).join(' / ') : ''
      return titulosUnicos([
        ...listaPessoas,
        ...paginas.map(p => ({
          title: tituloExibido(p.titulo), subtext: local(p.id) || (p.espaco === 'particular' ? 'Particular' : 'Equipe'), group: 'Mencionar página',
          icon: <IconePagina icone={p.icone} tipo={p.tipo} tamanho={16} />,
          onItemClick: () => editor.insertInlineContent([mencao(p), ' ']),
        })),
        ...(editavel ? [{
          title: termo ? `Nova página “${query.trim()}”` : 'Nova página', subtext: 'Cria uma subpágina desta e menciona aqui', group: 'Criar',
          icon: <Plus size={16} />,
          onItemClick: () => { void criarSubpagina(query.trim()).then(nova => { if (nova) editor.insertInlineContent([mencao(nova), ' ']) }) },
        }] : []),
      ])
    }} />
    <SideMenuController sideMenu={props => <SideMenu {...props} dragHandleMenu={MenuDoBloco} />} />
  </BlockNoteView>
  </AcoesDoBlocoContexto.Provider>
  <BotoesDoCodigo editor={editor as never} caixa={caixa} />
  {mover && <Menu ancora={mover.ancora} onFechar={() => setMover(null)} className={x.menuWide}>
    <div className={x.menuLabel}>Mover para</div>
    <div className={x.filterRow}><input autoFocus value={buscaMover} onChange={e => setBuscaMover(e.target.value)} placeholder="Buscar página…" aria-label="Buscar página de destino" style={{ flex: 1 }} /></div>
    <div style={{ maxHeight: 280, overflowY: 'auto' }}>
      {(arvore?.paginas ?? []).filter(p => p.id !== paginaId && (p.tipo ?? 'pagina') === 'pagina' && !p.base_id
        && tituloExibido(p.titulo).toLowerCase().includes(buscaMover.trim().toLowerCase())).slice(0, 30)
        .map(p => <button key={p.id} type="button" className={x.menuItem} onClick={() => void moverPara(p)}>
          <IconePagina icone={p.icone} tipo={p.tipo} tamanho={15} /><span>{tituloExibido(p.titulo)}</span>
        </button>)}
    </div>
  </Menu>}
  <ColunasVivas editor={editor as never} editavel={editavel} caixa={caixa} />
  </div>
}

/**
 * O menu de sugestões do editor usa o título como chave: duas páginas com o mesmo nome (ou duas "Sem título")
 * colidiam e o React podia esconder ou trocar itens. Repetidos ganham espaços invisíveis no fim (a tela não muda).
 */
function titulosUnicos<T extends { title: string }>(itens: T[]): T[] {
  const vistos = new Map<string, number>()
  return itens.map(item => {
    const n = vistos.get(item.title) ?? 0
    vistos.set(item.title, n + 1)
    return n ? { ...item, title: item.title + '\u200b'.repeat(n) } : item
  })
}

/** Conteúdo da menção para inserir no texto. */
function mencao(pagina: { id: string; titulo: string; icone: string | null }) {
  return { type: 'mencao' as const, props: { paginaId: pagina.id, titulo: pagina.titulo, icone: pagina.icone ?? '' } }
}
