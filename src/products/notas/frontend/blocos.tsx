'use client'

// Blocos próprios das Notas no editor: destaque (callout), colunas, incorporar, botão e menção de pessoa (@).
import { useState } from 'react'
import { createReactBlockSpec, createReactInlineContentSpec } from '@blocknote/react'
import { ExternalLink, Globe, Play, Settings2 } from 'lucide-react'
import { incorporacao, incorporarArquivo } from '@/products/notas/shared/incorporar'
import { tituloExibido } from '@/products/notas/shared/arvore'
import { notasApi } from './api'
import { Menu } from './Menu'
import { useNotas } from './NotasProvider'
import { usePessoas } from './base/pessoas'
import x from './notas.module.css'

const ICONES_DESTAQUE = ['💡', '📌', '⚠️', '✅', '❗', '📣', 'ℹ️', '🔥']
const CORES_DESTAQUE = ['cinza', 'marrom', 'laranja', 'amarelo', 'verde', 'azul', 'roxo', 'rosa', 'vermelho'] as const

/** Destaque (callout): ícone + texto num fundo colorido. Clicar no ícone troca; o canto troca a cor. */
export const Destaque = createReactBlockSpec(
  { type: 'destaque', propSchema: { icone: { default: '💡' }, cor: { default: 'cinza' } }, content: 'inline' },
  {
    render: ({ block, editor, contentRef }) => {
      const editavel = editor.isEditable
      const trocar = (props: Record<string, string>) => editor.updateBlock(block, { props })
      return <div className={x.destaque} data-cor={block.props.cor}>
        <button type="button" contentEditable={false} className={x.destaqueIcone} disabled={!editavel} aria-label="Trocar ícone do destaque"
          onClick={() => trocar({ icone: ICONES_DESTAQUE[(ICONES_DESTAQUE.indexOf(block.props.icone) + 1) % ICONES_DESTAQUE.length] })}>{block.props.icone}</button>
        <div className={x.destaqueTexto} ref={contentRef} />
        {editavel && <button type="button" contentEditable={false} className={x.destaqueCor} aria-label="Trocar cor do destaque" title="Trocar cor"
          onClick={() => trocar({ cor: CORES_DESTAQUE[(CORES_DESTAQUE.indexOf(block.props.cor as typeof CORES_DESTAQUE[number]) + 1) % CORES_DESTAQUE.length] })} />}
      </div>
    },
  },
)

/**
 * Colunas: o bloco "colunas" tem como filhos blocos "coluna", e cada coluna tem o conteúdo como filhos. Os dois só
 * marcam a estrutura; o CSS põe as colunas lado a lado.
 */
export const Colunas = createReactBlockSpec(
  // larguras: proporções das colunas ("0.6,0.4"); vazio = iguais. As alças do editor (ColunasVivas) ajustam.
  { type: 'colunas', propSchema: { larguras: { default: '' } }, content: 'none' },
  { render: () => <div className={x.colunasMarca} contentEditable={false} /> },
)
export const Coluna = createReactBlockSpec(
  { type: 'coluna', propSchema: {}, content: 'none' },
  { render: () => <div className={x.colunasMarca} contentEditable={false} /> },
)

/** Incorporar: YouTube, Vimeo, Loom, Figma, Google Maps e PDF viram quadro; outros links, um cartão. */
export const Incorporar = createReactBlockSpec(
  { type: 'incorporar', propSchema: { url: { default: '' } }, content: 'none' },
  {
    render: ({ block, editor }) => {
      const url = block.props.url
      if (!url) return <FormIncorporar editavel={editor.isEditable} onUsar={u => editor.updateBlock(block, { props: { url: u } })} />
      const quadro = incorporarArquivo(url) ?? incorporacao(url)
      if (quadro?.tipo === 'quadro') {
        return <QuadroIncorporado src={quadro.src} servico={quadro.servico} proporcao={quadro.proporcao} url={url} />
      }
      return <a className={x.cartaoLink} href={quadro?.tipo === 'link' ? quadro.url : '#'} target="_blank" rel="noreferrer" contentEditable={false}>
        <ExternalLink size={16} /><span>{quadro?.tipo === 'link' ? quadro.url : url}</span>
      </a>
    },
  },
)

/** Quadro incorporado: enquanto carrega mostra o serviço; embaixo, o nome e o link para abrir fora (se o site bloquear). */
function QuadroIncorporado({ src, servico, proporcao, url }: { src: string; servico: string; proporcao: number; url: string }) {
  const [carregou, setCarregou] = useState(false)
  return <figure className={x.incorporadoCaixa} contentEditable={false}>
    <div className={x.incorporado} style={{ aspectRatio: String(proporcao) }}>
      {!carregou && <div className={x.incorporadoCarregando}><Globe size={22} /><span>Carregando {servico}…</span></div>}
      <iframe src={src} title={servico} loading="lazy" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" onLoad={() => setCarregou(true)}
        sandbox="allow-scripts allow-same-origin allow-popups allow-presentation allow-forms" style={{ opacity: carregou ? 1 : 0 }} />
    </div>
    <figcaption className={x.incorporadoRodape}>
      <span>{servico}</span>
      <a href={url} target="_blank" rel="noreferrer">Abrir em nova aba<ExternalLink size={12} /></a>
    </figcaption>
  </figure>
}

function FormIncorporar({ editavel, onUsar }: { editavel: boolean; onUsar: (url: string) => void }) {
  const [url, setUrl] = useState('')
  if (!editavel) return <div className={x.muted} contentEditable={false}>Incorporação vazia.</div>
  const valida = incorporacao(url) !== null
  return <form className={x.incorporarForm} contentEditable={false} onSubmit={e => { e.preventDefault(); if (valida) onUsar(url.trim()) }}>
    <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Cole o link (YouTube, Vimeo, Loom, Figma, Google Maps, PDF…)" aria-label="Link para incorporar"
      onKeyDown={e => e.stopPropagation()} />
    <button type="submit" className={x.primary} disabled={!valida}>Incorporar</button>
  </form>
}

/**
 * Botão: ao clicar, insere um texto pronto abaixo dele (linhas com "[ ]" viram tarefas) ou cria um item numa base.
 * Quem edita configura pelo ícone ao lado.
 */
export const Botao = createReactBlockSpec(
  { type: 'botao', propSchema: { rotulo: { default: 'Novo botão' }, acao: { default: 'blocos' }, texto: { default: '' }, baseId: { default: '' }, titulo: { default: '' } }, content: 'none' },
  { render: ({ block, editor }) => <BotaoView block={block as never} editor={editor as never} /> },
)

type BlocoBotao = { id: string; props: { rotulo: string; acao: string; texto: string; baseId: string; titulo: string } }
type EditorBotao = { isEditable: boolean; updateBlock: (b: unknown, m: unknown) => void; insertBlocks: (blocos: unknown[], ref: unknown, onde: 'after') => void }

function BotaoView({ block, editor }: { block: BlocoBotao; editor: EditorBotao }) {
  const { arvore, avisar } = useNotas()
  const [config, setConfig] = useState<HTMLElement | null>(null)
  const p = block.props
  const executar = async () => {
    if (p.acao === 'item') {
      if (!p.baseId) { avisar('Escolha a base do botão (ícone de configurar).'); return }
      try { await notasApi(`/bases/${p.baseId}/itens`, { method: 'POST', json: { titulo: p.titulo } }); avisar('Item criado.') } catch (e) { avisar((e as Error).message) }
      return
    }
    const linhas = p.texto.split('\n').filter(l => l.trim())
    if (!linhas.length) { avisar('Escreva o texto que o botão insere (ícone de configurar).'); return }
    editor.insertBlocks(linhas.map(l => /^\s*\[\s?\]\s*/.test(l)
      ? { type: 'checkListItem', content: l.replace(/^\s*\[\s?\]\s*/, '') }
      : { type: 'paragraph', content: l }), block, 'after')
  }
  const bases = (arvore?.paginas ?? []).filter(x => x.tipo === 'base')
  const mudar = (props: Partial<BlocoBotao['props']>) => editor.updateBlock(block, { props })
  return <div className={x.botaoBloco} contentEditable={false}>
    <button type="button" className={x.botaoAcao} onClick={() => void executar()}><Play size={13} />{p.rotulo || 'Botão'}</button>
    {editor.isEditable && <button type="button" className={x.rowBtn} aria-label="Configurar botão" title="Configurar botão" onClick={e => setConfig(e.currentTarget)}><Settings2 size={15} /></button>}
    {config && <Menu ancora={config} onFechar={() => setConfig(null)} className={x.menuWide}>
      <div className={x.menuLabel}>Nome do botão</div>
      <input className={x.menuInput} defaultValue={p.rotulo} aria-label="Nome do botão" onBlur={e => mudar({ rotulo: e.target.value.slice(0, 80) })} onKeyDown={e => e.stopPropagation()} />
      <div className={x.menuLabel}>Ao clicar</div>
      <div className={x.filterRow}>
        <select value={p.acao} aria-label="Ação do botão" style={{ flex: 1 }} onChange={e => mudar({ acao: e.target.value })}>
          <option value="blocos">Inserir texto abaixo</option><option value="item">Criar item numa base</option>
        </select>
      </div>
      {p.acao === 'blocos'
        ? <textarea className={x.formulaBox} style={{ margin: '4px 8px', width: 'calc(100% - 16px)', fontFamily: 'inherit' }} rows={4} defaultValue={p.texto} aria-label="Texto inserido"
          placeholder={'Uma linha por bloco. Use [ ] para tarefa.\n[ ] Revisar\n[ ] Publicar'} onBlur={e => mudar({ texto: e.target.value.slice(0, 5000) })} onKeyDown={e => e.stopPropagation()} />
        : <>
          <div className={x.filterRow}>
            <select value={p.baseId} aria-label="Base do item" style={{ flex: 1 }} onChange={e => mudar({ baseId: e.target.value })}>
              <option value="">Escolha a base…</option>{bases.map(b => <option key={b.id} value={b.id}>{b.icone ? `${b.icone} ` : ''}{tituloExibido(b.titulo)}</option>)}
            </select>
          </div>
          <input className={x.menuInput} defaultValue={p.titulo} placeholder="Nome do item criado" aria-label="Nome do item" onBlur={e => mudar({ titulo: e.target.value.slice(0, 200) })} onKeyDown={e => e.stopPropagation()} />
        </>}
    </Menu>}
  </div>
}

/** Menção de pessoa (@): mostra o nome atual da pessoa da empresa (ou o guardado, se ela não está mais na lista). */
export const MencaoPessoa = createReactInlineContentSpec(
  { type: 'pessoa', propSchema: { userId: { default: '' }, nome: { default: '' } }, content: 'none' },
  { render: ({ inlineContent }) => <NomePessoa {...inlineContent.props} /> },
)
function NomePessoa({ userId, nome }: { userId: string; nome: string }) {
  const pessoas = usePessoas()
  const atual = pessoas.find(p => p.id === userId)?.nome ?? nome
  return <span className={x.mencaoPessoa} contentEditable={false}>@{atual || 'pessoa'}</span>
}
