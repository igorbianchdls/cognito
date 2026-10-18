import { z } from 'zod'
import { fieldSchema, PATH_PATTERN, SLUG_PATTERN, tableSourceSchema } from '@/products/apps/shared/contracts'

const uuid = z.string().uuid()
const key = z.string().regex(/^[a-z][a-z0-9_]{0,49}$/)
const company = z.number().int().positive().optional().describe('Empresa retornada por meu_acesso; obrigatória quando houver mais de uma.')

// One change to one file. escrever creates or replaces it; editar replaces a unique excerpt;
// remover deletes it. Small edits keep the chat from resending whole files.
const fileChange = z.object({
  caminho: z.string().max(200).regex(PATH_PATTERN).describe('Caminho do arquivo, como src/App.jsx.'),
  acao: z.enum(['escrever', 'editar', 'remover']).default('escrever').describe('escrever cria ou substitui; editar troca um trecho único; remover apaga.'),
  conteudo: z.string().max(400_000).optional().describe('Conteúdo completo, para escrever.'),
  buscar: z.string().min(1).max(20_000).optional().describe('Trecho exato que aparece uma única vez, para editar.'),
  substituir: z.string().max(400_000).optional().describe('Novo texto no lugar do trecho, para editar.'),
}).strict()
const collection = z.object({ id: uuid.optional().describe('Mantenha o ID das coleções existentes; omita para criar.'), chave: key, nome: z.string().trim().min(1).max(100), campos: z.array(fieldSchema).min(1).max(40) }).strict()

export const readSchemas = {
  listar: z.object({ busca: z.string().max(100).default(''), filtro: z.enum(['todos', 'publicados', 'construcao', 'arquivados', 'favoritos', 'lixeira']).default('todos'), pagina: z.number().int().min(1).max(1000).default(1) }),
  obter: z.object({ app_id: uuid }),
  obter_codigo: z.object({ app_id: uuid, caminho: z.string().max(200).optional().describe('Omita para listar os arquivos.'), versao: z.enum(['rascunho', 'publicada']).default('rascunho'), inicio: z.number().int().nonnegative().default(0), tamanho: z.number().int().min(1).max(40_000).default(20_000) }),
  consultar_dados: z.object({ app_id: uuid, colecao: key, pagina: z.number().int().min(1).max(10_000).default(1) }),
  obter_operacao: z.object({ operacao_id: uuid.optional(), chave_operacao: uuid.optional() }),
} satisfies Record<string, z.AnyZodObject>

export const actionSchemas = {
  criar: z.object({ nome: z.string().trim().min(1).max(100), descricao: z.string().trim().max(2000).optional(), cor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(), icone: z.enum(['app', 'users', 'calendar', 'clipboard', 'chart', 'folder']).optional(), modelo: z.enum(['html', 'react']).default('react'), exemplo: z.boolean().default(false).describe('true cria a lista de ideias de exemplo.') }),
  salvar_codigo: z.object({
    app_id: uuid,
    arquivos: z.array(fileChange).max(100).default([]),
    manifesto: z.object({ modelo: z.enum(['html', 'react']).optional(), principal: z.string().max(200).regex(PATH_PATTERN).optional(), tabelas: z.array(tableSourceSchema).max(20).optional().describe('Lista final de tabelas do Tables usadas por otto.tables.'), colecoes: z.array(collection).max(20).optional().describe('Lista final de coleções internas usadas por otto.data.') }).strict().optional(),
    expectedVersion: z.number().int().positive().optional(),
  }),
  publicar: z.object({ app_id: uuid, versao: z.number().int().positive().optional().describe('Número da versão; omita para o rascunho atual.') }),
  ciclo: z.object({ app_id: uuid, acao: z.enum(['arquivar', 'excluir', 'restaurar', 'despublicar']) }),
  limpar_dados: z.object({ app_id: uuid, colecao: key, registro_ids: z.array(uuid).min(1).max(500).optional().describe('Registros a remover (id de consultar_dados); omita para limpar a coleção inteira.') }),
  acesso: z.object({ app_id: uuid, dominio: z.string().max(253).nullable().optional().describe('Domínio próprio do link público (apps.suaempresa.com.br); null remove. Exige o app público.'), modo: z.enum(['privado', 'publico']).optional().describe('privado: só membros da empresa; publico: qualquer pessoa com o link, sem login.'), endereco: z.string().regex(SLUG_PATTERN).optional().describe('Endereço do link público (/p/endereco), de 3 a 60 letras minúsculas, números ou hífens; omita para manter o atual ou gerar pelo nome.') }),
} satisfies Record<string, z.AnyZodObject>

export const cancelSchema = z.object({ empresa_id: company, operacao_id: uuid }).strict()
export const commonCompany = company
