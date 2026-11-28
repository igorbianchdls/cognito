// Ferramentas do Editor de vídeo para o assistente (Claude/ChatGPT pelo conector do Otto), focadas na revisão por
// comentários: a equipe comenta momentos do vídeo no editor e pede "refaça seguindo os comentários"; o assistente lê
// o projeto com os comentários abertos, aplica as edições (as mesmas ações da IA do editor) e marca o que resolveu.
// Cada edição guarda o estado anterior como versão e cria uma versão nova com nome; o editor aberto recarrega sozinho.
import { z } from 'zod'
import { PluginError } from '../../../shared/contracts'
import { aplicarAcoes, type Acao } from '@/products/editor/frontend/editor/ai/acoes'
import { projectDuration } from '@/products/editor/frontend/editor/project/ops'
import { FPS, type Project } from '@/products/editor/frontend/editor/project/types'
import { company, tool, uuid, type ToolContext, type WorkspaceTool } from '../../workspace/context'
import { editProject, filesById, getProject } from '../server/projects'
import { fileIds, projectView } from '../server/convert'
import type { Member } from '../server/database'

const link = (ctx: ToolContext, id: string) => `${ctx.origin}/editor/${id}`
const seg = (o = 'Tempo em segundos da linha do tempo.') => z.number().min(0).max(4 * 3600).describe(o)
const idClipe = () => z.string().min(1).describe('Id do clipe (de video_ler_projeto).')
const alvo = () => z.union([z.array(z.string().min(1)).min(1).max(200), z.enum(['videos', 'audios', 'musica', 'legendas', 'textos', 'midias', 'todos'])])
  .describe('Ids dos clipes (de video_ler_projeto) ou um grupo: videos, audios, musica, legendas, textos, midias (vídeos e imagens), todos.')
const L = <T extends string>(t: T) => z.literal(t).describe('Qual edição fazer.')
const acao = z.discriminatedUnion('tipo', [
  z.object({ tipo: L('cortar_trecho'), de: seg(), ate: seg() }).describe('Tira o trecho [de, ate] (segundos) de todas as faixas e puxa o resto: "corta essa pausa".'),
  z.object({ tipo: L('cortar_inicio'), segundos: seg() }).describe('Tira os N primeiros segundos.'),
  z.object({ tipo: L('limitar_duracao'), segundos: seg() }).describe('Faz o vídeo terminar em N segundos.'),
  z.object({ tipo: L('zoom'), clipe: idClipe(), escala: z.number().min(0.5).max(4).describe('1 = sem zoom; 1.3 = 30% mais perto.'), de: seg().optional(), ate: seg().optional() }).describe('Zoom no clipe ao longo de [de, ate] (segundos da linha do tempo; sem eles, o clipe todo). 1.3 = 30% mais perto.'),
  z.object({ tipo: L('panoramica'), clipe: idClipe(), direcao: z.enum(['esquerda', 'direita', 'cima', 'baixo']).describe('Para onde a câmera anda.'), de: seg().optional(), ate: seg().optional(), intensidade: z.number().min(2).max(30).optional().describe('Quanto anda, em % da tela (padrão 8).') }).describe('Pan lento de câmera no clipe ao longo de [de, ate].'),
  z.object({ tipo: L('adicionar_texto'), texto: z.string().min(1).max(300).describe('O texto que aparece.'), inicio: seg('Quando aparece (segundos).').optional(), duracao: z.number().min(0.3).max(600).optional().describe('Quanto tempo fica (segundos; padrão 3).') }).describe('Título/texto na tela (inicio em segundos).'),
  z.object({ tipo: L('editar_texto'), clipe: idClipe(), texto: z.string().min(1).max(2000).describe('O texto novo.') }).describe('Troca o texto de um clipe de texto ou legenda.'),
  z.object({ tipo: L('estilo_legendas'), estilo: z.enum(['amarela', 'branca', 'caixa']).describe('Estilo das legendas.') }),
  z.object({ tipo: L('volume'), alvo: alvo(), porcentagem: z.number().min(0).max(100).describe('0 a 100.') }),
  z.object({ tipo: L('remover'), alvo: alvo() }).describe('Tira clipes (sem puxar o resto; para puxar, use cortar_trecho).'),
  z.object({ tipo: L('velocidade'), alvo: alvo(), vezes: z.union([z.literal(0.5), z.literal(1), z.literal(1.5), z.literal(2), z.literal(3)]).describe('Velocidade: 0.5, 1, 1.5, 2 ou 3.') }),
  z.object({ tipo: L('filtro'), alvo: alvo(), filtro: z.enum(['nenhum', 'pb', 'vivido', 'quente', 'vintage', 'escuro']).describe('Filtro de cor.') }),
  z.object({ tipo: L('transicao'), alvo: alvo(), transicao: z.enum(['fade', 'deslizar', 'zoom', 'desfoque', 'nenhuma']).describe('Tipo de transição.'), segundos: z.number().min(0.1).max(3).optional().describe('Duração da transição (padrão 0.4 s).') }),
  z.object({ tipo: L('abaixar_trilha_na_fala'), ligar: z.boolean().describe('true liga, false desliga.') }),
  z.object({ tipo: L('mover'), clipe: idClipe(), inicio: seg() }),
  z.object({ tipo: L('duracao_clipe'), clipe: idClipe(), segundos: z.number().min(0.2).max(4 * 3600).describe('Duração nova do clipe (segundos).') }),
  z.object({ tipo: L('dividir'), clipe: idClipe(), em: seg() }),
  z.object({ tipo: L('formato'), formato: z.enum(['9:16', '1:1', '16:9']).describe('Formato do vídeo.') }),
])

type LinhaComentario = { id: string; segundo: string | number; texto: string; autor_nome: string | null; created_at: string; resolvido_em: string | null; versao: string | null }
const comentario = (c: LinhaComentario) => ({
  id: c.id, segundo: Number(c.segundo), tempo: `${Math.floor(Number(c.segundo) / 60)}:${String(Math.floor(Number(c.segundo) % 60)).padStart(2, '0')}`,
  texto: c.texto, autor: c.autor_nome ?? undefined, criado_em: c.created_at, ...(c.resolvido_em ? { resolvido_em: c.resolvido_em, resolvido_na_versao: c.versao ?? undefined } : {}),
})
const comentariosDo = (m: Member, projetoId: string, abertos: boolean) => m.db.query<LinhaComentario>(`SELECT c.id, c.segundo, c.texto, c.autor_nome, c.created_at, c.resolvido_em, v.label AS versao
  FROM editor.comentarios c LEFT JOIN editor.project_versions v ON v.id = c.resolvido_na_versao_id
  WHERE c.project_id = $1 AND c.workspace_id = $2 ${abertos ? 'AND c.resolvido_em IS NULL' : 'AND c.resolvido_em IS NOT NULL'}
  ORDER BY ${abertos ? 'c.segundo, c.created_at' : 'c.resolvido_em DESC'} LIMIT ${abertos ? 200 : 20}`, [projetoId, m.ws])

const listar = tool({
  name: 'video_listar_projetos', title: 'Listar projetos de vídeo', write: false,
  description: 'Projetos do Editor de vídeo desta empresa, do mais recente para o mais antigo, com quantos comentários abertos cada um tem. Use antes de video_ler_projeto.',
  schema: z.object({ empresa_id: company(), busca: z.string().trim().max(120).optional().describe('Parte do nome do projeto.'), limite: z.number().int().min(1).max(50).default(20).describe('Quantos projetos trazer (até 50).') }).strict(),
  run: async (i, ctx) => ctx.as(async m => {
    const rows = await m.db.query<{ id: string; name: string; data: Project; updated_at: string; abertos: number }>(`SELECT p.id, p.name, p.data, p.updated_at,
        (SELECT count(*)::int FROM editor.comentarios c WHERE c.project_id = p.id AND c.resolvido_em IS NULL) AS abertos
      FROM editor.projects p WHERE p.workspace_id = $1 AND ($2::text IS NULL OR p.name ILIKE '%' || $2 || '%') ORDER BY p.updated_at DESC LIMIT $3`, [m.ws, i.busca ?? null, i.limite])
    return { projetos: rows.map(r => ({ id: r.id, nome: r.name, formato: r.data.format, duracao_s: Math.round(projectDuration({ ...r.data, tracks: r.data.tracks ?? [] }) / FPS * 10) / 10,
      comentarios_abertos: r.abertos, atualizado_em: r.updated_at, link: link(ctx, r.id) })) }
  }),
})

const ler = tool({
  name: 'video_ler_projeto', title: 'Ler projeto de vídeo com os comentários', write: false,
  description: 'O projeto do Editor de vídeo (faixas e clipes com ids e tempos em segundos) e os comentários de revisão: cada um preso a um momento do vídeo (segundo). '
    + 'Para "refazer seguindo os comentários": leia, decida as ações que atendem cada comentário aberto e chame video_editar_projeto com elas e os ids dos comentários resolvidos.',
  schema: z.object({ empresa_id: company(), projeto_id: uuid('ID do projeto (de video_listar_projetos ou do link /editor/<id>).') }).strict(),
  run: async (i, ctx) => ctx.as(async m => {
    const { project, updatedAt } = await getProject(m, i.projeto_id)
    const files = await filesById(m, fileIds(project))
    return {
      projeto: projectView(project, files, link(ctx, project.id), updatedAt),
      comentarios_abertos: (await comentariosDo(m, project.id, true)).map(comentario),
      comentarios_resolvidos_recentes: (await comentariosDo(m, project.id, false)).map(comentario),
    }
  }),
})

const editar = tool({
  name: 'video_editar_projeto', title: 'Editar projeto de vídeo (seguindo os comentários)', write: true,
  description: 'Aplica edições no projeto do Editor de vídeo, na ordem dada, e marca como resolvidos os comentários atendidos. Tempos em segundos da linha do tempo, '
    + 'como em video_ler_projeto (depois de um cortar_trecho, o que vinha depois anda para trás: aplique os cortes do fim para o começo). '
    + 'O estado anterior fica guardado como versão (dá para restaurar no editor) e o resultado vira uma versão com nome. O editor aberto recarrega sozinho.',
  schema: z.object({
    empresa_id: company(),
    projeto_id: uuid('ID do projeto.'),
    acoes: z.array(acao).max(60).default([]).describe('As edições, na ordem em que devem ser aplicadas.'),
    comentarios_resolvidos: z.array(z.string().uuid()).max(200).default([]).describe('Ids dos comentários abertos que estas edições atendem.'),
    nome_versao: z.string().trim().min(1).max(120).optional().describe('Nome da versão nova. Padrão: "Seguindo N comentários".'),
  }).strict(),
  run: async (i, ctx) => ctx.as(async m => {
    if (!i.acoes.length && !i.comentarios_resolvidos.length) throw new PluginError('INVALID_INPUT', 'Envie ao menos uma ação ou um comentário resolvido.', 400)
    const n = i.comentarios_resolvidos.length
    const nome = i.nome_versao ?? (n ? `Seguindo ${n} comentário${n > 1 ? 's' : ''}` : `Edição do ${ctx.assistant}`)
    const { project, files, changed } = await editProject(m, i.projeto_id, `Antes: ${nome}`, (p, c) => {
      const r = aplicarAcoes(p, i.acoes as Acao[], 0, [], { nome: f => (f ? c.files.get(f)?.name : undefined), ehMusica: f => /trilha|m[uú]sica|music/i.test((f && c.files.get(f)?.name) || ''), durationOf: c.durationOf })
      return { project: r.project, result: null }
    })
    if (i.acoes.length && !changed) throw new PluginError('INVALID_INPUT', 'Nenhuma das ações mudou o projeto (confira os ids dos clipes e os tempos em video_ler_projeto).', 422)
    const duracao = Math.round(projectDuration(project) / FPS * 10) / 10
    // clock_timestamp: depois do "Antes" gravado nesta mesma transação (now() seria o mesmo instante para as duas).
    const [versao] = await m.db.query<{ id: string }>(`INSERT INTO editor.project_versions (project_id, workspace_id, label, data, tipo, nomeada, resumo, duracao, autor, created_at)
      VALUES ($1, $2, $3, $4, 'manual', true, $5, $6, $7, clock_timestamp()) RETURNING id`,
      [project.id, m.ws, nome, project, `${i.acoes.length} edição${i.acoes.length === 1 ? '' : 'ões'}${n ? `, ${n} comentário${n > 1 ? 's' : ''} resolvido${n > 1 ? 's' : ''}` : ''}`.slice(0, 300), duracao, ctx.assistant])
    const resolvidos = n ? await m.db.query<{ id: string }>(`UPDATE editor.comentarios SET resolvido_em = now(), resolvido_na_versao_id = $3
      WHERE project_id = $1 AND workspace_id = $2 AND id = ANY($4::uuid[]) AND resolvido_em IS NULL RETURNING id`, [project.id, m.ws, versao.id, i.comentarios_resolvidos]) : []
    return {
      versao: nome, comentarios_resolvidos: resolvidos.length,
      comentarios_abertos_restantes: (await comentariosDo(m, project.id, true)).map(comentario),
      projeto: projectView(project, files, link(ctx, project.id)), link: link(ctx, project.id),
    }
  }),
})

export const videoTools: WorkspaceTool[] = [listar, ler, editar]
