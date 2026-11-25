// Formato comum das regras de negócio do ERP: toda regra responde "pode" (ok) ou "não pode" (recusa),
// com o código da regra do catálogo (VD-22, CR-12...) e a mensagem para o usuário.
// Regras são funções puras: recebem dados e devolvem Resultado, sem banco e sem lançar erro.
// Quem chama decide o que fazer com a recusa: o servidor lança o erro (server/erpRegras.ts → exigirRegra),
// a tela mostra a mensagem, o chat repassa.

/** Código de regra do catálogo: prefixo da área e número (GE-01, VD-22, CPG-03). */
const CODIGO_REGRA = /^[A-Z]{2,3}-\d{2}$/

export type Recusa = {
  ok: false
  /** Código da regra no catálogo (regras/*.md). */
  regra: string
  /** Mensagem para o usuário, em português. */
  mensagem: string
  /** Código do erro do ERP (ErpDomainError): VALIDATION_ERROR, CREDIT_LIMIT_EXCEEDED... */
  codigo: string
  /** Status HTTP sugerido: 422 regra de dados, 409 situação do registro, 403 permissão. */
  status: number
  /** Valores que ajudam a explicar a recusa (limite, saldo, excedente...). */
  detalhes?: Record<string, unknown>
}

export type Resultado = { ok: true } | Recusa

const OK: Resultado = Object.freeze({ ok: true })

export function ok(): Resultado {
  return OK
}

export function recusa(
  regra: string,
  mensagem: string,
  opcoes: { codigo?: string; status?: number; detalhes?: Record<string, unknown> } = {},
): Recusa {
  if (!CODIGO_REGRA.test(regra)) throw new Error(`Código de regra inválido: ${regra}`)
  if (!mensagem.trim()) throw new Error(`Regra ${regra} sem mensagem`)
  return {
    ok: false,
    regra,
    mensagem,
    codigo: opcoes.codigo ?? 'VALIDATION_ERROR',
    status: opcoes.status ?? 422,
    ...(opcoes.detalhes ? { detalhes: opcoes.detalhes } : {}),
  }
}

/** A primeira recusa entre várias regras, ou ok se todas passarem (na ordem em que foram passadas). */
export function primeiraRecusa(...resultados: Resultado[]): Resultado {
  return resultados.find(resultado => !resultado.ok) ?? OK
}
