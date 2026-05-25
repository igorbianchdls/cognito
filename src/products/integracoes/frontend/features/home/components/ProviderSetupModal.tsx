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
    selectedResources: string[]
    syncFrequency: string
  }) => Promise<void> | void
}

const FREQUENCIES = [
  { value: 'manual', label: 'Manual' },
  { value: 'hourly', label: 'A cada hora' },
  { value: 'daily', label: 'Diário' },
]

export default function ProviderSetupModal({
  connector,
  open,
  busy = false,
  error,
  onOpenChange,
  onCreate,
}: ProviderSetupModalProps) {
  const provider = useMemo(() => connector ? getIntegrationProvider(connector.slug) : undefined, [connector])
  const [selectedResources, setSelectedResources] = useState<string[]>([])
  const [syncFrequency, setSyncFrequency] = useState('manual')

  useEffect(() => {
    if (!provider || !open) return
    setSelectedResources(provider.resources.filter((resource) => resource.defaultEnabled).map((resource) => resource.slug))
    setSyncFrequency('manual')
  }, [open, provider])

  if (!connector) return null

  const canCreate = Boolean(provider && selectedResources.length)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[720px] overflow-hidden rounded-[28px] border border-[#E7EAF2] bg-white p-0 shadow-[0_32px_80px_rgba(20,29,48,0.24)]">
        <DialogHeader className="border-b border-[#EEF1F6] px-7 py-6 text-left">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] bg-[#F7F8FC] ring-1 ring-[#E8ECF4]">
              {renderIntegrationLogo(connector.slug, connector.name)}
            </div>
            <div className="min-w-0">
              <div className="inline-flex rounded-full bg-[#EEF4FF] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#2F6FE4]">
                {provider ? `${provider.domain.toUpperCase()} · ${provider.authType}` : 'Conector de dados'}
              </div>
              <DialogTitle className="mt-3 text-[28px] font-semibold tracking-[-0.04em] text-[#17203A]">
                {connector.name}
              </DialogTitle>
              <DialogDescription className="mt-2 text-[15px] leading-7 text-[#66748D]">
                {provider
                  ? 'Configure os recursos e a frequência inicial. A autenticação real será conectada em uma etapa futura.'
                  : 'Este conector ainda está no catálogo visual; o contrato de conexão será adicionado depois.'}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 px-7 py-6">
          {provider ? (
            <>
              <section>
                <div className="mb-3 text-[14px] font-semibold text-[#24304A]">Recursos iniciais</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {provider.resources.map((resource) => {
                    const checked = selectedResources.includes(resource.slug)
                    return (
                      <label
                        key={resource.slug}
                        className={[
                          'flex min-h-[92px] cursor-pointer gap-3 rounded-[16px] border p-4 transition',
                          checked ? 'border-[#9DB4FF] bg-[#F5F8FF]' : 'border-[#E4E8F0] bg-white hover:bg-[#FAFBFD]',
                        ].join(' ')}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(event) => {
                            setSelectedResources((prev) => event.target.checked
                              ? Array.from(new Set([...prev, resource.slug]))
                              : prev.filter((item) => item !== resource.slug))
                          }}
                          className="mt-1 h-4 w-4"
                        />
                        <span className="min-w-0">
                          <span className="block text-[14px] font-semibold text-[#1E2942]">{resource.name}</span>
                          <span className="mt-1 block text-[12px] leading-5 text-[#66748D]">{resource.description}</span>
                        </span>
                      </label>
                    )
                  })}
                </div>
              </section>

              <section>
                <label className="text-[14px] font-semibold text-[#24304A]" htmlFor="integration-sync-frequency">
                  Frequência
                </label>
                <select
                  id="integration-sync-frequency"
                  value={syncFrequency}
                  onChange={(event) => setSyncFrequency(event.target.value)}
                  className="mt-2 h-11 w-full rounded-[12px] border border-[#E1E6F0] bg-white px-4 text-[14px] font-medium text-[#2A3550] outline-none transition focus:border-[#B3BDED]"
                >
                  {FREQUENCIES.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
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
                selectedResources,
                syncFrequency,
              })
            }}
            className="inline-flex h-11 items-center justify-center rounded-[14px] bg-[#17203A] px-5 text-[14px] font-semibold text-white transition hover:bg-[#0F172C] disabled:opacity-50"
          >
            {busy ? 'Salvando...' : 'Salvar conexão'}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
