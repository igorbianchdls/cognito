'use client'

import { useState, useMemo, useCallback } from 'react'
import { AppData, mockApps, searchApps } from '@/data/appsData'
import AppCard from './AppCard'
import SearchBar from './SearchBar'

export default function AppsGallery() {
  const [searchQuery, setSearchQuery] = useState('')

  // Filter and search logic
  const filteredApps = useMemo(() => {
    if (searchQuery) {
      return searchApps(searchQuery)
    }
    return mockApps
  }, [searchQuery])

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [])

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white">
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

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-600">
            {searchQuery ? (
              <span>Found {filteredApps.length} results for &ldquo;{searchQuery}&rdquo;</span>
            ) : (
              <span>Showing all {filteredApps.length} apps</span>
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
                : "No apps found."
              }
            </p>
            <button 
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse all apps
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white mt-16">
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