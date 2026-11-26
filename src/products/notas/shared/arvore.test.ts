import { test } from 'node:test'
import assert from 'node:assert/strict'
import { caminho, descendentes, montarArvore, moverCriaCiclo, posicaoEntre, textoDoConteudo, tituloExibido, type PaginaResumo } from './arvore'

const p = (id: string, parent_id: string | null, posicao: number, espaco: 'equipe' | 'particular' = 'equipe'): PaginaResumo =>
  ({ id, parent_id, espaco, titulo: id.toUpperCase(), icone: null, posicao })
const paginas = [p('a', null, 2000), p('b', null, 1000), p('a1', 'a', 1000), p('a2', 'a', 500), p('a1x', 'a1', 1000), p('priv', null, 1000, 'particular')]

test('árvore por espaço, ordenada pela posição', () => {
  const arvore = montarArvore(paginas, 'equipe')
  assert.deepEqual(arvore.map(n => n.id), ['b', 'a'])
  assert.deepEqual(arvore[1].filhos.map(n => n.id), ['a2', 'a1'])
  assert.deepEqual(arvore[1].filhos[1].filhos.map(n => n.id), ['a1x'])
  assert.deepEqual(montarArvore(paginas, 'particular').map(n => n.id), ['priv'])
})

test('página cuja mãe sumiu (lixeira) vai para a raiz', () => {
  assert.deepEqual(montarArvore([p('filha', 'sumiu', 1)], 'equipe').map(n => n.id), ['filha'])
})

test('caminho e descendentes', () => {
  assert.deepEqual(caminho(paginas, 'a1x').map(x => x.id), ['a', 'a1', 'a1x'])
  assert.deepEqual(descendentes(paginas, 'a').sort(), ['a', 'a1', 'a1x', 'a2'])
})

test('mover para dentro de si ou de uma descendente cria ciclo', () => {
  assert.equal(moverCriaCiclo(paginas, 'a', 'a1x'), true)
  assert.equal(moverCriaCiclo(paginas, 'a', 'a'), true)
  assert.equal(moverCriaCiclo(paginas, 'a1', 'b'), false)
  assert.equal(moverCriaCiclo(paginas, 'a1', null), false)
})

test('posição entre vizinhas', () => {
  assert.equal(posicaoEntre(null, null), 1000)
  assert.equal(posicaoEntre(1000, 2000), 1500)
  assert.equal(posicaoEntre(null, 1000), 0)
  assert.equal(posicaoEntre(2000, null), 3000)
})

test('texto dos blocos para a busca', () => {
  const blocos = [
    { type: 'heading', content: [{ type: 'text', text: 'Plano de vendas' }], children: [] },
    { type: 'paragraph', content: [{ type: 'text', text: 'Meta de ' }, { type: 'link', content: [{ type: 'text', text: 'dezembro' }] }],
      children: [{ type: 'paragraph', content: [{ type: 'text', text: 'detalhe' }] }] },
    { type: 'image', props: { caption: 'Gráfico' } },
    { type: 'table', content: { type: 'tableContent', rows: [{ cells: [[{ type: 'text', text: 'célula' }]] }] } },
  ]
  assert.equal(textoDoConteudo(blocos), 'Plano de vendas Meta de dezembro detalhe Gráfico célula')
  assert.equal(tituloExibido('  '), 'Sem título')
})
