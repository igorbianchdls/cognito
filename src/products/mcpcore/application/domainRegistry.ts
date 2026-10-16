import { tablesTools } from '../domains/tables/tools/catalog'
export function domainForTool(name:string):'erp'|'tables'|'whatsapp' { return name.startsWith('whatsapp_')?'whatsapp':name.startsWith('tables_')?'tables':'erp' }
export function tablesDefinition(name:string){return tablesTools.find(tool=>tool.name===name)}
