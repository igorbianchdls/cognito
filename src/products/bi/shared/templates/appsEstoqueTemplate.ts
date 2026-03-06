export const APPS_ESTOQUE_TEMPLATE_DSL = String.raw`<dashboard-template name="apps_estoque_template_dsl">
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
          "title": "Dashboard de Estoque",
          "subtitle": "Nível de estoque, movimentações e valor imobilizado",
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
            "title": "Valor em Estoque",
            "valuePath": "estoque.kpis.valor_total_estoque",
            "format": "currency"
          }
        </props>
      </kpi>
      <kpi>
        <props>
          {
            "title": "Quantidade Total",
            "valuePath": "estoque.kpis.quantidade_total",
            "format": "number"
          }
        </props>
      </kpi>
      <kpi>
        <props>
          {
            "title": "Produtos Ativos",
            "valuePath": "estoque.kpis.produtos_ativos",
            "format": "number"
          }
        </props>
      </kpi>
      <kpi>
        <props>
          {
            "title": "Movimentações",
            "valuePath": "estoque.kpis.movimentacoes_periodo",
            "format": "number"
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
      <chart type="bar" fr="1" title="Estoque por Almoxarifado" format="number" height="240">
        <query>
          SELECT
            COALESCE(src.almoxarifado_id::text, '-') AS key,
            COALESCE(src.almoxarifado_id::text, '-') AS label,
            SUM(quantidade) AS value
          FROM estoque.estoques_atual src
          WHERE
                ({{de}}::date IS NULL OR src.atualizado_em::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.atualizado_em::date <= {{ate}}::date)
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
      <chart type="bar" fr="2" title="Top Produtos por Quantidade" format="number" height="240">
        <query>
          SELECT
            COALESCE(src.produto_id::text, '-') AS key,
            COALESCE(src.produto_id::text, '-') AS label,
            SUM(quantidade) AS value
          FROM estoque.estoques_atual src
          WHERE
                ({{de}}::date IS NULL OR src.atualizado_em::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.atualizado_em::date <= {{ate}}::date)
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
      <ai-summary>
        <props>
          {
            "fr": 1,
            "title": "Insights da IA",
            "items": [
              {
                "icon": "package",
                "text": "Itens com maior valor imobilizado merecem monitoramento de giro e cobertura por almoxarifado."
              },
              {
                "icon": "activity",
                "text": "Movimentações por tipo ajudam a separar consumo real de ajustes operacionais."
              },
              {
                "icon": "triangleAlert",
                "text": "Rupturas e excesso costumam aparecer em pontos específicos antes do consolidado."
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
      <chart type="pie" fr="1" title="Movimentações por Tipo" format="number" height="260">
        <query>
          SELECT
            COALESCE(src.tipo_movimento::text, '-') AS key,
            COALESCE(src.tipo_movimento::text, '-') AS label,
            SUM(quantidade) AS value
          FROM estoque.movimentacoes src
          WHERE
                ({{de}}::date IS NULL OR src.data_movimento::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_movimento::date <= {{ate}}::date)
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
      <chart type="line" fr="2" title="Valor Movimentado por Mês" format="currency" height="260">
        <query>
          SELECT
            (TO_CHAR(DATE_TRUNC('month', data_movimento), 'YYYY-MM'))::text AS key,
            (TO_CHAR(DATE_TRUNC('month', data_movimento), 'YYYY-MM'))::text AS label,
            SUM(valor_total) AS value
          FROM estoque.movimentacoes src
          WHERE
                ({{de}}::date IS NULL OR src.data_movimento::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_movimento::date <= {{ate}}::date)
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
      <chart type="bar" fr="1" title="Valor em Estoque por Almoxarifado" format="currency" height="230">
        <query>
          SELECT
            COALESCE(src.almoxarifado_id::text, '-') AS key,
            COALESCE(src.almoxarifado_id::text, '-') AS label,
            SUM(valor_total) AS value
          FROM estoque.estoques_atual src
          WHERE
                ({{de}}::date IS NULL OR src.atualizado_em::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.atualizado_em::date <= {{ate}}::date)
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
      <chart type="pie" fr="1" title="Movimentações por Natureza" format="number" height="230">
        <query>
          SELECT
            '-'::text AS key,
            '-'::text AS label,
            SUM(quantidade) AS value
          FROM estoque.movimentacoes src
          WHERE
                ({{de}}::date IS NULL OR src.data_movimento::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_movimento::date <= {{ate}}::date)
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
      <chart type="bar" fr="1" title="Movimentos por Almoxarifado" format="number" height="230">
        <query>
          SELECT
            COALESCE(src.almoxarifado_id::text, '-') AS key,
            COALESCE(src.almoxarifado_id::text, '-') AS label,
            COUNT(*) AS value
          FROM estoque.movimentacoes src
          WHERE
                ({{de}}::date IS NULL OR src.data_movimento::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_movimento::date <= {{ate}}::date)
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
      <chart type="bar" fr="2" title="Top Produtos por Valor Movimentado" format="currency" height="230">
        <query>
          SELECT
            COALESCE(src.produto_id::text, '-') AS key,
            COALESCE(src.produto_id::text, '-') AS label,
            SUM(valor_total) AS value
          FROM estoque.movimentacoes src
          WHERE
                ({{de}}::date IS NULL OR src.data_movimento::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_movimento::date <= {{ate}}::date)
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
      <chart type="line" fr="2" title="Quantidade Movimentada por Mês" format="number" height="230">
        <query>
          SELECT
            (TO_CHAR(DATE_TRUNC('month', data_movimento), 'YYYY-MM'))::text AS key,
            (TO_CHAR(DATE_TRUNC('month', data_movimento), 'YYYY-MM'))::text AS label,
            SUM(quantidade) AS value
          FROM estoque.movimentacoes src
          WHERE
                ({{de}}::date IS NULL OR src.data_movimento::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.data_movimento::date <= {{ate}}::date)
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
      <chart type="bar" fr="1" title="SKUs por Almoxarifado" format="number" height="230">
        <query>
          SELECT
            COALESCE(src.almoxarifado_id::text, '-') AS key,
            COALESCE(src.almoxarifado_id::text, '-') AS label,
            COUNT(*) AS value
          FROM estoque.estoques_atual src
          WHERE
                ({{de}}::date IS NULL OR src.atualizado_em::date >= {{de}}::date)
                AND ({{ate}}::date IS NULL OR src.atualizado_em::date <= {{ate}}::date)
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
  </theme>
</dashboard-template>`
