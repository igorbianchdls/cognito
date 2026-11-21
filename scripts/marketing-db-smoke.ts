// Video and Social tools against a real Postgres with the editor/social schemas and their policies.
// Needs a local database prepared with the Supabase stubs and the migrations (see the README of mcpcore/domains/editor):
//   MARKETING_TEST_DB_URL=postgres://postgres:pg@localhost/mkt pnpm marketing:db-smoke
// Nothing external is called: downloads and Storage uploads are stubbed.
import assert from 'node:assert/strict'
import pg from 'pg'
import { executeMarketing, type MarketingDependencies } from '../src/products/mcpcore/domains/editor/executeTool'
import type { PluginConfig } from '../src/products/mcpcore/shared/config'
import type { PluginCompany, PluginPrincipal } from '../src/products/mcpcore/shared/contracts'

const url = process.env.MARKETING_TEST_DB_URL
if (!url) { console.log(JSON.stringify({ status: 'skipped', reason: 'MARKETING_TEST_DB_URL não definido' })); process.exit(0) }
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://abcdefghijklmnopqrst.supabase.co'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key'

const config: PluginConfig = { integration: 'claude', resource: 'https://app.example.com/api/claude/mcp', issuer: 'https://clerk.example.com', metadataUrl: 'https://app.example.com/.well-known/oauth-protected-resource',
  scope: 'erp:read', clientIds: ['t'], origins: [], toolTimeoutMs: 15000, requestsPerMinute: 60 }
const company = (id: number) => ({ id, name: 'Empresa ' + id, profile: 'admin', capabilities: [] }) as unknown as PluginCompany
const person = (clerkUserId: string, companies = [company(1)], scopes = ['erp:read', 'erp:write']): PluginPrincipal => ({ userId: 1, clerkUserId, clientId: 't', scopes, companies })
const owner = person('u_owner'), viewer = person('u_viewer'), member = person('u_member'), stranger = person('u_owner', [company(2)])

// ---------- fake media ----------
const box = (type: string, ...parts: Buffer[]) => { const body = Buffer.concat(parts); const head = Buffer.alloc(8); head.writeUInt32BE(8 + body.length); head.write(type, 4, 'latin1'); return Buffer.concat([head, body]) }
function mp4(seconds: number, w: number, h: number) {
  const mvhd = Buffer.alloc(100); mvhd.writeUInt32BE(1000, 12); mvhd.writeUInt32BE(seconds * 1000, 16)
  const tkhd = Buffer.alloc(84); tkhd.writeUInt32BE(w * 65536, 76); tkhd.writeUInt32BE(h * 65536, 80)
  return Buffer.concat([box('ftyp', Buffer.from('isom\0\0\0\0isom', 'latin1')), box('moov', box('mvhd', mvhd), box('trak', box('tkhd', tkhd)))])
}
function mp3(seconds: number) { const frame = Buffer.from([0xff, 0xfb, 0x90, 0x00]); return Buffer.concat([frame, Buffer.alloc(seconds * 16000 - 4)]) } // 128 kbps
const media: Record<string, Buffer> = { 'https://media.example.com/gravacao.mp4': mp4(12, 1080, 1920), 'https://media.example.com/trilha.mp3': mp3(40) }
const uploads: string[] = []
const storage: MarketingDependencies['storage'] = {
  download: async link => ({ bytes: media[link], name: link.split('/').pop()! }),
  send: (async (target: string) => { uploads.push(String(target)); return new Response('{}', { status: 200 }) }) as unknown as typeof fetch,
}
const deps: MarketingDependencies = { connect: async () => { const c = new pg.Client({ connectionString: url }); await c.connect(); return { query: (s: string, p?: unknown[]) => c.query(s, p as unknown[]), release: () => { void c.end() } } }, storage }
const audit = { reserve: async () => crypto.randomUUID(), finish: async () => undefined } as unknown as Parameters<typeof executeMarketing>[5]

type Result = { ok: boolean; code?: string; message?: string; data: Record<string, any> } // eslint-disable-line @typescript-eslint/no-explicit-any
async function call(name: string, args: Record<string, unknown>, who = owner): Promise<Result> {
  const r = await executeMarketing(who, name, args, config, deps, audit)
  return JSON.parse((r.content[0] as { text: string }).text)
}
async function ok(name: string, args: Record<string, unknown>, who = owner) { const r = await call(name, args, who); assert(r.ok, `${name}: ${r.code} ${r.message}`); return r.data }
async function fails(name: string, args: Record<string, unknown>, code: string, who = owner) { const r = await call(name, args, who); assert(!r.ok, `${name} deveria falhar`); assert.equal(r.code, code, `${name}: ${r.message}`); return r }
type Clip = { id: string; inicio_s: number; fim_s: number; duracao_s: number; texto?: string; velocidade?: number; [k: string]: unknown }
type Track = { id: string; tipo: string; travada?: boolean; clipes: Clip[] }
const tracks = (p: { trilhas: Track[] }, tipo: string) => p.trilhas.filter(t => t.tipo === tipo)
const clips = (p: { trilhas: Track[] }, tipo: string) => tracks(p, tipo).flatMap(t => t.clipes)

const checks: string[] = []
async function check(name: string, fn: () => Promise<void>) { await fn(); checks.push(name); console.log('PASS', name) }

async function main() {
  const admin = new pg.Client({ connectionString: url }); await admin.connect()
  await admin.query("DELETE FROM social.posts; DELETE FROM social.social_accounts; DELETE FROM editor.projects; DELETE FROM editor.files; DELETE FROM editor.spaces")
  let projectId = '', videoId = '', musicId = ''

  await check('Arquivos chegam aos Spaces com duração e tamanho lidos do arquivo', async () => {
    const v = await ok('video_enviar_arquivo', { url: 'https://media.example.com/gravacao.mp4', nome: 'Gravação loja' })
    assert.deepEqual([v.arquivo.tipo, v.arquivo.duracao_s, v.arquivo.largura, v.arquivo.altura], ['video', 12, 1080, 1920]); videoId = v.arquivo.id
    const a = await ok('video_enviar_arquivo', { url: 'https://media.example.com/trilha.mp3' })
    assert.equal(a.arquivo.tipo, 'audio'); assert(Math.abs(a.arquivo.duracao_s - 40) < 0.1); musicId = a.arquivo.id
    assert.equal(uploads.length, 2); assert(uploads[0].includes('/storage/v1/object/editor-media/org_A/' + videoId + '/'), uploads[0])
    const found = await ok('video_buscar_arquivos', { tipo: 'video' }); assert.deepEqual(found.arquivos.map((f: { id: string }) => f.id), [videoId])
    await fails('video_enviar_arquivo', { url: 'https://media.example.com/gravacao.mp4' }, 'ACCESS_DENIED', viewer)
  })

  await check('Criar projeto a partir de modelo, com vídeo e música', async () => {
    const r = await ok('video_criar_projeto', { nome: 'Reel da loja', modelo: 'reel15', arquivo_ids: [videoId], musica_id: musicId })
    projectId = r.projeto.id
    assert.equal(r.projeto.formato, '9:16'); assert.equal(r.projeto.link, 'https://app.example.com/editor/' + projectId)
    assert.equal(clips(r.projeto, 'video').length, 1); assert.equal(clips(r.projeto, 'video')[0].duracao_s, 12)
    assert(clips(r.projeto, 'legenda').length === 3 && clips(r.projeto, 'texto').length === 2)
    const music = clips(r.projeto, 'audio'); assert.equal(music.length, 1); assert.equal(music[0].papel_audio, 'musica'); assert.equal(music[0].volume, 0.3)
    assert(!JSON.stringify(r).includes('a-lofi'), 'arquivos de exemplo do modelo ficam de fora')
  })

  await check('Ver, cortar trecho e editar clipes com a linha do tempo nova na resposta', async () => {
    const before = (await ok('video_ver_projeto', { projeto_id: projectId })).projeto
    assert.equal(before.duracao_s, 15)
    const cut = (await ok('video_cortar_trecho', { projeto_id: projectId, de_s: 2, ate_s: 4 })).projeto
    // The 12 s video loses 2–4 s: it becomes 0–2 s and the rest pulled back to 2–10 s.
    assert.equal(cut.duracao_s, 13); assert.deepEqual(clips(cut, 'video').map(c => [c.inicio_s, c.fim_s]), [[0, 2], [2, 10]])
    const video = clips(cut, 'video')[1]
    const r = await ok('video_editar_clipes', { projeto_id: projectId, operacoes: [{ acao: 'dividir', clipe_id: video.id, em_s: 5 }] })
    const second = r.criados[0].novo_clipe_id as string
    const fast = (await ok('video_editar_clipes', { projeto_id: projectId, operacoes: [{ acao: 'velocidade', clipe_ids: [second], velocidade: 2 }, { acao: 'aparar', clipe_id: video.id, fim_s: 4 }] })).projeto
    const parts = clips(fast, 'video'); assert.equal(parts.find(c => c.id === second)?.velocidade, 2); assert.equal(parts.find(c => c.id === second)?.duracao_s, 2.5)
    assert.equal(parts.find(c => c.id === video.id)?.fim_s, 4)
    await fails('video_editar_clipes', { projeto_id: projectId, operacoes: [{ acao: 'dividir', clipe_id: video.id, em_s: 30 }] }, 'INVALID_INPUT')
    await fails('video_editar_clipes', { projeto_id: projectId, operacoes: [{ acao: 'remover', clipe_ids: ['nao-existe'] }] }, 'NOT_FOUND')
  })

  await check('Textos, estilos, animação, áudio e marca d\'água', async () => {
    const added = await ok('video_adicionar_texto', { projeto_id: projectId, itens: [
      { modelo: 'legenda', texto: 'Primeira frase', inicio_s: 0, duracao_s: 2 }, { modelo: 'manchete', texto: 'PROMOÇÃO', inicio_s: 1, estilo: { cor: '#ff0000' } },
      { modelo: 'barra_progresso', inicio_s: 0 }, { modelo: 'adesivo', texto: '🔥', inicio_s: 2 }] })
    assert.equal(added.clipe_ids.length, 4); assert(clips(added.projeto, 'forma').some(c => c.forma === 'progresso' && c.duracao_s === added.projeto.duracao_s))
    const styled = await ok('video_estilizar_clipes', { projeto_id: projectId, alvo: 'legendas', estilo: { estilo_legenda: 'branca' } })
    assert.equal(styled.clipes_alterados, clips(styled.projeto, 'legenda').length); assert(clips(styled.projeto, 'legenda').every(c => c.estilo_legenda === 'branca'))
    const bw = (await ok('video_estilizar_clipes', { projeto_id: projectId, alvo: 'videos', estilo: { filtro: { predefinido: 'pb' }, transicao_entrada: { tipo: 'fade', duracao_s: 0.5 } } })).projeto
    assert(clips(bw, 'video').every(c => (c.filtro as { predefinido: string }).predefinido === 'pb' && (c.transicao_entrada as { duracao_s: number }).duracao_s === 0.5))
    await fails('video_estilizar_clipes', { projeto_id: projectId, alvo: 'audios', estilo: { fonte: 'bebas' } }, 'INVALID_INPUT')
    const anim = (await ok('video_animar_clipe', { projeto_id: projectId, clipe_id: clips(bw, 'video')[0].id, efeito: 'zoom_lento' })).projeto
    assert.equal((clips(anim, 'video')[0].quadros_chave as { escala: number }[])[1].escala, 1.15)
    const audio = (await ok('video_configurar_audio', { projeto_id: projectId, abaixar_musica_na_fala: { ativo: true, nivel: 0.2 }, musica: { arquivo_id: musicId, volume: 0.25 } })).projeto
    assert.deepEqual(audio.abaixar_musica_na_fala, { nivel: 0.2 }); assert.equal(clips(audio, 'audio').length, 1); assert.equal(clips(audio, 'audio')[0].volume, 0.25)
    const config = (await ok('video_configurar_projeto', { projeto_id: projectId, formato: '1:1', marca_dagua: { texto: '@loja' } })).projeto
    assert.equal(config.formato, '1:1'); assert.equal(config.marca_dagua.texto, '@loja')
  })

  await check('Trilha travada protege os clipes; comando rápido e duração', async () => {
    const p = (await ok('video_ver_projeto', { projeto_id: projectId })).projeto
    const videoTrack = tracks(p, 'video')[0]
    await ok('video_configurar_trilhas', { projeto_id: projectId, trilhas: [{ trilha_id: videoTrack.id, travada: true }], marcadores: { adicionar_s: [1, 3] } })
    await fails('video_editar_clipes', { projeto_id: projectId, operacoes: [{ acao: 'remover', clipe_ids: [videoTrack.clipes[0].id] }] }, 'INVALID_STATE')
    await ok('video_configurar_trilhas', { projeto_id: projectId, trilhas: [{ trilha_id: videoTrack.id, travada: false }] })
    const quick = await ok('video_comando_rapido', { projeto_id: projectId, pedido: 'deixa com 5 segundos' })
    assert.equal(quick.projeto.duracao_s, 5); assert.match(quick.resposta, /5 segundos/)
    const faster = (await ok('video_ajustar_duracao', { projeto_id: projectId, acelerar: 2 })).projeto
    assert.equal(faster.duracao_s, 2.5)
    await fails('video_ajustar_duracao', { projeto_id: projectId, duracao_s: 30 }, 'INVALID_INPUT')
  })

  await check('Versões guardam cada alteração e restauram', async () => {
    const versions = (await ok('video_listar_versoes', { projeto_id: projectId, limite: 60 })).versoes as { id: string; descricao: string }[]
    assert(versions.length >= 10, String(versions.length)); assert(versions.every(v => v.descricao.endsWith('(Claude)')))
    const first = versions[versions.length - 1]
    const restored = (await ok('video_restaurar_versao', { projeto_id: projectId, versao_id: first.id })).projeto
    assert.equal(restored.duracao_s, 15); assert.equal(restored.formato, '9:16')
    const [{ rev }] = (await admin.query("SELECT data->>'rev' AS rev FROM editor.projects WHERE id = $1", [projectId])).rows
    assert.match(rev, /^[0-9a-f-]{36}$/, 'revisão nova para o editor aberto perceber')
  })

  await check('Papéis: quem só visualiza lê; outra empresa não vê nada', async () => {
    assert.equal((await ok('video_ver_projeto', { projeto_id: projectId }, viewer)).projeto.id, projectId)
    await fails('video_configurar_projeto', { projeto_id: projectId, nome: 'x' }, 'ACCESS_DENIED', viewer)
    await ok('video_configurar_projeto', { projeto_id: projectId, nome: 'Reel da loja v2' }, member)
    await fails('video_listar_projetos', {}, 'ACCESS_DENIED', stranger)
    await fails('video_criar_projeto', {}, 'INSUFFICIENT_SCOPE', person('u_owner', [company(1)], ['erp:read']))
    // Policies also hold if the tool code forgot a filter: the viewer's direct write changes nothing.
    const c = new pg.Client({ connectionString: url }); await c.connect()
    await c.query('BEGIN'); await c.query("SELECT set_config('request.jwt.claims', $1, true)", [JSON.stringify({ sub: 'u_viewer', o: { id: 'org_A' } })]); await c.query("SELECT set_config('role','authenticated',true)")
    assert.equal((await c.query("UPDATE editor.projects SET name = 'hack'")).rowCount, 0); await c.query('ROLLBACK'); await c.end()
  })

  await check('Duplicar, listar e excluir com confirmação', async () => {
    const copy = (await ok('video_duplicar_projeto', { projeto_id: projectId, formato: '16:9' })).projeto
    assert.equal(copy.formato, '16:9'); assert.notEqual(copy.id, projectId)
    const list = (await ok('video_listar_projetos', { busca: 'loja' })).projetos; assert.equal(list.length, 2)
    await fails('video_excluir_projeto', { projeto_id: copy.id }, 'INVALID_INPUT')
    assert.equal((await ok('video_excluir_projeto', { projeto_id: copy.id, confirmado: true })).excluido, true)
    await fails('video_ver_projeto', { projeto_id: copy.id }, 'NOT_FOUND')
  })

  await check('Social: rascunho, edição, agendamento e exclusão', async () => {
    const [{ id: accountId }] = (await admin.query("INSERT INTO social.social_accounts (workspace_id, network, handle, status) VALUES ('org_A', 'instagram', '@loja', 'conectada') RETURNING id")).rows
    await admin.query("INSERT INTO social.social_accounts (workspace_id, network, handle) VALUES ('org_B', 'instagram', '@outra')")
    const accounts = (await ok('social_listar_contas', {})).contas; assert.deepEqual(accounts.map((a: { perfil: string }) => a.perfil), ['@loja'])
    const draft = (await ok('social_criar_post', { legenda: 'Promoção #loja', arquivo_ids: [videoId] })).post
    assert.equal(draft.status, 'rascunho'); assert.equal(draft.arquivos[0].id, videoId)
    await fails('social_criar_post', { formato: 'reel', arquivo_ids: [musicId] }, 'INVALID_INPUT')
    await fails('social_agendar_post', { post_id: draft.id, agendar_para: '2030-01-01T10:00:00-03:00', confirmado: true }, 'INVALID_STATE')
    await ok('social_editar_post', { post_id: draft.id, conta_ids: [accountId], legenda: 'Promoção de verão #loja' })
    await fails('social_agendar_post', { post_id: draft.id, agendar_para: '2020-01-01T10:00:00-03:00', confirmado: true }, 'INVALID_INPUT')
    const scheduled = (await ok('social_agendar_post', { post_id: draft.id, agendar_para: '2030-01-01T10:00:00-03:00', confirmado: true })).post
    assert.equal(scheduled.status, 'agendado'); assert.equal(scheduled.contas[0].status, 'agendado'); assert.equal(scheduled.legenda, 'Promoção de verão #loja')
    assert.equal((await ok('social_listar_posts', { status: 'agendado' })).posts.length, 1)
    await fails('social_editar_post', { post_id: draft.id, legenda: 'x' }, 'ACCESS_DENIED', viewer)
    assert.equal((await ok('social_excluir_post', { post_id: draft.id, confirmado: true })).excluido, true)
    assert.equal((await ok('social_listar_posts', {})).posts.length, 0)
  })

  await admin.end()
  console.log(JSON.stringify({ status: 'passed', checks: checks.length }))
}
main().catch(error => { console.error(error); process.exit(1) })
