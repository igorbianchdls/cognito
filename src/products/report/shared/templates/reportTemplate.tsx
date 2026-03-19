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

export const REPORT_TEMPLATE_SOURCE = String.raw`<ReportTemplate name="executive_report_runtime" title="Executive Sales Report">
  <Theme name="light" />

  <Report id="summary" title="Summary">
    <section style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', padding: 52, backgroundColor: '#FFFFFF', gap: 18 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, color: '#8B8E97', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Executive report</p>
        <h1 data-ui="title" style={{ margin: 0, fontSize: 30, fontWeight: 700, color: '#20232A', letterSpacing: '-0.03em' }}>Commercial performance summary</h1>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: '#556070' }}>
          Report keeps layout in HTML and only uses data-oriented components where they add value.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <Query dataQuery={{ query: 'SELECT COALESCE(SUM(p.valor_total), 0)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}}', limit: 1 }} format="currency" comparisonMode="previous_period">
          <article data-ui="card" style={{ padding: 18, border: '1px solid #E5EAF2', borderRadius: 18, backgroundColor: '#F9FBFD' }}>
            <p data-ui="kpi-title" style={{ margin: 0, fontSize: 11, color: '#7A879B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Receita</p>
            <h2 data-ui="kpi-value" style={{ margin: '10px 0 6px 0', fontSize: 28, color: '#20232A', letterSpacing: '-0.04em' }}>{'{{query.valueFormatted}}'}</h2>
            <p style={{ margin: 0, fontSize: 12, color: '#5E697B' }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
          </article>
        </Query>
        <Query dataQuery={{ query: 'SELECT COUNT(*)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}}', limit: 1 }} format="number" comparisonMode="previous_period">
          <article data-ui="card" style={{ padding: 18, border: '1px solid #E5EAF2', borderRadius: 18, backgroundColor: '#F9FBFD' }}>
            <p data-ui="kpi-title" style={{ margin: 0, fontSize: 11, color: '#7A879B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pedidos</p>
            <h2 data-ui="kpi-value" style={{ margin: '10px 0 6px 0', fontSize: 28, color: '#20232A', letterSpacing: '-0.04em' }}>{'{{query.valueFormatted}}'}</h2>
            <p style={{ margin: 0, fontSize: 12, color: '#5E697B' }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
          </article>
        </Query>
        <Query dataQuery={{ query: 'SELECT COALESCE(AVG(p.valor_total), 0)::float AS value FROM vendas.pedidos p WHERE 1=1 {{filters:p}}', limit: 1 }} format="currency" comparisonMode="previous_period">
          <article data-ui="card" style={{ padding: 18, border: '1px solid #E5EAF2', borderRadius: 18, backgroundColor: '#F9FBFD' }}>
            <p data-ui="kpi-title" style={{ margin: 0, fontSize: 11, color: '#7A879B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ticket medio</p>
            <h2 data-ui="kpi-value" style={{ margin: '10px 0 6px 0', fontSize: 28, color: '#20232A', letterSpacing: '-0.04em' }}>{'{{query.valueFormatted}}'}</h2>
            <p style={{ margin: 0, fontSize: 12, color: '#5E697B' }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
          </article>
        </Query>
      </div>

      <article data-ui="card" style={{ padding: 18, border: '1px solid #E5EAF2', borderRadius: 18, backgroundColor: '#FFFFFF' }}>
        <Chart
          type="bar"
          height={280}
          format="currency"
          colorScheme={['#2563EB', '#60A5FA', '#93C5FD', '#BFDBFE']}
          dataQuery={{
            query: 'SELECT COALESCE(cv.id::text, COALESCE(cv.nome, \'-\')) AS key, COALESCE(cv.nome, \'-\') AS label, COALESCE(SUM(pi.subtotal), 0)::float AS value FROM vendas.pedidos p JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id WHERE 1=1 {{filters:p}} GROUP BY 1, 2 ORDER BY 3 DESC',
            xField: 'label',
            yField: 'value',
            keyField: 'key',
            dimension: 'canal_venda',
            limit: 6,
          }}
          recharts={{ categoryLabelMode: 'first-word', valueAxisWidth: 72 }}
        />
      </article>
    </section>
  </Report>

  <Report id="detail" title="Detail">
    <section style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', minHeight: '100%', padding: 52, backgroundColor: '#FFFFFF', gap: 18 }}>
      <article data-ui="table-card" style={{ padding: 18, border: '1px solid #E5EAF2', borderRadius: 18, backgroundColor: '#FFFFFF' }}>
        <p data-ui="eyebrow" style={{ margin: 0, marginBottom: 10, fontSize: 11, color: '#7A879B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Table</p>
        <Table
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
            { accessorKey: 'pedido_id', header: 'Pedido' },
            { accessorKey: 'data_pedido', header: 'Data' },
            { accessorKey: 'canal', header: 'Canal' },
            { accessorKey: 'status', header: 'Status', cell: 'badge', meta: { variantMap: { aprovado: 'success', pendente: 'warning', cancelado: 'danger' } } },
            { accessorKey: 'valor_total', header: 'Receita', format: 'currency', align: 'right', headerAlign: 'right' },
          ]}
        />
      </article>

      <article data-ui="pivot-card" style={{ padding: 18, border: '1px solid #E5EAF2', borderRadius: 18, backgroundColor: '#F9FBFD' }}>
        <p data-ui="eyebrow" style={{ margin: 0, marginBottom: 10, fontSize: 11, color: '#7A879B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pivot</p>
        <PivotTable
          height={520}
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
    </section>
  </Report>
</ReportTemplate>`

export const REPORT_TEMPLATE = (
  <ReportTemplateMarker name="executive_report_runtime" title="Executive Sales Report">
    <ThemeMarker name="light" />

    <ReportMarker id="summary" title="Summary">
      <section style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', padding: 52, backgroundColor: '#FFFFFF', gap: 18 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p data-ui="eyebrow" style={{ margin: 0, fontSize: 11, color: '#8B8E97', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Executive report</p>
          <h1 data-ui="title" style={{ margin: 0, fontSize: 30, fontWeight: 700, color: '#20232A', letterSpacing: '-0.03em' }}>Commercial performance summary</h1>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.7, color: '#556070' }}>
            Report keeps layout in HTML and only uses data-oriented components where they add value.
          </p>
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
            <article data-ui="card" style={{ padding: 18, border: '1px solid #E5EAF2', borderRadius: 18, backgroundColor: '#F9FBFD' }}>
              <p data-ui="kpi-title" style={{ margin: 0, fontSize: 11, color: '#7A879B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Receita</p>
              <h2 data-ui="kpi-value" style={{ margin: '10px 0 6px 0', fontSize: 28, color: '#20232A', letterSpacing: '-0.04em' }}>{'{{query.valueFormatted}}'}</h2>
              <p style={{ margin: 0, fontSize: 12, color: '#5E697B' }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
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
            <article data-ui="card" style={{ padding: 18, border: '1px solid #E5EAF2', borderRadius: 18, backgroundColor: '#F9FBFD' }}>
              <p data-ui="kpi-title" style={{ margin: 0, fontSize: 11, color: '#7A879B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pedidos</p>
              <h2 data-ui="kpi-value" style={{ margin: '10px 0 6px 0', fontSize: 28, color: '#20232A', letterSpacing: '-0.04em' }}>{'{{query.valueFormatted}}'}</h2>
              <p style={{ margin: 0, fontSize: 12, color: '#5E697B' }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
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
            <article data-ui="card" style={{ padding: 18, border: '1px solid #E5EAF2', borderRadius: 18, backgroundColor: '#F9FBFD' }}>
              <p data-ui="kpi-title" style={{ margin: 0, fontSize: 11, color: '#7A879B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ticket medio</p>
              <h2 data-ui="kpi-value" style={{ margin: '10px 0 6px 0', fontSize: 28, color: '#20232A', letterSpacing: '-0.04em' }}>{'{{query.valueFormatted}}'}</h2>
              <p style={{ margin: 0, fontSize: 12, color: '#5E697B' }}>{'{{query.deltaPercentDisplay}} {{query.comparisonLabel}}'}</p>
            </article>
          </QueryMarker>
        </div>

        <article style={{ padding: 18, border: '1px solid #E5EAF2', borderRadius: 18, backgroundColor: '#FFFFFF' }}>
          <ChartMarker
            type="bar"
            height={280}
            format="currency"
            colorScheme={['#2563EB', '#60A5FA', '#93C5FD', '#BFDBFE']}
            dataQuery={{
              query: `
                SELECT
                  COALESCE(cv.id::text, COALESCE(cv.nome, '-')) AS key,
                  COALESCE(cv.nome, '-') AS label,
                  COALESCE(SUM(pi.subtotal), 0)::float AS value
                FROM vendas.pedidos p
                JOIN vendas.pedidos_itens pi ON pi.pedido_id = p.id
                LEFT JOIN vendas.canais_venda cv ON cv.id = p.canal_venda_id
                WHERE 1=1
                  {{filters:p}}
                GROUP BY 1, 2
                ORDER BY 3 DESC
              `,
              xField: 'label',
              yField: 'value',
              keyField: 'key',
              dimension: 'canal_venda',
              limit: 6,
            }}
            recharts={{ categoryLabelMode: 'first-word', valueAxisWidth: 72 }}
          />
        </article>
      </section>
    </ReportMarker>

    <ReportMarker id="detail" title="Detail">
      <section style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', minHeight: '100%', padding: 52, backgroundColor: '#FFFFFF', gap: 18 }}>
        <article data-ui="table-card" style={{ padding: 18, border: '1px solid #E5EAF2', borderRadius: 18, backgroundColor: '#FFFFFF' }}>
          <p data-ui="eyebrow" style={{ margin: 0, marginBottom: 10, fontSize: 11, color: '#7A879B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Table</p>
          <TableMarker
            height={520}
            bordered
            rounded
            stickyHeader
            enableExportCsv
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
              limit: 14,
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

        <article data-ui="pivot-card" style={{ padding: 18, border: '1px solid #E5EAF2', borderRadius: 18, backgroundColor: '#F9FBFD' }}>
          <p data-ui="eyebrow" style={{ margin: 0, marginBottom: 10, fontSize: 11, color: '#7A879B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pivot</p>
          <PivotTableMarker
            height={520}
            bordered
            rounded
            stickyHeader
            enableExportCsv
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
              limit: 400,
            }}
            rows={[{ field: 'canal', label: 'Canal' }]}
            columns={[{ field: 'status', label: 'Status' }]}
            values={[{ field: 'valor_total', label: 'Receita', aggregate: 'sum', format: 'currency' }]}
          />
        </article>
      </section>
    </ReportMarker>
  </ReportTemplateMarker>
)
