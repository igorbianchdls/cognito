export function domainForTool(name:string):'erp'|'whatsapp' { return name.startsWith('whatsapp_')?'whatsapp':'erp' }
