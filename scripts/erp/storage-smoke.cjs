const assert = require('node:assert/strict')
const { build } = require('esbuild')
const vm = require('node:vm')
const { mkdirSync, writeFileSync } = require('node:fs')

async function main() {
  const bundle = await build({ entryPoints: ['src/products/erp/server/erpStorage.ts'], bundle: true, platform: 'node', format: 'cjs', write: false })
  const module = { exports: {} }
  vm.runInNewContext(bundle.outputFiles[0].text, { module, exports: module.exports, URL, AbortSignal, process: { env: {} } })
  const { signErpDocumentFile } = module.exports
  const base = 'https://abcdefghijklmnopqrst.supabase.co'
  const file = { bucket: 'erp-anexos', caminho: 'empresa-1/nota ç.pdf', nome: 'nota.pdf' }
  let requests = 0
  const send = async (url, input) => {
    ++requests
    assert.equal(url, base + '/storage/v1/object/sign/erp-anexos/empresa-1/nota%20%C3%A7.pdf')
    assert.equal(input.method, 'POST')
    assert.deepEqual(JSON.parse(input.body), { expiresIn: 60 })
    assert.equal(input.cache, 'no-store')
    assert.equal(input.headers.Authorization, 'Bearer synthetic-key')
    assert(input.signal instanceof AbortSignal)
    return { ok: true, json: async () => ({ signedURL: '/object/sign/erp-anexos/empresa-1/nota%20%C3%A7.pdf?token=synthetic-token' }) }
  }
  const config = { base, key: 'synthetic-key', send }
  const result = await signErpDocumentFile(file, config)
  assert.equal(result.origin, base)
  assert.equal(result.searchParams.get('token'), 'synthetic-token')
  let checks = 1
  await assert.rejects(signErpDocumentFile(file, { send }), error => error.code === 'STORAGE_UNAVAILABLE' && error.status === 503)
  ++checks
  for (const invalid of ['http://abcdefghijklmnopqrst.supabase.co', base + '/other', 'https://attacker.example', base + '?secret=x', 'https://user:password@abcdefghijklmnopqrst.supabase.co']) {
    await assert.rejects(signErpDocumentFile(file, { ...config, base: invalid }), error => error.code === 'STORAGE_UNAVAILABLE')
    ++checks
  }
  for (const caminho of ['../other.pdf', 'company/../other.pdf', '/other.pdf', 'company//other.pdf', 'company\\other.pdf', 'company/\u0000other.pdf']) {
    await assert.rejects(signErpDocumentFile({ ...file, caminho }, config), error => error.code === 'FILE_UNAVAILABLE' && error.status === 422)
    ++checks
  }
  await assert.rejects(signErpDocumentFile({ ...file, bucket: '../erp' }, config), error => error.status === 422)
  ++checks
  assert.equal(requests, 1, 'Invalid configuration and paths must not send credentials')
  for (const signedURL of ['https://attacker.example/file', '/object/sign/erp-anexos/other.pdf?token=x', '/object/sign/erp-anexos/empresa-1/nota%20%C3%A7.pdf']) {
    await assert.rejects(signErpDocumentFile(file, { ...config, send: async () => ({ ok: true, json: async () => ({ signedURL }) }) }), error => error.status === 503 && !error.message.includes('synthetic-key'))
    ++checks
  }
  for (const send of [async () => { throw new Error('synthetic-key') }, async () => ({ ok: false })]) {
    await assert.rejects(signErpDocumentFile(file, { ...config, send }), error => error.status === 503 && !error.message.includes('synthetic-key'))
    ++checks
  }
  const proof = { status: 'passed', checks, externalRequests: 0, realStorageVerified: false }
  mkdirSync('.cache/erp-audit', { recursive: true })
  writeFileSync('.cache/erp-audit/storage-regression.json', JSON.stringify(proof, null, 2))
  console.log(JSON.stringify(proof))
}
main().catch(error => { console.error(error.message); process.exitCode = 1 })
