import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Whitelist para ordenação segura por view
const ORDER_BY_WHITELIST: Record<string, Record<string, string>> = {
  dados: {
    id: 'e.id',
    razao_social: 'e.razao_social',
    nome_fantasia: 'e.nome_fantasia',
    cnpj: 'e.cnpj',
    inscricao_estadual: 'e.inscricao_estadual',
    regime_tributario: 'e.regime_tributario',
    cidade: 'e.cidade',
    estado: 'e.estado',
    pais: 'e.pais',
    ativo: 'e.ativo',
  },
  filiais: {
    id: 'f.id',
    codigo: 'f.codigo',
    nome: 'f.nome',
    cnpj: 'f.cnpj',
    inscricao_estadual: 'f.inscricao_estadual',
    cidade: 'f.cidade',
    estado: 'f.estado',
    pais: 'f.pais',
    matriz: 'f.matriz',
    ativo: 'f.ativo',
  },
  departamentos: {
    id: 'd.id',
    codigo: 'd.codigo',
    nome: 'd.nome',
    responsavel: 'd.responsavel',
    ativo: 'd.ativo',
  },
  cargos: {
    id: 'c.id',
    departamento_id: 'c.departamento_id',
    codigo: 'c.codigo',
    nome: 'c.nome',
    nivel: 'c.nivel',
    ativo: 'c.ativo',
  },
  funcionarios: {
    funcionario: 'f.nome',
    email: 'f.email',
    telefone: 'f.telefone',
    cargo: 'c.nome',
    departamento: 'd.nome',
    filial: 'fi.nome',
    criado_em: 'f.criado_em',
  },
  vendedores: {
    vendedor: 'f.nome',
    email: 'f.email',
    telefone: 'f.telefone',
    territorio: 't.nome',
    comissao: 'v.comissao_padrao',
    vendedor_ativo: 'v.ativo',
    criado_em: 'v.criado_em',
  },
  territorios: {
    territorio: 't.nome',
    descricao: 't.descricao',
    territorio_pai: 'tp.nome',
    ativo: 't.ativo',
    criado_em: 't.criado_em',
  },
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const view = (searchParams.get('view') || '').toLowerCase()
    if (!view) return Response.json({ success: false, message: 'Parâmetro view é obrigatório' }, { status: 400 })

    // Paginação simples (opcional)
    const page = Math.max(1, Number(searchParams.get('page') || 1))
    const pageSize = Math.max(1, Math.min(1000, Number(searchParams.get('pageSize') || 20)))
    const offset = (page - 1) * pageSize

    // Ordenação segura
    const orderByParam = (searchParams.get('order_by') || '').toLowerCase()
    const orderDirParam = (searchParams.get('order_dir') || 'asc').toLowerCase()
    const whitelist = ORDER_BY_WHITELIST[view] || {}
    const orderBy = whitelist[orderByParam]
    const orderDir = orderDirParam === 'desc' ? 'DESC' : 'ASC'

    let selectSql = ''
    let baseSql = ''
    let orderClause = ''

    if (view === 'dados') {
      selectSql = `SELECT
        e.id,
        e.tenant_id,
        e.razao_social,
        e.nome_fantasia,
        e.cnpj,
        e.inscricao_estadual,
        e.regime_tributario,
        e.endereco,
        e.cidade,
        e.estado,
        e.pais,
        e.ativo`
      baseSql = 'FROM empresa.empresas e'
      orderClause = orderBy ? `ORDER BY ${orderBy} ${orderDir}` : 'ORDER BY e.razao_social ASC'
    } else if (view === 'filiais') {
      selectSql = `SELECT
        f.id,
        f.empresa_id,
        f.codigo,
        f.nome,
        f.cnpj,
        f.inscricao_estadual,
        f.endereco,
        f.cidade,
        f.estado,
        f.pais,
        f.matriz,
        f.ativo`
      baseSql = 'FROM empresa.filiais f'
      orderClause = orderBy ? `ORDER BY ${orderBy} ${orderDir}` : 'ORDER BY f.matriz DESC, f.nome ASC'
    } else if (view === 'departamentos') {
      selectSql = `SELECT
        d.id,
        d.empresa_id,
        d.codigo,
        d.nome,
        d.responsavel,
        d.ativo`
      baseSql = 'FROM empresa.departamentos d'
      orderClause = orderBy ? `ORDER BY ${orderBy} ${orderDir}` : 'ORDER BY d.codigo ASC'
    } else if (view === 'cargos') {
      selectSql = `SELECT
        c.id,
        c.empresa_id,
        c.departamento_id,
        c.codigo,
        c.nome,
        c.nivel,
        c.descricao,
        c.ativo`
      baseSql = 'FROM empresa.cargos c'
      orderClause = orderBy ? `ORDER BY ${orderBy} ${orderDir}` : 'ORDER BY c.departamento_id ASC, c.nivel ASC'
    } else if (view === 'funcionarios') {
      selectSql = `SELECT
        f.nome AS funcionario,
        f.email,
        f.telefone,
        c.nome AS cargo,
        d.nome AS departamento,
        fi.nome AS filial,
        f.criado_em,
        f.atualizado_em`
      baseSql = `FROM empresa.funcionarios f
        LEFT JOIN empresa.cargos c        ON c.id = f.cargo_id
        LEFT JOIN empresa.departamentos d ON d.id = f.departamento_id
        LEFT JOIN empresa.filiais fi      ON fi.id = f.filial_id`
      orderClause = orderBy ? `ORDER BY ${orderBy} ${orderDir}` : 'ORDER BY f.nome ASC'
    } else if (view === 'vendedores') {
      selectSql = `SELECT
        f.nome AS vendedor,
        f.email AS email,
        f.telefone AS telefone,
        t.nome AS territorio,
        t.descricao AS territorio_descricao,
        v.comissao_padrao AS comissao,
        v.ativo AS vendedor_ativo,
        v.criado_em`
      baseSql = `FROM empresa.vendedores v
        LEFT JOIN empresa.funcionarios f ON f.id = v.funcionario_id
        LEFT JOIN empresa.territorios t  ON t.id = v.territorio_id`
      orderClause = orderBy ? `ORDER BY ${orderBy} ${orderDir}` : 'ORDER BY f.nome ASC'
    } else if (view === 'territorios') {
      selectSql = `SELECT
        t.nome AS territorio,
        t.descricao,
        tp.nome AS territorio_pai,
        t.ativo,
        t.criado_em`
      baseSql = `FROM empresa.territorios t
        LEFT JOIN empresa.territorios tp ON tp.id = t.territorio_pai_id`
      orderClause = orderBy ? `ORDER BY ${orderBy} ${orderDir}` : 'ORDER BY t.nome ASC'
    } else {
      return Response.json({ success: false, message: `View inválida: ${view}` }, { status: 400 })
    }

    const listSql = `${selectSql} ${baseSql} ${orderClause} LIMIT $1::int OFFSET $2::int`.trim()
    const rows = await runQuery<Record<string, unknown>>(listSql, [pageSize, offset])

    // Total simples (sem filtros)
    const totalSql = `SELECT COUNT(*)::int AS total ${baseSql}`
    const totalRows = await runQuery<{ total: number }>(totalSql)
    const total = totalRows[0]?.total ?? 0

    return Response.json({
      success: true,
      view,
      page,
      pageSize,
      total,
      rows,
      sql: listSql,
      params: JSON.stringify([pageSize, offset]),
    }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('🏢 API /api/modulos/empresa error:', error)
    return Response.json(
      { success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 500 }
    )
  }
}

