'use client'

import { useMemo, useState } from 'react'

import { DataProvider } from '@/products/bi/json-render/context'
import JsonPreviewPanel from '@/products/bi/features/dashboard-editor/components/JsonPreviewPanel'
import {
  addWidget,
  addWidgetsBatch,
  createDashboard,
  createEmptyParserState,
  type AddWidgetInput,
  type AddWidgetsBatchInput,
  type CreateDashboardInput,
  type DashboardToolParserState,
} from '@/products/bi/features/dashboard-playground/tool-parser/dashboardToolParser'

type ToolAction = 'create_dashboard' | 'add_widget' | 'add_widgets_batch'

const EXAMPLES: Record<ToolAction, string> = {
  create_dashboard: JSON.stringify(
    {
      dashboard_name: 'tool-parser-demo',
      title: 'Dashboard Tool Parser',
      subtitle: 'Teste local do parser',
      theme: 'light',
    },
    null,
    2,
  ),
  add_widget: JSON.stringify(
    {
      dashboard_name: 'tool-parser-demo',
      widget_id: 'kpi-faturamento',
      widget_type: 'kpi',
      container: 'topo',
      payload: {
        title: 'Faturamento',
        tabela: 'vendas.pedidos',
        medida: 'SUM(valor_total)',
        fr: 1,
        formato: 'currency',
      },
    },
    null,
    2,
  ),
  add_widgets_batch: JSON.stringify(
    {
      dashboard_name: 'tool-parser-demo',
      widgets: [
        {
          dashboard_name: 'tool-parser-demo',
          widget_id: 'chart-canal',
          widget_type: 'chart',
          container: 'principal',
          payload: {
            chart_type: 'bar',
            title: 'Vendas por Canal',
            tabela: 'vendas.pedidos',
            dimensao: 'canal_venda',
            medida: 'SUM(valor_total)',
            fr: 2,
            formato: 'currency',
            limit: 8,
            ordem: { field: 'measure', dir: 'desc' },
          },
        },
        {
          dashboard_name: 'tool-parser-demo',
          widget_id: 'filtro-canal',
          widget_type: 'filtro',
          container: 'principal',
          payload: {
            title: 'Canal',
            campo: 'canal_venda_id',
            tabela: 'vendas.pedidos',
            tipo: 'list',
          },
        },
        {
          dashboard_name: 'tool-parser-demo',
          widget_id: 'insights-geral',
          widget_type: 'insights',
          container: 'principal',
          payload: {
            title: 'Insights',
            fr: 1,
            items: [
              'Concentração de receita em poucos canais.',
              'Ticket médio caiu no último período.',
            ],
          },
        },
      ],
    },
    null,
    2,
  ),
}

function ToolParserWorkspace() {
  const [state, setState] = useState<DashboardToolParserState>(() => createEmptyParserState())
  const [action, setAction] = useState<ToolAction>('create_dashboard')
  const [inputText, setInputText] = useState<string>(EXAMPLES.create_dashboard)
  const [lastStatus, setLastStatus] = useState<string>('Aguardando execução')

  const jsonOutput = useMemo(() => {
    if (!state.tree) return '[]'
    return JSON.stringify(state.tree, null, 2)
  }, [state.tree])

  function loadExample(nextAction: ToolAction) {
    setAction(nextAction)
    setInputText(EXAMPLES[nextAction])
  }

  function runParserAction() {
    try {
      const parsed = JSON.parse(inputText) as unknown

      if (action === 'create_dashboard') {
        const next = createDashboard(state, parsed as CreateDashboardInput)
        setState(next)
        setLastStatus('create_dashboard executada com sucesso')
        return
      }

      if (action === 'add_widget') {
        const next = addWidget(state, parsed as AddWidgetInput)
        setState(next)
        setLastStatus('add_widget executada com sucesso')
        return
      }

      const next = addWidgetsBatch(state, parsed as AddWidgetsBatchInput)
      setState(next)
      setLastStatus('add_widgets_batch executada com sucesso')
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setLastStatus(`Erro: ${message}`)
    }
  }

  function resetAll() {
    setState(createEmptyParserState())
    loadExample('create_dashboard')
    setLastStatus('Estado resetado')
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">
      <div className="md:col-span-2 space-y-3">
        <div className="rounded-md border border-gray-200 bg-white p-3">
          <h2 className="text-sm font-medium text-gray-900 mb-2">Simulador de Tool</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={() => loadExample('create_dashboard')}
              className="text-xs rounded border border-gray-300 bg-white px-2 py-1 hover:bg-gray-50"
            >
              Exemplo create
            </button>
            <button
              onClick={() => loadExample('add_widget')}
              className="text-xs rounded border border-gray-300 bg-white px-2 py-1 hover:bg-gray-50"
            >
              Exemplo add
            </button>
            <button
              onClick={() => loadExample('add_widgets_batch')}
              className="text-xs rounded border border-gray-300 bg-white px-2 py-1 hover:bg-gray-50"
            >
              Exemplo batch
            </button>
          </div>

          <label className="block text-xs text-gray-600 mb-1">Ação</label>
          <select
            className="mb-3 w-full rounded border border-gray-300 bg-white px-2 py-1 text-sm"
            value={action}
            onChange={(event) => loadExample(event.target.value as ToolAction)}
          >
            <option value="create_dashboard">create_dashboard</option>
            <option value="add_widget">add_widget</option>
            <option value="add_widgets_batch">add_widgets_batch</option>
          </select>

          <label className="block text-xs text-gray-600 mb-1">Input JSON</label>
          <textarea
            value={inputText}
            onChange={(event) => setInputText(event.target.value)}
            spellCheck={false}
            className="w-full min-h-[320px] rounded-md border border-gray-300 p-2 font-mono text-xs"
          />

          <div className="mt-3 flex gap-2">
            <button
              onClick={runParserAction}
              className="rounded border border-blue-600 bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
            >
              Executar
            </button>
            <button
              onClick={resetAll}
              className="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="rounded-md border border-gray-200 bg-white p-3">
          <h3 className="text-xs font-medium text-gray-900 mb-1">Status</h3>
          <p className="text-xs text-gray-700">{lastStatus}</p>
          <p className="text-xs text-gray-500 mt-2">
            Dashboard ativo: {state.dashboardName || 'nenhum'}
          </p>
        </div>

        <div className="rounded-md border border-gray-200 bg-white p-3">
          <h3 className="text-xs font-medium text-gray-900 mb-1">JSON Gerado</h3>
          <textarea
            readOnly
            value={jsonOutput}
            spellCheck={false}
            className="w-full min-h-[320px] rounded-md border border-gray-300 p-2 font-mono text-xs bg-gray-50"
          />
        </div>
      </div>

      <div className="md:col-span-3">
        <JsonPreviewPanel tree={state.tree} actionHint="Preview do parser" />
      </div>
    </div>
  )
}

export default function AppsToolParserPage() {
  return (
    <div className="min-h-screen">
      <div className="w-full">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Apps — Tool Parser</h1>
        <p className="text-sm text-gray-600 mb-6">
          Sandbox para testar parser de dashboard via ações de tool.
        </p>

        <DataProvider initialData={{ vendas: { dashboard: {}, kpis: {} } }}>
          <ToolParserWorkspace />
        </DataProvider>
      </div>
    </div>
  )
}
