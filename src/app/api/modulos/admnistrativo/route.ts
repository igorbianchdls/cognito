import { NextRequest } from 'next/server'

export const maxDuration = 60
export const dynamic = 'force-dynamic'
export const revalidate = 0

const toDate = (v?: string | null) => (v ? new Date(v) : undefined)

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const view = (searchParams.get('view') || '').toLowerCase()
    if (!view) {
      return Response.json({ success: false, message: 'Parâmetro view é obrigatório' }, { status: 400 })
    }

    const de = toDate(searchParams.get('de'))
    const ate = toDate(searchParams.get('ate'))

    const page = Math.max(1, Number(searchParams.get('page') || 1))
    const pageSize = Math.max(1, Math.min(1000, Number(searchParams.get('pageSize') || 50)))
    const offset = (page - 1) * pageSize

    // Mock datasets por view
    const now = new Date()
    const addDays = (d: number) => new Date(now.getTime() + d * 86400000)

    let rows: Record<string, unknown>[] = []
    let dateKey: string | undefined

    if (view === 'despesas') {
      dateKey = 'data'
      rows = [
        { data: addDays(-2), fornecedor: 'Fornecedor A', categoria: 'Serviços', valor: 1500.5, status: 'Pendente' },
        { data: addDays(-6), fornecedor: 'Fornecedor B', categoria: 'Materiais', valor: 780.0, status: 'Pago' },
        { data: addDays(-10), fornecedor: 'Fornecedor C', categoria: 'Transporte', valor: 320.75, status: 'Atrasado' },
      ]
    } else if (view === 'contratos') {
      dateKey = 'inicio'
      rows = [
        { numero: 'CT-2025-001', parte: 'Fornecedor A', inicio: addDays(-30), fim: addDays(335), valor: 50000, status: 'Vigente' },
        { numero: 'CT-2025-002', parte: 'Cliente X', inicio: addDays(-90), fim: addDays(5), valor: 120000, status: 'Vencendo' },
        { numero: 'CT-2024-010', parte: 'Fornecedor B', inicio: addDays(-360), fim: addDays(-5), valor: 30000, status: 'Encerrado' },
      ]
    } else if (view === 'reembolsos') {
      dateKey = 'data'
      rows = [
        { data: addDays(-1), colaborador: 'Ana Lima', descricao: 'Táxi – reunião', valor: 45.8, status: 'Aprovado' },
        { data: addDays(-4), colaborador: 'Carlos Souza', descricao: 'Almoço – cliente', valor: 89.5, status: 'Em análise' },
        { data: addDays(-7), colaborador: 'Beatriz Reis', descricao: 'Estacionamento', valor: 25.0, status: 'Rejeitado' },
      ]
    } else if (view === 'obrigacoes-legais') {
      dateKey = 'vencimento'
      rows = [
        { tipo: 'Alvará', descricao: 'Renovação alvará municipal', vencimento: addDays(20), responsavel: 'Depto. Jurídico', status: 'Pendente' },
        { tipo: 'Certidão', descricao: 'Certidão negativa federal', vencimento: addDays(5), responsavel: 'Financeiro', status: 'Pendente' },
        { tipo: 'LGPD', descricao: 'Revisão de políticas', vencimento: addDays(60), responsavel: 'DPO', status: 'Em andamento' },
      ]
    } else if (view === 'documentos') {
      dateKey = 'criado_em'
      rows = [
        { nome: 'Contrato Prestação Serviço.pdf', tipo: 'PDF', criado_em: addDays(-12), status: 'Assinado' },
        { nome: 'Política Privacidade.docx', tipo: 'DOCX', criado_em: addDays(-40), status: 'Em revisão' },
        { nome: 'Procuração.png', tipo: 'Imagem', criado_em: addDays(-2), status: 'Válido' },
      ]
    } else {
      return Response.json({ success: false, message: `View inválida: ${view}` }, { status: 400 })
    }

    // Filtro por período (se aplicável)
    if (dateKey && (de || ate)) {
      rows = rows.filter((r) => {
        const dv = r[dateKey!]
        if (!dv) return true
        const d = new Date(String(dv))
        if (Number.isNaN(d.getTime())) return true
        if (de && d < de) return false
        if (ate && d > ate) return false
        return true
      })
    }

    const total = rows.length
    const sliced = rows.slice(offset, offset + pageSize)

    return Response.json({
      success: true,
      view,
      page,
      pageSize,
      total,
      rows: sliced,
      sql: 'mock: admnistrativo',
      params: JSON.stringify([]),
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('📊 API /api/modulos/admnistrativo error:', error)
    return Response.json(
      { success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 },
    )
  }
}

