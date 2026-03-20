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

export const SLIDE_TEMPLATE_SOURCE = String.raw`<SlideTemplate title="Market Storytelling Deck" name="deck_mercado">
  <Theme name="light" />

  <Slide id="cover" title="Cover">
    <section style={{ display: 'grid', gridTemplateColumns: '1.18fr 0.82fr', height: '100%', background: 'linear-gradient(135deg, #0D1B52 0%, #1A2E7A 62%, #243A92 100%)' }}>
      <div style={{ padding: '58px 54px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#FFFFFF' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <p style={{ margin: 0, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.16em', opacity: 0.74 }}>Q1 2026 subscription review</p>
          <h1 style={{ margin: 0, fontSize: 54, lineHeight: 0.96, letterSpacing: '-0.06em', maxWidth: 520 }}>State of growth across subscription apps</h1>
          <p style={{ margin: 0, maxWidth: 430, fontSize: 16, lineHeight: 1.7, color: 'rgba(255,255,255,0.82)' }}>
            Six slides built as an executive story: momentum, channel mix, operational detail and the few actions that actually deserve escalation.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end' }}>
          <div style={{ width: 76, height: 10, borderRadius: 999, backgroundColor: '#4F7CFF' }} />
          <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.68)' }}>Prepared for leadership review</p>
        </div>
      </div>
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, #F35B5B 0%, #C83232 100%)' }}>
        <div style={{ position: 'absolute', inset: '44px 38px auto auto', width: 144, height: 144, borderRadius: '28px', backgroundColor: 'rgba(255,255,255,0.10)' }} />
        <div style={{ position: 'absolute', inset: 'auto auto 46px 44px', width: 182, height: 182, borderRadius: '38px', border: '1px solid rgba(255,255,255,0.16)' }} />
        <div style={{ position: 'absolute', inset: '54px 46px 54px 46px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <p style={{ margin: 0, fontSize: 92, lineHeight: 0.88, letterSpacing: '-0.08em', color: '#FFFFFF' }}>01</p>
            <p style={{ margin: '10px 0 0 0', fontSize: 32, lineHeight: 1.02, letterSpacing: '-0.05em', color: '#FFFFFF' }}>Executive market pulse</p>
          </div>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: 'rgba(255,255,255,0.84)', maxWidth: 260 }}>
            A cleaner slide system where the layout stays editorial and the data components stay tightly scoped.
          </p>
        </div>
      </div>
    </section>
  </Slide>

  <Slide id="thesis" title="Thesis">
    <section style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 22, height: '100%', padding: 42, background: 'linear-gradient(180deg, #F6F8FD 0%, #EEF3FF 100%)' }}>
      <article data-ui="card" style={{ padding: 28, borderRadius: 28, backgroundColor: '#FFFFFF', border: '1px solid #DCE5F6', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p data-ui="eyebrow" style={{ margin: 0, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6E7F98' }}>Presentation thesis</p>
          <h2 data-ui="title" style={{ margin: 0, fontSize: 34, lineHeight: 1.04, letterSpacing: '-0.05em', color: '#16233A', maxWidth: 520 }}>
            Growth stayed broad enough to support the story, but concentration is now the key executive question.
          </h2>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.75, color: '#4D5F7D', maxWidth: 540 }}>
            The deck shifts away from dashboard density. Each page isolates one idea, and the right-side narrative frames what leadership should actually read from the numbers.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          <article style={{ padding: 18, borderRadius: 20, backgroundColor: '#0D1B52' }}>
            <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.66)' }}>Read this first</p>
            <p style={{ margin: '10px 0 0 0', fontSize: 20, lineHeight: 1.2, letterSpacing: '-0.04em', color: '#FFFFFF' }}>Momentum remains intact, but mix quality matters more than topline alone.</p>
          </article>
          <article style={{ padding: 18, borderRadius: 20, backgroundColor: '#F35B5B' }}>
            <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.72)' }}>Operator note</p>
            <p style={{ margin: '10px 0 0 0', fontSize: 20, lineHeight: 1.2, letterSpacing: '-0.04em', color: '#FFFFFF' }}>The next section isolates where revenue quality is strongest and where the portfolio is thinning out.</p>
          </article>
        </div>
      </article>

      <div style={{ display: 'grid', gridTemplateRows: 'repeat(3, 1fr)', gap: 14 }}>
        <Query dataQuery={{ query: "SELECT COALESCE(SUM(p.valor_total), 0)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}}", limit: 1 }} format="currency" comparisonMode="previous_period">
          <article data-ui="card" style={{ padding: 20, borderRadius: 22, backgroundColor: '#FFFFFF', border: '1px solid #DCE5F6', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <p data-ui="kpi-title" style={{ margin: 0, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#74839A' }}>Revenue</p>
              <h3 data-ui="kpi-value" style={{ margin: '14px 0 8px 0', fontSize: 34, lineHeight: 0.96, letterSpacing: '-0.06em', color: '#16233A' }}>{'{{query.valueFormatted}}'}</h3>
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: '#50617B' }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
          </article>
        </Query>
        <Query dataQuery={{ query: "SELECT COUNT(*)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}}", limit: 1 }} format="number" comparisonMode="previous_period">
          <article data-ui="card" style={{ padding: 20, borderRadius: 22, backgroundColor: '#FFFFFF', border: '1px solid #DCE5F6', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <p data-ui="kpi-title" style={{ margin: 0, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#74839A' }}>Orders</p>
              <h3 data-ui="kpi-value" style={{ margin: '14px 0 8px 0', fontSize: 34, lineHeight: 0.96, letterSpacing: '-0.06em', color: '#16233A' }}>{'{{query.valueFormatted}}'}</h3>
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: '#50617B' }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
          </article>
        </Query>
        <Query dataQuery={{ query: "SELECT COALESCE(AVG(p.valor_total), 0)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}}", limit: 1 }} format="currency" comparisonMode="previous_period">
          <article data-ui="card" style={{ padding: 20, borderRadius: 22, backgroundColor: '#FFFFFF', border: '1px solid #DCE5F6', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <p data-ui="kpi-title" style={{ margin: 0, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#74839A' }}>Average ticket</p>
              <h3 data-ui="kpi-value" style={{ margin: '14px 0 8px 0', fontSize: 34, lineHeight: 0.96, letterSpacing: '-0.06em', color: '#16233A' }}>{'{{query.valueFormatted}}'}</h3>
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: '#50617B' }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
          </article>
        </Query>
      </div>
    </section>
  </Slide>

  <Slide id="trend" title="Trend">
    <section style={{ display: 'grid', gridTemplateColumns: '1.32fr 0.68fr', gap: 18, height: '100%', padding: 34, backgroundColor: '#F7F9FE' }}>
      <article data-ui="card" style={{ padding: 24, borderRadius: 26, backgroundColor: '#FFFFFF', border: '1px solid #DDE6F5', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#74839A' }}>Revenue trajectory</p>
          <h2 data-ui="title" style={{ margin: 0, fontSize: 28, lineHeight: 1.02, letterSpacing: '-0.05em', color: '#16233A' }}>Monthly revenue continues to rise, but the slope is narrowing.</h2>
        </div>
        <Chart
          type="line"
          height={430}
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

      <div style={{ display: 'grid', gridTemplateRows: '1.1fr 0.9fr', gap: 16 }}>
        <article style={{ padding: 24, borderRadius: 26, background: 'linear-gradient(180deg, #355EFF 0%, #1737A6 100%)', color: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.70)' }}>Narrative</p>
            <p style={{ margin: 0, fontSize: 23, lineHeight: 1.18, letterSpacing: '-0.04em' }}>
              The business still looks healthy on the topline. What changed is the consistency of acceleration, which is no longer uniform across the portfolio.
            </p>
          </div>
          <div style={{ width: 110, height: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.86)' }} />
        </article>

        <article data-ui="card" style={{ padding: 22, borderRadius: 26, backgroundColor: '#FFFFFF', border: '1px solid #DDE6F5', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#74839A' }}>Takeaways</p>
          <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <li style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#31445E' }}>Momentum remains positive enough to support the growth story.</li>
            <li style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#31445E' }}>The leadership question is not whether growth exists, but which lines still deserve incremental investment.</li>
            <li style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#31445E' }}>The next slide isolates where channel concentration is becoming visible.</li>
          </ul>
        </article>
      </div>
    </section>
  </Slide>

  <Slide id="mix" title="Mix">
    <section style={{ display: 'grid', gridTemplateColumns: '1.02fr 0.98fr', gap: 18, height: '100%', padding: 34, backgroundColor: '#FBFCFF' }}>
      <article data-ui="card" style={{ padding: 22, borderRadius: 26, backgroundColor: '#FFFFFF', border: '1px solid #DDE6F5', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#74839A' }}>Channel mix</p>
          <h2 data-ui="title" style={{ margin: 0, fontSize: 28, lineHeight: 1.02, letterSpacing: '-0.05em', color: '#16233A' }}>A smaller set of channels is carrying most of the commercial story.</h2>
        </div>
        <Chart
          type="bar"
          height={360}
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

      <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 16 }}>
        <article data-ui="card" style={{ padding: 22, borderRadius: 26, backgroundColor: '#FFFFFF', border: '1px solid #DDE6F5', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#74839A' }}>Share view</p>
          <Chart
            type="pie"
            height={230}
            format="currency"
            colorScheme={['#355EFF', '#57A6FF', '#26B3A0', '#FF8A4A', '#B76CFF']}
            dataQuery={{
              query: "SELECT COALESCE(cv.id::text, COALESCE(cv.nome, '-')) AS key, COALESCE(cv.nome, '-') AS label, COALESCE(SUM(pi.subtotal), 0)::float AS value FROM vendas.pedidos p JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id WHERE 1=1 {{filters:p}} GROUP BY 1, 2 ORDER BY 3 DESC",
              xField: 'label',
              yField: 'value',
              keyField: 'key',
              dimension: 'canal_venda',
              limit: 5,
            }}
            recharts={{ innerRadius: 46, outerRadius: 82, showLabels: false, legendPosition: 'right' }}
          />
        </article>

        <article style={{ padding: 24, borderRadius: 26, background: 'linear-gradient(180deg, #F35B5B 0%, #D23F42 100%)', color: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.72)' }}>Interpretation</p>
            <p style={{ margin: 0, fontSize: 24, lineHeight: 1.16, letterSpacing: '-0.04em' }}>
              Channel breadth still looks acceptable, but contribution is clearly more concentrated than the topline alone suggests.
            </p>
          </div>
          <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: 'rgba(255,255,255,0.84)' }}>
            This is the point where portfolio resilience stops being a generic message and becomes a capital allocation decision.
          </p>
        </article>
      </div>
    </section>
  </Slide>

  <Slide id="detail" title="Detail">
    <section style={{ display: 'grid', gridTemplateColumns: '1.14fr 0.86fr', gap: 16, height: '100%', padding: 30, backgroundColor: '#FFFFFF' }}>
      <article data-ui="table-card" style={{ padding: 18, borderRadius: 24, backgroundColor: '#FFFFFF', border: '1px solid #E3EAF5', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#74839A' }}>Detail table</p>
          <h2 data-ui="title" style={{ margin: 0, fontSize: 26, lineHeight: 1.03, letterSpacing: '-0.05em', color: '#16233A' }}>Operational detail behind the narrative</h2>
        </div>
        <Table
          height={470}
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

      <div style={{ display: 'grid', gridTemplateRows: '0.78fr 1.22fr', gap: 16 }}>
        <article style={{ padding: 22, borderRadius: 24, backgroundColor: '#0D1B52', color: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.68)' }}>What operators need</p>
            <p style={{ margin: 0, fontSize: 22, lineHeight: 1.18, letterSpacing: '-0.04em' }}>
              After the strategic story, leaders still need one slide where records, status distribution and mix quality can be challenged.
            </p>
          </div>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.82)' }}>The table carries the exception view. The pivot below compresses the revenue pattern by channel and status.</p>
        </article>

        <article data-ui="pivot-card" style={{ padding: 18, borderRadius: 24, backgroundColor: '#F6F9FF', border: '1px solid #E3EAF5', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#74839A' }}>Pivot summary</p>
          <PivotTable
            height={300}
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
      </div>
    </section>
  </Slide>

  <Slide id="close" title="Close">
    <section style={{ display: 'grid', gridTemplateColumns: '0.96fr 1.04fr', gap: 18, height: '100%', padding: 38, background: 'linear-gradient(180deg, #EEF3FF 0%, #E5ECFF 100%)' }}>
      <article style={{ padding: 28, borderRadius: 28, background: 'linear-gradient(180deg, #F35B5B 0%, #C83232 100%)', color: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'rgba(255,255,255,0.74)' }}>Closing view</p>
          <h2 style={{ margin: 0, fontSize: 38, lineHeight: 0.98, letterSpacing: '-0.06em' }}>Three actions matter more than adding more pages.</h2>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.72, color: 'rgba(255,255,255,0.86)' }}>
            Keep funding the channels that still convert efficiently, challenge the parts of the mix where growth is flattening, and keep operational detail close enough to challenge the narrative.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: 'rgba(255,255,255,0.92)' }}>This is what the new slide runtime should feel like: fewer components, stronger hierarchy, cleaner narrative.</p>
          <div style={{ width: 132, height: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.84)' }} />
        </div>
      </article>

      <div style={{ display: 'grid', gridTemplateRows: 'repeat(3, 1fr)', gap: 14 }}>
        <Query dataQuery={{ query: "SELECT COALESCE(SUM(p.valor_total), 0)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}}", limit: 1 }} format="currency" comparisonMode="previous_period">
          <article data-ui="card" style={{ padding: 22, borderRadius: 24, backgroundColor: '#FFFFFF', border: '1px solid #DDE6F5', display: 'grid', gridTemplateColumns: '0.95fr 1.05fr', gap: 16, alignItems: 'center' }}>
            <div>
              <p data-ui="kpi-title" style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#74839A' }}>Topline to defend</p>
              <h3 data-ui="kpi-value" style={{ margin: '12px 0 0 0', fontSize: 32, lineHeight: 0.96, letterSpacing: '-0.06em', color: '#16233A' }}>{'{{query.valueFormatted}}'}</h3>
            </div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: '#425571' }}>Keep the momentum story simple: {'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}.</p>
          </article>
        </Query>
        <article data-ui="card" style={{ padding: 22, borderRadius: 24, backgroundColor: '#FFFFFF', border: '1px solid #DDE6F5', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <div style={{ padding: 14, borderRadius: 18, backgroundColor: '#F6F9FF' }}>
            <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#74839A' }}>01</p>
            <p style={{ margin: '10px 0 0 0', fontSize: 16, lineHeight: 1.35, color: '#26354F' }}>Protect winning channels.</p>
          </div>
          <div style={{ padding: 14, borderRadius: 18, backgroundColor: '#F6F9FF' }}>
            <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#74839A' }}>02</p>
            <p style={{ margin: '10px 0 0 0', fontSize: 16, lineHeight: 1.35, color: '#26354F' }}>Review concentration risk.</p>
          </div>
          <div style={{ padding: 14, borderRadius: 18, backgroundColor: '#F6F9FF' }}>
            <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#74839A' }}>03</p>
            <p style={{ margin: '10px 0 0 0', fontSize: 16, lineHeight: 1.35, color: '#26354F' }}>Use detail to challenge the story.</p>
          </div>
        </article>
        <article data-ui="card" style={{ padding: 22, borderRadius: 24, backgroundColor: '#0D1B52', border: '1px solid #18337F', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.66)' }}>Final message</p>
            <p style={{ margin: '8px 0 0 0', fontSize: 22, lineHeight: 1.18, letterSpacing: '-0.04em' }}>The slide system is now presentation-first without giving up data.</p>
          </div>
          <div style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.08)' }} />
        </article>
      </div>
    </section>
  </Slide>
</SlideTemplate>`

export const SLIDE_TEMPLATE = (
  <SlideTemplateMarker title="Market Storytelling Deck" name="deck_mercado">
    <ThemeMarker name="light" />

    <SlideMarker id="cover" title="Cover">
      <section style={{ display: 'grid', gridTemplateColumns: '1.18fr 0.82fr', height: '100%', background: 'linear-gradient(135deg, #0D1B52 0%, #1A2E7A 62%, #243A92 100%)' }}>
        <div style={{ padding: '58px 54px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: '#FFFFFF' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <p style={{ margin: 0, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.16em', opacity: 0.74 }}>Q1 2026 subscription review</p>
            <h1 style={{ margin: 0, fontSize: 54, lineHeight: 0.96, letterSpacing: '-0.06em', maxWidth: 520 }}>State of growth across subscription apps</h1>
            <p style={{ margin: 0, maxWidth: 430, fontSize: 16, lineHeight: 1.7, color: 'rgba(255,255,255,0.82)' }}>
              Six slides built as an executive story: momentum, channel mix, operational detail and the few actions that actually deserve escalation.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end' }}>
            <div style={{ width: 76, height: 10, borderRadius: 999, backgroundColor: '#4F7CFF' }} />
            <p style={{ margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.68)' }}>Prepared for leadership review</p>
          </div>
        </div>
        <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, #F35B5B 0%, #C83232 100%)' }}>
          <div style={{ position: 'absolute', inset: '44px 38px auto auto', width: 144, height: 144, borderRadius: '28px', backgroundColor: 'rgba(255,255,255,0.10)' }} />
          <div style={{ position: 'absolute', inset: 'auto auto 46px 44px', width: 182, height: 182, borderRadius: '38px', border: '1px solid rgba(255,255,255,0.16)' }} />
          <div style={{ position: 'absolute', inset: '54px 46px 54px 46px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <p style={{ margin: 0, fontSize: 92, lineHeight: 0.88, letterSpacing: '-0.08em', color: '#FFFFFF' }}>01</p>
              <p style={{ margin: '10px 0 0 0', fontSize: 32, lineHeight: 1.02, letterSpacing: '-0.05em', color: '#FFFFFF' }}>Executive market pulse</p>
            </div>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: 'rgba(255,255,255,0.84)', maxWidth: 260 }}>
              A cleaner slide system where the layout stays editorial and the data components stay tightly scoped.
            </p>
          </div>
        </div>
      </section>
    </SlideMarker>

    <SlideMarker id="thesis" title="Thesis">
      <section style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 22, height: '100%', padding: 42, background: 'linear-gradient(180deg, #F6F8FD 0%, #EEF3FF 100%)' }}>
        <article data-ui="card" style={{ padding: 28, borderRadius: 28, backgroundColor: '#FFFFFF', border: '1px solid #DCE5F6', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p data-ui="eyebrow" style={{ margin: 0, fontSize: 12, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6E7F98' }}>Presentation thesis</p>
            <h2 data-ui="title" style={{ margin: 0, fontSize: 34, lineHeight: 1.04, letterSpacing: '-0.05em', color: '#16233A', maxWidth: 520 }}>
              Growth stayed broad enough to support the story, but concentration is now the key executive question.
            </h2>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.75, color: '#4D5F7D', maxWidth: 540 }}>
              The deck shifts away from dashboard density. Each page isolates one idea, and the right-side narrative frames what leadership should actually read from the numbers.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            <article style={{ padding: 18, borderRadius: 20, backgroundColor: '#0D1B52' }}>
              <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.66)' }}>Read this first</p>
              <p style={{ margin: '10px 0 0 0', fontSize: 20, lineHeight: 1.2, letterSpacing: '-0.04em', color: '#FFFFFF' }}>Momentum remains intact, but mix quality matters more than topline alone.</p>
            </article>
            <article style={{ padding: 18, borderRadius: 20, backgroundColor: '#F35B5B' }}>
              <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.72)' }}>Operator note</p>
              <p style={{ margin: '10px 0 0 0', fontSize: 20, lineHeight: 1.2, letterSpacing: '-0.04em', color: '#FFFFFF' }}>The next section isolates where revenue quality is strongest and where the portfolio is thinning out.</p>
            </article>
          </div>
        </article>

        <div style={{ display: 'grid', gridTemplateRows: 'repeat(3, 1fr)', gap: 14 }}>
          <QueryMarker
            dataQuery={{ query: "SELECT COALESCE(SUM(p.valor_total), 0)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}}", limit: 1 }}
            format="currency"
            comparisonMode="previous_period"
          >
            <article data-ui="card" style={{ padding: 20, borderRadius: 22, backgroundColor: '#FFFFFF', border: '1px solid #DCE5F6', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <p data-ui="kpi-title" style={{ margin: 0, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#74839A' }}>Revenue</p>
                <h3 data-ui="kpi-value" style={{ margin: '14px 0 8px 0', fontSize: 34, lineHeight: 0.96, letterSpacing: '-0.06em', color: '#16233A' }}>{'{{query.valueFormatted}}'}</h3>
              </div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: '#50617B' }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
            </article>
          </QueryMarker>
          <QueryMarker
            dataQuery={{ query: "SELECT COUNT(*)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}}", limit: 1 }}
            format="number"
            comparisonMode="previous_period"
          >
            <article data-ui="card" style={{ padding: 20, borderRadius: 22, backgroundColor: '#FFFFFF', border: '1px solid #DCE5F6', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <p data-ui="kpi-title" style={{ margin: 0, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#74839A' }}>Orders</p>
                <h3 data-ui="kpi-value" style={{ margin: '14px 0 8px 0', fontSize: 34, lineHeight: 0.96, letterSpacing: '-0.06em', color: '#16233A' }}>{'{{query.valueFormatted}}'}</h3>
              </div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: '#50617B' }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
            </article>
          </QueryMarker>
          <QueryMarker
            dataQuery={{ query: "SELECT COALESCE(AVG(p.valor_total), 0)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}}", limit: 1 }}
            format="currency"
            comparisonMode="previous_period"
          >
            <article data-ui="card" style={{ padding: 20, borderRadius: 22, backgroundColor: '#FFFFFF', border: '1px solid #DCE5F6', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <p data-ui="kpi-title" style={{ margin: 0, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#74839A' }}>Average ticket</p>
                <h3 data-ui="kpi-value" style={{ margin: '14px 0 8px 0', fontSize: 34, lineHeight: 0.96, letterSpacing: '-0.06em', color: '#16233A' }}>{'{{query.valueFormatted}}'}</h3>
              </div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: '#50617B' }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
            </article>
          </QueryMarker>
        </div>
      </section>
    </SlideMarker>

    <SlideMarker id="trend" title="Trend">
      <section style={{ display: 'grid', gridTemplateColumns: '1.32fr 0.68fr', gap: 18, height: '100%', padding: 34, backgroundColor: '#F7F9FE' }}>
        <article data-ui="card" style={{ padding: 24, borderRadius: 26, backgroundColor: '#FFFFFF', border: '1px solid #DDE6F5', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#74839A' }}>Revenue trajectory</p>
            <h2 data-ui="title" style={{ margin: 0, fontSize: 28, lineHeight: 1.02, letterSpacing: '-0.05em', color: '#16233A' }}>Monthly revenue continues to rise, but the slope is narrowing.</h2>
          </div>
          <ChartMarker
            type="line"
            height={430}
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

        <div style={{ display: 'grid', gridTemplateRows: '1.1fr 0.9fr', gap: 16 }}>
          <article style={{ padding: 24, borderRadius: 26, background: 'linear-gradient(180deg, #355EFF 0%, #1737A6 100%)', color: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.70)' }}>Narrative</p>
              <p style={{ margin: 0, fontSize: 23, lineHeight: 1.18, letterSpacing: '-0.04em' }}>
                The business still looks healthy on the topline. What changed is the consistency of acceleration, which is no longer uniform across the portfolio.
              </p>
            </div>
            <div style={{ width: 110, height: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.86)' }} />
          </article>

          <article data-ui="card" style={{ padding: 22, borderRadius: 26, backgroundColor: '#FFFFFF', border: '1px solid #DDE6F5', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#74839A' }}>Takeaways</p>
            <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <li style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#31445E' }}>Momentum remains positive enough to support the growth story.</li>
              <li style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#31445E' }}>The leadership question is not whether growth exists, but which lines still deserve incremental investment.</li>
              <li style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: '#31445E' }}>The next slide isolates where channel concentration is becoming visible.</li>
            </ul>
          </article>
        </div>
      </section>
    </SlideMarker>

    <SlideMarker id="mix" title="Mix">
      <section style={{ display: 'grid', gridTemplateColumns: '1.02fr 0.98fr', gap: 18, height: '100%', padding: 34, backgroundColor: '#FBFCFF' }}>
        <article data-ui="card" style={{ padding: 22, borderRadius: 26, backgroundColor: '#FFFFFF', border: '1px solid #DDE6F5', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#74839A' }}>Channel mix</p>
            <h2 data-ui="title" style={{ margin: 0, fontSize: 28, lineHeight: 1.02, letterSpacing: '-0.05em', color: '#16233A' }}>A smaller set of channels is carrying most of the commercial story.</h2>
          </div>
          <ChartMarker
            type="bar"
            height={360}
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

        <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 16 }}>
          <article data-ui="card" style={{ padding: 22, borderRadius: 26, backgroundColor: '#FFFFFF', border: '1px solid #DDE6F5', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#74839A' }}>Share view</p>
            <ChartMarker
              type="pie"
              height={230}
              format="currency"
              colorScheme={['#355EFF', '#57A6FF', '#26B3A0', '#FF8A4A', '#B76CFF']}
              dataQuery={{
                query: "SELECT COALESCE(cv.id::text, COALESCE(cv.nome, '-')) AS key, COALESCE(cv.nome, '-') AS label, COALESCE(SUM(pi.subtotal), 0)::float AS value FROM vendas.pedidos p JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id WHERE 1=1 {{filters:p}} GROUP BY 1, 2 ORDER BY 3 DESC",
                xField: 'label',
                yField: 'value',
                keyField: 'key',
                dimension: 'canal_venda',
                limit: 5,
              }}
              recharts={{ innerRadius: 46, outerRadius: 82, showLabels: false, legendPosition: 'right' }}
            />
          </article>

          <article style={{ padding: 24, borderRadius: 26, background: 'linear-gradient(180deg, #F35B5B 0%, #D23F42 100%)', color: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.72)' }}>Interpretation</p>
              <p style={{ margin: 0, fontSize: 24, lineHeight: 1.16, letterSpacing: '-0.04em' }}>
                Channel breadth still looks acceptable, but contribution is clearly more concentrated than the topline alone suggests.
              </p>
            </div>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: 'rgba(255,255,255,0.84)' }}>
              This is the point where portfolio resilience stops being a generic message and becomes a capital allocation decision.
            </p>
          </article>
        </div>
      </section>
    </SlideMarker>

    <SlideMarker id="detail" title="Detail">
      <section style={{ display: 'grid', gridTemplateColumns: '1.14fr 0.86fr', gap: 16, height: '100%', padding: 30, backgroundColor: '#FFFFFF' }}>
        <article data-ui="table-card" style={{ padding: 18, borderRadius: 24, backgroundColor: '#FFFFFF', border: '1px solid #E3EAF5', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#74839A' }}>Detail table</p>
            <h2 data-ui="title" style={{ margin: 0, fontSize: 26, lineHeight: 1.03, letterSpacing: '-0.05em', color: '#16233A' }}>Operational detail behind the narrative</h2>
          </div>
          <TableMarker
            height={470}
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

        <div style={{ display: 'grid', gridTemplateRows: '0.78fr 1.22fr', gap: 16 }}>
          <article style={{ padding: 22, borderRadius: 24, backgroundColor: '#0D1B52', color: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.68)' }}>What operators need</p>
              <p style={{ margin: 0, fontSize: 22, lineHeight: 1.18, letterSpacing: '-0.04em' }}>
                After the strategic story, leaders still need one slide where records, status distribution and mix quality can be challenged.
              </p>
            </div>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.82)' }}>The table carries the exception view. The pivot below compresses the revenue pattern by channel and status.</p>
          </article>

          <article data-ui="pivot-card" style={{ padding: 18, borderRadius: 24, backgroundColor: '#F6F9FF', border: '1px solid #E3EAF5', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#74839A' }}>Pivot summary</p>
            <PivotTableMarker
              height={300}
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
        </div>
      </section>
    </SlideMarker>

    <SlideMarker id="close" title="Close">
      <section style={{ display: 'grid', gridTemplateColumns: '0.96fr 1.04fr', gap: 18, height: '100%', padding: 38, background: 'linear-gradient(180deg, #EEF3FF 0%, #E5ECFF 100%)' }}>
        <article style={{ padding: 28, borderRadius: 28, background: 'linear-gradient(180deg, #F35B5B 0%, #C83232 100%)', color: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'rgba(255,255,255,0.74)' }}>Closing view</p>
            <h2 style={{ margin: 0, fontSize: 38, lineHeight: 0.98, letterSpacing: '-0.06em' }}>Three actions matter more than adding more pages.</h2>
            <p style={{ margin: 0, fontSize: 16, lineHeight: 1.72, color: 'rgba(255,255,255,0.86)' }}>
              Keep funding the channels that still convert efficiently, challenge the parts of the mix where growth is flattening, and keep operational detail close enough to challenge the narrative.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: 'rgba(255,255,255,0.92)' }}>This is what the new slide runtime should feel like: fewer components, stronger hierarchy, cleaner narrative.</p>
            <div style={{ width: 132, height: 8, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.84)' }} />
          </div>
        </article>

        <div style={{ display: 'grid', gridTemplateRows: 'repeat(3, 1fr)', gap: 14 }}>
          <QueryMarker
            dataQuery={{ query: "SELECT COALESCE(SUM(p.valor_total), 0)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}}", limit: 1 }}
            format="currency"
            comparisonMode="previous_period"
          >
            <article data-ui="card" style={{ padding: 22, borderRadius: 24, backgroundColor: '#FFFFFF', border: '1px solid #DDE6F5', display: 'grid', gridTemplateColumns: '0.95fr 1.05fr', gap: 16, alignItems: 'center' }}>
              <div>
                <p data-ui="kpi-title" style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#74839A' }}>Topline to defend</p>
                <h3 data-ui="kpi-value" style={{ margin: '12px 0 0 0', fontSize: 32, lineHeight: 0.96, letterSpacing: '-0.06em', color: '#16233A' }}>{'{{query.valueFormatted}}'}</h3>
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: '#425571' }}>Keep the momentum story simple: {'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}.</p>
            </article>
          </QueryMarker>
          <article data-ui="card" style={{ padding: 22, borderRadius: 24, backgroundColor: '#FFFFFF', border: '1px solid #DDE6F5', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div style={{ padding: 14, borderRadius: 18, backgroundColor: '#F6F9FF' }}>
              <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#74839A' }}>01</p>
              <p style={{ margin: '10px 0 0 0', fontSize: 16, lineHeight: 1.35, color: '#26354F' }}>Protect winning channels.</p>
            </div>
            <div style={{ padding: 14, borderRadius: 18, backgroundColor: '#F6F9FF' }}>
              <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#74839A' }}>02</p>
              <p style={{ margin: '10px 0 0 0', fontSize: 16, lineHeight: 1.35, color: '#26354F' }}>Review concentration risk.</p>
            </div>
            <div style={{ padding: 14, borderRadius: 18, backgroundColor: '#F6F9FF' }}>
              <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#74839A' }}>03</p>
              <p style={{ margin: '10px 0 0 0', fontSize: 16, lineHeight: 1.35, color: '#26354F' }}>Use detail to challenge the story.</p>
            </div>
          </article>
          <article data-ui="card" style={{ padding: 22, borderRadius: 24, backgroundColor: '#0D1B52', border: '1px solid #18337F', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <p style={{ margin: 0, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'rgba(255,255,255,0.66)' }}>Final message</p>
              <p style={{ margin: '8px 0 0 0', fontSize: 22, lineHeight: 1.18, letterSpacing: '-0.04em' }}>The slide system is now presentation-first without giving up data.</p>
            </div>
            <div style={{ width: 72, height: 72, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.08)' }} />
          </article>
        </div>
      </section>
    </SlideMarker>
  </SlideTemplateMarker>
)
