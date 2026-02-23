export const CODEX_APP_TOOL_DISPATCH_SCRIPT = `
async function callKnownAppToolByName(toolName, parsedArgs) {
  const args = parsedArgs && typeof parsedArgs === 'object' ? parsedArgs : {};
  if (toolName === 'crud') return await callCrud(args);
  if (toolName === 'documento') return await callDocumento(args);
  if (toolName === 'drive') return await callDrive(args);
  if (toolName === 'email') return await callEmail(args);
  return undefined;
}
`.trim()

