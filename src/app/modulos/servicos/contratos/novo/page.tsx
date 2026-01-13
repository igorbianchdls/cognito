"use client"

import * as React from 'react'
import Link from 'next/link'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { SidebarShadcn } from '@/components/navigation/SidebarShadcn'
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
  // Classificação / Centro de custo
  const [categoria, setCategoria] = React.useState('')
  const [vendedor, setVendedor] = React.useState('')
  const [centro, setCentro] = React.useState('')
  const [centroPorItem, setCentroPorItem] = React.useState(false)
  // Itens (UI-only)
  type Item = { produto?: string; detalhes?: string; quantidade: number; valorUnit: number; total: number }
  const [itens, setItens] = React.useState<Item[]>([{ quantidade: 1, valorUnit: 0, total: 0 }])
  const setItem = (idx: number, patch: Partial<Item>) => {
    setItens(prev => prev.map((it, i) => {
      if (i !== idx) return it
      const next = { ...it, ...patch }
      const q = Number(next.quantidade || 0)
      const vu = Number(next.valorUnit || 0)
      next.total = Number((q * vu).toFixed(2))
      return next
    }))
  }
  const sumItens = React.useMemo(() => itens.reduce((a, b) => a + Number(b.total || 0), 0), [itens])
  // Descontos
  const [descontoTipo, setDescontoTipo] = React.useState<'valor' | 'percent'>('valor')
  const [desconto, setDesconto] = React.useState(0)
  const descontoValor = React.useMemo(() => descontoTipo === 'valor' ? Number(desconto || 0) : Number(((sumItens * (desconto || 0)) / 100).toFixed(2)), [descontoTipo, desconto, sumItens])
  const totalLiquido = React.useMemo(() => Number((sumItens - descontoValor).toFixed(2)), [sumItens, descontoValor])
  // Pagamento
  const [formaPg, setFormaPg] = React.useState('')
  const [contaRec, setContaRec] = React.useState('')
  const [vencerSempre, setVencerSempre] = React.useState('5')
  const [vencimentoPg, setVencimentoPg] = React.useState('')

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
        <div className="flex h-full overflow-hidden bg-gray-100">
          <div className="flex flex-col h-full w-full">
            
            <div className="flex-1 min-h-0 pl-2 pr-2 pt-2 pb-2" data-page="nexus">
              <NexusPageContainer className="h-full">
                <div className="mb-3">
                  <PageHeader title="Novo contrato" subtitle="Crie um contrato recorrente para o cliente" />
                </div>

                <div className="space-y-4 max-h-[calc(100vh-180px)] overflow-auto pr-2">
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

                  {/* Classificação (inclui Centro de custo) */}
                  <Card className="p-4 mx-4">
                    <div className="text-lg font-semibold text-slate-800 mb-3">Classificação</div>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-6">
                        <Label className="text-sm text-slate-600">Categoria financeira *</Label>
                        <div className="flex items-center gap-2">
                          <Select value={categoria} onValueChange={setCategoria}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cat_jur">1.1.105. ASSESSORIA JURÍDICA</SelectItem>
                              <SelectItem value="cat_mark">1.1.201. MARKETING</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button size="icon" variant="outline" className="h-8 w-8" title="Abrir cadastro">⚡</Button>
                          <Button size="icon" variant="outline" className="h-8 w-8" title="Sincronizar">⟳</Button>
                        </div>
                      </div>
                      <div className="md:col-span-6">
                        <Label className="text-sm text-slate-600">Vendedor responsável</Label>
                        <Select value={vendedor} onValueChange={setVendedor}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="u1">Fulano</SelectItem>
                            <SelectItem value="u2">Ciclano</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="mt-4 text-base font-semibold text-slate-800">Centro de custo</div>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end mt-2">
                      <div className="md:col-span-6">
                        <Label className="text-sm text-slate-600">Centro de custo</Label>
                        <Select value={centro} onValueChange={setCentro} disabled={centroPorItem}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cc1">Receitas Franqueados</SelectItem>
                            <SelectItem value="cc2">Administrativo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-6">
                        <Label className="text-sm text-slate-600">Usar centro de custo por item</Label>
                        <div className="flex items-center gap-3 mt-1">
                          <Switch checked={centroPorItem} onCheckedChange={setCentroPorItem} />
                          <span className="text-sm text-slate-600">(se ativado, cada item definirá o centro)</span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Itens */}
                  <Card className="p-4 mx-4">
                    <div className="text-lg font-semibold text-slate-800 mb-3">Itens</div>
                    {/* Cabeçalho da grade */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 text-sm font-medium text-slate-600 bg-gray-50 rounded px-2 py-2">
                      <div className="md:col-span-4">Produtos/Serviços *</div>
                      <div className="md:col-span-3">Detalhes do item</div>
                      <div className="md:col-span-2">Quantidade *</div>
                      <div className="md:col-span-2">Valor unitário *</div>
                      <div className="md:col-span-1">Total *</div>
                    </div>
                    {/* Primeira linha */}
                    {itens.map((it, idx) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-2 items-center">
                        <div className="md:col-span-4">
                          <Select value={it.produto || ''} onValueChange={(v)=>setItem(idx,{ produto: v })}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um serviço" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="serv1">HONORÁRIOS ADVOCATÍCIOS</SelectItem>
                              <SelectItem value="serv2">ASSISTÊNCIA TÉCNICA</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="md:col-span-3">
                          <Input value={it.detalhes || ''} onChange={(e)=>setItem(idx,{ detalhes: e.target.value })} />
                        </div>
                        <div className="md:col-span-2">
                          <Input inputMode="numeric" value={String(it.quantidade)} onChange={(e)=>setItem(idx,{ quantidade: Number(e.target.value.replace(/\D/g,''))||0 })} />
                        </div>
                        <div className="md:col-span-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">R$</span>
                            <Input value={String(it.valorUnit)} onChange={(e)=>setItem(idx,{ valorUnit: Number(e.target.value.replace(/\./g,'').replace(/,/g,'.'))||0 })} />
                          </div>
                        </div>
                        <div className="md:col-span-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500">R$</span>
                            <Input value={String(it.total)} readOnly />
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Adicionar/selecionar novo item */}
                    <div className="mt-4">
                      <Label className="text-sm text-slate-600">Selecione ou crie um novo item</Label>
                      <Select onValueChange={(v)=>setItens([...itens,{ produto: v, detalhes: '', quantidade:1, valorUnit:0, total:0 }])}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pesquisar/selecionar item" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="serv1">HONORÁRIOS ADVOCATÍCIOS</SelectItem>
                          <SelectItem value="serv2">ASSISTÊNCIA TÉCNICA</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </Card>

                  {/* Valor */}
                  <Card className="p-4 mx-4">
                    <div className="text-lg font-semibold text-slate-800 mb-3">Valor</div>
                    <div className="mb-3">
                      <Label className="text-sm text-slate-600">Desconto</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="inline-flex rounded-md overflow-hidden">
                          <button type="button" onClick={()=>setDescontoTipo('valor')} className={[ 'px-2 py-1 text-sm', descontoTipo==='valor' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-slate-700'].join(' ')}>R$</button>
                          <button type="button" onClick={()=>setDescontoTipo('percent')} className={[ 'px-2 py-1 text-sm', descontoTipo==='percent' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-slate-700'].join(' ')}>%</button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">R$</span>
                          <Input value={String(desconto)} onChange={(e)=>setDesconto(Number(e.target.value.replace(/\./g,'').replace(/,/g,'.'))||0)} />
                        </div>
                      </div>
                    </div>

                    {/* Total da venda */}
                    <div className="border rounded p-3 bg-white">
                      <div className="text-sm font-semibold text-slate-800 mb-1">Total da Venda</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Itens (R$)</span>
                          <span className="text-slate-900 font-semibold">{sumItens.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Descontos e Impostos (R$)</span>
                          <span className="text-red-600 font-semibold">{descontoValor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-500">Total líquido (R$)</span>
                          <span className="text-slate-900 font-semibold">{totalLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  {/* Informações de pagamento */}
                  <Card className="p-4 mx-4">
                    <div className="text-lg font-semibold text-slate-800 mb-3">Informações de pagamento</div>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-3">
                        <Label className="text-sm text-slate-600">Forma de pagamento</Label>
                        <Select value={formaPg} onValueChange={setFormaPg}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="boleto">Boleto</SelectItem>
                            <SelectItem value="pix">PIX</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-3">
                        <Label className="text-sm text-slate-600">Conta de recebimento</Label>
                        <Select value={contaRec} onValueChange={setContaRec}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="b1">Banco 1 - 0001</SelectItem>
                            <SelectItem value="b2">Banco 2 - 0002</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-3">
                        <Label className="text-sm text-slate-600">Vencer sempre no *</Label>
                        <Select value={vencerSempre} onValueChange={setVencerSempre}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5º dia do mês</SelectItem>
                            <SelectItem value="10">10º dia do mês</SelectItem>
                            <SelectItem value="30">30º dia do mês</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="md:col-span-3">
                        <Label className="text-sm text-slate-600">Vencimento *</Label>
                        <Input type="date" value={vencimentoPg} onChange={(e)=>setVencimentoPg(e.target.value)} />
                      </div>
                    </div>
                    <div className="mt-3 border-l-4 border-blue-400 bg-blue-50 text-blue-900 text-sm rounded px-3 py-2">
                      <strong>Quer enviar a cobrança por e-mail junto da fatura?</strong>
                      <div>No fim deste formulário, em <em>Configurações de envio automático</em>, você pode informar se quer enviar e-mail com a fatura, cobrança e NFS-e ao seu cliente.</div>
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
