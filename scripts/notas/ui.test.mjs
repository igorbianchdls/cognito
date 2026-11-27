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
    page.on('response', r => { if (r.url().includes('/api/notas/') && (r.status() >= 500 || r.status() === 409 || r.status() === 400)) r.text().then(t => {
      let campos = ''; try { campos = Object.keys(JSON.parse(r.request().postData() ?? '{}')).join(',') } catch { /* sem corpo */ }
      let titulo = ''; try { titulo = JSON.parse(t).atual?.titulo ?? '' } catch { /* sem json */ }
      erros.push(`${r.status()} ${r.request().method()} ${r.url().split('/api/notas')[1]} campos=[${campos}] pagina="${titulo}" ${t.slice(0, 90)}`)
    }).catch(() => {}) })
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
    await page.waitForLoadState('networkidle')
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

  test('etapa 6: blocos de destaque, colunas, incorporar (YouTube) e botão', async () => {
    await novaPagina()
    await page.getByLabel('Título da página').fill('Blocos novos')
    await page.getByLabel('Título da página').press('Enter')
    const comando = async (texto, item) => { await page.keyboard.type(texto); await page.getByRole('option', { name: item }).first().click(); await page.waitForTimeout(300) }
    await comando('/destaque', /^Destaque/)
    await page.keyboard.type('Atenção a este ponto.')
    await page.keyboard.press('Enter'); await page.keyboard.press('Enter')
    await comando('/2 colunas', /^2 colunas/)
    await page.keyboard.type('Coluna da esquerda')
    await page.locator('.bn-editor').locator('[data-content-type=paragraph]').last().click()
    await comando('/incorporar', /^Incorporar/)
    await page.getByLabel('Link para incorporar').fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
    await page.getByRole('button', { name: 'Incorporar', exact: true }).click()
    await page.locator('iframe[title=YouTube]').waitFor()
    await page.locator('.bn-editor [data-content-type=destaque]').getByText('Atenção a este ponto.').waitFor()
    const colunas = await page.evaluate(() => { const g = document.querySelector('.bn-block-content[data-content-type=colunas]')?.closest('.bn-block')?.querySelector(':scope > .bn-block-group'); return g ? getComputedStyle(g).display : null })
    assert.equal(colunas, 'flex', 'colunas lado a lado')
    await foto('ui-13-blocos')
    await salvo()
    await page.reload({ waitUntil: 'domcontentloaded' }); await page.locator('.bn-editor').waitFor()
    await page.locator('iframe[title=YouTube]').waitFor()
    await page.getByText('Atenção a este ponto.').waitFor()
  })

  test('etapa 6: linha do tempo e subitens', async () => {
    await novaPagina()
    await page.getByRole('button', { name: 'Tarefas' }).click()
    await page.getByRole('tab', { name: 'Tabela' }).click()
    await page.getByRole('button', { name: 'Nova visão' }).click()
    await page.getByRole('menuitem', { name: 'Linha do tempo' }).click()
    await page.getByRole('button', { name: 'Hoje' }).waitFor()
    await page.getByText('Sem data (3)').waitFor()
    await foto('ui-14-linha-do-tempo')
    await page.getByRole('tab', { name: 'Tabela' }).click()
    await page.getByTitle('Propriedades e agrupamento').click()
    await page.getByRole('button', { name: /Subitens/ }).click()
    await page.keyboard.press('Escape')
    await page.waitForTimeout(1500)
    await page.locator('[role=row]', { hasText: 'Tarefa 1' }).click({ button: 'right' })
    await page.getByRole('menuitem', { name: 'Novo subitem' }).click()
    await page.locator('textarea:focus').waitFor()
    await page.keyboard.type('Subtarefa A'); await page.keyboard.press('Enter')
    await page.getByRole('gridcell', { name: /Subtarefa A/ }).waitFor()
    await page.getByLabel('Esconder subitens').first().waitFor()
    await foto('ui-15-subitens')
    await page.getByLabel('Esconder subitens').first().click()
    await page.getByRole('gridcell', { name: /Subtarefa A/ }).waitFor({ state: 'detached' })
  })

  test('etapa 6: caixa de entrada mostra aviso de outra pessoa e marca como lido', async () => {
    const { execFileSync } = await import('node:child_process')
    const sql = "INSERT INTO notas.notificacoes (workspace_id, user_id, tipo, pagina_id, autor, texto) SELECT 'org_a', 'ana', 'comentario', id, 'bia', 'Pode revisar?' FROM notas.paginas WHERE titulo = 'Blocos novos' LIMIT 1"
    execFileSync('psql', ['-q', process.env.NOTAS_TEST_DB_URL ?? 'postgresql://postgres@localhost:54329/postgres', '-c', sql])
    await page.goto(`${BASE}/notas`, { waitUntil: 'domcontentloaded' })
    await page.getByRole('button', { name: /Caixa de entrada\s*1/ }).click()
    await page.getByText('Pode revisar?').waitFor()
    await foto('ui-16-caixa')
    await page.getByText('Pode revisar?').click()
    await page.waitForURL(/\/notas\/[0-9a-f-]{36}$/)
    await page.getByRole('button', { name: /^Caixa de entrada$/ }).first().waitFor()
  })

  test('etapa 6: importar ZIP do Notion (página, subpágina, base e imagem)', async () => {
    const { createRequire } = await import('node:module')
    const { zipSync, strToU8 } = createRequire(import.meta.url)('fflate')
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')
    const id = '0123456789abcdef0123456789abcdef'
    const zip = zipSync({
      [`Manual da marca ${id}.md`]: strToU8('# Manual da marca\n\nTom de voz **direto**.\n\n![logo](Manual%20da%20marca%20' + id + '/logo.png)\n'),
      [`Manual da marca ${id}/logo.png`]: new Uint8Array(png),
      [`Manual da marca ${id}/Cores ${id.replace('0', '1')}.md`]: strToU8('# Cores\n\n- Azul\n- Branco\n'),
      [`Manual da marca ${id}/Campanhas ${id.replace('0', '2')}.csv`]: strToU8('Nome,Status,Verba\nVerão,Ativa,1000\nNatal,Planejada,2500\nPáscoa,Ativa,800\nInverno,Planejada,600\n'),
      [`Manual da marca ${id}/Campanhas ${id.replace('0', '2')}/Verão ${id.replace('0', '3')}.md`]: strToU8('# Verão\n\nFoco em praia.\n'),
    })
    await page.goto(`${BASE}/notas`, { waitUntil: 'domcontentloaded' })
    await page.getByRole('tree', { name: 'Páginas' }).waitFor()
    await page.getByLabel('Arquivo para importar').setInputFiles({ name: 'Export-notion.zip', mimeType: 'application/zip', buffer: Buffer.from(zip) })
    await page.waitForURL(/\/notas\/[0-9a-f-]{36}$/, { timeout: 60000 })
    await page.locator('.bn-editor').getByText('direto').waitFor()
    assert.equal(await page.getByLabel('Título da página').inputValue(), 'Manual da marca')
    await page.locator('[role=treeitem]', { hasText: 'Manual da marca' }).first().getByLabel('Expandir').click()
    await page.locator('[role=treeitem]', { hasText: 'Cores' }).first().waitFor()
    await page.locator('[role=treeitem]', { hasText: 'Campanhas' }).first().click()
    await page.getByRole('gridcell', { name: /Verão/ }).waitFor()
    await foto('ui-17-notion')
  })

  test('sem erros de servidor nem de página', () => {
    // O armazenamento de arquivos (Supabase Storage) não existe no banco local: o envio da imagem do ZIP falha aqui
    // e a importação segue sem ela (é o comportamento esperado). Em produção o bucket "notas" existe.
    const semStorage = e => /\/arquivos|status of 500/.test(e) && erros.some(x => /500 POST (.*api\/notas)?\/arquivos/.test(x))
    const relevantes = erros.filter(e => !/clerk|ERR_TUNNEL_CONNECTION_FAILED|ERR_NAME_NOT_RESOLVED/i.test(e) && !semStorage(e))
    if (relevantes.length) console.error('Erros encontrados:', JSON.stringify(relevantes, null, 1))
    assert.deepEqual(relevantes, [])
  })
})
