'use client'

import WidgetsPanel from '@/components/apps/WidgetsPanel'
import ChatPanel from '@/components/apps/ChatPanel'
import WidgetEditor from '@/components/apps/WidgetEditorNew'
import CodeEditor from '@/components/apps/CodeEditor'
import AutomationsPanel from '@/components/apps/AutomationsPanel'
import SavedPanel from '@/components/apps/SavedPanel'
import type { DroppedWidget } from '@/types/widget'

interface SidebarPanelProps {
  activeTab: 'widgets' | 'chat' | 'editor' | 'code' | 'automations' | 'saved'
  collapsed?: boolean
  droppedWidgets?: DroppedWidget[]
  onEditWidget: (widgetId: string, changes: Partial<DroppedWidget>) => void
}

export default function SidebarPanel({ 
  activeTab, 
  collapsed = false, 
  droppedWidgets = [],
  onEditWidget
}: SidebarPanelProps) {
  return (
    <div className={`${
      collapsed 
        ? 'w-0 overflow-hidden' 
        : 'w-[480px] bg-gray-50 flex-shrink-0 overflow-hidden h-full'
    } transition-all duration-300 ease-in-out`}>
      {activeTab === 'widgets' && <WidgetsPanel />}
      {activeTab === 'chat' && <ChatPanel droppedWidgets={droppedWidgets} onEditWidget={onEditWidget} />}
      {activeTab === 'editor' && <WidgetEditor />}
      {activeTab === 'code' && <CodeEditor />}
      {activeTab === 'automations' && <AutomationsPanel />}
      {activeTab === 'saved' && <SavedPanel />}
    </div>
  )
}