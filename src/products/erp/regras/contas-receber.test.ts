import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validarBaixa } from './contas-receber'

const base = { situacao: 'aberto', tipoLancamento: 'efetivo', saldo: 698, valor: 698 }

test('CR-12: baixa integral e parcial dentro do saldo passam', () => {
  assert.equal(validarBaixa(base).ok, true)
  assert.equal(validarBaixa({ ...base, valor: 100 }).ok, true)
  assert.equal(validarBaixa({ ...base, situacao: 'parcial', saldo: 0.01, valor: 0.01 }).ok, true)
})

test('CR-12: valor acima do saldo é recusado com valor e saldo na mensagem (caso de 2026-11-24)', () => {
  const resultado = validarBaixa({ ...base, valor: 9999 })
  assert.equal(resultado.ok, false)
  if (!resultado.ok) {
    assert.equal(resultado.regra, 'CR-12')
    assert.equal(resultado.mensagem, 'O valor (R$ 9999.00) passa do saldo em aberto da parcela (R$ 698.00).')
    assert.deepEqual(resultado.detalhes, { valor: 9999, saldo: 698 })
  }
})

test('CR-12: compara em centavos (sem erro de arredondamento)', () => {
  assert.equal(validarBaixa({ ...base, saldo: 0.3, valor: 0.1 + 0.2 }).ok, true)
  assert.equal(validarBaixa({ ...base, saldo: 10.1, valor: 10.11 }).ok, false)
})

test('CR-12: valor zero ou negativo é recusado', () => {
  for (const valor of [0, -5, 0.001]) {
    const resultado = validarBaixa({ ...base, valor })
    assert.equal(resultado.ok, false)
    if (!resultado.ok) assert.equal(resultado.mensagem, 'O valor da baixa deve ser maior que zero.')
  }
})

test('CR-11: parcela cancelada ou paga não aceita baixa', () => {
  const cancelada = validarBaixa({ ...base, situacao: 'cancelado' })
  const paga = validarBaixa({ ...base, situacao: 'pago', saldo: 0 })
  assert.equal(!cancelada.ok && cancelada.mensagem, 'Parcela cancelada não pode ser baixada.')
  assert.equal(!paga.ok && paga.mensagem, 'Parcela já está paga.')
})

test('CR-09: previsão não aceita baixa, a receber e a pagar', () => {
  const resultado = validarBaixa({ ...base, tipoLancamento: 'previsao' })
  assert.equal(!resultado.ok && resultado.regra, 'CR-09')
  assert.equal(!resultado.ok && resultado.mensagem, 'Efetive a previsão antes de registrar a baixa.')
})
