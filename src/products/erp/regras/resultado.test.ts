import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ok, primeiraRecusa, recusa } from './resultado'

test('ok() aprova', () => {
  assert.deepEqual(ok(), { ok: true })
})

test('recusa() usa VALIDATION_ERROR e 422 por padrão', () => {
  assert.deepEqual(recusa('CR-12', 'Valor acima do saldo.'), {
    ok: false, regra: 'CR-12', mensagem: 'Valor acima do saldo.', codigo: 'VALIDATION_ERROR', status: 422,
  })
})

test('recusa() leva código, status e detalhes informados', () => {
  const resultado = recusa('VD-22', 'Limite excedido.', { codigo: 'CREDIT_LIMIT_EXCEEDED', status: 409, detalhes: { excedente: 10 } })
  assert.equal(resultado.codigo, 'CREDIT_LIMIT_EXCEEDED')
  assert.equal(resultado.status, 409)
  assert.deepEqual(resultado.detalhes, { excedente: 10 })
})

test('recusa() exige código do catálogo e mensagem', () => {
  assert.throws(() => recusa('vd22', 'x'), /Código de regra inválido/)
  assert.throws(() => recusa('VD-2', 'x'), /Código de regra inválido/)
  assert.throws(() => recusa('VD-22', '  '), /sem mensagem/)
  assert.doesNotThrow(() => recusa('CPG-03', 'x'))
})

test('primeiraRecusa() devolve a primeira recusa, na ordem', () => {
  const primeira = recusa('GE-11', 'Parcelas não fecham.')
  const segunda = recusa('GE-12', 'Mais de 48 parcelas.')
  assert.equal(primeiraRecusa(ok(), primeira, segunda), primeira)
  assert.deepEqual(primeiraRecusa(ok(), ok()), { ok: true })
  assert.deepEqual(primeiraRecusa(), { ok: true })
})
