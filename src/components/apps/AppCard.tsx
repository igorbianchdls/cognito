'use client'

import { AppData } from '@/data/appsData'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { ExternalLink, GitFork, Heart, Eye } from 'lucide-react'
import Link from 'next/link'

interface AppCardProps {
  app: AppData
}

export default function AppCard({ app }: AppCardProps) {
  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace('.0', '') + 'k'
    }
    return num.toString()
  }

  return (
    <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white border border-gray-200">
      <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
        <img
          src={app.previewImage}
          alt={app.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Overlay with action buttons */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="flex gap-2">
            {app.demoUrl && (
              <a
                href={app.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-white text-gray-900 rounded-md text-sm font-medium hover:bg-gray-100 transition-colors flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="w-3 h-3" />
                Demo
              </a>
            )}
            {app.sourceUrl && (
              <a
                href={app.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-gray-900 text-white rounded-md text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
              >
                <GitFork className="w-3 h-3" />
                Code
              </a>
            )}
          </div>
        </div>

        {/* Featured badge */}
        {app.featured && (
          <div className="absolute top-2 left-2">
            <Badge variant="default" className="bg-blue-500 hover:bg-blue-600 text-white text-xs">
              Featured
            </Badge>
          </div>
        )}

        {/* Trending badge */}
        {app.trending && (
          <div className="absolute top-2 right-2">
            <Badge variant="outline" className="bg-white/90 text-orange-600 border-orange-200 text-xs">
              🔥 Trending
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Author Avatar */}
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm flex-shrink-0">
            {app.author.avatar}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <Link href={`/apps/${app.id}`} className="group">
              <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                {app.title}
              </h3>
            </Link>
            
            <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed">
              {app.description}
            </p>

            {/* Author and Stats */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <span className="font-medium">{app.author.name}</span>
              </div>
              
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <GitFork className="w-3 h-3" />
                  <span>{formatNumber(app.forks)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  <span>{formatNumber(app.likes)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>{formatNumber(app.views)}</span>
                </div>
              </div>
            </div>

            {/* Category Badge */}
            <div className="mt-3">
              <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-200">
                {app.category}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}