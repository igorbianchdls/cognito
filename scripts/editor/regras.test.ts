// Regras das versões do Editor: poda das automáticas (a mesma do banco) e o resumo do que mudou.
// Uso: npm run editor:regras
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { podar, type Version } from '../../src/products/editor/frontend/editor/project/store'
import { resumoMudancas } from '../../src/products/editor/frontend/editor/versions/util'
import { sampleProjects } from '../../src/products/editor/frontend/editor/project/data'
import { addClip } from '../../src/products/editor/frontend/editor/project/ops'

const agora = new Date('2026-11-28T12:00:00')
const em = (horas: number) => { const d = new Date(agora.getTime() - horas * 3600000); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) }
const v = (id: string, horas: number, tipo: Version['tipo'] = 'auto', nomeada = false): Version => ({ id, at: em(horas), label: id, tipo, nomeada })

test('poda: 24 h inteiras, uma por hora até 7 dias, uma por dia até 90 dias; nomeadas e exportações ficam', () => {
  const lista = [v('a1', 0.1), v('a2', 0.5), v('a3', 3, 'antes'),
    v('h1', 48.1), v('h2', 48.3), v('h3', 48.5),
    v('d1', 240.5), v('d2', 243),
    v('velha', 2400), v('nome', 2400, 'auto', true), v('exp', 2400, 'exportacao', true), v('man', 2400, 'manual', true)]
  assert.deepEqual(podar(lista, agora).map(x => x.id), ['a1', 'a2', 'a3', 'h1', 'd1', 'nome', 'exp', 'man'])
})

test('resumo do que mudou', () => {
  const p = sampleProjects[0]
  assert.equal(resumoMudancas(p, p), 'Igual à versão anterior')
  const r = addClip(p, 'texto', { start: 0, duration: 90, trimStart: 0, props: { text: 'Oi' } }).project
  assert.match(resumoMudancas(p, r), /\+1 texto/)
  assert.match(resumoMudancas(p, { ...p, format: '1:1' }), /9:16 → 1:1/)
})
