export const CODEX_APP_TOOL_DISPATCH_SCRIPT = `
async function callKnownAppToolByName(toolName, parsedArgs) {
  const args = parsedArgs && typeof parsedArgs === 'object' ? parsedArgs : {};
  if (toolName === 'crud') return await callCrud(args);
  if (toolName === 'dashboard_builder') return await callDashboardBuilder(args);
  if (toolName === 'sql_execution') return await callSqlExecution(args);
  if (toolName === 'ecommerce') return await callEcommerce(args);
  if (toolName === 'marketing') return await callMarketing(args);
  if (toolName === 'drive') return await callDrive(args);
  if (toolName === 'email') return await callEmail(args);
  return undefined;
}
`.trim()
