import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validarConversaoOrcamento } from './vendas'
import { validarPrevisao } from './contas-receber'

const regra = (r: { ok: boolean }) => (r as { regra?: string }).regra

test('VD-01/VD-02 na conversão de orçamento (antes BD-30 no banco)', () => {
  const hoje = '2026-11-25'
  assert.equal(validarConversaoOrcamento({ situacao: 'aprovado', validade: '2026-12-01', hoje }).ok, true)
  assert.equal(validarConversaoOrcamento({ situacao: 'enviada', validade: null, hoje }).ok, true)
  assert.equal(regra(validarConversaoOrcamento({ situacao: 'convertido', hoje })), 'VD-01')
  assert.equal(regra(validarConversaoOrcamento({ situacao: 'aprovado', cancelado: true, hoje })), 'VD-01')
  assert.equal(regra(validarConversaoOrcamento({ situacao: 'aprovado', validade: '2026-11-24', hoje })), 'VD-02')
})

test('CR-09: o que pode ser previsão (antes BD-31 no banco)', () => {
  assert.equal(validarPrevisao({}).ok, true)
  assert.equal(validarPrevisao({ deVenda: true }).ok, false)
  assert.equal(validarPrevisao({ efetivado: true }).ok, false)
  assert.equal(validarPrevisao({ utilizado: true }).ok, false)
})
