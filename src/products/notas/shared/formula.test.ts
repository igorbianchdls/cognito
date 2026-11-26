import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calcularFormula, validarFormula, type ValorFormula } from './formula'

const props: Record<string, ValorFormula> = { Preço: 12.5, Quantidade: 4, Nome: 'Café', Prazo: new Date(2026, 11, 1), Feito: false, Vazio: null }
const calc = (f: string) => {
  const r = calcularFormula(f, nome => nome in props ? props[nome] : (() => { throw new Error('x') })(), new Date(2026, 10, 26, 15, 30))
  return r.ok ? r.valor : `ERRO: ${r.erro}`
}

test('aritmética e precedência', () => {
  assert.equal(calc('prop("Preço") * prop("Quantidade")'), 50)
  assert.equal(calc('1 + 2 * 3 ^ 2'), 19)
  assert.equal(calc('(1 + 2) * 3'), 9)
  assert.equal(calc('2 ^ 3 ^ 2'), 512)
  assert.equal(calc('-prop("Quantidade") + 10 % 4'), -2)
  assert.equal(calc('round(10 / 3, 2)'), 3.33)
  assert.match(String(calc('1 / 0')), /Divisão por zero/)
})

test('texto, comparação e lógica (em português e em inglês)', () => {
  assert.equal(calc('concat(prop("Nome"), " x", prop("Quantidade"))'), 'Café x4')
  assert.equal(calc('prop("Nome") + "!"'), 'Café!')
  assert.equal(calc('se(prop("Quantidade") > 3 e não prop("Feito"), "Muito", "Pouco")'), 'Muito')
  assert.equal(calc('if(prop("Feito") || empty(prop("Vazio")), "sim", "não")'), 'sim')
  assert.equal(calc('maiusculas(prop("Nome"))'), 'CAFÉ')
  assert.equal(calc('contains("Planejamento", "JAME")'), true)
  assert.equal(calc('"a" == "a" && 2 != 3'), true)
  assert.equal(calc('length(“olá”)'), 3)
})

test('datas: hoje, diferença, somar e comparar', () => {
  assert.equal(calc('dateBetween(prop("Prazo"), today(), "dias")'), 5)
  assert.equal(calc('diferencaDatas(prop("Prazo"), hoje(), "semanas")'), 0)
  assert.equal(calc('prop("Prazo") - today()'), 5)
  assert.equal(calc('if(prop("Prazo") < today(), "Atrasado", "No prazo")'), 'No prazo')
  assert.equal(calc('formatDate(dateAdd(prop("Prazo"), 1, "mês"))'), '1 de jan. de 2027')
  assert.equal(calc('year(prop("Prazo")) + month(prop("Prazo"))'), 2038)
})

test('erros claros', () => {
  assert.match(validarFormula('Preço * 2')!, /prop\("Preço"\)/)
  assert.match(validarFormula('1 +')!, /terminou antes/)
  assert.match(validarFormula('foo(1)') ?? String(calc('foo(1)')), /Função desconhecida/)
  assert.match(validarFormula('"aberto')!, /aspas/)
  assert.match(String(calc('round()')), /round\(\) recebe/)
  assert.equal(validarFormula('if(prop("A") > 1, "x", "y")'), null)
  assert.equal(calc(''), null)
})
