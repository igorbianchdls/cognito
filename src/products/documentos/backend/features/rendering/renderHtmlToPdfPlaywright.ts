import type { DocumentosHtmlRenderOutput, DocumentosPdfRenderOutput } from '@/products/documentos/backend/features/rendering/types'

type ChromiumLike = {
  launch: (opts?: Record<string, unknown>) => Promise<any>
}

type PlaywrightModule = {
  chromium?: ChromiumLike
}

type SparticuzChromiumLike = {
  args?: string[]
  executablePath?: string | (() => Promise<string>)
  defaultViewport?: Record<string, unknown> | null
  headless?: boolean | string
  setGraphicsMode?: boolean
}

let lastPlaywrightPdfError: string | null = null

export function getLastPlaywrightPdfError(): string | null {
  return lastPlaywrightPdfError
}

async function importPlaywrightCore(): Promise<PlaywrightModule | null> {
  try {
    return await import('playwright-core') as PlaywrightModule
  } catch {
    lastPlaywrightPdfError = 'import playwright-core failed'
    return null
  }
}

async function importSparticuzChromium(): Promise<SparticuzChromiumLike | null> {
  try {
    const mod = await import('@sparticuz/chromium') as Record<string, unknown>
    const candidate = ((mod.default as unknown) ?? mod) as SparticuzChromiumLike
    return candidate || null
  } catch {
    lastPlaywrightPdfError = '@sparticuz/chromium import failed'
    return null
  }
}

function fallbackLaunchArgs(): string[] {
  return [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--font-render-hinting=none',
  ]
}

async function getExecutablePath(chromium: SparticuzChromiumLike | null): Promise<string | undefined> {
  if (!chromium?.executablePath) return undefined
  if (typeof chromium.executablePath === 'function') {
    const path = await chromium.executablePath().catch(() => '')
    return String(path || '').trim() || undefined
  }
  const path = String(chromium.executablePath || '').trim()
  return path || undefined
}

async function resolvePlaywrightLaunch() {
  const pwCore = await importPlaywrightCore()
  const sparticuz = await importSparticuzChromium()
  if (pwCore?.chromium?.launch) {
    try {
      if (sparticuz && 'setGraphicsMode' in sparticuz) {
        ;(sparticuz as any).setGraphicsMode = false
      }
    } catch {}
    const executablePath = await getExecutablePath(sparticuz)
    const args = Array.isArray(sparticuz?.args) && sparticuz?.args?.length
      ? sparticuz.args
      : fallbackLaunchArgs()
    return {
      chromium: pwCore.chromium,
      options: {
        headless: typeof sparticuz?.headless === 'boolean' ? sparticuz.headless : true,
        args,
        ...(executablePath ? { executablePath } : {}),
      } satisfies Record<string, unknown>,
    }
  }

  return null
}

export async function tryRenderHtmlToPdfWithPlaywright(input: DocumentosHtmlRenderOutput): Promise<DocumentosPdfRenderOutput | null> {
  lastPlaywrightPdfError = null
  const launch = await resolvePlaywrightLaunch()
  if (!launch?.chromium?.launch) {
    lastPlaywrightPdfError = lastPlaywrightPdfError || 'playwright launch unavailable'
    return null
  }

  let browser: any = null
  try {
    browser = await launch.chromium.launch(launch.options)
    const page = await browser.newPage()
    await page.setContent(input.html, { waitUntil: 'networkidle' })
    try { await page.emulateMedia({ media: 'screen' }) } catch {}
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
  } catch (error) {
    // Keep fallback behavior, but emit a server log to diagnose deploy/runtime issues.
    lastPlaywrightPdfError = error instanceof Error ? error.message : String(error)
    try {
      console.error('[documentos/pdf] Playwright render failed:', lastPlaywrightPdfError)
    } catch {}
    return null
  } finally {
    if (browser) {
      try { await browser.close() } catch {}
    }
  }
}
