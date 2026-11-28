// Ponte HTTP das rotas do Analytics: pessoa e empresa ativa do Clerk (ou a pessoa fixa dos testes de tela, nunca em
// produção), respostas em JSON e erros com mensagem para a tela.
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { AnalyticsError, comoPessoa, type Contexto, type Db } from './pg'
import { propriedadeVisivel } from './motor'

export const json = (status: number, body: unknown) => Response.json(body, { status, headers: { 'cache-control': 'private, no-store' } })

export async function contexto(): Promise<Contexto | Response> {
  const teste = process.env.NODE_ENV !== 'production' ? process.env.NOTAS_TESTE_USUARIO : undefined
  if (teste) { const [userId, orgId] = teste.split(':'); if (userId && orgId) return { userId, orgId } }
  const { userId, orgId } = await auth()
  if (!userId) return json(401, { erro: 'Entre para ver o Analytics.' })
  if (!orgId) return json(403, { erro: 'Escolha uma empresa para ver o Analytics.' })
  return { userId, orgId }
}

/** Roda como a pessoa e responde; erros conhecidos viram mensagem, o resto vai para o log. */
export async function responder(codigo: string, ctx: Contexto, acao: (db: Db) => Promise<unknown>) {
  try {
    return json(200, await comoPessoa(ctx, acao))
  } catch (error) {
    if (error instanceof AnalyticsError) return json(error.status, { erro: error.message })
    if (error instanceof z.ZodError) return json(400, { erro: 'Dados inválidos: ' + error.issues.slice(0, 4).map(i => `${i.path.join('.') || 'corpo'} (${i.message})`).join('; ') })
    const code = (error as { code?: string }).code
    if (code === '42501') return json(403, { erro: 'Seu perfil nesta empresa só pode visualizar.' })
    if (code === '23505') return json(409, { erro: 'Já existe um item com esse nome ou chave.' })
    if (code === '57014') return json(504, { erro: 'A consulta demorou demais. Diminua o período ou os filtros.' })
    if (code === '23514' || code === '22P02' || code === '23503') return json(400, { erro: 'Os dados não combinam com o que é aceito.' })
    if (['42P01', '3F000'].includes(code ?? '')) return json(503, { erro: 'O Analytics está em preparação. Volte em breve.' })
    console.error(JSON.stringify({ scope: 'analytics', code: codigo, message: (error as Error).message?.slice(0, 300) }))
    return json(500, { erro: 'Não foi possível concluir. Tente de novo em instantes.' })
  }
}

/** Contexto + propriedade visível: o padrão das rotas de leitura. */
export async function comPropriedade(codigo: string, propriedade: string | null, acao: (db: Db, propertyId: string, ctx: Contexto) => Promise<unknown>) {
  const ctx = await contexto()
  if (ctx instanceof Response) return ctx
  return responder(codigo, ctx, async db => { const p = await propriedadeVisivel(db, propriedade ?? ''); return acao(db, p.id, ctx) })
}
