import { existsSync } from 'node:fs'
import { mkdir, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { build } from 'esbuild'

const repoRoot = process.cwd()
const outDir = path.join(repoRoot, 'tmp', 'report-canva-pptx-smoke')
const bundlePath = path.join(outDir, 'exporter.mjs')
const outputPath = path.join(outDir, 'report-canva-pptx-smoke.pptx')

await rm(outDir, { force: true, recursive: true })
await mkdir(outDir, { recursive: true })

const aliasPlugin = {
  name: 'cognito-path-alias',
  setup(buildApi) {
    buildApi.onResolve({ filter: /^@\// }, (args) => {
      const basePath = path.join(repoRoot, 'src', args.path.slice(2))
      const candidates = [
        basePath,
        `${basePath}.ts`,
        `${basePath}.tsx`,
        `${basePath}.js`,
        `${basePath}.jsx`,
        path.join(basePath, 'index.ts'),
        path.join(basePath, 'index.tsx'),
      ]
      const resolved = candidates.find((candidate) => existsSync(candidate))
      return { path: resolved || basePath }
    })
  },
}

await build({
  bundle: true,
  entryPoints: [path.join(repoRoot, 'src/products/artifacts/report/export/pptx/exportReportDeckToCanvaPptx.ts')],
  external: ['react', 'react-dom'],
  format: 'esm',
  outfile: bundlePath,
  platform: 'node',
  plugins: [aliasPlugin],
  resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json'],
  target: ['node20'],
})

const { exportReportDeckToCanvaPptx } = await import(pathToFileURL(bundlePath).href)

const deck = {
  kind: 'report-deck',
  title: 'Report Canva PPTX Smoke',
  pages: [
    {
      id: 'overview',
      index: 0,
      title: 'Overview',
      widthPx: 794,
      heightPx: 1123,
      props: { id: 'overview', title: 'Overview', width: 794, height: 1123 },
      rawNode: { type: 'Report', props: {}, children: [] },
      elements: [
        {
          id: 'headline',
          kind: 'text',
          sourceType: 'h1',
          frame: { x: 36, y: 42, w: 620, h: 90 },
          props: {},
          style: { fontSize: 34, color: '#263145', bold: true },
          text: 'Report export for Canva',
        },
        {
          id: 'callout',
          kind: 'box',
          sourceType: 'section',
          frame: { x: 36, y: 160, w: 722, h: 110 },
          props: {},
          style: { backgroundColor: '#F8FAFD', borderColor: '#E7ECF3', borderRadius: 16 },
        },
        {
          id: 'callout-text',
          kind: 'text',
          sourceType: 'p',
          frame: { x: 54, y: 180, w: 680, h: 64 },
          props: {},
          style: { fontSize: 15, color: '#51607A' },
          text: 'This smoke file should open as a portrait PPTX that Canva can import as an editable design.',
        },
        {
          id: 'chart',
          kind: 'chart',
          sourceType: 'Chart',
          frame: { x: 36, y: 310, w: 722, h: 360 },
          props: { type: 'bar' },
          style: {},
        },
      ],
    },
  ],
  rawTree: { type: 'ReportTemplate', props: {}, children: [] },
}

await exportReportDeckToCanvaPptx(deck, outputPath)

const result = await stat(outputPath)
if (!result.isFile() || result.size < 1000) {
  throw new Error(`PPTX smoke output is invalid: ${outputPath}`)
}

console.log(`Report Canva PPTX smoke ok: ${outputPath} (${result.size} bytes)`)
