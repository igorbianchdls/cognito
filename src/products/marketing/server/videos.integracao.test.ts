// Integração dos Vídeos no banco local (scripts/notas/banco-local.sh), com o provedor de demonstração.
// Confere pedido, cota, cancelar, salvar e permissões. Sem NOTAS_TEST_DB_URL, é pulado.
import { after, before, describe, test } from 'node:test'
import assert from 'node:assert/strict'

const url = process.env.NOTAS_TEST_DB_URL
if (url) { process.env.SUPABASE_DB_URL = url; process.env.VIDEO_PROVIDER = 'demo' }
const ana = { userId: 'ana', orgId: 'org_a', origem: 'http://localhost' }
const vic = { userId: 'vic', orgId: 'org_a', origem: 'http://localhost' }
const edu = { userId: 'edu', orgId: 'org_b', origem: 'http://localhost' }
const pedido = { prompt: 'Um café sendo servido em câmera lenta', modelo: 'seedance-1-pro', formato: '16:9', duracao: 5, estilo: 'cinematografico' }

describe('Vídeos no banco (integração)', { skip: url ? false : 'defina NOTAS_TEST_DB_URL' }, () => {
  let v: typeof import('./videos')
  before(async () => { v = await import('./videos') })
  after(async () => { await v.encerrarConexoes() })

  test('gerar, listar, salvar, cancelar e excluir', async () => {
    const video = await v.gerarVideo(ana, pedido)
    assert.equal(video.status, 'gerando'); assert.equal(video.criado_por_mim, true)
    const lista = await v.listarVideos(ana, { aba: 'todos' })
    assert.ok(lista.videos.some(x => x.id === video.id))
    assert.equal(lista.cota.usado_segundos, 5)
    await v.salvarVideo(ana, video.id, true)
    assert.equal((await v.listarVideos(ana, { aba: 'salvos' })).videos.length, 1)
    await v.cancelarVideo(ana, video.id)
    assert.equal((await v.obterVideo(ana, video.id)).status, 'cancelado')
    await v.excluirVideo(ana, video.id)
    assert.ok(!(await v.listarVideos(ana, { aba: 'todos' })).videos.some(x => x.id === video.id))
  })

  test('quem só visualiza não gera; outra empresa não vê; cota do mês é respeitada', async () => {
    await assert.rejects(v.gerarVideo(vic, pedido), (e: { status?: number }) => e.status === 403)
    const video = await v.gerarVideo(ana, pedido)
    await assert.rejects(v.obterVideo(edu, video.id), (e: { status?: number }) => e.status === 404 || e.status === 403)
    // 5 min de cota: 5 s já usados por vídeo; enchendo até o limite, o próximo é recusado.
    let recusado = false
    for (let i = 0; i < 70 && !recusado; i++) {
      try { await v.gerarVideo(ana, { ...pedido, duracao: 10 }) } catch (e) { recusado = (e as { status?: number }).status === 409 }
    }
    assert.ok(recusado, 'a cota deveria acabar')
  })
})
