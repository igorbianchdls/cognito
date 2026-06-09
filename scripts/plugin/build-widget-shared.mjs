#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { build } from 'esbuild'

const root = process.cwd()
const sourceWebDir = path.join(root, 'src/products/plugin/web')
const sourceDir = path.join(sourceWebDir, 'src')

function aliasPlugin() {
  return {
    name: 'cognito-root-alias',
    setup(buildContext) {
      buildContext.onResolve({ filter: /^@\// }, (args) => {
        const basePath = path.join(root, 'src', args.path.slice(2))
        const candidates = [
          basePath,
          `${basePath}.tsx`,
          `${basePath}.ts`,
          `${basePath}.jsx`,
          `${basePath}.js`,
          path.join(basePath, 'index.tsx'),
          path.join(basePath, 'index.ts'),
        ]
        const resolvedPath = candidates.find((candidate) => existsSync(candidate)) || basePath
        return { path: resolvedPath }
      })
    },
  }
}

export async function buildWidget({ productDir, label }) {
  const distDir = path.join(root, productDir, 'web/dist')
  const css = await readFile(path.join(sourceDir, 'styles.css'), 'utf8')

  const result = await build({
    entryPoints: [path.join(sourceDir, 'main.tsx')],
    bundle: true,
    format: 'iife',
    globalName: 'CognitoWidgetBundle',
    platform: 'browser',
    target: ['es2020'],
    jsx: 'automatic',
    minify: true,
    write: false,
    logLevel: 'silent',
    plugins: [aliasPlugin()],
    define: {
      'process.env.NODE_ENV': '"production"',
    },
  })

  const componentJs = result.outputFiles?.[0]?.text
  if (!componentJs) {
    throw new Error('esbuild did not return a component bundle')
  }

  const widgetHtml = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Cognito Dashboards</title>
    <style>
${css}
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script>
${componentJs}
    </script>
  </body>
</html>
`

  await mkdir(distDir, { recursive: true })
  await writeFile(path.join(distDir, 'component.js'), componentJs + '\n')
  await writeFile(path.join(distDir, 'widget.html'), widgetHtml)

  console.log(`Built ${label} widget:`)
  console.log(`- ${path.relative(root, path.join(distDir, 'component.js'))}`)
  console.log(`- ${path.relative(root, path.join(distDir, 'widget.html'))}`)
}
