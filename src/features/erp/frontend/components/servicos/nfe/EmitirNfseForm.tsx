"use client"

import * as React from "react"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

type ItemServico = {
  id: string
  codigoServico: string
  descricao: string
  quantidade: number
  unidade: string
  valorUnitario: number
}

type Endereco = {
  cep: string
  logradouro: string
  numero: string
  complemento: string
  bairro: string
  municipio: string
  uf: string
  pais: string
  ibge: string
}

type Tomador = {
  tipo: 'pf' | 'pj'
  nomeRazao: string
  cpfCnpj: string
  rgIe?: string
  im?: string
  email: string
  telefone: string
  endereco: Endereco
}

type Retencoes = {
  pisBase?: number; pisAliquota?: number; pisValor?: number
  cofinsBase?: number; cofinsAliquota?: number; cofinsValor?: number
  inssBase?: number; inssAliquota?: number; inssValor?: number
  irrfBase?: number; irrfAliquota?: number; irrfValor?: number
  csllBase?: number; csllAliquota?: number; csllValor?: number
}

type Intermediario = { cpfCnpj?: string; razaoSocial?: string; im?: string }
type Obra = { cno?: string; codigoObra?: string; art?: string }

export default function EmitirNfseForm() {
  const [rps, setRps] = React.useState({ data: '', tipo: 'RPS', serie: '', numero: '' })
  const [naturezaOp, setNaturezaOp] = React.useState('1')
  const [regimeEspecial, setRegimeEspecial] = React.useState('normal')
  const [optanteSimples, setOptanteSimples] = React.useState<'sim'|'nao'>('nao')
  const [issRetido, setIssRetido] = React.useState<'sim'|'nao'>('nao')
  const [municipioIncidencia, setMunicipioIncidencia] = React.useState('')
  const [codigoServico, setCodigoServico] = React.useState('')
  const [cnae, setCnae] = React.useState('')
  const [discriminacao, setDiscriminacao] = React.useState('')

  const [tomador, setTomador] = React.useState<Tomador>({
    tipo: 'pf', nomeRazao: '', cpfCnpj: '', rgIe: '', email: '', telefone: '',
    endereco: { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', municipio: '', uf: '', pais: 'Brasil', ibge: '' }
  })

  const [itens, setItens] = React.useState<ItemServico[]>([
    { id: String(Date.now()), codigoServico: '', descricao: '', quantidade: 1, unidade: 'un', valorUnitario: 0 }
  ])

  const [valores, setValores] = React.useState({
    deducoes: 0,
    descontoIncond: 0,
    descontoCond: 0,
    aliquotaIss: 0,
    outrasRetencoes: 0,
  })

  const [retencoes, setRetencoes] = React.useState<Retencoes>({})
  const [intermediario, setIntermediario] = React.useState<Intermediario>({})
  const [obra, setObra] = React.useState<Obra>({})
  const [obsFisco, setObsFisco] = React.useState('')
  const [obsTomador, setObsTomador] = React.useState('')

  const valorServicos = React.useMemo(() => itens.reduce((acc, it) => acc + (Number(it.quantidade) * Number(it.valorUnitario)), 0), [itens])
  const baseCalculo = React.useMemo(() => Math.max(0, valorServicos - (valores.deducoes || 0) - (valores.descontoIncond || 0)), [valorServicos, valores])
  const valorIss = React.useMemo(() => Number(((baseCalculo * (valores.aliquotaIss || 0)) / 100).toFixed(2)), [baseCalculo, valores.aliquotaIss])
  const totalRetencoes = React.useMemo(() => {
    const v = [
      retencoes.inssValor ?? 0,
      retencoes.irrfValor ?? 0,
      retencoes.csllValor ?? 0,
      retencoes.pisValor ?? 0,
      retencoes.cofinsValor ?? 0,
    ].reduce((acc: number, n: number) => acc + n, 0)
    return v + Number(valores.outrasRetencoes || 0)
  }, [retencoes.inssValor, retencoes.irrfValor, retencoes.csllValor, retencoes.pisValor, retencoes.cofinsValor, valores.outrasRetencoes])
  const valorLiquido = React.useMemo(() => {
    return Number((valorServicos - (valores.descontoIncond || 0) - (valores.descontoCond || 0) - (valores.deducoes || 0) - totalRetencoes - (issRetido === 'sim' ? valorIss : 0)).toFixed(2))
  }, [valorServicos, valores, totalRetencoes, valorIss, issRetido])

  const addItem = () => setItens((prev) => [...prev, { id: String(Date.now()), codigoServico: '', descricao: '', quantidade: 1, unidade: 'un', valorUnitario: 0 }])
  const updateItem = (idx: number, patch: Partial<ItemServico>) => setItens((prev) => prev.map((it, i) => i === idx ? { ...it, ...patch } : it))
  const removeItem = (idx: number) => setItens((prev) => prev.filter((_, i) => i !== idx))

  const fmtBRL = (n: number) => (Number(n || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="space-y-4">
      {/* Dados do RPS */}
      <Card className="p-4 mx-4">
        <div className="text-base font-semibold text-slate-800 mb-3">Dados da Nota Fiscal</div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-2">
            <Label>Data do RPS</Label>
            <Input type="date" value={rps.data} onChange={(e) => setRps({ ...rps, data: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Tipo do RPS</Label>
            <Select value={rps.tipo} onValueChange={(v) => setRps({ ...rps, tipo: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="RPS">RPS</SelectItem>
                <SelectItem value="RPS-M">RPS-M</SelectItem>
                <SelectItem value="Cupom">Cupom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>Série</Label>
            <Input value={rps.serie} onChange={(e) => setRps({ ...rps, serie: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Número</Label>
            <Input inputMode="numeric" value={rps.numero} onChange={(e) => setRps({ ...rps, numero: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Natureza da Operação</Label>
            <Select value={naturezaOp} onValueChange={setNaturezaOp}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Tributação no município</SelectItem>
                <SelectItem value="2">Tributação fora do município</SelectItem>
                <SelectItem value="3">Isenção</SelectItem>
                <SelectItem value="4">Imune</SelectItem>
                <SelectItem value="5">Exigibilidade suspensa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>Regime Especial</Label>
            <Select value={regimeEspecial} onValueChange={setRegimeEspecial}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="simples">Simples Nacional</SelectItem>
                <SelectItem value="mei">MEI</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>Optante Simples</Label>
            <Select value={optanteSimples} onValueChange={(v: 'sim'|'nao') => setOptanteSimples(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="sim">Sim</SelectItem>
                <SelectItem value="nao">Não</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Label>ISS Retido</Label>
            <Select value={issRetido} onValueChange={(v: 'sim'|'nao') => setIssRetido(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="nao">Não</SelectItem>
                <SelectItem value="sim">Sim</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-3">
            <Label>Município de Incidência (cód. IBGE)</Label>
            <Input inputMode="numeric" value={municipioIncidencia} onChange={(e) => setMunicipioIncidencia(e.target.value)} />
          </div>
          <div className="md:col-span-3">
            <Label>Código de Serviço (LC 116/Município)</Label>
            <Input value={codigoServico} onChange={(e) => setCodigoServico(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label>CNAE</Label>
            <Input value={cnae} onChange={(e) => setCnae(e.target.value)} />
          </div>
          <div className="md:col-span-12">
            <Label>Discriminação do serviço</Label>
            <Textarea value={discriminacao} onChange={(e) => setDiscriminacao(e.target.value)} placeholder="Descreva o serviço prestado" />
          </div>
        </div>
      </Card>

      {/* Tomador */}
      <Card className="p-4 mx-4">
        <div className="text-base font-semibold text-slate-800 mb-3">Dados do Tomador</div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-2">
            <Label>Tipo</Label>
            <Select value={tomador.tipo} onValueChange={(v: 'pf'|'pj') => setTomador(prev => ({ ...prev, tipo: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pf">Pessoa Física</SelectItem>
                <SelectItem value="pj">Pessoa Jurídica</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-4">
            <Label>{tomador.tipo === 'pf' ? 'Nome*' : 'Razão Social*'}</Label>
            <Input value={tomador.nomeRazao} onChange={(e) => setTomador(prev => ({ ...prev, nomeRazao: e.target.value }))} />
          </div>
          <div className="md:col-span-3">
            <Label>{tomador.tipo === 'pf' ? 'CPF*' : 'CNPJ*'}</Label>
            <Input value={tomador.cpfCnpj} onChange={(e) => setTomador(prev => ({ ...prev, cpfCnpj: e.target.value }))} placeholder={tomador.tipo === 'pf' ? '000.000.000-00' : '00.000.000/0000-00'} />
          </div>
          <div className="md:col-span-3">
            <Label>{tomador.tipo === 'pf' ? 'RG' : 'IE/IM'}</Label>
            <Input value={tomador.rgIe || ''} onChange={(e) => setTomador(prev => ({ ...prev, rgIe: e.target.value }))} />
          </div>
          <div className="md:col-span-3">
            <Label>Telefone</Label>
            <Input value={tomador.telefone} onChange={(e) => setTomador(prev => ({ ...prev, telefone: e.target.value }))} placeholder="(00) 00000-0000" />
          </div>
          <div className="md:col-span-5">
            <Label>Email</Label>
            <Input type="email" value={tomador.email} onChange={(e) => setTomador(prev => ({ ...prev, email: e.target.value }))} />
          </div>

          {/* Endereço */}
          <div className="md:col-span-2">
            <Label>CEP</Label>
            <Input value={tomador.endereco.cep} onChange={(e) => setTomador(prev => ({ ...prev, endereco: { ...prev.endereco, cep: e.target.value } }))} />
          </div>
          <div className="md:col-span-6">
            <Label>Endereço</Label>
            <Input value={tomador.endereco.logradouro} onChange={(e) => setTomador(prev => ({ ...prev, endereco: { ...prev.endereco, logradouro: e.target.value } }))} />
          </div>
          <div className="md:col-span-2">
            <Label>Número</Label>
            <Input value={tomador.endereco.numero} onChange={(e) => setTomador(prev => ({ ...prev, endereco: { ...prev.endereco, numero: e.target.value } }))} />
          </div>
          <div className="md:col-span-2">
            <Label>Complemento</Label>
            <Input value={tomador.endereco.complemento} onChange={(e) => setTomador(prev => ({ ...prev, endereco: { ...prev.endereco, complemento: e.target.value } }))} />
          </div>
          <div className="md:col-span-3">
            <Label>Bairro</Label>
            <Input value={tomador.endereco.bairro} onChange={(e) => setTomador(prev => ({ ...prev, endereco: { ...prev.endereco, bairro: e.target.value } }))} />
          </div>
          <div className="md:col-span-4">
            <Label>Cidade</Label>
            <Input value={tomador.endereco.municipio} onChange={(e) => setTomador(prev => ({ ...prev, endereco: { ...prev.endereco, municipio: e.target.value } }))} />
          </div>
          <div className="md:col-span-1">
            <Label>UF</Label>
            <Input value={tomador.endereco.uf} onChange={(e) => setTomador(prev => ({ ...prev, endereco: { ...prev.endereco, uf: e.target.value.toUpperCase() } }))} maxLength={2} />
          </div>
          <div className="md:col-span-2">
            <Label>País</Label>
            <Input value={tomador.endereco.pais} onChange={(e) => setTomador(prev => ({ ...prev, endereco: { ...prev.endereco, pais: e.target.value } }))} />
          </div>
          <div className="md:col-span-2">
            <Label>Código IBGE</Label>
            <Input value={tomador.endereco.ibge} onChange={(e) => setTomador(prev => ({ ...prev, endereco: { ...prev.endereco, ibge: e.target.value } }))} />
          </div>
        </div>
      </Card>

      {/* Itens */}
      <Card className="p-4 mx-4">
        <div className="text-base font-semibold text-slate-800 mb-3">Itens do serviço</div>
        <div className="space-y-2">
          {itens.map((it, i) => (
            <div key={it.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              <div className="md:col-span-2">
                <Label>Cód. Serviço</Label>
                <Input value={it.codigoServico} onChange={(e) => updateItem(i, { codigoServico: e.target.value })} />
              </div>
              <div className="md:col-span-5">
                <Label>Descrição</Label>
                <Input value={it.descricao} onChange={(e) => updateItem(i, { descricao: e.target.value })} />
              </div>
              <div className="md:col-span-1">
                <Label>Qtd.</Label>
                <Input inputMode="numeric" value={String(it.quantidade)} onChange={(e) => {
                  const v = Number(e.target.value.replace(/[^0-9.,-]/g, '').replace(',', '.'))
                  if (!isNaN(v)) updateItem(i, { quantidade: v })
                }} />
              </div>
              <div className="md:col-span-1">
                <Label>Unid.</Label>
                <Input value={it.unidade} onChange={(e) => updateItem(i, { unidade: e.target.value })} />
              </div>
              <div className="md:col-span-1">
                <Label>Vlr Unit.</Label>
                <Input value={fmtBRL(it.valorUnitario)} onChange={(e) => {
                  const raw = e.target.value.replace(/\./g, '').replace(/,/g, '.')
                  const v = Number(raw)
                  if (!isNaN(v)) updateItem(i, { valorUnitario: v })
                }} />
              </div>
              <div className="md:col-span-2 text-right text-sm font-medium">Total: R$ {fmtBRL(it.quantidade * it.valorUnitario)}</div>
              <div className="md:col-span-12 text-right">
                <button type="button" onClick={() => removeItem(i)} className="text-xs text-red-600 hover:underline">Remover</button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3"><Button variant="outline" onClick={addItem}>+ Adicionar item</Button></div>
      </Card>

      {/* Totais e ISS */}
      <Card className="p-4 mx-4">
        <div className="text-base font-semibold text-slate-800 mb-3">Totais e ISS</div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-2">
            <Label>Valor dos serviços</Label>
            <Input readOnly className="text-right" value={fmtBRL(valorServicos)} />
          </div>
          <div className="md:col-span-2">
            <Label>Deduções</Label>
            <Input value={fmtBRL(valores.deducoes)} onChange={(e) => setValores(v => ({ ...v, deducoes: Number(e.target.value.replace(/\./g, '').replace(/,/g, '.') || 0) }))} />
          </div>
          <div className="md:col-span-2">
            <Label>Desc. Incond.</Label>
            <Input value={fmtBRL(valores.descontoIncond)} onChange={(e) => setValores(v => ({ ...v, descontoIncond: Number(e.target.value.replace(/\./g, '').replace(/,/g, '.') || 0) }))} />
          </div>
          <div className="md:col-span-2">
            <Label>Desc. Cond.</Label>
            <Input value={fmtBRL(valores.descontoCond)} onChange={(e) => setValores(v => ({ ...v, descontoCond: Number(e.target.value.replace(/\./g, '').replace(/,/g, '.') || 0) }))} />
          </div>
          <div className="md:col-span-2">
            <Label>Alíquota ISS (%)</Label>
            <Input inputMode="numeric" value={String(valores.aliquotaIss)} onChange={(e) => setValores(v => ({ ...v, aliquotaIss: Number(e.target.value.replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0 }))} />
          </div>
          <div className="md:col-span-2">
            <Label>Base de cálculo</Label>
            <Input readOnly className="text-right" value={fmtBRL(baseCalculo)} />
          </div>
          <div className="md:col-span-2">
            <Label>Valor do ISS</Label>
            <Input readOnly className="text-right" value={fmtBRL(valorIss)} />
          </div>
          <div className="md:col-span-2">
            <Label>Outras Retenções</Label>
            <Input value={fmtBRL(valores.outrasRetencoes)} onChange={(e) => setValores(v => ({ ...v, outrasRetencoes: Number(e.target.value.replace(/\./g, '').replace(/,/g, '.') || 0) }))} />
          </div>
          <div className="md:col-span-2">
            <Label>Valor Líquido</Label>
            <Input readOnly className="text-right" value={fmtBRL(valorLiquido)} />
          </div>
        </div>
      </Card>

      {/* Retenções federais */}
      <Card className="p-4 mx-4">
        <div className="text-base font-semibold text-slate-800 mb-3">Tributos/Retenções</div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {([
            ['PIS', 'pis'], ['COFINS', 'cofins'], ['INSS', 'inss'], ['IRRF', 'irrf'], ['CSLL', 'csll']
          ] as const).map(([label, key]) => (
            <React.Fragment key={key}>
              <div className="md:col-span-2"><Label>{label} Base</Label><Input inputMode="numeric" value={String((retencoes as any)[`${key}Base`] || '')} onChange={(e) => setRetencoes(r => ({ ...r, [`${key}Base`]: Number(e.target.value.replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0 }))} /></div>
              <div className="md:col-span-1"><Label>{label} %</Label><Input inputMode="numeric" value={String((retencoes as any)[`${key}Aliquota`] || '')} onChange={(e) => setRetencoes(r => ({ ...r, [`${key}Aliquota`]: Number(e.target.value.replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0 }))} /></div>
              <div className="md:col-span-1"><Label>{label} Valor</Label><Input inputMode="numeric" value={String((retencoes as any)[`${key}Valor`] || '')} onChange={(e) => setRetencoes(r => ({ ...r, [`${key}Valor`]: Number(e.target.value.replace(/[^0-9.,-]/g, '').replace(',', '.')) || 0 }))} /></div>
            </React.Fragment>
          ))}
        </div>
      </Card>

      {/* Intermediário e Obra */}
      <Card className="p-4 mx-4">
        <div className="text-base font-semibold text-slate-800 mb-3">Intermediário (opcional)</div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-3"><Label>CPF/CNPJ</Label><Input value={intermediario.cpfCnpj || ''} onChange={(e) => setIntermediario(i => ({ ...i, cpfCnpj: e.target.value }))} /></div>
          <div className="md:col-span-5"><Label>Razão Social</Label><Input value={intermediario.razaoSocial || ''} onChange={(e) => setIntermediario(i => ({ ...i, razaoSocial: e.target.value }))} /></div>
          <div className="md:col-span-2"><Label>IM</Label><Input value={intermediario.im || ''} onChange={(e) => setIntermediario(i => ({ ...i, im: e.target.value }))} /></div>
        </div>
      </Card>
      <Card className="p-4 mx-4">
        <div className="text-base font-semibold text-slate-800 mb-3">Construção Civil (opcional)</div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-3"><Label>CNO/CEI</Label><Input value={obra.cno || ''} onChange={(e) => setObra(o => ({ ...o, cno: e.target.value }))} /></div>
          <div className="md:col-span-4"><Label>Código da obra</Label><Input value={obra.codigoObra || ''} onChange={(e) => setObra(o => ({ ...o, codigoObra: e.target.value }))} /></div>
          <div className="md:col-span-3"><Label>ART</Label><Input value={obra.art || ''} onChange={(e) => setObra(o => ({ ...o, art: e.target.value }))} /></div>
        </div>
      </Card>

      {/* Observações */}
      <Card className="p-4 mx-4">
        <div className="text-base font-semibold text-slate-800 mb-3">Observações e Anexos</div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-6">
            <Label>Informações ao Fisco</Label>
            <Textarea value={obsFisco} onChange={(e) => setObsFisco(e.target.value)} />
          </div>
          <div className="md:col-span-6">
            <Label>Informações ao Tomador</Label>
            <Textarea value={obsTomador} onChange={(e) => setObsTomador(e.target.value)} />
          </div>
          <div className="md:col-span-12">
            <div className="border-2 border-dashed border-gray-300 bg-white rounded p-6 text-sm text-slate-500">
              Área de anexos (UI) — arraste arquivos aqui.
            </div>
          </div>
        </div>
      </Card>

      {/* Ações */}
      <Card className="p-4 mx-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">Resumo: Serviços R$ {fmtBRL(valorServicos)} • Base R$ {fmtBRL(baseCalculo)} • ISS R$ {fmtBRL(valorIss)} • Líquido R$ {fmtBRL(valorLiquido)}</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => history.back()}>Cancelar</Button>
            <Button variant="secondary" onClick={() => console.log('Salvar rascunho NFSe', { rps, naturezaOp, regimeEspecial, optanteSimples, issRetido, municipioIncidencia, codigoServico, cnae, discriminacao, tomador, itens, valores, retencoes, intermediario, obra, obsFisco, obsTomador })}>Salvar</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => console.log('Emitir NFSe', { rps, naturezaOp, regimeEspecial, optanteSimples, issRetido, municipioIncidencia, codigoServico, cnae, discriminacao, tomador, itens, valores, retencoes, intermediario, obra, obsFisco, obsTomador })}>Emitir agora</Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
