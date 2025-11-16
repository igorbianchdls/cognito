"use client"

import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, MessageSquare, Layout, BarChart3 } from 'lucide-react'

type ViewMode = 'chat' | 'split' | 'dashboard'

interface NexusHeaderProps {
  viewMode: ViewMode
  onChangeViewMode: (mode: ViewMode) => void
  showBreadcrumb?: boolean
}

export default function NexusHeader({ viewMode, onChangeViewMode, showBreadcrumb = true }: NexusHeaderProps) {
  const current = (
    viewMode === 'chat' ? { icon: <MessageSquare className="w-4 h-4" />, label: 'Chat' } :
    viewMode === 'split' ? { icon: <Layout className="w-4 h-4" />, label: 'Workspace' } :
    { icon: <BarChart3 className="w-4 h-4" />, label: 'Dashboard' }
  )

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 px-4 bg-[#fdfdfd] border-b">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
      {showBreadcrumb && (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="#">Creatto</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>Nexus</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )}
      <div className="ml-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-100 transition-colors">
              {current.icon} {current.label}
              <ChevronDown className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onChangeViewMode('chat')}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onChangeViewMode('split')}>
              <Layout className="w-4 h-4 mr-2" />
              Workspace
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onChangeViewMode('dashboard')}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Dashboard
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
