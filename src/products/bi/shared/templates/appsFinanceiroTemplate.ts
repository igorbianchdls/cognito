export const APPS_FINANCEIRO_TEMPLATE_DSL = String.raw`<dashboard-template name="apps_financeiro_template_dsl">
  <theme>
    <props>
      {
        "name": "light",
        "managers": {
          "border": {
            "style": "solid",
            "width": 1,
            "color": "#bfc9d9",
            "radius": 8,
            "frame": {
              "variant": "hud",
              "cornerSize": 8,
              "cornerWidth": 1
            }
          }
        }
      }
    </props>
    <header>
      <props>
        {
          "title": "Dashboard Financeiro",
          "subtitle": "Contas a pagar, receber e fluxo do período",
          "align": "center",
          "controlsPosition": "right",
          "datePicker": {
            "visible": true,
            "mode": "range",
            "position": "right",
            "storePath": "filters.dateRange",
            "actionOnChange": {
              "type": "refresh_data"
            },
            "style": {
              "padding": 6,
              "fontFamily": "Barlow",
              "fontSize": 12
            }
          }
        }
      </props>
    </header>
    <div>
      <props>
        {
          "direction": "row",
          "gap": 12,
          "padding": 16,
          "justify": "start",
          "align": "start",
          "childGrow": true
        }
      </props>
      <kpi>
        <props>
          {
            "title": "Recebidos",
            "valuePath": "financeiro.kpis.recebidos_mes",
            "format": "currency"
          }
        </props>
      </kpi>
      <kpi>
        <props>
          {
            "title": "Pagos",
            "valuePath": "financeiro.kpis.pagos_mes",
            "format": "currency"
          }
        </props>
      </kpi>
      <kpi>
        <props>
          {
            "title": "Geração de Caixa",
            "valuePath": "financeiro.kpis.geracao_caixa",
            "format": "currency"
          }
        </props>
      </kpi>
      <kpi>
        <props>
          {
            "title": "Títulos em AP",
            "format": "number",
            "dataQuery": {
              "filters": {},
              "query": "SELECT\n  COUNT(*) AS value\nFROM financeiro.contas_pagar src\nWHERE\n      ({{de}}::date IS NULL OR src.data_vencimento::date >= {{de}}::date)\n      AND ({{ate}}::date IS NULL OR src.data_vencimento::date <= {{ate}}::date)\n      AND (\n        NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.tenant_id::text, '') = ANY(\n          string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )",
              "yField": "value"
            }
          }
        </props>
      </kpi>
    </div>
    <div>
      <props>
        {
          "direction": "row",
          "gap": 12,
          "padding": 16,
          "justify": "start",
          "align": "start",
          "childGrow": true
        }
      </props>
      <chart type="bar" fr="1" title="AP por Fornecedor" format="currency" height="240">
        <query>
          SELECT
            COALESCE(src.fornecedor_id::text, '-') AS key,
            COALESCE(src.fornecedor_id::text, '-') AS label,
            SUM(valor) AS value
          FROM financeiro.contas_pagar src
          WHERE
                ({{de}}::date IS NULL OR src.data_vencimento::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_vencimento::date <= {{ate}}::date)
                AND (
                  NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.tenant_id::text, '') = ANY(
                    string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
          GROUP BY 1, 2
          ORDER BY value DESC
        </query>
        <fields x="label" y="value" key="key" />
        <nivo layout="horizontal" />
        <props>
          {
            "dataQuery": {
              "filters": {},
              "limit": 8
            }
          }
        </props>
      </chart>
      <chart type="bar" fr="1" title="AP por Categoria" format="currency" height="240">
        <query>
          SELECT
            COALESCE(src.categoria_despesa_id::text, '-') AS key,
            COALESCE(src.categoria_despesa_id::text, '-') AS label,
            SUM(valor) AS value
          FROM financeiro.contas_pagar src
          WHERE
                ({{de}}::date IS NULL OR src.data_vencimento::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_vencimento::date <= {{ate}}::date)
                AND (
                  NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.tenant_id::text, '') = ANY(
                    string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
          GROUP BY 1, 2
          ORDER BY value DESC
        </query>
        <fields x="label" y="value" key="key" />
        <nivo layout="horizontal" />
        <props>
          {
            "dataQuery": {
              "filters": {},
              "limit": 8
            }
          }
        </props>
      </chart>
      <chart type="bar" fr="1" title="AR por Cliente" format="currency" height="240">
        <query>
          SELECT
            COALESCE(src.cliente_id::text, '-') AS key,
            COALESCE(src.cliente_id::text, '-') AS label,
            SUM(valor) AS value
          FROM financeiro.contas_receber src
          WHERE
                ({{de}}::date IS NULL OR src.data_vencimento::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_vencimento::date <= {{ate}}::date)
                AND (
                  NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.tenant_id::text, '') = ANY(
                    string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
          GROUP BY 1, 2
          ORDER BY value DESC
        </query>
        <fields x="label" y="value" key="key" />
        <nivo layout="horizontal" />
        <props>
          {
            "dataQuery": {
              "filters": {},
              "limit": 8
            }
          }
        </props>
      </chart>
    </div>
    <div>
      <props>
        {
          "direction": "row",
          "gap": 12,
          "padding": 16,
          "justify": "start",
          "align": "start",
          "childGrow": true
        }
      </props>
      <chart type="line" fr="1" title="Contas a Receber por Mês" format="currency" height="240">
        <query>
          SELECT
            (TO_CHAR(DATE_TRUNC('month', data_vencimento), 'YYYY-MM'))::text AS key,
            (TO_CHAR(DATE_TRUNC('month', data_vencimento), 'YYYY-MM'))::text AS label,
            SUM(valor) AS value
          FROM financeiro.contas_receber src
          WHERE
                ({{de}}::date IS NULL OR src.data_vencimento::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_vencimento::date <= {{ate}}::date)
                AND (
                  NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.tenant_id::text, '') = ANY(
                    string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
          GROUP BY 1, 2
          ORDER BY label ASC
        </query>
        <fields x="label" y="value" key="key" />
        <nivo curve="monotoneX" area="true" />
        <props>
          {
            "dataQuery": {
              "filters": {},
              "limit": 12
            }
          }
        </props>
      </chart>
      <chart type="bar" fr="1" title="Status de AP" format="number" height="240">
        <query>
          SELECT
            COALESCE(src.status::text, '-') AS key,
            COALESCE(src.status::text, '-') AS label,
            COUNT(*) AS value
          FROM financeiro.contas_pagar src
          WHERE
                ({{de}}::date IS NULL OR src.data_vencimento::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_vencimento::date <= {{ate}}::date)
                AND (
                  NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.tenant_id::text, '') = ANY(
                    string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
          GROUP BY 1, 2
          ORDER BY value DESC
        </query>
        <fields x="label" y="value" key="key" />
        <nivo layout="horizontal" />
        <props>
          {
            "dataQuery": {
              "filters": {},
              "limit": 8
            }
          }
        </props>
      </chart>
      <ai-summary>
        <props>
          {
            "fr": 1,
            "title": "Insights da IA",
            "items": [
              {
                "icon": "circledollarsign",
                "text": "Compare recebimentos e pagamentos para antecipar pressão de caixa no período."
              },
              {
                "icon": "trendingUp",
                "text": "Distribuições por status e fornecedor ajudam a priorizar ações operacionais."
              },
              {
                "icon": "triangleAlert",
                "text": "Títulos vencidos ou concentrados por data podem distorcer a visão semanal."
              }
            ]
          }
        </props>
      </ai-summary>
    </div>
  </theme>
</dashboard-template>`
