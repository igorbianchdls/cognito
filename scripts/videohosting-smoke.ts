// Videohosting without network or database: what a page receives for a public code (domains, own preview host,
// settings layered default ← company ← video, buttons) and the settings rules.
import assert from 'node:assert/strict'
import { embedConfig } from '../src/products/videohosting/server/embed'
import { DEFAULT_SETTINGS, cleanDomain, domainAllowed, mergeSettings } from '../src/products/videohosting/shared/settings'

const row = (over: Record<string, unknown> = {}) => ({
  id: 'v1', workspace_id: 'org_A', title: 'VSL', status: 'pronto', provider: 'drive', duration: '1200.5', width: 1080, height: 1920, settings: { barra: 'normal' },
  domains: null, trashed_at: null, storage_path: 'org_A/f1/vsl.mp4', file_trashed: null, thumb_path: 'org_A/f1/thumb.jpg', poster_path: null,
  preset: { cor: '#ff0000', autoplay_mudo: false }, company_domains: ['minhaloja.com.br'], ...over,
})
const ctas = [{ id: 'c1', inicio: '754.2', fim: null, texto: 'Comprar', url: 'https://loja.com/checkout', posicao: 'abaixo', fundo: '#16a34a', cor: '#ffffff', nova_aba: false }]
const deps = (r: Record<string, unknown> | null) => ({
  query: async (sql: string) => sql.includes('FROM videohosting.videos') ? (r ? [r] : []) : ctas,
  sign: async (path: string, seconds: number) => `https://signed.example/${path}?exp=${seconds}`,
})

async function main() {
  // ---------- settings ----------
  assert.deepEqual(mergeSettings(), DEFAULT_SETTINGS)
  const merged = mergeSettings({ cor: '#ff0000', barra: 'oculta', controles: { avancar: true } }, { barra: 'normal', cor: 'vermelho', arredondamento: 99 })
  assert.deepEqual([merged.cor, merged.barra, merged.controles.avancar, merged.controles.volume, merged.arredondamento], ['#ff0000', 'normal', true, true, 12])
  assert.equal(DEFAULT_SETTINGS.voltar_ao_inicio, true); assert.equal(DEFAULT_SETTINGS.autoplay_mudo, true)
  assert.equal(cleanDomain('https://www.Loja.com.br/vendas'), 'www.loja.com.br'); assert.equal(cleanDomain('lixo'), null)
  assert.equal(domainAllowed(['loja.com.br'], 'pagina.loja.com.br'), true); assert.equal(domainAllowed(['loja.com.br'], 'loja.com.br.golpe.com'), false)
  console.log('PASS configurações: padrão, empresa e vídeo em camadas; valor inválido cai para a camada de baixo')

  // ---------- what a page receives ----------
  const ok = await embedConfig('abc', 'pagina.minhaloja.com.br', 'otto.app', deps(row()))
  assert.equal(ok.status, 200)
  if (ok.status !== 200) return
  assert.deepEqual(ok.config.fonte, { tipo: 'mp4', url: 'https://signed.example/org_A/f1/vsl.mp4?exp=14400' })
  assert.equal(ok.config.capa, 'https://signed.example/org_A/f1/thumb.jpg?exp=14400')
  assert.deepEqual([ok.config.configuracoes.cor, ok.config.configuracoes.autoplay_mudo, ok.config.configuracoes.barra], ['#ff0000', false, 'normal'])
  assert.deepEqual([ok.config.botoes[0].inicio, ok.config.botoes[0].fim], [754.2, null]); assert.equal(ok.config.duracao, 1200.5)
  assert(!JSON.stringify(ok.config).includes('org_A"') && !('workspace_id' in ok.config), 'não expõe a empresa')
  assert.equal((await embedConfig('abc', 'golpe.com', 'otto.app', deps(row()))).status, 403)
  assert.equal((await embedConfig('abc', null, 'otto.app', deps(row()))).status, 403, 'sem origem, com domínios cadastrados, não toca')
  assert.equal((await embedConfig('abc', 'otto.app', 'otto.app', deps(row()))).status, 200, 'a prévia no próprio Otto toca')
  assert.equal((await embedConfig('abc', 'qualquer.com', 'otto.app', deps(row({ company_domains: [] })))).status, 200, 'sem domínios, toca em qualquer site')
  assert.equal((await embedConfig('abc', 'minhaloja.com.br', 'otto.app', deps(row({ domains: ['outra.com'] })))).status, 403, 'domínios do vídeo substituem os da empresa')
  assert.equal((await embedConfig('abc', 'x', 'x', deps(row({ trashed_at: '2026-01-01' })))).status, 404)
  assert.equal((await embedConfig('abc', 'x', 'x', deps(null))).status, 404)
  const noFile = await embedConfig('abc', 'otto.app', 'otto.app', deps(row({ file_trashed: '2026-01-01' })))
  assert(noFile.status === 200 && noFile.config.fonte === null, 'arquivo na lixeira do Drive: player avisa que não está pronto')
  console.log('PASS página recebe o vídeo só nos domínios permitidos (e na prévia do Otto), sem dados da empresa')
  console.log(JSON.stringify({ status: 'passed', checks: 2 }))
}
main().catch(error => { console.error(error); process.exit(1) })
