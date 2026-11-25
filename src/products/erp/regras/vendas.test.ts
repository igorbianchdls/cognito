import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validarEntrega } from './vendas'

test('VD-30: venda confirmada com entrega pendente ou parcial pode ser atendida', () => {
  assert.equal(validarEntrega({ situacao: 'confirmada', entrega: 'pendente' }).ok, true)
  assert.equal(validarEntrega({ situacao: 'confirmada', entrega: 'parcial' }).ok, true)
})

test('VD-30: rascunho, cancelada ou já atendida não pode ser atendida, com uma mensagem só', () => {
  for (const venda of [{ situacao: 'rascunho', entrega: 'pendente' }, { situacao: 'cancelada', entrega: 'pendente' }, { situacao: 'confirmada', entrega: 'atendido' }]) {
    const resultado = validarEntrega(venda)
    assert.equal(resultado.ok, false)
    if (!resultado.ok) {
      assert.equal(resultado.regra, 'VD-30')
      assert.equal(resultado.codigo, 'INVALID_STATE')
      assert.equal(resultado.mensagem, 'Venda precisa estar confirmada e com entrega pendente para atender.')
    }
  }
})
