// Regras de contas bancárias e transferências (catálogo: contas-bancarias.md). Funções puras.

/** CB-10 (aviso, não bloqueia): a transferência deixa a conta de origem com saldo negativo no ERP. */
export function avisoSaldoNegativo(dados: { conta: string; saldo: number; valor: number }): string | null {
  const depois = Math.round((dados.saldo - dados.valor) * 100) / 100
  if (depois >= 0) return null
  const reais = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  return `A conta ${dados.conta} ficará com saldo negativo no ERP (${reais(depois)}; saldo atual ${reais(dados.saldo)}).`
}
