// Testes de tela das Notas, de ponta a ponta: navegador → telas reais → rotas reais → Postgres local.
// Uso: npm run notas:ui (sobe o banco local e o Next em modo de teste, roda e desliga).
// Variáveis: NOTAS_UI_URL (padrão http://localhost:3100), NOTAS_UI_FOTOS (pasta para salvar capturas, opcional).
import { after, afterEach, before, describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

// Playwright do sistema (com o navegador) se houver; senão o playwright-core do projeto com o Chromium local.
const require = createRequire(import.meta.url)
let chromium, executablePath
try { ({ chromium } = require('playwright')) } catch { ({ chromium } = require('playwright-core')); executablePath = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' }

const BASE = process.env.NOTAS_UI_URL ?? 'http://localhost:3100'
const FOTOS = process.env.NOTAS_UI_FOTOS
let browser, page
const erros = []

const foto = async nome => { if (FOTOS) await page.screenshot({ path: `${FOTOS}/${nome}.png` }) }
/** Espera a página terminar de salvar (o "Salvando…" do topo some). */
const salvo = async () => { await page.waitForTimeout(900); await page.waitForFunction(() => !document.body.innerText.includes('Salvando…'), null, { timeout: 15000 }) }
const novaPagina = async () => {
  await page.goto(`${BASE}/notas`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('tree', { name: 'Páginas' }).waitFor()
  await page.getByRole('button', { name: 'Nova página' }).last().click()
  await page.waitForURL(/\/notas\/[0-9a-f-]{36}$/, { timeout: 30000 })
  await page.getByLabel('Título da página').waitFor()
  await page.locator('.bn-editor').waitFor()
  return page.url().split('/').pop()
}

describe('Notas — telas de ponta a ponta', () => {
  before(async () => {
    browser = await chromium.launch({ ...(executablePath ? { executablePath } : {}), proxy: { server: process.env.HTTPS_PROXY || 'direct://', bypass: '<-loopback>,localhost,127.0.0.1' } })
    page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
    page.setDefaultTimeout(20000)
    page.on('pageerror', e => erros.push(String(e)))
    page.on('console', m => { if (m.type() === 'error') erros.push(`console: ${m.text().slice(0, 300)}`) })
    page.on('response', r => { if (r.url().includes('/api/notas/') && r.status() >= 500) erros.push(`${r.status()} ${r.url()}`) })
  })
  after(async () => { await browser?.close() })
  afterEach(async t => { if (FOTOS && page) await page.screenshot({ path: `${FOTOS}/fim-${t.name.slice(0, 30).replace(/[^\w]+/g, '-')}.png` }).catch(() => {}) })

  test('criar página, escrever, salvar e reabrir com o texto', async () => {
    const id = await novaPagina()
    await page.getByLabel('Título da página').fill('Plano de lançamento')
    await page.keyboard.press('Enter')
    await page.keyboard.type('Primeira linha escrita no teste.')
    await salvo()
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.locator('.bn-editor').getByText('Primeira linha escrita no teste.').waitFor()
    assert.equal(await page.getByLabel('Título da página').inputValue(), 'Plano de lançamento')
    assert.ok(await page.locator('[role=treeitem]', { hasText: 'Plano de lançamento' }).count() > 0, 'aparece na barra lateral')
    assert.match(await page.title(), /Plano de lançamento/)
    await foto('ui-1-pagina')
    assert.ok(id)
  })

  test('modelo de página: Ata de reunião preenche título, ícone e conteúdo', async () => {
    await novaPagina()
    await page.getByRole('button', { name: 'Modelos' }).click()
    await page.getByRole('menuitem', { name: /Ata de reunião/ }).click()
    await page.getByText('Próximos passos').waitFor()
    await salvo()
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.getByText('Próximos passos').waitFor()
    assert.equal(await page.getByLabel('Título da página').inputValue(), 'Reunião')
  })

  test('renomear pela barra lateral (duplo clique) e lixeira com desfazer', async () => {
    await novaPagina()
    await page.getByLabel('Título da página').fill('Rascunho')
    await salvo()
    const linha = page.locator('[role=treeitem]', { hasText: 'Rascunho' }).first()
    await linha.dblclick()
    const caixa = page.getByLabel('Novo título')
    await caixa.fill('Rascunho renomeado'); await caixa.press('Enter')
    await page.locator('[role=treeitem]', { hasText: 'Rascunho renomeado' }).first().waitFor()
    await salvo()
    assert.equal(await page.getByLabel('Título da página').inputValue(), 'Rascunho renomeado')
    await page.locator('header').getByLabel('Mais ações').click()
    await page.getByRole('menuitem', { name: 'Mover para a lixeira' }).click()
    await page.getByText('Página movida para a lixeira.').waitFor()
    await page.getByRole('button', { name: 'Desfazer' }).click()
    await page.getByText('Página restaurada.').waitFor()
    await page.locator('[role=treeitem]', { hasText: 'Rascunho renomeado' }).first().waitFor()
  })

  test('base Tarefas: quadro, novo item no painel lateral e tabela', async () => {
    await novaPagina()
    await page.getByRole('button', { name: 'Tarefas' }).click()
    await page.getByRole('tab', { name: 'Quadro' }).waitFor()
    for (const coluna of ['Não iniciada', 'Em andamento', 'Concluída']) await page.getByText(coluna).first().waitFor()
    await page.locator('[class*=newBtn] button', { hasText: 'Novo' }).click()
    const painel = page.getByRole('dialog', { name: 'Item da base' })
    await painel.getByLabel('Título da página').fill('Gravar vídeo')
    await painel.getByText('Prioridade').waitFor()
    await salvo()
    await painel.getByRole('button', { name: 'Fechar' }).click()
    await page.getByRole('tab', { name: 'Tabela' }).click()
    await page.getByRole('gridcell', { name: /Gravar vídeo/ }).waitFor()
    await foto('ui-4-tabela')
  })

  test('propriedade Número + Fórmula calculada na tabela', async () => {
    await page.getByRole('columnheader', { name: 'Nova propriedade' }).click()
    await page.getByLabel('Nome da propriedade').fill('Horas')
    await page.getByRole('menuitem', { name: 'Número' }).click()
    await page.getByRole('columnheader', { name: /Horas/ }).waitFor()
    const linha = page.locator('[role=row]', { hasText: 'Gravar vídeo' })
    const indice = await page.locator('[role=columnheader]').evaluateAll(els => els.findIndex(e => e.textContent?.includes('Horas')))
    await linha.locator('[role=gridcell]').nth(indice).click()
    await page.keyboard.type('3'); await page.keyboard.press('Enter')
    await page.getByRole('columnheader', { name: 'Nova propriedade' }).click()
    await page.getByLabel('Nome da propriedade').fill('Custo')
    await page.getByRole('menuitem', { name: 'Fórmula' }).click()
    await page.getByRole('columnheader', { name: /Custo/ }).click()
    await page.getByLabel('Fórmula').fill('prop("Horas") * 150')
    await page.getByText('Fórmula válida.').waitFor()
    await page.getByRole('button', { name: 'Salvar fórmula' }).click()
    await linha.getByText('450').waitFor()
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.getByRole('tab', { name: 'Tabela' }).click()
    await page.locator('[role=row]', { hasText: 'Gravar vídeo' }).getByText('450').waitFor()
    await foto('ui-5-formula')
  })

  test('visões galeria e calendário', async () => {
    await page.getByRole('button', { name: 'Nova visão' }).click()
    await page.getByRole('menuitem', { name: 'Calendário' }).click()
    const mes = new Date().toLocaleDateString('pt-BR', { month: 'long' })
    await page.getByText(new RegExp(mes, 'i')).first().waitFor()
    await page.getByRole('button', { name: 'Hoje' }).waitFor()
    await foto('ui-6-calendario')
    await page.getByRole('button', { name: 'Nova visão' }).click()
    await page.getByRole('menuitem', { name: 'Galeria' }).click()
    await page.getByText('Gravar vídeo').first().waitFor()
    await foto('ui-6-galeria')
  })

  test('histórico de versões mostra versão anterior e restaura', async () => {
    await novaPagina()
    await page.getByLabel('Título da página').fill('Contrato')
    await salvo()
    await page.getByLabel('Título da página').press('Enter')
    await page.keyboard.type('Cláusula nova.')
    await salvo()
    await page.locator('header').getByLabel('Mais ações').click()
    await page.getByRole('menuitem', { name: 'Histórico de versões' }).click()
    const janela = page.getByRole('dialog', { name: 'Histórico de versões' })
    await janela.getByText(/Versão atual/).waitFor()
    await janela.getByRole('heading', { name: 'Contrato' }).waitFor()
    await foto('ui-7-historico')
    await janela.getByRole('button', { name: 'Restaurar esta versão' }).click()
    await page.getByText('Versão restaurada.').waitFor()
    assert.equal(await page.locator('.bn-editor').getByText('Cláusula nova.').count(), 0, 'o texto depois da versão some')
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.locator('.bn-editor').waitFor()
    assert.equal(await page.locator('.bn-editor').getByText('Cláusula nova.').count(), 0)
  })

  test('sem erros de servidor nem de página', () => {
    const relevantes = erros.filter(e => !/clerk|ERR_TUNNEL_CONNECTION_FAILED|ERR_NAME_NOT_RESOLVED/i.test(e))
    assert.deepEqual(relevantes, [])
  })
})
