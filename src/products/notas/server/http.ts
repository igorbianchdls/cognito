// Ponte HTTP das rotas de Notas: pessoa e empresa ativa do Clerk, respostas em JSON e erros com mensagem.
import { auth } from '@clerk/nextjs/server'
import { NotasError, type Contexto } from './db'

export const json = (status: number, body: unknown) => Response.json(body, { status, headers: { 'cache-control': 'private, no-store' } })
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function contexto(): Promise<Contexto | Response> {
  const { userId, orgId } = await auth()
  if (!userId) return json(401, { erro: 'Entre para ver as notas.' })
  if (!orgId) return json(403, { erro: 'Escolha uma empresa para ver as notas.' })
  return { userId, orgId }
}

/** Roda a ação e responde; NotasError vira a mensagem dela, o resto vira erro genérico (e vai para o log). */
export async function responder(codigo: string, acao: () => Promise<unknown>, status = 200) {
  try {
    return json(status, await acao() ?? { ok: true })
  } catch (error) {
    if (error instanceof NotasError) return json(error.status, { erro: error.message, atual: error.dados })
    console.error(JSON.stringify({ scope: 'notas', code: codigo, message: (error as Error).message }))
    return json(500, { erro: 'Não foi possível concluir. Tente de novo em instantes.' })
  }
}

export async function corpo<T>(request: Request): Promise<T | null> {
  return await request.json().catch(() => null) as T | null
}
