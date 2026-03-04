export const AGENTSDK_ERP_MCP_SQL_EXECUTION_TOOL_SCRIPT = `tool('sql_execution','Executa SQL com segurança e retorna linhas tabulares para UI. Aceita apenas SELECT/CTE (WITH), uma única instrução, sem placeholders posicionais ($1, $2, ...), com suporte somente a {{tenant_id}} para bind automático. Limite interno de 1000 linhas por execução.', {
  sql: z.string(),
  title: z.string().optional(),
}, async (args) => callSqlExecution(args));`;
