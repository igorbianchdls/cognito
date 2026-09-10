import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { build } from 'esbuild'

const retiredRoots = [
  'src/products/integracoes', 'src/products/plugin/server/domain-adapters',
  'src/app/(navigation)/integracoes', 'src/app/api/integracoes',
  'src/products/observability/frontend/features/connectors',
  'src/app/internal/observability/connectors', 'src/app/api/internal/observability/connectors',
  'src/assets/skills/integracoes-oauth', 'src/assets/skills/integracoes-data-platform',
  'src/assets/skills/connected-erp-conta-azul',
]
function files(dir) {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const file = `${dir}/${entry.name}`
    return entry.isDirectory() ? files(file) : [file]
  })
}
// Two ignored, unreferenced local cloud bundles could not be deleted by approval review.
const localBlockedBundles = new Set([
  'src/products/integracoes/cloud/dist/control-api/index.cjs',
  'src/products/integracoes/cloud/dist/worker/index.cjs',
])
for (const root of retiredRoots) {
  assert.deepEqual(files(root).filter(file => !localBlockedBundles.has(file)), [], `Retired source remains: ${root}`)
}
for (const file of [
  'src/lib/bigqueryClient.ts', 'src/products/plugin/web/src/views/ConnectorsView.tsx',
  'src/products/observability/server/connectorsObservabilityRepository.ts',
]) assert(!existsSync(file), `Retired file remains: ${file}`)
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
assert(!pkg.dependencies['@google-cloud/bigquery'])
assert(!readFileSync('pnpm-lock.yaml', 'utf8').includes('@google-cloud/bigquery'))
assert(!readFileSync('src/proxy.ts', 'utf8').includes('/api/integracoes'))
for (const file of files('src').filter(file => /\.[cm]?[jt]sx?$/.test(file) && !file.includes('/dist/'))) {
  const text = readFileSync(file, 'utf8')
  assert(!/@google-cloud\/bigquery|products\/integracoes\/|domain-adapters\//.test(text), `Retired dependency: ${file}`)
}
for (const file of ['src/products/plugin/web/dist/component.js', 'src/products/plugin/web/dist/widget.html']) {
  assert(!/connector-row|Conectores sincronizados|Nenhum conector encontrado/.test(readFileSync(file, 'utf8')), `Stale widget: ${file}`)
}
const graph = await build({
  entryPoints: ['src/products/plugin/server/appTools.ts', 'src/products/plugin/server/domainTools.ts'],
  bundle: true, write: false, outdir: '.next/cache/retirement-audit', platform: 'node',
  format: 'esm', packages: 'external', metafile: true, logLevel: 'silent',
})
assert(!Object.keys(graph.metafile.inputs).some(file => /bigquery|integracoes\/|domain-adapters\//i.test(file)))
assert(!Object.values(graph.metafile.outputs).flatMap(output => output.imports).some(item => /bigquery/i.test(item.path)))
console.log('Retirement: routes, sources, dependency graph, lockfile and rebuilt widget verified; only two blocked local bundles allowed.')
