import { z } from 'zod'

export const FIELD_TYPES = ['texto', 'texto_longo', 'numero', 'moeda', 'porcentagem', 'avaliacao', 'data', 'data_hora', 'checkbox', 'selecao', 'selecao_multipla', 'usuario', 'usuarios', 'email', 'url', 'telefone', 'vinculo', 'anexo', 'formula', 'busca', 'agregacao', 'autonumero', 'criado_em', 'alterado_em', 'criado_por', 'alterado_por'] as const
export type FieldType = typeof FIELD_TYPES[number]
export const FIELD_LABELS: Record<FieldType, string> = { texto: 'Texto', texto_longo: 'Texto longo', numero: 'Número', moeda: 'Moeda', porcentagem: 'Porcentagem', avaliacao: 'Avaliação', data: 'Data', data_hora: 'Data e hora', checkbox: 'Checkbox', selecao: 'Seleção', selecao_multipla: 'Seleção múltipla', usuario: 'Responsável', usuarios: 'Pessoas', email: 'E-mail', url: 'URL', telefone: 'Telefone', vinculo: 'Vínculo', anexo: 'Anexo', formula: 'Fórmula', busca: 'Busca em vínculo', agregacao: 'Agregação de vínculo', autonumero: 'Numeração automática', criado_em: 'Criado em', alterado_em: 'Alterado em', criado_por: 'Criado por', alterado_por: 'Alterado por' }
// Filled by the system from the record itself (number, dates and authors): never written.
export const SYSTEM_TYPES: readonly FieldType[] = ['autonumero', 'criado_em', 'alterado_em', 'criado_por', 'alterado_por']
// Calculated when read, from the record (formula) or from linked records (busca, agregacao): never written.
export const DERIVED_TYPES: readonly FieldType[] = ['formula', 'busca', 'agregacao']
export const isComputed = (type: FieldType) => SYSTEM_TYPES.includes(type) || DERIVED_TYPES.includes(type)
export const AGGREGATIONS = ['contagem', 'soma', 'media', 'minimo', 'maximo'] as const
export type CellValue = string | number | boolean | string[] | null
export type Values = Record<string, CellValue>
export type Option = { id: string; nome: string; cor: string; posicao: number; arquivado?: boolean }
export type Field = { id: string; nome: string; tipo: FieldType; obrigatorio: boolean; posicao: number; configuracao: Record<string, unknown>; tabela_destino_id: string | null; opcoes: Option[] }
export const BASE_ROLES = ['leitor', 'editor', 'administrador'] as const
export type BaseRole = typeof BASE_ROLES[number]
export const ROLE_LABELS: Record<BaseRole, string> = { leitor: 'Leitor', editor: 'Editor', administrador: 'Administrador' }
export type Base = { id: string; nome: string; descricao: string; cor: string; icone: string; versao: number; posicao: number; acesso: 'empresa' | 'restrito'; papel: BaseRole | null; excluido_em?: string | null }
export type Sharing = { acesso: 'empresa' | 'restrito'; versao: number; papel: BaseRole; membros: (Member & { papel: BaseRole; administrador_empresa: boolean })[]; pessoas: Member[] }
// Members listed replace the current list; company owners and admins always administer every base.
export const sharingInputSchema = z.object({ acesso: z.enum(['empresa', 'restrito']), membros: z.array(z.object({ usuario_id: z.string().regex(/^[1-9]d*$/), papel: z.enum(BASE_ROLES) }).strict()).max(500), expectedVersion: z.number().int().positive() }).strict()
export type DataTable = { id: string; base_id: string; nome: string; campo_principal_id: string | null; versao_estrutura: number; posicao: number; excluido_em?: string | null }
export type Member = { id: string; nome: string; email: string }
export type DataRecord = { id: string; tabela_id: string; valores: Values; versao: number; posicao: number; criado_em: string; atualizado_em: string }
export const filterSchema = z.object({ campo: z.string().uuid(), operador: z.enum(['eq', 'neq', 'contains', 'empty', 'not_empty', 'gt', 'gte', 'lt', 'lte']), valor: z.union([z.string().max(1000), z.number().finite(), z.boolean()]).optional() }).strict()
export type Filter = z.infer<typeof filterSchema>
export const viewConfigSchema = z.object({ filtros: z.array(filterSchema).max(30).default([]), ordenacao: z.array(z.object({ campo: z.string().uuid(), direcao: z.enum(['asc', 'desc']) }).strict()).max(5).default([]), agrupamento: z.string().uuid().nullable().default(null), campo_data: z.string().uuid().nullable().default(null), campo_fim: z.string().uuid().nullable().default(null), combinacao: z.enum(['e', 'ou']).default('e'), mensagem: z.string().trim().max(500).default('') }).strict()
export type ViewConfig = z.infer<typeof viewConfigSchema>
export const VIEW_TYPES = ['grade', 'kanban', 'calendario', 'galeria', 'formulario', 'linha_do_tempo'] as const
export const VIEW_LABELS: Record<typeof VIEW_TYPES[number], string> = { grade: 'Grade', kanban: 'Kanban', calendario: 'Calendário', galeria: 'Galeria', formulario: 'Formulário', linha_do_tempo: 'Linha do tempo' }
export type View = { id: string; nome: string; tipo: typeof VIEW_TYPES[number]; configuracao: ViewConfig; versao: number; campos: { campo_id: string; visivel: boolean; largura: number; posicao: number }[] }
export type TableBundle = { tabela: DataTable; campos: Field[]; visualizacoes: View[]; usuarios: Member[]; tabelas: DataTable[] }
export type RecordPage = { registros: DataRecord[]; total: number; pagina: number; tamanho: number; somas: Record<string, string> }
export type Comment = { id: string; texto: string; autor: string; criado_em: string }
export type History = { id: string; acao: string; entidade: string; autor: string; criado_em: string; operacao_id: string }
export type Attachment = { id: string; campo_id: string; nome: string; mime_type: string; tamanho: number; estado: string }
export type RecordDetail = { registro: DataRecord; comentarios: Comment[]; historico: History[]; anexos: Attachment[] }
export type SessionInfo = { empresa: string; usuario: string; podeEditar: boolean; bases: Base[] }
export const nameSchema = z.string().trim().min(1, 'Informe um nome.').max(120)
export const colorSchema = z.string().regex(/^#[a-fA-F0-9]{6}$/).default('#8b5cf6')
export const baseInputSchema = z.object({ nome: nameSchema, descricao: z.string().trim().max(2000).default(''), cor: colorSchema, modelo: z.enum(['vazia', 'projetos']).default('vazia') }).strict()
export const optionInputSchema = z.object({ id: z.string().uuid().optional(), nome: nameSchema, cor: colorSchema }).strict()
export const fieldInputSchema = z.object({ nome: nameSchema, tipo: z.enum(FIELD_TYPES), obrigatorio: z.boolean().default(false), configuracao: z.object({ moeda: z.string().regex(/^[A-Z]{3}$/).default('BRL'), maximo: z.number().int().min(3).max(10).optional(), formula: z.string().trim().min(1).max(2000).optional(), vinculo: z.string().uuid().optional(), campo: z.string().uuid().optional(), operacao: z.enum(AGGREGATIONS).optional() }).strict().default({}), tabela_destino_id: z.string().uuid().nullable().default(null), opcoes: z.array(optionInputSchema).max(100).default([]), expectedStructureVersion: z.number().int().positive() }).strict()
export const cellSchema = z.union([z.string().max(100000), z.number().finite(), z.boolean(), z.array(z.string().max(200)).max(1000), z.null()])
export const recordInputSchema = z.object({ valores: z.record(z.string().uuid(), cellSchema), expectedVersion: z.number().int().positive().optional(), expectedStructureVersion: z.number().int().positive() }).strict()
export const viewInputSchema = z.object({ nome: nameSchema, tipo: z.enum(VIEW_TYPES), configuracao: viewConfigSchema, campos: z.array(z.object({ campo_id: z.string().uuid(), visivel: z.boolean(), largura: z.number().int().min(80).max(800), posicao: z.number().int().nonnegative() }).strict()).max(200).default([]), expectedVersion: z.number().int().positive().optional() }).strict()
export const listQuerySchema = z.object({ pagina: z.coerce.number().int().min(1).max(100000).default(1), tamanho: z.coerce.number().int().min(1).max(100).default(50), busca: z.string().max(500).default(''), visualizacao: z.string().uuid().optional(), filtros: z.array(filterSchema).max(30).default([]), combinacao: z.enum(['e', 'ou']).default('e'), ordenacao: viewConfigSchema.shape.ordenacao }).strict()
export type ListQuery = z.infer<typeof listQuerySchema>

export function recordTitle(record: DataRecord, fields: Field[], primary?: string | null) {
  const field = fields.find(f => f.id === primary) ?? fields[0]
  const value = field ? record.valores[field.id] : null
  return typeof value === 'string' && value.trim() ? value : 'Sem nome'
}

export class TablesError extends Error {
  constructor(public code: string, message: string, public status = 422) { super(message); this.name = 'TablesError' }
}
