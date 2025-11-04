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

/**
 * Valida o formato de um e-mail
 * @param email - String com o e-mail
 * @returns true se o formato é válido
 */
export function validateEmail(email: string): boolean {
  if (!email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Valida se um número é positivo
 * @param value - Número ou string numérica
 * @returns true se o número é positivo
 */
export function validatePositiveNumber(value: string | number): boolean {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return !isNaN(num) && num > 0
}

/**
 * Valida se uma data fim é maior ou igual a uma data início
 * @param dateStart - Data de início (string ou Date)
 * @param dateEnd - Data de fim (string ou Date)
 * @returns true se a data fim >= data início, ou se alguma data não foi fornecida
 */
export function validateDateRange(dateStart?: string | Date | null, dateEnd?: string | Date | null): { valid: boolean; message?: string } {
  if (!dateStart || !dateEnd) return { valid: true }

  try {
    const start = typeof dateStart === 'string' ? new Date(dateStart) : dateStart
    const end = typeof dateEnd === 'string' ? new Date(dateEnd) : dateEnd

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { valid: false, message: 'Data inválida' }
    }

    if (end < start) {
      return { valid: false, message: 'Data final deve ser maior ou igual à data inicial' }
    }

    return { valid: true }
  } catch {
    return { valid: false, message: 'Erro ao validar datas' }
  }
}
