'use client'

import { DataProvider } from '@/products/bi/json-render/context'
import { SlideWorkspace } from '@/products/slide/workspace/SlideWorkspace'

export default function SlidePage() {
  return (
    <DataProvider initialData={{ ui: {}, filters: {}, slide: {} }}>
      <SlideWorkspace />
    </DataProvider>
  )
}
