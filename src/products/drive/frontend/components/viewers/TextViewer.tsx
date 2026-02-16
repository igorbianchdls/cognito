import { useEffect, useState } from 'react'

const PREVIEW_CHAR_LIMIT = 200_000

export default function TextViewer({ url, name }: { url?: string; name?: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [content, setContent] = useState<string>('')
  const [truncated, setTruncated] = useState(false)

  useEffect(() => {
    if (!url) {
      setContent('')
      setError('Arquivo sem URL para preview')
      return
    }

    const controller = new AbortController()
    let cancelled = false

    const loadText = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(url, { signal: controller.signal })
        if (!res.ok) {
          throw new Error(`Falha ao carregar arquivo (${res.status})`)
        }
        const text = await res.text()
        if (cancelled) return

        const isTruncated = text.length > PREVIEW_CHAR_LIMIT
        setTruncated(isTruncated)
        setContent(isTruncated ? text.slice(0, PREVIEW_CHAR_LIMIT) : text)
      } catch (e) {
        if (cancelled) return
        const message = e instanceof Error ? e.message : 'Falha ao carregar conteúdo'
        setError(message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadText()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [url])

  return (
    <div className="max-h-[82vh] overflow-auto rounded-md bg-neutral-950 p-6 text-sm leading-relaxed text-neutral-200">
      {loading ? <div className="text-neutral-400">Carregando {name || 'arquivo'}...</div> : null}
      {!loading && error ? <div className="text-rose-300">{error}</div> : null}
      {!loading && !error ? (
        <>
          <pre className="whitespace-pre-wrap break-words font-mono text-[13px] leading-6">{content || 'Arquivo vazio'}</pre>
          {truncated ? (
            <div className="mt-3 text-xs text-neutral-400">
              Preview limitado aos primeiros {PREVIEW_CHAR_LIMIT.toLocaleString()} caracteres.
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
