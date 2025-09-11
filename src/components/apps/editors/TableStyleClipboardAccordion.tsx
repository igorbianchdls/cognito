'use client'

import { useStore } from '@nanostores/react'
import { 
  $tableStyleClipboard, 
  $hasTableStylesInClipboard, 
  tableStyleClipboardActions 
} from '@/stores/apps/tableStyleClipboardStore'
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Copy, Paste, Clipboard, X } from "lucide-react"

interface TableStyleClipboardAccordionProps {
  currentWidgetType: 'table'
  currentWidgetId: string
}

export default function TableStyleClipboardAccordion({
  currentWidgetType,
  currentWidgetId
}: TableStyleClipboardAccordionProps) {
  const clipboard = useStore($tableStyleClipboard)
  const hasStyles = useStore($hasTableStylesInClipboard)

  const handleCopyStyles = () => {
    tableStyleClipboardActions.copyStyles(currentWidgetId, currentWidgetType)
  }

  const handlePasteStyles = () => {
    tableStyleClipboardActions.pasteStyles(currentWidgetId, currentWidgetType)
  }

  const handleClearClipboard = () => {
    tableStyleClipboardActions.clearClipboard()
  }

  return (
    <AccordionItem value="table-style-clipboard">
      <AccordionTrigger className="text-sm py-3">
        <div className="flex items-center gap-2">
          <Clipboard className="h-4 w-4" />
          <span>Style Clipboard</span>
          {hasStyles && (
            <div className="w-2 h-2 bg-green-500 rounded-full" title="Has copied styles" />
          )}
        </div>
      </AccordionTrigger>
      
      <AccordionContent className="pt-4 pb-6">
        <div className="space-y-4">
          
          {/* Copy Styles Button */}
          <div>
            <Button
              onClick={handleCopyStyles}
              variant="outline"
              size="sm"
              className="w-full flex items-center gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy Table Styles
            </Button>
            <p className="text-xs text-gray-500 mt-1">
              Copy visual styles from this table
            </p>
          </div>

          {/* Paste Styles Button */}
          <div>
            <Button
              onClick={handlePasteStyles}
              disabled={!hasStyles}
              variant="outline"
              size="sm"
              className="w-full flex items-center gap-2"
            >
              <Paste className="h-4 w-4" />
              Paste Table Styles
            </Button>
            <p className="text-xs text-gray-500 mt-1">
              Apply copied styles to this table
            </p>
          </div>

          {/* Clipboard Status */}
          {hasStyles && clipboard && (
            <div className="bg-gray-50 rounded-md p-3 border">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-medium text-gray-700">Copied Styles</h4>
                <Button
                  onClick={handleClearClipboard}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="space-y-2 text-xs">
                <div className="text-gray-600">
                  <strong>Source:</strong> Table ({clipboard.sourceWidgetId})
                </div>
                
                {/* Style Preview */}
                <div className="grid grid-cols-1 gap-1 text-gray-600">
                  
                  {/* Header Styles */}
                  {clipboard.commonStyles.headerBackground && (
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded border"
                        style={{ backgroundColor: clipboard.commonStyles.headerBackground }}
                      />
                      <span>Header: {clipboard.commonStyles.headerBackground}</span>
                    </div>
                  )}
                  
                  {clipboard.commonStyles.headerTextColor && (
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded border"
                        style={{ backgroundColor: clipboard.commonStyles.headerTextColor }}
                      />
                      <span>Header Text: {clipboard.commonStyles.headerTextColor}</span>
                    </div>
                  )}

                  {/* Font Properties */}
                  {clipboard.commonStyles.headerFontSize && (
                    <div>Font Size: {clipboard.commonStyles.headerFontSize}px</div>
                  )}
                  
                  {clipboard.commonStyles.headerFontFamily && (
                    <div>Font: {clipboard.commonStyles.headerFontFamily}</div>
                  )}

                  {clipboard.commonStyles.headerFontWeight && (
                    <div>Weight: {clipboard.commonStyles.headerFontWeight}</div>
                  )}

                  {/* Cell Styles */}
                  {clipboard.commonStyles.cellTextColor && (
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded border"
                        style={{ backgroundColor: clipboard.commonStyles.cellTextColor }}
                      />
                      <span>Cell Text: {clipboard.commonStyles.cellTextColor}</span>
                    </div>
                  )}

                  {clipboard.commonStyles.cellFontSize && (
                    <div>Cell Size: {clipboard.commonStyles.cellFontSize}px</div>
                  )}

                  {clipboard.commonStyles.cellFontFamily && (
                    <div>Cell Font: {clipboard.commonStyles.cellFontFamily}</div>
                  )}

                  {/* Layout Styles */}
                  {clipboard.commonStyles.padding !== undefined && (
                    <div>Padding: {clipboard.commonStyles.padding}px</div>
                  )}

                  {clipboard.commonStyles.borderColor && (
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded border"
                        style={{ backgroundColor: clipboard.commonStyles.borderColor }}
                      />
                      <span>Border: {clipboard.commonStyles.borderColor}</span>
                    </div>
                  )}

                  {clipboard.commonStyles.borderWidth !== undefined && (
                    <div>Border Width: {clipboard.commonStyles.borderWidth}px</div>
                  )}

                  {clipboard.commonStyles.borderRadius !== undefined && (
                    <div>Border Radius: {clipboard.commonStyles.borderRadius}px</div>
                  )}

                  {/* Row Colors */}
                  {clipboard.commonStyles.rowHoverColor && (
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded border"
                        style={{ backgroundColor: clipboard.commonStyles.rowHoverColor }}
                      />
                      <span>Hover: {clipboard.commonStyles.rowHoverColor}</span>
                    </div>
                  )}
                  
                </div>
                
                <div className="text-gray-500 pt-1 border-t">
                  Copied {new Date(clipboard.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}

          {/* Help Text */}
          {!hasStyles && (
            <div className="text-xs text-gray-500 bg-gray-50 rounded-md p-3 border">
              <p><strong>How to use:</strong></p>
              <ol className="list-decimal list-inside space-y-1 mt-2">
                <li>Click "Copy Table Styles" on a table with your desired styling</li>
                <li>Select another table you want to apply the styles to</li>
                <li>Click "Paste Table Styles" to apply the copied styles</li>
              </ol>
            </div>
          )}
          
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}