import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ajusteDeColunas, escreverLarguras, lerLarguras, moverDivisao } from './colunas'

const perto = (a: number[], b: number[]) => a.forEach((v, i) => assert.ok(Math.abs(v - b[i]) < 1e-9, `${a} ≠ ${b}`))

test('colunas: proporções guardadas, inválidas viram divisão igual', () => {
  perto(lerLarguras('', 2), [0.5, 0.5])
  perto(lerLarguras('0.6,0.4', 2), [0.6, 0.4])
  perto(lerLarguras('3,1', 2), [0.75, 0.25])
  perto(lerLarguras('0.6,0.4', 3), [1 / 3, 1 / 3, 1 / 3])
  perto(lerLarguras('0.6,abc', 2), [0.5, 0.5])
  assert.equal(escreverLarguras([1 / 3, 2 / 3]), '0.333,0.667')
})

test('colunas: arrastar a divisão troca largura entre as duas vizinhas, com mínimo de 10%', () => {
  perto(moverDivisao([0.5, 0.5], 0, 0.1), [0.6, 0.4])
  perto(moverDivisao([0.5, 0.5], 0, 0.9), [0.9, 0.1])
  perto(moverDivisao([0.5, 0.5], 0, -0.9), [0.1, 0.9])
  perto(moverDivisao([0.3, 0.3, 0.4], 1, 0.1), [0.3, 0.4, 0.3])
  perto(moverDivisao([0.5, 0.5], 1, 0.1), [0.5, 0.5])
})

test('colunas: coluna vazia sai; uma coluna só desfaz as colunas', () => {
  const p = (id: string) => ({ id, type: 'paragraph' })
  const col = (id: string, ...filhos: { id: string; type: string }[]) => ({ id, type: 'coluna', children: filhos })
  assert.equal(ajusteDeColunas([{ id: 'c', type: 'colunas', children: [col('a', p('1')), col('b', p('2'))] }]), null)
  assert.deepEqual(ajusteDeColunas([{ id: 'c', type: 'colunas', props: { larguras: '0.2,0.3,0.5' }, children: [col('a', p('1')), col('b'), col('d', p('3'))] }]),
    { tipo: 'tirar_coluna', colunasId: 'c', colunaId: 'b', larguras: '0.286,0.714' })
  assert.deepEqual(ajusteDeColunas([{ id: 'c', type: 'colunas', children: [col('a', p('1')), col('b')] }]), { tipo: 'desfazer', colunasId: 'c', conteudo: [p('1')] })
  assert.deepEqual(ajusteDeColunas([{ id: 'x', type: 'paragraph', children: [{ id: 'c', type: 'colunas', children: [col('a'), col('b')] }] }]), { tipo: 'desfazer', colunasId: 'c', conteudo: [] })
  // Bloco solto entre as colunas vira coluna nova (e nada se perde).
  assert.deepEqual(ajusteDeColunas([{ id: 'c', type: 'colunas', children: [col('a'), p('esq'), col('b', p('2'))] }]), { tipo: 'envolver', colunasId: 'c', bloco: p('esq') })
})
