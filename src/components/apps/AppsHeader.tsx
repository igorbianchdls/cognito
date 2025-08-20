'use client'

import { savedDashboardActions } from '@/stores/savedDashboardStore'

interface AppsHeaderProps {
  activeTab: 'widgets' | 'chat' | 'editor' | 'code' | 'automations' | 'saved'
  onTabChange: (tab: 'widgets' | 'chat' | 'editor' | 'code' | 'automations' | 'saved') => void
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
}

export default function AppsHeader({ activeTab, onTabChange, sidebarCollapsed, onToggleSidebar }: AppsHeaderProps) {
  const tabs = [
    { id: 'widgets', label: 'Widgets', icon: '📊' },
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'editor', label: 'Editor', icon: '⚙️' },
    { id: 'code', label: 'Code', icon: '</>' },
    { id: 'automations', label: 'Automações', icon: '🤖' },
    { id: 'saved', label: 'Salvos', icon: '💾' },
  ] as const

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
        {/* Toggle Sidebar Button */}
        <button
          onClick={onToggleSidebar}
          className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          title={sidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          <span className="text-lg font-mono">
            {sidebarCollapsed ? '☰' : '⟨'}
          </span>
        </button>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-blue-100 text-blue-700 shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
        </div>
        
        {/* Botão Salvar Atual - Extrema Direita */}
        <button
          onClick={savedDashboardActions.promptAndSave}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors duration-200"
          title="Salvar dashboard atual"
        >
          <span className="text-base">💾</span>
          Salvar Atual
        </button>
      </div>
    </div>
  )
}