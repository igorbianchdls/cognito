'use client'

import { useStore } from '@nanostores/react'
import { $savedDashboards, savedDashboardActions } from '@/stores/savedDashboardStore'

export default function SavedPanel() {
  const savedDashboards = useStore($savedDashboards)

  const handleLoad = (id: string) => {
    if (confirm('Carregar este dashboard? O dashboard atual será substituído.')) {
      savedDashboardActions.load(id)
    }
  }

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Excluir o dashboard &quot;${name}&quot;? Esta ação não pode ser desfeita.`)) {
      savedDashboardActions.delete(id)
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date)
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Dashboards Salvos</h2>
        <p className="text-sm text-gray-600 mt-1">
          {savedDashboards.length} dashboard{savedDashboards.length !== 1 ? 's' : ''} salvo{savedDashboards.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        {savedDashboards.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum dashboard salvo</h3>
            <p className="text-gray-600 mb-4">
              Crie um dashboard e clique em &quot;Salvar Atual&quot; para começar.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {savedDashboards.map((dashboard) => (
              <div
                key={dashboard.id}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
              >
                {/* Dashboard Info */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 mb-1">
                      {dashboard.name}
                    </h3>
                    {dashboard.description && (
                      <p className="text-xs text-gray-600 mb-2">
                        {dashboard.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      {dashboard.isMultiCanvas ? (
                        <span className="flex items-center gap-1">
                          📑 Multi-canvas • {dashboard.multiCanvasState?.tabs.length || 0} tabs • {dashboard.multiCanvasState?.tabs.reduce((total, tab) => total + tab.widgets.length, 0) || 0} widgets
                        </span>
                      ) : (
                        <span>
                          📊 {dashboard.widgets.length} widget{dashboard.widgets.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      <span>
                        📅 {formatDate(dashboard.createdAt)}
                      </span>
                    </div>
                    
                    {/* Multi-canvas badge */}
                    {dashboard.isMultiCanvas && (
                      <div className="mt-2">
                        <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full">
                          📑 Multi-Canvas
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleLoad(dashboard.id)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md transition-colors duration-200"
                  >
                    <span>📂</span>
                    Carregar
                  </button>
                  <button
                    onClick={() => handleDelete(dashboard.id, dashboard.name)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-md transition-colors duration-200"
                  >
                    <span>🗑️</span>
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      {savedDashboards.length > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-600 text-center">
            💡 Dica: Use &quot;Salvar Atual&quot; no header para salvar o dashboard atual
          </p>
        </div>
      )}
    </div>
  )
}