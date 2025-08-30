'use client'

import type { CategoriesWidget as CategoriesWidgetType } from '@/types/apps/shopifyWidgets'

interface CategoriesWidgetProps {
  widget: CategoriesWidgetType
}

export default function CategoriesWidget({ widget }: CategoriesWidgetProps) {
  const { config } = widget
  const categories = config.categories || []
  const columns = config.columns || 3

  return (
    <section className="w-full py-12 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Shop by Category
          </h2>
          <p className="text-gray-600">
            Explore our wide range of product categories
          </p>
        </div>

        {/* Categories Grid */}
        <div 
          className="grid gap-6"
          style={{ 
            gridTemplateColumns: `repeat(${columns}, 1fr)`
          }}
        >
          {categories.map((category) => (
            <a
              key={category.id}
              href={category.url}
              className="group relative overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Category Image */}
              <div className="aspect-video overflow-hidden">
                <img 
                  src={category.image} 
                  alt={category.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Category Info Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
                <div className="p-4 text-white w-full">
                  <h3 className="text-xl font-semibold mb-1">
                    {category.name}
                  </h3>
                  {config.showProductCount && category.productCount && (
                    <p className="text-sm opacity-90">
                      {category.productCount} products
                    </p>
                  )}
                </div>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-purple-600 bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
            </a>
          ))}

          {/* Empty slots to show grid structure */}
          {categories.length === 0 && (
            <>
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="bg-gray-100 rounded-lg aspect-video border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <div className="text-3xl mb-2">📂</div>
                    <div className="text-sm">Category {index + 1}</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* View All Button */}
        <div className="text-center mt-8">
          <button className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
            View All Categories
          </button>
        </div>
      </div>
    </section>
  )
}