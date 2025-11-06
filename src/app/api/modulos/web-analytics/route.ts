import { NextRequest } from 'next/server'
import { runQuery } from '@/lib/postgres'

export const maxDuration = 300
export const dynamic = 'force-dynamic'
export const revalidate = 0

const parseIntParam = (v: string | null, fb: number) => {
  const n = v ? Number(v) : fb
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : fb
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const view = (searchParams.get('view') || '').toLowerCase()
    if (!view) return Response.json({ success: false, message: 'Parâmetro view é obrigatório' }, { status: 400 })

    const days = parseIntParam(searchParams.get('days'), 30)

    if (view === 'overview') {
      const sql = `
        WITH sessoes_filtradas AS (
          SELECT
            id,
            id_visitante,
            (timestamp_inicio_sessao)::date AS dia,
            timestamp_inicio_sessao,
            timestamp_fim_sessao
          FROM gestaoanalytics.sessoes
          WHERE (timestamp_inicio_sessao)::date >= CURRENT_DATE - ($1::int - 1)
            AND (eh_bot IS DISTINCT FROM TRUE)
        ),
        pageviews_por_sessao AS (
          SELECT e.id_sessao,
                 COUNT(*) FILTER (
                   WHERE LOWER(COALESCE(e.nome_evento, '')) = 'page_view'
                      OR LOWER(COALESCE(e.tipo_evento, '')) = 'page_view'
                 ) AS pageviews
          FROM gestaoanalytics.eventos e
          WHERE (e.timestamp_evento)::date >= CURRENT_DATE - ($1::int - 1)
          GROUP BY e.id_sessao
        ),
        duracoes AS (
          SELECT s.id,
                 EXTRACT(EPOCH FROM (s.timestamp_fim_sessao - s.timestamp_inicio_sessao)) AS duracao_seg
          FROM gestaoanalytics.sessoes s
          WHERE (s.timestamp_inicio_sessao)::date >= CURRENT_DATE - ($1::int - 1)
        ),
        convs AS (
          SELECT t.id, t.id_sessao
          FROM gestaoanalytics.transacoes t
          WHERE (t.timestamp_transacao)::date >= CURRENT_DATE - ($1::int - 1)
        )
        SELECT sf.dia,
               COUNT(*) AS sessoes,
               COUNT(DISTINCT sf.id_visitante) AS usuarios,
               COALESCE(SUM(COALESCE(pv.pageviews, 0)), 0) AS pageviews,
               ROUND(AVG(NULLIF(d.duracao_seg, 0))::numeric, 2) AS avg_duration_seconds,
               COUNT(DISTINCT convs.id) AS conversoes
        FROM sessoes_filtradas sf
        LEFT JOIN pageviews_por_sessao pv ON pv.id_sessao = sf.id
        LEFT JOIN duracoes d ON d.id = sf.id
        LEFT JOIN convs ON convs.id_sessao = sf.id
        GROUP BY sf.dia
        ORDER BY sf.dia
      `
      const rows = await runQuery<{
        dia: string
        sessoes: string | number | null
        usuarios: string | number | null
        pageviews: string | number | null
        avg_duration_seconds: string | number | null
        conversoes: string | number | null
      }>(sql, [days])

      const totalSessions = rows.reduce((a, r) => a + Number(r.sessoes ?? 0), 0)
      const totalUsers = rows.reduce((a, r) => a + Number(r.usuarios ?? 0), 0)
      const totalConv = rows.reduce((a, r) => a + Number(r.conversoes ?? 0), 0)
      const avgDuration = (() => {
        const vals = rows.map(r => Number(r.avg_duration_seconds ?? 0)).filter(v => Number.isFinite(v) && v > 0)
        if (!vals.length) return 0
        return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)
      })()
      const convRate = totalSessions > 0 ? (totalConv / totalSessions) * 100 : 0

      return Response.json({
        success: true,
        view,
        days,
        series: rows.map(r => ({
          date: r.dia,
          sessions: Number(r.sessoes ?? 0),
          users: Number(r.usuarios ?? 0),
          pageviews: Number(r.pageviews ?? 0),
          avg_duration_seconds: Number(r.avg_duration_seconds ?? 0),
          conversions: Number(r.conversoes ?? 0),
        })),
        kpis: {
          sessions: totalSessions,
          users: totalUsers,
          conversion_rate: convRate,
          avg_duration_seconds: avgDuration,
        },
      })
    }

    if (view === 'sources') {
      const sql = `
        WITH sessoes_filtradas AS (
          SELECT id, COALESCE(NULLIF(utm_source, ''), 'Direto') AS fonte
          FROM gestaoanalytics.sessoes
          WHERE (timestamp_inicio_sessao)::date >= CURRENT_DATE - ($1::int - 1)
            AND (eh_bot IS DISTINCT FROM TRUE)
        ),
        pv AS (
          SELECT e.id_sessao,
                 COUNT(*) FILTER (
                   WHERE LOWER(COALESCE(e.nome_evento, '')) = 'page_view'
                      OR LOWER(COALESCE(e.tipo_evento, '')) = 'page_view'
                 ) AS pageviews
          FROM gestaoanalytics.eventos e
          WHERE (e.timestamp_evento)::date >= CURRENT_DATE - ($1::int - 1)
          GROUP BY e.id_sessao
        ),
        tx AS (
          SELECT id, id_sessao
          FROM gestaoanalytics.transacoes
          WHERE (timestamp_transacao)::date >= CURRENT_DATE - ($1::int - 1)
        )
        SELECT s.fonte,
               COUNT(*) AS sessoes,
               SUM(COALESCE(pv.pageviews, 0)) AS pageviews,
               COUNT(DISTINCT tx.id) AS conversoes
        FROM sessoes_filtradas s
        LEFT JOIN pv ON pv.id_sessao = s.id
        LEFT JOIN tx ON tx.id_sessao = s.id
        GROUP BY s.fonte
        ORDER BY COUNT(*) DESC
      `
      const rows = await runQuery<{ fonte: string | null; sessoes: string | number | null; pageviews: string | number | null; conversoes: string | number | null }>(sql, [days])
      const totalSessions = rows.reduce((a, r) => a + Number(r.sessoes ?? 0), 0)
      const data = rows.map(r => {
        const sessions = Number(r.sessoes ?? 0)
        const pageviews = Number(r.pageviews ?? 0)
        const conversions = Number(r.conversoes ?? 0)
        const pagesPerSession = sessions > 0 ? pageviews / sessions : 0
        const conversionRate = sessions > 0 ? (conversions / sessions) * 100 : 0
        return {
          source: r.fonte ?? 'desconhecida',
          sessions,
          sessions_share: totalSessions > 0 ? (sessions / totalSessions) * 100 : 0,
          pages_per_session: pagesPerSession,
          conversion_rate: conversionRate,
          conversions,
        }
      })
      return Response.json({ success: true, view, days, sources: data })
    }

    if (view === 'top-pages') {
      const sql = `
        SELECT COALESCE(NULLIF(url_pagina, ''), '/') AS url,
               COUNT(*) FILTER (
                 WHERE LOWER(COALESCE(nome_evento, '')) = 'page_view'
                    OR LOWER(COALESCE(tipo_evento, '')) = 'page_view'
               ) AS pageviews
        FROM gestaoanalytics.eventos
        WHERE (timestamp_evento)::date >= CURRENT_DATE - ($1::int - 1)
        GROUP BY COALESCE(NULLIF(url_pagina, ''), '/')
        ORDER BY pageviews DESC
        LIMIT 20
      `
      const rows = await runQuery<{ url: string; pageviews: string | number | null }>(sql, [days])
      const total = rows.reduce((a, r) => a + Number(r.pageviews ?? 0), 0)
      return Response.json({ success: true, view, days, pages: rows.map(r => ({ url: r.url, pageviews: Number(r.pageviews ?? 0), share: total > 0 ? (Number(r.pageviews ?? 0) / total) * 100 : 0 })) })
    }

    if (view === 'recent-conversions') {
      const sql = `
        SELECT id,
               id_visitante,
               id_sessao,
               valor_transacao,
               timestamp_transacao
        FROM gestaoanalytics.transacoes
        WHERE (timestamp_transacao)::date >= CURRENT_DATE - ($1::int - 1)
        ORDER BY timestamp_transacao DESC
        LIMIT 10
      `
      const rows = await runQuery<{ id: string | number; id_visitante: string | null; id_sessao: string | null; valor_transacao: string | number | null; timestamp_transacao: string }>(sql, [days])
      return Response.json({ success: true, view, days, conversions: rows.map(r => ({ id: String(r.id), visitor: r.id_visitante, session: r.id_sessao, value: Number(r.valor_transacao ?? 0), timestamp: r.timestamp_transacao })) })
    }

    return Response.json({ success: false, message: `View inválida: ${view}` }, { status: 400 })
  } catch (error) {
    console.error('📈 API /api/modulos/web-analytics error:', error)
    return Response.json({ success: false, message: 'Erro interno', error: error instanceof Error ? error.message : 'Erro desconhecido' }, { status: 500 })
  }
}

