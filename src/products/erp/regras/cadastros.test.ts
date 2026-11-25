import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validarCondicoesCliente } from './cadastros'

test('CD-04: limite vazio ou ≥ 0 é aceito; negativo ou inválido é recusado', () => {
  for (const limiteCredito of [null, undefined, 0, 5000]) assert.equal(validarCondicoesCliente({ limiteCredito }).ok, true)
  for (const limiteCredito of [-1, NaN, Infinity]) {
    const resultado = validarCondicoesCliente({ limiteCredito })
    assert.equal(!resultado.ok && resultado.mensagem, 'Limite de crédito inválido.')
  }
})

test('CD-04: bloqueio comercial exige motivo', () => {
  assert.equal(validarCondicoesCliente({ bloqueado: true, motivoBloqueio: 'Inadimplente' }).ok, true)
  assert.equal(validarCondicoesCliente({ bloqueado: false }).ok, true)
  for (const motivoBloqueio of [undefined, null, '   ']) {
    const resultado = validarCondicoesCliente({ bloqueado: true, motivoBloqueio })
    assert.equal(!resultado.ok && resultado.mensagem, 'Informe o motivo do bloqueio comercial.')
  }
})
