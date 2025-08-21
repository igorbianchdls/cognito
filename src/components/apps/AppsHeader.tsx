'use client'

import { BarChart3, MessageSquare, Settings, Code, Cpu, Archive } from 'lucide-react'
import { savedDashboardActions } from '@/stores/savedDashboardStore'

interface AppsHeaderProps {
  activeTab: 'widgets' | 'chat' | 'editor' | 'code' | 'automations' | 'saved'
  onTabChange: (tab: 'widgets' | 'chat' | 'editor' | 'code' | 'automations' | 'saved') => void
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
}

export default function AppsHeader({ activeTab, onTabChange, sidebarCollapsed, onToggleSidebar }: AppsHeaderProps) {
  const tabs = [
    { id: 'widgets', label: 'Widgets', icon: BarChart3 },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'editor', label: 'Editor', icon: Settings },
    { id: 'code', label: 'Code', icon: Code },
    { id: 'automations', label: 'Automações', icon: Cpu },
    { id: 'saved', label: 'Salvos', icon: Archive },
  ] as const

  return (
    <div className="bg-[#111111] border-b border-gray-800 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
        {/* Toggle Sidebar Button */}
        <button
          onClick={onToggleSidebar}
          className="mr-4 p-2 text-[#888888] hover:text-[#AAAAAA] hover:bg-gray-800 rounded-lg transition-colors duration-200"
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
            className={`flex items-center gap-2 px-4 py-1 rounded-lg text-base font-semibold transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-gray-800 text-white shadow-sm'
                : 'text-[#888888] hover:text-[#AAAAAA] hover:bg-gray-800'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
        </div>
        
        {/* Botão Salvar Atual - Extrema Direita */}
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
  )
}