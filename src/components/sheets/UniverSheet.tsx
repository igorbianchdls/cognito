'use client'

import { useEffect, useRef } from 'react'
import { UniverSheetsCorePreset } from '@univerjs/preset-sheets-core'
import UniverPresetSheetsCoreEnUS from '@univerjs/preset-sheets-core/locales/en-US'
import { createUniver, LocaleType, mergeLocales } from '@univerjs/presets'

import '@univerjs/preset-sheets-core/lib/index.css'

export default function UniverSheet() {
  const containerRef = useRef<HTMLDivElement>(null)
  const univerRef = useRef<{ univer: unknown; univerAPI: unknown } | null>(null)

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

    univerAPI.createWorkbook({})

    return () => {
      if (univerRef.current) {
        (univerRef.current.univer as { dispose: () => void }).dispose()
        univerRef.current = null
      }
    }
  }, [])

  return (
    <div className="w-full h-screen">
      <div 
        ref={containerRef} 
        className="w-full h-full"
      />
    </div>
  )
}