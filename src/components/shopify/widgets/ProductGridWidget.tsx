'use client'

import type { ProductGridWidget as ProductGridWidgetType } from '@/types/shopifyWidgets'

interface ProductGridWidgetProps {
  widget: ProductGridWidgetType
}

export default function ProductGridWidget({ widget }: ProductGridWidgetProps) {
  const { config } = widget

  const products = config.products || []
  const columns = config.columns || 4
  const gridGap = config.gridGap || 20

  return (
    <section className="w-full py-12 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Featured Products
          </h2>
          <p className="text-gray-600">
            Discover our latest collection of amazing products
          </p>
        </div>

        {/* Filters and Sorting */}
        {(config.showFilters || config.showSorting) && (
          <div className="flex items-center justify-between mb-8 p-4 bg-white rounded-lg shadow-sm">
            {config.showFilters && (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Filter by:</span>
                <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                  <option>Category</option>
                  <option>Electronics</option>
                  <option>Clothing</option>
                  <option>Home</option>
                </select>
                <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                  <option>Price Range</option>
                  <option>$0 - $50</option>
                  <option>$50 - $100</option>
                  <option>$100+</option>
                </select>
              </div>
            )}

            {config.showSorting && (
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-700">Sort by:</span>
                <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                  <option>Featured</option>
                  <option>Price: Low to High</option>
                  <option>Price: High to Low</option>
                  <option>Newest</option>
                  <option>Best Selling</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* Products Grid */}
        <div 
          className="grid gap-6"
          style={{ 
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: `${gridGap}px`
          }}
        >
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow group">
              {/* Product Image */}
              <div className="relative overflow-hidden rounded-t-lg aspect-square">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                
                {/* Badge */}
                {product.badge && (
                  <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                    {product.badge}
                  </div>
                )}

                {/* Quick Actions */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="w-8 h-8 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-gray-50">
                    ❤️
                  </button>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-4">
                <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">
                  {product.name}
                </h3>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">
                      ${product.price}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-500 line-through">
                        ${product.originalPrice}
                      </span>
                    )}
                  </div>
                  
                  <button className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 transition-colors">
                    Add to Cart
                  </button>
                </div>

                {/* Rating */}
                <div className="flex items-center mt-2">
                  <div className="flex text-yellow-400">
                    ⭐⭐⭐⭐⭐
                  </div>
                  <span className="text-xs text-gray-500 ml-1">(4.5)</span>
                </div>
              </div>
            </div>
          ))}

          {/* Empty slots to show grid structure */}
          {products.length === 0 && (
            <>
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="bg-gray-100 rounded-lg aspect-square border-2 border-dashed border-gray-300 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <div className="text-3xl mb-2">📦</div>
                    <div className="text-sm">Product {index + 1}</div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Pagination */}
        {products.length > 0 && (
          <div className="flex items-center justify-center mt-12">
            <div className="flex items-center gap-2">
              <button className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">
                Previous
              </button>
              <button className="px-3 py-2 bg-purple-600 text-white rounded text-sm">1</button>
              <button className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">2</button>
              <button className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">3</button>
              <button className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}