'use client'

import { useStore } from '@nanostores/react'
import { Button } from '@/components/ui/button'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { 
  $styleClipboard, 
  $hasStylesInClipboard, 
  styleClipboardActions,
  type StyleClipboard
} from '@/stores/apps/styleClipboardStore'

interface StyleClipboardAccordionProps {
  currentWidgetType: 'kpi'
  currentWidgetId: string
}

export default function StyleClipboardAccordion({ 
  currentWidgetType, 
  currentWidgetId 
}: StyleClipboardAccordionProps) {
  const clipboard = useStore($styleClipboard)
  const hasStyles = useStore($hasStylesInClipboard)

  const handleCopyStyles = () => {
    styleClipboardActions.copyStyles(currentWidgetId, currentWidgetType)
  }

  const handlePasteStyles = () => {
    styleClipboardActions.pasteStyles(currentWidgetId, currentWidgetType)
  }

  const handleClearClipboard = () => {
    styleClipboardActions.clearClipboard()
  }

  // Format widget type for display - KPI only
  const formatWidgetType = (type: string) => {
    return 'KPI'
  }

  return (
    <AccordionItem value="style-clipboard">
      <AccordionTrigger className="text-sm font-medium">
        🎨 Style Clipboard
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
              Copies background, borders, and title typography
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
                    {clipboard.commonStyles.titleColor && (
                      <span className="bg-white px-1.5 py-0.5 rounded text-xs border">
                        Title Color
                      </span>
                    )}
                    {clipboard.commonStyles.titleFontSize && (
                      <span className="bg-white px-1.5 py-0.5 rounded text-xs border">
                        Font Size
                      </span>
                    )}
                    {clipboard.commonStyles.borderRadius && (
                      <span className="bg-white px-1.5 py-0.5 rounded text-xs border">
                        Radius
                      </span>
                    )}
                    {clipboard.commonStyles.titleFontWeight && (
                      <span className="bg-white px-1.5 py-0.5 rounded text-xs border">
                        Font Weight
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
                No styles copied yet
              </p>
            </div>
          )}

        </div>
      </AccordionContent>
    </AccordionItem>
  )
}