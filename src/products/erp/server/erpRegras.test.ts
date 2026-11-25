import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ErpDomainError } from '../shared/erpErrors'
import { ok, recusa } from '../regras/resultado'
import { exigirRegra } from './erpRegras'

test('exigirRegra() não faz nada quando a regra aprova', () => {
  assert.doesNotThrow(() => exigirRegra(ok()))
})

test('exigirRegra() lança ErpDomainError com código, mensagem, status e a regra nos detalhes', () => {
  assert.throws(
    () => exigirRegra(recusa('VD-22', 'Limite excedido.', { codigo: 'CREDIT_LIMIT_EXCEEDED', status: 409, detalhes: { excedente: 10 } })),
    (error: unknown) => {
      assert.ok(error instanceof ErpDomainError)
      assert.equal(error.code, 'CREDIT_LIMIT_EXCEEDED')
      assert.equal(error.message, 'Limite excedido.')
      assert.equal(error.status, 409)
      assert.deepEqual(error.details, { regra: 'VD-22', excedente: 10 })
      return true
    },
  )
})
