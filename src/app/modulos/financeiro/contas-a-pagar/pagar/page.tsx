"use client"

import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import NexusHeader from '@/components/navigation/nexus/NexusHeader'
import NexusPageContainer from '@/components/navigation/nexus/NexusPageContainer'
import PageHeader from '@/components/modulos/PageHeader'
import SettlementSummary from '@/components/modulos/financeiro/shared/SettlementSummary'
import SettlementForm, { type SettlementValues } from '@/components/modulos/financeiro/shared/SettlementForm'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'

function PagarInner() {
  const router = useRouter()
  const sp = useSearchParams()
  const contaId = sp.get('id')

  // Mock
  const launch = {
    fornecedor: 'Fornecedor Exemplo',
    codigoRef: 'AP-001',
    dataCompetencia: '2025-01-05',
    categoria: 'Despesas Gerais',
    centroCusto: 'Administrativo',
    recorrente: false,
  }
  const parcel = {
    vencimento: '2025-01-31',
    numero: '1/3',
    descricao: 'Despesa Teste 1/3',
    valorTotal: 850.5,
  }

  const [values, setValues] = React.useState<SettlementValues>({
    valorParcela: parcel.valorTotal!,
    dataRecebimento: new Date().toISOString().slice(0, 10), // aqui será data do pagamento
    forma: 'boleto',
    conta: 'b1',
    valorRecebido: parcel.valorTotal!, // aqui será valor pago
    juros: 0,
    multa: 0,
    desconto: 0,
    tarifa: 0,
  })

  const formas = [
    { value: 'pix', label: 'PIX' },
    { value: 'boleto', label: 'Boleto Bancário' },
    { value: 'transferencia', label: 'Transferência' },
  ]
  const contas = [
    { value: 'b1', label: 'Conta Banco 1' },
    { value: 'b2', label: 'Conta Banco 2' },
  ]

  return (
    <SidebarProvider>
      <SidebarShadcn borderless headerBorderless />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="flex h-full overflow-hidden bg-gray-100">
          <div className="flex flex-col h-full w-full">
            <NexusHeader viewMode={'dashboard'} onChangeViewMode={() => {}} borderless size="sm" showBreadcrumb={false} />
            <div className="flex-1 min-h-0 pl-2 pr-2 pt-0 pb-2" data-page="nexus">
              <NexusPageContainer className="h-full">
                <div className="mb-3">
                  <PageHeader title="Informar pagamento" />
                </div>

                <div className="space-y-4">
                  <SettlementSummary launch={launch} parcel={parcel} entityLabel="Fornecedor" />
                  <SettlementForm
                    values={values}
                    onChange={(p)=>setValues(v=>({ ...v, ...p }))}
                    formas={formas}
                    contas={contas}
                    title="Informações do pagamento"
                    labelForma="Forma de pagamento *"
                    labelConta="Conta *"
                    labelValor="Valor pago *"
                  />
                </div>

                <div className="sticky bottom-0 left-0 right-0 mt-4 bg-white/80 backdrop-blur border-t border-gray-200">
                  <div className="flex items-center justify-between px-4 py-3">
                    <Link href="/modulos/financeiro?tab=contas-a-pagar" className="inline-flex">
                      <Button variant="outline">Cancelar</Button>
                    </Link>
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline">Outras ações</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Gerar comprovante</DropdownMenuItem>
                          <DropdownMenuItem>Anexar/Visualizar</DropdownMenuItem>
                          <DropdownMenuItem>Estornar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button className="bg-emerald-600 hover:bg-emerald-700">Confirmar pagamento</Button>
                    </div>
                  </div>
                </div>
              </NexusPageContainer>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function PagarPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-gray-500">Carregando…</div>}>
      <PagarInner />
    </Suspense>
  )
}
