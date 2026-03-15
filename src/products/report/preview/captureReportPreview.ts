'use client'

declare global {
  interface Window {
    html2canvas?: (element: HTMLElement, options?: Record<string, unknown>) => Promise<HTMLCanvasElement>
  }
}

const HTML2CANVAS_SRC = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'

let html2canvasLoader: Promise<NonNullable<Window['html2canvas']>> | null = null

async function loadHtml2Canvas() {
  if (typeof window === 'undefined') {
    throw new Error('html2canvas is only available in the browser')
  }

  if (window.html2canvas) return window.html2canvas

  if (!html2canvasLoader) {
    html2canvasLoader = new Promise((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(`script[data-report-preview="html2canvas"]`)

      if (existingScript) {
        existingScript.addEventListener('load', () => {
          if (window.html2canvas) resolve(window.html2canvas)
        })
        existingScript.addEventListener('error', () => reject(new Error('Failed to load html2canvas')))
        return
      }

      const script = document.createElement('script')
      script.src = HTML2CANVAS_SRC
      script.async = true
      script.dataset.reportPreview = 'html2canvas'
      script.onload = () => {
        if (window.html2canvas) {
          resolve(window.html2canvas)
          return
        }
        reject(new Error('html2canvas did not initialize'))
      }
      script.onerror = () => reject(new Error('Failed to load html2canvas'))
      document.head.appendChild(script)
    })
  }

  return html2canvasLoader
}

export async function captureReportPreview(element: HTMLElement): Promise<string> {
  const html2canvas = await loadHtml2Canvas()
  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    logging: false,
    scale: 0.35,
    useCORS: true,
  })

  return canvas.toDataURL('image/png')
}
