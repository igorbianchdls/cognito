// Notas — modelos de página prontos (a galeria "Modelos" de uma página vazia). O conteúdo está no formato de blocos
// do editor (BlockNote); aplicar um modelo só preenche a página (título, ícone e blocos), a pessoa edita à vontade.

type Bloco = { type: string; props?: Record<string, unknown>; content?: unknown[]; children?: Bloco[] }
const t = (text: string, styles: Record<string, boolean> = {}) => ({ type: 'text', text, styles })
const p = (...partes: (string | ReturnType<typeof t>)[]): Bloco => ({ type: 'paragraph', content: partes.map(x => typeof x === 'string' ? t(x) : x) })
const h = (level: 1 | 2 | 3, texto: string): Bloco => ({ type: 'heading', props: { level }, content: [t(texto)] })
const li = (texto: string): Bloco => ({ type: 'bulletListItem', content: [t(texto)] })
const num = (texto: string): Bloco => ({ type: 'numberedListItem', content: [t(texto)] })
const todo = (texto: string): Bloco => ({ type: 'checkListItem', props: { checked: false }, content: [t(texto)] })
const cit = (texto: string): Bloco => ({ type: 'quote', content: [t(texto)] })
const vazio: Bloco = { type: 'paragraph', content: [] }

/** Trocado pela data do dia ao aplicar o modelo. */
export const HOJE = '{{hoje}}'

/** Conteúdo do modelo pronto para a página: a data de hoje no lugar de {{hoje}}. */
export function conteudoDoModelo(modelo: ModeloPagina, hoje = new Date()) {
  const data = hoje.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
  return JSON.parse(JSON.stringify(modelo.conteudo).split(HOJE).join(data)) as ModeloPagina['conteudo']
}

export type ModeloPagina = { id: string; nome: string; descricao: string; icone: string; titulo: string; conteudo: Bloco[] }

export const MODELOS_PAGINA: ModeloPagina[] = [
  {
    id: 'reuniao', nome: 'Ata de reunião', descricao: 'Pauta, decisões e próximos passos', icone: '🗓️', titulo: 'Reunião',
    conteudo: [
      p(t('Data: ', { bold: true }), HOJE, '   ', t('Participantes: ', { bold: true }), 'mencione com @'),
      h(2, 'Pauta'), num('Assunto 1'), num('Assunto 2'),
      h(2, 'Anotações'), vazio,
      h(2, 'Decisões'), li('…'),
      h(2, 'Próximos passos'), todo('Tarefa — responsável — prazo'), todo('Tarefa — responsável — prazo'),
    ],
  },
  {
    id: 'projeto', nome: 'Projeto', descricao: 'Objetivo, escopo, cronograma e riscos', icone: '🚀', titulo: 'Novo projeto',
    conteudo: [
      cit('Resumo do projeto em uma frase.'),
      h(2, 'Objetivo'), p('O que muda quando o projeto terminar? Como vamos medir?'),
      h(2, 'Escopo'), h(3, 'Inclui'), li('…'), h(3, 'Não inclui'), li('…'),
      h(2, 'Cronograma'), todo('Planejamento'), todo('Execução'), todo('Revisão'), todo('Entrega'),
      h(2, 'Riscos'), li('Risco — como reduzir'),
      h(2, 'Pessoas'), p(t('Responsável: ', { bold: true })), p(t('Envolvidos: ', { bold: true })),
    ],
  },
  {
    id: 'documento', nome: 'Documento', descricao: 'Contexto, proposta e perguntas em aberto', icone: '📄', titulo: 'Documento',
    conteudo: [
      p(t('Autor: ', { bold: true }), '  ·  ', t('Situação: ', { bold: true }), 'Rascunho'),
      h(2, 'Contexto'), p('Qual é o problema e por que agora?'),
      h(2, 'Proposta'), p('O que vamos fazer.'),
      h(2, 'Alternativas consideradas'), li('…'),
      h(2, 'Perguntas em aberto'), todo('…'),
    ],
  },
  {
    id: 'wiki', nome: 'Wiki da equipe', descricao: 'Página inicial com links e processos', icone: '📚', titulo: 'Wiki da equipe',
    conteudo: [
      p('Tudo o que a equipe precisa saber, num lugar só.'),
      h(2, 'Comece por aqui'), li('Quem somos e como trabalhamos'), li('Ferramentas e acessos'), li('Contatos importantes'),
      h(2, 'Processos'), li('Como pedir algo para outra área'), li('Como publicar um conteúdo'),
      h(2, 'Perguntas frequentes'), h(3, 'Pergunta?'), p('Resposta.'),
    ],
  },
  {
    id: 'diario', nome: 'Diário', descricao: 'Prioridades do dia e anotações', icone: '✍️', titulo: 'Diário',
    conteudo: [
      h(2, 'Prioridades de hoje'), todo('…'), todo('…'), todo('…'),
      h(2, 'Anotações'), vazio,
      h(2, 'Para amanhã'), li('…'),
    ],
  },
  {
    id: 'conteudo', nome: 'Briefing de conteúdo', descricao: 'Público, mensagem, canais e roteiro', icone: '📣', titulo: 'Briefing',
    conteudo: [
      h(2, 'Objetivo'), p('O que a pessoa deve pensar, sentir ou fazer depois de ver?'),
      h(2, 'Público'), p('Para quem é, e o que essa pessoa já sabe.'),
      h(2, 'Mensagem principal'), cit('Uma frase.'),
      h(2, 'Canais e formatos'), todo('Instagram — Reels'), todo('TikTok'), todo('Blog'),
      h(2, 'Roteiro'), num('Gancho (3 segundos)'), num('Desenvolvimento'), num('Chamada para ação'),
    ],
  },
]
