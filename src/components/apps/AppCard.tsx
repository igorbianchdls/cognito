'use client'

import type { AppData } from '@/components/apps/data'
import { MoreHorizontal } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'

interface AppCardProps {
  app: AppData
}

export default function AppCard({ app }: AppCardProps) {
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <Link href={`/apps/${app.id}`}>
      <div className="group cursor-pointer bg-white border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300 transition-colors">
        {/* Preview Area */}
        <div className="aspect-[16/9] bg-gray-100 flex items-center justify-center relative">
          <img
            src={app.previewImage}
            alt={app.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          
          {/* Three-dot menu on hover */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-1 bg-white rounded-md shadow-sm border border-gray-200 hover:bg-gray-50">
              <MoreHorizontal className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-3">
          {/* Title */}
          <h3 className="font-medium text-gray-900 text-sm line-clamp-1 mb-1">
            {app.title}
          </h3>

          {/* Metadata */}
          <div className="flex items-center text-xs text-gray-500">
            <Avatar className="w-4 h-4 mr-2">
              <AvatarImage src="" alt={app.author.name} />
              <AvatarFallback className="text-xs bg-gray-200 text-gray-600">
                {app.author.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span>{app.author.name}</span>
            <span className="mx-2">•</span>
            <span>Edited {formatDate(app.updatedAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
