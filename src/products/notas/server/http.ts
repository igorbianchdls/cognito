// Ponte HTTP das rotas de Notas: pessoa e empresa ativa do Clerk, respostas em JSON e erros com mensagem.
import { auth } from '@clerk/nextjs/server'
import { NotasError, type Contexto } from './db'

export const json = (status: number, body: unknown) => Response.json(body, { status, headers: { 'cache-control': 'private, no-store' } })
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Pessoa fixa dos testes de tela ("usuario:empresa"), nunca em produção. */
export function pessoaDeTeste(): Contexto | null {
  const teste = process.env.NODE_ENV !== 'production' ? process.env.NOTAS_TESTE_USUARIO : undefined
  if (!teste) return null
  const [userId, orgId] = teste.split(':')
  return userId && orgId ? { userId, orgId } : null
}

export async function contexto(): Promise<Contexto | Response> {
  const teste = pessoaDeTeste()
  if (teste) return teste
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
    // Banco ainda sem as tabelas das Notas (migração não aplicada): a tela mostra "em preparação" em vez de erro.
    if (['42P01', '3F000'].includes((error as { code?: string }).code ?? '')) return json(503, { erro: 'As Notas estão em preparação. Volte em breve.', preparacao: true })
    console.error(JSON.stringify({ scope: 'notas', code: codigo, message: (error as Error).message }))
    return json(500, { erro: 'Não foi possível concluir. Tente de novo em instantes.' })
  }
}

export async function corpo<T>(request: Request): Promise<T | null> {
  return await request.json().catch(() => null) as T | null
}
