export type ErpRecovery = 'none' | 'same-operation' | 'refresh' | 'verify'
export type ErpErrorBody = {
  error: { code: string; message: string; correlationId?: string; details?: unknown; recovery?: ErpRecovery }
}
export class ErpDomainError extends Error {
  constructor(
    public readonly code: string, message: string, public readonly status = 422,
    public readonly details?: unknown, public readonly recovery: ErpRecovery = 'none',
  ) { super(message); this.name = 'ErpDomainError' }
}
export function normalizeErpError(error: unknown): ErpDomainError {
  const source = error && typeof error === 'object' ? error as { code?: string; message?: string } : {}
  if (source.message?.startsWith('CONFLITO_VERSAO')) return new ErpDomainError('VERSION_CONFLICT', 'Este registro foi alterado. Atualize os dados antes de salvar.', 409, undefined, 'refresh')
  if (error instanceof ErpDomainError) return error
  switch (source.code) {
    case '40001': case '40P01': case '55P03':
      return new ErpDomainError('CONCURRENT_OPERATION', 'Outra operação está em andamento. Tente novamente mantendo a mesma solicitação.', 409, undefined, 'same-operation')
    case '23505':
      return new ErpDomainError('DUPLICATE_OPERATION', 'Já existe um registro ou operação com essa identificação. Confira antes de repetir.', 409, undefined, 'verify')
    case '23503':
      return new ErpDomainError('INVALID_REFERENCE', 'Um registro relacionado não está disponível ou ainda está em uso.', 422)
    case '23514': case '23502': case '22003': case '22P02': case '22007': case '22008':
      if (/periodo.*fechado|período.*fechado|fechamento/i.test(source.message || '')) return new ErpDomainError('PERIOD_CLOSED', 'O período está fechado. Reabra-o antes de alterar esta operação.', 409)
      return new ErpDomainError('BUSINESS_RULE_VIOLATION', 'Os dados não atendem às regras desta operação. Confira valores, vínculos e situação do documento.', 422)
    case '42501':
      return new ErpDomainError('ACCESS_DENIED', 'Você não tem permissão para esta operação.', 403)
    case '57014':
      return new ErpDomainError('OPERATION_TIMEOUT', 'A operação excedeu o tempo de resposta. Confira o resultado antes de repetir.', 503, undefined, 'verify')
    default:
      return new ErpDomainError('ERP_OPERATION_ERROR', 'Não foi possível confirmar o resultado da operação. Confira os dados antes de tentar novamente.', 500, undefined, 'verify')
  }
}

