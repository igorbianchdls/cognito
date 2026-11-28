// Analytics de ponta a ponta: uma loja de teste (em outra porta) com o otto.js de verdade manda páginas, cliques,
// rolagem, identify, flags e a gravação da sessão; depois cada tela do Analytics mostra o que chegou.
// Uso: npm run analytics:ui (sobe o Next em modo de teste e o banco local).
import { after, before, describe, test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
let chromium, executablePath
try { ({ chromium } = require('playwright')) } catch { ({ chromium } = require('playwright-core')); executablePath = process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium' }

const URL_APP = process.env.ANALYTICS_UI_URL ?? 'http://localhost:3102'
const PORTA_LOJA = Number(process.env.ANALYTICS_UI_LOJA ?? 3299)
const LOJA = `http://localhost:${PORTA_LOJA}`
const FOTOS = process.env.ANALYTICS_UI_FOTOS
const api = async (caminho, init = {}) => {
  const r = await fetch(`${URL_APP}/api/analytics/${caminho}`, { method: init.json ? (init.method ?? 'POST') : (init.method ?? 'GET'), headers: { 'content-type': 'application/json' }, body: init.json ? JSON.stringify(init.json) : undefined })
  const corpo = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(`${caminho}: ${r.status} ${corpo.erro}`)
  return corpo
}

let site, servidor, navegador
const pagina = (titulo, corpo, key) => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${titulo}</title>
<style>body{font-family:sans-serif;margin:0}header{padding:24px;background:#f4f4f4}main{padding:24px}.alto{height:1800px;background:linear-gradient(#fff,#eef)}button{padding:12px 20px;font-size:16px}</style>
<script async src="${URL_APP}/otto.js" data-key="${key}"></script></head><body><header><a href="/">Início</a> · <a href="/precos">Preços</a></header><main>${corpo}</main></body></html>`

describe('Analytics na tela', () => {
  before(async () => {
    const sufixo = Date.now().toString(36)
    site = await api('dados/sites', { json: { name: `Loja ${sufixo}`, domains: ['localhost'], autocapture: true, replay_sample: 100, replay_mask_text: false } })
    await api('dados/flags', { json: { property_id: site.id, key: 'nova-home', name: 'Home nova', enabled: true, rollout: 100, variants: [{ key: 'controle', peso: 50 }, { key: 'nova', peso: 50 }] } })
    servidor = createServer((req, res) => {
      const rotas = {
        '/': pagina('Início', '<h1>Loja de teste</h1><p id="flag">…</p><button class="ver-precos" onclick="location.href=\'/precos\'">Ver preços</button><div class="alto"></div>', site.public_key),
        '/precos': pagina('Preços', '<h1>Preços</h1><button class="assinar" onclick="otto.track(\'assinou\', { plano: \'pro\', valor: 99 })">Assinar</button><button class="duvida">Dúvidas</button><div class="alto"></div>', site.public_key),
      }
      const html = rotas[req.url.split('?')[0]]
      res.writeHead(html ? 200 : 404, { 'content-type': 'text/html; charset=utf-8' }); res.end(html ?? 'não')
    }).listen(PORTA_LOJA)
    navegador = await chromium.launch(executablePath ? { executablePath } : {})
  })
  after(async () => { await navegador?.close(); servidor?.close() })

  test('a loja manda páginas, cliques, rolagem, identify, flag e gravação', async () => {
    for (const [i, aparelho] of [[0, { viewport: { width: 1280, height: 800 } }], [1, { viewport: { width: 390, height: 844 }, isMobile: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1' }]]) {
      const ctx = await navegador.newContext(aparelho)
      const p = await ctx.newPage()
      await p.goto(`${LOJA}/?utm_source=${i ? 'instagram' : 'google'}&utm_campaign=natal`)
      await p.waitForFunction(() => window.otto && window.otto.__loaded)
      const flag = await p.evaluate(() => new Promise(ok => window.otto.onFlags(() => ok(window.otto.flag('nova-home')))))
      assert.ok(['controle', 'nova'].includes(flag), `flag com variante (${flag})`)
      await p.waitForTimeout(1500)
      await p.mouse.wheel(0, 900); await p.waitForTimeout(300)
      await p.click('button.ver-precos')
      await p.waitForURL(/precos/)
      await p.waitForFunction(() => window.otto && window.otto.__loaded)
      await p.click('button.assinar')
      if (i) for (let k = 0; k < 3; k++) await p.click('button.duvida', { delay: 10 })
      await p.evaluate(() => window.otto.identify('cliente-' + (navigator.userAgent.includes('iPhone') ? 'cel' : 'pc'), { plano: 'pro' }))
      await p.mouse.wheel(0, 1500); await p.waitForTimeout(6500) // a gravação manda a cada 5 s
      await p.goto('about:blank'); await p.waitForTimeout(800)
      await ctx.close()
    }
    let inst
    for (let k = 0; k < 20; k++) { inst = await api(`catalogo?propriedade=${site.id}&tipo=instalacao`); if (inst.eventos_ultimo_dia >= 10) break; await new Promise(r => setTimeout(r, 500)) }
    assert.ok(inst.eventos_ultimo_dia >= 10, `eventos chegaram (${inst.eventos_ultimo_dia})`)
    const { eventos } = await api(`catalogo?propriedade=${site.id}&tipo=eventos`)
    const nomes = eventos.map(e => e.evento)
    for (const e of ['$pageview', '$autocapture', '$pageleave', '$identify', '$flag', 'assinou', '$rageclick']) assert.ok(nomes.includes(e), `chegou ${e} (${nomes.join(', ')})`)
    const g = await api(`gravacoes?propriedade=${site.id}`)
    assert.ok(g.gravacoes.length >= 2, `gravações (${g.gravacoes.length})`)
  })

  const tela = async (caminho, largura = 1360) => {
    const ctx = await navegador.newContext({ viewport: { width: largura, height: 900 } })
    const p = await ctx.newPage()
    const erros = []
    p.on('pageerror', e => erros.push(e.message))
    await p.addInitScript(id => localStorage.setItem('otto-analytics-property', id), site.id)
    await p.goto(`${URL_APP}${caminho}`)
    return { p, ctx, erros, foto: async nome => { if (FOTOS) await p.screenshot({ path: `${FOTOS}/${nome}.png`, fullPage: true }) } }
  }

  test('visão geral: agora, totais, origens e campanhas', async () => {
    const { p, ctx, erros, foto } = await tela('/analytics')
    await p.getByText('Visitantes por dia').waitFor()
    await p.waitForFunction(() => [...document.querySelectorAll('[data-total]')].some(e => e.textContent === '2'))
    await p.getByText('instagram').first().waitFor()
    await p.getByText('natal · google').waitFor()
    assert.match(await p.locator('[data-agora]').innerText(), /pessoa/)
    await foto('1-visao-geral'); assert.deepEqual(erros, []); await ctx.close()
  })

  test('insight: tendência com quebra, funil e salvar num painel', async () => {
    const painel = await api('dados/paineis', { json: { property_id: site.id, name: 'Marketing' } })
    const { p, ctx, erros, foto } = await tela('/analytics/insights/novo')
    await p.locator('[data-resultado] svg').first().waitFor()
    await p.getByLabel('Quebra').selectOption('aparelho')
    await p.getByText('Páginas vistas · mobile').first().waitFor()
    await foto('2-tendencia')
    await p.getByRole('tab', { name: 'Funil' }).click()
    const passos = p.locator('[data-passo-editor]')
    await passos.nth(0).getByLabel('Evento').selectOption('$pageview')
    await passos.nth(1).getByLabel('Evento').selectOption('assinou')
    await p.locator('[data-passo="2"]').getByText(/2 · 100%/).waitFor()
    await p.getByLabel('Nome do insight').fill('Home → assinatura')
    await p.getByLabel('Painel').selectOption(painel.id)
    await p.getByRole('button', { name: 'Adicionar' }).click()
    await p.getByText('Adicionado ao painel "Marketing".').waitFor()
    await p.waitForURL(/insights\/[0-9a-f-]{36}/)
    await foto('3-funil')
    await p.goto(`${URL_APP}/analytics/paineis/${painel.id}`)
    await p.locator('[data-cartao]').getByText('Home → assinatura').waitFor()
    await p.locator('[data-cartao] [data-passo="2"]').waitFor()
    await foto('4-painel'); assert.deepEqual(erros, []); await ctx.close()
  })

  test('retenção e caminhos', async () => {
    const { p, ctx, erros, foto } = await tela('/analytics/insights/novo')
    await p.getByRole('tab', { name: 'Retenção' }).click()
    await p.getByLabel('Retenção por coorte').waitFor()
    await p.getByRole('tab', { name: 'Caminhos' }).click()
    await p.getByLabel('Página').fill('/')
    await p.locator('[data-ligacao]').filter({ hasText: '/precos' }).first().waitFor()
    await foto('5-caminhos'); assert.deepEqual(erros, []); await ctx.close()
  })

  test('pessoas: identificadas, perfil com linha do tempo e gravação; coorte', async () => {
    const { p, ctx, erros, foto } = await tela('/analytics/pessoas')
    await p.getByRole('link', { name: 'cliente-cel' }).click()
    await p.getByText('Dados do identify').waitFor()
    await p.getByText('Clique de raiva').first().waitFor()
    await p.getByRole('link', { name: /Ver gravação/ }).first().waitFor()
    await foto('6-pessoa')
    await p.goto(`${URL_APP}/analytics/coortes`)
    await p.getByRole('button', { name: 'Nova coorte' }).click()
    await p.getByLabel('Nome da coorte').fill('Assinaram')
    await p.locator('[data-regra]').getByLabel('Evento').selectOption('assinou')
    await p.waitForFunction(() => document.querySelector('[data-contagem]')?.textContent?.includes('2 pessoas'))
    await p.getByRole('button', { name: 'Salvar coorte' }).click()
    await p.getByText('Assinaram').waitFor()
    await foto('7-coortes'); assert.deepEqual(erros, []); await ctx.close()
  })

  test('mapa de calor: cliques por cima da página, rolagem e elementos', async () => {
    const { p, ctx, erros, foto } = await tela('/analytics/mapa')
    await p.getByLabel('Página').selectOption('/precos')
    await p.locator('[data-mapa] canvas').waitFor()
    await p.locator('[data-elementos]').getByText('Assinar').waitFor()
    await p.getByRole('button', { name: 'Celular' }).click()
    await p.locator('[data-elementos]').getByText(/raiva/).waitFor()
    await p.locator('[data-rolagem]').waitFor()
    await p.waitForTimeout(800)
    await foto('8-mapa'); assert.deepEqual(erros, []); await ctx.close()
  })

  test('gravações: lista e reprodutor', async () => {
    const { p, ctx, erros, foto } = await tela('/analytics/gravacoes')
    await p.locator('[data-gravacao]').first().click()
    await p.locator('[data-palco] iframe').waitFor({ timeout: 20000 })
    await p.getByRole('button', { name: /Pausar|Tocar/ }).waitFor()
    await p.waitForTimeout(1500)
    await foto('9-gravacao'); assert.deepEqual(erros, []); await ctx.close()
  })

  test('flags e experimento com resultado', async () => {
    const { p, ctx, erros, foto } = await tela('/analytics/flags')
    await p.locator('[data-flag]').getByText('nova-home').waitFor()
    await p.getByRole('tab', { name: 'Experimentos' }).click()
    await p.getByRole('button', { name: 'Novo experimento' }).click()
    await p.getByLabel('Nome do experimento').fill('Home nova')
    await p.getByLabel('Evento objetivo').selectOption('assinou')
    await p.getByRole('button', { name: 'Criar' }).click()
    await p.getByRole('button', { name: 'Começar' }).click()
    await p.locator('[data-resultado-exp]').waitFor()
    await p.getByText(/poucas pessoas/).waitFor()
    await foto('10-experimento'); assert.deepEqual(erros, []); await ctx.close()
  })

  test('sites: instalação confirmada e celular sem rolagem lateral', async () => {
    const { p, ctx, erros, foto } = await tela('/analytics/sites')
    await p.locator('[data-instalado]').filter({ hasText: 'Recebendo eventos' }).first().waitFor()
    await ctx.close()
    const cel = await tela('/analytics', 390)
    await cel.p.getByText('Visitantes por dia').waitFor()
    assert.ok(await cel.p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'sem rolagem lateral no celular')
    await cel.foto('11-celular'); assert.deepEqual([...erros, ...cel.erros], []); await cel.ctx.close(); void foto
  })
})
