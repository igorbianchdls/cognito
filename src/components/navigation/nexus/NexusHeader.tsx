"use client"

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
import { ChevronDown, MessageSquare, Layout, BarChart3, Bell, BookOpen } from 'lucide-react'

type ViewMode = 'chat' | 'split' | 'dashboard'

interface NexusHeaderProps {
  viewMode: ViewMode
  onChangeViewMode: (mode: ViewMode) => void
  showBreadcrumb?: boolean
  borderless?: boolean
  size?: 'sm' | 'md'
  rightActions?: React.ReactNode
}

export default function NexusHeader({ viewMode, onChangeViewMode, showBreadcrumb = true, borderless = false, size = 'md', rightActions }: NexusHeaderProps) {
  const current = (
    viewMode === 'chat' ? { icon: <MessageSquare className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />, label: 'Chat' } :
    viewMode === 'split' ? { icon: <Layout className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />, label: 'Workspace' } :
    { icon: <BarChart3 className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />, label: 'Dashboard' }
  )

  const headerSizeClass = size === 'sm' ? 'h-14 px-3' : 'h-16 px-4'
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'
  const mainBtnSize = size === 'sm' ? 'h-8 px-2.5' : 'h-9 px-3'
  const circleBtnSize = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9'
  const breadcrumbTextLink = size === 'sm' ? 'text-sm' : 'text-[15px] md:text-base'
  const breadcrumbTextPage = size === 'sm' ? 'text-sm' : 'text-[15px] md:text-base'

  return (
    <header className={`flex ${headerSizeClass} shrink-0 items-center gap-2 bg-gray-50 ${borderless ? '' : 'border-b'}`}>
      {showBreadcrumb && (
        <Separator orientation="vertical" className={size === 'sm' ? 'mr-1 data-[orientation=vertical]:h-4' : 'mr-2 data-[orientation=vertical]:h-4'} />
      )}
      {showBreadcrumb && (
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="#" className={`${breadcrumbTextLink} text-gray-500 hover:text-gray-700`}>
                Navegação
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage className={`${breadcrumbTextPage} font-semibold text-gray-900`}>
                {current.label}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      )}

      {/* Center search bar */}
      <div className="flex-1 flex justify-center px-2">
        <form
          className="relative w-full max-w-2xl"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget as HTMLFormElement);
            const q = String(fd.get('q') || '').trim();
            if (q) {
              try { console.log('Header search:', q) } catch {}
            }
          }}
        >
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {/* magnifier */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
          </span>
          <input
            name="q"
            placeholder="Buscar, ir para… ou pergunte algo"
            className="w-full h-10 rounded-lg border border-gray-300 bg-white pl-9 pr-4 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400/40"
          />
        </form>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {rightActions}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={`flex items-center gap-2 ${mainBtnSize} rounded-lg text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-100 transition-colors`}>
              {current.icon} {current.label}
              <ChevronDown className={iconSize} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onChangeViewMode('chat')}>
              <MessageSquare className={`${iconSize} mr-2`} />
              Chat
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onChangeViewMode('split')}>
              <Layout className={`${iconSize} mr-2`} />
              Workspace
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onChangeViewMode('dashboard')}>
              <BarChart3 className={`${iconSize} mr-2`} />
              Dashboard
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Quick actions cluster to the right of the selector */}
        <div className="flex items-center gap-2">
          {/* Contact experts */}
          <button
            type="button"
            className={`hidden md:inline-flex items-center gap-2 ${mainBtnSize} rounded-lg text-sm font-medium bg-white text-gray-700 border border-gray-200 hover:bg-gray-100`}
            onClick={() => console.log('Contact experts')}
          >
            <img src="https://i.pravatar.cc/36?img=5" alt="" className="h-5 w-5 rounded-full" />
            Contact experts
          </button>
          {/* Notifications */}
          <button
            type="button"
            aria-label="Notificações"
            className={`relative ${circleBtnSize} rounded-full border bg-white text-gray-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
          >
            <Bell className={`${iconSize} mx-auto`} />
            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-blue-600 ring-2 ring-white" />
          </button>
          {/* Docs */}
          <button
            type="button"
            aria-label="Documentação"
            title="Documentação"
            onClick={() => { try { window.open('https://docs.creatto.app', '_blank'); } catch {} }}
            className={`${circleBtnSize} rounded-full border bg-white text-gray-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500`}
          >
            <BookOpen className={`${iconSize} mx-auto`} />
          </button>
          {/* User avatar (gradient) */}
          <button
            type="button"
            aria-label="Conta"
            title="Conta"
            className={`${size === 'sm' ? 'h-7 w-7' : 'h-8 w-8'} rounded-full ring-2 ring-white overflow-hidden`}
          >
            <img
              src="https://i.pravatar.cc/80?img=12"
              alt="Avatar"
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </button>
        </div>
      </div>
    </header>
  )
}
