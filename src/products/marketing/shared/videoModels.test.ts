import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ajustarAoModelo, formatarMinutos, MODELOS_VIDEO, podeMudarSituacao, validarCota, validarPedidoVideo } from './videoModels'

const pedido = { prompt: 'Café sendo servido em câmera lenta', modelo: 'seedance-1-pro', formato: '9:16', duracao: 5, estilo: 'cinematografico', temReferencia: false }

test('pedido válido passa; cada campo fora do catálogo é recusado com mensagem', () => {
  assert.equal(validarPedidoVideo(pedido), null)
  assert.match(validarPedidoVideo({ ...pedido, prompt: ' a ' })!, /Descreva/)
  assert.match(validarPedidoVideo({ ...pedido, prompt: 'x'.repeat(2001) })!, /2000/)
  assert.match(validarPedidoVideo({ ...pedido, modelo: 'inexistente' })!, /modelo/)
  assert.match(validarPedidoVideo({ ...pedido, modelo: 'veo-3', formato: '1:1', duracao: 8 })!, /formato 1:1/)
  assert.match(validarPedidoVideo({ ...pedido, duracao: 7 })!, /5 ou 10 segundos/)
  assert.match(validarPedidoVideo({ ...pedido, estilo: 'x' })!, /estilo/)
  assert.match(validarPedidoVideo({ ...pedido, modelo: 'veo-3', duracao: 8, temReferencia: true })!, /referência/)
})

test('trocar de modelo mantém o que o novo aceita e ajusta o resto', () => {
  assert.deepEqual(ajustarAoModelo('veo-3', '1:1', 5), { formato: '16:9', duracao: 8 })
  assert.deepEqual(ajustarAoModelo('kling-2', '9:16', 10), { formato: '9:16', duracao: 10 })
  for (const modelo of MODELOS_VIDEO) assert.ok(modelo.formatos.length && modelo.duracoes.length, modelo.id)
})

test('cota do mês: o pedido não passa do limite', () => {
  assert.equal(validarCota({ usadoSegundos: 290, limiteMinutos: 5, pedidoSegundos: 10 }), null)
  assert.match(validarCota({ usadoSegundos: 295, limiteMinutos: 5, pedidoSegundos: 10 })!, /restam 0,1 min de 5 min/)
  assert.equal(formatarMinutos(300), '5,0 min')
})

test('situação: só avança de na fila → gerando → pronto/erro/cancelado', () => {
  assert.equal(podeMudarSituacao('na_fila', 'gerando'), true)
  assert.equal(podeMudarSituacao('gerando', 'pronto'), true)
  assert.equal(podeMudarSituacao('pronto', 'gerando'), false)
  assert.equal(podeMudarSituacao('cancelado', 'pronto'), false)
})
