'use client'

import ArtifactDataTable from '@/components/widgets/ArtifactDataTable'
import { ColumnDef } from '@tanstack/react-table'
import { Receipt, CheckCircle2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
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

type ContaReceberCriadaOutput = {
  success: boolean;
  // preview
  preview?: boolean;
  payload?: {
    cliente_id: string;
    categoria_id?: string;
    centro_lucro_id?: string;
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
  // created
  data: {
    id: string;
    cliente_id: string;
    categoria_id: string;
    centro_lucro_id: string;
    natureza_financeira_id?: string | null;
    valor: number;
    valor_recebido: number;
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

type CreatedData = ContaReceberCriadaOutput['data']

export default function ContaReceberCriadaResult({ result }: { result: ContaReceberCriadaOutput }) {
  const [creating, setCreating] = useState(false)
  const [created, setCreated] = useState<CreatedData | null>(null)
  const isPreview = result.preview && result.payload && !created
  // Editable fields (preview)
  const [descricao, setDescricao] = useState<string>('')
  const [dataVenc, setDataVenc] = useState<string>('')
  // Dropdown state & options
  const [clienteId, setClienteId] = useState<string>('')
  const [categoriaId, setCategoriaId] = useState<string>('')
  const [centroLucroId, setCentroLucroId] = useState<string>('')
  const [departamentoId, setDepartamentoId] = useState<string>('')
  const [filialId, setFilialId] = useState<string>('')
  const [projetoId, setProjetoId] = useState<string>('')

  const [cliOptions, setCliOptions] = useState<Array<{ value: string; label: string }>>([])
  const [catOptions, setCatOptions] = useState<Array<{ value: string; label: string }>>([])
  const [clOptions, setClOptions] = useState<Array<{ value: string; label: string }>>([])
  const [depOptions, setDepOptions] = useState<Array<{ value: string; label: string }>>([])
  const [filialOptions, setFilialOptions] = useState<Array<{ value: string; label: string }>>([])
  const [projOptions, setProjOptions] = useState<Array<{ value: string; label: string }>>([])

  const [loadingCli, setLoadingCli] = useState(false)
  const [loadingCat, setLoadingCat] = useState(false)
  const [loadingCl, setLoadingCl] = useState(false)
  const [loadingDep, setLoadingDep] = useState(false)
  const [loadingFilial, setLoadingFilial] = useState(false)
  const [loadingProj, setLoadingProj] = useState(false)

  const [errorCli, setErrorCli] = useState<string | null>(null)
  const [errorCat, setErrorCat] = useState<string | null>(null)
  const [errorCl, setErrorCl] = useState<string | null>(null)
  const [errorDep, setErrorDep] = useState<string | null>(null)
  const [errorFilial, setErrorFilial] = useState<string | null>(null)
  const [errorProj, setErrorProj] = useState<string | null>(null)

  // Initialize IDs from payload/created/data
  useEffect(() => {
    if (isPreview) {
      setClienteId(String(result.payload?.cliente_id || ''))
      setCategoriaId(String(result.payload?.categoria_id || ''))
      setCentroLucroId(String(result.payload?.centro_lucro_id || ''))
      // Initialize editable fields from payload
      setDescricao(String(result.payload?.descricao || ''))
      setDataVenc(String(result.payload?.data_vencimento || ''))
    } else if (created) {
      setClienteId(String(created.cliente_id || ''))
      setCategoriaId(String(created.categoria_id || ''))
      setCentroLucroId(String(created.centro_lucro_id || ''))
    } else {
      setClienteId(String(result.data?.cliente_id || ''))
      setCategoriaId(String(result.data?.categoria_id || ''))
    }
  }, [isPreview, created, result.payload?.cliente_id, result.payload?.categoria_id, result.payload?.centro_lucro_id, result.data])

  const isValidDate = (v: string) => {
    if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false
    const d = new Date(v)
    return !isNaN(d.getTime())
  }

  // Load options
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoadingCli(true); setErrorCli(null)
        const res = await fetch('/api/modulos/financeiro/clientes/list', { cache: 'no-store' })
        const j = await res.json()
        const rows = Array.isArray(j?.rows) ? (j.rows as Array<{ id: number; nome: string }>) : []
        if (!cancelled) setCliOptions(rows.map(r => ({ value: String(r.id), label: r.nome })))
      } catch (e) {
        if (!cancelled) setErrorCli(e instanceof Error ? e.message : 'Falha ao carregar clientes')
      } finally { if (!cancelled) setLoadingCli(false) }
    }
    load(); return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try { setLoadingCat(true); setErrorCat(null)
        const res = await fetch('/api/modulos/financeiro/categorias/list', { cache: 'no-store' })
        const j = await res.json()
        const rows = Array.isArray(j?.rows) ? (j.rows as Array<{ id: number; nome: string; tipo?: string }>) : []
        if (!cancelled) setCatOptions(rows.map(r => ({ value: String(r.id), label: `${r.nome}${r.tipo ? ` (${r.tipo})` : ''}` })))
      } catch (e) {
        if (!cancelled) setErrorCat(e instanceof Error ? e.message : 'Falha ao carregar categorias')
      } finally { if (!cancelled) setLoadingCat(false) }
    }
    load(); return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try { setLoadingCl(true); setErrorCl(null)
        const res = await fetch('/api/modulos/financeiro?view=centros-de-lucro&pageSize=1000&order_by=codigo', { cache: 'no-store' })
        const j = await res.json()
        const rows = Array.isArray(j?.rows) ? (j.rows as Array<{ id: number; codigo?: string; nome: string }>) : []
        if (!cancelled) setClOptions(rows.map(r => ({ value: String(r.id), label: r.codigo ? `${r.codigo} - ${r.nome}` : r.nome })))
      } catch (e) {
        if (!cancelled) setErrorCl(e instanceof Error ? e.message : 'Falha ao carregar centros de lucro')
      } finally { if (!cancelled) setLoadingCl(false) }
    }
    load(); return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try { setLoadingDep(true); setErrorDep(null)
        const res = await fetch('/api/modulos/empresa?view=departamentos&pageSize=1000&order_by=codigo', { cache: 'no-store' })
        const j = await res.json()
        const rows = Array.isArray(j?.rows) ? (j.rows as Array<{ id: number; codigo?: string; nome: string }>) : []
        if (!cancelled) setDepOptions(rows.map(r => ({ value: String(r.id), label: r.codigo ? `${r.codigo} - ${r.nome}` : r.nome })))
      } catch (e) {
        if (!cancelled) setErrorDep(e instanceof Error ? e.message : 'Falha ao carregar departamentos')
      } finally { if (!cancelled) setLoadingDep(false) }
    }
    load(); return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try { setLoadingFilial(true); setErrorFilial(null)
        const res = await fetch('/api/modulos/empresa?view=filiais&pageSize=1000&order_by=nome', { cache: 'no-store' })
        const j = await res.json()
        const rows = Array.isArray(j?.rows) ? (j.rows as Array<{ id: number; nome: string }>) : []
        if (!cancelled) setFilialOptions(rows.map(r => ({ value: String(r.id), label: r.nome })))
      } catch (e) { if (!cancelled) setErrorFilial(e instanceof Error ? e.message : 'Falha ao carregar filiais') }
      finally { if (!cancelled) setLoadingFilial(false) }
    }
    load(); return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try { setLoadingProj(true); setErrorProj(null)
        const res = await fetch('/api/modulos/financeiro?view=projetos&pageSize=1000&order_by=nome', { cache: 'no-store' })
        const j = await res.json()
        const rows = Array.isArray(j?.rows) ? (j.rows as Array<{ id: number; nome: string }>) : []
        if (!cancelled) setProjOptions(rows.map(r => ({ value: String(r.id), label: r.nome })))
      } catch (e) { if (!cancelled) setErrorProj(e instanceof Error ? e.message : 'Falha ao carregar projetos') }
      finally { if (!cancelled) setLoadingProj(false) }
    }
    load(); return () => { cancelled = true }
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
          <div className="font-bold text-green-600">
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
      const hasItens = Array.isArray(result.payload.itens) && result.payload.itens.length > 0
      const dataLanc = result.payload.data_emissao || new Date().toISOString().slice(0,10)
      let res: Response
      if (hasItens) {
        // Opcional: gerar linhas a partir dos itens (parcela única por item)
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
          cliente_id: clienteId || result.payload.cliente_id,
          categoria_id: categoriaId || result.payload.categoria_id || undefined,
          centro_lucro_id: centroLucroId || result.payload.centro_lucro_id || undefined,
          departamento_id: departamentoId || undefined,
          filial_id: filialId || undefined,
          projeto_id: projetoId || undefined,
          descricao: (descricao && descricao.trim()) || result.payload.descricao || 'Conta a receber',
          valor: headerValor > 0 ? headerValor : valorFromLinhas,
          data_lancamento: dataLanc,
          data_vencimento: dataVenc || result.payload.data_vencimento,
          status: 'pendente',
          tenant_id: result.payload.tenant_id ?? 1,
          itens: result.payload.itens,
          linhas,
        }
        res = await fetch(result.metadata.commitEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      } else {
        // FormData legado (apenas cabeçalho)
        const fd = new FormData()
        fd.set('descricao', String((descricao && descricao.trim()) || result.payload.descricao || 'Conta a receber'))
        fd.set('valor', String(result.payload.valor))
        fd.set('data_lancamento', dataLanc)
        fd.set('data_vencimento', dataVenc || result.payload.data_vencimento)
        fd.set('status', 'pendente')
        if (clienteId || result.payload.cliente_id) fd.set('entidade_id', String(clienteId || result.payload.cliente_id))
        if (categoriaId || result.payload.categoria_id) fd.set('categoria_id', String(categoriaId || result.payload.categoria_id))
        if (centroLucroId || result.payload.centro_lucro_id) fd.set('centro_lucro_id', String(centroLucroId || result.payload.centro_lucro_id))
        fd.set('tenant_id', String(result.payload.tenant_id ?? 1))
        res = await fetch(result.metadata.commitEndpoint, { method: 'POST', body: fd })
      }
      const json = await res.json()
      if (!res.ok || !json?.success) {
        alert(json?.message || 'Falha ao criar conta a receber')
        setCreating(false)
        return
      }
      const createdData: CreatedData = {
        id: String(json.id),
        cliente_id: clienteId || result.payload.cliente_id || '',
        categoria_id: categoriaId || result.payload.categoria_id || '',
        centro_lucro_id: centroLucroId || result.payload.centro_lucro_id || '',
        natureza_financeira_id: result.payload.natureza_financeira_id || null,
        valor: result.payload.valor,
        valor_recebido: 0,
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
      alert(e instanceof Error ? e.message : 'Erro ao criar conta a receber')
    } finally {
      setCreating(false)
    }
  }

  const summaryValor = created ? created.valor : (isPreview ? (result.payload?.valor || 0) : (result.resumo?.valor_formatado ? Number(String(result.resumo.valor_formatado).replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.')) : 0))
  const summaryVenc = created ? created.data_vencimento : (isPreview ? (dataVenc || '') : result.resumo.data_vencimento)
  const summaryId = created ? created.id : (isPreview ? '-' : result.resumo.id)
  // NF mantida no payload/resumo, mas não usada diretamente na prévia editável

  return (
    <div className="space-y-4">
      <div className={isPreview ? 'bg-gray-50 border border-gray-200 rounded-lg p-4' : 'bg-green-50 border border-green-200 rounded-lg p-4'}>
        <div className="flex items-start gap-3">
          <CheckCircle2 className={isPreview ? 'h-6 w-6 text-blue-600 mt-0.5' : 'h-6 w-6 text-green-600 mt-0.5'} />
          <div className="flex-1">
            <h3 className={isPreview ? 'font-semibold text-blue-900 mb-2' : 'font-semibold text-green-900 mb-2'}>
              {isPreview ? (result.title || 'Conta a Receber (Prévia)') : (result.title || 'Conta a Receber Criada')}
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
                <span className={isPreview ? 'text-blue-700 font-medium' : 'text-green-700 font-medium'}>ID:</span>
                <div className={isPreview ? 'text-blue-900 font-mono text-xs' : 'text-green-900 font-mono text-xs'}>{summaryId}</div>
              </div>
              {/* Cliente */}
              <div>
                <span className={isPreview ? 'text-blue-700 font-medium' : 'text-green-700 font-medium'}>Cliente:</span>
                {isPreview ? (
                  <Select value={clienteId} onValueChange={setClienteId}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder={loadingCli ? 'Carregando...' : (errorCli ? 'Erro' : 'Selecione cliente')} />
                    </SelectTrigger>
                    <SelectContent>
                      {errorCli ? (
                        <SelectItem value={String(result.payload?.cliente_id || '')} disabled>
                          {`Selecionado (ID ${result.payload?.cliente_id || '-'})`}
                        </SelectItem>
                      ) : (
                        <>
                          {clienteId && !cliOptions.some(o => o.value === clienteId) && (
                            <SelectItem value={clienteId}>{`Selecionado (ID ${clienteId})`}</SelectItem>
                          )}
                          {cliOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className={'font-mono text-xs ' + (isPreview ? 'text-blue-900' : 'text-green-900')}>{created?.cliente_id || result.data?.cliente_id}</div>
                )}
              </div>
              {/* Categoria */}
              <div>
                <span className={isPreview ? 'text-blue-700 font-medium' : 'text-green-700 font-medium'}>Categoria:</span>
                {isPreview ? (
                  <Select value={categoriaId} onValueChange={setCategoriaId}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder={loadingCat ? 'Carregando...' : (errorCat ? 'Erro' : 'Selecione categoria')} />
                    </SelectTrigger>
                    <SelectContent>
                      {errorCat ? (
                        <SelectItem value={String(result.payload?.categoria_id || '')} disabled>
                          {`Selecionada (ID ${result.payload?.categoria_id || '-'})`}
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
                  <div className={'font-mono text-xs ' + (isPreview ? 'text-blue-900' : 'text-green-900')}>{created?.categoria_id || result.data?.categoria_id}</div>
                )}
              </div>
              {/* Centro de Lucro */}
              <div>
                <span className={isPreview ? 'text-blue-700 font-medium' : 'text-green-700 font-medium'}>Centro de Lucro:</span>
                {isPreview ? (
                  <Select value={centroLucroId} onValueChange={setCentroLucroId}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder={loadingCl ? 'Carregando...' : (errorCl ? 'Erro' : 'Selecione centro de lucro')} />
                    </SelectTrigger>
                    <SelectContent>
                      {errorCl ? (
                        <SelectItem value={String(result.payload?.centro_lucro_id || '')} disabled>
                          {`Selecionado (ID ${result.payload?.centro_lucro_id || '-'})`}
                        </SelectItem>
                      ) : (
                        <>
                          {centroLucroId && !clOptions.some(o => o.value === centroLucroId) && (
                            <SelectItem value={centroLucroId}>{`Selecionado (ID ${centroLucroId})`}</SelectItem>
                          )}
                          {clOptions.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className={'font-mono text-xs ' + (isPreview ? 'text-blue-900' : 'text-green-900')}>{created?.centro_lucro_id || ''}</div>
                )}
              </div>
              {/* Departamento */}
              <div>
                <span className={isPreview ? 'text-blue-700 font-medium' : 'text-green-700 font-medium'}>Departamento:</span>
                {isPreview ? (
                  <Select value={departamentoId} onValueChange={setDepartamentoId}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder={loadingDep ? 'Carregando...' : (errorDep ? 'Erro' : 'Selecione departamento')} />
                    </SelectTrigger>
                    <SelectContent>
                      {errorDep ? (
                        <SelectItem value={String('')} disabled>
                          {`Selecionado (ID -)`}
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
                  <div className={'font-mono text-xs ' + (isPreview ? 'text-blue-900' : 'text-green-900')}>{departamentoId || '-'}</div>
                )}
              </div>
              {/* Filial */}
              <div>
                <span className={isPreview ? 'text-blue-700 font-medium' : 'text-green-700 font-medium'}>Filial:</span>
                {isPreview ? (
                  <Select value={filialId} onValueChange={setFilialId}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder={loadingFilial ? 'Carregando...' : (errorFilial ? 'Erro' : 'Selecione filial')} />
                    </SelectTrigger>
                    <SelectContent>
                      {errorFilial ? (
                        <SelectItem value={String('')} disabled>
                          {`Selecionada (ID -)`}
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
                  <div className={'font-mono text-xs ' + (isPreview ? 'text-blue-900' : 'text-green-900')}>{filialId || '-'}</div>
                )}
              </div>
              {/* Projeto */}
              <div>
                <span className={isPreview ? 'text-blue-700 font-medium' : 'text-green-700 font-medium'}>Projeto:</span>
                {isPreview ? (
                  <Select value={projetoId} onValueChange={setProjetoId}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder={loadingProj ? 'Carregando...' : (errorProj ? 'Erro' : 'Selecione projeto')} />
                    </SelectTrigger>
                    <SelectContent>
                      {errorProj ? (
                        <SelectItem value={String('')} disabled>
                          {`Selecionado (ID -)`}
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
                  <div className={'font-mono text-xs ' + (isPreview ? 'text-blue-900' : 'text-green-900')}>{projetoId || '-'}</div>
                )}
              </div>
            </div>
          </div>
          {isPreview && (
            <div className="ml-auto">
              <Button onClick={commit} disabled={creating || !clienteId || !categoriaId || !centroLucroId || !isValidDate(dataVenc)}>
                {creating ? 'Criando…' : 'Criar Conta a Receber'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {tableRows.length > 0 && (
        <ArtifactDataTable
          data={tableRows}
          columns={columns}
          title="Itens da Nota Fiscal"
          icon={Receipt}
          iconColor="text-green-600"
          message={`${tableRows.length} ${tableRows.length === 1 ? 'item' : 'itens'} na nota fiscal`}
          success={result.success}
          count={tableRows.length}
          error={result.error}
          exportFileName={`conta_receber_itens_${summaryId}`}
          pageSize={10}
        />
      )}
    </div>
  );
}
