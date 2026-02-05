import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import type { ViewerHandlers } from '../DriveViewerContent'

const Document = dynamic(() => import('react-pdf').then(m => (m as any).Document), { ssr: false }) as any
const Page = dynamic(() => import('react-pdf').then(m => (m as any).Page), { ssr: false }) as any

export default function PdfViewer({ url, register }: { url?: string; register?: (h: ViewerHandlers) => void }) {
  const [numPages, setNumPages] = useState<number | null>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    // Configure worker via react-pdf's pdfjs helper to avoid direct pdfjs-dist path issues
    (async () => {
      try {
        const mod: any = await import('react-pdf')
        const pdfjs = mod.pdfjs
        if (pdfjs?.GlobalWorkerOptions) {
          pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`
        }
      } catch {}
    })()
  }, [])

  useEffect(() => {
    register?.({
      zoomIn: () => setScale(s => Math.min(3, Number((s + 0.1).toFixed(2)))) ,
      zoomOut: () => setScale(s => Math.max(0.5, Number((s - 0.1).toFixed(2)))) ,
      resetZoom: () => setScale(1),
      getZoomText: () => `${Math.round(scale*100)}%`,
    })
  }, [register, scale])

  if (!url) return <div className="grid place-items-center text-neutral-400">Sem PDF</div>

  return (
    <div className="max-h-[82vh] overflow-auto bg-neutral-950">
      <Document file={url} onLoadSuccess={(p: any) => setNumPages(p.numPages)} loading={<div className="p-6 text-neutral-300">Carregando PDF…</div>}>
        {Array.from(new Array(numPages || 1), (el, index) => (
          <Page key={`p_${index+1}`} pageNumber={index + 1} className="mx-auto my-4" scale={scale} />
        ))}
      </Document>
    </div>
  )
}
