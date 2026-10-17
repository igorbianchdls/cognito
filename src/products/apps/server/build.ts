import * as esbuild from 'esbuild-wasm'
import { AppsError, type AppPackage } from '../shared/contracts'
import { REACT_MODULES } from '../shared/reactVendor.generated'

// React projects are bundled on the server from the files saved in the database: no file system,
// no network and no npm. React comes from the vendor injected in the sandbox (__ottoModules).
let ready: Promise<void> | undefined
const vendor = new Set<string>(REACT_MODULES)
const loaders: Record<string, esbuild.Loader> = { js: 'jsx', jsx: 'jsx', ts: 'ts', tsx: 'tsx', css: 'css', json: 'json', svg: 'dataurl', png: 'dataurl', jpg: 'dataurl', jpeg: 'dataurl', webp: 'dataurl' }
const extension = (path: string) => path.slice(path.lastIndexOf('.') + 1).toLowerCase()

function normalize(path: string) {
  const parts: string[] = []
  for (const part of path.split('/')) {
    if (!part || part === '.') continue
    if (part === '..') { if (!parts.length) return null; parts.pop() } else parts.push(part)
  }
  return parts.join('/')
}

export type BuildOutput = { js: string; css: string }
export async function buildReactApp(p: AppPackage): Promise<BuildOutput> {
  if (!ready) ready = esbuild.initialize({}).catch(error => { ready = undefined; throw error })
  await ready
  const files = new Map(p.arquivos.map(f => [f.caminho, f]))
  const find = (path: string) => [path, ...['jsx', 'tsx', 'js', 'ts'].map(e => `${path}.${e}`), ...['jsx', 'tsx', 'js', 'ts'].map(e => `${path}/index.${e}`)].find(candidate => files.has(candidate))
  const plugin: esbuild.Plugin = {
    name: 'cognito-app-files',
    setup(build) {
      build.onResolve({ filter: /.*/ }, args => {
        if (vendor.has(args.path)) return { path: args.path, namespace: 'vendor' }
        if (args.kind === 'entry-point') return { path: args.path, namespace: 'app' }
        if (!args.path.startsWith('.') && !args.path.startsWith('/')) return { errors: [{ text: `A biblioteca "${args.path}" não está disponível nos apps. Disponíveis: ${REACT_MODULES.join(', ')}.` }] }
        const base = args.path.startsWith('/') ? '' : args.importer.split('/').slice(0, -1).join('/')
        const target = normalize(`${base}/${args.path}`), found = target === null ? undefined : find(target)
        return found ? { path: found, namespace: 'app' } : { errors: [{ text: `Arquivo não encontrado: ${args.path}` }] }
      })
      build.onLoad({ filter: /.*/, namespace: 'vendor' }, args => ({ contents: `module.exports=globalThis.__ottoModules[${JSON.stringify(args.path)}]`, loader: 'js' }))
      build.onLoad({ filter: /.*/, namespace: 'app' }, args => {
        const file = files.get(args.path)!, loader = loaders[extension(args.path)]
        if (!loader) return { errors: [{ text: `${args.path} não pode ser importado pelo código.` }] }
        return { contents: file.codificacao === 'base64' ? Buffer.from(file.conteudo, 'base64') : file.conteudo, loader }
      })
    },
  }
  try {
    const result = await Promise.race([
      esbuild.build({ entryPoints: [p.manifesto.principal], bundle: true, write: false, outdir: 'out', format: 'iife', platform: 'browser', target: 'es2020', jsx: 'automatic', minify: true, legalComments: 'none', logLevel: 'silent', define: { 'process.env.NODE_ENV': '"production"' }, plugins: [plugin] }),
      new Promise<never>((_, reject) => setTimeout(() => reject(new AppsError('BUILD_FAILED', 'A compilação demorou demais. Reduza o projeto.', 422)), 20_000)),
    ])
    const js = result.outputFiles.find(f => f.path.endsWith('.js'))?.text ?? '', css = result.outputFiles.find(f => f.path.endsWith('.css'))?.text ?? ''
    if (Buffer.byteLength(js) + Buffer.byteLength(css) > 1_500_000) throw new AppsError('BUILD_FAILED', 'O app compilado passou de 1,5 MB.', 422)
    return { js, css }
  } catch (error) {
    if (error instanceof AppsError) throw error
    const failures = (error as { errors?: esbuild.Message[] }).errors ?? []
    const message = failures.slice(0, 5).map(m => (m.location ? `${m.location.file.replace(/^app:/, '')}:${m.location.line}: ` : '') + m.text).join('\n')
    throw new AppsError('BUILD_FAILED', (message || 'Não foi possível compilar o app.').slice(0, 3900), 422)
  }
}
