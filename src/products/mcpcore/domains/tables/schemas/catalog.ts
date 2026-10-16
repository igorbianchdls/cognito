import { z } from 'zod'
import { baseInputSchema, fieldInputSchema, viewInputSchema, cellSchema, filterSchema, viewConfigSchema } from '@/products/tables/shared/contracts'

const uuid = z.string().uuid().describe('ID UUID retornado pelas consultas do Tables. Não use IDs do ERP.')
const company = z.number().int().positive().optional().describe('Empresa retornada por meu_acesso; obrigatória quando houver mais de uma.')
const page = { pagina:z.number().int().min(1).max(100000).default(1), tamanho:z.number().int().min(1).max(20).default(10) }
const values = z.record(uuid, cellSchema).describe('Valores por ID estável de campo. Moeda como texto decimal, datas ISO e relações como arrays de IDs.')
const relation = z.object({ campo_id:uuid, modo:z.enum(['definir','adicionar','remover']), valores:z.array(z.string().max(200)).max(1000) }).strict()
const recordData = z.object({ valores:values.default({}), relacoes:z.array(relation).max(100).default([]) }).strict()
const recordEdit = recordData.extend({ registro_id:uuid, expectedVersion:z.number().int().positive().optional() })
const fieldCreate = fieldInputSchema.omit({expectedStructureVersion:true})
// unwrap defaults before partial(): omission on update must never become a reset.
const fieldChanges = z.object({ nome:z.string().trim().min(1).max(120).optional(), tipo:fieldInputSchema.shape.tipo.optional(), obrigatorio:z.boolean().optional(), configuracao:z.object({ moeda:z.string().regex(/^[A-Z]{3}$/).optional() }).strict().optional(), tabela_destino_id:uuid.nullable().optional(), opcoes:fieldInputSchema.shape.opcoes.removeDefault().optional() }).strict()
const viewChanges = z.object({nome:z.string().trim().min(1).max(120).optional(),tipo:viewInputSchema.shape.tipo.optional(),configuracao:z.object({filtros:z.array(filterSchema).max(30).optional(),ordenacao:viewConfigSchema.shape.ordenacao.removeDefault().optional(),agrupamento:uuid.nullable().optional(),campo_data:uuid.nullable().optional()}).strict().optional(),campos:viewInputSchema.shape.campos.removeDefault().optional()}).strict()
const version = { expectedStructureVersion:z.number().int().positive().optional() }
export const readSchemas = {
 listar_bases:z.object({...page,busca:z.string().max(120).default('')}),
 obter_base:z.object({base_id:uuid,...page}),
 obter_tabela:z.object({tabela_id:uuid,...page,secao:z.enum(['campos','visualizacoes','usuarios','tabelas']).default('campos'),campo_id:uuid.optional(),visualizacao_id:uuid.optional(),opcoes_pagina:z.number().int().positive().default(1)}),
 consultar_registros:z.object({tabela_id:uuid,...page,busca:z.string().max(500).default(''),visualizacao:uuid.optional(),filtros:z.array(filterSchema).max(30).default([]),ordenacao:viewConfigSchema.shape.ordenacao,campos:z.array(uuid).max(30).optional()}),
 obter_registro:z.object({registro_id:uuid,campos:z.array(uuid).max(30).optional(),trecho:z.object({campo_id:uuid,inicio:z.number().int().nonnegative().default(0),tamanho:z.number().int().min(1).max(8000).default(4000)}).strict().optional()}),
 listar_comentarios:z.object({registro_id:uuid,...page}),
 consultar_historico:z.object({registro_id:uuid,...page}),
 listar_lixeira:z.object({...page}),
 obter_link_anexo:z.object({anexo_id:uuid}),
 obter_operacao:z.object({operacao_id:uuid.optional(),chave_operacao:uuid.optional()}),
} satisfies Record<string,z.AnyZodObject>
export const actionSchemas = {
 criar_base:baseInputSchema,
 editar_base:z.object({base_id:uuid,alteracoes:z.object({nome:z.string().trim().min(1).max(120).optional(),descricao:z.string().max(2000).optional(),cor:z.string().regex(/^#[a-fA-F0-9]{6}$/).optional()}).strict(),expectedVersion:z.number().int().positive().optional()}),
 criar_tabela:z.object({base_id:uuid,nome:z.string().trim().min(1).max(120)}),
 editar_tabela:z.object({tabela_id:uuid,nome:z.string().trim().min(1).max(120),...version}),
 criar_campo:z.object({tabela_id:uuid,campo:fieldCreate,...version}),
 editar_campo:z.object({tabela_id:uuid,campo_id:uuid,alteracoes:fieldChanges,...version}),
 criar_registro:recordData.extend({tabela_id:uuid,...version}),
 editar_registro:recordEdit.extend({tabela_id:uuid,...version}),
 criar_registros_em_lote:z.object({tabela_id:uuid,registros:z.array(recordData).min(1).max(100),...version}),
 editar_registros_em_lote:z.object({tabela_id:uuid,registros:z.array(recordEdit).min(1).max(100),...version}),
 mover_registros_para_lixeira:z.object({tabela_id:uuid,registros:z.array(z.object({registro_id:uuid,expectedVersion:z.number().int().positive().optional()}).strict()).min(1).max(100),...version}),
 criar_visualizacao:z.object({tabela_id:uuid,visualizacao:viewInputSchema.omit({expectedVersion:true})}),
 editar_visualizacao:z.object({tabela_id:uuid,visualizacao_id:uuid,alteracoes:viewChanges,expectedVersion:z.number().int().positive().optional()}),
 excluir_visualizacao:z.object({tabela_id:uuid,visualizacao_id:uuid,expectedVersion:z.number().int().positive().optional()}),
 adicionar_comentario:z.object({registro_id:uuid,texto:z.string().trim().min(1).max(10000)}),
 mover_para_lixeira:z.object({tipo:z.enum(['bases','tabelas','campos']),item_id:uuid,expectedVersion:z.number().int().positive().optional()}),
 restaurar_item:z.object({tipo:z.enum(['bases','tabelas','campos','registros']),item_id:uuid}),
 remover_anexo:z.object({anexo_id:uuid}),
 preparar_upload:z.object({registro_id:uuid,campo_id:uuid,nome:z.string().trim().min(1).max(200).optional(),mime_type:z.string().min(1).max(150).optional(),tamanho:z.number().int().positive().max(50*1024*1024).optional()}),
 confirmar_upload:z.object({anexo_id:uuid}),
} satisfies Record<string,z.AnyZodObject>
export const cancelSchema = z.object({empresa_id:company,operacao_id:uuid}).strict()
export const commonCompany = company
export const relationSchema = relation
