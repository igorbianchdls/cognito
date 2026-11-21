// Video tools: the assistant opens, edits and organizes the same projects the editor shows, with the editor's own
// operations (project/ops.ts). Times are in seconds; every edit keeps the previous state as a version.
import { randomUUID } from 'node:crypto'
import { z } from 'zod'
import { PluginError } from '../../../shared/contracts'
import { runCommand } from '@/products/editor/frontend/editor/ai/commands'
import { restMotion } from '@/products/editor/frontend/editor/project/keyframes'
import {
  addClip, clipEnd, cutRange, duplicateClip, findClip, insertClip, limitTo, MIN_CLIP, moveClip, moveClips, moveTrack, normalize, projectDuration,
  removeClips, rippleDelete, scaleTime, settleAll, setSpeed, splitAt, trimLeft, trimRight, groupClips, ungroupClips, updateProps,
} from '@/products/editor/frontend/editor/project/ops'
import { defaultBox, filterPresets, fullBox, shapePresets, stickerProps, textPresets, caption, title } from '@/products/editor/frontend/editor/project/presets'
import { fromTemplate, templates } from '@/products/editor/frontend/editor/project/templates'
import { FPS, type Clip, type ClipProps, type Keyframe, type Project, type TrackKind } from '@/products/editor/frontend/editor/project/types'
import type { Member } from '../server/database'
import { animations, captionStyles, fileIds, fonts, frames, projectView, seconds, styleSchema, styleToProps, type FileInfo } from '../server/convert'
import { editProject, filesById, getProject, insertProject, mediaFile, toProject } from '../server/projects'
import { download, storeFile, type StoreDeps } from '../server/media'

export type ToolContext = { as: <T>(fn: (m: Member) => Promise<T>) => Promise<T>; origin: string; assistant: string; storage?: StoreDeps & { download?: typeof download } }
export type MarketingTool = { name: string; title: string; description: string; write: boolean; destructive?: boolean; schema: z.AnyZodObject; run: (input: never, ctx: ToolContext) => Promise<unknown> }
const tool = <S extends z.AnyZodObject>(t: { name: string; title: string; description: string; write: boolean; destructive?: boolean; schema: S; run: (input: z.infer<S>, ctx: ToolContext) => Promise<unknown> }) => t as unknown as MarketingTool

export const company = z.number().int().positive().optional().describe('ID da empresa do Cognito, de meu_acesso. Se desconhecido, omita; quem tem uma só empresa não precisa informar.')
const projectId = z.string().uuid().describe('ID do projeto, de video_listar_projetos.')
// Functions: a schema used twice in one tool is published as a reference without its descriptions.
const clipId = () => z.string().min(1).max(40).describe('ID do clipe, de video_ver_projeto.')
const clipIds = () => z.array(clipId()).min(1).max(200).describe('IDs dos clipes, de video_ver_projeto.')
const time = (what: string) => z.number().min(0).max(3600).describe(what)
const format = z.enum(['9:16', '1:1', '16:9']).describe('9:16 Reels/TikTok/Stories, 1:1 feed quadrado, 16:9 YouTube/LinkedIn.')
const fileId = z.string().uuid().describe('ID do arquivo nos Spaces, de video_buscar_arquivos ou video_enviar_arquivo.')
const base = { empresa_id: company }
const withProject = { ...base, projeto_id: projectId }

const link = (ctx: ToolContext, id: string) => `${ctx.origin}/editor/${id}`
const label = (ctx: ToolContext, what: string) => `Antes de: ${what} (${ctx.assistant})`
const view = (ctx: ToolContext, p: Project, files: Map<string, FileInfo>) => projectView(p, files, link(ctx, p.id))
const sampleFile = (id?: string) => !!id && !/^[0-9a-f-]{36}$/i.test(id)
const roleOf = (c: Clip) => c.props.role ?? (c.props.fileId === 'a-lofi' || c.props.fileId === 'a-pop' ? 'musica' : c.props.fileId?.startsWith('a-narr') ? 'voz' : undefined)
const allClips = (p: Project) => p.tracks.flatMap(t => t.clips.map(c => ({ c, t })))

function needClip(p: Project, id: string, change = true) {
  const found = findClip(p, id)
  if (!found) throw new PluginError('NOT_FOUND', `Clipe ${id} não existe neste projeto. Consulte video_ver_projeto.`, 404)
  if (change && found.track.locked) throw new PluginError('INVALID_STATE', `O clipe ${id} está numa trilha travada. Destrave com video_configurar_trilhas.`, 409)
  return found
}
/** Edited project and what to tell the assistant: the new timeline, so it never works from a stale copy. */
const edited = (ctx: ToolContext, r: { project: Project; files: Map<string, FileInfo>; changed: boolean }, extra: Record<string, unknown> = {}) =>
  ({ alterado: r.changed, ...extra, projeto: view(ctx, r.project, r.files) })

// ---------- ver ----------

const listProjects = tool({
  name: 'video_listar_projetos', title: 'Listar projetos de vídeo', write: false,
  description: 'Lista os projetos do Editor de vídeo da empresa, do mais recente ao mais antigo, com formato, duração e link para abrir no Otto.',
  schema: z.object({ ...base, busca: z.string().trim().max(80).optional().describe('Parte do nome do projeto.'), limite: z.number().int().min(1).max(50).default(20).describe('Quantos projetos trazer.') }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    const rows = await m.db.query<{ id: string; name: string; data: Project; updated_at: string }>(
      `SELECT id, name, data, updated_at FROM editor.projects WHERE workspace_id = $1 AND ($2::text IS NULL OR name ILIKE '%' || $2 || '%') ORDER BY updated_at DESC LIMIT $3`,
      [m.ws, input.busca || null, input.limite])
    return { projetos: rows.map(r => { const p = toProject(r); return { id: p.id, nome: p.name, formato: p.format, duracao_s: seconds(projectDuration(p)), atualizado_em: r.updated_at, link: link(ctx, p.id) } }) }
  }),
})

const showProject = tool({
  name: 'video_ver_projeto', title: 'Ver projeto de vídeo', write: false,
  description: 'Mostra a linha do tempo completa: trilhas (posição 0 fica por cima), clipes com início e fim em segundos, arquivos usados, textos, estilos, transições, animações e áudio. Consulte antes de editar e use os IDs daqui.',
  schema: z.object(withProject).strict(),
  run: (input, ctx) => ctx.as(async m => {
    const { project, updatedAt } = await getProject(m, input.projeto_id)
    return { projeto: projectView(project, await filesById(m, fileIds(project)), link(ctx, project.id), updatedAt) }
  }),
})

const listVersions = tool({
  name: 'video_listar_versoes', title: 'Versões do projeto', write: false,
  description: 'Histórico do projeto. Cada alteração feita pelo assistente guarda o estado anterior aqui; use video_restaurar_versao para desfazer.',
  schema: z.object({ ...withProject, limite: z.number().int().min(1).max(60).default(15).describe('Quantas versões trazer.') }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    await getProject(m, input.projeto_id)
    const rows = await m.db.query<{ id: string; label: string; created_at: string }>('SELECT id, label, created_at FROM editor.project_versions WHERE project_id = $1 ORDER BY created_at DESC LIMIT $2', [input.projeto_id, input.limite])
    return { versoes: rows.map(r => ({ id: r.id, descricao: r.label, criada_em: r.created_at })) }
  }),
})

const searchFiles = tool({
  name: 'video_buscar_arquivos', title: 'Buscar arquivos nos Spaces', write: false,
  description: 'Procura vídeos, imagens e áudios nos Spaces da empresa (fora da lixeira), com duração e tamanho, para usar nos projetos e nos posts.',
  schema: z.object({
    ...base, busca: z.string().trim().max(80).optional().describe('Parte do nome do arquivo ou uma etiqueta.'),
    tipo: z.enum(['video', 'imagem', 'audio']).optional().describe('Só um tipo de arquivo.'),
    pasta_id: z.string().uuid().optional().describe('Só os arquivos desta pasta.'),
    limite: z.number().int().min(1).max(100).default(30).describe('Quantos arquivos trazer.'),
  }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    const kind = input.tipo === 'imagem' ? 'image' : input.tipo ?? null
    const rows = await m.db.query<{ id: string; name: string; kind: string; duration: number | null; width: number; height: number; size: string; folder: string | null; space: string; updated_at: string }>(
      `SELECT f.id, f.name, f.kind, f.duration::float8 AS duration, f.width, f.height, f.size::text, fo.name AS folder, s.name AS space, f.updated_at
         FROM editor.files f JOIN editor.spaces s ON s.id = f.space_id LEFT JOIN editor.folders fo ON fo.id = f.folder_id
        WHERE f.workspace_id = $1 AND f.trashed_at IS NULL AND f.kind <> 'text'
          AND ($2::text IS NULL OR f.name ILIKE '%' || $2 || '%' OR $2 = ANY(f.tags))
          AND ($3::text IS NULL OR f.kind::text = $3) AND ($4::uuid IS NULL OR f.folder_id = $4)
        ORDER BY f.updated_at DESC LIMIT $5`, [m.ws, input.busca || null, kind, input.pasta_id ?? null, input.limite])
    return { arquivos: rows.map(r => ({ id: r.id, nome: r.name, tipo: r.kind === 'image' ? 'imagem' : r.kind, duracao_s: r.duration ?? undefined,
      largura: r.width || undefined, altura: r.height || undefined, tamanho_mb: Math.round(Number(r.size) / 1e5) / 10, pasta: r.folder ?? undefined, space: r.space })) }
  }),
})

const textModels: Record<string, string> = { titulo: 'Título', subtitulo: 'Subtítulo', chamada: 'Chamada', digitando: 'Digitando', legenda: 'Legenda', manchete: 'Manchete', nome_cargo: 'Nome e cargo', destaque: 'Destaque' }
const shapeModels: Record<string, string> = { retangulo: 'Retângulo', circulo: 'Círculo', faixa: 'Faixa', barra_progresso: 'Barra de progresso' }
const effects = ['zoom_lento', 'zoom_saida', 'panoramica_esquerda', 'panoramica_direita', 'subir', 'aparecer', 'sumir', 'nenhum'] as const

const listModels = tool({
  name: 'video_listar_modelos', title: 'Modelos e opções do editor', write: false,
  description: 'Modelos de projeto e de texto, formas, filtros, fontes, animações, transições, efeitos de movimento e estilos de legenda que as ferramentas de vídeo aceitam.',
  schema: z.object(base).strict(),
  run: async () => ({
    modelos_projeto: templates.map(t => ({ id: t.id, nome: t.label, descricao: t.description, formato: t.format, duracao_s: t.seconds })),
    modelos_texto: Object.keys(textModels), modelos_forma: Object.keys(shapeModels), adesivo: 'modelo adesivo com um emoji em texto',
    filtros: filterPresets.map(f => f.id), fontes: fonts, animacoes_texto: animations, transicoes: ['fade', 'deslizar', 'zoom', 'desfoque'],
    efeitos_movimento: effects, estilos_legenda: captionStyles, enquadramentos: ['preencher', 'ajustar', 'desfoque'],
  }),
})

// ---------- projeto ----------

function addMediaClip(p: Project, file: FileInfo, opts: { at?: number; mode?: 'inserir' | 'sobrepor'; from?: number; length?: number; role?: 'voz' | 'musica'; volume?: number; extra?: Partial<ClipProps> }) {
  const kind: TrackKind = file.kind === 'video' ? 'video' : file.kind === 'image' ? 'imagem' : 'audio'
  const total = file.duration ? frames(file.duration) : undefined
  const trim = kind === 'imagem' ? 0 : frames(opts.from ?? 0)
  if (total && trim > total - MIN_CLIP) throw new PluginError('INVALID_INPUT', `O arquivo tem ${seconds(total)} s; o trecho começa depois do fim.`, 422)
  const available = total ? total - trim : undefined
  const hasContent = p.tracks.some(t => t.clips.length)
  let duration = opts.length ? frames(opts.length) : kind === 'imagem' ? 3 * FPS
    : kind === 'audio' && opts.role === 'musica' && hasContent ? projectDuration(p) : available ?? 5 * FPS
  if (available && kind !== 'imagem') duration = Math.min(duration, available)
  duration = Math.max(MIN_CLIP, duration)
  const props: ClipProps = kind === 'audio' ? { fileId: file.id, volume: opts.volume ?? (opts.role === 'musica' ? 0.3 : 1), ...(opts.role ? { role: opts.role } : {}) }
    : { fileId: file.id, box: kind === 'video' ? fullBox : defaultBox.imagem, opacity: 1, fit: 'preencher', ...(kind === 'video' ? { volume: opts.volume ?? 1 } : {}) }
  Object.assign(props, opts.extra)
  const mode = opts.mode ?? (kind === 'video' ? 'inserir' : 'sobrepor')
  const videoEnd = Math.max(0, ...p.tracks.filter(t => t.kind === kind).flatMap(t => t.clips.map(clipEnd)))
  const at = opts.at !== undefined ? frames(opts.at) : mode === 'inserir' ? videoEnd : 0
  const clip = { start: at, duration, trimStart: trim, props }
  return mode === 'inserir' ? insertClip(p, kind, clip, at) : addClip(p, kind, clip)
}

const createProject = tool({
  name: 'video_criar_projeto', title: 'Criar projeto de vídeo', write: true,
  description: 'Cria um projeto em branco ou a partir de um modelo (video_listar_modelos), já com vídeos e imagens dos Spaces em sequência e uma música de fundo, se informados. Retorna o projeto e o link para abrir no editor.',
  schema: z.object({
    ...base, nome: z.string().trim().min(1).max(120).optional().describe('Nome do projeto.'), formato: format.optional(),
    modelo: z.string().max(30).optional().describe('ID do modelo de video_listar_modelos (ex.: reel15). Sem modelo, começa em branco.'),
    arquivo_ids: z.array(fileId).max(50).optional().describe('Vídeos e imagens dos Spaces, na ordem em que entram (imagens ficam 3 s).'),
    musica_id: fileId.optional().describe('Áudio dos Spaces para música de fundo, que abaixa quando alguém fala.'),
  }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    if (input.modelo && !templates.some(t => t.id === input.modelo)) throw new PluginError('INVALID_INPUT', 'Modelo inexistente. Consulte video_listar_modelos.', 422)
    const id = randomUUID()
    const fromModel = input.modelo ? fromTemplate(id, input.modelo) : null
    let p: Project = fromModel
      ? normalize({ ...fromModel, tracks: fromModel.tracks.map(t => ({ ...t, clips: t.clips.filter(c => !sampleFile(c.props.fileId)) })) })
      : { id, name: 'Sem título', format: '9:16', background: '#0b0d12', tracks: [], updatedAt: new Date().toISOString().slice(0, 16), ducking: { on: true, level: 0.3 } }
    p = { ...p, name: input.nome ?? (fromModel ? p.name : 'Sem título'), format: input.formato ?? p.format }
    const files = new Map<string, FileInfo>()
    for (const fid of input.arquivo_ids ?? []) {
      const file = await mediaFile(m, fid)
      if (file.kind === 'audio') throw new PluginError('INVALID_INPUT', `${file.name} é áudio: use musica_id ou video_adicionar_midia.`, 422)
      files.set(fid, file)
      p = addMediaClip(p, file, { mode: 'inserir' }).project
    }
    if (input.musica_id) {
      const file = await mediaFile(m, input.musica_id)
      if (file.kind !== 'audio') throw new PluginError('INVALID_INPUT', 'musica_id precisa ser um áudio.', 422)
      files.set(file.id, file)
      p = addMediaClip(p, file, { role: 'musica', extra: { fadeOut: frames(2) } }).project
    }
    await insertProject(m, p)
    return { criado: true, projeto: view(ctx, p, files) }
  }),
})

const corners = { sup_esq: 'tl', sup_dir: 'tr', inf_esq: 'bl', inf_dir: 'br' } as const
const configureProject = tool({
  name: 'video_configurar_projeto', title: 'Configurar projeto de vídeo', write: true,
  description: 'Muda nome, formato (as posições são em %, então se adaptam), cor de fundo e marca d\'água do projeto.',
  schema: z.object({
    ...withProject, nome: z.string().trim().min(1).max(120).optional().describe('Novo nome.'), formato: format.optional(),
    fundo: z.string().regex(/^#[0-9a-f]{6}$/i).optional().describe('Cor de fundo em #rrggbb, vista onde não há vídeo.'),
    marca_dagua: z.union([z.object({
      texto: z.string().trim().max(60).optional().describe('Texto da marca, por exemplo @suaempresa.'),
      arquivo_id: fileId.optional().describe('Imagem do logo nos Spaces.'),
      posicao: z.enum(['sup_esq', 'sup_dir', 'inf_esq', 'inf_dir']).default('inf_dir').describe('Canto da tela.'),
      opacidade: z.number().min(0.1).max(1).default(0.8).describe('De 0.1 a 1.'),
    }).strict(), z.null()]).optional().describe('Marca d\'água no vídeo todo; null remove.'),
  }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    const mark = input.marca_dagua
    if (mark?.arquivo_id) { const f = await mediaFile(m, mark.arquivo_id); if (f.kind !== 'image') throw new PluginError('INVALID_INPUT', 'A marca d\'água precisa ser uma imagem.', 422) }
    if (mark && !mark.texto && !mark.arquivo_id) throw new PluginError('INVALID_INPUT', 'Informe texto ou arquivo_id da marca d\'água.', 422)
    const r = await editProject(m, input.projeto_id, label(ctx, 'configurar o projeto'), p => ({ result: null, project: {
      ...p, ...(input.nome ? { name: input.nome } : {}), ...(input.formato ? { format: input.formato } : {}), ...(input.fundo ? { background: input.fundo } : {}),
      ...(mark === null ? { watermark: undefined } : mark ? { watermark: { text: mark.texto, fileId: mark.arquivo_id, position: corners[mark.posicao], opacity: mark.opacidade } } : {}),
    } }), mark?.arquivo_id ? [mark.arquivo_id] : [])
    return edited(ctx, r)
  }),
})

const duplicateProject = tool({
  name: 'video_duplicar_projeto', title: 'Duplicar projeto de vídeo', write: true,
  description: 'Cria uma cópia do projeto, por exemplo para fazer a versão quadrada ou testar outra edição sem mexer no original.',
  schema: z.object({ ...withProject, nome: z.string().trim().min(1).max(120).optional().describe('Nome da cópia.'), formato: format.optional() }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    const { project } = await getProject(m, input.projeto_id)
    const copy: Project = { ...project, id: randomUUID(), name: input.nome ?? `${project.name} (cópia)`, format: input.formato ?? project.format }
    await insertProject(m, copy)
    return { criado: true, projeto: view(ctx, copy, await filesById(m, fileIds(copy))) }
  }),
})

const restoreVersion = tool({
  name: 'video_restaurar_versao', title: 'Restaurar versão do projeto', write: true,
  description: 'Volta o projeto para uma versão de video_listar_versoes (desfazer). O estado atual também vira uma versão, então dá para voltar de novo.',
  schema: z.object({ ...withProject, versao_id: z.string().uuid().describe('ID da versão, de video_listar_versoes.') }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    const [version] = await m.db.query<{ data: Project }>('SELECT data FROM editor.project_versions WHERE id = $1 AND project_id = $2', [input.versao_id, input.projeto_id])
    if (!version) throw new PluginError('NOT_FOUND', 'Versão não encontrada neste projeto.', 404)
    const r = await editProject(m, input.projeto_id, label(ctx, 'restaurar uma versão'), p => ({ result: null, project: { ...version.data, id: p.id, rev: undefined } }), fileIds(version.data))
    return edited(ctx, r)
  }),
})

const deleteProject = tool({
  name: 'video_excluir_projeto', title: 'Excluir projeto de vídeo', write: true, destructive: true,
  description: 'Exclui o projeto e todas as suas versões, sem volta. Os arquivos dos Spaces continuam. Antes, mostre o nome do projeto e peça confirmação explícita; só então chame com confirmado: true.',
  schema: z.object({ ...withProject, confirmado: z.literal(true).describe('true somente depois que a pessoa confirmou a exclusão.') }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    const { project } = await getProject(m, input.projeto_id, true)
    await m.db.query('DELETE FROM editor.projects WHERE id = $1', [project.id])
    return { excluido: true, projeto: { id: project.id, nome: project.name } }
  }),
})

// ---------- mídia ----------

const uploadFile = tool({
  name: 'video_enviar_arquivo', title: 'Trazer arquivo para os Spaces', write: true,
  description: 'Baixa um vídeo, imagem ou áudio de um link https público (até 50 MB) e guarda nos Spaces da empresa. Aceita MP4, MOV, WEBM, PNG, JPG, WEBP, GIF, MP3, M4A e WAV. Arquivos maiores: envie pelo Spaces no Otto.',
  schema: z.object({
    ...base, url: z.string().url().max(2000).describe('Link https direto para o arquivo.'),
    nome: z.string().trim().min(1).max(200).optional().describe('Nome do arquivo nos Spaces; sem ele, vem do link.'),
    pasta_id: z.string().uuid().optional().describe('Pasta dos Spaces; sem ela, vai para o primeiro Space.'),
  }).strict(),
  run: async (input, ctx) => {
    // The download happens before the transaction, so a slow link doesn't hold the database.
    const { bytes, name } = await (ctx.storage?.download ?? download)(input.url, ctx.storage?.send)
    const file = await ctx.as(m => storeFile(m, { bytes, name: input.nome ?? (name || 'Arquivo'), folderId: input.pasta_id }, ctx.storage))
    return { arquivo: { id: file.id, nome: file.name, tipo: file.kind === 'image' ? 'imagem' : file.kind, duracao_s: file.duration ?? undefined, largura: file.width || undefined, altura: file.height || undefined, tamanho_mb: Math.round(file.size / 1e5) / 10 } }
  },
})

const addMedia = tool({
  name: 'video_adicionar_midia', title: 'Adicionar mídia ao vídeo', write: true,
  description: 'Coloca um vídeo, imagem ou áudio dos Spaces na linha do tempo. Vídeo, por padrão, entra no fim da trilha de vídeo; com modo inserir num tempo, empurra o que vem depois. Sobrepor coloca por cima (picture-in-picture, imagem, áudio) sem mexer no resto.',
  schema: z.object({
    ...withProject, arquivo_id: fileId,
    em_s: time('Onde começa na linha do tempo, em segundos. Padrão: fim do vídeo (inserir) ou 0 (sobrepor).').optional(),
    modo: z.enum(['inserir', 'sobrepor']).optional().describe('inserir empurra os clipes seguintes da mesma trilha; sobrepor usa uma trilha livre.'),
    trecho_inicio_s: time('De que segundo do arquivo começar.').optional(),
    duracao_s: z.number().min(0.2).max(3600).optional().describe('Quanto tempo fica na linha do tempo. Padrão: o arquivo até o fim (imagem 3 s; música, o vídeo todo).'),
    papel: z.enum(['voz', 'musica']).optional().describe('Áudio: voz ou música de fundo (fica em 30% e abaixa na fala).'),
    volume: z.number().min(0).max(1).optional().describe('Volume de 0 a 1.'),
    estilo: styleSchema.optional().describe('Posição, enquadramento, filtro e outros ajustes já na entrada.'),
  }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    const file = await mediaFile(m, input.arquivo_id)
    let added = ''
    const r = await editProject(m, input.projeto_id, label(ctx, `adicionar ${file.name}`), p => {
      const kind: TrackKind = file.kind === 'video' ? 'video' : file.kind === 'image' ? 'imagem' : 'audio'
      const extra = input.estilo ? styleToProps(input.estilo, kind, {}) : undefined
      const out = addMediaClip(p, file, { at: input.em_s, mode: input.modo, from: input.trecho_inicio_s, length: input.duracao_s, role: input.papel, volume: input.volume, extra })
      added = out.id
      return { project: out.project, result: null }
    }, [file.id])
    return edited(ctx, r, { clipe_id: added })
  }),
})

// ---------- cortes ----------

const cutSection = tool({
  name: 'video_cortar_trecho', title: 'Cortar trecho do vídeo', write: true,
  description: 'Tira um intervalo de tempo do vídeo e puxa o que vem depois, fechando o buraco, em todas as trilhas destravadas (ou só nas informadas). Para cortar o começo use de_s 0.',
  schema: z.object({
    ...withProject, de_s: time('Início do trecho a tirar, em segundos.'), ate_s: time('Fim do trecho a tirar, em segundos.'),
    trilha_ids: z.array(z.string().min(1).max(40)).max(50).optional().describe('Só nestas trilhas. Cuidado: cortar só uma trilha dessincroniza as outras.'),
  }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    if (input.ate_s <= input.de_s) throw new PluginError('INVALID_INPUT', 'ate_s precisa ser maior que de_s.', 422)
    const r = await editProject(m, input.projeto_id, label(ctx, `cortar de ${input.de_s}s a ${input.ate_s}s`), p => ({ result: null, project: cutRange(p, frames(input.de_s), frames(input.ate_s), input.trilha_ids) }))
    return edited(ctx, r)
  }),
})

const operation = z.discriminatedUnion('acao', [
  z.object({ acao: z.literal('mover').describe('Muda o clipe de lugar no tempo ou de trilha (mesmo tipo).'), clipe_ids: clipIds(),
    para_s: time('Novo início do primeiro clipe; os outros acompanham.').optional(), deslocar_s: z.number().min(-3600).max(3600).optional().describe('Quanto mover, em segundos (negativo para trás).'),
    trilha_id: z.string().min(1).max(40).optional().describe('Trilha de destino (do mesmo tipo).') }).strict(),
  z.object({ acao: z.literal('aparar').describe('Muda onde o clipe começa ou termina, cortando a ponta.'), clipe_id: clipId(),
    inicio_s: time('Novo início na linha do tempo (corta o começo).').optional(), fim_s: time('Novo fim na linha do tempo (corta ou estica o final).').optional() }).strict(),
  z.object({ acao: z.literal('dividir').describe('Divide o clipe em dois nesse tempo.'), clipe_id: clipId(), em_s: time('Tempo do corte na linha do tempo.') }).strict(),
  z.object({ acao: z.literal('duplicar').describe('Cria uma cópia logo depois.'), clipe_id: clipId() }).strict(),
  z.object({ acao: z.literal('remover').describe('Apaga os clipes.'), clipe_ids: clipIds(), fechar_espaco: z.boolean().default(false).describe('true puxa os clipes seguintes da mesma trilha.') }).strict(),
  z.object({ acao: z.literal('velocidade').describe('Acelera ou desacelera vídeo e áudio (o clipe fica mais curto ou longo).'), clipe_ids: clipIds(), velocidade: z.number().min(0.25).max(4).describe('1 normal, 2 o dobro, 0.5 câmera lenta.') }).strict(),
  z.object({ acao: z.literal('agrupar').describe('Junta clipes para se moverem juntos.'), clipe_ids: clipIds() }).strict(),
  z.object({ acao: z.literal('desagrupar').describe('Desfaz o grupo.'), clipe_ids: clipIds() }).strict(),
])

const editClips = tool({
  name: 'video_editar_clipes', title: 'Editar clipes', write: true,
  description: 'Faz várias edições de clipe de uma vez, na ordem: mover, aparar, dividir, duplicar, remover, velocidade, agrupar e desagrupar. Retorna os IDs criados por dividir e duplicar e a linha do tempo nova.',
  schema: z.object({ ...withProject, operacoes: z.array(operation).min(1).max(50).describe('Edições aplicadas em sequência, todas ou nenhuma.') }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    const created: { acao: string; clipe_id: string; novo_clipe_id: string }[] = []
    const r = await editProject(m, input.projeto_id, label(ctx, 'editar clipes'), (start, { durationOf }) => {
      let p = start
      for (const op of input.operacoes) {
        if (op.acao === 'mover') {
          op.clipe_ids.forEach(id => needClip(p, id))
          if (op.para_s === undefined && op.deslocar_s === undefined && !op.trilha_id) throw new PluginError('INVALID_INPUT', 'Em mover, informe para_s, deslocar_s ou trilha_id.', 422)
          const first = Math.min(...op.clipe_ids.map(id => findClip(p, id)!.clip.start))
          const shift = op.para_s !== undefined ? frames(op.para_s) - first : frames(op.deslocar_s ?? 0)
          if (op.trilha_id) {
            if (!p.tracks.some(t => t.id === op.trilha_id)) throw new PluginError('NOT_FOUND', `Trilha ${op.trilha_id} não existe.`, 404)
            for (const id of op.clipe_ids) p = moveClip(p, id, findClip(p, id)!.clip.start + shift, op.trilha_id)
          } else p = moveClips(p, op.clipe_ids, shift)
          p = settleAll(p, op.clipe_ids)
        } else if (op.acao === 'aparar') {
          needClip(p, op.clipe_id)
          if (op.inicio_s === undefined && op.fim_s === undefined) throw new PluginError('INVALID_INPUT', 'Em aparar, informe inicio_s ou fim_s.', 422)
          if (op.inicio_s !== undefined) p = trimLeft(p, op.clipe_id, frames(op.inicio_s))
          if (op.fim_s !== undefined) p = trimRight(p, op.clipe_id, frames(op.fim_s), durationOf)
        } else if (op.acao === 'dividir') {
          const { clip } = needClip(p, op.clipe_id)
          const out = splitAt(p, op.clipe_id, frames(op.em_s))
          if (!out) throw new PluginError('INVALID_INPUT', `O corte precisa ficar dentro do clipe ${op.clipe_id} (${seconds(clip.start)}s a ${seconds(clipEnd(clip))}s).`, 422)
          p = out.project; created.push({ acao: 'dividir', clipe_id: op.clipe_id, novo_clipe_id: out.id })
        } else if (op.acao === 'duplicar') {
          needClip(p, op.clipe_id)
          const out = duplicateClip(p, op.clipe_id)!
          p = out.project; created.push({ acao: 'duplicar', clipe_id: op.clipe_id, novo_clipe_id: out.id })
        } else if (op.acao === 'remover') {
          op.clipe_ids.forEach(id => needClip(p, id))
          p = op.fechar_espaco ? rippleDelete(p, op.clipe_ids) : removeClips(p, op.clipe_ids)
        } else if (op.acao === 'velocidade') {
          for (const id of op.clipe_ids) { const { track } = needClip(p, id); if (track.kind === 'video' || track.kind === 'audio') p = setSpeed(p, id, op.velocidade, durationOf) }
        } else {
          op.clipe_ids.forEach(id => needClip(p, id))
          p = op.acao === 'agrupar' ? groupClips(p, op.clipe_ids) : ungroupClips(p, op.clipe_ids)
        }
      }
      return { project: p, result: null }
    })
    return edited(ctx, r, created.length ? { criados: created } : {})
  }),
})

const adjustLength = tool({
  name: 'video_ajustar_duracao', title: 'Ajustar duração do vídeo', write: true,
  description: 'Termina o vídeo num tempo (corta o que passar) ou acelera o vídeo inteiro, mantendo textos e legendas sincronizados.',
  schema: z.object({
    ...withProject, duracao_s: z.number().min(0.5).max(3600).optional().describe('Nova duração total; precisa ser menor que a atual.'),
    acelerar: z.number().min(0.25).max(4).optional().describe('Fator para o vídeo inteiro: 1.5 deixa 1,5x mais rápido, 0.5 mais lento.'),
  }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    if (input.duracao_s === undefined && input.acelerar === undefined) throw new PluginError('INVALID_INPUT', 'Informe duracao_s ou acelerar.', 422)
    const r = await editProject(m, input.projeto_id, label(ctx, 'ajustar a duração'), p => {
      let next = input.acelerar ? scaleTime(p, input.acelerar) : p
      if (input.duracao_s !== undefined) {
        if (frames(input.duracao_s) >= projectDuration(next)) throw new PluginError('INVALID_INPUT', `O vídeo já tem ${seconds(projectDuration(next))} s.`, 422)
        next = limitTo(next, frames(input.duracao_s))
      }
      return { project: next, result: null }
    })
    return edited(ctx, r)
  }),
})

const configureTracks = tool({
  name: 'video_configurar_trilhas', title: 'Configurar trilhas e marcadores', write: true,
  description: 'Silencia, esconde, trava ou muda a ordem das trilhas (posição 0 fica por cima) e marca pontos no tempo.',
  schema: z.object({
    ...withProject,
    trilhas: z.array(z.object({
      trilha_id: z.string().min(1).max(40).describe('ID da trilha, de video_ver_projeto.'),
      silenciada: z.boolean().optional().describe('Sem som.'), oculta: z.boolean().optional().describe('Não aparece no vídeo.'),
      travada: z.boolean().optional().describe('Protegida contra edições.'), posicao: z.number().int().min(0).max(50).optional().describe('Nova posição; 0 fica por cima.'),
    }).strict()).max(50).optional().describe('Mudanças por trilha.'),
    marcadores: z.object({
      adicionar_s: z.array(time('Tempo do marcador.')).max(50).optional().describe('Marcadores a criar.'),
      remover_s: z.array(time('Tempo do marcador.')).max(50).optional().describe('Marcadores a tirar.'),
      limpar: z.boolean().optional().describe('Tira todos os marcadores.'),
    }).strict().optional().describe('Marcadores da linha do tempo.'),
  }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    const r = await editProject(m, input.projeto_id, label(ctx, 'configurar trilhas'), start => {
      let p = start
      for (const t of input.trilhas ?? []) {
        if (!p.tracks.some(x => x.id === t.trilha_id)) throw new PluginError('NOT_FOUND', `Trilha ${t.trilha_id} não existe.`, 404)
        p = { ...p, tracks: p.tracks.map(x => x.id === t.trilha_id ? { ...x, ...(t.silenciada !== undefined ? { muted: t.silenciada } : {}), ...(t.oculta !== undefined ? { hidden: t.oculta } : {}), ...(t.travada !== undefined ? { locked: t.travada } : {}) } : x) }
        if (t.posicao !== undefined) p = moveTrack(p, p.tracks.findIndex(x => x.id === t.trilha_id), Math.min(t.posicao, p.tracks.length - 1))
      }
      if (input.marcadores) {
        const near = (a: number, b: number) => Math.abs(a - b) <= 2
        let list = input.marcadores.limpar ? [] : [...(p.markers ?? [])]
        list = list.filter(x => !(input.marcadores!.remover_s ?? []).some(s => near(x, frames(s))))
        for (const s of input.marcadores.adicionar_s ?? []) if (!list.some(x => near(x, frames(s)))) list.push(frames(s))
        p = { ...p, markers: list.sort((a, b) => a - b) }
      }
      return { project: p, result: null }
    })
    return edited(ctx, r)
  }),
})

// ---------- texto, visual e áudio ----------

const textItem = z.object({
  modelo: z.enum(['titulo', 'subtitulo', 'chamada', 'digitando', 'legenda', 'manchete', 'nome_cargo', 'destaque', 'retangulo', 'circulo', 'faixa', 'barra_progresso', 'adesivo']).optional().describe('Ponto de partida: modelos de texto, formas ou adesivo (emoji). Sem modelo: título.'),
  tipo: z.enum(['texto', 'legenda', 'forma']).optional().describe('Trilha: texto (títulos), legenda (frases da fala) ou forma. Normalmente vem do modelo.'),
  texto: z.string().max(1000).optional().describe('O texto; no adesivo, o emoji.'),
  inicio_s: time('Quando aparece.'),
  duracao_s: z.number().min(0.2).max(3600).optional().describe('Quanto tempo fica. Padrão: o do modelo (3 s); barra de progresso, o vídeo todo.'),
  estilo: styleSchema.optional().describe('Ajustes sobre o modelo: fonte, cor, posição, animação etc.'),
}).strict()

const addText = tool({
  name: 'video_adicionar_texto', title: 'Adicionar textos, legendas e formas', write: true,
  description: 'Adiciona títulos, chamadas, legendas, adesivos (emoji) e formas, vários de uma vez (por exemplo todas as frases da legenda). Cada item parte de um modelo e aceita ajustes de estilo.',
  schema: z.object({ ...withProject, itens: z.array(textItem).min(1).max(200).describe('O que adicionar.') }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    const ids: string[] = []
    const r = await editProject(m, input.projeto_id, label(ctx, `adicionar ${input.itens.length > 1 ? `${input.itens.length} textos` : 'texto'}`), start => {
      let p = start
      for (const item of input.itens) {
        const shape = item.modelo ? shapePresets.find(s => s.label === shapeModels[item.modelo!]) : undefined
        const preset = item.modelo ? textPresets.find(t => t.label === textModels[item.modelo!]) : undefined
        const kind: TrackKind = shape ? 'forma' : item.modelo === 'adesivo' ? 'texto' : preset?.kind ?? item.tipo ?? 'texto'
        const props: ClipProps = shape ? { ...shape.props } : item.modelo === 'adesivo' ? stickerProps(item.texto?.trim() || '🔥')
          : preset ? { ...preset.props } : kind === 'legenda' ? caption('') : kind === 'forma' ? { ...shapePresets[0].props } : title('')
        if (item.texto !== undefined && item.modelo !== 'adesivo' && kind !== 'forma') props.text = item.texto
        if (kind !== 'forma' && !props.text?.trim()) throw new PluginError('INVALID_INPUT', 'Informe o texto de cada item (menos formas).', 422)
        Object.assign(props, item.estilo ? styleToProps(item.estilo, kind, props) : {})
        const full = shape?.full && item.duracao_s === undefined
        const at = full ? 0 : frames(item.inicio_s)
        const duration = full ? projectDuration(p) : frames(item.duracao_s ?? preset?.seconds ?? 3)
        const out = addClip(p, kind, { start: at, duration: Math.max(MIN_CLIP, duration), trimStart: 0, props })
        p = out.project; ids.push(out.id)
      }
      return { project: p, result: null }
    })
    return edited(ctx, r, { clipe_ids: ids })
  }),
})

const targets = ['todos', 'videos', 'imagens', 'textos', 'legendas', 'formas', 'audios', 'musicas', 'vozes'] as const
const styleClips = tool({
  name: 'video_estilizar_clipes', title: 'Estilizar clipes', write: true,
  description: 'Muda a aparência ou o som de clipes escolhidos ou de um grupo inteiro (todas as legendas, todos os vídeos, as músicas…): texto, fonte, cor, posição, animação, filtro, enquadramento, recorte, transições, opacidade, volume e fades. Cada campo só vale para os tipos citados nele.',
  schema: z.object({
    ...withProject, clipe_ids: clipIds().optional(), alvo: z.enum(targets).optional().describe('Em vez de IDs, um grupo de clipes. Trilhas travadas ficam de fora.'),
    estilo: styleSchema.describe('Só os campos a mudar.'),
  }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    if (!input.clipe_ids?.length && !input.alvo) throw new PluginError('INVALID_INPUT', 'Informe clipe_ids ou alvo.', 422)
    if (!Object.keys(input.estilo).length) throw new PluginError('INVALID_INPUT', 'Informe ao menos um campo de estilo.', 422)
    let count = 0
    const r = await editProject(m, input.projeto_id, label(ctx, 'mudar o estilo'), start => {
      input.clipe_ids?.forEach(id => needClip(start, id))
      const kinds: Record<string, TrackKind[]> = { videos: ['video'], imagens: ['imagem'], textos: ['texto'], legendas: ['legenda'], formas: ['forma'], audios: ['audio'], musicas: ['audio'], vozes: ['audio'] }
      const chosen = allClips(start).filter(({ c, t }) => input.clipe_ids ? input.clipe_ids.includes(c.id)
        : !t.locked && (input.alvo === 'todos' || (kinds[input.alvo!].includes(t.kind) && (input.alvo !== 'musicas' || roleOf(c) === 'musica') && (input.alvo !== 'vozes' || roleOf(c) !== 'musica'))))
      let p = start
      for (const { c, t } of chosen) {
        const patch = styleToProps(input.estilo, t.kind, c.props)
        if (Object.keys(patch).length) { p = updateProps(p, c.id, patch); count++ }
      }
      return { project: p, result: null }
    })
    if (!count) throw new PluginError('INVALID_INPUT', 'Nenhum dos clipes escolhidos aceita esses campos de estilo.', 422)
    return edited(ctx, r, { clipes_alterados: count })
  }),
})

const keyframe = z.object({
  em_s: z.number().min(0).max(3600).describe('Tempo a partir do início do clipe.'),
  x: z.number().min(-100).max(100).optional().describe('Deslocamento horizontal em % da tela.'), y: z.number().min(-100).max(100).optional().describe('Deslocamento vertical em % da tela.'),
  escala: z.number().min(0.05).max(10).optional().describe('1 = tamanho normal.'), rotacao: z.number().min(-720).max(720).optional().describe('Graus.'),
  opacidade: z.number().min(0).max(1).optional().describe('0 a 1.'), cor: z.string().regex(/^#[0-9a-f]{6}$/i).optional().describe('Texto: cor nesse momento.'),
  tamanho_fonte: z.number().min(8).max(400).optional().describe('Texto: tamanho nesse momento.'),
}).strict()

function effectKeyframes(effect: (typeof effects)[number], duration: number): Keyframe[] {
  const end = Math.max(1, duration - 1), k = (frame: number, m: Partial<Keyframe>): Keyframe => ({ ...restMotion, frame, ...m })
  const fade = Math.min(15, end)
  switch (effect) {
    case 'zoom_lento': return [k(0, {}), k(end, { scale: 1.15 })]
    case 'zoom_saida': return [k(0, { scale: 1.15 }), k(end, {})]
    case 'panoramica_esquerda': return [k(0, { scale: 1.15, dx: 5 }), k(end, { scale: 1.15, dx: -5 })]
    case 'panoramica_direita': return [k(0, { scale: 1.15, dx: -5 }), k(end, { scale: 1.15, dx: 5 })]
    case 'subir': return [k(0, { dy: 8, opacity: 0 }), k(fade, {})]
    case 'aparecer': return [k(0, { opacity: 0 }), k(fade, {})]
    case 'sumir': return [k(Math.max(0, end - fade), {}), k(end, { opacity: 0 })]
    case 'nenhum': return []
  }
}

const animateClip = tool({
  name: 'video_animar_clipe', title: 'Animar clipe', write: true,
  description: 'Dá movimento a um clipe ao longo do tempo: um efeito pronto (zoom lento, panorâmica, subir, aparecer, sumir) ou quadros-chave próprios de posição, escala, rotação, opacidade, cor e tamanho do texto. nenhum tira a animação.',
  schema: z.object({
    ...withProject, clipe_id: clipId(), efeito: z.enum(effects).optional().describe('Efeito pronto, aplicado no clipe inteiro.'),
    quadros_chave: z.array(keyframe).min(1).max(30).optional().describe('Quadros-chave próprios (substituem os atuais). Entre dois quadros o movimento é suave.'),
  }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    if (!input.efeito && !input.quadros_chave) throw new PluginError('INVALID_INPUT', 'Informe efeito ou quadros_chave.', 422)
    const r = await editProject(m, input.projeto_id, label(ctx, 'animar um clipe'), p => {
      const { clip, track } = needClip(p, input.clipe_id)
      if (track.kind === 'audio') throw new PluginError('INVALID_INPUT', 'Áudio não tem animação; use volume e fades.', 422)
      const list = input.quadros_chave
        ? input.quadros_chave.map(q => ({ ...restMotion, frame: Math.min(clip.duration - 1, frames(q.em_s)), ...(q.x !== undefined ? { dx: q.x } : {}), ...(q.y !== undefined ? { dy: q.y } : {}),
          ...(q.escala !== undefined ? { scale: q.escala } : {}), ...(q.rotacao !== undefined ? { rotation: q.rotacao } : {}), ...(q.opacidade !== undefined ? { opacity: q.opacidade } : {}),
          ...(q.cor ? { color: q.cor } : {}), ...(q.tamanho_fonte ? { fontSize: q.tamanho_fonte } : {}) })).sort((a, b) => a.frame - b.frame)
        : effectKeyframes(input.efeito!, clip.duration)
      return { project: updateProps(p, clip.id, { keyframes: list }), result: null }
    })
    return edited(ctx, r)
  }),
})

const configureAudio = tool({
  name: 'video_configurar_audio', title: 'Música e áudio do vídeo', write: true,
  description: 'Coloca ou troca a música de fundo (um áudio dos Spaces, no vídeo todo, com fades) e liga ou desliga a música abaixando quando alguém fala. Para volume de clipes específicos use video_estilizar_clipes.',
  schema: z.object({
    ...withProject,
    musica: z.object({
      arquivo_id: fileId, volume: z.number().min(0).max(1).default(0.3).describe('Volume da música, 0 a 1.'),
      fade_entrada_s: z.number().min(0).max(10).default(1).describe('Segundos de entrada suave.'), fade_saida_s: z.number().min(0).max(10).default(2).describe('Segundos de saída suave.'),
      substituir: z.boolean().default(true).describe('true tira as músicas que já estão no projeto.'),
    }).strict().optional().describe('Música de fundo.'),
    abaixar_musica_na_fala: z.object({ ativo: z.boolean().describe('Liga ou desliga.'), nivel: z.number().min(0).max(1).default(0.3).describe('Volume da música durante a fala, 0 a 1.') }).strict().optional().describe('Música abaixa enquanto há voz.'),
  }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    if (!input.musica && !input.abaixar_musica_na_fala) throw new PluginError('INVALID_INPUT', 'Informe musica ou abaixar_musica_na_fala.', 422)
    const file = input.musica ? await mediaFile(m, input.musica.arquivo_id) : undefined
    if (file && file.kind !== 'audio') throw new PluginError('INVALID_INPUT', 'A música precisa ser um arquivo de áudio.', 422)
    let added: string | undefined
    const r = await editProject(m, input.projeto_id, label(ctx, 'mudar a música'), start => {
      let p = start
      if (input.musica && file) {
        if (input.musica.substituir) p = removeClips(p, allClips(p).filter(({ c, t }) => t.kind === 'audio' && !t.locked && roleOf(c) === 'musica').map(({ c }) => c.id))
        const out = addMediaClip(p, file, { role: 'musica', volume: input.musica.volume, extra: { fadeIn: frames(input.musica.fade_entrada_s), fadeOut: frames(input.musica.fade_saida_s) } })
        p = out.project; added = out.id
      }
      if (input.abaixar_musica_na_fala) p = { ...p, ducking: { on: input.abaixar_musica_na_fala.ativo, level: input.abaixar_musica_na_fala.nivel } }
      return { project: p, result: null }
    }, file ? [file.id] : [])
    return edited(ctx, r, added ? { clipe_id: added } : {})
  }),
})

const quickCommand = tool({
  name: 'video_comando_rapido', title: 'Comando rápido no vídeo', write: true,
  description: 'Atalho para pedidos curtos em português que o editor entende sozinho: "corta os 2 primeiros segundos", "deixa com 15 segundos", "deixa a legenda branca", "abaixa a trilha para 10%", "tira a música", "acelera o vídeo para 2x", "deixa preto e branco", "coloca fade em tudo", "abaixa a trilha quando eu falar". Para o resto, use as outras ferramentas.',
  schema: z.object({ ...withProject, pedido: z.string().trim().min(3).max(300).describe('O pedido, em português.'), em_s: time('Posição da agulha, para pedidos que dependem dela (ex.: título).').optional() }).strict(),
  run: (input, ctx) => ctx.as(async m => {
    let reply = ''
    const r = await editProject(m, input.projeto_id, label(ctx, input.pedido.slice(0, 60)), p => {
      const out = runCommand(p, input.pedido, frames(input.em_s ?? 0))
      reply = out.reply
      return { project: out.project ?? p, result: null }
    })
    return edited(ctx, r, { resposta: reply })
  }),
})

export const videoTools: MarketingTool[] = [
  listProjects, showProject, listVersions, searchFiles, listModels,
  createProject, configureProject, duplicateProject, restoreVersion, deleteProject,
  uploadFile, addMedia, cutSection, editClips, adjustLength, configureTracks,
  addText, styleClips, animateClip, configureAudio, quickCommand,
]

