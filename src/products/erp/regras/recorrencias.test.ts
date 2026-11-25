import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deslocarData, indiceDaOcorrencia, validarCalendario, validarOcorrencia } from './recorrencias'

test('RC-01: deslocarData por dia, semana, mês e ano', () => {
  assert.equal(deslocarData('2026-01-10', 'dia', 3, 2), '2026-01-16')
  assert.equal(deslocarData('2026-01-10', 'semana', 2, 1), '2026-01-24')
  assert.equal(deslocarData('2026-01-10', 'mes', 1, 11), '2026-12-10')
  assert.equal(deslocarData('2026-01-10', 'ano', 1, 2), '2028-01-10')
})

test('RC-01: fim de mês ajusta ao último dia sem perder o dia original', () => {
  assert.equal(deslocarData('2026-01-31', 'mes', 1, 1), '2026-02-28')
  assert.equal(deslocarData('2028-01-31', 'mes', 1, 1), '2028-02-29')
  assert.equal(deslocarData('2026-01-31', 'mes', 1, 2), '2026-03-31')
  assert.equal(deslocarData('2026-03-31', 'mes', 1, 1), '2026-04-30')
  assert.equal(deslocarData('2028-02-29', 'ano', 1, 1), '2029-02-28')
})

test('RC-01: indiceDaOcorrencia acha a ocorrência ou recusa data fora do calendário', () => {
  assert.equal(indiceDaOcorrencia('2026-01-31', '2026-02-28', 'mes', 1), 1)
  assert.equal(indiceDaOcorrencia('2026-01-10', '2026-07-10', 'mes', 3), 2)
  assert.equal(indiceDaOcorrencia('2026-01-10', '2026-04-10', 'mes', 2), null)
  assert.equal(indiceDaOcorrencia('2026-01-10', '2026-02-11', 'mes', 1), null)
  assert.equal(indiceDaOcorrencia('2026-01-10', '2026-01-03', 'dia', 1), null)
  assert.equal(validarCalendario({ inicio: '2026-01-10', competencia: '2026-01-24', frequencia: 'semana', intervalo: 2 }).ok, true)
})

test('RC-02: ocorrência só de recorrência ativa, no período e dentro da quantidade', () => {
  const base = { ativa: true, inicio: '2026-01-10', termino: '2026-12-31', frequencia: 'mes', intervalo: 1, competencia: '2026-05-10' }
  const regra = (r: { ok: boolean }) => (r as { regra?: string }).regra
  assert.equal(validarOcorrencia(base).ok, true)
  assert.equal(regra(validarOcorrencia({ ...base, pausada: true })), 'RC-02')
  assert.equal(regra(validarOcorrencia({ ...base, ativa: false })), 'RC-02')
  assert.equal(regra(validarOcorrencia({ ...base, competencia: '2027-01-10' })), 'RC-02')
  assert.equal(regra(validarOcorrencia({ ...base, competencia: '2026-05-11' })), 'RC-01')
  assert.equal(regra(validarOcorrencia({ ...base, termino: null, quantidadeOcorrencias: 4 })), 'RC-02')
  assert.equal(validarOcorrencia({ ...base, termino: null, quantidadeOcorrencias: 5 }).ok, true)
})
