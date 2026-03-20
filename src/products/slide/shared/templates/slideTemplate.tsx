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

function SlideTemplateMarker({ children }: MarkerProps) {
  return <>{children}</>
}

function ThemeMarker(_: MarkerProps) {
  return null
}

function SlideMarker({ children }: MarkerProps) {
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

SlideTemplateMarker.displayName = 'SlideTemplate'
ThemeMarker.displayName = 'Theme'
SlideMarker.displayName = 'Slide'
QueryMarker.displayName = 'Query'
ChartMarker.displayName = 'Chart'
TableMarker.displayName = 'Table'
PivotTableMarker.displayName = 'PivotTable'

const PAGE_STYLE: React.CSSProperties = {
  height: '100%',
  boxSizing: 'border-box',
  padding: 34,
  display: 'flex',
  flexDirection: 'column',
  gap: 18,
  backgroundColor: '#F7F9FE',
}

const HEADER_STACK_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const KPI_ROW_STYLE: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 14,
}

const CARD_ROW_STYLE: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 14,
}

const PANEL_STYLE: React.CSSProperties = {
  padding: 22,
  borderRadius: 26,
  backgroundColor: '#FFFFFF',
  border: '1px solid #DDE6F5',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
}

const KPI_CARD_STYLE: React.CSSProperties = {
  padding: 20,
  borderRadius: 22,
  backgroundColor: '#FFFFFF',
  border: '1px solid #DCE5F6',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
  gap: 10,
}

const NOTE_CARD_STYLE: React.CSSProperties = {
  padding: 20,
  borderRadius: 22,
  backgroundColor: '#FFFFFF',
  border: '1px solid #DCE5F6',
}

export const SLIDE_TEMPLATE_SOURCE = String.raw`<SlideTemplate title="Market Storytelling Deck" name="deck_mercado">
  <Theme name="light" />

  <Slide id="cover" title="Cover">
    <section style={{ height: '100%', padding: 42, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: 'linear-gradient(135deg, #0D1B52 0%, #1A2E7A 62%, #243A92 100%)', color: '#FFFFFF' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 780 }}>
        <p style={{ margin: 0, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.16em', opacity: 0.74 }}>Q1 2026 subscription review</p>
        <h1 style={{ margin: 0, fontSize: 58, lineHeight: 0.94, letterSpacing: '-0.07em' }}>State of growth across subscription apps</h1>
        <p style={{ margin: 0, fontSize: 17, lineHeight: 1.72, color: 'rgba(255,255,255,0.82)', maxWidth: 640 }}>
          Six slides built as an executive story with one reading column per page. KPIs stay in one row, charts stay full-width, and supporting cards only appear beneath the evidence.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <article style={{ padding: 22, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)' }}>
          <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.70)' }}>Deck rule</p>
          <p style={{ margin: '10px 0 0 0', fontSize: 21, lineHeight: 1.2, letterSpacing: '-0.04em' }}>Every page reads top to bottom.</p>
        </article>
        <article style={{ padding: 22, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)' }}>
          <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.70)' }}>Data scope</p>
          <p style={{ margin: '10px 0 0 0', fontSize: 21, lineHeight: 1.2, letterSpacing: '-0.04em' }}>Charts, tables and pivots stay focused.</p>
        </article>
        <article style={{ padding: 22, borderRadius: 24, backgroundColor: '#F35B5B', border: '1px solid rgba(255,255,255,0.10)' }}>
          <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.78)' }}>Executive note</p>
          <p style={{ margin: '10px 0 0 0', fontSize: 21, lineHeight: 1.2, letterSpacing: '-0.04em', color: '#FFFFFF' }}>No split columns competing with the main evidence.</p>
        </article>
      </div>
    </section>
  </Slide>

  <Slide id="thesis" title="Thesis">
    <section style={{ height: '100%', padding: 34, display: 'flex', flexDirection: 'column', gap: 18, backgroundColor: '#F6F8FD' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p data-ui="eyebrow">Presentation thesis</p>
        <h2 data-ui="title">Growth stayed broad enough to support the story, but concentration is now the key executive question.</h2>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.72, color: '#4D5F7D', maxWidth: 760 }}>
          The page stays in one column. KPIs come first in a single row, then supporting cards in a single row, with no right rail competing for attention.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <Query dataQuery={{ query: "SELECT COALESCE(SUM(p.valor_total), 0)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}}", limit: 1 }} format="currency" comparisonMode="previous_period">
          <article data-ui="card"><p data-ui="kpi-title">Revenue</p><h3 data-ui="kpi-value">{'{{query.valueFormatted}}'}</h3><p>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p></article>
        </Query>
        <Query dataQuery={{ query: "SELECT COUNT(*)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}}", limit: 1 }} format="number" comparisonMode="previous_period">
          <article data-ui="card"><p data-ui="kpi-title">Orders</p><h3 data-ui="kpi-value">{'{{query.valueFormatted}}'}</h3><p>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p></article>
        </Query>
        <Query dataQuery={{ query: "SELECT COALESCE(AVG(p.valor_total), 0)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}}", limit: 1 }} format="currency" comparisonMode="previous_period">
          <article data-ui="card"><p data-ui="kpi-title">Average ticket</p><h3 data-ui="kpi-value">{'{{query.valueFormatted}}'}</h3><p>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p></article>
        </Query>
        <Query dataQuery={{ query: "SELECT COUNT(DISTINCT p.canal_venda_id)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}}", limit: 1 }} format="number" comparisonMode="previous_period">
          <article data-ui="card"><p data-ui="kpi-title">Active channels</p><h3 data-ui="kpi-value">{'{{query.valueFormatted}}'}</h3><p>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p></article>
        </Query>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <article data-ui="card"><p>Read this first: momentum remains intact, but mix quality matters more than topline alone.</p></article>
        <article data-ui="card"><p>The next section isolates where revenue quality is strongest and where the portfolio is thinning out.</p></article>
        <article data-ui="card"><p>This deck now behaves like a presentation page, not a dashboard split into left and right rails.</p></article>
      </div>
    </section>
  </Slide>

  <Slide id="trend" title="Trend">
    <section style={{ height: '100%', padding: 34, display: 'flex', flexDirection: 'column', gap: 18, backgroundColor: '#F7F9FE' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p data-ui="eyebrow">Revenue trajectory</p>
        <h2 data-ui="title">Monthly revenue continues to rise, but the slope is narrowing.</h2>
      </header>
      <article data-ui="card" style={{ padding: 22, borderRadius: 26, backgroundColor: '#FFFFFF', border: '1px solid #DDE6F5' }}>
        <Chart type="line" height={380} format="currency" dataQuery={{ query: "SELECT TO_CHAR(p.data_pedido::date, 'YYYY-MM-DD') AS key, TO_CHAR(p.data_pedido::date, 'DD/MM') AS label, COALESCE(SUM(p.valor_total), 0)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}} GROUP BY 1, 2 ORDER BY 1 ASC", xField: 'label', yField: 'value', keyField: 'key', limit: 31 }} recharts={{ showDots: false, singleSeriesGradient: true, valueAxisWidth: 70 }} />
      </article>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <article data-ui="card"><p>Momentum remains positive enough to support the growth story.</p></article>
        <article data-ui="card"><p>The leadership question is not whether growth exists, but which lines still deserve incremental investment.</p></article>
        <article data-ui="card"><p>The chart stays full-width; interpretation comes after it, not beside it.</p></article>
      </div>
    </section>
  </Slide>

  <Slide id="mix" title="Mix">
    <section style={{ height: '100%', padding: 34, display: 'flex', flexDirection: 'column', gap: 18, backgroundColor: '#FBFCFF' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p data-ui="eyebrow">Channel mix</p>
        <h2 data-ui="title">A smaller set of channels is carrying most of the commercial story.</h2>
      </header>
      <article data-ui="card" style={{ padding: 22, borderRadius: 26, backgroundColor: '#FFFFFF', border: '1px solid #DDE6F5' }}>
        <Chart type="bar" height={340} format="currency" dataQuery={{ query: "SELECT COALESCE(cv.id::text, COALESCE(cv.nome, '-')) AS key, COALESCE(cv.nome, '-') AS label, COALESCE(SUM(pi.subtotal), 0)::float AS value FROM vendas.pedidos p JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id WHERE 1=1 {{filters:p}} GROUP BY 1, 2 ORDER BY 3 DESC", xField: 'label', yField: 'value', keyField: 'key', dimension: 'canal_venda', limit: 6 }} recharts={{ categoryLabelMode: 'first-word', valueAxisWidth: 70 }} />
      </article>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <article data-ui="card"><p><strong>Core contributors:</strong> a small set of channels still carries most of the commercial story.</p></article>
        <article data-ui="card"><p><strong>Mid-tier support:</strong> the portfolio is not collapsed into one single source.</p></article>
        <article data-ui="card"><p><strong>Decision:</strong> protect efficient channels before expanding weaker ones.</p></article>
      </div>
    </section>
  </Slide>

  <Slide id="detail" title="Detail">
    <section style={{ height: '100%', padding: 30, display: 'flex', flexDirection: 'column', gap: 16, backgroundColor: '#FFFFFF' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p data-ui="eyebrow">Detailed records</p>
        <h2 data-ui="title">Operational detail behind the narrative</h2>
      </header>
      <article data-ui="table-card" style={{ padding: 18, borderRadius: 24, backgroundColor: '#FFFFFF', border: '1px solid #E3EAF5' }}>
        <Table height={250} bordered rounded stickyHeader dataQuery={{ query: "SELECT p.id::text AS pedido_id, TO_CHAR(p.data_pedido::date, 'DD/MM/YYYY') AS data_pedido, COALESCE(cv.nome, '-') AS canal, COALESCE(p.status, 'Sem status') AS status, COALESCE(p.valor_total, 0)::float AS valor_total FROM vendas.pedidos p LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id WHERE 1=1 {{filters:p}} ORDER BY p.data_pedido DESC NULLS LAST, p.id DESC", limit: 10 }} columns={[{ accessorKey: 'pedido_id', header: 'Pedido' }, { accessorKey: 'data_pedido', header: 'Data' }, { accessorKey: 'canal', header: 'Canal' }, { accessorKey: 'status', header: 'Status', cell: 'badge', meta: { variantMap: { aprovado: 'success', pendente: 'warning', cancelado: 'danger' } } }, { accessorKey: 'valor_total', header: 'Receita', format: 'currency', align: 'right', headerAlign: 'right' }]} />
      </article>
      <article data-ui="pivot-card" style={{ padding: 18, borderRadius: 24, backgroundColor: '#F6F9FF', border: '1px solid #E3EAF5' }}>
        <PivotTable height={220} bordered rounded stickyHeader defaultExpandedLevels={1} dataQuery={{ query: "SELECT COALESCE(cv.nome, '-') AS canal, COALESCE(p.status, 'Sem status') AS status, COALESCE(p.valor_total, 0)::float AS valor_total FROM vendas.pedidos p LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id WHERE 1=1 {{filters:p}}", limit: 300 }} rows={[{ field: 'canal', label: 'Canal' }]} columns={[{ field: 'status', label: 'Status' }]} values={[{ field: 'valor_total', label: 'Receita', aggregate: 'sum', format: 'currency' }]} />
      </article>
    </section>
  </Slide>

  <Slide id="close" title="Close">
    <section style={{ height: '100%', padding: 34, display: 'flex', flexDirection: 'column', gap: 18, backgroundColor: '#EEF3FF' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p data-ui="eyebrow">Closing view</p>
        <h2 data-ui="title">Three actions matter more than adding more pages.</h2>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.72, color: '#4D5F7D', maxWidth: 760 }}>
          Keep funding the channels that still convert efficiently, challenge the parts of the mix where growth is flattening, and keep operational detail close enough to challenge the narrative.
        </p>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <Query dataQuery={{ query: "SELECT COALESCE(SUM(p.valor_total), 0)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}}", limit: 1 }} format="currency" comparisonMode="previous_period">
          <article data-ui="card"><p data-ui="kpi-title">Topline to defend</p><h3 data-ui="kpi-value">{'{{query.valueFormatted}}'}</h3><p>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p></article>
        </Query>
        <article data-ui="card"><p data-ui="kpi-title">01</p><h3 data-ui="kpi-value">Protect</h3><p>Protect winning channels before expanding weaker ones.</p></article>
        <article data-ui="card"><p data-ui="kpi-title">02</p><h3 data-ui="kpi-value">Review</h3><p>Review concentration risk instead of celebrating topline alone.</p></article>
        <article data-ui="card"><p data-ui="kpi-title">03</p><h3 data-ui="kpi-value">Challenge</h3><p>Use detail pages to challenge the story, not decorate it.</p></article>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <article data-ui="card"><p>The slide system is now presentation-first without giving up data.</p></article>
        <article data-ui="card"><p>Every content slide follows one column, with rows only for compact support blocks.</p></article>
        <article data-ui="card"><p>The main evidence always gets the most horizontal space.</p></article>
      </div>
    </section>
  </Slide>
</SlideTemplate>`

export const SLIDE_TEMPLATE = (
  <SlideTemplateMarker title="Market Storytelling Deck" name="deck_mercado">
    <ThemeMarker name="light" />

    <SlideMarker id="cover" title="Cover">
      <section
        style={{
          height: '100%',
          padding: 42,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #0D1B52 0%, #1A2E7A 62%, #243A92 100%)',
          color: '#FFFFFF',
          boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 780 }}>
          <p style={{ margin: 0, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.16em', opacity: 0.74 }}>Q1 2026 subscription review</p>
          <h1 style={{ margin: 0, fontSize: 58, lineHeight: 0.94, letterSpacing: '-0.07em' }}>State of growth across subscription apps</h1>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.72, color: 'rgba(255,255,255,0.82)', maxWidth: 640 }}>
            Six slides built as an executive story with one reading column per page. KPIs stay in one row, charts stay full-width, and supporting cards only appear beneath the evidence.
          </p>
        </div>
        <div style={CARD_ROW_STYLE}>
          <article style={{ padding: 22, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)' }}>
            <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.70)' }}>Deck rule</p>
            <p style={{ margin: '10px 0 0 0', fontSize: 21, lineHeight: 1.2, letterSpacing: '-0.04em' }}>Every page reads top to bottom.</p>
          </article>
          <article style={{ padding: 22, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.14)' }}>
            <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.70)' }}>Data scope</p>
            <p style={{ margin: '10px 0 0 0', fontSize: 21, lineHeight: 1.2, letterSpacing: '-0.04em' }}>Charts, tables and pivots stay focused.</p>
          </article>
          <article style={{ padding: 22, borderRadius: 24, backgroundColor: '#F35B5B', border: '1px solid rgba(255,255,255,0.10)' }}>
            <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.78)' }}>Executive note</p>
            <p style={{ margin: '10px 0 0 0', fontSize: 21, lineHeight: 1.2, letterSpacing: '-0.04em', color: '#FFFFFF' }}>No split columns competing with the main evidence.</p>
          </article>
        </div>
      </section>
    </SlideMarker>

    <SlideMarker id="thesis" title="Thesis">
      <section style={PAGE_STYLE}>
        <header style={HEADER_STACK_STYLE}>
          <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#74839A' }}>
            Presentation thesis
          </p>
          <h2 data-ui="title" style={{ margin: 0, fontSize: 34, lineHeight: 1.02, letterSpacing: '-0.06em', color: '#16233A', maxWidth: 860 }}>
            Growth stayed broad enough to support the story, but concentration is now the key executive question.
          </h2>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.72, color: '#4D5F7D', maxWidth: 760 }}>
            The page stays in one column. KPIs come first in a single row, then supporting cards in a single row, with no right rail competing for attention.
          </p>
        </header>

        <div style={KPI_ROW_STYLE}>
          <QueryMarker
            dataQuery={{ query: 'SELECT COALESCE(SUM(p.valor_total), 0)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}}', limit: 1 }}
            format="currency"
            comparisonMode="previous_period"
          >
            <article data-ui="card" style={KPI_CARD_STYLE}>
              <p data-ui="kpi-title" style={{ margin: 0, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#74839A' }}>Revenue</p>
              <h3 data-ui="kpi-value" style={{ margin: 0, fontSize: 34, lineHeight: 0.96, letterSpacing: '-0.06em', color: '#16233A' }}>{'{{query.valueFormatted}}'}</h3>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: '#50617B' }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
            </article>
          </QueryMarker>
          <QueryMarker
            dataQuery={{ query: 'SELECT COUNT(*)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}}', limit: 1 }}
            format="number"
            comparisonMode="previous_period"
          >
            <article data-ui="card" style={KPI_CARD_STYLE}>
              <p data-ui="kpi-title" style={{ margin: 0, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#74839A' }}>Orders</p>
              <h3 data-ui="kpi-value" style={{ margin: 0, fontSize: 34, lineHeight: 0.96, letterSpacing: '-0.06em', color: '#16233A' }}>{'{{query.valueFormatted}}'}</h3>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: '#50617B' }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
            </article>
          </QueryMarker>
          <QueryMarker
            dataQuery={{ query: 'SELECT COALESCE(AVG(p.valor_total), 0)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}}', limit: 1 }}
            format="currency"
            comparisonMode="previous_period"
          >
            <article data-ui="card" style={KPI_CARD_STYLE}>
              <p data-ui="kpi-title" style={{ margin: 0, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#74839A' }}>Average ticket</p>
              <h3 data-ui="kpi-value" style={{ margin: 0, fontSize: 34, lineHeight: 0.96, letterSpacing: '-0.06em', color: '#16233A' }}>{'{{query.valueFormatted}}'}</h3>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: '#50617B' }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
            </article>
          </QueryMarker>
          <QueryMarker
            dataQuery={{ query: 'SELECT COUNT(DISTINCT p.canal_venda_id)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}}', limit: 1 }}
            format="number"
            comparisonMode="previous_period"
          >
            <article data-ui="card" style={KPI_CARD_STYLE}>
              <p data-ui="kpi-title" style={{ margin: 0, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#74839A' }}>Active channels</p>
              <h3 data-ui="kpi-value" style={{ margin: 0, fontSize: 34, lineHeight: 0.96, letterSpacing: '-0.06em', color: '#16233A' }}>{'{{query.valueFormatted}}'}</h3>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: '#50617B' }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
            </article>
          </QueryMarker>
        </div>

        <div style={CARD_ROW_STYLE}>
          <article data-ui="card" style={NOTE_CARD_STYLE}>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.68, color: '#425571' }}>Read this first: momentum remains intact, but mix quality matters more than topline alone.</p>
          </article>
          <article data-ui="card" style={NOTE_CARD_STYLE}>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.68, color: '#425571' }}>The next section isolates where revenue quality is strongest and where the portfolio is thinning out.</p>
          </article>
          <article data-ui="card" style={NOTE_CARD_STYLE}>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.68, color: '#425571' }}>This deck now behaves like a presentation page, not a dashboard split into left and right rails.</p>
          </article>
        </div>
      </section>
    </SlideMarker>

    <SlideMarker id="trend" title="Trend">
      <section style={PAGE_STYLE}>
        <header style={HEADER_STACK_STYLE}>
          <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#74839A' }}>
            Revenue trajectory
          </p>
          <h2 data-ui="title" style={{ margin: 0, fontSize: 30, lineHeight: 1.02, letterSpacing: '-0.05em', color: '#16233A' }}>
            Monthly revenue continues to rise, but the slope is narrowing.
          </h2>
        </header>

        <article data-ui="card" style={PANEL_STYLE}>
          <ChartMarker
            type="line"
            height={380}
            format="currency"
            colorScheme={['#305DFF', '#62A5FF', '#9BCBFF']}
            dataQuery={{
              query: "SELECT TO_CHAR(p.data_pedido::date, 'YYYY-MM-DD') AS key, TO_CHAR(p.data_pedido::date, 'DD/MM') AS label, COALESCE(SUM(p.valor_total), 0)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}} GROUP BY 1, 2 ORDER BY 1 ASC",
              xField: 'label',
              yField: 'value',
              keyField: 'key',
              limit: 31,
            }}
            recharts={{ showDots: false, singleSeriesGradient: true, valueAxisWidth: 70 }}
          />
        </article>

        <div style={CARD_ROW_STYLE}>
          <article data-ui="card" style={NOTE_CARD_STYLE}>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.68, color: '#425571' }}>Momentum remains positive enough to support the growth story.</p>
          </article>
          <article data-ui="card" style={NOTE_CARD_STYLE}>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.68, color: '#425571' }}>The leadership question is not whether growth exists, but which lines still deserve incremental investment.</p>
          </article>
          <article data-ui="card" style={NOTE_CARD_STYLE}>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.68, color: '#425571' }}>The chart stays full-width; interpretation comes after it, not beside it.</p>
          </article>
        </div>
      </section>
    </SlideMarker>

    <SlideMarker id="mix" title="Mix">
      <section style={{ ...PAGE_STYLE, backgroundColor: '#FBFCFF' }}>
        <header style={HEADER_STACK_STYLE}>
          <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#74839A' }}>
            Channel mix
          </p>
          <h2 data-ui="title" style={{ margin: 0, fontSize: 30, lineHeight: 1.02, letterSpacing: '-0.05em', color: '#16233A' }}>
            A smaller set of channels is carrying most of the commercial story.
          </h2>
        </header>

        <article data-ui="card" style={PANEL_STYLE}>
          <ChartMarker
            type="bar"
            height={340}
            format="currency"
            colorScheme={['#E84C4F', '#F26D6F', '#F59E9F', '#FCCBCB']}
            dataQuery={{
              query: "SELECT COALESCE(cv.id::text, COALESCE(cv.nome, '-')) AS key, COALESCE(cv.nome, '-') AS label, COALESCE(SUM(pi.subtotal), 0)::float AS value FROM vendas.pedidos p JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id WHERE 1=1 {{filters:p}} GROUP BY 1, 2 ORDER BY 3 DESC",
              xField: 'label',
              yField: 'value',
              keyField: 'key',
              dimension: 'canal_venda',
              limit: 6,
            }}
            recharts={{ categoryLabelMode: 'first-word', valueAxisWidth: 70 }}
          />
        </article>

        <div style={CARD_ROW_STYLE}>
          <article data-ui="card" style={NOTE_CARD_STYLE}>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.68, color: '#425571' }}><strong>Core contributors:</strong> a small set of channels still carries most of the commercial story.</p>
          </article>
          <article data-ui="card" style={NOTE_CARD_STYLE}>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.68, color: '#425571' }}><strong>Mid-tier support:</strong> the portfolio is not collapsed into one single source.</p>
          </article>
          <article data-ui="card" style={NOTE_CARD_STYLE}>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.68, color: '#425571' }}><strong>Decision:</strong> protect efficient channels before expanding weaker ones.</p>
          </article>
        </div>
      </section>
    </SlideMarker>

    <SlideMarker id="detail" title="Detail">
      <section style={{ ...PAGE_STYLE, padding: 30, backgroundColor: '#FFFFFF' }}>
        <header style={HEADER_STACK_STYLE}>
          <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#74839A' }}>
            Detailed records
          </p>
          <h2 data-ui="title" style={{ margin: 0, fontSize: 28, lineHeight: 1.03, letterSpacing: '-0.05em', color: '#16233A' }}>
            Operational detail behind the narrative
          </h2>
        </header>

        <article data-ui="table-card" style={{ ...PANEL_STYLE, padding: 18, borderRadius: 24 }}>
          <TableMarker
            height={250}
            bordered
            rounded
            stickyHeader
            dataQuery={{
              query: "SELECT p.id::text AS pedido_id, TO_CHAR(p.data_pedido::date, 'DD/MM/YYYY') AS data_pedido, COALESCE(cv.nome, '-') AS canal, COALESCE(p.status, 'Sem status') AS status, COALESCE(p.valor_total, 0)::float AS valor_total FROM vendas.pedidos p LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id WHERE 1=1 {{filters:p}} ORDER BY p.data_pedido DESC NULLS LAST, p.id DESC",
              limit: 10,
            }}
            columns={[
              { accessorKey: 'pedido_id', header: 'Pedido' },
              { accessorKey: 'data_pedido', header: 'Data' },
              { accessorKey: 'canal', header: 'Canal' },
              { accessorKey: 'status', header: 'Status', cell: 'badge', meta: { variantMap: { aprovado: 'success', pendente: 'warning', cancelado: 'danger' } } },
              { accessorKey: 'valor_total', header: 'Receita', format: 'currency', align: 'right', headerAlign: 'right' },
            ]}
          />
        </article>

        <article data-ui="pivot-card" style={{ ...PANEL_STYLE, padding: 18, borderRadius: 24, backgroundColor: '#F6F9FF' }}>
          <PivotTableMarker
            height={220}
            bordered
            rounded
            stickyHeader
            defaultExpandedLevels={1}
            dataQuery={{
              query: "SELECT COALESCE(cv.nome, '-') AS canal, COALESCE(p.status, 'Sem status') AS status, COALESCE(p.valor_total, 0)::float AS valor_total FROM vendas.pedidos p LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id WHERE 1=1 {{filters:p}}",
              limit: 300,
            }}
            rows={[{ field: 'canal', label: 'Canal' }]}
            columns={[{ field: 'status', label: 'Status' }]}
            values={[{ field: 'valor_total', label: 'Receita', aggregate: 'sum', format: 'currency' }]}
          />
        </article>
      </section>
    </SlideMarker>

    <SlideMarker id="close" title="Close">
      <section style={{ ...PAGE_STYLE, backgroundColor: '#EEF3FF' }}>
        <header style={HEADER_STACK_STYLE}>
          <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#74839A' }}>
            Closing view
          </p>
          <h2 data-ui="title" style={{ margin: 0, fontSize: 34, lineHeight: 0.98, letterSpacing: '-0.06em', color: '#16233A' }}>
            Three actions matter more than adding more pages.
          </h2>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.72, color: '#4D5F7D', maxWidth: 760 }}>
            Keep funding the channels that still convert efficiently, challenge the parts of the mix where growth is flattening, and keep operational detail close enough to challenge the narrative.
          </p>
        </header>

        <div style={KPI_ROW_STYLE}>
          <QueryMarker
            dataQuery={{ query: 'SELECT COALESCE(SUM(p.valor_total), 0)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}}', limit: 1 }}
            format="currency"
            comparisonMode="previous_period"
          >
            <article data-ui="card" style={KPI_CARD_STYLE}>
              <p data-ui="kpi-title" style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#74839A' }}>Topline to defend</p>
              <h3 data-ui="kpi-value" style={{ margin: 0, fontSize: 34, lineHeight: 0.96, letterSpacing: '-0.06em', color: '#16233A' }}>{'{{query.valueFormatted}}'}</h3>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: '#50617B' }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
            </article>
          </QueryMarker>
          <article data-ui="card" style={KPI_CARD_STYLE}>
            <p data-ui="kpi-title" style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#74839A' }}>01</p>
            <h3 data-ui="kpi-value" style={{ margin: 0, fontSize: 34, lineHeight: 0.96, letterSpacing: '-0.06em', color: '#16233A' }}>Protect</h3>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: '#50617B' }}>Protect winning channels before expanding weaker ones.</p>
          </article>
          <article data-ui="card" style={KPI_CARD_STYLE}>
            <p data-ui="kpi-title" style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#74839A' }}>02</p>
            <h3 data-ui="kpi-value" style={{ margin: 0, fontSize: 34, lineHeight: 0.96, letterSpacing: '-0.06em', color: '#16233A' }}>Review</h3>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: '#50617B' }}>Review concentration risk instead of celebrating topline alone.</p>
          </article>
          <article data-ui="card" style={KPI_CARD_STYLE}>
            <p data-ui="kpi-title" style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#74839A' }}>03</p>
            <h3 data-ui="kpi-value" style={{ margin: 0, fontSize: 34, lineHeight: 0.96, letterSpacing: '-0.06em', color: '#16233A' }}>Challenge</h3>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: '#50617B' }}>Use detail pages to challenge the story, not decorate it.</p>
          </article>
        </div>

        <div style={CARD_ROW_STYLE}>
          <article data-ui="card" style={NOTE_CARD_STYLE}>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.68, color: '#425571' }}>The slide system is now presentation-first without giving up data.</p>
          </article>
          <article data-ui="card" style={NOTE_CARD_STYLE}>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.68, color: '#425571' }}>Every content slide follows one column, with rows only for compact support blocks.</p>
          </article>
          <article data-ui="card" style={NOTE_CARD_STYLE}>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.68, color: '#425571' }}>The main evidence always gets the most horizontal space.</p>
          </article>
        </div>
      </section>
    </SlideMarker>
  </SlideTemplateMarker>
)
