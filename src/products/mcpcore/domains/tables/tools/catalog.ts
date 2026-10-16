import { z } from 'zod'
import { readSchemas, actionSchemas, cancelSchema, commonCompany } from '../schemas/catalog'

const descriptions:Record<string,string>={
 listar_bases:'Lista as bases personalizadas da empresa, com pesquisa por nome e paginação.',
 obter_base:'Obtém uma base e suas tabelas paginadas. Use seus IDs nas consultas seguintes.',
 obter_tabela:'Obtém a estrutura de uma tabela: campos e opções, visualizações, membros ou tabelas da mesma base. Use secao e paginação; campo_id e opcoes_pagina permitem descobrir todas as opções. visualizacao_id retorna a configuração completa de uma visualização.',
 consultar_registros:'Consulta registros com pesquisa, filtros combinados por E, ordenação, visualização salva, paginação e escolha de campos. total e somas abrangem todo o filtro, não apenas a página. Campos textuais e relações extensas indicam truncamento.',
 obter_registro:'Obtém registro, versão, nomes dos campos e anexos. Se houver texto truncado, use trecho com campo_id, inicio e tamanho. Comentários e atividade completos têm consultas próprias.',
 listar_comentarios:'Lista comentários de um registro com paginação e autor.',
 consultar_historico:'Consulta operações do histórico do registro, da mais recente para a mais antiga, com paginação.',
 listar_lixeira:'Lista itens excluídos recuperáveis. Filhos de bases ou tabelas excluídas aparecem depois da restauração dos pais.',
 obter_link_anexo:'Obtém um link temporário de download privado para um anexo confirmado e autorizado. Links expiram; gere outro quando necessário.',
 obter_operacao:'Consulta uma prévia ou o resultado por operacao_id ou chave_operacao. Use depois de timeout ou confirmação feita no card antes de repetir uma alteração.',
 criar_base:'Cria base vazia ou com estrutura de projetos. O modelo cria campos e visualizações, sem registros fictícios.',
 editar_base:'Edita somente nome, descrição ou cor informados; preserva os demais atributos.',
 criar_tabela:'Cria tabela em uma base existente, com campo principal textual e grade.',
 editar_tabela:'Renomeia a tabela preservando campos, dados e visualizações.',
 criar_campo:'Cria campo com tipo, opções e configurações. Vínculos apontam somente para tabelas da mesma base. Campos obrigatórios são definidos antes da inclusão de registros.',
 editar_campo:'Edita parcialmente um campo. Atributos omitidos, opções e IDs existentes são preservados. Tipos e destinos não podem ser convertidos quando já existem registros.',
 criar_registro:'Cria registro usando IDs de campos. Valores relacionais usam IDs existentes. Moeda usa texto decimal; datas ISO.',
 editar_registro:'Edita somente os campos informados. Em relacoes, definir substitui; adicionar/remover preservam as demais escolhas e valem apenas para campos múltiplos. null limpa um valor simples; omissão o preserva.',
 criar_registros_em_lote:'Cria até 100 registros na mesma tabela em uma operação atômica. Uma falha desfaz todos. Reduza o lote se exceder o tamanho técnico.',
 editar_registros_em_lote:'Edita registros específicos da mesma tabela de forma atômica, preservando campos omitidos. Sem IDs repetidos. Uma falha ou versão desatualizada desfaz tudo.',
 mover_registros_para_lixeira:'Move um ou vários registros específicos da mesma tabela para a lixeira. A operação é recuperável e atômica.',
 criar_visualizacao:'Cria visualização compartilhada de grade, Kanban ou calendário. Kanban exige seleção única e calendário exige data.',
 editar_visualizacao:'Edita parcialmente nome, tipo, filtros, ordenação, agrupamento ou colunas. O que for omitido é preservado.',
 excluir_visualizacao:'Exclui definitivamente uma visualização. Essa ação não vai para a lixeira; os registros permanecem. Deve existir ao menos uma visualização na tabela.',
 adicionar_comentario:'Adiciona comentário ao registro autorizado, preservando a autoria do usuário.',
 mover_para_lixeira:'Move base, tabela ou campo para a lixeira. Seus dados são preservados. Para registros use mover_registros_para_lixeira.',
 restaurar_item:'Restaura base, tabela, campo ou registro. Restaure primeiro os pais excluídos. Campos voltam opcionais; filtros e agrupamentos removidos não são recriados.',
 remover_anexo:'Marca um anexo como excluído. O arquivo deixa de aparecer; a manutenção remove o objeto físico posteriormente.',
 preparar_upload:'Prepara um envio privado para um campo de anexo. Após confirmação da prévia retorna aguardando_envio e formulário autenticado. Criar a URL não envia o arquivo.',
 confirmar_upload:'Confirma um arquivo efetivamente transferido. Valida o tamanho no Storage; sem arquivo enviado não conclui o upload.',
 cancelar_operacao:'Cancela uma prévia pendente da própria conexão. Não desfaz operações já executadas e não precisa de outra prévia.',
}
const labels:Record<string,string>={empresa_id:'Empresa autorizada de meu_acesso.',pagina:'Página de resultados, começando em 1.',tamanho:'Quantidade técnica por página.',dados:'Dados específicos da alteração. Campos omitidos em uma edição são preservados.',chave_operacao:'UUID estável para repetição da mesma proposta. Dados diferentes exigem outra chave.',rascunho_id:'Somente após aprovação explícita: envie a referência da prévia, sem dados nem chave_operacao.',operacao_id:'ID UUID da operação retornada anteriormente.',registro_id:'ID UUID do registro do Tables.',tabela_id:'ID UUID da tabela do Tables.',campo_id:'ID UUID de campo retornado por obter_tabela.',base_id:'ID UUID da base do Tables.',visualizacao_id:'ID UUID da visualização.',anexo_id:'ID UUID do anexo autorizado.',expectedVersion:'Versão lida anteriormente. Se divergir, a operação retorna conflito.',expectedStructureVersion:'Versão da estrutura lida em obter_tabela.',alteracoes:'Somente os atributos que devem mudar.',opcoes:'Lista final de opções; preserve IDs existentes. Omitir a lista preserva as opções.',campos:'IDs dos campos selecionados, ou configuração de colunas quando usada em visualizações.',relacoes:'Alterações explícitas em campos relacionais: definir, adicionar ou remover.',trecho:'Recupera uma parte de um texto longo, com posição inicial e quantidade de caracteres.'}
function annotate(schema:z.ZodTypeAny,key:string):z.ZodTypeAny {
 const def={...schema._def}
 if(schema instanceof z.ZodObject)def.shape=()=>Object.fromEntries(Object.entries(schema.shape as Record<string,z.ZodTypeAny>).map(([k,v])=>[k,annotate(v,k)]))
 else if(schema instanceof z.ZodOptional||schema instanceof z.ZodNullable||schema instanceof z.ZodDefault)def.innerType=annotate(schema._def.innerType,key)
 else if(schema instanceof z.ZodArray)def.type=annotate(schema.element,key)
 else if(schema instanceof z.ZodEffects)def.schema=annotate(schema.innerType(),key)
 else if(schema instanceof z.ZodUnion)def.options=schema.options.map((s:z.ZodTypeAny)=>annotate(s,key))
 const Constructor=schema.constructor as new(def:object)=>z.ZodTypeAny
 return new Constructor(def).describe(schema.description||labels[key]||`Informe ${key.replaceAll('_',' ')} conforme a estrutura do Tables.`)
}
function documented(schema:z.AnyZodObject):z.AnyZodObject {
 return annotate(schema,'argumentos') as z.AnyZodObject
}
export const tablesTools=[
 ...Object.entries(readSchemas).map(([key,schema])=>({name:'tables_'+key,key,title:descriptions[key].split('.')[0],description:descriptions[key],write:false,control:false,schema:documented(schema.extend({empresa_id:commonCompany}).strict())})),
 ...Object.entries(actionSchemas).map(([key,schema])=>({name:'tables_'+key,key,title:descriptions[key].split('.')[0],description:descriptions[key]+' Primeiro envie dados e chave_operacao para obter prévia. Mostre a prévia e só execute com empresa_id e rascunho_id após confirmação explícita. Consulte obter_operacao se o resultado for incerto.',write:true,control:false,schema:documented(z.object({empresa_id:commonCompany,chave_operacao:z.string().uuid().optional(),dados:schema.strict().optional(),rascunho_id:z.string().uuid().optional()}).strict())})),
 {name:'tables_cancelar_operacao',key:'cancelar_operacao',title:'Cancelar prévia do Tables',description:descriptions.cancelar_operacao,write:false,control:true,schema:documented(cancelSchema)},
]
export const tablesEnvelope=z.object({ok:z.literal(true),execution_id:z.string().uuid(),empresa_id:z.number().int().positive(),data:z.record(z.unknown())})
