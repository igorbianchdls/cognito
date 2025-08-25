'use client'

import { Archive, Eye } from 'lucide-react'
import { savedDashboardActions } from '@/stores/savedDashboardStore'

interface AppsHeaderProps {
  onToggleSidebarTabs: () => void
  onToggleSidebarPanel: () => void
  sidebarTabsCollapsed: boolean
  sidebarPanelCollapsed: boolean
  onPreview: () => void
}

export default function AppsHeader({ onToggleSidebarTabs, onToggleSidebarPanel, sidebarTabsCollapsed, sidebarPanelCollapsed, onPreview }: AppsHeaderProps) {
  return (
    <div className="bg-gray-100 border-b border-gray-200 px-6 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
        {/* Toggle SidebarTabs Button */}
        <button
          onClick={onToggleSidebarTabs}
          className="mr-4 p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors duration-200"
          title={sidebarTabsCollapsed ? 'Expandir sidebar tabs' : 'Colapsar sidebar tabs'}
        >
          <span className="text-lg font-mono">
            {sidebarTabsCollapsed ? '☰' : '⟨'}
          </span>
        </button>
        {/* Toggle SidebarPanel Button */}
        <button
          onClick={onToggleSidebarPanel}
          className="mr-4 p-2 text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition-colors duration-200"
          title={sidebarPanelCollapsed ? 'Expandir panel' : 'Colapsar panel'}
        >
          <span className="text-lg font-mono">
            {sidebarPanelCollapsed ? '☰' : '⟨'}
          </span>
        </button>
        </div>
        
        {/* Botões da direita */}
        <div className="flex items-center gap-3">
          <button
            onClick={onPreview}
            className="flex items-center gap-2 px-4 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-base font-semibold transition-colors duration-200 border border-blue-500"
            title="Visualizar dashboard"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          
          <button
            onClick={savedDashboardActions.promptAndSave}
            className="flex items-center gap-2 px-4 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-base font-semibold transition-colors duration-200 border border-gray-600"
            title="Salvar dashboard atual"
          >
            <Archive className="w-4 h-4" />
            Salvar Atual
          </button>
        </div>
      </div>
    </div>
  )
}