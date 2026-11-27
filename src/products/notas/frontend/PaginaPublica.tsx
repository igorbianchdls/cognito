'use client'

// Página publicada na web: só leitura, sem login e sem nada do Otto em volta (como o "Publicar" do Notion).
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import { BlockNoteSchema, createCodeBlockSpec, defaultBlockSpecs, defaultInlineContentSpecs, type PartialBlock } from '@blocknote/core'
import { pt } from '@blocknote/core/locales'
import { useRef } from 'react'
import { createReactBlockSpec, createReactInlineContentSpec, useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import { tituloExibido } from '@/products/notas/shared/arvore'
import { textoDoValor, formatarData, formatarNumero, valorDe, type Item, type Propriedade } from '@/products/notas/shared/bases'
import type { PaginaPublica as Dados } from '@/products/notas/server/publico'
import { estiloCapa } from './catalogo'
import { Coluna, Colunas, Destaque, Incorporar } from './blocos'
import { MolduraArtefato } from './ArtefatoView'
import { ColunasVivas } from './ColunasVivas'
import { codeBlockOptions, syntaxHighlighter } from '@blocknote/code-block'
import x from './notas.module.css'

// Na versão pública, menção vira só o nome (sem link para dentro do Otto) e base embutida vira um aviso.
const Mencao = createReactInlineContentSpec(
  { type: 'mencao', propSchema: { paginaId: { default: '' }, titulo: { default: '' }, icone: { default: '' } }, content: 'none' },
  { render: ({ inlineContent }) => <span className={x.mencao}>{inlineContent.props.icone || '📄'} {tituloExibido(inlineContent.props.titulo)}</span> },
)
const BaseEmbutida = createReactBlockSpec(
  { type: 'base', propSchema: { baseId: { default: '' } }, content: 'none' },
  { render: () => <div className={x.muted} style={{ padding: '8px 0' }}>Base de dados (disponível só para quem tem acesso).</div> },
)
const BotaoPublico = createReactBlockSpec(
  { type: 'botao', propSchema: { rotulo: { default: '' }, acao: { default: '' }, texto: { default: '' }, baseId: { default: '' }, titulo: { default: '' } }, content: 'none' },
  { render: () => null },
)
const PessoaPublica = createReactInlineContentSpec(
  { type: 'pessoa', propSchema: { userId: { default: '' }, nome: { default: '' } }, content: 'none' },
  { render: ({ inlineContent }) => <span className={x.mencaoPessoa}>@{inlineContent.props.nome || 'pessoa'}</span> },
)
const schema = BlockNoteSchema.create({
  blockSpecs: { ...defaultBlockSpecs, codeBlock: createCodeBlockSpec({ ...codeBlockOptions, defaultLanguage: 'text' }), base: BaseEmbutida(), destaque: Destaque(), colunas: Colunas(), coluna: Coluna(), incorporar: Incorporar(), botao: BotaoPublico() },
  inlineContentSpecs: { ...defaultInlineContentSpecs, mencao: Mencao, pessoa: PessoaPublica },
})

function Conteudo({ conteudo }: { conteudo: unknown[] }) {
  const editor = useCreateBlockNote({ schema, initialContent: conteudo.length ? conteudo as PartialBlock[] as never : undefined, dictionary: pt, extensions: [syntaxHighlighter] })
  const caixa = useRef<HTMLDivElement>(null)
  return <div ref={caixa} className={x.editorCaixa}>
    <BlockNoteView editor={editor} editable={false} theme="light" />
    <ColunasVivas editor={editor as never} editavel={false} caixa={caixa} />
  </div>
}

function valorTexto(item: Omit<Item, 'created_by' | 'updated_by'>, p: Propriedade, esquema: Propriedade[]) {
  const v = valorDe({ ...item, created_by: '', updated_by: null }, p.id, esquema)
  if (p.tipo === 'numero' && typeof v === 'number') return formatarNumero(v, p.formato)
  if ((p.tipo === 'data' || p.tipo === 'criado_em' || p.tipo === 'editado_em') && typeof v === 'string') return formatarData(v)
  if (p.tipo === 'checkbox') return v ? '✓' : ''
  return textoDoValor(p, v)
}

export function PaginaPublica({ dados, token }: { dados: Dados; token: string }) {
  // Artefato publicado: a página inteira é a moldura isolada (o HTML não enxerga o Otto nem a rede).
  if (dados.tipo === 'artefato') return <div style={{ position: 'fixed', inset: 0, display: 'flex', background: '#fff' }}>
    <title>{`${dados.icone ? `${dados.icone} ` : ''}${tituloExibido(dados.titulo)}`}</title>
    <MolduraArtefato html={dados.html ?? ''} titulo={dados.titulo} className={x.artefatoMoldura} />
  </div>
  // Imagens do conteúdo e capa passam pela rota pública do link (que confere o token).
  const trocar = (texto: string) => texto.split('/api/notas/arquivos/').join(`/api/notas/publico/${token}/arquivos/`)
  const conteudo = JSON.parse(trocar(JSON.stringify(dados.conteudo ?? []))) as unknown[]
  const capa = dados.capa ? trocar(dados.capa) : null
  const visiveis = dados.base ? dados.base.visao.visiveis.map(id => dados.base!.esquema.find(p => p.id === id)).filter((p): p is Propriedade => Boolean(p)) : []
  return <div className={x.app} style={{ height: 'auto', minHeight: '100vh', display: 'block' }}>
    <title>{`${dados.icone ? `${dados.icone} ` : ''}${tituloExibido(dados.titulo)}`}</title>
    {capa && <div className={x.cover} style={estiloCapa(capa, dados.capa_posicao)} />}
    <div className={[x.doc, dados.largura_total || dados.base ? x.docWide : '', dados.fonte === 'serifa' ? x.serif : dados.fonte === 'mono' ? x.mono : '', dados.texto_pequeno ? x.small : ''].join(' ')}>
      <div className={x.head} style={{ paddingLeft: 0, paddingRight: 0 }}>
        {dados.icone && <div className={x.icon} style={{ cursor: 'default' }}>{dados.icone}</div>}
        <h1 className={x.title} style={{ margin: 0 }}>{tituloExibido(dados.titulo)}</h1>
      </div>
      {dados.base
        ? <div className={x.table} role="grid" aria-label={tituloExibido(dados.titulo)}><div className={x.tableInner}>
          <div className={`${x.tr} ${x.headRow}`}>
            <div className={x.th} style={{ width: 280 }}>Nome</div>
            {visiveis.map(p => <div key={p.id} className={x.th} style={{ width: 200 }}>{p.nome}</div>)}
          </div>
          {dados.base.itens.map(item => <div key={item.id} className={x.tr} role="row">
            <div className={`${x.td} ${x.tdTitle}`} style={{ width: 280 }}>{item.icone ?? '📄'} {tituloExibido(item.titulo)}</div>
            {visiveis.map(p => <div key={p.id} className={x.td} style={{ width: 200 }}><span className={x.cellText}>{valorTexto(item, p, dados.base!.esquema)}</span></div>)}
          </div>)}
        </div></div>
        : <div className={x.editor}><Conteudo conteudo={conteudo} /></div>}
      <p className={x.muted} style={{ fontSize: 12, marginTop: 48 }}>Publicado com o Otto · atualizado em {new Date(dados.updated_at).toLocaleDateString('pt-BR')}</p>
    </div>
  </div>
}
