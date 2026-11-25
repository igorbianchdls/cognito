import { test } from 'node:test'
import assert from 'node:assert/strict'
import { hojeDaEmpresa } from './geral'
import { validarCompetencia } from './notas-servico'

test('NS-15: competência de hoje ou do passado é aceita', () => {
  assert.equal(validarCompetencia({ competencia: '2026-11-24', hoje: '2026-11-24' }).ok, true)
  assert.equal(validarCompetencia({ competencia: '2026-10-31', hoje: '2026-11-24' }).ok, true)
})

test('NS-15: competência futura é recusada com a mensagem da regra', () => {
  const resultado = validarCompetencia({ competencia: '2026-11-25', hoje: '2026-11-24' })
  assert.equal(resultado.ok, false)
  if (!resultado.ok) {
    assert.equal(resultado.regra, 'NS-15')
    assert.equal(resultado.mensagem, 'A competência não pode ser futura.')
    assert.equal(resultado.codigo, 'VALIDATION_ERROR')
  }
})

test('NS-15 + GE-01: às 22h em São Paulo, competência "de amanhã" pelo UTC é recusada', () => {
  const agora = new Date('2026-11-25T01:05:00Z')
  const hoje = hojeDaEmpresa('America/Sao_Paulo', agora)
  assert.equal(validarCompetencia({ competencia: '2026-11-25', hoje }).ok, false)
  assert.equal(validarCompetencia({ competencia: '2026-11-24', hoje }).ok, true)
})
