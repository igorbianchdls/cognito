import assert from 'node:assert/strict'
import { build } from 'esbuild'
import { createServer } from 'node:http'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { chromium } from 'playwright-core'

const bundle = await build({ stdin: { contents: `
  import React, {useState} from 'react';
  import {createRoot} from 'react-dom/client';
  import {ErpStockCountEditor} from '@/products/erp/frontend/components/ErpStockCountEditor';
  window.saved=[];
  function Test(){const[reason,setReason]=useState('Contagem física'),[error,setError]=useState('');
    return <><label>Motivo<input aria-label="Motivo" value={reason} onChange={e=>setReason(e.target.value)}/></label>
      <p role="status">{error}</p><ErpStockCountEditor localId="1" reason={reason} saving={false} onSave={async values=>{window.saved.push(values);setError(window.saved.length===1?'O saldo mudou. Revise novamente.':'Contagem confirmada')}}/></>}
  createRoot(document.getElementById('root')).render(<Test/>);
`, loader: 'tsx', resolveDir: process.cwd() }, bundle: true, platform: 'browser', format: 'iife', jsx: 'automatic', write: false, define: { 'process.env.NODE_ENV': '"production"' } })

let balance = 10, badSnapshot = false, reads = 0
const products = [{ id: '101', nome: 'Café torrado', unidade: 'UN' }, { id: '102', nome: 'Açúcar', unidade: 'UN' }]
const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost')
  if (url.pathname === '/app.js') { res.setHeader('Content-Type', 'text/javascript'); res.end(bundle.outputFiles[0].text); return }
  if (url.pathname === '/api/erp/catalogos/busca') { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ records: products })); return }
  if (url.pathname === '/api/erp/estoque/contagem') {
    ++reads
    assert.equal(url.searchParams.get('local'), '1')
    const records = badSnapshot ? [] : url.searchParams.get('produtos').split(',').map(id => ({ produto_id: id, produto: products.find(p => p.id === id).nome, unidade: 'UN', quantidade_sistema: String(balance), quantidade_reservada: '2' }))
    res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ records })); return
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end('<!doctype html><html><body><div id="root"></div><script src="/app.js"></script></body></html>')
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const executablePath = ['C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Google/Chrome/Application/chrome.exe'].find(existsSync)
assert(executablePath, 'Local browser required')
const browser = await chromium.launch({ executablePath, headless: true })
try {
  const page = await browser.newPage({ viewport: { width: 1000, height: 800 } })
  const errors = []; page.on('pageerror', error => errors.push(error.message))
  await page.goto(`http://127.0.0.1:${server.address().port}`)
  await page.getByRole('button', { name: 'Revisar diferenças', exact: true }).click()
  await page.getByRole('alert').filter({ hasText: 'Selecione o local' }).waitFor()
  assert.equal(reads, 0)
  await page.getByRole('combobox').nth(0).focus(); await page.getByRole('button', { name: 'Café torrado', exact: true }).click()
  await page.getByRole('spinbutton').nth(0).fill('8')
  await page.getByRole('button', { name: 'Adicionar produto', exact: true }).click()
  await page.getByRole('combobox').nth(1).focus(); await page.getByRole('button', { name: 'Açúcar', exact: true }).click()
  await page.getByRole('spinbutton').nth(1).fill('12.1234')
  await page.getByRole('button', { name: 'Revisar diferenças', exact: true }).click()
  await page.getByRole('button', { name: 'Confirmar contagem', exact: true }).waitFor()
  assert.equal(await page.locator('tbody tr').count(), 2)
  assert((await page.locator('tbody').innerText()).includes('-2'))
  assert.equal(await page.evaluate(() => window.saved.length), 0)
  await page.getByRole('button', { name: 'Confirmar contagem', exact: true }).click()
  await page.getByRole('status').filter({ hasText: 'O saldo mudou' }).waitFor()
  assert.deepEqual(await page.evaluate(() => window.saved[0].itens), [{ produto_id: 101, quantidade_contada: 8, quantidade_sistema: 10 }, { produto_id: 102, quantidade_contada: 12.1234, quantidade_sistema: 10 }])
  balance = 11
  await page.getByRole('button', { name: 'Revisar novamente', exact: true }).click()
  await page.waitForFunction(() => document.querySelector('tbody').textContent.includes('-3'))
  await page.getByRole('button', { name: 'Confirmar contagem', exact: true }).click()
  await page.getByRole('status').filter({ hasText: 'Contagem confirmada' }).waitFor()
  assert.equal((await page.evaluate(() => window.saved[1].itens))[0].quantidade_sistema, 11)
  await page.getByLabel('Motivo', { exact: true }).fill('Recontagem')
  assert.equal(await page.getByRole('button', { name: 'Confirmar contagem', exact: true }).count(), 0)
  badSnapshot = true
  await page.getByRole('button', { name: 'Revisar diferenças', exact: true }).click()
  await page.getByRole('alert').filter({ hasText: 'incompleto' }).waitFor()
  assert.equal(await page.getByRole('button', { name: 'Confirmar contagem', exact: true }).count(), 0)
  badSnapshot = false
  await page.getByRole('combobox').nth(1).focus(); await page.getByRole('button', { name: 'Café torrado', exact: true }).click()
  const before = reads
  await page.getByRole('button', { name: 'Revisar diferenças', exact: true }).click()
  await page.getByRole('alert').filter({ hasText: 'uma vez' }).waitFor()
  assert.equal(reads, before)
  assert.deepEqual(errors, [])
  mkdirSync('.cache/erp-audit', { recursive: true })
  const proof = { status: 'passed', checks: 8, actualComponent: true, syntheticApi: true, realDataChanges: 0 }
  writeFileSync('.cache/erp-audit/stock-count-ui.json', JSON.stringify(proof, null, 2))
  console.log(JSON.stringify(proof))
} finally { await browser.close(); await new Promise(resolve => server.close(resolve)) }
