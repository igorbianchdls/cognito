import { test } from 'node:test'
import assert from 'node:assert/strict'
import { excessoDeCredito, validarClienteLiberado, validarCredito, validarDescontoVendedor, validarEntrega, validarPrecoTabela } from './vendas'

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


test('VD-21: cliente bloqueado não compra, com o motivo na mensagem', () => {
  assert.equal(validarClienteLiberado({ bloqueado: false }).ok, true)
  const bloqueado = validarClienteLiberado({ bloqueado: true, motivo: 'Inadimplente' })
  assert.equal(!bloqueado.ok && bloqueado.codigo, 'CUSTOMER_BLOCKED')
  assert.equal(!bloqueado.ok && bloqueado.mensagem, 'Cliente bloqueado para vendas: Inadimplente.')
  const semMotivo = validarClienteLiberado({ bloqueado: true, motivo: null })
  assert.equal(!semMotivo.ok && semMotivo.mensagem, 'Cliente bloqueado para vendas: sem motivo informado.')
})

test('VD-22: sem limite cadastrado não há trava; dentro do limite passa', () => {
  assert.equal(validarCredito({ limite: null, emAberto: 1e9, valorVenda: 1e9 }).ok, true)
  assert.equal(validarCredito({ limite: 5000, emAberto: 349, valorVenda: 4651 }).ok, true)
  assert.equal(excessoDeCredito({ limite: 5000, emAberto: 349, valorVenda: 4651 }), null)
})

test('VD-22: acima do limite é recusado com os números (caso de 2026-11-25)', () => {
  const resultado = validarCredito({ limite: 5000, emAberto: 349, valorVenda: 174500 })
  assert.equal(resultado.ok, false)
  if (!resultado.ok) {
    assert.equal(resultado.regra, 'VD-22')
    assert.equal(resultado.codigo, 'CREDIT_LIMIT_EXCEEDED')
    assert.equal(resultado.mensagem, 'Limite de crédito excedido em 169849.00 (limite 5000.00, em aberto 349.00, venda 174500.00). Quem gerencia o financeiro pode liberar informando o motivo.')
    assert.deepEqual(resultado.detalhes, { limite: 5000, em_aberto: 349, venda: 174500, excedente: 169849 })
  }
})

test('VD-23: liberar acima do limite exige motivo e quem gerencia o financeiro', () => {
  const base = { limite: 5000, emAberto: 0, valorVenda: 6000 }
  assert.equal(validarCredito({ ...base, motivoLiberacao: '  ', podeLiberar: true }).ok, false)
  const semPermissao = validarCredito({ ...base, motivoLiberacao: 'Cliente antigo', podeLiberar: false })
  assert.equal(!semPermissao.ok && semPermissao.regra, 'VD-23')
  assert.equal(!semPermissao.ok && semPermissao.status, 403)
  assert.equal(validarCredito({ ...base, motivoLiberacao: 'Cliente antigo', podeLiberar: true }).ok, true)
})

test('VD-15: preço mínimo e desconto máximo da tabela', () => {
  const tabela = { preco: 100, precoMinimo: 80, descontoMaximo: 15 }
  assert.equal(validarPrecoTabela({ posicao: 1, tabela: null, quantidade: 1, bruto: 1, desconto: 1 }).ok, true)
  assert.equal(validarPrecoTabela({ posicao: 1, tabela, quantidade: 2, bruto: 200, desconto: 20 }).ok, true)
  const abaixo = validarPrecoTabela({ posicao: 2, tabela: { ...tabela, descontoMaximo: null }, quantidade: 1, bruto: 100, desconto: 25 })
  assert.equal(!abaixo.ok && abaixo.mensagem, 'Item 2: preço líquido abaixo do mínimo da tabela (80.00).')
  const desconto = validarPrecoTabela({ posicao: 3, tabela: { ...tabela, precoMinimo: null }, quantidade: 1, bruto: 100, desconto: 20 })
  assert.equal(!desconto.ok && desconto.mensagem, 'Item 3: desconto de 20.00% acima do máximo da tabela (15%).')
})

test('VD-16: desconto do vendedor até o máximo dele', () => {
  assert.equal(validarDescontoVendedor({ descontoMaximo: null, bruto: 100, desconto: 99 }).ok, true)
  assert.equal(validarDescontoVendedor({ descontoMaximo: 10, bruto: 100, desconto: 10 }).ok, true)
  const acima = validarDescontoVendedor({ descontoMaximo: 10, bruto: 100, desconto: 10.5 })
  assert.equal(!acima.ok && acima.codigo, 'DISCOUNT_LIMIT_EXCEEDED')
  assert.equal(!acima.ok && acima.mensagem, 'Desconto de 10.50% acima do máximo permitido para você (10.00%).')
})
