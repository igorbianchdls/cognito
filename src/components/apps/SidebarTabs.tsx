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
    <div className={`bg-white border-r border-gray-200 flex flex-col h-full ${collapsed ? 'w-0 overflow-hidden' : 'w-16'} transition-all duration-300 ease-in-out`}>
      <div className="flex flex-col gap-1 p-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center gap-1 p-3 rounded-lg transition-all duration-200 group relative ${
              activeTab === tab.id
                ? 'bg-gray-100 text-[#888888] shadow-sm'
                : 'text-[#888888] hover:text-[#888888] hover:bg-gray-50'
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