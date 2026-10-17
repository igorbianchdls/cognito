import { z } from 'zod'
import { FIELD_TYPES, cellSchema } from '@/products/tables/shared/contracts'

// Campos, opções, pessoas, vínculos e visualizações aceitam ID ou nome; o servidor resolve
// o nome e recusa referências ambíguas. Bases, tabelas, registros e anexos usam IDs.
const uuid = z.string().uuid()
const ref = z.string().trim().min(1).max(200)
const company = z.number().int().positive().optional().describe('Empresa retornada por meu_acesso; obrigatória quando houver mais de uma.')
const page = { pagina:z.number().int().min(1).max(100000).default(1), tamanho:z.number().int().min(1).max(20).default(10) }
const version = z.number().int().positive().optional()
const name = z.string().trim().min(1).max(120)
const filter = z.object({ campo:ref, operador:z.enum(['eq','neq','contains','empty','not_empty','gt','gte','lt','lte']), valor:z.union([z.string().max(1000),z.number().finite(),z.boolean()]).optional() }).strict()
const sort = z.object({ campo:ref, direcao:z.enum(['asc','desc']).default('asc') }).strict()
const values = z.record(z.string().min(1).max(200), cellSchema).describe('Campo (ID ou nome) → valor. Seleção, pessoas e vínculos aceitam IDs ou nomes; moeda como texto decimal ("1500.00"); datas ISO; null limpa.')
const relation = z.object({ campo:ref, modo:z.enum(['definir','adicionar','remover']), valores:z.array(z.string().max(200)).max(1000) }).strict()
const recordItem = z.object({ registro_id:uuid.optional().describe('Informe para editar; omita para criar.'), valores:values.default({}), relacoes:z.array(relation).max(100).default([]), expectedVersion:version }).strict()
const option = z.union([name, z.object({ id:uuid.optional(), nome:name, cor:z.string().regex(/^#[a-fA-F0-9]{6}$/).optional() }).strict()])

export const readSchemas = {
 listar_bases:z.object({ busca:z.string().max(120).default(''), base_id:uuid.optional().describe('Informe para obter a base e suas tabelas.'), ...page }),
 obter_tabela:z.object({ tabela_id:uuid, secao:z.enum(['campos','visualizacoes','usuarios','tabelas']).default('campos'), campo:ref.optional(), visualizacao:ref.optional(), opcoes_pagina:z.number().int().positive().default(1), ...page }),
 consultar_registros:z.object({ tabela_id:uuid, busca:z.string().max(500).default(''), visualizacao:ref.optional(), filtros:z.array(filter).max(30).default([]), ordenacao:z.array(sort).max(5).default([]), campos:z.array(ref).max(30).optional(), ...page }),
 obter_registro:z.object({ registro_id:uuid, campos:z.array(ref).max(30).optional(), trecho:z.object({ campo:ref, inicio:z.number().int().nonnegative().default(0), tamanho:z.number().int().min(1).max(8000).default(4000) }).strict().optional() }),
 resumir:z.object({ tabela_id:uuid, agrupar_por:ref.optional(), periodo:z.enum(['dia','mes','ano']).default('mes').describe('Para agrupar por campo de data.'), metricas:z.array(z.object({ campo:ref, operacao:z.enum(['soma','media','minimo','maximo']) }).strict()).max(10).default([]), busca:z.string().max(500).default(''), visualizacao:ref.optional(), filtros:z.array(filter).max(30).default([]) }),
 listar_atividade:z.object({ registro_id:uuid, tipo:z.enum(['comentarios','historico']).default('comentarios'), ...page }),
 listar_lixeira:z.object({ ...page }),
 obter_link_anexo:z.object({ anexo_id:uuid }),
 obter_operacao:z.object({ operacao_id:uuid.optional(), chave_operacao:uuid.optional() }),
} satisfies Record<string,z.AnyZodObject>

export const actionSchemas = {
 salvar_base:z.object({ base_id:uuid.optional().describe('Informe para editar; omita para criar.'), nome:name.optional(), descricao:z.string().max(2000).optional(), cor:z.string().regex(/^#[a-fA-F0-9]{6}$/).optional(), modelo:z.enum(['vazia','projetos']).optional().describe('Somente ao criar.'), expectedVersion:version }),
 salvar_tabela:z.object({ base_id:uuid.optional().describe('Para criar.'), tabela_id:uuid.optional().describe('Para renomear.'), nome:name, expectedStructureVersion:version }),
 salvar_campo:z.object({ tabela_id:uuid, campo:ref.optional().describe('Campo existente a editar; omita para criar.'), nome:name.optional(), tipo:z.enum(FIELD_TYPES).optional(), obrigatorio:z.boolean().optional(), moeda:z.string().regex(/^[A-Z]{3}$/).optional(), tabela_destino:ref.optional().describe('Tabela da mesma base, para vínculo.'), opcoes:z.array(option).max(100).optional().describe('Lista final de opções; nomes existentes são preservados.'), expectedStructureVersion:version }),
 salvar_registros:z.object({ tabela_id:uuid, registros:z.array(recordItem).min(1).max(100), expectedStructureVersion:version }),
 salvar_visualizacao:z.object({ tabela_id:uuid, acao:z.enum(['criar','editar','excluir']), visualizacao:ref.optional().describe('Para editar ou excluir.'), nome:name.optional(), tipo:z.enum(['grade','kanban','calendario']).optional(), filtros:z.array(filter).max(30).optional(), ordenacao:z.array(sort).max(5).optional(), agrupar_por:ref.nullable().optional().describe('Kanban exige seleção única.'), campo_data:ref.nullable().optional().describe('Calendário exige data.'), campos_visiveis:z.array(ref).max(200).optional().describe('Colunas visíveis, em ordem.'), expectedVersion:version }),
 comentar:z.object({ registro_id:uuid, texto:z.string().trim().min(1).max(10000) }),
 lixeira:z.object({ acao:z.enum(['mover','restaurar']), tipo:z.enum(['bases','tabelas','campos','registros']), ids:z.array(uuid).min(1).max(100).describe('Vários IDs somente para registros.'), expectedVersion:version }),
 anexos:z.object({ acao:z.enum(['preparar','confirmar','remover']), registro_id:uuid.optional(), campo:ref.optional().describe('Campo de anexo, para preparar.'), anexo_id:uuid.optional(), nome:z.string().trim().min(1).max(200).optional(), mime_type:z.string().min(1).max(150).optional(), tamanho:z.number().int().positive().max(50*1024*1024).optional() }),
} satisfies Record<string,z.AnyZodObject>

export const cancelSchema = z.object({ empresa_id:company, operacao_id:uuid }).strict()
export const commonCompany = company
