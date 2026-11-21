// Video tools without a database: the timeline operations they add, the conversion to seconds and Portuguese
// fields, file probing and the link checks of video_enviar_arquivo. The database flows are in marketing-db-smoke.ts.
import assert from 'node:assert/strict'
import { cutRange, scaleTime, projectDuration } from '../src/products/editor/frontend/editor/project/ops'
import type { Project } from '../src/products/editor/frontend/editor/project/types'
import { propsToStyle, styleSchema, styleToProps } from '../src/products/mcpcore/domains/editor/server/convert'
import { download, probe } from '../src/products/mcpcore/domains/editor/server/media'
import { PluginError } from '../src/products/mcpcore/shared/contracts'

const project = (): Project => ({ id: 'p', name: 'Teste', format: '9:16', background: '#000', updatedAt: '', tracks: [
  { id: 't1', kind: 'texto', clips: [{ id: 'a', start: 0, duration: 90, trimStart: 0, props: { text: 'Oi' } }, { id: 'b', start: 150, duration: 60, trimStart: 0, props: { text: 'Fim' } }] },
  { id: 't2', kind: 'video', clips: [{ id: 'v', start: 0, duration: 300, trimStart: 30, speed: 2, props: { fileId: 'f' } }] },
  { id: 't3', kind: 'audio', locked: true, clips: [{ id: 'm', start: 0, duration: 300, trimStart: 0, props: { fileId: 'm' } }] },
] })

async function main() {
  // Cutting 2 s–4 s: the text inside loses its tail, later clips move back, the video is split, locked tracks stay.
  const cut = cutRange(project(), 60, 120)
  const [text, video, music] = cut.tracks
  assert.deepEqual(text.clips.map(c => [c.id, c.start, c.duration]), [['a', 0, 60], ['b', 90, 60]])
  assert.equal(video.clips.length, 2)
  assert.deepEqual([video.clips[0].start, video.clips[0].duration, video.clips[0].trimStart], [0, 60, 30])
  assert.deepEqual([video.clips[1].start, video.clips[1].duration, video.clips[1].trimStart], [60, 180, 30 + 120 * 2])
  assert.deepEqual(music.clips[0], project().tracks[2].clips[0])
  // Twice as fast: every clip starts and lasts half, media speed doubles.
  const fast = scaleTime(project(), 2)
  assert.equal(projectDuration(fast), 150); assert.equal(fast.tracks[1].clips[0].speed, 4); assert.equal(fast.tracks[0].clips[1].start, 75)
  console.log('PASS cortar trecho e acelerar o vídeo inteiro')

  const style = styleSchema.parse({ texto: 'Olá', peso: 'negrito', alinhamento: 'centro', posicao: { x: 10, y: 20, largura: 80, altura: 10 }, transicao_entrada: { tipo: 'fade' }, filtro: { predefinido: 'pb', brilho: 1.2 }, volume: 0.5 })
  const textProps = styleToProps(style, 'texto', {})
  assert.deepEqual([textProps.text, textProps.weight, textProps.align, textProps.box, textProps.transIn], ['Olá', 800, 'center', { x: 10, y: 20, w: 80, h: 10 }, { type: 'fade', frames: 9 }])
  assert.equal(textProps.filter, undefined); assert.equal(textProps.volume, undefined)
  const videoProps = styleToProps(style, 'video', {})
  assert.equal(videoProps.text, undefined); assert.equal(videoProps.filter?.grayscale, 1); assert.equal(videoProps.filter?.brightness, 1.2); assert.equal(videoProps.volume, 0.5)
  assert.deepEqual(propsToStyle(textProps).posicao, style.posicao)
  assert.equal(styleToProps(styleSchema.parse({ filtro: { predefinido: 'nenhum' } }), 'video', { filter: videoProps.filter }).filter, undefined)
  assert.throws(() => styleSchema.parse({ cor: 'red; background:url(x)' }))
  console.log('PASS estilos em português viram as propriedades do editor e voltam iguais')

  const png = Buffer.alloc(32); png.writeUInt32BE(0x89504e47, 0); png.writeUInt32BE(1080, 16); png.writeUInt32BE(1350, 20)
  assert.deepEqual(probe(png), { kind: 'image', mime: 'image/png', ext: 'png', duration: null, width: 1080, height: 1350 })
  const wav = Buffer.alloc(44 + 88200); wav.write('RIFF', 0); wav.write('WAVE', 8); wav.writeUInt32LE(44100, 28)
  assert.equal(probe(wav)?.duration, 2)
  assert.equal(probe(Buffer.from('%PDF-1.7 not a video')), null)
  console.log('PASS formato, duração e tamanho lidos do próprio arquivo')

  const never = (async () => { throw new Error('não deveria baixar') }) as unknown as typeof fetch
  for (const link of ['http://example.com/a.mp4', 'https://127.0.0.1/a.mp4', 'https://10.0.0.8/a.mp4', 'https://169.254.169.254/latest', 'https://[::1]/a.mp4', 'https://user:pass@example.com/a.mp4', 'nada']) {
    await assert.rejects(download(link, never), (e: unknown) => e instanceof PluginError && e.code === 'INVALID_INPUT', link)
  }
  // A redirect to an internal address is refused too.
  const redirect = (async () => new Response(null, { status: 302, headers: { location: 'https://192.168.0.1/x' } })) as unknown as typeof fetch
  await assert.rejects(download('https://93.184.215.14/a.mp4', redirect), (e: unknown) => e instanceof PluginError && e.code === 'INVALID_INPUT')
  console.log('PASS links internos, sem https ou com senha são recusados, inclusive por redirecionamento')
  console.log(JSON.stringify({ status: 'passed', checks: 4 }))
}
main().catch(error => { console.error(error); process.exit(1) })
