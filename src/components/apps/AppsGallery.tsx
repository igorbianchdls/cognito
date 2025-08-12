'use client'

import { useState, useMemo, useCallback } from 'react'
import { AppData, mockApps, getAppsByCategory, searchApps, getTrendingApps } from '@/data/appsData'
import AppCard from './AppCard'
import CategoryFilter from './CategoryFilter'
import SearchBar from './SearchBar'

export default function AppsGallery() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [showTrending, setShowTrending] = useState(false)

  // Filter and search logic
  const filteredApps = useMemo(() => {
    let apps: AppData[] = []

    if (showTrending) {
      apps = getTrendingApps()
    } else if (searchQuery) {
      apps = searchApps(searchQuery)
    } else {
      apps = getAppsByCategory(activeCategory)
    }

    return apps
  }, [activeCategory, searchQuery, showTrending])

  const handleCategoryChange = useCallback((category: string) => {
    setActiveCategory(category)
    setSearchQuery('')
    setShowTrending(false)
  }, [])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    if (query) {
      setActiveCategory('All')
      setShowTrending(false)
    }
  }, [])

  const handleTrendingToggle = useCallback(() => {
    setShowTrending(!showTrending)
    if (!showTrending) {
      setActiveCategory('All')
      setSearchQuery('')
    }
  }, [showTrending])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex justify-center items-center gap-3 mb-6">
              <span className="text-2xl">📱</span>
              <span className="text-2xl">🎨</span>
              <span className="text-2xl">🚀</span>
              <span className="text-2xl">⚡</span>
              <span className="text-2xl">🎯</span>
            </div>
            
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Discover the best apps, components
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              and starters from the community.
            </p>
            
            <SearchBar onSearch={handleSearch} />
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <CategoryFilter 
        activeCategory={activeCategory}
        onCategoryChange={handleCategoryChange}
        showTrending={showTrending}
        onTrendingToggle={handleTrendingToggle}
      />

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-600">
            {showTrending ? (
              <span>Showing {filteredApps.length} trending apps</span>
            ) : searchQuery ? (
              <span>Found {filteredApps.length} results for &ldquo;{searchQuery}&rdquo;</span>
            ) : (
              <span>
                {activeCategory === 'All' 
                  ? `Showing all ${filteredApps.length} apps` 
                  : `${filteredApps.length} apps in ${activeCategory}`
                }
              </span>
            )}
          </div>
          
          <div className="text-sm text-gray-500">
            {mockApps.length} total apps available
          </div>
        </div>

        {/* Apps Grid */}
        {filteredApps.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApps.map((app) => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No apps found
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery 
                ? `No results found for &ldquo;${searchQuery}&rdquo;. Try a different search term.`
                : showTrending
                ? "No trending apps at the moment. Check back later!"
                : `No apps found in the ${activeCategory} category.`
              }
            </p>
            <button 
              onClick={() => {
                setSearchQuery('')
                setActiveCategory('All')
                setShowTrending(false)
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse all apps
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p className="mb-2">
              Discover amazing apps and components created by the community
            </p>
            <p className="text-sm">
              Want to showcase your work? <span className="text-blue-600 hover:text-blue-800 cursor-pointer">Submit your app</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}