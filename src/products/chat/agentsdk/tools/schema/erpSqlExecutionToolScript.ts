export const AGENTSDK_ERP_MCP_SQL_EXECUTION_TOOL_SCRIPT = `tool('sql_execution','Executa SQL SELECT/CTE com segurança e retorna linhas tabulares para UI. Input mínimo: sql. Suporta {{tenant_id}} para bind automático.', {
  sql: z.string(),
  title: z.string().optional(),
}, async (args) => callSqlExecution(args));`;
