export function domainForTool(name:string):'erp'|'whatsapp'|'workspace' { return name.startsWith('whatsapp_')?'whatsapp':name.startsWith('drive_')||name.startsWith('analytics_')?'workspace':'erp' }
