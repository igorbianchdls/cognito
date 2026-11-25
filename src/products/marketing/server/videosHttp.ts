// Ponte HTTP das rotas de Vídeos: autenticação (Clerk, empresa ativa), respostas em JSON e erros com mensagem.
import { auth } from '@clerk/nextjs/server'
import { VideoError, type Contexto } from './videos'

export const respostaJson = (status: number, body: object) => Response.json(body, { status, headers: { 'cache-control': 'private, no-store' } })
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Contexto da pessoa na empresa ativa, ou a resposta de recusa. */
export async function contexto(request: Request): Promise<Contexto | Response> {
  const { userId, orgId } = await auth()
  if (!userId) return respostaJson(401, { erro: 'Entre para ver os vídeos.' })
  if (!orgId) return respostaJson(403, { erro: 'Escolha uma empresa para ver os vídeos.' })
  return { userId, orgId, origem: new URL(request.url).origin }
}

export function falha(error: unknown, codigo: string) {
  if (error instanceof VideoError) return respostaJson(error.status, { erro: error.message })
  console.error(JSON.stringify({ scope: 'marketing', code: codigo, message: (error as Error).message }))
  return respostaJson(500, { erro: 'Não foi possível concluir. Tente de novo em instantes.' })
}
