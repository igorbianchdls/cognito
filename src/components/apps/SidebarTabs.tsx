'use client'

import { BarChart3, MessageSquare, Settings, Code, Cpu, Archive } from 'lucide-react'

interface SidebarTabsProps {
  activeTab: 'widgets' | 'chat' | 'editor' | 'code' | 'automations' | 'saved'
  onTabChange: (tab: 'widgets' | 'chat' | 'editor' | 'code' | 'automations' | 'saved') => void
  collapsed?: boolean
}

export default function SidebarTabs({ activeTab, onTabChange, collapsed = false }: SidebarTabsProps) {
  const tabs = [
    { id: 'widgets', label: 'Widgets', icon: BarChart3 },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'editor', label: 'Editor', icon: Settings },
    { id: 'code', label: 'Code', icon: Code },
    { id: 'automations', label: 'Automações', icon: Cpu },
    { id: 'saved', label: 'Salvos', icon: Archive },
  ] as const

  return (
    <div className={`bg-gray-800 border-r border-gray-700 flex flex-col ${collapsed ? 'w-0 overflow-hidden' : 'w-16'} transition-all duration-300 ease-in-out`}>
      <div className="flex flex-col gap-1 p-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center gap-1 p-3 rounded-lg transition-all duration-200 group relative ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
            title={tab.label}
          >
            <tab.icon className="w-5 h-5" />
            <span className="text-xs font-medium truncate">
              {tab.label === 'Automações' ? 'Auto' : tab.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}