// Ponte HTTP das rotas do Editor: pessoa e empresa ativa do Clerk (ou a pessoa fixa dos testes de tela, nunca em
// produção) e respostas em JSON.
import { auth } from '@clerk/nextjs/server'

export type Contexto = { userId: string; orgId: string }
export const json = (status: number, body: unknown) => Response.json(body, { status, headers: { 'cache-control': 'private, no-store' } })

export async function contexto(): Promise<Contexto | Response> {
  const teste = process.env.NODE_ENV !== 'production' ? process.env.NOTAS_TESTE_USUARIO : undefined
  if (teste) { const [userId, orgId] = teste.split(':'); if (userId && orgId) return { userId, orgId } }
  const { userId, orgId } = await auth()
  if (!userId) return json(401, { erro: 'Entre para usar o editor.' })
  if (!orgId) return json(403, { erro: 'Escolha uma empresa para usar o editor.' })
  return { userId, orgId }
}

export class EditorError extends Error {
  constructor(message: string, readonly status = 400) { super(message) }
}

export async function responder(codigo: string, acao: () => Promise<unknown>) {
  try {
    return json(200, await acao())
  } catch (error) {
    if (error instanceof EditorError) return json(error.status, { erro: error.message })
    console.error(JSON.stringify({ scope: 'editor', code: codigo, message: (error as Error).message }))
    return json(500, { erro: 'Não foi possível concluir. Tente de novo em instantes.' })
  }
}
