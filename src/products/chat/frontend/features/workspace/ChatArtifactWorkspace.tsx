'use client'

import { Icon } from '@iconify/react'
import { useStore } from '@nanostores/react'
import { ChevronsLeft, ChevronsRight, X } from 'lucide-react'
import { useMemo, useState } from 'react'

import FileExplorer from '@/components/file-explorer/FileExplorer'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { sandboxActions, $previewArtifactPath, $sandboxActiveTab } from '@/chat/sandbox'
import { ArtifactPreviewStage } from '@/products/artifacts/core/workspace/components/ArtifactPreviewStage'
import { ArtifactWorkspaceHeader } from '@/products/artifacts/core/workspace/components/ArtifactWorkspaceHeader'
import HeaderActions from '@/products/chat/shared/chat-ui/components/HeaderActions'
import DashboardPicker from '@/products/chat/shared/chat-ui/components/json-render/DashboardPicker'
import JsonRenderPreview from '@/products/chat/shared/chat-ui/components/json-render/JsonRenderPreview'

function getTitleFromPreviewPath(path: string) {
  const fileName = String(path || '').split('/').filter(Boolean).pop() || 'workspace'
  return fileName.replace(/\.(dsl|tsx)$/i, '') || 'workspace'
}

export function ChatArtifactWorkspace({
  chatId,
  onClose,
  onExpand,
  expanded,
  className,
}: {
  chatId?: string
  onClose?: () => void
  onExpand?: () => void
  expanded?: boolean
  className?: string
}) {
  const activeTab = useStore($sandboxActiveTab)
  const previewPath = useStore($previewArtifactPath)
  const [zoom, setZoom] = useState(1)
  const [dashboardPickerOpen, setDashboardPickerOpen] = useState(false)
  const activeView = activeTab === 'code' ? 'code' : 'preview'
  const title = useMemo(() => getTitleFromPreviewPath(previewPath), [previewPath])

  return (
    <div className={`flex h-full min-h-0 w-full flex-col overflow-hidden ${className ?? ''}`}>
      <ArtifactWorkspaceHeader
        title={title}
        titleIcon="solar:document-bold"
        activeView={activeView}
        zoom={zoom}
        onChangeView={(view) => sandboxActions.setActiveTab(view)}
        onZoomChange={setZoom}
        showChromeActions={false}
        extraActions={
          <>
            <Popover open={dashboardPickerOpen} onOpenChange={setDashboardPickerOpen}>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  title="Selecionar dashboard"
                  aria-label="Selecionar dashboard"
                  className="flex items-center justify-center rounded-md border-[0.5px] border-[#DDDDD8] bg-[#ECECEB] px-2 py-[0.35rem] text-[14px] font-medium text-[#5F5F5A] transition hover:bg-[#E2E2E0] hover:text-[#4F4F4B]"
                >
                  <Icon icon="solar:widget-5-bold" className="mr-1 h-4 w-4" />
                  Dashboards
                  <Icon icon="solar:alt-arrow-down-outline" className="ml-1 h-3.5 w-3.5" />
                </button>
              </PopoverTrigger>
              <PopoverContent align="end" side="bottom" sideOffset={8} className="w-auto p-2">
                <DashboardPicker chatId={chatId} compact onSelected={() => setDashboardPickerOpen(false)} />
              </PopoverContent>
            </Popover>
            <HeaderActions chatId={chatId} />
            {onExpand ? (
              <button
                type="button"
                aria-label={expanded ? 'Collapse to split' : 'Expand'}
                onClick={onExpand}
                className="flex items-center justify-center rounded-md border-[0.5px] border-[#DDDDD8] bg-[#ECECEB] p-2 text-[#5F5F5A] transition hover:bg-[#E2E2E0] hover:text-[#4F4F4B]"
              >
                {expanded ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
              </button>
            ) : null}
            {onClose ? (
              <button
                type="button"
                aria-label="Fechar computador"
                onClick={onClose}
                className="flex items-center justify-center rounded-md border-[0.5px] border-[#DDDDD8] bg-[#ECECEB] p-2 text-[#5F5F5A] transition hover:bg-[#E2E2E0] hover:text-[#4F4F4B]"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </>
        }
      />
      <div className="min-h-0 flex-1 overflow-hidden bg-[#EEEEEB]">
        {activeView === 'code' ? (
          <FileExplorer chatId={chatId} />
        ) : (
          <ArtifactPreviewStage zoom={zoom} scaledStyle={{ width: '100%' }}>
            <JsonRenderPreview chatId={chatId} />
          </ArtifactPreviewStage>
        )}
      </div>
    </div>
  )
}
