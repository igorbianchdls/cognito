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
  padding: 30,
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: '#FFFFFF',
  color: '#17243A',
}

const RULE_STYLE: React.CSSProperties = {
  width: 92,
  height: 4,
  borderRadius: 999,
  backgroundColor: '#245BDB',
}

const HEADER_STYLE: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
}

const HEADLINE_STYLE: React.CSSProperties = {
  margin: 0,
  fontSize: 30,
  lineHeight: 1.05,
  letterSpacing: '-0.055em',
  color: '#17243A',
}

const SUBTITLE_STYLE: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  lineHeight: 1.65,
  color: '#5B6B83',
  maxWidth: 820,
}

const KPI_ROW_STYLE: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: 12,
  marginTop: 18,
}

const KPI_CARD_STYLE: React.CSSProperties = {
  padding: 16,
  borderRadius: 10,
  border: '1px solid #D8E1EE',
  backgroundColor: '#FFFFFF',
  boxSizing: 'border-box',
}

const EXHIBIT_STYLE: React.CSSProperties = {
  marginTop: 20,
  padding: 16,
  borderRadius: 10,
  border: '1px solid #D8E1EE',
  backgroundColor: '#FFFFFF',
  boxSizing: 'border-box',
}

const TAKEAWAY_ROW_STYLE: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, 1fr)',
  gap: 12,
  marginTop: 16,
}

const TAKEAWAY_CARD_STYLE: React.CSSProperties = {
  padding: 14,
  borderRadius: 10,
  border: '1px solid #E4EAF4',
  backgroundColor: '#F7F9FC',
  boxSizing: 'border-box',
}

const FOOTER_STYLE: React.CSSProperties = {
  marginTop: 'auto',
  paddingTop: 10,
  borderTop: '1px solid #E6EBF3',
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: 11,
  lineHeight: 1.4,
  color: '#7B8798',
}

export const SLIDE_TEMPLATE_SOURCE = String.raw`<SlideTemplate title="Executive Commercial Review" name="deck_consulting_style">
  <Theme name="light" />

  <Slide id="cover" title="Cover" width={1280} height={720}>
    <section style={{ height: '100%', padding: 34, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: '#FFFFFF', color: '#17243A' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ width: 92, height: 4, borderRadius: 999, backgroundColor: '#245BDB' }} />
        <p style={{ margin: 0, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6E7B8D' }}>Q1 2026 Commercial Review</p>
        <h1 style={{ margin: 0, fontSize: 54, lineHeight: 0.94, letterSpacing: '-0.07em', maxWidth: 920 }}>Growth remains positive, but channel concentration is becoming the defining management issue</h1>
        <p style={{ margin: 0, fontSize: 17, lineHeight: 1.72, color: '#4F6078', maxWidth: 760 }}>
          Six slides structured in classic consulting format: one message per page, one primary exhibit, and a short set of implications beneath the evidence.
        </p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <article style={{ padding: 18, border: '1px solid #D8E1EE', borderRadius: 10, backgroundColor: '#F8FAFD' }}>
          <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6E7B8D' }}>1. Momentum</p>
          <p style={{ margin: '10px 0 0 0', fontSize: 20, lineHeight: 1.24, color: '#17243A' }}>Topline continues to move in the right direction.</p>
        </article>
        <article style={{ padding: 18, border: '1px solid #D8E1EE', borderRadius: 10, backgroundColor: '#F8FAFD' }}>
          <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6E7B8D' }}>2. Concentration</p>
          <p style={{ margin: '10px 0 0 0', fontSize: 20, lineHeight: 1.24, color: '#17243A' }}>A narrower set of channels is driving more of the story.</p>
        </article>
        <article style={{ padding: 18, border: '1px solid #D8E1EE', borderRadius: 10, backgroundColor: '#245BDB', color: '#FFFFFF' }}>
          <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.76)' }}>3. Decision</p>
          <p style={{ margin: '10px 0 0 0', fontSize: 20, lineHeight: 1.24 }}>Management should protect high-performing channels before broadening spend.</p>
        </article>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#7B8798' }}>
        <span>Prepared for leadership review</span>
        <span>Source: vendas.pedidos, vendas.pedidos_itens</span>
      </div>
    </section>
  </Slide>

  <Slide id="summary" title="Summary" width={1280} height={720}>
    <section style={{ height: '100%', padding: 30, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', color: '#17243A' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ width: 92, height: 4, borderRadius: 999, backgroundColor: '#245BDB' }} />
        <p data-ui="eyebrow">Executive summary</p>
        <h2 data-ui="title">Commercial performance is still healthy, but recent gains are being delivered by a narrower base than before</h2>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: '#5B6B83', maxWidth: 820 }}>The purpose of this page is to establish the topline fact pattern before moving into the exhibits.</p>
      </header>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 18 }}>
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
      <section style={{ marginTop: 20, padding: '22px 24px', borderRadius: 12, border: '1px solid #D8E1EE', backgroundColor: '#F8FAFD', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p style={{ margin: 0, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.10em', color: '#6E7B8D' }}>Key message</p>
        <p style={{ margin: 0, fontSize: 26, lineHeight: 1.18, letterSpacing: '-0.05em', color: '#17243A', maxWidth: 920 }}>
          <strong>Commercial momentum remains intact,</strong> but the business is relying on a narrower set of channels to sustain that performance.
        </p>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: '#4F6078', maxWidth: 900 }}>
          Leadership should therefore read the topline with more caution: the quarter is still strong, but the <strong>quality of growth is becoming more concentrated</strong>.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <div style={{ padding: '12px 14px', borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid #E1E8F2' }}>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: '#425571' }}><strong>Topline is not the issue:</strong> revenue and order flow remain supportive.</p>
          </div>
          <div style={{ padding: '12px 14px', borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid #E1E8F2' }}>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: '#425571' }}><strong>Quality is the issue:</strong> growth depends on a narrower contribution base.</p>
          </div>
          <div style={{ padding: '12px 14px', borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid #E1E8F2' }}>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: '#425571' }}><strong>What follows:</strong> the next pages isolate where management attention is now required.</p>
          </div>
        </div>
      </section>
      <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: '1px solid #E6EBF3', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#7B8798' }}>
        <span>Executive commercial review</span>
        <span>1</span>
      </div>
    </section>
  </Slide>

  <Slide id="trend" title="Trend" width={1280} height={720}>
    <section style={{ height: '100%', padding: 30, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', color: '#17243A' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ width: 92, height: 4, borderRadius: 999, backgroundColor: '#245BDB' }} />
        <p data-ui="eyebrow">Exhibit 1</p>
        <h2 data-ui="title">Revenue continued to grow through the quarter, although the slope softened in the most recent periods</h2>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: '#5B6B83', maxWidth: 820 }}>The exhibit should dominate the page; interpretation sits below the evidence rather than in a competing side column.</p>
      </header>
      <article data-ui="card" style={{ padding: 16, borderRadius: 10, border: '1px solid #D8E1EE', backgroundColor: '#FFFFFF', boxSizing: 'border-box', marginTop: 20 }}>
        <Chart type="line" height={370} format="currency" dataQuery={{ query: "SELECT TO_CHAR(p.data_pedido::date, 'YYYY-MM-DD') AS key, TO_CHAR(p.data_pedido::date, 'DD/MM') AS label, COALESCE(SUM(p.valor_total), 0)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}} GROUP BY 1, 2 ORDER BY 1 ASC", xField: 'label', yField: 'value', keyField: 'key', limit: 31 }} recharts={{ showDots: false, singleSeriesGradient: true, valueAxisWidth: 72 }} />
      </article>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16 }}>
        <article data-ui="card"><p>The topline trend remains directionally positive across the observed period.</p></article>
        <article data-ui="card"><p>The key risk is not contraction, but a loss of acceleration.</p></article>
        <article data-ui="card"><p>Management should now focus on what is driving the weaker slope in the later periods.</p></article>
      </div>
      <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: '1px solid #E6EBF3', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#7B8798' }}>
        <span>Source: sales orders by order date</span>
        <span>2</span>
      </div>
    </section>
  </Slide>

  <Slide id="mix" title="Mix" width={1280} height={720}>
    <section style={{ height: '100%', padding: 30, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', color: '#17243A' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ width: 92, height: 4, borderRadius: 999, backgroundColor: '#245BDB' }} />
        <p data-ui="eyebrow">Exhibit 2</p>
        <h2 data-ui="title">Two channels now account for most revenue, increasing concentration risk despite continued portfolio breadth</h2>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: '#5B6B83', maxWidth: 820 }}>This page isolates concentration as the main management question rather than blending it with unrelated commentary.</p>
      </header>
      <article data-ui="card" style={{ padding: 16, borderRadius: 10, border: '1px solid #D8E1EE', backgroundColor: '#FFFFFF', boxSizing: 'border-box', marginTop: 20 }}>
        <Chart type="bar" height={340} format="currency" dataQuery={{ query: "SELECT COALESCE(cv.id::text, COALESCE(cv.nome, '-')) AS key, COALESCE(cv.nome, '-') AS label, COALESCE(SUM(pi.subtotal), 0)::float AS value FROM vendas.pedidos p JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id WHERE 1=1 {{filters:p}} GROUP BY 1, 2 ORDER BY 3 DESC", xField: 'label', yField: 'value', keyField: 'key', dimension: 'canal_venda', limit: 6 }} recharts={{ categoryLabelMode: 'first-word', valueAxisWidth: 72 }} />
      </article>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16 }}>
        <article data-ui="card"><p>The largest channels now contribute a disproportionate share of total revenue.</p></article>
        <article data-ui="card"><p>Mid-tier channels still provide support, but they are not large enough to offset further concentration.</p></article>
        <article data-ui="card"><p>Resource allocation should prioritize defending the highest-converting channels while testing recovery plays selectively.</p></article>
      </div>
      <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: '1px solid #E6EBF3', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#7B8798' }}>
        <span>Source: sales revenue by channel</span>
        <span>3</span>
      </div>
    </section>
  </Slide>

  <Slide id="detail" title="Detail" width={1280} height={720}>
    <section style={{ height: '100%', padding: 30, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', color: '#17243A' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ width: 92, height: 4, borderRadius: 999, backgroundColor: '#245BDB' }} />
        <p data-ui="eyebrow">Exhibit 3</p>
        <h2 data-ui="title">Detailed records show that concentration coincides with uneven status quality across channels</h2>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: '#5B6B83', maxWidth: 820 }}>The point of this exhibit is to challenge the headline with transaction-level evidence, not to become a second dashboard.</p>
      </header>
      <article data-ui="table-card" style={{ padding: 14, borderRadius: 10, border: '1px solid #D8E1EE', backgroundColor: '#FFFFFF', boxSizing: 'border-box', marginTop: 20 }}>
        <Table height={300} bordered rounded stickyHeader dataQuery={{ query: "SELECT p.id::text AS pedido_id, TO_CHAR(p.data_pedido::date, 'DD/MM/YYYY') AS data_pedido, COALESCE(cv.nome, '-') AS canal, COALESCE(p.status, 'Sem status') AS status, COALESCE(p.valor_total, 0)::float AS valor_total FROM vendas.pedidos p LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id WHERE 1=1 {{filters:p}} ORDER BY p.data_pedido DESC NULLS LAST, p.id DESC", limit: 10 }} columns={[{ accessorKey: 'pedido_id', header: 'Order' }, { accessorKey: 'data_pedido', header: 'Date' }, { accessorKey: 'canal', header: 'Channel' }, { accessorKey: 'status', header: 'Status', cell: 'badge', meta: { variantMap: { aprovado: 'success', pendente: 'warning', cancelado: 'danger' } } }, { accessorKey: 'valor_total', header: 'Revenue', format: 'currency', align: 'right', headerAlign: 'right' }]} />
      </article>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16 }}>
        <article data-ui="card"><p>Record-level review helps separate stable topline from quality-adjusted revenue.</p></article>
        <article data-ui="card"><p>Status mix should be monitored because it indicates how much of reported revenue is operationally secure.</p></article>
        <article data-ui="card"><p>The table earns the width of the page; everything else remains subordinate.</p></article>
      </div>
      <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: '1px solid #E6EBF3', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#7B8798' }}>
        <span>Source: sales orders detail</span>
        <span>4</span>
      </div>
    </section>
  </Slide>

  <Slide id="actions" title="Actions" width={1280} height={720}>
    <section style={{ height: '100%', padding: 30, display: 'flex', flexDirection: 'column', backgroundColor: '#FFFFFF', color: '#17243A' }}>
      <header style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ width: 92, height: 4, borderRadius: 999, backgroundColor: '#245BDB' }} />
        <p data-ui="eyebrow">Management implications</p>
        <h2 data-ui="title">Management should protect winning channels, review weaker mix quality, and use detail pages to challenge the topline narrative</h2>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: '#5B6B83', maxWidth: 820 }}>The final page consolidates the recommendation set and grounds it in the supporting appendix.</p>
      </header>
      <article data-ui="pivot-card" style={{ padding: 14, borderRadius: 10, border: '1px solid #D8E1EE', backgroundColor: '#FFFFFF', boxSizing: 'border-box', marginTop: 20 }}>
        <PivotTable height={250} bordered rounded stickyHeader defaultExpandedLevels={1} dataQuery={{ query: "SELECT COALESCE(cv.nome, '-') AS canal, COALESCE(p.status, 'Sem status') AS status, COALESCE(p.valor_total, 0)::float AS valor_total FROM vendas.pedidos p LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id WHERE 1=1 {{filters:p}}", limit: 300 }} rows={[{ field: 'canal', label: 'Canal' }]} columns={[{ field: 'status', label: 'Status' }]} values={[{ field: 'valor_total', label: 'Receita', aggregate: 'sum', format: 'currency' }]} />
      </article>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16 }}>
        <article data-ui="card"><p><strong>Protect:</strong> concentrate incremental investment in the channels already converting efficiently.</p></article>
        <article data-ui="card"><p><strong>Review:</strong> investigate whether weaker channels are diluting growth quality or simply lagging temporarily.</p></article>
        <article data-ui="card"><p><strong>Challenge:</strong> use operational detail as a standing control against overly optimistic topline messaging.</p></article>
      </div>
      <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: '1px solid #E6EBF3', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#7B8798' }}>
        <span>Source: revenue by channel and status</span>
        <span>5</span>
      </div>
    </section>
  </Slide>
</SlideTemplate>`

export const SLIDE_TEMPLATE = (
  <SlideTemplateMarker title="Executive Commercial Review" name="deck_consulting_style">
    <ThemeMarker name="light" />

    <SlideMarker id="cover" title="Cover" width={1280} height={720}>
      <section style={{ ...PAGE_STYLE, padding: 34, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={RULE_STYLE} />
          <p style={{ margin: 0, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#6E7B8D' }}>Q1 2026 Commercial Review</p>
          <h1 style={{ margin: 0, fontSize: 54, lineHeight: 0.94, letterSpacing: '-0.07em', maxWidth: 920, color: '#17243A' }}>
            Growth remains positive, but channel concentration is becoming the defining management issue
          </h1>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.72, color: '#4F6078', maxWidth: 760 }}>
            Six slides structured in classic consulting format: one message per page, one primary exhibit, and a short set of implications beneath the evidence.
          </p>
        </div>

        <div style={TAKEAWAY_ROW_STYLE}>
          <article style={{ ...TAKEAWAY_CARD_STYLE, padding: 18 }}>
            <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6E7B8D' }}>1. Momentum</p>
            <p style={{ margin: '10px 0 0 0', fontSize: 20, lineHeight: 1.24, color: '#17243A' }}>Topline continues to move in the right direction.</p>
          </article>
          <article style={{ ...TAKEAWAY_CARD_STYLE, padding: 18 }}>
            <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6E7B8D' }}>2. Concentration</p>
            <p style={{ margin: '10px 0 0 0', fontSize: 20, lineHeight: 1.24, color: '#17243A' }}>A narrower set of channels is driving more of the story.</p>
          </article>
          <article style={{ padding: 18, border: '1px solid #245BDB', borderRadius: 10, backgroundColor: '#245BDB', boxSizing: 'border-box' }}>
            <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.76)' }}>3. Decision</p>
            <p style={{ margin: '10px 0 0 0', fontSize: 20, lineHeight: 1.24, color: '#FFFFFF' }}>Management should protect high-performing channels before broadening spend.</p>
          </article>
        </div>

        <div style={FOOTER_STYLE}>
          <span>Prepared for leadership review</span>
          <span>Source: vendas.pedidos, vendas.pedidos_itens</span>
        </div>
      </section>
    </SlideMarker>

    <SlideMarker id="summary" title="Summary" width={1280} height={720}>
      <section style={PAGE_STYLE}>
        <header style={HEADER_STYLE}>
          <div style={RULE_STYLE} />
          <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#74839A' }}>Executive summary</p>
          <h2 data-ui="title" style={HEADLINE_STYLE}>Commercial performance is still healthy, but recent gains are being delivered by a narrower base than before</h2>
          <p style={SUBTITLE_STYLE}>The purpose of this page is to establish the topline fact pattern before moving into the exhibits.</p>
        </header>

        <div style={KPI_ROW_STYLE}>
          <QueryMarker dataQuery={{ query: 'SELECT COALESCE(SUM(p.valor_total), 0)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}}', limit: 1 }} format="currency" comparisonMode="previous_period">
            <article data-ui="card" style={KPI_CARD_STYLE}>
              <p data-ui="kpi-title" style={{ margin: 0, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7B8798' }}>Revenue</p>
              <h3 data-ui="kpi-value" style={{ margin: '10px 0 6px 0', fontSize: 30, lineHeight: 0.96, letterSpacing: '-0.06em', color: '#17243A' }}>{'{{query.valueFormatted}}'}</h3>
              <p style={{ margin: 0, fontSize: 12, color: '#5B6B83' }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
            </article>
          </QueryMarker>
          <QueryMarker dataQuery={{ query: 'SELECT COUNT(*)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}}', limit: 1 }} format="number" comparisonMode="previous_period">
            <article data-ui="card" style={KPI_CARD_STYLE}>
              <p data-ui="kpi-title" style={{ margin: 0, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7B8798' }}>Orders</p>
              <h3 data-ui="kpi-value" style={{ margin: '10px 0 6px 0', fontSize: 30, lineHeight: 0.96, letterSpacing: '-0.06em', color: '#17243A' }}>{'{{query.valueFormatted}}'}</h3>
              <p style={{ margin: 0, fontSize: 12, color: '#5B6B83' }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
            </article>
          </QueryMarker>
          <QueryMarker dataQuery={{ query: 'SELECT COALESCE(AVG(p.valor_total), 0)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}}', limit: 1 }} format="currency" comparisonMode="previous_period">
            <article data-ui="card" style={KPI_CARD_STYLE}>
              <p data-ui="kpi-title" style={{ margin: 0, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7B8798' }}>Average ticket</p>
              <h3 data-ui="kpi-value" style={{ margin: '10px 0 6px 0', fontSize: 30, lineHeight: 0.96, letterSpacing: '-0.06em', color: '#17243A' }}>{'{{query.valueFormatted}}'}</h3>
              <p style={{ margin: 0, fontSize: 12, color: '#5B6B83' }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
            </article>
          </QueryMarker>
          <QueryMarker dataQuery={{ query: 'SELECT COUNT(DISTINCT p.canal_venda_id)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}}', limit: 1 }} format="number" comparisonMode="previous_period">
            <article data-ui="card" style={KPI_CARD_STYLE}>
              <p data-ui="kpi-title" style={{ margin: 0, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7B8798' }}>Active channels</p>
              <h3 data-ui="kpi-value" style={{ margin: '10px 0 6px 0', fontSize: 30, lineHeight: 0.96, letterSpacing: '-0.06em', color: '#17243A' }}>{'{{query.valueFormatted}}'}</h3>
              <p style={{ margin: 0, fontSize: 12, color: '#5B6B83' }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
            </article>
          </QueryMarker>
        </div>

        <section
          style={{
            marginTop: 20,
            padding: '22px 24px',
            borderRadius: 12,
            border: '1px solid #D8E1EE',
            backgroundColor: '#F8FAFD',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <p style={{ margin: 0, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.10em', color: '#6E7B8D' }}>Key message</p>
          <p style={{ margin: 0, fontSize: 26, lineHeight: 1.18, letterSpacing: '-0.05em', color: '#17243A', maxWidth: 920 }}>
            <strong>Commercial momentum remains intact,</strong> but the business is relying on a narrower set of channels to sustain that performance.
          </p>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: '#4F6078', maxWidth: 900 }}>
            Leadership should therefore read the topline with more caution: the quarter is still strong, but the <strong>quality of growth is becoming more concentrated</strong>.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div style={{ padding: '12px 14px', borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid #E1E8F2' }}>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: '#425571' }}><strong>Topline is not the issue:</strong> revenue and order flow remain supportive.</p>
            </div>
            <div style={{ padding: '12px 14px', borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid #E1E8F2' }}>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: '#425571' }}><strong>Quality is the issue:</strong> growth depends on a narrower contribution base.</p>
            </div>
            <div style={{ padding: '12px 14px', borderRadius: 10, backgroundColor: '#FFFFFF', border: '1px solid #E1E8F2' }}>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: '#425571' }}><strong>What follows:</strong> the next pages isolate where management attention is now required.</p>
            </div>
          </div>
        </section>

        <div style={FOOTER_STYLE}>
          <span>Executive commercial review</span>
          <span>1</span>
        </div>
      </section>
    </SlideMarker>

    <SlideMarker id="trend" title="Trend" width={1280} height={720}>
      <section style={PAGE_STYLE}>
        <header style={HEADER_STYLE}>
          <div style={RULE_STYLE} />
          <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#74839A' }}>Exhibit 1</p>
          <h2 data-ui="title" style={HEADLINE_STYLE}>Revenue continued to grow through the quarter, although the slope softened in the most recent periods</h2>
          <p style={SUBTITLE_STYLE}>The exhibit should dominate the page; interpretation sits below the evidence rather than in a competing side column.</p>
        </header>

        <article data-ui="card" style={EXHIBIT_STYLE}>
          <ChartMarker
            type="line"
            height={370}
            format="currency"
            dataQuery={{
              query: "SELECT TO_CHAR(p.data_pedido::date, 'YYYY-MM-DD') AS key, TO_CHAR(p.data_pedido::date, 'DD/MM') AS label, COALESCE(SUM(p.valor_total), 0)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}} GROUP BY 1, 2 ORDER BY 1 ASC",
              xField: 'label',
              yField: 'value',
              keyField: 'key',
              limit: 31,
            }}
            recharts={{ showDots: false, singleSeriesGradient: true, valueAxisWidth: 72 }}
          />
        </article>

        <div style={TAKEAWAY_ROW_STYLE}>
          <article data-ui="card" style={TAKEAWAY_CARD_STYLE}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#425571' }}>The topline trend remains directionally positive across the observed period.</p>
          </article>
          <article data-ui="card" style={TAKEAWAY_CARD_STYLE}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#425571' }}>The key risk is not contraction, but a loss of acceleration.</p>
          </article>
          <article data-ui="card" style={TAKEAWAY_CARD_STYLE}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#425571' }}>Management should now focus on what is driving the weaker slope in the later periods.</p>
          </article>
        </div>

        <div style={FOOTER_STYLE}>
          <span>Source: sales orders by order date</span>
          <span>2</span>
        </div>
      </section>
    </SlideMarker>

    <SlideMarker id="mix" title="Mix" width={1280} height={720}>
      <section style={PAGE_STYLE}>
        <header style={HEADER_STYLE}>
          <div style={RULE_STYLE} />
          <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#74839A' }}>Exhibit 2</p>
          <h2 data-ui="title" style={HEADLINE_STYLE}>Two channels now account for most revenue, increasing concentration risk despite continued portfolio breadth</h2>
          <p style={SUBTITLE_STYLE}>This page isolates concentration as the main management question rather than blending it with unrelated commentary.</p>
        </header>

        <article data-ui="card" style={EXHIBIT_STYLE}>
          <ChartMarker
            type="bar"
            height={340}
            format="currency"
            dataQuery={{
              query: "SELECT COALESCE(cv.id::text, COALESCE(cv.nome, '-')) AS key, COALESCE(cv.nome, '-') AS label, COALESCE(SUM(pi.subtotal), 0)::float AS value FROM vendas.pedidos p JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id WHERE 1=1 {{filters:p}} GROUP BY 1, 2 ORDER BY 3 DESC",
              xField: 'label',
              yField: 'value',
              keyField: 'key',
              dimension: 'canal_venda',
              limit: 6,
            }}
            recharts={{ categoryLabelMode: 'first-word', valueAxisWidth: 72 }}
          />
        </article>

        <div style={TAKEAWAY_ROW_STYLE}>
          <article data-ui="card" style={TAKEAWAY_CARD_STYLE}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#425571' }}>The largest channels now contribute a disproportionate share of total revenue.</p>
          </article>
          <article data-ui="card" style={TAKEAWAY_CARD_STYLE}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#425571' }}>Mid-tier channels still provide support, but they are not large enough to offset further concentration.</p>
          </article>
          <article data-ui="card" style={TAKEAWAY_CARD_STYLE}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#425571' }}>Resource allocation should prioritize defending the highest-converting channels while testing recovery plays selectively.</p>
          </article>
        </div>

        <div style={FOOTER_STYLE}>
          <span>Source: sales revenue by channel</span>
          <span>3</span>
        </div>
      </section>
    </SlideMarker>

    <SlideMarker id="detail" title="Detail" width={1280} height={720}>
      <section style={PAGE_STYLE}>
        <header style={HEADER_STYLE}>
          <div style={RULE_STYLE} />
          <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#74839A' }}>Exhibit 3</p>
          <h2 data-ui="title" style={HEADLINE_STYLE}>Detailed records show that concentration coincides with uneven status quality across channels</h2>
          <p style={SUBTITLE_STYLE}>The point of this exhibit is to challenge the headline with transaction-level evidence, not to become a second dashboard.</p>
        </header>

        <article data-ui="table-card" style={{ ...EXHIBIT_STYLE, padding: 14 }}>
          <TableMarker
            height={300}
            bordered
            rounded
            stickyHeader
            dataQuery={{
              query: "SELECT p.id::text AS pedido_id, TO_CHAR(p.data_pedido::date, 'DD/MM/YYYY') AS data_pedido, COALESCE(cv.nome, '-') AS canal, COALESCE(p.status, 'Sem status') AS status, COALESCE(p.valor_total, 0)::float AS valor_total FROM vendas.pedidos p LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id WHERE 1=1 {{filters:p}} ORDER BY p.data_pedido DESC NULLS LAST, p.id DESC",
              limit: 10,
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

        <div style={TAKEAWAY_ROW_STYLE}>
          <article data-ui="card" style={TAKEAWAY_CARD_STYLE}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#425571' }}>Record-level review helps separate stable topline from quality-adjusted revenue.</p>
          </article>
          <article data-ui="card" style={TAKEAWAY_CARD_STYLE}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#425571' }}>Status mix should be monitored because it indicates how much of reported revenue is operationally secure.</p>
          </article>
          <article data-ui="card" style={TAKEAWAY_CARD_STYLE}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#425571' }}>The table earns the width of the page; everything else remains subordinate.</p>
          </article>
        </div>

        <div style={FOOTER_STYLE}>
          <span>Source: sales orders detail</span>
          <span>4</span>
        </div>
      </section>
    </SlideMarker>

    <SlideMarker id="actions" title="Actions" width={1280} height={720}>
      <section style={PAGE_STYLE}>
        <header style={HEADER_STYLE}>
          <div style={RULE_STYLE} />
          <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#74839A' }}>Management implications</p>
          <h2 data-ui="title" style={HEADLINE_STYLE}>Management should protect winning channels, review weaker mix quality, and use detail pages to challenge the topline narrative</h2>
          <p style={SUBTITLE_STYLE}>The final page consolidates the recommendation set and grounds it in the supporting appendix.</p>
        </header>

        <article data-ui="pivot-card" style={{ ...EXHIBIT_STYLE, padding: 14 }}>
          <PivotTableMarker
            height={250}
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

        <div style={TAKEAWAY_ROW_STYLE}>
          <article data-ui="card" style={TAKEAWAY_CARD_STYLE}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#425571' }}><strong>Protect:</strong> concentrate incremental investment in the channels already converting efficiently.</p>
          </article>
          <article data-ui="card" style={TAKEAWAY_CARD_STYLE}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#425571' }}><strong>Review:</strong> investigate whether weaker channels are diluting growth quality or simply lagging temporarily.</p>
          </article>
          <article data-ui="card" style={TAKEAWAY_CARD_STYLE}>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#425571' }}><strong>Challenge:</strong> use operational detail as a standing control against overly optimistic topline messaging.</p>
          </article>
        </div>

        <div style={FOOTER_STYLE}>
          <span>Source: revenue by channel and status</span>
          <span>5</span>
        </div>
      </section>
    </SlideMarker>
  </SlideTemplateMarker>
)
