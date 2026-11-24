export function domainForTool(name:string):'erp'|'whatsapp'|'workspace' { return name.startsWith('whatsapp_')?'whatsapp':/^(drive|analytics|inbox)_/.test(name)?'workspace':'erp' }
