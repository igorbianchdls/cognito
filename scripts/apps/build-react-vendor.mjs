// Gera src/products/apps/shared/reactVendor.generated.ts: React e ReactDOM de produção num único
// script, que define globalThis.__ottoModules dentro do sandbox. Os apps em React não baixam nada;
// o build de cada app aponta "react" e "react-dom/client" para esses módulos.
// Rode de novo após atualizar react ou react-dom: node scripts/apps/build-react-vendor.mjs
import { build } from 'esbuild'
import { readFileSync, writeFileSync } from 'node:fs'

const modules = ['react', 'react-dom', 'react-dom/client', 'react/jsx-runtime']
const entry = `globalThis.__ottoModules=Object.freeze({${modules.map(m => `${JSON.stringify(m)}:require(${JSON.stringify(m)})`).join(',')}});`
const result = await build({ stdin: { contents: entry, resolveDir: process.cwd(), loader: 'js' }, bundle: true, write: false, minify: true, format: 'iife', platform: 'browser', target: 'es2020', define: { 'process.env.NODE_ENV': '"production"' }, legalComments: 'none' })
const code = result.outputFiles[0].text
const version = JSON.parse(readFileSync('node_modules/react/package.json', 'utf8')).version
writeFileSync('src/products/apps/shared/reactVendor.generated.ts', `// Gerado por scripts/apps/build-react-vendor.mjs (React ${version}). Não edite.\nexport const REACT_VERSION = ${JSON.stringify(version)}\nexport const REACT_MODULES = ${JSON.stringify(modules)} as const\nexport const REACT_VENDOR = ${JSON.stringify(code)}\n`)
console.log(JSON.stringify({ version, bytes: Buffer.byteLength(code) }))
