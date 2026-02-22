import type { RouteContextLike, RouteParamsLike, JsonObject } from '@/products/email/backend/features/messages/types'

export async function readJsonObject(req: Request): Promise<JsonObject> {
  const body = await req.json().catch(() => ({}))
  if (!body || typeof body !== 'object' || Array.isArray(body)) return {}
  return body as JsonObject
}

export async function resolveRouteParams(context: RouteContextLike): Promise<RouteParamsLike> {
  const maybeParams = context?.params
  if (maybeParams && typeof (maybeParams as Promise<RouteParamsLike>).then === 'function') {
    return await (maybeParams as Promise<RouteParamsLike>)
  }
  return maybeParams as RouteParamsLike
}

export async function getRequiredRouteId(context: RouteContextLike): Promise<string> {
  const params = await resolveRouteParams(context)
  return String(params?.id || '').trim()
}
