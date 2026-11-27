'use client'

// Importar do Notion: o ZIP de "Exportar → Markdown e CSV". Cada página vira uma página (subpáginas nas pastas com o
// mesmo nome), cada CSV vira uma base (os itens recebem o texto das páginas deles) e as imagens são enviadas para as
// Notas. Os nomes do Notion vêm com um id no fim ("Reunião 1a2b…"), que é tirado.
import { unzipSync } from 'fflate'
import { BlockNoteEditor } from '@blocknote/core'
import { importarCsv, lerCsv } from '@/products/notas/shared/csv'
import { enviarArquivoNotas, notasApi, type Pagina } from './api'

const LIMITE_PAGINAS = 400
const LIMITE_BYTES = 60 * 1024 * 1024
const ID_NOTION = /\s+[0-9a-f]{32}$/i
const IMAGEM = /\.(png|jpe?g|gif|webp|svg)$/i
const tipoImagem = (nome: string) => ({ png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', svg: 'image/svg+xml' })[nome.split('.').pop()!.toLowerCase()] ?? 'application/octet-stream'

/** Nome legível: sem a extensão e sem o id do Notion. */
export const nomeNotion = (caminho: string) => decodeURIComponent(caminho.split('/').pop()!.replace(/\.[^.]+$/, '').replace(/_all$/, '')).replace(ID_NOTION, '').trim() || 'Sem título'
const semExtensao = (caminho: string) => caminho.replace(/(_all)?\.[^./]+$/, '')
const pasta = (caminho: string) => caminho.split('/').slice(0, -1).join('/')

/** Abre o ZIP (o Notion às vezes põe um ZIP dentro do outro). */
function abrirZip(bytes: Uint8Array): Record<string, Uint8Array> {
  let arquivos = unzipSync(bytes)
  const nomes = Object.keys(arquivos).filter(n => !n.endsWith('/') && !n.startsWith('__MACOSX'))
  if (nomes.length === 1 && nomes[0].toLowerCase().endsWith('.zip')) arquivos = unzipSync(arquivos[nomes[0]])
  return Object.fromEntries(Object.entries(arquivos).filter(([n]) => !n.endsWith('/') && !n.startsWith('__MACOSX')))
}

/** Troca as imagens locais do Markdown pelos arquivos enviados às Notas. */
async function enviarImagens(md: string, dirDoArquivo: string, arquivos: Record<string, Uint8Array>, enviados: Map<string, string>) {
  const refs = [...md.matchAll(/!\[[^\]]*\]\(([^)\s]+)\)/g)].map(m => m[1]).filter(r => !/^https?:/i.test(r))
  for (const ref of new Set(refs)) {
    const caminho = [dirDoArquivo, decodeURIComponent(ref)].filter(Boolean).join('/').replace(/\/\.\//g, '/')
    const bytes = arquivos[caminho]
    if (!bytes || !IMAGEM.test(caminho)) continue
    if (!enviados.has(caminho)) {
      const nome = caminho.split('/').pop()!
      // Imagem que não sobe não para a importação: o texto entra sem ela (e a tela avisa no fim).
      enviados.set(caminho, await enviarArquivoNotas(new File([bytes as BlobPart], nome, { type: tipoImagem(nome) })).catch(() => ''))
    }
    const url = enviados.get(caminho)
    md = url ? md.split(`(${ref})`).join(`(${url})`) : md.replace(new RegExp(`!\\[[^\\]]*\\]\\(${ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g'), '')
  }
  return md
}

/**
 * Importa o ZIP no espaço escolhido. Devolve o id da primeira página criada e quantas foram criadas.
 * `progresso` é chamado a cada página (para a tela mostrar "Importando 12 de 40").
 */
export async function importarZipNotion(arquivo: File, espaco: 'equipe' | 'particular', progresso: (feitas: number, total: number) => void) {
  if (arquivo.size > LIMITE_BYTES) throw new Error('O arquivo pode ter até 60 MB.')
  const arquivos = abrirZip(new Uint8Array(await arquivo.arrayBuffer()))
  const decodificar = (b: Uint8Array) => new TextDecoder('utf-8').decode(b)
  const mds = Object.keys(arquivos).filter(n => /\.md$/i.test(n))
  // CSV: o Notion exporta "Base.csv" e "Base_all.csv" (com todas as linhas); fica um por base, de preferência o _all.
  const csvs = new Map<string, string>()
  for (const n of Object.keys(arquivos).filter(n => /\.csv$/i.test(n)).sort()) {
    const chave = semExtensao(n)
    if (!csvs.has(chave) || /_all\.csv$/i.test(n)) csvs.set(chave, n)
  }
  const total = mds.length + csvs.size
  if (!total) throw new Error('Não achei páginas do Notion no ZIP. Exporte como "Markdown e CSV".')
  if (total > LIMITE_PAGINAS) throw new Error(`O ZIP tem ${total} páginas; importe até ${LIMITE_PAGINAS} por vez.`)

  const conversor = BlockNoteEditor.create()
  const criadas = new Map<string, { id: string; base?: { itens: { id: string; titulo: string }[] } }>()
  const enviados = new Map<string, string>()
  let feitas = 0, primeira: string | null = null
  // Mais rasos primeiro: a mãe existe antes das filhas.
  const ordem = [...[...csvs.values()].map(c => ({ caminho: c, tipo: 'csv' as const })), ...mds.map(m => ({ caminho: m, tipo: 'md' as const }))]
    .sort((a, b) => a.caminho.split('/').length - b.caminho.split('/').length || (a.tipo === 'csv' ? -1 : 1))

  for (const { caminho, tipo } of ordem) {
    const chave = semExtensao(caminho)
    const mae = criadas.get(pasta(caminho))
    if (tipo === 'csv') {
      const { esquema, itens } = importarCsv(lerCsv(decodificar(arquivos[caminho])))
      const r = await notasApi<{ base: Pagina; itens: { id: string; titulo: string }[] }>('/bases', { method: 'POST', json: {
        modelo: 'vazia', visao: 'tabela', titulo: nomeNotion(caminho), ...(mae && !mae.base ? { parent_id: mae.id } : { espaco }), importacao: { esquema, itens } } })
      criadas.set(chave, { id: r.base.id, base: { itens: r.itens } })
      primeira ??= r.base.id
    } else {
      let md = decodificar(arquivos[caminho])
      // O Notion começa o arquivo com "# Título".
      const titulo = md.match(/^#\s+(.+)\n/)?.[1]?.trim() || nomeNotion(caminho)
      md = md.replace(/^#\s+.+\n+/, '')
      md = await enviarImagens(md, pasta(caminho), arquivos, enviados)
      const blocos = conversor.tryParseMarkdownToBlocks(md)
      if (mae?.base) {
        // Página de um item da base: o texto vai para o item com o mesmo nome.
        const item = mae.base.itens.find(i => i.titulo.trim().toLowerCase() === titulo.toLowerCase())
        if (item) {
          const atual = await notasApi<Pagina>(`/paginas/${item.id}`)
          await notasApi(`/paginas/${item.id}`, { method: 'PATCH', json: { versao: atual.versao, conteudo: blocos } })
          criadas.set(chave, { id: item.id })
        }
      } else {
        const pagina = await notasApi<Pagina>('/paginas', { method: 'POST', json: { titulo: titulo.slice(0, 500), ...(mae ? { parent_id: mae.id } : { espaco }) } })
        if (blocos.length) await notasApi(`/paginas/${pagina.id}`, { method: 'PATCH', json: { versao: pagina.versao, conteudo: blocos } })
        criadas.set(chave, { id: pagina.id })
        primeira ??= pagina.id
      }
    }
    progresso(++feitas, total)
  }
  return { primeira, total: feitas }
}
