"use client"

import { useEffect, useState } from 'react'

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

export default function AnexosPage() {
  const [documentoId, setDocumentoId] = useState<string>('')
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<'upload' | 'create'>('create')
  const [nomeArquivo, setNomeArquivo] = useState<string>('documento.txt')
  const [tipoArquivo, setTipoArquivo] = useState<string>('text/plain')
  const [conteudo, setConteudo] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [rows, setRows] = useState<Anexo[]>([])
  const [error, setError] = useState<string | null>(null)

  const fetchList = async () => {
    if (!documentoId) { setRows([]); return }
    try {
      setLoading(true)
      const res = await fetch(`/api/bigquery-test/anexos/list?documento_id=${encodeURIComponent(documentoId)}`, { cache: 'no-store' })
      const json = await res.json()
      if (!json?.success) throw new Error(json?.message || 'Falha ao listar')
      setRows(Array.isArray(json.rows) ? json.rows : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao listar')
      setRows([])
    } finally { setLoading(false) }
  }

  useEffect(() => {
    fetchList().catch(() => {})
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentoId])

  const handleUpload = async (overrideFile?: File) => {
    const chosenFile = overrideFile ?? file
    if (!documentoId || !chosenFile) return
    try {
      setLoading(true)
      setError(null)
      const fd = new FormData()
      fd.set('documento_id', documentoId)
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

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-xl font-semibold mb-4">Anexos (bigquery-test)</h1>
      <div className="flex items-center gap-2 mb-4">
        <input
          className="border rounded px-2 py-1 text-sm"
          placeholder="Documento ID"
          value={documentoId}
          onChange={(e) => setDocumentoId(e.target.value)}
        />
        <div className="ml-2 flex items-center gap-2">
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
      </div>

      {mode === 'upload' ? (
        <div className="flex items-center gap-2 mb-4">
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <button
            className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50"
            onClick={() => handleUpload()}
            disabled={!documentoId || !file || loading}
          >
            {loading ? 'Enviando…' : 'Enviar Anexo'}
          </button>
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
              disabled={!documentoId || loading}
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
      <button
          className="px-3 py-1 bg-gray-200 rounded"
          onClick={() => fetchList()}
          disabled={!documentoId || loading}
        >
          Atualizar
        </button>
      
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
                    <a href={r.signed_url} target="_blank" rel="noreferrer" className="text-blue-600 underline">Baixar</a>
                  ) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
