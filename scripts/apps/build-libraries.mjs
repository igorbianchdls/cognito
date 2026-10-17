// Gera src/products/apps/server/librariesSnapshot.generated.ts: os módulos das bibliotecas que os apps
// em React podem importar (gráficos, ícones e utilitários), um arquivo por módulo, com o mapa de
// imports. No build de cada app o esbuild usa esse snapshot e descarta o que o app não usa, então
// um app com dois ícones leva poucos KB. React continua vindo do vendor do sandbox.
// Rode de novo após atualizar as bibliotecas: node scripts/apps/build-libraries.mjs
import { build, transform } from 'esbuild'
import { readFileSync, writeFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

export const LIBRARIES = ['recharts', 'lucide-react', 'clsx']
const production = { 'process.env.NODE_ENV': '"production"' }
const snapshot = { files: {}, map: {}, entries: {} }
const relative = path => path.replace(/\\/g, '/').replace(/^node_modules\//, '')
for (const lib of LIBRARIES) {
  const result = await build({ stdin: { contents: `export * from ${JSON.stringify(lib)}`, resolveDir: process.cwd(), loader: 'js' }, bundle: true, write: false, metafile: true, format: 'esm', platform: 'browser', logLevel: 'silent', define: production, external: ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/client'] })
  for (const [path, input] of Object.entries(result.metafile.inputs)) {
    // Paths keep the .pnpm folder (one per package version) without the machine-specific prefix.
    const key = relative(path)
    if (path === '<stdin>') { snapshot.entries[lib] = relative(input.imports.find(i => !i.external).path); continue }
    snapshot.files[key] ??= (await transform(readFileSync(path, 'utf8'), { loader: 'js', minifyWhitespace: true, minifySyntax: true, define: production })).code
    for (const imp of input.imports) if (!imp.external) snapshot.map[key + '\0' + imp.original] = relative(imp.path)
  }
}
const versions = Object.fromEntries(LIBRARIES.map(lib => [lib, JSON.parse(readFileSync(`node_modules/${lib}/package.json`, 'utf8')).version]))
const packed = gzipSync(JSON.stringify(snapshot), { level: 9 }).toString('base64')
writeFileSync('src/products/apps/server/librariesSnapshot.generated.ts', `// Gerado por scripts/apps/build-libraries.mjs. Não edite.\nexport const LIBRARY_VERSIONS = ${JSON.stringify(versions)} as const\nexport const LIBRARY_SNAPSHOT = ${JSON.stringify(packed)}\n`)
console.log(JSON.stringify({ versions, files: Object.keys(snapshot.files).length, packedKB: Math.round(packed.length / 1024) }))
