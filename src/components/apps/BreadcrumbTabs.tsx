'use client'

import { BarChart3, MessageSquare, Settings, Code, Cpu, Archive } from 'lucide-react'

interface BreadcrumbTabsProps {
  activeTab: 'widgets' | 'chat' | 'editor' | 'code' | 'automations' | 'saved'
  onTabChange: (tab: 'widgets' | 'chat' | 'editor' | 'code' | 'automations' | 'saved') => void
}

export default function BreadcrumbTabs({ activeTab, onTabChange }: BreadcrumbTabsProps) {
  const tabs = [
    { id: 'widgets', label: 'Widgets', icon: BarChart3 },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'editor', label: 'Editor', icon: Settings },
    { id: 'code', label: 'Code', icon: Code },
    { id: 'automations', label: 'Automações', icon: Cpu },
    { id: 'saved', label: 'Salvos', icon: Archive },
  ] as const

  return (
    <div className="flex items-center gap-1 ml-8">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? 'bg-gray-100 text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <tab.icon className="w-4 h-4" />
          <span className="hidden sm:inline">
            {tab.label === 'Automações' ? 'Auto' : tab.label}
          </span>
        </button>
      ))}
    </div>
  )
}