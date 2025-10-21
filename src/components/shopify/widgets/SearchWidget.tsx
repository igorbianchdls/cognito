'use client'

import type { SearchWidget as SearchWidgetType } from '@/types/apps/shopifyWidgets'

interface SearchWidgetProps {
  widget: SearchWidgetType
}

export default function SearchWidget({ widget }: SearchWidgetProps) {
  const { config } = widget

  return (
    <section className="w-full py-8 px-6">
      <div className="max-w-4xl mx-auto">
        
        {/* Search Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            🔍 Search Products
          </h2>
          <p className="text-gray-600">
            Find exactly what you&apos;re looking for
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <div className="flex">
            <input
              type="text"
              placeholder={config.placeholder || 'Search products...'}
              className="flex-1 px-4 py-3 border-2 rounded-l-lg text-lg focus:outline-none focus:border-purple-500 transition-colors"
              style={{
                backgroundColor: config.backgroundColor || '#ffffff',
                borderColor: config.borderColor || '#d1d5db',
                color: config.textColor || '#000000'
              }}
            />
            <button className="px-6 py-3 bg-purple-600 text-white rounded-r-lg hover:bg-purple-700 transition-colors">
              Search
            </button>
          </div>
        </div>

        {/* Categories Filter */}
        {config.showCategories && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Search by Category:</h3>
            <div className="flex flex-wrap gap-2">
              {['All', 'Electronics', 'Clothing', 'Home', 'Books', 'Sports', 'Beauty'].map((category) => (
                <button
                  key={category}
                  className="px-3 py-1 border border-gray-300 rounded-full text-sm hover:bg-purple-50 hover:border-purple-300 transition-colors"
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recent Searches */}
        {config.showRecentSearches && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Searches:</h3>
            <div className="flex flex-wrap gap-2">
              {['iPhone', 'Sneakers', 'Coffee Maker', 'Laptop', 'Headphones'].map((search) => (
                <button
                  key={search}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                >
                  {search}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Suggestions */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Popular Searches:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { emoji: '📱', term: 'Electronics' },
              { emoji: '👕', term: 'Fashion' },
              { emoji: '🏠', term: 'Home & Garden' },
              { emoji: '⚽', term: 'Sports' }
            ].map((item) => (
              <button
                key={item.term}
                className="flex items-center gap-2 p-2 bg-white rounded border hover:border-purple-300 hover:bg-purple-50 transition-colors"
              >
                <span className="text-lg">{item.emoji}</span>
                <span className="text-sm font-medium">{item.term}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}