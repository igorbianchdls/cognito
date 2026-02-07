export function toEmailErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  const status = /key|auth/i.test(message) ? 401 : 500
  return Response.json({ ok: false, error: message }, { status })
}
