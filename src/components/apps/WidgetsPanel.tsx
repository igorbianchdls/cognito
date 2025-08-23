'use client'

import React, { useState } from 'react'
import DraggableWidget from './DraggableWidget'
import type { Widget } from '@/types/widget'

// Extended widget type for internal use with JSX icons
interface ExtendedWidget extends Omit<Widget, 'icon'> {
  icon: React.ReactElement | string
}

const widgetCategories: Record<string, ExtendedWidget[]> = {
  Analytics: [
    {
      id: 'bar-chart-widget',
      name: 'Bar Chart',
      type: 'chart-bar',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      description: 'Display data with vertical bars',
      defaultWidth: 4,
      defaultHeight: 3,
    },
    {
      id: 'line-chart-widget',
      name: 'Line Chart',
      type: 'chart-line',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12h-6l-2-2-2 2H3" />
        </svg>
      ),
      description: 'Show trends and data over time',
      defaultWidth: 4,
      defaultHeight: 3,
    },
    {
      id: 'pie-chart-widget',
      name: 'Pie Chart',
      type: 'chart-pie',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
      ),
      description: 'Show data distribution and percentages',
      defaultWidth: 3,
      defaultHeight: 3,
    },
    {
      id: 'area-chart-widget',
      name: 'Area Chart',
      type: 'chart-area',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M3 20h18" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} fill="currentColor" fillOpacity="0.1" d="M7 12l3-3 3 3 4-4v8H7v-4z" />
        </svg>
      ),
      description: 'Display filled area under data curves',
      defaultWidth: 4,
      defaultHeight: 3,
    },
    {
      id: 'kpi-widget',
      name: 'KPI',
      type: 'kpi',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      description: 'Display key performance indicators with trends',
      defaultWidth: 3,
      defaultHeight: 2,
    },
    {
      id: 'metric-widget',
      name: 'Metric',
      type: 'metric',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4m0 0l-3 3m3-3v3" />
        </svg>
      ),
      description: 'Show key performance metrics',
      defaultWidth: 2,
      defaultHeight: 1,
    },
  ],
  Components: [
    {
      id: 'text-widget',
      name: 'Text',
      type: 'text',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
        </svg>
      ),
      description: 'Display text content',
      defaultWidth: 3,
      defaultHeight: 1,
    },
    {
      id: 'table-widget',
      name: 'Table',
      type: 'table',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4h18v2H3V4zm0 4h18v2H3V8zm0 4h18v2H3v-2zm0 4h18v2H3v-2z" />
        </svg>
      ),
      description: 'Display data in organized table format with sorting and filtering',
      defaultWidth: 4,
      defaultHeight: 3,
    },
    {
      id: 'button-widget',
      name: 'Button',
      type: 'button',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
      ),
      description: 'Interactive button component',
      defaultWidth: 2,
      defaultHeight: 1,
    },
    {
      id: 'image-widget',
      name: 'Image',
      type: 'image',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      description: 'Display images with customizable styling and behavior',
      defaultWidth: 3,
      defaultHeight: 2,
    },
    {
      id: 'navigation-widget',
      name: 'Navigation',
      type: 'navigation',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      description: 'Transform canvas into multi-tab layout system',
      defaultWidth: 12,
      defaultHeight: 1,
    },
  ],
  Forms: [
    {
      id: 'form-widget',
      name: 'Form',
      type: 'form',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      description: 'Form container with validation',
      defaultWidth: 4,
      defaultHeight: 4,
    },
    {
      id: 'input-widget',
      name: 'Input',
      type: 'input',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16m-7 6h7" />
        </svg>
      ),
      description: 'Text input field',
      defaultWidth: 3,
      defaultHeight: 1,
    },
    {
      id: 'dropdown-widget',
      name: 'Dropdown',
      type: 'dropdown',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
        </svg>
      ),
      description: 'Dropdown selection',
      defaultWidth: 3,
      defaultHeight: 1,
    },
    {
      id: 'datepicker-widget',
      name: 'Datepicker',
      type: 'datepicker',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      description: 'Date picker component',
      defaultWidth: 3,
      defaultHeight: 1,
    },
    {
      id: 'checkbox-widget',
      name: 'Checkbox',
      type: 'checkbox',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
        </svg>
      ),
      description: 'Checkbox input',
      defaultWidth: 2,
      defaultHeight: 1,
    },
    {
      id: 'radio-widget',
      name: 'Radio',
      type: 'radio',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
          <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} />
        </svg>
      ),
      description: 'Radio button input',
      defaultWidth: 2,
      defaultHeight: 1,
    },
    {
      id: 'rich-text-widget',
      name: 'Rich Text',
      type: 'rich-text',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h7" />
        </svg>
      ),
      description: 'Rich text editor',
      defaultWidth: 4,
      defaultHeight: 3,
    },
    {
      id: 'file-picker-widget',
      name: 'FilePicker',
      type: 'file-picker',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
        </svg>
      ),
      description: 'File upload component',
      defaultWidth: 3,
      defaultHeight: 1,
    },
  ],
}

// Convert ExtendedWidget to standard Widget for drag and drop
const convertToWidget = (extendedWidget: ExtendedWidget): Widget => ({
  ...extendedWidget,
  icon: typeof extendedWidget.icon === 'string' ? extendedWidget.icon : '🔸'
})

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface WidgetsPanelProps {}

export default function WidgetsPanel({}: WidgetsPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    Analytics: true,
    Components: true,
    Forms: true,
  })

  // Filter widgets based on search query
  const filterWidgets = (widgets: ExtendedWidget[]) => {
    if (!searchQuery) return widgets
    return widgets.filter(widget => 
      widget.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }

  const toggleCategory = (categoryName: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }))
  }

  return (
    <div className="flex flex-col h-full" style={{backgroundColor: '#FBFBFB'}}>
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-lg font-semibold text-[#888888]">Components</h2>
          <svg className="w-4 h-4 text-[#888888]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-[#888888]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 bg-white border-[0.5px] border-gray-300 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {Object.entries(widgetCategories).map(([categoryName, widgets]) => {
          const filteredWidgets = filterWidgets(widgets)
          if (filteredWidgets.length === 0) return null

          return (
            <div key={categoryName} className="p-4">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(categoryName)}
                className="flex items-center justify-between w-full mb-3 text-left"
              >
                <h3 className="text-sm font-medium text-[#888888]">{categoryName}</h3>
                <svg 
                  className={`w-4 h-4 text-[#888888] transition-transform ${
                    expandedCategories[categoryName] ? 'transform rotate-180' : ''
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Widget Grid */}
              {expandedCategories[categoryName] && (
                <div className="grid grid-cols-2 gap-3">
                  {filteredWidgets.map((widget) => (
                    <DraggableWidget
                      key={widget.id}
                      widget={widget}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {/* No results message */}
        {searchQuery && Object.values(widgetCategories).every(widgets => filterWidgets(widgets).length === 0) && (
          <div className="p-8 text-center">
            <div className="text-[#888888] mb-2">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm text-[#888888] mb-1">No components found</p>
            <p className="text-xs text-[#888888]">Try adjusting your search</p>
          </div>
        )}
      </div>
    </div>
  )
}