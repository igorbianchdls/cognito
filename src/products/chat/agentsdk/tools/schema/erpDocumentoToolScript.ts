export const AGENTSDK_ERP_MCP_DOCUMENTO_TOOL_SCRIPT = `tool('documento','Gera e consulta documentos operacionais (OS/proposta/NFSe/fatura/contrato), retornando PDF. Com save_to_drive=true, tenta salvar no Drive e retornar metadados do arquivo; sem isso, retorna o PDF inline.', {
  action: z.enum(['gerar','status']),
  tipo: z.enum(['proposta','os','fatura','contrato','nfse']).optional(),
  origem_tipo: z.string().optional(),
  origem_id: z.number().int().optional(),
  titulo: z.string().optional(),
  dados: z.any().optional(),
  save_to_drive: z.boolean().optional(),
  drive: z.object({
    workspace_id: z.string().optional(),
    folder_id: z.string().optional(),
    file_name: z.string().optional(),
  }).optional(),
  template_id: z.number().int().optional(),
  template_version_id: z.number().int().optional(),
  idempotency_key: z.string().optional(),
  documento_id: z.number().int().optional(),
  tenant_id: z.number().int().optional(),
}, async (args) => callDocumento(args))`;
