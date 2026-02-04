"use client"

import * as React from 'react'
import Link from 'next/link'
import { MoreHorizontal, Pencil, Trash } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { timeAgo } from '@/lib/date/relativeTime'

type Props = {
  id: string
  title?: string | null
  href: string
  updatedAt?: string
  lastMessageAt?: string | null
  selectable?: boolean
  checked?: boolean
  onCheckChange?: (v: boolean) => void
  onEdit?: () => void
  onDelete?: () => void
}

export default function ChatListItem({ id, title, href, updatedAt, lastMessageAt, selectable, checked, onCheckChange, onEdit, onDelete }: Props) {
  const subtitle = lastMessageAt
    ? `Última mensagem ${timeAgo(lastMessageAt)}`
    : updatedAt
      ? `Atualizado ${timeAgo(updatedAt)}`
      : ''
  return (
    <div className="px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start gap-3 p-4 border rounded-lg bg-white mb-2">
          {selectable && (
            <input type="checkbox" className="mt-1" checked={!!checked} onChange={(e)=> onCheckChange?.(e.target.checked)} />
          )}
          <div className="min-w-0 flex-1">
            <Link href={href} className="block text-[15px] leading-6 text-[#111827] hover:underline truncate">
              {title || 'Sem título'}
            </Link>
            {subtitle && (
              <div className="text-sm text-gray-500">{subtitle}</div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 rounded hover:bg-gray-100">
                <MoreHorizontal className="w-5 h-5 text-gray-600" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-40">
              <DropdownMenuItem onClick={onEdit} className="gap-2">
                <Pencil className="w-4 h-4" />
                Editar nome
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="gap-2 text-red-600 focus:text-red-700">
                <Trash className="w-4 h-4" />
                Deletar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
