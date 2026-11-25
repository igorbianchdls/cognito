import { test } from 'node:test'
import assert from 'node:assert/strict'
import { avisoTituloParecidoComVenda } from './contas-receber'
import { avisoSaldoNegativo } from './contas-bancarias'

test('CR-03: aviso de título parecido com venda', () => {
  assert.equal(avisoTituloParecidoComVenda({ vendas: [] }), null)
  assert.match(avisoTituloParecidoComVenda({ vendas: [{ numero: 'VEN-2026-0160', total: 180 }] })!, /VEN-2026-0160/)
})

test('CB-10: aviso de saldo negativo', () => {
  assert.equal(avisoSaldoNegativo({ conta: 'Caixa', saldo: 100, valor: 100 }), null)
  const aviso = avisoSaldoNegativo({ conta: 'Caixa', saldo: 100, valor: 150.5 })!
  assert.match(aviso, /Caixa ficará com saldo negativo/)
  assert.match(aviso, /50,50/)
})
