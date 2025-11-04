/**
 * Valida o formato de um CNPJ
 * @param cnpj - String com o CNPJ (pode ter ou não máscara)
 * @returns true se o formato é válido
 */
export function validateCNPJFormat(cnpj: string): boolean {
  if (!cnpj) return false

  // Remove caracteres não numéricos
  const cleaned = cnpj.replace(/\D/g, '')

  // CNPJ deve ter exatamente 14 dígitos
  if (cleaned.length !== 14) return false

  // Verifica se não são todos dígitos iguais
  if (/^(\d)\1+$/.test(cleaned)) return false

  return true
}

/**
 * Formata um CNPJ no padrão ##.###.###/####-##
 * @param cnpj - String com o CNPJ (apenas números)
 * @returns CNPJ formatado
 */
export function formatCNPJ(cnpj: string): string {
  if (!cnpj) return ''

  const cleaned = cnpj.replace(/\D/g, '')

  if (cleaned.length !== 14) return cnpj

  return cleaned.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  )
}

/**
 * Valida se um campo obrigatório está preenchido
 * @param value - Valor do campo
 * @returns true se preenchido
 */
export function isRequired(value: string | number | null | undefined): boolean {
  if (value === null || value === undefined) return false
  if (typeof value === 'string' && value.trim() === '') return false
  return true
}
