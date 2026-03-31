import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const baseDir = path.join(root, 'src/products/dashboard/workspace/files/app')
const outPath = path.join(root, 'src/products/dashboard/workspace/realWorkspaceFileSources.ts')

const fileNames = fs.readdirSync(baseDir).sort()

const entries = fileNames.map((fileName) => {
  const abs = path.join(baseDir, fileName)
  const content = fs.readFileSync(abs, 'utf8')
  const extension = path.extname(fileName).replace('.', '')

  return {
    path: `app/${fileName}`,
    name: fileName,
    directory: 'app',
    extension,
    language: extension === 'ts' || extension === 'tsx' ? 'typescript' : extension,
    content,
  }
})

const source = `import type { DashboardCodeFile } from '@/products/dashboard/workspace/types'

// Auto-generated from src/products/dashboard/workspace/files/app
export const DASHBOARD_REAL_WORKSPACE_FILES: DashboardCodeFile[] = ${JSON.stringify(entries, null, 2)}
`

fs.writeFileSync(outPath, source)
console.log(`wrote ${path.relative(root, outPath)}`)
