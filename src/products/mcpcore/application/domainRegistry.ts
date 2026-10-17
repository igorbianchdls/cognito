import { tablesTools } from '../domains/tables/tools/catalog'
export function domainForTool(name:string):'erp'|'tables'|'whatsapp'|'apps' { return name.startsWith('whatsapp_')?'whatsapp':name.startsWith('tables_')?'tables':name.startsWith('apps_')?'apps':'erp' }
export function tablesDefinition(name:string){return tablesTools.find(tool=>tool.name===name)}
