'use client'

import { categories } from '@/components/apps/data'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

interface CategoryFilterProps {
  activeCategory: string
  onCategoryChange: (category: string) => void
  showTrending?: boolean
  onTrendingToggle?: () => void
}

export default function CategoryFilter({ 
  activeCategory, 
  onCategoryChange, 
  showTrending = false, 
  onTrendingToggle 
}: CategoryFilterProps) {
  return (
    <div className="bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          {/* Categories */}
          <ScrollArea className="flex-1">
            <div className="flex items-center gap-2 pb-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => onCategoryChange(category)}
                  className={`px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
                    activeCategory === category
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </ScrollArea>

          {/* Trending Toggle */}
          {onTrendingToggle && (
            <div className="ml-4 flex items-center gap-2">
              <button
                onClick={onTrendingToggle}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                  showTrending
                    ? 'bg-orange-100 text-orange-700 border border-orange-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🔥 Trending
                {showTrending && (
                  <Badge variant="secondary" className="ml-1 bg-orange-200 text-orange-800">
                    ON
                  </Badge>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
