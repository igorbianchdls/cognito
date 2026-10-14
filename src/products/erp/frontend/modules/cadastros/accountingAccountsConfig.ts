import type { ErpEntityConfig } from '../../../shared/types'
import { ACCOUNTING_CLASSIFICATIONS } from '../../../shared/accountingContracts'

export const accountingAccountsConfig: ErpEntityConfig = {
  id:'contas-contabeis',sectionId:'cadastros',label:'Contas contábeis',singularLabel:'conta contábil',route:'/erp/cadastros/contas-contabeis',
  description:'Grupos e contas específicas organizados na estrutura contábil da empresa.',
  searchPlaceholder:'Buscar por código, nome ou conta superior',primaryActionLabel:'Nova conta contábil',
  columns:[{key:'nome',label:'Conta contábil',width:'min-w-[280px]'},{key:'codigo',label:'Código'},
    {key:'tipo_label',label:'Tipo'},{key:'classificacao_label',label:'Classificação'},
    {key:'natureza_label',label:'Natureza'},{key:'conta_superior',label:'Conta superior'},{key:'status',label:'Status',kind:'status'}],
  fields:[{key:'codigo',label:'Código',type:'text',required:true,placeholder:'Ex.: 1.1.01'},
    {key:'nome',label:'Nome',type:'text',required:true},
    {key:'tipo',label:'Tipo',type:'select',required:true,options:[{value:'sintetica',label:'Sintética (grupo)'},{value:'analitica',label:'Analítica (conta específica)'}]},
    {key:'classificacao',label:'Classificação',type:'select',required:true,options:ACCOUNTING_CLASSIFICATIONS.map(c=>({...c}))},
    {key:'natureza',label:'Natureza',type:'select',required:true,options:[{value:'devedora',label:'Devedora'},{value:'credora',label:'Credora'}]},
    {key:'conta_pai_id',label:'Conta superior',type:'select',placeholder:'Nenhuma: conta na raiz'},
    {key:'descricao',label:'Descrição',type:'textarea'},
    {key:'status',label:'Status',type:'select',options:[{value:'ativo',label:'Ativo'},{value:'inativo',label:'Inativo'}]}],
  filters:[{key:'classificacao',label:'Classificação',allLabel:'Todas as classificações',options:ACCOUNTING_CLASSIFICATIONS.map(c=>({...c}))},
    {key:'tipo',label:'Tipo',allLabel:'Todos os tipos',options:[{value:'sintetica',label:'Sintética'},{value:'analitica',label:'Analítica'}]},
    {key:'status',label:'Status',allLabel:'Todos os status',options:[{value:'ativo',label:'Ativo'},{value:'inativo',label:'Inativo'}]}],
  metrics:[],emptyState:{title:'Nenhuma conta contábil encontrada',description:'Cadastre os grupos e as contas específicas da empresa.'},
  statusMap:{ativo:{label:'Ativo',tone:'success'},inativo:{label:'Inativo',tone:'default'}},
}
