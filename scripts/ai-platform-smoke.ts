import { listAiTools } from '../src/products/ai-platform/tools/toolRegistry'

const tools = listAiTools()
const names = tools.map((tool) => tool.name)
if (tools.length < 30) throw new Error(`Registro incompleto: apenas ${tools.length} tools.`)
if (new Set(names).size !== names.length) throw new Error('Existem nomes de tools duplicados.')
if (names.some((name) => /stock|estoque|fiscal|invoice|nota_fiscal/i.test(name))) {
  throw new Error('O registro publicou uma tool fora do escopo atual.')
}

for (const prepare of names.filter((name) => name.endsWith('_prepare'))) {
  const commit = prepare.replace(/_prepare$/, '_commit')
  if (!names.includes(commit)) throw new Error(`Tool critica sem commit: ${prepare}`)
}

for (const tool of tools) {
  if (!tool.inputSchema.safeParse({}).success && tool.risk === 'read' && tool.name.startsWith('erp_search_')) {
    throw new Error(`Busca sem entrada opcional valida: ${tool.name}`)
  }
}

process.stdout.write(`AI Platform: ${tools.length} tools validas; estoque e fiscal nao publicados.\n`)
