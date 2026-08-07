export function legacyAiDisabledResponse() {
  if (process.env.ENABLE_LEGACY_AI_ENDPOINTS === 'true') return null
  return Response.json({
    ok: false,
    code: 'LEGACY_AI_ENDPOINT_DISABLED',
    error: 'Esta integracao foi substituida pelo endpoint /api/ai/mcp.',
  }, { status: 410 })
}
