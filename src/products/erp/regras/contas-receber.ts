// Regras de contas a receber (catálogo: contas-receber.md). Valem igual para contas a pagar (contas-pagar.md):
// a baixa a receber e a baixa a pagar usam a mesma regra. Funções puras.
import { ok, primeiraRecusa, recusa, type Resultado } from './resultado'

const centavos = (valor: number) => Math.round(valor * 100)
const reais = (valor: number) => (centavos(valor) / 100).toFixed(2)

/**
 * CR-09, CR-11, CR-12: uma baixa (recebimento ou pagamento) só vale para parcela efetiva, nem cancelada nem paga,
 * com valor maior que zero e no máximo o saldo em aberto. Baixa parcial é permitida.
 */
export function validarBaixa(dados: {
  /** Situação gravada da parcela (aberto, parcial, pago, cancelado...). */
  situacao: string
  /** previsao ou efetivo, do título. */
  tipoLancamento?: string | null
  /** Saldo em aberto da parcela, em reais. */
  saldo: number
  /** Valor da baixa, em reais. */
  valor: number
}): Resultado {
  if (dados.situacao === 'cancelado') return recusa('CR-11', 'Parcela cancelada não pode ser baixada.')
  if (dados.situacao === 'pago') return recusa('CR-11', 'Parcela já está paga.')
  if (dados.tipoLancamento === 'previsao') return recusa('CR-09', 'Efetive a previsão antes de registrar a baixa.')
  return primeiraRecusa(
    centavos(dados.valor) > 0 ? ok() : recusa('CR-12', 'O valor da baixa deve ser maior que zero.'),
    centavos(dados.valor) <= centavos(dados.saldo) ? ok()
      : recusa('CR-12', `O valor (R$ ${reais(dados.valor)}) passa do saldo em aberto da parcela (R$ ${reais(dados.saldo)}).`,
        { detalhes: { valor: centavos(dados.valor) / 100, saldo: centavos(dados.saldo) / 100 } }),
  )
}
