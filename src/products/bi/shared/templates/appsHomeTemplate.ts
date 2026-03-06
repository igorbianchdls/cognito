export const APPS_HOME_TEMPLATE_DSL = String.raw`<dashboard-template name="apps_home_template_dsl">
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
          "title": "Dashboard (Dados Reais)",
          "subtitle": "Vendas, Compras e Financeiro",
          "align": "center",
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
          },
          "slicers": [
            {
              "label": "Status",
              "type": "tile",
              "storePath": "filters.status",
              "clearable": true,
              "source": {
                "type": "static",
                "options": [
                  {
                    "value": "aberto",
                    "label": "Aberto"
                  },
                  {
                    "value": "fechado",
                    "label": "Fechado"
                  },
                  {
                    "value": "atrasado",
                    "label": "Atrasado"
                  }
                ]
              }
            },
            {
              "label": "Filiais",
              "type": "tile-multi",
              "storePath": "filters.filiais",
              "clearable": true,
              "source": {
                "type": "static",
                "options": [
                  {
                    "value": "matriz",
                    "label": "Matriz"
                  },
                  {
                    "value": "filial-1",
                    "label": "Filial 1"
                  },
                  {
                    "value": "filial-2",
                    "label": "Filial 2"
                  }
                ]
              }
            }
          ]
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
            "title": "Recebidos (Período)",
            "valuePath": "financeiro.kpis.recebidos_mes",
            "format": "currency",
            "titleStyle": {
              "fontWeight": 600,
              "fontSize": 12,
              "color": "#64748b"
            },
            "valueStyle": {
              "fontWeight": 700,
              "fontSize": 24,
              "color": "#0f172a"
            }
          }
        </props>
      </kpi>
      <kpi>
        <props>
          {
            "title": "Pagos (Período)",
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
            "format": "currency",
            "valueStyle": {
              "fontSize": 22
            }
          }
        </props>
      </kpi>
      <ai-summary>
        <props>
          {
            "fr": 1,
            "title": "Insights da IA",
            "items": [
              {
                "icon": "brain",
                "text": "Painel consolidado ajuda a cruzar caixa, vendas e compras para decisões semanais."
              },
              {
                "icon": "activity",
                "text": "Mudanças bruscas em AP/AR normalmente aparecem primeiro nas distribuições por centro e filial."
              },
              {
                "icon": "badgeCheck",
                "text": "Use filtros por status e filial para validar se a variação é operacional ou de calendário."
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
      <chart type="bar" title="AP por Fornecedor" format="currency" height="200">
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
                  NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.status::text, '') = ANY(
                    string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
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
              "limit": 6
            }
          }
        </props>
      </chart>
      <chart type="bar" title="AR por Centro de Lucro" format="currency" height="200">
        <query>
          SELECT
            COALESCE(src.centro_lucro_id::text, '-') AS key,
            COALESCE(src.centro_lucro_id::text, '-') AS label,
            SUM(valor) AS value
          FROM financeiro.contas_receber src
          WHERE
                ({{de}}::date IS NULL OR src.data_vencimento::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_vencimento::date <= {{ate}}::date)
                AND (
                  NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.status::text, '') = ANY(
                    string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
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
              "limit": 6
            }
          }
        </props>
      </chart>
      <chart type="bar" title="Títulos (por Valor)" format="currency" height="200">
        <query>
          SELECT
            '-'::text AS key,
            '-'::text AS label,
            SUM(valor) AS value
          FROM financeiro.contas_pagar src
          WHERE
                ({{de}}::date IS NULL OR src.data_vencimento::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_vencimento::date <= {{ate}}::date)
                AND (
                  NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                  OR COALESCE(src.status::text, '') = ANY(
                    string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                  )
                )
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
              "limit": 6
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
      <card>
        <props>
          {
            "title": "AP por Centro de Custo"
          }
        </props>
        <chart type="bar" title="Centros de Custo" format="currency" height="200">
          <query>
            SELECT
              COALESCE(src.centro_custo_id::text, '-') AS key,
              COALESCE(src.centro_custo_id::text, '-') AS label,
              SUM(valor) AS value
            FROM financeiro.contas_pagar src
            WHERE
                  ({{de}}::date IS NULL OR src.data_vencimento::date >= {{de}}::date)
                  AND ({{ate}}::date IS NULL OR src.data_vencimento::date <= {{ate}}::date)
                  AND (
                    NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                    OR COALESCE(src.status::text, '') = ANY(
                      string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                    )
                  )
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
                "limit": 6
              }
            }
          </props>
        </chart>
      </card>
      <card>
        <props>
          {
            "title": "AP por Categoria (Despesa)"
          }
        </props>
        <chart type="bar" title="Categorias de Despesa" format="currency" height="200">
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
                    NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                    OR COALESCE(src.status::text, '') = ANY(
                      string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                    )
                  )
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
                "limit": 6
              }
            }
          </props>
        </chart>
      </card>
      <card>
        <props>
          {
            "title": "AP por Departamento"
          }
        </props>
        <chart type="bar" title="Departamentos" format="currency" height="200">
          <query>
            SELECT
              COALESCE(src.departamento_id::text, '-') AS key,
              COALESCE(src.departamento_id::text, '-') AS label,
              SUM(valor) AS value
            FROM financeiro.contas_pagar src
            WHERE
                  ({{de}}::date IS NULL OR src.data_vencimento::date >= {{de}}::date)
                  AND ({{ate}}::date IS NULL OR src.data_vencimento::date <= {{ate}}::date)
                  AND (
                    NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                    OR COALESCE(src.status::text, '') = ANY(
                      string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                    )
                  )
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
                "limit": 6
              }
            }
          </props>
        </chart>
      </card>
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
      <card>
        <props>
          {
            "title": "AR por Categoria (Receita)"
          }
        </props>
        <chart type="bar" title="Categorias de Receita" format="currency" height="200">
          <query>
            SELECT
              COALESCE(src.categoria_receita_id::text, '-') AS key,
              COALESCE(src.categoria_receita_id::text, '-') AS label,
              SUM(valor) AS value
            FROM financeiro.contas_receber src
            WHERE
                  ({{de}}::date IS NULL OR src.data_vencimento::date >= {{de}}::date)
                  AND ({{ate}}::date IS NULL OR src.data_vencimento::date <= {{ate}}::date)
                  AND (
                    NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                    OR COALESCE(src.status::text, '') = ANY(
                      string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                    )
                  )
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
                "limit": 6
              }
            }
          </props>
        </chart>
      </card>
      <card>
        <props>
          {
            "title": "AP por Filial"
          }
        </props>
        <chart type="bar" title="Filiais" format="currency" height="200">
          <query>
            SELECT
              COALESCE(src.filial_id::text, '-') AS key,
              COALESCE(src.filial_id::text, '-') AS label,
              SUM(valor) AS value
            FROM financeiro.contas_pagar src
            WHERE
                  ({{de}}::date IS NULL OR src.data_vencimento::date >= {{de}}::date)
                  AND ({{ate}}::date IS NULL OR src.data_vencimento::date <= {{ate}}::date)
                  AND (
                    NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                    OR COALESCE(src.status::text, '') = ANY(
                      string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                    )
                  )
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
                "limit": 6
              }
            }
          </props>
        </chart>
      </card>
      <card>
        <props>
          {
            "title": "AP por Unidade de Negócio"
          }
        </props>
        <chart type="bar" title="Unidades de Negócio" format="currency" height="200">
          <query>
            SELECT
              COALESCE(src.unidade_negocio_id::text, '-') AS key,
              COALESCE(src.unidade_negocio_id::text, '-') AS label,
              SUM(valor) AS value
            FROM financeiro.contas_pagar src
            WHERE
                  ({{de}}::date IS NULL OR src.data_vencimento::date >= {{de}}::date)
                  AND ({{ate}}::date IS NULL OR src.data_vencimento::date <= {{ate}}::date)
                  AND (
                    NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                    OR COALESCE(src.status::text, '') = ANY(
                      string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                    )
                  )
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
                "limit": 6
              }
            }
          </props>
        </chart>
      </card>
    </div>
    <chart type="pie" title="Canais de Venda" format="currency" height="220">
      <query>
        SELECT
          COALESCE(src.canal_venda_id::text, '-') AS key,
          COALESCE(src.canal_venda_id::text, '-') AS label,
          SUM(valor_total) AS value
        FROM vendas.pedidos src
        WHERE
              ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
              AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
              AND (
                NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                OR COALESCE(src.status::text, '') = ANY(
                  string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                )
              )
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
      <nivo inner-radius="0.3" />
      <props>
        {
          "dataQuery": {
            "filters": {},
            "limit": 6
          }
        }
      </props>
    </chart>
    <chart type="bar" title="Gasto por Fornecedor" format="currency" height="200">
      <query>
        SELECT
          COALESCE(src.fornecedor_id::text, '-') AS key,
          COALESCE(src.fornecedor_id::text, '-') AS label,
          SUM(valor_total) AS value
        FROM compras.compras src
        WHERE
              ({{de}}::date IS NULL OR src.data_pedido::date >= {{de}}::date)
              AND ({{ate}}::date IS NULL OR src.data_pedido::date <= {{ate}}::date)
              AND (
                NULLIF(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), '') IS NULL
                OR COALESCE(src.status::text, '') = ANY(
                  string_to_array(regexp_replace({{status}}::text, '[{}[:space:]]', '', 'g'), ',')
                )
              )
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
      <props>
        {
          "dataQuery": {
            "filters": {},
            "limit": 6
          }
        }
      </props>
    </chart>
  </theme>
</dashboard-template>`
