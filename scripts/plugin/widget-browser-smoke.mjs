import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { createServer } from 'node:http'
import { chromium } from 'playwright-core'

const executablePath = process.env.DASHBOARD_TEST_BROWSER || [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].find(existsSync)
assert(executablePath, 'Configure DASHBOARD_TEST_BROWSER.')
const html = readFileSync('src/products/plugin/web/dist/widget.html', 'utf8')
const server = createServer((_request, response) => {
  response.setHeader('Content-Type', 'text/html; charset=utf-8')
  response.end(html)
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
let browser
try {
  browser = await chromium.launch({ executablePath, headless: true })
  const page = await browser.newPage()
  const errors = [], unexpectedRequests = []
  page.on('pageerror', error => errors.push(error.message))
  await page.route('**/*', route => {
    const url = new URL(route.request().url())
    if (url.hostname !== '127.0.0.1' || url.pathname.includes('/api/')) {
      unexpectedRequests.push(url.origin + url.pathname)
      return route.abort()
    }
    return route.continue()
  })
  await page.addInitScript(() => {
    window.openai = { toolOutput: { tool: 'connectors', view: 'connectors', rows: [] } }
  })
  await page.goto(`http://127.0.0.1:${server.address().port}`)
  await page.getByText('Formato nao reconhecido', { exact: true }).waitFor()
  assert.equal(await page.locator('.connector-row').count(), 0)
  const render = data => page.evaluate(structuredContent => {
    window.dispatchEvent(new CustomEvent('openai:set_globals', { detail: { globals: { toolOutput: structuredContent } } }))
  }, data)
  await render({ tool: 'table', view: 'table', title: 'Teste ERP', columns: ['cliente', 'valor'], rows: [{ cliente: 'Cliente de teste', valor: 123 }] })
  await page.getByText('Cliente de teste', { exact: true }).waitFor()
  await render({ tool: 'dashboards', view: 'dashboard_list', title: 'Dashboards ERP', dashboards: [] })
  await page.getByText('Nenhum dashboard encontrado', { exact: true }).waitFor()
  assert.equal(await page.getByText('Formato nao reconhecido', { exact: true }).count(), 0)
  assert.deepEqual(errors, [])
  assert.deepEqual(unexpectedRequests, [])
  console.log('Widget publicado: formato antigo tratado, tabela local e lista de dashboards renderizadas; sem erros ou consultas externas.')
} finally {
  await browser?.close()
  await new Promise(resolve => server.close(resolve))
}
