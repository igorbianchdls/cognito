'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { ColumnDef } from '@tanstack/react-table'
import { Receipt, CheckCircle2 } from 'lucide-react'
import { useMemo, useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type ItemRow = {
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  [key: string]: unknown;
}

type ContaPagarCriadaOutput = {
  success: boolean;
  // Preview mode
  preview?: boolean;
  payload?: {
    fornecedor_id: string;
    categoria_id?: string;
    centro_custo_id?: string;
    departamento_id?: string;
    filial_id?: string;
    projeto_id?: string;
    natureza_financeira_id?: string;
    tenant_id?: number | string;
    valor: number;
    data_vencimento: string;
    data_emissao?: string;
    numero_nota_fiscal?: string;
    descricao?: string;
    itens?: ItemRow[];
  };
  validations?: Array<{ field: string; status: 'ok' | 'warn' | 'error'; message?: string }>;
  metadata?: { entity?: string; action?: string; commitEndpoint?: string };
  // Created mode
  data: {
    id: string;
    fornecedor_id: string;
    categoria_id: string;
    centro_custo_id: string;
    departamento_id?: string | null;
    filial_id?: string | null;
    projeto_id?: string | null;
    natureza_financeira_id?: string | null;
    valor: number;
    valor_pago: number;
    valor_pendente: number;
    data_vencimento: string;
    data_emissao: string;
    data_cadastro: string;
    numero_nota_fiscal?: string | null;
    descricao?: string;
    status: string;
    itens: ItemRow[];
    quantidade_itens: number;
  };
  message: string;
  title?: string;
  resumo: {
    id: string;
    valor_formatado: string;
    data_vencimento: string;
    status_vencimento: string;
    dias_para_vencimento: number;
    numero_nota_fiscal: string;
    quantidade_itens: number;
  };
  error?: string;
}

type CreatedData = ContaPagarCriadaOutput['data']

export default function ContaPagarCriadaResult({ result }: { result: ContaPagarCriadaOutput }) {
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState<CreatedData | null>(null)
  const isPreview = result.preview && result.payload && !created
  const hasErrors = (result.validations || []).some(v => v.status === 'error')
  // Editable fields in preview
  const [descricao, setDescricao] = useState<string>('')
  const [dataVenc, setDataVenc] = useState<string>('')

  // Dropdown state (fornecedores e categorias)
  const [fornecedorId, setFornecedorId] = useState<string>('')
  const [categoriaId, setCategoriaId] = useState<string>('')
  const [centroCustoId, setCentroCustoId] = useState<string>('')
  const [departamentoId, setDepartamentoId] = useState<string>('')
  const [filialId, setFilialId] = useState<string>('')
  const [projetoId, setProjetoId] = useState<string>('')
  const [fornOptions, setFornOptions] = useState<Array<{ value: string; label: string }>>([])
  const [catOptions, setCatOptions] = useState<Array<{ value: string; label: string }>>([])
  const [ccOptions, setCcOptions] = useState<Array<{ value: string; label: string }>>([])
  const [depOptions, setDepOptions] = useState<Array<{ value: string; label: string }>>([])
  const [filialOptions, setFilialOptions] = useState<Array<{ value: string; label: string }>>([])
  const [projOptions, setProjOptions] = useState<Array<{ value: string; label: string }>>([])
  const [loadingForn, setLoadingForn] = useState(false)
  const [loadingCat, setLoadingCat] = useState(false)
  const [loadingCc, setLoadingCc] = useState(false)
  const [loadingDep, setLoadingDep] = useState(false)
  const [loadingFilial, setLoadingFilial] = useState(false)
  const [loadingProj, setLoadingProj] = useState(false)
  const [errorForn, setErrorForn] = useState<string | null>(null)
  const [errorCat, setErrorCat] = useState<string | null>(null)
  const [errorCc, setErrorCc] = useState<string | null>(null)
  const [errorDep, setErrorDep] = useState<string | null>(null)
  const [errorFilial, setErrorFilial] = useState<string | null>(null)
  const [errorProj, setErrorProj] = useState<string | null>(null)

  // Initialize selected IDs from payload/created/data
  useEffect(() => {
    if (isPreview) {
      setFornecedorId(String(result.payload?.fornecedor_id || ''))
      setCategoriaId(String(result.payload?.categoria_id || ''))
      setCentroCustoId(String(result.payload?.centro_custo_id || ''))
      setDepartamentoId(String(result.payload?.departamento_id || ''))
      setFilialId(String(result.payload?.filial_id || ''))
      setProjetoId(String(result.payload?.projeto_id || ''))
      setDescricao(String(result.payload?.descricao || ''))
      setDataVenc(String(result.payload?.data_vencimento || ''))
    } else if (created) {
      setFornecedorId(String(created.fornecedor_id || ''))
      setCategoriaId(String(created.categoria_id || ''))
      setCentroCustoId(String(created.centro_custo_id || ''))
      setDepartamentoId(String(created.departamento_id || ''))
      setFilialId(String(created.filial_id || ''))
      setProjetoId(String(created.projeto_id || ''))
    } else {
      setFornecedorId(String(result.data?.fornecedor_id || ''))
      setCategoriaId(String(result.data?.categoria_id || ''))
      setCentroCustoId(String(result.data?.centro_custo_id || ''))
      setDepartamentoId(String(result.data?.departamento_id || ''))
      setFilialId(String(result.data?.filial_id || ''))
      setProjetoId(String(result.data?.projeto_id || ''))
    }
  }, [isPreview, created, result.payload?.fornecedor_id, result.payload?.categoria_id, result.payload?.centro_custo_id, result.payload?.departamento_id, result.payload?.filial_id, result.payload?.projeto_id, result.data])

  // Load fornecedores
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoadingForn(true); setErrorForn(null)
        const res = await fetch('/api/modulos/financeiro/fornecedores/list', { cache: 'no-store' })
        const j = await res.json()
        const rows = Array.isArray(j?.rows) ? (j.rows as Array<{ id: number; nome: string }>) : []
        if (!cancelled) setFornOptions(rows.map((r) => ({ value: String(r.id), label: String(r.nome || r.id) })))
      } catch (e) {
        if (!cancelled) setErrorForn(e instanceof Error ? e.message : 'Falha ao carregar fornecedores')
      } finally { if (!cancelled) setLoadingForn(false) }
    }
    load()
    return () => { cancelled = true }
  }, [])

  const isValidDate = (v: string) => {
    if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false
    const d = new Date(v)
    return !isNaN(d.getTime())
  }

  // Load categorias
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoadingCat(true); setErrorCat(null)
        const res = await fetch('/api/modulos/financeiro/categorias/list', { cache: 'no-store' })
        const j = await res.json()
        const rows = Array.isArray(j?.rows) ? (j.rows as Array<{ id: number; nome: string; tipo?: string }>) : []
        if (!cancelled) setCatOptions(rows.map((r) => ({ value: String(r.id), label: `${r.nome}${r.tipo ? ` (${r.tipo})` : ''}` })))
      } catch (e) {
        if (!cancelled) setErrorCat(e instanceof Error ? e.message : 'Falha ao carregar categorias')
      } finally { if (!cancelled) setLoadingCat(false) }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Load centros de custo (empresa)
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoadingCc(true); setErrorCc(null)
        const res = await fetch('/api/modulos/empresa?view=centros-de-custo&pageSize=1000&order_by=codigo', { cache: 'no-store' })
        const j = await res.json()
        const rows = Array.isArray(j?.rows) ? (j.rows as Array<{ id: number; codigo?: string; nome: string }>) : []
        if (!cancelled) setCcOptions(rows.map((r) => ({ value: String(r.id), label: r.codigo ? `${r.codigo} - ${r.nome}` : r.nome })))
      } catch (e) {
        if (!cancelled) setErrorCc(e instanceof Error ? e.message : 'Falha ao carregar centros de custo')
      } finally { if (!cancelled) setLoadingCc(false) }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Load departamentos (empresa)
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoadingDep(true); setErrorDep(null)
        const res = await fetch('/api/modulos/empresa?view=departamentos&pageSize=1000&order_by=codigo', { cache: 'no-store' })
        const j = await res.json()
        const rows = Array.isArray(j?.rows) ? (j.rows as Array<{ id: number; codigo?: string; nome: string }>) : []
        if (!cancelled) setDepOptions(rows.map((r) => ({ value: String(r.id), label: r.codigo ? `${r.codigo} - ${r.nome}` : r.nome })))
      } catch (e) {
        if (!cancelled) setErrorDep(e instanceof Error ? e.message : 'Falha ao carregar departamentos')
      } finally { if (!cancelled) setLoadingDep(false) }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Load filiais (empresa)
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoadingFilial(true); setErrorFilial(null)
        const res = await fetch('/api/modulos/empresa?view=filiais&pageSize=1000&order_by=nome', { cache: 'no-store' })
        const j = await res.json()
        const rows = Array.isArray(j?.rows) ? (j.rows as Array<{ id: number; nome: string }>) : []
        if (!cancelled) setFilialOptions(rows.map((r) => ({ value: String(r.id), label: r.nome })))
      } catch (e) {
        if (!cancelled) setErrorFilial(e instanceof Error ? e.message : 'Falha ao carregar filiais')
      } finally { if (!cancelled) setLoadingFilial(false) }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Load projetos (financeiro)
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoadingProj(true); setErrorProj(null)
        const res = await fetch('/api/modulos/financeiro?view=projetos&pageSize=1000&order_by=nome', { cache: 'no-store' })
        const j = await res.json()
        const rows = Array.isArray(j?.rows) ? (j.rows as Array<{ id: number; nome: string }>) : []
        if (!cancelled) setProjOptions(rows.map((r) => ({ value: String(r.id), label: r.nome })))
      } catch (e) {
        if (!cancelled) setErrorProj(e instanceof Error ? e.message : 'Falha ao carregar projetos')
      } finally { if (!cancelled) setLoadingProj(false) }
    }
    load()
    return () => { cancelled = true }
  }, [])
  // Display items in the table
  const tableRows: ItemRow[] = useMemo(() => {
    if (created) return created.itens || []
    if (isPreview) return result.payload?.itens || []
    return result.data?.itens || []
  }, [created, isPreview, result.data, result.payload]);

  const columns: ColumnDef<ItemRow>[] = useMemo(() => [
    {
      accessorKey: 'descricao',
      header: 'Descrição do Item',
      size: 300,
      minSize: 200,
      cell: ({ row }) => {
        const desc = row.original.descricao || '-';
        return <div className="text-sm">{desc}</div>;
      }
    },
    {
      accessorKey: 'quantidade',
      header: 'Quantidade',
      cell: ({ row }) => {
        const qtd = row.original.quantidade || 0;
        return <div className="text-sm text-center">{qtd}</div>;
      }
    },
    {
      accessorKey: 'valor_unitario',
      header: 'Valor Unitário',
      cell: ({ row }) => {
        const valor = row.original.valor_unitario || 0;
        return (
          <div className="text-sm">
            {Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        );
      }
    },
    {
      accessorKey: 'valor_total',
      header: 'Valor Total',
      cell: ({ row }) => {
        const valor = row.original.valor_total || 0;
        return (
          <div className="font-bold text-red-600">
            {Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        );
      }
    }
  ], []);

  const commit = async () => {
    if (!result.metadata?.commitEndpoint || !result.payload) return
    try {
      setCreating(true)
      // Se houver itens, enviar JSON (header + linhas) em uma única transação
      const hasItens = Array.isArray(result.payload.itens) && result.payload.itens.length > 0
      const dataLanc = result.payload.data_emissao || new Date().toISOString().slice(0,10)
      let res: Response
      if (hasItens) {
        const linhas = (result.payload.itens || []).map((it, idx) => {
          const bruto = (typeof it.valor_total === 'number' ? it.valor_total : (it.quantidade || 0) * (it.valor_unitario || 0)) || 0
          const liquido = (typeof it.valor_total === 'number' ? it.valor_total : (it.quantidade || 0) * (it.valor_unitario || 0)) || 0
          return {
            tipo_linha: 'parcela',
            numero_parcela: idx + 1,
            valor_bruto: bruto,
            juros: 0,
            multa: 0,
            desconto: 0,
            valor_liquido: liquido,
            data_vencimento: result.payload!.data_vencimento,
            status: 'pendente',
            observacao: it.descricao || undefined,
          }
        })
        const headerValor = Number(result.payload.valor || 0)
        const valorFromLinhas = linhas.reduce((acc, ln) => acc + Number(ln.valor_liquido || 0), 0)
        const body = {
          fornecedor_id: fornecedorId || result.payload.fornecedor_id,
          categoria_id: categoriaId || result.payload.categoria_id || undefined,
          centro_custo_id: centroCustoId || result.payload.centro_custo_id || undefined,
          departamento_id: departamentoId || result.payload.departamento_id || undefined,
          filial_id: filialId || result.payload.filial_id || undefined,
          projeto_id: projetoId || result.payload.projeto_id || undefined,
          descricao: (descricao && descricao.trim()) || result.payload.descricao || 'Conta a pagar',
          valor: headerValor > 0 ? headerValor : valorFromLinhas,
          data_lancamento: dataLanc,
          data_vencimento: dataVenc || result.payload.data_vencimento,
          status: 'pendente',
          tenant_id: result.payload.tenant_id ?? 1,
          // Enviar itens para persistir em financeiro.lancamentos_financeiros_itens
          itens: result.payload.itens,
          linhas,
        }
        res = await fetch(result.metadata.commitEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      } else {
        // Fallback: FormData (cabeçalho apenas)
        const fd = new FormData()
        fd.set('descricao', String((descricao && descricao.trim()) || result.payload.descricao || 'Conta a pagar'))
        fd.set('valor', String(result.payload.valor))
        fd.set('data_lancamento', dataLanc)
        fd.set('data_vencimento', dataVenc || result.payload.data_vencimento)
        fd.set('status', 'pendente')
        if (result.payload.fornecedor_id) fd.set('entidade_id', result.payload.fornecedor_id)
        if (result.payload.categoria_id) fd.set('categoria_id', result.payload.categoria_id)
        fd.set('tenant_id', String(result.payload.tenant_id ?? 1))
        res = await fetch(result.metadata.commitEndpoint, { method: 'POST', body: fd })
      }
      const json = await res.json()
      if (!res.ok || !json?.success) {
        alert(json?.message || 'Falha ao criar conta a pagar')
        setCreating(false)
        return
      }
      // Minimal created response
      const createdData: CreatedData = {
        id: String(json.id),
        fornecedor_id: fornecedorId || result.payload.fornecedor_id || '',
        categoria_id: categoriaId || result.payload.categoria_id || '',
        centro_custo_id: result.payload.centro_custo_id || '',
        departamento_id: result.payload.departamento_id || null,
        filial_id: result.payload.filial_id || null,
        projeto_id: result.payload.projeto_id || null,
        natureza_financeira_id: result.payload.natureza_financeira_id || null,
        valor: result.payload.valor,
        valor_pago: 0,
        valor_pendente: result.payload.valor,
        data_vencimento: result.payload.data_vencimento,
        data_emissao: dataLanc,
        data_cadastro: new Date().toISOString(),
        numero_nota_fiscal: result.payload.numero_nota_fiscal || null,
        descricao: result.payload.descricao || '',
        status: 'pendente',
        itens: result.payload.itens || [],
        quantidade_itens: (result.payload.itens || []).length
      }
      setCreated(createdData)
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Erro ao criar conta a pagar')
    } finally {
      setCreating(false)
    }
  }

  // Summary content (preview or created)
  const summaryValor = created ? created.valor : (isPreview ? (result.payload?.valor || 0) : (result.data?.valor || 0))
  const summaryVenc = created ? created.data_vencimento : (isPreview ? (dataVenc || '') : result.resumo.data_vencimento)
  const summaryNF = created ? (created.numero_nota_fiscal || '-') : (isPreview ? (result.payload?.numero_nota_fiscal || '-') : result.resumo.numero_nota_fiscal)
  const summaryId = created ? created.id : (isPreview ? '-' : result.resumo.id)
  // Mostrar sempre o ID do fornecedor no 4º campo
  const summaryFornecedorId = created
    ? created.fornecedor_id
    : (isPreview
        ? (result.payload?.fornecedor_id || '-')
        : (result.data?.fornecedor_id || '-'))
  const summaryCategoriaId = created
    ? (created.categoria_id || '-')
    : (isPreview ? (result.payload?.categoria_id || '-') : (result.data?.categoria_id || '-'))
  const summaryCentroCustoId = created
    ? (created.centro_custo_id || '-')
    : (isPreview ? (result.payload?.centro_custo_id || '-') : (result.data?.centro_custo_id || '-'))
  const summaryDepartamentoId = created
    ? (created.departamento_id || '-')
    : (isPreview ? (result.payload?.departamento_id || '-') : (result.data?.departamento_id || '-'))
  const summaryFilialId = created
    ? (created.filial_id || '-')
    : (isPreview ? (result.payload?.filial_id || '-') : (result.data?.filial_id || '-'))
  const summaryProjetoId = created
    ? (created.projeto_id || '-')
    : (isPreview ? (result.payload?.projeto_id || '-') : (result.data?.projeto_id || '-'))

  return (
    <div className="space-y-4">
      <div className={isPreview ? 'bg-gray-50 border border-gray-200 rounded-lg p-4' : 'bg-green-50 border border-green-200 rounded-lg p-4'}>
        <div className="flex items-start gap-3">
          <CheckCircle2 className={isPreview ? 'h-6 w-6 text-blue-600 mt-0.5' : 'h-6 w-6 text-green-600 mt-0.5'} />
          <div className="flex-1">
            <h3 className={isPreview ? 'font-semibold text-blue-900 mb-2' : 'font-semibold text-green-900 mb-2'}>
              {isPreview ? (result.title || 'Conta a Pagar (Prévia)') : (result.title || 'Conta a Pagar Criada')}
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className={isPreview ? 'text-blue-700 font-medium' : 'text-green-700 font-medium'}>Valor Total:</span>
                <div className={isPreview ? 'text-blue-900 font-bold text-lg' : 'text-green-900 font-bold text-lg'}>
                  {Number(summaryValor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
              </div>
              <div>
                <span className={isPreview ? 'text-blue-700 font-medium' : 'text-green-700 font-medium'}>Vencimento:</span>
                {isPreview ? (
                  <div className="flex flex-col gap-1">
                    <Input type="date" value={dataVenc} onChange={(e) => setDataVenc(e.target.value)} className="h-8 text-sm" />
                    {!isValidDate(dataVenc) && <span className="text-xs text-red-600">Data inválida (YYYY-MM-DD)</span>}
                  </div>
                ) : (
                  <div className={isPreview ? 'text-blue-900' : 'text-green-900'}>
                    {summaryVenc ? new Date(summaryVenc).toLocaleDateString('pt-BR') : '-'}
                  </div>
                )}
              </div>
              <div>
                <span className={isPreview ? 'text-blue-700 font-medium' : 'text-green-700 font-medium'}>Descrição:</span>
                {isPreview ? (
                  <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Descrição da conta" className="h-8 text-sm" />
                ) : (
                  <div className={isPreview ? 'text-blue-900' : 'text-green-900'}>{descricao || result.payload?.descricao || '-'}</div>
                )}
              </div>
              <div>
                <span className={isPreview ? 'text-blue-700 font-medium' : 'text-green-700 font-medium'}>Fornecedor:</span>
                {isPreview ? (
                  <Select value={fornecedorId} onValueChange={setFornecedorId}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder={loadingForn ? 'Carregando...' : (errorForn ? 'Erro' : 'Selecione fornecedor')} />
                    </SelectTrigger>
                    <SelectContent>
                      {errorForn ? (
                        <SelectItem value={summaryFornecedorId as string} disabled>
                          {`Selecionado (ID ${summaryFornecedorId})`}
                        </SelectItem>
                      ) : (
                        <>
                          {/* Garantir que a seleção atual aparece mesmo se não estiver na lista */}
                          {fornecedorId && !fornOptions.some(o => o.value === fornecedorId) && (
                            <SelectItem value={fornecedorId}>{`Selecionado (ID ${fornecedorId})`}</SelectItem>
                          )}
                          {fornOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className={'font-mono text-xs ' + (isPreview ? 'text-blue-900' : 'text-green-900')}>{summaryFornecedorId}</div>
                )}
              </div>
              <div>
                <span className={isPreview ? 'text-blue-700 font-medium' : 'text-green-700 font-medium'}>Categoria:</span>
                {isPreview ? (
                  <Select value={categoriaId} onValueChange={setCategoriaId}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder={loadingCat ? 'Carregando...' : (errorCat ? 'Erro' : 'Selecione categoria')} />
                    </SelectTrigger>
                    <SelectContent>
                      {errorCat ? (
                        <SelectItem value={summaryCategoriaId as string} disabled>
                          {`Selecionada (ID ${summaryCategoriaId})`}
                        </SelectItem>
                      ) : (
                        <>
                          {categoriaId && !catOptions.some(o => o.value === categoriaId) && (
                            <SelectItem value={categoriaId}>{`Selecionada (ID ${categoriaId})`}</SelectItem>
                          )}
                          {catOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className={'font-mono text-xs ' + (isPreview ? 'text-blue-900' : 'text-green-900')}>{summaryCategoriaId}</div>
                )}
              </div>
              <div>
                <span className={isPreview ? 'text-blue-700 font-medium' : 'text-green-700 font-medium'}>ID Centro de Custo:</span>
                {isPreview ? (
                  <Select value={centroCustoId} onValueChange={setCentroCustoId}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder={loadingCc ? 'Carregando...' : (errorCc ? 'Erro' : 'Selecione centro de custo')} />
                    </SelectTrigger>
                    <SelectContent>
                      {errorCc ? (
                        <SelectItem value={summaryCentroCustoId as string} disabled>
                          {`Selecionado (ID ${summaryCentroCustoId})`}
                        </SelectItem>
                      ) : (
                        <>
                          {centroCustoId && !ccOptions.some(o => o.value === centroCustoId) && (
                            <SelectItem value={centroCustoId}>{`Selecionado (ID ${centroCustoId})`}</SelectItem>
                          )}
                          {ccOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className={'font-mono text-xs ' + (isPreview ? 'text-blue-900' : 'text-green-900')}>{summaryCentroCustoId}</div>
                )}
              </div>
              <div>
                <span className={isPreview ? 'text-blue-700 font-medium' : 'text-green-700 font-medium'}>ID Departamento:</span>
                {isPreview ? (
                  <Select value={departamentoId} onValueChange={setDepartamentoId}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder={loadingDep ? 'Carregando...' : (errorDep ? 'Erro' : 'Selecione departamento')} />
                    </SelectTrigger>
                    <SelectContent>
                      {errorDep ? (
                        <SelectItem value={summaryDepartamentoId as string} disabled>
                          {`Selecionado (ID ${summaryDepartamentoId})`}
                        </SelectItem>
                      ) : (
                        <>
                          {departamentoId && !depOptions.some(o => o.value === departamentoId) && (
                            <SelectItem value={departamentoId}>{`Selecionado (ID ${departamentoId})`}</SelectItem>
                          )}
                          {depOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className={'font-mono text-xs ' + (isPreview ? 'text-blue-900' : 'text-green-900')}>{summaryDepartamentoId}</div>
                )}
              </div>
              <div>
                <span className={isPreview ? 'text-blue-700 font-medium' : 'text-green-700 font-medium'}>ID Filial:</span>
                {isPreview ? (
                  <Select value={filialId} onValueChange={setFilialId}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder={loadingFilial ? 'Carregando...' : (errorFilial ? 'Erro' : 'Selecione filial')} />
                    </SelectTrigger>
                    <SelectContent>
                      {errorFilial ? (
                        <SelectItem value={summaryFilialId as string} disabled>
                          {`Selecionada (ID ${summaryFilialId})`}
                        </SelectItem>
                      ) : (
                        <>
                          {filialId && !filialOptions.some(o => o.value === filialId) && (
                            <SelectItem value={filialId}>{`Selecionada (ID ${filialId})`}</SelectItem>
                          )}
                          {filialOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className={'font-mono text-xs ' + (isPreview ? 'text-blue-900' : 'text-green-900')}>{summaryFilialId}</div>
                )}
              </div>
              <div>
                <span className={isPreview ? 'text-blue-700 font-medium' : 'text-green-700 font-medium'}>ID Projeto:</span>
                {isPreview ? (
                  <Select value={projetoId} onValueChange={setProjetoId}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder={loadingProj ? 'Carregando...' : (errorProj ? 'Erro' : 'Selecione projeto')} />
                    </SelectTrigger>
                    <SelectContent>
                      {errorProj ? (
                        <SelectItem value={summaryProjetoId as string} disabled>
                          {`Selecionado (ID ${summaryProjetoId})`}
                        </SelectItem>
                      ) : (
                        <>
                          {projetoId && !projOptions.some(o => o.value === projetoId) && (
                            <SelectItem value={projetoId}>{`Selecionado (ID ${projetoId})`}</SelectItem>
                          )}
                          {projOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className={'font-mono text-xs ' + (isPreview ? 'text-blue-900' : 'text-green-900')}>{summaryProjetoId}</div>
                )}
              </div>
            </div>
            {isPreview && (
              <div className="mt-4 pt-2 border-t border-gray-200">
                <Button onClick={commit} disabled={creating || hasErrors || !fornecedorId || !categoriaId || !centroCustoId || !isValidDate(dataVenc)} className="w-full sm:w-auto">
                  {creating ? 'Criando…' : 'Criar Conta a Pagar'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {tableRows.length > 0 && (
        <ArtifactDataTable
          data={tableRows}
          columns={columns}
          title="Itens da Nota Fiscal"
          icon={Receipt}
          iconColor="text-red-600"
          message={`${tableRows.length} ${tableRows.length === 1 ? 'item' : 'itens'} na nota fiscal`}
          success={result.success}
          count={tableRows.length}
          error={result.error}
          exportFileName={`conta_pagar_itens_${summaryId}`}
          pageSize={10}
        />
      )}
    </div>
  );
}
