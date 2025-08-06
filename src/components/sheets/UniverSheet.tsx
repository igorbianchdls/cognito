'use client'

import { useEffect, useRef, useState } from 'react'
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core'
import UniverPresetSheetsCoreEnUS from '@univerjs/preset-sheets-core/locales/en-US'
import { createUniver, LocaleType, mergeLocales } from '@univerjs/presets'
import { CSVImportPlugin } from './CSVImportPlugin'
import CSVImportButton from './CSVImportButton'

import '@univerjs/preset-sheets-core/lib/index.css'

export default function UniverSheet() {
  const containerRef = useRef<HTMLDivElement>(null)
  const univerRef = useRef<{ univer: unknown; univerAPI: unknown } | null>(null)
  const [csvPlugin, setCsvPlugin] = useState<CSVImportPlugin | null>(null)

  useEffect(() => {
    if (!containerRef.current || univerRef.current) return

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

    const plugin = new CSVImportPlugin(univerAPI)
    setCsvPlugin(plugin)

    univerAPI.createWorkbook({})

    return () => {
      if (univerRef.current) {
        (univerRef.current.univer as { dispose: () => void }).dispose()
        univerRef.current = null
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