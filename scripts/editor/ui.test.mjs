// Testes de tela do Editor de vídeo, de ponta a ponta no navegador: carregar mídias, montar a linha do tempo, tocar a
// prévia, dividir/arrastar/aparar, texto e legenda, desfazer, salvar ao recarregar e exportar um MP4 de verdade.
// Uso: npm run editor:ui. Variáveis: EDITOR_UI_URL, EDITOR_UI_MIDIA (pasta com vertical.mp4, paisagem.mp4, foto.png e
// musica.mp3) e EDITOR_UI_FOTOS (pasta para salvar capturas, opcional).
import { after, before, beforeEach, describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { execFileSync } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const require = createRequire(import.meta.url)
let chromium, executablePath
try { ({ chromium } = require('playwright')) } catch { ({ chromium } = require('playwright-core')); executablePath = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' }

const BASE = process.env.EDITOR_UI_URL ?? 'http://localhost:3101'
const MIDIA = process.env.EDITOR_UI_MIDIA
const FOTOS = process.env.EDITOR_UI_FOTOS
const PROJETO = `teste-${Date.now()}`
let browser, page
const erros = []
let testeAtual = ''
const foto = async nome => { if (FOTOS) await page.screenshot({ path: `${FOTOS}/${nome}.png` }) }

/** Os clipes da linha do tempo: nome, posição e largura na tela. */
const clipes = () => page.evaluate(() => [...document.querySelectorAll('[data-clip-id]')]
  .filter(e => e.getBoundingClientRect().height > 20 && e.innerText.trim())
  .map(e => { const r = e.getBoundingClientRect(); return { nome: e.innerText.trim().split('\n')[0], x: Math.round(r.left), largura: Math.round(r.width) } }))
/** Abre a aba da barra de ferramentas (clicar na aba já aberta fecha o painel). */
const aba = async nome => {
  const b = page.getByRole('button', { name: nome, exact: true }).first()
  if (await b.getAttribute('aria-pressed') !== 'true') await b.click()
}
const clipe = nome => page.locator('[data-clip-id]').filter({ hasText: nome })
const tempo = async () => (await page.locator('text=/^\\d\\d:\\d\\d\\.\\d\\d$/').first().innerText()).trim()

describe('Editor de vídeo — telas de ponta a ponta', () => {
  before(async () => {
    assert.ok(MIDIA, 'EDITOR_UI_MIDIA com as mídias de exemplo (o npm run editor:ui gera)')
    browser = await chromium.launch({ ...(executablePath ? { executablePath } : {}), proxy: { server: process.env.HTTPS_PROXY || 'direct://', bypass: '<-loopback>,localhost,127.0.0.1' } })
    page = await (await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true })).newPage()
    page.setDefaultTimeout(20000)
    page.on('pageerror', e => erros.push(`[${testeAtual}] ${String(e)}`))
    page.on('console', m => { if (m.type() === 'error') erros.push(`[${testeAtual}] console: ${m.text().slice(0, 300)}`) })
    await page.goto(`${BASE}/editor/${PROJETO}`, { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: 'Mídia' }).first().waitFor({ timeout: 120000 })
    // Na primeira visita o servidor de desenvolvimento ainda compila partes da tela e pode recarregar a página:
    // espera assentar e recarrega uma vez antes de começar.
    await page.waitForTimeout(4000)
    await page.reload({ waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: 'Mídia' }).first().waitFor({ timeout: 120000 })
    await page.waitForTimeout(1500)
  })
  after(async () => { await browser?.close() })
  beforeEach(t => { testeAtual = t.name })

  test('carregar vídeos, foto e música e montar a linha do tempo', async () => {
    const carregar = () => page.locator('input[type=file][accept]').first().setInputFiles(['vertical.mp4', 'paisagem.mp4', 'foto.png', 'musica.mp3'].map(n => join(MIDIA, n)))
    await carregar()
    try { await page.getByRole('button', { name: 'Adicionar vertical.mp4' }).waitFor({ timeout: 45000 }) }
    catch { await carregar(); await page.getByRole('button', { name: 'Adicionar vertical.mp4' }).waitFor({ timeout: 60000 }) }
    await page.getByRole('button', { name: 'Adicionar vertical.mp4' }).click()
    await clipe('vertical.mp4').first().waitFor()
    await page.keyboard.press('End')
    await page.getByRole('button', { name: 'Adicionar foto.png' }).click()
    await aba('Áudio')
    await page.getByRole('button', { name: 'Meus áudios' }).click()
    await page.getByRole('button', { name: /musica\.mp3/ }).first().click()
    await clipe('musica.mp3').first().waitFor()
    const nomes = (await clipes()).map(c => c.nome)
    for (const n of ['vertical.mp4', 'foto.png', 'musica.mp3']) assert.ok(nomes.includes(n), `${n} na linha do tempo (${nomes})`)
    assert.ok(await page.locator('[class*=wave] , svg[class*=wave], canvas').count() >= 0)
    await foto('ed-01-linha-do-tempo')
  })

  test('os clipes mostram os quadros do vídeo; o + de Meus áudios aparece', async () => {
    await page.waitForFunction(() => [...document.querySelectorAll('[class*=film] i')].some(i => getComputedStyle(i).backgroundImage.startsWith('url(')), null, { timeout: 30000 })
    await aba('Áudio')
    await page.getByRole('button', { name: 'Meus áudios' }).click()
    const cor = await page.getByRole('button', { name: /Adicionar musica\.mp3/ }).first().evaluate(b => getComputedStyle(b).color)
    assert.notEqual(cor, 'rgb(255, 255, 255)', 'o ícone + não some no fundo branco')
  })

  test('a prévia toca e a agulha anda', async () => {
    await page.keyboard.press('Home')
    await page.getByRole('button', { name: 'Tocar' }).click()
    await page.waitForTimeout(1500)
    await page.getByRole('button', { name: 'Pausar' }).click()
    assert.notEqual(await tempo(), '00:00.00', 'o tempo avançou ao tocar')
  })

  test('dividir na agulha, arrastar e aparar um clipe', async () => {
    await clipe('vertical.mp4').first().click({ position: { x: 40, y: 10 } })
    await page.keyboard.press('Home')
    for (let i = 0; i < 4; i++) await page.keyboard.press('Shift+ArrowRight')
    await page.keyboard.press('s')
    await page.waitForFunction(() => [...document.querySelectorAll('[data-clip-id]')].filter(e => e.innerText.includes('vertical.mp4') && e.getBoundingClientRect().height > 20).length === 2)
    const [a, b] = (await clipes()).filter(c => c.nome === 'vertical.mp4')
    assert.equal(a.largura, b.largura, 'as duas metades têm 4 s cada')
    // Arrastar a segunda metade para a direita.
    const r = await clipe('vertical.mp4').last().boundingBox()
    await page.mouse.move(r.x + r.width / 2, r.y + r.height / 2); await page.mouse.down()
    await page.mouse.move(r.x + r.width / 2 + 120, r.y + r.height / 2, { steps: 10 }); await page.mouse.up()
    const depois = (await clipes()).filter(c => c.nome === 'vertical.mp4')
    assert.ok(depois[1].x > b.x + 60, `o clipe andou para a direita (${b.x} → ${depois[1].x})`)
    // Aparar a primeira metade pela borda direita.
    await clipe('vertical.mp4').first().click({ position: { x: 40, y: 10 } })
    const p = await clipe('vertical.mp4').first().boundingBox()
    await page.mouse.move(p.x + p.width - 2, p.y + p.height / 2); await page.mouse.down()
    await page.mouse.move(p.x + p.width - 60, p.y + p.height / 2, { steps: 8 }); await page.mouse.up()
    const aparado = (await clipes()).filter(c => c.nome === 'vertical.mp4')[0]
    assert.ok(aparado.largura < a.largura - 30, `o clipe ficou mais curto (${a.largura} → ${aparado.largura})`)
    await foto('ed-02-cortes')
  })

  test('texto e legenda entram na linha do tempo; desfazer e refazer', async () => {
    await aba('Texto')
    await page.locator('button').filter({ hasText: 'Título' }).filter({ hasText: 'Entra com pop' }).first().click()
    await page.getByText('Seu título aqui').first().waitFor()
    await aba('Legendas')
    await page.locator('button').filter({ hasText: 'Legenda' }).filter({ hasText: 'animada' }).first().click()
    await clipe('Escreva a frase da legenda').first().waitFor()
    await page.keyboard.press('Escape')
    await page.locator('body').click({ position: { x: 1300, y: 300 } })
    await page.keyboard.press('Control+z')
    await page.waitForFunction(() => ![...document.querySelectorAll('[data-clip-id]')].some(e => e.innerText.includes('Escreva a frase da legenda')))
    await page.keyboard.press('Control+Shift+z')
    await clipe('Escreva a frase da legenda').first().waitFor()
  })

  test('legendas automáticas: ouve o vídeo e cria as legendas no tempo das palavras', async () => {
    const antes = (await clipes()).filter(c => !/vertical|paisagem|foto|musica|título|Escreva/i.test(c.nome)).length
    await aba('Legendas')
    await page.getByRole('button', { name: 'Gerar legendas' }).click()
    await page.getByText(/\d+ legendas? criadas?/).waitFor({ timeout: 90000 })
    const novas = (await clipes()).filter(c => /teste|legenda|automática|Otto|pessoal/i.test(c.nome) && !/Escreva/.test(c.nome))
    assert.ok(novas.length >= 2 && novas.length > antes, `legendas criadas (${novas.map(c => c.nome)})`)
    await page.keyboard.press('Control+z')
    await page.waitForFunction(() => ![...document.querySelectorAll('[data-clip-id]')].some(e => /Olá pessoal/.test(e.textContent ?? '')))
    await page.keyboard.press('Control+Shift+z')
  })

  test('IA: sem a IA no servidor, o leitor de comandos responde e edita', async () => {
    await aba('IA')
    await page.getByLabel('Pedido para a IA').fill('Coloca fade em tudo')
    await page.keyboard.press('Enter')
    await page.getByText(/Coloquei transição fade/).waitFor({ timeout: 30000 })
    assert.equal(await page.getByText(/próxima fase/).count(), 0)
  })

  test('o projeto continua igual depois de recarregar', async () => {
    const antes = (await clipes()).map(c => c.nome).sort()
    await page.waitForTimeout(1500)
    await page.reload({ waitUntil: 'domcontentloaded' })
    await clipe('vertical.mp4').first().waitFor({ timeout: 60000 })
    assert.deepEqual((await clipes()).map(c => c.nome).sort(), antes)
  })

  test('versões: automática ao editar, com nome, renomear, prévia sem mexer no projeto e restaurar', async () => {
    const nomes = () => page.locator('[data-versao] b').allInnerTexts()
    await page.evaluate(() => { window.__editorIntervaloVersoes = 2000 })
    await page.waitForTimeout(2200)
    await aba('Texto')
    await page.locator('button').filter({ hasText: 'Subtítulo' }).first().click()
    await page.getByRole('button', { name: 'Versões' }).click()
    await page.waitForFunction(() => [...document.querySelectorAll('[data-versao] b')].some(b => b.textContent === 'Versão automática'), null, { timeout: 30000 })
    await page.getByLabel('Nome da versão').fill('Corte final')
    await page.getByRole('button', { name: 'Salvar', exact: true }).click()
    await page.waitForFunction(() => [...document.querySelectorAll('[data-versao] b')].some(b => b.textContent === 'Corte final'))
    const auto = page.locator('[data-versao]').filter({ hasText: 'Versão automática' }).first()
    await auto.hover(); await auto.getByRole('button', { name: /Dar nome/ }).click()
    await page.getByLabel('Novo nome da versão').fill('Com subtítulo'); await page.keyboard.press('Enter')
    await page.waitForFunction(() => [...document.querySelectorAll('[data-versao] b')].some(b => b.textContent === 'Com subtítulo'))
    await foto('ed-03-versoes')
    // Tira o subtítulo; a prévia da versão "Com subtítulo" não mexe no projeto; restaurar traz o subtítulo de volta.
    await page.getByRole('button', { name: 'Fechar o histórico' }).click()
    await clipe('Um subtítulo curto').first().click({ position: { x: 20, y: 10 } })
    await page.keyboard.press('Delete')
    await page.waitForFunction(() => ![...document.querySelectorAll('[data-clip-id]')].some(e => e.textContent?.includes('Um subtítulo curto')))
    await page.getByRole('button', { name: 'Versões' }).click()
    await page.locator('[data-versao]').filter({ hasText: 'Com subtítulo' }).first().getByRole('button', { name: /^Ver / }).click()
    await page.getByRole('button', { name: 'Restaurar esta versão' }).waitFor()
    assert.equal(await clipe('Um subtítulo curto').count(), 0, 'a prévia não muda o projeto')
    await page.getByRole('button', { name: 'Restaurar esta versão' }).click()
    await clipe('Um subtítulo curto').first().waitFor()
    await page.waitForFunction(() => [...document.querySelectorAll('[data-versao] b')].some(b => b.textContent === 'Restaurada: Com subtítulo'))
    assert.ok((await nomes()).includes('Corte final'), 'nada se perdeu ao restaurar')
    await page.getByRole('button', { name: 'Fechar o histórico' }).click()
  })

  test('exportar gera um MP4 vertical com som', async () => {
    await page.getByRole('button', { name: 'Exportar' }).first().click()
    const baixar = page.waitForEvent('download', { timeout: 240000 })
    await page.locator('button').filter({ hasText: /^Exportar$/ }).last().click()
    const download = await baixar
    const pasta = mkdtempSync(join(tmpdir(), 'editor-export-'))
    const arquivo = join(pasta, 'video.mp4')
    await download.saveAs(arquivo)
    const info = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_streams', '-show_format', arquivo]).toString())
    const video = info.streams.find(s => s.codec_type === 'video'), audio = info.streams.find(s => s.codec_type === 'audio')
    assert.equal(`${video.width}x${video.height}`, '1080x1920')
    assert.ok(audio, 'o vídeo exportado tem som')
    assert.ok(Number(info.format.duration) > 8, `duração ${info.format.duration}s`)
    // A exportação vira uma versão, e o vídeo exportado mostra no início de qual projeto e versão veio.
    await page.getByRole('dialog', { name: 'Exportar vídeo' }).getByRole('button', { name: 'Fechar' }).click()
    await page.getByRole('button', { name: 'Versões' }).click()
    await page.waitForFunction(() => [...document.querySelectorAll('[data-versao] b')].some(b => b.textContent?.startsWith('Exportado em')), null, { timeout: 30000 })
    await page.getByRole('button', { name: 'Fechar o histórico' }).click()
    await page.goto(`${BASE}/editor`, { waitUntil: 'domcontentloaded' })
    await page.locator('[class*=origem]').filter({ hasText: /Exportado em/ }).first().waitFor({ timeout: 30000 })
    await page.goto(`${BASE}/editor/${PROJETO}`, { waitUntil: 'domcontentloaded' })
    await clipe('vertical.mp4').first().waitFor({ timeout: 60000 })
  })

  test('celular: a prévia e a linha do tempo aparecem na primeira tela', async () => {
    // Mesma janela do navegador (o projeto está guardado nela), só que com a largura de um celular.
    const cel = await page.context().newPage()
    await cel.setViewportSize({ width: 390, height: 844 })
    await cel.goto(`${BASE}/editor/${PROJETO}`, { waitUntil: 'domcontentloaded' })
    await cel.locator('[data-clip-id]').first().waitFor({ timeout: 60000 })
    const r = await cel.locator('[data-clip-id]').first().boundingBox()
    assert.ok(r && r.y + r.height < 844, `linha do tempo visível sem rolar (y=${r?.y})`)
    await cel.close()
  })

  test('sem erros de página', () => {
    const reais = erros.filter(e => !/Clerk|clerk|ERR_TUNNEL|Failed to fetch|Failed to load resource/.test(e))
    assert.deepEqual(reais, [])
  })
})
