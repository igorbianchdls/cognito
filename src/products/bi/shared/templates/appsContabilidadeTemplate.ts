export const APPS_CONTABILIDADE_TEMPLATE_DSL = String.raw`<dashboard-template name="apps_contabilidade_template_dsl">
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
          "title": "Dashboard Contabilidade",
          "subtitle": "Razao contabil, saldos e distribuicoes por conta",
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
            "title": "Debitos no Periodo",
            "format": "currency",
            "dataQuery": {
              "filters": {},
              "query": "SELECT\n  SUM(debito) AS value\nFROM contabilidade.lancamentos_contabeis_linhas src\nWHERE\n      ({{de}}::date IS NULL OR src.data_lancamento::date >= {{de}}::date)\n      AND ({{ate}}::date IS NULL OR src.data_lancamento::date <= {{ate}}::date)\n      AND (\n        NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.tenant_id::text, '') = ANY(\n          string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )",
              "yField": "value"
            }
          }
        </props>
      </kpi>
      <kpi>
        <props>
          {
            "title": "Creditos no Periodo",
            "format": "currency",
            "dataQuery": {
              "filters": {},
              "query": "SELECT\n  SUM(credito) AS value\nFROM contabilidade.lancamentos_contabeis_linhas src\nWHERE\n      ({{de}}::date IS NULL OR src.data_lancamento::date >= {{de}}::date)\n      AND ({{ate}}::date IS NULL OR src.data_lancamento::date <= {{ate}}::date)\n      AND (\n        NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.tenant_id::text, '') = ANY(\n          string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )",
              "yField": "value"
            }
          }
        </props>
      </kpi>
      <kpi>
        <props>
          {
            "title": "Saldo (D-C)",
            "format": "currency",
            "dataQuery": {
              "filters": {},
              "query": "SELECT\n  SUM(debito - credito) AS value\nFROM contabilidade.lancamentos_contabeis_linhas src\nWHERE\n      ({{de}}::date IS NULL OR src.data_lancamento::date >= {{de}}::date)\n      AND ({{ate}}::date IS NULL OR src.data_lancamento::date <= {{ate}}::date)\n      AND (\n        NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.tenant_id::text, '') = ANY(\n          string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )",
              "yField": "value"
            }
          }
        </props>
      </kpi>
      <kpi>
        <props>
          {
            "title": "Lancamentos",
            "format": "number",
            "dataQuery": {
              "filters": {},
              "query": "SELECT\n  COUNT(DISTINCT lancamento_id) AS value\nFROM contabilidade.lancamentos_contabeis_linhas src\nWHERE\n      ({{de}}::date IS NULL OR src.data_lancamento::date >= {{de}}::date)\n      AND ({{ate}}::date IS NULL OR src.data_lancamento::date <= {{ate}}::date)\n      AND (\n        NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.tenant_id::text, '') = ANY(\n          string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )",
              "yField": "value"
            }
          }
        </props>
      </kpi>
      <kpi>
        <props>
          {
            "title": "Linhas Contabeis",
            "format": "number",
            "dataQuery": {
              "filters": {},
              "query": "SELECT\n  COUNT(*) AS value\nFROM contabilidade.lancamentos_contabeis_linhas src\nWHERE\n      ({{de}}::date IS NULL OR src.data_lancamento::date >= {{de}}::date)\n      AND ({{ate}}::date IS NULL OR src.data_lancamento::date <= {{ate}}::date)\n      AND (\n        NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.tenant_id::text, '') = ANY(\n          string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )",
              "yField": "value"
            }
          }
        </props>
      </kpi>
      <kpi>
        <props>
          {
            "title": "Contas Movimentadas",
            "format": "number",
            "dataQuery": {
              "filters": {},
              "query": "SELECT\n  COUNT(DISTINCT conta_id) AS value\nFROM contabilidade.lancamentos_contabeis_linhas src\nWHERE\n      ({{de}}::date IS NULL OR src.data_lancamento::date >= {{de}}::date)\n      AND ({{ate}}::date IS NULL OR src.data_lancamento::date <= {{ate}}::date)\n      AND (\n        NULLIF(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL\n        OR COALESCE(src.tenant_id::text, '') = ANY(\n          string_to_array(regexp_replace({{tenant_id}}::text, '[{}[:space:]]', '', 'g'), ',')\n        )\n      )",
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
      <chart type="bar" fr="1" title="Debitos por Tipo de Conta" format="currency" height="240">
        <query>
          SELECT
            COALESCE(src.tipo_conta::text, '-') AS key,
            COALESCE(src.tipo_conta::text, '-') AS label,
            SUM(debito) AS value
          FROM contabilidade.lancamentos_contabeis_linhas src
          WHERE
                ({{de}}::date IS NULL OR src.data_lancamento::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_lancamento::date <= {{ate}}::date)
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
      <chart type="bar" fr="1" title="Creditos por Tipo de Conta" format="currency" height="240">
        <query>
          SELECT
            COALESCE(src.tipo_conta::text, '-') AS key,
            COALESCE(src.tipo_conta::text, '-') AS label,
            SUM(credito) AS value
          FROM contabilidade.lancamentos_contabeis_linhas src
          WHERE
                ({{de}}::date IS NULL OR src.data_lancamento::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_lancamento::date <= {{ate}}::date)
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
                "icon": "brain",
                "text": "Lançamentos concentrados em poucas contas podem mascarar variações sazonais do período."
              },
              {
                "icon": "activity",
                "text": "Compare débitos e créditos por conta antes de analisar saldo consolidado mensal."
              },
              {
                "icon": "triangleAlert",
                "text": "Diferenças de classificação contábil costumam aparecer primeiro nas contas analíticas."
              }
            ]
          }
        </props>
      </ai-summary>
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
      <chart type="bar" fr="1" title="Top Contas (Debito)" format="currency" height="260">
        <query>
          SELECT
            COALESCE(src.conta_id::text, '-') AS key,
            COALESCE(src.conta_id::text, '-') AS label,
            SUM(debito) AS value
          FROM contabilidade.lancamentos_contabeis_linhas src
          WHERE
                ({{de}}::date IS NULL OR src.data_lancamento::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_lancamento::date <= {{ate}}::date)
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
              "limit": 10
            }
          }
        </props>
      </chart>
      <chart type="bar" fr="1" title="Top Contas (Credito)" format="currency" height="260">
        <query>
          SELECT
            COALESCE(src.conta_id::text, '-') AS key,
            COALESCE(src.conta_id::text, '-') AS label,
            SUM(credito) AS value
          FROM contabilidade.lancamentos_contabeis_linhas src
          WHERE
                ({{de}}::date IS NULL OR src.data_lancamento::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_lancamento::date <= {{ate}}::date)
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
              "limit": 10
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
      <chart type="line" fr="1" title="Debitos por Mes" format="currency" height="240">
        <query>
          SELECT
            (TO_CHAR(DATE_TRUNC('month', data_lancamento), 'YYYY-MM'))::text AS key,
            (TO_CHAR(DATE_TRUNC('month', data_lancamento), 'YYYY-MM'))::text AS label,
            SUM(debito) AS value
          FROM contabilidade.lancamentos_contabeis_linhas src
          WHERE
                ({{de}}::date IS NULL OR src.data_lancamento::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_lancamento::date <= {{ate}}::date)
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
              "limit": 24
            }
          }
        </props>
      </chart>
      <chart type="line" fr="1" title="Creditos por Mes" format="currency" height="240">
        <query>
          SELECT
            (TO_CHAR(DATE_TRUNC('month', data_lancamento), 'YYYY-MM'))::text AS key,
            (TO_CHAR(DATE_TRUNC('month', data_lancamento), 'YYYY-MM'))::text AS label,
            SUM(credito) AS value
          FROM contabilidade.lancamentos_contabeis_linhas src
          WHERE
                ({{de}}::date IS NULL OR src.data_lancamento::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_lancamento::date <= {{ate}}::date)
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
              "limit": 24
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
      <chart type="pie" fr="1" title="Origem dos Lancamentos" format="number" height="260">
        <query>
          SELECT
            COALESCE(src.origem::text, '-') AS key,
            COALESCE(src.origem::text, '-') AS label,
            COUNT(DISTINCT lancamento_id) AS value
          FROM contabilidade.lancamentos_contabeis_linhas src
          WHERE
                ({{de}}::date IS NULL OR src.data_lancamento::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_lancamento::date <= {{ate}}::date)
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
        <nivo inner-radius="0.35" />
        <props>
          {
            "dataQuery": {
              "filters": {},
              "limit": 8
            }
          }
        </props>
      </chart>
      <chart type="bar" fr="1" title="Saldo por Conta (D-C)" format="currency" height="260">
        <query>
          SELECT
            COALESCE(src.conta_id::text, '-') AS key,
            COALESCE(src.conta_id::text, '-') AS label,
            SUM(debito - credito) AS value
          FROM contabilidade.lancamentos_contabeis_linhas src
          WHERE
                ({{de}}::date IS NULL OR src.data_lancamento::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_lancamento::date <= {{ate}}::date)
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
              "limit": 10
            }
          }
        </props>
      </chart>
    </div>
  </theme>
</dashboard-template>`
