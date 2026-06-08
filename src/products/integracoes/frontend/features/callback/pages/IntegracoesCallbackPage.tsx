'use client'

import { useMemo } from 'react'
import Link from 'next/link'

export default function IntegracoesCallbackPage() {
  const callbackState = useMemo(() => {
    if (typeof window === 'undefined') {
      return { status: '', provider: '', connectionId: '', error: '' }
    }

    const url = new URL(window.location.href)
    return {
      status: (url.searchParams.get('status') || '').toLowerCase(),
      provider: url.searchParams.get('provider') || '',
      connectionId: url.searchParams.get('connectionId') || url.searchParams.get('connection_id') || '',
      error: url.searchParams.get('error') || '',
    }
  }, [])

  const isError = Boolean(callbackState.error) || callbackState.status === 'error'
  const isConnected = callbackState.status === 'connected' || callbackState.status === 'success'

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Integração</h1>
      <div className="space-y-2">
        {callbackState.provider ? (
          <div className="text-sm">
            Provider: <b>{callbackState.provider}</b>
          </div>
        ) : null}
        {callbackState.connectionId ? (
          <div className="text-sm">
            Conexão: <b>{callbackState.connectionId}</b>
          </div>
        ) : null}
        <div className={`text-sm ${isError ? 'text-red-700' : isConnected ? 'text-green-700' : 'text-gray-700'}`}>
          {isError
            ? callbackState.error || 'A autorização falhou.'
            : isConnected
              ? 'Integração conectada com sucesso.'
              : 'Retorno recebido. Verifique o status da conexão em integrações.'}
        </div>
        <div className="pt-4 flex gap-2">
          <Link href="/integracoes" className="px-3 py-1.5 rounded border">
            Voltar
          </Link>
          <Link href="/integracoes" className="px-3 py-1.5 rounded bg-black text-white">
            Ver integrações
          </Link>
        </div>
      </div>
    </div>
  )
}
