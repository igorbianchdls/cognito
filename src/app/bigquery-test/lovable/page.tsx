'use client'

import { useMemo, useState } from 'react'
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'

type ChatMessage = { role: 'user' | 'assistant'; content: string }
type FileNode = { name: string; path: string; type: 'file' | 'dir'; children?: FileNode[] }

export default function LovableLikeStudioPage() {
  // Chat state (left)
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Bem-vindo! Descreva o site que deseja criar.' },
  ])
  const [input, setInput] = useState('')
  const [chatId, setChatId] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reasoningOpen, setReasoningOpen] = useState(false)
  const [reasoningText, setReasoningText] = useState('')
  const [toolsOpen, setToolsOpen] = useState(false)
  const [toolsLog, setToolsLog] = useState<string[]>([])

  // File system state (right) — from sandbox
  const [tree, setTree] = useState<FileNode[]>([])
  const [openDirs, setOpenDirs] = useState<Record<string, boolean>>({ '/vercel/sandbox': true })
  const [selectedPath, setSelectedPath] = useState('/vercel/sandbox/index.html')
  const [selectedContent, setSelectedContent] = useState('')
  const [previewContent, setPreviewContent] = useState('')
  const [viewTab, setViewTab] = useState<'editor' | 'preview'>('preview')
  const [fsError, setFsError] = useState<string | null>(null)

  const handleSend = async () => {
    const text = input.trim()
    if (!text) return
    if (!chatId) { setError('Inicie o chat antes de enviar mensagens.'); return }
    setSending(true)
    setError(null)
    const base = [...messages, { role: 'user' as const, content: text }]
    // placeholder assistant for streaming
    setMessages([...base, { role: 'assistant', content: '' }])
    const assistantIndex = base.length
    setReasoningOpen(false)
    setReasoningText('')
    setToolsOpen(false)
    setToolsLog([])
    setInput('')
    try {
      const res = await fetch('/api/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat-send-stream', chatId, history: base })
      })
      if (!res.ok || !res.body) {
        const txt = await res.text().catch(() => '')
        throw new Error(txt || `Erro ${res.status}`)
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      let sawFinal = false
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const frames = buf.split('\n\n')
        buf = frames.pop() || ''
        for (const f of frames) {
          const line = f.split('\n').find(l => l.startsWith('data: '))
          if (!line) continue
          const payload = line.slice(6)
          try {
            const evt = JSON.parse(payload) as { type?: string; text?: string; tool_name?: string; input?: any; output?: any; error?: string }
            if (evt.type === 'delta' && typeof evt.text === 'string') {
              setMessages(prev => {
                const copy = prev.slice()
                const cur = copy[assistantIndex]
                if (cur && cur.role === 'assistant') cur.content += evt.text
                return copy
              })
            } else if (evt.type === 'reasoning_start') {
              setReasoningOpen(true)
              setReasoningText('')
            } else if (evt.type === 'reasoning_delta' && typeof evt.text === 'string') {
              setReasoningOpen(true)
              setReasoningText(prev => prev + evt.text)
            } else if (evt.type === 'reasoning_end') {
              // no-op; keep panel open with accumulated text
            } else if (evt.type === 'tool_start') {
              setToolsOpen(true)
              const detail = formatToolEvent('start', evt)
              setToolsLog(prev => [...prev, detail])
            } else if (evt.type === 'tool_done') {
              setToolsOpen(true)
              const detail = formatToolEvent('done', evt)
              setToolsLog(prev => [...prev, detail])
              // refresh tree after write/edit
              await refreshDir('/vercel/sandbox')
            } else if (evt.type === 'tool_error') {
              setToolsOpen(true)
              const detail = formatToolEvent('error', evt)
              setToolsLog(prev => [...prev, detail])
            } else if (evt.type === 'final') {
              sawFinal = true
            }
          } catch { /* ignore non-JSON frames */ }
        }
      }
      // After stream ends, refresh tree/editor/preview so new files appear
      if (sawFinal) {
        await refreshDir('/vercel/sandbox')
        if (selectedPath) await openFile(selectedPath)
        await refreshPreview()
      }
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSending(false)
    }
  }

  const handleStart = async () => {
    setStarting(true)
    setError(null)
    try {
      const res = await fetch('/api/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat-start' })
      })
      const data = await res.json().catch(() => ({})) as { ok?: boolean; chatId?: string; error?: string }
      if (!res.ok || data.ok === false || !data.chatId) throw new Error(data.error || `Erro ${res.status}`)
      setChatId(data.chatId)
      setMessages([{ role: 'assistant', content: 'Sandbox iniciada. Pode enviar sua primeira mensagem!' }])
      // load root dir and try reading index.html for preview
      await refreshDir('/vercel/sandbox')
      await refreshPreview()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setStarting(false)
    }
  }

  const handleStop = async () => {
    if (!chatId) return
    setStarting(true)
    setError(null)
    try {
      await fetch('/api/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat-stop', chatId })
      })
      setChatId(null)
      setMessages(m => [...m, { role: 'assistant', content: 'Sandbox encerrada.' }])
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setStarting(false)
    }
  }

  const toggleDir = async (path: string) => {
    setOpenDirs(d => ({ ...d, [path]: !d[path] }))
    // lazy load children when opening
    if (!openDirs[path] && chatId) {
      await refreshDir(path)
    }
  }

  const refreshDir = async (dirPath: string) => {
    if (!chatId) return
    const res = await fetch('/api/sandbox', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'fs-list', chatId, path: dirPath }) })
    const data = await res.json().catch(() => ({})) as { ok?: boolean; entries?: Array<{ name:string; path:string; type:'file'|'dir' }>; error?: string }
    if (!res.ok || data.ok === false) { setFsError(data.error || `Falha ao listar ${dirPath}`); return }
    const ents = (data.entries ?? []).map(e => ({ name: e.name, path: e.path, type: e.type }))
    if (ents.length === 0) return
    setTree(prev => upsertChildren(prev, dirPath, ents))
  }

  const upsertChildren = (nodes: FileNode[], dirPath: string, children: FileNode[]): FileNode[] => {
    const recur = (arr: FileNode[]): FileNode[] => arr.map(n => {
      if (n.type === 'dir') {
        if (n.path === dirPath) {
          return { ...n, children }
        }
        if (n.children) return { ...n, children: recur(n.children) }
      }
      return n
    })
    // if dirPath is root and not present, create root node
    if (dirPath === '/vercel/sandbox' && nodes.length === 0) {
      return [{ name: 'sandbox', path: '/vercel/sandbox', type: 'dir', children }]
    }
    return recur(nodes)
  }

  const renderTree = (nodes: FileNode[], depth = 0) => (
    <ul className="space-y-0.5">
      {nodes.map(node => (
        <li key={node.path}>
          {node.type === 'dir' ? (
            <div>
              <button onClick={() => toggleDir(node.path)} className="w-full text-left px-2 py-1 rounded hover:bg-gray-100 flex items-center gap-1">
                <span className="text-gray-500">{openDirs[node.path] ? '▾' : '▸'}</span>
                <span className="font-medium">{node.name}</span>
              </button>
              {openDirs[node.path] && node.children && (
                <div className="pl-4">{renderTree(node.children, depth + 1)}</div>
              )}
            </div>
          ) : (
            <button onClick={() => openFile(node.path)} className={`w-full text-left px-2 py-1 rounded hover:bg-gray-100 ${selectedPath===node.path?'bg-blue-50 text-blue-700':'text-gray-800'}`}>
              {node.name}
            </button>
          )}
        </li>
      ))}
    </ul>
  )

  const refreshPreview = async () => {
    if (!chatId) return
    try {
      const res = await fetch('/api/sandbox', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'fs-read', chatId, path: '/vercel/sandbox/index.html' }) })
      const data = await res.json().catch(() => ({})) as { ok?: boolean; content?: string; error?: string }
      if (res.ok && data.ok && typeof data.content === 'string') {
        setPreviewContent(data.content)
      } else {
        // Fallback when index.html does not exist yet
        setPreviewContent(`<!doctype html><html><body style="margin:0;font-family:system-ui;padding:16px;background:#f8fafc;color:#334155"><div style="max-width:760px;margin:24px auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:16px"><h2 style="margin:0 0 8px">Sem index.html</h2><p style="margin:0">Crie <code>/vercel/sandbox/index.html</code> com o agente para visualizar aqui.</p></div></body></html>`)
      }
    } catch {
      // Ignore preview errors
      setPreviewContent('')
    }
  }

  const openFile = async (path: string) => {
    setSelectedPath(path)
    setViewTab('editor')
    if (!chatId) return
    try {
      const res = await fetch('/api/sandbox', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'fs-read', chatId, path }) })
      const data = await res.json().catch(() => ({})) as { ok?: boolean; content?: string; isBinary?: boolean; error?: string }
      if (res.ok && data.ok) {
        if (data.isBinary) setSelectedContent('[arquivo binário]')
        else if (typeof data.content === 'string') setSelectedContent(data.content)
      } else {
        setFsError(data.error || `Falha ao ler ${path}`)
      }
    } catch (e) {
      setFsError((e as Error).message)
    }
  }

  function formatToolEvent(kind: 'start'|'done'|'error', evt: { tool_name?: string; input?: any; output?: any; error?: string }) {
    const name = evt.tool_name || 'Tool'
    if (kind === 'start') {
      // Try to extract details for known tools
      if (name === 'Write' && evt.input && typeof evt.input === 'object') {
        const p = evt.input.file_path || evt.input.path || ''
        const size = typeof evt.input.content === 'string' ? evt.input.content.length : 0
        return `▶️ Write: criando ${p} (${size} bytes)`
      }
      if (name === 'Edit' && evt.input && typeof evt.input === 'object') {
        const p = evt.input.file_path || ''
        return `▶️ Edit: modificando ${p}`
      }
      if (name === 'Bash' && evt.input && evt.input.command) {
        return `▶️ Bash: ${evt.input.command}`
      }
      return `▶️ ${name}: iniciando`
    }
    if (kind === 'done') {
      if (name === 'Write' && evt.output && typeof evt.output === 'object') {
        const p = evt.output.filePath || evt.output.path || ''
        return `✅ Write: ${p} criado`}
      if (name === 'Edit') return `✅ Edit: concluído`
      if (name === 'Bash') return `✅ Bash: concluído`
      return `✅ ${name}: concluído`
    }
    // error
    const err = (evt.error || '').toString()
    return `❌ ${name}: ${err || 'erro'}`
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-50">
      <PanelGroup direction="horizontal">
        {/* Left: Chat */}
        <Panel defaultSize={40} minSize={25} className="h-full">
          <div className="h-full flex flex-col border-r border-gray-200 bg-white">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">Chat</h1>
                  <p className="text-xs text-gray-500">Descreva o site, peça mudanças, gere componentes…</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleStart} disabled={starting || !!chatId} className={`px-3 py-1.5 rounded text-white ${starting||chatId?'bg-gray-400':'bg-emerald-600 hover:bg-emerald-700'}`}>Iniciar chat</button>
                  <button onClick={handleStop} disabled={starting || !chatId} className={`px-3 py-1.5 rounded text-white ${starting||!chatId?'bg-gray-400':'bg-rose-600 hover:bg-rose-700'}`}>Encerrar chat</button>
                </div>
              </div>
              {chatId && (<div className="mt-1 text-xs text-gray-500">chatId: {chatId.slice(0,8)}…</div>)}
              {error && (<div className="mt-2 text-xs text-red-600">Erro: {error}</div>)}
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-3">
              {reasoningOpen && (
                <div className="p-2 border border-amber-300 bg-amber-50 rounded text-sm text-amber-900">
                  <div className="flex items-center justify-between mb-1">
                    <strong>Raciocínio</strong>
                    <button onClick={()=>setReasoningOpen(false)} className="text-xs text-amber-700 hover:underline">Ocultar</button>
                  </div>
                  <div className="whitespace-pre-wrap">{reasoningText || '…'}</div>
                </div>
              )}
              {toolsOpen && (
                <div className="p-2 border border-indigo-300 bg-indigo-50 rounded text-sm text-indigo-900">
                  <div className="flex items-center justify-between mb-1">
                    <strong>Ferramentas</strong>
                    <button onClick={()=>setToolsOpen(false)} className="text-xs text-indigo-700 hover:underline">Ocultar</button>
                  </div>
                  <div className="space-y-1 max-h-40 overflow-auto">
                    {toolsLog.length === 0 ? (
                      <div className="text-xs text-indigo-700">Aguardando eventos…</div>
                    ) : toolsLog.map((l, i)=> (
                      <div key={i} className="whitespace-pre-wrap break-all">{l}</div>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`max-w-[90%] rounded-lg px-3 py-2 ${m.role==='user'?'bg-blue-600 text-white ml-auto':'bg-gray-100 text-gray-900'}`}>
                  {m.content}
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-gray-200 flex gap-2">
              <input value={input} onChange={e=>setInput(e.target.value)} disabled={!chatId || sending} className="flex-1 px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder={chatId? 'Digite sua mensagem':'Inicie o chat para enviar'} />
              <button onClick={handleSend} disabled={!chatId || sending || !input.trim()} className={`px-4 py-2 rounded text-white ${(!chatId||sending)?'bg-gray-400':'bg-blue-600 hover:bg-blue-700'}`}>{sending? 'Transmitindo…':'Enviar (stream)'}</button>
            </div>
          </div>
        </Panel>
        <PanelResizeHandle className="w-1 bg-gray-200 hover:bg-gray-300 cursor-col-resize" />

        {/* Right: FS + Viewer */}
        <Panel defaultSize={60} minSize={35} className="h-full">
          <PanelGroup direction="horizontal">
            {/* File tree */}
            <Panel defaultSize={25} minSize={15} className="h-full">
              <div className="h-full bg-white border-r border-gray-200">
            <div className="px-3 py-2 border-b border-gray-200 text-sm font-medium text-gray-700 flex items-center justify-between">
              <span>Arquivos</span>
              <div className="flex items-center gap-2">
                <button onClick={()=>chatId && refreshDir('/vercel/sandbox')} className="px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs">Carregar árvore</button>
                {fsError && <span className="text-xs text-red-600">{fsError}</span>}
              </div>
            </div>
                <div className="p-2 overflow-auto h-[calc(100%-40px)]">
                  {tree.length === 0 ? (
                    <div className="text-xs text-gray-500">{chatId ? 'Carregue a lista de arquivos (Iniciar chat e o agente criará arquivos)':'Inicie o chat para carregar a árvore.'}</div>
                  ) : (
                    renderTree(tree)
                  )}
                </div>
              </div>
            </Panel>
            <PanelResizeHandle className="w-1 bg-gray-200 hover:bg-gray-300 cursor-col-resize" />
            {/* Editor/Preview */}
            <Panel defaultSize={75} minSize={25} className="h-full">
              <div className="h-full flex flex-col bg-white">
                <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600 truncate">{selectedPath}</div>
                  <div className="flex items-center gap-1">
                    <button onClick={()=>setViewTab('editor')} className={`px-3 py-1.5 rounded ${viewTab==='editor'?'bg-gray-900 text-white':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Editor</button>
                    <button onClick={()=>setViewTab('preview')} className={`px-3 py-1.5 rounded ${viewTab==='preview'?'bg-gray-900 text-white':'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Preview</button>
                    <button onClick={async ()=>{ if (chatId) await refreshDir('/vercel/sandbox'); if (selectedPath) await openFile(selectedPath); await refreshPreview() }} className="px-3 py-1.5 rounded bg-gray-100 text-gray-700 hover:bg-gray-200">Atualizar</button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto">
                  {viewTab === 'editor' ? (
                    <textarea value={selectedContent} readOnly className="w-full h-full p-3 font-mono text-sm text-gray-900 bg-white outline-none" />
                  ) : (
                    <iframe title="Preview" className="w-full h-full bg-white" srcDoc={previewContent} />
                  )}
                </div>
              </div>
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  )
}
