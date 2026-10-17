import { z } from 'zod'
import { readSchemas, actionSchemas, cancelSchema, commonCompany } from '../schemas/catalog'

const descriptions:Record<string,string>={
 listar_bases:'Lista as bases da empresa (pesquisa por nome). Com base_id, retorna a base e suas tabelas.',
 obter_tabela:'Estrutura de uma tabela: campos e opções, visualizações, membros ou tabelas da base. campo e visualizacao (ID ou nome) detalham um item.',
 consultar_registros:'Consulta registros com busca, filtros (combinados por E), ordenação, visualização salva e paginação. campos escolhe colunas. total e somas valem para todo o filtro. exibicao traz os valores legíveis por nome do campo.',
 obter_registro:'Registro completo com versão e anexos. Para textos truncados use trecho.',
 resumir:'Conta e resume registros numa chamada: agrupar_por (seleção, pessoas, vínculo, checkbox, texto ou data por período) e métricas soma, média, mínimo e máximo. Respeita busca e filtros. Use para perguntas como "quantos por status" ou "total por responsável".',
 listar_atividade:'Comentários ou histórico de alterações de um registro, do mais recente ao mais antigo.',
 listar_lixeira:'Itens excluídos que podem ser restaurados.',
 obter_link_anexo:'Link temporário de download de um anexo confirmado.',
 obter_operacao:'Situação de uma operação por operacao_id ou chave_operacao. Use após timeout ou confirmação feita no card, antes de repetir.',
 salvar_base:'Cria (sem base_id) ou edita uma base. Criar executa direto; editar gera prévia.',
 salvar_tabela:'Cria (base_id) ou renomeia (tabela_id) uma tabela. Criar executa direto; renomear gera prévia.',
 salvar_campo:'Cria (sem campo) ou edita um campo. Criar executa direto; editar gera prévia e preserva o que for omitido.',
 salvar_registros:'Cria ou edita de 1 a 100 registros da mesma tabela, de forma atômica. Um registro novo é criado direto; lotes e edições geram prévia. Em relacoes, definir substitui e adicionar/remover preservam as demais escolhas.',
 salvar_visualizacao:'Cria, edita ou exclui uma visualização compartilhada (grade, Kanban ou calendário). Criar executa direto; editar e excluir geram prévia. Excluir é definitivo; os registros permanecem.',
 comentar:'Adiciona um comentário ao registro, com a autoria do usuário. Executa direto.',
 lixeira:'Move para a lixeira ou restaura bases, tabelas, campos ou registros. Gera prévia. Restaure os pais antes dos filhos; campos voltam opcionais.',
 anexos:'Prepara um envio de arquivo (retorna formulário autenticado), confirma um arquivo enviado ou remove um anexo. Preparar e confirmar executam direto; remover gera prévia.',
 cancelar_operacao:'Cancela uma prévia pendente. Não desfaz operações executadas.',
}
const writeFlow=' Envie dados e chave_operacao. Se o retorno trouxer confirmar, mostre a prévia e só confirme com empresa_id e rascunho_id após aprovação explícita. Status saved indica execução.'
// Rótulos curtos por parâmetro: todo parâmetro publicado precisa de explicação, mas texto longo repetido só gasta contexto.
const labels:Record<string,string>={empresa_id:'Empresa autorizada de meu_acesso.',dados:'Dados da operação.',chave_operacao:'UUID estável do pedido; repita a mesma chave apenas com os mesmos dados.',rascunho_id:'Somente após aprovação explícita da prévia; envie sem dados nem chave_operacao.',expectedVersion:'Versão lida antes; divergência gera conflito.',expectedStructureVersion:'Versão da estrutura lida em obter_tabela.',
 busca:'Texto a pesquisar.',pagina:'Página, a partir de 1.',tamanho:'Itens por página.',base_id:'ID da base.',tabela_id:'ID da tabela.',registro_id:'ID do registro.',anexo_id:'ID do anexo.',operacao_id:'ID da operação.',id:'ID existente.',ids:'IDs dos itens.',
 secao:'Parte da estrutura a listar.',campo:'Campo: ID ou nome.',campos:'Campos (ID ou nome), em ordem.',campos_visiveis:'Colunas visíveis (ID ou nome), em ordem.',visualizacao:'Visualização: ID ou nome.',opcoes_pagina:'Página das opções do campo.',
 filtros:'Condições combinadas por E.',operador:'Comparação.',valor:'Valor comparado; opções e pessoas aceitam nome.',ordenacao:'Ordem dos resultados.',direcao:'asc ou desc.',trecho:'Parte de um texto longo.',inicio:'Posição inicial.',
 agrupar_por:'Campo de agrupamento: ID ou nome.',periodo:'Período para datas.',metricas:'Cálculos sobre campos.',operacao:'Cálculo.',tipo:'Tipo.',acao:'Ação.',modo:'definir, adicionar ou remover.',
 nome:'Nome.',descricao:'Descrição.',cor:'Cor hexadecimal (#RRGGBB).',modelo:'Modelo inicial.',obrigatorio:'Exige valor nos registros.',moeda:'Código da moeda (BRL).',tabela_destino:'Tabela vinculada: ID ou nome.',opcoes:'Opções.',
 registros:'Registros a salvar.',valores:'IDs ou nomes das escolhas.',relacoes:'Mudanças em campos de várias escolhas.',campo_data:'Campo de data: ID ou nome.',texto:'Texto do comentário.',mime_type:'Tipo do arquivo.'}
function annotate(schema:z.ZodTypeAny,key:string):z.ZodTypeAny {
 const def={...schema._def}
 if(schema instanceof z.ZodObject)def.shape=()=>Object.fromEntries(Object.entries(schema.shape as Record<string,z.ZodTypeAny>).map(([k,v])=>[k,annotate(v,k)]))
 else if(schema instanceof z.ZodOptional||schema instanceof z.ZodNullable||schema instanceof z.ZodDefault)def.innerType=annotate(schema._def.innerType,key)
 else if(schema instanceof z.ZodArray)def.type=annotate(schema.element,key)
 else if(schema instanceof z.ZodUnion)def.options=schema.options.map((s:z.ZodTypeAny)=>annotate(s,key))
 const Constructor=schema.constructor as new(def:object)=>z.ZodTypeAny
 return new Constructor(def).describe(schema.description||labels[key]||key.replaceAll('_',' ')+'.')
}
const documented=(schema:z.AnyZodObject)=>annotate(schema,'argumentos') as z.AnyZodObject
// Somam ou só acrescentam dados: nada é sobrescrito nem removido.
const additive=new Set(['comentar'])

export const tablesTools=[
 ...Object.entries(readSchemas).map(([key,schema])=>({name:'tables_'+key,key,title:descriptions[key].split(/[.:(]/)[0],description:descriptions[key],write:false,control:false,destructive:false,schema:documented(schema.extend({empresa_id:commonCompany}).strict())})),
 ...Object.entries(actionSchemas).map(([key,schema])=>({name:'tables_'+key,key,title:descriptions[key].split(/[.:(]/)[0],description:descriptions[key]+writeFlow,write:true,control:false,destructive:!additive.has(key),schema:documented(z.object({empresa_id:commonCompany,chave_operacao:z.string().uuid().optional(),dados:schema.strict().optional(),rascunho_id:z.string().uuid().optional()}).strict())})),
 {name:'tables_cancelar_operacao',key:'cancelar_operacao',title:'Cancelar prévia do Tables',description:descriptions.cancelar_operacao,write:false,control:true,destructive:false,schema:documented(cancelSchema)},
]
export const tablesEnvelope=z.object({ok:z.literal(true),execution_id:z.string().uuid(),empresa_id:z.number().int().positive(),data:z.record(z.unknown())})
