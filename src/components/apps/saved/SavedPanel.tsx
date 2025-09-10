'use client'

import { useStore } from '@nanostores/react'
import { $savedDashboards, savedDashboardActions } from '@/stores/apps/savedDashboardStore'
import { Eye, Calendar, BarChart3, FileText, Play, Trash2 } from 'lucide-react'

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

  const handlePreview = (id: string) => {
    window.open(`/apps/preview?id=${id}`, '_blank')
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date)
  }

  const getGradientForDashboard = (index: number) => {
    const gradients = [
      'from-blue-500 to-purple-600',
      'from-green-500 to-teal-600', 
      'from-orange-500 to-red-600',
      'from-purple-500 to-pink-600',
      'from-indigo-500 to-blue-600',
      'from-teal-500 to-green-600'
    ]
    return gradients[index % gradients.length]
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-gray-50">
      {/* Header */}
      <div className="p-4 border-b border-[0.5px] border-gray-200">
        <h2 className="text-lg font-semibold text-gray-700">Dashboards Salvos</h2>
        <p className="text-sm text-gray-600 mt-1">
          {savedDashboards.length} dashboard{savedDashboards.length !== 1 ? 's' : ''} salvo{savedDashboards.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        {savedDashboards.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Nenhum dashboard salvo</h3>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">
              Crie um dashboard e clique em "Salvar Atual" para começar a construir sua coleção.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedDashboards.map((dashboard, index) => (
              <div
                key={dashboard.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-300 group"
              >
                {/* Preview Header with Gradient */}
                <div className={`h-32 bg-gradient-to-br ${getGradientForDashboard(index)} relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/10"></div>
                  <div className="absolute top-3 left-3">
                    {dashboard.isMultiCanvas ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                        <FileText className="w-3 h-3" />
                        Multi-Canvas
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                        <BarChart3 className="w-3 h-3" />
                        Dashboard
                      </span>
                    )}
                  </div>
                  
                  {/* Decorative Pattern */}
                  <div className="absolute bottom-0 right-0 w-24 h-24 opacity-20">
                    <div className="w-full h-full bg-white/10 rounded-tl-full"></div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4">
                  {/* Dashboard Title */}
                  <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-1">
                    {dashboard.name}
                  </h3>
                  
                  {dashboard.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {dashboard.description}
                    </p>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      {dashboard.isMultiCanvas ? (
                        <>
                          <FileText className="w-3 h-3" />
                          <span>{dashboard.multiCanvasState?.tabs.length || 0} tabs</span>
                        </>
                      ) : (
                        <>
                          <BarChart3 className="w-3 h-3" />
                          <span>{dashboard.widgets.length} widgets</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(dashboard.createdAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLoad(dashboard.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all duration-200 group-hover:shadow-md"
                    >
                      <Play className="w-4 h-4" />
                      Carregar
                    </button>
                    <button
                      onClick={() => handlePreview(dashboard.id)}
                      className="flex items-center justify-center p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors duration-200"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(dashboard.id, dashboard.name)}
                      className="flex items-center justify-center p-2 bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 rounded-lg transition-colors duration-200"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      {savedDashboards.length > 0 && (
        <div className="p-4 border-t border-[0.5px] border-gray-200 bg-gray-50">
          <p className="text-xs text-gray-600 text-center">
            💡 Dica: Use &quot;Salvar Atual&quot; no header para salvar o dashboard atual
          </p>
        </div>
      )}
    </div>
  )
}