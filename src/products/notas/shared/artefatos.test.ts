import { test } from 'node:test'
import assert from 'node:assert/strict'
import { CSP_ARTEFATO, documentoIsolado, LIMITE_HTML, SANDBOX_ARTEFATO, textoDoHtml, tituloDoHtml, validarHtml } from './artefatos'

test('artefato: HTML vazio, de outro tipo ou acima do limite é recusado', () => {
  assert.equal(validarHtml('').ok, false)
  assert.equal(validarHtml(42).ok, false)
  assert.equal(validarHtml('a'.repeat(LIMITE_HTML)).ok, true)
  assert.equal(validarHtml('a'.repeat(LIMITE_HTML + 1)).ok, false)
  assert.equal(validarHtml('ç'.repeat(LIMITE_HTML / 2 + 1)).ok, false, 'o limite é em bytes')
})

test('artefato: texto visível para a busca, sem scripts, estilos e comentários', () => {
  const html = '<html><head><title>T</title><style>.a{color:red}</style></head><body><!-- nota --><h1>Vendas &amp; metas</h1><p>Total: R&#36; 10</p><script>var segredo = 1</script></body></html>'
  const texto = textoDoHtml(html)
  assert.match(texto, /Vendas & metas/); assert.match(texto, /Total: R\$ 10/)
  assert.doesNotMatch(texto, /segredo|color|nota/)
  assert.equal(tituloDoHtml(html), 'T')
  assert.equal(tituloDoHtml('<p>sem título</p>'), '')
})

test('artefato: a política de segurança vem antes de qualquer conteúdo e bloqueia a rede', () => {
  for (const html of ['<p>oi</p>', '<!DOCTYPE html><html><head><script>x()</script></head></html>', '<script>antes()</script><head></head>']) {
    const doc = documentoIsolado(html)
    assert.ok(doc.startsWith('<!doctype html><meta http-equiv="Content-Security-Policy"'), doc.slice(0, 80))
    assert.equal(doc.match(/<!doctype/gi)?.length, 1, 'um doctype só, no começo')
    assert.ok(doc.indexOf('Content-Security-Policy') < doc.indexOf('<script') || !doc.includes('<script'))
  }
  assert.match(CSP_ARTEFATO, /connect-src 'none'/)
  assert.match(CSP_ARTEFATO, /form-action 'none'/)
  assert.doesNotMatch(SANDBOX_ARTEFATO, /allow-same-origin|allow-top-navigation|allow-forms/)
})

test('artefato: trocas pontuais exigem trecho único e valem em ordem; leitura em partes', async () => {
  const { aplicarSubstituicoes, parteDoHtml } = await import('./artefatos')
  assert.deepEqual(aplicarSubstituicoes('<h1>A</h1><p>B</p>', [{ antigo: '<h1>A</h1>', novo: '<h1>C</h1>' }, { antigo: 'C', novo: 'D' }]), { ok: true, valor: '<h1>D</h1><p>B</p>' })
  assert.equal(aplicarSubstituicoes('<p>x</p><p>x</p>', [{ antigo: '<p>x</p>', novo: '' }]).ok, false)
  assert.equal(aplicarSubstituicoes('<p>x</p>', [{ antigo: 'y', novo: 'z' }]).ok, false)
  assert.equal(aplicarSubstituicoes('<p>x</p>', [{ antigo: '', novo: 'z' }]).ok, false)
  const html = 'a'.repeat(25)
  assert.deepEqual(parteDoHtml(html, 0, 10), { trecho: 'a'.repeat(10), inicio: 0, fim: 10, total: 25, proximo_inicio: 10 })
  assert.equal(parteDoHtml(html, 20, 10).proximo_inicio, null)
})
