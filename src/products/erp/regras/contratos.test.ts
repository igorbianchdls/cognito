import { test } from 'node:test'
import assert from 'node:assert/strict'
import { periodosSobrepostos, validarAtivacaoContrato, validarCicloContrato, validarEfetivacaoVersao } from './contratos'

const mensagem = (r: { ok: boolean }) => (r as { mensagem?: string }).mensagem

test('periodosSobrepostos: fim vazio é sem fim', () => {
  assert.equal(periodosSobrepostos({ inicio: '2026-01-01', fim: '2026-06-30' }, { inicio: '2026-07-01' }), false)
  assert.equal(periodosSobrepostos({ inicio: '2026-01-01' }, { inicio: '2027-01-01', fim: '2027-02-01' }), true)
  assert.equal(periodosSobrepostos({ inicio: '2026-01-01', fim: '2026-06-30' }, { inicio: '2026-06-30', fim: null }), true)
})

test('CT-10: versão precisa de item e vigência dentro do contrato', () => {
  const contrato = { inicio: '2026-07-01', fim: '2027-06-30' }
  assert.equal(validarEfetivacaoVersao({ quantidadeItens: 1, versao: { inicio: '2026-12-01', fim: '2027-06-30' }, contrato }).ok, true)
  assert.equal(mensagem(validarEfetivacaoVersao({ quantidadeItens: 0, versao: { inicio: '2026-12-01' }, contrato })), 'A versão precisa de pelo menos um item antes de valer.')
  assert.equal(validarEfetivacaoVersao({ quantidadeItens: 1, versao: { inicio: '2026-06-01', fim: '2027-06-30' }, contrato }).ok, false)
  assert.equal(validarEfetivacaoVersao({ quantidadeItens: 1, versao: { inicio: '2026-12-01', fim: null }, contrato }).ok, false)
  assert.equal(validarEfetivacaoVersao({ quantidadeItens: 1, versao: { inicio: '2026-12-01', fim: null }, contrato: { inicio: '2026-07-01' } }).ok, true)
})

test('CT-11: contrato ativo precisa de versão valendo', () => {
  assert.equal(validarAtivacaoContrato({ temVersaoEfetivada: true }).ok, true)
  assert.equal(validarAtivacaoContrato({ temVersaoEfetivada: false }).ok, false)
})

test('CT-12: ciclo de contrato', () => {
  const base = { contratoAtivo: true, versaoEfetivada: true, periodo: { inicio: '2026-12-01', fim: '2026-12-31' },
    vigencia: { inicio: '2026-07-01', fim: '2027-06-30' }, fimEsperado: '2026-12-31', clienteDaVenda: 217, clienteDoContrato: '217' }
  assert.equal(validarCicloContrato(base).ok, true)
  assert.equal(mensagem(validarCicloContrato({ ...base, contratoAtivo: false })), 'Só contrato ativo gera ciclos.')
  assert.equal(mensagem(validarCicloContrato({ ...base, vigencia: { inicio: '2026-07-01', fim: '2026-12-15' } })), 'O ciclo completo precisa caber na vigência da versão do contrato.')
  assert.equal(mensagem(validarCicloContrato({ ...base, fimEsperado: '2026-12-30' })), 'A duração do ciclo não corresponde à periodicidade do contrato.')
  assert.equal(mensagem(validarCicloContrato({ ...base, clienteDaVenda: 999 })), 'A venda do ciclo precisa ser do cliente do contrato.')
})
