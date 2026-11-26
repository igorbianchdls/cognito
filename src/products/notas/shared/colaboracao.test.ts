import { test } from 'node:test'
import assert from 'node:assert/strict'
import * as Y from 'yjs'
import { Sincronizador, transporteEmMemoria } from './colaboracao'

test('duas pessoas editando ao mesmo tempo terminam com o mesmo texto; quem chega depois recebe tudo', () => {
  const rede = new Map()
  const a = new Sincronizador(new Y.Doc(), transporteEmMemoria(rede, 'p'))
  const b = new Sincronizador(new Y.Doc(), transporteEmMemoria(rede, 'p'))
  a.doc.getText('t').insert(0, 'Olá ')
  b.doc.getText('t').insert(0, 'mundo')
  a.doc.getText('t').insert(a.doc.getText('t').length, '!')
  assert.equal(a.doc.getText('t').toString(), b.doc.getText('t').toString())
  assert.match(a.doc.getText('t').toString(), /Olá/); assert.match(a.doc.getText('t').toString(), /mundo/)
  const c = new Sincronizador(new Y.Doc(), transporteEmMemoria(rede, 'p'))
  assert.equal(c.doc.getText('t').toString(), a.doc.getText('t').toString())
  // Canal diferente não recebe.
  const d = new Sincronizador(new Y.Doc(), transporteEmMemoria(rede, 'outra'))
  assert.equal(d.doc.getText('t').toString(), '')
  for (const s of [a, b, c, d]) s.destruir()
})

test('presença e meta chegam aos outros; quem sai some da presença', () => {
  const rede = new Map()
  const a = new Sincronizador(new Y.Doc(), transporteEmMemoria(rede, 'p'))
  const b = new Sincronizador(new Y.Doc(), transporteEmMemoria(rede, 'p'))
  a.awareness.setLocalStateField('user', { name: 'Ana', color: '#f00' })
  assert.equal((b.awareness.getStates().get(a.doc.clientID) as { user: { name: string } }).user.name, 'Ana')
  let titulo = ''
  b.ouvirMeta(m => { titulo = String(m.titulo) })
  a.enviarMeta({ titulo: 'Novo título' })
  assert.equal(titulo, 'Novo título')
  a.destruir()
  assert.equal(b.awareness.getStates().has(a.doc.clientID), false)
  b.destruir()
})

test('documento semeado com o mesmo conteúdo e o mesmo id de cliente não duplica ao juntar', () => {
  const semear = () => { const d = new Y.Doc(); d.clientID = 1; d.getText('t').insert(0, 'conteúdo antigo'); return Y.encodeStateAsUpdate(d) }
  const x = new Y.Doc(), y = new Y.Doc()
  Y.applyUpdate(x, semear()); Y.applyUpdate(y, semear())
  Y.applyUpdate(x, Y.encodeStateAsUpdate(y))
  assert.equal(x.getText('t').toString(), 'conteúdo antigo')
})
