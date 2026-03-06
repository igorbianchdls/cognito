import { migrateTemplateDataQueries } from '@/products/bi/shared/templates/dataQuerySqlMigration'
import { renderDashboardTemplateDslFromJsonText } from '@/products/bi/shared/templates/templateDslBridge'
export const APPS_DOCUMENTOS_TEMPLATE_TEXT = JSON.stringify(migrateTemplateDataQueries(
  [
    {
      type: 'Theme',
      props: {
        name: 'light',
        managers: {
          border: {
            style: 'solid',
            width: 1,
            color: '#bfc9d9',
            radius: 8,
            frame: { variant: 'hud', cornerSize: 8, cornerWidth: 1 },
          },
        },
      },
      children: [
        {
          type: 'Header',
          props: {
            title: 'Dashboard de Documentos',
            subtitle: 'Templates, versões e documentos gerados',
            align: 'center',
            datePicker: {
              visible: true,
              mode: 'range',
              position: 'right',
              storePath: 'filters.dateRange',
              actionOnChange: { type: 'refresh_data' },
              style: { padding: 6, fontFamily: 'Barlow', fontSize: 12 },
            },
          },
        },
        {
          type: 'Div',
          props: {
            direction: 'row',
            gap: 12,
            padding: 16,
            justify: 'start',
            align: 'start',
            childGrow: true,
          },
          children: [
            {
              type: 'AISummary',
              props: {
                fr: 2,
                title: 'Insights da IA',
                items: [
                  { icon: 'badgeCheck', text: 'Monitorar templates e documentos gerados evita retrabalho em operações recorrentes.' },
                  { icon: 'sparkles', text: 'Picos de geração podem indicar campanhas, faturamento ou períodos de renovação.' },
                  { icon: 'triangleAlert', text: 'Documentos pendentes de envio/assinatura devem ser acompanhados por status.' },
                ],
              },
            },
            { type: 'KPI', props: { fr: 1, title: 'Últimos 30 dias', valuePath: 'documentos.kpis.ultimos_30_dias', format: 'number' } },
          ],
        },
        {
          type: 'Div',
          props: {
            direction: 'row',
            gap: 12,
            padding: 16,
            justify: 'start',
            align: 'start',
            childGrow: true,
          },
          children: [
            { type: 'KPI', props: { title: 'Templates Ativos', valuePath: 'documentos.kpis.templates_ativos', format: 'number' } },
            { type: 'KPI', props: { title: 'Versões Publicadas', valuePath: 'documentos.kpis.versoes_publicadas', format: 'number' } },
            { type: 'KPI', props: { title: 'Documentos Gerados', valuePath: 'documentos.kpis.documentos_gerados', format: 'number' } },
            { type: 'KPI', props: { title: 'Documentos Enviados', valuePath: 'documentos.kpis.documentos_enviados', format: 'number' } },
          ],
        },
        {
          type: 'Div',
          props: {
            direction: 'row',
            gap: 12,
            padding: 16,
            justify: 'start',
            align: 'start',
            childGrow: true,
          },
          children: [
            { type: 'KPI', props: { title: 'Pendentes de Geração', valuePath: 'documentos.kpis.pendentes_geracao', format: 'number' } },
            { type: 'KPI', props: { title: 'Com Erro', valuePath: 'documentos.kpis.com_erro', format: 'number' } },
            { type: 'KPI', props: { title: 'Assinados', valuePath: 'documentos.kpis.assinados', format: 'number' } },
          ],
        },
      ],
    },
  ]),
  null,
  2,
)

export const APPS_DOCUMENTOS_TEMPLATE_DSL = renderDashboardTemplateDslFromJsonText(APPS_DOCUMENTOS_TEMPLATE_TEXT, 'apps_documentos_template_dsl')
