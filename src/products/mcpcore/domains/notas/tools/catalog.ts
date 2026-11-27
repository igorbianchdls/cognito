// Ferramentas de artefatos das Notas: o agente cria, lê, atualiza e lista páginas em HTML (artefatos) que aparecem nas
// Notas do Otto. Rodam como a pessoa conectada (as permissões das Notas valem igual); cada gravação vira uma versão.
import { z } from 'zod'
import { PluginError } from '../../../shared/contracts'
import { aplicarSubstituicoes, LIMITE_HTML, parteDoHtml } from '@/products/notas/shared/artefatos'
import { atualizarArtefato, criarArtefato, lerArtefato, listarArtefatos, type Artefato } from '@/products/notas/server/artefatos'
import { NotasError, type Contexto } from '@/products/notas/server/db'
import { company, tool, uuid, type ToolContext, type WorkspaceTool } from '../../workspace/context'

const base = () => ({ empresa_id: company() })
/** Artefato solto abre na aba Artefatos; dentro de uma página, nas Notas. */
const link = (ctx: ToolContext, id: string, dentroDePagina = false) => `${ctx.origin}/${dentroDePagina ? 'notas' : 'artefatos'}/${id}`
const PARTE = 150_000

/** A pessoa conectada como contexto das Notas (confere que ela é da empresa; escrever exige perfil que edita). */
const pessoa = (ctx: ToolContext) => ctx.as(async m => ({ userId: m.userId, orgId: m.ws }) satisfies Contexto)

/** Erros das Notas viram os códigos que o assistente entende. */
async function nasNotas<T>(fn: () => Promise<T>): Promise<T> {
  try { return await fn() } catch (e) {
    if (!(e instanceof NotasError)) throw e
    const codigo = e.status === 400 ? 'INVALID_INPUT' : e.status === 403 ? 'ACCESS_DENIED' : e.status === 404 ? 'NOT_FOUND' : e.status === 409 ? 'VERSION_CONFLICT' : 'UNAVAILABLE'
    throw new PluginError(codigo, e.message, e.status)
  }
}

const resumo = (a: Artefato, ctx: ToolContext) => ({
  id: a.id, titulo: a.titulo, icone: a.icone ?? undefined, espaco: a.espaco, pagina_mae_id: a.parent_id ?? undefined,
  versao: a.versao, tamanho_kb: Math.ceil(new TextEncoder().encode(a.html).length / 1024), atualizado_em: a.atualizado_em, link: link(ctx, a.id, Boolean(a.parent_id)),
})

const html = () => z.string().min(1).max(LIMITE_HTML).describe('Documento HTML completo e autossuficiente (CSS e JS inline). Bibliotecas só de cdnjs.cloudflare.com, cdn.jsdelivr.net ou unpkg.com; sem fetch/XHR (a rede fica bloqueada): coloque os dados no próprio HTML. Até 1 MB.')

const criar = tool({
  name: 'notas_criar_artefato', title: 'Criar artefato nas Notas', write: true,
  description: 'Cria um artefato no Otto: uma página em HTML interativo (painel, calculadora, relatório, apresentação, protótipo) que a equipe abre na aba Artefatos (ou dentro de uma página das Notas, com pagina_mae_id). '
    + 'Ele roda isolado e sem acesso à rede: os dados vão escritos no próprio HTML (estático). Devolve o link. Para mudar depois, use notas_atualizar_artefato.',
  schema: z.object({
    ...base(),
    titulo: z.string().trim().min(1).max(500).optional().describe('Nome do artefato. Se omitido, usa o <title> do HTML.'),
    html: html(),
    icone: z.string().trim().max(16).optional().describe('Um emoji para o ícone, ex.: "📊".'),
    pagina_mae_id: uuid('Página das Notas onde o artefato fica dentro (opcional). Herda o espaço e o acesso dela.').optional(),
    espaco: z.enum(['equipe', 'particular']).default('equipe').describe('equipe = toda a empresa vê; particular = só você. Ignorado com pagina_mae_id.'),
    resumo: z.string().trim().max(300).optional().describe('O que é esta primeira versão, em uma frase.'),
  }).strict(),
  run: async (i, ctx) => {
    const quem = await pessoa(ctx)
    const a = await nasNotas(() => criarArtefato(quem, { titulo: i.titulo, html: i.html, icone: i.icone, parent_id: i.pagina_mae_id, espaco: i.espaco, resumo: i.resumo }))
    return { artefato: resumo(a, ctx) }
  },
})

const ler = tool({
  name: 'notas_ler_artefato', title: 'Ler artefato das Notas', write: false,
  description: 'O HTML atual de um artefato, para revisar ou editar em cima. HTML grande vem em partes: repita com inicio = proximo_inicio até ele vir nulo.',
  schema: z.object({
    ...base(),
    artefato_id: uuid('ID do artefato (de notas_listar_artefatos ou do link /notas/<id>).'),
    inicio: z.number().int().min(0).default(0).describe('Posição (em caracteres) de onde ler; 0 = do começo.'),
  }).strict(),
  run: async (i, ctx) => {
    const quem = await pessoa(ctx)
    const a = await nasNotas(() => lerArtefato(quem, i.artefato_id))
    const parte = parteDoHtml(a.html, i.inicio, PARTE)
    return { artefato: resumo(a, ctx), pode_editar: a.pode_editar, html: parte.trecho, inicio: parte.inicio, fim: parte.fim, total_caracteres: parte.total, proximo_inicio: parte.proximo_inicio }
  },
})

const atualizar = tool({
  name: 'notas_atualizar_artefato', title: 'Atualizar artefato das Notas', write: true,
  description: 'Grava uma nova versão de um artefato (as anteriores ficam guardadas e podem ser restauradas nas Notas). Envie o HTML inteiro em html, '
    + 'ou trocas pontuais em substituicoes (cada trecho antigo precisa aparecer uma vez só no HTML atual). Informe versao_base (a versão que você leu) para não sobrescrever uma mudança feita no meio tempo.',
  schema: z.object({
    ...base(),
    artefato_id: uuid('ID do artefato.'),
    html: html().optional(),
    substituicoes: z.array(z.object({
      antigo: z.string().min(1).describe('Trecho exato do HTML atual (único).'),
      novo: z.string().describe('O que entra no lugar (vazio apaga).'),
    }).strict()).min(1).max(50).optional().describe('Trocas pontuais, aplicadas em ordem. Use em vez de html para mudanças pequenas.'),
    versao_base: z.number().int().positive().optional().describe('A versão que você leu (notas_ler_artefato). Se o artefato já estiver em outra, nada é gravado.'),
    titulo: z.string().trim().min(1).max(500).optional().describe('Novo nome (opcional).'),
    icone: z.string().trim().max(16).optional().describe('Novo emoji (opcional).'),
    resumo: z.string().trim().min(1).max(300).describe('O que mudou nesta versão, em uma frase (aparece no histórico de versões).'),
  }).strict(),
  run: async (i, ctx) => {
    if (!i.html === !i.substituicoes) throw new PluginError('INVALID_INPUT', 'Envie html (o documento inteiro) ou substituicoes (trocas pontuais), um dos dois.', 400)
    const quem = await pessoa(ctx)
    return nasNotas(async () => {
      let novo = i.html
      let versaoBase = i.versao_base
      if (i.substituicoes) {
        const atual = await lerArtefato(quem, i.artefato_id)
        if (versaoBase !== undefined && versaoBase !== atual.versao) throw new NotasError(409, `O artefato mudou desde a versão ${versaoBase} (agora está na ${atual.versao}). Leia de novo antes de gravar.`)
        const r = aplicarSubstituicoes(atual.html, i.substituicoes)
        if (!r.ok) throw new NotasError(400, r.erro)
        novo = r.valor
        versaoBase = atual.versao
      }
      const a = await atualizarArtefato(quem, i.artefato_id, { html: novo, titulo: i.titulo, icone: i.icone, resumo: i.resumo, versaoBase })
      return { artefato: resumo(a, ctx) }
    })
  },
})

const listar = tool({
  name: 'notas_listar_artefatos', title: 'Artefatos das Notas', write: false,
  description: 'Os artefatos das Notas que você pode ver, os editados mais recentemente primeiro (sem o HTML; use notas_ler_artefato). busca filtra pelo nome ou pelo texto.',
  schema: z.object({
    ...base(),
    busca: z.string().trim().max(200).optional().describe('Parte do nome ou do texto do artefato.'),
    limite: z.number().int().min(1).max(100).default(30).describe('Quantos artefatos trazer (até 100).'),
  }).strict(),
  run: async (i, ctx) => {
    const quem = await pessoa(ctx)
    const lista = await nasNotas(() => listarArtefatos(quem, { busca: i.busca, limite: i.limite }))
    return {
      artefatos: lista.map(a => ({ id: a.id, titulo: a.titulo, icone: a.icone ?? undefined, espaco: a.espaco, pagina_mae_id: a.parent_id ?? undefined,
        versao: a.versao, tamanho_kb: Math.ceil(Number(a.tamanho) / 1024), atualizado_em: a.atualizado_em, link: link(ctx, a.id, Boolean(a.parent_id)) })),
    }
  },
})

export const notasTools: WorkspaceTool[] = [criar, ler, atualizar, listar]
