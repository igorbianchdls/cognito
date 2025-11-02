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

  const handleUpload = async () => {
    if (!documentoId || !file) return
    try {
      setLoading(true)
      setError(null)
      const fd = new FormData()
      fd.set('documento_id', documentoId)
      fd.set('file', file)
      const res = await fetch('/api/bigquery-test/anexos/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!json?.success) throw new Error(json?.message || 'Falha no upload')
      setFile(null)
      await fetchList()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao enviar')
    } finally { setLoading(false) }
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
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <button
          className="px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-50"
          onClick={handleUpload}
          disabled={!documentoId || !file || loading}
        >
          {loading ? 'Enviando…' : 'Enviar Anexo'}
        </button>
        <button
          className="px-3 py-1 bg-gray-200 rounded"
          onClick={() => fetchList()}
          disabled={!documentoId || loading}
        >
          Atualizar
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

