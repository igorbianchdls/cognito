"use client"

import { useEffect, useState, useCallback } from 'react'

type Anexo = {
  id: number
  documento_id?: number
  nome_arquivo?: string
  tipo_arquivo?: string
  arquivo_url?: string
  tamanho_bytes?: number
  criado_em?: string
  signed_url?: string
}

type FinanceiroDoc = {
  documento_id: number
  tipo_documento?: string
  numero?: string
  descricao?: string
  data_emissao?: string
  valor_total?: number
  status?: string
}

export default function AnexosPage() {
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<'upload' | 'create'>('create')
  const [nomeArquivo, setNomeArquivo] = useState<string>('documento.txt')
  const [tipoArquivo, setTipoArquivo] = useState<string>('text/plain')
  const [conteudo, setConteudo] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<Anexo[]>([])
  const [error, setError] = useState<string | null>(null)
  const [docs, setDocs] = useState<FinanceiroDoc[]>([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [selectedDocForAnexos, setSelectedDocForAnexos] = useState<number | null>(null)
  const [docAnexos, setDocAnexos] = useState<Anexo[]>([])
  const [docAnexosLoading, setDocAnexosLoading] = useState(false)
  const [rowUploadBusy, setRowUploadBusy] = useState<number | null>(null)
  const [selectedView, setSelectedView] = useState<'fiscal'|'financeiro'|'operacional'|'juridico'|'comercial'|'rh'|'contratos'|'outros'>('financeiro')
  const [selectedDocumentoId, setSelectedDocumentoId] = useState<string>('')
  // Tabela completa documentos_anexos (teste)
  const [allAnexos, setAllAnexos] = useState<Anexo[]>([])
  const [allAnexosLoading, setAllAnexosLoading] = useState(false)
  const [insertDocumentoId, setInsertDocumentoId] = useState('')
  const [insertNomeArquivo, setInsertNomeArquivo] = useState('')
  const [insertTipoArquivo, setInsertTipoArquivo] = useState('')
  const [insertArquivoUrl, setInsertArquivoUrl] = useState('')


  const handleUpload = async (overrideFile?: File) => {
    const chosenFile = overrideFile ?? file
    if (!chosenFile) return
    try {
      setLoading(true)
      setError(null)
      const fd = new FormData()
      fd.set('file', chosenFile)
      const res = await fetch('/api/bigquery-test/anexos/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!json?.success) throw new Error(json?.message || 'Falha no upload')
      setFile(null)
      // Adiciona item recém-enviado na tabela (somente storage, sem DB)
      const uploaded: Anexo = {
        id: Date.now(),
        nome_arquivo: json?.file?.nome_arquivo || chosenFile.name,
        tipo_arquivo: json?.file?.tipo_arquivo || chosenFile.type,
        tamanho_bytes: json?.file?.tamanho_bytes ?? chosenFile.size,
        criado_em: new Date().toISOString(),
        signed_url: json?.signed_url || undefined,
      }
      setRows(prev => [uploaded, ...prev])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao enviar')
    } finally { setLoading(false) }
  }

  const handleCreateAndUpload = async () => {
    try {
      const name = (nomeArquivo || '').trim() || 'documento.txt'
      const type = (tipoArquivo || 'text/plain').trim()
      const blob = new Blob([conteudo ?? ''], { type })
      const syntheticFile = new File([blob], name, { type })
      await handleUpload(syntheticFile)
      setConteudo('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao criar arquivo')
    }
  }

  const refreshFromStorage = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/bigquery-test/anexos/storage-list?prefix=uploads', { cache: 'no-store' })
      const json = await res.json()
      if (!json?.success) throw new Error(json?.message || 'Falha ao listar storage')
      setRows(Array.isArray(json.rows) ? json.rows : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao listar storage')
      setRows([])
    } finally { setLoading(false) }
  }

  const refreshAllAnexos = async () => {
    try {
      setAllAnexosLoading(true)
      const res = await fetch('/api/documentos/anexos/all?limit=100', { cache: 'no-store' })
      const json = await res.json()
      if (res.ok && Array.isArray(json?.rows)) setAllAnexos(json.rows)
      else setAllAnexos([])
    } catch {
      setAllAnexos([])
    } finally {
      setAllAnexosLoading(false)
    }
  }

  const fetchDocs = useCallback(async () => {
    try {
      setDocsLoading(true)
      const params = new URLSearchParams()
      params.set('view', selectedView)
      params.set('page', '1')
      params.set('pageSize', '20')
      const res = await fetch(`/api/modulos/documentos?${params.toString()}`, { cache: 'no-store' })
      const json = await res.json()
      if (res.ok && Array.isArray(json?.rows)) {
        // map to FinanceiroDoc
        const mapped: FinanceiroDoc[] = json.rows.map((r: Record<string, unknown>) => ({
          documento_id: Number(r['documento_id'] ?? r['id'] ?? 0),
          tipo_documento: String(r['tipo_documento'] ?? ''),
          numero: r['numero'] != null ? String(r['numero']) : undefined,
          descricao: r['descricao'] != null ? String(r['descricao']) : undefined,
          data_emissao: r['data_emissao'] != null ? String(r['data_emissao']) : undefined,
          valor_total: r['valor_total'] != null ? Number(r['valor_total']) : undefined,
          status: r['status'] != null ? String(r['status']) : undefined,
        }))
        setDocs(mapped)
      } else {
        setDocs([])
      }
    } catch {
      setDocs([])
    } finally {
      setDocsLoading(false)
    }
  }, [selectedView])

  const openDocAnexos = async (documentoId: number) => {
    setSelectedDocForAnexos(documentoId)
    try {
      setDocAnexosLoading(true)
      const res = await fetch(`/api/documentos/anexos/list?documento_id=${documentoId}`, { cache: 'no-store' })
      const json = await res.json()
      if (res.ok && Array.isArray(json?.rows)) {
        setDocAnexos(json.rows as Anexo[])
      } else {
        setDocAnexos([])
      }
    } catch {
      setDocAnexos([])
    } finally {
      setDocAnexosLoading(false)
    }
  }

  const uploadForDocumento = async (documentoId: number, f: File) => {
    try {
      setRowUploadBusy(documentoId)
      const fd = new FormData()
      fd.set('documento_id', String(documentoId))
      fd.set('file', f)
      const res = await fetch('/api/documentos/anexos/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!json?.success) throw new Error(json?.message || 'Falha ao enviar anexo')
      // refresh anexos if panel is open for this doc
      if (selectedDocForAnexos === documentoId) {
        await openDocAnexos(documentoId)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao enviar anexo do documento')
    } finally {
      setRowUploadBusy(null)
    }
  }

  const openAnexo = async (id: number) => {
    const res = await fetch(`/api/documentos/anexos/download?id=${id}`)
    const json = await res.json()
    if (json?.success && json?.url) window.open(json.url, '_blank')
  }
  const downloadAnexo = async (id: number) => {
    const res = await fetch(`/api/documentos/anexos/download?id=${id}&mode=download`)
    const json = await res.json()
    if (json?.success && json?.url) window.open(json.url, '_blank')
  }

  useEffect(() => {
    // carregar documentos conforme view selecionado
    fetchDocs().catch(() => {})
  }, [fetchDocs])

  useEffect(() => {
    // carregar tabela completa documentos_anexos (teste)
    refreshAllAnexos().catch(() => {})
  }, [])

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Anexos (bigquery-test)</h1>
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-sm">Modo:</label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={mode}
            onChange={(e) => setMode(e.target.value as 'upload'|'create')}
          >
            <option value="create">Criar documento</option>
            <option value="upload">Enviar arquivo</option>
          </select>
        </div>
        {mode === 'upload' && (
          <div className="flex items-center gap-2">
            <label className="text-sm">Documento (opcional):</label>
            <select
              className="border rounded px-2 py-1 text-sm w-72"
              value={selectedDocumentoId}
              onChange={(e) => setSelectedDocumentoId(e.target.value)}
            >
              <option value="">Selecione um documento…</option>
              {docs.map((d) => (
                <option key={d.documento_id} value={String(d.documento_id)}>
                  #{d.documento_id} — {d.tipo_documento || 'Doc'} {d.numero ? `(${d.numero})` : ''} {d.status ? `- ${d.status}` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {mode === 'upload' ? (
        <div className="flex items-center gap-2 mb-4">
          <label className="px-3 py-1 bg-blue-600 text-white rounded cursor-pointer">
            <input
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) {
                  // Se o usuário selecionou um documento, envia para o endpoint de anexos por documento
                  const docIdNum = Number((selectedDocumentoId || '').trim())
                  if (docIdNum && !Number.isNaN(docIdNum)) {
                    uploadForDocumento(docIdNum, f)
                  } else {
                    handleUpload(f)
                  }
                }
                e.currentTarget.value = ''
              }}
            />
            {loading ? 'Enviando…' : 'Selecionar e Enviar'}
          </label>
        </div>
      ) : (
        <div className="mb-4 border rounded p-3">
          <div className="flex items-center gap-2 mb-2">
            <input
              className="border rounded px-2 py-1 text-sm flex-1"
              placeholder="nome do arquivo (ex: documento.txt)"
              value={nomeArquivo}
              onChange={(e) => setNomeArquivo(e.target.value)}
            />
            <select
              className="border rounded px-2 py-1 text-sm"
              value={tipoArquivo}
              onChange={(e) => setTipoArquivo(e.target.value)}
            >
              <option value="text/plain">text/plain</option>
              <option value="application/json">application/json</option>
            </select>
            <button
              className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50"
              onClick={handleCreateAndUpload}
              disabled={loading}
            >
              {loading ? 'Enviando…' : 'Criar e Enviar'}
            </button>
          </div>
          <textarea
            className="w-full border rounded p-2 text-sm"
            rows={6}
            placeholder="Conteúdo do documento"
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
          />
        </div>
      )}
      <div className="mb-4">
        <button
          className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
          onClick={refreshFromStorage}
          disabled={loading}
        >
          Atualizar (Storage)
        </button>
      </div>
      {error && <div className="text-red-600 text-sm mb-3">{error}</div>}
      <div className="border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Arquivo</th>
              <th className="text-left p-2">Tipo</th>
              <th className="text-left p-2">Tamanho</th>
              <th className="text-left p-2">Enviado em</th>
              <th className="text-left p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td className="p-2 text-gray-500" colSpan={5}>Nenhum anexo encontrado</td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.nome_arquivo || '-'}</td>
                <td className="p-2">{r.tipo_arquivo || '-'}</td>
                <td className="p-2">{typeof r.tamanho_bytes === 'number' ? `${r.tamanho_bytes} bytes` : '-'}</td>
                <td className="p-2">{r.criado_em ? new Date(r.criado_em).toLocaleString('pt-BR') : '-'}</td>
                <td className="p-2">
                  {r.signed_url ? (
                    <a href={r.signed_url} target="_blank" rel="noreferrer" className="text-blue-600 underline">Abrir</a>
                  ) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 mt-8 mb-3">
        <h2 className="text-lg font-semibold">Documentos</h2>
        <span className="text-sm text-gray-600">(view)</span>
        <select
          className="border rounded px-2 py-1 text-sm"
          value={selectedView}
          onChange={(e) => {
            const v = e.target.value
            const allowed = ['financeiro','fiscal','operacional','juridico','comercial','rh','contratos','outros'] as const
            if ((allowed as readonly string[]).includes(v)) {
              setSelectedView(v as typeof allowed[number])
            }
          }}
        >
          <option value="financeiro">Financeiro</option>
          <option value="fiscal">Fiscal</option>
          <option value="operacional">Operacional</option>
          <option value="juridico">Jurídico</option>
          <option value="comercial">Comercial</option>
          <option value="rh">RH</option>
          <option value="contratos">Contratos</option>
          <option value="outros">Outros</option>
        </select>
      </div>
      <div className="border rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left p-2">Documento ID</th>
              <th className="text-left p-2">Número</th>
              <th className="text-left p-2">Tipo</th>
              <th className="text-left p-2">Status</th>
              <th className="text-left p-2">Ações</th>
            </tr>
          </thead>
          <tbody>
            {docsLoading && (
              <tr><td className="p-2" colSpan={5}>Carregando…</td></tr>
            )}
            {!docsLoading && docs.length === 0 && (
              <tr><td className="p-2 text-gray-500" colSpan={5}>Nenhum documento</td></tr>
            )}
            {docs.map((d) => (
              <tr key={d.documento_id} className="border-t">
                <td className="p-2">{d.documento_id}</td>
                <td className="p-2">{d.numero || '-'}</td>
                <td className="p-2">{d.tipo_documento || '-'}</td>
                <td className="p-2">{d.status || '-'}</td>
                <td className="p-2">
                  <label className="inline-flex items-center gap-2 text-blue-600 underline cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0]
                        if (f) uploadForDocumento(d.documento_id, f)
                        e.currentTarget.value = ''
                      }}
                    />
                    <span>{rowUploadBusy === d.documento_id ? 'Enviando…' : 'Upload'}</span>
                  </label>
                  <button className="ml-3 text-blue-600 underline" onClick={() => openDocAnexos(d.documento_id)}>Ver anexos</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedDocForAnexos && (
        <div className="fixed inset-0 bg-black/30 flex justify-end z-50" onClick={() => setSelectedDocForAnexos(null)}>
          <div className="w-full max-w-md bg-white h-full shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">Anexos do Documento #{selectedDocForAnexos}</h3>
              <button className="text-gray-500" onClick={() => setSelectedDocForAnexos(null)}>Fechar</button>
            </div>
            <div className="p-4 overflow-auto h-[calc(100%-64px)]">
              {docAnexosLoading ? (
                <div>Carregando…</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left">
                      <th className="p-2">Arquivo</th>
                      <th className="p-2">Tipo</th>
                      <th className="p-2">Tamanho</th>
                      <th className="p-2">Data</th>
                      <th className="p-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docAnexos.length === 0 && (
                      <tr><td className="p-2 text-gray-500" colSpan={5}>Nenhum anexo</td></tr>
                    )}
                    {docAnexos.map((a) => (
                      <tr key={a.id} className="border-t">
                        <td className="p-2">{a.nome_arquivo || '-'}</td>
                        <td className="p-2">{a.tipo_arquivo || '-'}</td>
                        <td className="p-2">{typeof a.tamanho_bytes === 'number' ? `${a.tamanho_bytes} bytes` : '-'}</td>
                        <td className="p-2">{a.criado_em ? new Date(a.criado_em).toLocaleString('pt-BR') : '-'}</td>
                        <td className="p-2 flex items-center gap-3">
                          <button className="text-blue-600 underline" onClick={() => openAnexo(a.id)}>Abrir</button>
                          <button className="text-blue-600 underline" onClick={() => downloadAnexo(a.id)}>Baixar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabela completa documentos_anexos (teste) */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Tabela documentos_anexos (teste direto no DB)</h2>
          <button className="px-3 py-1 bg-gray-200 rounded" onClick={refreshAllAnexos} disabled={allAnexosLoading}>
            {allAnexosLoading ? 'Atualizando…' : 'Atualizar'}
          </button>
        </div>
        <div className="mb-3 grid grid-cols-1 md:grid-cols-2 gap-2">
          <input
            className="border rounded px-2 py-1 text-sm"
            placeholder="documento_id (número)"
            value={insertDocumentoId}
            onChange={(e) => setInsertDocumentoId(e.target.value)}
          />
          <input
            className="border rounded px-2 py-1 text-sm"
            placeholder="nome_arquivo (ex: arquivo.txt)"
            value={insertNomeArquivo}
            onChange={(e) => setInsertNomeArquivo(e.target.value)}
          />
          <input
            className="border rounded px-2 py-1 text-sm"
            placeholder="tipo_arquivo (ex: text/plain)"
            value={insertTipoArquivo}
            onChange={(e) => setInsertTipoArquivo(e.target.value)}
          />
          <input
            className="border rounded px-2 py-1 text-sm"
            placeholder="arquivo_url (ex: caminho/no/storage ou url)"
            value={insertArquivoUrl}
            onChange={(e) => setInsertArquivoUrl(e.target.value)}
          />
        </div>
        <div className="mb-3">
          <button
            className="px-3 py-1 bg-green-600 text-white rounded disabled:opacity-50"
            disabled={!(insertDocumentoId.trim() && insertNomeArquivo.trim() && insertTipoArquivo.trim() && insertArquivoUrl.trim())}
            onClick={async () => {
              try {
                setError(null)
                const documento_id = Number(insertDocumentoId.trim())
                if (!documento_id || Number.isNaN(documento_id)) {
                  throw new Error('documento_id inválido')
                }
                const res = await fetch('/api/documentos/anexos/insert-text', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    documento_id,
                    nome_arquivo: insertNomeArquivo.trim(),
                    tipo_arquivo: insertTipoArquivo.trim(),
                    arquivo_url: insertArquivoUrl.trim(),
                  })
                })
                const json = await res.json()
                if (!json?.success) throw new Error(json?.error || json?.message || 'Falha ao inserir')
                setInsertDocumentoId('')
                setInsertNomeArquivo('')
                setInsertTipoArquivo('')
                setInsertArquivoUrl('')
                await refreshAllAnexos()
              } catch (e) {
                setError(e instanceof Error ? e.message : 'Erro ao inserir em documentos_anexos')
              }
            }}
          >
            Inserir row completa
          </button>
        </div>
        <div className="border rounded overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2">ID</th>
                <th className="text-left p-2">Documento</th>
                <th className="text-left p-2">Nome</th>
                <th className="text-left p-2">Tipo</th>
                <th className="text-left p-2">Arquivo URL</th>
                <th className="text-left p-2">Tamanho</th>
                <th className="text-left p-2">Criado em</th>
              </tr>
            </thead>
            <tbody>
              {allAnexosLoading && (
                <tr><td className="p-2" colSpan={7}>Carregando…</td></tr>
              )}
              {!allAnexosLoading && allAnexos.length === 0 && (
                <tr><td className="p-2 text-gray-500" colSpan={7}>Nenhum registro</td></tr>
              )}
              {allAnexos.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{r.id}</td>
                  <td className="p-2">{r.documento_id != null ? String(r.documento_id) : '-'}</td>
                  <td className="p-2">{r.nome_arquivo || '-'}</td>
                  <td className="p-2">{r.tipo_arquivo || '-'}</td>
                  <td className="p-2">{r.arquivo_url || '-'}</td>
                  <td className="p-2">{typeof r.tamanho_bytes === 'number' ? `${r.tamanho_bytes} bytes` : '-'}</td>
                  <td className="p-2">{r.criado_em ? new Date(r.criado_em).toLocaleString('pt-BR') : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
