import { test } from 'node:test'
import assert from 'node:assert/strict'
import { FUSO_PADRAO, conferirVersao, fusoDaEmpresa, fusoValido, hojeDaEmpresa, limitesDoMes, somarDias, validarParcelas } from './geral'

// 25/11/2026 01:05 UTC = 24/11/2026 22:05 em São Paulo: o caso do bug de fuso de 2026-11-25.
const NOITE_EM_SAO_PAULO = new Date('2026-11-25T01:05:00Z')

test('GE-01: à noite em São Paulo, "hoje" da empresa ainda é o dia anterior ao UTC', () => {
  assert.equal(hojeDaEmpresa('America/Sao_Paulo', NOITE_EM_SAO_PAULO), '2026-11-24')
  assert.equal(hojeDaEmpresa('UTC', NOITE_EM_SAO_PAULO), '2026-11-25')
})

test('GE-01: sem fuso ou com fuso inválido, usa America/Sao_Paulo', () => {
  assert.equal(hojeDaEmpresa(undefined, NOITE_EM_SAO_PAULO), '2026-11-24')
  assert.equal(hojeDaEmpresa(null, NOITE_EM_SAO_PAULO), '2026-11-24')
  assert.equal(hojeDaEmpresa('Lua/Base', NOITE_EM_SAO_PAULO), '2026-11-24')
  assert.equal(fusoDaEmpresa('Lua/Base'), FUSO_PADRAO)
  assert.equal(fusoDaEmpresa(''), FUSO_PADRAO)
})

test('GE-01: outros fusos', () => {
  assert.equal(hojeDaEmpresa('America/Manaus', new Date('2026-11-25T03:30:00Z')), '2026-11-24')
  assert.equal(hojeDaEmpresa('Asia/Tokyo', new Date('2026-11-24T16:00:00Z')), '2026-11-25')
})

test('fusoValido() aceita IANA e recusa texto qualquer', () => {
  assert.equal(fusoValido('America/Sao_Paulo'), true)
  assert.equal(fusoValido('UTC'), true)
  assert.equal(fusoValido('Lua/Base'), false)
  assert.equal(fusoValido('drop table'), false)
  assert.equal(fusoValido(42), false)
})

test('somarDias() atravessa mês e ano', () => {
  assert.equal(somarDias('2026-11-30', 1), '2026-12-01')
  assert.equal(somarDias('2026-12-31', 1), '2027-01-01')
  assert.equal(somarDias('2026-03-01', -1), '2026-02-28')
})

test('limitesDoMes() com deslocamento e ano bissexto', () => {
  assert.deepEqual(limitesDoMes('2026-11-24'), { inicio: '2026-11-01', fim: '2026-11-30' })
  assert.deepEqual(limitesDoMes('2028-03-10', -1), { inicio: '2028-02-01', fim: '2028-02-29' })
  assert.deepEqual(limitesDoMes('2026-12-05', 1), { inicio: '2027-01-01', fim: '2027-01-31' })
})


test('GE-11: parcelas que somam o total passam (em centavos)', () => {
  assert.equal(validarParcelas({ valores: [150, 150], total: 300, documento: 'do título' }).ok, true)
  assert.equal(validarParcelas({ valores: [0.1, 0.2], total: 0.3, documento: 'da venda' }).ok, true)
  assert.equal(validarParcelas({ valores: [33.33, 33.33, 33.34], total: 100, documento: 'da venda' }).ok, true)
})

test('GE-11: soma diferente do total é recusada, com o documento na mensagem', () => {
  const resultado = validarParcelas({ valores: [150, 149.99], total: 300, documento: 'da compra' })
  assert.equal(resultado.ok, false)
  if (!resultado.ok) {
    assert.equal(resultado.regra, 'GE-11')
    assert.equal(resultado.mensagem, 'A soma das parcelas precisa ser igual ao total da compra.')
    assert.deepEqual(resultado.detalhes, { soma: 299.99, total: 300 })
  }
})

test('GE-12: de 1 a 48 parcelas', () => {
  assert.equal(validarParcelas({ valores: [], total: 0, documento: 'da venda' }).ok, false)
  assert.equal(validarParcelas({ valores: Array(48).fill(1), total: 48, documento: 'da venda' }).ok, true)
  const muitas = validarParcelas({ valores: Array(49).fill(1), total: 49, documento: 'da venda' })
  assert.equal(!muitas.ok && muitas.mensagem, 'A condição de pagamento aceita no máximo 48 parcelas.')
})

test('GE-12: números de parcela válidos e sem repetição', () => {
  assert.equal(validarParcelas({ valores: [1, 1], numeros: [1, 2], total: 2, documento: 'da venda' }).ok, true)
  const repetida = validarParcelas({ valores: [1, 1], numeros: [1, 1], total: 2, documento: 'da venda' })
  assert.equal(!repetida.ok && repetida.mensagem, 'Existem parcelas com o mesmo número.')
  for (const numero of [0, -1, 1.5, 49]) assert.equal(validarParcelas({ valores: [1], numeros: [numero], total: 1, documento: 'da venda' }).ok, false)
})

test('GE-30: mesma versão passa; versão diferente é VERSION_CONFLICT 409', () => {
  assert.equal(conferirVersao({ atual: 3, esperada: 3, documento: 'Esta venda' }).ok, true)
  assert.equal(conferirVersao({ atual: '3' as unknown as number, esperada: 3, documento: 'Esta venda' }).ok, true)
  const resultado = conferirVersao({ atual: 4, esperada: 3, documento: 'Esta venda' })
  assert.equal(resultado.ok, false)
  if (!resultado.ok) {
    assert.equal(resultado.codigo, 'VERSION_CONFLICT')
    assert.equal(resultado.status, 409)
    assert.equal(resultado.mensagem, 'Esta venda mudou desde que você abriu (outra pessoa salvou antes). Atualize antes de continuar.')
  }
})
