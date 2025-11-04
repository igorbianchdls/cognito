import { NextRequest } from 'next/server'
import { consultarRegra, criarContaAPagar, contabilizarContaAPagar, criarEContabilizarContaAPagar, type Origem } from './service'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 300

type Acao =
  | 'consultar_regra'
  | 'criar_conta_a_pagar'
  | 'contabilizar_conta_a_pagar'
  | 'criar_e_contabilizar_conta_a_pagar'

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>
    const acao = String(body['acao'] || '') as Acao

    if (!acao) {
      return Response.json({ success: false, message: 'Informe "acao"' }, { status: 400 })
    }

    switch (acao) {
      case 'consultar_regra': {
        const tenant_id = body['tenant_id']
        const categoria_id = body['categoria_id']
        const origem = (body['origem'] as Origem) || 'conta_a_pagar'
        if (tenant_id === undefined || categoria_id === undefined) {
          return Response.json({ success: false, message: 'tenant_id e categoria_id são obrigatórios' }, { status: 400 })
        }
        const { regra, sql, params } = await consultarRegra(tenant_id as number | string, origem, categoria_id as number | string)
        if (!regra) return Response.json({ success: false, message: 'Nenhuma regra contábil ativa encontrada.' }, { status: 404 })
        return Response.json({ success: true, data: { regra, sql, params } })
      }

      case 'criar_conta_a_pagar': {
        const tenant_id = Number(body['tenant_id'])
        const categoria_id = Number(body['categoria_id'])
        const valor = Number(body['valor'])
        if (!Number.isFinite(tenant_id) || !Number.isFinite(categoria_id) || !Number.isFinite(valor)) {
          return Response.json({ success: false, message: 'tenant_id, categoria_id e valor são obrigatórios e numéricos' }, { status: 400 })
        }
        const out = await criarContaAPagar({
          tenant_id,
          categoria_id,
          valor,
          descricao: (body['descricao'] as string) || '',
          data_lancamento: (body['data_lancamento'] as string) || undefined,
          data_vencimento: (body['data_vencimento'] as string) || undefined,
          entidade_id: body['entidade_id'] !== undefined ? Number(body['entidade_id']) : undefined,
          conta_financeira_id: body['conta_financeira_id'] !== undefined ? Number(body['conta_financeira_id']) : undefined,
        })
        return Response.json({ success: true, data: out })
      }

      case 'contabilizar_conta_a_pagar': {
        const lfIdRaw = body['lancamento_financeiro_id']
        const lfId = Number(lfIdRaw)
        if (!Number.isFinite(lfId)) return Response.json({ success: false, message: 'lancamento_financeiro_id é obrigatório e numérico' }, { status: 400 })
        const out = await contabilizarContaAPagar(lfId)
        return Response.json({ success: true, data: out })
      }

      case 'criar_e_contabilizar_conta_a_pagar': {
        const tenant_id = Number(body['tenant_id'])
        const categoria_id = Number(body['categoria_id'])
        const valor = Number(body['valor'])
        if (!Number.isFinite(tenant_id) || !Number.isFinite(categoria_id) || !Number.isFinite(valor)) {
          return Response.json({ success: false, message: 'tenant_id, categoria_id e valor são obrigatórios e numéricos' }, { status: 400 })
        }
        const out = await criarEContabilizarContaAPagar({
          tenant_id,
          categoria_id,
          valor,
          descricao: (body['descricao'] as string) || '',
          data_lancamento: (body['data_lancamento'] as string) || undefined,
          data_vencimento: (body['data_vencimento'] as string) || undefined,
          entidade_id: body['entidade_id'] !== undefined ? Number(body['entidade_id']) : undefined,
          conta_financeira_id: body['conta_financeira_id'] !== undefined ? Number(body['conta_financeira_id']) : undefined,
        })
        return Response.json({ success: true, data: out })
      }

      default:
        return Response.json({ success: false, message: `Ação não suportada: ${acao}` }, { status: 400 })
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Erro desconhecido'
    // Nota: manter status 500 genérico aqui. Casos de 4xx/404 são tratados nos branches acima
    return Response.json({ success: false, message }, { status: 500 })
  }
}

