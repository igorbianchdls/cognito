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

export const SLIDE_TEMPLATE_SOURCE = String.raw`<SlideTemplate title="Apresentação Executiva" name="deck_dados">
  <Theme name="light" />

  <Slide id="overview" title="Overview">
    <section style={{ display: 'flex', flexDirection: 'column', gap: 18, height: '100%', padding: 42, backgroundColor: '#F4F8FF' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '56%' }}>
          <p style={{ margin: 0, fontSize: 12, color: '#5E79A5', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Q4 2025 SALES SNAPSHOT</p>
          <h1 style={{ margin: 0, fontSize: 38, fontWeight: 700, color: '#172033', letterSpacing: '-0.04em', lineHeight: 1.04 }}>Slide runtime with data components</h1>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: '#4D607F' }}>
            Layout stays HTML-first. Query, Chart, Table and PivotTable return only because they are presentation-facing data blocks.
          </p>
        </div>
        <article style={{ width: '30%', padding: 18, borderRadius: 22, backgroundColor: '#FFFFFF', border: '1px solid #D9E6FB' }}>
          <p style={{ margin: 0, fontSize: 11, color: '#6A7E9F', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Focus</p>
          <p style={{ margin: '10px 0 0 0', fontSize: 14, lineHeight: 1.6, color: '#33425F' }}>Slides stay narrative-first, so there are no slicers or datepickers here.</p>
        </article>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <Query dataQuery={{ query: 'SELECT COALESCE(SUM(p.valor_total), 0)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}}', limit: 1 }} format="currency" comparisonMode="previous_period">
          <article style={{ padding: 18, borderRadius: 20, backgroundColor: '#FFFFFF', border: '1px solid #D9E6FB' }}>
            <p style={{ margin: 0, fontSize: 11, color: '#6A7E9F', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Receita</p>
            <h2 style={{ margin: '10px 0 6px 0', fontSize: 28, color: '#172033', letterSpacing: '-0.04em' }}>{'{{query.valueFormatted}}'}</h2>
            <p style={{ margin: 0, fontSize: 12, color: '#51637F' }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
          </article>
        </Query>
        <Query dataQuery={{ query: 'SELECT COUNT(*)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}}', limit: 1 }} format="number" comparisonMode="previous_period">
          <article style={{ padding: 18, borderRadius: 20, backgroundColor: '#FFFFFF', border: '1px solid #D9E6FB' }}>
            <p style={{ margin: 0, fontSize: 11, color: '#6A7E9F', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pedidos</p>
            <h2 style={{ margin: '10px 0 6px 0', fontSize: 28, color: '#172033', letterSpacing: '-0.04em' }}>{'{{query.valueFormatted}}'}</h2>
            <p style={{ margin: 0, fontSize: 12, color: '#51637F' }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
          </article>
        </Query>
        <Query dataQuery={{ query: 'SELECT COALESCE(AVG(p.valor_total), 0)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}}', limit: 1 }} format="currency" comparisonMode="previous_period">
          <article style={{ padding: 18, borderRadius: 20, backgroundColor: '#FFFFFF', border: '1px solid #D9E6FB' }}>
            <p style={{ margin: 0, fontSize: 11, color: '#6A7E9F', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ticket medio</p>
            <h2 style={{ margin: '10px 0 6px 0', fontSize: 28, color: '#172033', letterSpacing: '-0.04em' }}>{'{{query.valueFormatted}}'}</h2>
            <p style={{ margin: 0, fontSize: 12, color: '#51637F' }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
          </article>
        </Query>
      </div>

      <article style={{ flex: 1, padding: 18, borderRadius: 24, backgroundColor: '#FFFFFF', border: '1px solid #D9E6FB' }}>
        <Chart
          type="line"
          height={300}
          format="currency"
          colorScheme={['#2563EB', '#60A5FA', '#93C5FD']}
          dataQuery={{
            query: `
              SELECT
                TO_CHAR(p.data_pedido::date, 'YYYY-MM-DD') AS key,
                TO_CHAR(p.data_pedido::date, 'DD/MM') AS label,
                COALESCE(SUM(p.valor_total), 0)::float AS value
              FROM vendas.pedidos p
              WHERE 1=1
                {{filters:p}}
              GROUP BY 1, 2
              ORDER BY 1 ASC
            `,
            xField: 'label',
            yField: 'value',
            keyField: 'key',
            limit: 31,
          }}
          recharts={{ showDots: false, singleSeriesGradient: true, valueAxisWidth: 72 }}
        />
      </article>
    </section>
  </Slide>

  <Slide id="detail" title="Detail">
    <section style={{ display: 'grid', gridTemplateColumns: '1.08fr 0.92fr', gap: 16, height: '100%', padding: 32, backgroundColor: '#FFFFFF' }}>
      <article style={{ padding: 18, borderRadius: 22, backgroundColor: '#FFFFFF', border: '1px solid #E5ECF8' }}>
        <p style={{ margin: 0, marginBottom: 10, fontSize: 11, color: '#7A879B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Table</p>
        <Table
          height={600}
          bordered
          rounded
          stickyHeader
          dataQuery={{
            query: `
              SELECT
                p.id::text AS pedido_id,
                TO_CHAR(p.data_pedido::date, 'DD/MM/YYYY') AS data_pedido,
                COALESCE(cv.nome, '-') AS canal,
                COALESCE(p.status, 'Sem status') AS status,
                COALESCE(p.valor_total, 0)::float AS valor_total
              FROM vendas.pedidos p
              LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
              WHERE 1=1
                {{filters:p}}
              ORDER BY p.data_pedido DESC NULLS LAST, p.id DESC
            `,
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

      <article style={{ padding: 18, borderRadius: 22, backgroundColor: '#F8FBFF', border: '1px solid #E5ECF8' }}>
        <p style={{ margin: 0, marginBottom: 10, fontSize: 11, color: '#7A879B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pivot</p>
        <PivotTable
          height={600}
          bordered
          rounded
          stickyHeader
          defaultExpandedLevels={1}
          dataQuery={{
            query: `
              SELECT
                COALESCE(cv.nome, '-') AS canal,
                COALESCE(p.status, 'Sem status') AS status,
                COALESCE(p.valor_total, 0)::float AS valor_total
              FROM vendas.pedidos p
              LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
              WHERE 1=1
                {{filters:p}}
            `,
            limit: 300,
          }}
          rows={[{ field: 'canal', label: 'Canal' }]}
          columns={[{ field: 'status', label: 'Status' }]}
          values={[{ field: 'valor_total', label: 'Receita', aggregate: 'sum', format: 'currency' }]}
        />
      </article>
    </section>
  </Slide>
</SlideTemplate>`

export const SLIDE_TEMPLATE = (
  <SlideTemplateMarker title="Apresentação Executiva" name="deck_dados">
    <ThemeMarker name="light" />

    <SlideMarker id="overview" title="Overview">
      <section style={{ display: 'flex', flexDirection: 'column', gap: 18, height: '100%', padding: 42, backgroundColor: '#F4F8FF' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '56%' }}>
            <p style={{ margin: 0, fontSize: 12, color: '#5E79A5', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Q4 2025 SALES SNAPSHOT</p>
            <h1 style={{ margin: 0, fontSize: 38, fontWeight: 700, color: '#172033', letterSpacing: '-0.04em', lineHeight: 1.04 }}>Slide runtime with data components</h1>
            <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: '#4D607F' }}>
              Layout stays HTML-first. `Query`, `Chart`, `Table` and `PivotTable` return only because they are presentation-facing data blocks.
            </p>
          </div>
          <article style={{ width: '30%', padding: 18, borderRadius: 22, backgroundColor: '#FFFFFF', border: '1px solid #D9E6FB' }}>
            <p style={{ margin: 0, fontSize: 11, color: '#6A7E9F', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Focus</p>
            <p style={{ margin: '10px 0 0 0', fontSize: 14, lineHeight: 1.6, color: '#33425F' }}>Slides stay narrative-first, so there are no slicers or datepickers here.</p>
          </article>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          <QueryMarker
            dataQuery={{
              query: `
                SELECT
                  COALESCE(SUM(p.valor_total), 0)::float AS value
                FROM vendas.pedidos p
                WHERE 1=1
                  {{filters:p}}
              `,
              limit: 1,
            }}
            format="currency"
            comparisonMode="previous_period"
          >
            <article style={{ padding: 18, borderRadius: 20, backgroundColor: '#FFFFFF', border: '1px solid #D9E6FB' }}>
              <p style={{ margin: 0, fontSize: 11, color: '#6A7E9F', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Receita</p>
              <h2 style={{ margin: '10px 0 6px 0', fontSize: 28, color: '#172033', letterSpacing: '-0.04em' }}>{'{{query.valueFormatted}}'}</h2>
              <p style={{ margin: 0, fontSize: 12, color: '#51637F' }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
            </article>
          </QueryMarker>
          <QueryMarker
            dataQuery={{
              query: `
                SELECT
                  COUNT(*)::float AS value
                FROM vendas.pedidos p
                WHERE 1=1
                  {{filters:p}}
              `,
              limit: 1,
            }}
            format="number"
            comparisonMode="previous_period"
          >
            <article style={{ padding: 18, borderRadius: 20, backgroundColor: '#FFFFFF', border: '1px solid #D9E6FB' }}>
              <p style={{ margin: 0, fontSize: 11, color: '#6A7E9F', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pedidos</p>
              <h2 style={{ margin: '10px 0 6px 0', fontSize: 28, color: '#172033', letterSpacing: '-0.04em' }}>{'{{query.valueFormatted}}'}</h2>
              <p style={{ margin: 0, fontSize: 12, color: '#51637F' }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
            </article>
          </QueryMarker>
          <QueryMarker
            dataQuery={{
              query: `
                SELECT
                  COALESCE(AVG(p.valor_total), 0)::float AS value
                FROM vendas.pedidos p
                WHERE 1=1
                  {{filters:p}}
              `,
              limit: 1,
            }}
            format="currency"
            comparisonMode="previous_period"
          >
            <article style={{ padding: 18, borderRadius: 20, backgroundColor: '#FFFFFF', border: '1px solid #D9E6FB' }}>
              <p style={{ margin: 0, fontSize: 11, color: '#6A7E9F', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ticket medio</p>
              <h2 style={{ margin: '10px 0 6px 0', fontSize: 28, color: '#172033', letterSpacing: '-0.04em' }}>{'{{query.valueFormatted}}'}</h2>
              <p style={{ margin: 0, fontSize: 12, color: '#51637F' }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
            </article>
          </QueryMarker>
        </div>

        <article style={{ flex: 1, padding: 18, borderRadius: 24, backgroundColor: '#FFFFFF', border: '1px solid #D9E6FB' }}>
          <ChartMarker
            type="line"
            height={300}
            format="currency"
            colorScheme={['#2563EB', '#60A5FA', '#93C5FD']}
            dataQuery={{
              query: `
                SELECT
                  TO_CHAR(p.data_pedido::date, 'YYYY-MM-DD') AS key,
                  TO_CHAR(p.data_pedido::date, 'DD/MM') AS label,
                  COALESCE(SUM(p.valor_total), 0)::float AS value
                FROM vendas.pedidos p
                WHERE 1=1
                  {{filters:p}}
                GROUP BY 1, 2
                ORDER BY 1 ASC
              `,
              xField: 'label',
              yField: 'value',
              keyField: 'key',
              limit: 31,
            }}
            recharts={{ showDots: false, singleSeriesGradient: true, valueAxisWidth: 72 }}
          />
        </article>
      </section>
    </SlideMarker>

    <SlideMarker id="detail" title="Detail">
      <section style={{ display: 'grid', gridTemplateColumns: '1.08fr 0.92fr', gap: 16, height: '100%', padding: 32, backgroundColor: '#FFFFFF' }}>
        <article style={{ padding: 18, borderRadius: 22, backgroundColor: '#FFFFFF', border: '1px solid #E5ECF8' }}>
          <p style={{ margin: 0, marginBottom: 10, fontSize: 11, color: '#7A879B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Table</p>
          <TableMarker
            height={600}
            bordered
            rounded
            stickyHeader
            dataQuery={{
              query: `
                SELECT
                  p.id::text AS pedido_id,
                  TO_CHAR(p.data_pedido::date, 'DD/MM/YYYY') AS data_pedido,
                  COALESCE(cv.nome, '-') AS canal,
                  COALESCE(p.status, 'Sem status') AS status,
                  COALESCE(p.valor_total, 0)::float AS valor_total
                FROM vendas.pedidos p
                LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
                WHERE 1=1
                  {{filters:p}}
                ORDER BY p.data_pedido DESC NULLS LAST, p.id DESC
              `,
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

        <article style={{ padding: 18, borderRadius: 22, backgroundColor: '#F8FBFF', border: '1px solid #E5ECF8' }}>
          <p style={{ margin: 0, marginBottom: 10, fontSize: 11, color: '#7A879B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pivot</p>
          <PivotTableMarker
            height={600}
            bordered
            rounded
            stickyHeader
            defaultExpandedLevels={1}
            dataQuery={{
              query: `
                SELECT
                  COALESCE(cv.nome, '-') AS canal,
                  COALESCE(p.status, 'Sem status') AS status,
                  COALESCE(p.valor_total, 0)::float AS valor_total
                FROM vendas.pedidos p
                LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
                WHERE 1=1
                  {{filters:p}}
              `,
              limit: 300,
            }}
            rows={[{ field: 'canal', label: 'Canal' }]}
            columns={[{ field: 'status', label: 'Status' }]}
            values={[{ field: 'valor_total', label: 'Receita', aggregate: 'sum', format: 'currency' }]}
          />
        </article>
      </section>
    </SlideMarker>
  </SlideTemplateMarker>
)
