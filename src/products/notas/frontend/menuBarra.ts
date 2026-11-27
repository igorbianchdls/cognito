// Menu "/" do editor: nomes, descrições e ordem no jeito das Notas (o padrão do BlockNote traduzido é genérico e
// mistura maiúsculas). Ordem parecida com a do Notion: o que mais se usa primeiro.
import { isTouchDevice } from '@blocknote/core'
import { pt } from '@blocknote/core/locales'

type Entrada = { title: string; subtext: string; aliases: string[]; group: string }
const m = pt.slash_menu as unknown as Record<string, Entrada>
const item = (chave: string, title: string, subtext: string, group: string, aliases: string[] = []) =>
  ({ [chave]: { ...m[chave], title, subtext, group, aliases: [...(m[chave]?.aliases ?? []), ...aliases] } })

export const DICIONARIO = {
  ...pt,
  placeholders: { ...pt.placeholders, default: "Digite '/' para ver os comandos", heading: 'Título', toggleListItem: 'Item expansível', bulletListItem: 'Item', numberedListItem: 'Item', checkListItem: 'Tarefa' },
  slash_menu: {
    ...m,
    ...item('paragraph', 'Texto', 'Comece a escrever com texto simples', 'Básicos', ['texto', 'text']),
    ...item('heading', 'Título 1', 'Título grande de seção', 'Básicos', ['titulo']),
    ...item('heading_2', 'Título 2', 'Título médio de seção', 'Básicos'),
    ...item('heading_3', 'Título 3', 'Título pequeno de seção', 'Básicos'),
    ...item('check_list', 'Lista de verificação', 'Acompanhe tarefas com caixas de marcar', 'Básicos', ['todo', 'tarefa', 'checkbox']),
    ...item('bullet_list', 'Lista com marcadores', 'Lista simples com marcadores', 'Básicos', ['bullet', 'marcador']),
    ...item('numbered_list', 'Lista numerada', 'Lista com números em ordem', 'Básicos', ['numero']),
    ...item('toggle_list', 'Lista expansível', 'Esconda e mostre o conteúdo de dentro', 'Básicos', ['toggle', 'sanfona']),
    ...item('quote', 'Citação', 'Destaque uma fala ou um trecho', 'Básicos', ['citacao', 'quote']),
    ...item('divider', 'Separador', 'Linha para dividir partes da página', 'Básicos', ['linha', 'divisor', 'divider']),
    ...item('toggle_heading', 'Título 1 expansível', 'Título que esconde o conteúdo abaixo', 'Títulos expansíveis'),
    ...item('toggle_heading_2', 'Título 2 expansível', 'Título médio que esconde o conteúdo abaixo', 'Títulos expansíveis'),
    ...item('toggle_heading_3', 'Título 3 expansível', 'Título pequeno que esconde o conteúdo abaixo', 'Títulos expansíveis'),
    ...item('heading_4', 'Título 4', 'Título bem pequeno', 'Títulos menores'),
    ...item('heading_5', 'Título 5', 'Título menor ainda', 'Títulos menores'),
    ...item('heading_6', 'Título 6', 'O menor título', 'Títulos menores'),
    ...item('image', 'Imagem', 'Envie uma imagem ou cole um link', 'Mídia'),
    ...item('video', 'Vídeo', 'Envie um vídeo ou cole um link', 'Mídia'),
    ...item('audio', 'Áudio', 'Envie um áudio ou cole um link', 'Mídia'),
    ...item('file', 'Arquivo', 'Anexe qualquer arquivo', 'Mídia', ['anexo']),
    ...item('table', 'Tabela simples', 'Tabela de texto, sem colunas tipadas', 'Avançados', ['grade']),
    ...item('code_block', 'Código', 'Trecho de código com cores', 'Avançados', ['code']),
    ...item('page_break', 'Quebra de página', 'Começa uma nova folha ao imprimir', 'Avançados'),
    ...item('emoji', 'Emoji', 'Procure e insira um emoji', 'Avançados'),
  },
} as unknown as typeof pt

/** Ordem dos itens (pela chave do BlockNote ou pelo título dos nossos); o que não está aqui vai para o fim do grupo. */
const ORDEM = ['paragraph', 'Página', 'check_list', 'heading', 'heading_2', 'heading_3', 'Tabela (base de dados)', 'bullet_list', 'numbered_list',
  'toggle_list', 'quote', 'Destaque', 'divider', 'Quadro (base de dados)', 'Lista de tarefas', '2 colunas', '3 colunas', 'image', 'video', 'Incorporar',
  'audio', 'file', 'table', 'code_block', 'Botão', 'emoji', 'page_break']
const GRUPOS = ['Básicos', 'Bases de dados', 'Layout', 'Mídia', 'Avançados', 'Títulos expansíveis', 'Títulos menores']

type ItemMenu = { title: string; group?: string; key?: string; badge?: string }

/** Ordena por grupo e pela ordem acima; atalho legível ("Ctrl+Alt+1") e sem atalho no celular (não há teclado). */
export function arrumarMenu<T extends ItemMenu>(itens: T[]): T[] {
  const tocando = typeof window !== 'undefined' && isTouchDevice()
  const pos = (i: T) => { const p = ORDEM.indexOf(i.key ?? i.title); return p < 0 ? ORDEM.indexOf(i.title) < 0 ? 999 : ORDEM.indexOf(i.title) : p }
  const grupo = (i: T) => { const g = GRUPOS.indexOf(i.group ?? ''); return g < 0 ? 99 : g }
  return itens
    .map((item, i) => ({ item, i }))
    .sort((a, b) => grupo(a.item) - grupo(b.item) || pos(a.item) - pos(b.item) || a.i - b.i)
    .map(({ item }) => ({ ...item, badge: tocando || !item.badge ? undefined : item.badge.split('-').map(p => p.length > 1 ? p[0].toUpperCase() + p.slice(1).toLowerCase() : p).join('+') }))
}
