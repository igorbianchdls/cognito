'use client'

import { useEffect, useMemo, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { renderIntegrationLogo } from '@/products/integracoes/shared/iconMaps'
import { getIntegrationProvider } from '@/products/integracoes/shared/providers/providerCatalog'
import { getProviderSetupStage } from '@/products/integracoes/shared/providers/providerSetupStage'
import type { IntegrationProvider } from '@/products/integracoes/shared/providers/providerTypes'
import type { ToolkitDefinition } from '@/products/integracoes/shared/types'

type ProviderSetupModalProps = {
  connector: ToolkitDefinition | null
  open: boolean
  busy?: boolean
  error?: string | null
  providerOverride?: IntegrationProvider | null
  readinessLoaded?: boolean
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
  providerOverride,
  readinessLoaded = true,
  onOpenChange,
  onCreate,
}: ProviderSetupModalProps) {
  const provider = useMemo(() => providerOverride || (connector ? getIntegrationProvider(connector.slug) : undefined), [connector, providerOverride])
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
  const isOAuth = provider?.authType === 'oauth2'
  const oauthInConfiguration = Boolean(
    provider
    && provider.authType === 'oauth2'
    && provider.supportsOAuthCallback
    && (!readinessLoaded || provider.oauthReadiness?.ready !== true),
  )
  const canCreate = Boolean(provider && setupStage.canCreateConnection && credentialsReady && !oauthInConfiguration)
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
              <Badge variant="secondary" className="uppercase tracking-[0.08em]">
                {provider ? `${provider.domain.toUpperCase()} · ${provider.authType} · ${setupStage.label}` : setupStage.label}
              </Badge>
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
          <Card className="rounded-lg bg-[#FAFBFD] py-0 shadow-none">
            <CardContent className="px-4 py-3">
            <div className="text-[13px] font-semibold text-[#24304A]">{setupStage.label}</div>
            <div className="mt-1 text-[12px] leading-5 text-[#66748D]">{setupStage.description}</div>
            </CardContent>
          </Card>

          {provider ? (
            <>
              {isOAuth ? (
                <Card className="rounded-lg py-0 shadow-none">
                  <CardContent className="p-4">
                  <div className="text-[14px] font-semibold text-[#24304A]">Autorização segura</div>
                  <p className="mt-2 text-[13px] leading-6 text-[#66748D]">
                    {oauthInConfiguration
                      ? provider?.oauthReadiness?.message || 'OAuth em configuração. Este conector ficará disponível em breve.'
                      : 'Você será direcionado para autorizar o acesso. Depois disso, a conexão volta para cá como conectada ou pendente de autenticação.'}
                  </p>
                  </CardContent>
                </Card>
              ) : null}

              {isOmie ? (
                <section>
                  <div className="mb-3 text-[14px] font-semibold text-[#24304A]">Credenciais Omie</div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#7B879B]">App key</span>
                      <Input
                        value={omieAppKey}
                        onChange={(event) => setOmieAppKey(event.target.value)}
                        autoComplete="off"
                        className="mt-2 h-11 border bg-white font-medium"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#7B879B]">App secret</span>
                      <Input
                        type="password"
                        value={omieAppSecret}
                        onChange={(event) => setOmieAppSecret(event.target.value)}
                        autoComplete="new-password"
                        className="mt-2 h-11 border bg-white font-medium"
                      />
                    </label>
                  </div>
                </section>
              ) : null}

              <Card className="rounded-lg bg-[#FAFBFD] py-0 shadow-none">
                <CardContent className="p-4">
                <div className="text-[14px] font-semibold text-[#24304A]">Dados configurados automaticamente</div>
                <p className="mt-2 text-[13px] leading-6 text-[#66748D]">
                  Vamos sincronizar os dados principais recomendados para este app. Você pode ajustar isso depois em Configurar.
                </p>
                {includedResources.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {includedResources.slice(0, 6).map((resource) => (
                      <Badge key={resource.slug} variant="outline" className="bg-white">
                        {resource.name}
                      </Badge>
                    ))}
                    {includedResources.length > 6 ? (
                      <Badge variant="outline" className="bg-white">
                        +{includedResources.length - 6}
                      </Badge>
                    ) : null}
                  </div>
                ) : null}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="rounded-lg border-dashed bg-white py-0 shadow-none">
              <CardContent className="px-4 py-5 text-[13px] leading-6 text-[#6B7790]">
              A base de ERPs e CRMs já está pronta. Este item será conectado ao backend quando entrar no escopo de provider tipado.
              </CardContent>
            </Card>
          )}

          {error ? <div className="text-[13px] font-medium text-red-600">{error}</div> : null}
        </div>

        <DialogFooter className="border-t border-[#EEF1F6] px-7 py-5 sm:justify-between sm:space-x-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-11 bg-white"
          >
            Cancelar
          </Button>
          <Button
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
            className="h-11"
          >
            {oauthInConfiguration ? 'Em configuração' : busy ? 'Conectando...' : isOAuth ? 'Conectar' : 'Salvar credenciais'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
