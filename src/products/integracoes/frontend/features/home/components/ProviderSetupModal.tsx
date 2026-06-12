'use client'

import { useEffect, useMemo, useState } from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { renderIntegrationLogo } from '@/products/integracoes/shared/iconMaps'
import { getIntegrationProvider } from '@/products/integracoes/shared/providers/providerCatalog'
import { getProviderSetupStage } from '@/products/integracoes/shared/providers/providerSetupStage'
import type { ToolkitDefinition } from '@/products/integracoes/shared/types'

type ProviderSetupModalProps = {
  connector: ToolkitDefinition | null
  open: boolean
  busy?: boolean
  error?: string | null
  onOpenChange: (open: boolean) => void
  onCreate: (params: {
    provider: string
    displayName: string
    selectedResources?: string[]
    syncFrequency?: string
    credentials?: Record<string, unknown>
  }) => Promise<void> | void
}

export default function ProviderSetupModal({
  connector,
  open,
  busy = false,
  error,
  onOpenChange,
  onCreate,
}: ProviderSetupModalProps) {
  const provider = useMemo(() => connector ? getIntegrationProvider(connector.slug) : undefined, [connector])
  const setupStage = useMemo(() => getProviderSetupStage(provider), [provider])
  const [omieAppKey, setOmieAppKey] = useState('')
  const [omieAppSecret, setOmieAppSecret] = useState('')

  useEffect(() => {
    if (!provider || !open) return
    setOmieAppKey('')
    setOmieAppSecret('')
  }, [open, provider])

  if (!connector) return null

  const isOmie = provider?.slug === 'omie'
  const credentialsReady = !isOmie || Boolean(omieAppKey.trim() && omieAppSecret.trim())
  const canCreate = Boolean(provider && setupStage.canCreateConnection && credentialsReady)
  const isOAuth = provider?.authType === 'oauth2'
  const includedResources = provider?.resources.filter((resource) => resource.defaultEnabled) || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[640px] overflow-hidden rounded-[28px] border border-[#E7EAF2] bg-white p-0 shadow-[0_32px_80px_rgba(20,29,48,0.24)]">
        <DialogHeader className="border-b border-[#EEF1F6] px-7 py-6 text-left">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] bg-[#F7F8FC] ring-1 ring-[#E8ECF4]">
              {renderIntegrationLogo(connector.slug, connector.name)}
            </div>
            <div className="min-w-0">
              <div className="inline-flex rounded-full bg-[#EEF4FF] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#2F6FE4]">
                {provider ? `${provider.domain.toUpperCase()} · ${provider.authType} · ${setupStage.label}` : setupStage.label}
              </div>
              <DialogTitle className="mt-3 text-[28px] font-semibold tracking-[-0.04em] text-[#17203A]">
                {connector.name}
              </DialogTitle>
              <DialogDescription className="mt-2 text-[15px] leading-7 text-[#66748D]">
                {isOmie
                  ? 'Informe as credenciais da API para conectar sua conta. As configurações de dados ficam disponíveis depois.'
                  : provider
                    ? 'Conecte sua conta com segurança. O app configura os dados principais automaticamente.'
                  : 'Este item está no catálogo para planejamento; o contrato de conexão será ativado depois.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 px-7 py-6">
          <div className="rounded-[16px] border border-[#E6EAF4] bg-[#FAFBFD] px-4 py-3">
            <div className="text-[13px] font-semibold text-[#24304A]">{setupStage.label}</div>
            <div className="mt-1 text-[12px] leading-5 text-[#66748D]">{setupStage.description}</div>
          </div>

          {provider ? (
            <>
              {isOAuth ? (
                <section className="rounded-[18px] border border-[#E6EAF4] bg-white p-4">
                  <div className="text-[14px] font-semibold text-[#24304A]">Autorização segura</div>
                  <p className="mt-2 text-[13px] leading-6 text-[#66748D]">
                    Você será direcionado para autorizar o acesso. Depois disso, a conexão volta para cá como conectada ou pendente de autenticação.
                  </p>
                </section>
              ) : null}

              {isOmie ? (
                <section>
                  <div className="mb-3 text-[14px] font-semibold text-[#24304A]">Credenciais Omie</div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#7B879B]">App key</span>
                      <input
                        value={omieAppKey}
                        onChange={(event) => setOmieAppKey(event.target.value)}
                        autoComplete="off"
                        className="mt-2 h-11 w-full rounded-[12px] border border-[#E1E6F0] bg-white px-4 text-[14px] font-medium text-[#2A3550] outline-none transition focus:border-[#B3BDED]"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#7B879B]">App secret</span>
                      <input
                        type="password"
                        value={omieAppSecret}
                        onChange={(event) => setOmieAppSecret(event.target.value)}
                        autoComplete="new-password"
                        className="mt-2 h-11 w-full rounded-[12px] border border-[#E1E6F0] bg-white px-4 text-[14px] font-medium text-[#2A3550] outline-none transition focus:border-[#B3BDED]"
                      />
                    </label>
                  </div>
                </section>
              ) : null}

              <section className="rounded-[18px] border border-[#E6EAF4] bg-[#FAFBFD] p-4">
                <div className="text-[14px] font-semibold text-[#24304A]">Dados configurados automaticamente</div>
                <p className="mt-2 text-[13px] leading-6 text-[#66748D]">
                  Vamos sincronizar os dados principais recomendados para este app. Você pode ajustar isso depois em Configurar.
                </p>
                {includedResources.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {includedResources.slice(0, 6).map((resource) => (
                      <span key={resource.slug} className="rounded-full bg-white px-3 py-1 text-[12px] font-medium text-[#526079] ring-1 ring-[#E3E8F2]">
                        {resource.name}
                      </span>
                    ))}
                    {includedResources.length > 6 ? (
                      <span className="rounded-full bg-white px-3 py-1 text-[12px] font-medium text-[#526079] ring-1 ring-[#E3E8F2]">
                        +{includedResources.length - 6}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </section>
            </>
          ) : (
            <div className="rounded-[18px] border border-dashed border-[#D8DEEB] bg-white px-4 py-5 text-[13px] leading-6 text-[#6B7790]">
              A base de ERPs e CRMs já está pronta. Este item será conectado ao backend quando entrar no escopo de provider tipado.
            </div>
          )}

          {error ? <div className="text-[13px] font-medium text-red-600">{error}</div> : null}
        </div>

        <DialogFooter className="border-t border-[#EEF1F6] px-7 py-5 sm:justify-between sm:space-x-0">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-11 items-center justify-center rounded-[14px] border border-[#DCE3F0] bg-white px-5 text-[14px] font-semibold text-[#334155] transition hover:bg-[#F7F8FC]"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!canCreate || busy}
            onClick={() => {
              if (!provider) return
              void onCreate({
                provider: provider.slug,
                displayName: connector.name,
                credentials: isOmie
                  ? {
                      app_key: omieAppKey.trim(),
                      app_secret: omieAppSecret.trim(),
                    }
                  : undefined,
              })
            }}
            className="inline-flex h-11 items-center justify-center rounded-[14px] bg-[#17203A] px-5 text-[14px] font-semibold text-white transition hover:bg-[#0F172C] disabled:opacity-50"
          >
            {busy ? 'Conectando...' : isOAuth ? 'Conectar' : 'Salvar credenciais'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
