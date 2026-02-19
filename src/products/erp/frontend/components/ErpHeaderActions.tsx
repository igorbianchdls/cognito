'use client'

import { Bell, User } from 'lucide-react'

export default function ErpHeaderActions() {
  return (
    <div className="ml-auto flex items-center gap-2 pr-1">
      <button
        type="button"
        aria-label="Notificacoes"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-500"
      >
        <Bell className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Perfil do usuario"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-600"
      >
        <User className="h-4 w-4" />
      </button>
    </div>
  )
}
