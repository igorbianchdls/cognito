export const APPS_CRM_TEMPLATE_DSL = String.raw`<dashboard-template name="apps_crm_template_dsl">
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
          "title": "Dashboard de CRM",
          "subtitle": "Pipeline, conversão e origem de leads",
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
            "title": "Pipeline (R$)",
            "valuePath": "crm.kpis.faturamento",
            "format": "currency"
          }
        </props>
      </kpi>
      <kpi>
        <props>
          {
            "title": "Vendas",
            "valuePath": "crm.kpis.vendas",
            "format": "number"
          }
        </props>
      </kpi>
      <kpi>
        <props>
          {
            "title": "Oportunidades",
            "valuePath": "crm.kpis.oportunidades",
            "format": "number"
          }
        </props>
      </kpi>
      <kpi>
        <props>
          {
            "title": "Leads",
            "valuePath": "crm.kpis.totalLeads",
            "format": "number"
          }
        </props>
      </kpi>
      <kpi>
        <props>
          {
            "title": "Conversão",
            "valuePath": "crm.kpis.taxaConversao",
            "format": "number",
            "unit": "%"
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
      <chart type="bar" fr="2" title="Pipeline por Vendedor" format="currency" height="240">
        <query>
          SELECT
            COALESCE(src.vendedor_id::text, '-') AS key,
            COALESCE(src.vendedor_id::text, '-') AS label,
            SUM(valor_estimado) AS value
          FROM crm.oportunidades src
          WHERE
                ({{de}}::date IS NULL OR src.data_prevista::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_prevista::date <= {{ate}}::date)
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
      <chart type="bar" fr="2" title="Pipeline por Fase" format="currency" height="240">
        <query>
          SELECT
            '-'::text AS key,
            '-'::text AS label,
            SUM(valor_estimado) AS value
          FROM crm.oportunidades src
          WHERE
                ({{de}}::date IS NULL OR src.data_prevista::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_prevista::date <= {{ate}}::date)
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
                "icon": "trendingUp",
                "text": "Volume e taxa de conversão ficam mais claros quando segmentados por origem e fase do pipeline."
              },
              {
                "icon": "users",
                "text": "Distribuição por vendedor ajuda a identificar gargalos de follow-up e cobertura comercial."
              },
              {
                "icon": "lightbulb",
                "text": "Leads com recorrência em fases iniciais podem indicar ajuste de qualificação."
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
      <chart type="pie" fr="1" title="Leads por Origem" format="number" height="260">
        <query>
          SELECT
            COALESCE(src.origem_id::text, '-') AS key,
            COALESCE(src.origem_id::text, '-') AS label,
            COUNT(*) AS value
          FROM crm.leads src
          WHERE
                ({{de}}::date IS NULL OR src.criado_em::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.criado_em::date <= {{ate}}::date)
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
      <chart type="line" fr="2" title="Pipeline Mensal" format="currency" height="260">
        <query>
          SELECT
            (TO_CHAR(DATE_TRUNC('month', data_prevista), 'YYYY-MM'))::text AS key,
            (TO_CHAR(DATE_TRUNC('month', data_prevista), 'YYYY-MM'))::text AS label,
            SUM(valor_estimado) AS value
          FROM crm.oportunidades src
          WHERE
                ({{de}}::date IS NULL OR src.data_prevista::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_prevista::date <= {{ate}}::date)
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
      <chart type="bar" fr="1" title="Oportunidades por Status" format="number" height="230">
        <query>
          SELECT
            COALESCE(src.status::text, '-') AS key,
            COALESCE(src.status::text, '-') AS label,
            COUNT(*) AS value
          FROM crm.oportunidades src
          WHERE
                ({{de}}::date IS NULL OR src.data_prevista::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_prevista::date <= {{ate}}::date)
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
      <chart type="bar" fr="1" title="Leads por Responsável" format="number" height="230">
        <query>
          SELECT
            COALESCE(src.responsavel_id::text, '-') AS key,
            COALESCE(src.responsavel_id::text, '-') AS label,
            COUNT(*) AS value
          FROM crm.leads src
          WHERE
                ({{de}}::date IS NULL OR src.criado_em::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.criado_em::date <= {{ate}}::date)
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
      <chart type="bar" fr="1" title="Pipeline por Conta" format="currency" height="230">
        <query>
          SELECT
            COALESCE(src.conta_id::text, '-') AS key,
            COALESCE(src.conta_id::text, '-') AS label,
            SUM(valor_estimado) AS value
          FROM crm.oportunidades src
          WHERE
                ({{de}}::date IS NULL OR src.data_prevista::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_prevista::date <= {{ate}}::date)
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
      <chart type="bar" fr="1" title="Ticket Estimado por Vendedor" format="currency" height="230">
        <query>
          SELECT
            COALESCE(src.vendedor_id::text, '-') AS key,
            COALESCE(src.vendedor_id::text, '-') AS label,
            AVG(valor_estimado) AS value
          FROM crm.oportunidades src
          WHERE
                ({{de}}::date IS NULL OR src.data_prevista::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_prevista::date <= {{ate}}::date)
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
      <chart type="line" fr="2" title="Leads por Mês" format="number" height="230">
        <query>
          SELECT
            (TO_CHAR(DATE_TRUNC('month', criado_em), 'YYYY-MM'))::text AS key,
            (TO_CHAR(DATE_TRUNC('month', criado_em), 'YYYY-MM'))::text AS label,
            COUNT(*) AS value
          FROM crm.leads src
          WHERE
                ({{de}}::date IS NULL OR src.criado_em::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.criado_em::date <= {{ate}}::date)
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
      <chart type="pie" fr="1" title="Pipeline por Origem" format="currency" height="230">
        <query>
          SELECT
            COALESCE(src.origem_id::text, '-') AS key,
            COALESCE(src.origem_id::text, '-') AS label,
            SUM(valor_estimado) AS value
          FROM crm.oportunidades src
          WHERE
                ({{de}}::date IS NULL OR src.data_prevista::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_prevista::date <= {{ate}}::date)
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
    </div>
  </theme>
</dashboard-template>`
