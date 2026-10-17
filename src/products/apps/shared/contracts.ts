import { z } from 'zod'

export class AppsError extends Error {
  constructor(public code: string, message: string, public status = 400) { super(message) }
}
export const uuid = z.string().uuid()
export const metadataSchema = z.object({ nome: z.string().trim().min(1).max(100), descricao: z.string().trim().max(2000).default(''), cor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default('#7259d6'), icone: z.enum(['app', 'users', 'calendar', 'clipboard', 'chart', 'folder']).default('app') }).strict()
export const expectedSchema = z.object({ expectedVersion: z.number().int().positive() }).strict()
export const fieldSchema = z.object({ id: z.string().regex(/^[a-z][a-z0-9_]{0,49}$/), nome: z.string().trim().min(1).max(100), tipo: z.enum(['texto', 'numero', 'booleano', 'data']), obrigatorio: z.boolean().default(false) }).strict()
export const collectionSchema = z.object({ id: uuid, chave: z.string().regex(/^[a-z][a-z0-9_]{0,49}$/), nome: z.string().trim().min(1).max(100), campos: z.array(fieldSchema).min(1).max(40) }).strict()
// Tabelas do Tables usadas pelo app: a chave é o nome usado no código, como otto.tables.listar('chamados').
// visitantes: what people without login may do through the public link, with the fields by name.
// Visitors never edit; people, links and attachments stay out because they expose company data.
// Calculated fields (formula, busca, agregacao) are left out: they can carry values of hidden fields.
export const VISITOR_FIELD_TYPES = ['texto', 'texto_longo', 'numero', 'moeda', 'porcentagem', 'avaliacao', 'data', 'data_hora', 'checkbox', 'selecao', 'selecao_multipla', 'email', 'url', 'telefone', 'autonumero', 'criado_em', 'alterado_em']
export const VISITOR_READ_ONLY_TYPES = ['autonumero', 'criado_em', 'alterado_em']
const visitorFields = z.array(z.string().trim().min(1).max(200)).min(1).max(60)
export const visitorRulesSchema = z.object({ ler: visitorFields.optional().describe('Campos que visitantes podem ver.'), criar: visitorFields.optional().describe('Campos que visitantes podem preencher ao criar.') }).strict()
export const tableSourceSchema = z.object({ chave: z.string().regex(/^[a-z][a-z0-9_]{0,49}$/), tabela_id: uuid, operacoes: z.array(z.enum(['ler', 'criar', 'editar'])).min(1).max(3), visitantes: visitorRulesSchema.optional() }).strict()
export type TableSource = z.infer<typeof tableSourceSchema>
export const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/
export type Access = { modo: 'privado' | 'publico'; endereco: string; definido_por: number; definido_em: string }
// Caminhos de arquivo: até 5 pastas (src/components/Header.jsx), sem "." nem "..".
export const PATH_PATTERN = /^(?:[a-zA-Z0-9][a-zA-Z0-9_.-]{0,99}\/){0,5}[a-zA-Z0-9][a-zA-Z0-9_.-]{0,99}\.(html|css|js|jsx|ts|tsx|json|svg|png|jpg|jpeg|webp)$/
export const SOURCE_PATTERN = /\.(js|jsx|ts|tsx)$/
// modelo html: páginas e scripts prontos. modelo react: projeto com imports, compilado no servidor a partir de principal.
export const manifestSchema = z.object({ formato: z.literal(1), entrada: z.literal('index.html'), modelo: z.enum(['html', 'react']).default('html'), principal: z.string().regex(PATH_PATTERN).refine(p => SOURCE_PATTERN.test(p), 'Use um arquivo .js, .jsx, .ts ou .tsx.').default('src/main.jsx'), colecoes: z.array(collectionSchema).max(20).default([]), tabelas: z.array(tableSourceSchema).max(20).default([]) }).strict().superRefine((v, ctx) => {
  const ids = v.colecoes.map(c => c.id), keys = v.colecoes.map(c => c.chave)
  if (new Set(ids).size !== ids.length || new Set(keys).size !== keys.length || v.colecoes.some(c => new Set(c.campos.map(f => f.id)).size !== c.campos.length)) ctx.addIssue({ code: 'custom', message: 'Coleções e campos precisam ter identificadores únicos.' })
  if (new Set(v.tabelas.map(t => t.chave)).size !== v.tabelas.length || v.tabelas.some(t => new Set(t.operacoes).size !== t.operacoes.length)) ctx.addIssue({ code: 'custom', message: 'Cada tabela do manifesto precisa de uma chave única e operações sem repetição.' })
  for (const t of v.tabelas) {
    if (!t.visitantes) continue
    if (!t.visitantes.ler && !t.visitantes.criar) ctx.addIssue({ code: 'custom', message: `"${t.chave}": em visitantes, informe ler, criar ou os dois.` })
    for (const op of ['ler', 'criar'] as const) if (t.visitantes[op] && !t.operacoes.includes(op)) ctx.addIssue({ code: 'custom', message: `"${t.chave}": visitantes só podem ${op} se operacoes incluir ${op}.` })
  }
})
export type Manifest = z.infer<typeof manifestSchema>
export const fileSchema = z.object({ caminho: z.string().max(200).regex(PATH_PATTERN), conteudo: z.string().max(400_000), codificacao: z.enum(['utf8', 'base64']).default('utf8') }).strict()
export type AppFile = z.infer<typeof fileSchema>
export const draftSchema = expectedSchema.extend({ manifesto: manifestSchema, arquivos: z.array(fileSchema).min(1).max(100) }).strict()
export type AppPackage = { manifesto: Manifest; arquivos: AppFile[] }
export type App = { id: string; nome: string; descricao: string; cor: string; icone: string; versao_concorrencia: number; atualizado_em: string; arquivado_em: string | null; excluido_em: string | null; favorito: boolean; publicacao_id: string | null; versao_publicada_id: string | null; tem_rascunho: boolean; acesso: 'privado' | 'publico' | null; endereco: string | null; dominio?: string | null }
export type Version = { id: string; numero: number; estado: 'rascunho' | 'pronta'; manifesto: Manifest; hash_conteudo: string | null; versao_formato: number; build_estado: 'ok' | 'erro' | null; build_erro: string | null; criado_em: string; selado_em: string | null }
export type Usage = { periodo_dias: number; aberturas_app: number; aberturas_link_publico: number; registros_criados_por_visitantes: number; dias: { dia: string; modo: string; aberturas: number; criacoes: number }[] }
export type Bundle = { app: App; versoes: Version[]; podeEditar: boolean; podePublicar: boolean; uso?: Usage }
export type Catalog = { apps: App[]; total: number; pagina: number; contadores: Record<string, number>; podeEditar: boolean; podePublicar: boolean }
export type DataRecord = { id: string; dados: Record<string, unknown>; versao_concorrencia: number }
export const recordSchema = z.object({ id: uuid.optional(), expectedVersion: z.number().int().positive().optional(), dados: z.record(z.unknown()) }).strict()

export function validateData(collection: Manifest['colecoes'][number], data: Record<string, unknown>) {
  if (Object.keys(data).some(k => !collection.campos.some(f => f.id === k))) throw new AppsError('INVALID_DATA', 'Há campos desconhecidos neste registro.')
  if (JSON.stringify(data).length > 32_000) throw new AppsError('INVALID_DATA', 'O registro é muito grande.')
  for (const f of collection.campos) {
    const value = data[f.id]
    if (value === undefined || value === null || value === '') { if (f.obrigatorio) throw new AppsError('INVALID_DATA', `Preencha ${f.nome}.`); continue }
    const valid = f.tipo === 'texto' ? typeof value === 'string' && value.length <= 8000 : f.tipo === 'numero' ? typeof value === 'number' && Number.isFinite(value) : f.tipo === 'booleano' ? typeof value === 'boolean' : typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
    if (!valid) throw new AppsError('INVALID_DATA', `Confira o campo ${f.nome}.`)
  }
  return data
}

export function validatePackage(input: AppPackage): AppPackage {
  const p = draftSchema.omit({ expectedVersion: true }).parse(input)
  if (new Set(p.arquivos.map(f => f.caminho)).size !== p.arquivos.length) throw new AppsError('INVALID_FILES', 'Não repita caminhos de arquivos.')
  if (!p.arquivos.some(f => f.caminho === 'index.html' && f.codificacao === 'utf8')) throw new AppsError('INVALID_FILES', 'Inclua um arquivo index.html em texto.')
  if (p.arquivos.some(f => f.caminho.endsWith('.html') && f.caminho !== 'index.html')) throw new AppsError('INVALID_FILES', 'Use index.html como página única nesta versão.')
  if (JSON.stringify(p).length > 1_500_000) throw new AppsError('INVALID_FILES', 'O pacote ultrapassa o limite técnico de 1,5 MB.')
  const react = p.manifesto.modelo === 'react'
  if (react && !p.arquivos.some(f => f.caminho === p.manifesto.principal)) throw new AppsError('INVALID_FILES', `Inclua o arquivo principal ${p.manifesto.principal}.`)
  for (const f of p.arquivos) {
    const image = /\.(png|jpe?g|webp)$/.test(f.caminho)
    if (image !== (f.codificacao === 'base64') || image && !/^[a-zA-Z0-9+/]*={0,2}$/.test(f.conteudo)) throw new AppsError('INVALID_FILES', 'Confira a codificação dos arquivos.')
    if (!react && /\.(jsx|ts|tsx|json|svg)$/.test(f.caminho)) throw new AppsError('INVALID_FILES', `${f.caminho}: arquivos .jsx, .ts, .tsx, .json e .svg exigem um app em React.`)
    // React projects are bundled on the server, so imports between files are expected there.
    // Only real module syntax is refused in HTML apps: text that merely mentions "import" is fine.
    if (!react && f.caminho.endsWith('.js') && /(?:^|[;{}\n])\s*(?:import\s*(?:[\w{*'"]|\()|export\s+(?:default|const|let|function|class|\{))|\brequire\s*\(/m.test(f.conteudo)) throw new AppsError('UNSUPPORTED_IMPORT', `${f.caminho}: imports, exports e require não são suportados; inclua o código no próprio pacote.`)
    if (f.caminho.endsWith('.css') && (react ? /@import\s+(?:url\()?\s*["']?(?:https?:)?\/\//i : /@import\b/i).test(f.conteudo)) throw new AppsError('UNSUPPORTED_IMPORT', `${f.caminho}: @import de endereços externos não é suportado; inclua o CSS no próprio pacote.`)
  }
  return p
}
