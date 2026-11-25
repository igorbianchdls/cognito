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

test('exigirRegra() pede para atualizar a tela no conflito de versão (GE-30)', () => {
  assert.throws(() => exigirRegra(recusa('GE-30', 'Mudou.', { codigo: 'VERSION_CONFLICT', status: 409 })),
    (error: unknown) => error instanceof ErpDomainError && error.recovery === 'refresh')
  assert.throws(() => exigirRegra(recusa('CR-12', 'Acima do saldo.')),
    (error: unknown) => error instanceof ErpDomainError && error.recovery === 'none')
})

test('mensagemDoBanco(): só mensagens revisadas (terminam em ponto) chegam ao usuário (etapa 10)', async () => {
  const { mensagemDoBanco, normalizeErpError } = await import('../shared/erpErrors')
  assert.equal(mensagemDoBanco('O valor passa do saldo disponível do adiantamento.'), 'O valor passa do saldo disponível do adiantamento.')
  assert.equal(mensagemDoBanco('Empresa diferente da sessão'), null)
  assert.equal(mensagemDoBanco('new row violates check constraint "x".'), null)
  assert.equal(normalizeErpError({ code: '23514', message: 'Pagamento registrado não pode ser alterado; estorne e registre de novo.' }).message,
    'Pagamento registrado não pode ser alterado; estorne e registre de novo.')
  assert.match(normalizeErpError({ code: '23514', message: 'Tabela nao prevista na protecao de periodos: x' }).message, /Os dados não atendem/)
  const periodo = normalizeErpError({ code: 'P0001', message: 'O período de financeiro está fechado na data 2026-10-31. Reabra-o antes de alterar.' })
  assert.equal(periodo.code, 'PERIOD_CLOSED')
  assert.match(periodo.message, /2026-10-31/)
})
