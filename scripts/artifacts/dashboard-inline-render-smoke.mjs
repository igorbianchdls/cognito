import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { existsSync } from 'node:fs'
import { build } from 'esbuild'
import { chromium } from 'playwright-core'

const executablePath = process.env.DASHBOARD_TEST_BROWSER || [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].find(existsSync)
if (!executablePath) throw new Error('Configure DASHBOARD_TEST_BROWSER para executar o teste de renderização.')
const bundle = await build({
  stdin: { resolveDir: process.cwd(), loader: 'tsx', contents: `
    import React from 'react'; import {createRoot} from 'react-dom/client';
    import {DataProvider} from '@/products/bi/json-render/context';
    import {DashboardThemeSelectionProvider} from '@/products/artifacts/dashboard/runtime/theme';
    import KPI from '@/products/artifacts/dashboard/runtime/components/kpi/DashboardKpi';
    import Chart from '@/products/artifacts/dashboard/runtime/components/chart/DashboardChart';
    import Table from '@/products/artifacts/dashboard/runtime/components/table/DashboardTable';
    import Pivot from '@/products/artifacts/dashboard/runtime/components/table/DashboardPivotTable';
    function App() {return <DataProvider><DashboardThemeSelectionProvider themeName="light">
      <div id="kpi"><KPI element={{props:{title:'Teste',value:123,format:'number'}}}/></div>
      <div id="empty"><KPI element={{props:{title:'Sem dados',value:null}}}/></div>
      <div id="chart" style={{width:700,height:300}}><Chart element={{props:{type:'bar',data:[{label:'Grupo A',value:12}],height:280,xAxis:{dataKey:'label'},series:[{dataKey:'value',label:'Valor'}]}}}/></div>
      <div id="table"><Table element={{props:{data:[{name:'Alice'}],columns:[{accessorKey:'name',header:'Nome'}]}}}/></div>
      <div id="pivot"><Pivot element={{props:{data:[{group:'Equipe A',amount:12},{group:'Equipe A',amount:8}],rows:['group'],values:[{field:'amount',aggregate:'sum',label:'Total'}]}}}/></div>
    </DashboardThemeSelectionProvider></DataProvider>}
    createRoot(document.getElementById('root')!).render(<App/>);
  ` },
  bundle: true, write: false, platform: 'browser', format: 'iife', define: { 'process.env.NODE_ENV': '"production"' },
})
const server = createServer((req, res) => {
  if(req.url === '/test.js') { res.setHeader('Content-Type', 'application/javascript'); res.end(bundle.outputFiles[0].text) }
  else { res.setHeader('Content-Type', 'text/html'); res.end('<!doctype html><html><body><div id="root"></div><script src="/test.js"></script></body></html>') }
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
let browser
try {
  browser = await chromium.launch({ executablePath, headless: true })
  const page = await browser.newPage({ viewport: { width: 1100, height: 1000 } })
  const errors = [], requests = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('request', request => requests.push(request.url()))
  await page.goto('http://127.0.0.1:' + server.address().port)
  await page.waitForFunction(() => document.querySelector('#table')?.textContent.includes('Alice'))
  await page.waitForFunction(() => document.querySelector('#pivot')?.textContent.includes('20'))
  assert.match(await page.locator('#kpi').innerText(), /123/)
  assert(!/\b0\b/.test(await page.locator('#empty').innerText()), 'Valor indisponível não pode virar zero.')
  await page.locator('#chart .recharts-bar-rectangle').first().waitFor()
  assert.equal(errors.length, 0, errors.join('\n'))
  assert(requests.every(url => new URL(url).hostname === '127.0.0.1' && !url.includes('/api/')), 'Renderização tentou consultar fonte externa.')
  console.log('Renderização: KPI 123, valor ausente, gráfico com barra, tabela Alice e pivot total 20; nenhuma consulta de dados.')
} finally {
  if(browser) await browser.close()
  await new Promise(resolve => server.close(resolve))
}
