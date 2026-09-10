import { ErpRequestError, parseErpResponse } from './erpProfessionalClient'

type Attempt = { key: string; url: string; body: string; pending?: Promise<unknown>; uncertain: boolean }
/** Uma instancia por formulario/acao. Nunca repete automaticamente uma gravacao. */
export class ErpMutation {
  private attempt?: Attempt
  constructor(private readonly send: typeof fetch = (...args) => fetch(...args), private readonly replaySafe = false) {}

  async submit<T>(url: string, values: unknown, validate?: (body: unknown) => T): Promise<T> {
    const body = JSON.stringify(values)
    if (this.attempt?.uncertain && !this.replaySafe) throw new ErpRequestError('Confira o resultado anterior antes de repetir esta operação.', 'OPERATION_UNCERTAIN', 409, undefined, undefined, 'verify')
    if (this.attempt && (this.attempt.url !== url || this.attempt.body !== body)) {
      if (this.attempt.pending || this.attempt.uncertain) {
        throw new ErpRequestError('Confira o resultado da solicitação anterior antes de alterar ou iniciar outra operação.', 'OPERATION_UNCERTAIN', 409, undefined, undefined, 'verify')
      }
      this.attempt = undefined
    }
    const attempt = this.attempt ||= { key: crypto.randomUUID(), url, body, uncertain: false }
    if (attempt.pending) return attempt.pending as Promise<T>
    const pending = (async () => {
      try {
        let response: Response
        try {
          response = await this.send(url, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'Idempotency-Key': attempt.key }, body: attempt.body })
        } catch {
          attempt.uncertain = true
          throw new ErpRequestError('A conexão foi interrompida. Confira o resultado ou repita esta mesma solicitação.', 'NETWORK_ERROR', 0, undefined, undefined, 'verify')
        }
        const payload = await parseErpResponse<unknown>(response)
        const result = validate ? validate(payload) : payload as T
        this.attempt = undefined
        return result
      } catch (error) {
        attempt.uncertain ||= !(error instanceof ErpRequestError) || error.recovery === 'verify' || error.status >= 500
        throw error
      } finally { attempt.pending = undefined }
    })()
    attempt.pending = pending
    return pending
  }

  /** Somente apos o usuario conferir o resultado de uma resposta incerta. */
  acknowledgeResult() {
    if (this.attempt?.pending) throw new Error('A operação ainda está em andamento.')
    this.attempt = undefined
  }
}
