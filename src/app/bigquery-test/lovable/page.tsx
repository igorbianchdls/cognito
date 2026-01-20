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

  // File system state (right)
  const initialTree: FileNode[] = useMemo(() => ([
    { name: 'public', path: '/public', type: 'dir', children: [
      { name: 'favicon.ico', path: '/public/favicon.ico', type: 'file' },
    ]},
    { name: 'index.html', path: '/index.html', type: 'file' },
    { name: 'styles.css', path: '/styles.css', type: 'file' },
    { name: 'main.js', path: '/main.js', type: 'file' },
  ]), [])
  const [selectedPath, setSelectedPath] = useState('/index.html')
  const [openDirs, setOpenDirs] = useState<Record<string, boolean>>({ '/public': true })
  const [viewTab, setViewTab] = useState<'editor' | 'preview'>('preview')

  // Mock file contents
  const [files, setFiles] = useState<Record<string, string>>({
    '/index.html': `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Meu Site</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <div class="container">
      <h1>Olá, mundo!</h1>
      <p>Este é um protótipo de UI "Lovable-like".</p>
      <button id="btn">Clique</button>
    </div>
    <script src="main.js"></script>
  </body>
  <style>
    /* inline fallback */ * { box-sizing: border-box; }
    body { margin:0; font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; background:#f8fafc; }
    .container { max-width: 720px; margin: 40px auto; padding: 24px; background:#fff; border:1px solid #e5e7eb; border-radius:12px; }
  </style>
</html>`,
    '/styles.css': `:root { --primary:#2563eb; }
body { color:#0f172a; }
button { background:var(--primary); color:white; padding:10px 14px; border:none; border-radius:8px; cursor:pointer; }
button:hover { filter:brightness(0.95); }`,
    '/main.js': `document.addEventListener('DOMContentLoaded',()=>{
  const btn=document.getElementById('btn');
  if(btn){ btn.addEventListener('click',()=> alert('Olá da sandbox de UI!')) }
});`,
    '/public/favicon.ico': '(binary)',
  })

  const selectedContent = files[selectedPath] ?? ''

  const handleSend = async () => {
    const text = input.trim()
    if (!text) return
    if (!chatId) { setError('Inicie o chat antes de enviar mensagens.'); return }
    setSending(true)
    setError(null)
    const next = [...messages, { role: 'user' as const, content: text }]
    setMessages(next)
    setInput('')
    try {
      const res = await fetch('/api/sandbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat-send', chatId, history: next })
      })
      const data = await res.json().catch(() => ({})) as { ok?: boolean; reply?: string; error?: string }
      if (!res.ok || data.ok === false) throw new Error(data.error || `Erro ${res.status}`)
      setMessages(m => [...m, { role: 'assistant', content: data.reply || '' }])
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

  const toggleDir = (path: string) => setOpenDirs(d => ({ ...d, [path]: !d[path] }))

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
            <button onClick={() => setSelectedPath(node.path)} className={`w-full text-left px-2 py-1 rounded hover:bg-gray-100 ${selectedPath===node.path?'bg-blue-50 text-blue-700':'text-gray-800'}`}>
              {node.name}
            </button>
          )}
        </li>
      ))}
    </ul>
  )

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
              {messages.map((m, i) => (
                <div key={i} className={`max-w-[90%] rounded-lg px-3 py-2 ${m.role==='user'?'bg-blue-600 text-white ml-auto':'bg-gray-100 text-gray-900'}`}>
                  {m.content}
                </div>
              ))}
            </div>
            <div className="p-3 border-t border-gray-200 flex gap-2">
              <input value={input} onChange={e=>setInput(e.target.value)} disabled={!chatId || sending} className="flex-1 px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder={chatId? 'Digite sua mensagem':'Inicie o chat para enviar'} />
              <button onClick={handleSend} disabled={!chatId || sending || !input.trim()} className={`px-4 py-2 rounded text-white ${(!chatId||sending)?'bg-gray-400':'bg-blue-600 hover:bg-blue-700'}`}>{sending? 'Enviando…':'Enviar'}</button>
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
                <div className="px-3 py-2 border-b border-gray-200 text-sm font-medium text-gray-700">Arquivos</div>
                <div className="p-2 overflow-auto h-[calc(100%-40px)]">
                  {renderTree(initialTree)}
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
                  </div>
                </div>
                <div className="flex-1 overflow-auto">
                  {viewTab === 'editor' ? (
                    <textarea value={selectedContent} readOnly className="w-full h-full p-3 font-mono text-sm text-gray-900 bg-white outline-none" />
                  ) : (
                    <iframe title="Preview" className="w-full h-full bg-white" srcDoc={files['/index.html']} />
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
