'use client'

import React from 'react'

type MarkerProps = {
  children?: React.ReactNode
  id?: string
  name?: string
  title?: string
}

type QueryMarkerProps = MarkerProps & {
  comparisonMode?: 'previous_period' | 'previous_month' | 'previous_year'
  dataQuery?: Record<string, unknown>
  format?: 'currency' | 'number' | 'percent'
  resultPath?: string
  valueKey?: string
}

type ChartMarkerProps = {
  colorScheme?: string[]
  dataQuery?: Record<string, unknown>
  format?: 'currency' | 'number' | 'percent'
  height?: number
  interaction?: Record<string, unknown>
  recharts?: Record<string, unknown>
  style?: React.CSSProperties
  title?: string
  type?: 'bar' | 'line' | 'pie'
}

type TableMarkerProps = {
  bordered?: boolean
  columns?: Array<Record<string, unknown>>
  dataQuery?: Record<string, unknown>
  enableExportCsv?: boolean
  height?: number
  rounded?: boolean
  stickyHeader?: boolean
}

type PivotTableMarkerProps = {
  bordered?: boolean
  columns?: Array<Record<string, unknown>>
  dataQuery?: Record<string, unknown>
  defaultExpandedLevels?: number
  enableExportCsv?: boolean
  height?: number
  rounded?: boolean
  rows?: Array<Record<string, unknown>>
  stickyHeader?: boolean
  values?: Array<Record<string, unknown>>
}

function ReportTemplateMarker({ children }: MarkerProps) {
  return <>{children}</>
}

function ThemeMarker(_: MarkerProps) {
  return null
}

function ReportMarker({ children }: MarkerProps) {
  return <>{children}</>
}

function QueryMarker({ children }: QueryMarkerProps) {
  return <>{children}</>
}

function ChartMarker(_: ChartMarkerProps) {
  return null
}

function TableMarker(_: TableMarkerProps) {
  return null
}

function PivotTableMarker(_: PivotTableMarkerProps) {
  return null
}

ReportTemplateMarker.displayName = 'ReportTemplate'
ThemeMarker.displayName = 'Theme'
ReportMarker.displayName = 'Report'
QueryMarker.displayName = 'Query'
ChartMarker.displayName = 'Chart'
TableMarker.displayName = 'Table'
PivotTableMarker.displayName = 'PivotTable'

export const REPORT_TEMPLATE_SOURCE = String.raw`<ReportTemplate name="pigment_style_report" title="Revenue Analysis Brief">
  <Theme name="light" />

  <Report id="cover" title="Cover">
    <section style={{ height: '100%', padding: 18, background: 'radial-gradient(circle at top left, rgba(114,225,255,0.45), transparent 26%), radial-gradient(circle at bottom right, rgba(255,154,211,0.42), transparent 30%), linear-gradient(180deg, #F7FBFF 0%, #FFF8FC 100%)' }}>
      <article style={{ height: '100%', borderRadius: 22, overflow: 'hidden', backgroundColor: '#FFFFFF', border: '1px solid #E7EDF6', boxShadow: '0 10px 30px rgba(34, 47, 78, 0.08)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 12, background: 'linear-gradient(90deg, #9FE8F5 0%, #DDB6FF 50%, #FFBDD6 100%)' }} />
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #EEF2F7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 16, height: 16, borderRadius: 999, backgroundColor: '#E6ECF7', border: '1px solid #D7DEEB' }} />
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#394459' }}>Last Quarter Revenue Analysis</p>
          </div>
          <p style={{ margin: 0, fontSize: 12, color: '#8D98AA' }}>04/04/2026 • 9:41 AM</p>
        </div>
        <div style={{ flex: 1, padding: '34px 38px', display: 'grid', gridTemplateColumns: '1.08fr 0.92fr', gap: 28 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, color: '#8691A5', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Executive brief</p>
              <h1 data-ui="title" style={{ margin: 0, fontSize: 36, lineHeight: 1.02, letterSpacing: '-0.05em', color: '#263145' }}>Last Quarter Revenue Analysis</h1>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.72, color: '#556074', maxWidth: 440 }}>
                This report reframes dashboard output into a compact narrative. The numbers stay query-driven, but the reading experience is closer to an executive memo than to an analytical app.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              <Query dataQuery={{ query: 'SELECT COALESCE(SUM(p.valor_total), 0)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}}', limit: 1 }} format="currency" comparisonMode="previous_period">
                <article data-ui="card" style={{ padding: 16, borderRadius: 18, backgroundColor: '#FAFCFF', border: '1px solid #E6ECF5' }}>
                  <p data-ui="kpi-title" style={{ margin: 0, fontSize: 10, color: '#8A95A8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Revenue</p>
                  <h2 data-ui="kpi-value" style={{ margin: '12px 0 6px 0', fontSize: 26, color: '#1F2C43', letterSpacing: '-0.05em' }}>{'{{query.valueFormatted}}'}</h2>
                  <p style={{ margin: 0, fontSize: 12, color: '#617089' }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
                </article>
              </Query>
              <Query dataQuery={{ query: 'SELECT COUNT(*)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}}', limit: 1 }} format="number" comparisonMode="previous_period">
                <article data-ui="card" style={{ padding: 16, borderRadius: 18, backgroundColor: '#FAFCFF', border: '1px solid #E6ECF5' }}>
                  <p data-ui="kpi-title" style={{ margin: 0, fontSize: 10, color: '#8A95A8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Orders</p>
                  <h2 data-ui="kpi-value" style={{ margin: '12px 0 6px 0', fontSize: 26, color: '#1F2C43', letterSpacing: '-0.05em' }}>{'{{query.valueFormatted}}'}</h2>
                  <p style={{ margin: 0, fontSize: 12, color: '#617089' }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
                </article>
              </Query>
              <Query dataQuery={{ query: 'SELECT COALESCE(AVG(p.valor_total), 0)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}}', limit: 1 }} format="currency" comparisonMode="previous_period">
                <article data-ui="card" style={{ padding: 16, borderRadius: 18, backgroundColor: '#FAFCFF', border: '1px solid #E6ECF5' }}>
                  <p data-ui="kpi-title" style={{ margin: 0, fontSize: 10, color: '#8A95A8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Avg ticket</p>
                  <h2 data-ui="kpi-value" style={{ margin: '12px 0 6px 0', fontSize: 26, color: '#1F2C43', letterSpacing: '-0.05em' }}>{'{{query.valueFormatted}}'}</h2>
                  <p style={{ margin: 0, fontSize: 12, color: '#617089' }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
                </article>
              </Query>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateRows: '1fr 0.86fr', gap: 14 }}>
            <article style={{ borderRadius: 18, background: 'linear-gradient(180deg, #F6F9FF 0%, #F9F4FF 100%)', border: '1px solid #E8EDF7', padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ margin: 0, fontSize: 11, color: '#8994A7', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Scope</p>
                <p style={{ margin: 0, fontSize: 22, lineHeight: 1.18, letterSpacing: '-0.04em', color: '#283349' }}>This report covers Q1FY27 revenue, with one broad market view and four deeper breakdowns.</p>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <li style={{ fontSize: 14, lineHeight: 1.6, color: '#55647C' }}>Breakdown by segment</li>
                <li style={{ fontSize: 14, lineHeight: 1.6, color: '#55647C' }}>Breakdown by channel concentration</li>
                <li style={{ fontSize: 14, lineHeight: 1.6, color: '#55647C' }}>Operational detail and status mix</li>
              </ul>
            </article>
            <article style={{ borderRadius: 18, background: 'linear-gradient(180deg, #FFF8FD 0%, #FFFDFE 100%)', border: '1px solid #F0E5EF', padding: 22 }}>
              <p style={{ margin: 0, fontSize: 11, color: '#A386A0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Reader guidance</p>
              <p style={{ margin: '12px 0 0 0', fontSize: 15, lineHeight: 1.7, color: '#645C6B' }}>
                Each page combines one chart or table with a short interpretation, mirroring the structure of high-signal AI-generated analytical briefs.
              </p>
            </article>
          </div>
        </div>
      </article>
    </section>
  </Report>

  <Report id="segment" title="Segment">
    <section style={{ height: '100%', padding: 18, background: 'radial-gradient(circle at top left, rgba(132,239,255,0.35), transparent 28%), linear-gradient(180deg, #F7FBFF 0%, #FFFFFF 100%)' }}>
      <article style={{ height: '100%', borderRadius: 22, overflow: 'hidden', backgroundColor: '#FFFFFF', border: '1px solid #E7EDF6', boxShadow: '0 10px 30px rgba(34, 47, 78, 0.07)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 10, background: 'linear-gradient(90deg, #8EE2F5 0%, #D0E7FF 100%)' }} />
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #EEF2F7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#394459' }}>Breakdown by Segment</p>
          <p style={{ margin: 0, fontSize: 12, color: '#8D98AA' }}>Page 2 of 5</p>
        </div>
        <div style={{ flex: 1, padding: '28px 34px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h2 data-ui="title" style={{ margin: 0, fontSize: 30, lineHeight: 1.02, letterSpacing: '-0.05em', color: '#263145' }}>Breakdown by segment</h2>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: '#5C697D' }}>
              The chart highlights which commercial segments carry most of the quarter. The narrative should focus on concentration and the resilience of the mid-tier contribution.
            </p>
          </div>
          <article style={{ padding: 14, borderRadius: 18, border: '1px solid #E7EDF6', backgroundColor: '#FFFFFF' }}>
            <Chart
              type="bar"
              height={430}
              format="currency"
              colorScheme={['#1D6B85', '#1FB7C8', '#3654A4', '#9DDFF0', '#4A85F4', '#B7DDFF']}
              dataQuery={{
                query: 'SELECT COALESCE(cv.id::text, COALESCE(cv.nome, \'-\')) AS key, COALESCE(cv.nome, \'-\') AS label, COALESCE(SUM(pi.subtotal), 0)::float AS value FROM vendas.pedidos p JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id WHERE 1=1 {{filters:p}} GROUP BY 1, 2 ORDER BY 3 DESC',
                xField: 'label',
                yField: 'value',
                keyField: 'key',
                limit: 6,
              }}
              recharts={{ categoryLabelMode: 'first-word', valueAxisWidth: 68 }}
            />
          </article>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <li style={{ fontSize: 14, lineHeight: 1.7, color: '#4E5D76' }}><strong>Top segments:</strong> the first two bars account for most of total revenue and define the operating baseline.</li>
            <li style={{ fontSize: 14, lineHeight: 1.7, color: '#4E5D76' }}><strong>Long tail:</strong> smaller segments remain relevant, but their contribution is too fragmented to carry the story alone.</li>
          </ul>
        </div>
      </article>
    </section>
  </Report>

  <Report id="channel_mix" title="Channel Mix">
    <section style={{ height: '100%', padding: 18, background: 'radial-gradient(circle at bottom right, rgba(255,170,216,0.34), transparent 30%), linear-gradient(180deg, #FFF9FD 0%, #FFFFFF 100%)' }}>
      <article style={{ height: '100%', borderRadius: 22, overflow: 'hidden', backgroundColor: '#FFFFFF', border: '1px solid #E7EDF6', boxShadow: '0 10px 30px rgba(34, 47, 78, 0.07)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 10, background: 'linear-gradient(90deg, #FFC2DE 0%, #F2D7FF 100%)' }} />
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #EEF2F7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#394459' }}>Breakdown by Country / Channel Mix</p>
          <p style={{ margin: 0, fontSize: 12, color: '#8D98AA' }}>Page 3 of 5</p>
        </div>
        <div style={{ flex: 1, padding: '28px 34px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h2 data-ui="title" style={{ margin: 0, fontSize: 28, lineHeight: 1.04, letterSpacing: '-0.05em', color: '#263145' }}>Breakdown by country</h2>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: '#5C697D' }}>
              A second view reframes the same quarter through contribution share. The goal is to separate broad participation from true concentration.
            </p>
            <article style={{ padding: 14, borderRadius: 18, border: '1px solid #E7EDF6', backgroundColor: '#FFFFFF' }}>
              <Chart
                type="pie"
                height={340}
                format="currency"
                colorScheme={['#2E7BF7', '#5DB4FF', '#8CDDDC', '#F88CA0', '#D9B8FF']}
                dataQuery={{
                  query: 'SELECT COALESCE(cv.id::text, COALESCE(cv.nome, \'-\')) AS key, COALESCE(cv.nome, \'-\') AS label, COALESCE(SUM(pi.subtotal), 0)::float AS value FROM vendas.pedidos p JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id WHERE 1=1 {{filters:p}} GROUP BY 1, 2 ORDER BY 3 DESC',
                  xField: 'label',
                  yField: 'value',
                  keyField: 'key',
                  limit: 5,
                }}
                recharts={{ innerRadius: 54, outerRadius: 88, showLabels: false, legendPosition: 'right' }}
              />
            </article>
          </div>
          <div style={{ display: 'grid', gridTemplateRows: '0.88fr 1.12fr', gap: 14 }}>
            <article style={{ borderRadius: 18, background: 'linear-gradient(180deg, #FFF7FB 0%, #FFFDFE 100%)', border: '1px solid #F0E5EF', padding: 20 }}>
              <p style={{ margin: 0, fontSize: 11, color: '#A386A0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Interpretation</p>
              <p style={{ margin: '12px 0 0 0', fontSize: 22, lineHeight: 1.18, letterSpacing: '-0.04em', color: '#3D3450' }}>
                The mix remains diversified enough for a healthy narrative, but the top contributors still dominate the quarter.
              </p>
            </article>
            <article style={{ borderRadius: 18, backgroundColor: '#FAFCFF', border: '1px solid #E7EDF6', padding: 20 }}>
              <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <li style={{ fontSize: 14, lineHeight: 1.7, color: '#51607A' }}><strong>Core markets:</strong> the top share buckets remain the main source of certainty for the current quarter.</li>
                <li style={{ fontSize: 14, lineHeight: 1.7, color: '#51607A' }}><strong>Established second tier:</strong> mid-sized contributors confirm that the business is not fully dependent on one channel.</li>
                <li style={{ fontSize: 14, lineHeight: 1.7, color: '#51607A' }}><strong>Decision point:</strong> leadership should protect what converts well before expanding weaker areas.</li>
              </ul>
            </article>
          </div>
        </div>
      </article>
    </section>
  </Report>

  <Report id="exceptions" title="Exceptions">
    <section style={{ height: '100%', padding: 18, background: 'radial-gradient(circle at top left, rgba(255,201,233,0.38), transparent 26%), linear-gradient(180deg, #FFF9FC 0%, #FFFFFF 100%)' }}>
      <article style={{ height: '100%', borderRadius: 22, overflow: 'hidden', backgroundColor: '#FFFFFF', border: '1px solid #E7EDF6', boxShadow: '0 10px 30px rgba(34, 47, 78, 0.07)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 10, background: 'linear-gradient(90deg, #FFD2E7 0%, #F0B5D7 100%)' }} />
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #EEF2F7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#394459' }}>Current Status and Proposed Solutions</p>
          <p style={{ margin: 0, fontSize: 12, color: '#8D98AA' }}>Page 4 of 5</p>
        </div>
        <div style={{ flex: 1, padding: '28px 34px', display: 'grid', gridTemplateRows: '0.44fr 0.56fr', gap: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '0.92fr 1.08fr', gap: 18 }}>
            <article style={{ borderRadius: 18, backgroundColor: '#FAFCFF', border: '1px solid #E7EDF6', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, color: '#8A95A8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Summary</p>
              <h2 data-ui="title" style={{ margin: 0, fontSize: 28, lineHeight: 1.02, letterSpacing: '-0.05em', color: '#263145' }}>Low inventory detected on Week 26</h2>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: '#5C697D' }}>
                One page should always translate data into operator action. This one highlights the current baseline and the few interventions worth escalating.
              </p>
              <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <li style={{ fontSize: 14, lineHeight: 1.65, color: '#51607A' }}>Current status follows the current execution baseline.</li>
                <li style={{ fontSize: 14, lineHeight: 1.65, color: '#51607A' }}>Coverage remains below target in the weaker categories.</li>
              </ul>
            </article>
            <article style={{ borderRadius: 18, backgroundColor: '#FFFFFF', border: '1px solid #E7EDF6', padding: 14 }}>
              <Chart
                type="line"
                height={250}
                format="currency"
                colorScheme={['#6F44C8', '#D778C6', '#F2B5D8']}
                dataQuery={{
                  query: 'SELECT TO_CHAR(p.data_pedido::date, \'YYYY-MM-DD\') AS key, TO_CHAR(p.data_pedido::date, \'DD/MM\') AS label, COALESCE(SUM(p.valor_total), 0)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}} GROUP BY 1, 2 ORDER BY 1 ASC',
                  xField: 'label',
                  yField: 'value',
                  keyField: 'key',
                  limit: 4,
                }}
                recharts={{ showDots: false, singleSeriesGradient: true, valueAxisWidth: 60 }}
              />
            </article>
          </div>
          <article data-ui="table-card" style={{ padding: 14, borderRadius: 18, border: '1px solid #E7EDF6', backgroundColor: '#FFFFFF' }}>
            <p data-ui="eyebrow" style={{ margin: 0, marginBottom: 10, fontSize: 11, color: '#8A95A8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Proposed solutions</p>
            <Table
              height={310}
              bordered
              rounded
              stickyHeader
              dataQuery={{
                query: 'SELECT p.id::text AS pedido_id, TO_CHAR(p.data_pedido::date, \'DD/MM/YYYY\') AS data_pedido, COALESCE(cv.nome, \'-\') AS canal, COALESCE(p.status, \'Sem status\') AS status, COALESCE(p.valor_total, 0)::float AS valor_total FROM vendas.pedidos p LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id WHERE 1=1 {{filters:p}} ORDER BY p.data_pedido DESC NULLS LAST, p.id DESC',
                limit: 8,
              }}
              columns={[
                { accessorKey: 'pedido_id', header: 'Proposal' },
                { accessorKey: 'data_pedido', header: 'Start date' },
                { accessorKey: 'canal', header: 'Owner' },
                { accessorKey: 'status', header: 'Impact level', cell: 'badge', meta: { variantMap: { aprovado: 'success', pendente: 'warning', cancelado: 'danger' } } },
                { accessorKey: 'valor_total', header: 'Projected value', format: 'currency', align: 'right', headerAlign: 'right' },
              ]}
            />
          </article>
        </div>
      </article>
    </section>
  </Report>

  <Report id="appendix" title="Appendix">
    <section style={{ height: '100%', padding: 18, background: 'radial-gradient(circle at top left, rgba(121,236,255,0.28), transparent 24%), radial-gradient(circle at bottom right, rgba(255,188,224,0.26), transparent 26%), linear-gradient(180deg, #F8FBFF 0%, #FFFFFF 100%)' }}>
      <article style={{ height: '100%', borderRadius: 22, overflow: 'hidden', backgroundColor: '#FFFFFF', border: '1px solid #E7EDF6', boxShadow: '0 10px 30px rgba(34, 47, 78, 0.07)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 10, background: 'linear-gradient(90deg, #9CE7F7 0%, #EFC8FF 50%, #FFBFD8 100%)' }} />
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #EEF2F7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#394459' }}>Appendix and Supporting Detail</p>
          <p style={{ margin: 0, fontSize: 12, color: '#8D98AA' }}>Page 5 of 5</p>
        </div>
        <div style={{ flex: 1, padding: '28px 34px', display: 'grid', gridTemplateColumns: '1.12fr 0.88fr', gap: 18 }}>
          <article data-ui="table-card" style={{ padding: 16, borderRadius: 18, backgroundColor: '#FFFFFF', border: '1px solid #E7EDF6', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h2 data-ui="title" style={{ margin: 0, fontSize: 28, lineHeight: 1.03, letterSpacing: '-0.05em', color: '#263145' }}>Detailed transaction list</h2>
            <Table
              height={650}
              bordered
              rounded
              stickyHeader
              enableExportCsv
              dataQuery={{
                query: 'SELECT p.id::text AS pedido_id, TO_CHAR(p.data_pedido::date, \'DD/MM/YYYY\') AS data_pedido, COALESCE(cv.nome, \'-\') AS canal, COALESCE(p.status, \'Sem status\') AS status, COALESCE(p.valor_total, 0)::float AS valor_total FROM vendas.pedidos p LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id WHERE 1=1 {{filters:p}} ORDER BY p.data_pedido DESC NULLS LAST, p.id DESC',
                limit: 14,
              }}
              columns={[
                { accessorKey: 'pedido_id', header: 'Order' },
                { accessorKey: 'data_pedido', header: 'Date' },
                { accessorKey: 'canal', header: 'Channel' },
                { accessorKey: 'status', header: 'Status', cell: 'badge', meta: { variantMap: { aprovado: 'success', pendente: 'warning', cancelado: 'danger' } } },
                { accessorKey: 'valor_total', header: 'Revenue', format: 'currency', align: 'right', headerAlign: 'right' },
              ]}
            />
          </article>
          <div style={{ display: 'grid', gridTemplateRows: '0.38fr 0.62fr', gap: 14 }}>
            <article style={{ borderRadius: 18, background: 'linear-gradient(180deg, #F6F9FF 0%, #FFF8FC 100%)', border: '1px solid #E7EDF6', padding: 20 }}>
              <p style={{ margin: 0, fontSize: 11, color: '#8A95A8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Closing note</p>
              <p style={{ margin: '12px 0 0 0', fontSize: 22, lineHeight: 1.18, letterSpacing: '-0.04em', color: '#35415A' }}>
                The report format works best when each page answers one question and leaves enough white space for interpretation.
              </p>
            </article>
            <article data-ui="pivot-card" style={{ padding: 16, borderRadius: 18, backgroundColor: '#FAFCFF', border: '1px solid #E7EDF6', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, color: '#8A95A8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Supporting pivot</p>
              <PivotTable
                height={420}
                bordered
                rounded
                stickyHeader
                enableExportCsv
                defaultExpandedLevels={1}
                dataQuery={{
                  query: 'SELECT COALESCE(cv.nome, \'-\') AS canal, COALESCE(p.status, \'Sem status\') AS status, COALESCE(p.valor_total, 0)::float AS valor_total FROM vendas.pedidos p LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id WHERE 1=1 {{filters:p}}',
                  limit: 400,
                }}
                rows={[{ field: 'canal', label: 'Canal' }]}
                columns={[{ field: 'status', label: 'Status' }]}
                values={[{ field: 'valor_total', label: 'Receita', aggregate: 'sum', format: 'currency' }]}
              />
            </article>
          </div>
        </div>
      </article>
    </section>
  </Report>
</ReportTemplate>`

export const REPORT_TEMPLATE = (
  <ReportTemplateMarker name="pigment_style_report" title="Revenue Analysis Brief">
    <ThemeMarker name="light" />

    <ReportMarker id="cover" title="Cover">
      <section style={{ height: '100%', padding: 18, background: 'radial-gradient(circle at top left, rgba(114,225,255,0.45), transparent 26%), radial-gradient(circle at bottom right, rgba(255,154,211,0.42), transparent 30%), linear-gradient(180deg, #F7FBFF 0%, #FFF8FC 100%)' }}>
        <article style={{ height: '100%', borderRadius: 22, overflow: 'hidden', backgroundColor: '#FFFFFF', border: '1px solid #E7EDF6', boxShadow: '0 10px 30px rgba(34, 47, 78, 0.08)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 12, background: 'linear-gradient(90deg, #9FE8F5 0%, #DDB6FF 50%, #FFBDD6 100%)' }} />
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #EEF2F7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 16, height: 16, borderRadius: 999, backgroundColor: '#E6ECF7', border: '1px solid #D7DEEB' }} />
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#394459' }}>Last Quarter Revenue Analysis</p>
            </div>
            <p style={{ margin: 0, fontSize: 12, color: '#8D98AA' }}>04/04/2026 • 9:41 AM</p>
          </div>
          <div style={{ flex: 1, padding: '34px 38px', display: 'grid', gridTemplateColumns: '1.08fr 0.92fr', gap: 28 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, color: '#8691A5', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Executive brief</p>
                <h1 data-ui="title" style={{ margin: 0, fontSize: 36, lineHeight: 1.02, letterSpacing: '-0.05em', color: '#263145' }}>Last Quarter Revenue Analysis</h1>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.72, color: '#556074', maxWidth: 440 }}>
                  This report reframes dashboard output into a compact narrative. The numbers stay query-driven, but the reading experience is closer to an executive memo than to an analytical app.
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <QueryMarker
                  dataQuery={{ query: 'SELECT COALESCE(SUM(p.valor_total), 0)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}}', limit: 1 }}
                  format="currency"
                  comparisonMode="previous_period"
                >
                  <article data-ui="card" style={{ padding: 16, borderRadius: 18, backgroundColor: '#FAFCFF', border: '1px solid #E6ECF5' }}>
                    <p data-ui="kpi-title" style={{ margin: 0, fontSize: 10, color: '#8A95A8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Revenue</p>
                    <h2 data-ui="kpi-value" style={{ margin: '12px 0 6px 0', fontSize: 26, color: '#1F2C43', letterSpacing: '-0.05em' }}>{'{{query.valueFormatted}}'}</h2>
                    <p style={{ margin: 0, fontSize: 12, color: '#617089' }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
                  </article>
                </QueryMarker>
                <QueryMarker
                  dataQuery={{ query: 'SELECT COUNT(*)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}}', limit: 1 }}
                  format="number"
                  comparisonMode="previous_period"
                >
                  <article data-ui="card" style={{ padding: 16, borderRadius: 18, backgroundColor: '#FAFCFF', border: '1px solid #E6ECF5' }}>
                    <p data-ui="kpi-title" style={{ margin: 0, fontSize: 10, color: '#8A95A8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Orders</p>
                    <h2 data-ui="kpi-value" style={{ margin: '12px 0 6px 0', fontSize: 26, color: '#1F2C43', letterSpacing: '-0.05em' }}>{'{{query.valueFormatted}}'}</h2>
                    <p style={{ margin: 0, fontSize: 12, color: '#617089' }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
                  </article>
                </QueryMarker>
                <QueryMarker
                  dataQuery={{ query: 'SELECT COALESCE(AVG(p.valor_total), 0)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}}', limit: 1 }}
                  format="currency"
                  comparisonMode="previous_period"
                >
                  <article data-ui="card" style={{ padding: 16, borderRadius: 18, backgroundColor: '#FAFCFF', border: '1px solid #E6ECF5' }}>
                    <p data-ui="kpi-title" style={{ margin: 0, fontSize: 10, color: '#8A95A8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Avg ticket</p>
                    <h2 data-ui="kpi-value" style={{ margin: '12px 0 6px 0', fontSize: 26, color: '#1F2C43', letterSpacing: '-0.05em' }}>{'{{query.valueFormatted}}'}</h2>
                    <p style={{ margin: 0, fontSize: 12, color: '#617089' }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
                  </article>
                </QueryMarker>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateRows: '1fr 0.86fr', gap: 14 }}>
              <article style={{ borderRadius: 18, background: 'linear-gradient(180deg, #F6F9FF 0%, #F9F4FF 100%)', border: '1px solid #E8EDF7', padding: 22, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p style={{ margin: 0, fontSize: 11, color: '#8994A7', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Scope</p>
                  <p style={{ margin: 0, fontSize: 22, lineHeight: 1.18, letterSpacing: '-0.04em', color: '#283349' }}>This report covers Q1FY27 revenue, with one broad market view and four deeper breakdowns.</p>
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <li style={{ fontSize: 14, lineHeight: 1.6, color: '#55647C' }}>Breakdown by segment</li>
                  <li style={{ fontSize: 14, lineHeight: 1.6, color: '#55647C' }}>Breakdown by channel concentration</li>
                  <li style={{ fontSize: 14, lineHeight: 1.6, color: '#55647C' }}>Operational detail and status mix</li>
                </ul>
              </article>
              <article style={{ borderRadius: 18, background: 'linear-gradient(180deg, #FFF8FD 0%, #FFFDFE 100%)', border: '1px solid #F0E5EF', padding: 22 }}>
                <p style={{ margin: 0, fontSize: 11, color: '#A386A0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Reader guidance</p>
                <p style={{ margin: '12px 0 0 0', fontSize: 15, lineHeight: 1.7, color: '#645C6B' }}>
                  Each page combines one chart or table with a short interpretation, mirroring the structure of high-signal AI-generated analytical briefs.
                </p>
              </article>
            </div>
          </div>
        </article>
      </section>
    </ReportMarker>

    <ReportMarker id="segment" title="Segment">
      <section style={{ height: '100%', padding: 18, background: 'radial-gradient(circle at top left, rgba(132,239,255,0.35), transparent 28%), linear-gradient(180deg, #F7FBFF 0%, #FFFFFF 100%)' }}>
        <article style={{ height: '100%', borderRadius: 22, overflow: 'hidden', backgroundColor: '#FFFFFF', border: '1px solid #E7EDF6', boxShadow: '0 10px 30px rgba(34, 47, 78, 0.07)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 10, background: 'linear-gradient(90deg, #8EE2F5 0%, #D0E7FF 100%)' }} />
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #EEF2F7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#394459' }}>Breakdown by Segment</p>
            <p style={{ margin: 0, fontSize: 12, color: '#8D98AA' }}>Page 2 of 5</p>
          </div>
          <div style={{ flex: 1, padding: '28px 34px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <h2 data-ui="title" style={{ margin: 0, fontSize: 30, lineHeight: 1.02, letterSpacing: '-0.05em', color: '#263145' }}>Breakdown by segment</h2>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: '#5C697D' }}>
                The chart highlights which commercial segments carry most of the quarter. The narrative should focus on concentration and the resilience of the mid-tier contribution.
              </p>
            </div>
            <article style={{ padding: 14, borderRadius: 18, border: '1px solid #E7EDF6', backgroundColor: '#FFFFFF' }}>
              <ChartMarker
                type="bar"
                height={430}
                format="currency"
                colorScheme={['#1D6B85', '#1FB7C8', '#3654A4', '#9DDFF0', '#4A85F4', '#B7DDFF']}
                dataQuery={{
                  query: 'SELECT COALESCE(cv.id::text, COALESCE(cv.nome, \'-\')) AS key, COALESCE(cv.nome, \'-\') AS label, COALESCE(SUM(pi.subtotal), 0)::float AS value FROM vendas.pedidos p JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id WHERE 1=1 {{filters:p}} GROUP BY 1, 2 ORDER BY 3 DESC',
                  xField: 'label',
                  yField: 'value',
                  keyField: 'key',
                  limit: 6,
                }}
                recharts={{ categoryLabelMode: 'first-word', valueAxisWidth: 68 }}
              />
            </article>
            <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <li style={{ fontSize: 14, lineHeight: 1.7, color: '#4E5D76' }}><strong>Top segments:</strong> the first two bars account for most of total revenue and define the operating baseline.</li>
              <li style={{ fontSize: 14, lineHeight: 1.7, color: '#4E5D76' }}><strong>Long tail:</strong> smaller segments remain relevant, but their contribution is too fragmented to carry the story alone.</li>
            </ul>
          </div>
        </article>
      </section>
    </ReportMarker>

    <ReportMarker id="channel_mix" title="Channel Mix">
      <section style={{ height: '100%', padding: 18, background: 'radial-gradient(circle at bottom right, rgba(255,170,216,0.34), transparent 30%), linear-gradient(180deg, #FFF9FD 0%, #FFFFFF 100%)' }}>
        <article style={{ height: '100%', borderRadius: 22, overflow: 'hidden', backgroundColor: '#FFFFFF', border: '1px solid #E7EDF6', boxShadow: '0 10px 30px rgba(34, 47, 78, 0.07)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 10, background: 'linear-gradient(90deg, #FFC2DE 0%, #F2D7FF 100%)' }} />
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #EEF2F7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#394459' }}>Breakdown by Country / Channel Mix</p>
            <p style={{ margin: 0, fontSize: 12, color: '#8D98AA' }}>Page 3 of 5</p>
          </div>
          <div style={{ flex: 1, padding: '28px 34px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h2 data-ui="title" style={{ margin: 0, fontSize: 28, lineHeight: 1.04, letterSpacing: '-0.05em', color: '#263145' }}>Breakdown by country</h2>
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: '#5C697D' }}>
                A second view reframes the same quarter through contribution share. The goal is to separate broad participation from true concentration.
              </p>
              <article style={{ padding: 14, borderRadius: 18, border: '1px solid #E7EDF6', backgroundColor: '#FFFFFF' }}>
                <ChartMarker
                  type="pie"
                  height={340}
                  format="currency"
                  colorScheme={['#2E7BF7', '#5DB4FF', '#8CDDDC', '#F88CA0', '#D9B8FF']}
                  dataQuery={{
                    query: 'SELECT COALESCE(cv.id::text, COALESCE(cv.nome, \'-\')) AS key, COALESCE(cv.nome, \'-\') AS label, COALESCE(SUM(pi.subtotal), 0)::float AS value FROM vendas.pedidos p JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id WHERE 1=1 {{filters:p}} GROUP BY 1, 2 ORDER BY 3 DESC',
                    xField: 'label',
                    yField: 'value',
                    keyField: 'key',
                    limit: 5,
                  }}
                  recharts={{ innerRadius: 54, outerRadius: 88, showLabels: false, legendPosition: 'right' }}
                />
              </article>
            </div>
            <div style={{ display: 'grid', gridTemplateRows: '0.88fr 1.12fr', gap: 14 }}>
              <article style={{ borderRadius: 18, background: 'linear-gradient(180deg, #FFF7FB 0%, #FFFDFE 100%)', border: '1px solid #F0E5EF', padding: 20 }}>
                <p style={{ margin: 0, fontSize: 11, color: '#A386A0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Interpretation</p>
                <p style={{ margin: '12px 0 0 0', fontSize: 22, lineHeight: 1.18, letterSpacing: '-0.04em', color: '#3D3450' }}>
                  The mix remains diversified enough for a healthy narrative, but the top contributors still dominate the quarter.
                </p>
              </article>
              <article style={{ borderRadius: 18, backgroundColor: '#FAFCFF', border: '1px solid #E7EDF6', padding: 20 }}>
                <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <li style={{ fontSize: 14, lineHeight: 1.7, color: '#51607A' }}><strong>Core markets:</strong> the top share buckets remain the main source of certainty for the current quarter.</li>
                  <li style={{ fontSize: 14, lineHeight: 1.7, color: '#51607A' }}><strong>Established second tier:</strong> mid-sized contributors confirm that the business is not fully dependent on one channel.</li>
                  <li style={{ fontSize: 14, lineHeight: 1.7, color: '#51607A' }}><strong>Decision point:</strong> leadership should protect what converts well before expanding weaker areas.</li>
                </ul>
              </article>
            </div>
          </div>
        </article>
      </section>
    </ReportMarker>

    <ReportMarker id="exceptions" title="Exceptions">
      <section style={{ height: '100%', padding: 18, background: 'radial-gradient(circle at top left, rgba(255,201,233,0.38), transparent 26%), linear-gradient(180deg, #FFF9FC 0%, #FFFFFF 100%)' }}>
        <article style={{ height: '100%', borderRadius: 22, overflow: 'hidden', backgroundColor: '#FFFFFF', border: '1px solid #E7EDF6', boxShadow: '0 10px 30px rgba(34, 47, 78, 0.07)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 10, background: 'linear-gradient(90deg, #FFD2E7 0%, #F0B5D7 100%)' }} />
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #EEF2F7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#394459' }}>Current Status and Proposed Solutions</p>
            <p style={{ margin: 0, fontSize: 12, color: '#8D98AA' }}>Page 4 of 5</p>
          </div>
          <div style={{ flex: 1, padding: '28px 34px', display: 'grid', gridTemplateRows: '0.44fr 0.56fr', gap: 18 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '0.92fr 1.08fr', gap: 18 }}>
              <article style={{ borderRadius: 18, backgroundColor: '#FAFCFF', border: '1px solid #E7EDF6', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, color: '#8A95A8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Summary</p>
                <h2 data-ui="title" style={{ margin: 0, fontSize: 28, lineHeight: 1.02, letterSpacing: '-0.05em', color: '#263145' }}>Low inventory detected on Week 26</h2>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: '#5C697D' }}>
                  One page should always translate data into operator action. This one highlights the current baseline and the few interventions worth escalating.
                </p>
                <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <li style={{ fontSize: 14, lineHeight: 1.65, color: '#51607A' }}>Current status follows the current execution baseline.</li>
                  <li style={{ fontSize: 14, lineHeight: 1.65, color: '#51607A' }}>Coverage remains below target in the weaker categories.</li>
                </ul>
              </article>
              <article style={{ borderRadius: 18, backgroundColor: '#FFFFFF', border: '1px solid #E7EDF6', padding: 14 }}>
                <ChartMarker
                  type="line"
                  height={250}
                  format="currency"
                  colorScheme={['#6F44C8', '#D778C6', '#F2B5D8']}
                  dataQuery={{
                    query: 'SELECT TO_CHAR(p.data_pedido::date, \'YYYY-MM-DD\') AS key, TO_CHAR(p.data_pedido::date, \'DD/MM\') AS label, COALESCE(SUM(p.valor_total), 0)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}} GROUP BY 1, 2 ORDER BY 1 ASC',
                    xField: 'label',
                    yField: 'value',
                    keyField: 'key',
                    limit: 4,
                  }}
                  recharts={{ showDots: false, singleSeriesGradient: true, valueAxisWidth: 60 }}
                />
              </article>
            </div>
            <article data-ui="table-card" style={{ padding: 14, borderRadius: 18, border: '1px solid #E7EDF6', backgroundColor: '#FFFFFF' }}>
              <p data-ui="eyebrow" style={{ margin: 0, marginBottom: 10, fontSize: 11, color: '#8A95A8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Proposed solutions</p>
              <TableMarker
                height={310}
                bordered
                rounded
                stickyHeader
                dataQuery={{
                  query: 'SELECT p.id::text AS pedido_id, TO_CHAR(p.data_pedido::date, \'DD/MM/YYYY\') AS data_pedido, COALESCE(cv.nome, \'-\') AS canal, COALESCE(p.status, \'Sem status\') AS status, COALESCE(p.valor_total, 0)::float AS valor_total FROM vendas.pedidos p LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id WHERE 1=1 {{filters:p}} ORDER BY p.data_pedido DESC NULLS LAST, p.id DESC',
                  limit: 8,
                }}
                columns={[
                  { accessorKey: 'pedido_id', header: 'Proposal' },
                  { accessorKey: 'data_pedido', header: 'Start date' },
                  { accessorKey: 'canal', header: 'Owner' },
                  { accessorKey: 'status', header: 'Impact level', cell: 'badge', meta: { variantMap: { aprovado: 'success', pendente: 'warning', cancelado: 'danger' } } },
                  { accessorKey: 'valor_total', header: 'Projected value', format: 'currency', align: 'right', headerAlign: 'right' },
                ]}
              />
            </article>
          </div>
        </article>
      </section>
    </ReportMarker>

    <ReportMarker id="appendix" title="Appendix">
      <section style={{ height: '100%', padding: 18, background: 'radial-gradient(circle at top left, rgba(121,236,255,0.28), transparent 24%), radial-gradient(circle at bottom right, rgba(255,188,224,0.26), transparent 26%), linear-gradient(180deg, #F8FBFF 0%, #FFFFFF 100%)' }}>
        <article style={{ height: '100%', borderRadius: 22, overflow: 'hidden', backgroundColor: '#FFFFFF', border: '1px solid #E7EDF6', boxShadow: '0 10px 30px rgba(34, 47, 78, 0.07)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ height: 10, background: 'linear-gradient(90deg, #9CE7F7 0%, #EFC8FF 50%, #FFBFD8 100%)' }} />
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #EEF2F7', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#394459' }}>Appendix and Supporting Detail</p>
            <p style={{ margin: 0, fontSize: 12, color: '#8D98AA' }}>Page 5 of 5</p>
          </div>
          <div style={{ flex: 1, padding: '28px 34px', display: 'grid', gridTemplateColumns: '1.12fr 0.88fr', gap: 18 }}>
            <article data-ui="table-card" style={{ padding: 16, borderRadius: 18, backgroundColor: '#FFFFFF', border: '1px solid #E7EDF6', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h2 data-ui="title" style={{ margin: 0, fontSize: 28, lineHeight: 1.03, letterSpacing: '-0.05em', color: '#263145' }}>Detailed transaction list</h2>
              <TableMarker
                height={650}
                bordered
                rounded
                stickyHeader
                enableExportCsv
                dataQuery={{
                  query: 'SELECT p.id::text AS pedido_id, TO_CHAR(p.data_pedido::date, \'DD/MM/YYYY\') AS data_pedido, COALESCE(cv.nome, \'-\') AS canal, COALESCE(p.status, \'Sem status\') AS status, COALESCE(p.valor_total, 0)::float AS valor_total FROM vendas.pedidos p LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id WHERE 1=1 {{filters:p}} ORDER BY p.data_pedido DESC NULLS LAST, p.id DESC',
                  limit: 14,
                }}
                columns={[
                  { accessorKey: 'pedido_id', header: 'Order' },
                  { accessorKey: 'data_pedido', header: 'Date' },
                  { accessorKey: 'canal', header: 'Channel' },
                  { accessorKey: 'status', header: 'Status', cell: 'badge', meta: { variantMap: { aprovado: 'success', pendente: 'warning', cancelado: 'danger' } } },
                  { accessorKey: 'valor_total', header: 'Revenue', format: 'currency', align: 'right', headerAlign: 'right' },
                ]}
              />
            </article>
            <div style={{ display: 'grid', gridTemplateRows: '0.38fr 0.62fr', gap: 14 }}>
              <article style={{ borderRadius: 18, background: 'linear-gradient(180deg, #F6F9FF 0%, #FFF8FC 100%)', border: '1px solid #E7EDF6', padding: 20 }}>
                <p style={{ margin: 0, fontSize: 11, color: '#8A95A8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Closing note</p>
                <p style={{ margin: '12px 0 0 0', fontSize: 22, lineHeight: 1.18, letterSpacing: '-0.04em', color: '#35415A' }}>
                  The report format works best when each page answers one question and leaves enough white space for interpretation.
                </p>
              </article>
              <article data-ui="pivot-card" style={{ padding: 16, borderRadius: 18, backgroundColor: '#FAFCFF', border: '1px solid #E7EDF6', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, color: '#8A95A8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Supporting pivot</p>
                <PivotTableMarker
                  height={420}
                  bordered
                  rounded
                  stickyHeader
                  enableExportCsv
                  defaultExpandedLevels={1}
                  dataQuery={{
                    query: 'SELECT COALESCE(cv.nome, \'-\') AS canal, COALESCE(p.status, \'Sem status\') AS status, COALESCE(p.valor_total, 0)::float AS valor_total FROM vendas.pedidos p LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id WHERE 1=1 {{filters:p}}',
                    limit: 400,
                  }}
                  rows={[{ field: 'canal', label: 'Canal' }]}
                  columns={[{ field: 'status', label: 'Status' }]}
                  values={[{ field: 'valor_total', label: 'Receita', aggregate: 'sum', format: 'currency' }]}
                />
              </article>
            </div>
          </div>
        </article>
      </section>
    </ReportMarker>
  </ReportTemplateMarker>
)
