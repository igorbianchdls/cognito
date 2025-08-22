'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import GridCanvas from '@/components/apps/GridCanvas'
import MultiGridCanvas from '@/components/apps/MultiGridCanvas'
import { savedDashboardActions } from '@/stores/savedDashboardStore'
import type { SavedDashboard } from '@/types/savedDashboard'

export default function PreviewPage() {
  const searchParams = useSearchParams()
  const dashboardId = searchParams.get('id')
  
  const [dashboard, setDashboard] = useState<SavedDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!dashboardId) {
      setError('ID do dashboard não fornecido')
      setLoading(false)
      return
    }

    try {
      // Buscar dashboard nos salvos
      const savedDashboards = savedDashboardActions.list()
      const foundDashboard = savedDashboards.find(d => d.id === dashboardId)
      
      if (!foundDashboard) {
        setError('Dashboard não encontrado')
      } else {
        setDashboard(foundDashboard)
      }
    } catch (err) {
      setError('Erro ao carregar dashboard')
      console.error('Erro:', err)
    } finally {
      setLoading(false)
    }
  }, [dashboardId])

  // Estados de carregamento e erro
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  if (error || !dashboard) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Erro</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.close()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Fechar
          </button>
        </div>
      </div>
    )
  }

  // Função vazia para onLayoutChange (preview é read-only)
  const handleLayoutChange = () => {
    // Preview é somente leitura - não faz nada
  }

  // Renderizar dashboard
  return (
    <div className="h-screen bg-gray-50" style={{backgroundColor: '#FBFBFB'}}>
      {/* Header simples com nome do dashboard */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{dashboard.name}</h1>
            {dashboard.description && (
              <p className="text-sm text-gray-600">{dashboard.description}</p>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {dashboard.isMultiCanvas ? 
              `📑 Multi-canvas • ${dashboard.multiCanvasState?.tabs.length || 0} tabs` : 
              `📊 ${dashboard.widgets.length} widgets`
            }
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 p-6">
        {dashboard.isMultiCanvas && dashboard.multiCanvasState ? (
          <MultiGridCanvas 
            widgets={dashboard.widgets}
            onLayoutChange={handleLayoutChange}
            onRemoveWidget={() => {}}
            onEditWidget={() => {}}
          />
        ) : (
          <GridCanvas 
            widgets={dashboard.widgets}
            onLayoutChange={handleLayoutChange}
            onRemoveWidget={() => {}}
            onEditWidget={() => {}}
          />
        )}
      </div>
    </div>
  )
}