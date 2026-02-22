import type { DocumentosHtmlRenderOutput, DocumentosPdfRenderOutput } from '@/products/documentos/backend/features/rendering/types'

type PlaywrightModule = {
  chromium?: {
    launch: (opts?: Record<string, unknown>) => Promise<any>
  }
}

async function importPlaywright(): Promise<PlaywrightModule | null> {
  try {
    const dynamicImport = new Function('specifier', 'return import(specifier)') as (specifier: string) => Promise<unknown>
    return await dynamicImport('playwright') as PlaywrightModule
  } catch {
    return null
  }
}

function launchArgs(): string[] {
  return [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--font-render-hinting=none',
  ]
}

export async function tryRenderHtmlToPdfWithPlaywright(input: DocumentosHtmlRenderOutput): Promise<DocumentosPdfRenderOutput | null> {
  const mod = await importPlaywright()
  if (!mod?.chromium?.launch) return null

  let browser: any = null
  try {
    browser = await mod.chromium.launch({ headless: true, args: launchArgs() })
    const page = await browser.newPage()
    await page.setContent(input.html, { waitUntil: 'domcontentloaded' })
    const pdfBuffer: Uint8Array = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '12mm',
        right: '10mm',
        bottom: '12mm',
        left: '10mm',
      },
    })
    try { await page.close() } catch {}

    return {
      bytes: pdfBuffer,
      fileName: input.fileName,
      contentType: 'application/pdf',
      engine: 'playwright',
    }
  } catch {
    return null
  } finally {
    if (browser) {
      try { await browser.close() } catch {}
    }
  }
}
