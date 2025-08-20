'use client'

import type { HeaderWidget as HeaderWidgetType } from '@/types/shopifyWidgets'

interface HeaderWidgetProps {
  widget: HeaderWidgetType
}

export default function HeaderWidget({ widget }: HeaderWidgetProps) {
  const { config } = widget

  return (
    <header 
      className="w-full px-6 py-4 shadow-sm"
      style={{ 
        backgroundColor: config.backgroundColor || '#ffffff',
        color: config.textColor || '#000000',
        height: config.height || 80
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between h-full">
        {/* Logo */}
        <div className="flex items-center">
          {config.logo ? (
            <img 
              src={config.logo} 
              alt={config.logoAlt || 'Logo'} 
              className="h-8 w-auto"
            />
          ) : (
            <div className="text-2xl font-bold" style={{ color: config.textColor || '#000000' }}>
              Your Store
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          {config.navigationLinks?.map((link, index) => (
            <a
              key={index}
              href={link.url}
              className={`text-sm font-medium transition-colors hover:text-purple-600 ${
                link.isActive ? 'text-purple-600' : ''
              }`}
              style={{ 
                color: link.isActive ? '#7C3AED' : config.textColor || '#000000'
              }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right Section */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          {config.showSearch && (
            <button 
              className="p-2 rounded-md hover:bg-gray-100 transition-colors"
              title="Search"
            >
              🔍
            </button>
          )}

          {/* Cart */}
          {config.showCart && (
            <button 
              className="relative p-2 rounded-md hover:bg-gray-100 transition-colors"
              title="Shopping Cart"
            >
              🛒
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                0
              </span>
            </button>
          )}

          {/* Mobile Menu */}
          <button 
            className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            title="Menu"
          >
            ☰
          </button>
        </div>
      </div>

      {/* Sticky indicator */}
      {config.sticky && (
        <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-purple-500 to-pink-500"></div>
      )}
    </header>
  )
}