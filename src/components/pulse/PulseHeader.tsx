"use client"

import { Search } from 'lucide-react'
import React from 'react'

type PulseHeaderProps = {
  title: string
  subtitle?: React.ReactNode
  label?: string
  onSearch?: (query: string) => void
  searchPlaceholder?: string
}

export function PulseHeader({
  title,
  subtitle,
  label = 'Tableau Pulse',
  onSearch,
  searchPlaceholder = 'Search for metrics',
}: PulseHeaderProps) {
  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="text-sm font-medium text-gray-500">{label}</div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900 mt-1">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-gray-600 max-w-3xl">{subtitle}</p>
          )}
        </div>
        <div className="w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              className="pl-9 pr-3 py-2 w-full md:w-72 rounded-lg border border-gray-200 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200"
              placeholder={searchPlaceholder}
              onChange={(e) => onSearch?.(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default PulseHeader

