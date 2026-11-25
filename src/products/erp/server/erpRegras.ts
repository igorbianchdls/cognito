// Ponte entre as regras puras (src/products/erp/regras) e o servidor: uma recusa vira o erro do ERP,
// com a mensagem da regra, que chega igual à tela e ao chat.
import { ErpDomainError } from '../shared/erpErrors'
import type { Resultado } from '../regras/resultado'

/** Lança o erro do ERP quando a regra recusa; não faz nada quando aprova. */
export function exigirRegra(resultado: Resultado): void {
  if (resultado.ok) return
  throw new ErpDomainError(resultado.codigo, resultado.mensagem, resultado.status, { regra: resultado.regra, ...resultado.detalhes })
}
