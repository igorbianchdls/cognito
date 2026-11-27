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
    page = await (await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true })).newPage()
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

  test('etapa 4: duas abas editam a mesma página ao mesmo tempo e o texto das duas fica salvo', async () => {
    const id = await novaPagina()
    await page.getByLabel('Título da página').fill('Texto em dupla')
    await salvo()
    const outra = await page.context().newPage()
    outra.on('pageerror', e => erros.push(String(e)))
    await outra.goto(`${BASE}/notas/${id}`, { waitUntil: 'domcontentloaded' })
    await outra.locator('.bn-editor').waitFor()
    await page.waitForTimeout(800)
    await page.locator('.bn-editor').click()
    await page.keyboard.type('Linha da aba A.')
    await outra.locator('.bn-editor').getByText('Linha da aba A.').waitFor({ timeout: 15000 })
    await outra.locator('.bn-editor').click()
    await outra.keyboard.press('Control+End'); await outra.keyboard.press('Enter')
    await outra.keyboard.type('Linha da aba B.')
    await page.locator('.bn-editor').getByText('Linha da aba B.').waitFor({ timeout: 15000 })
    await foto('ui-8-dupla')
    await salvo(); await outra.waitForTimeout(1500)
    await outra.close()
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.locator('.bn-editor').getByText('Linha da aba A.').waitFor()
    await page.locator('.bn-editor').getByText('Linha da aba B.').waitFor()
    assert.equal(await page.locator('.bn-editor').getByText('Linha da aba A.').count(), 1, 'sem texto duplicado')
  })

  test('etapa 4: comentar um bloco (Ctrl+Alt+M), responder e resolver', async () => {
    await page.locator('.bn-editor').getByText('Linha da aba A.').click()
    await page.keyboard.press('Control+Alt+KeyM')
    const painel = page.getByRole('complementary', { name: 'Comentários' })
    await painel.getByLabel('Comentar este trecho…').fill('Revisar esta frase.')
    await painel.getByLabel('Comentar este trecho…').press('Enter')
    await painel.getByText('Revisar esta frase.').waitFor()
    await painel.getByLabel('Responder…').fill('Revisado.')
    await painel.getByLabel('Responder…').press('Enter')
    await painel.getByText('Revisado.').waitFor()
    await foto('ui-9-comentarios')
    await painel.getByRole('button', { name: 'Resolver' }).click()
    await painel.getByRole('button', { name: 'Resolvidos' }).click()
    await painel.getByText('Revisar esta frase.').waitFor()
    await painel.getByRole('button', { name: 'Fechar comentários' }).click()
  })

  test('etapa 4: exportar Markdown baixa o texto da página', async () => {
    await page.locator('header').getByLabel('Mais ações').click()
    const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('menuitem', { name: 'Exportar Markdown' }).click()])
    const caminho = await download.path()
    const { readFileSync } = await import('node:fs')
    const md = readFileSync(caminho, 'utf8')
    assert.match(md, /# Texto em dupla/); assert.match(md, /Linha da aba A\./)
  })

  test('etapa 5: restringir, publicar na web e abrir o link público sem login', async () => {
    await page.getByRole('button', { name: 'Compartilhar' }).click()
    await page.getByLabel('Acesso geral').selectOption('restrito')
    await page.locator('header').getByTitle('Acesso restrito').waitFor()
    await page.getByRole('button', { name: /Publicar na web/ }).click()
    const link = await page.getByLabel('Link público').inputValue()
    assert.match(link, /\/n\/[A-Za-z0-9_-]{20,}$/)
    await foto('ui-10-compartilhar')
    await page.keyboard.press('Escape')
    const visitante = await browser.newPage()
    await visitante.goto(link, { waitUntil: 'domcontentloaded' })
    await visitante.getByRole('heading', { name: 'Texto em dupla' }).waitFor()
    await visitante.getByText('Linha da aba B.').waitFor()
    assert.equal(await visitante.locator('[contenteditable=true]').count(), 0, 'só leitura')
    if (FOTOS) await visitante.screenshot({ path: `${FOTOS}/ui-11-publica.png` })
    await visitante.close()
  })

  test('etapa 4: importar CSV cria uma base com colunas tipadas', async () => {
    await page.goto(`${BASE}/notas`, { waitUntil: 'domcontentloaded' })
    await page.getByRole('tree', { name: 'Páginas' }).waitFor()
    const csv = 'Produto;Preço;Categoria;Ativo\nCafé;R$ 5,50;Bebida;sim\nChá;R$ 4,00;Bebida;não\nBolo;R$ 12,00;Doce;sim\nSuco;R$ 7,00;Bebida;sim\n'
    await page.getByLabel('Arquivo para importar').setInputFiles({ name: 'Cardápio.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) })
    await page.waitForURL(/\/notas\/[0-9a-f-]{36}$/)
    await page.getByRole('gridcell', { name: /Café/ }).waitFor()
    await page.getByText('R$ 5,50').waitFor()
    assert.equal(await page.getByLabel('Título da página').inputValue(), 'Cardápio')
    await foto('ui-12-importado')
  })

  test('sem erros de servidor nem de página', () => {
    const relevantes = erros.filter(e => !/clerk|ERR_TUNNEL_CONNECTION_FAILED|ERR_NAME_NOT_RESOLVED/i.test(e))
    if (relevantes.length) console.error('Erros encontrados:', JSON.stringify(relevantes, null, 1))
    assert.deepEqual(relevantes, [])
  })
})
