"use client"

import * as React from 'react'
import Link from 'next/link'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
import NexusHeader from '@/components/navigation/nexus/NexusHeader'
import NexusPageContainer from '@/components/navigation/nexus/NexusPageContainer'
import PageHeader from '@/components/modulos/PageHeader'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'

export default function NovoContratoPage() {
  const [tipoVenda, setTipoVenda] = React.useState<'orcamento' | 'avulsa' | 'recorrente'>('recorrente')
  const [numeroContrato, setNumeroContrato] = React.useState('')
  const [cliente, setCliente] = React.useState('')
  const [dataInicio, setDataInicio] = React.useState('')
  const [diaGeracao, setDiaGeracao] = React.useState('30')
  const [dataPrimeiraVenda, setDataPrimeiraVenda] = React.useState('')

  // Recorrência
  const [repetirCada, setRepetirCada] = React.useState(1)
  const [unidade, setUnidade] = React.useState<'mes' | 'semana'>('mes')
  const [tipoRecorrencia, setTipoRecorrencia] = React.useState<'periodo' | 'indefinido'>('periodo')
  const [dataTermino, setDataTermino] = React.useState('')

  function onSalvar() {
    console.log('Salvar contrato (stub):', { tipoVenda, numeroContrato, cliente, dataInicio, diaGeracao, dataPrimeiraVenda, repetirCada, unidade, tipoRecorrencia, dataTermino })
  }

  const TipoButton = ({ value, children }: { value: 'orcamento' | 'avulsa' | 'recorrente'; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={() => setTipoVenda(value)}
      className={[
        'px-3 py-2 rounded-md text-sm font-medium',
        value === tipoVenda ? 'bg-blue-600 text-white' : 'bg-gray-100 text-slate-700 hover:bg-gray-200',
      ].join(' ')}
    >
      {children}
    </button>
  )

  return (
    <SidebarProvider>
      <SidebarShadcn borderless headerBorderless />
      <SidebarInset className="h-screen overflow-hidden">
        <div className="flex h-full overflow-hidden" style={{ backgroundColor: '#fdfdfd' }}>
          <div className="flex flex-col h-full w-full">
            <NexusHeader viewMode={'dashboard'} onChangeViewMode={() => {}} borderless size="sm" showBreadcrumb={false} />
            <div className="flex-1 min-h-0 pl-2 pr-2 pt-0 pb-2" data-page="nexus">
              <NexusPageContainer className="h-full">
                <div className="mb-3">
                  <PageHeader title="Novo contrato" subtitle="Crie um contrato recorrente para o cliente" />
                </div>

                <div className="space-y-4">
                  {/* Informações */}
                  <Card className="p-4 mx-4">
                    <div className="text-lg font-semibold text-slate-800 mb-3">Informações</div>
                    <div className="mb-3 flex flex-wrap gap-2">
                      <TipoButton value="orcamento">Orçamento</TipoButton>
                      <TipoButton value="avulsa">Venda avulsa</TipoButton>
                      <TipoButton value="recorrente">Venda recorrente (contrato)</TipoButton>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-3">
                        <Label className="text-sm text-slate-600">Número do contrato *</Label>
                        <Input value={numeroContrato} onChange={(e)=>setNumeroContrato(e.target.value)} placeholder="Ex.: 15" />
                      </div>
                      <div className="md:col-span-6">
                        <Label className="text-sm text-slate-600">Cliente *</Label>
                        <Select value={cliente} onValueChange={setCliente}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">Cliente A</SelectItem>
                            <SelectItem value="2">Cliente B</SelectItem>
                          </SelectContent>
                        </Select>
                        <div className="mt-2">
                          <Button size="sm" variant="outline">Visualizar perfil do cliente</Button>
                        </div>
                      </div>
                      <div className="md:col-span-3"></div>

                      <div className="md:col-span-3">
                        <Label className="text-sm text-slate-600">Data de início *</Label>
                        <Input type="date" value={dataInicio} onChange={(e)=>setDataInicio(e.target.value)} />
                      </div>
                      <div className="md:col-span-3">
                        <Label className="text-sm text-slate-600">Dia da geração das vendas *</Label>
                        <Select value={diaGeracao} onValueChange={setDiaGeracao}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30º dia do mês</SelectItem>
                            <SelectItem value="ultimo">Último dia do mês</SelectItem>
                            <SelectItem value="15">15º dia do mês</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-3">
                        <Label className="text-sm text-slate-600">Data da primeira venda *</Label>
                        <Input type="date" value={dataPrimeiraVenda} onChange={(e)=>setDataPrimeiraVenda(e.target.value)} />
                      </div>
                    </div>
                  </Card>

                  {/* Configurações de recorrência */}
                  <Card className="p-4 mx-4">
                    <div className="text-lg font-semibold text-slate-800 mb-3">Configurações de recorrência</div>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-2">
                        <Label className="text-sm text-slate-600">Repetir venda a cada *</Label>
                        <Input inputMode="numeric" value={String(repetirCada)} onChange={(e)=>setRepetirCada(Number(e.target.value.replace(/\D/g,''))||1)} />
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-sm text-slate-600">Unidade *</Label>
                        <Select value={unidade} onValueChange={(v)=>setUnidade(v as any)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mes">Mês/meses</SelectItem>
                            <SelectItem value="semana">Semana/semanas</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-4">
                        <Label className="text-sm text-slate-600">Recorrência *</Label>
                        <Select value={tipoRecorrencia} onValueChange={(v)=>setTipoRecorrencia(v as any)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="periodo">Em um período específico</SelectItem>
                            <SelectItem value="indefinido">Até cancelamento</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-3">
                        <Label className="text-sm text-slate-600">Data de término *</Label>
                        <Input type="date" value={dataTermino} onChange={(e)=>setDataTermino(e.target.value)} disabled={tipoRecorrencia!=='periodo'} />
                      </div>
                      <div className="md:col-span-1 flex items-end">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm text-slate-600">Vigência total</Label>
                          <span className="text-sm text-slate-900">• •</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 left-0 right-0 mt-4 bg-white/80 backdrop-blur border-t border-gray-200">
                  <div className="flex items-center justify-between px-4 py-3">
                    <Link href="/modulos/servicos?tab=contratos" className="inline-flex">
                      <Button variant="outline">Cancelar</Button>
                    </Link>
                    <Button onClick={onSalvar} className="bg-emerald-600 hover:bg-emerald-700">Salvar</Button>
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

