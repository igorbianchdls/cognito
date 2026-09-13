import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const checks = []
const check = (name, fn) => { fn(); checks.push(name) }
const read = path => readFileSync(path, 'utf8')

check('paginas ERP entram na checagem de tipos', () => {
  const config = JSON.parse(read('tsconfig.erp.json'))
  assert(config.include.includes('src/app/erp/**/*.tsx'))
  assert(config.include.includes('src/app/erp/**/*.ts'))
})

check('catalogo central contém todos os relatórios retirados', () => {
  const source = read('src/products/erp/shared/reportCatalog.ts')
  for (const id of ['dre', 'dre-competencia', 'fluxo-de-caixa', 'fluxo-diario', 'fluxo-mensal', 'aging-receber', 'aging-pagar']) {
    assert(source.includes(`'${id}'`), id)
  }
})

check('links antigos são tratados antes de carregar relatório', () => {
  const page = read('src/app/erp/[section]/[module]/page.tsx')
  const api = read('src/products/erp/server/erpProfessionalRepository.ts')
  assert(page.includes('isRetiredErpReport'))
  assert(page.includes('Relatório descontinuado'))
  assert(api.includes('REPORT_RETIRED'))
})

check('histórico oferece carregamento vazio erro e arquivo', () => {
  const source = read('src/products/erp/frontend/components/ErpHistoryPanel.tsx')
  for (const value of ['Carregando', 'Nenhum', 'Baixar', 'Tentar novamente']) assert(source.includes(value), value)
  assert(source.includes('<details'))
  assert(!source.includes('<pre'))
})

check('consultas de histórico descartam respostas obsoletas', () => {
  const source = read('src/products/erp/frontend/hooks/useErpResource.ts')
  assert(source.includes('AbortController'))
  assert(source.includes('controller.abort()'))
  assert(source.includes('controller.signal.aborted'))
})

check('formulários financeiros preservam identidade após falha', () => {
  const source = read('src/products/erp/frontend/services/erpMutation.ts')
  assert(source.includes('Idempotency-Key'))
  assert(source.includes('attempt.pending'))
  assert(source.includes('attempt.uncertain'))
})

check('downloads usam URL curta e resposta sem cache', () => {
  const source = read('src/app/api/erp/historicos/[kind]/[id]/route.ts')
  assert(source.includes('expiresIn: 60'))
  assert(source.includes("'Cache-Control': 'no-store'"))
  assert(source.includes('SUPABASE_SERVICE_ROLE_KEY'))
})

check('automação e importação expõem tentativas contadores e resultados', () => {
  const automation = read('src/app/api/erp/automacoes/route.ts')
  const imports = read('src/products/erp/server/erpImportRepository.ts')
  for (const value of ['tentativas', 'resultado', 'erro', 'historico_estados']) assert(automation.includes(value), value)
  for (const value of ['total_linhas', 'total_validas', 'total_importadas', 'total_erros']) assert(imports.includes(value), value)
})

check('recebimento externo permanece separado do processamento', () => {
  const repository = read('src/products/erp/server/erpHistoryRepository.ts')
  assert(repository.includes('recebido_em'))
  assert(repository.includes('processamento'))
  assert(repository.includes('evento_cobranca_id'))
})

check('rotinas e recorrências têm controle de edição simultânea', () => {
  const source = read('src/products/erp/server/erpRoutineRepository.ts')
  assert(source.includes('FOR UPDATE'))
  assert(source.includes('expectedUpdatedAt'))
  assert(source.includes('atualizado_em'))
})

console.log(JSON.stringify({ status: 'passed', checks: checks.length, names: checks }))
