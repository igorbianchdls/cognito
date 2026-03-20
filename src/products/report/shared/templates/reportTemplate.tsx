'use client'

import React from 'react'

type MarkerProps = {
  children?: React.ReactNode
  height?: number
  id?: string
  name?: string
  title?: string
  width?: number
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

const PAGE_STYLE: React.CSSProperties = {
  height: '100%',
  minHeight: '100%',
  boxSizing: 'border-box',
  padding: 36,
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
  backgroundColor: '#FFFFFF',
}

const KPI_ROW_STYLE: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 14,
}

const KPI_CARD_STYLE: React.CSSProperties = {
  padding: 16,
  borderRadius: 16,
  border: '1px solid #E7ECF3',
  backgroundColor: '#FAFBFD',
}

const PANEL_STYLE: React.CSSProperties = {
  padding: 16,
  borderRadius: 16,
  border: '1px solid #E7ECF3',
  backgroundColor: '#FFFFFF',
}

const NARRATIVE_STYLE: React.CSSProperties = {
  padding: 18,
  borderRadius: 16,
  border: '1px solid #E7ECF3',
  backgroundColor: '#F8FAFD',
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
}

const BULLET_LIST_STYLE: React.CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  color: '#51607A',
  fontSize: 14,
  lineHeight: 1.65,
}

export const REPORT_TEMPLATE_SOURCE = String.raw`<ReportTemplate name="executive_brief_report" title="Executive Revenue Brief">
  <Theme name="light" />

  <Report id="overview" title="Overview" width={794} height={1123}>
    <section style={{ height: '100%', padding: 36, display: 'flex', flexDirection: 'column', gap: 18, backgroundColor: '#FFFFFF' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p data-ui="eyebrow">Quarterly Revenue Brief</p>
        <h1 data-ui="title">Last Quarter Revenue Analysis</h1>
        <p>This report keeps a document-style layout: one column, wide visuals and short interpretation blocks.</p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <Query dataQuery={{ query: 'SELECT COALESCE(SUM(p.valor_total), 0)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}}', limit: 1 }} format="currency" comparisonMode="previous_period">
          <article data-ui="card"><p data-ui="kpi-title">Revenue</p><h2 data-ui="kpi-value">{'{{query.valueFormatted}}'}</h2><p>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p></article>
        </Query>
        <Query dataQuery={{ query: 'SELECT COUNT(*)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}}', limit: 1 }} format="number" comparisonMode="previous_period">
          <article data-ui="card"><p data-ui="kpi-title">Orders</p><h2 data-ui="kpi-value">{'{{query.valueFormatted}}'}</h2><p>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p></article>
        </Query>
        <Query dataQuery={{ query: 'SELECT COALESCE(AVG(p.valor_total), 0)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}}', limit: 1 }} format="currency" comparisonMode="previous_period">
          <article data-ui="card"><p data-ui="kpi-title">Avg ticket</p><h2 data-ui="kpi-value">{'{{query.valueFormatted}}'}</h2><p>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p></article>
        </Query>
        <Query dataQuery={{ query: 'SELECT COUNT(DISTINCT p.canal_venda_id)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}}', limit: 1 }} format="number" comparisonMode="previous_period">
          <article data-ui="card"><p data-ui="kpi-title">Active channels</p><h2 data-ui="kpi-value">{'{{query.valueFormatted}}'}</h2><p>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p></article>
        </Query>
      </div>

      <section style={{ padding: 18, border: '1px solid #E7ECF3', borderRadius: 16, backgroundColor: '#F8FAFD', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.72, color: '#51607A' }}>
          <strong>Executive readout.</strong> Revenue and order volume still support a positive commercial narrative, but the overall picture is no longer explained by topline alone.
        </p>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.72, color: '#51607A' }}>
          The more important question is now <strong>where the business is getting its growth</strong> and whether the current mix is becoming too narrow to sustain the same quality of performance over the next periods.
        </p>
      </section>

      <article style={{ padding: 16, border: '1px solid #E7ECF3', borderRadius: 16, backgroundColor: '#FFFFFF' }}>
        <Chart type="bar" height={360} format="currency" dataQuery={{ query: 'SELECT COALESCE(cv.id::text, COALESCE(cv.nome, \'-\')) AS key, COALESCE(cv.nome, \'-\') AS label, COALESCE(SUM(pi.subtotal), 0)::float AS value FROM vendas.pedidos p JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id WHERE 1=1 {{filters:p}} GROUP BY 1, 2 ORDER BY 3 DESC', xField: 'label', yField: 'value', keyField: 'key', limit: 6 }} />
      </article>

      <section style={{ padding: 18, border: '1px solid #E7ECF3', borderRadius: 16, backgroundColor: '#F8FAFD', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.72, color: '#51607A' }}>
          <strong>What the exhibit shows.</strong> A limited set of channels now defines most of the quarter&apos;s revenue baseline, which means commercial resilience depends increasingly on a smaller number of levers.
        </p>
        <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8, color: '#51607A', fontSize: 14, lineHeight: 1.65 }}>
          <li><strong>Positive:</strong> the current leaders are still generating enough scale to defend the quarter.</li>
          <li><strong>Risk:</strong> concentration is rising faster than the topline summary alone suggests.</li>
        </ul>
      </section>

      <ul>
        <li>The top bars define most of the quarter's revenue baseline.</li>
        <li>The document keeps narrative above and evidence below, without dashboard chrome.</li>
      </ul>
    </section>
  </Report>

  <Report id="trend" title="Trend" width={794} height={1123}>
    <section style={{ height: '100%', padding: 36, display: 'flex', flexDirection: 'column', gap: 18, backgroundColor: '#FFFFFF' }}>
      <header><h2 data-ui="title">Revenue trend</h2><p>One wide chart should dominate the page when the main question is trajectory.</p></header>
      <section style={{ padding: 18, border: '1px solid #E7ECF3', borderRadius: 16, backgroundColor: '#F8FAFD', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.72, color: '#51607A' }}>
          <strong>Interpretation frame.</strong> The central issue is no longer whether revenue is growing, but whether the current slope still justifies the same level of confidence in forward momentum.
        </p>
      </section>
      <article style={{ padding: 16, border: '1px solid #E7ECF3', borderRadius: 16, backgroundColor: '#FFFFFF' }}>
        <Chart type="line" height={460} format="currency" dataQuery={{ query: 'SELECT TO_CHAR(p.data_pedido::date, \'YYYY-MM-DD\') AS key, TO_CHAR(p.data_pedido::date, \'DD/MM\') AS label, COALESCE(SUM(p.valor_total), 0)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}} GROUP BY 1, 2 ORDER BY 1 ASC', xField: 'label', yField: 'value', keyField: 'key', limit: 31 }} />
      </article>
      <section style={{ padding: 18, border: '1px solid #E7ECF3', borderRadius: 16, backgroundColor: '#F8FAFD', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8, color: '#51607A', fontSize: 14, lineHeight: 1.65 }}>
          <li><strong>Momentum remains positive,</strong> which protects the topline story.</li>
          <li><strong>The weaker slope matters</strong> because it suggests the next period will need more selectivity to sustain performance.</li>
        </ul>
      </section>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <article data-ui="card"><p>Momentum remains positive, but acceleration is less uniform than before.</p></article>
        <article data-ui="card"><p>The point of the chart is not just growth, but consistency of slope.</p></article>
        <article data-ui="card"><p>This page should read like a report section, not like an app state.</p></article>
      </div>
    </section>
  </Report>

  <Report id="mix" title="Mix" width={794} height={1123}>
    <section style={{ height: '100%', padding: 36, display: 'flex', flexDirection: 'column', gap: 18, backgroundColor: '#FFFFFF' }}>
      <header><h2 data-ui="title">Channel mix</h2><p>Charts stay full-width and the commentary stays below them.</p></header>
      <section style={{ padding: 18, border: '1px solid #E7ECF3', borderRadius: 16, backgroundColor: '#F8FAFD', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.72, color: '#51607A' }}>
          <strong>Why this matters.</strong> Portfolio breadth can look healthy at first glance while contribution becomes progressively more concentrated underneath.
        </p>
      </section>
      <article style={{ padding: 16, border: '1px solid #E7ECF3', borderRadius: 16, backgroundColor: '#FFFFFF' }}>
        <Chart type="pie" height={420} format="currency" dataQuery={{ query: 'SELECT COALESCE(cv.id::text, COALESCE(cv.nome, \'-\')) AS key, COALESCE(cv.nome, \'-\') AS label, COALESCE(SUM(pi.subtotal), 0)::float AS value FROM vendas.pedidos p JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id WHERE 1=1 {{filters:p}} GROUP BY 1, 2 ORDER BY 3 DESC', xField: 'label', yField: 'value', keyField: 'key', limit: 5 }} />
      </article>
      <section style={{ padding: 18, border: '1px solid #E7ECF3', borderRadius: 16, backgroundColor: '#F8FAFD', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.72, color: '#51607A' }}>
          <strong>Management implication.</strong> The current mix still supports the revenue story, but it also makes the business more sensitive to performance swings in a smaller group of channels.
        </p>
      </section>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <article data-ui="card"><p><strong>Core contributors:</strong> a small set of channels still carries most of the commercial story.</p></article>
        <article data-ui="card"><p><strong>Mid-tier support:</strong> the portfolio is not collapsed into one single revenue source.</p></article>
        <article data-ui="card"><p><strong>Decision:</strong> protect efficient channels before expanding weaker ones.</p></article>
      </div>
    </section>
  </Report>

  <Report id="detail" title="Detail" width={794} height={1123}>
    <section style={{ height: '100%', padding: 36, display: 'flex', flexDirection: 'column', gap: 18, backgroundColor: '#FFFFFF' }}>
      <header><h2 data-ui="title">Detailed records</h2><p>The table should own the page width when detail is the goal.</p></header>
      <section style={{ padding: 18, border: '1px solid #E7ECF3', borderRadius: 16, backgroundColor: '#F8FAFD', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.72, color: '#51607A' }}>
          <strong>Use of detail.</strong> This page is designed for inspection, exception handling and challenge. The goal is to test whether the topline narrative is supported by transaction-level quality.
        </p>
      </section>
      <article data-ui="table-card" style={{ padding: 16, border: '1px solid #E7ECF3', borderRadius: 16, backgroundColor: '#FFFFFF' }}>
        <Table height={520} bordered rounded stickyHeader enableExportCsv dataQuery={{ query: 'SELECT p.id::text AS pedido_id, TO_CHAR(p.data_pedido::date, \'DD/MM/YYYY\') AS data_pedido, COALESCE(cv.nome, \'-\') AS canal, COALESCE(p.status, \'Sem status\') AS status, COALESCE(p.valor_total, 0)::float AS valor_total FROM vendas.pedidos p LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id WHERE 1=1 {{filters:p}} ORDER BY p.data_pedido DESC NULLS LAST, p.id DESC', limit: 14 }} columns={[{ accessorKey: 'pedido_id', header: 'Order' }, { accessorKey: 'data_pedido', header: 'Date' }, { accessorKey: 'canal', header: 'Channel' }, { accessorKey: 'status', header: 'Status', cell: 'badge', meta: { variantMap: { aprovado: 'success', pendente: 'warning', cancelado: 'danger' } } }, { accessorKey: 'valor_total', header: 'Revenue', format: 'currency', align: 'right', headerAlign: 'right' }]} />
      </article>
      <section style={{ padding: 18, border: '1px solid #E7ECF3', borderRadius: 16, backgroundColor: '#F8FAFD', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8, color: '#51607A', fontSize: 14, lineHeight: 1.65 }}>
          <li><strong>Check status quality</strong> before assuming all topline is equally secure.</li>
          <li><strong>Use the table</strong> to identify where channel strength is being overstated by incomplete status conversion.</li>
        </ul>
      </section>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <article data-ui="card"><p>Use this page for exceptions and spot checks.</p></article>
        <article data-ui="card"><p>Status mix matters because it explains how much of the topline is truly secured.</p></article>
        <article data-ui="card"><p>This stays in one column; the note row is secondary to the table.</p></article>
      </div>
    </section>
  </Report>

  <Report id="appendix" title="Appendix" width={794} height={1123}>
    <section style={{ height: '100%', padding: 36, display: 'flex', flexDirection: 'column', gap: 18, backgroundColor: '#FFFFFF' }}>
      <header><h2 data-ui="title">Supporting appendix</h2><p>Pivot and closing notes stay stacked in one reading column.</p></header>
      <section style={{ padding: 18, border: '1px solid #E7ECF3', borderRadius: 16, backgroundColor: '#F8FAFD', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.72, color: '#51607A' }}>
          <strong>Appendix purpose.</strong> The pivot is not a decorative extra. It gives management a compact view of how revenue quality is distributed across channels and status categories.
        </p>
      </section>
      <article data-ui="pivot-card" style={{ padding: 16, border: '1px solid #E7ECF3', borderRadius: 16, backgroundColor: '#FFFFFF' }}>
        <PivotTable height={480} bordered rounded stickyHeader enableExportCsv defaultExpandedLevels={1} dataQuery={{ query: 'SELECT COALESCE(cv.nome, \'-\') AS canal, COALESCE(p.status, \'Sem status\') AS status, COALESCE(p.valor_total, 0)::float AS valor_total FROM vendas.pedidos p LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id WHERE 1=1 {{filters:p}}', limit: 400 }} rows={[{ field: 'canal', label: 'Canal' }]} columns={[{ field: 'status', label: 'Status' }]} values={[{ field: 'valor_total', label: 'Receita', aggregate: 'sum', format: 'currency' }]} />
      </article>
      <section style={{ padding: 18, border: '1px solid #E7ECF3', borderRadius: 16, backgroundColor: '#F8FAFD', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.72, color: '#51607A' }}>
          <strong>Closing note.</strong> A good report page alternates between evidence and explanation so that the reader never has to infer the intended conclusion alone.
        </p>
      </section>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <article data-ui="card"><p>This appendix keeps supporting detail close to the main story.</p></article>
        <article data-ui="card"><p>Wide data blocks are preferred over narrow split layouts.</p></article>
        <article data-ui="card"><p>The report should feel like a document page, not a framed UI inside a page.</p></article>
      </div>
    </section>
  </Report>
</ReportTemplate>`

export const REPORT_TEMPLATE = (
  <ReportTemplateMarker name="executive_brief_report" title="Executive Revenue Brief">
    <ThemeMarker name="light" />

    <ReportMarker id="overview" title="Overview" width={794} height={1123}>
      <section style={PAGE_STYLE}>
        <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, color: '#8A95A8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Quarterly Revenue Brief
          </p>
          <h1 data-ui="title" style={{ margin: 0, fontSize: 34, lineHeight: 1.02, letterSpacing: '-0.05em', color: '#263145' }}>
            Last Quarter Revenue Analysis
          </h1>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.72, color: '#5B697E', maxWidth: 760 }}>
            This report uses a document-style layout: one column, wide visuals and short interpretation blocks. The page is the report itself, not a UI mock inside another surface.
          </p>
        </header>

        <div style={KPI_ROW_STYLE}>
          <QueryMarker
            dataQuery={{ query: 'SELECT COALESCE(SUM(p.valor_total), 0)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}}', limit: 1 }}
            format="currency"
            comparisonMode="previous_period"
          >
            <article data-ui="card" style={KPI_CARD_STYLE}>
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
            <article data-ui="card" style={KPI_CARD_STYLE}>
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
            <article data-ui="card" style={KPI_CARD_STYLE}>
              <p data-ui="kpi-title" style={{ margin: 0, fontSize: 10, color: '#8A95A8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Avg ticket</p>
              <h2 data-ui="kpi-value" style={{ margin: '12px 0 6px 0', fontSize: 26, color: '#1F2C43', letterSpacing: '-0.05em' }}>{'{{query.valueFormatted}}'}</h2>
              <p style={{ margin: 0, fontSize: 12, color: '#617089' }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
            </article>
          </QueryMarker>
          <QueryMarker
            dataQuery={{ query: 'SELECT COUNT(DISTINCT p.canal_venda_id)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}}', limit: 1 }}
            format="number"
            comparisonMode="previous_period"
          >
            <article data-ui="card" style={KPI_CARD_STYLE}>
              <p data-ui="kpi-title" style={{ margin: 0, fontSize: 10, color: '#8A95A8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Active channels</p>
              <h2 data-ui="kpi-value" style={{ margin: '12px 0 6px 0', fontSize: 26, color: '#1F2C43', letterSpacing: '-0.05em' }}>{'{{query.valueFormatted}}'}</h2>
              <p style={{ margin: 0, fontSize: 12, color: '#617089' }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
            </article>
          </QueryMarker>
        </div>

        <section style={NARRATIVE_STYLE}>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.72, color: '#51607A' }}>
            <strong>Executive readout.</strong> Revenue and order volume still support a positive commercial narrative, but the overall picture is no longer explained by topline alone.
          </p>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.72, color: '#51607A' }}>
            The more important question is now <strong>where the business is getting its growth</strong> and whether the current mix is becoming too narrow to sustain the same quality of performance over the next periods.
          </p>
        </section>

        <article style={PANEL_STYLE}>
          <ChartMarker
            type="bar"
            height={360}
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

        <section style={NARRATIVE_STYLE}>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.72, color: '#51607A' }}>
            <strong>What the exhibit shows.</strong> A limited set of channels now defines most of the quarter&apos;s revenue baseline, which means commercial resilience depends increasingly on a smaller number of levers.
          </p>
          <ul style={BULLET_LIST_STYLE}>
            <li><strong>Positive:</strong> the current leaders are still generating enough scale to defend the quarter.</li>
            <li><strong>Risk:</strong> concentration is rising faster than the topline summary alone suggests.</li>
          </ul>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          <article data-ui="card" style={KPI_CARD_STYLE}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: '#51607A' }}>
              The first chart owns the page width. Supporting reading comes after the evidence, not beside it.
            </p>
          </article>
          <article data-ui="card" style={KPI_CARD_STYLE}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: '#51607A' }}>
              The top bars define most of the quarter&apos;s revenue baseline.
            </p>
          </article>
          <article data-ui="card" style={KPI_CARD_STYLE}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: '#51607A' }}>
              The report stays in one column all the way down.
            </p>
          </article>
        </div>
      </section>
    </ReportMarker>

    <ReportMarker id="trend" title="Trend" width={794} height={1123}>
      <section style={PAGE_STYLE}>
        <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, color: '#8A95A8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Revenue trajectory
          </p>
          <h2 data-ui="title" style={{ margin: 0, fontSize: 30, lineHeight: 1.03, letterSpacing: '-0.05em', color: '#263145' }}>
            Revenue trend over the period
          </h2>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.72, color: '#5B697E', maxWidth: 760 }}>
            When the key question is trajectory, the chart should dominate the page and the commentary should stay beneath it.
          </p>
        </header>

        <section style={NARRATIVE_STYLE}>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.72, color: '#51607A' }}>
            <strong>Interpretation frame.</strong> The central issue is no longer whether revenue is growing, but whether the current slope still justifies the same level of confidence in forward momentum.
          </p>
        </section>

        <article style={PANEL_STYLE}>
          <ChartMarker
            type="line"
            height={460}
            format="currency"
            colorScheme={['#355EFF', '#62A5FF', '#9FCBFF']}
            dataQuery={{
              query: 'SELECT TO_CHAR(p.data_pedido::date, \'YYYY-MM-DD\') AS key, TO_CHAR(p.data_pedido::date, \'DD/MM\') AS label, COALESCE(SUM(p.valor_total), 0)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}} GROUP BY 1, 2 ORDER BY 1 ASC',
              xField: 'label',
              yField: 'value',
              keyField: 'key',
              limit: 31,
            }}
            recharts={{ showDots: false, singleSeriesGradient: true, valueAxisWidth: 68 }}
          />
        </article>

        <section style={NARRATIVE_STYLE}>
          <ul style={BULLET_LIST_STYLE}>
            <li><strong>Momentum remains positive,</strong> which protects the topline story.</li>
            <li><strong>The weaker slope matters</strong> because it suggests the next period will need more selectivity to sustain performance.</li>
          </ul>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          <article data-ui="card" style={KPI_CARD_STYLE}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: '#51607A' }}>Momentum remains positive enough to defend the topline narrative.</p>
          </article>
          <article data-ui="card" style={KPI_CARD_STYLE}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: '#51607A' }}>The slope matters more than a single period-end number.</p>
          </article>
          <article data-ui="card" style={KPI_CARD_STYLE}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: '#51607A' }}>A document page reads better when the evidence is full-width.</p>
          </article>
        </div>
      </section>
    </ReportMarker>

    <ReportMarker id="mix" title="Mix" width={794} height={1123}>
      <section style={PAGE_STYLE}>
        <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, color: '#8A95A8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Channel concentration
          </p>
          <h2 data-ui="title" style={{ margin: 0, fontSize: 30, lineHeight: 1.03, letterSpacing: '-0.05em', color: '#263145' }}>
            Share of revenue by channel
          </h2>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.72, color: '#5B697E', maxWidth: 760 }}>
            Composition still works better as one wide visual followed by short takeaways, instead of a split dashboard-like grid.
          </p>
        </header>

        <section style={NARRATIVE_STYLE}>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.72, color: '#51607A' }}>
            <strong>Why this matters.</strong> Portfolio breadth can look healthy at first glance while contribution becomes progressively more concentrated underneath.
          </p>
        </section>

        <article style={PANEL_STYLE}>
          <ChartMarker
            type="pie"
            height={420}
            format="currency"
            colorScheme={['#2E7BF7', '#5DB4FF', '#8CDDDC', '#F88CA0', '#D9B8FF']}
            dataQuery={{
              query: 'SELECT COALESCE(cv.id::text, COALESCE(cv.nome, \'-\')) AS key, COALESCE(cv.nome, \'-\') AS label, COALESCE(SUM(pi.subtotal), 0)::float AS value FROM vendas.pedidos p JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id WHERE 1=1 {{filters:p}} GROUP BY 1, 2 ORDER BY 3 DESC',
              xField: 'label',
              yField: 'value',
              keyField: 'key',
              limit: 5,
            }}
            recharts={{ innerRadius: 56, outerRadius: 92, showLabels: false, legendPosition: 'right' }}
          />
        </article>

        <section style={NARRATIVE_STYLE}>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.72, color: '#51607A' }}>
            <strong>Management implication.</strong> The current mix still supports the revenue story, but it also makes the business more sensitive to performance swings in a smaller group of channels.
          </p>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          <article data-ui="card" style={KPI_CARD_STYLE}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: '#51607A' }}>
              <strong>Core contributors:</strong> a small set of channels still carries most of the commercial story.
            </p>
          </article>
          <article data-ui="card" style={KPI_CARD_STYLE}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: '#51607A' }}>
              <strong>Mid-tier support:</strong> the portfolio is not collapsed into a single source.
            </p>
          </article>
          <article data-ui="card" style={KPI_CARD_STYLE}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: '#51607A' }}>
              <strong>Decision:</strong> protect efficient channels before expanding weaker ones.
            </p>
          </article>
        </div>
      </section>
    </ReportMarker>

    <ReportMarker id="detail" title="Detail" width={794} height={1123}>
      <section style={PAGE_STYLE}>
        <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, color: '#8A95A8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Detailed records
          </p>
          <h2 data-ui="title" style={{ margin: 0, fontSize: 30, lineHeight: 1.03, letterSpacing: '-0.05em', color: '#263145' }}>
            Detailed transaction list
          </h2>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.72, color: '#5B697E', maxWidth: 760 }}>
            The table should own the page width when the goal is inspection and challenge, not storytelling by decoration.
          </p>
        </header>

        <section style={NARRATIVE_STYLE}>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.72, color: '#51607A' }}>
            <strong>Use of detail.</strong> This page is designed for inspection, exception handling and challenge. The goal is to test whether the topline narrative is supported by transaction-level quality.
          </p>
        </section>

        <article data-ui="table-card" style={PANEL_STYLE}>
          <TableMarker
            height={520}
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

        <section style={NARRATIVE_STYLE}>
          <ul style={BULLET_LIST_STYLE}>
            <li><strong>Check status quality</strong> before assuming all topline is equally secure.</li>
            <li><strong>Use the table</strong> to identify where channel strength is being overstated by incomplete status conversion.</li>
          </ul>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          <article data-ui="card" style={KPI_CARD_STYLE}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: '#51607A' }}>Use this page for exceptions and spot checks.</p>
          </article>
          <article data-ui="card" style={KPI_CARD_STYLE}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: '#51607A' }}>Status mix matters because it shows how much of the topline is secured.</p>
          </article>
          <article data-ui="card" style={KPI_CARD_STYLE}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: '#51607A' }}>The notes stay secondary to the table, but still in the same single-column reading flow.</p>
          </article>
        </div>
      </section>
    </ReportMarker>

    <ReportMarker id="appendix" title="Appendix" width={794} height={1123}>
      <section style={PAGE_STYLE}>
        <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, color: '#8A95A8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Supporting appendix
          </p>
          <h2 data-ui="title" style={{ margin: 0, fontSize: 30, lineHeight: 1.03, letterSpacing: '-0.05em', color: '#263145' }}>
            Revenue by channel and status
          </h2>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.72, color: '#5B697E', maxWidth: 760 }}>
            Pivot and closing notes remain stacked in one reading column.
          </p>
        </header>

        <section style={NARRATIVE_STYLE}>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.72, color: '#51607A' }}>
            <strong>Appendix purpose.</strong> The pivot is not a decorative extra. It gives management a compact view of how revenue quality is distributed across channels and status categories.
          </p>
        </section>

        <article data-ui="pivot-card" style={PANEL_STYLE}>
          <PivotTableMarker
            height={480}
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

        <section style={NARRATIVE_STYLE}>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.72, color: '#51607A' }}>
            <strong>Closing note.</strong> A good report page alternates between evidence and explanation so that the reader never has to infer the intended conclusion alone.
          </p>
        </section>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          <article data-ui="card" style={KPI_CARD_STYLE}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: '#51607A' }}>This appendix keeps supporting detail close to the main story.</p>
          </article>
          <article data-ui="card" style={KPI_CARD_STYLE}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: '#51607A' }}>Wide data blocks are preferred over narrow split layouts.</p>
          </article>
          <article data-ui="card" style={KPI_CARD_STYLE}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: '#51607A' }}>The report should feel like a document page, not a framed UI inside a page.</p>
          </article>
        </div>
      </section>
    </ReportMarker>
  </ReportTemplateMarker>
)
