import { test } from 'node:test'
import assert from 'node:assert/strict'
import { orcamentoEncerrado, situacaoOrcamento, validarAcaoOrcamento, validarOrcamentoVigente, situacaoAposAcaoOrcamento,
  validarCancelamentoVenda, validarQuantidadeDevolucao, validarAbatimentoDevolucao } from './vendas'
import { proximaSituacaoOS } from './ordens-servico'
import { validarAcaoContrato, validarMotivoContrato, validarVigenciaRetomada, situacaoAposAcaoContrato } from './contratos'
import { validarCancelamentoCompra, validarConfirmacaoCompra, validarDevolucaoCompra } from './compras'
import { validarDataMovimento, validarReservaEstoque, validarSaidaEstoque } from './estoque'

const mensagem = (r: { ok: boolean }) => (r as { mensagem?: string }).mensagem
const regra = (r: { ok: boolean }) => (r as { regra?: string }).regra

test('VD-01: situações encerradas e nomes antigos', () => {
  assert.equal(situacaoOrcamento('aprovada'), 'aprovado')
  assert.equal(situacaoOrcamento(null), 'em_andamento')
  for (const s of ['recusado', 'convertido', 'cancelado', 'cancelada']) assert.equal(orcamentoEncerrado(s), true)
  for (const s of ['em_andamento', 'enviada', 'aprovado']) assert.equal(orcamentoEncerrado(s), false)
})

test('VD-01/02/03: ações do orçamento', () => {
  const hoje = '2026-11-24'
  assert.equal(validarAcaoOrcamento({ acao: 'aprovar', situacao: 'enviada', validade: '2026-12-10', hoje }).ok, true)
  assert.equal(regra(validarAcaoOrcamento({ acao: 'recusar', situacao: 'convertido', hoje })), 'VD-01')
  assert.equal(regra(validarAcaoOrcamento({ acao: 'enviar', situacao: 'em_andamento', cancelado: true, hoje })), 'VD-01')
  assert.equal(regra(validarAcaoOrcamento({ acao: 'enviar', situacao: 'em_andamento', validade: '2026-11-23', hoje })), 'VD-02')
  assert.equal(validarAcaoOrcamento({ acao: 'cancelar', situacao: 'em_andamento', validade: '2026-11-23', hoje }).ok, true)
  assert.equal(mensagem(validarAcaoOrcamento({ acao: 'enviar', situacao: 'aprovado', hoje })), 'Orçamento aprovado não pode voltar para enviado.')
  assert.equal(validarOrcamentoVigente({ validade: null, hoje }).ok, true)
  assert.equal(validarOrcamentoVigente({ validade: hoje, hoje }).ok, true)
  assert.equal(situacaoAposAcaoOrcamento('aprovar'), 'aprovado')
})

test('OS-03: transições da OS', () => {
  assert.deepEqual(proximaSituacaoOS('aprovar', 'rascunho'), { ok: true, proxima: 'aprovada' })
  assert.deepEqual(proximaSituacaoOS('iniciar', 'aprovada'), { ok: true, proxima: 'em_execucao' })
  assert.deepEqual(proximaSituacaoOS('concluir', 'em_execucao'), { ok: true, proxima: 'concluida' })
  assert.equal(proximaSituacaoOS('cancelar', 'concluida').ok, false)
  assert.equal(proximaSituacaoOS('iniciar', 'rascunho').ok, false)
  assert.equal(mensagem(proximaSituacaoOS('inexistente', 'rascunho')), 'Ação indisponível para a situação atual.')
})

test('CT-02/03/06: contratos', () => {
  assert.equal(validarAcaoContrato({ acao: 'suspender', situacao: 'ativo' }).ok, true)
  assert.equal(validarAcaoContrato({ acao: 'retomar', situacao: 'pausado' }).ok, true)
  assert.equal(validarAcaoContrato({ acao: 'encerrar', situacao: 'pausado' }).ok, true)
  assert.equal(validarAcaoContrato({ acao: 'retomar', situacao: 'encerrado' }).ok, false)
  assert.equal(validarAcaoContrato({ acao: 'suspender', situacao: 'pausado' }).ok, false)
  assert.equal(situacaoAposAcaoContrato('retomar'), 'ativo')
  assert.equal(validarMotivoContrato('ok').ok, false)
  assert.equal(validarMotivoContrato('Fim da obra').ok, true)
  assert.equal(validarVigenciaRetomada({ proximaGeracao: '2027-07-01', fim: '2027-06-30' }).ok, false)
  assert.equal(validarVigenciaRetomada({ proximaGeracao: '2026-12-01', fim: null }).ok, true)
})

test('VD-41/42/43: cancelar venda', () => {
  assert.equal(validarCancelamentoVenda({}).ok, true)
  assert.equal((validarCancelamentoVenda({ temDevolucao: true }) as { codigo?: string }).codigo, 'SALE_HAS_RETURNS')
  assert.equal((validarCancelamentoVenda({ temEntrega: true }) as { codigo?: string }).codigo, 'SALE_HAS_DELIVERIES')
  assert.equal(mensagem(validarCancelamentoVenda({ temPagamento: true })), 'Venda com pagamento não pode ser cancelada sem estorno.')
})

test('VD-51/53: devolução de venda', () => {
  assert.equal(validarQuantidadeDevolucao({ posicao: 1, quantidade: 1, limite: 1, ehProduto: true }).ok, true)
  assert.equal(mensagem(validarQuantidadeDevolucao({ posicao: 1, quantidade: 2, limite: 1, ehProduto: true })),
    'Item 1: só 1 unidade(s) entregue(s) ainda podem ser devolvidas. Itens não entregues: cancele a venda.')
  assert.equal(validarAbatimentoDevolucao({ emAbertoCentavos: 34900, totalCentavos: 34900 }).ok, true)
  assert.equal(mensagem(validarAbatimentoDevolucao({ emAbertoCentavos: 10000, totalCentavos: 34900 })),
    'A venda tem 100.00 em aberto, menos que a devolução (349.00). Use crédito ou reembolso.')
})

test('CP-10/31/40/41/43: compras', () => {
  assert.equal(validarConfirmacaoCompra({ cancelada: false, temFornecedor: true, total: 10, quantidadeItens: 1, dataValida: true }).ok, true)
  assert.equal(mensagem(validarConfirmacaoCompra({ cancelada: true })), 'Compra cancelada não pode ser confirmada.')
  assert.equal(mensagem(validarConfirmacaoCompra({ total: 0 })), 'Compra precisa ter total maior que zero para ser confirmada.')
  assert.equal(mensagem(validarConfirmacaoCompra({ quantidadeItens: 0 })), 'Compra precisa ter pelo menos um item para ser confirmada.')
  assert.equal(regra(validarCancelamentoCompra({ temPagamento: true })), 'CP-31')
  assert.equal(validarCancelamentoCompra({}).ok, true)
  assert.equal(regra(validarDevolucaoCompra({ jaDevolvida: true })), 'CP-41')
  assert.equal(regra(validarDevolucaoCompra({ situacao: 'confirmada', tipoCompra: 'produto' })), 'CP-40')
  assert.equal(regra(validarDevolucaoCompra({ situacao: 'recebida', tipoCompra: 'servico' })), 'CP-40')
  assert.equal(validarDevolucaoCompra({ situacao: 'recebida', tipoCompra: 'produto' }).ok, true)
  assert.equal(regra(validarDevolucaoCompra({ temCreditosOuRenegociacoes: true })), 'CP-43')
})

test('ES-03/04/10: estoque', () => {
  assert.equal(validarDataMovimento({ data: '2026-11-24', hoje: '2026-11-24' }).ok, true)
  assert.equal(mensagem(validarDataMovimento({ data: '2026-11-23', hoje: '2026-11-24', operacao: 'contagem' })), 'A contagem deve ser registrada no dia atual.')
  assert.equal(validarSaidaEstoque({ produto: 'Dock', fisicoAtual: 19, fisicoDepois: 17, reservado: 2 }).ok, true)
  assert.equal(mensagem(validarSaidaEstoque({ produto: 'Dock', fisicoAtual: 19, fisicoDepois: 1, reservado: 2 })),
    'Saldo insuficiente para Dock. Disponível para saída: 17. Saldo físico: 19; reservado: 2.')
  assert.equal(validarSaidaEstoque({ produto: 'Dock', fisicoAtual: 0, fisicoDepois: -5, reservado: 0, permiteNegativo: true }).ok, true)
  assert.equal(validarReservaEstoque({ produto: 'Dock', disponivel: 17, quantidade: 17 }).ok, true)
  assert.equal(mensagem(validarReservaEstoque({ produto: 'Dock', disponivel: 17, quantidade: 500 })), 'Estoque disponível insuficiente para Dock. Disponível: 17.')
})
