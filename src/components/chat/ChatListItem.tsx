"use client"

import * as React from 'react'
import Link from 'next/link'
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
}

export default function ChatListItem({ id, title, href, updatedAt, lastMessageAt, selectable, checked, onCheckChange }: Props) {
  const subtitle = lastMessageAt
    ? `Última mensagem ${timeAgo(lastMessageAt)}`
    : updatedAt
      ? `Atualizado ${timeAgo(updatedAt)}`
      : ''
  return (
    <div className="px-6" style={{ backgroundColor: 'rgb(253,253,254)' }}>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start gap-3 py-4 border-b">
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
        </div>
      </div>
    </div>
  )
}

