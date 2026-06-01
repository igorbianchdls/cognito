import { existsSync } from 'node:fs'
import { mkdir, rm, stat } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { build } from 'esbuild'

const repoRoot = process.cwd()
const outDir = path.join(repoRoot, 'tmp', 'slide-pptx-smoke')
const bundlePath = path.join(outDir, 'exporter.mjs')
const outputPath = path.join(outDir, 'slide-pptx-smoke.pptx')

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
  entryPoints: [path.join(repoRoot, 'src/products/artifacts/slide/export/pptx/exportSlideDeckToPptx.ts')],
  external: ['react', 'react-dom'],
  format: 'esm',
  outfile: bundlePath,
  platform: 'node',
  plugins: [aliasPlugin],
  resolveExtensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.json'],
  target: ['node20'],
})

const { exportSlideDeckToPptx } = await import(pathToFileURL(bundlePath).href)

const deck = {
  kind: 'slide-deck',
  title: 'Slide PPTX Smoke',
  theme: {
    name: 'light',
    managers: {},
    rawProps: {},
  },
  slides: [
    {
      id: 'cover',
      index: 0,
      title: 'Cover',
      size: {
        widthPx: 1280,
        heightPx: 720,
        aspectRatio: 1.777778,
        preset: 'wide',
      },
      props: { id: 'cover', title: 'Cover', width: 1280, height: 720 },
      rawNode: { type: 'Slide', props: {}, children: [] },
      elements: [
        {
          id: 'title',
          kind: 'title',
          sourceType: 'Title',
          props: { x: 72, y: 64, w: 900, h: 86, fontSize: 36 },
          frame: { x: 72, y: 64, w: 900, h: 86, unit: 'px' },
          text: 'PPTX export smoke',
          children: [],
        },
        {
          id: 'subtitle',
          kind: 'subtitle',
          sourceType: 'Subtitle',
          props: { x: 76, y: 150, w: 760, h: 48 },
          frame: { x: 76, y: 150, w: 760, h: 48, unit: 'px' },
          text: 'Editable text, shapes, table and chart',
          children: [],
        },
        {
          id: 'stat',
          kind: 'stat',
          sourceType: 'Stat',
          props: { x: 76, y: 245, w: 260, h: 125, label: 'Revenue', value: 'R$ 142k', delta: '+18%' },
          frame: { x: 76, y: 245, w: 260, h: 125, unit: 'px' },
          children: [],
        },
        {
          id: 'chart',
          kind: 'chart',
          sourceType: 'Chart',
          props: {
            x: 390,
            y: 235,
            w: 560,
            h: 260,
            type: 'bar',
            title: 'Revenue',
            data: [
              { label: 'Apr', value: 120 },
              { label: 'May', value: 142 },
            ],
          },
          frame: { x: 390, y: 235, w: 560, h: 260, unit: 'px' },
          children: [],
        },
        {
          id: 'table',
          kind: 'table',
          sourceType: 'Table',
          props: {
            x: 76,
            y: 440,
            w: 520,
            h: 150,
            columns: [
              { accessorKey: 'metric', header: 'Metric' },
              { accessorKey: 'value', header: 'Value' },
            ],
            data: [
              { metric: 'Orders', value: '1,240' },
              { metric: 'Ticket', value: 'R$ 115' },
            ],
          },
          frame: { x: 76, y: 440, w: 520, h: 150, unit: 'px' },
          children: [],
        },
      ],
    },
  ],
  rawTree: { type: 'SlideTemplate', props: {}, children: [] },
}

await exportSlideDeckToPptx(deck, outputPath)

const result = await stat(outputPath)
if (!result.isFile() || result.size < 1000) {
  throw new Error(`PPTX smoke output is invalid: ${outputPath}`)
}

console.log(`PPTX smoke ok: ${outputPath} (${result.size} bytes)`)
