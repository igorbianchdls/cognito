import { test } from 'node:test'
import assert from 'node:assert/strict'
import { FUSO_PADRAO, fusoDaEmpresa, fusoValido, hojeDaEmpresa, limitesDoMes, somarDias } from './geral'

// 25/11/2026 01:05 UTC = 24/11/2026 22:05 em São Paulo: o caso do bug de fuso de 2026-11-25.
const NOITE_EM_SAO_PAULO = new Date('2026-11-25T01:05:00Z')

test('GE-01: à noite em São Paulo, "hoje" da empresa ainda é o dia anterior ao UTC', () => {
  assert.equal(hojeDaEmpresa('America/Sao_Paulo', NOITE_EM_SAO_PAULO), '2026-11-24')
  assert.equal(hojeDaEmpresa('UTC', NOITE_EM_SAO_PAULO), '2026-11-25')
})

test('GE-01: sem fuso ou com fuso inválido, usa America/Sao_Paulo', () => {
  assert.equal(hojeDaEmpresa(undefined, NOITE_EM_SAO_PAULO), '2026-11-24')
  assert.equal(hojeDaEmpresa(null, NOITE_EM_SAO_PAULO), '2026-11-24')
  assert.equal(hojeDaEmpresa('Lua/Base', NOITE_EM_SAO_PAULO), '2026-11-24')
  assert.equal(fusoDaEmpresa('Lua/Base'), FUSO_PADRAO)
  assert.equal(fusoDaEmpresa(''), FUSO_PADRAO)
})

test('GE-01: outros fusos', () => {
  assert.equal(hojeDaEmpresa('America/Manaus', new Date('2026-11-25T03:30:00Z')), '2026-11-24')
  assert.equal(hojeDaEmpresa('Asia/Tokyo', new Date('2026-11-24T16:00:00Z')), '2026-11-25')
})

test('fusoValido() aceita IANA e recusa texto qualquer', () => {
  assert.equal(fusoValido('America/Sao_Paulo'), true)
  assert.equal(fusoValido('UTC'), true)
  assert.equal(fusoValido('Lua/Base'), false)
  assert.equal(fusoValido('drop table'), false)
  assert.equal(fusoValido(42), false)
})

test('somarDias() atravessa mês e ano', () => {
  assert.equal(somarDias('2026-11-30', 1), '2026-12-01')
  assert.equal(somarDias('2026-12-31', 1), '2027-01-01')
  assert.equal(somarDias('2026-03-01', -1), '2026-02-28')
})

test('limitesDoMes() com deslocamento e ano bissexto', () => {
  assert.deepEqual(limitesDoMes('2026-11-24'), { inicio: '2026-11-01', fim: '2026-11-30' })
  assert.deepEqual(limitesDoMes('2028-03-10', -1), { inicio: '2028-02-01', fim: '2028-02-29' })
  assert.deepEqual(limitesDoMes('2026-12-05', 1), { inicio: '2027-01-01', fim: '2027-01-31' })
})
