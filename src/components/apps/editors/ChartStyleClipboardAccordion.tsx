'use client'

import { useStore } from '@nanostores/react'
import { Button } from '@/components/ui/button'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { 
  $chartStyleClipboard, 
  $hasChartStylesInClipboard, 
  chartStyleClipboardActions,
  getChartCompatibilityInfo,
  type ChartStyleClipboard
} from '@/stores/apps/chartStyleClipboardStore'

interface ChartStyleClipboardAccordionProps {
  currentWidgetType: ChartStyleClipboard['sourceWidgetType']
  currentWidgetId: string
}

export default function ChartStyleClipboardAccordion({ 
  currentWidgetType, 
  currentWidgetId 
}: ChartStyleClipboardAccordionProps) {
  const clipboard = useStore($chartStyleClipboard)
  const hasStyles = useStore($hasChartStylesInClipboard)

  const handleCopyStyles = () => {
    chartStyleClipboardActions.copyStyles(currentWidgetId, currentWidgetType)
  }

  const handlePasteStyles = () => {
    chartStyleClipboardActions.pasteStyles(currentWidgetId, currentWidgetType)
  }

  const handleClearClipboard = () => {
    chartStyleClipboardActions.clearClipboard()
  }

  // Format widget type for display
  const formatWidgetType = (type: string) => {
    switch (type) {
      case 'chart-bar': return 'Bar Chart'
      case 'chart-line': return 'Line Chart'
      case 'chart-pie': return 'Pie Chart'
      case 'chart-area': return 'Area Chart'
      case 'chart-horizontal-bar': return 'Horizontal Bar Chart'
      default: return 'Chart'
    }
  }

  // Get compatibility info when clipboard has styles
  const compatibilityInfo = clipboard ? getChartCompatibilityInfo(
    clipboard.sourceWidgetType,
    currentWidgetType,
    clipboard.commonStyles
  ) : null

  return (
    <AccordionItem value="chart-style-clipboard">
      <AccordionTrigger className="text-sm font-medium">
        🎨 Chart Style Clipboard
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4">
          
          {/* Copy Section */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Copy Chart Styles
            </label>
            <Button 
              onClick={handleCopyStyles}
              className="w-full text-sm"
              variant="outline"
            >
              📋 Copy from {formatWidgetType(currentWidgetType)}
            </Button>
            <p className="text-xs text-gray-500 mt-1">
              Copies typography, container styles, colors, and layout
            </p>
          </div>

          {/* Paste Section - Only show if clipboard has styles */}
          {hasStyles && clipboard && (
            <div className="border-t pt-4">
              <label className="block text-xs font-medium text-gray-600 mb-2">
                Paste Styles
              </label>
              
              {/* Clipboard Info */}
              <div className="bg-gray-50 rounded-md p-3 mb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-700">
                      Copied from: {formatWidgetType(clipboard.sourceWidgetType)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(clipboard.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <Button
                    onClick={handleClearClipboard}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    title="Clear clipboard"
                  >
                    🗑️
                  </Button>
                </div>

                {/* Compatibility Info */}
                {compatibilityInfo && (
                  <div className="mt-3 pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-medium text-gray-700">Compatibility</p>
                      <div className={`text-xs px-2 py-1 rounded ${
                        compatibilityInfo.isFullyCompatible 
                          ? 'bg-green-100 text-green-700' 
                          : compatibilityInfo.compatibilityPercentage >= 70
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-orange-100 text-orange-700'
                      }`}>
                        {compatibilityInfo.compatibilityPercentage}%
                      </div>
                    </div>
                    
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Total properties:</span>
                        <span>{compatibilityInfo.totalProps}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Will be applied:</span>
                        <span className="text-green-600">{compatibilityInfo.totalCompatible}</span>
                      </div>
                      {compatibilityInfo.specificProps > 0 && !compatibilityInfo.isFullyCompatible && (
                        <div className="flex justify-between">
                          <span>Specific (ignored):</span>
                          <span className="text-gray-400">{compatibilityInfo.specificProps - compatibilityInfo.compatibleSpecificProps}</span>
                        </div>
                      )}
                    </div>

                    {compatibilityInfo.isFullyCompatible ? (
                      <p className="text-xs text-green-600 mt-2">✅ Same chart type - All properties will be applied</p>
                    ) : (
                      <p className="text-xs text-orange-600 mt-2">⚠️ Cross-type paste - Only compatible properties will be applied</p>
                    )}
                  </div>
                )}
                
                {/* Preview of copied styles with compatibility indicators */}
                <div className="mt-2 text-xs text-gray-600">
                  <p className="font-medium mb-1">Properties to apply:</p>
                  <div className="flex flex-wrap gap-1">
                    {/* Typography styles */}
                    {clipboard.commonStyles.axisTextColor && (
                      <span className="bg-white px-1.5 py-0.5 rounded text-xs border">
                        Axis Color
                      </span>
                    )}
                    {clipboard.commonStyles.axisFontSize && (
                      <span className="bg-white px-1.5 py-0.5 rounded text-xs border">
                        Axis Size
                      </span>
                    )}
                    {clipboard.commonStyles.axisFontFamily && (
                      <span className="bg-white px-1.5 py-0.5 rounded text-xs border">
                        Axis Font
                      </span>
                    )}
                    
                    {/* Labels styles */}
                    {clipboard.commonStyles.labelsTextColor && (
                      <span className="bg-white px-1.5 py-0.5 rounded text-xs border">
                        Labels Color
                      </span>
                    )}
                    {clipboard.commonStyles.labelsFontSize && (
                      <span className="bg-white px-1.5 py-0.5 rounded text-xs border">
                        Labels Size
                      </span>
                    )}
                    
                    {/* Legends styles */}
                    {clipboard.commonStyles.legendsTextColor && (
                      <span className="bg-white px-1.5 py-0.5 rounded text-xs border">
                        Legend Color
                      </span>
                    )}
                    {clipboard.commonStyles.legendsFontSize && (
                      <span className="bg-white px-1.5 py-0.5 rounded text-xs border">
                        Legend Size
                      </span>
                    )}
                    
                    {/* Container styles */}
                    {clipboard.commonStyles.containerBorderColor && (
                      <span className="bg-white px-1.5 py-0.5 rounded text-xs border">
                        Border Color
                      </span>
                    )}
                    {clipboard.commonStyles.containerBorderRadius && (
                      <span className="bg-white px-1.5 py-0.5 rounded text-xs border">
                        Border Radius
                      </span>
                    )}
                    {clipboard.commonStyles.containerPadding && (
                      <span className="bg-white px-1.5 py-0.5 rounded text-xs border">
                        Padding
                      </span>
                    )}
                    {clipboard.commonStyles.containerShadowBlur && (
                      <span className="bg-white px-1.5 py-0.5 rounded text-xs border">
                        Shadow
                      </span>
                    )}
                    
                    {/* Colors */}
                    {clipboard.commonStyles.colors && clipboard.commonStyles.colors.length > 0 && (
                      <span className="bg-white px-1.5 py-0.5 rounded text-xs border">
                        Colors ({clipboard.commonStyles.colors.length})
                      </span>
                    )}
                    
                    {/* Specific Properties with compatibility indicators */}
                    {/* Bar Chart Specific */}
                    {clipboard.commonStyles.groupMode && (
                      <span className={`px-1.5 py-0.5 rounded text-xs border ${
                        (currentWidgetType === 'chart-bar' || currentWidgetType === 'chart-horizontal-bar')
                          ? 'bg-green-50 border-green-200 text-green-700'
                          : 'bg-gray-50 border-gray-200 text-gray-400'
                      }`}>
                        Group Mode {(currentWidgetType !== 'chart-bar' && currentWidgetType !== 'chart-horizontal-bar') && '(ignored)'}
                      </span>
                    )}
                    {clipboard.commonStyles.layout && (
                      <span className={`px-1.5 py-0.5 rounded text-xs border ${
                        (currentWidgetType === 'chart-bar' || currentWidgetType === 'chart-horizontal-bar')
                          ? 'bg-green-50 border-green-200 text-green-700'
                          : 'bg-gray-50 border-gray-200 text-gray-400'
                      }`}>
                        Layout {(currentWidgetType !== 'chart-bar' && currentWidgetType !== 'chart-horizontal-bar') && '(ignored)'}
                      </span>
                    )}
                    
                    {/* Pie Chart Specific */}
                    {clipboard.commonStyles.innerRadius !== undefined && (
                      <span className={`px-1.5 py-0.5 rounded text-xs border ${
                        currentWidgetType === 'chart-pie'
                          ? 'bg-green-50 border-green-200 text-green-700'
                          : 'bg-gray-50 border-gray-200 text-gray-400'
                      }`}>
                        Inner Radius {currentWidgetType !== 'chart-pie' && '(ignored)'}
                      </span>
                    )}
                    {clipboard.commonStyles.padAngle !== undefined && (
                      <span className={`px-1.5 py-0.5 rounded text-xs border ${
                        currentWidgetType === 'chart-pie'
                          ? 'bg-green-50 border-green-200 text-green-700'
                          : 'bg-gray-50 border-gray-200 text-gray-400'
                      }`}>
                        Pad Angle {currentWidgetType !== 'chart-pie' && '(ignored)'}
                      </span>
                    )}
                    
                    {/* Line Chart Specific */}
                    {clipboard.commonStyles.enableDots !== undefined && (
                      <span className={`px-1.5 py-0.5 rounded text-xs border ${
                        currentWidgetType === 'chart-line'
                          ? 'bg-green-50 border-green-200 text-green-700'
                          : 'bg-gray-50 border-gray-200 text-gray-400'
                      }`}>
                        Enable Dots {currentWidgetType !== 'chart-line' && '(ignored)'}
                      </span>
                    )}
                    {clipboard.commonStyles.lineWidth !== undefined && (
                      <span className={`px-1.5 py-0.5 rounded text-xs border ${
                        currentWidgetType === 'chart-line'
                          ? 'bg-green-50 border-green-200 text-green-700'
                          : 'bg-gray-50 border-gray-200 text-gray-400'
                      }`}>
                        Line Width {currentWidgetType !== 'chart-line' && '(ignored)'}
                      </span>
                    )}
                    
                    {/* Area Chart Specific */}
                    {clipboard.commonStyles.enableStacking !== undefined && (
                      <span className={`px-1.5 py-0.5 rounded text-xs border ${
                        currentWidgetType === 'chart-area'
                          ? 'bg-green-50 border-green-200 text-green-700'
                          : 'bg-gray-50 border-gray-200 text-gray-400'
                      }`}>
                        Enable Stacking {currentWidgetType !== 'chart-area' && '(ignored)'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Paste Button */}
              <div className="flex gap-2">
                <Button 
                  onClick={handlePasteStyles}
                  className="flex-1 text-sm"
                >
                  ✨ Paste to {formatWidgetType(currentWidgetType)}
                </Button>
              </div>
              
              <p className="text-xs text-gray-500 mt-1">
                {compatibilityInfo?.isFullyCompatible 
                  ? 'All properties including specific ones will be applied'
                  : 'Common properties will be applied, specific ones only if compatible'
                }
              </p>
            </div>
          )}

          {/* No styles message */}
          {!hasStyles && (
            <div className="text-center py-2">
              <p className="text-xs text-gray-500">
                No chart styles copied yet
              </p>
            </div>
          )}

        </div>
      </AccordionContent>
    </AccordionItem>
  )
}