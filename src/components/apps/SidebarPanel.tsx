'use client'

import WidgetsPanel from '@/components/apps/WidgetsPanel'
import ChatPanel from '@/components/apps/ChatPanel'
import WidgetEditor from '@/components/apps/editor/WidgetEditorNew'
import CodeEditor from '@/components/apps/CodeEditor'
import AutomationsPanel from '@/components/apps/AutomationsPanel'
import SavedPanel from '@/components/apps/SavedPanel'
import DatasetsPanel from '@/components/apps/DatasetsPanel'
import type { DroppedWidget } from '@/types/apps/widget'

interface SidebarPanelProps {
  activeTab: 'widgets' | 'chat' | 'editor' | 'code' | 'automations' | 'saved' | 'datasets'
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
        : 'w-[480px] bg-gray-50 flex-shrink-0 overflow-hidden h-[calc(100vh-4rem)] border-r border-gray-200'
    } transition-all duration-300 ease-in-out`}>
      {activeTab === 'widgets' && <WidgetsPanel />}
      {activeTab === 'chat' && <ChatPanel droppedWidgets={droppedWidgets} onEditWidget={onEditWidget} />}
      {activeTab === 'editor' && <WidgetEditor />}
      {activeTab === 'code' && <CodeEditor />}
      {activeTab === 'automations' && <AutomationsPanel />}
      {activeTab === 'saved' && <SavedPanel />}
      {activeTab === 'datasets' && <DatasetsPanel />}
    </div>
  )
}