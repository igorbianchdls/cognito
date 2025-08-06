'use client'

import { useEffect, useRef, useState } from 'react'
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core'
import UniverPresetSheetsCoreEnUS from '@univerjs/preset-sheets-core/locales/en-US'
import { createUniver, LocaleType, mergeLocales } from '@univerjs/presets'
import { CSVImportPlugin } from './CSVImportPlugin'
import CSVImportButton from './CSVImportButton'
import { 
  univerAPIStore, 
  univerInstanceStore, 
  sheetDataStore, 
  sheetToolsStore,
  updateSheetData,
  setSheetError,
  setSheetLoading,
  SheetTools
} from '@/stores/sheetsStore'

import '@univerjs/preset-sheets-core/lib/index.css'

export default function UniverSheet() {
  const containerRef = useRef<HTMLDivElement>(null)
  const univerRef = useRef<{ univer: unknown; univerAPI: unknown } | null>(null)
  const [csvPlugin, setCsvPlugin] = useState<CSVImportPlugin | null>(null)

  useEffect(() => {
    if (!containerRef.current || univerRef.current) return

    setSheetLoading(true)

    try {
      const { univer, univerAPI } = createUniver({
        locale: LocaleType.EN_US,
        locales: {
          [LocaleType.EN_US]: mergeLocales(
            UniverPresetSheetsCoreEnUS,
          ),
        },
        presets: [
          UniverSheetsCorePreset({
            container: containerRef.current,
          }),
        ],
      })

      univerRef.current = { univer, univerAPI }
      
      // Store Univer instances in nano-stores
      univerInstanceStore.set(univer)
      univerAPIStore.set(univerAPI)

      const plugin = new CSVImportPlugin(univerAPI)
      setCsvPlugin(plugin)

      // Create initial workbook
      const workbook = univerAPI.createWorkbook({})

      // Create sheet manipulation tools
      const tools: SheetTools = {
        addColumn: async (name: string, position?: number) => {
          try {
            const activeSheet = univerAPI.getActiveWorkbook()?.getActiveSheet()
            if (!activeSheet) throw new Error('No active sheet')
            
            const currentCols = activeSheet.getMaxColumns()
            const insertPos = position ?? currentCols
            
            activeSheet.insertColumn(insertPos)
            updateSheetToolsData()
          } catch (error) {
            setSheetError(`Erro ao adicionar coluna: ${error}`)
          }
        },

        applyFormula: async (range: string, formula: string) => {
          try {
            const activeSheet = univerAPI.getActiveWorkbook()?.getActiveSheet()
            if (!activeSheet) throw new Error('No active sheet')
            
            activeSheet.setFormula(range, formula)
            updateSheetToolsData()
          } catch (error) {
            setSheetError(`Erro ao aplicar fórmula: ${error}`)
          }
        },

        updateCell: async (row: number, col: number, value: any) => {
          try {
            const activeSheet = univerAPI.getActiveWorkbook()?.getActiveSheet()
            if (!activeSheet) throw new Error('No active sheet')
            
            activeSheet.setCellValue(row, col, value)
            updateSheetToolsData()
          } catch (error) {
            setSheetError(`Erro ao atualizar célula: ${error}`)
          }
        },

        createChart: async (range: string, type: string) => {
          try {
            console.log(`Creating chart of type ${type} for range ${range}`)
            // TODO: Implement chart creation when Univer chart plugin is available
          } catch (error) {
            setSheetError(`Erro ao criar gráfico: ${error}`)
          }
        },

        exportData: async (format: 'csv' | 'excel') => {
          try {
            const activeSheet = univerAPI.getActiveWorkbook()?.getActiveSheet()
            if (!activeSheet) throw new Error('No active sheet')
            
            console.log(`Exporting data as ${format}`)
            // TODO: Implement export functionality
          } catch (error) {
            setSheetError(`Erro ao exportar dados: ${error}`)
          }
        },

        insertRow: async (position?: number) => {
          try {
            const activeSheet = univerAPI.getActiveWorkbook()?.getActiveSheet()
            if (!activeSheet) throw new Error('No active sheet')
            
            const currentRows = activeSheet.getMaxRows()
            const insertPos = position ?? currentRows
            
            activeSheet.insertRow(insertPos)
            updateSheetToolsData()
          } catch (error) {
            setSheetError(`Erro ao inserir linha: ${error}`)
          }
        },

        deleteRow: async (position: number) => {
          try {
            const activeSheet = univerAPI.getActiveWorkbook()?.getActiveSheet()
            if (!activeSheet) throw new Error('No active sheet')
            
            activeSheet.deleteRow(position)
            updateSheetToolsData()
          } catch (error) {
            setSheetError(`Erro ao deletar linha: ${error}`)
          }
        },

        deleteColumn: async (position: number) => {
          try {
            const activeSheet = univerAPI.getActiveWorkbook()?.getActiveSheet()
            if (!activeSheet) throw new Error('No active sheet')
            
            activeSheet.deleteColumn(position)
            updateSheetToolsData()
          } catch (error) {
            setSheetError(`Erro ao deletar coluna: ${error}`)
          }
        }
      }

      // Store tools in nano-store
      sheetToolsStore.set(tools)

      // Function to update sheet data in store
      const updateSheetToolsData = () => {
        try {
          const activeSheet = univerAPI.getActiveWorkbook()?.getActiveSheet()
          if (!activeSheet) return

          const maxRows = activeSheet.getMaxRows()
          const maxCols = activeSheet.getMaxColumns()
          
          // Get data (simplified - could be optimized)
          const rows: any[][] = []
          const headers: string[] = []
          
          // Get headers (first row)
          for (let col = 0; col < Math.min(maxCols, 10); col++) {
            const cellValue = activeSheet.getCellValue(0, col)
            headers.push(cellValue?.toString() || `Column ${col + 1}`)
          }
          
          // Get data rows (limit to first 100 for performance)
          for (let row = 0; row < Math.min(maxRows, 100); row++) {
            const rowData: any[] = []
            for (let col = 0; col < Math.min(maxCols, 10); col++) {
              const cellValue = activeSheet.getCellValue(row, col)
              rowData.push(cellValue)
            }
            rows.push(rowData)
          }

          updateSheetData({
            rows,
            headers,
            totalRows: maxRows,
            totalCols: maxCols,
            selectedCells: [] // TODO: implement selection tracking
          })
        } catch (error) {
          console.error('Error updating sheet data:', error)
        }
      }

      // Initial data update
      updateSheetToolsData()

      setSheetLoading(false)
      setSheetError(null)

    } catch (error) {
      setSheetError(`Erro ao inicializar planilha: ${error}`)
      setSheetLoading(false)
    }

    return () => {
      if (univerRef.current) {
        (univerRef.current.univer as { dispose: () => void }).dispose()
        univerRef.current = null
        univerAPIStore.set(null)
        univerInstanceStore.set(null)
        sheetToolsStore.set(null)
      }
    }
  }, [])

  return (
    <div className="w-full h-screen relative">
      <div className="absolute top-1 right-4 z-[9999] pointer-events-auto">
        <CSVImportButton 
          csvPlugin={csvPlugin}
          disabled={!csvPlugin}
        />
      </div>
      
      <div 
        ref={containerRef} 
        className="w-full h-full"
      />
    </div>
  )
}