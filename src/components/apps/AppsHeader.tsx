'use client'

interface AppsHeaderProps {
  activeTab: 'widgets' | 'chat' | 'editor' | 'code' | 'automations'
  onTabChange: (tab: 'widgets' | 'chat' | 'editor' | 'code' | 'automations') => void
}

export default function AppsHeader({ activeTab, onTabChange }: AppsHeaderProps) {
  const tabs = [
    { id: 'widgets', label: 'Widgets', icon: '📊' },
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'editor', label: 'Editor', icon: '⚙️' },
    { id: 'code', label: 'Code', icon: '</>' },
    { id: 'automations', label: 'Automações', icon: '🤖' },
  ] as const

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center gap-1">
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
    </div>
  )
}