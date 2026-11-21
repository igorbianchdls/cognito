export function domainForTool(name:string):'erp'|'whatsapp'|'marketing' { return name.startsWith('whatsapp_')?'whatsapp':name.startsWith('video_')||name.startsWith('social_')?'marketing':'erp' }
