import { test } from 'node:test'
import assert from 'node:assert/strict'
import { incorporacao, incorporarArquivo } from './incorporar'

test('links conhecidos viram quadro; o resto vira cartão; lixo é recusado', () => {
  assert.deepEqual(incorporacao('https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10'), { tipo: 'quadro', servico: 'YouTube', src: 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ', proporcao: 16 / 9 })
  assert.equal((incorporacao('youtu.be/dQw4w9WgXcQ') as { src: string }).src, 'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ')
  assert.equal((incorporacao('https://youtube.com/shorts/abcdEFG123') as { src: string }).src, 'https://www.youtube-nocookie.com/embed/abcdEFG123')
  assert.equal((incorporacao('https://vimeo.com/76979871') as { src: string }).src, 'https://player.vimeo.com/video/76979871')
  assert.match((incorporacao('https://www.figma.com/design/AbC123/Tela') as { src: string }).src, /^https:\/\/www\.figma\.com\/embed\?embed_host=otto&url=/)
  assert.match((incorporacao('https://www.google.com/maps/place/Avenida+Paulista') as { src: string }).src, /q=Avenida%20Paulista&output=embed/)
  assert.equal((incorporacao('https://site.com/manual.pdf') as { servico: string }).servico, 'PDF')
  assert.deepEqual(incorporacao('https://exemplo.com.br/artigo'), { tipo: 'link', url: 'https://exemplo.com.br/artigo' })
  assert.equal(incorporacao('javascript:alert(1)'), null)
  assert.equal(incorporacao(''), null)
  assert.equal(incorporarArquivo('/api/notas/arquivos/org/x/manual.pdf')?.tipo, 'quadro')
})
