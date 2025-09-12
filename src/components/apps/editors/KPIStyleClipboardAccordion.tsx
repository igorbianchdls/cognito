'use client'

import { useStore } from '@nanostores/react'
import { Button } from '@/components/ui/button'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { 
  $kpiStyleClipboard, 
  $hasKPIStylesInClipboard, 
  kpiStyleClipboardActions,
  type KPIStyleClipboard
} from '@/stores/apps/kpiStyleClipboardStore'

interface KPIStyleClipboardAccordionProps {
  currentWidgetType: 'kpi'
  currentWidgetId: string
}

export default function KPIStyleClipboardAccordion({ 
  currentWidgetType, 
  currentWidgetId 
}: KPIStyleClipboardAccordionProps) {
  const clipboard = useStore($kpiStyleClipboard)
  const hasStyles = useStore($hasKPIStylesInClipboard)

  const handleCopyStyles = () => {
    kpiStyleClipboardActions.copyStyles(currentWidgetId, currentWidgetType)
  }

  const handlePasteStyles = () => {
    kpiStyleClipboardActions.pasteStyles(currentWidgetId, currentWidgetType)
  }

  const handleClearClipboard = () => {
    kpiStyleClipboardActions.clearClipboard()
  }

  // Format widget type for display - KPI only
  const formatWidgetType = (type: string) => {
    return 'KPI'
  }

  return (
    <AccordionItem value="kpi-style-clipboard">
      <AccordionTrigger className="text-sm font-medium">
        🎨 KPI Style Clipboard
      </AccordionTrigger>
      <AccordionContent>
        <div className="space-y-4">
          
          {/* Copy Section */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Copy Common Styles
            </label>
            <Button 
              onClick={handleCopyStyles}
              className="w-full text-sm"
              variant="outline"
            >
              📋 Copy from {formatWidgetType(currentWidgetType)}
            </Button>
            <p className="text-xs text-gray-500 mt-1">
              Copies card styles, value/title typography, and subtitle/name typography
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
                
                {/* Preview of copied styles */}
                <div className="mt-2 text-xs text-gray-600">
                  <p className="font-medium mb-1">Styles available:</p>
                  <div className="flex flex-wrap gap-1">
                    {/* Card styles */}
                    {clipboard.commonStyles.backgroundColor && (
                      <span className="bg-white px-1.5 py-0.5 rounded text-xs border">
                        Background
                      </span>
                    )}
                    {clipboard.commonStyles.borderColor && (
                      <span className="bg-white px-1.5 py-0.5 rounded text-xs border">
                        Border
                      </span>
                    )}
                    {clipboard.commonStyles.borderRadius && (
                      <span className="bg-white px-1.5 py-0.5 rounded text-xs border">
                        Radius
                      </span>
                    )}
                    {clipboard.commonStyles.shadow && (
                      <span className="bg-white px-1.5 py-0.5 rounded text-xs border">
                        Shadow
                      </span>
                    )}
                    {clipboard.commonStyles.padding && (
                      <span className="bg-white px-1.5 py-0.5 rounded text-xs border">
                        Padding
                      </span>
                    )}
                    
                    {/* Value/Title styles */}
                    {clipboard.commonStyles.valueColor && (
                      <span className="bg-white px-1.5 py-0.5 rounded text-xs border">
                        Value Color
                      </span>
                    )}
                    {clipboard.commonStyles.valueFontSize && (
                      <span className="bg-white px-1.5 py-0.5 rounded text-xs border">
                        Value Size
                      </span>
                    )}
                    {clipboard.commonStyles.valueFontWeight && (
                      <span className="bg-white px-1.5 py-0.5 rounded text-xs border">
                        Value Weight
                      </span>
                    )}
                    
                    {/* Name/Subtitle styles */}
                    {clipboard.commonStyles.nameColor && (
                      <span className="bg-white px-1.5 py-0.5 rounded text-xs border">
                        Name Color
                      </span>
                    )}
                    {clipboard.commonStyles.nameFontSize && (
                      <span className="bg-white px-1.5 py-0.5 rounded text-xs border">
                        Name Size
                      </span>
                    )}
                    {clipboard.commonStyles.nameFontWeight && (
                      <span className="bg-white px-1.5 py-0.5 rounded text-xs border">
                        Name Weight
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
                Only compatible styles will be applied
              </p>
            </div>
          )}

          {/* No styles message */}
          {!hasStyles && (
            <div className="text-center py-2">
              <p className="text-xs text-gray-500">
                No KPI styles copied yet
              </p>
            </div>
          )}

        </div>
      </AccordionContent>
    </AccordionItem>
  )
}