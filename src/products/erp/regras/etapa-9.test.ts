import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validarConfirmacaoFinanceira, validarOrigemDocumento } from './vendas'
import { validarContaPagarDaCompra } from './compras'
import { validarAjusteComissao, validarProvisaoComissaoAberta } from './contas-pagar'

const codigo = (r: { ok: boolean }) => (r as { codigo?: string }).codigo

test('VD-09: conversões entre documentos', () => {
  assert.equal(validarOrigemDocumento({ tipoOrigem: 'orcamento', tipoNovo: 'venda' }).ok, true)
  assert.equal(validarOrigemDocumento({ tipoOrigem: 'orcamento', tipoNovo: 'pedido' }).ok, true)
  assert.equal(validarOrigemDocumento({ tipoOrigem: 'pedido', tipoNovo: 'venda' }).ok, true)
  assert.equal(validarOrigemDocumento({ tipoOrigem: 'venda', tipoNovo: 'venda' }).ok, false)
  assert.equal(validarOrigemDocumento({ tipoOrigem: 'pedido', tipoNovo: 'orcamento' }).ok, false)
})

test('VD-08: só venda confirma o financeiro', () => {
  assert.equal(validarConfirmacaoFinanceira({ tipoDocumento: 'venda' }).ok, true)
  assert.equal((validarConfirmacaoFinanceira({ tipoDocumento: 'orcamento' }) as { mensagem?: string }).mensagem, 'Converta o orçamento em venda antes de confirmar o financeiro.')
  assert.equal(validarConfirmacaoFinanceira({ tipoDocumento: 'pedido' }).ok, false)
})

test('CP-13: só compra efetiva gera conta a pagar', () => {
  assert.equal(validarContaPagarDaCompra({ tipoMovimento: 'compra' }).ok, true)
  assert.equal(validarContaPagarDaCompra({ tipoMovimento: 'cotacao' }).ok, false)
  assert.equal(validarContaPagarDaCompra({ tipoMovimento: 'pedido_compra' }).ok, false)
})

test('CPG-07: ajuste de comissão', () => {
  assert.equal(validarAjusteComissao({ podeGerenciarFinanceiro: true }).ok, true)
  assert.equal(codigo(validarAjusteComissao({ podeGerenciarFinanceiro: false })), 'COMMISSION_FINANCIAL_PERMISSION')
  assert.equal(validarProvisaoComissaoAberta({ situacaoTitulo: 'vencido' }).ok, true)
  assert.equal(validarProvisaoComissaoAberta({ situacaoTitulo: 'pago' }).ok, false)
  assert.equal(validarProvisaoComissaoAberta({ situacaoTitulo: null }).ok, false)
  assert.equal(validarProvisaoComissaoAberta({ situacaoTitulo: 'aberto', temMovimento: true }).ok, false)
})
