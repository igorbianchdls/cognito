'use client'

// Menu da alça do bloco (⋮⋮), como o do Notion: transformar em outro tipo, duplicar, copiar link do bloco, comentar,
// mover para outra página, cores e excluir. Substitui o menu padrão do editor (que só tinha excluir e cores).
import { createContext, useContext, type ReactNode } from 'react'
import { BlockColorsItem, DragHandleMenu, RemoveBlockItem, useBlockNoteEditor, useComponentsContext, useExtensionState, usePortalElement } from '@blocknote/react'
import { SideMenuExtension } from '@blocknote/core/extensions'
import {
  ArrowRightLeft, Code2, Copy, Heading1, Heading2, Heading3, Link2, List, ListChecks, ListCollapse, ListOrdered,
  MessageSquare, MessageSquareWarning, Quote, Repeat2, Type,
} from 'lucide-react'
import x from './notas.module.css'

type Bloco = { id: string; type: string; props?: Record<string, unknown>; content?: unknown; children?: Bloco[] }

/** O que o menu precisa da página (o editor sozinho não sabe comentar nem mover entre páginas). */
export type AcoesDoBloco = {
  comentar?: (bloco: Bloco) => void
  mover?: (bloco: Bloco, ancora: HTMLElement) => void
  avisar: (texto: string) => void
}
export const AcoesDoBlocoContexto = createContext<AcoesDoBloco>({ avisar: () => undefined })

/** Cópia do bloco sem os ids (o editor dá ids novos), com os filhos. */
export const semIds = (b: Bloco): Bloco => {
  const { id: _id, children, ...resto } = b
  return { ...resto, children: (children ?? []).map(semIds) } as Bloco
}

/** Tipos para "Transformar em" (só blocos de texto). */
const TIPOS: { nome: string; icone: typeof Type; tipo: string; props?: Record<string, unknown> }[] = [
  { nome: 'Texto', icone: Type, tipo: 'paragraph' },
  { nome: 'Título 1', icone: Heading1, tipo: 'heading', props: { level: 1 } },
  { nome: 'Título 2', icone: Heading2, tipo: 'heading', props: { level: 2 } },
  { nome: 'Título 3', icone: Heading3, tipo: 'heading', props: { level: 3 } },
  { nome: 'Lista com marcadores', icone: List, tipo: 'bulletListItem' },
  { nome: 'Lista numerada', icone: ListOrdered, tipo: 'numberedListItem' },
  { nome: 'Lista de verificação', icone: ListChecks, tipo: 'checkListItem' },
  { nome: 'Lista expansível', icone: ListCollapse, tipo: 'toggleListItem' },
  { nome: 'Citação', icone: Quote, tipo: 'quote' },
  { nome: 'Destaque', icone: MessageSquareWarning, tipo: 'destaque' },
  { nome: 'Código', icone: Code2, tipo: 'codeBlock' },
]

function Item({ icone: Icone, children, onClick }: { icone: typeof Type; children: ReactNode; onClick: () => void }) {
  const c = useComponentsContext()!
  return <c.Generic.Menu.Item className="bn-menu-item" onClick={onClick}>
    <span className={x.menuBlocoItem}><Icone size={15} />{children}</span>
  </c.Generic.Menu.Item>
}

export function MenuDoBloco() {
  const c = useComponentsContext()!
  const editor = useBlockNoteEditor()
  const acoes = useContext(AcoesDoBlocoContexto)
  const portal = usePortalElement()
  const bloco = useExtensionState(SideMenuExtension, { editor, selector: s => s?.block }) as Bloco | undefined
  if (!bloco) return <DragHandleMenu />
  const comTexto = (editor.schema.blockSchema as Record<string, { content?: string }>)[bloco.type]?.content === 'inline'
  const ed = editor as unknown as {
    insertBlocks: (b: Bloco[], ref: Bloco, onde: 'after') => Bloco[]
    updateBlock: (b: Bloco, m: Partial<Bloco>) => void
    setTextCursorPosition: (id: string, onde: 'end') => void
  }
  const elemento = () => document.querySelector<HTMLElement>(`.bn-block[data-id="${CSS.escape(bloco.id)}"]`) ?? document.body

  return <DragHandleMenu>
    {comTexto && <c.Generic.Menu.Root position="right" sub portalElement={portal ?? null}>
      <c.Generic.Menu.Trigger sub>
        <c.Generic.Menu.Item className="bn-menu-item" subTrigger>
          <span className={x.menuBlocoItem}><Repeat2 size={15} />Transformar em</span>
        </c.Generic.Menu.Item>
      </c.Generic.Menu.Trigger>
      <c.Generic.Menu.Dropdown sub className="bn-menu-dropdown">
        {TIPOS.filter(t => !(t.tipo === bloco.type && JSON.stringify(t.props ?? {}) === JSON.stringify(t.tipo === 'heading' ? { level: bloco.props?.level } : {})))
          .map(t => <Item key={t.nome} icone={t.icone} onClick={() => ed.updateBlock(bloco, { type: t.tipo, props: t.props ?? {} })}>{t.nome}</Item>)}
      </c.Generic.Menu.Dropdown>
    </c.Generic.Menu.Root>}
    <Item icone={Copy} onClick={() => {
      const [novo] = ed.insertBlocks([semIds(bloco)], bloco, 'after')
      if (novo) try { ed.setTextCursorPosition(novo.id, 'end') } catch { /* bloco sem texto */ }
    }}>Duplicar</Item>
    <Item icone={Link2} onClick={() => {
      const url = `${location.origin}${location.pathname}#b-${bloco.id}`
      void navigator.clipboard.writeText(url).then(() => acoes.avisar('Link do bloco copiado.'))
    }}>Copiar link do bloco</Item>
    {acoes.comentar && <Item icone={MessageSquare} onClick={() => acoes.comentar!(bloco)}>Comentar</Item>}
    {acoes.mover && <Item icone={ArrowRightLeft} onClick={() => acoes.mover!(bloco, elemento())}>Mover para…</Item>}
    <BlockColorsItem>
      <span className={x.menuBlocoItem}><span className={x.menuBlocoCor}>A</span>Cores</span>
    </BlockColorsItem>
    <RemoveBlockItem>
      <span className={`${x.menuBlocoItem} ${x.menuBlocoPerigo}`}>Excluir</span>
    </RemoveBlockItem>
  </DragHandleMenu>
}
