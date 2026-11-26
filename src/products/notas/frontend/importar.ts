'use client'

// Importar arquivos para as Notas: Markdown, texto e HTML viram uma página; CSV vira uma base de dados.
import { BlockNoteEditor } from '@blocknote/core'
import { importarCsv, lerCsv } from '@/products/notas/shared/csv'
import { notasApi, type Pagina } from './api'

export const TIPOS_IMPORTACAO = '.md,.markdown,.txt,.html,.htm,.csv'
const LIMITE = 5 * 1024 * 1024

/** Importa o arquivo no espaço escolhido; devolve o id da página (ou base) criada. */
export async function importarArquivo(arquivo: File, espaco: 'equipe' | 'particular'): Promise<string> {
  if (arquivo.size > LIMITE) throw new Error('O arquivo pode ter até 5 MB.')
  const nome = arquivo.name.replace(/\.[^.]+$/, '').slice(0, 200) || 'Importado'
  const extensao = arquivo.name.split('.').pop()?.toLowerCase() ?? ''
  const texto = await arquivo.text()
  if (extensao === 'csv') {
    const linhas = lerCsv(texto)
    if (linhas.length < 1) throw new Error('O CSV está vazio.')
    if (linhas.length > 2001) throw new Error('O CSV pode ter até 2.000 linhas.')
    const importacao = importarCsv(linhas)
    const { base } = await notasApi<{ base: Pagina }>('/bases', { method: 'POST', json: { modelo: 'vazia', visao: 'tabela', titulo: nome, espaco, importacao } })
    return base.id
  }
  if (!['md', 'markdown', 'txt', 'html', 'htm'].includes(extensao)) throw new Error('Use um arquivo .md, .txt, .html ou .csv.')
  const conversor = BlockNoteEditor.create()
  const blocos = extensao === 'html' || extensao === 'htm' ? conversor.tryParseHTMLToBlocks(texto)
    : extensao === 'txt' ? texto.split(/\r?\n/).map(linha => ({ type: 'paragraph' as const, content: linha })) as never[]
      : conversor.tryParseMarkdownToBlocks(texto)
  // O primeiro título vira o título da página (como no Notion).
  let titulo = nome
  const primeiro = blocos[0] as { type?: string; props?: { level?: number }; content?: { text?: string }[] } | undefined
  if (primeiro?.type === 'heading' && primeiro.props?.level === 1) {
    titulo = (primeiro.content ?? []).map(c => c.text ?? '').join('').slice(0, 500) || nome
    blocos.shift()
  }
  const pagina = await notasApi<Pagina>('/paginas', { method: 'POST', json: { titulo, espaco } })
  await notasApi(`/paginas/${pagina.id}`, { method: 'PATCH', json: { versao: pagina.versao, conteudo: blocos } })
  return pagina.id
}
