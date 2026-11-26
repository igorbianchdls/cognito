import { test } from 'node:test'
import assert from 'node:assert/strict'
import { gerarCsv, importarCsv, lerCsv } from './csv'
import { validarEsquema, validarValor } from './bases'

test('lerCsv: ponto e vírgula, aspas com separador e quebra de linha dentro', () => {
  const linhas = lerCsv('﻿Nome;Obs\r\nCafé;"tem ; e ""aspas"""\nBolo;"duas\nlinhas"\n\n')
  assert.deepEqual(linhas, [['Nome', 'Obs'], ['Café', 'tem ; e "aspas"'], ['Bolo', 'duas\nlinhas']])
  assert.deepEqual(lerCsv('a,b\n1,2'), [['a', 'b'], ['1', '2']])
})

test('importarCsv adivinha número (R$), data (dd/mm/aaaa), sim/não, seleção, múltipla e texto', () => {
  const csv = [
    ['Produto', 'Preço', 'Validade', 'Ativo', 'Categoria', 'Tags', 'Descrição'],
    ['Café', 'R$ 1.234,50', '01/12/2026', 'sim', 'Bebida', 'quente, manhã', 'Grão arábica torrado na hora'],
    ['Chá', 'R$ 8,00', '15/01/2027', 'não', 'Bebida', 'quente', 'Ervas variadas da serra'],
    ['Bolo', 'R$ 30', '', 'sim', 'Doce', 'tarde', 'Receita da casa com cobertura'],
    ['Suco', 'R$ 9,90', '02/02/2027', 'x', 'Bebida', 'manhã, gelado', 'Laranja espremida no momento'],
  ]
  const { esquema, itens } = importarCsv(csv)
  assert.deepEqual(esquema.map(p => p.tipo), ['numero', 'data', 'checkbox', 'selecao', 'multisselecao', 'texto'])
  assert.equal(esquema[0].formato, 'real')
  assert.ok(validarEsquema(esquema).ok)
  assert.equal(itens[0].titulo, 'Café')
  assert.equal(itens[0].propriedades[esquema[0].id], 1234.5)
  assert.equal(itens[0].propriedades[esquema[1].id], '2026-12-01')
  assert.equal(itens[1].propriedades[esquema[2].id], undefined, 'não marcado não é guardado')
  assert.equal((itens[0].propriedades[esquema[4].id] as string[]).length, 2)
  for (const item of itens) for (const p of esquema) if (item.propriedades[p.id] !== undefined) assert.ok(validarValor(p, item.propriedades[p.id]).ok, `${p.nome}`)
})

test('gerarCsv: cabeçalho, opções pelo nome, número com vírgula e escape', () => {
  const esquema = [{ id: 's', nome: 'Status', tipo: 'selecao' as const, opcoes: [{ id: 'o', nome: 'Feito', cor: 'verde' as const }] }, { id: 'n', nome: 'Valor', tipo: 'numero' as const }]
  const item = { id: '1', titulo: 'Item; com "aspas"', icone: null, posicao: 1, propriedades: { s: 'o', n: 2.5 }, created_at: '', updated_at: '', created_by: '', updated_by: null }
  const csv = gerarCsv([item], esquema, ['s', 'n'])
  assert.equal(csv, '﻿Nome;Status;Valor\r\n"Item; com ""aspas""";Feito;2,5')
  assert.deepEqual(lerCsv(csv)[1], ['Item; com "aspas"', 'Feito', '2,5'])
})
