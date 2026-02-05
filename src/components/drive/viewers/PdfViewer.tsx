import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const PDF = dynamic(() => import('react-pdf').then(m => m.Document), { ssr: false }) as any
const Page = dynamic(() => import('react-pdf').then(m => m.Page), { ssr: false }) as any

export default function PdfViewer({ url }: { url?: string }) {
  const [numPages, setNumPages] = useState<number | null>(null)
  useEffect(() => {
    try { (async () => { const pdfjs = await import('pdfjs-dist/build/pdf') as any; pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`; })() } catch {}
  }, [])

  if (!url) return <div className="grid place-items-center text-neutral-400">Sem PDF</div>

  return (
    <div className="max-h-[82vh] overflow-auto bg-neutral-950">
      <PDF file={url} onLoadSuccess={(p: any) => setNumPages(p.numPages)} loading={<div className="p-6 text-neutral-300">Carregando PDF…</div>}>
        {Array.from(new Array(numPages || 1), (el, index) => (
          <Page key={`p_${index+1}`} pageNumber={index + 1} className="mx-auto my-4" width={920} />
        ))}
      </PDF>
    </div>
  )
}

